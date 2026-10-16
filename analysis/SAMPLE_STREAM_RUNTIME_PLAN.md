# 样例 stream 四身份运行时深度计划

日期：2026-10-13。状态：本批实施与独立审核完成，发布 `1.27.1.1-f8c21e3662af9366`；结果见 `SAMPLE_STREAM_RUNTIME_VERIFICATION.md` 与 `SAMPLE_STREAM_RUNTIME_REVIEW.md`。下文保留执行时冻结的范围及要求。规划角色 Astra low、实施 Sol high、审核 Astra low，主线程负责整合验收。

## 深度交互：目标、依据与最小路径

目标是补齐实际样例中的 stream 代理、解析器及超时运行时解释。默认值和继承已有证据，不重做基础事实，不将范围扩大为完整网络代理研究。

依据 `SAMPLE_RUNTIME_PLAN.md`、`SAMPLE_RUNTIME_VERIFICATION.md` 及本轮只读检查：当前发布为 `1.27.1.1-15e6ba8dfd628573`，1041 basic（包含 deep）、1 deep，唯一 deep 为 HTTP proxy_pass。四个目标均为 basic，尚无 runtime；proxy_pass 的 defaults/inheritance 为有证据的 not_applicable，其余三项为 verified。主线程确认四项补丁状态均为 verified_affected，实施须保留并核查新增消费路径的补丁覆盖。

主线程直接读取原样例并解析聚合确认：A 共24条，没有本批四项；B 共258条，stream resolver 1次，proxy_pass、proxy_connect_timeout、proxy_timeout 各4次；未出现 resolver_timeout。这里只记录聚合结果，不复制原样例正文，不声称规划角色重新核过原样例。

已检查实际 `src/query/knowledge.mjs` 的 validateRuntime/deriveVerification、`scripts/build.mjs` 的 runtime 组装与评级调用、`test/runtime.test.mjs` 的发布及字段保护。已有契约可承载本批，最短路径是补四项知识并增加专项保护，无需修改产品代码、schema、展示或统计逻辑。旧 HTTP 测试读取当前 index 且断言仅1 deep，会与新发布冲突；主线程应将历史批次断言固定在其实际发布，另设本批基线保护，不能放宽为“至少几个 deep”。

## 直接执行：冻结写集合

知识文件仅允许修改 `knowledge/directives.json` 中以下四个精确身份：

| component/module/name | 本批运行时范围 |
| --- | --- |
| nginx/ngx_stream_proxy_module/proxy_pass | 静态与动态目标入口、变量求值、已配置 upstream 匹配、直接地址、条件性 DNS、peer 创建与连接入口及必要失败出口。 |
| nginx/ngx_stream_proxy_module/proxy_connect_timeout | 实际连接等待计时器的设置、消费、清理和失败出口；只解释影响该链路的重试条件及其他直接消费点。 |
| nginx/ngx_stream_proxy_module/proxy_timeout | 转发阶段计时器设置/刷新/清理、超时分支及 TCP/UDP 不同结束条件；区分限速延迟等事件状态。 |
| nginx/ngx_stream_core_module/resolver | stream 动态域名解析的调用条件、resolver 对象消费、缓存/查询与回调、成功进入连接及错误/超时出口。 |

每个身份仅新增 runtime、必要 evidence，扩充 patch_status.source_ids；patch_status.note 仅为新增运行时及补丁影响作必要精确补充。四项既有 verified_affected 状态保留；若固定证据与旧结论冲突，先提交具体冲突给主线程，不静默更改。保留全部旧 evidence、补丁引用及原有事实。不得修改 defaults/inheritance、summary、syntax、mechanism、related、limitations 等非授权字段；不得写 curated verification 控制晋级。

实施中唯一必要的表示层补充：三个proxy条目的curated limitations由字符串改为15e6旧发布中的明确对象，以防新增evidence自动扩大旧限制引用；主线程批准且审核通过，实际发布的正文、状态及source_ids必须逐字保持旧值，不放宽上述事实保护。

发布详情只允许上述 runtime、新增固定 sources、获准的 patch_status 变化及派生 verification，release_id 可按正常构建变化。verification_notes 如构建确实派生变化，须由主线程逐项审查并精确限定，不能整字段免检。其他1037身份（含已 deep 的 HTTP proxy_pass）详情在排除 release_id 后保持一致；索引除四项派生评级、正常发布路径及覆盖统计外保持原行为。

resolver_timeout 未在样例出现，只在 resolver 调用链解释 `ctx->timeout` 来源及解析超时消费，不单独升级任何 stream/HTTP resolver_timeout 身份。proxy_next_upstream、tries、responses 等仅作四项必要条件解释，不新增这些指令的 runtime。不扩 HTTP、完整 TLS、完整重试策略、完整 DNS 缓存机制、其他非样例指令或现场部署验证。

## 实施必须核实的语义边界

以下是必须回答的研究问题与候选入口，不是可直接复制到知识的事实结论。Sol 必须以固定 Git 对象、实际调用和适用补丁核定条件、动作、失败状态及证据范围；不得把本表当作源码证明，也不按预定步骤数拼接说明。

| 边界 | 必须核实并能审查的结果 |
| --- | --- |
| 静态/动态目标 | 从配置保存到 handler/eval 的实际消费；动态值先匹配配置组、直接 IP/Unix 地址、需要 DNS 的域名分支及端口限制。不能写成变量目标必经 DNS，不能混同配置期域名处理与运行期 resolver。 |
| DNS与连接 | `ngx_stream_proxy_handler`、`ngx_stream_proxy_eval`、`ngx_stream_proxy_resolve_handler`、`ngx_stream_proxy_connect` 的实际连接；缺 resolver、启动失败、解析错误/超时、结果转 peer 失败各自出口。缓存命中或共享未完成查询不能误称每次发送 DNS 请求。 |
| resolver_timeout | 跟踪 stream core 配置对象到 `ctx->timeout`，再到 resolver 超时处理及 stream 回调；明确与连接等待、转发空闲时间分别作用于哪个阶段。仅解释这条依赖。 |
| connect_timeout | 跟踪 `ngx_event_connect_peer` 返回值、异步连接事件和计时器；核查立即成功/失败与等待分支，不给 UDP 强套 TCP 握手语义。检查该字段全部相关消费点；如涉及 TLS，仅说明直接消费与边界，不扩证书、协议或完整握手机制。 |
| proxy_timeout | 核查 `ngx_stream_proxy_process_connection`/process、连接初始化等消费点；解释计时器条件而非宣称整个会话固定总时长。区分 delayed 与真正超时，以及 TCP 结束和 UDP 响应计数相关成功/失败出口；必要时说明 PROXY protocol 发送等待等直接消费点。 |
| 重试 | 连接失败/超时是否进入 `ngx_stream_proxy_next_upstream`，其 tries、开关、累计重试窗口和 buffered data 等终止门槛；不能写成所有超时均自动重试，不能把 DNS 超时或转发超时等同连接超时。 |
| TCP/UDP | 相同配置在传输类型、连接等待、数据转发、超时与结束条件上的真实差异；不是分别写两段相同描述。只解释四项覆盖的条件，不扩 UDP 全部会话机制。 |

源码候选集中于 `repos/nginx/src/stream/ngx_stream_proxy_module.c`、stream core/upstream peer 实现、`src/event/ngx_event_connect.c` 和 `src/core/ngx_resolver.c`；按实际调用补足最小证据。本轮已看到 proxy 模块目标分类、resolver timeout 赋值、TCP/UDP 超时分支及 next_upstream 门槛，完整事实仍由实施核定。

固定来源沿用 `project.config.json`、`analysis/components.json` 与 `analysis/NGINX_PATCH_AUDIT.json`：nginx revision `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`，OpenResty revision `8c37412c31621225e7aa7e825b5b50106c9c71c4`，nginx-docs revision `e8b581903e9d41252720053311cea687a5671674`。实施先确认这些固定来源一致，以固定对象取片段，不能只读工作区行号。审计已显示 stream proxy 有补丁 hunk；逐项核查新增路径受影响情况，不能用旧配置事实的补丁结论代替运行时审查。

## 复用 runtime 契约

完全复用既有 `{status,text,steps:[{condition,action,source_ids}],source_ids,corroboration_source_ids}`。每项 text 明确限定范围；verified 每步有实际消费代码证据，runtime.source_ids 精确等于步骤引用去重并集，独立固定文档引用另存 corroboration_source_ids，不混入代码并集。patch_status.source_ids 覆盖全部 runtime 代码和适用补丁证据，保留旧引用。

defaults/inheritance 与基础晋级前置仍走原校验。代码注册/配置片段改名或裁剪不能冒充运行时证据；文档外链、同一代码另起 ID 不算独立信号。事实内容、代码和文档之间的支持关系由专项断言和审核验证，结构校验不是语义证明。verified 前置不足必须拒绝发布，不通过修改产品校验、伪造证据或降级掩盖。旧 schema、无 runtime 和 unverified 行为原样保护。

## 验证计划与验收标准

1. 主线程冻结 `15e6ba8dfd628573` 基线与四身份白名单，维护测试；Sol 只写上述知识，完成后交付四项范围、固定证据、补丁结论及未决项。实施与测试不得交叉改写对方文件。规划角色本轮只写本文。
2. 专项测试对真实新发布先做逐字检查，再进行内存变异负例。完整 sources 与基线旧 sources 加固定 Git 新片段相等，检查 component/revision/file/行号/code/URL/kind；拒绝额外、重复、悬空引用、旧证据删改及错误文档。不得先去重或覆盖真实 sources 再验收。
3. 四项分别通过 validateRuntime、deriveVerification、validateDetail 和实际 publication 入口；缺 runtime、unverified、伪 deep、缺文档、补丁漏覆盖、注册/配置别名、错误引用等负例仍受保护。专项语义断言覆盖上表真实分支和固定片段，不能仅靠中文关键字或 curated 与自身相等证明正确。
4. 全身份字段保护以本批基线比较，只开放上述四身份授权字段；其他1037身份不变，既有 HTTP runtime、defaults/inheritance、sources 和评级保持。保留阶段一与 HTTP 历史测试的原有强度和记录；必要时固定其历史发布，不改历史结论凑新总数。
5. 主线程按实际新增测试文件执行专项测试，统一 `npm run build` 后检查实际发布并执行 `npm test`。记录真实命令、结果和测试数量；既有146/146仅为上一批历史记录，不能称本批结果。若测试读取新产物，区分构建前后检查，旧产物缺 runtime 不得冒报通过。
6. 全部通过时应自然派生1041 basic、5 deep：原 HTTP proxy_pass 加本批四身份；bundled 5 deep、department_extension 0 deep。这是精确验收期望，禁止写死产品计数或改晋级规则。记录实际新 release_id 及索引/详情/总量/分组一致性。
7. 主线程用实际发布验收四项 Markdown 与网页范围、步骤顺序、condition/action、证据和 deep 状态一致。原样例只读，保留 A24/24、B258/258、50身份及外部引用2/1既有行为；B的四身份出现次数符合已核聚合。没有 runtime 的其他身份仍正常展示，HTTP 已有链路不回退。
8. 独立审核逐项核对范围、固定源码、文档佐证、补丁、失败出口、真实发布差异和测试强度；缺项退回 Sol 或主线程按职责修复，再复核。四项全部满足后才称本批完成，不将静态深度解释宣称真实网络或现场运行验证。

## 本轮交付边界

本规划仅新增 `analysis/SAMPLE_STREAM_RUNTIME_PLAN.md`。未修改产品、知识、测试或其他计划，未运行构建、测试、浏览器、联网，也未复制样例正文。根目录无 Git，不初始化仓库；后续固定来源读取使用已有组件子仓库。本文完成可供 Sol 开始实施，事实与发布验收仍待后续角色完成。
