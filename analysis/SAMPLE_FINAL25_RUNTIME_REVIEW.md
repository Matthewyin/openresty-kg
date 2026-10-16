# B3—B11剩余25项运行时独立审核

日期：2026-10-14。状态：预审准备完成，25项全部待审；未收到稳定组，不签署内容、发布或验收通过。

## 深度交互：审核目标与证据边界

目标是逐项证明限定范围内的真实消费及失败出口，不以最终44 deep倒推证据。配置注册、解析、merge、建立共享区或安装handler不单独构成运行时。最短审核路径是冻结组身份和摘要后逐步读固定源码，再检查发布与字段保护；不追读实施中的知识作为最终稿。

本轮只写本文，未读私有配置、未联网、未运行build、测试、补丁回放或浏览器，未改知识、src、site、schema、dist。已读取剩余计划、B2 PLAN、B2 REVIEW最终签署及B2 EVIDENCE；B2历史过程不作本批实际执行记录。初次补丁路径定位失败后按既有回放脚本的版本化路径重新读取成功，没有运行发行脚本。

固定发布：`dist/knowledge/releases/1.27.1.1-06a6394fb516a4bb/`，已直接核index为1041 basic/19 deep，bundled 1017/19，扩展24/0；已逐项读取25个基线详情的patch状态和来源目录。基线不是变化中的current。现有来源模型已读`src/query/knowledge.mjs`：结构校验不证明步骤语义；基于Map的引用校验不能代替审核前先检查原数组重复、顺序和完整元数据。

固定对象：nginx `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`；docs `e8b581903e9d41252720053311cea687a5671674`；OpenResty `8c37412c31621225e7aa7e825b5b50106c9c71c4`；VTS `52fe11e44c47a49b052be89e36dfa17d81bf52a5`。下列已给行号均来自本地git show原坐标；未给行号的函数是后续必查入口，不冒称完整调用链已核。

## 直接执行：逐项待审表

身份前缀：N=`nginx--`，V=`nginx-module-vts--ngx_http_vhost_traffic_status_module--`。表内N后的模块及指令拼接构成完整精确身份。每项状态均为待审，预查不是稳定稿验收。

| 批次 | 精确身份（按上述前缀展开） | 待核消费与易错条件 | 状态 |
| --- | --- | --- | --- |
| B3 | Nngx_http_limit_conn_module--limit_conn_zone | limit_conn模块180–307：复杂key失败500；空key及大于255字节均跳过，后者记日志；锁内查找/分配/增计数，392–433清理。仅初始化共享区不够。 | 待审 |
| B3 | Nngx_http_limit_conn_module--limit_conn | main状态已设则DECLINED；超限或slab失败会cleanup_all后按dry_run返回DECLINED或配置状态。294–297在增计数后cleanup分配失败直接500，不能宣称所有失败都自动回滚。须补preaccess实际调用与请求池清理调用者；多路复用计数口径另核独立文档。 | 待审 |
| B3 | Nngx_http_proxy_module--proxy_limit_rate | upstream.c:3239给event_pipe求复杂值；pipe.c:205–222预算、343–385累计及延时。必须补复杂值size失败回退、recv_chain返回、timer恢复调用链；不把r->limit_rate或X-Accel-Limit-Rate混为此值，不扩大为非缓冲路径限速。 | 待审 |
| B4 | Nngx_http_log_module--log_format | log_module.c:299–309逐操作算长度，344–345/373–374实际run；补变量缺失及default/json/none各路径。HTTP非ASCII补丁仅对应实际修改的默认转义函数。 | 待审 |
| B4 | Nngx_http_log_module--access_log | 269–398：off、filter求值错误与空/单字符0跳过不同；disk_full同秒跳过；buffer容量/首次timer/超大行直接分配、分配失败及syslog短写分别核。补真实日志阶段调用、文件写失败与flush消费者，不能保证持久落盘。 | 待审 |
| B4 | Nngx_stream_log_module--log_format | stream log:246–258算长度，292–293/321–322运行操作；变量与转义独立取证，不能借HTTP log_escape_non_ascii补丁改变stream语义。 | 待审 |
| B4 | Nngx_stream_log_module--access_log | handler.c:301–310先设内部status、日志再关闭；log_module.c:218–243 off/NULL logs/filter/磁盘满分支，310–312分配失败。补日志handler数组真实调用与write/flush，不把status当HTTP响应码。 | 待审 |
| B5 | Nngx_errlog_module--error_log | ngx_log_error_core的级别门控、writer/file链、stderr及写失败；cycle日志切换和reopen按实际范围补链。intercept回调在换行前且受entered_logger保护，返回值不作为取消写出的依据。 | 待审 |
| B5 | Nngx_http_core_module--error_log | request.c:543、946、2313分别涉及创建请求、TLS配置选择、虚拟主机切换；须另核location更新的日志选择及真实错误输出。不能虚构单一请求日志阶段。 | 待审 |
| B5 | Nngx_stream_core_module--error_log | stream handler.c:125–145默认server上下文到连接日志；149–151真实输出。核后续配置切换和最终输出链，不直接复用HTTP请求上下文。 | 待审 |
| B6 | Vvhost_traffic_status_zone | VTS module.c:293–297 enable/location enable/bypass_stats/NULL区跳过；300–304统计写失败只记日志。补shm_add_node锁、查找、容量失败、计数更新及展示读取；初始化不是全部消费。 | 待审 |
| B6 | Vvhost_traffic_status_filter_by_host | VTS shm.c:533三条件filter && filter_host && server.len；否则server_name，空名回退下划线，548–553生成key失败或入节点。不是开关单独决定Host，也不是访问控制。 | 待审 |
| B6 | Vvhost_traffic_status_display | display.c:125–129 enable/方法门控；补控制URI分派、HEAD、discard body、buffer失败、send_header/output_filter出口。不得把HTML壳直接说成读取全部统计树。 | 待审 |
| B6 | Vvhost_traffic_status_display_format | display.c:438–492 URI /format/识别优先，否则配置；499–518类型及HEAD，541–568 JSON/JSONP/Prometheus加锁读取，HTML另支。明确只审选定格式还是全部，未知格式回退按实际代码。 | 待审 |
| B7 | Nngx_core_module--pid | cycle.c:320–345测试/非初始cycle改路径分支；1018起创建，1066起按new_binary选择pid/oldpid删除。补main首次创建、升级rename及失败恢复、退出调用者；不能称每worker写PID或每reload都重写。 | 待审 |
| B8 | Nngx_http_core_module--listen | 待闭合HTTP地址配置到ngx_open_listening_sockets、accept、ngx_http_init_connection的默认地址选择；bind重试/失败、继承fd、通配地址、reuseport限定。accept和监听socket创建不能混为一次操作。 | 待审 |
| B8 | Nngx_http_core_module--server | request.c:1164/1863/1967实际调用set_virtual_server，2309–2315切loc_conf/log；补默认server、Host校验、精确/通配/regex及失败。块创建不是运行匹配，SNI与Host各自条件不能合并。 | 待审 |
| B8 | Nngx_http_core_module--location | core find_location递归1400附近、1425–1449返回分支需完整核；精确/前缀/regex、自动重定向及内部重定向循环限制分别证明。不是简单按文本顺序匹配所有location。 | 待审 |
| B9 | Nngx_stream_core_module--listen | handler.c:42–117按本地地址选配置，119–122会话分配失败关闭；183–198 PROXY等待/注册失败。明确TCP/UDP范围，UDP必须另外证明收包入口，不能套TCP accept。 | 待审 |
| B9 | Nngx_stream_core_module--server | handler.c:125–130 default_server ctx与virtual_names写入，后续session handler/phase/content实际消费待补。固定版本已有virtual_names，禁止断言stream完全不存在虚拟主机选择；允许限定默认接入链，不套HTTP Host/location。 | 待审 |
| B10 | Nngx_http_core_module--client_max_body_size | core声明长度检查及request_body.c:1142–1150 chunk size与累计长度差值检查分开；核0关闭限制、discard/413/lingering出口，不把限额误写成预分配内存。协议范围按引用限定。 | 待审 |
| B10 | Nngx_http_core_module--keepalive_timeout | request.c:2801–2807含非terminate/非exiting/r->keepalive/timeout>0；3303–3309 idle/reusable/timer/post。补流水线剩余字节、下一请求、超时/关闭、其他禁用条件；第二参数响应提示不是同一个timer。 | 待审 |
| B11 | Nngx_http_core_module--sendfile | 待闭合core有效标志→copy/output chain→选定平台send_chain；内存/文件buffer、need_in_memory/directio、SSL及系统调用短写/EAGAIN/错误按scope核。不能把开启等同所有输出零拷贝。 | 待审 |
| B11 | Nngx_http_core_module--default_type | core.c:1643–1646兜底；补set_content_type已有类型提前返回、extension hash与小写分配失败以及实际内容handler调用者，不能称覆盖所有响应Content-Type。 | 待审 |
| B11 | Nngx_http_core_module--server_tokens | header_filter/special_response消费，补已有Server头、主/子请求、on/build/off的条件及错误页输出失败。server_header、footer与发行minor替换必须引用；off不等于删除Server头。协议范围不得由HTTP/1证据扩到HTTP/2/3。 | 待审 |

其中明确行号的分支已独立读取；表中“补”“待闭合”仍是后续任务，未预先判定实施者缺陷。未逐行阅读的独立文档将在稳定组审核时直接从固定docs/VTS对象取出核定。

## 34补丁完整集合与初步交集

已逐项读取34文件的目标/hunk目录，并直接读取固定`util/mirror-tarballs:35–550`核版本条件与顺序。主版本1.27.1，minor=1；server_header在162复制、163替换、165应用。注释行、旧安全版本分支、可选调试补丁不加入集合。所有补丁路径均为固定OpenResty的`patches/nginx-1.27.1-<名称>.patch`。

以下是范围筛查，不是25项最终补丁签署。最终须将每条新增片段与全34项重对，相关hunk读全文并绑定本步骤。hunk头旧行号不直接充当固定nginx坐标。既有offset/fuzz和最终hash是历史回放证据，本轮没有回放。

| 顺序 | 补丁 | 发行脚本行 | 本轮筛查及后续约束 |
| --- | --- | ---: | --- |
| 1 | win32_max_err_str | 36 | Windows事件日志大小；若纳入Windows日志需补核，不能混用Unix结论。 |
| 2 | stream_balancer_export | 49 | stream peer/session导出；默认接入不直接等于上游peer消费。 |
| 3 | stream_proxy_get_next_upstream_tries | 53 | stream代理重试导出；扩大proxy链才需纳入。 |
| 4 | stream_proxy_timeout_fields | 57 | stream代理上下文及超时读取；不归到server块的默认接入。 |
| 5 | stream_ssl_preread_no_skip | 64 | preread条件；若讲SSL preread路由必须核。 |
| 6 | resolver_conf_parsing | 68 | resolver配置/创建；与监听地址选择区分。 |
| 7 | daemon_destroy_pool | 72 | daemon父进程退出池；PID启动链若扩到此处须核。 |
| 8 | init_cycle_pool_release | 76 | cycle旧池释放及master退出；PID完整cycle链不可泛称不受影响。 |
| 9 | balancer_status_code | 104 | HTTP/stream上游connect特殊返回；缓冲限速不能扩成完整代理链。 |
| 10 | builtin_error_page_footer | 111 | 已读全文，内置短尾nginx改openresty；server_tokens直接相关。 |
| 11 | delayed_posted_events | 118 | 事件timer及新增延迟队列；恢复限速/keepalive若引用整段调度须核，不能把两类delayed混同。 |
| 12 | privileged_agent_process | 125 | master启动/reload与helper；PID范围须区分普通worker、master及agent。 |
| 13 | privileged_agent_process_connections | 132 | agent独立连接数；不扩大普通监听结论。 |
| 14 | privileged_agent_process_thread_pool | 139 | helper线程池；sendfile若扩线程路径需核适用条件。 |
| 15 | single_process_graceful_exit | 146 | single信号/退出已改；PID退出不能照抄未补丁上游。 |
| 16 | intercept_error_log | 153 | 已读全文；log.c回调发生换行前，entered_logger防重入，回调返回未用于截断输出。三error_log直接重点。 |
| 17 | upstream_pipelining | 158 | upstream send_request_handler条件；若仅限event_pipe读取不可顺带声称全部upstream不变。 |
| 18 | server_header | 162/163/165 | 已读全文；NGINX_VER及HTTP/1短头、HTTP/2编码常量改变，minor替换独立记录。 |
| 19 | no_error_pages | 171 | 已读全文；error_pages初始化/merge/配置冲突改变；server_tokens内置错误页与自定义错误页边界需关联。 |
| 20 | no_Werror | 175 | 编译选项；不证明运行分支或现场编译成功。 |
| 21 | log_escape_non_ascii | 201 | 已读全文；HTTP默认转义长度和实际输出都消费location开关，高位字节表被调整；不套stream/json/none。 |
| 22 | proxy_host_port_vars | 326 | proxy缓存默认头表；不混为proxy_limit_rate消费。 |
| 23 | cache_manager_exit | 330 | helper退出；PID普通进程范围不能扩成所有helper。 |
| 24 | larger_max_error_str | 355 | 已读全文；宏未定义才默认4096，不是无条件固定大小；公共错误输出重点。 |
| 25 | pcre_conf_opt | 359 | 构建选项；路由regex运行仍核编译guard和实际返回。 |
| 26 | always_enable_cc_feature_tests | 471 | 构建探测；不能据此保证sendfile平台能力。 |
| 27 | ssl_cert_cb_yield | 475 | TLS握手/early-data回调；listen/server若纳TLS握手需核。 |
| 28 | ssl_sess_cb_yield | 485 | 同上，独立补丁，不能仅引用cert项概括。 |
| 29 | ssl_client_hello_cb_yield | 492 | 同上，ClientHello等待条件独立。 |
| 30 | upstream_timeout_fields | 529 | event_pipe read_timeout等读取已改变；若proxy_limit_rate步骤描述相邻read_timeout，必须补实际hunk。 |
| 31 | safe_resolver_ipv6_option | 533 | resolver参数；与监听IPv6地址选择不同。 |
| 32 | socket_cloexec | 537 | accept4 flags及FD_CLOEXEC外层条件；B8/B9接入若纳accept须绑定，失败清理不遗漏。 |
| 33 | reuseport_close_unused_fds | 541 | worker不匹配reuseport fd关闭并置-1/跳过；close监听亦跳过-1，三条件不能丢。 |
| 34 | proc_exit_handler | 548 | cycle回调重置及收割回调；PID升级/回收范围须具体判定。 |

VTS四项基线patch状态均not_applicable；它仅限定扩展自身，不替代VTS引用nginx公共路径时的34项检查。其余基线affected为HTTP两个access/log_format、三个error_log、server_tokens；其他15项基线unaffected。状态迁移要逐身份提交旧范围、新步骤、原源码和补丁坐标、行为变化及证据ID，不按文件命中机械迁移，也不无依据降级。

## 来源模型、白名单与最终验收门槛

1. 稳定组交付至少包括精确身份、知识对象或文件摘要、证据文档、步骤范围及新增来源清单。组冻结后才审核该组；修改后原签署失效，复核变更及依赖。当前稳定组接收数0。
2. 每步condition/action所述外层条件、动作、失败返回和清理各有本步直接代码支持。总sources或其他步有同一函数不算本步闭合。每项的步骤代码首次出现并集精确等于runtime.source_ids；独立文档只列corroboration，不能拿配置编译或README配置例子替代真实消费。
3. 基线六项缺独立xml/md来源：stream access_log、HTTP error_log、stream error_log、VTS filter_by_host、stream listen、stream server；必须新增固定文档片段并直接读语义。已有文档也须读原文，不以文件扩展名通过代替佐证。HTTP/stream同名指令不可串用。
4. 先原样检查实际sources全部ID、顺序、重复、所有键，再逐条用固定Git对象重建code及component/version/revision/file/start_line/end_line/url/kind。旧完整来源前缀保持；distribution-version遵循B2的暂移末项再追加规则。不可先替换code、排序或Map去重后比较。
5. 只允许目标新增runtime、追加evidence、patch引用追加及范围note；status仅限有证据的逐项迁移。所有旧evidence完整对象、顺序和ID保护；summary/syntax/defaults/inheritance/limitations/phases/related等旧事实不改。legacy字符串如必须固化，按06a639完整facts逐字保留正文、状态、引用次序及额外键，不能重新推导旧事实。
6. 当前预审没有冻结实施前curated全量字节，因此不把实施中读取当原基线。最终发布按06a639保护全部旧事实；curated旧前缀还需主线程/实施前冻结证据，无法恢复的保护项明确待核，不能只用新知识和新发布互证。
7. 25目标之外1016个详情仅放行正常release_id；旧19 deep及C1六项保持。目标仅放行以上字段及验证器派生值；verification_notes变化逐键说明。索引只放行目标派生评级、正常路径与实际计数，schema/gaps/其他元数据不整体豁免。若25均通过才有44 deep（bundled40、扩展4），不是先验目标。
8. 最终每项真实消费、逐步证据、失败出口、独立文档、34补丁及字段白名单分别记结论；未充分项保留basic并列未决。主线程负责构建、测试与网页/Markdown、样例验收，本审核只读同一最终发布记录，不读取私有样例，不将B2的194/194或桌面结果挪用。

## 交接与退回记录

初步审核要点已落盘，可交主线程用于稳定组交付。当前没有针对实施稿的正式退回；以上风险不是已确认实施缺陷。

后续退回格式：编号、精确身份/步骤、实际声明、固定源码条件与坐标、缺失或错绑的source、最小修订要求、复核状态。审核只提出精准修订，不修改知识。全部25项当前均待审，尚未进行最终发布来源逐字核对或字段白名单签署。

## 主线程职责澄清与测试初审

主线程补充：规划初稿曾误把对子Agent的禁build/禁读私有样例扩大到全任务，正在修正。正确边界为主线程统一build、私有样例内存回放和页面验收；审核角色仍不执行这些动作。实施Sol首轮429正在重试，不把暂未交付当作知识缺陷。

已完整只读`test/final25-runtime.test.mjs`及`test/fixtures/final25-baseline.json`。主报告27检查在旧发布按预期失败；审核未运行测试或读取该执行日志，不将此报告写为独立实测。初步测试已有旧来源逐对象保护、发布旧事实保护、非目标摘要、查询和Markdown检查，但还不能作为最终语义门禁。

| 编号 | 测试位置 | 初审发现与最小补足 | 状态 |
| --- | --- | --- | --- |
| T1 | 61–74附近check及patch归一化 | actual.patch_status只与当前curated相等，随后整个对象替换为before；两者同步改变status或额外键仍可穿过。新增固定逐身份状态迁移白名单，patch除允许note/source_ids及已核status外逐键等于基线；增加curated与发布同步篡改状态负例。 | 待修/复核 |
| T2 | 91附近“错误执行语义”负例 | 只改发布action而不改curated，只测两份数据一致性，不证明语义正确。需独立已审步骤锚点表；把某步全部关键源码移动到别步，保持总引用并集且本步放其他合法代码，先断言validateRuntime仍通过，再断言语义门禁拒绝。 | 待修/复核 |
| T3 | fixture stableHash及47附近checkPrefix | fixture每目标有stableHash但测试未消费；目前只保护旧evidence前缀及发布事实，curated里未被发布使用的旧键可以漏检。按冻结时同一归一化方法检查目标stableHash，精确处理允许的legacy事实固化；加curated旧字段变化负例。 | 待修/复核 |
| T4 | owners初始化及27–40 fixedSource | revision/version由当前config/components取，尚无四固定revision常量断言；同步改配置和新增来源可能令测试检查其他对象。增加四组件固定身份断言及版本/仓库核对，源文件缓存键含revision；不把工作树配置当锁定依据。 | 待修/复核 |
| T5 | 55–59 expected Map | 当前另有旧来源逐对象比较和curated重复检查，不能简单判定已漏检；仍应先检查实际来源唯一性，再原数组比较，不依赖Map覆盖后的期望。给新增来源code/revision/URL及重复旧ID分别做定向负例。 | 待增强/复核 |
| T6 | 全局44 deep及逐项deep断言 | 可作为25项全通过后的目标验收，不得反过来要求证据不足项晋级。若独立审核留basic，须以明确审定结果清单调整条件性期望，同时保留所有25身份交账；不静默删除失败身份。 | 条件说明 |

基线fixture提供旧前缀摘要和stableHash，是可用的冻结材料；须核其生成方法/来源后才签署其历史可信度。它补充前文“本审核未自行冻结curated”的限制，不能凭字段存在宣称已核原对象。

### 25项步骤锚点测试建议

以下逐行对应前文25身份，不要求固定步数或中文关键词。锚点用component/revision/file/行范围及实际语句条件定位；同一ID换名或截掉外层条件也必须失败。尚未补齐行号的项在稳定组源码审核后固化，不能凭候选函数名先通过。

| 身份简称 | 必须在同一步验证的关键组合及反例 |
| --- | --- |
| HTTP limit_conn_zone | complex_value调用与失败、0/255边界、共享锁/查找/分配；移走key边界源但保留lookup应拒绝。 |
| HTTP limit_conn | main状态门控、计数比较、dry_run两出口及cleanup注册失败；删注册失败锚点却保留正常cleanup应拒绝。 |
| proxy_limit_rate | buffered路径、complex_value_size、pipe预算和delayed/timer恢复；用r->limit_rate片段替代p->limit_rate应拒绝。 |
| HTTP log_format | getlen与run实际执行、默认转义长度/输出函数及补丁；只有编译操作或只有长度函数应拒绝。 |
| HTTP access_log | off/filter三类出口、buffer/flush真实消费者、写失败；将所有失败来源挪到另一写步骤应拒绝。 |
| stream log_format | 会话ops getlen/run与本模块变量转义；用HTTP同名函数替代应拒绝。 |
| stream access_log | finalize赋status→日志数组调用→具体handler，off或NULL、write失败；只保留phase注册应拒绝。 |
| core error_log | 级别入口→core writer/file链，拦截guard和换行顺序；只有配置目的地应拒绝。 |
| HTTP error_log | 所述请求/虚拟主机/location的选择点→连接日志→输出；只引用公共logger而无配置消费应拒绝。 |
| stream error_log | srv_conf→set_connection_log→实际日志调用及公共logger；用HTTP选择点替代应拒绝。 |
| VTS zone | enable/bypass/NULL→shm_add_server→锁/节点增量与分配失败；只保留init_zone应拒绝。 |
| VTS filter_by_host | filter、filter_host、server.len三条件及fallback/key生成失败；删任一guard所在片段应拒绝。 |
| VTS display | enable/GET或HEAD、handler分派、分配/发头/输出出口；只保留安装handler应拒绝。 |
| VTS display_format | URI格式优先与配置fallback，同格式分派和输出；只保留配置枚举应拒绝。 |
| pid | 实际create/delete调用者、进程门控、文件写/rename错误，按scope纳升级恢复；只保留路径解析应拒绝。 |
| HTTP listen | socket创建/复用、bind失败→accept→HTTP地址消费，实际纳入的CLOEXEC/reuseport guard；只保留listen配置应拒绝。 |
| HTTP server | 请求调用set_virtual_server→匹配结果→srv/loc_conf更新，未匹配和regex错误；只有配置server数组应拒绝。 |
| HTTP location | 查找调用→递归/匹配返回→配置更新，正则/重定向出口按scope；仅静态树构造应拒绝。 |
| stream listen | 选定TCP或UDP真实入口→地址选择→session分配失败；UDP正文绑定TCP accept应拒绝。 |
| stream server | default_server ctx→session srv_conf→phase/content消费者；只保留server配置回调应拒绝，不接受无依据排除virtual_names。 |
| client_max_body_size | 非零限额与声明长度、chunk累计差值比较及413处理；只用配置merge或仅一条正文路径覆盖两条声明应拒绝。 |
| keepalive_timeout | 完成请求四条件→set_keepalive→timer→事件/下一请求/close；只有add_timer而无调用条件应拒绝。 |
| sendfile | 有效flag→输出buffer判断→选定平台实际发送及EAGAIN/错误；只有c->sendfile赋值应拒绝。 |
| default_type | 既有类型返回、扩展名hash未命中→fallback，并有真实内容handler调用；只有赋值无调用者应拒绝。 |
| server_tokens | tokens条件→所述Server头/错误尾输出、已有头边界及补丁常量；把HTTP/1锚点用于覆盖HTTP/2/3声明应拒绝。 |

T1—T4为最终签署前需要闭合的测试保护项；本轮不修改测试。最终语义仍逐步人工核源码，锚点测试仅保护已审结果不退化，不能自动证明任意中文正文正确。

## B3稳定组第一轮独立审核：退回补证

已按EVIDENCE稳定组读取三个精确HTTP身份，逐步重取全部runtime及corroboration片段（nginx/docs固定revision），没有等待其余组。三项均5步，总15步；当前不签署通过。以下是实际稿的问题，不是预审假设。

审核快照SHA-256(JSON.stringify对象)：limit_conn_zone=`60dce4632cf24edb05ab0bedbb903dbc1e00ae5a4be1e1c3105917a6007e3f70`；limit_conn=`7ecb86d7574184f8eb0068d1cae9ce9ec2924b99ffe7a600b2dbe53f05083b99`；proxy_limit_rate=`ab6ed8f544e95b71e73d430ff11995d301d3b78421c497f7e928b0a76cfdbd35`。后续改稿只需复核差异及依赖，不把整文件其他组变化视为本组失效。

| 编号 | 身份/步骤 | 固定证据与实际缺口 | 最小修订要求 | 状态 |
| --- | --- | --- | --- | --- |
| B3-R1 | limit_conn_zone、limit_conn第2/3步 | 第2步写“命中且未达限额才加1”，但本步node只到263，比较264和增量286仅在第3步runtime-limit-reject中；第2/3步称回滚，却只绑421–433调用cleanup，真正409减计数/411–413删除仅在第5步。第2步还称dry-run继续框架，但generic-phase只在其他步。 | 第2步直接加入已有runtime-limit-reject、runtime-limit-cleanup、runtime-generic-phase；第3步直接加入已有runtime-limit-cleanup。或精准收缩/搬移正文使本步证据完整。保持旧证据不改，并更新步骤首次出现并集。 | 退回 |
| B3-R2 | proxy_limit_rate第1/2/4步 | 第1步buffer-guard只到3098，非缓冲正常分支真正return在3131，当前引用未闭合“不走缓冲”。第2步从process_upstream函数直接开始，缺3349实际把u->read_event_handler设为它；第4步给出通用upstream_handler分派，但没有1588等read事件handler绑定，不能只凭两个函数名称闭合timer恢复。 | 追加非缓冲正常return与buffered handler赋值、read事件绑定的固定小片段，分别直接绑定到声明相关路径的步骤。核相邻条件与34补丁交集，不泛化完整upstream链。 | 退回 |
| B3-R3 | proxy_limit_rate第2步 | 文字“额度=速率×经过秒数加1秒−read_length”缺明确乘法括号；固定pipe.c:210–211实际为rate×(now-start_sec+1)−read_length。 | 写成明确括号公式；不能误解为rate×经过秒数之后再加1。原锚点保持。 | 退回 |
| B3-R4 | proxy_limit_rate第5步 | 引用4211–4228直接写完成判断，但外层4164要求u->peer.connection存在；NGX_THREADS下4158–4159的p->writing会先返回。当前文字未限定这两个条件，来源也未覆盖。 | 在完成判断步骤补充适用条件及直接源码；若排除线程路径，明确该限定并仍核实际入口。不要展开不需要的cache/store行为。 | 退回 |

已核正确部分：key空值/超长的跳过、main状态避免重复处理、slab失败与dry-run返回区别、cleanup分配失败没有即时撤销、cleanup_all只处理连续链头均与固定源码相符；HTTP/2/3并发请求计数由固定docs:80–81佐证。proxy复杂值失败/非法size回退0、recv错误/AGAIN/EOF、delayed与timedout双标记清除、发头后502不保证原样送客户端均有实际片段。独立文档三项分别支持本次限定核心语义。

字段只读核对：三项旧evidence前缀摘要均等于fixture，按现有冻结规则排除runtime/evidence/patch_status/limitations后的stableHash均相等；limitations分别与06a639完整相等；patch旧引用前缀和status保持；步骤来源首次出现并集及patch对runtime覆盖成立。没有以此替代新发布完整来源检查，当前未构建本批发布。

补丁初审：现有实际消费片段未发现34项直接改写；proxy本次没有把被upstream_timeout_fields修改的p->read_timeout赋值当原文。此结论限当前片段，R2/R4新增证据后须重查交集；日志函数调用存在不等于已经审完整logger内部。没有新增状态迁移依据。

### 新版语义测试只读核对

已读主线程新接入的46锚点循环：按对应step正文和直接source的实际行核验；文案破坏、移走锚点到独立附录两反例先断言validateRuntime通过，再要求语义断言失败，方向正确。新增stableHash已实际消费，VTS末项已改用module-build。未运行该测试，发布仍待统一构建，不签署最终通过。

现有46锚点是最低门槛，本轮B3-R1说明即使它们全部通过，也可能漏掉另一步的增量/清理证据。主测试建议追加：两个limit身份第2步必须直接覆盖264/286、409及generic-phase返回；proxy第1步3131，第2步3349，第4步read事件赋值，第5步4164及适用线程guard。采用同样“移到附录但结构仍合法”的负例。T1状态白名单与T4固定revision仍需最终复核，不因用户报告已补而预签。

B4当前EVIDENCE尚未标稳定，本轮没有读取其实施中内容作结论；稳定交接后继续独立审核，无需用户再确认。

## B4/B5稳定组第一轮内容退回与测试复核

本节状态更新：B4/B5已稳定交接，已直接读取7项全部runtime、证据区间和固定源码；以下覆盖18个B4步骤、15个B5步骤。不签署统一发布或桌面验收。基线旧evidence前缀、stableHash、limitations及patch状态已逐项只读核验，与06a639/冻结fixture一致。

| 编号 | 身份/步骤 | 实际问题和固定依据 | 最小修订 | 状态 |
| --- | --- | --- | --- | --- |
| B4-R1 | HTTP及stream access_log第2步 | 两项使用相同正文，均跨模块写“HTTP默认转义…stream按自身表”，HTTP项无stream源码、stream项无HTTP补丁。 | 各自只描述本模块转义；不需要为旁述扩大来源。 | 退回 |
| B4-R2 | HTTP及stream access_log第5步 | 已有timer设置、flush_handler内部调用和flush实现，但缺该event的handler赋值，不能直接证明timer触发所述函数。固定HTTP log模块1519、stream log模块1248是实际绑定。 | 追加含event->handler/data/log赋值的最小固定来源并在第5步绑定，旧证据不改。 | 退回 |
| B4-R3 | HTTP及stream access_log第3步 | 正文“分配失败返回NGX_ERROR，取消已有flush timer”容易错误表达顺序；源码HTTP355–364/stream303–312是先取消timer，再分配，失败直接return。 | 写明先取消已有timer，再分配；无需改旧来源。 | 退回 |
| B5-R1 | 三项error_log第2步 | 泛称debug宏按类别位过滤，却未说明NGX_DEBUG；当前81–137引用只看到guard开头，未含!NGX_DEBUG空宏。固定log.h:213–225把debug0…8编译为空。 | 限定已启用debug编译的宏路径，并直接绑定相应guard/空宏；若描述无variadic实现须另取实际函数，不泛化。 | 退回 |
| B5-R2 | 三项error_log第5步 | 将Unix stat/chown/chmod统述为重开过程，漏user != NGX_CONF_UNSET_UINT条件；master传ccf->user、worker传-1，普通worker跳过这组权限检查。已有cycle.c:1210–1261和process_cycle.c:257/746可直接证明。 | 正文注明user条件及worker跳过，chown/chmod还有所有者/权限不满足条件；CLOEXEC独立于user门控。无需新增源码。 | 退回 |

B4已核：HTTP与stream日志结束数组实际调用均不使用handler返回值；默认缺变量为横线、json/none缺变量为空；buffer首次flush timer、短写/ENOSPC、59秒错误节流、flush失败仍重置缓冲均有源码。HTTP非ASCII补丁绑定默认转义长度及输出；stream没有该补丁。HTTP/stream log_format两项当前未发现必须退回的正文错误，但未据此签署整个B4通过。

B5已核：选择宏复制file/next/writer/wdata并保护debug_connection；HTTP主请求location及limit_except切换、stream默认ctx及INFO/ctx失败边界符合源码；intercept换行前且防重入、4096条件宏、写链ENOSPC、stderr条件、重开失败保旧fd及close失败仍替换符合原文。公共logger两个直接补丁影响保持affected；没有为scope外writer或Windows内部做完成承诺。

T1—T5代码复核：已读四组件revision/version/repository固定常量、revision入缓存键、空approvedPatchChanges及patch其他键保护、实际sources唯一性、stableHash及其变异检查。T1/T3/T4/T5保护代码成立；T1新增extra反例仍先受actual与curated不等拦截，建议再验证两者同步变异以单独证明白名单。T2错绑方向成立，但主新发现旧source同区间并不一定属于runtime；anchorIds必须限定runtime.source_ids，防止附录本身造成结构失败。最终按修后代码和实测复核，未预签测试通过。

补丁完整目标头已重新从固定Git读取：34项、142 hunk、68个+++头（b/55、nginx-1.27.1-patched/13），剥时间戳及首路径段后44个不同补丁目标。44不同于历史回放47文件：后者另含原本不变的审核目标，不能据此误报漏补丁。本轮未运行补丁回放。

语义fixture现25身份58锚点，新增B3的12条全部再次git show核实。limit第2步selector使用“红黑树|CRC32|非空且不超长”，有意不单用“共享”：第5步也有“共享锁/共享区”，宽匹配会让409错绑其他步骤仍通过。新增proxy3131/3349/1588/4164按对应步骤匹配。

B3-R1修订已见两项第2/3步补足所需引用，R3公式已明确括号；proxy新增R2/R4片段已落盘，等待本轮逐片段复核及同组摘要确认后关闭全部B3。主中间构建e1d693/33deep只用于集成检查，不是最终发布签署；最终仍待全部身份冻结及主统一构建/测试/页面。

## B3修订复核与VTS四项内容签署

B3-R1—R4内容问题关闭。已重新读取proxy新增固定片段：upstream.c:3117–3132含非缓冲正常return；3340–3353含input_filter失败、buffered handler赋值及实际调用；1581–1593含read事件绑定；4135–4164含NGX_THREADS/writing提前返回及peer.connection外层门控。各片段直接绑定相应步骤，额度公式已改为rate*(now-start_sec+1)-read_length。新增范围未与现有34补丁的实际修改分支相交，不改变原限定patch状态。

B3修订对象SHA：limit_conn_zone=`bd0d92952ef190e05db799533c5c4b8af221579865e7106c48d7090c3215e45a`；limit_conn=`90c5c9045793ff53a0322c2355b62bfda2b247ec1bd1899126970c0d208ac770`；proxy_limit_rate=`2f16a55417e14a297ae6c5b1a8592bf8c15c10f5c3b1622dc801c23c3786b36c`。限于候选内容及已核字段保护通过，最终发布仍待统一验收。

VTS已完整读取主单独EVIDENCE、四项21步及其全部实际引用的固定Git片段和独立README，未发现当前限定范围内必须退回的内容问题。四项候选内容通过：

| 身份后缀 | 步数 | 对象SHA-256(JSON.stringify) | 限定审核结论 |
| --- | ---: | --- | --- |
| vhost_traffic_status_filter_by_host | 4 | 6c7f307ff24e7b894b5969b72a7834a65aecbabf6ccbd463a9721e9bc3e880cb | LOG实际调用、enable/bypass/NULL门控、Host三条件及fallback、共享分配失败、ignore_status与字段计数闭合。 |
| vhost_traffic_status_zone | 5 | 5db068d984203fc3a08dc0d0f0a2f047d887834ccfb1e1272603e8c086b9b4cd | 上述server计数到JSON serverZones读取闭合；锁、状态数组分配失败回收、server无filter LRU及容量不足跳过节点均有直接证据。 |
| vhost_traffic_status_display | 6 | 5e484042c0b19c45ddfa3587ef8f7a61b5d93d8ca6095ffbff55a4827fdbb1ea | handler绑定与Nginx实际调用、501/405、普通分派、HEAD/正文丢弃/分配失败、HTML及输出返回边界闭合。 |
| vhost_traffic_status_display_format | 6 | c1426aa0d60c7a05faa41d54f91788a0b21ca1998f0ae567c16bda99fd648178 | URI前缀识别覆盖配置、未识别fallback、格式类型/数据分派与HTML壳区别均正确；不扩称全API/全字段。 |

关键独立核查：node_init/node_set都调用node_update；last_seen在ignore_status之前；server调用state=NULL，字节实际来自request_length及connection.sent。JSON buffer_check失败返回原buf，不能以200推断节点全量；HEAD按send_header返回/header_only提前退出。HTML的URI转义/容量失败返回500，前端再请求JSON由独立README支持。没有把配置handler安装本身当运行证据。

34补丁对VTS新增Nginx片段的独立核查与主结论相符：request.c两个LOG片段不在补丁目标，core_module.c两个content片段仅与no_error_pages同文件而不交修改分支。VTS本体不在34目标内。保持not_applicable但保留公共调用内部未展开边界，不把logger/header filter内部当已审代码。

中间发布`1.27.1.1-e1d69351c54d434f`仅作数据抽验：四项94条实际source逐条检查固定revision、原Git code、URL行范围及ID唯一；所有旧完整source对象、来源顺序（末项module-build）、runtime/curated一致、步骤并集与patch覆盖通过。四项旧evidence前缀与stableHash通过，limitations等于06a639完整facts，发布其他旧字段保护通过。该次检查不替代最终发布全部来源元数据/1016项非目标/测试/页面的最终签署。

语义fixture对stream access_log的wordingPatterns仅新增“无logs”同义词；源码锚点仍为stream log:218的off || logs==NULL，其他约束不放宽。此前14项27/28是主中间结果，审核未运行该测试，修后结果由主重测。B4-R1已经正式要求各access_log删除跨模块旁述，不重复另开相同问题。

当前内容状态：B3三项和VTS四项限定内容通过；B4/B5五个退回项待修复；B7—B11尚未收到本审核的逐项结论。所有组最终发布、自动测试与网页/私有样例验收仍待主统一交付。

## B4/B5修订关闭、B7首次审核

B4-R1/R2/R3与B5-R1/R2内容问题全部关闭：两access_log已删除跨模块转义旁述，明确先取消timer再分配；第5步分别新增HTTP log:1512–1524与stream log:1241–1253，独立git show已核event data/handler/log/cancelable及flush条件。三error_log第2步明确NGX_DEBUG和variadic范围并直接引用log.h:213–225空宏；第5步明确Unix user门控、master/worker传参差异、chown/chmod实际触发条件及CLOEXEC独立性。新增片段不交HTTP转义补丁实际hunk，既有状态不变。B4/B5七项限定内容通过，最终发布保护和测试仍待统一构建。

测试T1同步变异复核：现有checkPatch独立校验status精确白名单、除note/source_ids/status外的完整旧对象、旧引用前缀及唯一性；直接对curated.patch_status变异status和extra调用该函数，不再受actual!=curated提前拦截。T1代码层问题关闭，保留最终实测待核。

B7 pid已逐步读六步及全部固定源码/独立docs，首次写入的process门控、测试配置不写PID、truncate/open失败、pwrite/write的EINTR/短写、close失败不改rc、reload路径变化及不可回滚所有副作用、热升级rename/执行失败恢复、master退出删除语义均符合所引范围。single退出明确排除，没有把补丁改变的single路径写成原版行为。

| 编号 | 身份/步骤 | 证据缺口 | 最小修订 | 状态 |
| --- | --- | --- | --- | --- |
| B7-R1 | nginx--ngx_core_module--pid第5步 | “已退出进程”条件不在本步617–636或167–175来源内。真实exited门控在process_cycle.c:563，另有559无效pid跳过与593–614 respawn分支提前continue；只有pid==new_binary不足以证明进入该文件恢复动作。 | 追加固定559–564及593–615小片段到本步，明确到达new_binary分支前未走respawn continue，或补充new_binary实际detached/non-respawn创建证据闭合排除关系。仅补本步，不展开完整收割hook。 | 退回 |

B7其余内容未发现实质错误；34补丁需在上述新增范围补入后最终确认。pid暂不签署通过，不因共有六步或原状态unaffected跳过外层条件。

## B7关闭及B8/B9稳定五项首次审核

B7-R1关闭：第5步新增process_cycle.c:559–564、593–615，直接核到无效pid跳过、exited以及respawn成功/失败均continue；正文明确未进入该continue才到new_binary恢复。两处新增不交privileged_agent、proc_exit_handler等实际改动分支；pid限定内容通过，当前对象SHA为`8db310ff9718c5692c8f0cfebe8645e2db011114024cf53b6effb513b7bb1942`。

B8/B9已逐项读取稳定runtime及固定源码/独立文档，以下退回需修正后复核；不能用总来源齐全代替步骤条件。

| 编号 | 身份/步骤 | 真实源码与问题 | 最小修订 | 状态 |
| --- | --- | --- | --- | --- |
| B8-R1 | HTTP及stream listen第2步 | connection.c:518–563新socket设置reuseport还要求ls.reuseport且!ngx_test_config；正文“有能力的reuseport”容易扩大为只要编译支持即设置。旧fd add_reuseport失败仅忽略，与新socket失败ERROR不同。 | 明确编译能力+本监听开启+非测试配置三条件，并维持新socket限定，勿将旧fd迁移分支纳入同一错误结论。已有来源足够。 | 退回 |
| B8-R2 | HTTP及stream listen第3步 | 当前事件注册证据到event.c:915，只覆盖reuseport add_event；普通非reuseport到917–943的accept_mutex门控、EPOLLEXCLUSIVE/普通add_event均未绑定，直接跳到epoll消费。 | 追加普通注册分支及失败出口到本步；accept_mutex若不展开需明确该分支延后启用，若声称完整消费则绑定实际启用调用。平台#else建议同时补856的外层定位。 | 退回 |
| B8-R3 | HTTP server第3步 | “不存在或均未匹配DECLINED维持现有配置”未限定无SNI；同对象第5步及request.c:2283–2288说明已有SNI且名称不匹配时改选默认server，之后verify还可能421。 | 第3步将维持现有配置明确限于不进入SNI差异处理的分支，直接绑定必要外层条件或明确该例外转第5步描述，避免两个步骤相互矛盾。 | 退回 |
| B8-R4 | HTTP server第4步 | 已引用request.c:988–1006，却漏done后的sscf->reject_handshake判断；无/空/非法/未匹配SNI到done不等于允许握手，992–995仍可能UNRECOGNIZED_NAME fatal。 | 补述done从当前选定配置检查reject_handshake，非零设置handshake_rejected并fatal，否则OK。不扩完整TLS握手。已有来源足够。 | 退回 |
| B8-R5 | HTTP location第3步 | “最深已选noregex”不准确。core.c:1402/1405为每次调用局部变量；1417在本层静态匹配AGAIN后、1422递归前保存；1433检查本层pclcf regex数组。递归返回不会把最深noregex传播给外层。 | 改成每层独立保存本层静态前缀的noregex（初始0），嵌套未OK/DONE时按本层值决定本层正则；不能将嵌套^~解释为全局禁止外层正则。已有implementation-0足够。 | 退回 |

HTTP listen第6步已核默认wait_request设置后，SSL地址可于request.c:328–333覆盖成ssl_handshake；本次范围排除完整握手，最终文字宜明确初始handler而非保证所有TCP永远使用wait_request，不要求展开握手链。

stream server五步当前限定内容通过：默认地址→session main/srv_conf和virtual_names→ctx/variables失败关闭→无PROXY的direct/posted消费→阶段checker→content handler→非TLS关闭。已读stream.c:354–386阶段安装与core_module.c:169–227/441–471真实消费，未套HTTP路由。SOCK_STREAM的tcp_nodelay调用须以配置为真为前提，现有完整源码含此条件，范围未声称强制启用。对象SHA=`40e09ff4cefbc97fef997fc8a807a7c597a56897b61dee133f5f22e425a2c22e`。

五项加pid只读保护检查：旧evidence前缀、stableHash、limitations完整facts、patch旧引用前缀及runtime首次出现并集/patch覆盖均通过。当前HTTP listen SHA=`b1f51ddb43be1c11cf0d1d975d107ea4c3e7873b4d2d160e54e4fe68f00bc46d`；HTTP server=`3c5787134c5d214ec11662a38ee0b59578b788ee5af023e2fc48bb66d49a23be`；location=`c0d4def148acaccbc890c7ebbc0a42918d03de667095eb57a85fca122cb060ba`；stream listen=`05d3b93bd7e99a27948cdf2f1a3bae0cf9129a8e2a8b485f4bde9e8ffffd9e78`。

两listen的unaffected→affected有实际新消费证据：event.c:807–811结合reuseport_close_unused_fds:17–38，accept.c:38–218结合socket_cloexec:82–113；与B2已核条件一致。此两项迁移的源码依据认可，主专项approvedPatchChanges须精确只加入这两个身份，不能整体放行；正文R项仍须修复。stream posted仅引用event.c:263原普通队列调用，不扩delayed_posted新增队列；HTTP路由同文件no_error_pages配置hunk不直接改当前查找/SNI片段。

内容累计：B3—B5十项、VTS四项、pid、stream server共16项限定内容通过；B8/B9其余四项有上述5条待修；B10/B11五项待稳定审核。全部最终发布与页面仍未签署。

## B8退回条件的语义回归锚点

按主要求在final25-semantic.json新增14个检查，25身份合计72个锚点；全部锚点的实际行及codePattern已用固定Git对象重新核验，正则合法、身份顺序不变。新增覆盖两listen的NGX_HAVE_REUSEPORT、reuseport且非测试配置、accept_mutex门控与普通add_event失败；HTTP server的SNI例外外层、reject_handshake与fatal返回；location每次调用noregex初始化、递归前保存以及本层正则判断。stepPattern限定相关消费步骤，wordingPatterns约束真实条件；后续仅允许等价措辞校准，不移动或弱化源码锚点。

这批fixture用于锁定B8-R1至R5的实际退回语义，不代表候选已修复或测试已经通过。审核未运行build，也未修改主测试或知识内容；B10/B11仍待EVIDENCE稳定交接。

## B8修订关闭与B10/B11候选内容结论

B8-R1至R5全部关闭。两listen第2步已明确编译能力、监听reuseport、非测试配置三条件；第3步新增event.c:856及917–943，明确accept_mutex延后启用、EPOLLEXCLUSIVE条件与普通注册失败。HTTP listen第6步也已限定初始handler及SSL覆盖。HTTP server第3步直接绑定2281–2325的SNI例外，第4步补齐992–995拒绝握手；location第3步正确描述每次调用局部noregex初始化、递归前保存及本层数组判断。上述固定Git片段已独立重读，四身份限定内容通过。

最后五项全部逐步读取runtime直接来源及固定独立文档，共23步；不是只核来源存在或fixture匹配。

| 身份 | 内容结论 | 独立核查重点 |
| --- | --- | --- |
| client_max_body_size（4步） | B10-R1退回，其他所列消费范围认可 | 声明长度四条件、discard返回忽略与413；proxy实际读调用及content finalize；chunk累计差值判断、lingering标志、同步/异步错误回传；不扩HTTP/2/3 |
| keepalive_timeout（6步） | 限定内容通过 | 协议初值及有效配置再关闭条件；finalize非terminate/exiting门控；pipeline提前return不设idle timer；timer到期实际handler、AGAIN/EOF/ERROR、下一请求；第二参数仅响应头提示 |
| sendfile（5步） | 限定内容通过 | Linux能力表/epoll/accepted send_chain到实际系统调用；copy ctx实际消费、directio及内存限制；非TLS、无AIO/thread范围；EINTR/EAGAIN/0/短写与CHAIN_ERROR回传 |
| default_type（3步） | 限定内容通过 | static实际调用与500回传；已有类型不覆盖；大写扩展名分配失败；types_hash命中优先、无命中直接fallback |
| server_tokens（5步） | 限定内容通过 | HTTP/1主请求header入口/早退与分配失败；自动Server缺失条件、off仍有品牌、build宏；自定义hash条件；error_pages分流、空正文/HEAD/分配失败及output返回；三个补丁分工 |

| 编号 | 身份/步骤 | 实际源码与最小修订 | 状态 |
| --- | --- | --- | --- |
| B10-R1 | client_max_body_size第3步 | 当前“初次chunked状态分配失败500并把content_length_n归0”把失败和成功后的赋值连在一起。固定request_body.c:1108–1111分配失败立即return500，1115归零仅在成功之后。改为“初次状态分配失败立即返回500；分配成功后才把content_length_n归0”，保留现有直接来源即可。无需扩链或改其他步骤。 | 待修复复核 |

34补丁全量重新按+++剥首目录/时间戳扫描，对最后五项所选文件的全部增删分支独立核对：server_header、builtin_error_page_footer、no_error_pages直接影响server_tokens所述消费，已正确列明；proxy_host_port_vars只改变量注册不改读body调用；SSL三yield不改成功后的send_chain赋值；socket_cloexec不改accept.c:206–214的IO函数关联及event.h:414–422宏；no_error_pages不改body/keepalive/sendfile/default_type所选消费。其余补丁无所选文件交集，不据此声称完整请求链无影响。未重新应用补丁或运行build。

本轮九身份旧evidence前缀hash及stableHash全部通过，步骤首次出现并集与patch来源覆盖通过。目标fixture只读检查发现server_tokens第2步“自动Server头缺失”与NULL同义，已只为该wordingPattern补入“缺失”，455行源码锚点不变。未运行最终主测试或提前签署发布。

本轮通过对象SHA256（JSON.stringify）：stream listen `ee9ced4ac9609c1279cbcc68b7ae70caa258362085011aa3da8d2fdc909f738d`；HTTP listen `38c7c83d3fa8e1d5dcfa21d39236b65131b987cc640009a654bcd3ab9bbc164b`；HTTP server `579e3b0a6404fdcbac1a0057044ba8e833ac1377e6c669ada494120b3cb33bd3`；location `5aaef00dfcb384f50872917826bcd982875d4cf54621284416390da75dda23ab`；keepalive_timeout `aa0ca3184008e40e8800f586835569635840e9a830f4cc442a7524fde8b54336`；sendfile `e6c50343c7a62e48ec07f6221d750f80c23bea434b1eb81bb4bed554e09b9b2c`；default_type `0f7e6ece68fab042ab0096756ed51edc8bd8e586635753b721175bda814198fd`；server_tokens `8bef030238b93e43e6f4f17baf38324a486f6783c7fd648366961543d18ebc94`。client_max_body_size待修对象为`53fadd67508529a776d324f069e57eac37fba7a1e6b1c9f4fa12d92706587ce4`。

候选内容累计24/25限定通过，剩B10-R1一句失败顺序修正；不能写25/25通过。最终发布来源/字段保护、主测试及负例、统一build、私有样例内存回放和25页面证据仍待主交付后独立签署。

## 主构建发现的server_tokens契约问题

主报告server_tokens单项validateRuntime失败，审核已独立读取src/query/knowledge.mjs:23起的实现确认：runtime.source_ids全部必须为c/h/patch且不属于纯配置来源；version-substitution的util/mirror-tarballs不符合。上轮源内容结论遗漏此契约，不作为该项可发布通过依据，现重新标记待修复复核（B11-R1）。不修改或放宽校验器。

最小修订认可：步骤2/5及runtime并集移除version-substitution，完整evidence、旧patch引用和原版本事实保留。步骤2正文也应将“发行脚本minor=1替换unknown，故on为openresty/1.27.1.1”的发行处理解释留在原版本事实/patch说明，不再作为本步直接源码证明；本步只写实际消费NGINX_VER/NGINX_VER_BUILD、补丁品牌和off分支。步骤5保留品牌宏及短尾补丁的实际消费即可。不要把脚本塞进corroboration（同样不满足独立文档后缀契约）。

本次读取时两处脚本runtime引用及B10-R1原句仍在，尚未收到实际修订结果。因此当前可签候选内容为23/25，待B10-R1和B11-R1关闭；最终发布签署仍待主统一证据。

## 最后两条修订复核关闭：候选内容25/25

B10-R1关闭：实际第3步已分开写“分配失败立即返回500；分配成功后才把content_length_n归0”，再次git show核对固定request_body.c:1108–1115吻合。对象SHA256为`e9389dbcf3904186e04e1de5d3fcea0f3978794c2e9911679830587f39ddcc0a`。

B11-R1关闭：server_tokens步骤2/5及runtime并集已移除version-substitution；正文仅描述宏及品牌patch运行消费，把发行版本解释明确留在原事实。原evidence中的脚本描述及patch.source_ids中的原引用仍保留，corroboration仍仅official-doc，没有绕过来源契约。对象SHA256为`fdff998f93db7a1662ea35280c7d72a6b733548ef264267737fd8cfbd134573b`。

两项旧evidence前缀hash、stableHash、步骤首次出现来源并集、runtime代码后缀及patch覆盖只读检查全部通过。没有修改产品标准或知识内容。

候选源内容现25/25在各自限定范围内审核通过，所有已报R项关闭。此结论不等于最终发布验收：待主统一构建/测试及语义负例、实际发布来源与字段保护、私有样例回放和25页面证据后，再签最终发布。

## HTTP access_log配置来源契约修订建议

主第二次构建定位runtime-http-flush-event-install（log_module.c:1512–1524）完全落在configuration-definition内；此前B4-R2要求将安装证据直接放入runtime，虽补齐绑定事实但未兼顾纯配置来源排除契约，此处撤回该直接引用要求，重新打开HTTP access_log一项待修，不放宽产品标准。

独立git show重读719–769及1512–1524后，最小修订为：保留安装片段的完整evidence与patch引用；从第5步source_ids及runtime.source_ids移除runtime-http-flush-event-install；第5步条件改为“已安装的flush回调被调用时（限定非gzip普通文件路径）”，不再声称本步证明timer触发或配置安装。保留runtime-http-buffer-flush直接来源，763–768证明callback调用flush，725–740证明空buffer返回及普通write，743–757证明失败/短写只记ALERT、之后仍重置buffer并按timer_set删除timer。原action可保持，不必改任何旧mechanism字段，无需新增字段白名单，也不扩行逃过检测。

该最小方案是收窄本步入口声明，不是删除实际运行消费：callback→flush→write及失败出口仍直接闭合。收到实际修订后关闭此项；此前25/25结论在该契约项修复前暂为24/25候选可签，最终发布仍待验收。

## 第三次构建前候选冻结复核

HTTP access_log修订关闭：第5步实际条件已收窄为“已安装的flush回调被调用时（限定非gzip普通文件路径）”，正文明确不证明安装或timer触发；只直接引用719–769的callback→flush→write，含空buffer、失败/短写、重置及event存在且timer_set的删除条件。runtime引用由13降为12，runtime-http-flush-event-install完整evidence和patch引用仍在。对象SHA256=`399a33f88268885972911446c8ac4e8b4b01f0fdb08309b8136e96caf0915add`。

B10-R1和B11-R1再次核对未回退，body与tokens对象分别仍为`e9389dbcf3904186e04e1de5d3fcea0f3978794c2e9911679830587f39ddcc0a`、`fdff998f93db7a1662ea35280c7d72a6b733548ef264267737fd8cfbd134573b`。最后三处全部关闭。

本轮只读对25身份重新检查旧evidence前缀hash、stableHash、步骤首次出现来源并集、runtime代码后缀及patch引用覆盖，全部通过。按test/fixtures/final25-baseline.json的targets顺序，对每个当前curated完整对象JSON.stringify计算sha256，组成键顺序为{id,sha256}的数组，再对该数组JSON.stringify计算SHA256，冻结摘要为`d7565fced05fc2008d46dc41aad1e597ba75b69b1c03e559ea326974f9476c43`。后续来源内容变化需重新复核，不将此摘要冒充发布文件摘要。

冻结结论：25/25候选源内容在各自已声明范围内通过，已报问题全部关闭；未改产品标准、知识内容或dist。第三次build、完整validateRuntime/专项测试及负例、实际发布字段/来源保护、样例回放和页面验收均待主交付，当前不作最终发布签署。

## 当前发布数据独立复核：1.27.1.1-1c2ead24459672e6

已直接读取dist/knowledge/index.json及对应release索引，两者相等，当前入口以index.json为准（不存在current.json）。覆盖数独立核得1041/44，其中bundled1017/40、department_extension24/4；deep身份恰为历史19项加本轮25项。

本轮以独立只读脚本检查实际发布数据，未调用主测试替代审核：25身份126步、651条实际source逐条核对四组件固定revision/version/repository、完整URL及行范围、kind与原Git code；共读取74个固定Git文件。实际source先验ID唯一，旧完整source逐对象不变，旧来源顺序及末尾distribution-version/module-build保留，新增来源按curated顺序。25项runtime与patch_status均等于curated，validateRuntime与validateDetail实际全部通过。

字段保护：旧evidence前缀hash、stableHash通过；发布对象仅规范化获准变化字段后与基线完整相等（limitations等旧事实未变）；patch其余键完整保护、原引用前缀及唯一性通过，仅HTTP/stream listen状态按精确白名单迁移。1016个非目标详情除release_id外逐对象等于历史发布，非目标curated摘要也未变。25项候选冻结摘要仍为`d7565fced05fc2008d46dc41aad1e597ba75b69b1c03e559ea326974f9476c43`，最后三处修订无回退。

已读取analysis/sample-final25-runtime-focused.log，记录89 tests、89 pass、0 fail/cancelled/skipped/todo。重读final25-runtime.test.mjs确认53项组成、四组件常量、独立checkPatch同步漂移负例、old stableHash及完整发布字段保护、实际source唯一性与代码核对；语义错绑anchorIds限定runtime.source_ids，移至独立附录且保留总来源后先验证结构合法、再断言语义失败，文字变异也先验证结构合法。此为主定向测试日志与测试实现的审核，不冒称审核者重新运行89项。

当前可签：冻结候选及本release来源/字段保护通过。仍等待主全量npm test、原样例内存回放与25项真实页面证据；尚不签最终整体交付。

## 最终独立审核签署

签署日期：2026-10-14。结论：通过。本签署针对固定25项、其已声明运行范围及发布`1.27.1.1-1c2ead24459672e6`，不是现场OpenResty运行有效性或全部分支覆盖保证。历史19项加本轮25项为44 deep；1041项总量及bundled1017/40、extension24/4已独立核对。所有已报R项关闭，不修改产品标准、不读取私有配置、不冒称本轮重新应用补丁或编译OpenResty。

### 审核者直接实查

- 逐项固定源码、独立文档、34补丁对所选范围的影响及失败出口；冻结25项126步，发布651条实际source及74个固定Git文件的完整代码/元数据校验，旧字段和1016非目标保护，详见前述记录。
- 直接读取定向日志89/89、全量analysis/sample-final25-runtime-tests.log的247/247，均fail/cancelled/skipped/todo为0；审过主测试实现及结构合法但语义错误的两类负例。日志由主执行产生，审核者没有重跑这些套件。
- 实际计算knowledge文件SHA256：directives.json=`aa4cec0555f452638815b155ea0b625f626ae5cd7cac61fb80ba70531ddaeb14`；extensions.json=`e0e7f95436f03d97242d7907f34a749e5aa9e2fe9c48a65d70745f877a111942`，与主最终报告一致。
- 直接查看analysis/sample-final25-runtime-browser.png：截图可见VTS运行链、范围及RUNTIME_SCOPE_NOTE。该单张截图只佐证所显示区域，不能独自证明全部25页、651来源或样例回放。

### 主线程执行记录的验收采信

以下依据主线程最终明确交接，非审核者亲自操作浏览器或读取私有样例：原样例A第3–73行24/24、errors0、external2；B全文258/258、errors0、external1；union50=44deep+6config，默认/继承unverified0。原样例仅由主内存回放，审核者未读取或复制。

主复用已有Codex tab1并重载最终release，A/B网页汇总与回放一致，目录23/40；25身份真实点击后按字段核对标题/模块/deep、scope及RUNTIME_SCOPE_NOTE、126步condition/action、全部步骤与独立文档链接、651完整source code/url及页脚release全部通过。首次比较失败由传输对象keys排序造成，改用逐字段数组比较后通过，没有修改网站。审核者未亲自执行这些UI操作；采信主执行记录，并以已独立核实的相同release和知识摘要关联本签署。

读取时SAMPLE_FINAL25_RUNTIME_VERIFICATION.md仍是主正在更新的中间记录，不能把其中“进行中”或旧待修状态当最终结果。本签署明确以当前发布实查、实际日志及主本次最终交接为准；主应将同一最终结果补全至该验收文件，避免中间状态与最终交付混淆。

最终边界：已完成本轮25项限定源码内容及发布交付审核；不扩大为所有API/平台/字段、现场模块安装与兼容性、外部文件有效性或真实请求已成功。以上保留边界不是本轮待办项。

## 最终验收文件复核与签署确认

2026-10-14已完整读取主最终SAMPLE_FINAL25_RUNTIME_VERIFICATION.md。其最终发布、89/247日志结果、两份样例汇总、UI执行方式、前两次构建门禁及最小修订、知识文件摘要和现场边界，与本审核记录及主最终交接一致。中间段的46/58锚点和待修状态属于历史过程，最终段已明确72锚点及全部关闭，不覆盖最终结论；上节“验收文件仍在更新”的提醒现已关闭。

另以实际release详情逐行校验最终表的25个精确身份、步数/完整来源数/独立文档数及补丁状态，全部一致，合计126步、651来源；两listen状态迁移及VTS归属没有被扩写为全链影响判断。实际fixture文件SHA256为`16905038b975d469a8f58ed6c665cd88bf5517dadac56802e3b66140d0e00517`，与验收文件一致。

最终签署：通过，固定25项交付闭合，release=`1.27.1.1-1c2ead24459672e6`。无待修内容或记录阻塞项。本轮只更新REVIEW，未修改知识、测试、网站、产品标准或冻结发布数据。证据归属保持不变：审核者独立实查源码/发布/日志与记录，样例内存回放和25项浏览器操作由主执行；未冒称审核者亲自操作浏览器。既定现场边界继续保留。
