# 样例代理链首批运行时审核

## 当前结论

2026-10-13，预审完成，最终签署待冻结稿、新 release 和主线程实测记录。当前实际发布仍为 `1.27.1.1-c49915e4ed7a7e58`，不能据此签署新增 runtime。主线程报告初稿12项在旧发布失败，作为主线程反馈记录，审核未执行测试。

深度交互：真正验收对象是五项消费链的条件、动作、出口与步骤引用闭合；35步或其他数量不作为通过条件。动态 resolved peer 与配置 upstream 的 TLS 会话回调不同，是本批最容易产生错误保证的位置。无需为解释该区别扩展完整 TLS、DNS 或连接重试教程。

直接执行：本文件是审核方唯一写集合，使用 apply_patch；未修改知识、测试、构建、发布或计划，未运行 build、测试、补丁回放、浏览器、OpenResty 或私有样例，未生成临时文件。

## 计划及固定边界

已读取 `SAMPLE_REMAINING_RUNTIME_PLAN.md`，首批五身份与交接一致，范围可执行：HTTP rewrite set、stream set、HTTP proxy_set_header、proxy_http_version、proxy_ssl_session_reuse。41项中35运行候选与6配置收口项的区分合理；本轮仅审核B1，不据此签署其余36项的内容或样例频次。

nginx HEAD 为 `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`，工作树干净；OpenResty HEAD 为 `8c37412c31621225e7aa7e825b5b50106c9c71c4`，仅有未跟踪 tags。下列源码坐标属于上述 nginx 固定版本；补丁引用属于固定 OpenResty，不能把补丁头的历史行号当 nginx 现有行号。

读取到的五项旧 patch 分类分别为 unaffected、unaffected、affected、unaffected、unaffected。冻结后须再以c499详情逐字段核实。全部旧 sources/facts 保护，stream set 旧 limitations 字符串仅允许固化为c499完整 facts 对象，发布对象不得变化。不得顺带修改 phase、mechanism 等旧字段。

## 独立消费链核查

| 核查点 | 固定源码证据及审核要求 |
| --- | --- |
| HTTP set | `src/http/modules/ngx_http_rewrite_module.c:136–184`执行脚本引擎，分配失败返回500；279/286分别挂server rewrite和location rewrite。`src/http/ngx_http_script.c:1813–1864`从脚本栈写请求变量或调用setter。不能说成解析配置时直接赋运行值，不能把请求变量保留写成配置继承。表达式求值失败及脚本退出仍须绑定冻结稿对应步骤。 |
| stream set | `src/stream/ngx_stream_set_module.c:76–108`逐条求复杂值、setter或会话索引变量赋值，失败NGX_ERROR，正常NGX_DECLINED；129挂PREACCESS。`src/stream/ngx_stream_core_module.c:191–226`把NGX_ERROR转stream内部500并结束会话；不是生成HTTP 500响应。 |
| 请求头 | `src/http/modules/ngx_http_proxy_module.c:1323–1324`刷新不可缓存变量；1447–1507生成版本及求值头，值为空跳过；1510–1538通过headers hash阻止原请求同名头透传。空头省略与阻止透传须同时解释；配置编译不代替运行求值。 |
| Host/目标/TLS名称 | `src/http/ngx_http_upstream.c:694–805`从resolved或配置组选择目标并设置默认ssl_name，1858–1947单独求TLS名称、去端口并按ssl_server_name控制SNI。Host序列化不改上述对象；变量目标还可能先匹配命名组，不能一概称DNS临时peer。 |
| HTTP版本 | `ngx_http_proxy_module.c:1447–1455`选择上游请求行，1015–1021同时参与不缓冲chunked请求体条件；不是客户端协议开关。连接缓存另由`ngx_http_upstream_keepalive_module.c:147–228`安装包装器，315–355检查连接健康、请求数/时间、u->keepalive和request_body_sent；1.1不自动建立缓存。 |
| TLS启用与回调 | `src/http/ngx_http_upstream.c:1725–1742`在开关开启时安装save_session并调用peer.set_session，失败500；1837–1854保存入口在idle时跳过，否则委派peer.save_session。`src/event/ngx_event_openssl.c:1668–1701`启用CLIENT加NO_INTERNAL并注册new-client-session回调；不能把它说成自动使用OpenSSL内部缓存。 |
| 两种peer | `src/http/ngx_http_upstream_round_robin.c:301–304`配置round-robin安装真实恢复/保存函数；422–423临时peer安装empty函数，841–851仅返回OK或直接return。上游DNS回调`ngx_http_upstream.c:1245`走临时构造。真实缓存读写见round_robin的680–836，zone与非zone路径分开；开启reuse不保证有session或对端恢复成功。 |

## 34项补丁交集预审

已逐项读取 `NGINX_PATCH_AUDIT.json` 所列34项对应补丁的目标文件和hunk范围，并详读下列相关补丁正文。本次未回放；历史回放不能冒充本次执行。发行脚本的完整条件映射及冻结后的精确source区间仍须终审核对。

- `proxy_host_port_vars`：改变proxy_host/proxy_port/proxy_add_x_forwarded_for的NOHASH标志，不改Host序列化算法；proxy_set_header既有affected不得降级。
- `ssl_cert_cb_yield`、`ssl_sess_cb_yield`、`ssl_client_hello_cb_yield`：实际修改共享`ngx_ssl_handshake`及early-data的错误分派，加入特定条件下等待返回NGX_AGAIN。仅引用client_session_cache/new_client_session、set/get_session或round-robin保存，并不能证明这些补丁直接命中；若冻结稿声称覆盖完整握手返回语义，则必须绑定相关补丁。不能由共享函数交集推导“上游请求必定触发下游Lua回调”。
- `upstream_timeout_fields`：直接把TLS初始化等待分支的`u->conf->connect_timeout`改为`u->connect_timeout`；新增片段若含`ngx_http_upstream.c:1752`附近完整AGAIN分支，不能仍以原值解释发行版。
- `balancer_status_code`、`socket_cloexec`：涉及connect入口/系统连接；冻结稿若向连接分派展开需核相应hunk，单纯peer session回调不因此自动affected。
- `upstream_pipelining`：改send_request_handler的停止发送判断为request_body_sent；不改请求行版本判断，也不自动建立keepalive缓存。
- `resolver_conf_parsing`、`safe_resolver_ipv6_option`：修改resolver配置创建，不能因讨论DNS临时peer就认定session缓存受其修改。
- `stream_balancer_export`、`stream_proxy_get_next_upstream_tries`、`stream_proxy_timeout_fields`、`stream_ssl_preread_no_skip`：不改stream set PREACCESS及其赋值handler；若扩展后续stream proxy全文，需重新核范围。
- 其余20项在上述最小直接消费范围未发现交集：`win32_max_err_str`、`daemon_destroy_pool`、`init_cycle_pool_release`、`builtin_error_page_footer`、`delayed_posted_events`、`privileged_agent_process`、`privileged_agent_process_connections`、`privileged_agent_process_thread_pool`、`single_process_graceful_exit`、`intercept_error_log`、`server_header`、`no_error_pages`、`no_Werror`、`log_escape_non_ascii`、`cache_manager_exit`、`larger_max_error_str`、`pcre_conf_opt`、`always_enable_cc_feature_tests`、`reuseport_close_unused_fds`、`proc_exit_handler`。这不是整条网络/日志/进程链unaffected声明。

## 回主线程的待决事项

R1：SSL分类待主线程确认。如冻结稿包含上述握手/计时器新增消费，提交精确“旧范围→新片段→补丁hunk→行为→证据ID”后再确认unaffected→affected。当前测试checkPatchBoundary及两处status全等约束锁住旧状态；获准后只放行这一身份、这一状态迁移，继续拒绝其他字段或身份变化。预审不默许迁移。

R2：测试已增加五类源码分支检查，但目前runtimeEvidence.at在总runtime来源中找片段，尚不足证明条件/动作/出口在正确step。主线程已明确待Sol冻结后补对应step及错位负例，因此这是终审待完成项，非将初稿认作最终缺陷。需覆盖空回调、Host/SNI/目标、stream错误出口、HTTP版本与缓存边界；移动引用仍保持总集合合法时，专项检查必须失败。

R3：generic当前对sources排序后比较，可发现内容和重复差异，但无法证明计划要求的来源顺序未变；冻结后应另检查旧source相对顺序及新增来源确定顺序，避免通过排序吞掉重排。旧curated evidence前缀摘要保护仍保留。

最终签署前：逐步核冻结语义和文档，独立比较固定Git片段与新发布全部元数据；全1041详情按精确白名单比较c499，确认旧9 deep保持且仅本5项晋级；读取主线程新release的测试、样例及网页/Markdown实测记录。以上尚未完成，当前结论不代表内容最终通过或发布验收通过。

## C1配置边界独立审核及R3复核

结论：C1六项在计划限定的配置边界内审核通过，可记为已收口，全部保持basic、无runtime。该结论不依赖B1冻结；后续新发布仍须通过六项原事实不变的保护检查。

已完整读取 `SAMPLE_CONFIGURATION_BOUNDARIES.md`，独立阅读其六项主要配置消费片段及对应文档，并搜索HTTP/stream的variables_hash_bucket_size全部代码引用。include将同一cf传入递归解析；events/http/stream建立并初始化配置上下文，空父server配置用于合并而非隐式服务；两个bucket_size在配置初始化中对齐并传给ngx_hash_init，未发现请求/会话处理直接读取这两个字段的引用。构建后的配置对象、hash和阶段表供运行使用，不足以把其下属所有运行行为归给容器或构建参数。六项分类与完成范围合理，没有需要新增runtime才能收口的缺口。

补充精度边界：include文中“失败按回调返回”应按实际代码理解，不能扩写成所有glob读取异常均向外返回错误；`ngx_conf_file.c:861–864`在ngx_read_glob非OK时退出循环，最终返回rv。这不影响当前配置期分类，也未发现现有记录承诺统一失败码。

独立只读检查固定c499六份实际详情：include 7、events 8、stream 9、http 11、stream bucket 9、HTTP bucket 9，共53条sources；逐条以其revision/file执行git show并按行范围比较code，53条全部一致。六份详情均为basic_verified且无runtime。此检查不是测试套件执行，不修改发布；主线程原53条核对报告已得到审核方独立复核。未读取私有include或两份原配置，A/B外部引用2/1保留为主线程记录及未分析边界。

进度口径：原41项为35运行候选加6配置项；C1现已收口6项。B1五项仍待最终审核，通过后剩30个运行候选；届时样例身份为已审限定runtime 14项、配置边界已收口但basic 6项、运行候选待办30项，绝不能称50项全deep。

R3代码复核关闭：`test/proxy-chain-runtime.test.mjs`现按c499旧来源顺序、curated新增evidence顺序、固定末项distribution-version生成expectedOrder，对实际sources完整数组直接deepEqual，并增加sources.reverse负例；不再先排序实际sources。旧curated evidence前缀SHA及删除/重排负例仍保留。此处确认实现修复，未代跑测试；新发布执行结果仍由主线程提供。R1继续等待Sol精确证据和主线程确认，R2等待冻结后按实际step补齐，不预设步骤文字或数量。

## 冻结发布d9627861d4d894fc内容复核

本节以 `1.27.1.1-d9627861d4d894fc` 为审核对象。读取五项完整runtime，步骤分别为HTTP set 7、stream set 5、header 6、version 5、TLS 10；数量仅标识当前稿。重点消费语义基本成立，但以下两处须退回修正，当前不签署最终通过。

### R4：版本默认值在步骤内缺少直接来源

proxy_http_version第1步声明“未设置有效值默认为1.0”，source_ids仅有implementation-0、runtime-proxy-handler、implementation-1，分别支持枚举、handler安装、请求行选择，没有默认合并。真实证据是已有merge-default，`src/http/modules/ngx_http_proxy_module.c:3831–3832`。在该步绑定此来源并同步runtime并集即可；不改旧默认事实，也不需要新增源码研究。

### R5：响应解析错误回退需明确缓存分支

proxy_http_version第5步写“解析错误……可走HTTP/0.9回退并置connection_close”。绑定的`src/http/modules/ngx_http_proxy_module.c:1825–1829`实际上在NGX_HTTP_CACHE且r->cache存在时只设置r->http_version=9便返回NGX_OK；未执行后面1843–1847的connection_close=1。请显式区分缓存提前返回与非缓存回退，避免把二者合并。已有runtime-response-version完整覆盖两条路径，无需扩展缓存实现。

### 已核主要语义及R1/R2状态

HTTP set的脚本栈、常量/复杂值、变量/捕获复制、setter、rewrite控制流与URI循环出口均与已读固定片段相符；stream的PREACCESS、按序复杂值、会话变量与generic错误结束相符。header空值占hash但不输出、原始同名头屏蔽、Host/目标/TLS名称分离符合源码。version的请求行选择、非缓冲条件、chunked过滤器交接和非自动连接池说明成立，待修上述两个具体问题。

TLS已核：普通新TLS入口与已有SSL连接跳过；命名组/动态临时peer及empty回调；候选session装载与失败500；shared普通握手等待、条件yield及HTTP结果回调；new client session临时引用与idle跳过；zone/非zone保存；keepalive委派；独立SNI与校验；请求结束/重试清理和独立peer缓存引用区分。未将on或set_session返回OK当作恢复成功，也未将FT_ERROR/FT_TIMEOUT当作必重试或必返回网络状态码。

R1授权问题关闭：主线程本轮明确批准仅SSL session reuse由unaffected迁移affected。新增共享普通握手1798–1942与调用/等待1747–1759实际命中三项yield普通握手hunk及upstream_timeout_fields:34–42；依据与批准一致。最终仍须保护其他四项状态和其余patch字段。

R2实现复核关闭：已读第13项七类对应step检查；先唯一定位condition，再在该step内找代码锚点，错误正文及移走本step全部锚点引用的负例保留runtime总集合，并要求validateRuntime成功而语义检查失败。主报告新发布31/31定向通过，作为主执行结果记录，审核未运行测试。

### 发布只读检查

独立读取本release全部1041详情并对照c499：非目标1036项仅排除release_id后全字段一致；五目标排除runtime/sources/patch_status/verification/release_id后全字段一致，包含旧limitations。五项runtime与当前curated一致，旧sources每个完整对象保留。五项共139个实际发布sources的code逐条与其固定Git对象/行范围相等，未发现差异。实际14 deep身份为旧9项加本5项。

本次只读脚本不替代剩余完整元数据、来源顺序与精确patch白名单终审；主线程已报告这些保护检查通过。全量及网页实测仍待主记录。修正R4/R5后需重新绑定最终release，本节不自动签署后续发布。未运行build、测试、浏览器、私有样例或写入本文件之外内容。

### d962实测证据补充与最终发布门槛

已直接读取 `sample-proxy-chain-runtime-tests.log` 末尾：180 tests、180 pass、0 fail/cancelled/skipped/todo，33006.601291毫秒。结合主线程本轮明确绑定d962的交接，将其记为d962全量验收；31项定向结果仍采用主线程记录。

主线程报告d962网页A24/24、external2，B258/258、external1，五项33步的condition/action/scope/links/deep逐字段一致。header首次0steps发生在异步详情ready前，等待末步骤可见后校验正确，未改产品；这是主线程实测情况，审核未操作浏览器或读取私有样例。网页与数据一致证明呈现一致，不消除R4/R5的内容问题。

本次再次读取curated确认R4默认1.0仍未绑定merge-default，R5仍未区分r->cache解析错误提前返回；两项尚未关闭。仅删除SSL patch note中的主批准流程句属于产品文案清理，不改变这两项状态。请将R4/R5纳入最终修订；授权过程留analysis合理。最终新release须核对实际差异及修订内容，再引用主线程与新release对应的必要验证记录，不能直接把d962结果冒称最终发布已测。

## 最终候选ca870e6c128ac027复核

当前结论：内容审核与发布边界审核通过，最终QA签署待主线程最终全量及网页记录。本节取代上节R4/R5未关闭状态，不将d962实测自动计为本release实测。

R4关闭：版本第1步已绑定原merge-default（3831–3832），runtime.source_ids在对应首次出现位置同步纳入，无新增evidence。R5关闭：版本第5步明确NGX_HTTP_CACHE且r->cache存在时仅设HTTP/0.9并返回OK，不执行后续status和connection_close回退；非cache路径另述status=200、connection_close=1。正文与原固定源码一致。新增第14项回归按该语义及3831代码检查，不要求特定中文措辞；主报告d962可被该回归捕获，审核未代跑。

SSL patch note仅删除内部批准流程句，TLS全部10步与d962相同；批准依据保留于analysis。五项当前对象SHA-256及整个knowledge/directives.json的 `6c7f7da8a22cea70a2524df0f63feadab03a5c7a046a920c96a993ac0dd99113` 均与EVIDENCE重新冻结记录一致。

已独立只读核对精确发布 `1.27.1.1-ca870e6c128ac027`，未运行测试或构建：

- 五项124条curated evidence（旧45加新增79）按固定组件revision重取Git片段，重建完整component/version/revision/file/行号/code/URL/kind对象；实际139个发布sources与c499旧来源加本批来源完整逐项、逐字段相等。来源顺序为旧来源（暂移末项distribution-version）、curated新增顺序、原distribution-version；未排序实际结果或去重掩盖重复，旧sources完整对象均保持。
- runtime与curated完整相等，步骤来源首次出现去重并集与runtime.source_ids精确一致；patch引用保留旧前缀、没有重复且覆盖全部运行代码。patch其他键完整保护，状态仅SSL由unaffected转affected，其余四项与c499一致。
- 全1041详情release_id一致；非本批1036项仅排除release_id后全字段相同，五项仅排除明确允许字段后全字段相同。旧默认/继承/limitations等事实未变。
- 全索引条目及顶层按允许发布路径、五项评级、deep计数归一化后与c499完整相同，current index完整等于该冻结index。deep集合精确为旧9加本5；1041 basic/14 deep，bundled1017/14、扩展24/0。

直接读取 `sample-proxy-chain-runtime-final-focused.log`：32 tests、32 pass、0 fail/cancelled/skipped/todo，1504.734958毫秒。最终181项全量和50552重载网页尚待主QA记录，当前不作最终签署。C1六项配置边界已收口且保持basic；B1最终验收后剩30运行候选，不称50全deep。

## 分项签署：内容、发布、自动测试通过，桌面复测待完成

签署对象：`1.27.1.1-ca870e6c128ac027`，比较基线 `1.27.1.1-c49915e4ed7a7e58`。

本次直接读取 `analysis/sample-proxy-chain-runtime-final-tests.log` 末尾，确认181 tests、181 pass、0 fail/cancelled/skipped/todo，耗时36419.432毫秒。结合已核最终定向32/32及本文件完整源码语义、发布来源/元数据/顺序、全字段保护和唯一SSL状态迁移复核，正式签署B1内容审核通过、发布数据审核通过、自动测试验收通过。R1–R5均已关闭，无未解决的内容或发布数据问题。测试由主线程执行，审核只读核对日志。

签署时再次读取current index，仍为ca870；knowledge文件SHA-256仍为 `6c7f7da8a22cea70a2524df0f63feadab03a5c7a046a920c96a993ac0dd99113`，与已审冻结稿一致。1041 basic/14 deep，bundled1017/14、扩展24/0不变。

最终桌面验收仍待复测，不签署桌面通过。依据主线程最新交接：旧50552服务到期进入连接错误页；新51795返回HTTP200，但CUA自动导航被Browser Use URL policy拦截，已请用户手动打开，尚未收到回复。HTTP200不能替代五项详情及样例的桌面验收；d962的网页结果仅适用于旧发布，不能冒充ca870结果。审核未操作浏览器，未自行验证端口或读取私有样例。

范围交账：B1五项内容/发布/自动测试已通过，桌面验收待完成；C1六项配置边界已收口，保持basic、无runtime；其余30个运行候选继续待办。不得称50身份全deep，也不得称本批全部验收环节已完成。后续完成桌面复测后另补同一release的记录；如发布或冻结内容变化，需复核相应变化。

本次仅用apply_patch更新本审核文件，没有修改任何其他文件，也未运行build、测试、浏览器或私有样例。
