import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { prepareKnowledgeFacts, validatePublication } from '../scripts/build.mjs';

const root = resolve(import.meta.dirname, '..');
const json = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const config = await json('project.config.json');
const matrix = await json('analysis/components.json');
const audit = await json(config.nginx_patch_audit);
const knowledge = await json(config.knowledge_file);
const index = await json('dist/knowledge/index.json');
const identities = [
  ['ngx_http_core_module', 'resolver'],
  ['ngx_http_proxy_module', 'proxy_pass'],
  ['ngx_http_rewrite_module', 'set'],
  ['ngx_http_proxy_module', 'proxy_set_header'],
];
const items = identities.map(([module, name]) => {
  const matches = knowledge.filter(item => item.component === 'nginx' && item.module === module && item.name === name);
  assert.equal(matches.length, 1);
  return matches[0];
});
const frozen = new Map([
  ['nginx', { ...matrix.components.find(item => item.component === 'nginx'), repository: 'https://github.com/nginx/nginx' }],
  ['nginx-docs', { ...config.documentation_sources.find(item => item.component === 'nginx-docs'), local_path: config.documentation_sources.find(item => item.component === 'nginx-docs').path }],
  ['openresty', { local_path: config.main_repo, revision: audit.openresty_revision, version: config.openresty_version, repository: 'https://github.com/openresty/openresty' }],
]);
const files = new Map();
function sourceFor(evidence) {
  const source = frozen.get(evidence.component);
  assert.ok(source, `未知证据组件 ${evidence.component}`);
  const key = `${evidence.component}/${evidence.file}`;
  if (!files.has(key)) files.set(key, execFileSync('git', ['-C', resolve(root, source.local_path), 'show', `${source.revision}:${evidence.file}`], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }).replaceAll('\r\n', '\n'));
  const lines = files.get(key).split('\n');
  assert.ok(Number.isInteger(evidence.start_line) && Number.isInteger(evidence.end_line));
  assert.ok(evidence.start_line > 0 && evidence.end_line >= evidence.start_line && evidence.end_line <= lines.length);
  return { ...evidence, version: source.version, revision: source.revision,
    code: lines.slice(evidence.start_line - 1, evidence.end_line).join('\n'),
    url: `${source.repository}/blob/${source.revision}/${evidence.file}#L${evidence.start_line}-L${evidence.end_line}`,
    kind: evidence.file.endsWith('.patch') ? 'openresty_patch' : 'upstream' };
}
const body = (item, id) => {
  const evidence = item.evidence.find(source => source.id === id);
  assert.ok(evidence, `${item.name} 缺少 ${id}`);
  return sourceFor(evidence).code;
};
const [resolver, proxyPass, set, headers] = items;

test('实际发布的新旧证据集合与固定片段一致，拒绝错误新片段和额外证据', async () => {
  const previous = await json('dist/knowledge/releases/1.27.1.1-948dd5954553c1bf/index.json');
  for (const item of items) {
    const entry = index.directives.find(entry => entry.component === item.component && entry.module === item.module && entry.name === item.name);
    const oldEntry = previous.directives.find(candidate => candidate.id === entry.id);
    const before = await json(`dist/knowledge/${oldEntry.detail_path}`);
    const published = await json(`dist/knowledge/${entry.detail_path}`);
    const expected = new Map(before.sources.map(source => [source.id, source]));
    for (const evidence of item.evidence) expected.set(evidence.id, sourceFor(evidence));
    const ordered = sources => [...sources].sort((a, b) => a.id.localeCompare(b.id));
    const check = sources => assert.deepEqual(ordered(sources), ordered(expected.values()), entry.id);
    check(published.sources);
    const added = published.sources.find(source => !before.sources.some(old => old.id === source.id));
    assert.ok(added);
    const wrong = structuredClone(published.sources);
    wrong.find(source => source.id === added.id).code = '错误片段';
    assert.throws(() => check(wrong), assert.AssertionError);
    assert.throws(() => check([...published.sources, { ...added, id: 'unauthorized-source' }]), assert.AssertionError);
  }
});

test('四项证据来自锁定版本，事实包括不适用说明都绑定真实 source_ids', () => {
  assert.equal(frozen.get('nginx').revision, audit.nginx_revision);
  for (const source of frozen.values()) {
    assert.equal(execFileSync('git', ['-C', resolve(root, source.local_path), 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), source.revision);
  }
  for (const item of items) {
    assert.equal(Object.hasOwn(item, 'verification'), false);
    const sources = item.evidence.map(sourceFor);
    assert.equal(new Set(sources.map(source => source.id)).size, sources.length);
    const ids = new Set(['registration', 'configuration-definition', 'distribution-version', ...sources.map(source => source.id)]);
    for (const fact of [item.defaults, item.inheritance, ...item.limitations, item.patch_status]) {
      assert.ok(fact.source_ids.length > 0);
      for (const id of fact.source_ids) assert.ok(ids.has(id), `${item.name}: ${id}`);
    }
    for (const fact of [item.defaults, item.inheritance]) {
      assert.ok(['verified', 'not_applicable'].includes(fact.status));
      assert.ok(fact.text.trim());
    }
    for (const evidence of item.evidence.filter(evidence => evidence.component === 'nginx')) {
      assert.ok(item.patch_status.source_ids.includes(evidence.id), `${item.name} 补丁核对未覆盖 ${evidence.id}`);
    }
  }
});

test('HTTP resolver 无默认服务器，dummy、父对象继承和显式选项有独立证据', () => {
  assert.equal(resolver.defaults.status, 'verified');
  assert.equal(resolver.inheritance.status, 'verified');
  const merge = body(resolver, 'resolver-merge');
  assert.match(merge, /if \(conf->resolver == NULL\)/);
  assert.match(merge, /prev->resolver = ngx_resolver_create\(cf, NULL, 0\)/);
  assert.match(merge, /conf->resolver = prev->resolver/);
  assert.match(body(resolver, 'resolver-empty'), /connections.nelts == 0[\s\S]*NGX_NO_RESOLVER/);
  assert.match(body(resolver, 'resolver-create'), /r->ipv4 = 1/);
  assert.match(body(resolver, 'resolver-create'), /NGX_HAVE_INET6[\s\S]*r->ipv6 = 1/);
  assert.match(body(resolver, 'implementation-0'), /u.default_port = 53/);
  assert.match(body(resolver, 'resolver-positive-ttl'), /r->valid \? r->valid : \(time_t\) rn->ttl/);
  assert.match(body(resolver, 'resolver-local-patch'), /NGX_WIN32[\s\S]*names\[i\].data, "local="/);
  assert.match(resolver.defaults.text, /不会自动读取系统 DNS/);
  assert.match(resolver.inheritance.text, /不把父层 DNS 服务器列表逐项合并/);
});

test('HTTP proxy_pass 无默认目标，匿名块仅在双空目标时复制且不推广到普通 location', () => {
  assert.match(body(proxyPass, 'proxy-target-create'), /ngx_pcalloc/);
  const merge = body(proxyPass, 'proxy-target-merge');
  assert.match(merge, /clcf->noname\s*&& conf->upstream.upstream == NULL && conf->proxy_lengths == NULL/);
  for (const field of ['upstream.upstream', 'location', 'vars', 'proxy_lengths', 'proxy_values', 'ssl']) {
    assert.ok(merge.includes(`conf->${field} = prev->${field}`));
  }
  assert.match(merge, /NGX_HTTP_SSL/);
  assert.match(merge, /clcf->lmt_excpt && clcf->handler == NULL/);
  assert.match(body(proxyPass, 'proxy-if-noname'), /clcf->noname = 1/);
  assert.match(body(proxyPass, 'proxy-limit-except-noname'), /clcf->noname = 1[\s\S]*clcf->lmt_excpt = 1/);
  assert.match(proxyPass.defaults.text, /无默认 proxy_pass URL/);
  assert.match(proxyPass.inheritance.text, /普通嵌套 location 不据此自动继承/);
});

test('HTTP set 默认值不适用但有解释，codes 不复制父级且 if 编译序列和请求变量须区分', () => {
  assert.equal(set.defaults.status, 'not_applicable');
  assert.equal(set.inheritance.status, 'verified');
  const merge = body(set, 'rewrite-create-merge');
  assert.match(merge, /ngx_pcalloc/);
  assert.match(merge, /if \(conf->codes == NULL\) \{\s*return NGX_CONF_OK/);
  assert.match(merge, /if \(conf->codes == prev->codes\) \{\s*return NGX_CONF_OK/);
  assert.doesNotMatch(merge, /conf->codes\s*=\s*prev->codes/);
  assert.match(merge, /\*code = \(uintptr_t\) NULL/);
  const conditional = body(set, 'rewrite-if-codes');
  assert.match(conditional, /nlcf->codes = lcf->codes/);
  assert.match(conditional, /ngx_conf_parse[\s\S]*nlcf->codes = NULL/);
  assert.match(body(set, 'rewrite-phase-registration'), /SERVER_REWRITE_PHASE[\s\S]*NGX_HTTP_REWRITE_PHASE/);
  assert.match(body(set, 'implementation-1'), /\*v = ngx_http_variable_null_value/);
  assert.match(body(set, 'implementation-2'), /r->variables\[code->index\]/);
  assert.match(body(set, 'rewrite-order-doc'), /server[\s\S]*executed sequentially[\s\S]*found location/);
  assert.match(set.defaults.text, /不能把这一分支推广/);
  assert.match(set.inheritance.text, /前面 set 写入的请求变量可被后续读取/);
});

test('HTTP proxy_set_header 常规与缓存默认表、空显式字段及原整组继承证据保留', () => {
  const defaults = body(headers, 'implementation-0');
  for (const [name, value] of [['Host', '$proxy_host'], ['Connection', 'close'], ['Content-Length', '$proxy_internal_body_length'], ['Transfer-Encoding', '$proxy_internal_chunked'], ['TE', ''], ['Keep-Alive', ''], ['Expect', ''], ['Upgrade', '']]) {
    assert.ok(defaults.includes(`ngx_string("${name}"), ngx_string("${value}")`));
  }
  const init = body(headers, 'implementation-3');
  assert.match(init, /\*s = src\[i\][\s\S]*h = default_headers/);
  assert.match(init, /ngx_strcasecmp[\s\S]*goto next/);
  assert.match(body(headers, 'proxy-cache-headers-init'), /NGX_HTTP_CACHE[\s\S]*if \(conf->upstream.cache\)/);
  assert.match(body(headers, 'proxy-cache-default-headers'), /If-Modified-Since[\s\S]*\$upstream_cache_last_modified/);
  assert.match(body(headers, 'proxy-cache-default-headers'), /If-None-Match[\s\S]*\$upstream_cache_etag/);
  assert.deepEqual(headers.inheritance, { status: 'verified', text: '当前层没有 proxy_set_header 时继承父层整组定义；当前层定义后不与父层数组逐项合并，内部默认头再按缺失字段补入。', source_ids: ['implementation-3', 'implementation-4'] });
});

test('四项事实通过真实 publication 契约的内存校验，保留发布等级且拒绝悬空证据', async () => {
  const details = await Promise.all(index.directives.map(entry => json(`dist/knowledge/${entry.detail_path}`)));
  const references = await json(`dist/knowledge/${index.references_path}`);
  for (const item of items) {
    const detail = details.find(detail => detail.component === item.component && detail.module === item.module && detail.name === item.name);
    assert.ok(detail);
    assert.equal(detail.verification, 'deep_verified');
    const sources = new Map(detail.sources.map(source => [source.id, source]));
    for (const evidence of item.evidence) sources.set(evidence.id, sourceFor(evidence));
    sources.set('configuration-definition', sourceFor({ id: 'configuration-definition', ...item.callback_definition }));
    detail.sources = [...sources.values()];
    const prepared = prepareKnowledgeFacts(item, detail.sources, item.component, item.patch_status.status);
    for (const field of ['defaults', 'inheritance', 'limitations', 'patch_status']) detail[field] = prepared[field];
    assert.deepEqual(detail.defaults, item.defaults);
    assert.deepEqual(detail.inheritance, item.inheritance);
  }
  assert.equal(index.coverage.basic_verified_count, 1041);
  assert.equal(index.coverage.deep_verified_count, index.directives.filter(entry => entry.verification === 'deep_verified').length);
  assert.equal(validatePublication(index, details, references), index);
  const broken = structuredClone(details);
  const target = broken.find(detail => detail.module === 'ngx_http_rewrite_module' && detail.name === 'set');
  target.defaults.source_ids.push('missing-sample-evidence');
  assert.throws(() => validatePublication(index, broken, references), /知识证据引用缺失/);
});
