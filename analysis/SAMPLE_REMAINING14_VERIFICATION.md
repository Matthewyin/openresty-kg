# 两样例剩余14身份验收

日期：2026-10-13。依据 `SAMPLE_REMAINING14_PLAN.md`，当前分阶段记录，不把中间构建当作14项完成。

## VTS中间验收

- 只补VTS display的defaults/inheritance/evidence，源码事实已独立审核通过。完整证据说明见 `SAMPLE_REMAINING14_VTS_EVIDENCE.md`。
- 原发布上运行新增VTS回归失败（尚无新增core-location-create片段），构建后转绿。
- 中间 `npm run build` 成功，release `1.27.1.1-457b89144a6e5398`，仍1041 basic、0 deep。
- `node --test --test-name-pattern='VTS展示入口|nginx-module-vts' test/sample-remaining14.test.mjs`：2/2通过。直接核对实际新发布sources完整集合，不以内存正确对象覆盖掩盖错误。
- 审核提出patch引用保护缺口：已在归一化前精确比较patch_status与curated授权结果，并补额外/重复patch引用、错误status/note、旧证据改删和summary误改负例；源码复核已关闭P2，整批实际运行待13项内容到达。

## 整批验收完成

- 发布：`1.27.1.1-647706874ae7c03c`，1041 basic、0 deep；14项知识和新增源码证据已构建入实际产物。
- 本批实际发布回归16/16通过；全量 `npm test` 138/138通过，包含既有隔离补丁回放，日志为 `sample-remaining14-tests.log`。实施时范围外OpenSSL内存回放摘要疑点未用于证明回放成功，以既有脚本实际通过为准。
- 直接读取原文件重放：A既定主配置24/24唯一匹配，外部引用2；B全配置258/258唯一匹配，外部引用1。两样例50个去重身份的defaults/inheritance无unverified；not_applicable均有说明和证据，不冒充普通默认值。
- 全库defaults：225 unverified、803 verified、13 not_applicable；inheritance：312、670、59。样例补齐不代表全库补齐。
- 桌面浏览器在59462预览复测A/B，结果同上。实际展开VTS display、HTTP listen、main pid默认/继承，确认新版正文。截图 `sample-remaining14-browser.png`；用户原配置仅内存读取，不复制到仓库。
- 独立审核14项源码事实、73个新增实际发布片段及字段保护通过，P2测试问题已关闭，见 `SAMPLE_REMAINING14_REVIEW.md`。
- 阶段一完成，可以按计划进入runtime首批。当前0 deep，尚无运行时深度成果；唯一匹配不代表参数或现场环境验证通过。
