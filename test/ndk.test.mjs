import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdtemp, symlink, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { extractCommands, inventory } from '../scripts/inventory.mjs';

const root = resolve(import.meta.dirname, '..');
const sources = [
  { component: 'ngx_devel_kit', revision: '91e30eb05085e7f9762f130cbb883a0e753cf74d', tag: 'v0.3.3', version: '0.3.3',
    registration_inputs: [{ file: 'objs/ndk_config.c', owner_file: 'src/ndk.c', includes: { 'ndk_upstream_list.h': 'src/ndk_upstream_list.h' } }] },
  { component: 'set-misc-nginx-module', revision: '31c4ad67bb9e392a734e4e58ea8048e24012311f', tag: 'v0.33', version: '0.33',
    registration_inputs: [{ file: 'src/ngx_http_set_misc_module.c' }] },
  { component: 'array-var-nginx-module', revision: '32188f86599b47f7cd34340e5a2985bd9d550bf8', tag: 'v0.06', version: '0.06',
    registration_inputs: [{ file: 'src/ngx_http_array_var_module.c' }] },
  { component: 'form-input-nginx-module', revision: '43ee690c359c06af7d178379cfc37ebc858d9de2', tag: 'v0.12', version: '0.12',
    registration_inputs: [{ file: 'src/ngx_http_form_input_module.c' }] }
];
const frozen = (source, file) => execFileSync('git', ['-C', resolve(root, 'repos', source.component), 'show', `${source.revision}:${file}`], { encoding: 'utf8' });
const ndk = sources[0];
const container = frozen(ndk, 'objs/ndk_config.c');
const owner = frozen(ndk, 'src/ndk.c');
const fragment = frozen(ndk, 'src/ndk_upstream_list.h');
const ndkInput = () => ({ owner_file: 'src/ndk.c', owner_original: owner,
  includes: { 'ndk_upstream_list.h': { file: 'src/ndk_upstream_list.h', original: fragment } } });

test('四组件固定正式原文：29/4/2 字面注册及 1 个跨文件条件片段', () => {
  const expectedNames = [
    ['upstream_list'],
    ['set_encode_base64', 'set_decode_base64', 'set_encode_base64url', 'set_decode_base64url', 'set_decode_hex', 'set_encode_hex',
      'set_hmac_sha1', 'set_hmac_sha256', 'set_md5', 'set_sha1', 'set_unescape_uri', 'set_escape_uri', 'set_quote_sql_str',
      'set_quote_pgsql_str', 'set_quote_json_str', 'set_if_empty', 'set_hashed_upstream', 'set_misc_base32_padding', 'set_base32_padding',
      'set_base32_alphabet', 'set_encode_base32', 'set_decode_base32', 'set_local_today', 'set_formatted_gmt_time',
      'set_formatted_local_time', 'set_random', 'set_secure_random_alphanum', 'set_secure_random_lcalpha', 'set_rotate'],
    ['array_split', 'array_map', 'array_map_op', 'array_join'],
    ['set_form_input', 'set_form_input_multi']
  ];
  for (const [index, source] of sources.entries()) {
    const file = source.registration_inputs[0].file;
    const original = frozen(source, file);
    const records = extractCommands(original, file, source.component, index === 0 ? ndkInput() : {});
    assert.deepEqual(records.map(record => record.name), expectedNames[index]);
    for (const record of records) {
      assert.equal(record.module_verified, true);
      assert.equal(record.verification, 'registration_only');
      const raw = frozen(source, record.file).split('\n').slice(record.line - 1, record.end_line).join('\n');
      assert.match(raw, new RegExp(`ngx_string\\s*\\(\\s*"${record.name}"\\s*\\)`));
      assert.ok(record.flags && record.callback && record.post);
      for (const evidence of record.registration_evidence) {
        assert.match(evidence.id, /^[a-z][a-z0-9-]+$/);
        assert.ok(evidence.start_line > 0 && evidence.end_line >= evidence.start_line);
        assert.ok(evidence.end_line <= frozen(source, evidence.file).split('\n').length);
      }
    }
    if (index === 1) {
      assert.equal(records.find(record => record.name === 'set_misc_base32_padding').post, '&ngx_conf_deprecated_set_misc_base32_padding');
      assert.deepEqual(records.find(record => record.name === 'set_hmac_sha1').compile_guards, ['if NGX_OPENSSL']);
      assert.deepEqual(records.find(record => record.name === 'set_sha1').compile_guards, ['ifndef NGX_HTTP_SET_HASH', 'if NGX_HAVE_SHA1']);
      assert.equal(records.find(record => record.name === 'set_encode_base64').callback, 'ndk_set_var_value');
    }
  }
});

test('NDK 原始片段、owner、容器证据和临时定义均保留真实坐标', () => {
  const [record] = extractCommands(container, 'objs/ndk_config.c', ndk.component, ndkInput());
  assert.deepEqual({ name: record.name, module: record.module, file: record.file, line: record.line, end_line: record.end_line,
    module_file: record.module_file, module_line: record.module_line, flags: record.flags, callback: record.callback, post: record.post },
  { name: 'upstream_list', module: 'ndk_http_module', file: 'src/ndk_upstream_list.h', line: 6, end_line: 13,
    module_file: 'src/ndk.c', module_line: 102, flags: 'NGX_HTTP_MAIN_CONF|NGX_HTTP_SRV_CONF|NGX_CONF_2MORE', callback: 'ndk_upstream_list', post: 'NULL' });
  assert.deepEqual(record.context_flags, ['NGX_HTTP_MAIN_CONF', 'NGX_HTTP_SRV_CONF']);
  assert.deepEqual(record.compile_guards, ['if (NDK_UPSTREAM_LIST)', 'if (NDK_UPSTREAM_LIST_CMDS)']);
  assert.deepEqual(record.registration_defines, [{ name: 'NDK_UPSTREAM_LIST_CMDS', value: '1', file: 'objs/ndk_config.c', line: 67, temporary: true }]);
  assert.deepEqual(record.registration_evidence.find(item => item.id === 'registration-container'),
    { id: 'registration-container', file: 'objs/ndk_config.c', start_line: 65, end_line: 72 });
  assert.deepEqual(record.registration_evidence.find(item => item.id === 'owner-include'),
    { id: 'owner-include', file: 'src/ndk.c', start_line: 8, end_line: 8 });
  const moduleEvidence = record.registration_evidence.find(item => item.id === 'module-owner');
  assert.equal(moduleEvidence.start_line, 102);
  assert.match(owner.split('\n').slice(moduleEvidence.start_line - 1, moduleEvidence.end_line).join('\n'), /ndk_http_commands/);
  assert.match(frozen(sources[1], 'config'), /-DNDK_SET_VAR -DNDK_UPSTREAM_LIST/);
  assert.match(frozen(ndk, 'auto/data/modules_optional'), /^upstream_list\s+\*$/m);
  assert.match(frozen(ndk, 'auto/build'), /function generate_commands/);
});

test('未知宏、名称表达式、include 与断开的跨文件 owner 必须拒绝', () => {
  for (const mutate of [
    text => text.replace('    ngx_null_command', '    UNKNOWN_COMMAND("unknown"),\n    ngx_null_command'),
    text => text.replace('#include  <ndk_upstream_list.h>', '#include <unknown.h>'),
    text => text.replace('#define NDK_UPSTREAM_LIST_CMDS 1', '#define NDK_UPSTREAM_LIST_CMDS UNKNOWN_VALUE'),
    text => text.replace('#undef  NDK_UPSTREAM_LIST_CMDS', '#undef OTHER_MACRO')
  ]) assert.throws(() => extractCommands(mutate(container), 'objs/ndk_config.c', ndk.component, ndkInput()), /未支持|未配置/);
  for (const brokenOwner of [
    owner.replace('ndk_http_commands,', 'other_commands,'),
    owner.replace('#include    <ndk_config.c>', '#include <other_config.c>'),
    owner.replace('&ndk_http_module_ctx,', 'ndk_http_commands,').replace('ndk_http_commands,             ', 'NULL,             ')
  ]) assert.throws(() => extractCommands(container, 'objs/ndk_config.c', ndk.component, { ...ndkInput(), owner_original: brokenOwner }), /owner|注册容器/);
  const input = ndkInput();
  input.includes['unused.h'] = { file: 'src/unused.h', original: fragment };
  assert.throws(() => extractCommands(container, 'objs/ndk_config.c', ndk.component, input), /未消费/);
  const badFragment = ndkInput();
  badFragment.includes['ndk_upstream_list.h'].original = fragment.replace('ngx_string ("upstream_list")', 'ngx_string (UNKNOWN_NAME)');
  assert.throws(() => extractCommands(container, 'objs/ndk_config.c', ndk.component, badFragment), /未支持的命令名称表达式/);
  badFragment.includes['ndk_upstream_list.h'].original = fragment.replace('#if (NDK_UPSTREAM_LIST_CMDS)', '#if (OTHER_MACRO)');
  assert.throws(() => extractCommands(container, 'objs/ndk_config.c', ndk.component, badFragment), /片段条件结构/);
  assert.throws(() => extractCommands(container, 'objs/ndk_config.c', ndk.component), /include/);
  const misc = frozen(sources[1], sources[1].registration_inputs[0].file);
  assert.throws(() => extractCommands(misc.replace('ngx_string ("set_encode_base64")', 'NAME_MACRO("set_encode_base64")'), 'misc.c', 'set-misc'), /未支持的命令名称表达式/);
  assert.throws(() => extractCommands(misc.replace('        ndk_set_var_value,', '#include <unknown.h>\n        ndk_set_var_value,'), 'misc.c', 'set-misc'), /未支持的 include/);
  assert.throws(() => extractCommands(misc.replace('NGX_CONF_TAKE12', 'UNKNOWN_FLAG(1)'), 'misc.c', 'set-misc', {}), /未支持的命令标志表达式/);
});

test('实际 inventory 仅消费冻结正式输入，排除 examples 并拒绝缺失、重复和未消费输入', async () => {
  const taskDir = await mkdtemp(join(tmpdir(), 'knowledge-ndk-inputs-'));
  try {
    await symlink(resolve(root, 'openresty'), join(taskDir, 'openresty'));
    for (const source of sources.slice(1)) await symlink(resolve(root, 'repos', source.component), join(taskDir, source.component));
    execFileSync('git', ['clone', '--local', resolve(root, 'repos', ndk.component), join(taskDir, ndk.component)], { stdio: 'pipe' });
    const repo = join(taskDir, ndk.component);
    await writeFile(join(repo, 'src/ndk.c'), '污染 owner 工作树\n');
    await rm(join(repo, 'objs/ndk_config.c'));
    await writeFile(join(repo, 'src/ndk_upstream_list.h'), '污染片段工作树\n');
    await writeFile(join(repo, 'untracked.c'), frozen(ndk, 'examples/http/set_var/ngx_http_set_var_examples_module.c'));
    const config = { openresty_version: '1.27.1.1', main_repo: 'openresty', analysis_dir: 'analysis',
      sources: sources.map(({ revision, ...source }) => ({ ...source, path: source.component, role: 'nginx-module' })) };
    const configPath = join(taskDir, 'project.config.json');
    await writeFile(configPath, JSON.stringify(config));
    await inventory(configPath);
    const before = await readFile(join(taskDir, 'analysis/directives/catalog.json'), 'utf8');
    const records = JSON.parse(before).directives;
    assert.equal(records.length, 36);
    assert.ok(records.every(record => record.module_verified && record.verification === 'registration_only'));
    assert.ok(!records.some(record => ['set_concat2', 'set_prepend_hello', 'array_it'].includes(record.name)));
    assert.deepEqual(records.filter(record => record.component === ndk.component).map(record => record.revision), [ndk.revision]);
    const matrix = JSON.parse(await readFile(join(taskDir, 'analysis/components.json'), 'utf8')).components;
    assert.equal(matrix.filter(item => item.inspection === 'fixed_registration_inputs').length, 4);
    assert.deepEqual(matrix.find(item => item.component === ndk.component).scanned_files,
      ['objs/ndk_config.c', 'src/ndk.c', 'src/ndk_upstream_list.h']);
    for (const mutate of [
      input => { input.registration_inputs = []; },
      input => { input.registration_inputs[0].file = 'missing.c'; },
      input => { input.registration_inputs.push(structuredClone(input.registration_inputs[0])); },
      input => { input.registration_inputs[0].owner_file = 'src/../src/ndk.c'; },
      input => { input.registration_inputs[0].includes = {}; },
      input => { input.registration_inputs[0].includes['ndk_set_var.h'] = 'src/ndk_set_var.h'; },
      input => { input.registration_inputs[0].includes['unknown.h'] = 'src/ndk_upstream_list.h'; },
      input => { input.registration_inputs[0].includes['ndk_upstream_list.h'] = 'missing/ndk_upstream_list.h'; },
      input => { input.registration_inputs[0].includes['ndk_upstream_list.h'] = 1; },
      input => { input.registration_inputs[0].owner_file = 'examples/http/set_var/ngx_http_set_var_examples_module.c'; }
    ]) {
      const broken = structuredClone(config);
      mutate(broken.sources[0]);
      await writeFile(configPath, JSON.stringify(broken));
      await assert.rejects(inventory(configPath), /输入|include|owner/);
      assert.equal(await readFile(join(taskDir, 'analysis/directives/catalog.json'), 'utf8'), before);
    }
  } finally {
    // 仅清理本测试创建的隔离目录，原仓库保持不变。
    await rm(taskDir, { recursive: true, force: true });
  }
});

test('全项目隔离盘点合并新来源，已有注册内容保持不变', async () => {
  const taskDir = await mkdtemp(join(tmpdir(), 'knowledge-ndk-merge-'));
  try {
    const config = JSON.parse(await readFile(join(root, 'project.config.json'), 'utf8'));
    config.department_extensions = [];
    const later = JSON.parse(await readFile(join(root, 'analysis/REMAINING_SOURCE_PROVENANCE.json'), 'utf8'));
    const laterComponents = new Set(later.sources.map(source => source.component));
    config.sources = config.sources.filter(source => !laterComponents.has(source.component));
    delete config.nginx_patch_audit;
    delete config.redis_patch_audit;
    config.main_repo = resolve(root, config.main_repo);
    config.component_scope_file = resolve(root, config.component_scope_file);
    for (const source of config.sources) source.path = resolve(root, source.path);
    for (const source of sources) {
      if (!config.sources.some(item => item.component === source.component)) {
        const { revision, ...entry } = source;
        config.sources.push({ ...entry, path: resolve(root, 'repos', source.component), role: 'nginx-module' });
      }
    }
    config.analysis_dir = 'analysis';
    const configPath = join(taskDir, 'project.config.json');
    const oldCatalog = JSON.parse(await readFile(join(root, 'analysis/directives/catalog.json'), 'utf8'));
    await writeFile(configPath, JSON.stringify(config));
    await inventory(configPath);
    const catalog = JSON.parse(await readFile(join(taskDir, 'analysis/directives/catalog.json'), 'utf8'));
    const newComponents = new Set(sources.map(source => source.component));
    const legacy = catalog.directives.filter(record => !newComponents.has(record.component));
    const expected = oldCatalog.directives.filter(record => !newComponents.has(record.component)
      && !laterComponents.has(record.component) && !record.distribution_patch && record.source?.kind !== 'department_extension');
    assert.equal(legacy.length, 913);
    assert.equal(catalog.directives.length, 949);
    for (const record of legacy) {
      const original = expected.find(item => item.component === record.component && item.module === record.module && item.name === record.name);
      assert.deepEqual({ ...record, local_path: original?.local_path }, original);
    }
  } finally {
    // 全项目检查也只清理自身隔离产物，不写正式目录。
    await rm(taskDir, { recursive: true, force: true });
  }
});
