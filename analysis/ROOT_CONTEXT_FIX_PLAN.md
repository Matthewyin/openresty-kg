# 主配置根上下文修复

## 根因与复现

`parseConfig` 的顶层节点始终使用 `null`；`childContext` 仅为根块内的子节点设置槽位。`events {}` 即可复现，包含 worker_processes、worker_cpu_affinity、events、stream、http 的主配置五个顶层节点均为 null。对这些节点显式传 main 后匹配器全部 matched，故不修改匹配规则。

## 最小方案

1. 仅在 `parseConfig` 无结构错误、且存在已完整解析的顶层普通根块时，将顶层节点 context 补为 main。
2. 根块依据复用 `childContext(name, null, true)` 的现有映射，不另列指令名单、不扫描原始文本猜测。
3. 仅补 `parent_index === null` 的节点；保留所有嵌套节点、位置、层级和外部引用元数据。顶层错误放置的 server 应为 main/context_mismatch，其子项仍不可猜为 HTTP。
4. 不改变 parseSingle；仅有 worker_processes、孤立 server/location/listen、未知块、注释或 Lua 正文中的假根块不能触发推断。结构错误不触发根上下文补全。
5. 更新相关旧断言及 README，增加原始失败模式与边界回归。无需新 UI 开关或知识重新采集。

## 验收

- 修复前测试能复现五项顶层未确定，修复后五项 main 且 matched。
- 用户采集文件第 3–73 行主配置：24 项无结构错误，全部匹配，四项 VTS 上下文正确；两个 include 保留 not_analyzed。
- 已有单项、孤立 server、未知嵌套块、HTTP/stream/mail/events 分层逻辑不回退。
- 完整自动测试与构建通过；浏览器实际查询复测完整配置、孤立片段与不完整配置，最终保留用户主配置结果。
- 独立审核按本计划核对；若模型限流，明确记录未完成独立审核，不冒称通过。

## 分工

原定 Astra low 规划限流失败，由主 Agent 接手本方案与复现。Sol high 实施，Astra low 审核；主 Agent 验收构建和实际页面。
