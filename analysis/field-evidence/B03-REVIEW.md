# B03 审核（ngx_http_proxy_module，68 条 × syntax / summary）

审核方式：逐条打开每个 `source_ids` 对应片段。已有来源对照 `dist/.../directives/<id>.json` 的 `sources[].code`，并抽验其与固定 revision 的 `git show` 一致（nginx 与 OpenResty 补丁均已逐行比对，全部 MATCH）。新增 evidence（49 个）全部用 `git -C repos/nginx show e06bdbd4…:<file>` 按行号读取。OpenResty 补丁（`upstream_timeout_fields` 1–112、`no_error_pages` 1–91）按 `openresty` 仓库 revision `8c37412c…` 核对，行数与内容一致。判据按 `batch-brief.md`：推断与调用链缺一环均不算直接支撑。

## 初审结论：有退回（10 条，均为 summary；syntax 无退回）

> 复审 1 结论见文末“复审 1”：初审 10 条均已处理，但按裁定 3 新发现 45 条 summary 退回。

## 总表

| # | 指令 | syntax | summary（初审） | 退回原因（一句，初审） | 复审 1 syntax | 复审 1 summary | 复审 2 summary |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | proxy_pass | 通过 | 通过 |  | 通过 | 通过 | 通过 |
| 2 | proxy_redirect | 通过 | 通过 |  | 通过 | 通过 | 通过 |
| 3 | proxy_cookie_domain | 通过 | 通过 |  | 通过 | 通过 | 通过 |
| 4 | proxy_cookie_path | 通过 | 通过 |  | 通过 | 通过 | 通过 |
| 5 | proxy_cookie_flags | 通过 | 通过 |  | 通过 | 通过 | 通过 |
| 6 | proxy_store | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 7 | proxy_store_access | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 8 | proxy_buffering | 通过 | 通过 |  | 通过 | 通过 | 通过 |
| 9 | proxy_request_buffering | 通过 | 通过 |  | 通过 | 通过 | 通过 |
| 10 | proxy_ignore_client_abort | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 11 | proxy_bind | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 12 | proxy_socket_keepalive | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 13 | proxy_connect_timeout | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 14 | proxy_send_timeout | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 15 | proxy_send_lowat | 通过 | **退回** | “尝试减少小块发送触发”是目的描述，源码只证明值传入 SO_SNDLOWAT / NGX_LOWAT_EVENT | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 16 | proxy_intercept_errors | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 17 | proxy_set_header | 通过 | 通过 |  | 通过 | 通过 | 通过 |
| 18 | proxy_headers_hash_max_size | 通过 | 通过 |  | 通过 | 通过 | 通过 |
| 19 | proxy_headers_hash_bucket_size | 通过 | 通过 |  | 通过 | 通过 | 通过 |
| 20 | proxy_set_body | 通过 | 通过 |  | 通过 | 通过 | 通过 |
| 21 | proxy_method | 通过 | 通过 |  | 通过 | 通过 | 通过 |
| 22 | proxy_pass_request_headers | 通过 | 通过 |  | 通过 | 通过 | 通过 |
| 23 | proxy_pass_request_body | 通过 | 通过 |  | 通过 | 通过 | 通过 |
| 24 | proxy_buffer_size | 通过 | **退回** | “并用于非缓冲响应传输”缺调用链：引用片段只到 u->buffer 剩余字节交给 input_filter，未见非缓冲读取实际 recv 到 u->buffer | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 25 | proxy_read_timeout | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 26 | proxy_buffers | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 27 | proxy_busy_buffers_size | 通过 | **退回** | “给继续读取或写临时文件留出缓冲空间”是目的推断，源码只证明 bsize≥busy_size 即 flush | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 28 | proxy_force_ranges | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 29 | proxy_limit_rate | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 30 | proxy_cache | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 31 | proxy_cache_key | 通过 | 通过 |  | 通过 | 通过 | 通过 |
| 32 | proxy_cache_path | 通过 | 通过 |  | 通过 | 通过 | 通过 |
| 33 | proxy_cache_bypass | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 34 | proxy_no_cache | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 35 | proxy_cache_valid | 通过 | 通过 |  | 通过（corrections 属实） | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 36 | proxy_cache_min_uses | 通过 | **退回** | min_uses>1 返回 SCARCE 后“不建缓存”缺 SCARCE→u->cacheable=0 的一环 | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 37 | proxy_cache_max_range_offset | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 38 | proxy_cache_use_stale | 通过 | 通过 |  | 通过（corrections 属实） | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 39 | proxy_cache_methods | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 40 | proxy_cache_lock | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 41 | proxy_cache_lock_timeout | 通过 | **退回** | “超时后转向上游、不填充缓存”缺 ngx_http_file_cache_open 的 done: 返回 lock 结果这一环 | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 42 | proxy_cache_lock_age | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 43 | proxy_cache_revalidate | 通过 | **退回** | “构造 If-Modified-Since/If-None-Match”缺 headers_cache 被选用与该表名的片段 | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 44 | proxy_cache_convert_head | 通过 | **退回** | “可与 GET 共用”是推断（缓存键不含方法未引用）；源码注释只说明转为 GET 是为缓存响应 | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 45 | proxy_cache_background_update | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 46 | proxy_temp_path | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 47 | proxy_max_temp_file_size | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 48 | proxy_temp_file_write_size | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 49 | proxy_next_upstream | 通过 | **退回** | “连接、发送、响应头失败”缺各失败点调用 ngx_http_upstream_next(FT_*) 的片段 | 通过（corrections 属实） | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 50 | proxy_next_upstream_tries | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 51 | proxy_next_upstream_timeout | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 52 | proxy_pass_header | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 53 | proxy_hide_header | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 54 | proxy_ignore_headers | 通过 | 通过 |  | 通过（corrections 属实） | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 55 | proxy_http_version | 通过 | 通过 |  | 通过 | 通过 | 通过 |
| 56 | proxy_ssl_session_reuse | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 57 | proxy_ssl_protocols | 通过 | 通过 |  | 通过 | 通过 | 通过 |
| 58 | proxy_ssl_ciphers | 通过 | 通过 |  | 通过 | 通过 | 通过 |
| 59 | proxy_ssl_name | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 60 | proxy_ssl_server_name | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 61 | proxy_ssl_verify | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 62 | proxy_ssl_verify_depth | 通过 | 通过 |  | 通过 | 通过 | 通过 |
| 63 | proxy_ssl_trusted_certificate | 通过 | **退回** | “PEM 格式”不在锁定源码内（仅调用 SSL_CTX_load_verify_locations），属外部库行为推断 | 通过 | 通过（ADDRESSED） | 通过 |
| 64 | proxy_ssl_crl | 通过 | 通过 |  | 通过 | 通过 | 通过 |
| 65 | proxy_ssl_certificate | 通过 | 通过 |  | 通过（corrections 属实） | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 66 | proxy_ssl_certificate_key | 通过（建议补充） | **退回** | 修正理由（engine: 不限静态）所依赖的 ngx_ssl_certificate/ngx_ssl_connection_certificate 调用 ngx_ssl_load_certificate_key 两处未引用 | 通过（corrections 属实） | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 67 | proxy_ssl_password_file | 通过 | 通过 |  | 通过 | **退回**（conf 片段未含取配置行 956） | 通过（ADDRESSED） |
| 68 | proxy_ssl_conf_command | 通过 | 通过 |  | 通过 | 通过 | 通过 |
## 退回清单

| ID | 字段 | 问题 | 应如何修正 |
| --- | --- | --- | --- |
| proxy_send_lowat | summary | “尝试减少小块发送触发”是目的描述。`ngx_handle_write_event`/`ngx_send_lowat`（`ngx_event.c` 360–377、951–983）只证明值被设为 `SO_SNDLOWAT`（kqueue 为 `write->available`）并给 epoll/kqueue 加 `NGX_LOWAT_EVENT`，没有任何片段陈述该值“减少小块发送”。 | 收窄为“把该值作为向上游发送时写事件的低水位（Linux 设 `SO_SNDLOWAT`，kqueue 设 `write->available`，事件模块带 `NGX_LOWAT_EVENT`）”；用 `corrections` 删去“尝试减少小块发送触发”。 |
| proxy_busy_buffers_size | summary | “给继续读取或写临时文件留出缓冲空间”源码未陈述。`ngx_event_pipe.c` 598–664 只证明忙碌 recycled 缓冲累计 `bsize≥busy_size`（或再加一块将超）就 `flush=1` 并停止向下游交付新缓冲。 | 用 `corrections` 把后半句改为“累计达到该值时先 flush，不再向下游交付新缓冲”，删去目的句；或改标 unverified。 |
| proxy_ssl_trusted_certificate | summary | “PEM 格式”不在锁定源码中：`ngx_ssl_trusted_certificate` 只调用 `SSL_CTX_load_verify_locations(ctx, file, NULL)`，文件格式由 OpenSSL 决定，仓库内无 OpenSSL 源码，官方文档不能作唯一依据。对照 `proxy_ssl_crl`：其 `X509_FILETYPE_PEM` 在源码中，可保留。 | `corrections` 去掉“PEM 格式”，改为“指定用于校验 HTTPS 上游证书的信任证书文件，在验证开启时经 `SSL_CTX_load_verify_locations` 载入”；note 中“PEM 为其接受格式”删除。 |
| proxy_ssl_certificate_key | summary | 修正本身（“也可使用 engine:name:id”）与源码一致、最小化、未引入新错误（`engine:` 在 `ngx_ssl_load_certificate_key` 748–792 内，不分静态/请求时）。但该结论依赖“`ngx_ssl_certificate` 与 `ngx_ssl_connection_certificate` 都调用 `ngx_ssl_load_certificate_key`”，这两处调用行（`ngx_event_openssl.c` 553、624）未被 `source_ids` 引用，调用链缺一环。 | 新增两个 evidence：`ngx_event_openssl.c` 约 551–554（静态路径）与 622–625（请求时路径）；保留现有 correction 文字。syntax 可通过，建议把 `syntax-parser` 扩到 748–818 以覆盖“否则按文件路径载入”分支（非退回）。 |
| proxy_buffer_size | summary | “并用于非缓冲响应传输”缺一环：`ngx_http_upstream.c` 3070–3108 只到把 `u->buffer` 中已有字节交给 `input_filter`/重置指针，真正向 `u->buffer` 读取后端数据的 `ngx_http_upstream_process_non_buffered_request`（约 3702 `b = &u->buffer` 及 recv）未引用。 | 补 `ngx_http_upstream.c` 约 3700–3800 的非缓冲读取片段，或把“并用于非缓冲响应传输”收窄为“非缓冲路径先处理该缓冲中已读到的正文字节”。 |
| proxy_cache_min_uses | summary | “可创建缓存文件前需要达到的使用次数”：`ngx_http_file_cache_open` 返回 `SCARCE` 与 `fcn->uses>=min_uses` 已见，但 `SCARCE` 导致“不缓存”的一环（`ngx_http_upstream.c` 972–977 `u->cacheable=0`）未引用。 | 补 `ngx_http_upstream.c` 972–977；note 写明 SCARCE→cacheable=0。 |
| proxy_cache_lock_timeout | summary | “等待超时后可转向上游，但该次响应不填充缓存”缺 `ngx_http_file_cache_open` 末尾 `done: … return ngx_http_file_cache_lock(r, c)`（`ngx_http_file_cache.c` 约 391–398）这一环，否则不能证明 lock 的 `SCARCE` 返回会传到 `ngx_http_upstream_cache`。 | 补 `ngx_http_file_cache.c` 391–398；其余（`wait_time`、`lock_timeout=0`、972–977）已有。 |
| proxy_cache_revalidate | summary | “构造 If-Modified-Since/If-None-Match”：引用的 855–874 从数组中段开始，看不到表名 `ngx_http_proxy_cache_headers`；缓存请求选用 `headers_cache`（`create_request` 1255–1262 的 `u->cacheable ? &plcf->headers_cache : &plcf->headers`）与其初始化（merge 约 3917–3922）均未引用。 | 补 849–856（表头）、1255–1262、3917–3922 三段。 |
| proxy_cache_convert_head | summary | “以取得并缓存可与 GET 共用的响应”中“可与 GET 共用”是推断（缓存键不含方法未引用）。源码仅有注释 `HEAD was changed to GET to cache response`。 | `corrections` 改为“…转换为 GET，以便缓存该响应”，删去“可与 GET 共用”。 |
| proxy_next_upstream | summary | “连接、发送、响应头失败”：片段只有失败类型掩码比较（`test_next`、`ngx_http_upstream_next`），各阶段（连接、发送、读响应头）调用 `ngx_http_upstream_next(…, FT_ERROR/FT_TIMEOUT/FT_INVALID_HEADER)` 的片段未引用。 | 补连接、`send_request`、`process_header` 三处调用点；或收窄为“在失败类型命中本指令选项且重试条件满足时尝试下一个上游”。 |

## 逐项判定（实施者自述的薄弱点）

- proxy_send_lowat：退回（见上）。value 传入 `ngx_handle_write_event(c->write, u->conf->send_lowat)`（`ngx_http_upstream.c` 2121）→ `ngx_send_lowat` 的链路完整，问题仅在目的句。
- proxy_busy_buffers_size：退回（见上）。merge 默认 `2*size`、校验范围、`p->busy_size` 赋值、flush 比较均完整。
- proxy_ssl_trusted_certificate：退回（见上），仅“PEM 格式”一词；syntax 通过。
- proxy_ssl_certificate_key correction：文字正确、最小化；退回的是证据不完整，不是修正有误。
- connect/send/read_timeout：通过。补丁文件 `nginx-1.27.1-upstream_timeout_fields.patch` 共 112 行，引用 1–112 即整文件，与固定 revision 逐行一致；hunk 对应关系（`ngx_http_upstream_init` 复制、connect/ssl_init 的 `u->connect_timeout`、`send_request` 的 `u->send_timeout`、`read_timeout`、`send_response` 的 `p->read_timeout`、upgraded/non_buffered 两处读定时器）与各 summary 与 note 陈述一致；`send_timeout` 的“可继续写入后移除”由 `ngx_http_upstream.c` 2113–2144 的 `ngx_del_timer` 分支支撑。三者 `patch_status` 均为 `verified_affected`。

## 其他观察（非退回）

- proxy_cache_valid 的 note 提到 `Cache-Control` 也写入 `valid_sec`，但 `source_ids` 中无对应片段；summary 未陈述此点，不影响判定，建议 note 删除或补片段。
- proxy_cache_bypass / proxy_no_cache：“走上游”“阻止存入缓存”分别以 `DECLINED` 提前返回与 `u->cacheable=0` 为直接依据，未引入额外推断，判通过。
- proxy_cache_use_stale、proxy_next_upstream 的取值表比语法多 `non_idempotent`/`updating`，属“语法未列全”，不是错误；`proxy_ssl_certificate_key` 源码另接受 `data:`，同理。
- 其余 `source_ids` 均可解析，无重复 ID，无未使用的新增 evidence。

## 计数

| 字段 | 通过 | 退回 | 证据不足属实 | 可晋级 |
| --- | --- | --- | --- | --- |
| syntax | 68 | 0 | 0 | 0 |
| summary | 58 | 10 | 0 | 0 |

## 构建检查

`node scripts/build.mjs --config project.config.json --check`：退出码 0；B03 输出 `syntax_verified 68 / syntax_unverified 0 / summary_verified 68 / summary_unverified 0 / entries 68`，与实施报告一致（`--check` 不检验语义，退回项不影响通过）。

---

# 复审 1

范围：（1）初审 10 条退回逐条判定；（2）本轮新增 corrections 与片段按 revision（nginx `e06bdbd4…`）与行号读取核对；（3）按裁定 3 检查 `summary-conf-assign` 是否同时覆盖取配置与赋 `u->conf`。`--check` 退出码 0，B03 输出 68/0、68/0，与实施报告一致。

## （1）初审 10 条逐条判定

| ID | 判定 | 依据 |
| --- | --- | --- |
| proxy_send_lowat | ADDRESSED | correction 收窄为“经 ngx_send_lowat 设为 SO_SNDLOWAT，kqueue 下设为 write->available”，与 `ngx_event.c` 951–983 一致，目的句已删。 |
| proxy_busy_buffers_size | ADDRESSED | correction 改为“累计达到该值时先 flush，不再向下游交付新缓冲”，与 `ngx_event_pipe.c` 598–664 一致。 |
| proxy_ssl_trusted_certificate | ADDRESSED | “PEM 格式”已删，改述仅含源码可证内容。 |
| proxy_ssl_certificate_key | ADDRESSED | 新增 `summary-load-static`（553 `ngx_ssl_load_certificate_key(cf->pool…)`）与 `summary-load-dynamic`（624 `…(pool…)`），两处调用成立，原 summary correction 文字有据；syntax-parser 扩到 748–818，含 engine/data/文件三分支。 |
| proxy_buffer_size | ADDRESSED | `summary-nonbuf-upstream`（3662–3682）→ `process_non_buffered_request` → `b=&u->buffer`（3702）→ `upstream->recv(upstream, b->last, size)`（3751–3755），链完整。 |
| proxy_cache_min_uses | ADDRESSED | `summary-scarce` 972–977：SCARCE 置 `u->cacheable=0`，属实。 |
| proxy_cache_lock_timeout | ADDRESSED | `summary-open-lock` 391–398：`done:` 后 `return ngx_http_file_cache_lock(r, c)`，属实。 |
| proxy_cache_revalidate | ADDRESSED | 850–866 表名 `ngx_http_proxy_cache_headers` 含两个条件头；1259–1263 `u->cacheable ? headers_cache`；3916–3924 初始化，三段均属实。 |
| proxy_cache_convert_head | ADDRESSED | correction 为“…转换为 GET，以便缓存该响应”，与源码注释一致。 |
| proxy_next_upstream | ADDRESSED | 五处调用点（连接 1568–1577 ERROR/NOLIVE、发送 2101–2106、发送超时 2322–2324、读头超时/连接检测 2384–2392、无效头 2493–2495）与行号一致。 |

## （2）本轮新增 corrections 与片段核对

- 6 条 syntax corrections 均与取值表一致，无新错：proxy_next_upstream（+updating，13 项与 `ngx_http_proxy_next_upstream_masks` 全等）、proxy_cache_use_stale（+non_idempotent，同表 13 项）、proxy_ignore_headers（九个头名与 `ngx_http_upstream_ignore_headers_masks` 460–471 全等）、proxy_cache_valid（+any，`valid_set_slot` 中 `any`→status 0）、proxy_ssl_certificate（+`data:`，651–665）、proxy_ssl_certificate_key（+`data:`，794–803）。
- 新增片段行号与内容均与 revision 一致，无重复 ID、无未解析 ID；已有来源与 `git show` 复核 263 段全部一致。
- 轻微说明（非退回）：`proxy_ssl_certificate`/`_key` 的“file”分支（`else` 后的 `BIO_new_file`）对 certificate 的 syntax-parser 仅到 665（`} else {`），未含文件载入行，建议扩到约 665–690；key 的片段已含。

## （3）裁定 3：`summary-conf-assign` 覆盖检查 —— 未满足

`summary-conf-assign` 仅为 `ngx_http_proxy_module.c:975` 单行 `u->conf = &plcf->upstream;`。取配置的行 956（`plcf = ngx_http_get_module_loc_conf(r, ngx_http_proxy_module);`）与 958（`u = r->upstream;`）不在其内。我逐条检查了这 42 条的全部 `source_ids`（含已有来源）：没有任何一条的 proxy 模块片段覆盖第 956 行，所以“取配置 → 赋 u->conf”仍断开一环。`proxy_connect_timeout`/`proxy_send_timeout`/`proxy_read_timeout` 用的 `runtime-proxy-conf`（973–988）同样不含 956，一并计入。

**新退回 45 条（summary）**：上述 42 条 + 3 个 timeout；ID 见总表“复审 1 summary”列的退回项。
**修正方式**：把 `summary-conf-assign` 改为覆盖 956–975 的一个共享片段（含 `plcf = …`、`u = r->upstream;`、`u->conf = &plcf->upstream;`），3 个 timeout 条目补同一片段；一次改动即可闭合全部 45 条。

## 其他新发现

- 裁定 4（源码不解析参数值的指令，占位符改为 `value`）在实施报告回查结果中未提及。需要实施者逐条确认 B03 候选并写入报告：`proxy_method`（`method`，原样当作方法名）、`proxy_ssl_ciphers`（`ciphers`，原样交给 OpenSSL）、`proxy_cookie_flags`（`flag`，配置期不校验，运行时才查表）。我未将其直接判退回，因裁定 4 的适用边界需主线程确认；若按字面适用则这些条目的 syntax 需改。

## 复审 1 计数

| 字段 | 通过 | 退回 |
| --- | --- | --- |
| syntax | 68 | 0 |
| summary | 23 | 45 |

（复审 2 后：summary 68 通过 / 0 退回。）

---

# 复审 2

范围：45 条 `summary-conf-assign` 引用与扩展片段。`--check` 退出码 0，B03 输出 68/0、68/0。

- **summary-conf-assign（ADDRESSED，45/45）**：现为 `ngx_http_proxy_module.c:956-975`，按 revision `e06bdbd4…` 读取：956 `plcf = ngx_http_get_module_loc_conf(r, ngx_http_proxy_module);`、958 `u = r->upstream;`、960–971 proxy_lengths/eval 分支、975 `u->conf = &plcf->upstream;`，同一处理函数内取配置与赋值闭环，满足裁定 3。脚本检查：需要的 45 条（原 42 + proxy_connect/send/read_timeout）的 `source_ids` 均解析到覆盖 956–975 的片段，全批仅此一个定义，无遗漏、无多余引用。
- **按组判定**：store 组、cache 全组、next_upstream 三条、header 组（pass/hide/ignore）、buffer/temp 组、ssl_session_reuse/server_name/verify/name/certificate/certificate_key/password_file、bind/socket_keepalive/send_lowat/intercept_errors/force_ranges/limit_rate/ignore_client_abort 及三个 timeout：均 ADDRESSED。
- **proxy_ssl_certificate syntax-parser（ADDRESSED）**：651–690 内容属实，含 `data:` 分支（656–663）与文件分支（`ngx_get_full_name` + `BIO_new_file`，665–679），与 syntax `file | data:certificate` 一致。
- 裁定 4：proxy_method / proxy_ssl_ciphers / proxy_cookie_flags 值被原样使用，保留占位符，接受。裁定 5–7 在本批无适用项（无远距取配置，无新增“运行期无人读取”类陈述）。

## 复审 2 结论

全部通过：syntax 68/0，summary 68/0，无未解决项。
