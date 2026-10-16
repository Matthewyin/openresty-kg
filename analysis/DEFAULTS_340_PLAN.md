# 340项默认值与继承事实补齐计划

日期：2026-10-15。规划角色仅写本文；主线程流控和验收，已批准的规划/审核模型为 Astra low，实施模型为 Sol high。本文是后续实施与独立审核的共同判据，不表示事实补齐已经完成。

## 深度交互：目标与冻结范围

目标是逐项补齐固定发布中尚未核实的默认值和继承事实，使用户能理解“不写此指令”及“父子配置同时存在”的固定版本行为。不是把340项升级为deep，也不是将已有来源链接批量转换为verified。更小且可审计的路径是沿用现有事实结构、构建和页面，只补指定字段及其必要证据。

已只读核对 README、WEBSITE_RELIABILITY_PLAN、构建入口、知识结构和当前发布。当前索引发布为 `1.27.1.1-f9f6f0ffb7eba3d8`（下称f9f6）。固定任务来源为 `analysis/DEFAULTS_340_MANIFEST.json`，本文不复制其340行清单，也不更改其身份、字段或范围。

本次逐条读取f9f6详情，按 defaults/inheritance 的 unverified 状态重新提取清单，核对顺序、身份、fields及每条原始详情SHA-256，结果与manifest完全一致：340个身份、225个defaults、312个inheritance，共537个字段；197个身份同时缺两字段、28个仅缺默认值、115个仅缺继承。索引摘要及knowledge摘要也与manifest一致。

- manifest SHA-256：`a685f1d87c9a3afc7812c8ca231cc137dba10db494b3d0f9b183d16c111cff90`。
- f9f6冻结索引SHA-256：`4276b2a74f8d071e3b85bb5c82489899b30c35cb1791bcc25f0e46b639c32b4f`。
- 基线 `knowledge/directives.json` SHA-256：`aa4cec0555f452638815b155ea0b625f626ae5cd7cac61fb80ba70531ddaeb14`。

manifest是任务范围，不是证据。任一摘要或身份不符，先由主线程查明基线变化，不重生成清单掩盖差异。证据不足的字段保持unverified并记录具体缺口，不能为凑齐数字晋级；仍有缺口就不能宣称537字段全部完成。

## 直接执行：按实际items分组

以下分组是manifest身份的互斥分区；计数来自本次实际读取。执行顺序 A→B→C→D→E，各组按模块拆成可独立审核的小批次，不等待全库修改完才审核。组内只处理manifest.fields指定字段。

| 组 | 范围 | 身份 | 默认值 | 继承 | 字段合计 |
| --- | --- | ---: | ---: | ---: | ---: |
| A | 核心、事件与HTTP/stream核心 | 46 | 44 | 42 | 86 |
| B | HTTP/stream代理及协议上游配置 | 51 | 50 | 39 | 89 |
| C | HTTP Lua、stream Lua | 129 | 71 | 129 | 200 |
| D | 其余Nginx原生模块 | 20 | 15 | 17 | 32 |
| E | 其余发行第三方模块与部门扩展 | 94 | 45 | 85 | 130 |
| 合计 | 精确清单全集 | 340 | 225 | 312 | 537 |

A限定component=nginx，模块与身份数为：ngx_core_module 12、ngx_regex_module 1、ngx_thread_pool_module 1、ngx_devpoll_module 2、ngx_epoll_module 2、ngx_eventport_module 1、ngx_iocp_module 3、ngx_kqueue_module 2、ngx_event_core_module 2、ngx_openssl_module 1、ngx_quic_bpf_module 1、ngx_http_core_module 16、ngx_google_perftools_module 1、ngx_stream_core_module 1。先处理全局/事件，再处理HTTP/stream核心；平台条件必须逐项说明。

B限定component=nginx：ngx_http_proxy_module 15、ngx_http_fastcgi_module 11、ngx_http_grpc_module 4、ngx_http_memcached_module 1、ngx_http_scgi_module 10、ngx_http_uwsgi_module 10。优先HTTP proxy，再处理其他协议。ngx_stream_proxy_module在本次manifest中为0项，不为满足组名扩大范围；既有stream代理事实参与保真回归。

C为lua-nginx-module/ngx_http_lua_module 79项、stream-lua-nginx-module/ngx_stream_lua_module 50项。先HTTP再stream，按配置回调、阶段钩子、共享字典和参数字段等实际机制拆批；两组件不能因名称相似共用未经核实的继承结论。

D为nginx组件剔除A/B后的20项：ngx_http_empty_gif_module 1、ngx_http_flv_module 1、ngx_http_gzip_filter_module 2、ngx_http_image_filter_module 1、ngx_http_mp4_module 1、ngx_http_rewrite_module 4、ngx_http_stub_status_module 1、ngx_http_try_files_module 1、ngx_http_perl_module 2、ngx_mail_module 1、ngx_mail_core_module 3、ngx_stream_pass_module 1、ngx_stream_return_module 1。

E按component划分：echo-nginx-module 18、headers-more-nginx-module 4、memc-nginx-module 1、srcache-nginx-module 2、ngx_devel_kit 1、set-misc-nginx-module 26、array-var-nginx-module 4、form-input-nginx-module 2、rds-json-nginx-module 1、drizzle-nginx-module 12、iconv-nginx-module 1、encrypted-session-nginx-module 2、redis-nginx-module 2、ngx_postgres 10、redis2-nginx-module 6、nginx-module-vts 2。最后一项属于部门扩展，其他项仍按发行第三方来源处理。

每批领取时从manifest筛选精确ID和字段，记录输入清单摘要、字段数、涉及组件revision和预期写集。各批集合交集必须为空、并集必须等于manifest，禁止按名称去重混淆HTTP、stream及其他模块。

## 逐字段证据与结论要求

实施者对每个ID的每个目标字段建立简短证据记录，审核者逐字段复核。共享源码片段可以复用，但必须写出该字段如何进入共享逻辑，不得整模块复制同一verified说明。

1. 固定来源：依据project.config.json、components及f9f6来源记录核对repository、完整revision、文件与行范围。使用固定Git对象读取，不能把工作树、最新网页或另一组件版本当作冻结源码。跨组件setter/宏同样标明归属revision。
2. 注册与setter：从该指令注册项追到callback、配置层级、目标结构字段、offset、post校验或自定义赋值；别名、废弃指令、无效入口要按实际分支说明，不能只看指令名或注册表类型。
3. 初始状态与未设置分支：查create/init中的零初始化或UNSET哨兵，再查init_conf/merge及必要使用点。区分内部哨兵、最终默认值、条件默认、运行时派生值、未配置不安装handler和无独立默认值，不把NULL、0或宏字面值直接当用户可见默认。
4. 继承：记录实际父子层级、merge调用、覆盖/追加/整组替换规则、子级一项配置导致的整组不继承、特殊location及相关条件分支。没有merge函数不自动证明不继承；需排除共享配置指针、setter副作用或其他配置传播路径。
5. 不适用：仅在源码证明该概念不适用时使用现有not_applicable，并写清原因和来源。全局配置、一次性动作及块入口分别判断，不能用not_applicable代替未研究。
6. 补丁：逐条检查新增引用涉及的固定发行处理脚本、有效补丁和补丁后分支。既有verified_unaffected若只覆盖旧片段，不自动覆盖新merge/setter。必要时引用固定OpenResty补丁及现有隔离回放结果；局部不受影响不扩大为全模块不受影响。VTS的not_applicable仅表示独立快照不属于发行补丁处理范围。
7. 结论：defaults与inheritance分别填写中文text、准确status和最小充分source_ids。固定文档只作交叉核对；与源码不一致时解释差异。动态值保留条件表达，不猜现场值。每条记录列出未设置、父设置/子未设置、子显式设置以及实际存在的特殊分支判据；不适用分支写明理由。

建议实施证据记录落在 `analysis/DEFAULTS_340_EVIDENCE.md`，以ID+字段为索引记录结论、revision、setter/create/merge/未设置分支、补丁依据、知识来源ID及审核状态。仅记必要说明与精确锚点，不复制大段已有知识文本。必要时分组附录，由主线程固定链接，不能新建另一套任务清单替代manifest。

## 写集与保真保护

实际构建读取 `knowledge/directives.json`、`knowledge/extensions.json`，由 `scripts/build.mjs` 从固定revision提取证据，调用现有事实及发布校验；`analysis/content/`不是本次构建的自动覆盖来源。实施以正式知识文件为准，不只改历史批次素材、不引入新的自动猜测/推断器、不新增schema或产品功能。

知识写集仅放行manifest指定defaults/inheritance字段、这些字段必要的新evidence，以及有逐项说明和审核的必要patch_status依据补充。已有evidence原文及ID保留，新ID不得碰撞；旧source_ids顺序和旧证据内容不因补证重写。若必须改动原有补丁结论，应单列精确字段差异及理由，由主线程纳入审核，不能整对象豁免。

其余字段保持基线：summary、syntax、contexts、configuration_entry、limitations、availability、runtime、related、documentation、source、verification等均不得顺带改动。新README类证据可能触发构建自动派生documentation，实施时须检查并保持旧文档列表，不能把非目标派生变化当作无关噪声忽略。特别保持1041个身份与顺序、1041基础/44深度精确集合、发行1017/40和部门扩展24/4、8项参考及全部现场未知说明。

主线程负责当前状态文档、测试、正常build生成的发布以及集成证据；实施线程不并发覆盖主线程文件。不直接编辑dist或历史发布。仓库根目录本次不能作为Git仓库查询状态，故主线程应使用原始文件摘要和逐字段差异固定写集，不假设根仓库commit可提供保护。各来源子仓库仍按固定Git对象核对。

已发现 `test/reliability-publication.test.mjs` 把当前knowledge摘要及当前发布绑定为“上一轮知识不变”。本轮不能删掉这些断言或放宽全局对象比较：将上一轮验证明确绑定冻结f9f6及其历史基线，保留原发布保护与负例；旧knowledge摘要作为基线输入摘要验证。另增本轮f9f6→新发布精确字段白名单保护，核对manifest原摘要。其他历史测试若绑定current，同样先判定其历史契约，不能批量更新期望以迎合新结果。

## 分组交付与独立审核闭环

每批交付包含：精确ID/字段集合、修改后的事实、逐字段证据索引、实际差异、定向检查结果、未解决项。审核按537字段逐项签署，状态区分已补证、证据不足、退回修正；不能仅抽样阅读或用测试通过代替源码审查。

审核检查注册→setter→create/init→merge/未设置使用分支→补丁是否闭合，确认中文结论无扩大解释、所有source_ids可解析、剩余字段保真、批次计数一致。遗漏、错误引用、泛化继承或缺少条件均退回Sol high按ID/字段修正，审核者重新检查相关字段及受影响共享机制。主线程仅在该批通过后计入完成数，保留退回原因和复核结果；规划与审核不替代实施修改知识。

建议审核记录为 `analysis/DEFAULTS_340_REVIEW.md`，主线程验收记录为 `analysis/DEFAULTS_340_VERIFICATION.md`。完成记录绑定最终manifest摘要、知识文件摘要、发布ID和资源摘要。全部组完成后重新核并集537字段及340身份，不使用累计提交次数计数。

## 全范围验收

1. 结构与事实保护：全量比较f9f6的1041详情和新发布，仅放行逐项列明的目标字段、必要追加证据和审核确认的补丁差异，以及正常release_id/detail_path/references_path派生变化。先校验每条真实release_id和当前索引与冻结索引一致，再归一化路径比较。原有sources须完整保留；参考知识除release_id外保持一致。校验537字段的来源真实性与状态，不仅判断非空或非unverified。
2. 保护负例：至少证明清单外事实改变、同一身份非目标字段改变、availability升级、runtime改变、旧source代码/revision改变、伪造来源ID、删现场缺口、漏身份、重复字段、旧release残留及计数变化会失败。不得整段删除sources/coverage/patch_status后比较。
3. 测试与build：每批运行相称的内容、知识校验和相关专项；集成后运行 `npm run build`、`npm test` 及本次新增定向验证，保证依赖发布内容的检查读取最终构建。需要时使用现有补丁与构建门禁脚本核对新增证据。记录实际通过/失败数量和命令，不复用README中的历史268项。build成功仅证明结构可发布，不证明事实语义正确。更改后复跑受影响检查，最终结果绑定同一发布。
4. 两份原样例：仅主线程在私有内存中读取并回归两份原样例，使用原文本，不落盘、不复制给规划/实施/审核，也不截取业务地址写进公开证据。对照既有解析、匹配、候选身份、外部未分析边界与知识查询结果，核验原样例相关目标字段更新及其他行为不变。公开记录仅给去敏的数量、通过情况和主线程验收结论。人工夹具和历史报告不能替代这次原样例回归。
5. 桌面QA全范围：主线程在最终发布的真实桌面浏览器中打开全部340个目标详情，逐项检查537字段的中文文本、状态、来源展示及固定revision链接，保存去敏ID/字段级结果，不以每组挑一个代替全范围。人工检查各组特殊条件、长文本和多来源布局。检查其余701项的目录/详情可达性及保真结果，覆盖基础/deep/无runtime提示、同名HTTP/stream选择、目录筛选、单项/配置查询、关联导航、永久链接、8项参考入口、修改输入清除旧结果，以及examples正常/故障下启动与查询。核实服务资源摘要等于最终dist，不以HTTP200、页面标题或脚本通过冒充视觉验收。
6. 最终收口：主线程更新当前状态文档，给出各组身份数、已完成字段数、剩余具体字段、测试/build/原样例/桌面QA结果与独立审核链接；清理本轮不再需要的临时文件，保留审计证据及历史发布。若仍有证据缺口或任一验收未完成，应明确未完成项，不宣布全量补齐。

移动端、Codex宿主真实接入、现场安装/模块启用/配置加载/业务运行与部署验证均排除。现有MCP协议回归可照常运行，不等同Codex真实接入。源码结论、知识匹配和桌面显示均不能证明现场有效。

本规划仅完成只读核对、清单与摘要验证及本文落盘；未修改manifest或知识，未运行build/tests/桌面QA，未读取私有样例。后续执行与验收由上述角色依次完成。
