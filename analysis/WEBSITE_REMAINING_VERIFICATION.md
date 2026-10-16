# 网站准确性补齐验收

日期：2026-10-13。对应 `WEBSITE_REMAINING_PLAN.md` 的 R01/R02。本文仅记录当前批次，不替代全部网站、知识深度或现场部署验收。

## 修复前证据

- 最小输入 `http { types { text/html html; } }` 经真实 parseConfig/matchDirective 后，MIME 数据项 `text/html` 被标为 unknown；断言“不能当作未知指令”失败。
- 真实内置浏览器提交相同文本，显示提取 3 项，`text/html` 为“当前索引未收录 / 当前 context：未知”。
- map 的 default/域名、geo 的 default/地址同样误报。Nginx 固定源码通过自定义配置 handler 处理这些条目，不走普通指令注册查找；四类 handler 的嵌套开块在 ngx_conf_file.c 中被拒绝。

## 本轮覆盖统计核查

本轮开始的知识发布为 `1.27.1.1-948dd5954553c1bf`，1041 基础、0 深度、27 个非空 mechanism。默认值 243 未核实、792 已核实、6 不适用；继承 328 未核实、662 已核实、51 不适用。适用条件 1013 未核实、28 已核实，废弃状态 1023 未核实。这些补充事实状态不等于基本功能/入口缺失，也不能因基础状态而批量晋级。

## 修复后

- Sol 实施核心分类与回归，主 Agent 接手页面统计及收尾；修正一处少闭括号的测试夹具。R02本轮仅准确统计，筛选按方案后移。
- `node --test test/parser.test.mjs test/matcher.test.mjs test/config-results.test.mjs`：39/39 通过。
- `npm test`：108/108 通过，0 失败、跳过或取消；`npm run build` 成功。知识发布仍为上述版本；本批不修改知识内容、不晋级 deep。
- parser、contexts、matcher、config-results 和 app 的源码与实际 dist 文件逐字一致。
- 实际桌面页面混合四类专有块与 HTTP/Stream：22 项 = 普通指令10 + 块内条目12；唯一匹配9，需关注1（合成未知指令），外部引用3，目录去重8。规则和控制项分别标注，数据项没有普通知识查询按钮。
- 实际页面拒绝 map 中伪装成 Lua 的嵌套开块，显示解析失败/不完整且无候选按钮。未知祖先中的 map 不触发专有块分类；修改输入清空旧统计与详情，切换单项后 worker_processes 仍提示缺上下文。
- 直接调用构建产物及实际浏览器两份样例回放均通过：A主配置24/24匹配、2个外部引用、目录23；B配置258/258匹配、1个外部引用、目录40。原始部门配置不复制进本记录或测试仓库。
- 预览沿用已有本机限时机制，新地址 `http://127.0.0.1:50528/`；最终保留 B 配置和新版统计。截图 `analysis/config-summary-verified.png`、`analysis/block-entries-fixed.png`。
- 本批未增加网络读取、上传或存储接口；仍使用原有静态知识读取链路。本轮浏览器未额外采集网络请求列表，不将代码核对与已有自动契约测试冒称为本轮网络抓包验收。
- 独立审核已通过，反馈的P2修复并复核关闭，详见 `WEBSITE_REMAINING_REVIEW.md`；本轮不宣称全部特殊块、深度内容或现场部署已完成。

## 审核反馈修正

独立审核发现 P2：已知 HTTP server/location 下的 types 数据 context 为 null，被旧条件误提示缺少外层。已将真实页面提示条件提取为 `needsOuterContext`，先用 server/types 和 location/types 反例观察回归失败，再排除 block_entry。修复后40项定向测试全部通过，重新构建成功；没有把修复前108项全量结果冒称为修复后109项全量执行。

实际页面刷新后复测上述两个反例，均无缺外层提示；孤立 server 仍正确提示。最终再次恢复 B 样例，258匹配、需关注0、外部引用1。代码/构建变化仅提示谓词及其回归，之前其他验收结论保留。
