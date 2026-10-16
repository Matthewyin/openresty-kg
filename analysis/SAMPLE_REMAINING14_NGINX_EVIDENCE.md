# 两样例剩余13项 NGINX 默认值与继承证据

日期：2026-10-13。对应 `SAMPLE_REMAINING14_PLAN.md` 阶段一；实施写集合仅 `knowledge/directives.json` 和本文。三批13项内容已落盘；待独立审核、主线程测试和实际发布验收，不冒称阶段一已收口。

## 深度交互：结论与边界

块头和解析动作不能套用普通配置字段的默认值、继承模型。没有默认块不代表块内没有默认值；server/location 的内部模块配置合并，不等于整个块或匹配条件被继承。只补固定源码事实，不读取或复制部门原配置，不展开 include 文件，不实现 runtime 或提升 deep。

## 直接执行：固定来源与分批结果

已完整读取阶段一计划；固定来源为 nginx `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`（1.27.1）、nginx-docs `e8b581903e9d41252720053311cea687a5671674`（2024-08-15 快照）、OpenResty `8c37412c31621225e7aa7e825b5b50106c9c71c4`（1.27.1.1）。核对三个 HEAD；nginx 和文档工作树干净，OpenResty 仅已有未跟踪 tags，不作为证据。

所有身份 component 为 nginx；行号对应固定上游 revision，不使用补丁后行号。旧 evidence 保留，新 ID 同时追加到对应 patch_status.source_ids，原 status、note 和旧引用不变。http 的原 inheritance 已正确，逐字保留；其他第一批事实原为 unverified。固定文档已有 official-doc 交叉印证。

### 第一批：六项正文、状态与完整新增证据

#### ngx_http_core_module/server

默认值 not_applicable：这是显式建立 HTTP 虚拟服务器的块指令，没有可填入的标量默认值，也不会自动生成一个 server 块；http 层的空 srv_conf/loc_conf 是合并父配置，不是默认虚拟服务器。显式 server 未写 listen 时的隐式监听属于 listen 的默认规则。

继承 verified：server 块本身不从其他 server 复制；每个显式块新建各 HTTP 模块的 srv_conf/loc_conf，并共用 http 的 main_conf。解析后，各模块分别将 http 层父 srv_conf/loc_conf 合并到这个 server，再合并其 location；具体字段按各模块 merge 回调决定，不意味着所有指令一律继承。

| 新 source_id | 固定文件:行号 |
| --- | --- |
| server-context-create | src/http/ngx_http_core_module.c:2910–2983 |
| http-parent-context | src/http/ngx_http.c:152–215 |
| http-server-merge | src/http/ngx_http.c:562–613 |
| http-empty-servers | src/http/ngx_http_core_module.c:3383–3397 |

#### ngx_http_core_module/location

默认值 not_applicable：这是带匹配条件的显式配置块，没有默认 URI 或自动声明的 location /；server 创建的 loc_conf 是未匹配显式 location 时可用的配置，不等于生成一个 location 块。每个显式 location 的匹配条件由其参数建立。

继承 verified：显式 location 共用父级 main_conf/srv_conf，但新建每个 HTTP 模块的 loc_conf。合并从 server 的 loc_conf 开始，递归将直接父 location 的配置交给模块 merge_loc_conf；匹配条件及块本身不作为标量继承，各指令是否继承或替换由模块回调决定。

| 新 source_id | 固定文件:行号 |
| --- | --- |
| location-context-create | src/http/ngx_http_core_module.c:3052–3083 |
| location-match-definition | src/http/ngx_http_core_module.c:3085–3165 |
| location-parent-merge | src/http/ngx_http.c:624–665 |
| http-server-merge | src/http/ngx_http.c:591–609 |
| server-context-create | src/http/ngx_http_core_module.c:2910–2955 |

#### ngx_conf_module/include

默认值 not_applicable：include 是解析阶段的文件包含动作，没有默认包含文件或通配模式；只有显式传入 file/mask 时才调用文件解析。不能把发行包示例中的 include 当作默认动作。

继承 not_applicable：不保存可在子层合并的 include 配置值，因此没有 include 本身的层级继承。回调以当前 ngx_conf_t 解析被包含文件，文件内指令处于包含点的上下文；之后是否继承由那些指令的模块决定，不是再次继承或执行 include。

| 新 source_id | 固定文件:行号 |
| --- | --- |
| include-parse-context | src/core/ngx_conf_file.c:158–240 |

#### ngx_events_module/events

默认值 not_applicable：events 是显式事件配置块，不存在自动补出的默认 events 块或标量默认值；缺少该块时，事件模块初始化报 no "events" section in configuration。块内 worker_connections 等有各自默认值，不能代替块头默认。

继承 not_applicable：只在 main 建立唯一事件配置上下文；回调拒绝重复块，创建各事件模块配置、解析并逐个 init_conf，不执行父子 events 的 merge。块内配置的初始化不等于 events 块继承。

| 新 source_id | 固定文件:行号 |
| --- | --- |
| events-required | src/event/ngx_event.c:433–445 |
| events-single-init | src/event/ngx_event.c:987–1061 |

#### ngx_http_module/http

默认值 not_applicable：http 是显式启用 HTTP 配置上下文的块指令，没有标量默认值或自动创建的 http 块；回调创建的空 srv_conf/loc_conf 仅作为 server 配置合并的父对象，不是默认 server 或 location。

继承 not_applicable：原正文和 source_ids 逐字保留，不扩写已有正确事实。

| 新 source_id | 固定文件:行号 |
| --- | --- |
| http-block-context | src/http/ngx_http.c:133–144 |
| http-parent-context | src/http/ngx_http.c:152–215 |
| http-server-merge | src/http/ngx_http.c:562–613 |

#### ngx_stream_module/stream

默认值 not_applicable：stream 是显式建立流配置上下文的块指令，没有标量默认值，也不会自动生成 stream 块或默认 server。回调创建的空 srv_conf 是显式 server 的合并父配置，不是一个会话服务。

继承 not_applicable：只在 main 声明唯一 stream 块，回调拒绝重复，创建模块 main_conf 和父 srv_conf。stream 块本身没有父子层合并；显式 server 逐个调用模块 merge_srv_conf 接收 stream 层父配置，具体继承规则属于块内指令。

| 新 source_id | 固定文件:行号 |
| --- | --- |
| stream-context-create | src/stream/ngx_stream.c:102–166 |
| stream-server-merge | src/stream/ngx_stream.c:212–239 |
| stream-empty-servers | src/stream/ngx_stream_core_module.c:625–639 |

### 补丁核查与交接

按固定审计清单读取34个有效补丁的目标和 hunk，并在内存回放检查本批相关文件的最终摘要及18个新增片段保持原文。相关文件的变动集中于事件运行循环和 HTTP error_pages 等其他区段，本批配置创建、合并及 include 片段不变。本记录只核查本批事实，不声称全部 NGINX 文件或运行链均未受影响；不向工作区或临时目录写回放源码。

未编写或执行测试，未构建、未写 dist、未修改 VTS。实际发布、负例测试及独立审核由主线程统一完成；第一批落盘不代表阶段一已经验收。

### 第二批：listen、HTTP error_log 与 proxy_limit_rate

本批三项 defaults/inheritance 原均为 unverified；listen inheritance 判定为 not_applicable，其余五项事实为 verified。

#### ngx_http_core_module/listen

默认值 verified：显式 server 未写任何 listen 时补建 IPv4 wildcard（0.0.0.0）TCP 监听：非 Windows 在配置解析进程 getuid()==0 时用 80，否则用 8000；Windows 分支固定 80。这不是按 worker 的 user 身份选端口。显式 listen 仅给 IP 地址而省略端口时则默认 80，不使用上述权限分支。默认监听选项使用 NGX_LISTEN_BACKLOG（随平台定义），rcvbuf/sndbuf 为 -1（不指定覆盖值），支持相关能力时 setfib/fastopen 为 -1；显式监听在有 IPv6 支持时 ipv6only 默认为 1。未指定 default_server 时，新地址初始以第一个登记的 server 为默认；server_name 不决定该默认归属。

继承 not_applicable：listen 只在 HTTP server 中登记，不从 http、其他 server 或 location 继承监听地址；每个 server 都有自己的显式 listen 标记，未设置时走本 server 的补建分支。相同地址/端口的 server 会进入同一监听分组，参数和 default_server 在地址级合并或检查重复；共享监听不是父子配置继承。

| 新 source_id | 固定文件:行号 |
| --- | --- |
| listen-implicit | src/http/ngx_http_core_module.c:2985–3033 |
| listen-option-defaults | src/http/ngx_http_core_module.c:3958–4012 |
| listen-port-group | src/http/ngx_http.c:1178–1227 |
| listen-address-group | src/http/ngx_http.c:1253–1317 |
| listen-first-default | src/http/ngx_http.c:1423–1443 |

#### ngx_http_proxy_module/proxy_limit_rate

默认值 verified：有效默认速率为 0，即不限制每个请求从上游读取缓冲响应的速率。create_loc_conf 将 limit_rate 指针置为 NGX_CONF_UNSET_PTR，父子都未配置时 merge 得到 NULL，而非一个字面量 0 的表达式；缓冲路径调用 ngx_http_complex_value_size(..., 0)，NULL 求值返回 0。显式常量在配置阶段解析为 size，含变量的复杂值在请求阶段求值；求值失败或结果不是有效 size 时回退 0，非法 size 结果记录错误，这种回退不是继承父级值。

继承 verified：仅当本层 limit_rate 指针仍为 NGX_CONF_UNSET_PTR（未显式配置）时，继承父层复杂值指针；父层也未设置则取 NULL。显式子级表达式（包括常量 0 或含变量表达式）替换父级，不叠加、不取较小值；继承的是已编译表达式，不是父请求计算的数值。

| 新 source_id | 固定文件:行号 |
| --- | --- |
| proxy-rate-create | src/http/modules/ngx_http_proxy_module.c:3372–3374 |
| proxy-rate-merge | src/http/modules/ngx_http_proxy_module.c:3518–3519 |
| merge-pointer-rule | src/core/ngx_conf_file.h:210–213 |
| proxy-rate-expression-slot | src/http/ngx_http_script.c:243–275 |
| proxy-rate-size-slot | src/http/ngx_http_script.c:317–343 |
| proxy-rate-value-size | src/http/ngx_http_script.c:107–135 |

#### ngx_http_core_module/error_log

默认值 verified：本层未配置时不创建独立 HTTP 默认日志：loc_conf 的日志指针初始为空，merge 先共用父级日志指针；父级也没有日志时引用 cycle->new_log（main 日志链）。main 未配置日志时 cycle 默认文件日志为 error 级别，路径来自 cycle->error_log：未用启动参数覆盖时取构建常量 NGX_ERROR_LOG_PATH，未经定制的上游默认为 logs/error.log，配置为 stderr 的构建将路径置空并使用标准错误；相对文件路径按运行 prefix 补全。显式 HTTP error_log 省略 level 也默认 error，不能把全局默认路径说成每层独立文件。

继承 verified：仅在本层 error_log 指针为 NULL 时，直接引用父层 error_log 指针，父级也为空则引用 cycle->new_log；不是复制或逐个合并日志目的地。当前层显式配置先建立自己的日志链，因此不追加父级目的地；同一层多次 error_log 由 ngx_log_set_log 追加到本层链，与跨层继承分开。HTTP 的 http→server→location 和嵌套 location 通过模块 merge_loc_conf 传入直接父配置，不能套给 main 的同名身份。

| 新 source_id | 固定文件:行号 |
| --- | --- |
| http-log-create | src/http/ngx_http_core_module.c:3552–3555 |
| http-log-merge | src/http/ngx_http_core_module.c:3771–3777 |
| cycle-log-default | src/core/ngx_log.c:402–435 |
| cycle-log-path | src/core/nginx.c:1072–1078 |
| build-log-path | auto/options:627–631 |
| log-file-prefix | src/core/ngx_conf_file.c:886–914 |
| log-empty-stderr | src/core/ngx_conf_file.c:945–952 |
| http-log-parent-merge | src/http/ngx_http.c:591–609 |

补丁核查：同一固定集合内存回放后，本批19个新增片段保持原文，涉及文件摘要与审计记录一致。no_error_pages 改的是 error_pages 字段及邻近合并分支，不改变所引 error_log 指针合并；intercept_error_log 在输出时拦截，保留既有 verified_affected。proxy_host_port_vars 改变量注册标志，不改 limit_rate 创建、合并和复杂值求值；SSL/timeout 等上游补丁不改所引调用段。未声称整个日志或上游链未受影响。

### 第三批：四项 main 全局配置

四项 defaults/inheritance 原均为 unverified；defaults 均为 verified，inheritance 均为有正文和证据的 not_applicable。

#### ngx_core_module/worker_cpu_affinity

默认值 verified：未配置时 cpu_affinity 为 NULL、cpu_affinity_n 为 0、cpu_affinity_auto 为 0；ngx_get_cpu_affinity 返回 NULL，普通 worker 初始化不调用 ngx_setaffinity。因此默认不由该指令主动绑定 CPU，不等于强制允许全部 CPU，也不覆盖进程已有的操作系统 CPU 限制。auto 是显式配置才启用；无 NGX_HAVE_CPU_AFFINITY 的构建连显式指令也只告警并忽略，getter 返回 NULL。

继承 not_applicable：这是 main 的全局核心配置，cycle 创建一个 ngx_core_conf_t，worker 从该全局配置取 CPU 掩码；没有 HTTP/stream server/location 父子层级的合并。进程从操作系统保留已有 CPU 限制，不是 NGINX 配置层级继承。

| 新 source_id | 固定组件/文件:行号 |
| --- | --- |
| affinity-create | nginx / src/core/nginx.c:1094–1112 |
| affinity-getter-empty | nginx / src/core/nginx.c:1499–1513 |
| affinity-getter-platform | nginx / src/core/nginx.c:1544–1549 |
| affinity-platform-ignore | nginx / src/core/nginx.c:1487–1495 |
| core-cycle-create | nginx / src/core/ngx_cycle.c:231–245 |

#### ngx_core_module/pid

默认值 verified：未设置 pid 时取构建常量 NGX_PID_PATH；上游构建未定制 --pid-path 时为 logs/nginx.pid，再按运行 cycle->prefix 补全相对路径，绝对路径保持绝对。上游默认编译 prefix 是 /usr/local/nginx/，可被 --prefix 或启动 -p 改变；空编译 prefix 的构建在未给 -p 时用当前目录。锁定 OpenResty 包装脚本默认安装 prefix 为 /usr/local/openresty，非 msys 向 NGINX 传入其 nginx 子目录，msys 直接传入安装 prefix；不得把上游绝对路径或本机路径当作所有发行构建默认。

继承 not_applicable：只在 main 的单个 ngx_core_conf_t 中保存并初始化 pid 路径；没有父层 pid 或 HTTP/stream 子级的路径继承。缺省使用构建常量和当前运行 prefix 补全，不是从旧 cycle 或父 server 继承一个 pid 配置值。

| 新 source_id | 固定组件/文件:行号 |
| --- | --- |
| pid-core-create | nginx / src/core/nginx.c:1094–1112 |
| core-cycle-create | nginx / src/core/ngx_cycle.c:231–245 |
| build-path-options | nginx / auto/options:196–202 |
| build-pid-default | nginx / auto/options:620–625 |
| build-prefix-pid-macros | nginx / auto/configure:66–87 |
| runtime-prefix | nginx / src/core/nginx.c:995–1047 |
| path-prefix-select | nginx / src/core/ngx_conf_file.c:886–894 |
| path-full-name | nginx / src/core/ngx_file.c:21–54 |
| distribution-prefix-default | openresty / util/configure:126–126 |
| distribution-nginx-prefix | openresty / util/configure:384–389 |
| distribution-configure-prefix | openresty / util/configure:417–420 |

#### ngx_core_module/worker_rlimit_nofile

默认值 verified：未配置时 rlimit_nofile 为 NGX_CONF_UNSET，worker 初始化跳过本项 setrlimit(RLIMIT_NOFILE) 分支，保留进程已有的系统资源限制；没有固定的 NGINX 默认文件数。只有显式设置时才尝试同时改变软、硬限制，调用失败则记录日志，不代表已经获得该额度。

继承 not_applicable：这是 main 层的全局核心配置，不存在 HTTP/stream 子层的配置合并。worker 保留启动进程传下的操作系统 RLIMIT_NOFILE，与 NGINX 指令的父子层级继承不同；未设值的行为由 UNSET 与条件 setrlimit 决定。

| 新 source_id | 固定组件/文件:行号 |
| --- | --- |
| nofile-create | nginx / src/core/nginx.c:1122–1123 |
| core-cycle-create | nginx / src/core/ngx_cycle.c:231–245 |

#### ngx_errlog_module/error_log

默认值 verified：main 未配置日志时，ngx_log_open_default 为 cycle->new_log 建立 error 级别的默认文件日志；cycle->error_log 未用启动 -e 覆盖时取构建 NGX_ERROR_LOG_PATH，上游未定制 --error-log-path 时为 logs/error.log，构建参数 stderr 将该常量置空，-e stderr 也置空并使用标准错误。相对文件路径由运行 prefix 补全，不固定为某个绝对部署路径。若 main 只配置 syslog/memory（调试构建）等无文件的目的地，仍补入默认文件日志（error 级别）；若已有文件日志（包括 stderr）则不补。显式 error_log 省略 level 默认 error。启动期 ngx_log_init 的初始级别却是 notice，打开路径失败可退到 stderr；不能把它与配置成功后切换的 cycle 日志混为一谈。

继承 not_applicable：这是 main 的日志配置身份，配置回调直接操作当前 cycle->new_log；cycle 新建时该日志对象为零初始化，没有父层 error_log merge。同一 main 多条 error_log 在本层组成日志链，不从旧 cycle 继承配置列表。HTTP 等模块可引用此 cycle 日志作为父层为空时的兜底，那是各模块自己的继承规则，不能反过来描述成本条 main 指令的父子继承。

| 新 source_id | 固定组件/文件:行号 |
| --- | --- |
| cycle-log-default | nginx / src/core/ngx_log.c:402–435 |
| cycle-log-path | nginx / src/core/nginx.c:1072–1078 |
| build-log-path | nginx / auto/options:627–631 |
| build-log-macro | nginx / auto/configure:89–93 |
| startup-log-init | nginx / src/core/ngx_log.c:318–374 |
| startup-log-open-fallback | nginx / src/core/ngx_log.c:376–397 |
| startup-log-option | nginx / src/core/nginx.c:862–878 |
| log-file-prefix | nginx / src/core/ngx_conf_file.c:886–914 |
| log-empty-stderr | nginx / src/core/ngx_conf_file.c:945–952 |
| log-file-list | nginx / src/core/ngx_log.c:463–475 |
| log-default-level | nginx / src/core/ngx_log.c:478–487 |
| cycle-new-log-zero | nginx / src/core/ngx_cycle.c:75–83 |
| cycle-log-switch | nginx / src/core/ngx_cycle.c:359–361 |
| cycle-log-current | nginx / src/core/ngx_cycle.c:409–410 |

补丁核查：本批29个新增 NGINX 片段在固定有效集合内存回放后保持原文，涉及变动文件的摘要与既有审计一致；三个 OpenResty 包装脚本片段直接读取固定 revision。privileged_agent_process 及 connections 补丁在 core 创建/初始化时新增辅助进程字段，不改所引 pid/CPU 初始值、rlimit_nofile 未设值或默认路径；init_cycle_pool_release 与 proc_exit_handler 改 cycle/进程的其他生命周期区段；intercept_error_log 影响日志输出但不改所引默认路径/级别及 new_log 构造。保留各身份原 patch_status 状态、说明及旧引用。

## 冻结交接与只读边界核对

三批13项已完成并冻结，等待剩余四项独立审核及主线程整体 build/test；未经反馈不再修改这两个文件。VTS 由主线程负责，本角色不将它计入13项；不提前研究或实施 runtime。

本轮只读核对结果：13个三元身份唯一；共补齐25个原未核实事实（13个 defaults、12个 inheritance），http 原已核实 inheritance 逐字保留。当前13项 defaults 为7 verified、6 not_applicable，inheritance 为4 verified、9 not_applicable。69个新增 evidence（66个 NGINX、3个 OpenResty 包装脚本）逐项核对固定 Git 对象和有效范围，事实引用均存在，ID 不重复；patch 引用精确为旧引用加新增证据 ID。

所有其他身份序列的 JSON SHA-256 与实施前一致：`275535c214f1731afe4fbee0e49fa6c3a637347bcdfaf6af860aa2b8e11e55a1`。13项受保护字段逐项相等，旧 evidence 全部原样保留；patch_status.status/note 原样保留，只追加 source_ids。未改 legacy default、summary、syntax、limitations、phase、mechanism、availability、related 或任何评级/计数。

新增片段均对固定 revision 核对，内存补丁核查仅作为本批相关文件及66个 NGINX 片段的局部证明，不替代主线程既有全量补丁回放脚本。内存实现的全量摘要比较有一个范围外文件 `src/event/ngx_event_openssl.c` 未匹配既有审计摘要；本批不引用该文件，相关证据文件摘要与审计记录均匹配，没有把该范围外结果说成全量回放通过。三个 OpenResty 包装脚本证据独立绑定其固定 revision，不冒充 NGINX 补丁后源码。

只读核对不是自动测试或实际发布验证。本角色没有运行 build/test，没有修改测试、构建器、dist、extensions 或其他文件，也没有创建需要清理的临时源码目录；后续独立审核与实际发布结果由主线程填写在其验收记录中，不回写成本文已经完成的运行验证。

