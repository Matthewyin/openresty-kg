# 自动验证记录

2026-10-15；Node v24.3.0；SDK 与 pi-ai 均为已锁定 1.2.0。

执行 `npm test`：五项分组通过；围栏兼容与 env/错误脱敏补丁后的独立审核合计 8/8、失败 0，取代早期的 6/6。真实 SDK 经本地 HTTP mock provider 驱动；不是自写 AgentSession 或 agent loop。测试 trace 见同目录 trace.jsonl。

1. 原 parser/matcher/config-results 直接调用与 SDK 工具输出一致：events 3/3、stream 8/8、VTS 7/7；孤立 server 保留 ambiguous，缺上下文保留 context_required，明确补充后成功；map 数据为 block_entry，include 为未分析；语法错误保持 invalid_input。
2. 模型实际收到的工具精确为 analyze_config/query_knowledge；主动请求 bash/read/write/edit/unknown_tool 均拒绝且整轮 failed、不缓存。空资源加载器、专用路径、空 agent 状态与符号链接拒绝均检查；未读取个人设置来做对照。

   专用 PI_SPIKE_STATE_DIR 与 PI_SPIKE_TIMEOUT_MS 覆盖通过：实验内独立目录、180000ms 接受；实验目录外状态路径、非整数超时拒绝。这里只做 loadConfig 测试，未启动 live。
3. 两轮 SDK 会话、真实 abort、运行中拒绝恢复、取消无新增完成缓存通过。故障恢复只保留完整轮次；独立 Node 子进程重新打开 SessionManager 并完成第三轮，mock 收到三轮上下文。
4. 虚构源码引用、非法 JSON 和凭空事实文本拒绝；宿主源码引用匹配原知识详情；HTML 字符转义、页面 textContent 和详情 release 参数通过静态/模块检查。
5. 同条件新会话命中，provider 调用增量为 0；问题、上下文、模块、模式、精确空白、有效会话上下文、模型和代码条件纳入键。实验知识副本：未索引 extra.json 不影响快照；同 release 的合法详情变更 miss 并显示新证据；release 变更 miss；恢复旧版本会话后重新分析。

测试副本与临时状态自动删除；未改根 package/src/site/dist/repos。

后续主 agent 已完成 mock/live 浏览器交互、截图、根文件哈希复核；独立代码审核通过，真实 GLM 验收退出码 0。真实记录见同目录 live-verification.json，完整分层结论与限制见 ../../../analysis/PI_SDK_SPIKE_VERIFICATION.md；本自动测试记录不替代真实模型或桌面证据。

范围内修订：默认服务状态与测试实例改为兄弟目录，防止测试符号链接污染服务；本地 HTTP mock 沿用用户允许的协议验证路径；没有扩大工具能力或增加通用平台。自行产生的 .state/smoke 已清理，测试临时副本自动清理；未操作主 agent 管理的服务和状态。
