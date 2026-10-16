# 样例代理链运行时验收

日期：2026-10-13；2026-10-14补完页面复测。状态：B1内容、发布、自动测试及最终桌面复测完成。C1配置边界已独立审核通过。

## 深度交互：范围

按 `SAMPLE_REMAINING_RUNTIME_PLAN.md` 的B1，以c49915e4ed7a7e58为固定基线，仅补HTTP set、stream set、HTTP proxy_set_header、proxy_http_version、proxy_ssl_session_reuse五身份。既有9项deep及其他1036项详情保持。C1六配置项另以 `SAMPLE_CONFIGURATION_BOUNDARIES.md` 收口，不强造runtime。

主线程直接从两原样例统计50身份；上述五项合计出现19/4/20/1/20次，HTTP与stream不混。A只取第3—73行主配置24项，B全配置258项，原文不落盘进仓库。未运行OpenResty或实际网络请求。

## 直接执行：过程记录

- 新增 `test/proxy-chain-runtime.test.mjs`，12项初稿覆盖五项真实发布/固定证据、全身份及精确deep集合、五类独立消费分支和真实查询/Markdown。首次对c499运行12项预期失败，原因是新runtime尚未写入，不冒报新内容失败。
- HTTP超时历史专项固定c499，保持其精确9deep；本批另核预期9+5=14。历史HTTP/stream/HTTP超时29项已通过。
- 实施写入前冻结五项curated evidence前缀长度及SHA256，加入删除/重排负例。Sources按原顺序加新增证据并保留发行版本末项逐字比较，不排序真实数组；错误元数据、额外/重复/重排来源均拒绝。
- 补丁状态默认锁住各自基线；若新增消费确受影响，只能按精确身份和固定补丁证明授权状态迁移。stream set旧limitations允许精确固化基线对象，实际发布事实不得漂移。

待冻结稿后完成对应步骤的证据错位负例、正式构建、定向及全量测试、原样例与桌面验收、独立签署。

## 首次发布与审核修正

- 主实际阅读固定三项ssl callback-yield普通握手hunk及upstream_timeout_fields:34–42，批准仅session_reuse由unaffected迁移affected，原因是新增普通握手及其等待计时直接消费受补丁影响。测试将状态变更锁定到这一精确身份，其余patch键和其他四项状态仍保护；旧配置事实不改。
- 第13项增加七类对应步骤的条件/说明及源码锚点，包含HTTP/stream赋值失败、空头屏蔽、Host/SNI、版本与连接池、临时peer空回调、TLS补丁消费。引用移错步骤但保持总集合与结构校验通过时仍拒绝，错误正文同样拒绝。
- 初稿build发布 `1.27.1.1-d9627861d4d894fc`，1041基础/14深度，bundled1017/14、扩展24/0。五项33步（HTTP set7、stream set5、header6、version5、session_reuse10），其余1036项和所有旧事实保持。
- `node --test test/proxy-chain-runtime.test.mjs test/sample-facts.test.mjs test/http-timeout-runtime.test.mjs`：31/31通过。初稿`npm test`：180/180通过，无跳过，日志 `sample-proxy-chain-runtime-tests.log`。
- 原文件CLI回放A24/24及外部2，B258/258及外部1；50身份含14深度，默认/继承unverified仍0。C1六项保持basic无runtime。
- 50552桌面HTTP200；A/B网页同样全部匹配。A打开version、B分别打开两set/header/TLS，33步条件/动作/顺序、scope、全部代码/文档URL与dist逐字段一致，deep徽标正确。header首次采集抢在异步详情就绪前得到0项，等待目标详情末步骤可见后6项完整对上；仅修验收等待，没有改产品。截图 `sample-proxy-chain-runtime-browser.png` 已查看。
- 测试和展示通过后，独立审核仍发现R4：version第1步默认1.0的声明漏绑已有merge-default；R5：状态行解析ERROR需区分r->cache提前返回与非缓存设置connection_close的路径。已打回Sol，另要求SSL补丁说明删除新增的内部批准流程句，批准记录留本分析而非用户知识正文。
- 新增第14项独立回归，在d962上1/1失败，明确抓到默认声明对应step缺少3831消费证据。修正后需重新build及受影响测试；不得把d962的180/180当成修复后的最终结果。

最终签署待上述最小修正完成。容量批的worker/连接池/rlimit仅做入口预查，未修改知识或计入完成。

## 最终修订与验收边界

- 最终发布为 `1.27.1.1-ca870e6c128ac027`。R4已将原merge-default绑定到version第1步及runtime来源并集；R5已区分NGX_HTTP_CACHE且r->cache存在的提前返回与非缓存status/connection_close回退。SSL补丁说明已删除内部批准流程句，不改变源码结论。
- 最终定向32/32通过，日志 `sample-proxy-chain-runtime-final-focused.log`；最终全量181/181通过，无失败、取消或跳过，耗时36419.432毫秒，日志 `sample-proxy-chain-runtime-final-tests.log`。不将初稿180项结果替代最终结果。
- 独立审核已对最终五项124条curated evidence及139个实际sources重新核对固定Git片段和完整元数据、来源顺序、patch白名单以及全部1041详情。非目标1036项保持，deep精确为旧9加本5；1041 basic/14 deep，bundled1017/14、扩展24/0。
- 最终桌面复测未完成：旧50552预览到期后标签进入连接错误页；替代51795服务HTTP200，但自动导航被Browser Use URL policy拦截。已请求用户手动打开 `http://127.0.0.1:51795/`，不绕过限制。原截图 `sample-proxy-chain-runtime-browser.png` 和A24/24、B258/258的网页逐字段检查属于d962初稿，不能作为ca870的最终页面证据。
- 本轮50个样例身份的进度为14项已审限定运行时、6项配置边界收口但保持basic、30个待补运行时候选。下一批B2容量5项仅预查入口，未实施或晋级。不运行OpenResty，不声称真实网络或现场配置通过。

## 预览访问恢复

用户反馈51795无法打开后，本机curl复现连接失败；原预览进程已正常退出。检查脚本与项目配置确认预览原为随机端口、600000毫秒后自动关闭。将project.config.json的preview改为固定51795端口、7200000毫秒，并同步README；仍只监听127.0.0.1，不修改知识或重新构建发布。

重新运行npm run preview，服务明确输出120分钟有效。首页、bootstrap.js、styles.css、site-config.json及真实knowledge/index.json均返回200，知识版本仍ca870。一次探测误用了不存在的data/index.json返回404，随后按site-config实际路径纠正，这不是产品资源缺失。

浏览器仍停在此前连接错误的内部页面，只读观察被URL安全策略阻止；没有尝试其他导航机制绕过。已请用户刷新已恢复的原地址，最终桌面验收状态仍为待完成，HTTP资源恢复不替代页面验收。

## 2026-10-14 最终桌面复测完成

本轮恢复51795本地服务后，原浏览器标签列表为空。在同一Codex浏览器按缺失标签流程新建预览标签，正常显示HTTP页面，未再次遭策略阻止，未操作此前内部错误页。页面页脚发布为ca870，基础1041/深度14。

仅在内存读取原样例：A第3—73行，完整主配置模式24/24唯一匹配、外部2；B全文258/258唯一匹配、外部1。A打开proxy_http_version；B打开HTTP set、stream set、proxy_set_header、proxy_ssl_session_reuse。等待各详情末步骤可见后，逐字段核对最终ca870数据：5/7/5/6/10步共33步，condition/action、顺序、scope、全部代码及文档URL、deep徽标全部一致。没有以HTTP200或初稿截图替代此检查。

最终截图 `sample-proxy-chain-runtime-final-browser.png` 已保存并目视检查；旧截图保留为历史记录。原配置不写入仓库。此处仅补完桌面展示验收，不代表参数、外部include或实际OpenResty运行验证。
