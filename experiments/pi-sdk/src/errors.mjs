export function safeError(error, apiKey) {
  if (error?.path || error?.syscall) return '服务端文件访问失败，请检查运行状态';
  const message = String(error?.message ?? error);
  return apiKey ? message.replaceAll(apiKey, '[已隐藏]') : message;
}

export function requestError(code, message, status = 400) {
  return Object.assign(new Error(message), { code, status });
}

export function publicError(error, apiKey) {
  return { error: safeError(error, apiKey), code: error?.status ? error.code : 'invalid_request', status: error?.status ?? 400 };
}
