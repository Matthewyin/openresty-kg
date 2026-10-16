# P07 限制、镜像与降级：14项准备

2026-10-12。本批包含limit_conn全模块5、limit_req全模块5、mirror2与degradation2，按catalog完整component/module/name差集核对，与正式197无重复。仅新增HTTP_LIMIT_MIRROR_BASIC.json与本记录，未改正式knowledge/current。

固定Nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928、docs e8b581903e9d41252720053311cea687a5671674、OpenResty8c37412c31621225e7aa7e825b5b50106c9c71c4。逐条读取真实callback、owner、配置合并、运行处理与活跃XML；degradation没有同名官方XML，直接引用完整模块源码，不借其他模块文档。

## 实现语义

- limit_conn：zone复杂key/共享状态，preaccess按请求计数，池清理减少；空key及超过255字节key的跳过行为。上限为1–65535，同层同zone重复拒绝，本层列表整体替代继承。不能解释为接受连接时的所有TCP连接上限。
- limit_conn_dry_run：达到限额及分配节点失败改标模拟拒绝，仍可能有其他内部500路径；超限前已登记的限制计数会清理，不照XML泛化成每个超限请求都持续占计数。
- limit_req：共享区存超额量，按毫秒差衰减，burst拒绝与delay/nodelay分别处理；多zone取最大所需延迟。默认内部0与显式burst=0/delay=0不等同，后者回调拒绝。开源回调没有sync商业参数。
- 两种status：400–599边界及503默认，由对应post bounds及merge核实；只说明本模块交回框架的状态，不保证经过其他响应处理后仍原样发给客户端。两个同名状态变量并非配置参数。
- 两种log_level：只控制限额提示，不能关闭独立key错误/分配错误日志；req延迟级别通常低一级，但info时保持info。观察模式仍执行检查并设置状态，不是全局放行。
- mirror：precontent只处理主请求，后台子请求保存方法/参数；目标保存固定字符串；正文读取/创建子请求失败仍可能影响主请求，不承诺无成本。request_body off只停止镜像主动预读，不清空其他路径已经形成的正文，core子请求会继承request_body指针。
- degradation：sbrk(0)减按4MiB对齐的函数地址是估算，非RSS/cgroup或全机监测；按请求触发每秒缓存。degrade仅接受204/444，内部未配置默认0不是合法枚举。444沿请求终止分支，不称为普通HTTP444报文或保证全部协议连接关闭。

## 实际准备验证

143处来源均在固定Git有效EOF内，12份同名XML节点去注释后有效；117段Nginx所引原文全部保留。临时git archive按既有34patch及版本替换回放，142hunk偏移/fuzz与47最终SHA256全部一致；逐条只对本模块所述判定及引用给出verified_unaffected，不推广后续响应处理链。临时目录finally清理，未编译运行Nginx或执行来源生成器。

实际隔离build：197+14=211基础，1017注册、0深度、范围true，候选 `1.27.1.1-76383f958192de49`；14个完整身份均basic_verified，临时配置/knowledge/catalog/matrix与site/src副本构建，根current保持197，临时副本finally清理。独立审核尚未通过，不把准备计数加入正式覆盖。
