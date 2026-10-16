# HTTP proxy_pass 动态目标到连接：运行时证据

日期：2026-10-13。状态：首批runtime及证据已写入并冻结，待独立审核与主线程实际发布验收。写集合仅本文及 `knowledge/directives.json` 中 `nginx/ngx_http_proxy_module/proxy_pass` 的授权字段；不运行 build/test 或 OpenResty。

## 深度交互：范围与关键结论

阶段一已由主线程报告独立审核、全138项测试及浏览器验收通过，本角色未重跑。已读 `SAMPLE_RUNTIME_PLAN.md`；数据契约以主线程随后明确的版本为准：步骤代码引用并集精确等于 runtime.source_ids；独立文档仅放 corroboration_source_ids，两集合不混合、不重复。

本批只覆盖 HTTP proxy_pass 含变量的目标求值、目标分类、条件性解析及上游连接建立/错误出口。不覆盖 stream、完整 TLS 握手、上游响应处理、完整重试策略、缓存系统或真实部署。DNS答案缓存、响应缓存与连接复用只核对会跳过 DNS/新 connect 的边界，不能混称一种缓存；未运行真实网络请求。

动态目标不保证发 DNS，更不保证每请求新建连接。已配置 upstream 的匹配发生在 sockaddr 直连判断之前；匹配使用不区分大小写的 host，并同时检查端口/no_port 条件。DNS错误/解析超时返回502，而连接错误/连接超时进入 next_upstream 边界，停止时一般分别映射502/504；内部资源/入口求值错误另走500。错误出口不能统一写成502。

## 直接执行：固定来源

| 来源 | 固定 revision | 核对范围 |
| --- | --- | --- |
| nginx 1.27.1 | e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928 | proxy、HTTP upstream、resolver、inet、事件连接、round-robin及keepalive的局部消费链 |
| nginx-docs 2024-08-15 | e8b581903e9d41252720053311cea687a5671674 | proxy_pass、resolver缓存/超时、连接超时/错误及连接缓存说明 |
| OpenResty 1.27.1.1 | 8c37412c31621225e7aa7e825b5b50106c9c71c4 | 固定发行脚本34项有效补丁的目标与hunk，新增链路的受影响分支 |

本轮三个 HEAD 与固定值一致，nginx及文档工作树干净；证据最终均读取固定 Git 对象，而非当前工作树或补丁后行号。

### 条件、调用与失败出口

| 条件 | 固定代码与真实行为 | 独立文档第二信号 |
| --- | --- | --- |
| proxy_pass 含变量 | 配置回调4114–4164编译 proxy_lengths/proxy_values 并安装 handler；请求 handler:935–971 调用 ngx_http_proxy_eval:1034–1131，求值或URL前缀/解析失败由 handler 返回500 | proxy XML:1432–1462支持协议、IP/域名/组及变量；精确500由代码证明，文档不声称给出了错误码 |
| 求值成功，读取/准备请求体 | proxy:1023–1029以 ngx_http_upstream_init 为回调；upstream:508–548进入 init_request。不是求值完成立即创建socket。请求体已有special response则原样返回 | proxy XML:1432–1462证明代理目标用途，不把其冒充请求体内部调用证明 |
| 已有响应缓存直接完成 | upstream:569–608可在目标连接分支之前发送缓存并返回；只记录这个前置出口，不研究完整缓存 | proxy XML:183–196证明缓存是显式配置，不与DNS答案缓存混同 |
| 动态host匹配已有upstream | upstream:703–720按host长度、大小写与端口/no_port匹配，goto found；789–819执行 peer.init，再连接；peer.init失败500 | proxy XML:1450–1462明确先搜索已描述server groups、未找到才resolver |
| 未匹配组，但 URL 已产生 sockaddr | proxy:1120–1129保存地址；inet:935–973数字IPv4先于no_resolve返回；1081–1110解析IPv6；upstream:722–744创建请求级peer并连接，不启动DNS。Unix域套接字也是sockaddr路径，受平台能力限制 | proxy XML:1437–1453列IP及Unix域地址，不能把其说成域名必须DNS |
| 无现成地址且需要解析 | upstream:747–784检查端口、ngx_resolve_start、安装回调/timeout并调用ngx_resolve_name。NULL为500；NGX_NO_RESOLVER为502；启动解析返回NGX_ERROR为500 | proxy XML:1457–1462及core XML:2184–2205支持显式resolver；内部错误码只由代码证明 |
| 无resolver | core module:3858–3874创建dummy而非系统DNS；resolver:394–428在无connections时返回NGX_NO_RESOLVER。OpenResty local=on/path是显式参数分支，不是缺配置自动读取系统DNS | core XML:2184–2205说明配置nameservers；OpenResty差异另引用固定补丁，不将文档空default当唯一证明 |
| 有效DNS答案缓存 | resolver:619–704命中rn->valid且有地址时直接调用ctx->handler，不发送新查询；成功答案有效期在2443–2448由valid或响应TTL决定 | core XML:2224–2233明确TTL缓存和valid覆盖 |
| 同名DNS查询已在等待 | resolver:752–767加入已有waiting链并设置自身timeout，不因新请求重复发送一份DNS；无缓存且无等待时831–912建查询、发送并异步等待 | core XML:2224–2233仅交叉印证答案缓存，waiting合并由代码证明，不宣称文档描述了内部等待链 |
| DNS返回非零state或解析超时 | upstream resolve_handler:1214–1221进入502；resolver:4097–4106将超时置NGX_RESOLVE_TIMEDOUT后回调，因此解析超时也是502，不是连接504 | core XML:2253–2267独立说明解析timeout；精确返回502与connect区别由代码证明 |
| DNS成功 | upstream:1224–1262保存地址、创建peer、结束解析ctx并进入connect；创建peer失败500。round_robin:312–426把地址及动态目标端口写入请求级peer | proxy XML:1450–1461支持地址轮询/解析路线，不把文档当内存分配错误证明 |
| peer返回已缓存连接 | event_connect:34–37先调用pc->get；keepalive:245–300找到适配连接返回NGX_DONE，故不会执行新socket/connect。仅限匹配的已配置组具有该peer初始化/缓存能力 | upstream XML:523–536独立说明每worker空闲连接缓存，不扩展完整keepalive机制 |
| 需要建立新连接 | event_connect:39–61分配socket/连接对象；209–264调用非阻塞connect，连接拒绝等返回NGX_DECLINED，进行中返回NGX_AGAIN，成功返回NGX_OK；upstream:1555–1579分类错误 | proxy XML:798–807及1267–1297分别支持建立连接与error/timeout类型 |
| 连接等待或异步错误 | upstream:1664–1667加连接计时并等待；2312–2344处理写事件超时，2094–2096在发送前 test_connect，2763–2809用kqueue pending_eof或SO_ERROR确认错误；next_upstream:4371–4405映射502/504，4423–4459按条件停止，4484可再次连接 | proxy XML:798–807、1267–1297支持连接timeout与可转下一server，未把失败说成无条件立即终止 |

### 已确认的 OpenResty 影响

1. `balancer_status_code.patch:1–16`在 ngx_http_upstream_connect 的peer返回值后增加 `rc >= NGX_HTTP_SPECIAL_RESPONSE` 直接 finalize(rc) 的出口，不能仅照未打补丁的NGX_ERROR/BUSY/DECLINED分类。
2. `upstream_timeout_fields.patch:1–32`在init中复制配置超时至请求级u字段，并把连接等待计时从u->conf->connect_timeout改成u->connect_timeout。完整TLS/发送/读取超时补丁其余部分不作为本批扩展范围。
3. `socket_cloexec.patch:114–149`改变事件连接socket创建，条件启用SOCK_CLOEXEC/FD_CLOEXEC；设置FD_CLOEXEC失败进入内部失败出口，不能把新socket分配整段称为未受影响。
4. `resolver_conf_parsing.patch:224–263`的非Windows local=on/path是显式配置分支；`safe_resolver_ipv6_option.patch`调整IPv6配置能力检查，不改变所引动态解析cache/wait/handler的核心分支。DNS底层socket也受cloexec影响，但不扩展DNS协议或TLS机制。
5. `upstream_pipelining`修改send handler的preserve_output条件，所引connect timeout检查和发送前连接错误检测不变；`proxy_host_port_vars`改变变量注册标志，不改求值/目标分类；日志拦截、事件循环及其他补丁的作用不被本批局部结论排除。

旧 patch_status 的 verified_unaffected/note只覆盖已发布配置与局部片段，不能证明新连接链完全未受影响。主线程已明确批准仅本HTTP身份改为verified_affected并精确扩展note；现已实施，仅说明上述新增范围，全部旧source_ids、旧facts和旧证据原样保留。未修改其他身份的patch状态。

### 第二信号边界

采用独立固定nginx-docs XML，不通过同段代码改ID制造第二信号。原official-doc已覆盖proxy_pass目标和变量分支；补充resolver TTL/timeout、连接timeout/错误及keepalive XML。文档支撑机制及用途，不假称它逐个给出所有内部错误码、等待链或OpenResty新增出口。

只读看过lua-nginx-module官方测试014-bugs.t的动态域名失败502断言，但该.t后缀不属于主线程给定corroboration文档契约，也涉及HTTPS子请求，故不纳入本批runtime或作为TLS已核实的证据。

已按明确契约追加该身份runtime、必要evidence及patch引用，并按专项授权修改其patch状态/说明。没有引用registration、configuration-definition、distribution-version或其纯配置别名充当运行时代码；resolver_local配置补丁仅列为背景证据和patch引用，不放runtime.source_ids。runtime的verified是固定代码与文档范围结论，不是发布验收或真实网络运行成功；未手写verification，不运行测试/构建，不改schema/UI。

## 冻结内容与完整新增证据

runtime.status=verified；16个条件步骤的35个代码引用并集精确等于runtime.source_ids，独立文档7项单列corroboration_source_ids。其中复用原implementation-0（请求URL求值）、implementation-3（目标分类/解析启动）与official-doc（proxy_pass独立文档），旧片段均未删改。新增40项为30个NGINX代码片段、4个OpenResty补丁片段、6个固定nginx-docs XML；新的纯配置local补丁不进入运行时消费引用。

| 新 source_id | component | 固定文件:行号 |
| --- | --- | --- |
| runtime-proxy-handler | nginx | src/http/modules/ngx_http_proxy_module.c:935–971 |
| runtime-body-init | nginx | src/http/modules/ngx_http_proxy_module.c:1023–1029 |
| runtime-upstream-init | nginx | src/http/ngx_http_upstream.c:508–548 |
| runtime-response-cache-gate | nginx | src/http/ngx_http_upstream.c:569–608 |
| runtime-upstream-preflight | nginx | src/http/ngx_http_upstream.c:630–648 |
| runtime-target-found | nginx | src/http/ngx_http_upstream.c:789–819 |
| runtime-ipv4-target | nginx | src/core/ngx_inet.c:935–973 |
| runtime-ipv6-target | nginx | src/core/ngx_inet.c:1081–1110 |
| runtime-unix-target | nginx | src/core/ngx_inet.c:705–778 |
| runtime-resolver-start | nginx | src/core/ngx_resolver.c:394–428 |
| runtime-resolver-dispatch | nginx | src/core/ngx_resolver.c:433–511 |
| runtime-resolver-cache | nginx | src/core/ngx_resolver.c:619–704 |
| runtime-resolver-wait | nginx | src/core/ngx_resolver.c:752–767 |
| runtime-resolver-query | nginx | src/core/ngx_resolver.c:831–926 |
| runtime-resolver-valid | nginx | src/core/ngx_resolver.c:2443–2448 |
| runtime-resolver-timeout | nginx | src/core/ngx_resolver.c:4073–4106 |
| runtime-resolve-handler | nginx | src/http/ngx_http_upstream.c:1193–1269 |
| runtime-resolve-cleanup | nginx | src/http/ngx_http_upstream.c:4518–4521 |
| runtime-round-robin-peer | nginx | src/http/ngx_http_upstream_round_robin.c:312–426 |
| runtime-event-connect-setup | nginx | src/event/ngx_event_connect.c:21–92 |
| runtime-event-connect-result | nginx | src/event/ngx_event_connect.c:194–330 |
| runtime-upstream-connect | nginx | src/http/ngx_http_upstream.c:1528–1591 |
| runtime-connect-pending | nginx | src/http/ngx_http_upstream.c:1664–1667 |
| runtime-connect-handler | nginx | src/http/ngx_http_upstream.c:2312–2325 |
| runtime-connect-check | nginx | src/http/ngx_http_upstream.c:2090–2097 |
| runtime-connect-test | nginx | src/http/ngx_http_upstream.c:2763–2809 |
| runtime-next-status | nginx | src/http/ngx_http_upstream.c:4371–4405 |
| runtime-next-stop | nginx | src/http/ngx_http_upstream.c:4423–4459 |
| runtime-next-reconnect | nginx | src/http/ngx_http_upstream.c:4484–4485 |
| runtime-keepalive-reuse | nginx | src/http/modules/ngx_http_upstream_keepalive_module.c:245–300 |
| runtime-balancer-status-patch | openresty | patches/nginx-1.27.1-balancer_status_code.patch:1–16 |
| runtime-timeout-fields-patch | openresty | patches/nginx-1.27.1-upstream_timeout_fields.patch:1–32 |
| runtime-socket-cloexec-patch | openresty | patches/nginx-1.27.1-socket_cloexec.patch:114–149 |
| runtime-resolver-local-patch | openresty | patches/nginx-1.27.1-resolver_conf_parsing.patch:224–263 |
| runtime-resolver-cache-doc | nginx-docs | xml/en/docs/http/ngx_http_core_module.xml:2224–2233 |
| runtime-resolver-timeout-doc | nginx-docs | xml/en/docs/http/ngx_http_core_module.xml:2253–2267 |
| runtime-connect-timeout-doc | nginx-docs | xml/en/docs/http/ngx_http_proxy_module.xml:798–810 |
| runtime-connect-error-doc | nginx-docs | xml/en/docs/http/ngx_http_proxy_module.xml:1267–1297 |
| runtime-keepalive-doc | nginx-docs | xml/en/docs/http/ngx_http_upstream_module.xml:523–536 |
| runtime-response-cache-doc | nginx-docs | xml/en/docs/http/ngx_http_proxy_module.xml:183–196 |

### 运行时步骤与源码引用映射

全部condition/action正文以knowledge/directives.json实际runtime为准；下表用于并行审核引用闭合，不制造另一套契约或第二信号。

| 步骤 | 适用条件 | source_ids |
| --- | --- | --- |
| 1 | 请求进入带变量目标的 HTTP proxy_pass，plcf->proxy_lengths 非空。 | runtime-proxy-handler、implementation-0 |
| 2 | URL 求值成功且请求体入口未直接返回特殊响应。 | runtime-body-init、runtime-upstream-init、runtime-upstream-preflight、runtime-timeout-fields-patch |
| 3 | 启用了响应缓存，且 upstream 初始化的缓存分支已完成响应或返回其他终止状态。 | runtime-response-cache-gate |
| 4 | 动态目标的 host、端口/no_port 条件匹配已配置的 HTTP upstream。 | implementation-3、runtime-target-found |
| 5 | 没有匹配的 upstream 组，且 URL 解析已得到数字 IP 或受平台支持的 Unix 域 sockaddr。 | implementation-0、implementation-3、runtime-ipv4-target、runtime-ipv6-target、runtime-unix-target、runtime-round-robin-peer |
| 6 | 没有匹配组或现成 sockaddr，需要解析动态 host。 | implementation-3、runtime-resolver-start |
| 7 | resolver 找到同名节点，rn->valid 未过期且已有地址答案。 | runtime-resolver-cache、runtime-resolver-valid |
| 8 | 同名resolver节点已有正在等待的查询，且本请求未得到有效地址缓存。 | runtime-resolver-wait、runtime-resolver-dispatch、runtime-resolver-timeout、implementation-3 |
| 9 | 无有效答案缓存、无已有waiting查询，需要建立新的DNS查询。 | runtime-resolver-query、runtime-resolver-dispatch、runtime-resolver-timeout、implementation-3 |
| 10 | 解析回调收到非零ctx->state，包括DNS失败或resolver等待超时。 | runtime-resolve-handler、runtime-resolver-timeout、runtime-resolve-cleanup |
| 11 | 解析回调成功，拿到地址列表。 | runtime-resolve-handler、runtime-round-robin-peer |
| 12 | 已到 ngx_http_upstream_connect，无论来自匹配组、直接地址还是DNS成功。 | runtime-upstream-connect、runtime-event-connect-setup、runtime-balancer-status-patch |
| 13 | peer初始化支持keepalive且选中了该组已缓存的合适连接，pc->get返回NGX_DONE。 | runtime-keepalive-reuse、runtime-event-connect-setup、runtime-upstream-connect |
| 14 | 选peer返回NGX_OK，需要新建连接。 | runtime-event-connect-setup、runtime-event-connect-result、runtime-socket-cloexec-patch、runtime-upstream-connect |
| 15 | 新连接返回NGX_AGAIN，或在连接推进时出现写事件超时/连接错误。 | runtime-connect-pending、runtime-timeout-fields-patch、runtime-connect-handler、runtime-connect-check、runtime-connect-test |
| 16 | 连接错误、无可用上游或连接超时已进入 ngx_http_upstream_next。 | runtime-next-status、runtime-next-stop、runtime-next-reconnect |

### 补丁片段复核与冻结边界

在内存按固定有效集合回放并核对本批相关文件摘要，30个新增NGINX片段中26个保持原文，4个需要结合固定OpenResty补丁读取：runtime-upstream-init、runtime-event-connect-setup、runtime-upstream-connect、runtime-connect-pending。逐hunk已经将其新增/替换分支写入对应action及patch note；没有用原始片段伪装补丁后代码，也没有将补丁后行号塞回原revision。4个补丁片段和6个新文档片段均直接读取各自固定Git对象。

内存实现对范围外src/event/ngx_event_openssl.c的全量摘要比较仍未匹配既有审计，因此本次不声称47个文件的全量回放通过，也不把该文件用于runtime结论或TLS已核实。本文只复核本批相关证据文件摘要与实际hunk；主线程既有完整回放脚本验收由其自身记录负责。

只读核对：仅1个完整身份变化；16步/35代码refs/7文档refs/40新增evidence均闭合、非重复，各代码refs均纳入patch引用，文档与代码集合不混合。逐项核对新增证据范围均存在于固定对象；其他身份的序列JSON SHA-256仍为`7fe3c141d2fa1aec6b12df561d11e69d818562000ac958c1b2db981cdfb21265`。本身份除授权runtime/evidence及patch状态、说明、必要引用外逐字不变，旧evidence与旧patch引用全部保留。

内容已经冻结，交独立审核和主线程构建/实际发布测试；上述核对是只读数据边界检查，不是执行8项或全量测试。未运行build/test、OpenResty或真实网络请求，未修改dist、schema/build/UI/tests或其他文件。未生成临时源码目录，无本轮临时文件需要清理。
