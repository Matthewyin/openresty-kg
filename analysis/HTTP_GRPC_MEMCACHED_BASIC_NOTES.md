# P05 gRPC28与内置memcached11实施及隔离验证

## 2026-10-12 SNI条件差异

R32主线程只将grpc_ssl_server_name的IPv4泛称收窄为名称空、首字符[或ngx_inet_addr结果不等于INADDR_NONE；固定共享upstream.c:1857–1948及core/ngx_inet.c:20–60支持该条件。其他38项及全部来源保持，修后SHA为fa7040f3d3def0d586802ec69c8e9feeeea01185438ceb33f047f439aa2a1730；待独立差异复核，不重跑整批。

## 结论与独立写集

完整39身份已完成中文功能、语法、限制、真实配置入口、固定源码/文档/发行patch绑定；静态检查和隔离网站构建通过，冻结候独立审核，未合入正式知识。仅新增analysis/content/HTTP_GRPC_MEMCACHED_BASIC.json及本记录；不修改其他批次、shared/current、配置、脚本或源仓库，不创建嵌套Agent。

JSON SHA-256：6868c0a5db6945639a91983abd8d07d822c19b2be0240429131ecc3f307f8759。

先核对uWSGI最终文件：cache_valid按配置数组顺序首匹配，前置any遮蔽后续具体状态，修正已包含在最终JSON dbc8d988bed959b843f00447745b9bc4d0f8ad83b1ec7cec517d08d645a8cac0；对应NOTES a2c4be2ac9fa4f43d80f2d1735d606d9d9331a0d9d91744c29d87353b52f485a。本轮没有修改uWSGI或SCGI。

## 固定来源与核定方法

- Nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928，版本1.27.1。
- nginx-docs e8b581903e9d41252720053311cea687a5671674；xml/en/docs/http/ngx_http_grpc_module.xml与ngx_http_memcached_module.xml。
- OpenResty 8c37412c31621225e7aa7e825b5b50106c9c71c4，版本1.27.1.1；util/mirror-tarballs及固定发行patch。

按research技能的一手证据方法，从本地git show SHA:path读取，逐条连接注册offset/post、完整callback定义、merge和实际使用处，不替换其他协议正文前缀。catalog精确匹配ngx_http_grpc_module28与ngx_http_memcached_module11，不包含第三方memc-nginx-module。领取时正式330项无交集；验证前主线已增至504，重新核对仍无交集，使用504快照隔离验证，未回滚主线。

442处显式来源逐一核验固定SHA、行范围及物理EOF：357处Nginx、39处文档、46处OpenResty。严格去除一个末尾LF后计算物理行，不把末尾空分段当新行。下文H=src/http/modules/ngx_http_grpc_module.c，M=src/http/modules/ngx_http_memcached_module.c，U=src/http/ngx_http_upstream.c，O=src/event/ngx_event_openssl.c。

## 协议专属调用链与边界

### gRPC

- H460–488模块归属及配置回调，H559–601将配置和create_request/reinit_request/process_header/abort/finalize接入upstream，设置request_body_no_buffering=1。grpc_pass在H4749–4847安装handler；core1252–1262/1381–1383证明content调用。其他27项phase=configuration只表示配置入口，不否认运行期效果。
- H491–500发HTTP/2连接前言、SETTINGS及WINDOW_UPDATE；H898–986编码:method/:scheme/:path/:authority；H1357–1438按连接/流窗口发送DATA。:path取请求URI，不是proxy_pass式目标URI替换，也不是JSON/Protobuf转换。auto/modules773–781要求HTTP_GRPC与HTTP_V2，grpcs另需SSL。
- H503–513默认请求头包含Content-Length及TE变量，连接专属头值为空；H4286–4315仅在客户端TE含trailers时产生内部trailers值。H4547–4572按整组继承配置headers，H4617–4626识别显式Host并抑制自动:authority，H4661–4675即使空值仍登记抑制哈希，H996–1078执行脚本及原始头过滤。
- H1826–1905解析HTTP/2 :status并调用共享响应头handler，grpc_next_upstream针对HTTP状态/传输错误，不等同于gRPC trailer中的grpc-status。H219–233有http_502/http_504及non_idempotent；H1639–1725还核定非法帧、RST_STREAM和GOAWAY边界。流式正文已发送后的重试受共享U4415–4426限制。
- H4393–4406固定非缓冲、传递请求头/正文/trailers及preserve_output，不套用CGI缓存与buffering指令。H516–525默认隐藏Date、Server和五个X-Accel头。grpc_ignore_headers的固定XML仅列Redirect/Charset，而实际U460–471共享掩码接受九种；草稿明确接受值与真正生效路径的区别，未宣称gRPC有缓存或可动态切换缓冲。
- H4469–4512真实merge→set_ssl；H4959–4963真实调用ngx_ssl_ciphers→O884–899的SSL_CTX_set_cipher_list，不覆盖TLS1.3专用ciphersuites接口。H5024–5035在宏允许时设置ALPN h2，H5037–5044随后应用SSL_CONF命令。
- 13项TLS注册guard均从catalog保留。H248–249绑定ssl_conf_command post到H4875–4883，缺SSL_CONF_FLAG_FILE时拒绝。H4965–4995区分静态证书和变量证书，U1713–1723/1951–1987证明请求期动态加载；口令读取、保留与私钥实际尝试分别核对，不承诺每次握手重读。SNI、证书链/主机名验证、信任库、CRL、session复用各接共享真实使用处，未把SNI开关等同于验证开关。

### 内置memcached

- M137–165归属，M201–231接真实请求与输入过滤回调。M175–234只允许GET/HEAD，其他方法在丢弃正文前返回405；GET/HEAD丢弃客户端正文。M696–736解析静态upstream地址并获取memcached_key索引，不提供gRPC式变量目标编译或TLS分支。
- M237–299要求非空memcached_key，按memcached转义规则产生get key\r\n，不支持set/delete等写命令，不等于第三方memc模块。M350–428解析VALUE、核对key、解析flags及长度；END映射404。gzip_flag按位与匹配后添加Content-Encoding gzip，不压缩或解压内容。
- M453–569将声明长度与\r\nEND\r\n尾部共同过滤，完整尾部后才标记连接可复用；正文尾部异常不是process_header返回INVALID_HEADER的同一路径，不能笼统称invalid_response会重试所有损坏响应。
- M44–51的next_upstream使用invalid_response及not_found；not_found映射HTTP404，U4330–4358对404使用NGX_PEER_NEXT而非失败标记。默认error/timeout，tries/累计时间/已发响应等限制仍接共享upstream。M640–693逐条核定merge，buffer_size用于非缓冲接收而不是CGI式临时文件/缓存配置。

### 共享事实与活代码

两个协议的bind、SO_KEEPALIVE、连接/发送/读取超时、重试均先经各自upstream-binding再追到共享使用处。read_timeout引用U2436–2466同时明确其中#if 0禁用定时器，不将其作为活调用；活跃等待头与非缓冲正文定时器分别在U2174–2187、3797–3815。TLS连接超时额外引用U1745–1760，不把该TLS路径套给内置memcached。

## 完整39身份证据索引

每条另有module-owner、upstream-binding、official-doc与distribution-processing；TLS项另有ssl-setup-binding。默认及继承的merge-default和source_ids详见JSON。

| 指令 | 注册 | 配置回调完整定义 | 实际实现证据 |
| --- | --- | --- | --- |
| grpc_pass | H:256–261 | ngx_http_grpc_pass H:4749–4847 | H:538–608；H:611–705；H:491–500；H:898–986；H:1186–1187；H:1357–1438；auto/modules:773–781；U:693–785；src/http/ngx_http_core_module.c:1252–1262；src/http/ngx_http_core_module.c:1381–1383 |
| grpc_bind | H:263–268 | ngx_http_upstream_bind_set_slot U:6433–6529 | U:639–646；U:6533–6582；src/event/ngx_event_connect.c:95–158 |
| grpc_socket_keepalive | H:270–275 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | U:639–646；src/event/ngx_event_connect.c:76–86 |
| grpc_connect_timeout | H:277–282 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | U:1660–1678；U:1745–1760 |
| grpc_send_timeout | H:284–289 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | U:2113–2150；H:1311–1332；H:1424–1438 |
| grpc_intercept_errors | H:291–296 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | H:1826–1884；U:2508–2517；U:2667–2759 |
| grpc_buffer_size | H:298–303 | ngx_conf_set_size_slot src/core/ngx_conf_file.c:1198–1225 | H:4393–4406；H:1619–1669；U:2394–2433；U:2474–2496；U:3070–3132 |
| grpc_read_timeout | H:305–310 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | U:2174–2187；U:2436–2466；U:3797–3815；H:1954–1991 |
| grpc_next_upstream | H:312–317 | ngx_conf_set_bitmask_slot src/core/ngx_conf_file.c:1389–1431 | H:219–233；H:599–601；H:1639–1691；H:1714–1725；U:2534–2560；U:4415–4426 |
| grpc_next_upstream_tries | H:319–324 | ngx_conf_set_num_slot src/core/ngx_conf_file.c:1167–1194 | U:805–819；U:1254–1262；U:2534–2560；U:4415–4426 |
| grpc_next_upstream_timeout | H:326–331 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | U:805–819；U:2534–2560；U:4415–4426 |
| grpc_set_header | H:333–338 | ngx_conf_set_keyval_slot src/core/ngx_conf_file.c:1129–1163 | H:503–513；H:4547–4572；H:4617–4712；H:979–1048；H:1050–1078；H:4286–4315 |
| grpc_pass_header | H:340–345 | ngx_conf_set_str_array_slot src/core/ngx_conf_file.c:1093–1125 | H:516–525；H:4514–4523；H:1886–1905；U:6667–6735；U:2906–2934 |
| grpc_hide_header | H:347–352 | ngx_conf_set_str_array_slot src/core/ngx_conf_file.c:1093–1125 | H:516–525；H:4514–4523；H:1886–1905；U:6667–6735；U:2906–2934 |
| grpc_ignore_headers | H:354–359 | ngx_conf_set_bitmask_slot src/core/ngx_conf_file.c:1389–1431 | U:460–471；H:1886–1905；H:4342–4364；H:4393–4406；U:2825–2832；U:5092–5163 |
| grpc_ssl_session_reuse | H:363–368 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | H:5017–5022；O:1668–1681；U:1725–1743；U:1836–1854 |
| grpc_ssl_protocols | H:370–375 | ngx_conf_set_bitmask_slot src/core/ngx_conf_file.c:1389–1431 | H:238–246；H:4935–4948；H:5024–5035；O:296–399 |
| grpc_ssl_ciphers | H:377–382 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | H:4944–4963；O:884–899 |
| grpc_ssl_name | H:384–389 | ngx_http_set_complex_value_slot src/http/ngx_http_script.c:242–275 | U:693–701；U:800–803；U:1705–1711；U:1857–1948；U:1792–1810 |
| grpc_ssl_server_name | H:391–396 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | U:1705–1711；U:1857–1948；H:979–986 |
| grpc_ssl_verify | H:398–403 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | H:4997–5015；U:1705–1711；U:1786–1833；O:951–984 |
| grpc_ssl_verify_depth | H:405–410 | ngx_conf_set_num_slot src/core/ngx_conf_file.c:1167–1194 | H:4997–5010；O:951–984 |
| grpc_ssl_trusted_certificate | H:412–417 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | H:4997–5010；O:951–984 |
| grpc_ssl_crl | H:419–424 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | H:4997–5015；O:988–1029 |
| grpc_ssl_certificate | H:426–431 | ngx_http_set_complex_value_zero_slot src/http/ngx_http_script.c:278–313 | H:4965–4995；U:1713–1723；U:1951–1987；O:457–476；O:578–644 |
| grpc_ssl_certificate_key | H:433–438 | ngx_http_set_complex_value_zero_slot src/http/ngx_http_script.c:278–313 | H:4965–4995；U:1951–1987；O:739–852；O:624–644 |
| grpc_ssl_password_file | H:440–445 | ngx_http_grpc_ssl_password_file H:4852–4872 | H:4976–4994；O:1199–1325；O:1329–1388；O:819–852 |
| grpc_ssl_conf_command | H:447–452 | ngx_conf_set_keyval_slot src/core/ngx_conf_file.c:1129–1163 | H:248–249；H:4875–4883；H:5024–5044；O:1596–1664 |
| memcached_pass | M:56–61 | ngx_http_memcached_pass M:696–736 | M:175–234；M:237–299；M:350–367；M:410–450；U:6322–6340；src/http/ngx_http_core_module.c:1252–1262；src/http/ngx_http_core_module.c:1381–1383 |
| memcached_bind | M:63–68 | ngx_http_upstream_bind_set_slot U:6433–6529 | U:639–646；U:6533–6582；src/event/ngx_event_connect.c:95–158 |
| memcached_socket_keepalive | M:70–75 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | U:639–646；src/event/ngx_event_connect.c:76–86；M:504–511 |
| memcached_connect_timeout | M:77–82 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | U:1660–1669；M:197–214 |
| memcached_send_timeout | M:84–89 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | M:237–299；M:629–630；U:2113–2150 |
| memcached_buffer_size | M:91–96 | ngx_conf_set_size_slot src/core/ngx_conf_file.c:1198–1225 | M:309–340；M:453–569；M:618–626；U:2394–2433；U:2474–2496；U:3070–3132 |
| memcached_read_timeout | M:98–103 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | U:2174–2187；U:2436–2466；U:3797–3815；M:453–471 |
| memcached_next_upstream | M:105–110 | ngx_conf_set_bitmask_slot src/core/ngx_conf_file.c:1389–1431 | M:44–51；M:431–450；U:2508–2517；U:2534–2560；U:4380–4426；U:4330–4358 |
| memcached_next_upstream_tries | M:112–117 | ngx_conf_set_num_slot src/core/ngx_conf_file.c:1167–1194 | U:805–819；U:1254–1262；U:2534–2560；U:4415–4426 |
| memcached_next_upstream_timeout | M:119–124 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | U:805–819；U:2534–2560；U:4415–4426 |
| memcached_gzip_flag | M:126–131 | ngx_conf_set_num_slot src/core/ngx_conf_file.c:1167–1194 | M:369–408 |

## 实际发行patch回放

在mkdtemp目录用git archive展开固定Nginx，按既有NGINX_PATCH_AUDIT顺序执行系统patch --batch --verbose -p1及已核server_header版本替换。34个patch、142个hunk全部成功；offset/fuzz逐项与审计一致，47个最终文件hash全部相等。未执行来源/回放生成器，未修改审计文件。

357处Nginx片段在每步patch后按原文实际查验：348段保持，9段首次改变如下，均为upstream_timeout_fields。

| 指令 / 证据 | 原始U范围 | 首次改变patch |
| --- | --- | --- |
| grpc_connect_timeout / implementation-0 | 1660–1678 | upstream_timeout_fields |
| grpc_connect_timeout / implementation-1 | 1745–1760 | upstream_timeout_fields |
| grpc_send_timeout / implementation-0 | 2113–2150 | upstream_timeout_fields |
| grpc_read_timeout / implementation-0 | 2174–2187 | upstream_timeout_fields |
| grpc_read_timeout / implementation-2 | 3797–3815 | upstream_timeout_fields |
| memcached_connect_timeout / implementation-0 | 1660–1669 | upstream_timeout_fields |
| memcached_send_timeout / implementation-2 | 2113–2150 | upstream_timeout_fields |
| memcached_read_timeout / implementation-0 | 2174–2187 | upstream_timeout_fields |
| memcached_read_timeout / implementation-2 | 3797–3815 | upstream_timeout_fields |

两个模块整文件在发行patch前后字节相同：

- H SHA-256：3b85b853dd67e35dd1e141b79acacb9d99b30854be560d815af8b59eb58e3022。
- M SHA-256：51270cf57b1d032b5b093cea3b65869c87100db54d75a5005cbc78a725e80618。

7项verified_affected：grpc_connect_timeout、grpc_send_timeout、grpc_intercept_errors、grpc_read_timeout、memcached_connect_timeout、memcached_send_timeout、memcached_read_timeout。grpc_intercept_errors另考虑no_error_pages的间接行为；其余32项verified_unaffected仅限各条明示事实及所引链路，不声明整个协议生命周期完全不受补丁影响。固定补丁证据为upstream_timeout_fields1–112、no_error_pages1–91。

## 隔离网站构建及回归

只在临时目录复制既有components/catalog/site/src和正式知识快照，加入本批39项，临时配置指向固定本地来源；调用现有scripts/build.mjs及内置validatePublication，不在根构建，不运行configure、Nginx/OpenResty或来源生成器，不下载。

- 正式快照504项，release 1.27.1.1-c084cd9580c5b527；临时543=504+39，release 1.27.1.1-8e7aa7f25e64b5d3。
- 临时统计：1017注册、543 basic_verified、0 deep_verified、474仅注册。这不是正式完成计数。
- 39项全部basic_verified；功能、语法、defaults、inheritance、limitations、patch_status、related逐字段等于草稿，phase、配置symbol、compile_guards与catalog/输入匹配。
- 481处发布来源=442处显式引用+39个distribution-version；固定SHA、代码原文、物理行范围及URL锚点逐一相等。
- 其余978项详情仅release_id变化，其余字段完全相同；8个reference对象不变。
- 测试前后正式knowledge/directives.json与dist/knowledge/index.json字节相同。14个受保护文件（配置、build、catalog、components及冻结proxy/upstream/FastCGI/SCGI/uWSGI的JSON和NOTES）哈希不变。
- patch与build临时目录均在finally清理，没有留下候选dist或临时配置。本批不写正式current。

## 未决与交付限制

收尾只读检查时，正式知识已由并行主线推进至516项，release 1.27.1.1-76405f32ab987818；本批39项仍无交集。上述测试前后字节保持结论对应隔离验证执行窗口，不能延伸为整轮主线未变化；543项隔离产物仅对应504快照，不声称完成516基线回归。本角色未写主线，14个受保护文件仍与领取时一致，临时目录已清空。

可选defaults仍unknown的5项：grpc_pass、grpc_set_header、grpc_pass_header、grpc_hide_header、memcached_pass。

可选inheritance仍unknown的4项：grpc_pass、grpc_pass_header、grpc_hide_header、memcached_pass。均明确unverified，不从空default猜值；其余按所引merge与使用处核定。

39项必需事实已提供，静态证据和网站发布校验不等同于真实后端/握手测试；本轮没有运行Nginx/OpenResty、gRPC或memcached服务。独立审核尚未完成，不提升deep_verified，不合并正式知识。后续只按审核具体finding修改指定项。
