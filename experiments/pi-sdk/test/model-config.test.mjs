import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile, rm, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { parseModelConfig, createModelConfigSource, MODEL_FILE_MAX_BYTES } from '../src/model-config.mjs';
import { Spike, ROOT } from '../src/session.mjs';
import { serve } from '../server.mjs';
import { fixtures } from './fixtures/configs.mjs';

// 合法的基准模型配置；各用例在其上做局部改动。
const BASE = { provider: 'GLM', id: 'GLM-5.3-flash', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', contextWindow: 1000000, maxTokens: 8192, thinkingLevel: 'low' };
const text = (model = {}, top = {}) => JSON.stringify({ model: { ...BASE, ...model }, ...top });
const reasonOf = fn => { try { fn(); } catch (error) { return error; } assert.fail('应当抛错'); };

// 临时目录与模型文件写入工具。
async function workspace(t) {
  const dir = await mkdtemp(join(tmpdir(), 'pi-model-config-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const file = join(dir, 'configuration.json');
  const write = async (model = {}, top = {}) => writeFile(file, text(model, top));
  await write();
  return { dir, file, write };
}

test('parseModelConfig：合法配置规范化返回', () => {
  const { model } = parseModelConfig(text());
  assert.deepEqual({ ...model }, BASE);
  // 边界：1 字符 id、100 字符 id、含允许符号、maxTokens = contextWindow - 1、http 地址与端口。
  assert.equal(parseModelConfig(text({ id: 'a' })).model.id, 'a');
  assert.equal(parseModelConfig(text({ id: 'a'.repeat(100) })).model.id.length, 100);
  assert.equal(parseModelConfig(text({ id: 'org/Model_x:1.5-b'.replace('_', '.') })).model.id, 'org/Model.x:1.5-b');
  assert.equal(parseModelConfig(text({ contextWindow: 10, maxTokens: 9 })).model.maxTokens, 9);
  assert.equal(parseModelConfig(text({ baseUrl: 'http://127.0.0.1:8080/v1' })).model.baseUrl, 'http://127.0.0.1:8080/v1');
  for (const level of ['off', 'minimal', 'low', 'medium', 'high', 'xhigh']) assert.equal(parseModelConfig(text({ thinkingLevel: level })).model.thinkingLevel, level);
});

test('parseModelConfig：各类非法输入都带固定 reason，且错误信息不含文件内容', () => {
  const schema = [
    ['顶层多余字段', text({}, { extra: 1 })],
    ['顶层缺 model', JSON.stringify({ other: BASE })],
    ['顶层是数组', '[]'], ['顶层是 null', 'null'], ['model 不是对象', JSON.stringify({ model: 'x' })],
    ['model 多余字段', text({ apiKey: 'SECRET-MARKER' })],
    ...Object.keys(BASE).map(key => [`缺少 ${key}`, JSON.stringify({ model: Object.fromEntries(Object.entries(BASE).filter(([name]) => name !== key)) })]),
    ['id 为空', text({ id: '' })], ['id 超长', text({ id: 'a'.repeat(101) })], ['id 含空格', text({ id: 'a b' })], ['id 含中文', text({ id: '模型' })], ['id 非字符串', text({ id: 5 })],
    ['provider 超长', text({ provider: 'p'.repeat(51) })], ['provider 含非法字符', text({ provider: 'a;b' })],
    ['baseUrl 含凭据', text({ baseUrl: 'https://user:SECRET-MARKER@model.invalid/v1' })], ['baseUrl 含查询', text({ baseUrl: 'https://model.invalid/v1?k=1' })],
    ['baseUrl 含片段', text({ baseUrl: 'https://model.invalid/v1#x' })], ['baseUrl 协议不对', text({ baseUrl: 'ftp://model.invalid/' })], ['baseUrl 非地址', text({ baseUrl: 'not a url' })],
    ['contextWindow 小数', text({ contextWindow: 1.5 })], ['contextWindow 字符串', text({ contextWindow: '1000' })],
    ['maxTokens 为 0', text({ maxTokens: 0 })], ['maxTokens 等于窗口', text({ contextWindow: 100, maxTokens: 100 })], ['maxTokens 大于窗口', text({ contextWindow: 100, maxTokens: 200 })],
    ['maxTokens 小数', text({ maxTokens: 1.5 })],
    ['thinkingLevel 未知', text({ thinkingLevel: 'ultra' })], ['thinkingLevel 大小写', text({ thinkingLevel: 'Low' })],
    ['文件过大', text({}) + ' '.repeat(MODEL_FILE_MAX_BYTES)],
  ];
  for (const [name, input] of schema) {
    const error = reasonOf(() => parseModelConfig(input));
    assert.equal(error.reason, 'schema', name);
    assert.ok(!error.message.includes('SECRET-MARKER'), name);
  }
  // JSON 语法错误：reason 为 parse，且 V8 带出的文本片段不能出现在消息里。
  for (const input of ['SECRET-MARKER', '{ "model": SECRET-MARKER }', '{"model": {"id": "SECRET-MARKER" "x"}}', '', '{']) {
    const error = reasonOf(() => parseModelConfig(input));
    assert.equal(error.reason, 'parse', input);
    assert.ok(!error.message.includes('SECRET-MARKER'));
  }
  // 解析函数是纯函数：同样输入同样结果，不修改入参。
  assert.deepEqual(parseModelConfig(text()), parseModelConfig(text()));
});

test('createModelConfigSource：启动读取失败直接抛错；成功后固定 origin', async t => {
  const { dir, file, write } = await workspace(t);
  await assert.rejects(createModelConfigSource({ file: join(dir, 'missing.json') }), error => error.reason === 'read');
  await assert.rejects(createModelConfigSource({}), /显式指定/);
  await writeFile(file, '{ nope');
  await assert.rejects(createModelConfigSource({ file }), error => error.reason === 'parse');
  await write({ maxTokens: 0 });
  await assert.rejects(createModelConfigSource({ file }), error => error.reason === 'schema');
  await write();
  const source = await createModelConfigSource({ file });
  assert.equal(source.pinnedOrigin, 'https://open.bigmodel.cn');
  assert.deepEqual(await source.current(), { model: source.initial, state: 'ok' });
});

test('热读取：改文件后下一次 current() 取到新值；非法时保持旧值并标 invalid，恢复后回到 ok', async t => {
  const { file, write } = await workspace(t);
  const source = await createModelConfigSource({ file });
  await write({ id: 'model-b', maxTokens: 4096 });
  let current = await source.current();
  assert.equal(current.state, 'ok'); assert.equal(current.model.id, 'model-b'); assert.equal(current.model.maxTokens, 4096);
  // 非法 JSON：保持上一份有效配置，reason 为 parse。
  await writeFile(file, '{ broken SECRET-MARKER');
  current = await source.current();
  assert.deepEqual({ state: current.state, reason: current.reason, id: current.model.id }, { state: 'invalid', reason: 'parse', id: 'model-b' });
  // 校验失败：reason 为 schema。
  await write({ maxTokens: 0 });
  current = await source.current();
  assert.deepEqual({ state: current.state, reason: current.reason, id: current.model.id }, { state: 'invalid', reason: 'schema', id: 'model-b' });
  // 文件消失：reason 为 read，旧值仍可用。
  await rm(file);
  current = await source.current();
  assert.deepEqual({ state: current.state, reason: current.reason, id: current.model.id }, { state: 'invalid', reason: 'read', id: 'model-b' });
  // 恢复：新值生效，状态回到 ok 且不再带 reason。
  await write({ id: 'model-c' });
  current = await source.current();
  assert.deepEqual(current, { model: current.model, state: 'ok' });
  assert.equal(current.model.id, 'model-c');
});

test('origin 固定：换主机、协议、端口一律拒绝；同 origin 换路径被接受', async t => {
  const { file, write } = await workspace(t);
  const source = await createModelConfigSource({ file });
  for (const baseUrl of ['https://evil.invalid/api/paas/v4', 'http://open.bigmodel.cn/api/paas/v4', 'https://open.bigmodel.cn:8443/api/paas/v4', 'https://open.bigmodel.cn.evil.invalid/x']) {
    await write({ baseUrl, id: 'rejected-model' });
    const current = await source.current();
    assert.deepEqual({ state: current.state, reason: current.reason }, { state: 'invalid', reason: 'origin' }, baseUrl);
    // 被拒配置的任何字段都不生效。
    assert.equal(current.model.id, 'GLM-5.3-flash'); assert.equal(current.model.baseUrl, BASE.baseUrl);
  }
  await write({ baseUrl: 'https://open.bigmodel.cn/api/coding/paas/v4', id: 'path-changed' });
  const current = await source.current();
  assert.equal(current.state, 'ok'); assert.equal(current.model.baseUrl, 'https://open.bigmodel.cn/api/coding/paas/v4'); assert.equal(current.model.id, 'path-changed');
});

test('并发与缓存：同时多个 current() 只读一次；文件未变化不重复读取', async t => {
  const { file, write } = await workspace(t);
  const source = await createModelConfigSource({ file });
  await write({ id: 'changed' });
  const before = source.reads;
  const results = await Promise.all(Array.from({ length: 20 }, () => source.current()));
  assert.equal(source.reads - before, 1);
  assert.ok(results.every(item => item.model.id === 'changed' && item.state === 'ok'));
  // 把文件时间改到很久以前（脱离“刚修改”窗口），签名一致时不再读取。
  const old = new Date(Date.now() - 3600_000);
  await utimes(file, old, old);
  await source.current();
  const settled = source.reads;
  for (let i = 0; i < 5; i++) await source.current();
  assert.equal(source.reads, settled);
  // 非法文件同样只解析一次。
  await writeFile(file, '{ bad'); await utimes(file, old, old);
  await source.current();
  const bad = source.reads;
  for (let i = 0; i < 5; i++) assert.equal((await source.current()).state, 'invalid');
  assert.equal(source.reads, bad);
});

test('日志只记录状态变化的 state/reason，不含文件内容、密钥或模型地址', async t => {
  const { file, write } = await workspace(t);
  const logs = [];
  const source = await createModelConfigSource({ file, log: entry => logs.push(entry) });
  await writeFile(file, '{ SECRET-MARKER'); await source.current();
  await source.current();
  await write({ baseUrl: 'https://evil.invalid/v1' }); await source.current();
  await write(); await source.current();
  assert.deepEqual(logs, [{ event: 'model_config', state: 'invalid', reason: 'parse' }, { event: 'model_config', state: 'invalid', reason: 'origin' }, { event: 'model_config', state: 'ok' }]);
  const dump = JSON.stringify(logs);
  for (const marker of ['SECRET-MARKER', 'evil.invalid', 'bigmodel', BASE.id]) assert.ok(!dump.includes(marker), marker);
});

// ---- 与会话集成（mock 端点 + 模型文件） ----
async function withSpike(t, fn, extra = {}) {
  await mkdir(join(ROOT, '.state'), { recursive: true });
  const { dir, file, write } = await workspace(t);
  const state = await mkdtemp(join(ROOT, '.state/model-config-'));
  const spike = await Spike.create({ stateDir: state, mockDelayMs: 1, modelFile: file, ...extra });
  t.after(async () => { await spike.close(); spike.snapshot = null; spike.jobs.clear(); await rm(state, { recursive: true, force: true }); });
  return fn({ spike, dir, file, write, state });
}
const run = async (spike, request, sessionId) => { const job = spike.start(request, sessionId); await job.done; return job; };

test('改文件后下一次请求用新模型 id、窗口与输出上限；job 视图不暴露 model', t => withSpike(t, async ({ spike, write }) => {
  const request = { ...fixtures.events, question: '默认值和继承依据' };
  const first = await run(spike, request);
  assert.equal(first.state, 'completed', first.error);
  assert.equal(spike.mock.requests.at(-1).model, 'GLM-5.3-flash');
  assert.deepEqual(first.model, { id: 'GLM-5.3-flash', provider: 'GLM', baseUrl: BASE.baseUrl, contextWindow: 1000000, maxTokens: 8192, thinkingLevel: 'low' });
  await write({ id: 'model-next', contextWindow: 200000, maxTokens: 2048, thinkingLevel: 'off' });
  const second = await run(spike, { ...request, question: '换一个问题' });
  assert.equal(second.state, 'completed', second.error);
  assert.equal(spike.mock.requests.at(-1).model, 'model-next');
  assert.equal(second.model.contextWindow, 200000); assert.equal(second.model.maxTokens, 2048);
  // 思考级别随快照透传：off 在 SDK 请求里表现为 disabled。
  assert.deepEqual(spike.mock.requests.at(-1).thinking, { type: 'disabled' });
  const view = JSON.stringify(spike.view(second));
  assert.ok(!view.includes('bigmodel') && !('model' in spike.view(second)));
}));

test('文件被写成非法后保持旧配置继续服务；恢复后回到 ok', t => withSpike(t, async ({ spike, file, write }) => {
  await write({ id: 'model-good' });
  assert.deepEqual(await spike.modelStatus(), { model: 'model-good', modelConfig: { state: 'ok' } });
  await writeFile(file, '{ not json');
  assert.deepEqual(await spike.modelStatus(), { model: 'model-good', modelConfig: { state: 'invalid', reason: 'parse' } });
  const job = await run(spike, { ...fixtures.events, question: '非法期间仍可用' });
  assert.equal(job.state, 'completed', job.error);
  assert.equal(spike.mock.requests.at(-1).model, 'model-good'); assert.equal(job.modelConfigState, 'invalid');
  await write({ id: 'model-back' });
  assert.deepEqual(await spike.modelStatus(), { model: 'model-back', modelConfig: { state: 'ok' } });
}));

test('请求进行中改文件不影响本次请求的意图与字段选择阶段（含纠正重试）', t => withSpike(t, async ({ spike, write }) => {
  // intent-echo：意图 → 字段选择 → 纠正重试，共三次模型请求，覆盖两个阶段与重试。
  const job = spike.start({ message: 'events { worker_connections 1024; }', release: (await spike.ready()).release, mockScenario: 'intent-echo' });
  for (let i = 0; i < 400 && !spike.mock.requests.length; i++) await delay(2);
  assert.ok(spike.mock.requests.length >= 1);
  await write({ id: 'model-mid-request', contextWindow: 123456, maxTokens: 1000 });
  await job.done;
  assert.equal(job.state, 'completed', job.error);
  assert.ok(spike.mock.requests.length >= 3);
  assert.deepEqual(new Set(spike.mock.requests.map(item => item.model)), new Set(['GLM-5.3-flash']));
  assert.equal(job.model.id, 'GLM-5.3-flash'); assert.equal(job.model.contextWindow, 1000000);
  // 下一次请求才使用新模型。
  const next = await run(spike, { ...fixtures.events, question: '下一次' });
  assert.equal(next.model.id, 'model-mid-request');
  assert.equal(spike.mock.requests.at(-1).model, 'model-mid-request');
}, { mockDelayMs: 150 }));

test('换模型后缓存不命中，改回后命中', t => withSpike(t, async ({ spike, write }) => {
  const request = { ...fixtures.events, question: '缓存隔离' };
  assert.equal((await run(spike, request)).cacheHit, false);
  assert.equal((await run(spike, request)).cacheHit, true);
  for (const change of [{ id: 'other-model' }, { contextWindow: 2000000 }, { maxTokens: 4096 }, { thinkingLevel: 'high' }]) {
    await write(change);
    const job = await run(spike, request);
    assert.equal(job.cacheHit, false, JSON.stringify(change));
    assert.equal(job.state, 'completed', job.error);
  }
  await write();
  const back = await run(spike, request);
  assert.equal(back.cacheHit, true); assert.equal(back.metrics.modelRoundTrips, 0);
}));

test('/api/status：返回当前模型 id 与 modelConfig 状态，不含 baseUrl 或密钥', async t => {
  const { file, write } = await workspace(t);
  await mkdir(join(ROOT, '.state'), { recursive: true });
  const state = await mkdtemp(join(ROOT, '.state/model-status-'));
  const app = await serve({ port: 0, stateDir: state, mockDelayMs: 1, modelFile: file });
  t.after(async () => { await app.close(); await rm(state, { recursive: true, force: true }); });
  const status = async () => (await fetch(new URL('/api/status', app.url))).json();
  let body = await status();
  assert.equal(body.model, 'GLM-5.3-flash'); assert.deepEqual(body.modelConfig, { state: 'ok' });
  await write({ id: 'status-new' });
  assert.equal((await status()).model, 'status-new');
  await writeFile(file, '{ SECRET-MARKER');
  body = await status();
  assert.equal(body.model, 'status-new'); assert.deepEqual(body.modelConfig, { state: 'invalid', reason: 'parse' });
  await write({ baseUrl: 'https://evil.invalid/v1' });
  assert.deepEqual((await status()).modelConfig, { state: 'invalid', reason: 'origin' });
  const dump = JSON.stringify(body) + JSON.stringify(await status());
  for (const marker of ['bigmodel', 'evil.invalid', 'SECRET-MARKER', 'baseUrl', 'apiKey']) assert.ok(!dump.includes(marker), marker);
  // 无模型文件的 mock 服务：状态恒为 ok。
  const plain = await serve({ port: 0, stateDir: await mkdtemp(join(ROOT, '.state/model-status-')), mockDelayMs: 1 });
  t.after(async () => { await plain.close(); await rm(plain.spike.config.stateDir, { recursive: true, force: true }); });
  assert.deepEqual((await (await fetch(new URL('/api/status', plain.url))).json()).modelConfig, { state: 'ok' });
});

test('启动时模型文件无法读取则 Spike 启动失败', async t => {
  const { dir } = await workspace(t);
  await mkdir(join(ROOT, '.state'), { recursive: true });
  const state = await mkdtemp(join(ROOT, '.state/model-fail-'));
  t.after(() => rm(state, { recursive: true, force: true }));
  await assert.rejects(Spike.create({ stateDir: state, modelFile: join(dir, 'absent.json') }), error => error.reason === 'read');
});
