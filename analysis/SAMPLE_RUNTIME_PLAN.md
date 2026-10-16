# HTTP proxy_pass 首批运行时契约计划

日期：2026-10-13。状态：本计划首批实现、主线程验收及独立审核完成，见 `SAMPLE_RUNTIME_VERIFICATION.md` 与 `SAMPLE_RUNTIME_REVIEW.md`；固定发布 `1.27.1.1-15e6ba8dfd628573`。规划模型沿用 Astra low，不创建新任务。

## 深度交互：范围与现有入口

阶段一已完成。依据 `SAMPLE_REMAINING14_VERIFICATION.md`，基线为 `1.27.1.1-647706874ae7c03c`，1041 basic、0 deep；新增16项及全量138项测试通过，原样例浏览器验收通过。此处引用验收记录，不冒称本角色重跑。

首批仅补 `nginx/ngx_http_proxy_module/proxy_pass` 的动态目标求值、目标分类、条件性DNS解析和上游连接链路。不扩展stream、完整TLS/重试/缓存机制、部署验证或其他身份；已有源码研究作为输入，本规划不重复研究。

已读取实际代码：`scripts/build.mjs` 的 `prepareKnowledgeFacts`、详情组装和 `validatePublication`；`src/query/knowledge.mjs` 的 `validateDetail`、`validateIndex`、`renderMarkdown`；`src/core/source.mjs` 的 `validSourceCoverage`；`site/app.mjs` 的 `renderDetail` 和覆盖率展示。当前构建仅生成basic/registration，总deep固定0；来源组已按详情评级派生deep，查询侧已有deep标签及总量/分组一致性校验。页面与Markdown目前只展示配置mechanism，尚无runtime。

最小改动是在这些现有入口增加可选runtime、共用校验与展示数据，不引入通用阶段枚举、图谱、next或新的证据系统。结构校验不理解中文条件；DNS分支语义由本身份专项回归与源码审核负责。

## 直接执行：冻结契约

沿用schema 2，runtime为详情可选字段；未提供时不输出占位对象。对象形状如下，示意字符串不是待发布事实：

```js
runtime = {
  status: 'verified' | 'unverified',
  text: '本批运行时范围及结论',
  steps: [{ condition: '适用条件', action: '执行行为或失败出口', source_ids: ['源码证据ID'] }],
  source_ids: ['步骤源码证据ID的去重并集'],
  corroboration_source_ids: ['独立固定文档证据ID']
}
```

两种状态均校验对象类型、status枚举、非空text、steps数组、每步非空condition/action、各引用数组的类型与唯一性，以及所有已填引用可解析。runtime.source_ids精确等于各步骤code引用的去重并集；corroboration_source_ids单独保存文档引用，不纳入该并集。runtime不接受null或未知status。unverified的text仍须提供非空范围或待核说明，允许steps及引用数组为空，不要求晋级前置、不升级；已填片段仍须通过现有sources校验，不能用unverified绕过坏引用检查。

verified额外必须同时满足：

1. text非空、steps非空；每步source_ids非空并引用固定运行时代码证据。结构校验中的代码后缀检查仅判断文件类型，不能识别注册表、配置回调或实际消费路径；首批专项测试固定精确身份与关键片段，结合人工审核保证所述执行路径语义。
2. runtime.source_ids非空，精确等于所有step代码引用的去重并集，不多不少；corroboration_source_ids非空，与代码引用集合分开，引用独立固定文档片段，不纳入runtime.source_ids。首批使用已锁定nginx-docs证据，专项测试核对component、revision、file、范围和原文，人工审核其佐证关系。仅documentation中标verified的外链、同一代码片段另起ID、README名称或“有两个source”均不足以充当独立文档信号。
3. defaults/inheritance分别为verified或有明确理由的not_applicable，两者正文、证据非空且引用有效；复用阶段一已核实事实，不重写事实以迎合晋级。
4. 基础条件仍完整：summary、syntax、已核上下文、注册与配置回调定义、配置入口引用及已核补丁状态。HTTP nginx身份不能使用扩展组件的not_applicable补丁状态绕过检查。
5. patch_status.source_ids覆盖runtime所引用的全部运行时代码证据；如引用受影响补丁，补丁证据也必须纳入。核对实际适用补丁及hunk，对新增消费路径形成审核记录；不能用上一批仅配置事实的补丁结论自动证明runtime不受影响。verified_affected仍须有效固定补丁片段。文档引用不作为“代码已核补丁”的替代。

结构和晋级前置校验放在查询模块的最小共用函数内，由validateDetail与构建复用；不另造框架。固定Git对象逐字比对、文档内容是否支撑结论、代码是否确为所述执行路径由构建证据生成、专项测试和独立审核共同保证，不声称读侧仅凭JSON可以证明全部事实。

## 晋级、兼容与展示

构建从同一校验结果派生verification：先满足原basic条件，再在runtime.status为verified且全部前置通过时生成deep_verified。缺runtime或unverified仍按原逻辑生成basic/registration；已声明verified却缺条件则报错中止发布，不能沿用prepareKnowledgeFacts对普通事实的静默降级方式处理runtime。手工写入deep却缺runtime或任一前置，validateDetail及validatePublication均须拒绝；构建不读取curated手写verification来决定评级。发布的verified runtime与deep评级也不能互相矛盾。

移除总deep固定0，按最终详情评级计算；basic沿用现有包含deep的口径。详情、索引、总量、bundled/department_extension分组和analysis覆盖率来自同一结果。若首批全部通过，预期仍1041 basic且仅该HTTP身份为deep，deep为1；这是验收期待，不能作为赋值常量或身份白名单晋级。没有合格runtime时deep自然为0。

旧schema 1/2 release无runtime且原为basic/registration的读取行为保持兼容，不补字段、不重写历史、不把mechanism自动认定为runtime。不以兼容为由接受缺前置的伪造deep。新客户端读取旧release必须通过；不要求旧客户端识别新展示。

网站renderDetail与renderMarkdown共用runtime状态、范围正文、步骤顺序、条件/行为和证据映射，可在现有query模块增加小型格式化辅助。分别渲染DOM和Markdown，页面用现有安全文本节点。verified展示“运行时链路已核实”并明确首批范围；unverified明确未核实并展示范围或待核说明；无runtime时网页和Markdown均简短显示“运行时链路尚未记录”。展示步骤源码与独立文档引用，不只显示一个deep徽标。保留配置mechanism、身份匹配提示和未运行OpenResty的边界。既有来源组显示deep已够用，不新增筛选器、图表或页面重构。

## 首批内容与写集合

步骤只表达动态proxy_pass目标求值 → 地址/已配置upstream等目标分类 → 需要解析域名时使用resolver → 解析结果进入上游连接。以已有研究为依据明确IP或已匹配upstream可绕过DNS，缺resolver、解析失败/超时、连接失败的出口；不得写成动态目标每次必发DNS。必要的解析缓存条件只限避免此误述，不扩展缓存机制研究。不以固定步骤数量或中文关键字替代链路审核。

内容只改 `knowledge/directives.json` 的该HTTP身份：新增runtime、必要evidence与补丁引用；patch_status.note/status只有新增运行时范围确有证据要求时才能精确调整并在差异中说明，保留旧引用与旧事实。独立文档优先复用已存在的固定source。其余defaults/inheritance、summary、syntax、mechanism等字段以及所有其他身份逐字保护。

实现范围为 `scripts/build.mjs`、`src/query/knowledge.mjs`、`site/app.mjs` 及必要的既有/专项测试；`src/core/source.mjs` 的现有分组校验先复用，不因规划提及而修改。构建产物由主线程统一生成。既有历史测试继续固定历史基线，本批另以647706874ae7c03c比较新发布；只开放该HTTP身份的runtime、授权sources/patch变化和派生verification，必要verification_notes变化须限定运行时范围说明，不能放宽整条字段保护。

## 验收与负例

| 范围 | 必须通过的正例/拒绝的负例 |
| --- | --- |
| 可选契约 | 无runtime旧schema 1/2可读；unverified须有非空范围/待核说明，steps/refs可空且不升级；拒绝null、未知status、空text、错误字段类型、已填步骤空condition/action、重复或悬空引用、source_ids不等于步骤code并集及混入corroboration文档引用。 |
| verified前置 | 完整首批通过；空text/steps、某步无源码、仅注册/文档证据、缺defaults/inheritance正文或证据、基础条件不足、补丁未知或漏覆盖均拒绝发布，不降级掩盖。 |
| 第二信号 | 独立固定docs片段通过；仅外链、缺corroboration、代码改ID冒充docs、错误文档revision/片段拒绝。实际正文是否支撑动态目标与解析结论由审核判定。 |
| 语义边界 | 专项回归固定合法动态域名路径、IP/已配置upstream跳过DNS、缺resolver、DNS失败/超时和连接失败的说明与对应证据；审核拒绝“所有动态目标必发DNS”及伪造连接链。测试不冒称真实网络运行。 |
| 派生评级 | 有效runtime派生deep；删去runtime或改unverified后重新派生为原basic；手工deep缺前置、详情/索引评级不一致、总量/分组deep造数均拒绝。basic包含deep，非目标身份不得晋级。 |
| 实际发布证据 | 在任何内存覆盖前，逐字比较新release的runtime、授权完整sources及patch_status；预期来源于基线旧证据加固定Git对象新证据。拒绝错误code/revision/行号/URL、额外/重复source或patch引用、旧证据删改及其他身份/字段误改；不先Map去重。 |
| 展示与兼容 | 实际新release的HTTP proxy_pass页面与查询Markdown展示相同状态、范围、步骤和引用；无runtime均简短显示“运行时链路尚未记录”，unverified展示待核说明，两者均不显示已核实。保留两样例50身份、A24/24与B258/258匹配及外部引用2/1的既有行为。 |

主线程先执行针对契约、晋级和字段保护的测试，统一构建后核实际发布，再执行受影响查询/页面回归及整合测试。最终记录真实发布ID、派生计数、命令/测试数量、实际页面与Markdown结果，保持既有138项历史记录原样，不将旧测试数改称新全测。独立审核逐项检查证据、补丁、文档信号、失败关闭和发布差异；缺项退回修复，复核后主线程验收。未通过不得称首批deep完成。

本轮仅修订本文并同步阶段一计划完成状态；未修改代码、知识、测试或构建产物，未运行测试、构建或浏览器，也未重新研究Nginx源码。
