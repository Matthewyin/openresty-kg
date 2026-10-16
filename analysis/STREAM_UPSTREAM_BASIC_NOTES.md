# P16 Stream upstream六项：准备与验收记录

2026-10-12。主线程唯一新增写集为本记录及content/STREAM_UPSTREAM_BASIC.json；尚未合入正式知识。六项精确覆盖Stream upstream五个owner：upstream/server、hash、least_conn、random、zone，不混用HTTP同名项。冻结JSON SHA256：6634c43294244007ce45d86cd27431c3ce63fafd5d6441a28909327aaac14717。

## 固定来源及逐义核对

Nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928；nginx-docs e8b581903e9d41252720053311cea687a5671674；OpenResty 8c37412c31621225e7aa7e825b5b50106c9c71c4。当前Nginx工作树HEAD及干净状态核验相符；最终来源检查全部用git show固定对象读取。源码相对路径统一在src/stream，核心共享内存逻辑为src/core/ngx_cycle.c。

| 身份 | 配置回调 | 关键实现及边界 |
| --- | --- | --- |
| upstream | ngx_stream_upstream.c:302–398 | 新建每组srv_conf，解析UPSCONF、拒绝空组；add564–668核重复名字，init693–715无其他选址器时选round_robin；非客户端监听块。 |
| server | ngx_stream_upstream.c:402–560 | 默认weight1/max_conns0/max_fails1/fail_timeout10秒；只接受六类参数。域名/IP必须带端口，unix另行支持；排除文档商业resolve/service/slow_start。round_robin35–205逐地址建peer；439–673核单peer、失败、down及max_conns，不把“单服务器永远可用”照搬。 |
| hash | ngx_stream_upstream_hash_module.c:638–685 | 复杂值、普通CRC路径与每权重160点一致性环；完整108–407、432–618核空键/单peer/尝试回退和失效筛选。flags无backup，重定义告警而非组合。 |
| least_conn | ngx_stream_upstream_least_conn_module.c:288–310 | 完整63–284含单peer回退、按conns/weight比较、同比分支加权选择及backup。不是CPU/时延调度。 |
| random | ngx_stream_upstream_random_module.c:453–502 | 完整94–449核按权重区间采样、two不同候选比较比例、单peer和尝试回退；语法只接受two/least_conn，未引商业least_time。 |
| zone | ngx_stream_upstream_zone_module.c:65–114 | 118–322核共享peer复制；至少8页，省略size供同轮同名配置补足。cycle420–480、1292–1362核零大小/冲突和noreuse，不把worker共享写成reload状态持久化或商业动态成员API。 |

官方活跃XML统一xml/en/docs/stream/ngx_stream_upstream_module.xml，分别82–120、123–315、398–432、435–448、497–539、318–347。商业参数虽在同页出现，不纳入本发行版支持语法。默认值均有实际回调/初始化依据；继承not_applicable仅指独立upstream组，不暗示任意context可用。phase保留null，不把算法函数当成请求phase。

## 补丁、引用及隔离构建

主复用verify-nginx-patches.mjs，在mkdtemp固定git archive中真实回放34项发行补丁，142个hunk offset/fuzz与47个最终SHA均符合核定记录；55处显式引用真实EOF有效，其中43段Nginx片段逐字保持，6项文档均为活跃同名节点。stream_balancer_export只改变共享轮询文件的TLS会话函数导出，不改变本组引用的配置/选址/状态片段；不因此宣称整个文件无补丁影响。六项verified_unaffected仅限已述局部事实。

初次来源检查发现init_main_conf引用终点719超出真实EOF715，已收窄为715后全批通过；未将失败检查计为通过。

独立临时目录以正式593/e33f9a74f8157679加本组6项，运行现有build及内置发布校验：得到599基础、418仅注册、1017注册、0深度，临时release为1.27.1.1-6c74cc9ff47cbf97。六项均basic_verified，与owner正式差集精确相等且无重复。正式current在隔离前后字节保持，仍593。补丁和构建目录均finally清理，不保留临时candidate，不执行Nginx/OpenResty、DNS、来源生成器或生产连接。

当前仅准备完成，需独立逐项语义审核；未以六项隔离通过宣称C02或全站完成。
