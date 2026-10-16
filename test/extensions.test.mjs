import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { extractCommands, inspectExtensionSource, inventory } from '../scripts/inventory.mjs';
import { build } from '../scripts/build.mjs';
import { parseConfig, parseSingle, matchDirective } from '../src/core/core.mjs';
import { validateIndex, validateDetail, createKnowledgeClient } from '../src/query/knowledge.mjs';

const root = resolve(import.meta.dirname, '..');
const config = JSON.parse(await readFile(join(root, 'project.config.json'), 'utf8'));
const baseline = JSON.parse(await readFile(join(root, 'dist/knowledge/releases/1.27.1.1-eeabda4eba7f5c16/index.json'), 'utf8'));
const extensionRelease = JSON.parse(await readFile(join(root, 'dist/knowledge/releases/1.27.1.1-948dd5954553c1bf/index.json'), 'utf8'));
const index = JSON.parse(await readFile(join(root, 'dist/knowledge/index.json'), 'utf8'));
const source = config.department_extensions[0];
const readGit = (component, revision, file) => execFileSync('git', ['-C', join(root, 'repos', component), 'show', revision + ':' + file], { encoding: 'utf8' });
const fixed = file => readGit(source.component, source.revision, file);
const detailFor = (entry, base = join(root, 'dist/knowledge')) => readFile(join(base, entry.detail_path), 'utf8').then(JSON.parse);
function recompute(value) {
  const count = entries => ({ registration_count: entries.length,
    basic_verified_count: entries.filter(entry => entry.verification !== 'registration_only').length,
    deep_verified_count: entries.filter(entry => entry.verification === 'deep_verified').length });
  Object.assign(value.coverage, count(value.directives));
  if (value.schema_version === 2) for (const kind of ['bundled', 'department_extension']) Object.assign(value.coverage.groups[kind], count(value.directives.filter(entry => entry.source.kind === kind)));
  return value;
}

test('A01 VTS引入时的发行1017原知识字段与冻结发布逐字保真', async () => {
  assert.equal(extensionRelease.schema_version, 2);
  const bundled = extensionRelease.directives.filter(entry => entry.source.kind === 'bundled');
  assert.equal(bundled.length, 1017);
  assert.deepEqual(bundled.map(entry => entry.id), baseline.directives.map(entry => entry.id));
  const originalFields = ({ schema_version, release_id, source, ...fields }) => fields;
  for (const entry of bundled) {
    const oldEntry = baseline.directives.find(candidate => candidate.id === entry.id);
    assert.deepEqual(originalFields(await detailFor(entry)), originalFields(await detailFor(oldEntry)), entry.id);
  }
});

test('A01b 四项HTTP补证据历史发布的授权范围保持冻结', async () => {
  const sampleRelease = JSON.parse(await readFile(join(root, 'dist/knowledge/releases/1.27.1.1-2dca5fdd6a398672/index.json'), 'utf8'));
  const changed = new Set([
    'nginx--ngx_http_core_module--resolver', 'nginx--ngx_http_proxy_module--proxy_pass',
    'nginx--ngx_http_rewrite_module--set', 'nginx--ngx_http_proxy_module--proxy_set_header',
  ]);
  const factBaseline = JSON.parse(await readFile(join(root, 'dist/knowledge/releases/1.27.1.1-647706874ae7c03c/index.json'), 'utf8'));
  const originalFields = ({ schema_version, release_id, ...fields }) => fields;
  assert.deepEqual(sampleRelease.directives.map(entry => entry.id), extensionRelease.directives.map(entry => entry.id));
  for (const entry of sampleRelease.directives) {
    const before = originalFields(await detailFor(extensionRelease.directives.find(item => item.id === entry.id)));
    const after = originalFields(await detailFor(entry));
    if (changed.has(entry.id)) {
      const curated = await detailFor(factBaseline.directives.find(item => item.id === entry.id));
      for (const field of ['defaults', 'inheritance', 'patch_status']) assert.deepEqual(after[field], curated[field], `${entry.id}:${field}`);
      for (const source of before.sources) assert.deepEqual(after.sources.find(item => item.id === source.id), source, `${entry.id}:${source.id}`);
      for (const id of before.patch_status.source_ids) assert.ok(after.patch_status.source_ids.includes(id));
      after.defaults = before.defaults;
      after.inheritance = before.inheritance;
      after.sources = before.sources;
      after.patch_status.source_ids = before.patch_status.source_ids;
    }
    assert.deepEqual(after, before, entry.id);
  }
});

test('A02 VTS正式注册集合、24项内容与发布详情一致', async () => {
  const knowledge = JSON.parse(await readFile(join(root, config.extension_knowledge_file), 'utf8'));
  const records = extractCommands(fixed('src/ngx_http_vhost_traffic_status_module.c'), 'src/ngx_http_vhost_traffic_status_module.c', source.component);
  const entries = index.directives.filter(entry => entry.source.kind === 'department_extension');
  assert.equal(records.length, 24);
  assert.deepEqual(entries.map(entry => entry.name).sort(), records.map(record => record.name).sort());
  assert.deepEqual(knowledge.map(entry => entry.name).sort(), records.map(record => record.name).sort());
  for (const entry of entries) {
    const detail = validateDetail(await detailFor(entry), entry, index);
    const runtimeNames = ['vhost_traffic_status_zone', 'vhost_traffic_status_filter_by_host', 'vhost_traffic_status_display', 'vhost_traffic_status_display_format'];
    assert.equal(detail.verification, runtimeNames.includes(entry.name) ? 'deep_verified' : 'basic_verified');
    assert.equal(detail.source.revision, source.revision);
    assert.equal(detail.source.version_kind, 'commit_snapshot');
    assert.equal(detail.source.deployment_status, 'unknown');
    assert.equal(detail.patch_status.status, 'not_applicable');
    assert.ok(!detail.sources.some(evidence => evidence.id === 'distribution-version'));
    for (const evidence of detail.sources) {
      const raw = readGit(evidence.component, evidence.revision, evidence.file).replaceAll('\r\n', '\n').split('\n');
      assert.equal(evidence.code, raw.slice(evidence.start_line - 1, evidence.end_line).join('\n'), entry.name + ':' + evidence.id);
    }
  }
});

test('A03–A06 四项样例、context、unknown与语法错误、Markdown来源', async () => {
  const sample = 'http { vhost_traffic_status_zone; vhost_traffic_status_filter_by_host on; server { location /vts_status { vhost_traffic_status_display; vhost_traffic_status_display_format html; } } }';
  const parsed = parseConfig(sample);
  assert.equal(parsed.errors.length, 0);
  for (const item of parsed.directives.filter(item => item.name.startsWith('vhost_traffic_status'))) {
    const match = matchDirective(item, index);
    assert.equal(match.status, 'matched');
    assert.equal(match.candidates[0].source.kind, 'department_extension');
  }
  const client = createKnowledgeClient({ knowledgeBase: 'http://fixture.test/knowledge/', siteBase: 'http://fixture.test/', timeoutMs: 1000,
    fetcher: async url => ({ ok: true, json: async () => JSON.parse(await readFile(join(root, 'dist', new URL(url).pathname), 'utf8')) }) });
  const preview = await client.querySingle('vhost_traffic_status_zone;');
  assert.equal(preview.status, 'context_required');
  assert.match(preview.markdown, /部门扩展.*commit 快照/);
  assert.match(preview.markdown, /现场版本与安装情况未知/);
  assert.match(preview.markdown, /不属于发行补丁处理范围/);
  assert.equal((await client.querySingle('vhost_traffic_status_zone;', { context: 'http' })).status, 'matched');
  assert.equal((await client.querySingle('vhost_traffic_status_zone;', { context: 'stream' })).status, 'context_mismatch');
  assert.equal((await client.querySingle('vhost_traffic_status_display;', { context: 'http' })).status, 'context_mismatch');
  assert.equal((await client.querySingle('future_extension_probe on;')).status, 'unknown');
  assert.ok(parseConfig('http { vhost_traffic_status_zone;').errors.length > 0);
  assert.equal(index.coverage.registration_count, 1041);
  assert.equal(index.coverage.groups.bundled.registration_count, 1017);
  assert.equal(index.coverage.groups.department_extension.registration_count, 24);
});

test('A07 schema1保留发行语义，schema2拒绝同组件混来源和混版本', async () => {
  const extendedSource = index.directives.find(entry => entry.source.kind === 'department_extension').source;
  const legacy = structuredClone(baseline);
  legacy.directives[0].source = extendedSource;
  assert.throws(() => validateIndex(legacy), /来源/);
  assert.equal(matchDirective(parseSingle(legacy.directives[0].name).directive, legacy).status, 'invalid_index');
  const oldDetail = await detailFor(baseline.directives[0]);
  assert.throws(() => validateDetail({ ...oldDetail, source: extendedSource }, baseline.directives[0], baseline), /历史发行/);
  const first = index.directives.find(entry => entry.source.kind === 'department_extension');
  for (const mutate of [
    entry => { entry.source = { kind: 'bundled' }; },
    entry => { entry.source.revision = 'a'.repeat(40); },
    entry => { entry.source.repository = 'https://github.com/fixture/other'; },
    entry => { entry.source.version = 'commit other'; },
  ]) {
    const broken = structuredClone(index);
    mutate(broken.directives.find(entry => entry.id === first.id));
    recompute(broken);
    assert.throws(() => validateIndex(broken), /来源/);
    assert.equal(matchDirective(parseSingle(first.name).directive, broken).status, 'invalid_index');
  }
  const detail = await detailFor(first);
  assert.throws(() => validateDetail({ ...detail, source: { ...detail.source, revision: 'a'.repeat(40) } }, first, index), /来源/);
  const bundled = index.directives.find(entry => entry.source.kind === 'bundled');
  const bundledDetail = await detailFor(bundled);
  assert.throws(() => validateDetail({ ...bundledDetail, patch_status: { ...bundledDetail.patch_status, status: 'not_applicable' } }, bundled, index), /补丁校验/);
  assert.throws(() => validateIndex({ ...index, coverage: { ...index.coverage, groups: { ...index.coverage.groups, department_extension: { ...index.coverage.groups.department_extension, registration_count: 23 } } } }), /分组/);
  assert.throws(() => validateIndex({ ...index, directives: [...index.directives, first] }), /条目/);
});

test('A08 历史schema1客户端仍可读取发行详情', async () => {
  const client = createKnowledgeClient({ knowledgeBase: 'http://fixture.test/knowledge/', siteBase: 'http://fixture.test/', timeoutMs: 1000,
    fetcher: async url => ({ ok: true, json: async () => JSON.parse(await readFile(join(root, 'dist', new URL(url).pathname), 'utf8')) }) });
  const result = await client.querySingle('worker_connections 65535;', { context: 'events', release: baseline.release_id });
  assert.equal(result.status, 'matched');
  assert.equal(result.schema_version, 1);
  assert.equal(result.release_id, baseline.release_id);
});

test('A09 隔离第二模块无需业务特判可盘点、构建和查询，无扩展回退及失败保留current', async () => {
  const taskDir = await mkdtemp(join(tmpdir(), 'department-extension-fixture-'));
  try {
    const directory = join(taskDir, 'fixture');
    await mkdir(directory);
    await mkdir(join(taskDir, 'site'));
    await mkdir(join(taskDir, 'src'));
    await writeFile(join(taskDir, 'site/index.html'), '<!doctype html><title>隔离模块测试</title>');
    const moduleSource = 'static ngx_command_t fixture_commands[] = {\n { ngx_string("fixture_extension_flag"), NGX_HTTP_MAIN_CONF|NGX_CONF_FLAG, ngx_conf_set_flag_slot, 0, 0, NULL }, ngx_null_command\n};\nngx_module_t fixture_module = { NGX_MODULE_V1, NULL, fixture_commands, NGX_HTTP_MODULE };\n';
    await writeFile(join(directory, 'module.c'), moduleSource);
    await writeFile(join(directory, 'config'), 'ngx_addon_name=fixture_module\nFIXTURE_SRCS="$ngx_addon_dir/module.c"\nif test -n "$ngx_module_link"; then\nngx_module_type=HTTP\nngx_module_name=$ngx_addon_name\nngx_module_srcs="$FIXTURE_SRCS"\n. auto/module\nelse\nHTTP_MODULES="$HTTP_MODULES $ngx_addon_name"\nNGX_ADDON_SRCS="$NGX_ADDON_SRCS $FIXTURE_SRCS"\nfi\n');
    execFileSync('git', ['-C', directory, 'init'], { stdio: 'pipe' });
    execFileSync('git', ['-C', directory, 'remote', 'add', 'origin', 'https://github.com/fixture/department-module']);
    execFileSync('git', ['-C', directory, 'add', '.']);
    execFileSync('git', ['-C', directory, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', 'commit', '-m', '隔离固定模块'], { stdio: 'pipe' });
    const revision = execFileSync('git', ['-C', directory, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    const extension = { component: 'fixture-module', path: 'fixture', repository: 'https://github.com/fixture/department-module', revision,
      version: 'commit ' + revision.slice(0, 12), version_kind: 'commit_snapshot', deployment_status: 'unknown', registration_build: { entry: 'config' } };
    const nginx = config.sources.find(source => source.component === 'nginx');
    const nginxRevision = execFileSync('git', ['-C', join(root, nginx.path), 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    const readBuild = (file, component) => readGit(component, component === 'nginx' ? nginxRevision : source.revision, file);
    const inspection = await inspectExtensionSource(taskDir, extension, readBuild);
    assert.equal(inspection.directives.length, 1);
    for (const wrong of [{ ...extension, revision: 'a'.repeat(40) }, { ...extension, repository: 'https://github.com/fixture/wrong' }]) await assert.rejects(inspectExtensionSource(taskDir, wrong, readBuild), /版本或来源/);
    const knowledge = [{ component: extension.component, module: 'fixture_module', name: 'fixture_extension_flag', syntax: 'fixture_extension_flag on | off;', summary: '隔离测试模块的标志配置入口。',
      callback_definition: { component: 'nginx', file: 'src/core/ngx_conf_file.c', start_line: 1026, end_line: 1063 }, evidence: [], limitations: [] }];
    await writeFile(join(taskDir, 'knowledge.json'), '[]');
    await writeFile(join(taskDir, 'extensions.json'), JSON.stringify(knowledge));
    const temporary = { openresty_version: config.openresty_version, main_repo: join(root, config.main_repo), analysis_dir: 'analysis', output_dir: 'dist',
      title: '隔离模块', request_timeout_ms: 1000, knowledge_file: 'knowledge.json', extension_knowledge_file: 'extensions.json', sources: [{ ...nginx, path: join(root, nginx.path) }],
      department_extensions: [extension], department_sample_status: { received: true, pending: ['样例已收，深度待验收'] } };
    const configPath = join(taskDir, 'project.config.json');
    await writeFile(configPath, JSON.stringify(temporary));
    await inventory(configPath);
    await build(configPath);
    const indexPath = join(taskDir, 'dist/knowledge/index.json');
    const firstPublication = await readFile(indexPath, 'utf8');
    const published = JSON.parse(firstPublication);
    const entry = published.directives.find(entry => entry.component === extension.component);
    assert.equal(entry.verification, 'basic_verified');
    assert.equal(matchDirective(parseSingle(entry.name).directive, published, { context: 'http' }).status, 'matched');
    await build(configPath);
    assert.equal(await readFile(indexPath, 'utf8'), firstPublication);
    const duplicate = { ...temporary, department_extensions: [extension, extension] };
    await writeFile(configPath, JSON.stringify(duplicate));
    await assert.rejects(inventory(configPath), /重复/);
    assert.equal(await readFile(indexPath, 'utf8'), firstPublication);
    temporary.department_extensions = [{ ...extension, repository: 'https://github.com/fixture/wrong' }];
    await writeFile(configPath, JSON.stringify(temporary));
    await assert.rejects(build(configPath), /来源/);
    assert.equal(await readFile(indexPath, 'utf8'), firstPublication);
    temporary.department_extensions = [];
    await writeFile(configPath, JSON.stringify(temporary));
    await inventory(configPath);
    await build(configPath);
    const without = JSON.parse(await readFile(indexPath, 'utf8'));
    assert.equal(without.coverage.groups.department_extension.registration_count, 0);
    assert.ok(!without.directives.some(entry => entry.source.kind === 'department_extension'));
    assert.equal(matchDirective(parseSingle('fixture_extension_flag').directive, without, { context: 'http' }).status, 'unknown');
  } finally {
    // 只清理本测试创建的隔离源码和发布目录。
    await rm(taskDir, { recursive: true, force: true });
  }
});
