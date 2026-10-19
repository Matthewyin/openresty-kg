# Agent 会话：自动压缩、会话列表与 3 天自动删除（计划）

日期：2026-10-19。执行：Grok 4.7；审核：Sonnet 5.5。

## 背景

- 会话只存服务端 `experiments/pi-sdk/.state/<实例>/`：`sessions/*.jsonl`、`metadata/<id>.json`、`checkpoints/<id>.jsonl`、`cache/<hash>.json`（含会话正文副本）。容器为 Docker 卷 `pi-state`。
- `pruneState`（`src/state-retention.mjs`）已实现按期限清理，但 `retentionEnabled` 默认 false，且只在新请求开始时执行。
- 历史超 `maxHistoryBytes` 直接返回 `history_limit`（`session.mjs` 三处：约 298、407、521 行）。
- 浏览器只保存一个会话 ID（`site/agent.mjs` 的 `remember`），切走后无法回到旧会话。

## 用户决定

1. 不截断会话，采用自动压缩。
2. 增加会话列表，可切换、删除。
3. 会话 3 天无活动自动删除。

## A. 自动压缩（`experiments/pi-sdk/src/session.mjs`）

- 新增导出 `budgetHistory(messages, budget, keepTurns = 4)`，在 `compactHistory` 之后执行：
  - 若 `JSON.stringify(messages)` 字节数 ≤ budget，原样返回。
  - 否则以 user 消息为轮次边界，保留最后 `keepTurns` 轮（最后一个 user 消息所在轮必须保留），把更早的轮次合成**一条**宿主生成的 user 消息：
    `{"historical":true,"digest":true,"turns":N,"subjects":[{name, entryIds}], "fields":[{entryId, field}]}`
    —— 内容只取自已压缩消息里的 `identity`、toolResult 的 `entryIds`、assistant 的 `facts`；不调用模型，不保留任何原文、问题文本、web 查询词。
  - 去重；`subjects`/`fields` 各自上限（例如 50 条），保证摘要本身有界。
  - 仍超预算时逐步减少 `keepTurns`（最少 1，即只保留当前轮）。
  - 必须从 user 边界整轮切分，不得拆开 assistant toolCall 与对应 toolResult。
- 预算：新增配置 `compactHistoryBytes`（默认 65536，必须 < `maxHistoryBytes`），走 `runtime-config.mjs` 的 `PI_SPIKE_COMPACT_HISTORY_BYTES`，在 `loadConfig` 校验为正整数。
- 接入点：
  - `transformContext`：`budgetHistory(compactHistory(...), config.compactHistoryBytes)`。
  - 407 行与 521 行的 `previousHistory` 预检查改用压缩后的结果；压缩后仍超 `maxHistoryBytes`（仅当本轮提示自身过大）才报 `history_limit`，提示改为“本轮输入过大，请缩短问题”。
  - `onPayload` 的硬上限保留，作为最后防线。
- 原始 JSONL 不改动；压缩只影响发给模型的内容。

## B. 3 天自动删除

- `config.json`、`deployment.example.json`：`retentionEnabled: true`，`sessionTtlMs: 259200000`，`cacheTtlMs: 259200000`（缓存含会话正文副本，期限不得长于会话）。
- `loadConfig` 校验：`retentionEnabled` 为 true 时要求 `cacheTtlMs <= sessionTtlMs`。
- 周期清理：`Spike` 新增 `maintain()`：`running`/`restoring`/`closing` 时跳过；否则调用 `pruneState`。`Spike.create` 后启动 `setInterval(..., 3600000).unref()`（间隔配置 `pruneIntervalMs` 默认 3600000，测试可调），`close()` 清除定时器。异常只记日志（`logRequests` 时）不终止进程，日志不得含路径、会话内容。
- `/api/status` 增加 `sessionTtlMs` 与 `retentionEnabled`，供前端显示剩余时间。
- 现有测试中依赖 `retentionEnabled: false` 默认值的（如 lifecycle、launch-config）要显式传参，而不是删测试。

## C. 删除会话接口

- `server.mjs`：`DELETE /api/sessions/:id` → `spike.deleteSession(id)`，返回 `{deleted:true}`；同源检查沿用现有逻辑。
- `Spike.deleteSession(id)`：
  - 运行中或恢复中返回 409 `busy`。
  - 读取 metadata（不存在则返回 `{deleted:false}`，不报错，保证幂等）。
  - 删除 `meta.file`（必须经现有 `manager()` 越界校验同样规则：位于 `sessions/` 内且以 `.jsonl` 结尾）、`checkpoints/<id>.jsonl`、metadata，以及 metadata 中 `cacheKeys` 列出的缓存文件（键须匹配 `^[a-f0-9]{64}$`）。
- 为支持按会话删缓存：`finish` 写缓存成功后、缓存命中路径写 metadata 时，把 key 追加到 metadata 的 `cacheKeys`（去重，上限 50）。缓存可被多个会话共享，删除只造成下次重算，不影响正确性。

## D. 前端会话列表（`site/index.html`、`site/agent.mjs`、`site/styles.css`）

- localStorage 新键 `${storageKey}:list`：数组 `[{id, title, updatedAt}]`，最多 20 条，按 `updatedAt` 倒序；解析失败或格式不符即视为空。
- `title`：提交时取当前对象名（`currentSubject` 中的指令名）或用户消息首行前 30 个字符；只存在用户自己的浏览器里。
- 每次提交成功拿到 `sessionId`、恢复成功时更新列表项的 `updatedAt`。
- 界面：在会话行下方加可折叠的“历史会话”列表（`<details>`），每项显示标题、最近时间、剩余天数（`sessionTtlMs - (now - updatedAt)`；retention 关闭时不显示）、“切换”“删除”按钮；当前会话高亮。
- 切换：设置 `sessionId` 后调用现有 `restore()`；运行中禁用。恢复返回 404 `session_unavailable` 时从列表移除并提示“会话已过期”。
- 删除：调用 DELETE 接口，成功后从列表移除；删除的是当前会话则等同“新会话”。
- 已过期（按本地时间算）的项显示“已过期”并可直接移除。
- 所有标题用 `textContent` 渲染，禁止 innerHTML。

## E. 测试

- `experiments/pi-sdk/test/`：
  - `budgetHistory`：未超预算原样；超预算生成单条 digest 且保留最近轮次；不拆 toolCall/toolResult；digest 不含原文、问题、web 参数；逐步降到只剩当前轮。
  - 长会话不再返回 `history_limit`（把原有两个 `history_limit` 测试改为：小 `compactHistoryBytes` 时请求成功，只有单轮自身超 `maxHistoryBytes` 才报错）。
  - `maintain()` 在忙碌时跳过；定时器 `close()` 后清除。
  - `deleteSession`：删文件、checkpoint、metadata、cacheKeys；幂等；越界 file 拒绝；忙碌 409。
  - 配置校验：`cacheTtlMs > sessionTtlMs` 且 retention 开启时拒绝。
- `test/agent-ui.test.mjs`：列表增、更新、上限 20、删除、过期显示、标题 textContent。
- 全部 `npm test`（根目录与 `experiments/pi-sdk`）通过；`npm run build` 重建 `dist/`。

## F. 文档

- `experiments/pi-sdk/DEPLOYMENT.md`：`maxHistoryBytes`、`retentionEnabled`、TTL 行改为新默认与压缩语义，新增 `compactHistoryBytes`、`pruneIntervalMs`。
- `ARCHITECTURE.md`、`REQUIREMENTS.md`、`IMPLEMENTATION_PLAN.md`（2026-10-19 节追加本项）、`deployment/pi/README.md`（说明 3 天自动删除、卷内数据会被定期清理）。
- 同时补上已完成的“相近名称建议”说明（REQUIREMENTS/IMPLEMENTATION_PLAN）。

## 约束

- 不提交、不推送、不改动正在运行的容器。
- 不打印、不写入任何 Key；测试与脚本输出不含本机绝对路径。
- 不删除 `.state` 下现有用户数据（测试使用临时目录）。
- `experiments/pi-sdk/artifacts/trace.jsonl` 测试后用 `git checkout` 还原。
