// 绝对路径或盘符。错误原文里出现这些时不能回给浏览器，也不写进请求日志。
const PATH_LEAK = /(?:^|[\s"'`(])(?:\/(?:Users|home|tmp|var|etc|private|opt|usr|Library)\/|[A-Za-z]:\\)/;
const FILE_MESSAGE = '服务端文件访问失败，请检查运行状态';
const UNKNOWN_MESSAGE = '请求未能完成';

// 模型调用相关的固定用户文案。文案不含上游错误正文、模型输出或用户输入。
export const UPSTREAM_MESSAGE = '模型服务暂时不可用，请稍后重试';
export const PARSE_MESSAGE = '模型输出无法解析';
export const CONTRACT_MESSAGE = '模型报告契约无效';
// 由宿主显式打标的类别，errorCategory 直接信任；其余类别仍由下面的规则推断。
const TAGGED = new Set(['upstream', 'parse', 'contract']);
// 网络层错误码：属于上游（模型服务或网络）不可达，不是本机文件问题，所以必须先于 file 判断。
const NETWORK_CODES = new Set(['ECONNRESET', 'ECONNREFUSED', 'ECONNABORTED', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN', 'EPIPE', 'ENETUNREACH', 'EHOSTUNREACH', 'UND_ERR_SOCKET', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT']);
// 上游错误文本特征：HTTP 4xx/5xx 状态码、限流、过载、网络超时等。只用于未打标的错误，匹配后文案一律换成固定句，原文不外露。
const UPSTREAM_TEXT = /(?:^|\s)(?:HTTP\s*)?[45]\d\d(?:\s|$|[:：])|status(?:\s*code)?\s*[:=]?\s*[45]\d\d|rate.?limit|too many requests|overloaded|ECONNRESET|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket hang up|fetch failed|connection error|network error|timed out|terminated/i;

// 模型调用类错误：宿主显式打标，category 只会是固定短词。message 必须是固定文案，不得拼入原文。
export function taggedError(category, message) {
  return Object.assign(new Error(message), { category });
}

// 日志只用类别，不用错误原文。类别是固定短词，不含路径、密钥或模型输出。
export function errorCategory(error) {
  if (TAGGED.has(error?.category)) return error.category;
  // 网络错误带 syscall（connect、getaddrinfo），先判断，避免被当成本机文件访问失败。
  if (NETWORK_CODES.has(error?.code) || NETWORK_CODES.has(error?.cause?.code)) return 'upstream';
  if (error?.path || error?.syscall) return 'file';
  const code = typeof error?.code === 'string' ? error.code : '';
  if (['history_limit', 'storage_limit', 'busy', 'session_unavailable', 'unavailable'].includes(code)) return code;
  const message = String(error?.message ?? '');
  if (!message.trim()) return 'unknown';
  if (message.includes('请求已取消')) return 'cancelled';
  if (message.includes('请求超时')) return 'timeout';
  // 文本不是 JSON，和 JSON 已解析但键、事实或外部参考不合契约，分开记录。
  if (message.includes('模型输出无法解析')) return 'parse';
  if (/模型报告契约无效|外部参考无效|模型选择|事实|候选条目/.test(message)) return 'contract';
  if (/SDK |超过轮次限制|实际 SDK/.test(message)) return 'provider';
  if (PATH_LEAK.test(message)) return 'unknown';
  // 其余消息才看上游特征；宿主自己的中文校验文案不含这些词，不会被误归类。
  if (UPSTREAM_TEXT.test(message)) return 'upstream';
  return 'request';
}

// apiKey 可以是单个秘密或秘密数组（模型 Key 与联网搜索 Key）；空值忽略，避免 replaceAll('') 改写全文。
// 没有可读消息、或消息里夹着本机路径时，改用固定类别文案，避免把路径或空原因展示给用户。
export function safeError(error, apiKey) {
  const category = errorCategory(error);
  if (category === 'file') return FILE_MESSAGE;
  // 上游错误正文可能含状态码、请求标识或账号信息，一律不外露。
  if (category === 'upstream') return UPSTREAM_MESSAGE;
  if (category === 'unknown') return UNKNOWN_MESSAGE;
  let message = String(error?.message ?? error);
  for (const secret of [apiKey].flat().filter(Boolean)) message = message.replaceAll(secret, '[已隐藏]');
  if (!message.trim() || PATH_LEAK.test(message)) return UNKNOWN_MESSAGE;
  return message;
}

export function requestError(code, message, status = 400) {
  return Object.assign(new Error(message), { code, status });
}

// 对外错误同样隐藏所有秘密（参见 safeError）。
export function publicError(error, apiKey) {
  return { error: safeError(error, apiKey), code: error?.status ? error.code : 'invalid_request', status: error?.status ?? 400 };
}
