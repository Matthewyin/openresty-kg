# 网站内容与交付完成方案

2026-10-14状态更新：本文以下为历史规划，不再以949/23/0或“样例未提供”作为当前状态。当前1041基础、44限定深度、样例6项配置边界完成，见SAMPLE_FINAL25_RUNTIME_VERIFICATION.md与SAMPLE_CONFIGURATION_BOUNDARIES.md。三个新增可靠性缺陷与状态同步由WEBSITE_RELIABILITY_PLAN.md及对应验收记录接续；Codex真实接入和现场部署仍排除。

2026-10-10。状态：ready，供主线程冻结；规划完成后停写。依据用户“继续完成网站所有开发”及当前排除范围，本计划覆盖发行版正式目录、全目录基础知识、部门深度内容的状态边界、已有网站功能回归和静态交付。第一实施块是剩余范围闭合，不以任意几个组件的小批通过结束本任务。

## 深度交互：当前结论与完成边界

需求以 [REQUIREMENTS.md](../REQUIREMENTS.md) Q1–Q15、4.1/4.2 和验收表为准，阶段衔接见 [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) M1/M3/M4/M5。本规划完整读取上述文档及 research 技能；作为已委派的规划研究直接核对一手来源，不嵌套 Agent。采用 writing-for-agents 技能明确责任、输出与完成条件。

已通过的网站程序功能见 [WEBSITE_REVIEW.md](WEBSITE_REVIEW.md)、[WEBSITE_VERIFICATION.md](WEBSITE_VERIFICATION.md)；NDK 当前结论以 [NDK_REVIEW.md](NDK_REVIEW.md) 最终收口及 [NDK_VERIFICATION.md](NDK_VERIFICATION.md) 为准，不沿用其准备阶段的“待验收”。读取实际 current 为 `1.27.1.1-7e53dde6171ab67c`：949 注册、23 basic、0 deep、8 独立参考、inventory_complete=false；43 个下载项中 16 not_inspected。数量只是本次起点，不预设最终指令数或完成率。

网站程序通过不等于全范围基础知识完成。继续沿用已有查询、导航、参考浏览和静态发布流程；本任务的主体是让范围内每条配置都能查到准确功能与实现入口。默认值、继承及补充限制可保持未知，功能/语法/context/入口尚未核实的条目继续留在缺口中。范围是否完整与基础内容是否完整各自验收。

当前不做手机、Codex 真实接入、内网部署、OpenResty 编译或运行、全 bundle 下载、生成器执行、backend/DB/RAG、新 UI 或新功能；不修改用户原源码、不提交或 push。桌面与限时本地 HTTP 预览用于交付验证。部门正式样例未到场不阻塞 C01/C02/C04，但正式深度验收继续未完成，不能宣称双入口及部门使用整体验收完成。

## 阶段与冻结条件

| 编号 | 工作与责任 | 完成条件 |
|---|---|---|
| C01 全发行版注册范围 | 主准备固定来源及补丁/归档集成；Sol 核定剩余16项构建与注册，做必要目录实现；Astra 独立审核 | 16项有可复核终态，既有27项范围证据足以支持正式构建边界，有效补丁新增/修改/删除注册均计入最终目录；所有来源、owner/context/条件、生成/include路径无未说明缺口，才关闭范围任务 |
| C02 全目录基础内容 | 主并行审现有 schema 与来源适配；Sol 按核定目录逐模块研究及填写知识；Astra 逐项审核 | 每个正式身份都有功能、语法、context、配置 callback 及真实定义来源、所列事实的补丁状态；可核默认/继承/限制有证据，未知明确；全部必需内容审核通过且实际发布集合与目录一致 |
| C03 部门深度边界 | 主记录所需输入；Sol 在已有范围内保留通用说明；部门样例到场后另定常用项 | 无部门输入时明确“未开始正式深度验收”，不制造deep计数或任意常用项清单；不阻断通用网站交付。样例到场后按需求4.2核定，不能由C01/C02完成推定通过 |
| C04 网站回归与静态交付 | 主构建、HTTP/桌面与交付；Astra核对冻结发布、已有矩阵和实测记录 | C01/C02通过；已有网站流程在最终发布回归通过，来源与发布身份一致，静态产物及构建/托管说明完整；交付口径清楚标出C03及本轮排除项 |

C01、C02允许按来源就绪和模块边界连续提交可审查批次，每批冻结输入、完整身份集合及发布对象，审核错误退回责任方修改复核。批次是推进单位，不缩小整阶段完成范围，也不要求每小批重新执行全部无变化浏览器场景。

## C01 第一实施块：剩余范围闭合

主线程现在可冻结并让 Sol 开始本节。输入是固定 OpenResty `8c37412c31621225e7aa7e825b5b50106c9c71c4` 的下载/构建脚本、既有来源配置与范围记录，以及主已落盘的 [REMAINING_SOURCE_PROVENANCE.json](REMAINING_SOURCE_PROVENANCE.json) 中16项完整trees/blobs。主并行审基础内容 schema；Sol立即研究已取得来源。本块Sol只负责16项范围与必要实现，Nginx补丁新增注册和redis来源桥门禁由主负责后续集成。

当前16项如下。组件名、版本和tag来自实际 components.json；表中分类是检查方向，未提前判有/无指令。

| 检查组 | 固定版本 / tag |
|---|---|
| 正式Nginx模块或API注入候选 | rds-json-nginx-module 0.17/v0.17；rds-csv-nginx-module 0.09/v0.09；drizzle-nginx-module 0.1.12/v0.1.12；lua-upstream-nginx-module 0.07/v0.07；iconv-nginx-module 0.14/v0.14；encrypted-session-nginx-module 0.09/v0.09；ngx_postgres 1.0/1.0；ngx_coolkit 0.2/0.2；redis2-nginx-module 0.15/v0.15 |
| 非GitHub归档模块 | redis-nginx-module 0.3.9，FreeBSD维护者归档，不能伪造tag或GitHub revision |
| 工具或库候选 | resty-cli 0.30/v0.30；opm 0.0.8/v0.0.8；lua-cjson 2.1.0.14/2.1.0.14；lua-redis-parser 0.13/v0.13；lua-rds-parser 0.06/v0.06；lua-resty-signal 0.04/v0.04 |

主按发行脚本的真实 repository/tag 用既定 gh 路径解析完整 commit，取得完整树；Sol从固定 SHA 的 tree/blob或本地Git对象读取。树截断、获取失败或缺必要文件保持pending，不将联网失败记作零指令。所有获取均逐项进行，不执行下载脚本。

Sol逐组件沿 `util/configure` 选择 → 组件 config/Makefile/安装入口 → 正式源及包含/生成输入 → ngx_module_t.commands或库/工具入口核定。扫描用于发现候选，最终结论依赖构建关系：

- 有指令：确认正式owner及commands字段、完整注册项、context/flags/callback/post/条件、固定位置；条件或默认禁用但随包的项仍纳入。新增仅registration_only；API注入、Lua API和变量另分类，不混入指令数。
- 无自身配置指令：完整固定树和所有正式构建入口给出正向库/工具/运行时用途或正式module空commands证据；包含及生成路径闭合，附带示例明确不在正式入口。零regex、无.c、仓库名、README列表均不足以结束核定。
- 未决：具体指出未解include、宏实例、生成输入、owner/context歧义或来源缺失；保留pending与可执行下一步。不得用“扫描过”覆盖缺口，不需要通用C预处理器或完整调用图。

沿用NDK的 `source.registration_inputs` 和 `registration_evidence` 处理已支持的正式文件/片段；新形态须先核真实源码再最小兼容。未知名称/flags/宏/include、重复或未消费映射、owner断链、错版本、无法支持的身份冲突均拒绝，既有目录及current保持。范围证据沿用components及已有scope文件/研究说明，仅增加实际需要的类别和闭合信息；不能让有C扩展的库冒用原“纯Lua、无native_or_generator_files”规则。不为每个无注册辅助文件造新ledger。

Sol交付：16项逐组件结论与必要来源位置、可接入的正式输入/注册目录或明确pending、范围数据与最小实现、相称负例结果。主负责配置与正式来源集成；Astra核对每项构建输入及目录集合，而非只比对总数。来源缺失时Sol先完成已到场组件；本实施块未闭合部分必须继续列出，不宣布C01最终完成。

### C01补丁注册与既有范围的最终门槛

仅关闭16个not_inspected不能使全范围完成。既有27项中 `local_c_registration_scan`、`no_c_registrations_found` 只是观察：主和审核以已存在固定构建/范围证据核对充分性，缺口补核，不重复已通过NDK链或把它推广为所有模块均已闭合。Nginx按固定auto/options、auto/modules、auto/sources及有效补丁核定核心、HTTP、stream、mail、event和平台/可选分支，保留条件，不按当前机器筛选。

主预检已发现上游目录遗漏补丁新增 `no_error_pages`、`log_escape_non_ascii`。这两项是已知检查对象，不是新增总量上限。主负责以 [NGINX_PATCH_AUDIT.md](NGINX_PATCH_AUDIT.md)、既定固定34项及实际应用顺序核对注册新增、修改、删除；复用已通过C-R05的匹配与最终文件证据，必要时在mkdtemp固定源码副本连续实际回放，不重建额外hash账本，不操作用户源码。

补丁新增项的注册来源应为固定OpenResty中实际有效patch的原文范围（`openresty_patch`），同时从真实回放后的module/commands核实owner、context、callback和条件。补丁后的文件坐标单独绑定回放来源和最终文件hash，不能冒充原始Nginx GitHub行号；patch文件存在或 `+ngx_string` 命中不能单独证明它生效。删除及改名项对照最终注册集合处理并解释旧来源，不把上游与补丁新项双计。已知两项及所有有效注册差异闭合后再冻结C02全目录。

一手依据是固定 [发行处理脚本](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/mirror-tarballs) 的有效分支及其引用patch；旧patch版本不因同名命中被纳入。此前补丁回放通过仅证明应用和既有事实，不能替代新注册集合审核。

### redis归档与维护者Git来源桥

已只读核对 [mirror-tarballs:692–712](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/mirror-tarballs#L692-L712)：取得维护者 `https://people.freebsd.org/~osa/ngx_http_redis-0.3.9.tar.gz`，重命名后按顺序应用 variables_in_redis_pass、default_port_fix、remove_content_encoding；第三项受main_ver≥1.23.0条件控制，在当前版本满足。主核定归档可获取性、发行归属及三个patch，Sol只能据可靠输入研究范围。

主已完成来源桥：维护者 `osokin/ngx_http_redis` tag `0.3.9` 对应真实commit `411fef36e130129b670fa7f2672bcad6ab2cbdd3`；官方原包9文件与该固定树全路径、逐字byte-equal且无extras，AUTHOR为Sergey A. Osokin / osa@FreeBSD.org。上述来源JSON记录归档URL/SHA-256、真实repository/revision/tree及完整files/blob清单。主将原包持久保存在 `analysis/source-archives`，用于盘点复校；此段是主已完成比对的落盘证据，不冒称规划重复下载。

最小实现是允许该组件显式 `source.repository` 覆盖下载矩阵的空repository，并要求 `archive_evidence` 门禁绑定保存原包、归档SHA及全blob manifest：归档URL/版本与发行来源一致，复校原包SHA-256，原包全部相对路径及逐文件字节与真实固定树全files集合/每个blob一致，缺失、额外、字节不符或任一项无法校验均拒绝并保留pending；不能仅相信 `tree_matches:true`。最终源码发布沿用真实GitHub来源，指向 `osokin/ngx_http_redis/blob/411fef36e130129b670fa7f2672bcad6ab2cbdd3/...`，无需修改公共sources契约、URL schema、网页或来源kind。三个patch原文仍用真实固定OpenResty来源，回放结果另绑定其文件hash。来源桥门禁、正式构建与补丁注册边界未可靠闭合前redis保持pending；禁止fallback到nginx repository、伪造GitHub SHA、用归档SHA冒充revision或初始化root Git。主集成此必要门禁，Sol按可靠来源核范围，不引入新backend或归档ledger。

### C01范围完成状态

范围完成由实际证据计算：发行43项逐项分类终态成立、正式注册/include/生成边界闭合、既有范围缺口已核定、有效补丁注册差异接入且可发布、无未解范围问题，才令inventory_complete=true。既有scope_complete仅按inspection非not_inspected计算的逻辑不足；拒绝将它直接当最终结论，也不将inventory_complete永久写死false。基础内容与部门样例缺口另计，不能反向把已闭合的范围置为未完成。

## C02 全目录逐条基础内容

主现在可并行审 `knowledge/directives.json`、build、validatePublication/validateDetail 与范围输入的实际调用路径。优先沿用现有字段，明确如下必需项和可未知项；仅在真实来源或callback无法表达时补必要字段/校验，不重构查询架构。Sol可先研究完整本地来源中未核实内容，最终分母及身份以C01核定集合为准，不能把前几个研究模块当完成门槛。

| 对象 | 每条验收要求 |
|---|---|
| 身份、功能、语法 | component/module/name及稳定ID与正式注册一致；中文功能具体说明实际作用，语法包含参数形式和块/分号形态；正文有固定实现及文档依据，不能把名称翻译或注册flags模板作为功能完成 |
| context与入口 | context经flags和对应handler分支核实；配置callback符号、真实定义文件/范围与registration相连，入口源码在站内可读；不能用声明或无关同名符号代替定义 |
| 适用条件 | 保留全部编译guard、正式模块依赖、明确废弃状态；区分发行默认选择、单模块条件和实际部署未知；未知补充信息明确状态，不能把缺依赖记录写成无依赖 |
| 补丁状态 | 逐所列事实核定有效patch影响；affected附实际patch证据，unaffected给固定有效处理链及事实未改变依据；未知保持unverified，不能计为basic完成；不把组件文件未变推广为所有调用不受影响 |
| 默认、继承、限制 | 可核者查create/init/merge及执行边界，引用对应source_ids；无法核定明确unverified，真实不适用有依据；空值不等于无默认/无限制，不为提高计数伪造确定性 |
| 内容与发布 | evidence覆盖实际正文断言，sources原文/版本/路径/坐标一致；文档与锁定版本交叉核对；不使用当前文档新能力推定锁定版本支持；仅读取测试规格不写运行通过 |

共享配置handler可复用研究证据，但每条参数/context/默认必须分别核对。NDK使用方需要跨组件配置回调时，优先给已核实际定义的显式component/file/range定位，主做最小build接入与符号校验；禁止在任意仓库全局同名搜索后默认命中。不为共享handler或重复三行内容建立通用C解释器。同模块同名不同条件/语义无法由现有ID表达时先核身份，不能丢项、任意合并或绕过重复门禁。

Sol按模块和共用handler分组连续推进，并交每组身份清单、正文/evidence、逐事实补丁结论及未解项；Astra逐条审核功能与入口、逐断言审新语义，完整性由全集合检查，不能仅抽几个页面或确认source_ids存在。审核失败保留registration_only并打回，不在审核前抬高basic状态。既有23项只在新补丁事实或重叠变化影响时重核。

主运行全目录必需字段/身份/source引用检查、真实build及写前门禁；全文内容的质量仍由独立研究审核保证，不能机械生成summary使门禁通过。未知输入字段形态、错误跨组件入口、坏来源、不可验证patch及无支持的context不能静默升格。构建失败保留旧current，无部分发布；完成后coverage实际计数与全目录身份相符，必需项未完成集合为空。可未知的默认/继承/限制逐条保持真实状态，不作为额外全知门槛。

## C03 部门样例与参考边界

需要的是用户后续提供的脱敏配置及变更关注点，不要求访问生产环境。未提供时继续通用基础内容及现有查询回归，deep保持真实现状；自选配置仅标通用验证样例，不冒充部门验收。未核运行时行为不补虚构调用链。现有API/变量参考单独保留并核对受改动影响的事实，不把库用途核定变成全量API知识扩建或指令覆盖。

C04通过后的准确口径为“本轮网站通用开发、全发行版配置范围和基础知识交付完成；部门正式深度验收待样例，Codex及部署本轮未实施”。只有C01/C02真通过才能使用该口径，不能仅因程序功能已过即宣称完成所有内容。

## C04 已有功能验收矩阵与交付

沿用已通过的功能与测试工具，最终发布执行与数据/实现变化相称的回归；无新功能。冻结release与current核对后，主实际运行、Astra独立核对产物和执行记录，标明两者执行归属。

| 验收对象 | 最终发布检查 |
|---|---|
| 输入与匹配 | 单项/片段/完整配置，核心/http/stream等层级、同名模块候选、未知context/指令、引号/注释/Lua块边界、错误位置；include及外部Lua明确未分析，无I/O或变量求值 |
| 浏览与详情 | 模块/context/相关阶段筛选、搜索、相关指令候选、最后选择获胜、失败后恢复；全条目来源自动核对，桌面选代表性新增模块、条件项、补丁新增项、归档项及未知事实检查真实展示 |
| 来源与事实 | 功能/语法/入口、默认/限制的核实状态与发布JSON一致；Git与patch引用真实，redis归档来源桥门禁有效，版本/原文坐标无混用，旧永久详情链接可读 |
| 独立参考 | 原8参考及分类/来源保留，参考不增加指令计数；坏数据只影响参考区，旧无参考路径发布仍可配置查询 |
| 发布与隐私 | 全量validatePublication、坏最后指令/参考/来源拒绝，current不变且无部分发布；内容/来源/coverage变化进入发布hash；真实HTTP与桌面只读静态知识请求，参数/原始配置不进入URL/body |
| 内容完成 | inventory_complete由C01证据产生；最终目录与基础完成ID集合一致，补充未知明示；部门deep及排除项单独状态；实际coverage及根文档口径一致 |
| 静态交付 | 构建后的完整dist、版本化JSON及源码片段、固定来源配置/研究审核记录、已有构建和托管说明一致；从HTTP可访问的完整目录验收，保留历史发布，不操作内网 |

复用 `npm run inventory`、`npm run build`、`npm test`、现有隔离build门禁、限时preview及已有桌面脚本；按新增来源/条件/回调风险补必要断言。无需把OpenResty运行、手机截图或Codex配置接入加回门槛。测试通过后仅因新改动、新失败或未解疑点扩大检查；隔离夹具mkdtemp并finally清理，用户原源码和历史产物保留。

## 分工、写集与交接

沿用已确认规划Astra low、实施Sol、审核Astra及主流控，不另建嵌套Agent。规划唯一永久写集是本文件。主冻结阶段/实现写集、准备固定来源、负责config与必要来源/build集成、补丁新增注册、coverage判定、HTTP/桌面和静态交付；Sol负责本地固定来源的研究、16项范围最小实现及后续全目录基础内容；Astra按阶段逐项审查并退回明确错误。

本计划不代其他角色写配置、代码、知识、来源记录或审核文件。主按实际实现分配精确文件范围，重叠文件由唯一责任方串行集成。首块冻结验收是“16项逐项正式构建边界与目录/非指令结论可核定，未知保留并拒绝错误输入”；C01最终另须主完成补丁注册、归档及既有范围闭合。来源暂缺不阻塞其他就绪项，全部阶段未完成时继续推进，不能以任意小批ready替代全站交付。
