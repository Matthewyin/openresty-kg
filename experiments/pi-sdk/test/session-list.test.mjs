import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile, utimes, lstat, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { Spike, ROOT } from '../src/session.mjs';
import { sessionTitle, UNTITLED } from '../src/session-list.mjs';
import { serve } from '../server.mjs';
import { fixtures } from './fixtures/configs.mjs';

// 起一个带 HTTP 服务的 mock 实例；状态目录放在实验 .state 内。
async function setup(t, overrides = {}) {
  await mkdir(join(ROOT, '.state'), { recursive: true });
  const dir = await mkdtemp(join(ROOT, '.state/session-list-'));
  const app = await serve({ port: 0, mockDelayMs: 1, stateDir: join(dir, 'state'), ...overrides }, { website: false });
  const { spike } = app;
  t.after(async () => { await app.close(); spike.snapshot = null; spike.jobs.clear(); if (spike.mock) spike.mock.requests.length = 0; await rm(dir, { recursive: true, force: true }); });
  const release = (await spike.ready()).release;
  const metaDir = join(spike.config.stateDir, 'metadata');
  return {
    app, spike, release, metaDir,
    run: async (message, id, extra = {}) => { const job = spike.start({ message, release, ...extra }, id); await job.done; return job; },
    list: async () => { const res = await fetch(`${app.url}api/sessions`); return { res, body: await res.json() }; },
    // 手写一个 metadata 文件并设置 mtime（毫秒）；返回 id。
    plant: async (content, mtimeMs, id = randomUUID()) => {
      const path = join(metaDir, `${id}.json`);
      await writeFile(path, typeof content === 'string' ? content : JSON.stringify(content));
      await utimes(path, new Date(mtimeMs), new Date(mtimeMs));
      return id;
    },
  };
}
const NOW = () => Date.now();

test('sessionTitle：纯指令名、消息首行、30 码点截断不拆代理对、控制字符剔除、兜底', () => {
  assert.equal(sessionTitle({ input: '  worker_connections \n' }, { message: '随便' }), 'worker_connections');
  // 对象不是纯指令名（含空格）时回退到消息首行，跳过前导空行并 trim。
  assert.equal(sessionTitle({ input: 'events { }' }, { message: '\n  \n  第一行  \n第二行' }), '第一行');
  const emoji = '🙂'.repeat(40);
  const cut = sessionTitle(null, { message: emoji });
  assert.equal(Array.from(cut).length, 30); assert.equal(cut, '🙂'.repeat(30));
  assert.equal(Array.from(sessionTitle(null, { message: '中'.repeat(31) })).length, 30);
  assert.equal(sessionTitle(null, { message: 'a\u0000b\u001b[31mc\u202ed\u0085e' }), 'ab[31mcde');
  assert.equal(sessionTitle(null, { message: '\u0000\u0007' }), UNTITLED);
  assert.equal(sessionTitle(null, {}), UNTITLED);
  assert.equal(sessionTitle(null, { input: 'events {\n}' }), 'events {');
  // 密钥先于截断被替换。
  assert.ok(!sessionTitle(null, { message: '请使用 sk-secret-123 访问' }, ['sk-secret-123']).includes('sk-secret'));
});

test('两个以上会话按 mtime 倒序；响应只含三个字段；不泄露配置原文、模型地址；列表不改 mtime', async t => {
  const { spike, run, list, metaDir } = await setup(t);
  const a = await run('worker_connections 的默认值是什么');
  const b = await run('事件配置\n' + fixtures.events.input);
  // 人为错开 mtime：a 比 b 新。
  const base = NOW();
  await utimes(join(metaDir, `${b.sessionId}.json`), new Date(base - 5000), new Date(base - 5000));
  await utimes(join(metaDir, `${a.sessionId}.json`), new Date(base - 1000), new Date(base - 1000));
  const before = Object.fromEntries(await Promise.all((await readdir(metaDir)).map(async n => [n, (await lstat(join(metaDir, n))).mtimeMs])));
  const { res, body } = await list();
  assert.equal(res.status, 200); assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.deepEqual(Object.keys(body), ['sessions']);
  assert.deepEqual(body.sessions.map(item => item.id), [a.sessionId, b.sessionId]);
  for (const item of body.sessions) {
    assert.deepEqual(Object.keys(item).sort(), ['id', 'title', 'updatedAt']);
    assert.match(item.id, /^[0-9a-f-]{36}$/); assert.equal(typeof item.updatedAt, 'number');
    assert.equal(item.updatedAt, before[`${item.id}.json`]);
  }
  assert.equal(body.sessions[0].title, 'worker_connections');
  const text = JSON.stringify(body);
  assert.ok(!text.includes('multi_accept')); assert.ok(!text.includes(spike.mock.baseUrl)); assert.ok(!text.includes('127.0.0.1'));
  assert.ok(!text.includes('request')); assert.ok(!text.includes('cacheKeys')); assert.ok(!text.includes('/sessions/'));
  // 列表（含重复调用）不改任何 metadata 的 mtime。
  await list();
  for (const name of await readdir(metaDir)) assert.equal((await lstat(join(metaDir, name))).mtimeMs, before[name], name);
});

test('上限 50 条；retentionEnabled 时过期会话不返回，关闭时不过滤', async t => {
  const { plant, list, spike } = await setup(t);
  const base = NOW();
  const ids = [];
  for (let i = 0; i < 60; i++) ids.push(await plant({ title: `会话${i}` }, base - i * 1000 - 1000));
  const { body } = await list();
  assert.equal(body.sessions.length, 50);
  // 最新的在前，第 51 条之后被截掉。
  assert.deepEqual(body.sessions.map(item => item.id), ids.slice(0, 50));
  assert.equal(body.sessions[0].title, '会话0');
  // 过期：只让一部分过期。
  spike.config.retentionEnabled = true; spike.config.sessionTtlMs = 20_500;
  const expired = (await list()).body.sessions;
  assert.equal(expired.length, 20);
  assert.ok(expired.every(item => base - item.updatedAt < 21_500));
  assert.ok(!expired.some(item => ids.slice(20).includes(item.id)));
  spike.config.retentionEnabled = false;
  assert.equal((await list()).body.sessions.length, 50);
});

test('标题：纯指令名与消息首行；旧 metadata 无 title 时读时计算且不回写', async t => {
  const { run, plant, list, metaDir } = await setup(t);
  const named = await run('worker_connections 的默认值是什么');
  const config = await run('  \n' + fixtures.events.input + '\n后一行');
  const metaNamed = JSON.parse(await readFile(join(metaDir, `${named.sessionId}.json`), 'utf8'));
  const metaConfig = JSON.parse(await readFile(join(metaDir, `${config.sessionId}.json`), 'utf8'));
  assert.equal(metaNamed.title, 'worker_connections');
  assert.equal(metaConfig.title, 'events { multi_accept on; worker_conn'.slice(0, 30));
  // 旧 metadata：没有 title；currentSubject 为纯指令名 / 消息首行 / 旧入口 input / 全空。
  const base = NOW();
  const o1 = await plant({ currentSubject: { input: 'listen' }, request: { message: '无关' } }, base - 1000);
  const o2 = await plant({ currentSubject: null, request: { message: '\n  旧消息首行 \n第二行' } }, base - 2000);
  const o3 = await plant({ request: { input: 'server {\n listen 80; }', mode: 'main' } }, base - 3000);
  const o4 = await plant({}, base - 4000);
  const raw = JSON.stringify({ request: { message: '旧消息' } });
  const o5 = await plant(raw, base - 5000);
  const { body } = await list();
  const title = id => body.sessions.find(item => item.id === id)?.title;
  assert.equal(title(o1), 'listen'); assert.equal(title(o2), '旧消息首行'); assert.equal(title(o3), 'server {');
  assert.equal(title(o4), UNTITLED); assert.equal(title(o5), '旧消息');
  // 不回写：文件内容与 mtime 保持原样。
  assert.equal(await readFile(join(metaDir, `${o5}.json`), 'utf8'), raw);
  assert.ok(Math.abs((await lstat(join(metaDir, `${o5}.json`))).mtimeMs - (base - 5000)) < 2);
  // 磁盘上的 title 也会被重新清洗（控制字符、超长）。
  const dirty = await plant({ title: 'x\u0000y' + '字'.repeat(60) }, base - 6000);
  const cleaned = (await list()).body.sessions.find(item => item.id === dirty).title;
  assert.equal(cleaned, 'xy' + '字'.repeat(28));
});

test('损坏文件、非法文件名、符号链接与目录被跳过且不报错', async t => {
  const { plant, list, metaDir } = await setup(t);
  const base = NOW();
  const good = await plant({ title: '正常' }, base - 1000);
  await plant('{ 损坏', base - 500);
  await plant('[1,2]', base - 400);
  await plant('null', base - 300);
  for (const name of ['not-a-uuid.json', `${randomUUID()}.json.tmp`, `${randomUUID().toUpperCase()}.json`, `${'a'.repeat(36)}.json`, `${randomUUID()}.txt`]) await writeFile(join(metaDir, name), JSON.stringify({ title: '非法名' }));
  // 符号链接指向合法文件：lstat 不是普通文件，必须跳过。
  await symlink(join(metaDir, `${good}.json`), join(metaDir, `${randomUUID()}.json`));
  await mkdir(join(metaDir, `${randomUUID()}.json`));
  const { res, body } = await list();
  assert.equal(res.status, 200);
  assert.deepEqual(body.sessions.map(item => item.id), [good]);
  assert.ok(!JSON.stringify(body).includes('非法名'));
});

test('只读取最近 200 个文件：更旧的有效会话不会因读取上限而出现', async t => {
  const { plant, list, metaDir } = await setup(t);
  const base = NOW();
  // 最近 200 个全部损坏，其后的有效文件不应被读取（有界），因此列表为空。
  for (let i = 0; i < 200; i++) await plant('{', base - 1000 - i);
  await plant({ title: '太旧' }, base - 999_999);
  assert.equal((await readdir(metaDir)).length, 201);
  assert.deepEqual((await list()).body.sessions, []);
});

test('运行中也能列表（不返回 409），删除后不再出现，其它方法仍走原逻辑', async t => {
  const { app, spike, release, run, list } = await setup(t, { mockDelayMs: 300 });
  const done = await run('worker_connections 的默认值是什么');
  const job = spike.start({ message: fixtures.events.input, release });
  assert.equal(spike.running, job);
  const during = await list();
  assert.equal(during.res.status, 200);
  assert.ok(during.body.sessions.some(item => item.id === done.sessionId));
  await job.done;
  assert.equal((await list()).body.sessions.length, 2);
  // 删除接口不变：删除后列表不再包含该会话。
  const del = await fetch(`${app.url}api/sessions/${done.sessionId}`, { method: 'DELETE' });
  assert.equal(del.status, 200); assert.deepEqual(await del.json(), { deleted: true });
  const after = (await list()).body.sessions;
  assert.ok(!after.some(item => item.id === done.sessionId)); assert.equal(after.length, 1);
  // 单个会话恢复路径仍然可用，且不返回 title（restore 返回值不变）。
  const restored = await (await fetch(`${app.url}api/sessions/${job.sessionId}`)).json();
  assert.equal(restored.sessionId, job.sessionId); assert.equal('title' in restored, false);
  // POST /api/sessions 不属于列表接口，仍落到原有的 404。
  const post = await fetch(`${app.url}api/sessions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(post.status, 404);
});

test('缓存命中、模型失败回滚与既有会话回滚路径的 metadata 都带 title', async t => {
  const { spike, run, metaDir } = await setup(t);
  const read = async id => JSON.parse(await readFile(join(metaDir, `${id}.json`), 'utf8'));
  const first = await run('worker_connections 的默认值是什么');
  const configMessage = '事件配置\n' + fixtures.events.input;
  await run(configMessage);
  const cached = await run(configMessage);
  assert.equal(cached.cacheHit, true);
  assert.equal((await read(cached.sessionId)).title, '事件配置');
  // 命中路径的标题要按缓存里的 currentSubject 重算：把缓存里的对象改成纯指令名，再次命中时标题应随之变为该指令名。
  const cacheDir = join(spike.config.stateDir, 'cache');
  const [cacheName] = await readdir(cacheDir);
  const entry = JSON.parse(await readFile(join(cacheDir, cacheName), 'utf8'));
  entry.resolution.currentSubject = { input: 'listen' };
  await writeFile(join(cacheDir, cacheName), JSON.stringify(entry));
  const hit = await run(configMessage);
  assert.equal(hit.cacheHit, true);
  assert.equal((await read(hit.sessionId)).title, 'listen');
  // 新会话失败回滚：metadata 保留、state failed、title 来自本次消息首行。
  const failed = await run('请解释默认值\n' + fixtures.events.input, undefined, { mockScenario: 'upstream-500' });
  assert.equal(failed.state, 'failed');
  const failedMeta = await read(failed.sessionId);
  assert.equal(failedMeta.state, 'failed'); assert.equal(failedMeta.title, '请解释默认值');
  // 既有会话上的失败回滚：原对象保留，title 仍存在（沿用既有 currentSubject 的纯指令名）。
  const again = await run('再解释一次\n' + fixtures.events.input, first.sessionId, { mockScenario: 'upstream-500' });
  assert.equal(again.state, 'failed');
  const againMeta = await read(first.sessionId);
  assert.equal(againMeta.state, 'failed'); assert.equal(typeof againMeta.title, 'string'); assert.equal(againMeta.title, 'worker_connections');
  // 模型 Key 不进入标题：在消息里放入密钥，host 的 secrets() 清洗后写入。
  spike.config.apiKey = 'sk-test-secret-key';
  const leak = await run('请使用 sk-test-secret-key 查询\n' + fixtures.events.input);
  assert.ok(!(await read(leak.sessionId)).title.includes('sk-test-secret-key'));
  spike.config.apiKey = undefined;
});
