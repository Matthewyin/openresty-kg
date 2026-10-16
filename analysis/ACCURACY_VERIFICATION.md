# 本批准确性主线程验收

日期：2026-10-10。冻结方案为 `ACCURACY_PLAN.md`；本批范围为 R01 复核、R02/R03 修复和 8 个 stream 基础知识条目。独立审核单列在 `ACCURACY_REVIEW.md`，本文件不代替独立通过结论。

## 构建与自动检查

实际 `npm run build` 成功，知识发布为 `1.27.1.1-e27dbc95131afc51`。876 个注册项逐条经过写入前统一校验；18 basic_verified、0 deep_verified、inventory_complete=false。新增 server/listen/proxy_connect_timeout/proxy_timeout/set/proxy_pass/access_log/error_log 的 stream 身份均计 basic；两条旧 worker 核心研究仍 registration_only，未统一升级 Nginx。

实际 `npm test`：38/38 通过，无跳过。包含真实 querySingle 对各类损坏嵌套详情/索引、JSON/schema/release/缺文件错误的结构化失败、事实状态与链接、指令级 patch 输入映射、全部发布详情契约、固定发布查询、parser/matcher 和官方 SDK stdio 子进程协议。不能把 Node 测试计数当作浏览器测试或真实 Codex 宿主验收。

`node analysis/verify-build-gate.mjs --config project.config.json` 实际执行隔离构建：将最后一个没有人工知识的 more_clear_input_headers 注册项 compile_guards 改为 null；构建拒绝对应 id 并保留旧 index 原文，未创建任何新发布目录。原项目输出未被这个失败夹具修改，临时目录已清理。普通门禁函数测试与实际构建测试分别留证。

补丁回放使用 `NGINX_PATCH_AUDIT.json`：本历史批次曾报告“34 个有效补丁均应用成功，无 offset/fuzz”。后续内容审核 C-R05 发现普通 patch 输出隐藏该信息，现撤回“无 offset/fuzz”断言；现行详细回放、固定匹配与最终文件哈希门禁见 `NGINX_PATCH_AUDIT.md`、`CONTENT_VERIFICATION.md` 和 `CONTENT_REVIEW.md`，不沿用旧结论作为通过证据。原记录的 stream core/set/log 字节不变、proxy 模块由 3 项补丁改变、core log 由 intercept 补丁改变在后续重新回放中核对。源码副本已经删除，原 repo 和用户 tags 保留。有效集合另经独立审核核对脚本条件和顺序，不仅根据补丁名称搜索下结论。

独立审核发现 K01 证据裁切不完整：已将版本条件纳入 45–60/45–78、balancer 条件纳入 101–106、导出重试次数的返回语句扩至 31。四个所列事实 unaffected 条目增加完整镜像脚本 35–550 证据，同时维持限定范围说明。没有冒充 patched 文件行号或深度运行时验证。

## 真实浏览器检查

使用 ego-browser TaskSpace 4、同一 p1；临时 HTTP 静态预览指向本次 dist，非 file 模式。复现脚本为 test/browser/query-ui.mjs、accuracy.mjs、query-ui-async.mjs；运行时由执行命令传入 uiTest.url 和 uiTest.spaceId，不将本机端口写入产品配置。

query-ui.mjs 实际通过：孤立 server 解析 8 项但不猜 context；目录仅本次候选、没有默认 Lua 详情；手动选择只预览、不改歧义；未知/解析失败/编辑清除旧结果；显式 stream 外层后精确匹配；全目录筛选撤销、唯一候选预览及固定版本永久链接。

accuracy.mjs 实际通过：页面启动前受控修改合法详情，注入 not_applicable 默认、verified 继承及 note、依赖、unverified 文档标题/链接；真实页面与浏览器内调用共享客户端取得的 Markdown 同时包含全部哨兵文本及状态，文档链接一致。记录 fetch 仅静态 GET、无 body、URL 无独特配置参数标记。仅注入测试数据，没有修改正式知识文件。

同脚本将 availability 改成空对象，实际页面反馈知识暂不可用，撤销旧详情、保留本次唯一候选；恢复正常读取后查询 stream proxy_timeout，显示默认 10m、继承、读写间隔而非会话总长、Lua 覆盖及补丁影响。受控注入结束删除并重载，不残留夹具。

query-ui-async.mjs 完整重跑实际通过：旧单项成功/失败与旧候选详情不能覆盖新输入/选择；当前详情失败保留候选、重选恢复；索引失败没有旧候选；当前候选失败保留列表且撤销选中态。

此脚本首次在原第 84 行等待超时：旧断言等“读取失败”，新错误分支按客户端错误码显示“无法读取知识文件，请检查站点连接”。用临时内存脚本定位等待行，再最小复现受控 multi_accept 读取失败，实际页面为该中文原因、候选数 3、选中数 0。只改测试等待 error notice 并断言具体原因，没有改产品代码。完整重跑通过后移除注入；诊断没有落盘调试日志，不能将这次红点误报为产品异步缺陷修复。

另外在 744×778 视口实看正常 proxy_timeout 详情，默认值、继承、功能与限制可读，documentElement.scrollWidth 未超过视口；截图留在 `analysis/accuracy-stream.png`，主线程已查看图像。沿用原页面视觉，仅补事实，不借准确性批次重做布局。

## 本地 MCP 与真实 HTTP 静态知识

另用官方 Client/StdioClientTransport 启动 mcp/server.mjs，不用 preload fetch：读取同一临时 HTTP 知识站，逐项查询上述 8 项并显式提供正确 module/context，8/8 matched/basic_verified。返回发布均为本批 release，content 文本与 structuredContent.markdown 一致，包含继承、依赖及固定发布详情链接。测试客户端结束关闭 stdio 子进程。

这是实际协议及 HTTP 读取检查，不是用户 Codex 的真实宿主接入；没有编辑用户 Codex 配置，没有引入集中后端或 MCP HTTP 监听。

## 剩余范围

完整发行版指令覆盖、多数基础知识、深度内容、部门正式样例和真实 Codex 接入仍未完成。8 项基础核对只覆盖所列事实和证据；未运行 OpenResty，不检查用户实际构建、include、DNS/日志环境或变更安全。
