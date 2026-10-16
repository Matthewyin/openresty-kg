import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { ROOT } from '../src/session.mjs';

test('统一输入两个模型阶段强制中断后，重启回滚检查点并保留原查询对象', { timeout: 40000 }, async () => {
  await mkdir(join(ROOT, '.state'), { recursive: true });
  const stateDir = await mkdtemp(join(ROOT, '.state/unified-crash-'));
  let child;
  let url;
  async function stop(signal) {
    if (child && child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit'); child.kill(signal); await exited;
    }
  }
  async function start() {
    child = spawn(process.execPath, ['server.mjs'], { cwd: ROOT, env: { PATH: process.env.PATH, PI_OFFLINE: '1', PI_SPIKE_MODE: 'mock', PI_SPIKE_PORT: '0', PI_SPIKE_STATE_DIR: stateDir, PI_CODING_AGENT_DIR: join(stateDir, 'agent') }, stdio: ['ignore', 'pipe', 'pipe'] });
    url = await new Promise((done, reject) => {
      let output = '';
      const timeout = setTimeout(() => reject(new Error('测试服务启动超时')), 5000);
      child.once('error', error => { clearTimeout(timeout); reject(error); });
      child.once('exit', () => { clearTimeout(timeout); reject(new Error('测试服务提前退出')); });
      child.stdout.on('data', data => {
        output += data;
        const found = output.match(/http:\/\/127\.0\.0\.1:\d+\//);
        if (found) { clearTimeout(timeout); done(found[0]); }
      });
    });
  }
  const get = async path => {
    const response = await fetch(new URL(path, url));
    assert.equal(response.status, 200);
    return response.json();
  };
  const post = async (message, release, sessionId) => {
    const response = await fetch(new URL('api/run', url), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ request: { message, release }, ...(sessionId ? { sessionId } : {}) }) });
    assert.equal(response.status, 202);
    return response.json();
  };
  async function waitJob(id, check) {
    for (let i = 0; i < 600; i++) {
      const job = await get(`api/jobs/${id}`);
      if (check(job)) return job;
      if (job.state !== 'running') throw new Error(`请求提前结束：${job.state}`);
      await delay(10);
    }
    throw new Error('等待模型阶段超时');
  }
  try {
    await start();
    const { release } = await get('api/ready');
    const input = 'events { multi_accept on; worker_connections 1024; }';
    const first = await post(input, release);
    await waitJob(first.requestId, job => job.state === 'completed');
    const metaPath = join(stateDir, 'metadata', `${first.sessionId}.json`);
    const firstMeta = JSON.parse(await readFile(metaPath, 'utf8'));
    const firstHistory = await readFile(firstMeta.file, 'utf8');
    for (const phase of ['input_resolution', 'basic']) {
      const pending = await post('刚才这段配置的默认值和继承依据是什么？', release, first.sessionId);
      await waitJob(pending.requestId, job => job.phase === phase && job.metrics.modelRoundTrips >= (phase === 'basic' ? 2 : 1));
      await stop('SIGKILL'); await start();
      const restored = await get(`api/sessions/${first.sessionId}`);
      assert.equal(restored.interrupted, true);
      assert.equal(restored.currentSubject.input, input);
      assert.equal(restored.currentConfig.input, input);
      assert.equal(await readFile(firstMeta.file, 'utf8'), firstHistory);
      assert.equal((await fetch(new URL(`api/jobs/${pending.requestId}`, url))).status, 404);
    }
    const followup = await post('默认值呢', release, first.sessionId);
    const result = await waitJob(followup.requestId, job => job.state === 'completed');
    assert.equal(result.inputResolution.action, 'followup');
    assert.equal(result.normalizedRequest.input, input);
  } finally {
    await stop('SIGTERM');
    await rm(stateDir, { recursive: true, force: true });
  }
});
