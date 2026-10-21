import { readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';

// 只从专用 env 文件读取 API 密钥（变量名由 live.config.json 的 envKeys.apiKey 指定）。
// 模型 id、地址、窗口、输出上限与思考级别全部来自 --model-file 指向的模型配置 JSON，不再经环境变量。
export async function loadLiveEnv(path, config) {
  const values = parseEnv(await readFile(path, 'utf8'));
  const apiKey = values[config.envKeys.apiKey];
  if (typeof apiKey !== 'string' || !apiKey.trim()) throw new Error('专用环境文件缺少 API 密钥');
  return {
    PI_SPIKE_MODE: 'live', PI_SPIKE_API_KEY: apiKey,
    PI_SPIKE_STATE_DIR: config.stateDir, PI_SPIKE_TIMEOUT_MS: String(config.timeoutMs), PI_SPIKE_PORT: String(config.port),
  };
}
