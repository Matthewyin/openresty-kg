# B2：worker 与连接资源运行时规划

日期：2026-10-14。角色：规划；本文不是实施、发布或运行验收记录。

## 深度交互：目标、边界与实施前置条件

目标是解释五个配置身份如何在普通 worker 启动和连接处理时被消费，以及何处跳过、失败或提前返回。配置注册、解析、默认值和对象初始化本身不足以晋级 deep。进程数量、CPU 集合、文件描述符上限、连接对象池和单次 accept 循环是五种不同约束，不能相乘或互相替代为请求容量；配置成功也不保证 fork、setrlimit、CPU 绑定或 socket 操作成功。

实施必须同时等待主线程完成上一批 ca870 页面复测、确认本计划可交付实施。规划可先完成，不据此宣布上一批桌面通过，不抢先修改知识或发布。主线程统一调度实施与独立审核；审核按本文逐项验收，遗漏退回实施后复核。本规划不创建聊天、不重新选择模型。

最小范围限定 Unix 普通 worker 的启动/新代初始化、连接池取得与归还、普通流式监听的 accept handler。single、helper、privileged agent、kqueue 和 IOCP 作为必要边界解释；不扩展全部退出/重生/热升级机制、全部事件后端、UDP 接收、调度性能或现场容量计算。仅证据充分的身份晋级，不能为凑数弱化条件。

## 直接执行：冻结基线与写入范围

固定比较目录：`dist/knowledge/releases/1.27.1.1-ca870e6c128ac027/`。本次只读确认 current 仍指向该版本，覆盖 1041 basic（包含 deep）/14 deep，bundled 1017/14、department_extension 24/0。后续始终使用冻结目录比较，不以变化中的 current 或工作树 HEAD 代替基线。

精确白名单只有：

| 身份 | 基线评级 | 基线 patch_status.status |
| --- | --- | --- |
| nginx--ngx_core_module--worker_processes | basic_verified | verified_unaffected |
| nginx--ngx_core_module--worker_cpu_affinity | basic_verified | verified_unaffected |
| nginx--ngx_core_module--worker_rlimit_nofile | basic_verified | verified_unaffected |
| nginx--ngx_event_core_module--worker_connections | basic_verified | verified_unaffected |
| nginx--ngx_event_core_module--multi_accept | basic_verified | verified_affected |

五项全部通过时才预期 1041/19，bundled 1017/19、扩展 24/0；deep 集合必须精确等于 ca870 原14项加本五项。样例剩余运行候选由30降为25，六项 C1 仍 basic 且无 runtime；不能称50身份全 deep。部分通过则逐身份交账。

本轮规划只写本文。后续实施的知识修改仅限 `knowledge/directives.json` 五对象：新增 runtime、按需追加 evidence、追加 patch 引用及限定范围说明。保留 summary、syntax、default/defaults、inheritance、limitations、phase、related、availability、配置入口及其他旧字段；尤其 affinity/nofile 原 phase=configuration 不借本批改写。旧 evidence 的 ID、正文、行号、组件及相对顺序不变。旧事实确有问题时另报主线程，不能以 runtime 扩展名义顺带改动。

已读取当前五对象；以下为 `SHA-256(JSON.stringify(evidence))`，供实施开始复核旧前缀（不是整个对象摘要）：

| 名称 | 旧 evidence 数 | SHA-256 |
| --- | ---: | --- |
| worker_processes | 7 | 7738c552bf7eafd69a079458cda51f31c0db7ce06c342f4e5e64b1ce8e036094 |
| worker_cpu_affinity | 9 | b282544fde337fbf0da88371e32a8e367e5af00ff8ca4726ed1b5f30e22dbd53 |
| worker_rlimit_nofile | 5 | 03d80411cf264e78c359b3960286d7ed9b5e859951048af80fb100cd355ca5a2 |
| worker_connections | 16 | 81c0436fa54e882f1ed8b83692f8bc41c1340fc292185f036ccc017624389f8b |
| multi_accept | 10 | eb191e01b8ec8e86f1ea43ad80364b29b8d8fd0cc31749d13a7df8b8d09dc258 |

## 固定来源与 runtime 契约

`project.config.json` 将 nginx 锁为 release-1.27.1；本次解析该 tag 的 commit 与 ca870 五项 sources 一致：`e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`。OpenResty 由 ca870 distribution-version、patch sources 与审计记录锁为 `8c37412c31621225e7aa7e825b5b50106c9c71c4`（1.27.1.1）；nginx-docs 由 project.config 与已有 official-doc 锁为 `e8b581903e9d41252720053311cea687a5671674`。下列行号均为这些固定 Git 对象原坐标，已用本地 `git show <revision>:<file>`核查，不是工作树 HEAD。

沿用 `src/query/knowledge.mjs:23–58`：`runtime={status,text,steps:[{condition,action,source_ids}],source_ids,corroboration_source_ids}`。verified 必须有真实代码步骤、独立固定文档和覆盖运行代码的 patch 引用，verification 由既有校验器派生，不手填、不改 schema 或晋级规则。步骤代码按首次出现去重并集精确等于 runtime.source_ids；文档只进入 corroboration，不能混作代码。每一步自己绑定支持条件、动作、失败出口的片段；只放在总 sources 或另一步不算闭合。

结构校验排除了完全落在 registration/configuration-definition 范围内的片段，但不证明运行语义。旧配置回调不得裁剪、改名后充当 runtime。解析与默认事实作为背景保留；真正步骤从运行消费者开始。以下为最小语义单元，允许合并或拆分步骤，不硬定步数或中文措辞。

## 五身份最小消费链与失败出口

路径缩写：P=`src/os/unix/ngx_process_cycle.c`，N=`src/core/nginx.c`，E=`src/event/ngx_event.c`，C=`src/core/ngx_connection.c`，A=`src/event/ngx_event_accept.c`；均属固定 nginx。

### worker_processes

1. `N:380–385` 分派 single/master；`P:128–132` master 读取 ccf->worker_processes，`P:336–349` 按 i<n 调用 ngx_spawn_process 并传 worker 索引。默认1、auto 在解析期取 ngx_ncpu 是旧事实，不能将 `N:1553–1578` 重挂为 deep 核心证据；auto 也不是随负载持续调节。
2. `src/os/unix/ngx_process.c:95–200` 闭合进程槽耗尽、socketpair/通道设置/fork 失败返回 NGX_INVALID_PID，以及子进程实际调用 proc。`P:342–347` 没有根据返回值保证 n 个进程都成功；禁止写“配置 n 即有 n 个存活 worker”。`P:698–706` 将索引传入 worker 初始化。
3. `P:211–244` master reload：新 cycle 失败则保留旧 cycle 并 continue；成功后读取新 ccf，启动新代，随后给旧代发 graceful shutdown。瞬间新旧代可重叠，不把 n 写成所有时刻总进程数；不承诺新代全部启动成功后才退出旧代。`ngx_new_binary` 分支另按原 cycle 启动，不泛称每次均重新解析。
4. single 不走上述 n 次 spawn，范围证据用 `N:380–385` 与 `P:278–300` 即可；不将上游 single reload/退出代码描述成发行版行为。master/cache helper/privileged agent 不属于本项计数，复用 agent-patch 并核发行版补丁边界。

独立文档新增建议 `runtime-worker-processes-doc`：`nginx-docs:xml/en/docs/ngx_core_module.xml:651–673`。本次已读，支持 worker 数与 auto 含义，不能替代 spawn/reload 失败证据。

### worker_cpu_affinity

1. `P:698–706、853–859`：普通 worker 初始化，worker>=0 才取集合，返回非 NULL 才调用 ngx_setaffinity；不是每请求执行。旧 implementation-1 只到857行，不能修改旧来源补尾，应追加完整独立片段。
2. `N:1499–1549`：未配置返回 NULL；auto 从末个掩码按 worker 索引循环挑选 CPU，空 auto 掩码返回 NULL；显式列表按索引取集合，超出列表使用末项。auto 空掩码与显式空集合不同，禁止一律说空掩码均跳过调用。
3. `src/os/unix/ngx_setaffinity.c:11–53`：分别受 NGX_HAVE_CPUSET_SETAFFINITY / NGX_HAVE_SCHED_SETAFFINITY 保护；调用 cpuset_setaffinity 或 sched_setaffinity。失败仅 ALERT 日志，void 返回后初始化继续，不保证绑定成功或 CPU 独占。
4. `N:1487–1495、1544–1549` 的不支持平台警告/忽略和 getter NULL 只作条件边界，保留已有来源；未配置不主动绑定，不表示解除启动进程已有 OS 限制。

独立文档复用 official-doc：`xml/en/docs/ngx_core_module.xml:576–625`，已核 CPU 集合、auto 和 FreeBSD/Linux 范围。普通 worker 范围外的 helper 初始化不扩写。

### worker_rlimit_nofile

1. `P:698–706、763–786`：普通 worker 进入初始化；未显式设置（NGX_CONF_UNSET）跳过。环境设置失败会先 exit(2)，不能声称所有初始化都到达 setrlimit。
2. `P:777–786`：显式值同时写 rlim_cur 和 rlim_max，尝试 setrlimit(RLIMIT_NOFILE)。失败记录 ALERT 并继续后续初始化，本分支不 exit；不得把配置值当已取得额度。
3. 新代经 master reload 再走初始化（复用 `P:225–244、698–706`），不声称原存活 worker 限额被实时修改。single 不走普通 worker_process_init，不把这一调用无条件推广所有进程；共享 helper 初始化也不能据此说字段只会被普通 worker 读取。

独立文档复用 official-doc：`xml/en/docs/ngx_core_module.xml:690–701`。文件描述符还用于上游及其他文件；本项不会自动扩大 connection_n，也不是全系统文件上限或请求数。无需扩展完整权限切换过程。

### worker_connections

1. 配置背景 `E:1065–1087` 写 cycle->connection_n；真正消费 `E:754–801` 分配连接、读事件、写事件数组并串起 free list、初始化 free_connection_n。任一数组分配失败返回 NGX_ERROR；实施补齐事件模块 init_process 返回错误至普通 worker exit(2) 的直接调用者证据，不能只留局部 return。
2. `E:805–823` 监听连接也取同一池，NULL 则 NGX_ERROR。普通 worker 的 reuseport 不匹配监听跳过分支必须叠加补丁，不能只显示上游 continue。client `A:139–151` 取得失败关闭已接受 socket 并返回；旧 upstream-connection `src/event/ngx_event_connect.c:53–64` 独立证明上游也用池，实施核其完整片段，若描述更多 socket 行为需补对应 hunk。
3. `C:1175–1236`：文件索引边界失败返回 NULL；先调用 drain，再取 free list；仍空则 ALERT/NULL，成功移除池头并减 free_connection_n。`C:1373–1426` drain 有低空闲量和 reusable 集合条件，通过 read handler 尝试回收，不保证必定释放；不写成“只要满就立刻拒绝”或“必可回收”。
4. `C:1240–1250` 归还槽位并增加空闲计数；`C:1296–1313` 证明 close 路径调用 free、清 fd，shared 分支不关闭共享 socket。不要把 free_connection 本身描述成关闭 OS fd。保留旧 nofile 检查和最低监听数量事实，不将检查通过等同可启动。
5. privileged agent 独立 connection_n 是边界，不解释为本项在所有进程通用。每 worker 池涉及监听、客户端、上游等，禁止换算固定客户端容量或请求数。

独立文档新增建议 `runtime-worker-connections-doc`：`xml/en/docs/ngx_core_module.xml:553–573`，已核客户端/代理连接和 open files 限制。

### multi_accept

1. 普通 accept handler 的实际入口需绑定 `E:856–881` 及实施补齐非 Windows 预处理上下文；IOCP 走 ngx_event_acceptex，仅作范围边界。`A:37–49` 超时恢复 accept 事件失败直接返回；非 kqueue 才令 available=multi_accept，kqueue 保留后端数量。
2. `A:58–78` 至少尝试一次 accept，EAGAIN 返回。accept4 的发行版 flags 是 SOCK_NONBLOCK|SOCK_CLOEXEC，须同时绑定 socket_cloexec:82–113；不是上游仅 SOCK_NONBLOCK。
3. `A:80–132`：accept4 ENOSYS 清 use_accept4/ngx_inherited_nonblocking 后 continue；ECONNABORTED 在 kqueue 递减 available，非零才继续。EMFILE/ENFILE 关闭 accept 事件；失败即返回，成功后按 accept mutex 状态解锁/设 disabled，或加 timer，最终返回。不能把所有错误合并成一个出口，也不能称 on 无条件接收全部连接。
4. `A:139–172、183–204、303–319`：取得连接/分配失败、非阻塞设置失败、注册连接失败均有清理/返回；成功才交 ls->handler，kqueue 减 available，再由 while 判断继续。实施需按最终文字补全池、地址/日志分配等所声明分支的完整证据；如只概括“后续初始化可失败退出”，至少给出实际例子，不冒称已穷尽所有后续步骤。
5. socket_cloexec 补丁的 FD_CLOEXEC 调用位于 `!ngx_inherited_nonblocking` 且非 IOCP 的路径，另有 NGX_HAVE_FD_CLOEXEC guard；失败 close_accepted_connection 后 return。必须同时绑定上游 `A:183–204` 的外层条件与补丁97–113，不能说所有 accept 路径都无条件调用 fcntl。清理 helper 的实际归还/关闭由实施补齐固定来源。

独立文档新增建议 `runtime-multi-accept-doc`：`xml/en/docs/ngx_core_module.xml:360–377`，已核 on/off 与 kqueue 例外；文档的“all”须受实际循环失败出口限定，不承诺性能、公平性或现场成功率。

## 34项补丁交集与状态决策

本次读取 `analysis/NGINX_PATCH_AUDIT.json` 完整34项清单，逐项从固定 OpenResty 对象读取补丁文件的目标文件/hunk，核对发行脚本映射；详读下表关键补丁全文。没有执行补丁回放，也不把既有 patched_sha256 当本轮执行结果。实施应对最终新增片段逐项复核，记录原始源码与补丁文件两个坐标；hunk 头为旧补丁坐标，不能直接冒作固定 nginx 行号。

| 补丁 | 发行脚本行 | 与最小范围的关系及约束 |
| --- | ---: | --- |
| privileged_agent_process | 125 | 补丁73–103在 master 初启/reload/restart 邻接增加 agent 启动，105–125另建 helper；不改普通 worker 的 i<n。132–164改变 agent 权限路径并复用 init(-1)。普通 worker 计数可保持原限定结论；若新增 runtime 把 agent 启动列为实际动作，需提交状态迁移证据，不能自动宣称完整 master 链 unaffected。 |
| privileged_agent_process_connections | 132 | 33–73把 agent connection_n 改为独立字段，并对0提前返回；普通 worker 池背景边界，不得误归本指令。 |
| reuseport_close_unused_fds | 541 | 17–38在 `E:807–811` 对非本 worker reuseport fd 先 close、失败日志、置-1再 continue。worker_connections 若按本计划纳入监听池消费，此分支是新增运行语义实际交集，应提交 unaffected→affected 候选，待主确认。另一 hunk 为关闭监听时跳过-1。 |
| socket_cloexec | 537 | 82–113直接影响 multi_accept 接收与失败；multi_accept 保持 affected。114–145修改 upstream socket flags/失败路径，worker_connections 若扩大至该范围亦须评估，不能以旧狭窄53–64引用遮蔽新叙述。150–163属 worker 退出漏 fd 检查，本批不展开。 |
| single_process_graceful_exit | 146 | 5–20使 single 收 reconfigure 信号改为 terminate；27–75修改 graceful exit。single 只说明不按 n spawn；若扩写 single reload/退出必须绑定补丁，禁止照抄上游。 |
| proc_exit_handler | 548 | cycle 初始化重设回调、收割状态后调用回调；未改本次实际读取的 spawn 失败区间。扩展 child 回收/重生时重新核交集。 |
| init_cycle_pool_release | 76 | 修改初始池和 master exit，reload 只读 init_cycle 返回值不等于展开其全部内部；不在本批宣称完整 cycle 生命周期 unaffected。 |
| delayed_posted_events | 118 | 修改事件调度和初始化队列，不改754–801数组分配；不扩展事件循环调度结论。 |
| cache_manager_exit | 330 | cache manager 循环，不是普通 worker 数量或资源消费。 |
| privileged_agent_process_thread_pool | 139 | helper 线程池初始化判断，本批不研究线程池。 |

其余24项的目标/hunk未与本文选定直接消费分支相交，按审计顺序保留如下（括号为固定 util/mirror-tarballs 映射行）：win32_max_err_str(36)、stream_balancer_export(49)、stream_proxy_get_next_upstream_tries(53)、stream_proxy_timeout_fields(57)、stream_ssl_preread_no_skip(64)、resolver_conf_parsing(68)、daemon_destroy_pool(72)、balancer_status_code(104)、builtin_error_page_footer(111)、intercept_error_log(153)、upstream_pipelining(158)、server_header(162及后续替换/应用)、no_error_pages(171)、no_Werror(175)、log_escape_non_ascii(201)、proxy_host_port_vars(326)、larger_max_error_str(355)、pcre_conf_opt(359)、always_enable_cc_feature_tests(471)、ssl_cert_cb_yield(475)、ssl_sess_cb_yield(485)、ssl_client_hello_cb_yield(492)、upstream_timeout_fields(529)、safe_resolver_ipv6_option(533)。这不排除它们在日志内部、启动前置、网络其他路径或整个进程中的影响。

状态建议：affinity/nofile 的限定普通 worker 消费尚未发现直接修改，默认保持 unaffected；multi_accept 保持 affected；worker_processes 按实际冻结范围判定，不能只因同文件命中改变状态；worker_connections 的监听分支按上表提交候选迁移。本文未批准任何状态变化。每个迁移必须交主线程：精确身份、旧状态及旧范围、新步骤和 evidence ID、固定源码位置、补丁文件行/hunk、改变的条件/动作/出口、拟新状态与 note。主确认后才改该一个状态，其他 patch 键保护不放宽。

## 实施交接与验收清单

1. 前置门槛：主线程交付 ca870 页面复测结果并放行 B2；复核上述五项旧 evidence 摘要与冻结发布。实施落盘 `SAMPLE_WORKER_CAPACITY_RUNTIME_EVIDENCE.md`，审核独立落盘同前缀 `REVIEW.md`，主线程记录 `VERIFICATION.md`；这些是后续交付要求，本规划不创建它们。
2. 语义验收：五项逐条闭合上述运行入口、实际消费、编译/平台条件、跳过和失败出口；未读到的调用者与清理 helper 必须补固定证据。独立文档与运行代码分列。系统调用是“尝试”，连接槽位不是请求数，single/helper 范围不混写。配置生产片段不能替代运行消费。
3. 来源验收：实际发布 sources 原样读出，逐条与固定 Git 片段及全部元数据比较，含 component/version/revision/file/行号/code/URL/kind；旧完整对象、顺序和 ID 保留，无重复。顺序为基线旧来源（暂移末项 distribution-version）、新增 evidence 顺序、原 distribution-version；不先排序或 Map 去重掩盖变化。
4. 字段验收：本批之外1036项除正常 release_id 外全字段与 ca870 一致；五目标仅允许 runtime、追加 sources、明确批准的 patch 变更和派生 verification。verification_notes 若变化逐键说明，不能整段豁免；现有五项 limitations 均已有完整事实对象，无需改写。索引仅放行五项派生评级、计数和正常发布路径/元数据；旧14 deep 内容与身份不变，扩展24项不变。
5. 补丁验收：完整34项与发行脚本映射不遗漏；最终每个运行代码来源被 patch.source_ids 覆盖，保留旧前缀，note 只扩大到已核范围。状态迁移候选由主线程确认精确证据后再进入白名单，不能借计划预授权。
6. 后续测试由主线程统一执行：既有 validateRuntime/deriveVerification/validateDetail/validatePublication、B2专项与受影响旧保护、必要整合测试；历史测试保留自己的固定发布及精确 deep 断言。B2负例须覆盖注册/解析冒 deep、缺独立文档、伪/漏/重复来源、引用顺序、失败证据错放另一步（总集合仍合法）、未经批准状态迁移、旧事实及非目标变化；语义反例覆盖 fork 成功保证、setrlimit失败误写exit、空auto与显式空集合混淆、free误写close、kqueue覆盖available、ENOSYS/ECONNABORTED出口、CLOEXEC外层条件遗漏。按实际代码锚点验证，不依赖步数或中文关键词。
7. 发布与桌面验收由主线程在最终同一 release 完成：构建、真实测试数量和结果、五项网页与Markdown范围/步骤/全部引用/deep逐字段对齐；等待异步详情完成，不能用HTTP200替代。样例仅主线程读取，保持A24/24、B258/258、50身份、外部引用2/1、默认/继承未核实0，不把原配置复制进测试。现场版本、include内容、系统限制、真实运行和性能仍未验证。
8. 完成判据：实施证据、独立审核和主验收绑定同一最终发布；五身份逐项通过或明确保留basic及未决原因，旧14deep和全部非目标保护通过，patch迁移有明确主确认，页面与自动测试证据齐全。若五项全过才称B2完成及19deep；不得用数量代替语义签署。

本次规划仅通过 apply_patch 新增本文；只读项目规划、B1证据/审核、当前知识、固定发布及本地固定源码/文档/补丁。未联网、未运行OpenResty、未读私有配置、未build/test/browser，未产生临时文件。上文尚需实施补齐的证据和测试均为后续要求，不是本次已执行结果。
