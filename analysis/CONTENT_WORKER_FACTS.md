# Worker / events 五项基础事实

2026-10-10。实施范围仅为五项知识及本文；已完整读取用户规范、CONTENT_PLAN、REQUIREMENTS、IMPLEMENTATION_PLAN。按 research 技能的一手来源要求整理；不用现行 docs，不编译、不服务、不修改源码仓库、脚本或盘点数据。

## 固定来源及五项结论

Nginx release-1.27.1：`e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`；OpenResty v1.27.1.1：`8c37412c31621225e7aa7e825b5b50106c9c71c4`。已核对 tag；所有证据从固定 `git show revision:file` 读取。知识沿用现 facts 结构，defaults / inheritance / limitations / patch_status 显式引用 source_ids。

| 指令 | 注册/context、回调、默认来源 | 基础结论与补丁状态 |
|---|---|---|
| worker_processes | [main 注册 nginx.c:79–84](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/core/nginx.c#L79-L84)；[ngx_set_worker_processes:1553–1578](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/core/nginx.c#L1553-L1578)；[默认:1139–1149](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/core/nginx.c#L1139-L1149) | 默认1；auto 显式取 ngx_ncpu；重复拒绝；数值入口没有额外拒绝0。只计普通 worker，非全部进程。[普通 worker 循环:336–349](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/os/unix/ngx_process_cycle.c#L336-L349)。verified_unaffected 仅覆盖所列配置/计数，可 basic。 |
| worker_connections | [events 注册:123–128](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/ngx_event.c#L123-L128)；[ngx_event_connections:1065–1087](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/ngx_event.c#L1065-L1087)；[512 常量:8–14](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/ngx_event.c#L8-L14) | 默认512，配置写 connection_n；不是客户端容量公式。verified_unaffected 仅覆盖所列普通 worker 资源配置，可 basic。 |
| multi_accept | [events 注册:137–142](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/ngx_event.c#L137-L142)；[flag 回调:1026–1062](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/core/ngx_conf_file.c#L1026-L1062)；[默认:1360–1373](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/ngx_event.c#L1360-L1373) | 默认off，非 kqueue 普通 accept 的 available 控制继续接收；kqueue/IOCP 不套用此概括。socket_cloexec 改接收路径，verified_affected，可 basic。 |
| accept_mutex | [events 注册:144–149](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/ngx_event.c#L144-L149)；同 flag 回调/事件默认 | 默认off；非 Windows 且 master、多 worker、on 才启用。[条件:646–667](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/ngx_event.c#L646-L667)。队列/监听 fd 运行时补丁明确保留，verified_affected，可 basic。 |
| accept_mutex_delay | [events 注册:151–156](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/ngx_event.c#L151-L156)；[msec 回调:1260–1287](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/core/ngx_conf_file.c#L1260-L1287)；同事件默认 | 默认500ms；无单位数字按秒转换，0可解析。[时间解析:112–283](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/core/ngx_parse.c#L112-L283)。实际等待受事件补丁影响，verified_affected，可 basic。 |

五项均无 HTTP/stream 分层继承：worker_processes 只在 main；四事件项只在唯一 events 块，使用 create/init 而非父子 merge。[events 唯一性:987–997](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/ngx_event.c#L987-L997)、[初始化:1015–1058](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/ngx_event.c#L1015-L1058)。inheritance 为 not_applicable，不写“继承默认值”。

数字解析拒绝空串、非数字、正负号及 ngx_int_t 溢出。[ngx_atoi:967–991](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/core/ngx_string.c#L967-L991)。flag 接受不区分大小写的 on/off 并拒绝重复。注册没有独立编译 guard，核心/事件模块列入基础源码集合，但实际二进制与运行环境未核实；availability 保留 unverified，deprecated 为 null。[auto/sources:6–8](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/sources#L6-L8)、[84–101](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/sources#L84-L101)

## 易错限制与返工记录

- worker_connections 要容纳监听 socket 和额外 channel；非 Windows 超出 nofile 条件时记录警告，并非自动提额。[最低数量:441–460](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/ngx_event.c#L441-L460)、[nofile:514–538](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/ngx_event.c#L514-L538)。客户端、上游和监听都占连接资源，不把乘积当客户端容量。[数组/监听:754–823](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/ngx_event.c#L754-L823)、[客户端:139–151](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/ngx_event_accept.c#L139-L151)、[上游:53–64](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/ngx_event_connect.c#L53-L64)
- multi_accept：非 kqueue 覆盖 available，kqueue 使用事件数量，IOCP 另走 acceptex。[available/EAGAIN:45–78](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/ngx_event_accept.c#L45-L78)、[循环:313–324](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/ngx_event_accept.c#L313-L324)、[IOCP:856–881](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/ngx_event.c#L856-L881)。主线程打回“所有错误均退出”的过度概括，已修为 EAGAIN 退出、其他错误依类型/数量决定；新增 accept-errors 证据和限制：ENOSYS 关闭 use_accept4 后 continue 回退，ECONNABORTED 在 available 非零时 continue。[错误分支:80–111](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/ngx_event_accept.c#L80-L111)
- accept_mutex：锁竞争关闭接收事件时保留本 worker 的 reuseport；锁未启用时可走 EPOLLEXCLUSIVE 分支，不给通用性能/公平性保证。[监听:905–935](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/ngx_event.c#L905-L935)、[锁操作:328–425](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/ngx_event_accept.c#L328-L425)
- accept_mutex_delay 是未获锁相应分支的轮询等待上限，不是固定 sleep 或代理超时，更短 timer 可缩短等待。[等待:219–244](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/ngx_event.c#L219-L244)。**accept_mutex off 时并非完全无效**：普通 accept 的 EMFILE/ENFILE 分支仍用 ecf->accept_mutex_delay 添加恢复定时器，已显式写入知识。[恢复:112–132](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/event/ngx_event_accept.c#L112-L132)

## 34 项有效补丁与所列事实边界

复用 [已有审计 JSON](NGINX_PATCH_AUDIT.json)，不修改集合、脚本或审计；全部选择依据是 [固定发行脚本:35–550](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/mirror-tarballs#L35-L550)。**撤回此前“无 offset/fuzz”的错误结论**：默认 patch 成功输出不报告完整 hunk 调整，旧输出检查不能支持该结论。C-R05 后重新从固定 git archive 独立应用34项，使用 `patch --verbose -p1 --batch --forward`，实际有 offset/fuzz，详见下节；所有本次临时副本均已在 finally 删除。

```sh
node analysis/verify-nginx-patches.mjs --config project.config.json --audit analysis/NGINX_PATCH_AUDIT.json
```

上述脚本和审计已由主线程修复；本线程不以运行主脚本作为语义证明，也不拿旧 stream/log targets 冒充 worker 文件逐字节不变。下节结果来自本线程独立回放、实际最终正文检查及哈希比较；nginx.c、event.c、event_accept.c、process_cycle.c 等整个文件并不相同。

| 相关有效补丁及固定 hunk | 本批处理 |
|---|---|
| [init_cycle_pool_release:1–23](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/patches/nginx-1.27.1-init_cycle_pool_release.patch#L1-L23)、[privileged_agent_process:73–128](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/patches/nginx-1.27.1-privileged_agent_process.patch#L73-L128) | pool/辅助进程有变，worker 配置/默认/普通派生循环未变；只标所列配置事实 unaffected，不声称整个进程链路 unaffected。 |
| [privileged_agent_process_connections:1–73](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/patches/nginx-1.27.1-privileged_agent_process_connections.patch#L1-L73) | agent 使用独立 privileged_agent_connections 字段，不将 worker_connections 解释为所有进程资源。 |
| [socket_cloexec:82–145](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/patches/nginx-1.27.1-socket_cloexec.patch#L82-L145) | accept4 添 SOCK_CLOEXEC；相应 accept 后路径设置 FD_CLOEXEC，失败关闭连接返回。multi_accept 接收路径受影响，标 affected。普通连接配置及共享资源池事实不变，不排除 socket 运行时影响。 |
| [delayed_posted_events:1–72](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/patches/nginx-1.27.1-delayed_posted_events.patch#L1-L72) | 新队列非空先置 timer=0，实际等待可以0；锁条件/默认/等待上限原片段不变。accept_mutex 与 delay 标 affected，保留运行时区别。 |
| [reuseport_close_unused_fds:1–38](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/patches/nginx-1.27.1-reuseport_close_unused_fds.patch#L1-L38) | 初始化关闭其他 worker 的监听 fd 并置 -1，关闭监听跳过 -1；不改连接数默认/配置或锁启用条件，但明确保留事件初始化影响。 |

所有 patch_status.note 均限定“所列事实”，不设置 Nginx 组件全局 unaffected；basic 不等于 deep。目标构建参数、资源、容量、运行时效果未验证。

## C-R05：独立 verbose 回放与实际最终正文（2026-10-10）

### 方法与真实匹配记录

已完整读 C-R05。工具为本机 `patch 2.0-12u11-Apple`，不用普通成功输出推断无调整。独立 Node 内存脚本以 `mkdtemp` 建隔离目录，`git archive` 读取上述固定 Nginx revision；按冻结 audit 的34项原顺序，从固定 OpenResty revision 读取补丁，保留 server_header 的同一 minor_ver 替换。每项实际执行 `patch --verbose -p1 --batch --forward`，不是 dry-run，不运行主回放脚本来替代本项检查。

34项全部实际应用完成；固定补丁的142个 `@@` 与142条成功 hunk 逐补丁数量一致。28项补丁含107条非零调整：106条有 offset，16条有 fuzz，两者交集15条。不存在“无偏移/模糊”的成功结论。两次独立隔离回放的9个本批文件最终SHA一致，均已清理 mkdtemp；用户源码仓库未改（Nginx clean，OpenResty仍只有原有未跟踪 tags）。

下面28行逐补丁记录全部107条非零调整；`line` 为本机 patch 的当时报告位置，不能当作最终文件行号。`hunk` 随每个文件段重新编号，故同文件同编号也可能重复，不能擅自去重。未列调整的 hunk 仍有成功记录，offset/fuzz均0。与主线程新 audit.hunk_adjustments 逐字段、顺序比对完全相同；补丁集合及顺序也相同，不以改审计迎合结果。

```json
{"patch":"stream_balancer_export","hunks":[{"file":"src/stream/ngx_stream_upstream_round_robin.c","hunk":2,"line":700,"fuzz":0,"offset":14},{"file":"src/stream/ngx_stream_upstream_round_robin.c","hunk":3,"line":749,"fuzz":0,"offset":-3},{"file":"src/stream/ngx_stream_upstream_round_robin.h","hunk":1,"line":143,"fuzz":0,"offset":1}]}
{"patch":"stream_proxy_get_next_upstream_tries","hunks":[{"file":"src/stream/ngx_stream.h","hunk":1,"line":380,"fuzz":0,"offset":77},{"file":"src/stream/ngx_stream_proxy_module.c","hunk":1,"line":2505,"fuzz":0,"offset":349}]}
{"patch":"stream_proxy_timeout_fields","hunks":[{"file":"src/stream/ngx_stream.h","hunk":1,"line":311,"fuzz":0,"offset":57},{"file":"src/stream/ngx_stream.h","hunk":2,"line":323,"fuzz":0,"offset":7},{"file":"src/stream/ngx_stream_proxy_module.c","hunk":1,"line":402,"fuzz":0,"offset":2},{"file":"src/stream/ngx_stream_proxy_module.c","hunk":2,"line":411,"fuzz":0,"offset":2},{"file":"src/stream/ngx_stream_proxy_module.c","hunk":3,"line":713,"fuzz":0,"offset":2},{"file":"src/stream/ngx_stream_proxy_module.c","hunk":4,"line":721,"fuzz":0,"offset":2},{"file":"src/stream/ngx_stream_proxy_module.c","hunk":5,"line":784,"fuzz":0,"offset":-5},{"file":"src/stream/ngx_stream_proxy_module.c","hunk":6,"line":947,"fuzz":0,"offset":-10},{"file":"src/stream/ngx_stream_proxy_module.c","hunk":7,"line":1002,"fuzz":0,"offset":9},{"file":"src/stream/ngx_stream_proxy_module.c","hunk":8,"line":1058,"fuzz":0,"offset":-10},{"file":"src/stream/ngx_stream_proxy_module.c","hunk":9,"line":1128,"fuzz":0,"offset":11},{"file":"src/stream/ngx_stream_proxy_module.c","hunk":10,"line":1416,"fuzz":0,"offset":-10},{"file":"src/stream/ngx_stream_proxy_module.c","hunk":11,"line":1449,"fuzz":0,"offset":11},{"file":"src/stream/ngx_stream_proxy_module.c","hunk":12,"line":1449,"fuzz":0,"offset":-10},{"file":"src/stream/ngx_stream_proxy_module.c","hunk":13,"line":1632,"fuzz":0,"offset":11},{"file":"src/stream/ngx_stream_proxy_module.c","hunk":14,"line":1805,"fuzz":0,"offset":-26}]}
{"patch":"stream_ssl_preread_no_skip","hunks":[{"file":"src/stream/ngx_stream_ssl_preread_module.c","hunk":1,"line":194,"fuzz":2,"offset":35}]}
{"patch":"resolver_conf_parsing","hunks":[{"file":"src/core/ngx_resolver.c","hunk":2,"line":143,"fuzz":0,"offset":-2},{"file":"src/core/ngx_resolver.c","hunk":3,"line":463,"fuzz":0,"offset":18}]}
{"patch":"init_cycle_pool_release","hunks":[{"file":"src/core/nginx.c","hunk":1,"line":188,"fuzz":0,"offset":2},{"file":"src/core/nginx.c","hunk":2,"line":255,"fuzz":0,"offset":1},{"file":"src/core/ngx_core.h","hunk":1,"line":117,"fuzz":0,"offset":9},{"file":"src/core/ngx_cycle.c","hunk":1,"line":768,"fuzz":0,"offset":20},{"file":"src/os/unix/ngx_process_cycle.c","hunk":1,"line":694,"fuzz":0,"offset":2}]}
{"patch":"balancer_status_code","hunks":[{"file":"src/http/ngx_http_upstream.c","hunk":1,"line":1563,"fuzz":0,"offset":48},{"file":"src/http/ngx_http_upstream.h","hunk":1,"line":439,"fuzz":0,"offset":12},{"file":"src/stream/ngx_stream_proxy_module.c","hunk":1,"line":755,"fuzz":0,"offset":64},{"file":"src/stream/ngx_stream_upstream.h","hunk":1,"line":157,"fuzz":0,"offset":6}]}
{"patch":"builtin_error_page_footer","hunks":[{"file":"src/http/ngx_http_special_response.c","hunk":1,"line":33,"fuzz":0,"offset":7}]}
{"patch":"delayed_posted_events","hunks":[{"file":"src/event/ngx_event.c","hunk":1,"line":197,"fuzz":0,"offset":1},{"file":"src/event/ngx_event.c","hunk":2,"line":219,"fuzz":0,"offset":1},{"file":"src/event/ngx_event.c","hunk":3,"line":270,"fuzz":1,"offset":3},{"file":"src/event/ngx_event.c","hunk":4,"line":707,"fuzz":2,"offset":68},{"file":"src/event/ngx_event_posted.c","hunk":1,"line":13,"fuzz":2,"offset":1},{"file":"src/event/ngx_event_posted.h","hunk":1,"line":45,"fuzz":2,"offset":2}]}
{"patch":"privileged_agent_process","hunks":[{"file":"src/core/nginx.c","hunk":1,"line":1116,"fuzz":2,"offset":135},{"file":"src/core/nginx.c","hunk":2,"line":1011,"fuzz":2,"offset":1},{"file":"src/core/ngx_cycle.h","hunk":2,"line":92,"fuzz":1,"offset":8},{"file":"src/os/unix/ngx_process_cycle.c","hunk":3,"line":55,"fuzz":0,"offset":1},{"file":"src/os/unix/ngx_process_cycle.c","hunk":4,"line":134,"fuzz":0,"offset":-1},{"file":"src/os/unix/ngx_process_cycle.c","hunk":5,"line":222,"fuzz":0,"offset":1},{"file":"src/os/unix/ngx_process_cycle.c","hunk":6,"line":240,"fuzz":0,"offset":-1},{"file":"src/os/unix/ngx_process_cycle.c","hunk":7,"line":257,"fuzz":0,"offset":1},{"file":"src/os/unix/ngx_process_cycle.c","hunk":8,"line":430,"fuzz":1,"offset":-1},{"file":"src/os/unix/ngx_process_cycle.c","hunk":9,"line":868,"fuzz":0,"offset":8},{"file":"src/os/unix/ngx_process_cycle.c","hunk":10,"line":1201,"fuzz":1,"offset":-15}]}
{"patch":"privileged_agent_process_connections","hunks":[{"file":"src/core/nginx.c","hunk":1,"line":1117,"fuzz":0,"offset":55},{"file":"src/core/nginx.c","hunk":2,"line":1148,"fuzz":0,"offset":55},{"file":"src/os/unix/ngx_process_cycle.c","hunk":1,"line":1177,"fuzz":0,"offset":-2},{"file":"src/os/unix/ngx_process_cycle.c","hunk":2,"line":1189,"fuzz":0,"offset":-2},{"file":"src/os/unix/ngx_process_cycle.c","hunk":1,"line":413,"fuzz":0,"offset":-29}]}
{"patch":"single_process_graceful_exit","hunks":[{"file":"src/os/unix/ngx_process_cycle.c","hunk":1,"line":304,"fuzz":0,"offset":-1},{"file":"src/os/unix/ngx_process_cycle.c","hunk":2,"line":334,"fuzz":0,"offset":-1}]}
{"patch":"intercept_error_log","hunks":[{"file":"src/core/ngx_cycle.h","hunk":1,"line":25,"fuzz":1,"offset":3},{"file":"src/core/ngx_cycle.h","hunk":2,"line":88,"fuzz":1,"offset":8}]}
{"patch":"upstream_pipelining","hunks":[{"file":"src/http/ngx_http_upstream.c","hunk":1,"line":2338,"fuzz":0,"offset":99}]}
{"patch":"server_header","hunks":[{"file":"src/http/v2/ngx_http_v2_filter_module.c","hunk":1,"line":115,"fuzz":0,"offset":-28}]}
{"patch":"no_error_pages","hunks":[{"file":"src/http/ngx_http_core_module.c","hunk":6,"line":4849,"fuzz":0,"offset":26},{"file":"src/http/ngx_http_core_module.c","hunk":7,"line":4958,"fuzz":0,"offset":26}]}
{"patch":"no_Werror","hunks":[{"file":"auto/cc/clang","hunk":1,"line":89,"fuzz":1,"offset":0},{"file":"auto/cc/gcc","hunk":1,"line":166,"fuzz":0,"offset":-2},{"file":"auto/cc/icc","hunk":1,"line":111,"fuzz":0,"offset":-4}]}
{"patch":"log_escape_non_ascii","hunks":[{"file":"src/http/modules/ngx_http_log_module.c","hunk":2,"line":138,"fuzz":0,"offset":5},{"file":"src/http/modules/ngx_http_log_module.c","hunk":3,"line":184,"fuzz":0,"offset":4},{"file":"src/http/modules/ngx_http_log_module.c","hunk":4,"line":957,"fuzz":0,"offset":12},{"file":"src/http/modules/ngx_http_log_module.c","hunk":5,"line":958,"fuzz":0,"offset":4},{"file":"src/http/modules/ngx_http_log_module.c","hunk":6,"line":979,"fuzz":0,"offset":12},{"file":"src/http/modules/ngx_http_log_module.c","hunk":7,"line":985,"fuzz":0,"offset":4},{"file":"src/http/modules/ngx_http_log_module.c","hunk":8,"line":1024,"fuzz":0,"offset":12},{"file":"src/http/modules/ngx_http_log_module.c","hunk":9,"line":1179,"fuzz":0,"offset":37},{"file":"src/http/modules/ngx_http_log_module.c","hunk":10,"line":1170,"fuzz":0,"offset":12}]}
{"patch":"proxy_host_port_vars","hunks":[{"file":"src/http/modules/ngx_http_proxy_module.c","hunk":1,"line":872,"fuzz":0,"offset":79}]}
{"patch":"cache_manager_exit","hunks":[{"file":"src/os/unix/ngx_process_cycle.c","hunk":1,"line":1197,"fuzz":0,"offset":63}]}
{"patch":"larger_max_error_str","hunks":[{"file":"src/core/ngx_log.h","hunk":1,"line":73,"fuzz":0,"offset":9}]}
{"patch":"pcre_conf_opt","hunks":[{"file":"auto/options","hunk":1,"line":368,"fuzz":2,"offset":82},{"file":"auto/options","hunk":2,"line":508,"fuzz":2,"offset":66}]}
{"patch":"ssl_cert_cb_yield","hunks":[{"file":"src/event/ngx_event_openssl.c","hunk":1,"line":1914,"fuzz":0,"offset":469},{"file":"src/event/ngx_event_openssl.c","hunk":2,"line":1609,"fuzz":0,"offset":34}]}
{"patch":"ssl_sess_cb_yield","hunks":[{"file":"src/event/ngx_event_openssl.c","hunk":1,"line":1915,"fuzz":0,"offset":469},{"file":"src/event/ngx_event_openssl.c","hunk":2,"line":1629,"fuzz":0,"offset":49}]}
{"patch":"ssl_client_hello_cb_yield","hunks":[{"file":"src/event/ngx_event_openssl.c","hunk":1,"line":1918,"fuzz":0,"offset":206},{"file":"src/event/ngx_event_openssl.c","hunk":2,"line":1912,"fuzz":0,"offset":20}]}
{"patch":"upstream_timeout_fields","hunks":[{"file":"src/http/ngx_http_upstream.c","hunk":1,"line":508,"fuzz":0,"offset":-1},{"file":"src/http/ngx_http_upstream.c","hunk":2,"line":1675,"fuzz":0,"offset":42},{"file":"src/http/ngx_http_upstream.c","hunk":3,"line":1719,"fuzz":0,"offset":8},{"file":"src/http/ngx_http_upstream.c","hunk":4,"line":2116,"fuzz":0,"offset":87},{"file":"src/http/ngx_http_upstream.c","hunk":5,"line":2103,"fuzz":0,"offset":12},{"file":"src/http/ngx_http_upstream.c","hunk":6,"line":3333,"fuzz":0,"offset":113},{"file":"src/http/ngx_http_upstream.c","hunk":7,"line":3478,"fuzz":0,"offset":13},{"file":"src/http/ngx_http_upstream.c","hunk":8,"line":3597,"fuzz":0,"offset":120},{"file":"src/http/ngx_http_upstream.c","hunk":9,"line":3699,"fuzz":0,"offset":28},{"file":"src/http/ngx_http_upstream.h","hunk":1,"line":337,"fuzz":0,"offset":4}]}
{"patch":"socket_cloexec","hunks":[{"file":"auto/unix","hunk":1,"line":1050,"fuzz":0,"offset":60},{"file":"src/core/ngx_resolver.c","hunk":1,"line":4790,"fuzz":0,"offset":324},{"file":"src/core/ngx_resolver.c","hunk":2,"line":4824,"fuzz":0,"offset":324},{"file":"src/event/ngx_event_accept.c","hunk":1,"line":60,"fuzz":0,"offset":-2},{"file":"src/event/ngx_event_accept.c","hunk":2,"line":202,"fuzz":0,"offset":-2},{"file":"src/event/ngx_event_connect.c","hunk":2,"line":99,"fuzz":0,"offset":12},{"file":"src/os/unix/ngx_process_cycle.c","hunk":1,"line":1097,"fuzz":0,"offset":68},{"file":"src/os/unix/ngx_socket.h","hunk":1,"line":47,"fuzz":0,"offset":9}]}
{"patch":"reuseport_close_unused_fds","hunks":[{"file":"src/core/ngx_connection.c","hunk":1,"line":1115,"fuzz":2,"offset":-3},{"file":"src/event/ngx_event.c","hunk":1,"line":846,"fuzz":0,"offset":71}]}
```

### 最终文件 SHA-256

按最终文件全部UTF-8字节（包含末尾换行）计算；F编号仅方便下面表格引用。6个被补丁修改文件与新 audit.patched_sha256 对应值一致；F2–F4无补丁触及，本线程直接与固定 Git 原文全字节比较相同，不声称它们是主审计47项之一。

| 编号 | 文件 | 与固定上游全文件相同 | 最终 SHA-256 |
|---|---|---|---|
| F1 | src/core/nginx.c | 否 | `161e5eac7cf64862211b17a7db9bb352663000d0eb82a42fc5b8fe0ce2c413e8` |
| F2 | src/core/ngx_conf_file.c | 是 | `e9ee871bea5dc85d74836e40f8de1d7ab8729cbbf2b6afc0311b4fee11dfe274` |
| F3 | src/core/ngx_string.c | 是 | `2f9a83aaf74a8ea68e33f46a3bb8d65c068f668afe08f29bce5d09d197902638` |
| F4 | src/core/ngx_parse.c | 是 | `b92fe8a7d701843a94d275a37199193fdd984c33497cf829f4774dc92a1bd48a` |
| F5 | src/event/ngx_event.c | 否 | `8644da223a9e51c5369f2b96768ecb3a30d65b9e55ea0d64164a6d14197028db` |
| F6 | src/event/ngx_event_accept.c | 否 | `2c280f8cdbf0557a9d58c826091ee99ff0ee585589a0f8e4145ccae7887d5d75` |
| F7 | src/event/ngx_event_connect.c | 否 | `cdfd8200266af8834aa70a8df057eb377863b0d4979858e1c91445f295a9cd0c` |
| F8 | src/core/ngx_connection.c | 否 | `09720e7526a8b6ae4095e732e048dcd3403e66ff3ec246579b6b127d8d584a2d` |
| F9 | src/os/unix/ngx_process_cycle.c | 否 | `c6fe06200daf19b0c83d5f479c1e3a85721d6c8cec13b7178381891938e07b09` |

### 配置、初始化及函数的逐项比较

完整函数边界从函数名所在行到独占行闭合 `}`，保留原缩进与行间LF，不含返回类型行和末尾LF；下列SHA按该边界计算，不是文件SHA。15个已有函数与固定上游逐字相同；7个已有函数确有变化，2个agent函数为新增，均记录最终SHA而不只列补丁名。core create/init 去除最终正文新增的两个 privileged_agent 字段/默认语句后，分别与固定上游完整函数逐字相同；不能把这两个初始化函数说成整体不变。

| 文件 | 函数 | 固定上游行 → 最终行 | 比较结果 | 最终函数 SHA-256 |
|---|---|---|---|---|
| F1 | ngx_set_worker_processes | 1553–1578 → 1560–1585 | 逐字相同 | `450db62c21b8f94cec40130ee0881dfe081e4116d9bd0a45bc9943e1d7c74ae2` |
| F1 | ngx_core_module_create_conf | 1094–1135 → 1097–1140 | 有变化，核对见下 | `6e4360afae380bbe137d5c27266a282c629793d840a79b2bc4c026f9e7df6f56` |
| F1 | ngx_core_module_init_conf | 1139–1264 → 1144–1271 | 有变化，核对见下 | `2146b47fea10d4111f19b1b78834bb7c67e88591193fe50825774aa1cd2b9aa1` |
| F2 | ngx_conf_set_flag_slot | 1026–1062 → 1026–1062 | 逐字相同 | `505eafacc4e6c16ac0fb2aac8f60c7313d763d1d65826a23fd8775f2bdd8d9a8` |
| F2 | ngx_conf_set_msec_slot | 1260–1287 → 1260–1287 | 逐字相同 | `3e997c6260a07b10acac117e834d50f3df49cfeed5d5f1f67d218e9ae17c7d64` |
| F3 | ngx_atoi | 967–991 → 967–991 | 逐字相同 | `7fef5f670784f521b4a073fe21e6e95ec53e55c63688767eac09fcb3f27fe907` |
| F4 | ngx_parse_time | 112–283 → 112–283 | 逐字相同 | `29390834f0f40892457d615938c753d2af2642b4f2ed4f970d33b87ed4615440` |
| F5 | ngx_event_connections | 1065–1087 → 1117–1139 | 逐字相同 | `16bd528390303f0ac0f4adcc70e29812c16a2da239a771b5ce54eca43a7ee854` |
| F5 | ngx_event_core_create_conf | 1258–1285 → 1310–1337 | 逐字相同 | `e30ef1551d49854ab2b7a3c4c77b7436bcc01a466c9191d645b8823440f5b5b0` |
| F5 | ngx_event_core_init_conf | 1289–1373 → 1341–1425 | 逐字相同 | `8bb24a2af84fdc50493fca3b8b7f4f0a53cdac1762aa41ebdae7b94589d3b11a` |
| F5 | ngx_events_block | 987–1061 → 1039–1113 | 逐字相同 | `22b02c9de2aef817cba864011fd06ddf9a03062b8545f717e3580a18af1771e5` |
| F5 | ngx_event_init_conf | 433–488 → 472–527 | 逐字相同 | `544b464fbdcedffc5ef036f12b6be342990e30ad949e97dc66aeddc440b1fcab` |
| F5 | ngx_event_process_init | 636–948 → 675–1000 | 有变化，核对见下 | `90e53a83a8309c44d4f9a03e3cad26f62b802f90c9911913eb873f328d589c8f` |
| F5 | ngx_process_events_and_timers | 195–264 → 195–303 | 有变化，核对见下 | `57c332e4ad60cb804b323e02d7314a23ee659158d36b6d5f8f3595a2e10b4c7e` |
| F6 | ngx_trylock_accept_mutex | 328–362 → 340–374 | 逐字相同 | `a4f6c1099ac22415450f4a99946d02a203a75c715674def0fa964f32a34e9120` |
| F6 | ngx_enable_accept_events | 366–387 → 378–399 | 逐字相同 | `f4daa6642386af48dada9e0acfe0352c3a04b9eb4a2814c75e30f934ae4da597` |
| F6 | ngx_disable_accept_events | 391–427 → 403–439 | 逐字相同 | `5c2ce9b45a24f827f19a581e86edc93244843feba52478bb7acfdb34ea565cf3` |
| F6 | ngx_event_accept | 21–324 → 21–336 | 有变化，核对见下 | `1ebab9494c4023a8faf47e769ad582a79362b52fa9290a1ba52ed83f287a95e6` |
| F7 | ngx_event_connect_peer | 21–331 → 21–347 | 有变化，核对见下 | `eba6cbc500be3c04e671c8ff9867ed8464d3966851bdd727904816ba84356d49` |
| F8 | ngx_get_connection | 1175–1237 → 1181–1243 | 逐字相同 | `6baf36354109ba6d485ff8443620bd81fc43e642a6da74139289a4ec0e25b555` |
| F8 | ngx_close_listening_sockets | 1096–1171 → 1096–1177 | 有变化，核对见下 | `a0a36e29cb01d77acd1a704d63a8e925721ce298a5833573e9018bc27176cc36` |
| F9 | ngx_start_worker_processes | 336–349 → 374–387 | 逐字相同 | `85778f9b4e9863ffecfed9c892cac716d8c4d97d8294471dbc1a785b48277085` |
| F9 | ngx_start_privileged_agent_processes | 新增 → 434–459 | 新增 | `8c4c8d696e2000bed7222591a4b2dea57f157b18d23450a690174b70a6923445` |
| F9 | ngx_privileged_agent_process_cycle | 新增 → 1218–1256 | 新增 | `ca91ea50fcf90a6b5edb0abcc643dffdaaac4703e8e38f45b7e1134ca74d82ce` |

### 所列事实片段的实际映射

下面17个固定上游片段均在最终正文逐字保留；记录最终真实位置及片段SHA。片段按表列行范围连接LF，不含末尾LF；未以 patched 行号重写知识中原固定 Git 来源。尤其 accept-errors 覆盖原80–111的完整错误分支，不是只检查名称或patch路径。

| 事实片段 | 文件 | 固定上游行 → 最终行 | 最终片段 SHA-256 |
|---|---|---|---|
| worker-registration | F1 | 79–84 → 79–84 | `0bad7299f66497ced811aa03dbc91bfdb180032aff7de17942eec25928d8e66e` |
| worker-unset | F1 | 1119–1119 → 1124–1124 | `01a83fa8e831872f633473c38495e8ab00b6d8cce21f8c318007e22767ae3148` |
| worker-default | F1 | 1148–1148 → 1155–1155 | `813d9de520c3e0e19b813153fe34c47ecef3b6bc74acc426f9c6d4953afe5f7f` |
| event-registration | F5 | 123–156 → 123–156 | `de02af74ec9684e15912ae677693961f73096f731f871bcd847a65a56c39ad00` |
| mutex-condition | F5 | 649–667 → 688–706 | `1afd3c6c51e80b122fff82229bbeee3e7b0b89661c0155674d9e1cc4de56a7a9` |
| mutex-wait | F5 | 219–239 → 229–249 | `28be53c5110124b98a33beb0c11c992a4af0b60f6da8cb487523b8c5c242e331` |
| connections-arrays | F5 | 754–800 → 794–840 | `4061d8a89f4dc4eb905b8d6d2112d20146a249feacaf87085ef7e8b82de7b555` |
| connections-minimum | F5 | 441–460 → 480–499 | `9dfce15d2d8c6577de1e81ef2aff823daf75f71991eab3db4dff6cfc8cae5391` |
| nofile-check | F5 | 514–538 → 553–577 | `a13440ba681c7a558f39624e723047ee39522097c2079b11b88b799b84aa2dbe` |
| iocp-handler | F5 | 856–881 → 908–933 | `e9c9f609a957ed3ec92cd12d08073036087fa4b6f5cb3183f2106864f89ed1ce` |
| listener-events | F5 | 905–935 → 957–987 | `d0ca4919d2892abbc9463866b32138cb7c4a47d5aac70b109b4f1b8747d04a91` |
| accept-available | F6 | 45–58 → 45–58 | `1a3162b9103e1ede24e6b41abfd46e25d002179668c751c5d6c41a9e0b48b5e8` |
| accept-errors | F6 | 80–111 → 82–113 | `7f58e9fb215d38a151e0e1418c67cd549f151392b64655355b73b1c7cae890e9` |
| accept-retry | F6 | 112–132 → 114–134 | `9473e9af02aa4f51e5205f6a44ef62ece582364894f496c05ffdbd0cb8dd9062` |
| client-allocation | F6 | 139–151 → 141–153 | `fa905fa7dbf65ec00f957dabeb777d34603f16f4e64220d97fd507071bfbbb0b` |
| accept-loop | F6 | 313–324 → 325–336 | `16b51455f1e4292f65ae59e60091c454483b9ff3c6d8113455fa020dce725c1e` |
| upstream-allocation | F7 | 53–64 → 60–71 | `bde431370f917310f8a60d6b66ed6c0ec71b79095295f58059a532a7cbabfdb1` |

### 变化函数的最终正文与五项判断

- worker_processes：F1最终1124行仍将 worker_processes 置UNSET，1155行仍默认1，setter最终1560–1585、普通worker启动循环F9最终374–387均逐字不变。F1 create/init确实新增agent字段及默认（1150–1151），不把普通worker计数扩为全部进程。此项所列配置/普通计数 unaffected 仍成立。
- worker_connections：事件配置create/init F5最终1310–1337/1341–1425完整不变，默认512及连接数赋值保留；连接池、最小数量、nofile、客户端/上游分配映射见表。F9 agent函数最终1218–1256中，1233行实际为 `cycle->connection_n = ccf->privileged_agent_connections;`，1237行关闭accept mutex；新增spawn函数434–459检查启用与agent连接数0后派生。普通worker资源配置 unaffected 不等于agent或socket运行时unaffected。
- multi_accept：F6最终82–113与原80–111完整相同，ENOSYS回退/ECONNABORTED按available继续的事实成立；EAGAIN仍返回，available/循环与IOCP分支均保留。接收函数整体变化：最终63–64为 `accept4(... SOCK_NONBLOCK | SOCK_CLOEXEC)`，206–213的FD_CLOEXEC分支失败关闭连接返回。affected 与现summary/限制相符，不需回改知识。
- accept_mutex：F5最终688–706锁条件、F6最终340–374/378–399/403–439锁操作完整保留。F5最终713行初始化延迟队列；848–862行在reuseport且worker不属本进程时关闭fd、置-1再continue；F8最终1118–1122在关闭监听时跳过-1。F5最终957–987的reuseport/EPOLLEXCLUSIVE分支不变。因此原启用条件与例外成立，但完整初始化/调度已变，affected保持。
- accept_mutex_delay：F5最终195–303事件循环中，222–227先检查延迟队列并置timer=0，229–249保留未获锁等待上限；延迟队列后续处理在同一函数，故实际等待可能0。F6最终114–134的EMFILE/ENFILE恢复路径逐字保留，130行在未用锁时实际读取ecf->accept_mutex_delay；off时不完全无效。msec回调/时间解析F2/F4完整不变，500ms默认、无单位按秒和0可解析仍成立。

以上是实际最终正文及函数/片段检查，不是仅从patch返回0、来源路径存在或哈希相等推出语义。五条知识的现有语义与补丁范围均有效，C-R05本次没有修改knowledge。真实匹配调整只能作为已核定的固定结果，与最终字节/事实一起检查；不能恢复为“无offset/fuzz”门禁，也不能推广为未列事实或全Nginx运行时验证。主线程门禁/负例属于主写集，由主独立验收。

## 检查与交接

- 固定 evidence 范围、身份、callback、source_ids 和 affected 补丁来源检查通过；五条内存详情经现有 prepareKnowledgeFacts / validatePublication 门禁，通过真实 createKnowledgeClient.querySingle 接口。未调用 build，未写 dist。
- 精确 events 输入的 parseConfig + matchDirective 两个子项均 matched；不作为 nginx 配置启动验证。
- 现有 Node 回归：`node --test test/knowledge.test.mjs test/parser.test.mjs test/matcher.test.mjs`，37 项通过。既有 dist 测试不冒充本批最终发布验收。
- 五项之外知识对象序列前后 SHA-256 一致：`8183ed5b759bfe4b34963efd4a5268a7827ede7f4ac49b4741596b58f9d470e2`。
- 主线程已报告修正后的 dee833a2c9381a27 构建、51 tests 与真 HTTP 五项查询通过；这是主线程结果，最终浏览器及独立审核仍由主执行。

首批修改 knowledge/directives.json 五项及本文；C-R05 返工仅修改本文，知识未变。五项所列事实独立复核 ready，是否关闭整批 C-R05 仍由主线程和独立审核确认；不把五项或参考区扩大为全量内容完成。
