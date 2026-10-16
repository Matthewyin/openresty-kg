# B02 字段证据审核（ngx_http_core_module，84 条）

审核依据：`analysis/FIELD_EVIDENCE_PLAN.md`、`review-brief.md`、`batch-brief.md`。源码按 nginx `release-1.27.1`（e06bdbd4…）用 `git show <revision>:<file>` 读取，补丁条目另核对 `openresty/patches` 与 `analysis/NGINX_PATCH_AUDIT.json`（34 项补丁清单）。84 个 ID 的 syntax 与 summary 均逐字段核对，新增 evidence（18 个条目、25 个片段）的行号与内容均已对照原文。

## 结论

- 语法：84 条全部通过（注册标志、参数个数、取值表/自定义解析片段均与结论一致；官方文档仅作印证，未作唯一依据）。
- 功能：71 条通过，13 条退回。退回项均属“调用链缺一环 / 片段未覆盖陈述”，不是 summary 文字被源码证伪；3 条 corrections 本身均有源码依据且最小化，其中 `disable_symlinks` 需补片段后才算闭环。

## 总表

| # | ID（指令名） | syntax | summary | 退回原因 / 备注 |
| --- | --- | --- | --- | --- |
| 1 | `variables_hash_max_size` | 通过 | 通过 | — |
| 2 | `variables_hash_bucket_size` | 通过 | 通过 | — |
| 3 | `server_names_hash_max_size` | 通过 | 通过 | — |
| 4 | `server_names_hash_bucket_size` | 通过 | 通过 | — |
| 5 | `server` | 通过 | 通过 | — |
| 6 | `connection_pool_size` | 通过 | 通过 | — |
| 7 | `request_pool_size` | 通过 | 通过 | — |
| 8 | `client_header_timeout` | 通过 | 通过 | — |
| 9 | `client_header_buffer_size` | 通过 | 通过 | — |
| 10 | `large_client_header_buffers` | 通过 | 通过 | — |
| 11 | `ignore_invalid_headers` | 通过 | 通过 | — |
| 12 | `merge_slashes` | 通过 | 通过 | 复审2：条件行片段已补（ADDRESSED） |
| 13 | `underscores_in_headers` | 通过 | 通过 | 复审1：初审退回项已处理（ADDRESSED） |
| 14 | `location` | 通过 | 通过 | — |
| 15 | `listen` | 通过 | 通过 | — |
| 16 | `server_name` | 通过 | 通过 | correction 通过 |
| 17 | `types_hash_max_size` | 通过 | 通过 | — |
| 18 | `types_hash_bucket_size` | 通过 | 通过 | — |
| 19 | `types` | 通过 | 通过 | — |
| 20 | `default_type` | 通过 | 通过 | — |
| 21 | `root` | 通过 | 通过 | — |
| 22 | `alias` | 通过 | 通过 | — |
| 23 | `limit_except` | 通过 | 通过 | — |
| 24 | `client_max_body_size` | 通过 | 通过 | — |
| 25 | `client_body_buffer_size` | 通过 | 通过 | — |
| 26 | `client_body_timeout` | 通过 | 通过 | — |
| 27 | `client_body_temp_path` | 通过 | 通过 | — |
| 28 | `client_body_in_file_only` | 通过 | 通过 | 复审1：初审退回项已处理（ADDRESSED） |
| 29 | `client_body_in_single_buffer` | 通过 | 通过 | — |
| 30 | `sendfile` | 通过 | 通过 | — |
| 31 | `sendfile_max_chunk` | 通过 | 通过 | 复审1：初审退回项已处理（ADDRESSED） |
| 32 | `subrequest_output_buffer_size` | 通过 | 通过 | — |
| 33 | `aio` | 通过 | 通过 | — |
| 34 | `aio_write` | 通过 | 通过 | 复审1：初审退回项已处理（ADDRESSED） |
| 35 | `read_ahead` | 通过 | 通过 | — |
| 36 | `directio` | 通过 | 通过 | 复审1：初审退回项已处理（ADDRESSED） |
| 37 | `directio_alignment` | 通过 | 通过 | — |
| 38 | `tcp_nopush` | 通过 | 通过 | — |
| 39 | `tcp_nodelay` | 通过 | 通过 | — |
| 40 | `send_timeout` | 通过 | 通过 | — |
| 41 | `send_lowat` | 通过 | 通过 | — |
| 42 | `postpone_output` | 通过 | 通过 | — |
| 43 | `limit_rate` | 通过 | 通过 | — |
| 44 | `limit_rate_after` | 通过 | 通过 | — |
| 45 | `keepalive_time` | 通过 | 通过 | — |
| 46 | `keepalive_timeout` | 通过 | 通过 | 复审1：初审退回项已处理（ADDRESSED） |
| 47 | `keepalive_requests` | 通过 | 通过 | — |
| 48 | `keepalive_disable` | 通过 | 通过 | — |
| 49 | `satisfy` | 通过 | 通过 | — |
| 50 | `auth_delay` | 通过 | 通过 | — |
| 51 | `internal` | 通过 | 通过 | — |
| 52 | `lingering_close` | 通过 | 通过 | — |
| 53 | `lingering_time` | 通过 | 通过 | — |
| 54 | `lingering_timeout` | 通过 | 通过 | — |
| 55 | `reset_timedout_connection` | 通过 | 通过 | — |
| 56 | `absolute_redirect` | 通过 | 通过 | — |
| 57 | `server_name_in_redirect` | 通过 | 通过 | — |
| 58 | `port_in_redirect` | 通过 | 通过 | — |
| 59 | `msie_padding` | 通过 | 通过 | — |
| 60 | `msie_refresh` | 通过 | 通过 | 复审1：初审退回项已处理（ADDRESSED） |
| 61 | `log_not_found` | 通过 | 通过 | 复审1：初审退回项已处理（ADDRESSED） |
| 62 | `log_subrequest` | 通过 | 通过 | — |
| 63 | `recursive_error_pages` | 通过 | 通过 | — |
| 64 | `server_tokens` | 通过 | 通过 | 补丁最终内容已核对，通过 |
| 65 | `if_modified_since` | 通过 | 通过 | — |
| 66 | `max_ranges` | 通过 | 通过 | — |
| 67 | `chunked_transfer_encoding` | 通过 | 通过 | — |
| 68 | `etag` | 通过 | 通过 | — |
| 69 | `error_page` | 通过 | 通过 | — |
| 70 | `post_action` | 通过 | 通过 | — |
| 71 | `error_log` | 通过 | 通过 | 复审2：syntax 与 summary 均 ADDRESSED |
| 72 | `open_file_cache` | 通过 | 通过 | 复审1：初审退回项已处理（ADDRESSED） |
| 73 | `open_file_cache_valid` | 通过 | 通过 | — |
| 74 | `open_file_cache_min_uses` | 通过 | 通过 | 复审1：初审退回项已处理（ADDRESSED） |
| 75 | `open_file_cache_errors` | 通过 | 通过 | — |
| 76 | `open_file_cache_events` | 通过 | 通过 | — |
| 77 | `resolver` | 通过 | 通过 | 复审1：初审退回项已处理（ADDRESSED） |
| 78 | `resolver_timeout` | 通过 | 通过 | — |
| 79 | `gzip_vary` | 通过 | 通过 | — |
| 80 | `gzip_http_version` | 通过 | 通过 | — |
| 81 | `gzip_proxied` | 通过 | 通过 | — |
| 82 | `gzip_disable` | 通过 | 通过 | correction（summary、syntax）通过 |
| 83 | `disable_symlinks` | 通过 | 通过 | 复审1：初审退回项已处理（ADDRESSED） |
| 84 | `no_error_pages` | 通过 | 通过 | — |

## 重点条目判定

- `sendfile_max_chunk`（summary 退回）：实施者自述属实。“限制写过滤器一次向连接发送链交付的数据量”只有 limit 传入 `c->send_chain` 一环的证据；“避免长期占用 worker”来自文档，没有任何源码片段支撑。
- `log_not_found`（summary 退回）：只引用静态模块一处，而 summary 泛称“文件查找”。源码里 `index`、`flv`、`mp4` 同样读取该开关，措辞与证据范围不一致。
- `server_tokens`（syntax/summary 均通过）：已核对补丁最终内容。34 项补丁中仅 `server_header`（nginx.h、header_filter、v2 filter）与 `builtin_error_page_footer`（special_response）触及相关文件；`ngx_http_v3_filter_module.c` 不在任何补丁的目标内，故“HTTP/3 off 分支仍为字面 nginx”成立；`no_pool` 补丁不在 34 项清单内，不影响；`ngx_http_core_module.c` 仅被 `no_error_pages` 修改，不影响 `server_tokens` 取值表。
- `server_name` correction（通过）：`ngx_http_core_server_name` 在非 `NGX_PCRE` 构建对 `~` 名称报 “requires PCRE library”，片段（4385–4482）含 `#if (NGX_PCRE)…#else…#endif`，修正与证据一致。
- `gzip_disable` correction（通过）：setter 的 `#else` 分支只接受 `msie6`/`degradation`，其余报 “without PCRE library” 错误，片段（5109–5203）已覆盖，修正与证据一致。
- `disable_symlinks` correction（需补片段）：源码事实正确（registration 在 core_module.c:770–779、setter 在 5208–5299 均位于 `#if (NGX_HAVE_OPENAT)` 内），但所引 registration 片段为 772–777、setter 片段起于 5211，`#if` 行不在任何所引片段内，condition 未被证据直接覆盖。
- 其余由补丁影响的条目（`listen`、`resolver`、`error_page`、`no_error_pages`、`error_log`）：所引基线片段未被对应补丁改动（`intercept_error_log` 只改 `ngx_log_error_core`；`resolver_conf_parsing` 的 `local=` 解析、`no_error_pages` 的合并与冲突检查均已在补丁片段内核实）。

## 退回清单

| ID | 字段 | 问题 | 应如何修正 |
| --- | --- | --- | --- |
| `merge_slashes` | summary | 功能链缺环：片段只显示解析器遇 / 且 !merge_slashes 才写出，未显示输出落入 r->uri（parse.c:1264 u=r->uri.data、1582/1607 r->uri.len=u-r->uri.data），也未显示 "//" 如何置 r->complex_uri 而进入该函数。 | 补 parse.c 1264（u = r->uri.data）与 1582/1607（r->uri.len = u - r->uri.data）、request_parse 里 "//" 置 complex_uri 的片段，或把 summary 收窄为“解析器压缩斜杠”。 |
| `underscores_in_headers` | summary | 功能只覆盖请求头名称首字符的下划线（parse.c 约 879/887），名称中间的下划线分支（parse.c 约 919–925）未引用，而 summary 泛指名称中的下划线。 | 补 parse.c 约 919–925 的 sw_name 分支，或收窄为“名称首字符的下划线”（不推荐）。 |
| `client_body_in_file_only` | summary | “on 保留文件”依赖 ngx_create_temp_file 对 persistent/clean 的处理，片段只到 tf->persistent/tf->clean 赋值，缺该函数中清理注册的片段。 | 补 ngx_create_temp_file（file.c）中 persistent/clean 处理片段；或把 “on保留文件，clean配置清理” 收窄为“on 置持久标志，clean 另置清理标志”。 |
| `sendfile_max_chunk` | summary | “避免一个快速连接长期占用 worker”仅来自官方文档；源码片段只证明 limit 传入 c->send_chain，未证明 send_chain 按 limit 截断单次发送，也无源码体现该目的。 | 补 ngx_linux_sendfile_chain 的 limit 截断（sendfile_chain.c:72–73、87、162–167、224）；并用 corrections 删去“避免一个快速连接长期占用 worker”，或在 note 中明确该目的无源码支撑并把该字段改为 unverified。 |
| `aio_write` | summary | “使该路径可使用线程写入”缺消费点：只引用了 upstream 设置 p->thread_handler，未引用 ngx_event_pipe.c 中以其为 temp_file 线程写入的片段（event_pipe.c:839–842）。 | 补 ngx_event_pipe.c:839–842 片段。 |
| `directio` | summary | “文件发送链据此选择缓冲与发送路径”缺一环：of.is_directio 到 buf->file->directio 的赋值（static_module.c:272）未引用。 | 补 ngx_http_static_module.c:272（b->file->directio = of.is_directio）。 |
| `keepalive_timeout` | summary | summary 的 source_ids 无参数解析片段，“第二参数只控制 Keep-Alive: timeout 头值”的 value[2]→keepalive_header 对应只在 configuration-definition（ngx_http_core_keepalive）中，未列入功能证据。 | 把 configuration-definition（ngx_http_core_keepalive，含 value[2]→keepalive_header）加入 summary_evidence.source_ids。 |
| `msie_refresh` | summary | “用 HTML refresh 页面代替普通重定向响应”只引用了调用 ngx_http_send_refresh 的两处，未引用该函数体（special_response.c:788 起）以证明输出内容。 | 补 ngx_http_send_refresh（special_response.c:788 起）片段。 |
| `log_not_found` | summary | summary 泛称“文件查找得到404”，片段只覆盖静态文件模块（static_module.c:136）；index（index_module.c:378）、flv、mp4 同样读取该开关却未引用。 | 二选一：补 index/flv/mp4 同类判断片段；或用 corrections 把 summary 收窄为“静态文件处理打开文件得到 404 时是否记录错误日志”等源码已证范围。 |
| `open_file_cache` | summary | “max 限制缓存条目数、inactive 控制清理”缺指令值到 cache->max/inactive 的片段：ngx_http_core_open_file_cache 调用 ngx_open_file_cache_init 及其 cache->max=max、cache->inactive=inactive（open_file_cache.c:73–74）均未引用。 | 补 ngx_open_file_cache_init（open_file_cache.c:57–76）并把 configuration-definition 列入 summary source_ids。 |
| `open_file_cache_min_uses` | summary | 指令值到清理判断的一环缺失：ofcln->min_uses = of->min_uses（open_file_cache.c:444）与 ngx_close_cached_file(…, c->min_uses, …) 调用（约 1024）未引用。 | 补 open_file_cache.c:444 与 1024 附近片段。 |
| `resolver` | summary | “设置 HTTP 运行时域名解析器”缺指令到 clcf->resolver 的片段：ngx_http_core_resolver 调用 ngx_resolver_create 并保存结果，未列入功能证据。 | 把 configuration-definition（ngx_http_core_resolver）加入 summary_evidence.source_ids。 |
| `disable_symlinks` | summary | correction 的“仅在支持 openat 的构建中提供”所依据的 #if (NGX_HAVE_OPENAT)（core_module.c:770 起注册、5208 起 setter）不在所引片段内：registration 片段为 772–777，setter 片段起于 5211。文字修正本身正确。 | 把 registration 片段扩为 770–779、或 setter 片段扩为 5208–5299（含 #if/#endif），文字修正保留。 |

## 备注（通过，但建议顺带完善，不计退回）

- `open_file_cache_valid`：引用片段止于复用条件，未含条件不成立时的重新打开片段（open_file_cache.c 约 268 起）。
- `resolver_timeout`：未引用 `ngx_resolver_set_timeout` 的调用点，但 `ctx->timeout` 赋值与定时器处理均已覆盖。
- `no_error_pages`：`ngx_http_special_response_handler` 落入内置响应的调用行（special_response.c:473 附近）未在片段内，但内置响应函数本身不读取 `error_pages`，不影响结论。
- `alias`：“正则 location 通常通过捕获变量构造路径”中“捕获变量”是用法描述，源码只证明强制脚本编译与 `add_uri_to_alias` 分支；因措辞为“通常”，未计退回。
- `client_max_body_size`：片段中的 `!r->discard_body` 条件未在 summary 中说明，属省略而非错误。
- 官方文档将 `variables_hash_*` 等写作 size，源码为 `ngx_conf_set_num_slot`，实施者按源码保留 `number`，判定正确。

## 计数

| 字段 | 通过 | 退回 |
| --- | --- | --- |
| syntax | 84 | 0 |
| summary | 84 | 0 |

（上表为复审 1 后最新计数；初审为 syntax 84/0、summary 71/13。）

## 构建检查

`node scripts/build.mjs --config project.config.json --check`：成功（退出码 0）。输出中 B02 为 syntax 84/0、summary 84/0、entries 84，与实施报告一致；总计 syntax 346 verified、summary 345 verified（含其他批次已有文件）。本次审核未修改任何受审文件。


---

# 复审 1

依据：重读更新后的 `review-brief.md`（裁定 1–4）与 `B02-report.md` 修复轮次 1；新增片段全部按 `release-1.27.1`（e06bdbd4…）以 `git show` 对行号逐个读取。`--check` 成功，B02 为 syntax 84/0、summary 84/0（实施者自报计数，与审核判定不同）。

## （1）初审 13 条退回项

| ID | 判定 | 说明 |
| --- | --- | --- |
| `merge_slashes` | NOT ADDRESSED（残留一环） | 已补 parse.c 478–510（`/` 置 complex_uri）、1262–1265、1580–1582，输出落入 r->uri 已闭环；但调用 `ngx_http_parse_complex_uri` 的条件行 `if (r->complex_uri \|\| r->quoted_uri \|\| r->empty_path_in_uri)`（request.c 1255）不在 implementation-0（1266–1279，起于块内）里，flag→调用仍缺一环。修正：把 implementation-0 扩为 1255–1279。 |
| `underscores_in_headers` | ADDRESSED | parse.c 908–929 含 sw_name 中间下划线分支，815–818 含 allow_underscores 形参。 |
| `client_body_in_file_only` | ADDRESSED | file.c 113–115、196–217（clean 选 ngx_pool_delete_file）、files.c 279–291（!persistent 即 unlink）、palloc.c 363–399 均属实，persistent/clean 语义闭环。 |
| `sendfile_max_chunk` | ADDRESSED | 截断三处（sendfile_chain.c 72–73/87、162–167、224）属实；correction 删去仅见于文档的目的句，改为“Linux 下由 ngx_linux_sendfile_chain 按该上限截断”，有源码依据、最小化、无新错误。 |
| `aio_write` | ADDRESSED | event_pipe.c 838–845 为 thread_handler 消费点；upstream 3070 补 clcf 赋值行。 |
| `directio` | ADDRESSED | static_module.c 272 `b->file->directio = of.is_directio` 属实。 |
| `keepalive_timeout` | ADDRESSED | summary 来源已含 configuration-definition（ngx_http_core_keepalive，含 value[2]→keepalive_header）。 |
| `msie_refresh` | ADDRESSED | send_refresh 函数体（788–857，使用 refresh_head/tail）与字符串（52–57，meta Refresh 页面）属实。 |
| `log_not_found` | ADDRESSED | correction 收窄为“静态文件处理…”，与证据范围一致，无新错误。 |
| `open_file_cache` | ADDRESSED | ngx_open_file_cache_init（56–75，cache->max/inactive 赋值）与 setter 已列入 summary 来源。 |
| `open_file_cache_min_uses` | ADDRESSED | open_file_cache.c 442–445（ofcln->min_uses）与 1017–1028（清理调用）属实。 |
| `resolver` | ADDRESSED | configuration-definition（`clcf->resolver = ngx_resolver_create(...)`）与 runtime-core-conf 已列入。 |
| `disable_symlinks` | ADDRESSED | core_module.c 770–779 含 `#if (NGX_HAVE_OPENAT)`…`#endif` 与注册项，syntax/summary 均已引用。 |

## （2）新增 corrections 与新增片段

- 新增片段（约 35 个条目的赋值行等）：逐个按行号读取，内容均与所述一致（如 variables.c 2741、write_filter 211、header_filter 284、request.c 2771/3112、special_response 454/672–675、static_module 88–105、upstream 648/3070、copy_filter 106–107、core_module 1305–1314/2061、v3_filter 159），行号无偏移，无 ID 冲突。
- `裁定 1` 独立回查：对全批 summary 来源并集脚本检查 `clcf/cscf/cmcf` 的赋值或形参，无缺口（`conf->` 仅出现在 merge 默认值行，属默认值而非行为链，不计）。
- `gzip_disable` syntax 修正为 `gzip_disable regex | msie6 ...;`：msie6 在 setter 内（core_module.c 5139）先于正则识别，属实；`degradation` 仅在 `NGX_HTTP_DEGRADATION` 构建下接受而未列入，理由成立。通过。
- `error_log` syntax 修正为 `error_log file | stderr | syslog:parameter ... | memory:size [level];`：stderr（ngx_log.c 576）、memory:（585，仅 NGX_DEBUG）、syslog:（644）行号属实，但有两处问题（见下）。

## （3）裁定 2：全批取值/掩码语法完整性

枚举与掩码表逐项对照：`client_body_in_file_only`（off/on/clean）、`keepalive_disable`（none/msie6/safari）、`if_modified_since`、`satisfy`、`server_tokens`（off/on/build）、`lingering_close`、`gzip_http_version`、`gzip_proxied`（9 项）、`aio`、`directio`、`disable_symlinks`、`open_file_cache`（setter 仅 max=、inactive=、off）、`resolver`（valid/ipv4/ipv6 与补丁 local=）均无少列多列。`gzip_disable`、`error_log` 已补。未发现其他取值型少列。

## 仍未解决 / 新发现

1. `merge_slashes`（summary，残留）：implementation-0 扩为 request.c 1255–1279，补上 complex_uri 进入条件。
2. `error_log`（syntax，新引入）：`syslog:parameter ...` 写法不准确——`ngx_syslog_parse_args` 将 `syslog:` 之后整个 value[1] 按逗号分隔解析（`server=`、`facility=`、`severity=`、`tag=` 等），并非空格分隔的多个参数，`...` 容易误导；且该解析片段（ngx_syslog.c）未列入 syntax 证据。应改为 `syslog:parameters`（同一参数内逗号分隔）或同等写法，并加入 ngx_syslog.c 中 `ngx_syslog_parse_args` 片段；`memory:size` 仅 NGX_DEBUG 构建，可在文字或 note 中保留该限定。
3. `error_log`（summary，新发现）：来源缺 `ngx_http_core_error_log`（configuration-definition，5028–5033，`ngx_log_set_log(cf, &clcf->error_log)`）这一环，按裁定 1 应把 configuration-definition 加入 summary 来源。
4. 需主线程裁定（非硬性退回）：`listen`（源码另支持端口范围，证据中 syntax-port-only 已显示 `-` 处理）与 `location`（源码允许修饰符与 uri 连写）语法均少列了源码接受的形式；若裁定 2 的“取值”包含此类形式则需补 corrections，若仅指关键字/枚举值则无需。

## 结论

复审 1：未全部通过。仍有 2 个条目 3 处退回（`merge_slashes` summary；`error_log` syntax 与 summary），另 1 项需裁定。其余 11 条初审退回项均已处理。计数：syntax 通过 83、退回 1；summary 通过 82、退回 2。


---

# 复审 2

依据：review-brief.md（裁定 1–7）与 B02-report.md 修复轮次 2。新增片段按 `release-1.27.1`（e06bdbd4…）以 `git show` 对行号读取；`--check` 成功，B02 为 syntax 84/0、summary 84/0。

| 项 | 判定 | 说明 |
| --- | --- | --- |
| `merge_slashes`（summary） | ADDRESSED | 新片段 `summary-complex-cond`（request.c 1256–1257）为 `if (r->complex_uri || r->quoted_uri || r->empty_path_in_uri) {`，与 implementation-0（1266–1279，该 if 块内的 `ngx_http_parse_complex_uri(r, cscf->merge_slashes)` 调用）衔接；parse.c 478–510 置 complex_uri、1264/1582 输出落入 r->uri 已于复审 1 核实，链路闭环。 |
| `error_log`（syntax） | ADDRESSED | 语法改为 `error_log file \| stderr \| syslog:parameters \| memory:size [level];`。新片段 `ngx_syslog.c` 93–129（`p = value[1].data + sizeof("syslog:") - 1`，按 `,` 切分，`server=` 等）、182–183（`tag=`）、215–216（`nohostname`）行号与内容属实，证明 `syslog:` 之后是同一参数内的逗号列表，写作 `syslog:parameters` 正确；stderr（ngx_log.c 576）、memory:（585，NGX_DEBUG）、syslog:（644）行号已核对；memory 的构建限定写在 reason 中，不与源码矛盾，无新错误。 |
| `error_log`（summary） | ADDRESSED | summary 来源已加入 configuration-definition（core_module.c 5028–5033，含 `return ngx_log_set_log(cf, &clcf->error_log);`），setter→clcf->error_log 一环补齐，与 `runtime-http-error-log-location`（r==r->main 时 ngx_set_connection_log(clcf->error_log)）衔接。 |
| `listen`、`location` | 按裁定 6 通过 | 单参数书写变体不强制展开，原语法与源码不矛盾。 |

结论：复审 2 全部通过，三处均 ADDRESSED，无新发现。最终计数：syntax 通过 84、退回 0；summary 通过 84、退回 0；6 个含 corrections 的条目（server_name、gzip_disable、disable_symlinks、sendfile_max_chunk、log_not_found、error_log）均已签署。
