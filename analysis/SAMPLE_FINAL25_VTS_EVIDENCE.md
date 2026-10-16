# Final25 VTS四项固定源码证据

日期：2026-10-14。状态：候选实施完成，待独立审核及统一发布验收。

## 深度交互：限定范围

本轮完成VTS四项的server统计链与普通展示分派。HTML框架与JSON数据读取区分；Host分组不是访问控制；共享统计分配失败不等于拒绝业务请求。不扩充控制API、dump恢复或所有指标字段；既有默认值、继承与README差异保留。

## 直接执行：固定来源及字段保护

VTS固定commit为52fe11e44c47a49b052be89e36dfa17d81bf52a5，Nginx固定commit为e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928；所有片段由git show读取，未用工作树行号替代。比较基线06a639；四项旧evidence精确前缀、旧事实与其他20个扩展身份保持。limitations复制基线完整facts，避免新增evidence引起旧字符串隐式引用扩张。patch_status由基线派生not_applicable对象追加所选运行代码引用与限定note，不改变状态；首次显式落盘旧对象。

### nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_filter_by_host

限定LOG阶段serverZones键选择与计数消费；filter_by_host不是请求过滤器。保留固定快照既有默认值说明，本轮不改默认值或宣称已部署。

1. 请求结束进入LOG阶段，模块已注册统计handler：Nginx在尚未记录日志时调用LOG handler数组。VTS读取主配置和局部配置；主或局部enable关闭、bypass_stats开启、shm_zone为NULL均返回DECLINED。否则调用shm_add_server，失败仅记录日志，最终返回DECLINED，不把统计失败改写成业务拒绝。

   本步证据：`final25-log-register`（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:876–884）；`final25-log-finish`（nginx:src/http/ngx_http_request.c:3744–3748）；`final25-log-call`（nginx:src/http/ngx_http_request.c:3793–3808）；`final25-stats-entry`（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:290–304）；`final25-stats-return`（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:314–329）。

2. 生成server分组键：仅在filter、filter_host均开启且r->headers_in.server.len非零时，取已解析的Host值作为分组；否则使用cscf->server_name，空名回退下划线。生成带分组前缀与分隔符的键，内存分配失败返回NGX_ERROR；本开关改变统计分组，不是访问控制。

   本步证据：`final25-host-key`（nginx-module-vts:src/ngx_http_vhost_traffic_status_shm.c:521–554）；`final25-key-build`（nginx-module-vts:src/ngx_http_vhost_traffic_status_node.c:13–36）。

3. 键生成成功，进入共享区server节点更新：空key返回NGX_ERROR。计算hash后持共享锁查红黑树；未命中分配节点，分配失败解锁返回错误；启用指定状态计数时，附加计数数组分配失败会释放新节点并解锁返回。server类型不触发filter分组LRU淘汰，不能保证共享区自动扩容或按请求释放节点。

   本步证据：`final25-shared-node`（nginx-module-vts:src/ngx_http_vhost_traffic_status_shm.c:178–283）；`final25-node-find`（nginx-module-vts:src/ngx_http_vhost_traffic_status_node.c:98–117）；`final25-server-no-lru`（nginx-module-vts:src/ngx_http_vhost_traffic_status_node.c:218–245）。

4. 共享锁内新增或命中server节点，state为NULL：新节点初始化后插入树，已有节点调用node_set；两条路径均调用node_update。更新last_seen后，命中ignore_status则提前返回，不增加请求计数；否则增加请求计数、按r->request_length与r->connection->sent累计字节，并累计请求耗时。这里按源码字段说明，不推断线上统计与网络抓包逐字节一致。server类型跳过upstream附加分支，最后解锁。

   本步证据：`final25-host-key`（nginx-module-vts:src/ngx_http_vhost_traffic_status_shm.c:521–554）；`final25-shared-node`（nginx-module-vts:src/ngx_http_vhost_traffic_status_shm.c:178–283）；`final25-node-update-call`（nginx-module-vts:src/ngx_http_vhost_traffic_status_node.c:449–503）；`final25-node-update`（nginx-module-vts:src/ngx_http_vhost_traffic_status_node.c:506–587）；`final25-shared-unlock`（nginx-module-vts:src/ngx_http_vhost_traffic_status_shm.c:285–325）。

独立文档：README.md:1428–1441。

### nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_zone

限定共享区的server请求统计更新及JSON读取：配置共享区之后才有运行消费者，不保证无限容量、持久化或涵盖所有upstream/filter/cache统计分支。

1. 请求结束进入LOG阶段，模块已注册统计handler：Nginx在尚未记录日志时调用LOG handler数组。VTS读取主配置和局部配置；主或局部enable关闭、bypass_stats开启、shm_zone为NULL均返回DECLINED。否则调用shm_add_server，失败仅记录日志，最终返回DECLINED，不把统计失败改写成业务拒绝。

   本步证据：`final25-log-register`（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:876–884）；`final25-log-finish`（nginx:src/http/ngx_http_request.c:3744–3748）；`final25-log-call`（nginx:src/http/ngx_http_request.c:3793–3808）；`final25-stats-entry`（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:290–304）；`final25-stats-return`（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:314–329）。

2. 生成server分组键：仅在filter、filter_host均开启且r->headers_in.server.len非零时，取已解析的Host值作为分组；否则使用cscf->server_name，空名回退下划线。生成带分组前缀与分隔符的键，内存分配失败返回NGX_ERROR；本开关改变统计分组，不是访问控制。

   本步证据：`final25-host-key`（nginx-module-vts:src/ngx_http_vhost_traffic_status_shm.c:521–554）；`final25-key-build`（nginx-module-vts:src/ngx_http_vhost_traffic_status_node.c:13–36）。

3. 键生成成功，进入共享区server节点更新：空key返回NGX_ERROR。计算hash后持共享锁查红黑树；未命中分配节点，分配失败解锁返回错误；启用指定状态计数时，附加计数数组分配失败会释放新节点并解锁返回。server类型不触发filter分组LRU淘汰，不能保证共享区自动扩容或按请求释放节点。

   本步证据：`final25-shared-node`（nginx-module-vts:src/ngx_http_vhost_traffic_status_shm.c:178–283）；`final25-node-find`（nginx-module-vts:src/ngx_http_vhost_traffic_status_node.c:98–117）；`final25-server-no-lru`（nginx-module-vts:src/ngx_http_vhost_traffic_status_node.c:218–245）。

4. 共享锁内新增或命中server节点，state为NULL：新节点初始化后插入树，已有节点调用node_set；两条路径均调用node_update。更新last_seen后，命中ignore_status则提前返回，不增加请求计数；否则增加请求计数、按r->request_length与r->connection->sent累计字节，并累计请求耗时。这里按源码字段说明，不推断线上统计与网络抓包逐字节一致。server类型跳过upstream附加分支，最后解锁。

   本步证据：`final25-host-key`（nginx-module-vts:src/ngx_http_vhost_traffic_status_shm.c:521–554）；`final25-shared-node`（nginx-module-vts:src/ngx_http_vhost_traffic_status_shm.c:178–283）；`final25-node-update-call`（nginx-module-vts:src/ngx_http_vhost_traffic_status_node.c:449–503）；`final25-node-update`（nginx-module-vts:src/ngx_http_vhost_traffic_status_node.c:506–587）；`final25-shared-unlock`（nginx-module-vts:src/ngx_http_vhost_traffic_status_shm.c:285–325）。

5. 展示请求选择JSON分支读取同一统计树：展示handler在共享锁内调用display_set，从ctx->rbtree->root读取server节点，取请求及字节计数生成serverZones后解锁。输出节点前检查缓冲容量，不足时保留原buf并跳过该节点；因此生成JSON不等于所有节点一定完整展示。本项不展开全部JSON字段、控制删除或dump恢复。

   本步证据：`final25-display-data`（nginx-module-vts:src/ngx_http_vhost_traffic_status_display.c:541–570）；`final25-json-tree`（nginx-module-vts:src/ngx_http_vhost_traffic_status_display_json.c:875–909）；`final25-json-server`（nginx-module-vts:src/ngx_http_vhost_traffic_status_display_json.c:261–294）；`final25-json-server-output`（nginx-module-vts:src/ngx_http_vhost_traffic_status_display_json.c:147–162）；`final25-display-buffer-check`（nginx-module-vts:src/ngx_http_vhost_traffic_status_display.c:770–799）。

独立文档：README.md:1339–1359；README.md:709–719；README.md:196–206。

### nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_display

限定普通GET/HEAD展示入口、格式分派、HTML框架与JSON server统计读取、容量/发送失败；不包括/control管理API、完整JSON/Prometheus字段或现场访问权限验证。

1. 进入已选择的VTS content handler：location有效handler被复制到r->content_handler，content阶段实际调用并把返回值交给finalize。VTS主enable关闭返回501，仅允许GET/HEAD，其余方法返回405；结尾/control进入单独控制分支，本项不核其管理操作，只核普通展示路径。

   本步证据：`final25-display-binding`（nginx-module-vts:src/ngx_http_vhost_traffic_status_display.c:1039–1048）；`final25-content-select`（nginx:src/http/ngx_http_core_module.c:1381–1384）；`final25-content-call`（nginx:src/http/ngx_http_core_module.c:1259–1263）；`final25-display-entry`（nginx-module-vts:src/ngx_http_vhost_traffic_status_display.c:115–157）。

2. 普通展示请求选择输出格式：在URI中按源码扫描/format/片段，识别jsonp、json、html、prometheus；识别结果优先于配置，未识别则回退vtscf->format。字符串按对应前缀长度比较，不声称严格完整路径匹配。该行为不是根据Accept自动协商。

   本步证据：`final25-display-format`（nginx-module-vts:src/ngx_http_vhost_traffic_status_display.c:422–492）。

3. 格式确定后准备响应：先丢弃请求正文，失败直接返回其rc；按格式设置Content-Type。HEAD先发送响应头，遇ERROR、正返回值或header_only直接返回；不声称HEAD必定进入统计树遍历。获取所需大小返回NGX_ERROR或创建缓冲失败则500。

   本步证据：`final25-display-prepare`（nginx-module-vts:src/ngx_http_vhost_traffic_status_display.c:494–539）。

4. GET等尚未提前返回的请求进入JSON、JSONP或Prometheus分派：三个数据分支各自在共享锁内调用对应生成函数再解锁；JSON空输出补{}，JSONP用配置callback及括号包装，Prometheus空输出补#。这里只核格式分派及JSON server节点读取与缓冲检查，不代表完整指标、转义与所有上游字段均已审。JSON节点空间不足时跳过节点，不能以200推断数据完整。

   本步证据：`final25-display-data`（nginx-module-vts:src/ngx_http_vhost_traffic_status_display.c:541–570）；`final25-json-tree`（nginx-module-vts:src/ngx_http_vhost_traffic_status_display_json.c:875–909）；`final25-json-server`（nginx-module-vts:src/ngx_http_vhost_traffic_status_display_json.c:261–294）；`final25-json-server-output`（nginx-module-vts:src/ngx_http_vhost_traffic_status_display_json.c:147–162）；`final25-display-buffer-check`（nginx-module-vts:src/ngx_http_vhost_traffic_status_display.c:770–799）。

5. HTML分支而非直接输出统计JSON：裁剪页面前缀URI的尾斜杠，必要时转义HTML；转义缓冲分配失败或输出缓冲容不下内置HTML模板返回500，否则插入模板。本分支生成页面框架，README说明前端另请求/format/json读取统计；不是在这里同步遍历全部统计树。

   本步证据：`final25-display-html`（nginx-module-vts:src/ngx_http_vhost_traffic_status_display.c:571–601）。

6. 展示缓冲生成后交给Nginx输出链：设置200和实际正文长度，主请求标last_buf，链尾标last_in_chain；send_header返回ERROR、正值或header_only时直接返回，其他情况返回output_filter结果。这里只证明模块输出调用与返回，不保证客户端已收到、没有后续过滤器或网络失败。

   本步证据：`final25-display-output`（nginx-module-vts:src/ngx_http_vhost_traffic_status_display.c:603–618）。

独立文档：README.md:196–206。

### nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_display_format

限定配置格式被普通展示请求消费的优先级及输出分派；URI可覆盖配置，HTML框架与统计数据请求分开。不是全部VTS API或输出字段完整性验证。

1. 进入已选择的VTS content handler：location有效handler被复制到r->content_handler，content阶段实际调用并把返回值交给finalize。VTS主enable关闭返回501，仅允许GET/HEAD，其余方法返回405；结尾/control进入单独控制分支，本项不核其管理操作，只核普通展示路径。

   本步证据：`final25-display-binding`（nginx-module-vts:src/ngx_http_vhost_traffic_status_display.c:1039–1048）；`final25-content-select`（nginx:src/http/ngx_http_core_module.c:1381–1384）；`final25-content-call`（nginx:src/http/ngx_http_core_module.c:1259–1263）；`final25-display-entry`（nginx-module-vts:src/ngx_http_vhost_traffic_status_display.c:115–157）。

2. 普通展示请求选择输出格式：在URI中按源码扫描/format/片段，识别jsonp、json、html、prometheus；识别结果优先于配置，未识别则回退vtscf->format。字符串按对应前缀长度比较，不声称严格完整路径匹配。该行为不是根据Accept自动协商。

   本步证据：`final25-display-format`（nginx-module-vts:src/ngx_http_vhost_traffic_status_display.c:422–492）。

3. 格式确定后准备响应：先丢弃请求正文，失败直接返回其rc；按格式设置Content-Type。HEAD先发送响应头，遇ERROR、正返回值或header_only直接返回；不声称HEAD必定进入统计树遍历。获取所需大小返回NGX_ERROR或创建缓冲失败则500。

   本步证据：`final25-display-prepare`（nginx-module-vts:src/ngx_http_vhost_traffic_status_display.c:494–539）。

4. GET等尚未提前返回的请求进入JSON、JSONP或Prometheus分派：三个数据分支各自在共享锁内调用对应生成函数再解锁；JSON空输出补{}，JSONP用配置callback及括号包装，Prometheus空输出补#。这里只核格式分派及JSON server节点读取与缓冲检查，不代表完整指标、转义与所有上游字段均已审。JSON节点空间不足时跳过节点，不能以200推断数据完整。

   本步证据：`final25-display-data`（nginx-module-vts:src/ngx_http_vhost_traffic_status_display.c:541–570）；`final25-json-tree`（nginx-module-vts:src/ngx_http_vhost_traffic_status_display_json.c:875–909）；`final25-json-server`（nginx-module-vts:src/ngx_http_vhost_traffic_status_display_json.c:261–294）；`final25-json-server-output`（nginx-module-vts:src/ngx_http_vhost_traffic_status_display_json.c:147–162）；`final25-display-buffer-check`（nginx-module-vts:src/ngx_http_vhost_traffic_status_display.c:770–799）。

5. HTML分支而非直接输出统计JSON：裁剪页面前缀URI的尾斜杠，必要时转义HTML；转义缓冲分配失败或输出缓冲容不下内置HTML模板返回500，否则插入模板。本分支生成页面框架，README说明前端另请求/format/json读取统计；不是在这里同步遍历全部统计树。

   本步证据：`final25-display-html`（nginx-module-vts:src/ngx_http_vhost_traffic_status_display.c:571–601）。

6. 展示缓冲生成后交给Nginx输出链：设置200和实际正文长度，主请求标last_buf，链尾标last_in_chain；send_header返回ERROR、正值或header_only时直接返回，其他情况返回output_filter结果。这里只证明模块输出调用与返回，不保证客户端已收到、没有后续过滤器或网络失败。

   本步证据：`final25-display-output`（nginx-module-vts:src/ngx_http_vhost_traffic_status_display.c:603–618）。

独立文档：README.md:1384–1396；README.md:196–206。

## 34补丁边界复核

逐文件读取固定OpenResty8c37412c31621225e7aa7e825b5b50106c9c71c4的34项有效补丁，保留NGINX_PATCH_AUDIT.json原集合/顺序/替换规则。初次只识别+++ b/会漏掉版本目录格式，已改为所有+++路径剥首目录与时间戳重新完整核对，初次输出不作为结论。

VTS源码不在发行补丁集合内；新引Nginx范围仅为request.c3744–3748及3793–3808，core_module.c1259–1263及1381–1384。34项中仅no_error_pages与所引core_module文件重合，已读完整补丁：变更在配置注册、create/merge和error_page解析，不改所引content handler选择/调用。其余33项无上述两个Nginx文件交集。未据此宣称被调用公共logger、响应过滤链或错误页内部不受影响；本轮不把这些内部函数作为VTS已审范围。旧display配置create/merge宽片段保持原事实，不把其全部内容当新增运行证据。

| 顺序 | 补丁 | 新增引用交集 |
| --- | --- | --- |
| 1 | win32_max_err_str | 无所引Nginx文件交集；不修改VTS源码 |
| 2 | stream_balancer_export | 无所引Nginx文件交集；不修改VTS源码 |
| 3 | stream_proxy_get_next_upstream_tries | 无所引Nginx文件交集；不修改VTS源码 |
| 4 | stream_proxy_timeout_fields | 无所引Nginx文件交集；不修改VTS源码 |
| 5 | stream_ssl_preread_no_skip | 无所引Nginx文件交集；不修改VTS源码 |
| 6 | resolver_conf_parsing | 无所引Nginx文件交集；不修改VTS源码 |
| 7 | daemon_destroy_pool | 无所引Nginx文件交集；不修改VTS源码 |
| 8 | init_cycle_pool_release | 无所引Nginx文件交集；不修改VTS源码 |
| 9 | balancer_status_code | 无所引Nginx文件交集；不修改VTS源码 |
| 10 | builtin_error_page_footer | 无所引Nginx文件交集；不修改VTS源码 |
| 11 | delayed_posted_events | 无所引Nginx文件交集；不修改VTS源码 |
| 12 | privileged_agent_process | 无所引Nginx文件交集；不修改VTS源码 |
| 13 | privileged_agent_process_connections | 无所引Nginx文件交集；不修改VTS源码 |
| 14 | privileged_agent_process_thread_pool | 无所引Nginx文件交集；不修改VTS源码 |
| 15 | single_process_graceful_exit | 无所引Nginx文件交集；不修改VTS源码 |
| 16 | intercept_error_log | 无所引Nginx文件交集；不修改VTS源码 |
| 17 | upstream_pipelining | 无所引Nginx文件交集；不修改VTS源码 |
| 18 | server_header | 无所引Nginx文件交集；不修改VTS源码 |
| 19 | no_error_pages | 同文件配置分支，已读完整hunk，无新增运行区间交集 |
| 20 | no_Werror | 无所引Nginx文件交集；不修改VTS源码 |
| 21 | log_escape_non_ascii | 无所引Nginx文件交集；不修改VTS源码 |
| 22 | proxy_host_port_vars | 无所引Nginx文件交集；不修改VTS源码 |
| 23 | cache_manager_exit | 无所引Nginx文件交集；不修改VTS源码 |
| 24 | larger_max_error_str | 无所引Nginx文件交集；不修改VTS源码 |
| 25 | pcre_conf_opt | 无所引Nginx文件交集；不修改VTS源码 |
| 26 | always_enable_cc_feature_tests | 无所引Nginx文件交集；不修改VTS源码 |
| 27 | ssl_cert_cb_yield | 无所引Nginx文件交集；不修改VTS源码 |
| 28 | ssl_sess_cb_yield | 无所引Nginx文件交集；不修改VTS源码 |
| 29 | ssl_client_hello_cb_yield | 无所引Nginx文件交集；不修改VTS源码 |
| 30 | upstream_timeout_fields | 无所引Nginx文件交集；不修改VTS源码 |
| 31 | safe_resolver_ipv6_option | 无所引Nginx文件交集；不修改VTS源码 |
| 32 | socket_cloexec | 无所引Nginx文件交集；不修改VTS源码 |
| 33 | reuseport_close_unused_fds | 无所引Nginx文件交集；不修改VTS源码 |
| 34 | proc_exit_handler | 无所引Nginx文件交集；不修改VTS源码 |

以上为主实施核对，不替代独立审核。未运行OpenResty，未验证现场VTS安装、访问控制、响应完整性或性能。

## 最终统一交付

四项已纳入`1.27.1.1-1c2ead24459672e6`，extensions.json SHA-256为`e0e7f95436f03d97242d7907f34a749e5aa9e2fe9c48a65d70745f877a111942`；其他20项扩展知识保持原样。独立内容及实际发布来源复核见SAMPLE_FINAL25_RUNTIME_REVIEW.md。主统一测试89项定向、247项全量均通过，网页四项21步和94条完整sources与同发布详情逐字段一致；原样例回放、最终截图及全部25项交付见SAMPLE_FINAL25_RUNTIME_VERIFICATION.md。
