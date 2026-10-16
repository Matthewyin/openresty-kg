# 样例 HTTP 解析器与代理超时运行时计划

日期：2026-10-13。状态：本批已实施、验收并独立审核通过，最终发布 `1.27.1.1-c49915e4ed7a7e58`；结果见同前缀的VERIFICATION与REVIEW文档。下文保留执行时计划。基线固定为 `1.27.1.1-f8c21e3662af9366`，不得用当前发布指针代替。主线程负责流控、测试整合、构建和样例验收；实施按本文补知识，审核按本文逐项检查，发现遗漏退回实施并复核。沿用主线程已确认的角色与模型，本规划不另建线程。

## 深度交互：目标与最小路径

目标是补两份样例涉及的四个 HTTP 身份的运行时深度，复用现有契约即可，无需修改产品、构建逻辑、展示或晋级规则。已读取上轮 `SAMPLE_STREAM_RUNTIME_PLAN.md`、`SAMPLE_STREAM_RUNTIME_REVIEW.md`、`SAMPLE_STREAM_RUNTIME_VERIFICATION.md`，并核对当前知识、固定基线详情、`src/query/knowledge.mjs`、`scripts/build.mjs`、`test/runtime.test.mjs` 和 `test/stream-runtime.test.mjs` 的相关实现。

基线四项均为 `basic_verified`、无 runtime，补丁状态均为 `verified_affected`，默认值和继承已有证据。主线程只读原样例确认：A共24项，没有本轮四身份；B共258项，HTTP resolver出现20次，三个HTTP代理超时各2次。本规划仅引用聚合结果，未读取私有样例。

最小路径是复用已有 HTTP proxy_pass 深度与四项基础证据，沿真实消费点补必要分支及失败出口；不重新研究全部源码。主要风险是将 DNS、连接、发送、响应头和响应正文的计时混为请求总时限，或将上游原文误作已应用 OpenResty 补丁后的行为。只升级以下四项，原有5个 deep 内容与评级全部不变。

## 直接执行：范围与最小核查链

以下为实施必须核实的问题和候选调用点，不替代固定源码证据，不预设步骤数量。

| 精确身份 | 最小调用链及必须交代的边界 |
| --- | --- |
| `nginx/ngx_http_core_module/resolver` | 限定为 HTTP 代理动态目标消费 resolver 的链路：proxy 求值、upstream 初始化中的已配置组匹配/直接地址/条件性 DNS，`ngx_resolve_start`、`ngx_resolve_name` 到 `ngx_http_upstream_resolve_handler`、结果转 peer 与连接。核查缓存命中、共享等待、查询和超时回调；无 resolver、启动失败、异步解析错误及结果转换失败分别闭合到 HTTP 出口。`resolver_timeout` 只解释 `ctx->timeout` 来源，不单独晋级；不把所有 HTTP 模块的 resolver 用途纳入范围。 |
| `nginx/ngx_http_proxy_module/proxy_connect_timeout` | 配置到请求级有效字段，`ngx_http_upstream_connect`、`ngx_event_connect_peer` 的即时成功/失败与异步等待、计时器设置与删除、连接检测及超时出口；核查 TLS 握手直接消费和 `ngx_http_upstream_next` 门槛。DNS 超时独立于连接等待；不能声称所有失败必重试。 |
| `nginx/ngx_http_proxy_module/proxy_send_timeout` | 请求级字段到 `ngx_http_upstream_send_request`、发送事件处理与请求体未完成分支；可写/阻塞、计时器设置/删除、超时与重试限制。结合 pipelining 补丁核查处理器继续工作的条件；区分向上游写请求与向客户端写响应。升级连接若直接消费该字段，仅解释直接计时点，不扩完整升级协议。 |
| `nginx/ngx_http_proxy_module/proxy_read_timeout` | 请求发送完成后响应头等待、`ngx_http_upstream_process_header` 的生效代码；明确 `#if 0` 中的计时器不是运行路径，不能写成每收到头部字节都重置。继续追踪非缓冲正文、缓冲正文的 `ngx_event_pipe` 赋值及消费，必要时包括升级连接直接读计时点；核查 ready/delayed 等实际条件、设置/刷新/删除及超时出口。区分响应头前可重试与响应已发送后的结束行为，不保证客户端总能收到新的504。 |

共用最小源码集合：`src/http/modules/ngx_http_proxy_module.c`、`src/http/ngx_http_upstream.c` 及相关头文件、`src/http/ngx_http_core_module.c`、`src/core/ngx_resolver.c`、`src/event/ngx_event_connect.c`、`src/event/ngx_event_timer.h`、`src/event/ngx_event_pipe.c`。仅按实际调用补 peer 构造、清理或 Lua setter 证据。已有片段足够时复用；缺少失败回调必须在描述该出口的步骤直接绑定，不能仅加到总 sources。重试描述按源码顺序核实 peer 释放与 tries 判断，不沿用错误叙述。

三项超时须核查 `upstream_timeout_fields` 初始化与全部相关直接消费点。若说明 Lua 可覆盖有效值，只核该版本 balancer setter 的可调用条件、正值判断、写入字段及相对 peer/计时器的时机；从 `analysis/components.json` 冻结该组件 revision 后取证，不扩 Lua API 全集。不单独升级 resolver_timeout、proxy_next_upstream、缓冲、TLS或其他依赖指令。

## 固定来源与补丁边界

所有新增代码和文档片段用本地 `git show <revision>:<file>` 读取，逐字核行号、内容和元数据；不联网，不运行或编译 OpenResty。

| 来源 | 固定对象 |
| --- | --- |
| nginx | `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928` |
| OpenResty | `8c37412c31621225e7aa7e825b5b50106c9c71c4` |
| nginx-docs | `e8b581903e9d41252720053311cea687a5671674` |

独立文档最小范围：`xml/en/docs/http/ngx_http_core_module.xml` 的 resolver及必要resolver_timeout段；`xml/en/docs/http/ngx_http_proxy_module.xml` 的三个timeout段，动态目标条件按需复用proxy_pass段。现有候选坐标分别为resolver 2184–2250、connect 798–810、read 1621–1636、send 1809–1824；实施从固定对象核实完整段，不以文档概述代替内部计时证明。

有效补丁集合固定为 `analysis/NGINX_PATCH_AUDIT.json` 的34项，使用其名称、顺序及固定发行脚本映射；先确认集合仍为34项且revision一致。逐项核对目标文件与本批新增调用片段的交集，详细读相关 hunk，不重做整个发行研究。至少检查 `upstream_timeout_fields`、`upstream_pipelining`、`resolver_conf_parsing`、`safe_resolver_ipv6_option`、`socket_cloexec`、`balancer_status_code`，其他项按实际交集补齐，不能把这个候选短表冒充完整34项核查。记录影响位置或本次片段无直接修改的依据；保留上游与补丁各自原始坐标，不以补丁后行号冒充上游。复用既有补丁回放记录须注明为既有记录。

## 允许字段白名单

实施知识写集合仅为 `knowledge/directives.json` 中上述四个精确身份：

- 新增 `runtime`；追加必要 `evidence`，保留原顺序、ID及全部旧定义，不改旧证据。
- `patch_status.source_ids` 保留旧引用并追加运行代码及适用补丁；`patch_status.note` 仅作本批范围必要补充；`patch_status.status` 固定为 `verified_affected`。
- 默认值、继承、summary、syntax、mechanism、phase、related、配置入口及其他字段均不改；不得手写 verification 晋级。

runtime沿用 `{status,text,steps:[{condition,action,source_ids}],source_ids,corroboration_source_ids}`。每步有真实消费代码，代码并集与步骤引用去重并集精确相等；文档独立列入 corroboration，不混入代码并集。补丁引用覆盖全部运行代码和适用补丁。注册/配置片段改名或裁剪不算运行证据。

特别保护：`prepareKnowledgeFacts` 会将旧式 limitations 字符串自动绑定全部 evidence，新证据可能污染旧事实的 source_ids。当前四项 limitations 已全部是显式对象，本轮无需转换，必须原样保留。若实施输入实际出现旧式字符串，只允许把该项精确固化为本基线发布中的完整 facts 对象，含正文、状态、引用顺序及其他已有键；这是表示转换，不是事实变更。不得重新计算为全 evidence、删旧引用或改构建逻辑规避检查。最终发布 limitations 必须与基线逐字一致。

实际发布四项仅开放 runtime、严格验证后的 sources 增量、上述 patch_status 两字段、派生 verification及正常 release_id变化。verification_notes默认不开放；若构建派生变化，主线程逐项核实并明确限定，不整字段豁免。其他1037项详情仅排除release_id后全等，含原5个deep的全部正文、runtime、sources和评级。

规划角色仅写本文；测试、构建及验收记录由主线程按职责完成。不得改产品src/site、schema、构建脚本、统计或晋级逻辑。

## 验收与交接

1. 实施交付四项限定范围、逐步正文、固定来源、34项补丁交集核查及未决问题。审核逐步核条件、动作、顺序、有效字段和失败出口；遗漏退回修复，修复后复核。结构通过不等于语义通过。
2. 主线程新增本批专项测试，以固定f8c21发布保护全部身份；现有stream测试读取current且断言5deep，应将该历史批次发布检查固定在f8c21，保留精确5deep断言和原语义测试。HTTP历史测试继续固定其历史发布，不放宽为“至少几个”。新批测试独立承担当前发布及全字段比较。
3. 先核实际发布完整sources，再与基线旧sources加固定Git新片段比较；检查ID唯一性、component/version/revision/file/范围/code/URL/kind及无额外来源，不先覆盖code、替换数组或去重后验收。旧evidence与所有旧事实全量保护；补丁状态独立对比固定基线，防止curated与发布同步误改逃逸。
4. 四项分别通过 `validateRuntime`、`deriveVerification`、`validateDetail` 和整份 `validatePublication`。负例覆盖缺runtime、unverified不晋级、伪deep、缺文档、注册/配置完整及裁剪别名、假来源、步骤缺失败回调、补丁漏覆盖、旧事实及旧limitations变化。语义断言从实际步骤绑定的固定片段检查关键计时分支，不仅比较中文关键字或curated自身。
5. 主线程统一 `npm run build`，对真实新发布执行新增专项、`test/runtime.test.mjs`、`test/stream-runtime.test.mjs`、`test/sample-facts.test.mjs` 及 `npm test`，记录真实命令、发布ID和结果。基线156/156为历史记录，不冒称本批结果；构建前针对旧产物的预期失败与新发布结果分开。
6. 精确验收1041 basic（包含deep）、9 deep；bundled 1017 basic/9 deep，department_extension 24 basic/0 deep。9项严格等于旧5项加本轮4项。索引条目只放行四项评级及正常detail_path；顶层只放行正常发布路径、release_id和精确deep派生计数，其余schema、覆盖信息、gaps、顺序及元数据全等。不得修改计数或校验规则凑结果。
7. 主线程负责私有样例和网页回放：A24/24、B258/258、50去重身份、外部引用A2/B1及默认/继承unverified为0的既有行为不退化；本轮HTTP出现次数按已确认20/2/2/2核对。四项Markdown与实际网页的范围、步骤条件/动作/顺序、全部代码及独立文档链接和deep标志与新发布逐字段一致；不展开未知外部文件，不复制私有配置正文。
8. 审核记录明确绑定最终release，确认内容、固定证据、字段边界、测试及主线程样例/网页结果后签署。只声称固定源码静态链路完成，不声称实际OpenResty网络或生产环境已验证。

本轮交付仅 `analysis/SAMPLE_HTTP_TIMEOUT_RUNTIME_PLAN.md`；未改知识、测试或构建，未执行构建、测试、联网、浏览器或私有样例读取，未产生临时文件。
