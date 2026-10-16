import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createKnowledgeClient, formatFact } from '../src/query/knowledge.mjs';
import { parseConfig, matchDirective } from '../src/core/core.mjs';

const site = process.env.KNOWLEDGE_TEST_URL;
if (!site) throw new Error('需要 KNOWLEDGE_TEST_URL 指向有限时长 HTTP 预览');
const root = resolve(import.meta.dirname, '..');
const config = JSON.parse(await readFile(resolve(root, 'project.config.json'), 'utf8'));
const requests = [];
const client = createKnowledgeClient({ knowledgeBase: new URL('./knowledge/', site), siteBase: site, timeoutMs: config.request_timeout_ms,
  fetcher: async (url, options) => { requests.push({url:String(url),method:options.method,body:options.body}); return fetch(url,options); } });
const index = await client.loadIndex();
for (const [name, context] of [['worker_processes','main'],['worker_connections','events'],['multi_accept','events'],['accept_mutex','events'],['accept_mutex_delay','events']]) {
  const result = await client.querySingle(`${name} PRIVATE_INPUT_VALUE;`, {context,release:index.release_id});
  assert.equal(result.status, 'matched');
  assert.equal(result.detail.verification, 'basic_verified');
  assert.ok(result.markdown.includes(formatFact(result.detail.defaults)));
  const expected = JSON.parse(await readFile(resolve(root,config.output_dir,'knowledge',result.match.candidates[0].detail_path),'utf8'));
  assert.deepEqual(result.detail,expected);
  assert.ok(result.detail_url.includes(index.release_id));
}
const parsed = parseConfig('events { multi_accept on; worker_connections 65535; }');
assert.equal(parsed.errors.length,0);
assert.ok(parsed.directives.filter(directive=>directive.name!=='events').every(directive=>matchDirective(directive,index).status==='matched'));
const delay = await client.querySingle('accept_mutex_delay 500ms;',{context:'events',release:index.release_id});
assert.ok(delay.markdown.includes('EMFILE/ENFILE'));
const multi = await client.querySingle('multi_accept on;',{context:'events',release:index.release_id});
assert.ok(multi.markdown.includes('ENOSYS'));
assert.ok(multi.markdown.includes('ECONNABORTED'));
assert.equal((await client.loadReferences(index)).references.references.length,8);
const old = await client.querySingle('worker_connections 65535;',{context:'events',release:'1.27.1.1-a90b2ce291c5ed35'});
assert.equal(old.detail.verification,'registration_only');
assert.ok(requests.every(request=>request.method==='GET'&&request.body===undefined));
assert.ok(!JSON.stringify(requests).includes('PRIVATE_INPUT_VALUE'));
console.log(JSON.stringify({release_id:index.release_id,core_queries:5,events_parsed:true,website_data_matches_query:true,
  corrected_error_boundaries:true,old_release_retained:true,reference_count:8,static_get_only:true,no_input_uploaded:true}));
