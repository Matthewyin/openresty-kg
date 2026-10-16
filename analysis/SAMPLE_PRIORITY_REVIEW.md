# 部门样例优先补齐：独立审核

日期：2026-10-13。最终状态：功能边界、HTTP四项内容及A01/A01b保护审核通过；唯一P2已修复并独立复核关闭。本轮四项最小范围独立审核签署通过，不代表后续运行时深度或现场部署完成。

## 深度交互：结论与验收边界

对照 `analysis/SAMPLE_PRIORITY_PLAN.md` 第2–4项，当前未发现需要打回的功能问题。完整主配置声明只补顶层知识匹配上下文；特殊块分类只识别条目边界；需关注筛选只改变结果行可见性。这三项均不能作为参数正确、配置可运行或 deep 完成的证据。

本审核仅修改本文。未构建、未启动浏览器、未运行全量测试、未读取或复制部门原始样例。真实桌面两样例验收与统一构建仍由主线程完成，不将本阶段结论写成整个规划通过。

## 直接执行：本次核对结果

| 范围 | 结论与证据 |
| --- | --- |
| 完整主配置 | `src/core/parser.mjs:254` 的 `parseConfig` 在无解析错误时只为 `parent_index === null` 设置 main。默认片段、完整根块推断与 parseSingle 保留原行为。独立探针用已有发布索引确认 `server { listen 80; }` 的 server 为 context_mismatch，listen 不为 matched。 |
| 未知后代 | `mystery { server { listen 80; } }` 及未知祖先内 http/charset_map 的后代 context 全为 null；main 未向后传播。缺分号、未闭引号和未闭块时顶层不标 main。 |
| charset_map 父上下文 | `src/core/contexts.mjs` 仅在 http 下安装 handler；独立探针覆盖顶层、http.server、http.location、stream、未知祖先，均不将映射条目分类为 block_entry。 |
| charset_map 数据边界 | 定向测试确认 include、content_by_lua_file 同名条目为 data，外部引用为空，保留父块、位置、参数和 complete。缺分号、未闭引号/块及 Lua 同名嵌套开块保留错误。未实施十六进制或字符集语义验证，页面明确提示此限制。 |
| 关注谓词与计数 | `needsAttention` 为非 matched/block_entry 状态或有外部引用；解析器及匹配器当前只接收 not_analyzed 引用，因此与冻结谓词一致。混合输入探针得到普通指令11、matched 8、匹配需关注3、块内项2、外部引用4，关注视图6行；两个集合有重叠，没有相加或重复显示。三条 include（含 types 内控制项、未知 context 项）和一条 Lua 文件引用均保留。重复 sendfile 行计入原统计但不进入关注视图。 |
| 页面筛选 | `filterResults` 只修改 parsed-results 的行 hidden 和筛选计数/空提示；query-status 中解析错误与外部引用总数保持可见。只读函数探针确认2/3与0/1、零关注提示及总提示不变。筛选不调用 setCandidates，不更改身份或候选目录。 |
| 清态与模式 | `clearQuery` 清结果、候选、详情和筛选，递增查询/预览序号；输入事件与三模式切换都走该路径。只读函数探针确认三模式清态及 config/main 禁用单项 context/module。提交先清态，异常分支再次清结果/筛选/详情；异步结果受序号保护。异常和异步路径为源码核对，未宣称浏览器实测。 |

### 锁定源码依据

本次确认 `repos/nginx` HEAD 为 `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`，工作树无修改。直接核对：

- `src/http/modules/ngx_http_charset_filter_module.c:170` 的 charset_map 注册只允许 NGX_HTTP_MAIN_CONF；1286行安装 ngx_http_charset_map handler，1307行起回调按映射数据处理。
- `src/core/ngx_conf_file.c:292` 的自定义 handler 路径在调用回调前拒绝 NGX_CONF_BLOCK_START，支持嵌套开块必须报错的边界。

这里仅记录第4项分类依据；HTTP 四项的有效补丁影响、固定文档与事实引用尚未审核，不以这些源码检查替代后续内容审查。

### 本次实际验证

执行 `node --test test/parser.test.mjs test/matcher.test.mjs test/config-results.test.mjs`：43项通过、0失败、0跳过。这是审核角色本次独立执行结果，与主线程此前报告的同样43项分开记录；未运行会触发构建的其他测试。

收到主线程新增回归通知后，独立核对新增两项 matcher 测试并重跑同一命令：**45项通过、0失败、0跳过**。新增项覆盖 main 模式无根块指令匹配及非法顶层 listen、charset_map 数据不误匹配同名知识。最新结果为45项，不将前一次43项累加。README 第25–31行与上述实现边界一致。实现文件摘要未变化。

另执行两组内存只读探针，未新增测试或临时文件：

1. 直接导入当前 parser/matcher/config-results，使用合成输入与已有 `dist/knowledge/index.json` 检查上述 main、charset_map 和混合关注行边界，全部通过。该已有索引读数为1041 basic、0 deep；不是本轮重新构建验收。
2. 使用 Node VM 提取当前页面筛选、清态和模式回调，以最小 DOM 替身检查函数行为，全部通过。首次探针因重复执行回调体导致 VM 顶层 `const mode` 重声明而退出；为每次回调增加独立作用域后重跑通过，未改实现。这不等于真实 DOM、布局或桌面交互验收。

### 审核快照 SHA-256

当前根目录无 Git 仓库，以内容摘要限定审核范围：

```text
b232dd2a83d8647b040c7f61c9f0e7f45ca9bea0d732d5eb3a2a88e5668d5406  analysis/SAMPLE_PRIORITY_PLAN.md
2fcc3b2452d22994c905a1317ecd92dd7581c66c1a9ccebf942a999ccc11322b  src/core/parser.mjs
7149a98798ddc1c7aad425843452e10bee6d25c38173156b4e72479527f7fd63  src/core/contexts.mjs
ed4de9037cb34d1af4742526f67fbd028b615d5fe4a6497d4d01a34ec7571cfd  src/query/config-results.mjs
f0dee11b2126851314661627e27b9ba2fb140bdab4802e3574a6623fe7b5efe9  site/app.mjs
8f128f514ebac73e1beaa06e72b7de17d63854bd959d0543a12e46a165a19c67  site/index.html
4fb8c2d5d33e60657b21bb7a2691d9427b2eb6a5f0dd56ba761531ea6741f2a9  test/matcher.test.mjs
2c595ca769f933f02ecf339df685771bc460841f208f6cb3d636872880101d22  README.md
```

## 主线程桌面验收记录（转交，非本角色执行）

主线程本次通知以下真实桌面结果通过；本角色不重复浏览器，亦不将转交记录计作独立实测：

- main 的 worker_processes 匹配、关注0/1；相同输入在片段模式为 context_required。
- 混合14项：普通10、matched 9、attention 1、block 4、外部引用3；关注视图4/14保留普通 include、types include、Lua_file 和 unknown，候选目录始终8项。
- charset_map 的 include 同名数据不产生引用；编辑输入与切换模式清理旧状态。
- 非法 charset_map Lua 嵌套保留总错误且无候选；main 孤立 server 为 context_mismatch，未知后代仍 null；切回 single 仍为 context_required。

这些是合成功能输入验收记录，不能据此推定部门两份原始样例已经回放或内容补证据已经通过。

## 待内容通知与主线程验收

尚未审核 `knowledge/directives.json` 的四HTTP身份变更、`test/sample-facts.test.mjs` 与 `analysis/SAMPLE_FACTS_EVIDENCE.md`。待内容角色完成通知后，逐项核对固定源码、补丁、固定文档、引用范围和状态，重点检查 set 的 rewrite 指令序列继承以及 proxy_set_header 默认头与显式配置、父级整组继承关系。当前不予内容通过结论。

本阶段无实现问题需要打回。主线程仍须统一构建并真实桌面回放两样例；1041 basic、0 deep及发布一致性以该次实际验收为准，历史24/258和历史测试不计作本次审核结果。

## 内容最终独立复核（后续更新，取代上节待内容状态）

已收到内容冻结通知，独立核对 `SAMPLE_FACTS_EVIDENCE.md` 与四HTTP身份的 defaults、inheritance、证据和补丁范围。未发现需打回的内容缺陷。

| 身份 | 独立源码与固定文档结论 |
| --- | --- |
| HTTP resolver | core_module.c:3858–3874 确认子级为空时共用父对象、父级为空创建无服务器dummy；5085–5103确认显式创建对象。resolver.c:132–309、418–420、2443–2448支持双栈条件、端口53、无默认服务器和成功答案TTL分支。固定 core XML:2184–2250交叉印证；local补丁仅在显式参数分支读取文件，不会自动读取系统DNS。 |
| HTTP proxy_pass | proxy_module.c:3314–3354为零初始化，4114–4232显式设置目标和handler；3854–3875仅在noname且静态目标、变量脚本都空时复制，limit_except独立安装handler。rewrite.c:579–588与core_module.c:4680–4693确认匿名标志；固定proxy XML:1425–1551支持无默认URL及上下文边界。没有普遍继承到普通嵌套location的错误表述。 |
| HTTP set | rewrite.c:221–268确实不复制父codes，空子序列直接返回；599–643确认if共用父序列并在解析后清子codes。136–222、271–293与script.c:1813–1863区分执行阶段、未初始化getter和请求变量赋值；897–962支持编译及setter分支。固定rewrite XML:23–60、379–391支持执行顺序与语法。defaults不适用有具体证据，inheritance没有将请求变量值保留误称为逐项继承。 |
| HTTP proxy_set_header | proxy_module.c:819–832和848–869确认常规及缓存默认表；3985–4034按不区分大小写的名称补缺失默认项，显式空值仍占据字段；1470–1519空求值跳过输出。3901–3926确认整组继承及缓存初始化条件。固定proxy XML:1842–1907交叉印证默认Host/Connection、整组继承和空值行为，未把“两项默认重定义”当成全部内部默认表。原inheritance保持不变。 |

### 固定证据与补丁检查

独立核实Nginx、nginx-docs与OpenResty revision分别为 `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`、`e8b581903e9d41252720053311cea687a5671674`、`8c37412c31621225e7aa7e825b5b50106c9c71c4`。前两者工作树干净，OpenResty只有既有未跟踪tags。通过固定revision的git show逐一校验四项51个证据/配置回调片段的范围与事实source_ids，均有效。

独立遍历审计清单34个固定补丁的目标与hunk：proxy模块仅proxy_host_port_vars改变量flags；rewrite模块无目标修改。resolver相关local/IPv6补丁已直接核读；socket_cloexec改连接socket，不涉及新增默认/继承段。core的no_error_pages改错误页逻辑，不涉及resolver merge。新增Nginx证据id均纳入patch_status.source_ids。34补丁实际回放通过与47摘要一致为实施角色及主线程转交结果，本审核未重复回放、未构建。

### 本次测试与发布只读复核

独立执行 `node --test test/sample-facts.test.mjs`：6项通过、0失败、0跳过。先检查build入口有主程序保护，测试仅导入纯校验函数、内存覆盖详情，不触发build。测试覆盖事实正文/证据、固定源码边界、真实publication契约和悬空引用拒绝；不将源码字符串断言等同于Nginx运行验证。

独立只读确认current为 `1.27.1.1-2dca5fdd6a398672`，1041 basic、0 deep，四个发布详情defaults/inheritance与当前knowledge一致。逐一比较该发布和 `1.27.1.1-948dd5954553c1bf` 的1041个详情（仅去除release_id），仅四个HTTP身份变化：resolver/set/proxy_pass变化defaults、inheritance、sources、patch_status；proxy_set_header仅变化defaults、sources、patch_status。其余身份逐字不变，身份集合不变，因此未误改stream/mail同名项。

最新摘要：

```text
11c77511b2bf11ba2448cf2657d46b442630452a02c3ac7f58b0f0193d28d2ed  knowledge/directives.json
854ea3bcf9fd843e1fb08cbd3e575a4bce285840de8988128bbd4aae60d7c909  analysis/SAMPLE_FACTS_EVIDENCE.md
5b8d7d71fd61182c3f8a6967ab48f9d24159f07d7be7b8e668f5ae509858b769  test/sample-facts.test.mjs
698d0b1bb9791d8da599e2e5da46ff92d4ebb097483a3889c16dab1cd2ebcad0  site/app.mjs
```

site/app.mjs:232已核对为“匹配需关注”，以区别包含引用的关注筛选；此文案更新替代前节旧app摘要，未据此重复行为测试。

主线程另转交：新发布真实桌面样例A为24 matched、关注2/24、目录23；样例B为258 matched、关注1/258（mime.types）、目录40；四详情逐项核对当时仍进行中，resolver已显示新事实。上述是本轮主线程验收，不是本角色浏览器实测。

### A01测试调整待复核

主线程全量测试发现A01将当前内容与VTS前冻结内容逐字比较，因本轮授权四项更新失败；不能将本阶段45+6定向通过宣称全量通过。拟修正为历史VTS发布对VTS前发布继续逐字保真，当前发布对VTS历史仅开放四个完整HTTP身份的授权字段。审核将检查不跳过其他身份、不放宽patch_status.status/note、不排除summary/syntax/limitations/评级等字段，且保留proxy_set_header原inheritance。此时尚未读到修改，暂不签署测试变更通过。

## A01/A01b独立复核结论：一项P2待修复

已独立执行 `node --test --test-name-pattern='^A01' test/extensions.test.mjs`：2项通过，未运行A09构建测试。审核的extensions测试摘要为 `73f322f3b7f2669ee3d155c583468f7c6d590742722f9230a0365c7de74b688e`。

A01继续比较948dd与eeab的1017个历史发行详情，原逐字保护保留。A01b严格限定四个完整HTTP身份，其他1041身份中的非授权项（含VTS）仍逐字核对；四项的patch_status.status/note和其他字段未被放开，旧sources逐字保留、旧patch引用不得删除。这部分审核通过。

### P2：新增发布证据可错误而A01b及sample-facts仍通过

位置：`test/extensions.test.mjs:57–62`，以及 `test/sample-facts.test.mjs` 中内存覆盖sources后再校验publication的循环。

A01b只逐字检查before已有sources，随后执行 `after.sources = before.sources`，新增sources的code、revision、行号、URL和集合未与授权固定证据逐字核对。sample-facts先用sourceFor生成正确片段覆盖发布详情，再调用validatePublication，不能发现原发布中新片段的错误。

本次只读内存反例已实际执行：仅将当前发布resolver详情新增 `resolver-create` 的code换成“错误片段”，直接执行A01b原回调仍通过；以同样内存读取替身执行sample-facts六个原测试回调，6项仍全部通过。没有写磁盘、没有改实现或测试。对照反例中修改旧source.code、patch_status.status或summary，A01b均会拒绝，说明问题仅在新增证据保护缺口。

影响：今后构建或发布把新增证据渲染错误时，这组测试可能显示全部通过，无法支撑“新sample-facts验证授权新字段”的完整承诺。当前源码事实审核未发现错误；这是测试保护缺陷，不是当前发布片段已错误的判断。

最小修复：在替换/覆盖发布sources之前，断言新增source集合严格来自curated证据，且每项发布片段与固定revision生成的sourceFor结果逐字一致；保留既有旧sources保护。可放在A01b或sample-facts中，不要求改构建器。复核时错误新增code及额外未授权source应被拒绝，再重跑受影响定向测试即可。

已读取主线程最终 `SAMPLE_PRIORITY_VERIFICATION.md` 和 `sample-priority-tests.log`，确认日志记录121/121通过、0失败/跳过/取消，主线程报告最终四详情及A/B桌面回放、source/dist一致。此结果按主线程实测记录，不冒称独立全测。测试全绿不消除上述已复现缺口；最终独立签署暂缓至P2修复。

## P2关闭与最终签署

后续修复已独立核对：`test/sample-facts.test.mjs:55` 新增测试直接读取四项实际发布sources，在任何内存覆盖之前，与“948dd历史sources + 当前curated evidence经sourceFor按固定revision生成片段”的完整集合排序后deepEqual。比较包含code、revision、行号、URL及全部其余字段；实际集合没有先被Map去重，因此额外项或重复项也不会被吞掉。每个身份均运行错误新增code及额外未授权source两个负例，确认断言拒绝。A01b的旧source逐字保护、旧patch引用保留和非授权字段保护仍在。

审核角色本次独立执行：

```sh
node --test --test-name-pattern='实际发布|^A01|四项|HTTP' test/sample-facts.test.mjs test/extensions.test.mjs
```

结果：10项通过、0失败、0跳过、0取消，包括A01、A01b、A03–A06及7项内容测试。未执行A09构建测试，未重复全量测试、构建或浏览器。主线程此前121项全量结果保留为修复前实测，不虚报修复后全量122项通过；本次修复后的验证为上述10项定向测试。

最终测试摘要：`test/sample-facts.test.mjs` 为 `3f1564158d00fc3bab081ce10ea91b29bf02279c69d6062c3cc3b5b8d487bd6f`；`test/extensions.test.mjs` 仍为 `73f322f3b7f2669ee3d155c583468f7c6d590742722f9230a0365c7de74b688e`。独立确认knowledge/directives.json及site/app.mjs摘要与上一审核快照一致，无需重做产品发布验收。

**关闭P2，最终独立审核通过。** 已审核发布为 `1.27.1.1-2dca5fdd6a398672`，1041 basic、0 deep。功能与内容结论来自独立源码/固定文档/补丁范围核对及定向验证；两样例、四详情桌面操作、构建和全量测试来自明确标注的主线程本轮记录。审核角色全程仅修改本审核文件，无实现修改或遗留临时文件。
