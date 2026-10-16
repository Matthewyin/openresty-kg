import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { launchConfig } from '../src/launch-config.mjs';
import { RUNTIME_ENV, applyRuntimeEnv } from '../src/runtime-config.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'pi-launch-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = join(root, 'deployment.json');
  await writeFile(file, JSON.stringify({ host: '0.0.0.0', basePath: '/pi/', relativeLinks: true, port: 51991, stateDir: '.state/deployment', publicOrigin: 'https://knowledge.invalid/', timeoutMs: 21000, retentionEnabled: true, logRequests: false }));
  return { root, file };
}

test('部署配置仅映射运行字段，调用者显式变量优先且子进程保持白名单', async t => {
  const { root, file } = await fixture(t);
  const launch = await launchConfig(['start', '--config-file', file], { root, env: {
    PATH: '/test/bin', PI_SPIKE_PORT: '0', PI_SPIKE_TIMEOUT_MS: '24000', PI_SPIKE_RETENTION_ENABLED: 'false', PI_SPIKE_THINKING_LEVEL: 'low',
    PI_SPIKE_SITE_BASE: 'https://explicit.invalid/', PI_SPIKE_API_KEY: 'synthetic-only',
    HOME: '/must-not-inherit', OPENAI_API_KEY: 'must-not-copy', PI_CODING_AGENT_DIR: '/must-not-use', PI_SPIKE_UNKNOWN: 'must-not-copy',
  } });
  assert.equal(launch.env.PI_SPIKE_PORT, '0');
  assert.equal(launch.env.PI_SPIKE_TIMEOUT_MS, '24000');
  assert.equal(launch.env.PI_SPIKE_PUBLIC_ORIGIN, 'https://knowledge.invalid/');
  assert.equal(launch.env.PI_SPIKE_SITE_BASE, 'https://explicit.invalid/');
  assert.equal(launch.env.PI_SPIKE_RETENTION_ENABLED, 'false');
  assert.equal(launch.env.PI_SPIKE_LOG_REQUESTS, 'false');
  assert.equal(launch.env.PI_SPIKE_API_KEY, 'synthetic-only');
  assert.equal(launch.env.PI_CODING_AGENT_DIR, resolve(root, '.state/deployment/agent'));
  assert.equal(launch.env.PI_OFFLINE, '1');
  for (const key of ['HOME', 'OPENAI_API_KEY', 'PI_SPIKE_UNKNOWN']) assert.equal(launch.env[key], undefined);
  assert.deepEqual(launch.args, ['server.mjs']);
  const config = applyRuntimeEnv({ port: 1, timeoutMs: 100, retentionEnabled: true }, launch.env);
  assert.equal(config.port, 0); assert.equal(config.timeoutMs, 24000); assert.equal(config.retentionEnabled, false);
  assert.equal(config.thinkingLevel, 'low');
  assert.equal(config.host, '0.0.0.0'); assert.equal(config.basePath, '/pi/');
  assert.equal(config.relativeLinks, true);
});

test('website：live 默认与显式模型文件低于部署 JSON，显式环境最高', async t => {
  const { root, file } = await fixture(t);
  const modelFile = join(root, 'synthetic-model.txt');
  await writeFile(modelFile, 'URL=https://model.invalid/v1\nMODEL=synthetic-model\nPROVIDER=synthetic-provider\nKEY=synthetic-secret\n');
  await writeFile(join(root, 'live.config.json'), JSON.stringify({
    port: 51990, stateDir: '.state/live', timeoutMs: 180000, contextWindow: 131072, maxTokens: 8192,
    website: { port: 51992, stateDir: '.state/website' }, envKeys: { baseUrl: 'URL', model: 'MODEL', provider: 'PROVIDER', apiKey: 'KEY' },
  }));
  const args = ['website', '--env-file', modelFile];
  const defaults = await launchConfig(args, { root, env: {} });
  assert.equal(defaults.env.PI_SPIKE_PORT, '51992');
  assert.equal(defaults.env.PI_SPIKE_STATE_DIR, '.state/website');
  const deployed = await launchConfig([...args, '--config-file', file], { root, env: {} });
  assert.equal(deployed.env.PI_SPIKE_PORT, '51991');
  assert.equal(deployed.env.PI_SPIKE_TIMEOUT_MS, '21000');
  assert.equal(deployed.env.PI_SPIKE_MODEL, 'synthetic-model');
  assert.equal(deployed.env.PI_SPIKE_HOST, '0.0.0.0');
  assert.equal(deployed.env.PI_SPIKE_BASE_PATH, '/pi/');
  assert.equal(deployed.env.PI_SPIKE_RELATIVE_LINKS, 'true');
  const explicit = await launchConfig([...args, '--config-file', file], { root, env: {
    PI_SPIKE_PORT: '0', PI_SPIKE_STATE_DIR: '.state/explicit', PI_SPIKE_MODEL: 'explicit-model', PI_SPIKE_API_KEY: 'explicit-secret', PI_SPIKE_HOST: '127.0.0.1', PI_SPIKE_BASE_PATH: '/tools/', PI_SPIKE_RELATIVE_LINKS: 'false',
  } });
  assert.equal(explicit.env.PI_SPIKE_PORT, '0');
  assert.equal(explicit.env.PI_SPIKE_STATE_DIR, '.state/explicit');
  assert.equal(explicit.env.PI_SPIKE_MODEL, 'explicit-model');
  assert.equal(explicit.env.PI_SPIKE_API_KEY, 'explicit-secret');
  assert.equal(explicit.env.PI_SPIKE_HOST, '127.0.0.1');
  assert.equal(explicit.env.PI_SPIKE_BASE_PATH, '/tools/');
  assert.equal(explicit.env.PI_SPIKE_RELATIVE_LINKS, 'false');
  assert.equal(explicit.env.PI_SPIKE_WEBSITE, '1');
  assert.equal(explicit.env.PI_CODING_AGENT_DIR, resolve(root, '.state/explicit/agent'));
});

test('部署 JSON 拒绝秘密、未知字段、嵌套对象及无效文件选项', async t => {
  const { root, file } = await fixture(t);
  for (const config of [{ apiKey: 'synthetic' }, { baseUrl: 'https://model.invalid/' }, { mode: 'live' }, { envKeys: {} }, { port: {} }, { host: 0 }, { basePath: false }, { relativeLinks: 'true' }, { relativeLinks: 1 }, [], null]) {
    await writeFile(file, JSON.stringify(config));
    await assert.rejects(launchConfig(['start', '--config-file', file], { root, env: {} }), /部署配置/);
  }
  for (const args of [['start', '--config-file'], ['start', '--config-file', '--env-file'], ['start', '--config-file', file, '--config-file', file]]) {
    await assert.rejects(launchConfig(args, { root, env: {} }), /必须指定/);
  }
  for (const command of ['website', 'live', 'live-check', 'live-speed']) await assert.rejects(launchConfig([command], { root, env: {} }), /显式指定 --env-file/);
});

test('所有 RUNTIME_ENV 字段均贯通，包括布尔值；数值范围留给 loadConfig 校验', async t => {
  const { root, file } = await fixture(t);
  const values = Object.fromEntries(Object.keys(RUNTIME_ENV).map(key => [key, ['retentionEnabled', 'logRequests', 'relativeLinks'].includes(key) ? false : ['publicOrigin', 'siteBase'].includes(key) ? 'https://knowledge.invalid/' : key === 'stateDir' ? '.state/test' : key === 'host' ? '0.0.0.0' : key === 'basePath' ? '/pi/' : 17]));
  await writeFile(file, JSON.stringify(values));
  const launch = await launchConfig(['start', '--config-file', file], { root, env: {} });
  for (const [key, name] of Object.entries(RUNTIME_ENV)) assert.equal(launch.env[name], String(values[key]), key);
  assert.throws(() => applyRuntimeEnv({}, { PI_SPIKE_LOG_REQUESTS: '1' }), /true 或 false/);
  for (const value of ['1', '0', 'TRUE', '', true, false]) assert.throws(() => applyRuntimeEnv({}, { PI_SPIKE_RELATIVE_LINKS: value }), /true 或 false/);
  assert.equal(applyRuntimeEnv({}, { PI_SPIKE_RELATIVE_LINKS: 'true' }).relativeLinks, true);
  assert.equal(applyRuntimeEnv({}, { PI_SPIKE_RELATIVE_LINKS: 'false' }).relativeLinks, false);
});

test('test 强制 mock、不读取真实配置或模型文件，只发现 .test.mjs 入口', async t => {
  const { root } = await fixture(t);
  await mkdir(join(root, 'test'));
  for (const name of ['speed.test.mjs', 'spike.test.mjs', 'deployment-http.test.mjs', 'resume-child.mjs']) await writeFile(join(root, 'test', name), '');
  const launch = await launchConfig(['test', '--config-file', '/not-present', '--env-file', '/not-present'], { root, env: {
    PI_SPIKE_MODE: 'live', PI_SPIKE_STATE_DIR: '.state/user', PI_SPIKE_API_KEY: 'must-not-copy', PI_SPIKE_PUBLIC_ORIGIN: 'https://must-not-use.invalid/',
  } });
  assert.deepEqual(launch.args, ['--test', 'test/deployment-http.test.mjs', 'test/speed.test.mjs', 'test/spike.test.mjs']);
  assert.equal(launch.env.PI_SPIKE_MODE, 'mock');
  assert.equal(launch.env.PI_SPIKE_API_KEY, undefined);
  assert.equal(launch.env.PI_SPIKE_STATE_DIR, undefined);
  assert.equal(launch.env.PI_SPIKE_PUBLIC_ORIGIN, undefined);
  assert.equal(launch.env.PI_CODING_AGENT_DIR, resolve(root, '.state/server/agent'));
});
