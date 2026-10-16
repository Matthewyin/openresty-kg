# C02 剩余基础内容流水批次

状态：ready，可冻结交实施与审核。规划角色；仅写本文件，不修改冻结总方案、产品或知识，不制作内容草稿。research 技能用于固定一手源码/文档证据；本轮不创建嵌套 agent。

## 快照、差集与占用边界

依据 `analysis/directives/catalog.json` 的正式 `(component,module,name)` 身份集合，与 `knowledge/directives.json` 的实际身份作差。读取快照为 **1017注册、145已有知识、872差集**。145与主报告的已审核basic数一致；不从旁支候审文件或注册行推断basic。此计划沿用已完成C01的分母，不重新研究build。

已有内容分组件：lua-nginx-module 8；stream-lua-nginx-module 1；headers-more-nginx-module 4；nginx 107；xss-nginx-module 6；echo-nginx-module 19。已完整覆盖的 echo/headers-more/xss 和core/events不再派新生产任务。部分覆盖模块以完整owner为审核边界，仅补附录所列差集。

本次扣除主已指定的并行块：

|占用块|完整身份边界|尚未进knowledge的身份数|责任/动作|
|---|---|---:|---|
|HTTP core待审|nginx / ngx_http_core_module 26 + ngx_http_module.http 1|27|独立审核中；本文不重新派工|
|HTTP proxy|nginx / ngx_http_proxy_module|68|Sol生产中；可复用审核后的共享入口研究，不抢写|
|HTTP access/auth/realip/referer|ngx_http_access_module 2、ngx_http_auth_basic_module 2、ngx_http_auth_request_module 2、ngx_http_realip_module 3、ngx_http_referer_module 3，component均为nginx|12|主线程负责；本文不重新派工|

因此新流水集合为 **872−27−68−12＝765项**，分布 **18个组件、96个component/module组**：Nginx512，HTTP Lua71，stream Lua49，其余第三方133。公式按身份集合算，不只按名称或口述“HTTP core”算；`http` owner是ngx_http_module，若遗漏会错误得到766。

快照指纹（并行集成后用于识别本计划版本，非产品硬编码门槛）：

- catalog SHA256：`1a625dd29a400e23d49437082a895e7d4f37bab9bcd97c2e859415871531399c`
- knowledge SHA256：`90fc76d000987b28267dbcfd77825568caa164be6c2129c67b2e78d90aad8946`

每批领取前重新核该component/module在当前knowledge的差集；已被主集成的身份从本批待写集合扣除，原有内容可作为完整模块审核依据。占用块审核失败仍回原责任方；不得靠将其排除在本计划而宣称全C02完成。765是本次快照，不预设最终未完数或最终basic数。

落盘前再次只读复核：knowledge已由145增至172，新增正是上述HTTP core 27项；catalog仍1017，当前文件差集845，其中proxy68和主线程访问/认证12仍占用，845−68−12仍为765。knowledge当前SHA256为 `d5c0d891f26568e0a438685156bbe77d4b2fcb066b26ca9ff4c217d42ec39e4a`。这记录并行集成事实，不自行宣布候审内容审核通过；后续审核状态以主记录为准。本计划765个身份未因这次集成发生变化。

## 固定证据与阅读办法

需求/总体依据：`REQUIREMENTS.md` §4.1 与 `IMPLEMENTATION_PLAN.md` M3；冻结C01及总方案沿用。当前可用来源：

- Nginx：`e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`；官方 docs：`e8b581903e9d41252720053311cea687a5671674`（repos/nginx-docs，documentation_sources 已启用）。附录所有XML链接均指此固定树，仅读取活跃directive节点，XML注释、商业参数、文档独有节点不进入身份集。
- OpenResty：`8c37412c31621225e7aa7e825b5b50106c9c71c4`；有效patch集合和已有回放证据读取 `analysis/NGINX_PATCH_AUDIT.json`、`analysis/components.json` 的 patch_scope，以及 `analysis/REDIS_PATCH_AUDIT.json`。不重跑C01或回放生成器。
- 第三方：附录按每个组件固定SHA的README/专门文档及真实注册源码提供入口；不引用浮动主分支。固定README尚未证明每项语义，仅是继续逐项阅读入口。

先对完整module共读配置结构、create/init/merge和共用解析器；再逐条核 `callback + offset字段 + post + 关键使用处`。例如 FastCGI/SCGI/uWSGI注册都嵌入upstream_conf且各有自己的create_request，故应连续阅读共享upstream/file_cache，再保留各协议差异；这来自实际源码结构，不按相近指令名复制正文。

一手共用入口：[配置槽位解析](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/core/ngx_conf_file.c)、[HTTP upstream](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/ngx_http_upstream.c)、[file_cache](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/ngx_http_file_cache.c)、[HTTP script](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/ngx_http_script.c)、[SSL实现](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/ngx_event_openssl.c)、[stream proxy](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_proxy_module.c)。它们减少重复读函数，不替代逐项功能、协议/context和字段引用。

## 流水顺序与每批验收

P01–P05优先接续proxy已读的upstream/cache/SSL证据；P06–P12主要为独立HTTP模块，可在P01等待审核时顺序领用。P13集中读三域SSL共享实现，再接P14/P16以及Lua SSL入口。P15先建立stream配置/变量证据，P16接代理。P18→P19按Lua配置入口族连续阅读，P20的NDK使用方可与Nginx线独立推进；P21→P22共用上游/子请求经验，P23从数据库输出到RDS过滤。此顺序是节省阅读的建议，不要求等待前一批全部审核才读独立下一批；同一完整身份组只派一个生产责任方。

生产可按同一模块内部的callback/字段族分段提交审核，但模块收口按全部差集，不能将难项或无docs项静默拖到无清单的后续批。较大批中不同完整owner可分别通过；例如P13的28/21/19不要求同一时刻合并。主负责knowledge合并及来源片段/build，Sol生产，Astra按完整身份集审核；本文不新增ledger或公共schema。

|批次|模块边界（component见附录）|快照差集|共读顺序与源结构|本批完成判据（另须满足公共判据）|
|---|---|---:|---|---|
|P01 HTTP upstream 与算法|ngx_http_upstream_module<br>ngx_http_upstream_hash_module<br>ngx_http_upstream_ip_hash_module<br>ngx_http_upstream_keepalive_module<br>ngx_http_upstream_least_conn_module<br>ngx_http_upstream_random_module<br>ngx_http_upstream_zone_module|11|一次读 src/http/ngx_http_upstream.c/.h 的 upstream/server 回调、各算法配置和 init_upstream；共读 ngx_http_upstream_round_robin.c 与 zone/keepalive 的配置结构。其 XML 同页，owner 仍分开。|7个 owner 的剩余11项全部核齐；server 参数只收1.27.1实际接受值，商业参数和其他 owner 不串入；keepalive 三种寿命字段分开；将 upstream 三类有效补丁与所列事实对应。|
|P02 FastCGI|ngx_http_fastcgi_module|49|读取 ngx_http_fastcgi_module.c 的 loc_conf、create/merge、params_init、create_request，再复用 P01 的 upstream_conf 与 src/http/ngx_http_file_cache.c。|完整49项：索引/split_path_info、PARAMS记录、缓冲/请求体、缓存/存储分别核；NGX_HTTP_CACHE 条件保留；不能从 proxy 参数改前缀得到解释。|
|P03 SCGI|ngx_http_scgi_module|44|在 P02 共读缓存/上游解析器后，单独读 ngx_http_scgi_module.c 的 params/create_request 与 create/merge。|完整44项：SCGI 参数与请求构造依据自身代码，缓存/存储/请求缓冲保持区分；同名后缀逐字段查对应结构。|
|P04 uWSGI|ngx_http_uwsgi_module|60|单独读 ngx_http_uwsgi_module.c 的 modifier、param/raw string、create_request、merge、TLS 设置；复用缓存和 SSL 辅助函数来源。|完整60项含无 XML 节点 uwsgi_string；非 SCGI/FastCGI 协议参数不可复制；CACHE/SSL 条件及字段单位逐项留证。|
|P05 gRPC 与内置 memcached|ngx_http_grpc_module<br>ngx_http_memcached_module|39|ngx_http_grpc_module.c 与 ngx_http_memcached_module.c 的 upstream_conf、目标回调和各自协议请求构造；gRPC 的 TLS 可复用 P04 的证据入口，正文仍据字段写。|28+11项精确闭合；gRPC 的 HTTP/2 处理和 memcached 协议不能借通用 upstream 回调说明代替；TLS/重试限制与实际代码一致。|
|P06 HTTP 重写、变量与请求方法|ngx_http_rewrite_module<br>ngx_http_map_module<br>ngx_http_geo_module<br>ngx_http_split_clients_module<br>ngx_http_secure_link_module<br>ngx_coolkit_module|16|rewrite module 与 src/http/ngx_http_script.c、ngx_http_variables.c 共读；map/geo/split_clients 各自块回调与变量 getter；secure_link 与 coolkit 的独立字段/使用处。|6个身份组16项；块语法、rewrite脚本、变量赋值及 override_method 各有实际配置入口，不把共用 complex-value 解析器当功能；coolkit README 语法仍对照源码。|
|P07 HTTP 限流、子请求与降级|ngx_http_limit_conn_module<br>ngx_http_limit_req_module<br>ngx_http_mirror_module<br>ngx_http_degradation_module|14|limit_conn/limit_req 的 zone、main/loc_conf、slab/共享内存使用处；mirror 子请求入口；degradation 的 main/loc_conf 与 sbrk 字段使用。|14项包含 degradation/degrade 的源码专项；区分两类限流及 dry_run、status/log 字段；无 XML 的必需功能/语法由回调与使用处核定，默认可未知。|
|P08 HTTP 文件、目录与媒体|ngx_http_autoindex_module<br>ngx_http_dav_module<br>ngx_http_empty_gif_module<br>ngx_http_flv_module<br>ngx_http_mp4_module<br>ngx_http_index_module<br>ngx_http_random_index_module<br>ngx_http_try_files_module|17|各注册文件的 content handler、路径和 create/merge；共用 src/http/ngx_http_core_module.c 的路径配置、src/core/ngx_open_file_cache.c；mp4 只追所写配置的原子解析/缓冲字段。|8个 owner17项；try_files 文档归 HTTP core 但身份归 try_files；DAV方法/权限、目录选项、媒体定位等各有来源；不新增媒体运行时测试。|
|P09 压缩、切片与输出缓冲|ngx_http_gzip_filter_module<br>ngx_http_gunzip_filter_module<br>ngx_http_gzip_static_module<br>ngx_http_slice_filter_module<br>ngx_http_copy_filter_module|14|gzip/gunzip ctx和配置、gzip_static 文件选择、slice 配置、copy_filter 输出链；共读 src/core/ngx_output_chain.c；复用已审核的 HTTP core gzip 条件来源。|14项含 gzip 四个无同名 XML 参数；output_buffers 的 XML 在 HTTP core；压缩库/类型和缓冲条件据真实字段，不能把 XML 空 default 当零。|
|P10 响应过滤与身份标记|ngx_http_addition_filter_module<br>ngx_http_charset_filter_module<br>ngx_http_headers_filter_module<br>ngx_http_sub_filter_module<br>ngx_http_ssi_filter_module<br>ngx_http_userid_filter_module<br>ngx_http_browser_module|35|过滤模块分别读 create/merge 与 filter/handler 挂接；共用 ngx_http_types_slot；userid 的 conf/标记及 browser 的匹配表单独核。|7个 owner35项；SSI 内部命令不扩成配置指令；ssi_ignore_recycled_buffers 走源码专项；NGINX headers 与已完成 headers-more 仍不同身份。|
|P11 可选库与嵌入式 Perl|ngx_http_image_filter_module<br>ngx_http_xslt_filter_module<br>ngx_http_perl_module<br>ngx_http_geoip_module|22|image_filter 的 GD 参数/转换、xslt 参数与 stylesheet、geoip 数据库字段；Perl 配置回调及模块自己的 conf，借用既有生成边界证据。|22项；每种可选库依赖逐模块明确；Perl 接受什么配置由真实回调证明，生成/编译未运行不编造结果；GeoIP正文按固定库/模块而非新GeoIP2能力。|
|P12 日志与状态|ngx_http_log_module<br>ngx_stream_log_module<br>ngx_http_stub_status_module|6|HTTP/stream 各自 compile_format、日志目标和缓存创建；共享 src/core/ngx_log.c、ngx_open_file_cache.c；stub_status 的独立 handler/配置入口。|6项：HTTP log 剩3、stream log 剩2、stub_status1；已完成 log_escape_non_ascii/access_log 不重写；HTTP 转义补丁不能套给 stream，error_log 拦截风险只按所述事实核。|
|P13 HTTP、stream、mail TLS|ngx_http_ssl_module<br>ngx_stream_ssl_module<br>ngx_mail_ssl_module|68|一次共读 src/event/ngx_event_openssl.c/.h、ngx_event_openssl_stapling.c 与三模块 SSL conf/create/merge，随后按 HTTP/stream/mail 的握手及验证配置分别核。|28+21+19项独立身份闭合；HTTP OCSP/stapling/early_data、stream ALPN/握手超时、mail STARTTLS各读使用处；库版本条件、SSL回调补丁逐事实核定，不能复制域间默认值。|
|P14 HTTP/2、HTTP/3 与 TLS 预读|ngx_http_v2_module<br>ngx_http_v3_module<br>ngx_stream_ssl_preread_module|24|HTTP v2 的 obsolete 回调、conf/init 与 HTTP v3/QUIC配置；stream ssl_preread 配置和预读 handler，与 P13 SSL 处理分开。|15+8+1项；8个 HTTP/2 obsolete 项仍收录且不写旧参数生效；http2_pool_size/streams_index_size 走源码；stream 预读补丁直接核所写行为。|
|P15 stream 配置、变量与访问|ngx_stream_module<br>ngx_stream_core_module<br>ngx_stream_access_module<br>ngx_stream_geo_module<br>ngx_stream_geoip_module<br>ngx_stream_limit_conn_module<br>ngx_stream_map_module<br>ngx_stream_pass_module<br>ngx_stream_realip_module<br>ngx_stream_return_module<br>ngx_stream_split_clients_module|29|stream ngx_stream.c/core配置框架、变量/hash/resolver/preread；各 map/geo/split/access/limit/pass/return/realip 的 srv/main_conf 和 handler。|11个 owner29项；保留已完成 stream server/listen/error_log，剩余字段逐一补齐；pass 的当前入口、server_names等固定版本能力不可借HTTP语义替代。|
|P16 stream upstream 与代理|ngx_stream_upstream_module<br>ngx_stream_upstream_hash_module<br>ngx_stream_upstream_least_conn_module<br>ngx_stream_upstream_random_module<br>ngx_stream_upstream_zone_module<br>ngx_stream_proxy_module|34|stream upstream/round_robin/zone/算法与 proxy_srv_conf、create/merge；复用 P15 的框架和 P13 的 TLS 辅助代码。|6个 owner34项；proxy已有3项保持；旧buffer别名保留独立废弃说明，代理请求/响应次数及UDP边界按使用处；timeout_fields/balancer补丁和Lua动态改写关系逐事实核。|
|P17 mail 非 TLS 模块|ngx_mail_module<br>ngx_mail_auth_http_module<br>ngx_mail_core_module<br>ngx_mail_imap_module<br>ngx_mail_pop3_module<br>ngx_mail_proxy_module<br>ngx_mail_realip_module<br>ngx_mail_smtp_module|31|mail 配置框架、core的server/listen/protocol，auth_http/proxy/realip，以及IMAP/POP3/SMTP各srv_conf和协议参数使用。|8个 owner31项；mail error_log借core XML但身份独立；proxy节点仅在XML注释中，改走源码；协议capabilities/auth参数按各表核，不能复制HTTP/stream解释。|
|P18 HTTP Lua|ngx_http_lua_module|71|HTTP Lua module 配置结构、src/ngx_http_lua_directive.c、util.c，以及 init/initworker/set/rewrite/serverrewrite/access/content/log/filter/balancer/SSL 各 by-lua 配置入口；定时器/regex/cosocket/worker-thread按字段集中阅读。|79总身份中的71差集完整；现有8项复用；inline/block/file只可复用解析路径证据，分别核语法/context/入口；NO_POSTPONE、SSL/PCRE/NDK条件和Nginx回调补丁单列；旧形式/更名按README与handler核，不伪造deep。|
|P19 stream Lua|ngx_stream_lua_module|49|stream Lua directive/util与init/initworker/preread/content/log/balancer/SSL/cosocket配置入口；复用P18共用LuaJIT概念，实际实现只引用stream源码。|50总身份中的49差集完整；已有preread_by_lua_block不重写；lua_load_resty_core警告且返回OK的行为单列；不得用HTTP阶段/context填stream字段。|
|P20 NDK 使用方与变量扩展|ndk_http_module<br>ngx_http_set_misc_module<br>ngx_http_array_var_module<br>ngx_http_form_input_module<br>ngx_http_iconv_module<br>ngx_http_encrypted_session_module|44|复用已过NDK注册/include证据，只读内容所需 ndk_set_var、ndk_upstream_list.c、set-misc各运算、array util、form_input模块、iconv过滤和encrypted_session_cipher。|6组件44项；NDK_UPSTREAM_LIST可选/默认组合/实际部署分开；set_misc_base32_padding旧名独立；array/form入口和解析限制各据源码；SSL/PCRE/iconv依赖只写已核条件。|
|P21 第三方 memc 与 Redis 协议|ngx_http_memc_module<br>ngx_http_redis_module<br>ngx_http_redis2_module|30|memc/redis/redis2各配置与目标回调、请求/响应协议源码；可复用P05与P01上游辅助证据；Redis同时读取既有三patch审计。|3组件30项；memc两项unsupported仍保留身份且明确配置失败；Redis三patch对目标变量/默认端口/内容编码所述事实逐条核；Redis2命令流不能借Redis0.3.9说明替代。|
|P22 srcache|ngx_http_srcache_filter_module|20|srcache的loc_conf/create/merge、fetch/store专用回调、header/body过滤器和子请求处理；借用已审核HTTP缓存控制字段证据。|20项：请求/响应缓存控制、fetch/store与skip表达式分开；头过滤/状态/范围/过期字段都有真实使用处；不把srcache等同Nginx file_cache。|
|P23 数据库与 RDS 过滤|ngx_http_drizzle_module<br>ngx_postgres_module<br>ngx_http_rds_json_filter_module<br>ngx_http_rds_csv_filter_module|38|drizzle/postgres配置、upstream/keepalive/handler/processor；顺序接读RDS JSON/CSV的过滤器、输出配置与协议结构。|4组件38项；数据库查询/结果输出和RDS过滤身份分别核；固定libdrizzle/libpq依赖、参数接受范围及转义限制据代码；不设计数据库或连接现场服务。|

所有批次共同完成判据：

1. 该批领取时差集的每个完整身份有唯一知识记录，明确哪些已有、哪些本批完成、哪些仍因必需事实未核保持registration_only；无遗漏、无跨module同名误合并。未解身份仍在批内，不能只交易写子集称完成。
2. 功能说明来自字段/关键使用处和文档，语法/context与真实注册/回调相符；配置callback定义引用准确可站内查看。无独立XML的项可以用固定源码核实，但仅名称翻译、槽位类型或注册行不足以完成basic。
3. 必需功能、语法/context、配置入口、条件和所写事实的patch状态均核实；默认/继承/补充限制不能核实时明确unknown，不填猜测值，不以补充未知阻断合格basic。废弃/ignored/unsupported有真实回调证据，不能写成旧功能仍有效。
4. 源码和XML/README引用固定revision、实际文件/行范围且能接入现有build；上游与补丁来源分别引用，不拿patch拼接行号冒充已补丁后的文件。只用已存在片段能力，不扩UI或源码来源公共契约。
5. Astra逐项对完整身份集合及所述事实审核；通过后由主集成并做身份/引用/发布覆盖检查。构建出basic只是机器门槛，不替代语义审核；真实新失败再扩检查，不重复C01、编译或跑OpenResty。

## 补丁风险的最小分流

下面“直接patch”是对既有固定有效patch原文 `+++ target` 与注册源路径的精确交集，用来安排阅读，**不是把未命中者判unaffected**。路径同时存在git式b/和发行包式目录前缀、带时间戳，两种都按实际target核定。其余注册文件虽未直接修改，共享配置、字段或使用链仍可变。

- **上游/缓存/目标类**（P01–P05、P16、P21–P23及Lua balancer）：核 upstream_timeout_fields、upstream_pipelining、balancer_status_code；stream还核 stream_proxy_timeout_fields、stream_proxy_get_next_upstream_tries、stream_balancer_export。共享解析和运行字段受补丁影响时，只给所述事实明确状态，不将整个模块标unaffected。
- **SSL类**（P04/P05、P13、P18/P19/P20）：核 ssl_cert_cb_yield、ssl_sess_cb_yield、ssl_client_hello_cb_yield 修改的共享ngx_event_openssl.c；独立SSL配置文件不变不足以排除回调影响。
- **resolver/socket/生命周期类**（P01–P05、P15–P17及Lua）：resolver_conf_parsing、safe_resolver_ipv6_option、socket_cloexec、reuseport_close_unused_fds、proc_exit_handler等只按实际所写链路核；不为每条无关flag附一串全局补丁。
- **日志/响应类**（P09/P10/P12/P14）：log_escape_non_ascii直接改HTTP log；intercept_error_log、larger_max_error_str为共享日志；server_header影响header_filter和v2_filter；builtin_error_page_footer/no_error_pages为响应路径。已完成两个patch新增身份保持，不重复产内容。
- **Redis P21**：主已有三patch及最终字节绑定。variables_in_redis_pass、default_port_fix、remove_content_encoding都必须对所写8项的相关事实核；README上游示例不能作为发行最终目标或响应行为唯一证据。
- **其余第三方**：可复用既有固定发行下载tag/未执行组件patch的来源证据，引用实际processing行；但与Nginx共享函数相关的功能限制仍据双方代码核。源码未打补丁与行为不受共享补丁影响是不同结论。

有效patch一手入口：[固定发行处理脚本](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/mirror-tarballs)；patch列表以现有audit/patch_scope为准，不重新发明或重放有效集合。附录只列“直接patch”提示，当前basic状态仍由逐项内容证据判定。

## 无文档、废弃与跨模块文档专项

无对应活跃XML同名节点的剩余 **13项** 已分配到原模块批次，不新增平行身份或分母：

|批次/owner|待专项身份|最少阅读路径|
|---|---|---|
|P07 ngx_http_degradation_module|degradation、degrade|同文件main/loc_conf、专用回调、sbrk_size使用及preaccess handler；无模块XML，不借系统常识编功能|
|P09 ngx_http_gzip_filter_module|gzip_window、gzip_hash、postpone_gzipping、gzip_no_buffer|同文件conf/create/merge、zlib调用和缓冲ctx读写；gzip XML其他节点仅旁证|
|P10 ngx_http_ssi_filter_module|ssi_ignore_recycled_buffers|SSI conf字段及过滤器回收缓冲分支|
|P04 ngx_http_uwsgi_module|uwsgi_string|真实注册与create_request/raw string使用|
|P14 ngx_http_v2_module|http2_pool_size、http2_streams_index_size|v2 conf/init及连接池/streams索引使用，区别下表obsolete项|
|P17 ngx_mail_proxy_module|proxy|mail proxy XML中的该节点处于注释，不能当活跃官方说明；读注册/merge/使用处|
|P16 ngx_stream_proxy_module|proxy_downstream_buffer、proxy_upstream_buffer|旧别名post及buffer_size字段，借新proxy_buffer_size文档时仍保留旧身份|

这里是已核固定模块XML的节点缺口，不宣称全部官方文章/第三方README都没有提及。Redis README偏用途/示例，8项仍逐源码核；第三方README目录匹配也不自动证明每项有完整文档。NDK真正专门入口为 `docs/upstream/list`，不是只读README。

废弃/无效专项：

- **P14 HTTP/2 8项**：http2_max_concurrent_pushes、http2_max_requests、http2_max_field_size、http2_max_header_size、http2_recv_timeout、http2_idle_timeout、http2_push_preload、http2_push；[ngx_http_v2_obsolete:481](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/v2/ngx_http_v2_module.c#L481) 仅警告并返回OK，post可提示替代名。XML历史默认不能当当前生效默认。
- **P16 stream 2别名**：proxy_downstream_buffer、proxy_upstream_buffer，post为ngx_conf_deprecated并写同一buffer_size字段；基本内容应说明告警/别名，不从目录删除。
- **P20 set-misc 旧名**：set_misc_base32_padding的deprecated post与set_base32_padding对照；[固定源码:40](https://github.com/openresty/set-misc-nginx-module/blob/31c4ad67bb9e392a734e4e58ea8048e24012311f/src/ngx_http_set_misc_module.c#L40)。
- **P21 memc 2项**：memc_upstream_max_fails、memc_upstream_fail_timeout；[同文件:325–349](https://github.com/openresty/memc-nginx-module/blob/b889a6fc3e18b784b454e1bc74e5d0b3513a07ce/src/ngx_http_memc_module.c#L325) 的unsupported回调写EMERG并返回NGX_CONF_ERROR。须完成其准确的“不可用”基础知识，不能按名字解释成仍设置超时。
- **P19 stream lua_load_resty_core**：[ngx_stream_lua_directive.c:181](https://github.com/openresty/stream-lua-nginx-module/blob/69f0cd762112a6e0cddb07f2b5192e9a65034a93/src/ngx_stream_lua_directive.c#L181) 警告deprecated后返回OK；HTTP同名项已经完成，不抢写。Lua其他旧inline形式按固定README的deprecated/推荐说明与当前回调分别核，不把所有旧形式一概obsolete。

跨模块文档入口：P08 try_files 和 P09 output_buffers 在 HTTP core XML；P17 mail.error_log 借 `xml/en/docs/ngx_core_module.xml`；HTTP/stream的所有upstream算法都在各自upstream XML，同页server/keepalive名称必须按owner区分。无同名节点、文档归属不同、alias和商业独有节点分别核，不能把“文件名没匹配”当无文档。

## 完整剩余集合与一手入口

下列每组 = 指定component/module在快照catalog的正式全集减已有knowledge身份，再扣除上述占用块。名称列表只作派工和查漏，不是逐项功能草稿；完整模块总数与待写数分开列。Nginx全部源/文档用上面两个固定SHA；第三方每组显式列其SHA。来源路径来自实际注册身份/固定tree，而非由模板猜测。

### P01 HTTP upstream 与算法（11项）

- **nginx / ngx_http_upstream_module：待2 / 全2**。
  注册/owner源：[src/http/ngx_http_upstream.c:361](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/ngx_http_upstream.c#L361)。 文档入口：[xml/en/docs/http/ngx_http_upstream_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_upstream_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_upstream`、`ngx_http_upstream_server`；slot回调还需核真实offset/post及字段使用处。
  直接patch：[patches/nginx-1.27.1-balancer_status_code.patch](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/patches/nginx-1.27.1-balancer_status_code.patch)、[patches/nginx-1.27.1-upstream_pipelining.patch](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/patches/nginx-1.27.1-upstream_pipelining.patch)、[patches/nginx-1.27.1-upstream_timeout_fields.patch](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/patches/nginx-1.27.1-upstream_timeout_fields.patch)。
  **完整待写身份名称**：`upstream`、`server`。

- **nginx / ngx_http_upstream_hash_module：待1 / 全1**。
  注册/owner源：[src/http/modules/ngx_http_upstream_hash_module.c:94](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_upstream_hash_module.c#L94)。 文档入口：[xml/en/docs/http/ngx_http_upstream_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_upstream_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_upstream_hash`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`hash`。

- **nginx / ngx_http_upstream_ip_hash_module：待1 / 全1**。
  注册/owner源：[src/http/modules/ngx_http_upstream_ip_hash_module.c:64](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_upstream_ip_hash_module.c#L64)。 文档入口：[xml/en/docs/http/ngx_http_upstream_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_upstream_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_upstream_ip_hash`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`ip_hash`。

- **nginx / ngx_http_upstream_keepalive_module：待4 / 全4**。
  注册/owner源：[src/http/modules/ngx_http_upstream_keepalive_module.c:130](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_upstream_keepalive_module.c#L130)。 文档入口：[xml/en/docs/http/ngx_http_upstream_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_upstream_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_upstream_keepalive`、`ngx_conf_set_msec_slot`、`ngx_conf_set_num_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`keepalive`、`keepalive_time`、`keepalive_timeout`、`keepalive_requests`。

- **nginx / ngx_http_upstream_least_conn_module：待1 / 全1**。
  注册/owner源：[src/http/modules/ngx_http_upstream_least_conn_module.c:49](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_upstream_least_conn_module.c#L49)。 文档入口：[xml/en/docs/http/ngx_http_upstream_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_upstream_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_upstream_least_conn`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`least_conn`。

- **nginx / ngx_http_upstream_random_module：待1 / 全1**。
  注册/owner源：[src/http/modules/ngx_http_upstream_random_module.c:80](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_upstream_random_module.c#L80)。 文档入口：[xml/en/docs/http/ngx_http_upstream_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_upstream_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_upstream_random`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`random`。

- **nginx / ngx_http_upstream_zone_module：待1 / 全1**。
  注册/owner源：[src/http/modules/ngx_http_upstream_zone_module.c:51](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_upstream_zone_module.c#L51)。 文档入口：[xml/en/docs/http/ngx_http_upstream_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_upstream_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_upstream_zone`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`zone`。

### P02 FastCGI（49项）

- **nginx / ngx_http_fastcgi_module：待49 / 全49**。
  注册/owner源：[src/http/modules/ngx_http_fastcgi_module.c:595](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_fastcgi_module.c#L595)。 文档入口：[xml/en/docs/http/ngx_http_fastcgi_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_fastcgi_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_fastcgi_pass`、`ngx_conf_set_str_slot`、`ngx_http_fastcgi_split_path_info`、`ngx_http_fastcgi_store`、`ngx_conf_set_access_slot`、`ngx_conf_set_flag_slot`、`ngx_http_upstream_bind_set_slot`、`ngx_conf_set_msec_slot`、`ngx_conf_set_size_slot`、`ngx_conf_set_bufs_slot`、`ngx_http_set_complex_value_size_slot`、`ngx_http_fastcgi_cache`、`ngx_http_fastcgi_cache_key`、`ngx_http_file_cache_set_slot`、`ngx_http_set_predicate_slot`、`ngx_http_file_cache_valid_set_slot`、`ngx_conf_set_num_slot`、`ngx_conf_set_off_slot`、`ngx_conf_set_bitmask_slot`、`ngx_conf_set_path_slot`、`ngx_http_upstream_param_set_slot`、`ngx_conf_set_str_array_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`fastcgi_pass`、`fastcgi_index`、`fastcgi_split_path_info`、`fastcgi_store`、`fastcgi_store_access`、`fastcgi_buffering`、`fastcgi_request_buffering`、`fastcgi_ignore_client_abort`、`fastcgi_bind`、`fastcgi_socket_keepalive`、`fastcgi_connect_timeout`、`fastcgi_send_timeout`、`fastcgi_send_lowat`、`fastcgi_buffer_size`、`fastcgi_pass_request_headers`、`fastcgi_pass_request_body`、`fastcgi_intercept_errors`、`fastcgi_read_timeout`、`fastcgi_buffers`、`fastcgi_busy_buffers_size`、`fastcgi_force_ranges`、`fastcgi_limit_rate`、`fastcgi_cache`、`fastcgi_cache_key`、`fastcgi_cache_path`、`fastcgi_cache_bypass`、`fastcgi_no_cache`、`fastcgi_cache_valid`、`fastcgi_cache_min_uses`、`fastcgi_cache_max_range_offset`、`fastcgi_cache_use_stale`、`fastcgi_cache_methods`、`fastcgi_cache_lock`、`fastcgi_cache_lock_timeout`、`fastcgi_cache_lock_age`、`fastcgi_cache_revalidate`、`fastcgi_cache_background_update`、`fastcgi_temp_path`、`fastcgi_max_temp_file_size`、`fastcgi_temp_file_write_size`、`fastcgi_next_upstream`、`fastcgi_next_upstream_tries`、`fastcgi_next_upstream_timeout`、`fastcgi_param`、`fastcgi_pass_header`、`fastcgi_hide_header`、`fastcgi_ignore_headers`、`fastcgi_catch_stderr`、`fastcgi_keep_conn`。

### P03 SCGI（44项）

- **nginx / ngx_http_scgi_module：待44 / 全44**。
  注册/owner源：[src/http/modules/ngx_http_scgi_module.c:429](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_scgi_module.c#L429)。 文档入口：[xml/en/docs/http/ngx_http_scgi_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_scgi_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_scgi_pass`、`ngx_http_scgi_store`、`ngx_conf_set_access_slot`、`ngx_conf_set_flag_slot`、`ngx_http_upstream_bind_set_slot`、`ngx_conf_set_msec_slot`、`ngx_conf_set_size_slot`、`ngx_conf_set_bufs_slot`、`ngx_http_set_complex_value_size_slot`、`ngx_http_scgi_cache`、`ngx_http_scgi_cache_key`、`ngx_http_file_cache_set_slot`、`ngx_http_set_predicate_slot`、`ngx_http_file_cache_valid_set_slot`、`ngx_conf_set_num_slot`、`ngx_conf_set_off_slot`、`ngx_conf_set_bitmask_slot`、`ngx_conf_set_path_slot`、`ngx_http_upstream_param_set_slot`、`ngx_conf_set_str_array_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`scgi_pass`、`scgi_store`、`scgi_store_access`、`scgi_buffering`、`scgi_request_buffering`、`scgi_ignore_client_abort`、`scgi_bind`、`scgi_socket_keepalive`、`scgi_connect_timeout`、`scgi_send_timeout`、`scgi_buffer_size`、`scgi_pass_request_headers`、`scgi_pass_request_body`、`scgi_intercept_errors`、`scgi_read_timeout`、`scgi_buffers`、`scgi_busy_buffers_size`、`scgi_force_ranges`、`scgi_limit_rate`、`scgi_cache`、`scgi_cache_key`、`scgi_cache_path`、`scgi_cache_bypass`、`scgi_no_cache`、`scgi_cache_valid`、`scgi_cache_min_uses`、`scgi_cache_max_range_offset`、`scgi_cache_use_stale`、`scgi_cache_methods`、`scgi_cache_lock`、`scgi_cache_lock_timeout`、`scgi_cache_lock_age`、`scgi_cache_revalidate`、`scgi_cache_background_update`、`scgi_temp_path`、`scgi_max_temp_file_size`、`scgi_temp_file_write_size`、`scgi_next_upstream`、`scgi_next_upstream_tries`、`scgi_next_upstream_timeout`、`scgi_param`、`scgi_pass_header`、`scgi_hide_header`、`scgi_ignore_headers`。

### P04 uWSGI（60项）

- **nginx / ngx_http_uwsgi_module：待60 / 全60**。
  注册/owner源：[src/http/modules/ngx_http_uwsgi_module.c:597](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_uwsgi_module.c#L597)。 文档入口：[xml/en/docs/http/ngx_http_uwsgi_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_uwsgi_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_uwsgi_pass`、`ngx_conf_set_num_slot`、`ngx_http_uwsgi_store`、`ngx_conf_set_access_slot`、`ngx_conf_set_flag_slot`、`ngx_http_upstream_bind_set_slot`、`ngx_conf_set_msec_slot`、`ngx_conf_set_size_slot`、`ngx_conf_set_bufs_slot`、`ngx_http_set_complex_value_size_slot`、`ngx_http_uwsgi_cache`、`ngx_http_uwsgi_cache_key`、`ngx_http_file_cache_set_slot`、`ngx_http_set_predicate_slot`、`ngx_http_file_cache_valid_set_slot`、`ngx_conf_set_off_slot`、`ngx_conf_set_bitmask_slot`、`ngx_conf_set_path_slot`、`ngx_http_upstream_param_set_slot`、`ngx_conf_set_str_slot`、`ngx_conf_set_str_array_slot`、`ngx_http_set_complex_value_slot`、`ngx_http_set_complex_value_zero_slot`、`ngx_http_uwsgi_ssl_password_file`、`ngx_conf_set_keyval_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。 XML专项：`uwsgi_string`。
  **完整待写身份名称**：`uwsgi_pass`、`uwsgi_modifier1`、`uwsgi_modifier2`、`uwsgi_store`、`uwsgi_store_access`、`uwsgi_buffering`、`uwsgi_request_buffering`、`uwsgi_ignore_client_abort`、`uwsgi_bind`、`uwsgi_socket_keepalive`、`uwsgi_connect_timeout`、`uwsgi_send_timeout`、`uwsgi_buffer_size`、`uwsgi_pass_request_headers`、`uwsgi_pass_request_body`、`uwsgi_intercept_errors`、`uwsgi_read_timeout`、`uwsgi_buffers`、`uwsgi_busy_buffers_size`、`uwsgi_force_ranges`、`uwsgi_limit_rate`、`uwsgi_cache`、`uwsgi_cache_key`、`uwsgi_cache_path`、`uwsgi_cache_bypass`、`uwsgi_no_cache`、`uwsgi_cache_valid`、`uwsgi_cache_min_uses`、`uwsgi_cache_max_range_offset`、`uwsgi_cache_use_stale`、`uwsgi_cache_methods`、`uwsgi_cache_lock`、`uwsgi_cache_lock_timeout`、`uwsgi_cache_lock_age`、`uwsgi_cache_revalidate`、`uwsgi_cache_background_update`、`uwsgi_temp_path`、`uwsgi_max_temp_file_size`、`uwsgi_temp_file_write_size`、`uwsgi_next_upstream`、`uwsgi_next_upstream_tries`、`uwsgi_next_upstream_timeout`、`uwsgi_param`、`uwsgi_string`、`uwsgi_pass_header`、`uwsgi_hide_header`、`uwsgi_ignore_headers`、`uwsgi_ssl_session_reuse`、`uwsgi_ssl_protocols`、`uwsgi_ssl_ciphers`、`uwsgi_ssl_name`、`uwsgi_ssl_server_name`、`uwsgi_ssl_verify`、`uwsgi_ssl_verify_depth`、`uwsgi_ssl_trusted_certificate`、`uwsgi_ssl_crl`、`uwsgi_ssl_certificate`、`uwsgi_ssl_certificate_key`、`uwsgi_ssl_password_file`、`uwsgi_ssl_conf_command`。

### P05 gRPC 与内置 memcached（39项）

- **nginx / ngx_http_grpc_module：待28 / 全28**。
  注册/owner源：[src/http/modules/ngx_http_grpc_module.c:475](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_grpc_module.c#L475)。 文档入口：[xml/en/docs/http/ngx_http_grpc_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_grpc_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_grpc_pass`、`ngx_http_upstream_bind_set_slot`、`ngx_conf_set_flag_slot`、`ngx_conf_set_msec_slot`、`ngx_conf_set_size_slot`、`ngx_conf_set_bitmask_slot`、`ngx_conf_set_num_slot`、`ngx_conf_set_keyval_slot`、`ngx_conf_set_str_array_slot`、`ngx_conf_set_str_slot`、`ngx_http_set_complex_value_slot`、`ngx_http_set_complex_value_zero_slot`、`ngx_http_grpc_ssl_password_file`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`grpc_pass`、`grpc_bind`、`grpc_socket_keepalive`、`grpc_connect_timeout`、`grpc_send_timeout`、`grpc_intercept_errors`、`grpc_buffer_size`、`grpc_read_timeout`、`grpc_next_upstream`、`grpc_next_upstream_tries`、`grpc_next_upstream_timeout`、`grpc_set_header`、`grpc_pass_header`、`grpc_hide_header`、`grpc_ignore_headers`、`grpc_ssl_session_reuse`、`grpc_ssl_protocols`、`grpc_ssl_ciphers`、`grpc_ssl_name`、`grpc_ssl_server_name`、`grpc_ssl_verify`、`grpc_ssl_verify_depth`、`grpc_ssl_trusted_certificate`、`grpc_ssl_crl`、`grpc_ssl_certificate`、`grpc_ssl_certificate_key`、`grpc_ssl_password_file`、`grpc_ssl_conf_command`。

- **nginx / ngx_http_memcached_module：待11 / 全11**。
  注册/owner源：[src/http/modules/ngx_http_memcached_module.c:152](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_memcached_module.c#L152)。 文档入口：[xml/en/docs/http/ngx_http_memcached_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_memcached_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_memcached_pass`、`ngx_http_upstream_bind_set_slot`、`ngx_conf_set_flag_slot`、`ngx_conf_set_msec_slot`、`ngx_conf_set_size_slot`、`ngx_conf_set_bitmask_slot`、`ngx_conf_set_num_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`memcached_pass`、`memcached_bind`、`memcached_socket_keepalive`、`memcached_connect_timeout`、`memcached_send_timeout`、`memcached_buffer_size`、`memcached_read_timeout`、`memcached_next_upstream`、`memcached_next_upstream_tries`、`memcached_next_upstream_timeout`、`memcached_gzip_flag`。

### P06 HTTP 重写、变量与请求方法（16项）

- **nginx / ngx_http_rewrite_module：待7 / 全7**。
  注册/owner源：[src/http/modules/ngx_http_rewrite_module.c:120](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_rewrite_module.c#L120)。 文档入口：[xml/en/docs/http/ngx_http_rewrite_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_rewrite_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_rewrite`、`ngx_http_rewrite_return`、`ngx_http_rewrite_break`、`ngx_http_rewrite_if`、`ngx_http_rewrite_set`、`ngx_conf_set_flag_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`rewrite`、`return`、`break`、`if`、`set`、`rewrite_log`、`uninitialized_variable_warn`。

- **nginx / ngx_http_map_module：待3 / 全3**。
  注册/owner源：[src/http/modules/ngx_http_map_module.c:91](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_map_module.c#L91)。 文档入口：[xml/en/docs/http/ngx_http_map_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_map_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_map_block`、`ngx_conf_set_num_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`map`、`map_hash_max_size`、`map_hash_bucket_size`。

- **nginx / ngx_http_geo_module：待1 / 全1**。
  注册/owner源：[src/http/modules/ngx_http_geo_module.c:141](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_geo_module.c#L141)。 文档入口：[xml/en/docs/http/ngx_http_geo_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_geo_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_geo_block`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`geo`。

- **nginx / ngx_http_split_clients_module：待1 / 全1**。
  注册/owner源：[src/http/modules/ngx_http_split_clients_module.c:58](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_split_clients_module.c#L58)。 文档入口：[xml/en/docs/http/ngx_http_split_clients_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_split_clients_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_conf_split_clients_block`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`split_clients`。

- **nginx / ngx_http_secure_link_module：待3 / 全3**。
  注册/owner源：[src/http/modules/ngx_http_secure_link_module.c:79](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_secure_link_module.c#L79)。 文档入口：[xml/en/docs/http/ngx_http_secure_link_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_secure_link_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_set_complex_value_slot`、`ngx_conf_set_str_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`secure_link`、`secure_link_md5`、`secure_link_secret`。

- **ngx_coolkit / ngx_coolkit_module：待1 / 全1**。 固定SHA `462b863babe121b900465b4ec8dfba612d723e9a`。
  注册/owner源：[src/ngx_coolkit_module.c:71](https://github.com/FRiCKLE/ngx_coolkit/blob/462b863babe121b900465b4ec8dfba612d723e9a/src/ngx_coolkit_module.c#L71)。 文档入口：[README](https://github.com/FRiCKLE/ngx_coolkit/blob/462b863babe121b900465b4ec8dfba612d723e9a/README)。
  配置callback入口族（据实际catalog）：`ngx_coolkit_conf_override_method`；slot回调还需核真实offset/post及字段使用处。
  直接patch：此组件无直接patch记录；沿用固定发行处理证据，仍核共享Nginx链。
  **完整待写身份名称**：`override_method`。

### P07 HTTP 限流、子请求与降级（14项）

- **nginx / ngx_http_limit_conn_module：待5 / 全5**。
  注册/owner源：[src/http/modules/ngx_http_limit_conn_module.c:147](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_limit_conn_module.c#L147)。 文档入口：[xml/en/docs/http/ngx_http_limit_conn_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_limit_conn_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_limit_conn_zone`、`ngx_http_limit_conn`、`ngx_conf_set_enum_slot`、`ngx_conf_set_num_slot`、`ngx_conf_set_flag_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`limit_conn_zone`、`limit_conn`、`limit_conn_log_level`、`limit_conn_status`、`limit_conn_dry_run`。

- **nginx / ngx_http_limit_req_module：待5 / 全5**。
  注册/owner源：[src/http/modules/ngx_http_limit_req_module.c:160](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_limit_req_module.c#L160)。 文档入口：[xml/en/docs/http/ngx_http_limit_req_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_limit_req_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_limit_req_zone`、`ngx_http_limit_req`、`ngx_conf_set_enum_slot`、`ngx_conf_set_num_slot`、`ngx_conf_set_flag_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`limit_req_zone`、`limit_req`、`limit_req_log_level`、`limit_req_status`、`limit_req_dry_run`。

- **nginx / ngx_http_mirror_module：待2 / 全2**。
  注册/owner源：[src/http/modules/ngx_http_mirror_module.c:69](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_mirror_module.c#L69)。 文档入口：[xml/en/docs/http/ngx_http_mirror_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_mirror_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_mirror`、`ngx_conf_set_flag_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`mirror`、`mirror_request_body`。

- **nginx / ngx_http_degradation_module：待2 / 全2**。
  注册/owner源：[src/http/modules/ngx_http_degradation_module.c:74](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_degradation_module.c#L74)。 文档入口：无对应模块XML。
  配置callback入口族（据实际catalog）：`ngx_http_degradation`、`ngx_conf_set_enum_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。 XML专项：`degradation`、`degrade`。
  **完整待写身份名称**：`degradation`、`degrade`。

### P08 HTTP 文件、目录与媒体（17项）

- **nginx / ngx_http_autoindex_module：待4 / 全4**。
  注册/owner源：[src/http/modules/ngx_http_autoindex_module.c:136](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_autoindex_module.c#L136)。 文档入口：[xml/en/docs/http/ngx_http_autoindex_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_autoindex_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_conf_set_flag_slot`、`ngx_conf_set_enum_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`autoindex`、`autoindex_format`、`autoindex_localtime`、`autoindex_exact_size`。

- **nginx / ngx_http_dav_module：待4 / 全4**。
  注册/owner源：[src/http/modules/ngx_http_dav_module.c:126](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_dav_module.c#L126)。 文档入口：[xml/en/docs/http/ngx_http_dav_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_dav_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_conf_set_bitmask_slot`、`ngx_conf_set_flag_slot`、`ngx_conf_set_num_slot`、`ngx_conf_set_access_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`dav_methods`、`create_full_put_path`、`min_delete_depth`、`dav_access`。

- **nginx / ngx_http_empty_gif_module：待1 / 全1**。
  注册/owner源：[src/http/modules/ngx_http_empty_gif_module.c:93](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_empty_gif_module.c#L93)。 文档入口：[xml/en/docs/http/ngx_http_empty_gif_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_empty_gif_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_empty_gif`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`empty_gif`。

- **nginx / ngx_http_flv_module：待1 / 全1**。
  注册/owner源：[src/http/modules/ngx_http_flv_module.c:45](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_flv_module.c#L45)。 文档入口：[xml/en/docs/http/ngx_http_flv_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_flv_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_flv`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`flv`。

- **nginx / ngx_http_mp4_module：待4 / 全4**。
  注册/owner源：[src/http/modules/ngx_http_mp4_module.c:412](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_mp4_module.c#L412)。 文档入口：[xml/en/docs/http/ngx_http_mp4_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_mp4_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_mp4`、`ngx_conf_set_size_slot`、`ngx_conf_set_flag_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`mp4`、`mp4_buffer_size`、`mp4_max_buffer_size`、`mp4_start_key_frame`。

- **nginx / ngx_http_index_module：待1 / 全1**。
  注册/owner源：[src/http/modules/ngx_http_index_module.c:70](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_index_module.c#L70)。 文档入口：[xml/en/docs/http/ngx_http_index_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_index_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_index_set_index`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`index`。

- **nginx / ngx_http_random_index_module：待1 / 全1**。
  注册/owner源：[src/http/modules/ngx_http_random_index_module.c:57](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_random_index_module.c#L57)。 文档入口：[xml/en/docs/http/ngx_http_random_index_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_random_index_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_conf_set_flag_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`random_index`。

- **nginx / ngx_http_try_files_module：待1 / 全1**。
  注册/owner源：[src/http/modules/ngx_http_try_files_module.c:62](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_try_files_module.c#L62)。 文档入口：[xml/en/docs/http/ngx_http_core_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_core_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_try_files`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`try_files`。

### P09 压缩、切片与输出缓冲（14项）

- **nginx / ngx_http_gzip_filter_module：待9 / 全9**。
  注册/owner源：[src/http/modules/ngx_http_gzip_filter_module.c:196](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_gzip_filter_module.c#L196)。 文档入口：[xml/en/docs/http/ngx_http_gzip_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_gzip_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_conf_set_flag_slot`、`ngx_conf_set_bufs_slot`、`ngx_http_types_slot`、`ngx_conf_set_num_slot`、`ngx_conf_set_size_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。 XML专项：`gzip_window`、`gzip_hash`、`postpone_gzipping`、`gzip_no_buffer`。
  **完整待写身份名称**：`gzip`、`gzip_buffers`、`gzip_types`、`gzip_comp_level`、`gzip_window`、`gzip_hash`、`postpone_gzipping`、`gzip_no_buffer`、`gzip_min_length`。

- **nginx / ngx_http_gunzip_filter_module：待2 / 全2**。
  注册/owner源：[src/http/modules/ngx_http_gunzip_filter_module.c:100](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_gunzip_filter_module.c#L100)。 文档入口：[xml/en/docs/http/ngx_http_gunzip_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_gunzip_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_conf_set_flag_slot`、`ngx_conf_set_bufs_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`gunzip`、`gunzip_buffers`。

- **nginx / ngx_http_gzip_static_module：待1 / 全1**。
  注册/owner源：[src/http/modules/ngx_http_gzip_static_module.c:66](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_gzip_static_module.c#L66)。 文档入口：[xml/en/docs/http/ngx_http_gzip_static_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_gzip_static_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_conf_set_enum_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`gzip_static`。

- **nginx / ngx_http_slice_filter_module：待1 / 全1**。
  注册/owner源：[src/http/modules/ngx_http_slice_filter_module.c:79](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_slice_filter_module.c#L79)。 文档入口：[xml/en/docs/http/ngx_http_slice_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_slice_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_conf_set_size_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`slice`。

- **nginx / ngx_http_copy_filter_module：待1 / 全1**。
  注册/owner源：[src/http/ngx_http_copy_filter_module.c:63](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/ngx_http_copy_filter_module.c#L63)。 文档入口：[xml/en/docs/http/ngx_http_core_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_core_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_conf_set_bufs_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`output_buffers`。

### P10 响应过滤与身份标记（35项）

- **nginx / ngx_http_addition_filter_module：待3 / 全3**。
  注册/owner源：[src/http/modules/ngx_http_addition_filter_module.c:75](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_addition_filter_module.c#L75)。 文档入口：[xml/en/docs/http/ngx_http_addition_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_addition_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_conf_set_str_slot`、`ngx_http_types_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`add_before_body`、`add_after_body`、`addition_types`。

- **nginx / ngx_http_charset_filter_module：待5 / 全5**。
  注册/owner源：[src/http/modules/ngx_http_charset_filter_module.c:196](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_charset_filter_module.c#L196)。 文档入口：[xml/en/docs/http/ngx_http_charset_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_charset_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_set_charset_slot`、`ngx_conf_set_flag_slot`、`ngx_http_types_slot`、`ngx_http_charset_map_block`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`charset`、`source_charset`、`override_charset`、`charset_types`、`charset_map`。

- **nginx / ngx_http_headers_filter_module：待3 / 全3**。
  注册/owner源：[src/http/modules/ngx_http_headers_filter_module.c:145](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_headers_filter_module.c#L145)。 文档入口：[xml/en/docs/http/ngx_http_headers_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_headers_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_headers_expires`、`ngx_http_headers_add`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`expires`、`add_header`、`add_trailer`。

- **nginx / ngx_http_sub_filter_module：待4 / 全4**。
  注册/owner源：[src/http/modules/ngx_http_sub_filter_module.c:150](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_sub_filter_module.c#L150)。 文档入口：[xml/en/docs/http/ngx_http_sub_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_sub_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_sub_filter`、`ngx_http_types_slot`、`ngx_conf_set_flag_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`sub_filter`、`sub_filter_types`、`sub_filter_once`、`sub_filter_last_modified`。

- **nginx / ngx_http_ssi_filter_module：待7 / 全7**。
  注册/owner源：[src/http/modules/ngx_http_ssi_filter_module.c:193](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_ssi_filter_module.c#L193)。 文档入口：[xml/en/docs/http/ngx_http_ssi_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_ssi_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_conf_set_flag_slot`、`ngx_conf_set_size_slot`、`ngx_http_types_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。 XML专项：`ssi_ignore_recycled_buffers`。
  **完整待写身份名称**：`ssi`、`ssi_silent_errors`、`ssi_ignore_recycled_buffers`、`ssi_min_file_chunk`、`ssi_value_length`、`ssi_types`、`ssi_last_modified`。

- **nginx / ngx_http_userid_filter_module：待9 / 全9**。
  注册/owner源：[src/http/modules/ngx_http_userid_filter_module.c:204](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_userid_filter_module.c#L204)。 文档入口：[xml/en/docs/http/ngx_http_userid_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_userid_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_conf_set_enum_slot`、`ngx_conf_set_num_slot`、`ngx_conf_set_str_slot`、`ngx_http_userid_expires`、`ngx_conf_set_bitmask_slot`、`ngx_http_userid_mark`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`userid`、`userid_service`、`userid_name`、`userid_domain`、`userid_path`、`userid_expires`、`userid_flags`、`userid_p3p`、`userid_mark`。

- **nginx / ngx_http_browser_module：待4 / 全4**。
  注册/owner源：[src/http/modules/ngx_http_browser_module.c:124](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_browser_module.c#L124)。 文档入口：[xml/en/docs/http/ngx_http_browser_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_browser_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_modern_browser`、`ngx_http_ancient_browser`、`ngx_http_modern_browser_value`、`ngx_http_ancient_browser_value`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`modern_browser`、`ancient_browser`、`modern_browser_value`、`ancient_browser_value`。

### P11 可选库与嵌入式 Perl（22项）

- **nginx / ngx_http_image_filter_module：待7 / 全7**。
  注册/owner源：[src/http/modules/ngx_http_image_filter_module.c:192](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_image_filter_module.c#L192)。 文档入口：[xml/en/docs/http/ngx_http_image_filter_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_image_filter_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_image_filter`、`ngx_http_image_filter_jpeg_quality`、`ngx_http_image_filter_webp_quality`、`ngx_http_image_filter_sharpen`、`ngx_conf_set_flag_slot`、`ngx_conf_set_size_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`image_filter`、`image_filter_jpeg_quality`、`image_filter_webp_quality`、`image_filter_sharpen`、`image_filter_transparency`、`image_filter_interlace`、`image_filter_buffer`。

- **nginx / ngx_http_xslt_filter_module：待6 / 全6**。
  注册/owner源：[src/http/modules/ngx_http_xslt_filter_module.c:181](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_xslt_filter_module.c#L181)。 文档入口：[xml/en/docs/http/ngx_http_xslt_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_xslt_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_xslt_entities`、`ngx_http_xslt_stylesheet`、`ngx_http_xslt_param`、`ngx_http_types_slot`、`ngx_conf_set_flag_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`xml_entities`、`xslt_stylesheet`、`xslt_param`、`xslt_string_param`、`xslt_types`、`xslt_last_modified`。

- **nginx / ngx_http_perl_module：待4 / 全4**。
  注册/owner源：[src/http/modules/perl/ngx_http_perl_module.c:116](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/perl/ngx_http_perl_module.c#L116)。 文档入口：[xml/en/docs/http/ngx_http_perl_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_perl_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_conf_set_str_array_slot`、`ngx_http_perl`、`ngx_http_perl_set`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`perl_modules`、`perl_require`、`perl`、`perl_set`。

- **nginx / ngx_http_geoip_module：待5 / 全5**。
  注册/owner源：[src/http/modules/ngx_http_geoip_module.c:153](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_geoip_module.c#L153)。 文档入口：[xml/en/docs/http/ngx_http_geoip_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_geoip_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_geoip_country`、`ngx_http_geoip_org`、`ngx_http_geoip_city`、`ngx_http_geoip_proxy`、`ngx_conf_set_flag_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`geoip_country`、`geoip_org`、`geoip_city`、`geoip_proxy`、`geoip_proxy_recursive`。

### P12 日志与状态（6项）

- **nginx / ngx_http_log_module：待3 / 全4**。
  注册/owner源：[src/http/modules/ngx_http_log_module.c:208](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_log_module.c#L208)。 文档入口：[xml/en/docs/http/ngx_http_log_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_log_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_log_set_format`、`ngx_http_log_set_log`、`ngx_http_log_open_file_cache`；slot回调还需核真实offset/post及字段使用处。
  直接patch：[patches/nginx-1.27.1-log_escape_non_ascii.patch](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/patches/nginx-1.27.1-log_escape_non_ascii.patch)。
  已有、此次不生产：`log_escape_non_ascii`。
  **完整待写身份名称**：`log_format`、`access_log`、`open_log_file_cache`。

- **nginx / ngx_stream_log_module：待2 / 全3**。
  注册/owner源：[src/stream/ngx_stream_log_module.c:184](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_log_module.c#L184)。 文档入口：[xml/en/docs/stream/ngx_stream_log_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/stream/ngx_stream_log_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_stream_log_set_format`、`ngx_stream_log_open_file_cache`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  已有、此次不生产：`access_log`。
  **完整待写身份名称**：`log_format`、`open_log_file_cache`。

- **nginx / ngx_http_stub_status_module：待1 / 全1**。
  注册/owner源：[src/http/modules/ngx_http_stub_status_module.c:49](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_stub_status_module.c#L49)。 文档入口：[xml/en/docs/http/ngx_http_stub_status_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_stub_status_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_http_set_stub_status`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`stub_status`。

### P13 HTTP、stream、mail TLS（68项）

- **nginx / ngx_http_ssl_module：待28 / 全28**。
  注册/owner源：[src/http/modules/ngx_http_ssl_module.c:312](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_ssl_module.c#L312)。 文档入口：[xml/en/docs/http/ngx_http_ssl_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_ssl_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_conf_set_str_array_slot`、`ngx_http_ssl_password_file`、`ngx_conf_set_str_slot`、`ngx_conf_set_bitmask_slot`、`ngx_conf_set_size_slot`、`ngx_conf_set_enum_slot`、`ngx_conf_set_num_slot`、`ngx_conf_set_flag_slot`、`ngx_http_ssl_session_cache`、`ngx_conf_set_sec_slot`、`ngx_http_ssl_ocsp_cache`、`ngx_conf_set_keyval_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`ssl_certificate`、`ssl_certificate_key`、`ssl_password_file`、`ssl_dhparam`、`ssl_ecdh_curve`、`ssl_protocols`、`ssl_ciphers`、`ssl_buffer_size`、`ssl_verify_client`、`ssl_verify_depth`、`ssl_client_certificate`、`ssl_trusted_certificate`、`ssl_prefer_server_ciphers`、`ssl_session_cache`、`ssl_session_tickets`、`ssl_session_ticket_key`、`ssl_session_timeout`、`ssl_crl`、`ssl_ocsp`、`ssl_ocsp_responder`、`ssl_ocsp_cache`、`ssl_stapling`、`ssl_stapling_file`、`ssl_stapling_responder`、`ssl_stapling_verify`、`ssl_early_data`、`ssl_conf_command`、`ssl_reject_handshake`。

- **nginx / ngx_stream_ssl_module：待21 / 全21**。
  注册/owner源：[src/stream/ngx_stream_ssl_module.c:252](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_ssl_module.c#L252)。 文档入口：[xml/en/docs/stream/ngx_stream_ssl_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/stream/ngx_stream_ssl_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_conf_set_msec_slot`、`ngx_conf_set_str_array_slot`、`ngx_stream_ssl_password_file`、`ngx_conf_set_str_slot`、`ngx_conf_set_bitmask_slot`、`ngx_conf_set_enum_slot`、`ngx_conf_set_num_slot`、`ngx_conf_set_flag_slot`、`ngx_stream_ssl_session_cache`、`ngx_conf_set_sec_slot`、`ngx_conf_set_keyval_slot`、`ngx_stream_ssl_alpn`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`ssl_handshake_timeout`、`ssl_certificate`、`ssl_certificate_key`、`ssl_password_file`、`ssl_dhparam`、`ssl_ecdh_curve`、`ssl_protocols`、`ssl_ciphers`、`ssl_verify_client`、`ssl_verify_depth`、`ssl_client_certificate`、`ssl_trusted_certificate`、`ssl_prefer_server_ciphers`、`ssl_session_cache`、`ssl_session_tickets`、`ssl_session_ticket_key`、`ssl_session_timeout`、`ssl_crl`、`ssl_conf_command`、`ssl_reject_handshake`、`ssl_alpn`。

- **nginx / ngx_mail_ssl_module：待19 / 全19**。
  注册/owner源：[src/mail/ngx_mail_ssl_module.c:220](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/mail/ngx_mail_ssl_module.c#L220)。 文档入口：[xml/en/docs/mail/ngx_mail_ssl_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/mail/ngx_mail_ssl_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_mail_ssl_starttls`、`ngx_conf_set_str_array_slot`、`ngx_mail_ssl_password_file`、`ngx_conf_set_str_slot`、`ngx_conf_set_bitmask_slot`、`ngx_conf_set_flag_slot`、`ngx_mail_ssl_session_cache`、`ngx_conf_set_sec_slot`、`ngx_conf_set_enum_slot`、`ngx_conf_set_num_slot`、`ngx_conf_set_keyval_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`starttls`、`ssl_certificate`、`ssl_certificate_key`、`ssl_password_file`、`ssl_dhparam`、`ssl_ecdh_curve`、`ssl_protocols`、`ssl_ciphers`、`ssl_prefer_server_ciphers`、`ssl_session_cache`、`ssl_session_tickets`、`ssl_session_ticket_key`、`ssl_session_timeout`、`ssl_verify_client`、`ssl_verify_depth`、`ssl_client_certificate`、`ssl_trusted_certificate`、`ssl_crl`、`ssl_conf_command`。

### P14 HTTP/2、HTTP/3 与 TLS 预读（24项）

- **nginx / ngx_http_v2_module：待15 / 全15**。
  注册/owner源：[src/http/v2/ngx_http_v2_module.c:200](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/v2/ngx_http_v2_module.c#L200)。 文档入口：[xml/en/docs/http/ngx_http_v2_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_v2_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_conf_set_flag_slot`、`ngx_conf_set_size_slot`、`ngx_conf_set_num_slot`、`ngx_http_v2_obsolete`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。 XML专项：`http2_pool_size`、`http2_streams_index_size`。
  **完整待写身份名称**：`http2`、`http2_recv_buffer_size`、`http2_pool_size`、`http2_max_concurrent_streams`、`http2_max_concurrent_pushes`、`http2_max_requests`、`http2_max_field_size`、`http2_max_header_size`、`http2_body_preread_size`、`http2_streams_index_size`、`http2_recv_timeout`、`http2_idle_timeout`、`http2_chunk_size`、`http2_push_preload`、`http2_push`。

- **nginx / ngx_http_v3_module：待8 / 全8**。
  注册/owner源：[src/http/v3/ngx_http_v3_module.c:100](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/v3/ngx_http_v3_module.c#L100)。 文档入口：[xml/en/docs/http/ngx_http_v3_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_v3_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_conf_set_flag_slot`、`ngx_conf_set_num_slot`、`ngx_conf_set_size_slot`、`ngx_http_quic_host_key`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`http3`、`http3_hq`、`http3_max_concurrent_streams`、`http3_stream_buffer_size`、`quic_retry`、`quic_gso`、`quic_host_key`、`quic_active_connection_id_limit`。

- **nginx / ngx_stream_ssl_preread_module：待1 / 全1**。
  注册/owner源：[src/stream/ngx_stream_ssl_preread_module.c:76](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_ssl_preread_module.c#L76)。 文档入口：[xml/en/docs/stream/ngx_stream_ssl_preread_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/stream/ngx_stream_ssl_preread_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_conf_set_flag_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：[patches/nginx-1.27.1-stream_ssl_preread_no_skip.patch](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/patches/nginx-1.27.1-stream_ssl_preread_no_skip.patch)。
  **完整待写身份名称**：`ssl_preread`。

### P15 stream 配置、变量与访问（29项）

- **nginx / ngx_stream_module：待1 / 全1**。
  注册/owner源：[src/stream/ngx_stream.c:75](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream.c#L75)。 文档入口：[xml/en/docs/stream/ngx_stream_core_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/stream/ngx_stream_core_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_stream_block`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`stream`。

- **nginx / ngx_stream_core_module：待11 / 全14**。
  注册/owner源：[src/stream/ngx_stream_core_module.c:152](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_core_module.c#L152)。 文档入口：[xml/en/docs/stream/ngx_stream_core_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/stream/ngx_stream_core_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_conf_set_num_slot`、`ngx_stream_core_server_name`、`ngx_stream_core_resolver`、`ngx_conf_set_msec_slot`、`ngx_conf_set_flag_slot`、`ngx_conf_set_size_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  已有、此次不生产：`server`、`listen`、`error_log`。
  **完整待写身份名称**：`variables_hash_max_size`、`variables_hash_bucket_size`、`server_names_hash_max_size`、`server_names_hash_bucket_size`、`server_name`、`resolver`、`resolver_timeout`、`proxy_protocol_timeout`、`tcp_nodelay`、`preread_buffer_size`、`preread_timeout`。

- **nginx / ngx_stream_access_module：待2 / 全2**。
  注册/owner源：[src/stream/ngx_stream_access_module.c:102](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_access_module.c#L102)。 文档入口：[xml/en/docs/stream/ngx_stream_access_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/stream/ngx_stream_access_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_stream_access_rule`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`allow`、`deny`。

- **nginx / ngx_stream_geo_module：待1 / 全1**。
  注册/owner源：[src/stream/ngx_stream_geo_module.c:132](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_geo_module.c#L132)。 文档入口：[xml/en/docs/stream/ngx_stream_geo_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/stream/ngx_stream_geo_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_stream_geo_block`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`geo`。

- **nginx / ngx_stream_geoip_module：待3 / 全3**。
  注册/owner源：[src/stream/ngx_stream_geoip_module.c:131](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_geoip_module.c#L131)。 文档入口：[xml/en/docs/stream/ngx_stream_geoip_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/stream/ngx_stream_geoip_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_stream_geoip_country`、`ngx_stream_geoip_org`、`ngx_stream_geoip_city`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`geoip_country`、`geoip_org`、`geoip_city`。

- **nginx / ngx_stream_limit_conn_module：待4 / 全4**。
  注册/owner源：[src/stream/ngx_stream_limit_conn_module.c:131](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_limit_conn_module.c#L131)。 文档入口：[xml/en/docs/stream/ngx_stream_limit_conn_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/stream/ngx_stream_limit_conn_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_stream_limit_conn_zone`、`ngx_stream_limit_conn`、`ngx_conf_set_enum_slot`、`ngx_conf_set_flag_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`limit_conn_zone`、`limit_conn`、`limit_conn_log_level`、`limit_conn_dry_run`。

- **nginx / ngx_stream_map_module：待3 / 全3**。
  注册/owner源：[src/stream/ngx_stream_map_module.c:89](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_map_module.c#L89)。 文档入口：[xml/en/docs/stream/ngx_stream_map_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/stream/ngx_stream_map_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_stream_map_block`、`ngx_conf_set_num_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`map`、`map_hash_max_size`、`map_hash_bucket_size`。

- **nginx / ngx_stream_pass_module：待1 / 全1**。
  注册/owner源：[src/stream/ngx_stream_pass_module.c:55](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_pass_module.c#L55)。 文档入口：[xml/en/docs/stream/ngx_stream_pass_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/stream/ngx_stream_pass_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_stream_pass`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`pass`。

- **nginx / ngx_stream_realip_module：待1 / 全1**。
  注册/owner源：[src/stream/ngx_stream_realip_module.c:68](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_realip_module.c#L68)。 文档入口：[xml/en/docs/stream/ngx_stream_realip_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/stream/ngx_stream_realip_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_stream_realip_from`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`set_real_ip_from`。

- **nginx / ngx_stream_return_module：待1 / 全1**。
  注册/owner源：[src/stream/ngx_stream_return_module.c:55](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_return_module.c#L55)。 文档入口：[xml/en/docs/stream/ngx_stream_return_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/stream/ngx_stream_return_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_stream_return`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`return`。

- **nginx / ngx_stream_split_clients_module：待1 / 全1**。
  注册/owner源：[src/stream/ngx_stream_split_clients_module.c:55](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_split_clients_module.c#L55)。 文档入口：[xml/en/docs/stream/ngx_stream_split_clients_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/stream/ngx_stream_split_clients_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_conf_split_clients_block`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`split_clients`。

### P16 stream upstream 与代理（34项）

- **nginx / ngx_stream_upstream_module：待2 / 全2**。
  注册/owner源：[src/stream/ngx_stream_upstream.c:61](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_upstream.c#L61)。 文档入口：[xml/en/docs/stream/ngx_stream_upstream_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/stream/ngx_stream_upstream_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_stream_upstream`、`ngx_stream_upstream_server`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`upstream`、`server`。

- **nginx / ngx_stream_upstream_hash_module：待1 / 全1**。
  注册/owner源：[src/stream/ngx_stream_upstream_hash_module.c:91](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_upstream_hash_module.c#L91)。 文档入口：[xml/en/docs/stream/ngx_stream_upstream_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/stream/ngx_stream_upstream_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_stream_upstream_hash`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`hash`。

- **nginx / ngx_stream_upstream_least_conn_module：待1 / 全1**。
  注册/owner源：[src/stream/ngx_stream_upstream_least_conn_module.c:46](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_upstream_least_conn_module.c#L46)。 文档入口：[xml/en/docs/stream/ngx_stream_upstream_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/stream/ngx_stream_upstream_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_stream_upstream_least_conn`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`least_conn`。

- **nginx / ngx_stream_upstream_random_module：待1 / 全1**。
  注册/owner源：[src/stream/ngx_stream_upstream_random_module.c:77](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_upstream_random_module.c#L77)。 文档入口：[xml/en/docs/stream/ngx_stream_upstream_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/stream/ngx_stream_upstream_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_stream_upstream_random`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`random`。

- **nginx / ngx_stream_upstream_zone_module：待1 / 全1**。
  注册/owner源：[src/stream/ngx_stream_upstream_zone_module.c:48](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_upstream_zone_module.c#L48)。 文档入口：[xml/en/docs/stream/ngx_stream_upstream_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/stream/ngx_stream_upstream_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_stream_upstream_zone`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`zone`。

- **nginx / ngx_stream_proxy_module：待28 / 全31**。
  注册/owner源：[src/stream/ngx_stream_proxy_module.c:376](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_proxy_module.c#L376)。 文档入口：[xml/en/docs/stream/ngx_stream_proxy_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/stream/ngx_stream_proxy_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_stream_proxy_bind`、`ngx_conf_set_flag_slot`、`ngx_conf_set_size_slot`、`ngx_stream_set_complex_value_size_slot`、`ngx_conf_set_num_slot`、`ngx_conf_set_msec_slot`、`ngx_conf_set_bitmask_slot`、`ngx_conf_set_str_slot`、`ngx_stream_set_complex_value_slot`、`ngx_stream_set_complex_value_zero_slot`、`ngx_stream_proxy_ssl_password_file`、`ngx_conf_set_keyval_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：[patches/nginx-1.27.1-stream_proxy_get_next_upstream_tries.patch](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/patches/nginx-1.27.1-stream_proxy_get_next_upstream_tries.patch)、[patches/nginx-1.27.1-stream_proxy_timeout_fields.patch](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/patches/nginx-1.27.1-stream_proxy_timeout_fields.patch)、[patches/nginx-1.27.1-balancer_status_code.patch](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/patches/nginx-1.27.1-balancer_status_code.patch)。 XML专项：`proxy_downstream_buffer`、`proxy_upstream_buffer`。
  已有、此次不生产：`proxy_connect_timeout`、`proxy_timeout`、`proxy_pass`。
  **完整待写身份名称**：`proxy_bind`、`proxy_socket_keepalive`、`proxy_buffer_size`、`proxy_downstream_buffer`、`proxy_upstream_buffer`、`proxy_upload_rate`、`proxy_download_rate`、`proxy_requests`、`proxy_responses`、`proxy_next_upstream`、`proxy_next_upstream_tries`、`proxy_next_upstream_timeout`、`proxy_protocol`、`proxy_half_close`、`proxy_ssl`、`proxy_ssl_session_reuse`、`proxy_ssl_protocols`、`proxy_ssl_ciphers`、`proxy_ssl_name`、`proxy_ssl_server_name`、`proxy_ssl_verify`、`proxy_ssl_verify_depth`、`proxy_ssl_trusted_certificate`、`proxy_ssl_crl`、`proxy_ssl_certificate`、`proxy_ssl_certificate_key`、`proxy_ssl_password_file`、`proxy_ssl_conf_command`。

### P17 mail 非 TLS 模块（31项）

- **nginx / ngx_mail_module：待1 / 全1**。
  注册/owner源：[src/mail/ngx_mail.c:50](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/mail/ngx_mail.c#L50)。 文档入口：[xml/en/docs/mail/ngx_mail_core_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/mail/ngx_mail_core_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_mail_block`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`mail`。

- **nginx / ngx_mail_auth_http_module：待4 / 全4**。
  注册/owner源：[src/mail/ngx_mail_auth_http_module.c:132](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/mail/ngx_mail_auth_http_module.c#L132)。 文档入口：[xml/en/docs/mail/ngx_mail_auth_http_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/mail/ngx_mail_auth_http_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_mail_auth_http`、`ngx_conf_set_msec_slot`、`ngx_mail_auth_http_header`、`ngx_conf_set_flag_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`auth_http`、`auth_http_timeout`、`auth_http_header`、`auth_http_pass_client_cert`。

- **nginx / ngx_mail_core_module：待9 / 全9**。
  注册/owner源：[src/mail/ngx_mail_core_module.c:110](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/mail/ngx_mail_core_module.c#L110)。 文档入口：[xml/en/docs/mail/ngx_mail_core_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/mail/ngx_mail_core_module.xml)；[xml/en/docs/ngx_core_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/ngx_core_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_mail_core_server`、`ngx_mail_core_listen`、`ngx_mail_core_protocol`、`ngx_conf_set_msec_slot`、`ngx_conf_set_str_slot`、`ngx_mail_core_error_log`、`ngx_mail_core_resolver`、`ngx_conf_set_num_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`server`、`listen`、`protocol`、`timeout`、`server_name`、`error_log`、`resolver`、`resolver_timeout`、`max_errors`。

- **nginx / ngx_mail_imap_module：待3 / 全3**。
  注册/owner源：[src/mail/ngx_mail_imap_module.c:102](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/mail/ngx_mail_imap_module.c#L102)。 文档入口：[xml/en/docs/mail/ngx_mail_imap_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/mail/ngx_mail_imap_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_conf_set_size_slot`、`ngx_mail_capabilities`、`ngx_conf_set_bitmask_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`imap_client_buffer`、`imap_capabilities`、`imap_auth`。

- **nginx / ngx_mail_pop3_module：待2 / 全2**。
  注册/owner源：[src/mail/ngx_mail_pop3_module.c:95](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/mail/ngx_mail_pop3_module.c#L95)。 文档入口：[xml/en/docs/mail/ngx_mail_pop3_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/mail/ngx_mail_pop3_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_mail_capabilities`、`ngx_conf_set_bitmask_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`pop3_capabilities`、`pop3_auth`。

- **nginx / ngx_mail_proxy_module：待7 / 全7**。
  注册/owner源：[src/mail/ngx_mail_proxy_module.c:109](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/mail/ngx_mail_proxy_module.c#L109)。 文档入口：[xml/en/docs/mail/ngx_mail_proxy_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/mail/ngx_mail_proxy_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_conf_set_flag_slot`、`ngx_conf_set_size_slot`、`ngx_conf_set_msec_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。 XML专项：`proxy`。
  **完整待写身份名称**：`proxy`、`proxy_buffer`、`proxy_timeout`、`proxy_pass_error_message`、`xclient`、`proxy_smtp_auth`、`proxy_protocol`。

- **nginx / ngx_mail_realip_module：待1 / 全1**。
  注册/owner源：[src/mail/ngx_mail_realip_module.c:51](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/mail/ngx_mail_realip_module.c#L51)。 文档入口：[xml/en/docs/mail/ngx_mail_realip_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/mail/ngx_mail_realip_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_mail_realip_from`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`set_real_ip_from`。

- **nginx / ngx_mail_smtp_module：待4 / 全4**。
  注册/owner源：[src/mail/ngx_mail_smtp_module.c:102](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/mail/ngx_mail_smtp_module.c#L102)。 文档入口：[xml/en/docs/mail/ngx_mail_smtp_module.xml](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/mail/ngx_mail_smtp_module.xml)。
  配置callback入口族（据实际catalog）：`ngx_conf_set_size_slot`、`ngx_conf_set_msec_slot`、`ngx_mail_capabilities`、`ngx_conf_set_bitmask_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：有效集合未直接命中此注册文件；仍按上节共享链风险核。
  **完整待写身份名称**：`smtp_client_buffer`、`smtp_greeting_delay`、`smtp_capabilities`、`smtp_auth`。

### P18 HTTP Lua（71项）

- **lua-nginx-module / ngx_http_lua_module：待71 / 全79**。 固定SHA `ea09d92adf835e30cab8d79343c7b8266e888128`。
  注册/owner源：[src/ngx_http_lua_module.c:736](https://github.com/openresty/lua-nginx-module/blob/ea09d92adf835e30cab8d79343c7b8266e888128/src/ngx_http_lua_module.c#L736)。 文档入口：[README.markdown](https://github.com/openresty/lua-nginx-module/blob/ea09d92adf835e30cab8d79343c7b8266e888128/README.markdown)。
  配置callback入口族（据实际catalog）：`ngx_conf_set_num_slot`、`ngx_http_lua_capture_error_log`、`ngx_conf_set_flag_slot`、`ngx_http_lua_regex_cache_max_entries`、`ngx_http_lua_regex_match_limit`、`ngx_http_lua_package_cpath`、`ngx_http_lua_package_path`、`ngx_http_lua_init_by_lua_block`、`ngx_http_lua_init_by_lua`、`ngx_http_lua_init_worker_by_lua_block`、`ngx_http_lua_init_worker_by_lua`、`ngx_http_lua_exit_worker_by_lua_block`、`ngx_http_lua_exit_worker_by_lua`、`ngx_http_lua_set_by_lua_block`、`ngx_http_lua_set_by_lua`、`ngx_http_lua_set_by_lua_file`、`ngx_http_lua_server_rewrite_by_lua_block`、`ngx_http_lua_server_rewrite_by_lua`、`ngx_http_lua_rewrite_by_lua`、`ngx_http_lua_rewrite_by_lua_block`、`ngx_http_lua_access_by_lua`、`ngx_http_lua_content_by_lua`、`ngx_http_lua_log_by_lua`、`ngx_http_lua_log_by_lua_block`、`ngx_http_lua_header_filter_by_lua`、`ngx_http_lua_header_filter_by_lua_block`、`ngx_http_lua_body_filter_by_lua`、`ngx_http_lua_body_filter_by_lua_block`、`ngx_http_lua_balancer_by_lua_block`、`ngx_http_lua_balancer_by_lua`、`ngx_http_lua_balancer_keepalive`、`ngx_conf_set_msec_slot`、`ngx_conf_set_size_slot`、`ngx_conf_set_bitmask_slot`、`ngx_conf_set_str_slot`、`ngx_http_lua_ssl_client_hello_by_lua_block`、`ngx_http_lua_ssl_client_hello_by_lua`、`ngx_http_lua_ssl_cert_by_lua_block`、`ngx_http_lua_ssl_cert_by_lua`、`ngx_http_lua_ssl_sess_store_by_lua_block`、`ngx_http_lua_ssl_sess_store_by_lua`、`ngx_http_lua_ssl_sess_fetch_by_lua_block`、`ngx_http_lua_ssl_sess_fetch_by_lua`、`ngx_conf_set_str_array_slot`、`ngx_conf_set_keyval_slot`、`ngx_http_lua_malloc_trim`；slot回调还需核真实offset/post及字段使用处。
  直接patch：此组件无直接patch记录；沿用固定发行处理证据，仍核共享Nginx链。
  已有、此次不生产：`content_by_lua_block`、`access_by_lua_block`、`lua_shared_dict`、`lua_code_cache`、`lua_socket_connect_timeout`、`lua_socket_send_timeout`、`lua_socket_read_timeout`、`lua_load_resty_core`。
  **完整待写身份名称**：`lua_thread_cache_max_entries`、`lua_max_running_timers`、`lua_max_pending_timers`、`lua_capture_error_log`、`lua_sa_restart`、`lua_regex_cache_max_entries`、`lua_regex_match_limit`、`lua_package_cpath`、`lua_package_path`、`lua_need_request_body`、`lua_transform_underscores_in_response_headers`、`lua_socket_log_errors`、`init_by_lua_block`、`init_by_lua`、`init_by_lua_file`、`init_worker_by_lua_block`、`init_worker_by_lua`、`init_worker_by_lua_file`、`exit_worker_by_lua_block`、`exit_worker_by_lua_file`、`set_by_lua_block`、`set_by_lua`、`set_by_lua_file`、`server_rewrite_by_lua_block`、`server_rewrite_by_lua_file`、`rewrite_by_lua`、`rewrite_by_lua_block`、`access_by_lua`、`content_by_lua`、`log_by_lua`、`log_by_lua_block`、`rewrite_by_lua_file`、`rewrite_by_lua_no_postpone`、`access_by_lua_file`、`access_by_lua_no_postpone`、`content_by_lua_file`、`log_by_lua_file`、`header_filter_by_lua`、`header_filter_by_lua_block`、`header_filter_by_lua_file`、`body_filter_by_lua`、`body_filter_by_lua_block`、`body_filter_by_lua_file`、`balancer_by_lua_block`、`balancer_by_lua_file`、`balancer_keepalive`、`lua_socket_keepalive_timeout`、`lua_socket_send_lowat`、`lua_socket_buffer_size`、`lua_socket_pool_size`、`lua_http10_buffering`、`lua_check_client_abort`、`lua_use_default_type`、`lua_ssl_protocols`、`lua_ssl_ciphers`、`ssl_client_hello_by_lua_block`、`ssl_client_hello_by_lua_file`、`ssl_certificate_by_lua_block`、`ssl_certificate_by_lua_file`、`ssl_session_store_by_lua_block`、`ssl_session_store_by_lua_file`、`ssl_session_fetch_by_lua_block`、`ssl_session_fetch_by_lua_file`、`lua_ssl_verify_depth`、`lua_ssl_certificate`、`lua_ssl_certificate_key`、`lua_ssl_trusted_certificate`、`lua_ssl_crl`、`lua_ssl_conf_command`、`lua_malloc_trim`、`lua_worker_thread_vm_pool_size`。

### P19 stream Lua（49项）

- **stream-lua-nginx-module / ngx_stream_lua_module：待49 / 全50**。 固定SHA `69f0cd762112a6e0cddb07f2b5192e9a65034a93`。
  注册/owner源：[src/ngx_stream_lua_module.c:497](https://github.com/openresty/stream-lua-nginx-module/blob/69f0cd762112a6e0cddb07f2b5192e9a65034a93/src/ngx_stream_lua_module.c#L497)。 文档入口：[README.md](https://github.com/openresty/stream-lua-nginx-module/blob/69f0cd762112a6e0cddb07f2b5192e9a65034a93/README.md)。
  配置callback入口族（据实际catalog）：`ngx_stream_lua_load_resty_core`、`ngx_conf_set_num_slot`、`ngx_stream_lua_shared_dict`、`ngx_conf_set_flag_slot`、`ngx_stream_lua_capture_error_log`、`ngx_stream_lua_package_cpath`、`ngx_stream_lua_package_path`、`ngx_stream_lua_code_cache`、`ngx_stream_lua_init_by_lua_block`、`ngx_stream_lua_init_by_lua`、`ngx_stream_lua_init_worker_by_lua_block`、`ngx_stream_lua_init_worker_by_lua`、`ngx_stream_lua_preread_by_lua`、`ngx_stream_lua_content_by_lua`、`ngx_stream_lua_content_by_lua_block`、`ngx_stream_lua_log_by_lua_block`、`ngx_stream_lua_log_by_lua`、`ngx_stream_lua_balancer_by_lua_block`、`ngx_stream_lua_balancer_by_lua`、`ngx_conf_set_msec_slot`、`ngx_conf_set_size_slot`、`ngx_conf_set_bitmask_slot`、`ngx_conf_set_str_slot`、`ngx_stream_lua_ssl_client_hello_by_lua_block`、`ngx_stream_lua_ssl_client_hello_by_lua`、`ngx_stream_lua_ssl_cert_by_lua_block`、`ngx_stream_lua_ssl_cert_by_lua`、`ngx_conf_set_str_array_slot`、`ngx_conf_set_keyval_slot`、`ngx_stream_lua_malloc_trim`、`ngx_stream_lua_add_variable`；slot回调还需核真实offset/post及字段使用处。
  直接patch：此组件无直接patch记录；沿用固定发行处理证据，仍核共享Nginx链。
  已有、此次不生产：`preread_by_lua_block`。
  **完整待写身份名称**：`lua_load_resty_core`、`lua_max_running_timers`、`lua_max_pending_timers`、`lua_shared_dict`、`lua_sa_restart`、`lua_capture_error_log`、`lua_regex_cache_max_entries`、`lua_regex_match_limit`、`lua_package_cpath`、`lua_package_path`、`lua_code_cache`、`lua_socket_log_errors`、`init_by_lua_block`、`init_by_lua`、`init_by_lua_file`、`init_worker_by_lua_block`、`init_worker_by_lua`、`init_worker_by_lua_file`、`preread_by_lua_file`、`content_by_lua`、`content_by_lua_block`、`content_by_lua_file`、`log_by_lua_block`、`log_by_lua_file`、`preread_by_lua_no_postpone`、`balancer_by_lua_block`、`balancer_by_lua_file`、`lua_socket_keepalive_timeout`、`lua_socket_connect_timeout`、`lua_socket_send_timeout`、`lua_socket_send_lowat`、`lua_socket_buffer_size`、`lua_socket_pool_size`、`lua_socket_read_timeout`、`lua_check_client_abort`、`lua_ssl_protocols`、`lua_ssl_ciphers`、`ssl_client_hello_by_lua_block`、`ssl_client_hello_by_lua_file`、`ssl_certificate_by_lua_block`、`ssl_certificate_by_lua_file`、`lua_ssl_verify_depth`、`lua_ssl_certificate`、`lua_ssl_certificate_key`、`lua_ssl_trusted_certificate`、`lua_ssl_crl`、`lua_ssl_conf_command`、`lua_malloc_trim`、`lua_add_variable`。

### P20 NDK 使用方与变量扩展（44项）

- **ngx_devel_kit / ndk_http_module：待1 / 全1**。 固定SHA `91e30eb05085e7f9762f130cbb883a0e753cf74d`。
  注册片段：[src/ndk_upstream_list.h:6](https://github.com/simplresty/ngx_devel_kit/blob/91e30eb05085e7f9762f130cbb883a0e753cf74d/src/ndk_upstream_list.h#L6)；正式owner：[src/ndk.c:102](https://github.com/simplresty/ngx_devel_kit/blob/91e30eb05085e7f9762f130cbb883a0e753cf74d/src/ndk.c#L102)，数组容器objs/ndk_config.c及条件include沿用已审核证据。文档入口：[docs/upstream/list](https://github.com/simplresty/ngx_devel_kit/blob/91e30eb05085e7f9762f130cbb883a0e753cf74d/docs/upstream/list)。
  配置callback入口族（据实际catalog）：`ndk_upstream_list`；slot回调还需核真实offset/post及字段使用处。
  直接patch：此组件无直接patch记录；沿用固定发行处理证据，仍核共享Nginx链。
  **完整待写身份名称**：`upstream_list`。

- **set-misc-nginx-module / ngx_http_set_misc_module：待29 / 全29**。 固定SHA `31c4ad67bb9e392a734e4e58ea8048e24012311f`。
  注册/owner源：[src/ngx_http_set_misc_module.c:511](https://github.com/openresty/set-misc-nginx-module/blob/31c4ad67bb9e392a734e4e58ea8048e24012311f/src/ngx_http_set_misc_module.c#L511)。 文档入口：[README.markdown](https://github.com/openresty/set-misc-nginx-module/blob/31c4ad67bb9e392a734e4e58ea8048e24012311f/README.markdown)。
  配置callback入口族（据实际catalog）：`ndk_set_var_value`、`ndk_set_var_multi_value`、`ngx_http_set_if_empty`、`ngx_http_set_hashed_upstream`、`ngx_conf_set_flag_slot`、`ngx_http_set_misc_base32_alphabet`、`ngx_http_set_rotate`；slot回调还需核真实offset/post及字段使用处。
  直接patch：此组件无直接patch记录；沿用固定发行处理证据，仍核共享Nginx链。
  **完整待写身份名称**：`set_encode_base64`、`set_decode_base64`、`set_encode_base64url`、`set_decode_base64url`、`set_decode_hex`、`set_encode_hex`、`set_hmac_sha1`、`set_hmac_sha256`、`set_md5`、`set_sha1`、`set_unescape_uri`、`set_escape_uri`、`set_quote_sql_str`、`set_quote_pgsql_str`、`set_quote_json_str`、`set_if_empty`、`set_hashed_upstream`、`set_misc_base32_padding`、`set_base32_padding`、`set_base32_alphabet`、`set_encode_base32`、`set_decode_base32`、`set_local_today`、`set_formatted_gmt_time`、`set_formatted_local_time`、`set_random`、`set_secure_random_alphanum`、`set_secure_random_lcalpha`、`set_rotate`。

- **array-var-nginx-module / ngx_http_array_var_module：待4 / 全4**。 固定SHA `32188f86599b47f7cd34340e5a2985bd9d550bf8`。
  注册/owner源：[src/ngx_http_array_var_module.c:115](https://github.com/openresty/array-var-nginx-module/blob/32188f86599b47f7cd34340e5a2985bd9d550bf8/src/ngx_http_array_var_module.c#L115)。 文档入口：[README.md](https://github.com/openresty/array-var-nginx-module/blob/32188f86599b47f7cd34340e5a2985bd9d550bf8/README.md)。
  配置callback入口族（据实际catalog）：`ngx_http_array_split`、`ngx_http_array_map`、`ngx_http_array_map_op`、`ngx_http_array_join`；slot回调还需核真实offset/post及字段使用处。
  直接patch：此组件无直接patch记录；沿用固定发行处理证据，仍核共享Nginx链。
  **完整待写身份名称**：`array_split`、`array_map`、`array_map_op`、`array_join`。

- **form-input-nginx-module / ngx_http_form_input_module：待2 / 全2**。 固定SHA `43ee690c359c06af7d178379cfc37ebc858d9de2`。
  注册/owner源：[src/ngx_http_form_input_module.c:76](https://github.com/calio/form-input-nginx-module/blob/43ee690c359c06af7d178379cfc37ebc858d9de2/src/ngx_http_form_input_module.c#L76)。 文档入口：[README.md](https://github.com/calio/form-input-nginx-module/blob/43ee690c359c06af7d178379cfc37ebc858d9de2/README.md)。
  配置callback入口族（据实际catalog）：`ngx_http_set_form_input_conf_handler`；slot回调还需核真实offset/post及字段使用处。
  直接patch：此组件无直接patch记录；沿用固定发行处理证据，仍核共享Nginx链。
  **完整待写身份名称**：`set_form_input`、`set_form_input_multi`。

- **iconv-nginx-module / ngx_http_iconv_module：待3 / 全3**。 固定SHA `67d55c7edd3ab0535afa1e55ec8b2cdeb5167a82`。
  注册/owner源：[src/ngx_http_iconv_module.c:99](https://github.com/calio/iconv-nginx-module/blob/67d55c7edd3ab0535afa1e55ec8b2cdeb5167a82/src/ngx_http_iconv_module.c#L99)。 文档入口：[README.markdown](https://github.com/calio/iconv-nginx-module/blob/67d55c7edd3ab0535afa1e55ec8b2cdeb5167a82/README.markdown)。
  配置callback入口族（据实际catalog）：`ngx_http_set_iconv_conf_handler`、`ngx_conf_set_size_slot`、`ngx_http_iconv_conf_handler`；slot回调还需核真实offset/post及字段使用处。
  直接patch：此组件无直接patch记录；沿用固定发行处理证据，仍核共享Nginx链。
  **完整待写身份名称**：`set_iconv`、`iconv_buffer_size`、`iconv_filter`。

- **encrypted-session-nginx-module / ngx_http_encrypted_session_module：待5 / 全5**。 固定SHA `0f81b5728db0ece0f60c72354da69f158dc1d2a7`。
  注册/owner源：[src/ngx_http_encrypted_session_module.c:138](https://github.com/openresty/encrypted-session-nginx-module/blob/0f81b5728db0ece0f60c72354da69f158dc1d2a7/src/ngx_http_encrypted_session_module.c#L138)。 文档入口：[README.md](https://github.com/openresty/encrypted-session-nginx-module/blob/0f81b5728db0ece0f60c72354da69f158dc1d2a7/README.md)。
  配置callback入口族（据实际catalog）：`ngx_http_encrypted_session_key`、`ngx_http_encrypted_session_iv`、`ngx_http_encrypted_session_expires`、`ndk_set_var_value`；slot回调还需核真实offset/post及字段使用处。
  直接patch：此组件无直接patch记录；沿用固定发行处理证据，仍核共享Nginx链。
  **完整待写身份名称**：`encrypted_session_key`、`encrypted_session_iv`、`encrypted_session_expires`、`set_encrypt_session`、`set_decrypt_session`。

### P21 第三方 memc 与 Redis 协议（30项）

- **memc-nginx-module / ngx_http_memc_module：待11 / 全11**。 固定SHA `b889a6fc3e18b784b454e1bc74e5d0b3513a07ce`。
  注册/owner源：[src/ngx_http_memc_module.c:146](https://github.com/openresty/memc-nginx-module/blob/b889a6fc3e18b784b454e1bc74e5d0b3513a07ce/src/ngx_http_memc_module.c#L146)。 文档入口：[README.markdown](https://github.com/openresty/memc-nginx-module/blob/b889a6fc3e18b784b454e1bc74e5d0b3513a07ce/README.markdown)。
  配置callback入口族（据实际catalog）：`ngx_http_memc_cmds_allowed`、`ngx_http_memc_pass`、`ngx_conf_set_msec_slot`、`ngx_conf_set_size_slot`、`ngx_conf_set_bitmask_slot`、`ngx_http_memc_upstream_max_fails_unsupported`、`ngx_http_memc_upstream_fail_timeout_unsupported`、`ngx_conf_set_flag_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：此组件无直接patch记录；沿用固定发行处理证据，仍核共享Nginx链。
  **完整待写身份名称**：`memc_cmds_allowed`、`memc_pass`、`memc_connect_timeout`、`memc_send_timeout`、`memc_read_timeout`、`memc_buffer_size`、`memc_next_upstream`、`memc_upstream_max_fails`、`memc_upstream_fail_timeout`、`memc_flags_to_last_modified`、`memc_ignore_client_abort`。

- **redis-nginx-module / ngx_http_redis_module：待8 / 全8**。 固定SHA `411fef36e130129b670fa7f2672bcad6ab2cbdd3`。
  注册/owner源：[ngx_http_redis_module.c:143](https://github.com/osokin/ngx_http_redis/blob/411fef36e130129b670fa7f2672bcad6ab2cbdd3/ngx_http_redis_module.c#L143)。 文档入口：[README](https://github.com/osokin/ngx_http_redis/blob/411fef36e130129b670fa7f2672bcad6ab2cbdd3/README)。
  配置callback入口族（据实际catalog）：`ngx_http_redis_pass`、`ngx_http_upstream_bind_set_slot`、`ngx_conf_set_msec_slot`、`ngx_conf_set_size_slot`、`ngx_conf_set_bitmask_slot`、`ngx_conf_set_num_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：[patches/ngx_http_redis-0.3.9-variables_in_redis_pass.patch](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/patches/ngx_http_redis-0.3.9-variables_in_redis_pass.patch)、[patches/ngx_http_redis-0.3.9-default_port_fix.patch](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/patches/ngx_http_redis-0.3.9-default_port_fix.patch)、[patches/ngx_http_redis-0.3.9-remove_content_encoding.patch](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/patches/ngx_http_redis-0.3.9-remove_content_encoding.patch)。
  **完整待写身份名称**：`redis_pass`、`redis_bind`、`redis_connect_timeout`、`redis_send_timeout`、`redis_buffer_size`、`redis_read_timeout`、`redis_next_upstream`、`redis_gzip_flag`。

- **redis2-nginx-module / ngx_http_redis2_module：待11 / 全11**。 固定SHA `c989c829a2877132cb100f901e320921250e068d`。
  注册/owner源：[src/ngx_http_redis2_module.c:131](https://github.com/openresty/redis2-nginx-module/blob/c989c829a2877132cb100f901e320921250e068d/src/ngx_http_redis2_module.c#L131)。 文档入口：[README.markdown](https://github.com/openresty/redis2-nginx-module/blob/c989c829a2877132cb100f901e320921250e068d/README.markdown)。
  配置callback入口族（据实际catalog）：`ngx_http_redis2_query`、`ngx_http_redis2_set_complex_value_slot`、`ngx_http_redis2_raw_queries`、`ngx_conf_set_str_slot`、`ngx_http_redis2_pass`、`ngx_http_upstream_bind_set_slot`、`ngx_conf_set_msec_slot`、`ngx_conf_set_size_slot`、`ngx_conf_set_bitmask_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：此组件无直接patch记录；沿用固定发行处理证据，仍核共享Nginx链。
  **完整待写身份名称**：`redis2_query`、`redis2_raw_query`、`redis2_raw_queries`、`redis2_literal_raw_query`、`redis2_pass`、`redis2_bind`、`redis2_connect_timeout`、`redis2_send_timeout`、`redis2_buffer_size`、`redis2_read_timeout`、`redis2_next_upstream`。

### P22 srcache（20项）

- **srcache-nginx-module / ngx_http_srcache_filter_module：待20 / 全20**。 固定SHA `be22ac0dcd9245aadcaca3220da96a0c1a0285a7`。
  注册/owner源：[src/ngx_http_srcache_filter_module.c:231](https://github.com/openresty/srcache-nginx-module/blob/be22ac0dcd9245aadcaca3220da96a0c1a0285a7/src/ngx_http_srcache_filter_module.c#L231)。 文档入口：[README.markdown](https://github.com/openresty/srcache-nginx-module/blob/be22ac0dcd9245aadcaca3220da96a0c1a0285a7/README.markdown)。
  配置callback入口族（据实际catalog）：`ngx_conf_set_size_slot`、`ngx_http_srcache_conf_set_request`、`ngx_http_set_complex_value_slot`、`ngx_http_srcache_store_statuses`、`ngx_conf_set_bitmask_slot`、`ngx_conf_set_flag_slot`、`ngx_conf_set_str_array_slot`、`ngx_conf_set_sec_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：此组件无直接patch记录；沿用固定发行处理证据，仍核共享Nginx链。
  **完整待写身份名称**：`srcache_buffer`、`srcache_fetch`、`srcache_store`、`srcache_store_max_size`、`srcache_fetch_skip`、`srcache_store_skip`、`srcache_store_statuses`、`srcache_methods`、`srcache_request_cache_control`、`srcache_store_private`、`srcache_store_no_store`、`srcache_store_no_cache`、`srcache_response_cache_control`、`srcache_store_hide_header`、`srcache_store_pass_header`、`srcache_store_ranges`、`srcache_ignore_content_encoding`、`srcache_header_buffer_size`、`srcache_max_expire`、`srcache_default_expire`。

### P23 数据库与 RDS 过滤（38项）

- **drizzle-nginx-module / ngx_http_drizzle_module：待12 / 全12**。 固定SHA `fb6cf255d91135e18145a98a93947ead4e703b68`。
  注册/owner源：[src/ngx_http_drizzle_module.c:167](https://github.com/openresty/drizzle-nginx-module/blob/fb6cf255d91135e18145a98a93947ead4e703b68/src/ngx_http_drizzle_module.c#L167)。 文档入口：[README.markdown](https://github.com/openresty/drizzle-nginx-module/blob/fb6cf255d91135e18145a98a93947ead4e703b68/README.markdown)。
  配置callback入口族（据实际catalog）：`ngx_http_upstream_drizzle_server`、`ngx_http_upstream_drizzle_keepalive`、`ngx_http_drizzle_query`、`ngx_http_drizzle_set_complex_value_slot`、`ngx_http_drizzle_pass`、`ngx_conf_set_msec_slot`、`ngx_conf_set_flag_slot`、`ngx_conf_set_size_slot`、`ngx_http_drizzle_enable_status`；slot回调还需核真实offset/post及字段使用处。
  直接patch：此组件无直接patch记录；沿用固定发行处理证据，仍核共享Nginx链。
  **完整待写身份名称**：`drizzle_server`、`drizzle_keepalive`、`drizzle_query`、`drizzle_dbname`、`drizzle_pass`、`drizzle_connect_timeout`、`drizzle_send_query_timeout`、`drizzle_recv_cols_timeout`、`drizzle_recv_rows_timeout`、`drizzle_module_header`、`drizzle_buffer_size`、`drizzle_status`。

- **ngx_postgres / ngx_postgres_module：待10 / 全10**。 固定SHA `681980598529f67fcec5c7448452046764a68429`。
  注册/owner源：[src/ngx_postgres_module.c:161](https://github.com/openresty/ngx_postgres/blob/681980598529f67fcec5c7448452046764a68429/src/ngx_postgres_module.c#L161)。 文档入口：[README.md](https://github.com/openresty/ngx_postgres/blob/681980598529f67fcec5c7448452046764a68429/README.md)。
  配置callback入口族（据实际catalog）：`ngx_postgres_conf_server`、`ngx_postgres_conf_keepalive`、`ngx_postgres_conf_pass`、`ngx_postgres_conf_query`、`ngx_postgres_conf_rewrite`、`ngx_postgres_conf_output`、`ngx_postgres_conf_set`、`ngx_postgres_conf_escape`、`ngx_conf_set_msec_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：此组件无直接patch记录；沿用固定发行处理证据，仍核共享Nginx链。
  **完整待写身份名称**：`postgres_server`、`postgres_keepalive`、`postgres_pass`、`postgres_query`、`postgres_rewrite`、`postgres_output`、`postgres_set`、`postgres_escape`、`postgres_connect_timeout`、`postgres_result_timeout`。

- **rds-json-nginx-module / ngx_http_rds_json_filter_module：待10 / 全10**。 固定SHA `2d7e07f7c39f98bbb2a8b07f4bae4d892f00329d`。
  注册/owner源：[src/ngx_http_rds_json_filter_module.c:170](https://github.com/openresty/rds-json-nginx-module/blob/2d7e07f7c39f98bbb2a8b07f4bae4d892f00329d/src/ngx_http_rds_json_filter_module.c#L170)。 文档入口：[README.md](https://github.com/openresty/rds-json-nginx-module/blob/2d7e07f7c39f98bbb2a8b07f4bae4d892f00329d/README.md)。
  配置callback入口族（据实际catalog）：`ngx_http_rds_json`、`ngx_http_rds_json_root`、`ngx_http_rds_json_success_property`、`ngx_http_rds_json_user_property`、`ngx_http_rds_json_errcode_key`、`ngx_http_rds_json_errstr_key`、`ngx_conf_set_enum_slot`、`ngx_conf_set_str_slot`、`ngx_http_rds_json_ret`、`ngx_conf_set_size_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：此组件无直接patch记录；沿用固定发行处理证据，仍核共享Nginx链。
  **完整待写身份名称**：`rds_json`、`rds_json_root`、`rds_json_success_property`、`rds_json_user_property`、`rds_json_errcode_key`、`rds_json_errstr_key`、`rds_json_format`、`rds_json_content_type`、`rds_json_ret`、`rds_json_buffer_size`。

- **rds-csv-nginx-module / ngx_http_rds_csv_filter_module：待6 / 全6**。 固定SHA `b4095fcb8a866835ddec7ea0c414b8a4af35741a`。
  注册/owner源：[src/ngx_http_rds_csv_filter_module.c:118](https://github.com/openresty/rds-csv-nginx-module/blob/b4095fcb8a866835ddec7ea0c414b8a4af35741a/src/ngx_http_rds_csv_filter_module.c#L118)。 文档入口：[README.md](https://github.com/openresty/rds-csv-nginx-module/blob/b4095fcb8a866835ddec7ea0c414b8a4af35741a/README.md)。
  配置callback入口族（据实际catalog）：`ngx_http_rds_csv`、`ngx_http_rds_csv_row_terminator`、`ngx_http_rds_csv_field_separator`、`ngx_conf_set_flag_slot`、`ngx_conf_set_str_slot`、`ngx_conf_set_size_slot`；slot回调还需核真实offset/post及字段使用处。
  直接patch：此组件无直接patch记录；沿用固定发行处理证据，仍核共享Nginx链。
  **完整待写身份名称**：`rds_csv`、`rds_csv_row_terminator`、`rds_csv_field_separator`、`rds_csv_field_name_header`、`rds_csv_content_type`、`rds_csv_buffer_size`。

## 收口与交接

可立即冻结的第一实施块为P01：nginx七个HTTP upstream owner的11项完整差集，附录已给每个owner的源码和文档入口；P02可接续，P06/P20可作为独立阅读线。主当前占用的三块继续原流水。模块共享阅读材料可以复用，knowledge变更由主汇合，避免多个责任方同时写同一已完身份。

本计划覆盖集合核验：23批、96个component/module组、765个唯一完整身份，无批次间重复；512个Nginx与253个第三方相加一致。最后C02验收取**当前正式catalog全集减当前已审核basic全集**，并合回上述107个占用块的结果；差集全部为空且现有必需字段/证据门禁、完整语义审核和发布身份核对通过才可称全范围基础内容完成。任何必需事实未解仍明确保留该身份缺口，不能为达到数字升格。

默认/继承与补充限制的unknown按需求允许；部门现场样例未到不编造deep或阻塞通用基础内容。此阶段不新增手机/Codex接入/部署/后端/数据库/RAG功能，不编译、运行OpenResty、clone新源或执行生成器。规划仅写本文件，ready后停写；冻结总体计划、C01映射和所有产品/知识文件保持原责任方。

