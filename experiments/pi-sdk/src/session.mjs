import { readFile, writeFile, mkdir, rename, copyFile, unlink, lstat, readdir, open, utimes } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { isIP } from 'node:net';
import { InMemoryCredentialStore, InMemoryModelsStore } from '@earendil-works/pi-ai';
import { createAgentSession, createExtensionRuntime, ModelRuntime, SessionManager, SettingsManager } from '@earendil-works/pi-coding-agent';
import { loadSnapshot, knowledgeTools, TOOL_NAMES, digest, within } from './knowledge-tools.mjs';
import { SYSTEM_PROMPT, CONTRACT, parseModelReportText, validateModelReport, makeReport } from './report.mjs';
import { startMock } from './mock-provider.mjs';
import { safeError, requestError } from './errors.mjs';
import { applyRuntimeEnv } from './runtime-config.mjs';
import { pruneState, stateBytes } from './state-retention.mjs';
import { INPUT_CONTRACT, INPUT_PROMPT, resolveInput } from './input-resolution.mjs';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));
async function assertState(stateDir) {
  let path = ROOT;
  for (const part of resolve(stateDir).slice(resolve(ROOT).length + 1).split('/')) {
    path = join(path, part);
    try { if ((await lstat(path)).isSymbolicLink()) throw new Error('状态路径禁止符号链接'); }
    catch (error) { if (error.code === 'ENOENT') return; throw error; }
  }
  const visit = async dir => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw new Error('状态目录禁止符号链接');
      if (entry.isDirectory()) await visit(join(dir, entry.name));
    }
  };
  await visit(stateDir);
}
export async function loadConfig(overrides = {}) {
  const config = applyRuntimeEnv({ basePath: '/', relativeLinks: false, ...JSON.parse(await readFile(join(ROOT, 'config.json'), 'utf8')), ...overrides });
  config.port = Number(process.env.PI_SPIKE_PORT ?? config.port);
  config.mode = process.env.PI_SPIKE_MODE ?? 'mock';
  if (!['mock', 'live'].includes(config.mode)) throw new Error('模式无效');
  if (typeof config.host !== 'string' || (!isIP(config.host) && (config.host.length > 253 || !config.host.split('.').every(part => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(part))))) throw new Error('监听地址无效');
  if (typeof config.basePath !== 'string' || !/^\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]*$/.test(config.basePath)) throw new Error('应用基础路径必须是不含查询、转义或相对段的绝对路径');
  if (!config.basePath.endsWith('/')) config.basePath += '/';
  config.distDir = resolve(ROOT, config.distDir);
  config.stateDir = resolve(ROOT, process.env.PI_SPIKE_STATE_DIR ?? config.stateDir);
  if (!within(join(ROOT, '.state'), config.stateDir)) throw new Error('状态必须位于实验 .state 内');
  config.timeoutMs = Number(process.env.PI_SPIKE_TIMEOUT_MS ?? config.timeoutMs);
  if (!Number.isInteger(config.timeoutMs) || config.timeoutMs <= 0) throw new Error('超时必须是正整数毫秒');
  config.siteBase = process.env.PI_SPIKE_SITE_BASE ?? config.siteBase;
  const site = new URL(config.siteBase);
  if (!['http:', 'https:'].includes(site.protocol) || site.username || site.password || site.search || site.hash) throw new Error('详情地址必须是不带凭据或查询参数的 HTTP(S) 地址');
  if (config.publicOrigin) {
    const url = new URL(config.publicOrigin);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('公开地址必须是无路径或凭据的 HTTP(S) origin');
    config.publicOrigin = url.origin;
  }
  if (!['127.0.0.1', 'localhost', '::1'].includes(config.host) && !config.publicOrigin) throw new Error('非回环监听必须显式配置 publicOrigin');
  for (const key of ['maxHistoryBytes', 'maxJobs', 'jobTtlMs', 'sessionTtlMs', 'cacheTtlMs', 'maxStateBytes', 'maxInputBytes', 'maxTurns', 'pollIntervalMs']) {
    if (!Number.isSafeInteger(config[key]) || config[key] <= 0) throw new Error(`${key} 必须是正整数`);
  }
  for (const key of ['retentionEnabled', 'logRequests', 'relativeLinks']) if (typeof config[key] !== 'boolean') throw new Error(`${key} 必须是布尔值`);
  if (!['off', 'minimal', 'low', 'medium', 'high', 'xhigh'].includes(config.thinkingLevel)) throw new Error('思考级别无效');
  if (!Number.isInteger(config.port) || config.port < 0 || config.port > 65535) throw new Error('监听端口无效');
  if (config.mode === 'live') {
    config.baseUrl = process.env.PI_SPIKE_BASE_URL;
    config.apiKey = process.env.PI_SPIKE_API_KEY;
    config.modelId = process.env.PI_SPIKE_MODEL;
    if (!config.baseUrl || !config.apiKey || !config.modelId) throw new Error('live 需要三个 PI_SPIKE 专用模型环境变量');
    const modelUrl = new URL(config.baseUrl);
    if (!['http:', 'https:'].includes(modelUrl.protocol) || modelUrl.username || modelUrl.password || modelUrl.search || modelUrl.hash) throw new Error('模型地址必须是不带凭据或查询参数的 HTTP(S) 地址');
    config.contextWindow = Number(process.env.PI_SPIKE_CONTEXT_WINDOW);
    config.maxTokens = Number(process.env.PI_SPIKE_MAX_TOKENS);
    if (!Number.isInteger(config.contextWindow) || !Number.isInteger(config.maxTokens) || config.maxTokens < 1 || config.maxTokens >= config.contextWindow) throw new Error('live 必须显式提供模型上下文与输出限制');
  }
  return config;
}
export async function atomicJson(path, value) {
  const temp = `${path}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(value), { mode: 0o600 });
  await rename(temp, path);
}
const readJson = path => readFile(path, 'utf8').then(JSON.parse);
const idValid = id => typeof id === 'string' && /^[0-9a-f-]{36}$/.test(id);
export function emptyLoader(systemPrompt = SYSTEM_PROMPT) {
  return {
    getExtensions: () => ({ extensions: [], errors: [], runtime: createExtensionRuntime() }),
    getSkills: () => ({ skills: [], diagnostics: [] }), getPrompts: () => ({ prompts: [], diagnostics: [] }),
    getThemes: () => ({ themes: [], diagnostics: [] }), getAgentsFiles: () => ({ agentsFiles: [] }),
    getSystemPrompt: () => systemPrompt, getSystemPromptSource: () => undefined,
    getAppendSystemPrompt: () => [], getAppendSystemPromptSources: () => [], extendResources: () => {}, reload: async () => {},
  };
}
export function cacheKey({ request, context, knowledgeHash, model, codeHash, siteBase }) {
  return digest({ request, context, knowledgeHash, model, codeHash, siteBase, sdk: ['1.2.0', '1.2.0'], prompt: SYSTEM_PROMPT, contract: CONTRACT, retries: 0 });
}

const messageText = content => typeof content === 'string' ? content : (content ?? []).filter(item => item.type === 'text').map(item => item.text).join('');
export function compactHistory(messages) {
  const lastUser = messages.findLastIndex(message => message.role === 'user');
  return messages.map((message, i) => {
    if (message.role === 'user' && i !== lastUser) {
      let prompt;
      try { prompt = JSON.parse(messageText(message.content)); } catch { return message; }
      if (prompt.phase === 'input_resolution') return { ...message, content: [{ type: 'text', text: JSON.stringify({ historical: true, phase: 'input_resolution', message: '[原输入仅保留在服务端记录]' }) }] };
      if (!prompt.request) return message;
      const { question, mode, context, module } = prompt.request;
      return { ...message, content: [{ type: 'text', text: JSON.stringify({ request: { question, mode, context, module }, identity: prompt.manifest?.matches?.map(match => ({ name: match.name, entryIds: match.entryIds })), release: prompt.manifest?.release, historical: true }) }] };
    }
    if (message.role === 'toolResult' && i < lastUser) {
      let value;
      try { value = JSON.parse(messageText(message.content)); } catch { value = {}; }
      const entryIds = value.entries?.map(entry => entry.entryId) ?? (value.detail ? [value.detail.id] : value.matches?.flatMap(match => match.entryIds ?? match.candidates?.map(entry => entry.id) ?? []));
      return { ...message, details: undefined, content: [{ type: 'text', text: JSON.stringify({ tool: message.toolName, entryIds, isError: message.isError, historical: true }) }] };
    }
    if (message.role === 'assistant') {
      return { ...message, content: message.content.filter(part => part.type === 'text' || part.type === 'toolCall').map(part => {
        if (part.type === 'toolCall') return { ...part, arguments: part.name === 'analyze_config' ? {} : { entryId: part.arguments?.entryId, entryIds: part.arguments?.entryIds, fields: part.arguments?.fields } };
        if (part.type !== 'text') return part;
        try {
          const value = parseModelReportText(part.text);
          if (!Array.isArray(value.facts)) return { type: 'text', text: '[历史非引用输出已省略]' };
          return { ...part, text: JSON.stringify({ facts: value.facts.map(({ entryId, field }) => ({ entryId, field })), ...(value.status ? { status: value.status } : {}) }) };
        } catch { return { type: 'text', text: '[历史非引用输出已省略]' }; }
      }) };
    }
    return message;
  });
}

export class Spike {
  static async create(overrides) {
    const config = await loadConfig(overrides);
    const spike = new Spike(config);
    await assertState(config.stateDir);
    for (const dir of ['cwd', 'agent', 'sessions', 'metadata', 'cache', 'checkpoints']) await mkdir(join(config.stateDir, dir), { recursive: true, mode: 0o700 });
    await assertState(config.stateDir);
    if (config.mode === 'mock') spike.mock = await startMock(config);
    const files = ['src/session.mjs', 'src/input-resolution.mjs', 'src/runtime-config.mjs', 'src/state-retention.mjs', 'src/report.mjs', 'src/knowledge-tools.mjs', 'src/mock-provider.mjs', 'package-lock.json', '../../src/core/parser.mjs', '../../src/core/matcher.mjs', '../../src/query/config-results.mjs', '../../src/query/knowledge.mjs', '../../src/core/contexts.mjs', '../../src/core/source.mjs', '../../src/core/lua-directives.mjs'];
    try { spike.codeHash = digest(await Promise.all(files.map(file => readFile(resolve(ROOT, file), 'utf8')))); }
    catch (error) { await spike.close(); throw error; }
    return spike;
  }
  constructor(config) { this.config = config; this.jobs = new Map(); }
  pruneJobs(now = Date.now()) {
    const finished = [...this.jobs.values()].filter(job => job.finishedAt !== undefined).sort((a, b) => a.finishedAt - b.finishedAt);
    const excess = finished.length - this.config.maxJobs;
    finished.forEach((job, i) => { if (i < excess || now - job.finishedAt >= this.config.jobTtlMs) this.jobs.delete(job.requestId); });
  }
  async ready() {
    if (this.closing) throw requestError('unavailable', '服务正在停止', 503);
    await assertState(this.config.stateDir);
    const snapshot = await loadSnapshot(this.config);
    const path = join(this.config.stateDir, `.ready-${randomUUID()}`);
    const file = await open(path, 'wx', 0o600);
    try { await file.write('ready'); } finally { await file.close(); await unlink(path); }
    return { ready: true, release: snapshot.index.release_id, busy: Boolean(this.running || this.restoring || this.closing) };
  }
  normalize(request) {
    if (!request || typeof request !== 'object' || Array.isArray(request)) throw new Error('请求无效');
    const unified = Object.hasOwn(request, 'message');
    if (unified) {
      if (typeof request.message !== 'string' || !request.message.trim() || Buffer.byteLength(request.message) > this.config.maxInputBytes) throw new Error('消息输入无效或过大');
      if (['input', 'mode', 'question', 'context', 'module'].some(key => Object.hasOwn(request, key))) throw new Error('message 不能与旧 input/mode/question/context/module 混用');
      if (!request.release) throw new Error('统一消息必须指定知识发布标识');
    } else if (typeof request.input !== 'string' || Buffer.byteLength(request.input) > this.config.maxInputBytes || !['main', 'fragment', 'single'].includes(request.mode)) throw new Error('配置输入或模式无效');
    for (const key of ['question', 'context', 'module']) if (request[key] !== undefined && (typeof request[key] !== 'string' || request[key].length > 4096)) throw new Error(`${key} 无效`);
    if (request.release !== undefined && (typeof request.release !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(request.release) || ['.', '..'].includes(request.release))) throw new Error('知识发布标识无效');
    if (request.mockScenario && (this.config.mode !== 'mock' || !['normal', 'forbidden', 'bad-citation', 'invalid-json', 'fenced-json', 'unknown-field', 'empty-selection', 'unsupported', 'query', 'analyze', 'extended', 'intent-rewrite', 'intent-name', 'intent-invalid', 'intent-mode'].includes(request.mockScenario))) throw new Error('mock 场景无效');
    if (unified) return { message: request.message, ...(request.release === undefined ? {} : { release: request.release }), mockScenario: request.mockScenario ?? 'normal' };
    return { input: request.input, mode: request.mode, question: request.question ?? '', context: request.context ?? '', module: request.module ?? '', ...(request.release === undefined ? {} : { release: request.release }), mockScenario: request.mockScenario ?? 'normal' };
  }
  start(raw, sessionId) {
    if (this.closing) throw requestError('unavailable', '服务正在停止，请稍后重试', 503);
    if (this.running || this.restoring) throw requestError('busy', '仅支持一个活动请求，服务忙碌，请稍后手动重试', 409);
    this.pruneJobs();
    const request = this.normalize(raw);
    if (sessionId !== undefined && !idValid(sessionId)) throw new Error('会话 ID 无效');
    const started = performance.now();
    const job = { requestId: randomUUID(), sessionId: sessionId ?? randomUUID(), existingSession: sessionId !== undefined, mode: this.config.mode, state: 'running', cacheHit: false, trace: [], tools: [...TOOL_NAMES], cancelled: false, normalizedRequest: null, inputResolution: null,
      metrics: { stages: {}, modelRoundTrips: 0, inputBytes: 0, outputBytes: 0, finalOutputBytes: 0, sdkTurns: 0, toolCalls: 0, rounds: [], usage: null } };
    this.jobs.set(job.requestId, job);
    this.running = job;
    const timeout = setTimeout(() => { job.timedOut = true; void job.session?.abort(); }, this.config.timeoutMs);
    job.done = this.execute(job, request).catch(error => { job.state = job.cancelled ? 'cancelled' : 'failed'; job.error = safeError(error, this.config.apiKey); job.errorCode = error.code ?? 'request_failed'; }).finally(() => {
      clearTimeout(timeout); job.metrics.totalMs = performance.now() - started; job.finishedAt = Date.now();
      if (this.config.logRequests) console.log(JSON.stringify({ event: 'agent_request_end', requestId: job.requestId, release: job.knowledgeVersion?.release ?? null, mode: job.mode, state: job.state, cacheHit: job.cacheHit, totalMs: job.metrics.totalMs, modelRoundTrips: job.metrics.modelRoundTrips, usage: job.metrics.usage, errorCode: job.errorCode ?? null }));
      if (this.running === job) this.running = null;
      this.pruneJobs();
    });
    return job;
  }
  view(job) {
    const { done, session, cancelled, timedOut, existingSession, finishedAt, ...view } = job;
    return view;
  }
  async cancel(requestId) {
    const job = this.jobs.get(requestId);
    if (!job || job.state !== 'running') throw new Error('没有活动请求');
    job.cancelled = true;
    await job.session?.abort();
    await job.done;
    return this.view(job);
  }
  metadataPath(id) {
    if (!idValid(id)) throw new Error('会话 ID 无效');
    return join(this.config.stateDir, 'metadata', `${id}.json`);
  }
  async restore(id) {
    if (this.closing) throw requestError('unavailable', '服务正在停止，请稍后重试', 503);
    if (this.running || this.restoring) throw requestError('busy', '运行中不能恢复会话，请稍后手动重试', 409);
    this.restoring = true;
    const operation = (async () => {
      await assertState(this.config.stateDir);
      const metaPath = this.metadataPath(id);
      let meta;
      try { meta = await readJson(metaPath); } catch (error) { if (error.code === 'ENOENT') throw requestError('session_unavailable', '会话不存在或已过期，请新建会话', 404); throw error; }
      if (this.config.retentionEnabled && Date.now() - (await lstat(metaPath)).mtimeMs >= this.config.sessionTtlMs) throw requestError('session_unavailable', '会话已过期，请新建会话', 404);
      await this.recoverInterrupted(meta, id);
      const snapshot = await loadSnapshot(this.config, meta.request.release, this.snapshot);
      this.snapshot = snapshot;
      const manager = this.manager(meta.file);
      await utimes(metaPath, new Date(), new Date());
      const legacyConfig = !Object.hasOwn(meta, 'currentConfig') && meta.state === 'completed' && meta.request?.input ? { ...meta.request, release: meta.request.release ?? snapshot.index.release_id } : null;
      return { sessionId: id, request: meta.request, normalizedRequest: Object.hasOwn(meta, 'normalizedRequest') ? meta.normalizedRequest : meta.request.input !== undefined ? meta.request : null, inputResolution: meta.inputResolution ?? null, currentConfig: meta.currentConfig ?? legacyConfig, currentSubject: meta.currentSubject ?? meta.currentConfig ?? legacyConfig, state: meta.state === 'running' ? 'cancelled' : meta.state, interrupted: meta.state === 'running', knowledgeChanged: meta.knowledgeHash !== snapshot.hash, contractChanged: meta.contract !== CONTRACT, messages: manager.buildSessionContext().messages.length };
    })();
    this.restoreDone = operation;
    try { return await operation; } finally { this.restoring = false; this.restoreDone = null; }
  }
  async recoverInterrupted(meta, id) {
    if (meta.state === 'running' && meta.file) {
      this.manager(meta.file);
      await copyFile(join(this.config.stateDir, 'checkpoints', `${id}.jsonl`), meta.file);
    }
  }
  manager(file) {
    const cwd = join(this.config.stateDir, 'cwd');
    const sessions = join(this.config.stateDir, 'sessions');
    if (file && (!within(sessions, resolve(file)) || !file.endsWith('.jsonl'))) throw new Error('会话文件越界');
    return file ? SessionManager.open(file, sessions, cwd) : SessionManager.create(cwd, sessions);
  }
  async createSdk(job, manager, currentBundle, check, unified) {
    const config = this.config;
    const metrics = job.metrics;
    const started = performance.now();
    const runtime = await ModelRuntime.create({ credentials: new InMemoryCredentialStore(), authPath: join(config.stateDir, 'agent', 'unused-auth.json'), modelsPath: null, modelsStore: new InMemoryModelsStore(), allowModelNetwork: false, refreshOnCreate: false });
    const provider = 'pi-spike-isolated';
    runtime.registerProvider(provider, {
      api: 'openai-completions', baseUrl: this.mock?.baseUrl ?? config.baseUrl, apiKey: config.mode === 'mock' ? 'local-mock-no-secret' : config.apiKey,
      models: [{ id: config.modelId, name: config.modelId, api: 'openai-completions', reasoning: config.reasoning, input: ['text'], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: config.contextWindow, maxTokens: config.maxTokens, compat: config.compat }],
    });
    const customTools = knowledgeTools(this.snapshot, () => ({ input: '', mode: 'fragment' }), []).tools.map(tool => ({ ...tool, execute: (...args) => {
      check();
      const bundle = currentBundle();
      if (!bundle) throw new Error('输入识别阶段禁止调用工具');
      return bundle.tools.find(item => item.name === tool.name).execute(...args);
    } }));
    const { session } = await createAgentSession({
      cwd: join(config.stateDir, 'cwd'), agentDir: join(config.stateDir, 'agent'), modelRuntime: runtime, model: runtime.getModel(provider, config.modelId), thinkingLevel: config.thinkingLevel,
      resourceLoader: emptyLoader(unified ? `${INPUT_PROMPT}\n${SYSTEM_PROMPT}` : SYSTEM_PROMPT), sessionManager: manager, noTools: 'builtin', tools: TOOL_NAMES, customTools,
      settingsManager: SettingsManager.inMemory({ compaction: { enabled: false }, retry: { enabled: false, provider: { maxRetries: 0, timeoutMs: config.timeoutMs } }, cacheWarming: 'off', enableInstallTelemetry: false, mcpServers: {} }),
    });
    job.session = session;
    const originalTransform = session.agent.transformContext;
    session.agent.transformContext = async (messages, signal) => compactHistory(originalTransform ? await originalTransform(messages, signal) : messages);
    const originalPayload = session.agent.onPayload;
    session.agent.onPayload = async (payload, model) => {
      check();
      if (metrics.modelRoundTrips >= config.maxTurns) throw new Error('超过轮次限制');
      const transformed = (await originalPayload?.(payload, model)) ?? payload;
      const inputBytes = Buffer.byteLength(JSON.stringify(transformed));
      if (inputBytes > config.maxHistoryBytes) throw requestError('history_limit', '模型输入达到预算，请缩短问题或新建会话；原记录未删除', 413);
      metrics.modelRoundTrips++;
      metrics.inputBytes += inputBytes;
      metrics.rounds.push({ phase: job.phase === 'input_resolution' ? 'input_resolution' : 'selection', inputBytes, outputBytes: 0 });
      return transformed;
    };
    metrics.stages.sdkSetupMs = performance.now() - started;
    const active = session.getActiveToolNames().sort();
    if (JSON.stringify(active) !== JSON.stringify([...TOOL_NAMES].sort())) { session.dispose(); delete job.session; throw new Error('实际 SDK 活动工具越界'); }
    job.tools = active;
    const unsubscribe = session.subscribe(event => {
      if (event.type === 'turn_start' && ++metrics.sdkTurns > config.maxTurns) void session.abort();
      if (event.type === 'tool_execution_start') metrics.toolCalls++;
      if (event.type === 'message_end' && event.message.role === 'assistant') {
        const message = event.message;
        const outputBytes = message.content.reduce((size, part) => size + Buffer.byteLength(part.type === 'text' ? part.text : JSON.stringify(part)), 0);
        metrics.outputBytes += outputBytes;
        const round = metrics.rounds.at(-1);
        if (round) round.outputBytes += outputBytes;
        if (message.usage?.totalTokens > 0) {
          metrics.usage ??= { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0 };
          for (const key of Object.keys(metrics.usage)) metrics.usage[key] += message.usage[key] ?? 0;
          if (round) round.usage = message.usage;
        }
      }
      if (['tool_execution_start', 'tool_execution_end', 'turn_start', 'agent_end'].includes(event.type)) job.trace.push({ event: event.type, tool: event.toolName, isError: event.isError });
    });
    return { session, dispose() { unsubscribe(); session.dispose(); delete job.session; } };
  }
  async execute(job, submittedRequest) {
    const config = this.config;
    const metrics = job.metrics;
    const unified = Object.hasOwn(submittedRequest, 'message');
    let request = submittedRequest;
    let bundle;
    let sdk;
    const stage = async (name, fn) => { const started = performance.now(); try { return await fn(); } finally { metrics.stages[name] = performance.now() - started; } };
    const check = () => { if (job.cancelled || job.timedOut) throw new Error(job.cancelled ? '请求已取消' : '请求超时'); };
    await assertState(config.stateDir);
    const maintenance = await pruneState(config);
    if (maintenance.bytes >= config.maxStateBytes) throw requestError('storage_limit', '服务端状态容量已达上限，请维护清理后重试', 503);
    const metaPath = this.metadataPath(job.sessionId);
    let meta;
    try { meta = await readJson(metaPath); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (job.existingSession && !meta) throw requestError('session_unavailable', '会话不存在或已过期，请新建会话', 404);
    if (meta) await this.recoverInterrupted(meta, job.sessionId);
    const snapshot = await stage('snapshotMs', () => loadSnapshot(config, request.release, this.snapshot));
    this.snapshot = snapshot;
    metrics.knowledgeFilesRead = snapshot.filesRead;
    check();
    job.knowledgeVersion = { release: snapshot.index.release_id, digest: snapshot.hash };
    job.knowledgeChanged = Boolean(meta && meta.knowledgeHash !== snapshot.hash);
    job.contractChanged = Boolean(meta && meta.contract !== CONTRACT);
    const currentConfig = meta?.currentConfig ?? (!Object.hasOwn(meta ?? {}, 'currentConfig') && meta?.state === 'completed' && meta.request?.input
      ? { ...meta.request, release: meta.request.release ?? snapshot.index.release_id } : null);
    const currentSubject = meta?.currentSubject ?? currentConfig;
    const manager = this.manager(meta?.file);
    const context = manager.buildSessionContext().messages;
    const previousHistory = compactHistory([...context, { role: 'user', content: '' }]).slice(0, -1);
    if (Buffer.byteLength(JSON.stringify(previousHistory)) >= config.maxHistoryBytes) throw requestError('history_limit', '会话历史达到预算，请新建会话；原记录未删除', 413);
    const key = cacheKey({ request: unified ? { ...submittedRequest, currentConfig, currentSubject, inputContract: INPUT_CONTRACT } : request, context, knowledgeHash: snapshot.hash, codeHash: this.codeHash, siteBase: config.siteBase, model: { mode: config.mode, id: config.modelId, baseUrl: config.mode === 'mock' ? 'local-mock' : config.baseUrl, reasoning: config.reasoning, thinkingLevel: config.thinkingLevel, maxTurns: config.maxTurns, contextWindow: config.contextWindow, maxTokens: config.maxTokens, compat: config.compat } });
    const cachePath = join(config.stateDir, 'cache', `${key}.json`);
    check();
    let cached;
    await stage('cacheMs', async () => { try { cached = await readJson(cachePath); } catch (error) { if (error.code !== 'ENOENT') throw error; } });
    const metaFields = () => ({ request: submittedRequest, normalizedRequest: job.normalizedRequest ?? null, inputResolution: job.inputResolution ?? null,
      currentConfig, currentSubject, knowledgeHash: snapshot.hash, contract: CONTRACT, inputContract: INPUT_CONTRACT });
    if (cached) {
      check();
      const file = join(config.stateDir, 'sessions', `${randomUUID()}.jsonl`);
      const updatedMeta = { ...metaFields(), ...cached.resolution, file, state: 'completed' };
      if (maintenance.bytes + Buffer.byteLength(cached.session) + Buffer.byteLength(JSON.stringify(updatedMeta)) >= config.maxStateBytes) throw requestError('storage_limit', '服务端状态容量已达上限，请维护清理后重试', 503);
      await writeFile(file, cached.session, { mode: 0o600 });
      await atomicJson(metaPath, updatedMeta);
      if (job.cancelled || job.timedOut) {
        await unlink(file);
        await atomicJson(metaPath, { ...metaFields(), file: meta?.file ?? null, state: job.cancelled ? 'cancelled' : 'failed' });
        check();
      }
      Object.assign(job, cached.report, { cacheHit: true, state: 'completed', phase: cached.report.modelSelection ? 'selection' : 'basic' });
      return;
    }
    const previousFile = meta?.file ?? null;
    const checkpoint = join(config.stateDir, 'checkpoints', `${job.sessionId}.jsonl`);
    const pendingMeta = { ...metaFields(), file: previousFile, state: 'running' };
    const reserve = Buffer.byteLength(JSON.stringify(pendingMeta)) + (previousFile ? (await lstat(previousFile)).size : 0);
    if (await stateBytes(config.stateDir) + reserve >= config.maxStateBytes) throw requestError('storage_limit', '服务端状态容量已达上限，请维护清理后重试', 503);
    if (previousFile) await copyFile(previousFile, checkpoint);
    await atomicJson(metaPath, pendingMeta);
    let cacheWritten = false;
    const decorate = report => ({ ...report, normalizedRequest: job.normalizedRequest ?? null, inputResolution: job.inputResolution ?? null });
    const finish = async (report, state) => stage('commitMs', async () => {
      check();
      report = decorate(report);
      const file = manager.getSessionFile();
      // 原文和语法已确定即可保存待补充配置；名称对象独立，不覆盖配置。
      const parsedInput = bundle && !bundle.analysis.parsed.errors.length && bundle.analysis.parsed.directives.length > 0;
      const nextConfig = parsedInput && (!unified || job.inputResolution?.action === 'config') ? job.normalizedRequest : currentConfig;
      const nextSubject = parsedInput && (!unified || ['config', 'directive'].includes(job.inputResolution?.action)) ? job.normalizedRequest : currentSubject;
      const resolution = { normalizedRequest: job.normalizedRequest, inputResolution: job.inputResolution, currentConfig: nextConfig, currentSubject: nextSubject };
      const completedMeta = { ...metaFields(), ...resolution, file, state };
      const projectedBytes = await stateBytes(config.stateDir) - (await lstat(metaPath)).size + Buffer.byteLength(JSON.stringify(completedMeta));
      if (projectedBytes >= config.maxStateBytes) throw requestError('storage_limit', '服务端状态容量已达上限，请维护清理后重试', 503);
      await atomicJson(metaPath, completedMeta);
      check();
      if (state === 'completed') {
        const cachedValue = { report, resolution, session: await readFile(file, 'utf8') };
        if (await stateBytes(config.stateDir) + Buffer.byteLength(JSON.stringify(cachedValue)) < config.maxStateBytes) {
          await atomicJson(cachePath, cachedValue);
          cacheWritten = true;
        }
      }
      check();
      Object.assign(job, report, { state, phase: report.modelSelection ? 'selection' : 'basic' });
    });
    const rollback = async error => {
      if (cacheWritten) await unlink(cachePath);
      job.state = job.cancelled ? 'cancelled' : 'failed';
      job.error = safeError(error, config.apiKey);
      job.errorCode = error.code ?? 'request_failed';
      if (previousFile) await copyFile(checkpoint, previousFile);
      else {
        const file = manager.getSessionFile();
        if (file) await unlink(file).catch(error => { if (error.code !== 'ENOENT') throw error; });
      }
      await atomicJson(metaPath, { ...metaFields(), normalizedRequest: null, inputResolution: null, file: previousFile, contract: meta?.contract ?? CONTRACT, state: job.state });
    };
    const model = async (prompt, phase) => {
      check();
      job.phase = phase === 'input_resolution' ? phase : 'basic';
      sdk ??= await this.createSdk(job, manager, () => bundle, check, unified);
      check();
      sdk.session.setActiveToolsByName(phase === 'input_resolution' ? [] : TOOL_NAMES);
      await stage(phase === 'input_resolution' ? 'intentMs' : 'modelMs', () => sdk.session.prompt(JSON.stringify(prompt)));
      check();
      if (metrics.sdkTurns > config.maxTurns) throw new Error('超过轮次限制');
      if (job.trace.some(event => event.isError)) throw new Error('SDK 工具调用失败或请求禁用工具');
      const last = sdk.session.messages.findLast(message => message.role === 'assistant');
      if (!last || last.stopReason === 'error' || last.stopReason === 'aborted') throw new Error(last?.errorMessage ?? 'SDK 未完成');
      const text = last.content.filter(item => item.type === 'text').map(item => item.text).join('');
      metrics.finalOutputBytes = Buffer.byteLength(text);
      return text;
    };
    try {
      if (unified) {
        job.normalizedRequest = null;
        const prompt = { contract: INPUT_CONTRACT, phase: 'input_resolution', message: submittedRequest.message, hasPreviousConfig: Boolean(currentConfig), hasPreviousSubject: Boolean(currentSubject),
          request: { mockScenario: submittedRequest.mockScenario } };
        const text = await model(prompt, 'input_resolution');
        let value;
        try { value = parseModelReportText(text); } catch { value = null; }
        Object.assign(job, resolveInput(value, submittedRequest, snapshot, currentSubject));
        if (!job.normalizedRequest) {
          await finish({ items: [], matches: [], parsed: { directives: [], errors: [] }, questions: [job.inputResolution.message], modelSelection: null }, 'awaiting_input');
          return;
        }
        request = job.normalizedRequest;
      } else {
        job.normalizedRequest = { ...request, release: snapshot.index.release_id };
        job.inputResolution = { action: 'config' };
      }
      bundle = await stage('parseMs', () => knowledgeTools(snapshot, () => request, job.trace));
      await stage('preloadMs', () => bundle.prepare());
      check();
      Object.assign(job, decorate(await stage('basicReportMs', () => makeReport(null, bundle))), { phase: 'basic' });
      const pendingInput = bundle.analysis.questions.length || bundle.analysis.parsed.errors.length || !bundle.analysis.parsed.directives.length || bundle.analysis.matches.some(match => !['matched', 'block_entry'].includes(match.status));
      const prompt = { contract: CONTRACT, request: { question: request.question, mode: request.mode, context: request.context, module: request.module, mockScenario: request.mockScenario }, manifest: bundle.manifest };
      if (Buffer.byteLength(JSON.stringify(previousHistory)) + Buffer.byteLength(JSON.stringify(prompt)) > config.maxHistoryBytes) throw requestError('history_limit', '模型输入达到预算，请缩短问题或新建会话；原记录未删除', 413);
      if (!request.question.trim() && request.mockScenario === 'normal') {
        check();
        manager.appendMessage({ role: 'user', content: JSON.stringify(prompt), timestamp: Date.now() });
        const defaults = unified && bundle.manifest.candidates.length ? { facts: bundle.manifest.candidates.flatMap(entry =>
          ['summary', 'syntax', 'defaults', 'inheritance', 'limitations', 'runtime'].filter(field => entry.fields[field]).map(field => ({ entryId: entry.entryId, field }))) } : null;
        await finish(makeReport(defaults ? validateModelReport(defaults, bundle) : null, bundle), pendingInput ? 'awaiting_input' : 'completed');
        return;
      }
      const text = await model(prompt, 'selection');
      const report = await stage('validateHydrateMs', () => makeReport(validateModelReport(parseModelReportText(text), bundle), bundle));
      const hasContent = report.modelSelection.resolvedFacts.some(fact => typeof fact.text === 'string' && fact.text.trim());
      const finalState = pendingInput || !hasContent || report.modelSelection.status ? 'awaiting_input' : 'completed';
      await finish(report, finalState);
    } catch (error) {
      await rollback(error);
    } finally {
      sdk?.dispose();
    }
  }
  async close() { this.closing = true; await this.restoreDone?.catch(() => {}); if (this.running) await this.cancel(this.running.requestId); await this.mock?.close(); }
}
