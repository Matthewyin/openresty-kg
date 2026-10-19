# /pi/ 容器适配与隔离验证

当前用户已授权动态IPv4适配通过后按最小范围切换：恢复原OpenResty、GoAccess、LLDP并新增Pi，七个宿主业务后端不启动。隔离脚本不改原站；真实切换必须依照专项计划备份、核对差异和验收，不能以此文档代替当前执行记录。

计划：[动态IP与切换计划](../../analysis/PI_DYNAMIC_IP_PLAN.md)。原固定地址批次见[历史专项计划](../../analysis/PI_OPENRESTY_SUBPATH_PLAN.md)。真实登录及第二台设备验收需要用户参与，不把隔离模拟当作已完成。

## 交付文件

- `prepare.mjs`：从当前页面源码、共用解析代码和已构建固定知识产生独立运行包；只读源码和 dist，不重新写旧发布。目的目录必须不存在。
- `Dockerfile`、`.dockerignore`：仅以该运行包作构建上下文；固定 Node 镜像摘要、Linux 锁文件安装、非 root 运行，不安装全局 Pi。
- `compose.yaml`：正式候选，仅一个 Pi 服务、独立命名卷、既有外部网络；不管理 OpenResty，不公开 Pi 端口。固定容器名阻止 Compose 扩容；不允许手工另起实例共写该卷。
- `openresty.mjs`：生成新增路由片段，或在原配置的唯一锚点插入生成完整候选。原文件只读，目标使用独占创建，重复套用拒绝。
- `isolation.mjs`：复制原配置到临时目录，在独立网络和随机回环端口验证；原业务页面与后端改用测试夹具，实际登录 Lua 使用测试账号和临时认证目录。
- `test.test.mjs`：生成器、保留历史发布与清单检查。

## 本地打包和构建

在项目根执行，目标是新目录。不要用整个项目根作 Docker 构建上下文。

```sh
node deployment/pi/prepare.mjs /absolute/new/package
docker build -t pi-knowledge:candidate /absolute/new/package
```

如需保留历史链接，显式追加 `--release <release_id>`，可重复；未选择的历史版本不进入包。`manifest.json` 记录当前与保留发布、代码、锁文件、Dockerfile、dockerignore及文件摘要。只有镜像和静态目录使用同一份包，才可声称内容一致。构建失败不影响既有 dist 或站点。

## 隔离测试

```sh
node --test deployment/pi/test.test.mjs
node deployment/pi/isolation.mjs \
  --package /absolute/new/package \
  --image pi-knowledge:candidate \
  --original /absolute/path/to/original/nginx.conf \
  --report /absolute/path/to/isolation-result.json --dynamic
```

可选 `--sample-openresty` 和 `--sample-nginx` 同时指定两份已提供的样例。OpenResty 采集文件只取原定主配置行段，不合并不同主机片段；样例必须仍符合已核定边界。文件内容只在测试内存和临时 Pi 状态中使用，不写结果报告。

测试使用与原入口相同的 OpenResty 镜像摘要，Pi 为 **mock 模型模式**，不挂载真实 `.env`。原配置中的宿主机后端名称仅在隔离副本中替换为测试服务；`goaccess-30004` 和 `lldp-backend` 也仅为独立网络内的测试别名。原登录审计使用随机测试口令，临时审计数据随环境清理，不读取原日志。

独立 bridge 用于 Docker Desktop 回环端口映射；入口容器的外部 DNS 转发指向容器回环，避免缺失服务名落入宿主机代理的假 IP。它不是原网络配置，也不宣称该网络有完整外网防火墙。主要链路调用自身 mock provider；正式 Compose 启动链使用合成凭据和另一个独立本地模拟模型端点，应用模式为 live，但不访问真实模型供应商。

默认完成/失败都会清理本次带随机前缀的容器、网络、卷和临时数据；不对既有对象运行清理。`--serve` 在检查通过后暂停供桌面复测，输出临时地址与测试登录文件路径，不输出口令；向命令标准输入发送一行结束并清理。暂存的容器进程不代表正式部署。

旧路由测试只比较原配置副本与新增片段后的副本在同一批夹具上的响应，不替代原业务或 WebSocket 真正握手验收。真实模型、原站真实账号及第二台设备仍留待切换阶段。

## 候选配置生成

```sh
node deployment/pi/openresty.mjs deployment/pi/openresty.example.json /absolute/new/pi.locations.conf
node deployment/pi/openresty.mjs deployment/pi/openresty.example.json /absolute/new/nginx.candidate.conf /absolute/path/to/original/nginx.conf
```

上述命令只创建新文件，不写原配置。示例值对应 `/pi/`、既有挂载下 `pi-site/` 和 `pi-agent:51808`。应用路径或内部端口变化时，入口参数、容器运行参数和打包部署位置须同时核对；前端根据实际模块目录寻址。

新增入口复用 `rag_auth_token` 和 `auth_sessions`，不复用旧扩展名放行规则。合法来源的HTML未登录到原 `/login`；API未登录401 JSON；登录后重新进入 `/pi/`，不改旧登录页落点。Pi查询状态/恢复/取消同样需要登录。登出不承诺自动取消已有模型任务，前端保留任务身份等待显式恢复。

示例 `publicPort=30000` 开启动态IPv4入口：规范IPv4字面量或localhost加固定端口，不接受DNS域名或IPv6；存在Origin须与当前访问origin精确相等，API缺Origin须有同源Referer，Fetch Metadata不得是same-site/cross-site。通过后入口固定内部Host/Origin，清除客户端Forwarded、X-Forwarded-Host/Proto；Node不依赖这些转发头。Compose的publicOrigin为固定内部服务名，启用relativeLinks生成 `/pi/` 详情链接及缓存基址，IP变化无需修改配置或重启Pi。模型URL与外部源码URL不改写。默认本机运行模式仍保留绝对基址和原检查。

Pi不存在、重建或换IP时入口无需重载；Docker DNS缓存到期及服务就绪有过渡时间，期间明确返回不可用，不承诺无缝切换。

## 正式切换前仍需确认

1. 当前局域网IPv4、可用账号/设备、已获准依赖；核对Docker DNS对存在及缺失Pi名称的结果，不将隔离DNS设置直接套入原站。地址仅用于访问和记录，不填入Pi公开origin。换网后用户使用新IP，可能需重新登录，网络仍须允许设备互访。
2. 将同一运行包的 `dist` 发布到原数据挂载中的独立目录；原配置只加经过审查的片段，原全站登录和审计不改。
3. 从 `example.env` 创建专用非敏感参数文件：镜像、固定容器名、`basePath`、内部端口、网络、模型文件绝对路径。Compose 必须显式传 `--env-file`，不要将模型 `.env` 当作 Compose 参数文件。
4. 模型文件只读挂载，必须能被容器 UID 1000 读取；切换前做不输出内容的可读性检查，不自动更改原文件权限。Compose不设置API密钥环境值，镜像也不含凭据。
5. 联网参考由参数文件的 `PI_WEB_SEARCH=true` 开启（默认 `false`），Compose 传为 `PI_SPIKE_WEB_SEARCH`。开启后用户问题相关的查询词会发往智谱联网搜索；Key 沿用模型文件中的智谱 Key，非智谱模型须在模型文件外另行提供 `PI_SPIKE_WEB_SEARCH_API_KEY`。开启属于部署变更，需单独确认。本机容器已经用户确认开启。
6. `PI_SPIKE_HOST` 非回环时仍须配置 `PI_SPIKE_PUBLIC_ORIGIN`，Compose已固定为内部origin；`PI_SPIKE_RELATIVE_LINKS=true` 时以 `PI_SPIKE_BASE_PATH=/pi/` 作为根相对详情基址。不要取消Host/Origin检查，也不要把容器内部origin当作用户访问地址。
7. 备份原配置和专用Pi状态，保留安装绝对路径；只在获准后执行启动/重载与局域网验收。不要用 `down -v` 删除需保留的会话卷。Pi 默认开启 3 天无活动删除：会话 metadata、会话文件、检查点，以及含会话正文的缓存都会被定期清理，`pi-state` 卷里的过期数据不会长期保留。需要留存时先停写再备份，不要依赖卷本身做长期存档。

## 升级到 3 天自动删除

升级后第一次新请求，或最迟约一小时内的定时清理，会删除所有超过 3 天没有活动的会话与缓存（缓存含会话正文）。若要保留旧数据，先按上面的停写步骤备份，或设置 `PI_SPIKE_RETENTION_ENABLED=false`。容器在 `compose.yaml` 的 `pi-agent.environment` 增加 `PI_SPIKE_RETENTION_ENABLED: 'false'` 后重建，不要执行 `down -v`。每个会话只记下最近 50 个 `cacheKeys`，更早的缓存靠 `cacheTtlMs` 回收。

原密码审计问题已单独记录，未在接入中修复。真实登录测试前应告知原行为，并使用已确认的测试账号或已有登录，不能把本批“复用登录”描述成原认证系统全面安全审核通过。

## 发布更新记录（2026-10-17）

字段级证据发布`1.27.1.1-20040b374943dabc`已按上述流程更新：`prepare.mjs`打包、构建镜像`pi-knowledge:field-evidence`、更新专用参数文件的`PI_IMAGE`并用`docker compose --env-file`重建容器，再把同一镜像内`/app/dist`复制到数据挂载中的`pi-site/`。镜像与静态目录必须同时更新，否则页面与Agent的发布号不一致。回滚时恢复旧镜像标签`pi-knowledge:before-field-evidence`、目录`pi-site.before-field-evidence`和备份参数文件`deploy.env.before-field-evidence`，再重建容器。这些名称是本机操作记录，不代表部门服务器已部署。

## 发布更新记录（2026-10-19）

本机容器已按上述流程更新：`prepare.mjs`打包、构建镜像`pi-knowledge:session-retention`、更新专用参数文件的`PI_IMAGE`与`PI_WEB_SEARCH=true`，并用`docker compose --env-file`重建容器，再把同一镜像内`/app/dist`复制到数据挂载中的`pi-site/`。本次包含已在本机容器开启的联网参考、业务范围分流、相近名称建议、自动压缩、会话列表和 3 天自动删除。容器内联网冒烟：联网调用正常，一次得到 3 条外部参考（约 105 秒）；另有请求因模型输出不符合报告契约失败，属于偶发问题，待后续处理。回滚时恢复镜像标签`pi-knowledge:before-session-retention`、目录`pi-site.before-session-retention`、备份参数文件`deploy.env.before-session-retention`，以及`.local`目录中的会话卷备份，再重建容器。这些名称是本机操作记录，不代表部门服务器已部署。

本机容器随后按同一流程更新为镜像`pi-knowledge:conversation-flow`，沿用`PI_WEB_SEARCH=true`，同样把镜像内`/app/dist`同步到`pi-site/`。本次包含联网引用逐条容错、选择阶段一次纠正、指令名大小写不敏感、配置大小写提示、对话流追问保留右侧结果。更新后只确认容器健康、`/api/status` 显示 `unifiedInput` 与联网开启、静态页面为新版；没有再做真实模型的容器内冒烟。回滚时恢复镜像标签`pi-knowledge:before-conversation-flow`、目录`pi-site.before-conversation-flow`、备份参数文件`deploy.env.before-conversation-flow`，以及`.local/pi-state-before-conversation-flow`中的会话卷备份，再重建容器。这些名称是本机操作记录，不代表部门服务器已部署。

本机容器再更新为镜像`pi-knowledge:drop-invalid-refs`，包含宿主直接采用完整配置原文、意图阶段诊断和无效外部参考一律丢弃；更新后在线上容器用合成配置做过一次真实模型冒烟，任务完成。回滚时恢复镜像标签`pi-knowledge:before-drop-invalid-refs`、目录`pi-site.before-drop-invalid-refs`、备份参数文件`deploy.env.before-drop-invalid-refs`，以及`.local/pi-state-before-drop-invalid-refs`中的会话卷备份，再重建容器。本机已删除更早的镜像标签（`before-session-retention`及更早的各版本），仅保留当前、上一版和再上一版（`session-retention`）；前面各段提到的更早回滚标签因此不再可用，对应的`pi-site.before-*`目录与`.local`备份文件未删。这些名称是本机操作记录，不代表部门服务器已部署。
