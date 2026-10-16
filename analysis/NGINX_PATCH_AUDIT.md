# Stream 知识的补丁核对记录

本批仅核对 OpenResty 1.27.1.1 中 stream 代理片段涉及的基本配置事实，不表示 Nginx 全量知识或运行时深度验证已完成。源码固定为审计 JSON 中的两个 revision。

从固定 OpenResty `util/mirror-tarballs:35–550` 逐分支核对：版本比较使用 main_ver=1.27.1；被注释的 patch、旧版本安全修复分支和 bundle 之外的可选 no_pool 调试补丁不纳入默认有效集合。有效集合按原顺序为 JSON 中的 34 项。server_header 采用脚本相同的 minor_ver=1 替换。列表是人工核对结果，回放脚本验证应用和文件差异，不声称自动证明列表完整；独立审核需要复核条件选择。

复现：

```sh
node analysis/verify-nginx-patches.mjs --config project.config.json --audit analysis/NGINX_PATCH_AUDIT.json
```

脚本从固定 git archive 建隔离副本，不执行 mirror-tarballs，不下载全 bundle、不编译、不启动 Nginx；结束删除自己的临时副本。

2026-10-10 内容批次 C-R05 更正：原“34 项无 offset/fuzz”的结论撤回。本机 patch 的普通输出省略成功 hunk 的偏移和模糊信息，原输出检查未兑现拒绝条件；历史准确性验收及研究中沿用的该断言均不作为当前证据。固定集合、顺序和来源不变，实际 `--verbose --batch --forward -p1`、`LC_ALL=C` 连续回放发现 107 处非零匹配，其中 16 处带 fuzz，分布在 28 个补丁。

现门禁解析全部成功 hunk 的 file/hunk/line/fuzz/offset，要求数量与补丁中的全部 `@@` 相同；零值也包含在执行输出。审计 JSON 固定记录所有非零匹配；没有记录等于不允许非零匹配，任何缺项或变化均拒绝。全部补丁目标及旧不变目标共 47 个文件保存最终 SHA256，缺失或字节不符均拒绝。期望证据由本次诊断产生后另行审核，正常验证不会自动更新或批准观察值；这不是允许任意偏移或模糊匹配。

主线程真实 CLI 回归先复现两个漏报，再验证未核定 offset/fuzz 拒绝、核定记录变化拒绝、最终字节错误或哈希缺失拒绝；后续另复现并修复未执行补丁名下的额外匹配键遗漏，在临时源码创建前拒绝，最终 6 项真实 CLI 回归均通过。五项 worker/events 语义另在完整应用后复核，见 CONTENT_WORKER_FACTS.md；独立闭合结论见 CONTENT_REVIEW.md。上述固定匹配证据不等于编译或运行验证。

| 核对文件 | 应用有效集合后的比较 | 本批结论 |
|---|---|---|
| stream core | 逐字节未变 | server/listen 的所列配置结构和参数事实未直接改变；error_log 仍需检查公共日志代码 |
| stream set | 逐字节未变 | 配置入口、preaccess 赋值 handler 未直接改变 |
| stream log | 逐字节未变 | 日志格式校验、默认不写日志、日志列表继承未直接改变；HTTP 日志转义补丁不能套到 stream |
| stream proxy | 有 3 项补丁直接修改 | timeout_fields 创建会话上下文并替换超时读取；balancer_status_code 增加特殊返回码结束；get_next_upstream_tries 导出查询接口 |
| core log | intercept_error_log 修改 | 增加防重入日志拦截回调；所列目的地配置、级别默认和 stream 继承代码未变 |

socket_cloexec、reuseport、resolver、SSL 回调及其他补丁还有底层作用。文件不变仅支持本批所列事实，不证明跨模块调用和所有运行时行为都未受影响。知识的 patch_status.note 逐项说明这个范围；不得把 Nginx 组件全局标为 verified_unaffected。

超时补丁还与固定 stream Lua `ngx_stream_lua_balancer.c:591–631` 交叉核对：balancer 接口可改写会话 connect_timeout/timeout，正文已提示配置不是唯一决定值。所有来源在详情中保持上游/补丁独立身份及自己的行号，没有将 upstream snippet 冒充 patched snippet。

现行 Nginx 官方 proxy/core/log 文档仅作语义交叉检查；其内容包含冻结版本之后的能力，不能据其新增能力推断 1.27.1 可用。知识中的官方文档链接标为未核实，冻结源码及所列补丁才是本批依据。页面读取路径先使用 agent-reach 的 Jina，连接超时后使用官方页面读取；没有使用第三方技术解释替代来源。

本批未核对用户实际编译参数、Lua 调用、include 内容、DNS/日志环境；基本核对不代替 nginx -t 或变更判断。部门正式脱敏样例、真实 Codex 宿主接入及全量基本/深度内容仍待后续验收。
