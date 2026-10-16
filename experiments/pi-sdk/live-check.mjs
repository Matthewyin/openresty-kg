import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { Spike, ROOT } from './src/session.mjs';
import { fixtures } from './test/fixtures/configs.mjs';

if (process.env.PI_SPIKE_MODE !== 'live') throw new Error('真实模型检查仅在 live 模式执行');
const records = [];
let spike = await Spike.create();
const redact = text => String(text).replaceAll(process.env.PI_SPIKE_API_KEY, '[已隐藏]');
async function run(name, request, sessionId) {
  const started = Date.now();
  console.log(JSON.stringify({ event: 'start', case: name }));
  const job = spike.start(request, sessionId);
  await job.done;
  const elapsedMs = Date.now() - started;
  const view = spike.view(job);
  if (view.error) view.error = redact(view.error);
  records.push({ case: name, elapsedMs, ...view });
  console.log(JSON.stringify({ event: 'result', case: name, elapsedMs, state: job.state, error: view.error, cacheHit: job.cacheHit, metrics: job.metrics, summary: job.summary, tools: job.tools, toolCalls: job.trace.filter(event => event.event === 'tool_execution_start').length }));
  assert.equal(job.state, 'completed', view.error);
  if (name === 'follow-up' || name === 'restored-follow-up') {
    assert.equal(job.cacheHit, false, '追问测速必须是未命中');
    assert.ok(job.metrics.modelRoundTrips >= 1, '追问必须实际请求模型');
    assert.ok(elapsedMs <= 20000, `${name} 超过20秒目标：${elapsedMs}ms`);
  }
  return job;
}
try {
  const first = await run('events', fixtures.events);
  assert.equal(first.summary.matched, 3);
  assert.equal(first.metrics.modelRoundTrips, 0);
  const hit = await run('same-input-cache', fixtures.events);
  assert.equal(hit.cacheHit, true);
  assert.equal(hit.trace.length, 0);
  const followUp = await run('follow-up', { ...fixtures.events, question: '请给出 worker_connections 的默认值及对应的源码依据。' }, first.sessionId);
  assert.ok(followUp.modelSelection.facts.some(fact => fact.entryId.endsWith('--worker_connections') && fact.field === 'defaults'));
  const selectedDefault = followUp.modelSelection.resolvedFacts.find(fact => fact.entryId.endsWith('--worker_connections') && fact.field === 'defaults');
  assert.ok(selectedDefault.text.includes('512'));
  assert.ok(followUp.modelSelection.citations.some(citation => citation.entryId === selectedDefault.entryId && citation.field === 'defaults' && selectedDefault.source_ids.includes(citation.sourceId)));
  await spike.close();
  spike = await Spike.create();
  const restored = await spike.restore(first.sessionId);
  assert.ok(restored.messages > 0);
  console.log(JSON.stringify({ event: 'restored', messages: restored.messages }));
  const continued = await run('restored-follow-up', { ...fixtures.events, question: '请给出 multi_accept 的默认值及继承依据。' }, first.sessionId);
  for (const field of ['defaults', 'inheritance']) assert.ok(continued.modelSelection.facts.some(fact => fact.entryId.endsWith('--multi_accept') && fact.field === field));
  assert.ok(continued.modelSelection.resolvedFacts.find(fact => fact.entryId.endsWith('--multi_accept') && fact.field === 'defaults').text.includes('off'));
  const cancelJob = spike.start({ ...fixtures.stream, question: `取消验证 ${Date.now()}` });
  for (let i = 0; i < 2000 && !cancelJob.session && cancelJob.state === 'running'; i++) await delay(10);
  assert.equal(cancelJob.state, 'running');
  await spike.cancel(cancelJob.requestId);
  assert.equal(cancelJob.state, 'cancelled');
  records.push({ case: 'cancel', ...spike.view(cancelJob) });
  console.log(JSON.stringify({ event: 'result', case: 'cancel', state: cancelJob.state }));
  const vts = await run('vts', fixtures.vts);
  assert.equal(vts.summary.matched, 7);
  const stream = await run('stream', fixtures.stream);
  assert.equal(stream.summary.matched, 8);
} catch (error) {
  console.error(redact(error.message));
  process.exitCode = 1;
} finally {
  await spike.close();
  await mkdir(join(ROOT, 'artifacts'), { recursive: true });
  const config = JSON.parse(await readFile(join(ROOT, 'live.config.json'), 'utf8'));
  await writeFile(join(ROOT, 'artifacts/live-verification.json'), JSON.stringify({
    at: new Date().toISOString(), mode: 'live', provider: process.env.PI_SPIKE_PROVIDER,
    model: process.env.PI_SPIKE_MODEL, endpoint: process.env.PI_SPIKE_BASE_URL,
    limits: { contextWindow: config.contextWindow, maxTokens: config.maxTokens, timeoutMs: config.timeoutMs },
    status: process.exitCode ? 'failed' : 'passed', records,
  }, null, 2));
}
