import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLiveEnv } from './live-env.mjs';
import { RUNTIME_ENV } from './runtime-config.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
// 联网搜索 Key 与模型 Key 同属秘密变量，只允许从调用者环境显式透传，不从部署 JSON 写入。
const MODEL_ENV = ['PI_SPIKE_MODE', 'PI_SPIKE_BASE_URL', 'PI_SPIKE_API_KEY', 'PI_SPIKE_MODEL', 'PI_SPIKE_PROVIDER', 'PI_SPIKE_CONTEXT_WINDOW', 'PI_SPIKE_MAX_TOKENS', 'PI_SPIKE_WEB_SEARCH_API_KEY'];

function option(args, name) {
  const at = args.indexOf(name);
  if (at < 0) return undefined;
  if (!args[at + 1] || args[at + 1].startsWith('--') || args.indexOf(name, at + 1) >= 0) throw new Error(`${name} 必须指定一个文件路径`);
  return args[at + 1];
}

export async function launchConfig(args, { env: caller = process.env, root = ROOT } = {}) {
  const command = args[0] ?? 'start';
  if (!['start', 'test', 'live', 'live-check', 'live-speed', 'website'].includes(command)) throw new Error('未知验证命令');
  const testing = command === 'test';
  const env = { PATH: caller.PATH, PI_OFFLINE: '1' };
  if (testing) {
    env.PI_SPIKE_MODE = 'mock';
  } else {
    if (command.startsWith('live') || command === 'website') {
      const envFile = option(args, '--env-file');
      if (!envFile) throw new Error('真实模型验证必须显式指定 --env-file，不自动读取个人设置');
      const config = JSON.parse(await readFile(resolve(root, 'live.config.json'), 'utf8'));
      Object.assign(env, await loadLiveEnv(resolve(envFile), command === 'website' ? { ...config, ...config.website } : config));
    }
    const configFile = option(args, '--config-file');
    if (configFile) {
      const config = JSON.parse(await readFile(resolve(configFile), 'utf8'));
      if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('部署配置必须是 JSON 对象');
      for (const [key, value] of Object.entries(config)) {
        if (!Object.hasOwn(RUNTIME_ENV, key)) throw new Error('部署配置包含不支持的字段');
        if (!['string', 'number', 'boolean'].includes(typeof value)) throw new Error('部署配置字段必须为字符串、数字或布尔值');
        if (['host', 'basePath'].includes(key) && typeof value !== 'string') throw new Error('部署配置 host 和 basePath 必须为字符串');
        if (key === 'relativeLinks' && typeof value !== 'boolean') throw new Error('部署配置 relativeLinks 必须为布尔值');
        env[RUNTIME_ENV[key]] = String(value);
      }
    }
    for (const key of new Set([...Object.values(RUNTIME_ENV), ...MODEL_ENV])) if (caller[key] !== undefined) env[key] = caller[key];
    if ((command.startsWith('live') || command === 'website') && env.PI_SPIKE_MODE !== 'live') throw new Error('真实服务入口不能切换为 mock 模式');
  }
  if (command === 'website') env.PI_SPIKE_WEBSITE = '1';
  env.PI_CODING_AGENT_DIR = resolve(root, env.PI_SPIKE_STATE_DIR ?? '.state/server', 'agent');
  const childArgs = testing ? ['--test', ...(await readdir(resolve(root, 'test'))).filter(name => name.endsWith('.test.mjs')).sort().map(name => `test/${name}`)]
    : command === 'live-check' ? ['live-check.mjs'] : command === 'live-speed' ? ['speed-check.mjs'] : ['server.mjs'];
  return { command, cwd: root, env, args: childArgs };
}
