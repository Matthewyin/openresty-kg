# B06 字段证据记录

范围：nginx ngx_http_uwsgi_module，共 60 条。固定 revision：nginx release-1.27.1；涉及补丁的条目按已有补丁来源核对（upstream_timeout_fields、upstream_pipelining、no_error_pages；其余 1.27.1 补丁未触及所引片段）。官方文档为现行版本，仅作交叉印证。

## nginx--ngx_http_uwsgi_module--uwsgi_pass

- 语法（`uwsgi_pass [protocol://]address;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_http_uwsgi_pass 取 value[1] 为地址，可带 uwsgi:// 或 suwsgi:// 前缀（大小写不敏感，无前缀即 uwsgi），含变量时编译为脚本，与 `[protocol://]address` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2, implementation-4, implementation-5, summary-ssl-start
  - 判据：setter 设 clcf->handler=ngx_http_uwsgi_handler，并按前缀确定 uwsgi/suwsgi（suwsgi 置 uwcf->ssl，无 SSL 编译时报错；含变量则由 ngx_http_uwsgi_eval 在请求时求值并设 u->ssl）；ngx_http_update_location_config 把 clcf->handler 赋给 r->content_handler，content 阶段 ngx_http_core_content_phase 调用它；handler 登记 create_request，其写入 4 字节 uWSGI 包头及参数块；u->ssl 为真且连接无 ssl 时 upstream 进入 TLS 握手。
- 新增片段：summary-ssl-start（src/http/ngx_http_upstream.c:1669-1674）

## nginx--ngx_http_uwsgi_module--uwsgi_modifier1

- 语法（`uwsgi_modifier1 number;`）：verified；source_ids：registration, configuration-definition, implementation-0, implementation-1
  - 判据：注册为 NGX_CONF_TAKE1；ngx_conf_set_num_slot 解析整数，注册的 post 指向 ngx_http_uwsgi_modifier_bounds（0–255），由 ngx_conf_check_num_bounds 检查，与 `number` 一致。
- 功能：verified；source_ids：registration, implementation-2, summary-req-conf, merge-default
  - 判据：指令经 offsetof 写入 ngx_http_uwsgi_loc_conf_t.modifier1，merge 默认 0；create_request 以 ngx_http_get_module_loc_conf 取该配置，包头第一个写入的字节 *b->last++ = uwcf->modifier1，随后是两字节长度，最后才是 modifier2。
- 新增片段：summary-req-conf（src/http/modules/ngx_http_uwsgi_module.c:863-873）

## nginx--ngx_http_uwsgi_module--uwsgi_modifier2

- 语法（`uwsgi_modifier2 number;`）：verified；source_ids：registration, configuration-definition, implementation-0, implementation-1
  - 判据：注册为 NGX_CONF_TAKE1；ngx_conf_set_num_slot 解析整数，post 为 0–255 的数值边界检查，与 `number` 一致。
- 功能：verified；source_ids：registration, implementation-2, summary-req-conf, merge-default
  - 判据：指令经 offsetof 写入 loc_conf.modifier2，merge 默认 0；create_request 写完 modifier1 与两字节长度后，第四个字节 *b->last++ = uwcf->modifier2。
- 新增片段：summary-req-conf（src/http/modules/ngx_http_uwsgi_module.c:863-873）

## nginx--ngx_http_uwsgi_module--uwsgi_store

- 语法（`uwsgi_store on | off | string;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_http_uwsgi_store 对 value[1] 依次判断 off、on，其余作为含变量的脚本路径编译，与 `on | off | string` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2, summary-store-init, summary-store-pipe, summary-map-uri, upstream-binding
  - 判据：setter 置 upstream.store=1，字符串形式编译为 store_lengths/store_values（merge 中 store 与 cache 互斥）；请求初始化 u->store=u->conf->store，响应走事件管道时 p->cacheable 含 u->store，从而写临时文件；结束时仅当 u->store 且状态 200、管道读完并与 Content-Length 一致才调用 ngx_http_upstream_store：store_lengths 为空（on）用 ngx_http_map_uri_to_path 按 root/alias 映射 URI，否则运行脚本得到路径，最后 ngx_ext_rename_file 落定。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）
- 新增片段：summary-store-init（src/http/ngx_http_upstream.c:612-612）；summary-store-pipe（src/http/ngx_http_upstream.c:3242-3242）；summary-map-uri（src/http/ngx_http_core_module.c:1875-1905）

## nginx--ngx_http_uwsgi_module--uwsgi_store_access

- 语法（`uwsgi_store_access users:permissions ...;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE123；ngx_conf_set_access_slot 逐个参数要求 user:/group:/all: 前缀加 r 或 rw，1–3 个参数对应三类对象，与 `users:permissions ...` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, merge-default, upstream-binding
  - 判据：值存入 upstream.store_access（merge 默认 0600）；ngx_http_upstream_store 把它同时赋给 ext.access（文件）与 ext.path_access（创建路径时的目录），ngx_ext_rename_file 在非 Windows 下对源文件 ngx_change_file_access，目标路径不存在时以 ngx_dir_access(path_access) 创建目录；access slot 把 user/group/all 的 r/rw 移位组合成权限位。该权限在 store 落定（重命名）步骤施加。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_buffering

- 语法（`uwsgi_buffering on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG（1 个参数）；ngx_conf_set_flag_slot 只接受 on/off，与语法 on | off 一致。
- 功能：verified；source_ids：registration, merge-default, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4, implementation-5, upstream-binding
  - 判据：ngx_http_uwsgi_handler 令 u->buffering=uwcf->upstream.buffering（指令值经 offsetof 注册，merge 默认 on）；ngx_http_upstream_send_response 中 !u->buffering 分支走 ngx_http_upstream_process_non_buffered_* 与 input_filter 的非缓冲路径，否则建立 ngx_event_pipe 缓冲（p->bufs、busy_size、临时文件等）；X-Accel-Buffering 头可按 ignore_headers 与 change_buffering 改写 u->buffering。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_request_buffering

- 语法（`uwsgi_request_buffering on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG（1 个参数）；ngx_conf_set_flag_slot 只接受 on/off，与语法 on | off 一致。
- 功能：verified；source_ids：registration, implementation-0, summary-body-start, summary-body-wait, implementation-2, implementation-3, implementation-4, upstream-pipelining, upstream-binding
  - 判据：handler 在 !request_buffering 且 pass_request_body 且请求非 chunked 时置 r->request_body_no_buffering=1，再以 ngx_http_upstream_init 为 post_handler 调用 ngx_http_read_client_request_body：无缓冲时在读完预读数据后即调用 post_handler（正文未读完，rc==NGX_AGAIN 时 reading_body=1），有缓冲时 post_handler 要等正文读完才调用。上游重试判断也以 request_body_no_buffering 限制已发送请求的重试。补丁 upstream_pipelining 只改 send_request_handler 的写事件收尾条件（header_sent→request_body_sent），不改变该陈述。 handler 取 uwcf=ngx_http_get_module_loc_conf 后读取 uwcf->upstream.request_buffering，并令 u->conf=&uwcf->upstream（upstream-binding）。
- 新增片段：summary-body-start（src/http/ngx_http_request_body.c:204-221）；summary-body-wait（src/http/ngx_http_request_body.c:456-459）

## nginx--ngx_http_uwsgi_module--uwsgi_ignore_client_abort

- 语法（`uwsgi_ignore_client_abort on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG（1 个参数）；ngx_conf_set_flag_slot 只接受 on/off，与语法 on | off 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, upstream-binding
  - 判据：值经 offsetof 存入 upstream.ignore_client_abort；ngx_http_upstream_init_request 仅在 !u->store && !post_action && !ignore_client_abort 时安装 rd/wr_check_broken_connection；客户端断开时该检查在 !u->cacheable 且已有上游连接时 finalize 并关闭上游连接。为 on 则不安装该检查，上游连接不因客户端断开而主动关闭。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_bind

- 语法（`uwsgi_bind address [transparent] | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE12；ngx_http_upstream_bind_set_slot 在 2 个参数且为 off 时清空，否则 value[1] 为地址（可含变量），第三个参数只允许 transparent（需 NGX_HAVE_TRANSPARENT_PROXY，否则日志提示忽略），与 `address [transparent] | off` 一致。
- 功能：verified；source_ids：registration, configuration-definition, implementation-0, implementation-1, implementation-2, upstream-binding
  - 判据：值存入 upstream.local；ngx_http_upstream_init_request 调 ngx_http_upstream_set_local，把 local->addr（或变量求值后解析出的地址）赋给 u->peer.local，并在 NGX_HAVE_TRANSPARENT_PROXY 下传入 transparent；ngx_event_connect_peer 对 pc->local 非空时（透明模式先设透明选项）bind(pc->local->sockaddr)。透明绑定受平台宏限制。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_socket_keepalive

- 语法（`uwsgi_socket_keepalive on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG（1 个参数）；ngx_conf_set_flag_slot 只接受 on/off，与语法 on | off 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, upstream-binding
  - 判据：值存入 upstream.socket_keepalive；ngx_http_upstream_init_request 在其为真时置 u->peer.so_keepalive=1，ngx_event_connect_peer 在 pc->so_keepalive 为真时对新建套接字 setsockopt(SO_KEEPALIVE)。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_connect_timeout

- 语法（`uwsgi_connect_timeout time;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_conf_set_msec_slot 把唯一参数按时间解析为毫秒，与 `time` 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, upstream-timeout-fields, upstream-binding
  - 判据：补丁 upstream_timeout_fields 在 ngx_http_upstream_init（uwsgi handler 以它作 post_handler）中令 u->connect_timeout=u->conf->connect_timeout；ngx_http_upstream_connect 在连接 rc==NGX_AGAIN 时 ngx_add_timer(c->write, connect_timeout)，TLS 握手 NGX_AGAIN 且无写定时器时同样以该值加定时器。未打补丁的基线是直接读 u->conf->connect_timeout，值相同。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_send_timeout

- 语法（`uwsgi_send_timeout time;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_conf_set_msec_slot 把唯一参数按时间解析为毫秒，与 `time` 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, upstream-timeout-fields, upstream-pipelining, upstream-binding
  - 判据：补丁 upstream_timeout_fields 令 u->send_timeout=u->conf->send_timeout；ngx_http_upstream_send_request 发送返回 NGX_AGAIN 且写事件未就绪或请求体阻塞时 ngx_add_timer(c->write, send_timeout)，已就绪则删除定时器；定时器触发时 ngx_http_upstream_send_request_handler 以 FT_TIMEOUT 进入 ngx_http_upstream_next。create_request 把参数与正文组织成待发送链。upstream_pipelining 仅改写事件收尾条件，不改变超时语义。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_buffer_size

- 语法（`uwsgi_buffer_size size;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_conf_set_size_slot 把唯一参数按大小解析，与 `size` 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4, upstream-binding
  - 判据：值存入 upstream.buffer_size（merge 默认一页）；ngx_http_upstream_process_header 以它分配 u->buffer 并在其中 recv，随后调用 u->process_header（uwsgi 的状态行解析 ngx_http_uwsgi_process_status_line 与响应头解析 ngx_http_uwsgi_process_header）；缓冲写满仍未解析完则报 too big header。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_pass_request_headers

- 语法（`uwsgi_pass_request_headers on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG（1 个参数）；ngx_conf_set_flag_slot 只接受 on/off，与语法 on | off 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-2, summary-req-conf, merge-default, upstream-binding
  - 判据：值经 offsetof 存入 upstream.pass_request_headers（merge 默认 on）；create_request 取 uwcf 后仅在其为真时遍历 r->headers_in.headers，把每个未被 uwsgi_param 同名覆盖的请求头编码为 `HTTP_` 前缀的 uWSGI 参数（键转大写、- 换 _，多值头合并）。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）
- 新增片段：summary-req-conf（src/http/modules/ngx_http_uwsgi_module.c:863-873）

## nginx--ngx_http_uwsgi_module--uwsgi_pass_request_body

- 语法（`uwsgi_pass_request_body on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG（1 个参数）；ngx_conf_set_flag_slot 只接受 on/off，与语法 on | off 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, summary-req-conf, merge-default, upstream-binding
  - 判据：值经 offsetof 存入 upstream.pass_request_body（merge 默认 on）；create_request 末尾：request_body_no_buffering 为真时 request_bufs 只指向头+参数缓冲（正文随后流式追加，而该标志只在 handler 里 pass_request_body 为真时才会置位）；否则仅当 pass_request_body 为真，才把原请求正文链复制接在头+参数缓冲之后，为假则 request_bufs 只含头与参数块。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）
- 新增片段：summary-req-conf（src/http/modules/ngx_http_uwsgi_module.c:863-873）

## nginx--ngx_http_uwsgi_module--uwsgi_intercept_errors

- 语法（`uwsgi_intercept_errors on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG（1 个参数）；ngx_conf_set_flag_slot 只接受 on/off，与语法 on | off 一致。
- 功能：verified；source_ids：registration, implementation-2, implementation-3, no-error-pages, upstream-binding
  - 判据：值存入 upstream.intercept_errors（merge 默认 off）；ngx_http_upstream_process_header 对 status>=300 的响应，先判重试，再调用 ngx_http_upstream_intercept_errors：其为假直接 DECLINED；为真且 clcf->error_pages 中有该状态码的 error_page 时 finalize 并以该状态码转入错误页流程（401 同时带上 WWW-Authenticate），否则 DECLINED 原样转发。补丁 no_error_pages 只让 error_pages 可为 NULL，该函数对 NULL 已 DECLINED。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_read_timeout

- 语法（`uwsgi_read_timeout time;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_conf_set_msec_slot 把唯一参数按时间解析为毫秒，与 `time` 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-2, implementation-3, implementation-4, upstream-timeout-fields, upstream-binding
  - 判据：补丁 upstream_timeout_fields 令 u->read_timeout=u->conf->read_timeout 并替换各处读定时器取值；请求发送完毕后 ngx_add_timer(c->read, read_timeout)，缓冲路径 p->read_timeout 赋同值，ngx_event_pipe 在上游读事件 active 且未就绪时按 p->read_timeout 加定时器、就绪则删除，非缓冲路径同样；故限制的是相邻两次读就绪之间的等待。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_buffers

- 语法（`uwsgi_buffers number size;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE2；ngx_conf_set_bufs_slot 取 value[1] 为数量、value[2] 为单块大小，与 `number size` 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, upstream-binding
  - 判据：值存入 upstream.bufs（merge 默认 8 块×一页，并要求至少 2 块）；send_response 中 p->bufs=u->conf->bufs，ngx_event_pipe_read_upstream 在 p->allocated<p->bufs.num 时以 p->bufs.size 创建缓冲，达到数量后不再分配。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_busy_buffers_size

- 语法（`uwsgi_busy_buffers_size size;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_conf_set_size_slot 把唯一参数按大小解析，与 `size` 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, summary-pipe-ended, implementation-2, upstream-binding
  - 判据：值存入 busy_buffers_size_conf，merge 后成为 upstream.busy_buffers_size（默认 2×max(buffer_size, bufs.size)，并校验范围）；send_response 令 p->busy_size 取它；ngx_event_pipe_write_to_downstream 在上游未结束（upstream_eof/error/done 的分支先行并整体冲出）时，累计 p->busy 中 recycled 缓冲，bsize>=busy_size 即 flush，并限制后续待输出缓冲总量。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）
- 新增片段：summary-pipe-ended（src/event/ngx_event_pipe.c:539-541）

## nginx--ngx_http_uwsgi_module--uwsgi_force_ranges

- 语法（`uwsgi_force_ranges on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG（1 个参数）；ngx_conf_set_flag_slot 只接受 on/off，与语法 on | off 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, upstream-binding
  - 判据：值存入 upstream.force_ranges；ngx_http_upstream_process_headers 在其为真时置 r->allow_ranges=1 与 r->single_range=1（命中缓存则 single_range 复位为 0），ngx_http_upstream_copy_allow_ranges 在其为真时直接返回而不转发上游 Accept-Ranges 头（该标志已在上面设置）。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_limit_rate

- 语法（`uwsgi_limit_rate rate;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_http_set_complex_value_size_slot 先按复合值编译，无变量时 ngx_parse_size 解析为数值，否则请求时再解析，与 `rate` 一致。
- 功能：verified；source_ids：registration, configuration-definition, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4, upstream-binding
  - 判据：值存入 upstream.limit_rate（复合值）；send_response 的缓冲路径令 p->limit_rate=ngx_http_complex_value_size(r, u->conf->limit_rate, 0)（请求时求值）；ngx_event_pipe_read_upstream 在 p->limit_rate 非零时按 limit_rate×已过秒数−已读字节算额度，额度用尽即对上游读事件设 delayed 并加延迟定时器。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_cache

- 语法（`uwsgi_cache zone | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_http_uwsgi_cache 对 value[1] 判断 off，否则按复合值编译（含变量存 cache_value，否则 ngx_shared_memory_add 注册共享区），与 `zone | off` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4, upstream-binding
  - 判据：setter 在 off 时置 cache=0，否则 cache=1 并记录共享区（merge 中与 uwsgi_store 互斥，并校验该区已由 uwsgi_cache_path 定义）；handler 把 u->caches 指向 uwsgi 主配置的 caches；ngx_http_upstream_init_request 在 u->conf->cache 为真时进入 ngx_http_upstream_cache，ngx_http_upstream_cache_get 取 cache_zone 或求值变量并在 caches 中按名称查找，求值为空或 off 则 DECLINED。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_cache_key

- 语法（`uwsgi_cache_key string;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_http_uwsgi_cache_key 把 value[1] 编译为复合值，与 `string` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2, upstream-binding, summary-create-key-call
  - 判据：setter 把表达式编译到 uwcf->cache_key（merge 缺省继承并在有 cache 无 key 时告警）；ngx_http_upstream_cache 调用 u->create_key=ngx_http_uwsgi_create_key，后者对 cache_key 求值并压入 r->cache->keys，ngx_http_file_cache_create_key 对这些键做 MD5/CRC32 得到缓存键。 handler 登记 u->create_key=ngx_http_uwsgi_create_key（upstream-binding），ngx_http_upstream_cache 在 850-860 依次调用 u->create_key(r) 与 ngx_http_file_cache_create_key(r)。
- 新增片段：summary-create-key-call（src/http/ngx_http_upstream.c:850-860）

## nginx--ngx_http_uwsgi_module--uwsgi_cache_path

- 语法（`uwsgi_cache_path path [levels=levels] [use_temp_path=on|off] keys_zone=name:size [inactive=time] [max_size=size] [min_free=size] [manager_files=number] [manager_sleep=time] [manager_threshold=time] [loader_files=number] [loader_sleep=time] [loader_threshold=time];`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_2MORE（path 加至少一个参数）；ngx_http_file_cache_set_slot 的循环依次识别 levels=、use_temp_path=on|off、keys_zone=name:size、inactive=、max_size=、min_free=、loader_/manager_ 的 files|sleep|threshold=，其余报错、缺 keys_zone 报错，与语法一致。官方文档另列 purger* 参数，锁定源码没有解析，语法文字也未列，不冲突。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-2, summary-inactive, implementation-3, implementation-4, implementation-5, summary-loader-limits, implementation-6, upstream-binding
  - 判据：注册的偏移指向 uwsgi 主配置的 caches 数组、post 为 ngx_http_uwsgi_module；set_slot 解析出目录、levels、keys_zone（ngx_shared_memory_add 建共享键索引）、inactive/max_size/min_free 与 manager/loader 参数，登记 manager/loader 回调并把缓存对象压入该数组；ngx_http_file_cache_name 用 levels 生成哈希路径，节点过期时间取 ngx_time()+cache->inactive，manager 按 max_size、min_free、manager_files/sleep/threshold 清理，loader 按 loader_files/threshold/sleep 限速加载；send_response 的 p->temp_file 依 use_temp_path 选临时目录。 handler 令 u->caches=&uwmcf->caches（upstream-binding），ngx_http_upstream_cache_get 在该数组中按名称取缓存。
- 新增片段：summary-inactive（src/http/ngx_http_file_cache.c:975-977）；summary-loader-limits（src/http/ngx_http_file_cache.c:2169-2187）

## nginx--ngx_http_uwsgi_module--uwsgi_cache_bypass

- 语法（`uwsgi_cache_bypass string ...;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_1MORE；ngx_http_set_predicate_slot 对 value[1..] 逐个编译复合值，与 `string ...` 一致。
- 功能：verified；source_ids：registration, configuration-definition, implementation-0, implementation-1, implementation-2, upstream-binding
  - 判据：值存入 upstream.cache_bypass（谓词数组）；ngx_http_upstream_cache 对其调用 ngx_http_test_predicates：任一表达式值非空且不为 "0" 即返回 DECLINED，此时 cache_status=BYPASS 并不读取缓存；其后响应阶段仍对 no_cache 判断，若此前为 bypass 则重新创建缓存文件。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_no_cache

- 语法（`uwsgi_no_cache string ...;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_1MORE；ngx_http_set_predicate_slot 对 value[1..] 逐个编译复合值，与 `string ...` 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, upstream-binding
  - 判据：值存入 upstream.no_cache；ngx_http_upstream_send_response 在缓冲路径对其调用 ngx_http_test_predicates，任一表达式非空且不为 "0" 即 DECLINED 并置 u->cacheable=0，故响应不写入缓存。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_cache_valid

- 语法（`uwsgi_cache_valid [code ...] time;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_1MORE；ngx_http_file_cache_valid_set_slot 把最后一个参数按时间解析，前面的为状态码（100–599 或 any），只给时间则默认 200/301/302，与 `[code ...] time` 一致。
- 功能：verified；source_ids：registration, configuration-definition, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4, implementation-5, implementation-6, upstream-binding
  - 判据：值存入 upstream.cache_valid；响应头处理里 X-Accel-Expires/Expires/Cache-Control 先设 cache->valid_sec；send_response 中 valid_sec==0 时才用 ngx_http_file_cache_valid(u->conf->cache_valid, status) 按状态码（或 any）取有效期并设 valid_sec，仍为 0 则 cacheable=0；因此它是上游头未给出有效期时的后备。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_cache_min_uses

- 语法（`uwsgi_cache_min_uses number;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_conf_set_num_slot 把唯一参数解析为整数，与 `number` 一致。
- 功能：verified；source_ids：registration, implementation-0, summary-min-uses-scarce, implementation-2, implementation-3, upstream-binding
  - 判据：值存入 upstream.cache_min_uses（merge 默认 1）；ngx_http_upstream_cache 令 c->min_uses=u->conf->cache_min_uses；ngx_http_file_cache_exists 在节点 fcn->exists 为假且 fcn->uses 小于 min_uses 时返回 NGX_AGAIN，ngx_http_file_cache_open 把它直接转为 NGX_HTTP_CACHE_SCARCE，ngx_http_upstream_cache 对 SCARCE 置 u->cacheable=0，不填充缓存。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）
- 新增片段：summary-min-uses-scarce（src/http/ngx_http_file_cache.c:299-310）

## nginx--ngx_http_uwsgi_module--uwsgi_cache_max_range_offset

- 语法（`uwsgi_cache_max_range_offset number;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_conf_set_off_slot 把参数按偏移量（off_t 大小）解析，与 `number` 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, upstream-binding
  - 判据：值存入 upstream.cache_max_range_offset（merge 默认不限）；ngx_http_upstream_cache 在未命中缓存时调用 ngx_http_upstream_cache_check_range：有 Range 头且 cacheable 时，值为 0 一律不缓存，bytes= 的起始偏移不小于该值（或后缀范围）即返回 DECLINED 并置 cacheable=0；不满足条件则正常缓存。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_cache_use_stale

- 语法（`uwsgi_cache_use_stale error | timeout | invalid_header | updating | http_500 | http_503 | http_403 | http_404 | http_429 | off ...;`）：verified；source_ids：registration, configuration-definition, implementation-0
  - 判据：注册为 NGX_CONF_1MORE；ngx_conf_set_bitmask_slot 依次匹配每个参数，取值表 ngx_http_uwsgi_next_upstream_masks 含 语法中的 error、timeout、invalid_header、updating、http_500/503/403/404/429、off，与语法一致（表含 non_idempotent，已按修正补入语法）。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4, upstream-binding
  - 判据：值存入 upstream.cache_use_stale（merge 默认 off，含 error 时附加 NOLIVE）；ngx_http_upstream_cache 在 STALE/UPDATING 时按 updating 位决定把旧缓存当作可用（后台更新或交给正在更新的请求）；ngx_http_upstream_test_next 与 ngx_http_upstream_next 在不满足重试条件、缓存状态为 EXPIRED 且失败类型命中 cache_use_stale 时，改发送旧缓存而非返回错误。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）
- 修正（语法）：uwsgi_cache_use_stale error | timeout | invalid_header | updating | http_500 | http_503 | http_403 | http_404 | http_429 | off ...; → uwsgi_cache_use_stale error | timeout | invalid_header | non_idempotent | updating | http_500 | http_503 | http_403 | http_404 | http_429 | off ...;
  - 理由：与 next_upstream 共用同一取值表，表内含 non_idempotent，该值被接受，原语法漏列。

## nginx--ngx_http_uwsgi_module--uwsgi_cache_methods

- 语法（`uwsgi_cache_methods GET | HEAD | POST ...;`）：verified；source_ids：registration, configuration-definition, implementation-2
  - 判据：注册为 NGX_CONF_1MORE；ngx_conf_set_bitmask_slot 匹配 ngx_http_upstream_cache_method_mask 的 GET、HEAD、POST，与语法一致（GET、HEAD 在 merge 中始终附加）。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, implementation-3, upstream-binding
  - 判据：值存入 upstream.cache_methods，merge 后再并入 GET|HEAD；ngx_http_upstream_cache 在 r->cache 为空时先判断 r->method & u->conf->cache_methods，不在其中即 DECLINED，不进入缓存流程；创建缓存键用的 u->create_key 在此之后才调用。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_cache_lock

- 语法（`uwsgi_cache_lock on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG（1 个参数）；ngx_conf_set_flag_slot 只接受 on/off，与语法 on | off 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, upstream-binding
  - 判据：值存入 upstream.cache_lock（merge 默认 off）；ngx_http_upstream_cache 令 c->lock=u->conf->cache_lock；ngx_http_file_cache_lock 在 c->lock 为假时直接 DECLINED，为真时以共享节点的 updating/lock_time 保证同一缓存键只有一个请求去填充，其余等待（NGX_AGAIN）并由 ngx_http_file_cache_lock_wait 轮询。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_cache_lock_timeout

- 语法（`uwsgi_cache_lock_timeout time;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_conf_set_msec_slot 把唯一参数按时间解析为毫秒，与 `time` 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, upstream-binding
  - 判据：值存入 upstream.cache_lock_timeout（merge 默认 5s）；ngx_http_upstream_cache 令 c->lock_timeout 取它；ngx_http_file_cache_lock 在等待时 wait_time=now+lock_timeout（为 0 则直接 SCARCE），ngx_http_file_cache_lock_wait 在 wait_time 到期后记 "cache lock timeout" 并置 lock_timeout=0，停止等待。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_cache_lock_age

- 语法（`uwsgi_cache_lock_age time;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_conf_set_msec_slot 把唯一参数按时间解析为毫秒，与 `time` 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, upstream-binding
  - 判据：值存入 upstream.cache_lock_age（merge 默认 5s）；ngx_http_upstream_cache 令 c->lock_age 取它；ngx_http_file_cache_lock 持锁时 node->lock_time=now+lock_age，之后请求发现 node->updating 但 lock_time 已过期（timer<=0）则自己重新取得锁并回源，故过旧锁放行一个新的填充请求。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_cache_revalidate

- 语法（`uwsgi_cache_revalidate on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG（1 个参数）；ngx_conf_set_flag_slot 只接受 on/off，与语法 on | off 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4, implementation-5, upstream-binding
  - 判据：值存入 upstream.cache_revalidate（merge 默认 off）；缓存状态为 EXPIRED 时 $upstream_cache_last_modified/$upstream_cache_etag 才有值，uwsgi 缓存请求参数把它们映射为 HTTP_IF_MODIFIED_SINCE、HTTP_IF_NONE_MATCH（并清空 If-Unmodified-Since/If-Match/Range 等），实现条件回源；ngx_http_upstream_test_next 在 304 且 cache_status==EXPIRED 且 cache_revalidate 时改发缓存并更新缓存头，状态 REVALIDATED。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_cache_background_update

- 语法（`uwsgi_cache_background_update on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1（1 个参数）；ngx_conf_set_flag_slot 只接受 on/off，与语法 on | off 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, upstream-binding
  - 判据：值存入 upstream.cache_background_update（merge 默认 off）；ngx_http_upstream_cache 在缓存 STALE 且（cache_use_stale 含 updating 或 c->stale_updating）、非后台请求、且该值为真时调用 ngx_http_upstream_cache_background_update，以 CLONE|BACKGROUND 子请求（header_only）重新取回对象，当前请求继续返回旧缓存（rc=NGX_OK）。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_temp_path

- 语法（`uwsgi_temp_path path [level1 [level2 [level3]]];`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1234（路径加最多 3 个层级参数）；ngx_conf_set_path_slot 取 value[1] 为路径，之后每个参数 ngx_atoi 为层级宽度（不得为 0，总长受限），与 `path [level1 [level2 [level3]]]` 一致。
- 功能：verified；source_ids：registration, configuration-definition, implementation-0, implementation-1, implementation-2, implementation-3, upstream-binding
  - 判据：值存入 upstream.temp_path，未配置时 merge 采用 ngx_http_uwsgi_temp_path（NGX_HTTP_UWSGI_TEMP_PATH，层级 {1,2,0}）；send_response 令 p->temp_file->path=u->conf->temp_path，缓冲响应溢出与 uwsgi_store 的临时文件都建在该路径下；注册标志 TAKE1234 即路径加至多 3 个层级参数。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_max_temp_file_size

- 语法（`uwsgi_max_temp_file_size size;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_conf_set_size_slot 把唯一参数按大小解析，与 `size` 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, implementation-3, upstream-binding
  - 判据：值存入 max_temp_file_size_conf，merge 后为 upstream.max_temp_file_size（默认 1GB，须为 0 或不小于缓冲大小）；send_response 令 p->max_temp_file_size 取它；ngx_event_pipe_read_upstream 在非 cacheable 响应且临时文件偏移已达该值时不再写临时文件，值为 0 即禁用；cache/store 响应（p->cacheable）不受该限制。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_temp_file_write_size

- 语法（`uwsgi_temp_file_write_size size;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_conf_set_size_slot 把唯一参数按大小解析，与 `size` 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, implementation-3, upstream-binding
  - 判据：值存入 temp_file_write_size_conf，merge 后为 upstream.temp_file_write_size（默认 2×max(buffer_size, bufs.size)）；send_response 令 p->temp_file_write_size 取它；ngx_event_pipe_write_chain_to_temp_file 在非 cacheable 响应中累计待写缓冲，超过该值就截断，一次最多写入该大小。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_next_upstream

- 语法（`uwsgi_next_upstream error | timeout | invalid_header | http_500 | http_503 | http_403 | http_404 | http_429 | non_idempotent | off ...;`）：verified；source_ids：registration, configuration-definition, implementation-0
  - 判据：注册为 NGX_CONF_1MORE；ngx_conf_set_bitmask_slot 匹配 ngx_http_uwsgi_next_upstream_masks，语法列出的 error、timeout、invalid_header、http_500/503/403/404/429、non_idempotent、off 都在表中（表含 updating，已按修正补入语法）。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-3, implementation-4, upstream-binding
  - 判据：值存入 upstream.next_upstream（merge 默认 error|timeout，含 off 则只剩 off）；ngx_http_upstream_next 与 ngx_http_upstream_test_next 只有在 (next_upstream & 失败类型)==失败类型、tries 未用尽、未超过 next_upstream_timeout、且非已发送的无缓冲请求时，才关闭当前连接并选下一个上游，否则 finalize 返回错误；POST/LOCK/PATCH 已发送请求另需 non_idempotent。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）
- 修正（语法）：uwsgi_next_upstream error | timeout | invalid_header | http_500 | http_503 | http_403 | http_404 | http_429 | non_idempotent | off ...; → uwsgi_next_upstream error | timeout | invalid_header | http_500 | http_503 | http_403 | http_404 | http_429 | non_idempotent | updating | off ...;
  - 理由：取值表 ngx_http_uwsgi_next_upstream_masks 含 updating，ngx_conf_set_bitmask_slot 对表内名称一律接受，原语法漏列。

## nginx--ngx_http_uwsgi_module--uwsgi_next_upstream_tries

- 语法（`uwsgi_next_upstream_tries number;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_conf_set_num_slot 把唯一参数解析为整数，与 `number` 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, implementation-3, upstream-binding
  - 判据：值存入 upstream.next_upstream_tries（merge 默认 0）；ngx_http_upstream_init_request 在其非 0 且 u->peer.tries 更大时把 peer.tries 压低为该值（只能收紧），ngx_http_upstream_next 在 u->peer.tries 为 0 时不再重试。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_next_upstream_timeout

- 语法（`uwsgi_next_upstream_timeout time;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_conf_set_msec_slot 把唯一参数按时间解析为毫秒，与 `time` 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, upstream-binding
  - 判据：值存入 upstream.next_upstream_timeout（merge 默认 0）；ngx_http_upstream_next 与 ngx_http_upstream_test_next 在其非 0 且 ngx_current_msec-u->peer.start_time 已达该值时不再切换上游并 finalize；peer.start_time 在 init_request 中设置，故限制的是从开始尝试起的时间窗口。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_param

- 语法（`uwsgi_param parameter value [if_not_empty];`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE23；ngx_http_upstream_param_set_slot 取 value[1] 为参数名、value[2] 为值，有第 4 项时必须为 if_not_empty（否则报 invalid parameter），与 `parameter value [if_not_empty]` 一致。
- 功能：verified；source_ids：configuration-definition, summary-req-conf, implementation-0, implementation-1, implementation-2, implementation-3
  - 判据：setter 把参数名、值（原样字符串）与 skip_empty 追加到 params_source；merge 时 ngx_http_uwsgi_init_params 用 ngx_http_script_compile 把值编译成含变量的长度/取值脚本；create_request 先按脚本算长度，再对每个参数写入“2 字节键长+键+2 字节值长+值”（skip_empty 且值为空则跳过），位于 4 字节包头之后、HTTP_ 请求头参数之前。
- 新增片段：summary-req-conf（src/http/modules/ngx_http_uwsgi_module.c:863-873）

## nginx--ngx_http_uwsgi_module--uwsgi_string

- 语法（`uwsgi_string string;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_conf_set_str_slot 原样保存唯一参数（原始字节串），与语法一致。
- 功能：verified；source_ids：registration, summary-req-conf, implementation-0, implementation-1
  - 判据：值经 offsetof 存入 uwcf->uwsgi_string（merge 默认空串）；create_request 把 uwsgi_string.len 计入包长（并校验不超过 65535），在写完全部参数与请求头参数之后 ngx_copy 原样追加其字节，位于请求正文之前。
- 新增片段：summary-req-conf（src/http/modules/ngx_http_uwsgi_module.c:863-873）

## nginx--ngx_http_uwsgi_module--uwsgi_pass_header

- 语法（`uwsgi_pass_header field;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_conf_set_str_array_slot 把唯一参数追加到字符串数组，与 `field` 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-3, summary-hash-skip, implementation-4, upstream-binding
  - 判据：值追加到 upstream.pass_headers；merge 时 ngx_http_upstream_hide_headers_hash 以默认隐藏表 ngx_http_uwsgi_hide_headers（X-Accel-*）与 uwsgi_hide_header 建隐藏哈希，再对 pass_headers 中每个名称把隐藏表里同名项的 key 置 NULL，ngx_hash_init 填充时跳过 key.data 为 NULL 的项（即剔除）；ngx_http_upstream_process_headers 对隐藏哈希命中的响应头跳过转发，被剔除的名称不再命中，该头便照常复制给客户端。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）
- 新增片段：summary-hash-skip（src/core/ngx_hash.c:424-427）

## nginx--ngx_http_uwsgi_module--uwsgi_hide_header

- 语法（`uwsgi_hide_header field;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_conf_set_str_array_slot 把唯一参数追加到字符串数组，与 `field` 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-3, implementation-4, upstream-binding
  - 判据：值追加到 upstream.hide_headers；ngx_http_upstream_hide_headers_hash 把默认隐藏头与 hide_headers 中未重复的名称加入隐藏哈希（再由 pass_header 剔除）；ngx_http_upstream_process_headers 对哈希命中的上游响应头直接 continue，不复制到下游响应头。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_ignore_headers

- 语法（`uwsgi_ignore_headers field ...;`）：verified；source_ids：registration, configuration-definition, implementation-1
  - 判据：注册为 NGX_CONF_1MORE；ngx_conf_set_bitmask_slot 匹配 ngx_http_upstream_ignore_headers_masks，名称为 X-Accel-Redirect、X-Accel-Expires、X-Accel-Limit-Rate、X-Accel-Buffering、X-Accel-Charset、Expires、Cache-Control、Set-Cookie、Vary，与 `field ...` 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4, implementation-5, implementation-6, implementation-7, implementation-8, upstream-binding
  - 判据：值存入 upstream.ignore_headers；ngx_http_uwsgi_process_header 对每个响应头按上游头哈希表调用处理函数，这些函数（X-Accel-Redirect、Set-Cookie、Cache-Control、Expires、X-Accel-Expires、X-Accel-Limit-Rate、X-Accel-Buffering、X-Accel-Charset、Vary）都先检查 u->conf->ignore_headers 对应位，置位则跳过各自的重定向、缓存有效期/不缓存、限速、缓冲开关、字符集覆盖或 Vary 处理。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）
- 修正（语法）：uwsgi_ignore_headers field ...; → uwsgi_ignore_headers X-Accel-Redirect | X-Accel-Expires | X-Accel-Limit-Rate | X-Accel-Buffering | X-Accel-Charset | Expires | Cache-Control | Set-Cookie | Vary ...;
  - 理由：源码只接受 ngx_http_upstream_ignore_headers_masks 的 9 个名称，原语法以泛称 field 表示，按裁定 2 改为列全取值。

## nginx--ngx_http_uwsgi_module--uwsgi_ssl_session_reuse

- 语法（`uwsgi_ssl_session_reuse on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG（1 个参数）；ngx_conf_set_flag_slot 只接受 on/off，与语法 on | off 一致。
- 功能：verified；source_ids：registration, ssl-setup-binding, implementation-0, implementation-1, implementation-2, implementation-3, upstream-binding
  - 判据：值存入 upstream.ssl_session_reuse（merge 默认 on）；uwsgi_set_ssl（仅 conf->ssl 即 suwsgi 时调用）把它传给 ngx_ssl_client_session_cache，启用客户端会话缓存模式并登记新会话回调；upstream 建立 TLS 连接时该值为真则登记 save_session，并通过 peer.set_session 取出已保存会话用于握手。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_ssl_protocols

- 语法（`uwsgi_ssl_protocols [SSLv2] [SSLv3] [TLSv1] [TLSv1.1] [TLSv1.2] [TLSv1.3];`）：verified；source_ids：registration, configuration-definition, implementation-0
  - 判据：注册为 NGX_CONF_1MORE；ngx_conf_set_bitmask_slot 匹配 ngx_http_uwsgi_ssl_protocols 表中的 SSLv2、SSLv3、TLSv1、TLSv1.1、TLSv1.2、TLSv1.3，与语法一致。
- 功能：verified；source_ids：registration, ssl-setup-binding, implementation-0, implementation-1, implementation-2, upstream-binding
  - 判据：值存入 ssl_protocols 位图（merge 默认 TLSv1|TLSv1.1|TLSv1.2|TLSv1.3）；ngx_http_uwsgi_set_ssl 在 suwsgi 时 ngx_ssl_create(upstream.ssl, ssl_protocols, NULL)，该函数对位图中缺失的协议版本设置 SSL_OP_NO_* 选项。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_ssl_ciphers

- 语法（`uwsgi_ssl_ciphers ciphers;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_conf_set_str_slot 原样保存唯一参数（密码串），与语法一致。
- 功能：verified；source_ids：registration, ssl-setup-binding, implementation-0, implementation-1
  - 判据：值存入 ssl_ciphers（merge 默认 "DEFAULT"）；ngx_http_uwsgi_set_ssl 把它传给 ngx_ssl_ciphers，后者直接调用 SSL_CTX_set_cipher_list(ssl->ctx, ciphers)，失败则报配置错误。

## nginx--ngx_http_uwsgi_module--uwsgi_ssl_name

- 语法（`uwsgi_ssl_name name;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_http_set_complex_value_slot 把唯一参数编译为复合值，与 `name` 一致。
- 功能：verified；source_ids：registration, configuration-definition, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4, upstream-binding
  - 判据：值存入 upstream.ssl_name（复合值，merge 默认无）；upstream 握手前若 ssl_server_name 或 ssl_verify 为真则调用 ngx_http_upstream_ssl_name：ssl_name 存在时对其求值作为名称，否则取 u->ssl_name（来自 resolved host 或 upstream 组 host）；ssl_server_name 开启时据此 SSL_set_tlsext_host_name 发送 SNI，最终写回 u->ssl_name；ssl_verify 开启时握手后 ngx_ssl_check_host(c, &u->ssl_name) 以它校验证书。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_ssl_server_name

- 语法（`uwsgi_ssl_server_name on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG（1 个参数）；ngx_conf_set_flag_slot 只接受 on/off，与语法 on | off 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, upstream-binding
  - 判据：值存入 upstream.ssl_server_name（merge 默认 off）；ngx_http_upstream_ssl_init_connection 在其或 ssl_verify 为真时调用 ngx_http_upstream_ssl_name，该函数仅当其为真（且名称非空、不是 IP 字面量，需 SSL_CTRL_SET_TLSEXT_HOSTNAME）才对 TLS 连接 SSL_set_tlsext_host_name，即握手发送 SNI。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_ssl_verify

- 语法（`uwsgi_ssl_verify on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG（1 个参数）；ngx_conf_set_flag_slot 只接受 on/off，与语法 on | off 一致。
- 功能：verified；source_ids：registration, ssl-setup-binding, implementation-0, implementation-1, implementation-2, implementation-3, upstream-binding
  - 判据：值存入 upstream.ssl_verify（merge 默认 off）；uwsgi_set_ssl 在其为真时要求 trusted_certificate 并加载信任证书与 CRL；握手完成后 ngx_http_upstream_ssl_handshake 在其为真时检查 SSL_get_verify_result==X509_V_OK，再 ngx_ssl_check_host 校验证书与 u->ssl_name 匹配，任一失败即记错并 ngx_http_upstream_next(FT_ERROR)。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_ssl_verify_depth

- 语法（`uwsgi_ssl_verify_depth number;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_conf_set_num_slot 把唯一参数解析为整数，与 `number` 一致。
- 功能：verified；source_ids：registration, ssl-setup-binding, implementation-0, implementation-1
  - 判据：值存入 ssl_verify_depth（merge 默认 1）；ngx_http_uwsgi_set_ssl 仅在 ssl_verify 为真时把它传给 ngx_ssl_trusted_certificate，后者调用 SSL_CTX_set_verify_depth(ssl->ctx, depth)，限定证书链验证深度。

## nginx--ngx_http_uwsgi_module--uwsgi_ssl_trusted_certificate

- 语法（`uwsgi_ssl_trusted_certificate file;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_conf_set_str_slot 原样保存唯一参数（文件路径），与语法一致。
- 功能：verified；source_ids：registration, ssl-setup-binding, implementation-0, implementation-1
  - 判据：值存入 ssl_trusted_certificate（merge 默认空串）；ngx_http_uwsgi_set_ssl 仅在 ssl_verify 为真时要求非空并传给 ngx_ssl_trusted_certificate，后者对 ssl->ctx 调用 SSL_CTX_load_verify_locations(file)，把该文件加载为验证后端证书的信任 CA 证书。
- 修正（功能）：指定验证suwsgi后端证书使用的PEM信任CA文件。 → 指定验证suwsgi后端证书使用的信任CA证书文件
  - 理由：锁定源码只证明该文件交给 SSL_CTX_load_verify_locations 加载为信任 CA；nginx 代码没有声明文件格式，“PEM”来自 OpenSSL 与官方文档，故收窄（ssl_crl 则有 X509_FILETYPE_PEM，未改）。

## nginx--ngx_http_uwsgi_module--uwsgi_ssl_crl

- 语法（`uwsgi_ssl_crl file;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_conf_set_str_slot 原样保存唯一参数（文件路径），与语法一致。
- 功能：verified；source_ids：registration, ssl-setup-binding, implementation-0, implementation-1
  - 判据：值存入 ssl_crl（merge 默认空串）；ngx_http_uwsgi_set_ssl 仅在 ssl_verify 为真时调用 ngx_ssl_crl，后者对非空文件 X509_LOOKUP_load_file(..., X509_FILETYPE_PEM) 并设置 X509_V_FLAG_CRL_CHECK|CRL_CHECK_ALL，使验证使用该 PEM CRL。

## nginx--ngx_http_uwsgi_module--uwsgi_ssl_certificate

- 语法（`uwsgi_ssl_certificate file;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_http_set_complex_value_zero_slot 把唯一参数编译为以 \0 结尾的复合值，与 `file` 一致。
- 功能：verified；source_ids：registration, ssl-setup-binding, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4, summary-ssl-client-ctx, upstream-binding
  - 判据：值存入 upstream.ssl_certificate；upstream 的 TLS 连接以 u->conf->ssl 创建，标志含 NGX_SSL_CLIENT，即客户端侧上下文；uwsgi_set_ssl 对不含变量的证书与私钥在配置期调用 ngx_ssl_certificate（SSL_CTX_use_certificate），含变量时握手前由 ngx_http_upstream_ssl_certificate 求值并 ngx_ssl_connection_certificate（SSL_use_certificate）设到该连接；缺私钥时配置报错。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）
- 新增片段：summary-ssl-client-ctx（src/http/ngx_http_upstream.c:1696-1697）

## nginx--ngx_http_uwsgi_module--uwsgi_ssl_certificate_key

- 语法（`uwsgi_ssl_certificate_key file;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_http_set_complex_value_zero_slot 把唯一参数编译为以 \0 结尾的复合值，与 `file` 一致。
- 功能：verified；source_ids：registration, ssl-setup-binding, implementation-0, implementation-1, implementation-2, implementation-3, summary-ssl-client-ctx, upstream-binding
  - 判据：值存入 upstream.ssl_certificate_key；uwsgi_set_ssl 在证书非空时要求它存在，静态路径交 ngx_ssl_certificate 加载（经 ngx_ssl_load_certificate_key 读取 PEM 私钥，支持 engine: 形式）并绑定到客户端侧 SSL_CTX，含变量时握手前由 ngx_http_upstream_ssl_certificate 求值后 ngx_ssl_connection_certificate 对连接 SSL_use_PrivateKey。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）
- 新增片段：summary-ssl-client-ctx（src/http/ngx_http_upstream.c:1696-1697）

## nginx--ngx_http_uwsgi_module--uwsgi_ssl_password_file

- 语法（`uwsgi_ssl_password_file file;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_http_uwsgi_ssl_password_file 取 value[1] 调 ngx_ssl_read_password_file，重复配置报 is duplicate，与 `file` 一致。
- 功能：verified；source_ids：registration, configuration-definition, implementation-0, implementation-1, implementation-2, implementation-3, upstream-binding
  - 判据：setter 把 ngx_ssl_read_password_file 读出的口令数组存入 upstream.ssl_passwords（按行读取，空文件时放一个空口令）；uwsgi_set_ssl 把它传给 ngx_ssl_certificate，含变量时先 ngx_ssl_preserve_passwords 保留；ngx_ssl_load_certificate_key 用 PEM_read_bio_PrivateKey 逐个尝试这些口令（通过 ngx_ssl_password_callback）解密私钥。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）

## nginx--ngx_http_uwsgi_module--uwsgi_ssl_conf_command

- 语法（`uwsgi_ssl_conf_command name value;`）：verified；source_ids：registration, configuration-definition, implementation-0, implementation-1
  - 判据：注册为 NGX_CONF_TAKE2；ngx_conf_set_keyval_slot 把 value[1]、value[2] 作为键值追加，并调用 post 检查（SSL_CONF_FLAG_FILE 不可用时报不支持），与 `name value` 一致。
- 功能：verified；source_ids：registration, ssl-setup-binding, implementation-2, implementation-3, upstream-binding
  - 判据：值存入 ssl_conf_commands；ngx_http_uwsgi_set_ssl 在 suwsgi 时调用 ngx_ssl_conf_commands(cf, upstream.ssl, commands)，后者对 ssl->ctx 创建 SSL_CONF_CTX（含 CLIENT/SERVER/CERTIFICATE 标志），逐条 SSL_CONF_cmd(key, value)，失败即配置错误；无 SSL_CONF_FLAG_FILE 的平台报不可用。（ngx_http_uwsgi_handler 令 u->conf=&uwcf->upstream，共享代码经 u->conf 读取该值。）
