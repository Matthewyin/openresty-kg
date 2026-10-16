import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { createKnowledgeClient, validateReferences, validateIndex, relatedCandidates } from '../src/query/knowledge.mjs';
import { validatePublication } from '../scripts/build.mjs';
import { parseSingle } from '../src/core/core.mjs';

const root = resolve(import.meta.dirname, '..');
const index = JSON.parse(await readFile(resolve(root, 'dist/knowledge/index.json'), 'utf8'));
const publication = JSON.parse(await readFile(resolve(root, 'dist/knowledge', index.references_path), 'utf8'));
function fixture(response = publication) {
  const requests = [];
  const client = createKnowledgeClient({ knowledgeBase: 'http://knowledge.test/knowledge/', siteBase: 'http://knowledge.test/', timeoutMs: 1000,
    fetcher: async (url, options) => {
      requests.push({ url: String(url), options });
      if (String(url).endsWith('/index.json')) return { ok: true, json: async () => structuredClone(index) };
      return { ok: true, json: async () => structuredClone(response) };
    } });
  return { client, requests };
}

test('参考发布独立于指令匹配及覆盖计数，固定发布读取且不传配置', async () => {
  assert.equal(validateReferences(publication, index), publication);
  assert.equal(publication.references.length, 8);
  assert.equal(publication.references.filter(item => item.kind === 'lua_api').length, 4);
  assert.equal(index.coverage.registration_count, index.directives.length);
  assert.equal(index.coverage.basic_verified_count, index.directives.filter(entry => entry.verification !== 'registration_only').length);
  const { client, requests } = fixture();
  const result = await client.loadReferences(index);
  assert.equal(result.status, 'ok');
  assert.deepEqual(result.references, publication);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, `http://knowledge.test/knowledge/${index.references_path}`);
  assert.equal(requests[0].options.method, 'GET');
  assert.equal(requests[0].options.body, undefined);
  const unknown = await client.querySingle('ngx.log;');
  assert.equal(unknown.status, 'unknown');
});

test('旧发布没有参考路径时无网络读取，仍可加载配置索引', async () => {
  const old = structuredClone(index); delete old.references_path;
  const { client, requests } = fixture();
  assert.equal(validateIndex(old), old);
  assert.deepEqual(await client.loadReferences(old), { status: 'not_provided', references: null, errors: [] });
  assert.equal(requests.length, 0);
  assert.equal((await client.loadIndex()).release_id, index.release_id);
});

test('参考发布不允许跨版本或跨发布路径', async () => {
  for (const mutate of [value => { value.release_id = 'other'; }, value => { value.openresty_version = 'other'; }]) {
    const broken = structuredClone(publication); mutate(broken);
    const result = await fixture(broken).client.loadReferences(index);
    assert.equal(result.status, 'knowledge_unavailable');
    assert.equal(result.errors[0].code, 'release_mismatch');
    assert.equal(result.references, null);
  }
  assert.throws(() => validateIndex({ ...index, references_path: 'references.json' }), /参考库路径/);
});

test('畸形参考嵌套字段局部返回错误，不破坏配置索引', async () => {
  for (const mutate of [
    value => { value.references = null; },
    value => { value.references[0] = null; },
    value => { value.references.push(value.references[0]); },
    value => { value.references[0].kind = 'directive'; },
    value => { value.references[0].limitations = [null]; },
    value => { value.references[0].summary = ''; },
    value => { value.references[0].sources = []; },
    value => { value.references[0].sources[0].revision = 'HEAD'; },
    value => { value.references[0].sources[0].code = ''; },
    value => { value.references[0].sources[0].url = 'javascript:alert(1)'; },
    value => { value.references[0].sources.push(value.references[0].sources[0]); },
  ]) {
    const broken = structuredClone(publication); mutate(broken);
    const { client } = fixture(broken);
    const result = await client.loadReferences(index);
    assert.equal(result.status, 'knowledge_unavailable');
    assert.equal(result.errors[0].code, 'invalid_references');
    assert.equal(result.references, null);
    assert.equal((await client.loadIndex()).release_id, index.release_id);
  }
});

test('所有新增参考源码逐字对应冻结 Git 原文', () => {
  for (const reference of publication.references) for (const source of reference.sources) {
    const repo = source.component === 'openresty' ? 'openresty' : `repos/${source.component}`;
    const code = execFileSync('git', ['-C', resolve(root, repo), 'show', `${source.revision}:${source.file}`], { encoding: 'utf8' });
    assert.equal(source.code, code.replaceAll('\r\n', '\n').split('\n').slice(source.start_line - 1, source.end_line).join('\n'), reference.id);
  }
});

test('关联名保留多个模块，未知不编造，单项保留原外部引用', () => {
  const entries = relatedCandidates('proxy_pass', index);
  assert.ok(entries.some(entry => entry.module === 'ngx_http_proxy_module'));
  assert.ok(entries.some(entry => entry.module === 'ngx_stream_proxy_module'));
  assert.deepEqual(relatedCandidates('not_collected_directive', index), []);
  for (const input of ['include /private/SECRET/*.conf;', 'content_by_lua_file /private/SECRET.lua;']) {
    const parsed = parseSingle(input);
    assert.equal(parsed.status, 'ok');
    assert.ok(parsed.directive.external_references[0].value.includes('SECRET'));
  }
});

test('发布门禁检查最后参考，不允许缺失已声明参考资源', async () => {
  const details = await Promise.all(index.directives.map(async entry => JSON.parse(await readFile(resolve(root, 'dist/knowledge', entry.detail_path), 'utf8'))));
  assert.equal(validatePublication(index, details, publication), index);
  const broken = structuredClone(publication); broken.references.at(-1).sources[0].revision = 'HEAD';
  assert.throws(() => validatePublication(index, details, broken), /源码引用/);
  assert.throws(() => validatePublication(index, details), /参考库/);
});
