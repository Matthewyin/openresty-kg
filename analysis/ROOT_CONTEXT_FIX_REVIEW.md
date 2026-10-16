# 主配置根上下文修复独立审核

审核日期：2026-10-13。依据：`analysis/ROOT_CONTEXT_FIX_PLAN.md`。

## 结论

最终审核通过，未发现需要打回实施的缺陷。当前实现满足计划的最小修复边界；结合主 Agent 已更新的 `analysis/ROOT_CONTEXT_FIX_VERIFICATION.md`，计划各项已有完成证据，无待补验收项。独立代码与探针验证、主 Agent 的真实样例及浏览器验收分别记录，不混称为同一审核者执行。

## 逐项核对

| 计划要求 | 独立检查结果 |
| --- | --- |
| 无结构错误且有完整顶层普通根块才推断 main | 通过。`src/core/parser.mjs:241` 的条件同时检查 errors、parent_index、kind、complete；结构错误不会执行补全。 |
| 复用现有根块映射 | 通过。调用 `childContext(d.name, null, true)`，未另建名称名单或扫描原始文本。 |
| 只修改顶层 context | 通过。循环仅为 parent_index 为 null 的节点赋值；不修改嵌套 context、位置、层级、参数、完整性及引用元数据。 |
| 五项原始失败模式 | 通过。独立执行五项回归测试，并用 `dist/knowledge/index.json` 实际知识索引验证 worker_processes、worker_cpu_affinity、events、stream、http 均为 main/matched。 |
| parseSingle 保持保守 | 通过。仍直接调用内部 parse；独立验证名称、普通单项和含假根文本的 Lua 单项均 context=null。普通块仍由既有测试验证为 out_of_scope。 |
| 孤立 server/location/listen 不猜测 | 通过。现有测试及独立 server 探针确认未知上下文保留。 |
| 错放顶层 server | 通过。有 events 根块时 server 为 main，实际知识索引返回 context_mismatch；listen 子项仍为 null。 |
| 未知嵌套不继承 | 通过。未知块中的根块名称不能触发推断；已存在有效根块时，未知块后代也不继承 main 或 HTTP 槽位。 |
| Lua、注释、字符串及同名 simple 不触发 | 通过。测试和独立探针覆盖 Lua table、长字符串、行注释、普通字符串、注释及 events;。 |
| 有结构错误不推断 | 通过。对四种根块分别追加多余闭括号、缺分号、未闭引号、未闭 Lua、未闭普通块和空分隔符，顶层均保持 null。 |
| 原有分层不回退 | 通过。既有测试验证 HTTP/stream/mail/events、location、if、upstream、limit_except 的分层结果。 |
| include 保留 | 通过。独立合成样例的两个引用均保留 not_analyzed；既有测试覆盖变量路径与 Lua 文件引用。未读取或展开 include。 |
| 更新测试和 README | 通过。旧的顶层 null 断言已改为 main；新增触发条件与反例回归。README 第 25 行准确说明推断条件，第 29 行保留参数不验证和外部引用不读取的边界。 |

## 独立运行证据

- `node --test test/parser.test.mjs test/matcher.test.mjs`：32 项通过，0 失败。
- 通过 stdin 运行只读 Node 探针：44 组通过，覆盖四种根块、结构错误、假根、孤立片段、单项模式、实际索引匹配和引用保留；未产生临时文件。
- 实施报告的“五项红转绿”不作为本审核独立运行的修复前证据；审核开始前读到的旧版 parseConfig 直接返回 parse(text, false)，与方案描述的根因一致。
- 项目根目录不是 Git 仓库，无法以 git diff 证明四文件以外绝无变化。本审核直接核对当前源码、测试和文档；不声称完成仓库级变更集合审计。

## 与主 Agent 验收分开记录

1. 用户采集文件第 3–73 行：主 Agent 已记录构建产物调用与真实 IAB 验收，24 项全部唯一匹配、五项顶层 main、四项 VTS 上下文正确、两个 include 引用与警告保留。本审核已阅读记录，但没有独立读取原样例；未复制配置正文。
2. 完整 `npm test` 和构建：主 Agent 记录 101/101 通过、`npm run build` 成功。本审核未重复全量测试或构建，独立验证 src 与 dist parser 字节一致，SHA-256 均为 `ade6df49bc4193ab34bb16daaaee2b57c36cb6c161cc2d475f5d6a709ad23d05`。
3. 浏览器反例和最终页面：主 Agent 记录孤立 server 三项上下文均未知；`events {} http {` 明确解析失败、无候选按钮；最终恢复用户主配置并保留截图 `analysis/root-context-fixed.png`。本审核未操作浏览器，也未将该截图作为独立页面验证。

最终收口时再次只读核对当前 parseConfig/parseSingle，并运行关键探针：实际索引五项 main/matched、孤立 server、未知嵌套、Lua/注释假根、不完整配置不推断、单项保持 null、两个 include 保留均通过。未发现源码与前次审核结论不一致。

原待补项已由主 Agent 验收记录补齐。审核过程中未修改实现、测试或 README，仅维护本报告，无临时文件需要清理。
