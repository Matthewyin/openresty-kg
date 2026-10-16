# NDK 独立审核

日期：2026-10-10。冻结发布：1.27.1.1-7e53dde6171ab67c。最终结论：本批 N01–N05 通过，无遗留阻断。通过范围为四组件正式注册目录接入及对应发布，不表示全发行版范围、基础知识、部署或 Codex 宿主验收完成。下文准备与待验状态保留历史依据，以最后收口为准。

## 深度交互：目标与范围

本批目标是核实 ngx_devel_kit、set-misc-nginx-module、array-var-nginx-module、form-input-nginx-module 的正式注册范围并接入目录。最短可核验路径为固定 config → 正式编译/include 链 → commands 及 owner → 宏定义与条件 → 实际 catalog/发布。所有 C/h 正则命中不等于范围闭合；模板、可选功能、独立 examples 必须区分。无须扩展通用 C 预处理器，无法支持的注册形态须明确拒绝或保留待核实，不能静默漏项。

只永久写本文件。允许自有 mkdtemp 隔离验证并 finally 清理；不修改产品实现及用户源码，不运行 mirror-tarballs，不编译/运行 OpenResty，不提交/push。不增加手机、Codex 实际接入、backend/DB/RAG 验收。C-R05 已关闭，本批无新增相关知识时不重开补丁全集审核。

## 直接执行：已核证据

已读旧 scripts/inventory.mjs、scripts/build.mjs 和 CONTENT_REVIEW 收口。实际 dist/knowledge/index.json 仍为 1.27.1.1-dee833a2c9381a27，coverage 为 913 注册、23 basic、0 deep、inventory_complete:false；components 中 20 项 not_inspected。8 参考及旧发布完整性待 ready 时逐项再次比对，当前不冒称已经重新验证全部发布。

三个已到场仓库 git status --short 均为空；后续原文全部按以下完整 SHA 读取，不用工作树内容替代：

| 组件 | 固定 SHA | 当前检查 |
|---|---|---|
| ngx_devel_kit | 91e30eb05085e7f9762f130cbb883a0e753cf74d | config、src/ndk.c、objs/ndk_config.c、src/ndk_upstream_list.h、set_var 头文件、examples config 已读 |
| array-var-nginx-module | 32188f86599b47f7cd34340e5a2985bd9d550bf8 | config、正式 commands 和 owner 已读；4 项直接注册 |
| form-input-nginx-module | 43ee690c359c06af7d178379cfc37ebc858d9de2 | config、正式 commands 和 owner 已读；2 项直接注册 |
| set-misc-nginx-module | 31c4ad67bb9e392a734e4e58ea8048e24012311f | 已到场且 status clean；正式 config 已读，注册表只读解析发现 literal 空格兼容边界 |

OpenResty 工作树检查仍仅 ?? tags。主线程给出 configure 默认列表与 no_ndk 联动、下载 tag 行号；这些暂记为主线程核对记录，后续与计划范围一起按固定原文复验。

## 已识别的本批风险与准备判据

1. NDK 自身不是简单零注册库。正式 config 指定 src/ndk.c 和 ndk_http_module；src/ndk.c 引入 ndk_config.c，owner 的 commands 字段为 ndk_http_commands。固定 objs/ndk_config.c 的数组在 NDK_UPSTREAM_LIST 条件下定义 NDK_UPSTREAM_LIST_CMDS 并引入 ndk_upstream_list.h。该头文件第 2、6–13 行条件注册 upstream_list，flags 为 NGX_HTTP_MAIN_CONF|NGX_HTTP_SRV_CONF|NGX_CONF_2MORE，callback 为 ndk_upstream_list。必须绑定跨文件 owner、引入条件和原文位置，不能用合成展开文本行号冒充原文件行号。
2. NDK 的默认模块接入不证明 NDK_UPSTREAM_LIST 默认启用。auto/data/modules_optional 包含 upstream_list，objs 中生成文件和 auto/build 的生成逻辑需相互核对；模板宏定义本身不能计为已注册指令。当前只确认条件链存在，尚未闭合默认开关来源，不宣称默认可用。
3. examples/http/set_var/config 独立指定 ngx_http_set_var_examples_module 并添加其 C 源码；NDK 正式 config 只指定 src/ndk.c，未把该 examples config 纳入入口。排除 examples 必须保存这组构建路径证据，不能仅靠目录名过滤。
4. array/form 的正式 config 分别指定对应 module.c，检查 NDK 先行接入并追加 -DNDK_SET_VAR。NDK API 依赖不改变注册 owner：分别属于 ngx_http_array_var_module 和 ngx_http_form_input_module。array 的 array_it 是变量原文，不能误作指令。
5. 旧 extractCommands 只在同文件查 owner，数组内无花括号的宏调用/include 可以被跳过；context_flags 仅匹配 NGX_*_CONF，NDK_* 宏不能未经解析即声称 contexts_verified。需以本批实际形态及未知宏负例核对实现，不能因现有测试通过免审。

## 计划到场及 ready 后验收

以下是准备判据；待完整 NDK_PLAN 落盘后按计划逐项建立最终矩阵，不能替代尚未形成的计划或提前通过。

- 四组件完整 SHA、发行版版本/tag、正式源码入口、include/生成链、owner、flags 展开来源及条件均可复核；未知宏不得静默提取为完整结果。
- 新 catalog 对照固定源码逐项核查原文、行号、callback/post、flags、guard、owner；同名跨 module 保留，以 component/module/name 区分。新增全部 registration_only。
- 可选 NDK 注册与默认构建明确分开；examples 排除有 config 证据；待核实项只按真实闭合范围减少，不机械承诺 20→16。
- 隔离验证固定 tree 文件集合及内容不受 dirty/未跟踪/删除污染，不清理用户仓库来掩盖问题。
- 主线程明确 ready 后锁定 release_id，检查真实 index/detail/reference、来源片段与固定 URL、发布哈希及实际调用链。23 basic、0 deep、8 参考保持，旧 dee833a2c9381a27 发布不覆盖；新增仅注册状态不能抬高基础知识完成数。
- 发现确定问题写入本文件并打回主线程或 Sol；修订实现 ready 后针对差异复核，最终以落盘计划及实际发布一致为通过条件。

## 四来源到场后的补充边界

set-misc 固定 config:62 添加 -DNDK_SET_VAR -DNDK_UPSTREAM_LIST。NDK 可选注册在默认 OpenResty/set-misc 组合中激活与实际部署是否启用是不同结论；最终必须保留 NDK_UPSTREAM_LIST guard，并引用使用方启用证据，不表述为 NDK 无条件默认注册或部署已启用。

已只读核对 auto/build 的 generate_commands：读取 modules_optional 带星号条目，输出条件、CMDS 定义、头文件 include 及 undef，与固定 objs/ndk_config.c:65–72 的路径相符。没有执行生成器。三个使用方的 literal 注册不要求通用宏展开。

现提取器对固定 set-misc 注册中的 ngx_string ("set_encode_base64") 报未支持表达式；仅记录准备观察，Sol 正在最小处理，未 ready 前不作为最终余项报告。

当前结论：四来源已到场，等待 NDK_PLAN 及明确 freeze/ready 发布后正式审核。按最新要求暂停余项报告，不提前通过。未运行写入产品目录的 inventory/build，也未重做 C-R05。

## 冻结计划对应的正式检查矩阵

已完整读取主线程确认冻结的 NDK_PLAN.md 与 NDK_MACRO_NOTES.md。上文“等待计划”为历史准备状态；当前等待实现及发布 ready。实施中的观察不作最终余项或通过结论。

| 计划项 | 独立检查对象 | 通过判据 | 当前状态 |
|---|---|---|---|
| N01 固定输入 | 四 source 的版本、tag/SHA、registration_inputs 与固定 config；NDK owner_file/includes 映射 | 输入文件确在固定树且符合正式构建路径；明确排除独立 examples；配置声明经源码验证，不能直接授予 verified | 四 SHA/config 已预读，最终配置待 ready |
| N02 literal 提取 | 三使用方完整 commands、owner、catalog；空白及尾逗号处理 | set-misc 完整名称集合逐项对照，array 4/form 2；字段、post 和行号准确；filter 不误计；同名跨 module 保留 | 待实现 ready |
| N03 NDK include | src/ndk.c → objs/ndk_config.c → src/ndk_upstream_list.h；registration_evidence | owner 的实际 commands 字段和真实 include 均验证；upstream_list 属于 ndk_http_module；registration 使用 header 原始坐标；父条件 NDK_UPSTREAM_LIST 与局部 NDK_UPSTREAM_LIST_CMDS 均可见，后者明确由容器临时定义 | 固定链已预读，记录与门禁待 ready |
| N04 来源接入 | build 对 registration_evidence 的实际消费及新 detail.sources | 原文片段分别来自自己的固定文件、SHA、行号；owner 与中间 include 可追溯；不只留在 catalog 而丢失于发布；无须跨组件回调正文解析 | 待主实现 ready |
| N04 发布及回归 | 实际 catalog/current/全部新详情、旧发布、references、coverage、查询与桌面执行记录 | 新项全部 registration_only；旧 913 项及 23 basic/0 deep/8 参考内容保持；examples 不进入目录；旧发布不覆盖；哈希和来源准确；pending 按证据减少 | 待发布 freeze/ready |
| N05 复核收口 | 本矩阵、实际差异、负例结果与最终 release_id | N01–N04 均有证据；确定错误打回相应责任方并复核；分别陈述范围核定、目录接入、构建和知识状态 | 尚未通过 |

### 本批实际边界验证

- literal 空白：固定 set-misc/array 的 ngx_string 后有空格仍可解析，名称必须保持字符串字面量。
- 尾逗号：set_misc_base32_padding 的 post 必须保留 &ngx_conf_deprecated_set_misc_base32_padding，不能变为空字段。
- 条件集合：set-misc 的 NGX_OPENSSL、ifndef NGX_HTTP_SET_HASH、NGX_HAVE_SHA1 保留；不根据审核机器裁掉条件注册。
- 跨文件负例：断开 owner 的 commands 指针、owner 对注册源的 include、容器对片段的 include 或显式映射后，不能仍标 verified；未知宏、名称表达式、include 必须拒绝或明确 pending。
- 来源坐标：NDK 片段不得使用拼接文本行号；registration_evidence 必须让发布读者看到实际 owner/include/guard 依据。固定 tree 的文件清单和内容不受 dirty、未跟踪或本地删除污染；仅在 mkdtemp 副本检查并 finally 清理。
- 范围边界：默认 OpenResty/set-misc 组合激活 NDK_UPSTREAM_LIST，NDK 单独接入仍是可选路径，实际部署未知；保留 guard，不误称无自身指令。生成器与模板只作固定输入链证据，不执行或复刻，不开展通用 macroexpand。

预期增量 29 + 4 + 2 + 1 = 36、总量 949，仅用于发现差异，不能以命中数字替代逐项集合验证。四项 pending 关闭以正式注册链闭合为前提；其余组件不能自动完成。无新增知识正文，因此不重开 C-R05 全补丁审核，不新增功能或无关重写。

## 实施 ready 子阶段独立审核

已完整读取修后 inventory.mjs、test/ndk.test.mjs、四个正式 registration_inputs 和 Sol 交接记录；读取 build 实际消费 registration_evidence/registration_defines 的新增调用链。此节只审核已 ready 实施，不把主线程构建中的发布视为冻结版本。

### 独立执行与固定来源检查

- 实际运行 node --test test/ndk.test.mjs：5/5 通过，0 失败、0 跳过。包含四固定 SHA 原文、真实隔离 inventory、NDK clone 的 dirty owner/header、删除容器、未跟踪示例污染，以及错误输入拒绝后既有隔离 catalog 保持不变；隔离目录均由测试 finally 清理。
- 实际隔离全项目结果为 949 注册；旧 913 catalog 字段与运行时现有基线比较一致。该测试不是旧冻结发布的独立比较，旧发布内容仍待发布审核逐字段验证。Sol 所报 24 项为其执行记录，本线程本阶段只重跑与新增实现直接相关的 5 项。
- 本线程另行只读固定树，并用独立 literal 检查逐条核对现 catalog 的 36 项名称、原始行范围、flags、callback、post、revision、registration_only 和 module_verified；全部一致。首次辅助正则错误处理尾逗号而失败，修正本线程只读检查表达式后全量通过，不将检查脚本错误归为实现缺陷，未修改任何产品代码。
- 固定树查到三使用方各只有正式 module.c 包含 commands 数组；NDK 两处数组为 objs/ndk_config.c 和独立 examples module。结合此前已读 config/include 路径，所选正式文件与 examples 排除有构建关系依据，不能由此宣称任意仓库全树正则扫描即可证明完整。
- 完整阅读 set-misc:235–535 的 29 项及 owner；NGX_OPENSSL、ifndef NGX_HTTP_SET_HASH、NGX_HAVE_SHA1 条件与测试记录吻合，弃用名称保留真实 post。array 4、form 2、NDK 1 均与已读实际注册一致。
- 已独立读取固定 OpenResty configure:70–95、536–546，确认四模块默认组合及 no_ndk 联动；结合 set-misc config:62，默认组合激活 NDK_UPSTREAM_LIST。NDK 固定 ndk.h/config.h 的 include 与依赖也已核对；实际部署未知，未执行生成器或 OpenResty。

### 实现判定

N01–N03 在本批固定来源及限定输入形态下未发现阻断问题：literal 空白和尾逗号正确处理；正式 owner 核对 initializer 的 commands 字段；跨文件须实际 include 注册容器，片段须匹配临时 define/include/undef 和指定条件结构；未知形态、断链、重复或未消费映射均有拒绝检查。本批不要求通用宏或任意 include 展开。

NDK 记录保留 header:6–13、owner src/ndk.c:102、owner-include:8 与 container:65–72，guards 为 NDK_UPSTREAM_LIST 和 NDK_UPSTREAM_LIST_CMDS，临时定义指向 container:67。build 对这些 evidence 调用现有固定 revision snippet，动态中文 notes 说明临时宏不要求用户额外设置；未引入跨组件回调解析或提升 basic 状态。

N04 仅代码接入已检查，正式发布输出、949/23/0/8、旧发布逐字段保持、真实 HTTP 和桌面结果尚未完成本线程验收；N05 尚未通过。主线程已说明旧 TaskSpace6 关闭并拟申请新桌面验收空间，本线程未操作浏览器，不将未完成桌面验收写为通过，也不新增手机任务。

本阶段没有需要打回的确定问题。继续等待主线程明确最终 release_id 与正式发布 ready，再检查全部输出。永久仍只写本文件。

## 正式 candidate 的 N01–N04 产物审核

冻结对象：1.27.1.1-7e53dde6171ab67c。主线程已声明产品 ready，HTTP 与新桌面空间验收当时仍在进行。本线程锁定此 release 读取，不以未声明的其他输出替代。

独立检查全部通过：

1. current index 与该冻结 release index 逐字段一致；实际 validatePublication 对 949 个详情及 references 全部通过。catalog 的 component/module/name 组合与 index ID 集合及顺序完全一致，949 个 ID 唯一；127 个重复名称对应的 282 条跨模块记录全部保留，没有按名称去重。
2. 对旧 dee833a2c9381a27 的 913 个详情逐个比较，除 release_id 外全部字段与新发布相同；8 个 reference payload 全部相同。旧冻结目录仍完整可读。本项为本线程直接读取双方产物的独立证据，不依赖主线程测试报告。
3. 新旧 ID 集合差为 36，分别为 NDK 1、set-misc 29、array 4、form 2，全部 registration_only。新详情的 callback、compile_guards 与 catalog 逐项一致；未将注册提升为 basic，未把 examples 或模板名称计入新增集合。
4. 36 个新详情的全部 109 个实际 source 片段，逐个与四个约定完整 SHA 的 git show 原文切片比较，全部逐字相同；URL 的 SHA/文件/行范围一致。NDK owner、owner include、commands 容器与 header 注册片段均进入正式 sources；两个 guard 可见，临时 NDK_UPSTREAM_LIST_CMDS=1 的中文说明指向 objs/ndk_config.c:67，没有要求用户另设此宏。
5. 从实际 949 详情剥离 schema_version/release_id/openresty_version 包装字段，以 directives/references/coverage 重新计算构建 hash，得到 7e53dde6171ab67c，与发布身份相符。
6. 实际覆盖为 949 注册、23 basic、0 deep、8 参考、inventory_complete:false。components 共 43，27 inspected，四新增项为 fixed_registration_inputs；剩余 16 not_inspected 与发布中逐组件 pending gaps 完全一致。四项关闭由本批固定正式链核查支持，不是仅由新增 source 配置推定；全范围及基础知识未宣称完成。
7. 已完整读取 NDK_SOURCE_PROVENANCE，并独立核对四固定树 SHA 和文件数：NDK 0fdc2ba9444890dd9e91357dda145066b19ebfd6 / 88，set-misc 623c679ae24ed7edcf28b90d9713c4577286e1e9 / 60，array 04bdb7e8f1c708475c2ae4c62392d7151ef94e7c / 12，form b073aff720773a42c38013d6411ba58192f822cf / 15。与来源记录相符。默认组合、可选指令及部署未知的区别保留在冻结计划和来源说明中，发布未声称实际环境启用。

主线程报告 64/64 全测通过且 0 skip/失败、两个隔离 build gates 通过，包括 current/no_partial/reference-only/coverage-only identities。本线程已读 ndk-publication 两项测试，独立完成上述等价发布数据与来源比对；不把主线程全测或门禁称为本线程运行，也不重复无变化 C-R05。

阶段结论：本 candidate 的 N01–N04 源码、目录与发布产物核对通过，无确定错误需打回。N04 的实际 HTTP/桌面执行记录尚待到场，N05 整批收口暂不判通过。用户已授权主线程新桌面空间；本线程不操作浏览器，未新增手机任务。

## N05 最终独立收口

已完整读取 NDK_VERIFICATION.md、test/browser/ndk.mjs 和 analysis/verify-ndk-query.mjs；两份脚本 node --check 均通过，再次只读确认 current 仍为 1.27.1.1-7e53dde6171ab67c。主线程确认产品没有新改动，因此沿用上节全部固定来源、109 片段、旧 913 详情、8 参考、发布哈希与 pending 独立核查结果，不重做旧 CONTENT facts 或 C-R05。

### 主执行记录与脚本一致性

HTTP 脚本调用实际 createKnowledgeClient 和原生 fetch，在明确 module/context/release 下核对四查询为 matched/registration_only；返回详情与本机实际发布 JSON 逐字段相同，Markdown 含固定来源 URL；NDK header/owner/container 与 callback、23 basic、8 参考、示例排除及旧发布身份都有断言。请求方法/正文和 PRIVATE_NDK_VALUE 检查在本次调用场景内成立；不将此扩大为全网络流量或所有未来请求保证。

桌面脚本在既有指定空间 p1 执行，页面 ready 后检查 949/23，通过页面控件逐项查询四组件，校验模块和仅注册状态；NDK guard、header、owner、container 文件名及临时宏中文说明均有断言。最后导航明确传入的旧发布 multi_accept 链接检查基础状态。文件名文本断言本身不代替逐字来源审核，上节实际产物核对已经提供该证据。

脚本在页面初始化前注入 fetch 夹具，四查询后核查静态 GET、无正文、无输入标记；本次注入 identifier 由 finally 删除。await task.finish({ keep: [] }) 位于 finally 之后，正常成功路径调用一次；不宣称任意失败路径都会自动 finish。主线程记录本次正常执行退出 0、删除成功、finish 一次成功，与脚本一致。

主线程报告的 TaskSpace7 同 p1 观察恢复、历史 identifier 清理 prelude 的 Script not found、其后新限时 61989 预览真实 HTTP 和永久桌面脚本退出 0，属于主线程实际执行记录。前置失败发生在主脚本执行前，未算作产品故障或成功验收；最终成功另有完整执行记录，未借失败状态放行。本线程没有重放这些浏览器/HTTP 会话，也没有操作已 finish 空间。

### 最终结论与根文档可用口径

N01 固定正式输入、N02 字面注册、N03 NDK 跨文件 include/owner/guard、N04 来源/发布及 HTTP/桌面、N05 独立审核均已完成，本批通过，无确定缺陷需要打回。独立执行证据与主线程执行记录已分别注明，不把后者冒称本线程实测。

- 当前发布：1.27.1.1-7e53dde6171ab67c；949 注册、23 basic、0 deep、8 独立参考，inventory_complete:false。
- 新增 36 项全部 registration_only，四来源为 1/29/4/2；旧 913 详情除 release_id 外及 8 参考 payload 不变，旧发布保留。
- 43 个下载项中 14 本地来源、13 Lua 库用途分类，共 27 inspected、16 pending；检查粒度不同，不据此构造知识完成率。
- NDK upstream_list 是正式条件注册；默认 OpenResty/set-misc 组合激活 NDK_UPSTREAM_LIST，实际部署未知。guard 与容器临时宏说明进入发布，examples 排除有 config 证据。
- 未补知识正文、未执行生成器、未编译/运行 OpenResty、未扩展通用宏展开或无关功能；没有手机任务，Codex 实际接入、内网部署、全量基础知识及部门深度样例仍分别待后续验收。

永久仅更新本文件；根文档口径由主线程更新。本次收口不再产生临时目录或操作源码仓库。
