// apiKey 可以是单个秘密或秘密数组（模型 Key 与联网搜索 Key）；空值忽略，避免 replaceAll('') 改写全文。
export function safeError(error, apiKey) {
  if (error?.path || error?.syscall) return '服务端文件访问失败，请检查运行状态';
  let message = String(error?.message ?? error);
  for (const secret of [apiKey].flat().filter(Boolean)) message = message.replaceAll(secret, '[已隐藏]');
  return message;
}

export function requestError(code, message, status = 400) {
  return Object.assign(new Error(message), { code, status });
}

// 对外错误同样隐藏所有秘密（参见 safeError）。
export function publicError(error, apiKey) {
  return { error: safeError(error, apiKey), code: error?.status ? error.code : 'invalid_request', status: error?.status ?? 400 };
}
