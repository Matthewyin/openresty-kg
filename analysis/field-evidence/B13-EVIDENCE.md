# B13 字段证据（stream-lua-nginx-module）

范围：50 条；固定 revision stream-lua-nginx-module v0.0.15（69f0cd76…），nginx 引用为 release-1.27.1（e06bdbd4…）。本批全部从 stream-lua 自己的源码取证，未借用 lua-nginx-module（HTTP）结论；README/官方文档仅交叉印证。

## stream-lua-nginx-module--ngx_stream_lua_module--lua_load_resty_core

- 语法：verified；source_ids：registration, configuration-definition, syntax-arg-count
  - 判据：注册为 NGX_CONF_FLAG，ngx_conf_handler 只检查参数个数为 2（含指令名）；处理函数不读 value[1]、不调用 ngx_conf_set_flag_slot，因此任意单个参数均被接受，语法改为通用占位符。检索（stream-lua v0.0.15，范围 src/）：git grep -n load_resty_core，全部命中：directive.c:181/185（处理函数，函数体仅 ngx_conf_log_error 与 return，见 configuration-definition）、directive.h:48（声明）、module.c:96/98（注册，offset=0）；无任何读取该指令值的命中。
- 功能：verified；source_ids：configuration-definition, implementation-0, df340-lua-s-lua_load_resty_core-mandatory-require
  - 判据：处理函数只记录弃用告警、不保存指令值（注册 offset 为 0；检索 git grep -n load_resty_core 于 src/ 的全部命中仅有函数定义、声明与注册 5 处，无读取点）；ngx_stream_lua_init_vm 无条件 require("resty.core")，失败返回 NGX_DECLINED，故指令不再控制加载。
- 新增片段：syntax-arg-count（nginx:src/core/ngx_conf_file.c:413-421）
- 修正：syntax→「lua_load_resty_core value;」（注册为 NGX_CONF_FLAG，nginx 只检查参数个数为 1；处理函数不读取参数，不校验 on/off。）
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--lua_max_running_timers

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_num_slot 用 ngx_atoi 解析为整数，与语法一致。
- 功能：verified；source_ids：implementation-0, implementation-1, merge-default, summary-running-dec
  - 判据：指令写入 lmcf->max_running_timers（默认 256）；timer 到期处理时 running_timers >= 该值即失败，开始运行时 ++、fake request 清理时 --，计数在 lmcf（进程内），故为每 worker 同时运行数上限。
- 新增片段：summary-running-dec（stream-lua-nginx-module:src/ngx_stream_lua_util.c:725-745）
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--lua_max_pending_timers

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_num_slot 用 ngx_atoi 解析为整数，与语法一致。
- 功能：verified；source_ids：implementation-0, merge-default, summary-pending-inc, summary-pending-dec
  - 判据：指令写入 lmcf->max_pending_timers（默认 1024）；创建 timer 时 pending_timers >= 该值返回 "too many pending timers"，创建 ++、到期 --，计数在进程内 lmcf，故为每 worker 等待 timer 上限。
- 新增片段：summary-pending-inc（stream-lua-nginx-module:src/ngx_stream_lua_timer.c:359-365）；summary-pending-dec（stream-lua-nginx-module:src/ngx_stream_lua_timer.c:593-598）
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--lua_shared_dict

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE2；自定义函数取 value[1] 为 name（空串报错）、value[2] 经 ngx_parse_size 为 size（<=8191 报错），与“name size”一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2
  - 判据：函数用 name/size 调用 ngx_stream_lua_shared_memory_add 登记 ngx_shared_memory_add 共享区（在 stream 主配置 lmcf 的 shdict_zones），init 回调建立红黑树与 LRU；ngx_stream_lua_inject_shdict_api 把这些 zone 暴露为 ngx.shared.<name>，仅限 stream 主配置内的 Lua VM。
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--lua_sa_restart

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG（恰好 1 个参数），ngx_conf_set_flag_slot 仅接受 on/off。
- 功能：verified；source_ids：implementation-0, implementation-1, merge-default
  - 判据：set_sa_restart 为真时（默认 1，且需 NGX_STREAM_LUA_HAVE_SA_RESTART）worker 初始化调用 ngx_stream_lua_set_sa_restart，对 NGX_STREAM_LUA_SA_RESTART_SIGS 中各信号置 SA_RESTART。
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--lua_capture_error_log

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；函数取 value[1] 经 ngx_parse_size 得 size（小于 NGX_MAX_ERROR_STR 报错），与“size”一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, patch-intercept_error_log
  - 判据：函数按 size 分配 ringbuf 并把 cycle->intercept_error_log_handler 设为 capture 处理函数；该钩子字段与 HAVE_INTERCEPT_ERROR_LOG_PATCH 由发行补丁提供，ngx_log_error_core 在补丁中调用它，处理函数把日志写入环形缓冲区。
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--lua_regex_cache_max_entries

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_num_slot 用 ngx_atoi 解析为整数，与语法一致。
- 功能：verified；source_ids：implementation-0, merge-default, summary-pcre-guard
  - 判据：指令写入 lmcf->regex_cache_max_entries（默认 1024，整个 regex 文件受 NGX_PCRE 包裹），ngx_stream_lua_ffi_max_regex_cache_size 返回该值。检索（stream-lua v0.0.15 固定 revision，范围 src/）：git grep -n regex_cache，全部命中：common.h:196-197（声明）、module.c:139/143（注册）、module.c:716/737/766-767（初值与默认）、regex.c:979/987（FFI 返回）、util.c:86/481/52（regex_cache_key 的定义/使用/声明，属另一标识符）；无任何比较或淘汰该上限的命中。文字仅陈述存值与 FFI 返回，不含否定陈述。
- 新增片段：summary-pcre-guard（stream-lua-nginx-module:src/ngx_stream_lua_regex.c:21-25）
- 修正：summary→「保存Stream Lua正则缓存条目数上限（默认1024，需NGX_PCRE），并经FFI接口 ngx_stream_lua_ffi_max_regex_cache_size 返回该值。」（原文称“供正则实现使用、每worker缓存容量”，本组件源码只有存值与FFI返回；删去消费关系的描述。）
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--lua_regex_match_limit

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_num_slot 用 ngx_atoi 解析为整数，与语法一致。
- 功能：verified；source_ids：implementation-0, implementation-1, merge-default
  - 判据：指令写入 lmcf->regex_match_limit（默认 0）；>0 时 PCRE2 路径 pcre2_set_match_limit、PCRE 路径设置 sd->match_limit（非 DFA 模式）。
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--lua_package_cpath

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；函数把 value[1] 原样存入 lmcf->lua_cpath，与“lua-style-cpath”一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1
  - 判据：ngx_stream_lua_new_state 在 lua_cpath 非空时经 ngx_stream_lua_set_path 设置 package.cpath（展开 $prefix，;; 展开为默认值）。
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--lua_package_path

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；函数把 value[1] 原样存入 lmcf->lua_path，与“lua-style-path”一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1
  - 判据：ngx_stream_lua_new_state 在 lua_path 非空时经 ngx_stream_lua_set_path 设置 package.path（展开 $prefix，;; 展开为默认值）。
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--lua_code_cache

- 语法：verified；source_ids：registration, configuration-definition, syntax-flag-slot
  - 判据：注册为 NGX_CONF_FLAG；自定义函数首先调用 ngx_conf_set_flag_slot（仅 on/off），再在 off 时告警，参数形态与 on | off 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, summary-code-cache-table, summary-get-vm, merge-default
  - 判据：enable_code_cache 为 0（默认 1）且连接 fd 有效时，ngx_stream_lua_create_ctx 为该会话新建 VM 并重跑 init_by_lua，ctx->vm_state 指向该 VM（get_lua_vm 优先返回它）；代码缓存表存放在各 VM 的 registry 中，故关闭后不复用代码与 VM，开启则共用 lmcf->lua。
- 新增片段：syntax-flag-slot（nginx:src/core/ngx_conf_file.c:1026-1062）；summary-code-cache-table（stream-lua-nginx-module:src/ngx_stream_lua_cache.c:42-64）；summary-get-vm（stream-lua-nginx-module:src/ngx_stream_lua_util.h:385-403）
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--lua_socket_log_errors

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG（恰好 1 个参数），ngx_conf_set_flag_slot 仅接受 on/off。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, closed-socket-log, merge-default
  - 判据：log_socket_errors（默认 1）为真时，读超时、写超时、证书校验失败/主机名不匹配、向已关闭 socket 发送这几处才额外 ngx_log_error；各处均读 llcf->log_socket_errors。
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--init_by_lua_block

- 语法：verified；source_ids：registration, configuration-definition, implementation-0, implementation-1
  - 判据：注册为 NGX_CONF_BLOCK|NGX_CONF_NOARGS（无参数的块指令）；块函数调用 ngx_stream_lua_conf_lua_block_parse 按花括号层级读取 Lua 文本，去掉末尾 } 后作为 value[1] 交给对应处理函数。
- 功能：verified；source_ids：implementation-0, implementation-2, implementation-4, implementation-5, implementation-6
  - 判据：块文本经 ngx_stream_lua_init_by_lua 存入 lmcf->init_src，handler 为 init_by_inline（luaL_loadbuffer 并执行）；ngx_stream_lua_init 创建全局 VM 后（若无 shared dict）调用 init_handler，有 shared dict 时在全部 zone 初始化后调用；code cache 关闭时每会话新 VM 也会重跑。
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--init_by_lua

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_stream_lua_init_by_lua 取 value[1] 作为脚本字符串存入 lmcf->init_src，与“<lua-script-str>”一致。
- 功能：verified；source_ids：implementation-0, implementation-2, implementation-3, implementation-4
  - 判据：字符串存入 lmcf->init_src，handler 为 init_by_inline（luaL_loadbuffer 并执行）；ngx_stream_lua_init 创建全局 VM 后调用（有 shared dict 时延至 zone 初始化后），code cache 关闭时每会话新 VM 重跑。
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--init_by_lua_file

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_stream_lua_init_by_lua 取 value[1] 为路径，经 ngx_stream_lua_rebase_path 存入 init_src，与“<path-to-lua-script-file>”一致。
- 功能：verified；source_ids：implementation-0, implementation-2, implementation-3, implementation-4
  - 判据：路径存入 lmcf->init_src，handler 为 init_by_file（luaL_loadfile 并执行）；调用时机同 init_by_lua（创建全局 VM 后；有 shared dict 时延后；code cache 关闭时每会话重跑）。
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--init_worker_by_lua_block

- 语法：verified；source_ids：registration, configuration-definition, implementation-0, implementation-1
  - 判据：注册为 NGX_CONF_BLOCK|NGX_CONF_NOARGS（无参数的块指令）；块函数调用 ngx_stream_lua_conf_lua_block_parse 按花括号层级读取 Lua 文本，去掉末尾 } 后作为 value[1] 交给对应处理函数。
- 功能：verified；source_ids：module-owner, implementation-2, implementation-3, implementation-4, implementation-6
  - 判据：块文本存入 lmcf->init_worker_src，handler 为 init_worker_by_inline；模块的 init_process 钩子 ngx_stream_lua_init_worker 在 worker 初始化时创建 fake 会话并调用 init_worker_handler（缓存 helper 进程跳过）。
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--init_worker_by_lua

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_stream_lua_init_worker_by_lua 取 value[1] 为脚本字符串存入 init_worker_src，与语法一致。
- 功能：verified；source_ids：module-owner, implementation-0, implementation-1, implementation-2, implementation-4
  - 判据：字符串存入 lmcf->init_worker_src，handler 为 init_worker_by_inline（luaL_loadbuffer 并执行）；由模块 init_process 钩子在 worker 初始化时经 fake 会话调用（缓存 helper 进程跳过）。
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--init_worker_by_lua_file

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；函数取 value[1] 为路径并经 ngx_stream_lua_rebase_path 存入 init_worker_src，与语法一致。
- 功能：verified；source_ids：module-owner, implementation-0, implementation-1, implementation-2, implementation-4
  - 判据：路径存入 lmcf->init_worker_src，handler 为 init_worker_by_file（luaL_loadfile 并执行）；由模块 init_process 钩子在 worker 初始化时经 fake 会话调用。
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--preread_by_lua_file

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_stream_lua_preread_by_lua 取 value[1] 为路径（可含变量，编译为 complex value），与语法一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2
  - 判据：设置该指令即置 lmcf->requires_preread，ngx_stream_lua_init 把 ngx_stream_lua_preread_handler 加入 NGX_STREAM_PREREAD_PHASE；handler 调用 preread_handler_file，求值路径并 cache_loadfile 后执行 Lua。
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--preread_by_lua_block

- 语法：verified；source_ids：registration, configuration-definition, df340-lua-s-preread_by_lua_block-phase-setter, syntax-block-parse
  - 判据：注册为 NGX_CONF_BLOCK|NGX_CONF_NOARGS（无参数的块指令）；块函数调用 ngx_stream_lua_conf_lua_block_parse 按花括号层级读取 Lua 文本，去掉末尾 } 后作为 value[1] 交给对应处理函数。
- 功能：verified；source_ids：df340-lua-s-preread_by_lua_block-phase-setter, df340-lua-s-preread_by_lua_block-phase-install, summary-preread-handler, summary-preread-inline
  - 判据：块文本经 handler 存入 lscf->preread_handler（cmd->post=handler_inline）并置 requires_preread；ngx_stream_lua_init 把 ngx_stream_lua_preread_handler 装入 PREREAD 阶段；该 handler 调用 lscf->preread_handler(r)，handler_inline 用 cache_loadbuffer 加载 preread_src 并 by_chunk 运行。文字删去源码未证明的“或 UDP 数据报”。
- 新增片段：syntax-block-parse（stream-lua-nginx-module:src/ngx_stream_lua_directive.c:776-933）；summary-preread-handler（stream-lua-nginx-module:src/ngx_stream_lua_prereadby.c:24-123）；summary-preread-inline（stream-lua-nginx-module:src/ngx_stream_lua_prereadby.c:126-150）
- 修正：summary→「在 stream 的 preread 阶段执行 Lua，对连接进行预读阶段处理。」（源码未证明数据报进入 preread 处理，“或 UDP 数据报”仅见 README，删去。）
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--content_by_lua

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_stream_lua_content_by_lua 取 value[1] 作为脚本字符串，与“<lua-script-str>”一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, summary-content-phase
  - 判据：函数把 cscf->handler 设为 ngx_stream_lua_content_handler，nginx 内容阶段 ngx_stream_core_content_phase 调用 cscf->handler，其再调 content_handler_inline 执行脚本。
- 新增片段：summary-content-phase（nginx:src/stream/ngx_stream_core_module.c:441-471）
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--content_by_lua_block

- 语法：verified；source_ids：registration, configuration-definition, implementation-0, implementation-1
  - 判据：注册为 NGX_CONF_BLOCK|NGX_CONF_NOARGS（无参数的块指令）；块函数调用 ngx_stream_lua_conf_lua_block_parse 按花括号层级读取 Lua 文本，去掉末尾 } 后作为 value[1] 交给对应处理函数。
- 功能：verified；source_ids：implementation-2, implementation-3, implementation-4, summary-content-phase
  - 判据：块文本经 content_by_lua 存为脚本并注册 cscf->handler；内容阶段 ngx_stream_core_content_phase 调用它，其执行 content_handler_inline。
- 新增片段：summary-content-phase（nginx:src/stream/ngx_stream_core_module.c:441-471）
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--content_by_lua_file

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_stream_lua_content_by_lua 取 value[1] 作为路径（可含变量，编译为 complex value），与语法一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, summary-content-phase
  - 判据：函数注册 cscf->handler 为 ngx_stream_lua_content_handler，内容阶段由 ngx_stream_core_content_phase 调用，其执行 content_handler_file（求值路径、cache_loadfile、运行 Lua）。
- 新增片段：summary-content-phase（nginx:src/stream/ngx_stream_core_module.c:441-471）
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--log_by_lua_block

- 语法：verified；source_ids：registration, configuration-definition, implementation-0, implementation-1
  - 判据：注册为 NGX_CONF_BLOCK|NGX_CONF_NOARGS（无参数的块指令）；块函数调用 ngx_stream_lua_conf_lua_block_parse 按花括号层级读取 Lua 文本，去掉末尾 } 后作为 value[1] 交给对应处理函数。
- 功能：verified；source_ids：implementation-2, implementation-3, implementation-4, implementation-5, summary-log-session
  - 判据：块文本经 log_by_lua 存入 log_handler 并置 requires_log，ngx_stream_lua_init 把 log handler 加到 NGX_STREAM_LOG_PHASE 首位；ngx_stream_finalize_session 先执行 log 阶段全部 handler 再关闭连接，handler 运行 log_handler_inline。
- 新增片段：summary-log-session（nginx:src/stream/ngx_stream_handler.c:301-329）
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--log_by_lua_file

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_stream_lua_log_by_lua 取 value[1] 为路径（可含变量），与语法一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, summary-log-session
  - 判据：函数置 log_handler 与 requires_log，log handler 加入 NGX_STREAM_LOG_PHASE；ngx_stream_finalize_session 在关闭连接前执行 log 阶段 handler，handler 运行 log_handler_file。
- 新增片段：summary-log-session（nginx:src/stream/ngx_stream_handler.c:301-329）
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--preread_by_lua_no_postpone

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG（恰好 1 个参数），ngx_conf_set_flag_slot 仅接受 on/off。
- 功能：verified；source_ids：implementation-0, merge-default, df340-lua-s-preread_by_lua_no_postpone-consume
  - 判据：指令（on=1）写入 postponed_to_preread_phase_end；handler 仅在该值为 0 时把自身 phase handler 移到 preread 阶段末尾并置 1；ngx_stream_lua_init 在未设置时置 0，故 on 即不移动。
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--balancer_by_lua_block

- 语法：verified；source_ids：registration, configuration-definition, implementation-0, implementation-1
  - 判据：注册为 NGX_CONF_BLOCK|NGX_CONF_NOARGS（无参数的块指令）；块函数调用 ngx_stream_lua_conf_lua_block_parse 按花括号层级读取 Lua 文本，去掉末尾 } 后作为 value[1] 交给对应处理函数。
- 功能：verified；source_ids：implementation-0, implementation-2, implementation-3, implementation-4, implementation-5, summary-set-current-peer
  - 判据：块文本经 balancer_by_lua 存入 lscf->balancer 并把 upstream 的 init_upstream 设为 ngx_stream_lua_balancer_init；每次连接 init_peer 把 peer.get 设为 get_peer，get_peer 调用 balancer.handler 运行 Lua，Lua 设置了 peer 则采用，否则回落轮询。 bp->sockaddr 由 FFI 入口 ngx_stream_lua_ffi_balancer_set_current_peer 写入（summary-set-current-peer），get_peer 据此采用该 peer。
- 新增片段：summary-set-current-peer（stream-lua-nginx-module:src/ngx_stream_lua_balancer.c:508-588）
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--balancer_by_lua_file

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_stream_lua_balancer_by_lua 取 value[1] 为路径（rebase_path），与语法一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2, implementation-3, summary-set-current-peer
  - 判据：路径存入 lscf->balancer，init_upstream 设为 ngx_stream_lua_balancer_init；peer.get 为 get_peer，其调用 balancer_handler_file 运行 Lua，Lua 设置了 peer 则采用，否则回落轮询。 bp->sockaddr 由 FFI 入口 ngx_stream_lua_ffi_balancer_set_current_peer 写入（summary-set-current-peer），get_peer 据此采用该 peer。
- 新增片段：summary-set-current-peer（stream-lua-nginx-module:src/ngx_stream_lua_balancer.c:508-588）
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--lua_socket_keepalive_timeout

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_msec_slot 经 ngx_parse_time 解析为毫秒，与“time”一致。
- 功能：verified；source_ids：implementation-0, implementation-1, merge-default
  - 判据：setkeepalive 未显式给出 timeout 时取 llcf->keepalive_timeout（默认 60000ms），连接归入池后据此 ngx_add_timer 作为空闲超时（0 表示不加）。
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--lua_socket_connect_timeout

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_msec_slot 经 ngx_parse_time 解析为毫秒，与“time”一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, merge-default, socket-conf-assign, socket-conf-get
  - 判据：socket 创建时 connect_timeout 未被单独设置则取 conf->connect_timeout（默认 60000ms）；connect 的 ngx_add_timer(c->write) 与 sslhandshake 等待的 ngx_add_timer(c->read) 都使用 u->connect_timeout。 经 u->conf 读取的链路：socket 创建时 u->conf = llcf（socket-conf-assign），llcf 为 srv conf，其字段即本指令注册的 offset。 取配置：llcf = ngx_stream_lua_get_module_loc_conf(r, …)（socket-conf-get，connect 函数），与 u->conf = llcf（socket-conf-assign）两行缺一即缺环。
- 新增片段：socket-conf-assign（stream-lua-nginx-module:src/ngx_stream_lua_socket_tcp.c:1060-1062）；socket-conf-get（stream-lua-nginx-module:src/ngx_stream_lua_socket_tcp.c:905-905）
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--lua_socket_send_timeout

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_msec_slot 经 ngx_parse_time 解析为毫秒，与“time”一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, merge-default, socket-conf-assign, socket-conf-get
  - 判据：cosocket 的 send_timeout 未单独设置取 conf->send_timeout；send 写等待与 util.c 中 stream 下游输出等待都用 srv conf 的 send_timeout 加定时器（README 亦说明 stream 没有 send_timeout 指令而借用该指令）。 经 u->conf 读取的链路：socket 创建时 u->conf = llcf（socket-conf-assign），llcf 为 srv conf，其字段即本指令注册的 offset。 取配置：llcf = ngx_stream_lua_get_module_loc_conf(r, …)（socket-conf-get，connect 函数），与 u->conf = llcf（socket-conf-assign）两行缺一即缺环。
- 新增片段：socket-conf-assign（stream-lua-nginx-module:src/ngx_stream_lua_socket_tcp.c:1060-1062）；socket-conf-get（stream-lua-nginx-module:src/ngx_stream_lua_socket_tcp.c:905-905）
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--lua_socket_send_lowat

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_size_slot 解析大小，并有 post 回调 ngx_stream_lua_lowat_check 校验，与“size”一致。
- 功能：verified；source_ids：implementation-2, implementation-3, merge-default, socket-conf-assign, socket-conf-get
  - 判据：值存入 srv conf send_lowat（默认 0），cosocket 写与下游输出的 ngx_handle_write_event 均以该值为 lowat 参数。 经 u->conf 读取的链路：socket 创建时 u->conf = llcf（socket-conf-assign），llcf 为 srv conf，其字段即本指令注册的 offset。 取配置：llcf = ngx_stream_lua_get_module_loc_conf(r, …)（socket-conf-get，connect 函数），与 u->conf = llcf（socket-conf-assign）两行缺一即缺环。
- 新增片段：socket-conf-assign（stream-lua-nginx-module:src/ngx_stream_lua_socket_tcp.c:1060-1062）；socket-conf-get（stream-lua-nginx-module:src/ngx_stream_lua_socket_tcp.c:905-905）
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--lua_socket_buffer_size

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_size_slot 解析大小，与“size”一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, merge-default, socket-conf-assign, socket-conf-get
  - 判据：值存入 buffer_size（默认 ngx_pagesize）；TCP 接收路径分配接收缓冲块时用 u->conf->buffer_size 作为块容量（前缀较长时取较大者）。 经 u->conf 读取的链路：socket 创建时 u->conf = llcf（socket-conf-assign），llcf 为 srv conf，其字段即本指令注册的 offset。 取配置：llcf = ngx_stream_lua_get_module_loc_conf(r, …)（socket-conf-get，connect 函数），与 u->conf = llcf（socket-conf-assign）两行缺一即缺环。
- 新增片段：socket-conf-assign（stream-lua-nginx-module:src/ngx_stream_lua_socket_tcp.c:1060-1062）；socket-conf-get（stream-lua-nginx-module:src/ngx_stream_lua_socket_tcp.c:905-905）
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--lua_socket_pool_size

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_num_slot 用 ngx_atoi 解析为整数，与语法一致。 占位符 size 暗示可带单位，源码不接受，故改为 num。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, merge-default, socket-conf-assign
  - 判据：setkeepalive 未给 size 时取 llcf->pool_size（默认 30），并以它创建 peer key 对应的 socket 池；connect 选项仅在给了 backlog 且 pool_size==0 时取该默认值，否则不建池。socket 创建时 u->conf = llcf（socket-conf-assign）。
- 新增片段：socket-conf-assign（stream-lua-nginx-module:src/ngx_stream_lua_socket_tcp.c:1060-1062）
- 修正：syntax→「lua_socket_pool_size num;」（ngx_conf_set_num_slot 经 ngx_atoi 解析整数，不接受 k/m 等大小单位，占位符 size 易误导。）
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--lua_socket_read_timeout

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_msec_slot 经 ngx_parse_time 解析为毫秒，与“time”一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, merge-default, socket-conf-assign, socket-conf-get
  - 判据：socket 的 read_timeout 未单独设置取 conf->read_timeout（默认 60000ms），读等待 ngx_add_timer(rev, u->read_timeout)。 经 u->conf 读取的链路：socket 创建时 u->conf = llcf（socket-conf-assign），llcf 为 srv conf，其字段即本指令注册的 offset。 取配置：llcf = ngx_stream_lua_get_module_loc_conf(r, …)（socket-conf-get，connect 函数），与 u->conf = llcf（socket-conf-assign）两行缺一即缺环。
- 新增片段：socket-conf-assign（stream-lua-nginx-module:src/ngx_stream_lua_socket_tcp.c:1060-1062）；socket-conf-get（stream-lua-nginx-module:src/ngx_stream_lua_socket_tcp.c:905-905）
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--lua_check_client_abort

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG（恰好 1 个参数），ngx_conf_set_flag_slot 仅接受 on/off。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, merge-default
  - 判据：check_client_abort 开启（默认 0）时 content 处理与下游 raw socket 读路径把 read_event_handler 设为 ngx_stream_lua_rd_check_broken_connection，读到 EOF 时返回客户端中止，否则改用 block_reading。
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--lua_ssl_protocols

- 语法：verified；source_ids：registration, configuration-definition, implementation-0
  - 判据：注册为 NGX_CONF_1MORE，ngx_conf_set_bitmask_slot 按取值表逐词匹配；取值表含 SSLv2、SSLv3、TLSv1、TLSv1.1、TLSv1.2，并在 NGX_SSL_TLSv1_3 定义时含 TLSv1.3，与语法一致。
- 功能：verified；source_ids：implementation-1, implementation-2, implementation-3, merge-default, socket-conf-assign, socket-conf-get
  - 判据：ssl_protocols 掩码（默认含 SSLv3~TLSv1.2）在 ngx_stream_lua_set_ssl 传给 ngx_ssl_create，后者对未列出的协议设 SSL_OP_NO_*；cosocket 的 sslhandshake 以 NGX_SSL_CLIENT 标志在该 ssl 上建连接。 经 u->conf 读取的链路：socket 创建时 u->conf = llcf（socket-conf-assign），llcf 为 srv conf，其字段即本指令注册的 offset。 取配置：llcf = ngx_stream_lua_get_module_loc_conf(r, …)（socket-conf-get，connect 函数），与 u->conf = llcf（socket-conf-assign）两行缺一即缺环。
- 新增片段：socket-conf-assign（stream-lua-nginx-module:src/ngx_stream_lua_socket_tcp.c:1060-1062）；socket-conf-get（stream-lua-nginx-module:src/ngx_stream_lua_socket_tcp.c:905-905）
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--lua_ssl_ciphers

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_str_slot 取 value[1] 为字符串，与“ciphers”一致。
- 功能：verified；source_ids：implementation-0, implementation-2, merge-default, socket-conf-assign, socket-conf-get
  - 判据：ssl_ciphers（默认 "DEFAULT"）在 ngx_stream_lua_set_ssl 传给 SSL_CTX_set_cipher_list；cosocket 用该 lscf->ssl 以 CLIENT 标志建 SSL 连接。 经 u->conf 读取的链路：socket 创建时 u->conf = llcf（socket-conf-assign），llcf 为 srv conf，其字段即本指令注册的 offset。 取配置：llcf = ngx_stream_lua_get_module_loc_conf(r, …)（socket-conf-get，connect 函数），与 u->conf = llcf（socket-conf-assign）两行缺一即缺环。
- 新增片段：socket-conf-assign（stream-lua-nginx-module:src/ngx_stream_lua_socket_tcp.c:1060-1062）；socket-conf-get（stream-lua-nginx-module:src/ngx_stream_lua_socket_tcp.c:905-905）
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--ssl_client_hello_by_lua_block

- 语法：verified；source_ids：registration, configuration-definition, implementation-0, implementation-1
  - 判据：注册为 NGX_CONF_BLOCK|NGX_CONF_NOARGS（无参数的块指令）；块函数调用 ngx_stream_lua_conf_lua_block_parse 按花括号层级读取 Lua 文本，去掉末尾 } 后作为 value[1] 交给对应处理函数。
- 功能：verified；source_ids：implementation-0, implementation-3, implementation-4, summary-handler-inline
  - 判据：块文本经 ssl_client_hello_by_lua 存入 srv.ssl_client_hello_*；merge 时在该 server 的 stream ssl ctx 上 SSL_CTX_set_client_hello_cb 注册 ngx_stream_lua_ssl_client_hello_handler，其执行 ssl_client_hello_handler_inline。 ssl_client_hello_handler_inline 函数体 cache_loadbuffer 加载 ssl_client_hello_src 后 by_chunk 运行（summary-handler-inline）。
- 新增片段：summary-handler-inline（stream-lua-nginx-module:src/ngx_stream_lua_ssl_client_helloby.c:52-71）
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--ssl_client_hello_by_lua_file

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_stream_lua_ssl_client_hello_by_lua 取 value[1] 为路径（rebase_path），与语法一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2
  - 判据：路径存入 srv.ssl_client_hello_*；merge 时在该 server 的 stream ssl ctx 上 SSL_CTX_set_client_hello_cb 注册回调，回调执行 ssl_client_hello_handler_file。
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--ssl_certificate_by_lua_block

- 语法：verified；source_ids：registration, configuration-definition, implementation-0, implementation-1
  - 判据：注册为 NGX_CONF_BLOCK|NGX_CONF_NOARGS（无参数的块指令）；块函数调用 ngx_stream_lua_conf_lua_block_parse 按花括号层级读取 Lua 文本，去掉末尾 } 后作为 value[1] 交给对应处理函数。
- 功能：verified；source_ids：implementation-0, implementation-4, implementation-5, summary-cert-inline
  - 判据：块文本经 ssl_cert_by_lua 存入 srv.ssl_cert_handler（handler_inline），merge 时 SSL_CTX_set_cert_cb 注册 ngx_stream_lua_ssl_cert_handler，其调用 srv.ssl_cert_handler，handler_inline 用 cache_loadbuffer 加载 ssl_cert_src 后 by_chunk 运行。文字删去未被源码证明的“完整”。
- 新增片段：summary-cert-inline（stream-lua-nginx-module:src/ngx_stream_lua_ssl_certby.c:69-88）
- 修正：summary→「在Stream下游TLS握手的证书回调（SSL_CTX_set_cert_cb）执行Lua，执行配置中的Lua块。」（“完整TLS握手”（会话复用不触发）取决于OpenSSL行为，源码片段未证明，删去“完整”。）
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--ssl_certificate_by_lua_file

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_stream_lua_ssl_cert_by_lua 取 value[1] 为路径（rebase_path），与语法一致。
- 功能：verified；source_ids：configuration-definition, implementation-2, implementation-3, summary-cert-file
  - 判据：文件路径经 ssl_cert_by_lua 存入 srv.ssl_cert_src 与 handler_file，merge 时 SSL_CTX_set_cert_cb 注册 ngx_stream_lua_ssl_cert_handler，其调用 srv.ssl_cert_handler，handler_file 用 cache_loadfile 加载文件后 by_chunk 运行。文字删去未被源码证明的“完整”。
- 新增片段：summary-cert-file（stream-lua-nginx-module:src/ngx_stream_lua_ssl_certby.c:49-66）
- 修正：summary→「在Stream下游TLS握手的证书回调（SSL_CTX_set_cert_cb）执行Lua，加载外部Lua文件。」（“完整TLS握手”（会话复用不触发）取决于OpenSSL行为，源码片段未证明，删去“完整”。）
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--lua_ssl_verify_depth

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_num_slot 用 ngx_atoi 解析为整数，与语法一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, merge-default, summary-ssl-create-connection, socket-conf-assign, socket-conf-get
  - 判据：lscf->ssl_verify_depth（默认 1）仅在 lua_ssl_trusted_certificate 非空时传给 ngx_ssl_trusted_certificate(depth)，后者 SSL_CTX_set_verify_depth；socket 创建时 u->conf = llcf，sslhandshake 用 ngx_ssl_create_connection(u->conf->ssl, …) 建连接，ssl_verify 路径 SSL_get_verify_result 判定。 取配置：llcf = ngx_stream_lua_get_module_loc_conf(r, …)（socket-conf-get，connect 函数），与 u->conf = llcf（socket-conf-assign）两行缺一即缺环。
- 新增片段：summary-ssl-create-connection（stream-lua-nginx-module:src/ngx_stream_lua_socket_tcp.c:1628-1638）；socket-conf-assign（stream-lua-nginx-module:src/ngx_stream_lua_socket_tcp.c:1060-1062）；socket-conf-get（stream-lua-nginx-module:src/ngx_stream_lua_socket_tcp.c:905-905）
- 修正：summary→「在配置了 lua_ssl_trusted_certificate 时，设置Stream Lua cosocket验证远端证书的链深度（默认1）。」（源码中该深度只在信任证书文件非空时才传入SSL ctx，原文未带此条件。）
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--lua_ssl_certificate

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_str_array_slot 把 value[1] 追加进字符串数组，与“file”一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, socket-conf-assign, socket-conf-get
  - 判据：证书数组在 ngx_stream_lua_set_ssl 传给 ngx_ssl_certificates，把证书链装入 lscf->ssl（缺私钥报错）；cosocket 以 CLIENT 标志用该 ssl 建连接。 经 u->conf 读取的链路：socket 创建时 u->conf = llcf（socket-conf-assign），llcf 为 srv conf，其字段即本指令注册的 offset。 取配置：llcf = ngx_stream_lua_get_module_loc_conf(r, …)（socket-conf-get，connect 函数），与 u->conf = llcf（socket-conf-assign）两行缺一即缺环。
- 新增片段：socket-conf-assign（stream-lua-nginx-module:src/ngx_stream_lua_socket_tcp.c:1060-1062）；socket-conf-get（stream-lua-nginx-module:src/ngx_stream_lua_socket_tcp.c:905-905）
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--lua_ssl_certificate_key

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_str_array_slot 把 value[1] 追加进字符串数组，与“file”一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, implementation-4, socket-conf-assign, socket-conf-get
  - 判据：私钥数组在 ngx_stream_lua_set_ssl 与证书一起传给 ngx_ssl_certificates，后者加载私钥与对应证书配对；cosocket 用该 ssl 作为客户端。 经 u->conf 读取的链路：socket 创建时 u->conf = llcf（socket-conf-assign），llcf 为 srv conf，其字段即本指令注册的 offset。 取配置：llcf = ngx_stream_lua_get_module_loc_conf(r, …)（socket-conf-get，connect 函数），与 u->conf = llcf（socket-conf-assign）两行缺一即缺环。
- 新增片段：socket-conf-assign（stream-lua-nginx-module:src/ngx_stream_lua_socket_tcp.c:1060-1062）；socket-conf-get（stream-lua-nginx-module:src/ngx_stream_lua_socket_tcp.c:905-905）
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--lua_ssl_trusted_certificate

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_str_slot 取 value[1]，与“file”一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, socket-conf-assign, socket-conf-get
  - 判据：非空时 ngx_stream_lua_set_ssl 调用 ngx_ssl_trusted_certificate，后者 SSL_CTX_load_verify_locations 加载该文件；cosocket 的 ssl_verify 路径用 SSL_get_verify_result 判定。 经 u->conf 读取的链路：socket 创建时 u->conf = llcf（socket-conf-assign），llcf 为 srv conf，其字段即本指令注册的 offset。 取配置：llcf = ngx_stream_lua_get_module_loc_conf(r, …)（socket-conf-get，connect 函数），与 u->conf = llcf（socket-conf-assign）两行缺一即缺环。
- 新增片段：socket-conf-assign（stream-lua-nginx-module:src/ngx_stream_lua_socket_tcp.c:1060-1062）；socket-conf-get（stream-lua-nginx-module:src/ngx_stream_lua_socket_tcp.c:905-905）
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--lua_ssl_crl

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_str_slot 取 value[1]，与“file”一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, socket-conf-assign, socket-conf-get
  - 判据：ngx_stream_lua_set_ssl 调用 ngx_ssl_crl：非空时 X509_LOOKUP_load_file(..., X509_FILETYPE_PEM) 并置 X509_V_FLAG_CRL_CHECK|CRL_CHECK_ALL；cosocket 的 ssl_verify 路径使用该 store。 经 u->conf 读取的链路：socket 创建时 u->conf = llcf（socket-conf-assign），llcf 为 srv conf，其字段即本指令注册的 offset。 取配置：llcf = ngx_stream_lua_get_module_loc_conf(r, …)（socket-conf-get，connect 函数），与 u->conf = llcf（socket-conf-assign）两行缺一即缺环。
- 新增片段：socket-conf-assign（stream-lua-nginx-module:src/ngx_stream_lua_socket_tcp.c:1060-1062）；socket-conf-get（stream-lua-nginx-module:src/ngx_stream_lua_socket_tcp.c:905-905）
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--lua_ssl_conf_command

- 语法：verified；source_ids：registration, configuration-definition, implementation-0, implementation-1
  - 判据：注册为 NGX_CONF_TAKE2，ngx_conf_set_keyval_slot 把 value[1]/value[2] 作 key/value 追加进数组，并有 post 回调 ngx_stream_lua_ssl_conf_command_check，与“name value”一致。
- 功能：verified；source_ids：implementation-3, implementation-4, implementation-7
  - 判据：命令数组在 ngx_stream_lua_set_ssl 创建 ssl ctx 之后传给 ngx_ssl_conf_commands，逐条 SSL_CONF_cmd 执行（nginx_version>=1019004、需 SSL_CONF_FLAG_FILE）。
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--lua_malloc_trim

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_stream_lua_malloc_trim 对 value[1] 做 ngx_atoi 得请求计数，与“request-count”一致。
- 功能：verified；source_ids：implementation-0, implementation-1, df340-lua-s-lua_malloc_trim-consume
  - 判据：值存入 malloc_trim_cycle 且非 0 时置 requires_log；log handler 每次执行累加计数，达到周期即 malloc_trim(1)；平台无 malloc_trim 时仅告警并忽略。
- 修正：无
- 缺口：无

## stream-lua-nginx-module--ngx_stream_lua_module--lua_add_variable

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；函数要求 value[1] 首字符为 $，与“$var”一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2
  - 判据：函数用 NGX_STREAM_VAR_CHANGEABLE|WEAK 调用 ngx_stream_add_variable 注册变量（无 get_handler 时设为 not_found）；ngx_stream_lua_ffi_var_set 仅在变量带 CHANGEABLE 时才允许写入。
- 修正：无
- 缺口：无
