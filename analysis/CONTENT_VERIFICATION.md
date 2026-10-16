# 范围与核心基础内容实测记录

日期：2026-10-10。主线程执行记录；最终独立语义结论见 CONTENT_REVIEW.md。本批已审核通过，发布：`1.27.1.1-dee833a2c9381a27`。

## 实际结果

- `npm run inventory`：43 个下载项，10 个本地源码扫描，13 个固定树/安装入口核对的 Lua 参考库；另外 20 项保留待核实。913 注册项，不宣称全发行版总分母已闭合。
- 新增 XSS 6、memc 11、srcache 20 项，共 37 项，全部 registration_only；worker/events 五项进入 basic，当前 23 basic、0 deep。8 个 API/变量参考仍单独计数。
- `npm run build`：成功，inventory_complete=false，旧 immutable 发布保留。
- 内容构建及浏览器验收时 `npm test`：51/51 通过；含实际隔离 checkout 中的工作树修改/未跟踪头文件/固定头文件提取、显式数组长度、坏范围证据拒绝、安装原文改动保留 SHA 的负例，以及 37 个新增注册逐项与固定原文和归属核对。后续补丁门禁返工新增 6 项真实 CLI 回归，最终全套结果单列下方。
- `node analysis/verify-build-gate.mjs --config project.config.json`：坏最后注册详情拒绝，current 保留，无部分发布。
- `node analysis/verify-reference-build.mjs`：坏最后参考拒绝；仅参考变化或仅范围缺口变化均产生新 release；指令计数保持含义。全部在 mkdtemp 隔离夹具，结束清理。
- `KNOWLEDGE_TEST_URL=<有限预览地址> node analysis/verify-content-query.mjs`：真实静态 HTTP 读取五项 matched/basic，返回与网站发布数据逐字段一致；原 events 片段识别通过，修正的错误边界和 EMFILE/ENFILE 提示可见，旧发布 worker_connections 的 registration_only 状态保持；只有静态 GET，无输入参数上传。
- `test/browser/content.mjs`：真实桌面页面显示 913/23；原 events 片段点击 multi_accept、worker_connections 显示新说明/默认值/补丁影响/错误重试边界；accept_mutex_delay 展示实际复用条件；memc_pass 仍仅注册信息并含正确 revision；旧详情链接正常，无原输入上传。TaskSpace 6 正常 finish 一次，注入夹具移除。
- `node --check scripts/inventory.mjs` 与 `scripts/build.mjs`：通过。

## 发现与修正

主预审发现 multi_accept “遇到错误就退出”过度泛化，打回实施方后修正 ENOSYS 回退及 ECONNABORTED 条件继续并补来源。独立范围审查发现安装 code 的 blob 声明未与正文核对，主补 Git blob SHA1 实际校验及负例；坏输入在盘点输出写入前拒绝。

独立审核 C-R05 发现普通 patch 输出隐藏偏移/模糊信息，主用真实 dry-run 复现普通输出检测为 false、verbose 检测为 true。新增实际 CLI 的两个拒绝测试先失败（Missing expected rejection），修复后 5 项通过；正例、未核定 offset/fuzz、核定映射变化、最终 SHA 不符及缺失均经过实际隔离 Git 夹具和 patch 调用，不只是正则测试。当前脚本连续回放冻结 34 项成功，核对 107 处非零匹配（16 处带 fuzz）和 47 个最终文件 SHA256；正常执行不更新期望记录。撤回旧“无 offset/fuzz”结论，五项实际应用结果由实施方重新对照，独立审核后才关闭该问题。原用户仓库不受影响，所有临时副本已清理。

C-R05 第一轮门禁返工后实际 `npm test`：56/56 通过；后续审核发现未执行补丁名下的额外匹配键会被忽略，主新增真实 CLI 负例先复现红点，再在创建临时源码前拒绝未消费键。最终 `npm test`：57/57 通过，0 跳过、0 失败；正例仍为 34 补丁、142 hunk、107 非零匹配、16 fuzz、47 文件 SHA 一致。此返工只改变分析门禁、其审计记录和测试，不改网站代码或知识正文，候选发布保持 `1.27.1.1-dee833a2c9381a27`；已通过的实际 HTTP/桌面检查无需重复执行。

范围源码研究材料见 CONTENT_SCOPE_NOTES.md、CONTENT_SCOPE_EVIDENCE.md 和 knowledge/component-scope.json。库归类有正向 README、完整树及安装入口，不由名称或一次 regex 零命中做终态判断。宏/生成文件等未闭合组件继续保留未核实，不用目录测试代替全范围研究。

用户本轮明确不用手机页面，因此只做桌面验收，不将手机待测作为当前阶段阻断。没有改 Codex 配置、部署内网、编译或运行 OpenResty；未运行 mirror-tarballs。新增源码目录保留作后续知识生产；用户原有 openresty/tags 和各既有源码修改未改变。

独立审核最终通过，C-R01/02/04/05 均关闭，证据与执行者分别记录在 CONTENT_REVIEW.md。本批与全量内容、部门深度样例、实际上线和后移 Codex 宿主验收分别记录，不据本批通过宣告整站内容已完成。
