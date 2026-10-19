import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLiveEnv } from '../src/live-env.mjs';
import { safeError, errorCategory } from '../src/errors.mjs';

test('外部错误回显凭据时统一脱敏，空消息和路径改为固定类别文案', () => {
  assert.equal(safeError(new Error('provider rejected synthetic-secret synthetic-secret'), 'synthetic-secret'), 'provider rejected [已隐藏] [已隐藏]');
  assert.equal(safeError(new Error('timeout')), 'timeout');
  assert.equal(safeError(new Error(''), 'synthetic-secret'), '请求未能完成');
  assert.equal(safeError(new Error(), 'synthetic-secret'), '请求未能完成');
  assert.equal(errorCategory(new Error('')), 'unknown');
  assert.equal(safeError(Object.assign(new Error('read failed'), { path: '/tmp/secret.env', syscall: 'open' })), '服务端文件访问失败，请检查运行状态');
  assert.equal(errorCategory(Object.assign(new Error('read failed'), { path: '/tmp/secret.env' })), 'file');
  const leaked = safeError(new Error('cannot open /Users/example/.env for reading'), 'synthetic-secret');
  assert.equal(leaked, '请求未能完成');
  assert.ok(!leaked.includes('/Users'));
  assert.equal(errorCategory(new Error('模型报告契约无效')), 'contract');
  // 上游模型错误：HTTP 状态码、限流、网络层错误码与超时文本归为 upstream，文案固定且不含原文。
  for (const message of ['429 Too Many Requests: quota-marker', '503 Service Unavailable', 'HTTP 500 upstream-marker', 'Connection error.', 'Request timed out.', 'rate limit reached', 'fetch failed']) {
    assert.equal(errorCategory(new Error(message)), 'upstream', message);
    assert.equal(safeError(new Error(message), 'synthetic-secret'), '模型服务暂时不可用，请稍后重试', message);
  }
  // 带 syscall 的网络错误不能被当成本机文件访问失败。
  const refused = Object.assign(new Error('connect refused'), { code: 'ECONNREFUSED', syscall: 'connect' });
  assert.equal(errorCategory(refused), 'upstream');
  assert.equal(safeError(refused), '模型服务暂时不可用，请稍后重试');
  // 宿主自己的校验文案、取消和超时不会被误判为上游。
  for (const [message, category] of [['请求超时', 'timeout'], ['请求已取消', 'cancelled'], ['配置输入或模式无效', 'request'], ['question 无效', 'request'], ['本轮输入过大，请缩短问题', 'request']]) assert.equal(errorCategory(new Error(message)), category, message);
  // 显式打标优先：parse 与 contract 两类互不混淆。
  assert.equal(errorCategory(Object.assign(new Error('模型输出无法解析'), { category: 'parse' })), 'parse');
  assert.equal(safeError(Object.assign(new Error('模型输出无法解析'), { category: 'parse' })), '模型输出无法解析');
});

test('专用 env 仅映射选定字段，缺失与含凭据 URL 拒绝', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  await mkdir(join(root, '.state'), { recursive: true });
  const dir = await mkdtemp(join(root, '.state/env-test-'));
  const file = join(dir, 'fixture.env');
  const config = JSON.parse(await readFile(join(root, 'live.config.json'), 'utf8'));
  try {
    await writeFile(file, 'base-url=https://model.invalid/v1\nMODEL=example-model\nPROVIDER=example\nGLM_API_KEY=synthetic-secret\nUNRELATED_KEY=must-not-copy\n');
    const env = await loadLiveEnv(file, config);
    assert.equal(env.PI_SPIKE_MODE, 'live');
    assert.equal(env.PI_SPIKE_API_KEY, 'synthetic-secret');
    assert.equal(env.PI_SPIKE_MODEL, 'example-model');
    assert.equal(env.PI_SPIKE_STATE_DIR, '.state/live');
    assert.equal(env.PI_SPIKE_THINKING_LEVEL, 'low');
    assert.ok(!('UNRELATED_KEY' in env));
    await writeFile(file, 'MODEL=example-model\n');
    await assert.rejects(loadLiveEnv(file, config), /缺少/);
    await writeFile(file, 'base-url=https://user:synthetic-secret@model.invalid/v1\nMODEL=m\nPROVIDER=p\nGLM_API_KEY=synthetic-secret\n');
    await assert.rejects(loadLiveEnv(file, config), error => /不带凭据/.test(error.message) && !error.message.includes('synthetic-secret'));
  } finally { await rm(dir, { recursive: true, force: true }); }
});
