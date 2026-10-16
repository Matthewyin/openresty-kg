# 部门扩展模块接入计划：VTS

2026-10-13。状态：规划就绪，供实施启动；本文不表示实施或审核已通过。

## 深度交互：目标与边界

在既有 OpenResty 1.27.1.1 固定发行目录之外，配置驱动追加部门使用的第三方模块。复用采集、基础知识、匹配、静态 JSON、网页与源码证据链，不建立第二套查询系统。固定发行范围与部门扩展分别统计、分别证明完整性，不能把扩展收录解释为发行版自带或现场可用。

已读取 project.config.json、scripts/inventory.mjs、scripts/build.mjs、scripts/registration-build.mjs、src/core、src/query/knowledge.mjs、site/app.mjs 及 REQUIREMENTS.md 相关契约。现行发布为 `1.27.1.1-eeabda4eba7f5c16`，固定目录 1017 项、基础 1017 项、深度 0 项。当前配置的 sources 必须与发行矩阵对应；build 对 distribution-version 的生成存在发行脚本硬依赖；matcher 与知识客户端分别校验计数；网页和 Markdown 当前把 OpenResty 版本直接展示为条目版本。这些是本轮必要改动点。

本批只接入官方 `https://github.com/vozlt/nginx-module-vts`，固定 commit `52fe11e44c47a49b052be89e36dfa17d81bf52a5`，本地 `repos/nginx-module-vts`。主线程已核对来源并确认现有 extractCommands、reviewRegistrationBuild 可直接支持 24 项，实施复用其结果，不改构建解析器。模块头 v0.2.7 仅为源码声明，发布身份必须写“commit 快照”，不能冒充稳定 tag。现场版本、安装情况和与 OpenResty 的运行兼容性均未知。

本批完成标准是 24 项基础内容及共用链路通过审核，不是部门深度验收。STS、其他第三方模块、全量运行调用图、OpenResty 编译运行、现场探测、Codex 真实接入、手机验收、部署、DB/RAG、自动追踪 latest 和无关重构均不在范围。

## 直接执行：最小架构约束

### 1. 配置与盘点

- 在项目配置中设置独立扩展来源集合，默认空集合保持原流程；字段命名由实施选最小方案。至少包含 component、本地 path、官方 repository、完整 revision、快照版本标识及 registration_build 入口，按需沿用 registration_inputs。VTS 名称、路径、commit 不硬编码到业务逻辑。
- 原 sources、发行矩阵、补丁审计保持发行语义。扩展组件与注册结果单独分组或单独输出，再在发布阶段合并；不得把 VTS 塞进 mirror-tarballs 推导出的发行矩阵。完整性依据正式构建入口、owner/commands 和注册集合，而不是 README 条目数。
- 从固定 Git 对象读取源码及文档，核对 repository/revision，检查组件和完整身份冲突。缺源码、错版本、重复身份、范围证据不闭合时失败，不静默跳过扩展后宣布完整。inventory/build 不自动联网更新来源，不执行模块 config。

### 2. 发布与来源契约

- 保持 `component--module--name` 身份与现有详情路径方式。发布条目和索引必须携带可校验的发行/扩展来源标识；扩展同时记录固定 repository、revision、快照版本及现场状态未知。来源不能仅写在说明文字里。
- 顶层 registration/basic/deep 计数仍与实际合并索引一致，首批完成预期 1041/1041/0；新增分组计数表达发行 1017/1017/0、扩展 24/24/0。计数由数据计算，预期数只用于本批验收断言。发行 inventory_complete 继续由原发行证据独立计算；扩展完整性另算，界面明确二者分母。若保留顶层 inventory_complete，明确定义为整个已配置发布集合的范围完成状态，不能拿它冒充固定发行状态。
- schema 字段和组织由实施选择最小实现。若改变既有字段含义或引入旧客户端无法正确理解的状态，使用新 schema 版本并同步消费者；新版仍读取历史 schema 1 发行发布。不要让旧客户端静默把扩展解释成发行组件。校验覆盖 matcher、知识客户端、发布器及实际使用这些字段的输出路径，索引与详情来源必须一致。
- build 只对发行条目生成 distribution-version；扩展引用自身固定 config、注册、callback 和文档，不伪造 OpenResty 发行来源行号。保留已冻结历史发布，新内容生成新 release_id，失败不替换 current；来源及覆盖信息纳入发布身份计算。
- 增加真正的补丁 `not_applicable` 表达：仅适用于本批作为独立上游快照研究的扩展，含说明与固定来源证据；含义是“不属于本知识库的发行补丁处理范围”，不是“现场无补丁”或“兼容已核实”。禁止冒充 verified_unaffected。发行条目不能借此绕过原补丁校验。basic 及已核实事实门禁相应区分发行补丁结论与扩展上游快照事实；两者均仍要求真实注册、定义及事实证据。

### 3. 内容、查询与展示

- 逐项补全 24 项功能、语法、context、配置回调真实定义、编译条件、依赖和所列限制的固定源码依据。默认值/继承等确实无法核实则标未知，不能靠统一模板凑齐 basic。源码已注册而 README 目录未列的两项 `vhost_traffic_status_measure_status_codes`、`vhost_traffic_status_ignore_status` 依据代码研究并标注文档缺口，不遗漏，也不写成文档已验证。
- callback 使用 Nginx 通用 setter 时沿用显式跨组件定义证据，标清该证据版本；这不是运行兼容性证明。README 与源码有冲突时记录差异，以固定实现说明研究范围，不引用 latest 补结论。
- 目录条目、输入匹配候选、详情、JSON 和 Markdown 均可辨发行或扩展。详情显著显示“部门扩展 / commit 快照 / 现场版本与安装情况未知”；OpenResty 1.27.1.1 只表示知识站发行基线，不充当 VTS 版本。沿用原筛选与导航；无需额外管理页或新的查询算法。
- 未收录指令保留 unknown；语法错误保留 parse_error，context 不足或不符继续分别提示。语法解析和知识命中不等于 nginx -t，不因出现 VTS 而推测已安装，更不能把 HTTP VTS 自动匹配到 stream。
- 更新“部门真实脱敏样例待提供”的旧 gap 为“已收到部门配置样例；现场版本/模块安装信息及部门深度验收待核实”。不把样例到场写成深度已通过，不在公开产物复制真实配置中的地址和业务信息。

## 阶段、责任与完成判据

| 阶段 | 实施任务 | 可审核完成条件 |
|---|---|---|
| E01 来源与分组盘点 | 消费主线程已冻结的 VTS 来源证据；增加配置与独立扩展盘点 | 24 个完整注册身份及正式构建证据闭合，发行 1017 身份/范围证据不变；错来源与重复配置被拒绝 |
| E02 构建和基础内容 | 处理来源/补丁分支、计数与契约；补 24 项知识 | 24 项全部满足 basic 必需内容；源码/文档差异有记录；发行原字段的事实语义不变；发布校验通过 |
| E03 共用输出 | 接通来源展示、历史读取、查询和 gap 更新 | 桌面目录、候选、详情、JSON/Markdown 含一致来源与边界；未知与语法错误不混淆 |
| E04 审核与交付 | 独立审核按下表验证；主线程验收最终发布 | 问题退回实施修正并复核，最终固定 release 和测试记录对应；不把计划状态当通过状态 |

主线程负责来源版本核对、冻结基线与最终验收，实施负责 E01–E03 及自检，审核负责独立逐项核对并出结论。沿用已确认的规划 Astra low、实施 Sol high、审核 Astra low。规划仅编辑本文；实施和审核各自记录实际结果，不在本文伪造通过。实施同步修订 REQUIREMENTS.md 的 Q5 与相关交付口径，明确最新授权追加扩展而非推翻发行锁定规则。

## 具体验收用例

| 编号 | 输入或检查 | 预期 |
|---|---|---|
| A01 发行保真 | 比对旧发布与新发布中发行子集；去除 release 路径和新增来源元数据后核对原知识字段 | 原 1017 身份、context、事实、证据与核对状态无无关变化；发行完整性仍独立成立 |
| A02 扩展完整性 | 固定 config → 正式源 → owner/commands → 采集目录 → 24 份详情 | 集合逐项相等，不仅总数相等；两项 README 未列命令仍存在；来源均绑定固定 commit |
| A03 现场常用四项 | `http { vhost_traffic_status_zone; vhost_traffic_status_filter_by_host on; server { location /vts_status { vhost_traffic_status_display; vhost_traffic_status_display_format html; } } }` | 无解析错误；四项均唯一匹配 VTS 正确 context；候选与详情联动，不显示遗留 Lua 条目 |
| A04 上下文边界 | 单项 `vhost_traffic_status_zone;` 无 context；同项指定 http；放入 stream | 分别 context_required、matched、context_mismatch；不猜测外层或现场环境 |
| A05 未知与语法 | `http { future_extension_probe on; }`；另输入缺右括号的 VTS 片段 | 前者语法解析成功但 unknown；后者真实解析失败；两者均不显示无关成功详情 |
| A06 分组与输出 | 查看总览、目录、候选、详情、静态 JSON、共用 Markdown | 总 1041，发行 1017、扩展 24，deep 0；各输出可辨来源、commit 快照及现场未知；not_applicable 不显示成已核对无补丁影响 |
| A07 负例 | 错 revision/origin、重复 component/identity、错索引详情来源、错误分组计数、发行项冒用 not_applicable | 相应门禁拒绝；失败不替换 current，不修改已冻结发布 |
| A08 可重复与历史 | 相同输入构建两次；读取旧 release；临时配置不含扩展再构建至独立测试输出目录 | 相同输入发布稳定；旧 schema 1 仍可查；无扩展配置恢复只有发行集合，不携带残留扩展条目 |
| A09 新增流程 | 使用隔离的最小固定测试模块/来源配置验证通用接入，不公开发布该测试模块 | 无需在业务代码增加组件名判断即可进入同一采集、构建与查询路径；失败可定位配置或证据缺口 |

执行与改动相称的 inventory/build、相关自动测试及完整既有测试；新增公共契约要回归现有 MCP 序列化/查询测试，但不要求真实 Codex 接入。主线程复用已授权桌面验收空间，以最终发布执行 A03、A05、A06 和历史链接检查；不做手机。HTTP 核对 24 份新详情与索引路径，必要时复测原有主要流程。报告记录命令、实际计数、release、失败及修复结果，不重复运行无变化检查。真实样例只在本地只读验证，公共测试使用上述合成配置。

## 后续模块追加流程

每次按“确认模块及固定 commit → 添加扩展来源配置 → 核定正式注册集合 → 补基础内容与证据 → 构建分组发布 → 查询/输出及独立审核”推进。来源未到位或知识不完整明确保留缺口，不自动拉 latest，不自动从用户粘贴文本安装模块。只有新模块出现现有采集器不支持的实际语法，才另提最小适配；本轮 VTS 不需要修改构建解析器。

后续模块沿用本文流程，不预先实现插件市场、多版本选择器或通用下载管理。需要升级已收录模块时固定新 commit、重新核对差异并发布新 release，保留旧发布可追溯。
