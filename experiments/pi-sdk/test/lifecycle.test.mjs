import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, readdir, rm, cp, utimes, lstat } from 'node:fs/promises';
import { join } from 'node:path';
import { Spike, ROOT } from '../src/session.mjs';
import { pruneState, stateBytes } from '../src/state-retention.mjs';
import { fixtures } from './fixtures/configs.mjs';

async function setup(t, overrides = {}) {
  await mkdir(join(ROOT, '.state'), { recursive: true });
  const dir = await mkdtemp(join(ROOT, '.state/local-lifecycle-'));
  let spike = await Spike.create({ stateDir: join(dir, 'state'), mockDelayMs: 1, ...overrides });
  t.after(async () => { await spike.close(); await rm(dir, { recursive: true, force: true }); });
  return { dir, get spike() { return spike; }, async restart() { await spike.close(); spike = await Spike.create({ ...spike.config }); return spike; } };
}
async function run(spike, request = fixtures.events, id) { const job = spike.start(request, id); await job.done; return job; }

test('终态数量和期限回收；活动请求不回收，失效job与持久会话分开', async t => {
  const { spike } = await setup(t, { maxJobs: 2, jobTtlMs: 10000, mockDelayMs: 50 });
  const first = await run(spike);
  await run(spike); const last = await run(spike);
  assert.equal(spike.jobs.size, 2); assert.equal(spike.jobs.has(first.requestId), false);
  assert.ok((await spike.restore(first.sessionId)).messages > 0);
  const active = spike.start({ ...fixtures.events, question: '默认值' });
  spike.pruneJobs(Date.now() + spike.config.jobTtlMs);
  assert.equal(spike.jobs.has(active.requestId), true); assert.equal(spike.jobs.has(last.requestId), false);
  await active.done;
});

test('恢复占用完整操作生命周期，异常释放，关闭后拒绝新增请求', async t => {
  const { spike } = await setup(t);
  const first = await run(spike);
  const restoring = spike.restore(first.sessionId);
  assert.throws(() => spike.start(fixtures.events), error => error.code === 'busy');
  await assert.rejects(spike.restore(first.sessionId), error => error.code === 'busy');
  assert.ok((await restoring).messages > 0);
  await assert.rejects(spike.restore('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), error => error.code === 'session_unavailable');
  assert.equal((await run(spike)).state, 'completed');
  await spike.close();
  assert.throws(() => spike.start(fixtures.events), error => error.code === 'unavailable');
  await assert.rejects(spike.ready(), error => error.code === 'unavailable');
});

test('历史预算拦截前保留原记录，不调用模型，不截断上下文', async t => {
  const { spike } = await setup(t);
  const first = await run(spike);
  const meta = JSON.parse(await readFile(spike.metadataPath(first.sessionId), 'utf8'));
  const before = await readFile(meta.file, 'utf8');
  spike.config.maxHistoryBytes = 1;
  const blocked = await run(spike, { ...fixtures.events, question: '继续默认值' }, first.sessionId);
  assert.equal(blocked.state, 'failed'); assert.equal(blocked.errorCode, 'history_limit');
  assert.equal(spike.mock.requests.length, 0); assert.equal(await readFile(meta.file, 'utf8'), before);
  assert.equal((await run(spike, { ...fixtures.events, question: '新问题' })).errorCode, 'history_limit');
});

test('容量拦截包括无问题与缓存克隆；重复拒绝不持续增长', async t => {
  const { spike } = await setup(t);
  const first = await run(spike); assert.equal(first.state, 'completed');
  const size = await stateBytes(spike.config.stateDir);
  spike.config.maxStateBytes = size + 1;
  for (const request of [fixtures.events, { ...fixtures.events, question: '不同问题' }, fixtures.events]) {
    const blocked = await run(spike, request);
    assert.equal(blocked.state, 'failed'); assert.equal(blocked.errorCode, 'storage_limit');
    assert.equal(await stateBytes(spike.config.stateDir), size);
  }
  assert.equal(spike.mock.requests.length, 0);
});

test('保留策略按引用关系清理，保留会话与检查点；过期追问不静默新建', async t => {
  const { spike } = await setup(t, { retentionEnabled: true, sessionTtlMs: 60000, cacheTtlMs: 60000 });
  const first = await run(spike);
  const second = await run(spike, { ...fixtures.events, input: 'events { worker_connections 1024; }' });
  const expiredPath = spike.metadataPath(first.sessionId);
  const firstMeta = JSON.parse(await readFile(expiredPath, 'utf8'));
  const secondMeta = JSON.parse(await readFile(spike.metadataPath(second.sessionId), 'utf8'));
  const checkpoint = join(spike.config.stateDir, 'checkpoints', `${second.sessionId}.jsonl`);
  await cp(secondMeta.file, checkpoint);
  const old = new Date(Date.now() - 120000);
  for (const path of [expiredPath, firstMeta.file, secondMeta.file, checkpoint]) await utimes(path, old, old);
  for (const name of await readdir(join(spike.config.stateDir, 'cache'))) await utimes(join(spike.config.stateDir, 'cache', name), old, old);
  const before = await stateBytes(spike.config.stateDir);
  const result = await pruneState(spike.config);
  assert.equal(result.removed.metadata, 1); assert.equal(result.removed.sessions, 1); assert.ok(result.removed.cache >= 1);
  assert.ok(result.bytes < before); assert.ok(await lstat(secondMeta.file)); assert.ok(await lstat(checkpoint));
  assert.ok((await spike.restore(second.sessionId)).messages > 0);
  await assert.rejects(spike.restore(first.sessionId), error => error.code === 'session_unavailable');
  const blocked = await run(spike, fixtures.events, first.sessionId);
  assert.equal(blocked.errorCode, 'session_unavailable');
  await assert.rejects(readFile(expiredPath), { code: 'ENOENT' });
});

test('最终metadata路径增量也计入容量，临界不足不能报告完成', async t => {
  const first = await setup(t);
  const request = { input: 'worker_connections 100;', mode: 'fragment', context: 'events' };
  const completed = await run(first.spike, request);
  assert.equal(completed.state, 'completed');
  const metaPath = first.spike.metadataPath(completed.sessionId);
  const meta = JSON.parse(await readFile(metaPath, 'utf8'));
  const finalBytes = (await lstat(metaPath)).size + (await lstat(meta.file)).size;
  const second = await setup(t, { maxStateBytes: finalBytes - 2 });
  const rejected = await run(second.spike, request);
  assert.equal(rejected.state, 'failed'); assert.equal(rejected.errorCode, 'storage_limit');
  assert.ok(await stateBytes(second.spike.config.stateDir) < second.spike.config.maxStateBytes);
  assert.equal(second.spike.mock.requests.length, 0);
});

test('精确缓存无需新模型输入；收紧输入预算不阻止零模型命中，但仍受磁盘预算约束', async t => {
  const { spike } = await setup(t);
  const request = { ...fixtures.events, question: '默认值' };
  assert.equal((await run(spike, request)).state, 'completed');
  const calls = spike.mock.requests.length;
  spike.config.maxHistoryBytes = 100;
  const cached = await run(spike, request);
  assert.equal(cached.cacheHit, true); assert.equal(cached.metrics.modelRoundTrips, 0);
  assert.equal(spike.mock.requests.length, calls);
  assert.equal((await run(spike, { ...request, question: '另一问题' })).errorCode, 'history_limit');
});

test('未启用保留策略时不删除旧用户数据；坏引用阻止整批删除', async t => {
  const { spike } = await setup(t);
  const first = await run(spike);
  const path = spike.metadataPath(first.sessionId);
  const old = new Date(0); await utimes(path, old, old);
  assert.equal((await pruneState(spike.config)).removed.metadata, 0);
  assert.ok((await spike.restore(first.sessionId)).messages > 0);
  const broken = join(spike.config.stateDir, 'metadata', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.json');
  await writeFile(broken, JSON.stringify({ file: '/outside.jsonl' }));
  spike.config.retentionEnabled = true;
  await utimes(path, old, old);
  await assert.rejects(pruneState(spike.config), /越界/);
  assert.ok(await lstat(path));
});

test('停写备份、同路径恢复与重启后追问，内存job不冒充持久结果', async t => {
  const state = await setup(t);
  const first = await run(state.spike, { ...fixtures.events, question: '默认值' });
  assert.equal(first.state, 'completed');
  const config = { ...state.spike.config };
  const before = await state.spike.restore(first.sessionId);
  await state.spike.close();
  const backup = join(state.dir, 'backup');
  await cp(config.stateDir, backup, { recursive: true });
  await state.restart();
  assert.equal(state.spike.jobs.size, 0);
  const later = await run(state.spike, { ...fixtures.events, question: '继承' }, first.sessionId);
  assert.equal(later.state, 'completed');
  await state.spike.close();
  await rm(config.stateDir, { recursive: true });
  await cp(backup, config.stateDir, { recursive: true });
  await state.restart();
  assert.equal((await state.spike.restore(first.sessionId)).messages, before.messages);
  assert.equal((await run(state.spike, { ...fixtures.events, question: '恢复后追问' }, first.sessionId)).state, 'completed');
});

test('请求终态日志只包含标识和计量，不包含配置、问题、凭据或路径', async t => {
  const { spike } = await setup(t, { logRequests: true, apiKey: 'synthetic-secret' });
  const lines = []; const log = console.log; console.log = line => lines.push(line);
  try { await run(spike, { ...fixtures.events, question: 'synthetic-private-question' }); }
  finally { console.log = log; }
  const entry = JSON.parse(lines[0]);
  assert.equal(entry.event, 'agent_request_end'); assert.equal(entry.mode, 'mock'); assert.equal(entry.state, 'completed');
  assert.ok(entry.requestId); assert.ok(entry.release); assert.equal(typeof entry.totalMs, 'number');
  const text = lines.join('');
  for (const forbidden of ['synthetic-secret', 'synthetic-private-question', fixtures.events.input, spike.config.stateDir]) assert.ok(!text.includes(forbidden));
});
