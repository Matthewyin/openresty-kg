# 样例六项配置边界收口

日期：2026-10-13。对应 `SAMPLE_REMAINING_RUNTIME_PLAN.md` 的C1。主线程只读核对并已通过本批独立审核，见 `SAMPLE_PROXY_CHAIN_RUNTIME_REVIEW.md` 的C1结论；不修改知识、评级或网站契约。

## 深度交互：不将配置生产冒作运行消费

六项的当前事实已覆盖其配置阶段作用，不需要为提高deep数量添加请求运行时。下面的“收口”只表示这六项按计划限定的配置边界已核对，不表示完整HTTP、stream或事件系统的运行机制已完成。它们保持basic、无runtime；worker、监听、server路由和变量赋值在各自候选条目继续跟踪。

固定发布 `1.27.1.1-c49915e4ed7a7e58`。nginx固定revision `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`，文档固定revision `e8b581903e9d41252720053311cea687a5671674`。以下源码坐标均为固定上游原文，不是应用补丁后的行号。

## 直接执行：逐项依据

| 精确身份 | 已核配置行为及原始源码坐标 | 完成边界 |
| --- | --- | --- |
| nginx--ngx_conf_module--include | `src/core/ngx_conf_file.c:821–883` 完成路径解析、普通文件递归parse、通配枚举与逐文件parse；路径/枚举/分配或解析失败按回调返回，`:158–240`保留当前配置对象中的包含点上下文。固定core文档`:287–307`说明file/mask语法。 | 解析阶段动作，不保存一个可按请求执行的include值；被包含指令各自决定运行消费和继承。本站不读外部内容，A/B引用2/1仍未分析。 |
| nginx--ngx_events_module--events | `src/event/ngx_event.c:987–1064`拒绝重复块、创建各事件模块配置、切换上下文解析并init_conf，分配/解析/初始化失败直接返回；`:433–445`核查缺失块。固定core文档`:274–284`界定事件配置块。 | 建立事件配置，不借下属worker_connections/multi_accept或整个事件循环冒作块头的运行时。 |
| nginx--ngx_stream_module--stream | `src/stream/ngx_stream.c:92–279`拒绝重复、建立main及空父srv配置、解析、init/merge及阶段/监听组织；`:102–166`和`:212–239`分别为创建与显式server合并。固定stream core文档`:639–649`说明配置上下文。 | 空父srv_conf不是自动生成的服务；会话接入及代理消费由server/listen/具体指令解释。 |
| nginx--ngx_http_module--http | `src/http/ngx_http.c:122–346`创建HTTP上下文、解析、初始化并合并server/location；`:133–144`拒绝重复/分配失败，`:231–277`显式配置解析及merge调用。固定HTTP core文档`:761–771`界定HTTP配置上下文。 | 容器不是监听地址或自动server；虚拟主机与location运行查找仍属于后续路由批。 |
| nginx--ngx_stream_core_module--variables_hash_bucket_size | `src/stream/ngx_stream_core_module.c:650–675`初始化64并对齐；`src/stream/ngx_stream_variables.c:1315–1340`将值交ngx_hash_init，构建失败返回NGX_ERROR；共用`src/core/ngx_hash.c:251–325`检查桶容量及构建条件。固定stream文档`:667–679`说明变量hash桶预算。 | 参数消费在配置期索引构建，不能把会话按hash查变量解释为每次读取bucket_size；不改变既有默认/适用层级事实。 |
| nginx--ngx_http_core_module--variables_hash_bucket_size | `src/http/ngx_http_core_module.c:3409–3436`初始化及对齐；`src/http/ngx_http_variables.c:2804–2836`传入hash构建并传播失败；共用hash检查同上。固定HTTP文档`:3022–3033`说明变量hash桶参数。 | 同属配置期索引预算，与stream分别核定。HTTP变量运行取值不是此配置值的请求级消费。 |

## 实测与保留事项

主线程逐条读取固定c499的六份实际详情，断言全部basic、runtime不存在；对其中53个sources按自身固定revision执行git show，代码与行范围逐字一致。另直接阅读上表核心配置/初始化消费片段确认分类，未仅凭文件名分类。

六项沿用已发布的配置事实及局部补丁核查，不新增消费路径或更改状态，不将历史34补丁回放说成本文件重放，也不推论整个下游系统不受补丁影响。现有默认/继承/限制/证据均不改。新批全身份字段保护负责确认它们在随后发布仍完全一致。

外部include、现场二进制、模块安装和运行网络仍未验证。本次只新增本记录，没有复制原始配置或新增测试专用配置文件。
