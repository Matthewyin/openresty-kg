import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLocations, candidate } from './openresty.mjs';
import { prepare, forbiddenNames } from './prepare.mjs';
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
  // 运行包不得含模型配置真实文件（仅允许示例以外的任何 configuration.json 都不出现）。
  assert.ok(forbiddenNames.has('configuration.json'));
  assert.ok(Object.keys(manifest.entries).every(path => !path.endsWith('configuration.json')));
  assert.deepEqual((await readdir(destination, { recursive: true })).filter(path => path.endsWith('configuration.json')), []);
  for (const [path, hash] of Object.entries(manifest.entries)) assert.equal(createHash('sha256').update(await readFile(join(destination, path))).digest('hex'), hash);
  await assert.rejects(prepare(destination));
  await assert.rejects(prepare(join(temp, 'invalid'), { releases: ['../private'] }), /不合法/);
  await assert.rejects(prepare(join(temp, 'absent'), { releases: ['not-a-published-release'] }), /ENOENT/);
});
test('Compose 以只读目录挂载模型配置，Dockerfile 启动参数含 --model-file，.dockerignore 排除真实配置', async () => {
  const compose = await readFile(new URL('./compose.yaml', import.meta.url), 'utf8');
  // 目录挂载块：source 为必填变量，target 为 /run/config，只读且不自动创建宿主目录。
  assert.match(compose, /source: \$\{PI_MODEL_CONFIG_DIR:\?[^}]+\}\n\s+target: \/run\/config\n\s+read_only: true\n\s+bind:\n\s+create_host_path: false/);
  // 不得单文件挂载 configuration.json（编辑器整体替换保存时容器会看到旧内容）。
  assert.doesNotMatch(compose, /target: \/run\/config\/configuration\.json/);
  assert.match(compose, /target: \/run\/secrets\/model\.env/);
  const dockerfile = await readFile(new URL('./Dockerfile', import.meta.url), 'utf8');
  assert.match(dockerfile, /"--model-file", "\/run\/config\/configuration\.json"/);
  assert.match(dockerfile, /"--env-file", "\/run\/secrets\/model\.env"/);
  assert.doesNotMatch(dockerfile, /COPY[^\n]*(configuration\.json|config\/)/);
  const ignore = await readFile(new URL('./.dockerignore', import.meta.url), 'utf8');
  assert.match(ignore, /^\*\*\/configuration\.json$/m);
  const example = await readFile(new URL('./example.env', import.meta.url), 'utf8');
  assert.match(example, /^PI_MODEL_CONFIG_DIR=/m);
});
