# 网站阶段独立审核

## 当前状态与范围

本批网站程序功能审核通过，冻结 release 为 `1.27.1.1-a90b2ce291c5ed35`。W01–W04 完成，REF-01/REF-02 均已修复并关闭，无剩余功能阻断项。结论依据独立代码、内存调用、产物和来源检查，以及主线程落盘的构建门禁与四组真实浏览器执行记录。响应式仅有 744px 无横向溢出实测，390px 及截图未完成；不声明完整响应式验收通过。下方初审记录仅作历史追溯。

已完整读取 WEBSITE_PLAN.md（31 行），并对照 ready 产品逐项核查 W01–W04；网站程序、内容全量、部门样例、部署和后续 Codex 宿主分别验收。

本阶段以网站为优先，只审核 related 导航、single 外部引用提示、API/变量参考浏览、引用来源与版本、参考数据容错和并发、兼容旧发布及构建发布门禁，并检查确定的网站功能遗漏。Codex 宿主接入后移，不作为本网站阶段阻断。全量基础/深度内容、内网部署、部门正式样例分别记录状态，不能混为程序功能缺陷。

审核仅写 analysis/WEBSITE_REVIEW.md，不改代码、知识或构建，不开服务、不操作用户浏览器。已通过的上一批指令知识语义不重新全量审核；只检查本批重叠变更和新增参考项。

## 需求与最小实现判断

已完整读取 REQUIREMENTS.md、IMPLEMENTATION_PLAN.md、README.md，并核对当前页面、共享查询和构建相关路径。当前用户的网站优先顺序覆盖旧双入口阶段安排；旧 CLAUDE.md 中仅报告的历史约束不改变当前明确授权。

related 应用于知识浏览，不应把名称导航偷偷转为带猜测 module/context 的配置查询。API 与变量应有独立分类和来源，不应塞进 directives 使现有注册/基础覆盖计数膨胀。参考资源读取失败应局部隔离，不能导致配置索引和查询整体失败。现有版本化静态读取可直接扩展这些能力，不需要增加后端或现场模型解释。

## 修复前基线缺口（已落实）

| 编号 | 基线观察 | 依据与责任范围 |
| --- | --- | --- |
| W01 | related 有数据但没有网站导航 | build 保留 curated.related，validateDetail 验证 related 字符串数组；当前 renderDetail 未遍历 related。属于本批待实施网站功能，不是内容全量问题 |
| W02 | single 外部文件提示丢失 | parser 的 external_references 已保留 include 和外部 Lua 参数；配置片段 resultRow 展示提示。但 querySingle 丢弃 single.directive 的 external_references，single 页面只展示匹配和候选，无同等提示。违反需求 Q7 的两个输入模式均应明示外部未分析 |
| W03 | API/变量参考浏览入口未实现 | 当前 index.html 只有指令目录，客户端与 build 仅 index/directives 契约，没有 refs 分类、索引或详情路径。需求 Q8 已明确参考浏览，属于本批确定功能缺口；8 个真实样例足以验证程序通路，不代表参考内容全量 |
| W04 | 当前发布哈希只含指令准备数据 | build 的 createHash 输入为 prepared，没有参考数据。添加参考内容时必须一起纳入身份，否则仅参考变化可能复用同一 release，形成覆盖冲突或错误的发布身份 |

其他已明确的网站核心功能在现实现中有实际调用路径：单条/片段/完整文本入口，context/module 查询选项，全目录按名称/module/context/阶段筛选，查询候选模式与旧详情清理，歧义手动选择，源码片段与元数据，默认/继承/依赖/文档/补丁状态，固定 release 永久链接。该代码盘点不代替本批实际回归，不因上一批已过就推断重叠变更无风险。

目前没有另发现需求明确要求但除此之外确定缺失的程序功能。解析器保留参数、原 token、位置和 parent_index；页面显示位置/context，但是否需新增完整层级或参数可视化应依落盘方案判定，不擅自增加功能要求。深度调用链内容不足归入内容待验收，不自动要求新增图状导航。

## 预备验收条件

| 编号 | 场景 | 独立核查通过条件 |
| --- | --- | --- |
| A01 | related 名称有多模块候选 | 列出明确 module/context 身份供选择，不取第一项、不复用当前条目模块作为猜测；缺项显示未收录。导航不改变输入、原 parsed-results 或原匹配状态 |
| A02 | related 目标只有一项/失败/连续选择 | 明示知识浏览来源；采用捕获的固定 release；迟到成功、失败及收尾动作不覆盖后选项。导航失败不伪装为原配置解析失败 |
| A03 | single include 或 Lua 文件参数 | 未知、匹配成功和详情失败时均保留本次外部未分析提示及原词法值；变量不展开、文件不读取，无上传参数或请求外部路径。检查共享结果与页面真实消费路径 |
| A04 | 参考分类与样例 | 有 Lua API/变量明确分类、名称/组件/版本/核实范围；至少约 8 个真实样例可浏览并查看证据。参考项不进入配置自动匹配，不计指令注册/basic/deep 覆盖；没有全量完成措辞 |
| A05 | 参考事实及 sources | 逐条与冻结 Git 原文核对新增事实和范围；source revision/component/version/file/行号/code/URL 一致，证据 id 唯一且引用闭合；区分文档参考和配置指令语义，不把 HTTP API 推为 stream 可用 |
| A06 | 固定发布与旧链接 | refs 路径位于当前固定 release 且验证身份/版本；旧发布缺 references 路径时仍可启动、查询配置、查看永久详情；不能误把“旧版没有参考”当部署损坏 |
| A07 | 参考数据损坏 | 参考索引/详情缺失、坏 JSON、嵌套字段畸形或跨发布均局部明确失败；不得 throw 到页面未捕获分支，不撤销有效配置索引，不损害 config query |
| A08 | 最后选择获胜 | 指令与相关项共用指令详情的失效边界，迟到 success/catch/finally 不覆盖后选项；参考区为独立面板，只核查其区内最后选择获胜，不要求跨区抢选中或撤销彼此有效详情 |
| A09 | 发布身份与门禁 | release hash 包含 refs 实际内容及证据；仅修改 refs 可产生新身份。全部指令和参考 index/details 在任何目录创建/写入/页面复制/current 切换前统一校验；坏最后参考也拒绝并保留 current |
| A10 | 保持指令契约 | 历史 release、同名歧义、孤立 server 未知、唯一知识预览、外部未分析、错误详情清理及无配置上传均有与改动相称的回归；refs 与 directives 的 id/链接分类不混淆 |

## 功能与验收状态分类

| 类别 | 当前状态及判定 |
| --- | --- |
| 网站程序功能 | W01/W02/W03 已接入，W04 版本及写前门禁已落实；独立检查与本批主线程实测证据见文末 |
| 指令内容全量 | 上批发布 876 注册/18 basic/0 deep、inventory_complete=false；数字来自本会话已独立核对产物。本批需重新检查引用计数是否保持含义，不宣称全发行版完成 |
| API/变量内容全量 | 约 8 个样例只证明参考浏览通路及样例事实，其他参考覆盖保持待完善 |
| 内网部署 | 未验收；静态站点和托管说明不等于实际内网环境上线。无需为本批擅自部署 |
| 部门样例 | 正式脱敏样例及深度优先级未验收，不用自选样例代替；与确定程序缺口分开记录 |
| Codex 宿主 | 后移、独立未验收，不阻断当前网站阶段，不据网站通过宣称其通过 |

## 后续审核与证据来源

待方案落盘后完整阅读；待 ready 与明确 release 后固定对象，再独立执行只读内存客户端、实际页面渲染函数、坏数据与并发路径检查，读取不可变发布并逐条核对新参考来源。构建写入行为只读审查及对照主线程隔离实测记录，不执行会写其他文件的构建/回放脚本。

主线程负责真实浏览器及构建实测，审核分别标注自己的代码/内存检查与主线程执行记录。现阶段未检查新参考知识、未运行测试、未重审旧全文知识，不给最终通过结论。

## 8 条参考知识输入独立审核

已完整读取 knowledge/references.json，并按 components.json 中冻结 revision 用 git show 逐一读取其 20 段 evidence；全部起止范围有效，共 4 条 lua_api、4 条 variable。主来源为 HTTP Lua 0.10.27（ea09d92adf835e30cab8d79343c7b8266e888128）、Nginx 1.27.1（e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928）；交叉来源为 lua-resty-core 0.1.30（2da3d7719a05b2981f3808ca874517b558f29fa9）及 OpenResty 1.27.1.1（8c37412c31621225e7aa7e825b5b50106c9c71c4）。这是知识输入及语义检查，发布中的 source 生成尚待最终产物核对。

### REF-01 / P2：ngx.log 的宏默认条件（已关闭，以下为初审记录）

位置：knowledge/references.json:5。当前“补丁将 NGX_MAX_ERROR_STR 从上游 2048 改为 4096”省略条件。冻结 larger_max_error_str.patch:8-10 实际为 #ifndef NGX_MAX_ERROR_STR / #define ... 4096 / #endif。正确表述应为“未预先定义 NGX_MAX_ERROR_STR 时，补丁后的默认值为 4096；已有宏定义时不覆盖”，不能据此承诺目标编译配置固定为 4096。

建议顺带在同一限制说明明确该宏限制包含日志前缀和换行，并非全部都能用于 ngx.log 用户消息。冻结 README:5974 及 ngx_log_error_core 的 errstr 分配、时间/等级/进程前缀和换行截断代码支持此事实；如加入该说明，补证据到 README:5974 或 src/core/ngx_log.c:110-158。补丁应用证据 mirror-tarballs:353-356 本身正确。

### REF-02 / P2：shared dict set 的 nil 删除语义（已关闭，以下为初审记录）

位置：knowledge/references.json:23。当前“可存布尔、数字、字符串或 nil”容易把 nil 描述成可持久保存的数据类型。FFI wrapper 的 LUA_TNIL 传入 C 后，固定 ngx_http_lua_shdict.c:1409-1413 对已有键跳到 remove，1472-1479 删除节点；1487-1492 对无数据缓冲直接成功返回，不创建新值。

建议改为“可存布尔、数字、字符串；传 nil 用于删除该键，不支持直接存储 Lua table”，并新增上述 C 删除/不创建路径证据。目前引用的 lua-resty-core 478-562 仅证明 nil 传入 FFI，不包含底层删除语义。单次写入原子性、exptime 秒/0 不过期、forcible 与有效数据淘汰的说明由现有 README 7099-7146 支持。

### 其余核对结果

| 参考项 | 当前结果 |
| --- | --- |
| ngx.log | 接口、等级、HTTP Lua 范围及错误日志区别成立；REF-01 已补默认条件/前缀限制及 core 证据，关闭 |
| ngx.var | 已定义/可修改才可赋值、不动态创建变量、HTTP/stream 区分均有冻结 README 和 FFI 拒绝分支支持 |
| ngx.shared.DICT.get | 不存在/过期返回 nil、错误说明、DICT 占位及对象参数/冒号语法成立；没有承诺所有错误均只返回不抛出 |
| ngx.shared.DICT.set | 秒级过期、淘汰与事务边界成立；REF-02 已改 nil 删除并补 C 证据，关闭 |
| stream $remote_addr | getter 返回 connection.addr_text；对前置代理地址不作终端用户判断，限定适当 |
| stream $upstream_addr | 无 upstream_states 时 not_found，多个 peer 按逗号空格拼接，描述成立 |
| stream $session_time | 当前/开始时间差、负值截 0、三位小数秒，与超时配置区分成立 |
| stream $status | 对 s->status 用 %03ui 格式化，stream 常量为会话状态，未混为透传 HTTP 响应码 |

上述参考条目不作全量 basic/deep 声明，冻结版本范围及样例分类符合本批目标。REF-01/02 已由主线程修知识，独立复核确认进入本批产物，未发现其他确定语义问题。

## 修改归属确认

本审核线程从未修改 src/query/knowledge.mjs，也未修改其他产品代码、knowledge 或 build；只写会话明确指定的审核文件。现新增 validateReferences/loadReferences/relatedCandidates 不属于本审核者改动，不能据本线程历史将其覆盖或还原。

只读检查时该模块 SHA-256 为 99ab8ddb8eee94f4ba1d968453ef5ea4a5e222042a5d87bb991d2491251e2ad4（修改中定位点，不作为冻结 ready 校验值）。目前 relatedCandidates 按名称返回所有 id，loadReferences 对旧 index 无 references_path 返回 not_provided；这里只确认这些函数现已存在，不提前验收产品接入、并发或发布门禁。

## 第一轮冻结产品审核

对象：1.27.1.1-a90b2ce291c5ed35。完整读取方案、src/query/knowledge.mjs、site/app.mjs、index、参考样式、scripts/build.mjs、参考测试及隔离构建脚本。审核只读执行测试和内存回放，没有构建、服务、浏览器或文件夹具写入；此阶段不使用尚未落盘的主线程实测记录作为通过依据。

### 实际调用与契约

| 方案项 | 独立结论与依据 |
| --- | --- |
| W01 related | 静态与内存回放通过。app:80-94 从当前 index 按名称列全部 module/context 候选；未收录明确提示；点击进入原 preview，不修改输入、解析结果或 queryCandidates。真实 renderDetail 产生的相关按钮回放后，原输入/解析/候选列表保持不变 |
| W02 single 外部提示 | 静态与内存回放通过。app:170-173 收到结果并校验 generation 后，用 parseSingle 原文获取 external_references；在未知或知识失败提前返回之前显示。parseSingle 不做 I/O，参数不交给 fetch。实际 submit 对 include /SECRET/$host/*.conf 显示原词法值和未分析说明 |
| W03 参考浏览 | 静态与内存回放通过。index:42-47 为独立区，按名称/类型筛选；app:249-287 同步选择一次已验证的参考对象，显示说明/限制/分类/组件及固定版本来源。独立参考面板不修改指令详情或匹配结果；同步连续选项自然最后选择获胜，没有额外详情异步请求需要跨区序号 |
| W03 参考失败隔离 | 独立客户端通过。loadReferences 捕获读取/校验错误为局部结构化失败；app:289-300 仅写参考区。坏 references={} 后实际 querySingle 仍成功 matched。配置 ready 标记在加载参考前设置，不把参考失败呈为配置初始化失败 |
| W04 旧发布 | 独立实际旧 index 检查通过。读取不可变 e27dbc95131afc51 index，无 references_path；validateIndex 接受，loadReferences 返回 not_provided 且不读参考，页面提示配置查询仍可使用。现有配置永久详情路径未改变 |
| W04 hash/固定路径 | 独立产物重算通过。references_file 来自配置；hash 输入为全部 prepared directives 和 prepared references，含固定源码证据。由实际输出去掉发布包装字段重算得到 a90b2ce291c5ed35；只改参考摘要，内存重算 hash 改变；references_path 严格限制同 release 路径 |
| W04 写前门禁 | 静态及纯校验运行通过。build 先生成全部数据并调用 validatePublication，验证 declared references 后才 mkdir、详情/参考/index 写入、页面复制及 current rename。坏最后参考与已声明但缺 references 均被拒绝。实际隔离写入行为仍待主线程实测记录，不冒充已独立运行 build |

### 校验与并发重点

validateReferences 先检容器、schema/release/OpenResty 版本，再检重复 id、kind 枚举、名称/组件/正文、限制字符串数组、参考核实状态；源码共用 validateSources 检查元素、revision、范围、代码行数、URL 及重复 source id。reference_verified 要求非空正文和来源。参考项不进入 directives 或 matchDirective，覆盖计数仍只依据指令。

related 与普通候选都使用 preview 的 query generation 和 previewSequence，成功/失败更新前双检查。独立受控内存 getDetail 回放旧请求成功和失败迟到，后选 proxy_timeout 详情保持；相关浏览没有重新提交 querySingle，也没有自动套用原 detail.module。参考区只有一次整体加载，条目点击/筛选为同步，两个详情面板独立；当前不存在参考异步详情与指令抢选中的路径。

### 独立执行与产物证据

- `node --test test/references.test.mjs test/knowledge.test.mjs`：23/23 通过，包括参考契约、局部坏数据、旧版无路径、固定来源原文、相关多模块、最后参考门禁及重叠知识契约回归。
- 实际调用 validatePublication 对 876 条详情和本发布 8 条参考统一校验通过。计数仍为 876 registration、18 basic、0 deep，参考 4 API/4 variable 没有混入指令覆盖。
- 新参考 23 段 sources 与所指定固定 Git 原文逐字一致；摘要、限制与知识输入一致。REF-01 条件默认/日志前缀及 core 源码，REF-02 nil 删除及 C 分支均已进入产物，两项关闭。
- 独立重算实际发布 hash、仅参考变化 hash、页面 app/index 与共享 query 的源码/dist 逐字一致均通过。
- 用实际页面代码的内存节点执行 renderDetail/preview/submit/renderReference，相关按钮不改原结果、迟到成功/失败不覆盖、独立面板、single 外部提示均通过。一次初始 VM 因未移除 start 中 import.meta 不能执行，缩小到被审实际函数范围后成功；不是产品失败或浏览器执行。

### 待补与边界

未发现本轮 ready 代码的确定阻断问题；W01/W02/W03 基线功能缺口已接入，W04 静态发布条件已落实。还需主线程实际隔离 build 证明坏数据不写入/参考独改改变 release，以及真实浏览器导航/筛选/旧版/坏库/并发回归记录。analysis/verify-reference-build.mjs 已只读审查，其调用真实 build 的失败和两次成功分支符合该目标，审核没有运行该写入脚本。

网站功能矩阵未发现除此之外确定遗漏的程序功能。全量指令/参考知识、部门深度样例、内网部署仍未验收；Codex 宿主后移，均不作为当前网站程序阶段的新增阻断。产品阶段最终结论暂待上述运行证据收口。

## 方案与已落盘实测对齐

已完整读取 WEBSITE_VERIFICATION.md、WEBSITE_REFERENCES.md，并完整检查实际 test/browser/website.mjs。没有修改这些文件，主线程实际执行结果与本审核独立运行分开记述。

| 方案项 | 当前验收状态 | 独立检查与主线程执行记录 |
| --- | --- | --- |
| W01 related 导航 | 条件满足，无阻断 | 独立名称全候选/原输入结果不变/旧 success 和 fail 隔离；主 website.mjs 实测选择 stream proxy_pass、返回原条目、迟到关联成功/失败均保留最后选择 |
| W02 single 外部提示 | 条件满足，无阻断 | 独立纯解析及 include 真实 submit 函数；主实测 include、外部 Lua 成功和详情失败均提示未分析，静态请求 GET 无 body 且无 PRIVATE_EXTERNAL 参数 |
| W03 参考区 | 条件满足，无阻断 | 独立分类/来源/内存选择/坏库仍可配置查询；主实测 4 API/4变量筛选、最后选 $status、原指令详情不变；bad_json/404/cross_release/bad_nested 均局部失败，config query 正常 |
| W04 发布与门禁 | 条件满足，无阻断 | 独立 hash 重算、纯门禁、旧真实 index、全部新 sources 原文；主两个真实隔离 build 脚本拒绝坏最后指令/参考且 current 保留，无部分 release，仅参考变动改变 release 且计数不变 |

主记录还包括实际 build 成功、45/45 全套测试、node --check、query-ui 实测通过。本审核独立运行的是 23/23 参考及知识测试、产物校验/来源比对/hash 及实际页面函数内存回放，不把主线程 45 项或浏览器操作冒充独立执行。

此阶段主线程执行消息确认 query-ui-async 完整通过，当时落盘文件仍未同步；随后已复读更新后的 WEBSITE_VERIFICATION.md，query-ui-async 与 accuracy 均明确记为全部通过。消息与文件都是主线程执行记录，不是人类用户自行验证，也不是审核者重复操作浏览器。响应式截图未完成，具体边界见最终结论。

WEBSITE_REFERENCES.md 对 HTTP API/stream 变量边界、DICT 占位、宏条件默认、nil 删除及未运行环境的说明与独立检查相符。原文 reference_verified 仅表示所列参考事实已核对，不计配置基础/深度覆盖，也不表示全部参考知识完成。

REF-01 关闭依据：本发布 ngx.log 限制明确未预先定义宏时默认 4096，缓冲区含日志前缀；新 core ngx_log.c:110-158、固定 patch 与生效脚本逐字核对通过。REF-02 关闭依据：本发布 set 限制明确 nil 删除而非存储 nil，新增 shdict.c:1409-1413、1472-1492 原文支持；23 段 sources 全部准确。

目前没有需要返回实施的具体产品问题。accuracy 重叠回归已由主线程执行并落盘通过；响应式剩余实测单列，不以内容全量、内网部署、部门样例或 Codex 宿主后移阻断本网站程序阶段。

## 最终本批程序结论

本批通过，无需打回实施。已完整复读更新后的 WEBSITE_VERIFICATION.md，四组真实浏览器回归 query-ui、website、query-ui-async、accuracy 均由主线程实际运行通过，注入夹具已移除。两个隔离 build 门禁、参考独改发布身份、45/45 全套测试及静态构建也有主线程执行记录。审核自身的 23/23 测试、实际函数内存回放、来源逐字核对、hash 重算及固定发布兼容检查单列，不将这些主线程实测冒充审核者或人类用户验证。

W01 导航保留所有模块候选且不修改原查询；W02 单项外部引用在成功/未知/详情失败时明示未分析且不 I/O；W03 API/变量独立参考区、分类来源及坏库隔离成立；W04 固定发布、refs 纳入 hash、旧发布无 path 兼容及完整写前校验成立。REF-01 有条件默认 4096 与日志前缀限制、REF-02 nil 删除语义及对应固定证据已独立复核关闭。

最终收口只读确认 current 与本 release 不可变 index 一致，app/index/query 源码与 dist 对应副本一致。未扩展审核到旧全文知识或新的产品功能。

响应式剩余证据：主线程真实 744px 视口 document.scrollWidth=744，无页面横向溢出；截图因自动滚动超时后原 TaskSpace 5 失效而未完成，390px 手机视口也未实测。不写截图成功或完整手机适配通过；截图并非 WEBSITE_PLAN 的功能通过条件，此会话工具限制未提供证据表明程序功能有缺陷，故不阻断本批程序结论。

覆盖仍为 876 注册、18 basic、0 deep、inventory_complete=false，8 个参考样例单独计数；全量指令/参考内容、部门正式深度样例、内网部署未验收。Codex 宿主接入后移且未验收，不阻断当前网站阶段，也不据本批通过宣称其已完成。

本审核仅修改 analysis/WEBSITE_REVIEW.md，未改产品、知识或构建，未开服务、联网或操作用户浏览器。
