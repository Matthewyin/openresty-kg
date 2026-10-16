# R01 / R02 独立审核

日期：2026-10-13。最终结论：**P2 正式关闭；R01/R02 本轮审核通过，无未关闭缺陷。** 独立代码与定向探针复核通过，主线程修复后重构建及实际页面复核记录已补齐。范围仅为本轮四类 handler 分类及准确统计，筛选仍后移。

## P2 修复后复核（当前结论）

页面 `site/app.mjs:4,222` 已真实导入并调用 `src/query/config-results.mjs` 的 `needsOuterContext`；函数保留原有普通指令判断，仅排除 `kind === 'block_entry'`。修复覆盖实际页面调用，不是只修测试或添加未使用函数。

独立执行 `node --test test/config-results.test.mjs`：3/3通过，包含新增上下文提示回归及原统计测试。另独立执行四个探针：server/types 数据和 location/types/include 控制项均返回 false；孤立 server 和未知祖先下 server 均返回 true。两个原反例已消除，保守边界保持。未重复全量测试、构建或浏览器操作。

已读取 `WEBSITE_REMAINING_VERIFICATION.md` 的“审核反馈修正”：主线程先红后绿、修复后40项定向通过、重新构建成功；实际页面刷新后 server/types 和 location/types 均无缺外层提示，孤立 server 仍有提示；最终恢复 B 样例，258匹配、需关注0、外部引用1。上述构建与浏览器结果按主线程实测证据采纳，不冒称独立执行。108项全量测试及A样例24项回放属于P2修复前批次，修复后未重复全量，也未将其改称109项全量通过。本次仅核对追加记录并更新关闭结论，未重复运行测试、构建或浏览器。

修复后 SHA-256：`src/query/config-results.mjs` 为 `1e4aec6f1b0b885b387ac17ff6104e63c4bb1b33139de65bdbb79dd618d8c421`；`site/app.mjs` 为 `db34315fd2c0ed3ac7ae3fc2c7b9997a159f64cee1725741dac153ed206109a5`。下方旧结论与快照仅保留问题发现、打回及修复前复核过程，不代表当前状态。

## 修复前审核记录

最终收口复核：收到主线程验收完成通知后，重新读取当前 `site/app.mjs:222`，该条件仍未排除 block_entry。从当前页面源码直接提取并执行该条件，前述 server/types、location/types 两个反例均返回 true；孤立 server 也返回 true。当前 `site/app.mjs` 与 `dist/app.mjs` 逐字一致，因此该误提示仍存在于已构建页面，P2 尚未关闭，维持打回结论。未重复全量测试或构建。

已读取主线程 `WEBSITE_REMAINING_VERIFICATION.md`：记录108/108全测、构建成功、源码与产物一致、桌面混合22项（普通10、块内12、matched9、关注1、引用3、目录8）、结构错误无候选、未知祖先保守、编辑及模式切换清空，以及A/B样例24/258全匹配、引用2/1、目录23/40。以上均明确作为主线程本轮实测证据采纳，未冒称独立执行；这些通过结果未覆盖本报告的合法server/location中types误提示反例，不能据此关闭该缺陷。

范围依据 `WEBSITE_REMAINING_PLAN.md` 及主线程最新决定：R01 四类自定义 handler、R02 准确统计。结果筛选已明确后移，不作为遗漏，不要求扩展。仅修改本审核文件，未修改实现或测试；未联网、未运行浏览器或构建。

## 原必须修复项（现已关闭）

### P2：已知 HTTP server/location 内的 types 条目误触发缺外层上下文提示

位置：`site/app.mjs:222-223`。

复现输入：

```nginx
http { server { types { text/html html; } } }
```

独立 Node 探针调用当前源码 `parseConfig`、`matchDirective`、`summarizeConfig`，知识索引读取现有 `dist/knowledge/index.json`。结果无解析错误，状态依次为 `matched, matched, matched, block_entry`；普通指令3、唯一匹配3、需关注0、块内条目1。对解析结果执行页面原有提示判定，结果为 true，因此页面会显示“请提供外层 http 或 stream 等所属块”。

原因：块内条目的 `context` 为 null 是预期分类结果；其 `contexts` 包含 server，现有提示条件将这种条目误当成所属上下文不明的普通指令。虽然匹配和统计正确，页面却要求用户补充已存在的外层，属于本轮新增分类未完整接入提示逻辑的实际问题。

第二个独立反例也成立：`http { server { location / { types { include mime.types; } } } }`，四条普通指令全部 matched，include 为控制条目并保留一个外部引用，仍触发相同误报。

最小修复建议：该上下文提示判断排除 `kind === 'block_entry'`；保留孤立 server 和未知父块下普通指令的保守提示。复核上述两个反例，并确认 `server { listen 80; }` 仍提示上下文不足即可，不需要新增筛选或修改解析槽位。

本项证据为源码调用和页面条件的独立执行，**不是浏览器实测**。

## 已核对的实现边界

- 固定源码 `repos/nginx` HEAD 为 `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`，预审核时工作树无改动。map/geo/split_clients 注册仅允许 HTTP/stream main；types 允许 HTTP main/server/location。依据各模块 command 注册及 `ngx_http_core_module.c:311`。
- `ngx_conf_file.c:293-315` 在自定义 handler 分派之前拒绝开块。当前 parser 的 handler 开块检查在 Lua 判断之前，普通嵌套块及同名 Lua 块均保留结构错误。
- map 的 hostnames/volatile 仅在无参数时为控制项；HTTP geo 的 proxy/proxy_recursive 与 stream geo 分开。default/delete/ranges 的角色按当前 handler 和参数数判断。语义无效的地址、百分比、参数组合仍不验证，符合冻结范围，页面及 README 已声明。
- 仅 map/geo/types 的 include 记录外部引用；split_clients 中同名文本不记录文件引用。handler 内同名 Lua_file 文本不产生 Lua 外部引用。控制项和数据项均保留定位与父块，并与普通知识匹配分离。
- 未知父 context、无效父 context 不启用 handler。未完成条目优先返回 invalid_input，不能以 block_entry 掩盖结构失败。
- R02 按出现次数计数；块内数据和控制项统一计入块内条目，外部引用另计。不完整块内项同时计需关注，页面说明与实现一致。候选目录仍按知识身份去重，标签已明确。
- 页面先显示整体解析错误，结构错误时不发布可选候选；输入变化及模式变化经 clearQuery 清除统计、结果和详情。此项为静态调用链核对，不冒充 DOM 或浏览器实测。
- STATUS_LABELS 新增 block_entry 与页面分项配合；parseSingle 仍不接受普通配置块，单独 Lua 块和 Lua 文件保持原入口。MCP 经 querySingle → parseSingle，不能从正常单项输入产生 block_entry；未独立运行真实 MCP 协议测试。

## badindex 与 block_entry 的判定

不列缺陷。完整块内项确实在索引验证之前返回 block_entry，但其没有 candidates 或 selected_id，也不表示知识查询成功。独立探针对 `http { types { text/html html; } }` 传入空对象索引，结果为 `invalid_index, invalid_index, block_entry`；网页整体 valid 条件为 false。实际解析输出必然包含普通祖先块头，因此该短路没有造成本轮网页绕过无效索引的可复现问题，无须为此扩大防御。

## 独立执行证据及主线程验收边界

独立执行 `node --test test/parser.test.mjs test/matcher.test.mjs test/config-results.test.mjs`：39项通过、0失败。这是审核线程本次重新执行结果，不沿用实施报告。

另外以内存脚本执行29组独立断言：HTTP/stream 六种 handler 与 Lua_file/include 交叉、12组普通/Lua 嵌套开块、三个未知或非法父 context、混合统计、错误索引、两个误提示反例、单项入口边界，均得到所述预期。反例断言通过表示确认缺陷存在，不表示产品通过。

混合输入含重复 sendfile、types 数据/include、unknown、顶层 server/listen；实得普通7、matched4、需关注3、块内2、外部1，去重候选身份11。候选可以包含歧义与 context_mismatch 的多个候选，因此目录数不要求等于 matched 数。

未独立重放原始24/258样例，未执行全量测试、构建、浏览器和真实MCP协议；这些由主线程并行验收。历史24/258结果不作为本轮通过证据，必须由主线程本轮记录补足。

审核快照 SHA-256：

| 文件 | SHA-256 |
| --- | --- |
| src/core/contexts.mjs | 3cdeae779c68c335f101206262cee7ab83122f7b50d55b2e4d80bd40729d6765 |
| src/core/parser.mjs | 7e62a618edc685d1a30ab2a5c4854fa3ce38929655e5650b49308788413547da |
| src/core/matcher.mjs | 2dbba4d9187b34e02b152b9f4c83b6a5f7920f580cc17aa9870218fcfee173ed |
| src/query/config-results.mjs | e50768066c88b8b610e674c3482ef0547cd6361ec7f4262668323caab352bb3a |
| src/query/knowledge.mjs | 75e190ac79465e4278321e27e03e9f3d4ad2d5917cbac6bc5b371d70e30710d7 |
| site/app.mjs | a2bbe7b37c263e5daeeee250e4c4a755b8cb539a409ccc91bbcceb89cc2b546d |
| README.md | d8397ee367ef33d11be25b3916e3f1cf8e76bf4d175b4391103deefcbce1c960 |
