# 340项默认值与继承独立审核

日期：2026-10-15。审核者仅写本文；不修改知识、测试、源代码、manifest、规划或发布，不读取私有样例，不启动额外Agent。本文为初审判据与首批审核记录，不代表340项完成。

最新状态（正式发布f43ab3d7392bdcc9）：Nginx117/207字段、Lua129/200字段全部签署，L01两项补证已关闭，本聊天负责的246身份407字段无剩余退回项。本文保留旧轮次退回/待审表作为历史，以最终签署章节为准。扩展E92由其他审核者负责，本聊天不代签。浏览器阻断已由主线程解除，最终页面全量复核及全量测试仍由主线程收口，本聊天不代签页面验收。

## 深度交互：目标与结论

目标是补齐“不配置时发生什么、父子层如何传播”的537个事实字段。状态清零、来源非空、Git片段真实，都不能单独证明事实正确。审核逐项核查注册→setter→初始化→合并/消费→有效补丁；共享函数可以共用证据，但不得共用未经核实的结论。

固定清单及边界初审通过。规划已读取，原则与当前授权一致；用户最新允许必要地显式化旧隐式 defaults/limitations/documentation，以保持原发布对象，不能改变原语义或 source_ids。这是表示方式调整，不是额外事实修改许可。规划中“旧knowledge摘要验证”按历史输入标记理解，不继续约束正在补齐的新知识文件。

## 直接执行：冻结基线与核对结果

| 项目 | 独立核对结果 |
| --- | --- |
| 固定发布 | `1.27.1.1-f9f6f0ffb7eba3d8` |
| manifest SHA-256 | `a685f1d87c9a3afc7812c8ca231cc137dba10db494b3d0f9b183d16c111cff90` |
| 基线index SHA-256 | `4276b2a74f8d071e3b85bb5c82489899b30c35cb1791bcc25f0e46b639c32b4f` |
| 原knowledge SHA-256 | `aa4cec0555f452638815b155ea0b625f626ae5cd7cac61fb80ba70531ddaeb14`；初次读取相符，后续允许知识变动 |
| 清单 | 340个唯一身份；225 defaults、312 inheritance，共537字段 |
| 原详情摘要 | 清单340份原始详情逐份校验，与manifest全部一致 |
| 清单完整性 | 重扫1041详情的两字段unverified集合，无漏项；所有清单字段原状态均为unverified |
| nginx子集 | 117身份；109 defaults、98 inheritance，共207字段 |
| 保护规模 | 1041注册/1041 basic/44 deep；发行1017/40、扩展24/4；8 refs |
| 原refs SHA-256 | `db2694e2754e459e74fac8b48e8fc2e6128db872cc12fbc8d75e59cb9ba7e32c` |
| 已读规划SHA-256 | `6a5092cbcab5ab7660fe2e47a9c16e46d241b2047d8dd80d34770344438dbc96` |

根目录不是Git仓库；不得以根目录git diff为空证明写集安全。nginx源码处于release-1.27.1，固定revision为e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928；OpenResty为v1.27.1.1，固定revision为8c37412c31621225e7aa7e825b5b50106c9c71c4。初审源码工作树未发现已跟踪文件修改；后续提交事实一律从固定Git对象复核。

原50身份及两份原样例由主线程保护与回归；审核者不接收私有文本。既有44 deep、runtime、非目标事实和8 refs按对象保真，不能仅保住数量。历史报告中的50身份不代替本轮原样例回归。

## 逐字段准入判据

1. ID按component/module/name匹配，只有manifest.fields可以改事实。非目标对象保留全部键、值、顺序及source_ids；必要追加sources不得重写旧ID。
2. defaults区分创建时零值/UNSET、合并后默认、配置派生默认、运行时条件、未安装处理器及真正不适用。不能把NULL、UNSET或内部编码直接当用户配置值。
3. inheritance分别证明父未设置/子未设置、父设置/子未设置、子显式设置，以及真实存在的if、limit_except、非命名location、平台及模块开关分支。没有merge回调仅是起点，还须排除共享指针、core handler传播和其他副作用。
4. source_ids须唯一、可解析，引用固定revision实际片段；必须覆盖中文结论中的条件，不允许仅给注册表或任意C文件。
5. not_applicable必须逐字段写明概念为何不适用，并给源码理由；“未配置”“不继承”“不安装handler”通常是可核实行为，不能直接视为不适用。任何批量替换均退回。
6. 新证据须复核有效补丁范围。已有patch_status仅保证原事实；不能据其已verified就免审新增merge/消费片段。不为通过测试改旧补丁结论；确有变化单列主线程决策。
7. 源码事实通过、发布保真通过、测试通过、桌面QA通过、原样例回归通过分别记账。当前没有运行340专项、build、服务或浏览器。

## 117 nginx高风险判据与已核源码

以下锚点相对repos/nginx，均为固定1.27.1；这是风险研究，不是117项逐字段已验收。

| 范围 | 必须审核的行为 | 源码锚点 |
| --- | --- | --- |
| rewrite/return/break/if | merge在codes为空时直接返回，没有把prev->codes复制给child；server阶段执行与location规则继承不能混淆。if内规则编入同一数组，解析后清掉临时子codes。 | src/http/modules/ngx_http_rewrite_module.c:240–268、580–643 |
| try_files | 模块merge_loc_conf为NULL；消费当前location的try_files，空时返回。不能套用“父有则继承”；继续核对core上下文选择。 | src/http/modules/ngx_http_try_files_module.c:47–59、79–108、369–384 |
| root/alias | root未设置时一并复制alias、root、root_lengths、root_values；父也为空才填html并解析前缀。alias不是独立普通字符串槽位。 | src/http/ngx_http_core_module.c:3670–3697、4486–4525 |
| types | 内建默认仅html/gif/jpg映射；不能把发行配置中的mime.types全集当内建默认。需区分空块与未创建列表。 | src/http/ngx_http_core_module.c:3660–3666、3729–3750 |
| proxy_redirect | redirect开关默认1；仅开关允许时继承数组，数组仍空且url存在才生成映射。default显式语法受proxy_pass先后及变量限制。 | src/http/modules/ngx_http_proxy_module.c:3774–3820、4236–4376 |
| 各协议hide_header/pass_header | 两组数组分别继承；内建隐藏集合先加入，hide扩充，pass移除；不能写成父子数组简单并集。各协议内建集合分别核实。 | src/http/ngx_http_upstream.c:6630–6750；proxy调用点3847 |
| fastcgi/scgi/uwsgi_param | params_source缺失才取父集合；普通参数及cache默认参数要分别追init_params。发行include文件不是内建默认。 | 对应模块fastcgi:3271–3370；scgi:1655–1745；uwsgi:1953–2045 |
| grpc_set_header | 用户列表先进入merged，缺少的内建键再补齐；空值不生成发送值。参数数组继承与内建头补齐是两件事。 | src/http/modules/ngx_http_grpc_module.c:4547–4568、4617–4675 |
| fastcgi/scgi/uwsgi_pass | 存在clcf->noname且本层无静态/动态目标时的特殊传播；不能推广成任意嵌套location继承。handler传播也须核对。 | fastcgi:3250–3265；scgi:1641–1653；uwsgi:1931–1950 |
| proxy缓冲参数 | busy_buffers_size/temp_file_write_size默认由2×max(buffer_size,bufs.size)派生；先继承显式配置槽，再计算。不得固定写8k/16k覆盖所有配置。 | src/http/modules/ngx_http_proxy_module.c:3515–3585 |
| proxy_cache_methods | 先继承未设置位掩码，再强制包含GET/HEAD；不是普通覆盖后可以移除这两方法。 | src/http/modules/ngx_http_proxy_module.c:3680–3684 |
| subrequest_output_buffer_size | 默认ngx_pagesize；不能把机器常见4k当唯一值。 | src/http/ngx_http_core_module.c:3814–3816 |
| gzip_window/gzip_hash | 合并的是MAX_WBITS/MAX_MEM_LEVEL-1；setter把用户字节大小映射到内部级别。默认说明须核对宏并反向转换，不能写15字节或8字节。 | src/http/modules/ngx_http_gzip_filter_module.c:1095–1112、1139–1188 |
| env/user/lock_file | env默认处理TZ；user受root身份、平台和编译宏影响；lock_file取编译路径并处理旧cycle。全局配置不构造HTTP式父子继承。 | src/core/nginx.c:527–558、1139–1256 |
| thread_pool | 只对已登记且未定义的default池补32线程/65536队列；不能声称所有配置都启动32线程。 | src/core/ngx_thread_pool.c:419–451、518–552 |
| mail/listen/protocol | mail server无listen报错；协议可按监听端口和已编译模块推定，仍未知则merge报错。不是无条件默认imap。 | src/mail/ngx_mail_core_module.c:185–207、292–298、352–371 |
| stream pass/return | 两模块没有merge_srv_conf；setter写core handler，须一并追core server处理。不能因同名HTTP指令类推。 | src/stream/ngx_stream_pass_module.c:41–51、282；ngx_stream_return_module.c:41–51、197–215 |
| empty_gif/flv/mp4/stub_status/perl | 命令式设置core handler，未配置不安装该handler；继承须核core merge与自身数据，而非“无标量所以不适用”。 | 后续逐项提交时读取对应setter、module ctx和core merge |
| 平台事件、aio、directio、ssl_engine、quic_bpf | 平台/编译门控、资源默认、无显式设置时的选择逻辑各自验证，不把本机Linux/macOS行为当固定发行通用值。 | 后续逐项提交时读取对应固定模块与消费者 |

补丁位置以实际构建脚本为准：openresty/util/mirror-tarballs:325–326选择patches/nginx-1.27.1-proxy_host_port_vars.patch，实际不是旧CLAUDE记载的patches/nginx/1.27.1目录。该补丁改变proxy变量标记，不直接修改上述merge；这仅是单补丁局部判断，不能据此宣布117项全部不受补丁影响。其他有效补丁、脚本替换与新增跨文件证据仍逐项审查。

## 测试边界初审：退回主线程补强

审核对象：test/defaults-340.test.mjs SHA-256 `0fab930fc37a5bcd176c27d475dc2adaeed13708f8af049316ec71491fcfda9b`；test/reliability-publication.test.mjs SHA-256 `a4bece22114ff7f323bc8d01a53f4cab1eba6d733a2981a80fa8f44af204dd2f`。仅静态审查，未运行未完专项。后续修改使这些行号或摘要失效时重读。

已有效保护：逐目标字段与当前知识完全一致；追加证据从固定Git提取完整对象；旧sources完整保留；归一化目标字段后全详情比较；索引身份顺序、coverage、旧未知边界及参考库对象比较。可靠性专项冻结f9f6并与上一发布比较1041详情，比继续约束当前knowledge原始哈希更符合本任务。显式化旧字段无需扩大stable比较白名单。

| 编号 | 级别与定位 | 边界漏洞、影响与最小修正 |
| --- | --- | --- |
| T1 | P2，defaults-340:64–72 | fact.source_ids未检查唯一性；validateDetail:164–166也只查字符串与存在性。知识与发布同时出现重复引用仍可通过；测试名“重复引用”目前只覆盖sources对象重复。对每个目标fact增加Set大小断言，并加重复fact引用负例。 |
| T2 | P2，defaults-340:77–83 | 仅保证patch_status新增ID属于added，未保证新事实使用的源码有对应补丁核对记录；不补任何patch source_ids仍能通过。为新增事实源码要求进入补丁核对覆盖集合，或独立逐字段补丁审核映射；扩展not_applicable按固定来源归属处理。不要粗暴要求所有文档ID加入补丁集合。 |
| T3 | P2，defaults-340:123–136 | 负例执行前未checkDetail(actual,entry)，且assert.throws不限定失败原因。初始对象若本来失败，所有变异可因同一个无关错误“通过”。先验证正例，再逐变异校验预期错误；增加只缺defaults/只缺inheritance、非目标、runtime与追加证据场景。 |
| T4 | 人工门禁，defaults-340:66–72 | verified/not_applicable无区别准入，只要非空文字和某C/H/patch引用；把两个事实同时改为不适用并发布可满足结构条件。测试不能判断自然语言真实性；必须保留逐字段理由与审核签署，明确禁止单靠本测试宣布清零。 |
| T5 | P2，defaults-340:25–45 | 新来源revision取当前components/config/patch audit，没有独立绑定原固定来源；若来源配置一起变化，会读取另一Git对象且仍自洽。主线程应冻结来源矩阵/相关配置摘要或比较基线已有来源revision，新跨组件来源也要登记固定值。 |
| T6 | 基线完整性边界，defaults-340:89–99及可靠性专项 | 当前340详情有摘要保护；其余701详情与8 refs靠跨发布对象比较，索引哈希不包含详情内容。若多个历史副本同时被误改，比较可能一起漂移。应保持历史写集绝对只读，或另存1041详情及refs聚合摘要；manifest自身也应比对本文固定摘要，避免范围与预期一起改变。 |

T4是人工语义审核职责，不要求引入自然语言推断器。T5/T6是固定输入的完整性问题，不表示当前已发生篡改。以上问题交主线程处理，审核者不替改测试。

## VTS两字段独立审核

范围：manifest中的两个VTS defaults，固定Git对象52fe11e44c47a49b052be89e36dfa17d81bf52a5。审核时knowledge/extensions.json SHA-256为 `d7424cdba9b4b5c919623bd4208dc33c94b1b0df04f6da759a1031d9f80aac6b`。已完整读取DEFAULTS_340_VTS_EVIDENCE.md，并直接git show读取create、merge早退、setter、NULL消费及ACCESS注册。

| 身份 | 语义与边界 | 审核结果 |
| --- | --- | --- |
| nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_filter_by_set_key | main/loc均pcalloc且不生成规则；setter按MAIN写ctx或局部列表；合并继承局部列表，消费分别判断main/loc非NULL。defaults没有把本层省略解释为禁用父规则。新增filter-main-create与filter-local-create真实，复用引用正确。 | 默认事实源码语义及引用通过；最终发布保真/测试待主线程。 |
| nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_set_by_filter | create把filter_vars设UNSET_PTR；启用路径merge成父值或NULL；消费NULL不赋值，不能承诺0；handler受ctx enable/filter门控。文本语义正确。 | 修订复核通过，VTS-R1已关闭；最终发布保真/测试待主线程。 |

VTS-R1（P2，第二项defaults.source_ids）：文字明确限定“启用模块的配置合并”，但现有set-local-create:986–1031和merge-values:1123–1150没有包含决定该条件的module.c:1063–1067（!ctx->enable直接返回）。set-handler只能证明运行入口门控，不能证明配置合并早退。请新增独立merge入口证据，不能修改旧merge-values范围或旧source_ids；将新ID加入该defaults.source_ids。此外defaults声明ACCESS，现有phase-hook:850–884已经证明注册，直接复用该ID加入defaults引用即可，不需要新增重复片段。保持原inheritance及其他字段不动。

两条现有知识可直接对比的非目标字段（含inheritance、limitations、documentation、availability子字段、phase）与f9f6相同；原evidence的file/行范围/代码逐条与固定Git及原sources匹配，新增恰为2+1条。全部defaults引用可解析。此检查不冒充最终构建后完整发布对象比较，未核实其他22条扩展原始输入是否字节未改。

## 修订复核：VTS-R1及T1—T6

日期：2026-10-15。本节覆盖前述初审问题的当前状态，保留初审原始问题及摘要用于追溯。仍仅写本文，未执行未完340专项、build或117项验收。

本次读取版本：

- test/defaults-340.test.mjs SHA-256：`c6e5052704d776f1075e7f8904fa5a48094ab4e76c2dd654f100ad3d431190f8`。
- test/fixtures/defaults-340-inputs.json SHA-256：`01c4cd1d393ee346f24e87251daaadf3847fe98d0d5f413b4912b990207010fb`。
- knowledge/extensions.json SHA-256：`00ed77269aad97ec604856706159e985ac76e8b0fffb6082ccc4c8d9ec052f28`。

| 问题 | 当前结论 | 本次证据及边界 |
| --- | --- | --- |
| VTS-R1 | 已关闭 | 直接从固定Git对象52fe11e44c47a49b052be89e36dfa17d81bf52a5重读set-merge-enabled的module.c:1063–1067，确为ctx禁用时合并早退；defaults现已引用该ID及既有phase-hook:850–884，后者包含ACCESS注册。两项defaults文本未改，旧evidence范围及代码未改，已检查的非目标字段与f9f6一致。两项默认事实源码/引用审核均通过，未代替最终发布验收。 |
| T1 | 已关闭（测试代码审查） | 每个目标fact均新增Set大小断言，负例新增重复defaults.source_ids。负例能否实际全通过仍受T3错误类型问题影响，不预报测试通过。 |
| T2 | nginx新增C/H约束已满足；全340人工补丁审核继续保留 | 对nginx身份的新增nginx C/H来源逐一要求进入patch_status.source_ids；旧补丁引用及其他字段保真仍在。此约束不覆盖非nginx身份引用nginx代码、第三方发行补丁或事实复用旧源码的新解释，后续相应批次仍须人工逐字段核对，不能将引用集合齐全当作补丁语义通过。 |
| T3 | 未关闭，退回修正错误类型匹配 | 正例先校验已补，但所有负例统一指定assert.AssertionError与实际validateDetail异常类型不一致，见下方复现。清单外详情也已先校验正例；新增checkIndex变异循环尚无循环前checkIndex(index)，虽有独立全量正例，建议本负例就地补上，确保单独运行时也有有效正例。 |
| T4 | 持续人工审核要求，非自动修复缺陷 | 接受保留逐字段审核、不自动infer；任何not_applicable仍按本记录准入判据审查，不计作事实审核完成。 |
| T5 | 已关闭（冻结输入核验） | 独立重算project.config、components、NGINX_PATCH_AUDIT、REDIS_PATCH_AUDIT四份字节哈希，全部匹配固定夹具；完整专项执行时逐一验证。固定夹具属于受保护验收输入，不能随实施更新以接受漂移。 |
| T6 | 已关闭（冻结基线核验） | manifest已绑定初审固定SHA；按冻结索引顺序拼接1041原始详情字节再追加refs字节，独立重算得到46fc901c902f8aca3744867e602d584926b0ffa3cb9c559543cc14f10b2f0fdb，与夹具相符。固定索引本身保有原摘要约束。 |

### T3修订后发现：正确拒绝会被错误类型断言误判

本次仅对冻结f9f6的首个manifest身份复制对象，在内存中调用现有validateDetail，没有运行defaults-340测试文件，没有修改任何输入文件。未变异对象先通过validateDetail。以下变异的实测结果均为普通Error，code为invalid_detail：

| 变异 | 实际错误消息 |
| --- | --- |
| 重复sources对象 | 源码引用格式或范围不一致 |
| patch_status引用不存在的extra | 知识证据引用缺失 |
| sources[0].url改为不匹配源码地址 | 源码引用格式或范围不一致 |
| sources[0].start_line设为0 | 源码引用格式或范围不一致 |

checkDetail首先调用validateDetail，这些错误发生在后续assert比较之前。因此当前assert.throws(..., assert.AssertionError)会拒绝这些正确的校验失败；即使340项实施完成，该负例组仍会失败。

最小修正：给各变异配对明确预期；validateDetail负责拒绝的变异匹配code=invalid_detail及相应消息，后续对象保真断言负责拒绝的变异匹配AssertionError及相关断言标识。保留正例先校验，不恢复为无条件“抛出任意异常即通过”。本问题交主线程修正，审核者不改测试。

117项仍保持待提交逐字段审核；本轮不把修改中的知识或测试状态视为任何nginx事实通过。

## 再次复核：T3已关闭；Redis与Memc后续判据

日期：2026-10-15。仅追加审核记录；以下扩展研究不是提交验收，不把任何待补事实标为通过。范围为其余92项扩展中的两个bind继承字段和memc_pass的defaults/inheritance，共3身份4字段，不扩大manifest。

### T3关闭依据

重新读取test/defaults-340.test.mjs，SHA-256为`d2b958e96740e5186456f424f6d7f43cbf76e23947b0de9b2cc3b0554f28cf9a`。checkDetail现用assert.doesNotThrow包装validateDetail，附完整ID及“发布结构无效”说明；目标负例与非目标详情负例仍先checkDetail(actual, entry)。本轮在内存中使用冻结f9f6的合法详情，正例通过，然后分别重复sources、追加不存在的patch引用、改坏URL、将起始行设0；四种拒绝均被包装成AssertionError，并通过外层assert.throws类型判断。

因此撤回上一节对当前实现“统一AssertionError必然误判失败”的结论，T3已关闭。这里验的是修复机制，未运行尚未完成的340专项，不预报全量测试通过。上轮对checkIndex变异循环就地补正例的建议仍为可选增强，不作为T3关闭阻断；该索引已有独立正例检查。

### 固定研究输入

入口为analysis/DEFAULTS_340_LUA_EXTENSION_RESEARCH.md；实际结论另行直接读取Git对象，不把入口文档当证明。固定来源如下：

| 来源 | revision |
| --- | --- |
| redis-nginx-module | 411fef36e130129b670fa7f2672bcad6ab2cbdd3 |
| redis2-nginx-module | c989c829a2877132cb100f901e320921250e068d |
| memc-nginx-module | b889a6fc3e18b784b454e1bc74e5d0b3513a07ce |
| nginx | e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928 |
| openresty | 8c37412c31621225e7aa7e825b5b50106c9c71c4 |

### Redis/Redis2 bind：不能跳过初始化与setter不匹配

目标分别为`redis-nginx-module--ngx_http_redis_module--redis_bind/inheritance`、`redis2-nginx-module--ngx_http_redis2_module--redis2_bind/inheritance`。defaults已非本轮缺失字段，不顺手改写。

1. 注册确实指向公共ngx_http_upstream_bind_set_slot，offset为upstream.local：Redis单文件ngx_http_redis_module.c:73–80；Redis2的src/ngx_http_redis2_module.c:70–75。Redis注册受nginx_version>=8022约束，在固定1.27.1成立；两者均为TAKE1，不能从公共setter支持项推导本指令允许额外参数。
2. 创建函数pcalloc整对象，但没有把upstream.local改成NGX_CONF_UNSET_PTR：Redis:777–832、Redis2:148–191。对固定Git源码搜索upstream.local，两组件均只命中注册offset；完整merge也没有local复制：Redis:836–894、Redis2:195–246。
3. 固定Nginx的src/http/ngx_http_upstream.c:6444–6448先判断`*plocal != NGX_CONF_UNSET_PTR`，满足就返回“is duplicate”；off处理在6452–6454，位于此检查之后。因此NULL初值下第一次显式bind也会被这个分支拒绝，off不能绕过。不能只看setter后半段就写“可正常配置地址/关闭父级绑定”。这是固定源码组合的静态结论，未通过运行实例验证。
4. 缺省local为NULL时，公共消费函数同文件6533–6542令peer.local=NULL；这是未设置显式本地绑定对象，不是绑定某个固定IP。缺省消费与首次显式配置拒绝必须分别表达。
5. Redis有效三补丁已从固定OpenResty Git对象完整读取：variables_in_redis_pass、default_port_fix、remove_content_encoding。其改动未增加local初始化/合并，也未改bind注册。固定util/mirror-tarballs:692–715证明实际选择；不能拿变量pass补丁当作bind修复。Redis2取包处理在同脚本732–735，所读该段没有组件补丁步骤。
6. 对现有NGINX_PATCH_AUDIT列出的34个固定补丁逐份检查相关文件及hunk定位；触及ngx_http_upstream.c的是balancer_status_code、upstream_pipelining、upstream_timeout_fields，未定位到bind setter或set_local函数的修改。本轮未做补丁回放，后续最终证据仍按固定审计与具体补丁片段闭合，不声称整条网络调用链均不受影响。

后续退回条件：只写“本层未设继承父级bind”、把“off清除父级绑定”当此固定组合可达行为、把公共setter当合并实现、或直接标not_applicable掩盖上述不匹配。实施应在目标继承事实中说明固定版本没有local合并及显式配置受初始化问题限制；如发现与已有非目标默认/限制事实冲突，先报主线程，不修改被保护字段或上游源码。

### Memc pass：静态槽、变量槽、handler与请求状态分开

目标为`memc-nginx-module--ngx_http_memc_module--memc_pass`的defaults/inheritance。已读固定src/ngx_http_memc_module.c:163–320和src/ngx_http_memc_handler.c:150–214。

| 分支 | 已观察到的源码事实 | 后续审核要求 |
| --- | --- | --- |
| 注册/未配置 | module.c:57–60仅location/location-if；create:163–206为零初始化；setter:275–284安装core handler并设置module_used | “无默认目标”须与“本层未写但存在父配置”区分；不能说任何省略情况都保证不运行。 |
| 静态目标 | setter:308–318清complex_target并写upstream.upstream；merge:243–245在子静态指针为空时复制父静态指针 | 可以说明静态配置指针复制，但不能据此说子location自动启用memc内容处理器。 |
| 变量目标 | setter:288–305只编译complex_target并提前返回；整个merge:211–254没有复制complex_target | 父变量目标不能照搬静态目标继承结论；子显式变量配置时静态指针仍可能从父级复制，不能用单槽覆盖模板。 |
| 运行时求值 | handler:180–205仅在complex_target非空时求值，空结果返回500，成功查找后写mlcf->upstream.upstream；213把当前配置交给upstream | 运行时回写配置字段不等于合并继承；必须保留空值/查找失败分支，不推导固定默认服务器。 |
| core handler | 固定Nginx core merge:3670至函数结束没有handler父子复制；update_location_config:1381–1383只有当前clcf->handler非空才设置r->content_handler | 参数传播与handler执行是不同问题，普通嵌套location不能只用静态指针存在证明自动执行。 |
| location内if | 固定Nginx src/http/ngx_http_script.c:1525–1544在if成立时换request.loc_conf并调用update_location_config；后者handler为空时不清除已有r->content_handler | 可能保留先前content_handler却改读子配置；父变量目标未复制时尤其不能承诺安全继承。实际最终错误/响应须继续追完整请求路径，不在本轮虚构崩溃或具体响应结果。 |

固定OpenResty取包段util/mirror-tarballs:649–654没有Memc组件补丁步骤。34补丁中core模块由no_error_pages改动create/merge的error_pages处理；已读完整补丁，没有新增core handler继承。这里仅限定所读字段，不代表Memc所有行为或现场兼容性已核实。

后续每字段至少交付注册、完整create/merge、静态/变量setter、handler消费、core及if切换的最小充分来源。不得把“不自动继承复杂目标”缩写成“整个指令不继承”，也不得把静态指针继承缩写成“memc_pass完整继承”。上述3身份4字段均维持待提交审核。

## 组A首批46身份、86字段完整源码审核

日期：2026-10-15。逐字段审核group=A的46身份（44 defaults、42 inheritance）；83字段通过，3个defaults退回；43身份全部目标字段通过，3身份部分通过。两VTS已通过状态不变。其他组不计入本节结果。29个not_applicable均为main/events继承字段，已核注册与配置创建路径，不是清零捷径。

### 审核输入与方法

组A的items按原数组顺序JSON.stringify后SHA-256为`f25f0b569ae65c562167ef196f17212cb307cfea697ff0fe2e140f74f3c59e14`；审核末次重读对象不变。检查时knowledge/directives.json摘要为`0d300e94074bf0eb903c7ed89d05f08068e99f00b0468bf395cf738922fc3ca6`，结构化证据全文件摘要为`9b71eb0610485048b37a61b8aa20d85a269397a271e6677ffb3555161d71151a`。全文件由实施继续添加其他组，不能按其新计数扩大本轮已审范围。

全部46注册片段与固定Git原文一致，86事实与正式知识一致，225次事实引用解析/范围检查无遗漏，164条新增nginx证据存在且进入patch_status。逐一读取setter/create/init/merge/消费片段；共享宏另读ngx_conf_file.h:180–238，HTTP层级另读ngx_http.c:575–665。“无继承”还核完整合并函数，不凭局部没有赋值就下结论。

### 按ID退回

| 编号 | 完整身份/字段 | 问题与固定源码 | 最小修正 |
| --- | --- | --- | --- |
| A01，P2 | nginx--ngx_epoll_module--worker_aio_requests / defaults | “仅在支持文件AIO的epoll构建分支注册此项”错误。src/event/modules/ngx_epoll_module.c:159–176命令表无FILE_AIO门控，168–173直接注册；create/init:1026–1051初始化32。文件AIO条件限制使用，不限制该注册。 | 保留默认32，区分epoll注册与AIO使用条件，补充使用门控来源；inheritance不改。 |
| A02，P2 | nginx--ngx_core_module--lock_file / defaults | Windows语义正确，但d340-lock-init:1215–1261只含结尾#endif，缺控制该段的nginx.c:1186之#if !(NGX_WIN32)；另一个引用auto/options:620–625也不能证明平台条件。 | 新增平台门控锚点，例如1186–1216，并加入defaults及必要补丁引用。不能改旧来源范围。 |
| A03，P2 | nginx--ngx_core_module--timer_resolution / defaults | 0ms与轮询分支正确；“不启用固定间隔时间更新定时器”需要初始化证据。d340-use:200–217仅选timer/flags；已有implementation-1:690–751包含700行非零条件与714–723定时器配置，却未被defaults引用。 | defaults复用implementation-1，并核ccf→ngx_timer_resolution绑定；无需改旧证据。 |

A02/A03属于引用未闭合，不否定已读源码语义；标准与已关闭的VTS-R1一致。三项修正复核前不能宣布组A全部通过。

### 补丁复核边界

逐份检查固定34补丁的相关修改位置；164段新增证据中只有user/d340-user-use及error_page/d340-setter原文受改动，分别与privileged_agent_process和no_error_pages实际补丁闭合，既有verified_affected和旧note保留。timer_resolution仍保留delayed_posted_events例外，未扩张成每轮固定等待。

审核者未运行会写隔离目录的补丁脚本。只读内存重建有46/47文件摘要对齐已有审计，ngx_event_openssl.c完整摘要未对齐，故不宣称独立完成47文件回放。该文件ssl_engine的create/setter在5990–6054；另核有效SSL补丁均修改握手/early-data区域，没有修改所列ENGINE片段，因此该字段仅按局部源码和补丁边界通过。完整回放由主线程按既有工具验收，不把辅助复现限制当作实施错误。

### 逐字段结论

“—”为非目标字段；通过仅指源码、引用与局部补丁事实，不代替最终构建保真、测试或页面验收。

| 完整身份 | defaults | inheritance | 主要新证据定位 |
| --- | --- | --- | --- |
| nginx--ngx_core_module--daemon | 通过 | 通过 | src/core/nginx.c:1094–1115；src/core/nginx.c:1143–1144 |
| nginx--ngx_core_module--master_process | 通过 | 通过 | src/core/nginx.c:1094–1115；src/core/nginx.c:1143–1144 |
| nginx--ngx_core_module--timer_resolution | 退回A03 | 通过 | src/core/nginx.c:1116–1117；src/core/nginx.c:1145–1146；src/event/ngx_event.c:200–217 |
| nginx--ngx_core_module--lock_file | 退回A02 | 通过 | src/core/nginx.c:1094–1112；src/core/nginx.c:1215–1261 |
| nginx--ngx_core_module--debug_points | 通过 | 通过 | src/core/nginx.c:1119–1123；src/core/nginx.c:1148–1149；src/os/unix/ngx_process.c:612–631 |
| nginx--ngx_core_module--user | 通过 | 通过 | src/core/nginx.c:1125–1135；src/core/nginx.c:1186–1212；auto/unix:1–29；src/os/unix/ngx_process_cycle.c:799–836 |
| nginx--ngx_core_module--worker_priority | 通过 | 通过 | src/core/nginx.c:1094–1112；src/os/unix/ngx_process_cycle.c:768–775 |
| nginx--ngx_core_module--worker_rlimit_core | 通过 | 通过 | src/core/nginx.c:1119–1123；src/os/unix/ngx_process_cycle.c:788–797 |
| nginx--ngx_core_module--worker_shutdown_timeout | 通过 | 通过 | src/core/nginx.c:1116–1117；src/core/nginx.c:1145–1146；src/core/ngx_cycle.c:1423–1437 |
| nginx--ngx_core_module--working_directory | 通过 | 通过 | src/core/nginx.c:1094–1112；src/os/unix/ngx_process_cycle.c:872–880 |
| nginx--ngx_core_module--env | 通过 | 通过 | src/core/nginx.c:1128–1135；src/core/nginx.c:520–652 |
| nginx--ngx_core_module--load_module | 通过 | 通过 |  |
| nginx--ngx_regex_module--pcre_jit | 通过 | 通过 | src/core/ngx_regex.c:719–747；src/core/ngx_regex.c:751–758 |
| nginx--ngx_thread_pool_module--thread_pool | 通过 | 通过 | src/core/ngx_thread_pool.c:398–415；src/core/ngx_thread_pool.c:419–452 |
| nginx--ngx_devpoll_module--devpoll_changes | 通过 | 通过 | src/event/modules/ngx_devpoll_module.c:536–549；src/event/modules/ngx_devpoll_module.c:553–561 |
| nginx--ngx_devpoll_module--devpoll_events | 通过 | 通过 | src/event/modules/ngx_devpoll_module.c:536–549；src/event/modules/ngx_devpoll_module.c:553–561 |
| nginx--ngx_epoll_module--epoll_events | 通过 | 通过 | src/event/modules/ngx_epoll_module.c:1026–1039；src/event/modules/ngx_epoll_module.c:1043–1051 |
| nginx--ngx_epoll_module--worker_aio_requests | 退回A01 | 通过 | src/event/modules/ngx_epoll_module.c:1026–1039；src/event/modules/ngx_epoll_module.c:1043–1051 |
| nginx--ngx_eventport_module--eventport_events | 通过 | 通过 | src/event/modules/ngx_eventport_module.c:627–639；src/event/modules/ngx_eventport_module.c:643–650 |
| nginx--ngx_iocp_module--iocp_threads | 通过 | 通过 | src/event/modules/ngx_iocp_module.c:352–366；src/event/modules/ngx_iocp_module.c:370–379；src/event/modules/ngx_iocp_module.c:109–124 |
| nginx--ngx_iocp_module--post_acceptex | 通过 | 通过 | src/event/modules/ngx_iocp_module.c:352–366；src/event/modules/ngx_iocp_module.c:370–379 |
| nginx--ngx_iocp_module--acceptex_read | 通过 | 通过 | src/event/modules/ngx_iocp_module.c:352–366；src/event/modules/ngx_iocp_module.c:370–379 |
| nginx--ngx_kqueue_module--kqueue_changes | 通过 | 通过 | src/event/modules/ngx_kqueue_module.c:697–710；src/event/modules/ngx_kqueue_module.c:714–722 |
| nginx--ngx_kqueue_module--kqueue_events | 通过 | 通过 | src/event/modules/ngx_kqueue_module.c:697–710；src/event/modules/ngx_kqueue_module.c:714–722 |
| nginx--ngx_event_core_module--use | 通过 | 通过 | src/event/ngx_event.c:1258–1285；src/event/ngx_event.c:1289–1373 |
| nginx--ngx_event_core_module--debug_connection | 通过 | 通过 | src/event/ngx_event.c:1258–1285；src/event/ngx_event_accept.c:519–572 |
| nginx--ngx_openssl_module--ssl_engine | 通过 | 通过 | src/event/ngx_event_openssl.c:5990–6006 |
| nginx--ngx_quic_bpf_module--quic_bpf | 通过 | 通过 | src/event/quic/ngx_event_quic_bpf.c:106–121；src/event/quic/ngx_event_quic_bpf.c:125–170 |
| nginx--ngx_google_perftools_module--google_perftools_profiles | 通过 | 通过 | src/misc/ngx_google_perftools_module.c:67–83；src/misc/ngx_google_perftools_module.c:87–97 |
| nginx--ngx_http_core_module--types | 通过 | — | src/http/ngx_http_core_module.c:3548–3565；src/http/ngx_http_core_module.c:3656–3665；src/http/ngx_http_core_module.c:3729–3752 |
| nginx--ngx_http_core_module--root | — | 通过 | src/http/ngx_http_core_module.c:3548–3565；src/http/ngx_http_core_module.c:3678–3692；src/http/ngx_http.c:575–665 |
| nginx--ngx_http_core_module--alias | 通过 | 通过 | src/http/ngx_http_core_module.c:3548–3565；src/http/ngx_http_core_module.c:3678–3692 |
| nginx--ngx_http_core_module--post_action | 通过 | — | src/http/ngx_http_core_module.c:3548–3565；src/http/ngx_http_core_module.c:3694–3696；src/http/ngx_http_request.c:3629–3637 |
| nginx--ngx_http_core_module--client_body_temp_path | 通过 | — | src/http/ngx_http_core_module.c:3876–3882；src/core/ngx_file.c:421–456 |
| nginx--ngx_http_core_module--server_name | 通过 | 通过 | src/http/ngx_http_core_module.c:3437–3457；src/http/ngx_http_core_module.c:3512–3544 |
| nginx--ngx_http_core_module--limit_except | 通过 | 通过 | src/http/ngx_http_core_module.c:3548–3565；src/http/ngx_http_core_module.c:1305–1318；src/http/ngx_http.c:575–665 |
| nginx--ngx_http_core_module--subrequest_output_buffer_size | 通过 | 通过 | src/http/ngx_http_core_module.c:3587–3589；src/http/ngx_http_core_module.c:3814–3816 |
| nginx--ngx_http_core_module--aio | 通过 | 通过 | src/http/ngx_http_core_module.c:3590–3595；src/http/ngx_http_core_module.c:3817–3823 |
| nginx--ngx_http_core_module--aio_write | 通过 | 通过 | src/http/ngx_http_core_module.c:3590–3591；src/http/ngx_http_core_module.c:3817–3818 |
| nginx--ngx_http_core_module--read_ahead | 通过 | 通过 | src/http/ngx_http_core_module.c:3596–3596；src/http/ngx_http_core_module.c:3824–3824 |
| nginx--ngx_http_core_module--directio | 通过 | 通过 | src/http/ngx_http_core_module.c:3597–3597；src/http/ngx_http_core_module.c:3825–3826 |
| nginx--ngx_http_core_module--directio_alignment | 通过 | 通过 | src/http/ngx_http_core_module.c:3598–3598；src/http/ngx_http_core_module.c:3827–3828 |
| nginx--ngx_http_core_module--error_page | 通过 | — | src/http/ngx_http_core_module.c:3548–3555；src/http/ngx_http_special_response.c:454–469 |
| nginx--ngx_http_core_module--gzip_disable | 通过 | 通过 | src/http/ngx_http_core_module.c:3635–3645；src/http/ngx_http_core_module.c:3918–3944 |
| nginx--ngx_http_core_module--disable_symlinks | 通过 | 通过 | src/http/ngx_http_core_module.c:3647–3650；src/http/ngx_http_core_module.c:3946–3951 |
| nginx--ngx_stream_core_module--server_name | — | 通过 | src/stream/ngx_stream_core_module.c:679–711；src/stream/ngx_stream_core_module.c:763–795 |

本批不读取私有样例、不运行未完成专项、不修改知识/测试/源码。主线程告知当前9cc55d81886ffba7原样例回归24/24、258/258，错误0、关注0、外部2/1且与f9f6身份一致；此为主线程结果，审核者未独立读取私有文本。浏览器因失败页策略阻断尚待重开，不能以源码审核替代。

## A修复关闭与B/D完整语义初审（发布49b7ae8d639a1fa0）

A01/A02/A03均关闭。已重新读取固定Git原文、当前curated与发布详情：worker_aio_requests区分无AIO门控注册和344–346的使用门控，并复用255–291的io_setup；lock_file补1186–1216非Windows完整条件；timer_resolution复用690–751定时器条件并新增510–512配置绑定。A现为46身份、86目标字段全部通过。上文首轮退回表保留历史，不代表当前未关闭。

B51的89字段：82通过，7因引用覆盖不足退回。D20的32字段：29通过，3因引用覆盖不足退回。当前Nginx117共207字段完成初审，197通过、10待补引用复核；不是117全部通过。未发现上述10字段的对应文字与已核源码实质相反，但发布引用尚不能独立支撑全部断言。

已读B各模块setter/create/merge及消费，重点核查四类缓存/store互斥、动态值请求时求值、noname目标传播、空参数/头列表、busy/temp显式槽与派生值区别。D逐项读rewrite代码数组、独立location/core handler、try_files空数组、gzip容量映射、image_filter动态值优先、Perl数据与handler分离、mail端口推断和stream无merge配置。不能因共享setter就推定各模块初始化/合并相同。

### 退回主线程：最小补证范围

以下均为P2引用闭合问题。保留全部旧来源，不调整非目标事实；新增nginx C/H证据仍需加入patch_status引用并核补丁。

| 编号 | 身份/字段 | 已核事实与所缺引用 |
| --- | --- | --- |
| B01 | ngx_http_proxy_module/proxy_store、ngx_http_fastcgi_module/fastcgi_store、ngx_http_scgi_module/scgi_store、ngx_http_uwsgi_module/uwsgi_store 的 inheritance | 当前只绑定store setter和merge，能证cache先设置再store被拒绝，不能证store先设置再cache也拒绝。请分别补同文件cache setter：proxy4775–4830、fastcgi3820–3875、scgi2019–2074、uwsgi2343–2398，并引用到各store的inheritance。 |
| B02 | nginx--ngx_http_proxy_module--proxy_set_body/defaults | 1321–1346仅计算长度；“保持原请求体处理路径，受pass_request_body控制”还需发送分支。可复用旧implementation-1（1547–1600），其中1573起含body_values为空且pass_request_body条件。 |
| B03 | nginx--ngx_http_proxy_module--proxy_max_temp_file_size/defaults | merge3588–3609只证明默认及非零下限，不能证明0不限制cache/store。请绑定已有event_pipe.c270–282、781–817，以及upstream将cacheable或store传为p->cacheable的赋值分支，补齐配置到消费。 |
| B04 | nginx--ngx_http_memcached_module--memcached_pass/inheritance | 当前core1252–1262只消费r->content_handler，不能证明core不继承handler。可复用D类做法，新增core location创建、完整merge无handler、950–979选location清空request handler、1381–1383再选择handler的依据；模块merge的目标继承本身正确。 |
| D01 | nginx--ngx_http_rewrite_module--break/defaults及inheritance | setter仅把ngx_http_script_break_code写入数组，现引用未含该执行函数；“终止当前组/if内可终止外组”须绑定script.c1509–1522的exit赋值。共享数组及不继承codes已核正确。 |
| D02 | nginx--ngx_http_rewrite_module--if/inheritance | setter532–644证明loc_conf赋值和共享数组，不能单独证明条件成立时切换配置。补script.c1525–1552（ngx_http_script_if_code）实际条件、loc_conf切换及update_location_config。 |

### 逐身份字段结果

| 身份 | defaults | inheritance |
| --- | --- | --- |
| nginx--ngx_http_rewrite_module--rewrite | 通过 | 通过 |
| nginx--ngx_http_rewrite_module--return | 通过 | 通过 |
| nginx--ngx_http_rewrite_module--break | 退回D01 | 退回D01 |
| nginx--ngx_http_rewrite_module--if | 通过 | 退回D02 |
| nginx--ngx_http_stub_status_module--stub_status | 通过 | 通过 |
| nginx--ngx_http_proxy_module--proxy_redirect | 通过 | 通过 |
| nginx--ngx_http_proxy_module--proxy_store | 通过 | 退回B01 |
| nginx--ngx_http_proxy_module--proxy_set_body | 退回B02 | 通过 |
| nginx--ngx_http_proxy_module--proxy_method | 通过 | 通过 |
| nginx--ngx_http_proxy_module--proxy_busy_buffers_size | 通过 | 通过 |
| nginx--ngx_http_proxy_module--proxy_cache | 通过 | 通过 |
| nginx--ngx_http_proxy_module--proxy_cache_key | 非本轮目标 | 通过 |
| nginx--ngx_http_proxy_module--proxy_cache_path | 通过 | 非本轮目标 |
| nginx--ngx_http_proxy_module--proxy_cache_methods | 通过 | 通过 |
| nginx--ngx_http_proxy_module--proxy_temp_path | 通过 | 通过 |
| nginx--ngx_http_proxy_module--proxy_max_temp_file_size | 退回B03 | 通过 |
| nginx--ngx_http_proxy_module--proxy_temp_file_write_size | 通过 | 通过 |
| nginx--ngx_http_proxy_module--proxy_pass_header | 通过 | 通过 |
| nginx--ngx_http_proxy_module--proxy_hide_header | 通过 | 通过 |
| nginx--ngx_http_proxy_module--proxy_ignore_headers | 通过 | 通过 |
| nginx--ngx_http_empty_gif_module--empty_gif | 通过 | 通过 |
| nginx--ngx_http_flv_module--flv | 通过 | 通过 |
| nginx--ngx_http_try_files_module--try_files | 非本轮目标 | 通过 |
| nginx--ngx_http_mp4_module--mp4 | 通过 | 通过 |
| nginx--ngx_http_gzip_filter_module--gzip_window | 通过 | 非本轮目标 |
| nginx--ngx_http_gzip_filter_module--gzip_hash | 通过 | 非本轮目标 |
| nginx--ngx_http_fastcgi_module--fastcgi_pass | 通过 | 通过 |
| nginx--ngx_http_fastcgi_module--fastcgi_split_path_info | 通过 | 非本轮目标 |
| nginx--ngx_http_fastcgi_module--fastcgi_store | 通过 | 退回B01 |
| nginx--ngx_http_fastcgi_module--fastcgi_limit_rate | 通过 | 通过 |
| nginx--ngx_http_fastcgi_module--fastcgi_cache | 通过 | 通过 |
| nginx--ngx_http_fastcgi_module--fastcgi_cache_key | 通过 | 非本轮目标 |
| nginx--ngx_http_fastcgi_module--fastcgi_cache_path | 通过 | 非本轮目标 |
| nginx--ngx_http_fastcgi_module--fastcgi_temp_path | 通过 | 通过 |
| nginx--ngx_http_fastcgi_module--fastcgi_param | 通过 | 非本轮目标 |
| nginx--ngx_http_fastcgi_module--fastcgi_pass_header | 通过 | 通过 |
| nginx--ngx_http_fastcgi_module--fastcgi_hide_header | 通过 | 通过 |
| nginx--ngx_http_scgi_module--scgi_pass | 通过 | 通过 |
| nginx--ngx_http_scgi_module--scgi_store | 通过 | 退回B01 |
| nginx--ngx_http_scgi_module--scgi_limit_rate | 通过 | 通过 |
| nginx--ngx_http_scgi_module--scgi_cache | 通过 | 通过 |
| nginx--ngx_http_scgi_module--scgi_cache_key | 通过 | 非本轮目标 |
| nginx--ngx_http_scgi_module--scgi_cache_path | 通过 | 非本轮目标 |
| nginx--ngx_http_scgi_module--scgi_temp_path | 通过 | 通过 |
| nginx--ngx_http_scgi_module--scgi_param | 通过 | 非本轮目标 |
| nginx--ngx_http_scgi_module--scgi_pass_header | 通过 | 通过 |
| nginx--ngx_http_scgi_module--scgi_hide_header | 通过 | 通过 |
| nginx--ngx_http_image_filter_module--image_filter_sharpen | 非本轮目标 | 通过 |
| nginx--ngx_http_perl_module--perl_modules | 通过 | 非本轮目标 |
| nginx--ngx_http_perl_module--perl | 非本轮目标 | 通过 |
| nginx--ngx_stream_return_module--return | 非本轮目标 | 通过 |
| nginx--ngx_stream_pass_module--pass | 非本轮目标 | 通过 |
| nginx--ngx_http_uwsgi_module--uwsgi_pass | 通过 | 通过 |
| nginx--ngx_http_uwsgi_module--uwsgi_store | 通过 | 退回B01 |
| nginx--ngx_http_uwsgi_module--uwsgi_limit_rate | 通过 | 通过 |
| nginx--ngx_http_uwsgi_module--uwsgi_cache | 通过 | 通过 |
| nginx--ngx_http_uwsgi_module--uwsgi_cache_key | 通过 | 非本轮目标 |
| nginx--ngx_http_uwsgi_module--uwsgi_cache_path | 通过 | 非本轮目标 |
| nginx--ngx_http_uwsgi_module--uwsgi_temp_path | 通过 | 通过 |
| nginx--ngx_http_uwsgi_module--uwsgi_param | 通过 | 非本轮目标 |
| nginx--ngx_http_uwsgi_module--uwsgi_pass_header | 通过 | 通过 |
| nginx--ngx_http_uwsgi_module--uwsgi_hide_header | 通过 | 通过 |
| nginx--ngx_http_grpc_module--grpc_pass | 通过 | 通过 |
| nginx--ngx_http_grpc_module--grpc_set_header | 通过 | 非本轮目标 |
| nginx--ngx_http_grpc_module--grpc_pass_header | 通过 | 通过 |
| nginx--ngx_http_grpc_module--grpc_hide_header | 通过 | 通过 |
| nginx--ngx_http_memcached_module--memcached_pass | 通过 | 退回B04 |
| nginx--ngx_mail_module--mail | 通过 | 通过 |
| nginx--ngx_mail_core_module--server | 通过 | 通过 |
| nginx--ngx_mail_core_module--listen | 通过 | 通过 |
| nginx--ngx_mail_core_module--protocol | 通过 | 通过 |

### 固定来源、发布对应与补丁边界

独立读取117注册及515个nginx证据片段，与固定e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928原文、当前知识及49b7ae8d639a1fa0发布对象核对；207字段与事实表和发布一致，新C/H引用均进入patch_status。这些一致性检查不替代上面的语义与引用缺口判断。

当前按JSON.stringify(group items)摘要：A为5dd54d010b8c7bc10b0fc17adf51ac64f0a698ea7eb13ee9758c7b2df918eb6a；B为c1be51850f4176d0c4e0d5e0912e702a8e04cc1c849c661b3978d15597235aff；D为f0388e575e0b107942c80a20d9764767a08c5d502ee9c63dbff128f8c4b6d456。

已读取主线程真实隔离回放产物analysis/defaults-340-patch-replay.json，记录34补丁、47最终文件；主线程报告既有verify脚本全部匹配且临时副本清理。该实际回放结果属于主线程验证，不冒称审核者重新执行。独立阅读B相关proxy_host_port_vars、upstream_pipelining、upstream_timeout_fields、balancer_status_code补丁，未改变本轮配置默认/合并结论。D涉及的唯一有效文件补丁是此前已读的no_error_pages，其影响不涉及handler继承；D其他目标模块无实际补丁修改。

主线程报告49b7ae8d639a1fa0完整测试613/613与原私有样例24/24、258/258通过；仅记录，不转为独立语义验收。浏览器仍真实阻断，页面不签通过。Lua129随后逐项审核，当前不计通过。

## Nginx返修最终复核：85a5b1f135fbcdcf

B01–B04、D01–D02全部关闭，Nginx117身份、207目标字段源码语义及引用审核通过。上文退回表为49b7初审历史，不再代表当前状态。

四个store各自补cache setter，已覆盖两种配置顺序的互斥拒绝；proxy_set_body复用implementation-1；proxy_max_temp_file_size补upstream.c3242–3272的p->cacheable赋值，并绑定event_pipe的cacheable绕过上限分支；Memcached补独立location创建、core完整merge的未修改部分、清空/安装request handler；break/if均复用script执行函数来源。逐项核过固定原文及新增引用，补丁未改变这些分支。

独立比较85a5发布与49b7发布的全部117项：恰好9身份10目标字段的source_ids追加；正文与status不变，旧来源对象逐项不变，非目标详情字段不变；当前facts、curated和发布事实一致。新增nginx证据均在patch_status引用内。此轮未重复执行主线程359项测试，也不将其当语义依据。Lua200字段仍在独立审核，页面仍不签通过。

## Lua增量审核与先行退回

已逐组读固定HTTP Lua ea09d92adf835e30cab8d79343c7b8266e888128、stream Lua 69f0cd762112a6e0cddb07f2b5192e9a65034a93 的main参数/路径/共享字典/捕获日志、生命周期脚本、HTTP NDK动作及srv/loc阶段脚本、两域独立upstream配置、cosocket参数、TLS回调及出站SSL数组/命令。上述组的配置语义未发现与已读源码相反的表述；正在完成全部200字段的引用对应、固定对象及发布保真收口，尚不以此段代替最终逐字段签署。

### L01：两域lua_ssl_crl继承字段缺空路径消费证据（P2，待修复）

- `lua-nginx-module--ngx_http_lua_module--lua_ssl_crl / inheritance`
- `stream-lua-nginx-module--ngx_stream_lua_module--lua_ssl_crl / inheritance`

当前文字末句均为“空值交由 ngx_ssl_crl 的空路径分支处理”。已有来源证明字符串data==NULL时继承、显式空值阻断父值，以及set_ssl调用ngx_ssl_crl，但两个fact.source_ids均未包含ngx_ssl_crl本身的空值处理。独立读取固定Nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928的src/event/ngx_event_openssl.c:988–995，993–995明确crl->len==0直接NGX_OK。

最小返修：仅追加或复用该固定范围的证据，加入两项inheritance.source_ids及必要patch引用；核三项有效SSL yield补丁不改该范围。正文、状态及其他旧来源不改。属于引用不足，不否定现有中文语义；通知主线程先行处理，不等待Lua全部签署。

## Lua129完整首轮签署：85a5b1f135fbcdcf

结论：129身份、200目标字段均已完成独立源码语义与字段引用审核；198字段通过，2个inheritance因L01缺少空CRL消费引用退回。127身份全部目标字段通过，两个lua_ssl_crl身份待补证；不存在未审组冒记通过。L01修复并重新核正式发布后，才可签满200字段。

固定对象：HTTP Lua ea09d92adf835e30cab8d79343c7b8266e888128；stream Lua 69f0cd762112a6e0cddb07f2b5192e9a65034a93；NDK 91e30eb05085e7f9762f130cbb883a0e753cf74d；Nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928；OpenResty 8c37412c31621225e7aa7e825b5b50106c9c71c4。审核时updates文件SHA-256为5c4a87b8226c83f484a80bcf5ffd93953a4893fdb794b7c21354bda04a3afd0c。

### 分组判断与关键源码依据

- main参数与路径：两域分别核注册offset、pcalloc初态、init和消费。HTTP module.c100–215、1016–1128，stream module.c96–183、704–793；path/cpath分别读util.c159–319与142–303，区分无父VM设置路径、有父VM复制路径、空配置不覆盖、;;和prefix展开。两域load_resty_core的专用setter无状态并强制require，defaults标not_applicable成立。
- main共享与条件项：共享字典setter加入本域main列表、重复名拒绝；capture setter检验cycle唯一hook并受补丁宏限制。HTTP无PCRE的专用regex setter返回成功但无作用，stream注册与存储受PCRE条件限制。malloc_trim只在已挂接日志阶段计数，不能由缺省1000推断必然运行；HTTP协程缓存与worker Lua VM池并非OS线程池。
- 生命周期：HTTP directive.c1216–1430、module.c765–767/959–971、api.c195–211、initworkerby/exitworkerby消费；stream directive.c602–727、module.c526–528/647–659、api.c200–215及initworkerby消费。每族block/inline/file共槽，族间独立，无默认脚本；初始化测试/信号跳过条件和code_cache关闭新VM路径均核过。
- HTTP NDK三项：directive.c266–400、NDK ndk_set_var.c256–304/408–422/449–488/532–555，结合Nginx rewrite创建、merge、双阶段及if共享codes。明确是指令码动作，不套用Lua阶段handler继承。
- HTTP阶段脚本：逐族读server_rewrite/rewrite/access/content/log/header_filter/body_filter的setter、create、merge和空handler消费。srv的server_rewrite与loc的rewrite分离；各族源码长度为零才复制父组，不拼接；content的Lua槽复制不等于core handler安装。core全merge受no_error_pages补丁影响，但补丁前后均不复制handler，已分别核实际setter和选择路径。
- stream阶段脚本：module.c806–1034、directive.c237–727及各阶段消费。preread/log按srv长度判空继承，content仅server注册且merge完全不复制其脚本或handler，不能套HTTP loc机制；no_postpone修改的是main标志。
- 两域balancer：分别核自身setter/create与Nginx upstream独立srv创建（HTTP upstream.c6090–6133、stream upstream.c337–383），不进入虚拟主机server的合并循环。HTTP balancer_keepalive只控制其独立缓存，默认补值在balancer初始化，不与cosocket池混同。
- cosocket/普通标量：逐项核注册字段、UNSET种类、具体merge默认及调用点；API显式timeout/setkeepalive覆盖与配置继承区分，send_lowat平台post可能改存储值为0。不是由共有宏自动批准所有字段。
- TLS回调：HTTP module.c1233–1359先继承再按族处理SSL_CTX；session store/fetch只允许http但使用srv默认对象传播，缺ctx时不安装而非报同一错误。stream module.c866–959在固定Nginx>=1.25.5分支把继承本身也放进sscf&&ssl.ctx条件。六类block/file setter、实际handler消费、LibreSSL/OpenSSL条件分别核读。
- 出站SSL参数：HTTP module.c1378–1451/1514–1539/1585–1725，stream module.c806–856/963–989/1041–1131。字符串、掩码、证书/私钥数组分别合并；数组数量校验在加载前。HTTP可共享父SSL对象，stream每server新建。stream ssl_conf_commands初态NULL而非UNSET_PTR，公共merge_ptr不继承父命令；HTTP显式初始化UNSET_PTR，行为不同。两域conf_command最后执行及平台post检查均有依据；CRL空路径末句的引用不足单列L01。

49个not_applicable逐字段审核通过：两域废弃无状态load_resty_core各1个defaults，余47个为main/独立upstream等没有合法父子合并路径的inheritance；每项仍给出真实共享/独立存储行为。普通阶段的不继承、空handler、无默认脚本均保留verified，不以not_applicable清零。

### 发布对应与补丁核对

独立把200事实与manifest目标字段、updates、curated及85a5发布逐项比较；907个实际被事实引用的来源对象从60个固定Git文件重新读原文核对。旧证据对象逐项保留；将允许改动字段及来源追加归一化后，129份其余完整详情与f9f6一致；新evidence均有patch_status引用。上述机械验证只补足可追溯性，结论来自前述逐组逐字段源码阅读。

固定mirror-tarballs的HTTP Lua619–625、stream633–639、NDK579–582无直接组件补丁步骤；跨Nginx引用按实际34补丁核范围。已读三份SSL yield补丁完整正文，修改handshake/early_data，不修改CRL988–995或conf_commands1595–1664。capture仍保留intercept_error_log/larger_max_error_str既有影响判断。HTTP content三项新增完整core merge确被no_error_pages改动，不能把旧局部“片段不变”扩大为新完整片段不变；此范围说明与实施证据一致，继承事实本身不受影响，未擅改受保护旧note。

### 逐身份字段签署

“非目标”表示固定清单未要求本轮改该字段，并非未审目标。下表“通过（不适用）”是已核准not_applicable事实，不是跳过审核。

| 身份 | defaults | inheritance |
| --- | --- | --- |
| lua-nginx-module--ngx_http_lua_module--lua_load_resty_core | 通过（不适用） | 通过（不适用） |
| lua-nginx-module--ngx_http_lua_module--lua_thread_cache_max_entries | 非目标 | 通过（不适用） |
| lua-nginx-module--ngx_http_lua_module--lua_max_running_timers | 非目标 | 通过（不适用） |
| lua-nginx-module--ngx_http_lua_module--lua_max_pending_timers | 非目标 | 通过（不适用） |
| lua-nginx-module--ngx_http_lua_module--lua_shared_dict | 非目标 | 通过（不适用） |
| lua-nginx-module--ngx_http_lua_module--lua_capture_error_log | 通过 | 通过（不适用） |
| lua-nginx-module--ngx_http_lua_module--lua_sa_restart | 非目标 | 通过（不适用） |
| lua-nginx-module--ngx_http_lua_module--lua_regex_cache_max_entries | 非目标 | 通过（不适用） |
| lua-nginx-module--ngx_http_lua_module--lua_regex_match_limit | 非目标 | 通过（不适用） |
| lua-nginx-module--ngx_http_lua_module--lua_package_cpath | 通过 | 通过（不适用） |
| lua-nginx-module--ngx_http_lua_module--lua_package_path | 通过 | 通过（不适用） |
| lua-nginx-module--ngx_http_lua_module--lua_code_cache | 非目标 | 通过 |
| lua-nginx-module--ngx_http_lua_module--lua_need_request_body | 非目标 | 通过 |
| lua-nginx-module--ngx_http_lua_module--lua_transform_underscores_in_response_headers | 非目标 | 通过 |
| lua-nginx-module--ngx_http_lua_module--lua_socket_log_errors | 非目标 | 通过 |
| lua-nginx-module--ngx_http_lua_module--init_by_lua_block | 通过 | 通过（不适用） |
| lua-nginx-module--ngx_http_lua_module--init_by_lua | 通过 | 通过（不适用） |
| lua-nginx-module--ngx_http_lua_module--init_by_lua_file | 通过 | 通过（不适用） |
| lua-nginx-module--ngx_http_lua_module--init_worker_by_lua_block | 通过 | 通过（不适用） |
| lua-nginx-module--ngx_http_lua_module--init_worker_by_lua | 通过 | 通过（不适用） |
| lua-nginx-module--ngx_http_lua_module--init_worker_by_lua_file | 通过 | 通过（不适用） |
| lua-nginx-module--ngx_http_lua_module--exit_worker_by_lua_block | 通过 | 通过（不适用） |
| lua-nginx-module--ngx_http_lua_module--exit_worker_by_lua_file | 通过 | 通过（不适用） |
| lua-nginx-module--ngx_http_lua_module--set_by_lua_block | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--set_by_lua | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--set_by_lua_file | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--server_rewrite_by_lua_block | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--server_rewrite_by_lua_file | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--rewrite_by_lua | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--rewrite_by_lua_block | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--access_by_lua | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--access_by_lua_block | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--content_by_lua | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--content_by_lua_block | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--log_by_lua | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--log_by_lua_block | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--rewrite_by_lua_file | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--rewrite_by_lua_no_postpone | 非目标 | 通过（不适用） |
| lua-nginx-module--ngx_http_lua_module--access_by_lua_file | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--access_by_lua_no_postpone | 非目标 | 通过（不适用） |
| lua-nginx-module--ngx_http_lua_module--content_by_lua_file | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--log_by_lua_file | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--header_filter_by_lua | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--header_filter_by_lua_block | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--header_filter_by_lua_file | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--body_filter_by_lua | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--body_filter_by_lua_block | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--body_filter_by_lua_file | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--balancer_by_lua_block | 通过 | 通过（不适用） |
| lua-nginx-module--ngx_http_lua_module--balancer_by_lua_file | 通过 | 通过（不适用） |
| lua-nginx-module--ngx_http_lua_module--balancer_keepalive | 非目标 | 通过（不适用） |
| lua-nginx-module--ngx_http_lua_module--lua_socket_keepalive_timeout | 非目标 | 通过 |
| lua-nginx-module--ngx_http_lua_module--lua_socket_connect_timeout | 非目标 | 通过 |
| lua-nginx-module--ngx_http_lua_module--lua_socket_send_timeout | 非目标 | 通过 |
| lua-nginx-module--ngx_http_lua_module--lua_socket_send_lowat | 非目标 | 通过 |
| lua-nginx-module--ngx_http_lua_module--lua_socket_buffer_size | 非目标 | 通过 |
| lua-nginx-module--ngx_http_lua_module--lua_socket_pool_size | 非目标 | 通过 |
| lua-nginx-module--ngx_http_lua_module--lua_socket_read_timeout | 非目标 | 通过 |
| lua-nginx-module--ngx_http_lua_module--lua_http10_buffering | 非目标 | 通过 |
| lua-nginx-module--ngx_http_lua_module--lua_check_client_abort | 非目标 | 通过 |
| lua-nginx-module--ngx_http_lua_module--lua_use_default_type | 非目标 | 通过 |
| lua-nginx-module--ngx_http_lua_module--lua_malloc_trim | 非目标 | 通过（不适用） |
| lua-nginx-module--ngx_http_lua_module--lua_worker_thread_vm_pool_size | 非目标 | 通过（不适用） |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_load_resty_core | 通过（不适用） | 通过（不适用） |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_max_running_timers | 非目标 | 通过（不适用） |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_max_pending_timers | 非目标 | 通过（不适用） |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_shared_dict | 通过 | 通过（不适用） |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_sa_restart | 非目标 | 通过（不适用） |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_capture_error_log | 通过 | 通过（不适用） |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_regex_cache_max_entries | 非目标 | 通过（不适用） |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_regex_match_limit | 非目标 | 通过（不适用） |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_package_cpath | 通过 | 通过（不适用） |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_package_path | 通过 | 通过（不适用） |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_code_cache | 非目标 | 通过 |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_socket_log_errors | 非目标 | 通过 |
| stream-lua-nginx-module--ngx_stream_lua_module--init_by_lua_block | 通过 | 通过（不适用） |
| stream-lua-nginx-module--ngx_stream_lua_module--init_by_lua | 通过 | 通过（不适用） |
| stream-lua-nginx-module--ngx_stream_lua_module--init_by_lua_file | 通过 | 通过（不适用） |
| stream-lua-nginx-module--ngx_stream_lua_module--init_worker_by_lua_block | 通过 | 通过（不适用） |
| stream-lua-nginx-module--ngx_stream_lua_module--init_worker_by_lua | 通过 | 通过（不适用） |
| stream-lua-nginx-module--ngx_stream_lua_module--init_worker_by_lua_file | 通过 | 通过（不适用） |
| stream-lua-nginx-module--ngx_stream_lua_module--preread_by_lua_file | 通过 | 通过 |
| stream-lua-nginx-module--ngx_stream_lua_module--preread_by_lua_block | 通过 | 通过 |
| stream-lua-nginx-module--ngx_stream_lua_module--content_by_lua | 通过 | 通过 |
| stream-lua-nginx-module--ngx_stream_lua_module--content_by_lua_block | 通过 | 通过 |
| stream-lua-nginx-module--ngx_stream_lua_module--content_by_lua_file | 通过 | 通过 |
| stream-lua-nginx-module--ngx_stream_lua_module--log_by_lua_block | 通过 | 通过 |
| stream-lua-nginx-module--ngx_stream_lua_module--log_by_lua_file | 通过 | 通过 |
| stream-lua-nginx-module--ngx_stream_lua_module--preread_by_lua_no_postpone | 非目标 | 通过（不适用） |
| stream-lua-nginx-module--ngx_stream_lua_module--balancer_by_lua_block | 通过 | 通过（不适用） |
| stream-lua-nginx-module--ngx_stream_lua_module--balancer_by_lua_file | 通过 | 通过（不适用） |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_socket_keepalive_timeout | 非目标 | 通过 |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_socket_connect_timeout | 非目标 | 通过 |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_socket_send_timeout | 非目标 | 通过 |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_socket_send_lowat | 非目标 | 通过 |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_socket_buffer_size | 非目标 | 通过 |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_socket_pool_size | 非目标 | 通过 |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_socket_read_timeout | 非目标 | 通过 |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_check_client_abort | 非目标 | 通过 |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_malloc_trim | 非目标 | 通过（不适用） |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_add_variable | 通过 | 通过（不适用） |
| lua-nginx-module--ngx_http_lua_module--ssl_client_hello_by_lua_block | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--ssl_client_hello_by_lua_file | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--ssl_certificate_by_lua_block | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--ssl_certificate_by_lua_file | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--ssl_session_store_by_lua_block | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--ssl_session_store_by_lua_file | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--ssl_session_fetch_by_lua_block | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--ssl_session_fetch_by_lua_file | 通过 | 通过 |
| stream-lua-nginx-module--ngx_stream_lua_module--ssl_client_hello_by_lua_block | 通过 | 通过 |
| stream-lua-nginx-module--ngx_stream_lua_module--ssl_client_hello_by_lua_file | 通过 | 通过 |
| stream-lua-nginx-module--ngx_stream_lua_module--ssl_certificate_by_lua_block | 通过 | 通过 |
| stream-lua-nginx-module--ngx_stream_lua_module--ssl_certificate_by_lua_file | 通过 | 通过 |
| lua-nginx-module--ngx_http_lua_module--lua_ssl_protocols | 非目标 | 通过 |
| lua-nginx-module--ngx_http_lua_module--lua_ssl_ciphers | 非目标 | 通过 |
| lua-nginx-module--ngx_http_lua_module--lua_ssl_verify_depth | 非目标 | 通过 |
| lua-nginx-module--ngx_http_lua_module--lua_ssl_certificate | 非目标 | 通过 |
| lua-nginx-module--ngx_http_lua_module--lua_ssl_certificate_key | 非目标 | 通过 |
| lua-nginx-module--ngx_http_lua_module--lua_ssl_trusted_certificate | 非目标 | 通过 |
| lua-nginx-module--ngx_http_lua_module--lua_ssl_crl | 非目标 | 退回L01 |
| lua-nginx-module--ngx_http_lua_module--lua_ssl_conf_command | 非目标 | 通过 |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_ssl_protocols | 非目标 | 通过 |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_ssl_ciphers | 非目标 | 通过 |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_ssl_verify_depth | 非目标 | 通过 |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_ssl_certificate | 非目标 | 通过 |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_ssl_certificate_key | 非目标 | 通过 |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_ssl_trusted_certificate | 非目标 | 通过 |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_ssl_crl | 非目标 | 退回L01 |
| stream-lua-nginx-module--ngx_stream_lua_module--lua_ssl_conf_command | 通过 | 通过 |

## L01最终关闭与完整签署：f43ab3d7392bdcc9

正式发布：`1.27.1.1-f43ab3d7392bdcc9`。index原字节SHA-256：`0281620ea3941e5bcefb3f855f4ba208d913d472aa6c19e1ac58d1bed1f22631`。

L01关闭：HTTP及stream的lua_ssl_crl/inheritance各新增一个crl-empty-path证据，均准确绑定固定Nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928的src/event/ngx_event_openssl.c:988–995。重新读取Git原文确认993–995在crl->len==0时直接返回NGX_OK，足以支撑原文空路径处理说明；发布源码片段和revision URL准确。该范围不受前轮已完整核读的三项有效SSL yield补丁修改。各新增ID已同时进入inheritance及patch_status引用，当前curated、updates与正式发布一致。

独立对比f43ab与85a5的全部1041份详情：除release_id正常变化外，仅上述两项各追加一份来源、一个inheritance引用、一个patch引用；正文、状态、所有旧来源及其余完整字段均未变。其余1039详情完整一致；refs和index除发布ID/路径归一化外完整一致。因此既有Nginx207及Lua198字段签署适用于本发布，补齐L01后Lua200字段全部签署。前文Lua逐身份表中两行“退回L01”现均更新为通过，以本节为最终结论。

最终源码审核范围：Nginx117身份207字段＋Lua129身份200字段，共246身份407目标字段全部通过，无未关闭问题。VTS两项原签署保留；其他扩展审核由相应审核者负责。本结论不取代主线程进行中的最终全量测试、340页面复核或现场环境有效性判断；未读取私有样例。用户已报告浏览器成功加载本最终版及部分流程通过，记录为主线程结果，不再沿用旧“浏览器阻断”状态。

## final25历史发布保护替换复核

结论：通过本次替换，不削弱原发布保护。原非25项curated输入摘要与本轮合法补证冲突；将其改为保护原发布字节，符合历史发布不可变、当前输入按340白名单变更的边界。此结论不代表当前340字段或B/D组已通过。

- 已重读 `test/final25-runtime.test.mjs`：index固定为 `1.27.1.1-1c2ead24459672e6`，比较基线固定为 `1.27.1.1-06a6394fb516a4bb`。独立按index顺序读取1041份详情原字节，随后追加refs原字节，重算SHA-256为 `02ef9c9c952ac5a0b0e2dac766402066ba1c4a8d265135ae61ea52d0f1a7d800`，与新断言一致；不是从待比较对象临时生成期望值。
- 原25项清单、原证据前缀及稳定curated字段摘要、固定Git完整来源、晋级白名单、运行时语义锚点、错误文案和错误绑定负例仍在。其余1016份详情除release_id归一化外仍与06a639完整对象逐项比较；index身份顺序、元数据及1041/44分布仍受约束。
- 已重读340专项的当前发布保护：全1041份详情均调用checkDetail，目标只恢复manifest指定字段和允许追加的证据/补丁引用后与冻结对象完整比较；非目标不放宽。refs仅归一化release_id后完整比较，旧source_ids及旧证据仍保留。未运行尚未完成的340全量测试，不据此宣称当前发布验收完成。
- fixture中的历史 `nonTargetHash` 仍为 `928b9c89873daa84f1a9dcb284839463ec5eeb6c940d1ad5f6e5e83f7032f7b5`；保留为历史输入记录，不再作为当前可变知识的发布保真判据。
- 独立执行final25单文件测试：53项通过、0失败。未执行私有样例，也未修改测试、fixture或知识。

## 后续提交审核台账与退回格式

下方117清单保留首次接收/组A初审时的历史状态；当前Nginx全部结果以“返修最终复核：85a5b1f135fbcdcf”为准，不再将历史“待提交”计作未审项。

每项记录完整ID、目标字段、输入摘要/实际发布ID、setter/create/merge/消费/补丁锚点、结论与source_ids对应关系、非目标保真结果、问题编号及复核结果。同一项两个字段分别签署，不用整模块一个“通过”覆盖。

退回主线程时给出：ID/字段 → 错误文本或缺证条件 → 固定revision/精确行 → 最小修改范围 → 需复核的共享机制。只有修正后重新读源码与新发布对象通过才能关闭问题。

以下117项仅为从固定manifest投影的待审台账，不是另一份任务清单；全部待实施提交后逐字段审核。上表风险研究不构成任何一行验收通过。

| 完整身份 | 待审字段 | 状态 |
| --- | --- | --- |
| nginx--ngx_core_module--daemon | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_core_module--master_process | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_core_module--timer_resolution | defaults、inheritance | defaults退回A03；inheritance通过 |
| nginx--ngx_core_module--lock_file | defaults、inheritance | defaults退回A02；inheritance通过 |
| nginx--ngx_core_module--debug_points | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_core_module--user | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_core_module--worker_priority | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_core_module--worker_rlimit_core | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_core_module--worker_shutdown_timeout | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_core_module--working_directory | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_core_module--env | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_core_module--load_module | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_regex_module--pcre_jit | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_thread_pool_module--thread_pool | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_devpoll_module--devpoll_changes | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_devpoll_module--devpoll_events | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_epoll_module--epoll_events | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_epoll_module--worker_aio_requests | defaults、inheritance | defaults退回A01；inheritance通过 |
| nginx--ngx_eventport_module--eventport_events | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_iocp_module--iocp_threads | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_iocp_module--post_acceptex | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_iocp_module--acceptex_read | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_kqueue_module--kqueue_changes | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_kqueue_module--kqueue_events | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_event_core_module--use | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_event_core_module--debug_connection | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_openssl_module--ssl_engine | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_quic_bpf_module--quic_bpf | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_http_empty_gif_module--empty_gif | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_fastcgi_module--fastcgi_pass | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_fastcgi_module--fastcgi_split_path_info | defaults | 待提交逐字段审核 |
| nginx--ngx_http_fastcgi_module--fastcgi_store | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_fastcgi_module--fastcgi_limit_rate | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_fastcgi_module--fastcgi_cache | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_fastcgi_module--fastcgi_cache_key | defaults | 待提交逐字段审核 |
| nginx--ngx_http_fastcgi_module--fastcgi_cache_path | defaults | 待提交逐字段审核 |
| nginx--ngx_http_fastcgi_module--fastcgi_temp_path | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_fastcgi_module--fastcgi_param | defaults | 待提交逐字段审核 |
| nginx--ngx_http_fastcgi_module--fastcgi_pass_header | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_fastcgi_module--fastcgi_hide_header | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_flv_module--flv | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_grpc_module--grpc_pass | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_grpc_module--grpc_set_header | defaults | 待提交逐字段审核 |
| nginx--ngx_http_grpc_module--grpc_pass_header | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_grpc_module--grpc_hide_header | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_gzip_filter_module--gzip_window | defaults | 待提交逐字段审核 |
| nginx--ngx_http_gzip_filter_module--gzip_hash | defaults | 待提交逐字段审核 |
| nginx--ngx_http_image_filter_module--image_filter_sharpen | inheritance | 待提交逐字段审核 |
| nginx--ngx_http_memcached_module--memcached_pass | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_mp4_module--mp4 | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_proxy_module--proxy_redirect | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_proxy_module--proxy_store | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_proxy_module--proxy_set_body | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_proxy_module--proxy_method | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_proxy_module--proxy_busy_buffers_size | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_proxy_module--proxy_cache | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_proxy_module--proxy_cache_key | inheritance | 待提交逐字段审核 |
| nginx--ngx_http_proxy_module--proxy_cache_path | defaults | 待提交逐字段审核 |
| nginx--ngx_http_proxy_module--proxy_cache_methods | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_proxy_module--proxy_temp_path | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_proxy_module--proxy_max_temp_file_size | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_proxy_module--proxy_temp_file_write_size | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_proxy_module--proxy_pass_header | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_proxy_module--proxy_hide_header | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_proxy_module--proxy_ignore_headers | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_rewrite_module--rewrite | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_rewrite_module--return | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_rewrite_module--break | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_rewrite_module--if | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_scgi_module--scgi_pass | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_scgi_module--scgi_store | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_scgi_module--scgi_limit_rate | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_scgi_module--scgi_cache | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_scgi_module--scgi_cache_key | defaults | 待提交逐字段审核 |
| nginx--ngx_http_scgi_module--scgi_cache_path | defaults | 待提交逐字段审核 |
| nginx--ngx_http_scgi_module--scgi_temp_path | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_scgi_module--scgi_param | defaults | 待提交逐字段审核 |
| nginx--ngx_http_scgi_module--scgi_pass_header | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_scgi_module--scgi_hide_header | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_stub_status_module--stub_status | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_try_files_module--try_files | inheritance | 待提交逐字段审核 |
| nginx--ngx_http_uwsgi_module--uwsgi_pass | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_uwsgi_module--uwsgi_store | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_uwsgi_module--uwsgi_limit_rate | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_uwsgi_module--uwsgi_cache | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_uwsgi_module--uwsgi_cache_key | defaults | 待提交逐字段审核 |
| nginx--ngx_http_uwsgi_module--uwsgi_cache_path | defaults | 待提交逐字段审核 |
| nginx--ngx_http_uwsgi_module--uwsgi_temp_path | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_uwsgi_module--uwsgi_param | defaults | 待提交逐字段审核 |
| nginx--ngx_http_uwsgi_module--uwsgi_pass_header | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_uwsgi_module--uwsgi_hide_header | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_http_perl_module--perl_modules | defaults | 待提交逐字段审核 |
| nginx--ngx_http_perl_module--perl | inheritance | 待提交逐字段审核 |
| nginx--ngx_http_core_module--server_name | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_http_core_module--types | defaults | 组A目标字段源码审核通过 |
| nginx--ngx_http_core_module--root | inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_http_core_module--alias | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_http_core_module--limit_except | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_http_core_module--client_body_temp_path | defaults | 组A目标字段源码审核通过 |
| nginx--ngx_http_core_module--subrequest_output_buffer_size | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_http_core_module--aio | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_http_core_module--aio_write | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_http_core_module--read_ahead | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_http_core_module--directio | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_http_core_module--directio_alignment | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_http_core_module--error_page | defaults | 组A目标字段源码审核通过 |
| nginx--ngx_http_core_module--post_action | defaults | 组A目标字段源码审核通过 |
| nginx--ngx_http_core_module--gzip_disable | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_http_core_module--disable_symlinks | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_mail_module--mail | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_mail_core_module--server | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_mail_core_module--listen | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_mail_core_module--protocol | defaults、inheritance | 待提交逐字段审核 |
| nginx--ngx_google_perftools_module--google_perftools_profiles | defaults、inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_stream_core_module--server_name | inheritance | 组A目标字段源码审核通过 |
| nginx--ngx_stream_pass_module--pass | inheritance | 待提交逐字段审核 |
| nginx--ngx_stream_return_module--return | inheritance | 待提交逐字段审核 |

