import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { extractCommands, inventory } from '../scripts/inventory.mjs';

const root = resolve(import.meta.dirname, '..');
const provenance = JSON.parse(await readFile(join(root, 'analysis/REMAINING_SOURCE_PROVENANCE.json'), 'utf8'));
const archivePath = join(root, 'analysis/source-archives/ngx_http_redis-0.3.9.tar.gz');
const entry = (id, file, start_line, end_line, component) => ({ id, file, start_line, end_line, ...(component ? { component } : {}) });
const reviews = {
  'lua-upstream-nginx-module': { classification: 'nginx_lua_api_module', evidence: [
    entry('build-entry', 'config', 1, 16), entry('module-owner', 'src/ngx_http_lua_upstream_module.c', 52, 65), entry('api-entry', 'src/ngx_http_lua_upstream_module.c', 68, 105)] },
  'lua-cjson': { classification: 'lua_c_extension', evidence: [
    entry('build-entry', 'Makefile', 14, 107), entry('installation', 'Makefile', 104, 108), entry('api-entry', 'lua_cjson.c', 1659, 1679)] },
  'lua-redis-parser': { classification: 'lua_c_extension', evidence: [
    entry('build-entry', 'Makefile', 13, 41), entry('installation', 'Makefile', 43, 45), entry('api-entry', 'redis-parser.c', 65, 100)] },
  'lua-rds-parser': { classification: 'lua_c_extension', evidence: [
    entry('build-entry', 'Makefile', 13, 41), entry('installation', 'Makefile', 43, 45), entry('api-entry', 'src/rds_parser.c', 34, 52)] },
  'lua-resty-signal': { classification: 'lua_ffi_library', evidence: [
    entry('build-entry', 'Makefile', 10, 34), entry('installation', 'Makefile', 40, 43), entry('api-entry', 'lib/resty/signal.lua', 21, 67), entry('native-entry', 'resty_signal.c', 40, 49)] },
  'resty-cli': { classification: 'cli_tool', evidence: [
    entry('distribution-install', 'util/configure', 1155, 1166, 'openresty'), entry('cli-entry', 'bin/resty', 1, 26)] },
  opm: { classification: 'cli_tool', evidence: [
    entry('distribution-install', 'util/configure', 1140, 1153, 'openresty'), entry('cli-entry', 'bin/opm', 1, 19)] }
};
const moduleFiles = {
  'rds-json-nginx-module': 'src/ngx_http_rds_json_filter_module.c',
  'rds-csv-nginx-module': 'src/ngx_http_rds_csv_filter_module.c',
  'drizzle-nginx-module': 'src/ngx_http_drizzle_module.c',
  'iconv-nginx-module': 'src/ngx_http_iconv_module.c',
  'encrypted-session-nginx-module': 'src/ngx_http_encrypted_session_module.c',
  'redis-nginx-module': 'ngx_http_redis_module.c',
  ngx_postgres: 'src/ngx_postgres_module.c',
  ngx_coolkit: 'src/ngx_coolkit_module.c',
  'redis2-nginx-module': 'src/ngx_http_redis2_module.c'
};
const names = {
  'rds-json-nginx-module': ['rds_json', 'rds_json_root', 'rds_json_success_property', 'rds_json_user_property', 'rds_json_errcode_key', 'rds_json_errstr_key', 'rds_json_format', 'rds_json_content_type', 'rds_json_ret', 'rds_json_buffer_size'],
  'rds-csv-nginx-module': ['rds_csv', 'rds_csv_row_terminator', 'rds_csv_field_separator', 'rds_csv_field_name_header', 'rds_csv_content_type', 'rds_csv_buffer_size'],
  'drizzle-nginx-module': ['drizzle_server', 'drizzle_keepalive', 'drizzle_query', 'drizzle_dbname', 'drizzle_pass', 'drizzle_connect_timeout', 'drizzle_send_query_timeout', 'drizzle_recv_cols_timeout', 'drizzle_recv_rows_timeout', 'drizzle_module_header', 'drizzle_buffer_size', 'drizzle_status'],
  'iconv-nginx-module': ['set_iconv', 'iconv_buffer_size', 'iconv_filter'],
  'encrypted-session-nginx-module': ['encrypted_session_key', 'encrypted_session_iv', 'encrypted_session_expires', 'set_encrypt_session', 'set_decrypt_session'],
  'redis-nginx-module': ['redis_pass', 'redis_bind', 'redis_connect_timeout', 'redis_send_timeout', 'redis_buffer_size', 'redis_read_timeout', 'redis_next_upstream', 'redis_gzip_flag'],
  ngx_postgres: ['postgres_server', 'postgres_keepalive', 'postgres_pass', 'postgres_query', 'postgres_rewrite', 'postgres_output', 'postgres_set', 'postgres_escape', 'postgres_connect_timeout', 'postgres_result_timeout'],
  ngx_coolkit: ['override_method'],
  'redis2-nginx-module': ['redis2_query', 'redis2_raw_query', 'redis2_raw_queries', 'redis2_literal_raw_query', 'redis2_pass', 'redis2_bind', 'redis2_connect_timeout', 'redis2_send_timeout', 'redis2_buffer_size', 'redis2_read_timeout', 'redis2_next_upstream']
};
const frozen = (source, file) => execFileSync('git', ['-C', resolve(root, source.path), 'show', `${source.revision}:${file}`], { encoding: 'utf8' });
function sourceInputs() {
  return provenance.sources.map(proof => {
    const source = { component: proof.component, version: proof.version, tag: proof.tag, revision: proof.revision,
      path: resolve(root, proof.path), repository: proof.repository, role: reviews[proof.component]?.classification ?? 'nginx-module' };
    if (reviews[proof.component]) source.scope_review = structuredClone(reviews[proof.component]);
    else source.registration_inputs = [{ file: moduleFiles[proof.component] }];
    if (proof.archive) source.archive_evidence = { url: proof.archive.url, path: archivePath, sha256: proof.archive.sha256, files: proof.files };
    return source;
  });
}
function configFor(sources) {
  return { openresty_version: provenance.openresty_version, main_repo: join(root, 'openresty'), analysis_dir: 'analysis', sources };
}
async function catalog(directory) {
  return JSON.parse(await readFile(join(directory, 'analysis/directives/catalog.json'), 'utf8'));
}

test('16 来源固定正式输入：九模块全部名称集合和七种用途正证据', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'remaining-scope-inputs-'));
  try {
    const config = configFor(sourceInputs());
    const configPath = join(directory, 'project.config.json');
    await writeFile(configPath, JSON.stringify(config));
    await inventory(configPath);
    const records = (await catalog(directory)).directives;
    assert.equal(records.length, 66);
    for (const [component, expected] of Object.entries(names)) {
      const actual = records.filter(record => record.component === component);
      assert.deepEqual(actual.map(record => record.name), expected);
      assert.ok(actual.every(record => record.module_verified && record.verification === 'registration_only'));
      for (const record of actual) {
        const proof = provenance.sources.find(source => source.component === component);
        const raw = frozen(proof, record.file).split('\n').slice(record.line - 1, record.end_line).join('\n');
        assert.ok(raw.includes(`"${record.name}"`));
        assert.equal(record.revision, proof.revision);
        assert.equal(record.repository, proof.repository);
      }
    }
    assert.deepEqual(records.find(record => record.name === 'redis_bind').compile_guards, ['if defined nginx_version && nginx_version >= 8022']);
    const matrix = JSON.parse(await readFile(join(directory, 'analysis/components.json'), 'utf8')).components;
    for (const [component, review] of Object.entries(reviews)) {
      const actual = matrix.find(source => source.component === component);
      assert.equal(actual.inspection, 'fixed_build_and_entry_review');
      assert.equal(actual.directive_scope, 'no_own_directives');
      assert.equal(actual.role, review.classification);
      assert.equal(actual.registrations, 0);
      assert.ok(actual.scope_review.evidence.every(item => item.code.length > 0));
    }
    const redis = matrix.find(source => source.component === 'redis-nginx-module');
    assert.equal(redis.archive_evidence.files.length, 9);
    assert.equal(redis.archive_evidence.tree_matches, true);
    assert.equal(redis.repository, 'https://github.com/osokin/ngx_http_redis');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('scope gate 拒绝错误分类、缺证据、错安装/入口和互斥输入，不覆盖已有隔离目录', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'remaining-scope-gate-'));
  try {
    const config = configFor(sourceInputs().filter(source => reviews[source.component]));
    const configPath = join(directory, 'project.config.json');
    await writeFile(configPath, JSON.stringify(config));
    await inventory(configPath);
    const before = await readFile(join(directory, 'analysis/directives/catalog.json'), 'utf8');
    const cases = [
      ['lua-cjson', source => { source.scope_review.classification = 'lua_reference_library'; }],
      ['lua-cjson', source => { source.scope_review.evidence.pop(); }],
      ['lua-cjson', source => { source.scope_review.evidence[1] = structuredClone(source.scope_review.evidence[0]); }],
      ['lua-cjson', source => { source.scope_review.evidence[0].end_line = 20; }],
      ['lua-cjson', source => { source.scope_review.evidence[2].file = 'missing.c'; }],
      ['lua-cjson', source => { source.scope_review.evidence[2].start_line = 1; source.scope_review.evidence[2].end_line = 20; }],
      ['lua-cjson', source => { source.scope_review.evidence[2].component = 'nginx'; }],
      ['lua-cjson', source => { source.scope_review.evidence[2].end_line = 99999; }],
      ['lua-cjson', source => { source.registration_inputs = [{ file: 'lua_cjson.c' }]; }],
      ['lua-upstream-nginx-module', source => { source.scope_review.evidence[1].start_line = 19; source.scope_review.evidence[1].end_line = 35; }],
      ['lua-resty-signal', source => { source.scope_review.evidence[2].end_line = 50; }],
      ['resty-cli', source => { source.scope_review.evidence[0].start_line = 1140; source.scope_review.evidence[0].end_line = 1153; }],
      ['opm', source => { source.scope_review.evidence[1].start_line = 25; source.scope_review.evidence[1].end_line = 30; }]
    ];
    for (const [component, mutate] of cases) {
      const broken = structuredClone(config);
      mutate(broken.sources.find(source => source.component === component));
      await writeFile(configPath, JSON.stringify(broken));
      await assert.rejects(inventory(configPath), /scope_review|正式输入/);
      assert.equal(await readFile(join(directory, 'analysis/directives/catalog.json'), 'utf8'), before);
    }
    const module = sourceInputs().find(source => source.component === 'redis2-nginx-module');
    delete module.registration_inputs;
    module.scope_review = structuredClone(reviews['lua-cjson']);
    await writeFile(configPath, JSON.stringify(configFor([module])));
    await assert.rejects(inventory(configPath), /实际注册冲突/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('Redis 归档桥必须实际核字节摘要、完整 blob 集合与真实仓库，未知映射拒绝', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'remaining-redis-bridge-'));
  try {
    const redis = sourceInputs().find(source => source.component === 'redis-nginx-module');
    const config = configFor([redis]);
    const configPath = join(directory, 'project.config.json');
    await writeFile(configPath, JSON.stringify(config));
    await inventory(configPath);
    const before = await readFile(join(directory, 'analysis/directives/catalog.json'), 'utf8');
    for (const mutate of [
      source => { delete source.repository; },
      source => { delete source.archive_evidence; },
      source => { source.archive_evidence.url = 'https://example.test/other.tar.gz'; },
      source => { source.archive_evidence.sha256 = '0'.repeat(64); },
      source => { source.archive_evidence.files[0].sha = '0'.repeat(40); },
      source => { source.archive_evidence.files.pop(); },
      source => { source.archive_evidence.files.push({ path: 'extra.c', sha: '0'.repeat(40) }); },
      source => { source.repository = 'https://github.com/nginx/nginx'; },
      source => { source.revision = '0'.repeat(40); }
    ]) {
      const broken = structuredClone(config);
      mutate(broken.sources[0]);
      await writeFile(configPath, JSON.stringify(broken));
      await assert.rejects(inventory(configPath), /归档|archive_evidence|repository|revision/);
      assert.equal(await readFile(join(directory, 'analysis/directives/catalog.json'), 'utf8'), before);
    }
    // 用完整可读的非原版归档验证：即使更新摘要，也不能只信 tree_matches 声明。
    const proof = provenance.sources.find(source => source.component === 'redis-nginx-module');
    const archiveRoot = join(directory, 'archive', 'ngx_http_redis-0.3.9');
    for (const file of proof.files) {
      const target = join(archiveRoot, file.path);
      await mkdir(resolve(target, '..'), { recursive: true });
      await writeFile(target, frozen(proof, file.path));
    }
    await writeFile(join(archiveRoot, 'AUTHOR'), '非原版字节\n');
    const altered = join(directory, 'altered.tar.gz');
    execFileSync('tar', ['-czf', altered, '-C', join(directory, 'archive'), 'ngx_http_redis-0.3.9']);
    const broken = structuredClone(config);
    broken.sources[0].archive_evidence.path = altered;
    broken.sources[0].archive_evidence.sha256 = createHash('sha256').update(await readFile(altered)).digest('hex');
    broken.sources[0].archive_evidence.tree_matches = true;
    await writeFile(configPath, JSON.stringify(broken));
    await assert.rejects(inventory(configPath), /完整文件清单/);
    assert.equal(await readFile(join(directory, 'analysis/directives/catalog.json'), 'utf8'), before);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('只读提取不泛化未知注册宏；Lua API module 的 NULL commands 是正证据', () => {
  for (const proof of provenance.sources.filter(source => moduleFiles[source.component])) {
    const file = moduleFiles[proof.component];
    const original = frozen(proof, file);
    assert.throws(() => extractCommands(original.replace('ngx_null_command', 'UNKNOWN_REGISTRATION("unknown"), ngx_null_command'), file, proof.component, {}), /未支持的命令注册表达式/);
  }
  const proof = provenance.sources.find(source => source.component === 'lua-upstream-nginx-module');
  const original = frozen(proof, 'src/ngx_http_lua_upstream_module.c');
  assert.match(original, /NULL,\s*\/\* module directives \*\//);
  assert.match(original, /ngx_http_lua_add_package_preload\(cf, "ngx.upstream"/);
  assert.throws(() => extractCommands(original, 'src/ngx_http_lua_upstream_module.c', proof.component, {}), /没有可核实注册/);
});

function localLibraryInputs() {
  return [
    { component: 'luajit2', version: '2.1-20240815', tag: 'v2.1-20240815',
      revision: '33d6b04681d2f079a6d013988a426a841c52e29e', path: join(root, 'repos/luajit2'),
      role: 'lua_runtime', scope_review: { classification: 'lua_runtime', evidence: [
        entry('build-entry', 'src/Makefile', 501, 763), entry('installation', 'Makefile', 92, 147),
        entry('api-entry', 'src/luajit.c', 569, 581), entry('vm-entry', 'src/lj_state.c', 239, 265)] } },
    { component: 'lua-resty-core', version: '0.1.30', tag: 'v0.1.30',
      revision: '2da3d7719a05b2981f3808ca874517b558f29fa9', path: join(root, 'repos/lua-resty-core'),
      role: 'lua_reference_library', scope_review: { classification: 'lua_reference_library', evidence: [
        entry('installation', 'Makefile', 11, 20), entry('api-entry', 'lib/resty/core.lua', 1, 37)] } }
  ];
}

test('旧两来源正向分类：LuaJIT 生成/链接/VM/安装，core 纯 Lua 安装与真实入口', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'remaining-local-libraries-'));
  try {
    const sources = localLibraryInputs();
    const configPath = join(directory, 'project.config.json');
    await writeFile(configPath, JSON.stringify(configFor(sources)));
    await inventory(configPath);
    assert.deepEqual((await catalog(directory)).directives, []);
    const matrix = JSON.parse(await readFile(join(directory, 'analysis/components.json'), 'utf8')).components;
    for (const source of sources) {
      const actual = matrix.find(item => item.component === source.component);
      assert.equal(actual.inspection, 'fixed_build_and_entry_review');
      assert.equal(actual.directive_scope, 'no_own_directives');
      assert.equal(actual.role, source.role);
      assert.equal(actual.registrations, 0);
      assert.equal(actual.revision, source.revision);
      for (const evidence of actual.scope_review.evidence) {
        assert.equal(evidence.code, frozen(source, evidence.file).split('\n').slice(evidence.start_line - 1, evidence.end_line).join('\n'));
      }
    }
    assert.match(matrix.find(item => item.component === 'luajit2').scope_review.evidence.find(item => item.id === 'vm-entry').code, /#if LJ_64/);
    assert.equal(matrix.filter(item => item.inspection === 'not_inspected').length, 41);

    // 只污染临时副本，确认 gate 仍使用固定树与 blob；不触碰用户源码。
    const core = sources[1];
    const copy = join(directory, 'core-copy');
    execFileSync('git', ['clone', '--quiet', '--shared', core.path, copy]);
    await writeFile(join(copy, 'Makefile'), '非固定树的安装入口\n');
    await writeFile(join(copy, 'lib/resty/core.lua'), 'return {}\n');
    await writeFile(join(copy, 'injected.c'), 'ngx_command_t injected[] = { UNKNOWN() };\n');
    await writeFile(configPath, JSON.stringify(configFor([{ ...core, path: copy }])));
    await inventory(configPath);
    const copied = JSON.parse(await readFile(join(directory, 'analysis/components.json'), 'utf8')).components.find(item => item.component === core.component);
    assert.deepEqual(copied.scope_review, matrix.find(item => item.component === core.component).scope_review);
    assert.deepEqual((await catalog(directory)).directives, []);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('旧两来源 scope gate 拒绝截断链、错入口、漏安装及原生库冒充纯 Lua', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'remaining-local-gates-'));
  try {
    const sources = localLibraryInputs();
    const configPath = join(directory, 'project.config.json');
    await writeFile(configPath, JSON.stringify(configFor(sources)));
    await inventory(configPath);
    const before = await readFile(join(directory, 'analysis/components.json'), 'utf8');
    const cases = [
      [0, source => { source.scope_review.evidence[0].end_line = 549; }],
      [0, source => { source.scope_review.evidence[0].start_line = 749; }],
      [0, source => { source.scope_review.evidence[1].start_line = 129; }],
      [0, source => { source.scope_review.evidence[1].end_line = 132; }],
      [0, source => { source.scope_review.evidence[2].end_line = 573; }],
      [0, source => { source.scope_review.evidence[2].file = 'src/lj_state.c'; source.scope_review.evidence[2].start_line = 239; source.scope_review.evidence[2].end_line = 265; }],
      [0, source => { source.scope_review.evidence[3].end_line = 243; }],
      [0, source => { source.scope_review.evidence[3].start_line = 240; }],
      [0, source => { source.scope_review.evidence.pop(); }],
      [1, source => { source.scope_review.evidence[0].end_line = 19; }],
      [1, source => { source.scope_review.evidence[0].start_line = 14; }],
      [1, source => { source.scope_review.evidence[1].end_line = 15; }],
      [1, source => { source.scope_review.evidence[1].file = 'README.markdown'; }],
      [1, source => { source.scope_review.evidence[1].component = 'openresty'; }],
      [1, source => { source.scope_review.classification = 'lua_runtime'; }],
      [1, source => { source.revision = '0'.repeat(40); }]
    ];
    for (const [index, mutate] of cases) {
      const source = structuredClone(sources[index]);
      mutate(source);
      await writeFile(configPath, JSON.stringify(configFor([source])));
      await assert.rejects(inventory(configPath), /scope_review|revision/);
      assert.equal(await readFile(join(directory, 'analysis/components.json'), 'utf8'), before);
    }
    const signal = sourceInputs().find(source => source.component === 'lua-resty-signal');
    signal.scope_review = { classification: 'lua_reference_library', evidence: [
      entry('installation', 'Makefile', 10, 43), entry('api-entry', 'lib/resty/signal.lua', 21, 67)] };
    await writeFile(configPath, JSON.stringify(configFor([signal])));
    await assert.rejects(inventory(configPath), /scope_review/);
    assert.equal(await readFile(join(directory, 'analysis/components.json'), 'utf8'), before);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
