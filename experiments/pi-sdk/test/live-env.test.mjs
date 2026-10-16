import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLiveEnv } from '../src/live-env.mjs';
import { safeError } from '../src/errors.mjs';

test('外部错误回显凭据时统一脱敏', () => {
  assert.equal(safeError(new Error('provider rejected synthetic-secret synthetic-secret'), 'synthetic-secret'), 'provider rejected [已隐藏] [已隐藏]');
  assert.equal(safeError(new Error('timeout')), 'timeout');
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
