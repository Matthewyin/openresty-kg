import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { Spike, ROOT, compactHistory } from '../src/session.mjs';
import { loadSnapshot, knowledgeTools } from '../src/knowledge-tools.mjs';
import { validateModelReport, makeReport } from '../src/report.mjs';
import { parseSingle } from '../../../src/core/parser.mjs';
import { matchDirective } from '../../../src/core/matcher.mjs';
import { fixtures } from './fixtures/configs.mjs';

const run = async (spike, request, sessionId) => { const job = spike.start(request, sessionId); await job.done; return job; };
const usingSpike = async (fn, overrides = {}) => {
  await mkdir(join(ROOT, '.state'), { recursive: true });
  const temporary = await mkdtemp(join(ROOT, '.state/speed-'));
  const spike = await Spike.create({ stateDir: temporary, mockDelayMs: 1, ...overrides });
  try { return await fn(spike); } finally { await spike.close(); await rm(temporary, { recursive: true, force: true }); }
};

test('速度回归：常见样例一次模型往返，不传原始配置、解析树或完整源码', async t => {
  await mkdir(join(ROOT, '.state'), { recursive: true });
  const temporary = await mkdtemp(join(ROOT, '.state/speed-'));
  const spike = await Spike.create({ stateDir: temporary, mockDelayMs: 1 });
  try {
    for (const name of ['events', 'stream', 'vts']) {
      const before = spike.mock.requests.length;
      const job = spike.start({ ...fixtures[name], question: '说明这些配置的功能、默认值、继承及依据' });
      await job.done;
      assert.equal(job.state, 'completed', job.error);
      const requests = spike.mock.requests.slice(before);
      assert.equal(requests.length, 1, `${name} 不应强制模型调用解析及全部查询工具`);
      assert.equal(job.trace.filter(event => event.event === 'tool_execution_start').length, 0);
      assert.equal(job.metrics.modelRoundTrips, 1);
      assert.ok(job.metrics.inputBytes > 0);
      assert.ok(job.metrics.outputBytes > 0);
      assert.equal(job.metrics.inputBytes, requests[0].inputBytes);
      assert.equal(job.metrics.finalOutputBytes, requests[0].outputBytes);
      assert.ok(job.metrics.finalOutputBytes <= 2048);
      assert.ok(job.metrics.finalOutputBytes <= 10087 * 0.3);
      assert.ok(requests[0].inputBytes < 20000);
      const payload = JSON.stringify(requests[0].messages);
      assert.ok(!payload.includes(fixtures[name].input));
      for (const field of ['raw_args', 'end_offset', 'source_refs', 'ngx_command_t']) assert.ok(!payload.includes(field), field);
      assert.ok(job.modelSelection.facts.length > 0);
      assert.ok(job.modelSelection.facts.every(fact => Object.keys(fact).sort().join() === 'entryId,field'));
      t.diagnostic(JSON.stringify({ fixture: name, inputBytes: job.metrics.inputBytes, finalOutputBytes: job.metrics.finalOutputBytes, modelRoundTrips: job.metrics.modelRoundTrips, snapshotMs: job.metrics.stages.snapshotMs }));
    }
  } finally { await spike.close(); await rm(temporary, { recursive: true, force: true }); }
});

test('基础零模型、有问题一次模型、精确缓存命中零模型；非法选择不完成', () => usingSpike(async spike => {
  const basic = await run(spike, fixtures.events);
  assert.equal(basic.state, 'completed'); assert.equal(basic.metrics.modelRoundTrips, 0); assert.equal(spike.mock.requests.length, 0);
  const request = { ...fixtures.events, question: '默认值和继承？' };
  const selected = await run(spike, request);
  assert.equal(selected.state, 'completed'); assert.equal(selected.metrics.modelRoundTrips, 1);
  const cached = await run(spike, request);
  assert.equal(cached.cacheHit, true); assert.equal(cached.metrics.modelRoundTrips, 0); assert.equal(cached.metrics.outputBytes, 0); assert.equal(cached.trace.length, 0);
  for (const mockScenario of ['bad-citation', 'unknown-field', 'empty-selection', 'invalid-json']) {
    const job = await run(spike, { ...request, mockScenario });
    assert.equal(job.state, 'failed', mockScenario); assert.equal(job.cacheHit, false); assert.equal(job.modelSelection, null);
  }
  const unsupported = await run(spike, { ...request, mockScenario: 'unsupported' });
  assert.equal(unsupported.state, 'awaiting_input'); assert.equal(unsupported.modelSelection.status, 'unsupported');
  const ambiguous = await run(spike, { ...fixtures.fragment, question: '默认值？' });
  assert.equal(ambiguous.state, 'awaiting_input');
  assert.ok(ambiguous.matches.every(match => match.selected_id === null));
  assert.ok(ambiguous.items.every(item => item.entries.length > 1));
}));

test('两个只读工具返回紧凑摘要；按需批量查询只增加一次往返', () => usingSpike(async spike => {
  const snapshot = await loadSnapshot(spike.config);
  const request = spike.normalize(fixtures.events);
  const bundle = knowledgeTools(snapshot, () => request, []);
  await bundle.prepare();
  const parsed = bundle.analysis.parsed;
  await bundle.tools[0].execute('test', {});
  assert.equal(bundle.analysis.parsed, parsed);
  const ids = [...bundle.details.keys()];
  const result = await bundle.tools[1].execute('test', { entryIds: ids, fields: ['defaults'] });
  assert.ok(Buffer.byteLength(JSON.stringify(result)) < 5000);
  assert.ok(!JSON.stringify(result).includes('ngx_command_t'));
  await assert.rejects(bundle.tools[1].execute('test', { entryId: '../../outside' }), /不属于/);
  await assert.rejects(bundle.tools[1].execute('test', { entryId: ids[0], fields: ['sources'] }), /字段/);
  await assert.rejects(bundle.tools[1].execute('test', { entryId: ids[0], url: 'http://outside.invalid' }), /参数/);
  for (const mockScenario of ['query', 'analyze']) {
    const job = await run(spike, { ...fixtures.events, question: '默认值？', mockScenario });
    assert.equal(job.state, 'completed', job.error); assert.equal(job.metrics.modelRoundTrips, 2); assert.equal(job.metrics.toolCalls, 1);
  }
}));

test('single 原样复用 parseSingle 与 matcher；固定历史发布、不存在发布不回退', () => usingSpike(async spike => {
  const snapshot = await loadSnapshot(spike.config);
  for (const input of ['worker_connections', 'worker_connections 1024;', 'server { listen 80; }', 'worker_connections 1; multi_accept on;', '', 'worker_connections "']) {
    const single = parseSingle(input);
    const job = await run(spike, { input, mode: 'single', context: 'events' });
    assert.deepEqual(job.parsed.directives, single.directive ? [single.directive] : []);
    assert.deepEqual(job.parsed.errors, single.errors);
    if (single.directive) assert.deepEqual(job.matches[0], matchDirective(single.directive, snapshot.index, { context: 'events', module: null }));
    else assert.notEqual(job.state, 'completed');
  }
  const noContext = await run(spike, { input: 'worker_connections', mode: 'single', question: '默认值？' });
  assert.equal(noContext.state, 'awaiting_input'); assert.equal(noContext.matches[0].selected_id, null);
  const releases = await readdir(join(spike.config.distDir, 'knowledge/releases'), { withFileTypes: true });
  const history = releases.find(release => release.isDirectory() && release.name !== snapshot.index.release_id)?.name;
  assert.ok(history);
  const pinned = await run(spike, { input: 'worker_connections', mode: 'single', context: 'events', release: history });
  assert.equal(pinned.state, 'completed', pinned.error); assert.equal(pinned.knowledgeVersion.release, history);
  assert.equal((await spike.restore(pinned.sessionId)).knowledgeChanged, false);
  const missing = await run(spike, { ...fixtures.events, release: 'missing-release' });
  assert.equal(missing.state, 'failed'); assert.equal(missing.metrics.modelRoundTrips, 0);
  assert.throws(() => spike.start({ ...fixtures.events, release: '../escape' }), /发布/);
}));

test('限制与运行时只引用已有字段，保留子项状态和值，证据严格来自字段', () => usingSpike(async spike => {
  const job = await run(spike, { ...fixtures.events, question: '限制和代码原理？', mockScenario: 'extended' });
  assert.equal(job.state, 'completed', job.error); assert.equal(job.metrics.modelRoundTrips, 1);
  const snapshot = await loadSnapshot(spike.config);
  const bundle = knowledgeTools(snapshot, () => spike.normalize(fixtures.events), []);
  await bundle.prepare();
  for (const fact of job.modelSelection.resolvedFacts) {
    const detail = bundle.details.get(fact.entryId);
    assert.deepEqual(fact.value, detail[fact.field]);
    const ids = fact.field === 'limitations' ? detail.limitations.flatMap(item => item.source_ids) : [...detail.runtime.source_ids, ...detail.runtime.corroboration_source_ids];
    assert.deepEqual([...fact.source_ids].sort(), [...new Set(ids)].sort());
    for (const citation of job.modelSelection.citations.filter(item => item.entryId === fact.entryId && item.field === fact.field)) {
      const source = detail.sources.find(item => item.id === citation.sourceId);
      assert.ok(ids.includes(citation.sourceId)); assert.equal(citation.quote, source.code); assert.equal(citation.revision, source.revision);
    }
  }
  const entryId = [...bundle.details.keys()][0];
  assert.throws(() => validateModelReport({ facts: [{ entryId, field: 'summary', text: '伪造正文' }] }, bundle), /字段/);
  assert.throws(() => validateModelReport({ facts: [{ entryId, field: 'summary' }], citations: [] }, bundle), /契约/);
  const report = makeReport(validateModelReport({ facts: [{ entryId, field: 'summary' }] }, bundle), bundle);
  // summary 的状态与出处取自发布的字段证据；全部条目完成逐字段登记后应为 verified，宿主补齐的引文恰为证据所列源码原文。
  const summaryEvidence = bundle.details.get(entryId).summary_evidence;
  assert.equal(report.modelSelection.resolvedFacts[0].status, summaryEvidence.status);
  assert.equal(report.modelSelection.resolvedFacts[0].status, 'verified');
  assert.deepEqual([...new Set(report.modelSelection.citations.map(item => item.sourceId))].sort(), [...summaryEvidence.source_ids].sort());
  for (const citation of report.modelSelection.citations) {
    const source = bundle.details.get(entryId).sources.find(item => item.id === citation.sourceId);
    assert.equal(citation.entryId, entryId); assert.equal(citation.field, 'summary'); assert.equal(citation.quote, source.code);
  }
}));

test('旧 v1 会话不删除用户记录，transformContext 剔除旧全文但保留问题与已选身份', () => usingSpike(async spike => {
  const first = await run(spike, { ...fixtures.events, question: '第一轮问题' });
  const path = spike.metadataPath(first.sessionId);
  const meta = JSON.parse(await readFile(path, 'utf8'));
  const manager = spike.manager(meta.file);
  const previous = manager.buildSessionContext().messages.findLast(message => message.role === 'assistant');
  const entryId = 'nginx--ngx_event_core_module--worker_connections';
  const huge = '旧源码全文不得进入模型'.repeat(10000);
  manager.appendMessage({ role: 'user', content: JSON.stringify({ request: { ...fixtures.events, question: '旧合同问题' } }), timestamp: Date.now() });
  manager.appendMessage({ ...previous, content: [{ type: 'toolCall', id: 'legacy', name: 'query_knowledge', arguments: { entryId } }], stopReason: 'toolUse' });
  manager.appendMessage({ role: 'toolResult', toolCallId: 'legacy', toolName: 'query_knowledge', content: [{ type: 'text', text: JSON.stringify({ detail: { id: entryId, sources: [{ code: huge }] } }) }], isError: false, timestamp: Date.now() });
  manager.appendMessage({ ...previous, content: [{ type: 'text', text: JSON.stringify({ facts: [{ entryId, field: 'defaults', text: huge }], citations: [{ entryId, sourceId: 'old', quote: huge }] }) }] });
  await writeFile(path, JSON.stringify({ ...meta, contract: 'pi-spike-report-v1' }));
  assert.equal((await spike.restore(first.sessionId)).contractChanged, true);
  const follow = await run(spike, { ...fixtures.events, question: '继续问继承' }, first.sessionId);
  assert.equal(follow.state, 'completed', follow.error); assert.equal(follow.contractChanged, true);
  const actual = spike.mock.requests.at(-1);
  assert.equal(actual.userTurns, 3); assert.ok(actual.inputBytes < 20000);
  const payload = JSON.stringify(actual.messages);
  assert.ok(!payload.includes(huge)); assert.ok(!payload.includes(fixtures.events.input));
  for (const question of ['第一轮问题', '旧合同问题', '继续问继承', entryId]) assert.ok(payload.includes(question));
  assert.ok((await readFile(meta.file, 'utf8')).includes('旧源码全文不得进入模型'));
  const user = { role: 'user', content: '保留普通用户问题' };
  assert.deepEqual(compactHistory([user]), [user]);
}));

test('模型未完成先返回 running 基础报告；host 时间纳入超时与总耗时', async () => {
  await usingSpike(async spike => {
    const job = spike.start({ ...fixtures.events, question: '等待模型时基础反馈' });
    for (let i = 0; i < 1000 && !job.metrics.modelRoundTrips && job.state === 'running'; i++) await delay(2);
    assert.equal(job.state, 'running'); assert.equal(job.phase, 'basic'); assert.equal(job.summary.matched, 3); assert.ok(job.items.length); assert.equal(job.modelSelection, null);
    await spike.cancel(job.requestId); assert.equal(job.state, 'cancelled');
    assert.ok(job.metrics.totalMs >= job.metrics.stages.snapshotMs);
    assert.deepEqual(await readdir(join(spike.config.stateDir, 'cache')), []);
  }, { mockDelayMs: 300 });
  await usingSpike(async spike => {
    const job = await run(spike, { ...fixtures.events, question: 'host超时不得调用模型' });
    assert.equal(job.state, 'failed'); assert.match(job.error, /超时/); assert.equal(job.metrics.modelRoundTrips, 0);
    assert.ok(job.metrics.totalMs >= job.metrics.stages.snapshotMs);
  }, { timeoutMs: 1 });
  await usingSpike(async spike => {
    const job = await run(spike, { ...fixtures.events, question: '轮次受限', mockScenario: 'query' });
    assert.equal(job.state, 'failed'); assert.equal(job.metrics.modelRoundTrips, 1); assert.deepEqual(await readdir(join(spike.config.stateDir, 'cache')), []);
  }, { maxTurns: 1 });
});

test('无问题分支提交期间取消，不覆盖 cancelled、不写完成缓存，回滚已有会话', () => usingSpike(async spike => {
  const first = await run(spike, fixtures.events);
  const meta = JSON.parse(await readFile(spike.metadataPath(first.sessionId), 'utf8'));
  const previous = await readFile(meta.file, 'utf8');
  const originalManager = spike.manager.bind(spike);
  let pending;
  let cancellation;
  spike.manager = file => {
    const manager = originalManager(file);
    const originalFile = manager.getSessionFile.bind(manager);
    manager.getSessionFile = () => {
      const result = originalFile();
      queueMicrotask(() => { cancellation = spike.cancel(pending.requestId); });
      return result;
    };
    return manager;
  };
  pending = spike.start(fixtures.stream, first.sessionId);
  await pending.done; await cancellation;
  assert.equal(pending.state, 'cancelled'); assert.equal(pending.metrics.modelRoundTrips, 0);
  assert.equal(await readFile(meta.file, 'utf8'), previous);
  assert.equal((await readdir(join(spike.config.stateDir, 'cache'))).length, 1);
  assert.equal(JSON.parse(await readFile(spike.metadataPath(first.sessionId), 'utf8')).state, 'cancelled');
}));

test('thinking 回归：真实 SDK 请求显式 disabled，reasoning 配置变化使缓存失效', () => usingSpike(async spike => {
  const request = { ...fixtures.events, question: '默认值和继承依据' };
  const first = await run(spike, request);
  assert.equal(first.state, 'completed', first.error);
  assert.deepEqual(spike.mock.requests.at(-1).thinking, { type: 'disabled' });
  spike.config.reasoning = false;
  const changed = await run(spike, request);
  assert.equal(changed.cacheHit, false);
  assert.equal(changed.metrics.modelRoundTrips, 1);
  assert.equal(spike.mock.requests.at(-1).thinking, undefined);
  spike.config.reasoning = true;
  const cached = await run(spike, request);
  assert.equal(cached.cacheHit, true); assert.equal(cached.metrics.modelRoundTrips, 0);
}));

test('可配置思考级别透传真实 SDK，级别变化隔离缓存', () => usingSpike(async spike => {
  const request = { ...fixtures.events, question: '默认值和继承依据' };
  await run(spike, request);
  spike.config.thinkingLevel = 'low';
  const changed = await run(spike, request);
  assert.equal(changed.cacheHit, false);
  assert.equal(changed.state, 'completed', changed.error);
  assert.deepEqual(spike.mock.requests.at(-1).thinking, { type: 'enabled', clear_thinking: false });
  const cached = await run(spike, request);
  assert.equal(cached.cacheHit, true);
}));

test('thinking 回归：仅压缩模型历史，合成 thinking 不进入请求且 SDK 记录不改', () => usingSpike(async spike => {
  const first = await run(spike, { ...fixtures.events, question: '第一轮合成测试' });
  const meta = JSON.parse(await readFile(spike.metadataPath(first.sessionId), 'utf8'));
  const manager = spike.manager(meta.file);
  const previous = manager.buildSessionContext().messages.findLast(message => message.role === 'assistant');
  const marker = 'SYNTHETIC_THINKING_MUST_NOT_REPLAY';
  const thinking = { type: 'thinking', thinking: marker, thinkingSignature: 'reasoning_content' };
  const toolCall = { type: 'toolCall', id: 'synthetic-query', name: 'query_knowledge', arguments: { entryId: first.modelSelection.facts[0].entryId } };
  const history = [{ ...previous, content: [thinking, ...previous.content, toolCall] }, { role: 'user', content: '保留合成追问' }];
  const before = structuredClone(history);
  const compact = compactHistory(history);
  assert.ok(!compact[0].content.some(part => part.type === 'thinking'));
  assert.ok(compact[0].content.some(part => part.type === 'text'));
  assert.ok(compact[0].content.some(part => part.type === 'toolCall'));
  assert.deepEqual(history, before);
  manager.appendMessage({ ...previous, content: [thinking, ...previous.content] });
  const follow = await run(spike, { ...fixtures.events, question: '继续合成追问' }, first.sessionId);
  assert.equal(follow.state, 'completed', follow.error);
  assert.ok(!JSON.stringify(spike.mock.requests.at(-1).messages).includes(marker));
  assert.ok((await readFile(meta.file, 'utf8')).includes(marker));
}));
