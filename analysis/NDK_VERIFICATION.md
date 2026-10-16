# NDK 四组件目录接入实测记录

日期：2026-10-10。主线程执行记录；独立审核结论见 NDK_REVIEW.md。冻结发布：`1.27.1.1-7e53dde6171ab67c`。本批只接入正式注册目录，不增加已核实功能正文。

## 实际结果

- `npm run inventory`：949 注册项；43 个下载项中，27 项已检查，16 项仍未核实。14 个本地来源扫描与13个 Lua 库用途分类属于不同粒度，不以两者相加构造全量知识完成率。`inventory_complete=false`。
- 四组件新增36项：ngx_devel_kit 1、set-misc 29、array-var 4、form-input 2，全部 `registration_only`。23 basic、0 deep、8独立参考保持。
- `npm run build`：成功发布上述版本，旧 `1.27.1.1-dee833a2c9381a27` 保留。正式来源配置使用固定 tag 与完整 SHA，不读取工作树改动作为版本证据。
- `npm test`：64/64 通过，0失败、0跳过。新增提取检查包含真实固定源码集合、空白字面量、尾逗号、owner/include 断链、未知表达式拒绝、固定树不受工作树污染及坏输入保留既有目录；发布检查包含36项固定源码、NDK 条件与临时宏说明、旧913详情除 release_id 外保持及8参考内容保持。
- `node analysis/verify-build-gate.mjs --config project.config.json`：坏最后详情拒绝，current 不变，无部分发布。
- `node analysis/verify-reference-build.mjs`：坏最后参考拒绝；仅参考变化及仅 coverage 变化均改变发布身份。在隔离副本执行，临时目录清理。
- `node --check scripts/build.mjs`、`test/ndk-publication.test.mjs` 和 `analysis/verify-ndk-query.mjs`：通过。

## HTTP 与桌面

`KNOWLEDGE_TEST_URL=<有限预览地址> node analysis/verify-ndk-query.mjs` 已在真实本机 HTTP 执行；本次收口在新限时预览重复检查，结果通过。upstream_list、set_encode_base64、array_split、set_form_input 均在明确模块/context 下 matched，详情与网站发布 JSON 逐字段相同，Markdown 含固定源码引用。NDK owner/header/container 来源正确，示例不入目录；23 basic、8参考及旧发布查询保持。调用方记录请求均为静态 GET，无正文，URL 不含输入参数标记。

用户明确允许新建桌面验收空间，使用 TaskSpace 7「NDK 四组件桌面验收」与同一 p1。此前清理历史 CDP 注入 identifier 的前置步骤返回 Script not found，发生在查询脚本执行前；没有将该失败记为产品故障或验收通过。随后先观察同一空间确认仍可用，删除不存在的历史 identifier 的前置调用未再执行。

旧限时预览到期后，按 project.config.json 启动新的10分钟 loopback 预览；没有新建替代空间。实际执行 `test/browser/ndk.mjs`，退出码0，全部断言通过：

- 桌面页面显示949注册、23基础已核对。
- 四组件单项查询均展示对应模块和「仅注册信息」，没有展示为基础完成。
- upstream_list 展示 NDK_UPSTREAM_LIST 条件、header 注册、真实 module owner、owner include、commands 容器；中文说明明确 NDK_UPSTREAM_LIST_CMDS=1 是容器临时定义，不要求用户另设开关。
- 导航到旧发布 multi_accept 详情仍显示基础内容已核对。
- 在页面初始化前注入 fetch 记录夹具，查询阶段的方法/正文及参数标记检查通过；这项记录只支持本批执行场景，不推广为所有未来请求的保证。

正常路径移除本次注入，`await task.finish({ keep: [] })` 调用一次并成功结束。仅桌面验收，没有手机任务。

## 范围与保留状态

NDK 正式 config/owner/include 关系及三个使用方固定命令集合的依据见 NDK_PLAN.md、NDK_MACRO_NOTES.md 和 NDK_SOURCE_PROVENANCE.md。没有执行 NDK 生成器、编译或启动 OpenResty；没有通用宏展开、跨组件回调解析、数据库、Codex 配置修改或内网部署。

本批不改知识正文，不重做未变化的 C-R05 补丁审核。四个源码目录保留用于后续内容生产；隔离测试目录由测试 finally 清理。用户原有 openresty/tags 保留。16项范围缺口、全量基础知识、部门深度样例和后移的 Codex 宿主接入仍未完成。

本记录完成主线程 N04 实测；审核 Agent 已在 NDK_REVIEW.md 独立完成 N05，本批通过，无确定缺陷需打回。源码状态最终检查：各配置来源仓库均 clean，OpenResty 主仓库仅保留用户既有 `?? tags`。不以自动测试数量替代独立结论，不宣称全范围知识完成。
