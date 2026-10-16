// 名单来自 HTTP v0.10.27 / stream v0.0.15 的 module.c 注册和对应回调，
// block 回调均进入 conf_lua_block_parse；条件编译项也只作边界识别，不证明启用。
export const HTTP_LUA_BLOCK_DIRECTIVES = Object.freeze([
  'init_by_lua_block', 'init_worker_by_lua_block', 'exit_worker_by_lua_block',
  'set_by_lua_block', 'server_rewrite_by_lua_block', 'rewrite_by_lua_block',
  'access_by_lua_block', 'content_by_lua_block', 'log_by_lua_block',
  'header_filter_by_lua_block', 'body_filter_by_lua_block', 'balancer_by_lua_block',
  'ssl_client_hello_by_lua_block', 'ssl_certificate_by_lua_block',
  'ssl_session_store_by_lua_block', 'ssl_session_fetch_by_lua_block',
]);

export const STREAM_LUA_BLOCK_DIRECTIVES = Object.freeze([
  'init_by_lua_block', 'init_worker_by_lua_block', 'preread_by_lua_block',
  'content_by_lua_block', 'log_by_lua_block', 'balancer_by_lua_block',
  'ssl_client_hello_by_lua_block', 'ssl_certificate_by_lua_block',
]);

export const HTTP_LUA_FILE_DIRECTIVES = Object.freeze({
  init_by_lua_file: 0,
  init_worker_by_lua_file: 0,
  exit_worker_by_lua_file: 0,
  set_by_lua_file: 1,
  server_rewrite_by_lua_file: 0,
  rewrite_by_lua_file: 0,
  access_by_lua_file: 0,
  content_by_lua_file: 0,
  log_by_lua_file: 0,
  header_filter_by_lua_file: 0,
  body_filter_by_lua_file: 0,
  balancer_by_lua_file: 0,
  ssl_client_hello_by_lua_file: 0,
  ssl_certificate_by_lua_file: 0,
  ssl_session_store_by_lua_file: 0,
  ssl_session_fetch_by_lua_file: 0,
});

export const STREAM_LUA_FILE_DIRECTIVES = Object.freeze({
  init_by_lua_file: 0,
  init_worker_by_lua_file: 0,
  preread_by_lua_file: 0,
  content_by_lua_file: 0,
  log_by_lua_file: 0,
  balancer_by_lua_file: 0,
  ssl_client_hello_by_lua_file: 0,
  ssl_certificate_by_lua_file: 0,
});

export const LUA_BLOCK_DIRECTIVES = Object.freeze([
  ...new Set([...HTTP_LUA_BLOCK_DIRECTIVES, ...STREAM_LUA_BLOCK_DIRECTIVES]),
]);

// 数值是 args 的下标；set_by_lua_file 的 args[0] 是目标变量而非文件。
export const LUA_FILE_DIRECTIVES = Object.freeze({
  ...HTTP_LUA_FILE_DIRECTIVES, ...STREAM_LUA_FILE_DIRECTIVES,
});
