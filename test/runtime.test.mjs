import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { validateIndex, validateDetail, validateRuntime, deriveVerification, createKnowledgeClient, RUNTIME_SCOPE_NOTE, NO_RUNTIME_NOTE } from '../src/query/knowledge.mjs';
import { validatePublication } from '../scripts/build.mjs';

const root = resolve(import.meta.dirname, '..');
const json = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const index = json('dist/knowledge/releases/1.27.1.1-15e6ba8dfd628573/index.json');
const baseline = json('dist/knowledge/releases/1.27.1.1-647706874ae7c03c/index.json');
const id = 'nginx--ngx_http_proxy_module--proxy_pass';
const entry = index.directives.find(entry => entry.id === id);
const detailFor = entry => json(`dist/knowledge/${entry.detail_path}`);
const detail = detailFor(entry);
const before = detailFor(baseline.directives.find(entry => entry.id === id));
const config = json('project.config.json');
const matrix = json('analysis/components.json');
const curated = json(config.knowledge_file).find(item => `${item.component}--${item.module}--${item.name}` === id);
const sourceConfigs = new Map(matrix.components.map(item => [item.component, item]));
for (const item of config.documentation_sources) sourceConfigs.set(item.component, { ...item, local_path: item.path });
sourceConfigs.set('openresty', { local_path: config.main_repo, revision: json(config.nginx_patch_audit).openresty_revision,
  version: config.openresty_version, repository: 'https://github.com/openresty/openresty' });
const files = new Map();
function fixedSource(evidence) {
  const owner = evidence.component ?? 'nginx';
  const source = sourceConfigs.get(owner);
  assert.ok(source);
  const key = `${owner}/${evidence.file}`;
  if (!files.has(key)) files.set(key, execFileSync('git', ['-C', resolve(root, source.local_path), 'show', `${source.revision}:${evidence.file}`], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }).replaceAll('\r\n', '\n').split('\n'));
  const lines = files.get(key);
  assert.ok(evidence.start_line > 0 && evidence.end_line >= evidence.start_line && evidence.end_line <= lines.length);
  return { id: evidence.id, component: owner, version: source.version, revision: source.revision,
    file: evidence.file, start_line: evidence.start_line, end_line: evidence.end_line,
    code: lines.slice(evidence.start_line - 1, evidence.end_line).join('\n'),
    url: `${source.repository}/blob/${source.revision}/${evidence.file}#L${evidence.start_line}-L${evidence.end_line}`,
    kind: evidence.file.endsWith('.patch') ? 'openresty_patch' : 'upstream' };
}

function fixture(value) {
  const nextEntry = { ...entry, verification: value.verification };
  const count = { inventory_complete: true, registration_count: 1, basic_verified_count: 1, deep_verified_count: value.verification === 'deep_verified' ? 1 : 0 };
  const { references_path, ...nextIndex } = index;
  nextIndex.directives = [nextEntry];
  nextIndex.coverage = { ...count, gaps: [], groups: { bundled: { ...count }, department_extension: { ...count, registration_count: 0, basic_verified_count: 0, deep_verified_count: 0 } } };
  return { value, nextEntry, nextIndex };
}
const check = value => { const f = fixture(value); return validatePublication(f.nextIndex, [f.value]); };

test('运行时真实发布由共享入口晋级，计数派生且basic包含deep', () => {
  assert.equal(validateRuntime(detail), true);
  assert.equal(deriveVerification(detail), 'deep_verified');
  check(detail);
  assert.equal(detail.verification, 'deep_verified');
  assert.deepEqual(index.directives.filter(entry => entry.verification === 'deep_verified').map(entry => entry.id), [id]);
  assert.equal(index.coverage.deep_verified_count, 1);
  assert.equal(index.coverage.groups.bundled.deep_verified_count, 1);
  assert.equal(index.coverage.groups.department_extension.deep_verified_count, 0);
  assert.equal(index.coverage.basic_verified_count, 1041);
  for (const mutate of [value => { value.coverage.deep_verified_count++; }, value => { value.coverage.groups.bundled.deep_verified_count = 0; }]) {
    const wrong = structuredClone(index); mutate(wrong);
    assert.throws(() => validateIndex(wrong), /计数不一致/);
  }
});

test('无runtime及unverified不晋级，拒绝手写deep，历史schema兼容', () => {
  for (const schema of [1, 2]) {
    const value = structuredClone(before);
    const oldEntry = { ...baseline.directives.find(entry => entry.id === id), verification: 'basic_verified' };
    const oldIndex = { ...baseline, schema_version: schema };
    value.schema_version = schema;
    assert.equal(validateDetail(value, oldEntry, oldIndex), value);
    assert.equal(deriveVerification(value), 'basic_verified');
    value.verification = 'deep_verified'; oldEntry.verification = 'deep_verified';
    assert.equal(deriveVerification(value), 'basic_verified');
    assert.throws(() => validateDetail(value, oldEntry, oldIndex), /深度核对状态/);
  }
  const value = structuredClone(detail);
  value.runtime = { status: 'unverified', text: '待核实请求消费路径', steps: [], source_ids: [], corroboration_source_ids: [] };
  assert.equal(deriveVerification(value), 'basic_verified');
  assert.throws(() => check(value), /深度核对状态/);
  value.verification = 'basic_verified';
  check(value);
  value.runtime.source_ids.push('missing');
  assert.throws(() => check(value), /运行时内容或证据/);
});

test('共享发布入口拒绝不完整运行时与缺失前置证据，不静默降级', () => {
  const bad = [
    value => { value.runtime = null; },
    value => { value.runtime.status = 'trusted'; },
    value => { value.runtime.text = ''; },
    value => { value.runtime.steps = []; },
    value => { value.runtime.steps[0].condition = ''; },
    value => { value.runtime.steps[0].action = ''; },
    value => { value.runtime.steps[0].source_ids = []; },
    value => { value.runtime.steps[0].source_ids = ['missing']; },
    value => { value.runtime.steps[0].source_ids.push(value.runtime.steps[0].source_ids[0]); },
    value => { value.runtime.source_ids.pop(); },
    value => { value.runtime.corroboration_source_ids = []; },
    value => { value.runtime.corroboration_source_ids.push(value.runtime.corroboration_source_ids[0]); },
    value => { value.runtime.corroboration_source_ids = [value.runtime.source_ids[0]]; },
    value => { value.runtime.steps[0].source_ids = ['registration']; value.runtime.source_ids.push('registration'); },
    value => { value.runtime.steps[0].source_ids = [value.runtime.corroboration_source_ids[0]]; value.runtime.source_ids.push(value.runtime.corroboration_source_ids[0]); },
    value => { value.defaults.text = ''; },
    value => { value.inheritance.source_ids = []; },
    value => { value.defaults.status = 'unverified'; },
    value => { value.summary = ''; },
    value => { value.syntax = ''; },
    value => { value.contexts_verified = false; },
    value => { value.configuration_entry.source_ids = ['registration']; },
    value => { value.patch_status.status = 'unverified'; },
    value => { value.patch_status.source_ids = value.patch_status.source_ids.filter(id => id !== value.runtime.source_ids[0]); },
    value => { value.verification = 'basic_verified'; },
  ];
  for (const mutate of bad) {
    const value = structuredClone(detail); mutate(value);
    assert.throws(() => check(value), Error, mutate.toString());
  }
});

test('注册和配置片段即使改名或裁剪也不能冒充运行时消费证据', () => {
  for (const id of ['registration', 'configuration-definition']) for (const cropped of [false, true]) {
    const value = structuredClone(detail);
    const source = { ...value.sources.find(source => source.id === id), id: 'runtime-alias' };
    if (cropped) { source.end_line = source.start_line; source.code = source.code.split('\n')[0]; }
    source.url = source.url.replace(/#L\d+-L\d+$/, `#L${source.start_line}-L${source.end_line}`);
    value.sources.push(source); value.patch_status.source_ids.push(source.id);
    value.runtime.source_ids = [source.id];
    value.runtime.steps = [{ condition: '测试条件', action: '测试伪造运行时动作', source_ids: [source.id] }];
    assert.throws(() => deriveVerification(value), /运行时缺少/);
    assert.throws(() => check(value), /运行时缺少/);
  }
});

test('实际runtime内容、完整证据及补丁引用逐字匹配授权固定来源', () => {
  assert.ok(curated.runtime);
  assert.equal(new Set(curated.evidence.map(item => item.id)).size, curated.evidence.length);
  const expected = new Map(before.sources.map(source => [source.id, source]));
  for (const evidence of curated.evidence) expected.set(evidence.id, fixedSource(evidence));
  const ordered = sources => [...sources].sort((a, b) => a.id.localeCompare(b.id));
  const checkActual = value => {
    assert.deepEqual(value.runtime, curated.runtime);
    assert.deepEqual(value.patch_status, curated.patch_status);
    assert.deepEqual(ordered(value.sources), ordered(expected.values()));
    for (const old of before.sources) assert.deepEqual(value.sources.find(source => source.id === old.id), old);
  };
  checkActual(detail);
  const added = detail.sources.find(source => !before.sources.some(old => old.id === source.id));
  assert.ok(added);
  for (const mutate of [
    value => { value.runtime.steps[0].action = '所有动态目标必发DNS'; },
    value => { value.sources.find(source => source.id === added.id).code = '错误原文'; },
    value => { value.sources.find(source => source.id === added.id).revision = '0'.repeat(40); },
    value => { value.sources.find(source => source.id === added.id).start_line++; },
    value => { value.sources.find(source => source.id === added.id).url = 'https://wrong.example'; },
    value => { value.sources.find(source => source.id === value.runtime.corroboration_source_ids[0]).revision = '0'.repeat(40); },
    value => { value.sources.find(source => source.id === value.runtime.corroboration_source_ids[0]).code = '伪造文档'; },
    value => { value.sources.push(added); },
    value => { value.sources.push({ ...added, id: 'extra-source' }); },
    value => { value.sources.shift(); },
    value => { value.patch_status.source_ids.push('extra-source'); },
    value => { value.patch_status.source_ids.push(value.patch_status.source_ids[0]); },
  ]) {
    const wrong = structuredClone(detail); mutate(wrong);
    assert.throws(() => checkActual(wrong), assert.AssertionError);
  }
});

test('HTTP动态目标专项分支绑定固定消费代码及独立文档，不只比较curated', () => {
  const runtimeSources = detail.sources.filter(source => detail.runtime.source_ids.includes(source.id));
  const at = (file, line) => {
    const source = runtimeSources.find(source => source.file === file && source.start_line <= line && source.end_line >= line);
    assert.ok(source, `${file}:${line} 未绑定运行时步骤`);
    return source.code;
  };
  const upstream = 'src/http/ngx_http_upstream.c';
  const resolver = 'src/core/ngx_resolver.c';
  assert.match(at('src/http/modules/ngx_http_proxy_module.c', 1034), /ngx_http_script_run/);
  assert.match(at(upstream, 703), /ngx_strncasecmp[\s\S]*goto found/);
  assert.match(at(upstream, 722), /u->resolved->sockaddr[\s\S]*ngx_http_upstream_connect/);
  assert.match(at(upstream, 747), /NGX_NO_RESOLVER[\s\S]*NGX_HTTP_BAD_GATEWAY/);
  assert.match(at(resolver, 619), /rn->valid >= ngx_time\(\)[\s\S]*ctx->handler/);
  assert.match(at(resolver, 752), /rn->waiting/);
  assert.match(at(resolver, 4097), /NGX_RESOLVE_TIMEDOUT[\s\S]*ctx->handler/);
  assert.match(at(upstream, 1214), /ctx->state[\s\S]*NGX_HTTP_BAD_GATEWAY/);
  assert.match(at(upstream, 1224), /ngx_http_upstream_create_round_robin_peer[\s\S]*ngx_http_upstream_connect/);
  assert.match(at(upstream, 1555), /ngx_event_connect_peer/);
  assert.match(at('src/event/ngx_event_connect.c', 209), /connect\([\s\S]*NGX_AGAIN/);
  assert.match(at(upstream, 4371), /NGX_HTTP_UPSTREAM_FT_TIMEOUT[\s\S]*NGX_HTTP_GATEWAY_TIME_OUT/);
  const patches = runtimeSources.filter(source => source.kind === 'openresty_patch');
  assert.ok(patches.some(source => source.file.endsWith('balancer_status_code.patch') && source.code.includes('rc >= NGX_HTTP_SPECIAL_RESPONSE')));
  assert.ok(patches.some(source => source.file.endsWith('upstream_timeout_fields.patch') && source.code.includes('u->connect_timeout')));
  assert.ok(patches.some(source => source.file.endsWith('socket_cloexec.patch') && source.code.includes('SOCK_CLOEXEC')));
  assert.equal(detail.patch_status.status, 'verified_affected');
  const docs = detail.sources.filter(source => detail.runtime.corroboration_source_ids.includes(source.id));
  assert.ok(docs.every(source => source.component === 'nginx-docs' && source.revision === 'e8b581903e9d41252720053311cea687a5671674'));
  assert.ok(docs.some(source => /searched among the described server groups/.test(source.code)));
  assert.ok(docs.some(source => /TTL/.test(source.code)));
  const actions = detail.runtime.steps.map(step => `${step.condition} ${step.action}`).join('\n');
  for (const pattern of [/500/, /502/, /504/, /NGX_NO_RESOLVER/, /缓存/, /upstream/, /超时/]) assert.match(actions, pattern);
});

test('首批只改HTTP proxy_pass运行时、评级和授权证据，阶段一所有事实保留', () => {
  assert.deepEqual(index.directives.map(entry => entry.id), baseline.directives.map(entry => entry.id));
  const stable = ({ release_id, ...value }) => value;
  for (const entry of index.directives) {
    const old = stable(detailFor(baseline.directives.find(candidate => candidate.id === entry.id)));
    const actual = stable(detailFor(entry));
    if (entry.id === id) {
      assert.equal(actual.verification, 'deep_verified');
      assert.deepEqual(actual.patch_status, curated.patch_status);
      for (const source of old.sources) assert.deepEqual(actual.sources.find(item => item.id === source.id), source);
      for (const ref of old.patch_status.source_ids) assert.ok(actual.patch_status.source_ids.includes(ref));
      delete actual.runtime;
      actual.verification = old.verification;
      actual.sources = old.sources;
      actual.patch_status = old.patch_status;
    }
    assert.deepEqual(actual, old, entry.id);
  }
});

test('真实查询Markdown与runtime共享条件、动作、证据及范围，旧版本无虚假深度', async () => {
  const client = createKnowledgeClient({ knowledgeBase: 'http://fixture.test/knowledge/', siteBase: 'http://fixture.test/', timeoutMs: 1000,
    fetcher: async url => ({ ok: true, json: async () => json(`dist${new URL(url).pathname}`) }) });
  const result = await client.querySingle('proxy_pass http://$backend;', { context: 'http.location' });
  assert.equal(result.status, 'matched');
  assert.equal(result.detail.verification, 'deep_verified');
  assert.ok(result.markdown.includes(RUNTIME_SCOPE_NOTE));
  assert.ok(result.markdown.includes(detail.runtime.text));
  for (const step of detail.runtime.steps) {
    assert.ok(result.markdown.includes(step.condition));
    assert.ok(result.markdown.includes(step.action));
  }
  for (const ref of [...detail.runtime.source_ids, ...detail.runtime.corroboration_source_ids]) assert.ok(result.markdown.includes(detail.sources.find(source => source.id === ref).url));
  const old = await client.querySingle('proxy_pass http://$backend;', { context: 'http.location', release: baseline.release_id });
  assert.equal(old.status, 'matched');
  assert.equal(old.detail.verification, 'basic_verified');
  assert.ok(old.markdown.includes('运行时链路：' + NO_RUNTIME_NOTE));
  assert.doesNotMatch(old.markdown, /深度内容已核对/);
});
