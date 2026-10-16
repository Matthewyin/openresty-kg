import assert from 'node:assert/strict';
import { appendFile, mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { Spike, ROOT } from './src/session.mjs';
import { fixtures } from './test/fixtures/configs.mjs';
import { CONTRACT } from './src/report.mjs';

if (process.env.PI_SPIKE_MODE !== 'live') throw new Error('速度验收必须使用真实模型');
const baseline = JSON.parse(await readFile(join(ROOT, '../../analysis/PI_AGENT_SPEED_BASELINE.json'), 'utf8'));
const output = { at: new Date().toISOString(), model: process.env.PI_SPIKE_MODEL, baseline, samples: [], status: 'running' };
const artifact = join(ROOT, 'artifacts/speed-verification.json');
await mkdir(join(ROOT, '.state'), { recursive: true });
await mkdir(join(ROOT, 'artifacts'), { recursive: true });
const state = await mkdtemp(join(ROOT, '.state/speed-live-'));
const save = () => writeFile(artifact, JSON.stringify(output, null, 2));
const question = '说明这些配置的功能、默认值、继承及依据';
let spike;
try {
  for (const name of ['events', 'vts', 'stream']) {
    for (let sample = 1; sample <= 3; sample++) {
      process.env.PI_SPIKE_STATE_DIR = join(state, `${name}-${sample}`);
      spike = await Spike.create();
      const request = { ...fixtures[name], question };
      const started = performance.now();
      console.log(JSON.stringify({ event: 'start', case: name, sample }));
      const job = spike.start(request);
      await job.done;
      const elapsedMs = Math.round(performance.now() - started);
      const record = { name, sample, elapsedMs, state: job.state, error: job.error,
        codeHash: spike.codeHash, contract: CONTRACT,
        modelConfig: { reasoning: spike.config.reasoning, compat: spike.config.compat, maxTokens: spike.config.maxTokens },
        cacheHit: job.cacheHit, knowledgeVersion: job.knowledgeVersion, metrics: job.metrics,
        summary: job.summary, selection: job.modelSelection, tools: job.tools };
      output.samples.push(record);
      await save();
      console.log(JSON.stringify({ event: 'result', ...record, selection: undefined }));
      assert.equal(job.state, 'completed', job.error);
      assert.equal(job.cacheHit, false);
      assert.equal(job.summary.matched, { events: 3, vts: 7, stream: 8 }[name]);
      assert.ok(job.metrics?.modelRoundTrips >= 1, '不得用纯确定性路径冒充模型提速');
      assert.ok(job.metrics.modelRoundTrips <= 2, '模型往返超过预算');
      assert.ok(job.metrics.sdkTurns <= 2 && job.metrics.toolCalls <= 1, '工具或轮次超过预算');
      const previous = baseline.cases.find(c => c.name === name);
      assert.ok(job.metrics.finalOutputBytes <= 2048, '模型最终输出超过2KiB');
      assert.ok(job.metrics.finalOutputBytes <= previous.outputBytes * 0.3, '模型最终输出未减少70%');
      if (name === 'vts') assert.ok(job.metrics.inputBytes <= 425495 * 0.3, 'VTS模型请求负载未达到目标');
      assert.ok(elapsedMs < baseline.cases.find(c => c.name === name).elapsedMs, '实际耗时退步');
      await spike.close(); spike = undefined;
    }
  }
  output.comparison = ['events', 'vts', 'stream'].map(name => {
    const samples = output.samples.filter(item => item.name === name);
    const medianMs = samples.map(item => item.elapsedMs).sort((a, b) => a - b)[1];
    const previous = baseline.cases.find(item => item.name === name);
    assert.ok(medianMs <= previous.elapsedMs / 2, `${name} 中位数未达到50%改善`);
    return { name, medianMs, previousMs: previous.elapsedMs, reductionPercent: Number((100 * (1 - medianMs / previous.elapsedMs)).toFixed(1)) };
  });
  output.status = 'passed';
} catch (error) {
  output.status = 'failed';
  output.error = String(error.message).replaceAll(process.env.PI_SPIKE_API_KEY, '[已隐藏]');
  console.error(output.error); process.exitCode = 1;
} finally {
  await spike?.close();
  await save();
  await appendFile(join(ROOT, 'artifacts/speed-verification-history.jsonl'), `${JSON.stringify(output)}\n`);
  await rm(state, { recursive: true, force: true });
}
