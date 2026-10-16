# B2：worker 与连接资源运行时实施证据

日期：2026-10-14。角色：实施。已完整读取 B2 PLAN、剩余运行时计划、B1 EVIDENCE/REVIEW、proxy-chain-runtime 测试契约及 B2 独立预审。主已确认 ca870 桌面完成并放行限定范围实施；本文不是审核、构建或运行验收签署。

## 深度交互：范围与状态门槛

仅补五个精确身份的普通 Unix worker、新代初始化、共享连接对象池及普通流式 accept 消费；single/helper/agent/平台差异仅作必要边界。不把进程数、CPU 集合、文件限制、连接槽和请求数互相等同，不承诺配置现场生效。

worker_processes 保留 master 初启/reload、spawn 失败及 single 不按 n 派生的必要边界，不展开 single reload/退出或完整 child 回收。affinity/nofile 保持限定直接消费范围。multi_accept 保持 affected。worker_connections 新监听 reuseport 消费命中补丁，主已明确批准唯一状态迁移，已按该限定交集落盘。

## 直接执行：先冻结旧证据

在任何知识修改前独立计算以下 `SHA-256(JSON.stringify(evidence))`，与 PLAN/主冻结一致。旧前缀所有对象及顺序必须完整保留；不是仅保留 ID。

| 精确身份 | 旧 evidence 数 | 冻结 SHA-256 |
| --- | ---: | --- |
| nginx--ngx_core_module--worker_processes | 7 | 7738c552bf7eafd69a079458cda51f31c0db7ce06c342f4e5e64b1ce8e036094 |
| nginx--ngx_core_module--worker_cpu_affinity | 9 | b282544fde337fbf0da88371e32a8e367e5af00ff8ca4726ed1b5f30e22dbd53 |
| nginx--ngx_core_module--worker_rlimit_nofile | 5 | 03d80411cf264e78c359b3960286d7ed9b5e859951048af80fb100cd355ca5a2 |
| nginx--ngx_event_core_module--worker_connections | 16 | 81c0436fa54e882f1ed8b83692f8bc41c1340fc292185f036ccc017624389f8b |
| nginx--ngx_event_core_module--multi_accept | 10 | eb191e01b8ec8e86f1ea43ad80364b29b8d8fd0cc31749d13a7df8b8d09dc258 |

固定发布基线 `1.27.1.1-ca870e6c128ac027`，1041 basic/14 deep。实施前 knowledge 文件字节 SHA-256 为 `6c7f7da8a22cea70a2524df0f63feadab03a5c7a046a920c96a993ac0dd99113`；排除五目标后其余 curated 对象按原顺序 `JSON.stringify` 的 SHA-256 为 `eaeaa8e249390304e465bf87600f5de6d7470993f280621b29e61e7e037617ab`。五目标旧 limitations/defaults/inheritance 已是完整事实对象，无需 legacy 转换，全部原样保留。

来源只使用本地固定 Git 对象：nginx `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`；nginx-docs `e8b581903e9d41252720053311cea687a5671674`；OpenResty `8c37412c31621225e7aa7e825b5b50106c9c71c4`。旧来源不扩大、不裁剪、不改元数据；新 evidence 显式 component，代码逐步引用，文档独立 corroboration。verification 不手填。

### 唯一迁移记录：worker_connections

旧状态 verified_unaffected，旧 note 仅覆盖普通 worker 注册/解析、默认512、连接池数量分配、监听最低量及 nofile 配置事实。新步骤为“监听连接也从同一池取槽”，直接引用既有完整 connection-pool（nginx:src/event/ngx_event.c:754–823）及 reuseport-patch（openresty:patches/nginx-1.27.1-reuseport_close_unused_fds.patch:17–38）。补丁文件20行 hunk `@@ -775,6 +775,18 @@` 在固定 nginx:807–811 的非本 worker reuseport 分支，原 continue 前新增 close、关闭失败 EMERG 日志和 fd=-1，再 continue。连接数组数量不变，但新实际监听初始化语义已被直接修改。主独立 git show 核定上述原坐标与完整 hunk 后明确批准 verified_affected；仅此身份此状态改变，用户 note 只说明限定影响，不载内部批准流程。

若新增上游完整 socket/失败分支，另绑定 socket_cloexec.patch:114–145 与 nginx:src/event/ngx_event_connect.c:34–92、325–330；前者在118行 hunk改 socket 的 SOCK_CLOEXEC，134行 hunk加条件 ngx_cloexec 失败 goto failed。上游同池取槽的旧53–64不因此被改写。最终冻结后以实际选定片段逐项记录。

## 实施与验证边界

五项 runtime/新增 evidence 已落盘，最终冻结记录见下。只写 knowledge/directives.json 五对象及本文。未联网、编译或运行 OpenResty，未读私有样例，未运行 build、测试套件、浏览器或补丁回放；历史回放不计本轮执行。

## 首次实施冻结（历史稿，R3/R4后摘要见末节）

知识已落盘，只读检查完成。主明确批准唯一 worker_connections：verified_unaffected → verified_affected，依据仅为新增监听 reuseport 消费分支；其余四项状态保持。批准流程不进入用户可见 patch note。master/single 范围遵照计划，未为保持 unaffected 裁掉普通 worker 创建失败、master reload 或 single 不按 n 派生的必要分支，也未扩展 single reload/退出。

知识文件字节 SHA-256：`875fbf13ac9c34c6c12a4ee05685fb4400b0dee9f7422af63d15f30baf475ece`。以下对象摘要为 `SHA-256(JSON.stringify(curatedObject))`，包括 runtime/evidence/patch。旧证据共47条，新增43条（其中3条独立文档），步骤共26步；步数只用于识别冻结稿，不作为完成判据。

| 身份 | 旧/新增 evidence | 步数 | 最终对象 SHA-256 | patch 状态 |
| --- | ---: | ---: | --- | --- |
| nginx--ngx_core_module--worker_processes | 7/9 | 5 | 736940d3e4aedb46f40356c68b4803399700b965c6ddc709fce4e66397a348f1 | verified_unaffected |
| nginx--ngx_core_module--worker_cpu_affinity | 9/5 | 4 | 58a6f8e382c88a9fd97fd3fc3c5d3923e31daab8900176a9d59275e00469c34b | verified_unaffected |
| nginx--ngx_core_module--worker_rlimit_nofile | 5/7 | 4 | b75f5b926f47d37db7ac56fb1f2f03b487db04c7c028bb9b17cb03875115fb96 | verified_unaffected |
| nginx--ngx_event_core_module--worker_connections | 16/8 | 6 | 98c3df38eeb16215df58722929e9a40826000a8640c59ee095c5741b9d2cc53e | verified_affected |
| nginx--ngx_event_core_module--multi_accept | 10/14 | 7 | bb1190bb8fbdfa44b403a1a89aaf572a06f10945494e49d3d1bf74384791fc92 | verified_affected |

### 新增 evidence 精确清单

以下逐项从对应固定 Git 对象取片段，行范围全部存在。组件与原坐标不变；不以补丁历史 hunk 头代替 nginx 原坐标。既有 evidence 复用而不修改；新增顺序即表中各身份的顺序。

| 身份 | 新 evidence ID | 固定组件/文件/原行范围 |
| --- | --- | --- |
| worker_processes | runtime-process-mode | nginx:src/core/nginx.c:337–341 |
| worker_processes | runtime-process-dispatch | nginx:src/core/nginx.c:380–385 |
| worker_processes | runtime-master-start | nginx:src/os/unix/ngx_process_cycle.c:128–132 |
| worker_processes | runtime-spawn-result | nginx:src/os/unix/ngx_process.c:86–244 |
| worker_processes | runtime-worker-entry | nginx:src/os/unix/ngx_process_cycle.c:698–706 |
| worker_processes | runtime-master-reload | nginx:src/os/unix/ngx_process_cycle.c:211–244 |
| worker_processes | runtime-generation-signal | nginx:src/os/unix/ngx_process_cycle.c:446–529 |
| worker_processes | runtime-single-entry | nginx:src/os/unix/ngx_process_cycle.c:279–295 |
| worker_processes | runtime-worker-processes-doc | nginx-docs:xml/en/docs/ngx_core_module.xml:651–673 |
| worker_cpu_affinity | runtime-worker-entry | nginx:src/os/unix/ngx_process_cycle.c:698–706 |
| worker_cpu_affinity | runtime-init-environment | nginx:src/os/unix/ngx_process_cycle.c:753–768 |
| worker_cpu_affinity | runtime-affinity-call | nginx:src/os/unix/ngx_process_cycle.c:853–859 |
| worker_cpu_affinity | runtime-affinity-getter | nginx:src/core/nginx.c:1499–1549 |
| worker_cpu_affinity | runtime-affinity-platform-call | nginx:src/os/unix/ngx_setaffinity.c:11–53 |
| worker_rlimit_nofile | runtime-worker-entry | nginx:src/os/unix/ngx_process_cycle.c:698–706 |
| worker_rlimit_nofile | runtime-nofile-init | nginx:src/os/unix/ngx_process_cycle.c:753–798 |
| worker_rlimit_nofile | runtime-master-reload | nginx:src/os/unix/ngx_process_cycle.c:225–235 |
| worker_rlimit_nofile | runtime-process-dispatch | nginx:src/core/nginx.c:380–385 |
| worker_rlimit_nofile | runtime-single-entry | nginx:src/os/unix/ngx_process_cycle.c:279–295 |
| worker_rlimit_nofile | runtime-worker-spawn | nginx:src/os/unix/ngx_process_cycle.c:336–349 |
| worker_rlimit_nofile | runtime-spawn-child | nginx:src/os/unix/ngx_process.c:186–200 |
| worker_connections | runtime-event-process-hook | nginx:src/event/ngx_event.c:178–191 |
| worker_connections | runtime-worker-init-result | nginx:src/os/unix/ngx_process_cycle.c:891–898 |
| worker_connections | runtime-pool-arrays | nginx:src/event/ngx_event.c:754–801 |
| worker_connections | runtime-connection-get | nginx:src/core/ngx_connection.c:1175–1237 |
| worker_connections | runtime-connection-drain | nginx:src/core/ngx_connection.c:1373–1426 |
| worker_connections | runtime-connection-free | nginx:src/core/ngx_connection.c:1240–1250 |
| worker_connections | runtime-connection-close | nginx:src/core/ngx_connection.c:1296–1338 |
| worker_connections | runtime-worker-connections-doc | nginx-docs:xml/en/docs/ngx_core_module.xml:553–573 |
| multi_accept | runtime-accept-handler | nginx:src/event/ngx_event.c:856–903 |
| multi_accept | runtime-accept-entry | nginx:src/event/ngx_event_accept.c:21–56 |
| multi_accept | runtime-kqueue-available | nginx:src/event/modules/ngx_kqueue_module.c:600–635 |
| multi_accept | runtime-kqueue-dispatch | nginx:src/event/modules/ngx_kqueue_module.c:660–669 |
| multi_accept | runtime-posted-dispatch | nginx:src/event/ngx_event_posted.c:18–35 |
| multi_accept | runtime-accept-resource-errors | nginx:src/event/ngx_event_accept.c:80–132 |
| multi_accept | runtime-accept-initialize | nginx:src/event/ngx_event_accept.c:139–204 |
| multi_accept | runtime-accept-register | nginx:src/event/ngx_event_accept.c:303–319 |
| multi_accept | runtime-accept-cleanup | nginx:src/event/ngx_event_accept.c:481–503 |
| multi_accept | runtime-accept-event-toggle | nginx:src/event/ngx_event_accept.c:365–427 |
| multi_accept | runtime-accept-mutex-condition | nginx:src/event/ngx_event.c:646–667 |
| multi_accept | runtime-accept-mutex-gate | nginx:src/event/ngx_event.c:219–239 |
| multi_accept | runtime-accept-mutex-lock | nginx:src/event/ngx_event_accept.c:327–362 |
| multi_accept | runtime-multi-accept-doc | nginx-docs:xml/en/docs/ngx_core_module.xml:360–377 |

### 逐步消费与直接绑定

完整 condition/action 以 knowledge 五对象为准；此表用于审核导航，不另建第二套语义。每步均直接绑定本步条件、动作与所声明出口；未把入口注册或配置生产改名当消费。

| 身份/步骤 | 本步条件 | 直接 source_ids（原顺序） |
| --- | --- | --- |
| worker_processes/1 | 启动时根据 master 配置选择进程路径 | runtime-process-mode, runtime-process-dispatch, runtime-master-start |
| worker_processes/2 | master 按有效数量进入普通 worker 创建循环 | worker-spawn, runtime-spawn-result |
| worker_processes/3 | 派生进入子进程并取得普通 worker 索引 | runtime-spawn-result, runtime-worker-entry, worker-spawn, agent-patch |
| worker_processes/4 | master 收到 reload 并建立新一代 worker | runtime-master-reload, worker-spawn, runtime-spawn-result, runtime-generation-signal, agent-patch |
| worker_processes/5 | 选择 single 入口而非 master 派生路径 | runtime-process-dispatch, runtime-single-entry |
| worker_cpu_affinity/1 | 普通 worker 到达初始化中的 affinity 消费点 | runtime-worker-entry, runtime-init-environment, runtime-affinity-call |
| worker_cpu_affinity/2 | getter 检查平台、未配置或显式 auto 集合 | runtime-affinity-getter, runtime-affinity-call |
| worker_cpu_affinity/3 | 配置为显式 CPU 集合列表而非 auto | runtime-affinity-getter, runtime-affinity-call |
| worker_cpu_affinity/4 | 非空指针交给平台绑定函数 | runtime-affinity-call, runtime-affinity-platform-call |
| worker_rlimit_nofile/1 | 普通 worker 进入资源初始化 | runtime-worker-entry, runtime-nofile-init |
| worker_rlimit_nofile/2 | 显式设置 RLIMIT_NOFILE 并消费系统调用结果 | implementation-0, runtime-nofile-init |
| worker_rlimit_nofile/3 | master reload 成功后新代再次初始化 | runtime-master-reload, runtime-worker-spawn, runtime-spawn-child, runtime-worker-entry, runtime-nofile-init |
| worker_rlimit_nofile/4 | 进程模式与共享初始化的适用边界 | runtime-process-dispatch, runtime-single-entry, runtime-worker-entry, runtime-nofile-init |
| worker_connections/1 | 普通 worker 的事件模块初始化分配连接资源池 | runtime-event-process-hook, runtime-pool-arrays, runtime-worker-init-result |
| worker_connections/2 | 监听连接也从同一池取槽 | connection-pool, reuseport-patch, runtime-connection-get, runtime-worker-init-result |
| worker_connections/3 | 共享取槽函数检查 fd 边界并尝试回收后分配 | runtime-connection-get, runtime-connection-drain |
| worker_connections/4 | 客户端 accept 已取得 socket，需要连接槽 | client-connection, runtime-connection-get |
| worker_connections/5 | 新上游 socket 需要连接槽 | upstream-connection, runtime-connection-get |
| worker_connections/6 | 释放连接槽与关闭 socket 是不同动作 | runtime-connection-free, runtime-connection-close, connection-pool, client-connection, upstream-connection, agent-connections-patch |
| multi_accept/1 | 普通流式监听进入 accept handler 并确定 available | runtime-accept-handler, runtime-accept-entry, runtime-accept-event-toggle, runtime-kqueue-available, runtime-kqueue-dispatch, runtime-posted-dispatch |
| multi_accept/2 | 进入 do...while，至少尝试一次 accept | accept-available, socket-patch, accept-loop |
| multi_accept/3 | accept4 ENOSYS 或连接被中止，按循环条件决定是否再试 | runtime-accept-resource-errors, accept-available, accept-loop |
| multi_accept/4 | accept 遇到 EMFILE/ENFILE 或其他错误 | runtime-accept-resource-errors, runtime-accept-event-toggle, runtime-accept-entry |
| multi_accept/5 | 已接受 socket，建立连接对象及接收模式 | runtime-accept-initialize, socket-patch, runtime-accept-cleanup |
| multi_accept/6 | 连接完成所列初始化，交监听 handler 后决定下一次接收 | runtime-accept-register, runtime-accept-cleanup, accept-available, accept-loop |
| multi_accept/7 | accept_mutex 是独立入口门控，不由 multi_accept 开启 | runtime-accept-mutex-condition, runtime-accept-mutex-gate, runtime-accept-mutex-lock, runtime-accept-event-toggle, runtime-accept-resource-errors |

独立固定文档：worker_processes 新 runtime-worker-processes-doc（651–673）；affinity 复用 official-doc（576–625）；nofile 复用 official-doc（690–701）；worker_connections 新 runtime-worker-connections-doc（553–573）；multi_accept 新 runtime-multi-accept-doc（360–377）。均属固定 nginx-docs 的 xml/en/docs/ngx_core_module.xml，只进入 corroboration，不混入 runtime 代码并集。

### 34 项补丁复核与最终范围

完整读取审计 JSON 的34项集合、固定 revision，并逐项读取对应固定补丁的目标文件/hunk；核固定 util/mirror-tarballs:35–550 的版本条件、集合顺序及 server_header 的 minor_ver=1 替换。主版本1.27.1满足本文表中有效门槛；注释补丁、旧安全修复分支和可选 no_pool 不在集合。不运行发行脚本或补丁回放；审计中的历史 offset/fuzz/最终字节不冒称本轮执行。

| 补丁及发行脚本原行 | 与最终 runtime 的精确关系 |
| --- | --- |
| privileged_agent_process（125） | 73–103在 master 初启/reload/restart 旁增加 agent，105–125是独立 helper 创建。worker_processes 复用 agent-patch:73–128，只为普通 worker 非总进程数的边界；不把 agent 启动纳入普通 i<n，不宣称完整 master 链无影响。132–164的 agent 权限/共享 init(-1)不在普通 affinity/nofile 消费分支，未因此迁移这两项。 |
| privileged_agent_process_connections（132） | worker_connections 复用 agent-connections-patch:33–73，agent 的 connection_n 使用独立字段，0值阻断独立创建；普通 worker 槽位不套用 helper 的512旧常量。 |
| reuseport_close_unused_fds（541） | 唯一状态迁移依据：复用 reuseport-patch:17–38，文件20行hunk `@@ -775,6 +775,18 @@` 对应固定 ngx_event.c:807–811。worker_connections 第2步直接绑定 connection-pool/reuseport-patch，解释 close/失败EMERG/fd=-1/continue；与主核定一致。其他 hunk 在关闭监听时跳过-1，不在本批完整关闭监听研究范围。 |
| socket_cloexec（537） | multi_accept 第2/5步直接绑定 socket-patch:82–113；86行hunk对应 accept.c:61–69，添加 SOCK_CLOEXEC；97行hunk对应195–204的外层分支，添加 NGX_HAVE_FD_CLOEXEC 下 ngx_cloexec 失败清理/返回。worker_connections 旧 socket-patch:82–145原样保留，但新上游仅用53–64共享取槽，不描述114–145修改的完整socket/flags分支；不把该旧大来源纳为本批上游完整链。 |
| single_process_graceful_exit（146） | 5–20改single reconfigure信号为terminate，27–75改single退出。本批single证据仅 process_cycle:279–295及main分派，只说明入口/不按n派生，不写single reload/退出，不受这些修改直接改写。 |
| proc_exit_handler（548） | cycle重设回调、收割状态调用回调；spawn-result:86–244及spawn-child:186–200未覆盖这些hunk，不研究子进程完整回收/重生。 |
| init_cycle_pool_release（76） | 初始池、cycle及master exit修改不在本批所列入口/消费；reload只引用init_cycle返回值和新配置消费者，不解释函数内部或完整生命周期。 |
| delayed_posted_events（118） | 改事件循环前置timer和尾部延迟队列、初始化队列；multi_accept只引用event.c:219–239锁门控，以及posted.c:18–35原handler消费，没有把全事件调度纳入scope。所选锁分支和posted handler调用未改，新增池数组754–801亦不相交。 |
| cache_manager_exit（330） | 修改cache manager，不在普通worker计数和资源消费；helper仅边界，不展开循环。 |
| privileged_agent_process_thread_pool（139） | helper线程池初始化判断，不在本批实际消费。 |

其余24项按审计顺序完整保留，所选新增代码分支未直接交这些hunk：win32_max_err_str(36)、stream_balancer_export(49)、stream_proxy_get_next_upstream_tries(53)、stream_proxy_timeout_fields(57)、stream_ssl_preread_no_skip(64)、resolver_conf_parsing(68)、daemon_destroy_pool(72)、balancer_status_code(104)、builtin_error_page_footer(111)、intercept_error_log(153)、upstream_pipelining(158)、server_header(162/163/165)、no_error_pages(171)、no_Werror(175)、log_escape_non_ascii(201)、proxy_host_port_vars(326)、larger_max_error_str(355)、pcre_conf_opt(359)、always_enable_cc_feature_tests(471)、ssl_cert_cb_yield(475)、ssl_sess_cb_yield(485)、ssl_client_hello_cb_yield(492)、upstream_timeout_fields(529)、safe_resolver_ipv6_option(533)。日志/网络系统调用仍可能进入其他公共路径，这不是整个进程或现场环境 unaffected 的声明。

### 关键精度与只读保护结论

ENOSYS：multi_accept 第3步同时绑定 resource-errors、accept-available 和 accept-loop，明确 continue 先经过 do...while(ev->available) 条件；非kqueue/off的available=0，不保证同次handler立刻fallback。ECONNABORTED、EAGAIN、EMFILE/ENFILE分开说明。CLOEXEC的第5步同时绑定完整外层195–204、补丁97–113及真实清理helper，不写无条件fcntl。

affinity明确未配置/无平台能力/auto空掩码的NULL和显式全零集合的非NULL可能性；系统调用失败ALERT后返回，不exit。nofile环境失败在前、UNSET跳过、显式软硬同时设置、setrlimit失败ALERT继续；reload绑定master→worker-spawn→fork子调用→worker初始化，不写原存活worker实时改限额。连接槽低空闲量回收是尝试，不保证必释放；free不是close，shared close分支不关闭共享socket。

本轮只读 JSON/Git 检查确认：

- 五对象排除仅允许的runtime/evidence追加/patch变更后，与实施前对象逐字段和原键顺序相同；summary/syntax/default/defaults/inheritance/limitations/phase/related/availability/其他旧字段完整不变。五项不存在需要legacy固化的字符串事实，未改旧limitations。
- 全47条旧evidence前缀完整对象与原顺序相同，五个SHA/count均与先冻结表一致；新evidence ID无重复，43条新片段全部位于固定Git对象合法行范围，组件显式。旧基线62个sources所在dist未写入，旧发布完整对象和顺序不变；新发布来源元数据和顺序由主构建、审核另验。
- 每个runtime.source_ids精确等于本对象steps按首次出现去重并集，无漏引用；corroboration独立，patch.source_ids保留全部旧前缀/顺序并覆盖全部runtime代码。patch其他键不变，唯一状态变化为已批准worker_connections，另外四状态与基线相同。
- 五对象未添加verification或verification_notes；评级由主后续构建派生。非目标curated对象按原顺序摘要仍为 `eaeaa8e249390304e465bf87600f5de6d7470993f280621b29e61e7e037617ab`，与实施前相等。没有修改extensions或任何发布文件。
- 以上是读数据/固定对象的差异检查，不是运行validateRuntime、deriveVerification、build、测试套件或浏览器。实施唯一写集合仍为knowledge/directives.json五对象和本文，没有生成临时文件。

冻结交接：主可开始构建/专项语义测试，审核可按PLAN及上表逐步核定内容。实施未宣称B2已通过审核/发布/桌面验收；当前dist仍为ca870/14deep，五项全部通过并新发布后才预期19deep，剩余25运行候选。后续修订须重算相应对象和知识摘要，不直接沿用此冻结签署。

## R3/R4 最小修订后重新冻结（当前交接稿）

主已构建首次稿 `1.27.1.1-3a75efdaffe0642c`，构建前后 knowledge 字节摘要均为 `875fbf13ac9c34c6c12a4ee05685fb4400b0dee9f7422af63d15f30baf475ece`（主交接记录，不是实施运行构建）。审核退回 R3/R4 后，主明确允许只解冻这两处及本文；已完整读取最新 REVIEW，仅作以下最小修订。前述首次冻结及43条新增清单作为历史保留，以下摘要取代其当前交接口径。

深度交互：R3缺的是监听本身的必要条件，不能只凭编译支持和worker不匹配关闭普通共享监听；R4缺的是accept队列到通用处理函数的真实调用点，不需要扩展全部事件循环。R5是测试反例问题，由主处理，未为反例改变任何知识。

直接执行：

- R3仅修改 worker_connections 第2步 action，明确三条件：NGX_HAVE_REUSEPORT、ls[i].reuseport为真、ls[i].worker!=ngx_worker。仍直接绑定原 connection-pool 与 reuseport-patch，无新增来源、状态迁移或其他语义。
- R4仅在 multi_accept evidence 原数组末尾追加 `runtime-accept-posted-consume`：nginx:src/event/ngx_event.c:248–255（固定 e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928），255行实际调用 `ngx_event_process_posted(cycle, &ngx_posted_accept_events)`。第1步直接绑定该ID，runtime.source_ids在首次出现位置纳入，patch.source_ids保留全部前缀后追加。第1步正文、其他6步、独立文档与所有旧evidence均未改。
- 补丁范围复核：固定 delayed_posted_events 的15行hunk在mutex前新增timer处理，29行hunk在普通posted处理后加另一条delayed队列；未改新增248–255的后端事件/accept队列调用，不改所述kqueue分派与通用posted函数。因此只补本消费调用点，不扩延迟队列/完整等待行为，不新增补丁来源或状态迁移。其余33项沿首次完整审计判定，新增片段未带来新的直接交集。

当前 knowledge 文件字节 SHA-256：`a2666ba27952f66a749ae9ab1557d4d13e34e529976b9137ed7cf05570676b82`。新增 evidence 现在为44条（multi_accept由14增为15，其余不变），总步骤仍26；旧47条证据全部保持。

| 身份 | 相对ca870新增 evidence | 步数 | 当前对象 SHA-256(JSON.stringify) |
| --- | ---: | ---: | --- |
| nginx--ngx_core_module--worker_processes | 9 | 5 | 736940d3e4aedb46f40356c68b4803399700b965c6ddc709fce4e66397a348f1 |
| nginx--ngx_core_module--worker_cpu_affinity | 5 | 4 | 58a6f8e382c88a9fd97fd3fc3c5d3923e31daab8900176a9d59275e00469c34b |
| nginx--ngx_core_module--worker_rlimit_nofile | 7 | 4 | b75f5b926f47d37db7ac56fb1f2f03b487db04c7c028bb9b17cb03875115fb96 |
| nginx--ngx_event_core_module--worker_connections | 8 | 6 | 1073582de1b8a3d110bd4206ec15df6665e7d0dd866cf1329e0d5e38fa6377a8 |
| nginx--ngx_event_core_module--multi_accept | 15 | 7 | b9e40c674e7268297565f10c90db2217ac193a3f1ced112c05e5d68d845ee3c1 |

只读检查：以875fbf首次稿为比较对象，逆向归一化“connections第2步action + multi_accept新增evidence/第1步引用/runtime并集/patch追加ID”后两个对象完整相等；其余全部curated对象（包含另外三目标）摘要仍为 `c9fff4a4f6f3a498087e979a79d7eb3654dbc7ccd32fbc41b87bee7e34caa207`。排除五目标后的原摘要仍为 `eaeaa8e249390304e465bf87600f5de6d7470993f280621b29e61e7e037617ab`。步骤首次出现去重并集精确等于runtime.source_ids；patch引用覆盖新增ID，旧prefix、独立docs、全部状态及其他事实不变。未手填verification；未触碰R5、测试、dist或审核文件。

重新冻结完成，主可按当前 a2666b 摘要进行新构建/定向测试，审核可复核R3/R4。知识文件停止修改，除非审核再次打回且主明确通知。实施未运行build/tests/browser，不把3a75旧构建当此次修订已发布或已测试。


