# 部门扩展模块独立审核

2026-10-13。状态：本轮独立审核通过；R01–R03已关闭，无阻断项。最终release为 `1.27.1.1-948dd5954553c1bf`，实现、内容、测试及主HTTP/桌面验收证据已闭合。

## 深度交互：审核边界

依据 `analysis/EXTENSION_MODULE_PLAN.md` 的 E01–E04、A01–A09。审核负责实现与24项内容；主负责来源证据、HTTP和桌面验收。当前不运行 inventory/build，不编译模块，不修改实施文件。最终须将实施、测试和主验收证据绑定同一 release。

本地源码 HEAD 为 `52fe11e44c47a49b052be89e36dfa17d81bf52a5`，提交日期为2026-10-11，预审读取时工作树无修改。以下路径均相对于 `repos/nginx-module-vts/src/`。源码宏 `ngx_http_vhost_traffic_status_module.h:27` 为 `v0.2.7`，它不证明本提交属于同名发布 tag，现场版本与安装状态仍未知。

## 直接执行：内容预审基准

缩写：M 为 `ngx_http_vhost_traffic_status_module.c`，H 为同名 `.h`；S 为 `ngx_http_vhost_traffic_status_shm.c`，N 为 `ngx_http_vhost_traffic_status_node.c`；F/L/D/SET 分别为同前缀的 `filter.c`、`limit.c`、`display.c`、`set.c`。HSL 表示 http/server/location，SL 表示 http.server/http.location。下表除首项外，名称省略 `vhost_traffic_status_` 前缀。所有条目的实现内容审核状态均为待核对。

| 序号 | 指令 | 源码语义与必须保留的边界 |
|---|---|---|
| 01 | vhost_traffic_status | HSL，on/off。局部 enable 合并默认1，但主 ctx 默认0，zone 才启用主 ctx；不能只写默认 on 或把它描述为所有处理器的总开关。统计 handler 检查局部 enable，limit handler 不检查该字段。M:281、583、975、1124；L:13。 |
| 02 | filter | HSL，默认 on，可继承。控制自定义过滤统计、Host分组条件及读取统计变量处理，不是关闭全部统计。M:1125；S:521、558；SET:30。 |
| 03 | filter_by_host | HSL，默认 off，可继承。filter 与 filter_host 同时开启且请求 server 非空才按 Host 分组，否则使用 server_name，空名称回退 `_`。S:521。 |
| 04 | filter_check_duplicate | HSL，默认 on。配置期处理重复过滤规则，不是对请求去重。M:934、1069、1127；F:36。 |
| 05 | filter_by_set_key | HSL，1或2参数，键非空，键与可选组名编译为复杂值。http规则独立保留；局部未配置时继承父级局部规则，局部新规则不自动追加父级局部列表。两组在运行时分别处理。F:365；M:1069；S:558。 |
| 06 | filter_max_node | 仅http，非负数量及可选匹配前缀，默认0。作用于过滤节点范围，匹配实现为前缀比较而非正则；不能说限制所有 server/upstream 节点。M:702、972；F:336；N:过滤节点计数和LRU选择。 |
| 07 | limit | HSL，默认 on，可继承。控制VTS限额检查，还受主ctx和bypass_limit影响；开启不等于自动存在限额规则。L:13；M:1128。 |
| 08 | limit_check_duplicate | HSL，默认 on，配置期限额规则去重；不是重复请求检测。M:934、1085、1129。 |
| 09 | limit_traffic | HSL，member:size及可选返回码；默认503。读取已有统计量，严格大于阈值时返回指定码，不是每秒速率控制。http及局部规则分别检查；局部继承不是无条件追加。L:57、149、164；M:1085。 |
| 10 | limit_traffic_by_set_key | HSL，指定key、member:size及可选返回码；默认503。与09共用比较处理，配置不自动生成被引用的统计节点。L:259及limit_handler_traffic。 |
| 11 | zone | 仅http，无参或shared:name:size；启用主ctx并设置共享区。无参源码默认名称为 `ngx_http_vhost_traffic_status`、大小为 `0xfffff`，不是精确1MiB；显式大小小于8页被拒绝，同共享区重复绑定失败。H:51；M:583。 |
| 12 | measure_status_codes | 仅http。注册NOARGS与1MORE，但回调直接访问value[1]，无参数量防御，不能宣称无参安全。数字须100–599且非递减；源码允许相等，不能写严格递增或已去重。`all`分支是前三字节比较并提前返回，不能冒称严格全词/额外参数验证。M:153、520。README目录缺口，不标文档已核对。 |
| 13 | dump | 仅http，文件与可选周期；未配置不启用，周期默认60秒。worker初始化满足主ctx/dump/rbtree条件才调度和恢复，不保证现场文件权限及恢复成功。M:670、978、1167。 |
| 14 | display | 仅SL。注册允许0或1参数，但回调仅安装content handler、不读取参数；常用无参形式，不能发明该可选参数功能。README写http与源码冲突。M:167；D:1040。 |
| 15 | display_format | 仅SL，json/html/jsonp/prometheus，默认json，可继承。README写http与源码冲突。M:49、174、1132。 |
| 16 | display_jsonp | 仅SL，一个字符串，默认 `ngx_http_vhost_traffic_status_jsonp_callback`，可继承；不是选择输出格式的指令。M:181、1134；H:53。 |
| 17 | display_sum_key | 仅SL，一个字符串，默认 `*`，可继承；改变汇总键名称，不等于改变统计分组。M:188、1136；H:54。 |
| 18 | set_by_filter | HSL及location内if，不含server内if。两个参数，第一个须以$开头，第二个编译为复杂值，读取统计成员到变量，不是任意配置赋值。ACCESS阶段处理，受ctx/filter条件影响；不能承诺含本请求LOG阶段新增统计。M:195、850；SET:30、483。 |
| 19 | average_method | HSL，AMM或WMA及可选时间窗口，默认AMM/60秒，可继承；不是统计持久化周期。M:57、752、1138；H:55。 |
| 20 | histogram_buckets | HSL，一项以上，按3位小数解析为毫秒值，拒绝无效或0。默认无分桶，未设置继承父级；上限32，超过时日志后break并返回成功，不是整条配置必然失败。回调未检查排序，不能声称会排序或严格拒绝乱序。M:791、1142；node.h:12。 |
| 21 | bypass_limit | HSL，默认off，可继承；跳过VTS限额处理，不等于跳过统计或其他NGINX限制模块。L:13；M:1144。 |
| 22 | bypass_stats | HSL，默认off，可继承；统计handler提前返回，不能与ignore_status等同，也不自动绕过限额。M:281、1145。 |
| 23 | stats_by_upstream | 注册仅http，默认on；控制是否调用上游统计分支，不是server/filter/cache总开关。不能因为存储在loc_conf且存在merge就宣称允许server/location配置。M:231、281、1147。 |
| 24 | ignore_status | HSL，1xx/2xx/3xx/4xx/5xx/off位掩码，默认off。命中时node_update在刷新last_seen之后返回，跳过该函数后续请求、响应码、字节、请求耗时、缓存状态统计；不能写成跳过所有计数。node_init/node_set之后S仍更新上游耗时或缓存容量。重试尝试用state.status，否则用响应状态。M:64、238、1148；N:447–585；S:270–317。README目录缺口，不标文档已核对。 |

### 内容阻断条件

以下任一情况须退回实施，不因basic计数满额而放行：

- 用宏版本冒充稳定tag/现场版本，或将扩展写成OpenResty自带、已安装或兼容已验证。
- display/display_format的http context沿用README；其他指令的context由字段存储层级反推而非注册表证明。
- 将measure_status_codes无参形式作为安全语法，遗漏注册与回调矛盾。
- 将ignore_status写成跳过所有统计，遗漏调用者继续更新上游耗时及缓存容量的边界。
- 将filter/limit的http规则与局部规则统一描述为子级替换全部父级规则；把限额写成限速。
- 将zone的README简写当精确默认值，或给无证据事实统一套用verified。

## 实现审核准备

1. 对照A01检查bundled1017原身份、context、事实与证据未污染；总计1041与发行1017/扩展24分别校验。
2. 对照A02逐项比较正式注册集合、知识条目、24份详情；核实配置回调和跨组件setter证据，不以总数替代集合相等。
3. 对照A06/A07检查schema、matcher、查询客户端、构建门禁一致；扩展来源必须为结构化字段且索引详情一致，发行不能使用扩展not_applicable绕过补丁校验。
4. 检查来源字段和内容进入release哈希、历史schema1仍可读、失败不替换current、不覆写旧release。
5. 核对错revision/origin、重复component/identity、来源冒充、分组计数篡改、跨release路径与缺证据负例；错误context、unknown和parse_error仍分开。
6. 对照A08/A09核对无扩展配置和隔离第二模块证据；不接受业务逻辑VTS名称/commit特判。不得为本轮修改构建解析器。
7. 主提交HTTP/桌面证据后，核对A03/A05/A06及历史链接是否对应最终release；这些项目在证据收到前保持待验收。

## 执行记录与待办

### 最终结论

已读取 `EXTENSION_MODULE_VERIFICATION.md` 最终候选验收段及 `verify-extension-http.mjs`、`verify-extension-browser.mjs` 全文。主确认最终HTTP/桌面均针对release `1.27.1.1-948dd5954553c1bf`通过，完整测试90/90通过。审核再次计算current index SHA256，仍为 `3df45bf8ad9759a7b48bb8cd5cb22153c1bc72c30036f88d39503f23fab63076`，与独立静态核验及主验收身份一致。

HTTP脚本真实获取扩展索引及24项查询详情，检查历史索引哈希、错误context及未知状态；1017份保真比较使用发布路径对应的本地详情，审核已独立逐份复核，不把该部分描述为1017份详情全部经HTTP下载。桌面脚本以真实selectOption/fill/click执行来源筛选、名称搜索和候选点击；evaluate用于读取DOM及请求记录，没有直接调用页面业务处理器或伪造点击成功。记录的pointer intercept已通过可见元素操作定位，并完成最终全流程重跑，不构成未解决的网站缺陷。

最终A01–A09按本轮计划闭合；实现和内容结论结合主的最终HTTP/桌面实际执行证据，判定本轮通过。R01/R02的校验修复及R03的证据修复均已关闭。后续模块仍须固定来源并逐项核对，不能因本轮通过自动宣布其他扩展已覆盖。

非阻断文档备注：验收记录开头仍保留初始“准备中/待验收”文字，而后文已记最终结果；主收尾可将其标为历史检查清单或同步总状态，以免读者混淆。审核未争写主维护的验收记录。

通过边界：固定发行1017项保真，VTS固定commit快照24项基础内容及共用链路，合并1041/1041/0。现场模块版本、安装、运行兼容性、部门深度验收、真实Codex接入及部署仍不在本次通过结论内。

### 最终候选实现与内容审核

候选release：`1.27.1.1-948dd5954553c1bf`；索引SHA256：`3df45bf8ad9759a7b48bb8cd5cb22153c1bc72c30036f88d39503f23fab63076`。内容文件SHA256：`187dba354e7268fa43193d0c0ff903734776ad6adbd2cd9cf0c94a13bb9ab87c`。

审核只读调用validateIndex/validatePublication、读取1041份详情与参考库、通过git show比对源码；没有运行inventory/build，没有修改产品或发布。

| 计划项 | 实现/内容核验结果 | 证据与边界 |
|---|---|---|
| A01 | 通过 | 独立逐份比较1017旧详情，除schema_version/release_id/source外原字段深度相等。 |
| A02 | 通过 | 24项注册身份先前已逐项核对；最终24份详情均basic_verified，固定SHA一致，167个发布源码片段与对应固定Git对象逐字相等，无伪造distribution-version。 |
| A03–A05 | 逻辑与测试审核通过，最终桌面待主 | 测试包含四项样例、无context、http/stream错误context、unknown和缺括号解析错误；已阅读首轮实际验收记录，不将旧release证据替代最终重跑。 |
| A06 | 静态契约及输出实现通过，最终桌面待主 | 实际1041/1041/0，bundled1017/1017/0，扩展24/24/0；完整性分组独立。JSON、Markdown、目录候选及详情使用结构化来源；发行基线不充当模块版本。 |
| A07 | 实现及负例审核通过 | origin/HEAD锁定、component冲突、来源一致性、分组计数、发行not_applicable拒绝；R01/R02已独立复现修复，正式测试也覆盖。 |
| A08 | 测试审核通过 | 旧schema1读取、隔离输出两次稳定构建、无扩展重新inventory/build及unknown恢复；没有将仅隐藏扩展等同于真正无扩展重建。 |
| A09 | 测试审核通过 | 已全文检查隔离Git第二模块测试，实际调用inspectExtensionSource/inventory/build/matchDirective；错来源、错SHA、重复配置及失败保留current有断言，finally清理独立临时目录。主报告该测试随全套实际通过。 |

完整测试：主执行 `npm test`，报告90/90通过、耗时33360ms，正式current未被隔离测试污染。审核已阅读全文 `test/extensions.test.mjs` 并核对相关knowledge/MCP schema更新；为避免重复构建及并发写发布，审核未重复跑整套测试。该执行结果明确归属于主提供的记录，而非审核自行执行。

R03最终复核通过：bypass_stats包含node-update/node-callers且文字明确last_seen先更新、调用者仍可能更新上游耗时或缓存容量；ignore_status的setter限制引用configuration-definition；measure_status_codes包含JSON消费片段。上述内容均已在候选release详情中再次确认，不仅检查源JSON。

实现核对范围包括配置驱动扩展盘点、build来源及补丁分支、共用source校验、matcher/知识客户端schema1/2、MCP输出schema兼容、网站来源筛选/候选/详情/分组显示及测试。未检出业务代码按VTS名称或固定SHA特判。not_applicable只表述发行补丁处理范围不适用，现场版本、安装及兼容性仍未知；当前deep为0。

结论：实现和24项基础内容在该候选release上通过独立审核，暂无未关闭修复项。最终整轮交付仍需主将同release的HTTP及桌面重跑结果落盘；不编译、不运行现场配置，不扩展为部门深度验收或真实Codex接入通过。

### 内容与契约复核：实施中快照

2026-10-13，`knowledge/extensions.json` SHA256为 `37500cc6e59207e439074108c2c7780b9638062cf5083b7ff72e3aa50bc78c95`。尚无本轮冻结release，本节不是发布通过结论。

- R01复核通过：原schema 1索引和详情可读；在索引或详情注入扩展来源均被拒绝，原索引详情来源矛盾复现也被拒绝。
- R02复核通过：同component混合来源类别、不同revision、不同repository均被拒绝；同component一致来源对照可通过。以上仅内存变异及校验函数调用，没有写产物或执行build。
- 24项完整身份与固定源码注册集合逐项相等；核对全部context flags与回调名，显式Nginx setter片段均包含对应真实函数定义。105处内容/显式回调证据区间合法，事实source_ids均可解析。自动定位回调的最终发布片段待release复核。
- 已逐项阅读01–24的语法、摘要、默认值、继承、限制及证据安排，并与前述源码基准对照。01–11、13–21、23暂未发现文字与固定源码矛盾；12/22/24存在以下引用补齐事项。此处不替代最终详情核验，也不因测试文件仍在编写判失败。
- 重点差异已体现：zone默认值、display系列context与README冲突、measure_status_codes无参风险、ignore_status非全统计跳过。版本及现场未知声明未被写成运行兼容保证。measure_status_codes的README正文确有章节，实施准确区分了目录缺项与正文存在；本预审不应将其概括为正文也缺失。

**R03 [P2] 已核实限制及输出说明的证据链需补齐。待实施修复复核。**

1. `vhost_traffic_status_bypass_stats`第二条限制（检查时`knowledge/extensions.json:2105`）描述ignore_status保留last_seen及分类处理，标verified，但source_ids只指向注册、merge、统计handler和limit handler，没有N:507–586及S:249–317。请添加实际节点/调用者证据并引用；同时把“last_seen等后续分类处理”写清为last_seen先更新、调用者后续仍可能处理上游耗时/缓存容量。
2. `vhost_traffic_status_ignore_status`关于bitmask重复值告警及按位累计的限制未在source_ids引用`configuration-definition`。该setter定义已经随条目提供，可直接补引用，无需复制证据或改实现。
3. `vhost_traffic_status_measure_status_codes`摘要声明JSON/Prometheus输出，但消费代码证据只列Prometheus。建议补 `ngx_http_vhost_traffic_status_display_json.c:164–183`，使JSON部分也可从该详情直接核对。

R03属于引用完整性问题，不把符合源码的说明判成语义错误。未修改内容文件；主收到明确发现后可交Sol修复。最终仍待主build及release、完整公共契约回归和HTTP/桌面证据。

### 公共契约阶段检查：已退回、待冻结后复核

2026-10-13，只读审核实施中的E01及公共契约。主已将以下两项退回Sol。结论仅针对检查时实现，不表示修复后仍存在；知识内容未完成不计失败。

**R01 [P1] schema 1接受扩展来源，且索引与详情来源不一致仍通过。**

- 位置：`src/core/source.mjs` 的 `validSourceCoverage` 对schema 1直接返回true；`src/query/knowledge.mjs` 的 `validateDetail` 仅在schema 2检查来源一致性。
- 复现：读取历史 `1.27.1.1-eeabda4eba7f5c16/index.json` 到内存，给首项添加合法department_extension来源，保持schema 1；详情读取原文件、不添加source。来源使用VTS固定repository/revision、version=`commit-snapshot`、version_kind=`commit_snapshot`、deployment_status=`unknown`。
- 实际：`validateIndex`及`validateDetail`均通过；同一项的`sourceDescription(entry)`为部门扩展，`sourceDescription(detail)`为固定发行版。
- 要求：schema 1保持发行语义，索引和详情均拒绝扩展来源；增加该负例，同时证明未修改历史发布仍可读。
- 状态：已退回Sol，待冻结后复核。

**R02 [P2] schema 2未校验同一component的来源身份一致性。**

- 位置：`src/core/source.mjs` 的 `validSourceCoverage`只检查逐项source格式及分组计数。
- 复现：将上述历史索引的内存副本设为schema 2，所有条目标bundled；仅首项nginx指令改为上述VTS扩展source，根据实际条目重新计算两组registration/basic/deep计数及完整性。
- 实际：`validateIndex`接受同一nginx组件同时归属bundled和department_extension。
- 要求：同一component的来源类别及固定来源身份一致；增加混合类别、不同revision和不同repository负例，不能仅校验计数相等。
- 状态：已退回Sol，待冻结后复核。

复现仅调用校验及描述函数，使用内存JSON副本；未修改旧发布、实现或测试文件，未运行inventory/build。阶段性观察确认当前代码已有origin/HEAD锁定、独立扩展盘点、schema 2发布和发行not_applicable拒绝分支，但这些观察不构成E01或整轮通过。收到冻结通知后复核R01/R02，再执行完整计划审核。

- 已只读读取冻结计划、注册表、配置回调、merge/init、统计/限额/过滤/变量处理路径；未执行编译、inventory或build。
- 已确认四项重点差异，并新增zone默认值、规则继承、display未消费可选参数、histogram溢出处理等预审基准。
- 尚未收到冻结实现及最终release；A01–A09全部待冻结产物完整审核。已确认的阶段性契约缺陷见R01/R02，尚无整轮通过结论。
