import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm, cp, utimes, lstat } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { Spike, ROOT, budgetHistory, loadConfig } from '../src/session.mjs';
import { fixtures } from './fixtures/configs.mjs';

async function setup(t, overrides = {}) {
  await mkdir(join(ROOT, '.state'), { recursive: true });
  const dir = await mkdtemp(join(ROOT, '.state/retention-'));
  const spike = await Spike.create({ stateDir: join(dir, 'state'), mockDelayMs: 1, ...overrides });
  // node:test 会保留 after 闭包到文件结束；这里放下快照和模型请求，避免堆被历次会话撑满。
  t.after(async () => {
    await spike.close();
    spike.snapshot = null; spike.jobs.clear();
    if (spike.mock) spike.mock.requests.length = 0;
    await rm(dir, { recursive: true, force: true });
  });
  return { spike };
}
const run = async (spike, request = fixtures.events, id) => { const job = spike.start(request, id); await job.done; return job; };
const user = (question, identity = []) => ({ role: 'user', content: [{ type: 'text', text: JSON.stringify({ request: { question, mode: 'main', context: '', module: '' }, identity, historical: true }) }], timestamp: 1 });
const assistant = (facts, toolCall) => ({ role: 'assistant', content: [...(toolCall ? [toolCall] : []), { type: 'text', text: JSON.stringify({ facts }) }], timestamp: 2 });
const toolResult = (id, entryIds) => ({ role: 'toolResult', toolCallId: id, toolName: 'query_knowledge', content: [{ type: 'text', text: JSON.stringify({ tool: 'query_knowledge', entryIds, historical: true }) }], timestamp: 3 });

test('budgetHistory：未超预算原样返回；超预算只留摘要和最近整轮，不拆工具对', () => {
  const secret = '用户原问题不应出现在摘要';
  const webQuery = 'site:evil.example 查询词';
  const messages = [];
  for (let i = 0; i < 6; i++) {
    const call = { type: 'toolCall', id: `call-${i}`, name: 'web_search', arguments: { query: `${webQuery}-${i}`, site: 'nginx.org' } };
    messages.push(user(`${secret}-${i}`, [{ name: i % 2 ? 'worker_connections' : 'listen', entryIds: [`id-${i}`] }]), assistant([{ entryId: `id-${i}`, field: 'defaults' }], call), toolResult(`call-${i}`, [`id-${i}`]));
  }
  assert.equal(budgetHistory(messages, historySize(messages)), messages);
  const tiny = budgetHistory(messages, 1, 4);
  assert.equal(tiny[0].role, 'user');
  const digest = JSON.parse(tiny[0].content[0].text);
  assert.equal(digest.historical, true); assert.equal(digest.digest, true); assert.ok(digest.turns >= 5);
  const digestText = JSON.stringify(digest);
  assert.ok(!digestText.includes(secret)); assert.ok(!digestText.includes(webQuery)); assert.ok(!digestText.includes('evil.example'));
  assert.ok(digest.subjects.some(item => item.name === 'worker_connections'));
  assert.ok(digest.fields.some(item => item.entryId === 'id-0' && item.field === 'defaults'));
  assert.ok(digest.subjects.some(item => JSON.stringify(item.entryIds) === JSON.stringify(['id-0'])));
  // 只保留当前一轮：摘要加上最后一条 user，且该轮的 toolCall 仍紧挨对应 toolResult。
  assert.equal(tiny.filter(message => message.role === 'user').length, 2);
  assert.equal(tiny.at(-3).role, 'user');
  assert.equal(tiny.at(-1).role, 'toolResult'); assert.equal(tiny.at(-1).toolCallId, 'call-5');
  assert.ok(tiny.at(-2).content.some(part => part.type === 'toolCall' && part.id === 'call-5'));
  for (let i = 0; i < tiny.length; i++) {
    if (tiny[i].role !== 'toolResult') continue;
    const previous = tiny[i - 1];
    assert.equal(previous.role, 'assistant');
    assert.ok(previous.content.some(part => part.type === 'toolCall' && part.id === tiny[i].toolCallId));
  }
});

test('budgetHistory：重复身份合并，subjects 与 fields 各自不超过 50，预算允许时保留最近四轮', () => {
  const duplicated = [user('重复甲', [{ name: 'listen', entryIds: ['same'] }]), assistant([{ entryId: 'same', field: 'defaults' }]), user('重复乙', [{ name: 'listen', entryIds: ['same'] }]), assistant([{ entryId: 'same', field: 'defaults' }]), user('当前', []), assistant([])];
  const merged = JSON.parse(budgetHistory(duplicated, 1)[0].content[0].text);
  assert.equal(merged.subjects.length, 1); assert.equal(merged.fields.length, 1);
  const many = [];
  for (let i = 0; i < 60; i++) many.push(user(`问题${i}`, [{ name: `name_${i}`, entryIds: [`entry-${i}`] }]), assistant([{ entryId: `entry-${i}`, field: 'syntax' }]));
  const capped = JSON.parse(budgetHistory(many, 1, 1)[0].content[0].text);
  assert.equal(capped.subjects.length, 50); assert.equal(capped.fields.length, 50); assert.equal(capped.turns, 59);
  const roomy = budgetHistory(many, historySize(many.slice(-8)) + 800, 4);
  const keptUsers = roomy.filter(message => message.role === 'user' && !JSON.parse(message.content[0].text).digest);
  assert.ok(keptUsers.length <= 4); assert.ok(keptUsers.length >= 1);
  assert.equal(JSON.parse(roomy[0].content[0].text).digest, true);
});

test('启用保留期限时缓存期限不得长于会话，压缩预算必须小于硬上限', async () => {
  await assert.rejects(loadConfig({ retentionEnabled: true, cacheTtlMs: 2000, sessionTtlMs: 1000 }), /cacheTtlMs/);
  const allowed = await loadConfig({ retentionEnabled: true, cacheTtlMs: 1000, sessionTtlMs: 1000 });
  assert.equal(allowed.cacheTtlMs, 1000); assert.equal(allowed.sessionTtlMs, 1000);
  const disabled = await loadConfig({ retentionEnabled: false, cacheTtlMs: 5000, sessionTtlMs: 1000 });
  assert.equal(disabled.retentionEnabled, false); assert.equal(disabled.cacheTtlMs, 5000);
  await assert.rejects(loadConfig({ compactHistoryBytes: 262144 }), /compactHistoryBytes/);
  await assert.rejects(loadConfig({ compactHistoryBytes: 0 }), /compactHistoryBytes/);
  await assert.rejects(loadConfig({ pruneIntervalMs: -1 }), /pruneIntervalMs/);
});

test('maintain 在运行中跳过清理，close 后定时器不再触发，失败日志不含路径', async t => {
  const { spike } = await setup(t, { retentionEnabled: true, sessionTtlMs: 1000, cacheTtlMs: 1000, mockDelayMs: 200, logRequests: true, pruneIntervalMs: 60000 });
  const active = spike.start({ ...fixtures.events, question: '占用清理窗口' });
  // 等本轮自己的 pruneState 走完再放入过期文件，否则请求开头的清理会先把它删掉，测不到 maintain 的跳过。
  for (let i = 0; i < 50 && !active.metrics.modelRoundTrips && active.state === 'running'; i++) await delay(10);
  const id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const metaPath = join(spike.config.stateDir, 'metadata', `${id}.json`);
  const sessionFile = join(spike.config.stateDir, 'sessions', `${id}.jsonl`);
  await writeFile(sessionFile, '{}\n', { mode: 0o600 });
  await writeFile(metaPath, JSON.stringify({ file: sessionFile }), { mode: 0o600 });
  const old = new Date(0);
  await utimes(metaPath, old, old); await utimes(sessionFile, old, old);
  assert.equal((await spike.maintain()).skipped, true);
  assert.ok(await lstat(metaPath));
  await active.done;
  assert.equal((await spike.maintain()).removed.metadata, 1);
  await assert.rejects(lstat(metaPath), { code: 'ENOENT' });
  await writeFile(metaPath, JSON.stringify({ file: '/outside.jsonl' }), { mode: 0o600 });
  await utimes(metaPath, old, old);
  const lines = []; const log = console.log; console.log = line => lines.push(String(line));
  try { assert.equal((await spike.maintain()).failed, true); }
  finally { console.log = log; }
  const text = lines.join('');
  assert.match(text, /agent_prune_failed/);
  assert.ok(!text.includes(spike.config.stateDir)); assert.ok(!text.includes('/outside')); assert.ok(!text.includes(id));
});

test('周期清理定时器在 close 之后不再调用 maintain', async t => {
  const { spike } = await setup(t, { pruneIntervalMs: 20, retentionEnabled: false });
  let calls = 0;
  spike.maintain = async () => { calls += 1; };
  for (let i = 0; i < 40 && calls < 1; i++) await delay(20);
  assert.ok(calls >= 1);
  await spike.close();
  await delay(0);
  const frozen = calls;
  await delay(80);
  assert.equal(calls, frozen); assert.equal(spike.pruneTimer, null);
});

test('deleteSession 删除会话、检查点、metadata 与 cacheKeys，越界拒绝，忙碌 409，重复删除幂等', async t => {
  const { spike } = await setup(t, { mockDelayMs: 200 });
  const missing = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  assert.deepEqual(await spike.deleteSession(missing), { deleted: false });
  const first = await run(spike);
  assert.equal(first.state, 'completed', first.error);
  const metaPath = spike.metadataPath(first.sessionId);
  const meta = JSON.parse(await readFile(metaPath, 'utf8'));
  assert.ok(Array.isArray(meta.cacheKeys) && meta.cacheKeys.length === 1 && /^[a-f0-9]{64}$/.test(meta.cacheKeys[0]));
  const cacheFile = join(spike.config.stateDir, 'cache', `${meta.cacheKeys[0]}.json`);
  assert.ok(await lstat(cacheFile));
  const checkpoint = join(spike.config.stateDir, 'checkpoints', `${first.sessionId}.jsonl`);
  await cp(meta.file, checkpoint);
  const active = spike.start({ ...fixtures.events, question: '删除必须等待' });
  await assert.rejects(spike.deleteSession(first.sessionId), error => error.code === 'busy' && error.status === 409);
  await active.done;
  await writeFile(metaPath, JSON.stringify({ ...meta, file: '/outside.jsonl', cacheKeys: [...meta.cacheKeys, '../escape', 'not-a-key'] }));
  await assert.rejects(spike.deleteSession(first.sessionId), /越界/);
  assert.ok(await lstat(meta.file)); assert.ok(await lstat(metaPath)); assert.ok(await lstat(cacheFile));
  await writeFile(metaPath, JSON.stringify({ ...meta, cacheKeys: [...meta.cacheKeys, '../escape', 'not-a-key'] }));
  assert.deepEqual(await spike.deleteSession(first.sessionId), { deleted: true });
  for (const path of [meta.file, checkpoint, metaPath, cacheFile]) await assert.rejects(lstat(path), { code: 'ENOENT' });
  assert.deepEqual(await spike.deleteSession(first.sessionId), { deleted: false });
});

test('摘要截断过长的 name、entryId、field，每个 subject 最多 20 个 entryIds', () => {
  const long = 'n'.repeat(250);
  const ids = Array.from({ length: 30 }, (_, index) => `e${index}-` + 'x'.repeat(220));
  const messages = [user('旧问题', [{ name: long, entryIds: ids }]), assistant([{ entryId: long, field: 'f'.repeat(250) }]), user('当前', []), assistant([])];
  const digest = JSON.parse(budgetHistory(messages, 1)[0].content[0].text);
  assert.equal(digest.subjects[0].name.length, 200);
  assert.equal(digest.subjects[0].entryIds.length, 20);
  assert.ok(digest.subjects[0].entryIds.every(id => id.length === 200));
  assert.equal(digest.fields[0].entryId.length, 200);
  assert.equal(digest.fields[0].field.length, 200);
});

test('长会话实际发给模型的消息含 digest，工具调用成对，连续 user 仍被接受', async t => {
  const { spike } = await setup(t, { compactHistoryBytes: 24000 });
  const first = await run(spike);
  assert.equal(first.state, 'completed', first.error);
  const meta = JSON.parse(await readFile(spike.metadataPath(first.sessionId), 'utf8'));
  const manager = spike.manager(meta.file);
  const secret = '不得进入摘要的旧问题';
  for (let i = 0; i < 3; i++) {
    manager.appendMessage({ role: 'user', content: JSON.stringify({ request: { question: `${secret}-${i}-` + 'x'.repeat(80000), mode: 'main', context: '', module: '' }, identity: [{ name: 'listen', entryIds: [`id-${i}`] }] }), timestamp: Date.now() });
    manager.appendMessage({ role: 'assistant', content: [{ type: 'text', text: JSON.stringify({ facts: [{ entryId: `id-${i}`, field: 'defaults' }] }) }], timestamp: Date.now() });
  }
  const callId = 'kept-tool-call';
  manager.appendMessage({ role: 'user', content: JSON.stringify({ request: { question: '最近保留的问题', mode: 'main', context: '', module: '' } }), timestamp: Date.now() });
  manager.appendMessage({ role: 'assistant', content: [{ type: 'toolCall', id: callId, name: 'query_knowledge', arguments: { entryId: 'nginx--ngx_event_core_module--worker_connections' } }, { type: 'text', text: JSON.stringify({ facts: [{ entryId: 'nginx--ngx_event_core_module--worker_connections', field: 'syntax' }] }) }], timestamp: Date.now() });
  manager.appendMessage({ role: 'toolResult', toolCallId: callId, toolName: 'query_knowledge', content: [{ type: 'text', text: JSON.stringify({ tool: 'query_knowledge', entryIds: ['nginx--ngx_event_core_module--worker_connections'], historical: true }) }], isError: false, timestamp: Date.now() });
  const follow = await run(spike, { ...fixtures.events, question: '继续默认值' }, first.sessionId);
  assert.equal(follow.state, 'completed', follow.error);
  const messages = spike.mock.requests.at(-1).messages;
  const text = JSON.stringify(messages);
  assert.ok(text.includes('digest'), text.slice(0, 200));
  assert.ok(!text.includes(secret));
  let paired = false;
  let consecutiveUsers = false;
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === 'user' && messages[i + 1]?.role === 'user') consecutiveUsers = true;
    if (messages[i].role === 'assistant' && JSON.stringify(messages[i]).includes(callId)) {
      const next = messages[i + 1];
      assert.equal(next?.role, 'tool');
      assert.ok(JSON.stringify(next).includes(callId));
      paired = true;
    }
  }
  assert.equal(paired, true);
  assert.equal(consecutiveUsers, true);
});

test('清理进行中时 start、restore、deleteSession 返回 busy，close 会等待这次清理', async t => {
  const { spike } = await setup(t, { retentionEnabled: false });
  let release;
  spike.pruning = new Promise(resolve => { release = resolve; });
  assert.deepEqual(await spike.maintain(), { skipped: true });
  assert.throws(() => spike.start(fixtures.events), error => error.code === 'busy' && error.status === 409);
  await assert.rejects(spike.restore('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), error => error.code === 'busy' && error.status === 409);
  await assert.rejects(spike.deleteSession('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), error => error.code === 'busy' && error.status === 409);
  let closed = false;
  const closing = spike.close().then(() => { closed = true; });
  await delay(40);
  assert.equal(closed, false);
  release();
  await closing;
  assert.equal(closed, true);
  assert.equal(spike.pruning, null);
});

test('deleteSession 与 start、restore 互斥，损坏的 metadata 只删自身和检查点', async t => {
  const { spike } = await setup(t);
  const first = await run(spike);
  const metaPath = spike.metadataPath(first.sessionId);
  const realFile = JSON.parse(await readFile(metaPath, 'utf8')).file;
  // deleteSession 在第一次 await 之前就置上 restoring，所以紧接着的 start/restore 必须看到 busy。
  const deleting = spike.deleteSession(first.sessionId);
  assert.equal(spike.restoring, true);
  assert.throws(() => spike.start(fixtures.events), error => error.code === 'busy' && error.status === 409);
  await assert.rejects(spike.restore(first.sessionId), error => error.code === 'busy' && error.status === 409);
  assert.deepEqual(await deleting, { deleted: true });
  assert.equal(spike.restoring, false);
  await assert.rejects(lstat(realFile), { code: 'ENOENT' });
  const brokenId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const brokenMeta = spike.metadataPath(brokenId);
  const kept = join(spike.config.stateDir, 'sessions', 'must-remain.jsonl');
  const checkpoint = join(spike.config.stateDir, 'checkpoints', `${brokenId}.jsonl`);
  await writeFile(kept, 'keep\n', { mode: 0o600 });
  await writeFile(checkpoint, 'checkpoint\n', { mode: 0o600 });
  await writeFile(brokenMeta, '{not-json', { mode: 0o600 });
  assert.deepEqual(await spike.deleteSession(brokenId), { deleted: true });
  await assert.rejects(lstat(brokenMeta), { code: 'ENOENT' });
  await assert.rejects(lstat(checkpoint), { code: 'ENOENT' });
  assert.equal(await readFile(kept, 'utf8'), 'keep\n');
});

function historySize(messages) { return Buffer.byteLength(JSON.stringify(messages)); }
