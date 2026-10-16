# CONTENT 独立审核

日期：2026-10-10。冻结发布：`1.27.1.1-dee833a2c9381a27`。最终结论：本批通过；C-R01/02/04/05 已关闭，无遗留阻断。仅通过本批范围增量、五项基础知识、对应发布及补丁门禁，不表示全量知识、最终范围分母、部署或Codex宿主验收完成。

## 范围与证据边界

已完整读取 `analysis/CONTENT_PLAN.md` 与 `REQUIREMENTS.md`，检查现有 `scripts/inventory.mjs`、`scripts/build.mjs`、项目配置、覆盖记录及本批相关固定源码。当前审核仅涉及发行版范围证据与 worker/events 5 项基础知识；唯一写入本文件，不改实现、知识、盘点或构建产物，不启动服务、操作浏览器或联网获取源码。

更短且可检查的路径是先闭合组件固定树、注册关系与提取能力证据，再核对 5 项事实及明确发布；无需为审核重下载全 bundle 或重新验证已通过且未变化的网站功能。主线程负责缺失组件固定树读取及构建实测，实施角色负责 5 项知识与研究笔记。主线程执行记录与本线程独立检查分别记录，不将主线程消息表述为人类用户验证。

已复读补充后的完整 CONTENT_PLAN、CONTENT_SCOPE_NOTES、CONTENT_SCOPE_EVIDENCE、最终 CONTENT_WORKER_FACTS 与 CONTENT_VERIFICATION；已按主线程明确 ready 的发布检查五项知识。手机页面本轮用户明确不验收，不作为阻断。下文准备阶段记录保留历史依据，以最终复核状态为准。

## 范围研究的明确判据

1. 从 OpenResty 1.27.1.1 固定 revision 的发行版脚本核对下载项、版本、分支条件、归档别名与对应组件。43 个下载项不是 43 个指令模块，也不是基础知识完成分母。
2. 每个结论包含完整 revision、固定源码树及路径证据。获取脚本、源码清单、检查范围和未覆盖部分可复核；本地工作树与冻结树不能混用。
3. “提供指令”由实际命令注册及所属模块关系证明；仓库名只可作寻找线索，不是分类证据。无法确定 owner 的记录保留未核实身份，不能凭数组名称推成已核实模块。
4. “不提供指令”需结合完整固定树、构建/入口关系和实际组件用途核定。特定正则零命中仅说明该扫描未找到支持形态，不得推成无指令。缺少文件、树被截断或特殊注册形态仍应保留未核实。
5. 新增注册项保持 registration_only；条件编译、依赖与废弃信息保留，不声称部门环境启用。覆盖分母闭合与功能知识完成分别判断。
6. 补丁集合、有效条件、应用顺序及目标组件可追溯；Nginx 逐事实审计，不以几段局部脚本或某文件不变推出全局 unaffected。外部固定树证据须进入实际盘点/构建调用链，不能仅落盘说明而产物仍用旧数据。

## 现代码的确定风险及独立依据

### C-R01：盘点身份冻结，但内容仍取工作树

`scripts/inventory.mjs:133–147` 校验 exact tag、记录 HEAD revision，却用 readFile 读取主仓库脚本并遍历组件工作树读取 C 文件。未提交的注册改动可被标成 HEAD 的固定源码，未跟踪文件或删除也会改变扫描范围。`scripts/build.mjs:109–120` 的片段使用 git show 是正确的，但不能自动纠正已经错误的目录名称、flags 或行号。

`scripts/build.mjs:81–89,131–140` 配置回调定位也由工作树文件清单驱动，再读取冻结内容；这仍可能遗漏冻结树中被本地删除的文件，或因未跟踪文件不存在于 revision 而失败。

本线程检查时 nginx 工作树 clean，OpenResty 仅有已有未跟踪 `tags`；没有据此证明当前目录已受污染。风险来自确定的读取路径。ready 时需要证明扫描的文件集合与内容来自声明的固定树，或逐文件比对闭合；不能修改或清理用户源仓库改动来掩盖问题。

### C-R02：提取能力边界不能证明全范围

`scripts/inventory.mjs:61` 仅识别 `ngx_command_t name[] = {`，未匹配的声明不会走注册字段异常检查。纯内存夹具以相同条目及 owner 对比，空 `[]` 提取 1 项，显式 `[2]` 提取 0 项。该结果证明提取器边界，未证明当前随包组件实际存在这种漏项。

`scripts/inventory.mjs:109–112` 的 role 按名称 heuristic 生成；`149–150` 的 no_c_registrations_found 仅为扫描结果；`163–164` 的 scope_complete 仅检查每组件 inspection 非 not_inspected。这三者均不够证明发行版范围已闭合。应由固定树研究证据补足，或对未覆盖形态继续保留缺口，不要求为本批开发通用 C 解析器。

### C-R03：发布契约校验不等于目录完整性审计

`scripts/build.mjs:100` 检查的是版本字符串；`54–78` 校验详情与给定索引的一致性，不能发现索引本身漏掉的注册项或分类错误。现 `inventory_complete:false` 的保留正确。最终即使 build/tests 通过，也须独立对照冻结注册证据与新增目录；不凭通过报告关闭范围风险。

以上保留准备期发现依据；当前修复状态以下方范围子产物复核为准，不将历史风险表述为仍未处理。

## 范围子产物 ready 复核

本节仅接受主线程声明 ready 的范围代码/数据，不把同时出现的五项知识或临时发布 `1.27.1.1-2f4de29c1ac0fbd3` 当成整批冻结版本。

### 已确认的修复与接入

- C-R01 已关闭：inventory 的 util/ver、mirror-tarballs 与组件内容改用固定 revision 的 git show；文件清单改用同一 revision 的 git ls-tree。build 回调定位亦从固定树枚举，读取固定源码，覆盖 c/h/cc/cpp/inc，不再依赖工作树文件集合。
- C-R02 的显式数组长与头文件漏扫已关闭：提取器识别空数组、数字长度及宏长度；本线程运行两项无写入测试，显式数组/头文件及实际 scope 矩阵检查均通过。宏生成注册、跨文件归属、工作用途的全范围闭合仍不是提取器单独能保证的能力，规划与范围说明已明确保留边界，不要求本批建立通用 C 解析器。
- C-R03 的证据边界保留正确：新数据继续 inventory_complete:false，20 项 not_inspected 未被机械扫描或角色名称关闭，913 也没有作为最终总分母。coverage 进入 release hash，覆盖缺口变化会改变默认发布身份；immutable 与写前发布校验仍保留。主线程称 coverage-only 隔离门禁通过，这是主线程执行记录，本线程未运行构建。

### 独立核对的目录与范围数据

本线程用固定 git ls-tree/show 在内存中重新提取全部 10 个本地来源，与现 catalog 逐字段核对注册、位置、flags、callback、owner/guard、revision，并核对 scanned_files；总计 913，所有当前记录 module_verified 为 true。本检查证明现目录与支持的提取形态一致，不证明全发行版无宏/生成漏项。

| 新组件 | 固定 revision | 注册数 | 注册文件 / commands 持有者 |
|---|---|---|---|
| xss-nginx-module 0.06 | 6c41076ac066c30c96d70e86da5400ffd49a6186 | 6 | src/ngx_http_xss_filter_module.c；ngx_http_xss_filter_module |
| memc-nginx-module 0.20 | b889a6fc3e18b784b454e1bc74e5d0b3513a07ce | 11 | src/ngx_http_memc_module.c；ngx_http_memc_module |
| srcache-nginx-module 0.33 | be22ac0dcd9245aadcaca3220da96a0c1a0285a7 | 20 | src/ngx_http_srcache_filter_module.c；ngx_http_srcache_filter_module |

已读取三组件固定 config 的真实模块构建入口，与 commands 数组及 ngx_module_t 指针对应；新增 37 项均 registration_only，不由名称猜模块，不声称功能或补丁行为已核实。其余来源重提取为 Nginx 724、HTTP Lua 79、stream Lua 50、echo 19、headers-more 4、lua-resty-core 0、LuaJIT 0；两个零命中仅为扫描观察，不作为无指令终态。

13 项 scope 的版本、repository、tag 均逐项与固定发行版脚本生成的矩阵一致，scope_evidence 完整进入实际 components.json。逐项检查保存的路径集合、正向 Lua API/库说明及安装入口：Makefile 的 all 不构建 Nginx 模块，安装目标仅安装 Lua 文件；测试使用 Nginx 不等于自己注册指令。独立计算 13 份完整 installation.code 的 Git blob SHA，全部与声明及树中的 Makefile SHA 相同。

数据记录完整 revision/tree_sha、truncated:false、全部文件路径/sha 与固定 README 引用，不以无 C 命中或仓库名单独分类。lua-resty-signal 含本机 C 扩展仍未核实，处理正确。这里审核保存的固定树证据与内部一致性，未联网独立重拉远程 tag/commit/tree，不把主线程 gh 获取记录冒充本线程远程复验。

43 项分为 10 个本地注册扫描、13 个 Lua 库用途核对、20 个未知；23 个检查项粒度不同，不是 23/43 的范围完成率。C01/C02/C03/C07 的全发行版闭合仍未完成，符合本批非全量边界。

### C-R04（P2，已关闭）：安装代码与所声明 blob 没有实际绑定校验

位置：`scripts/inventory.mjs:155–162`。门禁仅比较 files 中 installation.file 对应 sha 与 installation.blob_sha 两个元数据字段，没有计算 installation.code 的实际 Git blob SHA。代码字符串可发生误改而两个字段不变，仍被标为 fixed_tree_and_install_review/reference_only，安装入口证据实际上已与所称冻结树不一致。

独立复现只在内存中执行当前原样校验条件：将第一项 installation.code 替换为含原生编译命令的文本，保持 revision、树文件清单与 SHA 字段不变，校验结果 invalidRejected:false；未调用会写盘的 inventory。现有 13 项实际 SHA 都正确，未发现现数据已污染，但门禁未兑现内容与 blob 一致性的边界。

已修复并独立复核：脚本按 UTF-8 的 Buffer.byteLength 计算 Git blob SHA1（`blob <字节长度>\0` + 原文），比较 installation.blob_sha，树条目对比保留，并增加 schema_version=1 门禁。全部判断在 mkdir/writeFile 之前；已赋给内存矩阵不等于写出产物。测试新增 installation.code 改动、SHA 不变的负例，并检查拒绝后 catalog 不变。本线程在内存中执行修后实际 blob 校验代码：13 项正确内容全部接受，保留 SHA 的变更代码被拒绝。C-R04 关闭；未运行会写隔离 checkout 的测试。

主线程报告 48 项全测试、隔离构建门禁通过；本线程未执行会生成隔离文件/产物的测试或构建。独立证据为内存重提取、逐字段比对、13 份 blob 校验、当前门禁负例及上述两项无写入测试。

## worker/events 5 项语义验收判据

本次预读 Nginx 1.27.1 固定 revision：`e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`。后续还需按实际有效 OpenResty 补丁核对所列事实。

| 指令 | 必须核对的基础事实 | 已定位的上游证据 |
|---|---|---|
| worker_processes | main；number 或 auto；默认 1；auto 使用 ngx_ncpu，不等同自动性能调优；回调整数解析及重复拒绝；实际 worker 创建相关说明有对应证据，不强加源码没有的正数检查 | `src/core/nginx.c:79–84,1148,1553–1578` |
| worker_connections | events；number；默认 512；配置入口保存 events 配置及 cycle 连接数；不是仅客户端连接数或直接等同容量；连接资源与文件描述符限制、监听/channel 占用的说明需证据 | `src/event/ngx_event.c:13,123–128,447–459,515–535,1065–1086,1360–1361` |
| multi_accept | events；on/off；默认 off；accept 循环行为；kqueue 使用通知的可接受数量而非该开关，不宣称所有事件机制行为完全一致 | `src/event/ngx_event.c:137–142,1368`；`src/event/ngx_event_accept.c:45–49,319` |
| accept_mutex | events；on/off；默认 off；master 且 worker>1 且开关 on 才进入使用条件，Windows 明确关闭；reuseport 的监听事件分支不受一般锁等待分支控制，EPOLLEXCLUSIVE 说明不得变成对开关的无条件强制禁止或自动改写 | `src/event/ngx_event.c:144–149,649–667,903–937,1369`；`src/event/ngx_event_accept.c:328–361,409–415` |
| accept_mutex_delay | events；时间参数；默认 500ms；毫秒 slot 入口；锁竞争时限制等待定时器，不保证固定轮询周期或严格公平；不能写成 off 时完全无效，EMFILE/ENFILE 且未使用锁时也作为 accept 恢复定时器间隔 | `src/event/ngx_event.c:151–156,219–237,1370`；`src/event/ngx_event_accept.c:109–129` |

五项均核对 context、配置入口、默认与非层级继承语义；不将 main/events 配置误写成 HTTP server/location 继承。default、inheritance、limitations、patch_status 的已核实状态都需能追溯实际 source_ids，片段边界须覆盖条件与结论，而非只给符号名。

补丁审计须覆盖本批声明的解析、初始化、所述运行时事实。byte 不变可作为所列文件/事实的证据，但不是 Nginx 全局不受补丁影响的结论。不编译或运行 OpenResty，不将源码分析表述为环境参数验证。

## ready 后的发布验收清单

- 固定明确 release_id，逐字核对实际详情与新知识、研究笔记、冻结源码片段及补丁证据；新增组件的 registration_only 状态、身份和 guard 一致。
- 独立统计 index/details/catalog：现基线 876 注册、18 basic、0 deep；若仅此 5 项提升且其他状态不变，应为 23 basic，注册数可因已核实缺失组件增加，不能硬锁 876。8 个参考项保持参考分类，不进入指令计数。
- 核对实际构建输入与输出调用链、覆盖缺口及新总分母是否有依据；未闭合仍明确 inventory_complete:false。
- 历史 release 保留可读，固定目录不覆盖；查询实际返回新内容及同版本源码。主线程 build/测试/HTTP 浏览器实测列为执行记录，本线程只读产物与独立诊断列为审核证据。
- 全量基础知识、范围总分母、部门深度样例、内网部署、Codex 真实接入单列状态，不以本批 5 项或组件数量替代最终验收；Codex 后移不阻断本批网站内容审核。手机页面本轮明确不验收，不列为当前待测阻断。

## 最终 ready 发布与五项独立复核

已完整读最终 Sol 笔记，其作用域是五项，不修改旧审计集合；最终知识身份各一项。正文语法/context、入口、默认、参数边界和所述运行时事实与冻结源码相符，未发现确定语义错误：

- worker_processes：main、默认1、auto 显式取 ngx_ncpu、十进制解析/重复拒绝、未额外拒绝0；普通 worker 数量不是 master/cache helper/privileged agent 总数。
- worker_connections：events、默认512、共享连接对象和读写事件资源；客户端、上游、监听占用及 nofile 警告有源码；不把乘积作为客户端容量；agent 独立连接数有补丁证据。
- multi_accept：默认off；非 kqueue 循环与 kqueue 数量、IOCP 独立 handler 分清；EAGAIN 返回、ENOSYS fallback 和 ECONNABORTED 条件继续都与80–111原文相符；socket_cloexec 的平台条件和失败退出保留。
- accept_mutex：默认off、master/多 worker/on 与 Windows 禁用条件准确；reuseport 与 EPOLLEXCLUSIVE 分支不被改写为通用调优结论；delayed 队列/监听 fd 补丁影响明确。
- accept_mutex_delay：默认500ms；无单位按秒转换、0可解析；等待上限不是固定sleep；延迟队列 timer=0 及未用锁时 EMFILE/ENFILE 恢复定时器用途明确。

两项 worker 的 unaffected 仅限所列配置/资源事实，其余三项 affected 有真实 patch 类型来源；没有设置 Nginx 全局 unaffected。源码引用保存上游和补丁自己的行号，不将上游片段冒充补丁后原文。但“应用34项无offset/fuzz”复现依据不成立，详见 C-R05；因此此处语义核对不能替代发行版有效集合回放验收。

独立只读产物检查结果：

1. 实际 current 为 `1.27.1.1-dee833a2c9381a27`；index 与全部913详情经 validatePublication 验证；统计913注册、23 basic、0 deep。37项新增全部 registration_only，参考仍8项，不混入指令计数，inventory_complete:false。
2. 五项 summary/syntax/defaults/inheritance/limitations/patch_status 与知识输入逐字段相同；70个实际源码片段与对应冻结 revision 的 git show 逐字一致，固定 URL 包含对应 SHA。
3. 从实际详情去除发布包装字段，以 directives/references/coverage 重新计算构建哈希，得到 dee833a2c9381a27；没有仅因缺口变化而复用不一致发布身份。
4. 历史 a90b2ce291c5ed35 发布仍保留876/18及旧 worker_connections registration_only，未被新正文覆盖。
5. 通过实际 createKnowledgeClient.querySingle、离线只读 fetcher 对最终发布查询5项，均 matched/basic，Markdown 保留 summary 和 patch note。10次读取均静态 GET、无 query string。本检查不是实际 HTTP/浏览器验收。

主线程 CONTENT_VERIFICATION 记录内容阶段51/51、补丁门禁返工后56/56且0跳过、两隔离门禁、真HTTP5项、桌面 content.mjs、原events点击、新模块仅注册、旧链接与隐私检查通过；这些明确标为主线程执行记录，不写成人类用户验证或本线程实测。知识与站点未改变，原HTTP/桌面记录仍对应此发布，不要求重复浏览器验收。

## C-R05（已关闭）：原漏报及未消费期望键均已修复

原位置：`analysis/verify-nginx-patches.mjs` 中普通 patch 与 `/offset|fuzz/` 输出检查；旧 CONTENT_WORKER_FACTS 的“均成功，无 offset/fuzz”结论。以下保留原问题复现；当前修复状态见本节后续。

本机默认 patch 的普通输出仅列 patching file，不报告成功 hunk 的偏移/模糊。读取固定补丁、对本地固定 Nginx 做 `--dry-run --verbose --batch --forward -p1`（不写源码）得到：

| 固定补丁 | 独立实际 dry-run 输出 |
|---|---|
| stream_balancer_export | C文件 Hunk #2：offset 14 lines；#3：offset -3 lines；头文件 #1：offset 1 line |
| stream_ssl_preread_no_skip | Hunk #1 succeeded at 194 with fuzz 2 (offset 35 lines) |

前一补丁同时用普通 dry-run 时只打印两个 patching file，返回0；这直接证明现输出检测不能实现既有“遇offset/fuzz拒绝”契约。完整固定发行脚本的版本分支、注释排除与34项顺序已复读，集合选择未发现错误；问题在回放结果证据，不在名字猜分类。精确上下文内存诊断也无法按声明位置/完整上下文继续完成34项，因此本线程不宣称独立全集合回放通过。

最小返工要求：使实际回放明确输出并检查 hunk 信息（例如本机 --verbose），补上真实偏移/模糊负例；重新记录实际结果。若仍坚持原“无offset/fuzz”严格门禁，则当前集合必然不能通过，不得只改文案掩盖。若按锁定来源允许经人工确认的偏移/模糊，应明确修订审计规则、保存实际映射并核实相关配置/初始化/事件事实在最终应用结果中成立，不能称无偏移或无模糊。补丁名称存在、脚本返回0、旧stream targets未变都不能代替本批 worker/events 事实复核。

这是本批重用补丁审计的重叠证据问题，不要求重审已通过全文知识；也未据此推断五项正文一定有错。

### 返工 ready 后实际复核

完整读取最小返工计划、修后脚本/audit/test、最终Sol笔记及主实测记录。采用明确的新契约：固定输入/顺序及精确已核定调整，不要求零offset/fuzz，不增加输入ledger、阶段hash或跨平台工具要求。主审计、Sol笔记与实测已明确撤回旧无offset/fuzz断言。

新增授权允许在本线程 mkdtemp 副本实际验证；所有副本与负例文件已清理，未改用户源仓库或产品。独立执行结果：

- 实际运行修后主验证脚本：34项顺序应用、142条成功hunk、107条非零调整，其中16条有fuzz；47个touched/oldtarget最终SHA全部一致。verbose+C输出逐项比对冻结期望，正常执行不写回期望。
- 实际运行 test/patch-audit.test.mjs：5/5通过，未核定offset/fuzz、已核定值变化、错误或缺失最终SHA拒绝，零偏移正例可通过。本线程未重复全套56项，以主线程实测记录分别列示。
- 本线程另以固定git archive创建副本，按同34项与替换规则真实连续应用，不调用主脚本替代事实判断；47个最终文件SHA与audit完全相同。15个既有完整函数、14段关键上游事实逐字保留；新增延迟队列/监听fd关闭/accept CLOEXEC/agent独立连接数的最终分支已检查。
- 另从实际回放结果逐项复核Sol最终表格：9个完整文件、24个完整函数、17段事实的最终行号及SHA全部相符；15函数不变、变化和新增函数没有被写成整体不变。17段事实与固定上游逐字一致。五项现正文与实际应用结果一致，不需要修改knowledge或重新构建站点。
- 16个fuzz hunk的固定正文及实际回放匹配逐项检查，涉及preread返回、延迟队列与初始化/声明、agent字段/函数、日志结构、编译选项和reuseport关闭。实际补丁后字节及本批事实核对支持已记录落点，不由SHA独自推出全部语义。其余历史stream/core目标比较复现一致，旧“无offset/fuzz”论据撤回，不因此要求全模块语义重审或宣称历史全模块再次通过。

### 门禁余项（P2，已关闭）：额外未应用补丁键被静默忽略

位置：`analysis/verify-nginx-patches.mjs:43–46`。当前循环只读取 audit.hunk_adjustments[name]，不检查该对象是否含不属于 audit.patches 的键。实际107项数据没有这个错误，但门禁不符合收窄方案第3项“全部消费，无多余未消费记录”。

本线程用自己mkdtemp中的审计副本保留全部原期望，只增加 `hunk_adjustments.non_applied_probe`，内含 file=src/core/nginx.c、hunk=999、line=1、fuzz=2、offset=100。实际调用修后CLI仍返回成功，34补丁及47文件通过，输出 extraUnconsumedMappingAccepted:true。副本、文件和验证脚本产生的临时源码都已清理。

最后修正已独立复核：版本检查后、mkdtemp和源码定位前，遍历 Object.keys(audit.hunk_adjustments ?? {})，凡不在 audit.patches 的键直接抛出“未消费的补丁匹配记录”。现有补丁名下数组精确比较保留，没有对合法重新编号的hunk去重，没有增加ledger、阶段hash或知识改写。

新增 test/patch-audit.test.mjs 最后一项使用真实隔离Git/CLI，在合法补丁及目标SHA下加入 never_applied 映射，断言拒绝；本线程精准运行该项，1/1通过、0失败，临时夹具由finally清理。首次筛选词未命中新测试，不计为其通过证据；上述1/1来自完整测试标题匹配后的实际执行。主线程最新 CONTENT_VERIFICATION 与审计说明记录该负例先红再绿、最终57/57且0跳过/失败，以及34/142/107/16/47正例再次通过；这是主线程执行记录，与本线程新增负例实测分列。

本次只复核3行检查与新负例，未重复已闭合的142hunk、五项或浏览器审核。知识、站点及audit数据未变，原独立证据与发布验证仍有效。C-R05全部关闭。

## 当前结论

本批通过，无遗留阻断。固定来源范围增量、37项registration_only、13个Lua参考库接入、五项基础知识与实际补丁后事实、发布913/23/0及8参考、来源/哈希/历史发布均符合本批契约；C-R01/02/04/05已复核关闭。采用已核定107项精确调整及47文件最终SHA，不恢复错误的“无offset/fuzz”表述，也不放行未核定匹配。

范围总分母与全量基础知识仍未完成，20项未知、多数注册项无基础说明、0 deep 均明确；部门真实样例、内网部署、Codex宿主后续分别验收，不构成本批新增阻断。手机页面用户本轮明确不验收。永久只写本文件；经新增授权在自己的隔离副本执行补丁及负例并清理，没有改实现、知识、构建或用户源仓库，没有联网、启动服务、操作用户浏览器、编译或运行OpenResty。
