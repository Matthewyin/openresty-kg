import { readFile, writeFile, mkdir, mkdtemp, rm, symlink, unlink } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:net';
import { request as httpRequest } from 'node:http';
import { randomUUID, createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';
import { candidate, renderLocations } from './openresty.mjs';

const args = process.argv.slice(2);
const dynamic = args.includes('--dynamic');
const option = name => args[args.indexOf(name) + 1];
for (const name of ['--package', '--image', '--original', '--report']) if (!args.includes(name)) throw new Error(`必须指定 ${name}`);
const pkg = resolve(option('--package'));
const image = option('--image');
const originalPath = resolve(option('--original'));
const reportPath = resolve(option('--report'));
const restyImage = 'openresty/openresty:1.25.3.1-alpine@sha256:2c21c754fbc25080f768b41063331f8c8400fb77603a5701b296eb4933183a71';
const id = `pi-qa-${randomUUID().slice(0, 8)}`;
const work = await mkdtemp(join(tmpdir(), `${id}-`));
const docker = (...argv) => execFileSync('docker', argv, { encoding: 'utf8', timeout: 60000, maxBuffer: 4 * 1024 * 1024 }).trim();
const digest = text => createHash('sha256').update(text).digest('hex');
const original = await readFile(originalPath, 'utf8');
const before = docker('inspect', 'openresty-30000', '--format', '{{json .State}}');
const checks = [];
const record = (name, detail = {}) => { checks.push({ name, ...detail }); console.log(JSON.stringify({ passed: name, ...detail })); };
const names = { network: id, gateway: `${id}-gateway`, pi: `${id}-pi`, stub: `${id}-stub`, volume: `${id}-state` };
const fixturePassword = randomUUID();
let cookie = '';
let port;
let origin;
let release;

async function freePort() {
  const socket = createServer();
  await new Promise(done => socket.listen(0, '127.0.0.1', done));
  const value = socket.address().port;
  await new Promise(done => socket.close(done));
  return value;
}
async function fetchPath(path, { auth = true, json, method = 'GET', headers = {}, ...rest } = {}) {
  const response = await fetch(origin + path, { redirect: 'manual', method, signal: AbortSignal.timeout(10000), headers: {
    ...(auth && cookie ? { Cookie: cookie } : {}), ...(dynamic ? { Origin: origin } : {}), ...(json ? { 'Content-Type': 'application/json', Origin: origin } : {}), ...headers,
  }, ...(json ? { body: JSON.stringify(json) } : {}), ...rest });
  return { status: response.status, headers: response.headers, text: await response.text() };
}
async function waitHttp(path, status = 200) {
  for (let i = 0; i < 100; i++) {
    try { const result = await fetchPath(path); if (result.status === status) return result; } catch {}
    await delay(200);
  }
  throw new Error(`等待失败：${path}`);
}
async function waitPi() {
  // 多个入口 worker 各有 DNS 缓存；新服务出现后等待连续就绪，而非只看一次200。
  let stable = 0;
  let result;
  for (let i = 0; i < 150; i++) {
    try { result = await fetchPath('/pi/api/ready', { headers: { Connection: 'close' } }); stable = result.status === 200 ? stable + 1 : 0; } catch { stable = 0; }
    if (stable >= 25) return result;
    await delay(200);
  }
  throw new Error('Pi 未达到连续就绪状态');
}
async function login() {
  const result = await fetchPath('/api/auth/login', { auth: false, method: 'POST', json: { username: 'pi-isolation', password: fixturePassword } });
  assert.equal(result.status, 200); assert.equal(JSON.parse(result.text).success, true);
  cookie = result.headers.get('set-cookie').split(';')[0];
}
function removeContainer(name) { try { docker('rm', '-f', name); } catch {} }
function startPi() {
  docker('run', '-d', '--name', names.pi, '--init', '--network', names.network, '--network-alias', 'pi-agent',
    '-e', 'PI_OFFLINE=1', '-e', 'PI_SPIKE_MODE=mock', '-e', 'PI_SPIKE_WEBSITE=1',
    '-e', 'PI_SPIKE_HOST=0.0.0.0', '-e', 'PI_SPIKE_PORT=51808', '-e', 'PI_SPIKE_BASE_PATH=/pi/',
    '-e', `PI_SPIKE_PUBLIC_ORIGIN=${dynamic ? 'http://pi-agent:51808' : origin}`, '-e', `PI_SPIKE_RELATIVE_LINKS=${dynamic}`, '-e', 'PI_SPIKE_STATE_DIR=.state/container',
    '-v', `${join(work, 'model.env')}:/run/secrets/model.env:ro`,
    '-v', `${names.volume}:/app/experiments/pi-sdk/.state/container`, image, 'node', 'experiments/pi-sdk/server.mjs');
}
function startGateway(config, name = names.gateway, gatewayPort = port) {
  docker('run', '-d', '--name', name, '--network', names.network, '--dns', '127.0.0.1', '-p', `127.0.0.1:${gatewayPort}:80`,
    '-v', `${join(work, config)}:/usr/local/openresty/nginx/conf/nginx.conf:ro`,
    '-v', `${join(work, 'data')}:/usr/local/openresty/nginx/data`,
    '-v', `${join(work, 'logs')}:/usr/local/openresty/nginx/logs`,
    '-v', `${join(work, 'gemini')}:/usr/local/openresty/nginx/html/gemini-rag:ro`,
    '-v', `${join(pkg, 'dist')}:/usr/local/openresty/nginx/data/pi-site:ro`, restyImage);
}
async function run(message, sessionId, extra = {}) {
  const accepted = await fetchPath('/pi/api/run', { method: 'POST', json: { request: { message, release, ...extra }, ...(sessionId ? { sessionId } : {}) } });
  assert.equal(accepted.status, 202, accepted.text.slice(0, 300));
  const job = JSON.parse(accepted.text);
  for (let i = 0; i < 250; i++) {
    const result = await fetchPath(`/pi/api/jobs/${job.requestId}`);
    assert.equal(result.status, 200);
    const value = JSON.parse(result.text);
    if (value.state !== 'running') { assert.equal(value.state, 'completed', value.error); return value; }
    await delay(200);
  }
  throw new Error('任务超时');
}

try {
  port = await freePort(); origin = `http://127.0.0.1:${port}`;
  for (const path of ['data/auth', 'data/work-counts', 'data/lldp', 'data/html', 'logs', 'gemini']) await mkdir(join(work, path), { recursive: true });
  await writeFile(join(work, 'data/auth/users.json'), JSON.stringify([{ username: 'pi-isolation', password: fixturePassword }]));
  await writeFile(join(work, 'model.env'), 'base-url=http://model-fixture:51900/v1\nMODEL=isolation-placeholder\nPROVIDER=isolation-fixture\nGLM_API_KEY=synthetic-isolation-only\n', { mode: 0o644 });
  const loginHtml = '<!doctype html><meta charset="utf-8"><title>隔离测试登录</title><h1>隔离测试登录（非原站页面）</h1><form><input name="username" aria-label="用户名"><input name="password" type="password" aria-label="密码"><button>登录</button></form><p id="status"></p><script>document.querySelector("form").onsubmit=async e=>{e.preventDefault(); const data=Object.fromEntries(new FormData(e.target)); const r=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)}); if(r.ok)location.href="/pi/";else document.querySelector("#status").textContent="登录失败";}</script>';
  await writeFile(join(work, 'data/work-counts/index.html'), loginHtml);
  for (const path of ['data/lldp/index.html', 'data/html/monitor.html', 'gemini/index.html']) await writeFile(join(work, path), `<!doctype html><title>隔离原站夹具</title>${path}`);
  const ports = [7890, 30009, 30001, 30002, 30003, 30007, 30008, 30006, 30010];
  await writeFile(join(work, 'stub.conf'), `events {} http { server { ${ports.map(p => `listen ${p};`).join(' ')} location / { return 200 'old-backend-fixture'; } location = /api/slow { content_by_lua_block { ngx.sleep(3); ngx.say('slow-fixture') } } } }`);
  // 两份配置都只替换外部依赖主机，避免隔离检查访问真实业务后端。
  const baseline = original.replaceAll('host.docker.internal', 'fixture-backend');
  const locations = renderLocations({ basePath: '/pi/', staticRoot: '/usr/local/openresty/nginx/data/pi-site', upstream: 'pi-agent:51808', ...(dynamic ? { publicPort: port } : {}) });
  const modified = candidate(baseline, locations);
  assert.equal(modified.replace(`\n\n${locations}`, ''), baseline);
  await writeFile(join(work, 'baseline.conf'), baseline);
  await writeFile(join(work, 'candidate.conf'), modified);
  docker('network', 'create', names.network);
  docker('volume', 'create', names.volume);
  let scalingRejected = false;
  try {
    execFileSync('docker', ['compose', '--env-file', new URL('./example.env', import.meta.url).pathname, '-f', new URL('./compose.yaml', import.meta.url).pathname, '-p', `${id}-scale`, 'up', '--no-start', '--scale', 'pi-agent=2'], {
      encoding: 'utf8', timeout: 20000,
      env: { ...process.env, PI_IMAGE: image, PI_CONTAINER_NAME: `${id}-scale-agent`, PI_NETWORK: names.network, PI_PUBLIC_ORIGIN: origin, PI_MODEL_ENV_FILE: join(work, 'model.env') }, stdio: 'pipe',
    });
  } catch (error) { scalingRejected = /container_name|custom name|cannot scale/i.test(error.stderr ?? ''); }
  assert.ok(scalingRejected, 'Compose必须拒绝同卷多副本'); record('Compose固定容器名拒绝扩容');
  docker('run', '-d', '--name', names.stub, '--network', names.network,
    '--network-alias', 'fixture-backend', '--network-alias', 'goaccess-30004', '--network-alias', 'lldp-backend',
    '-v', `${join(work, 'stub.conf')}:/usr/local/openresty/nginx/conf/nginx.conf:ro`, restyImage);
  startGateway('baseline.conf'); await waitHttp('/health'); await login();
  const legacyPaths = ['/', '/geminirag/', '/lldp/', '/monitor', '/health', '/api/auth/user', '/api/core/test', '/api/domain/test', '/api/line/test', '/api/topology/test', '/api/scheme/test', '/api/rag/test', '/tools/health', '/goaccess-ws/'];
  const oldResponses = new Map();
  for (const path of legacyPaths) oldResponses.set(path, await fetchPath(path));
  removeContainer(names.gateway); startGateway('candidate.conf'); await waitHttp('/health'); await login();
  for (const path of legacyPaths) {
    const response = await fetchPath(path); const old = oldResponses.get(path);
    assert.equal(response.status, old.status, path); assert.equal(response.text, old.text, path);
  }
  record('原配置与新增路由配置的14个旧入口夹具响应一致', { scope: '合成静态页面、隔离依赖；不代表原业务功能或WebSocket握手验收' });
  assert.equal((await fetchPath('/pi/api/status')).status, 503);
  assert.equal((await fetchPath('/pi/')).status, 200);
  record('Pi尚不存在时入口可启动且静态网站可读');
  const slash = await fetchPath('/pi?release=test'); assert.equal(slash.status, 302); assert.equal(slash.headers.get('location'), '/pi/?release=test');
  assert.equal((await fetchPath('/pi/', { auth: false })).headers.get('location'), '/login');
  for (const path of ['/pi/agent.mjs', '/pi/styles.css', '/pi/knowledge/index.json', '/pi/api/status?x=.js', '/pi/api/status.json', '/pi/api/ready', '/pi/api/sessions/11111111-1111-4111-8111-111111111111']) {
    const result = await fetchPath(path, { auth: false, headers: { Accept: 'text/html' } });
    assert.equal(result.status, 401, path); assert.equal(JSON.parse(result.text).code, 'authentication_required');
  }
  assert.equal((await fetchPath('/pi/api/status', { auth: false, headers: { Cookie: 'rag_auth_token=invalid' } })).status, 401);
  record('未登录、无效Cookie和扩展名查询参数不能绕过认证');
  for (const path of ['/pi/missing.json', '/pi/missing.mjs', '/pi/.env', '/pi/foo/../.env', '/pi/%2eenv', '/pi/src/']) {
    const result = await fetchPath(path); assert.equal(result.status, 404, path); assert.match(result.headers.get('content-type'), /json/);
  }
  await writeFile(join(work, 'data/qa-outside.json'), 'outside-private-fixture');
  assert.equal(docker('exec', names.gateway, 'cat', '/usr/local/openresty/nginx/data/qa-outside.json'), 'outside-private-fixture');
  await symlink('/usr/local/openresty/nginx/data/qa-outside.json', join(pkg, 'dist/qa-link.json'));
  try { assert.equal((await fetchPath('/pi/qa-link.json')).status, 404); }
  finally { await unlink(join(pkg, 'dist/qa-link.json')); }
  assert.match((await fetchPath('/pi/agent.mjs')).headers.get('content-type'), /javascript/);
  const indexResult = await fetchPath('/pi/knowledge/index.json'); const index = JSON.parse(indexResult.text); release = index.release_id;
  record('静态MIME、尾斜杠、缺失和隐藏文件响应正确', { release });
  startPi(); const ready = JSON.parse((await waitPi()).text); assert.equal(ready.release, release);
  const status = JSON.parse((await fetchPath('/pi/api/status')).text); assert.equal(status.mode, 'mock'); assert.equal(status.siteBase, dynamic ? '/pi/' : `${origin}/pi/`);
  assert.equal((await fetchPath('/pi/api/no-such-api')).status, 404);
  const tooLarge = await fetchPath('/pi/api/run', { method: 'POST', json: { request: { message: 'x'.repeat(70000), release } } });
  assert.equal(tooLarge.status, 413); assert.equal(JSON.parse(tooLarge.text).code, 'input_too_large');
  const invalidRelease = await fetchPath('/pi/api/run', { method: 'POST', json: { request: { message: 'events {}', release: '../bad' } } });
  assert.ok(invalidRelease.status >= 400); assert.match(invalidRelease.headers.get('content-type'), /json/);
  const missing = await fetchPath('/pi/api/run', { method: 'POST', json: { request: { message: 'events {}', release: 'not-a-published-release' } } });
  assert.equal(missing.status, 202);
  const missingJob = JSON.parse(missing.text);
  for (let i = 0; i < 100; i++) {
    const value = JSON.parse((await fetchPath(`/pi/api/jobs/${missingJob.requestId}`)).text);
    if (value.state !== 'running') { assert.equal(value.state, 'failed'); assert.ok(!value.modelSelection); break; }
    assert.ok(i < 99); await delay(100);
  }
  assert.equal((await fetchPath('/pi/knowledge/releases/not-a-published-release/index.json')).status, 404);
  assert.equal((await fetchPath('/pi/api/status', { headers: { Origin: 'http://wrong.invalid' } })).status, 403);
  const badHostStatus = await new Promise((done, fail) => {
    const req = httpRequest(`${origin}/pi/api/status`, { headers: { Host: 'wrong.invalid', Cookie: cookie } }, res => { res.resume(); res.on('end', () => done(res.statusCode)); });
    req.on('error', fail); req.end();
  });
  assert.equal(badHostStatus, 403);
  for (const path of ['/pi/api/no-such-api', '/pi/api/status']) {
    const response = await fetchPath(path, { headers: { Origin: 'http://wrong.invalid' } });
    assert.equal(response.status, 403); assert.equal(JSON.parse(response.text).code, 'origin_rejected'); assert.match(response.headers.get('cache-control'), /no-store/);
  }
  record('代理前缀、带端口Host、Origin校验和JSON错误成立');
  const events = 'events { multi_accept on; worker_connections 65535; }';
  const first = await run(events); assert.equal(first.summary.matched, 3); assert.equal(first.normalizedRequest.input, events);
  const follow = await run('继续解释刚才配置的运行时和功能限制', first.sessionId, { mockScenario: 'extended' });
  assert.equal(follow.normalizedRequest.input, events); assert.ok(follow.modelSelection.citations.some(item => item.quote));
  const cached = await run(events); assert.equal(cached.cacheHit, true);
  if (dynamic) {
    const firstOrigin = origin;
    origin = `http://localhost:${port}`;
    assert.equal((await fetchPath('/pi/')).status, 200);
    assert.equal((await fetchPath('/pi/api/status')).status, 200);
    const changed = await run(events); assert.equal(changed.cacheHit, true);
    assert.equal(JSON.parse((await fetchPath('/pi/api/status')).text).siteBase, '/pi/');
    assert.ok(!JSON.stringify(changed).includes('http://pi-agent:51808'));
    const links = changed.items.flatMap(item => item.entries.map(entry => `/pi/index.html?release=${release}&id=${entry.id}`));
    assert.ok(links.length > 0);
    for (const link of links) {
      assert.ok(link.startsWith('/pi/index.html?'));
      assert.equal((await fetchPath(link)).status, 200);
    }
    assert.equal((await fetchPath('/pi/api/status', { headers: { Origin: firstOrigin } })).status, 403);
    assert.equal((await fetchPath('/pi/api/status', { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status, 403);
    assert.equal((await fetchPath('/pi/api/status', { headers: { 'Sec-Fetch-Site': 'same-site' } })).status, 403);
    const direct = (headers) => new Promise((done, fail) => {
      const req = httpRequest(`${origin}/pi/api/status`, { headers: { Cookie: cookie, ...headers } }, res => { res.resume(); res.on('end', () => done(res.statusCode)); });
      req.on('error', fail); req.end();
    });
    assert.equal(await direct({}), 403);
    assert.equal(await direct({ Referer: `${origin}/pi/` }), 200);
    for (const address of ['192.168.100.8', '10.30.40.5']) assert.equal(await direct({ Host: `${address}:${port}`, Origin: `http://${address}:${port}` }), 200);
    assert.equal(await direct({ Host: `999.1.1.1:${port}`, Origin: `http://999.1.1.1:${port}` }), 403);
    assert.equal(await direct({ Host: `evil.invalid:${port}`, Origin: `http://evil.invalid:${port}` }), 403);
    assert.equal(await direct({ Host: `127.0.0.1:${port + 1}`, Origin: `http://127.0.0.1:${port + 1}` }), 403);
    assert.equal(await direct({ Origin: 'null' }), 403);
    assert.equal(await direct({ Origin: origin, 'X-Forwarded-Host': 'evil.invalid', 'X-Forwarded-Proto': 'https' }), 200);
    origin = firstOrigin;
    record('动态访问地址切换、跨地址缓存相对链接及入口同源拒绝通过', { addresses: ['127.0.0.1', 'localhost'], scope: '两个本机访问地址，不等于真实换网或第二台设备' });
  }
  record('统一输入、追问、源码证据和精确缓存通过mock全链路', { matched: first.summary.matched });
  const packageManifest = JSON.parse(await readFile(join(pkg, 'manifest.json'), 'utf8'));
  for (const historic of packageManifest.includedReleases.filter(value => value !== release)) {
    assert.equal(JSON.parse((await fetchPath(`/pi/knowledge/releases/${historic}/index.json`)).text).release_id, historic);
    assert.equal((await run(events, undefined, { release: historic })).knowledgeVersion.release, historic);
  }
  record('所选历史发布可经静态入口及Pi读取', { releases: packageManifest.includedReleases });
  if (args.includes('--sample-openresty') && args.includes('--sample-nginx')) {
    const raw = await readFile(option('--sample-openresty'), 'utf8');
    const main = raw.split(/\r?\n/).slice(2, 73).join('\n');
    assert.ok(main.startsWith('worker_processes') && main.includes('vhost_traffic_status_zone;'));
    const sampleA = await run(main); assert.equal(sampleA.summary.matched, 24); assert.ok(sampleA.normalizedRequest.input === main, '样例A原文保真失败');
    const vts = [...new Set(sampleA.modelSelection.facts.map(fact => fact.entryId).filter(value => value.includes('vhost_traffic_status')))]; assert.equal(vts.length, 4);
    const second = await readFile(option('--sample-nginx'), 'utf8');
    const sampleB = await run(second); assert.equal(sampleB.summary.matched, 258); assert.ok(sampleB.normalizedRequest.input === second, '样例B原文保真失败');
    record('两份用户样例mock回放：24与258唯一匹配，VTS四项', { vtsCount: vts.length, model: 'mock，不调用真实模型' });
  }
  const pending = JSON.parse((await fetchPath('/pi/api/run', { method: 'POST', json: { request: { message: 'events { worker_connections 2048; }', release } } })).text);
  const busy = await fetchPath('/pi/api/run', { method: 'POST', json: { request: { message: events, release } } }); assert.equal(busy.status, 409);
  const cancelled = await fetchPath('/pi/api/cancel', { method: 'POST', json: { requestId: pending.requestId } }); assert.equal(JSON.parse(cancelled.text).state, 'cancelled');
  await fetchPath('/api/auth/logout', { method: 'POST', json: {} });
  for (const path of ['/pi/knowledge/index.json', '/pi/api/status', `/pi/api/jobs/${first.requestId}`, `/pi/api/sessions/${first.sessionId}`]) assert.equal((await fetchPath(path)).status, 401);
  for (const path of ['/pi/api/run', '/pi/api/cancel']) assert.equal((await fetchPath(path, { method: 'POST', json: {} })).status, 401);
  await login(); record('busy、取消、原登出后静态/API全部拒绝');
  const oldIp = Object.values(JSON.parse(docker('inspect', names.pi, '--format', '{{json .NetworkSettings.Networks}}')))[0].IPAddress;
  docker('stop', '-t', '20', names.pi); removeContainer(names.pi);
  assert.equal((await fetchPath('/pi/')).status, 200); assert.equal((await fetchPath('/pi/api/status')).status, 503);
  // 占住旧地址，使重建后的服务确实发生 IP 变化。
  const holder = `${id}-holder`; names.holder = holder;
  docker('run', '-d', '--name', holder, '--network', names.network, '--entrypoint', 'sleep', restyImage, '300');
  startPi(); await waitPi();
  const newIp = Object.values(JSON.parse(docker('inspect', names.pi, '--format', '{{json .NetworkSettings.Networks}}')))[0].IPAddress;
  assert.notEqual(newIp, oldIp);
  assert.equal((await fetchPath(`/pi/api/jobs/${first.requestId}`)).status, 404);
  const restored = JSON.parse((await fetchPath(`/pi/api/sessions/${first.sessionId}`)).text); assert.equal(restored.currentConfig.input, events);
  assert.equal((await run('继续解释刚才这段配置', first.sessionId)).normalizedRequest.input, events);
  record('Pi停止时静态降级、重建DNS恢复、持久卷会话恢复', { oldIp, newIp });
  assert.deepEqual(JSON.parse(docker('inspect', names.pi, '--format', '{{json .HostConfig.PortBindings}}')), {});
  assert.equal(docker('exec', names.pi, 'id', '-u'), '1000');
  assert.equal(docker('exec', names.pi, 'node', '-e', 'const fs=require("fs");fs.readFileSync("/run/secrets/model.env");try{fs.appendFileSync("/run/secrets/model.env","bad");process.exit(1)}catch(e){if(!["EROFS","EACCES"].includes(e.code))throw e;process.stdout.write("readonly") }'), 'readonly');
  const manifest = JSON.parse(await readFile(join(pkg, 'manifest.json'), 'utf8'));
  assert.ok(Object.keys(manifest.entries).every(path => !/(?:^|\/)(?:\.env|\.state|node_modules)(?:\/|$)/.test(path)));
  const runtimeManifest = JSON.parse(docker('exec', names.pi, 'node', '-e', 'process.stdout.write(require("fs").readFileSync("/app/manifest.json","utf8"))'));
  assert.deepEqual(runtimeManifest, manifest);
  for (const [path, hash] of Object.entries(manifest.entries)) assert.equal(digest(await readFile(join(pkg, path))), hash, path);
  const verifiedFiles = docker('exec', names.pi, 'node', '-e', `const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');const m=JSON.parse(fs.readFileSync('/app/manifest.json')); const expected=Object.keys(m.entries).filter(p=>!['Dockerfile','.dockerignore'].includes(p));for(const p of expected)assert.equal(crypto.createHash('sha256').update(fs.readFileSync('/app/'+p)).digest('hex'),m.entries[p],p);const actual=[];function walk(dir){for(const f of fs.readdirSync('/app/'+dir,{withFileTypes:true})){const p=path.posix.join(dir,f.name);if(p==='manifest.json'||p==='experiments/pi-sdk/.state'||p==='experiments/pi-sdk/node_modules')continue;if(f.isDirectory())walk(p);else{assert.ok(f.isFile());actual.push(p);}}}walk('');assert.deepEqual(actual.sort(),expected.sort());process.stdout.write(String(expected.length));`);
  record('非root、只读合成凭据、无独立发布端口及镜像应用文件逐项核验', { files: Number(verifiedFiles), scope: '核验/app应用文件与构建白名单，不宣称扫描第三方基础镜像所有历史层' });
  const timeoutPort = await freePort(); names.timeout = `${id}-timeout`;
  await writeFile(join(work, 'timeout.conf'), candidate(baseline, renderLocations({ basePath: '/pi/', staticRoot: '/usr/local/openresty/nginx/data/pi-site', upstream: 'fixture-backend:30009', proxyTimeoutSeconds: 1 })));
  startGateway('timeout.conf', names.timeout, timeoutPort);
  const normalOrigin = origin; origin = `http://127.0.0.1:${timeoutPort}`;
  await waitHttp('/health');
  const timed = await fetchPath('/pi/api/slow');
  assert.equal(timed.status, 503); assert.equal(JSON.parse(timed.text).code, 'unavailable'); assert.match(timed.headers.get('cache-control'), /no-store/);
  origin = normalOrigin; removeContainer(names.timeout); delete names.timeout;
  record('代理超时返回JSON且不落原站错误页');

  // 正式启动器与Compose仅连接独立模拟模型服务，不使用本机真实凭据。
  names.composeNetwork = `${id}-compose`; names.model = `${id}-model`; names.composePi = `${id}-compose-pi`;
  docker('network', 'create', names.composeNetwork);
  docker('run', '-d', '--name', names.model, '--network', names.composeNetwork, '--network-alias', 'model-fixture', image,
    'node', '--input-type=module', '-e', 'import {startMock} from "./experiments/pi-sdk/src/mock-provider.mjs"; await startMock({host:"0.0.0.0",mockPort:51900,mockDelayMs:1});');
  const composeEnv = { ...process.env, PI_IMAGE: image, PI_CONTAINER_NAME: names.composePi, PI_NETWORK: names.composeNetwork, PI_PUBLIC_ORIGIN: origin, PI_MODEL_ENV_FILE: join(work, 'model.env') };
  execFileSync('docker', ['compose', '--env-file', new URL('./example.env', import.meta.url).pathname, '-f', new URL('./compose.yaml', import.meta.url).pathname, '-p', `${id}-formal`, 'up', '-d', '--wait', '--wait-timeout', '45'], { encoding: 'utf8', env: composeEnv, timeout: 60000, stdio: 'pipe' });
  let healthy = false;
  for (let i = 0; i < 100; i++) {
    if (docker('inspect', names.composePi, '--format', '{{.State.Health.Status}}') === 'healthy') { healthy = true; break; }
    await delay(250);
  }
  assert.ok(healthy, 'Compose服务未达到healthy');
  const formal = JSON.parse(docker('exec', names.composePi, 'node', '--input-type=module', '-e', `import http from 'node:http';const h={Host:${JSON.stringify("pi-agent:51808")},'Content-Type':'application/json'};const call=(path,body)=>new Promise((resolve,reject)=>{const req=http.request('http://127.0.0.1:51808'+path,{headers:h,method:body?'POST':'GET'},res=>{let data='';res.on('data',c=>data+=c);res.on('end',()=>{try{resolve(JSON.parse(data))}catch(e){reject(e)}})});req.on('error',reject);req.end(body?JSON.stringify(body):undefined)});const s=await call('/api/status');const r=await call('/api/ready');let j=await call('/api/run',{request:{message:'events { worker_connections 6789; }',release:r.release}});for(let i=0;j.state==='running'&&i<100;i++){await new Promise(r=>setTimeout(r,100));j=await call('/api/jobs/'+j.requestId);}console.log(JSON.stringify({mode:s.mode,siteBase:s.siteBase,state:j.state,matched:j.summary?.matched}));`));
  assert.equal(formal.mode, 'live'); assert.equal(formal.state, 'completed'); assert.equal(formal.matched, 2); assert.equal(formal.siteBase, '/pi/');
  record('正式Compose健康检查和run.mjs website启动链通过合成模型端点', { endpoint: '独立本地fixture，无真实供应商调用' });
  assert.equal(digest(await readFile(originalPath, 'utf8')), digest(original));
  assert.equal(docker('inspect', 'openresty-30000', '--format', '{{json .State}}'), before);
  const report = { passed: true, release, model: 'mock', imageId: docker('image', 'inspect', image, '--format', '{{.Id}}'), manifestHash: digest(await readFile(join(pkg, 'manifest.json'))), originalConfigHash: digest(original), originalContainerUnchanged: true, checks, limitations: ['未操作原站或真实账号', '旧路由为隔离夹具等价性而非原业务验收', '未做真实模型和第二台局域网设备验收'] };
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  if (args.includes('--serve')) {
    // 测试口令仅留在隔离临时目录，不写验收报告或终端输出。
    await writeFile(join(work, 'browser-login.json'), JSON.stringify({ username: 'pi-isolation', password: fixturePassword }));
    console.log(JSON.stringify({ preview: `${origin}/pi/`, workspace: work, gateway: names.gateway, pi: names.pi, loginFile: join(work, 'browser-login.json') }));
    process.stdin.resume();
    const keepAlive = setInterval(() => {}, 1000);
    try { await new Promise(done => { process.stdin.once('data', done); process.once('SIGINT', done); process.once('SIGTERM', done); }); }
    finally { clearInterval(keepAlive); process.stdin.pause(); }
  }
} catch (error) {
  if (names.composePi) { try { console.error('隔离正式启动链诊断：', docker('logs', '--tail', '30', names.composePi)); } catch {} }
  try { console.error('隔离 Pi 诊断：', docker('logs', '--tail', '30', names.pi)); } catch {}
  try { console.error('隔离入口诊断：', (await readFile(join(work, 'logs/error.log'), 'utf8')).slice(-5000)); } catch {}
  await writeFile(reportPath, JSON.stringify({ passed: false, checks, error: error.message.split('\n')[0] }, null, 2) + '\n');
  throw error;
} finally {
  for (const name of [names.gateway, names.pi, names.stub, names.holder, names.timeout, names.composePi, names.model].filter(Boolean)) removeContainer(name);
  try { docker('volume', 'rm', `${id}-scale_pi-state`); } catch {}
  try { docker('volume', 'rm', `${id}-formal_pi-state`); } catch {}
  if (names.composeNetwork) { try { docker('network', 'rm', names.composeNetwork); } catch {} }
  try { docker('volume', 'rm', names.volume); } catch {}
  try { docker('network', 'rm', names.network); } catch {}
  await rm(work, { recursive: true, force: true });
}
