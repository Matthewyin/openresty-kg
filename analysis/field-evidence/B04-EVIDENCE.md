# B04 字段证据记录

范围：nginx ngx_http_fastcgi_module 与 ngx_http_memcached_module，共 60 条。固定 revision：nginx release-1.27.1（e06bdbd4…）；涉及补丁的条目（upstream_pipelining、upstream_timeout_fields、no_error_pages）已核对对应补丁片段。官方文档为现行版本，仅作交叉印证。

## nginx--ngx_http_fastcgi_module--fastcgi_pass

- 语法（`fastcgi_pass address;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_http_fastcgi_pass 只取 value[1] 作为地址（含变量则编译为脚本，否则登记为 upstream），与 `fastcgi_pass address;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-4, implementation-6, implementation-7, summary-create-request
  - 判据：ngx_http_fastcgi_pass 设 clcf->handler=ngx_http_fastcgi_handler，并把地址登记为 upstream（含变量则编译为 fastcgi_lengths/values，请求时由 ngx_http_fastcgi_eval 解析写入 u->resolved）；core 把 clcf->handler 复制为 r->content_handler，content 阶段调用之；handler 登记 create_request 等回调并以 ngx_http_upstream_init 作为读请求体后的回调；ngx_http_upstream_init_request 先匹配 upstream 组或使用 u->resolved，并调用 u->create_request。
- 新增片段：summary-create-request（src/http/ngx_http_upstream.c:630-637）

## nginx--ngx_http_fastcgi_module--fastcgi_index

- 语法（`fastcgi_index name;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_str_slot 把 value[1] 存入 index 字段，与 `fastcgi_index name;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2
  - 判据：setter 把值写入 flcf->index；$fastcgi_script_name 变量取值函数在 script_name（未配置 split_path_info 时即 r->uri）非空且以 '/' 结尾时，把 flcf->index 拼接其后；变量表登记了该变量。

## nginx--ngx_http_fastcgi_module--fastcgi_split_path_info

- 语法（`fastcgi_split_path_info regex;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_http_fastcgi_split_path_info 取 value[1] 编译为正则，并要求恰有 2 个捕获组，与 `fastcgi_split_path_info regex;` 一致（需 PCRE，否则配置报错）。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2
  - 判据：setter 保存 split_regex；ngx_http_fastcgi_split 对 r->uri 执行该正则，第 1 捕获组为 script_name、第 2 组为 path_info，分别由 $fastcgi_script_name、$fastcgi_path_info 的取值函数返回；未匹配或未配置时 script_name 取 r->uri。

## nginx--ngx_http_fastcgi_module--fastcgi_store

- 语法（`fastcgi_store on | off | string;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_http_fastcgi_store 对 value[1] 依次处理 off、on，其余编译为含变量的文件名脚本，与 `on | off | string` 一致。
- 功能：verified；source_ids：configuration-definition, upstream-binding, implementation-0, implementation-1, implementation-2, summary-store-init, summary-store-pipe, handler-flcf
  - 判据：setter 置 upstream.store=1，字符串形式编译为 store_lengths/store_values；初始化时 u->store=u->conf->store，事件管道 p->cacheable 含 u->store 以写临时文件；响应状态 200、读完且长度与 Content-Length 一致时调用 ngx_http_upstream_store：store_lengths 为空（on）用 ngx_http_map_uri_to_path 映射 URI，否则运行脚本得到路径，再 ngx_ext_rename_file 落定。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：summary-store-init（src/http/ngx_http_upstream.c:612-612）；summary-store-pipe（src/http/ngx_http_upstream.c:3242-3242）；handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_store_access

- 语法（`fastcgi_store_access users:permissions ...;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE123；ngx_conf_set_access_slot 逐参数接受 user:/group:/all: 前缀加 r 或 rw，与 `users:permissions ...` 一致。
- 功能：verified；source_ids：configuration-definition, upstream-binding, implementation-0, implementation-1, implementation-2, handler-flcf
  - 判据：u->conf=&flcf->upstream；ngx_http_upstream_store 把 u->conf->store_access 同时赋给 ext.access 与 ext.path_access 并置 create_path=1；ngx_ext_rename_file 据此 ngx_change_file_access 修改文件权限，目标路径不存在时以 ngx_dir_access(path_access) 创建路径。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_buffering

- 语法（`fastcgi_buffering on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，ngx_conf_set_flag_slot 接受 on/off，与 `fastcgi_buffering on | off;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-2, implementation-3, handler-flcf
  - 判据：handler 把 flcf->upstream.buffering 赋给 u->buffering，并同时登记 pipe->input_filter 与非缓冲输入过滤器 ngx_http_fastcgi_non_buffered_filter；ngx_http_upstream_send_response 在 !u->buffering 时走非缓冲分支（使用 u->input_filter），否则初始化 ngx_event_pipe（缓冲参数取自 u->conf）。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_request_buffering

- 语法（`fastcgi_request_buffering on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，ngx_conf_set_flag_slot 接受 on/off，与 `fastcgi_request_buffering on | off;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4, implementation-5, upstream-pipelining, handler-flcf, create-request-flcf
  - 判据：handler 在 !request_buffering 且 pass_request_body 时置 r->request_body_no_buffering=1（即仅在 pass_request_body 为 on 时生效）；create_request 在该情形把 u->output.output_filter 设为 ngx_http_fastcgi_body_output_filter，该过滤器把流入的正文切块并加 NGX_HTTP_FASTCGI_STDIN 记录头；补丁 upstream_pipelining 把发送处理器中的判断由 header_sent 改为 request_body_sent，以便流式正文继续发送。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。另：create_request 中 flcf = ngx_http_get_module_loc_conf(...)（create-request-flcf 片段）取得本模块配置。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）；create-request-flcf（src/http/modules/ngx_http_fastcgi_module.c:860-865）

## nginx--ngx_http_fastcgi_module--fastcgi_ignore_client_abort

- 语法（`fastcgi_ignore_client_abort on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，ngx_conf_set_flag_slot 接受 on/off，与 `fastcgi_ignore_client_abort on | off;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-1, implementation-2, handler-flcf
  - 判据：ngx_http_upstream_init_request 仅在 !u->store、非 post_action 且 !conf->ignore_client_abort 时安装 rd/wr_check_broken_connection；该检查在客户端断开且响应不可缓存时终结上游请求；下游错误路径同样以 !cacheable && !store 为条件终结。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_bind

- 语法（`fastcgi_bind address [transparent] | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE12；ngx_http_upstream_bind_set_slot：2 个参数且为 off 则关闭，否则第 1 个参数为地址（含变量则编译为复合值），可选第 2 个参数只接受 transparent，与 `address [transparent] | off` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-1, implementation-2, handler-flcf
  - 判据：u->conf=&flcf->upstream.local；ngx_http_upstream_init_request 调用 ngx_http_upstream_set_local：静态地址直接用，变量则请求时求值并 ngx_parse_addr_port 解析（含端口），并带上 transparent；ngx_event_connect_peer 在 pc->local 存在时 bind。transparent 仅在 NGX_HAVE_TRANSPARENT_PROXY 平台生效（否则警告并忽略，片段含该条件）。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_socket_keepalive

- 语法（`fastcgi_socket_keepalive on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，ngx_conf_set_flag_slot 接受 on/off，与 `fastcgi_socket_keepalive on | off;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-1, handler-flcf
  - 判据：ngx_http_upstream_init_request 在 u->conf->socket_keepalive 为真时置 u->peer.so_keepalive=1；ngx_event_connect_peer 对 pc->so_keepalive 设置 SO_KEEPALIVE。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_connect_timeout

- 语法（`fastcgi_connect_timeout time;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_msec_slot 解析时间值，与 `fastcgi_connect_timeout time;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, upstream-timeout-fields, handler-flcf
  - 判据：补丁 upstream_timeout_fields 在 ngx_http_upstream_init 把 u->conf->connect_timeout 复制到 u->connect_timeout，ngx_http_upstream_connect 连接返回 NGX_AGAIN 时以其为写事件定时器；SSL 握手同样使用。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_send_timeout

- 语法（`fastcgi_send_timeout time;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_msec_slot 解析时间值，与 `fastcgi_send_timeout time;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, upstream-timeout-fields, handler-flcf
  - 判据：补丁把 u->conf->send_timeout 复制到 u->send_timeout；ngx_http_upstream_send_request 写返回 NGX_AGAIN 且写事件未就绪（或请求体被阻塞）时以 u->send_timeout 设置写定时器，写完则删除。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_send_lowat

- 语法（`fastcgi_send_lowat size;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_size_slot 解析大小值（带 lowat 后置检查），与 `fastcgi_send_lowat size;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-1, handler-flcf
  - 判据：ngx_http_upstream_send_request 在写返回 NGX_AGAIN 时调用 ngx_handle_write_event(c->write, u->conf->send_lowat)，把配置值作为发送低水位传给写事件处理；后置检查 ngx_http_fastcgi_lowat_check 在无 SO_SNDLOWAT 的平台警告并置 0，FreeBSD 上要求小于 net.inet.tcp.sendspace。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）
- 修正（功能）：设置 FastCGI 上游发送请求时传给写事件处理的发送低水位值；平台不支持 SO_SNDLOWAT 时忽略，FreeBSD 上必须小于 net.inet.tcp.sendspace。
  - 理由：原文“供事件后端减少小块发送触发”是对目的的推断，源码只证明该值作为 send_lowat 参数传给 ngx_handle_write_event，并含平台限制（lowat_check）；收窄为可证明的范围。

## nginx--ngx_http_fastcgi_module--fastcgi_buffer_size

- 语法（`fastcgi_buffer_size size;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_size_slot 解析大小值，与 `fastcgi_buffer_size size;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4, handler-flcf
  - 判据：ngx_http_upstream_process_header 以 u->conf->buffer_size 分配 u->buffer；FastCGI 的 process_header 在该缓冲上解析记录与响应头（STDERR 也在此处理）；ngx_http_upstream_send_response 在非缓冲分支把 u->buffer 中剩余数据交给输入过滤器并继续用该缓冲读取。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_pass_request_headers

- 语法（`fastcgi_pass_request_headers on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，ngx_conf_set_flag_slot 接受 on/off，与 `fastcgi_pass_request_headers on | off;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-1, implementation-2, implementation-3, handler-flcf, create-request-flcf
  - 判据：create_request 在 flcf->upstream.pass_request_headers 为真时遍历 r->headers_in.headers：键名加 "HTTP_" 前缀、字母转大写、'-' 转 '_'，值（含重复头以 , 或 ; 拼接）写入 PARAMS；为假则整段跳过。init_params 对已显式配置的 HTTP_ 参数登记忽略名单。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。另：create_request 中 flcf = ngx_http_get_module_loc_conf(...)（create-request-flcf 片段）取得本模块配置。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）；create-request-flcf（src/http/modules/ngx_http_fastcgi_module.c:860-865）

## nginx--ngx_http_fastcgi_module--fastcgi_pass_request_body

- 语法（`fastcgi_pass_request_body on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，ngx_conf_set_flag_slot 接受 on/off，与 `fastcgi_pass_request_body on | off;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-1, implementation-2, implementation-3, handler-flcf, create-request-flcf
  - 判据：create_request 仅在 pass_request_body 为真时遍历请求体缓冲并按 32K 分块加 NGX_HTTP_FASTCGI_STDIN 记录头（流式分支则用 body_output_filter），为假时 u->request_bufs 只含 PARAMS 与结尾空 STDIN 记录；handler 的流式开关同样要求 pass_request_body。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。另：create_request 中 flcf = ngx_http_get_module_loc_conf(...)（create-request-flcf 片段）取得本模块配置。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）；create-request-flcf（src/http/modules/ngx_http_fastcgi_module.c:860-865）

## nginx--ngx_http_fastcgi_module--fastcgi_intercept_errors

- 语法（`fastcgi_intercept_errors on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，ngx_conf_set_flag_slot 接受 on/off，与 `fastcgi_intercept_errors on | off;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-1, handler-flcf
  - 判据：ngx_http_upstream_process_header 对状态 >= NGX_HTTP_SPECIAL_RESPONSE 的响应调用 ngx_http_upstream_intercept_errors；该函数在 !u->conf->intercept_errors 时直接 DECLINED，否则按 clcf->error_pages 匹配状态并终结上游请求交给错误页。补丁 no_error_pages 只改变 error_pages 的未设置/置空语义（NULL 时仍 DECLINED），不改变本逻辑。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_read_timeout

- 语法（`fastcgi_read_timeout time;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_msec_slot 解析时间值，与 `fastcgi_read_timeout time;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-2, implementation-3, implementation-4, upstream-timeout-fields, handler-flcf
  - 判据：补丁把 u->conf->read_timeout 复制到 u->read_timeout。请求发出后 ngx_http_upstream_send_request 以其设置响应头读定时器；非缓冲正文路径在读事件未就绪时以其设置上游读定时器；缓冲路径把它赋给 p->read_timeout，ngx_event_pipe_read_upstream 据此设置定时器。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_buffers

- 语法（`fastcgi_buffers number size;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE2，ngx_conf_set_bufs_slot 取 number 与 size，与 `fastcgi_buffers number size;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-1, handler-flcf
  - 判据：ngx_http_upstream_send_response 把 u->conf->bufs 赋给 p->bufs；ngx_event_pipe_read_upstream 在 p->allocated < p->bufs.num 时按 p->bufs.size 用 ngx_create_temp_buf 分配新缓冲，即数量与块大小来自该配置。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_busy_buffers_size

- 语法（`fastcgi_busy_buffers_size size;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_size_slot 解析大小值，与 `fastcgi_busy_buffers_size size;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-1, implementation-2, handler-flcf
  - 判据：merge 阶段由 busy_buffers_size_conf 计算 busy_buffers_size（默认 2 倍缓冲大小，并校验范围）；send_response 把它赋给 p->busy_size；ngx_event_pipe_write_to_downstream 累计 busy 中 recycled 缓冲，达到 busy_size 即停止继续向下游放入。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_force_ranges

- 语法（`fastcgi_force_ranges on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，ngx_conf_set_flag_slot 接受 on/off，与 `fastcgi_force_ranges on | off;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-1, handler-flcf
  - 判据：ngx_http_upstream_process_headers 在 u->conf->force_ranges 为真时置 r->allow_ranges=1、r->single_range=1；copy_allow_ranges 在其为真时直接返回，不再依赖后端 Accept-Ranges 头。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_limit_rate

- 语法（`fastcgi_limit_rate rate;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_http_set_complex_value_size_slot 把参数编译为复合值（可含变量）并按 size 解析，与 `fastcgi_limit_rate rate;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-1, implementation-2, implementation-3, handler-flcf
  - 判据：send_response 缓冲分支以 ngx_http_complex_value_size(r, u->conf->limit_rate, 0) 求值（变量逐请求展开）赋给 p->limit_rate；ngx_event_pipe_read_upstream 按 p->limit_rate*已用秒数 - 已读长度计算额度，不足则延迟上游读事件；非缓冲分支则把 r->limit_rate 置 0，故仅作用于缓冲模式。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_cache

- 语法（`fastcgi_cache zone | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_http_fastcgi_cache 处理 off，否则把 value[1] 编译为复合值，含变量存 cache_value、否则 ngx_shared_memory_add 登记区名，与 `fastcgi_cache zone | off;` 一致。
- 功能：verified；source_ids：configuration-definition, upstream-binding, implementation-0, implementation-1, implementation-2, implementation-3, implementation-6, handler-flcf
  - 判据：setter 置 upstream.cache 并保存固定区（cache_zone）或变量表达式（cache_value）；handler 把 u->caches 指向 fmcf->caches；ngx_http_upstream_cache 经 ngx_http_upstream_cache_get 取区：固定区直接用，变量则求值，空串或 off 返回 DECLINED，否则按名称在 u->caches 中查找，找不到报错。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_cache_key

- 语法（`fastcgi_cache_key string;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_http_fastcgi_cache_key 把 value[1] 编译为复合值存入 cache_key，与 `fastcgi_cache_key string;` 一致。
- 功能：verified；source_ids：configuration-definition, upstream-binding, implementation-0, implementation-1, implementation-2
  - 判据：handler 设 u->create_key=ngx_http_fastcgi_create_key，其以 ngx_http_complex_value 求值 flcf->cache_key 并压入 r->cache->keys；ngx_http_file_cache_create_key 对各 key 做 crc32/md5 得到缓存键摘要；merge 时子级未设则继承父级。

## nginx--ngx_http_fastcgi_module--fastcgi_cache_path

- 语法（`fastcgi_cache_path path [levels=levels] [use_temp_path=on|off] keys_zone=name:size [inactive=time] [max_size=size] [min_free=size] [manager_files=number] [manager_sleep=time] [manager_threshold=time] [loader_files=number] [loader_sleep=time] [loader_threshold=time];`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_2MORE 且仅限 main；ngx_http_file_cache_set_slot 依次解析 path、levels=、use_temp_path=、keys_zone=（必需）、inactive=、max_size=、min_free=、loader_/manager_ 的 files/sleep/threshold，与语法一致。源码不含文档所列 purger* 参数（见官方文档为现行版本、与锁定源码有差异），语法以源码为准。
- 功能：verified；source_ids：configuration-definition, d340-create, upstream-binding, implementation-3, implementation-4, implementation-7, summary-loader-use, summary-inactive-use
  - 判据：setter 创建路径与 keys_zone 共享区并保存 loader/manager 参数，登记到 fmcf->caches；handler 把 u->caches 指向它；ngx_http_file_cache_manager 依 inactive/max_size/min_free 与 manager_files/sleep/threshold 清理，ngx_http_file_cache_loader 经 walk_tree 调用 manage_file，后者以 ++cache->files >= loader_files 或耗时 >= loader_threshold 触发 loader_sleep（ngx_msleep(cache->loader_sleep)）；缓存节点的 expire 取 ngx_time()+cache->inactive，ngx_http_file_cache_expire 据 expire 清理。
- 新增片段：summary-loader-use（src/http/ngx_http_file_cache.c:2173-2210）；summary-inactive-use（src/http/ngx_http_file_cache.c:977-977）

## nginx--ngx_http_fastcgi_module--fastcgi_cache_bypass

- 语法（`fastcgi_cache_bypass string ...;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_1MORE；ngx_http_set_predicate_slot 把每个参数编译为复合值，与 `fastcgi_cache_bypass string ...;` 一致。
- 功能：verified；source_ids：configuration-definition, upstream-binding, implementation-0, implementation-1, handler-flcf
  - 判据：ngx_http_upstream_cache 以 ngx_http_test_predicates(r, u->conf->cache_bypass) 求值：任一表达式非空且不为 "0" 即 DECLINED，并置 cache_status=BYPASS，跳过缓存读取。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_no_cache

- 语法（`fastcgi_no_cache string ...;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_1MORE；ngx_http_set_predicate_slot 把每个参数编译为复合值，与 `fastcgi_no_cache string ...;` 一致。
- 功能：verified；source_ids：configuration-definition, upstream-binding, implementation-0, implementation-1, summary-cacheable-gate, handler-flcf
  - 判据：响应头处理后 ngx_http_test_predicates(r, u->conf->no_cache) 返回 DECLINED（任一表达式非空且不为 "0"）时置 u->cacheable=0；后续写缓存的代码块以 if (u->cacheable) 为条件，故该响应不保存。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：summary-cacheable-gate（src/http/ngx_http_upstream.c:3168-3173）；handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_cache_valid

- 语法（`fastcgi_cache_valid [code ...] time;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_1MORE；ngx_http_file_cache_valid_set_slot 把最后一个参数作为时间，前面的参数为状态码或 any，仅给时间则默认 200、301、302，与 `[code ...] time` 一致。
- 功能：verified；source_ids：configuration-definition, upstream-binding, implementation-0, implementation-1, handler-flcf
  - 判据：ngx_http_upstream_send_response 在 r->cache->valid_sec 为 0 时用 ngx_http_file_cache_valid(u->conf->cache_valid, status) 取时长；该函数按状态码（0 表示 any）匹配配置项返回 valid。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_cache_min_uses

- 语法（`fastcgi_cache_min_uses number;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_num_slot 解析整数，与 `fastcgi_cache_min_uses number;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-1, implementation-2, handler-flcf
  - 判据：ngx_http_upstream_cache_get 之后把 u->conf->cache_min_uses 赋给 c->min_uses；ngx_http_file_cache_open 在 min_uses>1 且节点使用次数不足时返回 SCARCE（不进入缓存填充），ngx_http_file_cache_exists 以 fcn->uses >= c->min_uses 判定。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_cache_max_range_offset

- 语法（`fastcgi_cache_max_range_offset number;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_off_slot 解析偏移值，与 `fastcgi_cache_max_range_offset number;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-1, handler-flcf
  - 判据：ngx_http_upstream_cache 末尾调用 ngx_http_upstream_cache_check_range：存在 Range 头时，0 表示一律不缓存，bytes= 起始偏移 >= 配置值或为后缀范围时返回 DECLINED，调用方据此置 u->cacheable=0。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_cache_use_stale

- 语法（`fastcgi_cache_use_stale error | timeout | invalid_header | updating | http_500 | http_503 | http_403 | http_404 | http_429 | off ...;`）：verified；source_ids：registration, configuration-definition, implementation-1
  - 判据：注册为 NGX_CONF_1MORE，ngx_conf_set_bitmask_slot 配合 ngx_http_fastcgi_next_upstream_masks；该表共 11 项：error、timeout、invalid_header、non_idempotent、http_500/503/403/404/429、updating、off。原语法漏列 non_idempotent（表接受），按裁定 2 以 corrections 补齐，修正后与取值表一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-2, implementation-3, implementation-4, handler-flcf
  - 判据：merge 时 error 位同时置 NOLIVE；ngx_http_upstream_next 与 ngx_http_upstream_test_next 在缓存状态 EXPIRED 且 cache_use_stale 含对应失败类型（含状态码类）时，转为 STALE 并 ngx_http_upstream_cache_send 返回旧缓存；cache 阶段 STALE/UPDATING 在 updating 位或 stale_updating 时返回旧值。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）
- 修正（语法）：fastcgi_cache_use_stale error | timeout | invalid_header | non_idempotent | updating | http_500 | http_503 | http_403 | http_404 | http_429 | off ...;
  - 理由：ngx_http_fastcgi_next_upstream_masks（fastcgi.c:208-220）还接受 non_idempotent，原语法未列；最小化补齐。

## nginx--ngx_http_fastcgi_module--fastcgi_cache_methods

- 语法（`fastcgi_cache_methods GET | HEAD | POST ...;`）：verified；source_ids：registration, configuration-definition, implementation-0
  - 判据：注册为 NGX_CONF_1MORE，ngx_conf_set_bitmask_slot 配合 ngx_http_upstream_cache_method_mask（GET、HEAD、POST），与 `GET | HEAD | POST ...` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-1, implementation-2, handler-flcf
  - 判据：merge 时强制并入 GET|HEAD；ngx_http_upstream_cache 在 c==NULL 时以 !(r->method & u->conf->cache_methods) 判定直接 DECLINED，否则才取缓存区并创建键。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_cache_lock

- 语法（`fastcgi_cache_lock on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，ngx_conf_set_flag_slot 接受 on/off，与 `fastcgi_cache_lock on | off;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-1, implementation-2, handler-flcf
  - 判据：ngx_http_upstream_cache 把 u->conf->cache_lock 赋给 c->lock；ngx_http_file_cache_lock 在 c->lock 为真时以节点 updating 标志协调：首个请求置 updating 并去填充，其余请求进入等待（NGX_AGAIN），ngx_http_file_cache_lock_wait 在锁释放或超时后放行。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_cache_lock_timeout

- 语法（`fastcgi_cache_lock_timeout time;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_msec_slot 解析时间值，与 `fastcgi_cache_lock_timeout time;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-1, implementation-2, handler-flcf
  - 判据：ngx_http_upstream_cache 把 cache_lock_timeout 赋给 c->lock_timeout；ngx_http_file_cache_lock 据此设置 wait_time=now+lock_timeout（为 0 则不等待），lock_wait 在超过 wait_time 时记录 "cache lock timeout" 并放行。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_cache_lock_age

- 语法（`fastcgi_cache_lock_age time;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_msec_slot 解析时间值，与 `fastcgi_cache_lock_age time;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-1, handler-flcf
  - 判据：ngx_http_upstream_cache 把 cache_lock_age 赋给 c->lock_age；ngx_http_file_cache_lock 在节点未处于 updating 或 lock_time 已过期时，置 lock_time=now+lock_age 并让当前请求成为填充者，故超过该年龄后另一请求可接手。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_cache_revalidate

- 语法（`fastcgi_cache_revalidate on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，ngx_conf_set_flag_slot 接受 on/off，与 `fastcgi_cache_revalidate on | off;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4, implementation-5, handler-flcf
  - 判据：cache 开启时 merge 阶段为缓存请求初始化 params_cache，其中 HTTP_IF_MODIFIED_SINCE、HTTP_IF_NONE_MATCH 取自 $upstream_cache_last_modified/$upstream_cache_etag，create_request 在 u->cacheable 时使用它；这两个变量仅在 cache_revalidate 为真且缓存状态 EXPIRED 时有值；后端返回 304 且 EXPIRED 且 cache_revalidate 时走 REVALIDATED，发送旧缓存并更新头。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_cache_background_update

- 语法（`fastcgi_cache_background_update on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，ngx_conf_set_flag_slot 接受 on/off，与 `fastcgi_cache_background_update on | off;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-1, handler-flcf
  - 判据：ngx_http_upstream_cache 在缓存 STALE 且（cache_use_stale 含 updating 或 stale_updating）、非后台请求、conf->cache_background_update 为真时调用 ngx_http_upstream_cache_background_update，后者创建 BACKGROUND 子请求并返回旧缓存。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_temp_path

- 语法（`fastcgi_temp_path path [level1 [level2 [level3]]];`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1234；ngx_conf_set_path_slot 取 value[1] 为路径，其后每个参数作为一层目录名长度（至多 3 层），与 `path [level1 [level2 [level3]]]` 一致。
- 功能：verified；source_ids：configuration-definition, upstream-binding, implementation-2, implementation-3, handler-flcf
  - 判据：u->conf=&flcf->upstream；send_response 初始化 p->temp_file->path=u->conf->temp_path（缓冲响应写临时文件）；ngx_http_upstream_store 在无临时文件时也以 u->conf->temp_path 创建；path_slot 的 level 数组决定子目录层数。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_max_temp_file_size

- 语法（`fastcgi_max_temp_file_size size;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_size_slot 解析大小值，与 `fastcgi_max_temp_file_size size;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-1, implementation-2, implementation-3, implementation-4, handler-flcf
  - 判据：merge 阶段由 max_temp_file_size_conf 得到 max_temp_file_size（默认 1G）；send_response 赋给 p->max_temp_file_size；ngx_event_pipe_read_upstream 在非 cacheable 时以 temp_file->offset < max_temp_file_size 允许写临时文件，write_chain_to_temp_file 的分块计算也以其为上限。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_temp_file_write_size

- 语法（`fastcgi_temp_file_write_size size;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_size_slot 解析大小值，与 `fastcgi_temp_file_write_size size;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-1, implementation-2, implementation-3, handler-flcf
  - 判据：merge 阶段由 temp_file_write_size_conf 得到 temp_file_write_size（默认 2 倍缓冲大小）；send_response 赋给 p->temp_file_write_size；ngx_event_pipe_write_chain_to_temp_file 在非 cacheable 时累计 size，超过它即截断本批写入。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_next_upstream

- 语法（`fastcgi_next_upstream error | timeout | invalid_header | http_500 | http_503 | http_403 | http_404 | http_429 | non_idempotent | off ...;`）：verified；source_ids：registration, configuration-definition, implementation-0
  - 判据：注册为 NGX_CONF_1MORE，ngx_conf_set_bitmask_slot 配合 ngx_http_fastcgi_next_upstream_masks；该表共 11 项：error、timeout、invalid_header、non_idempotent、http_500/503/403/404/429、updating、off。原语法漏列 updating（表接受），按裁定 2 以 corrections 补齐，修正后与取值表一致。
- 功能：verified；source_ids：upstream-binding, implementation-1, implementation-2, handler-flcf
  - 判据：ngx_http_upstream_test_next 对 http_xxx 状态以 u->conf->next_upstream 的掩码判断（POST/LOCK/PATCH 已发送时需 non_idempotent）并调用 ngx_http_upstream_next；ngx_http_upstream_next 在 (conf->next_upstream & ft_type) != ft_type 等条件下结束请求，否则换下一个对端；error/timeout/invalid_header 由连接、发送与响应头处理处调用 ngx_http_upstream_next 触发。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）
- 修正（语法）：fastcgi_next_upstream error | timeout | invalid_header | http_500 | http_503 | http_403 | http_404 | http_429 | non_idempotent | updating | off ...;
  - 理由：ngx_http_fastcgi_next_upstream_masks（fastcgi.c:208-220）还接受 updating，原语法未列；最小化补齐。

## nginx--ngx_http_fastcgi_module--fastcgi_next_upstream_tries

- 语法（`fastcgi_next_upstream_tries number;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_num_slot 解析整数，与 `fastcgi_next_upstream_tries number;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-1, implementation-2, handler-flcf
  - 判据：ngx_http_upstream_init_request 与 ngx_http_upstream_resolve_handler 在 next_upstream_tries 非 0 且 peer.tries 更大时，把 u->peer.tries 截为该值；ngx_http_upstream_next 在 u->peer.tries==0 时结束请求。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_next_upstream_timeout

- 语法（`fastcgi_next_upstream_timeout time;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_msec_slot 解析时间值，与 `fastcgi_next_upstream_timeout time;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-1, implementation-2, implementation-3, handler-flcf
  - 判据：ngx_http_upstream_init_request（及 resolve_handler）记录 u->peer.start_time；ngx_http_upstream_test_next 与 ngx_http_upstream_next 以 timeout && ngx_current_msec - start_time >= timeout 作为不再换对端的条件。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_param

- 语法（`fastcgi_param parameter value [if_not_empty];`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE23；ngx_http_upstream_param_set_slot 取 value[1] 为参数名、value[2] 为值，第 3 个参数只接受 if_not_empty，与 `parameter value [if_not_empty]` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-2, implementation-3, implementation-4, implementation-5, create-request-flcf
  - 判据：setter 把名值与 skip_empty 存入 params_source；merge 阶段 ngx_http_fastcgi_init_params 把名与值（ngx_http_script_compile 编译，可含变量）编入 params->lengths/values；create_request 先用 lengths 计算长度（skip_empty 且值为空则跳过），再运行脚本写出键长、值长、键、值，并以 NGX_HTTP_FASTCGI_PARAMS 记录封装。另：create_request 中 flcf = ngx_http_get_module_loc_conf(...)（create-request-flcf 片段）取得本模块配置。
- 新增片段：create-request-flcf（src/http/modules/ngx_http_fastcgi_module.c:860-865）

## nginx--ngx_http_fastcgi_module--fastcgi_pass_header

- 语法（`fastcgi_pass_header field;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_str_array_slot 追加一个字段名，与 `fastcgi_pass_header field;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-1, implementation-2, handler-flcf
  - 判据：merge 调用 ngx_http_upstream_hide_headers_hash：先装入默认隐藏列表（Status、X-Accel-* 等）与 hide_header，再对 pass_headers 的每项把同名隐藏项的 key.data 置 NULL（即移出隐藏集合）；ngx_http_upstream_process_headers 复制响应头时跳过 hide_headers_hash 中的字段，因此被移出者可进入后续复制。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_hide_header

- 语法（`fastcgi_hide_header field;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_str_array_slot 追加一个字段名，与 `fastcgi_hide_header field;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-1, implementation-2, implementation-3, handler-flcf
  - 判据：merge 调用 ngx_http_upstream_hide_headers_hash：把 hide_headers 中未重复的字段追加到隐藏集合并构造 hide_headers_hash；ngx_http_upstream_process_headers 复制响应头时对 hash 中命中的字段 continue，不复制。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）

## nginx--ngx_http_fastcgi_module--fastcgi_ignore_headers

- 语法（`fastcgi_ignore_headers field ...;`）：verified；source_ids：registration, configuration-definition, implementation-0
  - 判据：注册为 NGX_CONF_1MORE，ngx_conf_set_bitmask_slot 配合 ngx_http_upstream_ignore_headers_masks（implementation-0，upstream.c:460-471）：X-Accel-Redirect、X-Accel-Expires、X-Accel-Limit-Rate、X-Accel-Buffering、X-Accel-Charset、Expires、Cache-Control、Set-Cookie、Vary 共 9 项；原语法占位符 `field ...` 未列取值，按裁定 2 以 corrections 补齐。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4, implementation-5, implementation-6, implementation-7, implementation-8, handler-flcf
  - 判据：各响应头处理函数检查 u->conf->ignore_headers 对应位：X-Accel-Redirect（内部跳转）、X-Accel-Expires/Expires/Cache-Control/Set-Cookie/Vary（缓存控制）、X-Accel-Limit-Rate（下游限速）、X-Accel-Buffering（缓冲开关）、X-Accel-Charset（置 override_charset）；位被设置时直接 return，不执行特殊处理。另：handler 中 flcf = ngx_http_get_module_loc_conf(...) 与 u->conf = &flcf->upstream（handler-flcf 片段）使该配置字段进入 u->conf。
- 新增片段：handler-flcf（src/http/modules/ngx_http_fastcgi_module.c:702-715）
- 修正（语法）：fastcgi_ignore_headers X-Accel-Redirect | X-Accel-Expires | X-Accel-Limit-Rate | X-Accel-Buffering | X-Accel-Charset | Expires | Cache-Control | Set-Cookie | Vary ...;
  - 理由：ngx_http_upstream_ignore_headers_masks（upstream.c:460-471）只接受这 9 个字段名，原语法 `field ...` 未列出取值；最小化补齐。

## nginx--ngx_http_fastcgi_module--fastcgi_catch_stderr

- 语法（`fastcgi_catch_stderr string;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_str_array_slot 追加一个字符串，与 `fastcgi_catch_stderr string;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2
  - 判据：ngx_http_fastcgi_process_header 在收到 NGX_HTTP_FASTCGI_STDERR 记录时，对 flcf->catch_stderr 每个模式以 ngx_strnstr 在 stderr 文本中搜索，命中即返回 NGX_HTTP_UPSTREAM_INVALID_HEADER；该返回由 upstream 的响应头处理转入 ngx_http_upstream_next（invalid_header）。该逻辑只在响应头解析函数内执行。

## nginx--ngx_http_fastcgi_module--fastcgi_keep_conn

- 语法（`fastcgi_keep_conn on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，ngx_conf_set_flag_slot 接受 on/off，与 `fastcgi_keep_conn on | off;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-4, implementation-5, create-request-flcf
  - 判据：create_request 把 flcf->keep_conn 为真时的 NGX_HTTP_FASTCGI_KEEP_CONN 写入 BEGIN_REQUEST 的 flags；输入过滤器初始化时据此调整 pipe->length；收到 END_REQUEST 且数据恰好读完时置 u->keepalive=1，upstream keepalive 模块仅在 u->keepalive 为真等条件下保留连接。另：create_request 中 flcf = ngx_http_get_module_loc_conf(...)（create-request-flcf 片段）取得本模块配置。
- 新增片段：create-request-flcf（src/http/modules/ngx_http_fastcgi_module.c:860-865）
- 修正（功能）：在 FastCGI BEGIN_REQUEST 记录的 flags 中设置 KEEP_CONN 标志，并在收到 END_REQUEST 且数据读完时把上游连接标记为可保持，供上游 keepalive 复用。
  - 理由：原文“要求应用端在响应后保留连接”是 FastCGI 协议对该标志的语义，锁定源码只能证明本端设置标志及随后的 u->keepalive 处理；收窄为源码可证明的范围。

## nginx--ngx_http_memcached_module--memcached_pass

- 语法（`memcached_pass address;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_http_memcached_pass 只取 value[1] 作为地址并登记为 upstream，与 `memcached_pass address;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-3, implementation-5, implementation-6
  - 判据：setter 设 clcf->handler=ngx_http_memcached_handler 并登记 upstream 与 $memcached_key 索引；core 把它作为 r->content_handler 在 content 阶段调用；handler 对非 GET/HEAD 返回 NGX_HTTP_NOT_ALLOWED，否则丢弃请求体、登记 create_request（生成 "get <key>" CRLF）与 process_header（解析 VALUE/END），再调用 ngx_http_upstream_init。

## nginx--ngx_http_memcached_module--memcached_bind

- 语法（`memcached_bind address [transparent ] | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE12；ngx_http_upstream_bind_set_slot：2 个参数且为 off 则关闭，否则第 1 个参数为地址（含变量则编译为复合值），可选第 2 个参数只接受 transparent，与 `address [transparent] | off` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-1, implementation-2
  - 判据：handler 令 u->conf=&mlcf->upstream；ngx_http_upstream_init_request 以 u->conf->local 调用 ngx_http_upstream_set_local，设置 u->peer.local；ngx_event_connect_peer 在 pc->local 存在时 bind 到该地址。

## nginx--ngx_http_memcached_module--memcached_socket_keepalive

- 语法（`memcached_socket_keepalive on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，ngx_conf_set_flag_slot 接受 on/off，与 `memcached_socket_keepalive on | off;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-1
  - 判据：handler 令 u->conf=&mlcf->upstream；ngx_http_upstream_init_request 在 socket_keepalive 为真时置 u->peer.so_keepalive=1；ngx_event_connect_peer 据此设置 SO_KEEPALIVE。

## nginx--ngx_http_memcached_module--memcached_connect_timeout

- 语法（`memcached_connect_timeout time;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_msec_slot 解析时间值，与 `memcached_connect_timeout time;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, upstream-timeout-fields
  - 判据：补丁在 ngx_http_upstream_init 把 u->conf->connect_timeout 复制到 u->connect_timeout，ngx_http_upstream_connect 连接返回 NGX_AGAIN 时以其设置写定时器；handler 令 u->conf=&mlcf->upstream。

## nginx--ngx_http_memcached_module--memcached_send_timeout

- 语法（`memcached_send_timeout time;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_msec_slot 解析时间值，与 `memcached_send_timeout time;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-2, upstream-timeout-fields
  - 判据：补丁把 u->conf->send_timeout 复制到 u->send_timeout；create_request 生成 "get <key>" 请求；ngx_http_upstream_send_request 写返回 NGX_AGAIN 且写事件未就绪时以 u->send_timeout 设置写定时器，写成功则删除，即限制相邻写操作之间的等待。

## nginx--ngx_http_memcached_module--memcached_buffer_size

- 语法（`memcached_buffer_size size;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_size_slot 解析大小值，与 `memcached_buffer_size size;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4, implementation-5
  - 判据：ngx_http_upstream_process_header 以 u->conf->buffer_size 分配 u->buffer，memcached 的 process_header 在其中解析 VALUE 行；create_loc_conf 固定 buffering=0，故正文走 ngx_http_upstream_send_response 的非缓冲分支，继续用 u->buffer 读取并经输入过滤器处理。

## nginx--ngx_http_memcached_module--memcached_read_timeout

- 语法（`memcached_read_timeout time;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_msec_slot 解析时间值，与 `memcached_read_timeout time;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-2, implementation-3, summary-buffering-off, upstream-timeout-fields
  - 判据：补丁把 u->conf->read_timeout 复制到 u->read_timeout。请求发出后 ngx_http_upstream_send_request 以其设置响应头读定时器；create_loc_conf 固定 buffering=0，正文走非缓冲路径，ngx_http_upstream_process_non_buffered_request 在上游读事件未就绪时再次以其设置读定时器，即相邻读取之间的超时。
- 新增片段：summary-buffering-off（src/http/modules/ngx_http_memcached_module.c:616-631）

## nginx--ngx_http_memcached_module--memcached_next_upstream

- 语法（`memcached_next_upstream error | timeout | invalid_response | not_found | off ...;`）：verified；source_ids：registration, configuration-definition, implementation-0
  - 判据：注册为 NGX_CONF_1MORE，ngx_conf_set_bitmask_slot 配合 ngx_http_memcached_next_upstream_masks（error、timeout、invalid_response、not_found、off），与语法一致。
- 功能：verified；source_ids：upstream-binding, implementation-1, implementation-2, implementation-3, implementation-4
  - 判据：process_header 对 "END" 响应置 status_n=404；ngx_http_upstream_test_next 以 u->conf->next_upstream 与 not_found（FT_HTTP_404）掩码判断后调用 ngx_http_upstream_next；error/timeout/invalid_response（映射 FT_INVALID_HEADER）分别由连接、读写及响应头处理处触发；ngx_http_upstream_next 以掩码判断是否换下一台。

## nginx--ngx_http_memcached_module--memcached_next_upstream_tries

- 语法（`memcached_next_upstream_tries number;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_num_slot 解析整数，与 `memcached_next_upstream_tries number;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-1, implementation-3
  - 判据：ngx_http_upstream_init_request 与 ngx_http_upstream_resolve_handler 在 next_upstream_tries 非 0 且 peer.tries 更大时，把 u->peer.tries 截为该值；ngx_http_upstream_next 在 u->peer.tries==0 时结束请求。

## nginx--ngx_http_memcached_module--memcached_next_upstream_timeout

- 语法（`memcached_next_upstream_timeout time;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_msec_slot 解析时间值，与 `memcached_next_upstream_timeout time;` 一致。
- 功能：verified；source_ids：upstream-binding, implementation-0, implementation-1, implementation-2
  - 判据：ngx_http_upstream_init_request（及 resolve_handler）记录 u->peer.start_time；ngx_http_upstream_test_next 与 ngx_http_upstream_next 以 timeout && ngx_current_msec - start_time >= timeout 作为不再换对端的条件。

## nginx--ngx_http_memcached_module--memcached_gzip_flag

- 语法（`memcached_gzip_flag flag;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_num_slot 解析整数，与 `memcached_gzip_flag flag;` 一致。
- 功能：verified；source_ids：implementation-0, handler-mlcf
  - 判据：memcached_process_header 解析 VALUE 行：mlcf->gzip_flag 非 0 时解析 flags 数字，flags & mlcf->gzip_flag 非 0 则向 r->headers_out 追加 Content-Encoding: gzip；为 0 时跳过 flags 解析。另：process_header 中 mlcf = ngx_http_get_module_loc_conf(...)（handler-mlcf 片段）取得本模块配置，mlcf->gzip_flag 即该指令字段。
- 新增片段：handler-mlcf（src/http/modules/ngx_http_memcached_module.c:348-348）
