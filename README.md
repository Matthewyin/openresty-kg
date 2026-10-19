# OpenResty 配置知识站

本机容器入口现为 `http://<本机当前IPv4>:30000/pi/`，使用原网站账号登录后进入。动态IPv4适配与切换已执行，真实登录后的完整验收仍待完成，见[本批记录](analysis/PI_DYNAMIC_IP_VERIFICATION.md)。网站地址不是Pi API地址；浏览器无需安装Agent。换网使用新IP，可能需重新登录。

## 文档入口

网站顶栏的「▶ 使用教程」可在新标签页观看约3分30秒的视频，介绍界面、提问入口和结果阅读；当前使用用户重新导出的`OpenResty-study.mp4`修复版。网页媒体位于`site/media/openresty-tutorial.mp4`，随构建和部署打包复制，详见[入口验收](analysis/TUTORIAL_VIDEO_VERIFICATION.md)。

| 要了解的内容 | 现行文档 |
| --- | --- |
| 网站怎么用（面向使用者） | [用户使用手册](USER_GUIDE.md) |
| 目标、范围及旧决策调整 | [需求基线](REQUIREMENTS.md) |
| 网站、服务端Pi、知识、会话与缓存如何协作 | [统一架构](ARCHITECTURE.md) |
| 已完成、待设计和暂缓事项 | [实施状态与计划](IMPLEMENTATION_PLAN.md) |
| 网站与服务端Pi如何一起部署、需要先补什么 | [联合部署方案](analysis/PI_DEPLOYMENT_PLAN.md)，服务器尚未部署 |
| 本地部署适配的配置、容量、备份与测试 | [运行说明](experiments/pi-sdk/DEPLOYMENT.md)、[本批验收](analysis/PI_LOCAL_ADAPTATION_VERIFICATION.md)；服务器未部署 |
| 复用现有OpenResty的`/pi/`容器适配 | [专项计划](analysis/PI_OPENRESTY_SUBPATH_PLAN.md)、[本批验收](analysis/PI_OPENRESTY_SUBPATH_VERIFICATION.md)、[容器与隔离测试说明](deployment/pi/README.md)；原入口切换待确认 |
| 开发任务的项目上下文 | [AGENTS.md](AGENTS.md)；CLAUDE仅作兼容入口 |
| 早期方案原文 | [历史归档](analysis/history/README.md)，不作为现行约束 |

服务端Pi本机接入及提速已验收，见 [验收记录](analysis/PI_AGENT_SPEED_VERIFICATION.md)。本批部署所需的本地适配与测试已完成，部门服务器环境待确认、未执行部署；共享成果检索仍待设计。现场配置有效性不是网站目标，Codex真实接入暂缓。以下运行说明区分静态查询、可选Pi和兼容保留的MCP入口。

## 项目与知识内容

部门内部的配置知识查询工具，锁定 OpenResty 1.27.1.1。网站与本地 MCP 共用解析、匹配和版本化知识。基础查询是独立静态网站；可选的项目内 Pi 服务提供按问题选取知识与源码依据，不使用数据库，不替换原有查询。

当前内容（2026-10-15）：固定发行范围43组件、1017项基础说明，部门扩展VTS按固定commit收录24项，合计1041项基础内容、44项限定范围的深度内容、8项独立参考；发行/扩展深度分别40/4。当前发布标识以`dist/knowledge/index.json`为准。基础评级不表示每个补充字段已核实，深度评级不表示整条指令的全部场景已验证；以具体字段和来源为准。目录收录不表示现场安装或兼容性已验证。

两份部门样例涉及50个知识身份：44项限定运行时链及6项配置边界已核对，固定剩余25项清单已清零。六项为include、events、http、stream及HTTP/stream各自的variables_hash_bucket_size，保持basic，不要求虚构运行时链；详见`analysis/SAMPLE_CONFIGURATION_BOUNDARIES.md`。内容批次的247项全量测试、两份原样例和25项桌面验收见`analysis/SAMPLE_FINAL25_RUNTIME_VERIFICATION.md`及REVIEW。本轮解析边界、可选示例加载和状态提示修复另见`analysis/WEBSITE_RELIABILITY_PLAN.md`及其VERIFICATION/REVIEW；不沿用历史测试数冒称本轮结果。

功能与语法字段级证据已完成（2026-10-17）：1041项×2字段共2082处均由源码片段逐字段登记为已核实，新增860个片段，审核过的修正119处（原文与理由保留在字段证据的`correction`中）。当前发布为`1.27.1.1-20040b374943dabc`，本机`npm test`651/651、pi-sdk 68/68、部署测试4/4。范围、审核尺度、各批记录见`analysis/FIELD_EVIDENCE_VERIFICATION.md`与`analysis/field-evidence/`，覆盖数据在`knowledge/field-evidence/`。适用条件、废弃状态、模块依赖不在该批范围，详情页仍可能显示“未核实”或“尚未记录”。使用说明见[用户使用手册](USER_GUIDE.md)。

默认值与继承补证已完成（2026-10-15）：冻结清单340个身份、537个字段（225默认值、312继承）逐项通过源码审核及引用复核；本发布默认值或继承未核实项为0，不适用项均保留原因。该批发布`1.27.1.1-f43ab3d7392bdcc9`（历史发布，现已被上述发布取代）当时通过613项自动测试及340详情真实桌面核对，两份原样例保持24/24、258/258唯一匹配。范围、审核、验收及页面记录见`analysis/DEFAULTS_340_MANIFEST.json`、`analysis/DEFAULTS_340_VERIFICATION.md`、`analysis/defaults-340-browser-final.json`。这不将全部条目晋级为深度内容，也不把适用条件或现场启用自动改为已核实。现场版本、模块安装与实际运行不属于本站验收；内网部署尚未实施，Codex真实接入暂缓。历史发行/扩展批次记录保留在`analysis/WEBSITE_COMPLETION_VERIFICATION.md`和`analysis/EXTENSION_MODULE_VERIFICATION.md`。

历史可靠性批次（不是当前发布）：`1.27.1.1-f9f6f0ffb7eba3d8`曾通过268项测试及正常/示例故障桌面验收，1041项知识事实保持原样。Lua修复仅用于文本块边界；固定LuaJIT和lua-nginx配置块词法器不完全等价，不把网站解析成功当作原生配置加载成功，已知边界见`analysis/WEBSITE_RELIABILITY_PARSER_EVIDENCE.md`。

网站补充关联指令导航、单项外部文件未分析提示及独立 API/变量参考浏览。`knowledge/references.json` 的参考数据与源码证据进入同一不可变发布，计数独立，不参与配置匹配；旧发布未提供参考库时配置查询仍可用。本批 8 个参考样例不代表全量内容完成，功能验收见 `analysis/WEBSITE_PLAN.md` 与 `analysis/WEBSITE_REVIEW.md`。

## 构建与打开

基础查询构建要求 Node.js 22 或更新版本；可选Pi运行要求 Node.js >=22.19.0。来源、锁定 tag/commit 和路径见 `project.config.json`。发行来源必须与配置中的 tag 一致，扩展来源必须与完整 revision 和 repository 一致。

```sh
npm ci --ignore-scripts
npm run inventory
npm run build
npm test
npm run preview
```

只校验、不落盘（不写`dist`与`analysis/coverage.json`）可用 `node scripts/build.mjs --config project.config.json --check`，输出各批字段证据的已核实/未核实计数，修改`knowledge/field-evidence/`后建议先运行。

打开最后一条命令输出的 HTTP 地址。预览仅监听本机，默认使用 51795 端口、2 小时后自动结束，Ctrl+C 可提前结束；地址端口和持续时间由 `project.config.json` 的 `preview` 配置传入。它只用于临时查看，不是业务后端或部署服务。服务结束后，在项目目录重新运行 `npm run preview` 即可恢复同一地址。

不能直接双击 `site/index.html` 或 `dist/index.html`：`file://` 无法可靠加载模块和知识 JSON。`site/` 是源码目录；应托管整个构建后的 `dist/`，保留 `src/`、知识索引及不可变发布详情的目录结构。仅部署基础查询时可使用现有内网静态 Web 服务；包含Agent的部门部署仍需按 [架构说明](ARCHITECTURE.md) 单独设计，本项目没有自动部署内网。

输入 `events { multi_accept on; worker_connections 65535; }` 时，选择“配置片段 / 自动识别根块”，再点击“识别并查询”。根块应在 `main` context 唯一匹配，块内两项应在 `events` context 唯一匹配；点击对应模块按钮查看详情和源码。默认片段模式仅当文本无结构错误且包含顶层普通根块 `events`、`http`、`stream` 或 `mail` 时，才将顶层指令确定为 `main`；注释、Lua 正文、同名分号指令和未知嵌套块不作为根块证据。也可主动选择“完整主配置（顶层为 main）”，在无结构错误时按此声明确定顶层，即使没有根块；该模式不补外层、不展开文件、不向未知后代传播上下文。孤立 server/location 或 include 文件片段应选择片段模式。单项模式不受此推断影响，只接受名称、单条普通配置或一个完整 Lua 配置块。

查询后目录只显示本次输入的候选，按知识身份去重，包含仅注册信息；多条或存在歧义时，在候选中选择要查看的条目。修改输入会立即清除本地解析的旧结果；Agent 的回答作为对话流保留，追问时不会消失。只有点击“浏览全部目录”才进入全站浏览与筛选，不把其中的条目当成本次配置结果。孤立 `server { ... }` 不猜 HTTP/stream，请保留实际的外层块后查询。

在已确定且适用的上下文中，`map`、`geo`、`types`、`split_clients`、`charset_map` 的数据和控制项单独显示，不参与普通指令匹配；保留来源位置与块路径，不核验地址、百分比、字符编码、参数及规则语义。只有前三类支持的 `include` 记录外部引用，后两类中的同名文本不被当作文件引用；HTTP/stream 的控制项分别识别，`charset_map` 仅在 HTTP main 中分类。这五类块拒绝嵌套开块（包括 Lua 名称），未知上下文及其他自定义块仍按保守规则处理，不能据此宣称全部特殊块已支持。结果分别统计普通指令（含块头）、唯一匹配、需关注、块内条目与未分析外部引用；这些数字按出现次数计算，不等于去重后的目录数量。“仅看需关注项（含外部引用）”保留未唯一匹配、不完整条目和未分析的外部引用；同一行只显示一次，不改变总统计、解析错误或候选目录。修改输入或模式后，本地解析的旧结果及筛选状态清空；来自 Agent 的右侧结果保留并标注“此处为上一次识别出的对象，不一定对应当前输入框的内容”。

匹配只确定知识身份，不验证参数或配置安全；例如成功识别 `worker_connections 65535`，不表示该参数适合运行环境。缺少外层 context 不猜测；include、外部 Lua 和变量均不读取或求值。

原 events 片段涉及的 `multi_accept`、`worker_connections` 已补功能、默认值、限制与补丁证据，另补 `worker_processes`、`accept_mutex`、`accept_mutex_delay`。本轮补齐 XSS 六项、核心/事件35项、Echo/Headers More22项、两个发行补丁指令和HTTP核心57项基础内容。`no_error_pages` 取消继承的自定义错误页映射，不表示错误响应没有正文；`echo_abort_parent` 在固定版本未接入有效执行分派；`client_header_timeout` 超时关闭不保证发送408响应报文。43组件分别完成22个正式构建注册、8个运行时/库/工具用途和13个Lua参考库范围核对，结合Nginx及Redis有效补丁门禁，目录范围独立验收通过。全1017项基础说明已接入当前发布，覆盖Nginx原生及发行第三方配置模块；未知默认/继承不伪造为已核实。此前 NDK 批次记录保留为历史依据；本轮计划、实测及独立审核见 `analysis/WEBSITE_COMPLETION_PLAN.md`、`analysis/WEBSITE_COMPLETION_VERIFICATION.md`、`analysis/WEBSITE_COMPLETION_REVIEW.md`。按用户最新决定，当前不做手机页面验收。

## Agent 读取接口

### 可选的服务端 Pi

先构建网站，再在项目根运行 `npm run agent`，打开输出的本机地址（默认 `http://127.0.0.1:51808/`）。Pi SDK 仅安装在 `experiments/pi-sdk/node_modules`；重新安装使用 `npm ci --prefix experiments/pi-sdk --ignore-scripts`，不安装全局 Pi。模型服务由根目录 `.env` 提供，映射和本机端口见 `experiments/pi-sdk/live.config.json`；不会读取个人 Pi 设置。

页面只保留一个消息框，直接粘贴配置、写指令问题，或把配置和问题写在一起，然后点“提交给 Agent”。纯配置默认查看功能、限制及实现；后续在同一框写“刚才这份配置的默认值呢？”即可追问。换独立话题用“新会话”；刷新后用“恢复会话”。结果中的“本次识别的配置 / 指令”或“本次沿用的配置”可展开核对。

配置与问题混合时，建议把一份完整配置放在一个 Markdown 代码块中；多个独立代码块会要求合并或分别提交。没有 `events/http/stream` 等根块、但确实属于 main 顶层的配置，可在配置前单独写“这是完整主配置。”或“按 main 模式解析。”；仅声明时仍展示默认知识，不要求另问问题。孤立 server/location 仍需提供真实外层，不自动补造。一次自然语言名称查询支持一个指令，多个名称可分别查询或提供连续配置。

提交会把完整消息（含配置原文）交给服务端 Pi，并可能发送给 `.env` 指定的模型，输入未自动脱敏。Pi 先理解意图，再复用现有解析与固定发布知识；事实和源码由服务端补齐，不由模型自由生成。纯配置通常一次意图调用后展示默认字段，有问题通常为意图及字段选择两次调用；精确缓存命中不调用模型，旧 API 无问题路径仍为零模型。支持取消与恢复。当前真实服务采用 `live.config.json` 的 `thinkingLevel: low`，可用 `PI_SPIKE_THINKING_LEVEL` 覆盖为供应端支持的级别。

不需要 Agent 时，展开“仅本地查询 / 手动指定解析方式”，使用同一框输入纯配置或指令名称，再点“仅本地识别并查询”；这条路径不发送配置到服务端。折叠选项只影响本地查询。Agent 不可用时目录、知识详情、参考浏览和本地查询仍可用。若页面提示“Agent 需要更新”，停止旧的本地进程后重新运行 `npm run agent`。

真实模型专项验证：`node scripts/verify-unified-input.mjs --env-file .env`。它只使用合成配置和独立临时状态目录，完成后清理测试会话，结果写入 `analysis/PI_UNIFIED_INPUT_LIVE_RESULTS.json`。追加 `--edge` 验证主配置声明、原文保真、多围栏及配置注释边界，记录到独立的 EDGE_RESULTS 文件。追加 `--scope` 验证跑题、问候与混合问题的分支（误拒与漏拦分开计数），追加 `--web` 打开联网参考并验证防泄露与结果白名单，结果分别写入 SCOPE_RESULTS 与 `PI_WEB_SEARCH_LIVE_RESULTS.json`。追加 `--serve` 可启动随机回环端口用于隔离桌面验收，按 Ctrl+C 清理并停止；不占用正常的51808端口或用户会话。

默认服务仅绑定本机，同源提供 `dist` 与 API，不公开项目目录、`.env` 或会话文件。容器候选可以显式配置host、publicOrigin和basePath，但不等于已经开放原内网入口；见[容器适配说明](deployment/pi/README.md)。共享检索成果库和多用户管理不属于本次接入范围。

### 原有 MCP 接口（兼容保留，非当前主接入路径）

网站提供只读静态 GET 文件：

- `knowledge/index.json`：当前完整索引。
- `knowledge/releases/<release_id>/index.json`：固定发布索引。
- `knowledge/releases/<release_id>/directives/<id>.json`：固定发布详情。
- `knowledge/releases/<release_id>/references.json`：API/变量参考库；只有固定索引声明 `references_path` 时读取，旧发布不回退到新参考库。

名称、context、模块在调用方本地匹配。知识站不接收原始配置或参数；一次查询使用同一索引快照。详情包含源码完整 revision、文件、行号、原文片段及核实状态。

本地 MCP 使用 stdio，只提供 `query_directive`，返回 JSON、Markdown 和网站详情链接，不开放 HTTP 监听。

```sh
KNOWLEDGE_SITE_URL="https://你的内网站点/" npm run mcp
```

此命令等待 MCP 协议输入，不是命令行问答。Codex 的接入配置示例：

```toml
[mcp_servers.openresty_knowledge]
command = "node"
args = ["/项目绝对路径/mcp/server.mjs", "--config", "/项目绝对路径/project.config.json"]

[mcp_servers.openresty_knowledge.env]
KNOWLEDGE_SITE_URL = "https://你的内网站点/"
```

将示例路径和地址替换为实际值。没有自动修改用户的 Codex 配置。工具参数为 `input`，可选 `context` 和 `module`；HTTP Lua 查询可给 `context="http"`、`module="ngx_http_lua_module"`。同名 HTTP/stream 候选不自动择优；纯名称缺 context 的唯一候选只返回知识预览。

Agent 宿主已接收用户输入；“不上传”仅指本工具发往知识站的 HTTP 请求。工具协议测试使用官方 SDK 的真实 stdio 子进程；不替代 Codex 宿主的实际接入验收。

## 内容与检查

当前发布使用 schema 2：每个索引项与详情携带一致的 `source`，`coverage.groups` 分开表示 `bundled` 与 `department_extension`；顶层计数为二者合计，顶层 `inventory_complete` 为两个范围均完成。新版页面、匹配器、知识客户端和 MCP 输出支持 schema 2，并继续读取合法的历史 schema 1 发行发布。schema 1 不允许携带扩展身份，旧页面不得用于解释 schema 2。

`department_extensions` 配置部门扩展来源，默认空集合；`knowledge/extensions.json` 保存扩展基础内容。首批来源为 `vozlt/nginx-module-vts` 的 commit `52fe11e44c47a49b052be89e36dfa17d81bf52a5`，标为 commit 快照，头文件的 v0.2.7 不作为发布 tag 或现场版本。扩展的 `patch_status=not_applicable` 仅表示独立上游快照不属于本知识库的发行补丁处理范围，不表示现场没有补丁或已兼容 OpenResty。

后续模块按固定源码接入：确认官方仓库与完整 commit，准备对应本地源码；在 `department_extensions` 添加来源、快照版本和 `registration_build`；按正式注册集合补扩展知识及证据；运行 inventory、build、测试及查询验收后发布。采集器只读取固定 Git 对象，不联网拉 latest，也不执行模块 config。扩展组件不得与发行组件重名；同组件不能混用来源或 commit。取消扩展配置并重新盘点、构建后，新索引不携带残留扩展；历史发布保留可查。隔离第二模块接入与回退见 `test/extensions.test.mjs`。

`department_sample_status` 驱动样例接收及待验收提示。本次已收到两份样例，接收记录见 `analysis/DEPARTMENT_SAMPLE_INTAKE.md`，不在公开知识中复制样例中的业务地址。

`knowledge/directives.json` 保存人工核对内容；机械注册盘点放在 `analysis/`。构建从固定 Git revision 读取源码片段，不引用工作树未提交改动。`registration_only` 不计为基础完成。

知识变化默认产生内容哈希发布标识；也可通过 `KNOWLEDGE_RELEASE_ID` 或配置的 `release_id` 指定。同一标识不能覆盖不同内容。发布时先上传完整新发布目录，再更新当前索引；保留旧发布以维持详情链接。页面代码和当前索引应作为一批发布。

覆盖缺口见 `analysis/coverage.json`；需求与阶段验收见 `REQUIREMENTS.md`、`IMPLEMENTATION_PLAN.md`；具体接口见 `analysis/EXECUTION_PLAN.md`，审核结果见 `analysis/REVIEW.md`。

本次目录/详情联动检查另见 `analysis/QUERY_UI_PLAN.md`、`analysis/QUERY_UI_REVIEW.md` 和 `analysis/QUERY_UI_VERIFICATION.md`。真实浏览器回归脚本在 `test/browser/`，由 ego-browser 执行；Node 的 `npm test` 不包含这些浏览器检查。

此前准确性批次方案、验收与独立审核见 `analysis/ACCURACY_PLAN.md`、`analysis/ACCURACY_VERIFICATION.md`、`analysis/ACCURACY_REVIEW.md`，当时为 876 个注册项、18 项基础内容（包含用户代理片段涉及的 8 个 stream 条目）。当前计数见文首及网站完整开发记录；未核实项仍保留原状态。网站和 Markdown 共用事实状态格式；构建在写入发布前校验全部详情。官方现行文档链接与锁定源码证据分开标记，不能借现行文档新增能力推断冻结版本支持。

补丁核对记录在 `analysis/NGINX_PATCH_AUDIT.md`。以下命令只在隔离副本检查，不编译、启动或修改原源码仓库：

```sh
node analysis/verify-nginx-patches.mjs --config project.config.json --audit analysis/NGINX_PATCH_AUDIT.json
node analysis/verify-build-gate.mjs --config project.config.json
node analysis/verify-reference-build.mjs
```
