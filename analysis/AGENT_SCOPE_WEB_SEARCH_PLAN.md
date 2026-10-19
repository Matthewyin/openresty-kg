# Agent 业务范围分支与联网参考：实施方案

日期：2026-10-19。范围：`experiments/pi-sdk` 的统一输入 Agent 与站点 `site/agent.mjs` 的结果展示。主 Agent 负责规划与验收；执行与审核由子 Agent 完成。

## 现状核对（实施前）

- 意图阶段只允许 `config | followup | directive | clarify` 四种动作，工具集为空（`session.mjs` `setActiveToolsByName([])`）。
- 跑题消息不会进入后续模型上下文：`compactHistory` 已把历史中的意图阶段原文替换为“[原输入仅保留在服务端记录]”，非引用的模型输出也被省略。
- 澄清不会替换已有对象：`finish` 只在 `config` / `directive` 时更新 `currentConfig` / `currentSubject`。
- 智谱联网搜索 MCP 已用项目 `.env` 中的 `GLM_API_KEY` 实测可用：地址 `https://open.bigmodel.cn/api/mcp/web_search_prime/mcp`，streamable HTTP，工具名 `web_search_prime`，参数 `search_query`（建议不超过 70 字符）、`search_domain_filter`（单个域名）、`search_recency_filter`、`content_size`、`location`。返回 `result.content[0].text` 是一个再次 JSON 编码的字符串，解码后为 `[{title, link, content, refer}]`。一次调用约 2.2 秒。
- 实测 `search_domain_filter` 不严格：指定 `nginx.org` 仍返回 reddit、stackoverflow 等结果，宿主必须自行按域名过滤。
- 基线：pi-sdk 68 项、根项目 651 项测试通过。

## 第一阶段：业务范围分支

1. 意图契约升级为 `pi-unified-input-v2`，输出固定四个键 `{"action","input","question","ignored"}`。
   - 新动作 `out_of_scope`：与理解 OpenResty/Nginx 配置、指令、源码出处无关的请求（天气、新闻、写代码、执行命令、联网查非配置内容等）。
   - 新动作 `greeting`：问候、感谢、询问“你是谁/能做什么”。
   - `ignored`：布尔值。业务请求里夹带无关请求时为 `true`，`question` 只保留业务部分原文。
2. 宿主处理：`out_of_scope` 和 `greeting` 返回固定话术，状态 `completed`，不加载知识、不调用字段选择、不改变当前配置与对象。
3. 宿主兜底规则只能判定“是业务”，不能判定“不是业务”：
   - 消息是完整配置时，模型输出任何非 `config` 动作仍按现有规则澄清（已存在）。
   - 模型判 `out_of_scope` 但消息中出现当前发布索引收录的精确指令名时，降级为澄清并提示服务范围，不直接拒绝。
4. `ignored=true` 且进入业务查询时，结果附带说明“消息中与配置无关的部分未处理”。
5. 前端：两个新动作只显示固定话术，不显示“本次没有可展示的模型选取”；`ignored` 显示提示。
6. 测试：mock 意图识别天气、写代码、执行命令、联网查天气、问候；“贴配置→问天气→问默认值”三轮中第三轮沿用配置且模型请求不含“天气”；指令名降级；`ignored` 提示；完整配置中的 `weather.example.com` 不被拒绝。
7. 真实模型评测：`scripts/verify-unified-input.mjs --scope`，正例（应进入业务）与反例（应判跑题）分开计数，记录误拒与漏拦。

## 第二阶段：联网参考工具

用户决定：作为 Pi 工具开放，由模型在字段选择阶段决定是否调用；宿主在调用前后强制检查。

1. 开关：`PI_SPIKE_WEB_SEARCH=on` 才启用，默认关闭；Key 取 `PI_SPIKE_WEB_SEARCH_API_KEY`，未设置时沿用 `PI_SPIKE_API_KEY`；地址可由 `PI_SPIKE_WEB_SEARCH_URL` 覆盖。mock 模式使用本地模拟 MCP 端点。
2. 工具 `web_search`：参数 `{query, site}`，`site` 只能是 `nginx.org`、`openresty.org`、`github.com`。宿主作为 MCP 客户端调用 `web_search_prime`。
3. 调用前检查：查询长度、字符范围；拒绝 IP、非白名单域名、URL，以及当前用户配置中出现但不是已收录指令名的词。每次请求最多 2 次调用。被拒或网络失败时返回普通工具结果说明原因，不让整个请求失败。
4. 返回后处理：只保留白名单域名的结果（`github.com` 仅限 `/openresty/` 路径），截断摘要，标注为不可信外部数据。
5. 输出：模型可附加 `web_refs: [{url, quote}]`（最多 3 条）。宿主校验网址来自本次结果、引文是该结果摘要的原文片段；不通过则整份回答作废。网页内容不得进入事实字段。
6. 展示：独立区块“外部参考（未按锁定版本核实）”，标题与站点由宿主提供，链接新标签打开。
7. 未收录指令：开关打开时，按名称查询未收录指令进入字段选择阶段（无候选），允许 `no_candidates` 加 `web_refs`；开关关闭时保持现有澄清。
8. 缓存：调用过联网工具的结果不写缓存；缓存键包含开关状态。
9. 文档：REQUIREMENTS、ARCHITECTURE、IMPLEMENTATION_PLAN、deployment/pi/README 补充外部参考边界与开关。部署变更需用户另行同意。

## 验收

每阶段：执行 Agent 完成后，审核 Agent 独立复核；主 Agent 重跑 pi-sdk 与根项目全部测试，并核对计划条目逐项落实。真实模型评测结果写入 `analysis/`。
