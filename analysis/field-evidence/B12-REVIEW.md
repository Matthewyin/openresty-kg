# B12 审核（lua-nginx-module，79 条）

审核方式：对 79 条的 syntax 与 summary 逐条核对；新增 evidence 按 `project.config.json` 固定 revision（lua-nginx-module `ea09d92a…`、nginx、lua-resty-core `2da3d771…`）经 `git show` 按行号取回，已有来源取自基线发布的 `directives/<id>.json`。所有 `source_ids` 均可解析（脚本核对，无缺失）；注册标志与 `configuration-definition` 的 setter 类型逐条对应。判据按 batch-brief「结论」：推断、调用链缺一环不算直接支撑。

## 结论：有退回（17 条，共 17 个字段）

## 总表

| # | ID（模块 ngx_http_lua_module 前缀省略） | syntax | summary | 退回原因 / 备注 |
|---|---|---|---|---|
| 1 | `lua_load_resty_core` | 通过（复审2 ADDRESSED，已晋级） | 通过 | 语法 unverified 缺口属实（处理函数不解析参数） |
| 2 | `lua_thread_cache_max_entries` | 通过 | 通过 |  |
| 3 | `lua_max_running_timers` | 通过 | 通过（复审1 ADDRESSED） | 功能：“同时处于运行状态”需要递减点：running_timers-- 在 util.c 1085-1100（仅 fake 请求且 context==TIMER 时），未引用，现有片段只证明递增与比较 |
| 4 | `lua_max_pending_timers` | 通过 | 通过 |  |
| 5 | `lua_shared_dict` | 通过 | 通过 |  |
| 6 | `lua_capture_error_log` | 通过 | 通过 |  |
| 7 | `lua_sa_restart` | 通过 | 通过（复审1 ADDRESSED） | 功能：所引 initworkerby.c 78-82 无函数头，“worker 初始化”这一归属无片段支撑（需 24-30 行与 module-owner 的 init_process 注册） |
| 8 | `lua_regex_cache_max_entries` | 通过 | 通过 |  |
| 9 | `lua_regex_match_limit` | 通过 | 通过（复审1 ADDRESSED） | 功能：PCRE2 路径只证明对 ngx_regex_match_context 调用 pcre2_set_match_limit，未引该上下文在 pcre2_match/pcre2_dfa_match 的使用点（regex.c 734-741） |
| 10 | `lua_package_cpath` | 通过 | 通过 |  |
| 11 | `lua_package_path` | 通过 | 通过 |  |
| 12 | `lua_code_cache` | 通过 | 通过（复审1 ADDRESSED） | 功能：修正文字比片段更宽：“含各自的代码缓存表”需 init_registry（util.c 782-815 与 323 行调用）；“非 fake connection”需 fake 连接 fd=-1（util.c 3999），均未引 |
| 13 | `lua_need_request_body` | 通过 | 通过 |  |
| 14 | `lua_transform_underscores_in_response_headers` | 通过 | 通过 |  |
| 15 | `lua_socket_log_errors` | 通过 | 通过 |  |
| 16 | `init_by_lua_block` | 通过 | 通过 |  |
| 17 | `init_by_lua` | 通过 | 通过 |  |
| 18 | `init_by_lua_file` | 通过 | 通过 |  |
| 19 | `init_worker_by_lua_block` | 通过 | 通过 |  |
| 20 | `init_worker_by_lua` | 通过 | 通过 |  |
| 21 | `init_worker_by_lua_file` | 通过 | 通过 |  |
| 22 | `exit_worker_by_lua_block` | 通过 | 通过 |  |
| 23 | `exit_worker_by_lua_file` | 通过 | 通过 |  |
| 24 | `set_by_lua_block` | 通过（复审1 ADDRESSED） | 通过 | 语法：变量名“须以 $ 开头”仅见 note，所引片段（directive.c 285-338、registration、block parse）无此检查 |
| 25 | `set_by_lua` | 通过（复审1 ADDRESSED） | 通过 | 语法：同上 |
| 26 | `set_by_lua_file` | 通过（复审1 ADDRESSED） | 通过 | 语法：同上 |
| 27 | `server_rewrite_by_lua_block` | 通过 | 通过 |  |
| 28 | `server_rewrite_by_lua_file` | 通过 | 通过 |  |
| 29 | `rewrite_by_lua` | 通过 | 通过 |  |
| 30 | `rewrite_by_lua_block` | 通过 | 通过 |  |
| 31 | `access_by_lua` | 通过 | 通过 |  |
| 32 | `access_by_lua_block` | 通过 | 通过 |  |
| 33 | `content_by_lua` | 通过 | 通过 |  |
| 34 | `content_by_lua_block` | 通过 | 通过 |  |
| 35 | `log_by_lua` | 通过 | 通过 |  |
| 36 | `log_by_lua_block` | 通过 | 通过 |  |
| 37 | `rewrite_by_lua_file` | 通过 | 通过 |  |
| 38 | `rewrite_by_lua_no_postpone` | 通过 | 通过 |  |
| 39 | `access_by_lua_file` | 通过 | 通过 |  |
| 40 | `access_by_lua_no_postpone` | 通过 | 通过 |  |
| 41 | `content_by_lua_file` | 通过 | 通过 |  |
| 42 | `log_by_lua_file` | 通过 | 通过 |  |
| 43 | `header_filter_by_lua` | 通过 | 通过 |  |
| 44 | `header_filter_by_lua_block` | 通过 | 通过 |  |
| 45 | `header_filter_by_lua_file` | 通过 | 通过 |  |
| 46 | `body_filter_by_lua` | 通过 | 通过 |  |
| 47 | `body_filter_by_lua_block` | 通过 | 通过 |  |
| 48 | `body_filter_by_lua_file` | 通过 | 通过 |  |
| 49 | `balancer_by_lua_block` | 通过 | 通过（复审1 ADDRESSED） | 功能：note 称“nginx upstream 1553-1576 调用 peer.get”，但无任何 nginx 片段在 source_ids 中，nginx 取 peer 回调的调用点缺一环 |
| 50 | `balancer_by_lua_file` | 通过 | 通过（复审1 ADDRESSED） | 功能：同 balancer_by_lua_block |
| 51 | `balancer_keepalive` | 通过 | 通过 |  |
| 52 | `lua_socket_keepalive_timeout` | 通过 | 通过 |  |
| 53 | `lua_socket_connect_timeout` | 通过 | 通过（复审2 ADDRESSED） | 复审2：补 938 行 llcf 取值，闭环 |
| 54 | `lua_socket_send_timeout` | 通过 | 通过（复审2 ADDRESSED） | 复审2：补 938 行 llcf 取值，闭环 |
| 55 | `lua_socket_send_lowat` | 通过 | 通过（复审2 ADDRESSED） | 复审2：补 938 行 llcf 取值，闭环 |
| 56 | `lua_socket_buffer_size` | 通过 | 通过（复审2 ADDRESSED） | 复审2：补 938 行 llcf 取值，闭环 |
| 57 | `lua_socket_pool_size` | 通过 | 通过 |  |
| 58 | `lua_socket_read_timeout` | 通过 | 通过（复审2 ADDRESSED） | 复审2：补 938 行 llcf 取值，闭环 |
| 59 | `lua_http10_buffering` | 通过 | 通过 |  |
| 60 | `lua_check_client_abort` | 通过 | 通过 |  |
| 61 | `lua_use_default_type` | 通过 | 通过 |  |
| 62 | `lua_ssl_protocols` | 通过 | 通过（复审2 ADDRESSED） | 复审2：补 938 行 llcf 取值，闭环 |
| 63 | `lua_ssl_ciphers` | 通过 | 通过（复审2 ADDRESSED） | 复审2：补 938 行 llcf 取值，闭环 |
| 64 | `ssl_client_hello_by_lua_block` | 通过 | 通过 |  |
| 65 | `ssl_client_hello_by_lua_file` | 通过 | 通过 |  |
| 66 | `ssl_certificate_by_lua_block` | 通过 | 通过 | 修正（删“完整”）通过 |
| 67 | `ssl_certificate_by_lua_file` | 通过 | 通过 | 修正（删“完整”）通过 |
| 68 | `ssl_session_store_by_lua_block` | 通过 | 通过 |  |
| 69 | `ssl_session_store_by_lua_file` | 通过 | 通过 |  |
| 70 | `ssl_session_fetch_by_lua_block` | 通过 | 通过 |  |
| 71 | `ssl_session_fetch_by_lua_file` | 通过 | 通过 |  |
| 72 | `lua_ssl_verify_depth` | 通过 | 通过（复审2 ADDRESSED） | 复审2：补 938 行 llcf 取值，闭环 |
| 73 | `lua_ssl_certificate` | 通过 | 通过（复审2 ADDRESSED） | 复审2：补 938 行 llcf 取值，闭环 |
| 74 | `lua_ssl_certificate_key` | 通过 | 通过（复审2 ADDRESSED） | 复审2：补 938 行 llcf 取值，闭环 |
| 75 | `lua_ssl_trusted_certificate` | 通过 | 通过（复审2 ADDRESSED） | 复审2：补 938 行 llcf 取值，闭环 |
| 76 | `lua_ssl_crl` | 通过 | 通过（复审2 ADDRESSED） | 复审2：补 938 行 llcf 取值，闭环 |
| 77 | `lua_ssl_conf_command` | 通过 | 通过（复审2 ADDRESSED） | 复审2：补 938 行 llcf 取值，闭环 |
| 78 | `lua_malloc_trim` | 通过 | 通过（复审1 ADDRESSED） | 功能：“非 0 时置 requires_log、写入 malloc_trim_cycle”发生在 ngx_http_lua_malloc_trim 处理函数（module.c 1731 起），未列入 summary 的 source_ids |
| 79 | `lua_worker_thread_vm_pool_size` | 通过 | 通过（复审1 ADDRESSED） | 功能：“使用后的 ctx 回到池中复用”需 ngx_http_lua_free_task_ctx（worker_thread.c 195-205），所引 98-180 只含取用与新建 |

## 退回清单

### 语法（3 条）

| ID | 字段 | 问题 | 应如何修正 |
|---|---|---|---|
| `set_by_lua_block` | syntax | note 称变量名“经 ndk_set_var_name 要求以 $ 开头”，但 ndk_set_var_name（ngx_devel_kit `src/ndk_set_var.c` 256 行起）不在 syntax 的 source_ids 中；已引片段（directive.c 的 set_by_lua* 处理函数）只显示 value[1] 作变量名交给 ndk | 在 syntax 的 evidence 中追加 ngx_devel_kit `src/ndk_set_var.c` ndk_set_var_name 片段并列入 source_ids；或从 note 中删去“须以 $ 开头”的表述（语法文字本身不受影响） |
| `set_by_lua` | syntax | note 称变量名“经 ndk_set_var_name 要求以 $ 开头”，但 ndk_set_var_name（ngx_devel_kit `src/ndk_set_var.c` 256 行起）不在 syntax 的 source_ids 中；已引片段（directive.c 的 set_by_lua* 处理函数）只显示 value[1] 作变量名交给 ndk | 在 syntax 的 evidence 中追加 ngx_devel_kit `src/ndk_set_var.c` ndk_set_var_name 片段并列入 source_ids；或从 note 中删去“须以 $ 开头”的表述（语法文字本身不受影响） |
| `set_by_lua_file` | syntax | note 称变量名“经 ndk_set_var_name 要求以 $ 开头”，但 ndk_set_var_name（ngx_devel_kit `src/ndk_set_var.c` 256 行起）不在 syntax 的 source_ids 中；已引片段（directive.c 的 set_by_lua* 处理函数）只显示 value[1] 作变量名交给 ndk | 在 syntax 的 evidence 中追加 ngx_devel_kit `src/ndk_set_var.c` ndk_set_var_name 片段并列入 source_ids；或从 note 中删去“须以 $ 开头”的表述（语法文字本身不受影响） |

### 功能（14 条）

| ID | 字段 | 问题 | 应如何修正 |
|---|---|---|---|
| `lua_max_running_timers` | summary | “同时处于运行状态”需要递减点：running_timers-- 在 util.c 1085-1100（仅 fake 请求且 context==TIMER 时），未引用，现有片段只证明递增与比较 | 追加 `src/ngx_http_lua_util.c` 约 1085-1100（fake 请求且 context==TIMER 时 `lmcf->running_timers--`）作新增 evidence 并列入 source_ids，note 写明递增与递减配对 |
| `lua_sa_restart` | summary | 所引 initworkerby.c 78-82 无函数头，“worker 初始化”这一归属无片段支撑（需 24-30 行与 module-owner 的 init_process 注册） | 追加 initworkerby.c 24-32（函数头）及 module-owner（init_process 注册）/ process_cycle 780-819 到 source_ids，或把 note 的“worker 初始化函数”限定为已展示的片段 |
| `lua_regex_match_limit` | summary | PCRE2 路径只证明对 ngx_regex_match_context 调用 pcre2_set_match_limit，未引该上下文在 pcre2_match/pcre2_dfa_match 的使用点（regex.c 734-741） | 追加 `src/ngx_http_lua_regex.c` 734-741（pcre2_match / pcre2_dfa_match 使用 ngx_regex_match_context）并写入 note |
| `lua_code_cache` | summary | 修正文字比片段更宽：“含各自的代码缓存表”需 init_registry（util.c 782-815 与 323 行调用）；“非 fake connection”需 fake 连接 fd=-1（util.c 3999），均未引 | 补 util.c 782-815（init_registry 创建 code_cache 表）与 323 行（init_vm 调用 init_registry）、fake 连接 fd=-1（util.c 3999）；或把 corrections 文字再收窄为“关闭时，fd 不为 -1 的连接在创建请求 ctx 时调用 ngx_http_lua_init_vm 新建 Lua VM” |
| `balancer_by_lua_block` | summary | note 称“nginx upstream 1553-1576 调用 peer.get”，但无任何 nginx 片段在 source_ids 中，nginx 取 peer 回调的调用点缺一环 | 把 nginx `src/http/ngx_http_upstream.c` 1553-1576（调用 peer.get）作为新增 evidence 列入 source_ids，或删去 note 中该引用并把“取 peer 回调”限定为 balancer.c 已展示的 get_peer 设置 |
| `balancer_by_lua_file` | summary | 同 balancer_by_lua_block | 同上 |
| `lua_socket_connect_timeout` | summary | u->conf 指向 llcf 的赋值（socket_tcp.c 1121 `u->conf = llcf`）未引，connect_timeout 来自 llcf 的链路缺一环 | 追加 `src/ngx_http_lua_socket_tcp.c` 1115-1125（含 `u->conf = llcf`），note 写明 u->conf 即 llcf |
| `lua_socket_send_timeout` | summary | 同上（缺 socket_tcp.c 1121） | 同上 |
| `lua_socket_send_lowat` | summary | 同上：send 路径用 u->conf->send_lowat，缺 `u->conf = llcf`（1121） | 同上，另补 3585 行使用点已有；仅缺 1121 |
| `lua_socket_buffer_size` | summary | 同上：三处均用 u->conf->buffer_size，缺 `u->conf = llcf`（1121） | 同上 |
| `lua_socket_read_timeout` | summary | 同上（缺 socket_tcp.c 1121） | 同上 |
| `lua_ssl_protocols` | summary | ngx_ssl_create(…, llcf->ssl_protocols, …) 如何把协议位应用到 SSL 上下文（nginx ngx_event_openssl.c 中 ngx_ssl_create 的协议选项设置）未引，“限定协议版本”缺一环 | 追加 nginx `src/event/ngx_event_openssl.c` ngx_ssl_create 中应用 protocols 的片段并列入 source_ids |
| `lua_malloc_trim` | summary | “非 0 时置 requires_log、写入 malloc_trim_cycle”发生在 ngx_http_lua_malloc_trim 处理函数（module.c 1731 起），未列入 summary 的 source_ids | 把 `configuration-definition`（module.c 1731 起 ngx_http_lua_malloc_trim）列入 summary 的 source_ids，note 引用其对 requires_log、malloc_trim_cycle 的写入 |
| `lua_worker_thread_vm_pool_size` | summary | “使用后的 ctx 回到池中复用”需 ngx_http_lua_free_task_ctx（worker_thread.c 195-205），所引 98-180 只含取用与新建 | 追加 worker_thread.c 195-205（ngx_http_lua_free_task_ctx 把 ctx 放回 ctxpool） |

## 实施者自述项的判定

### “每个 worker”表述（逐条）
判定标准：该表述的作用域来自 nginx 进程模型（计数/缓存是配置内存池中的普通变量，未用共享内存，fork 后各 worker 各持一份），不是源码中的行为分支，也不依赖未展示的代码路径。已展示片段中均无共享内存/锁，因此属“轻度推断但与片段不冲突”，不按调用链缺环处理。

| ID | 判定 | 说明 |
|---|---|---|
| `lua_thread_cache_max_entries` | 接受 | 缓存槽在 `ngx_palloc(cf->pool, …)` 分配（片段可见），队列在 lmcf；上限与分配、取用/放回链完整。建议 note 把“每个 worker”写为“进程内（未用共享内存）”。 |
| `lua_max_pending_timers` | 接受 | 递增（timer.c 335-339）、递减（543-546）、比较（180-200）三点齐全，计数为 lmcf 普通字段。 |
| `lua_max_running_timers` | **summary 退回**（与“每个 worker”无关） | 缺递减点 util.c 1098，见退回清单；“每个 worker”本身同上接受。 |
| `balancer_keepalive` | 接受 | 缓存项在 `ngx_pcalloc(cf->pool, …)` 分配、按 upstream 块（lscf）持有；summary 未写“每个 upstream”，不错误。 |
| `lua_shared_dict`（“worker 共享”） | 通过（直接支撑） | 非推断：`ngx_shm_alloc`→`mmap(MAP_ANON|MAP_SHARED)` 已引。 |
| `lua_worker_thread_vm_pool_size` | 作用域无“每个 worker”字样 | 计数为文件级 static，通过；但 summary 另有缺环（退回）。 |

### 3 条 corrections
- `lua_code_cache` summary 收窄：**方向正确，但证据不足以支撑修正后的新文字**（见退回清单 #12）；文字本身与源码不冲突，补片段或再收窄即可。
- `ssl_certificate_by_lua_block` / `_file` 删去“完整”：**通过**。`module.c` 1274-1312 只显示 `SSL_CTX_set_cert_cb` 注册，“完整握手”无源码支撑；删除最小且不引入新陈述，“下游 TLS 握手证书回调”由注册于 server 的 `sscf->ssl.ctx` 支撑。

### `lua_load_resty_core` 语法 unverified
**证据不足属实**。注册为 `NGX_CONF_FLAG`（恰 1 个参数），处理函数 `ngx_http_lua_load_resty_core` 只打印弃用告警、不解析参数，源码未约束 on|off，on|off 仅见 README；无可晋级片段。其 summary 通过：处理函数无状态，`util.c` 3930-3944 中 `require "resty.core"` 无条件执行。

### 其他备注（非退回）
- `lua_ssl_verify_depth`：depth 仅在 trusted_certificate 非空时传入 `ngx_ssl_trusted_certificate`（module.c 1690-1697）。summary 未写该条件但不错误，note 已写，通过。
- `lua_capture_error_log`（verified_affected）：补丁片段、`HAVE_INTERCEPT_ERROR_LOG_PATCH` 条件与 `ngx_log_error_core` 回调均已覆盖，通过。
- 带平台/编译条件的 summary（`HAVE_LUA_RESETTHREAD`、`NGX_THREADS`、`MALLOC_TRIM`、PCRE/PCRE2、`SA_RESTART`、OpenSSL/LibreSSL 报错分支）片段均覆盖条件。
- 其余自定义解析函数（`lua_shared_dict`、`lua_capture_error_log`、`lua_malloc_trim`、`balancer_keepalive`、各 *_by_lua / *_block、`lua_ssl_protocols` 取值表）关键字、参数个数与注册标志逐项对应。

## 计数
| 字段 | 通过 | 退回 | 证据不足属实 | 合计 |
|---|---|---|---|---|
| syntax | 75 | 3 | 1 | 79 |
| summary | 65 | 14 | 0 | 79 |

（与实施者计数差异：实施者 syntax verified 78 / unverified 1，summary verified 79；本审核另有 3 个 syntax、14 个 summary 的 verified 被退回，退回条目修正后可恢复。）

## `node scripts/build.mjs --config project.config.json --check`
成功（exit 0）。B12 输出：`syntax_verified 78, syntax_unverified 1, summary_verified 79, summary_unverified 0, entries 79`，与实施者报告一致；构建未做语义核对，上述退回不影响其通过。


---

# 复审 1（修复轮次 1）

依据：review-brief 裁定 1-4。新增片段已按各自 revision 经 `git show` 按行号取回核对（lua-nginx-module `ea09d92a…`、nginx release-1.27.1、ngx_devel_kit `91e30eb0…`），全部可解析、内容与 note 一致。

## 结论：仍有未通过项（13 条 summary + 1 条语法待晋级）

## （1）原 17 条逐条判定
| ID | 字段 | 判定 | 说明 |
|---|---|---|---|
| set_by_lua_block / set_by_lua / set_by_lua_file | syntax | ADDRESSED | `ndk_set_var.c` 256-304 含 `name.data[0] != '$'` 报错，属实 |
| lua_max_running_timers | summary | ADDRESSED | `util.c` 1085-1101 含 fake 请求且 TIMER 时 `running_timers--` |
| lua_sa_restart | summary | ADDRESSED | 补函数头 22-34、lmcf 取值 43、module-owner |
| lua_regex_match_limit | summary | ADDRESSED | `regex.c` 730-742 使用 ngx_regex_match_context，582-587 补 PCRE 路径 lmcf |
| lua_code_cache | summary | ADDRESSED | 补 init_registry 782-816（创建 code_cache 表）、调用 321-324、fake 连接 fd=-1（3995-4000）；corrections 文字不变，现被片段支撑 |
| balancer_by_lua_block / _file | summary | ADDRESSED | nginx `ngx_http_upstream.c` 1553-1576 已列入 source_ids |
| lua_malloc_trim | summary | ADDRESSED | `configuration-definition` 与 lmcf 取值已列入 |
| lua_worker_thread_vm_pool_size | summary | ADDRESSED | `free_task_ctx` 194-200 属实 |
| lua_socket_connect_timeout / send_timeout / send_lowat / buffer_size / read_timeout | summary | NOT ADDRESSED | 已补 `u->conf = llcf`（1121），但 llcf 的取值 `llcf = ngx_http_get_module_loc_conf(...)` 在 938 行，不在任何片段内；裁定 3 要求“取配置 + 赋给 u->conf”被共享片段覆盖 |
| lua_ssl_protocols | summary | NOT ADDRESSED | `ngx_ssl_create` 363-389 与 merge 调用已补且属实；但同上缺 938 行 |

## （2）新增片段核对
全部新增片段（含 ngx_devel_kit、nginx、lua-resty-core）行号无偏移、可按 revision 取回。回查新增的 `summary-init-lmcf`（769）、`summary-llcf-*`（accessby 78、contentby 167、rewriteby 80、server_rewriteby 40-41）、`summary-init-worker-lmcf`（43）、`summary-main-conf-lmcf`（1083）等属实，各阶段条目的链路按裁定 1 闭合。
`lua_ssl_*` 的 `ngx_http_lua_set_ssl(cf, conf)` 调用（module.c 1541）已覆盖；set_ssl 形参名 llcf 的声明虽不在片段内，按裁定 3 接受。

## 新发现 / 仍未解决（共 13 条 summary）
| ID | 字段 | 问题 | 应如何修正 |
|---|---|---|---|
| lua_socket_connect_timeout、lua_socket_send_timeout、lua_socket_send_lowat、lua_socket_buffer_size、lua_socket_read_timeout、lua_ssl_protocols、lua_ssl_ciphers、lua_ssl_verify_depth、lua_ssl_certificate、lua_ssl_certificate_key、lua_ssl_trusted_certificate、lua_ssl_crl、lua_ssl_conf_command | summary | 这 13 条都引用了 `summary-conf-assign`（socket_tcp.c 1115-1125 的 `u->conf = llcf`），但 llcf 的取值行 `socket_tcp.c` 938 不在片段内（二者相隔 180 余行，无一个共享片段覆盖）。其中 lua_ssl_trusted_certificate / lua_ssl_crl 只因另引了 1920-1953 中无关函数的 llcf 取值而未被脚本发现，仍属缺环 | 为这 13 条追加单行 evidence：`src/ngx_http_lua_socket_tcp.c:938`（`llcf = ngx_http_get_module_loc_conf(r, ngx_http_lua_module);`），并列入 source_ids，note 写明该取值与 1121 行同在 `ngx_http_lua_socket_tcp_connect`（socket_tcp.c）中 |

## （3）lua_load_resty_core 语法（裁定 4）
**应改为“可晋级”，但实施者本轮未处理**：报告写“保持 unverified”。处理函数不读 value、只告警，`ngx_conf_handler` 对 `NGX_CONF_FLAG` 只检查 `nelts == 2`（nginx `ngx_conf_file.c` 413-421，已取回确认）。请照 B13：追加该片段为新增 evidence（如 `syntax-arg-count`）并列入 syntax 的 source_ids，corrections.syntax 改为 `lua_load_resty_core value;`，理由“注册为 NGX_CONF_FLAG，nginx 只检查参数个数为 1；处理函数不读取参数，不校验 on/off”，状态改 verified。完成后 syntax 计数应为 verified 79 / unverified 0。

## 复审 1 后计数（以实施者当前文件为准，待上述修复）
| 字段 | 通过 | 退回/待处理 |
|---|---|---|
| syntax | 78（含 3 条已通过的 set_by_lua*） | 1（lua_load_resty_core 待晋级） |
| summary | 66 | 13 |

`node scripts/build.mjs --config project.config.json --check` 成功：B12 syntax 78/1、summary 79/0、entries 79（与实施者报告一致，构建不做语义核对）。


---

# 复审 2（修复轮次 2）

依据：裁定 5（取配置与赋 `u->conf` 相距较远时，两个短片段都在 `source_ids` 内即闭环）。

## 结论：全部通过

| ID | 字段 | 判定 | 核对 |
|---|---|---|---|
| lua_socket_connect_timeout、lua_socket_send_timeout、lua_socket_send_lowat、lua_socket_buffer_size、lua_socket_read_timeout、lua_ssl_protocols、lua_ssl_ciphers、lua_ssl_verify_depth、lua_ssl_certificate、lua_ssl_certificate_key、lua_ssl_trusted_certificate、lua_ssl_crl、lua_ssl_conf_command（13 条） | summary | ADDRESSED | 13 条的 summary `source_ids` 均同时含 `summary-conf-llcf-get`（socket_tcp.c 938-938，锁定 revision 上为 `llcf = ngx_http_get_module_loc_conf(r, ngx_http_lua_module);`）与 `summary-conf-assign`（1115-1125，含 `u->conf = llcf;`）；938 与 1121 同属 `ngx_http_lua_socket_tcp_connect`（889-1191），llcf 为同一变量 |
| lua_load_resty_core | syntax | ADDRESSED | corrections 为 `lua_load_resty_core value;`，状态 verified；`syntax-arg-count`（nginx ngx_conf_file.c 413-421）在锁定 revision 取回，含 `NGX_CONF_FLAG` 仅检查 `nelts != 2`；处理函数不读值（`configuration-definition` 已引）。理由文字与 B13 一致 |

## 复审 2 后计数
| 字段 | 通过 | 退回 |
|---|---|---|
| syntax | 79 | 0 |
| summary | 79 | 0 |

`node scripts/build.mjs --config project.config.json --check` 成功：B12 syntax 79/0、summary 79/0、entries 79。
