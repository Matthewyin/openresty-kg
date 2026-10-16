# 网站完整开发：主验收记录

## C04最终版本实测（2026-10-13，主与独立验收通过）

最后125项全部逐义通过，R39/R40及L-R01至L-R06关闭后，主按11份冻结稿追加至1017；合并前后完整身份集合精确等于正式catalog，无重复或缺失。真实build为1.27.1.1-eeabda4eba7f5c16，current index SHA256 961e1ad50943cd57abbb5847d0aae800d1bfce4e4f886e8f2a016c1a8c358d6d；1017注册/1017基础/0仅注册/0深度/8参考，范围true，缺口仅部门样例及Codex/内网验收。旧发布全部保留，最终正式接入交独立审核。

最终npm test首次83/84：唯一失败是旧计数断言强制basic小于registration，不适用于已全量知识。主仅将其替换为registration等于索引条目数、basic等于非registration_only条目数，未改产品门禁；完整重跑84/84通过，0失败/跳过/取消，约28.85秒。实际目录、有效补丁、解析、匹配、协议子进程、参考及写前校验均通过；不是Codex宿主或OpenResty运行验收。

49817限时HTTP通过真实createKnowledgeClient逐查全部1017身份（给定正式context/module），均matched/basic且锁定eeabda4eba7f5c16；返回完整详情与该发布JSON深比较一致，summary及事实文字与源知识一致。初次检查将旧格式字符串limitations与规范事实对象直接相比失败，修正验收比较口径后完整重跑通过，没有修改发布内容。

最终verify-build-gate及verify-reference-build均实际通过：坏末条/末参考拒绝、临时current保留、无部分发布；仅参考内容变化、仅coverage变化分别产生新release，指令覆盖数保持。隔离目录finally清理，根current不变。

桌面沿用TaskSpace1/p1，无手机。query-ui及query-ui-async完整通过：原server片段/显式Stream/events、目录联动、旧详情清理、歧义不猜测、错误位置、筛选撤销、永久链接；当前详情/索引失败与恢复、迟到成功/失败均不覆盖后选项。website及accuracy两组也完整通过：外部文件提示、关联多模块不改原查询、参考区独立及四类坏参考、旧无参考发布、网站/Markdown事实一致、坏availability拒绝。全部注入在finally移除并重载；记录网络仅静态GET，无原始配置/参数上传。

最终组合筛选ngx_postgres_module＋http.location＋content的可见集合与正式索引计算集合完全一致；Redis bind真实显示NULL/duplicate及off不可达，CSV显示默认on和零列预算/输出差异，Drizzle显示multi与复用数据库名限制。重新输入用户原events两参数片段，目录严格只有events/multi_accept/worker_connections，手动选择后为对应事件模块详情，无默认Lua内容错配。桌面截图已实际查看：双栏与所选详情对应、文字无横向溢出；截图仅临时验收文件，查看后清理，不作为新产品资产。

最终内容/C02及测试适配均已独立通过。主C04矩阵全部通过，完整dist与不可变历史发布保留，README/REQUIREMENTS/IMPLEMENTATION已同步1017及真实边界、HTTP打开与静态托管方法。R41两份文档状态已修正并独立关闭，C04最终独立审核通过；仍不以此宣称部门深度、Codex宿主、内网部署或OpenResty运行验收完成。

## 892正式发布增量（2026-10-13）

主在64573限时HTTP逐查新增72身份，全部matched/basic、release固定dc9685c374bbc170、limitations逐对象相等。桌面沿用TaskSpace1/p1，显示892计数及Stream lua_code_cache的create_ctx修正、真实会话/伪连接边界和util.h283–385固定来源链接，未混用HTTP同名条目。

820正式129项接入和verify-build-gate修正均独立通过。主核HTTP Lua W07四项子集SHA0c69cc90…及完整Mail SSL19、Stream Lua49修正后冻结SHA，按此顺序追加72；L-R01/L-R02/L-R03/L-R04和R38均已独立关闭。实际build为1.27.1.1-dc9685c374bbc170，index SHA256 1a107771edb2539a243369de67fcbfae1e2d4ab0fdb7607db581975ac2b4930f；1017注册/892基础/125仅注册/0深度/8参考。发布/计数定向2/2通过，current冻结交正式接入审核。Nginx原生注册全有基础说明，剩余125为第三方模块，C02/C04尚未完成。

## C04验收脚本适配全量知识（2026-10-13，主执行）

verify-build-gate.mjs旧实现选择未curated身份并破坏catalog；实际运行先被C01范围一致性拒绝（redis2目录字段不一致），未进入预期publication适用条件门禁，且全量完成后无未curated身份可选。最小修正为选择catalog最后一个已有知识身份，在隔离知识设置availability.dependencies=null，catalog保持真实，仍检查错误身份/适用条件、旧current不变和无部分发布。无需改变产品门禁。

脚本SHA256 7c6774e7250af80a1ae0be12c1391ee94ccf1515aeab414abca5087d2e57759d；node --check及实际node analysis/verify-build-gate.mjs --config project.config.json通过，拒绝nginx--ngx_http_core_module--no_error_pages，临时目录finally清理，root820索引SHA保持。脚本增量已交独立审核，最终发布仍需C04完整回归。

## 820正式发布增量（2026-10-13）

主在64573限时HTTP逐查本窗新增129身份，全部matched/basic、release513d4b289e7a100d且limitations与审核稿深比较一致。ego-browser沿用TaskSpace1/p1，实际显示820计数及lua_worker_thread_vm_pool_size默认10、线程池区别、未知继承和固定代码来源；未做手机验收。

同空间继续核HTTP ssl_stapling真实展示R37在线/本地分支，NDK upstream_list显示带权字符串用途、两处NDK条件、set-misc发行组合及main_conf共享限制。既有verify-reference-build.mjs在820实际通过坏最后参考拒绝、current不变、无部分发布、参考内容/coverage变化各自产生新发布身份；全部为隔离夹具，finally清理，未改变root当前发布。

691正式接入已独立通过。先按整份已审Stream上游6构建697（1.27.1.1-3131d2594e9a02cd，index SHA256 dd775f2e38435fd61b78793acef0e0f4d9456b77d22a93fa06215def4f869b96），实际发布/计数定向2/2通过；此中间版未单独宣称正式接入审核通过。

接着核NDK/array/form7整份SHA及HTTP Lua W01–W06六个获准子集SHA，追加74项；再追加R37单句修正后HTTP SSL28及Stream SSL21。Lua的init三项及lua_ssl_ciphers补证据仍待差异复核，本窗没有合入。相对691共新增129项，其他知识对象不变。

实际build得到1.27.1.1-513d4b289e7a100d，index SHA256 f416b7aabfe7e35f3e6bee070b54217cf4dee5e64db84bb9b36d08df096b7606；1017注册/820基础/197仅注册/0深度/8参考，范围true。发布详情与实际目录计数定向测试2/2通过。current已冻结交独立审核，历史发布保留；C02和C04仍未完成。

## 691正式发布增量（2026-10-13）

691正式增量独立审核通过。主用63116限时HTTP及createKnowledgeClient逐查Mail非TLS31，全部matched/basic、release2a787ebf4c204bed且limitations逐对象等于获准草稿。ego-browser复用TaskSpace1/p1显示691计数，mail.server查询imap_auth真实展示R35初始响应分支说明、源码入口及两段新增固定来源。仅桌面，无手机或邮件服务实测。

677正式接入独立审核通过，R36关闭。主按POP3/SMTP/proxy/realip四个已审子集SHA核验后追加Mail剩14；Mail非TLS31至此全部接入。实际build为1.27.1.1-2a787ebf4c204bed，index SHA256 5a61d6dddab2884a08daeaa496bf54bd0acf5baa492f31b167bb9bb6d5884d1f，1017注册/691基础/326仅注册/0深度/8参考。发布/计数定向2/2通过，current冻结交独立正式审核；P21 memc/Redis候选30未混入，历史发布保留。

## 677正式发布增量（2026-10-13）

670正式接入独立审核通过。主此前在61463限时HTTP用createKnowledgeClient逐查Mail包装/core10，全部matched/basic且release1461418be8e9b8d9。R35已关闭后，按两个已审子集SHA合入auth_http4与IMAP3共7项，未合入R36及其他待审对象；实际build发布1.27.1.1-b809249ff0c46d2d，index SHA256 fa89a5024557bcac4b63553f261e053583c108f6277802b02d8143c0b07d8a1e，1017注册/677基础/340仅注册/0深度/8参考。发布和计数定向2/2通过，正式接入交独立审核，current冻结。memc11隔离681候选不计正式覆盖。

## 670正式发布增量（2026-10-13）

660正式增量及R34已经独立通过。按Mail第一窗口限定的ngx_mail_module/ngx_mail_core_module筛选10项，子集序列化SHA15af25c21ea8b6de2c84c51b69dd7bd10447274b0d7b14163909d9d10c428ac1核验后精确追加。真实build得到1.27.1.1-1461418be8e9b8d9，index SHA8b2fe93419e3f988a29f90136de98fd33c1006ea3a1325ed0cd97634ac63c068；1017注册、670基础、347仅注册、0深度、8参考。发布/目录定向2/2通过，正式接入独立核验中；剩余Mail21未提前合入，current随后冻结。

## 660正式发布增量（2026-10-13接续核验）

主在61463限时HTTP使用正式createKnowledgeClient查询新增67项及HTTP旧一项修正，共68次均matched/basic，release固定d3966b115cc98f81；SNI相关限制与获准草稿逐对象相等。继续复用TaskSpace1/p1，http.location下proxy_ssl_server_name详情真实展示R34新条件、660计数和固定来源。无手机验收或OpenResty运行，未创建新浏览器空间。

前轮已实际构建1.27.1.1-d3966b115cc98f81，1017注册、660基础、357仅注册、0深度、8参考，范围true；current index SHA256 3a660b01c31b76c0ea72202260811554be813dc8ed21aea8569396e31eb889a5。基线593，按R32/R33放行SHA新增gRPC/Memcached39及Stream代理28，并仅修正既有HTTP proxy_ssl_server_name的一句SNI限制。真实build和发布/目录定向测试2/2通过，旧发布保留。当前接续独立正式审核及R34闭环，期间不再根build；未宣称C02/C04完成。

## 593正式发布增量（2026-10-12）

593独立正式接入已通过，详见审核记录。主在63484临时HTTP通过现有querySingle逐查新增77项（给定真实context/module），均matched/basic且release=e33f9a74f8157679。复用TaskSpace1/p1查询uwsgi_ssl_server_name，页面显示593计数、R31收窄条件、NGX_HTTP_SSL条件及固定源码入口；未做手机或TLS服务实测。

以前516/76405f32ab987818为基线，按独立审核放行的SHA合入Stream routing/access9、variable/limit8、uWSGI60，共77项；uWSGI R31只收窄SNI跳过条件，独立差异复核已关闭。实际构建得到1.27.1.1-e33f9a74f8157679，index SHA256为0318e3bb456cccd7514b374cef738aff0fb948afefd91ca4943e6c831951339e。1017注册、593基础、424仅注册、0深度、8参考，inventory_complete=true。

主实际运行npm run build及发布详情/发行目录计数两项定向测试，2/2通过。本次无网站程序修改，不重复此前无变化的全套功能用例；最终全站回归仍留在C04。前516正式接入及HTTP/2废弃标记R30已独立通过，新593正式接入交审核，不把准备通过等同最终接入通过。历史发布保留，部门样例和Codex接入不在本次完成口径内。

日期：2026-10-10。本记录随实际批次推进更新，不替代独立审核或整站完成条件。

## 当前新增发布

2026-10-12：正式当前1.27.1.1-76405f32ab987818，1017注册、516基础、501仅注册、0深度、8参考、范围true；index SHA256 1cd2225abd38696d80afda2ab798166f715a2fd8ae659d08dc282f54483d4406。在已独立通过的504基线上合入R29放行Stream core12（SHA03b621cb...），并只给八个HTTP/2 obsolete对象增加R30放行deprecated:true。实际build及发布/计数定向2/2通过，未修改旧发布目录；交独立正式接入核验，期间冻结current。

R30主复验闭环：原60307预览正常到期（进程exit0），按既有配置重启限时61357，复用TaskSpace1/p1。真实createKnowledgeClient逐项查询八个旧指令，均matched且deprecated===true、Markdown含“废弃状态：已废弃”；新增Stream core12全部通过带context/module查询并锁定76405f32ab987818。桌面http2_max_requests详情的warning徽标与状态段都为“已废弃”，正文仍说明忽略参数。没有程序代码改动、新永久测试或调试临时文件；采用实际HTTP断言红→绿及桌面验证，修复原因是已知废弃事实未写入结构化字段。下文504待修表述保留为历史证据。

2026-10-12：正式当前更新为1.27.1.1-c084cd9580c5b527，1017注册、504基础、513仅注册、0深度、8参考、范围true。FastCGI49/SCGI44/响应过滤35/可选库22/协议24共174项按review合入窗口六份冻结SHA核验，并验证身份无交集后追加；实际build和发布/计数定向2/2通过。index SHA256 7bedde5af09b5370ce1a954e53657b90ffa2d626dd40f5c02bb8a74719a5e13f。已交正式接入独立核验，此期间冻结current；Stream29与uWSGI60仍候审，未混入504。以下330及更旧表述保留为当时记录。

504桌面新增复测（复用TaskSpace1/p1，60307限时预览）：fastcgi_send_lowat显示R25 post绑定204–205及平台限制；scgi_cache_valid显示修正后按配置顺序首匹配的any语义；perl_modules显示默认未知及R26新增982–986/1054–1058固定SHA链接。http2_max_requests正文正确显示废弃、忽略参数，但状态栏仍“废弃状态：未核实”。真实createKnowledgeClient HTTP查询的断言deprecated===true失败（actual null），定位到P14八个obsolete知识条目缺deprecated字段，现有build/UI均已支持；为保留504审核基线暂未改写，待短窗口补元数据并重新跑HTTP/桌面断言。该缺陷未闭环，不宣称本批桌面全部通过。

2026-10-12桌面续验：用户允许替代验收空间后，新建并复用TaskSpace 1/p1，限时55946预览，正式330/c66c7c93f58b312c。events片段真实操作提取3项，目录仅有events/multi_accept/worker_connections；选中multi_accept后显示对应事件模块正文、限制、socket_cloexec补丁及固定SHA源码链接。用户原server片段提取8项，显示外层http/stream缺失的上下文提示，目录22候选且不自动显示无关详情；手动包入stream后提取9项，内部8项均唯一匹配Stream模块、目录9项，未报解析失败。未做手机或OpenResty运行验证。该批正式31项接入独立审核已通过，见review的330收口；整站内容和最终C04仍未完成。

2026-10-12续：当前正式candidate `1.27.1.1-c66c7c93f58b312c`，1017注册、330基础、687仅注册、0深度、8参考、范围true。P08文件/媒体17与P09压缩/切片14按已审冻结SHA合并31项，R23/R24仅修改两条真实post绑定与ETag条件，均独立关闭。实际build和发布/计数定向2/2通过，正式接入已交独立核验，期间current冻结。前299发布正式接入已独立通过，以下其待审表述保留为当时历史。

P10第一组addition/headers/sub/browser14项已准备121来源、93段Nginx原文保持及34补丁/142hunk/47摘要；隔离313/8b6871277ec3a71b通过，不计正式330之外覆盖。charset/SSI/userid与FastCGI继续；没有新的浏览器验收结论。

当前正式candidate已构建为 `1.27.1.1-5938e3d7ce7b0a14`：1017注册、299基础、718仅注册、0深度、8参考、范围true。四批102项（变量9、限制/镜像14、代理68、upstream11）按独立审核冻结SHA逐份核验后合入；R18–R22均关闭，其他知识对象保持。实际build与发布/计数定向2/2通过，已交独立正式接入核验，在此期间current冻结。P08文件/媒体17项仅准备及候审，不计299之外覆盖。

299版真实HTTP读取客户端使用限时52561预览完成七查询：proxy_pass、proxy_read_timeout、least_conn、map_hash_bucket_size、limit_req_dry_run、mirror_request_body、secure_link_secret。均matched/basic并锁定5938e3d7ce7b0a14，Markdown保留对应修正与限制；proxy_pass详情phases真实为content。该检查不等同于浏览器操作或Nginx运行。上一51093预览正常到期后按既有配置重启临时服务。

2026-10-12续：正式已更新为 `1.27.1.1-f8d93a840d4f0719`，1017注册、197基础、820仅注册、0深度、8参考、范围true。日志/状态6项准备通过后接入，实际build和发布/计数定向2/2通过，独立正式接入审核也已通过。前一191版本的19项接入已独立通过，以下旧“待收口”是当时状态。

真实HTTP静态客户端在限时51093预览分别查询HTTP log_format、stream log_format、stub_status off与HTTP access_log，均matched/basic且锁定f8d93a840d4f0719，Markdown保留相应说明；没有把两域同名日志格式混淆。191版前轮六查询亦完成相同HTTP检查。本次恢复Space8返回task space not found，未新建空间绕过，也未声称197版完成桌面验收；已有桌面结果只适用于其记录的旧发布。

变量/链接校验9项准备已完成74处来源/49段Nginx原文/34patch142hunk47hash检查；隔离197+9=206候选673f9696c504e1fb通过，未进正式197。完整P01 upstream11草稿已恢复并送独立审核，proxy68按R18–R20差异修复，均不计正式覆盖。

当前candidate `1.27.1.1-ea24760d6fa6cabf`：1017注册、191基础、826仅注册、0深度、8参考、范围true。访问/认证12项与rewrite7项准备审核通过后按精确19身份增量接入；R17修正句真实写入return限制，实际build成功。仅内容变化后发布/计数定向2/2通过；19项实际接入、旧172及8参考保持待独立收口，current在此期间冻结。

桌面Space8/p1，限时 http://127.0.0.1:58927/ 实际1017/191。allow、auth_request_set、real_ip_recursive、valid_referers、HTTP set、return 六项输入与详情/基础状态/固定源码链接对应，通过；最后一项展示R17收窄措辞。上一49305预览按配置自动结束，页面连接拒绝后先观察，再续开临时服务，未新建空间或把服务过期当产品故障。

HTTPproxy68完整草稿与P12日志/状态6项已交独立审核，不计正式191之外的覆盖。日志6项最终59处来源、45段上游引用中42保持3变化、142hunk/47摘要通过；隔离191+6=197候选通过，不是正式197。实施继续HTTPupstream/算法11项；规划已冻结完整剩余批次，仍无全站完成结论。

## HTTP核心172项发布已验收

已验收 `1.27.1.1-42e772f85f1511da`：1017注册、172基础、845仅注册、0深度、8参考、范围true。HTTP核心剩27项逐条准备审核通过后按精确差集接入；实际build成功，与独立隔离候选release一致。发布/真实计数定向测试2/2通过；正式接入及旧145/8参考保持独立审核通过，235处新增发布来源逐字核对，重算release摘要一致，非仅准备审核结论。

桌面仍复用Space8/p1，当前限时预览 http://127.0.0.1:49305/，实际展示1017/172。server_tokens、error_page、resolver、open_file_cache_events四查询均为基础内容，HTTP/3 off、no_error_pages继承互斥、local扩展、vnode条件及固定Git链接均真实展示，通过。相同四项通过真实HTTP静态读取客户端为matched/basic，Markdown保留详情说明并锁定42e772f85f1511da，通过。不是OpenResty运行或配置有效性检查。

主新增访问/认证12项和rewrite全模块7项仅候审：分别105/60处有效来源，81/46段上游片段在实际34项补丁/142hunk/47摘要核对后保留；隔离build分别为157/179基础候选，不计正式172之外的覆盖。HTTPproxy68由实施角色独立生产。仍未完成C02/C04。

## 前一已验批次

已独立验收发布 `1.27.1.1-92e11537fd436a31`：1017注册、145基础、872仅注册、0深度、8参考，inventory_complete=true。C01正式范围独立验收通过；C02全基础与C04最终交付仍未完成，部门深度待样例。

43组件为22正式构建注册、8运行时/库/工具用途、13Lua参考库。主实际inventory成功且catalog字节SHA256仍为1a625dd29a400e23d49437082a895e7d4f37bab9bcd97c2e859415871531399c，范围门禁没有改原身份/字段；实际build成功。独立审核重算22个构建门禁完整结果、195份范围证据、双有效补丁scope，核对57新增内容、旧88基础及8参考保持、全部2479段发布固定来源，通过。

`npm test`最新实际84/84通过，0失败、取消或跳过，耗时约36.8秒。包含新增完整范围与catalog全身份/字段/补丁映射一致性检查及5种负例；单项callback隔离夹具明确标为部分范围。正常完整目录再次build仍为同一发布。此前83/83属于新增门禁之前的历史执行。

新增catalog-scope门禁独立差异审核通过。审核角色另外在隔离目录执行5次实际坏catalog构建（截短、改名、改回调、改条件、改发行补丁摘要），均在发布前拒绝、保留原索引且无部分发布，根current未变；没有仅凭单元测试推断写盘安全。

坏最后指令及坏最后参考隔离脚本均通过：拒绝且保当前、无部分发布，参考变化/范围变化分别进入新发布身份，范围回退不改变注册及基础分母。rootcurrent未被隔离脚本覆盖。

桌面继续复用TaskSpace8/p1，限时HTTP地址 http://127.0.0.1:51647/。实际页面展示1017/145及“范围盘点已完成 · 功能覆盖另计”；分别输入root、alias、keepalive_timeout及client_header_timeout，核真实详情、不同路径语义、空闲与响应头时间区别、不保证发送408报文、默认和固定Git来源，均通过。该地址是限时验收服务，不作为固定交付地址。另实际HTTP查询root、client_body_in_single_buffer、client_header_timeout均为matched/basic，Markdown保留同一详情说明并锁定92e11537fd436a31发布，通过。

HTTP核心剩27草稿已就绪并交独立审核，仅在隔离构建得到172基础候选；尚未正式接入，不计当前145覆盖。实施角色继续独立准备HTTP proxy全部68项，主不重复其研究。

## 前批已验记录

冻结发布 `1.27.1.1-c049ff9edb810ae4`：1017注册、88基础、0深度、8独立参考；929项仅注册，inventory_complete=false。43组件已检查不等于正式构建范围闭合。C01/C02及C04整体验收未完成；部门样例待提供，Codex真实接入和内网部署后移。

本批新增59项基础内容（核心/事件35、Echo/Headers More22、补丁指令2）由独立审核核对全部496段固定来源、真实配置函数定义、全部旧29基础项及8参考保持，通过。详细证据见 WEBSITE_COMPLETION_REVIEW.md。固定官方文档为 nginx.org revision e8b581903e9d41252720053311cea687a5671674，XML注释不作为有效文档节点。

## 自动检查

- `npm run build` 成功，生成上述发布。
- `npm test`：75/75通过，0失败、0跳过。包含真实盘点CLI、发行补丁回放、Redis来源桥、scope分类负例、解析/查询/MCP/发布与参考契约；不包含浏览器脚本。
- `node analysis/verify-build-gate.mjs --config project.config.json`：故意破坏最后一项 redis2_next_upstream，实际拒绝；当前索引不变，无新发布写入。
- `node analysis/verify-reference-build.mjs --config project.config.json`：最后一个坏参考实际拒绝，当前索引不变且无半成品发布；仅参考变化和仅覆盖状态变化分别产生新发布，参考变化不改变指令覆盖分母。所有修改只在隔离副本。

## 桌面浏览器

按用户授权，本轮复用桌面 TaskSpace 8 / p1，不做手机验收。临时本机HTTP预览由项目配置限定时长，不是常驻业务服务。此前本轮已实测 events 片段三个身份对应本次输入、worker_connections详情可选，目录不再关联无关旧详情。

本批通过现有 `test/browser/accuracy.mjs` 实际执行：网站与查询Markdown保留相同事实、状态及文档链接；请求仅静态GET，不包含测试配置值；availability={}被拒绝并撤销旧详情、保留候选；真实 stream proxy_timeout 显示两次连续读写、继承、Lua覆盖和补丁影响。注入脚本在finally移除并重载页面。验收使用临时地址 http://127.0.0.1:61338/，不将其作为长期交付地址。

在复用空间的新限时地址 http://127.0.0.1:49701/ 实际查询 no_error_pages;（http.server）：显示无参数语法、取消父层映射而非关闭内置正文的说明，以及真实OpenResty补丁注册和callback:71–86固定链接，来源没有冒充上游坐标。

后续HTTP core hash/types/path10与transport17条仅准备；修正WC-R10/WC-R11后共同隔离build115basic成功，正式仍88basic。两组分别回放34patch并核47文件摘要、所引58/103段保留；前组原两段EOF截短不能替代范围有效性，已修为真实EOF且交build验证。准备产物待审核，不计正式完成。

本轮验收空间仍用于后续批次，尚未关闭。上述子集通过不代表网站全部知识或最终交付通过。
