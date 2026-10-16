# 样例剩余运行时范围与分批实施计划

日期：2026-10-13；最终进度更新2026-10-14。状态：本固定清单实施及主验收完成，最终独立签署见SAMPLE_FINAL25_RUNTIME_REVIEW。以下保留原始规划。固定起点为 `1.27.1.1-c49915e4ed7a7e58`，1041 basic（包含 deep）、9 deep；bundled 1017/9，department_extension 24/0。依据 WEBSITE_REMAINING_PLAN、SAMPLE_HTTP_TIMEOUT_RUNTIME_PLAN/VERIFICATION、DEPARTMENT_SAMPLE_INTAKE 及此前 runtime 契约；早期文档的0 deep、样例缺匹配和待接收状态均为历史快照，不再作为当前缺口。

## 深度交互：真正目标与完成口径

当前进度（2026-10-14，`1.27.1.1-1c2ead24459672e6`）：B1、B2既有19项限定runtime保持，B3—B11固定剩余25项已补齐。样例累计44项限定runtime、6项配置边界，固定待办0；C1六项保持basic而非强行升级。最终89项定向/247项全量测试通过，两份原样例24/24与258/258匹配、解析错误0，25项页面126步及651条源码展示与同发布数据一致。下表为原始41项规划，完成凭证为 `SAMPLE_FINAL25_RUNTIME_VERIFICATION.md` 与 `SAMPLE_FINAL25_RUNTIME_REVIEW.md`；B1/B2历史凭证仍分别保留。完成范围不含现场运行、外部include、模块安装或Codex真实接入。

目标是解释两份样例在锁定版本中的实际作用、生命周期和边界，而不是把50个身份都升为deep。主线程本轮只读统计：A第3—73行主配置24项，B完整配置258项，共50个去重身份；其中9个已有经审核的限定范围runtime，41个尚未deep。频次按出现次数，HTTP/stream同名身份分别计数。本规划仅接收精确身份及次数，不读取私有配置或include文件。

请求、连接/stream会话、worker/master进程与cycle生命周期都可以有真实运行消费点；进程启动、reload或退出不能误写成请求阶段。反过来，配置块建立上下文、注册handler、编译表达式、构建hash自身不是请求期执行证据。必须把配置生产与实际消费闭合后，才判断某身份是否适用runtime。

41项分为35项运行消费候选和6项配置解析/组织收口项。候选不预先保证晋级；源码、独立文档或补丁证据不充分时保留basic并明确未决问题。6项按配置边界完成也保持basic，不造runtime，不新增不适用状态枚举。若35项均有充分证据，样例可达到44 deep、6项配置边界完成；这是条件性上限，不是硬性验收目标。已有9项只在原已审范围内完成，不代表其全部功能已研究。

## 直接执行：41项完整剩余清单

下表身份精确对应主线程交付的聚合清单。R表示运行消费候选，C表示配置边界收口。表中问题是实施要求，不是本规划已核实的新源码结论。

| 序号 | 精确身份 | 次数 | 批次/类型 | 最小范围与验收边界 |
| --- | --- | ---: | --- | --- |
| 1 | nginx--ngx_http_rewrite_module--set | 19 | B1/R请求 | server/location rewrite序列执行、表达式求值、索引变量或setter赋值及失败出口；请求变量保留不等于配置继承。 |
| 2 | nginx--ngx_stream_set_module--set | 4 | B1/R会话 | stream阶段入口、复杂值求值、会话变量写入/读取及失败；独立证明执行时机，不照搬HTTP rewrite。 |
| 3 | nginx--ngx_http_proxy_module--proxy_set_header | 20 | B1/R请求 | 求值、空值省略、覆盖/透传与请求头序列化；Host、连接目标和TLS名称分别说明。 |
| 4 | nginx--ngx_http_proxy_module--proxy_http_version | 1 | B1/R请求 | 上游请求行版本选择及直接相关正文编码分支；不等同客户端协议，也不保证连接复用。 |
| 5 | nginx--ngx_http_proxy_module--proxy_ssl_session_reuse | 20 | B1/R上游TLS连接 | HTTPS条件、peer会话恢复/保存回调、握手与清理；开启不保证恢复成功，不等于HTTP keepalive或自动开启SNI。 |
| 6 | nginx--ngx_core_module--worker_processes | 2 | B2/R进程 | 有效数量到worker创建/管理；限定master/single模式、reload代际，不冒称请求并发数。 |
| 7 | nginx--ngx_core_module--worker_cpu_affinity | 1 | B2/R进程 | worker索引到CPU集合及系统调用、平台能力和错误；auto与未配置区分。 |
| 8 | nginx--ngx_core_module--worker_rlimit_nofile | 1 | B2/R进程 | worker初始化条件setrlimit及错误分支；区别系统继承限制和Nginx配置。 |
| 9 | nginx--ngx_event_core_module--worker_connections | 2 | B2/R连接/进程 | cycle连接池分配、连接取得/耗尽/释放；包含客户端和上游，不换算为固定请求容量。 |
| 10 | nginx--ngx_event_core_module--multi_accept | 1 | B2/R事件/连接 | accept事件循环及退出条件、事件后端差异；不声称所有后端行为相同。 |
| 11 | nginx--ngx_http_limit_conn_module--limit_conn_zone | 2 | B3/R共享状态 | key求值到共享区节点计数与清理，空/超长key、分配失败；只有共享区初始化不够晋级。 |
| 12 | nginx--ngx_http_limit_conn_module--limit_conn | 2 | B3/R请求/连接计数 | 阶段检查、并发计数、拒绝/dry-run、请求清理减计数；HTTP多路复用口径按源码限定。 |
| 13 | nginx--ngx_http_proxy_module--proxy_limit_rate | 2 | B3/R上游读取 | 求值到缓冲/event_pipe直接读限速、delayed/timer与恢复；不泛称客户端下行或整请求平均限速。 |
| 14 | nginx--ngx_http_log_module--log_format | 2 | B4/R请求结束 | 已编译操作在日志阶段长度计算、变量求值和转义；仅格式编译不够晋级。 |
| 15 | nginx--ngx_http_log_module--access_log | 22 | B4/R请求结束 | 日志阶段过滤、目标写入、缓冲/刷新及失败；按选定支持范围明确分支。 |
| 16 | nginx--ngx_stream_log_module--log_format | 2 | B4/R会话结束 | 会话日志操作执行、变量与转义，不称HTTP请求日志。 |
| 17 | nginx--ngx_stream_log_module--access_log | 4 | B4/R会话结束 | finalize后的日志阶段、过滤、写入及失败；内部状态不解释为HTTP响应。 |
| 18 | nginx--ngx_errlog_module--error_log | 1 | B5/R进程/错误事件 | cycle日志对象到级别过滤/写入及重新打开；区别启动日志与运行日志。 |
| 19 | nginx--ngx_http_core_module--error_log | 16 | B5/R请求/连接 | 有效日志对象的选择、请求/连接关联与真实输出；不虚构固定请求阶段。 |
| 20 | nginx--ngx_stream_core_module--error_log | 4 | B5/R会话/连接 | stream日志对象选择、错误输出与结束；不得复用HTTP上下文说明。 |
| 21 | nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_zone | 1 | B6/R共享统计 | 区域初始化之外的统计更新、节点和读取，失败/容量边界。 |
| 22 | nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_filter_by_host | 1 | B6/R请求统计 | 有效开关到实际key选择与统计更新；不把分组条件说成访问控制。 |
| 23 | nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_display | 1 | B6/R展示请求 | handler调用、统计读取、输出与错误；安装handler自身不是运行证据。 |
| 24 | nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_display_format | 1 | B6/R展示请求 | 有效格式到真实格式分派/输出及覆盖条件；不扩展全部VTS API。 |
| 25 | nginx--ngx_core_module--pid | 1 | B7/R进程/cycle | PID文件创建、reload/升级相关重命名或删除、退出清理与失败；路径解析本身不够。 |
| 26 | nginx--ngx_http_core_module--listen | 21 | B8/R监听/连接 | 配置地址到socket初始化和accept后地址配置选择；绑定失败与共享监听边界。 |
| 27 | nginx--ngx_http_core_module--server | 21 | B8/R请求路由 | server块本身先按配置对象解释；须证明连接默认配置及请求虚拟主机选择如何消费，才可晋级。 |
| 28 | nginx--ngx_http_core_module--location | 21 | B8/R请求路由 | location查找、配置切换及内部重定向条件；不把嵌套配置merge冒作运行匹配。 |
| 29 | nginx--ngx_stream_core_module--listen | 4 | B9/R监听/会话 | socket/接入路径、地址匹配及会话初始化；TCP/UDP范围明确。 |
| 30 | nginx--ngx_stream_core_module--server | 4 | B9/R会话 | 监听地址关联的server配置到会话阶段运行；不套HTTP Host/location路由。 |
| 31 | nginx--ngx_http_core_module--client_max_body_size | 4 | B10/R请求正文 | 已知长度和实际读正文的相关检查、拒绝/清理；分清声明长度与chunked路径。 |
| 32 | nginx--ngx_http_core_module--keepalive_timeout | 1 | B10/R客户端连接 | 请求结束后的连接保留、定时器、下一请求/关闭；不混为上游keepalive或整请求超时。 |
| 33 | nginx--ngx_http_core_module--sendfile | 1 | B11/R响应输出 | 有效标志到输出链及平台发送分支/回退；开启不保证每次零拷贝。 |
| 34 | nginx--ngx_http_core_module--default_type | 1 | B11/R响应头 | MIME查找未命中后的类型兜底及调用条件；不把配置合并当实际响应生成。 |
| 35 | nginx--ngx_http_core_module--server_tokens | 1 | B11/R响应头/错误页 | Server头和内置错误页消费点；须核OpenResty相关补丁与非内置响应边界。 |
| 36 | nginx--ngx_conf_module--include | 3 | C1/C解析 | 当前上下文下路径/通配及递归解析边界；网站仍标外部内容未分析，不展开文件。 |
| 37 | nginx--ngx_events_module--events | 2 | C1/C容器 | 创建事件配置、模块初始化/校验；worker事件循环属于内部配置消费，不强记给块头。 |
| 38 | nginx--ngx_stream_module--stream | 2 | C1/C容器 | stream上下文创建、初始化/合并；无隐式业务server，不借下属代理消费凑runtime。 |
| 39 | nginx--ngx_http_module--http | 2 | C1/C容器 | HTTP上下文创建及模块初始化/合并；不把所有HTTP处理归为块头runtime。 |
| 40 | nginx--ngx_stream_core_module--variables_hash_bucket_size | 1 | C1/C索引构建 | 配置期hash构建参数与失败边界；运行查找使用hash不等于逐会话消费bucket_size配置值。 |
| 41 | nginx--ngx_http_core_module--variables_hash_bucket_size | 1 | C1/C索引构建 | HTTP变量hash初始化及参数作用；与stream分别取证，不为共享hash查询追加伪runtime。 |

C1可由主线程先用已有事实/证据记录收口结果，后续批次间补齐缺失说明；仅更新分析记录即可满足时不改知识。若旧事实确有错误，另列精确字段变更与依据，不能借runtime白名单顺带改写。配置边界完成须记录固定证据、为何不适用runtime及仍未分析的外部内容，不能仅写“无运行时”。

## B1：当前最小连贯目标

先且仅补第1—5项。连接已有HTTP proxy_pass/resolver/timeout链，解释变量如何形成目标与Host、如何生成上游请求版本以及HTTPS会话复用；stream set独立闭合到已完成的stream动态目标消费。禁止连带升级proxy_ssl_name、proxy_ssl_server_name、proxy_ssl_verify、proxy_next_upstream或resolver_timeout。

复用已存在证据，从固定对象检查必要入口：HTTP `ngx_http_rewrite_handler`、script赋值代码、`ngx_http_proxy_create_request`、proxy变量处理、upstream TLS握手及peer会话回调；stream set模块的阶段注册、实际handler和复杂值/变量消费。函数名与具体分支由实施核实，候选入口不算证据。必须闭合求值/分配失败、空头省略、非TLS跳过、会话不可用/恢复失败/保存条件；不预设每条链都有同一错误码，不强制步骤数。

每个step直接绑定支持其条件、动作和出口的代码；失败回调只放在总sources或其他step中不算闭合。Host值、连接目标、TLS SNI/校验名称是不同消费对象，说明它们的来源与控制条件，但不扩完整TLS教程或生产兼容承诺。

B1全部通过时精确预期1041 basic/14 deep，bundled 1017/14、扩展24/0；deep身份集合必须是固定c499的9项加这5项。证据不足的身份保留basic，批次记录未决，不降低晋级标准凑14。

## 后续顺序与主线程自主推进

按B1→B2（5项容量/worker）→B3（3项流控）→B4（4项访问日志）→B5（3项错误日志）→B6（4项VTS）→B7（1项PID）→B8（3项HTTP路由）→B9（2项stream接入）→B10（2项正文/连接）→B11（3项输出）推进。C1的6项并行做只读分类、串行落盘，避免与知识写入冲突。共35个运行候选、6个配置项，无重复或漏项。

每批开始冻结上一批已审发布及curated旧证据摘要，记录精确身份、生命周期、最小源码链、字段白名单和预期deep集合。主线程可按此清单连续推进，不需要每批重复请求用户确认；若某项研究超出小批范围，可拆分并保留未决项，不能隐去或宣布全清。不得把当前发布指针当历史基线，跨批累计还须与c499核对原9项及所有未授权内容。

角色已确认：Astra low规划、Sol high实施、Astra low审核；主线程流控与验收。本规划不创建新聊天。实施提交范围/证据/补丁记录，审核逐条对照落盘计划，遗漏退回实施，修复后复核；主线程统一测试、构建和样例/网页验收。不得并行修改同一知识文件、测试或dist。

## 固定来源、34补丁与字段保护

沿用现有契约：nginx `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`；OpenResty `8c37412c31621225e7aa7e825b5b50106c9c71c4`；nginx-docs `e8b581903e9d41252720053311cea687a5671674`；VTS `52fe11e44c47a49b052be89e36dfa17d81bf52a5`。其他必要组件先从既有components/扩展锁定记录冻结revision。只用本地固定Git对象逐字取证，不以工作树行号、最新在线文档或现场版本推测替代。

每批复核 `analysis/NGINX_PATCH_AUDIT.json` 的34项完整集合、顺序、revision与发行脚本映射，对所有新增消费片段逐项判定交集，再详读相关hunk。不能仅查候选补丁名。记录原始源码与补丁各自坐标，复用历史回放须标明历史。B1特别关注变量、上游请求与TLS/peer相关交集，但不预设哪些补丁必定影响。VTS保持独立扩展补丁边界，不能用其not_applicable替代nginx补丁核查。

内容白名单：当批精确身份新增runtime、追加必要evidence，保留全部旧ID、顺序、正文与元数据；patch_status仅追加必要source_ids及范围说明note。原status默认不变；只有新增消费点证明原范围之外存在实际补丁影响，才允许从已核不受影响改为verified_affected，并逐项记录“旧状态→新状态、旧核查范围、新消费位置、具体补丁hunk、行为影响及证据ID”。原本affected不得无依据降级；B1逐项读取c499状态，不能照抄上批四项均affected的前提。

不改summary、syntax、mechanism、默认/继承、phase、related、注册、配置入口或其他旧字段。旧式limitations字符串如被新增evidence自动扩张引用，仅允许固化为当批固定基线的完整facts对象，所有正文、状态、引用顺序和额外键保持；发布limitations必须逐字不变。verification由既有校验器派生，不手填；verification_notes若出现派生变化须逐项限定，不整字段豁免。知识文件分别为directives.json与extensions.json，不改src/site/schema/构建或晋级规则。

runtime继续使用 `{status,text,steps:[{condition,action,source_ids}],source_ids,corroboration_source_ids}`；步骤代码并集精确等于runtime.source_ids，独立固定文档单列，不混入代码。补丁引用覆盖所有运行代码与适用补丁。配置回调裁剪、改名或加新ID仍不是运行证据。

## 每批验收与最终收口

1. 源码审核先验证真实消费、生命周期、条件/顺序/失败出口及文档佐证，再通过validateRuntime、deriveVerification、validateDetail、validatePublication。结构通过不替代语义审核。
2. 实际发布sources先原样读取，再与基线旧sources加固定Git对象新增片段逐字比较，覆盖ID、顺序、重复、component/version/revision/file/行号/code/URL/kind及全部元数据；不先替换code或Map去重。旧curated evidence冻结前缀，防止知识与发布同步误改逃过检查。
3. 当批之外全部身份仅排除正常release_id后全字段一致；当批仅放行上述精确白名单。索引仅放行当批派生评级和正常发布路径；顶层/来源组只放行实际派生计数和正常发布元数据，不扩大统计/schema/gaps豁免。
4. 沿用历史测试的固定发布和精确deep断言，新增当批测试承担当前发布与集合比较。负例覆盖配置代码冒作runtime、缺独立文档、假/漏/重复source、步骤遗漏失败出口、补丁覆盖缺失、未经说明的patch状态变化、旧事实/limitations/非目标误改。语义反例绑定真实固定片段，不仅查中文关键词。
5. 主线程统一构建，运行当批专项、受影响历史保护和必要整合测试，记录真实命令/数量/发布ID；167/167仅是c499历史验收，不冒称新批执行。检查通过后无新变更或疑点不重复扩大测试。
6. 主线程只读私有样例及网页验收仍为A24/24、B258/258、50身份、外部引用2/1，默认/继承未核实0；不可复制原配置进测试。实际网页与Markdown逐字段核当批runtime范围、步骤、全部引用和deep标志，不仅看截图徽标。现场版本、未知include内容、部署及真实网络行为仍未验证。
7. 每批EVIDENCE/VERIFICATION/REVIEW绑定同一最终发布，修复后复核受影响项并更新结论。最终逐行交账：35候选分别列已审限定runtime/证据不足待办，6项列配置边界已完成/待补证据；保留已审9项范围。没有剩余待办才宣称本计划完成，不能用总deep数代替清单验收。

本规划仅新增本文，未修改知识、测试、dist或其他文件；未运行构建、测试、浏览器、OpenResty或网络查询，未读取私有原配置，未产生临时文件。
