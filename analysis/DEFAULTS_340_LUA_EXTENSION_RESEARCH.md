# 默认值与继承补证：Lua及扩展模块研究入口

日期：2026-10-15。本文供Sol实施与主线程独立审核定位使用，只写研究入口、已观察到的局部分支和待闭合条件，不代替逐字段证据记录，不将任何知识字段提前标为verified。

## 深度交互：先分机制，再补事实

本轮最容易误判的地方不是缺少merge函数位置，而是把不同配置对象混为一谈：允许写在http/server不表示存入main/server结构；变量动作可能编入rewrite数组；upstream配置虽然使用srv_conf，也不是普通虚拟主机继承；同名inline/block/file入口可能写同一个handler槽，但注册上下文与加载方式不同。最短可审计路径是先绑定注册项的callback、offset、post和实际目标对象，再沿未设置分支补证。

固定任务仍为 `analysis/DEFAULTS_340_MANIFEST.json`，基线 `1.27.1.1-f9f6f0ffb7eba3d8`。C组129身份、71默认值/129继承；E组94身份、45默认值/85继承，合计223身份、330字段。本次重新按items核数，并把18个组件的f9f6来源revision与 `analysis/components.json` 对齐，均一致。本文不另造范围；领取任务时按完整ID和manifest.fields筛选，不能把下文提到的关联指令自动加入写集。

以下文件路径相对对应组件仓库；组件位于 `repos/<component>`。行号均指表中固定Git对象，不保证与当前工作树一致。可用 `git -C repos/<component> show <revision>:<file>` 定位；不要执行来源生成器或上游配置脚本。函数名用于继续追踪，起始行不是已完成核实的充分证据范围。

## 直接执行：固定来源与模块计数

| 组件 | 完整revision | 身份/默认/继承 |
| --- | --- | --- |
| lua-nginx-module | ea09d92adf835e30cab8d79343c7b8266e888128 | 79/45/79 |
| stream-lua-nginx-module | 69f0cd762112a6e0cddb07f2b5192e9a65034a93 | 50/26/50 |
| echo-nginx-module | 8376edc2bbc427e8812d105f4061045449e0db2b | 18/18/18 |
| headers-more-nginx-module | 06dc0be56e5ec9f7fd814e881b066b5540a85bec | 4/3/1 |
| memc-nginx-module | b889a6fc3e18b784b454e1bc74e5d0b3513a07ce | 1/1/1 |
| srcache-nginx-module | be22ac0dcd9245aadcaca3220da96a0c1a0285a7 | 2/2/2 |
| ngx_devel_kit | 91e30eb05085e7f9762f130cbb883a0e753cf74d | 1/0/1 |
| set-misc-nginx-module | 31c4ad67bb9e392a734e4e58ea8048e24012311f | 26/9/26 |
| array-var-nginx-module | 32188f86599b47f7cd34340e5a2985bd9d550bf8 | 4/0/4 |
| form-input-nginx-module | 43ee690c359c06af7d178379cfc37ebc858d9de2 | 2/0/2 |
| rds-json-nginx-module | 2d7e07f7c39f98bbb2a8b07f4bae4d892f00329d | 1/1/1 |
| drizzle-nginx-module | fb6cf255d91135e18145a98a93947ead4e703b68 | 12/2/12 |
| iconv-nginx-module | 67d55c7edd3ab0535afa1e55ec8b2cdeb5167a82 | 1/1/1 |
| encrypted-session-nginx-module | 0f81b5728db0ece0f60c72354da69f158dc1d2a7 | 2/0/2 |
| redis-nginx-module | 411fef36e130129b670fa7f2672bcad6ab2cbdd3 | 2/1/2 |
| ngx_postgres | 681980598529f67fcec5c7448452046764a68429 | 10/0/10 |
| redis2-nginx-module | c989c829a2877132cb100f901e320921250e068d | 6/5/2 |
| nginx-module-vts | 52fe11e44c47a49b052be89e36dfa17d81bf52a5 | 2/2/0 |

公共Nginx为 `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`，发行OpenResty为 `8c37412c31621225e7aa7e825b5b50106c9c71c4`。Lua/NDK跨组件调用必须分别引用自己的revision。

## 共用高风险入口

### rewrite动作不是普通loc参数

NDK `src/ndk_set_var.c:256` 的 `ndk_set_var_name` 在267行明确取得 `ngx_http_rewrite_module` 的loc_conf；后续入口为 `ndk_set_var_filter:330`、`ndk_set_var_core:493`、`ndk_set_var_value_core:510`、`ndk_set_var_multi_value_core:532`，外层setter为559/574/590行。实施时需跟到代码数组追加和cmd->post调用，不能只引用NDK的变量注册。

Nginx `src/http/modules/ngx_http_rewrite_module.c`：`ngx_http_rewrite_handler:136` 在codes为空时返回；`ngx_http_rewrite_merge_loc_conf:239` 在子codes为空时直接返回，并没有在这个分支把prev->codes赋给子对象；`ngx_http_rewrite_init:272` 将handler挂入SERVER_REWRITE和REWRITE两阶段。`ngx_http_rewrite_if`中约590–620行明确把if内部指令编入同一数组，并区分server-if与location-if的loc_conf。需要再结合 `src/http/ngx_http.c` 配置创建/合并和 `src/http/ngx_http_core_module.c` 阶段推进，才可给具体动作写完整继承结论。

审核禁用“父server动作先执行，所以location继承了动作”“扩展有merge，所以动作按参数继承”“未设置动作等于变量默认空字符串”这三种跳跃。server阶段执行、嵌套location代码、if共享数组及请求变量值是不同问题。main级注册允许性也不直接证明代码会在每个请求执行。

适用待核对象：HTTP `set_by_lua*`、Set Misc的26项、Array Var四项、Form Input两项、set_iconv、两个Encrypted Session动作，以及需要独立判定实现的postgres_escape。共享机制可以复用精确片段，逐ID仍要证明其setter确实进入该路径。

### handler、参数与别名分别核对

pass/ret/content类指令既保存参数又可能安装core handler。参数复制不等于handler复制；没有目标参数也不等于必然安全地不执行。需要把模块merge、core配置初始化、实际请求入口取值三者闭合；遇到不一致记录为风险，不在本任务顺手修源码。

别名与共用setter要逐个比较注册context、args、offset、post、callback内对cmd->name的分支。Lua的inline/block/file应称同阶段不同输入形式，不能只改名称复制结论。TAKE12省略源参数时的原地赋值也不是别名。相邻废弃名称不在manifest中时只作解释依据，不扩大写集。

## C组：HTTP Lua（79项）

总入口 `src/ngx_http_lua_module.c` 的commands及module_ctx；创建/初始化为 `ngx_http_lua_create_main_conf:1010`、`ngx_http_lua_init_main_conf:1076`、`ngx_http_lua_create_srv_conf:1170`、`ngx_http_lua_merge_srv_conf:1222`、`ngx_http_lua_create_loc_conf:1378`、`ngx_http_lua_merge_loc_conf:1455`。

| 族及定位入口 | 已观察到的差异与必须补齐的证据 | 桌面审核重点 |
| --- | --- | --- |
| timers、regex、thread cache、SA restart、malloc trim、worker thread VM、no_postpone等main参数；module.c:1010–1165 | main初始化处理UNSET；PCRE、平台宏和线程缓存编译条件分别存在。逐注册offset确认main归属，不套用loc merge。 | 全局初始化与父子继承分开；平台条件仍显示。 |
| lua_shared_dict；directive.c `ngx_http_lua_shared_dict:80` | 跟main数组、共享区注册与重复名称处理；不能写成每个location复制一份共享字典。 | 默认缺省不虚构容量；共享注册不等于现场共享内存可用。 |
| lua_package_path/cpath；directive.c:200/221，module main创建与util.c的VM初始化 | 区分未设置、显式字符串、默认Lua搜索路径与替换规则；需继续追VM消费，不能把零初始化字符串作为最终搜索路径。 | 不输出未经环境确认的绝对路径。 |
| lua_load_resty_core；directive.c:189 | 已读到callback只告警deprecated并返回OK；继续交叉核VM强制加载路径。不能用旧开关语法推导on/off继承。 | 废弃入口语义明确，不冒称仍可关闭。 |
| init_by/init_worker_by/exit_worker_by系列；directive.c相应callback、initby/initworkerby/exitworkerby文件 | main handler槽与各生命周期分开；block委派、inline/file加载器分别绑定。module.c:753附近的测试配置/信号进程提前返回条件不应丢失。 | 缺省无脚本与执行时机分开，不能写loc继承。 |
| server_rewrite_by_lua_*；merge_srv_conf:1364–1370 | 当子server源码长度为0时复制server_rewrite的源码、handler及缓存关联字段；不是location rewrite槽。 | 明确server层级，与rewrite_by_lua区别。 |
| rewrite/access/content/log/header_filter/body_filter系列；merge_loc_conf:1460–1505 | 每个阶段分别按对应src.value.len判空并复制整套字段；不同阶段互不替代。callback重复判断与同阶段不同输入形式要逐项核；content另查core handler安装与实际取配置。 | 同阶段覆盖条件、空脚本拒绝和不同阶段独立性。 |
| set_by_lua*；directive.c:267/286/342 | block入口委派，inline路径末端调用ndk_set_var_multi_value_core；接上公共rewrite证据，不套用上行阶段handler的merge。 | 文案显示动作执行机制，不能写普通阶段脚本继承。 |
| SSL下游四族；merge_srv_conf:1233–1357，各ssl_*by文件 | ClientHello/certificate在合并后检查SSL ctx并可能报错；session store/fetch安装条件不同。需保持NGX_HTTP_SSL及OpenSSL/LibreSSL条件，不能统一成“未启用SSL则忽略”。 | 子server无SSL条件与session两族区别。 |
| balancer_by_lua_*、balancer_keepalive；balancer.c:149/168/287/1346 | upstream内配置使用srv对象中的balancer子结构；不是虚拟主机SSL/server_rewrite继承。create_srv_conf:1216置max_cached哨兵，默认须追balancer init。 | upstream作用域、替换初始化回调与缓存默认分开。 |
| socket、code_cache、body及header选项、HTTP/1.0等loc参数；merge_loc_conf:1547–1577 | 按实际成员和宏逐项绑定；“允许http/server”只是loc默认对象放置层级，不改成main参数。 | 时间单位、页大小等条件值及显式覆盖。 |
| Lua出站SSL参数；create_loc_conf:1441–1447、merge_loc_conf:1508–1543及set_ssl/merge_ssl | 证书数组与ssl_conf_commands使用UNSET_PTR；协议为bitmask，字符串另走string merge；命令最终设置顺序也影响解释。 | 不与下游TLS Lua脚本混淆，不丢数组整体覆盖条件。 |
| lua_capture_error_log；directive.c对应callback、log.c、main初始化 | 按buffer分配、是否配置拦截器及Nginx补丁追踪；不是普通日志目的地继承。 | 默认未注册与缺少编译支持分开。 |

以上覆盖79项的机制划分，不把族计数当身份清单。Sol须以manifest逐项映射，发现未落入明确机制者单列，不能强制归类。

## C组：stream Lua（50项）

总入口 `src/ngx_stream_lua_module.c`。main创建/初始化为698/761行，srv创建/合并为806/861行。结构或局部变量名出现loc_conf/llcf不代表stream存在HTTP location层级；以module_ctx和注册offset为准。

- main参数、共享字典、package及init系列分别从module.c:698–797和 `src/ngx_stream_lua_directive.c` 追踪；shared_dict:73、load_resty_core:181、package_cpath:194、package_path:216。不要把HTTP Lua源码作为stream事实证据。
- preread/log在merge_srv_conf:1018–1029按src.value.len分别继承。content族要单独处理：directive.c `ngx_stream_lua_content_by_lua_block:358`、`ngx_stream_lua_content_by_lua:377`，后者保存content_handler并给stream core srv设置handler；已读的merge_srv_conf中没有对应content源码复制段。须核注册限制、stream core创建/合并与content使用处，不能由HTTP content或stream preread推导继承。
- 下游TLS脚本在module.c:866–959内：固定Nginx版本走 `nginx_version >= 1025005` 分支，外层要求sscf及ssl.ctx；旧分支检查listen。此处继承本身处于条件内部，不能照抄HTTP“先继承再检查”的描述。逐看ClientHello/certificate的SSL库条件。
- `lua_ssl_conf_command`是优先阻断项：create_srv_conf:806–856设置证书数组UNSET_PTR，但没有对应ssl_conf_commands哨兵赋值；merge:981–983使用merge_ptr。需把pcalloc的NULL、Nginx merge_ptr宏、keyval setter及set_ssl消费闭合，说明与HTTP的差异，不能套用“子级未设就继承全部父命令”。这是源码研究线索，不是批准知识状态。
- socket/code_cache/log_errors等参数沿srv合并:992–1016，出站SSL沿964–987；main no_postpone不在同一层。
- balancer族位于 `src/ngx_stream_lua_balancer.c:119/138/227`，核upstream内srv对象及peer初始化，不当普通server继承。
- `lua_add_variable`在directive.c:1301，`lua_capture_error_log`在1191；前者需核变量注册/取值而不是预设运行赋值，后者涉及main拦截器和Nginx补丁。各自单列。

浏览器清单中至少单独标识：main参数、srv参数、preread/log、content、下游TLS条件、出站SSL命令、balancer、变量声明、废弃load_resty_core。全部50项仍逐项检查，不以这些代表项代替全量。

## E组：逐模块证据入口与高风险点

### Echo：18项

`src/ngx_http_echo_module.c` 注册表→各动作callback；create_loc_conf:246、merge_loc_conf:270。已观察handler_cmds、before_body_cmds、after_body_cmds三个数组分别在子值NULL时取父值；handler数组还带seen_leading_output。不能写成所有echo指令一起继承或一条子命令追加到父动作序列。继续追同文件的命令保存/分派及 `src/ngx_http_echo_handler.c` 实际消费。

echo_before_body/after_body分属过滤命令数组，其余动作按注册setter归属。echo_foreach_split/echo_end涉及成对控制结构；echo_exec涉及跳转；echo_abort_parent须复核实际分派，不因为有注册项就写成可执行默认动作。页面要区分未配置不生成动作、父数组复用和子数组替换。

### Headers More：4项

`src/ngx_http_headers_more_filter_module.c` create_loc_conf:157、merge_loc_conf:177。185–204的分支为子cmds为空时取父数组，否则在有父命令时扩展并把父命令放在前面。与Echo不是相同机制。沿注册callback进入input/output头文件对应解析与执行路径，核clear/set命令共用数组、过滤条件及顺序。

本清单只有more_set_headers的inheritance；另外三项只有defaults。可以检查四项共享机制以判断风险，但不得顺带重写另外三项已存在的继承字段。页面特别核对父先子后的描述与每项实际目标字段。

### Memc：1项memc_pass

`src/ngx_http_memc_module.c` create_loc_conf:163、merge_loc_conf:211、ngx_http_memc_pass:258。setter先安装core content handler，变量目标保存complex_target，静态目标保存upstream.upstream；merge:243只见upstream.upstream复制，没有complex_target复制。必须对静态/变量两路、handler与参数分别跟踪，不能写统一“memc_pass继承父地址”。核 `src/ngx_http_memc_handler.c` 的读取与core location路径，缺省说明不能据NULL推导安全运行。

### Srcache：2项store_hide_header/store_pass_header

`src/ngx_http_srcache_filter_module.c` create:248在288–289置两个数组为UNSET_PTR；merge:296在349调用 `src/ngx_http_srcache_util.c:1144` 的ngx_http_srcache_hide_headers_hash。函数先判断两个数组是否都未设并可能复用父hash；只设置其中一类时另一类单独取父值，之后由默认hide表、hide列表、pass列表构造最终hash。继续读完整函数，核Content-Type/Last-Modified额外标志与pass取消隐藏分支。

页面不能把“未配置自定义列表”写成“不隐藏任何头”，也不能把两数组视作始终一起覆盖。默认表定义从merge调用实参定位，不从其他proxy模块复制。

### NDK：1项upstream_list

`src/ndk_upstream_list.c:59` 的ndk_upstream_list在71行主动取得main_conf，列表保存在mcf->upstreams，并检查重复名称；`ndk_get_upstream_list:184`负责查找。`src/ndk.c:146`为main创建入口。须同时核实际生成注册的context；即便允许多个配置位置，保存位置仍可能是共享main表。不能把共享可见性写成逐location合并。生成宏/模块字段参考现有NDK审计，但不执行生成器。

### Set Misc：26项

`src/ngx_http_set_misc_module.c` 注册表逐项追ndk_set_var_value、ndk_set_var_multi_value及专用setter。通用路径接公共NDK/rewrite链；专用入口包括 `src/ngx_http_set_default_value.c:34` 的ngx_http_set_if_empty、`src/ngx_http_set_hashed_upstream.c:95` 的ngx_http_set_hashed_upstream、`src/ngx_http_set_rotate.c` 的ngx_http_set_rotate。

本模块create/merge在module.c:528/547，合并base32参数和current，不代表26个动作本身继承。set_rotate还需区分current状态与编译动作；set_hashed_upstream另读NDK main列表引用；时间、随机/HMAC九项默认缺口应描述不配置动作时发生什么，不伪造固定输出。TAKE12省略源参数的原地处理要与父子继承分开；同一NDK setter不同post不是别名。

### Array Var：4项

`src/ngx_http_array_var_module.c` 的ngx_http_array_split:132、ngx_http_array_map:226、ngx_http_array_map_op:302、ngx_http_array_join:367。各setter编译NDK动作；map_op已见按参数数量和to=目标选择原地/新目标分支，并从cmd->post绑定具体函数。继续检查map与map_op关系，不能因共享动作函数而抹去参数差异。四项仅补继承，数组值在请求阶段的修改不等于配置数组合并。

### Form Input：2项

`src/ngx_http_form_input_module.c:307` 的ngx_http_set_form_input_conf_handler，init:357、create_main_conf:509；实际取值函数ngx_http_set_form_input:93、multi:128。沿setter进入NDK，同时核模块全局挂载与读请求体的前置阶段。普通/多值分支各自绑定post；主配置中的需要处理标志不证明动作在所有location自动执行。

### RDS JSON：1项rds_json_ret

`src/ngx_http_rds_json_filter_module.c` create:411、merge:445、ngx_http_rds_json_ret:483。setter保存errcode/errstr并在543给core clcf->handler赋ngx_http_rds_json_ret_handler。必须核这两个字段是否实际出现在merge、ret handler如何读取，以及core是否传播handler；不能借该模块其他JSON过滤选项可继承就给ret动作相同结论。缺省不能凭“ret”名称类比Nginx rewrite return。

### Drizzle：12项

`src/ngx_http_drizzle_module.c` create_loc_conf:205、merge:251、复杂值setter:293、query:334、pass:454、status setter:561。`src/ngx_http_drizzle_upstream.c` create_srv_conf:37、server:85；`src/ngx_http_drizzle_keepalive.c:26`负责keepalive配置。

merge:275要求default_query和queries同时为空才复制默认查询、methods_set及查询表；子级仅定义某方法也可能改变整组继承。dbname另判NULL，超时/缓冲/header走各自宏。server/keepalive是upstream成员与池，不是location参数。pass/status要分别核handler安装，已读merge没有通用pass目标复制，不可照搬Memc。页面应分别呈现upstream、query整体条件、普通参数、handler动作。

### Iconv：1项set_iconv

`src/ngx_http_iconv_module.c:593` 的ngx_http_set_iconv_conf_handler在627调用ndk_set_var_multi_value_core；632为动作处理函数。module.c:698/716的create/merge处理过滤器选项，不能直接证明set_iconv动作继承。区分动作显式源/目标编码参数与过滤器from/to默认值；本条默认字段不可直接复制过滤器utf-8/gbk。

### Encrypted Session：2项

`src/ngx_http_encrypted_session_module.c:101–118` 的两个注册项均走ndk_set_var_value，但post分别为encode/decode filter；create_conf:394、merge_conf:412处理key/iv/expires。逐项接NDK动作链；密钥等参数的继承不等于加解密动作继承，TAKE12原地值处理也不是默认密文。清单只含两个动作的inheritance，不更改密钥相关字段。

### Redis：2项redis_pass/redis_bind

上游单文件 `ngx_http_redis_module.c` create_loc_conf:777、merge:836，约879复制静态upstream。不能止于上游：发行variables_in_redis_pass补丁增加变量目标路径，必须核新增字段在create/merge/handler里的关系；default_port_fix又改变端口路径。bind使用公共Nginx ngx_http_upstream_bind_set_slot，须核目标upstream.local的初始化和该模块merge是否实际复制，不能把公共setter当继承实现。

### Postgres：10项

`src/ngx_postgres_module.c` create_upstream_srv_conf:255、create_loc_conf:295、merge_loc_conf:344。注册callback分别为ngx_postgres_conf_server/keepalive/pass/query/rewrite/output/set/escape，按符号继续在该文件定位（escape定义始于1167行）；两个超时走公共msec setter。

merge:357同时检查静态upstream与upstream_cv为空；362同时检查query.def与query.methods为空再复制整组；368与382分别合并rewrites/variables；370–380把output_handler和output_binary联动处理。server/keepalive是upstream对象。postgres_rewrite是数据库结果规则，不能因为名称rewrite就归为Nginx rewrite代码；postgres_set也不是自动等同NDK set。postgres_escape需独立追callback与执行链。全部10项只补inheritance，不改默认值。

### Redis2：6项

`src/ngx_http_redis2_module.c` create:148、merge:195；commands绑定ngx_http_redis2_query、ngx_http_redis2_set_complex_value_slot、ngx_http_redis2_raw_queries、ngx_conf_set_str_slot、ngx_http_redis2_pass、ngx_http_upstream_bind_set_slot，沿对应定义追踪。

merge:224–242分别处理静态upstream、complex_query、complex_query_count、queries与literal_query，不能宣称所有query形式是统一别名或互斥整组继承。四种query在本清单仅补defaults，须继续核请求构造选择顺序和全部未设分支，保留原继承字段。pass核core handler，bind核local字段是否实际merge，不能从共享upstream结构自动推定。

### VTS：2项，均仅defaults

`src/ngx_http_vhost_traffic_status_filter.c:365` 的filter_by_set_key在387依据cmd_type选择main ctx->filter_keys或loc filter_keys；缺省必须分层描述，不把全局与局部列表混成一个。`src/ngx_http_vhost_traffic_status_set.c:483` 的set_by_filter在504检查UNSET_PTR并创建filter_vars、注册变量；继续核set handler:30及请求消费。module.c create_main:889、create_loc:987、merge:1050（1130合并filter_vars）是关联入口。

VTS是独立commit快照，补丁not_applicable不代表现场未打补丁或兼容性通过。仅两个默认字段在本清单中，保留两条继承及其他VTS事实。

## 补丁审计使用边界

现有 `analysis/NGINX_PATCH_AUDIT.json` / `.md` 固定34项有效补丁、47个目标文件摘要及非零fuzz/offset记录；历史“全部无偏移”结论已被撤回。本次只读这些审计，不重新回放，不宣称新增引用已完成补丁验证。新增Nginx rewrite/core/setter/SSL片段须逐一与有效补丁范围及必要的隔离回放结果对齐；文件名未出现在某条补丁中并不足以证明调用链未受影响。

固定OpenResty `util/mirror-tarballs:570–715` 已读到NDK、Set Misc、RDS、Headers More、Drizzle、HTTP/stream Lua、Array、Memc、Srcache、Form Input、Iconv、Encrypted Session的取包处理及Redis有效补丁调用。未直接打补丁只说明该组件处理步骤，不能替代所调用Nginx代码的补丁核对。Echo及该范围之外的Postgres/Redis2处理段，实施时仍须按固定脚本定位，不把本文所读范围扩大成全部组件审计完成。

Redis专用 `analysis/REDIS_PATCH_AUDIT.json` 固定三补丁：variables_in_redis_pass、default_port_fix、remove_content_encoding；最终ngx_http_redis_module.c摘要为 `a22574b45a0ee2be65626d9cdc4bc5d4f7d4215a5aa22f31d8952d1f68d4db2a`。default_port_fix记录offset=2，不能误写零偏移。新增redis_pass继承事实须引用实际补丁片段，不能仅引用这份摘要。

现有HTTP_LUA_BASIC_NOTES、STREAM_LUA_BASIC_NOTES、SET_MISC_BASIC_NOTES和NDK_MACRO_NOTES只用于定位历史证据；其结论范围和旧字段缺口不同，不可直接转成本轮verified。尤其stream ssl_conf_commands差异本次已回到固定源码查看创建/合并，仍需实施补齐宏、setter及消费端后独立审核。

## 给主审核的浏览器清单标签与交付要求

由主线程从manifest精确ID生成全量清单，给C/E每项附机制标签：main初始化、server合并、loc合并、upstream对象、rewrite动作、handler安装、数组整组、数组追加、同槽不同输入形式、废弃入口、补丁影响。标签只是审核分类，不写入产品schema。

高风险必查条件为：HTTP/stream Lua同名不同层级；set_by与rewrite_by差异；stream TLS外层条件及ssl_conf_commands哨兵；NDK main共享表；server阶段执行与动作继承；Echo三数组与Headers More父先子后；Memc静态/变量目标；Srcache双数组与默认hide表；Drizzle/Postgres查询整组条件；RDS ret参数与handler；Redis补丁变量路径；Redis/Redis2 bind；VTS main/loc默认分离。所有223身份、330字段仍逐项检查，风险标签不替代全量覆盖。

Sol每项交付应补充：注册ID/目标字段→固定setter与存储成员→create哨兵→merge或动作编译路径→未设使用分支→必要补丁→中文结论。独立审核检查这些链接是否闭合；本文未读到的函数体或列为“继续核”的路径不能当已通过依据。页面验收只核知识呈现和链接，不执行真实Lua、数据库、Redis或业务请求。

本次仅新增本文；未修改manifest、知识、测试或发布，未读取用户样例、未联网、未新增Agent、未运行构建或现场程序。
