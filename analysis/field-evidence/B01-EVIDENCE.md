# B01 字段证据记录

范围：nginx 核心、事件、线程池、正则、OpenSSL 等全局模块及 http/stream/mail 块入口，共 43 条。固定 revision：nginx release-1.27.1（e06bdbd4…）。

## nginx--ngx_core_module--daemon

- 语法（`daemon on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，ngx_conf_set_flag_slot 仅接受 on/off，与语法一致。
- 功能：verified；source_ids：implementation-0, d340-create, d340-init
  - 判据：ccf->daemon 在 #if !(NGX_WIN32) 内决定是否调用 ngx_daemon，覆盖“非 Windows”限定；未配置默认值为 1。

## nginx--ngx_core_module--master_process

- 语法（`master_process on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，flag setter 仅接受 on/off。
- 功能：verified；source_ids：implementation-0, implementation-1, d340-init, summary-single-cycle
  - 判据：ccf->master 为真才把 ngx_process 置为 NGX_PROCESS_MASTER，否则走 ngx_single_process_cycle；该函数在本进程内 for(;;) 调用 ngx_process_events_and_timers，故 off 仍执行事件循环。
- 新增片段：summary-single-cycle（src/os/unix/ngx_process_cycle.c:279-311）

## nginx--ngx_core_module--timer_resolution

- 语法（`timer_resolution interval;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，msec setter 经 ngx_parse_time 解析时间值，对应 interval。
- 功能：verified；source_ids：implementation-0, implementation-1, d340-resolution-binding, summary-timer-signal, summary-timer-update
  - 判据：ccf->timer_resolution 赋给 ngx_timer_resolution：非零时不带 NGX_UPDATE_TIME，改由 setitimer/SIGALRM 置位 ngx_event_timer_alarm，事件等待返回后据此调用 ngx_time_update，故为缓存时间更新精度。
- 新增片段：summary-timer-signal（src/event/ngx_event.c:620-630）；summary-timer-update（src/event/modules/ngx_epoll_module.c:800-806）

## nginx--ngx_core_module--pid

- 语法（`pid file;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，str setter 取 value[1] 作为文件路径。
- 功能：verified；source_ids：implementation-0, implementation-1, runtime-pid-upgrade-rename, summary-signal
  - 判据：ccf->pid 经 init_conf 展开为完整路径并据此构造 oldpid；启动时 ngx_create_pidfile 使用，-s 信号控制经 ngx_signal_process 读取该文件，升级时重命名 pid 与 oldpid。
- 新增片段：summary-signal（src/core/ngx_cycle.c:1083-1101）

## nginx--ngx_core_module--lock_file

- 语法（`lock_file file;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，str setter 取 value[1] 作为文件名。
- 功能：verified；source_ids：implementation-0, summary-shmtx-atomic, summary-shmtx-file, summary-accept-mutex-create
  - 判据：ccf->lock_file 经 init_conf 拼上 .accept 得到 cycle->lock_file，传给 ngx_shmtx_create；有原子操作时（NGX_HAVE_ATOMIC_OPS）不使用该名称，否则才以它打开文件锁。原子版 ngx_shmtx_create 全文在 src/core/ngx_shmtx.c:12-43：`git -C repos/nginx show e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928:src/core/ngx_shmtx.c | sed -n '18,43p' | grep -n -w name` 只命中第 19 行形参 name，函数体 `sed -n '21,42p' | grep -n -w name` 命中 0。
- 新增片段：summary-shmtx-atomic（src/core/ngx_shmtx.c:12-43，裁定回查由 12-25 扩至函数结束）；summary-shmtx-file（src/core/ngx_shmtx.c:199-232）；summary-accept-mutex-create（src/event/ngx_event.c:583-588）

## nginx--ngx_core_module--worker_processes

- 语法（`worker_processes number | auto;`）：verified；source_ids：registration, configuration-definition, number-parser
  - 判据：注册为 NGX_CONF_TAKE1，ngx_set_worker_processes 接受字面 auto 或经 ngx_atoi 解析的整数。
- 功能：verified；source_ids：worker-entry, worker-default, worker-spawn, runtime-master-start
  - 判据：解析值写入 ccf->worker_processes，auto 取 ngx_ncpu，未配置默认为 1；ngx_master_process_cycle 以 ccf->worker_processes 调用 ngx_start_worker_processes，后者循环 n 次 ngx_spawn_process。

## nginx--ngx_core_module--debug_points

- 语法（`debug_points abort | stop;`）：verified；source_ids：registration, configuration-definition, syntax-values
  - 判据：注册为 NGX_CONF_TAKE1，enum setter 按 syntax-values 取值表只接受 stop、abort，与 abort | stop 一致。
- 功能：verified；source_ids：implementation-0
  - 判据：ccf->debug_points 在 ngx_debug_point 中分派：STOP 为 raise(SIGSTOP)，ABORT 为 ngx_abort。
- 新增片段：syntax-values（src/core/nginx.c:35-39）

## nginx--ngx_core_module--user

- 语法（`user user [group];`）：verified；source_ids：registration, implementation-0
  - 判据：注册为 NGX_CONF_TAKE12；ngx_set_user 取 value[1] 为用户，nelts==2 时组名取同名，否则取 value[2]。
- 功能：verified；source_ids：implementation-0, implementation-1, runtime-patch, summary-ccf-get
  - 判据：解析出的 uid/gid 在 worker 初始化（geteuid()==0）时 setgid/setuid；补丁令特权代理进程不降权，故仅作用于普通 worker。此处 ccf 在 ngx_worker_process_init 第 768 行由 ngx_get_conf 取得；runtime-patch 里的 ngx_get_conf 属于特权代理函数，不是这一处 ccf。
- 新增片段：summary-ccf-get（src/os/unix/ngx_process_cycle.c:768-768）

## nginx--ngx_core_module--worker_priority

- 语法（`worker_priority number;`）：verified；source_ids：registration, implementation-0
  - 判据：注册为 NGX_CONF_TAKE1；ngx_set_priority 接受可带 +/- 前缀的整数。
- 功能：verified；source_ids：implementation-0, implementation-1, summary-ccf-get
  - 判据：ccf->priority 在 worker（worker >= 0）初始化时传给 setpriority(PRIO_PROCESS)。ccf 在同函数第 768 行由 ngx_get_conf 取得后，第 770 行才读取 ccf->priority。
- 新增片段：summary-ccf-get（src/os/unix/ngx_process_cycle.c:768-768）

## nginx--ngx_core_module--worker_cpu_affinity

- 语法（`worker_cpu_affinity cpumask ...; / worker_cpu_affinity auto [cpumask];`）：verified；source_ids：registration, implementation-0
  - 判据：注册为 NGX_CONF_1MORE；ngx_set_cpu_affinity 逐项解析 0/1 掩码，auto 后至多再接一个掩码（nelts>3 报错），对应两种写法。
- 功能：verified；source_ids：implementation-0, implementation-1, affinity-getter-empty, affinity-getter-platform
  - 判据：掩码或 auto 写入 ccf->cpu_affinity，worker 初始化时经 ngx_get_cpu_affinity 取出并 ngx_setaffinity；auto 的可附掩码限制选择范围。

## nginx--ngx_core_module--worker_rlimit_nofile

- 语法（`worker_rlimit_nofile number;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，num setter 经 ngx_atoi 解析整数。
- 功能：verified；source_ids：implementation-0, runtime-nofile-init
  - 判据：ccf->rlimit_nofile 在 ngx_worker_process_init 中同时设为 setrlimit(RLIMIT_NOFILE) 的软、硬限制。

## nginx--ngx_core_module--worker_rlimit_core

- 语法（`worker_rlimit_core size;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，off setter 经 ngx_parse_offset 解析大小。
- 功能：verified；source_ids：implementation-0, summary-worker-init, summary-ccf-get
  - 判据：ccf->rlimit_core 在 ngx_worker_process_init 中设为 setrlimit(RLIMIT_CORE) 的软、硬限制。ccf 在同函数第 768 行由 ngx_get_conf 取得后才读取该字段。
- 新增片段：summary-worker-init（src/os/unix/ngx_process_cycle.c:752-761）；summary-ccf-get（src/os/unix/ngx_process_cycle.c:768-768）

## nginx--ngx_core_module--worker_shutdown_timeout

- 语法（`worker_shutdown_timeout time;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，msec setter 解析时间。
- 功能：verified；source_ids：implementation-0, summary-quit
  - 判据：ccf->shutdown_timeout 在 worker 收到 quit 优雅退出时由 ngx_set_shutdown_timer 启动定时器，到期处理函数对非监听连接置 close/error 并调用读事件处理。
- 新增片段：summary-quit（src/os/unix/ngx_process_cycle.c:728-741）

## nginx--ngx_core_module--working_directory

- 语法（`working_directory directory;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，str setter 取 value[1]。
- 功能：verified；source_ids：implementation-0, summary-worker-init, summary-ccf-get
  - 判据：ccf->working_directory 非空时在 ngx_worker_process_init 中 chdir；失败则 exit(2)。ccf 在同函数第 768 行由 ngx_get_conf 取得后才读取该字段。
- 新增片段：summary-worker-init（src/os/unix/ngx_process_cycle.c:752-761）；summary-ccf-get（src/os/unix/ngx_process_cycle.c:768-768）

## nginx--ngx_core_module--env

- 语法（`env variable[=value];`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_set_env 保存 value[1]，遇 = 时把名称长度截到 = 前，对应 variable[=value]。
- 功能：verified；source_ids：implementation-0, implementation-1, summary-environ-write, summary-worker-env-call, summary-exec-env
  - 判据：env 数组由 ngx_set_environment 构造：含 = 的项作为新值，无 = 的项从 ngx_os_environ 取父进程值；返回前写入 ccf->environment 与 environ；ngx_worker_process_init 调用它，新二进制 exec 也调用它。
- 新增片段：summary-environ-write（src/core/nginx.c:600-651）；summary-worker-env-call（src/os/unix/ngx_process_cycle.c:752-766）；summary-exec-env（src/core/nginx.c:714-718）

## nginx--ngx_core_module--load_module

- 语法（`load_module file;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_load_module 取 value[1] 作文件并 ngx_conf_full_name。
- 功能：verified；source_ids：implementation-0
  - 判据：ngx_load_module 在 modules_used 前 dlopen 文件，读 ngx_modules/ngx_module_names 并逐个 ngx_add_module；与 include 无关。

## nginx--ngx_conf_module--include

- 语法（`include file | mask;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_ANY_CONF|NGX_CONF_TAKE1；ngx_conf_include 取 value[1]，含 *?[ 时按通配展开，否则按单文件解析。
- 功能：verified；source_ids：implementation-0, include-parse-context
  - 判据：ngx_conf_include 对单文件或 glob 命中的每个文件调用 ngx_conf_parse。“本站只记录该引用”是本项目范围说明，不是源码陈述。

## nginx--ngx_errlog_module--error_log

- 语法（`error_log file [level];`）：verified；source_ids：registration, configuration-definition, implementation-0, syntax-levels
  - 判据：注册为 NGX_MAIN_CONF|NGX_CONF_1MORE；ngx_log_set_log 的 value[1] 可为文件、stderr、syslog:、memory:，ngx_log_set_levels 处理其后级别（无则 error，可带多个 debug_*），与 file [level] 一致且更宽。
- 功能：verified；source_ids：implementation-0, cycle-log-default, log-file-list
  - 判据：ngx_log_set_log 按 stderr/memory:/syslog:/文件分支建立目的地（memory 仅 NGX_DEBUG 构建），级别由 ngx_log_set_levels 设置。
- 新增片段：syntax-levels（src/core/ngx_log.c:478-538）

## nginx--ngx_regex_module--pcre_jit

- 语法（`pcre_jit on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，flag setter 仅接受 on/off。
- 功能：verified；source_ids：implementation-0, implementation-1
  - 判据：ccf pcre_jit 为真时对 studies 中已收集的正则调用 pcre2_jit_compile 或 PCRE_STUDY_JIT_COMPILE，post 处理在库不支持时置 0。

## nginx--ngx_thread_pool_module--thread_pool

- 语法（`thread_pool name threads=number [max_queue=number];`）：verified；source_ids：registration, implementation-0
  - 判据：注册为 NGX_CONF_TAKE23；ngx_thread_pool 取 value[1] 为名称，其后逐项解析 threads= 与 max_queue=，缺 threads 报错。
- 功能：verified；source_ids：implementation-0, implementation-1, d340-init, summary-aio-threads
  - 判据：threads 与 max_queue（默认 65536）写入线程池；队列满时 ngx_thread_task_post 报 queue overflow 返回 NGX_ERROR；aio threads 通过 ngx_thread_pool_add 按名引用。
- 新增片段：summary-aio-threads（src/http/ngx_http_core_module.c:4750-4790）

## nginx--ngx_devpoll_module--devpoll_changes

- 语法（`devpoll_changes number;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，num setter 解析整数。
- 功能：verified；source_ids：implementation-0, implementation-1, summary-dpcf-get
  - 判据：dpcf->changes 决定 change_list 容量；写满或 NGX_CLOSE_EVENT 时整批 write(/dev/poll)。dpcf 在 ngx_devpoll_init 第 123 行由 ngx_event_get_conf 取得后才读取该字段。
- 新增片段：summary-dpcf-get（src/event/modules/ngx_devpoll_module.c:123-123）

## nginx--ngx_devpoll_module--devpoll_events

- 语法（`devpoll_events number;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，num setter 解析整数。
- 功能：verified；source_ids：implementation-0, implementation-1, summary-dpcf-get
  - 判据：dpcf->events 决定 event_list 容量并赋给 nevents，作为 DP_POLL 的 dp_nfds。dpcf 在 ngx_devpoll_init 第 123 行由 ngx_event_get_conf 取得后才读取该字段。
- 新增片段：summary-dpcf-get（src/event/modules/ngx_devpoll_module.c:123-123）

## nginx--ngx_epoll_module--epoll_events

- 语法（`epoll_events number;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，num setter 解析整数。
- 功能：verified；source_ids：implementation-0, implementation-1, summary-epcf-get
  - 判据：epcf->events 决定 event_list 容量和 nevents，传给 epoll_wait 的 maxevents。epcf 在 ngx_epoll_init 第 327 行由 ngx_event_get_conf 取得后才读取该字段。
- 新增片段：summary-epcf-get（src/event/modules/ngx_epoll_module.c:327-327）

## nginx--ngx_epoll_module--worker_aio_requests

- 语法（`worker_aio_requests number;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，num setter 解析整数。
- 功能：verified；source_ids：implementation-0, d340-aio-gate, summary-platform-linux, summary-file-aio-gate, summary-epcf-get
  - 判据：epcf->aio_requests 在 NGX_HAVE_FILE_AIO 下由 ngx_epoll_aio_init 传给 io_setup；epoll 模块与 Linux AIO 的构建条件见平台片段。epcf 在 ngx_epoll_init 第 327 行由 ngx_event_get_conf 取得，并在第 345 行传给 ngx_epoll_aio_init。
- 新增片段：summary-platform-linux（auto/os/linux:52-56）；summary-file-aio-gate（auto/unix:583-603）；summary-epcf-get（src/event/modules/ngx_epoll_module.c:327-327）

## nginx--ngx_eventport_module--eventport_events

- 语法（`eventport_events number;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，num setter 解析整数。
- 功能：verified；source_ids：implementation-0, implementation-1, summary-platform-solaris, summary-epcf-get
  - 判据：epcf->events 决定 event_list 容量和 nevents，传给 port_getn；auto/os/solaris 仅在探测到 event ports 时编入该模块，覆盖 Solaris 限定。epcf 在 ngx_eventport_init 第 218 行由 ngx_event_get_conf 取得后才读取该字段。
- 新增片段：summary-platform-solaris（auto/os/solaris:49-61）；summary-epcf-get（src/event/modules/ngx_eventport_module.c:218-218）

## nginx--ngx_iocp_module--iocp_threads

- 语法（`iocp_threads number;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，num setter 解析整数。
- 功能：verified；source_ids：implementation-0, summary-platform-win32
  - 判据：cf->threads 直接作为 CreateIoCompletionPort 的 NumberOfConcurrentThreads；IOCP 模块由 auto/os/win32 编入，覆盖 Windows 限定。否定陈述检索：`git -C repos/nginx grep -n -w threads e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`，范围是该锁定 revision 全目录，命中 48 处：auto/configure:62，auto/lib/openssl/make:67，auto/lib/openssl/makefile.msvc:9，auto/options:217，auto/options:453，auto/summary:11，auto/threads:10，docs/xml/nginx/changes.xml:5611、5616、6037、6041、6216、6221、17283、20534、21982、22894、23324、24725，src/core/ngx_connection.h:66，src/core/ngx_thread_pool.c:38、156、183、430、439、470、480、482、484、486、507、509，src/core/ngx_times.c:16，src/event/modules/ngx_iocp_module.c:34、117、361、374，src/event/modules/ngx_iocp_module.h:13，src/event/ngx_event.h:121，src/http/modules/ngx_http_userid_filter_module.c:577，src/http/ngx_http_copy_filter_module.c:334、347，src/http/ngx_http_core_module.c:4741、4793，src/http/ngx_http_upstream.c:3991、4004，src/os/unix/ngx_linux_sendfile_chain.c:216，src/os/win32/ngx_process_cycle.c:701。其中 iocp 字段只出现在 ngx_iocp_module.c:34（注册偏移）、117（CreateIoCompletionPort 的 cf->threads）、361（置 UNSET）、374（init 为 0）与 ngx_iocp_module.h:13；ngx_event.h:121 只是注释。其余命中属于 thread pool、aio threads、构建选项或文档，不读取 iocp 的 cf->threads。`git -C repos/nginx grep -n CreateThread e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928` 全目录命中 src/event/ngx_event_connectex.c:71、76、80 与 src/os/win32/ngx_thread.c:19、28。ngx_iocp_new_thread 定义在 connectex.c:63，调用点 53（参数 1）与 159（参数 0），均不读取 cf->threads。
- 新增片段：summary-platform-win32（auto/os/win32:34-39）。裁定回查未再新增片段，只在 note 写明全目录检索。

## nginx--ngx_iocp_module--post_acceptex

- 语法（`post_acceptex number;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，num setter 解析整数。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, summary-iocp-gate, summary-repost
  - 判据：iocpcf->post_acceptex 在 #if NGX_WIN32 且 NGX_USE_IOCP_EVENT 时作为每个监听项初始 ngx_event_post_acceptex 的次数；接收完成后另以 1 补投递。
- 新增片段：summary-iocp-gate（src/event/ngx_event.c:856-880）；summary-repost（src/event/ngx_event_acceptex.c:79-79）

## nginx--ngx_iocp_module--acceptex_read

- 语法（`acceptex_read on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，flag setter 仅接受 on/off。
- 功能：verified；source_ids：implementation-0, implementation-1
  - 判据：#if NGX_WIN32 内 acceptex_read 为真时 post_accept_buffer_size 取 client_header_buffer_size，并传给 AcceptEx；off 时保持 0。

## nginx--ngx_kqueue_module--kqueue_changes

- 语法（`kqueue_changes number;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，num setter 解析整数。
- 功能：verified；source_ids：implementation-0, summary-kcf-get
  - 判据：kcf->changes 决定 change_list 容量，变更列表在 process_events 中经 kevent 一次提交。kcf 在 ngx_kqueue_init 第 125 行由 ngx_event_get_conf 取得后才读取该字段。
- 新增片段：summary-kcf-get（src/event/modules/ngx_kqueue_module.c:125-125）

## nginx--ngx_kqueue_module--kqueue_events

- 语法（`kqueue_events number;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，num setter 解析整数。
- 功能：verified；source_ids：implementation-0, implementation-1, summary-kcf-get
  - 判据：kcf->events 决定 event_list 容量和 nevents，传给 kevent 的 nevents。kcf 在 ngx_kqueue_init 第 125 行由 ngx_event_get_conf 取得后才读取该字段。
- 新增片段：summary-kcf-get（src/event/modules/ngx_kqueue_module.c:125-125）

## nginx--ngx_events_module--events

- 语法（`events { ... }`）：verified；source_ids：registration, syntax-block-args, syntax-arg-table, syntax-flags, events-single-init
  - 判据：注册为 NGX_CONF_BLOCK|NGX_CONF_NOARGS；ngx_conf_handler 要求以 { 结束且参数个数为 NOARGS，块内由 ngx_events_block 调 ngx_conf_parse。
- 功能：verified；source_ids：implementation-0, events-required
  - 判据：ngx_events_block 创建各事件模块 create_conf，在 NGX_EVENT_CONF 上下文解析块，随后逐个 init_conf；缺块时 ngx_event_init_conf 报错。
- 新增片段：syntax-block-args（src/core/ngx_conf_file.c:395-443）；syntax-arg-table（src/core/ngx_conf_file.c:50-59）；syntax-flags（src/core/ngx_conf_file.h:22-46）

## nginx--ngx_event_core_module--worker_connections

- 语法（`worker_connections number;`）：verified；source_ids：registration, connections-entry, number-parser
  - 判据：注册为 NGX_CONF_TAKE1；ngx_event_connections 经 ngx_atoi 解析整数。
- 功能：verified；source_ids：connections-entry, connections-default-constant, event-defaults, runtime-pool-arrays, client-connection, upstream-connection
  - 判据：值写入 ecf->connections 与 cycle->connection_n，默认 512，按其分配 connections/read_events/write_events；客户端与上游连接都从该池取。

## nginx--ngx_event_core_module--use

- 语法（`use method;`）：verified；source_ids：registration, configuration-definition, implementation-0
  - 判据：注册为 NGX_CONF_TAKE1；ngx_event_use 按 value[1] 与已编入事件模块名匹配，不匹配报 invalid event type。
- 功能：verified；source_ids：implementation-0, implementation-1
  - 判据：只在 cycle->modules 中已有的事件模块里选取；未配置时按编入的 epoll/kqueue/select 等自动选择，不会加载缺失模块。

## nginx--ngx_event_core_module--multi_accept

- 语法（`multi_accept on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，flag setter 仅接受 on/off。
- 功能：verified；source_ids：accept-available, accept-errors, accept-loop, runtime-accept-entry, runtime-accept-resource-errors, event-defaults
  - 判据：非 kqueue 时 ev->available 取 ecf->multi_accept，do-while 以其决定继续接收；EAGAIN 退出，ECONNABORTED 视 available 继续；默认 0。

## nginx--ngx_event_core_module--accept_mutex

- 语法（`accept_mutex on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，flag setter 仅接受 on/off。
- 功能：verified；source_ids：mutex-conditions, mutex-loop, mutex-lock, mutex-disable, event-defaults
  - 判据：ngx_use_accept_mutex 需 ccf->master、worker_processes>1 且 ecf->accept_mutex，Windows 强制关闭；取得锁时启用接收事件，失去锁时 ngx_disable_accept_events；默认 0。

## nginx--ngx_event_core_module--accept_mutex_delay

- 语法（`accept_mutex_delay time;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，msec setter 解析时间。
- 功能：verified；source_ids：mutex-wait, accept-retry, event-defaults, summary-mutex-assign, summary-accept-ecf
  - 判据：ecf->accept_mutex_delay 赋给 ngx_accept_mutex_delay，未取得锁时限制 timer 上限；EMFILE/ENFILE 且无锁时作为 ngx_add_timer 超时；默认 500ms。该赋值在 ngx_event.c 第 652 行，其前第 647 行 ngx_event_get_conf 取得 ecf；accept 路径的 ecf 在 ngx_event_accept.c 第 45 行另取。
- 新增片段：summary-mutex-assign（src/event/ngx_event.c:646-652）；summary-accept-ecf（src/event/ngx_event_accept.c:45-45）

## nginx--ngx_event_core_module--debug_connection

- 语法（`debug_connection address | CIDR | unix:;`）：verified；source_ids：registration, configuration-definition, implementation-0
  - 判据：注册为 NGX_CONF_TAKE1；ngx_event_debug_connection 依次处理 unix:、CIDR（ngx_ptocidr）与主机名解析。
- 功能：verified；source_ids：implementation-0, implementation-1, summary-accept-ecf, summary-debug-call
  - 判据：命中的 CIDR/地址写入 ecf->debug_connection；连接接收时 ngx_debug_accepted_connection 匹配后设 NGX_LOG_DEBUG_CONNECTION|ALL；未 --with-debug 则忽略。调用方 ngx_event_accept 第 45 行取得 ecf，第 289 行调用 ngx_debug_accepted_connection(ecf, c)。
- 新增片段：summary-accept-ecf（src/event/ngx_event_accept.c:45-45）；summary-debug-call（src/event/ngx_event_accept.c:289-289）

## nginx--ngx_openssl_module--ssl_engine

- 语法（`ssl_engine device;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_openssl_engine 取 value[1] 作 ENGINE_by_id 的标识。
- 功能：verified；source_ids：implementation-0
  - 判据：ngx_openssl_engine 对 value[1] 调 ENGINE_by_id，再 ENGINE_set_default(ENGINE_METHOD_ALL)。

## nginx--ngx_quic_bpf_module--quic_bpf

- 语法（`quic_bpf on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，flag setter 仅接受 on/off。
- 功能：verified；source_ids：implementation-0, summary-bpf-group, summary-bpf-prog
  - 判据：bcf->enabled 为真时才为 reuseport QUIC 监听建立 sockhash 并以 SO_ATTACH_REUSEPORT_EBPF 附加程序；程序 ngx_quic_select_socket_by_dcid 取包内 DCID 前 8 字节为 key 调 bpf_sk_select_reuseport。连接迁移语义仅见文档，已从文字中删去。
- 新增片段：summary-bpf-group（src/event/quic/ngx_event_quic_bpf.c:295-350）；summary-bpf-prog（src/event/quic/bpf/ngx_quic_reuseport_helper.c:73-131）

## nginx--ngx_http_module--http

- 语法（`http { ... }`）：verified；source_ids：registration, syntax-block-args, syntax-arg-table, syntax-flags, http-block-context
  - 判据：注册为 NGX_CONF_BLOCK|NGX_CONF_NOARGS；ngx_http_block 内调用 ngx_conf_parse 解析块内容。
- 功能：verified；source_ids：implementation-0, implementation-1, http-server-merge, summary-http-parse, summary-http-tail
  - 判据：ngx_http_block 创建各 HTTP 模块配置、解析块、合并 server/location、建 location 树，再 ngx_http_init_phases/phase_handlers。
- 新增片段：syntax-block-args（src/core/ngx_conf_file.c:395-443）；syntax-arg-table（src/core/ngx_conf_file.c:50-59）；syntax-flags（src/core/ngx_conf_file.h:22-46）；summary-http-parse（src/http/ngx_http.c:235-243）；summary-http-tail（src/http/ngx_http.c:316-339）

## nginx--ngx_mail_module--mail

- 语法（`mail { ... }`）：verified；source_ids：registration, syntax-block-args, syntax-arg-table, syntax-flags, d340-setter
  - 判据：注册为 NGX_CONF_BLOCK|NGX_CONF_NOARGS；ngx_mail_block 内调用 ngx_conf_parse 解析块内容。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2
  - 判据：ngx_mail_block 创建各 mail 模块 main/srv 配置、解析块、逐 server 合并，再 ngx_mail_add_ports/optimize_servers 整理监听。
- 新增片段：syntax-block-args（src/core/ngx_conf_file.c:395-443）；syntax-arg-table（src/core/ngx_conf_file.c:50-59）；syntax-flags（src/core/ngx_conf_file.h:22-46）

## nginx--ngx_google_perftools_module--google_perftools_profiles

- 语法（`google_perftools_profiles file;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，str setter 取 value[1]。
- 功能：verified；source_ids：implementation-0
  - 判据：ngx_google_perftools_worker（init process）以 "%V.%d" 拼接前缀与 ngx_pid 调 ProfilerStart。

## nginx--ngx_stream_module--stream

- 语法（`stream { ... }`）：verified；source_ids：registration, syntax-block-args, syntax-arg-table, syntax-flags, stream-context-create
  - 判据：注册为 NGX_CONF_BLOCK|NGX_CONF_NOARGS；ngx_stream_block 内调用 ngx_conf_parse 解析块内容。
- 功能：verified；source_ids：stream-context-create, stream-server-merge, summary-stream-parse, summary-stream-tail
  - 判据：ngx_stream_block 创建各 Stream 模块配置、解析块、逐 server 合并，再 init_phases、postconfiguration、init_phase_handlers 与 optimize_servers。
- 新增片段：syntax-block-args（src/core/ngx_conf_file.c:395-443）；syntax-arg-table（src/core/ngx_conf_file.c:50-59）；syntax-flags（src/core/ngx_conf_file.h:22-46）；summary-stream-parse（src/stream/ngx_stream.c:187-196）；summary-stream-tail（src/stream/ngx_stream.c:242-274）

## 修正

- nginx--ngx_quic_bpf_module--quic_bpf（summary）：改为“启用 QUIC 的 eBPF 数据包路由，使 reuseport 监听组按 QUIC 包中的目的连接 ID 选择 socket。”理由：“支持 QUIC 连接迁移”在锁定源码片段中无直接陈述，仅见文档，收窄到 summary-bpf-prog 与 summary-bpf-group 能证明的范围。
