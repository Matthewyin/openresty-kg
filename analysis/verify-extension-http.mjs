import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createKnowledgeClient } from '../src/query/knowledge.mjs';
import { parseConfig, matchDirective } from '../src/core/core.mjs';

const site = process.argv[2];
if (!site) throw new Error('需要传入本地预览 URL');
const config = JSON.parse(await readFile(new URL('../project.config.json', import.meta.url), 'utf8'));
const requests = [];
const client = createKnowledgeClient({
  knowledgeBase: new URL('knowledge/', site).href, siteBase: site,
  timeoutMs: config.request_timeout_ms,
  fetcher: (url, options) => { requests.push({ url: String(url), ...options, signal: undefined }); return fetch(url, options); },
});
const index = await client.loadIndex();
const baselineRelease = '1.27.1.1-eeabda4eba7f5c16';
const baseline = await client.loadIndex(baselineRelease);
assert.equal(baseline.directives.length, 1017);
const baselineResponse = await fetch(new URL(`knowledge/releases/${baselineRelease}/index.json`, site));
assert.equal(baselineResponse.status, 200);
assert.equal(createHash('sha256').update(Buffer.from(await baselineResponse.arrayBuffer())).digest('hex'),
  '961e1ad50943cd57abbb5847d0aae800d1bfce4e4f886e8f2a016c1a8c358d6d');
const entries = index.directives.filter(entry => entry.component === 'nginx-module-vts');
assert.equal(entries.length, 24);
assert.equal(index.directives.length, baseline.directives.length + entries.length);
const output = resolve(dirname(fileURLToPath(import.meta.url)), '..', config.output_dir, 'knowledge');
for (const oldEntry of baseline.directives) {
  const entry = index.directives.find(item => item.id === oldEntry.id);
  assert.ok(entry, oldEntry.id);
  const previous = JSON.parse(await readFile(resolve(output, oldEntry.detail_path), 'utf8'));
  const current = JSON.parse(await readFile(resolve(output, entry.detail_path), 'utf8'));
  for (const key of Object.keys(previous).filter(key => !['schema_version', 'release_id'].includes(key))) {
    assert.deepEqual(current[key], previous[key], `${oldEntry.id}: ${key}`);
  }
}
for (const entry of entries) {
  const result = await client.querySingle(entry.name, { context: entry.contexts[0] });
  assert.equal(result.status, 'matched', entry.name);
  assert.equal(result.detail.verification, 'basic_verified', entry.name);
  assert.ok(result.detail.summary && result.detail.syntax, entry.name);
  assert.ok(result.detail.sources.some(source => source.id === 'registration'
    && source.revision === '52fe11e44c47a49b052be89e36dfa17d81bf52a5'), entry.name);
  assert.ok(result.markdown.includes('部门扩展'), entry.name);
}
const sample = parseConfig(`http {
  vhost_traffic_status_zone;
  vhost_traffic_status_filter_by_host on;
  server { location /status {
    vhost_traffic_status_display;
    vhost_traffic_status_display_format html;
  } }
}`);
assert.equal(sample.errors.length, 0);
for (const directive of sample.directives.filter(item => item.name.startsWith('vhost_traffic_status'))) {
  assert.equal(matchDirective(directive, index).status, 'matched', directive.name);
}
for (const name of ['vhost_traffic_status_display', 'vhost_traffic_status_display_format']) {
  assert.equal((await client.querySingle(name, { context: 'http' })).status, 'context_mismatch');
  assert.equal((await client.querySingle(name, { context: 'stream.server' })).status, 'context_mismatch');
}
assert.equal((await client.querySingle('department_not_collected on;', { context: 'http' })).status, 'unknown');
assert.equal((await client.querySingle('vhost_traffic_status_zone', { context: 'http', release: baselineRelease })).status, 'unknown');
const privateQuery = await client.querySingle('vhost_traffic_status_filter_by_set_key PRIVATE_EXTENSION_SAMPLE;', { context: 'http' });
assert.equal(privateQuery.status, 'matched');
assert.ok(requests.every(request => request.method === 'GET' && request.body === undefined));
assert.ok(!JSON.stringify(requests).includes('PRIVATE_EXTENSION_SAMPLE'));
const old = await client.querySingle('worker_connections 65535;', { context: 'events', release: baselineRelease });
assert.equal(old.status, 'matched');
assert.equal(old.release_id, baselineRelease);
console.log(JSON.stringify({ release: index.release_id, extension_queries: entries.length,
  sample_matches: 4, baseline_count: baseline.directives.length, baseline_immutable: true,
  baseline_details_preserved: baseline.directives.length,
  wrong_context_rejected: true, unknown_separate: true, static_get_privacy: true }, null, 2));
