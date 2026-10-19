# 本地部署适配与运行说明

本批实现的是部署适配，不是部门部署。用户只通过浏览器使用现有网站，Pi只安装在项目内。正式入口、运行账号、进程托管、模型出口及容量参数尚待确认；本机没有安装代理、系统服务或全局Pi。

## 配置与启动

复用现有入口：在项目根运行 `node experiments/pi-sdk/run.mjs website --env-file <显式模型文件绝对路径> --config-file <非敏感运行配置绝对路径>`。此命令会启动真实模型服务，本批未执行；本地测试使用mock专用入口，不需要真实凭据。

[deployment.example.json](deployment.example.json)仅为参数模板，域名不可直接使用，数值是本地默认/示例而非已确认服务器容量。不得把本机`.env`或历史`.state`直接复制成部门初始数据。Node要求>=22.19.0，依赖以项目锁文件为准，当前Pi包1.2.0，没有升级。

启动配置优先级：`config.json`默认 → live入口读取的`live.config.json`及指定模型文件 → 显式运行JSON → 调用者显式`PI_SPIKE_*`环境变量。模型地址/凭据不接受通过运行JSON设置；测试入口忽略外部真实配置并强制mock，真实website/live入口不能被环境变量切为mock。模型文件字段映射仍以`live.config.json.envKeys`为准。

所有可覆盖字段及环境变量见[src/runtime-config.mjs](src/runtime-config.mjs)。启动器只转发列出的变量，不继承个人Pi目录或其他模型密钥。新增代理/证书等环境需求须明确接线，不应假设系统环境全部透传。未知JSON字段、非法origin、预算或回环地址会被拒绝。

单输入框批次增加 `thinkingLevel` / `PI_SPIKE_THINKING_LEVEL`：允许 `off/minimal/low/medium/high/xhigh`，具体值还须由模型支持。当前 GLM-5.3-flash 真实接口拒绝关闭思考，`live.config.json` 使用 `low`；mock 默认 `off`。级别进入缓存键，不能把不同级别的结果当作同条件命中。

`publicOrigin`用于浏览器的公开站点地址，仅允许纯HTTP(S) origin。默认Node监听回环；新增`host` / `PI_SPIKE_HOST`用于显式容器网络监听，非回环必须指定publicOrigin。入口保留浏览器Host（含端口）/Origin，后端与配置精确比较，不信任任意Forwarded头。`basePath` / `PI_SPIKE_BASE_PATH`默认`/`，website详情地址为origin加basePath。子路径入口剥离前缀后转发Node内部`/api/*`，具体容器配方与隔离验证见[说明](../../deployment/pi/README.md)。这些适配不代表原OpenResty入口已切换。

入口直接提供完整dist，只有`/api/`代理给Node；静态根不能是项目根，API不能回落HTML或缓存。保留`.mjs` MIME、CSP、nosniff及不可越界路径约束；页面/当前索引先不缓存。具体入口软件配置在服务器环境确认后生成，本地夹具不能当生产代理。

## 状态、容量及操作互斥

一个实例只执行一个提交或恢复操作。并发请求返回`409/busy`，页面保留输入、不排队、不自动重提。退出阶段拒绝新操作并等待恢复/活动任务收尾。没有账号身份权限，正常页面各用自己的会话ID；共享成果检索未实现。

| 参数 | 当前实现与单位 |
| --- | --- |
| maxJobs、jobTtlMs | 最多保留的终态job数量、终态保存毫秒数。开始请求、请求收尾和job读取时惰性回收；活动job不删除，内存最多再含一个活动job。 |
| maxHistoryBytes | 压缩之后的待重放历史、下一轮提示及实际 provider 输入的 UTF-8 硬上限，不是 token 数。只有本轮输入自身仍超过该上限才拒绝，提示「本轮输入过大，请缩短问题；原记录未删除」。不删旧记录。新会话精确缓存不发送模型输入，可以在预算收紧后返回，但仍受磁盘容量检查。 |
| compactHistoryBytes | 发给模型前的压缩目标，默认 65536，必须小于 maxHistoryBytes。先做字段级 compactHistory，仍超出时把更早的整轮收成一条摘要（不含问题原文、配置原文和联网查询词），至少保留当前一轮。可用 PI_SPIKE_COMPACT_HISTORY_BYTES 覆盖。 |
| maxStateBytes | 状态持久文件的字节预算。新请求准入、缓存克隆、检查点预留及完成metadata增量均检查；容量不够时不新增完成缓存。SDK生成中的文件及原子写临时副本可能短时额外占用空间，不能当作文件系统硬配额，磁盘需留余量。 |
| retentionEnabled | 默认 true。true 时在新请求开始前，以及同一进程的周期清理中删除过期数据；运行、恢复或关闭中跳过周期清理。显式 false 时不自动删除旧用户记录。 |
| sessionTtlMs、cacheTtlMs | 默认均为 259200000（3 天）。会话按 metadata 最近更新时间、缓存按写入时间起算。完成或恢复会更新会话时间。保留中的会话所引用的 session 和 checkpoint 不因文件自身较旧而删除。无引用的旧 session/checkpoint 也按期限回收。缓存含会话正文副本，启用保留期限时 cacheTtlMs 不得大于 sessionTtlMs。 |
| pruneIntervalMs | 周期清理间隔，默认 3600000（1 小时），可用 PI_SPIKE_PRUNE_INTERVAL_MS 覆盖。定时器属于当前进程，close 时清除；失败只记事件名，不写路径或会话内容。 |
| logRequests | 开启后输出结构化启动/退出与请求终态日志，含模式、请求ID、release、状态、时长/用量，不记录配置、问题或凭据正文。 |

清理只处理已知状态目录内的记录；坏引用会中止清理，不以删除异常数据掩盖问题。新请求引用已删除会话时明确`session_unavailable`，不偷偷新建。jobs仅在内存，重启后旧requestId返回`job_unavailable`；session恢复返回请求和上下文状态，不返回完整旧报告、不续传中断token。

不让多个进程同时写同一状态目录；当前没有跨进程锁或分布式协调。保留清理是实例内部的串行操作：新请求开始前做一次，另外由本进程定时器按 `pruneIntervalMs` 重复。清理进行中时提交、恢复和删除返回 409/busy。不提供独立后台清理进程。状态必须位于当前安装根的`experiments/pi-sdk/.state`中，禁止符号链接；metadata保存绝对路径，异路径迁移未支持。卷内会话与缓存会按上述期限删除，备份前要先停写。

## 升级到 3 天自动删除

从仍关闭保留期限的旧版本升上来之后，第一次新请求，或最迟约一小时内的定时清理，会删除所有超过 3 天没有活动的会话、检查点和缓存。缓存里保存了会话正文副本，所以会一起删除。若要先留下这些旧数据，按上一节停写并备份，或在启动环境设置 `PI_SPIKE_RETENTION_ENABLED=false`。容器在 `deployment/pi/compose.yaml` 的 `pi-agent.environment` 增加 `PI_SPIKE_RETENTION_ENABLED: 'false'`，再重建容器；不要用 `down -v`，否则卷会被直接清掉。

每个会话的 `cacheKeys` 只记录最近 50 个缓存键。更早的缓存不再挂在会话上，仍由 `cacheTtlMs` 到期后回收。

## 就绪与运行检查

`GET /api/ready`检查知识快照可读、状态目录可写，返回ready/release/busy；失败503且不返回内部路径。它不调用模型，也不证明模型出口可用。`/api/status`保留页面参数探测；二者都遵守公开Host/Origin检查。

常规SIGTERM/SIGINT会经启动器转发给服务，关闭期间取消活动请求、等待持久化收尾；退出后的启动恢复上一个完整轮次。强制中断由检查点恢复，不把未完成轮次当成功。具体超时升级到强杀的进程管理策略留给服务器环境，不在本机安装系统服务。

## 停写备份、还原与回滚操作顺序

以下为后续维护操作说明，本批只在测试临时目录演练。使用已经确认的绝对路径；不对真实状态执行下面步骤。

1. 记录固定安装根、实际stateDir、代码/锁文件摘要、知识release及保留的历史release清单。暂停入口的新Agent请求，等待或取消活动任务，再停止Node并确认进程退出。不要仅看页面“完成”就认为所有写入已停止。
2. 在状态目录之外创建新的备份目录；校验源与目标既不相同也不互相包含，且不存在目录软链接。复制metadata、sessions、checkpoints及对应版本清单；cache可重建，若复制须来自同一停写时间点。保留原文件，核对数量与摘要。不要把备份放进`.state/<实例>`自身造成递归。
3. 需要还原时先停写，把当前状态完整移到另一个保留目录，不覆盖或删除唯一副本。将已核对备份复制回**原绝对stateDir**，恢复运行用户的读取/写入权限。先恢复配套代码、依赖与知识，再启动。不能仅靠修改配置指向异路径备份。
4. 检查`/api/ready`，用已记录sessionId显式恢复并提交脱敏追问；确认最后完整轮次和知识版本一致，旧job不存在是正常行为。记录备份后丢失哪些轮次、恢复时间、验证结果，验证通过后才恢复入口。
5. 升级/回滚沿用上述维护窗口。先准备完整不可变release再切当前索引；不要就地逐文件改写已发布知识。旧代码不直接写不兼容的新状态；需要配套回退状态时，先保留现状态并告知备份后记录损失。固定安装根不变，不启动旧新双实例共写状态。

可复现的本地实操见[test/lifecycle.test.mjs](test/lifecycle.test.mjs)中的停写备份/同路径恢复测试，以及[test/package-start.test.mjs](test/package-start.test.mjs)中的真实子进程退出/中断恢复。测试使用临时目录和复制函数，验证后只删除本批临时文件；没有触碰原`.state/website`。

## 本地验证入口与打包范围

- `npm test --prefix experiments/pi-sdk`：所有`.test.mjs`，强制mock；子进程恢复helper不单独当测试运行。
- `node --test test/agent-ui.test.mjs`：忙碌、取消、旧结果隔离等页面逻辑回归。
- `PI_SPIKE_MODE=mock PI_OFFLINE=1 node experiments/pi-sdk/test/local-preview.mjs`：临时本地入口，输出随机地址；标准输入`stop`/`start`控制本夹具后端，验证静态降级。结束用正常中断自动清理测试状态。它不是常驻部署入口。

独立运行包测试实际复制Pi源码、启动器、非敏感配置、包声明/锁文件、项目内依赖、项目src和dist静态文件；知识只复制当前索引对应release，明确不承诺包内未包含的历史发布。没有通过软链接借用开发依赖，没有复制`.env`或用户状态。正式包的历史release保留清单、目标系统安装、入口/进程配置仍属于后续S3，不因该本地测试宣布可直接上线。

本批验证记录见[本地验收](../../analysis/PI_LOCAL_ADAPTATION_VERIFICATION.md)；独立审核见[审核记录](../../analysis/PI_LOCAL_ADAPTATION_REVIEW.md)。真实模型性能、服务器证书/出口与部门浏览器访问尚未复测。
