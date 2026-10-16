# 本批准确性修复冻结方案

日期：2026-10-10。目标：关闭 `analysis/REVIEW.md` 的 R02（事实和状态展示不一致）、R03（嵌套数据校验不足），补齐用户 stream 代理配置相关知识的指令级证据。本文是待实施方案，不表示缺陷已关闭。本规划任务仅写本文，不改代码、不运行构建。

## 1. 判断与范围

已核对审核记录及当前查询、页面、构建代码：Markdown 缺继承、依赖和文档链接；默认值的 not_applicable 被折叠为未核实；详情对象虽检查部分容器，却未完整校验嵌套字段及元素，渲染位于查询错误收口之外；构建尚未在发布前对全部详情执行统一校验。修复应集中在外部数据校验、同源事实表达和构建发布门禁，不扩展解析能力或重做 UI。

主线程与实施线程沿用已确认模型和分工。全量知识、真实 Codex 宿主接入、部门正式样例验收仍未完成；用户当前 stream 片段用于本批相关项核对，不代替部门整体验收。

## 2. 文件所有权与顺序

| 责任方 | 可修改范围 | 本批交付 |
|---|---|---|
| 主线程 | `knowledge/directives.json` 及准确性来源记录 | 用户 stream 片段实际涉及的指令知识；逐指令补丁影响、应用条件及固定版本证据；不改实现文件 |
| 实施线程 | `src/query/knowledge.mjs`、`site/app.mjs`、`scripts/build.mjs` 及对应测试 | 严格校验、结构化错误、两端事实一致、构建前全详情门禁；不代写知识语义 |
| 审核 | 只读本批产物并向主线程返回问题与证据 | 分别判断 R02、R03 和新增知识准确性；缺项打回责任方，不以测试数量代替通过 |

实施线程可先用明确的测试夹具完成 R02/R03；主线程并行补知识。整合时用真实知识验证全部产物，再交审核。来源记录由主线程落盘；主线程汇总关闭依据，本文不修改 REVIEW 的历史结论。

## 3. R02：冻结事实表达

网站与 Markdown 从同一份已校验 detail 表达同一事实，允许排版不同，不维护第二份解释。两者都保留名称/模块/context 及其核实状态、语法/功能、默认值、继承、限制、条件编译、依赖、废弃状态、配置入口、已有机制、阶段、补丁状态、核实说明、源码及 documentation 链接。源码正文可继续由网站展示，Markdown 保留相同来源身份和链接，不强求复制整段源码。

- `verified` 显示“已核实”及原事实文本；`unverified` 显示“未核实”，若有研究文本须保留并标状态；`not_applicable` 单独显示“不适用”及已有解释，不得显示为未核实或编造默认值。
- `deprecated=null` 是未核实，不等于 false；availability.status 和 patch_status.status 均需可见。依赖为空仅表示未记录，不能声称无需依赖；限制为空沿用“尚未记录限制，不等于没有限制”。
- documentation 逐项展示标题、链接、verified/unverified；源码与补丁引用保留组件、版本、revision、路径和行号。不把尚未核实的 mechanism 统一冠以“已核对”，措辞须与条目状态一致。
- `registration_only` 保留明确提示，不计基础覆盖。唯一候选的 context_required 仍只是知识预览，不升级 matched；同名歧义不得自动选模块。

## 4. R03：冻结边界校验与错误返回

沿用 schema_version=1 及现有 index/detail 契约。运行时和构建复用 `knowledge.mjs` 的校验，先验证容器，再验证所有被页面/Markdown访问的字段和数组元素，禁止依赖访问时自然抛 TypeError。

必须覆盖：index.coverage 的布尔值、非负整数计数及 gaps 字符串数组，entry.phases 等字符串数组；detail 的 availability.compile_guards/dependencies 字符串数组、deprecated 布尔或 null、status 枚举；patch_status.status/note/source_ids；defaults/inheritance 的 status/text/source_ids；limitations 每项；configuration_entry.symbol/source_ids；documentation 每项 title/url/status；verification_notes/phases；sources 的全部字段、唯一 id 和引用闭合。可选 mechanism、related 存在时也须验证其契约类型。验证 identity、context、phases、版本与索引一致；URL 协议和固定源码 SHA/行号语义继续检查。数组中的 null、标量或嵌套畸形对象必须明确拒绝，不自动补空数组掩盖损坏。

查询入口 `querySingle` 对外部异常 JSON 必须 resolve 为完整结构化结果，不得 throw/reject：`status=knowledge_unavailable`、`detail=null`、`detail_url=null`、`errors=[{code,message,line,column,offset}]`，markdown 为可读错误说明。既有 schema_version/release_id/match 字段保持约定，已取得的 release 快照可保留；不能保留无效 detail 或将失败变成 unknown。JSON 解码失败为 invalid_json，畸形详情为 invalid_detail，格式版本不支持为 unsupported_schema，跨发布为 release_mismatch；索引字段畸形沿用现有 invalid_json 错误码。

解析、读取、校验、详情渲染的错误均在公共查询出口收口，特别复现 availability={} 不再逃逸。内部 validateIndex/validateDetail 可继续抛带 code 的受控错误供构建拒绝发布，不要求改变内部接口；网站直接调用 loadIndex/getDetail 时必须捕获并显示对应结构化错误的中文说明，撤销旧详情，保持现有查询代次保护。无效部署配置或程序缺陷不应被宣称为合法知识。

## 5. 指令级 OpenResty 来源与知识交接

主线程以用户已提供 stream 代理片段中的实际指令和所属模块为集合，不补猜片段缺失内容。逐项记录配置入口、语法/功能、已有默认值/继承/限制与来源；同名 HTTP/stream 项分开，不按名称覆盖。证据不足的字段保持未核实。

知识输入在现有记录上可选增加与输出同形的 defaults、inheritance、availability、patch_status、documentation；保留已有 default 等输入的兼容读取，以明确 Fact 字段优先，不要求本批重写所有旧记录。新增跨组件证据沿用 evidence 数组，允许每项增加稳定 `id` 与 `component`；省略 component 仍指当前知识组件，省略 id 沿用 evidence-N。事实 source_ids 必须指向该条目最终 sources 中的真实 id。构建生成固定 revision、code 和 URL，不能让知识文本伪造这些产物。

每条新增/更新 Nginx 知识的 patch_status 必须有指令级结论：依据锁定 OpenResty 的实际补丁应用分支、条件、相关补丁和对应实现，区分 verified_affected、verified_unaffected、unverified。相关 OpenResty 脚本/补丁通过跨组件 evidence 成为该条目 sources，source_ids 指向它们，来源记录说明影响范围与判断理由。未受影响也须说明检查范围及证据，不能仅凭未搜到指令名称、补丁文件存在或版本下载脚本做结论。

禁止将 Nginx 组件全局标为 unaffected 或让全局状态替代逐指令审核。构建读取逐条 patch_status；verified_affected 不是基本知识不合格，只要正文已反映补丁后行为且其余基础证据齐全即可计 basic_verified。unverified 保持 registration_only；不得借本批统一升级无证据条目。补丁片段的行号属于 OpenResty 仓库，不能冒充上游 Nginx 文件行号；保留用户 tag，不切换源码版本。

## 6. 发布前门禁与验收

构建先生成完整 index 和全部 details，在任何发布写入、页面复制或当前 index 切换前调用统一校验逐条验证；任一失败须非零退出并报告条目 id/字段，当前发布保持不变。检查引用闭合、重复 id、身份/版本一致、片段范围、verification 与证据条件以及 coverage 计数。沿用不可变 release 目录和原子切换当前 index；同 release 不覆盖不同内容。此要求为实施后的构建行为，本规划不执行构建。

| 检查 | 可复现通过条件 |
|---|---|
| R02 哨兵事实 | 注入已核实继承、依赖、文档及 not_applicable 默认值；网站与 Markdown 均可见同一文本、状态及链接；unverified/not_applicable 不混淆 |
| R03 查询出口 | 将合法详情逐一变为 availability={}、嵌套 null、数组元素类型错误、坏 patch_status、坏文档、悬空 source_ids 等；实际 querySingle 均返回完整错误对象，不 reject，不出现 TypeError |
| 异常响应分类 | 畸形 JSON、错误 schema、跨 release、缺文件分别保留约定错误码；页面无旧详情，Markdown 无成功知识内容 |
| 发布门禁 | 在隔离测试输出中将非代表条目/最后一条详情改坏也拒绝发布，证明检查全部详情；失败前后当前 index 内容一致；合法全集通过同一验证器 |
| 指令级补丁 | 新增 stream 知识逐条核对固定源码及应用分支，正文与 patch 状态一致；无 Nginx 全局 unaffected 推导；未核实项仍不计基础覆盖 |
| 保持现有行为 | 同名歧义、孤立 server 未知 context、唯一候选预览状态、历史发布/在途快照、旧请求不覆盖新输入均有回归证据 |
| 不上传输入 | 注入 fetch 记录请求，含独特原文/参数标记的查询仅发静态 GET，URL/正文无输入；浏览器网络证据与离线证据分开记录 |

测试使用 Node 自带 test 和必要页面验收，集中验证上述失败模式与用户可见事实，不扩展组件研究或新增服务。收口分别记录 R02、R03 的修复和审核证据、stream 已核实项及剩余缺口；本批通过不表示全量知识、真实 Codex 宿主或部门样例已完成。
