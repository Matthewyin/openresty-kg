import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, symlink, cp, mkdtemp, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { nginxPatchRegistrations, registrationChanges, redisPatchScope } from '../scripts/distribution-registrations.mjs';
import { build } from '../scripts/build.mjs';

const root = resolve(import.meta.dirname, '..');
const original = JSON.parse(await readFile(join(root, 'project.config.json'), 'utf8'));
const show = (repo, revision, file) => execFileSync('git', ['-C', repo, 'show', `${revision}:${file}`], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });

test('真实盘点命令行完成模块加载并输出包含发行补丁的完整目录', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'inventory-cli-'));
  try {
    const config = { ...original, main_repo: resolve(root, original.main_repo), analysis_dir: 'candidate',
      department_extensions: [],
      component_scope_file: resolve(root, original.component_scope_file),
      nginx_patch_audit: resolve(root, original.nginx_patch_audit),
      redis_patch_audit: resolve(root, original.redis_patch_audit),
      sources: original.sources.map(source => ({ ...source, path: resolve(root, source.path),
        ...(source.archive_evidence ? { archive_evidence: { ...source.archive_evidence, path: resolve(root, source.archive_evidence.path) } } : {}) })) };
    const configPath = join(directory, 'project.config.json');
    await writeFile(configPath, JSON.stringify(config));
    const output = execFileSync(process.execPath, [join(root, 'scripts/inventory.mjs'), '--config', configPath],
      { encoding: 'utf8', timeout: 60000 });
    const result = JSON.parse(output);
    const catalog = JSON.parse(await readFile(join(directory, 'candidate/directives/catalog.json'), 'utf8'));
    assert.equal(result.registrations, catalog.directives.length);
    assert.equal(result.inspected, result.components);
    assert.equal(result.scope_complete, true);
    const matrix = JSON.parse(await readFile(join(directory, 'candidate/components.json'), 'utf8'));
    assert.equal(matrix.scope_complete, true);
    const built = matrix.components.filter(item => item.registration_build);
    assert.equal(built.length, original.sources.filter(source => source.registration_build).length);
    assert.ok(built.every(item => item.inspection === 'fixed_registration_build_review'
      && item.registration_build.complete && item.registration_build.status === 'verified'));
    for (const component of built) assert.deepEqual(component.registration_build.registrations.map(item => [item.module, item.name]).sort(),
      catalog.directives.filter(item => item.component === component.component && !item.distribution_patch).map(item => [item.module, item.name]).sort());
    assert.deepEqual(catalog.directives.filter(item => item.distribution_patch).map(item => item.name).sort(),
      ['log_escape_non_ascii', 'no_error_pages']);
    assert.ok(catalog.directives.some(item => item.component === 'redis-nginx-module'));
    const before = await readFile(join(directory, 'candidate/components.json'), 'utf8');
    const bad = structuredClone(config);
    bad.sources.find(source => source.component === 'echo-nginx-module').registration_build.entry = 'unknown-config';
    await writeFile(configPath, JSON.stringify(bad));
    assert.throws(() => execFileSync(process.execPath, [join(root, 'scripts/inventory.mjs'), '--config', configPath],
      { encoding: 'utf8', timeout: 30000, stdio: 'pipe' }), /未支持的正式入口/);
    assert.equal(await readFile(join(directory, 'candidate/components.json'), 'utf8'), before);
    assert.deepEqual(JSON.parse(await readFile(join(directory, 'candidate/directives/catalog.json'), 'utf8')), catalog);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('实际发行补丁回放核实新增注册集合及真实补丁坐标，不更改旧注册字段', async () => {
  const config = { ...original, nginx_patch_audit: 'analysis/NGINX_PATCH_AUDIT.json' };
  const existingDirectives = JSON.parse(await readFile(join(root, 'analysis/directives/catalog.json'), 'utf8')).directives
    .filter(record => record.component === 'nginx' && !record.distribution_patch);
  const result = await nginxPatchRegistrations({ root, config, configPath: join(root, 'project.config.json'), show,
    existingDirectives,
    mainRevision: execFileSync('git', ['-C', join(root, config.main_repo), 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() });
  assert.deepEqual(result.directives.map(record => record.name).sort(), ['log_escape_non_ascii', 'no_error_pages']);
  assert.equal(result.scope.patches.length, 34);
  assert.deepEqual(result.scope.removed, []);
  assert.deepEqual(result.scope.changed, []);
  for (const record of result.directives) {
    assert.equal(record.registration_component, 'openresty');
    assert.equal(record.module_verified, true);
    assert.equal(record.verification, 'registration_only');
    const code = show(join(root, config.main_repo), result.scope.openresty_revision, record.file)
      .split('\n').slice(record.line - 1, record.end_line).join('\n');
    assert.match(code, new RegExp(`ngx_string\\("${record.name}"\\)`));
    assert.ok(code.split('\n').every(line => line.startsWith('+')));
    const owner = record.registration_evidence[0];
    const ownerCode = show(join(root, 'repos/nginx'), record.revision, owner.file)
      .split('\n').slice(owner.start_line - 1, owner.end_line).join('\n');
    assert.match(ownerCode, new RegExp(`ngx_module_t\\s+${record.module}\\s*=`));
    assert.ok(ownerCode.includes(record.array));
    assert.match(record.distribution_patch.patched_sha256, /^[a-f0-9]{64}$/);
  }
});

test('补丁注册比较拒绝配置层偏移、成员偏移变化及同模块重复身份', () => {
  const entry = '{ ngx_string("probe"), NGX_HTTP_LOC_CONF|NGX_CONF_TAKE1, handler, NGX_HTTP_LOC_CONF_OFFSET, offsetof(conf_t, first), NULL }';
  const source = entries => `ngx_command_t probe_commands[] = {\n${entries},\nngx_null_command\n};\nngx_module_t probe_module = { NGX_MODULE_V1, NULL, probe_commands };`;
  const before = source(entry);
  for (const after of [source(entry.replace('NGX_HTTP_LOC_CONF_OFFSET', 'NGX_HTTP_MAIN_CONF_OFFSET')),
    source(entry.replace('conf_t, first', 'conf_t, second'))]) assert.throws(() => registrationChanges(before, after, 'probe.c', 'nginx'), /字段变化/);
  assert.throws(() => registrationChanges(before, source(`${entry},\n${entry}`), 'probe.c', 'nginx'), /重复注册/);
  assert.deepEqual(registrationChanges(before, before, 'probe.c', 'nginx').added, []);
});

test('Redis 三项补丁实际回放保持注册，错误匹配、目标摘要和发行链拒绝', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'redis-patch-gate-'));
  try {
    const config = { ...original, redis_patch_audit: join(directory, 'audit.json') };
    const audit = JSON.parse(await readFile(join(root, original.redis_patch_audit), 'utf8'));
    const mainRevision = execFileSync('git', ['-C', join(root, config.main_repo), 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    await writeFile(config.redis_patch_audit, JSON.stringify(audit));
    const scope = await redisPatchScope({ root, config, show, mainRevision });
    assert.equal(scope.patches.length, 3);
    assert.deepEqual([scope.added, scope.removed, scope.changed], [[], [], []]);
    assert.equal(scope.patches[1].hunks[0].offset, 2);
    for (const mutate of [
      value => { value.patches[1].hunks[0].offset = 0; },
      value => { value.patches[0].hunks.pop(); },
      value => { value.targets[0].sha256 = '0'.repeat(64); },
      value => { value.patches.reverse(); },
      value => { value.processing.end_line = 706; },
      value => { value.processing.end_line = 710; },
      value => { value.revision = '0'.repeat(40); },
    ]) {
      const broken = structuredClone(audit); mutate(broken);
      await writeFile(config.redis_patch_audit, JSON.stringify(broken));
      await assert.rejects(redisPatchScope({ root, config, show, mainRevision }), /Redis|发行处理链/);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('显式跨组件配置回调只接纳真实函数定义，错误来源拒绝且保留当前发布', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'knowledge-callback-source-'));
  try {
    const config = { ...original, main_repo: resolve(root, original.main_repo), analysis_dir: 'analysis', output_dir: 'dist',
      knowledge_file: 'knowledge.json', references_file: undefined, department_extensions: [],
      sources: original.sources.map(source => ({ ...source, path: resolve(root, source.path) })) };
    for (const name of ['site', 'src']) await cp(join(root, name), join(directory, name), { recursive: true });
    await symlink(join(root, 'repos'), join(directory, 'repos'));
    await mkdir(join(directory, 'analysis/directives'), { recursive: true });
    const matrix = JSON.parse(await readFile(join(root, original.analysis_dir, 'components.json'), 'utf8'));
    // 该夹具只核单项配置入口，不代表完整注册目录。
    matrix.scope_complete = false;
    matrix.components = matrix.components.filter(component => component.component === 'ngx_devel_kit');
    matrix.department_extensions = { scope_complete: true, components: [] };
    config.sources = config.sources.filter(source => matrix.components.some(item => item.component === source.component && item.local_path));
    await writeFile(join(directory, 'analysis/components.json'), JSON.stringify(matrix));
    const catalog = JSON.parse(await readFile(join(root, original.analysis_dir, 'directives/catalog.json'), 'utf8'));
    catalog.directives = catalog.directives.filter(record => record.component === 'ngx_devel_kit');
    assert.equal(catalog.directives.length, 1);
    await writeFile(join(directory, 'analysis/directives/catalog.json'), JSON.stringify(catalog));
    const input = [{ component: 'ngx_devel_kit', module: 'ndk_http_module', name: 'upstream_list',
      summary: '测试夹具，不用于实际知识发布。', syntax: 'upstream_list name upstream ...;', evidence: [],
      callback_definition: { component: 'ngx_devel_kit', file: 'src/ndk_upstream_list.c', start_line: 59, end_line: 97 },
      patch_status: { status: 'verified_unaffected', note: '仅测试来源接入，不作为语义研究结论。', source_ids: ['registration'] } }];
    const configPath = join(directory, 'project.config.json');
    await writeFile(configPath, JSON.stringify(config));
    await writeFile(join(directory, 'knowledge.json'), JSON.stringify(input));
    await build(configPath);
    const indexPath = join(directory, 'dist/knowledge/index.json');
    const before = await readFile(indexPath, 'utf8');
    const index = JSON.parse(before);
    const detail = JSON.parse(await readFile(join(directory, 'dist/knowledge', index.directives[0].detail_path), 'utf8'));
    assert.equal(detail.verification, 'basic_verified');
    assert.ok(detail.sources.some(source => source.id === 'configuration-definition' && source.component === 'ngx_devel_kit'));
    for (const mutate of [
      value => { value.callback_definition.file = 'src/ndk_set_var.c'; value.callback_definition.start_line = 574; value.callback_definition.end_line = 588; },
      value => { value.callback_definition.end_line = 59; },
      value => { value.callback_definition.component = 'unknown'; },
      value => { value.callback_definition.file = '../outside.c'; },
    ]) {
      const broken = structuredClone(input);
      mutate(broken[0]);
      await writeFile(join(directory, 'knowledge.json'), JSON.stringify(broken));
      await assert.rejects(build(configPath), /函数定义|源码位置|源码范围/);
      assert.equal(await readFile(indexPath, 'utf8'), before);
    }
  } finally {
    // 夹具仅在隔离目录创建，结束后清理。
    await rm(directory, { recursive: true, force: true });
  }
});
