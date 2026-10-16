# nginx 117项默认值与继承实施证据

依据固定manifest及DEFAULTS_340_PLAN执行，只补component=nginx的目标字段；不改其他组件、既有verified字段和历史发布。本文记录实施核对，不替代主线程独立审核、build、测试或浏览器验收。

固定来源：nginx `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`；OpenResty `8c37412c31621225e7aa7e825b5b50106c9c71c4`；文档 `e8b581903e9d41252720053311cea687a5671674`。已在本次创建的隔离副本按冻结audit顺序实际回放34项有效补丁，逐个核对47个最终文件SHA-256；未改第三方原仓库。逐项结构化记录见 `analysis/defaults-340-nginx-facts.json`。

已落盘117个身份、207个目标字段；目标字段未核实数为0。实施完成，等待主线程独立审核与发布保护验收；不代表审核、构建或运行验收已完成。原evidence顺序及ID保留；新增源码ID逐项追加到patch_status.source_ids，status/note及旧ids保持。没有新增README证据，不触发documentation默认推导变化。

## nginx--ngx_core_module--daemon

- `defaults`：`verified`；on；create 设置未配置哨兵，init_conf 将未设置值初始化为 1。 来源：`d340-create`、`d340-init`。
- `inheritance`：`not_applicable`；仅 main 的全局开关，不存在父子配置层合并；显式值取代未配置哨兵。 来源：`registration`、`d340-create`。

注册与setter：`ngx_conf_set_flag_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1026–1062；`d340-create` → nginx/src/core/nginx.c:1094–1115；`d340-init` → nginx/src/core/nginx.c:1143–1144。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_core_module--master_process

- `defaults`：`verified`；on；未配置时 master 初始化为 1。 来源：`d340-create`、`d340-init`。
- `inheritance`：`not_applicable`；仅 main 的全局进程模式开关，没有 HTTP/stream 层级继承。 来源：`registration`、`d340-create`。

注册与setter：`ngx_conf_set_flag_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1026–1062；`d340-create` → nginx/src/core/nginx.c:1094–1115；`d340-init` → nginx/src/core/nginx.c:1143–1144。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_core_module--timer_resolution

- `defaults`：`verified`；0ms；不启用固定间隔的时间更新定时器，事件处理采用未设置分辨率的路径。 来源：`d340-create`、`d340-init`、`d340-use`、`implementation-1`、`d340-resolution-binding`。
- `inheritance`：`not_applicable`；仅 main；同一 cycle 使用一个 timer_resolution，没有父子层级合并。 来源：`registration`、`d340-create`。

注册与setter：`ngx_conf_set_msec_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1260–1287；`d340-create` → nginx/src/core/nginx.c:1116–1117；`d340-init` → nginx/src/core/nginx.c:1145–1146；`d340-use` → nginx/src/event/ngx_event.c:200–217；`d340-resolution-binding` → nginx/src/event/ngx_event.c:510–512。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。A03修复：defaults复用implementation-1初始化门控，并追加ccf至ngx_timer_resolution赋值来源；不改正文或inheritance。

## nginx--ngx_core_module--lock_file

- `defaults`：`verified`；非 Windows 未配置时采用构建时 NGX_LOCK_PATH；未传 --lock-path 时为 logs/nginx.lock，并以运行前缀补全相对路径。Windows 不执行此锁文件初始化分支。 来源：`d340-lock-init`、`d340-build-path`、`d340-lock-platform`。
- `inheritance`：`not_applicable`；仅 main，无父子配置层继承；重载时若旧 cycle 已有锁文件前缀，继续使用旧前缀，新的不同设置会被忽略。 来源：`registration`、`d340-lock-init`。

注册与setter：`ngx_conf_set_str_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1066–1089；`d340-create` → nginx/src/core/nginx.c:1094–1112；`d340-lock-init` → nginx/src/core/nginx.c:1215–1261；`d340-build-path` → nginx/auto/options:620–625；`d340-lock-platform` → nginx/src/core/nginx.c:1186–1216。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。A02修复：追加覆盖#if !(NGX_WIN32)至锁文件缺省分支的来源，不改旧锚点。

## nginx--ngx_core_module--debug_points

- `defaults`：`verified`；不启用 abort 或 stop 调试动作；未配置时 debug_points 初始化为 0。 来源：`d340-create`、`d340-init`、`d340-use`。
- `inheritance`：`not_applicable`；仅 main 的调试动作设置，不存在父子层级继承。 来源：`registration`、`d340-create`。

注册与setter：`ngx_conf_set_enum_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1352–1385；`d340-create` → nginx/src/core/nginx.c:1119–1123；`d340-init` → nginx/src/core/nginx.c:1148–1149；`d340-use` → nginx/src/os/unix/ngx_process.c:612–631。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_core_module--user

- `defaults`：`verified`；非 Windows 且以 root 运行时，未配置则查询构建时 NGX_USER/NGX_GROUP 对应的 UID/GID；未传构建参数时用户为 nobody，组按构建探测选 nobody 或 nogroup。此处指普通 worker；补丁使 privileged agent 保持 master 权限。非 root 不切换身份；Windows 的 user 指令被忽略。 来源：`d340-user-init`、`d340-build-user`、`d340-setter`、`d340-user-use`、`runtime-patch`。
- `inheritance`：`not_applicable`；仅 main 的全局 worker 身份，没有父子配置层继承；显式 user 未写 group 时使用与 user 同名的组，不能把该规则套到构建默认组。 来源：`registration`、`d340-setter`。

注册与setter：`ngx_set_user`；新增锚点：`d340-setter` → nginx/src/core/nginx.c:1268–1327；`d340-create` → nginx/src/core/nginx.c:1125–1135；`d340-user-init` → nginx/src/core/nginx.c:1186–1212；`d340-build-user` → nginx/auto/unix:1–29；`d340-user-use` → nginx/src/os/unix/ngx_process_cycle.c:799–836。

补丁：d340-user-use 受相关实际补丁修改，按结构化记录及原补丁ID核对。普通worker身份分支与privileged agent例外均已核对原runtime-patch；保持原verified_affected及note。

## nginx--ngx_core_module--worker_priority

- `defaults`：`verified`；0；配置结构清零，worker 初始化只在非零时调用 setpriority，因此未配置不主动改变继承自进程环境的调度优先级。 来源：`d340-create`、`d340-use`。
- `inheritance`：`not_applicable`；仅 main 的 worker 优先级设置，无父子配置层合并。 来源：`registration`、`d340-create`。

注册与setter：`ngx_set_priority`；新增锚点：`d340-setter` → nginx/src/core/nginx.c:1361–1397；`d340-create` → nginx/src/core/nginx.c:1094–1112；`d340-use` → nginx/src/os/unix/ngx_process_cycle.c:768–775。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_core_module--worker_rlimit_core

- `defaults`：`verified`；不主动修改 RLIMIT_CORE；rlimit_core 保持 NGX_CONF_UNSET，worker 仅在显式配置后调用 setrlimit，实际限额沿用进程环境。 来源：`d340-create`、`d340-use`。
- `inheritance`：`not_applicable`；仅 main，无配置父子层继承；操作系统进程资源限额的继承不等于 Nginx 配置层级继承。 来源：`registration`、`d340-create`。

注册与setter：`ngx_conf_set_off_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1229–1256；`d340-create` → nginx/src/core/nginx.c:1119–1123；`d340-use` → nginx/src/os/unix/ngx_process_cycle.c:788–797。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_core_module--worker_shutdown_timeout

- `defaults`：`verified`；0ms；不安装用于到期关闭连接的 worker 优雅退出定时器。 来源：`d340-init`、`d340-use`。
- `inheritance`：`not_applicable`；仅 main 的全局退出超时，无父子配置层合并。 来源：`registration`、`d340-create`。

注册与setter：`ngx_conf_set_msec_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1260–1287；`d340-create` → nginx/src/core/nginx.c:1116–1117；`d340-init` → nginx/src/core/nginx.c:1145–1146；`d340-use` → nginx/src/core/ngx_cycle.c:1423–1437。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_core_module--working_directory

- `defaults`：`verified`；不指定新工作目录；结构清零使 working_directory.len 为 0，worker 跳过 chdir，保留当时的工作目录。 来源：`d340-create`、`d340-use`。
- `inheritance`：`not_applicable`；仅 main；没有配置层级继承，进程当前目录的沿用不属于父子配置合并。 来源：`registration`、`d340-create`。

注册与setter：`ngx_conf_set_str_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1066–1089；`d340-create` → nginx/src/core/nginx.c:1094–1112；`d340-use` → nginx/src/os/unix/ngx_process_cycle.c:872–880。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_core_module--env

- `defaults`：`verified`；未声明 env 时仅默认保留父进程的 TZ（若存在）；并非自动复制父进程全部环境变量。显式 env 可追加变量或设置值，未列出 TZ 时仍自动补入 TZ。 来源：`d340-create`、`d340-environment`。
- `inheritance`：`not_applicable`；仅 main 的变量列表；同一层多条 env 追加到同一数组，没有 HTTP/stream 父子配置继承。变量名形式从原始进程环境取值，name=value 形式使用显式值。 来源：`registration`、`d340-setter`、`d340-environment`。

注册与setter：`ngx_set_env`；新增锚点：`d340-setter` → nginx/src/core/nginx.c:1331–1357；`d340-create` → nginx/src/core/nginx.c:1128–1135；`d340-environment` → nginx/src/core/nginx.c:520–652。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_core_module--load_module

- `defaults`：`verified`；未配置时不会通过本指令加载动态模块；编译进可执行文件的模块由 cycle 模块初始化单独加入，不是 load_module 的默认参数。 来源：`registration`、`d340-setter`、`d340-static-modules`。
- `inheritance`：`not_applicable`；仅 main 的配置解析动作，不是可向子层合并的配置值；每次解析调用加载入口，且模块计数已使用后禁止再加载。 来源：`registration`、`d340-setter`。

注册与setter：`ngx_load_module`；新增锚点：`d340-setter` → nginx/src/core/nginx.c:1582–1660；`d340-static-modules` → nginx/src/core/ngx_module.c:25–65。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_regex_module--pcre_jit

- `defaults`：`verified`；off；create 设置未配置哨兵，init_conf 将其设为 0；显式 on 还需通过 PCRE/PCRE2 的 JIT 支持检查，否则回退为 0。 来源：`d340-create`、`d340-init`、`d340-post`。
- `inheritance`：`not_applicable`；仅 main 全局正则配置，没有父子层级合并。 来源：`registration`、`d340-create`。

注册与setter：`ngx_conf_set_flag_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1026–1062；`d340-create` → nginx/src/core/ngx_regex.c:719–747；`d340-init` → nginx/src/core/ngx_regex.c:751–758；`d340-post` → nginx/src/core/ngx_regex.c:762–804。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_thread_pool_module--thread_pool

- `defaults`：`verified`；default threads=32 max_queue=65536；这是默认名线程池被引用但未显式定义时的补值，不会无条件创建所有线程池。显式定义必须给出正数 threads，省略 max_queue 时为 65536；其他未定义的池名报错。 来源：`d340-create`、`d340-init`、`d340-setter`、`d340-pool-add`。
- `inheritance`：`not_applicable`；仅 main 的命名池集合，无父子配置继承；同名引用复用同一池对象，同名重复定义被拒绝。 来源：`registration`、`d340-setter`、`d340-pool-add`。

注册与setter：`ngx_thread_pool`；新增锚点：`d340-setter` → nginx/src/core/ngx_thread_pool.c:456–515；`d340-create` → nginx/src/core/ngx_thread_pool.c:398–415；`d340-init` → nginx/src/core/ngx_thread_pool.c:419–452；`d340-pool-add` → nginx/src/core/ngx_thread_pool.c:519–554。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_devpoll_module--devpoll_changes

- `defaults`：`verified`；32；仅适用于已编入并采用 /dev/poll 的事件配置。 来源：`registration`、`d340-create`、`d340-init`。
- `inheritance`：`not_applicable`；仅 events 内的 devpoll_changes 配置；events 为每个事件模块创建并初始化一份配置，没有 server/location 父子层级合并。 来源：`registration`、`d340-events-binding`。

注册与setter：`ngx_conf_set_num_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1167–1194；`d340-create` → nginx/src/event/modules/ngx_devpoll_module.c:536–549；`d340-init` → nginx/src/event/modules/ngx_devpoll_module.c:553–561；`d340-events-binding` → nginx/src/event/ngx_event.c:987–1061。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_devpoll_module--devpoll_events

- `defaults`：`verified`；32；仅适用于已编入并采用 /dev/poll 的事件配置。 来源：`registration`、`d340-create`、`d340-init`。
- `inheritance`：`not_applicable`；仅 events 内的 devpoll_events 配置；events 为每个事件模块创建并初始化一份配置，没有 server/location 父子层级合并。 来源：`registration`、`d340-events-binding`。

注册与setter：`ngx_conf_set_num_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1167–1194；`d340-create` → nginx/src/event/modules/ngx_devpoll_module.c:536–549；`d340-init` → nginx/src/event/modules/ngx_devpoll_module.c:553–561；`d340-events-binding` → nginx/src/event/ngx_event.c:987–1061。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_epoll_module--epoll_events

- `defaults`：`verified`；512；对应 epoll 事件返回数组的配置默认值。 来源：`registration`、`d340-create`、`d340-init`。
- `inheritance`：`not_applicable`；仅 events 内的 epoll_events 配置；events 为每个事件模块创建并初始化一份配置，没有 server/location 父子层级合并。 来源：`registration`、`d340-events-binding`。

注册与setter：`ngx_conf_set_num_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1167–1194；`d340-create` → nginx/src/event/modules/ngx_epoll_module.c:1026–1039；`d340-init` → nginx/src/event/modules/ngx_epoll_module.c:1043–1051；`d340-events-binding` → nginx/src/event/ngx_event.c:987–1061。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_epoll_module--worker_aio_requests

- `defaults`：`verified`；32；该命令在epoll模块命令表中直接注册，没有文件AIO编译门控。仅在NGX_HAVE_FILE_AIO构建分支初始化文件AIO时，aio_requests才传给io_setup；注册此项不代表文件AIO已启用或可用。 来源：`registration`、`d340-create`、`d340-init`、`d340-aio-gate`、`implementation-0`。
- `inheritance`：`not_applicable`；仅 events 内的 worker_aio_requests 配置；events 为每个事件模块创建并初始化一份配置，没有 server/location 父子层级合并。 来源：`registration`、`d340-events-binding`。

注册与setter：`ngx_conf_set_num_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1167–1194；`d340-create` → nginx/src/event/modules/ngx_epoll_module.c:1026–1039；`d340-init` → nginx/src/event/modules/ngx_epoll_module.c:1043–1051；`d340-events-binding` → nginx/src/event/ngx_event.c:987–1061；`d340-aio-gate` → nginx/src/event/modules/ngx_epoll_module.c:344–346。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。A01修复：区分epoll命令注册与文件AIO使用门控；保留默认32及原inheritance。

## nginx--ngx_eventport_module--eventport_events

- `defaults`：`verified`；32；对应 eventport 事件数组的配置默认值。 来源：`registration`、`d340-create`、`d340-init`。
- `inheritance`：`not_applicable`；仅 events 内的 eventport_events 配置；events 为每个事件模块创建并初始化一份配置，没有 server/location 父子层级合并。 来源：`registration`、`d340-events-binding`。

注册与setter：`ngx_conf_set_num_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1167–1194；`d340-create` → nginx/src/event/modules/ngx_eventport_module.c:627–639；`d340-init` → nginx/src/event/modules/ngx_eventport_module.c:643–650；`d340-events-binding` → nginx/src/event/ngx_event.c:987–1061。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_iocp_module--iocp_threads

- `defaults`：`verified`；0；Windows IOCP 初始化把该值传给 CreateIoCompletionPort 的并发线程参数，并非创建零个 worker。 来源：`registration`、`d340-create`、`d340-init`、`d340-use`。
- `inheritance`：`not_applicable`；仅 events 内的 iocp_threads 配置；events 为每个事件模块创建并初始化一份配置，没有 server/location 父子层级合并。 来源：`registration`、`d340-events-binding`。

注册与setter：`ngx_conf_set_num_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1167–1194；`d340-create` → nginx/src/event/modules/ngx_iocp_module.c:352–366；`d340-init` → nginx/src/event/modules/ngx_iocp_module.c:370–379；`d340-events-binding` → nginx/src/event/ngx_event.c:987–1061；`d340-use` → nginx/src/event/modules/ngx_iocp_module.c:109–124。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_iocp_module--post_acceptex

- `defaults`：`verified`；10；Windows IOCP 下预投递 AcceptEx 操作的配置默认数。 来源：`registration`、`d340-create`、`d340-init`。
- `inheritance`：`not_applicable`；仅 events 内的 post_acceptex 配置；events 为每个事件模块创建并初始化一份配置，没有 server/location 父子层级合并。 来源：`registration`、`d340-events-binding`。

注册与setter：`ngx_conf_set_num_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1167–1194；`d340-create` → nginx/src/event/modules/ngx_iocp_module.c:352–366；`d340-init` → nginx/src/event/modules/ngx_iocp_module.c:370–379；`d340-events-binding` → nginx/src/event/ngx_event.c:987–1061。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_iocp_module--acceptex_read

- `defaults`：`verified`；on；Windows IOCP 下创建配置为未设置，init_conf 将其设为 1。 来源：`registration`、`d340-create`、`d340-init`。
- `inheritance`：`not_applicable`；仅 events 内的 acceptex_read 配置；events 为每个事件模块创建并初始化一份配置，没有 server/location 父子层级合并。 来源：`registration`、`d340-events-binding`。

注册与setter：`ngx_conf_set_flag_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1026–1062；`d340-create` → nginx/src/event/modules/ngx_iocp_module.c:352–366；`d340-init` → nginx/src/event/modules/ngx_iocp_module.c:370–379；`d340-events-binding` → nginx/src/event/ngx_event.c:987–1061。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_kqueue_module--kqueue_changes

- `defaults`：`verified`；512；对应 kqueue 变更数组的配置默认值。 来源：`registration`、`d340-create`、`d340-init`。
- `inheritance`：`not_applicable`；仅 events 内的 kqueue_changes 配置；events 为每个事件模块创建并初始化一份配置，没有 server/location 父子层级合并。 来源：`registration`、`d340-events-binding`。

注册与setter：`ngx_conf_set_num_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1167–1194；`d340-create` → nginx/src/event/modules/ngx_kqueue_module.c:697–710；`d340-init` → nginx/src/event/modules/ngx_kqueue_module.c:714–722；`d340-events-binding` → nginx/src/event/ngx_event.c:987–1061。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_kqueue_module--kqueue_events

- `defaults`：`verified`；512；对应 kqueue 事件返回数组的配置默认值。 来源：`registration`、`d340-create`、`d340-init`。
- `inheritance`：`not_applicable`；仅 events 内的 kqueue_events 配置；events 为每个事件模块创建并初始化一份配置，没有 server/location 父子层级合并。 来源：`registration`、`d340-events-binding`。

注册与setter：`ngx_conf_set_num_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1167–1194；`d340-create` → nginx/src/event/modules/ngx_kqueue_module.c:697–710；`d340-init` → nginx/src/event/modules/ngx_kqueue_module.c:714–722；`d340-events-binding` → nginx/src/event/ngx_event.c:987–1061。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_event_core_module--use

- `defaults`：`verified`；未设置时按固定源码和已编入的事件模块选择：探测可用 epoll，随后 /dev/poll、kqueue 构建分支可覆盖选择；仍未选择则用 select，再否则取模块表中首个非 event_core 的事件模块。最终没有可用模块时报错，不能固定写成 epoll。 来源：`d340-create`、`d340-init`。
- `inheritance`：`not_applicable`；仅 events 的事件方法选择，不存在父子配置层合并；单进程重载时显式新方法必须与旧 cycle 相同，否则配置失败。 来源：`registration`、`d340-setter`、`d340-events-binding`。

注册与setter：`ngx_event_use`；新增锚点：`d340-setter` → nginx/src/event/ngx_event.c:1091–1150；`d340-create` → nginx/src/event/ngx_event.c:1258–1285；`d340-init` → nginx/src/event/ngx_event.c:1289–1373；`d340-events-binding` → nginx/src/event/ngx_event.c:987–1061。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_event_core_module--debug_connection

- `defaults`：`verified`；未配置时调试连接匹配数组为空，不额外按地址提升连接的日志级别；非 NGX_DEBUG 构建中显式设置也只告警并忽略。 来源：`d340-create`、`d340-setter`、`d340-use`。
- `inheritance`：`not_applicable`；仅 events 的连接调试规则；同层多条规则追加到数组，不存在 server/location 父子层继承。 来源：`registration`、`d340-setter`、`d340-events-binding`。

注册与setter：`ngx_event_debug_connection`；新增锚点：`d340-setter` → nginx/src/event/ngx_event.c:1154–1254；`d340-create` → nginx/src/event/ngx_event.c:1258–1285；`d340-use` → nginx/src/event/ngx_event_accept.c:519–572；`d340-events-binding` → nginx/src/event/ngx_event.c:987–1061。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_openssl_module--ssl_engine

- `defaults`：`verified`；未配置时不由本指令选择或设置 OpenSSL ENGINE；不能据此断言 OpenSSL 自身没有默认引擎。 来源：`d340-create`、`d340-setter`。
- `inheritance`：`not_applicable`；仅 main 的全局 OpenSSL 配置动作，没有父子配置层合并；显式设置直接调用 ENGINE_set_default。 来源：`registration`、`d340-setter`。

注册与setter：`ngx_openssl_engine`；新增锚点：`d340-setter` → nginx/src/event/ngx_event_openssl.c:6010–6054；`d340-create` → nginx/src/event/ngx_event_openssl.c:5990–6006。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_quic_bpf_module--quic_bpf

- `defaults`：`verified`；off；正常模块初始化将未设置 enabled 设为 0。配置测试 ngx_test_config 提前返回，不执行该初始化及后续 BPF 处理。 来源：`d340-create`、`d340-init`。
- `inheritance`：`not_applicable`；仅 main 的全局 QUIC BPF 开关，无父子配置层合并；旧 cycle 或继承套接字相关的 BPF map 处理不等同开关继承。 来源：`registration`、`d340-create`、`d340-init`。

注册与setter：`ngx_conf_set_flag_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1026–1062；`d340-create` → nginx/src/event/quic/ngx_event_quic_bpf.c:106–121；`d340-init` → nginx/src/event/quic/ngx_event_quic_bpf.c:125–170。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_google_perftools_module--google_perftools_profiles

- `defaults`：`verified`；未配置时 profiles.len 为 0，worker 初始化直接返回，不由本指令启动 Profiler；不能据此推断外部库或 CPUPROFILE 环境完全无作用。 来源：`d340-create`、`d340-use`。
- `inheritance`：`not_applicable`；仅 main 的全局文件名前缀配置，没有父子配置层合并。 来源：`registration`、`d340-create`。

注册与setter：`ngx_conf_set_str_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1066–1089；`d340-create` → nginx/src/misc/ngx_google_perftools_module.c:67–83；`d340-use` → nginx/src/misc/ngx_google_perftools_module.c:87–97。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_core_module--types

- `defaults`：`verified`；没有本层或祖先 types 配置时仅补入三组内建映射：html→text/html、gif→image/gif、jpg→image/jpeg；不会自动读取 mime.types。显式空 types 块创建空数组，不回填内建映射。 来源：`d340-create`、`d340-setter`、`d340-builtins`、`d340-merge`。

注册与setter：`ngx_http_core_types`；新增锚点：`d340-setter` → nginx/src/http/ngx_http_core_module.c:3274–3297；`d340-create` → nginx/src/http/ngx_http_core_module.c:3548–3565；`d340-builtins` → nginx/src/http/ngx_http_core_module.c:3656–3665；`d340-merge` → nginx/src/http/ngx_http_core_module.c:3729–3752。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_core_module--root

- `inheritance`：`verified`；当前层没有显式 root/alias（root.data 为 NULL）时，将父层 alias 标记、路径及变量脚本一起继承；祖先也无路径时补入 html 并按运行前缀补全。当前层任一显式 root 或 alias 都阻止整组路径继承。 来源：`registration`、`d340-setter`、`d340-merge`、`d340-layer-merge`。

注册与setter：`ngx_http_core_root`；新增锚点：`d340-setter` → nginx/src/http/ngx_http_core_module.c:4486–4584；`d340-create` → nginx/src/http/ngx_http_core_module.c:3548–3565；`d340-merge` → nginx/src/http/ngx_http_core_module.c:3678–3692；`d340-layer-merge` → nginx/src/http/ngx_http.c:575–665。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_core_module--alias

- `defaults`：`verified`；没有独立的隐式 alias 路径；未设置本层 root/alias 时先沿用父层路径组，祖先也未配置时使用 root html 的语义（alias=0）。 来源：`d340-create`、`d340-merge`。
- `inheritance`：`verified`；alias 与 root 共用路径组；子层没有设置任一项时连同父 alias 标记、路径与变量脚本一起继承，子层显式 root 或 alias 时整组覆盖。正则 location 的 alias 标记在 setter 中单独设置。 来源：`d340-setter`、`d340-merge`。

注册与setter：`ngx_http_core_root`；新增锚点：`d340-setter` → nginx/src/http/ngx_http_core_module.c:4486–4584；`d340-create` → nginx/src/http/ngx_http_core_module.c:3548–3565；`d340-merge` → nginx/src/http/ngx_http_core_module.c:3678–3692。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_core_module--post_action

- `defaults`：`verified`；本层及祖先都未设置时 post_action.data 保持 NULL，请求结束时返回 NGX_DECLINED，不执行额外内部跳转。 来源：`d340-create`、`d340-merge`、`d340-use`。

注册与setter：`ngx_conf_set_str_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1066–1089；`d340-create` → nginx/src/http/ngx_http_core_module.c:3548–3565；`d340-merge` → nginx/src/http/ngx_http_core_module.c:3694–3696；`d340-use` → nginx/src/http/ngx_http_request.c:3629–3637。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_core_module--client_body_temp_path

- `defaults`：`verified`；祖先也未设置时采用构建时 NGX_HTTP_CLIENT_TEMP_PATH（未传构建选项时为 client_body_temp），默认目录分级为 0、0、0，并按运行前缀补全相对路径。 来源：`d340-path-default`、`d340-merge`、`d340-build-path`、`d340-path-merge`。

注册与setter：`ngx_conf_set_path_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_file.c:361–417；`d340-path-default` → nginx/src/http/ngx_http_core_module.c:148–150；`d340-merge` → nginx/src/http/ngx_http_core_module.c:3876–3882；`d340-build-path` → nginx/auto/options:633–638；`d340-path-merge` → nginx/src/core/ngx_file.c:421–456。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_core_module--server_name

- `defaults`：`verified`；空名称 ""；当前 server 未声明任何名称时，其独立 server_names 数组补入空名，不使用机器主机名作为隐式默认。 来源：`d340-create`、`d340-merge`。
- `inheritance`：`verified`；仅 http.server 可配置；各 server 的名称数组分别初始化，不从其他 server 或 http 层继承，同一 server 多条声明追加名称。 来源：`registration`、`d340-create`、`d340-setter`、`d340-merge`。

注册与setter：`ngx_http_core_server_name`；新增锚点：`d340-setter` → nginx/src/http/ngx_http_core_module.c:4385–4482；`d340-create` → nginx/src/http/ngx_http_core_module.c:3437–3457；`d340-merge` → nginx/src/http/ngx_http_core_module.c:3512–3544。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_core_module--limit_except

- `defaults`：`verified`；未配置时 limit_except 方法掩码为 0，不创建或切换到本指令的专用 loc_conf；这不代表其他访问控制均被关闭。 来源：`d340-create`、`d340-setter`、`d340-use`。
- `inheritance`：`verified`；limit_except 的方法选择器不复制到普通子 location；块内新建 loc_conf、共享 main/srv 配置，并作为特殊 location 逐模块与外层合并，不能将整个块视为普通标量继承。 来源：`registration`、`d340-create`、`d340-setter`、`d340-layer-merge`。

注册与setter：`ngx_http_core_limit_except`；新增锚点：`d340-setter` → nginx/src/http/ngx_http_core_module.c:4607–4703；`d340-create` → nginx/src/http/ngx_http_core_module.c:3548–3565；`d340-use` → nginx/src/http/ngx_http_core_module.c:1305–1318；`d340-layer-merge` → nginx/src/http/ngx_http.c:575–665。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_core_module--subrequest_output_buffer_size

- `defaults`：`verified`；一个运行平台内存页（ngx_pagesize）；文档的 4k/8k 是常见页大小，不是固定二选一配置值。 来源：`d340-create`、`d340-merge`。
- `inheritance`：`verified`；子层未设置时继承父层 subrequest_output_buffer_size，祖先也未设置时用 ngx_pagesize；子层显式大小覆盖。 来源：`d340-create`、`d340-setter`、`d340-merge`。

注册与setter：`ngx_conf_set_size_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1198–1225；`d340-create` → nginx/src/http/ngx_http_core_module.c:3587–3589；`d340-merge` → nginx/src/http/ngx_http_core_module.c:3814–3816。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_core_module--aio

- `defaults`：`verified`；off；合并采用 NGX_HTTP_AIO_OFF。显式 on 或 threads 分别要求文件 AIO 或线程支持。 来源：`d340-create`、`d340-merge`、`d340-enum`、`d340-setter`。
- `inheritance`：`verified`；子层未设置时继承父层 aio；线程池及动态池名指针各自合并。显式 aio off/on 会先把本层两个线程池指针设为 NULL，阻止沿用父线程池；显式 threads 使用本层选择的池。 来源：`d340-create`、`d340-setter`、`d340-merge`。

注册与setter：`ngx_http_core_set_aio`；新增锚点：`d340-setter` → nginx/src/http/ngx_http_core_module.c:4707–4800；`d340-create` → nginx/src/http/ngx_http_core_module.c:3590–3595；`d340-merge` → nginx/src/http/ngx_http_core_module.c:3817–3823；`d340-enum` → nginx/src/http/ngx_http_core_module.h:34–36。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_core_module--aio_write

- `defaults`：`verified`；off；未配置且无祖先值时合并为 0。 来源：`d340-create`、`d340-merge`。
- `inheritance`：`verified`；子层未设置 aio_write 时继承父值，显式 on/off 覆盖；该开关独立合并，不会自动改写 aio 模式。 来源：`d340-create`、`d340-setter`、`d340-merge`。

注册与setter：`ngx_conf_set_flag_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1026–1062；`d340-create` → nginx/src/http/ngx_http_core_module.c:3590–3591；`d340-merge` → nginx/src/http/ngx_http_core_module.c:3817–3818。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_core_module--read_ahead

- `defaults`：`verified`；0；不通过本配置请求额外预读字节数，平台的具体文件预读处理仍由相应实现决定。 来源：`d340-create`、`d340-merge`。
- `inheritance`：`verified`；子层未设置时继承父 read_ahead；无祖先值时为 0，显式数值覆盖。 来源：`d340-create`、`d340-setter`、`d340-merge`。

注册与setter：`ngx_conf_set_size_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1198–1225；`d340-create` → nginx/src/http/ngx_http_core_module.c:3596–3596；`d340-merge` → nginx/src/http/ngx_http_core_module.c:3824–3824。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_core_module--directio

- `defaults`：`verified`；off；合并为 NGX_OPEN_FILE_DIRECTIO_OFF，而不是以内部未设置哨兵作为文件大小阈值。 来源：`d340-create`、`d340-merge`、`d340-setter`。
- `inheritance`：`verified`；子层未设置时继承父 directio 阈值/关闭标记；显式 off 或大小覆盖，祖先也未设置时关闭。 来源：`d340-create`、`d340-setter`、`d340-merge`。

注册与setter：`ngx_http_core_directio`；新增锚点：`d340-setter` → nginx/src/http/ngx_http_core_module.c:4804–4827；`d340-create` → nginx/src/http/ngx_http_core_module.c:3597–3597；`d340-merge` → nginx/src/http/ngx_http_core_module.c:3825–3826。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_core_module--directio_alignment

- `defaults`：`verified`；512 字节；无祖先配置时采用此对齐值。 来源：`d340-create`、`d340-merge`。
- `inheritance`：`verified`；子层未设置时继承父 directio_alignment；显式大小覆盖，祖先也未设置时为 512。 来源：`d340-create`、`d340-setter`、`d340-merge`。

注册与setter：`ngx_conf_set_off_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1229–1256；`d340-create` → nginx/src/http/ngx_http_core_module.c:3598–3598；`d340-merge` → nginx/src/http/ngx_http_core_module.c:3827–3828。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_core_module--error_page

- `defaults`：`verified`；没有本层及祖先 error_page 映射时，不配置自定义错误页重定向。OpenResty 的 no_error_pages 补丁将未设置表示为 NGX_CONF_UNSET_PTR，最终合并为 NULL；显式 no_error_pages 也可阻断父映射，不等于错误响应没有正文。 来源：`no-error-pages-patch`、`d340-create`、`d340-use`。

注册与setter：`ngx_http_core_error_page`；新增锚点：`d340-setter` → nginx/src/http/ngx_http_core_module.c:4831–4946；`d340-create` → nginx/src/http/ngx_http_core_module.c:3548–3555；`d340-use` → nginx/src/http/ngx_http_special_response.c:454–469。

补丁：d340-setter 受相关实际补丁修改，按结构化记录及原补丁ID核对。此项默认分支以实际no_error_pages补丁为准；已有verified_affected状态与既有继承字段保持不变。

## nginx--ngx_http_core_module--gzip_disable

- `defaults`：`verified`；未设置时没有禁用压缩的正则列表，msie6 标志为 0；若编入 degradation 支持，其标志也默认为 0。不是默认启用 msie6 规则。 来源：`d340-create`、`d340-merge`。
- `inheritance`：`verified`；正则数组在子层未出现 gzip_disable 时整体继承；子层任意一次声明会创建自己的数组并阻断父正则列表。msie6 和可选 degradation 标志各自按未设置标记 3 继承，子层仅写新正则并不会自动清除父层已开启的内建标志。 来源：`d340-setter`、`d340-create`、`d340-merge`。

注册与setter：`ngx_http_gzip_disable`；新增锚点：`d340-setter` → nginx/src/http/ngx_http_core_module.c:5109–5203；`d340-create` → nginx/src/http/ngx_http_core_module.c:3635–3645；`d340-merge` → nginx/src/http/ngx_http_core_module.c:3918–3944。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_core_module--disable_symlinks

- `defaults`：`verified`；off；支持 NGX_HAVE_OPENAT 的构建中，未设置模式合并为 NGX_DISABLE_SYMLINKS_OFF，from 表达式为 NULL。 来源：`registration`、`d340-create`、`d340-merge`、`d340-setter`。
- `inheritance`：`verified`；子层未设置时分别继承父层模式和 from 表达式；显式只写 off/on/if_not_owner 时 setter 将 from 设为 NULL，因此不继承父 from；显式 from= 使用本层表达式。 来源：`d340-setter`、`d340-merge`。

注册与setter：`ngx_http_disable_symlinks`；新增锚点：`d340-setter` → nginx/src/http/ngx_http_core_module.c:5211–5297；`d340-create` → nginx/src/http/ngx_http_core_module.c:3647–3650；`d340-merge` → nginx/src/http/ngx_http_core_module.c:3946–3951。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_rewrite_module--rewrite

- `defaults`：`verified`；未配置时不生成rewrite指令码，也不自动改写URI。显式配置但省略flag时，普通内部改写继续执行同组后续指令；replacement以http://、https://或$scheme开头则自动按302重定向并终止该组。 来源：`registration`、`d340-setter`、`d340-create`、`d340-use`。
- `inheritance`：`verified`；普通子location不继承父location的rewrite指令码；merge在子codes为空时直接返回，不复制父codes。server级脚本通过独立的server-rewrite阶段执行，不是location继承；if内指令编入外层同一代码数组。 来源：`registration`、`d340-create`、`d340-merge`、`d340-use`、`d340-phases`、`d340-if-context`。

注册与setter：`ngx_http_rewrite`；新增锚点：`d340-setter` → nginx/src/http/modules/ngx_http_rewrite_module.c:298–438；`d340-create` → nginx/src/http/modules/ngx_http_rewrite_module.c:222–236；`d340-merge` → nginx/src/http/modules/ngx_http_rewrite_module.c:240–268；`d340-use` → nginx/src/http/modules/ngx_http_rewrite_module.c:137–184；`d340-phases` → nginx/src/http/modules/ngx_http_rewrite_module.c:272–294；`d340-if-context` → nginx/src/http/modules/ngx_http_rewrite_module.c:532–644。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_rewrite_module--return

- `defaults`：`verified`；未配置时不生成return指令码，不自动返回某个状态或正文。显式return只给数值状态码时，编译的正文值为空；只给符合http://、https://或$scheme前缀的URL时，编译为302。 来源：`registration`、`d340-setter`、`d340-create`、`d340-use`。
- `inheritance`：`verified`；普通子location不继承父location的return指令码，子codes为空时merge不复制父codes。server级return在server-rewrite阶段执行；if内return与外层共享代码数组，是否执行由控制流决定。 来源：`registration`、`d340-create`、`d340-merge`、`d340-use`、`d340-phases`、`d340-if-context`。

注册与setter：`ngx_http_rewrite_return`；新增锚点：`d340-setter` → nginx/src/http/modules/ngx_http_rewrite_module.c:442–510；`d340-create` → nginx/src/http/modules/ngx_http_rewrite_module.c:222–236；`d340-merge` → nginx/src/http/modules/ngx_http_rewrite_module.c:240–268；`d340-use` → nginx/src/http/modules/ngx_http_rewrite_module.c:137–184；`d340-phases` → nginx/src/http/modules/ngx_http_rewrite_module.c:272–294；`d340-if-context` → nginx/src/http/modules/ngx_http_rewrite_module.c:532–644。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_rewrite_module--break

- `defaults`：`verified`；未配置时不生成break指令码，不自动中止当前rewrite指令组；只有显式break才向当前代码数组加入终止该组的操作。 来源：`registration`、`d340-setter`、`d340-create`、`d340-use`、`implementation-1`。
- `inheritance`：`verified`；break是当前脚本的控制流操作，不作为开关继承；普通子location的codes不会由父location复制。if内break编入外层同一数组，可中止当前外层指令组；server级脚本另在server-rewrite阶段执行。 来源：`registration`、`d340-create`、`d340-merge`、`d340-use`、`d340-phases`、`d340-if-context`、`implementation-1`。

注册与setter：`ngx_http_rewrite_break`；新增锚点：`d340-setter` → nginx/src/http/modules/ngx_http_rewrite_module.c:514–528；`d340-create` → nginx/src/http/modules/ngx_http_rewrite_module.c:222–236；`d340-merge` → nginx/src/http/modules/ngx_http_rewrite_module.c:240–268；`d340-use` → nginx/src/http/modules/ngx_http_rewrite_module.c:137–184；`d340-phases` → nginx/src/http/modules/ngx_http_rewrite_module.c:272–294；`d340-if-context` → nginx/src/http/modules/ngx_http_rewrite_module.c:532–644。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

返修补证（D01）：D01补证：两个目标字段均复用script break执行函数1510–1522，e->ip设为ngx_http_script_exit，闭合共享指令数组的退出语义。 复用旧证据，无新增或重排evidence。 本次新增引用的固定片段经实际补丁回放核对均保持原文；事实正文及非退回字段不变。

## nginx--ngx_http_rewrite_module--if

- `defaults`：`verified`；未配置时不生成条件判断指令及该if的匿名location配置，不自动执行条件体。 来源：`registration`、`d340-setter`、`d340-create`、`d340-use`。
- `inheritance`：`verified`；if条件及体内rewrite指令编入所在外层代码数组，不作为独立脚本向普通子location继承。块内另建各模块的location配置，再由各模块merge与外层合并；location级if条件成立时切换到该配置，server级if的loc_conf为空，不做该切换。 来源：`registration`、`d340-setter`、`d340-create`、`d340-merge`、`d340-if-context`、`d340-location-merge`、`implementation-1`。

注册与setter：`ngx_http_rewrite_if`；新增锚点：`d340-setter` → nginx/src/http/modules/ngx_http_rewrite_module.c:532–644；`d340-create` → nginx/src/http/modules/ngx_http_rewrite_module.c:222–236；`d340-merge` → nginx/src/http/modules/ngx_http_rewrite_module.c:240–268；`d340-use` → nginx/src/http/modules/ngx_http_rewrite_module.c:137–184；`d340-phases` → nginx/src/http/modules/ngx_http_rewrite_module.c:272–294；`d340-if-context` → nginx/src/http/modules/ngx_http_rewrite_module.c:532–644；`d340-location-merge` → nginx/src/http/ngx_http.c:625–666。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

返修补证（D02）：D02补证：inheritance复用script if执行函数1526–1551，闭合条件为真、切换loc_conf和update_location_config的运行分支。 复用旧证据，无新增或重排evidence。 本次新增引用的固定片段经实际补丁回放核对均保持原文；事实正文及非退回字段不变。

## nginx--ngx_http_stub_status_module--stub_status

- `defaults`：`verified`；未配置时不安装状态页内容处理器，不自动提供状态页；显式stub_status在当前server/location的core配置中安装处理器，不是默认开启的开关。 来源：`registration`、`d340-setter`、`d340-core-create`、`d340-handler-select`。
- `inheritance`：`verified`；不向独立创建的子location复制状态页处理器：模块没有location配置或merge回调，core不合并handler；server级安装不代表各独立location自动启用状态页。 来源：`registration`、`d340-location-create`、`d340-core-create`、`d340-core-merge-before`、`d340-core-merge-after`、`d340-location-select`、`d340-handler-select`、`d340-module-context`。

注册与setter：`ngx_http_set_stub_status`；新增锚点：`d340-setter` → nginx/src/http/modules/ngx_http_stub_status_module.c:218–226；`d340-location-create` → nginx/src/http/ngx_http_core_module.c:3052–3083；`d340-core-create` → nginx/src/http/ngx_http_core_module.c:3548–3555；`d340-core-merge-before` → nginx/src/http/ngx_http_core_module.c:3669–3778；`d340-core-merge-after` → nginx/src/http/ngx_http_core_module.c:3782–3954；`d340-location-select` → nginx/src/http/ngx_http_core_module.c:950–979；`d340-handler-select` → nginx/src/http/ngx_http_core_module.c:1381–1383；`d340-module-context` → nginx/src/http/modules/ngx_http_stub_status_module.c:34–46。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_proxy_module--proxy_redirect

- `defaults`：`verified`；default；未设置时 redirect 开关为 1。只有启用且无本层/父层映射，并且存在静态 proxy_pass URL 时，才根据 URL 与 location 自动生成替换规则；没有可用 URL 时不凭空生成。 来源：`d340-create`、`d340-merge`。
- `inheritance`：`verified`；子层未设置开关时继承父开关；启用且本层没有规则数组时继承父数组。子层显式规则使用本层数组而非追加父数组；off 取消该层改写，default 的显式声明还受 proxy_pass 顺序及变量限制。 来源：`d340-setter`、`d340-merge`。

注册与setter：`ngx_http_proxy_redirect`；新增锚点：`d340-setter` → nginx/src/http/modules/ngx_http_proxy_module.c:4236–4376；`d340-create` → nginx/src/http/modules/ngx_http_proxy_module.c:3314–3438；`d340-merge` → nginx/src/http/modules/ngx_http_proxy_module.c:3774–3823。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_proxy_module--proxy_store

- `defaults`：`verified`；off；未设置时 store 合并为 0，不自动保存上游响应文件。 来源：`d340-create`、`d340-merge`。
- `inheritance`：`verified`；仅 store 为未设置时，连同父层路径脚本继承；显式 off/on/路径覆盖。显式启用 proxy_cache 会使本层 store 关闭，显式启用 store 则关闭本层 cache；同层同时启用会被 setter 拒绝。 来源：`d340-setter`、`d340-merge`、`d340-cache-setter`。

注册与setter：`ngx_http_proxy_store`；新增锚点：`d340-setter` → nginx/src/http/modules/ngx_http_proxy_module.c:4721–4769；`d340-create` → nginx/src/http/modules/ngx_http_proxy_module.c:3314–3438；`d340-merge` → nginx/src/http/modules/ngx_http_proxy_module.c:3455–3473。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

返修补证（B01）：B01补证：追加对应cache setter，闭合先store再cache被拒绝的方向，原store setter保留以证明反向。 新增锚点：`d340-cache-setter` → nginx/src/http/modules/ngx_http_proxy_module.c:4775–4830。 本次新增引用的固定片段经实际补丁回放核对均保持原文；事实正文及非退回字段不变。

## nginx--ngx_http_proxy_module--proxy_set_body

- `defaults`：`verified`；未设置替代请求体；无祖先配置时 body_source 及脚本为空，保持原请求体处理路径，并受 proxy_pass_request_body 等设置控制。 来源：`d340-create`、`d340-merge`、`d340-use`、`implementation-1`。
- `inheritance`：`verified`；子层 body_source.data 为 NULL 时，父层正文表达式、flushes、长度及值脚本整组继承；显式正文（包括显式空字符串）使用本层表达式，不继承父组。 来源：`d340-setter`、`d340-merge`。

注册与setter：`ngx_conf_set_str_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1066–1089；`d340-create` → nginx/src/http/modules/ngx_http_proxy_module.c:3314–3438；`d340-merge` → nginx/src/http/modules/ngx_http_proxy_module.c:3877–3899；`d340-use` → nginx/src/http/modules/ngx_http_proxy_module.c:1321–1346。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

返修补证（B02）：B02补证：defaults复用1547–1600请求体发送分支，闭合body_values为空且pass_request_body时接入原正文链。 复用旧证据，无新增或重排evidence。 本次新增引用的固定片段经实际补丁回放核对均保持原文；事实正文及非退回字段不变。

## nginx--ngx_http_proxy_module--proxy_method

- `defaults`：`verified`；未配置替代方法；无祖先值时 method 为 NULL，使用原请求方法，但上游已有 u->method（如缓存 HEAD 转 GET）时优先使用该方法。 来源：`d340-create`、`d340-merge`、`d340-use`。
- `inheritance`：`verified`；子层未设置时继承父 method 复杂值指针，显式表达式覆盖；请求时已有 u->method 的优先级高于该配置。 来源：`d340-setter`、`d340-merge`、`d340-use`。

注册与setter：`ngx_http_set_complex_value_slot`；新增锚点：`d340-setter` → nginx/src/http/ngx_http_script.c:243–275；`d340-create` → nginx/src/http/modules/ngx_http_proxy_module.c:3314–3438；`d340-merge` → nginx/src/http/modules/ngx_http_proxy_module.c:3772–3772；`d340-use` → nginx/src/http/modules/ngx_http_proxy_module.c:1265–1276。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_proxy_module--proxy_busy_buffers_size

- `defaults`：`verified`；本层及祖先均未显式设置时，为 2×max(有效 proxy_buffer_size, 单个有效 proxy_buffers 大小)；两者均取一页默认时才是两页，常见为 8k/16k。 来源：`d340-create`、`d340-merge`。
- `inheritance`：`verified`；先继承父 busy_buffers_size_conf 显式槽；父子都未设置则按当前层合并后的缓冲大小重新派生，而不是继承父层已派生的数值。显式大小覆盖后仍校验上下界。 来源：`d340-setter`、`d340-merge`。

注册与setter：`ngx_conf_set_size_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1198–1225；`d340-create` → nginx/src/http/modules/ngx_http_proxy_module.c:3314–3438；`d340-merge` → nginx/src/http/modules/ngx_http_proxy_module.c:3514–3565。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_proxy_module--proxy_cache

- `defaults`：`verified`；off；NGX_HTTP_CACHE 构建下，本层及祖先均未设置时 cache 合并为 0，不自动选择缓存区。 来源：`d340-create`、`d340-merge`。
- `inheritance`：`verified`；仅 cache 为未设置时，连同父 cache_zone/cache_value 一起继承；显式 off 或区名/表达式覆盖。显式启用 store 会关闭本层 cache；显式 cache 启用会阻止继承父 store。 来源：`d340-setter`、`d340-store-conflict`、`d340-merge`。

注册与setter：`ngx_http_proxy_cache`；新增锚点：`d340-setter` → nginx/src/http/modules/ngx_http_proxy_module.c:4775–4830；`d340-create` → nginx/src/http/modules/ngx_http_proxy_module.c:3314–3438；`d340-store-conflict` → nginx/src/http/modules/ngx_http_proxy_module.c:3455–3473；`d340-merge` → nginx/src/http/modules/ngx_http_proxy_module.c:3637–3657。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_proxy_module--proxy_cache_key

- `inheritance`：`verified`；子层 cache_key.value.data 为 NULL 时整体复制父复杂值；显式表达式（含显式空值）不继承。祖先也未设置则保留空配置，由 create_key 的内建分支构造键，不在 merge 阶段补文档中的字符串。 来源：`d340-setter`、`d340-merge`、`d340-key-use`。

注册与setter：`ngx_http_proxy_cache_key`；新增锚点：`d340-setter` → nginx/src/http/modules/ngx_http_proxy_module.c:4834–4858；`d340-create` → nginx/src/http/modules/ngx_http_proxy_module.c:3314–3438；`d340-merge` → nginx/src/http/modules/ngx_http_proxy_module.c:3695–3697；`d340-key-use` → nginx/src/http/modules/ngx_http_proxy_module.c:1138–1230。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_proxy_module--proxy_cache_path

- `defaults`：`verified`；未配置时不自动创建 proxy 缓存目录或 keys_zone。显式声明必须提供路径及 keys_zone；省略可选参数时 levels 无分级、use_temp_path=on、inactive=600s、max_size 为 NGX_MAX_OFF_T_VALUE、min_free=0；manager/loader 默认每批100文件、阈值200ms、间隔50ms。 来源：`registration`、`d340-create`、`d340-setter`。

注册与setter：`ngx_http_file_cache_set_slot`；新增锚点：`d340-setter` → nginx/src/http/ngx_http_file_cache.c:2379–2722；`d340-create` → nginx/src/http/modules/ngx_http_proxy_module.c:3291–3310。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_proxy_module--proxy_cache_methods

- `defaults`：`verified`；GET HEAD；合并最后总是加入这两个方法。 来源：`d340-create`、`d340-merge`。
- `inheritance`：`verified`；子层未设置方法掩码时取父层；子层显式方法替换父层方法集合，同层多次配置按位追加；随后无条件加入 GET/HEAD，所以不能靠子层声明将这两者删除。 来源：`d340-setter`、`d340-merge`。

注册与setter：`ngx_conf_set_bitmask_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1389–1431；`d340-create` → nginx/src/http/modules/ngx_http_proxy_module.c:3314–3438；`d340-merge` → nginx/src/http/modules/ngx_http_proxy_module.c:3680–3684。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_proxy_module--proxy_temp_path

- `defaults`：`verified`；构建时 NGX_HTTP_PROXY_TEMP_PATH；未传路径选项时为 proxy_temp，源码默认分级为 1:2，并按运行前缀补全相对路径。 来源：`d340-path-default`、`d340-build-path`、`d340-merge`、`d340-path-merge`。
- `inheritance`：`verified`；子层未设置路径时复用父层完整 ngx_path_t（含目录分级）；父层也为空才使用构建路径和 1:2 分级。显式路径/分级使用本层对象，不与父层拼接。 来源：`d340-setter`、`d340-merge`、`d340-path-merge`。

注册与setter：`ngx_conf_set_path_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_file.c:361–417；`d340-create` → nginx/src/http/modules/ngx_http_proxy_module.c:3314–3438；`d340-path-default` → nginx/src/http/modules/ngx_http_proxy_module.c:899–901；`d340-merge` → nginx/src/http/modules/ngx_http_proxy_module.c:3628–3634；`d340-build-path` → nginx/auto/options:633–638；`d340-path-merge` → nginx/src/core/ngx_file.c:421–456。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_proxy_module--proxy_max_temp_file_size

- `defaults`：`verified`；1024m（1073741824字节）；本层及祖先均未显式设置时采用该上限。显式0关闭相应响应缓冲临时文件使用，不代表禁用缓存/store文件。 来源：`d340-create`、`d340-merge`、`implementation-0`、`implementation-1`、`implementation-2`、`d340-pipe-cacheable`。
- `inheritance`：`verified`；继承的是父 max_temp_file_size_conf 显式槽；父子都未设置才使用1024m，子层显式值覆盖，并按当前缓冲大小校验非零下限。 来源：`d340-setter`、`d340-merge`。

注册与setter：`ngx_conf_set_size_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1198–1225；`d340-create` → nginx/src/http/modules/ngx_http_proxy_module.c:3314–3438；`d340-merge` → nginx/src/http/modules/ngx_http_proxy_module.c:3588–3609。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

返修补证（B03）：B03补证：复用event_pipe的非cacheable限额分支，追加upstream将cacheable或store传至p->cacheable及文件上限的赋值，闭合0不禁止缓存/store文件的消费路径。 新增锚点：`d340-pipe-cacheable` → nginx/src/http/ngx_http_upstream.c:3242–3272。 本次新增引用的固定片段经实际补丁回放核对均保持原文；事实正文及非退回字段不变。

## nginx--ngx_http_proxy_module--proxy_temp_file_write_size

- `defaults`：`verified`；本层及祖先均未显式设置时，为 2×max(有效 proxy_buffer_size, 单个有效 proxy_buffers 大小)；默认缓冲均为一页时即两页，不固定为某一字节数。 来源：`d340-base-size`、`d340-merge`。
- `inheritance`：`verified`；先继承父 temp_file_write_size_conf 显式槽；父子都未设置则按当前层缓冲大小派生。子层显式值覆盖，结果不得小于两种单缓冲大小的最大值。 来源：`d340-setter`、`d340-base-size`、`d340-merge`。

注册与setter：`ngx_conf_set_size_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1198–1225；`d340-create` → nginx/src/http/modules/ngx_http_proxy_module.c:3314–3438；`d340-base-size` → nginx/src/http/modules/ngx_http_proxy_module.c:3531–3534；`d340-merge` → nginx/src/http/modules/ngx_http_proxy_module.c:3568–3586。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_proxy_module--proxy_pass_header

- `defaults`：`verified`；未额外配置允许透传列表；仍执行协议内建隐藏头集合，除非祖先或本层配置相应 pass_header。 来源：`d340-create`、`d340-header-builtins`、`d340-header-call`、`d340-header-merge`。
- `inheritance`：`verified`；proxy_pass_header 在子层未声明时整体继承父层同类列表；子层任一声明建立本层数组，不追加父同类数组。同层多条声明追加。hide/pass 两类各自独立继承，最终先加入内建及有效 hide 列表，再由有效 pass 列表移除同名项。 来源：`d340-setter`、`d340-header-call`、`d340-header-merge`。

注册与setter：`ngx_conf_set_str_array_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1093–1125；`d340-create` → nginx/src/http/modules/ngx_http_proxy_module.c:3314–3438；`d340-header-builtins` → nginx/src/http/modules/ngx_http_proxy_module.c:835–845；`d340-header-call` → nginx/src/http/modules/ngx_http_proxy_module.c:3843–3852；`d340-header-merge` → nginx/src/http/ngx_http_upstream.c:6630–6749。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_proxy_module--proxy_hide_header

- `defaults`：`verified`；无额外配置时内建隐藏集合为 Date、Server、X-Pad、X-Accel-Expires、X-Accel-Redirect、X-Accel-Limit-Rate、X-Accel-Buffering、X-Accel-Charset；不是默认透传所有响应头。 来源：`d340-create`、`d340-header-builtins`、`d340-header-call`、`d340-header-merge`。
- `inheritance`：`verified`；proxy_hide_header 在子层未声明时整体继承父层同类列表；子层任一声明建立本层数组，不追加父同类数组。同层多条声明追加。hide/pass 两类各自独立继承，最终先加入内建及有效 hide 列表，再由有效 pass 列表移除同名项。 来源：`d340-setter`、`d340-header-call`、`d340-header-merge`。

注册与setter：`ngx_conf_set_str_array_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1093–1125；`d340-create` → nginx/src/http/modules/ngx_http_proxy_module.c:3314–3438；`d340-header-builtins` → nginx/src/http/modules/ngx_http_proxy_module.c:835–845；`d340-header-call` → nginx/src/http/modules/ngx_http_proxy_module.c:3843–3852；`d340-header-merge` → nginx/src/http/ngx_http_upstream.c:6630–6749。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_proxy_module--proxy_ignore_headers

- `defaults`：`verified`；默认忽略集合为空；内部仅设 NGX_CONF_BITMASK_SET 标志，不默认忽略 Expires、Cache-Control、Set-Cookie 等头的特殊处理。 来源：`d340-create`、`d340-merge`。
- `inheritance`：`verified`；子层未声明时继承父 ignore_headers 掩码；子层任一显式列表使用本层集合，不与父层按位并集。同层多次声明通过 setter 按位追加。 来源：`d340-setter`、`d340-merge`。

注册与setter：`ngx_conf_set_bitmask_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1389–1431；`d340-create` → nginx/src/http/modules/ngx_http_proxy_module.c:3314–3438；`d340-merge` → nginx/src/http/modules/ngx_http_proxy_module.c:3612–3614。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_empty_gif_module--empty_gif

- `defaults`：`verified`；未配置时不安装本模块的内容处理器，不自动返回内置GIF；须在选中的location显式配置empty_gif。 来源：`d340-setter`、`d340-core-create`、`d340-handler-select`。
- `inheritance`：`verified`；不向独立创建的子location复制该内容处理器：本模块没有location配置或merge回调，core创建独立配置且不合并handler；请求仍选中原location时使用原处理器，不属于对子location的继承。 来源：`registration`、`d340-setter`、`d340-location-create`、`d340-core-create`、`d340-core-merge-before`、`d340-core-merge-after`、`d340-location-select`、`d340-handler-select`、`d340-module-context`。

注册与setter：`ngx_http_empty_gif`；新增锚点：`d340-setter` → nginx/src/http/modules/ngx_http_empty_gif_module.c:132–140；`d340-location-create` → nginx/src/http/ngx_http_core_module.c:3052–3083；`d340-core-create` → nginx/src/http/ngx_http_core_module.c:3548–3555；`d340-core-merge-before` → nginx/src/http/ngx_http_core_module.c:3669–3778；`d340-core-merge-after` → nginx/src/http/ngx_http_core_module.c:3782–3954；`d340-location-select` → nginx/src/http/ngx_http_core_module.c:950–979；`d340-handler-select` → nginx/src/http/ngx_http_core_module.c:1381–1383；`d340-module-context` → nginx/src/http/modules/ngx_http_empty_gif_module.c:78–90。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_flv_module--flv

- `defaults`：`verified`；未配置时不安装FLV内容处理器，不自动启用本模块的start偏移处理；须在选中的location显式配置flv。 来源：`d340-setter`、`d340-core-create`、`d340-handler-select`。
- `inheritance`：`verified`；不向独立创建的子location复制FLV内容处理器：模块没有location配置或merge回调，core不合并handler；请求仍选中原location时使用原处理器，不等于子location继承。 来源：`registration`、`d340-location-create`、`d340-core-create`、`d340-core-merge-before`、`d340-core-merge-after`、`d340-location-select`、`d340-handler-select`、`d340-module-context`。

注册与setter：`ngx_http_flv`；新增锚点：`d340-setter` → nginx/src/http/modules/ngx_http_flv_module.c:253–261；`d340-location-create` → nginx/src/http/ngx_http_core_module.c:3052–3083；`d340-core-create` → nginx/src/http/ngx_http_core_module.c:3548–3555；`d340-core-merge-before` → nginx/src/http/ngx_http_core_module.c:3669–3778；`d340-core-merge-after` → nginx/src/http/ngx_http_core_module.c:3782–3954；`d340-location-select` → nginx/src/http/ngx_http_core_module.c:950–979；`d340-handler-select` → nginx/src/http/ngx_http_core_module.c:1381–1383；`d340-module-context` → nginx/src/http/modules/ngx_http_flv_module.c:30–42。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_try_files_module--try_files

- `inheritance`：`verified`；不向独立子location继承文件候选数组：每层独立创建try_files=NULL，本模块没有merge回调，setter只填写当前层。precontent处理器读取当前location配置，数组为空就返回DECLINED；server级规则并不自动复制到各location。 来源：`registration`、`d340-setter`、`d340-create`、`d340-module-context`、`d340-use`、`d340-phase`、`d340-location-create`。

注册与setter：`ngx_http_try_files`；新增锚点：`d340-setter` → nginx/src/http/modules/ngx_http_try_files_module.c:291–365；`d340-create` → nginx/src/http/modules/ngx_http_try_files_module.c:369–385；`d340-module-context` → nginx/src/http/modules/ngx_http_try_files_module.c:47–59；`d340-use` → nginx/src/http/modules/ngx_http_try_files_module.c:79–97；`d340-phase` → nginx/src/http/modules/ngx_http_try_files_module.c:389–404；`d340-location-create` → nginx/src/http/ngx_http_core_module.c:3052–3083。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_mp4_module--mp4

- `defaults`：`verified`；未配置时不安装MP4内容处理器，不自动启用本模块的伪流处理；须在选中的location显式配置mp4。 来源：`d340-setter`、`d340-core-create`、`d340-handler-select`。
- `inheritance`：`verified`；MP4模块的merge只合并缓冲区大小和关键帧选项，不传播内容处理器；core为子location创建独立配置且不复制handler。因此普通子location未写mp4不会继承父处理器，仍选中父location则继续使用父处理器。 来源：`registration`、`d340-location-create`、`d340-core-create`、`d340-core-merge-before`、`d340-core-merge-after`、`d340-location-select`、`d340-handler-select`、`d340-create`、`d340-merge`。

注册与setter：`ngx_http_mp4`；新增锚点：`d340-setter` → nginx/src/http/modules/ngx_http_mp4_module.c:3915–3923；`d340-location-create` → nginx/src/http/ngx_http_core_module.c:3052–3083；`d340-core-create` → nginx/src/http/ngx_http_core_module.c:3548–3555；`d340-core-merge-before` → nginx/src/http/ngx_http_core_module.c:3669–3778；`d340-core-merge-after` → nginx/src/http/ngx_http_core_module.c:3782–3954；`d340-location-select` → nginx/src/http/ngx_http_core_module.c:950–979；`d340-handler-select` → nginx/src/http/ngx_http_core_module.c:1381–1383；`d340-create` → nginx/src/http/modules/ngx_http_mp4_module.c:3927–3941；`d340-merge` → nginx/src/http/modules/ngx_http_mp4_module.c:3945–3956。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_gzip_filter_module--gzip_window

- `defaults`：`verified`；当前层及父层均未设置时，内部wbits取编译所用zlib的MAX_WBITS，窗口容量对应2^MAX_WBITS字节（MAX_WBITS为15时为32k），不是15字节。显式容量经post回调转换为wbits；运行时还会按已知响应长度缩小实际窗口。 来源：`registration`、`d340-create`、`d340-merge`、`d340-post-binding`、`d340-post`、`d340-runtime-sizing`、`d340-zlib-build`。

注册与setter：`ngx_conf_set_size_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1198–1225；`d340-create` → nginx/src/http/modules/ngx_http_gzip_filter_module.c:1063–1090；`d340-merge` → nginx/src/http/modules/ngx_http_gzip_filter_module.c:1094–1122；`d340-post-binding` → nginx/src/http/modules/ngx_http_gzip_filter_module.c:107–108；`d340-post` → nginx/src/http/modules/ngx_http_gzip_filter_module.c:1139–1159；`d340-runtime-sizing` → nginx/src/http/modules/ngx_http_gzip_filter_module.c:469–494；`d340-zlib-build` → nginx/auto/lib/zlib/conf:6–79。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。固定官方文档没有本指令条目；固定源码允许外部或指定源码zlib，未把现场头文件宏值冒充固定发行值。

## nginx--ngx_http_gzip_filter_module--gzip_hash

- `defaults`：`verified`；当前层及父层均未设置时，内部memlevel取编译所用zlib的MAX_MEM_LEVEL减1；按post回调的容量映射，对应2^(MAX_MEM_LEVEL+7)字节（MAX_MEM_LEVEL为9时为64k），不是8字节。运行时会按已知响应长度调整memlevel，最低为1。 来源：`registration`、`d340-create`、`d340-merge`、`d340-post-binding`、`d340-post`、`d340-runtime-sizing`、`d340-zlib-build`。

注册与setter：`ngx_conf_set_size_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1198–1225；`d340-create` → nginx/src/http/modules/ngx_http_gzip_filter_module.c:1063–1090；`d340-merge` → nginx/src/http/modules/ngx_http_gzip_filter_module.c:1094–1122；`d340-post-binding` → nginx/src/http/modules/ngx_http_gzip_filter_module.c:107–108；`d340-post` → nginx/src/http/modules/ngx_http_gzip_filter_module.c:1163–1183；`d340-runtime-sizing` → nginx/src/http/modules/ngx_http_gzip_filter_module.c:469–494；`d340-zlib-build` → nginx/auto/lib/zlib/conf:6–79。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。固定官方文档没有本指令条目；默认值保留编译宏条件，不假定宿主zlib值。

## nginx--ngx_http_fastcgi_module--fastcgi_pass

- `defaults`：`verified`；没有默认FastCGI目标；没有显式配置或特殊配置上下文传播时，不由本模块安装FastCGI内容处理器。 来源：`d340-create`、`d340-setter`、`d340-merge`。
- `inheritance`：`verified`；只在 clcf->noname 且本层无静态目标和动态脚本时，复制父层 upstream 及脚本；普通命名/前缀/正则子 location 不走此继承分支。limit_except 无handler且获得目标时补装FastCGI handler；显式 fastcgi_pass 使用本层目标。 来源：`d340-setter`、`d340-merge`、`d340-core-handler`。

注册与setter：`ngx_http_fastcgi_pass`；新增锚点：`d340-setter` → nginx/src/http/modules/ngx_http_fastcgi_module.c:3658–3716；`d340-create` → nginx/src/http/modules/ngx_http_fastcgi_module.c:2857–2941；`d340-merge` → nginx/src/http/modules/ngx_http_fastcgi_module.c:3248–3262；`d340-core-handler` → nginx/src/http/ngx_http_core_module.c:1252–1262。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_fastcgi_module--fastcgi_split_path_info

- `defaults`：`verified`；没有默认拆分正则；无祖先正则时，split 将 script_name 取请求URI，path_info 保持空值，未编入PCRE时也不执行正则拆分。 来源：`d340-create`、`d340-merge`、`d340-split-use`。

注册与setter：`ngx_http_fastcgi_split_path_info`；新增锚点：`d340-setter` → nginx/src/http/modules/ngx_http_fastcgi_module.c:3720–3762；`d340-create` → nginx/src/http/modules/ngx_http_fastcgi_module.c:2857–2941；`d340-merge` → nginx/src/http/modules/ngx_http_fastcgi_module.c:3264–3269；`d340-split-use` → nginx/src/http/modules/ngx_http_fastcgi_module.c:3587–3654。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_fastcgi_module--fastcgi_store

- `defaults`：`verified`；off；无祖先值时 store 合并为0，不自动持久保存响应。 来源：`d340-create`、`d340-merge`。
- `inheritance`：`verified`；本层未设置 store 时才连同父层路径脚本一起继承；显式 off/on/路径覆盖。显式启用cache会把本层store设为0，显式启用store则把cache设为0；同层互斥启用由setter拒绝。 来源：`d340-setter`、`d340-merge`、`d340-cache-setter`。

注册与setter：`ngx_http_fastcgi_store`；新增锚点：`d340-setter` → nginx/src/http/modules/ngx_http_fastcgi_module.c:3766–3814；`d340-create` → nginx/src/http/modules/ngx_http_fastcgi_module.c:2857–2941；`d340-merge` → nginx/src/http/modules/ngx_http_fastcgi_module.c:2955–2973。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

返修补证（B01）：B01补证：追加对应cache setter，闭合先store再cache被拒绝的方向，原store setter保留以证明反向。 新增锚点：`d340-cache-setter` → nginx/src/http/modules/ngx_http_fastcgi_module.c:3820–3875。 本次新增引用的固定片段经实际补丁回放核对均保持原文；事实正文及非退回字段不变。

## nginx--ngx_http_fastcgi_module--fastcgi_limit_rate

- `defaults`：`verified`；0，不限速；无祖先配置时复杂值指针合并为NULL，缓冲读取路径用 ngx_http_complex_value_size(...,0) 求得0，不把内部NULL直接显示为参数值。 来源：`d340-merge`、`d340-rate-use`、`d340-complex-size`、`d340-rate-branch`。
- `inheritance`：`verified`；子层未设置时继承父层完整复杂值指针；显式数值或变量表达式覆盖。变量表达式在请求时求值，无法得到有效大小时使用调用点的默认0；并非在配置合并时复制某次请求计算结果。 来源：`d340-setter`、`d340-merge`、`d340-complex-size`。

注册与setter：`ngx_http_set_complex_value_size_slot`；新增锚点：`d340-setter` → nginx/src/http/ngx_http_script.c:317–343；`d340-create` → nginx/src/http/modules/ngx_http_fastcgi_module.c:2857–2941；`d340-merge` → nginx/src/http/modules/ngx_http_fastcgi_module.c:3018–3019；`d340-rate-use` → nginx/src/http/ngx_http_upstream.c:3230–3240；`d340-complex-size` → nginx/src/http/ngx_http_script.c:108–135；`d340-rate-branch` → nginx/src/event/ngx_event_pipe.c:205–222。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_fastcgi_module--fastcgi_cache

- `defaults`：`verified`；off；仅NGX_HTTP_CACHE构建中参与合并，无本层或祖先设置时关闭。 来源：`d340-create`、`d340-merge`。
- `inheritance`：`verified`；本层cache未设置时连同父层cache_zone/cache_value继承；显式off或区名/变量表达式覆盖。显式store启用阻断父cache继承，显式cache启用则关闭本层store。 来源：`d340-setter`、`d340-store-conflict`、`d340-merge`。

注册与setter：`ngx_http_fastcgi_cache`；新增锚点：`d340-setter` → nginx/src/http/modules/ngx_http_fastcgi_module.c:3820–3875；`d340-create` → nginx/src/http/modules/ngx_http_fastcgi_module.c:2857–2941；`d340-store-conflict` → nginx/src/http/modules/ngx_http_fastcgi_module.c:2955–2973；`d340-merge` → nginx/src/http/modules/ngx_http_fastcgi_module.c:3138–3158。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_fastcgi_module--fastcgi_cache_key

- `defaults`：`verified`；没有内建键表达式；本层及祖先均未设置时复杂值保持空，启用fastcgi_cache会告警缺少fastcgi_cache_key，不会自动采用HTTP proxy的默认键。 来源：`d340-create`、`d340-merge`、`d340-key-use`。

注册与setter：`ngx_http_fastcgi_cache_key`；新增锚点：`d340-setter` → nginx/src/http/modules/ngx_http_fastcgi_module.c:3879–3903；`d340-create` → nginx/src/http/modules/ngx_http_fastcgi_module.c:2857–2941；`d340-merge` → nginx/src/http/modules/ngx_http_fastcgi_module.c:3196–3203；`d340-key-use` → nginx/src/http/modules/ngx_http_fastcgi_module.c:812–829。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_fastcgi_module--fastcgi_cache_path

- `defaults`：`verified`；未配置时不创建FastCGI缓存路径或keys_zone。显式声明必须给路径和keys_zone；可选项默认levels无分级、use_temp_path=on、inactive=600s、max_size为NGX_MAX_OFF_T_VALUE、min_free=0，manager/loader各100文件、200ms阈值、50ms间隔。 来源：`registration`、`d340-create`、`d340-setter`。

注册与setter：`ngx_http_file_cache_set_slot`；新增锚点：`d340-setter` → nginx/src/http/ngx_http_file_cache.c:2379–2722；`d340-create` → nginx/src/http/modules/ngx_http_fastcgi_module.c:2834–2853。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_fastcgi_module--fastcgi_temp_path

- `defaults`：`verified`；构建时NGX_HTTP_FASTCGI_TEMP_PATH（未传构建选项时为fastcgi_temp），默认分级1:2，并按运行前缀补全相对路径。 来源：`d340-path-default`、`d340-build-path`、`d340-merge`、`d340-path-merge`。
- `inheritance`：`verified`；未设置时复用父层完整路径及分级；父也无值才创建构建默认路径对象。子层显式路径使用本层对象，不追加父路径。 来源：`d340-setter`、`d340-merge`、`d340-path-merge`。

注册与setter：`ngx_conf_set_path_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_file.c:361–417；`d340-create` → nginx/src/http/modules/ngx_http_fastcgi_module.c:2857–2941；`d340-path-default` → nginx/src/http/modules/ngx_http_fastcgi_module.c:675–677；`d340-merge` → nginx/src/http/modules/ngx_http_fastcgi_module.c:3130–3136；`d340-build-path` → nginx/auto/options:633–638；`d340-path-merge` → nginx/src/core/ngx_file.c:421–456。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_fastcgi_module--fastcgi_param

- `defaults`：`verified`；未配置且无祖先参数时，不自动加入fastcgi_params文件中的CGI参数；普通参数初始化直接返回。启用缓存时另补缓存所需HTTP_IF_*、HTTP_RANGE/HTTP_IF_RANGE默认项（用户同名项优先，补入项跳过空值）。自动转发请求头属于独立配置，不等于默认CGI参数表。 来源：`d340-create`、`d340-merge`、`d340-init-params`、`d340-cache-params`。

注册与setter：`ngx_http_upstream_param_set_slot`；新增锚点：`d340-setter` → nginx/src/http/ngx_http_upstream.c:6586–6626；`d340-create` → nginx/src/http/modules/ngx_http_fastcgi_module.c:2857–2941；`d340-merge` → nginx/src/http/modules/ngx_http_fastcgi_module.c:3271–3294；`d340-init-params` → nginx/src/http/modules/ngx_http_fastcgi_module.c:3330–3411；`d340-cache-params` → nginx/src/http/modules/ngx_http_fastcgi_module.c:661–670。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_fastcgi_module--fastcgi_pass_header

- `defaults`：`verified`；未额外配置允许透传列表；仍执行协议内建隐藏头集合，除非祖先或本层配置相应 pass_header。 来源：`d340-create`、`d340-header-builtins`、`d340-header-call`、`d340-header-merge`。
- `inheritance`：`verified`；fastcgi_pass_header 在子层未声明时整体继承父层同类列表；子层任一声明建立本层数组，不追加父同类数组。同层多条声明追加。hide/pass 两类各自独立继承，最终先加入内建及有效 hide 列表，再由有效 pass 列表移除同名项。 来源：`d340-setter`、`d340-header-call`、`d340-header-merge`。

注册与setter：`ngx_conf_set_str_array_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1093–1125；`d340-create` → nginx/src/http/modules/ngx_http_fastcgi_module.c:2857–2941；`d340-header-builtins` → nginx/src/http/modules/ngx_http_fastcgi_module.c:648–656；`d340-header-call` → nginx/src/http/modules/ngx_http_fastcgi_module.c:3237–3246；`d340-header-merge` → nginx/src/http/ngx_http_upstream.c:6630–6749。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_fastcgi_module--fastcgi_hide_header

- `defaults`：`verified`；无额外配置时内建隐藏集合为 Status、X-Accel-Expires、X-Accel-Redirect、X-Accel-Limit-Rate、X-Accel-Buffering、X-Accel-Charset；不是默认透传所有响应头。 来源：`d340-create`、`d340-header-builtins`、`d340-header-call`、`d340-header-merge`。
- `inheritance`：`verified`；fastcgi_hide_header 在子层未声明时整体继承父层同类列表；子层任一声明建立本层数组，不追加父同类数组。同层多条声明追加。hide/pass 两类各自独立继承，最终先加入内建及有效 hide 列表，再由有效 pass 列表移除同名项。 来源：`d340-setter`、`d340-header-call`、`d340-header-merge`。

注册与setter：`ngx_conf_set_str_array_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1093–1125；`d340-create` → nginx/src/http/modules/ngx_http_fastcgi_module.c:2857–2941；`d340-header-builtins` → nginx/src/http/modules/ngx_http_fastcgi_module.c:648–656；`d340-header-call` → nginx/src/http/modules/ngx_http_fastcgi_module.c:3237–3246；`d340-header-merge` → nginx/src/http/ngx_http_upstream.c:6630–6749。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_scgi_module--scgi_pass

- `defaults`：`verified`；没有默认SCGI目标；未设置也没有特殊上下文传入目标时，不安装本模块内容handler。 来源：`d340-create`、`d340-setter`、`d340-merge`。
- `inheritance`：`verified`；仅在noname上下文且本层静态目标及scgi脚本均为空时复制父目标/脚本；普通子location不沿此分支继承。limit_except获得目标但无handler时补装SCGI handler；显式scgi_pass使用本层目标。 来源：`d340-setter`、`d340-merge`。

注册与setter：`ngx_http_scgi_pass`；新增锚点：`d340-setter` → nginx/src/http/modules/ngx_http_scgi_module.c:1904–1961；`d340-create` → nginx/src/http/modules/ngx_http_scgi_module.c:1277–1340；`d340-merge` → nginx/src/http/modules/ngx_http_scgi_module.c:1639–1653。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_scgi_module--scgi_store

- `defaults`：`verified`；off；没有祖先值时store合并为0。 来源：`d340-create`、`d340-merge`。
- `inheritance`：`verified`；只有本层store仍未设置时继承父store和路径脚本；显式off/on/路径覆盖。显式启用scgi_cache会关闭本层store，显式store则阻止父cache传播；同层互斥启用被setter拒绝。 来源：`d340-setter`、`d340-merge`、`d340-cache-setter`。

注册与setter：`ngx_http_scgi_store`；新增锚点：`d340-setter` → nginx/src/http/modules/ngx_http_scgi_module.c:1965–2013；`d340-create` → nginx/src/http/modules/ngx_http_scgi_module.c:1277–1340；`d340-merge` → nginx/src/http/modules/ngx_http_scgi_module.c:1354–1371。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

返修补证（B01）：B01补证：追加对应cache setter，闭合先store再cache被拒绝的方向，原store setter保留以证明反向。 新增锚点：`d340-cache-setter` → nginx/src/http/modules/ngx_http_scgi_module.c:2019–2074。 本次新增引用的固定片段经实际补丁回放核对均保持原文；事实正文及非退回字段不变。

## nginx--ngx_http_scgi_module--scgi_limit_rate

- `defaults`：`verified`；0，不限制缓冲读取速率；无配置时复杂值指针合并为NULL，upstream缓冲读取将其按默认0求值。 来源：`d340-merge`、`d340-complex-size`、`d340-rate-use`、`d340-rate-branch`。
- `inheritance`：`verified`；未设置的子层继承父复杂值指针，显式数值或变量表达式覆盖；变量在请求阶段求值，求值失败或大小无效回退为调用点默认0。 来源：`d340-setter`、`d340-complex-setter`、`d340-merge`、`d340-complex-size`。

注册与setter：`ngx_http_set_complex_value_size_slot`；新增锚点：`d340-setter` → nginx/src/http/ngx_http_script.c:317–343；`d340-create` → nginx/src/http/modules/ngx_http_scgi_module.c:1277–1340；`d340-merge` → nginx/src/http/modules/ngx_http_scgi_module.c:1416–1417；`d340-complex-setter` → nginx/src/http/ngx_http_script.c:243–275；`d340-complex-size` → nginx/src/http/ngx_http_script.c:108–135；`d340-rate-use` → nginx/src/http/ngx_http_upstream.c:3230–3240；`d340-rate-branch` → nginx/src/event/ngx_event_pipe.c:205–222。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_scgi_module--scgi_cache

- `defaults`：`verified`；off；在NGX_HTTP_CACHE构建中，无本层/祖先设置时cache合并为0。 来源：`d340-create`、`d340-merge`。
- `inheritance`：`verified`；本层cache未设置时整组继承父cache开关及cache_zone/cache_value；显式off或目标表达式覆盖，显式store启用先将cache置0，显式cache启用先将store置0。 来源：`d340-setter`、`d340-store-conflict`、`d340-merge`。

注册与setter：`ngx_http_scgi_cache`；新增锚点：`d340-setter` → nginx/src/http/modules/ngx_http_scgi_module.c:2019–2074；`d340-create` → nginx/src/http/modules/ngx_http_scgi_module.c:1277–1340；`d340-store-conflict` → nginx/src/http/modules/ngx_http_scgi_module.c:1354–1371；`d340-merge` → nginx/src/http/modules/ngx_http_scgi_module.c:1536–1556。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_scgi_module--scgi_cache_key

- `defaults`：`verified`；没有内建键表达式；无祖先配置时保持空复杂值，开启scgi_cache却未配置key会告警，不自动复用proxy的键。 来源：`d340-create`、`d340-merge`、`d340-key-use`。

注册与setter：`ngx_http_scgi_cache_key`；新增锚点：`d340-setter` → nginx/src/http/modules/ngx_http_scgi_module.c:2078–2102；`d340-create` → nginx/src/http/modules/ngx_http_scgi_module.c:1277–1340；`d340-merge` → nginx/src/http/modules/ngx_http_scgi_module.c:1594–1601；`d340-key-use` → nginx/src/http/modules/ngx_http_scgi_module.c:610–627。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_scgi_module--scgi_cache_path

- `defaults`：`verified`；未声明时不创建SCGI缓存路径或keys_zone。显式声明必须给路径与keys_zone；其余默认无目录分级、use_temp_path=on、inactive=600s、max_size为NGX_MAX_OFF_T_VALUE、min_free=0，manager/loader各100文件、200ms阈值、50ms间隔。 来源：`registration`、`d340-create`、`d340-setter`。

注册与setter：`ngx_http_file_cache_set_slot`；新增锚点：`d340-setter` → nginx/src/http/ngx_http_file_cache.c:2379–2722；`d340-create` → nginx/src/http/modules/ngx_http_scgi_module.c:1254–1273。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_scgi_module--scgi_temp_path

- `defaults`：`verified`；构建时NGX_HTTP_SCGI_TEMP_PATH，未传构建选项时为scgi_temp；源码默认分级1:2，相对路径按运行前缀补全。 来源：`d340-path-default`、`d340-build-path`、`d340-merge`、`d340-path-merge`。
- `inheritance`：`verified`；子层路径为空时复用父层路径及分级；父也为空才创建默认路径对象。子层显式路径/分级整体覆盖，不与父目录合并。 来源：`d340-setter`、`d340-merge`、`d340-path-merge`。

注册与setter：`ngx_conf_set_path_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_file.c:361–417；`d340-create` → nginx/src/http/modules/ngx_http_scgi_module.c:1277–1340；`d340-path-default` → nginx/src/http/modules/ngx_http_scgi_module.c:472–474；`d340-merge` → nginx/src/http/modules/ngx_http_scgi_module.c:1528–1534；`d340-build-path` → nginx/auto/options:633–638；`d340-path-merge` → nginx/src/core/ngx_file.c:421–456。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_scgi_module--scgi_param

- `defaults`：`verified`；本层及祖先未配置时不自动载入scgi_params文件，普通参数初始化直接返回；请求编码器另行生成CONTENT_LENGTH，自动请求头转发也是独立机制。启用缓存时另补缓存所需HTTP_IF_*及HTTP_RANGE/HTTP_IF_RANGE，用户同名参数优先，补入参数跳过空值。 来源：`d340-create`、`d340-merge`、`d340-init-params`、`d340-cache-params`、`d340-protocol-length`、`d340-protocol-write`。

注册与setter：`ngx_http_upstream_param_set_slot`；新增锚点：`d340-setter` → nginx/src/http/ngx_http_upstream.c:6586–6626；`d340-create` → nginx/src/http/modules/ngx_http_scgi_module.c:1277–1340；`d340-merge` → nginx/src/http/modules/ngx_http_scgi_module.c:1655–1678；`d340-init-params` → nginx/src/http/modules/ngx_http_scgi_module.c:1714–1795；`d340-cache-params` → nginx/src/http/modules/ngx_http_scgi_module.c:458–467；`d340-protocol-length` → nginx/src/http/modules/ngx_http_scgi_module.c:651–662；`d340-protocol-write` → nginx/src/http/modules/ngx_http_scgi_module.c:805–814。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_scgi_module--scgi_pass_header

- `defaults`：`verified`；未额外配置允许透传列表；仍执行协议内建隐藏头集合，除非祖先或本层配置相应 pass_header。 来源：`d340-create`、`d340-header-builtins`、`d340-header-call`、`d340-header-merge`。
- `inheritance`：`verified`；scgi_pass_header 在子层未声明时整体继承父层同类列表；子层任一声明建立本层数组，不追加父同类数组。同层多条声明追加。hide/pass 两类各自独立继承，最终先加入内建及有效 hide 列表，再由有效 pass 列表移除同名项。 来源：`d340-setter`、`d340-header-call`、`d340-header-merge`。

注册与setter：`ngx_conf_set_str_array_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1093–1125；`d340-create` → nginx/src/http/modules/ngx_http_scgi_module.c:1277–1340；`d340-header-builtins` → nginx/src/http/modules/ngx_http_scgi_module.c:445–453；`d340-header-call` → nginx/src/http/modules/ngx_http_scgi_module.c:1628–1637；`d340-header-merge` → nginx/src/http/ngx_http_upstream.c:6630–6749。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_scgi_module--scgi_hide_header

- `defaults`：`verified`；无额外配置时内建隐藏集合为 Status、X-Accel-Expires、X-Accel-Redirect、X-Accel-Limit-Rate、X-Accel-Buffering、X-Accel-Charset；不是默认透传所有响应头。 来源：`d340-create`、`d340-header-builtins`、`d340-header-call`、`d340-header-merge`。
- `inheritance`：`verified`；scgi_hide_header 在子层未声明时整体继承父层同类列表；子层任一声明建立本层数组，不追加父同类数组。同层多条声明追加。hide/pass 两类各自独立继承，最终先加入内建及有效 hide 列表，再由有效 pass 列表移除同名项。 来源：`d340-setter`、`d340-header-call`、`d340-header-merge`。

注册与setter：`ngx_conf_set_str_array_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1093–1125；`d340-create` → nginx/src/http/modules/ngx_http_scgi_module.c:1277–1340；`d340-header-builtins` → nginx/src/http/modules/ngx_http_scgi_module.c:445–453；`d340-header-call` → nginx/src/http/modules/ngx_http_scgi_module.c:1628–1637；`d340-header-merge` → nginx/src/http/ngx_http_upstream.c:6630–6749。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_image_filter_module--image_filter_sharpen

- `inheritance`：`verified`；子层sharpen仍为未设置时继承父层数值，父层也未设置则取0；仅在这个分支且子层shcv为空时复制父层动态表达式。子层显式常量阻止父表达式继承，子层自己的动态表达式优先用于运行时求值。同层先配置动态值再配置常量不会清空已有shcv，不能一概解释为最后一个常量覆盖动态值。 来源：`registration`、`d340-setter`、`d340-create`、`d340-merge`、`d340-sharpen-use`、`d340-value`。

注册与setter：`ngx_http_image_filter_sharpen`；新增锚点：`d340-setter` → nginx/src/http/modules/ngx_http_image_filter_module.c:1619–1662；`d340-create` → nginx/src/http/modules/ngx_http_image_filter_module.c:1275–1307；`d340-merge` → nginx/src/http/modules/ngx_http_image_filter_module.c:1311–1368；`d340-sharpen-use` → nginx/src/http/modules/ngx_http_image_filter_module.c:1045–1048；`d340-value` → nginx/src/http/modules/ngx_http_image_filter_module.c:1238–1252。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_perl_module--perl_modules

- `defaults`：`verified`；未配置时modules初值为未设置：若构建定义了NGX_PERL_MODULES，初始化时以该编译路径建立列表，按prefix补全相对路径，并在创建解释器时传入-I；若未定义该宏，本指令不额外传入-I。显式perl_modules列表取代这一自动列表；不能把文档空默认解释成Perl没有模块搜索路径。 来源：`registration`、`d340-setter`、`d340-create`、`d340-init`、`d340-modules-init`、`d340-interpreter-args`、`d340-build-path`。

注册与setter：`ngx_conf_set_str_array_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1093–1125；`d340-create` → nginx/src/http/modules/perl/ngx_http_perl_module.c:846–859；`d340-init` → nginx/src/http/modules/perl/ngx_http_perl_module.c:863–874；`d340-modules-init` → nginx/src/http/modules/perl/ngx_http_perl_module.c:485–543；`d340-interpreter-args` → nginx/src/http/modules/perl/ngx_http_perl_module.c:610–632；`d340-build-path` → nginx/auto/lib/perl/conf:71–75。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_perl_module--perl

- `inheritance`：`verified`；子层未编译自己的sub时，模块merge将父层sub与handler名称一起复制；子层有自己的sub则不复制。但这只说明Perl模块数据的继承：安装core内容处理器发生在显式perl的setter，core不向独立子location合并handler，不能据此断言未写perl的子location会自动执行父Perl处理器。 来源：`registration`、`d340-setter`、`d340-create`、`d340-merge`、`d340-location-create`、`d340-core-create`、`d340-core-merge-before`、`d340-core-merge-after`、`d340-location-select`、`d340-handler-select`。

注册与setter：`ngx_http_perl`；新增锚点：`d340-setter` → nginx/src/http/modules/perl/ngx_http_perl_module.c:964–1014；`d340-create` → nginx/src/http/modules/perl/ngx_http_perl_module.c:929–945；`d340-merge` → nginx/src/http/modules/perl/ngx_http_perl_module.c:949–960；`d340-location-create` → nginx/src/http/ngx_http_core_module.c:3052–3083；`d340-core-create` → nginx/src/http/ngx_http_core_module.c:3548–3555；`d340-core-merge-before` → nginx/src/http/ngx_http_core_module.c:3669–3778；`d340-core-merge-after` → nginx/src/http/ngx_http_core_module.c:3782–3954；`d340-location-select` → nginx/src/http/ngx_http_core_module.c:950–979；`d340-handler-select` → nginx/src/http/ngx_http_core_module.c:1381–1383。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_stream_core_module--server_name

- `inheritance`：`verified`；仅 stream.server；每个 server 独立初始化名称数组，merge_srv_conf 不复制父名称列表；本 server 无名称时补空名。同一 server 多条 server_name 追加，其他 server 的名称不会继承过来。 来源：`registration`、`d340-create`、`d340-setter`、`d340-merge`。

注册与setter：`ngx_stream_core_server_name`；新增锚点：`d340-setter` → nginx/src/stream/ngx_stream_core_module.c:1284–1381；`d340-create` → nginx/src/stream/ngx_stream_core_module.c:679–711；`d340-merge` → nginx/src/stream/ngx_stream_core_module.c:763–795。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_stream_return_module--return

- `inheritance`：`verified`；只允许在stream server内配置；每个server独立创建返回文本配置，模块没有merge_srv_conf，不从其他server复制文本或复杂值。setter仅为当前server安装return处理器，stream core merge不复制handler；这不是HTTP rewrite脚本return的继承机制。 来源：`registration`、`d340-setter`、`d340-create`、`d340-module-context`、`d340-server-create`、`d340-core-create`、`d340-core-merge`。

注册与setter：`ngx_stream_return`；新增锚点：`d340-setter` → nginx/src/stream/ngx_stream_return_module.c:189–218；`d340-create` → nginx/src/stream/ngx_stream_return_module.c:175–185；`d340-module-context` → nginx/src/stream/ngx_stream_return_module.c:43–52；`d340-server-create` → nginx/src/stream/ngx_stream_core_module.c:819–849；`d340-core-create` → nginx/src/stream/ngx_stream_core_module.c:679–711；`d340-core-merge` → nginx/src/stream/ngx_stream_core_module.c:715–795。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_stream_pass_module--pass

- `inheritance`：`verified`；只允许在stream server内配置；每个server独立创建pass配置，模块没有merge_srv_conf，也不从其他server复制静态地址或动态地址表达式。setter仅为当前server安装pass处理器，stream core merge不复制handler；不能把HTTP代理或upstream的继承规则套用到此处。 来源：`registration`、`d340-setter`、`d340-create`、`d340-module-context`、`d340-server-create`、`d340-core-create`、`d340-core-merge`。

注册与setter：`ngx_stream_pass`；新增锚点：`d340-setter` → nginx/src/stream/ngx_stream_pass_module.c:266–336；`d340-create` → nginx/src/stream/ngx_stream_pass_module.c:245–262；`d340-module-context` → nginx/src/stream/ngx_stream_pass_module.c:43–52；`d340-server-create` → nginx/src/stream/ngx_stream_core_module.c:819–849；`d340-core-create` → nginx/src/stream/ngx_stream_core_module.c:679–711；`d340-core-merge` → nginx/src/stream/ngx_stream_core_module.c:715–795。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_uwsgi_module--uwsgi_pass

- `defaults`：`verified`；没有默认uwsgi目标；未显式配置且无特殊上下文目标传播时，不由本指令安装内容handler。 来源：`d340-create`、`d340-setter`、`d340-merge`。
- `inheritance`：`verified`；仅noname且本层静态目标及uwsgi脚本均为空时继承父目标、脚本和SSL标志；普通子location不走该分支。limit_except取得目标且无handler时补装uwsgi handler；显式uwsgi_pass保留本层设置。 来源：`d340-setter`、`d340-merge`。

注册与setter：`ngx_http_uwsgi_pass`；新增锚点：`d340-setter` → nginx/src/http/modules/ngx_http_uwsgi_module.c:2202–2283；`d340-create` → nginx/src/http/modules/ngx_http_uwsgi_module.c:1505–1583；`d340-merge` → nginx/src/http/modules/ngx_http_uwsgi_module.c:1929–1948。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_uwsgi_module--uwsgi_store

- `defaults`：`verified`；off；无本层和祖先设置时store合并为0。 来源：`d340-create`、`d340-merge`。
- `inheritance`：`verified`；本层store未设置时连同父路径脚本继承；显式off/on/路径覆盖。显式uwsgi_cache启用会先把本层store置0，显式store启用则关闭cache；同层同时启用由setter拒绝。 来源：`d340-setter`、`d340-merge`、`d340-cache-setter`。

注册与setter：`ngx_http_uwsgi_store`；新增锚点：`d340-setter` → nginx/src/http/modules/ngx_http_uwsgi_module.c:2287–2337；`d340-create` → nginx/src/http/modules/ngx_http_uwsgi_module.c:1505–1583；`d340-merge` → nginx/src/http/modules/ngx_http_uwsgi_module.c:1597–1614。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

返修补证（B01）：B01补证：追加对应cache setter，闭合先store再cache被拒绝的方向，原store setter保留以证明反向。 新增锚点：`d340-cache-setter` → nginx/src/http/modules/ngx_http_uwsgi_module.c:2343–2398。 本次新增引用的固定片段经实际补丁回放核对均保持原文；事实正文及非退回字段不变。

## nginx--ngx_http_uwsgi_module--uwsgi_limit_rate

- `defaults`：`verified`；0，不限制缓冲读取速率；缺少配置时以NULL复杂值进入共享求值函数，得到调用点默认0。 来源：`d340-merge`、`d340-complex-size`、`d340-rate-use`、`d340-rate-branch`。
- `inheritance`：`verified`；子层未设置时继承父复杂值指针，显式数值/变量表达式覆盖；请求阶段才计算变量值，失败或无效大小使用默认0，而不是继承某次已求得速率。 来源：`d340-setter`、`d340-complex-setter`、`d340-merge`、`d340-complex-size`。

注册与setter：`ngx_http_set_complex_value_size_slot`；新增锚点：`d340-setter` → nginx/src/http/ngx_http_script.c:317–343；`d340-create` → nginx/src/http/modules/ngx_http_uwsgi_module.c:1505–1583；`d340-merge` → nginx/src/http/modules/ngx_http_uwsgi_module.c:1659–1660；`d340-complex-setter` → nginx/src/http/ngx_http_script.c:243–275；`d340-complex-size` → nginx/src/http/ngx_http_script.c:108–135；`d340-rate-use` → nginx/src/http/ngx_http_upstream.c:3230–3240；`d340-rate-branch` → nginx/src/event/ngx_event_pipe.c:205–222。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_uwsgi_module--uwsgi_cache

- `defaults`：`verified`；off；仅NGX_HTTP_CACHE构建存在相应配置，缺省合并为0。 来源：`d340-create`、`d340-merge`。
- `inheritance`：`verified`；本层未设置cache时继承父开关、静态区和动态区表达式；显式off或区名/表达式覆盖。显式store开启会阻断父cache继承，显式cache开启会阻断父store继承。 来源：`d340-setter`、`d340-store-conflict`、`d340-merge`。

注册与setter：`ngx_http_uwsgi_cache`；新增锚点：`d340-setter` → nginx/src/http/modules/ngx_http_uwsgi_module.c:2343–2398；`d340-create` → nginx/src/http/modules/ngx_http_uwsgi_module.c:1505–1583；`d340-store-conflict` → nginx/src/http/modules/ngx_http_uwsgi_module.c:1597–1614；`d340-merge` → nginx/src/http/modules/ngx_http_uwsgi_module.c:1779–1799。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_uwsgi_module--uwsgi_cache_key

- `defaults`：`verified`；没有内建缓存键表达式；祖先也无key时保持空，启用uwsgi_cache将告警缺少uwsgi_cache_key，不自动采用HTTP proxy键。 来源：`d340-create`、`d340-merge`、`d340-key-use`。

注册与setter：`ngx_http_uwsgi_cache_key`；新增锚点：`d340-setter` → nginx/src/http/modules/ngx_http_uwsgi_module.c:2402–2426；`d340-create` → nginx/src/http/modules/ngx_http_uwsgi_module.c:1505–1583；`d340-merge` → nginx/src/http/modules/ngx_http_uwsgi_module.c:1837–1844；`d340-key-use` → nginx/src/http/modules/ngx_http_uwsgi_module.c:825–842。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_uwsgi_module--uwsgi_cache_path

- `defaults`：`verified`；未设置时不创建uwsgi缓存路径或keys_zone。显式声明必须提供路径与keys_zone；省略可选参数时无目录分级、use_temp_path=on、inactive=600s、max_size为NGX_MAX_OFF_T_VALUE、min_free=0，manager/loader各100文件、200ms阈值、50ms间隔。 来源：`registration`、`d340-create`、`d340-setter`。

注册与setter：`ngx_http_file_cache_set_slot`；新增锚点：`d340-setter` → nginx/src/http/ngx_http_file_cache.c:2379–2722；`d340-create` → nginx/src/http/modules/ngx_http_uwsgi_module.c:1482–1501。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_uwsgi_module--uwsgi_temp_path

- `defaults`：`verified`；构建时NGX_HTTP_UWSGI_TEMP_PATH，未指定构建路径时为uwsgi_temp；默认分级1:2，相对路径按运行前缀补全。 来源：`d340-path-default`、`d340-build-path`、`d340-merge`、`d340-path-merge`。
- `inheritance`：`verified`；子层未设置时复用父路径对象（包括分级）；父也无对象才采用构建路径和1:2。显式配置使用本层路径对象，不能与父路径拼接。 来源：`d340-setter`、`d340-merge`、`d340-path-merge`。

注册与setter：`ngx_conf_set_path_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_file.c:361–417；`d340-create` → nginx/src/http/modules/ngx_http_uwsgi_module.c:1505–1583；`d340-path-default` → nginx/src/http/modules/ngx_http_uwsgi_module.c:639–641；`d340-merge` → nginx/src/http/modules/ngx_http_uwsgi_module.c:1771–1777；`d340-build-path` → nginx/auto/options:633–638；`d340-path-merge` → nginx/src/core/ngx_file.c:421–456。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_uwsgi_module--uwsgi_param

- `defaults`：`verified`；本层及祖先都未配置时普通参数集合为空，不自动读取uwsgi_params文件；请求头自动转发独立控制。启用缓存时额外补入HTTP_IF_*及HTTP_RANGE/HTTP_IF_RANGE缓存参数，用户同名项优先，补入项跳过空值。 来源：`d340-create`、`d340-merge`、`d340-init-params`、`d340-cache-params`。

注册与setter：`ngx_http_upstream_param_set_slot`；新增锚点：`d340-setter` → nginx/src/http/ngx_http_upstream.c:6586–6626；`d340-create` → nginx/src/http/modules/ngx_http_uwsgi_module.c:1505–1583；`d340-merge` → nginx/src/http/modules/ngx_http_uwsgi_module.c:1953–1976；`d340-init-params` → nginx/src/http/modules/ngx_http_uwsgi_module.c:2012–2093；`d340-cache-params` → nginx/src/http/modules/ngx_http_uwsgi_module.c:625–634。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_uwsgi_module--uwsgi_pass_header

- `defaults`：`verified`；未额外配置允许透传列表；仍执行协议内建隐藏头集合，除非祖先或本层配置相应 pass_header。 来源：`d340-create`、`d340-header-builtins`、`d340-header-call`、`d340-header-merge`。
- `inheritance`：`verified`；uwsgi_pass_header 在子层未声明时整体继承父层同类列表；子层任一声明建立本层数组，不追加父同类数组。同层多条声明追加。hide/pass 两类各自独立继承，最终先加入内建及有效 hide 列表，再由有效 pass 列表移除同名项。 来源：`d340-setter`、`d340-header-call`、`d340-header-merge`。

注册与setter：`ngx_conf_set_str_array_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1093–1125；`d340-create` → nginx/src/http/modules/ngx_http_uwsgi_module.c:1505–1583；`d340-header-builtins` → nginx/src/http/modules/ngx_http_uwsgi_module.c:613–620；`d340-header-call` → nginx/src/http/modules/ngx_http_uwsgi_module.c:1918–1927；`d340-header-merge` → nginx/src/http/ngx_http_upstream.c:6630–6749。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。固定文档称默认隐藏Status，但固定ngx_http_uwsgi_hide_headers数组未列Status。此次仅陈述实际数组，不改原有非目标字段；差异交主线程判断。

## nginx--ngx_http_uwsgi_module--uwsgi_hide_header

- `defaults`：`verified`；无额外配置时内建隐藏集合为 X-Accel-Expires、X-Accel-Redirect、X-Accel-Limit-Rate、X-Accel-Buffering、X-Accel-Charset（按固定源码隐藏数组逐项列出，不据文档泛称添加Status）；不是默认透传所有响应头。 来源：`d340-create`、`d340-header-builtins`、`d340-header-call`、`d340-header-merge`。
- `inheritance`：`verified`；uwsgi_hide_header 在子层未声明时整体继承父层同类列表；子层任一声明建立本层数组，不追加父同类数组。同层多条声明追加。hide/pass 两类各自独立继承，最终先加入内建及有效 hide 列表，再由有效 pass 列表移除同名项。 来源：`d340-setter`、`d340-header-call`、`d340-header-merge`。

注册与setter：`ngx_conf_set_str_array_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1093–1125；`d340-create` → nginx/src/http/modules/ngx_http_uwsgi_module.c:1505–1583；`d340-header-builtins` → nginx/src/http/modules/ngx_http_uwsgi_module.c:613–620；`d340-header-call` → nginx/src/http/modules/ngx_http_uwsgi_module.c:1918–1927；`d340-header-merge` → nginx/src/http/ngx_http_upstream.c:6630–6749。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。固定文档称默认隐藏Status，但固定ngx_http_uwsgi_hide_headers数组未列Status。此次仅陈述实际数组，不改原有非目标字段；差异交主线程判断。

## nginx--ngx_http_grpc_module--grpc_pass

- `defaults`：`verified`；没有默认gRPC目标；无显式设置且无noname传播时，不由本模块安装gRPC内容handler。 来源：`d340-create`、`d340-setter`、`d340-merge`。
- `inheritance`：`verified`；本层为noname且静态目标、grpc动态脚本均为空时才复制父目标、host、脚本和SSL标志；普通子location不沿该分支继承。limit_except取得目标且无handler时补装gRPC handler；显式grpc_pass覆盖目标。 来源：`d340-setter`、`d340-merge`。

注册与setter：`ngx_http_grpc_pass`；新增锚点：`d340-setter` → nginx/src/http/modules/ngx_http_grpc_module.c:4750–4847；`d340-create` → nginx/src/http/modules/ngx_http_grpc_module.c:4338–4413；`d340-merge` → nginx/src/http/modules/ngx_http_grpc_module.c:4525–4545。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_grpc_module--grpc_set_header

- `defaults`：`verified`；无本层或祖先用户列表时，使用内建头集合：Content-Length=$content_length、TE=$grpc_internal_trailers；Host、Connection、Transfer-Encoding、Keep-Alive、Expect、Upgrade的内建值为空，不生成对应普通请求头。用户列表存在时仍补齐未显式提供的内建键，不是追加任意CGI/HTTP默认参数表。 来源：`d340-create`、`d340-header-builtins`、`d340-merge`、`d340-header-init`。

注册与setter：`ngx_conf_set_keyval_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1129–1163；`d340-create` → nginx/src/http/modules/ngx_http_grpc_module.c:4338–4413；`d340-header-builtins` → nginx/src/http/modules/ngx_http_grpc_module.c:503–513；`d340-merge` → nginx/src/http/modules/ngx_http_grpc_module.c:4547–4570；`d340-header-init` → nginx/src/http/modules/ngx_http_grpc_module.c:4617–4675。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_grpc_module--grpc_pass_header

- `defaults`：`verified`；未额外配置允许透传列表；仍执行协议内建隐藏头集合，除非祖先或本层配置相应 pass_header。 来源：`d340-create`、`d340-header-builtins`、`d340-header-call`、`d340-header-merge`。
- `inheritance`：`verified`；grpc_pass_header 在子层未声明时整体继承父层同类列表；子层任一声明建立本层数组，不追加父同类数组。同层多条声明追加。hide/pass 两类各自独立继承，最终先加入内建及有效 hide 列表，再由有效 pass 列表移除同名项。 来源：`d340-setter`、`d340-header-call`、`d340-header-merge`。

注册与setter：`ngx_conf_set_str_array_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1093–1125；`d340-create` → nginx/src/http/modules/ngx_http_grpc_module.c:4338–4413；`d340-header-builtins` → nginx/src/http/modules/ngx_http_grpc_module.c:516–525；`d340-header-call` → nginx/src/http/modules/ngx_http_grpc_module.c:4514–4523；`d340-header-merge` → nginx/src/http/ngx_http_upstream.c:6630–6749。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_grpc_module--grpc_hide_header

- `defaults`：`verified`；无额外配置时内建隐藏集合为 Date、Server、X-Accel-Expires、X-Accel-Redirect、X-Accel-Limit-Rate、X-Accel-Buffering、X-Accel-Charset；不是默认透传所有响应头。 来源：`d340-create`、`d340-header-builtins`、`d340-header-call`、`d340-header-merge`。
- `inheritance`：`verified`；grpc_hide_header 在子层未声明时整体继承父层同类列表；子层任一声明建立本层数组，不追加父同类数组。同层多条声明追加。hide/pass 两类各自独立继承，最终先加入内建及有效 hide 列表，再由有效 pass 列表移除同名项。 来源：`d340-setter`、`d340-header-call`、`d340-header-merge`。

注册与setter：`ngx_conf_set_str_array_slot`；新增锚点：`d340-setter` → nginx/src/core/ngx_conf_file.c:1093–1125；`d340-create` → nginx/src/http/modules/ngx_http_grpc_module.c:4338–4413；`d340-header-builtins` → nginx/src/http/modules/ngx_http_grpc_module.c:516–525；`d340-header-call` → nginx/src/http/modules/ngx_http_grpc_module.c:4514–4523；`d340-header-merge` → nginx/src/http/ngx_http_upstream.c:6630–6749。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_http_memcached_module--memcached_pass

- `defaults`：`verified`；没有默认Memcached目标；配置创建时upstream指针为空，只有显式setter安装本模块内容handler，不能把默认端口或示例地址当默认目标。 来源：`d340-create`、`d340-setter`、`d340-core-create`。
- `inheritance`：`verified`；本层upstream指针为空时直接继承父目标，key变量索引未设置时也继承父索引，不以noname为条件；显式memcached_pass使用本层目标及索引。此模块merge不复制HTTP core内容handler，目标对象继承本身不代表子location会自动运行Memcached handler。 来源：`d340-setter`、`d340-merge`、`d340-core-handler`、`d340-core-create`、`d340-location-create`、`d340-core-merge-before`、`d340-core-merge-after`、`d340-location-select`、`implementation-6`。

注册与setter：`ngx_http_memcached_pass`；新增锚点：`d340-setter` → nginx/src/http/modules/ngx_http_memcached_module.c:697–736；`d340-create` → nginx/src/http/modules/ngx_http_memcached_module.c:591–637；`d340-merge` → nginx/src/http/modules/ngx_http_memcached_module.c:682–690；`d340-core-handler` → nginx/src/http/ngx_http_core_module.c:1252–1262；`d340-core-create` → nginx/src/http/ngx_http_core_module.c:3548–3555。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

返修补证（B04）：B04补证：完整读取core merge确认不复制handler；引用其前后两段，略去仅合并error_pages的3779–3781（实际no_error_pages补丁亦仅调整该无关字段）。补独立location创建、请求handler清空与重新选择；复用已有core创建和implementation-6。 新增锚点：`d340-location-create` → nginx/src/http/ngx_http_core_module.c:3052–3083；`d340-core-merge-before` → nginx/src/http/ngx_http_core_module.c:3669–3778；`d340-core-merge-after` → nginx/src/http/ngx_http_core_module.c:3782–3954；`d340-location-select` → nginx/src/http/ngx_http_core_module.c:950–979。 本次新增引用的固定片段经实际补丁回放核对均保持原文；事实正文及非退回字段不变。

## nginx--ngx_mail_module--mail

- `defaults`：`verified`；没有隐式mail配置块；未配置就不经本块创建邮件模块上下文、server及监听项。显式空mail块的server和listen列表初始为空，不自动补出邮件服务。 来源：`registration`、`d340-setter`、`d340-main-create`。
- `inheritance`：`not_applicable`；mail只允许在main层出现，重复声明被setter拒绝，不存在父mail块向子mail块继承。块内共享main_conf，并由各邮件模块将mail层的空server配置与每个显式server配置合并；这不是mail块本身的值继承。 来源：`registration`、`d340-setter`。

注册与setter：`ngx_mail_block`；新增锚点：`d340-setter` → nginx/src/mail/ngx_mail.c:67–221；`d340-main-create` → nginx/src/mail/ngx_mail_core_module.c:127–150；`d340-server-create` → nginx/src/mail/ngx_mail_core_module.c:154–181。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_mail_core_module--server

- `defaults`：`verified`；未配置时不自动建立mail server。每个显式server独立创建各邮件模块的server配置，并必须在本块声明listen，否则配置解析失败。 来源：`registration`、`d340-setter`、`d340-main-create`、`d340-create`。
- `inheritance`：`verified`；各server共享mail的main_conf，但分别创建srv_conf，不从前一个server复制配置。解析后按每个模块自己的merge_srv_conf，将mail层的空server配置与本server合并；协议等字段仍遵循各自特殊分支，不能把整个块解释为统一覆盖或继承。 来源：`registration`、`d340-setter`、`d340-mail-context`、`d340-create`、`d340-core-merge`。

注册与setter：`ngx_mail_core_server`；新增锚点：`d340-setter` → nginx/src/mail/ngx_mail_core_module.c:224–300；`d340-mail-context` → nginx/src/mail/ngx_mail.c:67–221；`d340-main-create` → nginx/src/mail/ngx_mail_core_module.c:127–150；`d340-create` → nginx/src/mail/ngx_mail_core_module.c:154–181；`d340-core-merge` → nginx/src/mail/ngx_mail_core_module.c:185–220。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_mail_core_module--listen

- `defaults`：`verified`；未配置时不生成默认监听地址或端口，显式mail server缺少listen会报错。显式listen的新记录清零后，将backlog设为NGX_LISTEN_BACKLOG、rcvbuf和sndbuf设为-1；启用IPv6构建时ipv6only初始为1，其他可选设置由参数分支改变。 来源：`registration`、`d340-setter`、`d340-main-create`、`d340-create`、`d340-server`。
- `inheritance`：`verified`；只允许在mail server中声明；每条listen将带有当前server上下文的记录加入mail主监听列表，不从mail层或其他server继承监听地址与参数。一个server可以有自己的多条listen，但不能以其他server的listen满足本server的必填检查。 来源：`registration`、`d340-setter`、`d340-server`、`d340-mail-context`。

注册与setter：`ngx_mail_core_listen`；新增锚点：`d340-setter` → nginx/src/mail/ngx_mail_core_module.c:304–621；`d340-main-create` → nginx/src/mail/ngx_mail_core_module.c:127–150；`d340-create` → nginx/src/mail/ngx_mail_core_module.c:154–181；`d340-server` → nginx/src/mail/ngx_mail_core_module.c:224–300；`d340-mail-context` → nginx/src/mail/ngx_mail.c:67–221。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。

## nginx--ngx_mail_core_module--protocol

- `defaults`：`verified`；未显式配置时protocol初始为空，listen按已编译邮件模块的端口表推断：IMAP为143/993，POP3为110/995，SMTP为25/465/587；对应模块未编译就不参与推断。直到merge仍为空则报unknown mail protocol，不存在统一的默认IMAP或SMTP。 来源：`registration`、`d340-create`、`d340-merge`、`d340-listen`、`d340-imap-ports`、`d340-pop3-ports`、`d340-smtp-ports`。
- `inheritance`：`verified`；每个server独立创建protocol指针，core merge不从父配置复制它。指针为空时listen才按端口推断，一旦已设置，后续listen不再重新推断；显式protocol按已编译模块名称设置当前server的指针，可以替换此前推断值，不从其他server继承。 来源：`registration`、`d340-setter`、`d340-create`、`d340-merge`、`d340-listen`、`d340-server`。

注册与setter：`ngx_mail_core_protocol`；新增锚点：`d340-setter` → nginx/src/mail/ngx_mail_core_module.c:625–654；`d340-create` → nginx/src/mail/ngx_mail_core_module.c:154–181；`d340-merge` → nginx/src/mail/ngx_mail_core_module.c:185–220；`d340-listen` → nginx/src/mail/ngx_mail_core_module.c:304–621；`d340-imap-ports` → nginx/src/mail/ngx_mail_imap_module.c:47–61；`d340-pop3-ports` → nginx/src/mail/ngx_mail_pop3_module.c:47–61；`d340-smtp-ports` → nginx/src/mail/ngx_mail_smtp_module.c:40–54；`d340-server` → nginx/src/mail/ngx_mail_core_module.c:224–300。

补丁：所有新增固定片段在本次实际回放后的源码中保持原文。
