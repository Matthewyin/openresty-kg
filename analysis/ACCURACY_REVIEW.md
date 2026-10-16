# 准确性独立审核

## 状态与边界

2026-10-10：本批准确性审核通过，冻结 release 为 `1.27.1.1-e27dbc95131afc51`。R01、R02、R03 及 K01 均关闭，无剩余阻断项。结论基于独立代码、客户端、冻结源码及产物检查，并核对已补齐的主线程真实浏览器、实际构建门禁和 SDK HTTP 验收记录；证据来源在下文分别标明。下方准备阶段和风险记录按时间保留，不覆盖本节及文末最终结论，也不表示最新版仍有已修复问题。

本批范围为 R01 快照一致性、R02 网站/Markdown 事实一致、R03 外部详情畸形不向调用者抛出异常，以及本批8条stream知识与指令级补丁证据。审核只写本文件，不改代码、知识或构建，不联网、不启动服务、不操作用户浏览器。下面结论是修改中的基线观察，不将其直接当作 ready 版本缺陷。

## 现代码风险与独立证据

### R01：已有修复路径，最终复核待完成

当前 site/app.mjs 单项查询传入 `release: index.release_id`；querySingle 使用 `loadIndex(options.release ?? null)`，loadIndex 校验返回 release，详情校验要求与该索引 release/version 一致。永久链接使用页面 index。旧报告的不传 release 路径已不在当前代码，不能照抄旧阻断结论。

后续独立构造两个内存发布：页面锁定 A，而当前 index 指向 B，并在请求期间切换当前发布；核对请求路径、候选 id、详情、发布标签与永久链接全为 A。仅断言 URL 含 release 或只使用一个 fixture 不足以证明全部快照联动。同步核对新构建源文件与输出一致。

### R02：当前仍有事实与状态遗漏，已离线复现

读取本地 dist 当前 `1.27.1.1-a0b3eef729cb3819` 的真实 lua_shared_dict 详情，在内存中加入 verified inheritance、availability.dependencies、documentation 标记，并将 defaults.status 设为 not_applicable。直接调用当前 renderMarkdown：三个标记均未输出，默认值显示“未核实”，未保留“不适用”。测试不写文件、不使用网络。

当前网站 renderDetail 显示继承但把非 verified 状态统一显示未核实，未展示 dependencies/documentation；Markdown 还直接输出 contexts，未像网站那样依据 contexts_verified 标识映射未核实。最终应逐字段比较实际输出事实与状态，不能只检查同源 JSON 或摘要文本。

### R03：当前畸形详情仍可导致查询抛错，已离线复现

同一真实详情的内存副本设 `availability={}`：validateDetail 接受；用完全内存 fetcher 调用 querySingle，实际抛出 `TypeError: Cannot read properties of undefined (reading 'length')`。没有真实 HTTP 请求。

调用链原因：validateDetail 只确认 availability 为对象；renderMarkdown 读取 compile_guards.length；最终 renderMarkdown 在 querySingle 的 try/catch 之外。最终验证需覆盖所有被两个展示面消费的嵌套字段，不止 availability：patch_status、defaults/inheritance、limitations 元素、documentation 元素、source 元素、phases/verification_notes 等。通过实际 querySingle 入口断言结构化 knowledge_unavailable/invalid_detail（或契约规定错误），不得出现未捕获 TypeError，也不能把失败变为 unknown。

### 知识生成与补丁范围风险

当前 scripts/build.mjs 以组件级 patch_status 决定 patchKnown、basic_verified 及限制说明的 verified 状态；inheritance 固定 unverified，dependencies 固定空数组。因此只补 knowledge 文本，可能无法把继承、依赖和指令级补丁结论正确传到产物。后续必须核查构建映射及最终详情，而非仅看知识输入。

不得为提高七条知识核实状态，把 nginx 整个组件设为 verified_unaffected。指令级结论必须明确所核对行为、实际生效补丁和源码范围；某补丁未出现指令名、未直接修改注册表或主文件，不足以排除其对公共日志、连接、变量、事件或代理调用链的影响。

## 冻结来源与逐条准备清单

只读确认本地 HEAD：Nginx `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`，OpenResty `8c37412c31621225e7aa7e825b5b50106c9c71c4`。project.config.json 声明 OpenResty 1.27.1.1、Nginx release-1.27.1。最终还需核对 tag 与指定 revision 的对应、每段证据原文和发行版有效补丁选择，不把配置声明视作来源审核通过。

已用 git show 读取冻结 Nginx stream proxy 源码：connect_timeout 合并默认值为 60000ms，timeout 为 10*60000ms；待核对知识是否准确表达连接超时与代理读写间隔的作用域及继承，不能解释成整个会话总时限。OpenResty 冻结发行脚本有实际 patch 应用命令及条件分支，后续须以其生效集合为准。

| 指令 | 独立核对重点 |
| --- | --- |
| stream listen | ngx_stream_core_module 注册 context、参数与套接字行为、默认/必填语义、相关条件编译与补丁 |
| stream proxy_connect_timeout | ngx_stream_proxy_module 注册、配置槽位、父级合并默认 60s、连接定时器及作用范围 |
| stream proxy_timeout | 同模块默认 10m、读写定时器刷新与实际超时语义、继承及限制 |
| stream set | ngx_stream_set_module 注册、变量表达式求值阶段、覆盖与继承；不套用 HTTP rewrite set 语义 |
| stream proxy_pass | 同模块静态/变量目标处理、解析与运行时连接链、resolver 等依赖的适用条件 |
| stream access_log | ngx_stream_log_module 格式引用、off/路径/缓冲等参数、默认与继承及日志调用链 |
| error_log | ngx_errlog_module 通用注册及 stream 使用路径、等级/目标/默认/继承；不因共用模块泛化成全 Nginx 补丁不受影响 |

逐条检查最终 summary、syntax、defaults、inheritance、limitations、availability、mechanism、documentation 与 patch_status 的断言；source_ids 必须指向真实支持该事实的冻结原文，版本、revision、行号、代码及链接互相一致。凡证据不足保留 unverified/registration_only，不能通过措辞把未知写成已核实。

## 后续验收程序

1. 完整读取落盘方案，补充或纠正本清单；接收 ready 与明确 release 后固定审核对象，避免混读修改中产物。
2. 用只读离线内存检查独立复核 R01–R03，既检合法字段的事实保留，也检畸形输入的结构化失败；不凭主报告关闭问题。
3. 对七条知识逐字段回查本地冻结 Git 原文及有效补丁，核对构建后的实际详情、覆盖计数和指令级状态，检查未扩大 nginx 全局结论。
4. 记录具体问题、证据与返工条件；只有方案完成判据全部满足后才写最终结论。当前不宣布通过，也不声称全量知识或 Codex 宿主验收完成。

## 知识与补丁阶段复核（实现未 ready）

已完整读取现已落盘的 ACCURACY_PLAN.md：本轮按其 R02/R03、构建前门禁及知识交接要求验收，另保留用户明确要求的 R01 双发布检查。知识范围更新为 8 条，包括 stream server；error_log 对应本条真实注册模块 ngx_stream_core_module，不采用准备阶段表格中对公共 ngx_errlog_module 的泛指作为身份。

### K01：详情引用的补丁条件与返回语句（已修复，以下保留初审发现）

当前知识的 proxy_connect_timeout、proxy_timeout、proxy_pass 的 patch-selection 为 mirror-tarballs:47-61，set 为 47-78，漏掉第 46 行 `ver-ge "$main_ver" 1.13.3`，仅看到 answer=Y，不能在片段内判断生效版本。proxy_pass 的 balancer-selection:104-109 从 patch 命令开始，后半部分是下一补丁条件；应纳入本补丁的 101-106 行。proxy_pass 的 tries-export-patch:1-29 漏掉第 30 行 `return pscf->next_upstream_tries` 及第 31 行闭合，建议扩到 31 行。

这不是说正文语义错误：审核读取完整冻结文件后确认其语义成立；缺口在最终详情所携带证据没有完整支撑条件和查询值。主线程可仅修改知识 evidence 范围修复。对声明应用全部 34 项的 unaffected 条目，现有 patch-selection 只展示局部集合，建议同时引用冻结脚本完整相关范围或明确链接审计记录，避免让局部片段看似证明全部集合。

### 有效集合与归属：独立只读核对结果

读取冻结 mirror-tarballs:1-570 及 util/ver；后者明确 main_ver=1.27.1、minor_ver=1。独立核对全部版本条件、嵌套条件、注释与先后次序：审计 JSON 的 34 项及顺序与该版本默认应用分支一致；旧版本安全补丁、等于 1.9.7 的分支不生效，ssl_sess_cb_yield 的 else 分支生效；no_pool 仅复制到 bundle 外侧而未在默认源码中应用，排除正确。server_header 的 .unknown → .1 替换与脚本一致。

独立读取全部 34 个冻结 patch 的目标文件头：stream core/set/log 没有直接修改；stream proxy 恰由 stream_proxy_get_next_upstream_tries、stream_proxy_timeout_fields、balancer_status_code 三项修改；core ngx_log.c 由 intercept_error_log 修改，与审计目标归属一致。知识 notes 已限定不变结论只覆盖列出的配置事实，并明确 socket/reuseport/其他底层行为不在结论内，没有将 Nginx 全局设为 unaffected。

核对两个 tag：Nginx release-1.27.1 和 OpenResty v1.27.1.1 均解析到本报告所列冻结 SHA。没有执行会创建临时副本的 verify-nginx-patches.mjs，遵守仅写本审核文件的限制；34 项实际应用无 offset/fuzz 为主线程报告，审核独立确认的是有效集合、顺序和 patch 内容/目标。脚本本身也明确不自动证明列表完整；本次已独立核对条件补足该部分。

### 8 条事实逐项结果

| 条目 | 冻结源码核对结果 |
| --- | --- |
| server | core:807-885 创建独立 srv_conf 并检查缺 listen 错误；结构块 not_applicable 和不推断孤立 server 子系统的说明成立 |
| listen | core:889-950 默认 SOCK_STREAM、udp 受非 Win32 条件控制；1209-1254 拒绝 udp/backlog 等组合；无自动 listen 和仅 server context 与知识一致 |
| proxy_connect_timeout | proxy:2118-2119 默认/继承 60000ms，532-552 DNS 使用 resolver_timeout；timeout patch 改读会话 connect_timeout，包括 TLS 握手相关读取；知识没有混为总会话时间 |
| proxy_timeout | proxy:2121-2122 默认/继承 10×60000ms，活动定时器和 1448-1497 UDP 分支与描述一致；不承诺连接总时限，UDP 结束条件单独提示 |
| set | 完整读取 set 模块 25-225：仅 server、无 merge 回调、preaccess 注册、按命令数组顺序求值赋值；不借用 HTTP rewrite 语义 |
| proxy_pass | proxy:2354-2410 配置拒绝重复并编译变量；461-553 先查 upstream 或直接地址再按需 resolver；802-820 TLS 开关与 2160 默认 off，支持 :443 不自动开启 TLS 的说明 |
| access_log | log:942-968 子层 logs/off 阻止父列表继承；202-220 无 logs/off 不记日志；1066-1093 必须有命名格式并查找，145-159 log_format 仅 stream 主层注册；无内置 proxy 格式的说明与源码一致 |
| error_log | stream core:799-804 调公共 ngx_log_set_log，744-750 继承或 cycle->new_log；core log:478-487 显式省略 level 默认为 error；intercept patch 加防重入回调，正文区分配置和运行时补丁 |

另读取固定 stream Lua revision `69f0cd762112a6e0cddb07f2b5192e9a65034a93` 的 balancer:591-631：接口限制 balancer context，connect_timeout/timeout 参数大于 0 才覆盖代理上下文。两条超时知识所述“可覆盖配置初值”成立。来源明确分别是上游、OpenResty patch、stream Lua，没有混用文件行号。

当前未发现这些重点知识正文的明确语义错误。实际构建对 Fact、跨组件 evidence id/component、patch.source_ids 的映射及发布后输出尚未完成本轮审核，不能以本节替代最终 release 验收，也不关闭 R01/R02/R03。

### K01 修复复核

已重新读取实际 knowledge/directives.json，并对照固定 OpenResty Git 原文检查范围：两条超时及 proxy_pass 的 patch-selection 为 45-60，set 为 45-78，包含版本比较；balancer-selection 为 101-106；tries-export-patch 为 1-31，包含返回语句。server/listen/set/access_log 四个 verified_unaffected 项均新增 component=openresty 的 patch-effective-set:35-550，且 patch_status.source_ids 引用该 id。error_log 的 intercept-selection 为 150-155，intercept-patch 为 1-60。

对 8 条的跨组件补丁证据范围及 patch_status.source_ids 闭合进行了只读检查，均通过。K01 在知识输入层关闭；未将此结论扩大为最终发布已正确生成或 R01/R02/R03 已关闭。等待明确 ready/release 后复核输出证据、事实展示及错误收口。

## 冻结实现与发布独立复核

对象：`1.27.1.1-e27dbc95131afc51`。独立读取该不可变目录 index 和全部 details，并确认 current index 指向此发布。没有执行 build、门禁写入脚本、联网或服务操作。

### 独立执行结果

- `node --test test/knowledge.test.mjs`：16/16 通过。该文件只读现有发布；没有执行会创建临时目录的 verify-build-gate 脚本。主线程 38/38 全套结果与此独立运行分开记录。
- 实际调用 validatePublication 对全部 876 条详情验收，通过；重新核对计数为 876 registration、18 basic、0 deep、inventory_complete=false。
- 将 1128 段发布 sources 与其指定 revision 的 `git show` 原文切片逐字比较，全部一致，读取 120 个唯一 Git 对象。这个检查证明来源原文一致，不把它当作所有 876 条语义均已核实。
- 新增 8 条的 summary、syntax、defaults、inheritance、patch_status 与知识输入精确一致，dependencies 及 evidence 的 id/component/行号正确保留；全部 basic_verified。只有这 8 条 Nginx 的 patch_status 为已核对，旧 worker_processes/worker_connections 仍 registration_only，没有组件全局升级。
- site/app.mjs 与 dist/app.mjs、src/query/knowledge.mjs 与 dist/src/query/knowledge.mjs 逐字一致。

### R01：独立快照检查通过

离线内存构造发布 A（review-A）与当前 B（本次真实发布），固定 A 页面索引后实际调用 querySingle，核对请求均走 A 的不可变 release 路径、结果及详情 release 为 A、页面永久链接仍为 A。请求全部 GET、无 body，URL 不包含独特配置参数标记。页面调用链仍显式传入 index.release_id，候选读取使用同一 index。

本检查是真实公共客户端与内存 HTTP 响应隔离测试，不是浏览器网络抓取。已有单项、候选预览、启动深链接的代次保护仍在写 UI 之前，错误及 finally 分支保持守卫；主线程后续浏览器记录补充实际页面运行证据。

### R02：独立事实检查通过

页面与 Markdown 共同使用 formatFact，保留 verified/unverified/not_applicable 的文本、note 和状态；dependencies、documentation 标题/URL/核实状态、availability.status、deprecated=null、patch 状态、phases、configuration_entry、mechanism 及来源身份均有对应输出。机制标题不再统一宣称“已核对”。

独立在 Node 内存节点环境中执行从实际 site/app.mjs 读取的 renderDetail 函数，并以同一哨兵详情调用 renderMarkdown。默认值不适用、未核实继承及 note、依赖、文档标题/链接全部在两端保留。此为实际函数级输出验证，没有使用或冒充真实浏览器。

### R03：独立畸形字段检查通过

在真实 lua_shared_dict 详情的全部字段路径逐一注入 null、空对象、空数组、数字，共 448 次实际 querySingle 调用；432 次返回结构化知识不可用，其余为契约允许的字段值（例如 nullable 字段或可空数组）。所有 448 次均 resolve，无未捕获异常；失败均 detail=null、detail_url=null 且有错误码。

知识测试另覆盖 availability={}、嵌套 null、元素类型、补丁状态、悬空引用、源码 URL/行号、JSON 解码、schema、跨 release、404 和读取失败分类。validateDetail 在访问嵌套内容前检查容器及元素，querySingle 将详情渲染放入错误收口范围；页面 getDetail/loadIndex 的错误分支显示中文原因并撤销旧详情。原 R03 TypeError 路径已关闭。

### 构建门禁与证据边界

独立完整读取 build 及 verify-build-gate：构建先准备全部 index/details，再调用 validatePublication；mkdir、immutable 写入、页面复制、current index 临时写入与 rename 均在其后。validatePublication 遍历所有 entry，并检查数量、重复 id、事实与证据及基础核对资格，错误附条目 id。prepareKnowledgeFacts 不允许 Nginx 组件级 unaffected 替代指令级证据，显式 Fact 优先，跨组件 evidence 由冻结 Git 生成。

主线程报告隔离执行真实 build 门禁：坏的最后非代表 more_clear_input_headers 条目拒绝，原 current index 保持、未写 release；审核已读该脚本，确认它实际调用 build 而非只调用纯校验器。该写入测试未由审核者重复运行。独立执行的知识测试也验证最后条目拒绝，但不以该纯函数测试冒充真实写入隔离测试。

截至此阶段，独立代码/客户端/冻结产物检查通过，K01 的修复也已确认进入发布。整批最终验收仍待主线程真实浏览器记录；不以此宣称全量知识、真实 Codex 宿主或部门样例验收完成。

### 浏览器记录补充与异步等待条件风险

已读取 analysis/ACCURACY_VERIFICATION.md：主线程实际 query-ui.mjs 与 accuracy.mjs 通过；后者包含两端哨兵事实、畸形 availability 错误展示及静态 GET 无输入上传。官方 SDK 对同一 HTTP 发布的 8 条实际查询也通过。以上作为主线程执行证据，不冒充审核者浏览器或真实 Codex 宿主验证。

主线程报告 query-ui-async.mjs 在当前单项详情失败恢复通过后某 wait 超时，尚未确认最终结果。只读检查发现确定的脚本条件失配：第 84 行等待 detail-panel 包含“读取失败”，但 site/app.mjs:111 对有 code 的错误显示 error.message；src/query/knowledge.mjs:137 将受控 fetch throw 转为“无法读取知识文件，请检查站点连接”。因此即使产品已正确展示错误，该等待条件仍不会满足。

建议责任方核对真实超时是否为该行；如是，改为等待 detail-panel 的 notice.error，再检查当前候选保留、无旧详情及 active=0。不要为迎合旧测试改回通用产品文案，因为本方案要求展示具体中文错误原因。此为静态确认的测试条件问题，不据此推断本次未知超时位置，也不提前将整份异步回归记为通过。审核未修改脚本或实现。

## 最终验收结论

本批通过。已完整重读补齐的 analysis/ACCURACY_VERIFICATION.md，并只读确认异步脚本现等待错误节点、断言“无法读取知识文件”及候选数 3/active 0，结束移除 hook 并 reload。主线程确认 query-ui、accuracy、query-ui-async 三份真实浏览器脚本完整执行通过；首次异步超时确为旧文案断言，最小复现已证明产品状态正确，仅修改测试，没有把该红点冒充产品缺陷修复。

收口再次独立比较 current index 与指定不可变 release index 原文一致，页面 app 和共享 query 模块与 dist 副本一致，冻结对象未切换。

| 完成判据 | 最终结论 | 主要依据 |
| --- | --- | --- |
| R01 历史发布与查询快照 | 通过并关闭 | 独立 A/B 双发布客户端请求、结果、详情和永久链接一致；页面显式传固定 release；浏览器固定链接回归通过 |
| R02 网站/Markdown 事实及状态 | 通过并关闭 | 独立实际渲染函数与 Markdown 哨兵检查；主线程真实浏览器相同事实、note、状态和文档链接均通过 |
| R03 畸形外部数据不抛出异常 | 通过并关闭 | 独立 448 次字段扰动无未捕获异常，错误详情清空；16/16 知识测试及浏览器 availability={} 错误展示通过 |
| 发布前全集门禁 | 通过 | 独立审查全部写入前调用顺序、876 条统一校验；主线程实际隔离 build 拒绝坏最后非代表项，current 未变且无 release 写入 |
| 8 条知识与指令级补丁 | 通过 | 独立逐条语义核对、34 项有效条件/顺序/修改归属、1128 来源片段原文比对及发布映射；K01 已补齐并进入产物，无 Nginx 全局 unaffected 推导 |
| 同名歧义、孤立 server、唯一预览、异步保护 | 通过 | 独立代码检查与主线程 query-ui/query-ui-async 实际完整通过；失败重选和索引失败清理均保留 |
| 不上传输入 | 通过 | 独立带独特参数的 GET/无 body/URL 无输入检查；主线程 accuracy 浏览器请求记录一致 |
| SDK 读取正式 HTTP 发布 | 本批协议范围通过 | 主线程官方 Client/StdioClientTransport 对同一发布 8/8 实际查询成功、文本与 structuredContent.markdown 一致；不等同 Codex 宿主接入 |

最终计数为 876 注册、18 basic、0 deep，inventory_complete=false；新增 8 条基本知识已验收，旧 worker_* 仍仅注册信息。没有把源码片段逐字一致扩大为全体注册项语义核实，也没有把基本配置事实扩大为 OpenResty 全运行时不受补丁影响。

独立审核全过程仅写 analysis/ACCURACY_REVIEW.md，没有改代码/知识/构建，没有联网、开服务或操作用户浏览器。真实浏览器、补丁实际回放、隔离写入门禁及 SDK HTTP 操作由主线程执行并留证；独立检查的范围和数量在文中单列。

本批通过不代表全量知识、深度运行时行为、部门正式样例、目标环境配置安全或真实 Codex 宿主验收完成；不要求为本批扩展这些范围。
