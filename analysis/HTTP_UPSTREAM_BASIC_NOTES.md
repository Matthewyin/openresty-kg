# P01 HTTP upstream 与选址算法：11项待审基础内容

## 交付与范围

2026-10-10。本轮只新增 `analysis/content/HTTP_UPSTREAM_BASIC.json` 和本记录；11个身份来自正式 catalog 的7个 owner 全集合，并确认与当时正式知识集合无交集。没有选择子集或混用 HTTP/stream 的同名 server、客户端 keepalive、缓存 zone 语义。沿用既有 object schema，未新增公共字段。

2026-10-12 / WC-R21：独立审核10项已通过，least_conn仅缺单peer回退的保存来源。本轮只扩大该项implementation-1并同步本记录；正文与其他10项不变，修正后来源闭合及11项整体准备通过仍待独立差异复核。下文191＋11的隔离candidate是修正前历史记录，不作为修正后发布身份。

采用 research 技能的一手冻结证据方法：配置入口、模块 owner、初始化/运行调用链、活跃官方文档相互核对，不凭槽位命名自动生成语义。当前是主线程已有分工中的独立实施，不创建嵌套 agent。永久编辑使用 apply_patch；仅在临时目录回放补丁及构建网站数据，不下载、编译、运行 OpenResty 或来源生成器，不执行 mirror-tarballs。

proxy 68条及其 notes 保持冻结；没有改 shared knowledge、catalog、config、build、coverage、current、UI 或源仓库。

## 固定来源与身份核对

- nginx：`e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`。
- nginx-docs：`e8b581903e9d41252720053311cea687a5671674`。
- openresty：`8c37412c31621225e7aa7e825b5b50106c9c71c4`。
- 源码按 `git show SHA:path` 读取；补丁回放后坐标不冒充冻结上游行号。
- 官方文档统一为 `xml/en/docs/http/ngx_http_upstream_module.xml`。XML comments 替换为空白并保留换行后，再验证对应活跃同名 directive 节点。
- 精确 owner 集合：ngx_http_upstream_module（2）、ngx_http_upstream_hash_module（1）、ngx_http_upstream_ip_hash_module（1）、ngx_http_upstream_keepalive_module（4）、ngx_http_upstream_least_conn_module（1）、ngx_http_upstream_random_module（1）、ngx_http_upstream_zone_module（1）。
- 每项显式 `callback_definition.component`，每项都有 `module-owner` source ID。注册点的 compile_guards 均为空数组，发布比较保持原样；这不表示模块已在用户部署启用。IPv6 实现条件按局部源码说明，不伪造注册 guard。
- 默认值11项 verified；继承11项 not_applicable 仅指这些独立 upstream 组配置不走 HTTP server/location 层级继承，证据为组上下文创建，不意味着任意上下文可使用。

原始固定入口：
[upstream](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/ngx_http_upstream.c)、
[round robin](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/ngx_http_upstream_round_robin.c)、
[keepalive](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_upstream_keepalive_module.c)、
[同页官方 XML](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_upstream_module.xml)。

## 完整身份与实际读取证据

注册/owner 坐标为该身份 catalog.file；callback 与运行证据显式给出完整文件。其他来源 ID、默认值及补丁证据见 JSON。

| 完整身份 | 注册与 owner 行 | 配置 callback | 运行/初始化证据 | 活跃 XML 行 |
| --- | --- | --- | --- | --- |
| `nginx/ngx_http_upstream_hash_module/hash` | 68–73；owner 94–107 | `src/http/modules/ngx_http_upstream_hash_module.c:639–686` | `src/http/modules/ngx_http_upstream_hash_module.c:111–159`；`src/http/modules/ngx_http_upstream_hash_module.c:179–282`；`src/http/modules/ngx_http_upstream_hash_module.c:302–407`；`src/http/modules/ngx_http_upstream_hash_module.c:432–489`；`src/http/modules/ngx_http_upstream_hash_module.c:510–618` | 441–471 |
| `nginx/ngx_http_upstream_ip_hash_module/ip_hash` | 38–43；owner 64–77 | `src/http/modules/ngx_http_upstream_ip_hash_module.c:257–278` | `src/http/modules/ngx_http_upstream_ip_hash_module.c:84–145`；`src/http/modules/ngx_http_upstream_ip_hash_module.c:164–252` | 474–520 |
| `nginx/ngx_http_upstream_keepalive_module/keepalive` | 83–88；owner 130–143 | `src/http/modules/ngx_http_upstream_keepalive_module.c:538–576` | `src/http/modules/ngx_http_upstream_keepalive_module.c:147–232`；`src/http/modules/ngx_http_upstream_keepalive_module.c:236–301`；`src/http/modules/ngx_http_upstream_keepalive_module.c:305–410`；`src/http/ngx_http_upstream.c:2312–2345`；`src/http/modules/ngx_http_proxy_module.c:822–832` | 523–637 |
| `nginx/ngx_http_upstream_keepalive_module/keepalive_time` | 90–95；owner 130–143 | `src/core/ngx_conf_file.c:1260–1287` | `src/http/modules/ngx_http_upstream_keepalive_module.c:323–348`；`src/event/ngx_event_connect.c:190–204`；`src/http/modules/ngx_http_upstream_keepalive_module.c:147–170`；`src/http/modules/ngx_http_upstream_keepalive_module.c:407–410`；`src/http/ngx_http_upstream.c:4537–4575` | 668–681 |
| `nginx/ngx_http_upstream_keepalive_module/keepalive_timeout` | 97–102；owner 130–143 | `src/core/ngx_conf_file.c:1260–1287` | `src/http/modules/ngx_http_upstream_keepalive_module.c:280–300`；`src/http/modules/ngx_http_upstream_keepalive_module.c:377–404`；`src/http/modules/ngx_http_upstream_keepalive_module.c:422–461`；`src/http/modules/ngx_http_upstream_keepalive_module.c:147–170` | 684–695 |
| `nginx/ngx_http_upstream_keepalive_module/keepalive_requests` | 104–109；owner 130–143 | `src/core/ngx_conf_file.c:1167–1194` | `src/http/ngx_http_upstream.c:1579–1591`；`src/http/modules/ngx_http_upstream_keepalive_module.c:323–348`；`src/http/modules/ngx_http_upstream_keepalive_module.c:147–170`；`src/http/modules/ngx_http_upstream_keepalive_module.c:407–410`；`src/http/ngx_http_upstream.c:4537–4575` | 640–665 |
| `nginx/ngx_http_upstream_least_conn_module/least_conn` | 23–28；owner 49–62 | `src/http/modules/ngx_http_upstream_least_conn_module.c:292–314` | `src/http/modules/ngx_http_upstream_least_conn_module.c:66–96`；`src/http/modules/ngx_http_upstream_least_conn_module.c:114–255`；`src/http/modules/ngx_http_upstream_least_conn_module.c:257–287` | 760–775 |
| `nginx/ngx_http_upstream_random_module/random` | 54–59；owner 80–93 | `src/http/modules/ngx_http_upstream_random_module.c:453–502` | `src/http/modules/ngx_http_upstream_random_module.c:97–200`；`src/http/modules/ngx_http_upstream_random_module.c:221–294`；`src/http/modules/ngx_http_upstream_random_module.c:315–403`；`src/http/modules/ngx_http_upstream_random_module.c:407–429`；`src/http/modules/ngx_http_upstream_random_module.c:433–449` | 860–896 |
| `nginx/ngx_http_upstream_zone_module/zone` | 25–30；owner 51–64 | `src/http/modules/ngx_http_upstream_zone_module.c:68–117` | `src/http/modules/ngx_http_upstream_zone_module.c:121–183`；`src/http/modules/ngx_http_upstream_zone_module.c:187–260`；`src/http/ngx_http_upstream_round_robin.h:19–41`；`src/http/ngx_http_upstream_round_robin.h:61–125`；`src/core/ngx_cycle.c:1292–1362`；`src/core/ngx_cycle.c:429–434`；`src/core/ngx_cycle.c:464–469`；`src/http/modules/ngx_http_upstream_keepalive_module.c:13–25` | 360–390 |
| `nginx/ngx_http_upstream_module/upstream` | 328–333；owner 361–374 | `src/http/ngx_http_upstream.c:6049–6161` | `src/http/ngx_http_upstream.c:6774–6796`；`src/http/ngx_http_upstream_round_robin.c:31–114`；`src/http/ngx_http_upstream_round_robin.c:522–596`；`src/http/ngx_http_upstream.c:799–819`；`src/http/ngx_http_upstream.c:1555–1579` | 87–125 |
| `nginx/ngx_http_upstream_module/server` | 335–340；owner 361–374 | `src/http/ngx_http_upstream.c:6165–6318` | `src/http/ngx_http_upstream_round_robin.c:86–114`；`src/http/ngx_http_upstream_round_robin.c:449–517`；`src/http/ngx_http_upstream_round_robin.c:539–595`；`src/http/ngx_http_upstream_round_robin.c:600–670`；`src/http/ngx_http_upstream.c:4342–4358`；`src/http/ngx_http_upstream_round_robin.h:19–41`；`src/http/modules/ngx_http_upstream_zone_module.c:194–225` | 128–357 |

## 逐义核对结果

### upstream 与 server

upstream 创建独立组上下文，共享 main_conf 而新建 srv_conf/loc_conf；空组拒绝，初始化优先已安装算法，没有则使用加权轮询。它不是监听端口的虚拟服务器块。

HTTP server 回调只接受 address、weight、max_conns、max_fails、fail_timeout、backup、down；文档中的商业 resolve/service/route/slow_start/drain 不进入语法。参数能力还受当前算法 flags 约束，不把 unsupported backup 与不同指令顺序下的错误时点混为一谈。默认端口80、weight1、max_conns0、max_fails1、fail_timeout10s 已核回调。

域名多地址会生成多个 peer；max_conns 是活动连接数，不是包含 keepalive 空闲 socket 的总量硬限额。失败处理由上游协议路径传给 peer.free 的状态决定，403/404 的 NEXT 与 FAILED 不同。单 peer 分支不做失败阈值排除，但仍检查 down/max_conns；不能把文档单服务器概括推广成所有参数失效。

### hash、ip_hash、least_conn、random

hash 对复合值求值，普通模式和 consistent 是不同路径；consistent 构建每权重160个 ketama 点，排序去重，并按键哈希定位。空键、单 peer、内部尝试回退及失效节点会影响命中，不许诺永久会话绑定。

ip_hash 读取连接 sockaddr；IPv4前三字节，IPv6完整16字节受 NGX_HAVE_INET6 约束。并不直接把任意 X-Forwarded-For 文本当客户端地址。选择仍受 down、失败暂避、max_conns 和回退逻辑影响。

least_conn 用连接数与权重的交叉乘积比较比例；并列时加权选择，可走备用组，不是按CPU或响应耗时决策。

random 是权重随机，two 选两个不同候选再比较连接数/权重；固定回调只接受 two 和可选 least_conn，排除商业 least_time。各非默认算法应先于 keepalive 配置，后者捕获当时 init_upstream；不暗示多个选址指令能任意叠加。

### keepalive 与三个寿命参数

keepalive connections 是每 worker 空闲连接缓存容量，必填正整数。无该指令则没有安装缓存包装器，不把0写成合法默认参数。先调用原选址器，再按 sockaddr 匹配缓存；容量耗尽淘汰 LRU。失败、关闭、错误/超时、请求正文未发送完、协议不允许等均可阻止入池。

keepalive_time 默认1h：在归还连接时，当前时间减连接 start_time 严格大于阈值才退出复用，不是独立定时器到点杀请求。
keepalive_requests 默认1000：连接使用时计数，归还时 >= 阈值不入池，不提前中断第N个请求。
keepalive_timeout 默认60s：入池设置空闲读事件定时器，取出取消，空闲超时关闭。三个默认均由 keepalive init_upstream 设置；仅配置寿命字段不会安装连接池。

peer.free 未缓存时，上层 finalize 关闭剩余连接；对应正确固定源码范围为 upstream.c:4537–4575。协议保持仍须满足，例如代理 HTTP/1.1 与清除默认 Connection: close；不把设置池容量等同保证协议可复用。

### zone

zone 共享 peer 配置、连接/失败/权重等状态，使用共享锁；不共享 worker 的 keepalive socket 队列，也不是响应缓存区。显式容量至少8个 ngx_pagesize；省略 size 留0供同轮同名声明补足，最终零大小会被拒绝，相同名称不同用途或冲突容量也拒绝。

固定模块设置 noreuse=1，不能把 worker 共享解释成 reload 保证继承旧 zone 状态。开源 zone 不自动获得商业动态成员 API 或 server resolve 参数。

## 局部补丁与回放

按 analysis/NGINX_PATCH_AUDIT.json 的固定顺序回放34补丁，应用其中声明的替换，并精确校验每个 hunk 的 offset/fuzz；最终47个文件 SHA256 均相符。回放目录来自固定 nginx git archive，结束 finally 删除；未执行来源脚本。

检查134处引用（含隐式 registration/configuration-definition）、严格排除末尾空行伪 EOF；其中110处 nginx 原始片段，108处在发行回放中完整保留，两处发生真实变化：

| 身份 / source ID | 固定上游片段 | 首个影响补丁 | 处理 |
| --- | --- | --- | --- |
| upstream / implementation-4 | src/http/ngx_http_upstream.c:1555–1579 | balancer_status_code | 引补丁原文1–14；说明 rc >= NGX_HTTP_SPECIAL_RESPONSE 提前 finalize |
| keepalive / implementation-3 | src/http/ngx_http_upstream.c:2312–2345 | upstream_pipelining | 引补丁原文1–23；说明写事件以 request_body_sent 而非 header_sent 判定 |

因此2项 verified_affected，另外9项 verified_unaffected 的结论严格限定于引用片段。每项均包括 module-owner 与发行处理证据，不能据此宣称整个共享 upstream 文件不受影响。

upstream_timeout_fields 原文完整核对：它把共享请求路径的 connect/send/read timeout 从 u->conf 移到 u 字段，未修改本组 keepalive 的 kcf.time/kcf.timeout/kcf.requests 比较/定时器；本组没有借用 proxy 三个 timeout 的语义。host_port_vars 等其他发行补丁仍在34项回放中，不把不相交路径机械挂到本组。balancer 特殊状态仅引用 HTTP hunk，不把 stream 部分纳入 HTTP 身份。

## 隔离验收与未解项

- component/module/name 唯一集合：11/11，与正式7 owner catalog 完全相等；与读取时的基础191条无重复。
- 134处引用均通过冻结文件存在、有效 EOF 和活跃官方文档检查；34补丁/47最终哈希通过。
- 真实隔离 build：191基础 + 11草稿 = 202 basic；registration1017、deep0；临时 release `1.27.1.1-14a8202bd73df8cc`。
- 发布11个身份全部 basic_verified；逐条检查 module-owner 来源存在，compile_guards 与正式 catalog 相等。
- 构建使用临时 config/knowledge/catalog/matrix，源路径转绝对，复制 site/src 到临时目录；不运行 root 正式 build，不覆盖 current。
- 构建前后比对正式 knowledge/catalog/coverage/current index、原 core27 两文件及冻结 proxy 两文件摘要，均未改变；补丁及构建临时目录均 finally 清理。
- 首次临时证明命令误用全局字符串替换改变 docs SHA，git show 立即失败且没有生成产物；改为只替换数量断言后使用完整固定 SHA 重跑通过。没有将失败结果当通过。
- 本组没有未解决的功能/入口/补丁断言；仍待 Astra 独立逐条内容审核。没有编译或运行来源，静态核验不等同真实部署行为验收；网站其他未完成内容保持原状态。

本组 ready 后两文件停写，等待明确差异反馈。

## WC-R21 / least_conn来源最小修正（2026-10-12）

JSON唯一变化为least_conn的 `evidence[id=implementation-1].start_line` 从135改为114，end_line保持255，文件仍为 `src/http/modules/ngx_http_upstream_least_conn_module.c`。本条summary、syntax、callback、defaults、inheritance、limitations正文及source_ids、phase、patch_status全部不变；其他10项完整对象不变，没有增加身份或新行为。

原limitations的“单 peer 回退共用轮询路径”及patch_status均已绑定implementation-1，因此扩大同一来源即可闭合，不需要新增source ID或修改正文。新增114–134由 `git show e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928:src/http/modules/ngx_http_upstream_least_conn_module.c` 精确读取；[固定114–116](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_upstream_least_conn_module.c#L114-L116)实际为 `if (rrp->peers->single)` 后调用 `ngx_http_upstream_get_round_robin_peer(pc, rrp)` 并返回，不是相邻注释或后文推断。扩大后的114–255有效且保留原135–255。

修正前JSON SHA256 `a27c24d12f10d2f62c73cba6c4be034e770ad344e89193d5f6f109abb238be72`；修正后为 `09d8f6a32cd2de17b560c0c85befaa6a57d98c3540cf3e7d639098b04b9eb682`。在内存中仅把start_line还原为135，以原2空格缩进及末尾换行序列化，精确重现修正前整文件摘要，证明没有夹带其他JSON变化。

独立mkdtemp中从固定Git archive回放既有34项发行patch及核定版本替换，每项回放后分别比较新增114–134和完整114–255，34步均逐字保留；最终least_conn整个文件也与固定上游逐字相同。142个hunk的数量、offset/fuzz和47个最终SHA256均与NGINX_PATCH_AUDIT.json一致。只验证此新增局部证据，不重审其余10项或旧patch范围。

| 核对对象 | SHA256 |
| --- | --- |
| 新增114–134 slice | `e992df887eba799467a19905ca858ec435db73377b369c5cb97aa0f943f31a7a` |
| 扩展后114–255 slice | `cddd77e0d82b34ca3a7c365175c2d7880f730cc80679be5a4804fd1997b1f0f1` |
| 固定及回放后完整least_conn文件 | `11ca1e4e60636b4967a941ff5b31953d84cebcf9d4c7d29dcc67704d6d5d81e0` |

slice摘要按LF连接、不额外追加末尾换行；完整文件摘要保留原文件末尾换行。原verified_unaffected仅对所列局部事实成立，未推广到其他upstream公共路径。

本轮未运行新的build，不把旧202 candidate当修正后结果；未修改shared knowledge、dist、catalog、配置或其他内容。此前已交接的proxy R18–R20两文件保持冻结。临时patch目录已finally清理，没有运行OpenResty、来源生成器或下载；完成后停写，等待独立R21差异审核，不自行关闭R21或合并发布。

