# B01 审核记录

审核范围：43 条 × syntax / summary，逐字段核对。固定 revision：nginx release-1.27.1（e06bdbd4…）。已有来源取自 `dist/knowledge/releases/1.27.1.1-f43ab3d7392bdcc9/directives/<id>.json`，并与 `git show release-1.27.1:<file>` 按行号逐段比对（无偏移、无 ID 冲突、source_ids 全部可解析）；新增 evidence 均按 revision 与行号实际读取。43 条 `patch_status` 均非 `unverified`。

结论：初审有退回（4 条，均为 summary）；复审 1 后该 4 条均 ADDRESSED，本批无未解决退回。

## 总表

| ID | syntax | summary | 退回原因 |
|---|---|---|---|
| nginx--ngx_core_module--daemon | 通过 | 通过 |  |
| nginx--ngx_core_module--master_process | 通过 | 通过（复审 1） | 原退回已处理，见「复审 1」 |
| nginx--ngx_core_module--timer_resolution | 通过 | 通过 |  |
| nginx--ngx_core_module--pid | 通过 | 通过 |  |
| nginx--ngx_core_module--lock_file | 通过 | 通过 |  |
| nginx--ngx_core_module--worker_processes | 通过 | 通过（复审 1） | 原退回已处理，见「复审 1」 |
| nginx--ngx_core_module--debug_points | 通过 | 通过 |  |
| nginx--ngx_core_module--user | 通过 | 通过 |  |
| nginx--ngx_core_module--worker_priority | 通过 | 通过 |  |
| nginx--ngx_core_module--worker_cpu_affinity | 通过 | 通过 |  |
| nginx--ngx_core_module--worker_rlimit_nofile | 通过 | 通过 |  |
| nginx--ngx_core_module--worker_rlimit_core | 通过 | 通过 |  |
| nginx--ngx_core_module--worker_shutdown_timeout | 通过 | 通过 |  |
| nginx--ngx_core_module--working_directory | 通过 | 通过 |  |
| nginx--ngx_core_module--env | 通过 | 通过（复审 1） | 原退回已处理，见「复审 1」 |
| nginx--ngx_core_module--load_module | 通过 | 通过 |  |
| nginx--ngx_conf_module--include | 通过 | 通过 | 附注：「本站只记录该引用…」为项目范围说明，非源码陈述，不计入证据判定 |
| nginx--ngx_errlog_module--error_log | 通过 | 通过 |  |
| nginx--ngx_regex_module--pcre_jit | 通过 | 通过 |  |
| nginx--ngx_thread_pool_module--thread_pool | 通过 | 通过 |  |
| nginx--ngx_devpoll_module--devpoll_changes | 通过 | 通过 |  |
| nginx--ngx_devpoll_module--devpoll_events | 通过 | 通过 |  |
| nginx--ngx_epoll_module--epoll_events | 通过 | 通过 |  |
| nginx--ngx_epoll_module--worker_aio_requests | 通过 | 通过 |  |
| nginx--ngx_eventport_module--eventport_events | 通过 | 通过 |  |
| nginx--ngx_iocp_module--iocp_threads | 通过 | 通过 |  |
| nginx--ngx_iocp_module--post_acceptex | 通过 | 通过 |  |
| nginx--ngx_iocp_module--acceptex_read | 通过 | 通过 |  |
| nginx--ngx_kqueue_module--kqueue_changes | 通过 | 通过 |  |
| nginx--ngx_kqueue_module--kqueue_events | 通过 | 通过 |  |
| nginx--ngx_events_module--events | 通过 | 通过 |  |
| nginx--ngx_event_core_module--worker_connections | 通过 | 通过 |  |
| nginx--ngx_event_core_module--use | 通过 | 通过 |  |
| nginx--ngx_event_core_module--multi_accept | 通过 | 通过 |  |
| nginx--ngx_event_core_module--accept_mutex | 通过 | 通过 |  |
| nginx--ngx_event_core_module--accept_mutex_delay | 通过 | 通过 |  |
| nginx--ngx_event_core_module--debug_connection | 通过 | 通过 |  |
| nginx--ngx_openssl_module--ssl_engine | 通过 | 通过 |  |
| nginx--ngx_quic_bpf_module--quic_bpf | 通过 | 通过（复审 1） | 原退回已处理，见「复审 1」 |
| nginx--ngx_http_module--http | 通过 | 通过 |  |
| nginx--ngx_mail_module--mail | 通过 | 通过 |  |
| nginx--ngx_google_perftools_module--google_perftools_profiles | 通过 | 通过 |  |
| nginx--ngx_stream_module--stream | 通过 | 通过 |  |

## 退回清单

| ID | 字段 | 问题 | 应如何修正 |
|---|---|---|---|
| nginx--ngx_core_module--master_process | summary | 文字含「在 single 进程中运行事件循环」，引用的 implementation-1（nginx.c:379-386）只显示调用 `ngx_single_process_cycle`，该函数循环体（`ngx_process_events_and_timers`）未被任何片段覆盖；note 中「off 仍执行事件循环」同样无片段。 | 新增 evidence：`src/os/unix/ngx_process_cycle.c` 约 279-310（`ngx_single_process_cycle` 含 `for(;;)` 与 `ngx_process_events_and_timers`），加入 summary source_ids。 |
| nginx--ngx_core_module--worker_processes | summary | 「master 启动 worker 时使用此值」：worker-spawn 只见形参 `n`，`ccf->worker_processes` 传入的调用点不在已引用片段中。 | 在 summary source_ids 增加已有来源 `runtime-master-start`（ngx_process_cycle.c:128 起，含 `ngx_start_worker_processes(cycle, ccf->worker_processes, …)`）。 |
| nginx--ngx_core_module--env | summary | 「传给 worker 等子进程的新值」缺调用点：implementation-0（nginx.c:520-604）在数组填充循环中途结束，未含 `environ = env` 等写入；worker 初始化调用 `ngx_set_environment` 的片段也未引用（note 称「结果写入 environ」无片段）。 | 新增 evidence：nginx.c 约 604-650（环境数组填充与返回）以及 ngx_process_cycle.c 中 `ngx_worker_process_init` 调用 `ngx_set_environment(cycle, NULL)`（约 753-770）；或把 summary 收窄为片段能证明的范围。 |
| nginx--ngx_quic_bpf_module--quic_bpf | summary | 「支持 QUIC 连接迁移」不是片段直接陈述：summary-bpf-prog 只证明按 DCID 取 key 选 socket（不看客户端地址），summary-bpf-group 证明 enabled 才建 sockhash 并挂载；迁移语义是推断，note 自述为推断。ngx_event_quic_migration.c 的迁移处理与 BPF 无引用关系。 | 二选一：① corrections 把 summary 改为不含迁移的表述（如「…使 reuseport 监听组按 QUIC 包中的目的连接 ID 选择 socket」）；② 保留原文并将 summary_evidence 降为 `unverified`，note 写明「迁移一词仅见文档，源码仅证明按 DCID 路由」。 |

## 实施者疑点的判定

- **include 功能说明含「本站只记录该引用，不读取外部文件内容」**：判为通过。前半句「在实际 Nginx 配置解析时载入一个配置文件或匹配通配模式的文件」由 `ngx_conf_include`（单文件直接解析、含 `*?[` 时按 glob 逐个 `ngx_conf_parse`）直接支撑；后半句是本项目的范围声明，不是对 nginx 行为的陈述，不属于源码证据判据对象，note 已写明。若主线程希望 summary 全句均由源码支撑，需另行整体修订该范围声明，不应因此降级本条。
- **quic_bpf「支持连接迁移」**：判为退回，见上表。按判据，片段必须直接支撑每一句陈述，由 BPF 按 DCID 选 socket 推出迁移属推断。

## 附注（不退回，可酌情改进）

- worker_rlimit_core、working_directory 的 `summary-worker-init`（ngx_process_cycle.c:752-761）仅为 `ngx_worker_process_init` 函数头与局部变量声明，用以确认「worker 初始化时」；实质逻辑由 implementation-0 支撑。可接受，但片段价值有限。
- lock_file「支持原子操作的平台通常不用文件锁」：`summary-shmtx-atomic`（12-25）止于函数前半，需结合 `#else` 版 199-232 对照；实际 12-60 行表明原子版本不打开文件，结论属实。
- acceptex_read「off 时不设置预接收数据空间」依赖 `post_accept_buffer_size` 默认 0，片段未显示该初值，属轻微缺口，不影响通过。
- error_log 语法 `file [level]` 为简写（源码另接受 stderr、syslog:、memory:，级别处可多个 debug_*），未判错。
- 无「可晋级」项（本批无 unverified）。

## 计数

| 字段 | 通过 | 退回 |
|---|---|---|
| syntax | 43 | 0 |
| summary | 39 | 4（复审 1 后已处理，终态 43 / 0） |

## 构建检查

`node scripts/build.mjs --config project.config.json --check` 运行成功：B01 syntax_verified 43 / summary_verified 43 / entries 43（含其他批次共 67 个覆盖条目，总计 1041 条）。该检查只验证机械可核项，不能发现上述 4 条的语义缺口。

## 复审 1

范围：仅 master_process、worker_processes、env、quic_bpf 四条 summary。新增片段均按 release-1.27.1 与行号实际读取，行号无偏移。`--check` 运行成功（B01 43/43，总计覆盖条目数随其他批次变化）。

| ID | 判定 | 依据 |
|---|---|---|
| nginx--ngx_core_module--master_process | ADDRESSED | `summary-single-cycle`（ngx_process_cycle.c:279-311）含 `for ( ;; )` 内调用 `ngx_process_events_and_timers`，补上「single 进程运行事件循环」；与 implementation-0/1 的分派链衔接完整。 |
| nginx--ngx_core_module--worker_processes | ADDRESSED | 已有来源 `runtime-master-start`（ngx_process_cycle.c:128-132）含 `ngx_start_worker_processes(cycle, ccf->worker_processes, …)`；与 worker-spawn 的 `for (i < n)` spawn 衔接，调用链闭合。移除 runtime-single-entry 无损（该条不涉及 summary 陈述）。 |
| nginx--ngx_core_module--env | ADDRESSED | `summary-environ-write`（nginx.c:600-651）含 `ccf->environment = env; environ = env;`；`summary-worker-env-call`（ngx_process_cycle.c:752-766）在 `ngx_worker_process_init` 调用 `ngx_set_environment(cycle, NULL)`；`summary-exec-env`（nginx.c:714-718）为带 `&n` 的 exec 路径调用。三片段均直接支撑相应陈述。 |
| nginx--ngx_quic_bpf_module--quic_bpf | ADDRESSED | corrections 文字「启用 QUIC 的 eBPF 数据包路由，使 reuseport 监听组按 QUIC 包中的目的连接 ID 选择 socket。」：`enabled` 门控与 `SO_ATTACH_REUSEPORT_EBPF` 见 summary-bpf-group，按 DCID 取 key 调 `bpf_sk_select_reuseport` 见 summary-bpf-prog；仅删去迁移半句、将「QUIC 连接信息」具体为「目的连接 ID」，修改最小且均有源码依据，reason 如实说明。 |

新问题（均为轻微，不退回）：
- env 的 note 写「返回前写入 ccf->environment 与 environ」，实际仅在 `last == NULL` 时写入（exec 路径 `last != NULL` 不写）。summary 正文未受影响；建议 note 补「仅 last 为空时」。
- quic_bpf 删去迁移表述后，summary 对「未命中 key 或 DCID 过短时回退默认 reuseport 选择」未提及，属不完整而非错误，无需改写。
- 未发现新增片段 ID 冲突、source_ids 无法解析或其他条目被改动的情况。

复审后 summary 终态：通过 43、退回 0；syntax 仍为通过 43、退回 0。
