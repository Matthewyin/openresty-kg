# HTTP proxy_pass首批运行时验收

日期：2026-10-13。实现、主线程验收与独立内容审核完成。

## 深度交互：范围

前置阶段一已完成，见 `SAMPLE_REMAINING14_VERIFICATION.md`。本批只补HTTP proxy_pass动态目标到上游连接的条件和失败出口；不扩展stream、完整TLS、重试或现场部署验证。

共享运行时对象由构建、查询详情、网页和Markdown消费，依据 `SAMPLE_RUNTIME_PLAN.md`。结构校验负责字段、引用及晋级前置；源码语义仍由专项断言和独立审核负责，不把自动检查冒称实际运行。

## 直接执行：已执行记录

- 新增可选runtime与共享校验；构建从同一入口派生深度评级，basic统计包含deep。旧发布无runtime仍可读，不自动升级mechanism。
- 网页沿用现有分区与安全文本节点，显示范围、条件、动作及固定证据链接；Markdown使用同一知识对象，缺runtime时明确尚未核对。
- 阶段一16项回归固定到其647706874ae7c03c发布，并再次16/16通过；新runtime测试以该发布为字段保护基线，只开放目标HTTP身份的runtime、派生评级、必要证据与获准的patch_status变化。
- 新测试初次对旧发布运行：6项失败，原因是旧产物尚无runtime/deep；这是发布前检查，不宣称测试通过。随后追加注册/配置别名拒绝及独立路径断言，待新知识到达后运行。
- 审核P2：注册片段仅改ID可伪装消费证据。已按固定component/revision/file和被包含范围拒绝完整或裁剪别名，并增加deriveVerification及publication两个实际入口负例；独立复核关闭。
- 运行时核对发现OpenResty新增影响，主已批准本HTTP身份patch_status改为verified_affected并精确更新说明；默认/继承、原说明及旧源码证据不得改动。

## 实际产物与测试

- `npm run build`成功：`1.27.1.1-15e6ba8dfd628573`，1041 basic（包含deep）、1 deep；唯一深度身份为HTTP proxy_pass。bundled组1 deep、扩展组0 deep。未手写计数。
- 冻结内容为16个条件步骤、35个代码引用、7个独立文档引用，新增40个固定证据；旧事实与旧来源逐字保持。
- `node --test test/runtime.test.mjs test/sample-facts.test.mjs test/extensions.test.mjs`：22/22通过，日志 `sample-runtime-focused-tests.log`。runtime8项包含真实发布前置、伪deep/配置别名/裁剪拒绝、旧schema、固定源码分支、文档、全身份字段保护及真实Markdown查询。
- `npm test`：146/146通过，无跳过；日志 `sample-runtime-tests.log`。保留阶段一138项历史结果，不追改旧记录。
- 实际published sources在未覆盖前与固定Git片段/元数据逐字比较，额外、重复、错误code/revision/行号/URL及错误文档负例均拒绝；patch_status与已授权curated精确相等，全部旧引用保留。

## 桌面网站验收

- 53111临时预览加载当前发布；只做桌面，不改变viewport或进行手机验收。
- 原样例A主配置24/24唯一匹配、外部引用2；B完整配置258/258唯一匹配、外部引用1，原样例正文未写入仓库。
- 从B匹配目录打开HTTP proxy_pass，显示深度徽标和运行时链路；16步condition/action逐项与同一curated数据比对相等，步骤显示50个源码链接（含跨步骤重复引用）。截图 `sample-runtime-browser.png`。
- 字段保护测试确认阶段一50个样例身份的defaults/inheritance内容未变；唯一匹配和静态深度都不是现场配置/网络成功验证。

## 独立审核与收口

`SAMPLE_RUNTIME_REVIEW.md`已最终签署：16步语义、固定源码与补丁、7项文档、实际发布40项新增证据核对通过；其他1040身份及目标原事实保持。框架P2关闭，无剩余审核阻塞。

本批完成的是HTTP proxy_pass所列动态目标到连接范围，不代表全站运行时深度完成。后续优先继续样例中的stream proxy_pass、resolver及超时消费路径；完整TLS、重试、缓存及现场版本/模块安装验证仍未完成，Codex真实接入继续后移。
