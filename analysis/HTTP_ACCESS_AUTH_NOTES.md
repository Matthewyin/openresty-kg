# HTTP 访问、认证和来源地址：12项基础内容待审

2026-10-10。本组覆盖 access 2、auth_basic 2、auth_request 2、realip 3、referer 3，共12个完整注册身份，仅准备 `content/HTTP_ACCESS_AUTH_BASIC.json`，尚未修改正式知识或 current。

## 逐义研究

采用 research 的固定一手源码和官方文档方法；已有独立研究角色继续推进其他模块，本组由主处理，不重复 HTTP core 或 proxy。Nginx revision 为 e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928，nginx.org 为 e8b581903e9d41252720053311cea687a5671674，OpenResty 为8c37412c31621225e7aa7e825b5b50106c9c71c4。全部引用通过 Git show 读取固定对象，不以工作树作为发布证据。

- allow/deny：按连接地址类别顺序匹配第一条规则，未匹配返回 DECLINED；任意本层规则阻止整组父层地址数组继承。satisfy 可改变最终访问判定，不把本模块403直接说成最终响应。
- Basic：realm 与 user_file 分别合并，两者缺任一都跳过校验；off 在复杂值求值后识别。文件格式、挑战401、文件不存在403和内部错误路径分开；没有自行增加密码算法或部署结论。
- auth_request：等认证子请求结束，2xx/401/403/其他状态分开；401复制挑战头。URI 原文保存而不是变量复杂值；header_only 与空正文对象明确。auth_request_set 在主请求判断认证结果前从子请求求值，可在认证失败时赋值，不冒充 rewrite set 或认证成功证明。
- realip：受信任来源是替换地址的门槛，不是访问名单；主机名在配置时解析。选择默认 X-Real-IP、递归从右向左按每轮信任判断，不能简单取第一个头值；PROXY 信息必须先存在，本项不代替 listen 启用。
- Referer：只提供 invalid_referer 变量，不自动403；主机大小写与 URI 前缀大小写不同，端口忽略。新哈希规则不等于所有正则都不继承；none/blocked 的配置合并限制真实保留。两个哈希项接受十进制整数，而非 k/m；bucket 默认64还需按缓存行对齐，不把容量解释为域名条数。

每条具有真实注册callback的显式定义、module-owner、运行/合并代码与活跃同名XML节点。正文与可核默认、继承、限制分别保留 source_ids；不宣称用户环境模块启用。文档坐标独立于源码坐标，不引用当前最新版行为倒推旧版本。

## 实际局部补丁检查

mkdtemp 内 Git archive 固定上游，仅运行系统 patch；按已核34项顺序和 server_header 版本替换回放。实际142个hunk逐项核数量及偏移/fuzz，与冻结审计一致；47个最终文件摘要全部匹配。12条全部105处引用在有效EOF内；81段上游注册、callback、owner及运行/合并片段完整保留，因此只对这些事实标 verified_unaffected，不推广为完整请求链无补丁影响。临时源码 finally 清理，未执行来源生成器或编译运行 OpenResty。

实际隔离构建以当时145项正式知识仅追加本12条：1017注册、157基础、0深度、inventory_complete=true，临时候选 `1.27.1.1-d94f04c85c43dbf7`。既有 schema、callback、source IDs、目录/范围及发布门禁均通过；临时发布随副本 finally 清理，未覆盖根current。本组仍待 Astra 逐条独立审核，不计正式基础覆盖。
