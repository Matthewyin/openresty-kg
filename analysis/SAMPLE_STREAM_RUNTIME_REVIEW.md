# 样例 stream 四身份运行时独立审核

日期：2026-10-13。审核角色：Astra low（用户已确认）。状态：最终独立审核通过，签署发布1.27.1.1-f8c21e3662af9366，全部P2已关闭，无剩余审核阻塞。下文过程记录以末尾最终签署为准。仅写本文，不修改产品、知识或测试，不构建、不全测、不操作浏览器、不读取原私有样例。

## 深度交互：范围与判断

已回顾 `SAMPLE_RUNTIME_PLAN.md`、`SAMPLE_RUNTIME_REVIEW.md`，完整读取本批 `SAMPLE_STREAM_RUNTIME_PLAN.md`。基线固定为 `1.27.1.1-15e6ba8dfd628573`；146/146为上轮记录，本角色没有重跑。A无四身份、B出现次数4/4/4/1仅引用主线程确认。

最小路径成立：四项知识可复用现有 runtime 契约，不需要修改产品、schema或晋级逻辑。检查了 `validateRuntime`、`deriveVerification`、`validateDetail`、`validatePublication` 及构建 runtime 复制与评级调用：没有 HTTP 身份白名单；有明确正文和证据的 not_applicable 基础事实可通过；代码与文档分开、配置片段别名排除和补丁引用覆盖适用于 stream。上述是结构能力判断，不代表四项运行语义或固定证据已经通过。

按 code-review 技能的规范与需求两轴组织审核；用户指定根目录无 Git、独立审核角色及唯一写集合，故以固定发布比较替代该技能的根仓库 diff 和再次委派流程。

## 直接执行：规范审核

当前只读检查没有发现必须扩展产品范围的理由。四项状态必须保留 verified_affected；resolver_timeout 只解释解析链依赖，不新增身份。冻结后逐条核 stream 会话状态与 HTTP 响应区别、TCP/UDP、解析/连接/活动超时、直接消费点和 Lua 覆盖，不将配置值直接等同所有运行时有效值。

知识实现仍在进行，未对空白或尚未冻结内容报缺失，不在本阶段评价 Sol 实现通过与否。

## 直接执行：测试与计划符合性

已读初稿 `test/stream-runtime.test.mjs` 的6项测试及 `test/runtime.test.mjs`、`test/sample-facts.test.mjs` 相关历史保护。

- 实际发布 sources 在任何内存改写前比较；预期来自旧 sources 与固定 Git 对象。实际数组没有先去重；排序后完整比较可拒绝额外和重复 source。预期 Map 不掩盖旧证据篡改，因为另有逐条旧 source 比较，curated evidence 也先检查重复 ID。
- 四项调用 validateRuntime、deriveVerification 和真实 validatePublication；后者实际调用 validateDetail。单身份 publication fixture 合理，但不能替代主线程整份发布验收。
- 全1041份详情仅剥离 release_id；四项只放行 runtime、sources、patch_status、verification，其余字段包括 verification_notes 保留比较；其他1037份含 HTTP proxy_pass 保持逐字保护。
- 精确 deep 集合为原 HTTP 加四项 stream，basic=1041，bundled deep=5、department_extension deep=0。sample-facts 将全局 deep 数改为实际列表计数合理，精确身份集合由新测试承担。
- HTTP 历史 index 已固定15e6，旧1 deep断言保留；HTTP查询仍访问当前发布，但本批必须保持HTTP详情不变，因此不构成保护削弱。

### P2（已关闭）：补丁状态保护随 curated 一起漂移

位置：`test/stream-runtime.test.mjs:60`及`:114`附近。当前实际 patch_status 只与当前 curated 比较；字段保护随后用旧对象替换整个 patch_status。只有旧引用保留断言，没有独立断言状态仍为 verified_affected。

因此若 curated 和发布同时从 verified_affected 误改为 verified_unaffected，保留原引用及正文，当前比较和运行时结构校验都没有要求恢复原状态。此变更明确违反本批计划的状态保留约束；不是要求补齐正在开发的语义断言。

建议在四项检查中独立比较实际状态与基线状态，并确认基线为 verified_affected；增加同步误改状态的字段保护负例，不能仅变异实际对象后与未变 curated 比较。无需修改产品校验。待主线程修复后复核。

### 待冻结时完成的检查（不是当前开发缺失问题）

1. 现有 actual.runtime 与 curated.runtime 相等只证明同步，不证明语义。按计划补固定消费路径、独立文档与源码专项断言，随后人工逐步审核状态、分流、超时和 Lua 覆盖。固定版本需与计划的三个 revision 独立核对。
2. 当前整表测试保护详情和精确等级，但只比较索引身份列表，没有逐字段比较其余索引元数据。最终发布审核须将 detail_path/release_id 等发布变化及四项等级规范化后，核对剩余索引字段；可由主线程补断言或由审核明确记录固定发布比对结果。
3. 新stream初稿尚未逐项包含 unverified、注册/配置完整及裁剪别名负例；历史 HTTP 测试保留共用契约的这些负例。冻结复核时按本批计划确认stream四项所需负例覆盖，不能把历史通过称本批已通过。
4. 查询测试目前检查Markdown条件/动作及独立文档链接，不运行网页；测试名称中的网页同数据不能当网页验收证据。最终由主线程记录四项实际网页与Markdown范围、顺序及全部源码/文档链接核对，本角色核读其记录。
5. 冻结知识逐项核对旧事实/旧证据保留、新增 source 的固定对象、适用补丁实际 hunk与文档支撑；尤其检查会话状态并非发出HTTP错误响应，connect等待与UDP、TCP/UDP活动超时出口、限速delayed分支、PROXY protocol/TLS直接消费点、DNS缓存及等待链、Lua有效超时覆盖。

## 签署状态

规范轴：初审未发现范围违规。计划符合性轴：初审1项P2已由下述复核关闭；Sol冻结内容及发布验收为后续阶段，不冒报缺失或通过。现阶段不签署整批完成。

本轮未执行测试、构建或浏览器，没有生成临时文件。后续仅在本文件追加修复复核、冻结证据及最终签署。

## 测试补强复核：P2关闭

重新完整读取 `test/stream-runtime.test.mjs` 当前10项测试。四项均先断言基线状态为 verified_affected；check(actual, expectedKnowledge) 在比较当前知识前，独立比较实际状态与固定基线。同步将实际与预期状态改为 verified_unaffected 的负例仍应由首条断言拒绝；整表详情保护同样在替换 patch_status 前检查旧状态。因此原P2已修复，不依赖Sol冻结或构建即可关闭。

本角色执行独立只读内存探针，直接读取15e6的四份基线详情，确认4个状态均为 verified_affected；复制检查中的独立状态断言，确认4个实际/预期同步误改反例全部被 AssertionError 拒绝。另执行 `node --check test/stream-runtime.test.mjs` 通过。没有运行尚依赖新发布的10项测试，不将探针或语法检查称为10/10通过。

其他补强核对如下：

- 索引逐条比较仅规范化 detail_path 及四身份 verification，其他条目字段完整比较；validateIndex负责实际路径合法性，精确5身份集合另行保护。该检查覆盖全部索引条目，不是索引顶层对象的完整比较；顶层及覆盖统计剩余字段仍在最终发布审核中核对，不重新报为当前P2。
- 每项unverified均检查deriveVerification返回basic、保留deep时publication拒绝、改basic后publication通过。四项各对registration/configuration-definition完整和裁剪别名执行deriveVerification与publication拒绝检查；片段范围、code和URL同步调整，避免仅因格式损坏而产生假阳性。
- 四个新增专项从实际发布runtime.source_ids取片段，分别检查目标分类与会话状态、DNS缓存/等待/超时/回调、连接等待和重试门槛、活动超时与TCP/UDP结束分支；同时要求相应补丁及stream-lua超时赋值片段。它们与已有固定Git逐字比较配合，已超出单纯actual==curated的一致性验证。
- 独立确认nginx HEAD为e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928，并从该固定对象抽读process_connection、connect_handler及process计时器分支：delayed优先处理、UDP响应门槛决定OK/BAD_GATEWAY、TCP活动超时OK、连接超时进入next_upstream及正常事件删除timer、双read未delayed时刷新timer的断言方向吻合。

专项测试只证明选定片段和部分行为锚点存在；中文解释的完整正确性、证据范围能否命中当前正则、Lua调用条件与覆盖时机、全部固定补丁/docs仍待冻结审核及新发布执行结果。网页也仍需主线程实际验收记录。当前没有剩余测试P2，不提前签署知识语义、实际sources或整批完成。本次只追加审核记录，未产生临时文件。

## 首轮研究并行复核：固定语义、补丁与文档

完整读取 `SAMPLE_STREAM_RUNTIME_EVIDENCE.md` 首轮研究及 `SAMPLE_STREAM_RUNTIME_VERIFICATION.md` 初始记录。数据尚未冻结，本节评价研究结论和实际源码，不代替冻结runtime/source逐字验收，也不把主线程记录中的旧产物6项失败视为实现失败。

本轮直接读取固定Git对象：nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928、OpenResty 8c37412c31621225e7aa7e825b5b50106c9c71c4、nginx-docs e8b581903e9d41252720053311cea687a5671674，以及stream-lua 69f0cd762112a6e0cddb07f2b5192e9a65034a93。未使用工作区行号代替固定证据，未重放补丁。

| 核查主题 | 固定源码核查结论 |
| --- | --- |
| 动态目标分流 | proxy handler/eval 425–645核对通过：complex value求值后no_resolve解析；组名称/端口匹配先于sockaddr分支，IP/Unix直接peer，未匹配组且无直接地址的域名才走resolver；非Unix缺端口、求值或peer构造失败均为stream内部500。inet的Unix、IPv4、IPv6片段支持直接地址说明。 |
| DNS缓存与等待 | resolver 619–705、752–767、861–912支持有效地址缓存直接回调、同名waiting复用及新查询发送/立即另试一次；AGAIN被外层转OK只表示接受等待。没有每会话必发新查询的保证。 |
| DNS超时及结果 | proxy的ctx->timeout取stream core resolver_timeout；resolver 4073–4106在非零timeout且尚无event时安装事件，超时置TIMEDOUT回调。proxy resolve_handler非零state内部500；成功构造地址peer、结束ctx后connect。round_robin 319–436证实地址复制、端口补入与get/free/tries安装。 |
| 答案有效期 | resolver 2443–2475使用valid覆盖或TTL保存正地址答案；2131–2149错误路径删除节点后给回调ctx设置valid，不能据此宣称已有通用负缓存。研究已保持此边界。 |
| 连接等待 | event_connect先调用peer.get，再按type建socket；实际connect失败DECLINED，进行中AGAIN，成功OK，初始化失败ERROR。proxy只有AGAIN安装等待handler/timer；BUSY内部502，DECLINED去next_upstream。UDP使用datagram connect，不能表述为TCP握手等待。 |
| 重试条件 | proxy 1892–1955先拒绝尚有buffered data，再处理UDP输出及失败peer；tries耗尽、开关关闭、非零累计窗口到期为内部502，否则关闭旧连接再connect。DNS错误与普通转发活动超时不经此入口。 |
| TLS与PROXY直接消费点 | proxy 804–820、970–1007、1096–1159核对通过：TCP启用上游TLS才进入相关路径；TLS AGAIN且无timer使用connect_timeout，成功删除timer，失败next；握手前PROXY发送AGAIN使用timeout并复用connect_handler，其超时可能重试。发送ERROR内部OK，未一次发完内部500。 |
| 活动计时 | 沿用上轮已核process_connection/process并补读event_timer.h 50–87：双方read非delayed才添加/刷新c->write计时，delayed删除/恢复有专门分支；lazy delay允许保留相近旧截止点，不是固定总时长或每字节无条件重置。 |
| TCP/UDP结束与状态 | TCP普通活动超时内部OK；UDP按responses哨兵或响应数量满足条件内部OK，不足内部502；UDP提前结束还检查requests、peer和buffer。finalize_session 300–311只设置s->status、运行日志阶段并关闭连接，没有生成HTTP响应。 |
| Lua覆盖与时机 | stream-lua balancer 245–380安装peer.get并在其中设置BALANCER上下文执行Lua；591–642检查request/context/patch后，仅正数参数覆盖pctx。结合event_connect先peer.get、proxy随后添加timer，覆盖可在本次连接等待计时前生效；该setter不修改DNS ctx->timeout或全局配置。 |

补丁复核：按 `NGINX_PATCH_AUDIT.json` 的34项有效名称，在固定OpenResty对象逐项解析补丁目标文件；完整阅读与本批直接文件有关的7项补丁，不从历史同名补丁推断。

- stream_proxy_timeout_fields在handler创建并初始化会话pctx，连接等待、TLS、PROXY发送、delayed恢复和活动timer均改读ctx。保留上游原文同时绑定补丁才足以描述发行行为。与Lua setter组成有效值覆盖链。
- balancer_status_code在ERROR之后、BUSY/DECLINED之前增加rc>=NGX_STREAM_SPECIAL_RESPONSE直接finalize，阈值300；仍是stream内部状态。stream upstream头另有能力宏，不改变该判定。
- socket_cloexec修改event_connect的socket标志并增加FD设置失败出口；亦修改resolver内部TCP创建。本批不扩DNS传输实现，但不能将新增socket失败路径称为无影响。
- stream_proxy_get_next_upstream_tries仅增加getter与宏；stream_balancer_export导出TLS session相关函数，不改变本批peer构造和已有tries判定。
- resolver_conf_parsing与safe_resolver_ipv6_option修改resolver创建/选项处理，不直接改本批缓存、waiting或超时回调片段。
- 其余27项目标不直接修改本轮核读的proxy、round_robin构造、resolver消费、event_connect、event_timer或stream finalize片段；这不是对整个事件系统或TLS实现无间接影响的保证。

独立文档已从固定nginx-docs对象读对应完整指令段：stream proxy的proxy_pass 229–265、proxy_connect_timeout 116–126、proxy_timeout 638–650，stream core的resolver 394–454、resolver_timeout 457–475。分别支持目标/变量/组与resolver、建立连接超时、两次读写间隔、TTL/valid及解析超时；没有用这些文档替代内部状态、delayed分支、UDP结束条件或OpenResty/Lua覆盖的代码依据。

阶段结论：首轮研究所述关键语义及补丁判断与已核固定对象一致，未发现需要打回的实质语义问题；测试P2保持关闭。冻结后仍须逐步检查实际runtime是否准确表达这些条件、source范围与引用并集是否完整、全部旧字段保护及新增实际发布逐字比对，再结合主线程测试和网页验收签署。此次仅更新本审核文件，未运行构建/测试/浏览器，未读取原样例或生成临时文件。

## 索引顶层与直接计时点补强复核

已复核测试的新一轮修改。normalizedIndex仅归一化release_id、references_path、另有逐项比较的directives，以及已独立检查精确值的deep总量/组计数，再与15e6基线深比较。其余顶层字段及coverage中的basic、registration、gaps、inventory_complete和组结构继续受保护。前述索引顶层测试待办现已补齐；最终实际发布执行与比对仍待验收。

TLS上游1103的timer_set与connect_timeout、PROXY发送985的AGAIN与timeout、event_timer.h 58的当前时间及lazy delay三个断言已落盘，均从实际runtime绑定的源码中取片段，与前轮已核固定对象的消费方向一致。它们检查上游原始pscf表达式；发行版ctx读取仍由已有固定timeout补丁证据和独立语义审核共同支撑，不能把两种代码坐标混用。

专项仍为10项，没有将这三处断言计成新增测试项。`node --check test/stream-runtime.test.mjs`再次通过；未运行发布专项、构建或全测。此次测试补强复核无新增问题，P2保持关闭。仅修改本文，不据本轮测试文件检查单独宣称产品文件全集已完成差异验收。

## 冻结37步及实际发布审核：b0309835ff2efa62

已完整读取四项runtime的37步正文、逐步source_ids、各证据范围、补丁说明及冻结交接，步骤数为proxy_pass 12、connect_timeout 8、timeout 9、resolver 8。与前轮独立核读的固定源码、补丁、文档逐项对应；并重新核对TLS清理、DNS成功回调、UDP提前结束和finalize片段的精确行号。发现以下两项实质内容问题，需Sol修复后重新发布复核，不修改测试或产品。

### 内容P2-A（已关闭）：连接超时第7步DNS错误出口缺少对应源码引用

身份 `nginx/ngx_stream_proxy_module/proxy_connect_timeout`，runtime.steps第7步声明“DNS错误/超时不经此连接事件重试链”。所列runtime-resolver-call为proxy模块531–561，仅能证明启动及同步启动失败；runtime-resolver-timer为resolver 4073–4106，只置TIMEDOUT并调用ctx->handler；其余两项为转发timer及timeout补丁。该身份的sources未包含proxy resolve_handler非零state直接finalize的1328–1355片段，因此无法从当前绑定证据闭合异步DNS错误/超时出口。

最小修复：为此身份追加固定proxy resolve_handler片段（可沿用其他身份的runtime-resolve-error定义），加入第7步source_ids、runtime代码并集及patch覆盖。保留既有sources/事实/limitations，补丁说明仅按必要范围调整。正文语义本身符合源码，问题在该身份的证明链缺失。

### 内容P2-B（已关闭）：proxy_pass第10步将失败peer释放错误地置于重试门槛之后

身份 `nginx/ngx_stream_proxy_module/proxy_pass`，runtime.steps第10步写“tries耗尽……则内部BAD_GATEWAY；否则释放失败peer、关闭旧连接再connect”。固定proxy模块1892–1955实际先在sockaddr存在时调用peer.free并清空sockaddr，再判断tries、开关和累计窗口，之后才关闭旧连接并connect。peer.free还可能改变tries，因此这不是无影响的叙述排序。

最小修复：表述为buffered检查后，存在选中peer时先释放失败peer（UDP清理旧输出），随后按更新后的tries/开关/累计窗口决定结束或关闭连接并重试。第10步已有runtime-next-peer覆盖完整代码，无需扩大研究范围或修改旧事实。connect_timeout第5步已经按正确顺序描述，可保持。

其余35步暂未发现需要打回的实质语义错误：分流、端口条件、缓存/waiting、DNS与连接/活动计时区别、TLS/PROXY直接消费、Lua正数覆盖、TCP/UDP超时出口及内部会话状态描述与已核源码一致。这是冻结正文审核结论，不把真实网络行为宣称已执行验证。

## 固定产物、limitations表示修复与字段保护

先前7bde513999a7df29只读探针确认102项新增sources逐字正确，但除授权字段之外仍有3项limitations差异。主线程在用户授权范围内批准必要表示修复：将三proxy条目的curated limitations由字符串显式化为15e6旧详情对象，不修改旧语义。这是主线程整合决策，并非用户新增确认；本审核按该范围继续严格比较发布字段。

已对明确指定的 `1.27.1.1-b0309835ff2efa62` 独立执行只读检查，不依赖current指针：

- 真实validatePublication及全部1041份详情通过；精确deep集合是原HTTP proxy_pass加四项stream。basic1041/deep5，bundled basic1017/deep5，department_extension basic24/deep0。
- 四项实际runtime与冻结curated逐字一致。实际sources在任何替换之前逐字比较旧sources加固定Git对象生成的新片段；102项新增及全部旧片段的component/version/revision/file/行号/code/URL/kind一致，没有重复或额外source。未先覆盖实际code或去重后验收。
- 每项代码并集精确等于步骤引用按首次出现去重的集合，文档另列；patch状态保持verified_affected，patch引用精确等于旧引用加runtime代码并集及runtime-patch-set，无重复或旧引用丢失。
- 三proxy的curated limitations显式对象与15e6旧detail.limitations逐字一致；全部实际发布limitations也一致。授权表示层修复通过，不再有旧limitations证据污染。
- 四项仅放行runtime、sources、patch_status、verification及release_id；其余字段逐字一致。其他1037身份只排除release_id后完全相同，包括HTTP既有深度内容。全部索引条目及顶层对象只规范化正常发布字段、四身份评级和派生deep计数后与15e6完全相同，gaps/schema/inventory_complete等未变化。
- 已完整核读 `sample-stream-runtime-final-focused.log`：25项、25pass、0fail/cancelled/skipped/todo。本角色未重跑；全测和网页验收尚待主线程记录。该日志通过不消除上述语义和引用问题。

当前结论：b030的固定来源真实性、全字段边界及limitations修复审核通过；内容P2-A/P2-B需退回Sol，修复后以新release复核。测试P2仍保持关闭，两者不可混同。未最终签署本批完成；本轮仅更新本文，没有生成临时文件。

## 定点修复与新发布复核：f8c21e3662af9366

审核固定发布 `1.27.1.1-f8c21e3662af9366`，不依赖current指针。先复核curated修复，再直接读实际发布；真实validatePublication及1041份详情通过。

P2-A关闭：connect_timeout第7步实际source_ids新增runtime-resolve-error，runtime并集与patch引用同步增加；新增固定nginx片段1328–1355含if(ctx->state)后直接以INTERNAL_SERVER_ERROR结束的完整分支。逐字核code及component/version/revision/file/范围/URL/kind，引用与实际步骤相连，闭合resolver定时回调到stream失败出口。未只把证据加进总sources而遗漏该步骤绑定。

P2-B关闭：proxy_pass第10步已明确buffered检查后先清理UDP旧输出，选中peer存在时以NGX_PEER_FAILED释放并清空sockaddr，再按释放后tries、开关和累计窗口判断；允许重试时才关闭旧连接再connect。与固定runtime-next-peer的调用顺序一致。

独立增量比较覆盖全部1041份实际详情：相对已逐字核定的b030，仅proxy_pass第10步action变化，以及connect_timeout第7步引用、runtime并集、patch引用、1项新增source变化；其余全部字段严格相同。索引仅release_id/references_path/detail_path变化，规范化后与b030全等。结合b030对15e6的完整比较，1037个非目标身份、全部旧facts/summary/mechanism/limitations/verification_notes及原sources保护继续成立；本批新增证据现为103项，仍37步、1041basic/5deep。三proxy limitations及全部发布旧limitations再次直接与15e6比较通过。

已读取 `sample-stream-runtime-audit-before.log`：两条新增回归在b030均因预期问题失败，分别是旧正文释放顺序及该步骤缺少回调绑定，不是无关格式或环境失败。已核新的测试逻辑：DNS检查从该步骤source_ids查找回调；peer检查固定源码中free位置先于tries判断，并检查正文顺序。`sample-stream-runtime-reviewed-focused.log`为25/25通过；读取 `sample-stream-runtime-reviewed-tests.log` 已见全量156/156通过，fail/cancelled/skipped/todo均0。本角色未重复运行测试。

内容、固定证据、发布全字段及回归复核通过，全部P2关闭。最终收口仅待主线程将f8c21受影响两项网页复验和其余展示不变的结果落入验收记录；原b030的A24/B258、外部2/1及四页面37步/链接一致性作为中间验收记录保留，不冒称其已直接验证新release。当前尚不做整批最终签署。

## 最终验收依据与签署

主线程随后在交接消息中明确确认：桌面当前release为f8c21，B258/external1；四项全部37步的condition/action/scope及全部步骤和独立文档链接顺序，再次与f8c21实际dist逐字段完全相同。原样例CLI亦重新回放A24/B258、50去重身份，默认/继承unverified均为0。上述网页和原样例操作由主线程执行，本角色引用其明确验收结果，未自行打开浏览器或读取原样例。

本角色再次核读 `sample-stream-runtime-reviewed-tests.log` 的最终结果：156/156通过，fail/cancelled/skipped/todo均0；定向25/25此前已核。已查看最终 `sample-stream-runtime-browser.png`，可见运行时已核实状态、限定范围提示及步骤展示；截图仅作可见展示佐证，完整37步及链接序列核对以主线程逐字段结果为据，不声称单张截图证明全部页面或release身份。

签署时读取 `SAMPLE_STREAM_RUNTIME_VERIFICATION.md` 尚为中间验收内容，主线程已明确正在写最终验收。本节将其本轮已完成的最终验收交接落入独立审核记录；不将文档尚未同步误报为未执行验收，也不冒称已读到尚未写入的最终正文。

最终签署：`1.27.1.1-f8c21e3662af9366` 本批独立审核通过。测试P2及内容P2-A/P2-B全部关闭；四身份37步、103项新增证据、固定源码/补丁/文档、limitations必要表示修复、全部旧字段及其他1037身份保护、精确1041basic/5deep、25项定向和156项全量结果，以及主线程最终样例与网页验收均已完成审核。无剩余审核阻塞，主线程可按该发布收口。

结论仅覆盖本批四身份所述固定源码静态运行链，不扩大到resolver_timeout独立身份、完整TLS/DNS/重试机制或真实OpenResty网络运行。审核角色：Astra low；日期：2026-10-13。本轮仅写本审核文件，没有修改产品/知识/测试、构建、全测或生成临时文件。
