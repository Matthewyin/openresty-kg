# Pi SDK 最小接入验证

当前项目的目标与统一架构分别见 [需求基线](../../REQUIREMENTS.md) 和 [架构说明](../../ARCHITECTURE.md)。本文保留独立实验入口与SDK操作细节；原网站已通过根目录 `npm run agent` 复用此实现，不代表部门部署或通用Harness平台已经完成。

本地部署适配的配置优先级、公开地址、容量/保留策略及停写备份操作见 [DEPLOYMENT.md](DEPLOYMENT.md)。以下旧实验入口仍保留；新增运行配置通过显式 `--config-file` 传入，不修改个人Pi或自动读取其他凭据。

本实验验证现有 OpenResty 知识查询能否接入真实 Pi coding-agent SDK。仅在本目录运行；不替换网站，不执行 nginx，不读取桌面配置，不展开 include/Lua 文件。

## 运行

要求 Node >=22.19.0。复用已安装的两包 1.2.0 和锁文件，不改 SDK 版本。

```sh
cd experiments/pi-sdk
npm test
npm start
```

默认页面：<http://127.0.0.1:51806/>。`config.json` 配置端口、路径、超时、mock 延迟和详情链接基址；站点预览不必启动，知识文件通过本地只读快照访问。默认状态为 `.state/server/`，测试和其他实例使用其兄弟目录，彼此不扫描。

`loadConfig` 与启动器支持 `PI_SPIKE_STATE_DIR` 和 `PI_SPIKE_TIMEOUT_MS`；状态路径必须在实验 `.state/` 内，超时必须为正整数毫秒。

`npm start` / `npm test` 通过 `run.mjs` 建立独立子进程，只传明确的专用模型环境变量和必要运行路径，不继承个人模型凭据环境变量。不要绕过此入口直接启动服务。测试强制 mock，不传 live 凭据。

可单独覆盖端口和知识站导航基址：

```sh
PI_SPIKE_PORT=51807 PI_SPIKE_SITE_BASE=http://127.0.0.1:51795/ npm start
```

页面选择合成 events、stream、VTS、孤立 server、map 或错误配置后提交。追问沿用会话 ID；新会话保持配置与问题不变，可观察精确缓存。取消等待 SDK abort 完成；刷新或重启后输入会话 ID 并恢复，可继续追问。恢复只回到最后完整轮次，不续传半个 token 或未配对的工具调用。知识内容变化后不向模型重放旧知识上下文。

## 真实模型入口与验证边界

用户明确指定的项目根 `.env` 可通过以下入口读取；不会自动寻找其他环境文件，不依赖本机全局 Pi：

```sh
npm run live:check -- --env-file ../../.env
npm run live -- --env-file ../../.env
```

第一条执行真实模型验收，第二条打开真实模型验证服务（默认 `http://127.0.0.1:51807/`）。`live.config.json` 映射 `base-url`、`MODEL`、`PROVIDER`、`GLM_API_KEY` 到专用环境变量，并配置独立 `.state/live`、端口、超时和输出预算。密钥只在服务进程内使用，不作为命令参数、API 响应或验收产物写出；外部错误文本统一替换已知密钥。`npm test` 始终强制 mock，不读取真实 `.env`。

真实运行结果见 `artifacts/live-verification.json`；失败记录也保留失败状态，不能把有文件理解为通过。GLM 首次实际返回完整 JSON Markdown 围栏，因此解码器只兼容裸 JSON 或完整单个 `json` 围栏，仍拒绝前后解释、多个围栏、坏 JSON 和无效引用。所有 live 输入均为合成脱敏样例，不读取用户原始配置。

mock 是实验进程独立启动的本地 OpenAI-compatible HTTP SSE 服务，由已安装 SDK provider 解码，再由真实 agent loop 完成字段选择，两个只读工具保留按需调用。它依据协议编排预期调用，不模拟模型推理，不证明理解、自由解释、工具选择质量或任意追问回答质量。真实模型结果与 mock 分开记录。

当前 `pi-spike-report-v2` 契约只允许模型输出紧凑的 `facts:[{entryId,field}]`，不包含正文、源码或自填引用。宿主预解析一次配置并持有已校验候选详情；模型仅收到当前问题、候选身份、字段和证据 ID 索引，通常一次往返、不调用工具。没有问题的请求只返回全量基础报告，provider 请求为零；有问题且未命中缓存时仍由真实 SDK 请求模型，不能把两者混为同一次模型提速。超出字段范围的问题返回 `status:unsupported`、`awaiting_input`，不生成自由结论。空引用、未知身份/字段和额外正文不能完成。

以下专用变量是 live 接口，启动器按显式文件映射。代码只实现 `openai-completions` 兼容接入；其他协议不在本轮内。兼容字段在 `config.json` 的 `compat` 中按实际服务调整。不要从个人 Pi 设置补凭据。

需要显式提供：`PI_SPIKE_MODE=live`、`PI_SPIKE_BASE_URL`（服务要求的基路径）、`PI_SPIKE_API_KEY`、`PI_SPIKE_MODEL`、`PI_SPIKE_CONTEXT_WINDOW`、`PI_SPIKE_MAX_TOKENS`。live 模式缺少任何一项就拒绝启动；不会自动请求模型列表或扫描凭据。输出预算不是对服务最大能力的承诺；本轮只检验固定小样例的接入与事实引用，不代表自由问答质量全面通过。

## 实现与隔离

- 精确活动工具只有 `analyze_config` 和 `query_knowledge`。前者只读已解析摘要，不接受配置、不重复解析；后者只查询当前候选的短字段摘要与证据 ID，可一次批量查询，不返回完整详情/源码。不提供 shell、任意文件读写、MCP 或任意 URL 工具。
- 自定义空 ResourceLoader；settings、credentials、modelsStore 全部显式内存实例。modelsPath 为 null，authPath/cwd/agentDir/SessionManager 目录均明确指定在实例状态目录。禁用压缩、重试、预热、目录发现和外部模型目录刷新。
- 状态目录及其祖先/子目录禁止符号链接；服务端只接受会话 ID，不接受文件路径。仅监听回环地址，写入 API 只收 JSON 并拒绝跨站 Origin。
- 知识加载复用原 validateIndex/getDetail，并读取所选发布全部索引内文件的实际内容计算 hash，不以 mtime 替代。内容未变时复用已解析快照与校验详情；请求期间固定同一内存快照。可指定当前或历史 release，不存在或不一致即拒绝，绝不回退当前发布。逻辑 HTTP 地址只映射受限本地快照，不发知识网络请求；未索引文件不影响摘要，越界路径及任意 URL 均拒绝。
- 缓存键包含精确配置/问题/解析模式/上下文/模块、会话完整有效上下文、知识文件排序内容摘要、SDK 锁版本及实现内容、系统提示词/报告契约、模型/服务/输出限制及兼容设置。只原子保存 completed 报告和完成会话快照；命中不调用 SDK/provider，追问会打开独立复制的真实 SDK 会话。awaiting_input、failed、cancelled 不写完成缓存。
- 页面按条目显示状态、功能、默认值、继承、限制与固定源码锚点；模型选择分区，完整 JSON 仅作调试。所有内容用 textContent，链接仅 HTTP(S)，详情导航携带 id 与 release。
- 原始 SDK 会话和用户记录保留；`transformContext` 仅在模型侧压缩历史，将旧工具全文/事实正文替换为问题、身份和字段引用，不清空上下文。旧契约通过 `contractChanged` 明示，旧缓存由契约与代码 hash 失效；历史身份不作为当前发布事实。

## API（便于主 agent 验收）

- `GET /api/status`：mock/live、工具列表、详情站基址。
- `POST /api/run`：`{"request":{"input":"events {}","mode":"main","question":"依据？","context":"","module":""}}`。mode 支持 `main|fragment|single`，single 直接复用原 `parseSingle` 与 matcher，不拼接配置；网站的 config 模式由调用方映射为 fragment。可选 `request.release` 固定当前/历史发布，可带顶层 sessionId 继续会话，返回 requestId。
- `GET /api/jobs/<requestId>`：保留 items/parsed/matches/questions/modelSelection。预加载完成即可得到 `state:running,phase:basic` 的全量基础报告，随后才完成模型选取；取消/失败可能保留基础报告，不表示模型成功。
- `POST /api/cancel`：`{"requestId":"..."}`，等待 SDK abort。
- `GET /api/sessions/<sessionId>`：恢复请求与上下文条数、知识变化提示；运行中拒绝恢复。

串行单实例即可，无并行任务队列。请求或服务中断会丢弃未完成轮次，但保留最后完整检查点。`artifacts/trace.jsonl` 是测试生成的脱敏审查证据；`.state/` 是专用运行状态。

`modelSelection.facts` 保持模型原始短引用；`resolvedFacts` 由宿主补齐 `{entryId,field,value,text,status,source_ids}`；`citations` 仅从所选字段的 source_ids 导出原文、固定 revision 和真实源码链接。字段支持 `summary|syntax|defaults|inheritance|limitations|runtime`。limitations 的 value 保留逐项状态与来源，runtime 的 value 保留完整步骤/交叉证据；没有字段级证据的字符串字段保持 unverified，不借任意 registration 充当证明。空数组/null 正文可以显示为缺内容，但单独选择它们不能完成回答。

`metrics` 提供 `stages`（snapshotMs/parseMs/preloadMs/basicReportMs/cacheMs/sdkSetupMs/modelMs/validateHydrateMs/commitMs）、`totalMs`、`modelRoundTrips`、`sdkTurns`、`toolCalls`、`knowledgeFilesRead`、每次请求的 `rounds`，以及服务端实际返回时的 `usage`（否则 null）。总耗时与超时从请求启动计算，包含 host 工作。`inputBytes` 是实际 provider JSON 请求的累计 UTF-8 字节，`outputBytes` 是解码后模型内容（含工具调用）的累计 UTF-8 字节，`finalOutputBytes` 是最后模型原始文本（含模型自行添加的空白/围栏）的字节；都不冒充 tokens，也不计入宿主补全正文或 HTTP/SSE 包装。精确缓存命中保持本次计量为零，不沿用生成缓存时的计量。`live-check.mjs` 对两个指定追问检查未命中、真实请求和总耗时≤20秒；真实 GLM 测速由 main 执行，本实验 mock 回归不替代 live 验收。

## 验证层级

自动测试覆盖五项正负例，结果见 [artifacts/verification.md](artifacts/verification.md)。测试不会修改 dist 或原源码，知识变更测试只使用实验副本，结束清理临时目录。

源码依据校验限发布内 entry/source ID、固定 revision、源码锚点和片段原文一致性；不重新拉取源码，不证明现场安装、参数、连通性或运行有效。浏览器可读性与真实模型必须分别验收，不能由 HTTP 成功或 mock 测试代替。
