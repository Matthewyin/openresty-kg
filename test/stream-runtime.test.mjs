import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { validateRuntime, validateIndex, deriveVerification, createKnowledgeClient, RUNTIME_SCOPE_NOTE, NO_RUNTIME_NOTE } from '../src/query/knowledge.mjs';
import { validatePublication } from '../scripts/build.mjs';
import { parseConfig, matchDirective } from '../src/core/core.mjs';

const root = resolve(import.meta.dirname, '..');
const json = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const config = json('project.config.json');
const index = json('dist/knowledge/releases/1.27.1.1-f8c21e3662af9366/index.json');
const baseline = json('dist/knowledge/releases/1.27.1.1-15e6ba8dfd628573/index.json');
const identities = [
  ...['proxy_pass', 'proxy_connect_timeout', 'proxy_timeout'].map(name => `nginx--ngx_stream_proxy_module--${name}`),
  'nginx--ngx_stream_core_module--resolver',
];
const detailFor = entry => json(`dist/knowledge/${entry.detail_path}`);
const knowledge = json(config.knowledge_file);
const curatedFor = entry => knowledge.find(item => `${item.component}--${item.module}--${item.name}` === entry.id);
const streamFile = 'src/stream/ngx_stream_proxy_module.c';
function runtimeEvidence(name) {
  const entry = index.directives.find(entry => identities.includes(entry.id) && entry.name === name);
  const value = detailFor(entry);
  assert.ok(value.runtime, name);
  const code = value.sources.filter(source => value.runtime.source_ids.includes(source.id));
  return {
    value, code,
    at(file, line) {
      const source = code.filter(source => source.file === file && source.start_line <= line && source.end_line >= line)
        .sort((a, b) => (b.end_line - b.start_line) - (a.end_line - a.start_line))[0];
      assert.ok(source, `${name}: ${file}:${line} 未绑定运行时步骤`);
      return source.code;
    },
    docs: value.sources.filter(source => value.runtime.corroboration_source_ids.includes(source.id)),
  };
}
const sourceConfigs = new Map(json('analysis/components.json').components.map(item => [item.component, item]));
for (const item of config.documentation_sources) sourceConfigs.set(item.component, { ...item, local_path: item.path });
sourceConfigs.set('openresty', { local_path: config.main_repo, revision: json(config.nginx_patch_audit).openresty_revision,
  version: config.openresty_version, repository: 'https://github.com/openresty/openresty' });
const files = new Map();
function fixedSource(evidence) {
  const owner = evidence.component ?? 'nginx';
  const source = sourceConfigs.get(owner);
  assert.ok(source, owner);
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

function checkDetail(value, entry) {
  const { references_path, ...one } = structuredClone(index);
  one.directives = [{ ...entry, verification: value.verification }];
  const count = { inventory_complete: true, registration_count: 1, basic_verified_count: 1, deep_verified_count: value.verification === 'deep_verified' ? 1 : 0 };
  one.coverage = { ...count, gaps: [], groups: { bundled: { ...count }, department_extension: { ...count, registration_count: 0, basic_verified_count: 0, deep_verified_count: 0 } } };
  validatePublication(one, [value]);
}

for (const id of identities) test(`stream运行时实际发布与固定证据逐字一致：${id}`, () => {
  const entry = index.directives.find(entry => entry.id === id);
  const value = detailFor(entry);
  const before = detailFor(baseline.directives.find(entry => entry.id === id));
  const curated = curatedFor(entry);
  assert.ok(curated.runtime);
  assert.equal(new Set(curated.evidence.map(source => source.id)).size, curated.evidence.length);
  const expected = new Map(before.sources.map(source => [source.id, source]));
  for (const evidence of curated.evidence) expected.set(evidence.id, fixedSource(evidence));
  const ordered = sources => [...sources].sort((a, b) => a.id.localeCompare(b.id));
  assert.equal(before.patch_status.status, 'verified_affected');
  const check = (actual, expectedKnowledge = curated) => {
    assert.equal(actual.patch_status.status, before.patch_status.status);
    assert.deepEqual(actual.runtime, expectedKnowledge.runtime);
    assert.deepEqual(actual.patch_status, expectedKnowledge.patch_status);
    assert.deepEqual(ordered(actual.sources), ordered(expected.values()));
    for (const source of before.sources) assert.deepEqual(actual.sources.find(item => item.id === source.id), source);
  };
  check(value);
  const wrongPatch = structuredClone(value); wrongPatch.patch_status.status = 'verified_unaffected';
  assert.throws(() => check(wrongPatch, { ...curated, patch_status: wrongPatch.patch_status }), assert.AssertionError);
  assert.equal(validateRuntime(value), true);
  assert.equal(deriveVerification(value), 'deep_verified');
  assert.equal(value.verification, 'deep_verified');
  assert.ok(value.runtime.corroboration_source_ids.every(id => value.sources.some(source => source.id === id
    && source.component === 'nginx-docs' && source.revision === 'e8b581903e9d41252720053311cea687a5671674'
    && source.file.startsWith('xml/en/docs/stream/'))));
  checkDetail(value, entry);
  const added = value.sources.find(source => !before.sources.some(old => old.id === source.id));
  assert.ok(added);
  for (const mutate of [
    v => { v.runtime.steps[0].action = '错误条件及失败出口'; },
    v => { v.sources.find(source => source.id === added.id).code = '错误代码'; },
    v => { v.sources.find(source => source.id === added.id).revision = '0'.repeat(40); },
    v => { v.sources.find(source => source.id === added.id).start_line++; },
    v => { v.sources.find(source => source.id === added.id).url = 'https://wrong.example'; },
    v => { v.sources.find(source => source.id === v.runtime.corroboration_source_ids[0]).code = '伪造文档'; },
    v => { v.sources.push(added); }, v => { v.sources.push({ ...added, id: 'extra-source' }); },
    v => { v.sources.shift(); }, v => { v.patch_status.source_ids.push('extra-source'); },
    v => { v.patch_status.source_ids.push(v.patch_status.source_ids[0]); },
  ]) {
    const wrong = structuredClone(value); mutate(wrong);
    assert.throws(() => check(wrong), assert.AssertionError);
  }
  for (const mutate of [
    v => { v.runtime.steps = []; }, v => { v.runtime.steps[0].source_ids = []; },
    v => { v.runtime.source_ids.push('missing-source'); }, v => { v.runtime.corroboration_source_ids = []; },
    v => { v.runtime.corroboration_source_ids = [v.runtime.source_ids[0]]; },
    v => { v.patch_status.source_ids = v.patch_status.source_ids.filter(id => id !== v.runtime.source_ids[0]); },
    v => { v.defaults.status = 'unverified'; }, v => { v.inheritance.source_ids = []; },
  ]) {
    const wrong = structuredClone(value); mutate(wrong);
    assert.throws(() => checkDetail(wrong, entry), Error);
  }
  const noRuntime = structuredClone(value); delete noRuntime.runtime;
  assert.equal(deriveVerification(noRuntime), 'basic_verified');
  assert.throws(() => checkDetail(noRuntime, entry), /深度核对状态/);
  const unverified = structuredClone(value); unverified.runtime.status = 'unverified';
  assert.equal(deriveVerification(unverified), 'basic_verified');
  assert.throws(() => checkDetail(unverified, entry), /深度核对状态/);
  unverified.verification = 'basic_verified'; checkDetail(unverified, entry);
  for (const sourceId of ['registration', 'configuration-definition']) for (const cropped of [false, true]) {
    const wrong = structuredClone(value);
    const alias = { ...wrong.sources.find(source => source.id === sourceId), id: 'runtime-alias' };
    if (cropped) { alias.end_line = alias.start_line; alias.code = alias.code.split('\n')[0]; }
    alias.url = alias.url.replace(/#L\d+-L\d+$/, `#L${alias.start_line}-L${alias.end_line}`);
    wrong.sources.push(alias); wrong.patch_status.source_ids.push(alias.id);
    wrong.runtime.source_ids = [alias.id];
    wrong.runtime.steps = [{ condition: '测试条件', action: '伪造消费证据', source_ids: [alias.id] }];
    assert.throws(() => deriveVerification(wrong), /运行时缺少/);
    assert.throws(() => checkDetail(wrong, entry), /运行时缺少/);
  }
});

test('本批仅4个stream身份晋级，原HTTP深度及所有默认继承保持', () => {
  validateIndex(index);
  assert.deepEqual(index.directives.map(entry => entry.id), baseline.directives.map(entry => entry.id));
  const expectedDeep = [...identities, 'nginx--ngx_http_proxy_module--proxy_pass'].sort();
  assert.deepEqual(index.directives.filter(entry => entry.verification === 'deep_verified').map(entry => entry.id).sort(), expectedDeep);
  assert.equal(index.coverage.basic_verified_count, 1041);
  assert.equal(index.coverage.deep_verified_count, expectedDeep.length);
  assert.equal(index.coverage.groups.bundled.deep_verified_count, expectedDeep.length);
  assert.equal(index.coverage.groups.department_extension.deep_verified_count, 0);
  const normalizedIndex = structuredClone(index);
  normalizedIndex.release_id = baseline.release_id;
  normalizedIndex.references_path = baseline.references_path;
  normalizedIndex.directives = baseline.directives;
  normalizedIndex.coverage.deep_verified_count = baseline.coverage.deep_verified_count;
  for (const kind of Object.keys(normalizedIndex.coverage.groups)) normalizedIndex.coverage.groups[kind].deep_verified_count = baseline.coverage.groups[kind].deep_verified_count;
  assert.deepEqual(normalizedIndex, baseline);
  const stable = ({ release_id, ...value }) => value;
  for (const entry of index.directives) {
    const oldEntry = baseline.directives.find(candidate => candidate.id === entry.id);
    assert.deepEqual({ ...entry, detail_path: oldEntry.detail_path, verification: identities.includes(entry.id) ? oldEntry.verification : entry.verification }, oldEntry);
    const old = stable(detailFor(oldEntry));
    const check = value => {
      const actual = structuredClone(value);
      if (identities.includes(entry.id)) {
        assert.equal(actual.verification, 'deep_verified');
        assert.equal(actual.patch_status.status, old.patch_status.status);
        assert.deepEqual(actual.runtime, curatedFor(entry).runtime);
        assert.deepEqual(actual.patch_status, curatedFor(entry).patch_status);
        for (const source of old.sources) assert.deepEqual(actual.sources.find(item => item.id === source.id), source);
        for (const id of old.patch_status.source_ids) assert.ok(actual.patch_status.source_ids.includes(id));
        delete actual.runtime; actual.verification = old.verification; actual.sources = old.sources; actual.patch_status = old.patch_status;
      }
      assert.deepEqual(actual, old, entry.id);
    };
    const actual = stable(detailFor(entry)); check(actual);
    const wrong = structuredClone(actual); wrong.defaults.text = '误改默认值';
    assert.throws(() => check(wrong), assert.AssertionError);
  }
});

test('stream代理的组/IP/DNS分流、连接及会话状态由固定消费分支支撑', () => {
  const proof = runtimeEvidence('proxy_pass');
  assert.match(proof.at(streamFile, 465), /ngx_stream_proxy_eval[\s\S]*NGX_STREAM_INTERNAL_SERVER_ERROR/);
  assert.match(proof.at(streamFile, 499), /ngx_strncasecmp[\s\S]*goto found/);
  assert.match(proof.at(streamFile, 505), /u->resolved->sockaddr[\s\S]*ngx_stream_proxy_connect/);
  assert.match(proof.at(streamFile, 540), /NGX_NO_RESOLVER[\s\S]*NGX_STREAM_INTERNAL_SERVER_ERROR/);
  assert.match(proof.at(streamFile, 603), /ngx_stream_complex_value[\s\S]*url.no_resolve = 1/);
  assert.match(proof.at(streamFile, 736), /ngx_event_connect_peer[\s\S]*NGX_BUSY[\s\S]*NGX_STREAM_BAD_GATEWAY/);
  const retryStep = proof.value.runtime.steps.find(step => step.action.includes('buffered data'));
  assert.ok(retryStep);
  assert.match(retryStep.action, /释放[\s\S]*tries[\s\S]*关闭旧连接/);
  const retryCode = proof.at(streamFile, 1893);
  assert.ok(retryCode.indexOf('u->peer.free(') >= 0 && retryCode.indexOf('u->peer.free(') < retryCode.indexOf('u->peer.tries == 0'));
  assert.ok(proof.code.some(source => source.file.endsWith('balancer_status_code.patch') && /rc >= NGX_STREAM_SPECIAL_RESPONSE/.test(source.code)));
  assert.ok(proof.docs.some(source => /server groups/.test(source.code) && /variables/.test(source.code)));
  const text = JSON.stringify(proof.value.runtime);
  assert.match(text, /会话/);
  assert.match(text, /HTTP/);
});

test('stream解析器绑定自己的超时与回调，缓存等待和失败不套HTTP路径', () => {
  const proof = runtimeEvidence('resolver');
  assert.match(proof.at(streamFile, 540), /NGX_NO_RESOLVER[\s\S]*NGX_STREAM_INTERNAL_SERVER_ERROR/);
  assert.match(proof.at(streamFile, 551), /ctx->timeout = cscf->resolver_timeout/);
  assert.match(proof.at('src/core/ngx_resolver.c', 638), /rn->valid >= ngx_time\(\)[\s\S]*ctx->handler/);
  assert.match(proof.at('src/core/ngx_resolver.c', 752), /rn->waiting/);
  assert.match(proof.at('src/core/ngx_resolver.c', 4097), /NGX_RESOLVE_TIMEDOUT[\s\S]*ctx->handler/);
  assert.match(proof.at(streamFile, 1344), /ctx->state[\s\S]*NGX_STREAM_INTERNAL_SERVER_ERROR/);
  assert.match(proof.at(streamFile, 1376), /ngx_stream_upstream_create_round_robin_peer[\s\S]*ngx_stream_proxy_connect/);
  assert.ok(proof.docs.some(source => /TTL/.test(source.code)));
  assert.ok(proof.docs.some(source => /resolver_timeout/.test(source.code)));
});

test('stream连接超时只在相应等待阶段计时，连接失败依重试门槛决定出口', () => {
  const proof = runtimeEvidence('proxy_connect_timeout');
  assert.match(proof.at(streamFile, 765), /rc != NGX_AGAIN[\s\S]*ngx_stream_proxy_init_upstream[\s\S]*ngx_add_timer/);
  assert.match(proof.at(streamFile, 1523), /ev->timedout[\s\S]*ngx_stream_proxy_next_upstream[\s\S]*ngx_del_timer/);
  assert.match(proof.at(streamFile, 1928), /u->peer.tries == 0[\s\S]*next_upstream_timeout|next_upstream_timeout[\s\S]*u->peer.tries == 0/);
  assert.match(proof.at(streamFile, 1928), /!pscf->next_upstream[\s\S]*NGX_STREAM_BAD_GATEWAY/);
  assert.ok(proof.code.some(source => source.file.endsWith('stream_proxy_timeout_fields.patch') && /ngx_add_timer\(pc->write, ctx->connect_timeout\)/.test(source.code)));
  assert.ok(proof.code.some(source => source.component === 'stream-lua-nginx-module' && /connect_timeout > 0[\s\S]*pctx->connect_timeout = connect_timeout/.test(source.code)));
  assert.ok(proof.docs.some(source => /timeout for establishing a connection/.test(source.code)));
  assert.match(proof.at(streamFile, 1103), /timer_set[\s\S]*ngx_add_timer\(pc->write, pscf->connect_timeout\)/);
  const dnsStep = proof.value.runtime.steps.find(step => step.condition.includes('域名解析阶段'));
  assert.ok(dnsStep);
  assert.ok(dnsStep.source_ids.some(id => proof.value.sources.some(source => source.id === id && source.file === streamFile
    && /if \(ctx->state\)[\s\S]*ngx_stream_proxy_finalize\(s, NGX_STREAM_INTERNAL_SERVER_ERROR\)/.test(source.code))));
});

test('stream转发超时保留延迟、timer刷新及TCP/UDP不同结束分支', () => {
  const proof = runtimeEvidence('proxy_timeout');
  assert.match(proof.at(streamFile, 1431), /ev->timedout[\s\S]*ev->delayed/);
  assert.match(proof.at(streamFile, 1448), /SOCK_DGRAM[\s\S]*responses[\s\S]*NGX_STREAM_OK[\s\S]*NGX_STREAM_BAD_GATEWAY/);
  assert.match(proof.at(streamFile, 1490), /connection timed out[\s\S]*NGX_STREAM_OK/);
  assert.match(proof.at(streamFile, 1792), /!c->read->delayed && !pc->read->delayed[\s\S]*ngx_add_timer[\s\S]*ngx_del_timer/);
  assert.ok(proof.code.some(source => source.file.endsWith('stream_proxy_timeout_fields.patch') && /ngx_add_timer\(c->write, ctx->timeout\)/.test(source.code)));
  assert.ok(proof.code.some(source => source.component === 'stream-lua-nginx-module' && /timeout > 0[\s\S]*pctx->timeout = timeout/.test(source.code)));
  assert.ok(proof.docs.some(source => /between two successive/.test(source.code)));
  assert.match(proof.at('src/event/ngx_event_timer.h', 58), /ngx_current_msec[\s\S]*NGX_TIMER_LAZY_DELAY/);
  assert.match(proof.at(streamFile, 985), /NGX_AGAIN[\s\S]*ngx_add_timer\(pc->write, pscf->timeout\)/);
});

test('stream四项通过真实单项与整段查询，Markdown与网页共用同一运行时数据', async () => {
  const client = createKnowledgeClient({ knowledgeBase: 'http://fixture.test/knowledge/', siteBase: 'http://fixture.test/', timeoutMs: 1000,
    fetcher: async url => ({ ok: true, json: async () => json(`dist${new URL(url).pathname}`) }) });
  for (const id of identities) {
    const entry = index.directives.find(entry => entry.id === id);
    const value = detailFor(entry);
    const result = await client.querySingle(entry.name, { context: 'stream.server', module: entry.module });
    assert.equal(result.status, 'matched'); assert.equal(result.detail.verification, 'deep_verified');
    assert.deepEqual(result.detail.runtime, value.runtime);
    assert.ok(result.markdown.includes(RUNTIME_SCOPE_NOTE));
    for (const step of value.runtime.steps) { assert.ok(result.markdown.includes(step.condition)); assert.ok(result.markdown.includes(step.action)); }
    for (const ref of value.runtime.corroboration_source_ids) assert.ok(result.markdown.includes(value.sources.find(source => source.id === ref).url));
    const old = await client.querySingle(entry.name, { context: 'stream.server', module: entry.module, release: baseline.release_id });
    assert.equal(old.status, 'matched'); assert.equal(old.detail.verification, 'basic_verified');
    assert.equal(old.detail.runtime, undefined); assert.ok(old.markdown.includes('运行时链路：' + NO_RUNTIME_NOTE));
  }
  const parsed = parseConfig('stream { resolver 127.0.0.1; server { listen 9000; proxy_connect_timeout 5s; proxy_timeout 30s; proxy_pass backend.example:443; } }', { mode: 'main' });
  assert.equal(parsed.errors.length, 0);
  const matches = parsed.directives.map(item => matchDirective(item, index));
  assert.ok(matches.every(match => match.status === 'matched'));
  assert.deepEqual(matches.flatMap(match => match.candidates).filter(entry => identities.includes(entry.id)).map(entry => entry.id).sort(), [...identities].sort());
});
