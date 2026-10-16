# 网站完成阶段独立审核

日期：2026-10-10。审核角色沿用已确认的 Astra low；唯一永久写入为本文件。状态：candidate `1.27.1.1-c049ff9edb810ae4` 的59项新增基础内容实际接入、来源及旧项保持审核通过，1017注册/88basic/0deep/8参考，inventory_complete=false；C01/C02及网站整体验收尚未通过。前批注册/XSS核对及R07–R09关闭结论保持。下文准备状态保留历史依据，以最新阶段记录为准。

## 深度交互：当前真正未完成的工作

Q1–Q15 网站侧已要求的程序能力，在当前实际代码中未发现确定遗漏。既有 WEBSITE_REVIEW 已通过的 W01–W04 与查询/准确性修复继续有效，NDK 和 C-R05 已闭合且无变化，不重开。继续完成网站的最短路径是闭合发行版范围、逐项补基础知识并验收实际发布；不为“继续开发”另发明 UI、后端、图谱、在线问答或多文件能力。

当前 949 个注册项中只有 23 个 basic，另 926 项全部缺功能说明、语法及配置回调定义片段；16 个下载组件仍未核定范围。因此网站能查询注册身份和显示注册原文，不等于每条指令已经能回答功能及配置实现。此为 Q4/Q5 的内容与范围缺口，不是解析器、页面或静态读取的程序 bug。

23/949 只描述当前索引，949 不是最终发行版分母。43 下载项中的 14 本地来源和 13 Lua 库用途分类粒度不同，27 inspected 不能视为知识完成比例；扫描过也不自动等于全范围已经闭合。8 个 API/变量参考是独立样例，需求没有指定全量 API/变量数量，不能擅自扩为新的上线门槛。0 deep 及未提供部门样例分别保留，不用任意常用项或固定条数替代 Q6。

## 直接执行：只读检查范围与当前证据

已完整读取 REQUIREMENTS、WEBSITE_PLAN、WEBSITE_REVIEW；核对 IMPLEMENTATION_PLAN 与 CONTENT_PLAN 的范围判据，并读取实际 site/index.html、site/app.mjs、src/core 的 parser/context/matcher/Lua 边界名单、src/query/knowledge.mjs 的契约及读取路径，核对 inventory/build 的当前来源与核实状态生成逻辑。

直接读取 current index、全部 949 详情、references、components 和知识输入得出下文计数。site/app.mjs、site/index.html、src/query/knowledge.mjs、src/core/parser.mjs、src/core/matcher.mjs 与对应 dist 文件逐字相同，当前运行产物包含所查调用链。此次未重新运行无变化旧测试、浏览器、HTTP 或补丁回放；历史实测沿用既有通过记录，不冒称本线程新增实测。

固定读取 OpenResty `8c37412c31621225e7aa7e825b5b50106c9c71c4` 的下载脚本相关段，仅作剩余来源/补丁边界预读，没有执行脚本、获取新来源或操作原仓库。没有改现产品、知识输入、current 或其他文件。

## Q1–Q15 网站侧完成矩阵

“已接入”以实际调用路径及既有验收为依据；“待完成”不统一称作程序缺陷。

| 需求 | 当前网站侧证据 | 判断 |
|---|---|---|
| Q1 内部知识站 | 静态页面、目录、详情及共用知识已构建；README 有完整 dist 静态托管说明 | 程序已接入；实际内网托管另行验收 |
| Q2 理解与追溯 | 页面区分知识身份匹配、配置适用性与环境检查；不输出自动安全结论 | 已接入，无确定遗漏 |
| Q3 单条/片段/全文 | 页面 input-mode 调用 querySingle 或 parseConfig；原文位置、parent_index、context 和块层级保留，错误与未知 context 可见 | 已接入，沿用既有输入/异步验收 |
| Q4 全范围功能及配置入口 | renderDetail 显示功能/语法、入口与源码；build 对 basic 有内容与入口门禁 | 展示能力已接入；926 项基础内容未完成，深度内容待部门优先级 |
| Q5 固定发行范围 | 固定版本及来源进入 catalog/detail；同名以组件/模块/名称区分 | 版本化能力已接入；16 组件及全范围分母尚未闭合 |
| Q6 部门配置确定深度 | mechanism、related、phase 和 sources 可展示既有内容；需求未要求专用上传或优先级管理 UI | 部门样例/深度知识未验收；无据增加新程序功能 |
| Q7 外部文件不读取 | parser 记录 include/Lua 文件引用，single/config 页面提示未分析；查询读取只用知识 ID | 已接入，无多文件开发任务 |
| Q8 context/Lua/参考 | contexts 转移不猜未知块；Lua 名单与边界扫描隔离正文；参考库单独浏览且不入匹配分母 | 已接入，沿用既有边界及参考验收 |
| Q9 站内源码 | renderDetail/renderReference 显示 code、组件、版本、revision、路径、行号和固定链接；mechanism 与证据可展示已有链路 | 展示已接入；注册原文不代替尚缺的回调和深度内容 |
| Q10 静态、本地、不上传 | 输入交由浏览器 parser/matcher；client 发固定 JSON GET；静态 dist 可托管 | 已接入，实际内网部署未验收 |
| Q11 共用已有知识 | 网站使用共用 src/query；build 生成版本化数据，无运行时模型请求 | 已接入，无确定遗漏 |
| Q12 Agent 单项范围 | querySingle 调用 parseSingle 并明确 out_of_scope；不是网站全文入口限制 | 共用代码已具备；现场 Agent 验收后移 |
| Q13 JSON/Markdown/详情链接 | 同一 detail 生成返回结果及固定网站链接；页面读相同发布 | 共用契约已接入；不新增布局一致或 HTML 要求 |
| Q14 Codex 首个宿主 | 当前网站阶段无需 Codex 专属页面能力 | 真实宿主接入未验收且后移，不算网站程序 bug |
| Q15 静态知识/本地 MCP | 网站读取静态索引/详情；既有 stdio 工具和交付说明另列状态 | 网站侧已接入；不引入业务后端、DB、RAG 或监听服务 |

需求 3.1 的名称/模块/context/阶段浏览在 renderCatalog 的实际过滤和控件中存在；related 导航列同发布全部模块候选，参考失败隔离和固定旧链接能力沿用 WEBSITE_REVIEW。相关阶段仅显示实际数据：当前 934 项 phases 为空，不能据此判为缺少阶段导航或要求所有指令必须有请求阶段。

当前没有足够事实打回网站程序实现。此结论不是对未来实现或所有未提供输入的无限保证；新增需求不进入本轮矩阵。手机不在当前验收范围。

## 基础知识缺口的实际形态

| 组件 | 当前注册 | basic | 仅注册、待基础补齐 |
|---|---:|---:|---:|
| nginx | 724 | 13 | 711 |
| lua-nginx-module | 79 | 8 | 71 |
| stream-lua-nginx-module | 50 | 1 | 49 |
| echo-nginx-module | 19 | 0 | 19 |
| headers-more-nginx-module | 4 | 1 | 3 |
| xss-nginx-module | 6 | 0 | 6 |
| memc-nginx-module | 11 | 0 | 11 |
| srcache-nginx-module | 20 | 0 | 20 |
| ngx_devel_kit | 1 | 0 | 1 |
| set-misc-nginx-module | 29 | 0 | 29 |
| array-var-nginx-module | 4 | 0 | 4 |
| form-input-nginx-module | 2 | 0 | 2 |
| 合计 | 949 | 23 | 926 |

实际 knowledge/directives.json 为 23 项，与当前 basic 对应。926 条只有注册符号，summary/syntax 都为空，没有 configuration-definition 来源，亦没有可替代的部分研究正文；符号或六字段注册片段不能算配置入口定义已完成。所有当前详情 contexts_verified 为 true，证明现有 context 映射状态，不证明功能内容或部署可用。

23 basic 的补充状态仍有明确边界：默认值 16 verified、3 not_applicable、4 unverified；继承 4 verified、9 not_applicable、10 unverified；availability 均为 unverified。允许尚未核实的补充信息明示，不据这些状态重开已过内容，但不能把 23 basic 宣称为所有默认、依赖、废弃与部署条件全部完成。

后续全基础审核要逐指令验证功能、语法、所属模块/context、真实配置入口及固定来源；已核实默认/继承/限制须对应事实证据，补充未知保持可见。条件编译、模块依赖、废弃状态按实际代码、config 和文档核实；不能用批量模板摘要、callback 名称、当前 registration_count 或 build 成功替代内容审查。NDK 使用方的回调可能位于依赖组件，现 build.definition 只查所属组件/nginx；真正补相关 basic 时应按实际固定调用路径提供最小来源支持，不能猜错函数或把未找到降为完成。此为后续能力接入判据，不是当前仅注册批次的新缺陷。

## C01 剩余 16 组件逐项审核入口

下表仅锁定基线矩阵的组件和版本；“重点”是查证方向，不是提前认定有/无指令。新完整 SHA、树/归档与正式入口由主线程冻结后逐项核对。

| 组件 / 版本 | 固定来源预期 | 独立审核重点 |
|---|---|---|
| rds-json-nginx-module 0.17 | v0.17 | 正式 config、commands owner、条件和完整名称集合 |
| rds-csv-nginx-module 0.09 | v0.09 | 同上，不由名称/文件数推指令数 |
| drizzle-nginx-module 0.1.12 | v0.1.12 | 随包可选选择、客户端库依赖、正式 commands |
| lua-upstream-nginx-module 0.07 | v0.07；归档别名 ngx_lua_upstream | module commands 与 Lua API 注入分别查；空 commands 需正向入口证据 |
| iconv-nginx-module 0.14 | v0.14 | 正式 config、NDK 依赖、库条件、实际 literal/宏形态 |
| encrypted-session-nginx-module 0.09 | v0.09 | 正式 config、NDK/加密依赖及条件注册 |
| redis-nginx-module 0.3.9 | people.freebsd.org 的 ngx_http_redis-0.3.9 归档 | 原包身份与完整源码绑定，归档重命名、发行有效补丁及注册影响；不伪造 Git tag/SHA |
| ngx_postgres 1.0 | tag 1.0 | 可选构建及库依赖、正式 owner/注册链 |
| ngx_coolkit 0.2 | tag 0.2 | 正式 config、模块及 commands/依赖 |
| redis2-nginx-module 0.15 | v0.15 | 正式入口、完整注册、编译条件 |
| resty-cli 0.30 | v0.30 | 工具执行/安装入口、完整树及与 Nginx 的关系；不以调用 Nginx 推自己注册指令 |
| opm 0.0.8 | v0.0.8 | 工具/安装入口、完整树、模块注册路径是否存在 |
| lua-cjson 2.1.0.14 | tag 2.1.0.14 | 原生扩展构建与 Lua 加载/导出入口；有 C 不等于 Nginx commands |
| lua-redis-parser 0.13 | v0.13 | 原生扩展构建/导出与安装入口、正式范围 |
| lua-rds-parser 0.06 | v0.06 | 原生扩展构建/导出、发行后处理、正式范围 |
| lua-resty-signal 0.04 | v0.04 | 本机扩展和平台条件、构建/安装/加载链，不能沿用仅纯 Lua 分类门禁 |

Redis 固定发行脚本确有 variables_in_redis_pass、default_port_fix 以及 main_ver>=1.23.0 时的 remove_content_encoding 补丁。本批只审相关有效集合及新增事实，不重做已关闭的 Nginx C-R05。冻结计划已给出归档与真实维护者 Git 来源桥，来源准备独立复核见下文；实际 archive_evidence 门禁及补丁注册接入仍待产品 ready。

## C01 及后续 ready 的放行判据

| 判据 | 必须检查的证据 | 拒绝提前完成的情形 |
|---|---|---|
| WC-R01 来源身份 | 固定发行脚本下载版本/tag/归档别名、完整 revision/tree 或真实归档绑定；完整文件集合与原文可重现 | 浮动分支、树截断未补齐、错误版本、只有获取成功消息 |
| WC-R02 正式范围 | config/安装/加载入口 → 正式模块/API → commands 指针，必要 include/生成路径和排除依据 | 全 C/h 零命中、仓库名称猜用途、examples 混入、缺 owner |
| WC-R03 条件及提取 | literal/宏实际形态、flags、callback/post、guard、依赖/废弃、原文件行号 | 未支持宏静默忽略、拼接坐标冒充原文、按审核机条件裁掉注册 |
| WC-R04 无指令分类 | 完整固定树与正向工具/库/空 commands 证据，安装原文绑定真实 blob；实际调用链消费范围数据 | 把 native 库硬塞纯 Lua 分类、仅范围笔记而产物仍 pending 或误完成 |
| WC-R05 增量发布 | 冻结 candidate 的 catalog/index/details/references、固定片段和 URL、哈希/current/历史发布 | 同名跨模块合并、来源污染、新项未经基础核对即提升、旧内容误改 |
| WC-R06 覆盖收口 | 逐组件 pending 与实际范围证据对应，下载/模块/注册/基础/参考分开计数 | 机械 16→0 或 43 inspected 即置 inventory_complete:true |

剩余 16 项的注册增量暂不预设计数。新增目录阶段保持 registration_only、旧 23 basic/0 deep/8 参考 payload 保持；若冻结计划另有明确基础内容增量，逐项按其证据验收，不硬锁旧计数。新增分类范围也必须进入真实 inventory/build，不能只补报告。旧 basic 或 NDK 若无相关改动，沿用已过证据。

当前 build 把 inventory_complete:false 与 deep_verified_count:0 固定为未完成基线，符合现状态；未来宣称范围完成或深度新增时必须有事实判据和对应真实输出，不能仅改根文档或切换计数。范围闭合还需确认既有 local scan/零命中项的边界，新增 16 项全部分类本身不自动证明完整发行范围；不要求重复已核定且无变化的 NDK 或补丁事实。

后续收到冻结 WEBSITE_COMPLETION_PLAN 后完整读取，按其批次补最终矩阵。主明确新增 candidate ready 后锁完整 release_id，逐项审核新来源、增量目录及对应知识事实，并核对旧发布保持和 coverage；明确问题按具体文件/记录/证据打回 Sol 或主，修后按差异复核。产品、发布、内容及实际托管/部门样例分别结论，不提前通过。

## 当前结论

现网站程序已要求能力未发现确定遗漏。网站整体未完成的实质为发行版范围、全基础知识与正式样例/交付验收，当前 926 条已知基础缺口和 16 个来源 pending 明确。准备矩阵已落盘，新增实现及发布尚未 ready，网站完成阶段不判通过。

本线程未操作 browser/newspace、原源码或现产物；只写本 review。模型与审核职责保持，后续方案/来源/发布由各责任线程准备。

## 冻结 C01–C04 计划与来源准备复核

主线程确认冻结后，本线程已完整读取 WEBSITE_COMPLETION_PLAN 全文，包括修订后的 Redis 来源桥；没有沿用初稿 archive 分支作为返工要求。计划将 C01 范围、C02 全基础、C03 部门深度状态与 C04 通用网站交付分开，符合需求；没有加入新 UI、手机、Codex 实际接入或运行 OpenResty。首个 Sol 实施块仅负责 16 项范围，主负责 Redis 桥门禁、Nginx 补丁注册、配置/build 集成，审核没有发现计划范围的确定冲突。

### 16 项来源准备的实际检查

完整读取 REMAINING_SOURCE_PROVENANCE.json 的元数据及每项完整 files 清单，并独立比对本地固定对象。16 项组件集合与基线的 16 pending 集合完全相同，版本一致；15 项 GitHub 下载来源的 repository/tag 与发行矩阵一致，Redis 按单列归档桥处理。每项 tag 的 commit、完整 tree_sha、git ls-tree 的全路径及 blob SHA 与 manifest 逐条一致，合计 402 个文件，无截断或遗漏；16 仓库 status 均 clean。此为完整来源准备检查，未对 16 项正式构建/注册用途提前下结论。

| 组件 | 已独立比对的完整 revision | 文件数 |
|---|---|---:|
| rds-json-nginx-module | 2d7e07f7c39f98bbb2a8b07f4bae4d892f00329d | 40 |
| rds-csv-nginx-module | b4095fcb8a866835ddec7ea0c414b8a4af35741a | 27 |
| drizzle-nginx-module | fb6cf255d91135e18145a98a93947ead4e703b68 | 48 |
| lua-upstream-nginx-module | a84fbbb3d3b07684c232f642eccbc5334bafcbfe | 13 |
| iconv-nginx-module | 67d55c7edd3ab0535afa1e55ec8b2cdeb5167a82 | 12 |
| encrypted-session-nginx-module | 0f81b5728db0ece0f60c72354da69f158dc1d2a7 | 12 |
| redis-nginx-module | 411fef36e130129b670fa7f2672bcad6ab2cbdd3 | 9 |
| ngx_postgres | 681980598529f67fcec5c7448452046764a68429 | 43 |
| ngx_coolkit | 462b863babe121b900465b4ec8dfba612d723e9a | 15 |
| redis2-nginx-module | c989c829a2877132cb100f901e320921250e068d | 27 |
| resty-cli | 3022948ef3d670b915bcf7027bcdd917591b96e4 | 17 |
| opm | 315e56b907eb5edefa704df0b0fe286998e0317e | 61 |
| lua-cjson | 91ca29db9a4a4fd0eedaebcd5d5f3ba2ace5ae63 | 46 |
| lua-redis-parser | 2c5a4e960da7870ab29dd6001ba6a2828ce77760 | 11 |
| lua-rds-parser | 621e6b978983b4779435a56480ea636eae93d65d | 10 |
| lua-resty-signal | 737d8ccfaa59c08ad4d32a712611a856775a61c5 | 11 |

### Redis 来源桥独立复核

读取保留的 analysis/source-archives/ngx_http_redis-0.3.9.tar.gz，实际计算 SHA-256 为 21f87540f0a44b23ffa5df16fb3d788bc90803b255ef14f9c26e3847a6f26f46，与 manifest 一致；archive URL 与固定发行矩阵一致。仅在内存读取 tar 文件，不提取到源码目录。归档含单一 ngx_http_redis-0.3.9 根目录、9 个普通文件，无额外文件、符号链接或硬链接。

逐文件读取原包字节，独立计算 Git blob SHA，并与 manifest 和 `osokin/ngx_http_redis` 固定 411fef36e130129b670fa7f2672bcad6ab2cbdd3 的完整树/原文比较：全路径及字节全部一致，无 extras。tree 为 a49bbcdb17a6051ce75b324b8ba7f467857ba189。AUTHOR 原文列 Sergey A. Osokin 及 osa@FreeBSD.ORG，桥接对象为真实维护者来源，不是伪造 GitHub SHA 或归档 hash 替代 revision。

因此旧“归档如何进入 Git 引用仍待另行设计”的准备问题已闭合，后续按冻结最小桥方案验收，不新建 archive backend/ledger。实际 inventory 必须消费保留原包及 manifest：核 URL/版本/真实包 SHA、全路径和 blob，缺包、缺桥、额外/缺失文件、字节变化均拒绝，不只信 tree_matches:true；真实来源 repository 显式覆盖，禁止 fallback 到 nginx。门禁产品尚未 ready，本节不宣称门禁已经实现或负例通过。Redis 三补丁及回放注册结果仍需独立纳入实际目录及来源审核。

### Nginx 新注册集合是独立新增任务

本线程已读固定 `nginx-1.27.1-no_error_pages.patch` 和 `nginx-1.27.1-log_escape_non_ascii.patch` 原文，固定发行脚本 170–171、200–201 行应用这两项；原冻结34项审计列表亦包含它们。基线 current/catalog 的名称集合确实不含两项，故至少有两个确定的发行版注册范围遗漏，应由本批 C01 修复；不归为网站解析/UI bug，不重开旧匹配失败审核。

| 已知新项 | 固定 patch 注册事实 | ready 时仍须核对 |
|---|---|---|
| no_error_pages | HTTP main/server/location/if.location；NGX_CONF_NOARGS；callback ngx_http_core_no_error_pages | 实际回放最终 commands/ngx_http_core_module owner、条件与最终坐标；原 patch 注册来源 |
| log_escape_non_ascii | HTTP main/server/location；NGX_CONF_FLAG；callback ngx_conf_set_flag_slot | 实际回放最终 commands/ngx_http_log_module owner、条件与最终坐标；原 patch 注册来源 |

固定上游文件的 module initializer 分别引用 ngx_http_core_commands 和 ngx_http_log_commands，支持 owner 查证方向；最终核实仍以主 ready 的实际补丁后对象为准。本阶段未实际重放34项，也不把 patch 中 +ngx_string 命中当完整发行注册证明。两个名称不是增量上限：须对固定34项最终结果与上游注册集合做新增、修改、删除及身份差异对照，防止仅补这两项后漏其他差异。

新增发布的 registration 原文要指向固定 OpenResty patch 自身行号及 kind=openresty_patch；最终文件坐标与 SHA 另绑定回放证据，不能冒充 Nginx 上游 GitHub 行号。此任务复用已冻结的34项顺序、匹配及最终文件契约；没有新证据时不回头重审 C-R05 已过 failures。

### C01–C04 正式冻结审核矩阵

| 阶段 | 本线程完成判据 | 当前状态 |
|---|---|---|
| C01 首个16项块 | 来源与正式 config/安装/加载及 commands/API 用途逐项闭合；有指令目录完整，无指令有正向证据；未知留 pending；错误输入不污染已发布目录 | 来源准备已独立核对；Sol 范围实现未 ready |
| C01 主集成与最终范围 | Redis 桥门禁及3补丁可靠消费；既有27项范围边界充分；Nginx 全有效补丁注册差异进入实际目录；43项终态及未解边界闭合后才由证据产生 inventory_complete | 未 ready；16项关闭不自动通过 |
| C02 全基础 | 以 C01 最终身份集合逐条核功能/语法/context/真实 callback 定义、固定来源及逐事实补丁状态；必要跨组件显式定位；补充未知明示 | 尚未 ready；不靠生成摘要或固定数量放行 |
| C03 部门深度边界 | 无样例时明确正式深度未开始，不制造 deep 或任意部门清单；有样例后另定验收 | 部门样例未提供，保持未完成 |
| C04 通用网站交付 | C01/C02真通过，最终 release/current/旧链接/参考/静态交付一致；与变更相称的真实 HTTP/桌面及构建门禁有执行证据 | 尚未 ready；沿用旧程序能力，不新增功能 |

准备阶段结论：冻结计划与已成来源准备未发现确定阻断问题，Redis 桥独立复核通过；已知 Nginx 注册遗漏属于本批明确工作。后续实现和 candidate 未 ready，C01–C04 产品不判通过。永久仅更新本 review，未写任何源码、现产物、来源记录或其他文件。

## 新补丁注册脚本的提前设计检查

已完整读取 scripts/distribution-registrations.mjs，并只读对照既有 verify-nginx-patches CLI 输出结构和当前 build 来源生成路径。主线程报告已实际执行新脚本，得到两项新增且无删除/旧字段变化；本线程本阶段没有重跑任何34补丁门禁/回放，不将主执行结果称为独立实测。candidate 尚未 ready，以下是新 C01 比较门禁的确定不足，不是重开旧 audit。

### 已确认的正确接入方向

新脚本先校验 audit 的版本/revision 与当前固定源，调用已冻结的 CLI gate，再在自己的 mkdtemp 从固定 git archive 连续应用同34项和替换；最终文件与 gate 返回 final_files 的 SHA256 再比较。比较用真实补丁后文件而不是 patch 名称，finally 清理副本，未改原 audit。新增注册候选须与唯一实际 patch 原文的解析字段一致，owner 须在真实补丁后 records 核实并可在上游找到正式持有者。

primary registration 来源使用固定 OpenResty patch 自身坐标；当前读取确认 no_error_pages 为 patch:17–23，log_escape_non_ascii 为 patch:28–33。module-owner 指向实际原上游 initializer，distribution_patch 绑定 target_file/patched_sha256，不把回放目标行号冒充 GitHub 上游行号。record.registration_component 与 evidence.component 交由主后续 build 消费，此形态可以沿用公共 sources schema。检查时当前 build 尚未消费这些组件选择，这是已宣布的待集成工作，不当作 ready 缺陷。

### WC-R07 / P2：比较未包含注册第4、5字段

位置：scripts/distribution-registrations.mjs:9–10（fields 比较函数）及 before/after 集合对比。签名含 module/name、flags、callback、post、context_flags 和 compile_guards，但 extractCommands 的记录本来不含 ngx_command_t 初始化的 conf/offset 两字段。两字段决定 handler 写入哪层配置及哪个成员，属于注册语义，不能以其他字段一致证明其未变化。

独立纯内存复现使用当前 extractCommands 与从新脚本原文读取的实际 fields 函数：同一 probe 注册把 `NGX_HTTP_LOC_CONF_OFFSET, offsetof(conf_t, first)` 改为 `NGX_HTTP_MAIN_CONF_OFFSET, offsetof(conf_t, second)`，其他字段不变，fields(a)===fields(b) 返回 true。该形态会通过现“旧字段变化拒绝”检查；补丁候选比对同样不能用当前签名区分这两个字段。

本复现没有证明固定34项中已发生这种变化，也没有否定两条实际新增身份；它证明新“所有注册 semantic 无变化”门禁尚不足。最小补充是内部比较包含六个真实初始化字段，保留已有条件处理；公共发布 schema 无需扩展。新注册与 patch 原文的关联也用同一完整签名。增加针对 conf/offset 改动的必要负例即可，不改旧 audit、不重构整个提取器。

### WC-R08 / P2：重复身份被 Map 静默吞并

位置：scripts/distribution-registrations.mjs 的 previous/current Map 构造与 records.filter 的新增判定。Map 的 key 为 module/name，构造前没有检查重复；只要该 key 已在上游出现，补丁后增加的同身份项不会被算新增，也不必触发字段变化。

独立纯内存复现：一个 probe_module/probe 注册变为两条相同注册，extractCommands 返回2条，current Map 仅1项，现 records.filter 的新增集合为0。当前比较可把重复当成无变化；同名不同条件/字段也可能受最后覆盖影响。冻结计划要求身份无法支持时拒绝，不能任意合并。

最小补充是在构建比较 Map 前检查旧/新身份唯一性，未支持同 module/name 重复时直接拒绝并明确冲突；最终聚合也不能静默合并跨文件同身份。不同 module 的同名项仍保留。增加重复身份负例；不要求新增身份 schema 或支持全部条件变体。本复现没有声称当前真实集合已重复。

### 当前提前检查结论

WC-R07/08 打回主线程的新比较实现，均为本批新任务门禁问题；不重开 C-R05，也不要求改变冻结34项和47文件期望。两个新增 registration 原文来源/owner/最终hash设计方向符合计划。待两处最小修复与来源消费 ready 后，按差异及正式 candidate 复核；现阶段不判 C01 通过。

本阶段只读执行内存诊断，没有创建文件夹具、运行补丁或操作源码/产物，永久仅更新本 review。

## C02 XSS 六项基础知识准备审核

主线程独占 knowledge/directives.json，当前输入为29项，其中新增 XSS 六项；本线程只读，没有改正文。产品尚未正式 build/ready，current 仍为 1.27.1.1-7e53dde6171ab67c，因此本节仅为六项基础语义准备审核，不提升实际发布 basic 计数，也不表示 C02 全目录通过。

### 固定原文与检查范围

来源锁定 XSS v0.06 / 6c41076ac066c30c96d70e86da5400ffd49a6186。本线程完整读取固定 README.md、正式 config、filter module.c/header、实际编入的 util.c/util.h 及其 Ragel 输入 util.rl，没有执行生成器。配置入口、六字段注册、create/merge、header/body 分支均按原文核查；公共源码读取固定 Nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928 的 flag/string handlers、types slot/merge/default 初始化、配置合并宏及内容类型判断相关代码。

六项 component/module/name 与既有固定 catalog 完全对应，没有新指令身份；全部 context 为 http/http.server/http.location/http.if.location，注册 owner 为 ngx_http_xss_filter_module。47 项正文 evidence 范围全部有效，source_ids 闭合；测试规格片段仅作为第二信号阅读，没有运行 OpenResty 或上游 Test::Nginx。

| 指令 | 逐事实独立结论 |
|---|---|
| xss_get | 默认 off；自有配置回调置 requires_filter 后调用 flag slot。主请求、GET、开关、状态、callback 参数、输入 MIME 和回调值校验共同控制进入过滤；body 只插入 callback 前缀及结束 );，没有 JSON 解析/验证。正文没有把开关写成所有响应必然包装。 |
| xss_callback_arg | string slot 保存的是查询参数名；header 用该名字调用 ngx_http_arg 取得值，URI 解码、校验后才作为 ctx.callback。空名字/参数缺失/值不通过会跳过。默认空串，字符串重复配置拒绝；配置值本身没有被变量求值或执行 JavaScript。 |
| xss_check_status | 默认 on；只让200/201经过这一状态门槛。off 只取消该门槛，其他条件仍保留，与后续 override 独立。 |
| xss_override_status | merge 实际默认1。README 对应默认行误写 xss_check_status，正文已以代码纠正；仅在已进入转换的 header 分支、status>=NGX_HTTP_SPECIAL_RESPONSE 时改200，off 不取消输出类型和包装。没有把它写成自动绕过 check_status。 |
| xss_input_types | 筛的是响应 MIME。默认 application/json；注册 post 指向默认类型首项，types slot 首次显式配置先加入它再追加参数，因此 text/plain 不排除 JSON。* 设置特殊全类型哨兵，重复键警告并跳过。本层配置构建自己的集合，不追加父层集合；未配置时按真实 types merge 继承/初始化。 |
| xss_output_type | 默认 application/x-javascript；进入转换后改响应 Content-Type，未进入者保留原类型。NGX_CONF_1MORE 允许多参数，但 ngx_conf_set_str_slot 仅赋 value[1]，正文已明确额外参数不是多个输出类型；重复层级配置拒绝、未设置时按 string merge 继承。 |

默认/继承结论分别对照 NGX_CONF_UNSET 和字符串 data==NULL 的实际合并语义；没有把明确配置为空字符串等同于未配置。回调值的校验读取实际生成 util.c：须达到接受状态并消费完整输入；没有把这一校验写成 JSON 或任意 JavaScript 语义验证。此为基础事实审核，没有要求额外运行时深度链路或新增机制功能。

### 局部 patch 结论及发布待验

固定发行脚本 XSS 获取段未对该模块源码应用补丁；本线程按冻结审计的 patched_sha256 47目标表核对，ngx_conf_file.c、ngx_conf_file.h、ngx_http.c 均不在目标集合，支持所用公共配置入口及合并逻辑的局部结论。当前 note 明确不涵盖整个输出过滤链或实际环境，没有由文件不变推出全局 unaffected；本节不重跑或更改34项 gate，不重开 C-R05。

六项均有真实 module config 依赖说明，并明确部署二进制是否含模块仍未知；没有把 availability 核实写成环境启用。phase=output-filter 只是所列相关阶段，不作深度计数。当前六项正文、默认/继承、限制及局部 patch 表述未发现确定差错，无需打回主线程知识实施。

主新增 test/distribution.test.mjs 两项已只读检查：真实补丁注册来源/owner 回放测试，以及显式 callback 来源只接受函数定义、错误来源拒绝且旧 current 保留的隔离测试。主报告两项针对性执行已通过；首次夹具缺 symlink/cp 的失败及后续修复属于测试准备记录，不作为产品逻辑返工理由。本线程未运行这两项，不凭其通过关闭前节 WC-R07/08（完整字段比较与重复身份是各自判据）。

后续主明确 candidate ready 时，独立核六项实际详情与本次知识输入逐字段一致、来源原文/版本/坐标及 callback 定义、default/types/局部 patch 状态、29 basic 或实际范围增量计数；旧23项和8参考按真实变更核保持，注册集合及 C01 未完范围仍另验。当前只确认六项语义准备核对通过，不宣称发布已29 basic、C01或全C02完成。永久仅写本 review。

## WC-R07 / WC-R08 最小修复差异复核

已完整读取修后 distribution-registrations.mjs 和 distribution.test.mjs，并检查 inventory 调用点。主报告该测试文件3/3通过；本线程仅精准运行纯比较负例，1/1通过、0失败/跳过，没有重新运行34补丁或旧 C-R05。实际 current 仍为 1.27.1.1-7e53dde6171ab67c。

WC-R07 关闭：fields 改为读取注册原始行范围，去注释及空白后比较完整初始化文本，同时保留 module/name、context_flags 和 compile_guards；第4/5字段及项内预处理分支进入比较。补丁原文候选关联也使用同一完整签名，不再复用遗漏字段的旧记录签名。实际针对性测试分别改变 conf/offset 均拒绝；本线程另以纯内存调用 registrationChanges 改变项内 #if 条件，实际拒绝。没有增加公共发布字段或改旧 audit。

WC-R08 比较实现修复通过：registrationChanges 在构造 previous/current Map 前分别检查旧/新集合唯一性；nginxPatchRegistrations 的 identities 从必传 existingDirectives 构造，先拒绝旧底集重复，再对每个新增项检查与完整旧底集或此前新增项冲突。跨文件聚合使用同一个 identities Set；不同 module 同名不会被合并。

独立实测新集合重复负例通过；另外调用实际函数确认旧集合重复、完整底集重复和缺失 existingDirectives 都在进入 patch gate 前拒绝，undefined 没有回退为空数组。只读核当前原 Nginx 底集为724条、724个唯一 module/name。新增冲突分支按代码核查，本线程没有为此重复真实34项回放；主3/3正例与本线程负例执行分别记录。

检查时 scripts/inventory.mjs 的实际调用仍未传 existingDirectives，符合主已通知 Sol 更新且实现尚未 ready 的状态。该已知集成项不重新作为额外设计缺陷打回，但 WC-R08 端到端收口需在 Sol ready 后确认调用传入本次固定扫描的完整 Nginx 底集（排除已追加 distribution_patch 项），不能传局部 touched 文件集合、undefined 或空数组。724是本冻结上游的核查值，不要求在实现中硬编码计数。

当前结论：R07 已关闭；R08 算法修复已通过，正式调用接入待 ready 复核。C01及产品仍未通过，新增30本地来源配置不代替范围证据或实际发布审核。未操作源码/产物、浏览器或旧门禁，永久仅更新本 review。

## C01 首个16项范围实现独立审核

本节锁定 Sol 已 ready 的 remaining-scope 实现与主当前16项 source 配置，不锁定尚未通知 ready 的正式发布。完整读取 REMAINING_SCOPE_NOTES、相应 inventory 实现和 remaining-scope.test，沿用此前已核的16个固定 SHA/402文件来源清单。新增固定源码读取均使用 git show，不借工作树文本作来源；未重新执行旧34补丁审计或无变化 NDK/C-R05。

### 正式输入与分类

九个指令模块的完整 config、commands 数组及实际 module initializer 已逐项读取，核对正式源路径与 owner。固定原文对应 rds-json 10、rds-csv 6、drizzle 12、iconv 3、encrypted-session 5、Redis 8、postgres 10、coolkit 1、redis2 11，共66项；本节确认的是原始注册输入，不将它们提升为 basic。

config 中 libdrizzle/libpq/iconv 检测及 NDK 依赖与注册目录分开理解，不把收录解释为默认启用或实际部署可用。Redis 的 redis_bind 版本 guard 保留；coolkit 变量不混入指令；redis2 正式输入引用已提交 reply.c，Ragel 输入不另算 commands，也未运行生成器。全固定树 C/h 类型搜索只用于交叉查漏，正式 config 和 initializer 才是这九项输入闭合的依据。

| 无自有指令组件 | 独立核对的正向依据 |
|---|---|
| lua-upstream | config 编入 module.c；module 第三字段 NULL；ctx 的 postconfiguration 指向 init，后者实际 preload ngx.upstream 并建立 Lua API 表。不是“没有扫描到”即完成。 |
| lua-cjson | Makefile 构建/安装 cjson.so，实际 luaopen_cjson/safe 入口；另完整读取 CMakeLists 的 MODULE 构建和 Lua 模块安装路径，未见 Nginx 注册 owner。 |
| lua-redis-parser / lua-rds-parser | Makefile 的共享 parser.so 目标及 Lua 子目录安装，分别对应真实 luaopen_redis_parser / luaopen_rds_parser。原生 Lua 扩展不冒称纯 Lua。 |
| lua-resty-signal | Makefile 构建/安装 librestysignal.so，Lua loader 的 ffi.load/cdef 与 C 函数定义连通，属于 FFI 库。 |
| resty-cli / opm | 固定 OpenResty configure 的 auto_complete 与 INSTALL bin/*，对应 Perl CLI 原文。仓库服务端模板与生成配置字符串不属于发行 CLI 自有 commands。 |

七项 evidence 的文件、行号、原文和跨组件 revision 已对照固定对象。现分类 gate 是这批真实形态的有限检查，不是通用构建解释器；本节通过包含上述人工源码链路核对，不仅依赖正则命中。

### 门禁与独立实测

本线程实际运行 `node --test test/remaining-scope.test.mjs`：4/4通过，0失败、0跳过。测试仅在临时隔离目录执行并 finally 清理，没有运行正式 inventory/build；测试配置不加载 Nginx patch audit。

- 真实16输入逐项比较66名称、owner、固定 revision/repository、原文坐标、registration_only、Redis guard、七项正向用途及九文件来源桥，而非仅比较总数。
- 错误分类、缺失/重复证据、错误文件/范围/组件、断开的安装或 API 入口、scope_review 与 registration_inputs 并用，以及实际指令模块被错误分类为无指令，均拒绝且保留隔离旧目录。
- Redis 门禁实际重算原包 SHA 和全部 tar 成员 Git blob，要求原包/证据清单/固定树完整一致，并检查实际 origin。错误 URL/SHA/revision、缺项/多项/错误 blob，以及改写 AUTHOR 后重新打包并谎称 tree_matches 的负例均拒绝。没有信任输入布尔值代替字节核实。
- 九个真实 commands 原文注入未知注册宏均拒绝；不以静默跳过宏实现66条的表面成功。

按代码核对，来源/范围及补丁检查都在本次输出写入之前完成。scope_complete 只接受三个明确的范围检查终态，旧 local scan 或未发现 C 注册不再自动闭合；实现没有直接把43 inspected写成 inventory_complete=true。

### R08 收口及后续边界

WC-R08 的调用接入现已核实并关闭：inventory 在全部 source 扫描后、追加 distribution_patch 之前，将本次 directives 中全部 component=nginx 的记录传给必需的 existingDirectives。不是 touched 文件子集、旧产物、undefined 或空数组回退；与前节已通过的完整字段/唯一性检查连通。本次不重复真实34补丁回放，正式产物中新增集合及来源绑定仍需 ready 后核对。

本16项范围实现子阶段未发现新的确定缺陷，可以进入主集成；这不等于 C01或发布通过。66加patch两项仍只是集成预期，不能在本节据此宣称 current 已1017。第二子阶段的 LuaJIT/core 正向用途、旧模块正式构建范围、Nginx auto/build 输入及发行补丁范围、Redis三个补丁的影响和最终全局完成判定仍待 ready 证据。

XSS六项基础语义准备通过保持有效，正式详情接入另验；未启用的 Git 文档来源及 clone 重试不作为本16项 C01构建阻断，也不提前算入知识完成。待主明确候选 release ready 后，再核真实 catalog/详情/来源/参考/完成元数据及旧项保持情况。本轮永久仅更新本 review，未操作浏览器、源码或现发布产物。

## patch hook 命令行加载修复复核

主报告真实 CLI 曾以 exit13 暴露未完成的顶层 await，随后将 inventory 对 distribution-registrations 的动态导入改为顶端静态导入。本线程核实当前文件已采用该最小改动：patch 调用仍受 config.nginx_patch_audit 控制，完整 existingDirectives、追加顺序和输出前检查均未改变。两模块仍有静态循环依赖，但导出的函数声明与延迟调用没有在模块初始化时提前读取未初始化值；未新增顶层回放或其他文件写入副作用。主报告的 red 历史单独保留，本线程未重建旧失败版本。

完整读取新增真实 CLI 测试后，本线程实际运行 `node --test --test-name-pattern='真实盘点命令行' test/distribution.test.mjs`，退出0，1/1通过、0失败/跳过，约9秒。该测试以独立 Node 子进程执行真实 scripts/inventory.mjs --config，配置和输出均位于 mkdtemp；来源、原包及旧范围证据使用绝对只读路径。断言实际输出计数与落盘 catalog 相符、所有下载组件已 inspected、补丁新增恰为两项并含 Redis，finally 清理临时目录。

这次为验证新增 CLI 加载路径而运行，会正常调用已冻结 patch gate及隔离回放；没有重审或修改旧34项审计，也不把 inspected 相等断言当成 C01完成判据。此结果补上此前只验证函数导入调用所未覆盖的真实入口；当前 patch hook 修复未发现阻断问题，R07/R08及16项子阶段结论保持。

本节不宣称正式 inventory/build已成功，不判任何 stage 为 C01通过；等待主明确 candidate ready 后审实际发布。文档来源仍未启用不算知识输入，XSS六项准备通过保持；不操作主已创建的 Space8/p1。永久仅写本 review。

## 首批正式 candidate 5f8eaad2509aaff6 独立核对

审核对象锁定 `1.27.1.1-5f8eaad2509aaff6`，旧基线为 `1.27.1.1-7e53dde6171ab67c`。直接读取两个不可变 release 的 index及全部旧949详情、新68详情和 references；检查开始、结束时 current index均与本 candidate index相同。本节是新增注册/XSS接入的候选核对，不宣称C01/C02全完成，也没有执行浏览器验收。

### 实际发布集合与旧项保持

实际 index为1017个唯一身份，29 basic、988 registration_only、0 deep；8项reference，inventory_complete=false。新增恰为前节九模块66项加HTTP log的log_escape_non_ascii、HTTP core的no_error_pages，旧949身份无删除。所有详情路径均指向本release，不混用其他候选。43 inspected的来源矩阵没有替代全范围闭合判据。

逐字段比较旧949详情，仅去除release_id：943项完全不变，包括旧23 basic；另六项恰为XSS，增加syntax/summary/defaults/inheritance/limitations/availability、callback来源、文档、局部patch结论和相关项等预期基础知识。六项的身份及contexts未变。8项reference payload逐字段相同；不把整个949都称为无变化，也未将预期XSS变化当作回归。

### 新68项逐条发布核对

逐条核catalog与详情的component/module/name、callback、contexts、contexts_verified及compile_guards；以固定源commands再次解析比对flags、callback、post、context_flags和guard。九模块66项保持registration_only，未出现凭注册原文补造summary/syntax/basic的情况。包含HTTP if.server等真实context，不以统一http/location模板覆盖实际标志。

全部新项共有202段发布source，逐段从其完整revision执行git show，核原文逐字、起止行、组件版本、固定revision及GitHub链接均一致。注册source保留完整初始化原文，包括conf/offset，而非只有提取器投影字段；module-owner和registration-container与固定commands/initializer对应。Redis版本guard仍可见，既有NDK详情未变。

两项发行补丁新增分别以固定OpenResty patch的28–33行、17–23行作为registration，kind=openresty_patch；owner仍指向固定Nginx原始module initializer。重新解析实际patch新增片段并结合owner，flags/callback/post/context/guard与catalog吻合；完整六字段原文已按固定patch字节核实。distribution_patch目标hash与本次matrix.patch_scope.final_files一致，发布notes说明回放目标及hash，没有用回放后目标行号伪装上游GitHub坐标。两项verified_affected仅表示补丁新增注册，仍registration_only，不误报功能完成。本节复用前轮真实CLI隔离回放结果，没有再运行旧34项审计。

### XSS六项由准备状态进入本候选

实际六项详情均basic_verified。summary、syntax、defaults、inheritance、limitations、patch_status、related、phase及availability与已审核知识输入逐字段一致；source_ids全部闭合。六项共有65段发布来源（含注册、回调、47项知识证据及发行版本来源），全部与固定Git原文/行号/版本/链接逐段一致；configuration-definition包含实际对应函数定义，不是声明或调用片段。

此前语义结论在本候选保持：callback_arg保存参数名而非回调值；override默认1并以代码处理README笔误；input_types显式设置仍先加入application/json，*为全类型哨兵；output_type虽1MORE但string slot只保存首参数；所列局部patch_unaffected不外推整个响应链。六项不产生deep，也不改变旧23项事实。未启用的外部Git文档源没有混入本次发布证据。

候选子批结论：新增68注册和XSS六项实际接入核对通过，未发现确定发布缺陷；不是C01或C02整体通过。988个registration_only仍是基础内容缺口，旧模块/Nginx构建与发行范围闭合仍另验。

## core / LuaJIT 两分类准备独立审核

完整读取Sol追加notes、两个scope分支、两个新增测试及主接入配置。固定LuaJIT `33d6b04681d2f079a6d013988a426a841c52e29e` 的src/Makefile:501–763包含对象集合、DynASM/buildvm生成、VM对象及CLI/静态库/动态库链接；根Makefile:92–147对应实际安装名字、进入src及条件安装。读取真实main与带LJ_64条件的VM创建函数，并另核固定lua.h的lua_open宏、lib_aux.c的luaL_newstate到两个VM创建器分支。生成输入属于运行时内部，不当作Nginx commands；未运行生成器、编译器或LuaJIT。

固定core `2da3d7719a05b2981f3808ca874517b558f29fa9` 的Makefile与core.lua入口均已读取；四组Lua安装覆盖生产lib文件，require指向真实已安装模块，http条件原文保留。native/生成文件排除按完整固定树进行；“Lua源码库”不表示不存在FFI或宿主运行依赖。没有重扫旧13项远程来源。

本线程定向执行 `node --test --test-name-pattern='旧两来源' test/remaining-scope.test.mjs`，2/2通过、0失败/跳过。正例实际核证据原文、VM条件、零注册；隔离core工作树被改坏并加入未跟踪C后结果仍使用固定树。17类负例覆盖截断构建/安装/入口、漏安装目录、错分类/revision和原生signal冒充纯Lua，均拒绝且保留隔离旧输出；临时目录finally清理。只读git status确认用户两仓库仍clean。

两分类准备实现核对通过，但本candidate对应正式matrix中的两项仍是local_c_registration_scan/library-or-tool，尚未消费新配置；不将当前配置冒充本release已发布状态。须待主下一次正式inventory/build ready后再核新分类实际落盘。

主报告74测试曾73pass/1fail，旧断言把signal认作not_inspected。本线程检查修正后测试，保留旧13项reference-only证据检查，并要求signal的fixed_build_and_entry_review/lua_ffi_library/零注册及native-entry；定向运行该测试1/1通过、退出0。没有重跑或宣称74全测已通过。echo+headers22项仍未ready，不纳入本次知识放行。本轮只永久更新本review，不操作Space8或任何产品文件。

## Redis 三补丁 scope 准备审核

完整读取REDIS_PATCH_AUDIT.json、redisPatchScope、inventory调用及新增测试；从固定OpenResty `8c37412c31621225e7aa7e825b5b50106c9c71c4` 读取发行处理段及三patch全文。Redis原始固定对象仍为 `411fef36e130129b670fa7f2672bcad6ab2cbdd3`；此前九文件原包桥结论保持。本节不是正式新scope发布验收。

实际顺序为variables_in_redis_pass、default_port_fix、remove_content_encoding。发行脚本第706行按main_ver>=1.23.0判定第三项，707–712行为条件块，固定1.27.1.1满足条件。当前audit记录692–715完整段；三项均修改ngx_http_redis_module.c。inventory先执行来源桥及范围核对，再在任何输出写入前消费redisPatchScope并赋matrix.redis.patch_scope，没有自动把模块标成verified_unaffected。

本线程实际运行 `node --test --test-name-pattern='Redis 三项补丁' test/distribution.test.mjs`：1/1通过、0失败/跳过。正例真实固定Git archive隔离回放三patch，逐hunk匹配、目标集合和最终SHA均通过；第2项hunk1实际line1023、offset2、fuzz0，其他hunk offset/fuzz均0。最终目标SHA256为 `a22574b45a0ee2be65626d9cdc4bc5d4f7d4215a5aa22f31d8952d1f68d4db2a`。与原源比较使用此前已核完整注册初始化签名及guard，8条注册无新增、删除或字段变化。六个现有负例（offset误设0、少hunk记录、坏SHA、逆序、处理段截至706、错revision）均拒绝。临时副本finally清理，未重跑Nginx旧34项gate。

注册不变不等于运行时不受影响：第一项实际增加redis_pass变量目标编译/求值及upstream选择，第二项改变default_port比较的版本条件，第三项移除对headers_in.content_encoding成员赋值。后续基础知识须逐事实处理这些差异，不得沿用原源行为后笼统宣称unaffected；本节没有提前给Redis八项basic或运行时正确性结论。

### WC-R09 / P2：处理段缺少条件结束仍被门禁接受

位置：scripts/distribution-registrations.mjs:35–41。当前处理段门禁只要求ver声明、版本比较字串及三条patch命令顺序存在，没有验证第三项所在if/fi完整。现有截至706的负例因第三条patch已缺失而失败，没有覆盖三条patch齐全但条件块未闭合的边界。

独立纯内存复现从实际脚本截取原样的chain构造与if拒绝条件，用固定mirror-tarballs原文分别传入692–715、692–710、692–706：前两者均接受，最后一项拒绝；692–710明确不含第712行fi。后续回放仅依据同一audit.patches与targets，不再读取processing，故无法在后续检查识别该截断。本复现不修改任何audit或源码，也没有声称当前正确的692–715记录已产生错误回放。

最小修复：只针对固定发行链的真实形态，验证版本比较与其对应条件块完整包住第三patch，至少拒绝缺闭合fi的范围；增加end_line=710负例。无需通用shell解释器或重开Nginx补丁审计。R09打回主线程的Redis新门禁；三项当前实际回放、目标hash及8条注册保持结论成立，但发行处理链完整性准备尚未全部通过。修复后按差异复核，再待正式candidate确认scope落盘；C01仍未通过。永久仅写本review，未操作浏览器或Git文档配置。

## CORE_EVENTS 35项基础草稿独立审核

对象为analysis/content/CORE_EVENTS_BASIC.json，审核时SHA256 `ebb12a51ac61a94d39477009ab56c0cdb99ae00ea1e2018710831d8fa755df1f`。本节仅审核草稿准备，不合并knowledge、不执行正式build。结束时current仍为 `1.27.1.1-5f8eaad2509aaff6` 的29 basic；64 basic只是主后续隔离集成预期，不作为本次发布结论。此前candidate子批及core/LuaJIT准备结论保持，Redis R09待主明确修复ready后复核。

### 差集、来源与入口

按当前固定catalog的Nginx core/event/misc源路径核40项，减去既有worker_processes、worker_connections、multi_accept、accept_mutex、accept_mutex_delay五项，所得身份集合与草稿35项严格相等，无重复、遗漏或覆盖旧知识。main error_log仍属于ngx_errlog_module，不合并其他模块同名项。

源码读取固定Nginx `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`；官方文档读取 `e8b581903e9d41252720053311cea687a5671674`。实际文档仓库origin为nginx/nginx.org、HEAD等于该完整SHA、git status为空，commit日期为2024-08-15，与配置版本标签相符。26个XML证据逐项定位到对应directive元素并读取全文；另九个平台项无XML，不制造文档引用：devpoll_changes/events、epoll_events、eventport_events、iocp_threads、post_acceptex、acceptex_read、kqueue_changes/events。

35个callback_definition逐项比对catalog回调符号，固定范围均以真实对应函数定义起始，不是声明或调用；范围是明确的40行入口片段，不将长函数截取声称为完整函数。全文读取每项所列implementation与必要公共handler、26个XML及五个不同runtime-patch引用。所有证据坐标有效，证据id唯一且各source_ids闭合；defaults/inheritance均保持unverified，没有因XML存在默认值就冒称环境默认或继承已核实。

### 逐项语义结论

下表均为本草稿所列基础事实核对通过，不代表完整机制研究或实际平台运行验收。

| 指令 | 核对要点 |
|---|---|
| daemon | 非Windows后台化条件与flag slot一致；父进程销毁cycle池的补丁影响单列。 |
| master_process | master/worker与single分支区分正确；privileged agent扩展不冒称已启用。 |
| timer_resolution | 缓存时间更新精度、后端timer及SIGALRM路径有据；不是固定轮询等待或请求超时。 |
| pid | pid/oldpid构造、prefix补全及启动创建PID文件有据；构建常量不当作部门路径。 |
| lock_file | 文件锁前缀与原子操作平台区别正确；重载保留旧路径及记录错误有据。 |
| debug_points | stop对应SIGSTOP，abort对应中止；不保证生成core文件。 |
| user | 省略group按同名组查找，Windows及非root忽略；privileged agent不走普通降权路径。 |
| worker_priority | 有符号nice值解析与setpriority调用相符；不是请求优先级，不保证权限允许。 |
| worker_cpu_affinity | 掩码、auto及可选限制掩码有据；不支持平台忽略，不解释成CPU使用率。 |
| worker_rlimit_nofile | RLIMIT_NOFILE软硬值及失败日志有据；文件描述符上限不等于客户端连接数。 |
| worker_rlimit_core | RLIMIT_CORE软硬值有据；文件大小许可不保证产生core。 |
| worker_shutdown_timeout | 退出timer及连接遍历/跳过条件相符；到期调用符合条件连接的读handler，不描述为强杀进程。 |
| working_directory | 初始化chdir及失败退出有据；与HTTP root/alias分开。 |
| env | 保留已有变量或设置name=value，环境构造与XML相符；不声称可重配已初始化系统库。 |
| load_module | dlopen、模块符号与ngx_add_module路径有据；modules_used过晚拒绝，不执行动态加载。 |
| include | 实际解析文件/通配与conf_prefix有据；网站不读取未提供文件的边界保持。 |
| error_log | main层目的地/级别与文件、stderr、syslog、debug memory分支有据；捕获日志补丁单列。 |
| pcre_jit | 配置阶段正则的JIT与PCRE/PCRE2检查相符；不支持时post置off，不混同LuaJIT。 |
| thread_pool | threads非零、同名重复拒绝、max_queue溢出报错有据；privileged agent可初始化的补丁影响明确。 |
| devpoll_changes | 变更列表容量及满列表write路径相符，不是连接数。 |
| devpoll_events | 返回数组容量与DP_POLL的dp_nfds相符。 |
| epoll_events | 数组容量与epoll_wait maxevents相符，不替代worker_connections。 |
| worker_aio_requests | Linux文件AIO的io_setup容量，不是Lua请求或aio threads线程数。 |
| eventport_events | event_list容量及port_getn上限相符，不是在线连接数。 |
| iocp_threads | CreateIoCompletionPort并发参数有据，不声称创建同数线程或worker。 |
| post_acceptex | 每监听项初始投递数量及循环有据；完成后的补投递另行区分。 |
| acceptex_read | Windows HTTP监听项按client_header_buffer_size设置预接收空间，传给AcceptEx。 |
| kqueue_changes | change_list容量与批量kevent提交有据，不是每秒变更数。 |
| kqueue_events | event_list容量与kevent返回批量相符，不代表系统最大并发。 |
| events | 创建事件模块配置、切换events上下文、解析及init_conf链完整；重复块拒绝。 |
| use | 按已编入事件模块名称选择；single重载不能更换类型，不描述为动态安装后端。 |
| debug_connection | 地址/CIDR/主机名解析与unix形式、连接日志位匹配；NGX_DEBUG与平台条件明确。 |
| ssl_engine | ENGINE查找及设默认方法提供者有据；无ENGINE或失败拒绝，不混同证书配置。 |
| quic_bpf | QUIC/reuseport路径与固定XML的eBPF迁移用途、Linux版本限制一致；未推断部署可用。 |
| google_perftools_profiles | ProfilerStart的前缀.PID文件名有据；库与模块构建前提明确。 |

### 新知识引用的实际补丁核对

为验证本批新增事实引用，本线程在mkdtemp中从固定Git archive实际应用冻结的34项及原核定替换，47个最终目标SHA256全部等于既有audit；finally清理临时副本。此为新增知识slice验证，不修改audit、不重开C-R05旧匹配问题、不编译运行Nginx。

逐项检查35个callback入口和54个implementation引用，共89段：87段原文在最终文件中保持，只有timer_resolution的ngx_event.c:195–223、user的ngx_process_cycle.c:799–833两段不再原样存在。两项已标verified_affected，并分别引用延迟队列把poll timeout置0及privileged agent跳过降权条件的真实patch。

同时不以slice未变推导整条运行路径unaffected：daemon、master_process、error_log、thread_pool另有对应父进程清理、特权进程管理、日志捕获、线程池初始化patch，草稿均显式标affected并限定说明。其余29项的unaffected表述仅针对所列配置入口/功能对象/限制，不外推整个进程/事件循环或实际环境；本次原文与patch核对未发现相反证据。

结论：35项基础草稿的差集、语义、固定来源及局部patch实证准备审核通过，无确定缺陷需要打回。后续仍需主明确新candidate ready，再核实际详情/来源、旧29basic及8reference保持、计数和完成元数据。本线程未合并或修改草稿/知识；echo+headers22项等待正式ready消息后另审，不以本节通过替代。永久仅更新本review。

## Echo / Headers More 22项独立语义审核

已完整读取ECHO_HEADERS_CONTENT_NOTES及22项JSON内容，冻结JSON SHA256为 `015542f82aff8675cb269d2a661463f88ea994f7fd8f80bf356c19d88e572a85`，与Sol交接一致。19项Echo锁定 `8376edc2bbc427e8812d105f4061045449e0db2b`，3项Headers More锁定 `06dc0be56e5ec9f7fd814e881b066b5540a85bec`。以正式catalog中两模块23条减既有more_set_headers，精确得到这22个唯一身份；没有改旧项或把不同模块同名项合并。

本线程读取实际配置helper、每个配置回调、命令分派、请求执行函数、正文过滤器、输入/输出头解析及更新、rewrite移位和merge实现；核对关键README与测试规格冲突。正式config分别编入12个Echo C文件、4个Headers More C文件。逐项复算固定注册：Echo只含location/location内if，Headers More三项含http/server/location/location内if而不含server内if；注册级guard为空并不表示部署启用。22个callback对应真实函数定义，echo_status明确定位固定Nginx数字slot；209个回调/证据范围有效，事实source_ids闭合。语义通过依据下表的真实代码，不仅依据上述结构校验。

| 指令 | 独立源码结论 |
|---|---|
| echo | handler helper安装内容处理器；参数空格连接、默认换行、-n/--及变量参数不重新解释为选项符合实际eval/输出路径。 |
| echo_request_body | 只转交已读bufs，复制非特殊缓冲描述符并清除终止标记；不自行读取请求体。 |
| echo_sleep | 三位定点解析后添加请求timer并返回AGAIN，由回调恢复；源码没有README所说的额外最小正时长检查。 |
| echo_flush | 实际发送NGX_HTTP_FLUSH特殊缓冲，不保证网络即时可见或绕过子请求排序。 |
| echo_blocking_sleep | 实际调用ngx_msleep，阻塞当前worker，与请求级异步sleep分开。 |
| echo_reset_timer | 更新缓存时间和ctx.timer_begin，elapsed据此求差；不改系统时钟或请求超时。 |
| echo_before_body | before_body_cmds在首个有效正文链前运行，复用echo输出；无链/header_only跳过，不是独立内容处理器。 |
| echo_after_body | 检测终止标记、提交原正文后追加并补新终止缓冲；实际支持-n/--，不会因README简写遗漏而禁用。 |
| echo_location_async | GET子请求，URI解析可分离查询串，显式第二参数优先；发起成功继续命令，不表示整体响应完成。 |
| echo_location | GET子请求设置完成回调并返回AGAIN，随后恢复父请求；“同步”不表示阻塞worker，查询串按实现纠正文档旧说法。 |
| echo_subrequest_async | 解析方法/URI/-q/-b/-f，创建后调整请求字段；非空-b优先，否则用-f文件缓冲，不合并两种正文。 |
| echo_subrequest | 同一请求描述解析，设置完成回调并请求级等待；不提供命名location跳转。 |
| echo_duplicate | 计数解析忽略下划线、拒绝负号等字符；一次分配结果大小缓冲并复制，不补换行，零/空串无重复正文。 |
| echo_read_request_body | 核心读取入口与完成回调有据，自身不输出；临时文件与$request_body变量的区别保留。 |
| echo_foreach_split | 字面分隔、非空项、$echo_it及游标循环有据；嵌套拒绝，前导减号分隔需--。 |
| echo_end | 活动foreach索引推进，结束清理或回置命令游标；无活动循环报错，不是通用return。 |
| echo_abort_parent | 有注册/独立opcode但完整执行switch无对应case，走unknown opcode内部错误；辅助函数主体#if 0且无分派调用，测试明确skip_all。草稿未将文档意图复述为成功功能，也未承诺客户端一定收到新500响应。 |
| echo_exec | URI与命名location分别调用内部跳转入口；显式查询串优先，命名location忽略额外非空查询串并告警，不是外部重定向。 |
| echo_status | 数字slot而非命令opcode，不独立安装内容处理器；merge默认200及父层继承已核，重复拒绝而无独立HTTP状态范围post校验。 |
| more_clear_headers | 输出头过滤命令；类型与状态约束须同时满足，尾部*前缀大小写不敏感，单独*拒绝，-a仅set输出支持；不保证后续过滤器不再生成同名头。 |
| more_set_input_headers | 注册rewrite handler并在首次运行时移到该阶段尾部；复杂值求值，-r限制不存在的普通头新建；输入Content-Type完整长度/字节匹配，不自动去charset，HTTP<1.0跳过且不支持-s。 |
| more_clear_input_headers | clear opcode置空值并删除匹配输入头；支持前缀、不创建缺失普通头；共用输入解析器接受-r但不扩成响应状态筛选。 |

Headers More三项merge源码确认父命令前置、本层命令后置，不是本层出现就丢弃父层。除echo_status默认/继承和三项Headers More继承外，其余未核默认/继承继续unverified。phase依据真实分派：内容命令content，before/after为output-body-filter，clear输出为output-header-filter，输入两项为rewrite-tail；mechanism是已核基础执行说明，不据字段存在擅自提升deep。

### 本批公共入口的补丁实证

固定发行段只下载/解包两模块，无模块源码patch。本线程为本批新增引用在隔离Git archive按冻结34项及原substitutions实际回放，47个最终文件摘要全部吻合；对notes列出的18个完整Nginx公共函数，按原始/回放后各自坐标逐字比较，18/18一致。覆盖子请求、内部跳转、命名location、rewrite调度、发送头/输出、设置类型、flush、请求体读取、URI解析、script编译/执行、complex value、数字/定点解析。临时目录finally清理；未编译运行、未改变旧audit或重开C-R05。

这支持草稿限定的局部unaffected，不推出最终错误页、全部过滤器顺序、网络时序或完整运行环境不受其他补丁影响。特别是echo_abort_parent结论来自真实缺失分派，不依赖patch状态或测试跳过单一证据。

结论：22项逐条语义准备审核通过，无确定缺陷打回；结合上一节CORE_EVENTS35，57项新增内容准备全部通过。尚未合并或发布，正式current仍为5f8eaad2509aaff6；主报告CORE35隔离build64 basic仅作为集成测试结果，不改正式29 basic。待主正式candidate ready后另验57项实际详情、来源、旧29项和8参考保持。永久仅更新本review，不操作浏览器，不替代Sol下一块C01构建scope门禁审核。

## WC-R09最小修复复核及两项补丁知识草稿

R09已关闭：当前redisPatchScope限定processing文件为util/mirror-tarballs，检查正整数/顺序范围，并按固定形态要求版本比较、answer=Y条件、第三patch命令及闭合fi。复核新增end_line=710负例后，本线程实际定向运行Redis测试1/1通过、0失败/跳过；测试包含正确692–715实际回放和七个负例，缺fi范围现被拒绝。三补丁顺序、offset2和最终目标hash未改变。此为准备门禁修复通过，不证明新Redis scope已正式发布，也不把注册未变当运行时unaffected。

随后完整读取PATCH_DIRECTIVES_BASIC.json两项，本次实际SHA256为：

`acec5310ff5a118690c1b356d81b6a97cc118030bbb052d96820e84b6590fdd7`

两身份与既有候选的两个distribution_patch注册一一对应，不新增注册、不修改旧知识。完整读取固定两patch、所列上游日志模式分派/默认转义/格式选择、错误映射查找/内置响应及ngx_conf_merge_ptr_value。11个回调/证据范围均有效，source_ids闭合；两配置入口均为实际注册callback定义。

| 指令 | 独立语义核对 |
|---|---|
| no_error_pages | 无参，当前层从UNSET_PTR置为NULL；merge只对UNSET_PTR继承，显式NULL不被父层映射替换。未另设的子层可继承NULL，自己的error_page在解析时仍可建数组。同层重复拒绝，与error_page两种先后顺序均冲突。NULL使自定义映射查找跳过，内置特殊响应仍有独立正文路径；不是关闭内置错误页或无正文开关。正文“不改变错误状态码”按本指令不直接赋状态码理解，不承诺与原父层error_page映射所得最终状态相同。 |
| log_escape_non_ascii | flag slot与location字段对应，create为UNSET、merge默认1且继承父值。仅default变量长度/输出路径调用新增带lcf的转义函数；开关只改escape表后四个uint32，即0x80–0xFF，保留ASCII控制字符、引号、反斜杠等原转义。逐字节输出\\xHH，不做UTF-8修复；json/none在编译分派中使用独立getlen/run，不受此开关控制。 |

no_error_pages的callback显式跨组件指向OpenResty patch:71–86；去掉diff加号后确为ngx_http_core_no_error_pages函数定义，不将目标回放坐标伪装上游行号。log_escape_non_ascii显式使用固定Nginx flag slot。注册context按已核候选保持：前者含http/server/location/location内if，后者不含if。前者default=not_applicable而非off，后者default/继承依据真实patch；两项均verified_affected，不再套原Nginxunaffected模板。

本轮此前为新增知识执行的冻结34项回放已核47个最终摘要，包含这两个目标；本节直接核对应有效patch与其应用段，未再重复第三遍回放。两项新增函数/字段及UNSET/NULL、转义表改变都来自实际应用的patch，语义没有仅凭名称猜测。

结论：两项补丁基础草稿准备审核通过，未发现需打回的确定事实错误；累计57+2=59项本批新增内容准备通过。本线程没有合并或执行正式build。结束只读检查时发现主并行操作已使current变为 `1.27.1.1-47285daac201481b`；本轮未收到该release的ready说明，也未核其详情，不对其basic计数、scope或发布通过状态作推断，待主冻结交接后另验。前节5f8eaad2509aaff6结论仅适用于当时锁定候选。唯一永久写集仍为本review。

## 59项正式candidate c049ff9edb810ae4独立验收

本轮锁定主ready的 `1.27.1.1-c049ff9edb810ae4`，直接与此前已核29basic候选 `1.27.1.1-5f8eaad2509aaff6` 比较，跳过中间64basic候选的重复审核。开始和结束时current均与该不可变release index一致；index SHA256为 `2a7bad4d97a2276fec2d185296b2b7172571ad7eabe401e45819a2029aabe5b6`。

### 全量JSON及差异结果

只读加载index、1017份详情及references，调用实际validatePublication（包括index/detail/reference验证）通过；没有执行build或改产物。实际1017个唯一注册、88basic、929registration_only、0deep、8参考，inventory_complete=false。59项增量精确等于CORE_EVENTS35、Echo/Headers22、发行补丁2项，全部为basic而非deep。

旧候选1017项逐字段比较，仅去除release_id：958项详情完全相同，包含全部旧29basic；变化集合恰为新59项，无额外身份变化、丢项或非预期详情改动。参考发布只去release_id后整体逐字段相同，8项payload未变。不重研其余无变化模块，也未把内容子集数当全C02完成比例。

正式knowledge88项由旧29与新59组成，新59逐项与准备草稿完全相同。CORE35和Echo22文件SHA仍等于前节冻结值。两patch草稿只修改授权的no_error_pages最后限制句：在内存恢复旧句后，完整文件SHA回到前节准备值，证明没有其他内容变化；现文件SHA为 `8654cded8eeafb3f8a2d662be4571c7044c31b4de36d3ed8f1779779cacfe450`。

### 实际详情及496段来源

新59项的summary、syntax、defaults、inheritance、limitations、patch_status、related、mechanism、phase和availability均逐字段核对正式知识及已审草稿；source_ids闭合。context按实际注册flags复算，module/component/name和callback与catalog对应，compile_guards完整保留。新详情的阶段分布为configuration22、event13、content17、output-body-filter2、output-header-filter1、rewrite-tail2、log1，no_error_pages不强填阶段1项；均符合已核执行语义，不因mechanism字段存在升成deep。

全部496段实际发布source均从其固定Git SHA读取，逐段核对完整原文、文件、起止行、版本、revision、组件repository链接及kind。59个configuration-definition均与真实注册callback匹配，逐项确认显式来源的组件和坐标；两条patch注册仍来自OpenResty patch，no_error_pages回调也正确跨组件引用patch:71–86，保留加号原文，不伪造Nginx上游坐标。其余CORE/Event回调使用真实Nginx入口；echo_status使用固定Nginx数字slot，Echo/Headers其余回调使用各自固定模块源。

26段official-doc以固定nginx.org SHA读取，先把XML注释内容替为空白并保留换行，再核所引用范围确含对应现行directive节点，26项均通过；九个平台项不补造XML。此规则不会把注释中的open_file_cache_events算作现行节点，本轮未提前审核后续HTTP core草稿。

实际发布保留关键语义：echo_abort_parent明确未接入有效执行分派、不能终止父请求；CORE默认/继承未核处继续unverified，六项affected与所列patch来源对应；Headers More阶段及父先子后继承不丢失。no_error_pages最新限制句逐字匹配：命令自身不直接改写状态码，但取消父层映射可能改变最终响应状态，并不保证无正文；log_escape_non_ascii仍限定default逐字节路径，json/none独立。沿用前节已完成的源码/回放语义审核，不重复无变化34patch回放。

### 来源矩阵与完成边界

正式根matrix中core/LuaJIT现为fixed_build_and_entry_review，分别lua_reference_library/lua_runtime、零自有注册；保存的全部scope证据原文重新与固定SHA一致。Redis patch_scope与已核REDIS_PATCH_AUDIT及空added/removed/changed逐字段相同，R09修复结论保持。它们实际接入不等于旧模块/Nginx全构建scope已经闭合，发布inventory_complete仍正确保持false。

结论：该冻结candidate的59项基础内容接入、全部来源、旧29项和8参考保持、全JSON门禁独立核对通过；未发现确定缺陷需要打回。主正在执行的75tests、HTTP和Space8桌面检查不冒称本线程已执行或已通过，交主另行收口。C01/C02整体与C04最终交付不判完成，部门deep仍0；没有新增phone、内网或Codex真实接入验收。永久仅更新本review。

## HTTP core hash/types/path首组10项准备审核

完整读取HTTP_CORE_HASH_TYPES_NOTES与HTTP_CORE_HASH_TYPES_BASIC.json；本轮草稿SHA256为 `de5df63037dd6ccacf67a28d9fa28f62c86862c8fcafe8cbd72e0c41ec2a28ac`。十身份均对应ngx_http_core_module现有注册，互不重复，与现有88项知识无重叠。current仍为c049ff9edb810ae4；不重审旧59，不合并或改产物。本组不能代表HTTP core 84项或全C02完成。

### 源码语义核对

全部实际配置回调、字段使用、初始化/merge、hash builder、types解析/查找和URI路径映射均从固定Nginx SHA读取。另读ngx_atoi与hash构建失败后的处理，避免只凭num_slot名称或截断实现推断。十个XML引用均先去注释并保留换行，再核对应现行directive节点，均有效。

| 指令 | 语义核对结果 |
|---|---|
| variables_hash_max_size | max_size进入变量hash构建，尝试桶数上限而非变量个数；默认1024，http主层，无server/location继承。 |
| variables_hash_bucket_size | 初值64字节，按ngx_cacheline_size对齐；不声称所有平台最终均64。 |
| server_names_hash_max_size | 精确名及首尾通配名称构建共用参数，默认512；不等同虚拟主机数或正则匹配数。 |
| server_names_hash_bucket_size | 默认缓存行大小并对齐，不能硬写64；http主层。 |
| types_hash_max_size | 默认1024及父层数值继承有据，用于需要构建的类型hash；不是扩展名总数上限。 |
| types_hash_bucket_size | merge初值64及对齐有据；父层值继承，不当成每桶键个数。 |
| types | 扩展名转小写，重复同层扩展名告警后替换为后值；本层显式数组包括空块，不逐项并入父表。已存在响应Content-Type时不覆盖。 |
| default_type | MIME查找未命中才使用，已有Content-Type直接返回；merge默认text/plain及父层继承有据。 |
| root | alias偏移为0，根路径追加完整URI；缺可继承路径用html并按prefix补全。禁用两个路径变量、重复/并用拒绝与共享callback相符。 |
| alias | 前缀location按匹配长度裁去URI前缀；正则分支使用脚本/捕获构造，不混同root。命名location拒绝，alias且valid_location失效时URI映射拒绝。 |

六hash项注册均num_slot、post=NULL，实际ngx_atoi只接受非负十进制数字及机器整数范围，不支持k/m后缀；0虽能经槽位解析，但hash构建拒绝max_size=0，草稿没有保证所有可解析值构建成功。桶容量为构建参数而非无条件硬上限，后续builder在找不到最优表时可告警忽略bucket_size；本稿未宣称强制键数限制。types默认、root/alias未核继承及alias默认保持unverified，未机械补全。

本线程为这些新增引用隔离回放冻结34项，47个最终目标hash全同。十组注册、owner、callback和实现共58段可取得原文均在最终文件保留；但其中两段请求范围越过EOF，JavaScript slice会静默截短，因此“片段比较相同”不能替代下面的发布范围门禁。未更改旧audit或重开C-R05，临时副本finally清理。

### WC-R10 / P2：十项引用了尚未提供的module-owner证据

十项patch_status.source_ids均含module-owner，草稿evidence没有该id；当前正式catalog的这十项也没有registration_evidence。实际build只添加registration、catalog显式registration_evidence、configuration-definition、草稿evidence及distribution-version，不会根据module_line自动补owner。

本线程按当前真实来源ID集合逐项调用实际prepareKnowledgeFacts，10/10均抛出“patch_status 的状态、说明或证据无效”，唯一缺项为module-owner。不是仅凭字符串搜索推断，也未正式build造成发布写入。

最小修复可在这十项草稿中显式加入真实owner证据：固定src/http/ngx_http_core_module.c:800–813。若主拟通过后续正式registration-build接入owner，则须待真实catalog已落盘并复核，不得用尚未发布的shape代替当前来源。不要只删source_id而继续保留已核归属却无对应来源的声明。

### WC-R11 / P2：variables_hash两项引用越过固定文件末尾

variables_hash_max_size与variables_hash_bucket_size的implementation-0均写src/http/ngx_http_variables.c:2804–2838。固定Git对象按build同样的split换行方式只有2836项；实际函数在文件末尾结束。build的snippet要求end_line<=lines.length，因此即便先补R10，这两条仍会被拒绝。

应把两个范围收在固定原文真实有效结束位置，并同步相关记录。主所报58片段原文保持以及本线程独立比较均不能证明2838坐标有效，因为slice会自动截到EOF。本线程没有为得到通过而修改草稿或放宽build检查。

结论：十项正文语义、默认/继承陈述未发现确定错误，固定XML与局部补丁文本核对成立；但R10/R11属于实际接入阻断，准备整体验收暂不通过，打回主作最小来源修复。修复后只需差异核来源ID/范围及相称隔离集成，不重做十项已核语义或旧59。唯一永久写入为本review。

## WC-R10/R11差异关闭与HTTP transport17项准备审核

本轮仍锁正式current `1.27.1.1-c049ff9edb810ae4`，仅审核准备输入，不运行正式build，不合并知识或操作浏览器。固定Nginx、nginx.org、OpenResty对象沿用前节SHA；未重审旧59或十项已通过正文语义。

### R10/R11修复闭合

十项现均显式提供module-owner，坐标为src/http/ngx_http_core_module.c:800–813；固定原文确实把ngx_http_core_module与ngx_http_core_commands关联。variables_hash两项implementation-0结束行现为2836，未放宽来源范围检查。在内存仅撤销上述两类修改后，完整文件SHA256精确恢复前节的de5df63037dd6ccacf67a28d9fa28f62c86862c8fcafe8cbd72e0c41ec2a28ac，证明其余正文及字段未变。

按真实来源ID集合再次调用prepareKnowledgeFacts，10/10通过；所有引用范围均在固定对象有效边界内。R10、R11关闭，首组十项准备审核通过。当前修复稿SHA256：`6ebd4ad1227c164519601c8fcb5a86bcddf08c70dfc3e93d3d63220926875454`。

### transport17项逐义结果

完整读取HTTP_CORE_TRANSPORT_NOTES与草稿，逐项读取固定注册、真实配置回调、字段使用及merge，并阅读17段固定XML原文。XML先去注释保留换行，17项均对应现行directive节点。草稿SHA256：`02215b502422026ab9cd42d668953263d42d3c627d8f07107f68b3038162f1f1`。

| 指令 | 独立源码核对结论 |
|---|---|
| sendfile | off默认与父层继承有据；须同时具有NGX_IO_SENDFILE能力，不保证所有响应走零复制。 |
| sendfile_max_chunk | 默认2m，写过滤器向send_chain传递单次限制，限速启用时取相应限制；不是响应总大小上限。 |
| tcp_nopush | 默认off；Linux与FreeBSD文件发送链分别设置CORK/NOPUSH相关状态，聚合文件与头，不是压缩。 |
| tcp_nodelay | 默认on；TLS握手及keep-alive路径真实检查该值，不意味着所有输出不缓冲。 |
| send_timeout | 默认60s；等待写进展的事件超时及重置处理，不是整个响应总时长。 |
| send_lowat | 默认0；写事件低水位与平台post检查有据，FreeBSD限制sendspace，其他缺SO_SNDLOWAT构建告警置0；不是速率。 |
| postpone_output | 默认1460；无last、无flush、有新输入且小于阈值才暂缓，0关闭该条件，不是时间等待。 |
| limit_rate | 运行默认0、配置指针父层继承有据；complex size支持变量，按请求计速，不是按客户端合计。 |
| limit_rate_after | 运行默认0；先发送额度在limit_rate生效路径内使用，单独配置不启用限速。 |
| keepalive_time | 默认1h；以连接start_time比较累计时间并撤销keepalive，不建立强制中断长响应的总时限定时器。 |
| keepalive_timeout | 首参数默认75s用于空闲定时器，0禁用；第二参数独立解析为秒、默认0，仅输出Keep-Alive响应头，不代替服务端定时器。 |
| keepalive_requests | 默认1000；比较连接已处理请求数并撤销下一次保持，不是并发上限。 |
| keepalive_disable | 默认msie6；实际判断MSIE6标志与POST、Safari标志。none不命中这两条件，不宣称能清除同层已置的其他bit。 |
| lingering_close | 默认on，按剩余数据等状态判断；进入关闭方式选择分支时always不依赖该启发条件，off跳过。另读完整finalize_connection前置分支，不能据此推导always会取消正常keep-alive或覆盖HTTP/2、QUIC独立关闭流程；草稿按关闭路径说明理解。 |
| lingering_time | 默认30s；进入lingering时建立总截止时间，后续读丢弃循环检查剩余期限，不是响应处理时限。 |
| lingering_timeout | 默认5s；每次等数据的超时，后续定时取其与总剩余时间较小值，与lingering_time不是同一参数。 |
| reset_timedout_connection | 默认off；请求timedout且非QUIC才按配置设置SO_LINGER零等待，444显式置timedout；空闲keep-alive超时另走关闭路径，不声称所有关闭均RST。 |

各项默认和继承的source_ids均指向实际初始化/merge；两限速项另有运行默认值来源。17项配置回调均与catalog真实callback定义对应，不把调用点当定义。连同修复十项，共188个callback/evidence范围按固定Git对象检查通过，27项来源ID唯一且所有事实引用闭合；prepareKnowledgeFacts共27/27通过。27身份均存在于当前catalog，与正式88项知识无重叠。本轮不是仅以build成功或源ID存在替代语义判断。

### 新引用补丁实证及验收边界

为本组新增内容在mkdtemp隔离Git archive中实际回放冻结34项及既有substitutions，47个最终目标SHA256全部一致；17项注册、owner、callback及实现共103段，逐段先验证固定原文范围再比较，103/103在回放后保留。没有EOF静默截短，没有修改旧audit或重开C-R05；临时目录已finally清理，未编译或运行Nginx/OpenResty。

结论：R10/R11关闭，新增17项准备审核通过，与首组十项合计27项准备通过；未发现需打回的确定缺陷。主报告的隔离115basic仅作为其集成结果，本线程未将其当正式发布；正式仍为1017注册、88basic、0deep、8参考、范围未完整。待主merge并冻结新candidate后再验实际增量详情、来源及旧项保持，不判HTTP core全量、C01/C02或C04完成。永久仅更新本review。

## C01 registration-build三文件独立准备审核：打回

完整读取scripts/registration-build.mjs、test/registration-build.test.mjs、REGISTRATION_BUILD_IMPLEMENTATION.md，后者已明确最终8组ready。本线程实际运行node --test test/registration-build.test.mjs：8/8通过，0失败、0跳过；中间错误文句期待问题已不复现。未修改这三文件或调用方，未运行正式inventory/build，未重审旧scope分类/来源归档。

本次锁定文件SHA256：脚本 `cc07ccb44bbf7bf41622c344d9687887571a49371d6719b477983d50dd1b01e6`；测试 `3aded0f1d3c93831cdcec87938f1e57bb06bd7ce5e3073eca76515dedc6a3cf4`；notes `9847146db046d50a2104edc8dad7a52324bb0ba015f60aa52c0fdd1b24a72a48`。

### 已核成立的部分

22组件固定正例通过：现有测试实际从固定SHA读取blob/tree，不使用HEAD或工作树；覆盖Nginx724、NDK1、其余字面模块及NULL owner。Nginx平台状态分开推导，Win32 select/poll覆盖和不支持线程池的边界明确；HTTP_STATUS排除有固定无启用路径检查。MAIL/STREAM动态聚合、Perl XS、C++兼容测试与模块指针生成已有专项证据及负例，不把Perl生成物重复算指令。NDK有星号commands、已提交头清单/依赖条件、optional C guard、嵌套MurmurHash2递归证据；examples不进入根源列表。

独立尝试删除src/ndk.c的正式ndk_config.c include时，实际extractCommands拒绝“owner 文件未唯一包含注册容器”；因此不误报已有检查缺失。其余下面反例只改内存read返回文本，基底仍为原固定SHA；没有编辑来源、执行shell来源或生成器，也没有把反例称为当前固定上游已有变化。它们验证的是本gate明确承诺的未知输入拒绝契约。

### WC-R12 / P2：入口先去重，掩盖重新执行对有序状态的覆盖

脚本327行对auto/configure的include列表先unique，再与已知顺序比较。内存把原`. auto/modules`改为`. auto/sources\n. auto/modules`，真实多出一次auto/sources执行，却返回verified、724注册。重复执行会在平台赋值后重置source变量，不能等同原有一次初始化；nginxPlatformUnits仍按预设顺序构造原状态，记录已与实际入口脱节。

最小修复是比较保留次数的实际调用序列，不对入口执行顺序去重；未知重复/顺序变化拒绝。增加上述重复已知入口负例，不能只测新增未知文件名。

### WC-R13 / P2：Nginx分支豁免未知构建写入和module type检查

脚本361–365的eval/export/unset及非独立构建赋值检查只用于非Nginx，382行module type检查也排除Nginx。本线程分别在auto/modules末尾追加`eval 'HTTP_SRCS="src/http/ngx_http.c"'`，以及把首次`ngx_module_type=HTTP`改成`ngx_module_type=UNKNOWN`；两者均返回verified、724注册。前者实际改变正式源集合，后者不再沿已知HTTP消费者归属，但解析器仍确认原完整边界。

固定Nginx本身含合法eval，不能简单禁止整个文件出现eval；应对实际已支持的消费者/赋值形态作有限识别，额外相关写入和未知type拒绝或保留pending。无须开发通用shell解释器。增加两项原型负例后再核；当前notes“未知输入拒绝”的结论不能涵盖这些漏项。

### WC-R14 / P2：NDK library仅定义证明可被同一行命令调用绕过

脚本265–268仅匹配行首函数调用。在NDK config追加合法shell语句`:; ngx_auto_lib_init`，本线程得到verified、1注册。固定library确有该函数，它会再次加载library并调用初始化逻辑；无参数还会退出构建，已不符合“根入口未调用，仅消费已提交生成输入”的前提。

最小修复应识别或拒绝未支持的同一行命令、连接操作符调用形态，不能把不匹配行首当作没有调用；保留既有函数定义不误杀。增加分号后调用负例，不只测试单独一行调用。无需执行library或生成器。

### WC-R15 / P2：根C输入的非字面include被静默忽略

脚本432–433只匹配字面.c/.inc include；未检查其他include表达式。在固定ngx_http_core_module.c尾部以内存追加`#define EXTRA "unreviewed.c"`及`#include EXTRA`，实际仍返回verified、724注册，既未解析该正式输入也未拒绝缺少目标。NDK递归包含有非字面表达式拒绝，普通根C没有等价拒绝。

本问题不要求支持通用宏展开或核完任意系统传递头；只需对正式根C的未知include表达式fail-closed或保留pending，防止未识别的新C包含路径从检查中消失。增加宏形式include反例，保持当前已核普通头和已有NDK映射不变。

### 当前结论

三文件原有8组通过及固定22正例成立，但上述5个独立反例分别稳定误报verified（R13含2例），未知输入fail-closed契约未完成。准备审核暂不通过，R12–R15打回实施/主作最小修复；不得据这份返回值直接删除对应pending或宣告inventory_complete。修复后只复核差异及相关反例，不重做旧归档、补丁或无变化分类。未来准备通过仍不代调用方integration及正式scope产物验收。永久仅更新本review。

## HTTP response/access16项独立准备审核

完整读取HTTP_CORE_RESPONSE_ACCESS_BASIC.json及对应NOTES，只审核这16项新增内容；不重审前27项或registration-build正例，不代R12–R15修复复核。草稿SHA256：`0f6edc9d8bd6e0f5358d9e6d31d9c7e217ee574272e878fab18ae782fd8abbac`。检查结束current仍为c049ff9edb810ae4，正式88basic未变。

### 逐项语义与事实来源

从固定Nginx对象读取全部注册、回调、owner、初始化/merge及所列实现片段；另补读Range计数超限返回、auth_delay事件回调及内部跳转上下文，避免把调用点存在当完整行为证明。15段固定XML去注释保行后均对应现行节点；post_action无有效同名XML，未伪填official-doc。

| 指令 | 独立核对结果 |
|---|---|
| absolute_redirect | 默认on，只在Location非空且首字符为斜杠时自动补绝对地址；off不等于禁止重定向。 |
| server_name_in_redirect | 默认off；on选当前server配置的主要名称，off使用请求解析主机名，缺失回退本地地址，不是任意默认server名称。 |
| port_in_redirect | 默认on；使用本地套接字端口，HTTP80/HTTPS443仍省略，off不附端口。 |
| if_modified_since | 默认exact；off、exact、before对应真实比较。off不保证消除所有304，仅有If-None-Match时仍可能304；若两请求头同时存在，源码先检查时间条件，不能把“独立判断”理解为ETag无条件绕过时间分支。草稿没有作后者承诺。 |
| max_ranges | 默认NGX_MAX_INT32_VALUE，0禁用；解析有效范围超过计数返回NGX_DECLINED，回退完整响应，不截成前几个范围。非法/不可满足范围有其他错误分支，不与超限混同。 |
| chunked_transfer_encoding | 默认on；所述HTTP/1.1路径及HEAD、子请求、204/304排除有据。未知长度且不能分块时撤销keepalive，不是关闭流式处理。 |
| etag | 默认on；ngx_http_set_etag以修改时间和长度格式化生成，不读取正文计算哈希，不宣称清除所有来源ETag。 |
| msie_padding | 默认on；实际兼容判断包含MSIE或Chrome，需内置错误正文、HTTP至少1.0和相应错误类别。附加固定填充注释，不保证任意响应达到固定长度。 |
| msie_refresh | 默认off；相关特殊重定向处理仅检查MSIE，调用refresh处理，不错误推广到Chrome或全部浏览器。 |
| log_not_found | 默认on；404文件错误受开关控制，权限等其他错误继续记录；不改原错误状态。 |
| log_subrequest | 默认off；控制子请求完成路径调用请求日志处理器，不是全局error_log开关。 |
| recursive_error_pages | 默认off；控制r->error_page标志是否阻止下一轮映射，仍检查uri_changes，不解除内部跳转次数限制。 |
| post_action | 相关正常/错误完成路径调用；以首字符斜杠区分内部URI与命名location，设置header_only/post_action。不是通用阶段钩子，默认继续unverified，继承依据data为NULL时复制父值。 |
| internal | 无参callback设internal=1；非内部请求匹配时以404结束，未配置且无父值时merge为0。不是停止该location全部处理。 |
| satisfy | 默认all；access检查的all继续各处理器、any允许时跳过剩余检查；DECLINED等另有控制流，不新建认证规则。phase=access有据。 |
| auth_delay | 默认0s；access/post-access准备401时进入延迟逻辑，非零用写事件timer及后续handler完成401，不阻塞worker。不是所有响应延迟，phase=access有据。 |

15项已核默认及16项继承source_ids均指向对应实际merge/运行证据，post_action未凭空补默认值。所有显式callback均是catalog回调函数的真实定义；owner为同一固定initializer。119个注册/callback/evidence范围全部有效，来源ID唯一、事实引用闭合；实际prepareKnowledgeFacts 16/16通过。16身份均对应当前catalog，与正式88项及前27项无重叠。

### 新引用的补丁实证及结论

本线程在mkdtemp隔离Git archive实际回放冻结34项及已有substitutions，47个最终目标摘要全同。先检查坐标有效，再比较16项共88段注册/owner/callback/实现原文，88/88在最终文件保留；未靠slice截短取得通过。此为本组新增事实的局部unaffected证据，不声明HTTP全运行链未受补丁影响，不重开旧C-R05。临时副本已finally删除，未运行来源生成器、编译或运行OpenResty。

结论：本16项准备审核通过，无确定缺陷打回；连同前27项，累计43项新增准备通过。主报告隔离131basic是集成结果，notes末句“仍待隔离build”属于尚未同步的进度表述，不改变本线程的独立源码审核或正式发布状态。尚未合并/发布，不判HTTP core全量、C02或C01完成；等待主冻结单次candidate后再核43实际接入、旧88和8参考保持。R12–R15继续开放，不能用内容通过替代构建范围门禁。唯一永久写入本review。

## R12–R15第一次差异复核：关闭三项，R14保留

仅复核四处修复及同类反例，不重做22组件源码正例全审。此次脚本SHA256为 `f8ceef75002f2e906f4085360f2594ba092c2b6d974951ca54046a6454f42e65`，测试为 `f701733ce44392e908f52902a8b15f15a0128e89c7727cb8b5471de81cb382c7`，notes为 `537f051b4af4f2a1ffe65f19fb14d1e038354c21a6a8c5911a99f998096fa626`。本线程实际运行原测试文件8/8通过，0失败、0跳过；另用固定Git读取加内存包装独立复现原5反例，全部现被拒绝。

| 问题 | 差异复核结论 |
|---|---|
| R12 | 关闭。入口比较不再unique，保留原有重复auto/define；在auto/modules前追加auto/sources现拒绝。 |
| R13 | 关闭。Nginx控制语句现纳入构建写入检查，并核支持的module type；原eval和UNKNOWN两例拒绝。另测export、unset、`： && export`（实际命令使用英文冒号）及`false || unset`四例均拒绝。 |
| R15 | 关闭。根C先逐条核include字面形态，EXTRA宏include现明确拒绝；不引入宏展开。 |
| R14 | 部分修复，保持开放。根config中的分号、&&、||调用均拒绝；被直接source的library本身仍有相同绕过。 |

### R14剩余的确切复现与最小修复

脚本267行对config使用`(?:^|[;&|])`，268行对library仍使用仅行首的`^${name}(?:\\s|$)`。本线程分别在固定ngx_auto_lib_core末尾以内存追加以下三个顶层语句，全部实际返回verified、1注册：

```sh
:; ngx_auto_lib_init
: && ngx_auto_lib_init
false || ngx_auto_lib_init
```

三例分别执行，未混在同一输入中；均是有效shell调用，不是函数定义或注释。根config直接`. $ngx_addon_dir/ngx_auto_lib_core`，所以library新增顶层调用同样破坏“仅定义、不执行初始化函数”的已核前提。此次不只是错误文句差异，而是返回状态真实误通过；无参数调用会进入已有初始化错误/退出路径。本线程没有实际执行这些来源语句。

最小修复需对library顶层也拒绝这些未支持调用形态，同时保留原有函数体内部调用不误杀；补上述三负例。不要把所有library缩进行都当顶层，也不需要通用shell解释器。原来的library单独一行调用负例不足以覆盖此差异。

结论：R12、R13、R15关闭；R14同类漏检尚未闭合，helper准备整体仍不通过。已定位主调用方接入代码，但依“先关闭再验integration”的顺序，本轮不形成调用方通过结论，也不运行正式inventory/build或提升scope；43内容准备通过结论不受此门禁缺陷影响。唯一永久更新本review，未改实施三文件、config、产物或来源。

## HTTP request/body14项准备审核：一项措辞打回

本轮未收到R14剩余修复ready，不重复其测试，保持开放；独立审核HTTP_CORE_REQUEST_BODY_BASIC.json及对应NOTES。当前草稿SHA256为 `8f0e83967ad9bb292d0b1f1086a8f1ec49b087051499c11bbebc359ba964af6b`，正式current仍c049ff9edb810ae4、88basic。主报告隔离145basic不作为正式发布，前43项不重审。

### 逐项源码核对

全部14项注册、owner、配置回调、post约束、merge及实现片段按固定Nginx对象读取；14个固定XML去注释保行后均为有效同名节点。

| 指令 | 结论 |
|---|---|
| connection_pool_size | 初始池块而非连接总内存；监听取addr->default_server。默认64*sizeof(void*)，池最小值/对齐和大请求头缓冲约束有据。 |
| request_pool_size | ngx_create_pool初始大小，默认4096；不等于正文、总内存或并发上限，post检查同上。 |
| client_header_timeout | 默认60s、等待读头且timer已设置时不反复重设的证据成立；“返回408”须按下述R16修正。 |
| client_header_buffer_size | 默认1024，连接初始读头缓冲可按需升级到large缓冲，不是全部请求头硬上限。 |
| large_client_header_buffers | 默认4×8192，数量和大小均须正；单个未解析完字段/请求行达到单缓冲大小即拒绝，增加数量不让一个字段跨缓冲。每块还须不小于连接池大小。 |
| ignore_invalid_headers | 默认on；仅对解析为NGX_OK但invalid_header置位的头跳过，不接受任意畸形报文。 |
| merge_slashes | 默认on；URI规范化时压缩连续斜杠，影响后续匹配而非修改磁盘内容。 |
| underscores_in_headers | 默认off；决定名称中的下划线是否标invalid，之后由ignore_invalid_headers决定丢弃，不控制上游响应头。 |
| client_max_body_size | 默认1m、0关闭；Content-Length预检和chunked累计加下一块大小两处均有非零限制及413路径。 |
| client_body_buffer_size | 默认两页；实际按剩余数据等条件分配，允许落临时文件，不作为max body或保证全内存。 |
| client_body_timeout | 默认60s；后续读等待设置timer，超时按请求超时处理，不是整份正文总时长。 |
| client_body_temp_path | 客户端正文临时目录，最多三级由注册参数和path slot共同限制；merge确可继承。构建默认常量未核，defaults保持unverified。 |
| client_body_in_file_only | 默认off；on设persistent，clean另设clean标志，正文保存路径确消费这些标志。off不强制全落盘但仍可能有临时文件。 |
| client_body_in_single_buffer | 默认off；HTTP/2、HTTP/3在此HTTP/1缓冲逻辑之前分派。固定TODO尚在，只对非chunked且较小剩余正文分支将preread计入分配大小，不宣称任意正文/协议都单块或无临时文件。 |

### WC-R16 / P2：client_header_timeout不可保证向客户端发送408

草稿summary写“读头超时会关闭请求并返回408”。所引固定ngx_http_request.c:1097–1101（请求行阶段）和实际读头阶段:1385–1389均直接设置c->timedout后调用ngx_http_close_request(r, NGX_HTTP_REQUEST_TIME_OUT)。继续跟踪:3665–3695，HTTP/1分支调用ngx_http_free_request后关闭连接，没有特殊响应发送调用；free_request把rc设为headers_out.status供日志记录，见:3740–3750。这里的408是结束/日志状态，不能推导为客户端收到408响应报文。

固定XML的原意是以408错误终止请求，也没有支持更强的报文保证。本项最小修改建议：“设置读取客户端HTTP请求头的等待时限；所引HTTP/1路径超时按408状态结束并关闭连接，不保证发送408响应报文；不是向上游建连或读取请求正文的超时。”如增加关闭/日志链证据，须同时检查其坐标及局部patch声明；也可仅将“并返回408”改成“按请求超时处理”，避免无必要扩展。不要改运行代码或将所有协议关闭行为概括成相同实现。

### 来源与局部补丁检查

14身份唯一且与正式88及前43无重叠，所有显式callback与catalog真实定义一致。115个注册/callback/evidence范围有效，source_ids闭合，实际prepareKnowledgeFacts 14/14通过。独立mkdtemp回放冻结34项，47个目标摘要一致；当前文件含后补protocol-dispatch后实际87段Nginx引用全部保留（notes原记录86段，不能沿用为当前数量）。临时副本finally清理，未编译运行来源、未改产物或旧audit。

结论：除R16外其余13项准备语义通过；本14项整组暂不通过，前43项准备通过保持。待主只修R16后差异复核即可，不需重做13项或旧组。notes中待build/86段属于主补充后尚未同步的进度口径，应与真实当前输入区分。未合并、发布或验收C01/C02整体，永久仅更新本review。

## R16最小修复差异复核：关闭

client_header_timeout现为：“设置读取客户端HTTP请求头的等待时限；所引HTTP/1路径超时按请求超时处理并关闭连接，不保证发送408响应报文；不是向上游建连或读取请求正文的超时。”与前节已核关闭路径一致，不扩展至其他协议，不新增来源或事实字段。

当前草稿SHA256为 `c6862427e7cc0123f737f75cdfea64ee3feac70182fa3c120ad796d2f8573ad3`。本线程仅在内存恢复原summary后，完整JSON摘要精确恢复 `8f0e83967ad9bb292d0b1f1086a8f1ec49b087051499c11bbebc359ba964af6b`，证明其他字段和13项未变。notes末段已补主隔离145basic成功及当前87段，前文86段按历史准备记录理解，不替代本线程上一轮实际87段检查。

R16关闭，本组14项准备通过；与前43项合计57项新增内容准备通过。未重复无变化语义、来源或补丁验证，也未执行build。只读确认current仍 `1.27.1.1-c049ff9edb810ae4`、正式88basic；R14仍待修复复核，尚不验scope正式接入或单次candidate。永久仅更新本review。

## R14第二次差异关闭及调用方准备审核

### R14关闭：helper准备通过

本轮只复核library函数定义屏蔽和顶层调用检查，不重开R12/R13/R15。固定形态函数块先按独立行结束花括号屏蔽并保留换行，数量须与函数定义集合一致；library剩余顶层与config现在使用同一行首/分号/连接符检查。

实际定向运行registration-build测试的NDK组：1/1通过、0失败/跳过。上轮剩余`:; ngx_auto_lib_init`、`: && ngx_auto_lib_init`、`false || ngx_auto_lib_init`三个library顶层反例均以根入口调用错误拒绝；相同连接符调用置于ngx_auto_lib_init函数体内、目标为ngx_auto_lib_init_latest的正例仍verified，没有把未执行函数体当顶层误杀。R14关闭，R12–R15全部闭合，helper准备审核通过；仍限定既定固定输入形态，不宣称通用shell解释或任意自定义构建支持。

锁定helper SHA256 `4a91dc9a4c30eef5ec4fc785eb446a95c92c93d10d64d604a87f660d38780891`，测试 `acb62bdfcd967ffaf9d1b8d7eaaf94545c33b1f1b11ba5de07d1e5f085453298`，实施notes `95105c840d4d79f1a48b944d855c70fdae2c334ffb6f8958d5f31342578911f0`。

### 主调用方五文件准备核对

| 文件 | 接入结论 |
|---|---|
| project.config.json | 恰22个registration_build.entry：Nginx为auto/configure，其余为config，无新metadata形态。实际逐一核tag解析commit、HEAD及已审测试固定SHA全部一致；10项另有显式revision，其余沿已有tag约束，不误称22项都配置了revision。 |
| scripts/inventory.mjs | readBuildSource按组件配置解析tag commit并缓存，用Git show读取；显式revision存在时必须一致。当前组件paths为固定revision的完整ls-tree。先核上游sourceRecords与helper，status/complete不满足即抛错，无catch转零条或删除pending；在所有范围/补丁门禁通过之后才写盘点输出。 |
| scripts/inventory.mjs补丁/矩阵顺序 | helper先于发行新增，只接上游Nginx724；随后原独立patch门禁追加两项、Redis独立patch_scope。scope_complete要求所有组件处于三种已认可inspection，并同时有Nginx及Redis patch_scope，不将扫描完成当范围完成。 |
| scripts/build.mjs | inventory_complete须matrix.scope_complete严格为true且每项inspection有效；旧local scan等会生成范围待核gap。registration_only数量与基础计数独立计算，0deep保持，不把目录完成当功能正文全覆盖。coverage参与release内容摘要；未改公共schema/API。 |
| test/distribution.test.mjs | 真实子进程CLI在mkdtemp输出，核所有已配helper通过、上游注册身份对应及两条补丁新增；坏entry须拒绝且components.json原文/catalog对象保持。finally清理隔离目录。 |
| test/knowledge.test.mjs | 发布inventory_complete与实际矩阵状态一致，仍明确basic_verified_count小于registration_count，未替换成基础全完成断言。 |

配置复核脚本首次把可选revision误当必填而在Nginx处断言失败；该错误属于本线程检查假设，不是产品缺陷。随后按实际契约核tag固定commit、HEAD、已有固定测试SHA及可选revision，22项全部吻合。没有据此要求修改既有来源配置或重新归档。

本线程实际定向执行distribution“真实盘点命令行”组：1/1通过，约22秒，包含真实CLI正例及unknown entry保旧输出负例。此检查真实跨过静态导入循环和延迟helper调用，不只是import测试；只在隔离目录盘点，没有运行根inventory/build。另执行knowledge“真实发行版目录与源码注册计数”组1/1通过，验证当前仍未抬正式范围且基础未全。上述测试没有执行来源构建/生成器，也未改变用户源码。

五文件SHA256依次为：config `9704d295733bac5949f55cbf901df5271a78fcf30fbed1643f9cc6af304dd1c3`；inventory `dd35e1dc299b9e86de95e40d6801c6bc8c64602e150d7cf96d6b0b6c5a72e370`；build `5aa9de450b605c0b5e19632b30b84d9c0dec755aea4d25667fda0de6fb9d7f1d`；distribution测试 `f0d411f3adcd76d69b97d454ee83ad29ef939b0f73c7327a526019ad12e20289`；knowledge测试 `c10c6f445eee9d03dd3157e7400cbb000110bd5e4386e9af99039e02e8e185d2`。

结论：helper修复与主调用方准备审核通过，无确定缺陷打回；主可按既有授权运行正式inventory/build并交冻结candidate。尚未验收正式scope与57内容实际接入，检查时current仍c049ff9edb810ae4、88basic；C01正式发布状态、旧88/8参考保持及新57接入须等candidate逐项核对。准备scope为true不等于全部基础知识或C02完成，永久仅更新本review。

## 正式candidate 92e11537fd436a31：C01范围及57内容接入独立验收

锁定 `1.27.1.1-92e11537fd436a31`，开始与结束current一致，且current index与不可变release index逐字段相同。index SHA256为 `73be7430af816ade5b35fe684034600286996b9d482eedeb90448a004f71cb44`。实际1017注册、145basic、872registration_only、0deep、8参考、inventory_complete=true。

### C01正式矩阵与catalog闭合

catalog字节SHA256为 `1a625dd29a400e23d49437082a895e7d4f37bab9bcd97c2e859415871531399c`，与主交接及原目录基线相同；范围gate未改变已有身份/字段。

43组件实际分类为22个fixed_registration_build_review、8个fixed_build_and_entry_review、13个fixed_tree_and_install_review。对22组件只读固定Git blob/tree重算已审helper，返回完整对象逐字段与正式matrix.registration_build相同，包括source_files、owner绑定、条件、生成证据、排除及注册集合；不是只核verified标志或数量。22项均complete且verified，其中lua-upstream保留NULL commands的正向无自有指令结论。Nginx上游724与正式两patch新增分开，总726；NDK仍为1条、条件及容器证据保持，不暗示单独默认启用。

8个非自有指令组件均零注册、保存classification与配置一致，全部scope_review原文重新与其固定SHA一致。13个参考组件的整个scope_evidence与既有component-scope记录逐字段一致，不重做无变化归档或来源分类研究。22构建门禁与8分类共195份build/scope证据已核实际接入；43组件各自registrations均与catalog组件计数一致，无pending或未核扫描分类冒充完成。

正式Nginx patch_scope的固定revision、34项顺序及47个final_files摘要与已核audit一致；added恰log_escape_non_ascii/no_error_pages，来源patch路径、目标hash与catalog一致，removed/changed为空。Redis patch_scope与完整已核audit字段一致，包括三patch、offset2、processing692–715及目标hash，added/removed/changed均空。不重新执行旧全patch审核，也不把注册不变表述为运行时unaffected。

结论：本candidate的C01正式目录/范围接入独立验收通过，inventory_complete=true有矩阵与双patch依据，不再只是准备状态或43 inspected数量推断。

### 57项新内容及旧发布保持

以已核 `1.27.1.1-c049ff9edb810ae4` 作基线加载全部1017份详情：只去release_id后，960份逐字段完全相同，包含全部旧88basic；变化集合精确等于hash/types10、transport17、response/access16、request/body14共57项，均由registration_only升为basic_verified，无额外变化或丢项。8参考去release_id后整个发布对象逐字段相同。

四份草稿SHA仍分别等于各自最终准备通过值；正式knowledge共145项，其中新57条与草稿逐字段相同。57份实际详情的summary、syntax、defaults、inheritance、limitations、patch_status、related、phase、mechanism及documentation逐项核对，owner/component/name、注册位置、回调、context及compile_guards与catalog/旧索引保持。未强填部署availability，仍unverified；不因基础说明存在提升deep。

R16修正句实际接入：client_header_timeout限定所引HTTP/1、不保证发送408报文。单缓冲TODO及协议分派、post_action无有效XML且默认未核、temp_path默认未核均保留。这里核的是已审事实真正发布，不重复57项语义研究。

### 全来源、覆盖口径与冻结差异

调用实际validatePublication检查index、全部1017详情及8参考，通过。对所有发布来源共2479段（新57项占506段），逐段读取固定Git对象核完整原文、起止范围、revision、version、repository URL及kind，全部一致。新57项56个official-doc去XML注释保换行后均为有效节点；post_action没有伪造文档。所有事实source_ids经正式JSON门禁闭合。

coverage实际为1017/145/0，剩余872正文缺口与registration_only数相等。目录已完整不消除功能补丁待核、872项说明待补等gap，不将其称程序缺陷或C02已完成。Codex/内网/真实样例的既有gap没有在本轮被误清除，也没有为其执行越界验收。

五文件freeze核对：config、inventory、build、knowledge测试摘要保持上一节基线。distribution测试当前摘要为 `0e6cc8cf1c781f880f594c984b7f8c51c15365d92f890adf4f41f39bc4eb8434`；仅在内存将60000恢复30000后摘要精确回到上一节f0d411f3adcd76d69b97d454ee83ad29ef939b0f73c7327a526019ad12e20289，确认只有CLI timeout放宽，无断言或逻辑变化。

最终结论：该冻结candidate的C01正式范围、57基础内容实际接入、旧88与8参考保持、全来源及coverage独立审核通过，无确定问题打回。主正在执行的83tests、HTTP51647、Space8和坏最后gate/reference gate未在本线程冒称已过，留待主交接收口；本结论不等于C02全基础完成或C04最终交付。未运行根inventory/build、未操作浏览器或改产物，永久仅更新本review。

## catalog-scope防御门禁差异审核：通过

仅审核build新增validateCatalogScope及两个测试文件的相关差异，不重审已通过的C01/57内容。当前build SHA256为 `94ba0202e8d02e854947fc0c40160597eb5d17cff2e0b340edc0df935ad8eba6`，knowledge测试为 `767964ffd47967ea29940d4c539b08aa7e7ae58f44bd76a04619ff1dba36a726`，distribution测试为 `307450e84f38d614f56b28bf5f22919d499e54b4ad7cad5e5660634ab5d47afa`。

新增门禁在读取输入、确认版本及计算严格scopeComplete之后、任何发布输出之前调用。范围宣称完整时，检查矩阵组件唯一性/catalog组件所属、逐组件注册数；formal上游集合按component/module/array/file/line/end_line/name/flags/context_flags/callback/post/compile_guards排序比较。发行新增另核数量及module/name、patch文件、目标文件和最终hash映射，不混入上游集合。此检查对比已生成的正式矩阵与catalog，不替代上游固定来源门禁或重新证明任意被同时改写的矩阵。

本线程实际定向运行knowledge完整范围组1/1通过，包含正常全catalog及截短、改名、回调、compile_guards、发行patchhash五个拒绝反例。再运行distribution显式跨组件callback组1/1通过；其单项夹具显式matrix.scope_complete=false，真实build输出inventory_complete=false、registration_count=1、basic_verified_count=1，原四种坏callback仍拒绝并保留索引。不是通过放宽完整范围检查来迁就夹具。

另独立创建mkdtemp隔离目录，复制真实43组件完整矩阵并保留scope_complete=true，把真实当前index作为隔离旧输出；五种坏catalog分别调用实际build，5/5在目录/范围校验处拒绝。每次隔离index字节不变，knowledge目录只有原index，没有新增release或部分产物；根current也未改变。finally已清理全部本次隔离文件，未运行根build、修改来源或产品文件。

真实current仍为 `1.27.1.1-92e11537fd436a31`，index摘要仍 `73be7430af816ade5b35fe684034600286996b9d482eedeb90448a004f71cb44`。正常完整catalog通过新增纯校验；主报告正常npm build维持同release，本线程未重复正式build。已审C01与145basic/872待补结论保持，新增门禁准备/差异审核通过，无确定缺陷打回。

主交接的83/83原全测、桌面四查询及145范围文本、坏最后指令/reference隔离gate记录为主实际执行结果，不冒称本线程重跑或操作桌面。当前总数84尚未全量重跑；本线程仅确认上述两个相称定向测试及额外五次实际坏catalog构建拒绝通过，不表述为84/84。根文档口径同步与C04收口仍由主负责，永久只写本review。

## HTTP core剩余27项独立准备审核：通过

完整读取HTTP_CORE_REMAINDER_BASIC.json及NOTES，草稿SHA256为 `7a2265dc939a973cb0f79cb8a09ebfa9ea9661b16d09bc77a49ed08d2e7c8fc0`。仅审核这27项，未重做旧整C01或57项语义。当前正式knowledge仍145项，current为92e11537fd436a31。

### 身份、来源及文档

按component/module/name实际核catalog：排除发行patch新增后，ngx_http_core_module为83项，加ngx_http_module的http共84项。与当前145知识取差集，恰等于本27个唯一身份；与已发布前57项无重叠，不把no_error_pages纳入上游83，也不吞并core/HTTP/stream同名error_log。

全部注册、显式callback、owner及事实证据从固定Git对象读取；208处引用坐标有效，source_ids唯一且闭合，prepareKnowledgeFacts 27/27通过。callback均为实际注册函数定义，http owner为ngx_http_module，其余为ngx_http_core_module。context按真实注册核：http仅main，server仅http，location为server/location，listen与server_name仅server，limit_except仅location；error_page额外允许location内if，其余按注册http/server/location。四gzip项保留NGX_HTTP_GZIP，disable_symlinks保留NGX_HAVE_OPENAT，不据注册存在推定部署已启用。

25个官方XML引用均在去注释、保行号后的活跃节点内；gzip四项文档在gzip模块文档但真实owner仍HTTP core。open_file_cache_events原始节点存在、去注释后不存在；HTTP core文档无error_log同名节点，两项都没有伪造official-doc。商业版server_tokens字符串及resolver status_zone不作为当前开源语法。

### 27项逐义核对

| 指令 | 准备审核结果 |
|---|---|
| http | 初始化HTTP各模块上下文、解析/合并server/location并组织处理阶段；重复块拒绝，主层同名继承不适用，不等于监听指令。 |
| server | 建立独立server/location配置，地址和名称参与选取；不把配置存在等同端口已开放。 |
| location | 精确/前缀/正则/命名配置与实际callback、运行查找一致；命名仅server层，正则受PCRE能力限制。 |
| listen | 地址、端口、UNIX套接字及列举参数对应真实解析；http2参数弃用告警、ssl/http2/quic能力检查及quic互斥TCP选项有据。 |
| server_name | 普通/通配/正则名称用于虚拟服务器查找；$hostname是特殊解析值，不推广为任意变量。 |
| limit_except | 按方法掩码切换location配置，GET同时排除HEAD；具体拒绝/鉴权来自块内模块，不自动405。 |
| subrequest_output_buffer_size | 仅内存收集型子请求响应，已知长度或后续写入超缓冲均报错；不限制所有子请求总量或客户端正文。 |
| aio | off/on/threads及动态线程池名有真实分支；能力和文件发送路径限制明确，不承诺任意读写均异步。Linux缓存/非对齐路径不能据on推定不阻塞。 |
| aio_write | 仅NGX_THREADS、aio threads下为上游临时文件写入设置handler，不推广到客户端正文或任意文件写入。 |
| read_ahead | 非零且文件超过NGX_MIN_READ_AHEAD时提示；POSIX_FADVISE路径忽略size，缺接口可无操作，不保证预读字节数。 |
| directio | 达到阈值时尝试直接I/O；通常禁sendfile但NGX_HAVE_SENDFILE_NODISKIO例外保留，不隐去文件系统/平台约束。 |
| directio_alignment | 传入输出链的偏移对齐和对齐分配，不是文件大小阈值；不验证用户部署的选值。 |
| server_tokens | on/off/build枚举与四种相关输出分支相符；HTTP/1、HTTP/2无版本标识受patch改为OpenResty，HTTP/3 off仍字面nginx。off不删除Server头，on/build使用版本宏。 |
| error_page | 300–599但排除499；URI/命名location/外部重定向路径有别，内部URI除HEAD外设GET。发行版no_error_pages双方先后冲突、UNSET_PTR/NULL继承及本层数组不拼父数组均有原patch依据。 |
| error_log | HTTP身份回调委托核心目标/级别构建，主请求切换连接日志；拦截patch在常规写入前调用可选handler并防递归，不推定运行时已安装。 |
| open_file_cache | 缓存描述符/文件属性和可选错误，max及inactive/LRU清理不是正文缓存。 |
| open_file_cache_valid | 访问时结合created、valid及事件状态重验证，不是后台定时扫描；事件可直接确认缓存有效。 |
| open_file_cache_min_uses | 使用次数不足且没有引用时可关闭描述符，未必立即移除元数据；也参与事件注册条件。 |
| open_file_cache_errors | 控制查找/打开错误缓存，不关闭错误日志，需缓存对象存在。 |
| open_file_cache_events | vnode后端、有效fd及min_uses共同约束，失败回退普通重验证；事件回调移除条目，不泛称所有平台监听有效。 |
| resolver | 非Windows local=on读取/etc/resolv.conf，path读取指定文件，off仅跳过文件读取；无服务器仍报错。无IPv6构建接受ipv6=off但拒绝on；未配置不自动取系统DNS。 |
| resolver_timeout | HTTP解析上下文timeout传递到resolver事件，超时状态交给结果handler；不是HTTP整体或连接超时。 |
| gzip_vary | 已标记需区分Accept-Encoding时才控制相应Vary，不能当gzip总开关。 |
| gzip_http_version | 版本门槛仅为资格条件之一，其他Accept-Encoding等检查仍需满足。 |
| gzip_proxied | Via请求头识别；off优先拒绝，any仅放行该项条件，响应缓存头/Expires和认证头分支如实，不等同proxy_pass。 |
| gzip_disable | User-Agent不区分大小写正则或内建msie6；普通正则需PCRE，degradation另受编译条件限制。 |
| disable_symlinks | 实际openat/fstatat/uid比较及NOFOLLOW路径；from检查前缀和分隔符，off不可与from并用，不推广到第三方绕行打开路径。 |

已核默认/继承均引用实际merge：server_tokens、文件缓存五项、resolver_timeout及gzip三项；error_page发行继承单独有patch支持。其他默认/继承按草稿保留unverified，不为提高基础数量猜补事实。基础审核不要求填满所有可选事实，但不容许把未知写成已核。

### 本组局部patch实证与隔离build

独立mkdtemp Git archive中按冻结34项及既有substitutions回放，47个最终目标摘要全部匹配。149处上游Nginx注册/callback/owner/实现引用先核范围，再逐段比较：146处完整保留，仅server_tokens/implementation-4、error_page/configuration-definition、resolver/implementation-0三处变化，精确匹配notes且各有原patch证据。error_log新增拦截行为另由patch明确标affected；其引用原段不变不意味着整条日志链unaffected。server_header版本替换、内建页尾、no_error_pages及两resolver补丁原文均独立读取，未将回放后坐标冒充上游Git行号。没有重开旧C-R05或执行来源脚本。

随后独立隔离build以正式145知识加本27项，得到临时release `1.27.1.1-42e772f85f1511da`，1017注册、172basic、0deep、范围true、845注册项正文待补；27条均basic_verified并有module-owner来源。此处使用实际build包含既有catalog-scope及publication门禁，不是单纯源ID检查。proof和build临时目录均finally清理；正式current字节完全不变，未修改knowledge/catalog或其他产品文件。

结论：27项逐条准备审核通过，未发现需分级打回的确定缺陷；准备集合补齐上游HTTP core83加http1的基础说明差集，不包含全站剩余845项，也不宣称deep或C02全站完成。172仅是本线程隔离结果，正式仍145；待主正式合并并冻结candidate后另验27项实际接入、旧145与8参考保持。永久仅更新本review，审核完成后停写交接。

## HTTP access/auth/realip/referer 12项独立准备审核：通过

完整读取HTTP_ACCESS_AUTH_BASIC.json及NOTES，草稿SHA256为 `c7181a49a2436aae52492d1fa943a79af8968d561754c687705cd29412d26d94`。本组12个唯一身份全部命中catalog，与当前172项知识无重叠，分别覆盖access2、auth_basic2、auth_request2、realip3、referer3。仅给准备结论，尚未正式接入，不把主此前145+12的隔离157当作当前发布数量。

从固定Nginx e06bdbd4、OpenResty 8c37412c、nginx.org e8b58190 Git对象读取。105处注册/callback/evidence均在有效范围内；真实callback函数定义、module-owner、source_ids及事实状态闭合。12个XML引用经整文件去注释保行号后均为同名活跃节点，固定链接坐标一致。access/basic允许http/server/location/limit_except，auth_request/realip允许http/server/location，referer三项仅server/location；没有依据文档宽泛说法扩大context。realip在post-read/preaccess接入，不强填单一phase。

| 指令 | 独立逐义核对 |
|---|---|
| allow | 对连接地址按所属类别顺序取首条命中；无规则或未命中返回DECLINED。三类数组均未设置才整组继承，satisfy可能改变最终结果。 |
| deny | 非最长网段优先；命中403是本模块结果，satisfy any可以由其他成功检查放行。子层规则不追加父层。 |
| auth_basic | realm与file任一NULL即跳过；realm复杂值先求值再比较off。挑战401与文件/内部错误路径分开。 |
| auth_basic_user_file | 逐行用户名/密码与可选注释解析、ngx_crypt调用相符；独立继承file，非off realm仍必需；配置前缀与变量求值有据。 |
| auth_request | URI原文保存而非复杂值展开，off阻止父URI；等待子请求、空request_body/header_only及2xx/401/403/其他错误分支明确，401复制挑战头。 |
| auth_request_set | 完成后先在子请求求表达式并写主请求变量，再判断认证结果，失败也可能赋值；本项不发起认证，局部数组替代父数组。 |
| set_real_ip_from | 是替换地址的信任集合而非访问许可；主机名在配置期解析，各地址存入数组；新数组阻止继承。 |
| real_ip_header | 默认X-Real-IP；所选头缺失不回退，PROXY信息须已存在；成功替换保存旧地址用于清理恢复。 |
| real_ip_recursive | off最多一步，on从右向左每轮先核当前地址可信性；非法项保持已完成替换或拒绝，不保证整链真实性。 |
| valid_referers | 只提供变量，不自动403；主机小写、忽略端口，URI前缀按字节区分大小写。局部keys与未设置正则继承分别处理，none/blocked无主机键的合并错误有据。 |
| referer_hash_max_size | num_slot十进制整数，不支持k/m；默认2048且可继承，不等于允许域名条数。 |
| referer_hash_bucket_size | 初始64，仅本层建hash分支按cacheline对齐；复用父hash不因局部数值重建，不能把它写成字符串长度限制。 |

本线程另以mkdtemp固定Git archive实际回放34项有效补丁及既有版本替换，核142个hunk数量、47个最终SHA256全部一致；81处Nginx原始引用片段全部在回放后完整保留。未重新审计旧补丁范围或运行来源脚本，仅证明本12项所列事实的局部unaffected；不推广为整个请求链无影响。临时目录finally清理。未执行根build，也未修改knowledge/current。未发现需打回的确定缺陷，12项准备通过。

## HTTP core剩余27项正式接入审核：通过

锁定正式candidate `1.27.1.1-42e772f85f1511da`，本线程实际读取current及完整1017详情；current与该release/index字节相同。index SHA256为 `f0f951fbb8acc47751ab3440e4e2f29cce2691001d33adefba7be3c43dbf3898`，catalog仍为 `1a625dd29a400e23d49437082a895e7d4f37bab9bcd97c2e859415871531399c`。

与已审145基线92e11537fd436a31比较：恰27项从registration_only升为basic_verified；正式knowledge中这27项与已通过草稿逐对象完全相等。发布summary/syntax/defaults/inheritance/limitations/patch_status/documentation/related/phases按实际默认空数组规则逐字段相等；callback符号、compile_guards及注册/显式回调/各evidence坐标均与草稿/catalog一致。27条发布235处sources（含27处分发版本来源）逐处对固定Git原文、revision、URL及行号核实，无工作树污染或patch行号冒充上游。

其余990条详情（含旧145项basic及845项待补）除release_id外逐字段不变；8份reference payload同样不变。实际validatePublication对全1017详情、index和references通过，analysis/coverage与current一致。按实际全部详情、reference和coverage重新计算内容摘要，重现release后缀42e772f85f1511da。读取结束current字节仍未改变。

结论仅为本27项正式接入通过：1017注册、172basic、845registration_only、0deep、8refs、inventory_complete=true；不是C02全站完成。主报告145基线84/84全测（36.8秒）记为主执行证据，本线程没有重复无变化CLI/scope全测或操作桌面。与上一节12项准备结论分开，不把未接入12项计入172。

## HTTP rewrite全模块7项准备审核：6项通过，return待最小修正

完整读取HTTP_REWRITE_BASIC.json及NOTES，审核草稿SHA256为 `04d107e1d78510a0c234093ced60aba1da50b308cc14e11de69485aefc798b66`。集合恰等于catalog的ngx_http_rewrite_module全部7身份，且未进入当前172知识。实际读取完整注册、编译入口、脚本执行分支、变量注册和对应活跃XML，不以来源ID检查替代语义。

60处引用范围有效、7处活XML及固定URL准确，显式callback与module-owner相符，事实source_ids闭合。独立临时回放34patch，142hunk数量与47最终摘要一致，46段Nginx引用均完整保留，finally清理。此证明不等于正文每句话都准确；主179隔离build记录也不代替以下语义问题。

| 指令 | 准备结论 |
|---|---|
| rewrite | 通过。URI不含args作为匹配输入；last/break与301/302分支、旧参数追加/尾问号抑制、循环计数超限500有据。自动重定向先设302，显式permanent可覆盖301。 |
| return | 除下述WC-R17外，状态解析、URL单参数302、五种Location状态、变量文本、退出脚本及无文本444路径均相符；暂不通过本条。 |
| break | 通过。退出当前脚本，不直接生成响应；uri_changed时清valid_location及uri_changed，后续阶段继续，区别于last。 |
| if | 通过。空或单字符0才是假，0abc不因此为假；限定比较/正则/文件测试。location内切换loc_conf，server内不切换，块内仍受context约束。 |
| set | 通过。配置期编译、请求期赋值或setter；变量名和不可变既有变量由实际注册入口拒绝；不混入stream同名项。 |
| rewrite_log | 通过。notice分支与HTTP debug条件独立存在，off不能关闭整个日志链；默认off及标志继承有实际merge依据。 |
| uninitialized_variable_warn | 通过。仅本模块未赋值读取告警，on/off均返回空值；默认on及标志继承相符，不承诺初始化用户值。 |

完整指令组继承/默认保持unverified可以接受，不要求填满可选事实。没有因旧C01或source不变重新打开既有问题。

### WC-R17 / P2：return 444不能无协议限定地保证终止整条连接

位置：HTTP_REWRITE_BASIC.json:229，return的第二条limitations。目前写“在请求结束路径终止连接”，但所引ngx_http_request.c:2541–2553只证明调用ngx_http_terminate_request；固定Nginx进一步在3666–3695的ngx_http_close_request中，若NGX_HTTP_V2且r->stream存在，调用ngx_http_v2_close_stream并立即返回，不走ngx_http_close_connection。v2/ngx_http_v2.c:4397–4439正常关闭的是stream，并可发送RST_STREAM，不能推断关闭整个HTTP/2传输连接。

影响：会使用户错误理解同一HTTP/2连接上其他请求的处理边界。此为本次新增正文的准确性问题，不是旧产品/patch门禁回归。最小修复建议仅收窄为“return 444; 不发送普通响应头，而进入请求终止路径；不能解释为客户端必收到HTTP444报文，也不据此保证所有协议下整条传输连接都关闭。”若只保留请求终止的事实，可沿用现有引用而无需扩写协议实现；若新增明确HTTP/2事实，应补相应固定来源及局部proof。

本组暂为6项准备通过、return待修，不能宣称7项整体通过或发布。仅需修正文句后差异复核；未改草稿、knowledge或current，永久仅追加本review，完成本轮后停写交接。

## WC-R17差异复核：关闭，rewrite 7项准备通过

仅复核return第二条limitations及NOTES修正记录。新句明确进入请求终止路径、不保证所有协议下整条传输连接关闭，与原引用ngx_http_request.c:2541–2553的实际调用相符；没有增加HTTP/2具体实现承诺或新增引用，不需扩大局部patch证明。

修正后HTTP_REWRITE_BASIC.json SHA256为 `ae73f860b57784092d3ec3a423d1216ae412a5eeda58052febd277ef666b74d2`。本线程只在内存中将新句替回原句，重现上一审核整文件SHA256 `04d107e1d78510a0c234093ced60aba1da50b308cc14e11de69485aefc798b66`，因此确认除这一句外全部字节不变；其余6项、source_ids及来源坐标均沿用既有通过结论，没有重复语义审核或旧patch回放。

NOTES已明确179隔离candidate 62c29cab01ee7074属于修正前记录，不能作为修正后发布身份。WC-R17关闭，结合其余6项已有结论，本7项准备审核通过；尚未验收正式接入或新增candidate。实际读取current仍为 `1.27.1.1-42e772f85f1511da`，正式172口径不变。本轮仅追加本review，未读取未正式交接的proxy草稿，未运行build或修改knowledge/current；停写等待下一次正式交接。

## HTTP proxy 68项独立准备审核：63项通过，5项待修

完整读取HTTP_PROXY_BASIC.json及HTTP_PROXY_BASIC_NOTES.md。冻结草稿SHA256为 `97999ae434c120d65d3450b9c6323e46bbfed1490db3125788b39eee30338f5b`。逐条核正文、语法、回调、运行代码、默认合并和活跃XML，不以schema或抽查代替语义。全部68身份与catalog的nginx/ngx_http_proxy_module集合精确相等且无重复，与当前knowledge不重叠，不包含商业proxy_cache_purge。仅本批准备审核，未对旧scope或内容重新研究。

585处来源坐标均有效，68个显式callback确为各自注册函数定义，owner均为proxy模块；68个官方XML同名节点经整文件去注释保行号后有效。核心通用slot、proxy专用callback、upstream bind、脚本complex value、file cache入口均已读取。普通指令按注册context，proxy_pass特殊location/if/limit_except及cache_path仅http不混同；缓存和TLS编译guard沿用catalog，不据源码存在宣称部署启用。默认17项和继承16项明确unknown可保留，cache_path继承不适用也成立；不要求为凑数量补齐未知事实。

### 逐项结论

下表“通过”仅指本草稿所列有限基础事实准备通过；待修5项为proxy_pass、proxy_send_lowat、proxy_headers_hash_bucket_size、proxy_read_timeout、proxy_ssl_ciphers，分别受下方R18–R20影响。

| 指令 | 独立核对与结论 |
|---|---|
| proxy_pass | 语义成立：静态前缀替换、原始/规范化URI、变量URL和upstream组/resolver有不同分支；但引用及phase待R18/R20修正。 |
| proxy_redirect | 通过。Location/Refresh首条匹配，default要求proxy_pass先配置且非变量URL，不能当正文链接重写。 |
| proxy_cookie_domain | 通过。已有Domain属性、文本忽略大小写/前导点处理、正则及首命中、数组替代/off均相符。 |
| proxy_cookie_path | 通过。文本前缀与正则区分，~与~*大小写规则有据，不创建缺失Path。 |
| proxy_cookie_flags | 通过。名称/flag复杂值、首命中不叠加、添加/移除各属性及无效flag忽略有据；TAKE1234对应cookie加1–3flag或off。 |
| proxy_store | 通过。200、完整性及长度条件下临时文件转存，本地映射/变量路径和cache冲突明确，不冒充有效期缓存。 |
| proxy_store_access | 通过。权限槽位、默认0600及重命名路径权限传递有据，不改owner或授权访问。 |
| proxy_buffering | 通过。响应管道与非缓冲路径分开，X-Accel-Buffering及ignore_headers可影响选择，off不是零内存。 |
| proxy_request_buffering | 通过。正文流式分支受body_values/pass_request_body/chunked与1.1限制；pipelining原patch将header_sent改为request_body_sent。 |
| proxy_ignore_client_abort | 通过。断连检查安装条件与store/post_action/cache例外保留，非保证完成的后台机制。 |
| proxy_bind | 通过。静态/复杂值源地址、off、transparent平台条件及非法动态值处理相符。 |
| proxy_socket_keepalive | 通过。SO_KEEPALIVE而非连接池，off不主动开启，不配置探测周期。 |
| proxy_connect_timeout | 通过。连接及TLS握手等待、60s合并与发行请求级字段复制/读取相符，不是总期限。 |
| proxy_send_timeout | 通过。NGX_AGAIN且不可写或body_blocked时加timer，推进时移除；请求字段及pipelining补丁有据。 |
| proxy_send_lowat | 正文及平台检查成立；运行来源截掉实际调用，待R18。 |
| proxy_intercept_errors | 通过。>=300路径还要匹配error_page；no_error_pages影响映射，即使所引原段不变也标affected。 |
| proxy_set_header | 通过。空值抑制配置字段和对应原头，局部数组替代父数组再补内部默认；host/port变量NOHASH补丁未被解释成目标计算变化。 |
| proxy_headers_hash_max_size | 通过。哈希最大桶数而非字段数/报文大小，默认512；真实num_slot只接受整数。 |
| proxy_headers_hash_bucket_size | 正文64及cacheline对齐正确；defaults的source_ids未包含对齐行，待R19。 |
| proxy_set_body | 通过。编译替换正文、长度计算与优先于原始正文链相符，不泛称改写全部请求对象。 |
| proxy_method | 通过。u->method优先，其后复杂值method和客户端method，保留缓存HEAD转GET边界。 |
| proxy_pass_request_headers | 通过。仅控制原始头复制，配置/内部构造头仍独立存在。 |
| proxy_pass_request_body | 通过。原始正文链开关，set_body另一路径；不自动修正所有头元数据。 |
| proxy_buffer_size | 通过。首部缓冲、过大头失败及cache key/header占用检查有据，不是响应总量限制。 |
| proxy_read_timeout | 正文计时边界成立；“头字节不逐个重置”的来源缺读取循环，待R18。 |
| proxy_buffers | 通过。默认8页、至少2块、按需分配复用，非全进程预算。 |
| proxy_busy_buffers_size | 通过。忙recycled缓冲计量；源码上界比较是大于才拒绝，草稿“不能大于”准确，不照错误文句写严格小于。 |
| proxy_force_ranges | 通过。设置allow_ranges，非缓存single_range、已缓存解除，实际输出仍受范围过滤器条件限制。 |
| proxy_limit_rate | 通过。响应缓冲管道按请求计算字节/秒与延迟，变量和0不限速有据，非下游总带宽。 |
| proxy_cache | 通过。固定/变量zone及off/未知zone、cache与store互斥、缓存资格有据。 |
| proxy_cache_key | 通过。key_start加变量URI/原始unparsed_uri/规范化替换URI与args的分支，不等同任意求值的$scheme$proxy_host$request_uri。 |
| proxy_cache_path | 通过。MD5、共享键区、目录层级、manager/loader参数及min_free平台限制有据，商业purger参数不冒充开源支持。 |
| proxy_cache_bypass | 通过。非空且非单字符0跳过缓存读取，仍可能保存本次响应。 |
| proxy_no_cache | 通过。同谓词清cacheable，不负责绕过已有命中。 |
| proxy_cache_valid | 通过。上游期限优先；仅时间默认200/301/302、any和配置时长不等于强制缓存许可。 |
| proxy_cache_min_uses | 通过。共享条目uses与min_uses资格、有文件/错误缓存例外，不当请求限流。 |
| proxy_cache_max_range_offset | 通过。>=阈值禁本次填充，0和MAX值有特殊分支，后缀范围另处理，不拒绝客户端请求。 |
| proxy_cache_use_stale | 通过。已有过期项、updating/error/NOLIVE/状态位、off及响应stale扩展分别处理。 |
| proxy_cache_methods | 通过。GET/HEAD合并强制加入，POST可选；不自动把正文加入cache key。 |
| proxy_cache_lock | 通过。键级填充协调，不是全局锁，age/timeout使“一直只有一个填充者”不成立。 |
| proxy_cache_lock_timeout | 通过。等待到期置lock_timeout=0，经SCARCE不缓存转上游，不终止原填充请求。 |
| proxy_cache_lock_age | 通过。共享lock_time到期可取得更新资格，非新鲜度或原请求截止期限。 |
| proxy_cache_revalidate | 通过。缓存元数据变量驱动条件头，304更新有效信息，不保证每次都304。 |
| proxy_cache_convert_head | 通过。默认on，缓存HEAD设u->method=GET；off需自行区分方法键。 |
| proxy_cache_background_update | 通过。过期项及updating/stale_updating资格、后台clone子请求明确，非定时预热。 |
| proxy_temp_path | 通过。响应临时文件而非客户端正文，use_temp_path=off缓存目录分支明确。 |
| proxy_max_temp_file_size | 通过。非cacheable分支的临时文件容量，cache/store绕过，0不关闭内存缓冲。 |
| proxy_temp_file_write_size | 通过。非cacheable分支按批选链限制，不当磁盘速率或套用cache/store。 |
| proxy_next_upstream | 通过。错误/指定状态、已发送POST/LOCK/PATCH与non_idempotent、未缓冲不可重放和已输出后不能补救均有据。 |
| proxy_next_upstream_tries | 通过。收紧peer预算，0取消额外上限而非无限重试。 |
| proxy_next_upstream_timeout | 通过。重试决策检查peer.start_time窗口，不是到点打断I/O的timer。 |
| proxy_pass_header | 通过。从隐藏集合移除字段，不关闭特殊处理。 |
| proxy_hide_header | 通过。默认具体字段集合非任意X-Accel通配，隐藏与禁特殊处理有别。 |
| proxy_ignore_headers | 通过。仅接受列举掩码，缓存/内部跳转/限速/缓冲/charset处理区别于删除头。 |
| proxy_http_version | 通过。固定1.27.1只有1.0/1.1，默认1.0；1.1不自动改Connection或建池。 |
| proxy_ssl_session_reuse | 通过。peer set/save session及开关，非TCP连接复用。 |
| proxy_ssl_protocols | 通过。固定源合并TLSv1/1.1/1.2/1.3掩码，与当前其他版本不混用；语法接受不保证库可协商。 |
| proxy_ssl_ciphers | SSL_CTX_set_cipher_list语义成立且未承诺TLS1.3全套控制；代理调用证据偏移，待R18。 |
| proxy_ssl_name | 通过。目标名称来源/表达式、端口剥离、SNI与verify独立，非客户端Host或任意改写后的proxy_host。 |
| proxy_ssl_server_name | 通过。默认off，空名/方括号IPv6及IPv4检测阻止SNI，on不打开verify。 |
| proxy_ssl_verify | 通过。默认off，开启须trusted_certificate，链结果与check_host均核。 |
| proxy_ssl_verify_depth | 通过。默认1传入TLS上下文，不启用verify或表示证书数量。 |
| proxy_ssl_trusted_certificate | 通过。verify路径加载CA位置，与客户端身份文件有别，单配文件不自动验证。 |
| proxy_ssl_crl | 通过。verify路径加载PEM吊销文件并设CRL_CHECK/ALL，不定期联网更新。 |
| proxy_ssl_certificate | 通过。静态配置加载与变量连接期加载分开，须key配对，不承诺上游接受。 |
| proxy_ssl_certificate_key | 通过。私钥文件/变量及engine库条件、与客户端证书配对有据。 |
| proxy_ssl_password_file | 通过。配置期逐行口令、加载私钥轮询尝试及变量路径保留口令，不是HTTP认证。 |
| proxy_ssl_conf_command | 通过。常规TLS后SSL_CONF应用，库接口拒绝及数组继承相符，不承诺任意命令都支持。 |

### WC-R18 / P2：四项关键运行证据被截断，不能据EOF通过宣称引用闭合

正文经独立读取完整固定源码基本成立，但以下草稿保存的片段不足以呈现其明确宣称的运行链。修复仅需调整/补充对应来源，不需要泛化扫描或重写功能：

| 条目/来源 | 当前缺口 | 最小修正方向（均为固定Nginx原坐标） |
|---|---|---|
| proxy_pass implementation-1/2 | proxy_module.c:1305–1341从escape计算中途开始，遗漏1293–1303的三分支及loc_len选择；1420–1463从else if开始，遗漏1417–1418变量URI实际写入。 | 补1293–1311和1417–1444（或最小扩展原范围），使变量URI/原始URI/规范化替换的分支证据完整；不能借另一条cache_key的来源替代本条。 |
| proxy_send_lowat implementation-0 | upstream.c:2122–2130只有错误收尾及tcp_push分支，完全漏掉2121将u->conf->send_lowat传入ngx_handle_write_event的调用。 | 调整到2121–2125等包含真实调用的范围。正文正确不意味着相邻代码可充当使用证据。 |
| proxy_ssl_ciphers implementation-0 | proxy_module.c:5007–5012是调用后的错误块和下一项certificate条件，不含cipher配置传入；通用SSL_CTX_set_cipher_list函数单独不能闭合代理调用。 | 调整到5005–5009，保留与openssl.c实际处理函数的连接。 |
| proxy_read_timeout limitations | 现片段证明请求发完加timer及正文timer路径，但未包含响应头recv循环；“不是每收到头字节都重置”不能仅从初始化片段或泛化XML推出。 | 增加upstream.c:2436–2466（含#if 0内不生效的重置代码、NGX_AGAIN返回及成功读更新），按活代码解释。 |

四项补充后的引用必须仍按固定SHA核范围、对新增slice做局部补丁比较；不要求重做旧C01或无变化全数据。HTTP_PROXY_BASIC_NOTES中“来源闭合”口径在差异验收前须保持待审。

### WC-R19 / P2：桶对齐已核事实没有绑定实际对齐来源

proxy_headers_hash_bucket_size.defaults.text明确写“再按ngx_cacheline_size对齐”，但source_ids只有merge-default；该ID仅proxy_module.c:3837–3838默认64两行，没有3840–3841的ngx_align调用。完整对齐原文其实已在本条implementation-0:3837–3853，无需新增研究：把该来源绑定到defaults（或扩展merge-default至3841）即可。当前默认值事实的引用不能算闭合；正文本身无须改变。

### WC-R20 / P2：proxy_pass仅标configuration，遗漏已知content处理阶段

HTTP_PROXY_BASIC.json:91把proxy_pass的phase写成configuration。真实专用callback在proxy_module.c安装clcf->handler=ngx_http_proxy_handler；core_module.c:1381–1383复制到r->content_handler，1252–1262在content phase调用。阶段并不等同配置解析入口，后者已有独立configuration_entry字段；REQUIREMENTS.md:50要求按实际相关阶段导航。当前数据会使content筛选遗漏HTTP代理内容处理入口，与已有stream proxy_pass/content及本轮stub_status/content口径不一致。

最小修正：将proxy_pass标为content并保留/补充上述固定调用链来源；其他代理参数不要求机械改成content，不能因同属proxy就统一推定请求阶段。此问题只针对已知内容入口，不扩大为新阶段体系或UI改动。

### 本批独立patch与准备边界

本线程mkdtemp中用固定Git archive回放34项有效patch及冻结substitutions；计142个hunk、47个最终SHA256全部相同。442处Nginx原始引用433处完整保留，9处变化精确等于NOTES：request_buffering/implementation-2，connect_timeout/implementation-0和1，send_timeout/implementation-0和1，set_header/implementation-5，read_timeout/implementation-0、1、2。六条affected及其原patch实际逐句核对，包括没有直接改所选片段但依赖no_error_pages的intercept_errors；其余局部unaffected不推广到整链。临时目录finally清理，没有运行Nginx、OpenResty或生成器。

Sol报告的172+68隔离240/e135de6ae379daeb记录为实施结果，本线程没有在存在上述问题时重复build或将其视为语义通过。当前结论为63项准备通过、5项待修；R18–R20交主转派Sol，68项整体不得合并宣称通过。修复后只需差异复核相关条目及新增来源，不重审其余63项。

## access/auth 12项与修正后rewrite 7项正式接入审核：通过

按队列在68项准备检查后独立读取冻结candidate `1.27.1.1-ea24760d6fa6cabf`，以已审42e772f85f1511da/172为基线。current与该release/index字节相同，index SHA256 `4c1a56d21fe8f705666b0de5c72194c0363925d574e81f1439c44c72010feb3d`；catalog仍为 `1a625dd29a400e23d49437082a895e7d4f37bab9bcd97c2e859415871531399c`。

正式knowledge中新增19个完整身份与12项草稿及R17修正后7项草稿逐对象相等；发布summary/syntax/defaults/inheritance/limitations/patch_status/documentation/related/phases逐字段一致，return确为收窄后的请求终止句。19项均从registration_only升basic_verified，callback/guard及来源坐标准确；184处发布sources（含19处分发版本）全部对固定Git原文、revision和URL逐处一致。

其余998条详情（含旧172basic和826待补）除release_id外逐字段不变，8reference payload不变。全1017详情/index/references通过validatePublication；analysis/coverage与current一致。独立按实际全详情、参考和coverage重算发布摘要，重现ea24760d6fa6cabf；读取前后current字节不变。实际191basic/826registration_only/0deep/8refs、scope true，19项正式接入通过，但全站C02仍未完成。未把proxy待审68或以下log/status6计入正式覆盖，未重跑无变化CLI/scope或浏览器。

## LOG_STATUS 6项独立准备审核：通过

完整读取LOG_STATUS_BASIC.json及NOTES；草稿SHA256 `d7b27184df6c86bb3ea537cc82803b5c7d83414692d91a1853258c953aefbfa0`。六个唯一catalog身份均未在当前191知识内；HTTP三项、stream两项与stub_status一项分开，不重复既有stream access_log或发行log_escape_non_ascii。

| 身份 | 逐义核对 |
|---|---|
| ngx_http_log_module/log_format | 命名格式仅http，combined预建；文字复制、普通变量default缺值为连字符、json/none缺值为空有据。JSON变量转义不等于构造合法整行JSON；非ASCII开关及默认on取原发行patch，不照未补丁XML泛化。 |
| ngx_http_log_module/access_log | 实际LOG phase及结束时loc_conf，条件空/单0跳过、多个目标及off优先、数组整体继承相符。combined及NGX_HTTP_LOG_PATH不猜安装路径；变量名/syslog禁buffer、flush需buffer、gzip需zlib，以及变量日志root检查有据。 |
| ngx_http_log_module/open_log_file_cache | max非零，可选inactive10s/valid60s/min_uses1、off及对象/参数继承有据；缓存描述符与文件信息，valid访问重验证非后台轮转，低uses关闭fd不保证立即删元数据。 |
| ngx_stream_log_module/log_format | stream主层空格式数组无HTTP内置combined；普通变量缺值default连字符、json/none为空，默认控制/引号/反斜杠/非ASCII转义不受HTTP开关；格式定义不启用access_log。 |
| ngx_stream_log_module/open_log_file_cache | 独立stream合并及写文件链相符，默认参数与off准确；没有借用HTTP请求root检查，缓存不解除变量日志禁buffer。 |
| ngx_http_stub_status_module/stub_status | NOARGS/TAKE1兼容注册，callback不读参数，off不是关闭开关；安装内容handler，GET/HEAD与405、header_only及全局原子计数text/plain准确，不承诺部署启用或逐upstream健康监测。 |

59处注册/callback/evidence全部有效EOF，真实显式函数定义、owner和source_ids闭合，6个同名XML节点去注释后活跃且固定URL对应原坐标。HTTP log_format仅http、access_log另含location-if/limit_except；两域open_log_file_cache及stream log_format、stub_status的context均按实际注册核定。

独立临时固定Git archive回放34patch，142hunk数量与47最终hash全部一致；45段Nginx来源42段原文保持，恰3段改变：HTTP log_format/implementation-1，HTTP access_log/implementation-2与3，与log_escape_non_ascii原patch43–117对应。两项标affected、其余四项仅局部unaffected正确。临时目录finally清理，根current读取前后保持191。主隔离197/f8d93a840d4f0719为主执行记录，本线程没有执行根build或把隔离结果当正式覆盖。

结论：6项准备通过，无确定缺陷打回；待主合并后再锁实际candidate检查接入。当前三块结论分开：proxy68整体待R18–R20，19正式接入通过，log/status6仅准备通过。本轮永久只追加本review，没有修改产品/knowledge/current或来源，未操作浏览器，收口停写交接。

## LOG_STATUS 6项正式接入审核：通过

以已审191项 `1.27.1.1-ea24760d6fa6cabf` 为基线，独立读取正式candidate `1.27.1.1-f8d93a840d4f0719`。current实际入口为dist/knowledge/index.json，与release/index字节相同，SHA256 `841598da80eeaaa1b65c7f91992b7632f8e8e58487781baae462d2c50dbd29f6`；catalog仍为 `1a625dd29a400e23d49437082a895e7d4f37bab9bcd97c2e859415871531399c`。

六项草稿SHA256仍为 `d7b27184df6c86bb3ea537cc82803b5c7d83414692d91a1853258c953aefbfa0`，正式knowledge中六个完整身份逐对象与草稿相等。实际发布summary/syntax/defaults/inheritance/limitations/patch_status/documentation/related/phases逐字段一致；六项均由registration_only升为basic_verified，callback、compile_guards和各来源坐标与catalog/草稿相等。65处发布来源（含6处分发版本）逐处核对固定Git原文、有效EOF、revision及完整URL，均一致。

其余1011条详情（旧191基础与820仅注册）除release_id外逐字段保持，全部1017身份及顺序保持，8份reference payload不变。实际全详情/index/references通过validatePublication；analysis/coverage与current一致。独立剥离发布信封后按实际详情、参考和coverage重算摘要，复现f8d93a840d4f0719；读取前后current摘要保持。当前1017注册/197基础/820仅注册/0深度/8参考、范围true，本批正式接入通过。

仅核本次增量发布及旧项保持，未重做旧内容研究、scope、CLI或浏览器，未运行根build。首次定位current路径未命中，改用真实index入口后完整检查通过；没有把失败读取算成验证。本轮只追加review，未修改产品或current。proxy68仍待R18–R20；P01另行准备审核，不计入197正式覆盖。

## P01 HTTP upstream 11项独立准备审核：10项通过，least_conn待补引用

完整读取HTTP_UPSTREAM_BASIC.json及HTTP_UPSTREAM_BASIC_NOTES.md，冻结草稿SHA256 `a27c24d12f10d2f62c73cba6c4be034e770ad344e89193d5f6f109abb238be72`，NOTES SHA256 `7a7b35665303c11310001c0e736d3956380a457e0ff5f1f1c86378b6721d7b56`。11个唯一完整身份精确等于catalog的7个owner全部注册集合，与当前197知识无重叠。逐项读取固定源码、配置回调、运行片段及去注释后的活跃官方XML；未将实施方隔离202或schema通过代替语义审核。

### 逐项结论

| 指令 | 独立语义结果 |
| --- | --- |
| hash | 通过。复杂键编译、普通加权哈希与ketama路径分开，160乘权重点及排序去重有据；空键/单peer/尝试阈值回退、down/失败/max_conns与无backup声明相符。 |
| ip_hash | 通过。取connection sockaddr，IPv4前三字节、IPv6完整16字节及NGX_HAVE_INET6条件准确；不直接读取任意X-Forwarded-For，映射可受节点状态和回退影响。 |
| keepalive | 通过。先原选址再按sockaddr查缓存，每worker空闲容量及LRU成立；必填正整数、算法先配置、错误/协议/request_body_sent等入池条件和HTTP默认Connection: close说明有据。 |
| keepalive_time | 通过。默认1h，连接start_time与当前时间严格大于比较发生在归还路径；不设独立总寿命定时器，不保证到点打断请求。 |
| keepalive_timeout | 通过。默认60s，入池加读timer、取出取消、超时或异常close并移回free队列；不混同客户端keepalive或proxy_read_timeout。 |
| keepalive_requests | 通过。默认1000，连接使用时requests递增，归还时大于等于上限不再缓存；上层finalize关闭未缓存连接，不解释为提前中断第N个请求。 |
| least_conn | 正文成立：活动连接/权重交叉乘积、并列加权选择、备用组和单peer回退均在完整源码成立；但单peer回退的引用缺失，待R21。 |
| random | 通过。按权重随机，two选择不同候选并比较连接/权重；固定回调只接受two及可选least_conn，不支持商业least_time，保留尝试回退和无backup边界。 |
| zone | 通过。共享peer元数据及锁，不共享worker socket缓存；显式至少8页、省略size由同轮同名声明补足、零容量/用途/大小冲突拒绝，noreuse=1限制reload复用，均有实际证据。 |
| upstream | 通过。http层命名组、独立srv/loc上下文和共享main上下文、空组拒绝、默认加权轮询成立；balancer特殊状态提前finalize按发行补丁明确，不照文档泛化重试所有节点。 |
| server | 通过。固定开源参数白名单、默认80/1/0/1/10s、域名多peer、算法flags限制有据；活动连接与空闲池区分、单peer仍检查down/max_conns、失败由协议peer.free状态决定均准确。 |

134处registration/callback/evidence均为有效固定文件坐标，110处来自Nginx；11个显式callback均为真实函数定义，owner匹配，source_ids均能解析。11个同名XML节点去注释后有效。upstream仅http，其余10项仅http.upstream；catalog编译guard均为空数组，不据此宣称部署启用。11项默认及不按server/location层级继承的表述均已逐义核对。

### WC-R21 / P2：least_conn单peer回退没有保存实际分支证据

HTTP_UPSTREAM_BASIC.json:1039将“单 peer 回退共用轮询路径”标为verified。真实固定Nginx `src/http/modules/ngx_http_upstream_least_conn_module.c:114–116`为 `if (rrp->peers->single)` 及调用 `ngx_http_upstream_get_round_robin_peer(pc, rrp)`。但该项implementation-0只到96行、implementation-1从135行开始、implementation-2为257–287行；其余绑定来源及official-doc:760–775也没有此分支。因此事实正确，但发布时用户点击这些来源无法核实该明确运行断言；不能以范围未越EOF或完整源码另有此逻辑判为引用闭合。

最小修正：将该项implementation-1从135–255扩展为114–255（或单独增加114–116来源并绑定对应limitation及补丁核对）。无需改正文、算法或其他10项。NOTES同步保留待审口径；修复后仅复核此差异、固定新增片段及局部补丁保留，不重做其余10项。

### 独立补丁核对及准备边界

本线程在mkdtemp固定Git archive中独立回放34项有效补丁和冻结替换，核对142个hunk及47个最终SHA256全部一致。110段Nginx原始引用108段完整保留，恰两处改变：keepalive/implementation-3（upstream.c:2312–2345，upstream_pipelining），upstream/implementation-4（upstream.c:1555–1579，balancer_status_code）。两处实际补丁原文与草稿说明一致；另完整读取upstream_timeout_fields，未把proxy超时字段改动错误套入keepalive寿命字段。两项affected及其余九项局部unaffected口径成立，不推广到整个共享文件。临时回放目录已finally清理，没有执行来源脚本或根build。

结论：10项准备通过，least_conn因R21待补来源，11项整体暂不放行。实施方191+11=202隔离结果仅记录为实施证据；当前正式仍197，不将该组或proxy68计入正式覆盖。草稿、NOTES及current在本轮读取前后SHA保持，current仍为f8d93a840d4f0719/index SHA256 841598da80eeaaa1b65c7f91992b7632f8e8e58487781baae462d2c50dbd29f6。本轮永久仅追加review，未修改产品/current或两份P01输入。

## P06变量与链接校验剩余9项独立准备审核：7项通过，两项待补传值引用

完整读取HTTP_VARIABLES_BASIC.json及HTTP_VARIABLES_BASIC_NOTES.md。冻结草稿SHA256 `50f2e838c2904fb32e7557a79b336b9be0f63f0fff5074007b97bf7c3cce8b4d`，NOTES SHA256 `2b03b814b955d054705c4a89bd2da221866ae99e6555fd0da5a5dd7245c8a64c`。九个唯一component/module/name精确等于对应五个owner的catalog与当前197知识差集，无重复或重叠；不重新研究已发布rewrite7项，不等待proxy修复。

### 九项逐义结论

| 指令 | 独立核对结果 |
| --- | --- |
| map | 通过。输入及结果复杂值分别编译，getter先精确/主机掩码后顺序正则再default；空默认、字符串忽略大小写、hostnames顺序、NGX_PCRE与volatile含义成立。块内规则不扩成新注册身份。 |
| map_hash_max_size | 正文成立：num槽位、首次map默认2048、后设重复与最大桶数/键长限制有据；构建参数传值引用待R22。 |
| map_hash_bucket_size | 正文成立：num槽位、cacheline默认及对齐、键过大错误与非最优布局警告后忽略目标的区别准确；构建参数传值引用待R22。 |
| geo | 通过。默认connection sockaddr与指定变量分开，非法地址按INADDR_NONE查找；radix最具体匹配，ranges按IPv4处理；输出保存文字，proxy在局部addr上处理而不改写连接地址，默认空值/非递归成立。 |
| split_clients | 通过。输入复杂值、MurmurHash2及累积阈值，百分比两位精度/拒绝0/总量检查、星号兜底和未命中空值有据；输出直接保存文字，不承诺有限样本比例。 |
| secure_link | 通过。两表达式缺一无值、base64url解码16字节、正过期时间与严格小于当前秒数、空/0/1结果相符；expires上下文在验签前建立，不把它非空当验签通过，不自动阻止请求。 |
| secure_link_md5 | 通过。完整表达式字节作MD5，所需URI/时间/秘密均由表达式提供；getter只返回变量值。modern分别继承及仅两者都空才继承secret的merge边界准确。 |
| secure_link_secret | 通过。unparsed_uri中32个十六进制字符及非空link，MD5(link+文字secret)、成功返回link、无现代过期字段成立；本层互斥与继承准确。源码注册http/server/location而XML仅location的差异已明确披露。 |
| override_method | 通过。读取固定0.2方法表、callback、create/merge、双rewrite hook及完整handler。筛选按保存的原始method，目标忽略大小写；空/未知动态值只跳过新覆盖，off恢复已保存原方法，未夸大为任意跳过都撤销覆盖。 |

逐处核验74个来源（含catalog自动提供的2个coolkit registration_evidence）、真实回调定义、有效EOF、owner及事实source_ids解析。coolkit的module-owner与registration-container均来自正式catalog，草稿未重复添加ID，引用可正确解析。8个XML节点去注释后均为活跃同名节点，9项documentation固定URL与来源坐标一致。map/geo/split仅http；secure_link三项及override_method按真实http/server/location注册。六项变量getter的phase为null可接受，两个哈希配置为configuration、override_method为rewrite且正文说明两个rewrite阶段，不把getter强定为请求阶段。

### WC-R22 / P2：两个map哈希参数遗漏向实际构建器传值的来源

两项HTTP_VARIABLES_BASIC.json:193与327的implementation-1均为map_module.c:300–360，只显示调用ngx_hash_init/ngx_hash_wildcard_init；implementation-0为159–207，证明默认与对齐；implementation-2是通用ngx_hash_init。实际固定 `src/http/modules/ngx_http_map_module.c:296–297` 才把 `mcf->hash_max_size` 和 `mcf->hash_bucket_size` 赋给 `hash.max_size` 与 `hash.bucket_size`，这两行不在各自保存的任何来源内。

官方XML支持这两个配置用于map哈希，但仅有通用hash算法与相邻调用不能完整呈现本站关于实际构建桶数、桶大小和失败/警告行为的源码链。map指令本身的宽callback虽含该段，不是这两个独立身份的来源，不能借其他条目的片段闭合本条。正文经补读295–310确认正确；此处按此前代理参数遗漏实际调用的相同口径，仅打回引用，不要求改语义。

最小修正：两项implementation-1起点从300改为295，终点360保持，使参数初始化与实际调用同段展示；现有source_ids已绑定该来源，无需新增ID。同步NOTES并对新增295–299固定片段做局部补丁保持核对；修复后只复核这两项差异，不重审其他七项或rewrite旧项。

### 独立回放与结论

独立在mkdtemp固定Git archive中回放34补丁、冻结替换、142hunk及47最终SHA256，均与审计一致；49段本批Nginx来源全部原文保留，无变化片段。coolkit按固定Git源码及发行脚本724–730取入0.2版本核对，脚本中没有该组件patch操作。九项局部verified_unaffected口径成立，不推广到全部请求链；临时副本finally清理，未执行来源生成器或根build。

结论为7项准备通过、两个map哈希参数待R22补来源，九项整体暂不放行。主隔离197+9=206/673f9696c504e1fb仅记为实施证据，没有用它覆盖独立引用问题。current仍197/f8d93a840d4f0719，index SHA256保持841598da80eeaaa1b65c7f91992b7632f8e8e58487781baae462d2c50dbd29f6；两份输入读取前后SHA不变。本轮只追加review，未修改产品/current、草稿或NOTES。P01仍待R21，proxy仍待R18–R20，均不计入正式覆盖。

## R22差异复核：关闭，P06剩余9项准备通过

修复后HTTP_VARIABLES_BASIC.json SHA256为 `580f5511fd451262e4bdfaba45225b5e13f5cf709c47661b6647d5b50815d5c9`。仅在内存将两处start_line:295还原为300后，精确重现前版字节SHA256 `50f2e838c2904fb32e7557a79b336b9be0f63f0fff5074007b97bf7c3cce8b4d`，证明没有其他字段或字节改动。首次JSON重新序列化因格式差异未重现，改用保留原始字节的两处替换确认，并未将序列化差异当作产品变化。

两项implementation-1现均为固定map_module.c:295–360；296–297实际将mcf两个配置字段赋给hash.max_size/hash.bucket_size，后续调用同段可见，原source_ids继续有效。独立临时回放34补丁、142hunk及47最终摘要通过，扩展后的295–360完整片段保留；临时目录finally清理。NOTES SHA256 `2d3c8eddc20760134c14a1bcfd035c3331aa37c67f7eeb28a99a51c5bf71bd84`，追加内容明确673f9696c504e1fb为修复前隔离历史。

R22关闭，两项准备通过；结合前轮七项，P06剩余9项全部准备通过，可以交主合并后再锁真实candidate审核接入。没有重审无变化旧内容或将历史206算作当前正式发布；current仍197/f8d93a840d4f0719。

## P07限制、镜像与降级14项独立准备审核：通过

完整读取HTTP_LIMIT_MIRROR_BASIC.json及NOTES，草稿SHA256 `044d4e67d1967de9c314bf342e21c8717864bec062e7847072c5c0545171a248`，NOTES SHA256 `075d2aeaae238e600311d115144a209e32ca31effc8c6bc69a4329b9ee3f55b5`。14个唯一身份与四个owner的全部catalog注册精确相等，与正式197知识无重复；逐项核固定配置回调、运行处理、默认/合并与所引文档，不重做旧内容研究。

| 指令 | 独立逐义结论 |
| --- | --- |
| limit_conn_zone | 通过。复杂key、共享内存至少8页、名称绑定检查成立；空key及超过255字节跳过，定义区本身不配置限制列表。 |
| limit_conn | 通过。preaccess请求计数、1–65535、同层同zone重复拒绝、列表整体继承及pool cleanup减计数有据；不泛化为所有TCP连接，HTTP/2与HTTP/3并发请求口径有固定XML支持。 |
| limit_conn_log_level | 通过。四种枚举、默认error及继承正确；只影响阈值日志，dry_run亦同，不改变key异常及其他日志阈值。 |
| limit_conn_status | 通过。num槽位绑定400–599 bounds、默认503；阈值和节点分配拒绝返回配置值，dry_run另行放行，不保证最终响应原样到客户端。 |
| limit_conn_dry_run | 通过。默认off、两类拒绝标记REJECTED_DRY_RUN；已登记计数先cleanup_all，复杂值/cleanup登记内部失败仍可500，没有照XML泛化超限持续计数。 |
| limit_req_zone | 通过。key、共享区和正整数r/s或r/m速率，8页下限、空key/过长key边界正确；初始化及节点分配失败路径成立，未冒充商业sync支持。 |
| limit_req | 通过。毫秒差衰减、burst严格超出拒绝、delay/nodelay和多区最大延迟有据；显式burst=0/delay=0拒绝与内部默认0区别准确，列表不追加继承。 |
| limit_req_log_level | 通过。拒绝默认error、延迟默认warn，info下延迟仍info；不控制key或分配失败独立日志。 |
| limit_req_status | 通过。400–599及503默认、BUSY/ERROR拒绝路径有据；普通延迟与dry_run不从该分支返回状态，区别于同名变量。 |
| limit_req_dry_run | 通过。仍查找并计量，分别标记模拟延迟/拒绝，继续处理；不消除复杂值错误或其他模块判定。 |
| mirror | 通过。precontent仅主请求、固定目标列表、BACKGROUND子请求及保留方法/args、整体继承/off成立；body读取和创建子请求错误仍影响主请求，不承诺无成本。 |
| mirror_request_body | 通过。默认on，先读正文再创建子请求和preserve_body；off只跳过主动读取，core仍继承request_body指针，未误称自动清空正文或Content-Length。 |
| degradation | 通过。sbrk(0)减4MiB对齐函数地址的估算及大于等于阈值触发、默认0、请求触发的按秒缓存正确，不当RSS/cgroup或后台采样。 |
| degrade | 通过。仅204/444枚举、默认内部0及逐层合并成立；preaccess返回交generic phase finalize，444走终止路径，不当普通444响应或保证所有协议整连接关闭。 |

143处引用有效EOF，14个显式callback确为注册函数定义，owner匹配，source_ids无重复且均可解析。12个XML同名节点去注释后活跃；degradation两项引用真实模块源码，没有冒充官方XML。文档URL均与对应固定来源坐标相等。两zone及degradation仅http，其余按真实http/server/location注册；phase与实际hook吻合，空编译guard不代表部署启用。

独立mkdtemp固定Git archive回放34补丁和冻结替换，142hunk、47最终SHA256均一致；117段本批Nginx来源全部完整保留，无改变片段。仅确认本条判定与引用的局部unaffected，不扩大到下游响应链。临时副本finally清理，没有运行根build或来源程序；主隔离211/76383f958192de49仅记为实施结果，不作为已正式发布。

14项准备通过，无确定缺陷打回；待主合并后锁真实candidate再审接入。输入前后SHA保持，current仍197/f8d93a840d4f0719，index SHA256仍841598da80eeaaa1b65c7f91992b7632f8e8e58487781baae462d2c50dbd29f6。本轮永久仅追加review。随后按队列对proxy R18–R20作差异复核，不重审已通过的63项。

## Proxy R18–R20差异复核：关闭，68项准备通过

按主给定SHA锁定HTTP_PROXY_BASIC.json为 `8d07fae9f1ec4b46066ca9249184868d7596a96344d99f3aeeffd43ed4f38db6`，读取前后均相同，未发生需先回报的输入漂移。本轮按前次问题表及新增NOTES复核五个待修对象，不重审已通过63项。NOTES中“仅五对象变化、恢复旧摘要”的逐对象保持证明为实施方记录；本线程未另取得旧草稿副本作独立整文件差分，不将该记录冒充本轮实测。

- R18关闭：proxy_pass两个范围现为1293–1341、1417–1463，完整呈现变量URI/原始URI/规范化替换分支和实际写入；proxy_send_lowat现包含upstream2121的真实ngx_handle_write_event传值；proxy_ssl_ciphers现5005–5009真实传入plcf->ssl_ciphers，与既有openssl884–899的SSL_CTX_set_cipher_list闭合；proxy_read_timeout新增2436–2466，明确#if 0内timer不生效，成功读取更新字节数与buffer.last，正文及source_ids相符。
- R19关闭：proxy_headers_hash_bucket_size.defaults现绑定已有implementation-0，其3837–3853同时包含64默认及3840–3841对齐，原正文与合并来源不必改动。
- R20关闭：proxy_pass为content；原callback安装clcf->handler，新增core1381–1383复制至r->content_handler，再由1252–1262实际调用。新增阶段说明及其source_ids、patch_status绑定正确。当前68项只有proxy_pass标为content，没有机械更改其余阶段。

机械核验68个唯一身份仍精确等于catalog全部HTTP proxy，与正式197不重叠；588处来源有效EOF、显式callback定义和source_ids解析均通过。六项affected及62项局部unaffected划分保持。独立临时回放34补丁、142hunk与47最终SHA256一致；445处Nginx引用436段原文保持，9处改变精确仍为前轮列出的request_buffering/implementation-2、connect_timeout/implementation-0/1、send_timeout/implementation-0/1、set_header/implementation-5、read_timeout/implementation-0/1/2。

七段新增/调整来源最终均完整保持；独立计算slice SHA256逐项与NOTES表中七个摘要相等。R19复用来源另行读取确认绑定。临时目录finally清理，没有运行根build；主隔离265/4375cae305ce6262仍仅是实施结果，本轮不宣称正式接入。

五项差异通过，结合前轮63项，proxy68全部准备通过。当前正式仍197/f8d93a840d4f0719；后续须针对主实际candidate验证发布片段、content索引、旧项及参考保持。

## R21差异复核：关闭，P01全部11项准备通过

HTTP_UPSTREAM_BASIC.json锁定SHA256 `09d8f6a32cd2de17b560c0c85befaa6a57d98c3540cf3e7d639098b04b9eb682`。在内存只将least_conn/implementation-1.start_line由114还原为135，精确重现修复前整文件SHA256 `a27c24d12f10d2f62c73cba6c4be034e770ad344e89193d5f6f109abb238be72`，独立确认其他字段及10项对象未变。

新增114–134包含114–116单peer立即回退轮询分支，完整114–255保留旧段；原limitation与patch_status均已绑定同一ID。独立临时回放34补丁、142hunk和47最终摘要通过，least_conn整个文件与固定上游逐字相同。新增slice SHA256 `e992df887eba799467a19905ca858ec435db73377b369c5cb97aa0f943f31a7a`，完整slice `cddd77e0d82b34ca3a7c365175c2d7880f730cc80679be5a4804fd1997b1f0f1`，整个文件 `11ca1e4e60636b4967a941ff5b31953d84cebcf9d4c7d29dcc67704d6d5d81e0`，均重现NOTES实证。临时副本finally清理。

R21关闭，least_conn准备通过；结合前轮其余10项，P01全部11项准备通过。NOTES明确未新build，旧202不可当修正后candidate，本线程也未运行根build或重审旧10项。

## 当前可合并集合：四批102项，正式仍197

| 批次 | 项数 | 已审核草稿SHA256 |
| --- | ---: | --- |
| P06 HTTP_VARIABLES_BASIC | 9 | 580f5511fd451262e4bdfaba45225b5e13f5cf709c47661b6647d5b50815d5c9 |
| P07 HTTP_LIMIT_MIRROR_BASIC | 14 | 044d4e67d1967de9c314bf342e21c8717864bec062e7847072c5c0545171a248 |
| HTTP_PROXY_BASIC | 68 | 8d07fae9f1ec4b46066ca9249184868d7596a96344d99f3aeeffd43ed4f38db6 |
| P01 HTTP_UPSTREAM_BASIC | 11 | 09d8f6a32cd2de17b560c0c85befaa6a57d98c3540cf3e7d639098b04b9eb682 |

以上四批全部准备通过，R18–R22均关闭。独立按完整身份计算四批互不重叠、与正式197不重叠，共102新增；合并后预期299基础、718仅注册、1017注册、0深度，8参考应保持。此为身份算术与准备放行，不是正式299验收。末次核current仍197/f8d93a840d4f0719，index SHA256仍841598da80eeaaa1b65c7f91992b7632f8e8e58487781baae462d2c50dbd29f6；四份草稿均为上表SHA。主可据冻结版本合并，再给真实candidate审核增量发布、旧197及8参考保持与摘要。全部队列完成，本轮永久仅追加review，未修改产品/current或草稿。

## 四批102项正式接入独立审核：299通过

锁定真实candidate `1.27.1.1-5938e3d7ce7b0a14`，以已审197版 `1.27.1.1-f8d93a840d4f0719` 为基线。current与版本目录index字节相同，index SHA256为 `39fd5d04a8aa566e84e48a17c4f13170440f3124349a68c662f75f65b1a4f3e8`，catalog SHA256为 `1a625dd29a400e23d49437082a895e7d4f37bab9bcd97c2e859415871531399c`。四份草稿SHA仍精确等于上表；正式knowledge共299对象，末尾102按表中顺序与草稿完整深比较相同。

新增102项的summary、syntax、defaults、inheritance、limitations、patch_status、documentation、related、phases、mechanism、configuration_entry、contexts、contexts_verified及完整availability逐字段一致；1017身份及顺序保持，新增项均由registration_only转basic_verified。proxy_pass详情及content阶段索引一致，未重审已关闭问题的旧正文。

新增项1041处发布来源（含注册、自动registration_evidence、显式callback、evidence及发行版本来源）逐段核固定Git原文、有效EOF、ID顺序、component/file/范围、version/revision、代码、URL和kind，均一致。其余915详情仅移除release_id后逐对象相同；对应索引仅排除detail_path后逐字段相同，因此旧197基础对象及718仅注册对象均保持。8条reference payload保持。

validatePublication对真实index、全部详情及references通过；独立去除详情发布信封后，以directives、references和coverage按发布序列化规则重算SHA256，前16位精确重现 `5938e3d7ce7b0a14`。analysis/coverage.json与正式coverage及release_id一致：1017注册、299基础、718仅注册、0深度、8参考，inventory_complete为true。核验前后current SHA不变。

结论：四批102项正式接入通过。没有运行根build、修改产品/current或扩大重审旧全盘；本轮永久仅追加review。P08仍为未正式合并的准备审核，不计入299。

## P08文件、目录与媒体17项独立准备审核：通过

草稿HTTP_FILES_MEDIA_BASIC.json SHA256锁定为 `d3430c433e927a5adb1e697eb87e95741d11ff2245331272e2af27644bd4d909`，NOTES为 `d872c706233d8669b656c1e746804a3fc054c26f76d28da533d0430fb75ad9a2`。完整读取17项正文、证据与NOTES，逐义核固定源码和去注释后的官方XML；17唯一完整身份精确覆盖8个owner全部catalog注册，与当前299知识无交集。

| 指令 | 独立逐义结论 |
| --- | --- |
| autoindex | 通过。末尾斜杠、GET/HEAD、开关及目录访问分支成立，跳过点开头条目；不是强制覆盖其他内容处理器。 |
| autoindex_format | 通过。四格式枚举及html默认成立；JSONP缺失或空callback退JSON，非空callback有长度和字符检查。 |
| autoindex_localtime | 通过。默认off，仅HTML时间计算应用本地偏移，JSON/XML有独立时间表示。 |
| autoindex_exact_size | 通过。默认on，仅HTML文件大小在精确字节与K/M/G取整间切换，目录标记和其他格式不套用。 |
| dav_methods | 通过。方法掩码与PUT/DELETE/MKCOL/COPY/MOVE分派吻合；off单独无方法位，不误说混合参数时清除其他位；不是全站访问控制。 |
| create_full_put_path | 通过。默认off，PUT的ext.create_path真实传入文件移动逻辑；ENOpath分支才补目录，MKCOL仍为单次建目录。 |
| min_delete_depth | 通过。默认0，DELETE按请求URI斜杠与后续字符检查深度，浅路径返回冲突；不是磁盘绝对路径深度。 |
| dav_access | 通过。user/group/all和r/rw槽位解析、未写user时补0600及默认user:rw有据；PUT/MKCOL实际使用，Unix目录补遍历位，不承诺递归改已有权限。 |
| empty_gif | 通过。location无参数安装handler、core实际分派、内置1×1透明GIF及GET/HEAD限制成立；完整默认/继承保留未知。 |
| flv | 通过。start为字节偏移，无效或超出文件退0，非零前置FLV头；不保证关键帧或转码，handler安装及分派有据。 |
| index | 通过。默认index.html、整体列表继承、按序候选及内部跳转成立；绝对候选是跳转URI，不是任意操作系统文件路径。 |
| random_index | 通过。location开关默认off，目录请求枚举非点号普通文件，随机后内部跳转；无候选DECLINED，不按扩展名筛选。 |
| try_files | 通过。独立模块owner与core页面文档差异准确；precontent普通候选依root/alias测试，末项直接兜底code/named/internal跳转；无merge回调，完整继承保留未知。 |
| mp4 | 通过。location handler安装、GET/HEAD及start/end秒到毫秒解析成立；无有效起点或特定DECLINED分支可走原文件，处理错误走500，不声称转码。 |
| mp4_buffer_size | 通过。默认512K，初始缓冲字段真实传入读取分支，合并语义成立。 |
| mp4_max_buffer_size | 通过。默认10M，仅moov超过当前缓冲需要扩容时检查；额外预留不是总进程或全部缓冲硬上限。 |
| mp4_start_key_frame | 通过。默认off，依据同步样本表向前寻找关键帧并用edit list表达前缀；无表不能凭空生成关键帧，不承诺所有播放器行为。 |

独立机械核验151处来源均在固定Git有效EOF内，17个显式callback命中真实注册函数定义，module-owner匹配；source_ids唯一且可解析，17个同名XML节点活跃，documentation URL与固定坐标相同。独立mkdtemp回放34补丁，142hunk及47最终文件SHA256与冻结审计一致，117段Nginx引用全部原文保持，改变0段；临时目录finally清理。没有执行Nginx、DAV文件操作或媒体处理，也未运行根build。

17项准备通过，无确定缺陷。NOTES旧隔离214/2dec7480cf88adef是197基线下的实施历史，不作为当前正式候选。当前仍299/5938e3d7ce7b0a14，核验index SHA256保持39fd5d04a8aa566e84e48a17c4f13170440f3124349a68c662f75f65b1a4f3e8。按冻结草稿合并后仅预期316基础、701仅注册，正式接入仍须锁主的新candidate审核。本轮永久仅追加review。

## P09压缩、切片与输出缓冲14项独立准备审核：11项通过，3项待修

锁定HTTP_COMPRESSION_BASIC.json SHA256 `f8917553de8d74424a495baf3137bd2503c7ad3b2df5316da427265109a7de03`，NOTES SHA256 `10531772ce87d496a7e01afa35f15ed569c6e1075314d0a491f0a19c1d1768a9`，读取前后保持。14唯一身份精确覆盖5个owner全部catalog注册，与当前299无交集。完整读取正文、NOTES、固定注册/配置回调、运行和合并片段及文档，不重复已审HTTP core项目。

| 指令 | 独立逐义结论 |
| --- | --- |
| gzip | 通过。off默认，状态200/403/404、已有编码、已知长度、MIME、header_only及gzip_ok分开判定；头/体过滤器安装及deflateInit2使用有据。 |
| gzip_buffers | 通过。默认128KiB/页大小块数、单块页大小；按需分配与空闲复用，不是压缩工作内存或总响应大小上限。 |
| gzip_types | 通过。响应MIME、默认text/html、*特殊及本层独立集合成立，不机械追加父集合，也不据文档一句话保证HTML无条件压缩。 |
| gzip_comp_level | 通过。注册绑定1–9 bounds，num槽调用post，默认1及真实deflateInit2传值成立。 |
| gzip_window | 待R23。离散大小转wbits、已知长度下调、库变体估算及默认字节值保留未知正确，但post绑定引用错位。 |
| gzip_hash | 待R23。离散大小转memlevel及使用、默认字节值保留未知正确，但post绑定来源全为空行。 |
| postpone_gzipping | 通过。默认0，累计严格大于阈值或flush/last_buf结束暂存；不是时间延迟或硬容量。 |
| gzip_no_buffer | 通过。默认off，no_buffer且ctx->in为空时将部分输出下传；不是取消工作内存或强制压缩库同步flush。 |
| gzip_min_length | 通过。默认20，只比较已知Content-Length，不先收完整响应测量。 |
| gunzip | 通过。仅单一gzip编码且未通过gzip_ok时转换，清编码、长度、范围并弱化ETag；不解压客户端请求体。 |
| gunzip_buffers | 通过。页大小及128KiB预算默认、分配/复用/数量等待成立，解压库另行分配，不限制解压总大小。 |
| gzip_static | 通过。off/on/always枚举，content hook，追加.gz查文件；always仅跳过gzip接受资格，仍需实际文件，不生成.gz。 |
| slice | 待R24。size0、getter建立上下文、clone接续、范围检查、Range/缓存配置及issues引用正确；ETag限制表述缺少条件。 |
| output_buffers | 通过。真实owner为copy_filter，默认2 32k，conf.bufs经ctx传output_chain；as_is/sendfile与按需复用、尾块缩小或单块小幅扩容有据，不是proxy_buffers。 |

### R23：gzip_window/gzip_hash缺少实际post绑定片段

固定Nginx `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928` 的src/http/modules/ngx_http_gzip_filter_module.c第107行是 `ngx_http_gzip_window_p = ngx_http_gzip_window`，108行是 `ngx_http_gzip_hash_p = ngx_http_gzip_hash`。草稿window/implementation-0为108–109，实际只读到hash绑定；hash/implementation-0为109–110，实际两行均空。已有注册只引用post变量，size槽调用post，函数本体虽有证据，但两者之间的绑定未被正确发布。

最小修复：两项implementation-0分别覆盖107和108真实绑定（可各单行，或共享107–108），保持现有正文和source_ids，重核新片段补丁保持及SHA。不是要求猜测库默认字节值，也不需要重做其他12项研究。

### R24：slice将有条件的ETag核对写成无条件要求

slice第二条limitation称“后续分片要求……一致ETag”。固定slice_filter_module.c:128–144实际只有 `ctx->etag.len` 非0时，才要求本次存在ETag且长度/字节一致；若尚未记录非空ETag，无ETag响应可继续，有ETag才记录。所有分片均不提供ETag并不会单凭该点失败，现文容易误导为ETag必需。206和Content-Range要求保持有效。

最小修复：明确“已记录非空ETag时，后续分片必须提供相同ETag；未记录时不强制ETag存在”，保持已有implementation-0来源即可。issues确在XML31–60内，本轮已读，不另报缺少背景更新证据。

机械核验123处引用有效EOF、14显式callback与owner匹配、source_ids唯一可解析，10个同名XML节点活跃，另外四项正确引用模块源码，URL与固定坐标吻合。独立临时回放34补丁、142hunk和47最终SHA256通过，98段Nginx引用保持、改变0；注意保持空行不能证明正确绑定，故不能据机械通过关闭R23。首次EOF脚本trimEnd误去文件末尾合法空行，改按真实换行计数确认copy_filter第397行有效，未作为产品缺陷。临时目录finally清理，未运行根build。

结论：11项准备通过，gzip_window/gzip_hash/slice三项待上述差异修复，P09整批暂不放行。隔离313/ed03fa692ee84de4仅为实施候选，不是正式接入。current仍299/5938e3d7ce7b0a14，index SHA256仍39fd5d04a8aa566e84e48a17c4f13170440f3124349a68c662f75f65b1a4f3e8。本轮永久仅追加review，没有修改草稿、NOTES或产品/current。

## P09 R23/R24差异复核：关闭，14项全部准备通过

锁定修正草稿SHA256 `a6dae19d87b1e1d81a7b44f2d30a0d54d771d708a1a2992715a7d4adbcc84256`，读取前后一致。仅在内存将window/hash两个implementation-0范围和slice第二条限制恢复为前版，序列化后精确重现旧整文件SHA256 `f8917553de8d74424a495baf3137bd2503c7ad3b2df5316da427265109a7de03`，独立证明仅这三处变化，其他字段及已通过11项保持；未重审旧11项。

R23关闭：window引用固定gzip_filter_module.c:107单行，hash引用108单行，分别真实绑定对应post函数，原source_ids保持可用。R24关闭：slice第二条现明确已记录非空ETag才要求后续提供相同值，未记录不强制存在，与固定slice_filter_module.c:128–144的条件及赋值吻合；206/范围条件未改。

独立临时回放34补丁、142hunk和47最终SHA256通过，仅复核本次两条绑定及slice原implementation-0完整102–214片段，三段均逐字保持。两条绑定slice SHA256分别为 `a90a6255f7404355bfb9a667a78020b3f67ad7c7276ce8a59133e4c73f4ab33b`、`f219e45e8a81a07f17429f1b6a34755c6d11a122bec0621cf2c3d5046fc19452`；slice完整来源为 `902840abb59eb7fa2eedae2da7ce97d6d12c42db2a2d76195332cc7eefcfba2b`。临时目录finally清理。123来源/98保持的全批结果沿用此前审核和本次实施记录，不声称本轮重新逐段检查全部来源。

NOTES追加内容已读，SHA256为 `3a61fa2416a0b350d9e7c005ba9545ae03eab5380d3bece063195c223afe9067`，正确标明313候选属于修正前历史。P09全部14项准备通过；结合已通过P08的17项，可按各自冻结SHA合并31项，预期330基础、687仅注册、1017注册、0深度、8参考保持，尚非正式330验收。current仍299/5938e3d7ce7b0a14，index SHA256保持39fd5d04a8aa566e84e48a17c4f13170440f3124349a68c662f75f65b1a4f3e8。等待主给实际candidate再审接入；本轮永久仅追加review，未修改产品、草稿或current。

## P08/P09共31项正式接入独立审核：330通过

锁定真实candidate `1.27.1.1-c66c7c93f58b312c`，基线为已审299版 `1.27.1.1-5938e3d7ce7b0a14`。current与版本目录index字节相同，SHA256 `8ad9b97dfaea70dab45316203459ec3029c05f843492e4a714f23f648d7c8bda`；catalog仍为 `1a625dd29a400e23d49437082a895e7d4f37bab9bcd97c2e859415871531399c`。

P08草稿仍d3430c433e927a5adb1e697eb87e95741d11ff2245331272e2af27644bd4d909，P09修正后仍a6dae19d87b1e1d81a7b44f2d30a0d54d771d708a1a2992715a7d4adbcc84256；knowledge共330，末31对象按P08→P09顺序与两份已审草稿完整深比较一致。新增详情的正文、默认、继承、限制、补丁状态、文档、相关项、mechanism、phases、配置入口、完整availability和contexts均与草稿/注册对应；31项由仅注册升级基础，阶段索引相符。

305处发布来源含注册、显式callback、草稿evidence及distribution-version，逐段独立核固定Git原文、有效EOF、ID顺序、component/file/范围、revision/version、代码、URL及kind，全部相同，包含修正后的两条post单行绑定和slice条件正文。其余986详情仅排除release_id后逐对象保持，对应索引仅排除detail_path后保持；1017身份及顺序不变，8条参考payload保持。

真实发布validatePublication通过；移除详情发布信封，以directives/references/coverage独立重算发布摘要，精确重现c66c7c93f58b312c。analysis/coverage.json与正式发布相同：范围完整true、1017注册、330基础、687仅注册、0深度、8参考。current前后SHA保持。结论为31项正式接入通过，不是全站完成；未重跑根build或重审旧正文，永久仅追加review。随后审核P10首组14项准备稿。

## P10第一组响应过滤与浏览器分类14项独立准备审核：通过

完整读取HTTP_RESPONSE_FILTER_BASIC.json及NOTES，草稿SHA256 `282c4d49a6f2ff74b8021ab00ed18db1acd859621880e73143497c0e661237d2`，NOTES SHA256 `0e7036fb7b3c43e48714e23ad7d8b71d910923e38c1633f2e84cfaa80d9c4ebd`，前后相同。14唯一完整身份精确覆盖addition3、headers3、sub4、browser4四个owner全部catalog注册，与正式330无交集；此为P10第一组，不涵盖另21项。

| 指令 | 独立逐义结论 |
| --- | --- |
| add_before_body | 通过。200主请求、类型筛选及body header_only跳过成立；URI字面字符串子请求在正文前创建，默认空串，独立继承及空串取消正确。 |
| add_after_body | 通过。相同资格边界，last_buf转换后创建后置子请求；不是任意磁盘文件读取，对应URI独立继承。 |
| addition_types | 通过。默认text/html、*特殊、显式集合不追加父层类型；前后URI皆空时不建立添加上下文。 |
| add_header | 通过。十种安全状态及always只放开状态条件、主请求检查吻合；整体列表继承，变量求值和四类特殊头处理有据，空值不是一概删除。 |
| add_trailer | 通过。独立列表继承、expect_trailers/last_buf/header_only与空值检查成立；仅承诺加入尾部字段列表，不扩大为所有协议必能发送或显示。 |
| expires | 通过。off默认、模式/时间/动态表达式整体继承；安全状态、modified缺时间回退、@与modified互斥、无效动态解析跳过成立；no-cache不是禁止存储，也不是开启服务端缓存。 |
| sub_filter | 通过。忽略大小写字符串匹配、双侧复杂值、空静态查找拒绝、动态空查找跳过、255规则上限及首次命中缓存替换值均有据；整体规则继承，不按正则解释。 |
| sub_filter_types | 通过。默认text/html、*和类型集合独立继承；无规则或已知正文长度0不启动。 |
| sub_filter_once | 通过。默认on，每模式在当前响应各一次；ctx->sub与applied记录跨缓冲生效，off继续原输入查找而非递归处理已输出替换内容。 |
| sub_filter_last_modified | 通过。默认off，主响应清原长度；off清Last-Modified/ETag，on保留时间并弱化ETag，不重新计算时间或摘要。 |
| modern_browser | 通过。五种内置标记及版本数值比较、无UA按unlisted、命中现代列表立即返回类别；列表/unlisted有条件整体继承，不视为真实浏览器能力探测。 |
| ancient_browser | 通过。普通子串区分大小写，netscape4为Mozilla/开头版本首位1–4的专门分支，源码另有长度门槛；现代列表命中先返回，不等于访问阻断。 |
| modern_browser_value | 通过。配置字面保存，命中返回配置值、另一类别为空；父值继承及默认1有固定variables.c证据，不展开其中变量。 |
| ancient_browser_value | 通过。同样按字面配置及对应类别返回，未改分类规则；默认/继承与空类别返回有据。 |

逐项读取真实注册、显式callback、运行/合并与owner片段及14个去注释后的活跃XML节点。headers三项注册含if in location，其他按各自http/server/location；browser四项由变量getter消费，phase保持null，不强标请求阶段。add_trailer文档列出的可发送状态少于源码安全状态，草稿以源码资格与header_only等边界表达，没有据此承诺无正文状态实际发送尾部字段。

独立机械核验121处来源有效EOF、callback实际定义/owner匹配、source_ids唯一且可解析、文档URL与固定坐标吻合。独立mkdtemp回放34补丁、142hunk及47最终SHA256一致，93段Nginx来源全部原文保持、改变0；unaffected只限所列事实和引用，未扩大到整个输出链。临时目录finally清理，未编译或运行来源程序，未运行根build。

14项准备通过，无确定缺陷打回。NOTES的299+14=313/8b6871277ec3a71b仅为历史隔离候选，不当正式发布；当前仍330/c66c7c93f58b312c，index SHA256保持8ad9b97dfaea70dab45316203459ec3029c05f843492e4a714f23f648d7c8bda。若单独按本草稿合并，预期344基础、673仅注册，仍须主给实际candidate审核接入。仅本组放行，不涵盖P10剩21项；本轮永久仅追加review，未修改草稿、NOTES或产品/current。

## P10第二组charset/SSI/userid共21项独立准备审核：通过

完整读取HTTP_CHARSET_SSI_USERID_BASIC.json及NOTES，草稿SHA256 `65f66d883f4a5ccfbd4dec5bc6ef1def3be8023d89799cbd41a7a59cdab4473f`，NOTES SHA256 `09a5991d0ab463d871cf373613c62476c55b8a4070f80cd0ea9fb135833e4c39`，前后保持。21唯一完整身份精确覆盖charset5、SSI7、userid9三个owner全部catalog注册，与正式330无交集；逐项核固定源码与文档，不将内部SSI命令或变量另计注册项。

| 指令 | 独立逐义结论 |
| --- | --- |
| charset | 通过。默认off、单变量目标、源未指定只设声明、不同字符集的Content-Encoding与映射门槛成立；子请求主目标及301/302不设charset的边界明确。 |
| source_charset | 通过。默认内部OFF而非自动探测，已有响应charset优先；字面off按名称登记，静态缺表配置后检查，动态缺表请求时处理。 |
| override_charset | 通过。默认off，仅常规主请求已有charset路径控制；上游override字段优先、子请求使用主目标，不作为所有路径总开关。 |
| charset_types | 通过。六类型默认准确；显式集合仅自动含首个text/html，不保留其余五个默认；MIME只在指定常规路径检查。 |
| charset_map | 通过。仅http全局双向表，拒绝同字符集及重复/反向重复，单字节与UTF-8第二列和0xffff上限成立；不选响应、不泛化iconv。 |
| ssi | 通过。默认off、MIME与已知空正文跳过、内部命令分派及主响应清长度/范围成立，不是配置include。 |
| ssi_silent_errors | 通过。默认off，仅跳过错误文字输出；此前日志及独立NGX_ERROR路径没有被转换成成功。 |
| ssi_ignore_recycled_buffers | 通过。默认off，on跳过尾随缓冲recycled复制，last_buf/shadow仍保留；无同名XML，引用实现而非冒充文档。 |
| ssi_min_file_chunk | 通过。默认1024，原文件缓冲片段严格大于阈值才保留in_file/偏移，非保证sendfile。 |
| ssi_value_length | 通过。源码merge255与固定XML256差异明示，分配value_len+1；按存入字节计，达到上限后追加进入错误状态，不是展开后或Unicode长度。 |
| ssi_types | 通过。默认text/html与显式集合/父集合语义成立，*不绕过开关或空正文。 |
| ssi_last_modified | 通过。默认off，主响应off清时间/ETag、on弱化ETag，长度/范围仍清；不计算包含内容的最新时间。 |
| userid | 通过。off/log/v1/on、主响应发送与变量读取门槛成立，已有ID保持、mark重发和reset重建区分；不是账号认证。 |
| userid_service | 通过。v1默认0、v2本地IPv4或IPv6末四字节、Unix为0；仅影响新ID，显式v2编号经htonl。 |
| userid_name | 通过。默认uid，字面名称用于读取Cookie、输出和uid变量前缀，不展开变量。 |
| userid_domain | 通过。默认none，真实post绑定及none/属性拼接有据，仅发送Cookie时输出。 |
| userid_path | 通过。默认/，真实post拼接路径属性，不当磁盘目录或location规则。 |
| userid_expires | 通过。默认off只省略Expires，max日期和当前时间加时长成立；保留已有ID时不因配置变化自动刷新。 |
| userid_flags | 通过。TAKE123及真实bitmask OR/重复警告成立，off独立位不清其他位，SameSite共享位阻止后续冲突；none不自动增加secure。 |
| userid_p3p | 通过。默认none，post转换为空，只有实际新发/重发Cookie且非空才加P3P，字面保存。 |
| userid_mark | 通过。ASCII字母/数字/=或off，检查第23字符及后继等号；标记不一致保留ID重发，uid_reset重建路径独立。 |

独立机械核验201处来源在固定Git有效EOF内，21个callback定义和owner匹配，source_ids唯一且可解析，20个同名XML节点去注释后活跃；所有documentation URL落于对应固定证据。另读userid常量定义及通用bitmask回调，确认off/SameSite实际位值与语义。独立mkdtemp回放34补丁、142hunk和47最终SHA256一致，160段Nginx来源全部原文保持、改变0，临时副本finally清理。未运行Nginx、真实Cookie/SSI/转码或根build。

21项准备通过，无确定缺陷。结合第一组14项，P10全部35项准备通过，可按两份冻结草稿合并；若一同合入，预期365基础、652仅注册，正式验收仍待实际candidate。NOTES隔离351/d4dc5d72014f787a仅为330+21实施候选，不当正式接入。current仍330/c66c7c93f58b312c，index SHA256保持8ad9b97dfaea70dab45316203459ec3029c05f843492e4a714f23f648d7c8bda。永久仅追加review；FastCGI49随后按单独冻结输入审核，不计正式覆盖。

## P02 FastCGI完整49项独立准备审核：48通过，1待R25

锁定HTTP_FASTCGI_BASIC.json SHA256 `8c0139266ee397454a00d60d05d50a565de71e31360cdd5770a31404920d5b53`，NOTES SHA256 `38cc8f64fe0b8998d416ce986c2b076e75dec4f6bb3ea510f3607667b2266a00`，读前后保持。49唯一完整身份精确覆盖ngx_http_fastcgi_module全部catalog注册，与正式330无交集；15项具有NGX_HTTP_CACHE编译条件。逐项读取固定Nginx注册、显式配置回调、模块归属、合并与运行片段及49个活跃XML节点，另读共享upstream/cache/event pipe/file/script和相关补丁；没有用HTTP proxy行为替代FastCGI实现。

| 指令（均为fastcgi_前缀） | 独立逐义结论 |
| --- | --- |
| pass | 通过。配置handler→core content调用成立；静态/动态目标、组和resolver区分正确，不做proxy式URI替换。 |
| index | 通过。只给斜杠结尾的脚本名变量追加字面名称，不查文件或跳转。 |
| split_path_info | 通过。PCRE恰好两捕获、未匹配回退成立；源码http/server/location与XML仅location差异明示。 |
| store | 通过。200、结束/EOF及长度条件、路径求值与cache冲突有据，不称缓存。 |
| store_access | 通过。user/group/all权限及省略user默认rw成立，不改变所有者。 |
| buffering | 通过。事件管道与非缓冲路径、change_buffering与X-Accel-Buffering例外成立。 |
| request_buffering | 通过。off与pass_body联合条件、STDIN封装及不可重放边界成立，pipelining影响明示。 |
| ignore_client_abort | 通过。断连检查安装与store/post_action/cache分支区分，不承诺后台持久完成。 |
| bind | 通过。静态/动态/off/transparent及动态非法地址跳过绑定有据。 |
| socket_keepalive | 通过。新连接SO_KEEPALIVE，不等于池或KEEP_CONN。 |
| connect_timeout | 通过。连接等待timer及发行请求级字段正确，不是总时限。 |
| send_timeout | 通过。写等待加减timer、请求级字段与pipelining条件正确。 |
| send_lowat | 待R25。实际写事件使用和校验正文正确，缺注册post变量到校验函数绑定片段。 |
| buffer_size | 通过。首部/记录/缓存元数据共用缓冲、满缓冲错误及非缓冲复用成立。 |
| pass_request_headers | 通过。HTTP_转换、同名抑制、Cookie分号和其他逗号合并、PARAMS总65535边界成立。 |
| pass_request_body | 通过。缓冲/流式STDIN及空终止记录成立，off不自动删除CONTENT_LENGTH参数。 |
| intercept_errors | 通过。先重试后拦截、error_page匹配和no_error_pages发行影响有据。 |
| read_timeout | 通过。首部#if 0计时器不冒充活跃重置，正文及pipe请求级字段成立。 |
| buffers | 通过。至少两块、事件管道按需分配，不是worker全局限额。 |
| busy_buffers_size | 通过。忙缓冲容量、flush及合并上下界成立。 |
| force_ranges | 通过。allow_ranges、命中与非命中的single_range不同，不保证产生206。 |
| limit_rate | 通过。缓冲路径读取预算/延迟timer、每请求字节速率及复杂值回退成立。 |
| cache | 通过。固定/动态区名、off、未知区及store冲突有据，不把开启等同每次缓存。 |
| cache_key | 通过。表达式→MD5键，不自带URL算法；缺key仅警告，不保证业务唯一。 |
| cache_path | 通过。http层、keys_zone最小大小、开源参数、inactive与异步manager区分成立。 |
| cache_bypass | 通过。任一非空且非单字符0命中，只绕过读取。 |
| no_cache | 通过。同类谓词作用于保存，不保证绕过已有缓存。 |
| cache_valid | 通过。仅时间默认200/301/302、any/100–599及valid_sec优先成立。 |
| cache_min_uses | 通过。共享节点uses、已有文件/冷启动独立路径成立，不是限流。 |
| cache_max_range_offset | 通过。>=阈值、0及后缀分支影响缓存资格，不拒绝请求。 |
| cache_use_stale | 通过。更新/HTTP错误/连接错误与响应头stale扩展分别判断，off不删除缓存。 |
| cache_methods | 通过。只GET/HEAD/POST且merge补GET/HEAD，POST不自动进入key。 |
| cache_lock | 通过。按键协调，age/timeout例外明确，不承诺绝对单后端请求。 |
| cache_lock_timeout | 通过。等待结束→SCARCE→不缓存，不限制持锁者响应期限。 |
| cache_lock_age | 通过。lock_time允许新填充者，不终止旧请求。 |
| cache_revalidate | 通过。默认条件PARAMS、显式覆盖、过期状态与304重验证成立。 |
| cache_background_update | 通过。访问触发后台子请求、旧值条件及防递归成立，不是定时刷新。 |
| temp_path | 通过。响应临时文件、三层路径及use_temp_path/store边界成立。 |
| max_temp_file_size | 通过。普通缓冲0禁写、最小非零值及cache/store豁免成立。 |
| temp_file_write_size | 通过。普通非cacheable分支按链限批与最小值成立，不是速率。 |
| next_upstream | 通过。固定选项无502/504，非幂等与流式重放/下游已发边界成立。 |
| next_upstream_tries | 通过。只收紧peer次数，0不是无限重试。 |
| next_upstream_timeout | 通过。重试时检查窗口，不是到点终止当前读写的timer。 |
| param | 通过。字面名/复杂值、if_not_empty不排除0、HTTP_抑制与总编码上限成立。 |
| pass_header | 通过。从隐藏表移除已有字段，不关闭内部处理或创建字段。 |
| hide_header | 通过。固定默认集合不是任意X-Accel-*通配，不等于ignore_headers。 |
| ignore_headers | 通过。九种固定掩码、缓存及内部处理边界正确，不直接删输出。 |
| catch_stderr | 通过。首部阶段当前STDERR片段字符串查找、INVALID_HEADER及重试条件成立。 |
| keep_conn | 通过。BEGIN_REQUEST标志及END_REQUEST/padding复用资格成立，不独立创建连接池。 |

525处显式来源（421 Nginx、49 XML、55 OpenResty）有效EOF，49 callback定义与catalog对应，source_ids唯一可解析。574发布来源数含49个自动发行版本来源，当前未正式发布，不将其写成已接入验收。未知默认/继承为允许的保守状态，不据此补猜。

独立mkdtemp回放34补丁、142hunk、47最终SHA256全部一致；421段Nginx引用414保持、7改变，精确为request_buffering/implementation-5，connect_timeout/implementation-0，send_timeout/implementation-0与1，read_timeout/implementation-0、2、3。FastCGI模块整文件补丁后SHA256 `762fc537a2ddcc86e0e84c6c392d493e60b2c2d5d9c30c57e4fb43def95f7953`；5项affected另含intercept_errors的no_error_pages间接影响，不能因其调用片段保持而标unaffected。临时副本finally清理，未运行服务或根build。

### R25：fastcgi_send_lowat缺少post变量与校验函数的实际绑定来源

固定Nginx src/http/modules/ngx_http_fastcgi_module.c:313–318注册引用 `&ngx_http_fastcgi_lowat_post`；ngx_conf_set_size_slot:1198–1225通过post_handler调用，implementation-1:3909–3934提供校验函数本体。但真正的 `static ngx_conf_post_t ngx_http_fastcgi_lowat_post = { ngx_http_fastcgi_lowat_check };` 位于204–205，现有全部来源均未覆盖。平台分支正文正确，缺的是从配置入口到该校验的发布证据链，与既有post绑定审核标准一致。

最小修复：仅给send_lowat增加204–205绑定证据，并将其ID接到对应limitation和patch_status.source_ids；也可合理扩展既有证据但不夹带无关大段。核新片段发行保持，更新草稿SHA与NOTES。其他48项无需重研或改写。

结论：48项准备通过，send_lowat待R25；完整49整批暂不放行。历史299+49=348/161279b6e780a2c6仅为隔离候选。current仍330/c66c7c93f58b312c，index SHA256保持8ad9b97dfaea70dab45316203459ec3029c05f843492e4a714f23f648d7c8bda。永久仅追加review，未修改草稿、NOTES或产品；随后继续P11候审22项。

## P11可选库四owner22项独立准备审核：20通过，2待R26

锁定HTTP_OPTIONAL_LIBRARY_BASIC.json SHA256 `09d80a67e32f1f93b564efe00ef0af08ea15ca03f09992801f25d91deda17b9d`，NOTES SHA256 `579e6aac56c3233edc5ff9184a6e6ade2201b4ff96a7914995a08ec1e3e4a484`。前后保持；22身份完整覆盖image7/xslt6/perl4/geoip5，与正式330无交集。读取固定源码注册、配置回调、相关merge/初始化/使用及22个活跃XML节点，不运行GD、XSLT、Perl程序或数据库查询，不把来源存在当作部署可用。

| 指令 | 独立逐义结论 |
| --- | --- |
| image_filter | 通过。test首段标记而非解码校验、size条件空JSON、缓冲失败415、resize/crop不放大、旋转组合及原样路径成立。 |
| image_filter_jpeg_quality | 通过。默认75、静态/动态merge与输出求值成立；文档1–100不冒充源码100硬上限，仅JPEG转换使用。 |
| image_filter_webp_quality | 通过。默认80、动态求值及NGX_HAVE_GD_WEBP输出条件成立，不把其他格式转换为WebP。 |
| image_filter_sharpen | 通过。默认0、正值才调用GD、原样路径不应用成立；不猜完整继承规则。 |
| image_filter_transparency | 通过。默认on及调色板透明色提取/恢复成立，与真彩色重采样/裁剪Alpha分开。 |
| image_filter_interlace | 通过。默认off、转换后gdImageInterlace及JPEG文档含义成立，不是网络分片。 |
| image_filter_buffer | 通过。默认1MiB、已知长度拒绝与未知长度累计失败成立，不限制像素/输出内存，test例外明确。 |
| xml_entities | 通过。配置期DTD解析与指针继承、externalSubset替换成立，不泛称所有XML外部访问被隔离。 |
| xslt_stylesheet | 通过。配置期解析、列表整体继承、完整XML后依次转换/序列化、冒号分隔反转义和失败500有据。 |
| xslt_param | 通过。与string_param共用继承列表、字面名称/复杂值与XPath表达式传递成立。 |
| xslt_string_param | 通过。xsltQuoteOneUserParam引用字符串路径成立，不是转义整个XML。 |
| xslt_types | 通过。默认text/xml、显式集合和*、样式表/304门槛及主结果Content-Type分支成立。 |
| xslt_last_modified | 通过。主响应off清时间/ETag、on弱化ETag及按新正文设长度成立，不重算依赖时间。 |
| perl_modules | 待R26。-I、规范路径、编译默认未知、主配置追加均正确，提前初始化顺序限制缺局部来源。 |
| perl_require | 待R26。require_pv消费、错误失败及非每请求加载正确，同一顺序限制缺局部来源。 |
| perl | 通过。专用回调安装content handler→core调用、匿名程序配置求值、已发头后异常结束有据。 |
| perl_set | 通过。$名称、getter绑定、返回值/not_found及非NOCACHEABLE成立，不强标请求阶段。 |
| geoip_country | 通过。配置期MEMORY_CACHE、国家库类型/IPv6编译条件、utf8源码与XML差异及无结果not_found成立。 |
| geoip_org | 通过。ISP/ORG/DOMAIN/ASNUM及IPv6类型、utf8和本地查询成立，不承诺统一组织语义。 |
| geoip_city | 通过。CITY REV0/REV1条件、类型校验、局部记录查询/无值处理成立。 |
| geoip_proxy | 通过。http层CIDR列表、XFF可信链局部地址选择，不改连接sockaddr、不解析主机名。 |
| geoip_proxy_recursive | 通过。默认off、从末端递归、非可信/非法地址停止与已解析部分保留成立。 |

独立机械核208来源有效EOF（164 Nginx、22 XML、22发行处理），callback与owner对应，source_ids唯一可解析，文档URL坐标对应活跃节点。临时独立回放34补丁、142hunk、47最终SHA256一致，164段源码全部保持、0改变；仅证明局部所述事实，未审核外部库内部实现。临时目录finally清理，未运行根build。源码额外读到的分支不自动变成每条详情已发布来源。

### R26：perl_modules/perl_require的提前初始化顺序限制缺少相应调用来源

两条limitation均要求先于可能提前初始化解释器的perl/perl_set配置。判断本身正确：固定src/http/modules/perl/ngx_http_perl_module.c:982–986及1054–1058分别在两个配置回调中检查pmcf->perl并调用ngx_http_perl_init_interpreter。但是这两条草稿只引通用数组槽、解释器初始化/创建485–664、主配置创建/初始化846–874及require消费668–698（后一项），未引上述提前调用位置；短XML节点也不包含此顺序。现有来源能证明列表如何消费，不能在这两条详情内证明为何perl/perl_set会提前触发。

最小修复：仅在perl_modules和perl_require各补982–986、1054–1058两个片段（或等效的精确回调引用），连接到对应顺序limitation与patch_status.source_ids，核新片段保持并更新SHA/NOTES。正确正文无需改写，其余20项无需重研。不是要求外部Perl库审计或运行解释器。

结论：20项准备通过、2项待R26，完整22整批暂不放行；352/e0c696bf183a62b4仅为实施隔离候选。current仍330/c66c7c93f58b312c，index SHA256仍8ad9b97dfaea70dab45316203459ec3029c05f843492e4a714f23f648d7c8bda。本轮永久仅追加review。后续按队列继续SCGI44与P14主24，不计入正式覆盖。

## FastCGI R25增量复核：关闭，完整49准备通过

修正草稿SHA256 `1566a494bde564ffe6800832c0d01ce949b132dbadf85839cb405216f593956b`。仅在内存删除send_lowat新增lowat-post-binding及其limitation/patch_status两处ID连接，精确重现旧SHA256 `8c0139266ee397454a00d60d05d50a565de71e31360cdd5770a31404920d5b53`，证明其他48项与全部原字段未变，不重复旧审。

新引用固定FastCGI模块204–205确为ngx_http_fastcgi_lowat_post到ngx_http_fastcgi_lowat_check绑定，与既有注册及通用size槽调用闭合；ID唯一且接入对应限制与补丁证据。独立临时34补丁/142hunk/47hash回放通过，仅比较新增绑定，完整两行保持，片段SHA256 `85229d6a0c4d3d6e9de0bc67706f22ff61b0256098a3e094e3ef0f0abc6f261a`；临时目录finally清理。

NOTES末尾增量已读，正确将旧隔离348标为历史，不冒称新增片段已发布。R25关闭，FastCGI49整批准备通过；显式526/预计发布575，Nginx422段由既有414保持7变化加本次1保持组成。可按新SHA合并，正式接入仍待主actualcandidate；不放行尚待R26的P11。current未改，永久仅追加review。

## P03 SCGI完整44项独立准备审核：42通过，2待R27/R28

冻结草稿SHA256 `ad46e38c2ac0315684cea3260e95f460ffe7b15894a0c581014fcc21df98ba9a`，NOTES SHA256 `7dd6dd5857c40be8a8be43b093897fc52427b702e5682e801c84e758b857c6f7`，读取前后相同。44身份精确覆盖SCGI owner，与正式330无交集，15项CACHE编译条件保持。逐项读取SCGI完整注册、handler/create_request/状态与响应头解析、配置回调、params编译与merge；共享upstream/cache/event pipe/通用配置回调复用本轮FastCGI刚核定的同一固定源码，不以FastCGI自身协议实现替换SCGI。固定XML逐项与已读FastCGI节点做协议名归一化比较，相同节点复用已读事实，不同节点全部读回。

| 指令（均为scgi_前缀） | 独立逐义结论 |
| --- | --- |
| pass | 通过。专用handler安装与content调用、动态地址/resolver、netstring头加原始正文成立，不做URI替换。 |
| store | 通过。路径表达式、200/结束/长度、临时文件持久化及cache互斥成立。 |
| store_access | 通过。0600默认、权限语法及文件/路径使用成立，不是网络授权。 |
| buffering | 通过。事件管道/非缓冲响应过滤及X-Accel-Buffering例外有SCGI自身绑定。 |
| request_buffering | 通过。off/pass_body/非chunked三条件、原始正文链及不可重放成立，pipelining影响明示。 |
| ignore_client_abort | 通过。store/post_action/cache例外及上游自身错误边界正确。 |
| bind | 通过。动态地址/端口、off和transparent外部条件明确。 |
| socket_keepalive | 通过。新socket SO_KEEPALIVE，不是SCGI协议keep-connection或池配置。 |
| connect_timeout | 通过。60s、连接等待、非75秒回调硬上限、发行请求级字段正确。 |
| send_timeout | 通过。60s及事件等待/请求级字段，不是全请求总预算。 |
| buffer_size | 通过。页大小、首部满缓冲错误、HTTP状态行失败后CGI头解析成立。 |
| pass_request_headers | 通过。HTTP_编码、重复头分隔及同名抑制，不删除CONTENT_LENGTH或显式参数。 |
| pass_request_body | 通过。CONTENT_LENGTH先按已有bufs累计，开关后控制正文链；off不冒称必归零。 |
| intercept_errors | 通过。状态行/Status/Location302/默认200链和先重试后拦截成立，no_error_pages影响保留。 |
| read_timeout | 通过。60s及各路径timer，#if 0不当活跃重置，发行请求级字段正确。 |
| buffers | 通过。8页默认、至少两块、非共享总额度成立。 |
| busy_buffers_size | 通过。两倍较大buffer派生、上下界及等于上界可通过成立。 |
| force_ranges | 通过。allow_ranges与非缓存single_range，不保证最终范围响应。 |
| limit_rate | 通过。复杂值、缓冲读取每请求字节速率，非下行或组级共享限额。 |
| cache | 通过。SCGI自己的caches/create_key与tag、动态空/off/未知区、store互斥成立。 |
| cache_key | 通过。表达式→键片段→MD5，缺key只警告，非自动URL模板。 |
| cache_path | 通过。http层必需keys_zone/SCGI tag、文件层级与manager/loader/use_temp_path成立，无商业purger语法。 |
| cache_bypass | 通过。非空非单字符0绕过读，不禁止后续写。 |
| no_cache | 通过。谓词禁止保存，不自动取消已有命中。 |
| cache_valid | 待R27。200/301/302、valid_sec与响应头条件正确；any不是全表未命中特定状态后再用的后备。 |
| cache_min_uses | 通过。共享uses及冷缓存/已有文件分支成立。 |
| cache_max_range_offset | 通过。>=含等号、后缀/0与既有命中边界正确。 |
| cache_use_stale | 通过。off覆盖位、error附NOLIVE、updating与响应头扩展分别成立，无502/504。 |
| cache_methods | 通过。GET/HEAD/POST表、无条件补GET/HEAD及其他缓存资格成立。 |
| cache_lock | 通过。按键填充协调、age/timeout例外，不是服务并发上限。 |
| cache_lock_timeout | 通过。5s、SCARCE禁本次填充，不取消持锁者。 |
| cache_lock_age | 通过。5s与lock_time放行新填充，不终止旧连接。 |
| cache_revalidate | 通过。SCGI params_cache默认条件头仅补缺失、显式覆盖及304路径成立。 |
| cache_background_update | 通过。旧缓存条件/防递归及访问触发，不是定时任务。 |
| temp_path | 通过。响应临时目录、层级、use_temp_path及跨文件系统复制有据。 |
| max_temp_file_size | 通过。默认1GiB、0禁普通临时缓冲、cache/store豁免成立。 |
| temp_file_write_size | 通过。派生两倍/最小值与非cacheable限批成立。 |
| next_upstream | 通过。真实mask、non_idempotent与流式/下游已发边界、off覆盖成立。 |
| next_upstream_tries | 通过。0取消额外上限，非无限。 |
| next_upstream_timeout | 通过。peer.start_time重试窗口，不是独立到点中止timer。 |
| param | 待R28。参数编码/整体继承/HTTP_抑制/if_not_empty/示例SCGI=1语义均正确，示例范围越过真实EOF一行。 |
| pass_header | 通过。从隐藏hash移除，不创建字段或关闭内部处理。 |
| hide_header | 通过。固定Status及五个X-Accel默认项，不是通配；与ignore区分。 |
| ignore_headers | 通过。九种固定mask及各内部处理成立，非任意头/输出删除。 |

机械核486显式来源（392 Nginx、44 XML、50发行处理），source_ids唯一可解析，44显式callback与owner对应；仅R28一处真实EOF越界。530为实施发布来源计数（加44发行版本），不是当前正式发布。可选默认/继承未知保守保留。独立回放34patch/142hunk/47最终hash一致，所列392片段385保持、7变化：request_buffering/implementation-3、connect_timeout/implementation-0、send_timeout/implementation-0与1、read_timeout/implementation-0、2、3。SCGI模块整文件SHA256 `ea07bb88ff78310b1d77f6c85245a6180a47f60bbcbb5458d7ffe2e2ec3f5983`保持。5affected含intercept_errors间接影响，判断正确；临时目录finally清理。

### R27：scgi_cache_valid的any优先级表述错误

草稿限制称“any是未命中特定状态时的后备”。固定src/http/ngx_http_file_cache.c:2353–2375（已有implementation-0）按数组顺序逐项检查，遇status==0即返回该有效期，否则匹配具体状态即返回，不先全表搜索具体状态。配置回调按出现顺序push记录，没有将any统一移到尾部。因此先声明any再声明200时，前者可遮住后者，现文会误导优先级。

最小修复：改为“按配置记录顺序取首个匹配项；any匹配任意状态，放在前面可遮住后面的具体状态”，保留其他正确条件与已有来源。不需重研其余43项。

### R28：scgi_param示例来源超出真实EOF

implementation-5指向固定conf/scgi_params:1–18，但git show原文按实际换行/行号仅17行（第17行SERVER_NAME并以LF结束）。split('\n')产生的末尾空元素不是第18个真实源码行，静态切片/构建容忍它不等于锚点有效。本条正文正确，SCGI=1确在第9行。

最小修复：end_line从18改17，保持其他字段，核缩短片段补丁保持，NOTES说明历史差异。无需改build、产品或其他草稿。

结论42项通过、cache_valid与param待修，完整44暂不放行。374/94d4c71417ca0852为实施隔离候选；正式仍330/c66c7c93f58b312c，index SHA256保持8ad9b97dfaea70dab45316203459ec3029c05f843492e4a714f23f648d7c8bda。永久仅追加review，未运行根build或修改current。

## P11 R26差异复核：关闭，完整22准备通过

新SHA256 `cc1fe1fefa7132e9239db420303251def608d1dcfed576e25e06e34f4f6fb949`已核。仅在内存从perl_modules/perl_require各删除perl-early-init、perl-set-early-init两来源和对应第二条limitation/patch_status连接，精确重现旧SHA256 `09d80a67e32f1f93b564efe00ef0af08ea15ca03f09992801f25d91deda17b9d`；证明正文、其余20项及所有原字段保持，不重复旧审。

982–986、1054–1058在固定Perl两个配置回调中确实提前初始化解释器，和既有初始化/列表消费片段闭合。独立临时34patch/142hunk/47最终hash回放通过，新增4个引用（两个独特范围）均保持；两范围原文相同，slice SHA256均为 `792a7aa833a6ef0050a0281abfb26c62e3b67a24fdbfa41d6c8625a1bc6783b2`。NOTES增量已读，正确标旧352候选不含新证据。临时副本finally清理。

R26关闭，P11完整22按新SHA准备放行；212显式来源、168 Nginx保持由旧164加新4组成。当前可整批合入集合为P10两份共35、FastCGI修正49、P11修正22，合计106；不包括待R27/R28的SCGI与未完成的P14/P15。全部仍为准备结论，正式330未变，永久仅追加review。

## P14 HTTP/2、HTTP/3与TLS预读24项独立准备审核：通过

草稿SHA256 `393a7a8d3e89adb1cf3b4a0bcb5dfb141a0687cff7af6211b9f43296854123f1`，NOTES SHA256 `7d6180c5f1fe14e4c918ed047c4cf1da73a6e683d29fa22c5a2bec2b1ed93f48`，前后保持。24唯一身份完整覆盖v2的15、v3的8及stream ssl_preread的1，与正式330无交集。逐义读取模块注册/回调/合并、v2/v3传输使用、ALPN/request协议检查、预读完整状态解析及22活跃XML节点；两个无同名XML的内部尺寸指令正确只引源码。

| 指令 | 独立逐义结论 |
| --- | --- |
| http2 | 通过。默认off、明文前言/TLS ALPN入口及旧listen http2标志OR成立，不承诺只用HTTP/2。 |
| http2_recv_buffer_size | 通过。主配置256k共享输入、post要求>16及扣除状态缓冲的读取空间成立。 |
| http2_pool_size | 通过。4096初始块、最小值/对齐post及可追加pool块成立，非总内存硬上限。 |
| http2_max_concurrent_streams | 通过。默认128、SETTINGS及processing/new_streams门槛成立。 |
| http2_body_preread_size | 通过。64k、MAX_WINDOW post、按需分配与初始流窗口成立，非正文总大小。 |
| http2_streams_index_size | 通过。默认32→mask31、非零2次幂post与碰撞链表查询成立，非并发额度。 |
| http2_chunk_size | 通过。8k、拒0/截最大帧及对端帧/窗口共同约束成立。 |
| http2_max_concurrent_pushes | 通过。obsolete仅告警返回OK，无旧推送效果或运行默认。 |
| http2_max_requests | 通过。obsolete警告指向keepalive_requests，不自动转写。 |
| http2_max_field_size | 通过。obsolete警告指向large_client_header_buffers，不执行旧限制。 |
| http2_max_header_size | 通过。同上，不把XML历史16k当有效默认。 |
| http2_recv_timeout | 通过。obsolete指向client_header_timeout，不创建旧timer。 |
| http2_idle_timeout | 通过。obsolete指向keepalive_timeout，不自动继承或转写旧参数。 |
| http2_push_preload | 通过。保留名称仅告警，不创建Link preload推送。 |
| http2_push | 通过。保留名称仅告警，不创建旧push请求。 |
| http3 | 通过。默认on、QUIC监听ALPN选择与选server后的421检查成立，不创建监听。 |
| http3_hq | 通过。默认off、独立HQ协商/会话判断及server检查成立，非TCP旧HTTP开关。 |
| http3_max_concurrent_streams | 通过。默认128映射双向请求流额度，单向流独立，不是连接数。 |
| http3_stream_buffer_size | 通过。64k、初始各流/连接额度与acked/sent写入预算成立，非响应长度。 |
| quic_retry | 通过。无token/无效token分支及握手后NEW_TOKEN成立，off不免除非空token校验。 |
| quic_gso | 通过。两编译条件、路径验证、握手帧队列及>三倍批量门槛成立，on不保证每次GSO。 |
| quic_host_key | 通过。配置期非空完整读文件、父值继承/无值随机及两派生密钥成立，非TLS私钥。 |
| quic_active_connection_id_limit | 通过。默认2、transport参数及NEW_CONNECTION_ID数量检查成立，非QUIC连接总数。 |
| ssl_preread | 通过。preread挂接、TCP/AGAIN/DECLINED、版本/SNI/ALPN客户端声明及SNI切换server成立；no_skip发行边界正确。 |

193来源（146 Nginx、22 XML、25发行）有效EOF、callback对应、source_ids唯一可解析，文档锚点匹配。五个v2 post绑定均实际覆盖62–71相关行，不仅有函数本体。独立临时34补丁、142hunk、47最终SHA256回放通过；145段Nginx保持，仅ssl_preread/implementation-0变化。实际读回补丁树192–193仍先在rc==NGX_OK时return servername，197才是新增三元返回，确认不能宣传所有成功均继续其他handler。临时目录finally清理，未运行TLS/QUIC、密钥读取或根build。

24项完整准备通过，无确定缺陷。354/f04070de513c9bba仍只是实施隔离候选，正式current保持330/c66c7c93f58b312c及index SHA256 8ad9b97dfaea70dab45316203459ec3029c05f843492e4a714f23f648d7c8bda。永久仅追加review；随后完成SCGI差异闭环与P15 core12，routing/access9按主要求延后至合入窗口之后。

## SCGI R27/R28差异复核：关闭，完整44准备通过

新SHA256 `9af980ecfd82472aa6cbceb645e5b7106b784d31f48916136e12f3d032ca5c70`已核。仅在内存还原cache_valid原限制句与param/implementation-5末行18，精确重现旧SHA256 `ad46e38c2ac0315684cea3260e95f460ffe7b15894a0c581014fcc21df98ba9a`，证明仅两字段变化，其他42项及全部原字段保持。

R27新句明确按配置顺序首匹配、any在前可遮后面的具体状态，符合固定cache_valid循环，其他条件保留。R28范围1–17对应conf/scgi_params真实EOF，SCGI=1仍在第9行。独立临时34patch/142hunk/47hash回放通过，两关联片段完整保持，slice SHA256分别为 `c091b842043716e387f33c5d7e3c560e98aad4ae683f8468ef943daf79edee84`（cache_valid）和 `7244a85c59b18f7c3d90a7bea12b038474750c9416ead1f979030678c8a310f8`（scgi_params）。临时目录finally清理。

NOTES增量已读，历史374隔离候选未冒充新版发布。R27/R28关闭，SCGI44按新SHA整批准备放行，不重审旧42。结合P10 35、FastCGI49、P11 22、P14 24，目前完整通过集合174项；P15 core12仍待本轮完成，不包括延后routing/access9。永久仅追加review，current未改。

## P15 Stream core12项独立准备审核：11通过，resolver待R29

草稿SHA256 `4db942b502f9015cb5f66f6468c60c859a785cae510f601f821f3a779bf53f2b`，NOTES SHA256 `f4ea221a1533cd7d9954a23f184b3ab68238637bafc195a9558108ec138b4de3`，前后保持。12项精确覆盖ngx_stream_module及core owner相对正式330的剩余身份，既有server/listen/error_log不改、不重审。逐项读取真实注册、配置回调、合并、变量/名称hash传值、代理解析请求、PROXY协议等待、content及preread链，并对照12个活跃XML节点。

| 指令 | 独立逐义结论 |
| --- | --- |
| stream | 通过。main无参数块、重复拒绝、创建/解析/合并各模块及阶段/监听初始化成立，不单独提供content处理。 |
| variables_hash_max_size | 通过。1024、整数槽、实际hash.max_size传值及桶数尝试成立，不是变量数硬上限。 |
| variables_hash_bucket_size | 通过。64再缓存行对齐、整数非k/m槽、单键容不下失败成立。 |
| server_names_hash_max_size | 通过。512、真实传hash、正则单列处理成立，非server数上限。 |
| server_names_hash_bucket_size | 通过。默认缓存行及显式对齐、精确/通配表真实使用成立。 |
| server_name | 通过。server追加、空默认、$hostname字面特例/PCRE正则及查找成立，不自动启用TLS或预读。 |
| resolver | 待R29。专用回调/继承/空占位、运行时解析及local/IPv6发行变化正确；无nameserver错误条件表述过窄。 |
| resolver_timeout | 通过。30s、ctx->timeout传值，不混同连接或整个会话时限。 |
| proxy_protocol_timeout | 通过。监听proxy_protocol资格、EAGAIN等候timer与超时关闭成立，解析失败可提前结束。 |
| tcp_nodelay | 通过。默认on，content客户端及代理上游SOCK_STREAM判断，失败结束/next_upstream成立。 |
| preread_buffer_size | 通过。16k、仅无buffer时分配，peek/普通读都在仍需数据且满时失败，不覆盖既有buffer。 |
| preread_timeout | 通过。30s、AGAIN且未设timer才设置、超时结束，不是逐次重置的读取间隔。 |

94来源有效EOF（68 Nginx、12 XML、14发行），callback与owner/身份对应，source_ids唯一可解析，文档锚点匹配；变量文件末行1340和resolver回调1403均真实有效。独立临时34patch/142hunk/47最终SHA256回放通过，67段Nginx保持，仅resolver/implementation-1改变。实际读两个resolver补丁及回放后无nameserver检查，不只按补丁文件名归类；临时目录finally清理。未发DNS请求、读系统resolver文件或运行Nginx/根build。

### R29：resolver把无nameserver错误过窄地限定到local=off

第一条limitation写“只有local=off且没有任何DNS服务器会报错”。固定原始ngx_resolver_create:213–309末尾及实际回放后仍是 `if (n && r->connections.nelts == 0)`，不检查是否local=off。显式resolver有参数但最终无nameserver都失败；例如local=on/path读到空文件，补丁读取函数对空文件返回NGX_OK，随后同样触发此检查。未配置时merge调用NULL,0创建占位对象则不触发，草稿该默认说明正确。

最小修复：仅将该句改为“显式resolver配置最终没有任何DNS服务器会报错；仅配置local=off也属于此情况，local=on/path未读到服务器同样不能通过”。保持前面的off不取消显式服务器、非Windows及其他正确正文与现有来源；不需新研究/产品变动。修后给SHA做单句差异闭环。

结论11项准备通过、resolver待R29，core12整批暂不放行。342/640ab51def853f32仅为实施隔离候选；正式仍330/c66c7c93f58b312c及index SHA256 8ad9b97dfaea70dab45316203459ec3029c05f843492e4a714f23f648d7c8bda。永久仅追加review。按主要求此轮至此交还合入窗口，routing/access9、variable/limit8及未最终冻结uWSGI60均留下一轮，不能混入已审集合。

## 本轮合入窗口：完整放行174项，P15 core12待R29

以下六份按冻结SHA可整批合入，合计174；330+174预期504基础、513仅注册，1017注册/0深度/8参考保持。此表是准备放行，不是正式504接入验收，须实际candidate后另核新增完整字段/来源及旧项保持。

| 草稿（analysis/content/） | 项数 | 放行SHA256 |
| --- | ---: | --- |
| HTTP_RESPONSE_FILTER_BASIC.json | 14 | 282c4d49a6f2ff74b8021ab00ed18db1acd859621880e73143497c0e661237d2 |
| HTTP_CHARSET_SSI_USERID_BASIC.json | 21 | 65f66d883f4a5ccfbd4dec5bc6ef1def3be8023d89799cbd41a7a59cdab4473f |
| HTTP_FASTCGI_BASIC.json | 49 | 1566a494bde564ffe6800832c0d01ce949b132dbadf85839cb405216f593956b |
| HTTP_OPTIONAL_LIBRARY_BASIC.json | 22 | cc1fe1fefa7132e9239db420303251def608d1dcfed576e25e06e34f4f6fb949 |
| HTTP_SCGI_BASIC.json | 44 | 9af980ecfd82472aa6cbceb645e5b7106b784d31f48916136e12f3d032ca5c70 |
| HTTP_PROTOCOL_PREREAD_BASIC.json | 24 | 393a7a8d3e89adb1cf3b4a0bcb5dfb141a0687cff7af6211b9f43296854123f1 |

R25–R28已关闭；唯一本轮待修为R29。不得按原SHA将完整core12提前算作通过，也不以延后队列阻止上述174项发布。审核角色停在此窗口，未修改current。

## 六份174项正式接入独立审核：504通过

锁定actualcandidate `1.27.1.1-c084cd9580c5b527`，基线330/c66c7c93f58b312c。current与版本目录index字节相同，SHA256 `7bedde5af09b5370ce1a954e53657b90ffa2d626dd40f5c02bb8a74719a5e13f`；catalog SHA256仍1a625dd29a400e23d49437082a895e7d4f37bab9bcd97c2e859415871531399c。

六份草稿全部核对上表冻结SHA；knowledge504末174按实际P10首14→P10余21→FastCGI49→SCGI44→P11 22→P14 24的顺序逐对象深比较完全一致。实际SCGI与P11次序不同于放行表展示次序，没有字段变化或重复身份；首次顺序断言据此调整为实际批次顺序，不将无语义影响的表格排序差异报作缺陷。

174新增详情逐项核summary/syntax/defaults/inheritance/limitations/patch_status/documentation/related/mechanism、phases及索引、完整availability、contexts与配置入口，均和已审草稿/真实注册相符，从registration_only升级basic_verified。1913处发布来源含自动distribution-version，逐段独立核ID/顺序、component/file/行范围、真实EOF、固定revision/version、代码、URL和kind，全部匹配固定git show原文；包含R25/R26新增绑定与提前初始化证据、R27/R28修正后的正文及真实EOF。

其余843详情只排除release_id后逐对象不变，对应索引只排除detail_path后不变；1017身份及顺序保持，8refs payload完全保持。validatePublication对真实发布通过，analysis/coverage.json一致。剥离发布信封后以directives/references/coverage独立计算JSON摘要，精确重现c084cd9580c5b527。计数为1017注册/504基础/513仅注册/0深度/8参考、范围true；current前后SHA保持。

174正式接入通过，不是全站完成或待审草稿放行。未重跑根build或旧正文全盘；永久仅追加review。随后先做P15 core R29差异闭环，再按routing9、variable/limit8、uWSGI60候审队列推进，每批结论单独落盘。

## P15 core R29单句差异复核：关闭，完整12准备通过

修正草稿SHA256 `03b621cb879fb2ffcf2176061f2d1ff550d3fe541469af8c650a917af7af9ece`已核。仅在内存将resolver第一条limitation恢复原句，精确重现旧SHA256 `4db942b502f9015cb5f66f6468c60c859a785cae510f601f821f3a779bf53f2b`，证明没有新来源/其他字段变化、其余11项保持。

新句明确显式resolver最终无nameserver均报错，包括local=off及local=on/path未读到服务器，与固定源码 `n && r->connections.nelts == 0` 相符。本轮再次读固定检查；沿用上一轮已实际回放并读回的相同补丁后检查，不声称为纯文字修改另跑了34补丁。NOTES追加已读，未把旧342隔离候选当新版发布。R29关闭，完整12按新SHA准备放行；若单独合入正式504，预期516基础/501仅注册，仍待actualcandidate接入审核。current未变，永久仅追加review。

## R30：正式504的八项HTTP/2 obsolete正文与废弃元数据不一致

主报告桌面/HTTP的http2_max_requests显示“废弃状态：未核实”。独立读取504真实详情及冻结P14草稿确认八项均命中：http2_max_concurrent_pushes、http2_max_requests、http2_max_field_size、http2_max_header_size、http2_recv_timeout、http2_idle_timeout、http2_push_preload、http2_push。各条summary已明确本锁定版本废弃且回调为只告警的ngx_http_v2_obsolete，但草稿未设deprecated，正式availability.deprecated全部null。

只读核查build既有逻辑默认取curated.deprecated或null；site/app.mjs:59及77、src/query/knowledge.mjs:150按availability.deprecated渲染徽标/废弃状态，故该null会稳定产生正文与状态展示不一致，不是浏览器缓存推测。本轮没有自行重做主的浏览器操作，正式JSON与渲染分支已独立确认。该缺陷在此前P14准备审核中遗漏；504“接入通过”仅证明忠实发布已审输入，不能被解释为504最终无缺陷。

最小修复：上述八条草稿及对应knowledge对象各补顶层deprecated:true，沿用已审obsolete注册/回调/XML证据，不改正文、来源、phases或availability其他属性；无需修改产品代码，也不要将总体availability.status或构建启用条件改为已核实。主给新草稿SHA后独立反向还原核八字段差异，并在后续新candidate中确认8条availability.deprecated=true及网站/Markdown状态路径。当前504保持冻结，不改现有版本目录。

按主要求交还短写窗口：主可准备R30元数据；审核暂停扩展队列，routing9、variable/limit8、uWSGI60仍待逐义审核，不影响已经放行的P15 core12。当前无正式发布写操作，永久仅追加review。

## P14 R30元数据差异复核：准备通过，交还516构建窗口

独立核定草稿SHA256 `c902f4f44c43b5206d87df0431a20da506609a2b44d780b6ce9d72b2a4f6c018`。恰好上述八个obsolete条目各有顶层deprecated:true；仅在内存删除八字段并按原格式序列化，精确重现原SHA256 `393a7a8d3e89adb1cf3b4a0bcb5dfb141a0687cff7af6211b9f43296854123f1`。因此其他16项及全部原有字段、正文、来源均保持，无产品变更需要审核。

八条callback_definition均为src/http/v2/ngx_http_v2_module.c:481–498。本轮再次读取固定Nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928的该函数：只输出obsolete替代提示或ignored告警并返回NGX_CONF_OK，与已审注册及正文废弃事实一致，deprecated:true准确。NOTES R30段已读；没有新增来源或补丁主张，不重复补丁回放及其余内容全审。

R30准备差异放行，可与已放行R29 core12一起合入。core草稿SHA256再次确认仍为 `03b621cb879fb2ffcf2176061f2d1ff550d3fe541469af8c650a917af7af9ece`。预期504+12=516基础、501仅注册，1017注册/0深度/8参考；R30仅更新既有八项元数据，不增加条目。当前index SHA256仍为 `7bedde5af09b5370ce1a954e53657b90ffa2d626dd40f5c02bb8a74719a5e13f`，正式仍504，不能宣称其显示缺陷已经修复。收到516 actualcandidate后再核12新增、八项deprecated正式接入与显示状态、其余997详情及8refs保持和发布摘要。

本轮仅追加review，至此结束并交还主构建窗口；不扩展routing9、variable/limit8或uWSGI60队列。R30正式展示闭环留待真实新candidate。

## 516正式增量独立审核：core12及R30八字段接入通过

锁定actualcandidate `1.27.1.1-76405f32ab987818`，以504/c084cd9580c5b527为基线。current与版本index相同，SHA256 `1cd2225abd38696d80afda2ab798166f715a2fd8ae659d08dc282f54483d4406`。core与P14两份草稿仍分别匹配03b621cb…及c902f4f4…完整冻结SHA；knowledge末12与core逐对象相等，P14全部24对象与修正草稿相等。

独立核12项完整正文、默认/继承/限制、patch_status、文档及关联、phase、contexts、availability与配置入口，均为basic_verified且对应固定注册。106处发布来源（含自动版本来源）逐段核顺序、ID、component/file、真实EOF、revision/version、代码、URL及kind，与固定git show原文完全一致。八项obsolete仅availability.deprecated由null变true，其他字段保持；其余997详情排除release_id后完整相等，对应旧索引排除detail_path后保持。1017身份顺序及8refs payload保持。

validatePublication读取真实发布通过；analysis/coverage.json一致。独立剥离发布信封并重新计算directives/references/coverage摘要，精确重现76405f32ab987818。实数1017注册/516基础/501仅注册/0深度/8参考、范围true；current核验后SHA保持。未运行根build，未修改发布内容。

R30显示闭环采用主验收证据：已读取WEBSITE_COMPLETION_VERIFICATION.md当前记录，主在61357真实HTTP逐查八项matched/true且Markdown“已废弃”，core12带context/module均matched/basic；主复用TaskSpace1/p1核http2_max_requests warning徽标及状态段。此浏览器和HTTP操作由主执行，不冒称独立审核重复执行。结合本轮正式八字段核验，R30关闭。516正式增量通过，不等于全站完成；随后继续三份冻结候审草稿，每批独立落盘。

## P15 routing/access完整9项独立准备审核：通过

冻结SHA256 `09f4be96b529d9646b3f0bdbae627cecdfbdf8851d600e3a653fd37a23b8b0d0`及NOTES已核。相对正式516精确覆盖六个owner剩余9身份，无正式交集。接续之前已读的access/return/split_clients固定源码，本轮完成pass、realip、GeoIP完整实现和九个活跃XML对照；非重新盘点旧正式内容。

| 项目 | 逐义结论 |
| --- | --- |
| allow、deny | 首匹配、地址族/IPv4映射分支、Unix全族及整组继承正确；access挂接不等于其他模块必然允许。 |
| return | 复杂值求值、空值结束、原始Stream内容、输出缓冲与5000ms写等待正确，非HTTP状态响应。 |
| pass | 配置/动态目标均no_resolve；UDP及未消费预读拒绝，本实例监听匹配后移交已有连接，不新建上游连接。 |
| split_clients | 输入复杂值、MurmurHash2、百分比解析及顺序分段、字面输出和未命中空值正确。 |
| set_real_ip_from | 已解析PROXY信息加可信来源才改地址/端口；配置期主机名解析、整组继承和post_accept正确。 |
| geoip_country | 本地内存缓存打开及COUNTRY类型、条件IPv6、无库not_found成立；源码utf8与XML语法差异明示。 |
| geoip_org | ISP/ORG/DOMAIN/ASNUM类型及对应IPv6分支正确，不将结果统一解释为机构名称。 |
| geoip_city | CITY REV0/REV1、字段getter/无记录及NULL字段not_found正确；本地数据不保证实时定位。 |

71引用有效EOF、callback对应、source_ids及九个文档锚点通过。独立临时34patch/142hunk/47最终SHA回放通过，53段Nginx引用全部保持，临时目录finally清理。未执行GeoIP库、DNS或Nginx，未运行根build。历史339/68003103b39cdb4e只属旧隔离候选。完整9准备放行；正式仍516，不能将该9计入正式覆盖。永久仅追加review。

## P15 variable/limit完整8项独立准备审核：通过

冻结SHA256 `9a5ef114cadd1e8a18ba1f17d470b22c2a6bb6ec1aa2c8963499e7623175a4b6`，NOTES已读；相对正式516精确覆盖map/limit_conn/geo三个owner剩余8身份。逐义读固定map及limit_conn完整模块、geo配置/地址/getter/字面值/include相关片段，另核共享hash/radix/配置槽及八个活跃XML。

| 指令 | 逐义结论 |
| --- | --- |
| map | 读取时求值、字符串不分大小写、hash优先后顺序regex/default、复杂输出和volatile标记正确，不强标请求phase。 |
| map_hash_max_size | 2048默认、整数槽、hash.max_size实际传值及首次map填值后的声明顺序边界正确，非条目数硬上限。 |
| map_hash_bucket_size | 缓存行默认/对齐、整数非size槽、实际bucket_size传值与单键空间检查正确。 |
| limit_conn_zone | 复杂键、空/超255字节跳过、8页最小zone、同名重复及旧共享键一致检查正确。 |
| limit_conn | preaccess、1–65535、同zone重复拒绝、整组继承、计数清理及Stream状态非HTTP报文正确。 |
| limit_conn_log_level | error默认及四枚举正确，仅达到计数限额日志采用此级别，不涵盖全部失败。 |
| limit_conn_dry_run | off默认；未超限仍计数，超限/共享分配失败清理此前zone并返回DECLINED，其他错误不保证放行。源码边界不照搬XML“超额照常计数”。 |
| geo | 连接/指定变量地址、最具体CIDR、IPv4 ranges及IPv4映射处理、无效地址查INADDR_NONE、字面输出成立；include只描述Nginx行为，未执行用户文件。 |

71来源有效EOF、callback/身份/source_ids与文档锚点通过；独立临时34patch/142hunk/47最终SHA回放通过，55段Nginx引用全部保持，临时目录finally清理。未运行Nginx、生成geo库或根build。历史338/47eb415f6758d41a仅是旧隔离候选。完整8准备放行，与routing9合计17可合入但尚未正式；current仍516及SHA1cd2225a…，永久仅追加review。随后审核uWSGI60。

## P04 uWSGI完整60项独立准备审核：59通过，SNI表述待R31

冻结SHA256 `dbc8d988bed959b843f00447745b9bc4d0f8ad83b1ec7cec517d08d645a8cac0`、NOTES SHA256 `a2c4be2ac9fa4f43d80f2d1735d606d9d9331a0d9d91744c29d87353b52f485a`已核。60身份精确匹配ngx_http_uwsgi_module，正式516无交集。逐项核注册offset/post、专用handler/请求包/响应解析/create/merge/params及TLS配置链；共享upstream/cache/pipe事实复用此前固定版本已审链路，并逐一核本模块真实绑定，补读未被先前三协议证据覆盖的15个共享片段。59个活跃XML已对照，uwsgi_string无同名节点按源码专项处理。

| 指令（均uwsgi_前缀） | 独立逐义结论 |
| --- | --- |
| pass | content挂接、静态/动态uwsgi与suwsgi、SSL资格及动态解析正确。 |
| modifier1、modifier2 | 各对应包头第一/第四字节；真实106–108 post和bounds限定0–255。 |
| store、store_access | 完整200保存、临时移动/跨盘复制及新建权限正确，非缓存/所有权控制。 |
| buffering、request_buffering | 响应/请求区分、change_buffering与X-Accel、非chunked流式前提及不可重放正确。 |
| ignore_client_abort、bind、socket_keepalive | 断连资格、本地/透明绑定与off、系统SO_KEEPALIVE边界正确。 |
| connect_timeout、send_timeout、read_timeout | 三事件等待及额外TLS握手等待正确，非总时限；活跃补丁字段和#if 0边界明示。 |
| buffer_size、buffers、busy_buffers_size | 首头缓冲、8页按需分配、至少2块、busy派生值与允许等于上界正确。 |
| pass_request_headers、pass_request_body | 自动HTTP_编码和重复头拼接、显式参数抑制、正文位于参数块外、CONTENT_LENGTH非自动补齐正确。 |
| intercept_errors、force_ranges、limit_rate | 错误拦截资格、范围标记而非必然206、事件管道上游读取限速正确。 |
| cache、cache_key、cache_path | uWSGI专用tag/caches/create_key真实接入、变量区域、MD5/无自动业务键、开源参数边界正确。 |
| cache_bypass、no_cache、cache_valid | 读/写资格分离、非空非0谓词、首匹配含any优先顺序修正正确。 |
| cache_min_uses、cache_max_range_offset、cache_use_stale、cache_methods | 共享计数、>=偏移拒绝、旧值资格及GET/HEAD强制补入正确。 |
| cache_lock、cache_lock_timeout、cache_lock_age | 新对象协调、等待到期SCARCE不缓存、过旧额外回源而非终止旧连接正确。 |
| cache_revalidate、cache_background_update | params_cache补未覆盖条件参数、304更新及访问触发后台子请求正确。 |
| temp_path、max_temp_file_size、temp_file_write_size | 响应目录、普通临时上限及cache/store例外、非cacheable批量阈值正确。 |
| next_upstream、next_upstream_tries、next_upstream_timeout | 非幂等/流式重放门槛、额外tries上限及决策时窗口正确。 |
| param、string | 小端参数长度、显式键长先转u_char、65535总限、字面string附加、整组参数继承正确；conf/uwsgi_params两引用均真实EOF17。 |
| pass_header、hide_header、ignore_headers | 本模块仅五X-Accel默认hide，Status复制与XML差异明示；隐藏与内部处理掩码分离正确。 |
| ssl_session_reuse、ssl_protocols、ssl_ciphers、ssl_name | 会话非TCP复用、固定默认位图、set_cipher_list非TLS1.3套件API、目标/组host名称正确。 |
| ssl_server_name | 默认off及开关/校验分离正确，但IPv4跳过条件概括过宽，待R31。 |
| ssl_verify、ssl_verify_depth、ssl_trusted_certificate、ssl_crl | 配置及握手实际API、verify资格、深度与CA/CRL用途正确，非OCSP或客户端身份。 |
| ssl_certificate、ssl_certificate_key、ssl_password_file、ssl_conf_command | 静态/变量证书路径、口令配置期读取/保留、真实post及末尾SSL_CONF_cmd应用正确。 |

659显式引用有效EOF（534 Nginx、59 XML、66发行），callback/来源ID及文档锚点通过。独立临时34patch/142hunk/47最终SHA回放通过，526段Nginx保持，8段变化精确对应request_buffering/send_timeout的pipelining与三个timeout字段（含TLS握手）；五affected项另含no_error_pages间接链路。临时目录finally清理。旧390/416738db523621f9按NOTES仅为修正前隔离实证，未冒称本轮重建。未发TLS/后端请求、读取口令/证书文件或运行根build。

### R31：uwsgi_ssl_server_name将IPv4字面量跳过SNI概括为无例外

唯一limitation称“名称为空、IPv4字面量或以[开头的IPv6字面量不发送SNI”。固定U1857–1948（既有implementation-1）实际跳过条件是名称空/首字符[，以及 `ngx_inet_addr(name.data, name.len) != INADDR_NONE`。另读固定src/core/ngx_inet.c:20–60，255.255.255.255解析得到全一值即INADDR_NONE，因此不会由这个IPv4条件跳过；设置ssl_name为该串、目标仍用正常suwsgi后端即可进入后续设置SNI调用，不能把目标不可连接当成排除该反例的理由。本结论是源码条件核验，不宣称握手实测。

最小修复只将“IPv4字面量”收窄为“ngx_inet_addr解析结果不等于INADDR_NONE的IPv4名称”，或直接描述源码跳过条件；保留既有引用即可，无需新增产品行为、测试或全批补丁回放。其余59项准备通过，60整批等待该单句差异闭环；P15余17不受阻，可按已核SHA合入。正式current仍516，永久仅追加review。新增P05 gRPC/Memcached39排在本批之后，未提前放行。

## R31单句差异复核：关闭，交还17+60正式构建窗口

独立核定uWSGI新SHA256 `dfd5a86aa3b90d4082408608b0390369c9458ad2df12323497229e38bb21d592`。仅在内存将uwsgi_ssl_server_name唯一limitation的新条件换回原短句，精确重现旧SHA256 `dbc8d988bed959b843f00447745b9bc4d0f8ad83b1ec7cec517d08d645a8cac0`，证明其他59项、全部来源及其他字段保持。

再次读取固定Nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928的U1857–1948及core/ngx_inet.c:20–60，新句准确描述名称为空、首字符[或ngx_inet_addr结果不等于INADDR_NONE时跳过SNI；不再错误覆盖255.255.255.255。NOTES R31增量已读。纯文字收窄沿用已审证据与上轮回放，不重复TLS实测、补丁或其余59项全审。R31关闭，完整uWSGI60准备放行。

| 可合入草稿（analysis/content/） | 项数 | 本轮确认SHA256 |
| --- | ---: | --- |
| STREAM_ROUTING_ACCESS_BASIC.json | 9 | 09f4be96b529d9646b3f0bdbae627cecdfbdf8851d600e3a653fd37a23b8b0d0 |
| STREAM_VARIABLE_LIMIT_BASIC.json | 8 | 9a5ef114cadd1e8a18ba1f17d470b22c2a6bb6ec1aa2c8963499e7623175a4b6 |
| HTTP_UWSGI_BASIC.json | 60 | dfd5a86aa3b90d4082408608b0390369c9458ad2df12323497229e38bb21d592 |

三份合计77，基于516预期593基础/424仅注册，1017注册/0深度/8参考保持。此为准备放行，实际发布须收到新candidate后另核。当前index SHA256仍 `1cd2225abd38696d80afda2ab798166f715a2fd8ae659d08dc282f54483d4406`，正式仍516。永久仅追加review；本轮结束交还主构建窗口，不扩展gRPC39、StreamProxy28或其他候审内容。

## 593正式77项增量独立审核：通过

锁定actualcandidate `1.27.1.1-e33f9a74f8157679`，基线516/76405f32ab987818及其index SHA1cd2225a…保持。新current与版本目录index一致，SHA256 `0318e3bb456cccd7514b374cef738aff0fb948afefd91ca4943e6c831951339e`。三份草稿仍匹配上一放行表完整SHA；knowledge末77按routing9→variable8→uWSGI60逐对象完全相等，包括R31收窄后的SNI句。

独立核77项完整summary/syntax/defaults/inheritance/limitations/patch_status/documentation/related/mechanism、phases、contexts、availability、verification_notes及配置入口，均对应已审输入和固定注册，成为basic_verified。878处发布来源含自动版本来源，逐段核顺序/ID、component/file、真实EOF、固定revision/version、原文、URL与kind，全部相符。其余940详情仅排除release_id后逐对象不变，对应索引仅排除detail_path后不变；1017身份和顺序、8refs payload保持。

validatePublication读取真实发布通过；analysis/coverage.json相等。独立剥离发布信封，以directives/references/coverage重新计算摘要，精确重现e33f9a74f8157679。实数1017注册/593基础/424仅注册/0深度/8参考，范围true，current前后SHA一致。本轮未运行根build、浏览器或后端服务，永久仅追加review。593正式接入通过，不放行后续草稿、不代表整站完成；接续审核gRPC/Memcached39及StreamProxy28。

## P05 gRPC28及内置Memcached11独立准备审核：38通过，SNI待R32

冻结JSON SHA256 `6868c0a5db6945639a91983abd8d07d822c19b2be0240429131ecc3f307f8759`及NOTES SHA256 `74e9aeceb43797075447b126c239c03483791d2508929133e829599cbcdd1e7e`已核。39身份精确覆盖两个完整owner，正式593无交集。读内置memcached完整模块及gRPC所引注册、配置、merge、HTTP/2请求/响应和TLS专用链路，复用前轮固定共享upstream/OpenSSL事实并核本模块绑定；39个活跃XML逐项对照。

| 指令组 | 独立逐义结论 |
| --- | --- |
| grpc_pass | content挂接、grpc/grpcs动态目标、HTTP_GRPC与HTTP_V2构建选择、前言及HEADERS/DATA、请求URI组成:path正确。 |
| grpc_bind、grpc_socket_keepalive | 本地/透明绑定、off、SO_KEEPALIVE非HTTP/2 PING或连接池正确。 |
| grpc_connect_timeout、grpc_send_timeout、grpc_read_timeout | 60s、连接含TLS等待、发送双窗口及读取事件间隔正确；非RPC总时限，禁用#if 0不充当活调用。 |
| grpc_intercept_errors | :status与grpc-status分离，重试/错误页资格及no_error_pages边界正确。 |
| grpc_buffer_size | 固定非缓冲、控制帧消耗后回收缓冲及首部未完成满缓冲错误正确，非流控窗口。 |
| grpc_next_upstream、grpc_next_upstream_tries、grpc_next_upstream_timeout | 独立502/504选项、流式已发正文限制、次数及决策时窗口正确。 |
| grpc_set_header | 整组继承、复杂值/空值抑制、显式Host停止自动:authority、TE条件正确，非TLS名称同步。 |
| grpc_pass_header、grpc_hide_header、grpc_ignore_headers | 精确默认七头、隐藏与处理区分、XML两头/源码九mask差异及无缓存/切换buffering承诺正确。 |
| grpc_ssl_session_reuse、grpc_ssl_protocols、grpc_ssl_ciphers、grpc_ssl_name | 会话、协议默认/ALPN h2、set_cipher_list及目标host名称链路正确。 |
| grpc_ssl_server_name | 开关和HTTP/2头分离正确；IPv4跳过条件同R31，待R32。 |
| grpc_ssl_verify、grpc_ssl_verify_depth、grpc_ssl_trusted_certificate、grpc_ssl_crl | verify分支CA/CRL加载、深度、握手结果及名称校验正确。 |
| grpc_ssl_certificate、grpc_ssl_certificate_key、grpc_ssl_password_file、grpc_ssl_conf_command | 静态/动态证书、配置期口令保留、post支持检查和ALPN后额外命令执行正确。 |
| memcached_pass | 静态目标、GET/HEAD丢弃正文、非空转义键与get命令、VALUE/END映射正确，不混第三方memc。 |
| memcached_bind、memcached_socket_keepalive | 可变本地绑定与静态目标区别、TCP探测与END完整后的复用资格区别正确。 |
| memcached_connect_timeout、memcached_send_timeout、memcached_read_timeout | 三种60s事件等待、无TLS分支、不传原正文及非总时限正确。 |
| memcached_buffer_size | 页默认/非缓冲、首行错误与正文尾部损坏路径区别正确，非对象长度限制。 |
| memcached_next_upstream、memcached_next_upstream_tries、memcached_next_upstream_timeout | invalid_response及not_found准确，404不计失败、次数/时间门槛正确。 |
| memcached_gzip_flag | 非零才解析flags、按位与、仅加Content-Encoding而非执行压缩正确。 |

442显式来源（357 Nginx、39 XML、46发行）真实EOF、callback/来源ID、文档锚点及phases通过。独立临时34patch/142hunk/47最终SHA回放通过，348段保持、9段变化准确对应两协议timeout字段，另grpc_intercept_errors标间接affected。临时目录finally清理。历史543/8e7aa7f25e64b5d3仅为504隔离候选，未冒称593构建；未运行根build、后端或TLS服务。

### R32：grpc_ssl_server_name沿用过宽的IPv4跳过SNI表述

唯一limitation仍写“空名称、IPv4字面量、以[开头的IPv6字面量跳过SNI”。其所引固定U1857–1948即R31已经核实的共享实现，实际IPv4条件是ngx_inet_addr结果不等于INADDR_NONE；255.255.255.255是旧概括的反例。最小修复仅按R31收窄这一短句为源码条件，保留既有证据、其他38项和所有其他字段；不用重研或回放整批。38准备通过，完整39待该单句差异闭环，正式593保持，永久仅追加review。继续StreamProxy28；Mail31及StreamUpstream6按主通知排后，不阻止已过完整批次合入窗口。

## P16 StreamProxy28独立准备审核：原26通过，SNI两句待R33

原冻结SHA256 `fa74a37bd3b58afbfdd971a11a109b3d6e5189764c898d91c5f7a26e078d9e36`已核，精确覆盖本owner除正式proxy_pass/proxy_connect_timeout/proxy_timeout外剩余28身份，不重审或改写旧三项。逐项读取固定Stream本域注册/post/merge及使用路径、26个活跃XML，两个旧buffer别名无XML按源码处理。

| 指令（均proxy_前缀） | 独立逐义结论 |
| --- | --- |
| bind、socket_keepalive | 静态/动态本地绑定、空及无效变量边界、透明资格及SO_KEEPALIVE设置失败告警忽略正确。 |
| buffer_size、downstream_buffer、upstream_buffer | 16k及双向分别分配、旧别名仍写同一槽并告警/重复拒绝正确，两个deprecated:true齐备。 |
| upload_rate、download_rate | 初始化复杂值求值、0回退、按连接读预算/延迟及UDP不截小读取长度正确。 |
| requests、responses | UDP解绑与结束区分、响应乘请求阈值、默认不限及缓冲条件正确。 |
| next_upstream、next_upstream_tries、next_upstream_timeout | on及额外次数/决策时窗口、已缓冲失败、发行特殊状态及导出getter正确。 |
| protocol、half_close | 上游PROXY与监听接收选项分离、TLS前完整发送及ctx超时、TCP半关闭和双EOF条件正确。 |
| ssl、ssl_session_reuse、ssl_protocols、ssl_ciphers | SOCK_STREAM资格、会话非TCP复用、固定协议位图及set_cipher_list边界正确。 |
| ssl_name、ssl_server_name | 本域名称求值/去端口、SNI与验证分离正确；两个限制泛称IP均待R33收窄。 |
| ssl_verify、ssl_verify_depth、ssl_trusted_certificate、ssl_crl | verify资格、信任/CRL/深度真实调用及握手结果/名称失败重试正确。 |
| ssl_certificate、ssl_certificate_key、ssl_password_file、ssl_conf_command | 静态/连接期加载、证书空值跳过、口令保留、真实post支持检查及命令列表继承正确。 |

255引用（198 Nginx、26 XML、31发行）真实EOF、callback/来源ID、文档锚点通过。独立临时34patch/142hunk/47最终SHA回放通过，196段保持，2段变化精确对应next_upstream/implementation-0与protocol/implementation-3。为确认新增未落入原始slice的行为，另在实际回放树读回SPECIAL_RESPONSE直接finalize、get_next_upstream_tries返回配置值、PROXY发送等待ctx->timeout；三个affected标记与事实相符。所有临时目录finally清理，无根build、TLS或密钥文件执行。历史544/142e8d2117c09154只属516隔离候选。

### R33：Stream的ssl_name及ssl_server_name均过宽概括IP跳过SNI

独立读本域src/stream/ngx_stream_proxy_module.c:1177–1272，1231–1236同样仅按名称空/首字符[以及ngx_inet_addr结果不等于INADDR_NONE跳过。原ssl_name称“空名称或IP字面量不发送SNI”，原ssl_server_name称“空名称、IPv4字面量或方括号IPv6不发送”，均需按实际条件收窄。不是只改server_name后便整批放行。审中主已通知并修改server_name，授权变化不当成未知漂移；下节记录该一处差异通过，ssl_name仍待最小修正。

## R32及两处同类单句差异复核：gRPC39放行，HTTP旧一项准备修正通过

独立核主提供的三个新SHA，并仅在内存恢复各自旧短句，分别精确重现原SHA：

| 草稿 | 新SHA256 | 反向重现原SHA256 |
| --- | --- | --- |
| HTTP_GRPC_MEMCACHED_BASIC.json | fa7040f3d3def0d586802ec69c8e9feeeea01185438ceb33f047f439aa2a1730 | 6868c0a5db6945639a91983abd8d07d822c19b2be0240429131ecc3f307f8759 |
| STREAM_PROXY_BASIC.json | 5e5726b8041c405995e15abdb214211b3f0f3cf074d0daa31c60620c3faf2f22 | fa74a37bd3b58afbfdd971a11a109b3d6e5189764c898d91c5f7a26e078d9e36 |
| HTTP_PROXY_BASIC.json | e76c7512e5db4221b21a0744927440be17c9f7c3a873b2c1d75845da5230a208 | 8d07fae9f1ec4b46066ca9249184868d7596a96344d99f3aeeffd43ed4f38db6 |

每份仅一个limitation短句变更，其他项/来源/所有字段保持；三份NOTES新增SNI段已读。HTTP两条依据既有U1857–1948，Stream一条依据本域1185–1272，修正均准确，无需重复补丁回放或全批。R32关闭，gRPC/Memcached完整39准备放行；Stream现27通过，仅ssl_name仍待R33。HTTP已正式proxy_ssl_server_name同类遗漏作为R34登记：读593真实详情确认旧泛称仍在，因此本次只放行草稿单句修正，正式闭环待新candidate，不宣称593已修复。

主可按新SHA合入39并同步HTTP既有一项修正，预期632基础/385仅注册，1017/0deep/8refs保持；也可在Stream余一句通过后同批合入，不需等待Mail31或StreamUpstream6。current仍593，SHA256 `0318e3bb456cccd7514b374cef738aff0fb948afefd91ca4943e6c831951339e`，永久仅追加review。

## R33最终单句差异复核：关闭，交还67新增及HTTP旧一项修正构建窗口

StreamProxy新SHA256 `faa6c837c510058e5657e0b237dfe2e056a03707287cb0881866c03a610bac3d`已独立核定。仅在内存恢复proxy_ssl_name唯一limitation原文，精确重现上一SHA256 `5e5726b8041c405995e15abdb214211b3f0f3cf074d0daa31c60620c3faf2f22`，证明其余27项、已通过server_name修正、来源及其他字段保持。本轮再次读固定本域1185–1272，名称空、首字符[或ngx_inet_addr结果不等于INADDR_NONE的条件准确；NOTES R33增量已读。R33关闭，StreamProxy完整28准备放行，不重审无变化内容或回放补丁。

| 本轮可合入草稿（analysis/content/） | 合入范围 | 冻结SHA256 |
| --- | --- | --- |
| HTTP_GRPC_MEMCACHED_BASIC.json | 新增39项 | fa7040f3d3def0d586802ec69c8e9feeeea01185438ceb33f047f439aa2a1730 |
| STREAM_PROXY_BASIC.json | 新增28项 | faa6c837c510058e5657e0b237dfe2e056a03707287cb0881866c03a610bac3d |
| HTTP_PROXY_BASIC.json | 既有proxy_ssl_server_name单句修正，非新增68项 | e76c7512e5db4221b21a0744927440be17c9f7c3a873b2c1d75845da5230a208 |

gRPC及HTTP两份SHA本轮再次确认保持。新增67合入593后预期660基础/357仅注册，1017注册/0深度/8参考；HTTP既有一项不增加覆盖计数。R34仍待实际新candidate的正式单句接入闭环，届时核67新增、1旧项许可差异、其余949详情及8refs和摘要。当前index SHA256仍0318e3bb456cccd7514b374cef738aff0fb948afefd91ca4943e6c831951339e，正式593不变。永久仅追加review，本轮结束交还构建窗口，不等待或扩展Mail31/StreamUpstream6。

## 660正式67新增及HTTP旧一项差异审核：通过，R34关闭（2026-10-13）

锁定actualcandidate `1.27.1.1-d3966b115cc98f81`，基线593/e33f9a74f8157679。current与版本index一致，SHA256 `3a660b01c31b76c0ea72202260811554be813dc8ed21aea8569396e31eb889a5`；593历史index仍匹配0318e3bb…。三份输入逐一核上节完整冻结SHA，knowledge末67精确等于gRPC39再StreamProxy28，HTTP既有proxy_ssl_server_name对象等于修正草稿。

独立核67项summary/syntax/defaults/inheritance/limitations/patch_status/documentation/related/mechanism、phases/contexts、完整availability、verification_notes及配置入口，均匹配已审输入/固定注册。764处发布来源（481+283，含自动版本来源）逐段核顺序、ID、component/file、真实EOF、revision/version、原文、URL与kind，全匹配固定git show。两旧buffer别名deprecated:true与R33两句保留正确。HTTP旧项仅唯一limitation.text变为获准句，其他字段/来源不变；其余949详情排除release_id后完全相等，旧索引排除detail_path后相等。1017身份顺序及8refs payload保持。

真实validatePublication通过，coverage文件相等；剥离发布信封后独立计算directives/references/coverage摘要精确重现d3966b115cc98f81。实数1017注册/660基础/357仅注册/0深度/8参考，范围true，current前后SHA保持。R34正式单句接入闭环通过并关闭；主补报61463真实HTTP 68项及TaskSpace1/p1中HTTP proxy_ssl_server_name展示新句/660计数，该运行展示归主验收证据，独立审核未重复浏览器或HTTP操作。

660增量通过，不代表整站完成或其他草稿通过。未运行根build，永久仅追加review。按每1–2完整owner交还窗口的要求，Mail非TLS31先审mail包装层与core10，余21及后续队列不提前放行。

## Mail非TLS第一窗口：包装层1及core9完整准备通过（2026-10-13）

独立核MAIL_NON_TLS_BASIC.json完整SHA256 `7d735bb29aa78ea172022ccc614e3eff5038d328a55e8410b95bcbdfca09916b`，NOTES全文已读，SHA256 `c839ce7f17e07b91c8f2256547dfa709838a665e22b2c56a94d3c181db0652d9`。本次仅放行module为ngx_mail_module及ngx_mail_core_module的10对象，精确覆盖这两个完整owner，与正式660无交集；不是整份31放行。按原数组顺序筛选10对象，再以JSON.stringify(selected,null,2)+'\n'序列化的SHA256为 `15af25c21ea8b6de2c84c51b69dd7bd10447274b0d7b14163909d9d10c428ac1`。

| 指令 | 独立逐义结论 |
| --- | --- |
| mail | 主层唯一无参数块、创建各mail模块配置、逐server合并及监听整理正确。 |
| server | 独立srv配置、共享main配置、显式listen及协议确定要求正确，不混HTTP Host路由。 |
| listen | 地址/端口/主机名/unix、重复地址端口拒绝、平台宏与SSL资格、入站PROXY先读及bind整理正确。 |
| protocol | 只匹配编入协议、三个协议端口集合及无法推断时报错正确，端口不自动开启TLS。 |
| timeout | 60s继承、客户端读写及后端初始登录定时器正确；转发后proxy_timeout及认证/DNS超时边界明确。 |
| server_name | 继承字符串、最终空值回退hostname、SMTP greeting/HELO/EHLO及认证盐使用正确；POP3欢迎不无条件包含名称。 |
| error_log | 父层日志或cycle.new_log回退、本层日志列表替代父层、多个目标及debug内存日志资格正确；共享输出拦截与默认错误串扩大已标affected。 |
| resolver | 默认off/NULL、SMTP反查后正查核对客户端地址及Client-Host/XCLIENT NAME用途正确，不混认证返回目标解析；非Windows local扩展与safe IPv6行为明确。 |
| resolver_timeout | 30s继承、反查/正查各自ctx.timeout正确，非整个会话总时限。 |
| max_errors | 默认5、仅解析INVALID_COMMAND计数、满缓冲未完成命令直接退出、0并非无限制正确。 |

读取固定mail包装/core配置与merge、监听整理及对应协议handler、auth/proxy消费者，核对共享core setter/log/resolver及10个活跃XML。114显式来源（90 Nginx、10 XML、14发行）真实EOF、来源ID引用、callback绑定及configuration phase通过。四个空XML default的块/协议项保留unverified，不猜完整默认及继承。

独立临时回放34patch/142hunk/47最终SHA全部通过；90个Nginx引用88保持，变化仅error_log/log-output与resolver/implementation-0。另读实际回放树日志拦截分支、resolver的local分支及无IPv6构建处理，affected事实相符；未把整份31的自动校验冒称逐义通过。临时目录已finally清理，未运行根build、DNS/邮件服务或浏览器。

交还构建窗口：主可仅按上述两个module筛选合入10项，预期670基础/347仅注册，1017注册/0深度/8参考保持。剩余Mail21未放行，后续StreamUpstream6、NDK7、TLS68、iconv3、encrypted-session5继续候审，不阻当前窗口。正式current仍660，index SHA256 `3a660b01c31b76c0ea72202260811554be813dc8ed21aea8569396e31eb889a5`保持；本轮永久仅追加review，实际接入待新candidate另核。

## 670正式Mail包装/core10接入独立审核：通过（2026-10-13）

锁定actualcandidate `1.27.1.1-1461418be8e9b8d9`，current及版本index一致，SHA256 `8b2fe93419e3f988a29f90136de98fd33c1006ea3a1325ed0cd97634ac63c068`。660历史index仍匹配3a660b01…。原31草稿冻结SHA及前节10对象子集SHA15af25c2…均精确保持，正式knowledge末10与获准子集逐对象相等。

10项完整发布对象独立比对通过，包括summary/syntax、默认/继承/限制、补丁状态、configuration_entry、contexts/phases、availability、verification_notes及documentation/mechanism/related。124处发布来源（114显式及10自动版本）逐一核ID/顺序、固定revision/version、component/file、真实EOF、原文、URL及kind。其余1007详情仅排除release_id后完全相同，索引仅排除detail_path后相同；1017身份顺序及8refs payload保持。

真实validatePublication通过，coverage另核其release_id与当前一致，其他字段等于发布coverage。独立剥离发布信封计算摘要，精确重现1461418be8e9b8d9；1017注册/670基础/347仅注册/0深度/8参考，范围true。current前后SHA保持。未运行根build、浏览器或邮件/认证HTTP服务。主授权660→670变更不作为候选漂移，也不据此代验set-misc隔离结果；永久仅追加review。

## Mail非TLS第二窗口：auth_http完整4通过，IMAP2通过、imap_auth待R35（2026-10-13）

仍锁MAIL_NON_TLS_BASIC.json SHA256 `7d735bb29aa78ea172022ccc614e3eff5038d328a55e8410b95bcbdfca09916b`。本轮7身份精确覆盖ngx_mail_auth_http_module与ngx_mail_imap_module，无正式knowledge交集。重新读取NOTES，逐项读固定注册/create/merge、配置callback及auth_http请求/响应处理、IMAP状态机和7个活跃XML；复用已核mail逐server合并入口，不扩审其他owner。

| 指令 | 独立逐义结论 |
| --- | --- |
| auth_http | 配置期http或裸地址/Unix URL、端口80及URI回退、无HTTPS/变量链、HTTP/1.0 GET与Auth头交换、路由IP及端口资格、无默认地址及整组peer/host/uri继承正确。 |
| auth_http_timeout | 默认60s、同时安装读写计时、发送完成删写计时、每次读数据不重置读计时正确；Auth-Wait为另一延迟。 |
| auth_http_header | 字面头追加、同层累积、子层有任一条不继承父层整组正确，不作变量求值或同名覆盖。 |
| auth_http_pass_client_cert | 默认off、NGX_MAIL_SSL/SSL连接/verify非零消费条件、raw PEM经URL编码、非空才加头正确；不启用验证或认证HTTP加密。 |
| imap_client_buffer | ngx_pagesize默认及继承、init_protocol首次分配、未完成命令满缓冲退出正确，不混邮件大小或后端缓冲。 |
| imap_capabilities | 默认三能力、同层追加/整组继承、AUTH及TLS状态选择公告正确，公告不实现后端功能。 |
| imap_auth | 默认plain、bitmask累加及继承、明文方法未公告仍可接受正确；EXTERNAL许可概括遗漏初始响应路径，待R35。 |

76显式来源（62 Nginx、7 XML、7发行）真实EOF、来源ID、callback及configuration phase通过。独立临时34patch/142hunk/47最终SHA回放通过，62个引用全部保持；另核R35新增调查的ngx_mail_parse.c:903–975与ngx_mail_handler.c:722–753原文在回放树保持。临时目录finally清理。片段保持不等于文案已完整，故不据此放行imap_auth。

### R35：imap_auth将EXTERNAL方法掩码控制概括为所有调用路径

summary称“控制CRAM-MD5与EXTERNAL处理许可”，limitation称“CRAM-MD5/EXTERNAL才有方法掩码检查”，遗漏EXTERNAL携带初始响应的分支。固定src/mail/ngx_mail_imap_handler.c:364先调用ngx_mail_auth_parse，410–414仅在返回NGX_MAIL_AUTH_EXTERNAL时检查方法掩码；src/mail/ngx_mail_parse.c:960–968中，无初始响应返回该枚举，有第二参数则直接调用ngx_mail_auth_external(s,c,1)。后者在src/mail/ngx_mail_handler.c:722–753解码并返回NGX_DONE，IMAP handler:422原样返回，235–237进入ngx_mail_auth及auth_http，不经过410–414。IMAP命令解析器391–405、438–490允许该第二参数。这不表示认证自动成功，后续仍由auth_http处理；STARTTLS-only检查也仍存在。

最小修复：仅收窄imap_auth的summary及对应limitation，明确EXTERNAL无初始响应分支检查掩码、带初始响应分支不经过该检查；追加共享parser及external函数固定引用，接入该事实和patch_status的source_ids，NOTES同步。其他6项无需重研。POP3/SMTP共用parser，后续owner审核须同样沿返回值确认，当前不提前宣称其通过。

当前可合入仅ngx_mail_auth_http_module完整4对象；从原数组筛选此module，以JSON.stringify(selected,null,2)+'\n'序列化SHA256为 `6417d9839cf17173b4547dff6d25004b948ec7bcd9d02f03ce5486c3a90aca85`。基于670预期674基础/343仅注册，1017/0deep/8refs保持。IMAP两项已审通过，但按完整owner窗口暂不与4项一起放行，待R35差异闭环后整组三项合入。Mail累计16项逐义通过、1项待修、14项未审。后续StreamUpstream6→NDK7→TLS68→iconv3→encrypted-session5→set-misc29队列保留，不阻本轮auth_http窗口。

本轮正式670核验与准备结论已分别落盘，未改草稿、NOTES、knowledge或current，未运行根build/服务。交还窗口，不等待未审队列。

## POP3及SMTP两个owner逐项准备审核：4通过，2项同类遗漏待R36（2026-10-13）

本轮开始锁Mail31原SHA7d735bb2…，逐项审核ngx_mail_pop3_module两项及ngx_mail_smtp_module四项。完整读取两个配置模块及对应handler、六个活跃XML，复用前轮已读共享setter、mail合并及auth_http消费链。审中主仅修R35的imap_auth，属于授权变化；下节反向重现旧SHA确认本轮六项完全未变。

| 指令 | 独立结论 |
| --- | --- |
| pop3_capabilities | TOP/USER/UIDL默认、同层追加/整组继承、SASL组合、按TLS状态选择STLS及only公告去USER正确；不把公告当后端实现。 |
| pop3_auth | plain默认及派生LOGIN位、USER/PASS与AUTH PLAIN/LOGIN不由公告开关禁用、APOP掩码及挑战响应交认证服务正确；summary对EXTERNAL许可概括过宽，待R36。 |
| smtp_client_buffer | ngx_pagesize默认/继承、create_buffer分配、未完成命令满缓冲退出正确，不混DATA大小或上游缓冲。 |
| smtp_greeting_delay | 默认0、延迟前读计时、到期欢迎并改用core timeout、提前发命令回复503并退出正确，不是逐命令延迟。 |
| smtp_capabilities | 无自定义扩展默认、整组继承、HELO与EHLO区别、AUTH及STARTTLS公告选择正确。 |
| smtp_auth | plain/login默认与bitmask继承、明文方法未公告仍可走、none经MAIL/RCPT后调用auth_http正确；EXTERNAL按掩码检查的概括待R36。 |

六项身份完整且未进入正式knowledge；67显式来源（55 Nginx、6 XML、6发行）真实EOF、ID绑定、callback及configuration phase通过。独立34patch/142hunk/47最终SHA回放通过，55个Nginx片段全部保持，临时目录finally清理。新增R35两段也在本轮回放树再次确认保持。

### R36：pop3_auth与smtp_auth沿用EXTERNAL全路径受方法掩码控制的概括

pop3_auth summary称“APOP、CRAM-MD5、EXTERNAL许可”，smtp_auth limitation称“CRAM-MD5/EXTERNAL按掩码检查”，均未区分初始响应。固定POP3 handler:493先调用共享解析器，531–535仅检查返回NGX_MAIL_AUTH_EXTERNAL的分支，543原样返回其他结果；SMTP handler:677、723–727、735结构相同。共享ngx_mail_parse.c:960–968在EXTERNAL带第二参数时直接调用ngx_mail_auth_external，后者ngx_mail_handler.c:722–753解码并返回NGX_DONE；POP3:271–273及SMTP:559–561因此进入auth_http，不经过上述方法位检查。两协议命令parser分别121–175、812–848允许第二参数。STARTTLS-only资格仍检查，进入auth_http不等于认证成功。

最小修复仅针对这两个对象：收窄pop3_auth summary并在limitation补明确分支，收窄smtp_auth对应limitation；追加共享parser903–975、external722–753及相关source_ids，NOTES同步。APOP、CRAM-MD5和none等已核事实不重写。其余四项通过，但按完整owner窗口暂不整组放行POP3/SMTP；Mail proxy7及realip1仍未审。本finding不阻auth_http/IMAP已过窗口。

## R35单项差异复核：关闭，auth_http4＋IMAP3准备放行（2026-10-13）

独立核新Mail31 JSON SHA256 `a3c7a86136b8a25fb280da2c00760d607201003e3843d428b1b735ddcb34eb73`、NOTES SHA256 `af27e754af17357083fed80051646515fc1cf988f9ac2447786c6d9ffce42836`，新增NOTES段已读。在内存恢复imap_auth原summary/limitation、移除auth-parser/auth-external两evidence及限制/patch的对应ID，精确重现原完整SHA256 `7d735bb29aa78ea172022ccc614e3eff5038d328a55e8410b95bcbdfca09916b`；其他30对象及其全部字段无变化。

修正明确EXTERNAL无初始响应检查方法掩码、带初始响应经共享解析器直接解码，且保留STARTTLS-only和后续auth_http边界，与已读固定调用链一致。新增两引用范围与source_ids准确，真实EOF及本轮实际补丁回放保持已确认。R35关闭，不重审IMAP其他两项。

| 可合入身份（从同一新冻结Mail31数组按module筛选、保持原顺序） | 数量 | JSON.stringify(selected,null,2)+'\n'子集SHA256 |
| --- | --- | --- |
| ngx_mail_auth_http_module：auth_http、auth_http_timeout、auth_http_header、auth_http_pass_client_cert | 4 | 6417d9839cf17173b4547dff6d25004b948ec7bcd9d02f03ce5486c3a90aca85 |
| ngx_mail_imap_module：imap_client_buffer、imap_capabilities、imap_auth | 3 | cdd0d0be3163780eade7404a52b44a33bcf55fcde312300642c03edc77a6a69a |

基于正式670合入上述7项预期677基础/340仅注册，1017注册/0深度/8参考保持。Mail31累计21项逐义通过（其中10已正式）、2项待R36、8项未审；不把原31整份合入。current仍670/index SHA8b2fe93419e3f988a29f90136de98fd33c1006ea3a1325ed0cd97634ac63c068。永久仅追加review，未运行根build/邮件或认证服务；本轮交还7项构建窗口。后续Mail proxy/realip、StreamUpstream6、NDK7、TLS68、iconv3、encrypted-session5及set-misc29队列不变。

## R36两对象差异复核：关闭，POP3/SMTP完整6项准备放行（2026-10-13）

独立核MAIL_NON_TLS_BASIC.json新SHA256 `13653258359a0b7ce384b132f34d70cef6a94ee9999d36e1b75aea3d45e38fa7`，NOTES新增R36段已读，当前NOTES SHA256 `1a50a4ff4b180e133e1f866684300a2f33167c5876bca7e619dc72000376476d`。仅在内存恢复pop3_auth原summary及limitation、smtp_auth原limitation，移除各自auth-parser/auth-external两evidence及限制/patch中的对应ID，精确重现上一完整SHA256 `a3c7a86136b8a25fb280da2c00760d607201003e3843d428b1b735ddcb34eb73`。证明其他29对象（含R35已修IMAP）全部保持，未扩大写集。

两项均明确EXTERNAL无初始响应才在协议handler检查方法掩码、带初始响应在共享解析器直接解码，后续仍须auth_http处理，不等于认证成功；TLS-only边界保留。新增两种引用分别精确等于R35已审的ngx_mail_parse.c:903–975与ngx_mail_handler.c:722–753，限制及patch_status的source_ids正确接入；这些固定片段已在上一轮实际34/142/47回放树确认保持，本次不重复无变化回放或重审其他四项。R36关闭。

| 可合入身份（按module筛选新冻结数组并保持原顺序） | 数量 | JSON.stringify(selected,null,2)+'\n'子集SHA256 |
| --- | --- | --- |
| ngx_mail_pop3_module：pop3_capabilities、pop3_auth | 2 | bf958758ec908389fede3d3fbf59180baf205b9e01a917082a081b32d4361946 |
| ngx_mail_smtp_module：smtp_client_buffer、smtp_greeting_delay、smtp_capabilities、smtp_auth | 4 | eaa81604c976107a4ee82618666e20641f6bc767176cd4be842ec306a6e96315 |

这6项可基于已发布677合入至683基础/334仅注册，1017/0deep/8refs保持。Mail31当前23项逐义通过（其中17已正式）、8项proxy/realip未审；不整份合入31。下一准备窗口为proxy7与realip1。HTTP_MEMC_BASIC11冻结SHA `2b6355c73ad18e194993174b368d67574c1e227c819a7df76a9abfe6f8520a55`及NOTES仅入队，排set-misc29之后，尚未核定或放行，不延迟这6项窗口。

## 677正式auth_http4及IMAP3接入独立审核：通过（2026-10-13）

锁定actualcandidate `1.27.1.1-b809249ff0c46d2d`，current与版本index一致，SHA256 `fa89a5024557bcac4b63553f261e053583c108f6277802b02d8143c0b07d8a1e`。670历史index仍精确匹配8b2fe934…。两个已放行子集SHA6417d983…及cdd0d0be…独立重核保持，knowledge末7按原顺序精确等于auth_http4再IMAP3，R36的POP3/SMTP对象未混入。

7项完整发布对象逐字段核定：summary/syntax/defaults/inheritance/limitations、availability、contexts/phases、verification_notes、configuration_entry、documentation/mechanism/related及patch_status均相符，含R35新增分支说明和两证据。85处发布来源（78显式及7自动版本）逐一核ID顺序、component/file、revision/version、真实EOF、固定原文、URL及kind，全部一致。

其余1010详情排除release_id后完全不变，相应索引排除detail_path后不变；1017身份顺序及8refs payload保持。真实validatePublication通过，coverage及其release_id匹配；剥离发布信封后独立重算摘要精确重现b809249ff0c46d2d。实数1017注册/677基础/340仅注册/0深度/8参考，范围true，current前后SHA保持。

本轮仅追加review，未修改草稿、NOTES、knowledge或current，未根build或操作浏览器/邮件服务。正式677通过，交还POP3/SMTP6项构建窗口；其余准备队列与新增memc11保留，不将候审统计当正式计数。

## Mail非TLS最后窗口：proxy7及realip1完整准备通过（2026-10-13）

本轮独立锁MAIL_NON_TLS_BASIC.json SHA256 `13653258359a0b7ce384b132f34d70cef6a94ee9999d36e1b75aea3d45e38fa7`。8身份精确覆盖ngx_mail_proxy_module及ngx_mail_realip_module，与正式677无交集。逐项读取固定注册/create/merge及proxy初始连接、协议登录到透明转发、SMTP状态机、PROXY写头和realip配置/消费路径，复用前轮已核SMTP反查正查与auth_http转代理链路。未混入HTTP/Stream同名对象。

| 指令 | 独立逐义结论 |
| --- | --- |
| proxy | 注册、字段默认off及继承真实存在；固定src/mail检索enable仅声明/offset/初始化/merge，无运行期读取，正文不承诺off禁止代理正确。XML该节点确处注释内。 |
| proxy_buffer | 页大小默认、后端欢迎/登录及后端到客户端使用s->proxy->buffer，反向复用协议s->buffer正确；响应未完整且满缓冲错误边界有依据。 |
| proxy_timeout | 默认24h及继承、三协议登录后替换计时、客户端侧事件更新read timer正确，不泛称任意后端事件均重置，也非连接总寿命。 |
| proxy_pass_error_message | 默认off、后端响应检查失败时才保存原文并发送后退出正确；不混Auth-Status，连接失败及未完整超长行无透传保证。 |
| xclient | 默认on、SMTP先服务器EHLO再XCLIENT及条件性客户端HELO/EHLO、smtp_auth时省略LOGIN、NAME来自地址反查正向核对正确。 |
| proxy_smtp_auth | 默认off、实际AUTH PLAIN编码NUL/用户名/NUL/密码、密码可用性检查、NONE优先MAIL FROM及XCLIENT LOGIN互斥正确。 |
| proxy_protocol | 默认off、入站选项独立、ngx_proxy_protocol_write为v1的TCP4/TCP6/UNKNOWN、AGAIN重试与部分发送失败正确。 |
| set_real_ip_from | from默认NULL及整组继承、配置期CIDR/主机名/unix处理、先读PROXY且原始连接地址可信才替换地址/端口正确，不读取HTTP转发头。 |

85显式来源（70 Nginx、7活跃XML、8发行）逐条核真实EOF、来源ID、callback绑定、configuration phase；proxy无活跃XML已用固定完整配置/使用路径核定。独立临时34patch/142hunk/47最终SHA回放全部通过，70个Nginx引用全部保持，临时目录finally清理。未运行根build、邮件服务、DNS操作或浏览器。

### 当前可合入集合：剩余Mail14，四个完整owner

以下均从上述冻结31数组按module筛选并保持原顺序；子集SHA使用JSON.stringify(selected,null,2)+'\n'。POP3/SMTP两子集再次核保持，R35/R36均已关闭。

| owner及完整身份 | 数量 | 子集SHA256 |
| --- | --- | --- |
| ngx_mail_pop3_module：pop3_capabilities、pop3_auth | 2 | bf958758ec908389fede3d3fbf59180baf205b9e01a917082a081b32d4361946 |
| ngx_mail_smtp_module：smtp_client_buffer、smtp_greeting_delay、smtp_capabilities、smtp_auth | 4 | eaa81604c976107a4ee82618666e20641f6bc767176cd4be842ec306a6e96315 |
| ngx_mail_proxy_module：proxy、proxy_buffer、proxy_timeout、proxy_pass_error_message、xclient、proxy_smtp_auth、proxy_protocol | 7 | 3eb16d10adb51cf04e37af1a58abfd53671717cc132831dc935b8ac93e099f70 |
| ngx_mail_realip_module：set_real_ip_from | 1 | 0edaf88dfd799f6953e27acdeb3b73d56b68f74b22f86b40168381a0c9ec2047 |

Mail非TLS31至此全部逐义审核通过，其中17已正式，余14准备放行。当前正式677，四组一起合入预期691基础/326仅注册，1017注册/0深度/8参考保持；也可保留上一窗口先合6，再合本轮8，不重复追加已正式17。current SHA256仍 `fa89a5024557bcac4b63553f261e053583c108f6277802b02d8143c0b07d8a1e`，前后保持。

交还本轮8项及累计14项构建窗口；永久仅追加review，不改草稿/knowledge/current。后续仍为StreamUpstream6→NDK7→TLS68→iconv3→encrypted-session5→set-misc29→memc11。HTTP_REDIS2_BASIC11冻结SHA `80d290c7d4dcb46dfc56bbbd0bfdbdae39bdc5fa904423ee9fdd5dd65f75668f`及NOTES按主通知追加memc之后：待审重点为local NULL与共享bind的UNSET_PTR哨兵冲突、TAKE1无transparent、四query继承及优先级、N仅回复计数；该批尚未读取核定，不把主隔离688结果当独立通过。

## 691正式Mail剩余14接入独立审核：通过（2026-10-13）

锁定actualcandidate `1.27.1.1-2a787ebf4c204bed`，current及版本index一致，SHA256 `5a61d6dddab2884a08daeaa496bf54bd0acf5baa492f31b167bb9bb6d5884d1f`。677历史index仍匹配fa89a502…。Mail31完整冻结SHA13653258…及四owner子集SHA逐一核定，knowledge末14精确按原数组POP3→proxy→realip→SMTP顺序追加，未按表格展示顺序误改输入。

独立比对14个完整发布对象，功能/语法、默认/继承/限制、补丁状态、配置入口、availability、contexts/phases、verification_notes、documentation/mechanism/related全部相符，包括R36两处EXTERNAL修正。170处发布来源（156显式及14自动版本）逐段核ID/顺序、component/file、真实EOF、固定revision/version、代码原文、URL和kind通过。

其余1003详情仅排除release_id后不变，索引仅排除detail_path后不变；1017身份顺序及8refs payload保持。validatePublication读取真实发布通过，coverage及release_id一致；剥离发布信封独立重算摘要精确重现2a787ebf4c204bed。1017注册/691基础/326仅注册/0深度/8参考，范围true，current前后SHA保持。Mail非TLS31至此全部正式接入通过；不据此宣称TLS或后续候审内容通过。未根build、浏览器或邮件运行测试，永久仅追加review。

## StreamUpstream第一窗口：upstream/server及hash两个完整owner准备通过（2026-10-13）

独立核STREAM_UPSTREAM_BASIC.json SHA256 `6634c43294244007ce45d86cd27431c3ce63fafd5d6441a28909327aaac14717`及NOTES SHA256 `14d2c2757e7eb72264b71376860b073551289b0a3f4f762e30314270a6a73e78`；NOTES全文已读。仅审核ngx_stream_upstream_module两项及ngx_stream_upstream_hash_module一项，精确覆盖两个owner，与正式691无交集。其余least_conn/random/zone不提前放行。

| 指令 | 独立逐义结论 |
| --- | --- |
| upstream | stream主层命名组、独立srv_conf及UPSCONF解析、重复组拒绝、至少一server及默认加权轮询正确；不混监听客户端server块。 |
| server | 六类实际参数、默认1/0/1/10s及非backup/down、地址端口与多地址peer正确；算法flags约束、单peer仍检查down/max_conns、无失败阈值排除、zone共享与无zone worker独立边界正确，未混商业参数或主动健康检查。 |
| hash | Stream复杂值、普通CRC权重选址、一致性每权重160点及去重环、两路径空键/单peer/超过20次回退、失败/down/max_conns筛选正确；flags无backup、重定义告警替换初始化函数而非算法叠加正确。 |

读取固定upstream注册/配置/初始化、round_robin建peer/选址/释放、hash普通及consistent完整相关路径和zone共享peer复制，并对照三个活跃XML。27显式来源（21 Nginx、3 XML、3发行）真实EOF、ID引用、callback及documentation锚点通过；phase=null保留，不将负载均衡回调强标请求阶段。独立临时34patch/142hunk/47最终SHA回放通过，21个Nginx引用全部保持；仅核所引局部事实，不因引用保持声称整个共享round_robin文件无补丁。临时目录finally清理，无根build或连接/DNS执行。

| 可合入身份（从冻结数组按module筛选，保持原顺序） | 数量 | JSON.stringify(selected,null,2)+'\n'子集SHA256 |
| --- | --- | --- |
| ngx_stream_upstream_module：upstream、server | 2 | 4f9b5d7f977caebb2c549e4e5f35d3a8c2421bbf8216ba09c9e64265cc6bb884 |
| ngx_stream_upstream_hash_module：hash | 1 | fd46182660e6d339f34cbec453e0b6f6cbf8335f7fe8e637ec55979594688a07 |

交还3项准备合入窗口：基于正式691预期694基础/323仅注册，1017/0deep/8refs保持。正式current仍691，SHA5a61d6dd…保持。后续Stream余3→NDK7→TLS68→iconv3→encrypted-session5→set-misc29→memc11→redis2 11不变；HTTP_REDIS_BASIC8新冻结SHA `ad5c9b63c8e1a4d5744440bb533a7efe0dcb9d26077279f1ac77a036364d1cd3`按通知排redis2后，专属三patch/8hunk、片段变化及bind NULL状态留待独立核验，主隔离685未作为本角色通过结论。永久仅追加review。

## StreamUpstream第二窗口：least_conn及random两个完整owner准备通过（2026-10-13）

STREAM_UPSTREAM_BASIC.json SHA256仍 `6634c43294244007ce45d86cd27431c3ce63fafd5d6441a28909327aaac14717`，两身份精确覆盖ngx_stream_upstream_least_conn_module与ngx_stream_upstream_random_module，与正式691无交集。完整读取两个固定模块，复用上轮已核独立upstream配置及round_robin建立/回退/释放路径，逐项对照活跃XML。

least_conn：无参数注册、默认不自动启用、按conns/weight比较、同比例再按有效权重选择、排除tried/down/失败暂避/max_conns、单peer回退及backup递归正确；不混CPU或耗时。random：权重区间采样、初始two=0、two选择两个不同可用候选后比较conns/weight、两种模式单peer及超过20次回退正确；语法只支持two与可选least_conn，flags无backup，未纳入商业least_time。两者重定义告警后覆盖初始化函数、独立组无server层级继承及phase=null均符合固定实现。

18显式来源（14 Nginx、2 XML、2发行）真实EOF、来源ID、callback、文档锚点通过；独立临时34patch/142hunk/47最终SHA回放全部通过，14个Nginx引用保持。局部保持结论未外推整个共享文件。临时目录finally清理，未运行根build、Nginx/OpenResty或连接/DNS操作。

| 本轮可合入完整身份 | 数量 | 按原数组筛选module后JSON.stringify(selected,null,2)+'\n'子集SHA256 |
| --- | --- | --- |
| ngx_stream_upstream_least_conn_module：least_conn | 1 | d242db8c80fe4dc22af2942239b0930b0601b5b0e2503c2e9430104c1da87969 |
| ngx_stream_upstream_random_module：random | 1 | 5e4d069d6f19a654a3a38999e644e42e3289d005aff1cb84fc988fea23268a19 |

结合上一窗口upstream/server/hash，Stream六项中已有5项准备放行，可按原序筛选上述四owner合入，基于691预期696基础/321仅注册；zone一项仍未独立审核，不放行整份六项。主暂不build属主流控选择，审核不因此将待审zone记为已过。current仍691/index SHA256 `5a61d6dddab2884a08daeaa496bf54bd0acf5baa492f31b167bb9bb6d5884d1f`保持，本轮仅追加review。

队尾追加主通知的HTTP_SRCACHE_BASIC20，冻结SHA `c739a67a4554015908185d230cde4b612e6c6cf9fc9e52415fdb3cad305f7b72`，排Redis8之后；其buf_size消费、header_buffer实际用途、请求no-store、空args及if注册边界待核。HTTP Lua71按通知排srcache之后，候选SHA `ecdaf3a6bba1a9c20d6947a21dfabb45018547c7243028e3b5af5fd4c211dd4a`以最终交接为准。两批尚未读取核定，主隔离及实施NOTES不代替独立通过。下一窗口从Stream zone继续，后续NDK/TLS等顺序保持。

## Stream zone独立审核：通过，完整六项准备放行（2026-10-13）

锁定STREAM_UPSTREAM_BASIC.json SHA256 `6634c43294244007ce45d86cd27431c3ce63fafd5d6441a28909327aaac14717`。zone完整覆盖ngx_stream_upstream_zone_module，与正式知识无交集；单owner数组子集SHA256 `3bf59698a05dac362c91e7386c7b7d32045a27fc9efb6d75f084de494d6008a3`（JSON.stringify(selected,null,2)+'\n'）。

独立读取固定zone模块65–114：名字非空、显式容量至少8页、省略容量传0、使用upstream模块tag及noreuse=1；118–322的同zone多组遍历及peer/backup共享内存复制与草稿相符。复用已核round_robin439–673的连接/失败状态读写，并读取core/ngx_cycle.c420–480、1292–1362：同轮同名同用途zone可补容量，容量冲突/异用途拒绝，最终0容量失败；reload复用必须!noreuse。因此文案正确区分worker共享与reload状态保留，不扩写成业务缓存或商业动态成员/resolve能力。活跃XML318–347与源码边界一致。

10显式来源（8 Nginx、1 XML、1发行）真实EOF、来源ID及callback通过；独立临时34patch/142hunk/47最终SHA回放通过，8段保持，目录finally清理。Stream六项现全部准备通过，可按完整冻结数组合入；基于691预期697基础/320仅注册，1017/0deep/8refs保持。若主先合前五项，后续只追加zone，不重复合入。本角色未根build或修改草稿/current。

按主最新要求，本窗口落盘后不停下，继续NDK/array/form7。HTTP Lua71逐义审核已由Epicurus负责，独立记录analysis/LUA_CONTENT_REVIEW.md、finding L-R前缀；本角色不重复其研究，只在正式合入时按其最终放行SHA核发布增量。RDS CSV6冻结SHA `51c6f22fc8ab7ab56c71717eb14d89ac72036e4a8ec903448e1e1a2f8d174d2f`仅按主通知追加队尾，默认field_name_header、零列长度/输出及content_type拼写待后续核定，未提前放行。

## NDK/array/form七项独立准备审核：三个完整owner通过（2026-10-13）

锁定NDK_ARRAY_FORM_BASIC.json SHA256 `8c46fc9bb83f343b87459732d1426463b2293df0bab870c7c55eabfb9e3a5307`，NOTES全文读取，SHA256 `36056024cc95d917ecd60c7517e48f56c06f44875d9013499b3ad05924a7eeb4`。七身份精确覆盖三个owner，与当前正式知识无交集。独立核107显式来源：NDK27、set-misc1、OpenResty16、array31、Nginx12、form20；全部真实EOF、来源ID引用、注册及callback匹配。检查器已兼容NDK函数名与左括号间空格，首次检查失败不是草稿问题；README路径误试失败后按实际证据README.md读取，未计失败为通过。

| 身份 | 独立源码证据及结论 |
| --- | --- |
| upstream_list | 固定NDK ndk_upstream_list.c14–204及注册头、ndk.c main_conf、objs/ndk_config.c条件include：带权字符串桶、数字前缀冒号要求、大小写不敏感的全HTTP主配置命名空间相符。set-misc config启用宏与实际部署条件分开，未声称自动解析upstream或探测可达性。 |
| array_split | array模块132–222、421–522及util23–42：原地/to、max省略或0不限制、最后保留剩余、空分隔逐字节、无命中仍一项相符；内部ngx_array_t非普通字符串。 |
| array_map | 226–298、526–607及util97–118：复杂值模板、原地/新数组、成功末尾array_it标not_found相符，不误作Lua执行。 |
| array_map_op | 302–363、611–684及util47–93：运行时只遍历HTTP模块、匹配ndk_set_var_value配置入口和非空post、大小写敏感，调用filter并要求NGX_OK相符；未描述为任意指令解释执行。 |
| array_join | 367–417、688–756：原地/to、空数组空字符串、字节连接且不转义相符；README语法误写array_split已明确以实现为准。 |
| set_form_input / set_form_input_multi | form模块93–160、169–303、307–523：POST/PUT与Content-Type前缀、原字节字段值、单值首匹配、多值内部数组、ctx未就绪仍空字符串、落盘文件不读取与多链in_file中止、server级可能早于正文就绪均相符。注册无if上下文，未混同数组指令的if许可。 |

共同读取NDK变量目标、表达式、filter编译及执行路径，和Nginx rewrite136–184、272–294；phase=null及继承unverified未被误写为单一运行阶段或不继承。两个使用方config确认NDK依赖，固定发行组件处理确认无直接patch。独立临时实际34patch/142hunk/47最终SHA回放通过，12个Nginx片段全保持，临时目录finally清理；未运行配置脚本、Nginx、真实请求体操作或根build。

| 完整owner子集（原数组顺序，JSON.stringify(selected,null,2)+'\n'） | 数量 | SHA256 |
| --- | --- | --- |
| ndk_http_module：upstream_list | 1 | ade6e9bc4c50c8c8c476596e245b5308b3af0091b20209fdfcd8e8ab828b0e99 |
| ngx_http_array_var_module：array_split、array_map、array_map_op、array_join | 4 | b896dc88555bcdb3466aadc064e6c8e2ff6d0eb2c7e8e932a007b800a8cf0219 |
| ngx_http_form_input_module：set_form_input、set_form_input_multi | 2 | 0119317e9b83f22e92d70ff3396fa26b013b9128af9c1d625d9412df5695eba5 |

七项准备放行，无新增finding。主授权Stream6正式构建697正在进行，不能当异常漂移；若697正式通过后追加本七项，预期704基础/313仅注册，1017/0deep/8refs保持。本轮只追加review，继续TLS候审。按最新分工，RDS CSV6及RDS JSON10也交Epicurus逐义审核，本角色不重复RDS16研究，仍负责按独立放行SHA核正式接入。

## HTTP SSL28逐义审核：27项通过，R37一处限制需最小修正（2026-10-13）

锁定HTTP_SSL_BASIC.json SHA256 `4fab7d587a1c7c2e1ca0bd25a8faec3c08966dc87a2e70f18ed64a57959306f3`，NOTES全文读取。28身份完整覆盖ngx_http_ssl_module。336显式来源（268 Nginx、28活跃XML、40发行）物理EOF、来源ID、配置callback、XML身份全部通过；固定HTTP模块注册、create/merge及各指令实际使用链已逐项读取，不以共享SSL实现代替本域绑定。

证书/key独立整组继承、变量编译及临时request加载、配置期口令读取；DH与ECDHE、protocol掩码及默认server/SNI时序、cipher_list与后置SSL_CONF、16k发送聚合缓冲；verify的五类optional_no_ca豁免与HTTP请求检查、client/trusted CA列表区别、depth/CRL；session cache两字段独立合并、off/none返回分支、ticket 48/80字节与首key加密及共享轮换、300秒timeout；客户端OCSP链/leaf、AIA及cache一小时回退；stapling_file本地DER早返回、在线responder/verify、early_data两库接口与重放边界、conf_command post检查、SNI拒绝告警，均核至所引实际消费路径。除下面ssl_stapling单句外，其他27项未发现需要修正的事实或引用。

独立临时实际回放34patch/142hunk/47最终SHA通过，268段为264保持、4变化，变化精确为certificate/key/session_cache的openssl.c1881–1942和early_data的1948–2082。已读取三份yield补丁及最终源码实际分支：按库宏处理WANT_X509_LOOKUP、PENDING_SESSION、WANT_CLIENT_HELLO_CB，设置读写handler并返回AGAIN；草稿未将其冒称原生指令自动安装第三方回调。目录finally清理，未读取实际证书私钥、执行握手或根build。

### R37：ssl_stapling的发行者要求未限定在线路径

当前limitations[0]写“对静态上下文证书建立状态回调，需已知发行者”，把发行者前提扩到了本地响应文件路径。固定src/event/ngx_event_openssl_stapling.c262–269在file非空时装载并直接NGX_OK；只有之后272才调用ngx_ssl_stapling_issuer。296–352的本地DER解析也不寻找issuer。这会把合法的ssl_stapling_file使用条件描述得过严，并与本批该指令已写的本地早返回事实不一致。

最小修正仅将该句限定为“在线获取响应时需已知发行者；配置ssl_stapling_file时先装载本地响应，不走发行者查找”，保留其余默认、继承、动态证书和异步更新说明。既有implementation-2已包含262–272关键分支，不要求新增来源或重放补丁。修正冻结SHA后只复核该句及其他27对象保持，即可关闭R37并完整放行HTTP owner28；当前不放行整份旧SHA，也不阻挡NDK7及其他已过批次。

主已通知697实际构建3131d2594e9a02cd并将NDK7与Epicurus已过Lua52合入下一窗口，本角色依要求暂不读current做正式接入，待最终冻结candidate一次核691→窗口终点；继续Stream/Mail TLS逐义审核。

## R37最小差异复核：关闭，HTTP SSL28完整准备放行（2026-10-13）

独立核新SHA256 `906a22dd89bceea332667dd7517ef77a1a735ec260ee469016e3328834144442`。仅ssl_stapling limitations[0].text改为在线获取才需已知发行者、本地file先装载不查issuer；在内存恢复原句并按原JSON格式序列化，精确重现旧SHA `4fab7d587a1c7c2e1ca0bd25a8faec3c08966dc87a2e70f18ed64a57959306f3`。其余27对象、该项其他字段、全部来源与补丁声明字节保持，NOTES新增R37段已读。

新句与已核固定stapling.c262–272本地早返回/在线issuer分支完全一致，既有implementation-2充分覆盖，无新源码或来源变化，不重复回放。R37关闭，HTTP SSL完整28可按新冻结数组合入；当前窗口还在组装，正式接入待主冻结actualcandidate，不把knowledge计数当发布完成。

## Stream SSL21独立准备审核：完整owner通过（2026-10-13）

JSON SHA256 `226d6bde78b67405a96f273fce35ccce8d6ca7ebab97ac71a3c43e45779b5e0b`保持，NOTES SHA256 `2e3bcae017351647f8adb7c83d1825c8736ea447a28872b0224723c7cf1ce6fa`全文已读。21身份精确覆盖ngx_stream_ssl_module。258显式来源（204 Nginx、21活跃XML、33发行）真实EOF、callback、来源ID和文档身份通过。

逐项核本域注册、创建/merge和1299–1317的SSL phase挂接：handshake_timeout默认60s、仅AGAIN时挂read定时器、回调成功删计时恢复phases；certificate/key独立数组、session复杂值与连接池动态加载、password配置期读取；DH/curve、固定四协议默认、SNI上下文切换与cipher_list；verify/client/trusted/depth/CRL在本域verify非零下加载并由SSL阶段消费，未复制HTTP无条件trusted/CRL路径；prefer、STREAM session-id上下文、cache两字段独立继承、ticket及300秒timeout；conf_command真实post及后置调用；reject的SNI告警和无证书默认server条件；ALPN单项255字节、编码列表、无交集致命失败与客户端未发送ALPN的区别，均符合源码。共享SSL加载、验证、缓存及票据代码复用本轮HTTP已读固定证据，不用共享实现替代本域使用链。

独立临时34patch/142hunk/47最终SHA回放通过，204段为200保持、4变化：handshake_timeout/certificate/key/session_cache所引openssl.c1881–1942。三yield补丁及最终握手分支与上述HTTP核验一致，affected边界准确；未把配置入口phase=configuration误作握手只在配置期运行。临时目录finally清理，未运行握手或根build。Stream完整21准备放行，可按完整冻结SHA独立合入，不需等待Mail19或更后队列。

## Mail SSL审核中确定finding R38：两处继承句的否则分支错误（2026-10-13）

锁定MAIL_SSL_BASIC.json SHA256 `a09cdf5f5f79238d69f3a7773e01f7caf5511327b3f2afc014718eb6681ff3ad`。ssl_session_cache inheritance.text写“builtin_session_cache未设时继承父值，否则用none”；ssl_session_tickets inheritance.text写“本层未设置则继承父开关，否则使用默认on”。按字面，二者都会把本层显式配置归入默认值分支，例如本层off会被描述成none/on。

固定mail/ngx_mail_ssl_module.c488–489、503–504调用ngx_conf_merge_value；core/ngx_conf_file.h205–208明确仅conf为UNSET时才赋值，父层仍UNSET才用default，本层已有值保持。最小修正这两个inheritance.text为“本层有值保持本层；本层未设时继承父值，父子均未设才用none/on”，同时保留TLS启用及shm_zone独立继承限制。既有merge-default证据已包含真实调用，无需扩写其他17对象或重复补丁回放。该finding已确定先报主，Mail其余语义继续核验，当前尚不放行整份19。

## Mail SSL19逐义审核收口：仅R38待修，其余17通过（2026-10-13）

NOTES全文、19项正文/默认/继承/限制与245显式来源已核完；来源为195 Nginx、19活跃XML、31发行，注册及callback完整定义、真实EOF、来源引用有效。固定mail模块的listen/starttls条件创建SSL上下文、静态证书/key配对、配置期口令、协议/cipher/曲线/DH、verify非零下CA/trusted/CRL加载、session/ticket与后置SSL_CONF已逐项对照；没有HTTP/Stream动态证书编译和SNI虚拟server回调，未因共享SSL能力反推本域具备。

额外沿三协议读取STARTTLS/STLS入口、认证only检查及能力应答；SMTP清HELO/MAIL/RCPT和auth none的MAIL路径例外属实。mail_handler272–449/500–518闭合隐式TLS/升级共用握手、mail core timeout、成功后协议恢复及本协议证书错误；auth_http1177–1226/1393–1456闭合证书信息条件及原证书开关。共享SSL函数复用本轮已经逐义读取的固定源，不重读无变化研究。

与Stream同次独立临时34patch/142hunk/47最终SHA回放中，Mail195段为191保持、4变化，精确为starttls、certificate、key、session_cache的openssl.c1881–1942；三yield来源与最终分支吻合，宏条件异步支持未外推成Mail安装原生动态证书回调。目录已finally清理。除R38两个继承句外无其他待修；修复后只差异复核两字段及余17保持，无需重审19或重跑补丁。未根build或实际TLS/邮件/认证请求；按主要求下一步优先锁820正式129接入。

## R38最小差异复核：关闭，Mail SSL19完整准备放行（2026-10-13）

独立核MAIL_SSL_BASIC.json新SHA256 `9c0bbd1ff9cc025260b0da7fe01792250209a07d629fb7c01b98def857a911db`，NOTES R38段已读。仅cache及tickets两个inheritance.text改为本层已设保持、本层未设继承父层、父子均未设用none/on；TLS启用与shm_zone条件保留。内存恢复两个旧字段后精确重现完整旧SHA `a09cdf5f5f79238d69f3a7773e01f7caf5511327b3f2afc014718eb6681ff3ad`，其他17对象及所有来源保持。

新句与固定merge调用及宏205–208一致，R38关闭，Mail完整19按新冻结SHA准备放行；不算入本轮正式820。无新来源/补丁变化，不重复回放。继续优先完成820正式增量，随后iconv/encrypted/set-misc/memc/Redis/srcache；主另提verify-build-gate验收脚本修订尚待实际差异，不预判通过，不由本角色修改。

## 820正式129项接入独立审核：通过（2026-10-13）

锁定actualcandidate `1.27.1.1-513d4b289e7a100d`，current及版本index字节相同，SHA256 `f416b7aabfe7e35f3e6bee070b54217cf4dee5e64db84bb9b36d08df096b7606`。691历史index仍匹配 `5a61d6dddab2884a08daeaa496bf54bd0acf5baa492f31b167bb9bb6d5884d1f`。独立核knowledge末129按StreamUpstream6→NDK7→Lua67候选原顺序→HTTP SSL28修正版→Stream SSL21追加，所有冻结SHA一致；Mail19、Lua W07四项及其他候审均未混入。

实际读取analysis/LUA_CONTENT_REVIEW.md W01–W06放行身份，逐子集按原候选顺序重算并匹配：W01/12 b9f4f723…；W02/5 e5f7e46b…；W03/23 04bf7eb1…；W04/12 08e9dfae…；W05/7 7eed59ba…；W06/8 40ff9b1e…。67身份无重复、与本次其余62无交集；最新HTTP Lua稿虽已包含W07修复，六个已发布子集仍精确匹配既有独立放行SHA。本角色只核其集成，未冒称完成Lua逐义研究。

129个完整发布对象均独立重组比较通过：正文/语法、默认/继承/限制、availability及guards、contexts/phases、配置入口、documentation/mechanism/related、补丁状态、verification_notes及完整来源顺序。1572处发布来源固定revision/version、component/file、真实EOF、代码原文、URL行锚点及kind全部相等：Nginx582、docs55、发行318、NDK27、set-misc1、array31、form20、Lua538。R37本地file/在线issuer新句精确发布。

其余888详情仅排除release_id后完全相同，索引仅排除detail_path后保持；1017身份及顺序、8refs payload均保持。validatePublication读取真实产物通过；coverage文件及release_id相符，1017注册/820基础/197仅注册/0深度/8参考、inventory_complete=true。独立剥离发布信封重算摘要精确重现513d4b289e7a100d，current前后SHA保持。未根build、浏览器或HTTP请求；主通知的真实HTTP129及桌面展示属主验收记录，不作为本角色亲自执行。仅追加review。

后续待正式准备放行集合包括Mail SSL19新SHA9c0bbd1f…及Epicurus W07四项；其余逐义队列仍iconv3→encrypted5→set-misc29→memc11→redis2 11→redis8→srcache20。DB22、Lua与RDS16按主分工由Epicurus逐义审核，本角色仅按其放行证据负责后续正式集成。

## verify-build-gate冻结脚本审核：规范与需求均通过（2026-10-13）

核脚本SHA256 `7c6774e7250af80a1ae0be12c1391ee94ccf1515aeab414abca5087d2e57759d`。本次使用code-review技能的规范/需求两轴；根目录不是Git仓库，无可用旧脚本快照，不能声称已独立证明主所述最小行数差异。按用户明确的独立角色与写集约束，不新增子审核角色、不要求另设issue流程，直接审核冻结现稿与本轮具体需求。

规范：用户要求的最小作用域、中文新增注释、mkdtemp隔离与finally清理均满足，未见额外产品改动或抽象。根knowledge解析后仅改内存对象，临时config指向临时directives.json；analysis目录为真实临时副本，repos/site/src仅源链接，输出在taskDir/dist。没有对根current或源仓库的写入路径。

需求：findLast选目录中已有curated身份，不依赖仍有未研究指令；catalog和scope证据保持，availability.dependencies=null经发布详情校验触发“适用条件字段无效”，不是前置scope误拒绝。实际执行node --check及冻结脚本通过，确定拒绝 `nginx--ngx_http_core_module--no_error_pages`，临时current marker保持、knowledge输出目录只含原index，无release创建；临时目录finally清理。根820 indexSHA前后均为f416b7aa…，未运行根build。两轴各0个阻断finding；“旧版只改了几处”的历史差异未独立复现，不与当前行为通过混同。
## 892正式72项接入独立审核：通过（2026-10-13）

锁定actualcandidate `1.27.1.1-dc9685c374bbc170`，current与版本index字节相同，SHA256 `1a107771edb2539a243369de67fcbfae1e2d4ab0fdb7607db581975ac2b4930f`；820历史index仍为f416b7aa…7606。knowledge末72精确按HTTP Lua W07四项→Mail SSL19→Stream Lua49原候选顺序追加。三份完整稿分别匹配41329a44…bb72d7e、9c0bbd1f…57a911db、ca570630…1b2c50b。

实际读取独立LUA_CONTENT_REVIEW的W07及S01–S07完成记录，重新计算全部八个子集SHA并与记录完全相同，Stream七子集无重叠覆盖49；没有把Lua内容研究归为本角色工作。Mail R38两个继承修正精确发布。

72个完整详情独立重组比较通过，涵盖正文、语法、默认、继承、限制、availability/guards、contexts/phases、配置入口、文档、补丁声明、verification_notes及来源顺序。904处发布来源的固定revision/version、真实EOF、代码片段、URL行锚点、component/file/ID/kind均一致：HTTP Lua85、发行177、Nginx246、XML19、Stream Lua377。

其余945详情仅排除release_id后完整相等，索引仅排除detail_path后保持；1017身份和顺序及8refs payload不变。真实产物validatePublication通过，coverage与analysis文件及release_id一致，1017注册/892基础/125仅注册/0深度/8参考；独立摘要重现dc9685c374bbc170，current前后SHA不变。未根build、HTTP或浏览器操作。本结论只确认正式内容集成，不将尚余内容缺口及C03/Codex验收宣称完成；继续iconv等既有队列。

## iconv完整3项准备审核：通过（2026-10-13）

冻结ICONV_BASIC.json SHA256 `1c03caac60a073ad5e14d3be9eb7d369b331a6bde9290472ed5021661cf3702a`，NOTES全文已读。三身份精确覆盖ngx_http_iconv_module；43显式来源（iconv28、发行9、NDK3、Nginx3）EOF、配置callback及source_ids均通过。固定组件67d55c7e…完整模块/config及对应README已读，发行configure默认disabled、下载处理无直接patch相符。

set_iconv的593–694配置次序、三输入NDK表达式、空输入早返回、iconv_open及输出链复制，与只转换变量、不安装响应filter相符。buffer默认pagesize与merge716–743的父子0/1拒绝、E2BIG追加缓冲而非总内存限制相符。filter配置541–589保存字面编码名，header142–184与body188–242、链合并246–381闭合HTTP版本、Content-Length/in-memory、尾部保存及无MIME筛选；from/to/enabled独立继承，无off参数。转换385–526的EILSEQ替换、EINVAL停止和每次新建转换器已核，未将尾部尝试描述成任意截断/有状态编码的完整转换保证。

独立临时实际34patch/142hunk/47最终SHA回放通过，3个Nginx片段全保持，临时目录finally清理。完整owner3准备放行，无新增finding；未执行iconv/Nginx、配置编译或根build。

## encrypted-session完整5项准备审核：通过（2026-10-13）

冻结ENCRYPTED_SESSION_BASIC.json SHA256 `eeb6f34620bf0aa684c4bf5aa35e1588e87ad4c52cf98d9304bc6ed8a087af87`，NOTES全文已读。五身份完整覆盖ngx_http_encrypted_session_module。81显式来源（组件61、发行10、NDK6、Nginx4）真实EOF、callback、自动module-owner及来源绑定有效。

固定0f81b572…的module.c/cipher.c/cipher.h/config完整读取，README113–221及sanity20–120只读作第二信号。key239–263/merge394–425与32原始字节、NULL默认、重复拒绝相符；IV267–302及header19–22与EVP_MAX_IV_LENGTH、清零短值、固定deadbeefdeadbeef相符。expires306–327及cipher24–132/138–269与秒解析、86400默认、嵌入8字节时间、0不拒绝及非零<=now拒绝相符，不混Cookie期限或解密端重算。

两set真实NDK574–586允许省略输入、filter57–69绑定各函数，155–235区分缺key的NGX_ERROR与cipher失败的空值/NGX_OK；摘要前缀是明文与时间的MD5，后接AES-256-CBC密文，不称HMAC/JWT/Base64，也不将空结果等同认证通过。生命周期331–390实际库版本reset分支、NDK编译执行及rewrite挂接相符；未实际加解密或接触用户密钥。

同次独立临时34patch/142hunk/47最终SHA回放中4段Nginx全保持，发行无直接组件patch，临时目录已清理。完整owner5准备放行，无新增finding；两set继承仍保留未核实。主已明确892冻结直到最后125收齐，本两批8只作准备放行，不触发小批根build，继续set-misc29。

## set-misc完整29项准备审核：通过（2026-10-13）

锁定SET_MISC_BASIC.json SHA256 `bd9ef4c1de2fca2410218b7dbf8e5abd3b608d82c0a925d7de1126979c5d2d71`，NOTES全文已读。完整owner29与目录相等、与正式892无交集；463显式引用（set-misc237、NDK102、发行58、Nginx66）EOF、callback及各source_ids通过。固定31c4ad67…完整module/header/config与17个运算C文件已读，逐条核各发布证据覆盖实际实现，29段README语法/默认/phase及说明已读。

Base64四项分别核标准与URL安全表、padding、首=停止及模4错误；hex两项核偶数/大小写解析与小写编码；MD5/SHA1与HMAC两项核真实宏、32/40hex与原始二进制区别，HMAC真实TAKE3与两wrapper调用均闭合，不采README只给目标简写。URI两项核模块自有位图/状态机、type0、加号及非法百分号分支；SQL/PGSQL/JSON三项核空值''/null、高位字节、E前缀和内部UTF检测，未外推严格编码合法性或参数绑定。

if_empty核NDK先求两个输入与仅not_found/len0；hashed_upstream核字面/变量列表查找、空/单桶及小写键取模，不描述健康检查。Base32五项核32字节长度但非唯一性、merge只初始化字母表项、长度模8与首=、内部失败转空；旧padding的deprecated:true、真实flag写入后告警与新名共享槽一致。日期三项核缓存时间/时区、libc GMT/local及默认256缓冲、空格式与strftime失败；random/secure两项核端点交换、rand取模、1–64随机设备读取与模62/26；rotate核目标优先、空/无效回退、worker内location current及越界回绕。

实际注册、filter对象、NDK单/多输入配置编译和运行链及rewrite挂接对应；三个Base32配置字段继承核定，其余未知继承未擅自提升。独立临时真实34patch/142hunk/47最终SHA回放通过，66段Nginx均保持，目录finally清理。无新增finding，完整29准备放行，不等同运行Nginx/密码库/随机设备验证，未根build。

按用户最新明确分工，尚未开始的Redis2 11和Redis8移交Epicurus逐义审，本角色不重复；当前继续memc11→srcache20，最后负责所有通过稿正式集成核验。

## memc确定finding R39：memc_pass动态目标缺本条实际调用来源（2026-10-13）

锁定HTTP_MEMC_BASIC.json SHA256 `2b6355c73ad18e194993174b368d67574c1e227c819a7df76a9abfe6f8520a55`。memc_pass限制称变量目标使用port0、空目标/找不到组返回500，事实正确，但本条来源缺少handler180–206：现有dynamic-upstream仅util118–160的通用查找函数，不能证明调用者填port0或将NULL映射500；现有upstream-binding从207开始，method-selection止148，dispatch从236开始，均未覆盖实际分支。

已独立读固定b889a6fc…的src/ngx_http_memc_handler.c180–206：180–187求复杂值，189–192空目标500，195–199设置host/port0/no_resolve并调用查找，201–204找不到组500。请仅在memc_pass新增此片段并绑定limitations[0]和patch_status.source_ids；正文无需变，其他10对象无需改。修后冻结SHA可最小差异关闭，当前先不放行整份11，继续核收尾及srcache，不等待修复停工。

## memc11逐义收口：其余10通过，仅R39待补（2026-10-13）

NOTES全文及108显式来源已核，63组件/25发行/20Nginx；真实EOF、callback和绑定有效。完整模块、handler、util及config已读，request18–105与编译用response.c的simple/get实际路径、README指令章节对照完成。cmds_allowed小写12命令、声明重建列表/父层继承、未知400/禁用403相符；pass静态/变量及存储值优先级事实相符，完整继承保留未知，只有R39本条证据缺口。

三timeout默认60s及非总时限、buffer页大小/get首行与非get整响应/INVALID_HEADER、next_upstream掩码和POST/LOCK/PATCH已发出后NON_IDEMPOTENT限制、simple错误502但NGX_OK区别，均已核共享真实消费。两旧upstream指令直接NGX_CONF_ERROR而非忽略参数；flags转Last-Modified与条件304、ignore_client_abort受控检查但非后台必达保证符合源码。只用实际注册context，不沿用README的更宽范围。

独立临时34patch/142hunk/47最终SHA回放通过，20段Nginx为16保持、4变化，精确对应connect1660–1669、send2113–2150、read2174–2187及3797–3815。timeout_fields原补丁全文及回放后配置复制/各计时分支已实际读取，affected声明准确；目录finally清理。没有实际memcached请求或根build。除R39外无新增finding，补单片段后可完整放行11，不必重审其他10。

## R39差异复核：关闭，memc11完整准备放行（2026-10-13）

新SHA256 `64551fde252454f0be5a110be82b67a68c1fa08d48696a22a96f1d6116061858`实核匹配。仅memc_pass新增dynamic-upstream-call，固定handler180–206，与上节已实际读取的port0/空目标及缺组500分支一致；limitations[0]与patch_status均新增绑定。内存逆移除该来源及两绑定，精确重现旧完整SHA `2b6355c73ad18e194993174b368d67574c1e227c819a7df76a9abfe6f8520a55`，正文和其他10对象不变。NOTES R39段已读。新来源属于无直接patch的组件代码，沿用刚完成回放，不重复整批；R39关闭，完整11准备放行，892正式未改。继续srcache20。

## srcache20逐义审核：18项通过，R40两项补实际输出片段（2026-10-13）

锁定HTTP_SRCACHE_BASIC.json SHA256 `c739a67a4554015908185d230cde4b612e6c6cf9fc9e52415fdb3cad305f7b72`，NOTES全文已读。20身份完整覆盖owner、与892无交集；173显式来源（组件116、Nginx17、发行40）EOF、callback及绑定通过。固定be22ac0d…完整module/fetch/store/util、var有效期及config六C输入已读，对照README486–985；未运行Nginx、缓存后端或根build。

buffer的buf_size在固定C源检索仅注册67/初始化271/合并305，实际头解析header_buf_size与按输入长度复制相符；header_buffer每行重置、截断溢出放弃命中相符。fetch/access末尾重排、非200与截断处理；store末尾提交、HEAD排除、两次skip、max_size预判+累计头体长度、statuses默认五值与0终止、methods必加GET/HEAD均核实际分支。请求单独no-store未触发分支、响应private/no-store/no-cache各自放宽及max-age/Expires、Content-Encoding开关、200后转206的ranges、hide/pass名称匹配/默认九头/不改客户端副本、有效期仅计算变量而非设置后端TTL，均与草稿一致。显式空字面args误清location、若干flag/hide/pass/ranges无LIF与README差异均已明确。

独立临时34patch/142hunk/47最终SHA回放通过，17段Nginx全保持；组件无直接发行patch，临时目录finally清理。正文没有确定事实错误，但两条主功能缺本详情的实际输出片段，记R40：

- srcache_fetch：现有access仅25–59和199–239，fetch-completion仅完成标志/错误检查，fetch-response仅设置解析及from_cache标志；缺命中后把缓存体交下游的真实分支。新增src/ngx_http_srcache_fetch.c132–188，已实读其中158的send_header、173的output_filter(body_from_cache)与182–185完成请求。无需修改正文。
- srcache_store：serialized-header866–897仅函数入口、长度计算及status_line选择，header-body-chain1120–1140仅将已建buffer挂链；缺实际写入状态行和响应头的序列化段。新增src/ngx_http_srcache_util.c1025–1112，已实读HTTP/1.1前缀、状态行、Content-Type/Last-Modified及普通头复制。其他指令详情中的header-output来源不能替代本条闭合。

两项各新增来源并接limitations[0]/patch_status.source_ids即可；不要求扩展正文、重做其余18或重复无变化补丁回放。R40待差异冻结复核，旧整份20暂不放行。当前已过准备集合为iconv3、encrypted5、set-misc29、memc11修正版，共48；用户已转交的Redis19及Lua/RDS/DB由独立review负责，本角色仍负责最终正式接入。

## R40差异复核：关闭，srcache20完整放行并交回最终构建窗口（2026-10-13）

实核HTTP_SRCACHE_BASIC.json新SHA256 `8e6d7478978a4c8f54584502e6798565b3192856d6a570925faf801d0a0650ab`。仅fetch新增cached-body-output（fetch.c132–188）、store新增serialized-header-output（util.c1025–1112），各自limitations[0]及patch_status.source_ids有绑定；NOTES R40段已读。两片段按固定be22ac0dcd9245aadcaca3220da96a0c1a0285a7独立再次读取，真实EOF有效，分别包含send_header/output_filter/finalize及状态行、特殊头和普通响应头实际复制，补齐R40缺口。

内存逆移除两来源及四处绑定后，与审核前完整数组deepEqual，规范JSON字节精确重现旧SHA `c739a67a4554015908185d230cde4b612e6c6cf9fc9e52415fdb3cad305f7b72`。正文、其他18对象及原来源全部保持；没有新增Nginx引用或组件补丁变化，沿用上一节实际34/142/47回放，不重复全批。R40关闭，srcache完整20准备放行。

本角色最后五owner共68项均已准备放行：iconv3（1c03caac…）、encrypted5（eeb6f346…）、set-misc29（bd9ef4c1…）、memc11修正版（64551fde…）、srcache20修正版（8e6d7478…）；完整SHA见各节。其余57项以Epicurus独立review的实际放行身份及SHA为准，不冒称本角色逐义研究。交回主最终1017构建及C04窗口；构建和最终验收尚未执行，不将准备放行当成正式完成。

本次只追加review，根892 indexSHA核验前后仍为 `1a107771edb2539a243369de67fcbfae1e2d4ab0fdb7607db581975ac2b4930f`，未修改草稿/knowledge/current、未根build。按用户要求本轮结束，待主发送冻结actualcandidate后执行最后125正式接入审核。

## 最终1017正式125项接入独立审核：通过（2026-10-13）

锁定actualcandidate `1.27.1.1-eeabda4eba7f5c16`。独立计算current index SHA256为 `961e1ad50943cd57abbb5847d0aae800d1bfce4e4f886e8f2a016c1a8c358d6d`，与主补交值及版本index字节一致；892历史index仍匹配1a107771…4930f。knowledge末125按ICONV3→ENCRYPTED5→SET_MISC29→MEMC11→REDIS2 11→REDIS8→SRCACHE20→RDS_CSV6→RDS_JSON10→DRIZZLE12→POSTGRES10精确等于十一份冻结数组。每份完整SHA与实际独立review放行值一致，无重复、漏项或提前混入项；主此前SET_MISC读取截断未造成最终数据差异，不认定为产品发布失败。

实际读取Epicurus的R03/R04、D01/D02、E01/E02与授权队列收口：RDS16使用195c629c…及2d2465ab…修正版，DB22和Redis19均按全文SHA放行，L-R01至L-R06已闭合。本角色五owner68及其R39/R40修正沿用上节逐义结论，其他57只核独立放行证据与集成，不冒称重复源码研究。

125个完整发布详情均独立重组、逐字段deepEqual通过：功能/语法、默认/继承/限制、availability及编译guard、context/phase、配置入口、文档、机制/相关项、补丁声明、核验说明及全部来源顺序。1684处发布来源逐段从固定Git读取，version/revision、真实EOF、原文、URL行锚点、ID/component/file/kind一致；分布为发行370、Nginx169、NDK111、iconv28、encrypted61、set-misc237、memc64、Redis2 86、Redis53、srcache118、CSV52、JSON88、Drizzle125、Postgres122。R39/R40新增片段及RDS补证据完整进入发布。

其余892详情仅排除release_id后完整相等，索引仅排除detail_path后保持；1017索引身份与顺序、8refs payload保持。真实全量validatePublication通过，analysis/coverage与release一致；独立按全部详情去除发布信封、参考及coverage重算摘要精确重现eeabda4eba7f5c16。读取前后current SHA保持。本角色未运行根build、全套npm test、HTTP或浏览器，不混淆主执行归属。

## C02全目录基础内容完整性：通过（2026-10-13）

按WEBSITE_COMPLETION_PLAN的C02判据及C02_REMAINING_CONTENT_PLAN最终差集要求核定，而非只看总数。catalog、knowledge及正式index三者的完整component/module/name身份集合完全相等且唯一：1017身份、123个component/module owner、21个有注册项组件；其中Nginx726、第三方291。validateCatalogScope对真实目录/范围矩阵通过，scope_complete及全部组件inspection满足既定C01条件，inventory_complete=true；沿用已通过C01，不重研旧范围。

全1017项均basic_verified，无registration_only、无缺失正文/语法/已核context/配置入口/补丁结论。全部knowledge正文、语法、callback符号、编译guard与发布逐项一致；显式callback定位逐字段一致，29个旧自动定位入口由既有正式审核与本次旧详情保持证明延续，不强行要求旧输入改格式。默认/继承/限制及patch按实际prepareKnowledgeFacts规范化后与发布全量相等，兼容早期字符串限制及配置中组件patch默认，不把旧输入表示差异误报成发布漂移。

补丁状态106项verified_affected、911项verified_unaffected，无unverified；受影响项实际patch来源与已核逐事实证据沿用各批审核及门禁。可未知字段仍如实保留：240项默认、327项继承为unverified；没有未核限制对象。它们属于计划允许的补充未知，不伪造确定性，也不等于必需基础内容缺口。既有逐批准备、修复和正式接入记录连续覆盖旧892，本次125补齐最后差集；R07–R40相关finding及Epicurus L-R01–L-R06均已在对应差异/正式窗口关闭，无遗留必需内容待修项。

结论：C02全范围基础内容及最终125正式接入通过。实际1017注册/1017基础/0仅注册/0深度/8参考；coverage只保留部门脱敏样例与Codex宿主/内网可达性缺口。C03未开始正式深度验收，C04最终回归和静态交付仍待主最后材料，不由C02通过自动推定整站交付完成。

## 最终计数测试适配审核：规范与需求通过（2026-10-13）

实核test/knowledge.test.mjs SHA256 `dac860a98b718b5e4afd49a11f1154ccef43a61d1317c3a0dc06ade25e361989`。按code-review技能分别核规范与需求；依用户既有独立角色和最小写集不新建子角色，根目录非Git且无本次旧测试快照，不声称已证明完整文件只改两行。

规范：目标两条断言使用真实index集合动态计数，无1017硬编码、无产品改动或额外抽象；0个阻断finding。需求：registration_count等于directives.length，basic_verified_count等于verification非registration_only数量，与build和validateIndex既有basic含deep语义一致，既适用于部分完成也适用于全量；旧basic<registration已不适用最终全量。scope_complete关联检查仍在，来源/字段/坏数据门禁未由这两条计数断言替代；0个阻断finding。

本角色实际运行目标计数用例1/1通过，current SHA不变。主报告旧全测83/84及修后84/84、真实HTTP1017、桌面矩阵和隔离门禁，执行归属为主；全测/浏览器不计为本角色重跑。C04独立材料收口另记。本轮唯一永久修改为追加本review。

## C04最终交付材料独立核验：产物与回归通过，R41文档状态待最小修正（2026-10-13）

已完整读取README、REQUIREMENTS、IMPLEMENTATION_PLAN及verification顶部最终矩阵，按既定C04判据收口，不重复旧逐义研究。最终current与不可变版本index字节一致，SHA256仍为 `961e1ad50943cd57abbb5847d0aae800d1bfce4e4f886e8f2a016c1a8c358d6d`。1017详情及8refs实际加载后validatePublication通过，版本详情目录精确1017文件、无index.next.json；全部详情、参考及coverage独立重算发布摘要仍为eeabda4eba7f5c16。此前最后125集成及C02结论保持。

静态交付独立核验通过：站点及运行依赖共11文件与dist副本逐字节一致，site-config与真实配置相等，9处本地JS相对导入目标存在。28个历史发布索引保留，另实际核892/820/691旧发布的详情与参考路径均存在。构建复制路径、限时预览脚本及package脚本已读；README完整dist托管、HTTP打开、Node版本、loopback限时预览及保留历史发布说明与实际相符，无需新增产品代码或再次build。

主最终实测记录覆盖84/84、1017真实HTTP完整详情和事实、两隔离门禁、query-ui/query-ui-async/website/accuracy四组现有桌面流程，以及组合筛选、Redis/CSV/Drizzle限制、events三候选与详情。记录明确注入finally移除、截图查看后清理和静态GET边界；这些执行归属为主，本角色只审核材料与静态产物，不冒称重跑浏览器、HTTP或完整npm test。计数测试文件SHA保持dac860a9…361989，沿用上节独立适配审核。

R41（文档一致性）：两份当前状态头仍沿用旧结论，与其正文及已通过C02冲突。REQUIREMENTS.md:3仍称“全量知识与现场Codex接入尚未验收”；IMPLEMENTATION_PLAN.md:3仍称“全量内容与现场接入未完成”。请只修正这两行，明确全量基础知识已独立通过、C04正在最终收口，同时保留部门深度、Codex宿主及部署未验收边界。无需重研内容、改产品或build。

除R41外未发现新增阻断。当前不能无条件将C04标为完成，也不能仅改原计划两处“待独立收口”而留下上述矛盾。主修两行后交差异即可关闭R41；随后可将IMPLEMENTATION_PLAN的M5网站状态及当前发布段落更新为网站C04独立通过，并同步verification的待收口文字。M5双入口整体验收、C03及本轮排除项继续保持未完成。审核本轮仅追加review，未改任何产品、草稿、知识、测试或交付文档，未根build。

## R41差异关闭及C04最终独立收口：通过（2026-10-13）

实际重新读取REQUIREMENTS.md及IMPLEMENTATION_PLAN.md第3行，与上节保存的旧行对照：日期均更新为2026-10-13，前者明确全量基础知识已独立通过，后者明确C01/C02独立通过；两者均将网站状态置为C04独立收口中，并保留部门深度、Codex宿主及内网部署未验收。旧“全量知识尚未验收／全量内容未完成”的矛盾已消除，R41关闭。本次核验为两行目标差异，不声称对无快照的整个工作区完成逐文件差异证明。

独立重新计算current index SHA256仍为 `961e1ad50943cd57abbb5847d0aae800d1bfce4e4f886e8f2a016c1a8c358d6d`，对应冻结发布 `1.27.1.1-eeabda4eba7f5c16`。沿用上节已完成的最终产物、静态交付及主实测材料审核，不重复根build、HTTP、浏览器或测试。最终125正式接入、C01/C02及全部相关finding闭环结论保持，无剩余阻断项；C04最终独立审核通过。

允许主仅同步收口状态：两份文档头部的“C04独立收口中”、IMPLEMENTATION_PLAN的M5网站状态及当前发布段、verification的待独立收口文字，统一改为C04独立通过。不改变既有交付边界、不修改产品或重建发布；M5双入口整体验收不能随网站状态一并标为完成。

最终结论：本轮通用网站开发、全发行版配置范围及基础知识静态交付完成，1017注册／1017基础／0仅注册／0深度／8参考。部门正式深度验收待样例；Codex宿主接入、内网部署及OpenResty编译运行均不属于本轮已验收范围。主执行的84项测试、真实HTTP及桌面矩阵与本角色独立审核归属保持明确。本轮唯一永久写入为追加本review。
