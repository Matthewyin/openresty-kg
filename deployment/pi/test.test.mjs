import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLocations, candidate } from './openresty.mjs';
import { prepare } from './prepare.mjs';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { validateIndex } from '../../src/query/knowledge.mjs';

const options = { basePath: '/pi/', staticRoot: '/var/www/pi-site', upstream: 'pi-agent:51808' };
test('候选仅插入独立路由且拒绝重复套用', () => {
  const original = 'http { server {\n        server_name localhost;\nlocation / { return 200 "old"; }\n} }';
  const locations = renderLocations(options);
  const result = candidate(original, locations);
  assert.equal(result.replace(`\n\n${locations}`, ''), original);
  assert.throws(() => candidate(result, locations));
  assert.match(locations, /proxy_set_header Host \$http_host/);
  assert.match(locations, /rewrite \^\/pi\(\/api\/\.\*\)\$/);
  assert.match(locations, /ngx.shared.auth_sessions:get\(token\)/);
  assert.doesNotMatch(locations, /check_auth\(/);
});
test('拒绝配置插入，允许非固定的基础路径', () => {
  for (const patch of [{ basePath: '/pi/;evil' }, { staticRoot: '/tmp/x;evil' }, { upstream: 'pi;bad:80' }, { resolver: '127.0.0.11;bad' }]) assert.throws(() => renderLocations({ ...options, ...patch }));
  assert.match(renderLocations({ ...options, basePath: '/knowledge/' }), /location \^~ \/knowledge\/api\//);
});
test('动态IP仅在入口验证外部来源，再使用固定内部来源', () => {
  const result = renderLocations({ ...options, publicPort: 30000 });
  assert.match(result, /port ~= "30000"/);
  assert.match(result, /origin ~= expected/);
  assert.match(result, /fetch_site ~= "same-origin"/);
  assert.match(result, /referer:sub/);
  assert.match(result, /proxy_set_header Host pi-agent:51808/);
  assert.match(result, /proxy_set_header Origin http:\/\/pi-agent:51808/);
  assert.throws(() => renderLocations({ ...options, publicPort: 0 }));
});
test('打包按显式清单保留历史发布，拒绝非法或缺失发布并绑定文件摘要', async t => {
  const temp = await mkdtemp(join(tmpdir(), 'pi-package-test-'));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const knowledge = new URL('../../dist/knowledge/', import.meta.url);
  const current = JSON.parse(await readFile(new URL('index.json', knowledge), 'utf8')).release_id;
  let historic;
  for (const entry of await readdir(new URL('releases/', knowledge), { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === current) continue;
    try { validateIndex(JSON.parse(await readFile(new URL(`releases/${entry.name}/index.json`, knowledge), 'utf8'))); historic = entry.name; break; } catch {}
  }
  assert.ok(historic, '需要既有有效历史发布夹具');
  const destination = join(temp, 'package');
  const manifest = await prepare(destination, { releases: [historic] });
  assert.deepEqual((await readdir(join(destination, 'dist/knowledge/releases'))).sort(), [current, historic].sort());
  assert.ok(manifest.entries.Dockerfile && manifest.entries['.dockerignore']);
  assert.ok(Object.keys(manifest.entries).every(path => !path.includes('.state') && !path.endsWith('.env') && !path.includes('node_modules')));
  for (const [path, hash] of Object.entries(manifest.entries)) assert.equal(createHash('sha256').update(await readFile(join(destination, path))).digest('hex'), hash);
  await assert.rejects(prepare(destination));
  await assert.rejects(prepare(join(temp, 'invalid'), { releases: ['../private'] }), /不合法/);
  await assert.rejects(prepare(join(temp, 'absent'), { releases: ['not-a-published-release'] }), /ENOENT/);
});
