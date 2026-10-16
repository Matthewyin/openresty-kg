# 部门样例优先补齐验收

日期：2026-10-13。范围对应 `SAMPLE_PRIORITY_PLAN.md`。功能、四项内容及主线程最终发布验收完成，独立审核收口见 `SAMPLE_PRIORITY_REVIEW.md`。

## 解析与交互

- `charset_map` 最小反例修复前：`http { charset_map koi8-r utf-8 { C0 D18E; } }` 的编码行被分类为 simple/unknown，真实解析及匹配断言失败。新增 main/charset_map 两项测试先红后绿。
- 定向 `node --test test/parser.test.mjs test/matcher.test.mjs test/config-results.test.mjs` 最终45/45通过；包括完整模式非法层级不能变为 matched、编码行不能匹配同名指令。
- 首次 `npm run build` 成功，知识内容尚未改变，发布仍为 `1.27.1.1-948dd5954553c1bf`，1041 basic、0 deep。
- 原预览50528已到期，沿用同一桌面浏览器标签页，重新启动项目临时预览53801；未新建浏览器空间，未做手机验收。

## 实际桌面页面

- 完整模式输入 `worker_processes auto;`：顶层 main、唯一匹配1，关注筛选显示0/1和明确空态；片段模式同输入为context_required。模式切换清旧结果和详情，筛选重置all；main/config禁用单项控件，single恢复。
- 合成混合输入14项：普通10、匹配9、匹配需关注1、块内4、外部引用3、目录去重8。关注视图4/14，保留普通include、types块内include、Lua文件引用及未知指令；总统计和目录8保持不变。charset_map内同名include不产生引用。
- charset_map合法映射：块头匹配HTTP条目，C0为块内数据，无普通知识候选。非法Lua名称嵌套开块：页面显示结构错误，需关注筛选不隐藏总错误，无候选按钮。
- main模式孤立server显示context_mismatch；listen及未知祖先后代不猜context。切回single查询worker_processes仍提示context不足。
- 输入编辑清旧行、候选和筛选；原有解析失败显示可靠前缀，不冒称整体成功。

## 部门样例调用检查

两份原始文件只读，在内存中回放；不将配置正文复制进仓库。A仅取既定第3–73行主配置，B为整份文件。fragment/main两种模式均无解析错误：A普通24/匹配24/外部引用2/关注筛选2行；B普通258/匹配258/外部引用1/关注筛选1行。两者匹配需关注0、块内条目0。此段是本轮真实源码调用结果；最终内容发布后的构建产物及桌面回放另记。

## 最终发布与内容

- HTTP resolver、proxy_pass、set、proxy_set_header 已补默认值及继承说明，绑定锁定源码、文档和补丁证据；set 默认值为有说明和证据的 not_applicable，其他新增事实为 verified。详见 `SAMPLE_FACTS_EVIDENCE.md`。
- 最终 `npm run build` 成功：`1.27.1.1-2dca5fdd6a398672`，1041 basic、0 deep；默认值未核实由243降至239（795 verified、7 not_applicable），继承未核实由328降至325（665 verified、51 not_applicable）。未修改deep晋级条件。
- 全量测试首次因A01将当前内容强制等于旧冻结内容失败。修正为历史VTS发布与VTS前发布仍逐字比较；新增A01b仅允许四项授权事实及新增证据变化，逐字保留其他字段、旧证据及所有其他身份。定向A01/A01b为2/2通过，随后 `npm test` 全量121/121通过，0失败/跳过/取消，约33.1秒。输出保留于 `sample-priority-tests.log`，不将首次失败隐去。
- 对当前1041个详情与旧发布比较，仅四HTTP身份的授权字段变化；stream/mail同名项与VTS等其他身份不变。parser、contexts、config-results、app、index源码与dist逐字一致。
- 直接使用最终dist解析器、匹配器重放：A24/24、外部引用2、关注2行；B258/258、外部引用1、关注1行，无解析错误。
- 实际桌面刷新到新发布后重放A/B：24/24和258/258匹配，关注筛选分别显示2/24与1/258；B唯一可见项为第53行mime.types引用，目录仍40。保留B完整输入、关注视图和proxy_set_header知识预览，截图 `sample-priority-desktop.png`。临时预览仍为本机10分钟机制，不是内网部署。
- 从B候选目录逐项点击四个HTTP身份，实际页面均展示新默认值与继承说明；set显示“不适用”及详细原因，其他新增项显示“已核实”。保留唯一匹配不等于配置有效的边界。
- 收尾时53801已按10分钟机制关闭，使用同一标签页续开56075并恢复B输入、1/258关注视图和proxy_set_header详情。交付地址 `http://127.0.0.1:56075/`，仍为限时本机预览；截图已按该页面重存，未改产物或重跑已通过测试。
- 独立审核已完成内容/功能核对与45+6项定向检查；历史测试调整与最终验收记录的收口结论见独立审核文件。本轮未做手机、真实Codex接入或生产部署。

## 审核反馈：实际发布新增证据的回归保护

审核确认A01b保留了历史和其他身份保护，但新增sources在被内存覆盖前没有逐字核对，错误的新发布片段可能漏检（当前发布未发现该错误）。主线程在 `test/sample-facts.test.mjs` 增加直接读取发布sources的集合检查：以旧发布全部sources加curated固定revision片段为预期，完整逐字比较实际产物，覆盖之前完成断言；用错误新增code和额外未授权source验证均被拒绝。

最后执行 `node --test --test-name-pattern='实际发布|^A01|四项|HTTP' test/sample-facts.test.mjs test/extensions.test.mjs`：10/10通过。仅增加测试，产品源码、知识和构建产物未变化；不重复构建/桌面/全量，不把之前121项全量改称122项全量执行。独立审核再次执行10项全部通过，P2已关闭，本轮最终审核通过，详见审核报告。

## 仍待后续

两份样例剩余14个知识身份的默认/继承补证据队列已写入计划；这不表示14项解析失败。完整运行时深度契约、深度内容及内网现场部署验收未完成。本批只完成计划的四项最小范围，不宣称整个网站所有准确性问题已清零。
