# 部门样例优先补齐计划

日期：2026-10-13。状态：本轮四项最小范围已实施，构建、121项全量测试及桌面验收通过；后补证据回归后10项定向通过，独立审核通过、P2关闭。未将新增测试后的总数冒称全量执行。详见 `SAMPLE_PRIORITY_REVIEW.md` 和 `SAMPLE_PRIORITY_VERIFICATION.md`。

## 深度交互：目标与边界

承接 `analysis/WEBSITE_REMAINING_PLAN.md`，优先解决两份部门样例相关事实证据、结果可发现性和解析上下文边界。已有统计与 map、geo、types、split_clients 识别不重复建设。补充默认值、继承证据不等于完成运行时深度；本轮不修改深度晋级契约、不制造 deep 完成。

基线沿用现有计划：1041 basic、0 deep、8 参考；两份样例历史匹配为24/258，历史测试不作为本轮验证。样例 A 仅按既定第3–73行主配置范围、样例 B 按完整配置回放；原文件只读，不复制到仓库、测试或公开产物。现场版本未知不阻止核查锁定版本，也不证明现场适用。

主线程已完成实现入口核查，并报告新增 main 模式、charset_map 两项红回归；本规划未运行这些测试，不重复主线程核查。工作区无 Git 根仓库，不要求根目录 Git 操作。

## 直接执行：冻结的四项范围

### 1. HTTP 四项默认值与继承补证据

仅处理 `nginx/ngx_http_core_module/resolver`、`nginx/ngx_http_proxy_module/proxy_pass`、`nginx/ngx_http_rewrite_module/set`、`nginx/ngx_http_proxy_module/proxy_set_header`，不能凭同名修改 stream/mail 身份。

主要内容入口为 `knowledge/directives.json`；已有内容批次记录按实际归属同步必要事实，避免重写其他指令。复用 defaults、inheritance、evidence/source_ids 契约，不为凑状态改构建器。

| 项目 | 必查锁定源码边界 | 验收重点 |
| --- | --- | --- |
| resolver | `repos/nginx/src/http/ngx_http_core_module.c` 的注册、create/merge loc conf、`ngx_http_core_resolver` | 分清未配置、父级继承、dummy resolver；不能把占位对象解释成系统 DNS 默认值 |
| proxy_pass | `repos/nginx/src/http/modules/ngx_http_proxy_module.c` 的注册、`ngx_http_proxy_pass`、`ngx_http_proxy_merge_loc_conf` | 核查无默认上游与条件性合并，不写普遍自动继承；不扩展成完整动态代理机制研究 |
| set | `repos/nginx/src/http/modules/ngx_http_rewrite_module.c` 的注册、`ngx_http_rewrite_set`、create/merge loc conf 与必要执行代码 | 区分 rewrite 指令序列、变量赋值与普通配置字段；不套用通用默认值/继承描述 |
| proxy_set_header | `repos/nginx/src/http/modules/ngx_http_proxy_module.c` 的默认 headers 数组、merge loc conf、headers 初始化 | 补默认头证据，保留并复核已有继承结论；区分默认头、显式配置与父级整组继承 |

证据需对应项目锁定版本、函数和有效行范围，并检查适用补丁；本地锁定文档仅作交叉印证。每个状态单独判定：证据充分才 verified，确实不适用才 not_applicable，不足则保留未核实并说明边界。不得用一处注册表证明默认/继承，不要求四项全部 verified。验收引用均可解析，正文与状态一致，其他身份不变，basic/deep 总量不因补证据变化。

### 2. 本次结果“全部 / 需关注”筛选

源码边界：`src/query/config-results.mjs`、`site/app.mjs`、`site/index.html`，必要的现有样式，以及 `test/config-results.test.mjs` 和相关网站回归。不改匹配器身份判断，不混用目录筛选。

筛选谓词冻结为：匹配需关注 **OR** 存在 `not_analyzed` 外部引用。匹配需关注沿用现有统计判据：状态既非 matched 也非 block_entry。包括结构不完整条目的错误状态，不只判断 unknown。

保留原统计分开计数：普通指令、匹配、匹配需关注、块内条目、外部引用。界面说明“需关注筛选同时包含匹配需关注和外部引用未分析”，另显示“显示条数 / 总条数”。两集合可重叠，不能相加充当筛选行数；外部引用计数仍按引用数，筛选结果按行计数。

验收使用合成输入覆盖重复指令、unknown、context不足、普通 include、特殊块 include、外部 Lua 文件和同时满足两个条件的行。matched include 与 block_entry include 在需关注视图均可发现且一行只出现一次。切换筛选不改原统计、候选身份或匹配结论；解析错误、外部未分析总提示始终保留。新输入、切换输入模式、清空或失败后重置旧结果、筛选和详情；零结果明确显示0/总数。

### 3. 用户显式选择完整主配置

源码边界：`src/core/parser.mjs` 的 `parseConfig` 入口，以及 `site/index.html`、`site/app.mjs` 的模式传递和提示；必要时核对 `src/core/core.mjs` 导出。默认片段保持现有保守行为，包括已有完整根块推断；`parseSingle` 不变。

契约冻结为 `mode=main`：只在无解析错误时将顶层项 context 设为 main。不向未知后代传播 main；未知块中的后代仍为 null。不得通过完整模式将未知块、非法放置或错误输入认作合法，不新增通用上下文推断。网站明确区分单项、配置片段、完整主配置；两种配置模式均禁用仅适用于单项的 context/module 控件。

验收：无根块的 `worker_processes 1;` 在默认片段保守处理，显式 main 顶层为 main；完整根块原行为不回退。`mystery { server { listen 80; } }` 在 main 模式仅最外层 main，未知后代 null。缺分号、引号/块未闭合时不执行顶层 main 标注。单项查询、HTTP/stream同名匹配和模式切换状态清理回归通过。

### 4. charset_map 的已知 context 特殊条目分类

源码边界：`src/core/contexts.mjs` 的 handlers 表，必要时 `src/core/parser.mjs` 的既有特殊块路径及对应测试；复用 block_entry 展示和统计，不新增知识身份。

锁定源码依据：`repos/nginx/src/http/modules/ngx_http_charset_filter_module.c` 的 charset_map 注册（约170行，仅 `NGX_HTTP_MAIN_CONF`）、`ngx_http_charset_map_block`（约1171行，约1286行设置 handler）、`ngx_http_charset_map`（约1307行）；开块禁止边界来自 `repos/nginx/src/core/ngx_conf_file.c` 的自定义 handler 路径。具体证据行号由实施核对后记录。

仅父 context 为 `http` 时启用；此处 HTTP main 指 http 块内部，不是全局 main。块头正常匹配，条目为 block_entry/data；不设 include 控制分支，`include` 和 Lua_file 同名项均作为数据，不产生外部引用，也不展开文件。所有嵌套开块均报结构错误，包括 Lua 块同名开块。

验收：合法合成映射不再报 unknown；定位、父块、参数和条目计数保留。顶层孤立 charset_map、http.server、http.location、stream、未知父块不得启用 handler。include/Lua_file 同名数据外部引用为0；缺分号、引号/块未闭合及嵌套开块仍失败。条目分类不等于参数有效：不宣称已验证十六进制、字符集或运行配置合法性，不新增完整参数校验器。既有四类特殊块、Lua边界与外部引用回归不退化。

## 后续独立批次：深度完整契约

主线程按两份样例50个去重知识身份复查：本轮四项之外，仍有14个身份至少一项默认值/继承未核实。下一批按实际频次核对 HTTP server、listen、location（各21次）、HTTP error_log（16次）；随后 include（3次）、events/stream/http 和 proxy_limit_rate（各2次），以及 worker_cpu_affinity、VTS vhost_traffic_status_display、main error_log、pid、worker_rlimit_nofile（各1次）。块头/流程型指令须先判定默认值及继承是否适用，不套用普通字段的默认规则。这是内容补证据队列，不是14个解析失败项；完整清单统计来自本轮原文件只读回放。

深度晋级留待独立计划，同时覆盖必需运行时证据及第二证据、有效引用、构建晋级条件、总量/来源组/索引/详情一致、网站与 Markdown 一致、旧发布兼容、缺证据不晋级。当前 `scripts/build.mjs` 仍只产生 basic_verified/registration_only 且 deep 总量为0；已有 mechanism 段落不等于 deep。本轮不得手改 verification 或计数，不扩展 stream机制、部署、Codex接入、include多文件分析及生产操作。

## 交接与验收

1. 实施按四项逐项提交最小改动及证据；优先沿用主线程已有两项红回归，补充必要边界测试，不复制原样例。
2. 审核对照本文逐条检查源码边界、反例、状态和统计语义；缺证据、漏项或误分类打回实施，修复后复核受影响项。
3. 主线程执行与修改相称的自动测试、必要构建和网站回放，原地只读核对两份样例，记录实际执行结果与差异原因。历史24/258只能作为比对基线，不能为凑数量吞掉错误或加入数据项。
4. 验收须确认1041 basic、0 deep未被虚增，四项完成与剩余深度工作分开报告；未完成的验证如实保留待验，不写已通过。

本规划角色仅新增本文；未修改实现、原样例或现有计划，未运行测试、构建或浏览器。后续实施与审核由主线程协调。
