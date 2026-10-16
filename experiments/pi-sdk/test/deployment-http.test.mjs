import test from 'node:test';
import assert from 'node:assert/strict';
import { request as httpRequest } from 'node:http';
import { mkdtemp, mkdir, readFile, readdir, writeFile, rm, chmod } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { serve } from '../server.mjs';
import { ROOT, loadConfig, cacheKey } from '../src/session.mjs';
import { fixtures } from './fixtures/configs.mjs';
import { detailUrl } from '../../../src/query/knowledge.mjs';

async function temporary(t) {
  await mkdir(join(ROOT, '.state'), { recursive: true });
  const dir = await mkdtemp(join(ROOT, '.state/deployment-http-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

async function application(t, overrides = {}, website = true) {
  const dir = await temporary(t);
  const app = await serve({ port: 0, mockDelayMs: 200, stateDir: join(dir, 'state'), ...overrides }, { website });
  t.after(() => app.close());
  return app;
}

function request(url, path, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const req = httpRequest({ hostname: target.hostname, port: target.port, path, method, headers }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString();
        resolve({ status: res.statusCode, headers: res.headers, text, json: () => JSON.parse(text) });
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.end(body);
  });
}

test('公开 origin：严格 Host/Origin、不信任转发头，网站链接使用公开地址', async t => {
  const origin = 'https://knowledge.invalid:8443';
  const app = await application(t, { publicOrigin: `${origin}/` });
  const headers = { Host: new URL(origin).host, Origin: origin };
  const status = await request(app.url, '/api/status', { headers });
  assert.equal(status.status, 200); assert.equal(status.json().siteBase, `${origin}/`);
  assert.equal(app.spike.config.publicOrigin, origin);
  assert.equal((await request(app.url, '/api/status', { headers: { Host: headers.Host } })).status, 200);
  for (const invalid of [
    {}, { Host: 'outside.invalid' }, { ...headers, Origin: 'https://outside.invalid' }, { ...headers, Origin: '' },
    { ...headers, Origin: 'null' }, { ...headers, Host: 'KNOWLEDGE.invalid:8443' },
    { Host: 'outside.invalid', 'X-Forwarded-Host': headers.Host, 'X-Forwarded-Proto': 'https', Forwarded: `host=${headers.Host};proto=https` },
  ]) {
    const denied = await request(app.url, '/api/status', { headers: invalid });
    assert.equal(denied.status, 403); assert.equal(denied.json().code, 'origin_rejected');
  }
  assert.equal((await request(app.url, 'https://outside.invalid/api/status', { headers })).status, 403);
  const release = JSON.parse(await readFile(join(app.spike.config.distDir, 'knowledge/index.json'), 'utf8')).release_id;
  const accepted = await request(app.url, '/api/run', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ request: { ...fixtures.events, release } }) });
  assert.equal(accepted.status, 202);
  const job = app.spike.jobs.get(accepted.json().requestId); await job.done;
  assert.equal(job.state, 'completed');
  const report = app.spike.view(job);
  const entry = report.matches.flatMap(match => match.candidates)[0];
  const link = detailUrl(app.spike.config.siteBase, app.spike.snapshot.index, entry);
  assert.equal(new URL(link).origin, origin);
  assert.equal(new URL(link).searchParams.get('release'), release);
  assert.ok(!JSON.stringify(report).includes('http://127.0.0.1:51795/'));
  assert.equal(app.spike.mock.requests.length, 0);
});

test('回环网站仍生成监听地址，非网站模式保留显式 siteBase', async t => {
  const website = await application(t);
  assert.equal((await request(website.url, '/api/status')).json().siteBase, website.url);
  const diagnostic = await application(t, { siteBase: 'https://details.invalid/' }, false);
  assert.equal((await request(diagnostic.url, '/api/status')).json().siteBase, 'https://details.invalid/');
  for (const publicOrigin of ['https://knowledge.invalid/path', 'https://knowledge.invalid/?x=1', 'https://knowledge.invalid/#x', 'https://user:secret@knowledge.invalid/', 'ftp://knowledge.invalid/', 'not-an-origin']) await assert.rejects(loadConfig({ publicOrigin }));
});

test('子路径网站链接保留公开origin及前缀，内部API和同源检查不变', async t => {
  const origin = 'http://knowledge.invalid:30000';
  const app = await application(t, { publicOrigin: origin, basePath: '/pi' });
  const headers = { Host: 'knowledge.invalid:30000', Origin: origin };
  assert.equal(app.spike.config.basePath, '/pi/');
  const status = await request(app.url, '/api/status', { headers });
  assert.equal(status.status, 200);
  assert.equal(status.json().siteBase, `${origin}/pi/`);
  assert.equal((await request(app.url, '/api/ready', { headers })).status, 200);
  assert.equal((await request(app.url, '/pi/api/status', { headers })).status, 404);
  for (const invalid of [{ ...headers, Host: 'knowledge.invalid' }, { ...headers, Origin: `${origin}/pi/` }, { ...headers, Origin: 'http://other.invalid:30000' }]) {
    const denied = await request(app.url, '/api/status', { headers: invalid });
    assert.equal(denied.status, 403); assert.equal(denied.json().code, 'origin_rejected');
  }
  const release = JSON.parse(await readFile(join(app.spike.config.distDir, 'knowledge/index.json'), 'utf8')).release_id;
  const accepted = await request(app.url, '/api/run', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ request: { ...fixtures.events, release } }) });
  assert.equal(accepted.status, 202);
  const job = app.spike.jobs.get(accepted.json().requestId); await job.done;
  assert.equal(job.state, 'completed');
  const entry = app.spike.view(job).matches.flatMap(match => match.candidates)[0];
  const link = new URL(detailUrl(app.spike.config.siteBase, app.spike.snapshot.index, entry));
  assert.equal(link.origin, origin); assert.equal(link.pathname, '/pi/index.html');
  assert.equal(link.searchParams.get('release'), release);
  const key = { request: fixtures.events, context: [], knowledgeHash: 'test', model: {}, codeHash: 'test' };
  assert.notEqual(cacheKey({ ...key, siteBase: `${origin}/` }), cacheKey({ ...key, siteBase: app.spike.config.siteBase }));
  assert.equal(app.spike.mock.requests.length, 0);
});

test('基础路径默认根目录且严格校验，非回环监听显式要求公开origin', async () => {
  const defaults = await loadConfig();
  assert.equal(defaults.basePath, '/'); assert.equal(defaults.host, '127.0.0.1');
  assert.equal(defaults.relativeLinks, false);
  for (const relativeLinks of ['true', 1, null]) await assert.rejects(loadConfig({ relativeLinks }), /relativeLinks.*布尔值/);
  for (const basePath of ['/pi', '/pi/', '/tools/config/']) assert.equal((await loadConfig({ basePath })).basePath, basePath.endsWith('/') ? basePath : `${basePath}/`);
  for (const basePath of ['', 'pi/', '//pi/', '/pi//', '/pi/../', '/pi/./', '/pi?x=1', '/pi#x', '/%70i/', '/pi\\x', 'https://other.invalid/', 1, null]) await assert.rejects(loadConfig({ basePath }), /基础路径/);
  for (const host of ['0.0.0.0', '::', '192.0.2.1', 'pi.internal']) {
    await assert.rejects(loadConfig({ host }), /publicOrigin/);
    assert.equal((await loadConfig({ host, publicOrigin: 'http://knowledge.invalid:30000' })).host, host);
  }
  for (const host of [0, '', 'http://localhost', '127.0.0.1:1234', 'a..b', 'a/b', 'with space']) await assert.rejects(loadConfig({ host, publicOrigin: 'http://knowledge.invalid' }), /监听地址/);
});

test('相对链接模式只改变网站基址，内部同源限制和非网站绝对链接保持不变', async t => {
  const origin = 'http://pi-agent:51808';
  const headers = { Host: 'pi-agent:51808', Origin: origin };
  for (const basePath of ['/', '/pi/', '/tools/config/']) {
    const app = await application(t, { publicOrigin: origin, basePath, relativeLinks: true });
    const status = await request(app.url, '/api/status', { headers });
    assert.equal(status.status, 200);
    assert.equal(status.json().siteBase, basePath);
    assert.equal(app.spike.config.publicOrigin, origin);
    assert.equal((await request(app.url, '/api/ready', { headers })).status, 200);
    for (const externalOrigin of ['http://192.0.2.10:30000', 'http://198.51.100.20:30000']) {
      for (const invalid of [
        { ...headers, Origin: externalOrigin }, { ...headers, Host: new URL(externalOrigin).host },
        { Host: new URL(externalOrigin).host, Origin: externalOrigin, 'X-Forwarded-Host': headers.Host, 'X-Forwarded-Proto': 'http', Forwarded: 'host=pi-agent:51808;proto=http' },
      ]) {
        const denied = await request(app.url, '/api/status', { headers: invalid });
        assert.equal(denied.status, 403); assert.equal(denied.json().code, 'origin_rejected');
      }
    }
  }
  const diagnostic = await application(t, { publicOrigin: origin, basePath: '/pi/', relativeLinks: true, siteBase: 'https://details.invalid/' }, false);
  assert.equal((await request(diagnostic.url, '/api/status', { headers })).json().siteBase, 'https://details.invalid/');
});

test('网站根相对详情链接不携带地址，重启与入口地址变化后仍复用完成缓存', async t => {
  const dir = await temporary(t);
  const options = { port: 0, stateDir: join(dir, 'state'), publicOrigin: 'http://pi-agent:51808', relativeLinks: true, basePath: '/pi/', mockDelayMs: 1 };
  let app = await serve({ ...options, siteBase: 'http://192.0.2.10:30000/' }, { website: true });
  t.after(() => app.close());
  const headers = { Host: 'pi-agent:51808', Origin: options.publicOrigin, 'Content-Type': 'application/json' };
  const release = JSON.parse(await readFile(join(app.spike.config.distDir, 'knowledge/index.json'), 'utf8')).release_id;
  const input = { ...fixtures.events, release, question: '默认值？' };
  async function run(externalOrigin) {
    const accepted = await request(app.url, '/api/run', { method: 'POST', headers: { ...headers, 'X-Forwarded-Host': new URL(externalOrigin).host, 'X-Forwarded-Proto': 'http' }, body: JSON.stringify({ request: input }) });
    assert.equal(accepted.status, 202);
    const job = app.spike.jobs.get(accepted.json().requestId); await job.done;
    assert.equal(job.state, 'completed');
    const report = app.spike.view(job);
    assert.ok(report.items.flatMap(item => item.entries).every(entry => !Object.hasOwn(entry, 'detail_url')));
    return job;
  }
  const first = await run('http://192.0.2.10:30000');
  assert.equal(first.cacheHit, false); assert.equal(app.spike.mock.requests.length, 1);
  const entry = first.matches.flatMap(match => match.candidates)[0];
  const link = app.spike.snapshot.client.detailUrl(app.spike.snapshot.index, entry);
  assert.equal(link, `/pi/index.html?${new URLSearchParams({ release, id: entry.id })}`);
  const key = { request: input, context: [], knowledgeHash: app.spike.snapshot.hash, model: {}, codeHash: app.spike.codeHash };
  assert.notEqual(cacheKey({ ...key, siteBase: '/pi/' }), cacheKey({ ...key, siteBase: '/' }));
  assert.notEqual(cacheKey({ ...key, siteBase: '/pi/' }), cacheKey({ ...key, siteBase: `${options.publicOrigin}/pi/` }));
  await app.close();
  app = await serve({ ...options, siteBase: 'http://198.51.100.20:30000/' }, { website: true });
  const second = await run('http://198.51.100.20:30000');
  assert.equal(second.cacheHit, true); assert.equal(app.spike.mock.requests.length, 0);
  assert.equal(app.spike.config.siteBase, '/pi/');
  assert.equal(app.spike.snapshot.client.detailUrl(app.spike.snapshot.index, entry), link);
  const caches = await readdir(join(options.stateDir, 'cache'));
  assert.equal(caches.length, 1);
  const contents = JSON.stringify(app.spike.view(second)) + await readFile(join(options.stateDir, 'cache', caches[0]), 'utf8');
  for (const address of ['pi-agent:51808', '192.0.2.10', '198.51.100.20', '127.0.0.1:51795']) assert.ok(!contents.includes(address), address);
});

test('就绪检查不调用模型，知识缺失和状态失效返回安全 503', async t => {
  const app = await application(t);
  const ready = await request(app.url, '/api/ready');
  assert.equal(ready.status, 200);
  assert.equal(ready.json().ready, true); assert.equal(ready.json().busy, false);
  assert.ok(ready.json().release);
  const originalDist = app.spike.config.distDir;
  app.spike.config.distDir = join(app.spike.config.stateDir, 'missing-knowledge');
  const badKnowledge = await request(app.url, '/api/ready');
  assert.equal(badKnowledge.status, 503); assert.equal(badKnowledge.json().code, 'not_ready');
  assert.ok(!badKnowledge.text.includes(app.spike.config.stateDir));
  app.spike.config.distDir = originalDist;
  const originalState = app.spike.config.stateDir;
  const badState = join(originalState, 'not-a-directory'); await writeFile(badState, 'synthetic');
  app.spike.config.stateDir = badState;
  const failedState = await request(app.url, '/api/ready');
  assert.equal(failedState.status, 503); assert.equal(failedState.json().ready, false);
  assert.ok(!failedState.text.includes(badState));
  app.spike.config.stateDir = originalState;
  await chmod(originalState, 0o500);
  try {
    const readOnly = await request(app.url, '/api/ready');
    assert.equal(readOnly.status, 503); assert.equal(readOnly.json().ready, false);
    assert.ok(!readOnly.text.includes(originalState));
  } finally { await chmod(originalState, 0o700); }
  assert.equal((await request(app.url, '/api/ready')).status, 200);
  assert.equal(app.spike.mock.requests.length, 0);
});

test('忙碌、失效 job、输入及文件错误具有稳定错误码，响应不泄漏凭据或路径', async t => {
  const app = await application(t, { apiKey: 'synthetic-secret' });
  const release = JSON.parse(await readFile(join(app.spike.config.distDir, 'knowledge/index.json'), 'utf8')).release_id;
  const post = value => request(app.url, '/api/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
  const missing = await request(app.url, `/api/jobs/${randomUUID()}`);
  assert.equal(missing.status, 404); assert.equal(missing.json().code, 'job_unavailable');
  const invalid = await post({ request: { input: 1, mode: 'single', release } });
  assert.equal(invalid.status, 400); assert.equal(invalid.json().code, 'invalid_request');
  const accepted = await post({ request: { ...fixtures.events, release, question: '默认值？' } });
  assert.equal(accepted.status, 202);
  const job = app.spike.jobs.get(accepted.json().requestId);
  const busy = await post({ request: { ...fixtures.events, release } });
  assert.equal(busy.status, 409); assert.equal(busy.json().code, 'busy');
  const restoreBusy = await request(app.url, `/api/sessions/${randomUUID()}`);
  assert.equal(restoreBusy.status, 409); assert.equal(restoreBusy.json().code, 'busy');
  const readyBusy = await request(app.url, '/api/ready');
  assert.equal(readyBusy.status, 200); assert.equal(readyBusy.json().busy, true);
  await job.done;
  let pruned = false;
  const originalPrune = app.spike.pruneJobs.bind(app.spike);
  app.spike.pruneJobs = () => { pruned = true; app.spike.jobs.delete(job.requestId); originalPrune(); };
  const expired = await request(app.url, `/api/jobs/${job.requestId}`);
  assert.equal(pruned, true); assert.equal(expired.status, 404); assert.equal(expired.json().code, 'job_unavailable');
  app.spike.restore = async () => { throw Object.assign(new Error(`ENOENT /private/synthetic-path synthetic-secret`), { path: '/private/synthetic-path', syscall: 'open' }); };
  const fileError = await request(app.url, `/api/sessions/${randomUUID()}`);
  assert.equal(fileError.status, 400); assert.equal(fileError.json().code, 'invalid_request');
  assert.ok(!fileError.text.includes('synthetic-secret')); assert.ok(!fileError.text.includes('/private/'));
  app.spike.restore = async () => { throw new Error('provider rejected synthetic-secret'); };
  assert.ok(!(await request(app.url, `/api/sessions/${randomUUID()}`)).text.includes('synthetic-secret'));
  const malformed = await request(app.url, '/api/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(malformed.status, 400); assert.equal(malformed.json().code, 'invalid_request');
});

test('真实启动器以 mock 启动：部署 JSON 生效，显式端口覆盖且状态独立', async t => {
  const dir = await temporary(t);
  const file = join(dir, 'launch.json');
  await writeFile(file, JSON.stringify({ port: 65535, stateDir: join(dir, 'state'), publicOrigin: 'https://launch.invalid', timeoutMs: 22000 }));
  const child = spawn(process.execPath, ['run.mjs', 'start', '--config-file', file], { cwd: ROOT, env: { PATH: process.env.PATH, PI_SPIKE_MODE: 'mock', PI_SPIKE_PORT: '0', PI_OFFLINE: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = ''; child.stderr.on('data', chunk => { stderr += chunk; });
  t.after(async () => { if (child.exitCode === null && child.signalCode === null) { child.kill('SIGTERM'); await once(child, 'exit'); } });
  const url = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error('隔离启动超时')), 15000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', () => { clearTimeout(timer); reject(new Error(`隔离启动提前退出：${stderr}`)); });
    child.stdout.on('data', chunk => {
      output += chunk;
      const match = output.match(/http:\/\/127\.0\.0\.1:\d+\//);
      if (match) { clearTimeout(timer); resolve(match[0]); }
    });
  });
  assert.notEqual(new URL(url).port, '65535');
  const status = await request(url, '/api/status', { headers: { Host: 'launch.invalid' } });
  assert.equal(status.status, 200); assert.equal(status.json().mode, 'mock');
  assert.equal(status.json().requestTimeoutMs, 22000);
  assert.equal((await request(url, '/api/ready', { headers: { Host: 'launch.invalid' } })).status, 200);
});
