# B06 独立审核（ngx_http_uwsgi_module，60 条 × syntax/summary）

审核方式：逐条打开 `source_ids` 指向的片段。已有来源取自 `dist/knowledge/releases/1.27.1.1-f43ab3d7392bdcc9/directives/<id>.json` 的 `sources[].code`，并与 nginx `release-1.27.1`（`e06bdbd4…`）的 `git show` 逐一比对，60 条全部一致，无行号偏移。新增 19 个片段按 `file:start-end` 实际读取，ID 与条目已有来源均无冲突。`source_ids` 全部可解析。按统一尺度检查中间赋值行（`uwcf = ngx_http_get_module_loc_conf`、`u->conf = &uwcf->upstream`、`u->create_key = …`）和取值表完整性。补丁来源（`upstream_timeout_fields`、`upstream_pipelining`、`no_error_pages`）已对照补丁原文，不改变所引陈述。

## 结论：有退回

退回 4 条：syntax 2 条，summary 2 条（4 个不同 ID）。

## 总表

“通过”＝实施者的 verified 判定经复核成立。ID 省略 `nginx--ngx_http_uwsgi_module--` 前缀。

| ID | syntax | summary | 退回原因（一句） |
| --- | --- | --- | --- |
| uwsgi_pass | 通过 | 通过 |  |
| uwsgi_modifier1 | 通过 | 通过 |  |
| uwsgi_modifier2 | 通过 | 通过 |  |
| uwsgi_store | 通过 | 通过 |  |
| uwsgi_store_access | 通过 | 通过 |  |
| uwsgi_buffering | 通过 | 通过 |  |
| uwsgi_request_buffering | 通过 | 通过（复审1 ADDRESSED） | 已修复 |
| uwsgi_ignore_client_abort | 通过 | 通过 |  |
| uwsgi_bind | 通过 | 通过 |  |
| uwsgi_socket_keepalive | 通过 | 通过 |  |
| uwsgi_connect_timeout | 通过 | 通过 |  |
| uwsgi_send_timeout | 通过 | 通过 |  |
| uwsgi_buffer_size | 通过 | 通过 |  |
| uwsgi_pass_request_headers | 通过 | 通过 |  |
| uwsgi_pass_request_body | 通过 | 通过 |  |
| uwsgi_intercept_errors | 通过 | 通过 |  |
| uwsgi_read_timeout | 通过 | 通过 |  |
| uwsgi_buffers | 通过 | 通过 |  |
| uwsgi_busy_buffers_size | 通过 | 通过 |  |
| uwsgi_force_ranges | 通过 | 通过 |  |
| uwsgi_limit_rate | 通过 | 通过 |  |
| uwsgi_cache | 通过 | 通过 |  |
| uwsgi_cache_key | 通过 | 通过（复审1 ADDRESSED） | 已修复 |
| uwsgi_cache_path | 通过 | 通过 |  |
| uwsgi_cache_bypass | 通过 | 通过 |  |
| uwsgi_no_cache | 通过 | 通过 |  |
| uwsgi_cache_valid | 通过 | 通过 |  |
| uwsgi_cache_min_uses | 通过 | 通过 |  |
| uwsgi_cache_max_range_offset | 通过 | 通过 |  |
| uwsgi_cache_use_stale | 通过（复审1 ADDRESSED） | 通过 | 已修复 |
| uwsgi_cache_methods | 通过 | 通过 |  |
| uwsgi_cache_lock | 通过 | 通过 |  |
| uwsgi_cache_lock_timeout | 通过 | 通过 |  |
| uwsgi_cache_lock_age | 通过 | 通过 |  |
| uwsgi_cache_revalidate | 通过 | 通过 |  |
| uwsgi_cache_background_update | 通过 | 通过 |  |
| uwsgi_temp_path | 通过 | 通过 |  |
| uwsgi_max_temp_file_size | 通过 | 通过 |  |
| uwsgi_temp_file_write_size | 通过 | 通过 |  |
| uwsgi_next_upstream | 通过（复审1 ADDRESSED） | 通过 | 已修复 |
| uwsgi_next_upstream_tries | 通过 | 通过 |  |
| uwsgi_next_upstream_timeout | 通过 | 通过 |  |
| uwsgi_param | 通过 | 通过 |  |
| uwsgi_string | 通过 | 通过 |  |
| uwsgi_pass_header | 通过 | 通过 |  |
| uwsgi_hide_header | 通过 | 通过 |  |
| uwsgi_ignore_headers | 通过（复审1 新增 correction 核实） | 通过 | 已按裁定 2 列全 9 项 |
| uwsgi_ssl_session_reuse | 通过 | 通过 |  |
| uwsgi_ssl_protocols | 通过 | 通过 |  |
| uwsgi_ssl_ciphers | 通过 | 通过 |  |
| uwsgi_ssl_name | 通过 | 通过 |  |
| uwsgi_ssl_server_name | 通过 | 通过 |  |
| uwsgi_ssl_verify | 通过 | 通过 |  |
| uwsgi_ssl_verify_depth | 通过 | 通过 |  |
| uwsgi_ssl_trusted_certificate | 通过 | 通过 |  |
| uwsgi_ssl_crl | 通过 | 通过 |  |
| uwsgi_ssl_certificate | 通过 | 通过 |  |
| uwsgi_ssl_certificate_key | 通过 | 通过 |  |
| uwsgi_ssl_password_file | 通过 | 通过 |  |
| uwsgi_ssl_conf_command | 通过 | 通过 |  |

## 退回清单

### 1. `uwsgi_next_upstream`（syntax）
- 问题：语法列了 error | timeout | invalid_header | http_500 | http_503 | http_403 | http_404 | http_429 | non_idempotent | off，缺 `updating`。`ngx_http_uwsgi_next_upstream_masks`（uwsgi.c:111-124，已是 syntax 的 `implementation-0`）含 `{ ngx_string("updating"), NGX_HTTP_UPSTREAM_FT_UPDATING }`，`ngx_conf_set_bitmask_slot` 对表内名称一律接受。
- 修正：用 `corrections` 把语法补成 `uwsgi_next_upstream error | timeout | invalid_header | http_500 | http_503 | http_403 | http_404 | http_429 | non_idempotent | updating | off ...;`，引用已有的 `implementation-0`。同时删除 EVIDENCE.md 判据中“表另含 updating，语法未列”这句。

### 2. `uwsgi_cache_use_stale`（syntax）
- 问题：语法缺 `non_idempotent`。该指令与 next_upstream 共用同一张取值表，表内含 `non_idempotent`，因此被接受。
- 修正：用 `corrections` 把语法补成 `uwsgi_cache_use_stale error | timeout | invalid_header | non_idempotent | updating | http_500 | http_503 | http_403 | http_404 | http_429 | off ...;`，引用已有的 `implementation-0`。同时删除判据中“表另含 non_idempotent，语法未列全”这句。

### 3. `uwsgi_request_buffering`（summary）
- 问题：summary 的 `source_ids` 含 `implementation-0`（uwsgi.c:723-730）。该片段读取 `uwcf->upstream.request_buffering` 和 `uwcf->upstream.pass_request_body`，但 `uwcf = ngx_http_get_module_loc_conf(r, ngx_http_uwsgi_module);`（uwsgi.c:666）不在任何所引片段内。这个条目的 summary 也没有 `upstream-binding`，所以 uwcf 的来源缺环。B04 对 `fastcgi_request_buffering` 同类问题已按此标准退回。
- 修正：把 `upstream-binding`（666-730，已含 723-730）加入 summary 的 `source_ids`，`implementation-0` 可保留或去掉。文字不用改。

### 4. `uwsgi_cache_key`（summary）
- 问题：note 称 `ngx_http_upstream_cache` 调用 `u->create_key=ngx_http_uwsgi_create_key`，后者求值 `cache_key`，`ngx_http_file_cache_create_key` 再算 MD5/CRC32。所引片段只有被调函数的定义（`ngx_http_uwsgi_create_key` 824-842、`ngx_http_file_cache_create_key` 228-261）。三处连接都缺：
  - 赋值 `u->create_key = ngx_http_uwsgi_create_key;`（uwsgi.c:695-700，`upstream-binding` 内）；
  - 调用 `u->create_key(r)`（upstream.c:854）；
  - 调用 `ngx_http_file_cache_create_key(r)`（upstream.c:860）。
  B05 对 `scgi_cache_key` 同类问题已按此标准退回。
- 修正：把 `upstream-binding` 加入 summary `source_ids`，再新增 evidence，例如 `summary-create-key-call` = `src/http/ngx_http_upstream.c` 850-860，同样加入 `source_ids`。

## 关于 `uwsgi_request_buffering` 在 chunked / pass_request_body 关闭时不生效、未写入文字：是否构成误导

判定：不构成误导，不需要改 summary 文字。

- summary 原文“控制是否完整读取客户端正文后才向uWSGI上游发送请求”描述的是指令的作用，不是对所有请求的无条件保证。
- 例外条件已在同一条目的 `limitations` 里写明（基线发布 JSON）：“关闭仅在pass_request_body开启且非chunked时设置流式请求体标志；HTTP/1.1 chunked仍缓冲”。读者看到的是 summary 与 limitations 合在一起。
- 源码证据成立：handler 723-728 的三个条件（`!request_buffering && pass_request_body && !chunked`）才置 `request_body_no_buffering=1`，不满足时走缓冲。
- `review-brief` 与 `batch-brief` 都规定“原文只是不够完整但不错误时，不要改写”。B03 的 `proxy_request_buffering` 也按同一口径通过。
- 实施者自述的第 1 条顾虑（把两个例外只写进 note）可以接受。

附带说明：`summary-body-wait`（request_body.c 456-459）这 4 行本身只是“有缓冲时才在函数尾部调用 post_handler”。“要等正文读完”是靠它上方的循环只在 `rest==0` 时才会走到这里，这一点没在片段里。这只是证据偏薄，与 B03 口径一致，我没有因此退回。

## 其他核对结论（均通过）

- 取值表完整性：
  - `uwsgi_ssl_protocols` 语法 SSLv2/SSLv3/TLSv1/TLSv1.1/TLSv1.2/TLSv1.3 与 `ngx_http_uwsgi_ssl_protocols`（129-137）六项完全一致，不多不少。
  - `uwsgi_cache_methods` 语法 GET | HEAD | POST 与 `ngx_http_upstream_cache_method_mask` 一致。
  - `uwsgi_ignore_headers` 的 `field ...` 是泛称，实际 9 项在取值表中；本批不改（B03/B04 同口径）。
  - `uwsgi_cache_path` 的语法 12 项 key=value（levels、use_temp_path、keys_zone、inactive、max_size、min_free、manager_*/loader_* 各三项）与 `ngx_http_file_cache_set_slot` 逐项一致，1.27.1 没有 `purger*`，未多列。
  - `uwsgi_cache_valid` 的 `[code ...] time` 沿用 B03 对 `proxy_cache_valid` 的口径，`any` 不单列（建议主线程如要改，需四个模块同时改）。
- `u->conf = &uwcf->upstream`（uwsgi.c:690）与其上的 `uwcf` 取值行都在 `upstream-binding`（666-730）内。除上面第 3 条外，所有经 `u->conf` 进入共享逻辑的 summary 都带了这个片段。`ssl_*` 类经 `ngx_http_uwsgi_set_ssl(cf, uwcf)` 直接读取，`conf->ssl` 守卫在 `ssl-setup-binding`（1871-1914），无 u->conf 中间环。
- `uwsgi_ssl_trusted_certificate` 的 corrections（删“PEM”）有依据，最小化，无新错误。`uwsgi_ssl_crl` 有 `X509_FILETYPE_PEM`，保留“PEM”正确。
- 平台/编译条件（transparent、`!NGX_WIN32`、`NGX_HTTP_SSL`、`SSL_CONF_FLAG_FILE` 等）写在 note 里，summary 没有作无条件承诺，可以接受。
- `uwsgi_cache_background_update` 注册为 `NGX_CONF_TAKE1` + `ngx_conf_set_flag_slot`，实际只接受 on/off，语法正确。
- `uwsgi_ssl_certificate` 的“用于客户端身份认证”：证书绑定在 `NGX_SSL_CLIENT` 的连接/上下文上（1696-1697），按直接支撑口径可以接受，不收窄。

## 建议（不构成退回，口径与前面批次一致）

1. `uwsgi_store_access`、`uwsgi_param`、`uwsgi_cache_path` 的 summary `source_ids` 缺 `registration`。registration 的 `offsetof` 是指令到字段的连接，其中 `uwsgi_cache_path` 的 note 还明说了“注册的偏移指向 …caches”。B03 的 `proxy_store_access`、`proxy_cache_path` 和 B05 的 `scgi_param` 同样没引 registration 而通过，所以本批保持一致不退回；若主线程想收紧，应各批统一补。
2. `uwsgi_busy_buffers_size`：“未接收完时”只靠 `summary-pipe-ended`（event_pipe.c 539-541，三行）。上游结束分支的 `break` 与整体冲出在 542-597，不在片段内。B05 的 `scgi_busy_buffers_size` 同样表述且通过，本批保持一致；最好把片段扩到 539-597。
3. `uwsgi_ssl_password_file`：`ngx_ssl_certificate` 内把 `passwords` 传给 `ngx_ssl_load_certificate_key` 的调用在 event_openssl.c:553、`SSL_CTX_use_PrivateKey` 在 564，而所引 `ngx_ssl_certificate` 片段只到 476。动态路径的传递在 1951-1987 与 624-644，未引。与 B05 `grpc_ssl_password_file`、B03 `proxy_ssl_password_file` 同口径通过；如要补，加 553-566 的片段即可。`uwsgi_ssl_certificate_key` 同理。
4. `uwsgi_param` 的 note 写了“位于 4 字节包头之后、HTTP_ 请求头参数之前”，所引片段里没有 HTTP_ 头参数的循环（1091-1174 不在其 source_ids 内）。summary 本身没有这个顺序陈述，不影响判定，建议删去 note 里这半句。

## 计数

| 字段 | 通过 | 退回 |
| --- | --- | --- |
| syntax | 58 | 2 |
| summary | 58 | 2 |

没有“证据不足属实”或“可晋级”的条目（60 条均为 verified，且其中无应为 unverified 的）。

## `--check`

`node scripts/build.mjs --config project.config.json --check`：退出码 0。输出中 B06 为 `syntax_verified 60 / syntax_unverified 0 / summary_verified 60 / summary_unverified 0 / entries 60`，与实施报告一致；全局 `entries 1041`（`syntax_verified 539 / summary_verified 540`）。该检查只校验数据结构与引用解析，不判断退回项。


## 复审 1（修复轮次 1）

已重读 review-brief 裁定 1-6；新增片段与取值表均用 `git show release-1.27.1`（e06bdbd4）按行号读取。

### 1. 原退回 4 条
| ID | 字段 | 结论 | 依据 |
| --- | --- | --- | --- |
| uwsgi_next_upstream | syntax | ADDRESSED | corrections 补入 `updating`，与 `ngx_http_uwsgi_next_upstream_masks` 11 项（含 updating、non_idempotent、off）一致，无多列 |
| uwsgi_cache_use_stale | syntax | ADDRESSED | corrections 补入 `non_idempotent`，共用同一取值表，与表一致 |
| uwsgi_request_buffering | summary | ADDRESSED | source_ids 加入 `upstream-binding`（666-730，含 `uwcf=ngx_http_get_module_loc_conf` 666 行与 `u->conf=&uwcf->upstream` 690 行） |
| uwsgi_cache_key | summary | ADDRESSED | 加入 `upstream-binding`（695-700 含 `u->create_key=ngx_http_uwsgi_create_key`）与新片段 `summary-create-key-call`（upstream.c 850-860，实读为 `u->create_key(r)` 与 `ngx_http_file_cache_create_key(r)` 调用，行号无偏移） |

### 2. 新增 corrections 与片段
- `uwsgi_ignore_headers`（syntax）：补列 9 项 X-Accel-Redirect/X-Accel-Expires/X-Accel-Limit-Rate/X-Accel-Buffering/X-Accel-Charset/Expires/Cache-Control/Set-Cookie/Vary，与 `ngx_http_upstream_ignore_headers_masks`（upstream.c:460-470）逐项一致，无多无少；source_ids 含 `implementation-1`（取值表）。属实、无新错。
- `uwsgi_cache_path`（summary）：补 `upstream-binding`（`u->caches=&uwmcf->caches`，696-698 行实读存在），属实。
- 两条枚举 corrections 的文字与 note 前后一致；`--check` 通过。无新错。

### 3. 抽查“其余 summary 不经 u->conf 或已覆盖”（裁定 1/5）
- 全部 60 条中不含 `upstream-binding` 的 summary 共 9 条：`uwsgi_pass`、`uwsgi_modifier1/2`、`uwsgi_param`、`uwsgi_string`、`uwsgi_ssl_ciphers`、`uwsgi_ssl_verify_depth`、`uwsgi_ssl_trusted_certificate`、`uwsgi_ssl_crl`。
- modifier1/2、param、string 的陈述全在 `ngx_http_uwsgi_create_request` 内，经 `summary-req-conf`（863-873，取 `uwcf`）直接读 uwcf，不经 u->conf，成立。
- 4 条 ssl_* 由 `ngx_http_uwsgi_set_ssl(cf, uwcf)` 直接读 uwcf，经 `ssl-setup-binding` 覆盖，不经 u->conf，成立。
- `uwsgi_pass` 的陈述由 setter、content handler、create_request 登记及 `summary-ssl-start`（u->ssl 触发握手）支撑，未依赖 `u->conf` 读取值（`u->ssl=uwcf->ssl` 在 handler 666-678 的 `upstream-binding` 以外，但该陈述只说“suwsgi 置 uwcf->ssl、请求时 u->ssl 为真则握手”，由 implementation 片段覆盖），本轮维持通过。
- 其余 51 条 summary 均已含 `upstream-binding`。

### 复审结论
全部通过，退回 0 条。计数：syntax 通过 60 / 退回 0；summary 通过 60 / 退回 0。
`node scripts/build.mjs --config project.config.json --check` 退出码 0，B06 为 60/0、60/0。

遗留小提示（不构成退回）：`uwsgi_param` note 里“HTTP_ 请求头参数之前”无对应片段，建议删去；EVIDENCE.md 中 `uwsgi_ignore_headers` 条目是否同步了 correction 文字请主线程留意（`B06.json` 为准）。
