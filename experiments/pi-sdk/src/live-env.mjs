import { readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';

export async function loadLiveEnv(path, config) {
  const values = parseEnv(await readFile(path, 'utf8'));
  const selected = Object.fromEntries(Object.entries(config.envKeys).map(([name, key]) => [name, values[key]]));
  if (Object.values(selected).some(value => typeof value !== 'string' || !value.trim())) throw new Error('专用环境文件缺少配置的模型字段');
  let url;
  try { url = new URL(selected.baseUrl); } catch { throw new Error('模型地址格式无效'); }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('模型地址必须是不带凭据或查询参数的 HTTP(S) 地址');
  return {
    PI_SPIKE_MODE: 'live', PI_SPIKE_BASE_URL: selected.baseUrl,
    PI_SPIKE_MODEL: selected.model, PI_SPIKE_PROVIDER: selected.provider,
    PI_SPIKE_API_KEY: selected.apiKey,
    PI_SPIKE_CONTEXT_WINDOW: String(config.contextWindow), PI_SPIKE_MAX_TOKENS: String(config.maxTokens),
    ...(config.thinkingLevel === undefined ? {} : { PI_SPIKE_THINKING_LEVEL: config.thinkingLevel }),
    PI_SPIKE_STATE_DIR: config.stateDir, PI_SPIKE_TIMEOUT_MS: String(config.timeoutMs), PI_SPIKE_PORT: String(config.port),
  };
}
