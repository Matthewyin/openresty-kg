import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createKnowledgeClient } from '../src/query/knowledge.mjs';

const site = process.env.KNOWLEDGE_TEST_URL;
if (!site) throw new Error('需要 KNOWLEDGE_TEST_URL 指向有限时长 HTTP 预览');
const root = resolve(import.meta.dirname, '..');
const config = JSON.parse(await readFile(resolve(root, 'project.config.json'), 'utf8'));
const requests = [];
const client = createKnowledgeClient({ knowledgeBase: new URL('./knowledge/', site), siteBase: site,
  timeoutMs: config.request_timeout_ms, fetcher: async (url, options) => {
    requests.push({ url: String(url), method: options.method, body: options.body });
    return fetch(url, options);
  } });
const index = await client.loadIndex();
for (const [name, module, context, component] of [
  ['upstream_list', 'ndk_http_module', 'http', 'ngx_devel_kit'],
  ['set_encode_base64', 'ngx_http_set_misc_module', 'http.location', 'set-misc-nginx-module'],
  ['array_split', 'ngx_http_array_var_module', 'http.location', 'array-var-nginx-module'],
  ['set_form_input', 'ngx_http_form_input_module', 'http.location', 'form-input-nginx-module'],
]) {
  const result = await client.querySingle(`${name} PRIVATE_NDK_VALUE;`, { module, context, release: index.release_id });
  assert.equal(result.status, 'matched');
  assert.equal(result.detail.component, component);
  assert.equal(result.detail.verification, 'registration_only');
  const published = JSON.parse(await readFile(resolve(root, config.output_dir, 'knowledge', result.match.candidates[0].detail_path), 'utf8'));
  assert.deepEqual(result.detail, published);
  assert.ok(result.markdown.includes(result.detail.sources[0].url));
  if (name === 'upstream_list') {
    assert.ok(result.detail.availability.compile_guards.some(guard => guard.includes('NDK_UPSTREAM_LIST')));
    assert.equal(result.detail.sources[0].file, 'src/ndk_upstream_list.h');
    assert.ok(result.detail.sources.some(source => source.file === 'src/ndk.c'));
    assert.ok(result.detail.sources.some(source => source.file === 'objs/ndk_config.c'));
    assert.equal(result.detail.configuration_entry.symbol, 'ndk_upstream_list');
  }
}
assert.equal(index.directives.filter(entry => entry.verification === 'basic_verified').length, 23);
assert.equal((await client.loadReferences(index)).references.references.length, 8);
assert.ok(!index.directives.some(entry => entry.component === 'ngx_devel_kit' && ['set_concat2', 'set_prepend_hello'].includes(entry.name)));
const old = await client.querySingle('multi_accept on;', { context: 'events', release: '1.27.1.1-dee833a2c9381a27' });
assert.equal(old.detail.verification, 'basic_verified');
assert.equal(old.release_id, '1.27.1.1-dee833a2c9381a27');
assert.ok(requests.every(request => request.method === 'GET' && request.body === undefined));
assert.ok(!JSON.stringify(requests).includes('PRIVATE_NDK_VALUE'));
console.log(JSON.stringify({ release_id: index.release_id, new_component_queries: 4, website_data_matches_query: true,
  ndk_owner_and_include_sources: true, examples_excluded: true, basic_count: 23, reference_count: 8,
  old_release_retained: true, static_get_only: true, no_input_uploaded: true }));
