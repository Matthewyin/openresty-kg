# HTTP resolver 与代理三项超时运行时独立审核

日期：2026-10-13。状态：最终审核通过，签署发布 `1.27.1.1-c49915e4ed7a7e58`。冻结四项35步、R1–R4修复、固定来源及全字段边界已独立核对；主线程全测、定向测试、样例及浏览器验收记录已接收核对。以下保留阶段记录，最终状态以末节签署为准。

## 深度交互：审核结论与边界

计划的目标、四身份范围、固定源码及34项补丁边界合理，允许字段足够精简。计划明确区分结构校验、逐步语义核对与最终发布验收，无需扩大产品改动。当前风险集中在测试是否真正兑现计划中的逐步证据闭合及字段白名单。

本次已读完整规划、专项测试、运行时校验实现及补丁审计配置；只读确认当前发布仍为 `1.27.1.1-f8c21e3662af9366`、5 deep，四项 curated 尚无 runtime。旧发布上缺 runtime/deep 导致专项失败符合预期，不作为新实现失败证据；主线程告知的10项失败未由审核方重跑。文件仍在并行编辑，下列行号对应本次读取版本。

## 直接执行：退回主线程的具体问题

### R1：四个源码专项使用未定义变量，阻止新发布验收

位置：`test/http-timeout-runtime.test.mjs:22`、`:183`、`:197`、`:209`、`:221`。

文件只声明 `streamFile = 'src/stream/ngx_http_proxy_module.c'`，却在四个源码专项中使用未声明的 `upstreamFile`。旧发布先在缺 runtime 断言退出，会掩盖该错误；新增 runtime 后将触发 ReferenceError，无法进入源码断言。

修复要求：由主线程将常量修正为实际引用名及文件 `src/http/ngx_http_upstream.c`。审核不修改测试。此项为确定的阻断问题，与 Sol 的运行时内容质量无关。

### R2：总引用检查不能证明每步失败出口绑定正确

位置：`test/http-timeout-runtime.test.mjs:23–36`、`:181–232`；对应计划第63行。

`runtimeEvidence.at()` 仅从 `runtime.source_ids` 的总来源选择包含行号的片段，且优先取最大范围；没有定位对应步骤及该步骤的 `source_ids`。把失败回调引用移到另一无关步骤，同时保留总引用并集，仍可能通过当前结构校验及源码专项。现有“修改 action”负例仅证明发布与 curated 不一致时会失败，不能证明二者同步漏写失败出口时被发现。

修复要求：源码专项对相应步骤的引用片段做断言；至少增加一个负例，将失败出口证据从对应步骤移到无关步骤、总引用保持不变，仍必须失败。头部 `#if 0`、TLS已有timer复用、DNS失败直接结束、已发头部转换等关键边界同时检查对应步骤的描述，不能只证明这些代码存在于 runtime 总来源。

### R3：patch_status 整对象豁免超过字段白名单

位置：`test/http-timeout-runtime.test.mjs:78–83`、`:162–173`；对应计划第47、54行。

当前检查 status 不变后，拿整份 patch_status 与当前 curated 比较，随后在全字段比对前把整个对象替换为旧对象。若 curated 与发布同时新增未获准字段，该字段会被整体豁免。计划只允许 note 与 source_ids 变化，整对象替换未限制键集合。

修复要求：只归一化 note 与 source_ids，再将其余 patch_status 字段与基线深比较；加入 curated 与发布同步增加额外 patch_status 字段的负例。既有 verified_affected 状态检查有效，应保留。

### R4：旧 evidence 的删除与重排缺少输入侧保护

位置：`test/http-timeout-runtime.test.mjs:73–76`、`:82–83`、`:169–171`；对应计划第46、62行。

来源期望先由基线 sources 填充，再覆盖当前 evidence，并按ID排序比较。它能保护已发布旧来源的内容，却不能单独证明原始 curated evidence 保留原顺序及全部旧定义：删除旧 evidence 后，旧来源仍可能从基线期望或其他构建来源存在；重排也会被排序消除。

修复要求：利用主线程已有的修改前知识快照，独立比较四项旧 evidence 前缀/原顺序及逐字段定义；不能用实施后的 curated 自身生成基准。如已有单独写集合审核，应在最终验收记录明确给出快照与结果。补删除、重排旧 evidence 的负例或等价独立比对证据。

## 已确认有效的测试设计

- 实际 sources 未先替换 code；使用固定 Git 对象构造逐字片段及 component/version/revision/file/行号/URL/kind，比较整个来源集合。重复来源、额外来源、伪造代码和元数据有负例。
- 四项 patch 状态独立与固定基线比对，覆盖 curated 与发布同步改成 verified_unaffected 的情况。
- 非四项详情排除 release_id 后深比较；四项默认、继承、limitations、verification_notes 等未整体放行。旧5项 deep 身份与正文受保护，新增身份集合精确比对。
- 空步骤、空步骤引用、缺文档、注册/配置完整及裁剪别名、漏补丁覆盖、缺runtime与unverified降级已有负例。
- 已补四个源码专项，涵盖 DNS、TLS、pipelining、缓冲/非缓冲/升级分支。独立从 nginx 固定提交抽查确认头部 read timer 位于 `#if 0`；缓冲路径包含 BAD_GATEWAY 出口；finalize 在 header_sent 边界后可将特殊响应转为 NGX_ERROR。此为局部源码核对，不代表已完成四项逐步审核。

## 后续审核入口与最终签署条件

等待 Sol 冻结四项及 EVIDENCE 后，按规划逐步检查条件、消费字段、顺序、成功及失败出口、scope、独立文档和对应步骤引用。确认34项补丁的名称/顺序/固定发行映射，逐项判断与新增片段交集，详细读取相关原始 hunk；不能将本次已确认配置列表长度34写成完成34项审核。

重点复核：响应头 read timer 禁用分支；TLS计时器复用；pipelining；请求级有效timeout及Lua覆盖时机；已发响应头不保证新504；DNS失败502且不走代理重试；buffered/nonbuffered/upgrade及客户端方向区别。

收到主线程的新 release 与验收结果后，独立读实际发布，对固定 f8c21 基线核全字段、实际来源和精确9 deep；复核主线程测试、历史兼容、样例及页面结果后再签署。主线程的构建、全测、浏览器及私有样例操作不由审核方代做。

本次仅以 apply_patch 写本审核文档；未改知识、测试、产品或dist，未构建、运行测试、操作浏览器或读取私有样例，未产生临时文件。

## 冻结前独立源码核查：34项补丁交集

本节为新增的独立审核依据，不重做规划，不把尚未冻结的实施当作被审定内容。所有源码由本地 `git show <固定提交>:<文件>` 只读取得；没有执行发行脚本、补丁回放或测试。固定 nginx 提交为 `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`，OpenResty 提交为 `8c37412c31621225e7aa7e825b5b50106c9c71c4`。

已逐项读取34份原补丁的目标文件头，并对下表直接相关项读取 hunk。发行依据为 OpenResty `util/ver:3–5` 的1.27.1/1，以及 `util/mirror-tarballs:35–548` 的顺序和版本门槛：本版本跳过旧安全补丁和旧版本专用分支，SSL session选择 sess 而非 pending 分支；有效顺序与审计 JSON 相符。server_header仍使用发行脚本的 `.unknown` → `.1` 替换规则。本次没有重新证明既有47文件回放摘要。

主目标文件集合：HTTP upstream及头文件、HTTP core/proxy模块、resolver、event connect、event timer的 `.h/.c`、event pipe。下表“无直接交集”只指该集合，不宣称对整个请求系统完全无影响。TLS函数向下追踪时另检查3份OpenSSL补丁。

| 顺序 | 补丁 | 独立交集结论 |
| --- | --- | --- |
| 1 | win32_max_err_str | 仅win32事件日志文件，无直接交集。 |
| 2 | stream_balancer_export | stream轮询及头文件，无直接交集。 |
| 3 | stream_proxy_get_next_upstream_tries | stream头文件及代理，无直接交集。 |
| 4 | stream_proxy_timeout_fields | stream请求字段及计时，无HTTP直接交集。 |
| 5 | stream_ssl_preread_no_skip | stream预读，无直接交集。 |
| 6 | resolver_conf_parsing | resolver创建阶段新增非Windows local=读取，影响解析服务器来源；不修改请求DNS超时回调。 |
| 7 | daemon_destroy_pool | Unix daemon，无直接交集。 |
| 8 | init_cycle_pool_release | nginx/core头文件/cycle/process_cycle，无直接交集。 |
| 9 | balancer_status_code | upstream_connect在NGX_ERROR之后、BUSY/DECLINED之前新增特殊HTTP状态直接finalize；不能把所有非成功返回都写成重试。 |
| 10 | builtin_error_page_footer | special_response页面内容，无直接计时交集。 |
| 11 | delayed_posted_events | event主循环及posted队列；不修改本次timer/pipe文件。不能将事件调度全局行为描述为未受影响。 |
| 12 | privileged_agent_process | nginx/cycle/process_cycle，无直接交集。 |
| 13 | privileged_agent_process_connections | nginx/cycle/process_cycle，无直接交集。 |
| 14 | privileged_agent_process_thread_pool | core thread_pool，无直接交集。 |
| 15 | single_process_graceful_exit | Unix process/process_cycle，无直接交集。 |
| 16 | intercept_error_log | cycle头文件及log，无直接计时交集。 |
| 17 | upstream_pipelining | send_request_handler的提前停写条件从header_sent改为request_body_sent，结合preserve_output决定是否dummy handler。 |
| 18 | server_header | nginx版本头及响应头过滤器，无直接计时交集。 |
| 19 | no_error_pages | 同HTTP core文件，但修改error_pages注册/初始化/继承与处理，不修改resolver注册/合并/创建消费。 |
| 20 | no_Werror | 编译器配置，无直接交集。 |
| 21 | log_escape_non_ascii | HTTP log模块，无直接交集。 |
| 22 | proxy_host_port_vars | 同proxy文件，仅改变proxy_host/proxy_port/proxy_add_x_forwarded_for变量注册标志，不修改超时配置或proxy_eval解析流程。 |
| 23 | cache_manager_exit | process_cycle，无直接交集。 |
| 24 | larger_max_error_str | log头文件，无直接交集。 |
| 25 | pcre_conf_opt | auto/options，无直接交集。 |
| 26 | always_enable_cc_feature_tests | auto/cc/conf，无直接交集。 |
| 27 | ssl_cert_cb_yield | 不改主目标文件；下层ngx_ssl_handshake/early_data新增WANT_X509_LOOKUP等待分支，仍通过NGX_AGAIN回到上层timer逻辑。 |
| 28 | ssl_sess_cb_yield | 不改主目标文件；下层握手扩展PENDING_SESSION条件，不能据此另造HTTP connect计时规则。 |
| 29 | ssl_client_hello_cb_yield | 不改主目标文件；下层握手扩展WANT_CLIENT_HELLO_CB条件，不修改上层timer_set判断。 |
| 30 | upstream_timeout_fields | upstream_init将三项配置复制到请求字段；替换连接、TLS、请求发送、响应头等待、pipe赋值、升级读写、非缓冲读的全部8处消费；头文件声明宏及三个字段。 |
| 31 | safe_resolver_ipv6_option | resolver创建配置分支：无IPv6构建中ipv6=off被接受，ipv6=on报错；同时移动ipv4选项外围条件。未修改请求回调。 |
| 32 | socket_cloexec | event_connect与resolver TCP socket新增CLOEXEC创建及fcntl失败路径；还涉及构建检测/event头/accept/process_cycle/socket头。不是新增超时，但影响连接前错误出口。 |
| 33 | reuseport_close_unused_fds | connection及event主文件，无主目标直接交集。 |
| 34 | proc_exit_handler | cycle及Unix process/头文件，无直接交集。 |

8项与主目标文件相交：6、9、17、19、22、30、31、32。其中19/22只同文件异分支；27/28/29作为TLS下层调用另行读过，不能从文件集合排除推成TLS完全不受补丁影响。34项均未直接修改 `ngx_event_timer.h`、`ngx_event_timer.c`、`ngx_event_pipe.c`。

关键原补丁坐标：`upstream_timeout_fields.patch:5–112`；`upstream_pipelining.patch:15–23`；`balancer_status_code.patch:5–16`；`resolver_conf_parsing.patch:36–218,224–263`；`safe_resolver_ipv6_option.patch:25–60`；`socket_cloexec.patch:37–67,118–149`。这里的补丁文件均位于固定OpenResty提交的 `patches/nginx-1.27.1-` 前缀下，绝不将hunk目标数字用作上游公开引用行号。

## 冻结前独立源码核查：关键语义与失败出口

以下 `upstream.c` 均指固定nginx提交的 `src/http/ngx_http_upstream.c`。表内数字是上游原文件行号，实际发行字段替换依上一节原补丁解释。

| 分支 | 独立核对结论及原始坐标 |
| --- | --- |
| DNS入口及绕过 | 已配置组匹配/直接sockaddr可以绕过动态DNS；无端口与peer构造失败是500。`upstream.c:715–784` 区分resolve_start返回NULL的500、NGX_NO_RESOLVER的502，以及resolve_name启动失败的500。不能笼统写“所有解析失败502”。 |
| DNS请求等待 | `ctx->timeout = clcf->resolver_timeout` 位于775；resolver.c:4072–4105仅在无event且timeout非零时建等待timer，超时设NGX_RESOLVE_TIMEDOUT再调用ctx handler。该计时独立于proxy_connect_timeout。 |
| DNS缓存与共享 | resolver.c:643–699有效缓存构造地址并回调；752–767已有waiting时挂入共享队列，为请求设置等待并标async。不能把共享查询等同每个请求重新发DNS。 |
| DNS回调失败 | `upstream.c:1214–1221` 非零state直接finalize(502)，不调用upstream_next；1245–1248结果转peer失败finalize(500)；1251–1262成功清理ctx、记录peer起点并连接。4518–4520负责结束时清理未完成ctx。 |
| 连接即时返回 | `event_connect.c:34–37`先调用peer.get；socket失败46–49为NGX_ERROR；connect拒绝245–248为NGX_DECLINED；252–264区分NGX_AGAIN/OK。`upstream.c:1560–1576`分别500、NOLIVE/ERROR交给next，另叠加balancer特殊状态直接finalize补丁。socket_cloexec的fcntl失败不能误写为连接超时。 |
| 连接与TLS等待 | `upstream.c:1664–1667`仅NGX_AGAIN挂write连接timer；1747–1756 TLS NGX_AGAIN仅在无write timer时新增，已有timer被复用。1825–1832区分TLS timedout→FT_TIMEOUT与其他握手失败→FT_ERROR；不是每进入TLS就重新获得完整预算。 |
| 请求级字段与Lua | 补丁在upstream_init一次复制三字段，后续消费u字段。固定Lua提交 `ea09d92adf835e30cab8d79343c7b8266e888128` 的balancer.c:1067–1150要求request/upstream/context存在且处于BALANCER；各参数仅正值才覆盖字段。412–455在peer选择回调内执行Lua handler；结合event_connect.c:34与upstream.c:1555、1664，覆盖发生在本次连接计时前。setter本身不重挂timer，也不修改其他请求配置。 |
| 请求发送 | `upstream.c:2101–2150` send body错误走FT_ERROR，特殊状态直接finalize；NGX_AGAIN且write未ready或request_body_blocked才挂send timer，否则已有timer删除；NGX_OK删除write timer。2322–2324写超时走FT_TIMEOUT。2336条件按pipelining补丁解释为request_body_sent，而非header_sent。 |
| 响应头读等待 | `upstream.c:2174–2186`第一次request_body_sent转换且未header_sent时设置read timer；2384–2386超时走FT_TIMEOUT；2441–2444的读等待重挂位于#if 0，非生效路径。不得用文档“连续读取间隔”概括成头部每收一批字节重置。 |
| 通用timer | `event_timer.h:19,50–86`新key为current+timeout，但已有timer的新旧差绝对值小于300毫秒时直接保留旧timer；否则删除再插入。`event_timer.c:54–94`到期移除、清timer_set、置timedout后调用handler。不能承诺毫秒精确截止或每次add都物理重置。 |
| 缓冲读 | `upstream.c:3336–3338`经补丁p->read_timeout来自请求u->read_timeout，p->send_timeout来自HTTP core的clcf->send_timeout。`event_pipe.c:60–78`须连接有效且!delayed，active&&!ready时挂read timer，否则删除；81–96是客户端write方向。 |
| 缓冲失败 | `upstream.c:4105–4130`超时置upstream_error后进入process_request；4143–4160有线程写入尚未完成时返回的条件，4211–4228还先检查已完成/合法EOF，其他错误出口才finalize(502)。不能表述为所有缓冲超时即时无条件返回502，更不能混为非缓冲504。 |
| 非缓冲读与客户端 | `upstream.c:3675–3678`上游read超时finalize(504)；3809–3813依active&&!ready设置/否则删除read timer。3651–3655客户端write超时为408，属于客户端方向。 |
| 升级连接 | `upstream.c:3463–3473`客户端write超时408，上游read或write超时504，均直接finalize；3581–3585上游write用send字段，3600–3604上游read用read字段，3626–3627客户端write使用clcf->send_timeout。不走代理下一上游重试分支。 |
| 重试顺序及限制 | `upstream.c:4342–4358`先peer.free再判断后续tries；4371–4405将FT_TIMEOUT映射504；4407–4410客户端连接错误先转499；4417–4426叠加已发非幂等方法、tries、next_upstream掩码、未缓冲已发请求体及next_upstream_timeout限制。4428–4455还有满足条件时使用stale缓存的分支；不满足重试时不保证一定给504。真正重连在4484。 |
| 已发头部 | `upstream.c:4630–4666`未发头部或408/499直接交HTTP finalize；其他已发头部的特殊响应转NGX_ERROR并flush，不能声称客户端必收到一份新502/504。状态码在上述各表项表示内部finalize参数，不是网络响应保证。 |

冻结后优先看是否漏绑 TLS失败1825–1832、buffered状态转移4105–4130与最终出口4211–4228、最终header_sent边界4630–4666、DNS回调1214–1262。仅出现上游timer代码、总sources包含出口，仍不等于对应步骤证据闭合。R2继续等待主线程按冻结步骤补齐。

本轮未复审R1/R3/R4、未读取未冻结runtime作为结论依据；只追加本审核文档，未运行任何测试、build、补丁回放、浏览器或私有样例。

## 正式冻结稿复核：c49915e4ed7a7e58

本节更新前述阶段状态。已完整读取 Sol 的 `SAMPLE_HTTP_TIMEOUT_RUNTIME_EVIDENCE.md`，核对冻结稿35步（resolver 9、connect 9、send 7、read 10）及对应来源。采用前节已独立读取的固定源码、原补丁和本次补读的peer构造、proxy求值、resolver等待/清理、Lua peer安装、SSL事件及关闭timer源码作判断，不仅比较curated自身。

结论：未发现需要退回修改的语义或步骤绑定问题。以下逐步记录的“通过”只表示本稿限定范围的固定源码内容审核，不代替最终交付签署。

### 35步核对记录

| 身份/步骤 | 对应核查结果 |
| --- | --- |
| resolver 1 | 通过：handler/eval的失败500、no_resolve及目标保存与实际片段一致。 |
| resolver 2 | 通过：组优先、直接地址、缺端口500与条件DNS分支均有本步引用。非Unix与缺端口须合并理解，非Unix地址本身不是错误。 |
| resolver 3 | 通过：NULL为500、NO_RESOLVER为502、ctx resolver_timeout及同步ERROR500直接闭合。 |
| resolver 4 | 通过：有效地址答案缓存及valid/TTL，未将错误ctx.valid误称通用负缓存。 |
| resolver 5 | 通过：共享waiting、新查询发送失败再试一次、AGAIN转OK及同步ERROR出口有交叉片段。 |
| resolver 6 | 通过：错误state、定时到期、HTTP回调502在同一步；未套代理FT_TIMEOUT/重试。 |
| resolver 7 | 通过：地址复制、端口、get/free/tries安装、构造500与成功移交connect闭合。 |
| resolver 8 | 通过：成功及finalize清理ctx，等待链摘除和timer释放有实际代码。 |
| resolver 9 | 通过：连接返回值与balancer特殊码补丁同一步，scope只保留连接交接。 |
| connect 1 | 通过：handler配置交接与upstream_init复制请求字段相符。 |
| connect 2 | 通过：Lua get安装、调用时机、BALANCER限制、正数覆盖及不直接重排timer。 |
| connect 3 | 通过：DNS timer及HTTP失败回调在本步，区分连接等待。 |
| connect 4 | 通过：peer.get、socket/connect返回、内部失败及cloexec/balancer补丁，未将所有失败泛化为超时。 |
| connect 5 | 通过：AGAIN write timer、OK/DONE推进与lazy delay说明。 |
| connect 6 | 通过：timer到期→HTTP分派→写handler；test_connect及TLS初始化检测有引用。 |
| connect 7 | 通过：timer_set复用、SSL事件到HTTP回调、握手timeout/error与成功交接均绑定；SSL补丁限定shared handshake。 |
| connect 8 | 通过：发送阶段更新/删除同一write timer，重试/finalize关闭及timer清理闭合。 |
| connect 9 | 通过：先free后tries，完整策略、非幂等/无缓冲/累计窗口、499、stale及已发头特殊状态边界齐全。 |
| send 1 | 通过：请求级有效值及Lua消费链完整。 |
| send 2 | 通过：缓冲与非缓冲body的AGAIN/blocked，发送timer条件与事件注册失败500对应。 |
| send 3 | 通过：到期FT_TIMEOUT、pipelining补丁改request_body_sent、body错误及特殊码出口直接绑定。 |
| send 4 | 通过：OK删write timer、首次完成及header_sent判断后转read等待。 |
| send 5 | 通过：重试门槛、stale及已发头不保证新504。 |
| send 6 | 通过：upgrade处理器、上游write timer及直接finalize504与已发头转换。 |
| send 7 | 通过：pipe/upgrade客户端write取core send_timeout；关闭清timer有引用。 |
| read 1 | 通过：初始化及Lua有效字段。 |
| read 2 | 通过：请求体首次完成且未header_sent的read timer起点。 |
| read 3 | 通过：头部#if 0不生效、AGAIN注册、错误/EOF和超时出口分别正确。 |
| read 4 | 通过：头部超时的next门槛、候选504/stale/499，未承诺立即返回504。 |
| read 5 | 通过：非缓冲安装/读timer/直接504及header_sent转换，客户端write方向区分。 |
| read 6 | 通过：p.read_timeout赋值、!delayed及active/ready条件、客户端pipe send字段和NGX_ABORT。 |
| read 7 | 通过：delayed+timedout先清标记，真正超时置upstream_error，process_request完成/EOF优先与候选502、已发头转换同一步。该描述未承诺即时完成，线程写入等待仍属于前节已记录的外围条件。 |
| read 8 | 通过：upgrade上游read timer、上游504/客户端408及最终响应边界。 |
| read 9 | 通过：lazy timer和已发头特殊状态转换/flush，未将内部状态当作客户端响应保证。 |
| read 10 | 通过：finalize、重试关闭、close_connection删timer及到期标记有真实源码。 |

独立文档核对：四项official-doc及新增resolver_timeout、proxy动态域名、proxy_next_upstream片段均来自冻结的nginx-docs提交，支持已声明scope；未用其简述覆盖头部#if 0或buffered内部502分支。EVIDENCE的34项交集判断与前节独立调查一致，明确既有回放记录与本轮未回放的区别。

### R1–R4修复复核

- R1关闭：测试第23行已定义正确的 `upstreamFile = 'src/http/ngx_http_upstream.c'`。
- R2关闭：第33–42行辅助函数先唯一定位对应condition，再仅在本step引用内验证代码锚点；第264–312行覆盖6类关键边界。移错负例移除对应步骤全部覆盖该锚点的引用并放到其他步骤，保持总source_ids不变，明确要求validateRuntime仍成功、语义绑定检查失败；另有错误正文负例。因此已补足总集合存在但步骤错绑的缺口。
- R3关闭：第30–32行仅归一化note/source_ids，剩余键全等；第114–115行actual/curated同步extra仍须拒绝，未再整对象放行。
- R4关闭：第24–29行使用主线程在实施前冻结的11/7/8/10条前缀摘要，第93–95行删除/重排负例。摘要来源依据主线程的实施前冻结交接，审核没有把新curated当作旧基准；既有来源另与固定发布逐字段核对。

本轮只核读上述测试实现，不自行运行测试。主线程报告的36/36定向通过按外部验收输入记录，非审核方执行结果。

### 实际发布独立只读核对

已对 `1.27.1.1-c49915e4ed7a7e58` 执行内存中的发布数据检查（不调用测试套件、不构建、不写dist）：

- 四项共158条curated evidence，包括旧36条及新增122条，逐条与固定Git片段的component/version/revision/file/行号/code/URL/kind全等；实际发布runtime与冻结稿全等。
- 逐步引用按首次出现去重后与runtime.source_ids精确全等；旧patch引用前缀、旧sources完整对象均保留，patch只允许note/source_ids变化。
- 全1041项详情的release_id与本发布一致；四项排除明确允许字段后与f8c21全等，其他1037项仅排除release_id后全字段全等，含原5 deep。
- 索引按允许发布路径、四项评级及deep计数归一化后与基线全等。1041 basic/9 deep；bundled 1017/9，department_extension 24/0；9 deep精确为旧5项加本轮4项，未扩其他身份。

主线程另报告原样例A24/24、external2，B258/258、external1，50身份默认/继承0 unverified；审核未读取私有样例。全量测试及浏览器仍进行中，待主线程提供结果并确认最终release未变，再决定最终签署。本节为“内容审核通过、发布边界已核对、最终验收待完成”。

## 最终签署

签署结论：通过。精确发布为 `1.27.1.1-c49915e4ed7a7e58`，固定比较基线为 `1.27.1.1-f8c21e3662af9366`。没有未关闭的阻塞问题；R1–R4均已复核关闭。

已读取主线程 `SAMPLE_HTTP_TIMEOUT_RUNTIME_VERIFICATION.md` 的实际验收段，并核对 `sample-http-timeout-runtime-tests.log` 末尾：167 tests、167 pass、0 fail/cancelled/skipped/todo，耗时32283.69975毫秒。定向36/36来自主线程验收记录。审核未代跑测试。

主线程记录62415网页验收：A24/24与外部引用2、B258/258与外部引用1；四项35步的condition/action、顺序、scope、全部步骤代码和文档URL、deep徽标逐字段与dist一致；截图 `sample-http-timeout-runtime-browser.png` 已落盘。浏览器及原样例结果采用主线程实测记录，审核只读核对该记录及截图文件存在，未操作浏览器或读取私有样例，不将单张截图视为全部字段匹配证明。

签署前再次确认current仍指向c499，四项实际发布runtime和patch_status与冻结curated全等，步骤仍为9/9/7/10。结合本审核已完成的固定Git来源逐字核对、34项补丁交集、35步语义/出口/绑定及全1041项发布边界检查，确认1041 basic/9 deep、bundled1017/9、部门扩展24/0；旧5 deep及其他1037详情保持。

签署范围仅为四项固定源码静态运行链知识补全及该发布的产品验收，不代表已编译/运行OpenResty、真实网络请求或生产现场已验证。后续如runtime、evidence、patch_status或发布内容变化，本签署不自动适用于新版本，需按改动复核。

审核写集合始终仅本文件，所有写入使用apply_patch；未修改知识、测试、产品、dist或主验收文档，未生成需清理的临时文件。
