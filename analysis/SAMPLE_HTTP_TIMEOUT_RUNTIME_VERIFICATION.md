# HTTP 解析器与代理超时运行时验收

日期：2026-10-13。状态：实施、测试、桌面验收及独立审核已完成；最终发布 `1.27.1.1-c49915e4ed7a7e58`。以下保留过程记录。

## 深度交互：范围与基线

按 `SAMPLE_HTTP_TIMEOUT_RUNTIME_PLAN.md`，以 `1.27.1.1-f8c21e3662af9366` 为固定基线，仅补 HTTP core resolver 和 HTTP proxy connect/read/send timeout 四身份。旧5项深度、其他1037详情、默认值与继承等事实保持不变，复用现有运行时校验、晋级及页面，不改产品代码。

主线程只读原文件：A取第3—73行主配置，共24项，无本批身份；B全文件258项，本批HTTP resolver20次，三种timeout各2次。仓库没有复制原始配置正文。四条目原有limitations已经显式绑定证据，本批不需表示转换。

## 直接执行：检查记录

- 新增 `test/http-timeout-runtime.test.mjs`，包含四身份真实发布与固定Git证据、全1041身份字段保护、四类运行分支及真实查询/Markdown，共10项初稿。
- 旧stream批次测试固定到其f8c21历史发布，保留原精确5deep断言；本批另对当前发布严格要求旧5+新4=9deep。不改产品覆盖统计。
- 新测试首次对旧f8c21运行10项失败，原因是四项尚无runtime和deep晋级，属于构建前预期，不能算新实现结果。
- 源码专项特别保护：DNS等待独立于连接；TLS已有timer不无条件重启；写事件受pipelining补丁影响；响应头的重置片段在`#if 0`中；缓冲正文超时的upstream_error通向502结束参数，非缓冲/升级连接为504参数；已发头部后的结束不等于向客户端重新发送上述状态。

后续待记录：知识与补丁冻结、正式构建、专项和全量测试、原样例与桌面四项逐字段对照、独立审核签署。未运行或编译OpenResty，未进行现场网络验证。

## 初稿构建及实际验收

- 测试初审R1修复未定义常量；R3限制patch_status仅note/source_ids归一化，并加curated/发布同步额外字段负例；R4在Sol写入runtime前冻结四项旧curated evidence前缀摘要及长度，增加删除/重排负例。
- R2新增第11项专项：DNS失败、DNS与connect边界、TLS已有timer、pipelining、头部#if 0、缓冲错误及已发头部转换，逐项检查对应step的说明和源码锚点。移走对应出口证据到其他步骤、保持总source_ids及validateRuntime结构仍通过时，专项必须拒绝；错误正文也必须拒绝。
- `npm run build` 生成 `1.27.1.1-c49915e4ed7a7e58`，1041基础（包含深度）/9深度；bundled1017/9、部门扩展24/0。仅本批四身份晋级，其他1037详情和旧事实全字段保持，旧evidence前缀保持。
- 四项35步（resolver/connect/send/read为9/9/7/10），122项新增evidence，见实施证据记录。实际sources与固定Git对象的元数据、行号、代码、URL逐字一致。
- `node --test test/http-timeout-runtime.test.mjs test/runtime.test.mjs test/stream-runtime.test.mjs test/sample-facts.test.mjs`：36/36通过。
- `npm test`：167/167通过，0失败/跳过，32.3秒，日志 `sample-http-timeout-runtime-tests.log`。含既有隔离补丁回放，不把旧历史测试结果当本轮结果。
- 主线程用当前实际发布重新只读解析原文件：A24/24、外部引用2；B258/258、外部引用1；无解析错误，50去重身份，defaults/inheritance未核实为0。
- 62415本地桌面预览HTTP200，复用原Codex标签；网页A24/24、B258/258、外部引用2/1均保持。B目录按HTTP模块区分同名stream条目，逐项打开四详情，35个condition/action、顺序、范围、全部步骤/文档链接及deep徽标与实际dist相同。
- 截图 `sample-http-timeout-runtime-browser.png` 已查看，展示HTTP读超时运行时区块；保留第二份配置在页面供用户继续查询。无手机验收、外网部署或产品代码改动。

当前待独立审核对冻结语义和上述发布签署；本节初稿验收通过不提前代表最终审核通过。如后续内容有修复，须重新构建及受影响验证后记录最终发布。

## 最终收口

独立审核已在 `SAMPLE_HTTP_TIMEOUT_RUNTIME_REVIEW.md` 对c499签署通过：35步语义/失败出口/步骤证据、122项新增固定证据、34项补丁交集、全1041项发布字段边界及167/167测试日志均已核对，R1—R4全部关闭。内容未再修改，最终发布仍为c499；上述定向、全量、原样例与网页验收均适用于最终版本。

本批四身份完成，累计9项深度内容，不表示全站1041项均已完成运行时深度。未单独升级resolver_timeout或其他依赖指令，Codex真实接入仍后移。规划、实施、审核子Agent已关闭；没有本轮需清理的临时文件，保留验收截图、测试日志与不可变发布。桌面预览按项目既有10分钟自动关闭策略保留供用户查看。
