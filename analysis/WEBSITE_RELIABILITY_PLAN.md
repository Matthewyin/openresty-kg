# 网站可靠性修复与状态同步计划

日期：2026-10-14。规划：Astra low，沿用已确认模型；本规划子Agent仅写本文。主线程负责startup、UI、docs、集成测试、build与浏览器；Sol仅负责parser及对应测试；审核者独立按本文审核，问题退回对应责任方修正后复核。

## 深度交互：目标、基线与边界

本轮修复三个已指明的可靠性缺陷，并使页面、README、需求和旧计划正确说明已完成范围。不扩大为知识批量补证、全站deep化或现场验证。采用主线程确定的最小状态方案：不新增schema、不写JS六项硬编码名单、不改knowledge，不按dependencies存在与否推导verified。

当前基线为 `1.27.1.1-1c2ead24459672e6`。本次只读索引确认1041 basic（包含deep）、44 deep，bundled1017/40、department_extension24/4。`SAMPLE_FINAL25_RUNTIME_VERIFICATION.md`与REVIEW最终签署记录25项、126步限定runtime及页面验收完成，89项定向、247项全量通过；这些是历史结果，本轮测试另记，不复用历史数字冒称实测。

样例50身份已完成44项限定运行时内容和6项C1配置边界。无runtime不自动代表漏做；基础等级不保证每个事实字段均已核实；deep只证明条目明确列出的范围。源码事实与现场版本、模块启用、兼容性、外部include及真实请求结果分开表述。

本轮排除Codex宿主接入、手机、现场部署与性能验证。规划、实施及审核子Agent不读取私有样例；回归使用人工最小夹具，不复制原配置。知识340项补证仅列后续分组，不改其状态或宣称已逐项研究。

## 直接执行：三个缺陷与最小验收

| 项目/责任 | 实施边界 | 完成判据 |
| --- | --- | --- |
| R1 literal `${pid`字面路径 / Sol | 修复 `src/core/parser.mjs` 的token逻辑。当前遇`${`会搜索闭合`}`并直接拒绝；须依据固定nginx `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928:src/core/ngx_conf_file.c` 的`ngx_conf_read_token`分隔/variable状态规则处理，不能把词法读取误当变量表达式有效性校验。 | 人工夹具 `pid /tmp/${pid;` 可形成一个完整pid指令，参数保留 `/tmp/${pid`；有闭合`${pid}`、引号、转义、分号与紧邻真实配置块的回归不破坏。验证raw_args、参数、位置与后续指令；不声称此路径一定可创建或现场有效。先重现再最小修复，预期以固定源码确认。 |
| R2 Lua `\z`跨行 / Sol | 修复luaEnd短字符串扫描，按固定LuaJIT `33d6b04681d2f079a6d013988a426a841c52e29e:src/lj_lex.c:248–252`处理`\z`后空白。只定位Lua块边界，不增加Lua解释器或执行代码。 | 单/双引号、LF/CRLF、连续空白及固定实现支持的其他空白覆盖；字符串中的花括号不改变块深度，块后指令及行列位置正确；`\\z`不能误当`\z`，普通未转义换行和真正未闭合字符串仍报错，长字符串/注释既有行为保持。 |
| R3 examples异常阻断start / 主 | `site/app.mjs`现将examples读取/JSON处理置于目录渲染及ready之前。将其限定为可选资源失败，目录、查询、永久详情和参考入口正常初始化；只在examples边界处理读取/解析/结构异常，核心配置/索引错误仍走原失败路径。 | examples正常、404、请求拒绝、无效JSON、错误顶层结构/条目字段均有覆盖；异常不会清空已加载目录或阻断查询/深链接/ready，不泄露未处理异常。给局部简短提示；不以吞掉整个start错误实现降级。对停滞请求使用已有超时能力或使其不阻塞核心初始化，不引入额外重试框架。 |

三个项目均须先保存可复现的失败断言或浏览器观察，再记录修后通过；测试验证行为，不只匹配实现文本。不调用现场Nginx/Lua执行私有配置。

## 页面与文档最小状态方案（主线程）

1. 所有无runtime详情统一中性说明：“未提供独立运行时链；配置组织类条目不据此判为未完成，具体范围见功能/配置入口”。不为六项创建JS身份名单，不新增状态枚举或知识字段，也不将其他无runtime条目一概宣称完成。
2. 基础徽标旁解释“基础说明已覆盖，不等于默认值、继承、适用条件等每个字段均已核实；以字段状态和引用为准”。deep明确“仅所列运行范围已核实”，保留既有步骤、来源和现场边界，不泛化为所有功能/平台/协议已验证。
3. availability.status保持原值，显示文字说明源码依据与现场启用是不同判断；dependencies仅作依赖说明，存在依赖不自动转verified。保留未知信息，不使用全局文字替换掩盖未核字段。
4. `project.config.json`的`sample.pending`只删除过时的“部门深度待核”片段，保留现场版本、模块安装等未知；不得整体清空gaps。正常build据此产生新release，不手改dist、冻结历史目录或知识内容。
5. 更新README、REQUIREMENTS.md、IMPLEMENTATION_PLAN.md的当前状态；在`analysis/WEBSITE_COMPLETION_PLAN.md`、`WEBSITE_REMAINING_PLAN.md`、`SAMPLE_REMAINING_RUNTIME_PLAN.md`等仍显示旧总状态的入口加明确当前结论与最终验收链接。历史数量和失败过程标为历史，不重写成当时已通过，也不修改既定需求目标。页面从当前索引展示数量，不硬编码44替代实际数据。
6. 六项C1完成事实在README及上述计划当前状态中统一列明，指向`SAMPLE_CONFIGURATION_BOUNDARIES.md`：`nginx--ngx_conf_module--include`、`nginx--ngx_events_module--events`、`nginx--ngx_stream_module--stream`、`nginx--ngx_http_module--http`、`nginx--ngx_stream_core_module--variables_hash_bucket_size`、`nginx--ngx_http_core_module--variables_hash_bucket_size`。它们保持basic且无runtime，配置组织/构建范围已收口，不计为六个待补运行时任务。不得把全部basic等同C1分类。

## 集成保护、分工与验收

Sol仅交parser最小补丁、对应测试、固定源码依据及实际结果，不触碰startup/UI/docs/config/knowledge/dist。主线程持有其余写入，避免同时改同一测试文件；独立审核只审与落盘审核记录，不代替实施或用主测试通过代替源码判断。

1. 主先冻结当前knowledge及历史1c2ead索引/详情摘要。历史final25测试固定读取1c2ead及对应历史期望，保留原25项来源、逐步语义、旧字段和44deep集合检查，不因新release改变放宽断言。
2. 新增当前发布保护：逐条对1041完整详情、索引全部键及顺序与1c2ead比较。先核每条真实release_id和current索引与同release冻结索引一致，再仅放行正常release_id、detail_path及实际发布路径，以及由`sample.pending`精确删除过时片段派生的gaps变化。保留其余现场未知文本、coverage数量/组别、schema、身份顺序、sources、runtime、availability和全部旧事实。不得整段豁免coverage或gaps，不先覆盖实际字段再比较。
3. knowledge文件摘要必须不变，basic/deep仍1041/44且精确身份集合与1c2ead一致。负例至少验证：改一条availability.status、删现场未知gap、变runtime/source、改计数或残留旧release_id均被拒绝。
4. 主统一集成后执行parser定向、启动/状态显示定向、受影响历史专项及全量测试，正常build新release；按测试依赖顺序在构建后核当前发布。修订产生新版本时同步复验受影响项，最终测试记录绑定实际代码/构建摘要及release，不要求每个小补丁构建。
5. 主浏览器验收绑定同一最终release与实际构建资源：正常启动与examples异常状态均可查询、打开目录/永久详情；输入R1/R2人工夹具得到预期结果；检查基础、deep和无runtime三类显示，逐个打开六项C1确认没有假待办；对照availability原值及现场未知说明。构建资源摘要与服务内容一致，不能仅凭页脚或HTTP200宣布页面验收完成。
6. 主落盘 `analysis/WEBSITE_RELIABILITY_VERIFICATION.md`，审核落盘 `analysis/WEBSITE_RELIABILITY_REVIEW.md`：逐项R1/R2/R3、状态同步、1041保护、测试/build/browser结果与证据归属。独立审核检查固定源码、回归判据和白名单；遗漏退回责任方修复并复核。测试、页面或文档同步尚缺时不宣布本轮完成。

## 后续340项事实补证优先分组（不在本轮实施）

340为本次输入的补证规模，不等于340条已逐项诊断或340个必须晋级deep的对象。后续先从实际未核字段生成精确身份/字段差集、去重并核数；本规划不预填每组数量、不伪造逐项结论。每个身份可有多个未核字段，任务数与身份数分别统计。

| 优先级 | 分组建议 | 后续验收单位 |
| --- | --- | --- |
| P1 | 影响配置决策的默认值、继承、上下文与取值限制；优先已有样例身份及其直接关联项 | 精确身份+未核字段，固定配置回调/合并代码、独立文档和适用补丁；不以现有runtime代替字段证据。 |
| P2 | 平台、条件编译、模块依赖、废弃或不支持分支 | 区分源码支持条件与现场是否启用，证据不足继续unknown。 |
| P3 | 同模块共享机制较多的HTTP/stream代理、日志、连接与输出条目 | 小组复用读取路径，但逐身份记录差异和失败边界，不能批量复制verified。 |
| P4 | Lua及其他第三方扩展、低频模块的剩余事实 | 先冻结各组件revision及发行归属，再按字段补证；需要runtime时另列限定范围，不以1041deep为目标。 |

以上仅建议排序；领取每组前核实真实差集和证据需求，再冻结小组清单、实施与独立审核。本轮不修改340项知识状态。

本规划本次仅新增本文；未修改parser、测试、网站、config、知识或dist，未运行测试/build/browser，未读取私有样例。已只读核对当前索引、final25完成记录、C1记录、相关代码及固定nginx/LuaJIT片段；未声称三个缺陷已修复或后续340项已完成研究。
