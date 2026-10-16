# 注册目录正式构建边界研究

状态：ready，可供主线程冻结并实施最小 gate；本文不修改总方案、配置或产品，不宣称 C01 全部完成。

## 结论与研究范围

真正需要防止的是“源码里可提取”被误写成“正式构建会接入”。最短实现路径是将固定构建脚本的已核源码清单绑定到真实 owner，再对其 commands 数组使用现有严格提取；不实现 shell 解释器、通用 C 预处理器或编译探测器。

本次逐项复核的 upstream Nginx 是 **724 条、102 个注册文件、103 个正式 owner**。逐文件以固定 Git blob 读取，核 `ngx_module_t` 的 `NGX_MODULE_V1` 和第三字段 commands，现有严格提取模式对名称、文件/行、owner、flags、callback、post 与 catalog 全量一致。一个文件可有多个 owner/数组，不能以文件去重后只取第一个。16 个第三方组件正式输入合计 **255 条**，均与本次 catalog 正式记录匹配；HTTP Lua 的独立 fake-shm 测试输入必须排除。

这些是本次读到的快照数，不是未来硬编码验收数字。当前 catalog 的 Nginx 已包含两个发行补丁新增注册，故总计726；本研究用 `!distribution_patch` 隔离724上游记录，不把补丁行冒充 upstream 行。

唯一写入：`analysis/REGISTRATION_BUILD_BOUNDARY.md`。没有运行 configure、auto/module、auto/feature、生成器、make 或 OpenResty，没有修改来源 Git。NDK 四组件已审核，本次不重复。research 技能用于固定一手证据与单文件落盘；依用户要求不嵌套 agent。

## 1. 固定来源与正式链接链

Nginx revision：`e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`。正式入口是 [auto/configure](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/configure)，不是假定根目录有 configure。

1. [auto/options](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/options) 定义默认变量并解析 with/without/dynamic 参数；[auto/sources](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/sources) 定义 core/event/平台源码及 owner；[auto/os/conf](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/os/conf)、[auto/unix](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/unix)、[auto/threads](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/threads) 决定平台和特性分支。
2. [auto/modules](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules) 在各条件下同时给出 module name 与 source，再调用 [auto/module](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/module)；外部模块由 NGX_ADDONS/DYNAMIC_ADDONS 循环显式 source 各自 config。不能把任意存在的 config 或 tests config 自动纳入。
3. auto/module 的 YES 将源码和 owner 加入对应集合；ADDON 将正式源码加入 NGX_ADDON_SRCS 并注册 owner；DYNAMIC 保留各模块的 SRCS/SHRD/MODULES/LIBS。只检查 ngx_addon_name 不够：postgres 的 addon 名称与正式 owner 不同。
4. [auto/make:52](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/make#L52) 起汇总静态源码，:259/:290/:332/:362 编译 core/http/mail/stream，:414 编译 addon，:503 起编译/链接动态模块；动态模块不能用静态 nginx 主链接命令是否包含该文件判断失联。
5. auto/modules 末尾与 [auto/make:512](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/make#L512) 生成 module extern/name/pointer/order 集合，引用已核 owner，不生成指令数组。此关系由生成脚本文本正向确定，不靠搜索不到 ngx_string。

**可构建条件 ≠ 上游默认 ≠ OpenResty 默认组合 ≠ 用户实际部署。** auto/options 的 HTTP 默认 YES、MAIL/STREAM 默认 NO，以及 SSL/V2/V3/Perl 等开关均属上游；OpenResty 的覆盖由主线程固定 util/configure 证据判定。本文保留条件，不据本机平台求值；NGX_COMPAT 只设置兼容宏，不能替代模块已选择证据。

## 2. Nginx 724 注册的逐 owner 映射

每行覆盖该 owner 的全部 catalog 注册，数量总和724。源链接落在固定 owner initializer；数组是该 initializer 正式 commands 字段。auto/modules 行号是该段调用 auto/module 的位置，可向上核 name/srcs/条件。条件使用原脚本逻辑，`if :` 为无额外限制。下表为注册源投影；同一构建块附带的帮助源保留在第3节，不因未含指令删出正式清单。C guard 列仅为注册项条件摘要，逐指令仍使用 catalog 原始 compile_guards（含 else 原分支），不能把摘要并集当每条指令条件。

|正式 owner / commands 数组|固定注册源 / owner 行|条数|正式构建关系及条件|注册项 C guard 摘要|
|---|---|---:|---|---|
|ngx_core_module<br>ngx_core_commands|[src/core/nginx.c:167](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/core/nginx.c#L167)|16|auto/sources:6、47 CORE_MODULES / CORE_SRCS → 平台 CORE_SRCS|无额外注册项 guard|
|ngx_conf_module<br>ngx_conf_commands|[src/core/ngx_conf_file.c:32](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/core/ngx_conf_file.c#L32)|1|auto/sources:6、47 CORE_MODULES / CORE_SRCS → 平台 CORE_SRCS|无额外注册项 guard|
|ngx_errlog_module<br>ngx_errlog_commands|[src/core/ngx_log.c:54](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/core/ngx_log.c#L54)|1|auto/sources:6、47 CORE_MODULES / CORE_SRCS → 平台 CORE_SRCS|无额外注册项 guard|
|ngx_regex_module<br>ngx_regex_commands|[src/core/ngx_regex.c:59](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/core/ngx_regex.c#L59)|1|[auto/modules:1390](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1390) if [ $USE_PCRE = YES ]；link=YES|无额外注册项 guard|
|ngx_thread_pool_module<br>ngx_thread_pool_commands|[src/core/ngx_thread_pool.c:83](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/core/ngx_thread_pool.c#L83)|1|auto/sources:187、189；auto/threads：USE_THREADS=YES；auto/modules 的 USE_THREADS 分支加入 owner（Windows 不支持）|无额外注册项 guard|
|ngx_devpoll_module<br>ngx_devpoll_commands|[src/event/modules/ngx_devpoll_module.c:101](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/modules/ngx_devpoll_module.c#L101)|2|auto/sources:115–116；auto/unix /dev/poll probe 成功；或 auto/modules:28 NGX_TEST_BUILD_DEVPOLL=YES|无额外注册项 guard|
|ngx_epoll_module<br>ngx_epoll_commands|[src/event/modules/ngx_epoll_module.c:202](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/modules/ngx_epoll_module.c#L202)|2|auto/sources:121–122；auto/os/linux epoll probe 成功；或 auto/modules 的 NGX_TEST_BUILD_EPOLL=YES|无额外注册项 guard|
|ngx_eventport_module<br>ngx_eventport_commands|[src/event/modules/ngx_eventport_module.c:194](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/modules/ngx_eventport_module.c#L194)|1|auto/sources:118–119；auto/os/solaris event ports probe 成功；或 auto/modules 的 NGX_TEST_BUILD_EVENTPORT=YES|无额外注册项 guard|
|ngx_iocp_module<br>ngx_iocp_commands|[src/event/modules/ngx_iocp_module.c:75](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/modules/ngx_iocp_module.c#L75)|3|auto/sources:124–125；auto/os/win32:10 编译源 + :34 owner|无额外注册项 guard|
|ngx_kqueue_module<br>ngx_kqueue_commands|[src/event/modules/ngx_kqueue_module.c:100](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/modules/ngx_kqueue_module.c#L100)|2|auto/sources:112–113；auto/os/darwin:28–29；FreeBSD osreldate 条件；或 auto/unix 未检查时 kqueue probe 成功|无额外注册项 guard|
|ngx_events_module<br>ngx_events_commands|[src/event/ngx_event.c:102](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/ngx_event.c#L102)|1|auto/sources:84、95 EVENT_MODULES / EVENT_SRCS → UNIX_SRCS / WIN32_SRCS|无额外注册项 guard|
|ngx_event_core_module<br>ngx_event_core_commands|[src/event/ngx_event.c:178](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/ngx_event.c#L178)|6|auto/sources:84、95 EVENT_MODULES / EVENT_SRCS → UNIX_SRCS / WIN32_SRCS|无额外注册项 guard|
|ngx_openssl_module<br>ngx_openssl_commands|[src/event/ngx_event_openssl.c:113](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/ngx_event_openssl.c#L113)|1|[auto/modules:1319](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1319) if [ $USE_OPENSSL = YES ]；link=YES|无额外注册项 guard|
|ngx_quic_bpf_module<br>ngx_quic_bpf_commands|[src/event/quic/ngx_event_quic_bpf.c:89](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/quic/ngx_event_quic_bpf.c#L89)|1|[auto/modules:1373](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1373) if [ $USE_OPENSSL_QUIC = YES ] ∧ if [ $QUIC_BPF = YES -a $SO_COOKIE_FOUND = YES ]；link=YES|无额外注册项 guard|
|ngx_http_access_module<br>ngx_http_access_commands|[src/http/modules/ngx_http_access_module.c:106](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_access_module.c#L106)|2|[auto/modules:591](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L591) if [ $HTTP = YES ] ∧ if [ $HTTP_ACCESS = YES ]；link=$HTTP_ACCESS|无额外注册项 guard|
|ngx_http_addition_filter_module<br>ngx_http_addition_commands|[src/http/modules/ngx_http_addition_filter_module.c:75](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_addition_filter_module.c#L75)|3|[auto/modules:334](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L334) if [ $HTTP = YES ] ∧ if [ $HTTP_ADDITION = YES ]；link=$HTTP_ADDITION|无额外注册项 guard|
|ngx_http_auth_basic_module<br>ngx_http_auth_basic_commands|[src/http/modules/ngx_http_auth_basic_module.c:73](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_auth_basic_module.c#L73)|2|[auto/modules:580](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L580) if [ $HTTP = YES ] ∧ if [ $HTTP_AUTH_BASIC = YES ]；link=$HTTP_AUTH_BASIC|无额外注册项 guard|
|ngx_http_auth_request_module<br>ngx_http_auth_request_commands|[src/http/modules/ngx_http_auth_request_module.c:85](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_auth_request_module.c#L85)|2|[auto/modules:567](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L567) if [ $HTTP = YES ] ∧ if [ $HTTP_AUTH_REQUEST = YES ]；link=$HTTP_AUTH_REQUEST|无额外注册项 guard|
|ngx_http_autoindex_module<br>ngx_http_autoindex_commands|[src/http/modules/ngx_http_autoindex_module.c:136](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_autoindex_module.c#L136)|4|[auto/modules:512](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L512) if [ $HTTP = YES ] ∧ if [ $HTTP_AUTOINDEX = YES ]；link=$HTTP_AUTOINDEX|无额外注册项 guard|
|ngx_http_browser_module<br>ngx_http_browser_commands|[src/http/modules/ngx_http_browser_module.c:124](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_browser_module.c#L124)|4|[auto/modules:825](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L825) if [ $HTTP = YES ] ∧ if [ $HTTP_BROWSER = YES ]；link=$HTTP_BROWSER|无额外注册项 guard|
|ngx_http_charset_filter_module<br>ngx_http_charset_filter_commands|[src/http/modules/ngx_http_charset_filter_module.c:196](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_charset_filter_module.c#L196)|5|[auto/modules:290](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L290) if [ $HTTP = YES ] ∧ if [ $HTTP_CHARSET = YES ]；link=$HTTP_CHARSET|无额外注册项 guard|
|ngx_http_dav_module<br>ngx_http_dav_commands|[src/http/modules/ngx_http_dav_module.c:126](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_dav_module.c#L126)|4|[auto/modules:501](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L501) if [ $HTTP = YES ] ∧ if [ $HTTP_DAV = YES ]；link=$HTTP_DAV|无额外注册项 guard|
|ngx_http_degradation_module<br>ngx_http_degradation_commands|[src/http/modules/ngx_http_degradation_module.c:74](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_degradation_module.c#L74)|2|[auto/modules:849](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L849) if [ $HTTP = YES ] ∧ if [ $HTTP_DEGRADATION = YES ]；link=$HTTP_DEGRADATION|无额外注册项 guard|
|ngx_http_empty_gif_module<br>ngx_http_empty_gif_commands|[src/http/modules/ngx_http_empty_gif_module.c:93](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_empty_gif_module.c#L93)|1|[auto/modules:814](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L814) if [ $HTTP = YES ] ∧ if [ $HTTP_EMPTY_GIF = YES ]；link=$HTTP_EMPTY_GIF|无额外注册项 guard|
|ngx_http_fastcgi_module<br>ngx_http_fastcgi_commands|[src/http/modules/ngx_http_fastcgi_module.c:595](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_fastcgi_module.c#L595)|49|[auto/modules:748](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L748) if [ $HTTP = YES ] ∧ if [ $HTTP_FASTCGI = YES ]；link=$HTTP_FASTCGI|if (NGX_HTTP_CACHE)|
|ngx_http_flv_module<br>ngx_http_flv_commands|[src/http/modules/ngx_http_flv_module.c:45](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_flv_module.c#L45)|1|[auto/modules:860](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L860) if [ $HTTP = YES ] ∧ if [ $HTTP_FLV = YES ]；link=$HTTP_FLV|无额外注册项 guard|
|ngx_http_geo_module<br>ngx_http_geo_commands|[src/http/modules/ngx_http_geo_module.c:141](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_geo_module.c#L141)|1|[auto/modules:651](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L651) if [ $HTTP = YES ] ∧ if [ $HTTP_GEO = YES ]；link=$HTTP_GEO|无额外注册项 guard|
|ngx_http_geoip_module<br>ngx_http_geoip_commands|[src/http/modules/ngx_http_geoip_module.c:153](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_geoip_module.c#L153)|5|[auto/modules:664](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L664) if [ $HTTP = YES ] ∧ if [ $HTTP_GEOIP != NO ]；link=$HTTP_GEOIP|无额外注册项 guard|
|ngx_http_grpc_module<br>ngx_http_grpc_commands|[src/http/modules/ngx_http_grpc_module.c:475](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_grpc_module.c#L475)|28|[auto/modules:781](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L781) if [ $HTTP = YES ] ∧ if [ $HTTP_GRPC = YES -a $HTTP_V2 = YES ]；link=$HTTP_GRPC|if (NGX_HTTP_SSL)|
|ngx_http_gunzip_filter_module<br>ngx_http_gunzip_filter_commands|[src/http/modules/ngx_http_gunzip_filter_module.c:100](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_gunzip_filter_module.c#L100)|2|[auto/modules:348](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L348) if [ $HTTP = YES ] ∧ if [ $HTTP_GUNZIP = YES ]；link=$HTTP_GUNZIP|无额外注册项 guard|
|ngx_http_gzip_filter_module<br>ngx_http_gzip_filter_commands|[src/http/modules/ngx_http_gzip_filter_module.c:196](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_gzip_filter_module.c#L196)|9|[auto/modules:255](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L255) if [ $HTTP = YES ] ∧ if [ $HTTP_GZIP = YES ]；link=$HTTP_GZIP|无额外注册项 guard|
|ngx_http_gzip_static_module<br>ngx_http_gzip_static_commands|[src/http/modules/ngx_http_gzip_static_module.c:66](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_gzip_static_module.c#L66)|1|[auto/modules:488](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L488) if [ $HTTP = YES ] ∧ if [ $HTTP_GZIP_STATIC = YES ]；link=$HTTP_GZIP_STATIC|无额外注册项 guard|
|ngx_http_headers_filter_module<br>ngx_http_headers_filter_commands|[src/http/modules/ngx_http_headers_filter_module.c:145](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_headers_filter_module.c#L145)|3|[auto/modules:370](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L370) if [ $HTTP = YES ] ∧ if :；link=YES|无额外注册项 guard|
|ngx_http_image_filter_module<br>ngx_http_image_filter_commands|[src/http/modules/ngx_http_image_filter_module.c:192](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_image_filter_module.c#L192)|7|[auto/modules:312](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L312) if [ $HTTP = YES ] ∧ if [ $HTTP_IMAGE_FILTER != NO ]；link=$HTTP_IMAGE_FILTER|无额外注册项 guard|
|ngx_http_index_module<br>ngx_http_index_commands|[src/http/modules/ngx_http_index_module.c:70](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_index_module.c#L70)|1|[auto/modules:523](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L523) if [ $HTTP = YES ] ∧ if :；link=YES|无额外注册项 guard|
|ngx_http_limit_conn_module<br>ngx_http_limit_conn_commands|[src/http/modules/ngx_http_limit_conn_module.c:147](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_limit_conn_module.c#L147)|5|[auto/modules:602](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L602) if [ $HTTP = YES ] ∧ if [ $HTTP_LIMIT_CONN = YES ]；link=$HTTP_LIMIT_CONN|无额外注册项 guard|
|ngx_http_limit_req_module<br>ngx_http_limit_req_commands|[src/http/modules/ngx_http_limit_req_module.c:160](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_limit_req_module.c#L160)|5|[auto/modules:613](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L613) if [ $HTTP = YES ] ∧ if [ $HTTP_LIMIT_REQ = YES ]；link=$HTTP_LIMIT_REQ|无额外注册项 guard|
|ngx_http_log_module<br>ngx_http_log_commands|[src/http/modules/ngx_http_log_module.c:208](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_log_module.c#L208)|3|[auto/modules:95](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L95) if [ $HTTP = YES ] ∧ if :；link=YES|无额外注册项 guard|
|ngx_http_map_module<br>ngx_http_map_commands|[src/http/modules/ngx_http_map_module.c:91](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_map_module.c#L91)|3|[auto/modules:675](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L675) if [ $HTTP = YES ] ∧ if [ $HTTP_MAP = YES ]；link=$HTTP_MAP|无额外注册项 guard|
|ngx_http_memcached_module<br>ngx_http_memcached_commands|[src/http/modules/ngx_http_memcached_module.c:152](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_memcached_module.c#L152)|11|[auto/modules:803](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L803) if [ $HTTP = YES ] ∧ if [ $HTTP_MEMCACHED = YES ]；link=$HTTP_MEMCACHED|无额外注册项 guard|
|ngx_http_mirror_module<br>ngx_http_mirror_commands|[src/http/modules/ngx_http_mirror_module.c:69](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_mirror_module.c#L69)|2|[auto/modules:545](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L545) if [ $HTTP = YES ] ∧ if [ $HTTP_MIRROR = YES ]；link=$HTTP_MIRROR|无额外注册项 guard|
|ngx_http_mp4_module<br>ngx_http_mp4_commands|[src/http/modules/ngx_http_mp4_module.c:412](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_mp4_module.c#L412)|4|[auto/modules:871](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L871) if [ $HTTP = YES ] ∧ if [ $HTTP_MP4 = YES ]；link=$HTTP_MP4|无额外注册项 guard|
|ngx_http_proxy_module<br>ngx_http_proxy_commands|[src/http/modules/ngx_http_proxy_module.c:802](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_proxy_module.c#L802)|68|[auto/modules:737](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L737) if [ $HTTP = YES ] ∧ if [ $HTTP_PROXY = YES ]；link=$HTTP_PROXY|if (NGX_HTTP_CACHE)；if (NGX_HTTP_SSL)|
|ngx_http_random_index_module<br>ngx_http_random_index_commands|[src/http/modules/ngx_http_random_index_module.c:57](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_random_index_module.c#L57)|1|[auto/modules:534](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L534) if [ $HTTP = YES ] ∧ if [ $HTTP_RANDOM_INDEX = YES ]；link=$HTTP_RANDOM_INDEX|无额外注册项 guard|
|ngx_http_realip_module<br>ngx_http_realip_commands|[src/http/modules/ngx_http_realip_module.c:101](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_realip_module.c#L101)|3|[auto/modules:627](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L627) if [ $HTTP = YES ] ∧ if [ $HTTP_REALIP = YES ]；link=$HTTP_REALIP|无额外注册项 guard|
|ngx_http_referer_module<br>ngx_http_referer_commands|[src/http/modules/ngx_http_referer_module.c:95](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_referer_module.c#L95)|3|[auto/modules:697](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L697) if [ $HTTP = YES ] ∧ if [ $HTTP_REFERER = YES ]；link=$HTTP_REFERER|无额外注册项 guard|
|ngx_http_rewrite_module<br>ngx_http_rewrite_commands|[src/http/modules/ngx_http_rewrite_module.c:120](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_rewrite_module.c#L120)|7|[auto/modules:710](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L710) if [ $HTTP = YES ] ∧ if [ $HTTP_REWRITE = YES -a $USE_PCRE != DISABLED ]；link=$HTTP_REWRITE|无额外注册项 guard|
|ngx_http_scgi_module<br>ngx_http_scgi_commands|[src/http/modules/ngx_http_scgi_module.c:429](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_scgi_module.c#L429)|44|[auto/modules:770](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L770) if [ $HTTP = YES ] ∧ if [ $HTTP_SCGI = YES ]；link=$HTTP_SCGI|if (NGX_HTTP_CACHE)|
|ngx_http_secure_link_module<br>ngx_http_secure_link_commands|[src/http/modules/ngx_http_secure_link_module.c:79](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_secure_link_module.c#L79)|3|[auto/modules:836](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L836) if [ $HTTP = YES ] ∧ if [ $HTTP_SECURE_LINK = YES ]；link=$HTTP_SECURE_LINK|无额外注册项 guard|
|ngx_http_slice_filter_module<br>ngx_http_slice_filter_commands|[src/http/modules/ngx_http_slice_filter_module.c:79](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_slice_filter_module.c#L79)|1|[auto/modules:418](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L418) if [ $HTTP = YES ] ∧ if [ $HTTP_SLICE = YES ]；link=$HTTP_SLICE|无额外注册项 guard|
|ngx_http_split_clients_module<br>ngx_http_split_clients_commands|[src/http/modules/ngx_http_split_clients_module.c:58](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_split_clients_module.c#L58)|1|[auto/modules:686](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L686) if [ $HTTP = YES ] ∧ if [ $HTTP_SPLIT_CLIENTS = YES ]；link=$HTTP_SPLIT_CLIENTS|无额外注册项 guard|
|ngx_http_ssi_filter_module<br>ngx_http_ssi_filter_commands|[src/http/modules/ngx_http_ssi_filter_module.c:193](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_ssi_filter_module.c#L193)|7|[auto/modules:279](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L279) if [ $HTTP = YES ] ∧ if [ $HTTP_SSI = YES ]；link=$HTTP_SSI|无额外注册项 guard|
|ngx_http_ssl_module<br>ngx_http_ssl_commands|[src/http/modules/ngx_http_ssl_module.c:312](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_ssl_module.c#L312)|28|[auto/modules:724](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L724) if [ $HTTP = YES ] ∧ if [ $HTTP_SSL = YES ]；link=$HTTP_SSL|无额外注册项 guard|
|ngx_http_stub_status_module<br>ngx_http_status_commands|[src/http/modules/ngx_http_stub_status_module.c:49](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_stub_status_module.c#L49)|1|[auto/modules:952](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L952) if [ $HTTP = YES ] ∧ if [ $HTTP_STUB_STATUS = YES ]；link=$HTTP_STUB_STATUS|无额外注册项 guard|
|ngx_http_sub_filter_module<br>ngx_http_sub_filter_commands|[src/http/modules/ngx_http_sub_filter_module.c:150](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_sub_filter_module.c#L150)|4|[auto/modules:323](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L323) if [ $HTTP = YES ] ∧ if [ $HTTP_SUB = YES ]；link=$HTTP_SUB|无额外注册项 guard|
|ngx_http_try_files_module<br>ngx_http_try_files_commands|[src/http/modules/ngx_http_try_files_module.c:62](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_try_files_module.c#L62)|1|[auto/modules:556](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L556) if [ $HTTP = YES ] ∧ if :；link=YES|无额外注册项 guard|
|ngx_http_upstream_hash_module<br>ngx_http_upstream_hash_commands|[src/http/modules/ngx_http_upstream_hash_module.c:94](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_upstream_hash_module.c#L94)|1|[auto/modules:882](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L882) if [ $HTTP = YES ] ∧ if [ $HTTP_UPSTREAM_HASH = YES ]；link=$HTTP_UPSTREAM_HASH|无额外注册项 guard|
|ngx_http_upstream_ip_hash_module<br>ngx_http_upstream_ip_hash_commands|[src/http/modules/ngx_http_upstream_ip_hash_module.c:64](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_upstream_ip_hash_module.c#L64)|1|[auto/modules:893](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L893) if [ $HTTP = YES ] ∧ if [ $HTTP_UPSTREAM_IP_HASH = YES ]；link=$HTTP_UPSTREAM_IP_HASH|无额外注册项 guard|
|ngx_http_upstream_keepalive_module<br>ngx_http_upstream_keepalive_commands|[src/http/modules/ngx_http_upstream_keepalive_module.c:130](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_upstream_keepalive_module.c#L130)|4|[auto/modules:926](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L926) if [ $HTTP = YES ] ∧ if [ $HTTP_UPSTREAM_KEEPALIVE = YES ]；link=$HTTP_UPSTREAM_KEEPALIVE|无额外注册项 guard|
|ngx_http_upstream_least_conn_module<br>ngx_http_upstream_least_conn_commands|[src/http/modules/ngx_http_upstream_least_conn_module.c:49](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_upstream_least_conn_module.c#L49)|1|[auto/modules:904](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L904) if [ $HTTP = YES ] ∧ if [ $HTTP_UPSTREAM_LEAST_CONN = YES ]；link=$HTTP_UPSTREAM_LEAST_CONN|无额外注册项 guard|
|ngx_http_upstream_random_module<br>ngx_http_upstream_random_commands|[src/http/modules/ngx_http_upstream_random_module.c:80](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_upstream_random_module.c#L80)|1|[auto/modules:915](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L915) if [ $HTTP = YES ] ∧ if [ $HTTP_UPSTREAM_RANDOM = YES ]；link=$HTTP_UPSTREAM_RANDOM|无额外注册项 guard|
|ngx_http_upstream_zone_module<br>ngx_http_upstream_zone_commands|[src/http/modules/ngx_http_upstream_zone_module.c:51](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_upstream_zone_module.c#L51)|1|[auto/modules:939](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L939) if [ $HTTP = YES ] ∧ if [ $HTTP_UPSTREAM_ZONE = YES ]；link=$HTTP_UPSTREAM_ZONE|无额外注册项 guard|
|ngx_http_userid_filter_module<br>ngx_http_userid_commands|[src/http/modules/ngx_http_userid_filter_module.c:204](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_userid_filter_module.c#L204)|9|[auto/modules:359](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L359) if [ $HTTP = YES ] ∧ if [ $HTTP_USERID = YES ]；link=$HTTP_USERID|无额外注册项 guard|
|ngx_http_uwsgi_module<br>ngx_http_uwsgi_commands|[src/http/modules/ngx_http_uwsgi_module.c:597](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_uwsgi_module.c#L597)|60|[auto/modules:759](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L759) if [ $HTTP = YES ] ∧ if [ $HTTP_UWSGI = YES ]；link=$HTTP_UWSGI|if (NGX_HTTP_CACHE)；if (NGX_HTTP_SSL)|
|ngx_http_xslt_filter_module<br>ngx_http_xslt_filter_commands|[src/http/modules/ngx_http_xslt_filter_module.c:181](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_xslt_filter_module.c#L181)|6|[auto/modules:301](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L301) if [ $HTTP = YES ] ∧ if [ $HTTP_XSLT != NO ]；link=$HTTP_XSLT|无额外注册项 guard|
|ngx_http_perl_module<br>ngx_http_perl_commands|[src/http/modules/perl/ngx_http_perl_module.c:116](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/perl/ngx_http_perl_module.c#L116)|4|[auto/modules:792](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L792) if [ $HTTP = YES ] ∧ if [ $HTTP_PERL != NO ]；link=$HTTP_PERL|无额外注册项 guard|
|ngx_http_module<br>ngx_http_commands|[src/http/ngx_http.c:105](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/ngx_http.c#L105)|1|[auto/modules:95](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L95) if [ $HTTP = YES ] ∧ if :；link=YES|无额外注册项 guard|
|ngx_http_copy_filter_module<br>ngx_http_copy_filter_commands|[src/http/ngx_http_copy_filter_module.c:63](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/ngx_http_copy_filter_module.c#L63)|1|[auto/modules:385](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L385) if [ $HTTP = YES ] ∧ if :；link=YES|无额外注册项 guard|
|ngx_http_core_module<br>ngx_http_core_commands|[src/http/ngx_http_core_module.c:800](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/ngx_http_core_module.c#L800)|83|[auto/modules:95](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L95) if [ $HTTP = YES ] ∧ if :；link=YES|if (NGX_HTTP_GZIP)；if (NGX_HAVE_OPENAT)|
|ngx_http_upstream_module<br>ngx_http_upstream_commands|[src/http/ngx_http_upstream.c:361](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/ngx_http_upstream.c#L361)|2|[auto/modules:95](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L95) if [ $HTTP = YES ] ∧ if :；link=YES|无额外注册项 guard|
|ngx_http_v2_module<br>ngx_http_v2_commands|[src/http/v2/ngx_http_v2_module.c:200](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/v2/ngx_http_v2_module.c#L200)|15|[auto/modules:438](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L438) if [ $HTTP = YES ] ∧ if [ $HTTP_V2 = YES ]；link=$HTTP_V2|无额外注册项 guard|
|ngx_http_v3_module<br>ngx_http_v3_commands|[src/http/v3/ngx_http_v3_module.c:100](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/v3/ngx_http_v3_module.c#L100)|8|[auto/modules:464](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L464) if [ $HTTP = YES ] ∧ if [ $HTTP_V3 = YES ]；link=$HTTP_V3|无额外注册项 guard|
|ngx_mail_module<br>ngx_mail_commands|[src/mail/ngx_mail.c:50](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/mail/ngx_mail.c#L50)|1|[auto/modules:976](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L976) if [ $MAIL != NO ]；link=YES|无额外注册项 guard|
|ngx_mail_auth_http_module<br>ngx_mail_auth_http_commands|[src/mail/ngx_mail_auth_http_module.c:132](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/mail/ngx_mail_auth_http_module.c#L132)|4|[auto/modules:1022](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1022) if [ $MAIL != NO ]；link=YES|无额外注册项 guard|
|ngx_mail_core_module<br>ngx_mail_core_commands|[src/mail/ngx_mail_core_module.c:110](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/mail/ngx_mail_core_module.c#L110)|9|[auto/modules:976](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L976) if [ $MAIL != NO ]；link=YES|无额外注册项 guard|
|ngx_mail_imap_module<br>ngx_mail_imap_commands|[src/mail/ngx_mail_imap_module.c:102](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/mail/ngx_mail_imap_module.c#L102)|3|[auto/modules:1006](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1006) if [ $MAIL != NO ] ∧ if [ $MAIL_IMAP = YES ]；link=YES|无额外注册项 guard|
|ngx_mail_pop3_module<br>ngx_mail_pop3_commands|[src/mail/ngx_mail_pop3_module.c:95](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/mail/ngx_mail_pop3_module.c#L95)|2|[auto/modules:997](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L997) if [ $MAIL != NO ] ∧ if [ $MAIL_POP3 = YES ]；link=YES|无额外注册项 guard|
|ngx_mail_proxy_module<br>ngx_mail_proxy_commands|[src/mail/ngx_mail_proxy_module.c:109](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/mail/ngx_mail_proxy_module.c#L109)|7|[auto/modules:1028](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1028) if [ $MAIL != NO ]；link=YES|无额外注册项 guard|
|ngx_mail_realip_module<br>ngx_mail_realip_commands|[src/mail/ngx_mail_realip_module.c:51](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/mail/ngx_mail_realip_module.c#L51)|1|[auto/modules:1034](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1034) if [ $MAIL != NO ]；link=YES|无额外注册项 guard|
|ngx_mail_smtp_module<br>ngx_mail_smtp_commands|[src/mail/ngx_mail_smtp_module.c:102](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/mail/ngx_mail_smtp_module.c#L102)|4|[auto/modules:1015](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1015) if [ $MAIL != NO ] ∧ if [ $MAIL_SMTP = YES ]；link=YES|无额外注册项 guard|
|ngx_mail_ssl_module<br>ngx_mail_ssl_commands|[src/mail/ngx_mail_ssl_module.c:220](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/mail/ngx_mail_ssl_module.c#L220)|19|[auto/modules:988](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L988) if [ $MAIL != NO ] ∧ if [ $MAIL_SSL = YES ]；link=YES|无额外注册项 guard|
|ngx_google_perftools_module<br>ngx_google_perftools_commands|[src/misc/ngx_google_perftools_module.c:50](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/misc/ngx_google_perftools_module.c#L50)|1|[auto/modules:1462](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1462) if [ $NGX_GOOGLE_PERFTOOLS = YES ]；link=$NGX_GOOGLE_PERFTOOLS|无额外注册项 guard|
|ngx_stream_module<br>ngx_stream_commands|[src/stream/ngx_stream.c:75](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream.c#L75)|1|[auto/modules:1072](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1072) if [ $STREAM != NO ]；link=YES|无额外注册项 guard|
|ngx_stream_access_module<br>ngx_stream_access_commands|[src/stream/ngx_stream_access_module.c:102](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_access_module.c#L102)|2|[auto/modules:1116](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1116) if [ $STREAM != NO ] ∧ if [ $STREAM_ACCESS = YES ]；link=$STREAM_ACCESS|无额外注册项 guard|
|ngx_stream_core_module<br>ngx_stream_core_commands|[src/stream/ngx_stream_core_module.c:152](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_core_module.c#L152)|14|[auto/modules:1072](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1072) if [ $STREAM != NO ]；link=YES|无额外注册项 guard|
|ngx_stream_geo_module<br>ngx_stream_geo_commands|[src/stream/ngx_stream_geo_module.c:132](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_geo_module.c#L132)|1|[auto/modules:1126](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1126) if [ $STREAM != NO ] ∧ if [ $STREAM_GEO = YES ]；link=$STREAM_GEO|无额外注册项 guard|
|ngx_stream_geoip_module<br>ngx_stream_geoip_commands|[src/stream/ngx_stream_geoip_module.c:131](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_geoip_module.c#L131)|3|[auto/modules:1136](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1136) if [ $STREAM != NO ] ∧ if [ $STREAM_GEOIP != NO ]；link=$STREAM_GEOIP|无额外注册项 guard|
|ngx_stream_limit_conn_module<br>ngx_stream_limit_conn_commands|[src/stream/ngx_stream_limit_conn_module.c:131](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_limit_conn_module.c#L131)|4|[auto/modules:1106](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1106) if [ $STREAM != NO ] ∧ if [ $STREAM_LIMIT_CONN = YES ]；link=$STREAM_LIMIT_CONN|无额外注册项 guard|
|ngx_stream_log_module<br>ngx_stream_log_commands|[src/stream/ngx_stream_log_module.c:184](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_log_module.c#L184)|3|[auto/modules:1072](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1072) if [ $STREAM != NO ]；link=YES|无额外注册项 guard|
|ngx_stream_map_module<br>ngx_stream_map_commands|[src/stream/ngx_stream_map_module.c:89](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_map_module.c#L89)|3|[auto/modules:1146](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1146) if [ $STREAM != NO ] ∧ if [ $STREAM_MAP = YES ]；link=$STREAM_MAP|无额外注册项 guard|
|ngx_stream_pass_module<br>ngx_stream_pass_commands|[src/stream/ngx_stream_pass_module.c:55](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_pass_module.c#L55)|1|[auto/modules:1176](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1176) if [ $STREAM != NO ] ∧ if [ $STREAM_PASS = YES ]；link=$STREAM_PASS|无额外注册项 guard|
|ngx_stream_proxy_module<br>ngx_stream_proxy_commands|[src/stream/ngx_stream_proxy_module.c:376](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_proxy_module.c#L376)|31|[auto/modules:1072](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1072) if [ $STREAM != NO ]；link=YES|if (NGX_STREAM_SSL)|
|ngx_stream_realip_module<br>ngx_stream_realip_commands|[src/stream/ngx_stream_realip_module.c:68](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_realip_module.c#L68)|1|[auto/modules:1096](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1096) if [ $STREAM != NO ] ∧ if [ $STREAM_REALIP = YES ]；link=$STREAM_REALIP|无额外注册项 guard|
|ngx_stream_return_module<br>ngx_stream_return_commands|[src/stream/ngx_stream_return_module.c:55](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_return_module.c#L55)|1|[auto/modules:1166](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1166) if [ $STREAM != NO ] ∧ if [ $STREAM_RETURN = YES ]；link=$STREAM_RETURN|无额外注册项 guard|
|ngx_stream_set_module<br>ngx_stream_set_commands|[src/stream/ngx_stream_set_module.c:59](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_set_module.c#L59)|1|[auto/modules:1186](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1186) if [ $STREAM != NO ] ∧ if [ $STREAM_SET = YES ]；link=$STREAM_SET|无额外注册项 guard|
|ngx_stream_split_clients_module<br>ngx_stream_split_clients_commands|[src/stream/ngx_stream_split_clients_module.c:55](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_split_clients_module.c#L55)|1|[auto/modules:1156](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1156) if [ $STREAM != NO ] ∧ if [ $STREAM_SPLIT_CLIENTS = YES ]；link=$STREAM_SPLIT_CLIENTS|无额外注册项 guard|
|ngx_stream_ssl_module<br>ngx_stream_ssl_commands|[src/stream/ngx_stream_ssl_module.c:252](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_ssl_module.c#L252)|21|[auto/modules:1086](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1086) if [ $STREAM != NO ] ∧ if [ $STREAM_SSL = YES ]；link=$STREAM_SSL|无额外注册项 guard|
|ngx_stream_ssl_preread_module<br>ngx_stream_ssl_preread_commands|[src/stream/ngx_stream_ssl_preread_module.c:76](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_ssl_preread_module.c#L76)|1|[auto/modules:1238](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1238) if [ $STREAM != NO ] ∧ if [ $STREAM_SSL_PREREAD = YES ]；link=$STREAM_SSL_PREREAD|无额外注册项 guard|
|ngx_stream_upstream_module<br>ngx_stream_upstream_commands|[src/stream/ngx_stream_upstream.c:61](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_upstream.c#L61)|2|[auto/modules:1072](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1072) if [ $STREAM != NO ]；link=YES|无额外注册项 guard|
|ngx_stream_upstream_hash_module<br>ngx_stream_upstream_hash_commands|[src/stream/ngx_stream_upstream_hash_module.c:91](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_upstream_hash_module.c#L91)|1|[auto/modules:1196](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1196) if [ $STREAM != NO ] ∧ if [ $STREAM_UPSTREAM_HASH = YES ]；link=$STREAM_UPSTREAM_HASH|无额外注册项 guard|
|ngx_stream_upstream_least_conn_module<br>ngx_stream_upstream_least_conn_commands|[src/stream/ngx_stream_upstream_least_conn_module.c:46](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_upstream_least_conn_module.c#L46)|1|[auto/modules:1206](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1206) if [ $STREAM != NO ] ∧ if [ $STREAM_UPSTREAM_LEAST_CONN = YES ]；link=$STREAM_UPSTREAM_LEAST_CONN|无额外注册项 guard|
|ngx_stream_upstream_random_module<br>ngx_stream_upstream_random_commands|[src/stream/ngx_stream_upstream_random_module.c:77](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_upstream_random_module.c#L77)|1|[auto/modules:1216](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1216) if [ $STREAM != NO ] ∧ if [ $STREAM_UPSTREAM_RANDOM = YES ]；link=$STREAM_UPSTREAM_RANDOM|无额外注册项 guard|
|ngx_stream_upstream_zone_module<br>ngx_stream_upstream_zone_commands|[src/stream/ngx_stream_upstream_zone_module.c:48](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_upstream_zone_module.c#L48)|1|[auto/modules:1228](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1228) if [ $STREAM != NO ] ∧ if [ $STREAM_UPSTREAM_ZONE = YES ]；link=$STREAM_UPSTREAM_ZONE|无额外注册项 guard|

## 3. Nginx 同块帮助源、平台与零指令 owner

以下是上表实际 auto/module 块的原始 source 值，去重后按首次出现排序。变量并不意味着丢弃：应结合 auto/sources 与父条件展开已核值；未知新表达式拒绝，不直接把整库 C/H 当补全。

- [auto/modules:1390](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1390)：`src/core/ngx_regex.c`。
- [auto/modules:1319](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1319)：`src/event/ngx_event_openssl.c src/event/ngx_event_openssl_stapling.c`。
- [auto/modules:1373](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1373)：`src/event/quic/ngx_event_quic_bpf.c src/event/quic/ngx_event_quic_bpf_code.c`。
- [auto/modules:591](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L591)：`src/http/modules/ngx_http_access_module.c`。
- [auto/modules:334](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L334)：`src/http/modules/ngx_http_addition_filter_module.c`。
- [auto/modules:580](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L580)：`src/http/modules/ngx_http_auth_basic_module.c`。
- [auto/modules:567](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L567)：`src/http/modules/ngx_http_auth_request_module.c`。
- [auto/modules:512](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L512)：`src/http/modules/ngx_http_autoindex_module.c`。
- [auto/modules:825](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L825)：`src/http/modules/ngx_http_browser_module.c`。
- [auto/modules:290](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L290)：`src/http/modules/ngx_http_charset_filter_module.c`。
- [auto/modules:501](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L501)：`src/http/modules/ngx_http_dav_module.c`。
- [auto/modules:849](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L849)：`src/http/modules/ngx_http_degradation_module.c`。
- [auto/modules:814](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L814)：`src/http/modules/ngx_http_empty_gif_module.c`。
- [auto/modules:748](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L748)：`src/http/modules/ngx_http_fastcgi_module.c`。
- [auto/modules:860](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L860)：`src/http/modules/ngx_http_flv_module.c`。
- [auto/modules:651](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L651)：`src/http/modules/ngx_http_geo_module.c`。
- [auto/modules:664](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L664)：`src/http/modules/ngx_http_geoip_module.c`。
- [auto/modules:781](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L781)：`src/http/modules/ngx_http_grpc_module.c`。
- [auto/modules:348](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L348)：`src/http/modules/ngx_http_gunzip_filter_module.c`。
- [auto/modules:255](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L255)：`src/http/modules/ngx_http_gzip_filter_module.c`。
- [auto/modules:488](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L488)：`src/http/modules/ngx_http_gzip_static_module.c`。
- [auto/modules:370](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L370)：`src/http/modules/ngx_http_headers_filter_module.c`。
- [auto/modules:312](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L312)：`src/http/modules/ngx_http_image_filter_module.c`。
- [auto/modules:523](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L523)：`src/http/modules/ngx_http_index_module.c`。
- [auto/modules:602](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L602)：`src/http/modules/ngx_http_limit_conn_module.c`。
- [auto/modules:613](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L613)：`src/http/modules/ngx_http_limit_req_module.c`。
- [auto/modules:95](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L95)：`src/http/ngx_http.c src/http/ngx_http_core_module.c src/http/ngx_http_special_response.c src/http/ngx_http_request.c src/http/ngx_http_parse.c src/http/modules/ngx_http_log_module.c src/http/ngx_http_request_body.c src/http/ngx_http_variables.c src/http/ngx_http_script.c src/http/ngx_http_upstream.c src/http/ngx_http_upstream_round_robin.c`。
- [auto/modules:675](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L675)：`src/http/modules/ngx_http_map_module.c`。
- [auto/modules:803](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L803)：`src/http/modules/ngx_http_memcached_module.c`。
- [auto/modules:545](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L545)：`src/http/modules/ngx_http_mirror_module.c`。
- [auto/modules:871](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L871)：`src/http/modules/ngx_http_mp4_module.c`。
- [auto/modules:737](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L737)：`src/http/modules/ngx_http_proxy_module.c`。
- [auto/modules:534](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L534)：`src/http/modules/ngx_http_random_index_module.c`。
- [auto/modules:627](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L627)：`src/http/modules/ngx_http_realip_module.c`。
- [auto/modules:697](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L697)：`src/http/modules/ngx_http_referer_module.c`。
- [auto/modules:710](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L710)：`src/http/modules/ngx_http_rewrite_module.c`。
- [auto/modules:770](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L770)：`src/http/modules/ngx_http_scgi_module.c`。
- [auto/modules:836](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L836)：`src/http/modules/ngx_http_secure_link_module.c`。
- [auto/modules:418](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L418)：`src/http/modules/ngx_http_slice_filter_module.c`。
- [auto/modules:686](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L686)：`src/http/modules/ngx_http_split_clients_module.c`。
- [auto/modules:279](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L279)：`src/http/modules/ngx_http_ssi_filter_module.c`。
- [auto/modules:724](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L724)：`src/http/modules/ngx_http_ssl_module.c`。
- [auto/modules:952](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L952)：`src/http/modules/ngx_http_stub_status_module.c`。
- [auto/modules:323](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L323)：`src/http/modules/ngx_http_sub_filter_module.c`。
- [auto/modules:556](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L556)：`src/http/modules/ngx_http_try_files_module.c`。
- [auto/modules:882](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L882)：`src/http/modules/ngx_http_upstream_hash_module.c`。
- [auto/modules:893](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L893)：`src/http/modules/ngx_http_upstream_ip_hash_module.c`。
- [auto/modules:926](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L926)：`src/http/modules/ngx_http_upstream_keepalive_module.c`。
- [auto/modules:904](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L904)：`src/http/modules/ngx_http_upstream_least_conn_module.c`。
- [auto/modules:915](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L915)：`src/http/modules/ngx_http_upstream_random_module.c`。
- [auto/modules:939](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L939)：`src/http/modules/ngx_http_upstream_zone_module.c`。
- [auto/modules:359](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L359)：`src/http/modules/ngx_http_userid_filter_module.c`。
- [auto/modules:759](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L759)：`src/http/modules/ngx_http_uwsgi_module.c`。
- [auto/modules:301](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L301)：`src/http/modules/ngx_http_xslt_filter_module.c`。
- [auto/modules:792](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L792)：`src/http/modules/perl/ngx_http_perl_module.c`。
- [auto/modules:385](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L385)：`src/http/ngx_http_copy_filter_module.c`。
- [auto/modules:438](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L438)：`src/http/v2/ngx_http_v2.c src/http/v2/ngx_http_v2_table.c src/http/v2/ngx_http_v2_encode.c src/http/v2/ngx_http_v2_module.c`。
- [auto/modules:464](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L464)：`src/http/v3/ngx_http_v3.c src/http/v3/ngx_http_v3_encode.c src/http/v3/ngx_http_v3_parse.c src/http/v3/ngx_http_v3_table.c src/http/v3/ngx_http_v3_uni.c src/http/v3/ngx_http_v3_request.c src/http/v3/ngx_http_v3_module.c`。
- [auto/modules:976](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L976)：`src/mail/ngx_mail.c src/mail/ngx_mail_core_module.c src/mail/ngx_mail_handler.c src/mail/ngx_mail_parse.c`。
- [auto/modules:1022](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1022)：`src/mail/ngx_mail_auth_http_module.c`。
- [auto/modules:1006](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1006)：`src/mail/ngx_mail_imap_module.c src/mail/ngx_mail_imap_handler.c`。
- [auto/modules:997](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L997)：`src/mail/ngx_mail_pop3_module.c src/mail/ngx_mail_pop3_handler.c`。
- [auto/modules:1028](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1028)：`src/mail/ngx_mail_proxy_module.c`。
- [auto/modules:1034](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1034)：`src/mail/ngx_mail_realip_module.c`。
- [auto/modules:1015](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1015)：`src/mail/ngx_mail_smtp_module.c src/mail/ngx_mail_smtp_handler.c`。
- [auto/modules:988](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L988)：`src/mail/ngx_mail_ssl_module.c`。
- [auto/modules:1462](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1462)：`src/misc/ngx_google_perftools_module.c`。
- [auto/modules:1072](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1072)：`src/stream/ngx_stream.c src/stream/ngx_stream_variables.c src/stream/ngx_stream_script.c src/stream/ngx_stream_handler.c src/stream/ngx_stream_core_module.c src/stream/ngx_stream_log_module.c src/stream/ngx_stream_proxy_module.c src/stream/ngx_stream_upstream.c src/stream/ngx_stream_upstream_round_robin.c src/stream/ngx_stream_write_filter_module.c`。
- [auto/modules:1116](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1116)：`src/stream/ngx_stream_access_module.c`。
- [auto/modules:1126](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1126)：`src/stream/ngx_stream_geo_module.c`。
- [auto/modules:1136](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1136)：`src/stream/ngx_stream_geoip_module.c`。
- [auto/modules:1106](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1106)：`src/stream/ngx_stream_limit_conn_module.c`。
- [auto/modules:1146](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1146)：`src/stream/ngx_stream_map_module.c`。
- [auto/modules:1176](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1176)：`src/stream/ngx_stream_pass_module.c`。
- [auto/modules:1096](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1096)：`src/stream/ngx_stream_realip_module.c`。
- [auto/modules:1166](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1166)：`src/stream/ngx_stream_return_module.c`。
- [auto/modules:1186](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1186)：`src/stream/ngx_stream_set_module.c`。
- [auto/modules:1156](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1156)：`src/stream/ngx_stream_split_clients_module.c`。
- [auto/modules:1086](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1086)：`src/stream/ngx_stream_ssl_module.c`。
- [auto/modules:1238](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1238)：`src/stream/ngx_stream_ssl_preread_module.c`。
- [auto/modules:1196](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1196)：`src/stream/ngx_stream_upstream_hash_module.c`。
- [auto/modules:1206](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1206)：`src/stream/ngx_stream_upstream_least_conn_module.c`。
- [auto/modules:1216](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1216)：`src/stream/ngx_stream_upstream_random_module.c`。
- [auto/modules:1228](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L1228)：`src/stream/ngx_stream_upstream_zone_module.c`。

平台闭合的正向证据：

- core/event：auto/sources 的 CORE_MODULES、EVENT_MODULES 与 CORE_SRCS、EVENT_SRCS，分别经 UNIX_SRCS/WIN32_SRCS 到平台 CORE_SRCS；线程池由 auto/threads 与 auto/modules 的 USE_THREADS 分支同时连接源码/owner。
- [Linux](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/os/linux)：epoll 成功探测或 test-build-epoll 分支；[Solaris](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/os/solaris)：event ports 探测；auto/unix：/dev/poll 探测。test-build 开关只证明正式测试构建路径，不当实际生产平台可用。
- [Darwin:28](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/os/darwin#L28)：显式追加 KQUEUE_MODULE/KQUEUE_SRCS；[FreeBSD](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/os/freebsd)：osreldate 在 [410000,500000) 或 >=500011 条件与 NGX_KQUEUE_CHECKED；auto/unix 未检查时另做 kqueue 探测。不能仅说“BSD 支持”就省略路径。
- [Win32:10](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/os/win32#L10)：IOCP_SRCS 与 :34 IOCP_MODULE；同时把 SELECT_SRCS/POLL_SRCS 替换为 win32 实现，owner 名相同但源文件不同。
- QUIC BPF 同时要求 USE_OPENSSL_QUIC=YES、QUIC_BPF=YES、SO_COOKIE_FOUND=YES；Linux BPF 探测及 HTTP_V3→QUIC 链不可省略。ngx_event_quic_bpf_code.c 是已提交的输入，不能仅因名称含 code 就报缺生成物。
- HTTP_REWRITE 还要求 USE_PCRE!=DISABLED；HTTP_GRPC 还要求 HTTP_V2=YES；MAIL/STREAM 的子模块集合随父族静态或动态选择，不得把子块 link=YES 误读成总是链接进主二进制。

不在724中的正式 owner 也有正向结论：下列固定源码 initializer 的 commands 字段为 NULL，不是“正则没有匹配”。select/poll 由 auto/modules:5–25 和 auto/sources:104–110 连接，Win32 替换源；QUIC 由 auto/modules 的 USE_OPENSSL_QUIC 块连接；HTTP filters/static 由对应 auto/module 块连接；stream write_filter 随 STREAM 基础块连接。

|源文件|正式 owner（commands=NULL）|
|---|---|
|[src/event/modules/ngx_poll_module.c:50](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/modules/ngx_poll_module.c#L50)|ngx_poll_module|
|[src/event/modules/ngx_select_module.c:58](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/modules/ngx_select_module.c#L58)|ngx_select_module|
|[src/event/modules/ngx_win32_poll_module.c:52](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/modules/ngx_win32_poll_module.c#L52)|ngx_poll_module|
|[src/event/modules/ngx_win32_select_module.c:60](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/modules/ngx_win32_select_module.c#L60)|ngx_select_module|
|[src/event/quic/ngx_event_quic.c:41](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/quic/ngx_event_quic.c#L41)|ngx_quic_module|
|[src/http/modules/ngx_http_chunked_filter_module.c:39](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_chunked_filter_module.c#L39)|ngx_http_chunked_filter_module|
|[src/http/modules/ngx_http_not_modified_filter_module.c:35](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_not_modified_filter_module.c#L35)|ngx_http_not_modified_filter_module|
|[src/http/modules/ngx_http_range_filter_module.c:95](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_range_filter_module.c#L95)|ngx_http_range_header_filter_module / ngx_http_range_body_filter_module|
|[src/http/modules/ngx_http_static_module.c:32](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_static_module.c#L32)|ngx_http_static_module|
|[src/http/ngx_http_header_filter_module.c:33](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/ngx_http_header_filter_module.c#L33)|ngx_http_header_filter_module|
|[src/http/ngx_http_postpone_filter_module.c:35](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/ngx_http_postpone_filter_module.c#L35)|ngx_http_postpone_filter_module|
|[src/http/ngx_http_write_filter_module.c:31](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/ngx_http_write_filter_module.c#L31)|ngx_http_write_filter_module|
|[src/http/v2/ngx_http_v2_filter_module.c:81](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/v2/ngx_http_v2_filter_module.c#L81)|ngx_http_v2_filter_module|
|[src/http/v3/ngx_http_v3_filter_module.c:61](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/v3/ngx_http_v3_filter_module.c#L61)|ngx_http_v3_filter_module|
|[src/stream/ngx_stream_write_filter_module.c:36](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_write_filter_module.c#L36)|ngx_stream_write_filter_module|

这张表核的是固定源的显式 initializer；不能扩展为“以后新增源没有命中也算 NULL”。新增 owner 或 commands 指针表达式必须重新核。

## 4. 16 个第三方 config → 全部正式 C 源 → 注册 owner

前7个是既有 echo/headers-more/memc/srcache/xss/HTTP Lua/stream Lua；后9个是本次新有指令 Nginx 模块。每项列完整 config 正式 C 源清单，不仅列命令文件。现代分支指该 config 明确调用 auto/module，静态/动态能力仍受父 Nginx 和依赖条件限制；legacy-only 不推断支持 add-dynamic-module。固定 SHA 链接均来自实际来源配置。

### echo-nginx-module

固定 revision：`8376edc2bbc427e8812d105f4061045449e0db2b`；[正式 config](https://github.com/openresty/echo-nginx-module/blob/8376edc2bbc427e8812d105f4061045449e0db2b/config)。HTTP_AUX_FILTER；现代/legacy 两分支；老版本 HTTP_POSTPONE 兼容分支不能被误当新的注册源。

正式链接证据：`1: ngx_addon_name=ngx_http_echo_module`；`55: ngx_module_srcs="$ECHO_SRCS"`；`58: . auto/module`；`60: HTTP_AUX_FILTER_MODULES="$HTTP_AUX_FILTER_MODULES $ngx_addon_name"`；`61: NGX_ADDON_SRCS="$NGX_ADDON_SRCS $ECHO_SRCS"`。

注册输入：[src/ngx_http_echo_module.c:229](https://github.com/openresty/echo-nginx-module/blob/8376edc2bbc427e8812d105f4061045449e0db2b/src/ngx_http_echo_module.c#L229)；owner `ngx_http_echo_module`；commands `ngx_http_echo_commands`；19条；config 源声明行 4。

注册 guard 摘要：无额外注册项 guard。摘要不替代逐项原分支。

正式 C 源 12 个（路径相对组件仓库；均在固定 tree）：

```text
src/ngx_http_echo_module.c
src/ngx_http_echo_util.c
src/ngx_http_echo_timer.c
src/ngx_http_echo_var.c
src/ngx_http_echo_handler.c
src/ngx_http_echo_filter.c
src/ngx_http_echo_sleep.c
src/ngx_http_echo_location.c
src/ngx_http_echo_echo.c
src/ngx_http_echo_request_info.c
src/ngx_http_echo_subrequest.c
src/ngx_http_echo_foreach.c
```

### headers-more-nginx-module

固定 revision：`06dc0be56e5ec9f7fd814e881b066b5540a85bec`；[正式 config](https://github.com/openresty/headers-more-nginx-module/blob/06dc0be56e5ec9f7fd814e881b066b5540a85bec/config)。HTTP_AUX_FILTER；现代/legacy 两分支。

正式链接证据：`1: ngx_addon_name=ngx_http_headers_more_filter_module`；`24: ngx_module_srcs="$HEADERS_MORE_SRCS"`；`27: . auto/module`；`29: HTTP_AUX_FILTER_MODULES="$HTTP_AUX_FILTER_MODULES $ngx_addon_name"`；`30: NGX_ADDON_SRCS="$NGX_ADDON_SRCS $HEADERS_MORE_SRCS"`。

注册输入：[src/ngx_http_headers_more_filter_module.c:92](https://github.com/openresty/headers-more-nginx-module/blob/06dc0be56e5ec9f7fd814e881b066b5540a85bec/src/ngx_http_headers_more_filter_module.c#L92)；owner `ngx_http_headers_more_filter_module`；commands `ngx_http_headers_more_filter_commands`；4条；config 源声明行 4。

注册 guard 摘要：无额外注册项 guard。摘要不替代逐项原分支。

正式 C 源 4 个（路径相对组件仓库；均在固定 tree）：

```text
src/ngx_http_headers_more_filter_module.c
src/ngx_http_headers_more_headers_out.c
src/ngx_http_headers_more_headers_in.c
src/ngx_http_headers_more_util.c
```

### memc-nginx-module

固定 revision：`b889a6fc3e18b784b454e1bc74e5d0b3513a07ce`；[正式 config](https://github.com/openresty/memc-nginx-module/blob/b889a6fc3e18b784b454e1bc74e5d0b3513a07ce/config)。HTTP；现代/legacy 两分支。

正式链接证据：`1: ngx_addon_name=ngx_http_memc_module`；`23: ngx_module_srcs="$MEMC_SRCS"`；`26: . auto/module`；`28: HTTP_MODULES="$HTTP_MODULES $ngx_addon_name"`；`29: NGX_ADDON_SRCS="$NGX_ADDON_SRCS $MEMC_SRCS"`。

注册输入：[src/ngx_http_memc_module.c:146](https://github.com/openresty/memc-nginx-module/blob/b889a6fc3e18b784b454e1bc74e5d0b3513a07ce/src/ngx_http_memc_module.c#L146)；owner `ngx_http_memc_module`；commands `ngx_http_memc_commands`；11条；config 源声明行 4。

注册 guard 摘要：无额外注册项 guard。摘要不替代逐项原分支。

正式 C 源 5 个（路径相对组件仓库；均在固定 tree）：

```text
src/ngx_http_memc_module.c
src/ngx_http_memc_request.c
src/ngx_http_memc_response.c
src/ngx_http_memc_util.c
src/ngx_http_memc_handler.c
```

### srcache-nginx-module

固定 revision：`be22ac0dcd9245aadcaca3220da96a0c1a0285a7`；[正式 config](https://github.com/openresty/srcache-nginx-module/blob/be22ac0dcd9245aadcaca3220da96a0c1a0285a7/config)。HTTP_AUX_FILTER；现代/legacy 两分支；HTTP_POSTPONE 兼容分支同 echo。

正式链接证据：`1: ngx_addon_name=ngx_http_srcache_filter_module`；`42: ngx_module_srcs="$HTTP_SRCACHE_FILTER_SRCS"`；`45: . auto/module`；`47: HTTP_AUX_FILTER_MODULES="$HTTP_AUX_FILTER_MODULES $ngx_addon_name"`；`48: NGX_ADDON_SRCS="$NGX_ADDON_SRCS $HTTP_SRCACHE_FILTER_SRCS"`。

注册输入：[src/ngx_http_srcache_filter_module.c:231](https://github.com/openresty/srcache-nginx-module/blob/be22ac0dcd9245aadcaca3220da96a0c1a0285a7/src/ngx_http_srcache_filter_module.c#L231)；owner `ngx_http_srcache_filter_module`；commands `ngx_http_srcache_commands`；20条；config 源声明行 4。

注册 guard 摘要：无额外注册项 guard。摘要不替代逐项原分支。

正式 C 源 6 个（路径相对组件仓库；均在固定 tree）：

```text
src/ngx_http_srcache_filter_module.c
src/ngx_http_srcache_util.c
src/ngx_http_srcache_var.c
src/ngx_http_srcache_store.c
src/ngx_http_srcache_fetch.c
src/ngx_http_srcache_headers.c
```

### xss-nginx-module

固定 revision：`6c41076ac066c30c96d70e86da5400ffd49a6186`；[正式 config](https://github.com/openresty/xss-nginx-module/blob/6c41076ac066c30c96d70e86da5400ffd49a6186/config)。legacy-only：HTTP_AUX_FILTER_MODULES + NGX_ADDON_SRCS。

正式链接证据：`1: ngx_addon_name=ngx_http_xss_filter_module`；`2: HTTP_AUX_FILTER_MODULES="$HTTP_AUX_FILTER_MODULES ngx_http_xss_filter_module"`；`3: NGX_ADDON_SRCS="$NGX_ADDON_SRCS $ngx_addon_dir/src/ngx_http_xss_filter_module.c $ngx_addon_dir/src/ngx_http_xss_util.c"`。

注册输入：[src/ngx_http_xss_filter_module.c:109](https://github.com/openresty/xss-nginx-module/blob/6c41076ac066c30c96d70e86da5400ffd49a6186/src/ngx_http_xss_filter_module.c#L109)；owner `ngx_http_xss_filter_module`；commands `ngx_http_xss_commands`；6条；config 源声明行 3。

注册 guard 摘要：无额外注册项 guard。摘要不替代逐项原分支。

正式 C 源 2 个（路径相对组件仓库；均在固定 tree）：

```text
src/ngx_http_xss_filter_module.c
src/ngx_http_xss_util.c
```

### lua-nginx-module

固定 revision：`ea09d92adf835e30cab8d79343c7b8266e888128`；[正式 config](https://github.com/openresty/lua-nginx-module/blob/ea09d92adf835e30cab8d79343c7b8266e888128/config)。HTTP_AUX_FILTER；现代/legacy 两分支；LuaJIT 2 / Lua 5.1 与 FFI 探测约束，平台链接条件照 config 保留；NDK_SET_VAR 定义不证明 NDK 已存在。

正式链接证据：`237: ngx_addon_name=ngx_http_lua_module`；`307: $ngx_addon_dir/src/ngx_http_lua_autoconf.h \`；`495: ngx_module_srcs="$HTTP_LUA_SRCS"`；`497: . auto/module`；`499: HTTP_AUX_FILTER_MODULES="$HTTP_AUX_FILTER_MODULES $ngx_addon_name"`；`500: NGX_ADDON_SRCS="$NGX_ADDON_SRCS $HTTP_LUA_SRCS"`；`519: echo "/* DO NOT EDIT! This file was automatically generated by config */" > "$ngx_addon_dir/src/ngx_http_lua_autoconf.h"`。

注册输入：[src/ngx_http_lua_module.c:736](https://github.com/openresty/lua-nginx-module/blob/ea09d92adf835e30cab8d79343c7b8266e888128/src/ngx_http_lua_module.c#L736)；owner `ngx_http_lua_module`；commands `ngx_http_lua_cmds`；79条；config 源声明行 255。

注册 guard 摘要：`if (NGX_PCRE)`；`else `；`if defined(NDK) && NDK`；`if (NGX_HTTP_SSL)`；`if (nginx_version >= 1019004)`。摘要不替代逐项原分支。

正式 C 源 64 个（路径相对组件仓库；均在固定 tree）：

```text
src/ngx_http_lua_script.c
src/ngx_http_lua_log.c
src/ngx_http_lua_subrequest.c
src/ngx_http_lua_ndk.c
src/ngx_http_lua_control.c
src/ngx_http_lua_time.c
src/ngx_http_lua_misc.c
src/ngx_http_lua_variable.c
src/ngx_http_lua_string.c
src/ngx_http_lua_output.c
src/ngx_http_lua_headers.c
src/ngx_http_lua_req_body.c
src/ngx_http_lua_uri.c
src/ngx_http_lua_args.c
src/ngx_http_lua_ctx.c
src/ngx_http_lua_regex.c
src/ngx_http_lua_module.c
src/ngx_http_lua_headers_out.c
src/ngx_http_lua_headers_in.c
src/ngx_http_lua_directive.c
src/ngx_http_lua_consts.c
src/ngx_http_lua_exception.c
src/ngx_http_lua_util.c
src/ngx_http_lua_cache.c
src/ngx_http_lua_contentby.c
src/ngx_http_lua_server_rewriteby.c
src/ngx_http_lua_rewriteby.c
src/ngx_http_lua_accessby.c
src/ngx_http_lua_setby.c
src/ngx_http_lua_capturefilter.c
src/ngx_http_lua_clfactory.c
src/ngx_http_lua_pcrefix.c
src/ngx_http_lua_headerfilterby.c
src/ngx_http_lua_shdict.c
src/ngx_http_lua_socket_tcp.c
src/ngx_http_lua_api.c
src/ngx_http_lua_logby.c
src/ngx_http_lua_sleep.c
src/ngx_http_lua_semaphore.c
src/ngx_http_lua_coroutine.c
src/ngx_http_lua_bodyfilterby.c
src/ngx_http_lua_initby.c
src/ngx_http_lua_initworkerby.c
src/ngx_http_lua_exitworkerby.c
src/ngx_http_lua_socket_udp.c
src/ngx_http_lua_req_method.c
src/ngx_http_lua_phase.c
src/ngx_http_lua_uthread.c
src/ngx_http_lua_timer.c
src/ngx_http_lua_config.c
src/ngx_http_lua_worker.c
src/ngx_http_lua_ssl_client_helloby.c
src/ngx_http_lua_ssl_certby.c
src/ngx_http_lua_ssl_export_keying_material.c
src/ngx_http_lua_ssl_ocsp.c
src/ngx_http_lua_lex.c
src/ngx_http_lua_balancer.c
src/ngx_http_lua_ssl_session_storeby.c
src/ngx_http_lua_ssl_session_fetchby.c
src/ngx_http_lua_ssl.c
src/ngx_http_lua_log_ringbuf.c
src/ngx_http_lua_input_filters.c
src/ngx_http_lua_pipe.c
src/ngx_http_lua_worker_thread.c
```

### stream-lua-nginx-module

固定 revision：`69f0cd762112a6e0cddb07f2b5192e9a65034a93`；[正式 config](https://github.com/openresty/stream-lua-nginx-module/blob/69f0cd762112a6e0cddb07f2b5192e9a65034a93/config)。STREAM；现代/legacy 两分支；LuaJIT 2 / Lua 5.1 与 FFI 探测约束；STREAM 父族条件不能省略。

正式链接证据：`237: ngx_addon_name=ngx_stream_lua_module`；`287: $ngx_addon_dir/src/ngx_stream_lua_autoconf.h \`；`394: ngx_module_srcs="$STREAM_LUA_SRCS"`；`396: . auto/module`；`398: STREAM_MODULES="$STREAM_MODULES $ngx_addon_name"`；`399: NGX_ADDON_SRCS="$NGX_ADDON_SRCS $STREAM_LUA_SRCS"`；`416: echo "/* DO NOT EDIT! This file was automatically generated by config */" > "$ngx_addon_dir/src/ngx_stream_lua_autoconf.h"`。

注册输入：[src/ngx_stream_lua_module.c:497](https://github.com/openresty/stream-lua-nginx-module/blob/69f0cd762112a6e0cddb07f2b5192e9a65034a93/src/ngx_stream_lua_module.c#L497)；owner `ngx_stream_lua_module`；commands `ngx_stream_lua_cmds`；50条；config 源声明行 241。

注册 guard 摘要：`if (NGX_PCRE)`；`if (NGX_STREAM_SSL)`；`if (nginx_version >= 1019004)`。摘要不替代逐项原分支。

正式 C 源 44 个（路径相对组件仓库；均在固定 tree）：

```text
src/ngx_stream_lua_api.c
src/ngx_stream_lua_request.c
src/ngx_stream_lua_module.c
src/ngx_stream_lua_directive.c
src/ngx_stream_lua_lex.c
src/ngx_stream_lua_contentby.c
src/ngx_stream_lua_util.c
src/ngx_stream_lua_cache.c
src/ngx_stream_lua_clfactory.c
src/ngx_stream_lua_exception.c
src/ngx_stream_lua_pcrefix.c
src/ngx_stream_lua_uthread.c
src/ngx_stream_lua_coroutine.c
src/ngx_stream_lua_output.c
src/ngx_stream_lua_consts.c
src/ngx_stream_lua_log.c
src/ngx_stream_lua_time.c
src/ngx_stream_lua_string.c
src/ngx_stream_lua_control.c
src/ngx_stream_lua_sleep.c
src/ngx_stream_lua_phase.c
src/ngx_stream_lua_ctx.c
src/ngx_stream_lua_regex.c
src/ngx_stream_lua_script.c
src/ngx_stream_lua_shdict.c
src/ngx_stream_lua_variable.c
src/ngx_stream_lua_timer.c
src/ngx_stream_lua_config.c
src/ngx_stream_lua_worker.c
src/ngx_stream_lua_misc.c
src/ngx_stream_lua_initby.c
src/ngx_stream_lua_initworkerby.c
src/ngx_stream_lua_socket_tcp.c
src/ngx_stream_lua_socket_udp.c
src/ngx_stream_lua_args.c
src/ngx_stream_lua_ssl.c
src/ngx_stream_lua_balancer.c
src/ngx_stream_lua_logby.c
src/ngx_stream_lua_prereadby.c
src/ngx_stream_lua_semaphore.c
src/ngx_stream_lua_ssl_client_helloby.c
src/ngx_stream_lua_ssl_certby.c
src/ngx_stream_lua_log_ringbuf.c
src/ngx_stream_lua_input_filters.c
```

### rds-json-nginx-module

固定 revision：`2d7e07f7c39f98bbb2a8b07f4bae4d892f00329d`；[正式 config](https://github.com/openresty/rds-json-nginx-module/blob/2d7e07f7c39f98bbb2a8b07f4bae4d892f00329d/config)。HTTP_AUX_FILTER；直接使用 auto/module。

正式链接证据：`1: ngx_addon_name=ngx_http_rds_json_filter_module`；`27: ngx_module_srcs="$RDS_JSON_FILTER_SRCS"`；`30: . auto/module`。

注册输入：[src/ngx_http_rds_json_filter_module.c:170](https://github.com/openresty/rds-json-nginx-module/blob/2d7e07f7c39f98bbb2a8b07f4bae4d892f00329d/src/ngx_http_rds_json_filter_module.c#L170)；owner `ngx_http_rds_json_filter_module`；commands `ngx_http_rds_json_commands`；10条；config 源声明行 4。

注册 guard 摘要：无额外注册项 guard。摘要不替代逐项原分支。

正式 C 源 5 个（路径相对组件仓库；均在固定 tree）：

```text
src/ngx_http_rds_json_filter_module.c
src/ngx_http_rds_json_processor.c
src/ngx_http_rds_json_util.c
src/ngx_http_rds_json_output.c
src/ngx_http_rds_json_handler.c
```

### rds-csv-nginx-module

固定 revision：`b4095fcb8a866835ddec7ea0c414b8a4af35741a`；[正式 config](https://github.com/openresty/rds-csv-nginx-module/blob/b4095fcb8a866835ddec7ea0c414b8a4af35741a/config)。legacy-only：HTTP_AUX_FILTER_MODULES + NGX_ADDON_SRCS。

正式链接证据：`1: ngx_addon_name=ngx_http_rds_csv_filter_module`；`2: HTTP_AUX_FILTER_MODULES="$HTTP_AUX_FILTER_MODULES ngx_http_rds_csv_filter_module"`；`3: NGX_ADDON_SRCS="$NGX_ADDON_SRCS $ngx_addon_dir/src/ngx_http_rds_csv_filter_module.c $ngx_addon_dir/src/ngx_http_rds_csv_processor.c $ngx_addon_dir/src/ngx_http_rds_csv_util.c $ngx_addon_dir/src/ngx_http_rds_csv_output.c"`。

注册输入：[src/ngx_http_rds_csv_filter_module.c:118](https://github.com/openresty/rds-csv-nginx-module/blob/b4095fcb8a866835ddec7ea0c414b8a4af35741a/src/ngx_http_rds_csv_filter_module.c#L118)；owner `ngx_http_rds_csv_filter_module`；commands `ngx_http_rds_csv_commands`；6条；config 源声明行 3。

注册 guard 摘要：无额外注册项 guard。摘要不替代逐项原分支。

正式 C 源 4 个（路径相对组件仓库；均在固定 tree）：

```text
src/ngx_http_rds_csv_filter_module.c
src/ngx_http_rds_csv_processor.c
src/ngx_http_rds_csv_util.c
src/ngx_http_rds_csv_output.c
```

### drizzle-nginx-module

固定 revision：`fb6cf255d91135e18145a98a93947ead4e703b68`；[正式 config](https://github.com/openresty/drizzle-nginx-module/blob/fb6cf255d91135e18145a98a93947ead4e703b68/config)。legacy-only HTTP；libdrizzle 探测失败会退出，不能宣称无条件可编译。

正式链接证据：`82: ngx_addon_name=ngx_http_drizzle_module`；`83: HTTP_MODULES="$HTTP_MODULES ngx_http_drizzle_module"`；`84: NGX_ADDON_SRCS="$NGX_ADDON_SRCS $ngx_addon_dir/src/ngx_http_drizzle_module.c $ngx_addon_dir/src/ngx_http_drizzle_handler.c $ngx_addon_dir/src/ngx_http_drizzle_processor.c $ngx_addon_dir/src/ngx_http_drizzle_upstream.c $ngx_addon_dir/src/ngx_http_drizzle_util.c $ngx_addon_dir/src/ngx_http_drizzle_output.c $ngx_addon_dir/src/ngx_http_drizzle_keepalive.c $ngx_addon_dir/src/ngx_http_drizzle_quoting.c $ngx_addon_dir/src/ngx_http_drizzle_checker.c"`。

注册输入：[src/ngx_http_drizzle_module.c:167](https://github.com/openresty/drizzle-nginx-module/blob/fb6cf255d91135e18145a98a93947ead4e703b68/src/ngx_http_drizzle_module.c#L167)；owner `ngx_http_drizzle_module`；commands `ngx_http_drizzle_cmds`；12条；config 源声明行 84。

注册 guard 摘要：无额外注册项 guard。摘要不替代逐项原分支。

正式 C 源 9 个（路径相对组件仓库；均在固定 tree）：

```text
src/ngx_http_drizzle_module.c
src/ngx_http_drizzle_handler.c
src/ngx_http_drizzle_processor.c
src/ngx_http_drizzle_upstream.c
src/ngx_http_drizzle_util.c
src/ngx_http_drizzle_output.c
src/ngx_http_drizzle_keepalive.c
src/ngx_http_drizzle_quoting.c
src/ngx_http_drizzle_checker.c
```

### iconv-nginx-module

固定 revision：`67d55c7edd3ab0535afa1e55ec8b2cdeb5167a82`；[正式 config](https://github.com/calio/iconv-nginx-module/blob/67d55c7edd3ab0535afa1e55ec8b2cdeb5167a82/config)。HTTP_AUX_FILTER；现代/legacy 两分支；NDK 前置和 iconv 探测，CFLAGS 定义 NDK_SET_VAR。

正式链接证据：`96: ngx_addon_name=ngx_http_iconv_module`；`106: ngx_module_srcs="$HTTP_ICONV_SRCS"`；`109: . auto/module`；`111: HTTP_AUX_FILTER_MODULES="$HTTP_AUX_FILTER_MODULES $ngx_addon_name"`；`112: NGX_ADDON_SRCS="$NGX_ADDON_SRCS $HTTP_ICONV_SRCS"`。

注册输入：[src/ngx_http_iconv_module.c:99](https://github.com/calio/iconv-nginx-module/blob/67d55c7edd3ab0535afa1e55ec8b2cdeb5167a82/src/ngx_http_iconv_module.c#L99)；owner `ngx_http_iconv_module`；commands `ngx_http_iconv_commands`；3条；config 源声明行 99。

注册 guard 摘要：无额外注册项 guard。摘要不替代逐项原分支。

正式 C 源 1 个（路径相对组件仓库；均在固定 tree）：

```text
src/ngx_http_iconv_module.c
```

### encrypted-session-nginx-module

固定 revision：`0f81b5728db0ece0f60c72354da69f158dc1d2a7`；[正式 config](https://github.com/openresty/encrypted-session-nginx-module/blob/0f81b5728db0ece0f60c72354da69f158dc1d2a7/config)。HTTP；现代/legacy 两分支；NDK 前置检查、NDK_SET_VAR；config 中 -lssl 为注释，不能充当 OpenSSL 已链接的证据。cipher 的 OpenSSL 依赖由第7节核定发行默认组合和禁用联动，单独 addon 的可编译性仍不能据此保证。

正式链接证据：`17: ngx_addon_name=ngx_http_encrypted_session_module`；`34: ngx_module_srcs="$HTTP_ENCRYPTED_SESSION_SRCS"`；`37: . auto/module`；`39: HTTP_MODULES="$HTTP_MODULES $ngx_addon_name"`；`40: NGX_ADDON_SRCS="$NGX_ADDON_SRCS $HTTP_ENCRYPTED_SESSION_SRCS"`。

注册输入：[src/ngx_http_encrypted_session_module.c:138](https://github.com/openresty/encrypted-session-nginx-module/blob/0f81b5728db0ece0f60c72354da69f158dc1d2a7/src/ngx_http_encrypted_session_module.c#L138)；owner `ngx_http_encrypted_session_module`；commands `ngx_http_encrypted_session_commands`；5条；config 源声明行 20。

注册 guard 摘要：无额外注册项 guard。摘要不替代逐项原分支。

正式 C 源 2 个（路径相对组件仓库；均在固定 tree）：

```text
src/ngx_http_encrypted_session_module.c
src/ngx_http_encrypted_session_cipher.c
```

### redis-nginx-module

固定 revision：`411fef36e130129b670fa7f2672bcad6ab2cbdd3`；[正式 config](https://github.com/osokin/ngx_http_redis/blob/411fef36e130129b670fa7f2672bcad6ab2cbdd3/config)。HTTP；现代/legacy 两分支；维护者固定 Git 来源与官方 archive byte-equal 桥归主线程证据；三项发行补丁差异由主线程另核。

正式链接证据：`1: ngx_addon_name=ngx_http_redis_module`；`11: ngx_module_srcs="$HTTP_REDIS_SRCS"`；`14: . auto/module`；`16: HTTP_MODULES="$HTTP_MODULES $ngx_addon_name"`；`17: NGX_ADDON_SRCS="$NGX_ADDON_SRCS $HTTP_REDIS_SRCS"`。

注册输入：[ngx_http_redis_module.c:143](https://github.com/osokin/ngx_http_redis/blob/411fef36e130129b670fa7f2672bcad6ab2cbdd3/ngx_http_redis_module.c#L143)；owner `ngx_http_redis_module`；commands `ngx_http_redis_commands`；8条；config 源声明行 4。

注册 guard 摘要：`if defined nginx_version && nginx_version >= 8022`。摘要不替代逐项原分支。

正式 C 源 1 个（路径相对组件仓库；均在固定 tree）：

```text
ngx_http_redis_module.c
```

### ngx_postgres

固定 revision：`681980598529f67fcec5c7448452046764a68429`；[正式 config](https://github.com/openresty/ngx_postgres/blob/681980598529f67fcec5c7448452046764a68429/config)。legacy-only HTTP；ngx_addon_name=ngx_postgres，但正式 owner=ngx_postgres_module；libpq 探测/版本条件必须保留。

正式链接证据：`206: ngx_addon_name=ngx_postgres`；`208: HTTP_MODULES="$HTTP_MODULES ngx_postgres_module"`；`213: NGX_ADDON_SRCS="$NGX_ADDON_SRCS $ngx_addon_dir/src/ngx_postgres_escape.c $ngx_addon_dir/src/ngx_postgres_handler.c $ngx_addon_dir/src/ngx_postgres_keepalive.c $ngx_addon_dir/src/ngx_postgres_module.c $ngx_addon_dir/src/ngx_postgres_output.c $ngx_addon_dir/src/ngx_postgres_processor.c $ngx_addon_dir/src/ngx_postgres_rewrite.c $ngx_addon_dir/src/ngx_postgres_upstream.c $ngx_addon_dir/src/ngx_postgres_util.c $ngx_addon_dir/src/ngx_postgres_variable.c"`。

注册输入：[src/ngx_postgres_module.c:161](https://github.com/openresty/ngx_postgres/blob/681980598529f67fcec5c7448452046764a68429/src/ngx_postgres_module.c#L161)；owner `ngx_postgres_module`；commands `ngx_postgres_module_commands`；10条；config 源声明行 213。

注册 guard 摘要：无额外注册项 guard。摘要不替代逐项原分支。

正式 C 源 10 个（路径相对组件仓库；均在固定 tree）：

```text
src/ngx_postgres_escape.c
src/ngx_postgres_handler.c
src/ngx_postgres_keepalive.c
src/ngx_postgres_module.c
src/ngx_postgres_output.c
src/ngx_postgres_processor.c
src/ngx_postgres_rewrite.c
src/ngx_postgres_upstream.c
src/ngx_postgres_util.c
src/ngx_postgres_variable.c
```

### ngx_coolkit

固定 revision：`462b863babe121b900465b4ec8dfba612d723e9a`；[正式 config](https://github.com/FRiCKLE/ngx_coolkit/blob/462b863babe121b900465b4ec8dfba612d723e9a/config)。legacy-only HTTP_MODULES + NGX_ADDON_SRCS。

正式链接证据：`1: ngx_addon_name=ngx_coolkit_module`；`3: HTTP_MODULES="$HTTP_MODULES ngx_coolkit_module"`；`4: NGX_ADDON_SRCS="$NGX_ADDON_SRCS $ngx_addon_dir/src/ngx_coolkit_handlers.c $ngx_addon_dir/src/ngx_coolkit_module.c $ngx_addon_dir/src/ngx_coolkit_variables.c"`。

注册输入：[src/ngx_coolkit_module.c:71](https://github.com/FRiCKLE/ngx_coolkit/blob/462b863babe121b900465b4ec8dfba612d723e9a/src/ngx_coolkit_module.c#L71)；owner `ngx_coolkit_module`；commands `ngx_coolkit_module_commands`；1条；config 源声明行 4。

注册 guard 摘要：无额外注册项 guard。摘要不替代逐项原分支。

正式 C 源 3 个（路径相对组件仓库；均在固定 tree）：

```text
src/ngx_coolkit_handlers.c
src/ngx_coolkit_module.c
src/ngx_coolkit_variables.c
```

### redis2-nginx-module

固定 revision：`c989c829a2877132cb100f901e320921250e068d`；[正式 config](https://github.com/openresty/redis2-nginx-module/blob/c989c829a2877132cb100f901e320921250e068d/config)。HTTP；现代/legacy 两分支。

正式链接证据：`1: ngx_addon_name=ngx_http_redis2_module`；`21: ngx_module_srcs="$REDIS2_SRCS"`；`24: . auto/module`；`26: HTTP_MODULES="$HTTP_MODULES $ngx_addon_name"`；`27: NGX_ADDON_SRCS="$NGX_ADDON_SRCS $REDIS2_SRCS"`。

注册输入：[src/ngx_http_redis2_module.c:131](https://github.com/openresty/redis2-nginx-module/blob/c989c829a2877132cb100f901e320921250e068d/src/ngx_http_redis2_module.c#L131)；owner `ngx_http_redis2_module`；commands `ngx_http_redis2_commands`；11条；config 源声明行 4。

注册 guard 摘要：无额外注册项 guard。摘要不替代逐项原分支。

正式 C 源 4 个（路径相对组件仓库；均在固定 tree）：

```text
src/ngx_http_redis2_module.c
src/ngx_http_redis2_handler.c
src/ngx_http_redis2_reply.c
src/ngx_http_redis2_util.c
```

## 5. generated / includes / 条件的剩余边界

|边界|已核事实与最小处理|仍未证明的事|
|---|---|---|
|Perl|[auto/lib/make](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/lib/make) 的 USE_PERL!=NO 调 [auto/lib/perl/make](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/lib/perl/make)；后者把 nginx.xs、nginx.pm、typemap、Makefile.PL 复制/替换版本后调用 Perl Makefile.PL；[Makefile.PL](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/perl/Makefile.PL) 声明 nginx Perl 扩展和生成 nginx.c 依赖。正式 Nginx owner 仍在 ngx_http_perl_module.c，4条 literal commands 已独立核定。|未执行 XS 生成、Perl 检测或编译；生成产物字节/实际加载未知。不能将 XS 输出伪装固定 Git blob，也不能因此漏掉已核4条。|
|Lua autoconf|两 config 最后一条 echo 生成的 autoconf.h 仅含固定注释；不是注册生成器。src/api 为 include 目录，不是缺失文件。auto/feature/have 生成的能力宏另属条件输入。|没有执行配置，不承诺本机 LuaJIT/FFI/系统库可用。|
|Lua 测试模块|[fake-shm 独立 config](https://github.com/openresty/lua-nginx-module/blob/ea09d92adf835e30cab8d79343c7b8266e888128/t/data/fake-shm-module/config) 自行添加 ngx_http_lua_fake_shm_module；发行根 config 的64个源没有它。因此全库扫描会产生错误额外项，正式输入79条才匹配。|不能把测试配置纳入根 addon，只因它也有合法 commands。|
|DTrace/tapset|HTTP Lua config 实际声明 dtrace/ngx_lua_provider.d 和 tapset/ngx_lua.stp；stream Lua 对应两行是注释。固定发行脚本中 DTrace patch 应用行也为注释，详见第7节；不将 provider 声明当已启用生成链。|用户额外 patch/CFLAGS 启用 NGX_DTRACE 的构建仍未核，不为其声称生成 header 已存在或可编译；不把 stream 注释路径报缺文件。|
|C include|这16个组件正式 C 源本次未发现 .c/.inc include；注册数组均在所列 owner 同文件，严格模式逐数组消费成功。普通 .h 与外部库 include 是依赖边，不自动当额外 registration_inputs。|没有构造完整传递头文件图或预处理翻译单元；不能以 .c/.inc 零命中证明所有头文件不会生成 owner/commands。固定声明已正向闭合的数组可接入；新跨文件 owner、宏数组或未知 include 必须 pending/拒绝并给路径。|
|owner/注册条件|Nginx、Lua 等注册项 C guards 与外部构建条件分开保留；owner 在父 module 集合中才有正式接入依据。|未对用户部署求值，不把 guard 为假当“源不存在”，也不把条件为未知当“默认开启”。|
|发行 patch|上游724与主已接入的 no_error_pages/log_escape_non_ascii 分离；Redis 三patch也须另核。|本研究没有重放 patch；patch 原文、隔离回放目标文件/owner/context 及内容变化由主线程后续集成，不能凭本文把全C01标完成。|

## 6. 最小 gate 建议与可冻结验收

不规定新 ledger 或公共 schema；优先复用已有 sources、registration_inputs 与 evidence，只补需要的构建来源证据/明确文件集合。本文表格是固定证据，不是要求开发通用解释器。

1. **输入集合**：核 repository/revision、正式 config（Nginx 则 auto/configure→sources/modules/platform 链）和清单中文件在固定 tree。从该清单选择已核注册源；其余帮助源仍保留在构建证据，不能丢掉后声称“完整 source 清单”。未知变量表达式、缺失 source、未核生成注册输入保留 pending，不回退全树扫描。
2. **owner 正向绑定**：每个正式 module name 对应真实 ngx_module_t；commands 为已核数组或显式 NULL。数组的跨文件 include/宏只接受已明确的输入形态；未知拒绝。Nginx ngx_event.c 两个 owner/数组都要消费；postgres 不从 addon 名推导 owner。
3. **条件不丢失**：将构建父条件/平台/静态动态分支与 compile_guards 同时保留为证据。scope 的含义是固定发行源码的条件注册并集，不是本机已编译集合。平台 probe 未运行不必阻塞已核条件路径，但依赖/路径尚未核实不能被该规则掩盖。
4. **逐条回归**：按 component+owner+array+file+注册位置比较输入/输出集合，另核 name、flags/context、callback、post 和 guards，不仅比较总数。未支持项报告确切路径/表达式；错误不转换为0条。本文快照724与255用于复核结果，不写死产品数量。
5. **零注册/排除**：用 NULL commands 或正式 config 未链接的正向证据，不能用 regex 零命中置 complete。测试 fake-shm 和辅助库不冒充发行指令；生成模块聚合 C 不能重复生成目录条目。
6. **完成判据**：本次映射可供实施冻结；相应来源的正式源→owner→commands 关系全部消费、差异可解释、未知保留后，才可更新其范围状态。全 C01 仍取决于主线程 patch/Redis 差异及剩余来源核验，不硬编码 scope_complete=true/false。产品 gate 未实现、未编译、未验收部署均不得借本文宣称完成。

本次验证仅只读固定 Git blob、正式配置和 catalog，以已有严格 extractor 对已核输入进行内存复核；未生成本地临时产物。HTTP Lua 全树对比出现的 fake-shm 额外数组已沿其独立 config 定位，排除后正式79条逐项一致。本文只提供研究与最小实施边界，不改变既有冻结方案。

## 7. 后续补核：发行条件与生成输入

本节只细化既有缺口，不扩大范围或改变724条映射。官方文档仓库已独立核到 `e8b581903e9d41252720053311cea687a5671674` 且工作树 clean；当前 documentation_sources 已启用。它是文档证据源，不是构建输入或新发行下载项；本研究不依赖此前 API 对象缓存，也不改主线程 C02 文档/handler 内容。

### DTrace 是额外条件路径，不是默认缺失生成文件

[固定 OpenResty util/mirror-tarballs:251–253](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/mirror-tarballs#L251) 中应用 DTrace patch 的三行全部注释。因此不能因仓库保存历史 dtrace.patch，就把它接入本发行的有效补丁集合。本次仅读取脚本，未执行 mirror-tarballs。

[HTTP Lua probe header:16](https://github.com/openresty/lua-nginx-module/blob/ea09d92adf835e30cab8d79343c7b8266e888128/src/ngx_http_lua_probe.h#L16) 明确在 `defined(NGX_DTRACE) && NGX_DTRACE` 下包含 `ngx_dtrace_provider.h`，else 分支将 probe 宏定义为空；这是两条实际分支的正向证据。该已提交的 probe header 被 [正式 module.c:27](https://github.com/openresty/lua-nginx-module/blob/ea09d92adf835e30cab8d79343c7b8266e888128/src/ngx_http_lua_module.c#L27) 包含。provider 文件声明的是探针参数，不是 ngx_module_t 或配置注册容器。

最小 gate：默认发行路径不能把有条件的 provider header 报成无条件缺失；也不能替用户自定义 NGX_DTRACE=1 或额外打补丁的路径宣称闭合。后一种输入需要其真实生成规则/补丁证据，否则保留条件未核。HTTP Lua config 写入 provider/tapset 变量本身，不足以证明 Nginx make 链消费了它们。

### encrypted-session 的 OpenSSL 来源闭合至发行配置，不闭合至实际编译

[cipher.h:7](https://github.com/openresty/encrypted-session-nginx-module/blob/0f81b5728db0ece0f60c72354da69f158dc1d2a7/src/ngx_http_encrypted_session_cipher.h#L7) 和 cipher.c 的 EVP 调用给出真实 OpenSSL 依赖；addon config 内被注释的 CORE_LIBS 不能当链接证据。正式发行链为：

1. [OpenResty util/configure:587–590](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/configure#L587) 在未明确禁用/启用 HTTP SSL 时追加 `--with-http_ssl_module`。
2. [Nginx auto/modules:713](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L713) 的 HTTP_SSL=YES 分支设置 USE_OPENSSL=YES；[auto/lib/conf](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/lib/conf) 随之读取 [auto/lib/openssl/conf](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/lib/openssl/conf)，分别处理指定 OpenSSL 树或系统库探测与链接参数。
3. [OpenResty util/configure:310–312](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/configure#L310) 解析 `--without-http_ssl_module` 时同时设置 no_http_encrypted_session；no_ndk 的联动禁用另在 :536–546，沿用已核 NDK 结论，不重做。

因此可以陈述“固定 OpenResty 默认配置组合提供 OpenSSL 构建依赖路径；禁用 HTTP SSL 会禁用 encrypted-session”，不能陈述“任意独立 addon 配置自动找到 SSL”或“本机已经编译验证”。库版本、探测结果、最终部署仍未知。

### Lua autoconf 的实际 include 入口

[HTTP Lua common.h:12](https://github.com/openresty/lua-nginx-module/blob/ea09d92adf835e30cab8d79343c7b8266e888128/src/ngx_http_lua_common.h#L12) 与 [stream Lua common.h:20](https://github.com/openresty/stream-lua-nginx-module/blob/69f0cd762112a6e0cddb07f2b5192e9a65034a93/src/ngx_stream_lua_common.h#L20) 分别包含本组件的 autoconf.h。两 config 的已核末行生成固定注释，因此这些路径是“有明确生成者的普通头依赖”，不是待扩展 commands 宏。gate 可记录此生成边；无需运行生成器或为了消除缺文件在源仓库补文件。完整传递头图仍未构建，第5节对未知宏/跨文件注册的拒绝边界保持不变。

## 8. HTTP_STATUS 的缺失源例外与固定集合门禁

这是**有消费者但没有正式启用入口的条件分支**，不是“变量未消费”，也不能泛化为“默认 NO 的模块都排除”。固定 Nginx revision `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928` 的证据如下：

- [auto/modules:630–638](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L630) 在 HTTP_STATUS=YES 时明确声明 ngx_http_status_module、src/http/modules/ngx_http_status_module.c 并调用 auto/module。对固定 tree 的该精确路径执行 ls-tree，结果为空：引用存在，文件缺失。
- [auto/options:80](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/options#L80) 无条件赋 HTTP_STATUS=NO；[唯一对应参数 :271](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/options#L271) 是 --without-http_status_module，再赋 NO。固定 auto 树对此变量的四处引用正是这两处赋值和 auto/modules 的条件/link，没有 with/YES 写入。
- [auto/configure:11](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/configure#L11) 先执行 auto/options，再进入后续构建链；因此仅预置同名环境变量不能绕过该无条件初始化。[固定 OpenResty util/configure](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/configure) 也没有 HTTP_STATUS/http_status_module 引用。

上述初始化、参数分支、执行顺序及实际消费块合起来，支持将**该固定来源、该精确条件、该精确缺失路径**标为“标准配置入口不可启用的已核例外”。不能为缺失文件伪造 owner 或注册；不能把文件缺失自动视为无指令；用户改脚本/额外注入赋值的构建不在此结论内。HTTP_STUB_STATUS 是另一开关，不受此例外影响。

不做通用 shell 解释器的最小冻结方法：

1. 对固定 revision 的正式构建文件，冻结人工核过的**分支并集源码清单**及其 owner/条件关系；集合包括 --with、dynamic、平台探测、特性派生和正式 test-build 分支，不按当前机器或默认选项过滤。HTTP_SSL、HTTP_V2/V3、Perl、MAIL、STREAM 等默认 NO 但可正式启用的路径必须保留。
2. lexical union 仅用于发现新增路径/变量并与该清单对账，不负责证明可达性。每个候选必须落入“正式可启用路径”“有固定正证据的精确排除例外”或“未解 pending”；HTTP_STATUS 单列到第二类，而不是从候选集合静默删掉。
3. 当前已核 source/owner 映射作为显式数据复用现有配置或证据字段；对上述例外同时绑定条件块、初始化/参数证据与缺失路径。最小 gate 校验固定 blob/集合是否仍一致、输入是否全部有归属、已纳入源是否存在及其 owner/commands 是否匹配；无需求值任意 shell。
4. revision 或构建文件变化、出现新的赋值/启用入口、候选源不在冻结集合、未知变量展开时拒绝沿用 complete 并要求复核；不能自动学习排除项，也不能仅因为默认 NO 或路径缺失自动忽略。整个 scope 的完成状态取决于全部候选是否可解释，不写死 true/false。

本节仅补充上述例外和集合冻结方式，不增加文件、产品字段要求或实施脚本，不改变其余已核映射。

