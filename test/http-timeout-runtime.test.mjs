import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { validateRuntime, validateIndex, deriveVerification, createKnowledgeClient, RUNTIME_SCOPE_NOTE, NO_RUNTIME_NOTE } from '../src/query/knowledge.mjs';
import { validatePublication } from '../scripts/build.mjs';
import { parseConfig, matchDirective } from '../src/core/core.mjs';

const root = resolve(import.meta.dirname, '..');
const json = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const config = json('project.config.json');
const index = json('dist/knowledge/releases/1.27.1.1-c49915e4ed7a7e58/index.json');
const baseline = json('dist/knowledge/releases/1.27.1.1-f8c21e3662af9366/index.json');
const identities = [
  ...['proxy_connect_timeout', 'proxy_read_timeout', 'proxy_send_timeout'].map(name => `nginx--ngx_http_proxy_module--${name}`),
  'nginx--ngx_http_core_module--resolver',
];
const detailFor = entry => json(`dist/knowledge/${entry.detail_path}`);
const knowledge = json(config.knowledge_file);
const curatedFor = entry => knowledge.find(item => `${item.component}--${item.module}--${item.name}` === entry.id);
const upstreamFile = 'src/http/ngx_http_upstream.c';
const inputBaselines = [{"id":"nginx--ngx_http_core_module--resolver","count":11,"hash":"97ac1b48fcffef732a4c5cb43cc60c4c58fd13de004711dd967c909606b7ffdd"},{"id":"nginx--ngx_http_proxy_module--proxy_connect_timeout","count":7,"hash":"fec3c994dffe4baedb4932eafffb602b21f7cdaadec4d652a888ff208db3248f"},{"id":"nginx--ngx_http_proxy_module--proxy_send_timeout","count":8,"hash":"94ea8b7f6f2944a9dee766828010da12910ca20007424c11b719dd4468b9046c"},{"id":"nginx--ngx_http_proxy_module--proxy_read_timeout","count":10,"hash":"1d76234ee9475ea71e91b5918c67b377aaf4ad68cf988e4ea1afaf0e655b2c91"}];
function checkOldEvidence(curated, id) {
  const before = inputBaselines.find(item => item.id === id);
  assert.equal(createHash('sha256').update(JSON.stringify(curated.evidence.slice(0, before.count))).digest('hex'), before.hash);
}
function checkPatchBoundary(actual, before) {
  assert.deepEqual({ ...actual, note: before.note, source_ids: before.source_ids }, before);
}
function checkStepBoundary(value, condition, wording, anchors) {
  const steps = value.runtime.steps.filter(step => condition.test(step.condition));
  assert.equal(steps.length, 1);
  const step = steps[0];
  for (const pattern of wording) assert.match(step.action, pattern);
  for (const [file, line, pattern] of anchors) {
    const bound = value.sources.filter(source => step.source_ids.includes(source.id)
      && source.file === file && source.start_line <= line && source.end_line >= line);
    assert.ok(bound.some(source => pattern.test(source.code)), `${value.name}：对应步骤缺少 ${file}:${line}`);
  }
}
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

for (const id of identities) test(`HTTP运行时实际发布与固定证据逐字一致：${id}`, () => {
  const entry = index.directives.find(entry => entry.id === id);
  const value = detailFor(entry);
  const before = detailFor(baseline.directives.find(entry => entry.id === id));
  const curated = curatedFor(entry);
  checkOldEvidence(curated, id);
  for (const change of [v => v.evidence.shift(), v => v.evidence.reverse()]) {
    const wrong = structuredClone(curated); change(wrong);
    assert.throws(() => checkOldEvidence(wrong, id), assert.AssertionError);
  }
  assert.ok(curated.runtime);
  assert.equal(new Set(curated.evidence.map(source => source.id)).size, curated.evidence.length);
  const expected = new Map(before.sources.map(source => [source.id, source]));
  for (const evidence of curated.evidence) expected.set(evidence.id, fixedSource(evidence));
  const ordered = sources => [...sources].sort((a, b) => a.id.localeCompare(b.id));
  assert.equal(before.patch_status.status, 'verified_affected');
  const check = (actual, expectedKnowledge = curated) => {
    checkPatchBoundary(actual.patch_status, before.patch_status);
    assert.equal(actual.patch_status.status, before.patch_status.status);
    assert.deepEqual(actual.runtime, expectedKnowledge.runtime);
    assert.deepEqual(actual.patch_status, expectedKnowledge.patch_status);
    assert.deepEqual(ordered(actual.sources), ordered(expected.values()));
    for (const source of before.sources) assert.deepEqual(actual.sources.find(item => item.id === source.id), source);
  };
  check(value);
  const wrongPatch = structuredClone(value); wrongPatch.patch_status.status = 'verified_unaffected';
  assert.throws(() => check(wrongPatch, { ...curated, patch_status: wrongPatch.patch_status }), assert.AssertionError);
  const extraPatch = structuredClone(value); extraPatch.patch_status.extra = '未授权字段';
  assert.throws(() => check(extraPatch, { ...curated, patch_status: extraPatch.patch_status }), assert.AssertionError);
  assert.equal(validateRuntime(value), true);
  assert.equal(deriveVerification(value), 'deep_verified');
  assert.equal(value.verification, 'deep_verified');
  assert.ok(value.runtime.corroboration_source_ids.every(id => value.sources.some(source => source.id === id
    && source.component === 'nginx-docs' && source.revision === 'e8b581903e9d41252720053311cea687a5671674'
    && source.file.startsWith('xml/en/docs/http/'))));
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

test('本批仅4个HTTP身份晋级，原5项深度及所有其他事实保持', () => {
  validateIndex(index);
  assert.deepEqual(index.directives.map(entry => entry.id), baseline.directives.map(entry => entry.id));
  const expectedDeep = [...identities, ...baseline.directives.filter(entry => entry.verification === 'deep_verified').map(entry => entry.id)].sort();
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
        checkPatchBoundary(actual.patch_status, old.patch_status);
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

test('HTTP解析器使用独立解析等待，缓存共享及失败回调不套连接超时', () => {
  const proof = runtimeEvidence('resolver');
  assert.match(proof.at(upstreamFile, 761), /NGX_NO_RESOLVER[\s\S]*NGX_HTTP_BAD_GATEWAY/);
  assert.match(proof.at(upstreamFile, 775), /ctx->timeout = clcf->resolver_timeout/);
  assert.match(proof.at('src/core/ngx_resolver.c', 643), /rn->valid >= ngx_time\(\)/);
  assert.match(proof.at('src/core/ngx_resolver.c', 752), /rn->waiting[\s\S]*ngx_resolver_set_timeout/);
  assert.match(proof.at('src/core/ngx_resolver.c', 4103), /NGX_RESOLVE_TIMEDOUT[\s\S]*ctx->handler/);
  assert.match(proof.at(upstreamFile, 1214), /ctx->state[\s\S]*NGX_HTTP_BAD_GATEWAY/);
  assert.match(proof.at(upstreamFile, 1244), /ngx_http_upstream_create_round_robin_peer/);
  assert.match(proof.at(upstreamFile, 1262), /ngx_http_upstream_connect/);
  assert.ok(proof.docs.some(source => /TTL/.test(source.code)));
  assert.ok(proof.docs.some(source => /resolver_timeout/.test(source.code)));
});

test('HTTP连接等待与TLS已有timer区分，失败重试受门槛约束', () => {
  const proof = runtimeEvidence('proxy_connect_timeout');
  assert.match(proof.at(upstreamFile, 1665), /NGX_AGAIN[\s\S]*ngx_add_timer/);
  assert.match(proof.at(upstreamFile, 1752), /!c->write->timer_set[\s\S]*connect_timeout/);
  assert.match(proof.at(upstreamFile, 2322), /c->write->timedout[\s\S]*NGX_HTTP_UPSTREAM_FT_TIMEOUT/);
  assert.match(proof.at(upstreamFile, 4417), /u->request_sent[\s\S]*NGX_HTTP_POST\|NGX_HTTP_LOCK\|NGX_HTTP_PATCH/);
  assert.match(proof.at(upstreamFile, 4423), /u->peer.tries == 0[\s\S]*request_body_no_buffering[\s\S]*u->peer.start_time/);
  assert.ok(proof.code.some(source => source.file.endsWith('upstream_timeout_fields.patch') && /ngx_add_timer\(c->write, u->connect_timeout\)/.test(source.code)));
  assert.ok(proof.code.some(source => source.component === 'lua-nginx-module' && /connect_timeout > 0[\s\S]*u->connect_timeout =/.test(source.code)));
  assert.ok(proof.docs.some(source => /timeout for establishing a connection/.test(source.code)));
});

test('HTTP发送等待与客户端读写区分，保留pipelining及升级连接实际分支', () => {
  const proof = runtimeEvidence('proxy_send_timeout');
  assert.match(proof.at(upstreamFile, 2113), /!c->write->ready \|\| u->request_body_blocked[\s\S]*send_timeout[\s\S]*ngx_del_timer/);
  assert.match(proof.at(upstreamFile, 2150), /c->write->timer_set[\s\S]*ngx_del_timer/);
  assert.match(proof.at(upstreamFile, 2322), /c->write->timedout[\s\S]*NGX_HTTP_UPSTREAM_FT_TIMEOUT/);
  assert.match(proof.at(upstreamFile, 3581), /upstream->write->active && !upstream->write->ready[\s\S]*send_timeout[\s\S]*ngx_del_timer/);
  assert.match(proof.at(upstreamFile, 3470), /upstream->read->timedout \|\| upstream->write->timedout[\s\S]*NGX_HTTP_GATEWAY_TIME_OUT/);
  assert.ok(proof.code.some(source => source.file.endsWith('upstream_pipelining.patch') && /\+.*u->request_body_sent && !u->conf->preserve_output/.test(source.code)));
  assert.ok(proof.code.some(source => source.component === 'lua-nginx-module' && /send_timeout > 0[\s\S]*u->send_timeout =/.test(source.code)));
  assert.ok(proof.docs.some(source => /between two successive write operations/.test(source.code)));
});

test('HTTP读超时保留头部非重置、缓冲502和非缓冲504及已发头部边界', () => {
  const proof = runtimeEvidence('proxy_read_timeout');
  assert.match(proof.at(upstreamFile, 2181), /ngx_add_timer\(c->read, u->conf->read_timeout\)/);
  assert.match(proof.at(upstreamFile, 2442), /#if 0\s+ngx_add_timer\(rev, u->read_timeout\);\s+#endif/);
  assert.match(proof.at(upstreamFile, 2384), /c->read->timedout[\s\S]*NGX_HTTP_UPSTREAM_FT_TIMEOUT/);
  assert.match(proof.at('src/event/ngx_event_pipe.c', 71), /!rev->delayed[\s\S]*rev->active && !rev->ready[\s\S]*p->read_timeout/);
  assert.match(proof.at(upstreamFile, 4105), /rev->timedout[\s\S]*p->upstream_error = 1/);
  assert.match(proof.at(upstreamFile, 4227), /NGX_HTTP_BAD_GATEWAY/);
  assert.match(proof.at(upstreamFile, 3676), /c->read->timedout[\s\S]*NGX_HTTP_GATEWAY_TIME_OUT/);
  assert.match(proof.at(upstreamFile, 3809), /upstream->read->active && !upstream->read->ready[\s\S]*read_timeout[\s\S]*ngx_del_timer/);
  assert.match(proof.at(upstreamFile, 3600), /upstream->read->active && !upstream->read->ready[\s\S]*read_timeout/);
  assert.match(proof.at(upstreamFile, 4640), /rc >= NGX_HTTP_SPECIAL_RESPONSE[\s\S]*rc = NGX_ERROR/);
  assert.ok(proof.code.some(source => source.component === 'lua-nginx-module' && /read_timeout > 0[\s\S]*u->read_timeout =/.test(source.code)));
  assert.ok(proof.docs.some(source => /between two successive read operations/.test(source.code)));
});

test('关键边界的说明与失败出口必须绑定在对应步骤，移到其他步骤仍拒绝', () => {
  const boundaries = [
    ['resolver', /^DNS 错误答案/, [/NGX_RESOLVE_TIMEDOUT/, /直接 finalize 502/, /不进入 upstream_next/], [
      ['src/core/ngx_resolver.c', 4103, /NGX_RESOLVE_TIMEDOUT[\s\S]*ctx->handler/],
      [upstreamFile, 1214, /ctx->state[\s\S]*NGX_HTTP_BAD_GATEWAY/],
    ]],
    ['proxy_connect_timeout', /^动态目标尚在 DNS/, [/resolver_timeout/, /直接502/, /不走连接 FT_TIMEOUT/], [
      [upstreamFile, 775, /ctx->timeout = clcf->resolver_timeout/],
      [upstreamFile, 1214, /ctx->state[\s\S]*NGX_HTTP_BAD_GATEWAY/],
    ]],
    ['proxy_connect_timeout', /^编译支持且代理上游启用TLS/, [/仅无已有write timer/, /不在这里重新起算/, /FT_TIMEOUT/], [
      [upstreamFile, 1751, /!c->write->timer_set[\s\S]*connect_timeout/],
      [upstreamFile, 1825, /c->write->timedout[\s\S]*NGX_HTTP_UPSTREAM_FT_TIMEOUT/],
    ]],
    ['proxy_send_timeout', /^上游写事件触发/, [/request_body_sent/, /正文未发完继续/, /FT_TIMEOUT/], [
      [upstreamFile, 2322, /c->write->timedout[\s\S]*NGX_HTTP_UPSTREAM_FT_TIMEOUT/],
      ['patches/nginx-1.27.1-upstream_pipelining.patch', 20, /\+.*request_body_sent/],
    ]],
    ['proxy_read_timeout', /^正在接收上游响应头/, [/#if 0内不生效/, /没有在该头部循环每收到一个字节就重置/], [
      [upstreamFile, 2442, /#if 0\s+ngx_add_timer[\s\S]*#endif/],
      [upstreamFile, 2384, /c->read->timedout[\s\S]*NGX_HTTP_UPSTREAM_FT_TIMEOUT/],
    ]],
    ['proxy_read_timeout', /^缓冲正文上游事件触发/, [/upstream_error/, /候选502/, /并非非缓冲路径的504/, /header_sent后/], [
      [upstreamFile, 4105, /rev->timedout[\s\S]*p->upstream_error = 1/],
      [upstreamFile, 4227, /NGX_HTTP_BAD_GATEWAY/],
      [upstreamFile, 4640, /rc >= NGX_HTTP_SPECIAL_RESPONSE[\s\S]*rc = NGX_ERROR/],
    ]],
  ];
  for (const [name, condition, wording, anchors] of boundaries) {
    const value = runtimeEvidence(name).value;
    const check = detail => checkStepBoundary(detail, condition, wording, anchors);
    check(value);
    const wrongText = structuredClone(value);
    wrongText.runtime.steps.find(step => condition.test(step.condition)).action = '所有阶段均按总时长超时并返回504';
    assert.throws(() => check(wrongText), assert.AssertionError);
    for (const [file, line] of anchors) {
      const wrong = structuredClone(value);
      const step = wrong.runtime.steps.find(step => condition.test(step.condition));
      const other = wrong.runtime.steps.find(candidate => candidate !== step);
      const moved = step.source_ids.filter(id => wrong.sources.some(source => source.id === id
        && source.file === file && source.start_line <= line && source.end_line >= line));
      step.source_ids = step.source_ids.filter(id => !moved.includes(id));
      other.source_ids = [...new Set([...other.source_ids, ...moved])];
      assert.deepEqual(wrong.runtime.source_ids, value.runtime.source_ids);
      assert.equal(validateRuntime(wrong), true);
      assert.throws(() => check(wrong), assert.AssertionError);
    }
  }
});

test('HTTP四项通过真实单项与整段查询，Markdown使用同一运行时数据', async () => {
  const client = createKnowledgeClient({ knowledgeBase: 'http://fixture.test/knowledge/', siteBase: 'http://fixture.test/', timeoutMs: 1000,
    fetcher: async url => ({ ok: true, json: async () => json(`dist${new URL(url).pathname}`) }) });
  for (const id of identities) {
    const entry = index.directives.find(entry => entry.id === id);
    const value = detailFor(entry);
    const result = await client.querySingle(entry.name, { context: 'http.location', module: entry.module });
    assert.equal(result.status, 'matched'); assert.equal(result.detail.verification, 'deep_verified');
    assert.deepEqual(result.detail.runtime, value.runtime);
    assert.ok(result.markdown.includes(RUNTIME_SCOPE_NOTE));
    for (const step of value.runtime.steps) { assert.ok(result.markdown.includes(step.condition)); assert.ok(result.markdown.includes(step.action)); }
    for (const ref of value.runtime.corroboration_source_ids) assert.ok(result.markdown.includes(value.sources.find(source => source.id === ref).url));
    const old = await client.querySingle(entry.name, { context: 'http.location', module: entry.module, release: baseline.release_id });
    assert.equal(old.status, 'matched'); assert.equal(old.detail.verification, 'basic_verified');
    assert.equal(old.detail.runtime, undefined); assert.ok(old.markdown.includes('运行时链路：' + NO_RUNTIME_NOTE));
  }
  const parsed = parseConfig('events {} http { resolver 127.0.0.1; server { listen 9000; location / { proxy_connect_timeout 5s; proxy_read_timeout 30s; proxy_send_timeout 30s; proxy_pass http://backend.example; } } }', { mode: 'main' });
  assert.equal(parsed.errors.length, 0);
  const matches = parsed.directives.map(item => matchDirective(item, index));
  assert.ok(matches.every(match => match.status === 'matched'));
  assert.deepEqual(matches.flatMap(match => match.candidates).filter(entry => identities.includes(entry.id)).map(entry => entry.id).sort(), [...identities].sort());
});
