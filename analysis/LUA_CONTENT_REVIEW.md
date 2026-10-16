# Lua、RDS、数据库与Redis独立内容审核

2026-10-13；Astra low独立审核角色。沿用冻结WEBSITE_COMPLETION_PLAN/C02_REMAINING_CONTENT_PLAN；本文件为唯一永久写集，不替代Harvey正式发布验收。用户追加队列：HTTP Lua71后接Stream Lua49（76918127a78d92d616cee6f92ab0a4af2655b304ce57804124c80bb80983b4a8），再RDS CSV6（51c6f22fc8ab7ab56c71717eb14d89ac72036e4a8ec903448e1e1a2f8d174d2f）、RDS JSON10（72348c44e92d01b4ebabb1b41d3633fe045f42d89ee89186733bf78a90726fa1）；冻结文件及各自完整NOTES须逐批实核，未审不放行。

## 输入与方法

候选 `analysis/content/HTTP_LUA_BASIC.json` SHA256实测为 `ecdaf3a6bba1a9c20d6947a21dfabb45018547c7243028e3b5af5fd4c211dd4a`；完整读取HTTP_LUA_BASIC_NOTES.md。正式基线691，release `1.27.1.1-2a787ebf4c204bed`，index SHA256 `5a61d6dddab2884a08daeaa496bf54bd0acf5baa492f31b167bb9bb6d5884d1f`。79注册减已有8精确等于候选71，无交集；候选不计正式覆盖。

固定Git：HTTP Lua `ea09d92adf835e30cab8d79343c7b8266e888128`；Nginx `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`；OpenResty `8c37412c31621225e7aa7e825b5b50106c9c71c4`。所有阅读使用本地git show，README正文与注册、offset/post、真实定义及消费路径逐义比较。

独立执行既有verify-nginx-patches.mjs：34patch、142hunk、47最终SHA通过；复用其mkdtemp回放，在内存注入只读片段核验后finally清理。586个evidence加71 callback定义与71注册共728引用均在真实EOF以内（剔除末尾LF虚行），callback定义包含对应真实符号，事实source_ids均可解析。18次Nginx片段变化与NOTES所列身份一致；未以片段保持自动推定语义无影响。NOTES称“728显式引用、发布再加71”口径与当前数组不一致：当前evidence为586，728含两类隐式入口；这里只校正统计口径，不据此否决内容，也没有构建或宣称799发布来源已复验。

以下窗口只放行实际完成逐义审核的身份。子集按候选原数组顺序筛选，摘要为 `SHA256(JSON.stringify(selected,null,2)+'\n')`；合并前主须重新核候选字节及knowledge交集。窗口通过不表示已经正式合入。

## W01：基础配置12项，准备通过

子集SHA256：`b9f4f723d5b2ff2d27671050683a520c277bb89205bdc5216de040ff5a831cad`。

```text
lua-nginx-module/ngx_http_lua_module/lua_thread_cache_max_entries
lua-nginx-module/ngx_http_lua_module/lua_max_running_timers
lua-nginx-module/ngx_http_lua_module/lua_max_pending_timers
lua-nginx-module/ngx_http_lua_module/lua_capture_error_log
lua-nginx-module/ngx_http_lua_module/lua_sa_restart
lua-nginx-module/ngx_http_lua_module/lua_regex_cache_max_entries
lua-nginx-module/ngx_http_lua_module/lua_regex_match_limit
lua-nginx-module/ngx_http_lua_module/lua_package_cpath
lua-nginx-module/ngx_http_lua_module/lua_package_path
lua-nginx-module/ngx_http_lua_module/lua_need_request_body
lua-nginx-module/ngx_http_lua_module/lua_transform_underscores_in_response_headers
lua-nginx-module/ngx_http_lua_module/lua_socket_log_errors
```

|身份name|逐义结论与固定证据（路径均相对对应固定仓库）|
|---|---|
|lua_thread_cache_max_entries|module.c107–112绑定num及字段；1085–1098、1132–1150与util.c335–365/453–480闭合1024、0禁用、RESETTHREAD条件和主VM队列复用，不是OS线程。|
|lua_max_running_timers|module.c114–119/1114–1116；timer.c513–725闭合256、到期执行上限、伪连接及失败清理，不保证已建timer必执行。|
|lua_max_pending_timers|module.c121–126/1110–1112；timer.c180–200闭合1024及创建时nil/error，不混同running。|
|lua_capture_error_log|directive.c1974–2036实际hook与最低容量；log.c327–347及ringbuf.c1–180解释过滤/覆盖；intercept_error_log原patch1–60与larger_max_error_str1–13分别闭合共享调用及宏变化；不替代正常日志。|
|lua_sa_restart|initworkerby.c78–82、util.c4280–4305、module.c1118–1122闭合条件默认与OR设置；off不清除既有标志。|
|lua_regex_cache_max_entries|directive.c241–250无PCRE返回OK；regex.c957–968暴露容量；README1369–1393明确旧缓存与resty.core LRU区别。|
|lua_regex_match_limit|directive.c253–262；regex.c185–205/468–486及module.c1105–1107闭合PCRE2/旧PCRE分支与0沿用库默认，非时间限制。|
|lua_package_cpath|directive.c199–217；util.c303–318/159–196及README1430–1446闭合package.cpath、双分号及prefix替换。|
|lua_package_path|directive.c220–238；util.c287–301/159–196及README1413–1429闭合package.path，不扩为任意请求变量插值。|
|lua_need_request_body|四阶段server_rewriteby.c101–125、rewriteby.c139–162、accessby.c134–158、contentby.c198–222闭合异步读体；README2737–2764支持落盘及request_body限制。|
|lua_transform_underscores_in_response_headers|headers.c963–996/1174–1195分别闭合响应头setter/getter，module.c1574–1575默认on；不扩为请求头/所有模块。|
|lua_socket_log_errors|socket_tcp.c1920–1953/3448–3463/3487–3500和socket_udp.c814–831闭合TLS/读写超时/closed错误路径；module.c1577默认on；off不改变Lua错误返回。|

上述注册context、post及条件与catalog和固定源相符；通用slot定义按对应固定Nginx源码检查。显式默认的source_ids闭合，未知默认/继承保持unverified。除日志截获两patch事实外，其余所写事实未发现有效补丁改变；无本窗口内容缺陷。

## W02：worker生命周期5项，准备通过

子集SHA256：`e5f7e46b89d481e430e1e511d4abc65547cafa4f62d8c6baa59a516f675fafc2`。

```text
lua-nginx-module/ngx_http_lua_module/init_worker_by_lua_block
lua-nginx-module/ngx_http_lua_module/init_worker_by_lua
lua-nginx-module/ngx_http_lua_module/init_worker_by_lua_file
lua-nginx-module/ngx_http_lua_module/exit_worker_by_lua_block
lua-nginx-module/ngx_http_lua_module/exit_worker_by_lua_file
```

逐项核module.c238–271的context/post；directive.c1294–1430的block委派、去重、路径补全；block共用1551–1716原文收集器。init三项分别经initworkerby.c319–351加载inline/file，24–86排除无VM及普通helper、270–303设置伪请求并忽略脚本返回值；README对应1597–1664及1568–1596支持timer用途。exit两项分别经exitworkerby.c93–125加载，21–90设置EXIT_WORKER、同步调用及helper排除；README1665–1707明确不能创建timer。Nginx process_cycle.c889–903/935–955与module-owner闭合init/exit_process挂接。privileged_agent_process完整patch1–203已逐义读，宏、helper标记与调用链吻合；另读proc_exit_handler确认它挂process_get_status而非本模块exit_process，不错误归因。未知默认/继承未升格。

## L-R01 / P2：init三项跳过test/signaller断言缺实际控制流来源

身份：`lua-nginx-module/ngx_http_lua_module/init_by_lua_block`、`lua-nginx-module/ngx_http_lua_module/init_by_lua`、`lua-nginx-module/ngx_http_lua_module/init_by_lua_file`。三项暂不放行。

三项limitations均断言“nginx -t/signaller路径不执行”，事实正确，但所列module.c895–974仅899的日志条件，不是跳过初始化的控制流；api.c175–211只能证明共享区init的test条件，不能补足signaller/无共享区路径。实际入口 `ngx_http_lua_init` 在固定Lua module.c753–767，765–767直接返回NGX_OK，当前三项均未引用。

最小修复：各新增module.c753–767来源并绑定该limitations及patch_status.source_ids（或扩展现有范围确实含该控制流，优先小片段）；正文无需改。其余init callback/block/file、shared-zone等待、code_cache off独立VM事实已逐义核对相符。由主协调实施修复后按新冻结SHA复核，审核角色不改候选。

## W03：HTTP阶段与过滤23项，准备通过

子集SHA256：`04bf7eb1f4aadd7b0e6dff0f6827e77cabbcf3f499de34de5e1bd2c50da27220`。以下均为完整身份前缀 `lua-nginx-module/ngx_http_lua_module/` 加所列name（顺序即候选顺序）：

```text
set_by_lua_block
set_by_lua
set_by_lua_file
server_rewrite_by_lua_block
server_rewrite_by_lua_file
rewrite_by_lua
rewrite_by_lua_block
access_by_lua
content_by_lua
log_by_lua
log_by_lua_block
rewrite_by_lua_file
rewrite_by_lua_no_postpone
access_by_lua_file
access_by_lua_no_postpone
content_by_lua_file
log_by_lua_file
header_filter_by_lua
header_filter_by_lua_block
header_filter_by_lua_file
body_filter_by_lua
body_filter_by_lua_block
body_filter_by_lua_file
```

|逐项族（仅上列身份）|功能与证据结论|
|---|---|
|set三项|module.c275–299的NDK guard/context/post与directive.c266–488逐一相符；block单目标、inline/file额外参数有别；setby.c20–113同步pcall返回一个值，README1708–1821支持rewrite链与不可yield。file实际通过NDK参数求值后补全路径，不从inline复制。|
|server_rewrite两项|directive.c594–696专用srv字段及requires_server_rewrite；module.c801–809挂SERVER_REWRITE；server_rewriteby.c22–189分别核inline/file调用、复杂值路径及请求恢复，不混同location rewrite。|
|rewrite三项及no_postpone|directive.c492–591、module.c811–818与rewriteby.c24–231闭合真实挂接、uri_changed短路、一次重排、inline/file分别加载；no_postpone注册396–401写同一main字段，默认791–793。README2028–2182/3485–3499与边界一致。|
|access两项及no_postpone|directive.c718–798、module.c820–827、accessby.c25–230核阶段、跳过post_access位置的重排及文件变量求值；开关注册411–416、默认795–797，未把它写成绝对鉴权排序。|
|content两项|directive.c820–910真实clcf.handler赋值；contentby.c157–222/246–313分辨inline/file、恢复及读体。README1822–1846/1874–1911与关联block定义支持缓存/上下文边界，不覆盖既有content_by_lua_block。|
|log三项|directive.c913–1011分别核block/inline/file，module.c831–845挂LOG；logby.c66–266闭合同步pcall及路径加载；README2528–2636支持禁止输出/子请求/cosocket。|
|header_filter三项|directive.c1014–1111、module.c847–852及headerfilterby.c87–114/157–301分别核加载、同步执行、上下文和保存/接续top链；README2310–2387核API限制。|
|body_filter三项|directive.c1114–1213、module.c854–859、headerfilterby.c240–244核需内存输入；bodyfilterby.c90–395核同步加载、逐链调用和top链；README2388–2527核ngx.arg与长度改变清Content-Length，不写整响应一次。|

23项各自注册、callback、post、context与候选语法相符；共用块解析器1551–1716已读，file复杂值与inline不插值逐族分开查。所述事实未发现有效patch改变，默认/继承未知仍保持未知。两项no_postpone默认有实际初始化及文档支持；无本窗口确定缺陷。

## W04：balancer、连接及运行配置12项，准备通过

子集SHA256：`08e9dfae6eda33b55f7aad81fe6ada3f7426f731ad4dffa1f8269e16940e5d72`。完整身份前缀均为 `lua-nginx-module/ngx_http_lua_module/`：

```text
balancer_by_lua_block
balancer_by_lua_file
balancer_keepalive
lua_socket_keepalive_timeout
lua_socket_send_lowat
lua_socket_buffer_size
lua_socket_pool_size
lua_http10_buffering
lua_check_client_abort
lua_use_default_type
lua_malloc_trim
lua_worker_thread_vm_pool_size
```

|身份name|逐义结论与证据|
|---|---|
|balancer_by_lua_block、balancer_by_lua_file|balancer.c104–558分别核两加载入口、保存原算法、替换init/get/free_peer、占位地址失败、同步pcall及动态peer/原算法分支；upstream.c1553–1576与balancer_status_code patch1–30闭合特殊状态提前finalize。README2637–2713说明重试与不可yield；file为固定路径补全。|
|balancer_keepalive|balancer.c1345–1376拒0/非法/重复；286–340默认32及队列；1020–1063显式enable，576–740实际缓存资格和LRU。不混同活动总连接与cosocket池。|
|lua_socket_keepalive_timeout|socket_tcp.c5353–5623/5396–5408参数覆盖及0不设空闲timer；module.c1553–1554默认60s，不自动入池。|
|lua_socket_send_lowat|module.c69–70 post绑定、980–1006平台检查、1565–1566默认0；socket_tcp.c3585–3595含3589真实调用，引用未偏移。|
|lua_socket_buffer_size|socket_tcp.c2165–2175/6006–6018/6060–6075说明接收块与较大prefix；module.c1568–1570取pagesize，不冒充响应总量上限。|
|lua_socket_pool_size|socket_tcp.c934–980、5353–5623核connect/setkeepalive覆盖与按key建池；module.c1572默认30；README3258–3278支持每worker。|
|lua_http10_buffering|util.c580–595/612–635/662–693/742–778闭合HTTP<1.1、未发头且未知长度、积累输出及末尾计长；module.c1549默认on。|
|lua_check_client_abort|contentby.c97–126挂读事件，socket_tcp.c2823–2842/3166–3192及util.c3512–3577核off仍报未读完正文断连、on_abort恢复；module.c1550默认off。|
|lua_use_default_type|util.h450–468调用set_content_type的开关与304条件；module.c1551默认on；README1262–1278明确本域默认类型，不扩大至其他模块。|
|lua_malloc_trim|module.c1731–1763、1124–1128与logby.c66–108核阈值1000、requires_log与计数条件；默认初始化不安装handler的限定准确。|
|lua_worker_thread_vm_pool_size|worker_thread.c26–32/98–180/508–524核NGX_THREADS、独立VM上限、path/cpath及有限API，与OS线程池分开；module.c1152–1154默认10，README3620–3640正文“100”不采纳。|

上述逐项context/guard/配置定义/字段及所列默认均核过；继承仍明确未知。两balancer脚本为局部affected，其余所列事实未见有效patch改变。

## W05：cosocket TLS配置7项，准备通过

子集SHA256：`7eed59baca89424d7728c875651859f745c8ecda1369d921eefec5c96b2edeb3`。完整身份前缀均为 `lua-nginx-module/ngx_http_lua_module/`：

```text
lua_ssl_protocols
lua_ssl_verify_depth
lua_ssl_certificate
lua_ssl_certificate_key
lua_ssl_trusted_certificate
lua_ssl_crl
lua_ssl_conf_command
```

逐项确认NGX_HTTP_SSL及conf_command的版本guard、三层context与真实slot/post。module.c1514–1539默认及1585–1631共享SSL_CTX机制按原文核；socket_tcp.c1689–1697证明CLIENT方向。protocols经module.c78–88/1657–1659到openssl.c296–399，区分配置接受与库能力。verify_depth/trusted经module.c1690–1697及openssl.c950–984，不独立开启verify；socket_tcp.c1787/1920–1953为实际结果检查。certificate/key经module.c1643–1655/1680–1688，openssl.c434–481/553–574/738–852核静态数组配对、无独立key加载、NULL口令参数及PEM/data/engine条件。crl经module.c1701–1703与openssl.c987–1029，非在线OCSP。conf_command经module.c90–93/1705–1725、openssl.c1595–1664核TAKE2、检查器及后置执行，README3433单参数占位未误用。七项所列事实及局部unaffected成立；未知继承不升格。

## L-R02 / P2：lua_ssl_ciphers后置覆盖断言缺本条来源

身份：`lua-nginx-module/ngx_http_lua_module/lua_ssl_ciphers`，暂不放行。limitations称“后续lua_ssl_conf_command可覆盖设置”，但当前本条只有module.c1670–1678的set_cipher_list、1585–1631的共享ctx、socket客户端创建及默认/README3311–3327，没有后置命令调用或解释证据。该事实已在独立的lua_ssl_conf_command条目核实，不能借另一详情的source_ids充当本条闭合。

最小修复：给本条补固定module.c1705–1713与README3454–3456（或相应ngx_ssl_conf_commands helper）并绑定limitations/patch_status；或者删去这句补充断言。其余DEFAULT、客户端方向、set_cipher_list与非TLS1.3专用接口已核。主协调实施后差异复核。

## W06：HTTP SSL脚本8项，准备通过

子集SHA256：`40ff9b1ea3e1220d7627ac6bfe7303216bac3e9bee7c3338f1a23fb36126324a`。完整身份前缀均为 `lua-nginx-module/ngx_http_lua_module/`：

```text
ssl_client_hello_by_lua_block
ssl_client_hello_by_lua_file
ssl_certificate_by_lua_block
ssl_certificate_by_lua_file
ssl_session_store_by_lua_block
ssl_session_store_by_lua_file
ssl_session_fetch_by_lua_block
ssl_session_fetch_by_lua_file
```

ClientHello两项逐读ssl_client_helloby.c32–178/181–357、module.c1233–1272，安装回调、默认server语境、OPENSSL/LibreSSL和SSL_CTX条件成立；README2765–2883明确早于扩展处理、默认server限制。certificate两项逐读ssl_certby.c41–185/188–362、module.c1274–1312，真实注册http/server比README2884–2993宽，已明确差异；版本1.0.2e、恢复时跳过、固定file路径均有据。

store两项逐读ssl_session_storeby.c34–170/174–319/360–418、module.c1314–1336：sess_new_cb、同步pcall、TLS>=1.3跳过成立，README3084–3140支持零延迟timer；不能借fetch推断可yield。fetch两项逐读ssl_session_fetchby.c36–172/176–383、module.c1338–1359：sess_get_cb、TLS>=1.3跳过、PENDING_SESSION分支及缺库能力的明确失败成立，README2994–3083区分票据和session ID。

ssl_cert_cb_yield1–64、ssl_sess_cb_yield1–41、ssl_client_hello_cb_yield1–38原文完整阅读，实际回放命中同一握手分支；分别对应X509_LOOKUP/PENDING_SESSION/CLIENT_HELLO_CB，不把首个改变片段的patch等同各项唯一原因。六项异步握手脚本affected；store两项所列同步事实unaffected，未推断整个SSL运行时不受影响。八项block与file配置、post、加载函数各自核实，默认/继承保持unverified。

HTTP首轮完成：71项均已逐义检查，67项准备通过（W01–W06），4项因L-R01/L-R02待最小补证据；尚不能宣称71全部通过。继续独立Stream/RDS队列，不替实施修改冻结候选。

## W07：四项补证据差异复核通过，关闭L-R01/L-R02

当前完整HTTP候选SHA256实核为 `41329a44c5ab3d1b4a63e3591ce01f879c0f2e35c08c3cab733241d80bb72d7e`。内存逆移除三条init新增init-mode-guard及其两处source_ids、ciphers新增两来源及其两处source_ids后，规范JSON字节SHA精确还原初始冻结值 `ecdaf3a6bba1a9c20d6947a21dfabb45018547c7243028e3b5af5fd4c211dd4a`；正文与其余67对象未变，W01–W06子集仍有效。

本窗口完整身份前缀为 `lua-nginx-module/ngx_http_lua_module/`，按候选顺序为 `init_by_lua_block`、`init_by_lua`、`init_by_lua_file`、`lua_ssl_ciphers`。四项子集SHA256（JSON.stringify(selected,null,2)+'\n'）为 `0c69cc90c8a37c1130b7498c8a2db27e28f818d94be5995acdeacf14c0f88aba`。

实际重读固定Lua SHA ea09d92adf835e30cab8d79343c7b8266e888128：module.c753–767在init入口对signaller/test提前返回；module.c1705–1713在此前cipher配置之后执行ssl_conf_commands；README.markdown3454–3456明确其覆盖能力与风险。新增来源均绑定各自limitation及patch_status，范围未超EOF；NOTES两次修订记录相符。新增均为无直接发行patch的Lua组件事实，不改变既有Nginx回放结论。

L-R01、L-R02均关闭。HTTP Lua71现全部内容审核通过，可按上述完整候选SHA由主整组集成；未执行正式发布或根build，不把候选通过算作正式basic数量。继续Stream49、RDS CSV6/JSON10。

## Stream输入与独立回放

冻结SHA `76918127a78d92d616cee6f92ab0a4af2655b304ce57804124c80bb80983b4a8`，完整NOTES已读。固定Stream源码 `69f0cd762112a6e0cddb07f2b5192e9a65034a93`，HTTP移植文档/Nginx/OpenResty固定版本沿用上文。实际重放既有verify-nginx-patches.mjs：34patch、142hunk、offset/fuzz及47最终SHA全部相等，finally清理临时目录；未运行服务或根构建。540引用真实EOF合法（不计末尾LF为空行），所有source_ids存在；27个显式Nginx evidence中13变化，另有23个Nginx配置callback，合计50。变化身份与NOTES的10项对应，不以检查数量替代逐义审核。

## L-R03 / P2：Stream lua_socket_log_errors缺closed分支证据

身份 `stream-lua-nginx-module/ngx_stream_lua_module/lua_socket_log_errors`。当前本条socket_tcp.c1831–1868、3420–3437、3458–3475只覆盖TLS校验和读写超时，limitation另明确称已关闭socket路径读取开关，没有相应本条来源。固定源码2812–2826实际包含closed条件、log_socket_errors及不变的nil/closed返回。

最小修复：增加上述固定范围来源并绑定limitation和patch_status，或删除closed补充断言。其他本条事实已核；不改候选，待主修复。

## L-R04 / P2：Stream lua_code_cache把创建VM归到getter

身份 `stream-lua-nginx-module/ngx_stream_lua_module/lua_code_cache`。limitation称get_lua_vm初始化会话独立VM，但固定util.h283–378真实函数是ngx_stream_lua_create_ctx，313–372执行关闭cache时的VM初始化/init_handler；382–404的get_lua_vm只选取并返回VM。生命周期结论正确，具名执行入口错误。

最小修复：正文仅将get_lua_vm改为create_ctx（或删除错误函数名），将已有implementation-0起点289前移至283以包含实际定义；保留已有绑定。待差异复核，不要求改实现。

## S01：Stream基础配置10项准备通过

完整身份前缀 `stream-lua-nginx-module/ngx_stream_lua_module/`。原数组slice(0,10)，子集SHA `7db2de22e52d20ff3f39674f5c30253756a45caa72f700f6225ff8a90ff1b10f`：

```text
lua_load_resty_core
lua_max_running_timers
lua_max_pending_timers
lua_shared_dict
lua_sa_restart
lua_capture_error_log
lua_regex_cache_max_entries
lua_regex_match_limit
lua_package_cpath
lua_package_path
```

逐一核注册96–166、真实callback/offset/post/context及默认。load_resty_core的directive180–190和util3367–3381证明off无效；timer180–202/562–766分开pending创建与running到期限制，默认1024/256；shared_dict配置72–153、shdict78–131/322–387、api90–157核8192、模块tag与注入；sa_restart的initworker87–91/util3653–3676只OR设置，默认受能力宏限制。capture配置1190–1253、log328–348/ringbuf164–194核cycle唯一hook/覆盖及大小，intercept/larger两patch逐段核并实际回放。regex注册确受NGX_PCRE，regex978–988/207–217/480–496区分getter、PCRE2和旧PCRE条件；path/cpath配置193–234与util142–179/271–302确认旧路径/前缀处理。移植文档只作辅助，未带入HTTP context或默认。其余继承未知不升格。

## S02：Stream初始化6项准备通过

同上身份前缀，原数组slice(12,18)，子集SHA `c8f65d343f0be1e3f5a2d656d4ce10151c873326cbf226c549093b05799e913f`：

```text
init_by_lua_block
init_by_lua
init_by_lua_file
init_worker_by_lua_block
init_worker_by_lua
init_worker_by_lua_file
```

module484–510真实生命周期、185–225各post与directive602–727逐一核；共用块解析器776–933实际读完。initby24–48两加载入口、module526–532/594–659与api196–218闭合test/signaller、共享区等待和直接init；util308–373支持独立VM再次init。worker的initworker53–96/290–311/327–351核普通helper排除、privileged例外、同步加载及返回值不传播；Nginx process_cycle889–903及privileged_agent_process完整补丁闭合core调用。三worker为局部affected，三init所列事实unaffected。file固定路径、inline转义、block正文分别核，不套HTTP请求生命周期。

## S03：Stream会话阶段7项准备通过

同上身份前缀，slice(18,25)，SHA `3302aea6441eae56770755c1997bd83994c8eb8e6121eb1503b0bad64eb3fbad`：`preread_by_lua_file`、`content_by_lua`、`content_by_lua_block`、`content_by_lua_file`、`log_by_lua_block`、`log_by_lua_file`、`preread_by_lua_no_postpone`。

逐项配置定义directive262–355/357–483/486–597与module228–292绑定相符。prereadby24–123/153–191、module536–547核阶段尾重排、peek恢复与file复杂值；README187–233明确receive消费和路径缓存。contentby157–279确认server内容入口、session恢复、inline/file加载，不能把proxy与Lua作为连续内容链。logby74–273与module551–571确认LOG前置、同步pcall及file求值，README234–272禁止yield/输出。no_postpone默认off及字段消费相符，README290–304支持；继承未核定字段维持未知。七项明示事实unaffected。

## S04：Stream balancer/socket及运行配置12项准备通过

同上身份前缀，原序 `[...p.slice(25,35),...p.slice(47,49)]`，SHA `7c2624ee235c3ce9875cf1d611210f34d73d88cf92ee70b67960a277cf630580`：

```text
balancer_by_lua_block
balancer_by_lua_file
lua_socket_keepalive_timeout
lua_socket_connect_timeout
lua_socket_send_timeout
lua_socket_send_lowat
lua_socket_buffer_size
lua_socket_pool_size
lua_socket_read_timeout
lua_check_client_abort
lua_malloc_trim
lua_add_variable
```

balancer76–505逐项核post、固定RR初始化、get/free绑定、同步pcall、动态peer及TLS TODO；两发行patch全文与Nginx proxy/RR片段实际变化相符，均affected。socket keepalive5224–5493核显式归还及timeout/pool覆盖；connect1070–1100/1495–1505/1757–1770/3350–3372核TCP/TLS事件计时；send1088–1093/3558–3567及util1350–1367/1540–1554核cosocket和本域输出；lowat的module64–65/668–694真post及上述消费成立；buffer2226–2238/5880–5951核块与prefix；pool905–945/5263–5280/5375–5387核按key及options；read1095–1100/2759–2764/3366–3371不等于core preread超时。abort的contentby99–131、socket2714–2734/3044–3069/util3000–3063闭合检测与恢复。module993–1014逐字段默认相符。

malloc_trim的module1136–1168/789–793、LOG真实调用核0关闭、默认阈值不独自挂handler。add_variable配置1300–1335、undefined1290–1297、FFI variable67–211和core stream_variables149–218核CHANGEABLE/WEAK及不可变拒绝，README274–289的过宽说法未照搬。十项运行配置明示事实unaffected。

## S07：Stream两项最小修复通过，关闭L-R03/L-R04

完整候选实核SHA `ca57063010ee34c1cf888b50e424e4a915f5ee6b6b7572cb09891b9251b2c50b`。内存逆移除closed-socket-log来源及两处绑定，将create_ctx还原get_lua_vm并将implementation-0起点283还原289，规范JSON SHA精确还原原冻结值76918127…83b4a8。其他47对象及S01–S04子集不变，不重跑无变化补丁全批。

固定socket_tcp2812–2826已实读，包含closed条件、受控日志及不变nil/closed返回；util.h283真实create_ctx定义与313–372创建分支相符。两项新增/调整均无直接组件patch，原回放仍适用。完整身份前缀同上，原序 `lua_code_cache`、`lua_socket_log_errors`，子集SHA `79ac747e4bef68cb3c4ece2ab3454be01cc36fdb741249fc423ae7843e42ced8`。两finding关闭，两项准备通过。

截至此处Stream37项通过、TLS12项继续审。HTTP四项修复早已由W07关闭并放行；用户报告正式820仅含原67，不能据此把四项重新标待修，主可按W07子集继续集成。

## S05：Stream cosocket TLS配置8项准备通过

完整身份前缀 `stream-lua-nginx-module/ngx_stream_lua_module/`，原序 `[...p.slice(35,37),...p.slice(41,47)]`，子集SHA `16a4283f88f978fd0c15d0366aac694f4ca431ed3f632dc9a1c50c85298c850d`：`lua_ssl_protocols`、`lua_ssl_ciphers`、`lua_ssl_verify_depth`、`lua_ssl_certificate`、`lua_ssl_certificate_key`、`lua_ssl_trusted_certificate`、`lua_ssl_crl`、`lua_ssl_conf_command`。

逐项核真实注册378–462及NGX_STREAM_SSL/版本guard。module77–87/964–988/1052–1118、socket1628–1638/1693–1695/1831–1868闭合默认、创建CLIENT连接及verify开关；共享openssl296–399/434–481/553–574/738–852/950–1029/1595–1664沿用同固定SHA已逐义审核的helper。默认掩码确含SSLv3且不含TLS1.3，不能套HTTP；cipher使用set_cipher_list，后置command本条已有来源。certificate/key数组静态配对，口令参数NULL；信任/depth/CRL不独立开启verify。

conf_command的post在68–69，检查器1123–1131；create_srv805–856真实pcalloc且不设commands为UNSET_PTR，merge981–988配合conf_file.h210–213与keyval setter1129–1163支持NULL，候选正确区分HTTP继承。八项明示事实unaffected，完整未知继承保持未知。

## S06：Stream下游TLS脚本4项准备通过

同上身份前缀，slice(37,41)，子集SHA `0222073c095913071a1fcffe1b396354fa67aa0d20faaaf2eed526ec29938c44`：`ssl_client_hello_by_lua_block`、`ssl_client_hello_by_lua_file`、`ssl_certificate_by_lua_block`、`ssl_certificate_by_lua_file`。

ClientHello配置/加载/运行ssl_client_helloby32–178/181–359和module875–919逐义核；cert对应ssl_certby49–193/196–372、module875–880/921–957。每项真实post、block委派、固定file路径、session配置、伪上下文和返回-1等待均相符。固定Nginx分支只有已有SSL_CTX才继承安装，未借HTTP代码断言无SSL一定报错。版本/LibreSSL限制、早期SNI语境及恢复可跳过cert有固定移植文档支持。共享握手openssl1881–1942与三yield补丁沿用已逐段阅读内容，并在本轮49输入回放核实实际改变；四项affected，不把首次变化的cert补丁误作ClientHello唯一原因。

Stream49内容审核完成，S01–S07无重叠覆盖49；catalog本owner50减既有preread_by_lua_block，49配置callback真实符号逐项匹配。L-R03/L-R04关闭，完整修正候选 `ca57063010ee34c1cf888b50e424e4a915f5ee6b6b7572cb09891b9251b2c50b` 可整组交主集成。仅静态内容及发行证据通过，不声称执行Lua/TLS或正式发布。继续RDS两个owner。

## 新增授权队列

用户明确追加Drizzle12（候选SHA `0b3516f17ffe5e3a1d4f8eb217dbc7672852b1167044281cfc0952a5a1b22d1b`）及Postgres10（`181216c2a7a7304a44f1760803a2fb5c4f33103c2c1992b9332f68b76dac6095`），各自完整NOTES纳入阅读。沿用唯一写集，不写候选、不运行数据库/Nginx、不根构建；Harvey仅负责正式接入审核，不重复DB22内容审核。

## L-R05 / P2：CSV四项固定常量或路径证据缺口

冻结CSV SHA `51c6f22fc8ab7ab56c71717eb14d89ac72036e4a8ec903448e1e1a2f8d174d2f`，固定组件 `b4095fcb8a866835ddec7ea0c414b8a4af35741a`。完整身份前缀 `rds-csv-nginx-module/ngx_http_rds_csv_filter_module/`。以下正文事实正确，不能借其他详情来源替代本条闭合：

|name|缺口与最小补证据|
|---|---|
|rds_csv|mime来源只有util.c74–88的宏比较，未含精确MIME字面值；补src/resty_dbd_stream.h7–11，绑定limitation/patch_status。|
|rds_csv_row_terminator|defaults只绑定create-merge379–428的row_term宏，未含CRLF定义；补module.c22，绑定defaults/patch_status。|
|rds_csv_field_name_header|本条content-type177–230未含text/csv宏值；补module.c21，绑定limitation/patch_status。零列限制已正确，但为闭合零列调用条件，一并补processor.c60–99至limitation/patch_status。|
|rds_csv_content_type|默认text/csv只绑定merge宏；补module.c21至defaults/limitation/patch_status。另“输入仍需RDS”本条仅有输出分支168–230，补module.c159–166、util.c74–85及src/resty_dbd_stream.h7–11至limitation/patch_status。|

module.c均指src/ngx_http_rds_csv_filter_module.c，processor/util同名前缀。可删无必要的补充断言代替其补证据，但不要改已核正确的默认和零列差异。field_separator与buffer_size不受此finding影响。

## L-R06 / P2：JSON四项默认及输出路径来源不完整

冻结JSON SHA `72348c44e92d01b4ebabb1b41d3633fe045f42d89ee89186733bf78a90726fa1`，固定组件 `2d7e07f7c39f98bbb2a8b07f4bae4d892f00329d`。完整身份前缀 `rds-json-nginx-module/ngx_http_rds_json_filter_module/`。

|name|缺口与最小补证据|
|---|---|
|rds_json|mime126–141仅宏比较，补src/resty_dbd_stream.h7–11；field-types548–641恰好漏NULL分支546–547，也未含实际输出，补output.c696–702，均绑定limitation/patch_status。|
|rds_json_root|正文另声明不包装rds_json_ret，但本条无ret handler来源；补handler.c10–195至limitation/patch_status，或删该补充断言。|
|rds_json_format|正文声明零列和ret形态不变，但本条只有有列processor及output469–548预算路径；补output.c119–302（零列）、handler.c10–195（ret）及output.c650–695/627–641（实际行形态与闭合），绑定limitation/patch_status；或删除跨路径补充断言并补实际行输出。|
|rds_json_content_type|默认application/json只绑定create-merge的宏；补module.c21至defaults/patch_status。输入RDS要求已有测试调用，可补util.c124–137及src/resty_dbd_stream.h7–11至limitation/patch_status闭合精确类型。|

module/output/handler/util均指src/ngx_http_rds_json_*同名文件。上述补充已独立读源核实，无需重新研究或改产品；其他六项不受影响。rds_json_ret自身已有完整handler，参数至少两个、描述可空、数字原样复制及正常HTTP200均正确，不退回该条。

## R01/R02：RDS无缺口子集8项准备通过

R01完整前缀 `rds-csv-nginx-module/ngx_http_rds_csv_filter_module/`：`rds_csv_field_separator`、`rds_csv_buffer_size`；原序子集SHA `7d6d123e58b344a89348040313113ac588861d79120092ff181cb032caf4cc8c`。配置462–487只允许单字节逗号/分号/Tab；util17–70及output301–461核引号/双引号重复，不宣称公式转义。buffer真实size slot/post NULL，module379–428默认/继承与output582–746暂存及分段推进相符，不写成最大字段或关闭开关。

R02完整前缀 `rds-json-nginx-module/ngx_http_rds_json_filter_module/`：`rds_json_success_property`、`rds_json_user_property`、`rds_json_errcode_key`、`rds_json_errstr_key`、`rds_json_ret`、`rds_json_buffer_size`；原序子集SHA `b3f5d5c6370163db46636cdae83c9eac75594bfdf391a1697d826b319561f5c1`。

success/user/两错误键逐项核module600–827及411–479默认继承，output119–405和handler53–151核有列true、零列std_errcode、ret数字判断及字符串属性求值/转义，不去重。ret配置483–546实际NGX_CONF_2MORE、只消费value[1]/[2]；完整handler10–195明确数字原样复制、描述可空、附加属性、独立对象和HTTP200，未知完整继承不升格。buffer的output927–1097/handler99–111核常规与独立ret分配，不混为同一限制。六项均无语义finding。

RDS16已全部逐义首审；8通过、8因L-R05/L-R06补证据待修。CSV默认field_name_header为on、零列off减少预算但仍无条件写标题的差异已实读output118–210，JSON ret参数/200已确认。README.md固定正文分别60–150、78–266完整读过，未沿用其错误CSV默认或present拼写。

对RDS及新增DB四owner集中实际回放：34patch/142hunk、offset/fuzz、47最终SHA通过。候选和catalog完整owner数分别6/10/12/10匹配；显式evidence+registration+callback引用数47/81/119/126，若计入catalog自动的module-owner/registration-container，RDS为59/101。真实EOF及callback符号、自动来源ID均核；不是构建验收。Nginx片段RDS各3、Drizzle6全部保持，Postgres12中仅connect_timeout两段变化（1555–1576、1660–1667）。临时副本finally清理。DB语义审核继续，尚未因该机械核验放行。

## R03/R04：RDS最小补证据通过，关闭L-R05/L-R06

实核新CSV全文SHA `195c629cc6692ecb1b22f6671c01bd677e462f82d8593cfc59393e66de089fb3`，新JSON全文SHA `2d2465ab29d76919c2f5849ddeadeb768a816eae2a7571e9f6d0931ef18ee6db`。分别新增8和10来源，共18；按L-R05/L-R06清单逐项核固定路径、内容、真实EOF及本条事实/patch绑定。内存逆移除新增来源及source_ids后，规范JSON SHA分别精确还原初始51c6f22f…74d2f、72348c44…26fa1；正文/默认文字和其他8对象未变，R01/R02子集保持。

新增均来自固定RDS组件；无Nginx片段改动，不重复无变化补丁回放。CSV常量、输入gate及零列dispatch与JSON实际NULL/行输出、ret独立对象等证据已闭合，L-R05/L-R06关闭。CSV完整6项与JSON完整10项现均可按上述全文SHA整owner集成；不计作我执行正式发布。

## D01：Drizzle完整owner12项准备通过

完整NOTES已读。候选规范全文/子集SHA `0b3516f17ffe5e3a1d4f8eb217dbc7672852b1167044281cfc0952a5a1b22d1b`，固定源码 `fb6cf255d91135e18145a98a93947ead4e703b68`，同版本README.markdown及发行mirror-tarballs614–617。完整身份前缀 `drizzle-nginx-module/ngx_http_drizzle_module/`：

```text
drizzle_server
drizzle_keepalive
drizzle_query
drizzle_dbname
drizzle_pass
drizzle_connect_timeout
drizzle_send_query_timeout
drizzle_recv_cols_timeout
drizzle_recv_rows_timeout
drizzle_module_header
drizzle_buffer_size
drizzle_status
```

|逐项|逐义证据与结论|
|---|---|
|server|upstream84–299真实callback及14–16/301–398/668–696、processor180–228核3306、协议与认证选项、charset查询；宽松protocol长度分支已准确揭示，未写所有非法值必拒。|
|keepalive|keepalive25–129配置、upstream36–78初始化、keepalive160–243及upstream576–637/handler191–207核默认0/multi/ignore、按地址缓存与reject 503；README235–257的single不当事实。|
|query|module333–450/183–200/204–289核方法与默认整组merge；upstream471–525、handler74–85及processor180–228核求值、405/500及实际发送，非参数绑定。|
|dbname|module292–330及merge271–273、upstream448–469/668–678核空值回退、长度约束与新连接赋值；keepalive160–243证实复用忽略数据库名。|
|pass|module453–523、handler44–146/157–189、upstream1012–1054核静态/动态登记upstream选择和本域dbd入口；processor37–127/output110–125/224–245核事件状态机及RDS，非HTTP代理。|
|connect_timeout|真实msec slot/offset，util729–743仅NGX_AGAIN加写timer；upstream66–75将libdrizzle poll timeout设0，handler214–280消费超时。README拼写错误未传入语法。|
|send_query_timeout|processor180–228仅首次进入state_db_send_query挂timer；handler214–280实际超时路径。|
|recv_cols_timeout|processor305–339在IO_WAIT且状态首次改变时挂读timer，#if 0不可当实际事件注册。|
|recv_rows_timeout|processor394–424/494–512同样仅进入状态时计时，不按每次I/O刷新。|
|module_header|output21–31/224–245核X-Resty-DBD-Module版本标识及开关，module250–289默认on。|
|buffer_size|output596–612/662–692实际按较大RDS原子扩容，默认pagesize，非字段/结果硬上限。|
|status|module560–569真实content绑定，handler396–520/530–636/648–669遍历HTTP main的本域upstream并输出当前进程计数，不误写虚拟主机隔离/跨worker汇总。|

12项分别核注册54–144的context/arity/post及真实定义；默认/局部merge均有来源，完整inheritance仍unknown。已逐一读固定README相应正文。六个Nginx setter引用在本轮实际回放保持，组件发行无直接patch，限定unaffected成立；本owner无待修finding，可整组交主集成，不等Postgres。

## D02：Postgres完整owner10项准备通过

完整NOTES已读。全文即原序10项子集SHA `181216c2a7a7304a44f1760803a2fb5c4f33103c2c1992b9332f68b76dac6095`；固定组件 `681980598529f67fcec5c7448452046764a68429`，同版README.md26–164及mirror-tarballs718–721。完整身份前缀 `ngx_postgres/ngx_postgres_module/`：

```text
postgres_server
postgres_keepalive
postgres_pass
postgres_query
postgres_rewrite
postgres_output
postgres_set
postgres_escape
postgres_connect_timeout
postgres_result_timeout
```

|逐项|实际源码核对结论（src/ngx_postgres_前缀）|
|---|---|
|server|module392–486与upstream40–129/332–384核地址、5432、凭据选项及PQconnectStart；实际sslmode=disable，未许诺Unix socket或任意connstring转义。|
|keepalive|module488–604/196–206/254–292，upstream264–330，keepalive64–167/184–258及handler218–241核默认10/single/ignore、按地址复用、活动连接reject与503，不将池容量误作始终生效的总连接硬限。|
|pass|module606–681/1294–1338、handler41–150/188–216、processor40–110及upstream153–167核静态/动态已登记upstream、内容入口与事件状态机。|
|query|module683–811/176–194/294–366，upstream169–222、processor231–368/447–491核方法优先、整体继承、SQL复杂值、非绑定参数及多结果拒绝。|
|rewrite|module813–981/214–220、rewrite36–114、processor389–444/493–513、output546–574核条件组顺序与组内方法匹配；普通错误状态提前跳过set/output，=状态负值继续正文，最终取绝对值。|
|output|module983–1021/222–229/368–380、processor255–260/404–444、output38–270/546–574核五种输出；value/binary_value限一行一列非NULL非空，text换行与(null)，none不关闭SQL/变量提取。|
|set|module1023–1160/208–212/318–382、handler171–184、variable155–288和processor404–444核0基索引/列名、optional not_found、required提取失败500、普通rewrite错误可跳过提取及数组整体继承。|
|escape|module1166–1292、util318–406、escape41–97及固定Nginx rewrite136–184/271–294核脚本追加、赋值、PQescapeString与=空串分支；not_found仍NULL，不误称连接感知转义或参数绑定。|
|connect_timeout|module318–355默认10s、真实msec slot；upstream268–313/350–384/457–461、processor112–158/203–228/294–315与handler247–280核新建及复用NGX_AGAIN路径和timer清理。共享upstream1555–1576/1660–1667实际受balancer_status_code及upstream_timeout_fields影响，最终读取请求级字段；未沿用原版直接读取配置的错误结论。|
|result_timeout|processor231–283/294–368/447–491、handler283–317、util173–190核发送成功只挂一次读timer，等结果与ACK，不按I/O刷新；本域仍读conf->read_timeout，默认30s。|

所有注册module50–121的context/arity/post与真实callback逐项核对；lifecycle147–174、局部merge及每条固定文档/事实来源闭合，完整inheritance保持unknown。此前实际34patch/142hunk/47最终SHA回放及本owner126引用真实EOF核验适用，未重跑无变化批。10项无新增finding，可整owner交主；DB22内容审核完成，不代表正式发布。

## Redis新增授权队列

按用户明确授权，接续独立审核Redis2完整11项（SHA `80d290c7d4dcb46dfc56bbbd0bfdbdae39bdc5fa904423ee9fdd5dd65f75668f`）与Redis完整8项（SHA `ad5c9b63c8e1a4d5744440bb533a7efe0dcb9d26077279f1ac77a036364d1cd3`）。Harvey不重复两个owner；重点两bind的NULL/UNSET和Redis专属3patch/8hunk，尚未因入队放行。唯一写集及不构建、不运行服务边界不变。

## E01：Redis2完整owner11项准备通过

完整NOTES及固定README.markdown相关正文已读；固定组件 `c989c829a2877132cb100f901e320921250e068d`。全文即原序11项子集SHA `80d290c7d4dcb46dfc56bbbd0bfdbdae39bdc5fa904423ee9fdd5dd65f75668f`。身份前缀 `redis2-nginx-module/ngx_http_redis2_module/`：

```text
redis2_query
redis2_raw_query
redis2_raw_queries
redis2_literal_raw_query
redis2_pass
redis2_bind
redis2_connect_timeout
redis2_send_timeout
redis2_buffer_size
redis2_read_timeout
redis2_next_upstream
```

|逐项|实际语义核对（组件src/ngx_http_redis2_前缀）|
|---|---|
|query|module313–382、util113–214核参数复杂值、空参数及字节长度RESP编码；handler108–216与reply256–306/632–728核原始回复、计数及续接。|
|raw_query|util13–50与handler108–216核求值、空请求失败、默认单回复及独立继承count。|
|raw_queries|module386–432与同一handler核两表达式、非零正整数N及回复计数；不预解析命令数、不保证事务。|
|literal_raw_query|固定Nginx字符串setter1066–1089、handler189–199核字面字符串与单回复；空字符串走complex分支。四种字段由module228–243分别继承，运行时queries优先、其次非空literal、最后complex。|
|pass|module250–309真实content绑定、handler22–104及util54–98核动态目标仅按已登记host/port0查找；handler227–273合法首字节直接200，不把Redis错误/空值自动映射HTTP错误。|
|bind|module70–75注册TAKE1、147–246完整create/merge及module.h12–20核local为pcalloc零值且无哨兵赋值；固定Nginx upstream6433–6529先比较NGX_CONF_UNSET_PTR（conf_file.h58为(void*)-1），NULL首次即duplicate，off不可达。6533–6552核未配置不绑定；不声称实际运行或transparent可用。|
|connect_timeout|默认60s与局部merge、真实msec offset；共享upstream1660–1669及timeout_fields补丁核NGX_AGAIN连接等待，不是总预算。|
|send_timeout|同上默认/回调，upstream2113–2150及补丁核写等待和请求级send_timeout。|
|buffer_size|size setter1198–1225、module147–246、upstream2394–2433、handler227–298、reply256–306/632–728核pagesize及非缓冲续接，不是回复总上限；正文解析不冒称头前重试。|
|read_timeout|upstream2174–2187/3797–3815及补丁核首响应与后续读取分别计时，不是N命令累计预算。|
|next_upstream|module22–29、真实bitmask setter1389–1431和merge核not_found实际存在、off覆盖；upstream2474–2517/2528–2562/4406–4426核invalid_response、次数及HTTP非幂等限制，不以Redis命令判断幂等。|

逐项注册34–110、真实定义/offset/post、lifecycle115–145和本条source_ids核对完成。发行mirror-tarballs732–735仅解包；实际复用隔离回放34patch/142hunk、47最终SHA全部一致，17个Nginx引用13保持、4变化仅对应三个timeout，affected/unaffected逐事实匹配。106个显式+注册+callback引用均在固定Git真实EOF内，另22个catalog自动来源对应NOTES总128；owner集合11相符。无新增finding，E01可整owner集成，不等Redis8。

## E02：Redis完整owner8项准备通过

完整NOTES与固定README全文已读；固定组件 `411fef36e130129b670fa7f2672bcad6ab2cbdd3`。规范全文即原序8项子集SHA `ad5c9b63c8e1a4d5744440bb533a7efe0dcb9d26077279f1ac77a036364d1cd3`。身份前缀 `redis-nginx-module/ngx_http_redis_module/`：

```text
redis_pass
redis_bind
redis_connect_timeout
redis_send_timeout
redis_buffer_size
redis_read_timeout
redis_next_upstream
redis_gzip_flag
```

|逐项|实际语义核对（组件ngx_http_redis_module.c）|
|---|---|
|pass|原callback898–940、handler175–264、request268–414、reply494–555/597–623核GET/HEAD、非空key、可选AUTH、默认SELECT0及值正文；变量pass补丁完整189行与default_port补丁17行另核，最终目标只查预登记host/port0，不作任意DNS；原版callback明确不是发行最终代码。|
|bind|注册74–79受nginx_version>=8022保护，当前满足；21–28结构、776–894完整create/merge与共享setter6433–6529/哨兵conf_file.h58/未配置消费6533–6552核NULL并非UNSET，首次声明及off均在duplicate处分流。变量补丁只追加complex_target，不修复local初始化；本条明示事实unaffected成立。|
|connect_timeout|真实msec setter/offset、776–894默认60s及merge，共享1660–1669与timeout_fields补丁核请求级connect_timeout，不是AUTH/SELECT/GET总预算。|
|send_timeout|共享2113–2150及补丁核写等待；349–414核发送的认证/选库/读键请求，默认60s。|
|buffer_size|真实size setter、425–482头部扫描、629–754流式filter及共享2394–2433/2474–2496核pagesize、头满INVALID_HEADER和去除尾CRLF，不误作最大对象长度或正文错误可重试。|
|read_timeout|共享2174–2187/3797–3815及补丁核首应答及后续非缓冲读等待，默认60s，非整段传输预算。|
|next_upstream|54–61表、真实bitmask setter及merge核error timeout默认、同层累加/off覆盖；494–555/613–625及共享2474–2517/2528–2562/4406–4426区分空值404、-ERR的502与INVALID_HEADER，不许诺已发正文后恢复。|
|gzip_flag|真实num setter、891默认0、557–587实际非零判断；不是flags位掩码、不压缩或探测数据。remove_content_encoding补丁完整14行只删旧字段赋值，保留headers列表Content-Encoding:gzip，不解释为删除响应头。|

逐项注册66–122的context/arity/guard/post、真实callback及lifecycle130–158核对；所有defaults/inheritance/limitation/patch source_ids已逐条对照，各查询目标完整继承未知保持不推定。77个显式+注册+callback引用加16个catalog自动来源共93，固定Git真实EOF通过，未将末尾LF算虚构行。Nginx18片段14保持，4处timeout计时变化与候选affected一致。

实际调用既有redisPatchScope，在内存追加最终树读回，不改脚本：发行692–715确认按variables_in_redis_pass→default_port_fix→remove_content_encoding顺序，当前版本满足第三项条件；3patch/8hunk、offset/fuzz与REDIS_PATCH_AUDIT一致。最终ngx_http_redis_module.c SHA `a22574b45a0ee2be65626d9cdc4bc5d4f7d4215a5aa22f31d8952d1f68d4db2a`。29个组件显式/定义片段中4处变化分别为pass callback、handler、bind结构体增加字段、gzip旧字段删除；其余保持（计入注册/自动来源即NOTES的53/49）。最终树200–249/593–622/934–1043实际读回核变量选择、保留头列表、配置编译与旧版本default_port保护；默认端口不是通用动态解析。临时副本finally清理。无新增finding，E02可整owner集成。

## 本次授权队列收口

HTTP71、Stream49、RDS16、Drizzle12、Postgres10、Redis2 11、Redis8，共177项内容审核通过；L-R01至L-R06均已差异闭环，无新增待修。各窗口以本文完整身份集合和规范JSON子集SHA为准；D02/E01/E02本轮均完成，不再留在队列。正式892及最后125统一构建安排为用户提供的主集成状态，本角色不复核或提前计入正式覆盖。唯一永久写入本审核文件，未修改候选/NOTES/source/knowledge/current，未根build、运行服务或新建agent。交主与Harvey作正式接入，完成后停写。
