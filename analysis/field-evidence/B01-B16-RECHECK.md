# B01 / B16 按现行裁定 1–7 的一致性回查

范围：`knowledge/field-evidence/B01.json`（43 条）、`B16.json`（24 条）及对应 EVIDENCE。只查裁定 1–7 相关问题，未改动 knowledge/ 与 EVIDENCE。
源码均按锁定 revision 读取：nginx `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`（release-1.27.1，下记 `nginx@`）；VTS `52fe11e44c47a49b052be89e36dfa17d81bf52a5`（下记 `vts@`）。
方法：对每条 summary 的 source_ids 片段，核对 `xcf->字段` / `ctx->字段` 的取配置行与中间赋值行是否在片段集合内；按注册表核对 enum/bitmask/固定关键字；检查废弃/不读参数的占位符；对“不使用/不读取/不会”类否定陈述在锁定 revision 上复跑检索。

## 结论

有需修正的条目。B01 共 15 个 ID 需修正；B16 共 7 个 ID 需修正。均为**证据补齐**（片段/note），**没有发现 syntax 或 summary 文字与源码矛盾**，也无需改动 summary 文字（B16 `display` 的占位符除外，按裁定 4 改语法文字）。

| 裁定 | B01 | B16 |
|---|---|---|
| 1/3/5 取配置/中间赋值行不在片段内 | 13 个 ID | 5 个 ID |
| 2/6 枚举/位掩码/关键字取值少列多列 | 无问题 | 无问题 |
| 4 不读参数值的占位符 | 无问题 | 1 个 ID |
| 7 否定陈述缺检索说明 | 2 个 ID | 1 个 ID |

裁定 3 的口径说明（不判错）：`init_conf`/`merge_loc_conf`/指令 setter 里的 `ccf = conf`、`conf/prev` 参数，属框架传入，按裁定 3 不追到框架定义，不计入问题（如 B01 `pid`、`lock_file`、`daemon` 的 `d340-init`，B16 各 `merge-values`）。只有在运行期函数中经 `ngx_get_conf` / `ngx_event_get_conf` / `ngx_http_get_module_*_conf` 取配置、且该行不在 source_ids 片段内的，才列为问题。

## 一、B01 问题清单

### 1. 裁定 1/3/5：`ccf` 取配置行不在片段内（`ngx_worker_process_init`）

`nginx@src/os/unix/ngx_process_cycle.c:768` 为 `ccf = (ngx_core_conf_t *) ngx_get_conf(cycle->conf_ctx, ngx_core_module);`。新增片段 `summary-worker-init`（752-761）止于变量声明 `ngx_core_conf_t *ccf;`，没有包含 763-768；`worker_rlimit_nofile` 的 `runtime-nofile-init`（753-798）已覆盖，不受影响。

| ID | 字段 | 裁定 | 使用点 | 缺失行（revision:文件:行） | 建议修法 |
|---|---|---|---|---|---|
| `nginx--ngx_core_module--worker_rlimit_core` | summary | 1/3 | `nginx@src/os/unix/ngx_process_cycle.c:788-797`（`ccf->rlimit_core`） | `nginx@src/os/unix/ngx_process_cycle.c:768` | 把 `summary-worker-init` 的范围由 752-761 扩为 752-768（含 `ccf = ... ngx_get_conf`）；其他条目复用该片段。 |
| `nginx--ngx_core_module--working_directory` | summary | 1/3 | `nginx@src/os/unix/ngx_process_cycle.c:872-880`（`ccf->working_directory`） | `nginx@src/os/unix/ngx_process_cycle.c:768` | 同上，使用扩为 752-768 的 `summary-worker-init`。 |
| `nginx--ngx_core_module--worker_priority` | summary | 1/3 | `nginx@src/os/unix/ngx_process_cycle.c:770-775`（`implementation-1`，`ccf->priority`） | `nginx@src/os/unix/ngx_process_cycle.c:768` | 把 `implementation-1` 改为 768-775，或在 `source_ids` 追加共享的 752-768 片段。 |
| `nginx--ngx_core_module--user` | summary | 1/3 | `nginx@src/os/unix/ngx_process_cycle.c:799-833`（`implementation-1`，`ccf->group/user/username`） | `nginx@src/os/unix/ngx_process_cycle.c:768` | 追加 768 一行（或共享 752-768）进 `source_ids`。`runtime-patch` 里的 `ccf = ... ngx_get_conf` 属于特权代理函数，不是此处 worker 初始化的 `ccf`，不能代替。 |

### 2. 裁定 1/3/5：事件模块 `xcf` 取配置行不在片段内

各模块 `*_init` 函数在函数开头 `xcf = ngx_event_get_conf(cycle->conf_ctx, <module>)`，来源片段起点都在其后几行，漏掉该行。

| ID | 字段 | 裁定 | 使用点 | 缺失行 | 建议修法 |
|---|---|---|---|---|---|
| `nginx--ngx_devpoll_module--devpoll_changes` | summary | 1/3 | `nginx@src/event/modules/ngx_devpoll_module.c:135,151,161,168`（`implementation-0` 133-172，`dpcf->changes`） | `nginx@src/event/modules/ngx_devpoll_module.c:123`（`dpcf = ngx_event_get_conf(... ngx_devpoll_module)`） | 把 `implementation-0` 起点改为 123（123-172），或新增 123 单行片段并加入 `source_ids`。 |
| `nginx--ngx_devpoll_module--devpoll_events` | summary | 1/3 | `nginx@src/event/modules/ngx_devpoll_module.c:175,182`（`implementation-0` 171-187，`dpcf->events`） | `nginx@src/event/modules/ngx_devpoll_module.c:123` | 同上；与上一条共用 123 单行片段。 |
| `nginx--ngx_epoll_module--epoll_events` | summary | 1/3 | `nginx@src/event/modules/ngx_epoll_module.c:353,358,365`（`implementation-0` 353-365，`epcf->events`） | `nginx@src/event/modules/ngx_epoll_module.c:327`（`epcf = ngx_event_get_conf(... ngx_epoll_module)`） | 增加 327 单行片段（距使用点较远，按裁定 5 用短片段并列入 `source_ids`）。 |
| `nginx--ngx_epoll_module--worker_aio_requests` | summary | 1/5 | `nginx@src/event/modules/ngx_epoll_module.c:278`（`io_setup(epcf->aio_requests, ...)`）；`d340-aio-gate`（344-346）里 `ngx_epoll_aio_init(cycle, epcf)` | `nginx@src/event/modules/ngx_epoll_module.c:327`（`epcf` 的取配置行，传给 aio_init 的就是它） | 把 `d340-aio-gate` 改为 327-346 的合并片段，或追加 327 单行片段。 |
| `nginx--ngx_eventport_module--eventport_events` | summary | 1/3 | `nginx@src/event/modules/ngx_eventport_module.c:233,238,275`（`implementation-0` 232-275，`epcf->events`） | `nginx@src/event/modules/ngx_eventport_module.c:218`（`epcf = ngx_event_get_conf(... ngx_eventport_module)`） | 追加 218 单行片段。 |
| `nginx--ngx_kqueue_module--kqueue_changes` | summary | 1/3 | `nginx@src/event/modules/ngx_kqueue_module.c:143,162,169`（`implementation-0` 143-169，`kcf->changes`） | `nginx@src/event/modules/ngx_kqueue_module.c:125`（`kcf = ngx_event_get_conf(... ngx_kqueue_module)`） | 把 `implementation-0` 起点前移到 125（125-169），或追加 125 单行片段。 |
| `nginx--ngx_kqueue_module--kqueue_events` | summary | 1/3 | `nginx@src/event/modules/ngx_kqueue_module.c:171,176,220`（`implementation-0` 171-220，`kcf->events`） | `nginx@src/event/modules/ngx_kqueue_module.c:125` | 同上，追加 125 单行片段。 |

### 3. 裁定 1：中间赋值/取配置行缺环（`accept_mutex_delay`、`debug_connection`）

| ID | 字段 | 裁定 | 使用点 | 缺失行 | 建议修法 |
|---|---|---|---|---|---|
| `nginx--ngx_event_core_module--accept_mutex_delay` | summary | 1/5 | note 称“`ecf->accept_mutex_delay` 赋给 `ngx_accept_mutex_delay`”：该赋值在 `nginx@src/event/ngx_event.c:652`；`accept-retry`（`nginx@src/event/ngx_event_accept.c:112-132`）里 `ecf->accept_mutex_delay`（128） | ① `nginx@src/event/ngx_event.c:646-652`（`ecf = ngx_event_get_conf(...)`、`ngx_accept_mutex_delay = ecf->accept_mutex_delay;`）；② `nginx@src/event/ngx_event_accept.c:45`（accept 路径的 `ecf` 取配置行） | 在 `source_ids` 追加已有的 `mutex-conditions`（`ngx_event.c` 含 647-652）或新增 646-652 片段；再追加 `runtime-accept-entry`（`ngx_event_accept.c:21-56`）或 45 单行片段。当前三个片段（`mutex-wait`、`accept-retry`、`event-defaults`）都不含这两处赋值。 |
| `nginx--ngx_event_core_module--debug_connection` | summary | 1/5 | `implementation-1`（`nginx@src/event/ngx_event_accept.c:519-572`）里 `ecf->debug_connection`，`ecf` 是 `ngx_debug_accepted_connection(ngx_event_conf_t *ecf, ...)` 的形参 | ① `nginx@src/event/ngx_event_accept.c:45`（调用方 `ecf = ngx_event_get_conf(...)`）；② `nginx@src/event/ngx_event_accept.c:289`（`ngx_debug_accepted_connection(ecf, c)` 调用行） | 追加 45 与 289 两个单行片段（或 `runtime-accept-entry` 21-56 + 289）。note 里“连接接收时调用”目前没有调用点证据。 |

### 4. 裁定 7：否定陈述缺检索说明（B01）

| ID | 字段 | 裁定 | 陈述 | 源码位置 | 复跑结果 | 建议修法 |
|---|---|---|---|---|---|---|
| `nginx--ngx_core_module--lock_file` | summary | 7 | “有原子操作时（NGX_HAVE_ATOMIC_OPS）不使用该名称”（note）/“支持原子操作的平台通常不用这种文件锁” | `nginx@src/core/ngx_shmtx.c:18-43`（原子版 `ngx_shmtx_create`） | 复跑成立：函数全文 18-43 不引用形参 `name`。但 `summary-shmtx-atomic` 只取 12-25，在 `if (mtx->spin == -1) return` 处截断，后面 27-42 不在片段内，无法看出 `name` 未被使用。 | 把 `summary-shmtx-atomic` 扩为 12-43（函数全文）；note 写明“原子版 `ngx_shmtx_create` 函数体 18-43 无 `name` 引用”，并写出检索：`git -C repos/nginx show e06bdbd…:src/core/ngx_shmtx.c \| sed -n '18,43p'` 命中 0。 |
| `nginx--ngx_iocp_module--iocp_threads` | summary | 7 | “不是创建该数目的 worker 进程或直接创建同数目的线程”（功能文字）；note 只写 `cf->threads` 传给 `CreateIoCompletionPort` | 全组件 revision 内 `threads` 仅出现在 `nginx@src/event/modules/ngx_iocp_module.c:34,117,361,374` 与 `ngx_iocp_module.h:13`；`CreateThread` 仅在 `nginx@src/event/ngx_event_connectex.c:76`（`ngx_iocp_new_thread`，调用点 53、159，与 `cf->threads` 无关） | 复跑成立。但 EVIDENCE/note 未写检索命令、范围与命中。 | 在 note 追加：`git -C repos/nginx grep -n -w threads e06bdbd… -- src/event`，全部命中为上列 6 处（34 注册偏移、117 `CreateIoCompletionPort`、361/374 create/init、h:13 字段、ngx_event.h:121 仅注释）；并写明 `ngx_iocp_new_thread` 调用点 53、159 不读取 `threads`。 |

### B01 其余裁定核对结果（无问题）

- 裁定 2/6：`debug_points abort | stop`（取值表 `nginx@src/core/nginx.c:35-39` 仅 stop/abort）、`worker_processes number | auto`、`worker_cpu_affinity ... / auto [cpumask]`、`thread_pool name threads= [max_queue=]`（解析函数只认这两个键）、`env`、`user`、`error_log file [level]`（级别为占位符，未枚举关键字，不违反）与源码一致，无少列/多列。
- 裁定 4：B01 无废弃或不读参数值的指令，占位符均对应被读取的值。
- `quic_bpf` 的修正已把无源码依据的“连接迁移”删去，与裁定 1 无冲突。

## 二、B16 问题清单

### 1. 裁定 4：不读参数值却用描述性占位符

| ID | 字段 | 裁定 | 源码位置 | 建议修法 |
|---|---|---|---|---|
| `nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_display` | syntax | 4 | `vts@src/ngx_http_vhost_traffic_status_display.c:1040-1048`：`ngx_http_vhost_traffic_status_display` 全程不读取 `cf->args`，只设置 `clcf->handler`；注册 `NGX_CONF_NOARGS\|NGX_CONF_TAKE1`（`vts@src/ngx_http_vhost_traffic_status_module.c:167-172`）。现语法 `vhost_traffic_status_display [ignored_argument];` | 按裁定 4 在 `corrections` 把语法改为 `vhost_traffic_status_display [value];`，note 写明“处理函数不读 `cf->args`，值被忽略”。现 note 已说明参数被忽略，状态保持 verified 即可。 |

### 2. 裁定 1/3/5：取配置行不在片段内

| ID | 字段 | 裁定 | 使用点 | 缺失行 | 建议修法 |
|---|---|---|---|---|---|
| `nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_display_jsonp` | summary | 1/3 | `jsonp-output`（`vts@src/ngx_http_vhost_traffic_status_display.c:480-560`）里 `vtscf->jsonp`（554）、`vtscf->format`（492） | `vts@src/ngx_http_vhost_traffic_status_display.c:424`（`vtscf = ngx_http_get_module_loc_conf(r, ...)`，在 `display_handler_default` 开头；片段起点 480 在其后） | 把 `jsonp-output` 改为 424-560 不合适（过长），建议追加 424 单行短片段并列入 `source_ids`（`format-output`（410-540）已含 424，可直接把 `format-output` 加入 `source_ids`）。 |
| `nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_limit_check_duplicate` | summary | 1/3 | `main-limit-unique`（`vts@src/ngx_http_vhost_traffic_status_module.c:953-970`）里 `vtscf->limit_check_duplicate`（955） | `vts@src/ngx_http_vhost_traffic_status_module.c:944`（`vtscf = ngx_http_conf_get_module_loc_conf(cf, ...)`，`init_main_conf` 内；`main-filter-unique` 934-951 已含，而 `main-limit-unique` 起点 953 在其后） | 把 `main-limit-unique` 改为 934-970（同一函数，约 37 行），或把 `main-filter-unique` 一并加入本条 `source_ids`。 |
| `nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_average_method` | summary | 1/3 | `average-consumer`（`vts@src/ngx_http_vhost_traffic_status_display_json.c:513-527`）里 `vtscf->average_method`、`vtscf->average_period` | `vts@src/ngx_http_vhost_traffic_status_display_json.c:486`（`vtscf = ngx_http_get_module_loc_conf(r, ...)`，`display_set_upstream_node` 开头） | 追加 486 单行片段，或把 `average-consumer` 改为 486-527（约 40 行，可接受）。 |
| `nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_measure_status_codes` | summary | 1/3 | `status-slot`（`vts@src/ngx_http_vhost_traffic_status_shm.c:189-201`）里 `ctx->measure_all_status_codes`、`ctx->measure_status_codes`；`status-counters`（258-268）里 `ctx->measure_status_codes` | `vts@src/ngx_http_vhost_traffic_status_shm.c:178`（`ctx = ngx_http_get_module_main_conf(r, ...)`，`shm_add_node` 开头） | 追加 178 单行片段并列入 `source_ids`，两处使用点共用。 |
| `nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_ignore_status` | summary | 1/3/5 | note 称“新建节点（`shm_add_node`）与已有节点（`node_set`）都把它复制到 `vtsn->ignore_status`”；新建路径来自 `node-callers`（`vts@src/ngx_http_vhost_traffic_status_shm.c:249-317`）第 256 行 `vtsn->ignore_status = vtscf->ignore_status;` | `vts@src/ngx_http_vhost_traffic_status_shm.c:180`（`vtscf = ngx_http_get_module_loc_conf(r, ...)`）；已有节点路径 `node-set`（`node.c:479-503`）已含 488，无问题 | 追加 `shm.c:180` 单行片段（可与上一条的 178 合并为 178-180 一个片段）。 |

### 3. 裁定 7：否定陈述缺检索说明

| ID | 字段 | 裁定 | 陈述 | 复跑结果 | 建议修法 |
|---|---|---|---|---|---|
| `nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status` | summary | 7 | 功能文字“不是所有 VTS 处理器的统一总开关”；note“limit-handler 只检查 limit/bypass_limit 而不读 enable” | 在 `vts@` 全 `src` 目录检索 `git -C repos/nginx-module-vts grep -n -E 'vtscf->enable\|->enable' 52fe11e… -- src`：局部 `vtscf->enable`（loc_conf 的 `enable`）仅被读取于 `vts@src/ngx_http_vhost_traffic_status_module.c:293`（LOG 阶段统计 handler）；其余是 `ctx->enable`（主配置，`display.c:125,428`、`limit.c:26`、`set.c:40`、`module.c:1065,1183,1220`）及写入/默认值（`module.c:80,599,975,1027,1124`）。结论与文字一致。 | 在 note 补充上述检索命令、范围（该快照 `src` 全目录）与全部命中位置，并注明“`display.c`、`limit.c`、`set.c` 只读主配置 `ctx->enable`，不读局部 `vtscf->enable`”。当前 note 只提到 limit-handler 一处，不满足裁定 7。 |

### B16 其余裁定核对结果（无问题）

- 裁定 2/6：`display_format json|html|jsonp|prometheus`（取值表 `vts@src/ngx_http_vhost_traffic_status_module.c:49-55`，四项一致）、`average_method AMM | WMA`（58-62）、`ignore_status 1xx|2xx|3xx|4xx|5xx|off`（64-72）、`measure_status_codes all | code`（解析 520-579）、`filter_by_set_key key [group]`、`limit_traffic[_by_set_key]`（`TAKE12/TAKE23`，nelts 分支与语法一致）、`zone [shared:name:size]`（只接受 `shared:` 前缀，一致），语法无少列/多列。
- 裁定 4：除 `display` 外，各指令的参数值均被解析使用（`dump path [period]`、`histogram_buckets` 等）。
- 裁定 1/3：其余 flag 指令（`filter`、`filter_by_host`、`filter_check_duplicate`、`limit`、`bypass_limit`、`bypass_stats`、`stats_by_upstream`）的 handler 片段均含 `vtscf = ngx_http_get_module_loc_conf` 行，闭环；`dump`（`dump-worker` 含 1175 的 `ctx`）、`filter_max_node`（`find_lru` 含 227）闭环。

## 三、汇总

| 批次 | 需修正 ID 数 | 问题类型 |
|---|---|---|
| B01 | 15（`worker_rlimit_core`、`working_directory`、`worker_priority`、`user`、`devpoll_changes`、`devpoll_events`、`epoll_events`、`worker_aio_requests`、`eventport_events`、`kqueue_changes`、`kqueue_events`、`accept_mutex_delay`、`debug_connection`、`lock_file`、`iocp_threads`） | 裁定 1/3/5 共 13 个 ID，裁定 7 共 2 个 ID |
| B16 | 7（`display`、`display_jsonp`、`limit_check_duplicate`、`average_method`、`measure_status_codes`、`ignore_status`、`vhost_traffic_status`） | 裁定 1/3/5 共 5 个 ID，裁定 4 共 1 个，裁定 7 共 1 个 |

注：B01 按 ID 计 15 个（第 1 节 4 个、第 2 节 7 个、第 3 节 2 个、第 4 节 2 个）；B16 按 ID 计 7 个（第 1 节 1 个、第 2 节 5 个、第 3 节 1 个）。

以上均不涉及 summary/syntax 文字与源码矛盾，也不改变 verified 结论（补齐片段/note 后仍可保持 verified）；`display` 的语法占位符需用 `corrections` 改为 `value`。

---

# 复审 1

范围：实施者按上文清单完成的修复。逐条在锁定 revision（nginx `e06bdbd4…`、VTS `52fe11e4…`）上核对新增片段行号与内容、`source_ids` 是否列入、否定陈述是否复跑一致。`node scripts/build.mjs --config project.config.json --check` 退出码 0，B01 43/43、B16 24/24 均为 verified。

## 结论：全部 ADDRESSED，无新错，无未解决问题。

## B01

| ID | 结论 | 核对 |
|---|---|---|
| `worker_rlimit_core` | ADDRESSED | `summary-ccf-get`（ngx_process_cycle.c:768 `ccf = ... ngx_get_conf`）属实，已列入 `source_ids`，与 `summary-worker-init`(752-761)、`implementation-0`(788-797) 同函数闭环 |
| `working_directory` | ADDRESSED | 同上，使用点 872-880 |
| `worker_priority` | ADDRESSED | 同上，使用点 770-775 |
| `user` | ADDRESSED | 同上，使用点 799-833 |
| `devpoll_changes` / `devpoll_events` | ADDRESSED | `summary-dpcf-get` = ngx_devpoll_module.c:123 `dpcf = ngx_event_get_conf(... ngx_devpoll_module)`，两条均已列入 |
| `epoll_events` | ADDRESSED | `summary-epcf-get` = ngx_epoll_module.c:327，已列入 |
| `worker_aio_requests` | ADDRESSED | 同一 ngx_epoll_module.c:327，与 `d340-aio-gate`(345 `ngx_epoll_aio_init(cycle, epcf)`) 连成链，已列入 |
| `eventport_events` | ADDRESSED | `summary-epcf-get` 在本条目内指向 ngx_eventport_module.c:218（同名不同条目，各自引用自己的片段，无冲突） |
| `kqueue_changes` / `kqueue_events` | ADDRESSED | `summary-kcf-get` = ngx_kqueue_module.c:125，两条均已列入 |
| `accept_mutex_delay` | ADDRESSED | `summary-mutex-assign` = ngx_event.c:646-652（含 647 取配置、652 `ngx_accept_mutex_delay = ecf->accept_mutex_delay`），`summary-accept-ecf` = ngx_event_accept.c:45，均已列入 |
| `debug_connection` | ADDRESSED | `summary-accept-ecf`(45) 与 `summary-debug-call`(ngx_event_accept.c:289 `ngx_debug_accepted_connection(ecf, c)`) 属实，已列入 |
| `lock_file` | ADDRESSED | `summary-shmtx-atomic` 扩为 ngx_shmtx.c:12-43，覆盖原子版函数全文；note 的检索复跑一致：`sed -n '18,43p' | grep -n -w name` 仅命中形参行（文件第 19 行），`sed -n '21,42p'` 命中 0 |
| `iocp_threads` | ADDRESSED | note 已写检索命令、范围与命中。复跑 `git grep -n -w threads e06bdbd…` 共 48 处，与 note 一致；iocp 字段只在 ngx_iocp_module.c:34/117/361/374 与 .h:13；`CreateThread` 命中 connectex.c:71/76/80、win32/ngx_thread.c:19/28，与 note 一致 |

## B16

| ID | 结论 | 核对 |
|---|---|---|
| `display`（syntax） | ADDRESSED | `corrections.syntax` 改为 `vhost_traffic_status_display [value];`，note 写明处理函数不读 `cf->args`，`source_ids` 含 `display-binding`(display.c:1040-1048)，与源码一致 |
| `display_jsonp` | ADDRESSED | `jsonp-loc-conf` = display.c:424 `vtscf = ngx_http_get_module_loc_conf`，已列入 |
| `limit_check_duplicate` | ADDRESSED | `main-loc-conf` = module.c:944，已列入 |
| `average_method` | ADDRESSED | `average-loc-conf` = display_json.c:486，已列入 |
| `measure_status_codes` | ADDRESSED | `shm-main-conf` = shm.c:178 `ctx = ngx_http_get_module_main_conf`，已列入 |
| `ignore_status` | ADDRESSED | `shm-loc-conf` = shm.c:180 `vtscf = ngx_http_get_module_loc_conf`，已列入 |
| `vhost_traffic_status` | ADDRESSED | note 写出检索命令、范围与 15 处命中。复跑 `git grep -n -E 'vtscf->enable|->enable' 52fe11e… -- src` 共 15 处；局部 `vtscf->enable` 仅 module.c:293 读取，其余为 `ctx->enable` 读取/写入/注释，与 note 逐条一致 |

## 新增问题

无。新增片段均为单行或短片段，行号与内容和锁定 revision 一致；未发现 summary/syntax 文字与源码矛盾。
