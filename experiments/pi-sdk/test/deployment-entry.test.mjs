import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { ROOT } from '../src/session.mjs';
import { deploymentEntry } from './fixtures/deployment-entry.mjs';

test('本地独立入口：静态与API同源，后端停机静态与源码继续提供', async () => {
  await mkdir(join(ROOT, '.state'), { recursive: true });
  const stateDir = await mkdtemp(join(ROOT, '.state/entry-test-'));
  const entry = await deploymentEntry({ stateDir, distDir: resolve(ROOT, '../../dist') });
  const get = path => fetch(new URL(path, entry.url));
  try {
    const status = await (await get('/api/status')).json();
    assert.equal(status.siteBase, entry.url);
    assert.equal((await get('/api/ready')).status, 200);
    const unknown = await get('/api/unknown'); assert.equal(unknown.status, 404); assert.match(unknown.headers.get('content-type'), /json/);
    for (const path of ['/.env', '/experiments/pi-sdk/config.json', '/.state/metadata']) assert.equal((await get(path)).status, 404);
    await entry.stopBackend();
    assert.equal((await get('/api/status')).status, 503);
    for (const path of ['/', '/src/core/parser.mjs', '/knowledge/index.json']) assert.equal((await get(path)).status, 200);
    assert.match((await get('/agent.mjs')).headers.get('content-type'), /javascript/);
    assert.match((await get('/')).headers.get('content-security-policy'), /connect-src 'self'/);
    await entry.startBackend(); assert.equal((await get('/api/ready')).status, 200);
  } finally { await entry.close(); await rm(stateDir, { recursive: true, force: true }); }
});
