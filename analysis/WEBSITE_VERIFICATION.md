# 网站功能批次实测记录

日期：2026-10-10。对象：`1.27.1.1-a90b2ce291c5ed35`，网站源码与同发布静态数据。主线程实施记录，独立结论由 WEBSITE_REVIEW.md 提供。

## 已完成检查

- `npm run build`：成功。876 注册项、18 basic、0 deep，inventory_complete=false；新增 8 个参考项单独发布，不膨胀指令覆盖。
- `npm test`：45/45 通过，包含官方 SDK 的真实 stdio 子进程（不是 Codex 宿主接入）、参考契约及 23 段新增源码与 Git 冻结原文逐字核对。
- `node analysis/verify-build-gate.mjs --config project.config.json`：坏最后非人工条目被拒绝，current 保留，没有写出部分发布。
- `node analysis/verify-reference-build.mjs`：坏最后参考被拒绝，current 保留且无部分发布；只改变参考说明会产生新发布身份，指令计数不变。夹具全部在本次 mkdtemp 隔离目录，结束清理。
- `test/browser/query-ui.mjs`：真实浏览器通过原 server 片段、events、显式 stream 外层、输入联动、旧详情清理、筛选和永久链接。
- `test/browser/website.mjs`：真实浏览器通过单项外部 Lua 文件成功/详情失败提示、include 提示、关联多模块候选、原查询不变、迟到关联成功/失败最后选择获胜；API/变量筛选与源码展示、独立面板互不覆盖；坏 JSON、404、跨发布、坏嵌套只影响参考区；旧发布 `1.27.1.1-e27dbc95131afc51` 详情可读且不请求新参考库；静态请求都是 GET，无参数值或原文本上传。
- `node --check site/app.mjs`、`node --check scripts/build.mjs`：通过。

## 修正与范围

独立审核发现的 REF-01（日志宏有条件默认值）及 REF-02（nil 删除键）已修改知识，并补充核心日志缓冲区与共享字典删除路径片段。浏览器显示修正后内容，最终逐条核对待独立审核确认。

首次参考构建隔离脚本的成功构建因 site/src 符号链接与 cp 冲突而失败；改成夹具目录内真实副本后通过，不是产品发布失败。新增参考不参与解析，名称 `ngx.log` 不是配置指令名称格式；测试改用 `ngx.log;` 确认其在配置匹配中为 unknown，没有放宽解析器。

`test/browser/query-ui-async.mjs` 全部通过：当前详情失败可重选恢复、索引失败无旧候选、编辑和后选能使迟到成功/失败失效。

`test/browser/accuracy.mjs` 全部通过：网站与 Markdown 保留相同事实及状态、畸形 availability 拒绝并清旧详情、实际 stream proxy_timeout 的继承/补丁/时长区别正常展示；请求未上传原始参数。

不修改用户 Codex 配置，不部署内网；临时预览限定 10 分钟，源码中用户原有 openresty/tags 未改变。

响应式检查：真实浏览器 744px 视口下 document.scrollWidth=744，无页面横向溢出。随后截图动作因参考按钮自动滚动超时未成功；读取当前状态后准备人工滚动，原 TaskSpace 5 已不存在。遵循 ego-browser 技能，不用新空间绕过失效会话，不再操作浏览器。本轮没有成功截图，也未完成 390px 手机视口实测；此前四组功能浏览器回归均已结束并移除注入夹具。没有调用 finish，因为浏览器任务因会话失效停止，而非正常完成。

网站程序本批通过不能替代全量指令/参考内容、部门深度样例或内网上线验收。
