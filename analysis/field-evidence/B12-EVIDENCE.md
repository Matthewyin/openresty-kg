# B12 字段证据记录

范围：lua-nginx-module（ngx_http_lua_module），共 79 条。固定 revision：lua-nginx-module v0.10.27（ea09d92a…）；涉及 nginx release-1.27.1、lua-resty-core 固定 revision 与 OpenResty 补丁文件。HTTP 与 stream 同名指令属不同组件，本批不借用 stream-lua 结论。

## lua-nginx-module--ngx_http_lua_module--lua_load_resty_core

- 语法（`lua_load_resty_core on | off;`）：verified；source_ids：registration, configuration-definition, syntax-arg-count
  - 判据：注册为 NGX_CONF_FLAG，ngx_conf_handler 只检查参数个数为 2（含指令名，nginx ngx_conf_file.c 413-421）；处理函数不读 value[1]、不调用 ngx_conf_set_flag_slot，因此任意单个参数均被接受，语法改为通用占位符。
- 功能：verified；source_ids：evidence-1, df340-lua-h-lua_load_resty_core-mandatory-require
  - 判据：本指令的处理函数 ngx_http_lua_load_resty_core 仅输出“已废弃”警告并返回 OK，不保存任何配置值；Lua VM 初始化（ngx_http_lua_util.c 的 require "resty.core"，失败即返回 NGX_DECLINED）不读取该指令，故强制加载与指令无关。
- 新增片段：syntax-arg-count（nginx/src/core/ngx_conf_file.c:413-421）
- 修正（syntax）：lua_load_resty_core value; —— 理由：注册为 NGX_CONF_FLAG，nginx 只检查参数个数为 1；处理函数不读取参数，不校验 on/off。

## lua-nginx-module--ngx_http_lua_module--lua_thread_cache_max_entries

- 语法（`lua_thread_cache_max_entries num;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_num_slot 按整数解析（失败报错），对应单个数值参数。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, summary-main-conf-lmcf
  - 判据：配置值 lua_thread_cache_max_entries 在 merge 阶段缺省为 1024，并在 main 初始化时据此分配 n 个 thread_ref 槽（impl-1）；运行期 new_thread 仅从缓存队列取、释放时仅在空闲槽非空时放回（util.c），故为每个 worker 进程内复用 Lua 线程对象缓存的条目上限（HAVE_LUA_RESETTHREAD 条件下）。“每个 worker”指进程内：计数/缓存位于配置内存池或 lmcf 的普通变量，未使用共享内存，fork 后各 worker 各持一份。
- 新增片段：summary-main-conf-lmcf（lua-nginx-module/src/ngx_http_lua_module.c:1083-1083）

## lua-nginx-module--ngx_http_lua_module--lua_max_running_timers

- 语法（`lua_max_running_timers count;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_num_slot 按整数解析（失败报错），对应单个数值参数。
- 功能：verified；source_ids：implementation-0, implementation-1, summary-running-decr
  - 判据：ngx_http_lua_timer_handler 在到期处理中比较 lmcf->running_timers 与 lmcf->max_running_timers，达到上限即走 failed 并报“lua_max_running_timers are not enough”；running_timers 在同函数中递增。计数存于 worker 进程的 main conf，故按 worker 限制。running_timers 在 timer 处理中 ++（timer.c 649，impl-1 片段内），在请求清理时对 fake 请求且 context==TIMER 的情况 --（util.c 1085-1101），递增与递减配对，故统计同时运行的 timer；计数在进程内（lmcf 普通字段，未用共享内存）。
- 新增片段：summary-running-decr（lua-nginx-module/src/ngx_http_lua_util.c:1085-1101）

## lua-nginx-module--ngx_http_lua_module--lua_max_pending_timers

- 语法（`lua_max_pending_timers count;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_num_slot 按整数解析（失败报错），对应单个数值参数。
- 功能：verified；source_ids：implementation-0, summary-pending-incr, summary-pending-decr
  - 判据：ngx.timer.at 创建前比较 lmcf->pending_timers 与 max_pending_timers，达到则返回 “too many pending timers”；pending_timers 在创建 timer 时 ++、到期处理开头 --，即统计尚未到期的 timer。“每个 worker”指进程内：计数/缓存位于配置内存池或 lmcf 的普通变量，未使用共享内存，fork 后各 worker 各持一份。
- 新增片段：summary-pending-decr（lua-nginx-module/src/ngx_http_lua_timer.c:543-546）；summary-pending-incr（lua-nginx-module/src/ngx_http_lua_timer.c:335-339）

## lua-nginx-module--ngx_http_lua_module--lua_shared_dict

- 语法（`lua_shared_dict name size;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE2；处理函数取 value[1] 为 name（空串报错）、value[2] 经 ngx_parse_size 解析为 size（≤8191 报错），与 name size 一致。
- 功能：verified；source_ids：evidence-1, df340-lua-h-lua_shared_dict-dict-consume, summary-shm-alloc, summary-shm-mmap, configuration-definition
  - 判据：处理函数用 name 与 size 调用 ngx_http_lua_shared_memory_add 登记 shm zone 并写入 shdict_zones；初始化 ngx.shared 时按 zone 名建表（dict-consume）；nginx 在 ngx_init_cycle 中对每个 zone 调用 ngx_shm_alloc，Unix 实现为 mmap(MAP_ANON|MAP_SHARED)，因此各 worker 共享该区域。
- 新增片段：summary-shm-alloc（nginx/src/core/ngx_cycle.c:483-490）；summary-shm-mmap（nginx/src/os/unix/ngx_shmem.c:16-25）

## lua-nginx-module--ngx_http_lua_module--lua_capture_error_log

- 语法（`lua_capture_error_log size;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；处理函数取 value[1]，空串报错，经 ngx_parse_size 解析并要求不小于 NGX_MAX_ERROR_STR，对应 size 参数；未打 intercept_error_log 补丁时直接返回 not found。
- 功能：verified；source_ids：implementation-0, implementation-3, patch-intercept_error_log
  - 判据：处理函数（仅在 HAVE_INTERCEPT_ERROR_LOG_PATCH 下可用，intercept_error_log 补丁定义该宏）用 size 分配环形缓冲区并把 cycle->intercept_error_log_handler 设为 ngx_http_lua_capture_log_handler；补丁使 ngx_log_error_core 调用该回调，回调把日志写入 ringbuf（log.c 327-347，log_ringbuf.c），故 size 即截获缓冲区容量。

## lua-nginx-module--ngx_http_lua_module--lua_sa_restart

- 语法（`lua_sa_restart on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG（1 个参数），ngx_conf_set_flag_slot 仅接受 on/off，与 on | off 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, summary-init-worker-head, module-owner, summary-init-worker-lmcf
  - 判据：worker 初始化函数在 NGX_HTTP_LUA_HAVE_SA_RESTART 条件下检查 lmcf->set_sa_restart，为真则调用 ngx_http_lua_set_sa_restart，遍历 NGX_HTTP_LUA_SA_RESTART_SIGS 对每个信号 sigaction 并置 SA_RESTART。78-82 行所在函数为 ngx_http_lua_init_worker（initworkerby.c 22-34 函数头），模块定义（module-owner）将其注册为 init_process，即 worker 初始化阶段执行。
- 新增片段：summary-init-worker-head（lua-nginx-module/src/ngx_http_lua_initworkerby.c:22-34）；summary-init-worker-lmcf（lua-nginx-module/src/ngx_http_lua_initworkerby.c:43-43）

## lua-nginx-module--ngx_http_lua_module--lua_regex_cache_max_entries

- 语法（`lua_regex_cache_max_entries num;`）：verified；source_ids：registration, configuration-definition, syntax-num-slot
  - 判据：注册为 NGX_CONF_TAKE1；NGX_PCRE 下处理函数直接转调 ngx_conf_set_num_slot（整数解析），无 PCRE 时忽略参数；对应 num 参数。
- 功能：verified；source_ids：implementation-0, summary-regex-cache-getter, summary-regex-cache-limit
  - 判据：ngx_http_lua_ffi_max_regex_cache_size 返回 lmcf->regex_cache_max_entries；lua-resty-core 的 regex.lua 经该 FFI 取得上限，仅当已缓存数 regex_cache_size 小于该上限时才把编译结果放入缓存，故为 Lua 正则（ngx.re）缓存的条目容量。
- 新增片段：summary-regex-cache-getter（lua-resty-core/lib/resty/core/regex.lua:348-354）；summary-regex-cache-limit（lua-resty-core/lib/resty/core/regex.lua:930-962）；syntax-num-slot（nginx/src/core/ngx_conf_file.c:1167-1194）

## lua-nginx-module--ngx_http_lua_module--lua_regex_match_limit

- 语法（`lua_regex_match_limit num;`）：verified；source_ids：registration, configuration-definition, syntax-num-slot
  - 判据：注册为 NGX_CONF_TAKE1；NGX_PCRE 下处理函数直接转调 ngx_conf_set_num_slot（整数解析），无 PCRE 时忽略参数；对应 num 参数。
- 功能：verified；source_ids：implementation-0, implementation-1, summary-regex-exec, summary-regex-compile-lmcf
  - 判据：regex_match_limit>0 时：PCRE2 路径对 ngx_regex_match_context 调用 pcre2_set_match_limit（impl-0），PCRE 路径对 study 结果设置 PCRE_EXTRA_MATCH_LIMIT 与 match_limit（impl-1，DFA 模式除外），即限制 PCRE 匹配的内部工作量。PCRE2 路径上 ngx_regex_match_context 被 pcre2_match / pcre2_dfa_match 使用（regex.c 730-742），故 pcre2_set_match_limit 的值作用于每次匹配。PCRE 路径的 lmcf 由 ngx_http_lua_ffi_compile_regex 取得并传入 jit_compile（regex.c 582-587）。
- 新增片段：summary-regex-compile-lmcf（lua-nginx-module/src/ngx_http_lua_regex.c:582-587）；summary-regex-exec（lua-nginx-module/src/ngx_http_lua_regex.c:730-742）；syntax-num-slot（nginx/src/core/ngx_conf_file.c:1167-1194）

## lua-nginx-module--ngx_http_lua_module--lua_package_cpath

- 语法（`lua_package_cpath lua-style-path;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；处理函数取 value[1] 写入 lmcf->lua_cpath，重复设置报 is duplicate，对应单个 lua-style-path 参数。
- 功能：verified；source_ids：implementation-0, implementation-1, df340-lua-h-lua_package_cpath-vm-path, configuration-definition, summary-init-vm-call, summary-new-state-call, summary-init-lmcf
  - 判据：新建 Lua VM（无 parent_vm）时，lmcf->lua_cpath 非空则经 ngx_http_lua_set_path 替换 $prefix、将 ;; 展开为默认值后写入 package.cpath（util.c）。链路：处理函数把值写入 lmcf->lua_cpath；ngx_http_lua_init 取得 lmcf（module.c 769）并传入 ngx_http_lua_init_vm（932-933），再传入 ngx_http_lua_new_state（util.c 3873）读取。
- 新增片段：summary-init-lmcf（lua-nginx-module/src/ngx_http_lua_module.c:769-769）；summary-init-vm-call（lua-nginx-module/src/ngx_http_lua_module.c:932-933）；summary-new-state-call（lua-nginx-module/src/ngx_http_lua_util.c:3873-3873）

## lua-nginx-module--ngx_http_lua_module--lua_package_path

- 语法（`lua_package_path lua-style-path;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；处理函数取 value[1] 写入 lmcf->lua_path，重复设置报 is duplicate，对应单个 lua-style-path 参数。
- 功能：verified；source_ids：implementation-0, implementation-1, df340-lua-h-lua_package_path-vm-path, configuration-definition, summary-init-vm-call, summary-new-state-call, summary-init-lmcf
  - 判据：新建 Lua VM（无 parent_vm）时，lmcf->lua_path 非空则经 ngx_http_lua_set_path 替换 $prefix、将 ;; 展开为默认值后写入 package.path（util.c）。链路：处理函数把值写入 lmcf->lua_path；ngx_http_lua_init 取得 lmcf（module.c 769）并传入 ngx_http_lua_init_vm（932-933），再传入 ngx_http_lua_new_state（util.c 3873）读取。
- 新增片段：summary-init-lmcf（lua-nginx-module/src/ngx_http_lua_module.c:769-769）；summary-init-vm-call（lua-nginx-module/src/ngx_http_lua_module.c:932-933）；summary-new-state-call（lua-nginx-module/src/ngx_http_lua_util.c:3873-3873）

## lua-nginx-module--ngx_http_lua_module--lua_code_cache

- 语法（`lua_code_cache on | off;`）：verified；source_ids：registration, configuration-definition, syntax-flag-slot
  - 判据：注册为 NGX_CONF_FLAG；处理函数 ngx_http_lua_code_cache 调用 ngx_conf_set_flag_slot（on/off），再在关闭时记录告警，与 on | off 一致。
- 功能：verified；source_ids：df340-lua-h-lua_code_cache-consume, summary-cache-lookup, summary-init-registry, summary-init-registry-call, summary-fake-conn-fd
  - 判据：代码缓存表挂在 VM 的 LUA_REGISTRYINDEX 中，加载时按 key 查缓存（cache.c）；llcf->enable_code_cache 为假时，请求创建 ctx 阶段（util.h）对非 fake 连接调用 ngx_http_lua_init_vm 新建 VM，故缓存不跨请求复用。原文“Lua 文件和 Lua 模块”中的模块缓存及“便于开发阶段修改后重试”未在片段中直接体现，予以收窄。“含各自的代码缓存表”：ngx_http_lua_init_vm 末尾调用 init_registry（util.c 321-324），其中创建 code_cache_key 表（782-816）；“非 fake connection”：fake 连接创建时 c->fd=-1（3995-4000），故 fd 不为 -1 的才新建 VM。
- 新增片段：summary-cache-lookup（lua-nginx-module/src/ngx_http_lua_cache.c:47-66）；summary-fake-conn-fd（lua-nginx-module/src/ngx_http_lua_util.c:3995-4000）；summary-init-registry（lua-nginx-module/src/ngx_http_lua_util.c:782-816）；summary-init-registry-call（lua-nginx-module/src/ngx_http_lua_util.c:321-324）；syntax-flag-slot（nginx/src/core/ngx_conf_file.c:1026-1062）
- 修正（summary）：控制 Lua 代码缓存。关闭时，对非 fake connection 的请求，每个请求新建独立 Lua VM（含各自的代码缓存表），缓存不跨请求复用。 —— 理由：源码只证明关闭后每个请求新建 VM 使代码缓存表不跨请求复用；“Lua 文件和 Lua 模块”的区分及“便于开发阶段修改后重试”属文档说明，片段无直接支撑。

## lua-nginx-module--ngx_http_lua_module--lua_need_request_body

- 语法（`lua_need_request_body on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG（1 个参数），ngx_conf_set_flag_slot 仅接受 on/off，与 on | off 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, summary-llcf-srv-rewrite, summary-llcf-rewrite, summary-llcf-access, summary-llcf-content
  - 判据：注册 offsetof 指向 llcf->force_read_body；server_rewrite、rewrite、access、content 四个 HTTP Lua 阶段处理器在执行脚本前检查该值，为真则 ngx_http_read_client_request_body，未读完返回 NGX_DONE 等待。各阶段函数内 llcf 均由 ngx_http_get_module_loc_conf 取得（片段 summary-llcf-*），lscf 取自 srv conf。
- 新增片段：summary-llcf-access（lua-nginx-module/src/ngx_http_lua_accessby.c:78-78）；summary-llcf-content（lua-nginx-module/src/ngx_http_lua_contentby.c:167-167）；summary-llcf-rewrite（lua-nginx-module/src/ngx_http_lua_rewriteby.c:80-80）；summary-llcf-srv-rewrite（lua-nginx-module/src/ngx_http_lua_server_rewriteby.c:40-41）

## lua-nginx-module--ngx_http_lua_module--lua_transform_underscores_in_response_headers

- 语法（`lua_transform_underscores_in_response_headers on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG（1 个参数），ngx_conf_set_flag_slot 仅接受 on/off，与 on | off 一致。
- 功能：verified；source_ids：implementation-0, implementation-1
  - 判据：注册 offsetof 指向 llcf->transform_underscores_in_resp_headers；ngx.header 设置（headers.c 963-996）与读取响应头（1174-1195）在该值为真时把 key 中的 _ 替换为 -。

## lua-nginx-module--ngx_http_lua_module--lua_socket_log_errors

- 语法（`lua_socket_log_errors on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG（1 个参数），ngx_conf_set_flag_slot 仅接受 on/off，与 on | off 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3
  - 判据：注册 offsetof 指向 llcf->log_socket_errors；TCP cosocket 的 SSL 校验失败、读/写超时（socket_tcp.c）与 UDP 向已关闭 socket 发送（socket_udp.c）仅在该值为真时才 ngx_log_error 写入错误日志。

## lua-nginx-module--ngx_http_lua_module--init_by_lua_block

- 语法（`init_by_lua_block { lua-script }`）：verified；source_ids：registration, configuration-definition, implementation-1
  - 判据：注册为 NGX_CONF_BLOCK|NGX_CONF_NOARGS；包装函数把 cf->handler 设为 ngx_http_lua_init_by_lua，conf_lua_block_parse 按花括号层级读入块内文本并作为单个参数交给该处理函数，故无前置参数。
- 功能：verified；source_ids：implementation-0, implementation-2, implementation-3, implementation-4, summary-init-lmcf
  - 判据：块文本经处理函数存入 lmcf->init_src，init_handler=ngx_http_lua_init_by_inline（注册 post）；配置期 ngx_http_lua_init 创建 Lua VM 后，无 shm 立即调用 init_handler，有 shm 则待 zone 全部初始化后调用（api.c），inline 用 luaL_loadbuffer 加载并执行。处理函数（块包装转交的 by_lua 处理函数）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：summary-init-lmcf（lua-nginx-module/src/ngx_http_lua_module.c:769-769）

## lua-nginx-module--ngx_http_lua_module--init_by_lua

- 语法（`init_by_lua <lua-script-str>;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；处理函数 ngx_http_lua_init_by_lua 取 value[1] 作为 Lua 源码字符串（空串报错，重复报 is duplicate）。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, configuration-definition, summary-init-lmcf
  - 判据：字符串存入 lmcf->init_src，init_handler=ngx_http_lua_init_by_inline；配置期 ngx_http_lua_init 创建 VM 后（或 shm zone 初始化后）调用，inline 以 luaL_loadbuffer 加载执行单个字符串。处理函数（配置定义片段）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：summary-init-lmcf（lua-nginx-module/src/ngx_http_lua_module.c:769-769）

## lua-nginx-module--ngx_http_lua_module--init_by_lua_file

- 语法（`init_by_lua_file <path-to-lua-script-file>;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；处理函数在 cmd->post==ngx_http_lua_init_by_file 时把 value[1] 经 rebase_path 作为文件路径保存。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, configuration-definition, summary-init-lmcf
  - 判据：init_handler=ngx_http_lua_init_by_file，配置期 VM 创建后调用，以 luaL_loadfile 加载 lmcf->init_src 指向的文件并执行。处理函数（配置定义片段）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：summary-init-lmcf（lua-nginx-module/src/ngx_http_lua_module.c:769-769）

## lua-nginx-module--ngx_http_lua_module--init_worker_by_lua_block

- 语法（`init_worker_by_lua_block { lua-script }`）：verified；source_ids：registration, configuration-definition, implementation-1
  - 判据：注册为 NGX_CONF_BLOCK|NGX_CONF_NOARGS；块解析把块内文本作为单个参数交给 ngx_http_lua_init_worker_by_lua，无前置参数。
- 功能：verified；source_ids：implementation-2, implementation-3, implementation-4, implementation-5, module-owner, implementation-0, summary-init-worker-lmcf
  - 判据：worker 进程启动时由 nginx 在 ngx_worker_process_init 遍历模块调用 init_process（module-owner 注册 ngx_http_lua_init_worker），在其中构造 fake 请求并调用 lmcf->init_worker_handler（initworkerby.c）。handler 为 ngx_http_lua_init_worker_by_inline，以 luaL_loadbuffer 加载执行块内代码。处理函数（块包装转交的 by_lua 处理函数）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：summary-init-worker-lmcf（lua-nginx-module/src/ngx_http_lua_initworkerby.c:43-43）

## lua-nginx-module--ngx_http_lua_module--init_worker_by_lua

- 语法（`init_worker_by_lua <lua-script-str>;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；处理函数取 value[1] 作为 Lua 源码字符串。
- 功能：verified；source_ids：implementation-0, implementation-2, implementation-3, module-owner, configuration-definition, summary-init-worker-lmcf
  - 判据：worker 进程启动时由 nginx 在 ngx_worker_process_init 遍历模块调用 init_process（module-owner 注册 ngx_http_lua_init_worker），在其中构造 fake 请求并调用 lmcf->init_worker_handler（initworkerby.c）。handler 为 ngx_http_lua_init_worker_by_inline，加载执行单个字符串。处理函数（配置定义片段）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：summary-init-worker-lmcf（lua-nginx-module/src/ngx_http_lua_initworkerby.c:43-43）

## lua-nginx-module--ngx_http_lua_module--init_worker_by_lua_file

- 语法（`init_worker_by_lua_file <lua-file-path>;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；处理函数取 value[1] 作为文件路径。
- 功能：verified；source_ids：implementation-0, implementation-2, implementation-3, module-owner, configuration-definition, summary-init-worker-lmcf
  - 判据：worker 进程启动时由 nginx 在 ngx_worker_process_init 遍历模块调用 init_process（module-owner 注册 ngx_http_lua_init_worker），在其中构造 fake 请求并调用 lmcf->init_worker_handler（initworkerby.c）。handler 为 ngx_http_lua_init_worker_by_file，luaL_loadfile 加载执行文件。处理函数（配置定义片段）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：summary-init-worker-lmcf（lua-nginx-module/src/ngx_http_lua_initworkerby.c:43-43）

## lua-nginx-module--ngx_http_lua_module--exit_worker_by_lua_block

- 语法（`exit_worker_by_lua_block { lua-script }`）：verified；source_ids：registration, configuration-definition, implementation-1
  - 判据：注册为 NGX_CONF_BLOCK|NGX_CONF_NOARGS；块解析把块内文本作为单个参数交给 ngx_http_lua_exit_worker_by_lua，无前置参数。
- 功能：verified；source_ids：implementation-2, implementation-3, implementation-4, module-owner, implementation-0
  - 判据：worker 退出时 nginx ngx_worker_process_exit 遍历模块调用 exit_process（module-owner 注册 ngx_http_lua_exit_worker），其中构造 fake 请求并调用 lmcf->exit_worker_handler（exitworkerby.c）。handler 为 ngx_http_lua_exit_worker_by_inline，以 luaL_loadbuffer 加载执行块内代码。处理函数（块包装转交的 by_lua 处理函数）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。

## lua-nginx-module--ngx_http_lua_module--exit_worker_by_lua_file

- 语法（`exit_worker_by_lua_file <path-to-lua-script-file>;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；处理函数取 value[1] 作为文件路径。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, module-owner, configuration-definition
  - 判据：worker 退出时 nginx ngx_worker_process_exit 遍历模块调用 exit_process（module-owner 注册 ngx_http_lua_exit_worker），其中构造 fake 请求并调用 lmcf->exit_worker_handler（exitworkerby.c）。handler 为 ngx_http_lua_exit_worker_by_file，luaL_loadfile 加载执行文件。处理函数（配置定义片段）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。

## lua-nginx-module--ngx_http_lua_module--set_by_lua_block

- 语法（`set_by_lua_block $res { lua-script }`）：verified；source_ids：registration, configuration-definition, implementation-1, syntax-set-handler, syntax-ndk-var-name
  - 判据：注册为 NGX_CONF_TAKE1|NGX_CONF_BLOCK：1 个前置参数（变量名，经 ndk_set_var_name 要求以 $ 开头）加块；块解析后文本作为 value[2] 交给 ngx_http_lua_set_by_lua，filter.size=nelts-3=0，故无额外参数。变量名必须以 $ 开头由 ndk_set_var_name 校验（ndk_set_var.c 256-304，非 $ 开头报 invalid variable name）。
- 功能：verified；source_ids：implementation-2, implementation-3, df340-lua-h-set_by_lua_block-ndk-assign-code, df340-lua-h-set_by_lua_block-rewrite-two-phases, implementation-0
  - 判据：ndk_set_var_multi_value_core 把变量赋值指令编入 rewrite 模块的 codes 链（ndk_set_var.c 449-555），由 rewrite 模块在 server/location rewrite 阶段按序执行；执行时 filter_set_by_lua_* 取 Lua VM、加载脚本并 ngx_http_lua_set_by_chunk 运行，返回值写入变量（setby.c）。本指令入口为 set_by_lua_block→set_by_lua（inline 过滤器）。处理函数（块包装转交的 by_lua 处理函数）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：syntax-ndk-var-name（ngx_devel_kit/src/ndk_set_var.c:256-304）；syntax-set-handler（lua-nginx-module/src/ngx_http_lua_directive.c:285-338）

## lua-nginx-module--ngx_http_lua_module--set_by_lua

- 语法（`set_by_lua $res <lua-script-str> [$arg1 $arg2 ...];`）：verified；source_ids：registration, configuration-definition, syntax-ndk-var-name
  - 判据：注册为 NGX_CONF_2MORE；处理函数 value[1]=变量名（须以 $ 开头）、value[2]=脚本字符串、value[3..] 为额外参数（size=nelts-3），与 $res <lua-script-str> [$arg1 $arg2 ...] 一致。变量名必须以 $ 开头由 ndk_set_var_name 校验（ndk_set_var.c 256-304，非 $ 开头报 invalid variable name）。
- 功能：verified；source_ids：implementation-0, implementation-1, df340-lua-h-set_by_lua-ndk-assign-code, df340-lua-h-set_by_lua-rewrite-two-phases, configuration-definition
  - 判据：ndk_set_var_multi_value_core 把变量赋值指令编入 rewrite 模块的 codes 链（ndk_set_var.c 449-555），由 rewrite 模块在 server/location rewrite 阶段按序执行；执行时 filter_set_by_lua_* 取 Lua VM、加载脚本并 ngx_http_lua_set_by_chunk 运行，返回值写入变量（setby.c）。本指令为 filter_set_by_lua_inline。处理函数（配置定义片段）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：syntax-ndk-var-name（ngx_devel_kit/src/ndk_set_var.c:256-304）

## lua-nginx-module--ngx_http_lua_module--set_by_lua_file

- 语法（`set_by_lua_file $res <path-to-lua-script-file> [$arg1 $arg2 ...];`）：verified；source_ids：registration, configuration-definition, syntax-ndk-var-name
  - 判据：注册为 NGX_CONF_2MORE；处理函数 value[1]=变量名、value[2]=脚本文件路径（作为 complex value 编译，可含变量）、value[3..] 为额外参数，与语法一致。变量名必须以 $ 开头由 ndk_set_var_name 校验（ndk_set_var.c 256-304，非 $ 开头报 invalid variable name）。
- 功能：verified；source_ids：implementation-0, implementation-1, df340-lua-h-set_by_lua_file-ndk-assign-code, df340-lua-h-set_by_lua_file-rewrite-two-phases, configuration-definition
  - 判据：ndk_set_var_multi_value_core 把变量赋值指令编入 rewrite 模块的 codes 链（ndk_set_var.c 449-555），由 rewrite 模块在 server/location rewrite 阶段按序执行；执行时 filter_set_by_lua_* 取 Lua VM、加载脚本并 ngx_http_lua_set_by_chunk 运行，返回值写入变量（setby.c）。本指令为 filter_set_by_lua_file，以 cache_loadfile 加载文件。处理函数（配置定义片段）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：syntax-ndk-var-name（ngx_devel_kit/src/ndk_set_var.c:256-304）

## lua-nginx-module--ngx_http_lua_module--server_rewrite_by_lua_block

- 语法（`server_rewrite_by_lua_block { lua-script }`）：verified；source_ids：registration, configuration-definition, implementation-1
  - 判据：注册为 NGX_CONF_BLOCK|NGX_CONF_NOARGS；包装函数把 cf->handler 设为 ngx_http_lua_server_rewrite_by_lua，conf_lua_block_parse 按花括号层级读入块内文本作为单个参数交给该处理函数，无前置参数。
- 功能：verified；source_ids：implementation-2, implementation-3, implementation-4, implementation-0, summary-init-lmcf
  - 判据：阶段：server rewrite 阶段；入口：ngx_http_lua_server_rewrite_handler（module.c 801-809 挂入 NGX_HTTP_SERVER_REWRITE_PHASE）；由 server_rewrite_handler_inline（注册 post）加载块内代码并运行（server_rewriteby.c）。处理函数（块包装转交的 by_lua 处理函数）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：summary-init-lmcf（lua-nginx-module/src/ngx_http_lua_module.c:769-769）

## lua-nginx-module--ngx_http_lua_module--server_rewrite_by_lua_file

- 语法（`server_rewrite_by_lua_file <path-to-lua-script-file>;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；处理函数取 value[1] 作为Lua 文件路径（空串或重复设置报错），与语法一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, configuration-definition, summary-init-lmcf
  - 判据：阶段：server rewrite 阶段；入口：ngx_http_lua_server_rewrite_handler；由 server_rewrite_handler_file 加载文件并运行（server_rewriteby.c 154-189）。处理函数（配置定义片段）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：summary-init-lmcf（lua-nginx-module/src/ngx_http_lua_module.c:769-769）

## lua-nginx-module--ngx_http_lua_module--rewrite_by_lua

- 语法（`rewrite_by_lua <lua-script-str>;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；处理函数取 value[1] 作为Lua 源码字符串（空串或重复设置报错），与语法一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, configuration-definition, summary-init-lmcf
  - 判据：阶段：rewrite 阶段；入口：ngx_http_lua_rewrite_handler（module.c 811-818 挂入 NGX_HTTP_REWRITE_PHASE）；rewrite_handler_inline 以 cache_loadbuffer 加载字符串并运行（rewriteby.c）。处理函数（配置定义片段）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：summary-init-lmcf（lua-nginx-module/src/ngx_http_lua_module.c:769-769）

## lua-nginx-module--ngx_http_lua_module--rewrite_by_lua_block

- 语法（`rewrite_by_lua_block { lua-script }`）：verified；source_ids：registration, configuration-definition, implementation-1
  - 判据：注册为 NGX_CONF_BLOCK|NGX_CONF_NOARGS；包装函数把 cf->handler 设为 ngx_http_lua_rewrite_by_lua，conf_lua_block_parse 按花括号层级读入块内文本作为单个参数交给该处理函数，无前置参数。
- 功能：verified；source_ids：implementation-2, implementation-3, implementation-4, implementation-0, summary-init-lmcf
  - 判据：阶段：rewrite 阶段；入口：ngx_http_lua_rewrite_handler；块内代码经 rewrite_handler_inline 加载运行（rewriteby.c）。处理函数（块包装转交的 by_lua 处理函数）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：summary-init-lmcf（lua-nginx-module/src/ngx_http_lua_module.c:769-769）

## lua-nginx-module--ngx_http_lua_module--access_by_lua

- 语法（`access_by_lua <lua-script-str>;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；处理函数取 value[1] 作为Lua 源码字符串（空串或重复设置报错），与语法一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, configuration-definition, summary-init-lmcf
  - 判据：阶段：access 阶段；入口：ngx_http_lua_access_handler（module.c 820-827 挂入 NGX_HTTP_ACCESS_PHASE）；access_handler_inline 加载字符串并运行（accessby.c）。处理函数（配置定义片段）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：summary-init-lmcf（lua-nginx-module/src/ngx_http_lua_module.c:769-769）

## lua-nginx-module--ngx_http_lua_module--access_by_lua_block

- 语法（`access_by_lua_block { lua-script }`）：verified；source_ids：registration, configuration-definition, syntax-block-parse
  - 判据：注册为 NGX_CONF_BLOCK|NGX_CONF_NOARGS；包装函数把 cf->handler 设为 ngx_http_lua_access_by_lua，conf_lua_block_parse 按花括号层级读入块内文本作为单个参数交给该处理函数，无前置参数。
- 功能：verified；source_ids：summary-access-inline, summary-access-run, summary-access-install, df340-lua-h-access_by_lua_block-phase-setter, summary-init-lmcf
  - 判据：阶段：access 阶段；入口：ngx_http_lua_access_handler；块内代码经注册 post=access_handler_inline 加载运行（accessby.c 25-186）；具体访问控制逻辑由 Lua 代码决定，模块仅在该阶段运行它。处理函数（块包装转交的 by_lua 处理函数）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：summary-access-inline（lua-nginx-module/src/ngx_http_lua_accessby.c:162-186）；summary-access-install（lua-nginx-module/src/ngx_http_lua_module.c:820-827）；summary-access-run（lua-nginx-module/src/ngx_http_lua_accessby.c:25-159）；summary-init-lmcf（lua-nginx-module/src/ngx_http_lua_module.c:769-769）；syntax-block-parse（lua-nginx-module/src/ngx_http_lua_directive.c:1620-1675）

## lua-nginx-module--ngx_http_lua_module--content_by_lua

- 语法（`content_by_lua <lua-script-str>;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；处理函数取 value[1] 作为Lua 源码字符串（空串或重复设置报错），与语法一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, configuration-definition, summary-init-lmcf
  - 判据：阶段：content 阶段；入口：content_handler_inline 被设为 clcf->handler（directive.c 894-909）；ngx_http_lua_content_handler 读取请求体（若需要）后调用 llcf->content_handler（contentby.c 157-222）。处理函数（配置定义片段）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：summary-init-lmcf（lua-nginx-module/src/ngx_http_lua_module.c:769-769）

## lua-nginx-module--ngx_http_lua_module--content_by_lua_block

- 语法（`content_by_lua_block { lua-script }`）：verified；source_ids：registration, configuration-definition, evidence-1, syntax-block-parse
  - 判据：注册为 NGX_CONF_BLOCK|NGX_CONF_NOARGS；包装函数把 cf->handler 设为 ngx_http_lua_content_by_lua，块内文本作为单个参数交给它，该处理函数把 clcf->handler 设为 ngx_http_lua_content_handler（directive.c 894-909）。
- 功能：verified；source_ids：evidence-2, evidence-3, evidence-4, df340-lua-h-content_by_lua_block-phase-setter, summary-init-lmcf
  - 判据：阶段：content 阶段；入口：ngx_http_lua_content_handler（directive.c 894-911 设为 clcf->handler）；配置阶段保存 Lua 源码与 content_handler_inline（注册 post），请求阶段 content_handler 创建 ctx、运行 llcf->content_handler 加载并执行代码（contentby.c 157-224）。处理函数（块包装转交的 by_lua 处理函数）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：summary-init-lmcf（lua-nginx-module/src/ngx_http_lua_module.c:769-769）；syntax-block-parse（lua-nginx-module/src/ngx_http_lua_directive.c:1620-1675）

## lua-nginx-module--ngx_http_lua_module--log_by_lua

- 语法（`log_by_lua <lua-script-str>;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；处理函数取 value[1] 作为Lua 源码字符串（空串或重复设置报错），与语法一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, configuration-definition, summary-init-lmcf
  - 判据：阶段：log 阶段；入口：ngx_http_lua_log_handler（module.c 831-845 挂入 NGX_HTTP_LOG_PHASE 首位）；log_handler_inline 加载字符串并运行（logby.c）。处理函数（配置定义片段）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：summary-init-lmcf（lua-nginx-module/src/ngx_http_lua_module.c:769-769）

## lua-nginx-module--ngx_http_lua_module--log_by_lua_block

- 语法（`log_by_lua_block { lua-script }`）：verified；source_ids：registration, configuration-definition, implementation-1
  - 判据：注册为 NGX_CONF_BLOCK|NGX_CONF_NOARGS；包装函数把 cf->handler 设为 ngx_http_lua_log_by_lua，conf_lua_block_parse 按花括号层级读入块内文本作为单个参数交给该处理函数，无前置参数。
- 功能：verified；source_ids：implementation-2, implementation-3, implementation-4, implementation-5, implementation-0, summary-init-lmcf
  - 判据：阶段：log 阶段；入口：ngx_http_lua_log_handler；块内代码经 log_handler_inline 加载运行（logby.c）。处理函数（块包装转交的 by_lua 处理函数）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：summary-init-lmcf（lua-nginx-module/src/ngx_http_lua_module.c:769-769）

## lua-nginx-module--ngx_http_lua_module--rewrite_by_lua_file

- 语法（`rewrite_by_lua_file <path-to-lua-script-file>;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；处理函数取 value[1] 作为Lua 文件路径（空串或重复设置报错），与语法一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, configuration-definition, summary-init-lmcf
  - 判据：阶段：rewrite 阶段；入口：ngx_http_lua_rewrite_handler；rewrite_handler_file 加载文件并运行（rewriteby.c 194-231）。处理函数（配置定义片段）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：summary-init-lmcf（lua-nginx-module/src/ngx_http_lua_module.c:769-769）

## lua-nginx-module--ngx_http_lua_module--rewrite_by_lua_no_postpone

- 语法（`rewrite_by_lua_no_postpone on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG（1 个参数），ngx_conf_set_flag_slot 仅接受 on/off，与 on | off 一致。
- 功能：verified；source_ids：df340-lua-h-rewrite_by_lua_no_postpone-consume, merge-default, configuration-definition, summary-init-lmcf
  - 判据：注册 offsetof 指向 lmcf->postponed_to_rewrite_phase_end，缺省 0；rewrite 处理器在其为 0 时置 1 并把自身 phase handler 移到 rewrite 阶段末尾（rewriteby.c 41-78）；本指令置 on 后该字段为真，跳过此移动，即取消尾部推迟。处理函数（配置定义片段）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：summary-init-lmcf（lua-nginx-module/src/ngx_http_lua_module.c:769-769）

## lua-nginx-module--ngx_http_lua_module--access_by_lua_file

- 语法（`access_by_lua_file <path-to-lua-script-file>;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；处理函数取 value[1] 作为Lua 文件路径（空串或重复设置报错），与语法一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, configuration-definition, summary-init-lmcf
  - 判据：阶段：access 阶段；入口：ngx_http_lua_access_handler；access_handler_file 加载文件并运行（accessby.c 189-230）。处理函数（配置定义片段）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：summary-init-lmcf（lua-nginx-module/src/ngx_http_lua_module.c:769-769）

## lua-nginx-module--ngx_http_lua_module--access_by_lua_no_postpone

- 语法（`access_by_lua_no_postpone on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG（1 个参数），ngx_conf_set_flag_slot 仅接受 on/off，与 on | off 一致。
- 功能：verified；source_ids：df340-lua-h-access_by_lua_no_postpone-consume, merge-default, configuration-definition, summary-init-lmcf
  - 判据：注册 offsetof 指向 lmcf->postponed_to_access_phase_end，缺省 0；access 处理器在其为 0 时置 1 并把自身 phase handler 移到 access 阶段末尾（accessby.c 39-76）；本指令置 on 后该字段为真，跳过此移动。处理函数（配置定义片段）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：summary-init-lmcf（lua-nginx-module/src/ngx_http_lua_module.c:769-769）

## lua-nginx-module--ngx_http_lua_module--content_by_lua_file

- 语法（`content_by_lua_file <path-to-lua-script-file>;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；处理函数取 value[1] 作为Lua 文件路径（空串或重复设置报错），与语法一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, configuration-definition, summary-init-lmcf
  - 判据：阶段：content 阶段；入口：content_handler_file 被设为 clcf->handler；content_handler_file 加载文件并运行（contentby.c 246-286）。处理函数（配置定义片段）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：summary-init-lmcf（lua-nginx-module/src/ngx_http_lua_module.c:769-769）

## lua-nginx-module--ngx_http_lua_module--log_by_lua_file

- 语法（`log_by_lua_file <path-to-lua-script-file>;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；处理函数取 value[1] 作为Lua 文件路径（空串或重复设置报错），与语法一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, configuration-definition, summary-init-lmcf
  - 判据：阶段：log 阶段；入口：ngx_http_lua_log_handler；log_handler_file 加载文件并运行（logby.c 167-200）。处理函数（配置定义片段）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：summary-init-lmcf（lua-nginx-module/src/ngx_http_lua_module.c:769-769）

## lua-nginx-module--ngx_http_lua_module--header_filter_by_lua

- 语法（`header_filter_by_lua <lua-script-str>;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；处理函数取 value[1] 作为Lua 源码字符串（空串或重复设置报错），与语法一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, configuration-definition, summary-init-lmcf
  - 判据：阶段：响应头过滤；入口：ngx_http_lua_header_filter（module.c 847-852 接入 ngx_http_top_header_filter 链）；header_filter_inline 加载字符串并运行（headerfilterby.c）。处理函数（配置定义片段）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：summary-init-lmcf（lua-nginx-module/src/ngx_http_lua_module.c:769-769）

## lua-nginx-module--ngx_http_lua_module--header_filter_by_lua_block

- 语法（`header_filter_by_lua_block { lua-script }`）：verified；source_ids：registration, configuration-definition, implementation-1
  - 判据：注册为 NGX_CONF_BLOCK|NGX_CONF_NOARGS；包装函数把 cf->handler 设为 ngx_http_lua_header_filter_by_lua，conf_lua_block_parse 按花括号层级读入块内文本作为单个参数交给该处理函数，无前置参数。
- 功能：verified；source_ids：implementation-2, implementation-3, implementation-4, implementation-5, implementation-0, summary-init-lmcf
  - 判据：阶段：响应头过滤；入口：ngx_http_lua_header_filter；块内代码经 header_filter_inline 加载运行。处理函数（块包装转交的 by_lua 处理函数）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：summary-init-lmcf（lua-nginx-module/src/ngx_http_lua_module.c:769-769）

## lua-nginx-module--ngx_http_lua_module--header_filter_by_lua_file

- 语法（`header_filter_by_lua_file <path-to-lua-script-file>;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；处理函数取 value[1] 作为Lua 文件路径（空串或重复设置报错），与语法一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, configuration-definition, summary-init-lmcf
  - 判据：阶段：响应头过滤；入口：ngx_http_lua_header_filter；header_filter_file 加载文件并运行（headerfilterby.c 186-225）。处理函数（配置定义片段）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：summary-init-lmcf（lua-nginx-module/src/ngx_http_lua_module.c:769-769）

## lua-nginx-module--ngx_http_lua_module--body_filter_by_lua

- 语法（`body_filter_by_lua <lua-script-str>;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；处理函数取 value[1] 作为Lua 源码字符串（空串或重复设置报错），与语法一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-3, implementation-4, configuration-definition, summary-init-lmcf
  - 判据：阶段：响应体过滤；入口：ngx_http_lua_body_filter（module.c 854-859 接入 ngx_http_top_body_filter 链）；body_filter_inline 加载字符串；body_filter 对每个输出 chain 调用 Lua（bodyfilterby.c 230-395）。处理函数（配置定义片段）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：summary-init-lmcf（lua-nginx-module/src/ngx_http_lua_module.c:769-769）

## lua-nginx-module--ngx_http_lua_module--body_filter_by_lua_block

- 语法（`body_filter_by_lua_block { lua-script-str }`）：verified；source_ids：registration, configuration-definition, implementation-1
  - 判据：注册为 NGX_CONF_BLOCK|NGX_CONF_NOARGS；包装函数把 cf->handler 设为 ngx_http_lua_body_filter_by_lua，conf_lua_block_parse 按花括号层级读入块内文本作为单个参数交给该处理函数，无前置参数。
- 功能：verified；source_ids：implementation-2, implementation-3, implementation-5, implementation-6, implementation-0, summary-init-lmcf
  - 判据：阶段：响应体过滤；入口：ngx_http_lua_body_filter；块内代码经 body_filter_inline 加载；body_filter 对每个输出 chain 调用 Lua。处理函数（块包装转交的 by_lua 处理函数）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：summary-init-lmcf（lua-nginx-module/src/ngx_http_lua_module.c:769-769）

## lua-nginx-module--ngx_http_lua_module--body_filter_by_lua_file

- 语法（`body_filter_by_lua_file <path-to-lua-script-file>;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；处理函数取 value[1] 作为Lua 文件路径（空串或重复设置报错），与语法一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-3, implementation-4, configuration-definition, summary-init-lmcf
  - 判据：阶段：响应体过滤；入口：ngx_http_lua_body_filter；body_filter_file 加载文件；body_filter 对每个输出 chain 调用 Lua（bodyfilterby.c 182-395）。处理函数（配置定义片段）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 新增片段：summary-init-lmcf（lua-nginx-module/src/ngx_http_lua_module.c:769-769）

## lua-nginx-module--ngx_http_lua_module--balancer_by_lua_block

- 语法（`balancer_by_lua_block { lua-script }`）：verified；source_ids：registration, configuration-definition, implementation-1
  - 判据：注册为 NGX_CONF_BLOCK|NGX_CONF_NOARGS（仅 upstream 上下文）；包装函数把 cf->handler 设为 ngx_http_lua_balancer_by_lua，块文本作为单个参数交给它，无前置参数。
- 功能：verified；source_ids：implementation-0, implementation-2, implementation-3, implementation-4, implementation-6
  - 判据：阶段：upstream peer 选择；入口：ngx_http_lua_balancer_init 接管 us->peer.init，init_peer/get_peer 回调（balancer.c 286-519）在取 peer 时运行 Lua（nginx upstream 1553-1576 调用 peer.get）；块内代码经 balancer_handler_inline 加载并运行。处理函数（块包装转交的 by_lua 处理函数）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。

## lua-nginx-module--ngx_http_lua_module--balancer_by_lua_file

- 语法（`balancer_by_lua_file <path-to-lua-script-file>;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；处理函数取 value[1] 作为Lua 文件路径（空串或重复设置报错），与语法一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, implementation-4, configuration-definition
  - 判据：阶段：upstream peer 选择；入口：ngx_http_lua_balancer_init 接管 us->peer.init，init_peer/get_peer 回调（balancer.c 286-519）在取 peer 时运行 Lua（nginx upstream 1553-1576 调用 peer.get）；balancer_handler_file（balancer.c 104-122）加载文件并运行。处理函数（配置定义片段）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。

## lua-nginx-module--ngx_http_lua_module--balancer_keepalive

- 语法（`balancer_keepalive total-connections;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；处理函数取 value[1] 经 ngx_atoi 解析为 max_cached，非数字或 0 报错、重复设置报 is duplicate，对应 total-connections 参数。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2
  - 判据：max_cached 缺省 32，balancer_init 据此分配 max_cached 个 keepalive 缓存项到 free 队列并建立哈希桶（balancer.c 286-340，在配置内存池内，worker 进程各持有一份）；enable_keepalive 与 free_peer 把空闲连接存入该缓存（1020-1063、576-740），故 max_cached 即该 upstream 的空闲连接缓存容量。“每个 worker”指进程内：计数/缓存位于配置内存池或 lmcf 的普通变量，未使用共享内存，fork 后各 worker 各持一份。

## lua-nginx-module--ngx_http_lua_module--lua_socket_keepalive_timeout

- 语法（`lua_socket_keepalive_timeout time;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_msec_slot 用 ngx_parse_time 解析，对应 time 参数。
- 功能：verified；source_ids：implementation-0, implementation-1
  - 判据：tcpsock:setkeepalive 在未传 timeout 参数（n<2 或 nil）时取 llcf->keepalive_timeout 作为连接放入连接池的空闲超时（socket_tcp.c 5396-5408）。

## lua-nginx-module--ngx_http_lua_module--lua_socket_connect_timeout

- 语法（`lua_socket_connect_timeout time;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_msec_slot 用 ngx_parse_time 解析，对应 time 参数。
- 功能：verified；source_ids：df340-lua-h-lua_socket_connect_timeout-consume, summary-unix-branch, summary-connect-timer, summary-conf-assign, summary-conf-llcf-get
  - 判据：tcpsock:connect 同时处理 host:port 与 "unix:" 前缀（unix-branch），随后在建立 upstream 状态时若 connect 未给出超时则取 u->conf->connect_timeout（llcf），并以 ngx_add_timer(c->write, u->connect_timeout) 设为连接超时。u->conf 在创建 upstream 状态时被赋为本 location 的 llcf（socket_tcp.c 1121 `u->conf = llcf`），故 u->conf->字段即本指令的值。llcf 取自 ngx_http_get_module_loc_conf（socket_tcp.c 938），与 1121 行 `u->conf = llcf` 同在 ngx_http_lua_socket_tcp_connect 中，两行缺一即缺环。
- 新增片段：summary-conf-assign（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:1115-1125）；summary-conf-llcf-get（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:938-938）；summary-connect-timer（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:1560-1563）；summary-unix-branch（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:1044-1052）

## lua-nginx-module--ngx_http_lua_module--lua_socket_send_timeout

- 语法（`lua_socket_send_timeout time;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_msec_slot 用 ngx_parse_time 解析，对应 time 参数。
- 功能：verified；source_ids：df340-lua-h-lua_socket_send_timeout-consume, summary-unix-branch, summary-send-timer, summary-conf-assign, summary-conf-llcf-get
  - 判据：tcpsock:connect 同时处理 host:port 与 "unix:" 前缀（unix-branch），建立 upstream 状态时若未设置 send_timeout 则取 u->conf->send_timeout（llcf）；发送路径以 ngx_add_timer(c->write, u->send_timeout) 使用该值。u->conf 在创建 upstream 状态时被赋为本 location 的 llcf（socket_tcp.c 1121 `u->conf = llcf`），故 u->conf->字段即本指令的值。llcf 取自 ngx_http_get_module_loc_conf（socket_tcp.c 938），与 1121 行 `u->conf = llcf` 同在 ngx_http_lua_socket_tcp_connect 中，两行缺一即缺环。
- 新增片段：summary-conf-assign（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:1115-1125）；summary-conf-llcf-get（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:938-938）；summary-send-timer（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:3587-3587）；summary-unix-branch（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:1044-1052）

## lua-nginx-module--ngx_http_lua_module--lua_socket_send_lowat

- 语法（`lua_socket_send_lowat size;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_size_slot 用 ngx_parse_size 解析，对应 size 参数。注册另带 ngx_http_lua_lowat_post 校验回调（lowat_check），不改变参数个数。
- 功能：verified；source_ids：implementation-1, implementation-2, summary-conf-assign, summary-conf-llcf-get
  - 判据：发送路径 ngx_handle_write_event(c->write, u->conf->send_lowat) 把该值作为写事件的低水位；lowat_check 在不支持 SO_SNDLOWAT 的平台警告并置 0。u->conf 在创建 upstream 状态时被赋为本 location 的 llcf（socket_tcp.c 1121 `u->conf = llcf`），故 u->conf->字段即本指令的值。llcf 取自 ngx_http_get_module_loc_conf（socket_tcp.c 938），与 1121 行 `u->conf = llcf` 同在 ngx_http_lua_socket_tcp_connect 中，两行缺一即缺环。
- 新增片段：summary-conf-assign（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:1115-1125）；summary-conf-llcf-get（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:938-938）

## lua-nginx-module--ngx_http_lua_module--lua_socket_buffer_size

- 语法（`lua_socket_buffer_size size;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_size_slot 用 ngx_parse_size 解析，对应 size 参数。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, summary-conf-assign, summary-conf-llcf-get
  - 判据：receive 路径（socket_tcp.c 2165-2175）、读缓冲扩展（6006-6018）与 receiveuntil 缓冲（6060-6075）均以 u->conf->buffer_size 作为接收缓冲块大小（prefix 更大时取 prefix）。u->conf 在创建 upstream 状态时被赋为本 location 的 llcf（socket_tcp.c 1121 `u->conf = llcf`），故 u->conf->字段即本指令的值。llcf 取自 ngx_http_get_module_loc_conf（socket_tcp.c 938），与 1121 行 `u->conf = llcf` 同在 ngx_http_lua_socket_tcp_connect 中，两行缺一即缺环。
- 新增片段：summary-conf-assign（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:1115-1125）；summary-conf-llcf-get（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:938-938）

## lua-nginx-module--ngx_http_lua_module--lua_socket_pool_size

- 语法（`lua_socket_pool_size size;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_num_slot 按整数解析（失败报错），对应单个数值参数。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2
  - 判据：tcpsock:connect 的选项 table 未给出 pool_size 时用 llcf->pool_size（socket_tcp.c 934-980），setkeepalive 在 n<3 时取 llcf->pool_size（5396-5408），作为连接池缓存连接数。

## lua-nginx-module--ngx_http_lua_module--lua_socket_read_timeout

- 语法（`lua_socket_read_timeout time;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_msec_slot 用 ngx_parse_time 解析，对应 time 参数。
- 功能：verified；source_ids：df340-lua-h-lua_socket_read_timeout-consume, summary-read-timer, summary-receive-entry, summary-receive-read, summary-receiveuntil-read, summary-conf-assign, summary-conf-llcf-get
  - 判据：tcpsock:connect 建立 upstream 状态时未设置 read_timeout 则取 u->conf->read_timeout；socket_tcp_read 在 rev->active 时 ngx_add_timer(rev, u->read_timeout)；receive 经 receive_helper 调用 socket_tcp_read，receiveuntil 的迭代器直接调用 socket_tcp_read。u->conf 在创建 upstream 状态时被赋为本 location 的 llcf（socket_tcp.c 1121 `u->conf = llcf`），故 u->conf->字段即本指令的值。llcf 取自 ngx_http_get_module_loc_conf（socket_tcp.c 938），与 1121 行 `u->conf = llcf` 同在 ngx_http_lua_socket_tcp_connect 中，两行缺一即缺环。
- 新增片段：summary-conf-assign（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:1115-1125）；summary-conf-llcf-get（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:938-938）；summary-read-timer（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:2874-2876）；summary-receive-entry（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:2436-2437）；summary-receive-read（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:2192-2194）；summary-receiveuntil-read（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:4672-4674）

## lua-nginx-module--ngx_http_lua_module--lua_http10_buffering

- 语法（`lua_http10_buffering on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG（1 个参数），ngx_conf_set_flag_slot 仅接受 on/off，与 on | off 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3
  - 判据：llcf->http10_buffering 为真且 HTTP 版本 <1.1、头未发送、content_length 未知时设 ctx->buffering=1（util.c 580-595）；缓冲时输出追加到 ctx->out（662-693），发送头时按 ctx->out 总大小写 content_length（742-778）。

## lua-nginx-module--ngx_http_lua_module--lua_check_client_abort

- 语法（`lua_check_client_abort on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG（1 个参数），ngx_conf_set_flag_slot 仅接受 on/off，与 on | off 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3
  - 判据：content 阶段在该值为真时把 read_event_handler 设为 ngx_http_lua_rd_check_broken_connection 并启用读事件，否则为 ngx_http_block_reading（contentby.c 97-126）；cosocket 的 raw/body downstream 读写路径也按该值处理（socket_tcp.c），检测到断开时触发 on_abort 或终止请求（util.c 3512-3577）。

## lua-nginx-module--ngx_http_lua_module--lua_use_default_type

- 语法（`lua_use_default_type on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG（1 个参数），ngx_conf_set_flag_slot 仅接受 on/off，与 on | off 一致。
- 功能：verified；source_ids：implementation-0
  - 判据：ngx_http_lua_set_content_type 在 llcf->use_default_type 为真且状态不是 304 时调用 ngx_http_set_content_type 推导类型，否则直接返回 OK（util.h 450-468）。

## lua-nginx-module--ngx_http_lua_module--lua_ssl_protocols

- 语法（`lua_ssl_protocols [SSLv2] [SSLv3] [TLSv1] [TLSv1.1] [TLSv1.2] [TLSv1.3];`）：verified；source_ids：registration, configuration-definition, implementation-0
  - 判据：注册为 NGX_CONF_1MORE，post 指向 ngx_http_lua_ssl_protocols 取值表（SSLv2/SSLv3/TLSv1/TLSv1.1/TLSv1.2，TLSv1.3 视 NGX_SSL_TLSv1_3 而定），bitmask setter 逐项匹配，与语法一致。
- 功能：verified；source_ids：implementation-1, implementation-3, implementation-4, summary-ssl-merge-call, summary-conf-assign, summary-ssl-protocols-apply, summary-conf-llcf-get
  - 判据：ngx_http_lua_set_ssl 调用 ngx_ssl_create(llcf->ssl, llcf->ssl_protocols, NULL) 创建上下文（module.c 1657）；cosocket 连接前由 ngx_http_lua_set_ssl 在合并阶段创建 SSL 上下文（module.c 1585-1725），连接时 ngx_ssl_create_connection(u->conf->ssl, …)（socket_tcp.c 1689）使用。链路：merge_loc_conf 合并本指令值并调用 ngx_http_lua_set_ssl（module.c 1508-1543）；连接时 u->conf 即 llcf（socket_tcp.c 1121），再用 u->conf->ssl 建立 SSL 连接。ngx_ssl_create 对未在 protocols 位掩码中的 SSLv2/SSLv3/TLSv1/1.1/1.2/1.3 逐个设置 SSL_OP_NO_* 选项（event_openssl.c 363-389），即限定可用协议版本。llcf 取自 ngx_http_get_module_loc_conf（socket_tcp.c 938），与 1121 行 `u->conf = llcf` 同在 ngx_http_lua_socket_tcp_connect 中，两行缺一即缺环。
- 新增片段：summary-conf-assign（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:1115-1125）；summary-conf-llcf-get（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:938-938）；summary-ssl-merge-call（lua-nginx-module/src/ngx_http_lua_module.c:1508-1543）；summary-ssl-protocols-apply（nginx/src/event/ngx_event_openssl.c:363-389）

## lua-nginx-module--ngx_http_lua_module--lua_ssl_ciphers

- 语法（`lua_ssl_ciphers ciphers;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_str_slot 取 value[1] 作为字符串。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, summary-ssl-merge-call, summary-conf-assign, summary-conf-llcf-get
  - 判据：ngx_http_lua_set_ssl 对 SSL 上下文调用 SSL_CTX_set_cipher_list(llcf->ssl_ciphers)（module.c 1670）；cosocket 连接前由 ngx_http_lua_set_ssl 在合并阶段创建 SSL 上下文（module.c 1585-1725），连接时 ngx_ssl_create_connection(u->conf->ssl, …)（socket_tcp.c 1689）使用。链路：merge_loc_conf 合并本指令值并调用 ngx_http_lua_set_ssl（module.c 1508-1543）；连接时 u->conf 即 llcf（socket_tcp.c 1121），再用 u->conf->ssl 建立 SSL 连接。llcf 取自 ngx_http_get_module_loc_conf（socket_tcp.c 938），与 1121 行 `u->conf = llcf` 同在 ngx_http_lua_socket_tcp_connect 中，两行缺一即缺环。
- 新增片段：summary-conf-assign（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:1115-1125）；summary-conf-llcf-get（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:938-938）；summary-ssl-merge-call（lua-nginx-module/src/ngx_http_lua_module.c:1508-1543）

## lua-nginx-module--ngx_http_lua_module--ssl_client_hello_by_lua_block

- 语法（`ssl_client_hello_by_lua_block { lua-script }`）：verified；source_ids：registration, configuration-definition, implementation-1
  - 判据：注册为 NGX_CONF_BLOCK|NGX_CONF_NOARGS；包装函数把 cf->handler 设为 ngx_http_lua_ssl_client_hello_by_lua，块文本作为单个参数交给它，无前置参数。
- 功能：verified；source_ids：implementation-2, implementation-3, implementation-4, implementation-0
  - 判据：阶段：下游 TLS 握手 ClientHello 回调；入口：module.c 合并 server 配置时若源码非空即 SSL_CTX_set_client_hello_cb(ngx_http_lua_ssl_client_hello_handler) 注册到 ngx_http_ssl_module 的 SSL_CTX（1233-1360）；块内代码经 client_hello_handler_inline 加载运行（ssl_client_helloby.c 53-357）；OpenSSL 过旧或 LibreSSL 时配置报错。处理函数（块包装转交的 by_lua 处理函数）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。

## lua-nginx-module--ngx_http_lua_module--ssl_client_hello_by_lua_file

- 语法（`ssl_client_hello_by_lua_file <path-to-lua-script-file>;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；处理函数取 value[1] 作为Lua 文件路径（空串或重复设置报错），与语法一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, configuration-definition
  - 判据：阶段：下游 TLS 握手 ClientHello 回调；入口：module.c 合并 server 配置时若源码非空即 SSL_CTX_set_client_hello_cb(ngx_http_lua_ssl_client_hello_handler) 注册到 ngx_http_ssl_module 的 SSL_CTX（1233-1360）；client_hello_handler_file 加载文件运行（ssl_client_helloby.c 32-357）。处理函数（配置定义片段）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。

## lua-nginx-module--ngx_http_lua_module--ssl_certificate_by_lua_block

- 语法（`ssl_certificate_by_lua_block { lua-script }`）：verified；source_ids：registration, configuration-definition, implementation-1
  - 判据：注册为 NGX_CONF_BLOCK|NGX_CONF_NOARGS；包装函数把 cf->handler 设为 ngx_http_lua_ssl_cert_by_lua，块文本作为单个参数交给它，无前置参数。
- 功能：verified；source_ids：implementation-2, implementation-3, implementation-4, implementation-0
  - 判据：阶段：下游 TLS 握手 证书回调；入口：module.c 合并 server 配置时若源码非空即 SSL_CTX_set_cert_cb(ngx_http_lua_ssl_cert_handler) 注册到 ngx_http_ssl_module 的 SSL_CTX（1233-1360）；块内代码经 ssl_cert_handler_inline 加载运行（ssl_certby.c 62-362）。处理函数（块包装转交的 by_lua 处理函数）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 修正（summary）：下游TLS握手证书回调中运行Lua，执行配置块中的Lua代码。 —— 理由：源码只证明代码挂在 SSL_CTX_set_cert_cb 证书回调上；“完整握手”的限定取决于 OpenSSL 对 cert_cb 的调用语义，片段无直接支撑，故删去“完整”。

## lua-nginx-module--ngx_http_lua_module--ssl_certificate_by_lua_file

- 语法（`ssl_certificate_by_lua_file <path-to-lua-script-file>;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；处理函数取 value[1] 作为Lua 文件路径（空串或重复设置报错），与语法一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, configuration-definition
  - 判据：阶段：下游 TLS 握手 证书回调；入口：module.c 合并 server 配置时若源码非空即 SSL_CTX_set_cert_cb(ngx_http_lua_ssl_cert_handler) 注册到 ngx_http_ssl_module 的 SSL_CTX（1233-1360）；ssl_cert_handler_file 加载文件运行（ssl_certby.c 41-362）。处理函数（配置定义片段）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。
- 修正（summary）：下游TLS握手证书回调中运行Lua，从外部Lua文件加载。 —— 理由：同 ssl_certificate_by_lua_block：源码只证明挂在 SSL_CTX_set_cert_cb 上，“完整握手”限定无直接支撑。

## lua-nginx-module--ngx_http_lua_module--ssl_session_store_by_lua_block

- 语法（`ssl_session_store_by_lua_block { lua-script }`）：verified；source_ids：registration, configuration-definition, implementation-1
  - 判据：注册为 NGX_CONF_BLOCK|NGX_CONF_NOARGS（仅 http 上下文）；包装函数把 cf->handler 设为 ngx_http_lua_ssl_sess_store_by_lua，块文本作为单个参数交给它，无前置参数。
- 功能：verified；source_ids：implementation-2, implementation-3, implementation-4, implementation-5, implementation-0
  - 判据：阶段：下游 TLS 握手 新会话回调；入口：module.c 合并 server 配置时若源码非空即 SSL_CTX_sess_set_new_cb(ngx_http_lua_ssl_sess_store_handler) 注册到 ngx_http_ssl_module 的 SSL_CTX（1233-1360）；块内代码经 ssl_sess_store_handler_inline 加载运行（ssl_session_storeby.c 56-418）。处理函数（块包装转交的 by_lua 处理函数）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。

## lua-nginx-module--ngx_http_lua_module--ssl_session_store_by_lua_file

- 语法（`ssl_session_store_by_lua_file <path-to-lua-script-file>;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；处理函数取 value[1] 作为Lua 文件路径（空串或重复设置报错），与语法一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, configuration-definition
  - 判据：阶段：下游 TLS 握手 新会话回调；入口：module.c 合并 server 配置时若源码非空即 SSL_CTX_sess_set_new_cb(ngx_http_lua_ssl_sess_store_handler) 注册到 ngx_http_ssl_module 的 SSL_CTX（1233-1360）；ssl_sess_store_handler_file 加载文件运行（ssl_session_storeby.c 34-418）。处理函数（配置定义片段）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。

## lua-nginx-module--ngx_http_lua_module--ssl_session_fetch_by_lua_block

- 语法（`ssl_session_fetch_by_lua_block { lua-script }`）：verified；source_ids：registration, configuration-definition, implementation-1
  - 判据：注册为 NGX_CONF_BLOCK|NGX_CONF_NOARGS（仅 http 上下文）；包装函数把 cf->handler 设为 ngx_http_lua_ssl_sess_fetch_by_lua，块文本作为单个参数交给它，无前置参数。
- 功能：verified；source_ids：implementation-2, implementation-3, implementation-4, implementation-0
  - 判据：阶段：下游 TLS 握手 会话恢复查找回调；入口：module.c 合并 server 配置时若源码非空即 SSL_CTX_sess_set_get_cb(ngx_http_lua_ssl_sess_fetch_handler) 注册到 ngx_http_ssl_module 的 SSL_CTX（1233-1360）；块内代码经 ssl_sess_fetch_handler_inline 加载运行（ssl_session_fetchby.c 58-383）。处理函数（块包装转交的 by_lua 处理函数）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。

## lua-nginx-module--ngx_http_lua_module--ssl_session_fetch_by_lua_file

- 语法（`ssl_session_fetch_by_lua_file <path-to-lua-script-file>;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；处理函数取 value[1] 作为Lua 文件路径（空串或重复设置报错），与语法一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, configuration-definition
  - 判据：阶段：下游 TLS 握手 会话恢复查找回调；入口：module.c 合并 server 配置时若源码非空即 SSL_CTX_sess_set_get_cb(ngx_http_lua_ssl_sess_fetch_handler) 注册到 ngx_http_ssl_module 的 SSL_CTX（1233-1360）；ssl_sess_fetch_handler_file 加载文件运行（ssl_session_fetchby.c 36-383）。处理函数（配置定义片段）把脚本源码/处理函数指针写入配置并置位 requires_*/handler 字段，是后续阶段挂接的前提。

## lua-nginx-module--ngx_http_lua_module--lua_ssl_verify_depth

- 语法（`lua_ssl_verify_depth number;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_num_slot 按整数解析（失败报错），对应单个数值参数。
- 功能：verified；source_ids：implementation-0, implementation-1, summary-ssl-merge-call, summary-conf-assign, summary-conf-llcf-get
  - 判据：ngx_http_lua_set_ssl 在 lua_ssl_trusted_certificate 非空时把 llcf->ssl_verify_depth 传给 ngx_ssl_trusted_certificate（module.c 1690-1697），nginx 据此设置验证深度（event_openssl.c 950-961）；该值仅在配置了 trusted_certificate 时生效。链路：merge_loc_conf 合并本指令值并调用 ngx_http_lua_set_ssl（module.c 1508-1543）；连接时 u->conf 即 llcf（socket_tcp.c 1121），再用 u->conf->ssl 建立 SSL 连接。llcf 取自 ngx_http_get_module_loc_conf（socket_tcp.c 938），与 1121 行 `u->conf = llcf` 同在 ngx_http_lua_socket_tcp_connect 中，两行缺一即缺环。
- 新增片段：summary-conf-assign（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:1115-1125）；summary-conf-llcf-get（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:938-938）；summary-ssl-merge-call（lua-nginx-module/src/ngx_http_lua_module.c:1508-1543）

## lua-nginx-module--ngx_http_lua_module--lua_ssl_certificate

- 语法（`lua_ssl_certificate file;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_str_array_slot 把参数追加到字符串数组，对应单个 file 参数。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, summary-ssl-merge-call, summary-conf-assign, summary-conf-llcf-get
  - 判据：ngx_http_lua_set_ssl 在 ssl_certificates 非空时校验与 certificate_key 数量一致并调用 ngx_ssl_certificates，加载 PEM 证书链到 SSL 上下文（module.c 1643-1688，event_openssl.c 434-481）；cosocket 连接前由 ngx_http_lua_set_ssl 在合并阶段创建 SSL 上下文（module.c 1585-1725），连接时 ngx_ssl_create_connection(u->conf->ssl, …)（socket_tcp.c 1689）使用。链路：merge_loc_conf 合并本指令值并调用 ngx_http_lua_set_ssl（module.c 1508-1543）；连接时 u->conf 即 llcf（socket_tcp.c 1121），再用 u->conf->ssl 建立 SSL 连接。llcf 取自 ngx_http_get_module_loc_conf（socket_tcp.c 938），与 1121 行 `u->conf = llcf` 同在 ngx_http_lua_socket_tcp_connect 中，两行缺一即缺环。
- 新增片段：summary-conf-assign（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:1115-1125）；summary-conf-llcf-get（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:938-938）；summary-ssl-merge-call（lua-nginx-module/src/ngx_http_lua_module.c:1508-1543）

## lua-nginx-module--ngx_http_lua_module--lua_ssl_certificate_key

- 语法（`lua_ssl_certificate_key file;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_str_array_slot 把参数追加到字符串数组，对应单个 file 参数。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, summary-ssl-merge-call, summary-conf-assign, summary-conf-llcf-get
  - 判据：ngx_http_lua_set_ssl 把 ssl_certificate_keys 与证书一同交给 ngx_ssl_certificates，nginx 加载对应私钥（event_openssl.c 553-574、738-852）；cosocket 连接前由 ngx_http_lua_set_ssl 在合并阶段创建 SSL 上下文（module.c 1585-1725），连接时 ngx_ssl_create_connection(u->conf->ssl, …)（socket_tcp.c 1689）使用。链路：merge_loc_conf 合并本指令值并调用 ngx_http_lua_set_ssl（module.c 1508-1543）；连接时 u->conf 即 llcf（socket_tcp.c 1121），再用 u->conf->ssl 建立 SSL 连接。llcf 取自 ngx_http_get_module_loc_conf（socket_tcp.c 938），与 1121 行 `u->conf = llcf` 同在 ngx_http_lua_socket_tcp_connect 中，两行缺一即缺环。
- 新增片段：summary-conf-assign（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:1115-1125）；summary-conf-llcf-get（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:938-938）；summary-ssl-merge-call（lua-nginx-module/src/ngx_http_lua_module.c:1508-1543）

## lua-nginx-module--ngx_http_lua_module--lua_ssl_trusted_certificate

- 语法（`lua_ssl_trusted_certificate file;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_str_slot 取 value[1] 作为字符串。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-3, summary-ssl-merge-call, summary-conf-assign, summary-conf-llcf-get
  - 判据：ngx_http_lua_set_ssl 在 ssl_trusted_certificate 非空时调用 ngx_ssl_trusted_certificate，加载 CA 文件到验证存储（event_openssl.c 950-984）；cosocket 校验（socket_tcp.c 1920-1953）用 ssl_verify 检查结果。链路：merge_loc_conf 合并本指令值并调用 ngx_http_lua_set_ssl（module.c 1508-1543）；连接时 u->conf 即 llcf（socket_tcp.c 1121），再用 u->conf->ssl 建立 SSL 连接。llcf 取自 ngx_http_get_module_loc_conf（socket_tcp.c 938），与 1121 行 `u->conf = llcf` 同在 ngx_http_lua_socket_tcp_connect 中，两行缺一即缺环。
- 新增片段：summary-conf-assign（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:1115-1125）；summary-conf-llcf-get（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:938-938）；summary-ssl-merge-call（lua-nginx-module/src/ngx_http_lua_module.c:1508-1543）

## lua-nginx-module--ngx_http_lua_module--lua_ssl_crl

- 语法（`lua_ssl_crl file;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_str_slot 取 value[1] 作为字符串。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-3, summary-ssl-merge-call, summary-conf-assign, summary-conf-llcf-get
  - 判据：ngx_http_lua_set_ssl 调用 ngx_ssl_crl(llcf->ssl_crl)，nginx 在路径非空时加载 CRL 到验证存储（event_openssl.c 987-1029，空路径直接返回）；cosocket 握手后校验证书结果（socket_tcp.c 1920-1953）。链路：merge_loc_conf 合并本指令值并调用 ngx_http_lua_set_ssl（module.c 1508-1543）；连接时 u->conf 即 llcf（socket_tcp.c 1121），再用 u->conf->ssl 建立 SSL 连接。llcf 取自 ngx_http_get_module_loc_conf（socket_tcp.c 938），与 1121 行 `u->conf = llcf` 同在 ngx_http_lua_socket_tcp_connect 中，两行缺一即缺环。
- 新增片段：summary-conf-assign（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:1115-1125）；summary-conf-llcf-get（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:938-938）；summary-ssl-merge-call（lua-nginx-module/src/ngx_http_lua_module.c:1508-1543）

## lua-nginx-module--ngx_http_lua_module--lua_ssl_conf_command

- 语法（`lua_ssl_conf_command name value;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE2，ngx_conf_set_keyval_slot 取 name、value 两个参数，与语法一致。注册另带 ssl_conf_command_check 校验回调，不改变参数个数。
- 功能：verified；source_ids：implementation-1, implementation-2, implementation-3, summary-ssl-merge-call, summary-conf-assign, summary-conf-llcf-get
  - 判据：ngx_http_lua_set_ssl 在 ssl_certificates、trusted_certificate、crl 处理之后调用 ngx_ssl_conf_commands(llcf->ssl_conf_commands)，由 nginx 经 SSL_CONF_cmd 执行 name value（event_openssl.c 1595-1664）。链路：merge_loc_conf 合并本指令值并调用 ngx_http_lua_set_ssl（module.c 1508-1543）；连接时 u->conf 即 llcf（socket_tcp.c 1121），再用 u->conf->ssl 建立 SSL 连接。llcf 取自 ngx_http_get_module_loc_conf（socket_tcp.c 938），与 1121 行 `u->conf = llcf` 同在 ngx_http_lua_socket_tcp_connect 中，两行缺一即缺环。
- 新增片段：summary-conf-assign（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:1115-1125）；summary-conf-llcf-get（lua-nginx-module/src/ngx_http_lua_socket_tcp.c:938-938）；summary-ssl-merge-call（lua-nginx-module/src/ngx_http_lua_module.c:1508-1543）

## lua-nginx-module--ngx_http_lua_module--lua_malloc_trim

- 语法（`lua_malloc_trim request-count;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；处理函数取 value[1] 经 ngx_atoi 解析为请求数（非数字报错），0 表示关闭，对应 request-count 参数。
- 功能：verified；source_ids：implementation-0, implementation-1, configuration-definition, summary-init-lmcf
  - 判据：非 0 时置 requires_log，module.c 把 ngx_http_lua_log_handler 挂入 log 阶段；该 handler 每个请求使 malloc_trim_req_count++，达到 malloc_trim_cycle 后清零并调用 malloc_trim(1)（logby.c 66-108，需 NGX_HTTP_LUA_HAVE_MALLOC_TRIM）。处理函数 ngx_http_lua_malloc_trim（module.c 1731 起）把请求数写入 lmcf->malloc_trim_cycle，非 0 时置 lmcf->requires_log=1。
- 新增片段：summary-init-lmcf（lua-nginx-module/src/ngx_http_lua_module.c:769-769）

## lua-nginx-module--ngx_http_lua_module--lua_worker_thread_vm_pool_size

- 语法（`lua_worker_thread_vm_pool_size size;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_num_slot 按整数解析（失败报错），对应单个数值参数。
- 功能：verified；source_ids：implementation-0, implementation-1, summary-free-task-ctx
  - 判据：ngx_http_lua_get_task_ctx 在空闲 ctx 池为空时，若 worker_thread_vm_count >= lmcf->worker_thread_vm_pool_size 返回 NULL，否则 luaL_newstate 创建新 VM 并计数；使用后的 ctx 回到池中复用（worker_thread.c 98-180，NGX_THREADS 条件）。ngx_http_lua_free_task_ctx 把 ctx 放回 ctxpool（worker_thread.c 194-200），随后可被 get_task_ctx 复用。
- 新增片段：summary-free-task-ctx（lua-nginx-module/src/ngx_http_lua_worker_thread.c:194-200）
