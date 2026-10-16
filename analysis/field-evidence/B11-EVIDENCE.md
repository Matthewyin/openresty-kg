# B11 字段证据记录

范围：nginx 全部 ngx_mail_* 模块（块入口除外），共 49 条。固定 revision：nginx release-1.27.1（e06bdbd4…）；涉及补丁的条目（error_log、resolver、starttls、ssl_certificate、ssl_certificate_key、ssl_session_cache）已核对对应发行补丁：resolver_conf_parsing、safe_resolver_ipv6_option 改动 ngx_resolver_create 的参数解析（语法据此登记 local=），intercept_error_log、larger_max_error_str 只改 ngx_log_error_core 与错误串长度，ssl_cert_cb_yield、ssl_sess_cb_yield、ssl_client_hello_cb_yield 只改 ngx_ssl_handshake 与 ngx_ssl_try_early_data，均不涉及被引用的其余函数。mail 与 HTTP/stream 同名指令（listen、error_log、resolver、ssl_*、proxy_* 等）均只从 src/mail/ 自身源码取证。官方文档为现行版本，仅作交叉印证；与锁定源码的差异：文档的 resolver status_zone 不在锁定源码中，语法未列。

## nginx--ngx_mail_auth_http_module--auth_http

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_TAKE1；ngx_mail_auth_http 只取 value[1]，剥去可选的 http:// 前缀后经 ngx_parse_url（uri_part=1）解析为地址、端口与 URI，与 `auth_http URL;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4
  - 判据：setter 把解析结果写入 ahcf->peer、host_header、uri；ngx_mail_auth_http_init 取 ahcf 后以 ahcf->peer 为目标 ngx_event_connect_peer，请求用 ahcf->uri 构造 GET；响应头 Auth-Status 为 OK 时继续，Auth-Server/Auth-Port 写入 ctx->addr/port，解析校验通过后调用 ngx_mail_proxy_init(s, peer) 启动协议代理。

## nginx--ngx_mail_auth_http_module--auth_http_timeout

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_TAKE1，ngx_conf_set_msec_slot 把 value[1] 解析为毫秒时间写入 timeout，与 `auth_http_timeout time;` 一致。
- 功能：verified；source_ids：configuration-definition, summary-init, implementation-1, implementation-2
  - 判据：setter 写入 ahcf->timeout（merge 默认 60000ms）；ngx_mail_auth_http_init 取 ahcf 后对认证连接的 read、write 事件 ngx_add_timer(…, ahcf->timeout)；写处理函数未发完时再次以 ahcf->timeout 设置写定时器，读处理函数在 rev->timedout 时记录 auth http server timed out 并终止会话。
- 新增片段：summary-init（src/mail/ngx_mail_auth_http_module.c:186-232）

## nginx--ngx_mail_auth_http_module--auth_http_header

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_TAKE2；ngx_mail_auth_http_header 把 value[1]、value[2] 分别存为 header 的 key 与 value，与 `auth_http_header header value;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, summary-init, implementation-1
  - 判据：setter 把每对 key/value 压入 ahcf->headers；merge 把它们拼成 "key: value\r\n" 存入 conf->header；ngx_mail_auth_http_init 取 ahcf 并传给 ngx_mail_auth_http_create_request，该函数在请求末尾的空行前原样追加 ahcf->header。
- 新增片段：summary-init（src/mail/ngx_mail_auth_http_module.c:186-232）

## nginx--ngx_mail_auth_http_module--auth_http_pass_client_cert

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_FLAG，ngx_conf_set_flag_slot 只接受 on/off，与 `auth_http_pass_client_cert on|off;` 一致。
- 功能：verified；source_ids：configuration-definition, summary-init, implementation-1, implementation-2, implementation-3, summary-pem, summary-escape
  - 判据：setter 写入 ahcf->pass_client_cert（merge 默认 0）；create_request 取得 ahcf 后，仅在 c->ssl 且 ssl_verify_client 生效（sslcf->verify 非 0）时才在 ahcf->pass_client_cert 为真的情况下取 ngx_ssl_get_raw_certificate（PEM_write_bio_X509 输出的 PEM）并经 ngx_mail_auth_http_escape（ngx_escape_uri，按 %XX 转义）编码，非空时写入 Auth-SSL-Cert 头。
- 新增片段：summary-init（src/mail/ngx_mail_auth_http_module.c:186-232）；summary-pem（src/event/ngx_event_openssl.c:5374-5420）；summary-escape（src/core/ngx_string.c:1634-1673）

## nginx--ngx_mail_core_module--server

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_CONF_BLOCK|NGX_CONF_NOARGS；ngx_mail_core_server 不读取 value 参数，直接 ngx_conf_parse 解析块内指令，与 `server { ... }` 一致。
- 功能：verified；source_ids：d340-setter, d340-mail-context, summary-listen-ctx, summary-add-ports, summary-servers-bind, summary-addr-ctx, summary-conn-port, summary-conn-addr, implementation-2
  - 判据：ngx_mail_core_server 为块创建独立 srv_conf 上下文（逐模块 create_srv_conf）、压入 cmcf->servers，把 cf->ctx 切到该上下文解析块内指令，并要求块内有 listen；listen 把 ls->ctx 设为 cf->ctx，经 ngx_mail_add_ports 复制进 addr->opt、ngx_mail_block 对每个 listen 条目调用 ngx_mail_add_ports；ngx_mail_optimize_servers 令 ls->servers 指向 mport 并调用 ngx_mail_add_addrs，后者把 opt.ctx 赋给 conf.ctx；连接到达时 ngx_mail_init_connection 经 c->listening->servers 取得 addr_conf，以其 ctx->srv_conf 作为会话配置并按协议初始化。
- 新增片段：summary-add-ports（src/mail/ngx_mail.c:267-272）；summary-addr-ctx（src/mail/ngx_mail.c:402-410）；summary-servers-bind（src/mail/ngx_mail.c:350-372）；summary-conn-port（src/mail/ngx_mail_handler.c:47-51）；summary-conn-addr（src/mail/ngx_mail_handler.c:100-122）；summary-listen-ctx（src/mail/ngx_mail_core_module.c:343-346）

## nginx--ngx_mail_core_module--listen

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_SRV_CONF|NGX_CONF_1MORE；ngx_mail_core_listen 以 value[1] 经 ngx_parse_url（listen=1）解析监听地址/端口，value[2..] 逐项匹配 bind、backlog=、rcvbuf=、sndbuf=、ipv6only=on|off、ssl、so_keepalive=on|off|keepidle:keepintvl:keepcnt、proxy_protocol，无法识别者报 invalid parameter，与语法一致（address:port 内部的写法变体与 so_keepalive 各段可省略不强制展开）。
- 功能：verified；source_ids：configuration-definition, d340-server, d340-mail-context, summary-add-ports, implementation-4, summary-servers-bind, summary-addr-ctx, summary-conn-port, summary-conn-addr, summary-session-conf
  - 判据：ngx_mail_core_listen 用解析出的 sockaddr 在 cmcf->listen 追加条目并令 ls->ctx = cf->ctx（该 ctx 为所在 server 的上下文）；ngx_mail_block 对 cmcf->listen 逐项调用 ngx_mail_add_ports 把条目复制进 addr->opt，ngx_mail_optimize_servers 据此 ngx_create_listening、以 ngx_mail_init_connection 为连接处理函数、令 ls->servers 指向 mport 并调用 ngx_mail_add_addrs 把 opt.ctx 赋给 conf.ctx；连接到达后 init_connection 经 c->listening->servers 取得 addr_conf，以其 ctx->srv_conf 作为该 server 的会话配置。
- 新增片段：summary-add-ports（src/mail/ngx_mail.c:267-272）；summary-addr-ctx（src/mail/ngx_mail.c:402-410）；summary-session-conf（src/mail/ngx_mail_handler.c:130-146）；summary-servers-bind（src/mail/ngx_mail.c:350-372）；summary-conn-port（src/mail/ngx_mail_handler.c:47-51）；summary-conn-addr（src/mail/ngx_mail_handler.c:100-122）

## nginx--ngx_mail_core_module--protocol

- 语法：verified；source_ids：registration, configuration-definition, d340-imap-ports, d340-pop3-ports, d340-smtp-ports
  - 判据：注册为 NGX_MAIL_SRV_CONF|NGX_CONF_TAKE1；ngx_mail_core_protocol 用 ngx_strcmp 把 value[1] 与各 mail 模块 protocol->name 比对，未命中报 unknown protocol；imap、pop3、smtp 三模块的 protocol 结构分别以 "imap"、"pop3"、"smtp" 命名，与 `protocol imap|pop3|smtp;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-2, implementation-3, implementation-4, implementation-5
  - 判据：ngx_mail_core_protocol 把匹配的 module->protocol 存入 cscf->protocol；三种协议的 ngx_mail_protocol_t 各自带 init_session、init_protocol、parse_command、auth_state 回调；连接建立后 ngx_mail_init_session 取 cscf->protocol，设 s->protocol 并调用 cscf->protocol->init_session。

## nginx--ngx_mail_core_module--timeout

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_TAKE1，ngx_conf_set_msec_slot 解析时间写入毫秒，与 `timeout time;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, summary-pop3-init, implementation-2, implementation-3, implementation-4, implementation-5
  - 判据：setter 写入 cscf->timeout（merge 默认 60000ms）；IMAP/POP3 的 init_session 与 SMTP 的 greeting（未设 smtp_greeting_delay 时）对客户端读事件 ngx_add_timer(c->read, cscf->timeout)，ngx_mail_send 在发送受阻时对写事件用同一值，ngx_mail_proxy_init 对后端连接读事件同样设置；登录成功后 ngx_mail_proxy_*_handler 改用 pcf->timeout 并删除后端读定时器，说明该值只覆盖进入透明代理之前。
- 新增片段：summary-pop3-init（src/mail/ngx_mail_pop3_handler.c:36-75）

## nginx--ngx_mail_core_module--server_name

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_TAKE1，ngx_conf_set_str_slot 把 value[1] 存为字符串，与 `server_name name;` 一致。
- 功能：verified；source_ids：configuration-definition, merge-default, implementation-0, implementation-1, implementation-2, implementation-3
  - 判据：setter 写入 cscf->server_name（未配置时 merge 取 cycle->hostname）；SMTP merge 以它拼出 220 欢迎行与 250 EHLO 公告，代理连后端发 HELO/EHLO 时用它，ngx_mail_salt 把它写入 <random.time@server_name> 盐（POP3 APOP/CRAM-MD5 等经 ngx_mail_salt(s, c, cscf) 使用）。

## nginx--ngx_mail_core_module--error_log

- 语法：verified；source_ids：registration, configuration-definition, implementation-0, implementation-1
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_1MORE；ngx_mail_core_error_log 委托 ngx_log_set_log：value[1] 依次识别 stderr、memory:（仅 NGX_DEBUG 构建，否则报错）、syslog:，其余作为文件名，随后 ngx_log_set_levels 从 value[2] 起解析级别名；原语法只列 file，已补齐。发行补丁 intercept_error_log、larger_max_error_str 只改 ngx_log_error_core 与错误串长度，不涉及这两个解析函数。
- 功能：verified；source_ids：configuration-definition, implementation-1, implementation-0, merge-default, implementation-2, implementation-3
  - 判据：ngx_mail_core_error_log 把 ngx_log_set_log 建立的目标与级别存入 cscf->error_log（merge 时继承上层，否则用 cycle->new_log）；ngx_mail_optimize_servers 以 cscf->error_log 设置监听 ls->logp，ngx_mail_init_connection 用 ngx_set_connection_log(c, cscf->error_log) 设置每个连接的日志。
- 修正（语法）：error_log file | stderr | syslog:parameter ... | memory:size [level];
  - 理由：ngx_log_set_log 对 value[1] 依次识别 stderr（576）、memory:（585，仅 NGX_DEBUG 构建，否则报错）、syslog:（644），其余作为文件名；原语法只列 file。

## nginx--ngx_mail_core_module--resolver

- 语法：verified；source_ids：registration, configuration-definition, implementation-0, patch-resolver_conf_parsing, patch-safe_resolver_ipv6_option
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_1MORE；ngx_mail_core_resolver 在 value[1] 为 off 时置空，否则把 value[1..] 整体交给 ngx_resolver_create，后者逐项识别 valid=、ipv4=、ipv6=（on/off）以及发行补丁在非 Windows 增加的 local=（on、off 或路径），其余作为 DNS 服务器地址；原语法与此一致（文档里的 status_zone 不在锁定源码中，语法未列）。
- 功能：verified；source_ids：configuration-definition, merge-default, implementation-1, implementation-2, implementation-3
  - 判据：setter 把 ngx_resolver_create 的结果存入 cscf->resolver（merge 时 server 继承）；SMTP 的 init_session 取 cscf->resolver，为空时直接把 host 记为 [UNAVAILABLE]，否则 ngx_resolve_start/ngx_resolve_addr 反查客户端地址，再以反查得到的名字 ngx_resolve_name 正向解析并用 ngx_cmp_sockaddr 与客户端地址核对，不一致记为 [UNAVAILABLE]。

## nginx--ngx_mail_core_module--resolver_timeout

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_TAKE1，ngx_conf_set_msec_slot 解析时间，与 `resolver_timeout time;` 一致。
- 功能：verified；source_ids：configuration-definition, merge-default, implementation-0, implementation-1
  - 判据：setter 写入 cscf->resolver_timeout（merge 默认 30000ms）；SMTP 的反向查询（ngx_mail_smtp_init_session）与正向查询（ngx_mail_smtp_resolve_name）都在 resolver ctx 上设 ctx->timeout = cscf->resolver_timeout 后发起解析。

## nginx--ngx_mail_core_module--max_errors

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_TAKE1，ngx_conf_set_num_slot 把 value[1] 解析为整数，与 `max_errors number;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, summary-imap-invalid, summary-pop3-invalid, summary-smtp-invalid
  - 判据：setter 写入 cscf->max_errors（merge 默认 5）；ngx_mail_read_command 取 cscf 后在解析返回无效命令时 s->errors++，达到 cscf->max_errors 即置 s->quit = 1；IMAP/POP3/SMTP 的 auth_state 在无效命令分支都设置错误响应并调用 ngx_mail_send，ngx_mail_send 发送完毕后见 s->quit 即 ngx_mail_close_connection。
- 新增片段：summary-imap-invalid（src/mail/ngx_mail_imap_handler.c:243-299）；summary-pop3-invalid（src/mail/ngx_mail_pop3_handler.c:279-305）；summary-smtp-invalid（src/mail/ngx_mail_smtp_handler.c:567-592）

## nginx--ngx_mail_imap_module--imap_client_buffer

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_TAKE1，ngx_conf_set_size_slot 解析大小，与 `imap_client_buffer size;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1
  - 判据：setter 写入 iscf->client_buffer_size（merge 默认一页）；ngx_mail_imap_init_protocol 取 iscf 并以该大小 ngx_create_temp_buf 创建会话缓冲 s->buffer，ngx_mail_read_command 把客户端命令读入该缓冲，缓冲写满仍未解析出完整命令则报 too long command。

## nginx--ngx_mail_imap_module--imap_capabilities

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_1MORE；ngx_mail_capabilities 对 value[1..] 逐个压入数组，与 `imap_capabilities extension ...;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2, summary-imap-dispatch
  - 判据：setter 把各扩展名压入 iscf->capabilities；merge 在未配置时用默认 IMAP4/IMAP4rev1/UIDPLUS，并拼出 "* CAPABILITY …" 公告串；IMAP 处理函数在 ngx_imap_start 状态收到 CAPABILITY 命令时调用 ngx_mail_imap_capability，把该公告串作为回复文本。
- 新增片段：summary-imap-dispatch（src/mail/ngx_mail_imap_handler.c:155-177）

## nginx--ngx_mail_imap_module--imap_auth

- 语法：verified；source_ids：registration, configuration-definition, implementation-0
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_1MORE；ngx_conf_set_bitmask_slot 逐项以 ngx_strcasecmp 对照 ngx_mail_imap_auth_methods，取值表只有 plain、login、cram-md5、external，与 `imap_auth plain|login|cram-md5|external ...;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2, auth-parser, auth-external
  - 判据：setter 把所选方法位写入 iscf->auth_methods；merge 把已启用方法对应的 AUTH=PLAIN/LOGIN/CRAM-MD5/EXTERNAL 拼进 CAPABILITY 公告；ngx_mail_imap_authenticate 取 iscf 后，CRAM-MD5 与不带初始响应的 AUTH EXTERNAL（ngx_mail_auth_parse 返回 NGX_MAIL_AUTH_EXTERNAL）要求对应位已启用，否则按无效命令处理；带初始响应的 AUTH EXTERNAL 在解析器里直接调用 ngx_mail_auth_external，不检查该位。

## nginx--ngx_mail_pop3_module--pop3_capabilities

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_1MORE；ngx_mail_capabilities 对 value[1..] 逐个压入数组，与 `pop3_capabilities extension ...;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-3, summary-pop3-dispatch
  - 判据：setter 把各扩展名压入 pscf->capabilities；merge 在未配置时用默认 TOP/USER/UIDL，并逐行拼出 "+OK Capability list follows" 的 CAPA 回复；POP3 处理函数在 USER 之前（ngx_pop3_start）和 USER 之后（ngx_pop3_user）收到 CAPA 时调用 ngx_mail_pop3_capa，以 pscf->capability（或 STLS 变体）作为输出。
- 新增片段：summary-pop3-dispatch（src/mail/ngx_mail_pop3_handler.c:170-220）

## nginx--ngx_mail_pop3_module--pop3_auth

- 语法：verified；source_ids：registration, configuration-definition, implementation-0
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_1MORE；ngx_conf_set_bitmask_slot 逐项对照 ngx_mail_pop3_auth_methods，取值表只有 plain、apop、cram-md5、external，与 `pop3_auth plain|apop|cram-md5|external ...;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, summary-pop3-sasl, summary-pop3-auth-capa, implementation-3, auth-parser, auth-external
  - 判据：setter 把所选方法位写入 pscf->auth_methods（merge 中 plain 同时启用 login）；merge 把已启用方法拼进 CAPA 的 SASL 行以及无参 AUTH 的 "+OK methods supported" 回复；ngx_mail_pop3_apop 在 APOP 位未启用时按无效命令处理，ngx_mail_pop3_auth 对 CRAM-MD5 与不带初始响应的 EXTERNAL 同样检查对应位；带初始响应的 AUTH EXTERNAL 在解析器里直接调用 ngx_mail_auth_external，不检查该位。
- 新增片段：summary-pop3-sasl（src/mail/ngx_mail_pop3_module.c:185-233）；summary-pop3-auth-capa（src/mail/ngx_mail_pop3_module.c:253-296）

## nginx--ngx_mail_proxy_module--proxy

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_FLAG，ngx_conf_set_flag_slot 只接受 on/off，与 `proxy on|off;` 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, implementation-3
  - 判据：注册偏移指向 ngx_mail_proxy_conf_t.enable，create/merge 只做初始化与继承（默认 0）；在 src/mail 全部源码中该标识符只出现在结构体声明、注册偏移、create_conf 与 merge_conf 这四处，没有任何读取。检索：git -C repos/nginx grep -n "enable\b" e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928 -- src/mail（锁定 revision，src/mail 全目录），除 *_ENABLED 宏外全部命中为 ngx_mail_proxy_module.c:16（结构体字段）、:49（注册偏移）、:1347（create_conf 的 pcf->enable = NGX_CONF_UNSET）、:1365（merge_conf 的 ngx_conf_merge_value）共 4 处；全 src 树检索 (->|\.)enable\b 在 mail 路径下无命中，ngx_mail_proxy_conf_t 仅在该文件使用；而认证成功后 ngx_mail_auth_http_read_handler 无条件调用 ngx_mail_proxy_init，该函数也不检查 enable，因此该位在固定实现中没有运行期消费。

## nginx--ngx_mail_proxy_module--proxy_buffer

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_TAKE1，ngx_conf_set_size_slot 解析大小，与 `proxy_buffer size;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2
  - 判据：setter 写入 pcf->buffer_size（merge 默认一页）；ngx_mail_proxy_init 取 pcf 后以该大小创建 s->proxy->buffer；ngx_mail_proxy_read_response 把后端欢迎/登录响应读入该缓冲（缓冲写满仍无完整行则报 too long response line），转发阶段 ngx_mail_proxy_handler 在从后端读、向客户端写的方向使用 s->proxy->buffer。

## nginx--ngx_mail_proxy_module--proxy_timeout

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_TAKE1，ngx_conf_set_msec_slot 解析时间，与 `proxy_timeout time;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-1, implementation-2, implementation-3, implementation-4, implementation-5
  - 判据：setter 写入 pcf->timeout（merge 默认 24 小时）；POP3/IMAP/SMTP 后端登录成功分支都取 pcf 并对客户端读事件 ngx_add_timer(…, pcf->timeout)、删除后端读定时器并切到 ngx_mail_proxy_handler；转发处理函数在客户端侧每次处理后重新以 pcf->timeout 设定，到期（ev->timedout）时记录 client/upstream timed out 并关闭会话。

## nginx--ngx_mail_proxy_module--proxy_pass_error_message

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_FLAG，ngx_conf_set_flag_slot 只接受 on/off，与 `proxy_pass_error_message on|off;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-1, implementation-2, summary-dispatch-pop3, summary-dispatch-imap, summary-dispatch-smtp
  - 判据：setter 写入 pcf->pass_error_message（merge 默认 0）；ngx_mail_proxy_read_response 在判定后端响应无效（记录 upstream sent invalid response）时取 pcf：为 0 只记日志返回 NGX_ERROR（s->out 为空），非 0 则把后端整行设为 s->out 再返回 NGX_ERROR；POP3/IMAP/SMTP 的后端处理函数收到 NGX_ERROR 都调用 ngx_mail_proxy_upstream_error，该函数在 s->out 非空时置 quit 并 ngx_mail_send 发给客户端，为空时走 internal server error。
- 新增片段：summary-dispatch-pop3（src/mail/ngx_mail_proxy_module.c:261-274）；summary-dispatch-imap（src/mail/ngx_mail_proxy_module.c:401-414）；summary-dispatch-smtp（src/mail/ngx_mail_proxy_module.c:564-577）

## nginx--ngx_mail_proxy_module--xclient

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_FLAG，ngx_conf_set_flag_slot 只接受 on/off，与 `xclient on|off;` 一致。
- 功能：verified；source_ids：configuration-definition, summary-smtp-select, implementation-0, implementation-2
  - 判据：setter 写入 pcf->xclient（merge 默认 on）；ngx_mail_proxy_init 仅在 SMTP 协议时选 ngx_mail_proxy_smtp_handler；该处理函数取 pcf，xclient 为真时用 EHLO 并进入 ngx_smtp_helo_xclient 状态，发送 XCLIENT ADDR=<客户端地址> [LOGIN=<登录名>] NAME=<s->host>，其中 LOGIN 仅在 s->login.len 非 0 且未启用 proxy_smtp_auth 时附带，NAME 取自 SMTP 会话的客户端主机名。
- 新增片段：summary-smtp-select（src/mail/ngx_mail_proxy_module.c:183-199）

## nginx--ngx_mail_proxy_module--proxy_smtp_auth

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_FLAG，ngx_conf_set_flag_slot 只接受 on/off，与 `proxy_smtp_auth on|off;` 一致。
- 功能：verified；source_ids：configuration-definition, summary-smtp-select, summary-smtp-helo, implementation-1, implementation-2
  - 判据：setter 写入 pcf->smtp_auth（merge 默认 off）；SMTP 后端处理函数在 HELO/EHLO 之后取 pcf，非 auth_method NONE 且 pcf->smtp_auth 为真时进入 ngx_smtp_helo_auth/ngx_smtp_xclient_auth 状态，向后端发送 "AUTH PLAIN <base64(\0login\0passwd)>"。
- 新增片段：summary-smtp-helo（src/mail/ngx_mail_proxy_module.c:596-616）；summary-smtp-select（src/mail/ngx_mail_proxy_module.c:183-199）

## nginx--ngx_mail_proxy_module--proxy_protocol

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_FLAG，ngx_conf_set_flag_slot 只接受 on/off，与 `proxy_protocol on|off;` 一致。
- 功能：verified；source_ids：configuration-definition, summary-proxy-pcf, implementation-0, implementation-1, implementation-2
  - 判据：setter 写入 pcf->proxy_protocol（merge 默认 0）；ngx_mail_proxy_init 取 pcf 并令 s->proxy->proxy_protocol = pcf->proxy_protocol；后端连接的写处理函数在该标志为真时先调用 ngx_mail_proxy_send_proxy_protocol，经 ngx_proxy_protocol_write 生成单条 PROXY 头并一次性发给后端，发送成功后清除标志。
- 新增片段：summary-proxy-pcf（src/mail/ngx_mail_proxy_module.c:170-179）

## nginx--ngx_mail_realip_module--set_real_ip_from

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_TAKE1；ngx_mail_realip_from 对 value[1] 依次判断字面量 unix:、经 ngx_ptocidr 解析的地址或 CIDR，其余按主机名 ngx_inet_resolve_host 解析（mail 版没有 all），与 `set_real_ip_from address|CIDR|unix:;` 一致（address 可为主机名，属参数内部写法不强制展开）。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, merge-default
  - 判据：setter 把可信来源压入 rscf->from（merge 时继承）；ngx_mail_proxy_protocol_handler 读完 PROXY 头后调用 ngx_mail_realip_handler，该函数在 rscf->from 非空、连接带 proxy_protocol 且对端地址 ngx_cidr_match 命中 rscf->from 时，用 PROXY 头的源地址与端口替换 c->sockaddr 与 c->addr_text。

## nginx--ngx_mail_smtp_module--smtp_client_buffer

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_TAKE1，ngx_conf_set_size_slot 解析大小，与 `smtp_client_buffer size;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1
  - 判据：setter 写入 sscf->client_buffer_size（merge 默认一页）；ngx_mail_smtp_create_buffer 取 sscf 并以该大小创建 s->buffer，ngx_mail_read_command 把客户端命令读入该缓冲，缓冲写满仍未解析出完整命令则报 too long command。

## nginx--ngx_mail_smtp_module--smtp_greeting_delay

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_TAKE1，ngx_conf_set_msec_slot 解析时间，与 `smtp_greeting_delay time;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1
  - 判据：setter 写入 sscf->greeting_delay（merge 默认 0）；ngx_mail_smtp_greeting 在其非 0 时以它为读超时并把读处理函数设为 ngx_mail_smtp_invalid_pipelining、暂不发送欢迎；超时无输入则恢复 timeout 并发出欢迎，期间若客户端先发数据则丢弃命令、回复 503 improper use of pipelining 并置 quit。

## nginx--ngx_mail_smtp_module--smtp_capabilities

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_1MORE；ngx_mail_capabilities 对 value[1..] 逐个压入数组，与 `smtp_capabilities extension ...;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2
  - 判据：setter 把各扩展名压入 sscf->capabilities；merge 把它们逐行拼成 "250-…" 的 EHLO 回复（连同服务器名行与 AUTH 行）及 STARTTLS 变体；ngx_mail_smtp_helo 在命令不是 HELO（即 EHLO）时置 esmtp 并以 sscf->capability（或 STARTTLS 变体）作为输出。

## nginx--ngx_mail_smtp_module--smtp_auth

- 语法：verified；source_ids：registration, configuration-definition, implementation-0
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_1MORE；ngx_conf_set_bitmask_slot 逐项对照 ngx_mail_smtp_auth_methods，取值表为 plain、login、cram-md5、external、none，与 `smtp_auth plain|login|cram-md5|external|none ...;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, summary-smtp-announce, implementation-1, implementation-2, implementation-5
  - 判据：setter 把所选方法位写入 sscf->auth_methods（merge 默认 plain|login）；merge 把已启用的 PLAIN/LOGIN/CRAM-MD5/EXTERNAL 拼进 EHLO 的 AUTH 行；ngx_mail_smtp_auth 对 CRAM-MD5 与 EXTERNAL 要求对应位已启用；ngx_mail_smtp_mail 在 none 位未启用时回复 530 要求认证，启用时接受 MAIL FROM，RCPT TO 后以 auth_method NONE 触发认证，请求认证服务器时带上 Auth-SMTP-Helo/From/To。
- 新增片段：summary-smtp-announce（src/mail/ngx_mail_smtp_module.c:210-266）

## nginx--ngx_mail_ssl_module--starttls

- 语法：verified；source_ids：registration, configuration-definition, implementation-1, syntax-enum-slot
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_TAKE1，post 指向 ngx_mail_starttls_state；ngx_mail_ssl_starttls 先调 ngx_conf_set_enum_slot，后者逐项对照取值表，表中只有 off、on、only，与 `starttls on | off | only;` 一致。
- 功能：verified；source_ids：registration, configuration-definition, implementation-1, implementation-0, implementation-3, implementation-4, implementation-5, implementation-6, implementation-7, implementation-8, implementation-9, implementation-10, implementation-11, implementation-12, implementation-14
  - 判据：注册偏移指向 sslcf->starttls，ngx_mail_ssl_starttls 经 ngx_conf_set_enum_slot 按取值表把 off/on/only 映射为 NGX_MAIL_STARTTLS_OFF/ON/ONLY 写入（merge 默认 off），非 off 时 merge 创建 TLS 上下文；POP3 STLS、IMAP/SMTP STARTTLS 命令处理函数在连接尚无 c->ssl 且 sslcf->starttls 非 0 时把读处理函数设为 ngx_mail_starttls_handler，由其置 s->starttls 并发起 TLS 握手，握手完成后重新调用协议 init_protocol；CAPA/CAPABILITY/EHLO 在 on 时回复带 STLS/STARTTLS 的变体；ngx_mail_starttls_only 在 only 时返回真，IMAP LOGIN/AUTHENTICATE、POP3 USER/APOP/AUTH 与 SMTP AUTH 在升级前据此按无效命令拒绝。发行补丁 ssl_cert_cb_yield、ssl_sess_cb_yield、ssl_client_hello_cb_yield 只在 ngx_ssl_handshake 与 ngx_ssl_try_early_data 增加挂起重试分支，不涉及 mail 的 starttls/验证逻辑，上述流程不变。
- 新增片段：syntax-enum-slot（src/core/ngx_conf_file.c:1351-1385）

## nginx--ngx_mail_ssl_module--ssl_certificate

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_TAKE1，ngx_conf_set_str_array_slot 每次出现追加一个字符串，与 `ssl_certificate file;`（可重复）一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2, implementation-3, merge-default
  - 判据：setter 把每次配置的路径追加进 sslcf->certificates；merge 仅在 listen ssl 或 starttls 启用时往下创建上下文并调用 ngx_ssl_certificates 逐个加载；ngx_ssl_load_certificate 以 PEM_read_bio_X509_AUX 读首个证书、PEM_read_bio_X509 读其后证书链，ngx_ssl_certificate 以 SSL_CTX_use_certificate 装入并保留所有证书（注释说明同类型证书会被替换，因此用 exdata 迭代保存）。发行补丁 ssl_cert_cb_yield、ssl_sess_cb_yield、ssl_client_hello_cb_yield 只改 ngx_ssl_handshake 与 ngx_ssl_try_early_data，不涉及加载函数。

## nginx--ngx_mail_ssl_module--ssl_certificate_key

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_TAKE1，ngx_conf_set_str_array_slot 每次出现追加一个字符串，与 `ssl_certificate_key file;`（可重复）一致。
- 功能：verified；source_ids：configuration-definition, implementation-1, implementation-2, implementation-3, implementation-4
  - 判据：setter 把每次配置的路径追加进 sslcf->certificate_keys；merge 要求私钥数不少于证书数并调用 ngx_ssl_certificates；该函数按下标把 cert[i] 与 key[i] 配对调用 ngx_ssl_certificate，后者用 SSL_CTX_use_PrivateKey 装入，ngx_ssl_load_certificate_key 对文件用 PEM_read_bio_PrivateKey 读取（另支持 engine:、data: 形式）；上述发行补丁不涉及这些函数。

## nginx--ngx_mail_ssl_module--ssl_password_file

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_TAKE1；ngx_mail_ssl_password_file 只取 value[1]（重复配置报 is duplicate）交给 ngx_ssl_read_password_file，与 `ssl_password_file file;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-1, implementation-2, implementation-3
  - 判据：setter 把 ngx_ssl_read_password_file 读到的口令数组存入 sslcf->passwords；该函数按行（LF）切分文件得到口令列表；merge 把 conf->passwords 传给 ngx_ssl_certificates，ngx_ssl_load_certificate_key 解密私钥失败时依次换下一条口令重试。

## nginx--ngx_mail_ssl_module--ssl_dhparam

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_TAKE1，ngx_conf_set_str_slot 把 value[1] 存为字符串，与 `ssl_dhparam file;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-1, implementation-2, merge-default
  - 判据：setter 写入 sslcf->dhparam（merge 默认空）；merge 在创建 TLS 上下文后调用 ngx_ssl_dhparam(cf, &conf->ssl, &conf->dhparam)，该函数在文件名非空时用 PEM_read_bio_DHparams 读取并以 SSL_CTX_set_tmp_dh 设为上下文的临时 DH 参数。
- 修正（功能）：加载PEM格式DH参数文件，并经SSL_CTX_set_tmp_dh（或新版接口SSL_CTX_set0_tmp_dh_pkey）设置到邮件TLS上下文；未配置时不加载。
  - 理由：原文称“DHE密码套件所需”，源码未体现该用途（属 OpenSSL 对该参数的使用方式）；ngx_ssl_dhparam 在文件名为空时直接返回。

## nginx--ngx_mail_ssl_module--ssl_ecdh_curve

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_TAKE1，ngx_conf_set_str_slot 把 value[1] 存为字符串，与 `ssl_ecdh_curve curve;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-1, implementation-2, implementation-3, merge-default
  - 判据：setter 写入 sslcf->ecdh_curve（merge 默认 auto）；merge 调用 ngx_ssl_ecdh_curve(cf, &conf->ssl, &conf->ecdh_curve)，该函数在支持曲线列表的库上设置 SSL_OP_SINGLE_ECDH_USE，值为 auto 时到此返回，其他值才调用 SSL_CTX_set1_curves_list；不支持曲线列表的库走单曲线分支（auto 取 prime256v1，经 SSL_CTX_set_tmp_ecdh）。
- 修正（功能）：设置邮件TLS上下文的ECDH曲线或曲线列表：SSL库支持曲线列表时，auto只启用SSL_OP_SINGLE_ECDH_USE而不额外设置曲线，其他值经SSL_CTX_set1_curves_list设置；不支持曲线列表时按单个曲线名设置（auto取prime256v1）。
  - 理由：原文称“ECDHE曲线”属 OpenSSL 语义，源码只证明设置曲线（列表）；且 auto 在曲线列表分支直接返回，未区分。

## nginx--ngx_mail_ssl_module--ssl_protocols

- 语法：verified；source_ids：registration, configuration-definition, implementation-1
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_1MORE；ngx_conf_set_bitmask_slot 逐项对照 ngx_mail_ssl_protocols，取值表为 SSLv2、SSLv3、TLSv1、TLSv1.1、TLSv1.2、TLSv1.3，与语法一致。
- 功能：verified；source_ids：configuration-definition, implementation-2, implementation-5, merge-default
  - 判据：setter 把所选协议位写入 sslcf->protocols（merge 默认 TLSv1 至 TLSv1.3）；merge 以 ngx_ssl_create(&conf->ssl, conf->protocols, NULL) 创建上下文，ngx_ssl_create 对未选中的协议设置 SSL_OP_NO_* 选项，从而禁用它们。

## nginx--ngx_mail_ssl_module--ssl_ciphers

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_TAKE1，ngx_conf_set_str_slot 把 value[1] 原样存为字符串，与 `ssl_ciphers ciphers;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-2, implementation-4, merge-default
  - 判据：setter 写入 sslcf->ciphers（merge 默认 HIGH:!aNULL:!MD5）；merge 调用 ngx_ssl_ciphers(cf, &conf->ssl, &conf->ciphers, …)，该函数把字符串原样交给 SSL_CTX_set_cipher_list。

## nginx--ngx_mail_ssl_module--ssl_prefer_server_ciphers

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_FLAG，ngx_conf_set_flag_slot 只接受 on/off，与 `ssl_prefer_server_ciphers on | off;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-1, implementation-3, merge-default
  - 判据：setter 写入 sslcf->prefer_server_ciphers（merge 默认 0）；merge 把 conf->prefer_server_ciphers 作为参数传给 ngx_ssl_ciphers，该函数在其为真时设置 SSL_OP_CIPHER_SERVER_PREFERENCE。

## nginx--ngx_mail_ssl_module--ssl_session_cache

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_TAKE12；ngx_mail_ssl_session_cache 对 value[1..2] 逐项识别 off、none、builtin、builtin:size、shared:name:size，其余报 invalid session cache，与语法一致。
- 功能：verified；source_ids：configuration-definition, implementation-2, implementation-3, merge-default
  - 判据：setter 把 off/none/builtin[:size] 写入 sslcf->builtin_session_cache，把 shared:name:size 经 ngx_shared_memory_add 建共享区写入 sslcf->shm_zone；merge 把二者与 session_timeout 传给 ngx_ssl_session_cache，该函数按模式设置 SSL_SESS_CACHE_*：off 关闭，none 只假装支持，否则启用服务端缓存，builtin 数值设进程内缓存容量，有 shm_zone 时挂接共享缓存回调。发行补丁 ssl_sess_cb_yield 只改 ngx_ssl_handshake 与 ngx_ssl_try_early_data 的挂起重试，不涉及此函数。

## nginx--ngx_mail_ssl_module--ssl_session_tickets

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_FLAG，ngx_conf_set_flag_slot 只接受 on/off，与 `ssl_session_tickets on | off;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-1, merge-default
  - 判据：setter 写入 sslcf->session_tickets（merge 默认 1）；merge 在其为 0 时对 SSL 上下文设置 SSL_OP_NO_TICKET，关闭会话票据。

## nginx--ngx_mail_ssl_module--ssl_session_ticket_key

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_TAKE1，ngx_conf_set_str_array_slot 每次出现追加一个字符串，与 `ssl_session_ticket_key file;`（可重复）一致。
- 功能：verified；source_ids：configuration-definition, implementation-1, implementation-2, implementation-3
  - 判据：setter 把每个密钥文件路径追加进 sslcf->session_ticket_keys；merge 把它传给 ngx_ssl_session_ticket_keys，该函数逐个读入密钥并注册 ngx_ssl_ticket_key_callback；回调在加密票据时只用第一把密钥 key[0]，解密时遍历全部密钥按名称匹配，因此可把新密钥放前、旧密钥保留在后实现轮换。

## nginx--ngx_mail_ssl_module--ssl_session_timeout

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_TAKE1，ngx_conf_set_sec_slot 解析时间并转为秒，与 `ssl_session_timeout time;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-1, implementation-2, merge-default
  - 判据：setter 写入 sslcf->session_timeout（merge 默认 300 秒）；merge 把它作为 timeout 传给 ngx_ssl_session_cache，该函数以 SSL_CTX_set_timeout 设为会话缓存条目的有效期。

## nginx--ngx_mail_ssl_module--ssl_verify_client

- 语法：verified；source_ids：registration, configuration-definition, implementation-1
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_TAKE1，post 指向 ngx_mail_ssl_verify；ngx_conf_set_enum_slot 对照取值表，表中为 off、on、optional、optional_no_ca，与语法一致。
- 功能：verified；source_ids：configuration-definition, implementation-1, implementation-2, implementation-3, implementation-4, implementation-5, merge-default
  - 判据：setter 经取值表把 off/on/optional/optional_no_ca 映射为 0/1/2/3 写入 sslcf->verify（merge 默认 0 即 off）；merge 在其非 0 时要求 ssl_client_certificate（optional_no_ca 除外）并调用 ngx_ssl_client_certificate 令上下文请求客户端证书（SSL_VERIFY_PEER）；握手完成后 ngx_mail_verify_cert 在 verify 非 0 时检查验证结果：失败（optional_no_ca 容忍无 CA 类错误）回复协议的 cert_error 并关闭，on 且客户端未发证书回复 no_cert 并关闭，其余放行进入邮件会话。

## nginx--ngx_mail_ssl_module--ssl_verify_depth

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_TAKE1，ngx_conf_set_num_slot 把 value[1] 解析为整数，与 `ssl_verify_depth number;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-1, implementation-2, implementation-3, merge-default
  - 判据：setter 写入 sslcf->verify_depth（merge 默认 1）；merge 在 ssl_verify_client 启用的分支里把它传给 ngx_ssl_client_certificate 与 ngx_ssl_trusted_certificate，二者调用 SSL_CTX_set_verify_depth 设定证书链验证深度（未启用客户端证书验证时不生效）。

## nginx--ngx_mail_ssl_module--ssl_client_certificate

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_TAKE1，ngx_conf_set_str_slot 把 value[1] 存为字符串，与 `ssl_client_certificate file;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-1, implementation-2, merge-default
  - 判据：setter 写入 sslcf->client_certificate；merge 在 verify 非 0 时把它传给 ngx_ssl_client_certificate，该函数以 SSL_CTX_load_verify_locations 加载为验证用 CA 文件，并以 SSL_load_client_CA_file/SSL_CTX_set_client_CA_list 把文件中的 CA 名称设为上下文的客户端 CA 列表。
- 修正（功能）：仅在ssl_verify_client非off时，配置邮件TLS验证客户端证书的CA证书文件，并把该文件中的CA名称设为客户端CA名称列表。
  - 理由：原文称文件为 PEM 且 CA 名称列表“向客户端发送”；锁定源码只把路径交给 SSL_CTX_load_verify_locations/SSL_load_client_CA_file 并以 SSL_CTX_set_client_CA_list 设置列表，文件格式与是否发送由 OpenSSL 决定，源码不可见，故收窄。

## nginx--ngx_mail_ssl_module--ssl_trusted_certificate

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_TAKE1，ngx_conf_set_str_slot 把 value[1] 存为字符串，与 `ssl_trusted_certificate file;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-1, implementation-2, summary-client-cert
  - 判据：setter 写入 sslcf->trusted_certificate；merge 在 verify 非 0 时把它传给 ngx_ssl_trusted_certificate，该函数仅以 SSL_CTX_load_verify_locations 把文件加载为验证用 CA，不像 ngx_ssl_client_certificate 那样调用 SSL_CTX_set_client_CA_list。
- 新增片段：summary-client-cert（src/event/ngx_event_openssl.c:903-947）
- 修正（功能）：仅在ssl_verify_client非off时，为邮件TLS客户端验证补充信任CA文件，不把其CA名称写入客户端CA名称列表。
  - 理由：原文称文件为 PEM 且“不公告给客户端”；锁定源码中 ngx_ssl_trusted_certificate 只加载验证用 CA 而不设置客户端 CA 列表（与 ngx_ssl_client_certificate 对比可见），文件格式与是否公告由 OpenSSL 决定，源码不可见，故收窄。

## nginx--ngx_mail_ssl_module--ssl_crl

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_TAKE1，ngx_conf_set_str_slot 把 value[1] 存为字符串，与 `ssl_crl file;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-1, implementation-2
  - 判据：setter 写入 sslcf->crl；merge 在 verify 非 0 时调用 ngx_ssl_crl，该函数用 X509_LOOKUP_load_file(…, X509_FILETYPE_PEM) 把 PEM 文件加入证书库并设置 X509_V_FLAG_CRL_CHECK|X509_V_FLAG_CRL_CHECK_ALL。

## nginx--ngx_mail_ssl_module--ssl_conf_command

- 语法：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_MAIL_MAIN_CONF|NGX_MAIL_SRV_CONF|NGX_CONF_TAKE2，ngx_conf_set_keyval_slot 把 value[1]、value[2] 存为键值对（可重复），与 `ssl_conf_command name value;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-3, implementation-4, merge-default
  - 判据：setter 把键值对依次追加进 sslcf->conf_commands；merge 在证书、会话缓存与票据密钥等常规设置之后最后调用 ngx_ssl_conf_commands，该函数按数组顺序对每对执行 SSL_CONF_cmd。
