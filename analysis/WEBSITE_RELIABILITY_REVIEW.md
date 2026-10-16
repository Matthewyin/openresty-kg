# 网站可靠性修订独立审核

日期：2026-10-14。状态：待审，尚无实施或最终验收通过结论。审核者仅写本文；不修改knowledge、代码、测试或发布数据，不读取私有样例，不执行build或浏览器。本轮不包含Codex真实接入、手机验收或现场部署。

## 需求与范围检查

本轮目标为已批准的最小可靠性修复及知识状态表达，不能把它扩大为全站知识重新研究。沿用规范与需求分别核对的方法，由现有主线程/规划/实施/审核分工完成，不额外创建线程。首次准备时WEBSITE_RELIABILITY_PLAN.md尚未落盘；“3 bugs”的具体身份、复现输入和行为契约尚待该计划确认，不能凭旧代码自行替换成其他三个问题。以下为审核门槛，不是实施方案已获审核通过。

## 固定基线

- 发布：`1.27.1.1-1c2ead24459672e6`，1041基础（包含deep）、44 deep；bundled1017/40、department_extension24/4。
- 对基线索引全部deep身份排序后JSON.stringify的SHA256：`595ff6c2aab690483e2582d73cbf315b865497ddec1b47241f1d14edc4a0f2cf`。本轮不新增或删除deep身份。
- knowledge/directives.json原文件SHA256：`aa4cec0555f452638815b155ea0b625f626ae5cd7cac61fb80ba70531ddaeb14`。
- knowledge/extensions.json原文件SHA256：`e0e7f95436f03d97242d7907f34a749e5aa9e2fe9c48a65d70745f877a111942`。
- 六项C1的既有收口依据：SAMPLE_REMAINING_RUNTIME_PLAN.md:56–63、SAMPLE_FINAL25_RUNTIME_VERIFICATION.md的两样例/C1说明。知识摘要是变更定位基线；如实施需新增明确获准的状态字段，应逐项白名单比较，而非要求最终文件摘要仍相等或整体忽略知识差异。

## 最小验收边界

| 项目 | 通过所需证据 | 不接受的替代 |
| --- | --- | --- |
| 三个实际缺陷 | 计划逐个给出复现、根因位置、预期结果与非回归边界；稳定交接逐项查实现及有区分度的反例。parser保持名称/参数/位置/上下文及不完整输入处理；启动/UI状态核必要与可选资源失败、加载期交互及异步旧结果失效（以实际缺陷范围为准）。 | 只增加容错catch、改提示即称修好；把非法输入静默视为成功；借修复扩展为完整Nginx参数校验。 |
| 六项C1显式表达 | 数据明确区分“配置阶段范围已核对”和“运行时尚未研究”，精确作用于include、events、http、stream、HTTP与stream各自variables_hash_bucket_size；状态有既有证据与限定解释，构建、校验、页面、Markdown一致。 | 在JS按六个名称/模块名单特殊显示；按phase或无runtime自动推断所有basic均已完成；用假runtime或状态改名晋级deep。 |
| 新状态契约 | 优先最小可选数据表达；拒绝非法值、证据失效或互相矛盾的状态。字段缺失的旧详情保持原有保守含义。若需新字段/枚举，计划明确结构、合法组合与不改变评级的规则。 | 为通过测试放宽validateRuntime；让新字段成为所有旧版本必填；把not_applicable等同未知或把未知改成已核实。 |
| 原知识保护 | 44项deep精确身份、全部runtime步骤/来源/范围不变；旧来源完整对象和顺序、默认/继承/限制/补丁及其他旧字段保护。只允许批准的六身份状态字段或必要精确新证据，新增字段本身也要白名单；非目标完整比较。 | 仅断言44或1041计数；统一删除大类字段后比较；全量重算事实状态或改补丁结论。 |
| 版本与历史读取 | 当前索引与同release详情一致；不覆盖旧发布；用旧schema1及旧schema2实际详情验证无新字段也可读，旧链接/历史查询不能偷偷回退当前。六C1新解释仅在含明确数据的新发布出现。 | 仅测当前release，或修改旧JSON使旧版本满足新标准；只测validate不核读取/展示链。 |
| 状态及文档准确性 | basic不保证默认/继承已核实，deep仅所列范围；固定版本不等于现场安装，适用条件待研究与现场未验区分。README当前摘要与最新发布一致，历史数字标明快照并指向最终记录。 | 改标签掩盖真实未核实项；删除历史失败记录；用全量匹配、零解析错推导配置在现场有效。 |

## 当前代码实查与关注点

- src/query/knowledge.mjs:58–61的basic条件没有要求默认/继承verified；41–52的deep契约要求相关事实与真实运行代码，但不要求availability已核实。新表达不能偷偷改变这些评级含义。
- site/app.mjs:119及src/query/knowledge.mjs:206目前对无runtime统一输出“尚未核对”；六C1的修复须由明确知识数据驱动，页面与Markdown共用或一致实现，不能只改单边文字。
- scripts/build.mjs:251–252在没有availability时生成unverified，已有源码条件与现场未知不能因此混写为源码事实已完整研究或全部未研究。
- site/app.mjs已有querySequence/previewSequence失效保护；启动及可选资源修复须保留其效果，不能让旧请求重新填入新输入的详情。这里只登记回归关注点，不预判其就是三个已批准缺陷之一。

## 交接与签署状态

1. 规划待落盘审核：待审。
2. Sol parser及parser测试稳定组：待交接。
3. 主启动/UI状态、六C1数据表达及docs稳定组：待交接。
4. 冻结候选/旧字段与历史版本保护：待审。
5. 主最终build、定向/全量测试、同release真实UI证据：待交接。
6. 最终独立签署：未签署。

后续每次只审核明确稳定的变更；发现问题给精确位置、实际影响及最小退回。最终区分审核者只读源码/发布/日志核验与主实际浏览器操作，不把截图或HTTP成功当全部UI验收。

## 最小UI方案确认：替代前述六C1字段要求

主明确本轮不新增schema、不硬编码六身份、不改knowledge。采用所有无runtime详情的通用中性提示：未提供独立运行链，不据此判配置组织类内容未完成。此方案范围合理，替代前述表格中“六C1显式表达/新状态契约”的实施要求；不要求新增六项状态字段，也不允许据新提示推断某条basic已完成全部研究。其余保护要求保持。

稳定交接时按以下精确边界审核：

1. 页面与Markdown无runtime提示一致，既不宣称运行链已核实，也不再把缺runtime直接等同未完成；有runtime仍显示原scope、步骤、引用及现场边界。basic/deep说明不改变枚举、deriveVerification或validateRuntime标准；availability保留原status，只解释源码核实与现场确认的区别。
2. knowledge两文件保持基线字节摘要；当前发布1041详情除release_id外与1c2ead全部字段完整相等，含44 deep集合、所有事实、来源对象/顺序及runtime。当前索引只允许精确的gaps删除/文字调整、release_id和对应路径变化，不以通用“忽略coverage”放行。删除的是已完成部门深度待办，现场版本/安装等未知信息仍保留。
3. final25专项固定1c2ead作为已完成历史批次是合理的，但必须另有当前发布1041详情完整保真与索引精确差异测试；新旧发布都验证可读，不能只将旧测试改为永久通过而停止检查当前产物。负例应证明旧事实改字、来源移位、runtime改动、非白名单索引字段变化均会被拒绝。
4. 启动自动测试执行真实完整app，保留实际knowledge client及renderer，只替换examples故障请求是合适的最小测试。检查故障分支确实命中，必要配置/索引仍加载成功，查询或详情仍可实际工作；不能只断言未抛异常。轻量DOM不足以证明真实浏览器行为，最终仍需主同发布真实页面验收。失败场景按最终计划给出的故障类型核对，不额外要求无关组合。

本节确认的是最小方案边界，非实施通过。计划文件此时仍未落盘；三bugs具体清单与稳定实现、主最终build/test/UI证据继续待交接。

## 计划及startup/UI稳定组首次审核

已完整读取WEBSITE_RELIABILITY_PLAN.md。三个缺陷现明确为R1 `${pid`词法、R2 Lua短字符串`\z`跨空白、R3可选examples阻断启动；范围和本审核最小方案一致。计划边界通过，R1/R2实现待Sol稳定交接。本计划所称sample.pending应按实际配置键department_sample_status.pending执行，不新增同名替代字段。340项只作后续分组，不是本轮已验证清单。

当前工作目录本身不是Git工作树，不能声称取得HEAD差异；本次使用尚未重新构建的dist/app.mjs与dist/src/query/knowledge.mjs对照当前源文件，再逐段阅读实现与新测试。validateRuntime、deriveVerification、validateDetail、validateIndex四函数与构建前版本原文一致。

R3实现审核未发现阻塞性代码问题：site/app.mjs:373–388仅在examples边界捕获读取/JSON/结构异常，沿用config.request_timeout_ms；完整校验后才生成按钮，错误不残留部分示例。407–415先建立目录/永久详情及ready，再不等待examples并启动参考库，examples异常不再进入全站启动catch；核心配置/索引仍走原失败路径。pending夹具证明不阻塞，但fetch替身不接收signal，因此不将其当超时取消实测。

显示实现通过代码层审核：四常量位于src/query/knowledge.mjs:22–25，被页面与Markdown共同消费，无六身份JS硬编码、不新增字段/枚举、不改变availability值及评级函数；原runtime正文/步骤/来源与RUNTIME_SCOPE_NOTE继续展示。NO_RUNTIME_NOTE保持中性，没有把全部basic判完成。测试中的六身份列表用于验收而非产品逻辑，可以保留。

test/site-startup.test.mjs确实执行完整app源码（仅替换模块注入/import.meta.url及浏览器环境），保留实际knowledge client/renderer；每种examples失败先确认请求发生、目录/永久详情/参考库/ready，再提交pid检查唯一匹配；正常按钮及索引失败也有断言。轻量DOM不等于真实浏览器，仍待主最终UI。

| 编号 | 位置与问题 | 最小退回 | 状态 |
| --- | --- | --- | --- |
| REL-T1 | test/site-startup.test.mjs:48仅以[null]代表坏条目；没有实际覆盖app.mjs:380–382的非法mode、字段类型、空label/text。删除这些校验仍可能通过8项，尚不满足计划R3“错误条目字段”判据。 | 在现有全app harness添加少量对象型坏条目：非法mode、非字符串context或缺字段、空label或text；至少一例合法条目在前、非法在后，确认只显示局部提示而非残留按钮，且真实pid查询仍唯一匹配。无需改产品代码或增加框架。 | 待补测试复核 |

主报告旧6失败+scope1失败、修后8/8属于主执行结果；本审核已查测试实际判据，未重新运行套件。当前状态为startup/UI实现范围认可，REL-T1待关闭，最终build/当前1041保护/历史读取/docs/真实UI未签署。

## REL-T1关闭及当前发布保护测试预审

2026-10-15只读复核稳定测试。REL-T1代码层关闭：新增非法mode、text数字（前置完整合法列表）、context为null、空白label与空白text；404与503分开覆盖。所有场景沿用真实完整app harness，断言examples被请求、局部提示且只剩一个提示节点、目录/永久详情/参考库可用及pid提交唯一匹配，合法在前的场景不会残留按钮。未改产品代码。本结论不冒充主即将执行的定向/全量结果。

reliability-publication.test.mjs静态审核通过，待构建后实际结果：固定1c2ead索引原始字节摘要、两份knowledge字节摘要和department_sample_status精确对象；expectedGaps仅将一个完整指定文本替换，其他gap及顺序保持。checkIndex先检查实际detail_path/references_path与实际release_id绑定，再与基线逐项比较，最后仅规范化获准字段；coverage其余键不豁免，身份顺序与全部索引元数据保留。1041详情先断言真实release_id并validateDetail，再仅规范化release_id逐对象全量比较；参考库同样完整保真。

负例直接覆盖误删现场gap、错误计数、残留历史detail_path、availability改为verified、source代码变化、runtime文案变化及旧release_id，调用同一保护函数。当前尚未build，旧gap正例失败、某些“残留旧release”变异尚未形成差异而失败属于主报告的旧基线红灯，不能据此签绿或放宽断言。新发布后必须全部恢复通过。

final25-runtime.test.mjs已将索引固定到1c2ead，真实查询options也显式release=index.release_id；06a639历史查询仍覆盖自己的release。当前发布测试独立接管1041完整保真，因此历史冻结不是停止校验当前版本。历史schema1兼容、实际新发布及浏览器证据仍待最终交接核验。

当前状态：计划范围、startup/UI实现与REL-T1修订、发布保护测试设计通过代码层审核；R1/R2、主最终build/test、docs同步、历史读取和两类真实页面验收尚未签署。

## Parser稳定交接、文档及新发布独立复核

已完整读取WEBSITE_RELIABILITY_PARSER_EVIDENCE.md，并独立git show读取固定Nginx ngx_conf_file.c:627–758、nginx.c:65–70、字符串槽1065–1089，以及固定LuaJIT lj_lex.c:190–280、lj_char.h:11–26、lj_char.c字符表。R1的variable在`{ && variable`提前continue时不清零，故美元后连续开花括号保留为参数；后续普通字符会清状态，真实开块/空白/分号仍分隔。当前parser:70–72与此一致，没有强加变量表达式闭合验证。pid字符串槽保存词法参数，不代表文件可创建。

R2当前parser:100–108只在未转义的反斜杠z后吞ASCII空白9–13、32；不使用JS宽泛空白，不吞NBSP，不让普通换行/未闭引号通过。独立核对LuaJIT的z分支与SPACE位一致。测试新增五组（103、126、316、336、348）覆盖raw_args、分号、真实块、转义、外部引用、单/双引号、各种换行/空白、字符串内花括号及后续offset/行列/context；旧断言只把有分号未闭变量从错误样例移为新正例，同时用真正缺分号保持结构错误断言，语义合理。

重要范围：另独立读取固定lua-nginx-module ea09d92adf835e30cab8d79343c7b8266e888128的util/gen-lexer-c:13–17，短字符串模式排除LF；因此认可Sol保留的原生配置块词法差异说明。网站按Lua边界保留字符串内花括号，不构成固定lua-nginx加载全兼容或OpenResty执行成功保证；不要求本轮扩展为原生执行器。R1/R2代码及测试判据通过限定范围审核。

实际SHA核得parser=`89f8e27b882bf58027aa710e1157486af73cb1dc845db75475ba3e684b8dd94d`、parser.test=`a91fd6ee8d2cb1aa6fc8aad9185f36cb986be7fcff17a193905232395ecb1f32`，与Sol交接一致。Sol的50/50红绿结果来自其证据记录，审核者没有重跑套件。

README、REQUIREMENTS、IMPLEMENTATION及两个历史入口状态已检查：当前1041/44、六C1和340项后续事实边界分开，旧0deep/待M4有明确历史段落说明，原需求目标没有用本轮修复替换。可靠性最终结果仍待实际验收记录，不沿用历史247项冒称本轮通过。

新发布`1.27.1.1-f9f6f0ffb7eba3d8`已直接独立读取：1041详情逐对象除release_id外与1c2ead完全一致，先校真实release及validateDetail；当前索引等于同release冻结索引，身份/计数/顺序与所有其他元数据不变，仅指定gap和发布路径变化；参考库完整保真，knowledge两摘要仍等于固定基线。通过实际knowledge client的只读文件fetch分别读取schema1 eeabda4eba7f5c16、schema2 1c2ead及新发布，并查询pid，旧版保持basic、新两版deep，版本不回退。未操作浏览器。

定向日志website-reliability-focused.log已实读119/119、fail/cancelled/skipped/todo=0。全量日志当前实读268项、264通过、4失败，均为旧无runtime展示文案断言；未签全量通过。

| 编号 | 位置与问题 | 最小退回 | 状态 |
| --- | --- | --- | --- |
| REL-T2 | test/http-timeout-runtime.test.mjs:328、proxy-chain-runtime.test.mjs:356、runtime.test.mjs:241、stream-runtime.test.mjs:257仍要求“运行时链路：尚未核对”，与批准的通用中性提示冲突。 | 只更新这四处展示期望为批准NO_RUNTIME_NOTE；保留历史release、basic评级、runtime===undefined以及原数据/来源保护断言，勿改旧详情或恢复旧提示。修后复验相关专项与全量。 | 待修复及结果复核 |

当前R1/R2/R3实现、显示/doc范围及新发布数据保护可通过；REL-T2和主正常/故障两种真实页面证据待关闭，最终仍未签署。

## REL-T2复验关闭及浏览器交接待最终汇总

2026-10-15独立重读四个历史专项：旧提示期望已改为包含完整“运行时链路：”+NO_RUNTIME_NOTE，并导入同一常量；历史release/basic/无runtime等原有保护保持。已实际读取website-reliability-history-tests.log的43/43，以及website-reliability-final-tests.log的268/268，均0 fail/cancelled/skipped/todo。REL-T2关闭，先前264/268为保留的中间失败记录，不再作为当前结果。

主交接真实浏览器结果：新f9f6页两个原反例唯一匹配、普通未转义Lua换行仍报错并清详情、六C1无假待办、sendfile范围与availability原状态可见；两个隔离loopback服务分别仅向examples注入坏JSON/断连接，直链events、1041目录及8参考正常，显示局部故障提示且手动pid仍唯一匹配，服务器记录实际注入请求；临时服务已停止、恢复51795。此为主真实UI操作记录，不冒称审核者操作浏览器，也不以VM代替该记录。

全部已报实现/测试退回项关闭。等待主最终VERIFICATION与构建资源/文件摘要交接后核对并最终签署，当前未提前签整体完成。

## 最终独立签署

日期：2026-10-15。结论：通过。签署对象为WEBSITE_RELIABILITY_PLAN规定的R1/R2/R3、共用中性范围说明、文档状态同步及发布`1.27.1.1-f9f6f0ffb7eba3d8`。REL-T1、REL-T2全部关闭，无本轮待修项；前文待审/失败状态仅保留为过程记录，以本节为最终结论。

已完整读取WEBSITE_RELIABILITY_VERIFICATION.md，与本审核独立源码检查、实际发布1041详情/参考库/索引精确保真、旧schema1/2读取以及119/119、43/43、最终268/268日志相符。首次264/268失败和修订原因仍保留，未冒称首轮全过。未重复build或测试。

最终文件摘要已重新实查：knowledge两文件及历史1c2ead索引与基线不变；当前索引SHA256为`4276b2a74f8d071e3b85bb5c82489899b30c35cb1791bcc25f0e46b639c32b4f`。app.mjs、parser.mjs、knowledge.mjs、index.html四资源的源文件与dist字节相等；审核者另外只读GET 127.0.0.1:51795的四资源，SHA256逐个与源文件及VERIFICATION表相等。这是资源一致性检查，不冒称浏览器交互验收。

截图已实际查看：正常截图可见pid字面`${demo`路径的唯一匹配及basic/deep范围说明；故障截图可见1041计数、分组44深度及局部“示例暂不可用”提示。截图仅佐证所显示区域，不独自证明全部场景。已读test/helpers/preview-faults.mjs，注入限定/examples.json坏JSON或断连接，其余读取同一dist，不改产品资源。

真实浏览器正常与两个故障场景、六C1逐项、sendfile/availability、Lua原反例及未转义换行错误、故障请求确实触发与临时服务停止，采信主VERIFICATION执行记录；两份原样例A24/24外部2、B258/258外部1且错误/关注0、CLI/UI一致并清除输入，也由主执行记录提供。审核者未读取私有样例、未操作浏览器，不把VM测试或只读GET替代真实UI结果。

保留范围：R2是Lua边界扫描，固定LuaJIT与lua-nginx配置块词法器不完全等价，不能推导所有Lua合法文本均能原生加载；匹配不等于参数或现场配置有效。340身份默认/继承补证、现场版本/安装/运行、Codex真实接入、手机及现场部署不在本轮完成声明内。无runtime提示保持中性，未新增六身份产品名单、schema或知识状态，原44deep及全部知识事实保留。

本审核最终只更新WEBSITE_RELIABILITY_REVIEW.md；没有修改实现、测试、知识或发布数据。最小修复、测试保护、数据保真、记录及证据归属闭合，同意本轮交付。
