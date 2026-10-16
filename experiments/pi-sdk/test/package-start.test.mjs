import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, relative } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { ROOT } from '../src/session.mjs';

test('独立运行包不依赖开发目录：启动、正常退出、强制中断与同路径恢复', { timeout: 60000 }, async () => {
  const packageRoot = await mkdtemp(join(tmpdir(), 'pi-package-local-'));
  const target = join(packageRoot, 'experiments/pi-sdk');
  let child;
  let servicePid;
  async function stop(signal) {
    if (child && child.exitCode === null && child.signalCode === null) { const exited = once(child, 'exit'); child.kill(signal); await exited; }
  }
  try {
    await mkdir(target, { recursive: true });
    for (const name of ['src', 'run.mjs', 'server.mjs', 'config.json', 'live.config.json', 'package.json', 'package-lock.json', 'node_modules', 'web']) await cp(join(ROOT, name), join(target, name), { recursive: true });
    await cp(resolve(ROOT, '../../src'), join(packageRoot, 'src'), { recursive: true });
    const sourceDist = resolve(ROOT, '../../dist');
    const release = JSON.parse(await readFile(join(sourceDist, 'knowledge/index.json'), 'utf8')).release_id;
    const releaseRoot = join(sourceDist, 'knowledge/releases');
    await cp(sourceDist, join(packageRoot, 'dist'), { recursive: true, filter: path => {
      const part = relative(releaseRoot, path);
      return part.startsWith('..') || !part || part.split('/')[0] === release;
    } });
    const configFile = join(packageRoot, 'local-test.json');
    await writeFile(configFile, JSON.stringify({ port: 0, stateDir: '.state/package-test', logRequests: true }));
    async function start() {
      child = spawn(process.execPath, ['run.mjs', 'start', '--config-file', configFile], { cwd: target, env: { PATH: process.env.PATH, PI_SPIKE_MODE: 'mock', PI_OFFLINE: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
      let output = ''; let errors = '';
      child.stderr.on('data', chunk => { errors += chunk; });
      return await new Promise((done, reject) => {
        const timer = setTimeout(() => reject(new Error('独立包启动超时')), 10000);
        child.once('error', error => { clearTimeout(timer); reject(error); });
        child.once('exit', () => { clearTimeout(timer); reject(new Error(`独立包退出：${errors}`)); });
        child.stdout.on('data', chunk => { output += chunk; const match = output.match(/http:\/\/127\.0\.0\.1:\d+\//); if (match) { const started = output.split('\n').find(line => line.startsWith('{') && line.includes('agent_start')); servicePid = JSON.parse(started).pid; clearTimeout(timer); done(match[0]); } });
      });
    }
    let url = await start();
    assert.equal((await fetch(new URL('/api/ready', url))).status, 200);
    const request = { input: 'events { worker_connections 1024; }', mode: 'main', release };
    const post = async (url, sessionId, question = '') => (await fetch(new URL('/api/run', url), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ request: { ...request, question }, ...(sessionId ? { sessionId } : {}) }) })).json();
    const first = await post(url);
    let result;
    for (let i = 0; i < 200; i++) { result = await (await fetch(new URL(`/api/jobs/${first.requestId}`, url))).json(); if (result.state !== 'running') break; await delay(10); }
    assert.equal(result.state, 'completed');
    await stop('SIGTERM');
    url = await start();
    assert.equal((await fetch(new URL(`/api/jobs/${first.requestId}`, url))).status, 404);
    const restored = await (await fetch(new URL(`/api/sessions/${first.sessionId}`, url))).json();
    assert.ok(restored.messages > 0);
    // 启动器转发正常退出信号；异常中断针对实际服务进程，不遗留孤儿子进程。
    assert.ok(Number.isInteger(servicePid) && servicePid > 0);
    const pending = await post(url, first.sessionId, '中断测试');
    const metaPath = join(target, '.state/package-test/metadata', `${first.sessionId}.json`);
    for (let i = 0; i < 200; i++) { if (JSON.parse(await readFile(metaPath, 'utf8')).state === 'running') break; await delay(5); }
    assert.equal(JSON.parse(await readFile(metaPath, 'utf8')).state, 'running');
    const exited = once(child, 'exit'); process.kill(servicePid, 'SIGKILL'); await exited;
    url = await start();
    const interrupted = await (await fetch(new URL(`/api/sessions/${first.sessionId}`, url))).json();
    assert.equal(interrupted.interrupted, true); assert.equal(interrupted.messages, restored.messages);
    assert.equal((await fetch(new URL(`/api/jobs/${pending.requestId}`, url))).status, 404);
    await stop('SIGTERM');
  } finally { await stop('SIGTERM'); await rm(packageRoot, { recursive: true, force: true }); }
});
