import { readFile, stat } from 'node:fs/promises';

// 模型配置文件（config/configuration.json）的校验与热读取。
// 文件只含非秘密的模型参数；API 密钥不在这里，仍只来自 .env 并在启动时读取一次。

// 文件大小上限：模型配置只有几行，超过 16KB 一律视为异常，避免误指向大文件。
export const MODEL_FILE_MAX_BYTES = 16 * 1024;
// 允许的思考级别，与 session.loadConfig 中的历史校验保持一致。
export const THINKING_LEVELS = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh'];
// 状态原因的固定枚举：对外（/api/status、日志）只允许出现这些字符串，不带任何文件内容。
export const MODEL_CONFIG_REASONS = ['parse', 'schema', 'origin', 'read'];
// model 内必须且只能出现的字段。
const MODEL_FIELDS = ['provider', 'id', 'baseUrl', 'contextWindow', 'maxTokens', 'thinkingLevel'];
// 文件修改时间距今不足该窗口时，不信任 mtime+size 签名，强制重读（避免同大小、同时间粒度内的连续修改被漏掉）。
const RACY_WINDOW_MS = 2000;

// 带固定 reason 的错误。message 只能包含字段名或位置，不得拼入文件内容。
function configError(reason, message) {
  return Object.assign(new Error(message), { reason });
}

// 从 JSON.parse 的错误里只取“位置”信息。V8 的原始消息可能带有出错处的文本片段，不能直接外传。
function parseFailure(error) {
  const text = String(error?.message ?? '');
  const position = text.match(/position (\d+)/)?.[1];
  const line = text.match(/line (\d+) column (\d+)/);
  const where = line ? `（第 ${line[1]} 行第 ${line[2]} 列）` : position ? `（位置 ${position}）` : '';
  return configError('parse', `模型配置 JSON 解析失败${where}`);
}

// 标识类字符串：id 与 provider 共用，限制长度与字符集，避免把怪异内容带进请求或缓存键。
function identifier(value, field, max) {
  if (typeof value !== 'string' || value.length < 1 || value.length > max || !/^[A-Za-z0-9._:/-]+$/.test(value)) throw configError('schema', `model.${field} 无效`);
  return value;
}

// 校验模型地址：必须是不带凭据、查询、片段的 HTTP(S) 地址（沿用原有规则）。返回原字符串。
function modelUrl(value) {
  if (typeof value !== 'string' || value.length < 1 || value.length > 2048 || /[?#\s]/.test(value)) throw configError('schema', 'model.baseUrl 无效');
  let url;
  try { url = new URL(value); } catch { throw configError('schema', 'model.baseUrl 无效'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw configError('schema', 'model.baseUrl 必须是不带凭据或查询参数的 HTTP(S) 地址');
  return value;
}

// 纯函数：校验配置文本并返回规范化对象 { model }。失败抛出带 reason（'parse'|'schema'）的错误。
export function parseModelConfig(text) {
  if (typeof text !== 'string' || Buffer.byteLength(text) > MODEL_FILE_MAX_BYTES) throw configError('schema', '模型配置文件过大');
  let value;
  try { value = JSON.parse(text); } catch (error) { throw parseFailure(error); }
  const plain = item => item !== null && typeof item === 'object' && !Array.isArray(item);
  if (!plain(value)) throw configError('schema', '模型配置顶层必须是对象');
  // 顶层只允许 model；不回显多余字段的名字，避免把文件内容带进错误。
  if (Object.keys(value).length !== 1 || !Object.hasOwn(value, 'model')) throw configError('schema', '模型配置顶层只允许 model 字段');
  const model = value.model;
  if (!plain(model)) throw configError('schema', 'model 必须是对象');
  for (const field of MODEL_FIELDS) if (!Object.hasOwn(model, field)) throw configError('schema', `model.${field} 缺失`);
  if (Object.keys(model).length !== MODEL_FIELDS.length) throw configError('schema', 'model 包含不支持的字段');
  const result = {
    provider: identifier(model.provider, 'provider', 50),
    id: identifier(model.id, 'id', 100),
    baseUrl: modelUrl(model.baseUrl),
    contextWindow: model.contextWindow,
    maxTokens: model.maxTokens,
    thinkingLevel: model.thinkingLevel,
  };
  if (!Number.isSafeInteger(result.contextWindow) || result.contextWindow < 2) throw configError('schema', 'model.contextWindow 必须是整数');
  if (!Number.isSafeInteger(result.maxTokens) || result.maxTokens < 1 || result.maxTokens >= result.contextWindow) throw configError('schema', 'model.maxTokens 必须是小于 contextWindow 的正整数');
  if (!THINKING_LEVELS.includes(result.thinkingLevel)) throw configError('schema', 'model.thinkingLevel 无效');
  return { model: Object.freeze(result) };
}

// 读取并校验文件：限制大小，错误统一带 reason（read/parse/schema），不含文件内容。
async function readModelFile(file) {
  let info;
  try { info = await stat(file); } catch { throw configError('read', '模型配置文件无法读取'); }
  if (!info.isFile()) throw configError('read', '模型配置文件无法读取');
  if (info.size > MODEL_FILE_MAX_BYTES) throw configError('schema', '模型配置文件过大');
  let text;
  try { text = await readFile(file, 'utf8'); } catch { throw configError('read', '模型配置文件无法读取'); }
  return { ...parseModelConfig(text), signature: `${info.mtimeMs}:${info.size}`, mtimeMs: info.mtimeMs };
}

// 创建模型配置来源。
// - 启动时读取并校验一次，失败直接抛错（启动失败）；成功后固定 baseUrl 的 origin（pinnedOrigin）。
// - current()：每次请求调用。文件未变化直接返回缓存；变化后重读。任何失败都保持上一份有效配置，
//   并返回 { state: 'invalid', reason }；文件恢复后回到 'ok'。
// - origin 固定是为了防止启动时读到的 API 密钥被热更新后的配置发往别的服务。
// - startup：可选，调用方已读取的配置文本（避免重复读取）；缺省则由本函数读文件。
// - log：可选回调，只在状态变化时以 { event, state, reason } 调用，绝不传入文件内容或密钥。
export async function createModelConfigSource({ file, startup, log } = {}) {
  if (typeof file !== 'string' || !file) throw new Error('模型配置文件路径必须显式指定');
  let initial;
  if (typeof startup === 'string') initial = { ...parseModelConfig(startup), signature: null, mtimeMs: 0 };
  else initial = await readModelFile(file);
  const pinnedOrigin = new URL(initial.model.baseUrl).origin;
  let model = initial.model;
  let signature = initial.signature;
  let mtimeMs = initial.mtimeMs;
  let state = 'ok';
  let reason;
  let inflight = null;
  const source = { file, pinnedOrigin, initial: initial.model, reads: 0 };

  const setStatus = (nextState, nextReason) => {
    const changed = nextState !== state || nextReason !== reason;
    state = nextState; reason = nextReason;
    if (changed) { try { log?.({ event: 'model_config', state, ...(reason ? { reason } : {}) }); } catch { /* 日志失败不影响请求 */ } }
  };
  const result = () => ({ model, state, ...(state === 'invalid' ? { reason } : {}) });

  async function refresh() {
    let info;
    try { info = await stat(file); } catch { setStatus('invalid', 'read'); signature = null; return result(); }
    const current = `${info.mtimeMs}:${info.size}`;
    // 签名一致且文件不是“刚刚修改过”时，沿用上次结果（无论上次是 ok 还是 invalid）。
    if (signature === current && Date.now() - info.mtimeMs > RACY_WINDOW_MS) return result();
    source.reads++;
    try {
      const next = await readModelFile(file);
      signature = next.signature; mtimeMs = next.mtimeMs;
      if (new URL(next.model.baseUrl).origin !== pinnedOrigin) { setStatus('invalid', 'origin'); return result(); }
      model = next.model;
      setStatus('ok', undefined);
    } catch (error) {
      // 读取失败不记签名，下次仍会重试；解析/校验失败记下签名，文件不变则不再重复解析。
      signature = error.reason === 'read' ? null : current;
      setStatus('invalid', MODEL_CONFIG_REASONS.includes(error.reason) ? error.reason : 'read');
    }
    return result();
  }

  // 并发安全：同一时刻的多个 current() 共用同一次刷新。
  source.current = () => (inflight ??= refresh().finally(() => { inflight = null; }));
  return source;
}
