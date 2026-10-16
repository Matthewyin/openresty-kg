# B13 独立审核（stream-lua-nginx-module，50 条 × syntax/summary）

审核方式：逐条打开 `source_ids` 指向的片段（已有来源取自 `dist/knowledge/releases/1.27.1.1-f43ab3d7392bdcc9/directives/<id>.json`；新增 evidence 按 stream-lua `v0.0.15`＝`69f0cd76…`、nginx `release-1.27.1` 的 `git show` 与行号逐一读取），全部取证均来自 stream-lua 自己的源码（`ngx_stream_lua_*`），没有借用 HTTP lua-nginx-module 的片段。新增 evidence 行号与固定 revision 一致，无偏移。

**结论：有退回。** 退回 5 条（均为 summary），syntax 全部通过。

## 总表（已按复审 2 更新；复审后以本表为准）

“通过”＝实施者给出的 verified/unverified 判定经复核成立。

| ID（`ngx_stream_lua_module--` 前缀省略） | syntax | summary | 退回原因（一句） |
| --- | --- | --- | --- |
| lua_load_resty_core | 通过（复审 1：已晋级，复审 3：否定陈述检索 ADDRESSED） | 通过（复审 3：ADDRESSED） | — |
| lua_max_running_timers | 通过 | 通过 | — |
| lua_max_pending_timers | 通过 | 通过 | — |
| lua_shared_dict | 通过 | 通过 | — |
| lua_sa_restart | 通过 | 通过 | — |
| lua_capture_error_log | 通过 | 通过 | — |
| lua_regex_cache_max_entries | 通过 | 通过（复审 3：ADDRESSED） | — |
| lua_regex_match_limit | 通过 | 通过 | — |
| lua_package_cpath | 通过 | 通过 | — |
| lua_package_path | 通过 | 通过 | — |
| lua_code_cache | 通过 | 通过 | — |
| lua_socket_log_errors | 通过 | 通过 | — |
| init_by_lua_block | 通过 | 通过 | — |
| init_by_lua | 通过 | 通过 | — |
| init_by_lua_file | 通过 | 通过 | — |
| init_worker_by_lua_block | 通过 | 通过 | — |
| init_worker_by_lua | 通过 | 通过 | — |
| init_worker_by_lua_file | 通过 | 通过 | — |
| preread_by_lua_file | 通过 | 通过 | — |
| preread_by_lua_block | 通过 | 通过（复审 1：已晋级，ADDRESSED） | — |
| content_by_lua | 通过 | 通过 | — |
| content_by_lua_block | 通过 | 通过 | — |
| content_by_lua_file | 通过 | 通过 | — |
| log_by_lua_block | 通过 | 通过 | — |
| log_by_lua_file | 通过 | 通过 | — |
| preread_by_lua_no_postpone | 通过 | 通过 | — |
| balancer_by_lua_block | 通过 | 通过（复审 1：ADDRESSED） | — |
| balancer_by_lua_file | 通过 | 通过（复审 1：ADDRESSED） | — |
| lua_socket_keepalive_timeout | 通过 | 通过 | — |
| lua_socket_connect_timeout | 通过 | 通过（复审 2：ADDRESSED） | — |
| lua_socket_send_timeout | 通过 | 通过（复审 2：ADDRESSED） | — |
| lua_socket_send_lowat | 通过 | 通过（复审 2：ADDRESSED） | — |
| lua_socket_buffer_size | 通过 | 通过（复审 2：ADDRESSED） | — |
| lua_socket_pool_size | 通过（复审 1：占位符改 num，ADDRESSED） | 通过（复审 1） | — |
| lua_socket_read_timeout | 通过 | 通过（复审 2：ADDRESSED） | — |
| lua_check_client_abort | 通过 | 通过 | — |
| lua_ssl_protocols | 通过 | 通过（复审 2：ADDRESSED） | — |
| lua_ssl_ciphers | 通过 | 通过（复审 2：ADDRESSED） | — |
| ssl_client_hello_by_lua_block | 通过 | 通过（复审 1：ADDRESSED） | — |
| ssl_client_hello_by_lua_file | 通过 | 通过 | — |
| ssl_certificate_by_lua_block | 通过 | 通过（复审 1：已晋级，ADDRESSED） | — |
| ssl_certificate_by_lua_file | 通过 | 通过（复审 1：已晋级，ADDRESSED） | — |
| lua_ssl_verify_depth | 通过 | 通过（复审 2：ADDRESSED） | — |
| lua_ssl_certificate | 通过 | 通过（复审 2：ADDRESSED） | — |
| lua_ssl_certificate_key | 通过 | 通过（复审 2：ADDRESSED） | — |
| lua_ssl_trusted_certificate | 通过 | 通过（复审 2：ADDRESSED） | — |
| lua_ssl_crl | 通过 | 通过（复审 2：ADDRESSED） | — |
| lua_ssl_conf_command | 通过 | 通过 | — |
| lua_malloc_trim | 通过 | 通过 | — |
| lua_add_variable | 通过 | 通过 | — |

## 退回清单

### 1. `lua_regex_cache_max_entries`（summary）

- 现文字：`为Stream Lua正则实现提供每worker缓存容量参数。`
- 问题：
  - 全库只有三处用到该字段：`ngx_stream_lua_common.h:197`（声明）、`ngx_stream_lua_module.c:766-768`（默认 1024）、`ngx_stream_lua_regex.c:978-988`（`ngx_stream_lua_ffi_max_regex_cache_size` 返回该值）。`git grep regex_cache` 没有任何缓存创建、计数比较或淘汰代码。
  - “供正则实现使用”需要该 FFI 的调用方（在 lua-resty-core，不在本组件锁定源码内）；“缓存容量”“每 worker”都是由字段名和进程内 `lmcf` 推出来的，属于推断。
  - 实施者 note 已承认“缓存淘汰不在本组件 C 代码中”，但摘要文字仍然声称了消费关系。
- 修正（二选一）：
  - 推荐：改标 `unverified`，note 写“仅见存值与 FFI 返回，消费方不在本组件源码”。
  - 或用 `corrections.summary` 收窄为：`保存Stream Lua正则缓存条目数上限（默认1024，需NGX_PCRE），并经FFI接口 ngx_stream_lua_ffi_max_regex_cache_size 返回该值；缓存本身的创建与淘汰不在本组件C代码中。` 新增 evidence 可补 `ngx_stream_lua_regex.c` 的 `#if (NGX_PCRE)`（第 21 行起，整文件受其包裹）以覆盖条件。
- 重点审查结论：syntax（`TAKE1` + `ngx_conf_set_num_slot`）无问题；退回的只是 summary。

### 2. `lua_ssl_verify_depth`（summary）

- 现文字：`设置Stream Lua cosocket验证远端证书时的链深度参数。`
- 问题：
  1. 条件缺失：`ngx_stream_lua_module.c:1098-1105` 里 `lscf->ssl_verify_depth` 只在 `lscf->ssl_trusted_certificate.len` 非零时才传给 `ngx_ssl_trusted_certificate`（再由其 `SSL_CTX_set_verify_depth`，`ngx_event_openssl.c:957`）。不配置 `lua_ssl_trusted_certificate` 时该指令不产生任何效果。实施者 note 写了这个条件，但摘要文字没写；“有条件的陈述，片段必须覆盖该条件”，摘要现在是无条件陈述。“摘要仅称参数”不能作为规避理由。
  2. 链路缺一环：所引 `implementation-0..3` 没有 `ngx_ssl_create_connection(u->conf->ssl, …)`（`ngx_stream_lua_socket_tcp.c:1628-1638`）。该片段在 `lua_ssl_protocols/ciphers/certificate*` 中都有引用，但 verify_depth 漏了，因此 SSL ctx 如何落到 cosocket 连接上没有直接证据。
- 修正：`corrections.summary` 改为 `在配置了 lua_ssl_trusted_certificate 时，设置Stream Lua cosocket验证远端证书的链深度（默认1）。`；新增（或复用）`ngx_stream_lua_socket_tcp.c:1628-1638`，并在 note 写出：`lscf->ssl_verify_depth → ngx_ssl_trusted_certificate(depth) → SSL_CTX_set_verify_depth → u->conf->ssl 建 SSL 连接 → SSL_get_verify_result`。
- 重点审查结论：syntax 通过；summary 退回。

### 3. `ssl_client_hello_by_lua_block`（summary）

- 问题：note 写“其执行 ssl_client_hello_handler_inline”，但 `source_ids` 里没有 `ngx_stream_lua_ssl_client_hello_handler_inline` 的函数体。已有片段只证明函数指针被存入 `srv.ssl_client_hello_handler` 并在回调里调用（`ssl_client_helloby.c:304`），没有证明被调用的函数是 `loadbuffer + by_chunk` 运行配置块文本。同批 `ssl_client_hello_by_lua_file` 引用了 `handler_file` 函数体，block 版没有。
- 修正：新增 evidence `summary-handler-inline`：`src/ngx_stream_lua_ssl_client_helloby.c` 第 52-71 行（`handler_inline`，其中 `cache_loadbuffer(... ssl_client_hello_src ...)` 后 `ssl_client_hello_by_chunk`），加入 `summary_evidence.source_ids`，无需改文字，可保持 verified。

### 4. `balancer_by_lua_block` 与 `balancer_by_lua_file`（summary）

- 现文字：`在Stream upstream取peer时由Lua选择后端…`；note：“Lua 设置了 peer 则采用，否则回落轮询”。
- 问题：`get_peer` 里采用的是 `bp->sockaddr && bp->socklen`（`ngx_stream_lua_balancer.c:374-390`），`sockaddr` 只由 `ngx_stream_lua_ffi_balancer_set_current_peer`（第 508-588 行，`bp->sockaddr = url.addrs[0].sockaddr`，第 578 行）写入；这一段没有被任何 source_id 引用。所引片段只证明了运行 Lua 之后“若 `bp->sockaddr` 非空则采用”，Lua 如何让它非空是推断（本批较轻）。
- 修正：两条都新增 evidence `summary-set-current-peer`：`src/ngx_stream_lua_balancer.c` 508-588，并在 note 说明“Lua 经该 FFI 写 bp->sockaddr，get_peer 据此取 peer”；文字不用改。（调用该 FFI 的 Lua 侧在 lua-resty-core，note 里写成“FFI 入口”即可，不要写成 Lua API 名。）

## 实施者留下的 4 个 unverified：缺口是否属实、能否晋级

| 条目/字段 | 缺口属实？ | 结论 |
| --- | --- | --- |
| `lua_load_resty_core` syntax | 属实 | **可晋级**（需 corrections，见下） |
| `preread_by_lua_block` summary | 属实 | **可晋级**（需 corrections + 补片段） |
| `ssl_certificate_by_lua_block` summary | 属实 | **可晋级**（需 corrections + 补片段） |
| `ssl_certificate_by_lua_file` summary | 属实 | **可晋级**（需 corrections + 补片段） |

### `lua_load_resty_core` · syntax —— 可晋级

- 缺口属实：注册为 `NGX_STREAM_MAIN_CONF|NGX_CONF_FLAG`，`ngx_conf_handler` 对 `NGX_CONF_FLAG` 只检查 `cf->args->nelts == 2`（`ngx_conf_file.c:417-421`），不校验 on/off；处理函数 `ngx_stream_lua_load_resty_core`（`ngx_stream_lua_directive.c:180-190`）只打印弃用告警、不读 `value[1]`、不调用 `ngx_conf_set_flag_slot`。所以任何单个参数都会被接受，“on | off”没有源码依据。
- 建议 `corrections.syntax`：`lua_load_resty_core value;`
- reason：`注册为 NGX_CONF_FLAG，nginx 只检查参数个数为 1；处理函数不读取参数，不校验 on/off。`
- 新增 evidence `syntax-arg-count`：nginx `src/core/ngx_conf_file.c` 413-421（上面已核对：`if (!(cmd->type & NGX_CONF_ANY)) { if (cmd->type & NGX_CONF_FLAG) { if (cf->args->nelts != 2) goto invalid; …`）。`syntax_evidence.source_ids` = `registration, configuration-definition, syntax-arg-count`。

### `preread_by_lua_block` · summary —— 可晋级

- 缺口属实，但缺口比实施者描述的更大：
  - “或 UDP 数据报”：`src/` 里与 UDP 数据报相关的只有 output/socket_udp 部分，prereadby.c、contentby 等无 `SOCK_DGRAM` 处理；nginx 侧 `ngx_stream_core_preread_phase`（`ngx_stream_core_module.c:230-314`）也没有区分数据报，所以“数据报进入 preread 并被 Lua 处理”只能靠推断/README。
  - 现有 source_ids（`phase-install`、`no-script-consume`）只证明安装 handler 与 `preread_handler == NULL` 的早退（`prereadby.c:67-73`），没有证明块文本被加载并执行；note 写“源码片段证明块脚本在 PREREAD 阶段对每个会话执行”说过头了。
- 建议 `corrections.summary`：`在 stream 的 preread 阶段执行 Lua，对连接进行预读阶段处理。`
- 补片段（沿用同批 `preread_by_lua_file` 的做法）：`src/ngx_stream_lua_prereadby.c` 24-123（`ngx_stream_lua_preread_handler`，第 115 行 `lscf->preread_handler(r)`）与 126-150（`ngx_stream_lua_preread_handler_inline`，`cache_loadbuffer(preread_src…)` 后 `preread_by_chunk`）；`src/ngx_stream_lua_module.c` 536-543（已有 `phase-install`）。note：“`preread_by_lua_block` → `cmd->post=handler_inline` 存入 `lscf->preread_handler`、置 `requires_preread` → init 安装 PREREAD 阶段 handler → handler 调用该函数体运行块脚本”。
- 注意：删掉“UDP 数据报”后文字更窄但不错误；若项目希望保留 UDP 说法，需另补 nginx 数据报进入 preread 阶段的完整链路（`ngx_stream_init_connection → ngx_stream_init_session → core_run_phases` 及 `ngx_stream_preread_peek/preread`），不建议为此增加范围。

### `ssl_certificate_by_lua_block` / `ssl_certificate_by_lua_file` · summary —— 可晋级

- 缺口属实：证据证明 `SSL_CTX_set_cert_cb`（`ngx_stream_lua_module.c:945`）与 `ngx_stream_lua_ssl_cert_handler` 回调（`ssl_certby.c:196-372`）；“完整TLS握手”隐含“会话复用不触发”，这是 OpenSSL 行为，片段里没有。
- 另一个同类缺口：block 版 `summary_evidence` 同样没有 `ngx_stream_lua_ssl_cert_handler_inline` 的函数体（`ngx_stream_lua_ssl_certby.c` 69-88：`cache_loadbuffer(ssl_cert_src…)` 后 `ssl_cert_by_chunk`）；file 版需要 `ngx_stream_lua_ssl_cert_handler_file`（49-66）。`ssl_cert_by_chunk` 在第 463 行起。
- 建议 `corrections.summary`：
  - block：`在Stream下游TLS握手的证书回调（SSL_CTX_set_cert_cb）执行Lua，执行配置中的Lua块。`
  - file：`在Stream下游TLS握手的证书回调（SSL_CTX_set_cert_cb）执行Lua，加载外部Lua文件。`
- 新增 evidence：block 用 `ssl_certby.c` 69-88；file 用 `ssl_certby.c` 49-66；note：“块/文件 → `cmd->post` 存入 `srv.ssl_cert_handler`（`ssl_certby.c:144`）→ merge 时 `SSL_CTX_set_cert_cb` → `ngx_stream_lua_ssl_cert_handler` 第 317 行调用该 handler → handler 函数体 loadbuffer/loadfile 并 by_chunk 运行”。

## 附注

- **A（建议补强，本次不计退回）**：`lua_socket_connect/send/read_timeout`、`lua_socket_send_lowat`、`lua_socket_buffer_size`、`lua_socket_pool_size`、`lua_ssl_protocols/ciphers/certificate/certificate_key/trusted_certificate/crl`（共 13 条）通过 `u->conf->…`/`u->conf->ssl` 读取配置值，但所引片段没有 `u->conf = llcf;`（`ngx_stream_lua_socket_tcp.c:1062`，`llcf` 来自 `get_module_loc_conf`；`ngx_stream_lua_loc_conf_t` 在 `common.h:333` 就是 `srv_conf_t` 的 typedef）。链路本身清楚、字段名与注册 `offsetof` 一一对应，所以我没有把它算作缺环；若项目要求最严格，可对这 13 条各加一个 `socket-conf-assign` 片段（`ngx_stream_lua_socket_tcp.c` 1060-1062）。`lua_socket_keepalive_timeout`/`lua_check_client_abort` 的片段里直接有 `llcf = get_module_loc_conf(r,…)`，不受影响。
- **B（措辞，不影响判定）**：`lua_socket_pool_size` note 写“connect 选项未给 pool_size 时取 llcf->pool_size”并不准确——`connect` 里只有给了 `backlog` 且 `pool_size==0` 时才取默认（`ngx_stream_lua_socket_tcp.c:941-944`），否则 `pool_size` 为 0 不建池（第 1114 行 `pool_size > 0` 才建）。摘要“每个池的默认缓存连接数量”由 `setkeepalive`（第 5278 行）与 backlog 路径支撑，成立；建议改正 note。另外该指令 syntax 占位符为 `size`，实际是 `ngx_conf_set_num_slot`（`ngx_atoi`，不接受 `k/m` 单位），可考虑改为 `num`，不影响本批判定。
- 其余已核对要点：块指令 8 条均为 `NGX_CONF_BLOCK|NGX_CONF_NOARGS`，`ngx_stream_lua_conf_lua_block_parse`（776-933）按花括号层级读取并把末尾 `}` 置 `\0` 后作为 `value[1]` 交给 handler；`lua_code_cache` 先 `ngx_conf_set_flag_slot` 再告警；`lua_capture_error_log` 依赖 `HAVE_INTERCEPT_ERROR_LOG_PATCH`，补丁片段（cycle 钩子字段与 `ngx_log_error_core` 调用点）一致；`lua_ssl_protocols` 取值表与默认值与源码一致；计时器上限的计数点（`timer.c:363/596/699`、`util.c:738`）与 summary 一致。

## 计数

| 字段 | 通过（含“证据不足属实”） | 退回 |
| --- | --- | --- |
| syntax | 50（verified 49 通过；unverified 1 属实，可晋级） | 0 |
| summary | 45（verified 42 通过；unverified 3 属实，均可晋级） | 5（`lua_regex_cache_max_entries`、`lua_ssl_verify_depth`、`ssl_client_hello_by_lua_block`、`balancer_by_lua_block`、`balancer_by_lua_file`） |

## `--check`

`node scripts/build.mjs --config project.config.json --check`：退出码 0，通过。输出 B13：`syntax_verified 49 / syntax_unverified 1 / summary_verified 47 / summary_unverified 3 / entries 50`，与实施者报告一致（总计 1041 条）。


---

# 复审 1

重读了更新后的 `review-brief.md`（裁定 1–4）与 `B13-report.md`（修复轮次 1），按 revision `69f0cd76…`（stream-lua）/`release-1.27.1`（nginx）逐条读取新增片段与 corrections。`--check`：退出码 0，B13 为 syntax 50/0、summary 50/0、entries 50，与报告一致。

**结论（复审 1 时）：有退回。** 仍未解决 12 条（复审 2 已全部解决）（均为 summary，同一个问题）；其余全部 ADDRESSED，无新增错误。

## 逐项判定

| 项 | 判定 | 复核要点 |
| --- | --- | --- |
| `lua_regex_cache_max_entries` summary | ADDRESSED | corrections 文字收窄为“存值＋FFI 返回，创建与淘汰不在本组件”；`summary-pcre-guard` regex.c 21-25 行号属实（第 21 行 `#if (NGX_PCRE)`），默认值的 NGX_PCRE 条件另由 merge-default（module.c 765-768）覆盖；无新错 |
| `lua_ssl_verify_depth` summary | **NOT ADDRESSED（部分）** | 条件已写入文字（“配置了 lua_ssl_trusted_certificate 时…默认1”），`summary-ssl-create-connection`（socket_tcp.c 1628-1638）属实；但 `u->conf = llcf` 的 `llcf` 来源行仍缺，见下 |
| `ssl_client_hello_by_lua_block` summary | ADDRESSED | `summary-handler-inline` helloby.c 52-71 属实（`cache_loadbuffer(ssl_client_hello_src)` → `ssl_client_hello_by_chunk`），文字未改 |
| `balancer_by_lua_block` / `_file` summary | ADDRESSED | `summary-set-current-peer` balancer.c 508-588 属实（第 578 行写 `bp->sockaddr`），文字未改 |
| `lua_load_resty_core` syntax 晋级 | ADDRESSED | `syntax-arg-count` ngx_conf_file.c 413-421 属实（FLAG→`nelts != 2`）；改为 `lua_load_resty_core value;` 符合裁定 4，最小化 |
| `preread_by_lua_block` summary 晋级 | ADDRESSED | 删去“或 UDP 数据报”；`summary-preread-handler` 24-123、`summary-preread-inline` 126-150 属实，链路闭环（handler→`preread_handler(r)`→inline loadbuffer→by_chunk） |
| `ssl_certificate_by_lua_block` / `_file` summary 晋级 | ADDRESSED | 去掉“完整”并补“（SSL_CTX_set_cert_cb）”；`summary-cert-inline` 69-88、`summary-cert-file` 49-66 属实；`set_cert_cb` 由已有 module.c 921-957 覆盖。文字比原文更窄，无新错 |
| `lua_socket_pool_size` 占位符 | ADDRESSED | corrections.syntax 为 `lua_socket_pool_size num;`，与 `ngx_conf_set_num_slot`（ngx_atoi）一致；功能 note 已改正为“connect 仅在给 backlog 且 pool_size==0 时取默认”，与 socket_tcp.c 941-944、1114 一致。该条 `llcf` 来源由已有 implementation-0（905-945，含第 905 行）覆盖，闭环 |
| 附注 A：13 条补 `u->conf = llcf` | **NOT ADDRESSED（12 条）** | `socket-conf-assign`（socket_tcp.c 1060-1062）行号属实，但仅含赋值行，不含 `llcf = ngx_stream_lua_get_module_loc_conf(r, ngx_stream_lua_module);`（第 905 行，同在 `ngx_stream_lua_socket_tcp_connect`，857 行起）。裁定 3 要求“取模块配置＋赋给 `u->conf`”由共享片段覆盖才算闭环；note 里写的“llcf 为 srv conf”没有片段支撑。`lua_socket_pool_size` 因 implementation-0 含第 905 行，不受影响（13−1＝12） |
| 裁定 2 语法回查 | ADDRESSED | 抽查注册标志与 setter：`lua_ssl_protocols` 取值表（含 `#ifdef NGX_SSL_TLSv1_3` 的 TLSv1.3）与语法一致，其余 TAKE1/FLAG/TAKE2/块指令无少列多列；我原先的“通过”按新尺度重核后无变化 |

## 退回清单（复审 1）

**同一问题，12 条**：`lua_socket_connect_timeout`、`lua_socket_send_timeout`、`lua_socket_send_lowat`、`lua_socket_buffer_size`、`lua_socket_read_timeout`、`lua_ssl_protocols`、`lua_ssl_ciphers`、`lua_ssl_certificate`、`lua_ssl_certificate_key`、`lua_ssl_trusted_certificate`、`lua_ssl_crl`、`lua_ssl_verify_depth`（字段：summary）。

- 问题：`socket-conf-assign` 只含 `u->conf = llcf;`，`llcf` 从哪里来（取到的是本模块 conf）不在任何片段内。
- 修正（最小）：新增一个片段 `socket-conf-get`：`src/ngx_stream_lua_socket_tcp.c` 905-905（`llcf = ngx_stream_lua_get_module_loc_conf(r, ngx_stream_lua_module);`），加入这 12 条的 `summary_evidence.source_ids`，note 写“connect 函数内 `llcf = get_module_loc_conf`（905）→ `u->conf = llcf`（1062）”；或把 `socket-conf-assign` 改成非连续两段不可行（片段需连续），所以用两个片段。同函数 905→1062 相隔 150+ 行，不宜合成一个片段。

## 计数（复审 1 后）

| 字段 | 通过 | 退回 |
| --- | --- | --- |
| syntax | 50 | 0 |
| summary | 38 | 12 |


---

# 复审 2

范围：复审 1 退回的 12 条 summary。重读 `review-brief.md`（裁定 1–7，其中裁定 5：取配置与赋 `u->conf` 相距较远时，两个短片段都须在 `source_ids` 内）。

核对：`socket-conf-get` = `ngx_stream_lua_socket_tcp.c` 905-905，按 `69f0cd76…` 读取为 `llcf = ngx_stream_lua_get_module_loc_conf(r, ngx_stream_lua_module);`；`socket-conf-assign` 1060-1062 的第 1062 行为 `u->conf = llcf;`；二者同在 `ngx_stream_lua_socket_tcp_connect`（857 行起）内，`llcf` 在 875 行声明。12 条的 `summary_evidence.source_ids` 与 `evidence` 均同时含 `socket-conf-get` 与 `socket-conf-assign`（脚本逐条核验）。

| ID | 判定 |
| --- | --- |
| lua_socket_connect_timeout | ADDRESSED |
| lua_socket_send_timeout | ADDRESSED |
| lua_socket_send_lowat | ADDRESSED |
| lua_socket_buffer_size | ADDRESSED |
| lua_socket_read_timeout | ADDRESSED |
| lua_ssl_protocols | ADDRESSED |
| lua_ssl_ciphers | ADDRESSED |
| lua_ssl_certificate | ADDRESSED |
| lua_ssl_certificate_key | ADDRESSED |
| lua_ssl_trusted_certificate | ADDRESSED |
| lua_ssl_crl | ADDRESSED |
| lua_ssl_verify_depth | ADDRESSED |

无新增错误；文字未改动。

**新发现（退回 1 条）：`lua_regex_cache_max_entries` summary 的 corrections。** 现文字称“缓存本身的创建与淘汰不在本组件C代码中”。在锁定 revision 复跑 `git grep -n 'regex_cache' <rev> -- src`（全部命中：common.h:196-197、module.c:139/143/716/737/766-767、regex.c:979/987、util.c:86/481、util.h:52），其中 `ngx_stream_lua_util.c:478-484`（`#if (NGX_PCRE)`）注释为 “create the registry entry for the Lua precompiled regex object cache”，`lua_createtable` 在 registry 里建了缓存表——即缓存容器的创建在本组件 C 代码里，否定陈述与源码矛盾；且按裁定 7 note 也未写检索命令与命中。
- 应如何修正：把 corrections.summary 的末句改为只说源码能证明的范围，例如：`…并经FFI接口 ngx_stream_lua_ffi_max_regex_cache_size 返回该值；本组件C代码只创建空的缓存registry表，未见按该上限计数或淘汰的代码。`（“未见”类否定须在 note 写明 `git grep -n 'regex_cache' -- src` 与上述全部命中；`regex_cache_entries` 仅有声明与注释 module.c:716，无读写）。并新增 evidence `util.c` 478-484。或直接删去末句，只保留存值与 FFI 返回。


---

# 复审 3

范围：修复轮次 3 的两处。重读 `review-brief.md` 裁定 7，并在锁定 revision `69f0cd76…`（stream-lua v0.0.15）上复跑检索。

## `lua_regex_cache_max_entries` summary —— ADDRESSED

- corrections.summary 现为“保存Stream Lua正则缓存条目数上限（默认1024，需NGX_PCRE），并经FFI接口 ngx_stream_lua_ffi_max_regex_cache_size 返回该值。”，已不含否定陈述；两处肯定陈述有据：默认值与 `#if (NGX_PCRE)` 见 module.c 765-768，FFI 返回见 regex.c 978-988，且 regex.c 整文件被 `#if (NGX_PCRE)`（第 21 行）…`#endif /* NGX_PCRE */`（第 1004 行）包裹，note 里“整个 regex 文件受包裹”属实。
- 复跑 `git grep -n regex_cache <rev> -- src`：命中为 common.h:196-197、module.c:139/143/716/737/766-767、regex.c:979/987、util.c:86/481、util.h:52，共 13 处，与 note 列出的一致，无遗漏、无比较或淘汰该上限的命中。
- 小瑕疵（不退回）：note 把 util.h:52 写成了“util.c:86/481/52”，建议改为 “util.c:86/481、util.h:52”。

## `lua_load_resty_core` 否定陈述 —— ADDRESSED

- 复跑 `git grep -n load_resty_core <rev> -- src`：命中恰为 5 处——directive.c:181、directive.c:185、directive.h:48、module.c:96、module.c:98，与 syntax/summary 两个 note 完全一致；无读取该指令值的命中（directive.c:181-190 的函数体仅 `ngx_conf_log_error` 与 `return NGX_CONF_OK`，注册 offset 为 0）。note 写明命令、范围（src/）与全部命中，符合裁定 7。
- 文字（`lua_load_resty_core value;`）与功能 summary 不变，无新错。

## 计数（复审 3 后）

| 字段 | 通过 | 退回 |
| --- | --- | --- |
| syntax | 50 | 0 |
| summary | 50 | 0 |

`node scripts/build.mjs --config project.config.json --check`：通过，B13 为 syntax 50/0、summary 50/0、entries 50。
