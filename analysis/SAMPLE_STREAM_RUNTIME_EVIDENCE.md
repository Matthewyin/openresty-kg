# 样例 stream 四身份运行时证据

日期：2026-10-13。实施角色 Sol high；已完整读取 `SAMPLE_STREAM_RUNTIME_PLAN.md`、`SAMPLE_RUNTIME_PLAN.md`、`SAMPLE_RUNTIME_VERIFICATION.md` 和 `src/query/knowledge.mjs` 的运行时契约。本记录用于有限范围静态实施和独立审核，不是构建、测试或现场运行结果。

## 深度交互：范围和证据口径

仅升级 nginx/ngx_stream_proxy_module 的 proxy_pass、proxy_connect_timeout、proxy_timeout，以及 nginx/ngx_stream_core_module 的 resolver。样例 B 出现次数按主线程已聚合的 4/4/4/1；未读取或复制样例正文。resolver_timeout 仅解释依赖，不单独升级。最短路径是复用现有 runtime 对象和实际消费代码，不修改构建、UI、schema、测试或旧事实。

固定 Git 对象与项目配置、matrix 对照一致：

| 来源 | revision |
| --- | --- |
| nginx 1.27.1 | e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928 |
| nginx-docs 2024-08-15 | e8b581903e9d41252720053311cea687a5671674 |
| OpenResty 1.27.1.1 | 8c37412c31621225e7aa7e825b5b50106c9c71c4 |
| stream-lua-nginx-module 0.0.15 | 69f0cd762112a6e0cddb07f2b5192e9a65034a93 |

HEAD 与上述对象一致；已查看本批消费文件的工作区 diff，未见差异。新增证据在实施时以 `git show revision:file` 提取并检查范围；不把工作区或补丁后文件行号冒充固定上游行号。补丁文件另列固定引用。runtime 步骤不使用注册或配置回调及其裁剪别名；旧配置证据仍用于旧事实和晋级前置。

## 直接执行：第一批目标与解析链

下列 nginx 行号均属固定对象；不是补丁应用后的行号。

| 文件与范围 | 实际条件、行为及出口 |
| --- | --- |
| src/stream/ngx_stream_proxy_module.c:465–499 | 含 complex value 才调用 eval；失败 finalize INTERNAL_SERVER_ERROR。没有 resolved 时取配置保存的 upstream。动态 host 先按名称长度、忽略大小写及端口/no_port 匹配已配置 upstream。 |
| 同文件:595–641 | complex value 按会话求值；parse_url 设置 no_resolve=1，此处不查 DNS。求值/地址解析/分配失败返回 ERROR；解析出的 sockaddr 与 host、port、no_port 保存到 resolved。 |
| src/core/ngx_inet.c:731–770、960–976、1088–1108 | Unix（平台支持时）、IPv4、IPv6（编译支持时）得到直接地址；no_resolve 的普通域名暂不解析。不能把 IP/Unix 与域名 DNS 混为一支。 |
| src/stream/ngx_stream_proxy_module.c:501–561 | 已有 sockaddr 则检查非 Unix 的端口并创建 peer 后连接；普通域名缺端口终止。只有未匹配组且无 sockaddr 的有端口域名才消费 stream core resolver；启动为空、NO_RESOLVER、resolve_name 返回 ERROR 都终止为内部 INTERNAL_SERVER_ERROR。 |
| 同文件:564–592 | 组路径检查 uscf、peer.init，失败内部 INTERNAL_SERVER_ERROR；成功设置 peer 起始时刻、限制非零 next_upstream_tries，然后 connect。 |
| src/core/ngx_resolver.c:394–429 | nameserver 连接数为零返回 NO_RESOLVER；IPv4 quick 分支另在名称解析入口直接回调。这里不是配置注册证据。 |
| 同文件:638–705 | 名称缓存节点有效且有地址时立即填 state/naddrs/addrs 并回调；不是每次都发送 DNS。仅说明有效地址答案缓存，不将 ctx->valid 误称通用负缓存。 |
| 同文件:752–767 | 同名节点已有 waiting 则设置当前 ctx 的解析超时、加入 waiting、置 AGAIN/async；复用未完成查询，不为每个会话新发相同查询。 |
| 同文件:861–912、490–498 | 新查询选择 nameserver、发送请求（发送失败立即另试一次）、安排解析超时和重发队列，置 waiting/AGAIN。外层把 AGAIN 转成 OK，表示请求已接受等待，不表示解析成功。 |
| 同文件:2443–2475 | 收到地址结果后，答案有效期为 valid 非零覆盖值，否则 TTL；填地址并回调等待者。仅解释本批地址答案，不扩完整 DNS 协议。 |
| 同文件:2131–2149、4073–4106 | 错误答案将 ctx->state 设为错误码再回调。非零 ctx->timeout 建立独立 resolver event；事件到期置 RESOLVE_TIMEDOUT 并回调。不是 connect_timeout/proxy_timeout。 |
| src/stream/ngx_stream_proxy_module.c:1328–1355、1375–1394 | 回调中任何非零 state（含解析超时）终止内部 INTERNAL_SERVER_ERROR。成功转地址 peer；创建失败亦 INTERNAL_SERVER_ERROR；完成解析上下文清理、tries 限制后进入 connect。 |
| src/stream/ngx_stream_upstream_round_robin.c:319–436 | 直接地址或 DNS 多地址构造独立 peer，DNS 地址复制并补目标端口；安装 get/free 和 tries。构造分配失败返回 ERROR；不扩完整调度算法。 |

独立文档：固定 stream proxy XML:229–265 支持地址、组、变量与条件解析；stream core XML:394–454 支持 nameserver、TTL/valid；457–475 支持解析超时。resolver 复用已有 official-doc，其他身份追加固定文档证据，不依赖现行外链。

## 第二批连接等待与下一 peer 出口

| 文件与范围 | 实际条件、行为及出口 |
| --- | --- |
| src/stream/ngx_stream_proxy_module.c:437–441 | peer.type 取下游连接类型。UDP 使用 datagram socket connect，不存在 TCP 建连握手；不能说 UDP 一定等 TCP 三次握手。 |
| src/event/ngx_event_connect.c:34–43、209–264、304–323 | 先执行 peer.get；非 OK 原样返回。创建相应类型 socket，connect 立即错误返回 DECLINED，进行中返回 AGAIN，立即成功返回 OK；其他初始化错误为 ERROR。 |
| src/stream/ngx_stream_proxy_module.c:734–775 | ERROR 内部 INTERNAL_SERVER_ERROR；BUSY 无可用上游内部 BAD_GATEWAY；DECLINED 去 next_upstream；非 AGAIN 直接 init_upstream；仅 AGAIN 安装连接读写 handler 和 pc->write timer。有效 timeout 补丁改读 ctx->connect_timeout。 |
| 同文件:1514–1540 | 连接等待 timedout 去 next_upstream；正常事件先删除 pc->write timer 再 test_connect，失败去 next_upstream，成功 init_upstream。 |
| 同文件:1892–1955 | next_upstream：有 buffered data 内部 INTERNAL_SERVER_ERROR；UDP 丢弃旧 upstream_out；free 失败 peer；tries 为零、next_upstream 关闭或累计窗口达到 next_upstream_timeout，内部 BAD_GATEWAY；否则关闭旧连接再 connect。DNS 失败和普通转发活动超时不走此入口。 |
| 同文件:804–820、1096–1108、1148–1159 | 仅编译支持且 TCP 主动上游 TLS 启用时涉及握手消费点；AGAIN 且无已有 write timer 才用 connect_timeout，成功删除 timer，失败去 next_upstream。只说明直接计时与出口，不研究证书或完整 TLS。 |
| stream-lua src/ngx_stream_lua_balancer.c:591–642 | 有 timeout patch 且 balancer 上下文有效时，正数参数覆盖会话 pctx 字段；非正数保持原值。无 patch 的 API 返回 disabled。覆盖不是修改全局配置，也不改 DNS ctx->timeout。 |

独立文档：固定 stream proxy XML:116–126 说明建立上游连接的超时；不据此替代源码的等待/重试/UDP分支。

## 第三批活动计时、TCP/UDP 与 status

| 文件与范围 | 实际条件、行为及出口 |
| --- | --- |
| src/stream/ngx_stream_proxy_module.c:924–937 | 连接初始化标 connected，安装上游读写处理并进入 process；这是活动处理入口，非总时长定时器。 |
| 同文件:1322–1325、1397–1401、1506–1510 | 下游与上游读写事件都进入 process_connection，再按方向进入 process。不是只计上游读取，也不是 HTTP 读超时。 |
| 同文件:1789–1800 | 存在 dst 且双方 read 均非 delayed 时，在 c->write 添加/更新活动 timer；任一 read delayed 时删除已有 timer。补丁改为 ctx->timeout。 |
| src/event/ngx_event_timer.h:50–87 | 新截止点按当前时间+timeout；旧timer与新值差小于 NGX_TIMER_LAZY_DELAY 时保留旧值，否则删除重插。不能声称每个字节都会无条件精确重置。 |
| src/stream/ngx_stream_proxy_module.c:1428–1448、1494–1503 | timedout 且 delayed 是限速等延迟事件的恢复，清标记、必要时重新监听；连接已建立且双方不 delayed 才补活动timer。仅 delayed 尚未到期则返回，不当作普通空闲超时关闭。 |
| 同文件:1448–1492 | 真正非 delayed 超时：UDP 若 responses 为默认最大哨兵，或实际响应数>=配置 responses×requests，内部 OK结束；不足则标上游read.error并 BAD_GATEWAY。TCP记录 connection timed out 后内部 OK结束。这些不调用 next_upstream。 |
| 同文件:1819–1854 | UDP 可在 requests门槛、responses完成、peer存在且两端buffer清空时提前内部 OK结束；默认responses哨兵不会在此按计数提前结束，而在超时分支成功结束。只解释与 timeout有关的条件。 |
| 同文件:806–820、970–1007 | 主动 TLS 前配置了 PROXY protocol 时，header发送 AGAIN 等待使用 timeout，非 connect_timeout；补丁读 ctx->timeout，handler仍为 connect_handler，到期可进入下一peer。发送ERROR内部OK，未一次发完内部INTERNAL_SERVER_ERROR；不扩协议。 |
| src/stream/ngx_stream_handler.c:300–311 | finalize_session把rc写入s->status，运行log阶段并关闭连接；不是生成或发送HTTP响应。proxy finalize:1974–1977清理未完成解析，2020–2022移交会话结束。 |

独立文档：固定 stream proxy XML:638–650 支持两次读写间隔与关闭语义。源码决定 delayed、UDP响应条件及 PROXY等待，不由文档猜测。

## 34项有效补丁逐hunk核查

从 `analysis/NGINX_PATCH_AUDIT.json` 的有效集合逐项读取固定 OpenResty Git 补丁对象，检查目标文件及每个hunk，不扫描历史同名补丁替代有效集合。本轮没有重放补丁，不运行已有audit脚本（其回放属历史审计记录）。

本批直接消费文件相关hunk：

- stream_proxy_timeout_fields（16hunk）：header会话结构/导出；handler复制connect_timeout、timeout；connect读取ctx和等待timer；PROXY发送等待；SSL握手；process_connection delayed恢复；process活动timer。固定补丁:1–178；引用旧timeout-patch完整片段即可，不使用原始配置读值解释发行行为。
- balancer_status_code（5hunk，其中stream相关2）：stream SPECIAL_RESPONSE=300；connect在ERROR之后、BUSY/DECLINED之前增加rc>=300直接finalize。旧proxy_pass的balancer-status-patch:31–73保留；connect身份也追加精确:31–58。这些仍是stream内部状态。
- stream_proxy_get_next_upstream_tries（2hunk）：导出getter与宏；未修改本批原tries门槛。旧proxy_pass引用保留，不将getter当连接消费证据。
- stream_balancer_export（4hunk）：去掉TLS session函数static声明/限定并在header导出；未改本批peer构造、get/free或tries实现。不研究session机制，不以export注册作为runtime。
- resolver_conf_parsing（3hunk）：增加配置读取函数/入口，修改resolver_create；与已有local事实有关，不改本批缓存/waiting/解析timeout/回调消费范围。
- safe_resolver_ipv6_option（3hunk）：仅resolver_create选项校验；保留已有ipv6证据，不改本批消费范围。
- socket_cloexec（10hunk）：resolver内部TCP socket创建和event_connect socket创建/FD标志设置有条件变更；peer.get、connect返回值及proxy timer判断未被改。新增连接路径须保留补丁证据:114–149；本批不扩DNS传输socket实现。

其余有效补丁无本批所列直接消费片段hunk：win32_max_err_str、stream_ssl_preread_no_skip、daemon_destroy_pool、init_cycle_pool_release、builtin_error_page_footer、delayed_posted_events、privileged_agent_process、privileged_agent_process_connections、privileged_agent_process_thread_pool、single_process_graceful_exit、intercept_error_log、upstream_pipelining、server_header、no_error_pages、no_Werror、log_escape_non_ascii、proxy_host_port_vars、cache_manager_exit、larger_max_error_str、pcre_conf_opt、always_enable_cc_feature_tests、ssl_cert_cb_yield、ssl_sess_cb_yield、ssl_client_hello_cb_yield、upstream_timeout_fields、reuseport_close_unused_fds、proc_exit_handler。只表示所列片段没有直接hunk；不声称整个事件系统、TLS库或生产兼容性不受影响。

## 实施交接状态

研究未发现须修改旧facts/summary/syntax/mechanism的实质冲突；四项旧verified_affected保持。四项已分两批写入并冻结，可由主线程 build；当前无写入阻塞或契约冲突。

| 身份 | 步骤数 | runtime代码refs | 独立文档refs | 追加evidence |
| --- | ---: | ---: | ---: | ---: |
| ngx_stream_proxy_module/proxy_pass | 12 | 34 | 3 | 36 |
| ngx_stream_proxy_module/proxy_connect_timeout | 8 | 22 | 3 | 25 |
| ngx_stream_proxy_module/proxy_timeout | 9 | 20 | 2 | 22 |
| ngx_stream_core_module/resolver | 8 | 17 | 3 | 20 |

合计37步、103项追加evidence（首轮为102项，内容P2-A修复新增1项；各身份独立计数，包含文档和有效补丁选择范围，不是全局去重数）。resolver复用原official-doc。每项runtime.source_ids按步骤代码引用的首次出现顺序去重，文档单列，不混入代码并集；patch refs包含所有步骤代码，保留全部旧refs并追加runtime-patch-set。patch note保留旧说明后补充有限运行时范围，不改affected状态。

完成写入后的只读一致性检查：四身份唯一、JSON可读，全部非授权旧字段保持，原evidence逐项前缀一致，旧patch引用无删除，步骤代码并集精确相等且patch refs无遗漏，新增evidence无重复ID及越界。固定Git片段按四个锁定revision读取；构建生成sources与正式发布的逐字比较留给主线程和独立审核，不冒称已经验收。

只写本证据与四身份授权字段；未运行build/test、真实OpenResty或联网，无临时文件。主线程负责统一构建、专项测试、全量测试和桌面浏览器验收，审核角色据本计划及实际发布复核。

## 构建后必要表示层修复

主线程报告发布 `1.27.1.1-7bde513999a7df29` 构建成功，但25项定向检查24通过、1项字段保护失败：三个proxy身份的curated.limitations原为字符串，prepareKnowledgeFacts将当前全部evidence IDs自动附给限制说明；新增runtime证据使旧published limitations.source_ids扩大。resolver原为明确对象，不受此问题影响。本记录引用主线程结果，不声称实施角色运行了这些检查。

经主线程明确批准，仅将proxy_pass、proxy_connect_timeout、proxy_timeout三身份limitations由字符串转换为旧发布 `1.27.1.1-15e6ba8dfd628573` 实际detail.limitations明确对象。直接读取旧发布JSON，逐项保留text/status/source_ids及顺序，不改变语义，不修改产品或放宽测试。proxy_pass为3条、每条9个旧refs；proxy_connect_timeout为2条、每条6个旧refs；proxy_timeout为3条、每条6个旧refs。

已用apply_patch完成；只读核对三项limitations对象与旧发布精确相等，三项其他字段与修复前一致。resolver和其他身份未修改，原4项affected保持。修复后再次冻结，可由主线程重建及定向验收；实施角色仍未运行build/test。

## 内容审核P2-A/B最小修复

已完整读取SAMPLE_STREAM_RUNTIME_REVIEW.md，按最终内容审核退回意见修复两项，不扩大研究范围。

P2-A：proxy_connect_timeout追加runtime-resolve-error，固定nginx对象的proxy模块1328–1355；非零ctx->state直接finalize为内部INTERNAL_SERVER_ERROR，闭合异步DNS错误/超时不走连接重试的证明链。该ID绑定第7步，同时纳入runtime代码并集与patch refs；保留所有旧证据及说明。步骤仍8个，代码refs从21增至22，追加evidence从24增至25。

P2-B：proxy_pass第10步改为真实顺序：先检查buffered，UDP清理旧upstream_out；存在选中peer时以NGX_PEER_FAILED释放并清空sockaddr；随后按释放后更新的tries、开关及累计窗口决定结束，或关闭旧连接再connect。沿用已绑定runtime-next-peer:1892–1955，不新增范围或证据。

所有旧事实、limitations显式固定对象和旧evidence保持；四项affected不变。修复已用apply_patch完成并再次冻结，交主线程重建/测试及审核角色复核；实施角色未build/test。
