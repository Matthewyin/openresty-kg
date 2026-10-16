# 固定剩余25项统一验收

日期：2026-10-14。状态：25项源码内容、统一发布、自动测试、原样例回放、桌面验收及最终独立审核全部通过，无待修项；签署见SAMPLE_FINAL25_RUNTIME_REVIEW.md。

## 深度交互：固定范围

本轮按SAMPLE_FINAL25_RUNTIME_PLAN连续完成B3—B11的25个精确身份，统一以06a639发布、19项已有深度内容为基线。目标是内容、源码、测试、发布与桌面核对全部闭合，不以目录能够匹配或徽标改变作为完成。

## 直接执行：执行记录

- 主线程修改前冻结25项旧evidence数量/摘要、非白名单字段摘要，以及非目标curated序列摘要于test/fixtures/final25-baseline.json；保护既有事实和19项深度内容。
- 新建final25-runtime专项：逐项从固定Git对象重建实际来源、核对完整来源顺序与元数据、旧字段/旧证据保护、精确评级集合、同版本冻结索引、真实查询及Markdown。
- 审核者独立核实25身份46个实际源码行锚点，落盘final25-semantic.json。主测试校验步骤直接绑定，反例在总引用集合不变且validateRuntime仍通过的情况下移走锚点，确认语义校验拒绝。
- 初始27项发布检查在06a639上全部按预期失败：候选尚未发布，仍19deep；这是本轮未实施基线，不是已完成版本回归。
- 历史B2测试固定06a639及其查询release；sample-remaining14精确采用历史证据前缀和旧patch对象；VTS当前评级只允许本轮四身份晋级，其他20项保持原评级。
- 现有Codex桌面页可访问且起点页脚为06a639。本轮复用该页，不做手机验收。最终构建后需reload再核对全部25项。
- 实施Sol首次遭遇429限流；同模型重试后已恢复并写入B3候选。规划和审核按Astra low进行。没有更换用户指定模型。

最终门槛：25项源码及34补丁审核、必要修正、统一构建、定向与全量测试、两份原样例内存回放、同发布桌面逐项内容和链接比对、最终审核签署。未达到前本文件保持进行中。

## 中间集成检查

- 主并行接手VTS四项，旧文件未变后通过apply_patch仅更改四身份；新增21步，证据另见SAMPLE_FINAL25_VTS_EVIDENCE。Sol保留21个Nginx实施范围。
- 中间构建e1d69351c54d434f：1041/33（基线19+Nginx10+VTS4），不是最终25项交付。用于检查已写入候选的来源和结构。
- VTS8项定向先5过3失败：错绑测试误把同范围但未参与runtime的旧来源放入附录，导致先结构失败。修正只移动runtime.source_ids内的锚点后8/8通过，产品知识未因测试修订改变。
- 已落盘14身份的28项中间检查：27过1失败。stream access_log的“无logs”与语义fixture的“NULL/没有”等是等价措辞，审核已仅校准措辞，保留原源码锚点。
- 独立审核复核B3-R1—R4关闭；VTS四项21步限定内容通过，中间94条sources已逐字核对。B4/B5五项内容退回仍待修订，未以结构测试代替源码审核。
- 语义fixture增至25身份58锚点；主补齐固定四组件身份、补丁状态精确白名单及其他键保护、非目标curated和目标stableHash保护。末尾来源按Nginx distribution-version/VTS module-build分别保留。
- 预览服务因原120分钟到期停止，已在原51795端口正常重启；页面最终复测尚待最终发布。

## 候选收口与构建门禁

- 21个Nginx身份与4个VTS身份均已写入；累计126步。B3—B9审核退回项已逐项修订，最后B10正文分配失败/成功赋值顺序待最小修正。
- 34补丁矩阵已覆盖最终21个Nginx身份的所选区间；VTS另核本体及所引Nginx调用。仅两项listen允许unaffected迁移为affected，其余状态不变；没有重新执行历史补丁回放。
- 首次全25候选构建被现有validateRuntime拒绝。按diagnosing-bugs流程以逐条候选复用原详情的最小复现定位：仅server_tokens将util/mirror-tarballs列为直接运行代码。退回实施移出步骤直接引用，保留既有发行版本事实及全sources/patch引用；不放宽代码来源校验规则。
- 语义fixture现25身份72锚点；审核仅校准“无logs”“自动Server头缺失”等同义措辞，固定源码行与反例要求保持。

## 最终发布及主验收结果

统一发布：`1.27.1.1-1c2ead24459672e6`。目录1041项基础内容（包含深度内容），其中44项深度内容；发行内1017/40，部门扩展24/4。相对06a639精确新增本轮25项深度内容，其他1016项未漂移。

- knowledge/directives.json SHA-256：`aa4cec0555f452638815b155ea0b625f626ae5cd7cac61fb80ba70531ddaeb14`。
- knowledge/extensions.json SHA-256：`e0e7f95436f03d97242d7907f34a749e5aa9e2fe9c48a65d70745f877a111942`。
- 25项候选对象集合摘要（计算方式见REVIEW）：`d7565fced05fc2008d46dc41aad1e597ba75b69b1c03e559ea326974f9476c43`。
- test/fixtures/final25-semantic.json SHA-256：`16905038b975d469a8f58ed6c665cd88bf5517dadac56802e3b66140d0e00517`。
- 第三次正常build成功；前两次失败均由原有门禁拦截。第二处是HTTP access_log配置回调内的event安装片段不能充作直接runtime来源：保留完整evidence/patch引用，运行步骤入口收窄为已安装回调被调用时，保留真实flush/write与失败出口。未改变src/site/schema或放宽评级规则。
- 定向检查89/89通过，含final25专项53项、历史B2、剩余14项和扩展模块。日志：sample-final25-runtime-focused.log。
- 全量npm test：247/247通过，fail/cancelled/skipped/todo均0。日志：sample-final25-runtime-tests.log。全量套件包含既有隔离补丁回放测试；本轮内容研究的34补丁矩阵是固定原文/hunk审核，不将其混称为重新生成历史补丁审计。
- 真实查询与Markdown按同一release核对25项范围、步骤和引用；历史版本保持原评级。错误源码、来源重复/顺序/版本漂移、补丁状态越权及语义错绑反例均被拒绝。

## 两份原样例回放

原文件仅由主线程读取到本地内存，不复制进仓库或测试夹具。A取openresty采集.txt第3—73行主配置；B取另一份Nginx配置全文。CLI和实际网页均使用本次统一发布。

| 样例 | 普通指令/唯一匹配 | 解析错误 | 匹配需关注 | 外部引用未分析 | 网页去重候选 |
| --- | ---: | ---: | ---: | ---: | ---: |
| A | 24/24 | 0 | 0 | 2 | 23 |
| B | 258/258 | 0 | 0 | 1 | 40 |

两份合计50个去重知识身份，44项限定运行时内容、6项配置边界内容；默认值/继承未核实数0。六项仍为basic并非漏做：include、events、stream、http及HTTP/stream各自的variables_hash_bucket_size。其配置组织或构建职责已按C1收口，不造请求期消费来凑deep。

## 25项桌面逐项验收

复用原Codex桌面浏览器tab1、127.0.0.1:51795，重载后页脚为本次release。真实填写A/B并点击查询后只提取汇总结果，确认与CLI相同；随后清空原配置输入，切回全部目录，实际点击以下25个身份。

逐项读取真实DOM并与本release详情比较：标题、模块、deep徽标、runtime范围、固定现场验证边界说明、全部condition/action、每步完整引用链接、独立文档链接、全部源码code/url及页脚release。共126步、651条源码展示全部一致。初次UI比较失败仅因浏览器传输重排对象键；按字段值数组比较后通过，没有改网页或数据。所有校验仍比较全文与完整链接，不改为宽松包含判断。

下表全部基线basic、最终deep；测试及桌面列“通过”指上文同一release的真实执行结果。源码数包括该条全部发布来源，文档数为runtime独立文档引用；非全站唯一来源数量。补丁“无直接影响”只限所列消费范围，“不适用”为VTS本体发行归属判断。逐项内容审核见REVIEW最终签署。

| 精确身份 | 步数/源码数/独立文档数 | 补丁结论 | 测试 | 桌面 | 未决 |
| --- | --- | --- | --- | --- | --- |
| nginx--ngx_http_limit_conn_module--limit_conn_zone | 5/21/1 | 无直接影响 | 通过 | 通过 | 无 |
| nginx--ngx_http_limit_conn_module--limit_conn | 5/21/1 | 无直接影响 | 通过 | 通过 | 无 |
| nginx--ngx_http_proxy_module--proxy_limit_rate | 5/32/1 | 无直接影响 | 通过 | 通过 | 无 |
| nginx--ngx_http_log_module--log_format | 4/24/1 | 有影响 | 通过 | 通过 | 无 |
| nginx--ngx_http_log_module--access_log | 5/27/1 | 有影响 | 通过 | 通过 | 无 |
| nginx--ngx_stream_log_module--log_format | 4/20/1 | 无直接影响 | 通过 | 通过 | 无 |
| nginx--ngx_stream_log_module--access_log | 5/22/1 | 无直接影响 | 通过 | 通过 | 无 |
| nginx--ngx_errlog_module--error_log | 5/34/1 | 有影响 | 通过 | 通过 | 无 |
| nginx--ngx_http_core_module--error_log | 5/35/1 | 有影响 | 通过 | 通过 | 无 |
| nginx--ngx_stream_core_module--error_log | 5/25/1 | 有影响 | 通过 | 通过 | 无 |
| nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_zone | 5/28/3 | 不适用 | 通过 | 通过 | 无 |
| nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_filter_by_host | 4/19/1 | 不适用 | 通过 | 通过 | 无 |
| nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_display | 6/25/1 | 不适用 | 通过 | 通过 | 无 |
| nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_display_format | 6/22/2 | 不适用 | 通过 | 通过 | 无 |
| nginx--ngx_core_module--pid | 6/33/1 | 无直接影响 | 通过 | 通过 | 无 |
| nginx--ngx_http_core_module--listen | 6/36/1 | 有影响（本轮迁移） | 通过 | 通过 | 无 |
| nginx--ngx_http_core_module--server | 5/27/2 | 无直接影响 | 通过 | 通过 | 无 |
| nginx--ngx_http_core_module--location | 6/27/1 | 无直接影响 | 通过 | 通过 | 无 |
| nginx--ngx_stream_core_module--listen | 6/33/1 | 有影响（本轮迁移） | 通过 | 通过 | 无 |
| nginx--ngx_stream_core_module--server | 5/18/1 | 无直接影响 | 通过 | 通过 | 无 |
| nginx--ngx_http_core_module--client_max_body_size | 4/24/1 | 无直接影响 | 通过 | 通过 | 无 |
| nginx--ngx_http_core_module--keepalive_timeout | 6/23/1 | 无直接影响 | 通过 | 通过 | 无 |
| nginx--ngx_http_core_module--sendfile | 5/27/1 | 无直接影响 | 通过 | 通过 | 无 |
| nginx--ngx_http_core_module--default_type | 3/13/1 | 无直接影响 | 通过 | 通过 | 无 |
| nginx--ngx_http_core_module--server_tokens | 5/35/1 | 有影响 | 通过 | 通过 | 无 |

截图：sample-final25-runtime-browser.png，展示同发布VTS display_format运行链及边界说明。只做桌面，没有手机验收。原样例输入已清空；保留VTS详情页供用户查看。预览仍有120分钟生命周期，不是内网常驻部署。

## 交付边界

固定剩余25项均已补齐，不再有本清单内容待办。REVIEW已签署本发布通过，25行表与实际发布逐项一致，无待修内容或记录阻塞项。现场二进制版本、模块安装、include文件内容、真实OpenResty请求执行及Codex宿主接入均未纳入这次完成声明；匹配成功不等于现场配置有效。
