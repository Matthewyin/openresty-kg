# 两样例剩余14身份独立审核

日期：2026-10-13。审核范围：`SAMPLE_REMAINING14_PLAN.md` 阶段一。状态：阶段一审核通过并收口，无未关闭审核问题。release `1.27.1.1-647706874ae7c03c`；全量npm test日志已独立核读，138/138通过，含既有实际补丁回放；主线程浏览器两样例验收已完成并落盘。runtime/deep等待用户另行下达阶段二审核任务。

## 深度交互：验收边界

默认值和继承补证据不等于运行兼容性验证。块头、解析动作与普通字段分别判断；VTS核心handler不通用继承与沿用同一location配置必须分开。此次仅审14身份，不审核尚未实现的deep。

## 直接执行：逐项结论

前13项component均为nginx。

| module/name | 默认/继承审核 | 结论与剩余条件 |
| --- | --- | --- |
| ngx_http_core_module/server | not_applicable / verified：源码事实通过 | 无隐式server；新建srv/loc对象、共用main对象，按模块从http父配置合并；待整批发布验收 |
| ngx_http_core_module/listen | verified / not_applicable：源码事实通过 | 隐式IPv4监听按解析进程getuid选80/8000，Windows为80；显式地址默认端口80；共用地址不是继承；待整批发布验收 |
| ngx_http_core_module/location | not_applicable / verified：源码事实通过 | 匹配参数显式建立；新建loc对象并递归按模块合并，不将匹配条件视为继承；待整批发布验收 |
| ngx_http_core_module/error_log | verified / verified：源码事实通过 | 本层空指针引用父日志或cycle new_log；默认路径受构建/启动参数/prefix影响，显式本层链不追加父链；待整批发布验收 |
| ngx_conf_module/include | not_applicable / not_applicable：源码事实通过 | 显式解析动作，当前cf传入文件解析，不保存待继承配置槽位；待整批发布验收 |
| ngx_events_module/events | not_applicable / not_applicable：源码事实通过 | 缺块初始化报错，唯一main块，create/init没有跨块merge；待整批发布验收 |
| ngx_stream_module/stream | not_applicable / not_applicable：源码事实通过 | 空父srv配置与业务server区分，块唯一，server字段按模块merge；待整批发布验收 |
| ngx_http_module/http | not_applicable / not_applicable：源码事实通过 | 空父srv/loc配置不构成默认server/location；原继承正文及引用逐字保留；待整批发布验收 |
| ngx_http_proxy_module/proxy_limit_rate | verified / verified：源码事实通过 | UNSET继承复杂值指针，双方未配为NULL，消费默认0；请求求值回退与继承分开；待整批发布验收 |
| ngx_core_module/worker_cpu_affinity | verified / not_applicable：源码事实通过 | 默认不主动绑定，不等于放开OS限制；auto显式启用，无平台支持则告警忽略 |
| ngx_core_module/pid | verified / not_applicable：源码事实通过 | 构建宏及运行prefix决定路径；OpenResty包装器非msys追加nginx子目录，未混用纯nginx默认绝对路径 |
| ngx_core_module/worker_rlimit_nofile | verified / not_applicable：源码事实通过 | UNSET跳过setrlimit，保留已有资源限制；显式设置尝试同时改软硬限制，失败记日志 |
| ngx_errlog_module/error_log | verified / not_applicable：源码事实通过 | cycle默认error与启动notice区分；无文件目的地补默认文件，已有stderr也视为文件；main无层级merge |
| nginx-module-vts / ngx_http_vhost_traffic_status_module / vhost_traffic_status_display | verified / verified：源码事实通过 | 主线程中间发布457b89144a6e5398定向2/2通过，见VERIFICATION；整批字段保护仍待验 |

### nginx第一批6项独立核对

实际交付6项，不将文件名中的13误作全部交付。逐项从固定nginx对象`e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`读取新增18个身份内引用片段，完整阅读上下文创建、server/location递归merge、include解析、events必需性和init、stream父配置与server merge。逐项结论见上表；未发现事实错误或阻塞问题。

只读探针核对6项新旧evidence：ID无重复，全部固定片段行范围有效，旧片段code与坐标未变，事实引用可解析；patch_status的status/note与旧值一致，source_ids精确等于旧数组加本项新增引用。http已有inheritance逐字保留。固定文档`e8b581903e9d41252720053311cea687a5671674`的default/context交叉印证，结论不只依赖文档空default。

独立读取34个固定OpenResty补丁的目标与hunk：上述相关文件仅core_module.c的no_error_pages、event.c的delayed_posted_events/reuseport_close_unused_fds有改动，均不落入这18个新增片段；http.c、conf_file.c、stream.c、stream_core_module.c没有对应改动。此次审核没有自行回放全部补丁或运行全测，未冒称验证整个运行链。

### nginx第二批3项独立核对

逐字读取固定对象中的19项新增片段与日志/限速既有消费证据，未发现阻塞问题：

- listen：core:2985–3033明确getuid()==0用80、否则8000，Windows单独80；3958–4012显式listen设置default_port=80并初始化选项。http.c:1178–1227按端口、socket类型和地址族归组，1253–1317按地址合并并检查default_server重复，1423–1443给新地址赋首个server。正文未按worker user或server_name推断默认归属。
- HTTP error_log：core:3771–3777为空才继承父指针或cycle new_log；ngx_log.c:553–672本层链独立建立，479–504省略level为error。402–435建立默认文件日志，nginx.c:1072–1078选择启动覆盖或构建宏，auto/options:627–631处理stderr与logs/error.log，conf_file.c:886–914及945–952处理运行prefix/标准错误。额外只读检查cycle.c:359确有默认日志初始化调用；没有将启动日志对象与cycle new_log混为一谈。递归嵌套location行为已在第一批固定ngx_http_merge_locations全文中核实。
- proxy_limit_rate：create设UNSET_PTR，merge指针规则只处理未配置子项；显式0/变量表达式替换父级。script.c:317–343常量配置时解析并拒绝非法值；107–135仅动态求值失败/非法size回退传入默认0，非法size记日志。upstream.c:3239传默认0，event_pipe.c:205–225仅非零时限速。正文正确限定上游缓冲读取，没有混成客户端发送限速。

只读探针确认3项新增5/8/6个引用、ID唯一、范围有效、旧evidence坐标/归属不变、事实引用可解析，patch数组精确为旧加新增，status/note不变。独立检查相关补丁目标、hunk及修改内容；privileged_agent补丁旧坐标指向create/init新增字段，不应按其历史行号误判cycle-log-path受改；日志拦截、error_pages、代理变量flag与timeout改动均不改变本批所述默认/合并行为。保留HTTP日志verified_affected，不声称整链无补丁影响。

### VTS独立核对（前批记录）

- 已确认本地HEAD分别为nginx `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`、VTS `52fe11e44c47a49b052be89e36dfa17d81bf52a5`；按固定对象检索VTS全src，唯一绑定展示handler在display.c:1045，1040–1048回调不读取参数。
- 完整阅读核心create_loc_conf:3548–3653、merge_loc_conf:3669–3954及VTS create/merge:987–1163。新核心对象零初始化，核心merge不复制handler；VTS合并不安装handler。固定对象core:1377–1384仅在当前handler非空时设置请求content_handler。正文没有将格式、enable等字段继承推成展示入口继承，也未把同一loc conf使用解释成子配置继承。
- 从审计所列补丁的固定OpenResty对象逐个读取：唯一涉及core_module.c的no_error_pages补丁全文仅改变error_pages相关逻辑，不引入handler赋值或继承。核心引用保持上游行号。扩展安装、版本组合、现场运行兼容性仍unverified，未宣称实机验证。

### 测试审核发现

**P2，源码复核关闭：新增patch引用未精确验证。** 初版全量字段保护仅检查旧patch source_ids被包含，随后将实际数组覆盖为旧值；逐项事实测试未比较patch引用，因此额外或重复引用可能通过。最新实现已在归一化前对实际完整patch_status与curated.patch_status（没有则旧值）执行deepEqual，同时保留最终旧status/note保护。额外、重复引用及status/note负例均调用同一check，修复满足本批边界，无需泛用更新框架。尚未构建，本结论不是测试运行绿灯。

只读定向探针已复现：复制旧VTS详情，在patch引用追加`UNAUTHORIZED`，执行测试相同的旧引用包含检查与字段归一化，最终deepEqual仍通过。探针仅操作内存，没有修改发布文件。另外已用git show核实VTS全部8项引用的实际固定片段范围与首尾、其中4项旧证据code保持一致；这不代替尚未构建的新发布检查。

最新实现已在expected Map构造前检查curated evidence ID唯一。实际published sources按完整数组比较，没有先覆盖实际新增code再验证的问题，实际重复/额外source会失败。旧ID对应片段如被curated覆盖而与旧值不同，逐项expected比较与全量旧source逐字保护不能同时通过，因此不会掩盖旧证据改写。

已确认A01b改为固定`2dca5fdd6a398672`对`948dd5954553c1bf`历史比较，本批当前发布采用14精确身份白名单，方向正确。最新源码已覆盖错误code/revision/start_line/URL、额外/重复source、空正文/空引用/悬空引用、旧证据删改、patch额外/重复引用、status/note及summary误改。checkFact只严格约束本批14事实，不改变旧schema的not_applicable兼容。该范围符合本批要求；实际发布运行结果仍由主线程构建后记录。

### nginx第三批4项独立核对

从固定Git对象完整读取本批32个新增引用（29 nginx、3 OpenResty）及相关旧配置/消费片段。CPU affinity初始零值、平台不支持分支、普通worker条件绑定；nofile UNSET及条件setrlimit；pid构建选项、宏生成、运行prefix补全；main日志创建、无文件兜底、初始notice与cycle error、-e stderr分支均与正文一致。4项main配置无HTTP/stream父子merge的结论有各自注册和cycle创建证据支撑。

OpenResty固定`util/configure:126`默认prefix为`/usr/local/openresty`，384–389非msys设为其nginx子目录、msys直接使用安装prefix，417–420真实传给NGINX configure；pid引用正确绑定OpenResty组件/revision。日志只声明上游相对路径`logs/error.log`及运行prefix补全，没有承诺纯nginx或现场绝对路径。构建shell片段也已读取实际对象，不把脚本文件类型当作不可验证证据。

只读探针确认4项新增引用数5/11/2/14、ID唯一、固定范围有效、事实引用存在、旧证据元数据保留、patch数组精确追加且status/note不变。补丁检查覆盖cycle/进程和构建脚本相关目标：辅助进程字段、退出处理及日志拦截不改变所述默认和配置层级行为。实施记录披露的范围外openssl内存回放摘要差异不作为本批失败，也不作为全量补丁成功；主线程既有完整回放结果仍须在最终验收记录中给出。

### 整批实际发布只读复核

独立读取当前index确认release `1.27.1.1-647706874ae7c03c`、1041身份。逐项读取14份实际详情，未先覆盖或修正内存中的实际source：defaults/inheritance与curated逐字一致；73个新增source（nginx批69、VTS批4）的code、组件、版本、revision、路径、行范围、URL及kind与固定Git对象和来源配置逐字段相等；source总数精确为旧加新增、实际ID无重复、全部旧source逐字保留；patch_status与授权值相等。探针通过，未构建或重跑16项测试。

主线程另报告16项实际产物测试全过，样例A24/B258匹配、外部引用2/1、50去重身份defaults/inheritance无unverified；全库defaults为225 unverified/803 verified/13 not_applicable，inheritance为312/670/59。这些样例和计数结果由主线程执行并负责落盘，本角色未读取原样例重复回放。全测及浏览器最终核对仍进行中，不冒称已完成。

## 签署

最终测试证据补录：已直接核读`analysis/sample-remaining14-tests.log`，末尾为tests 138、pass 138、fail/cancelled/skipped/todo均0。日志包含真实盘点、实际发行补丁回放、新增14事实、字段保护与VTS入口测试成功；同时包含patch偏移/模糊匹配拒绝及无偏移回放成功。既有正式测试链通过，不将Sol范围外的内存回放摘要疑点误作正式回放失败，也未替它宣称内存实现全量正确。审核角色未重复执行全测。前文“全测/完整回放待验”由本次实际日志核读关闭；浏览器两样例结果尚待主线程落盘。

浏览器最终证据补录：已核读`SAMPLE_REMAINING14_VERIFICATION.md`的“整批验收完成”。主线程桌面浏览器复测A24/24、B258/258，外部引用2/1，并实际展开VTS display、HTTP listen、main pid默认/继承新版正文，记录截图`sample-remaining14-browser.png`。这是主线程执行并落盘的浏览器结果，本角色未重复浏览器操作。前文及表格中所有阶段一待验状态均由本次最终补录关闭，保留过程记录以区分各次审核时间点。

独立审核角色：Codex。最终签署日期：2026-10-13。14项逐项源码事实、补丁局部边界、本批测试设计、实际新发布证据、138/138全量测试及主线程浏览器验收记录整体审核通过；P2已关闭，无剩余审核阻塞，阶段一收口。发布保持1041 basic、0 deep，50个样例去重身份defaults/inheritance无unverified。此签署不承诺现场兼容性；根据用户最新指令，等待另行下达阶段二审核任务，不提前研究、实施或修改产品。

本角色只修改本审核文件，执行只读源码/产物探针；未构建、未浏览器操作、未全测、未创建需清理的临时文件。
