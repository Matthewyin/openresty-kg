# P18 HTTP Lua完整71项实施及隔离验证

## L-R02证据补充（2026-10-13，主执行）

仅给lua_ssl_ciphers追加固定module.c1705–1713的后置命令调用及README3454–3456覆盖说明，并绑定本条limitation/patch_status来源。主已逐行读取两段原文；正文和其余70对象不变，不借另一条目引用替代本条证据。累计L-R01/L-R02修正后JSON SHA256为41329a44c5ab3d1b4a63e3591ce01f879c0f2e35c08c3cab733241d80bb72d7e，交独立差异复核。

## L-R01证据补充（2026-10-13，主执行）

仅给init_by_lua_block/init_by_lua/init_by_lua_file各追加init-mode-guard来源（固定module.c753–767）及相关limitation/patch引用。主读回真实ngx_http_lua_init入口：ngx_test_config或NGX_PROCESS_SIGNALLER直接返回NGX_OK；正文无变化，其余68对象不变。新增片段属于无直接补丁的固定Lua组件，交独立差异复核；不重复无变化全批回放。下文旧SHA及隔离结果保留为修前记录，以最新独立审核SHA为准。

## 冻结候审

JSON SHA-256：ecdaf3a6bba1a9c20d6947a21dfabb45018547c7243028e3b5af5fd4c211dd4a。ngx_http_lua_module完整79注册减正式已有8项得到71，catalog身份逐项匹配。仅新增analysis/content/HTTP_LUA_BASIC.json及本记录；未改正式knowledge/current、shared、review、配置、脚本或固定源。P20/P21归主，未交叉；P19 Stream Lua49随后独立准备。

原有8项保持：content_by_lua_block、access_by_lua_block、lua_shared_dict、lua_code_cache、lua_socket_connect_timeout、lua_socket_send_timeout、lua_socket_read_timeout、lua_load_resty_core。采用research的一手证据方法，不创建嵌套Agent。

## 固定证据

HTTP Lua ea09d92adf835e30cab8d79343c7b8266e888128（0.10.27）；Nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928；OpenResty 8c37412c31621225e7aa7e825b5b50106c9c71c4。固定README.markdown各独立正文节点与真实注册/slot offset/post绑定核对，不把目录链接当正文。发行util/mirror-tarballs619–625固定下载tag、解包、重命名流程，没有该组件直接patch步骤；本轮仅阅读，未执行下载或生成器。

728处显式引用，发布另加71处distribution-version，共799。固定git archive组件快照核验574片段、30文件全部相等；注册owner文件SHA b7a8ef1b4e2f9d6bb443099ebb9319264bbcdb0c96fdc3c8c7ef5026b8db8c05。每处引用均检查物理EOF，末尾LF不虚增行。

## 本域真实入口与限制

- module.c721–749绑定create/init/merge及init_process/exit_process。39项by-lua按真实族分别绑定配置callback、block委派解析器、cmd->post脚本加载入口和运行使用处；其余32项slot/专用callback沿字段到实际消费。没有将inline/block/file只改名称视作完成。
- init_by_lua无共享区时postconfiguration执行，有共享区时等待全部初始化；test/signaller跳过，code_cache off的每请求VM仍可调用init_handler，不能只写master一次。worker/exit worker用伪请求上下文；普通cache helper排除，发行privileged_agent宏例外。exit_worker不同于master回收子进程的proc_exit_top_handler。
- set_by_lua真实依赖NDK filter注入，lua_pcall同步取单个返回值，不支持yield。block只有目标变量/块；inline及file支持额外参数。set file与HTTP阶段file编译/求值请求变量，init/worker/balancer/SSL file只补全固定路径，不做复杂值编译。
- server rewrite、rewrite、access、content、log分别核实际注册阶段与handler。rewrite/access no_postpone是首次执行时移动phase数组的开关，不是任意模块排序承诺；content直接设置core location handler。header/body filter真实接top filter链；同步过滤器不能yield，body按块可多次调用，不误称整响应一次。
- SSL ClientHello要求OpenSSL1.1.1；certificate要求1.0.2e且已有SSL_CTX，均拒绝LibreSSL。certificate注册实际允许http/server，固定README只写server，采用注册能力并明示差异。session fetch/store只允许http；固定实现TLS>=1.3直接跳过。fetch可yield仍依赖SSL库PENDING_SESSION支持，store同步lua_pcall，不能借fetch能力替代。
- Lua cosocket的lua_ssl_*与下游by-lua握手脚本分开核；实际NGX_SSL_CLIENT连接，verify由握手调用参数决定，不因配CA/深度自动开启。lua_ssl_conf_command实际TAKE2=name/value，README单参数占位未照抄。
- timer区分pending创建限制与running执行限制；线程缓存指Lua协程对象，不是OS线程。worker_thread VM池依NGX_THREADS且有独立VM上限，不是thread_pool线程数量。
- regex无PCRE分支返回OK不说明功能可用；FFI getter暴露cache容量，固定README区分旧缓存和resty.core LRU，不一概写满后不再缓存。match_limit区分PCRE2和旧PCRE非DFA分支。
- socket_send_lowat补齐module69–70 post绑定、检查器及tcp3589真正调用；pool_size/keepalive_timeout均核setkeepalive可覆盖，buffer_size不是整响应上限。HTTP1.0缓冲只在未发头且长度未知条件成立，已给长度则跳过。
- lua_malloc_trim默认阈值初始化不自动设置requires_log；显式非0配置或其他路径使Lua log handler挂接后才计数调用malloc_trim。不能仅凭默认1000保证任意配置运行计数。

## 完整71项索引

注册均在src/ngx_http_lua_module.c；逐项syntax/phase/限制与source_ids见JSON。可选默认未核定42项、继承71项明确unverified，不制造默认脚本或跨上下文自动继承结论；不影响已提供必需事实的基础审核。

| lua_thread_cache_max_entries | 107–112 | ngx_conf_set_num_slot src/core/ngx_conf_file.c:1167–1194 | src/ngx_http_lua_module.c:1085–1098；src/ngx_http_lua_module.c:1132–1150；src/ngx_http_lua_util.c:335–365；src/ngx_http_lua_util.c:453–480 |
| lua_max_running_timers | 114–119 | ngx_conf_set_num_slot src/core/ngx_conf_file.c:1167–1194 | src/ngx_http_lua_timer.c:536–575；src/ngx_http_lua_timer.c:513–725 |
| lua_max_pending_timers | 121–126 | ngx_conf_set_num_slot src/core/ngx_conf_file.c:1167–1194 | src/ngx_http_lua_timer.c:180–200 |
| lua_capture_error_log | 135–140 | ngx_http_lua_capture_error_log src/ngx_http_lua_directive.c:1974–2036 | src/ngx_http_lua_log.c:327–347；src/core/ngx_log.c:95–196；src/core/ngx_log.h:76–76；src/ngx_http_lua_log_ringbuf.c:1–180 |
| lua_sa_restart | 142–147 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | src/ngx_http_lua_initworkerby.c:78–82；src/ngx_http_lua_util.c:4280–4305 |
| lua_regex_cache_max_entries | 149–158 | ngx_http_lua_regex_cache_max_entries src/ngx_http_lua_directive.c:241–250 | src/ngx_http_lua_regex.c:957–968 |
| lua_regex_match_limit | 160–169 | ngx_http_lua_regex_match_limit src/ngx_http_lua_directive.c:253–262 | src/ngx_http_lua_regex.c:185–205；src/ngx_http_lua_regex.c:468–486 |
| lua_package_cpath | 171–176 | ngx_http_lua_package_cpath src/ngx_http_lua_directive.c:199–217 | src/ngx_http_lua_util.c:303–318；src/ngx_http_lua_util.c:159–196 |
| lua_package_path | 178–183 | ngx_http_lua_package_path src/ngx_http_lua_directive.c:220–238 | src/ngx_http_lua_util.c:287–301；src/ngx_http_lua_util.c:159–196 |
| lua_need_request_body | 193–199 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | src/ngx_http_lua_server_rewriteby.c:101–125；src/ngx_http_lua_rewriteby.c:139–162；src/ngx_http_lua_accessby.c:134–158；src/ngx_http_lua_contentby.c:198–222 |
| lua_transform_underscores_in_response_headers | 201–207 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | src/ngx_http_lua_headers.c:963–996；src/ngx_http_lua_headers.c:1174–1195 |
| lua_socket_log_errors | 209–215 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | src/ngx_http_lua_socket_tcp.c:1920–1953；src/ngx_http_lua_socket_tcp.c:3448–3463；src/ngx_http_lua_socket_tcp.c:3487–3500；src/ngx_http_lua_socket_udp.c:814–831 |
| init_by_lua_block | 217–222 | ngx_http_lua_init_by_lua_block src/ngx_http_lua_directive.c:1216–1232 | src/ngx_http_lua_directive.c:1235–1291；src/ngx_http_lua_directive.c:1551–1716；src/ngx_http_lua_initby.c:16–36；src/ngx_http_lua_module.c:895–974；src/ngx_http_lua_api.c:175–211；src/ngx_http_lua_util.h:294–343 |
| init_by_lua | 224–229 | ngx_http_lua_init_by_lua src/ngx_http_lua_directive.c:1235–1291 | src/ngx_http_lua_initby.c:16–36；src/ngx_http_lua_module.c:895–974；src/ngx_http_lua_api.c:175–211；src/ngx_http_lua_util.h:294–343 |
| init_by_lua_file | 231–236 | ngx_http_lua_init_by_lua src/ngx_http_lua_directive.c:1235–1291 | src/ngx_http_lua_initby.c:39–49；src/ngx_http_lua_module.c:895–974；src/ngx_http_lua_api.c:175–211；src/ngx_http_lua_util.h:294–343 |
| init_worker_by_lua_block | 238–243 | ngx_http_lua_init_worker_by_lua_block src/ngx_http_lua_directive.c:1294–1310 | src/ngx_http_lua_directive.c:1313–1361；src/ngx_http_lua_directive.c:1551–1716；src/ngx_http_lua_initworkerby.c:319–338；src/ngx_http_lua_initworkerby.c:24–86；src/ngx_http_lua_initworkerby.c:270–303；src/os/unix/ngx_process_cycle.c:780–819；src/core/ngx_cycle.h:20–40；src/os/unix/ngx_process_cycle.c:889–903 |
| init_worker_by_lua | 245–250 | ngx_http_lua_init_worker_by_lua src/ngx_http_lua_directive.c:1313–1361 | src/ngx_http_lua_initworkerby.c:319–338；src/ngx_http_lua_initworkerby.c:24–86；src/ngx_http_lua_initworkerby.c:270–303；src/os/unix/ngx_process_cycle.c:780–819；src/core/ngx_cycle.h:20–40；src/os/unix/ngx_process_cycle.c:889–903 |
| init_worker_by_lua_file | 252–257 | ngx_http_lua_init_worker_by_lua src/ngx_http_lua_directive.c:1313–1361 | src/ngx_http_lua_initworkerby.c:341–351；src/ngx_http_lua_initworkerby.c:24–86；src/ngx_http_lua_initworkerby.c:270–303；src/os/unix/ngx_process_cycle.c:780–819；src/core/ngx_cycle.h:20–40；src/os/unix/ngx_process_cycle.c:889–903 |
| exit_worker_by_lua_block | 259–264 | ngx_http_lua_exit_worker_by_lua_block src/ngx_http_lua_directive.c:1364–1380 | src/ngx_http_lua_directive.c:1383–1430；src/ngx_http_lua_directive.c:1551–1716；src/ngx_http_lua_exitworkerby.c:93–112；src/ngx_http_lua_exitworkerby.c:21–90；src/os/unix/ngx_process_cycle.c:935–955；src/core/ngx_cycle.h:20–40 |
| exit_worker_by_lua_file | 266–271 | ngx_http_lua_exit_worker_by_lua src/ngx_http_lua_directive.c:1383–1430 | src/ngx_http_lua_exitworkerby.c:115–125；src/ngx_http_lua_exitworkerby.c:21–90；src/os/unix/ngx_process_cycle.c:935–955；src/core/ngx_cycle.h:20–40 |
| set_by_lua_block | 275–281 | ngx_http_lua_set_by_lua_block src/ngx_http_lua_directive.c:266–282 | src/ngx_http_lua_directive.c:285–338；src/ngx_http_lua_directive.c:1551–1716；src/ngx_http_lua_directive.c:403–436；src/ngx_http_lua_setby.c:20–113 |
| set_by_lua | 284–290 | ngx_http_lua_set_by_lua src/ngx_http_lua_directive.c:285–338 | src/ngx_http_lua_directive.c:403–436；src/ngx_http_lua_setby.c:20–113 |
| set_by_lua_file | 293–299 | ngx_http_lua_set_by_lua_file src/ngx_http_lua_directive.c:341–400 | src/ngx_http_lua_directive.c:439–488；src/ngx_http_lua_setby.c:20–113 |
| server_rewrite_by_lua_block | 303–308 | ngx_http_lua_server_rewrite_by_lua_block src/ngx_http_lua_directive.c:594–609 | src/ngx_http_lua_directive.c:612–696；src/ngx_http_lua_directive.c:1551–1716；src/ngx_http_lua_server_rewriteby.c:129–151；src/ngx_http_lua_module.c:801–809；src/ngx_http_lua_server_rewriteby.c:22–126 |
| server_rewrite_by_lua_file | 311–316 | ngx_http_lua_server_rewrite_by_lua src/ngx_http_lua_directive.c:612–696 | src/ngx_http_lua_server_rewriteby.c:154–189；src/ngx_http_lua_module.c:801–809；src/ngx_http_lua_server_rewriteby.c:22–126 |
| rewrite_by_lua | 319–325 | ngx_http_lua_rewrite_by_lua src/ngx_http_lua_directive.c:511–591 | src/ngx_http_lua_rewriteby.c:166–191；src/ngx_http_lua_module.c:811–818；src/ngx_http_lua_rewriteby.c:24–163 |
| rewrite_by_lua_block | 328–334 | ngx_http_lua_rewrite_by_lua_block src/ngx_http_lua_directive.c:492–508 | src/ngx_http_lua_directive.c:511–591；src/ngx_http_lua_directive.c:1551–1716；src/ngx_http_lua_rewriteby.c:166–191；src/ngx_http_lua_module.c:811–818；src/ngx_http_lua_rewriteby.c:24–163 |
| access_by_lua | 337–343 | ngx_http_lua_access_by_lua src/ngx_http_lua_directive.c:718–798 | src/ngx_http_lua_accessby.c:162–186；src/ngx_http_lua_module.c:820–827；src/ngx_http_lua_accessby.c:25–159 |
| content_by_lua | 355–360 | ngx_http_lua_content_by_lua src/ngx_http_lua_directive.c:820–910 | src/ngx_http_lua_contentby.c:289–313；src/ngx_http_lua_directive.c:894–909；src/ngx_http_lua_contentby.c:157–222 |
| log_by_lua | 371–377 | ngx_http_lua_log_by_lua src/ngx_http_lua_directive.c:932–1011 | src/ngx_http_lua_logby.c:139–164；src/ngx_http_lua_module.c:831–845；src/ngx_http_lua_logby.c:66–136；src/ngx_http_lua_logby.c:203–266 |
| log_by_lua_block | 380–386 | ngx_http_lua_log_by_lua_block src/ngx_http_lua_directive.c:913–929 | src/ngx_http_lua_directive.c:932–1011；src/ngx_http_lua_directive.c:1551–1716；src/ngx_http_lua_logby.c:139–164；src/ngx_http_lua_module.c:831–845；src/ngx_http_lua_logby.c:66–136；src/ngx_http_lua_logby.c:203–266 |
| rewrite_by_lua_file | 388–394 | ngx_http_lua_rewrite_by_lua src/ngx_http_lua_directive.c:511–591 | src/ngx_http_lua_rewriteby.c:194–231；src/ngx_http_lua_module.c:811–818；src/ngx_http_lua_rewriteby.c:24–163 |
| rewrite_by_lua_no_postpone | 396–401 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | src/ngx_http_lua_rewriteby.c:24–163 |
| access_by_lua_file | 403–409 | ngx_http_lua_access_by_lua src/ngx_http_lua_directive.c:718–798 | src/ngx_http_lua_accessby.c:189–230；src/ngx_http_lua_module.c:820–827；src/ngx_http_lua_accessby.c:25–159 |
| access_by_lua_no_postpone | 411–416 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | src/ngx_http_lua_accessby.c:25–159 |
| content_by_lua_file | 419–424 | ngx_http_lua_content_by_lua src/ngx_http_lua_directive.c:820–910 | src/ngx_http_lua_contentby.c:246–286；src/ngx_http_lua_directive.c:894–909；src/ngx_http_lua_contentby.c:157–222 |
| log_by_lua_file | 426–432 | ngx_http_lua_log_by_lua src/ngx_http_lua_directive.c:932–1011 | src/ngx_http_lua_logby.c:167–200；src/ngx_http_lua_module.c:831–845；src/ngx_http_lua_logby.c:66–136；src/ngx_http_lua_logby.c:203–266 |
| header_filter_by_lua | 435–441 | ngx_http_lua_header_filter_by_lua src/ngx_http_lua_directive.c:1033–1111 | src/ngx_http_lua_headerfilterby.c:157–183；src/ngx_http_lua_module.c:847–852；src/ngx_http_lua_headerfilterby.c:230–301；src/ngx_http_lua_headerfilterby.c:87–114 |
| header_filter_by_lua_block | 444–450 | ngx_http_lua_header_filter_by_lua_block src/ngx_http_lua_directive.c:1014–1030 | src/ngx_http_lua_directive.c:1033–1111；src/ngx_http_lua_directive.c:1551–1716；src/ngx_http_lua_headerfilterby.c:157–183；src/ngx_http_lua_module.c:847–852；src/ngx_http_lua_headerfilterby.c:230–301；src/ngx_http_lua_headerfilterby.c:87–114 |
| header_filter_by_lua_file | 452–458 | ngx_http_lua_header_filter_by_lua src/ngx_http_lua_directive.c:1033–1111 | src/ngx_http_lua_headerfilterby.c:186–225；src/ngx_http_lua_module.c:847–852；src/ngx_http_lua_headerfilterby.c:230–301；src/ngx_http_lua_headerfilterby.c:87–114 |
| body_filter_by_lua | 460–466 | ngx_http_lua_body_filter_by_lua src/ngx_http_lua_directive.c:1133–1213 | src/ngx_http_lua_bodyfilterby.c:147–179；src/ngx_http_lua_module.c:854–859；src/ngx_http_lua_headerfilterby.c:240–244；src/ngx_http_lua_bodyfilterby.c:230–395；src/ngx_http_lua_bodyfilterby.c:90–112 |
| body_filter_by_lua_block | 469–475 | ngx_http_lua_body_filter_by_lua_block src/ngx_http_lua_directive.c:1114–1130 | src/ngx_http_lua_directive.c:1133–1213；src/ngx_http_lua_directive.c:1551–1716；src/ngx_http_lua_bodyfilterby.c:147–179；src/ngx_http_lua_module.c:854–859；src/ngx_http_lua_headerfilterby.c:240–244；src/ngx_http_lua_bodyfilterby.c:230–395；src/ngx_http_lua_bodyfilterby.c:90–112 |
| body_filter_by_lua_file | 477–483 | ngx_http_lua_body_filter_by_lua src/ngx_http_lua_directive.c:1133–1213 | src/ngx_http_lua_bodyfilterby.c:182–227；src/ngx_http_lua_module.c:854–859；src/ngx_http_lua_headerfilterby.c:240–244；src/ngx_http_lua_bodyfilterby.c:230–395；src/ngx_http_lua_bodyfilterby.c:90–112 |
| balancer_by_lua_block | 485–490 | ngx_http_lua_balancer_by_lua_block src/ngx_http_lua_balancer.c:148–164 | src/ngx_http_lua_balancer.c:167–283；src/ngx_http_lua_directive.c:1551–1716；src/ngx_http_lua_balancer.c:125–145；src/ngx_http_lua_balancer.c:286–381；src/ngx_http_lua_balancer.c:384–519；src/ngx_http_lua_balancer.c:522–558；src/http/ngx_http_upstream.c:1553–1576 |
| balancer_by_lua_file | 492–497 | ngx_http_lua_balancer_by_lua src/ngx_http_lua_balancer.c:167–283 | src/ngx_http_lua_balancer.c:104–122；src/ngx_http_lua_balancer.c:286–381；src/ngx_http_lua_balancer.c:384–519；src/ngx_http_lua_balancer.c:522–558；src/http/ngx_http_upstream.c:1553–1576 |
| balancer_keepalive | 499–504 | ngx_http_lua_balancer_keepalive src/ngx_http_lua_balancer.c:1345–1376 | src/ngx_http_lua_balancer.c:286–340；src/ngx_http_lua_balancer.c:1020–1063；src/ngx_http_lua_balancer.c:576–740 |
| lua_socket_keepalive_timeout | 506–512 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | src/ngx_http_lua_socket_tcp.c:5396–5408；src/ngx_http_lua_socket_tcp.c:5353–5623 |
| lua_socket_send_lowat | 530–536 | ngx_conf_set_size_slot src/core/ngx_conf_file.c:1198–1225 | src/ngx_http_lua_module.c:69–70；src/ngx_http_lua_module.c:980–1006；src/ngx_http_lua_socket_tcp.c:3585–3595 |
| lua_socket_buffer_size | 538–544 | ngx_conf_set_size_slot src/core/ngx_conf_file.c:1198–1225 | src/ngx_http_lua_socket_tcp.c:2165–2175；src/ngx_http_lua_socket_tcp.c:6006–6018；src/ngx_http_lua_socket_tcp.c:6060–6075 |
| lua_socket_pool_size | 546–552 | ngx_conf_set_num_slot src/core/ngx_conf_file.c:1167–1194 | src/ngx_http_lua_socket_tcp.c:934–980；src/ngx_http_lua_socket_tcp.c:5396–5408；src/ngx_http_lua_socket_tcp.c:5353–5623 |
| lua_http10_buffering | 562–568 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | src/ngx_http_lua_util.c:580–595；src/ngx_http_lua_util.c:612–635；src/ngx_http_lua_util.c:662–693；src/ngx_http_lua_util.c:742–778 |
| lua_check_client_abort | 570–576 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | src/ngx_http_lua_contentby.c:97–126；src/ngx_http_lua_socket_tcp.c:2823–2842；src/ngx_http_lua_socket_tcp.c:3166–3192；src/ngx_http_lua_util.c:3512–3577 |
| lua_use_default_type | 578–584 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | src/ngx_http_lua_util.h:450–468 |
| lua_ssl_protocols | 588–593 | ngx_conf_set_bitmask_slot src/core/ngx_conf_file.c:1389–1431 | src/ngx_http_lua_module.c:78–88；src/ngx_http_lua_module.c:1657–1659；src/event/ngx_event_openssl.c:296–399；src/ngx_http_lua_module.c:1585–1631；src/ngx_http_lua_socket_tcp.c:1689–1697 |
| lua_ssl_ciphers | 595–600 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | src/ngx_http_lua_module.c:1670–1678；src/ngx_http_lua_module.c:1585–1631；src/ngx_http_lua_socket_tcp.c:1689–1697 |
| ssl_client_hello_by_lua_block | 602–607 | ngx_http_lua_ssl_client_hello_by_lua_block src/ngx_http_lua_ssl_client_helloby.c:76–92 | src/ngx_http_lua_ssl_client_helloby.c:95–178；src/ngx_http_lua_directive.c:1551–1716；src/ngx_http_lua_ssl_client_helloby.c:53–73；src/ngx_http_lua_module.c:1233–1272；src/ngx_http_lua_ssl_client_helloby.c:181–357；src/event/ngx_event_openssl.c:1881–1942 |
| ssl_client_hello_by_lua_file | 609–614 | ngx_http_lua_ssl_client_hello_by_lua src/ngx_http_lua_ssl_client_helloby.c:95–178 | src/ngx_http_lua_ssl_client_helloby.c:32–50；src/ngx_http_lua_module.c:1233–1272；src/ngx_http_lua_ssl_client_helloby.c:181–357；src/event/ngx_event_openssl.c:1881–1942 |
| ssl_certificate_by_lua_block | 616–621 | ngx_http_lua_ssl_cert_by_lua_block src/ngx_http_lua_ssl_certby.c:86–102 | src/ngx_http_lua_ssl_certby.c:105–185；src/ngx_http_lua_directive.c:1551–1716；src/ngx_http_lua_ssl_certby.c:62–83；src/ngx_http_lua_module.c:1274–1312；src/ngx_http_lua_ssl_certby.c:188–362；src/event/ngx_event_openssl.c:1881–1942 |
| ssl_certificate_by_lua_file | 623–628 | ngx_http_lua_ssl_cert_by_lua src/ngx_http_lua_ssl_certby.c:105–185 | src/ngx_http_lua_ssl_certby.c:41–59；src/ngx_http_lua_module.c:1274–1312；src/ngx_http_lua_ssl_certby.c:188–362；src/event/ngx_event_openssl.c:1881–1942 |
| ssl_session_store_by_lua_block | 630–635 | ngx_http_lua_ssl_sess_store_by_lua_block src/ngx_http_lua_ssl_session_storeby.c:79–95 | src/ngx_http_lua_ssl_session_storeby.c:99–170；src/ngx_http_lua_directive.c:1551–1716；src/ngx_http_lua_ssl_session_storeby.c:56–76；src/ngx_http_lua_module.c:1314–1336；src/ngx_http_lua_ssl_session_storeby.c:174–319；src/ngx_http_lua_ssl_session_storeby.c:360–418 |
| ssl_session_store_by_lua_file | 637–642 | ngx_http_lua_ssl_sess_store_by_lua src/ngx_http_lua_ssl_session_storeby.c:99–170 | src/ngx_http_lua_ssl_session_storeby.c:34–52；src/ngx_http_lua_module.c:1314–1336；src/ngx_http_lua_ssl_session_storeby.c:174–319；src/ngx_http_lua_ssl_session_storeby.c:360–418 |
| ssl_session_fetch_by_lua_block | 644–649 | ngx_http_lua_ssl_sess_fetch_by_lua_block src/ngx_http_lua_ssl_session_fetchby.c:81–97 | src/ngx_http_lua_ssl_session_fetchby.c:101–172；src/ngx_http_lua_directive.c:1551–1716；src/ngx_http_lua_ssl_session_fetchby.c:58–78；src/ngx_http_lua_module.c:1338–1359；src/ngx_http_lua_ssl_session_fetchby.c:176–383；src/event/ngx_event_openssl.c:1881–1942 |
| ssl_session_fetch_by_lua_file | 651–656 | ngx_http_lua_ssl_sess_fetch_by_lua src/ngx_http_lua_ssl_session_fetchby.c:101–172 | src/ngx_http_lua_ssl_session_fetchby.c:36–54；src/ngx_http_lua_module.c:1338–1359；src/ngx_http_lua_ssl_session_fetchby.c:176–383；src/event/ngx_event_openssl.c:1881–1942 |
| lua_ssl_verify_depth | 658–663 | ngx_conf_set_num_slot src/core/ngx_conf_file.c:1167–1194 | src/ngx_http_lua_module.c:1690–1697；src/event/ngx_event_openssl.c:950–961；src/ngx_http_lua_socket_tcp.c:1787–1787；src/ngx_http_lua_socket_tcp.c:1920–1953；src/ngx_http_lua_module.c:1585–1631；src/ngx_http_lua_socket_tcp.c:1689–1697 |
| lua_ssl_certificate | 665–670 | ngx_conf_set_str_array_slot src/core/ngx_conf_file.c:1093–1125 | src/ngx_http_lua_module.c:1643–1655；src/ngx_http_lua_module.c:1680–1688；src/event/ngx_event_openssl.c:434–481；src/ngx_http_lua_module.c:1585–1631；src/ngx_http_lua_socket_tcp.c:1689–1697 |
| lua_ssl_certificate_key | 672–677 | ngx_conf_set_str_array_slot src/core/ngx_conf_file.c:1093–1125 | src/ngx_http_lua_module.c:1643–1655；src/ngx_http_lua_module.c:1680–1688；src/event/ngx_event_openssl.c:553–574；src/event/ngx_event_openssl.c:738–852；src/ngx_http_lua_module.c:1585–1631；src/ngx_http_lua_socket_tcp.c:1689–1697 |
| lua_ssl_trusted_certificate | 679–684 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | src/ngx_http_lua_module.c:1690–1697；src/event/ngx_event_openssl.c:950–984；src/ngx_http_lua_socket_tcp.c:1787–1787；src/ngx_http_lua_socket_tcp.c:1920–1953；src/ngx_http_lua_module.c:1585–1631；src/ngx_http_lua_socket_tcp.c:1689–1697 |
| lua_ssl_crl | 686–691 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | src/ngx_http_lua_module.c:1701–1703；src/event/ngx_event_openssl.c:987–1029；src/ngx_http_lua_socket_tcp.c:1787–1787；src/ngx_http_lua_socket_tcp.c:1920–1953；src/ngx_http_lua_module.c:1585–1631；src/ngx_http_lua_socket_tcp.c:1689–1697 |
| lua_ssl_conf_command | 694–699 | ngx_conf_set_keyval_slot src/core/ngx_conf_file.c:1129–1163 | src/ngx_http_lua_module.c:90–93；src/ngx_http_lua_module.c:1705–1713；src/ngx_http_lua_module.c:1716–1725；src/event/ngx_event_openssl.c:1595–1664；src/ngx_http_lua_module.c:1585–1631；src/ngx_http_lua_socket_tcp.c:1689–1697 |
| lua_malloc_trim | 703–708 | ngx_http_lua_malloc_trim src/ngx_http_lua_module.c:1731–1763 | src/ngx_http_lua_module.c:831–845；src/ngx_http_lua_logby.c:66–108 |
| lua_worker_thread_vm_pool_size | 710–715 | ngx_conf_set_num_slot src/core/ngx_conf_file.c:1167–1194 | src/ngx_http_lua_worker_thread.c:26–32；src/ngx_http_lua_worker_thread.c:98–180；src/ngx_http_lua_worker_thread.c:508–524 |

## 真实发行补丁

临时目录实际回放34patch、142hunk及server_header替换；offset/fuzz与固定既有审计一致，47目标文件最终SHA全部匹配。56段Nginx证据38保持、18变化；涉及14个指令标verified_affected，其他57仅明确事实verified_unaffected。组件本身的固定快照核验与共享Nginx补丁分别记录，不将组件源码未直接变动当作无运行影响。

- balancer_by_lua_block / implementation-6：src/http/ngx_http_upstream.c:1553–1576；首次 balancer_status_code
- balancer_by_lua_file / implementation-4：src/http/ngx_http_upstream.c:1553–1576；首次 balancer_status_code
- init_worker_by_lua_block / implementation-5：src/os/unix/ngx_process_cycle.c:780–819；首次 privileged_agent_process
- init_worker_by_lua_block / implementation-6：src/core/ngx_cycle.h:20–40；首次 privileged_agent_process
- init_worker_by_lua / implementation-3：src/os/unix/ngx_process_cycle.c:780–819；首次 privileged_agent_process
- init_worker_by_lua / implementation-4：src/core/ngx_cycle.h:20–40；首次 privileged_agent_process
- init_worker_by_lua_file / implementation-3：src/os/unix/ngx_process_cycle.c:780–819；首次 privileged_agent_process
- init_worker_by_lua_file / implementation-4：src/core/ngx_cycle.h:20–40；首次 privileged_agent_process
- exit_worker_by_lua_block / implementation-5：src/core/ngx_cycle.h:20–40；首次 privileged_agent_process
- exit_worker_by_lua_file / implementation-3：src/core/ngx_cycle.h:20–40；首次 privileged_agent_process
- lua_capture_error_log / implementation-1：src/core/ngx_log.c:95–196；首次 intercept_error_log
- lua_capture_error_log / implementation-2：src/core/ngx_log.h:76–76；首次 larger_max_error_str
- ssl_client_hello_by_lua_block / implementation-5：src/event/ngx_event_openssl.c:1881–1942；首次 ssl_cert_cb_yield
- ssl_client_hello_by_lua_file / implementation-3：src/event/ngx_event_openssl.c:1881–1942；首次 ssl_cert_cb_yield
- ssl_certificate_by_lua_block / implementation-5：src/event/ngx_event_openssl.c:1881–1942；首次 ssl_cert_cb_yield
- ssl_certificate_by_lua_file / implementation-3：src/event/ngx_event_openssl.c:1881–1942；首次 ssl_cert_cb_yield
- ssl_session_fetch_by_lua_block / implementation-5：src/event/ngx_event_openssl.c:1881–1942；首次 ssl_cert_cb_yield
- ssl_session_fetch_by_lua_file / implementation-3：src/event/ngx_event_openssl.c:1881–1942；首次 ssl_cert_cb_yield

balancer_status_code正确对应当前固定源upstream1553–1576的connect_peer返回处理，不用补丁旧上下文行号。privileged_agent补丁宏影响worker钩子排除条件；日志截获真实调用和larger_max_error_str分别核定，Win32局部同名宏不误作Lua callback的共享宏证据。SSL三类yield补丁全文绑定脚本回调项；宏支持与库支持不推断已运行。proc_exit_handler已读，区别于exit_worker，不作为本条退出钩子直接影响证据。

## 隔离发布验证

执行时现场基线677/1.27.1.1-b809249ff0c46d2d（用户此前670，主并行推进到677）；只在mkdtemp复制构建必要输入并加入71，临时release 1.27.1.1-f6141e99b32ade55。调用既有build.mjs/validatePublication但配置和输出根均为临时目录，没有根build。

1017注册、748基础、0深度、269仅注册。71项正文、语法、可选事实、限制、patch、related与draft逐项相等；phase、配置callback symbol、compile_guards匹配。799来源固定SHA/原文/EOF/URL锚点全相等；946其他详情除release_id保持（包括既有8 Lua项），8个reference对象保持。验证窗口正式knowledge/current字节一致。

所有临时patch、组件快照、构建目录finally清理。未执行Nginx/OpenResty/Lua程序、外部TLS/认证/网络服务；静态证据与网站构建不是运行行为实测，不提升deep_verified。等待独立审核，后续finding仅按指定项最小修复。
