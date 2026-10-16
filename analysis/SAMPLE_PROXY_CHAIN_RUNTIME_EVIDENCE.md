# 样例代理链与变量赋值运行时证据

日期：2026-10-13。实施角色；已完整读取 `SAMPLE_REMAINING_RUNTIME_PLAN.md`，参照上轮 HTTP_TIMEOUT 的逐步证据和旧字段保护边界。固定基线 `1.27.1.1-c49915e4ed7a7e58`（9 deep），没有以 current 代替。

## 深度交互：限定目标与状态

只补 B1 的五身份；不为全部模块新增研究。先独立只读核对固定源码及34补丁，再实施。五项现均已落盘并冻结供主线程与审核接手。主独立核对固定对象后，明确批准唯一状态迁移：proxy_ssl_session_reuse 由 verified_unaffected 改为 verified_affected；其余四身份状态不变。本文件记录实施冻结稿，不是构建发布或审核签署。

Host字段、连接目标、TLS名称、已有连接复用、TLS会话恢复是不同消费对象。重点避免“set自动解析域名”“Host决定SNI”“1.1保证keepalive”“变量域名+session_reuse on必恢复”等混淆。动态变量目标仍可命中配置组，不能写成变量目标一律没有session能力。只核固定静态链，不承诺现场兼容或真实复用成功。

## 直接执行：来源与旧内容保护

固定 nginx `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`（1.27.1）、OpenResty `8c37412c31621225e7aa7e825b5b50106c9c71c4`（1.27.1.1）、nginx-docs `e8b581903e9d41252720053311cea687a5671674`（2024-08-15）。新增证据逐项以本地 git show 固定对象核行号；全部显式component，保留上游与补丁各自原始坐标。Lua仅独立只读核对了固定组件会话wrapper，用于避免泛化，不纳入本批新增证据或声称完成Lua balancer链。

写集合仅 `knowledge/directives.json` 五个精确身份及本文；未改其他知识、产品、测试、dist、规则或规划/审核文件。summary/syntax/defaults/inheritance/phase/related/旧evidence全部保留，不手填verification。唯一表示转换为stream set legacy limitations：直接复制c499旧发布完整对象，正文、状态、source_ids顺序均不变，避免新增evidence污染旧事实。

| 身份 | 旧evidence数/冻结SHA-256 | 本稿新增evidence | 本稿步数 | patch状态 |
| --- | --- | ---: | ---: | --- |
| nginx/ngx_http_rewrite_module/set | 11 / 2c6261fbbbf6b652c8c4806238128a1276bcae7f9f685c6052afd90626352217 | 8 | 7 | verified_unaffected |
| nginx/ngx_stream_set_module/set | 8 / 0b11aa69c5332ddec28a4072fe475e38a63ca2b68689e9d274e3343c4f397108 | 8 | 5 | verified_unaffected |
| nginx/ngx_http_proxy_module/proxy_set_header | 12 / 4c32868b95ecbc09277438c7945dfc73528489ec32cee48dcc07355d389fc9df | 17 | 6 | verified_affected |
| nginx/ngx_http_proxy_module/proxy_http_version | 7 / e40d110edf075faf879a3a9d04c7688cf65d2ffe689969677c07980adf274107 | 13 | 5 | verified_unaffected |
| nginx/ngx_http_proxy_module/proxy_ssl_session_reuse | 7 / f9b1bf878b714a479fc4c5f64db61f28732a1907d26ff2e246251af69d227f16 | 33 | 10 | verified_unaffected → verified_affected（主已批准） |

新增步骤代码去重并集按首次出现顺序保存为runtime.source_ids，文档独立保存到corroboration。patch source_ids保留旧前缀并覆盖全部runtime代码。未运行校验器/测试套件；结构与字段保护在内存作只读差异检查，最终校验/构建/发布由主执行。

## HTTP rewrite set

限定 HTTP server/location rewrite 中 set 的执行、常量/变量/捕获值求值、请求变量或 setter 赋值、控制流及失败出口；只解释变量如何供后续代理链读取，不替变量值执行 DNS、连接或 TLS，不展开所有 rewrite 指令。

| 步骤 | 条件与核定边界 | 直接绑定的固定证据 |
| --- | --- | --- |
| 1 进入 server rewrite 或选中 location 的 rewrite 阶段 | SERVER_REWRITE 与 location REWRITE 实际分派、空codes/空location跳过。 | rewrite-phase-registration (nginx:src/http/modules/ngx_http_rewrite_module.c:271–293)<br>runtime-phase-engine (nginx:src/http/ngx_http.c:491–524)<br>implementation-1 (nginx:src/http/modules/ngx_http_rewrite_module.c:136–222)<br>runtime-phase-result (nginx:src/http/ngx_http_core_module.c:921–945) |
| 2 有可执行 codes，建立并运行本次请求脚本 | 请求engine/stack分配失败500，逐 code 执行与phase结果消费闭合。 | implementation-1 (nginx:src/http/modules/ngx_http_rewrite_module.c:136–222)<br>runtime-phase-result (nginx:src/http/ngx_http_core_module.c:921–945) |
| 3 执行到 set 的值代码，取得本次赋值结果 | 常量文本压栈；复杂值lengths/请求buffer，分配失败script_exit/500。 | implementation-0 (nginx:src/http/modules/ngx_http_rewrite_module.c:966–1020)<br>runtime-value-stack (nginx:src/http/ngx_http_script.c:1751–1809)<br>runtime-phase-result (nginx:src/http/ngx_http_core_module.c:921–945) |
| 4 表达式含请求变量或已有正则捕获值 | indexed/flushed变量与已有capture贡献长度/文本或空；必要条件转义。 | runtime-variable-copy (nginx:src/http/ngx_http_script.c:933–987)<br>runtime-capture-copy (nginx:src/http/ngx_http_script.c:1334–1409) |
| 5 值已压栈，执行索引赋值或变量自有 setter | 索引槽有效标记或自有void setter；不制造统一setter错误返回。 | implementation-2 (nginx:src/http/ngx_http_script.c:1813–1863) |
| 6 赋值前后遇到 if、break、return 或 URI 重写重入 | if/return/break影响后续set；URI重入及循环耗尽500，set不自动重入。 | runtime-control (nginx:src/http/ngx_http_script.c:1488–1551)<br>runtime-uri-repeat (nginx:src/http/ngx_http_core_module.c:1044–1084)<br>runtime-phase-engine (nginx:src/http/ngx_http.c:491–524)<br>runtime-phase-result (nginx:src/http/ngx_http_core_module.c:921–945) |
| 7 后续脚本读取已赋值请求变量 | valid槽后续读取、未初始化null getter、普通请求值保留不是配置继承。 | runtime-indexed-read (nginx:src/http/ngx_http_variables.c:608–674)<br>implementation-1 (nginx:src/http/modules/ngx_http_rewrite_module.c:136–222)<br>implementation-2 (nginx:src/http/ngx_http_script.c:1813–1863) |

独立固定文档：official-doc (nginx-docs:xml/en/docs/http/ngx_http_rewrite_module.xml:379–391)；rewrite-order-doc (nginx-docs:xml/en/docs/http/ngx_http_rewrite_module.xml:23–60)。文档只交叉印证scope，不代替内部消费/失败出口。

## stream set

限定 stream 会话 PREACCESS 的 set 按序求值、会话变量或自有 setter 写入、后续 indexed 读取和失败结束；不套用 HTTP rewrite/if/location 序列，不把域名字符串赋值当作 DNS 或 proxy_pass 连接。

| 步骤 | 条件与核定边界 | 直接绑定的固定证据 |
| --- | --- | --- |
| 1 stream 会话进入 PREACCESS 阶段 | PREACCESS实际generic checker，先于ACCESS/SSL/PREREAD/CONTENT。 | set-phase (nginx:src/stream/ngx_stream_set_module.c:121–137)<br>runtime-phase-order (nginx:src/stream/ngx_stream.h:83–91)<br>runtime-phase-engine (nginx:src/stream/ngx_stream.c:354–382)<br>runtime-phase-result (nginx:src/stream/ngx_stream_core_module.c:190–227) |
| 2 按当前 server commands 声明顺序求值 | commands按序求值；复杂值内存失败ERROR→stream internal error finalize，非HTTP500。 | set-handler (nginx:src/stream/ngx_stream_set_module.c:75–107)<br>runtime-complex-value (nginx:src/stream/ngx_stream_script.c:36–105)<br>runtime-phase-result (nginx:src/stream/ngx_stream_core_module.c:190–227) |
| 3 值表达式读取当前会话变量 | 变量getter/copy贡献已有值或空，未初始化null；不预设前向赋值。 | runtime-variable-copy (nginx:src/stream/ngx_stream_script.c:798–852)<br>runtime-indexed-read (nginx:src/stream/ngx_stream_variables.c:343–410)<br>runtime-null-getter (nginx:src/stream/ngx_stream_set_module.c:111–118) |
| 4 当前值求值成功，写入变量或调用自有 setter | 每项立即索引赋值或调用void setter；不求DNS。 | set-handler (nginx:src/stream/ngx_stream_set_module.c:75–107) |
| 5 全部赋值完成，后续阶段或脚本读取 | DECLINED推进、valid/flushed读取闭合，代理解析交由已审独立链。 | set-handler (nginx:src/stream/ngx_stream_set_module.c:75–107)<br>runtime-phase-result (nginx:src/stream/ngx_stream_core_module.c:190–227)<br>runtime-indexed-read (nginx:src/stream/ngx_stream_variables.c:343–410) |

独立固定文档：runtime-set-doc (nginx-docs:xml/en/docs/stream/ngx_stream_set_module.xml:40–50)。文档只交叉印证scope，不代替内部消费/失败出口。

## proxy_set_header

限定 proxy_set_header 的有效头表/脚本到上游 HTTP 请求头生成、空值屏蔽和原始头透传，以及 Host、代理目标和 TLS 名称的不同来源；不据此改变连接目标、自动开启 SNI、连接池或 TLS 会话复用。

| 步骤 | 条件与核定边界 | 直接绑定的固定证据 |
| --- | --- | --- |
| 1 代理 handler 安装请求构造器，选取本次有效头脚本 | 有效显式整组和默认补头；本次headers/cache脚本选择及handler安装。 | runtime-header-selection (nginx:src/http/modules/ngx_http_proxy_module.c:1245–1263)<br>implementation-3 (nginx:src/http/modules/ngx_http_proxy_module.c:3985–4034)<br>implementation-4 (nginx:src/http/modules/ngx_http_proxy_module.c:3901–3917)<br>proxy-cache-headers-init (nginx:src/http/modules/ngx_http_proxy_module.c:3916–3926)<br>runtime-proxy-handler (nginx:src/http/modules/ngx_http_proxy_module.c:973–988) |
| 2 有效头表已编译，计算实际变量值和输出长度 | hash先纳入所有字段，含静态空；flush与length脚本，未找到变量贡献空。 | implementation-3 (nginx:src/http/modules/ngx_http_proxy_module.c:3985–4034)<br>runtime-header-hash-script (nginx:src/http/modules/ngx_http_proxy_module.c:4033–4109)<br>runtime-header-lengths (nginx:src/http/modules/ngx_http_proxy_module.c:1321–1367)<br>runtime-variable-flush (nginx:src/http/ngx_http_script.c:663–678)<br>runtime-variable-copy (nginx:src/http/ngx_http_script.c:933–987) |
| 3 请求行和头的长度已知，需要输出缓冲 | buffer/chain分配ERROR→create_request调用方HTTP500。 | runtime-buffer-allocation (nginx:src/http/modules/ngx_http_proxy_module.c:1398–1408)<br>runtime-create-result (nginx:src/http/ngx_http_upstream.c:630–637) |
| 4 执行头值脚本，值为空或非空 | 动态空值skip推进但不序列化；非空写field/value/CRLF；静态空不恢复默认。 | runtime-header-values (nginx:src/http/modules/ngx_http_proxy_module.c:1456–1503)<br>runtime-header-hash-script (nginx:src/http/modules/ngx_http_proxy_module.c:4033–4109)<br>runtime-variable-copy (nginx:src/http/ngx_http_script.c:933–987) |
| 5 可能透传客户端原始请求头 | pass_request_headers条件透传，hash命中屏蔽同名原始头，含空字段。 | implementation-1 (nginx:src/http/modules/ngx_http_proxy_module.c:1370–1395)<br>runtime-header-pass (nginx:src/http/modules/ngx_http_proxy_module.c:1506–1546)<br>runtime-header-hash-script (nginx:src/http/modules/ngx_http_proxy_module.c:4033–4109) |
| 6 生成 Host 值，区分客户端名字、代理目标及 TLS 名称 | Host、URL/resolved host/port、TLS ssl_name/SNI分别计算；NOHASH补丁不改目标。 | implementation-0 (nginx:src/http/modules/ngx_http_proxy_module.c:819–832)<br>runtime-host-value (nginx:src/http/modules/ngx_http_proxy_module.c:2520–2540)<br>runtime-target-vars (nginx:src/http/modules/ngx_http_proxy_module.c:5082–5113)<br>runtime-target-eval (nginx:src/http/modules/ngx_http_proxy_module.c:1111–1131)<br>runtime-ssl-name-condition (nginx:src/http/ngx_http_upstream.c:1705–1711)<br>runtime-ssl-name (nginx:src/http/ngx_http_upstream.c:1858–1948)<br>proxy-host-port-vars (openresty:patches/nginx-1.27.1-proxy_host_port_vars.patch:1–19) |

独立固定文档：official-doc (nginx-docs:xml/en/docs/http/ngx_http_proxy_module.xml:1842–1907)；runtime-ssl-name-doc (nginx-docs:xml/en/docs/http/ngx_http_proxy_module.xml:2051–2071)；runtime-sni-doc (nginx-docs:xml/en/docs/http/ngx_http_proxy_module.xml:2120–2135)。文档只交叉印证scope，不代替内部消费/失败出口。

## proxy_http_version

限定固定1.27.1代理的上游请求行 HTTP/1.0 或 HTTP/1.1 生成及直接相关请求正文流式/chunked 条件；上游响应版本另行解析，不等同客户端协议，不自动改 Connection: close、创建连接池或使 TLS 会话复用成功。

| 步骤 | 条件与核定边界 | 直接绑定的固定证据 |
| --- | --- | --- |
| 1 有效 proxy_http_version 随请求构造器消费 | 默认1.0由现有merge-default直接绑定；读取plcf而非客户端协议，request构造/响应parser分开。 | implementation-0 (nginx:src/http/modules/ngx_http_proxy_module.c:287–291)<br>runtime-proxy-handler (nginx:src/http/modules/ngx_http_proxy_module.c:973–988)<br>implementation-1 (nginx:src/http/modules/ngx_http_proxy_module.c:1444–1454)<br>merge-default (nginx:src/http/modules/ngx_http_proxy_module.c:3831–3832) |
| 2 判定请求正文是否允许非缓冲读取 | 非缓冲必须同时满足四类条件，原chunked还需1.1；body reader特殊码直接返回。 | runtime-body-mode (nginx:src/http/modules/ngx_http_proxy_module.c:1015–1029) |
| 3 构造上游请求行版本及构造失败出口 | 空URI/构造分配ERROR→500；只在request行尾选择两个固定版本字串。 | runtime-uri-empty (nginx:src/http/modules/ngx_http_proxy_module.c:1313–1317)<br>runtime-buffer-allocation (nginx:src/http/modules/ngx_http_proxy_module.c:1398–1408)<br>runtime-create-result (nginx:src/http/ngx_http_upstream.c:630–637)<br>implementation-1 (nginx:src/http/modules/ngx_http_proxy_module.c:1444–1454)<br>runtime-version-strings (nginx:src/http/modules/ngx_http_proxy_module.c:818–819) |
| 4 非缓冲原 chunked 正文交接输出链 | internal_chunked及非缓冲过滤器交接；body link分配ERROR→500；不建连接池。 | runtime-body-mode (nginx:src/http/modules/ngx_http_proxy_module.c:1015–1029)<br>runtime-chunked-setup (nginx:src/http/modules/ngx_http_proxy_module.c:1340–1346)<br>runtime-body-output (nginx:src/http/modules/ngx_http_proxy_module.c:1564–1604)<br>runtime-create-result (nginx:src/http/ngx_http_upstream.c:630–637)<br>runtime-default-headers (nginx:src/http/modules/ngx_http_proxy_module.c:822–832) |
| 5 上游返回响应状态行，由独立 parser 取得响应版本 | 响应parser独立取版本；解析错误的cache路径仅设r->http_version=9提前OK，非cache另置status=200/connection_close；成功低于1.1标close，ERROR调用方500。 | runtime-response-version (nginx:src/http/modules/ngx_http_proxy_module.c:1801–1877)<br>runtime-status-parser (nginx:src/http/ngx_http_parse.c:1823–1835)<br>runtime-response-result (nginx:src/http/ngx_http_upstream.c:2493–2502) |

独立固定文档：official-doc (nginx-docs:xml/en/docs/http/ngx_http_proxy_module.xml:1084–1101)；runtime-body-buffer-doc (nginx-docs:xml/en/docs/http/ngx_http_proxy_module.xml:1749–1782)。文档只交叉印证scope，不代替内部消费/失败出口。

## proxy_ssl_session_reuse

限定 HTTPS 上游新 TLS 连接的 session_reuse 开关、配置组/动态 resolved peer 的会话装载与保存、握手交接/失败和连接清理，并区分已有 keepalive 连接复用、Host 与 SNI；on 只是尝试条件，不保证任何变量域名成功恢复，不展开完整 TLS、DNS、重试或其他 balancer 策略。

| 步骤 | 条件与核定边界 | 直接绑定的固定证据 |
| --- | --- | --- |
| 1 建立上游连接，判断是否需要新 TLS 握手 | 非TLS或已有c->ssl跳过新握手；test_connect失败FT_ERROR、创建失败500。 | runtime-tls-condition (nginx:src/http/ngx_http_upstream.c:1670–1703) |
| 2 确定目标是已配置组还是新建 resolved peer | 动态目标先匹配已配置组；配置组正常set/save，新建resolved peer装empty。 | runtime-peer-group-match (nginx:src/http/ngx_http_upstream.c:693–720)<br>runtime-peer-direct (nginx:src/http/ngx_http_upstream.c:722–745)<br>runtime-peer-found (nginx:src/http/ngx_http_upstream.c:789–809)<br>runtime-peer-resolved (nginx:src/http/ngx_http_upstream.c:1245–1252)<br>runtime-rr-group-callbacks (nginx:src/http/ngx_http_upstream_round_robin.c:297–307)<br>runtime-rr-resolved-callbacks (nginx:src/http/ngx_http_upstream_round_robin.c:418–427)<br>runtime-rr-empty-callbacks (nginx:src/http/ngx_http_upstream_round_robin.c:840–851) |
| 3 新 TLS 连接消费开关，尝试设置会话 | on设置save并调用当前set_session；失败500，off跳过但不关keepalive/SNI。 | implementation-0 (nginx:src/http/ngx_http_upstream.c:1722–1742)<br>runtime-rr-empty-callbacks (nginx:src/http/ngx_http_upstream_round_robin.c:840–851) |
| 4 配置组 round-robin 装载当前 peer 保存的会话 | RR当前peer缓存或zone序列化装载；NULL是OK非恢复成功，库设置失败500。 | runtime-rr-set (nginx:src/http/ngx_http_upstream_round_robin.c:675–735)<br>runtime-session-set (nginx:src/event/ngx_event_openssl.c:1783–1794)<br>implementation-0 (nginx:src/http/ngx_http_upstream.c:1722–1742) |
| 5 设置候选后握手可能成功、等待或失败 | 普通shared握手等待/结果回调，三个yield与timeout字段补丁；不保证回调启用。 | runtime-handshake-library (nginx:src/event/ngx_event_openssl.c:1798–1942)<br>runtime-cert-yield-patch (openresty:patches/nginx-1.27.1-ssl_cert_cb_yield.patch:19–42)<br>runtime-session-yield-patch (openresty:patches/nginx-1.27.1-ssl_sess_cb_yield.patch:4–17)<br>runtime-hello-yield-patch (openresty:patches/nginx-1.27.1-ssl_client_hello_cb_yield.patch:5–14)<br>runtime-handshake-call (nginx:src/http/ngx_http_upstream.c:1745–1783)<br>runtime-timeout-patch (openresty:patches/nginx-1.27.1-upstream_timeout_fields.patch:34–42)<br>runtime-handshake-event (nginx:src/event/ngx_event_openssl.c:2143–2163)<br>runtime-handshake-result (nginx:src/http/ngx_http_upstream.c:1786–1833) |
| 6 TLS 库通知新客户端会话，交给当前 peer 保存 | client cache/new session通知→临时session→上游save→当前peer；idle/empty不保存。 | implementation-2 (nginx:src/http/modules/ngx_http_proxy_module.c:5061–5067)<br>runtime-client-cache (nginx:src/event/ngx_event_openssl.c:1667–1700)<br>implementation-1 (nginx:src/http/ngx_http_upstream.c:1837–1854)<br>runtime-rr-empty-callbacks (nginx:src/http/ngx_http_upstream_round_robin.c:840–851) |
| 7 round-robin 保存可用会话并处理不可缓存出口 | RR直接引用或zone序列化；无session/过大/分配失败只停止保存并解锁，旧引用释放。 | runtime-session-get (nginx:src/event/ngx_event_openssl.c:1758–1780)<br>runtime-rr-save (nginx:src/http/ngx_http_upstream_round_robin.c:738–837) |
| 8 keepalive 复用已有连接或为新连接包装会话回调 | keepalive按地址复用已有连接；新连接session回调委派原peer，非TLS session恢复。 | runtime-keepalive-callbacks (nginx:src/http/modules/ngx_http_upstream_keepalive_module.c:224–229)<br>runtime-keepalive-delegate (nginx:src/http/modules/ngx_http_upstream_keepalive_module.c:489–505)<br>runtime-keepalive-found (nginx:src/http/modules/ngx_http_upstream_keepalive_module.c:256–300)<br>runtime-tls-condition (nginx:src/http/ngx_http_upstream.c:1670–1703) |
| 9 会话开关之外的 TLS 名称计算与 SNI 条件 | 独立ssl_name/SNI条件与求值/分配/库设置500，不把所有TLS失败归因SNI。 | runtime-ssl-name-condition (nginx:src/http/ngx_http_upstream.c:1705–1711)<br>runtime-ssl-name (nginx:src/http/ngx_http_upstream.c:1858–1948)<br>implementation-0 (nginx:src/http/ngx_http_upstream.c:1722–1742)<br>runtime-handshake-result (nginx:src/http/ngx_http_upstream.c:1786–1833) |
| 10 重试或请求结束后的连接与保存引用清理 | free可将连接交cache；仍留的连接shutdown/关闭；SSL对象与peer保存引用分别清理。 | runtime-next-cleanup (nginx:src/http/ngx_http_upstream.c:4462–4485)<br>runtime-finalize-cleanup (nginx:src/http/ngx_http_upstream.c:4544–4575)<br>runtime-ssl-free (nginx:src/event/ngx_event_openssl.c:3353–3365)<br>runtime-rr-save (nginx:src/http/ngx_http_upstream_round_robin.c:738–837)<br>runtime-finalize-peer-free (nginx:src/http/ngx_http_upstream.c:4537–4544)<br>runtime-keepalive-transfer (nginx:src/http/modules/ngx_http_upstream_keepalive_module.c:377–409) |

独立固定文档：official-doc (nginx-docs:xml/en/docs/http/ngx_http_proxy_module.xml:2138–2153)；runtime-sni-doc (nginx-docs:xml/en/docs/http/ngx_http_proxy_module.xml:2120–2135)；runtime-ssl-name-doc (nginx-docs:xml/en/docs/http/ngx_http_proxy_module.xml:2051–2071)。文档只交叉印证scope，不代替内部消费/失败出口。

## 34项有效补丁逐hunk交集

完整集合、顺序及revision按NGINX_PATCH_AUDIT.json核对，与固定发行脚本 util/mirror-tarballs:35–550 的1.27.1分支一致；已读34项的目标、142个hunk头与变更内容。旧安全分支、注释patch不纳入有效集合。既有142hunk/47最终摘要回放是历史审计，本轮未回放、未编译，不冒称无offset/fuzz。以下hunk数为整项补丁而非交集数。

| 补丁 | hunk数 | 本批交集判定 |
| --- | ---: | --- |
| win32_max_err_str | 1 | Win32日志长度宏；没有本批直接消费交集。 |
| stream_balancer_export | 4 | 仅stream RR函数导出，未修改HTTP RR或本批stream set。 |
| stream_proxy_get_next_upstream_tries | 2 | stream proxy getter/能力宏，非set消费。 |
| stream_proxy_timeout_fields | 16 | stream proxy ctx/计时；本批不引用这些handler，stream.h的phase enum无交集。 |
| stream_ssl_preread_no_skip | 1 | stream ssl preread返回；不套HTTP/stream set。 |
| resolver_conf_parsing | 3 | resolver创建/文件读取；只说明动态peer来源，不新增resolver内部消费。 |
| daemon_destroy_pool | 1 | daemon进程pool；无交集。 |
| init_cycle_pool_release | 5 | 启动cycle与退出pool；无交集。 |
| balancer_status_code | 5 | HTTP connect特殊状态/能力宏及stream；本批未引用connect返回码段。 |
| builtin_error_page_footer | 1 | 内置页脚；未描述最终错误页。 |
| delayed_posted_events | 6 | event主循环/posted；未改所引phase checker/握手helper，不推断无间接作用。 |
| privileged_agent_process | 15 | helper进程配置/循环；无交集。 |
| privileged_agent_process_connections | 6 | helper连接数/启动；无交集。 |
| privileged_agent_process_thread_pool | 1 | helper线程池；无交集。 |
| single_process_graceful_exit | 3 | single/signal退出；无交集。 |
| intercept_error_log | 4 | 公共error log拦截；不改变本批引用中的赋值、错误判断或返回码，不扩日志。 |
| upstream_pipelining | 1 | 发送handler停用条件；本批版本只到请求构造/过滤器交接，未引用发送handler。 |
| server_header | 3 | 响应Server字串/版本宏；未改上游请求版本、Host头或响应status解析。 |
| no_error_pages | 7 | core错误页配置/合并；未改rewrite phase消费，不展开最终错误页。 |
| no_Werror | 3 | 编译-Werror选项；无交集。 |
| log_escape_non_ascii | 10 | HTTP日志转义；本批不展开日志。 |
| proxy_host_port_vars | 1 | proxy变量表去NOHASH；header旧affected保留并绑定该patch，不改host/port计算。 |
| cache_manager_exit | 1 | cache manager退出；无交集。 |
| larger_max_error_str | 1 | 日志长度宏；无交集。 |
| pcre_conf_opt | 2 | configure PCRE参数；无所引脚本运行代码变更。 |
| always_enable_cc_feature_tests | 1 | configure能力探测；无直接片段。 |
| ssl_cert_cb_yield | 2 | 普通shared handshake新增WANT_X509_LOOKUP等待；TLS新消费affected已获主批准。第二hunk为early-data，本批不展开。 |
| ssl_sess_cb_yield | 2 | 普通shared handshake新增条件PENDING_SESSION；TLS新消费affected已获主批准。第二hunk为early-data，本批不展开。 |
| ssl_client_hello_cb_yield | 2 | 普通shared handshake新增条件WANT_CLIENT_HELLO_CB；TLS新消费affected已获主批准。第二hunk为early-data，本批不展开。 |
| upstream_timeout_fields | 10 | TLS握手AGAIN直接timer字段从conf改u.connect_timeout；TLS新消费affected已获主批准。其余init/发送/读取等hunk不扩；版本不引用这些消费。 |
| safe_resolver_ipv6_option | 3 | resolver create能力校验；无本批直接片段。 |
| socket_cloexec | 10 | socket创建/FD标志与能力宏；本批不扩event_connect/accept/resolver TCP，stream.h enum/phase checker无交集。 |
| reuseport_close_unused_fds | 2 | listening socket与event init；不改所引upstream关闭/peer回调。 |
| proc_exit_handler | 7 | cycle/进程退出hook；无本批直接片段。 |

### TLS状态变化已获主授权的精确依据

旧状态 verified_unaffected，旧范围仅注册/配置、upstream.c:1722–1742 的开关与set调用、1837–1854 save委派、proxy模块5061–5067 cache配置，未展开shared handshake。新范围 upstream.c:1747–1759 实际调用 ngx_ssl_handshake，event_openssl.c:1798–1942 普通helper及2143–2163事件回调；三项yield补丁分别绑定 runtime-cert-yield-patch（19–42）、runtime-session-yield-patch（4–17）、runtime-hello-yield-patch（5–14）。仅在支持的条件编译及错误码下增加等待分支，不保证样例启用回调。upstream_timeout_fields:34–42直接改同处AGAIN计时字段，绑定runtime-timeout-patch。因新增真实消费片段有交集，主已读取这些固定对象并明确批准唯一精确迁移为 verified_affected，实施据此落盘；不是修改旧事实，不是将所有TLS失败归为SNI。其余四状态保持原值，旧patch引用前缀不变。普通握手分支之外的early-data/OCSP内部路径不扩张为本批已核范围。

http_version保持verified_unaffected：只引用请求构造、版本字串、直接正文模式/过滤器交接和独立响应解析，不引用pipelining发送handler或timeout字段消费，不能因整个upstream文件有patch就改此项状态。

## 交接与冻结边界

五项实施稿已冻结：HTTP set 7步、stream set 5步、header 6步、HTTP version 5步、TLS session reuse 10步，共33步；新增evidence分别8/8/17/13/33，共79条，含独立文档。旧45条evidence及各身份顺序/全部元数据保持；原9 deep与非本批身份未改。stream limitations表示转换与c499完整旧对象相等，默认/继承及其他旧事实不变，patch只改必要note/source_ids和唯一已批准status。

本轮不运行build、测试、校验器、产品发布、浏览器或OpenResty；不联网、不读私有原样例，次数仅采用计划聚合19/4/20/1/20。未生成临时文件。主接手后按固定c499核旧字段/旧sources，执行专项与step负例、构建、实际发布及网页验收；五项通过后精确预期14 deep，当前不冒称已发布或审核通过。最终发布ID及独立签署待主/审核补入各自验收记录。实施停止写入，不启动B2；后续批次等待主另发。

## 实施冻结快照

以下摘要是对当前落盘对象执行 JSON.stringify 后取 SHA-256，供主/审核确认是否发生新改动；不是测试套件结果。只读差异确认精确五身份变化，其余1012个 curated 条目逐对象不变；五项旧事实与旧evidence前缀、patch引用前缀、步骤代码并集和显式component检查一致。stream limitations与c499完整对象相等。实际全1041项发布及扩展保护由主构建验收，未以curated计数代替发布计数。

| 精确身份 | 冻结对象SHA-256 |
| --- | --- |
| nginx/ngx_http_rewrite_module/set | 385bc93aef8555e64add9658c12ddd006fbabe685de3a4c0edde90f004c1d1f6 |
| nginx/ngx_stream_set_module/set | 06680ac91486e22c61023426f92505ec8970decd4c806ac7fda8005287ec15d5 |
| nginx/ngx_http_proxy_module/proxy_set_header | bd69d6bc5c388a8cc067eecdba627ed65cff59852201590709878ab4d58f7228 |
| nginx/ngx_http_proxy_module/proxy_http_version | 08b0484570bd9071243667a5fcfc7ad5787275671a4eab4efbd46bf23ddb1c56 |
| nginx/ngx_http_proxy_module/proxy_ssl_session_reuse | 9d3937192fb7decf03e31e93dedef1524c6bc7941185d4545b35703f98a3bbc4 |

落盘 knowledge/directives.json 文件 SHA-256：`6c7f7da8a22cea70a2524df0f63feadab03a5c7a046a920c96a993ac0dd99113`。后续内容变更需重新冻结并复核，不能沿用本快照。


