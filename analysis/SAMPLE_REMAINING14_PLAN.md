# 两样例剩余14身份补证据计划

日期：2026-10-13。状态：阶段一14项已完成并通过独立审核，发布 `1.27.1.1-647706874ae7c03c`，1041 basic、0 deep；新增16项、全量138项测试及原样例浏览器验收通过，详见 `SAMPLE_REMAINING14_VERIFICATION.md` 和 `SAMPLE_REMAINING14_REVIEW.md`。阶段二规划已收口，以 `SAMPLE_RUNTIME_PLAN.md` 的确认契约为准，实施与审核另行验收。下文保留阶段一执行时的基线与要求，不改写历史记录。

## 深度交互：目标与顺序

先完成两份样例50个去重知识身份中剩余14项 defaults/inheritance，再推进 runtime 深度。14项是内容缺证据队列，不是解析失败数，也不是14个新增身份。块头、解析动作和 main 配置不能套用普通 location 字段的继承模型；明确不适用并提供证据也是完成，不要求全部标 verified。

依据 `SAMPLE_PRIORITY_PLAN.md`、`SAMPLE_PRIORITY_VERIFICATION.md` 和 `SAMPLE_PRIORITY_REVIEW.md` 最新收口：冻结比较基线为 `1.27.1.1-2dca5fdd6a398672`，1041 basic、0 deep；上一批四项独立审核通过，实际发布新增证据检查的P2已关闭。121项全量是后补测试之前的记录，后补为10项定向通过，不改写成122项全量通过。当前默认值未核实239、继承未核实325为上一验收记录，阶段一完成后按实际结果重算，不能预设各减14。

阶段一只补已有事实契约。最短路径是13项 nginx 内容与1项 VTS 内容分文件处理，主线程统一测试和构建；不在此批顺带改解析器、页面或深度晋级器。阶段二须在14项全部审核通过、主线程验收收口后开始；有待证实项必须明列阻塞，不以补齐字数代替通过。

## 直接执行：分工与写边界

- Sol：实施下表1—13项，仅改 `knowledge/directives.json` 中精确身份的 defaults、inheritance、必要新增 evidence 和 patch 引用；交付逐项结论、固定证据范围和补丁影响核对结果。此计划不新建任务、不改变已指定模型。
- 主线程：单独核查并实施第14项，写 `knowledge/extensions.json`；测试入口、测试修改、整合、构建和实际发布验收均由主线程负责，Sol不得并行修改测试或构建产物。
- 审核角色：按本文逐项审核完整身份、适用性、事实与证据、字段保护和实际发布；遗漏或错误退回相应实施责任人，修复后复核受影响项。主线程作最终验收。

只开放 defaults/inheritance 中本次缺失或必须纠正的事实及其 source_ids；已有正确事实保留。evidence 只追加所需证据；patch_status 仅追加必要 source_ids，既有 status、note、旧引用不变。不得改 legacy default、summary、syntax、limitations、phase、mechanism、related、注册信息、版本、评级或手写计数。若精确事实确实迫使其他字段变化，先向主线程指出具体冲突，不默默扩大写集合。

## 14项身份、边界与固定源码定位

下表前13项 component 均为 `nginx`；身份按 component/module/name 三元组匹配，不能按 name 批量替换。行号是规划定位入口，实施必须用固定 revision 的 `git show` 核实并裁剪最终起止行，不能直接把整张表当作已验证事实。每项同时核对注册上下文和配置创建/初始化/合并或解析行为；单一注册表不足以证明默认和继承。

固定 nginx revision：`e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`；文档交叉印证 revision：`e8b581903e9d41252720053311cea687a5671674`；OpenResty补丁 revision：`8c37412c31621225e7aa7e825b5b50106c9c71c4`。本规划已核对本地 nginx HEAD 与前者一致，最终证据仍从固定对象读取。

| 序号 | module/name（频次） | 固定源码入口（相对 repos/nginx） | 必须说明的边界 |
| --- | --- | --- | --- |
| 1 | ngx_http_core_module/server（21） | `src/http/ngx_http_core_module.c:2895` ngx_http_core_server；`:3437` create_srv_conf、`:3475` merge_srv_conf；`src/http/ngx_http.c:122` ngx_http_block | server 是创建配置上下文的块；区分没有自动生成 server、server 内字段合并和未显式 listen 的补建监听，不把整个块称为继承。 |
| 2 | ngx_http_core_module/listen（21） | core_module.c同上`:2984–3033` 未配置分支，`:3958` ngx_http_core_listen；`src/http/ngx_http.c` ngx_http_add_listen/ngx_http_add_addresses | 区分无 listen 的 IPv4 wildcard 及平台/权限端口分支、显式 listen 的参数默认、同地址 server 归组/default_server；不能把共用 socket 叫父级继承，也不能无条件写默认80。 |
| 3 | ngx_http_core_module/location（21） | `src/http/ngx_http_core_module.c:3040` ngx_http_core_location；`:3548` create_loc_conf、`:3669` merge_loc_conf；HTTP块的 merge_servers 路径 | location 块本身与其内部各模块配置继承分开；不自动生成匹配表达式，不将父级字段合并解释成 location 规则自动继承。 |
| 4 | ngx_http_core_module/error_log（16） | `src/http/ngx_http_core_module.c:3566` 初始空值、`:3771–3777` 合并、`:5028–5032` 配置回调；`src/core/ngx_log.c:553` ngx_log_set_log | 子级无日志时引用父级，否则使用 cycle new_log 兜底；显式本层列表不与父层混合。默认目标/级别需结合全局日志，不写无条件独立文件。 |
| 5 | ngx_conf_module/include（3） | `src/core/ngx_conf_file.c:821` ngx_conf_include，及同文件注册和 ngx_conf_parse | 在当前配置解析上下文处理路径/通配文件；没有默认 include，也不是子级继承的配置槽位。仅解释源码，不新增外部文件展开功能，不读取样例引用文件。 |
| 6 | ngx_events_module/events（2） | `src/event/ngx_event.c:987` ngx_events_block，注册与 create_conf/init_conf 回调链；必要时查无events检查 | 全局块创建事件配置；块是否必需与内部 worker_connections 等默认值是两回事。不得用内部字段默认值代替块默认，不称跨块继承。 |
| 7 | ngx_stream_module/stream（2） | `src/stream/ngx_stream.c:92` ngx_stream_block，注册、duplicate检查及模块配置初始化/合并链 | 全局 stream 容器无隐式业务 server；内部模块的 merge 不等于 stream 块继承。仅此块身份，不扩展 stream运行机制或同名HTTP指令。 |
| 8 | ngx_http_module/http（2） | `src/http/ngx_http.c:122` ngx_http_block，注册、duplicate检查、create/init/merge链 | 全局 http 容器与其中默认配置对象分开；不能把模块初始化称为默认 http 配置正文或跨http块继承。 |
| 9 | ngx_http_proxy_module/proxy_limit_rate（2） | `src/http/modules/ngx_http_proxy_module.c:495` 注册、create_loc_conf、`:3518–3519` 指针合并；`src/http/ngx_http_upstream.c:3239` 求值兜底 | NULL配置指针最终求值0与显式复杂值分开；子未配置继承父表达式、显式子覆盖。解释上游读取速率，不混成客户端发送 limit_rate；仅补所需默认证据，不扩为runtime深度。 |
| 10 | ngx_core_module/worker_cpu_affinity（1） | `src/core/nginx.c:107` 注册、`:1094` create_conf、`:1401` ngx_set_cpu_affinity、`:1499` ngx_get_cpu_affinity；`src/os/unix/ngx_process_cycle.c:854` 调用 | 未配置不主动设绑定，不写默认绑定全部CPU；auto是显式参数，受平台编译能力限制。main配置无父子层级继承，不混同操作系统进程属性。 |
| 11 | ngx_core_module/pid（1） | `src/core/nginx.c` pid注册，`:1094` create_conf、`:1167–1175` NGX_PID_PATH及路径归一；`auto/options`、`auto/configure`/实际宏生成文件按锁定源码定位 | 默认依赖构建宏与prefix，不能把某机器绝对路径当通用默认。main无父级继承；必要时追踪宏生成，不能臆造文件或行号。 |
| 12 | ngx_core_module/worker_rlimit_nofile（1） | `src/core/nginx.c:114` 注册、`:1122` UNSET；`src/os/unix/ngx_process_cycle.c:777–785` 条件setrlimit | 未配置不调用本分支setrlimit，进程已有系统限制不是固定Nginx默认数；main层级继承不适用，和OS资源限制继承明确区分。 |
| 13 | ngx_errlog_module/error_log（1） | `src/core/ngx_log.c` 注册、`:318` ngx_log_init、ngx_log_open_default、ngx_error_log、`:553` ngx_log_set_log及级别解析；`src/core/nginx.c:1072–1077` | 这是main身份，不是HTTP error_log；区分启动日志与cycle new_log，编译路径与启动参数，省略级别与省略指令。main无父级配置继承，不复制HTTP merge结论。 |
| 14 | nginx-module-vts / ngx_http_vhost_traffic_status_module / vhost_traffic_status_display（1） | 固定 revision `52fe11e44c47a49b052be89e36dfa17d81bf52a5`；`src/ngx_http_vhost_traffic_status_module.c` 的display注册、配置回调、create/merge loc conf及handler安装链；精确行号由主线程核查补入实施记录 | display的handler安装与enable、display_format、统计zone分开；没有显式display与普通/匿名子location的handler行为不能混写。主线程核VTS，不由本规划重复核查或预判继承结论。 |

表中第2、3项“core_module.c同上”仅指 `src/http/ngx_http_core_module.c`。main三项、容器块和include的 not_applicable 必须有说明和有效证据，不能只凭文档空default或“未找到merge”判定。每项分别决定 defaults 和 inheritance 状态；证据不足不能标已核实。

## 固定证据与补丁约束

最终 evidence 沿用现有 component/file/start_line/end_line/id 契约；事实 source_ids 必须引用本身份实际发布sources中存在且支撑对应结论的片段。记录完整revision、函数、准确行范围及正文。旧证据逐字保留，新ID不得覆盖旧ID或重复；引用可解析不等于语义已证实。

逐一核对锁定OpenResty实际适用补丁的目标及hunk，不只按文件名检索；复用现有补丁清单和审核结果，但新增涉及的源码区段必须核查是否被改变。若补丁影响结论，补充固定补丁原文证据和限定说明；新增nginx证据按既有规则纳入patch_status.source_ids，不能借追加引用修改patch状态。VTS沿用扩展组件实际补丁适用边界，不冒称OpenResty内置或现场已安装。禁止将补丁后行号放到原始revision引用中。

## 主线程整合与审核验收

1. 实施提交14项对照表：身份、前后defaults/inheritance状态、正文、全部新增证据和patch引用、未解决项。13项与VTS分别核对，合并仅允许上述14个精确身份，样例去重集合仍50。
2. 在构建之前检查curated事实、source_ids、固定源码逐字片段与补丁覆盖；通过实际校验入口测试有证据的verified/not_applicable以及悬空引用、空正文/空证据拒绝。测试入口由主线程选取，本规划不重复调查或运行。
3. 保留上一批历史保护。历史发布间逐字比较继续冻结；为本批新增基线到新发布的精确14身份字段白名单，不扩大旧四项白名单或修改历史期待值。1041身份集合不变，未授权身份（包含上一批四项、stream/mail同名项及其他VTS）全部逐字不变。授权身份除defaults/inheritance、必要新增sources及patch source_ids外逐字不变；比较时仅按既有规则剥离release_id，不整段排除sources/patch_status。
4. 主线程构建后，直接读取current指向的实际release详情，再逐字核对每项defaults/inheritance和sources。预期sources为基线旧sources加本批固定revision生成的授权新证据完整集合，包含code、revision、URL、行号和其余元数据；先比较实际数据，不能先覆盖成正确片段再验证。不能先用Map去重，重复或额外source同样失败。保留旧source和patch引用，新增patch引用也必须精确匹配授权集合。
5. 负例至少覆盖错误新增code、错误revision/行号/URL、未授权或重复source、缺少事实source引用、旧证据被删改、patch状态/note变化、额外patch引用、误改同名身份及其他字段。区分构建校验拒绝与发布逐字测试拒绝，不将仅内存正确对象通过当作实际发布正确。
6. 主线程运行与变更相称的内容/历史保护测试，统一构建并执行必要整合回归；记录真实命令、结果、发布ID与计数。1041 basic、0 deep不变，默认/继承覆盖率按输出重算。索引、详情、来源组、统计和Markdown/页面事实一致；内容更新不授权额外界面重构。
7. 两样例原文件只读：A沿用第3—73行主配置、B完整配置，不复制正文到仓库或测试。必要回放仍应A24/24、B258/258，外部引用2/1，去重身份50；唯一匹配不等于配置有效。仅主线程统一进行需要的产物/页面检查，本角色不执行浏览器、构建或测试。
8. 14项审核逐项签署后才关闭阶段一。保留既有验收和历史结果，追加本批结果；不得清理旧发布、覆盖其他角色工作或把待验写通过。清理只限本批自行创建且不再需要的临时文件。

## 阶段二：历史设计建议（已由 SAMPLE_RUNTIME_PLAN.md 替代）

本节仅保留历史建议，不再作为实施契约；其中steps的id/next、第二证据及晋级细节以新计划为准。

首批仅覆盖HTTP `nginx/ngx_http_proxy_module/proxy_pass` 动态目标求值 → 目标分类/既有upstream匹配 → 必要时DNS → 建立上游连接。链路应核对 `ngx_http_proxy_handler`/`ngx_http_proxy_eval`、`ngx_http_upstream_init_request`、resolver启动/回调、`ngx_http_upstream_resolve_handler` 和 `ngx_http_upstream_connect`，以固定源码实际调用为准。动态IP、匹配已配置upstream及缓存命中等路径不得伪装成每次必发DNS；缺resolver、DNS失败/超时、连接失败必须表达。此批不扩到stream、完整TLS/重试/缓存机制或实际生产行为。

建议新增单一可选runtime对象，最小字段为status、text、steps和source_ids；steps包含id、condition、action、next及source_ids，能够表达跳过DNS和错误出口。第二证据必须来自独立支撑点（如调用方与被调用方、配置与消费路径或独立文档），不能同一片段改ID充数。复用现有sources，不另建证据注册体系；最终字段名和必需条件由阶段二实施前对齐现有schema，本文不是已上线契约。

构建晋级须由校验器计算：原basic要求通过、defaults/inheritance已核实或有证据的不适用、runtime覆盖必需节点/分支且所有证据与第二证据有效、补丁影响核查通过才允许deep；缺任一项保留basic并说明原因。机制文字存在、steps非空或手工status不能独自触发晋级，不手工抬深度计数。明确basic/deep当前统计是否包含关系并沿用既有定义，避免重复计数；由真实发布集合派生总量、来源组和索引，禁止先预设“新增1 deep”。

详情、网站和Markdown同时消费同一runtime数据，展示条件、链路、错误出口、证据与边界；旧发布缺runtime应按未核实显示并保留原basic等级，不因新字段缺失拒绝旧发布，也不把旧mechanism自动转换成已核实runtime。新发布版本识别及读侧兼容须随schema同步设计。

负例覆盖：缺DNS/连接节点、把可跳过DNS写成必经、断开的步骤引用、虚构调用边、错误或悬空证据、重复片段充当第二证据、缺补丁核对、仅手写deep、仅mechanism有文字、旧发布无runtime；另检查构建输出、详情、索引、来源组、网页与Markdown等级一致。自动检查负责结构与证据真实性，源码审核负责链路语义；不把静态源码证明冒称真实网络运行验证。

本阶段仅记录建议。当前交付不修改runtime schema、构建器、消费者、知识内容或测试，亦不执行发布操作。
