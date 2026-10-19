export const RUNTIME_ENV = {
  publicOrigin: 'PI_SPIKE_PUBLIC_ORIGIN', host: 'PI_SPIKE_HOST', basePath: 'PI_SPIKE_BASE_PATH', port: 'PI_SPIKE_PORT', stateDir: 'PI_SPIKE_STATE_DIR',
  timeoutMs: 'PI_SPIKE_TIMEOUT_MS', siteBase: 'PI_SPIKE_SITE_BASE', relativeLinks: 'PI_SPIKE_RELATIVE_LINKS',
  contextWindow: 'PI_SPIKE_CONTEXT_WINDOW', maxTokens: 'PI_SPIKE_MAX_TOKENS',
  thinkingLevel: 'PI_SPIKE_THINKING_LEVEL',
  maxInputBytes: 'PI_SPIKE_MAX_INPUT_BYTES', maxTurns: 'PI_SPIKE_MAX_TURNS',
  maxHistoryBytes: 'PI_SPIKE_MAX_HISTORY_BYTES', compactHistoryBytes: 'PI_SPIKE_COMPACT_HISTORY_BYTES', maxJobs: 'PI_SPIKE_MAX_JOBS', jobTtlMs: 'PI_SPIKE_JOB_TTL_MS',
  sessionTtlMs: 'PI_SPIKE_SESSION_TTL_MS', cacheTtlMs: 'PI_SPIKE_CACHE_TTL_MS', pruneIntervalMs: 'PI_SPIKE_PRUNE_INTERVAL_MS',
  maxStateBytes: 'PI_SPIKE_MAX_STATE_BYTES', retentionEnabled: 'PI_SPIKE_RETENTION_ENABLED',
  logRequests: 'PI_SPIKE_LOG_REQUESTS', webSearch: 'PI_SPIKE_WEB_SEARCH',
};

export function applyRuntimeEnv(config, env = process.env) {
  for (const [key, name] of Object.entries(RUNTIME_ENV)) {
    if (env[name] === undefined) continue;
    // webSearch 默认关闭；只接受显式的 true/false，避免拼写错误（如 on）被静默当作关闭。
    if (['retentionEnabled', 'logRequests', 'relativeLinks', 'webSearch'].includes(key)) {
      if (!['true', 'false'].includes(env[name])) throw new Error(`${name} 必须为 true 或 false`);
      config[key] = env[name] === 'true';
    } else config[key] = ['publicOrigin', 'host', 'basePath', 'stateDir', 'siteBase', 'thinkingLevel'].includes(key) ? env[name] : Number(env[name]);
  }
  return config;
}
