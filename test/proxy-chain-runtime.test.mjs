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
const index = json('dist/knowledge/releases/1.27.1.1-ca870e6c128ac027/index.json');
const baseline = json('dist/knowledge/releases/1.27.1.1-c49915e4ed7a7e58/index.json');
const targets = [
  { key: 'http_set', name: 'set', module: 'ngx_http_rewrite_module', context: 'http.location' },
  { key: 'stream_set', name: 'set', module: 'ngx_stream_set_module', context: 'stream.server' },
  ...['proxy_set_header', 'proxy_http_version', 'proxy_ssl_session_reuse'].map(name => ({ key: name, name, module: 'ngx_http_proxy_module', context: 'http.location' })),
];
const identities = targets.map(item => `nginx--${item.module}--${item.name}`);
const detailFor = entry => json(`dist/knowledge/${entry.detail_path}`);
const knowledge = json(config.knowledge_file);
const curatedFor = entry => knowledge.find(item => `${item.component}--${item.module}--${item.name}` === entry.id);
const upstreamFile = 'src/http/ngx_http_upstream.c';
const inputBaselines = [{"id":"nginx--ngx_stream_set_module--set","count":8,"hash":"0b11aa69c5332ddec28a4072fe475e38a63ca2b68689e9d274e3343c4f397108"},{"id":"nginx--ngx_http_rewrite_module--set","count":11,"hash":"2c6261fbbbf6b652c8c4806238128a1276bcae7f9f685c6052afd90626352217"},{"id":"nginx--ngx_http_proxy_module--proxy_set_header","count":12,"hash":"4c32868b95ecbc09277438c7945dfc73528489ec32cee48dcc07355d389fc9df"},{"id":"nginx--ngx_http_proxy_module--proxy_http_version","count":7,"hash":"e40d110edf075faf879a3a9d04c7688cf65d2ffe689969677c07980adf274107"},{"id":"nginx--ngx_http_proxy_module--proxy_ssl_session_reuse","count":7,"hash":"f9b1bf878b714a479fc4c5f64db61f28732a1907d26ff2e246251af69d227f16"}];
function checkOldEvidence(curated, id) {
  const before = inputBaselines.find(item => item.id === id);
  assert.equal(createHash('sha256').update(JSON.stringify(curated.evidence.slice(0, before.count))).digest('hex'), before.hash);
}
function expectedPatchStatus(id, before) {
  if (id === 'nginx--ngx_http_proxy_module--proxy_ssl_session_reuse') {
    assert.equal(before.status, 'verified_unaffected');
    return 'verified_affected';
  }
  return before.status;
}
function checkPatchBoundary(actual, before, id) {
  assert.deepEqual({ ...actual, note: before.note, source_ids: before.source_ids },
    { ...before, status: expectedPatchStatus(id, before) });
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
  const target = targets.find(item => item.key === name);
  const entry = index.directives.find(entry => entry.name === target.name && entry.module === target.module);
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

for (const id of identities) test(`代理链运行时实际发布与固定证据逐字一致：${id}`, () => {
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
  const oldIds = new Set(before.sources.map(source => source.id));
  assert.equal(before.sources.at(-1).id, 'distribution-version');
  const expectedOrder = [...before.sources.slice(0, -1).map(source => source.id),
    ...curated.evidence.filter(source => !oldIds.has(source.id)).map(source => source.id), 'distribution-version'];
  assert.ok(['verified_affected', 'verified_unaffected'].includes(before.patch_status.status));
  const check = (actual, expectedKnowledge = curated) => {
    checkPatchBoundary(actual.patch_status, before.patch_status, id);
    assert.equal(actual.patch_status.status, expectedPatchStatus(id, before.patch_status));
    assert.deepEqual(actual.runtime, expectedKnowledge.runtime);
    assert.deepEqual(actual.patch_status, expectedKnowledge.patch_status);
    assert.deepEqual(actual.sources, expectedOrder.map(id => expected.get(id)));
    for (const source of before.sources) assert.deepEqual(actual.sources.find(item => item.id === source.id), source);
  };
  check(value);
  const wrongPatch = structuredClone(value); wrongPatch.patch_status.status = expectedPatchStatus(id, before.patch_status) === 'verified_unaffected' ? 'verified_affected' : 'verified_unaffected';
  assert.throws(() => check(wrongPatch, { ...curated, patch_status: wrongPatch.patch_status }), assert.AssertionError);
  const extraPatch = structuredClone(value); extraPatch.patch_status.extra = '未授权字段';
  assert.throws(() => check(extraPatch, { ...curated, patch_status: extraPatch.patch_status }), assert.AssertionError);
  assert.equal(validateRuntime(value), true);
  assert.equal(deriveVerification(value), 'deep_verified');
  assert.equal(value.verification, 'deep_verified');
  assert.ok(value.runtime.corroboration_source_ids.every(id => value.sources.some(source => source.id === id
    && source.component === 'nginx-docs' && source.revision === 'e8b581903e9d41252720053311cea687a5671674'
    && source.file.startsWith('xml/en/docs/'))));
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
    v => { v.sources.shift(); }, v => { v.sources.reverse(); }, v => { v.patch_status.source_ids.push('extra-source'); },
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

test('本批仅5个代理链身份晋级，原9项深度及其他事实保持', () => {
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
        assert.equal(actual.patch_status.status, expectedPatchStatus(entry.id, old.patch_status));
        checkPatchBoundary(actual.patch_status, old.patch_status, entry.id);
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

test('HTTP set执行rewrite脚本而非普通配置字段赋值，失败出口闭合', () => {
  const p = runtimeEvidence('http_set');
  assert.match(p.at('src/http/modules/ngx_http_rewrite_module.c', 279), /NGX_HTTP_SERVER_REWRITE_PHASE/);
  assert.match(p.at('src/http/modules/ngx_http_rewrite_module.c', 286), /NGX_HTTP_REWRITE_PHASE/);
  assert.match(p.at('src/http/modules/ngx_http_rewrite_module.c', 177), /code\(e\)/);
  assert.match(p.at('src/http/ngx_http_script.c', 1779), /ngx_http_script_exit[\s\S]*NGX_HTTP_INTERNAL_SERVER_ERROR/);
  assert.match(p.at('src/http/ngx_http_script.c', 1826), /r->variables\[code->index\]\.len[\s\S]*valid = 1[\s\S]*not_found = 0/);
  assert.match(p.at('src/http/ngx_http_script.c', 1863), /code->handler\(e->request, e->sp, code->data\)/);
});

test('stream set在PREACCESS按序求值，错误由阶段引擎结束会话', () => {
  const p = runtimeEvidence('stream_set');
  const file = 'src/stream/ngx_stream_set_module.c';
  assert.match(p.at(file, 129), /NGX_STREAM_PREACCESS_PHASE/);
  assert.match(p.at(file, 88), /scf->commands.nelts[\s\S]*ngx_stream_complex_value[\s\S]*NGX_ERROR/);
  assert.match(p.at(file, 94), /set_handler[\s\S]*s->variables[\s\S]*NGX_DECLINED/);
  assert.match(p.at('src/stream/ngx_stream_core_module.c', 220), /NGX_ERROR[\s\S]*NGX_STREAM_INTERNAL_SERVER_ERROR[\s\S]*ngx_stream_finalize_session/);
});

test('请求头执行长度和值脚本，空值省略且显式字段阻止原请求同名头透传', () => {
  const p = runtimeEvidence('proxy_set_header');
  const file = 'src/http/modules/ngx_http_proxy_module.c';
  assert.match(p.at(file, 1324), /ngx_http_script_flush_no_cacheable_variables\(r, headers->flushes\)/);
  assert.match(p.at(file, 1362), /val_len == 0[\s\S]*continue/);
  assert.match(p.at(file, 1476), /val_len == 0[\s\S]*e.skip = 1[\s\S]*e.skip = 0/);
  assert.match(p.at(file, 1522), /ngx_hash_find\(&headers->hash[\s\S]*continue/);
});

test('proxy HTTP版本只决定上游请求行并参与请求体流式条件，不覆写上游响应版本', () => {
  const p = runtimeEvidence('proxy_http_version');
  const file = 'src/http/modules/ngx_http_proxy_module.c';
  assert.match(p.at(file, 1447), /plcf->http_version == NGX_HTTP_VERSION_11[\s\S]*ngx_http_proxy_version_11[\s\S]*ngx_http_proxy_version/);
  assert.match(p.at(file, 1018), /!plcf->upstream.request_buffering[\s\S]*!r->headers_in.chunked[\s\S]*http_version == NGX_HTTP_VERSION_11[\s\S]*request_body_no_buffering = 1/);
  assert.match(p.at(file, 1870), /ctx->status.http_version < NGX_HTTP_VERSION_11[\s\S]*connection_close = 1/);
});

test('TLS会话开关不保证复用，动态resolved peer和配置组安装不同回调', () => {
  const p = runtimeEvidence('proxy_ssl_session_reuse');
  const rr = 'src/http/ngx_http_upstream_round_robin.c';
  assert.match(p.at(upstreamFile, 1725), /u->conf->ssl_session_reuse[\s\S]*u->peer.set_session[\s\S]*NGX_HTTP_INTERNAL_SERVER_ERROR/);
  assert.match(p.at(upstreamFile, 1853), /u->peer.save_session/);
  assert.match(p.at(rr, 301), /ngx_http_upstream_set_round_robin_peer_session[\s\S]*ngx_http_upstream_save_round_robin_peer_session/);
  assert.match(p.at(rr, 422), /ngx_http_upstream_empty_set_session[\s\S]*ngx_http_upstream_empty_save_session/);
  assert.match(p.at(rr, 841), /ngx_http_upstream_empty_set_session[\s\S]*return NGX_OK/);
  assert.match(p.at(rr, 848), /ngx_http_upstream_empty_save_session[\s\S]*return;/);
});

test('版本默认声明有本步合并依据，状态行错误区分缓存提前返回', () => {
  const p = runtimeEvidence('proxy_http_version');
  const file = 'src/http/modules/ngx_http_proxy_module.c';
  checkStepBoundary(p.value, /^有效 proxy_http_version/, [/默认为1.0/], [
    [file, 3831, /ngx_conf_merge_uint_value\(conf->http_version[\s\S]*NGX_HTTP_VERSION_10/],
  ]);
  const response = p.value.runtime.steps.find(step => /^上游返回响应状态行/.test(step.condition));
  assert.match(response.action, /r->cache/);
  assert.match(response.action, /r->cache[\s\S]*仅设置[\s\S]*返回 NGX_OK/);
  assert.match(response.action, /不.{0,8}(设置|执行|置).*connection_close/);
  const code = p.at(file, 1827);
  assert.match(code, /#if \(NGX_HTTP_CACHE\)[\s\S]*if \(r->cache\) \{\s*r->http_version = NGX_HTTP_VERSION_9;\s*return NGX_OK;\s*\}/);
  assert.match(code, /#endif[\s\S]*u->state->status = NGX_HTTP_OK;\s*u->headers_in.connection_close = 1/);
});

test('赋值失败、空头屏蔽、Host/SNI及临时peer边界绑定到各自步骤', () => {
  const proxy = 'src/http/modules/ngx_http_proxy_module.c';
  const rr = 'src/http/ngx_http_upstream_round_robin.c';
  const boundaries = [
    ['http_set', /^执行到 set 的值代码/, [/script_exit/, /status=500/, /phase checker finalize/], [
      ['src/http/ngx_http_script.c', 1779, /ngx_http_script_exit[\s\S]*NGX_HTTP_INTERNAL_SERVER_ERROR/],
      ['src/http/ngx_http_core_module.c', 943, /ngx_http_finalize_request\(r, rc\)/],
    ]],
    ['stream_set', /^按当前 server commands/, [/NGX_STREAM_INTERNAL_SERVER_ERROR/, /不是向客户端发送 HTTP 500/], [
      ['src/stream/ngx_stream_set_module.c', 89, /ngx_stream_complex_value[\s\S]*NGX_ERROR/],
      ['src/stream/ngx_stream_core_module.c', 221, /NGX_STREAM_INTERNAL_SERVER_ERROR[\s\S]*ngx_stream_finalize_session/],
    ]],
    ['proxy_set_header', /^可能透传客户端原始请求头/, [/hash 命中则跳过/, /空配置和空求值字段仍占 hash/], [
      [proxy, 1522, /ngx_hash_find\(&headers->hash[\s\S]*continue/],
    ]],
    ['proxy_set_header', /^生成 Host 值/, [/不覆写 resolved 连接目标/, /SNI 还需 ssl_server_name/], [
      [upstreamFile, 1705, /ssl_server_name \|\| u->conf->ssl_verify/],
      [upstreamFile, 1899, /!u->conf->ssl_server_name[\s\S]*goto done/],
    ]],
    ['proxy_http_version', /^非缓冲原 chunked 正文/, [/1.1不改默认 Connection: close/, /不自动建立 keepalive 池/], [
      [proxy, 824, /ngx_string\("Connection"\), ngx_string\("close"\)/],
      [proxy, 1018, /http_version == NGX_HTTP_VERSION_11[\s\S]*request_body_no_buffering = 1/],
    ]],
    ['proxy_ssl_session_reuse', /^确定目标是已配置组/, [/empty/, /配置组/], [
      [rr, 301, /ngx_http_upstream_set_round_robin_peer_session/],
      [rr, 422, /ngx_http_upstream_empty_set_session/],
      [rr, 848, /ngx_http_upstream_empty_save_session[\s\S]*return;/],
      [upstreamFile, 715, /ngx_strncasecmp[\s\S]*goto found/],
    ]],
    ['proxy_ssl_session_reuse', /^设置候选后握手/, [/u->connect_timeout/, /不证明样例启用了这些回调/, /FT_TIMEOUT/], [
      ['patches/nginx-1.27.1-upstream_timeout_fields.patch', 40, /\+.*u->connect_timeout/],
      [upstreamFile, 1825, /c->write->timedout[\s\S]*NGX_HTTP_UPSTREAM_FT_TIMEOUT/],
    ]],
  ];
  for (const [name, condition, wording, anchors] of boundaries) {
    const value = runtimeEvidence(name).value;
    const check = detail => checkStepBoundary(detail, condition, wording, anchors);
    check(value);
    const wrongText = structuredClone(value);
    wrongText.runtime.steps.find(step => condition.test(step.condition)).action = '仅凭配置即可保证目标正确及连接复用';
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

test('代理链五项真实查询与Markdown一致，旧版本不冒充运行时已核实', async () => {
  const client = createKnowledgeClient({ knowledgeBase: 'http://fixture.test/knowledge/', siteBase: 'http://fixture.test/', timeoutMs: 1000,
    fetcher: async url => ({ ok: true, json: async () => json(`dist${new URL(url).pathname}`) }) });
  for (const target of targets) {
    const entry = index.directives.find(entry => entry.name === target.name && entry.module === target.module);
    const value = detailFor(entry);
    const result = await client.querySingle(target.name, { context: target.context, module: target.module });
    assert.equal(result.status, 'matched'); assert.equal(result.detail.verification, 'deep_verified');
    assert.deepEqual(result.detail.runtime, value.runtime);
    assert.ok(result.markdown.includes(RUNTIME_SCOPE_NOTE));
    for (const step of value.runtime.steps) { assert.ok(result.markdown.includes(step.condition)); assert.ok(result.markdown.includes(step.action)); }
    for (const ref of value.runtime.corroboration_source_ids) assert.ok(result.markdown.includes(value.sources.find(source => source.id === ref).url));
    const old = await client.querySingle(target.name, { context: target.context, module: target.module, release: baseline.release_id });
    assert.equal(old.status, 'matched'); assert.equal(old.detail.verification, 'basic_verified');
    assert.equal(old.detail.runtime, undefined); assert.ok(old.markdown.includes('运行时链路：' + NO_RUNTIME_NOTE));
  }
  const parsed = parseConfig('events {} stream { server { listen 9000; set $target backend.example:443; proxy_pass $target; } } http { server { listen 9001; location / { set $target backend.example; proxy_set_header Host $target; proxy_http_version 1.1; proxy_ssl_session_reuse on; proxy_pass https://$target; } } }', { mode: 'main' });
  assert.equal(parsed.errors.length, 0);
  const matches = parsed.directives.map(item => matchDirective(item, index));
  assert.ok(matches.every(match => match.status === 'matched'));
  assert.deepEqual(matches.flatMap(match => match.candidates).filter(entry => identities.includes(entry.id)).map(entry => entry.id).sort(), [...identities].sort());
});
