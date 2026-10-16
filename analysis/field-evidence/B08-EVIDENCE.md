# B08 字段证据记录

范围：nginx 其余 HTTP 模块（模块名 access 至 limit_req，含 copy_filter 的 output_buffers），共 70 条。固定 revision：nginx release-1.27.1（e06bdbd4…）。官方文档为现行版本，仅作交叉印证；涉及外部库（zlib、GD、GeoIP）的条目只陈述 nginx 自身对库函数的调用与参数传递，不陈述库内部行为。

## nginx--ngx_http_access_module--allow

- 语法（`allow address | CIDR | unix: | all;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_http_access_rule 依次接受 value[1] 为 all、unix:，其余交 ngx_ptocidr 解析为地址或 CIDR，与 `address | CIDR | unix: | all` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, implementation-4, implementation-5
  - 判据：ngx_http_access_rule 把规则按地址族追加到 rules/rules6/rules_un（deny 标志取自指令名首字母，allow 为 0），handler 按连接 sockaddr 的族选数组，逐条匹配，命中即调用 ngx_http_access_found（allow 返回 NGX_OK）；merge 继承父级规则，init 把 handler 挂入 ACCESS 阶段。

## nginx--ngx_http_access_module--deny

- 语法（`deny address | CIDR | unix: | all;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；与 allow 共用 ngx_http_access_rule，解析 all、unix:、地址/CIDR，与 `address | CIDR | unix: | all` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, implementation-4, implementation-5
  - 判据：同一解析函数以 value[0] 首字母 d 置 deny=1；handler 逐条匹配规则，命中后 ngx_http_access_found 对 deny 返回 NGX_HTTP_FORBIDDEN（403），否则返回 NGX_OK；未命中返回 NGX_DECLINED。

## nginx--ngx_http_addition_filter_module--add_before_body

- 语法（`add_before_body uri;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_str_slot 把 value[1] 存入 before_body 字符串，与 `add_before_body uri;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1
  - 判据：指令值经 str_slot 写入 conf->before_body；头过滤器在状态 200、主请求、before/after 至少一个非空且类型匹配时建立上下文，体过滤器在首次收到正文时对 conf->before_body 调用 ngx_http_subrequest，且发生在把该块传给后续过滤器之前。子请求输出如何与主响应排序属于 postpone 机制，本条不作陈述。
- 修正（功能）：为符合条件的主响应（状态200、主请求、类型匹配addition_types）在体过滤器首次收到正文、向后续过滤器传递该块之前，创建指向指定URI的子请求，由addition头/体过滤器协作处理。输出先后由 postpone 机制决定，本条不核实。
  - 理由：原文“在正文之前插入…产生的内容”涉及子请求输出的排序，由 postpone 过滤器等其他模块决定，本条片段只能证明子请求创建于传递首块正文之前；收窄为可证明范围。

## nginx--ngx_http_addition_filter_module--add_after_body

- 语法（`add_after_body uri;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_str_slot 把 value[1] 存入 after_body 字符串，与 `add_after_body uri;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1
  - 判据：指令值写入 conf->after_body；体过滤器在收到带 last_buf 的块时清除 last_buf 并先把该块传给后续过滤器，随后对 conf->after_body 调用 ngx_http_subrequest，再发送 NGX_HTTP_LAST。子请求输出的排序不在本条陈述范围。
- 修正（功能）：为符合条件的主响应（状态200、主请求、类型匹配addition_types）在收到最后一块正文并传给后续过滤器之后，创建指向指定URI的子请求，再发送结束标记，由addition头/体过滤器协作处理。输出先后由 postpone 机制决定，本条不核实。
  - 理由：原文“在正文之后插入…产生的内容”涉及子请求输出的排序，由其他模块决定；收窄为源码可证明的子请求创建时机。

## nginx--ngx_http_addition_filter_module--addition_types

- 语法（`addition_types mime-type ...;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_1MORE，ngx_http_types_slot 逐个接受 MIME 类型，遇单个 `*` 置为匹配任意类型（configuration-definition 的 `*` 分支），故语法补 `| *`。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3
  - 判据：指令值经 types_slot 写入 types_keys，merge 时 ngx_http_merge_types 转为 types 哈希（默认含 text/html）；头过滤器要求 before_body 或 after_body 非空，并以 ngx_http_test_content_type(&conf->types) 判定类型。
- 修正（语法）：addition_types mime-type ... | *;
  - 理由：源码 ngx_http_types_slot 对单个 `*` 特殊处理（types_keys 置 -1，匹配任意类型），原语法未列；按裁定 6 补齐。

## nginx--ngx_http_auth_basic_module--auth_basic

- 语法（`auth_basic string | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_http_set_complex_value_slot 把 value[1] 编译为复杂值（可含变量），`off` 作为运行期取值判断，与 `auth_basic string | off;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, complex-value
  - 判据：指令值存入 alcf->realm；handler 在 realm 或 user_file 为 NULL 时 DECLINED，否则求值 realm，等于 off 时 DECLINED；缺少/错误凭据时 set_realm 生成 `WWW-Authenticate: Basic realm="…"` 并返回 401；merge 继承父级，init 挂入 ACCESS 阶段。

## nginx--ngx_http_auth_basic_module--auth_basic_user_file

- 语法（`auth_basic_user_file file;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_http_auth_basic_user_file 把 value[1] 编译为复杂值（含变量，相对路径按配置前缀补全），与 `auth_basic_user_file file;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, complex-value
  - 判据：handler 求值 alcf->user_file 后 ngx_open_file 只读打开，逐字符匹配用户名、读取到 `:`/行尾的密码串，交 ngx_http_auth_basic_crypt_handler 调用 ngx_crypt 与存储值比较；匹配返回 NGX_OK，不匹配或未找到用户时返回带 realm 的 401。

## nginx--ngx_http_auth_request_module--auth_request

- 语法（`auth_request uri | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_http_auth_request 在 value[1] 为 off 时把 uri 置空串，否则原样保存为固定 uri，与 `auth_request uri | off;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1
  - 判据：ngx_http_auth_request 把 off 置为空 uri；handler 在 uri.len 为 0 时 DECLINED，否则以 NGX_HTTP_SUBREQUEST_WAITED 创建子请求并返回 NGX_AGAIN；完成回调记录状态码，随后 403 直接返回，401 复制 WWW-Authenticate 后返回，200≤状态<300 返回 NGX_OK，其他状态记录日志并返回 500；uri 为字符串直接取自配置，未经变量编译。

## nginx--ngx_http_auth_request_module--auth_request_set

- 语法（`auth_request_set $variable value;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE2；ngx_http_auth_request_set 要求 value[1] 以 `$` 开头并登记变量，value[2] 编译为复杂值，与 `auth_request_set $variable value;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2
  - 判据：指令把变量索引与复杂值（av->value）存入 arcf->vars；子请求完成后 handler 调用 set_variables，对每项用 ngx_http_complex_value(ctx->subrequest, &av->value) 在子请求上下文求值并写入 r->variables[av->index]；init 把 handler 挂入 ACCESS 阶段。
- 修正（功能）：认证子请求完成后，在该子请求上下文求值指定表达式，再将结果写到主请求的变量；不是普通 rewrite 阶段的 set。
  - 理由：原文“可用于读取认证上游的响应信息”是用途推断，源码只证明表达式在子请求上下文求值，已删去该分句。

## nginx--ngx_http_autoindex_module--autoindex

- 语法（`autoindex on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，ngx_conf_set_flag_slot 接受 on/off，与 `autoindex on | off;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3
  - 判据：enable 由 flag_slot 写入；init 把 handler 挂入 CONTENT 阶段；handler 要求 URI 以 `/` 结尾、方法为 GET/HEAD 且 alcf->enable，随后 ngx_open_dir 读取 URI 映射目录，按 alcf->format 调用 html/json/xml 生成函数输出。

## nginx--ngx_http_autoindex_module--autoindex_format

- 语法（`autoindex_format html | xml | json | jsonp;`）：verified；source_ids：registration, configuration-definition, implementation-0
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_enum_slot 按取值表接受 html、json、jsonp、xml，与 `html | xml | json | jsonp` 取值集合一致。
- 功能：verified；source_ids：implementation-1, implementation-2, implementation-3, implementation-4, implementation-5, implementation-6
  - 判据：format 由 enum_slot 写入，merge 默认 html；handler 取 format（jsonp 且无 callback 时降为 json）并在 switch 中分别调用 ngx_http_autoindex_json/xml/html 生成响应。

## nginx--ngx_http_autoindex_module--autoindex_localtime

- 语法（`autoindex_localtime on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，ngx_conf_set_flag_slot 接受 on/off，与 `autoindex_localtime on | off;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, summary-tp, summary-timeofday, summary-gmtoff
  - 判据：HTML 生成函数取 tp=ngx_timeofday()（宏取 ngx_cached_time，由 ngx_time_update 末尾赋为当前槽 tp），以 ngx_gmtime(mtime + tp->gmtoff*60*alcf->localtime) 格式化时间，localtime 为 1 时叠加 gmtoff（ngx_time_update 中由本地时区信息设置），为 0 时即 UTC；JSON/XML 分支另行格式化，不使用该值。
- 新增片段：summary-tp（src/http/modules/ngx_http_autoindex_module.c:544-545）；summary-gmtoff（src/core/ngx_times.c:130-184）；summary-timeofday（src/core/ngx_times.h:37-37）

## nginx--ngx_http_autoindex_module--autoindex_exact_size

- 语法（`autoindex_exact_size on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，ngx_conf_set_flag_slot 接受 on/off，与 `autoindex_exact_size on | off;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, summary-exact-branch, summary-alcf
  - 判据：HTML 生成函数以 `if (alcf->exact_size)` 分支：为真输出精确字节数，为假按 1024 进位折算 K/M/G 并四舍五入；exact_size 由 flag_slot 写入，merge 默认 1。
- 新增片段：summary-exact-branch（src/http/modules/ngx_http_autoindex_module.c:637-637）；summary-alcf（src/http/modules/ngx_http_autoindex_module.c:544-545）

## nginx--ngx_http_browser_module--modern_browser

- 语法（`modern_browser browser version; modern_browser unlisted;`）：verified；source_ids：registration, configuration-definition, implementation-3
  - 判据：注册为 NGX_CONF_TAKE12；ngx_http_modern_browser 单参数时仅接受 unlisted，双参数时第一项须在内置名称表（opera、msie、gecko、safari、konqueror）中、第二项为点分数字版本，与 `modern_browser browser version; modern_browser unlisted;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, configuration-definition
  - 判据：配置阶段把浏览器标记与版本存入 modern_browsers（或置 modern_unlisted_browsers）；merge 填入 UA 子串、跳过长度并排序；ngx_http_browser 逐项在 User-Agent 中查找标记并比较版本，达到最低版本为 modern，unlisted 时未列出的浏览器归 modern；变量取值函数据此返回。

## nginx--ngx_http_browser_module--ancient_browser

- 语法（`ancient_browser string ...;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_1MORE；ngx_http_ancient_browser 逐参数处理，`netscape4` 置标志，其余字符串追加为 UA 子串，与 `ancient_browser string ...;` 一致（netscape4 为特殊字符串值）。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, configuration-definition
  - 判据：配置阶段把子串存入 ancient_browsers、netscape4 置标志；merge 继承；ngx_http_browser 在 netscape4 时按 Mozilla/1~4 前缀判 ancient，并以 ngx_strstr 在 User-Agent 中查找各子串，命中为 ancient。

## nginx--ngx_http_browser_module--modern_browser_value

- 语法（`modern_browser_value string;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_http_modern_browser_value 把 value[1] 保存为变量值，与 `modern_browser_value string;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, configuration-definition
  - 判据：指令写入 bcf->modern_browser_value；merge 继承，缺省为 ngx_http_variable_true_value（"1"）；$modern_browser 取值函数在分类结果为 modern 时返回 *cf->modern_browser_value，否则返回空。

## nginx--ngx_http_browser_module--ancient_browser_value

- 语法（`ancient_browser_value string;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_http_ancient_browser_value 把 value[1] 保存为变量值，与 `ancient_browser_value string;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, configuration-definition
  - 判据：指令写入 bcf->ancient_browser_value；merge 继承，缺省为 "1"；$ancient_browser 取值函数在分类结果为 ancient 时返回 *cf->ancient_browser_value，否则返回空。

## nginx--ngx_http_charset_filter_module--charset

- 语法（`charset charset | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_http_set_charset_slot 对 charset 字段识别 `off`，`$` 开头取变量索引，其余登记为字符集名，与 `charset charset | off;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, implementation-4, implementation-5, summary-header-charset
  - 判据：charset 由 set_charset_slot 写入 mlcf->charset；头过滤器经 destination_charset 取目标，ngx_http_set_charset 写入 headers_out.charset，HTTP/1.x 头过滤器据此输出 `; charset=`；源、目标不同且存在 charset_map 表时创建 ctx，体过滤器按 ctx->table 转码，无映射表则记录错误并不转换。
- 新增片段：summary-header-charset（src/http/ngx_http_header_filter_module.c:480-498）

## nginx--ngx_http_charset_filter_module--source_charset

- 语法（`source_charset charset;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_http_set_charset_slot 对非 charset 字段只处理 `$` 变量与字符集名，与 `source_charset charset;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, implementation-4, implementation-5
  - 判据：ngx_http_source_charset：响应已带 charset 时用响应值，否则取 lcf->source_charset（字符集名索引或变量求值）；其结果与目标比较并选择转码表。

## nginx--ngx_http_charset_filter_module--override_charset

- 语法（`override_charset on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，ngx_conf_set_flag_slot 接受 on/off，与 `override_charset on | off;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, implementation-4, implementation-5
  - 判据：ngx_http_destination_charset 在响应已带 charset 且 mlcf->override_charset 为 0 时返回 DECLINED，为 1 时继续；ngx_http_source_charset 以响应所带 charset 作为源；该函数仅在 r == r->main 时调用。

## nginx--ngx_http_charset_filter_module--charset_types

- 语法（`charset_types mime-type ...;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_1MORE，ngx_http_types_slot 逐个接受 MIME 类型，遇单个 `*` 置为匹配任意（configuration-definition 的 `*` 分支），故语法补 `| *`。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, implementation-4, implementation-5, implementation-6, implementation-7
  - 判据：ngx_http_destination_charset 在响应无 charset 时以 ngx_http_test_content_type(&mlcf->types) 判定类型；merge 以 ngx_http_merge_types 把 types_keys 转为 types（缺省 charset 默认类型表）。
- 修正（语法）：charset_types mime-type ... | *;
  - 理由：源码 ngx_http_types_slot 对单个 `*` 特殊处理（types_keys 置 -1，匹配任意类型），原语法未列；按裁定 6 补齐。

## nginx--ngx_http_charset_filter_module--charset_map

- 语法（`charset_map charset1 charset2 { code1 code2; ... }`）：verified；source_ids：registration, configuration-definition, implementation-0
  - 判据：注册为 NGX_HTTP_MAIN_CONF|NGX_CONF_BLOCK|NGX_CONF_TAKE2；块函数取 value[1]、value[2] 为两种字符集，块内每行由 ngx_http_charset_map 要求恰为 2 个参数并按十六进制解析，与 `charset_map charset1 charset2 { code1 code2; ... }` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2, implementation-3
  - 判据：块函数建立 src2dst/dst2src 表并逐行填入十六进制映射；postconfiguration 把表挂到 charsets[].tables 并注册头/体过滤器；头过滤器选中表后体过滤器按 ctx->table 转码。

## nginx--ngx_http_dav_module--dav_methods

- 语法（`dav_methods off; dav_methods method ...;`）：verified；source_ids：registration, configuration-definition, implementation-0
  - 判据：注册为 NGX_CONF_1MORE，ngx_conf_set_bitmask_slot 按取值表接受 off、put、delete、mkcol、copy、move（大小写不敏感），与 `off | method ...` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-3
  - 判据：methods 由 bitmask_slot 写入；handler 在 r->method 不在 dlcf->methods 时 DECLINED；PUT 读取请求体到文件并在 put_handler 中 ngx_ext_rename_file 到 URI 映射路径，MKCOL 在映射路径 ngx_create_dir，DELETE/COPY/MOVE 分别交 delete/copy_move 处理函数。
- 修正（功能）：选择交给本模块处理的PUT、DELETE、MKCOL、COPY和MOVE方法；PUT 把请求体临时文件重命名到URI映射的本地路径，MKCOL 在映射路径创建目录，DELETE、COPY、MOVE 交给本模块对应处理函数，未选择的方法不处理。
  - 理由：原文“将请求映射为本地文件操作”对 DELETE/COPY/MOVE 的具体文件操作，本条片段未覆盖；收窄为 PUT、MKCOL 已被片段证明的行为，其余仅陈述分派。

## nginx--ngx_http_dav_module--create_full_put_path

- 语法（`create_full_put_path on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，ngx_conf_set_flag_slot 接受 on/off，与 `create_full_put_path on | off;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2
  - 判据：put_handler 令 ext.create_path = dlcf->create_full_put_path；ngx_ext_rename_file 在 rename 返回 NGX_ENOPATH 时，仅当 create_path 为真才 ngx_create_full_path 补建中间目录并重试，否则失败。

## nginx--ngx_http_dav_module--min_delete_depth

- 语法（`min_delete_depth number;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_num_slot 接受数字，与 `min_delete_depth number;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1
  - 判据：delete_handler 在 dlcf->min_delete_depth 非 0 时统计 URI 中的 `/`（且其后仍有内容）达到该值才继续；否则记录 "insufficient URI depth" 并返回 NGX_HTTP_CONFLICT（409）；merge 默认 0（不检查）。
- 修正（功能）：限制DELETE处理的最小请求URI层级（按URI中的“/”计数且其后须还有内容）；未达到要求时记录日志并返回409，默认0表示不检查。
  - 理由：原文“避免删除过浅的目标”属于目的描述，源码只证明按斜杠计数并在不足时返回409；收窄为可证明范围。

## nginx--ngx_http_dav_module--dav_access

- 语法（`dav_access users:permissions ...;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE123；ngx_conf_set_access_slot 逐参数接受 user:/group:/all: 前缀加 r 或 rw，与 `users:permissions ...` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-3, implementation-4, summary-dav-dispatch
  - 判据：dav_handler 取 dlcf 并把它传给 mkcol_handler；put_handler 令 ext.access 与 ext.path_access 均取 dlcf->access，由 ngx_ext_rename_file 修改文件权限、补建路径时经 ngx_dir_access 转换；mkcol_handler 以 ngx_dir_access(dlcf->access) 调用 ngx_create_dir。
- 新增片段：summary-dav-dispatch（src/http/modules/ngx_http_dav_module.c:146-190）
- 修正（功能）：配置DAV创建路径使用的用户、组和其他用户读写权限；PUT移入文件与MKCOL建目录时把该配置传给文件操作。
  - 理由：原文“等路径”的 COPY/MOVE 等未被本条片段覆盖，收窄为 PUT 与 MKCOL。

## nginx--ngx_http_degradation_module--degradation

- 语法（`degradation sbrk=size;`）：verified；source_ids：registration, configuration-definition, implementation-2
  - 判据：注册为 NGX_HTTP_MAIN_CONF|NGX_CONF_TAKE1；ngx_http_degradation 仅接受 `sbrk=` 前缀，余部交 ngx_parse_size，其他参数报错，与 `degradation sbrk=size;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1
  - 判据：size 写入 dmcf->sbrk_size；ngx_http_degraded 每秒用 sbrk(0) 减去装载基址估算 sbrk_size，达到 dmcf->sbrk_size 时返回 1；handler 在 preaccess 阶段调用它判定降级。

## nginx--ngx_http_degradation_module--degrade

- 语法（`degrade 204 | 444;`）：verified；source_ids：registration, configuration-definition, implementation-0
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_enum_slot 按取值表接受 204、444，与 `degrade 204 | 444;` 一致。
- 功能：verified；source_ids：implementation-1, implementation-2, implementation-3, implementation-4, implementation-5
  - 判据：degrade 由 enum_slot 写入；init 把 handler 挂入 PREACCESS 阶段；handler 在 dlcf->degrade 非 0 且 ngx_http_degraded 为真时返回该值，否则 DECLINED；generic phase 对非 OK/DECLINED/AGAIN/DONE 的返回码调用 ngx_http_finalize_request。

## nginx--ngx_http_empty_gif_module--empty_gif

- 语法（`empty_gif;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_HTTP_LOC_CONF|NGX_CONF_NOARGS，无参数，与 `empty_gif;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2, implementation-3, d340-handler-select
  - 判据：指令设 clcf->handler = ngx_http_empty_gif_handler，核心把 clcf->handler 复制为 r->content_handler；handler 仅允许 GET/HEAD，以内置 ngx_empty_gif 数组（1×1、含透明色的 GIF89a）调用 ngx_http_send_response，不读取磁盘文件。

## nginx--ngx_http_flv_module--flv

- 语法（`flv;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_HTTP_LOC_CONF|NGX_CONF_NOARGS，无参数，与 `flv;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2
  - 判据：指令设 clcf->handler = ngx_http_flv_handler 并由核心复制为 content_handler；handler 要求 GET/HEAD、URI 不以 `/` 结尾、打开为普通文件，读取 `start` 参数为字节偏移（非法或不小于文件长度则置 0），非零时先输出 ngx_flv_header 再从 start 起输出文件。

## nginx--ngx_http_geo_module--geo

- 语法（`geo [$address] $variable { ... }`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_HTTP_MAIN_CONF|NGX_CONF_BLOCK|NGX_CONF_TAKE12；ngx_http_geo_block 两参数时 value[1] 为地址变量、value[2] 为结果变量，单参数时 value[1] 为结果变量，均须以 `$` 开头，与 `geo [$address] $variable { ... }` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-3, implementation-4
  - 判据：块内按 ranges 或 CIDR 登记；无 ranges 时变量取值函数 ngx_http_geo_cidr_variable 用 ngx_http_geo_addr（取指定变量或连接 sockaddr，可经 X-Forwarded-For 与 geo 内 proxy 调整）在 radix 树中查找，ngx_radix32tree_find/128tree_find 沿路径取最后一个有值节点，即最长（最具体）前缀；ranges 模式用 IPv4 范围表查找。

## nginx--ngx_http_geoip_module--geoip_country

- 语法（`geoip_country file [utf8];`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_HTTP_MAIN_CONF|NGX_CONF_TAKE12；ngx_http_geoip_country 取 value[1] 为文件，可选第 2 参数仅接受 `utf8`，与 `geoip_country file [utf8];` 一致（官方文档未列 utf8，以源码为准）。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2, summary-geoip-vars
  - 判据：指令 GeoIP_open 打开文件并校验为 country 版数据库（否则报错），结果存入 gcf->country；变量表登记 geoip_country_* 变量，取值函数以 ngx_http_geoip_addr（连接地址，可经可信代理的 X-Forwarded-For 调整）查询 gcf->country。
- 新增片段：summary-geoip-vars（src/http/modules/ngx_http_geoip_module.c:169-236）

## nginx--ngx_http_geoip_module--geoip_org

- 语法（`geoip_org file [utf8];`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_HTTP_MAIN_CONF|NGX_CONF_TAKE12；ngx_http_geoip_org 取 value[1] 为文件，可选第 2 参数仅接受 `utf8`，与 `geoip_org file [utf8];` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2, summary-geoip-vars
  - 判据：指令 GeoIP_open 打开文件并校验数据库类型（ISP/ORG/DOMAIN/ASNUM），存入 gcf->org；变量 geoip_org 的取值函数以 ngx_http_geoip_addr 的结果对 gcf->org 调用 GeoIP_name_by_ipnum。
- 新增片段：summary-geoip-vars（src/http/modules/ngx_http_geoip_module.c:169-236）

## nginx--ngx_http_geoip_module--geoip_city

- 语法（`geoip_city file [utf8];`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_HTTP_MAIN_CONF|NGX_CONF_TAKE12；ngx_http_geoip_city 取 value[1] 为文件，可选第 2 参数仅接受 `utf8`，与 `geoip_city file [utf8];` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2, implementation-3, summary-geoip-vars
  - 判据：指令 GeoIP_open 打开文件并校验为 city 版数据库，存入 gcf->city；city 类变量取值函数经 ngx_http_geoip_get_city_record 以 ngx_http_geoip_addr 结果调用 GeoIP_record_by_ipnum 并读取记录字段。
- 新增片段：summary-geoip-vars（src/http/modules/ngx_http_geoip_module.c:169-236）

## nginx--ngx_http_geoip_module--geoip_proxy

- 语法（`geoip_proxy address | CIDR;`）：verified；source_ids：registration, configuration-definition, implementation-3
  - 判据：注册为 NGX_HTTP_MAIN_CONF|NGX_CONF_TAKE1；ngx_http_geoip_proxy 经 ngx_http_geoip_cidr_value 把 value[1] 解析为地址或 CIDR（含 255.255.255.255 特例），与 `geoip_proxy address | CIDR;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-2, implementation-3, summary-gcf
  - 判据：各变量取值函数取主配置 gcf 并传入 ngx_http_geoip_addr；指令把 CIDR 追加到 gcf->proxies；ngx_http_geoip_addr 在存在 X-Forwarded-For 且 proxies 非空时调用 ngx_http_get_forwarded_addr，仅当当前地址匹配 proxies 才解析 XFF 末项为新地址。
- 新增片段：summary-gcf（src/http/modules/ngx_http_geoip_module.c:341-385）

## nginx--ngx_http_geoip_module--geoip_proxy_recursive

- 语法（`geoip_proxy_recursive on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_HTTP_MAIN_CONF|NGX_CONF_FLAG，ngx_conf_set_flag_slot 接受 on/off，与 `geoip_proxy_recursive on | off;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-2, summary-gcf
  - 判据：各变量取值函数取主配置 gcf 并传入 ngx_http_geoip_addr；proxy_recursive 由 flag_slot 写入 gcf，经 ngx_http_geoip_addr 作为 recursive 参数传入 ngx_http_get_forwarded_addr；为真时循环取 XFF 逆序元素，只要当前地址仍匹配可信代理就继续向前取。
- 新增片段：summary-gcf（src/http/modules/ngx_http_geoip_module.c:341-385）

## nginx--ngx_http_gunzip_filter_module--gunzip

- 语法（`gunzip on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，ngx_conf_set_flag_slot 接受 on/off，与 `gunzip on | off;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, implementation-4
  - 判据：enable 由 flag_slot 写入；头过滤器在 enable、Content-Encoding 恰为 gzip 且 ngx_http_gzip_ok 不通过（或已判 gzip_ok 为假）时建立上下文并清除 Content-Encoding；体过滤器用 inflateInit2(MAX_WBITS+16) 对正文解压。

## nginx--ngx_http_gunzip_filter_module--gunzip_buffers

- 语法（`gunzip_buffers number size;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE2，ngx_conf_set_bufs_slot 取数量与大小，与 `gunzip_buffers number size;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3
  - 判据：bufs 由 bufs_slot 写入；get_buf 优先取 ctx->free 复用，其次在 ctx->bufs < conf->bufs.num 时按 conf->bufs.size 新建，否则置 nomem；体过滤器遇 nomem 先把已有输出交给后续过滤器并回收缓冲后继续。

## nginx--ngx_http_gzip_filter_module--gzip

- 语法（`gzip on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，ngx_conf_set_flag_slot 接受 on/off，与 `gzip on | off;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, implementation-4
  - 判据：enable 由 flag_slot 写入；头过滤器在 enable、状态、Content-Encoding、长度、类型、非 header_only 满足且 ngx_http_gzip_ok 通过时建立上下文并设置 Content-Encoding: gzip；体过滤器 deflate_start 调用 deflateInit2，deflate 输出压缩数据。

## nginx--ngx_http_gzip_filter_module--gzip_buffers

- 语法（`gzip_buffers number size;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE2，ngx_conf_set_bufs_slot 取数量与大小，与 `gzip_buffers number size;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2
  - 判据：bufs 由 bufs_slot 写入；get_buf 优先复用 ctx->free，其次在 ctx->bufs < conf->bufs.num 时按 conf->bufs.size 新建，否则置 nomem；merge 缺省按页大小折算。

## nginx--ngx_http_gzip_filter_module--gzip_types

- 语法（`gzip_types mime-type ...;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_1MORE，ngx_http_types_slot 逐个接受 MIME 类型，遇单个 `*` 置为匹配任意（configuration-definition 的 `*` 分支），故语法补 `| *`。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, implementation-4
  - 判据：types_slot 首次调用先放入默认 text/html，再追加配置值，`*` 令 types_keys=-1；merge_types 对 -1 不建哈希，ngx_http_test_content_type 在 types_hash.size 为 0 时直接返回匹配；头过滤器以其判定类型。
- 修正（语法）：gzip_types mime-type ... | *;
  - 理由：源码 ngx_http_types_slot 对单个 `*` 特殊处理（types_keys 置 -1，匹配任意类型），原语法未列；按裁定 6 补齐。

## nginx--ngx_http_gzip_filter_module--gzip_comp_level

- 语法（`gzip_comp_level level;`）：verified；source_ids：registration, configuration-definition, implementation-0
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_num_slot 接受数字并受边界表 1–9 约束，与 `gzip_comp_level level;` 一致。
- 功能：verified；source_ids：implementation-1, implementation-2
  - 判据：level 由 num_slot 写入 conf->level，merge 默认 1；deflate_start 以 (int) conf->level 作为 deflateInit2 的 level 实参。

## nginx--ngx_http_gzip_filter_module--gzip_window

- 语法（`gzip_window size;`）：verified；source_ids：registration, configuration-definition, implementation-0, implementation-1
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_size_slot 解析大小后调用 post 函数 ngx_http_gzip_window，仅接受 512/1k/2k/4k/8k/16k/32k 并转为 window bits，与 `gzip_window size;` 一致。
- 功能：verified；source_ids：implementation-1, implementation-2, implementation-3, implementation-4, summary-memory-call
  - 判据：头过滤器调用 ngx_http_gzip_filter_memory；post 函数把大小改写为 wbits 存入 conf->wbits；memory() 取 conf->wbits 复制到 ctx->wbits 并据此估算 ctx->allocated；deflate_start 以 ctx->wbits + 16 调用 deflateInit2。
- 新增片段：summary-memory-call（src/http/modules/ngx_http_gzip_filter_module.c:271-276）

## nginx--ngx_http_gzip_filter_module--gzip_hash

- 语法（`gzip_hash size;`）：verified；source_ids：registration, configuration-definition, implementation-0, implementation-1
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_size_slot 解析大小后调用 post 函数 ngx_http_gzip_hash，仅接受 512 至 128k 的 2 的幂并转为 memlevel，与 `gzip_hash size;` 一致。
- 功能：verified；source_ids：implementation-1, implementation-2, implementation-3, implementation-4, summary-memory-call
  - 判据：头过滤器调用 ngx_http_gzip_filter_memory；post 函数把大小改写为 memlevel 存入 conf->memlevel；memory() 取 conf->memlevel 复制到 ctx->memlevel 并参与 ctx->allocated 估算；deflate_start 以 ctx->memlevel 调用 deflateInit2。
- 新增片段：summary-memory-call（src/http/modules/ngx_http_gzip_filter_module.c:271-276）

## nginx--ngx_http_gzip_filter_module--postpone_gzipping

- 语法（`postpone_gzipping size;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_size_slot 接受大小，与 `postpone_gzipping size;` 一致。
- 功能：verified；source_ids：implementation-1, implementation-2, implementation-3, summary-header-conf
  - 判据：头过滤器取 conf 并令 ctx->buffering = (conf->postpone_gzipping != 0)；gzip_filter_buffer 暂存输入，直到 flush、last_buf 或累计字节超过 conf->postpone_gzipping 时把 buffering 置 0。
- 新增片段：summary-header-conf（src/http/modules/ngx_http_gzip_filter_module.c:227-276）

## nginx--ngx_http_gzip_filter_module--gzip_no_buffer

- 语法（`gzip_no_buffer on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，ngx_conf_set_flag_slot 接受 on/off，与 `gzip_no_buffer on | off;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1
  - 判据：deflate 在未完成且 conf->no_buffer 为真、ctx->in 为 NULL（无待压缩输入）时，把当前 out_buf 链入输出链并返回 NGX_OK，否则返回 NGX_AGAIN 等待继续。
- 修正（功能）：当动态gzip已没有待处理输入时，将当前尚未填满的输出缓冲也加入输出链，而不是返回等待更多输入。
  - 理由：原文“减少等待输出缓冲填满的机会”是效果推断，源码只证明 no_buffer 且 ctx->in 为空时的分支行为；收窄为该分支。

## nginx--ngx_http_gzip_filter_module--gzip_min_length

- 语法（`gzip_min_length length;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_size_slot 接受大小，与 `gzip_min_length length;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1
  - 判据：头过滤器在 content_length_n != -1 且小于 conf->min_length 时不压缩；merge 默认 20。

## nginx--ngx_http_gzip_static_module--gzip_static

- 语法（`gzip_static on | off | always;`）：verified；source_ids：registration, configuration-definition, implementation-0
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_enum_slot 按取值表接受 off、on、always，与 `on | off | always` 一致。
- 功能：verified；source_ids：implementation-1, implementation-2, implementation-3
  - 判据：handler 按 gzcf->enable 分支：off 则 DECLINED，on 调用 ngx_http_gzip_ok，always 视为通过；路径以 ngx_http_map_uri_to_path 预留 3 字节后追加 ".gz" 并打开；on 时设 gzip_vary，gzip_ok 未通过则 DECLINED。

## nginx--ngx_http_headers_filter_module--expires

- 语法（`expires [modified] time; expires epoch | max | off;`）：verified；source_ids：registration, configuration-definition, implementation-2
  - 判据：注册为 NGX_CONF_TAKE12；ngx_http_headers_expires 单参数为时间或 epoch/max/off，双参数时第一项须为 modified，时间含变量时运行期解析；epoch/max/off 与 @ 日时点由 ngx_http_parse_expires（implementation-2）解析（modified 时不识别 epoch/max/off，@ 日时点不可与 modified 同用），与 `expires [modified] time; expires epoch | max | off;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2
  - 判据：配置值写入 hcf->expires/expires_time（或 expires_value）；头过滤器对主请求且状态属安全状态时调用 ngx_http_set_expires，写入 Expires 与 Cache-Control（epoch/max 固定值；daily 用 ngx_next_time；modified 以 last_modified_time 为基；否则以当前时间为基并生成 max-age）。

## nginx--ngx_http_headers_filter_module--add_header

- 语法（`add_header name value [always];`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE23；ngx_http_headers_add 取 value[1] 为名、value[2] 为可含变量的值，第 3 参数仅接受 `always`，与 `add_header name value [always];` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3
  - 判据：指令把名与复杂值追加到 conf->headers（Cache-Control、Link、Last-Modified、ETag 选用专门 handler）；头过滤器对主请求遍历 headers，状态属安全集合或带 always 才求值并调用 handler 添加，值为空则不添加。

## nginx--ngx_http_headers_filter_module--add_trailer

- 语法（`add_trailer name value [always];`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE23；与 add_header 共用 ngx_http_headers_add，取名、可含变量的值与可选 `always`，与 `add_trailer name value [always];` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2
  - 判据：指令把名与复杂值追加到 conf->trailers；头过滤器据此置 r->expect_trailers，ngx_http_trailers_filter 在遇到 last_buf 的块时求值并向 headers_out.trailers 追加非空字段。

## nginx--ngx_http_image_filter_module--image_filter

- 语法（`image_filter off | test | size; image_filter rotate 90 | 180 | 270; image_filter resize width height; image_filter crop width height;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_HTTP_LOC_CONF|NGX_CONF_TAKE123；ngx_http_image_filter 单参数接受 off/test/size，双参数仅接受 rotate 加角度（90/180/270 或变量），三参数接受 resize/crop 加宽高，与 `off | test | size; rotate 90 | 180 | 270; resize width height; crop width height` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-3, implementation-4, implementation-5, implementation-6
  - 判据：filter 模式写入 imcf->filter；头过滤器在非 off 时建立上下文，体过滤器 ngx_http_image_test 识别 JPEG/GIF/PNG/WebP，test 直接放行，size 返回 JSON（ngx_http_image_json），其他经 ngx_http_image_process 与 resize 计算：resize 按比例缩到宽高内，crop 按比例缩放后裁剪，rotate 旋转。

## nginx--ngx_http_image_filter_module--image_filter_jpeg_quality

- 语法（`image_filter_jpeg_quality quality;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_http_image_filter_jpeg_quality 把 value[1] 编译为复杂值，无变量时须为正整数，与 `image_filter_jpeg_quality quality;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-3, implementation-4, implementation-5, summary-resize-encode
  - 判据：值写入 imcf->jpeg_quality 或 jqcv；resize 编码前调用 ngx_http_image_out，JPEG 分支以 ngx_http_image_filter_get_value(conf->jqcv, conf->jpeg_quality)（变量则求值）为 q 调用 gdImageJpegPtr(img, size, q)。
- 新增片段：summary-resize-encode（src/http/modules/ngx_http_image_filter_module.c:1041-1052）

## nginx--ngx_http_image_filter_module--image_filter_webp_quality

- 语法（`image_filter_webp_quality quality;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_http_image_filter_webp_quality 把 value[1] 编译为复杂值，无变量时须为正整数，与 `image_filter_webp_quality quality;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-3, implementation-4, implementation-5, summary-resize-encode
  - 判据：值写入 imcf->webp_quality 或 wqcv；resize 编码前调用 ngx_http_image_out，WebP 分支（仅 NGX_HAVE_GD_WEBP 时编译）以 get_value 结果调用 gdImageWebpPtrEx(img, size, q)，未带 GD WebP 支持则报错。
- 新增片段：summary-resize-encode（src/http/modules/ngx_http_image_filter_module.c:1041-1052）
- 修正（功能）：设置转换后WebP重新编码时传给GD库 gdImageWebpPtrEx 的质量参数（仅在构建时带有GD WebP支持时生效），可含变量。
  - 理由：原文未写 WebP 编码依赖构建时的 NGX_HAVE_GD_WEBP 条件，源码在无该支持时报错；补齐条件。

## nginx--ngx_http_image_filter_module--image_filter_sharpen

- 语法（`image_filter_sharpen percent;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_http_image_filter_sharpen 把 value[1] 编译为复杂值，无变量时须为非负整数，与 `image_filter_sharpen percent;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-3, implementation-4, implementation-5, d340-sharpen-use, d340-value, summary-process
  - 判据：值写入 imcf->sharpen 或 shcv；resize 在编码前以 ngx_http_image_filter_get_value(conf->shcv, conf->sharpen)（变量则求值）取值，大于 0 时调用 gdImageSharpen(dst, sharpen)。
- 新增片段：summary-process（src/http/modules/ngx_http_image_filter_module.c:525-577）
- 修正（功能）：设置图像转换输出前传给GD锐化函数 gdImageSharpen 的强度值（大于0时才调用），支持变量。
  - 理由：原文“强度百分比”属于 GD 库参数语义，锁定源码只证明该值被传给 gdImageSharpen；收窄为“强度值”。

## nginx--ngx_http_image_filter_module--image_filter_transparency

- 语法（`image_filter_transparency on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，ngx_conf_set_flag_slot 接受 on/off，与 `image_filter_transparency on | off;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-3, summary-process
  - 判据：transparency 由 flag_slot 写入，merge 默认 1；resize 在源图颜色总数非 0 且 conf->transparency 为真时读取源图透明色并在输出前重新设置。
- 新增片段：summary-process（src/http/modules/ngx_http_image_filter_module.c:525-577）
- 修正（功能）：控制图像转换时是否保留源图的透明色（仅在源图颜色总数非零时处理）。
  - 理由：原文“适用于GIF及使用调色板的PNG”依赖 GD 对图像类型的内部语义，源码只证明 colors 非零时按 transparency 保留透明色；收窄为可证明范围。

## nginx--ngx_http_image_filter_module--image_filter_interlace

- 语法（`image_filter_interlace on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，ngx_conf_set_flag_slot 接受 on/off，与 `image_filter_interlace on | off;` 一致。
- 功能：verified；source_ids：implementation-3, implementation-4, implementation-5, summary-process
  - 判据：interlace 由 flag_slot 写入，merge 默认 0；resize 在编码前调用 gdImageInterlace(dst, (int) conf->interlace)。
- 新增片段：summary-process（src/http/modules/ngx_http_image_filter_module.c:525-577）
- 修正（功能）：设置图像转换后、编码前传给GD库 gdImageInterlace 的交错扫描标志。
  - 理由：原文“JPEG可输出渐进式格式”是 GD 库的内部行为，锁定源码只证明该标志被传给 gdImageInterlace；已删去该分句。

## nginx--ngx_http_image_filter_module--image_filter_buffer

- 语法（`image_filter_buffer size;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_size_slot 接受大小，与 `image_filter_buffer size;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-3
  - 判据：buffer_size 由 size_slot 写入，merge 默认 1m；头过滤器在 Content-Length 大于它时返回 415，长度未知时以它作为 ctx->length；ngx_http_image_read 按 ctx->length 分配缓冲，累计超出则报错。

## nginx--ngx_http_index_module--index

- 语法（`index file ...;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_1MORE；ngx_http_index_set_index 逐参数追加到 indices，含变量时编译为脚本，空串报错，与 `index file ...;` 一致。
- 功能：verified；source_ids：implementation-1, implementation-2
  - 判据：handler 要求 URI 以 `/` 结尾且方法为 GET/HEAD/POST，按 ilcf->indices 顺序拼接候选路径并 ngx_open_cached_file 探测，找到后 ngx_http_internal_redirect 到对应 URI；绝对路径项直接内部跳转；merge 缺省 index.html。

## nginx--ngx_http_limit_conn_module--limit_conn_zone

- 语法（`limit_conn_zone key zone=name:size;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_HTTP_MAIN_CONF|NGX_CONF_TAKE2；ngx_http_limit_conn_zone 把 value[1] 编译为复杂值，其后参数仅接受 `zone=name:size`（size 不小于 8 页）且必须出现，与 `limit_conn_zone key zone=name:size;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4, runtime-limit-key, runtime-limit-node, runtime-limit-lookup, runtime-limit-cleanup
  - 判据：配置阶段 ngx_shared_memory_add 登记共享区，key 复杂值存入 ctx->key；handler 对 ctx->key 求值，在共享区内加锁查找/分配计数节点；红黑树与 slab 位于共享内存，由各 worker 以同一互斥锁访问。

## nginx--ngx_http_limit_conn_module--limit_conn

- 语法（`limit_conn zone number;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE2；ngx_http_limit_conn 取 value[1] 为区名、value[2] 为 1–65535 的整数，与 `limit_conn zone number;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4, runtime-generic-phase, runtime-limit-key, runtime-limit-node, runtime-limit-lookup, runtime-limit-rollback, runtime-limit-reject, runtime-limit-cleanup-install, runtime-limit-cleanup
  - 判据：配置写入 lccf->limits；handler 挂入 PREACCESS 阶段，对主请求按每个 limit 的 key 在共享区计数，达到 limits[i].conn 或无法分配节点时进入拒绝（返回 status_code）或 dry_run 分支，成功则安装 pool cleanup 在请求销毁时减计数。

## nginx--ngx_http_limit_conn_module--limit_conn_log_level

- 语法（`limit_conn_log_level info | notice | warn | error;`）：verified；source_ids：registration, configuration-definition, implementation-0
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_enum_slot 按取值表接受 info、notice、warn、error，与 `info | notice | warn | error` 一致。
- 功能：verified；source_ids：implementation-1
  - 判据：log_level 由 enum_slot 写入；handler 在计数达到上限时以 ngx_log_error(lccf->log_level, …) 记录 "limiting connections"，dry_run 时同一调用并带 ", dry run,"。

## nginx--ngx_http_limit_conn_module--limit_conn_status

- 语法（`limit_conn_status code;`）：verified；source_ids：registration, configuration-definition, implementation-0
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_num_slot 接受数字并受 400–599 边界表约束，与 `limit_conn_status code;` 一致。
- 功能：verified；source_ids：implementation-1
  - 判据：status_code 由 num_slot 写入；handler 在分配节点失败和计数达到上限的非 dry_run 分支均 return lccf->status_code，交由 PREACCESS 阶段 finalize。

## nginx--ngx_http_limit_conn_module--limit_conn_dry_run

- 语法（`limit_conn_dry_run on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，ngx_conf_set_flag_slot 接受 on/off，与 `limit_conn_dry_run on | off;` 一致。
- 功能：verified；source_ids：implementation-1, implementation-6
  - 判据：dry_run 由 flag_slot 写入；handler 先照常求 key 并检查共享计数，达到上限或分配失败时若 lccf->dry_run 则置 limit_conn_status 为 REJECTED_DRY_RUN 并返回 NGX_DECLINED；回滚函数同样处理。

## nginx--ngx_http_limit_req_module--limit_req_zone

- 语法（`limit_req_zone key zone=name:size rate=rate;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_HTTP_MAIN_CONF|NGX_CONF_TAKE3；ngx_http_limit_req_zone 把 value[1] 编译为复杂值，其后接受 `zone=name:size` 与 `rate=Nr/s|Nr/m`，其他参数（含官方文档的 sync）报错，与 `limit_req_zone key zone=name:size rate=rate;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1
  - 判据：rate 折算为毫秒制存入 ctx->rate；lookup 以 excess = lr->excess - ctx->rate*ms/1000 + 1000（不小于 0）计算随时间衰减的超额状态，节点存于共享区红黑树，handler 加锁访问。

## nginx--ngx_http_limit_req_module--limit_req

- 语法（`limit_req zone=name [burst=number] [nodelay | delay=number];`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE123；ngx_http_limit_req 逐项接受 `zone=`（必须出现）、`burst=`、`delay=`、`nodelay`，与 `limit_req zone=name [burst=number] [nodelay | delay=number];` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-4
  - 判据：burst、delay 写入 limit 并折算为千分制；PREACCESS handler 在 lookup 返回 NGX_BUSY（excess > burst）时拒绝，否则 ngx_http_limit_req_account 在 excess 超过 delay 时计算延迟并以定时器延迟请求；nodelay 把 delay 设为极大值。

## nginx--ngx_http_limit_req_module--limit_req_log_level

- 语法（`limit_req_log_level info | notice | warn | error;`）：verified；source_ids：registration, configuration-definition, implementation-0
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_enum_slot 按取值表接受 info、notice、warn、error，与 `info | notice | warn | error` 一致。
- 功能：verified；source_ids：implementation-1, implementation-4
  - 判据：limit_log_level 由 enum_slot 写入；merge 令 delay_log_level 为 info（若 limit 为 info）否则 limit+1；handler 拒绝时以 limit_log_level、延迟时以 delay_log_level 记录日志，dry_run 日志同样使用。

## nginx--ngx_http_limit_req_module--limit_req_status

- 语法（`limit_req_status code;`）：verified；source_ids：registration, configuration-definition, implementation-0
  - 判据：注册为 NGX_CONF_TAKE1，ngx_conf_set_num_slot 接受数字并受 400–599 边界表约束，与 `limit_req_status code;` 一致。
- 功能：verified；source_ids：implementation-1, implementation-2
  - 判据：status_code 由 num_slot 写入；handler 在 lookup 返回 NGX_BUSY 或 NGX_ERROR（含分配节点失败）且非 dry_run 时 return lrcf->status_code。

## nginx--ngx_http_limit_req_module--limit_req_dry_run

- 语法（`limit_req_dry_run on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG，ngx_conf_set_flag_slot 接受 on/off，与 `limit_req_dry_run on | off;` 一致。
- 功能：verified；source_ids：implementation-1, implementation-2
  - 判据：dry_run 由 flag_slot 写入；handler 照常调用 lookup/account 更新共享区状态，拒绝分支在 dry_run 时置 REJECTED_DRY_RUN、延迟分支置 DELAYED_DRY_RUN，均返回 NGX_DECLINED 继续处理。

## nginx--ngx_http_copy_filter_module--output_buffers

- 语法（`output_buffers number size;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE2，ngx_conf_set_bufs_slot 取数量与大小，与 `output_buffers number size;` 一致。
- 功能：verified；source_ids：implementation-0, implementation-1, implementation-2, implementation-3, implementation-4
  - 判据：bufs 由 bufs_slot 写入 conf->bufs，merge 默认 2×32768；copy 过滤器建立 ctx 时 ctx->bufs = conf->bufs；ngx_output_chain 在需要复制时以 ctx->bufs.num 限制分配数，ngx_output_chain_get_buf 以 ctx->bufs.size 为单块目标大小（末块较小时缩小）。
