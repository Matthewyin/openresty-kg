# B05 审核记录

审核范围：ngx_http_grpc_module（28）+ ngx_http_scgi_module（44）= 72 条 × syntax / summary，逐字段核对，不抽样。固定 revision：nginx release-1.27.1（e06bdbd4…）。

核对方法：已有来源取自 `dist/knowledge/releases/1.27.1.1-f43ab3d7392bdcc9/directives/<id>.json`，nginx 组件来源全部与 `git show release-1.27.1:<file>` 按行号逐段比对（无偏移）；15 个新增 evidence 均按 revision 与行号实际读取，ID 与该条已有来源无冲突，`source_ids` 全部可解析；`B05-EVIDENCE.md` 72 节与 JSON 的 source_ids 逐项一致；72 条 `patch_status` 均非 `unverified`。另用脚本对每条 summary 的 `source_ids` 合并片段检查：凡使用 `u->conf->…` 者，片段内是否含 `u->conf = &…` 赋值行（grpc.c:587 / scgi.c:512，即各自的 `upstream-binding`）。grpc 与 scgi 分别从自己模块的 handler 追到共享 upstream 逻辑，未互相借用。

结论：**有退回**。15 个不同 ID 共 16 处退回（语法 4、功能 12）。

## 总表

| # | 指令 | syntax | summary | 退回原因 |
|---|---|---|---|---|
| 1 | `grpc_pass` | 通过 | 通过 |  |
| 2 | `grpc_bind` | 通过 | 通过 |  |
| 3 | `grpc_socket_keepalive` | 通过 | 通过 |  |
| 4 | `grpc_connect_timeout` | 通过 | 通过 |  |
| 5 | `grpc_send_timeout` | 通过 | 通过 |  |
| 6 | `grpc_intercept_errors` | 通过 | 通过 |  |
| 7 | `grpc_buffer_size` | 通过 | 通过 |  |
| 8 | `grpc_read_timeout` | 通过 | 通过 |  |
| 9 | `grpc_next_upstream` | 通过 | 通过 |  |
| 10 | `grpc_next_upstream_tries` | 通过 | 通过 |  |
| 11 | `grpc_next_upstream_timeout` | 通过 | 通过 |  |
| 12 | `grpc_set_header` | 通过 | 复审通过 | 复审 2：已解决 |
| 13 | `grpc_pass_header` | 通过 | 通过 |  |
| 14 | `grpc_hide_header` | 通过 | 通过 |  |
| 15 | `grpc_ignore_headers` | 复审通过 | 复审通过 | 复审 1：已解决（原退回：语法：`field ...` 未列取值表 9 个关键字（B03 同类已按裁定 2…） |
| 16 | `grpc_ssl_session_reuse` | 通过 | 复审通过 | 复审 1：已解决（原退回：功能：运行期读 `u->conf->ssl_session_reuse`（ngx…） |
| 17 | `grpc_ssl_protocols` | 通过 | 通过 |  |
| 18 | `grpc_ssl_ciphers` | 通过 | 通过 |  |
| 19 | `grpc_ssl_name` | 通过 | 复审通过 | 复审 1：已解决（原退回：功能：运行期读 `u->conf->ssl_name/ssl_server_na…） |
| 20 | `grpc_ssl_server_name` | 通过 | 复审通过 | 复审 1：已解决（原退回：功能：运行期读 `u->conf->ssl_server_name`（upstr…） |
| 21 | `grpc_ssl_verify` | 通过 | 复审通过 | 复审 1：已解决（原退回：功能：握手后读 `u->conf->ssl_verify`（upstream.c…） |
| 22 | `grpc_ssl_verify_depth` | 通过 | 通过 |  |
| 23 | `grpc_ssl_trusted_certificate` | 通过 | 通过 |  |
| 24 | `grpc_ssl_crl` | 通过 | 通过 |  |
| 25 | `grpc_ssl_certificate` | 通过 | 复审通过 | 复审 1：已解决（原退回：功能：含变量证书走 `u->conf->ssl_certificate`（ups…） |
| 26 | `grpc_ssl_certificate_key` | 通过 | 复审通过 | 复审 1：已解决（原退回：功能：含变量私钥走 `u->conf->ssl_certificate_key`…） |
| 27 | `grpc_ssl_password_file` | 通过 | 通过 |  |
| 28 | `grpc_ssl_conf_command` | 通过 | 通过 |  |
| 29 | `scgi_pass` | 通过 | 通过 |  |
| 30 | `scgi_store` | 通过 | 复审通过 | 复审 1：已解决（原退回：功能：缺 `u->conf = &scf->upstream` 与 `u->st…） |
| 31 | `scgi_store_access` | 通过 | 复审通过 | 复审 1：已解决（原退回：功能：`ext.access = u->conf->store_access`（…） |
| 32 | `scgi_buffering` | 通过 | 复审通过 | 复审 1：已解决（原退回：功能：“X-Accel-Buffering 可改写 u->buffering”读…） |
| 33 | `scgi_request_buffering` | 通过 | 通过 |  |
| 34 | `scgi_ignore_client_abort` | 通过 | 复审通过 | 复审 1：已解决（原退回：功能：`u->conf->ignore_client_abort`（upstre…） |
| 35 | `scgi_bind` | 通过 | 通过 |  |
| 36 | `scgi_socket_keepalive` | 通过 | 通过 |  |
| 37 | `scgi_connect_timeout` | 通过 | 通过 |  |
| 38 | `scgi_send_timeout` | 通过 | 通过 |  |
| 39 | `scgi_buffer_size` | 通过 | 通过 |  |
| 40 | `scgi_pass_request_headers` | 通过 | 复审通过 | 复审 2：已解决 |
| 41 | `scgi_pass_request_body` | 通过 | 复审通过 | 复审 2：已解决 |
| 42 | `scgi_intercept_errors` | 通过 | 通过 |  |
| 43 | `scgi_read_timeout` | 通过 | 通过 |  |
| 44 | `scgi_buffers` | 通过 | 通过 |  |
| 45 | `scgi_busy_buffers_size` | 通过 | 通过 |  |
| 46 | `scgi_force_ranges` | 通过 | 通过 |  |
| 47 | `scgi_limit_rate` | 通过 | 通过 |  |
| 48 | `scgi_cache` | 通过 | 通过 |  |
| 49 | `scgi_cache_key` | 通过 | 复审通过 | 复审 1：已解决（原退回：功能：note 称 ngx_http_upstream_cache 调用 `u-…） |
| 50 | `scgi_cache_path` | 通过 | 通过 |  |
| 51 | `scgi_cache_bypass` | 通过 | 通过 |  |
| 52 | `scgi_no_cache` | 通过 | 通过 |  |
| 53 | `scgi_cache_valid` | 通过 | 通过 |  |
| 54 | `scgi_cache_min_uses` | 通过 | 通过 |  |
| 55 | `scgi_cache_max_range_offset` | 通过 | 通过 |  |
| 56 | `scgi_cache_use_stale` | 复审通过 | 通过 | 复审 1：已解决（原退回：语法：语法漏列取值表中的 `non_idempotent`（ngx_http_s…） |
| 57 | `scgi_cache_methods` | 通过 | 通过 |  |
| 58 | `scgi_cache_lock` | 通过 | 通过 |  |
| 59 | `scgi_cache_lock_timeout` | 通过 | 通过 |  |
| 60 | `scgi_cache_lock_age` | 通过 | 通过 |  |
| 61 | `scgi_cache_revalidate` | 通过 | 复审通过 | 复审 2：已解决 |
| 62 | `scgi_cache_background_update` | 通过 | 通过 |  |
| 63 | `scgi_temp_path` | 通过 | 通过 |  |
| 64 | `scgi_max_temp_file_size` | 通过 | 通过 |  |
| 65 | `scgi_temp_file_write_size` | 通过 | 通过 |  |
| 66 | `scgi_next_upstream` | 复审通过 | 通过 | 复审 1：已解决（原退回：语法：语法漏列取值表中的 `updating`（同表第 87 行，源码可解析），…） |
| 67 | `scgi_next_upstream_tries` | 通过 | 通过 |  |
| 68 | `scgi_next_upstream_timeout` | 通过 | 通过 |  |
| 69 | `scgi_param` | 通过 | 通过 |  |
| 70 | `scgi_pass_header` | 通过 | 通过 |  |
| 71 | `scgi_hide_header` | 通过 | 通过 |  |
| 72 | `scgi_ignore_headers` | 复审通过 | 通过 | 复审 1：已解决（原退回：语法：`field ...` 未列 `ngx_http_upstream_ign…） |

## 退回清单

### 语法（4）

| ID | 问题 | 应如何修正 |
|---|---|---|
| `nginx--ngx_http_scgi_module--scgi_next_upstream` | 语法列了 `non_idempotent` 但漏 `updating`。`ngx_http_scgi_next_upstream_masks`（scgi.c:77-90，已在 implementation-0 内）第 87 行有 `{ "updating", NGX_HTTP_UPSTREAM_FT_UPDATING }`，bitmask setter（ngx_conf_file.c:1389-1431）逐项查表，故 `scgi_next_upstream updating;` 可被接受。实施者自己在 note 与报告里承认漏列却判 verified，与统一尺度（裁定 2）冲突。 | `corrections.syntax`：`scgi_next_upstream error | timeout | invalid_header | http_500 | http_503 | http_403 | http_404 | http_429 | non_idempotent | updating | off ...;`，reason：取值表多出 `updating`（scgi.c:87）；note 删去“与语法一致”的说法，改为“表内全部取值均已列出；updating 仅在 cache_use_stale 判断中有意义”。source_ids 不变（已含 implementation-0）。 |
| `nginx--ngx_http_scgi_module--scgi_cache_use_stale` | 同一张掩码表，语法列了 `updating` 但漏 `non_idempotent`（scgi.c:81）。 | `corrections.syntax`：`scgi_cache_use_stale error | timeout | invalid_header | non_idempotent | updating | http_500 | http_503 | http_403 | http_404 | http_429 | off ...;`，reason 同上；note 改写，source_ids 不变。 |

| `nginx--ngx_http_grpc_module--grpc_ignore_headers`、`nginx--ngx_http_scgi_module--scgi_ignore_headers`（语法） | `ngx_conf_set_bitmask_slot` 只接受 `ngx_http_upstream_ignore_headers_masks` 的 9 个取值：X-Accel-Redirect、X-Accel-Expires、X-Accel-Limit-Rate、X-Accel-Buffering、X-Accel-Charset、Expires、Cache-Control、Set-Cookie、Vary；语法写占位符 `field ...`，没有列出任何关键字。B03 已对 `proxy_ignore_headers` 按裁定 2 列举取值，同一尺度。 | `corrections.syntax`：`grpc_ignore_headers X-Accel-Redirect | X-Accel-Expires | X-Accel-Limit-Rate | X-Accel-Buffering | X-Accel-Charset | Expires | Cache-Control | Set-Cookie | Vary ...;`（scgi 同理，`scgi_ignore_headers`）；source_ids 增加取值表片段（新增 evidence，指向 `ngx_http_upstream.c` 中 `ngx_http_upstream_ignore_headers_masks[]` 取值表，行号以 revision 实读为准），note 改写。 |

### 功能（12）

| ID | 问题 | 应如何修正 |
|---|---|---|
| `nginx--ngx_http_grpc_module--grpc_ignore_headers` | **summary 有误导**，见下“判定”。 | 见下“判定”给出的 corrections 与补充 evidence。 |
| `nginx--ngx_http_grpc_module--grpc_ssl_session_reuse` | 运行期效果取决于 `u->conf->ssl_session_reuse`（upstream.c:1725），所引片段只有 set_ssl 中 `glcf->upstream.ssl_session_reuse` 的直接读取与 upstream.c 的使用点，缺 `u->conf = &glcf->upstream;`（grpc.c:587）。该条 summary source_ids 含 `ssl-setup-binding`（merge 区域），不含 handler 片段。 | summary source_ids 追加已有来源 `upstream-binding`（grpc.c:559-601，含 587 行），note 补一句“handler 令 u->conf=&glcf->upstream”。 |
| `nginx--ngx_http_grpc_module--grpc_ssl_name` | 同上：`ngx_http_upstream_ssl_name` 读 `u->conf->ssl_name / ssl_server_name`（upstream.c:1705、1864、1899），`u->conf` 绑定缺失。 | 追加 `upstream-binding`。 |
| `nginx--ngx_http_grpc_module--grpc_ssl_server_name` | 同上：`u->conf->ssl_server_name`（upstream.c:1705、1899）。 | 追加 `upstream-binding`。 |
| `nginx--ngx_http_grpc_module--grpc_ssl_verify` | 同上：握手后检查走 `u->conf->ssl_verify`（upstream.c:1705、1794）；set_ssl 中 `glcf->upstream.ssl_verify` 的加载 CA 部分为直接读取，不受影响。 | 追加 `upstream-binding`。 |
| `nginx--ngx_http_grpc_module--grpc_ssl_certificate` | 含变量证书路径的运行期分支走 `u->conf->ssl_certificate`（upstream.c:1713、1957），note 已写该分支，但缺绑定。 | 追加 `upstream-binding`。 |
| `nginx--ngx_http_grpc_module--grpc_ssl_certificate_key` | 同上（upstream.c:1970 `u->conf->ssl_certificate_key`）。 | 追加 `upstream-binding`。 |
| `nginx--ngx_http_scgi_module--scgi_buffering` | summary 末句“X-Accel-Buffering 头可在未 ignore 时改写 u->buffering”依赖 `u->conf->ignore_headers`、`u->conf->change_buffering`（upstream.c:5119、5123）；summary source_ids 的 implementation-0 只覆盖 scgi.c:528-540，不含 512 行 `u->conf = &scf->upstream;`。 | summary source_ids 追加 `upstream-binding`（scgi.c:499-549）。 |
| `nginx--ngx_http_scgi_module--scgi_store` | summary 的“init_request 取 u->store=conf->store”“store_lengths 来自 conf”“temp_path”全部经 `u->conf`；source_ids（configuration-definition、implementation-0/1/2、summary-store-pipe）既无 `u->conf = &scf->upstream;`（scgi.c:512）也无 `u->store = u->conf->store;`（upstream.c:612）。即配置值如何进入 `u->store` 的第一环缺失。 | 追加 `upstream-binding`（scgi.c:499-549）；新增 evidence（如 `summary-init-store`，`src/http/ngx_http_upstream.c` 610-613，含 `u->store = u->conf->store;`）并列入 source_ids。 |
| `nginx--ngx_http_scgi_module--scgi_store_access` | `ext.access = u->conf->store_access`（upstream.c:4279）依赖 `u->conf`，summary source_ids 无 `upstream-binding`。 | 追加 `upstream-binding`。（可选：为“目录”权限补 `ngx_dir_access` 宏定义，见建议。） |
| `nginx--ngx_http_scgi_module--scgi_ignore_client_abort` | `u->conf->ignore_client_abort`（upstream.c:614）依赖 `u->conf`，summary source_ids 无 `upstream-binding`。 | 追加 `upstream-binding`。 |
| `nginx--ngx_http_scgi_module--scgi_cache_key` | note 说“ngx_http_upstream_cache 随后调用 ngx_http_file_cache_create_key”，且 `u->create_key(r)` 把 scgi 的 create_key 调起来，但所引片段只有 `ngx_http_scgi_create_key` 定义（implementation-0）和 `ngx_http_file_cache_create_key` 定义（implementation-2）；调用点 `if (u->create_key(r) != NGX_OK)`（upstream.c:854）与 `ngx_http_file_cache_create_key(r);`（860）不在任何片段内，u->create_key 赋值（scgi.c:518）之后到被调用之间缺环。 | 新增 evidence（如 `summary-cache-call`，`src/http/ngx_http_upstream.c` 850-860），列入 source_ids；note 写明“handler 设 u->create_key → ngx_http_upstream_cache 调 u->create_key(r) 取得 keys → ngx_http_file_cache_create_key 计算散列”。 |

## 实施者疑点的判定

### scgi_next_upstream 语法：**退回**（同意按统一尺度）

实施者在 B05-report 自审发现 2 与 syntax note 中均写明“表内还接受 `updating`，语法未列，判 verified”。`ngx_conf_set_bitmask_slot`（ngx_conf_file.c:1402-1428）逐个参数在 `ngx_http_scgi_next_upstream_masks` 中匹配，匹配到即置位、未匹配才报 invalid value，`updating` 在表内（scgi.c:87），所以源码接受而语法未列，属裁定 2 的“少列取值”。修正见上；`scgi_cache_use_stale` 反向漏列 `non_idempotent` 同理退回（实施者同样自述）。grpc 侧 `grpc_next_upstream` 取值表（grpc.c:219-233）12 项与语法 12 项逐一相同，通过；`grpc_ssl_protocols` 6 项相同，通过。

### grpc_ignore_headers 的 summary：**存在误导，退回**

现 summary：“禁止指定gRPC响应头触发共享upstream的特殊处理。”现 note：“…handler 与 ngx_http_upstream_process_headers 对 X-Accel-Redirect、X-Accel-Limit-Rate/Buffering/Charset/Expires、Expires、Cache-Control、Set-Cookie、Vary 逐项检测 ignore_headers 对应位，置位则不做该头的特殊处理。”

我按 revision 核对了 grpc 自己的路径：

- grpc handler（grpc.c:559-601）设置了 `u->conf`、`create_request` 等回调，**没有** `u->caches`、`u->create_key`（scgi 有，见 scgi.c:517-518）；grpc 模块全文无 `upstream.cache` 配置，`ngx_http_grpc_create_loc_conf`（grpc.c:4338-4413）`ngx_pcalloc` 后 `upstream.cache` 为 0。`ngx_http_upstream_init_request` 只在 `u->conf->cache` 为真时才调 `ngx_http_upstream_cache`（upstream.c:571），`ngx_http_file_cache_new` 只在该函数内被调用（850），因此 grpc 的 `r->cache` 恒为 NULL。
- 所引的 ign-cache-control / ign-expires / ign-xa-expires / ign-vary 片段，在检测 ignore 位之后都有 `if (r->cache == NULL) return NGX_OK;`（4837、4974、5029、5261），在 grpc 下本就无后续动作；ign-set-cookie 只在非 ignore 时置 `u->cacheable = 0`，grpc 无缓存且 `buffering` 硬编码 0（grpc.c:4395，不走 `p->cacheable`），亦无可观察效果。
- 我额外发现：X-Accel-Buffering 对 grpc 也无效。`ngx_http_upstream_process_buffering`（upstream.c:5111-5145）只有 `u->conf->change_buffering` 为真才改 `u->buffering`；grpc 模块全文没有设置 `change_buffering`（scgi.c:1335、fastcgi、uwsgi、proxy 均显式置 1），故保持 0。note 与自审发现 1 都没提这一点。
- 对 grpc 真正有后续动作的只有 X-Accel-Redirect（process_headers 内 `x_accel_redirect` 判断，upstream.c:2829）、X-Accel-Limit-Rate（5095，设 `r->limit_rate`）、X-Accel-Charset（5156，设 `override_charset`）。

因此 summary 字面成立（“置位则不触发”），但读者会据此以为在 grpc 上 `grpc_ignore_headers Cache-Control Expires …` 有意义；note 也把 9 个头一并当作“逐项生效”，并未证明 grpc 的 `r->cache` 为空。按项目“只陈述源码能证明的范围”，应收窄。**修正方案（任选其一，推荐 A）**：

- A：`corrections.summary`：`禁止指定gRPC响应头触发共享upstream的特殊处理；gRPC不启用缓存且不允许改写缓冲方式，实际有后续动作的只有 X-Accel-Redirect、X-Accel-Limit-Rate、X-Accel-Charset，Cache-Control、Expires、X-Accel-Expires、Vary、Set-Cookie、X-Accel-Buffering 在gRPC下无后续动作。` reason：grpc 无 u->caches/create_key 与 upstream.cache，r->cache 恒为空；change_buffering 未置位。同时新增 evidence：upstream.c:567-578（`if (u->conf->cache)` 才进缓存）、grpc.c:4338-4350 与 4392-4412（pcalloc 与硬编码值，不含 cache/change_buffering），`upstream-binding` 已含 handler 无 caches 的整段。note 改写，不再声称对全部 9 个头生效。
- B：保留原文，但 summary_evidence 降为 `unverified`，note 写“grpc 下缓存类与 X-Accel-Buffering 位无后续动作，summary 未区分”。

scgi 侧 `scgi_ignore_headers` 有 `u->caches/create_key`（scgi.c:517-518）与 `change_buffering = 1`（scgi.c:1335），九个头均有实际效果，summary 不误导，通过。

## 逐条说明（通过项要点）

- grpc_pass/bind/socket_keepalive/各 timeout/intercept_errors/buffer_size/next_upstream*/set_header/pass_header/hide_header：`upstream-binding`（grpc.c:559-601）含 587 行 `u->conf = &glcf->upstream;`，共享逻辑片段与 summary 的每句对应；grpc_connect/send/read_timeout 均含发行补丁 `upstream_timeout_fields`，且 send_timeout 的新片段 2312-2325 与 pipelining 补丁改动行不冲突。
- grpc_ssl_protocols/ciphers/verify_depth/trusted_certificate/crl/password_file/conf_command：值由 `ngx_http_grpc_set_ssl`（4935 起）在 merge 阶段直接读取并传入 ngx_ssl_*，无 u->conf 中间环，通过。grpc_ssl_conf_command 的 ALPN `h2` 设置是附带逻辑，summary 未涉及。
- scgi 各缓冲/超时/缓存/锁/重试/参数/头隐藏类条目：`upstream-binding`（scgi.c:499-549）均已列入，链路完整。scgi_cache_path 的 manager/loader/inactive/use_temp_path 均有使用点片段；scgi_cache_min_uses 经 cache-open-scarce 补上 NGX_AGAIN→SCARCE 一环；scgi_request_buffering 的新片段 195-221、440-462 直接证明 no_buffering 下首批数据即调用 post_handler。
- 语法侧：各 setter 的 registration 标志与 summary 的参数个数一致；自定义解析函数（grpc_pass、scgi_pass、scgi_store、scgi_cache、scgi_cache_key、scgi_cache_path、grpc_ssl_password_file、scgi_param 的 `ngx_http_upstream_param_set_slot`）均引用了实际解析片段。scgi_cache_path 的 12 项 key=value 与 `ngx_http_file_cache_set_slot`（2379-2722）逐项一致，未多列（1.27.1 无 purger）。

## 建议（不计退回）

1. 链路中的“同函数局部取值”：`ngx_http_scgi_create_request` / `ngx_http_grpc_create_request` 开头的 `scf = ngx_http_get_module_loc_conf(r, …)` / `glcf = …` 不在 grpc_set_header、scgi_pass_request_headers、scgi_pass_request_body 所引片段内（scgi_param 的 implementation-0 含该行）。它与 `u->conf = …` 不同，是同一函数内的局部变量，且片段中类型与字段名一一对应，我按“通过”处理（与 B13 报告的 A 类处理一致）；若主线程认为该尺度也适用，应对这三条（以及 grpc_set_header）一并追加该行。
2. scgi_cache_path：summary 中“loader_sleep”的使用点在 `ngx_http_file_cache_loader_sleep` 函数体（片段仅含其调用）；`levels` 的层级生成在 `ngx_create_hashed_filename`（片段仅含调用）。均有函数名与调用，判通过，但可补函数体。
3. scgi_store_access：“目录”权限依赖 `ngx_dir_access()` 宏（ngx_files.h），片段仅有调用；判通过，可补宏定义。
4. grpc/scgi_ignore_headers：header 名到 handler 的映射表 `ngx_http_upstream_headers_in[]`（upstream.c 约 150-330）未引，handler 与头名的对应靠函数命名；B03 同类条目同样通过，不计退回。另 B03 对 `proxy_ignore_headers` 采用 corrections 把 `field ...` 改为列出 9 个取值；B05 保留 `field ...` 占位；本次复核按 B03 同一尺度改判退回（见语法退回清单）。
5. grpc_ssl_certificate_key 等源码另接受 `data:` / `engine:` 前缀，语法为占位符 `file`，不属于列举关键字；与 B03 对 `proxy_ssl_certificate_key` 的处理一致，未退回。

## 计数

| 字段 | 通过 | 退回 |
|---|---|---|
| syntax | 68 | 4（scgi_next_upstream、scgi_cache_use_stale、grpc_ignore_headers、scgi_ignore_headers） |
| summary | 60 | 12（grpc 7：ignore_headers、ssl_session_reuse、ssl_name、ssl_server_name、ssl_verify、ssl_certificate、ssl_certificate_key；scgi 5：buffering、store、store_access、ignore_client_abort、cache_key） |

退回条目（ID 去重）共 15：scgi_next_upstream、scgi_cache_use_stale、grpc_ignore_headers、scgi_ignore_headers、grpc_ssl_session_reuse、grpc_ssl_name、grpc_ssl_server_name、grpc_ssl_verify、grpc_ssl_certificate、grpc_ssl_certificate_key、scgi_buffering、scgi_store、scgi_store_access、scgi_ignore_client_abort、scgi_cache_key。无“证据不足属实”或“可晋级”项（本批无 unverified）。

## 构建检查

`node scripts/build.mjs --config project.config.json --check`：退出码 0；B05 `syntax_verified 72 / summary_verified 72 / entries 72`，全库 1041 条。该检查只验证机械可核项，不能发现上述 13 处语义缺口。


---

## 复审 1（修复轮次 1 后）

复核依据：review-brief 裁定 1–6；JSON 修改时间 22:03；所有新增 evidence 按 revision（e06bdbd4…）与行号逐段读取；`--check` 退出码 0（B05 72/72 verified）。

**结论：有退回（新发现 4 条 summary；原 16 处全部 ADDRESSED）。**

### （1）原 16 处逐条

| ID | 字段 | 判定 | 依据 |
|---|---|---|---|
| scgi_next_upstream | syntax | ADDRESSED | corrections 列全 11 项（含 updating、off），与 scgi.c:77-90 取值表逐项一致；source_ids 含该表 |
| scgi_cache_use_stale | syntax | ADDRESSED | corrections 补 non_idempotent，11 项与同表一致 |
| grpc_ignore_headers | syntax | ADDRESSED | 列出 9 个取值，与 upstream.c:460-471 一致，source_ids 含取值表 |
| scgi_ignore_headers | syntax | ADDRESSED | 同上 |
| grpc_ignore_headers | summary | ADDRESSED | cache-gate（upstream.c:567-579）、grpc-loc-create（grpc.c:4338-4413）属实；我另在 revision 上对 grpc.c 全文检索 `change_buffering`、`upstream.cache`、`caches`、`create_key`、`r->cache`、`u->cacheable` 均无命中，“r->cache 恒空、X-Accel-Buffering 不生效”成立；X-Accel-Redirect/Limit-Rate/Charset 由 2825-2832、5092-5163 支撑 |
| grpc_ssl_session_reuse / ssl_name / ssl_server_name / ssl_verify / ssl_certificate / ssl_certificate_key | summary | ADDRESSED | 6 条均已含 upstream-binding（grpc.c:559-601，含 587 行 `u->conf = &glcf->upstream`） |
| scgi_buffering / scgi_store / scgi_store_access / scgi_ignore_client_abort | summary | ADDRESSED | 均含 upstream-binding（scgi.c:499-549，含 512 行）；scgi_store 另有 summary-init-store（upstream.c:610-613，含 612 行 `u->store = u->conf->store`） |
| scgi_cache_key | summary | ADDRESSED | summary-cache-call（upstream.c:850-860）含 854 `u->create_key(r)` 与 860 `ngx_http_file_cache_create_key(r)`；scgi.c:518 赋值行在 upstream-binding 内，链路闭合 |

### （2）新片段与 corrections 属实性

新增 evidence 行号与原文均无偏移，corrections 文字与取值表一致，未引入新错误。非阻塞提示：grpc_ignore_headers 的 summary 说 Set-Cookie “无后续动作”，严格说该位仍门控 `u->cacheable = 0` 赋值（upstream.c:4804-4806），但 grpc 下 `u->cacheable` 只在缓存路径被置 1（upstream.c:873），故该赋值无可观察效果；建议措辞为“无可观察效果”，不计退回。

### （3）create_request 局部取值行（裁定 1/5）

我用脚本逐条检查：summary 片段中凡出现 `scf->` / `glcf->` / `params->`，其所在函数内的赋值行是否也在该条 summary 的片段内。结果：以下 4 条 summary 依赖这些局部变量读到的配置值，但赋值行不在片段内，按裁定 1/5 退回；其余（含 scgi_param，其 implementation-0 为 651-703，已含 667、670-672）通过。grpc_pass 的 implementation-3 虽含 `glcf->host_set`，但其 summary 不依赖该值，不计；scgi_request_buffering 的 952 行同理不计。

| ID | 字段 | 问题 | 应如何修正 |
|---|---|---|---|
| grpc_set_header | summary | summary 依赖 `glcf->headers.lengths/values/hash`、`glcf->host_set`、`glcf->upstream.pass_request_headers`（grpc.c:979、990、994、1050、1066），而 `glcf = ngx_http_get_module_loc_conf(r, ngx_http_grpc_module);`（grpc.c:729，同在 create_request 内）不在任何片段 | 新增单行/短片段 evidence（grpc.c:729）并列入 summary source_ids；note 补一句 |
| scgi_pass_request_headers | summary | 依赖 `scf->upstream.pass_request_headers`（scgi.c:705、872）与 `params->number/hash`（714、750、775）；`scf =`（667）与 `params = …`（669-673）不在片段（implementation-0 起于 705） | 新增 evidence 覆盖 scgi.c:667-673，并列入 source_ids |
| scgi_pass_request_body | summary | 依赖 `scf->upstream.pass_request_body`（scgi.c:952）；`scf =`（667）不在片段（implementation-1 为 651-662，止于 667 之前） | 新增 evidence 覆盖 scgi.c:667（可与上条共用 667-673 片段）并列入 source_ids |
| scgi_cache_revalidate | summary | 依赖 `scf->params_cache`（scgi.c:670），implementation-1 仅 669-673，缺 667 行 `scf =` | 将 implementation-1 范围外另加 evidence 667 单行，或新增 667-673 片段并列入 source_ids |

### 复审后计数

| 字段 | 通过 | 退回 |
|---|---|---|
| syntax | 72 | 0 |
| summary | 68 | 4（grpc_set_header、scgi_pass_request_headers、scgi_pass_request_body、scgi_cache_revalidate） |

仍未通过的 ID：4 个。上方“总表”中原 15 个 ID 的行已改为“复审通过”，4 个新退回行已标注。


---

## 复审 2（修复轮次 2 后）

按 revision（e06bdbd4…）实读新片段：`summary-loc-conf`（grpc.c:727-729）含 `glcf = ngx_http_get_module_loc_conf(r, ngx_http_grpc_module);`（729）；`summary-loc-conf`（scgi.c:667-673）含 667 行 `scf = …` 与 670/672 行 `params = …`，并含 `#endif`。我重跑了“局部变量赋值行是否在片段内”的脚本，除前述已判不依赖的 grpc_pass 外无剩余缺口。`--check` 退出码 0，B05 72/72 verified。

| ID | 字段 | 判定 | 依据 |
|---|---|---|---|
| grpc_set_header | summary | ADDRESSED | source_ids 含 summary-loc-conf（729 行 glcf 取值），与 upstream-binding、implementation-3/4 闭环 |
| scgi_pass_request_headers | summary | ADDRESSED | 含 summary-loc-conf（667-673，覆盖 scf 与 params 赋值），依赖 705/714/775/872 行读取的值均闭环 |
| scgi_pass_request_body | summary | ADDRESSED | 含 summary-loc-conf，覆盖 952 行 `scf->upstream.pass_request_body` 的来源 |
| scgi_cache_revalidate | summary | ADDRESSED | 含 summary-loc-conf，覆盖 670 行 `scf->params_cache` 的来源 |
| scgi_request_buffering（顺带） | summary | 通过 | 追加片段无副作用 |
| grpc_ignore_headers（措辞） | summary | 通过 | corrections 改为“Set-Cookie 无可观察效果”，与 ign-set-cookie 及 `u->cacheable` 仅在缓存路径置 1（upstream.c:873）一致 |

### 复审后计数

| 字段 | 通过 | 退回 |
|---|---|---|
| syntax | 72 | 0 |
| summary | 72 | 0 |

**结论：B05 全部通过，无未解决项。**
