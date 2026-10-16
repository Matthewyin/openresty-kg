# P19 Stream Lua完整49项实施及隔离验证

## L-R03/L-R04最小修正（2026-10-13，主执行）

lua_socket_log_errors新增固定socket_tcp.c2812–2826的closed分支来源，绑定限制及patch_status；lua_code_cache只把执行入口get_lua_vm更正为create_ctx，并将既有util.h片段起点289前移至283包含真实定义。主已逐行读取两段源码，其他47对象不变。新JSON SHA256 ca57063010ee34c1cf888b50e424e4a915f5ee6b6b7572cb09891b9251b2c50b，交独立差异复核；下文保留原准备记录。

## 冻结候审

JSON SHA-256：76918127a78d92d616cee6f92ab0a4af2655b304ce57804124c80bb80983b4a8。ngx_stream_lua_module固定50身份减正式已有preread_by_lua_block得到49；逐身份差集与catalog相等。仅新增analysis/content/STREAM_LUA_BASIC.json与本记录，P18 HTTP71已另批冻结，不夹带到本次输入。P20/P21/P22归主，未交叉；下一批P23按计划四owner分别准备。

## 固定来源与方法

Stream Lua 69f0cd762112a6e0cddb07f2b5192e9a65034a93，HTTP Lua ea09d92adf835e30cab8d79343c7b8266e888128（仅供固定移植文档引用，不把其C实现作为Stream使用处）；Nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928；OpenResty 8c37412c31621225e7aa7e825b5b50106c9c71c4。本地固定git show与git archive，不下载，不执行来源生成器、Nginx/OpenResty/Lua或外部服务。research的一手证据方法落实到每条配置callback、真实post、merge和使用链，不创建嵌套Agent。

Stream文档真实文件README.md，126–185明确移植说明，5项有本域独立正文，44项使用固定HTTP README对应正文作为移植说明，实际注册/context/行为仍以Stream源码为准；文档目录不单独充当逐义实现证据。540处显式来源，发布另加49 distribution-version共589。Stream固定快照376片段、22文件字节及真实EOF核验相等，owner源码SHA 1dc0f7ce6b4d1b482fe066f5fd97629c7a11af1cd583a9a9568aca98f4e3b6cc。发行util/mirror-tarballs633–639只有该组件版本、解包及重命名，无直接patch调用；本轮只读取，不执行。

## 本域关键事实与差异

- module.c484–510实际ctx及生命周期，只挂init_process，无HTTP rewrite/access/filter以及exit_worker指令；18个脚本身份分别核callback/block委派/post加载与真实运行入口，其余31个配置项沿字段核消费。
- init在无共享区postconfiguration调用，有共享区等全部init完成；test/signaller跳过，关闭code cache的真实连接独立VM仍会调用init。init_worker普通cache helper排除、privileged agent宏例外，脚本返回值未传播给core。
- preread真实挂NGX_STREAM_PREREAD_PHASE，默认首次进入移到阶段末端，peek等待更多数据返回AGAIN。receive消耗预读缓冲，不能把消费后的数据保证留给proxy；不改已有preread_by_lua_block正文。
- content配置实际设置stream core server handler，不能与同server proxy_pass等内容入口并置理解成顺序执行；代码处理会话数据而不是HTTP请求/响应。log挂Stream LOG链且同步lua_pcall，不能yield/继续输出。
- balancer固定初始化round-robin，不保存HTTP Lua那样的任意原算法，也没有HTTP占位server插入；实际get/free与TLS session分支独立核。动态peer的TLS session set/save仍TODO，不承诺复用。发行stream_balancer_export公开RR TLS函数、balancer_status_code使proxy识别特殊Stream状态，不能称作HTTP响应码。
- 下游SSL脚本merge在固定Nginx>=1.25.5分支外层要求已有sscf->ssl.ctx，才做脚本继承/安装。不是HTTP所有无SSL server报错的完全相同控制流；ClientHello要求1.1.1、certificate要求1.0.2e并拒绝LibreSSL，yield仍依宏及库支持。
- Stream cosocket默认协议掩码为SSLv3/TLSv1/TLSv1.1/TLSv1.2，枚举可在宏可用时接受TLS1.3但默认未加入；记录固定事实，不提供启用旧协议的建议，不保证运行库仍支持SSLv3。lua_ssl_*是NGX_SSL_CLIENT路径，verify由Lua握手参数控制。
- lua_ssl_conf_command实际TAKE2；post完整绑定平台检查。create_srv_conf未给ssl_conf_commands置UNSET_PTR，pcalloc保留NULL，merge_ptr只合并UNSET_PTR，故不能照搬HTTP的整组继承文案；Nginx当前keyval setter支持NULL并创建数组，不误报为NULL配置崩溃。可选完整继承仍标unverified。
- lua_load_resty_core仅deprecated警告并返回OK，VM无条件require resty.core，off不起禁用作用。regex注册本身受NGX_PCRE保护，不同于HTTP无PCRE时专用callback返回OK。
- lua_shared_dict最小8192、名称非空且本域重复拒绝，tag为Stream Lua，不假设HTTP同名区域共享。lua_capture_error_log占用cycle唯一handler，另一域已挂会拒绝；共享宏larger_max_error_str影响最小容量检查。
- lua_add_variable按CHANGEABLE|WEAK注册、缺getter置not_found；core拒绝已有不可变变量，不能照抄README“已有则什么也不做”。本域FFI setter为实际赋值使用处。
- socket send_timeout除cosocket外还控制本域Lua输出write等待；lowat补齐module64–65 post和实际TCP/输出消费。connect_timeout还用于TLS AGAIN计时，read_timeout不等于core preread_timeout，pool大小不是全部活动连接上限。
- malloc_trim只在已挂接Lua LOG handler时计数；默认1000赋值本身不设置requires_log，不把该默认阈值写成无条件周期执行。

## 完整49项证据索引

注册均在src/ngx_stream_lua_module.c。逐项syntax、phase、编译条件及限制来源绑定见JSON；默认未知25项、继承49项明确unverified，不从HTTP稿猜本域可选事实。

| lua_load_resty_core | 96–101 | ngx_stream_lua_load_resty_core src/ngx_stream_lua_directive.c:180–190 | src/ngx_stream_lua_util.c:3367–3381 |
| lua_max_running_timers | 103–108 | ngx_conf_set_num_slot src/core/ngx_conf_file.c:1167–1194 | src/ngx_stream_lua_timer.c:600–625；src/ngx_stream_lua_timer.c:562–766 |
| lua_max_pending_timers | 110–115 | ngx_conf_set_num_slot src/core/ngx_conf_file.c:1167–1194 | src/ngx_stream_lua_timer.c:180–202 |
| lua_shared_dict | 117–122 | ngx_stream_lua_shared_dict src/ngx_stream_lua_directive.c:72–153 | src/ngx_stream_lua_shdict.c:78–131；src/ngx_stream_lua_shdict.c:322–387；src/ngx_stream_lua_api.c:90–157 |
| lua_sa_restart | 124–129 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | src/ngx_stream_lua_initworkerby.c:87–91；src/ngx_stream_lua_util.c:3653–3676 |
| lua_capture_error_log | 131–136 | ngx_stream_lua_capture_error_log src/ngx_stream_lua_directive.c:1190–1253 | src/ngx_stream_lua_log.c:328–348；src/ngx_stream_lua_log_ringbuf.c:164–194；src/core/ngx_log.c:95–196；src/core/ngx_log.h:76–76 |
| lua_regex_cache_max_entries | 139–144 | ngx_conf_set_num_slot src/core/ngx_conf_file.c:1167–1194 | src/ngx_stream_lua_regex.c:978–988 |
| lua_regex_match_limit | 146–151 | ngx_conf_set_num_slot src/core/ngx_conf_file.c:1167–1194 | src/ngx_stream_lua_regex.c:207–217；src/ngx_stream_lua_regex.c:480–496 |
| lua_package_cpath | 154–159 | ngx_stream_lua_package_cpath src/ngx_stream_lua_directive.c:193–212 | src/ngx_stream_lua_util.c:287–302；src/ngx_stream_lua_util.c:142–179 |
| lua_package_path | 161–166 | ngx_stream_lua_package_path src/ngx_stream_lua_directive.c:215–234 | src/ngx_stream_lua_util.c:271–285；src/ngx_stream_lua_util.c:142–179 |
| lua_code_cache | 168–174 | ngx_stream_lua_code_cache src/ngx_stream_lua_directive.c:156–177 | src/ngx_stream_lua_util.h:289–385；src/ngx_stream_lua_cache.c:226–317 |
| lua_socket_log_errors | 177–183 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | src/ngx_stream_lua_socket_tcp.c:1831–1868；src/ngx_stream_lua_socket_tcp.c:3420–3437；src/ngx_stream_lua_socket_tcp.c:3458–3475 |
| init_by_lua_block | 185–190 | ngx_stream_lua_init_by_lua_block src/ngx_stream_lua_directive.c:602–618 | src/ngx_stream_lua_directive.c:621–666；src/ngx_stream_lua_directive.c:776–933；src/ngx_stream_lua_initby.c:24–35；src/ngx_stream_lua_module.c:526–532；src/ngx_stream_lua_module.c:594–659；src/ngx_stream_lua_api.c:196–218；src/ngx_stream_lua_util.h:308–373 |
| init_by_lua | 192–197 | ngx_stream_lua_init_by_lua src/ngx_stream_lua_directive.c:621–666 | src/ngx_stream_lua_initby.c:24–35；src/ngx_stream_lua_module.c:526–532；src/ngx_stream_lua_module.c:594–659；src/ngx_stream_lua_api.c:196–218；src/ngx_stream_lua_util.h:308–373 |
| init_by_lua_file | 199–204 | ngx_stream_lua_init_by_lua src/ngx_stream_lua_directive.c:621–666 | src/ngx_stream_lua_initby.c:38–48；src/ngx_stream_lua_module.c:526–532；src/ngx_stream_lua_module.c:594–659；src/ngx_stream_lua_api.c:196–218；src/ngx_stream_lua_util.h:308–373 |
| init_worker_by_lua_block | 206–211 | ngx_stream_lua_init_worker_by_lua_block src/ngx_stream_lua_directive.c:669–685 | src/ngx_stream_lua_directive.c:688–727；src/ngx_stream_lua_directive.c:776–933；src/ngx_stream_lua_initworkerby.c:327–338；src/ngx_stream_lua_initworkerby.c:53–96；src/ngx_stream_lua_initworkerby.c:290–311；src/core/ngx_cycle.h:20–40；src/os/unix/ngx_process_cycle.c:889–903 |
| init_worker_by_lua | 213–218 | ngx_stream_lua_init_worker_by_lua src/ngx_stream_lua_directive.c:688–727 | src/ngx_stream_lua_initworkerby.c:327–338；src/ngx_stream_lua_initworkerby.c:53–96；src/ngx_stream_lua_initworkerby.c:290–311；src/core/ngx_cycle.h:20–40；src/os/unix/ngx_process_cycle.c:889–903 |
| init_worker_by_lua_file | 220–225 | ngx_stream_lua_init_worker_by_lua src/ngx_stream_lua_directive.c:688–727 | src/ngx_stream_lua_initworkerby.c:341–351；src/ngx_stream_lua_initworkerby.c:53–96；src/ngx_stream_lua_initworkerby.c:290–311；src/core/ngx_cycle.h:20–40；src/os/unix/ngx_process_cycle.c:889–903 |
| preread_by_lua_file | 228–233 | ngx_stream_lua_preread_by_lua src/ngx_stream_lua_directive.c:262–355 | src/ngx_stream_lua_prereadby.c:153–191；src/ngx_stream_lua_module.c:536–547；src/ngx_stream_lua_prereadby.c:24–123；README.md:187–208 |
| content_by_lua | 245–250 | ngx_stream_lua_content_by_lua src/ngx_stream_lua_directive.c:376–483 | src/ngx_stream_lua_contentby.c:255–279；src/ngx_stream_lua_directive.c:471–482；src/ngx_stream_lua_contentby.c:157–208 |
| content_by_lua_block | 253–258 | ngx_stream_lua_content_by_lua_block src/ngx_stream_lua_directive.c:357–373 | src/ngx_stream_lua_directive.c:376–483；src/ngx_stream_lua_directive.c:776–933；src/ngx_stream_lua_contentby.c:255–279；src/ngx_stream_lua_directive.c:471–482；src/ngx_stream_lua_contentby.c:157–208 |
| content_by_lua_file | 261–266 | ngx_stream_lua_content_by_lua src/ngx_stream_lua_directive.c:376–483 | src/ngx_stream_lua_contentby.c:213–252；src/ngx_stream_lua_directive.c:471–482；src/ngx_stream_lua_contentby.c:157–208 |
| log_by_lua_block | 271–277 | ngx_stream_lua_log_by_lua_block src/ngx_stream_lua_directive.c:486–502 | src/ngx_stream_lua_directive.c:505–597；src/ngx_stream_lua_directive.c:776–933；src/ngx_stream_lua_logby.c:146–170；src/ngx_stream_lua_module.c:551–571；src/ngx_stream_lua_logby.c:74–143；src/ngx_stream_lua_logby.c:210–273 |
| log_by_lua_file | 279–285 | ngx_stream_lua_log_by_lua src/ngx_stream_lua_directive.c:505–597 | src/ngx_stream_lua_logby.c:173–207；src/ngx_stream_lua_module.c:551–571；src/ngx_stream_lua_logby.c:74–143；src/ngx_stream_lua_logby.c:210–273 |
| preread_by_lua_no_postpone | 287–292 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | src/ngx_stream_lua_prereadby.c:24–123 |
| balancer_by_lua_block | 294–299 | ngx_stream_lua_balancer_by_lua_block src/ngx_stream_lua_balancer.c:118–134 | src/ngx_stream_lua_balancer.c:137–223；src/ngx_stream_lua_directive.c:776–933；src/ngx_stream_lua_balancer.c:96–115；src/ngx_stream_lua_balancer.c:226–238；src/ngx_stream_lua_balancer.c:241–293；src/ngx_stream_lua_balancer.c:296–393；src/ngx_stream_lua_balancer.c:396–448；src/ngx_stream_lua_balancer.c:476–505；src/stream/ngx_stream_proxy_module.c:732–758；src/stream/ngx_stream_upstream_round_robin.h:138–147 |
| balancer_by_lua_file | 301–306 | ngx_stream_lua_balancer_by_lua src/ngx_stream_lua_balancer.c:137–223 | src/ngx_stream_lua_balancer.c:76–93；src/ngx_stream_lua_balancer.c:226–238；src/ngx_stream_lua_balancer.c:241–293；src/ngx_stream_lua_balancer.c:296–393；src/ngx_stream_lua_balancer.c:396–448；src/ngx_stream_lua_balancer.c:476–505；src/stream/ngx_stream_proxy_module.c:732–758；src/stream/ngx_stream_upstream_round_robin.h:138–147 |
| lua_socket_keepalive_timeout | 309–315 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | src/ngx_stream_lua_socket_tcp.c:5263–5280；src/ngx_stream_lua_socket_tcp.c:5224–5493 |
| lua_socket_connect_timeout | 317–323 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | src/ngx_stream_lua_socket_tcp.c:1070–1100；src/ngx_stream_lua_socket_tcp.c:1495–1505；src/ngx_stream_lua_socket_tcp.c:1757–1770；src/ngx_stream_lua_socket_tcp.c:3350–3372 |
| lua_socket_send_timeout | 325–331 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | src/ngx_stream_lua_socket_tcp.c:1088–1093；src/ngx_stream_lua_socket_tcp.c:3558–3567；src/ngx_stream_lua_util.c:1350–1367；src/ngx_stream_lua_util.c:1540–1554；README.md:176–179 |
| lua_socket_send_lowat | 333–339 | ngx_conf_set_size_slot src/core/ngx_conf_file.c:1198–1225 | src/ngx_stream_lua_module.c:64–65；src/ngx_stream_lua_module.c:668–694；src/ngx_stream_lua_socket_tcp.c:3558–3567；src/ngx_stream_lua_util.c:1540–1554 |
| lua_socket_buffer_size | 341–347 | ngx_conf_set_size_slot src/core/ngx_conf_file.c:1198–1225 | src/ngx_stream_lua_socket_tcp.c:2226–2238；src/ngx_stream_lua_socket_tcp.c:5880–5893；src/ngx_stream_lua_socket_tcp.c:5938–5951 |
| lua_socket_pool_size | 349–355 | ngx_conf_set_num_slot src/core/ngx_conf_file.c:1167–1194 | src/ngx_stream_lua_socket_tcp.c:905–945；src/ngx_stream_lua_socket_tcp.c:5263–5280；src/ngx_stream_lua_socket_tcp.c:5375–5387 |
| lua_socket_read_timeout | 357–363 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | src/ngx_stream_lua_socket_tcp.c:1095–1100；src/ngx_stream_lua_socket_tcp.c:2759–2764；src/ngx_stream_lua_socket_tcp.c:3366–3371 |
| lua_check_client_abort | 366–372 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | src/ngx_stream_lua_contentby.c:99–131；src/ngx_stream_lua_socket_tcp.c:2714–2734；src/ngx_stream_lua_socket_tcp.c:3044–3069；src/ngx_stream_lua_util.c:3000–3063 |
| lua_ssl_protocols | 378–383 | ngx_conf_set_bitmask_slot src/core/ngx_conf_file.c:1389–1431 | src/ngx_stream_lua_module.c:77–87；src/ngx_stream_lua_module.c:1066–1068；src/event/ngx_event_openssl.c:296–399；src/ngx_stream_lua_socket_tcp.c:1628–1638 |
| lua_ssl_ciphers | 385–390 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | src/ngx_stream_lua_module.c:1078–1086；src/ngx_stream_lua_module.c:1113–1118；src/ngx_stream_lua_socket_tcp.c:1628–1638 |
| ssl_client_hello_by_lua_block | 392–397 | ngx_stream_lua_ssl_client_hello_by_lua_block src/ngx_stream_lua_ssl_client_helloby.c:74–90 | src/ngx_stream_lua_ssl_client_helloby.c:93–178；src/ngx_stream_lua_directive.c:776–933；src/ngx_stream_lua_ssl_client_helloby.c:52–71；src/ngx_stream_lua_module.c:875–919；src/ngx_stream_lua_ssl_client_helloby.c:181–359；src/event/ngx_event_openssl.c:1881–1942 |
| ssl_client_hello_by_lua_file | 399–404 | ngx_stream_lua_ssl_client_hello_by_lua src/ngx_stream_lua_ssl_client_helloby.c:93–178 | src/ngx_stream_lua_ssl_client_helloby.c:32–49；src/ngx_stream_lua_module.c:875–919；src/ngx_stream_lua_ssl_client_helloby.c:181–359；src/event/ngx_event_openssl.c:1881–1942 |
| ssl_certificate_by_lua_block | 406–411 | ngx_stream_lua_ssl_cert_by_lua_block src/ngx_stream_lua_ssl_certby.c:91–107 | src/ngx_stream_lua_ssl_certby.c:110–193；src/ngx_stream_lua_directive.c:776–933；src/ngx_stream_lua_ssl_certby.c:69–88；src/ngx_stream_lua_module.c:875–880；src/ngx_stream_lua_module.c:921–957；src/ngx_stream_lua_ssl_certby.c:196–372；src/event/ngx_event_openssl.c:1881–1942 |
| ssl_certificate_by_lua_file | 413–418 | ngx_stream_lua_ssl_cert_by_lua src/ngx_stream_lua_ssl_certby.c:110–193 | src/ngx_stream_lua_ssl_certby.c:49–66；src/ngx_stream_lua_module.c:875–880；src/ngx_stream_lua_module.c:921–957；src/ngx_stream_lua_ssl_certby.c:196–372；src/event/ngx_event_openssl.c:1881–1942 |
| lua_ssl_verify_depth | 421–426 | ngx_conf_set_num_slot src/core/ngx_conf_file.c:1167–1194 | src/ngx_stream_lua_module.c:1098–1105；src/event/ngx_event_openssl.c:950–961；src/ngx_stream_lua_socket_tcp.c:1693–1695；src/ngx_stream_lua_socket_tcp.c:1831–1868 |
| lua_ssl_certificate | 428–433 | ngx_conf_set_str_array_slot src/core/ngx_conf_file.c:1093–1125 | src/ngx_stream_lua_module.c:1052–1064；src/ngx_stream_lua_module.c:1088–1096；src/event/ngx_event_openssl.c:434–481；src/ngx_stream_lua_socket_tcp.c:1628–1638 |
| lua_ssl_certificate_key | 435–440 | ngx_conf_set_str_array_slot src/core/ngx_conf_file.c:1093–1125 | src/ngx_stream_lua_module.c:1052–1064；src/ngx_stream_lua_module.c:1088–1096；src/event/ngx_event_openssl.c:553–574；src/event/ngx_event_openssl.c:738–852；src/ngx_stream_lua_socket_tcp.c:1628–1638 |
| lua_ssl_trusted_certificate | 442–447 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | src/ngx_stream_lua_module.c:1098–1105；src/event/ngx_event_openssl.c:950–984；src/ngx_stream_lua_socket_tcp.c:1693–1695；src/ngx_stream_lua_socket_tcp.c:1831–1868 |
| lua_ssl_crl | 449–454 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | src/ngx_stream_lua_module.c:1107–1111；src/event/ngx_event_openssl.c:987–1029；src/ngx_stream_lua_socket_tcp.c:1693–1695；src/ngx_stream_lua_socket_tcp.c:1831–1868 |
| lua_ssl_conf_command | 457–462 | ngx_conf_set_keyval_slot src/core/ngx_conf_file.c:1129–1163 | src/ngx_stream_lua_module.c:68–69；src/ngx_stream_lua_module.c:1123–1131；src/ngx_stream_lua_module.c:805–856；src/ngx_stream_lua_module.c:981–988；src/ngx_stream_lua_module.c:1113–1118；src/core/ngx_conf_file.h:210–213；src/core/ngx_conf_file.c:1129–1163；src/event/ngx_event_openssl.c:1595–1664 |
| lua_malloc_trim | 466–471 | ngx_stream_lua_malloc_trim src/ngx_stream_lua_module.c:1136–1168 | src/ngx_stream_lua_module.c:551–571；src/ngx_stream_lua_logby.c:74–143 |
| lua_add_variable | 473–478 | ngx_stream_lua_add_variable src/ngx_stream_lua_directive.c:1300–1335 | src/ngx_stream_lua_directive.c:1290–1297；src/ngx_stream_lua_variable.c:67–211；src/stream/ngx_stream_variables.c:149–218 |

## 实际发行patch比较

临时Nginx archive上实际应用34patch、142hunk及server_header替换，offset/fuzz与既有审计逐项相等、47最终文件SHA匹配。50段Nginx片段37保持、13变化，关联10项verified_affected，其余39仅明确事实verified_unaffected。

- balancer_by_lua_block / implementation-9：src/stream/ngx_stream_upstream_round_robin.h:138–147；首次 stream_balancer_export
- balancer_by_lua_file / implementation-7：src/stream/ngx_stream_upstream_round_robin.h:138–147；首次 stream_balancer_export
- balancer_by_lua_block / implementation-8：src/stream/ngx_stream_proxy_module.c:732–758；首次 balancer_status_code
- balancer_by_lua_file / implementation-6：src/stream/ngx_stream_proxy_module.c:732–758；首次 balancer_status_code
- init_worker_by_lua_block / implementation-5：src/core/ngx_cycle.h:20–40；首次 privileged_agent_process
- init_worker_by_lua / implementation-3：src/core/ngx_cycle.h:20–40；首次 privileged_agent_process
- init_worker_by_lua_file / implementation-3：src/core/ngx_cycle.h:20–40；首次 privileged_agent_process
- lua_capture_error_log / implementation-2：src/core/ngx_log.c:95–196；首次 intercept_error_log
- lua_capture_error_log / implementation-3：src/core/ngx_log.h:76–76；首次 larger_max_error_str
- ssl_client_hello_by_lua_block / implementation-5：src/event/ngx_event_openssl.c:1881–1942；首次 ssl_cert_cb_yield
- ssl_client_hello_by_lua_file / implementation-3：src/event/ngx_event_openssl.c:1881–1942；首次 ssl_cert_cb_yield
- ssl_certificate_by_lua_block / implementation-6：src/event/ngx_event_openssl.c:1881–1942；首次 ssl_cert_cb_yield
- ssl_certificate_by_lua_file / implementation-4：src/event/ngx_event_openssl.c:1881–1942；首次 ssl_cert_cb_yield

SSL三yield补丁全文绑定；本域组件快照未直接打补丁与共享Nginx真实变化分开记录，不将前者外推成整体无影响。

## 691冻结基线隔离

避开用户通知的677→691根发布窗口；发布完成后读取并确认knowledge数量与current.coverage一致：691/1.27.1.1-2a787ebf4c204bed。仅临时目录叠49，release 1.27.1.1-8af97ed457b34c61；使用既有build.mjs及validatePublication但输入配置、knowledge和输出均位于临时目录，不运行根build。

1017注册、740基础、0深度、277仅注册（临时结果）。49详情字段/phase/callback symbol/guards匹配；589来源固定SHA、原文、物理EOF和URL锚点相等；其余968详情除release_id全保持（包括既有preread_by_lua_block），8参考对象保持。构建窗口根knowledge/current字节相同。

patch、组件快照和构建临时目录全部finally清理。没有运行网络连接、TLS握手、数据库/邮件/认证服务、Lua代码或凭据读取。以上为静态源码/发行比较与网站隔离实证，不提升deep_verified，候独立审核；新finding按指定项最小修复。
