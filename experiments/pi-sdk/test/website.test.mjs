import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, symlink, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { serve } from '../server.mjs';
import { get as httpGet } from 'node:http';
import { ROOT } from '../src/session.mjs';
import { fixtures } from './fixtures/configs.mjs';

test('原站同源接入：静态根、Host/Origin、发布锁定、短轮询、追问缓存和取消', async () => {
  await mkdir(join(ROOT, '.state'), { recursive: true });
  const temporary = await mkdtemp(join(ROOT, '.state/website-test-'));
  const app = await serve({ port: 0, stateDir: join(temporary, 'state'), mockDelayMs: 500 }, { website: true });
  const get = path => fetch(new URL(path, app.url));
  const post = (path, body, headers = {}) => fetch(new URL(path, app.url), { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  try {
    const status = await (await get('/api/status')).json();
    assert.equal(status.website, true); assert.equal(status.siteBase, app.url);
    assert.ok(status.pollIntervalMs > 0); assert.ok(!JSON.stringify(status).includes('apiKey'));
    const page = await get('/'); assert.equal(page.status, 200);
    assert.match(await page.text(), /OpenResty 配置知识站/);
    assert.match(page.headers.get('content-security-policy'), /connect-src 'self'/);
    assert.equal((await get('/src/core/parser.mjs')).status, 200);
    for (const path of ['/.env', '/.state/metadata.json', '/experiments/pi-sdk/config.json', '/..%2f.env', '/api/unknown']) assert.equal((await get(path)).status, 404, path);
    const wrongHost = await new Promise((resolve, reject) => {
      httpGet(new URL('/api/status', app.url), { headers: { Host: 'outside.invalid' } }, response => { response.resume(); resolve(response.statusCode); }).on('error', reject);
    });
    assert.equal(wrongHost, 403);
    assert.equal((await post('/api/run', {}, { Origin: 'http://outside.invalid' })).status, 403);
    assert.equal((await post('/api/run', { request: fixtures.events })).status, 400);
    const release = JSON.parse(await readFile(join(app.spike.config.distDir, 'knowledge/index.json'), 'utf8')).release_id;
    const request = { ...fixtures.events, release, question: '默认值和继承？' };
    const accepted = await post('/api/run', { request }); assert.equal(accepted.status, 202);
    const started = await accepted.json();
    assert.equal((await post('/api/run', { request })).status, 409);
    const job = app.spike.jobs.get(started.requestId);
    for (let i = 0; i < 1000 && !job.phase && job.state === 'running'; i++) await delay(5);
    const brief = await (await get(`/api/jobs/${job.requestId}?brief=1`)).json();
    assert.equal(brief.state, 'running'); assert.equal(brief.summary.matched, 3);
    for (const key of ['items', 'parsed', 'matches']) assert.equal(brief[key], undefined);
    await job.done;
    const finished = await (await get(`/api/jobs/${job.requestId}?brief=1`)).json();
    assert.equal(finished.state, 'completed'); assert.equal(finished.knowledgeVersion.release, release);
    assert.ok(finished.modelSelection.citations.length); assert.ok(finished.items.length);
    const restored = await (await get(`/api/sessions/${job.sessionId}`)).json();
    assert.equal(restored.request.release, release); assert.ok(restored.messages > 0);
    const cached = await (await post('/api/run', { request })).json();
    await app.spike.jobs.get(cached.requestId).done;
    assert.equal(app.spike.jobs.get(cached.requestId).cacheHit, true);
    assert.equal(app.spike.jobs.get(cached.requestId).metrics.modelRoundTrips, 0);
    const bad = await (await post('/api/run', { request: { ...request, release: 'missing-release' } })).json();
    await app.spike.jobs.get(bad.requestId).done;
    assert.equal(app.spike.jobs.get(bad.requestId).state, 'failed');
    assert.equal(app.spike.jobs.get(bad.requestId).metrics.modelRoundTrips, 0);
    const pending = await (await post('/api/run', { request: { ...request, question: '取消这次追问' }, sessionId: job.sessionId })).json();
    const cancelled = await (await post('/api/cancel', { requestId: pending.requestId })).json();
    assert.equal(cancelled.state, 'cancelled');
  } finally { await app.close(); await rm(temporary, { recursive: true, force: true }); }
});

test('静态文件即使存在同名符号链接也不能读取构建根以外内容', async () => {
  const temporary = await mkdtemp(join(ROOT, '.state/website-path-'));
  const dist = join(temporary, 'dist'); await mkdir(dist);
  await writeFile(join(temporary, 'outside.json'), '{"synthetic":"not-public"}');
  await symlink(join(temporary, 'outside.json'), join(dist, 'escape.json'));
  const app = await serve({ port: 0, stateDir: join(temporary, 'state'), distDir: dist }, { website: true });
  try { assert.equal((await fetch(new URL('/escape.json', app.url))).status, 404); }
  finally { await app.close(); await rm(temporary, { recursive: true, force: true }); }
});
