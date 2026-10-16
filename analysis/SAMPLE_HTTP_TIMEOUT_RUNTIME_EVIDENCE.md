# 样例 HTTP resolver 与代理超时运行时证据

日期：2026-10-13。实施角色；已完整读取 `SAMPLE_HTTP_TIMEOUT_RUNTIME_PLAN.md`，参照已有 HTTP proxy_pass 链及 `SAMPLE_STREAM_RUNTIME_EVIDENCE.md` / `SAMPLE_STREAM_RUNTIME_REVIEW.md` 的证据闭合和字段保护要求。以下为固定源码静态核读与有限知识实施，不是构建、发布或真实 OpenResty 网络验证。

## 深度交互：目标、最小路径与冻结边界

只补 nginx/ngx_http_core_module/resolver，以及 nginx/ngx_http_proxy_module 的 proxy_connect_timeout、proxy_send_timeout、proxy_read_timeout。复用现有 runtime schema 与基础事实，不改产品、测试、dist、其他知识条目或晋级规则。resolver_timeout、重试、TLS、缓冲及升级连接仅解释本批直接依赖，不单独升级。样例出现次数按主线程确认的20/2/2/2引用；实施未读取私有原样例。

基线固定 `1.27.1.1-f8c21e3662af9366`，直接读取该发布四详情和索引，确认原5 deep、本批四项 basic。四项 limitations 均已显式对象，逐字等于基线发布，无须表示层转换。本轮不改 limitations、defaults、inheritance、summary、syntax、phase、related 或旧 evidence。

源码、文档与补丁均从本地固定对象 `git show revision:file` 取证；没有联网、重放补丁、运行 OpenResty、构建或读取 current 发布指针代替基线。

| 来源 | 固定 revision | 版本 |
| --- | --- | --- |
| nginx | e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928 | 1.27.1 |
| OpenResty | 8c37412c31621225e7aa7e825b5b50106c9c71c4 | 1.27.1.1 |
| nginx-docs | e8b581903e9d41252720053311cea687a5671674 | 2024-08-15 |
| lua-nginx-module | ea09d92adf835e30cab8d79343c7b8266e888128 | 0.10.27 |

前三对象与项目配置/审计一致，Lua对象从 `analysis/components.json` 冻结；各子仓库 HEAD 一致且工作区 diff 无变更。新增 evidence 全部显式 component，不依赖隐式组件推断。上游与补丁保留各自原始坐标，不把补丁后行号冒充固定上游行号。

## 直接执行：HTTP resolver 的9步

下列行号均为固定 nginx 对象；模块文件简写仅用于本记录，curated evidence 保存完整路径。

| 步骤 | 消费源码与范围 | 核定结果及出口 |
| --- | --- | --- |
| 1 动态求值 | http/modules/ngx_http_proxy_module.c:956–975、1032–1094、1115–1131；http/ngx_http_upstream.c:693–753 | handler变量路径调用eval；失败500。no_resolve=1的URL处理保存目标，不在此发DNS；静态目标使用已保存upstream。 |
| 2 条件分流 | upstream.c:693–753 | 先按名称/端口匹配配置组；命中不消费此resolver。直接sockaddr创建peer再连接；非Unix地址或未解析域名缺端口500。仅未命中组且无直接地址的有效端口域名进入DNS。 |
| 3 resolver对象与timeout | upstream.c:648–653、755–786；core/ngx_resolver.c:394–429 | 消费core loc_conf的resolver，NO_RESOLVER是502，ctx分配失败500。安装HTTP回调、data与resolver_timeout；同步启动ERROR清空指针并500。 |
| 4 地址答案缓存 | resolver.c:638–705、2443–2476 | 有效且有地址的节点直接回调，不每请求发DNS。成功地址答案按valid非零覆盖或TTL缓存；不将错误ctx.valid误称通用负缓存。 |
| 5 等待/查询 | resolver.c:752–767、861–912、484–510；upstream.c:755–786 | 共享waiting仍给当前ctx设解析timeout；新查询选择服务器、发送失败另试一次、安排等待及重发。AGAIN转OK只表示已接受等待；同步内部ERROR由HTTP调用方500。 |
| 6 错误/超时回调 | resolver.c:2131–2149、4073–4106；upstream.c:1192–1269 | 错误答案或RESOLVE_TIMEDOUT都经ctx.handler进入HTTP回调，非零state直接502，不走连接FT_TIMEOUT重试链。该步直接绑定失败回调。 |
| 7 成功转peer | upstream.c:1192–1269；http/ngx_http_upstream_round_robin.c:311–427 | 复制地址并补目标端口，构造get/free/tries，失败500；成功清理ctx、设置peer.start_time并限制非零tries，再connect。 |
| 8 清理 | upstream.c:1192–1269、4515–4521；resolver.c:523–602 | 成功或请求结束时name_done；删未到期ctx timer、取消自身waiting并释放ctx/event，不删除其他请求ctx。 |
| 9 连接交接 | upstream.c:1555–1591；balancer_status_code.patch:1–30 | ERROR500；BUSY/DECLINED交NOLIVE/ERROR；补丁特殊返回码直接finalize。只界定DNS到连接的交接，不展开连接缓存或完整重试。 |

独立固定文档：HTTP core resolver 2184–2250（复用official-doc）、resolver_timeout 2253–2267，以及proxy XML 1449–1462的变量域名/组/条件resolver说明。文档不替代内部错误码或回调证据。

## 连接超时的9步及公共有效值链

| 步骤 | 固定消费证据 | 核定结果 |
| --- | --- | --- |
| 1 初始化 | proxy模块973–988、1015–1024；upstream_timeout_fields.patch:1–112 | handler设置u.conf，upstream_init补丁复制三个请求级timeout；不是共享配置永久决定值。 |
| 2 Lua覆盖时机 | lua balancer:343–380、402–441、1066–1151；event_connect.c:34–62；timeout补丁 | init_peer安装get，event_connect先get，Lua get设置BALANCER再执行handler。有效request/upstream/ctx及上下文检查后，正数参数覆盖u字段；非正数保持原值。不改DNS/global，也不在setter内重排已有timer。 |
| 3 DNS区分 | upstream.c:755–786、1192–1269；resolver.c:4073–4106 | resolver_timeout的独立ctx事件，经HTTP回调502；DNS成功才移交connect。 |
| 4 connect返回值 | event_connect.c:34–62、209–264、304–330；upstream.c:1555–1591；balancer/cloexec补丁 | 默认SOCK_STREAM；get非OK直接返回，创建/设置内部ERROR，connect拒绝DECLINED，等待AGAIN，成功OK。HTTP分别500、NOLIVE/ERROR或推进；FD设置也有失败出口。 |
| 5 等待timer | upstream.c:1555–1591、1660–1678；event_timer.h:50–87；timeout补丁 | AGAIN在上游write添加u.connect_timeout；OK/DONE已有连接则推进。截止点按当前时间加值，lazy delay可能保留相近旧值。 |
| 6 到期/检测 | event_timer.c:53–96；upstream.c:1272–1303、2312–2345、2090–2097、2762–2810、1684–1703 | 到期标timedout并调用分派，写超时FT_TIMEOUT；发送前和TLS初始化检测连接，kqueue/SO_ERROR失败FT_ERROR。 |
| 7 TLS直接计时 | upstream.c:1745–1759、1763–1783、1792–1832；event_openssl.c:2143–2163；timeout/SSL yield补丁 | AGAIN且无已有write timer才加connect_timeout，已有TCP timer不在这里重新起算。SSL事件调用上游SSL回调；未handshaked且write timedout去FT_TIMEOUT，其他失败FT_ERROR；成功恢复HTTP发送。 |
| 8 发送交接/关闭 | upstream.c:2101–2150、4462–4485、4544–4575；connection.c:1253–1271；timeout补丁 | 发送等待可把同一write timer更新为send_timeout，可推进或发送OK删timer；重试/结束关闭旧连接清读写timer。不宣称TLS成功处无条件另行删timer。 |
| 9 重试门槛 | upstream.c:4332–4376、4407–4460、4462–4485、4628–4666 | 先free失败peer，再按tries、完整ft_type许可、无缓冲已发正文及累计窗口判断；POST/LOCK/PATCH已发需NON_IDEMPOTENT。TIMEOUT候选504；client error可499，停止可走stale或finalize，允许才关闭重连。已发头后的特殊码转错误/flush，非保证新504。 |

独立固定文档：proxy_connect_timeout 798–810、core resolver_timeout 2253–2267、proxy_next_upstream 1287–1365。文档75秒措辞不转成跨OS绝对上限，也不以文档扩完整TLS机制。

## 发送7步与读取10步的重点证据

三timeout都绑定上述初始化与Lua覆盖消费链。发送步骤依次为有效值、请求体/等待、写事件与pipelining、完成与转读、重试门槛、升级写timer、客户端方向/关闭。读取步骤依次为有效值、头部等待起点、头部recv、头部重试、非缓冲正文、缓冲管道timer、缓冲事件/出口、升级读timer、lazy delay/已发头、关闭清理。

| 消费点 | 固定源码 | 实际条件及出口 |
| --- | --- | --- |
| 请求体发送 | upstream.c:2203–2307、2101–2150 | 缓冲/非缓冲正文按output_chain的AGAIN维护blocked；非缓冲无数据可发也可能AGAIN。仅AGAIN且write未ready或blocked加send timer，否则删；ERROR去FT_ERROR，特殊码finalize，事件注册失败500。 |
| 发送处理器 | upstream.c:2312–2345；upstream_pipelining.patch:1–23 | 写超时FT_TIMEOUT；补丁将停用条件从header_sent改为request_body_sent且非preserve_output，未发完继续发送。该步绑定补丁，不使用原上游条件描述发行行为。 |
| 完成转响应头 | upstream.c:2101–2150、2164–2187；timeout-fields补丁 | 发送OK删write timer；首次正文发完且未header_sent时加u.read_timeout并可立即处理ready。 |
| 响应头 | upstream.c:2370–2392、2436–2466 | read timedout去FT_TIMEOUT；recv AGAIN注册读事件返回；#if 0内add_timer不生效，收到字节不在此循环自动重置。recv错误/EOF去FT_ERROR；注册失败500。 |
| 非缓冲正文 | upstream.c:3022–3042、3070–3098、3779–3815、3660–3681；timeout补丁；finalize:4628–4666 | 上游read active且未ready加u.read_timeout，否则删；读超时直接传候选504，不走next。已发头转错误/flush，不保证新的504。 |
| 缓冲timer | upstream.c:3336–3352；event_pipe.c:60–96；timeout补丁 | p.read_timeout取u.read_timeout；非delayed且read active未ready才加timer，否则删；delayed在此不改timer。pipe.send_timeout取core send_timeout，不是proxy_send_timeout。 |
| 缓冲超时出口 | upstream.c:1272–1303、4088–4131、4211–4228、4628–4666 | 分派先清delayed+timedout恢复标记。仍timedout则p.upstream_error；process_request已有done/允许EOF可0，否则候选502（BAD_GATEWAY），不是非缓冲504。不走next，header_sent后转错误/flush。该步同时绑定置错、消费错误和最终转换片段。 |
| 升级连接 | upstream.c:3374–3380、3572–3586、3588–3605、3460–3474、3607–3631；timeout补丁；finalize:4628–4666 | 上游write/read各active未ready加u.send/read_timeout，否则删。上游任一超时直接候选504，不走next；客户端write超时408，用core send_timeout。已发头不保证新的504；不扩协议。 |
| 清理与精度 | event_timer.h:50–87、event_timer.c:53–96；upstream.c:4544–4575、4462–4485；connection.c:1253–1271 | lazy delay可保留旧截止点；事件过期清timer_set并标timedout，关闭清读写timer。不能声称每字节精确重置或固定全请求/全响应总时限。 |

独立固定文档：proxy_send_timeout 1809–1824、proxy_read_timeout 1621–1636（均复用official-doc）；各自追加proxy_next_upstream 1287–1365，支持头部前重试、正文已交付后的边界，不替代正文内部502/504差异的源码。

## 34项有效补丁逐hunk交集核查

固定有效集合按 `NGINX_PATCH_AUDIT.json` 顺序逐项读目标文件、每个hunk头和变更；共34项、142 hunk。发行脚本35–550中的版本分支与本版本集合核对，注释及旧安全分支不当作有效补丁。下面hunk数包括补丁所有文件，不是“本批受影响hunk数”。旧回放/47文件hash及offset/fuzz为已有审计记录，本轮没有重新执行或将其误称无offset/fuzz。

| 补丁 | hunk数 | 本批交集与结论 |
| --- | ---: | --- |
| win32_max_err_str | 1 | Win32日志长度；无本批直接片段。 |
| stream_balancer_export | 4 | stream TLS session导出；无HTTP直接片段。 |
| stream_proxy_get_next_upstream_tries | 2 | stream getter/宏；无HTTP直接片段。 |
| stream_proxy_timeout_fields | 16 | stream会话字段/计时；不套到HTTP。 |
| stream_ssl_preread_no_skip | 1 | stream preread返回值；无本批直接片段。 |
| resolver_conf_parsing | 3 | resolver include、读取函数、create local分支；保留旧事实证据，不改本批缓存/waiting/回调。 |
| daemon_destroy_pool | 1 | daemon进程pool；无直接片段。 |
| init_cycle_pool_release | 5 | 启动cycle/pool及master退出；无直接片段。 |
| balancer_status_code | 5 | HTTP connect增加特殊码finalize、HTTP能力宏；其余3为stream，不能混用。 |
| builtin_error_page_footer | 1 | special_response页脚；不解释最终错误页，未改本批finalize片段。 |
| delayed_posted_events | 6 | event主循环与posted队列；未改本批timer_add/expire、HTTP分派或pipe片段。不承诺整个事件系统无间接影响。 |
| privileged_agent_process | 15 | helper配置/进程循环；无直接片段。 |
| privileged_agent_process_connections | 6 | helper连接数/启动；无直接片段。 |
| privileged_agent_process_thread_pool | 1 | helper线程池条件；无直接片段。 |
| single_process_graceful_exit | 3 | signal/single退出；无直接片段。 |
| intercept_error_log | 4 | 公共日志拦截；未改本批计时/状态判断，不展开日志行为。 |
| upstream_pipelining | 1 | 发送handler停用条件改request_body_sent；send步骤3绑定。 |
| server_header | 3 | 版本及HTTP/HTTP2 Server字串；未改本批计时/finalize片段。 |
| no_error_pages | 7 | core配置/合并error_pages；不展开最终错误页，不改本批消费片段。 |
| no_Werror | 3 | 编译选项；无直接片段。 |
| log_escape_non_ascii | 10 | HTTP日志转义；无本批直接片段。 |
| proxy_host_port_vars | 1 | proxy变量表标志；未改本批handler/eval/配置消费片段。 |
| cache_manager_exit | 1 | manager退出；无直接片段，不扩stale策略。 |
| larger_max_error_str | 1 | 日志长度宏；无直接片段。 |
| pcre_conf_opt | 2 | configure参数；无直接片段。 |
| always_enable_cc_feature_tests | 1 | 编译能力探测；无直接片段。 |
| ssl_cert_cb_yield | 2 | shared handshake与early-data新增特定错误AGAIN；不改变上游直接timer条件。 |
| ssl_sess_cb_yield | 2 | handshake/early-data增加PENDING_SESSION分支；条件编译，不保证上游启用。 |
| ssl_client_hello_cb_yield | 2 | handshake/early-data增加WANT_CLIENT_HELLO_CB分支；不扩大完整TLS。 |
| upstream_timeout_fields | 10 | 9个c hunk与1个header hunk；详见下一段，覆盖三个timeout全部直接消费点。 |
| safe_resolver_ipv6_option | 3 | resolver create条件校验；旧ipv6证据保留，不改缓存/超时回调。 |
| socket_cloexec | 10 | event_connect两hunk改socket/FD标志与失败出口；resolver TCP两hunk在本批DNS传输展开范围外，其他能力/accept/header/进程hunk不改直接timer。 |
| reuseport_close_unused_fds | 2 | listening socket/init event关闭；不改close_connection清timer片段。 |
| proc_exit_handler | 7 | cycle/进程退出hook与宏；无直接片段。 |

upstream_timeout_fields逐hunk：upstream_init新增u并复制connect/send/read；connect等待改u.connect_timeout；TLS等待改同字段；发送AGAIN改u.send_timeout；发送完成后头部等待改u.read_timeout；pipe.read_timeout赋值改u.read_timeout；upgrade上游write改u.send_timeout；upgrade上游read改u.read_timeout；non_buffered上游read改u.read_timeout；header增加能力宏及3字段。旧三timeout的完整补丁证据直接复用，未重复造ID。响应头#if 0不是上述生效消费点。

SSL三补丁均核两个hunk；connect步骤7只绑定shared handshake第一hunk（cert:19–42、session:1–17、hello:1–14），early-data分支记录为范围外，不声称已核其全机制。socket_cloexec连接两hunk固定引用114–149，与上游event_connect失败出口一起绑定。balancer_status_code的HTTP hunk及宏引用1–30；stream部分不用于HTTP状态论证。

四项补丁状态均保留 `verified_affected`，没有状态更改或旧结论冲突。note保留旧说明后追加本批限定范围，patch refs保留旧顺序、追加运行代码并集及 `runtime-patch-set`。这不是全模块“未受影响”判断。

## 冻结稿及静态检查交接

| 身份 | 步骤 | runtime代码refs | 独立文档refs | 追加evidence |
| --- | ---: | ---: | ---: | ---: |
| HTTP core resolver | 9 | 20 | 3 | 23 |
| HTTP proxy_connect_timeout | 9 | 37 | 3 | 39 |
| HTTP proxy_send_timeout | 7 | 27 | 2 | 27 |
| HTTP proxy_read_timeout | 10 | 32 | 2 | 33 |

合计35步、116代码引用、10文档引用、122项追加evidence；各身份独立计数，非全局去重。四个official-doc和三timeout的timeout补丁、send的pipelining补丁复用旧定义；新增patch-set只在patch refs，不冒充runtime代码或独立文档。runtime.source_ids等于步骤引用按首次出现去重的精确并集，无未绑定全局证据；文档另列。每步所声明的DNS/缓冲/非缓冲/upgrade失败出口绑定对应回调或结束源码。

实施只读检查已通过：

- JSON可读，四身份唯一；全部新evidence显式component、ID唯一、范围有效，从固定对象取片段。
- 四身份旧evidence逐项及顺序不变；旧patch引用前缀不变、无重复，status不变；旧note完整保留。
- 四limitations与固定f8c21实际详情逐字相同，未触发表述转换；所有旧evidence按固定Git重取与旧发布sources的component/version/revision/file/范围/code/URL/kind全等。
- 将基线详情与新增固定片段仅在内存组合，四项 `validateRuntime`、`deriveVerification`（均deep_verified）及 `validateDetail` 通过；这是静态契约检查，不是新发布或validatePublication结果。
- curated中除四项runtime/evidence/patch_status外的归一化全量内容SHA256保持 `e3339ef97c916942e68ffafd928ee92136b92b189bb8a32351cc4791e82c0f6c`；包括其他1013个curated身份、原5 deep的curated内容及四项全部非授权字段。

完成写集合仅 `knowledge/directives.json` 四身份与本文；未生成临时文件。稿已冻结供审核，若内容审核提出具体问题，仅定点修复授权字段。本角色未运行任何产品/发布测试、build、浏览器、联网或OpenResty。旧基线5 deep保持，主线程后续构建及严格发布验收预期+4为9；不把内存派生当作已发布9 deep。新发布sources真实性、全1041实际详情、索引计数与样例/网页验收由主线程和独立审核完成。
