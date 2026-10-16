# B2 Worker 容量运行时独立审核

日期：2026-10-14。状态：独立预查及完整计划阅读完成，主已放行实施，等待实施冻结稿；未签署 B2 通过。

## 深度交互：审核目标与边界

审核对象是五个精确身份从配置值到真实进程、连接或事件消费的条件、动作、失败出口及其逐步证据绑定。注册、配置解析或步骤数量不足以证明运行时闭合；19 deep 仅是五项全部满足条件时的集合结果。

基线固定为 `dist/knowledge/releases/1.27.1.1-ca870e6c128ac027`，1041 basic（包含 deep）/14 deep。本次已读剩余运行时计划、首批 runtime 契约、代理链 REVIEW 和主 VERIFICATION。主 VERIFICATION 的 2026-10-14 补充已完成 ca870 桌面复测：A24/24、external2，B258/258、external1，五项33步及 scope/全部链接与最终数据一致；截图为 `analysis/sample-proxy-chain-runtime-final-browser.png`。这是主线程的 B1 验收，审核未操作浏览器或读取原样例，不把此前“桌面待完成”的历史段落作为最新状态，也不将 B1 验收移作 B2 证据。

本次检查时尚未发现 `analysis/SAMPLE_WORKER_CAPACITY_RUNTIME_PLAN.md` 或实施冻结记录，以下是独立审核清单，不替代完整 B2 方案，不提前判定实施遗漏。

## 直接执行：固定基线与来源

本审核唯一写集合为本文，使用 apply_patch。未修改知识、测试、构建产物、其他报告；未运行测试、build、补丁回放、浏览器、生产或 OpenResty，未读取私有配置，未产生临时文件。只读脚本用于解析既有 JSON、读取固定 Git 对象与比较证据。

固定 revision：nginx `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`；OpenResty `8c37412c31621225e7aa7e825b5b50106c9c71c4`；nginx-docs `e8b581903e9d41252720053311cea687a5671674`。下列源码坐标均为该固定 nginx，补丁另以固定 OpenResty 原文件为准，不使用在线最新版或补丁头的历史行号替代源码行号。

五份基线详情已解析读取，共62条 sources 的 code 按各自 revision/file/start_line/end_line 从 Git 对象逐字比较，全部相同。该结果只证明基线片段一致，不代表新增来源元数据或最终内容已通过。

| 精确身份 | 来源数 | 基线 patch_status | 基线详情文件 SHA-256 |
| --- | ---: | --- | --- |
| nginx--ngx_core_module--worker_processes | 10 | verified_unaffected | `170ebf9a7d1d7ba119efc65f7f055a9f4f58cc6ad7a33b00d2dd74769e4b998b` |
| nginx--ngx_core_module--worker_cpu_affinity | 12 | verified_unaffected | `0dc6025ad746a8f34ffda250847fc2b0d41f22bf8998006be3e48fc4e53c0f1d` |
| nginx--ngx_core_module--worker_rlimit_nofile | 8 | verified_unaffected | `4f79d6aac3219851dd8cfaeaca98f98e24a0c1a8db4e009e56cd74efebbf419c` |
| nginx--ngx_event_core_module--worker_connections | 19 | verified_unaffected | `e5954bb64aa4fec8a1620148b370d3fb84ceb4325870e3070198de5afab88bd1` |
| nginx--ngx_event_core_module--multi_accept | 13 | verified_affected | `34b94564b6785f6fe55d73cf6a20ade2244ad0a5687bf22e74b5946241e942ca` |

五项均为 basic_verified、无 runtime。旧默认、继承、limitations、phases、summary 等仍受保护，即使 phases 为 configuration，也不能为新增 runtime 顺带改写。

## 已核真实消费与终审分支清单

| 身份 | 已读固定消费点及终审要求 |
| --- | --- |
| worker_processes | `src/os/unix/ngx_process_cycle.c:128–132,211–244,336–349,699–721`：master 按有效数量循环派生普通 worker；新 cycle 初始化失败保留旧 cycle，成功才取新值创建新代并发退出信号。数量是创建尝试，不保证派生全部成功；冻结稿若声明失败行为，须另绑定 spawn 的实际失败出口。`278–331` 的 single 路径直接初始化模块并处理事件，不按该数量派生；single 信号/退出若写入，必须结合下述补丁。不能把 cache helper/agent 算进普通 worker 数量，也不能声称 reload 期间始终只有新数量。 |
| worker_cpu_affinity | `src/os/unix/ngx_process_cycle.c:853–859` 仅 worker>=0 才取掩码；`src/core/nginx.c:1499–1549` 区分未配置、auto 空掩码返回 NULL、auto 按 worker 索引循环选择置位 CPU、显式数组不足时复用末项、平台不支持返回 NULL。`src/os/unix/ngx_setaffinity.c:11–53` 分 FreeBSD/Linux 能力调用，失败记录 ALERT 后返回，不保证绑定成功或退出进程。不把配置掩码解释成实时系统允许集合。 |
| worker_rlimit_nofile | `src/os/unix/ngx_process_cycle.c:753–786` 显式设置才同时赋软、硬限制并调用 setrlimit，失败 ALERT 后继续；UNSET 跳过。此分支本身没有 worker>=0 条件，不能泛称 helper 必不执行；single 不调用普通 worker 初始化的边界需与入口一同证明。`src/event/ngx_event.c:514–538` 的 getrlimit/警告不修改实际额度，也不证明后续 setrlimit 成功。 |
| worker_connections | `src/event/ngx_event.c:754–823` 分配 connection/read/write 三组数组、失败 NGX_ERROR、建立 free list、监听占用对象；`src/core/ngx_connection.c:1175–1250,1373–1426` 先检查 fd 索引边界，再尝试回收 reusable 连接，取空闲对象；耗尽返回 NULL，归还时恢复 free list/count。回收调用 handler 不保证立刻释放，不能写成到阈值必成功腾空。`src/event/ngx_event_accept.c:139–151` 客户端分配失败关闭已接收 socket；上游使用同一资源池，冻结时核其对应失败返回。监听 reuseport 跳过需结合关闭 fd 补丁。数量不是客户端公式，agent 用独立连接数。 |
| multi_accept | `src/event/ngx_event_accept.c:21–151,303–324` 非 kqueue 用 multi_accept 设置 available，do/while 至少尝试一次；kqueue 消耗后端 available。EAGAIN 返回；accept4 ENOSYS 修改标志后 continue，仍受循环条件控制，不能保证同次立即回退成功；ECONNABORTED 按 available 决定继续。EMFILE/ENFILE 停接收并按 mutex/定时器分支恢复，随后返回；连接分配及注册失败亦退出。成功调用监听 handler 后才到循环尾。`src/event/ngx_event.c:856–881` 的 IOCP 使用独立 acceptex 路径，不能推广普通 accept 的开关语义。 |

独立文档必须使用固定 nginx-docs。已读 `xml/en/docs/ngx_core_module.xml:553–625,651–673` 的连接数、CPU 和 worker 数量正文；其余文档片段随冻结稿逐一核实。文档仅作第二信号，不替代失败出口源码。

## 34 项补丁独立预查

已读取 `NGINX_PATCH_AUDIT.json` 的34项集合，并从固定 Git 读取全部34个补丁的目标文件；与固定发行脚本中的 `$ver`/`$main_ver` 路径逐项定位，34项顺序一致。首次只读定位用了展开后的版本字符串而未命中，已修正为脚本真实变量路径；不把首次未命中报告为补丁缺失。此处尚不等于完整条件映射及冻结消费区间终审，更不代表本轮回放。

已详读下列固定补丁正文，其余目标交集须在冻结消费范围确定后补齐：

- `privileged_agent_process` 与 `privileged_agent_process_connections`：新增独立 agent 的启动、权限分支及独立 connection_n；不能沿用早期 agent 常量512覆盖后续补丁中的独立字段。普通 worker 启动循环不因文件有补丁就自动判为 affected，反之扩大到相关新增消费也不能照抄旧 unaffected。
- `single_process_graceful_exit`：single 模式接收重配置信号被改为 terminate，并补优雅退出逻辑。若冻结稿照搬上游 single reload 描述，需打回；最小范围可仅说明不派生普通 worker，不扩完整 single 生命周期。
- `reuseport_close_unused_fds`：不属于当前 worker 的 reuseport 监听先关闭 fd、置 -1 再 continue；关闭监听时另跳过 -1。
- `socket_cloexec`：accept4 增 SOCK_CLOEXEC，条件性 fcntl 失败关闭已接收连接并返回；上游 socket 路径亦改标志/失败清理。相关步骤若引用完整路径，不能只用未补丁上游片段描述发行行为。
- `init_cycle_pool_release`、`proc_exit_handler`：分别影响退出时初始池释放及进程状态回收后的 exit callback。仅在冻结 scope 涉及相应生命周期时纳入，不靠补丁名称推定所有五项状态。

待重点核查 `delayed_posted_events` 的事件循环交集及 `cache_manager_exit` 等 helper 分支与最终 scope 的关系。原 multi_accept 保持 affected；其余四项默认保持 unaffected。任何状态迁移须向主提交精确身份、旧/新状态、旧范围、新消费点、固定 hunk、行为变化与 evidence ID，获得主明确确认后才进入允许变更集合；当前没有 B2 状态变更授权。

## 冻结稿及发布终审门槛

1. 完整读取 B2 PLAN 后逐项建立“要求—实现步骤—固定证据—审核结果”，不以本预查取代计划。对遗漏或错误给出位置、影响、最小修订和复核结果。
2. 逐步检查 condition/action 的真实入口、时序、平台条件和失败出口。每步直接绑定支持该步声明的片段；只在 runtime 总集合有证据、仅注册表或换 ID 的配置回调均不足。
3. 从原样发布 sources 核固定 Git code 与全部元数据、ID、URL、顺序和重复；完整保留旧 source 对象，新来源按 curated 顺序追加于原 distribution-version 之前。不得排序实际数组或先 Map 去重。旧 evidence 前缀以冻结摘要保护。
4. 五项目标仅允许计划约定 runtime、新增来源、patch 引用追加及必要范围 note、派生评级等精确变化。patch 状态采用主批准的逐身份白名单；其他键逐一保护。旧 limitations 固化若必要，发布完整对象必须不变。verification_notes 不整字段豁免。
5. 其余1036项仅允许正常 release_id 变化，详情和索引同时比较；顶层和来源组只接受真实派生计数及正常发布路径。全部五项晋级时应是 ca870 原14项加这5项，共19 deep，bundled1017/19、扩展24/0；否则记录真实集合及未决项，不能凑数。
6. 内容冻结可与主测试准备独立进行；主收到最终冻结后统一 build。构建前内容审核、构建后发布来源审核、主测试及桌面验收分别记录，不能提前签署最终发布。最终各报告必须绑定同一冻结摘要和 release。

主最新交接：新增 `test/worker-capacity-runtime.test.mjs` 的7项通用保护/真实查询测试，在 ca870 上7/7预期失败；旧 evidence 前缀摘要已冻结到测试。历史 proxy-chain index 固定 ca870，B1内容继续保护历史与当前 curated；本批专项承担当前发布与 ca870 的比较。主将按固定源码和冻结步骤补逐步语义与错位负例。以上仅记主交接，审核未执行或预审未完成测试，当前失败不列为实施缺陷。

下一审核输入：完整 B2 PLAN、五项冻结稿及摘要、补丁范围与任何状态变更的主确认。当前结论保持“预查完成、终审待冻结”，不得使用本文宣称 B2 内容、发布或测试已通过。

## 完整计划接收与主放行后的审核对齐

本节更新前述等待计划的历史状态。已完整读取 `SAMPLE_WORKER_CAPACITY_RUNTIME_PLAN.md`；主明确确认 ca870 页面完成、计划放行实施。本批仅五条知识、专项测试和分析文档，不改产品 schema/UI 或晋级规则。当前未收到实施冻结稿，不进行未完成测试预审。

深度交互：计划将五种资源约束分别解释，并限定 Unix 普通 worker、新代初始化、连接池及普通流式 accept，能避免把数量、CPU、fd 与池容量合成请求容量。无需扩展全部进程退出或后端实现；single/helper/agent/IOCP 作为边界即可。计划要求的失败入口与清理调用者必须补齐，不能因为采用最小范围而省去已声明动作的必要条件。

直接执行：终审除此前清单外，逐项按完整计划核以下要求，所有结果目前均为“待冻结稿对照”，没有标记通过：

| 计划要求 | 冻结稿对应审核点 |
| --- | --- |
| worker_processes 1–4 | single/master 分派；槽位、通道、fork 失败与子进程 proc 调用；新代失败保留旧 cycle、成功取新值但不保证全员创建成功；ngx_new_binary 例外；计数排除 helper/agent。 |
| worker_cpu_affinity 1–4 | 普通 worker 初始化入口与 worker>=0；未配置、auto 空掩码和显式空集合区别；末项复用；平台 guard、系统调用失败继续；不改旧 implementation-1 补尾。 |
| worker_rlimit_nofile 1–3 | 环境初始化失败先 exit(2)；UNSET 跳过；软硬值同时尝试、失败日志后继续；新代初始化而非实时改旧 worker，single/helper 范围准确。 |
| worker_connections 1–5 | 三数组失败连到 init_process 调用者 exit(2)；监听、客户端、上游各自失败出口；reuseport 关闭 fd 后跳过；drain 尝试与空池返回；free 与 close 区别及 shared socket 例外；agent 独立容量。 |
| multi_accept 1–5 | 非 Windows 完整入口上下文、IOCP 边界；恢复事件失败；非 kqueue 开关与 kqueue 数量；EAGAIN、ENOSYS、ECONNABORTED、EMFILE/ENFILE；初始化及清理实际例子；CLOEXEC 的外层非继承非阻塞、非 IOCP 条件及编译 guard。 |
| 交接验收 1–3 | 旧 evidence 前缀摘要；冻结 EVIDENCE；逐步语义、独立文档、来源原文及完整元数据、顺序和重复检查。 |
| 交接验收 4–5 | 1036项及旧14deep保护，五目标精确字段白名单；五项 limitations 已为完整对象，无需固化或改写；34补丁与最终片段交集、引用覆盖、状态主确认。 |
| 交接验收 6–8 | 待主补完逐步语义锚点和错位负例后只读审核；主统一测试、冻结后构建及同 release 页面/Markdown验收；真实 deep 集合及五身份逐项交账。 |

对前文 limitations 的通用例外收紧：本计划明确五项均已有完整事实对象，因此本批不需要该转换，终审不以通用契约为由放行额外改写。

worker_connections 的 reuseport 监听分支具有已读补丁交集，状态迁移当前只是候选。主“预计迁移、等 Sol 精确申请”不构成批准；收到精确申请并获主确认后，才记录唯一身份、状态及 note 的允许变更。其余四项状态和全部其他 patch 键继续按基线保护。

下一输入收敛为五项冻结稿及摘要、实施补丁说明与状态申请/主确认；完整计划已接收。本文仍不签署 B2 内容、发布、测试或桌面通过。

## 12项测试静态审核与固定条件补查

按主最新授权，已完整读取 `test/worker-capacity-runtime.test.mjs` 的12项测试及 `src/query/knowledge.mjs` 对应校验器，未执行测试或构造运行负例。阅读期间主补入注册/配置回调别名及裁剪负例，本次已一并读到；下面位置以包含该段的版本为准。步骤错位负例尚待冻结稿是已知实施安排，不列为缺陷，不要求现在预审最终步骤。

### R1（P2，待主修订）：非目标详情的 release_id 被无条件覆盖，混版可漏检

位置：`test/worker-capacity-runtime.test.mjs:196–211`，特别是202行。全1041项比较中，`stable.release_id = before.release_id` 在任何版本一致性检查之前执行。五目标另有 validateDetail，但其余1036项未逐项执行该校验，真实查询也只覆盖五目标。因此若新目录中某个非目标详情仍携带 ca870 的 release_id，或者该字段被删/改为任意字符串，只要其他字段相同，该全量保护检查仍接受。运行时 `validateDetail` 会按索引版本拒绝这份详情，故这不仅是报告元数据差异，也可能导致对应查询失败。

最小修订：在全量 check 内归一化之前先断言 `actual.release_id === index.release_id`，或逐项调用 validateDetail(actual, entry, index) 后再比较；增加一个非目标详情残留 ca870 release_id 的拒绝负例。该问题由代码直接推出，本审核没有运行测试，亦未断言当前发布已存在混版。

### R2（P2，待主修订）：current 索引未与同 release 的冻结索引比较

位置：测试顶部读取 `dist/knowledge/index.json`，以及182行起的索引保护。当前只读取 ca870 的历史 index；未读取 `dist/knowledge/releases/${index.release_id}/index.json` 并与 current 完整比较。默认五项查询走 current，显式 release 查询只读 ca870，因此本批冻结索引若遗漏条目、评级/计数仍旧或与 current 不同，本专项没有消费它，无法发现。同一发布的默认查询和显式版本查询可能不同。

最小修订：读取当前 release 目录下的 index，原样 deepEqual(current, releaseIndex)，不归一化掉 differences；可对该比较加一个只改冻结索引字段的负例。既有 validateIndex 已严格约束 detail_path 和 references_path 与当前 release 的关系，不需要另放宽路径或增加产品规则。

### 已有保护的静态结论

- 五目标的完整 sources 数组直接按预期顺序 deepEqual，且旧 source 每个完整对象再次比较，validateDetail 还拒绝重复 ID。这里的 expected Map 没有先处理实际数组，不构成实际来源去重漏洞；新增重复 evidence 也会进入 order 并被实际来源重复校验或数组比较拒绝。
- 新来源预期对象重取固定 Git 片段，并包含 component/version/revision/file/起止行/code/URL/kind；即使没有给每个键各写一个变异负例，完整对象比较已覆盖这些键。旧 curated evidence 前缀摘要与旧发布来源再比较，保护旧正文及顺序。此次未发现可据此报告的来源元数据绕过。
- 五目标的其他字段在全量比较中保留，包含 defaults、inheritance、limitations、availability、phases、configuration_entry、verification_notes；非目标也不是只比若干事实字段。未见旧事实被整段豁免。note/source_ids 的放行仅在 patch 内，status 与额外键仍锁住，source_ids 保留旧前缀并拒绝重复。
- runtime 与当前 curated 全等只能检出“发布偏离 curated”，不能证明二者同时写错时的语义；主已安排冻结后逐步语义及错位负例，本次不重复列为待修缺陷，也不把第157行修改 action 的一致性负例称作独立语义验证。

### 固定条件补查

重新读取固定 `ngx_event_accept.c:183–204` 确认 FD_CLOEXEC 新增语句所处的外层 `!ngx_inherited_nonblocking`、非 IOCP 分支，补丁另有 NGX_HAVE_FD_CLOEXEC。固定 `ngx_connection.c:1296–1313` 明确先 free_connection，随后 fd=-1；shared 直接返回，不关闭共享 socket。固定 `ngx_process_cycle.c:891–898` 确认模块 init_process 返回 NGX_ERROR 后普通 worker exit(2)，供终审核事件数组分配失败的调用者闭合。

已补读 delayed_posted_events 全文：改变循环等待和队列初始化，不改计划754–801数组分配；cache_manager_exit 改 cache helper 退出；privileged_agent_process_thread_pool 改 helper 线程池适用条件。这三者不应被扩写为普通 worker 的本批直接消费变化。又读固定文档 multi_accept:360–377、nofile:690–701，前者的“全部连接”须受实际错误出口限制，后者不重启 main 的说明不能解释成即时修改所有旧 worker 限额。

## 唯一 patch 状态迁移批准记录

主最新明确批准：仅 `nginx--ngx_event_core_module--worker_connections` 从 `verified_unaffected` 改为 `verified_affected`；其余四身份状态不变。已读取 Sol EVIDENCE 的唯一申请，并再次独立核固定 `reuseport_close_unused_fds.patch:17–38` 与上游 `ngx_event.c:807–811`：NGX_HAVE_REUSEPORT 下，不属本 worker 的 reuseport 监听在 continue 前尝试 close，失败记 EMERG，仍置 fd=-1 后 continue。新增监听消费范围因此具有实际补丁影响，批准理由充分。

本节替代此前“尚无状态授权”的历史状态。主将把该唯一迁移纳入测试白名单；现 checkPatch 尚按旧状态全等是正在衔接的已知事项，不另报重复缺陷。批准不放宽其他 patch 键、旧引用前缀、五目标旧事实或其他身份；用户可见 note 只写事实，批准流程留分析。最终仍须核迁移是否准确落在已批准身份、冻结步骤及相应 source_ids 上。

R1/R2已报告主线程，由主修订测试；审核只写本文。实施未冻结，不签署 B2 内容或最终发布通过。

## 26步当前稿逐步审核：两处内容补正、一处测试反例修订

当前稿步骤数为 processes5、affinity4、nofile4、connections6、accept7，共26步。审核读取的 knowledge 文件字节 SHA-256 为 `875fbf13ac9c34c6c12a4ee05685fb4400b0dee9f7422af63d15f30baf475ece`，只用于识别本次阅读对象，不作为实施最终冻结。排除五目标后的 curated 序列摘要仍为 `eaeaa8e249390304e465bf87600f5de6d7470993f280621b29e61e7e037617ab`，与实施前记录一致。当前五项状态符合唯一批准迁移；未读取私有样例或执行测试、build。

### R1/R2修订静态复核关闭

已直接读取修订：全量 check 在归一化前断言 actual.release_id===index.release_id，并给每身份增加残留 baseline.release_id 的拒绝负例；current index 与当前 release 的冻结 index 原样 deepEqual，另加 coverage.gaps 漂移拒绝负例。两处原保护缺口在代码层关闭，实际执行结果由主提供，不冒称审核跑过测试。

### R3（P2，退回实施）：监听关闭条件缺少 ls[i].reuseport

worker_connections 第2步当前写“对 NGX_HAVE_REUSEPORT 且监听不属当前 worker 的分支……close fd”。固定 `src/event/ngx_event.c:807–811` 和 `reuseport_close_unused_fds.patch:22–36` 实际要求同时满足编译能力、`ls[i].reuseport` 为真、worker 不匹配。仅编译支持 reuseport 并不意味着普通共享监听也可按 worker 索引关闭。

最小修订：该步显式补“监听已启用 reuseport”；保留已有 connection-pool/reuseport-patch 绑定即可，无需新增来源、扩大范围或再次申请状态迁移。主测试可保护该步三重条件。

### R4（P2，退回实施）：posted accept 入队到实际消费缺少调用点绑定

multi_accept 第1步已绑定 kqueue `600–635` 的 available 赋值、`660–669` 的入队/直接调用，以及 `ngx_event_posted.c:18–35` 的通用队列处理函数。但当前 source_ids 没有实际把 `ngx_posted_accept_events` 传给该函数的调用点；只有函数体不能完整证明此 accept 队列实际被消费。

固定 `src/event/ngx_event.c:248–255` 明确先处理后端事件，再调用 `ngx_event_process_posted(cycle, &ngx_posted_accept_events)`。最小修订是追加这一固定片段并绑定第1步，同步 runtime 并集及 patch 引用。无需扩展全部事件循环或改动旧来源。

独立重核 delayed_posted_events：该补丁在 mutex 前增加延迟队列非空时 timer=0，并在普通 posted 处理后追加另一条 delayed 队列循环；未改上述后端事件/accept队列消费调用、kqueue 分派、通用 posted 函数及219–239的 mutex 条件分支。当前文字没有声明完整调度顺序、等待时长或延迟队列行为，故本次补齐248–255不要求把 delayed 分支扩为 runtime 步骤，也不新增状态迁移。EVIDENCE 应明确这个限定交集判断。

### R5（P2，交主修测试）：nofile错位负例先破坏结构，无法到达语义拒绝

`test/worker-capacity-runtime.test.mjs:128,152–157` 的 nofile case 以781行为锚点，把该步所有覆盖此行的引用移走，再要求 validateRuntime(wrong)===true。当前 nofile 第2步仅含 implementation-0（777–786）和 runtime-nofile-init（753–798），两者均覆盖781，因此移走后 source_ids 为空；既有 validateRuntime 必定以步骤缺代码拒绝，不能满足后续断言。这是根据当前稿与校验器直接得出的静态结论，审核未执行负例。

最小修订由主在测试中完成：在该步保留一个来自现有 runtime 总集合、但不覆盖该锚点的合法代码引用，再移走全部真正锚点引用到其他步骤，保证总体引用集合不变、结构校验通过且对应步骤语义检查失败。不要为负例改变知识正文或放松 validateRuntime。CPU selector 已改为“显式 auto 从”，当前能唯一定位第2步，不再混淆显式列表步骤。

### 五项逐步核查结果

| 身份/步骤 | 当前语义及绑定结论 |
| --- | --- |
| processes 1–2 | 固定 N337–341/380–385 与 P128–132闭合模式和启动；worker-spawn 与 spawn86–244覆盖循环、槽位/通道/fork失败、子进程调用，明确不保证存活数。未将配置解析冒作运行证据。 |
| processes 3–5 | 索引传递、agent独立数量、reload失败保旧/new_binary例外、JUST_RESPAWN设置与signal循环清除just_spawn均有对应片段；single仅入口及init失败，不误述补丁改变的reload/退出。当前未发现需补正文问题。 |
| affinity 1–4 | 环境失败前置、worker>=0/非NULL、auto空掩码与显式零集合区别、末项复用、两平台guard及失败继续逐步绑定成立。未保证现场绑定或独占。 |
| nofile 1–4 | 环境失败、UNSET、软硬限制、失败ALERT继续、新代spawn实际调用与single/helper边界均闭合。测试R5不影响这四步正文语义。 |
| connections 1、3–6 | 模块hook同时绑定数组实际消费与调用者exit(2)；取槽边界、drain的条件与尝试、客户端/上游取槽失败、free/close/shared区别均有直接片段。第2步仅R3条件文字须补；状态迁移已批准。 |
| accept 1–3 | 非Windows SOCK_STREAM/Windows IOCP预处理上下文完整；kqueue available与直接调用成立，posted消费尚缺R4调用点。EAGAIN和ENOSYS continue后仍检查while、ECONNABORTED计数条件与绑定相符。 |
| accept 4–6 | EMFILE/ENFILE停接收失败与mutex/timer分支、超时恢复、pool/sockaddr/log分配、CLOEXEC外层与编译guard、清理helper、add_conn/非EPOLL失败及成功交handler后循环条件均有本步证据。 |
| accept 7 | mutex初始化三条件及Windows禁用、use_accept_mutex门控下disabled递减/抢锁、enable/disable helper失败返回有直接证据；未承诺公平性或完整等待时长。delayed补丁不改所述限定分支，不必借此扩大研究。 |

上述表是当前稿语义审查结果，不等于最终来源元数据、全发布保护或测试验收通过。R3/R4需实施补正并重新冻结；R5由主修测试。最终还须对照 Sol 最终 EVIDENCE 摘要、全部实际 sources 和同一 release 的主验收记录完成签署。

## 最终候选06a639：内容与发布数据审核通过

签署对象：`1.27.1.1-06a6394fb516a4bb`；固定比较基线：`1.27.1.1-ca870e6c128ac027`。knowledge 文件实读 SHA-256 为 `a2666ba27952f66a749ae9ab1557d4d13e34e529976b9137ed7cf05570676b82`，与 Sol 最终 EVIDENCE 和主构建前后摘要一致。五对象 JSON.stringify 摘要逐一与 EVIDENCE 重新冻结表一致。当前结论为内容审核通过、发布数据审核通过；全量测试和最终桌面验收待主记录，不签署整批最终QA完成。

### R1–R5关闭与26步最终语义

R1/R2：保留此前已核的发布ID前置检查、逐身份残留旧ID负例、current/冻结index全等与gaps漂移负例，本次实际发布亦独立核全1041详情release_id及current/index一致。

R3：connections第2步已明确 NGX_HAVE_REUSEPORT、ls[i].reuseport 为真及worker不匹配，原两条固定来源完整保留。三条件对应源码/补丁一致，关闭。

R4：accept第1步已直接绑定新增 `runtime-accept-posted-consume`（固定 nginx `src/event/ngx_event.c:248–255`），runtime首次出现并集与patch追加引用同步。后端入队→事件循环消费accept队列→通用函数调用handler闭合；delayed_posted补丁的另队列/timer不扩入此限定范围，关闭。

R5：反例移走本步全部真实锚点后，若本步为空，补入现有runtime集合中不在moved内的代码引用，再把真实锚点放到其他步；nofile实际补入worker入口来源，不覆盖781。总runtime集合保持，步骤不空，validateRuntime成功的断言保留，再由本步锚点校验拒绝。CPU selector已唯一定位auto步骤；R3三条件与R4的255实际调用锚点已加入对应步骤反例。代码复核关闭，主23/23定向日志进一步确认该反例组执行通过。

独立比较最终runtime与3a75初稿：仅还原connections第2步action，以及accept第1步新增引用/runtime并集后，五项runtime分别与已审初稿完整相等。因此此前26步逐项语义审核与本次R3/R4修正共同覆盖最终稿，未以数量相同替代内容检查。步骤仍为5/4/4/6/7，合计26。

### 固定发布106条来源与边界独立核对

本次只读逐条检查固定06a639发布，未运行测试套件、构建或浏览器：

- 五项实际sources分别为19/17/15/27/28，共106条。每条以固定 nginx/OpenResty/nginx-docs revision 重取 Git 原文，完整重建 id/component/version/revision/file/start_line/end_line/code/url/kind；与实际source对象逐字段相等，无重复ID。未先替换实际code、排序实际数组或Map去重。
- 来源数组完整顺序等于ca870旧来源暂移末项distribution-version后，按curated顺序追加44条新evidence，再放回原distribution-version。62条旧完整source对象和全部元数据保持。47条旧curated evidence按7/9/5/16/10前缀重算，五个摘要与PLAN全部一致。
- runtime与最终curated完整相等；runtime.source_ids精确为步骤来源首次出现去重并集；patch引用保留旧前缀和顺序、无重复且覆盖全部runtime代码。独立文档继续分列。patch只允许worker_connections的已批准affected迁移，另四状态及其他patch键保持；note与引用的新增范围与内容审核一致。
- 五目标仅归一化runtime、允许来源/patch及派生verification和release_id后，与ca870全部其他字段完整相等，包含旧defaults/inheritance/limitations、phases、availability和verification_notes。非目标1036详情仅归一化正常release_id后完整相等，且归一化前全部release_id等于06a639。
- 索引每个条目身份、顺序及旧字段保持；仅放行正常detail_path、五目标派生评级。顶层只放行正常release路径、实际deep计数，其他schema/coverage/gaps及分组信息不豁免。current index与06a639冻结index完整相等。
- deep身份集合精确为ca870原14项加B2五项；实际1041 basic/19 deep，bundled1017/19、department_extension24/0。原14项内容未变，C1仍basic，无额外身份晋级。非目标curated序列摘要仍为 `eaeaa8e249390304e465bf87600f5de6d7470993f280621b29e61e7e037617ab`。

以上比较未发现差异或越界，R1–R5均无剩余内容/保护实现问题。34补丁固定集合、相关hunk及新增消费交集沿前文独立核查，最后追加248–255未引入新直接补丁变化；未把历史补丁回放称为本轮执行。

### 计划交账及主验收边界

PLAN五身份消费链、平台/失败分支、本步直接证据、独立文档、旧前缀、状态白名单、发布完整元数据/来源顺序、1036项及旧14deep保护，均已按最终稿核完。实施 EVIDENCE 的最终冻结段与本次审核相符，历史初稿段落不冒称当前状态。

已直接读取 `analysis/sample-worker-capacity-runtime-focused.log` 末尾：23 tests、23 pass、0 fail/cancelled/skipped/todo，1530.748958毫秒。由主绑定最终06a639，本审核只读确认日志；不将3a75的22/23替代此结果，不声称审核执行测试。

PLAN最终全量测试、五项网页/Markdown及A/B样例验收仍由主完成并交付同一release记录。未收到前保持QA待验收；仅内容及发布数据已通过，不预签桌面或现场运行。五项全验收后剩余25个运行候选，六项C1仍basic，不称50身份全deep。

本轮唯一写入仍为本REVIEW，使用apply_patch；无其他文件修改，无临时文件。

## 最终签署：B2内容、发布、自动测试及桌面验收通过

签署发布仍为 `1.27.1.1-06a6394fb516a4bb`，knowledge SHA-256仍为 `a2666ba27952f66a749ae9ab1557d4d13e34e529976b9137ed7cf05570676b82`。本节取代此前全量测试和桌面待验收的状态；R1–R5全部关闭，无剩余实质问题。

### 历史sample-remaining14修订审核

完整读取修订后的 `test/sample-remaining14.test.mjs`。历史索引仍固定647706874ae7c03c、比较基线仍固定2dca5fdd6a398672；仅精确映射 affinity/nofile 两身份，在 curatedFor 中取旧 evidence 前缀9/5，并使用ca870旧patch对象。其他12身份仍走原curated逻辑，defaults/inheritance仍与当前旧事实完整比较；旧sources、patch note/status/引用及其他字段的比较和变异负例未删除。

独立只读比较两身份的6477与ca870实际详情：各自除release_id外全字段相同，patch对象完整相等。因此引用ca870旧patch没有给历史验收换入不同期望。当前9/5前缀重新计算摘要，分别仍为 `b282544fde337fbf0da88371e32a8e367e5af00ff8ca4726ed1b5f30e22dbd53` 和 `03d80411cf264e78c359b3960286d7ed9b5e859951048af80fb100cd355ca5a2`，与本批冻结一致。

B2专项仍独立检查完整当前runtime、全部固定来源元数据及顺序、旧前缀hash、唯一状态白名单、五目标旧事实和1036项全字段保护。历史专项只恢复自身旧发布输入，没有把当前新增证据从B2验收排除；该修订合理，未发现放宽保护。首次191/194保留为历史失败记录，不替代修后结果；不需要修改产品或知识迎合旧测试。

### 最终实测证据

审核已直接读取两份最终日志末尾：

| 主执行日志 | tests/pass | fail/cancelled/skipped/todo | 耗时 |
| --- | --- | --- | --- |
| analysis/sample-worker-capacity-runtime-final-focused.log | 39/39 | 全0 | 1289.820334ms |
| analysis/sample-worker-capacity-runtime-final-tests.log | 194/194 | 全0 | 34149.866875ms |

已读取主 `SAMPLE_WORKER_CAPACITY_RUNTIME_VERIFICATION.md` 的最终06a639记录：CLI原样例A24/24、B258/258，50身份中19deep、默认/继承未核实0；最终网页页脚06a639/19deep，A外部2、B外部1。A的processes5/affinity4/connections6/accept7与B的nofile4，共26步的condition/action、顺序、scope、全部代码/文档URL和deep徽标与final dist逐字段一致。截图 `analysis/sample-worker-capacity-runtime-browser.png` 由主保存并目视检查。

首次旧checkPage闭包仍读ca870导致runtime undefined，主改为显式传最终entry/detail后通过；这属于验收脚本修正，没有修改产品，不把首次错误当产品回归。审核没有操作浏览器、查看私有原配置或自行执行测试；桌面/样例结果按主同一release的验收记录签署，源码和发布数据则由审核独立只读核对。

### 计划完成交账

五身份按PLAN限定范围完成：真实运行消费者及失败/平台边界、本步固定证据、独立文档、34补丁相关交集及唯一批准迁移均已审；106条完整发布sources、44条新增evidence、47条旧curated前缀、62条旧sources、1036项非目标、旧14deep及索引元数据保护均已核。最终内容、冻结摘要、发布ID、定向/全量与桌面记录一致，正式签署B2本批验收通过。

总量1041 basic/19 deep，bundled1017/19、扩展24/0；样例50身份中19项已审限定runtime、6项配置边界完成但仍basic、25个运行候选待补。仅此B2计划完成，不将结果扩展为全部50身份deep、现场参数有效、外部include已分析或OpenResty真实运行/性能验证。

最终仅通过apply_patch追加本REVIEW；未修改其他文件，未运行测试/build/browser/生产，未生成临时文件。
