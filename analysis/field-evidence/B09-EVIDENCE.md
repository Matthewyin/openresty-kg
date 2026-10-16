# B09 字段证据记录

范围：nginx 其余 HTTP 模块（log 至 xslt，含 upstream 系列），共 75 条。固定 revision：nginx release-1.27.1；涉及补丁的条目按已有补丁来源核对。官方文档为现行版本，仅作交叉印证。

## nginx--ngx_http_log_module--log_format

- 语法（`log_format name [escape=default|json|none] string ...;`）：verified；source_ids：registration, configuration-definition, implementation-0
  - 判据：注册为 NGX_CONF_2MORE（name 加至少一个 string）；ngx_http_log_set_format 取 value[1] 为格式名，ngx_http_log_compile_format 从第 3 个参数起，若以 escape= 开头则只接受 json、none、default 三个取值（其余报错），其后各参数逐个编译为日志操作，与语法一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, runtime-http-format-mode, distribution-patch-0, runtime-http-escape-patch
  - 判据：set_format 把参数交给 compile_format，文字段编译为 copy 操作、$变量经 ngx_http_log_variable_compile 编译为取值操作；escape 值在 variable_compile 的 switch 中分别选 JSON、无转义或默认三组 getlen/run 函数；默认组 ngx_http_log_variable 经补丁改为调用带 lcf 的 ngx_http_log_escape，由 lcf->escape_non_ascii 决定是否转义非 ASCII 字节。

## nginx--ngx_http_log_module--access_log

- 语法（`access_log path [format [buffer=size] [gzip[=level]] [flush=time] [if=condition]]; ⏎ access_log off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_1MORE；ngx_http_log_set_log 中 value[1] 为 off（仅 1 个参数时）或路径/syslog:，value[2] 为格式名，从第 4 个参数起逐项识别 buffer=、flush=、gzip[=level]（1–9）、if=，其他报 invalid parameter，与语法一致。
- 功能：verified；source_ids：configuration-definition, log-phase, runtime-http-log-install, runtime-http-log-end, runtime-http-log-consume, runtime-http-log-filter, runtime-http-access-run, runtime-http-access-buffer, runtime-http-buffer-flush, runtime-http-file-write, implementation-2
  - 判据：ngx_http_log_init 在 LOG 阶段登记 ngx_http_log_handler，请求结束时由 ngx_http_log_request 逐个执行；handler 依 lcf->off 跳过全部日志，否则遍历 lcf->logs，if= 的 filter 为空或 "0" 时跳过，按格式 ops 生成日志行，经缓冲（buffer/flush/gzip）或直接写入文件/syslog；merge 在本层无 logs 且未 off 时继承上层。

## nginx--ngx_http_log_module--open_log_file_cache

- 语法（`open_log_file_cache max=N [inactive=time] [min_uses=N] [valid=time]; ⏎ open_log_file_cache off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1234（1–4 个参数）；ngx_http_log_open_file_cache 逐个参数识别 max=、inactive=、min_uses=、valid=、off，其他报错；非 off 时要求 max 非 0，与语法一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4, summary-oc-init, summary-oc-max, summary-oc-cleanup, summary-oc-close, summary-script-create, summary-script-run
  - 判据：access_log 路径含变量时才建 log->script，写日志走 ngx_http_log_script_write；该函数以 llcf->open_file_cache_valid/min_uses 填 of 并调用 ngx_open_cached_file(llcf->open_file_cache,…)。setter 把 max、inactive 传给 ngx_open_file_cache_init（存为 cache->max/inactive），valid、min_uses 存入 loc_conf；缓存条目达 max 时淘汰最久未用项，超过 inactive 的条目被清理，uses 小于 min_uses 的描述符在释放时关闭，valid 参与 now - created < valid 的重验证。
- 新增片段：summary-oc-init（src/core/ngx_open_file_cache.c:57-76）；summary-oc-max（src/core/ngx_open_file_cache.c:360-364）；summary-oc-cleanup（src/core/ngx_open_file_cache.c:436-446）；summary-oc-close（src/core/ngx_open_file_cache.c:1017-1026）；summary-script-create（src/http/modules/ngx_http_log_module.c:1301-1332）；summary-script-run（src/http/modules/ngx_http_log_module.c:417-436）

## nginx--ngx_http_map_module--map

- 语法（`map string $variable { ... }`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_HTTP_MAIN_CONF|NGX_CONF_BLOCK|NGX_CONF_TAKE2；ngx_http_map_block 把 value[1] 编译为复杂值作输入，value[2] 必须以 $ 开头作新变量名，随后解析块内容，与 `map string $variable { ... }` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2, implementation-3
  - 判据：map_block 注册 $变量的 get_handler=ngx_http_map_variable（读取时才求值）；其对输入复杂值求值后经 ngx_http_map_find 查找：先查精确哈希与 hostnames 的通配 head/tail（ngx_hash_find_combined），再按 ~ / ~* 正则顺序匹配；块内值经 ngx_http_compile_complex_value 编译，含变量时在 map_variable 中再次求值。正则分支依赖 NGX_PCRE 编译条件，行为限于 map 自身，不展开 PCRE 库内部。

## nginx--ngx_http_map_module--map_hash_max_size

- 语法（`map_hash_max_size number;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1、ngx_conf_set_num_slot，值写入 hash_max_size，与 `number` 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2
  - 判据：map_block 在未设置时默认 2048，并以 hash.max_size = mcf->hash_max_size 交给 ngx_hash_init；ngx_hash_init 对 size 从估算起点循环到 max_size 尝试，无法满足时提示增大 map_hash_max_size/bucket_size，说明它是桶数上限而非条目数或请求数限制。

## nginx--ngx_http_map_module--map_hash_bucket_size

- 语法（`map_hash_bucket_size number;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1、ngx_conf_set_num_slot，值写入 hash_bucket_size，与 `number` 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2
  - 判据：map_block 对已设置的值按 ngx_cacheline_size 做 ngx_align（未设置则取 ngx_cacheline_size），再赋给 hash.bucket_size；ngx_hash_init 要求桶容量不小于元素大小加指针，否则报错并提示增大 bucket_size，桶内累计长度超过桶容量则增加桶数。

## nginx--ngx_http_mirror_module--mirror

- 语法（`mirror uri | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_http_mirror 对 value[1] 为 off 置空镜像列表，否则把 uri 追加入数组（off 与 uri 互斥会报 is duplicate），与 `uri | off` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2, implementation-3
  - 判据：init 把 ngx_http_mirror_handler 挂入 PRECONTENT 阶段；handler 仅处理主请求且 mlcf->mirror 非空，ngx_http_mirror_handler_internal 遍历 mirror 数组，对每个 uri 调用 ngx_http_subrequest(r, &name[i], &r->args, …, NGX_HTTP_SUBREQUEST_BACKGROUND)，并令子请求 header_only、沿用 r->method；同一层多条 mirror 追加到同一数组。

## nginx--ngx_http_mirror_module--mirror_request_body

- 语法（`mirror_request_body on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG、ngx_conf_set_flag_slot，只接受 on/off，与语法一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2
  - 判据：指令经 offsetof 写入 mlcf->request_body（merge 默认 1）；handler 取 mlcf 后若其为真则创建 ctx 并调用 ngx_http_read_client_request_body(r, ngx_http_mirror_body_handler)，body_handler 内创建镜像、置 preserve_body=1 并重新运行阶段；为假则直接调用 handler_internal。

## nginx--ngx_http_mp4_module--mp4

- 语法（`mp4;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_HTTP_LOC_CONF|NGX_CONF_NOARGS，无参数；ngx_http_mp4 不读取参数，与语法 `mp4;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-2, implementation-3, implementation-4
  - 判据：setter 令 clcf->handler=ngx_http_mp4_handler，ngx_http_update_location_config 把它设为 r->content_handler，content 阶段调用；handler 读取 start、end 参数（ngx_http_arg），start>=0 时建 mp4 文件对象并经 ngx_http_mp4_process 重写 moov 等元数据后输出，未给 start 时直接按原文件输出。

## nginx--ngx_http_mp4_module--mp4_buffer_size

- 语法（`mp4_buffer_size size;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1、ngx_conf_set_size_slot，值为 size，与语法一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, implementation-3
  - 判据：指令写入 conf->buffer_size（merge 默认 512K）；ngx_http_mp4_process 取 loc_conf 并令 mp4->buffer_size = conf->buffer_size，ngx_http_mp4_read 按该大小分配并读取文件缓冲，用于读取 moov 等元数据。

## nginx--ngx_http_mp4_module--mp4_max_buffer_size

- 语法（`mp4_max_buffer_size size;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1、ngx_conf_set_size_slot，值为 size，与语法一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1
  - 判据：指令写入 conf->max_buffer_size（merge 默认 10M）；ngx_http_mp4_read_moov_atom 取 loc_conf，当 moov 数据大于 mp4->buffer_size 时，若超过 conf->max_buffer_size 则报错并提示增大 mp4_max_buffer_size，否则按 moov 大小扩容缓冲。

## nginx--ngx_http_mp4_module--mp4_start_key_frame

- 语法（`mp4_start_key_frame on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG、ngx_conf_set_flag_slot，只接受 on/off，与语法一致。
- 功能：verified；source_ids：registration, implementation-1, implementation-2, implementation-3, summary-edts-call
  - 判据：指令写入 conf->start_key_frame（merge 默认 0）；ngx_http_mp4_seek_key_frame 取 loc_conf，为 0 直接返回 0，否则在 stss 中求起始样本前的关键帧差 key_prefix；crop_stts 据此前移 start_sample 并累加 trak->prefix，update_edts_atom（由 process 调用）在 prefix 非 0 时把它写入 elst 的 media_time。
- 新增片段：summary-edts-call（src/http/modules/ngx_http_mp4_module.c:874-881）

## nginx--ngx_http_random_index_module--random_index

- 语法（`random_index on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG、ngx_conf_set_flag_slot，只接受 on/off，与语法一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1
  - 判据：指令写入 rlcf->enable（merge 默认 0）；init 把 handler 挂入 CONTENT 阶段；handler 仅处理以 / 结尾且方法为 GET/HEAD/POST、enable 为真的请求，读目录并跳过以 . 开头项和非普通文件，用 ngx_random 在文件名数组中取一项，拼接为 URI 后调用 ngx_http_internal_redirect；无可用文件时返回 DECLINED。

## nginx--ngx_http_realip_module--set_real_ip_from

- 语法（`set_real_ip_from address | CIDR | unix: | hostname;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_http_realip_from 依次处理 `unix:`（NGX_HAVE_UNIX_DOMAIN 下）、ngx_ptocidr 解析的地址/CIDR，其余按主机名经 ngx_inet_resolve_host 解析，与 `address | CIDR | unix: | hostname` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, forwarded-address, summary-cidr-match
  - 判据：setter 把地址、CIDR、AF_UNIX 项及主机名解析出的地址追加到 rlcf->from；handler 取 loc_conf，from 为空即不处理，否则把 rlcf->from 作为 proxies 传入 ngx_http_get_forwarded_addr，由 ngx_cidr_match 判断连接地址是否在集合内（AF_UNIX 项匹配 AF_UNIX 连接），只有匹配才会取头部地址替换；该集合只用于该判断，不参与访问控制。
- 新增片段：summary-cidr-match（src/core/ngx_inet.c:495-556）

## nginx--ngx_http_realip_module--real_ip_header

- 语法（`real_ip_header field | X-Real-IP | X-Forwarded-For | proxy_protocol;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；setter 对 value[1] 依次比较 X-Real-IP、X-Forwarded-For、proxy_protocol，其他值记为自定义头名（保存小写哈希与头名），与语法一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1
  - 判据：setter 设置 rlcf->type（merge 默认 X-Real-IP）及 header；handler 按 type 分别取 X-Real-IP 头、X-Forwarded-For 头、遍历请求头匹配自定义头名，或取 proxy_protocol->src_addr；取得值后仍调用 ngx_http_get_forwarded_addr(…, rlcf->from, …) 受信任集合约束，PROXY 类型时还用 proxy_protocol->src_port 设置端口。

## nginx--ngx_http_realip_module--real_ip_recursive

- 语法（`real_ip_recursive on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG、ngx_conf_set_flag_slot，只接受 on/off，与语法一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, forwarded-address
  - 判据：指令写入 rlcf->recursive（merge 默认 0），handler 把它传给 ngx_http_get_forwarded_addr；internal 函数循环条件为 recursive && p > xff，每轮先检查当前地址是否在 proxies 内，不在则停止，从右端取一个地址，解析失败则停止；recursive 为 0 时只循环一次。

## nginx--ngx_http_referer_module--valid_referers

- 语法（`valid_referers none | blocked | server_names | string ...;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_1MORE；ngx_http_valid_referers 逐个参数识别 none、blocked、server_names、以 ~ 开头的正则，其余按主机名（可带通配与 URI 路径）加入哈希，与语法一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2
  - 判据：模块注册 $invalid_referer 变量的 get_handler；ngx_http_referer_variable 在没有规则时视为有效，Referer 缺失（none）、非 http(s) 前缀（blocked）、server_names、哈希/通配主机匹配及正则匹配命中时返回空值，否则返回 true_value（1）；指令只配置规则集合，不产生响应。正则相关分支依赖 NGX_PCRE，不展开库内部。

## nginx--ngx_http_referer_module--referer_hash_max_size

- 语法（`referer_hash_max_size number;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1、ngx_conf_set_num_slot，值为 number，与语法一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1
  - 判据：指令写入 referer_hash_max_size（create 为 UNSET，merge 默认 2048）；merge_conf 把 hash.max_size = conf->referer_hash_max_size 后调用 ngx_hash_init 构建 referer_hash，仅作为哈希构建参数。

## nginx--ngx_http_referer_module--referer_hash_bucket_size

- 语法（`referer_hash_bucket_size number;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1、ngx_conf_set_num_slot，值为 number，与语法一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1
  - 判据：指令写入 referer_hash_bucket_size（merge 默认 64）；merge_conf 先对其 ngx_align 到 ngx_cacheline_size，再赋给 hash.bucket_size 调用 ngx_hash_init，仅为哈希构建参数。

## nginx--ngx_http_rewrite_module--rewrite

- 语法（`rewrite regex replacement [last | break | redirect | permanent];`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE23（regex、replacement，可选第 3 个参数）；ngx_http_rewrite 对第 4 个参数只接受 last、break、redirect、permanent，其余报 invalid parameter，与语法一致。
- 功能：verified；source_ids：configuration-definition, d340-phases, implementation-0, implementation-1, implementation-2, implementation-3
  - 判据：setter 把 value[1] 编译为正则、value[2] 编译为替换脚本并生成 regex_start_code；rewrite 阶段 ngx_http_rewrite_handler 取 loc_conf 并按顺序执行编译后的 codes，regex_start_code 对当前 URI 匹配，匹配后 regex_end_code 改写 r->uri/args（redirect 类则设置 Location 并返回 302/301）；core 的 post_rewrite 阶段在 uri_changed 时重新查找 location。

## nginx--ngx_http_rewrite_module--return

- 语法（`return code [text]; ⏎ return code URL; ⏎ return URL;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE12；ngx_http_rewrite_return 先把 value[1] 当状态码（须不超过 999），不是数字时仅在只有 1 个参数且以 http://、https://、$scheme 开头才作为 URL，对应 `code [text]`、`code URL`、`URL` 三种写法。
- 功能：verified；source_ids：configuration-definition, d340-phases, implementation-0, implementation-1, implementation-2, implementation-3
  - 判据：setter 生成 ngx_http_script_return_code：只有 URL 时状态为 302，数值状态码带第二参数时将其编译为文本/URL，仅状态码时文本为空；执行时 script_return_code 令 e->status 并结束脚本（e->ip=exit），handler 随后据此返回状态，core 的 send_response 对 3xx 以文本为 Location，其他状态以文本为响应体，后续本组指令不再执行。

## nginx--ngx_http_rewrite_module--break

- 语法（`break;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_NOARGS；ngx_http_rewrite_break 不读取参数，与 `break;` 一致。
- 功能：verified；source_ids：configuration-definition, d340-phases, implementation-0, implementation-1, implementation-2
  - 判据：setter 向 codes 加入 ngx_http_script_break_code；该 code 在 r->uri_changed 时置 valid_location=0、uri_changed=0，并令 e->ip=ngx_http_script_exit 结束本组；post_rewrite 阶段因 uri_changed 为 0 直接 phase_handler++ 并继续，不重新查找 location。
- 修正（功能）：结束当前 rewrite 指令组的执行；若本组已经改写 URI，同时清除 URI 改变标志并把 valid_location 置 0，不重新查找 location。后续请求阶段仍继续。
  - 理由：源码只证明 break_code 把 r->valid_location 置 0，原文“使原 location 映射失效”是对该字段的解释，片段中没有该字段含义的定义，收窄为字段赋值。

## nginx--ngx_http_rewrite_module--if

- 语法（`if (condition) { ... }`）：verified；source_ids：registration, configuration-definition, implementation-0
  - 判据：注册为 NGX_CONF_BLOCK|NGX_CONF_1MORE（SRV/LOC）；ngx_http_rewrite_if_condition 要求首参以 ( 开头、末参以 ) 结尾，其间为单个变量、变量与 = / != 的值、~ / ~* / !~ / !~* 的正则，或 -f/-d/-e/-x 及其取反的文件测试，与 `if (condition) { ... }` 一致。
- 功能：verified；source_ids：configuration-definition, d340-use, implementation-0, implementation-1, d340-if-context
  - 判据：setter 为块创建匿名 location 配置并编译条件码和 ngx_http_script_if_code；执行时条件为真则继续执行块内 codes，且 if_code->loc_conf 非空（location 内的 if）时令 r->loc_conf = code->loc_conf；条件为假则 e->ip += code->next 跳过块内指令。

## nginx--ngx_http_rewrite_module--set

- 语法（`set $variable value;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE2；ngx_http_rewrite_set 要求 value[1] 以 $ 开头作变量名，value[2] 经 ngx_http_rewrite_value 编译为值，与 `set $variable value;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2, implementation-3, runtime-value-stack, runtime-variable-copy, runtime-capture-copy, rewrite-phase-registration
  - 判据：setter 编译值（纯文本为 value_code，含变量或捕获为 complex_value_code）后，变量有 set_handler 时加 var_set_handler_code，否则加 set_var_code；rewrite 阶段 handler 顺序执行 codes，值入栈后写入 r->variables[index]（或调用变量 setter），因此是请求执行到该指令时才赋值。

## nginx--ngx_http_rewrite_module--rewrite_log

- 语法（`rewrite_log on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG、ngx_conf_set_flag_slot，只接受 on/off，与语法一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, implementation-3
  - 判据：指令值写入 loc_conf.log（merge 默认 0）；rewrite_handler 令 e->log = rlcf->log，regex_start_code 与 regex_end_code 在 e->log 为真时以 NGX_LOG_NOTICE 记录“does not match”、“matches”、“rewritten data/redirect”，这些分支只记日志，不改变后续匹配与改写。

## nginx--ngx_http_rewrite_module--uninitialized_variable_warn

- 语法（`uninitialized_variable_warn on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG、ngx_conf_set_flag_slot，只接受 on/off，与语法一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2
  - 判据：ngx_http_rewrite_set 为变量设置 get_handler=ngx_http_rewrite_var；其取 loc_conf 后，uninitialized_variable_warn 为 0 直接返回 null_value，否则先 NGX_LOG_WARN 记录“using uninitialized variable”再返回 null_value；指令值 merge 默认 1。

## nginx--ngx_http_secure_link_module--secure_link

- 语法（`secure_link expression;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；配置解析走 ngx_http_set_complex_value_slot，把参数编译为复杂值，与 `expression` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1
  - 判据：指令值写入 conf->variable；$secure_link 的 get_handler 在 conf->variable 与 conf->md5 均存在时求值 variable，以逗号分隔出校验值与可选过期时间，校验值经 base64url 解码须为 16 字节，再与 secure_link_md5 表达式的 MD5 比较；相等时返回 "1"，有过期时间且已过期返回 "0"，其余为无值；过期时间另由 $secure_link_expires 暴露。

## nginx--ngx_http_secure_link_module--secure_link_md5

- 语法（`secure_link_md5 expression;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；配置解析走 ngx_http_set_complex_value_slot，把参数编译为复杂值，与 `expression` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1
  - 判据：指令值写入 conf->md5；$secure_link 的 get_handler 对该复杂值求值，对结果字节串（val.data、val.len）做 ngx_md5_init/update/final，并与 secure_link 解码出的 16 字节校验值 memcmp；conf->md5 为空时变量无值。

## nginx--ngx_http_secure_link_module--secure_link_secret

- 语法（`secure_link_secret word;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1、ngx_conf_set_str_slot，值为单个字符串，与 `word` 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2
  - 判据：指令写入 conf->secret；变量 handler 在 secret.data 非空时转入 ngx_http_secure_link_old_variable：从 r->unparsed_uri 取第一个 / 之后、第二个 / 之前的段作为摘要（须为 32 个字符），其后的剩余部分为 link；对 link 加 secret 计算 MD5，与 32 位十六进制逐字节比较，相同时变量值为 link；merge 要求 secret 不与 secure_link/secure_link_md5 同层混用。

## nginx--ngx_http_slice_filter_module--slice

- 语法（`slice size;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1、ngx_conf_set_size_slot，值为 size，与语法一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, implementation-3
  - 判据：指令写入 slcf->size（merge 默认 0）；$slice_range 的 get_handler 在 size 为 0 时无值，否则按 size 对齐起点生成 "bytes=start-end"；头过滤器检查上游 206 响应的 Content-Range 并把响应改写为 200 与总长度，体过滤器在尚有剩余范围时用 ngx_http_subrequest 创建 CLONE 子请求并重新生成 range，直至 start>=end 发送结束。

## nginx--ngx_http_split_clients_module--split_clients

- 语法（`split_clients string $variable { percentage value; ... * value; }`）：verified；source_ids：registration, configuration-definition, implementation-1
  - 判据：注册为 NGX_HTTP_MAIN_CONF|NGX_CONF_BLOCK|NGX_CONF_TAKE2；setter 取 value[1] 为输入复杂值、value[2] 须以 $ 开头；块内每条由 ngx_http_split_clients 解析，首参为 `*` 或以 % 结尾的百分数（最多两位小数，不能为 0），次参为文字值，总和不得超过 100%，与语法一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1
  - 判据：变量 get_handler 为 ngx_http_split_clients_variable：对输入复杂值求值后做 ngx_murmur_hash2，依次与各部分累计的 percent*0xffffffff/10000 边界比较，小于边界或为 `*` 时把该部分的字面值赋给变量；先将变量置 null_value，故未命中且无 `*` 时为空。

## nginx--ngx_http_ssi_filter_module--ssi

- 语法（`ssi on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG、ngx_conf_set_flag_slot，只接受 on/off，与语法一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4, summary-body-slcf
  - 判据：指令写入 slcf->enable（merge 默认 0）；头过滤器取 slcf，enable 为假、长度为 0 或类型不匹配时直接传下游，否则创建 ctx；体过滤器取 slcf 后解析标记，查到命令后执行 cmd->handler，命令表含 include、echo、config、set、if/elif/else/endif、block/endblock。
- 新增片段：summary-body-slcf（src/http/modules/ngx_http_ssi_filter_module.c:478-482）

## nginx--ngx_http_ssi_filter_module--ssi_silent_errors

- 语法（`ssi_silent_errors on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG、ngx_conf_set_flag_slot，只接受 on/off，与语法一致。
- 功能：verified；source_ids：registration, implementation-1, implementation-2, summary-body-slcf
  - 判据：指令写入 slcf->silent_errors（merge 默认 0）；体过滤器取 slcf，命令出错落入 ssi_error 后，silent_errors 为真则 continue 不写入，否则把 ctx->errmsg（“[an error occurred while processing the directive]”）作为输出缓冲插入。
- 新增片段：summary-body-slcf（src/http/modules/ngx_http_ssi_filter_module.c:478-482）

## nginx--ngx_http_ssi_filter_module--ssi_ignore_recycled_buffers

- 语法（`ssi_ignore_recycled_buffers on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG、ngx_conf_set_flag_slot，只接受 on/off，与语法一致。
- 功能：verified；source_ids：registration, implementation-1, implementation-2, summary-body-slcf
  - 判据：指令写入 slcf->ignore_recycled_buffers（merge 默认 0）；体过滤器取 slcf，为输入缓冲生成的输出缓冲 b 令 b->shadow=ctx->buf，仅当该值为 0 时执行 b->recycled = ctx->buf->recycled。
- 修正（功能）：控制SSI为输入缓冲生成的输出缓冲是否继承输入缓冲的recycled标志；on时跳过该标志复制。
  - 理由：原文“输出尾随缓冲”在片段中没有对应的描述，源码只显示该分支在 last_buf 或内存缓冲的输出缓冲上执行，收窄为此范围。
- 新增片段：summary-body-slcf（src/http/modules/ngx_http_ssi_filter_module.c:478-482）

## nginx--ngx_http_ssi_filter_module--ssi_min_file_chunk

- 语法（`ssi_min_file_chunk size;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1、ngx_conf_set_size_slot，值为 size，与语法一致。
- 功能：verified；source_ids：registration, implementation-1, implementation-2, summary-body-slcf
  - 判据：指令写入 slcf->min_file_chunk（merge 默认 1024）；体过滤器取 slcf，复制缓冲时若 b->in_file，则当 min_file_chunk 小于该片段长度（b->last - b->pos）时重新计算 file_pos/file_last 保留文件范围，否则令 b->in_file=0。
- 修正（功能）：控制SSI输出的普通文件内容片段是否保留in_file及文件偏移：片段长度大于该值时保留，否则清除in_file。
  - 理由：原文“以便后续输出链有条件使用文件发送”是用途推断，片段只证明 in_file 与文件偏移的保留/清除，收窄为源码可证明的行为。
- 新增片段：summary-body-slcf（src/http/modules/ngx_http_ssi_filter_module.c:478-482）

## nginx--ngx_http_ssi_filter_module--ssi_value_length

- 语法（`ssi_value_length length;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1、ngx_conf_set_size_slot，值为 size/length，与语法一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, implementation-3
  - 判据：指令写入 slcf->value_len（merge 默认 255）；头过滤器令 ctx->value_len = slcf->value_len；解析参数值时分配 ctx->value_len + 1 字节，参数值长度达到 value_len 时记录 “too long … value” 错误并转入 ssi_error_state。

## nginx--ngx_http_ssi_filter_module--ssi_types

- 语法（`ssi_types mime-type ... | *;`）：verified；source_ids：registration, configuration-definition, implementation-3
  - 判据：注册为 NGX_CONF_1MORE、ngx_http_types_slot；该函数逐参数登记 MIME 类型，参数 `*` 时置为匹配任意类型，与 `mime-type ...` 一致（`*` 的取值见修正）。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, implementation-3
  - 判据：指令写入 slcf->types_keys（默认类型表 text/html）；merge 经 ngx_http_merge_types 转为 types 哈希；头过滤器以 !slcf->enable 或 ngx_http_test_content_type(r, &slcf->types)==NULL 判断是否跳过，因此须 ssi 开启且类型匹配。
- 修正（语法）：ssi_types mime-type ... | *;
  - 理由：ngx_http_types_slot 对参数 `*` 单独处理（置为匹配任意类型），原语法未列出该取值，按最小化补齐。

## nginx--ngx_http_ssi_filter_module--ssi_last_modified

- 语法（`ssi_last_modified on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG、ngx_conf_set_flag_slot，只接受 on/off，与语法一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1
  - 判据：指令写入 slcf->last_modified（merge 默认 0）；头过滤器在 r == r->main 时，该值为 0 则 ngx_http_clear_last_modified 与 clear_etag，为真则保留 Last-Modified（ETag 改为弱 ETag）。

## nginx--ngx_http_stub_status_module--stub_status

- 语法（`stub_status; ⏎ stub_status value;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_NOARGS|NGX_CONF_TAKE1（0 或 1 个参数）；ngx_http_set_stub_status 不读取 cf->args，因此有无参数均只安装处理器，参数值没有语义，原语法占位符 argument 误导，改为 value。
- 功能：verified；source_ids：configuration-definition, implementation-0, d340-handler-select, d340-location-select
  - 判据：setter 令 clcf->handler=ngx_http_stub_status_handler，location 选定后 r->content_handler 取该 handler；handler 仅允许 GET/HEAD，输出 text/plain，内容为 Active connections、accepts/handled/requests 三项和 Reading/Writing/Waiting 计数（读取 ngx_stat_* 共享计数）。
- 修正（语法）：stub_status;
stub_status value;
  - 理由：ngx_http_set_stub_status 不读取参数值（废弃的可选参数只被注册标志接受），占位符 argument 易被误解为有语义的参数，按裁定改为 value。

## nginx--ngx_http_sub_filter_module--sub_filter

- 语法（`sub_filter string replacement;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE2；ngx_http_sub_filter 要求 value[1] 非空、最多 255 条，value[1] 与 value[2] 各自编译为复杂值，与 `string replacement` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-3, implementation-4
  - 判据：setter 把查找串转小写并编译（含变量则标记 dynamic，运行时求值后再转小写），替换值编译为复杂值；头过滤器仅在 slcf->pairs 非空、长度非 0 且类型匹配时建立 ctx；体过滤器用小写化后的表匹配，匹配后对 pair->value 求值并输出替换内容，所以匹配忽略大小写，查找串和替换值都可含变量。

## nginx--ngx_http_sub_filter_module--sub_filter_types

- 语法（`sub_filter_types mime-type ... | *;`）：verified；source_ids：registration, configuration-definition, implementation-4
  - 判据：注册为 NGX_CONF_1MORE、ngx_http_types_slot；该函数逐参数登记 MIME 类型，参数 `*` 时置为匹配任意类型，与 `mime-type ...` 一致（`*` 的取值见修正）。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4
  - 判据：指令写入 slcf->types_keys（默认类型表 text/html），merge 经 ngx_http_merge_types 转为 types 哈希；头过滤器以 ngx_http_test_content_type(r, &slcf->types)==NULL 作为跳过条件之一，另需 slcf->pairs 非空，因此只对匹配类型且配置了 sub_filter 的响应执行替换。
- 修正（语法）：sub_filter_types mime-type ... | *;
  - 理由：ngx_http_types_slot 对参数 `*` 单独处理（置为匹配任意类型），原语法未列出该取值，按最小化补齐。

## nginx--ngx_http_sub_filter_module--sub_filter_once

- 语法（`sub_filter_once on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG、ngx_conf_set_flag_slot，只接受 on/off，与语法一致。
- 功能：verified；source_ids：registration, implementation-1, implementation-3, implementation-4, summary-once-slcf
  - 判据：指令写入 slcf->once（merge 默认 1）；体过滤器取 slcf，每替换一个查找串就令 ctx->once = slcf->once && (++ctx->applied == matches->nelts)；搜索时 slcf->once 为真且该串已有替换结果（ctx->sub[i].data）则跳过，因此 on 时每个查找串只替换一次，全部替换过后停止搜索，off 时继续匹配。
- 新增片段：summary-once-slcf（src/http/modules/ngx_http_sub_filter_module.c:441-442）

## nginx--ngx_http_sub_filter_module--sub_filter_last_modified

- 语法（`sub_filter_last_modified on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG、ngx_conf_set_flag_slot，只接受 on/off，与语法一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1
  - 判据：指令写入 slcf->last_modified（merge 默认 0）；头过滤器建立 ctx 后，对 r == r->main 的主响应，该值为 0 则 ngx_http_clear_last_modified 与 clear_etag，为真则保留 Last-Modified（ETag 改为弱 ETag）。

## nginx--ngx_http_try_files_module--try_files

- 语法（`try_files file ... uri; ⏎ try_files file ... =code;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_2MORE；ngx_http_try_files 对前 n-1 个参数作为候选文件（末尾 / 表示目录，含变量则编译脚本），末个参数以 = 开头时解析为状态码（不得超过 999），否则作为 URI 或 @命名 location，与语法一致（命名 location 由运行时判断 @ 前缀，视为 uri 形式）。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2, d340-phase
  - 判据：init 把 ngx_http_try_files_handler 挂入 PRECONTENT 阶段；handler 在 try_files 为空时 DECLINED，否则依次把候选名映射为路径并 ngx_open_cached_file 检查是否存在且类型（文件/目录）相符，命中则改写 r->uri 并返回 DECLINED 让后续阶段继续；到最后一项时返回状态码，或对 @ 开头调用 ngx_http_named_location，否则 ngx_http_internal_redirect 到该 URI。

## nginx--ngx_http_upstream_hash_module--hash

- 语法（`hash key [consistent];`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_HTTP_UPS_CONF|NGX_CONF_TAKE12；ngx_http_upstream_hash 把 value[1] 编译为复杂值 key，可选第 2 个参数只接受 consistent（令 init_upstream 为 init_chash），其余报 invalid parameter，与 `hash key [consistent]` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4
  - 判据：setter 把 key 编译为复杂值并按有无 consistent 选择 init_hash 或 init_chash；普通模式的 peer 初始化对 key 求值，get_hash_peer 以 crc32(key)（重试时叠加 rehash 与前一哈希）对 total_weight 取模，按权重落点选后端；consistent 模式的 init_chash 按各后端地址与权重（权重×160 个点）计算 crc32 点并排序，请求时以 crc32(key) 在点环上二分定位后续后端。
- 修正（功能）：按可含变量的 key 值选择 HTTP upstream 后端；普通模式对 key 求 crc32 后按权重取模选址，consistent 模式按后端地址与权重生成一致性哈希点，再用 key 的 crc32 在点环上定位。
  - 理由：原文“ketama”与“减少成员变化时的键重映射”在锁定源码片段中没有出现，属于算法名称与设计目的，收窄为源码可证明的 crc32 加权取模与带权重的一致性哈希点环。

## nginx--ngx_http_upstream_ip_hash_module--ip_hash

- 语法（`ip_hash;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_HTTP_UPS_CONF|NGX_CONF_NOARGS；ngx_http_upstream_ip_hash 不读取参数，与 `ip_hash;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1
  - 判据：setter 令 uscf->peer.init_upstream=ngx_http_upstream_init_ip_hash；peer 初始化按 r->connection->sockaddr 取 AF_INET 的 4 字节地址但 addrlen=3（前三个字节），AF_INET6（NGX_HAVE_INET6）取 16 字节，其他族用 3 字节伪地址；get_ip_hash_peer 对地址字节做 hash=(hash*113+byte)%6271，再对 total_weight 取模按权重选后端。

## nginx--ngx_http_upstream_keepalive_module--keepalive

- 语法（`keepalive connections;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_HTTP_UPS_CONF|NGX_CONF_TAKE1；ngx_http_upstream_keepalive 用 ngx_atoi 解析 value[1]，要求为正整数，写入 max_cached，与 `connections` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2
  - 判据：setter 设置 max_cached 并把 init_upstream 换成 ngx_http_upstream_init_keepalive；init 以 max_cached 个缓存项预分配空闲队列并保存原 init_peer，peer 初始化后包装 get/free；get_keepalive_peer 先调用 original_get_peer 确定后端，再在 cache 队列中按 sockaddr 比较查找可复用连接；free_keepalive_peer 在空闲队列为空时关闭 cache 队列尾部（最久未使用）连接并复用其项。
- 修正（功能）：为 HTTP upstream 启用空闲连接缓存；先由原选址器确定后端，再查找该端点可复用的连接，缓存满时淘汰最久未使用项。
  - 理由：原文“每个 worker 自己的”是由缓存分配在配置内存池推出的结论，片段中没有 worker 归属的直接陈述，予以删去。

## nginx--ngx_http_upstream_keepalive_module--keepalive_time

- 语法（`keepalive_time time;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1、ngx_conf_set_msec_slot，用 ngx_parse_time 解析时间，与 `time` 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, summary-kp-conf
  - 判据：指令值写入 kcf->time（初始化默认 3600000 毫秒）；init_keepalive_peer 令 kp->conf=kcf；free_keepalive_peer 比较 ngx_current_msec - c->start_time > kp->conf->time，成立则不缓存；start_time 在建立上游连接时设置，复用不会重置。
- 新增片段：summary-kp-conf（src/http/modules/ngx_http_upstream_keepalive_module.c:202-222）

## nginx--ngx_http_upstream_keepalive_module--keepalive_timeout

- 语法（`keepalive_timeout timeout;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1、ngx_conf_set_msec_slot，用 ngx_parse_time 解析时间，与 `timeout` 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, implementation-3, summary-kp-conf
  - 判据：指令值写入 kcf->timeout（初始化默认 60000 毫秒）；free_keepalive_peer 入池时 ngx_add_timer(c->read, kp->conf->timeout) 并改读事件处理为 close_handler；get_keepalive_peer 取出时 ngx_del_timer(c->read)；close_handler 在 c->read->timedout 时关闭连接并归还缓存项。
- 新增片段：summary-kp-conf（src/http/modules/ngx_http_upstream_keepalive_module.c:202-222）

## nginx--ngx_http_upstream_keepalive_module--keepalive_requests

- 语法（`keepalive_requests number;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1、ngx_conf_set_num_slot，值为 number，与语法一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, implementation-3, summary-kp-conf
  - 判据：指令值写入 kcf->requests（初始化默认 1000）；upstream 连接就绪后 c->requests++；free_keepalive_peer 判断 c->requests >= kp->conf->requests 则不缓存，直接按原路径释放。
- 新增片段：summary-kp-conf（src/http/modules/ngx_http_upstream_keepalive_module.c:202-222）

## nginx--ngx_http_upstream_least_conn_module--least_conn

- 语法（`least_conn;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_HTTP_UPS_CONF|NGX_CONF_NOARGS；ngx_http_upstream_least_conn 不读取参数，与 `least_conn;` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2
  - 判据：setter 令 init_upstream=ngx_http_upstream_init_least_conn，peer 初始化后 peer.get=get_least_conn_peer；该函数跳过 down、失败超限与达到 max_conns 的后端，用 peer->conns * best->weight < best->conns * peer->weight 选出最小比值，比值相等的多个后端再按 current_weight/effective_weight 的加权轮询选取，并在选中后 conns++；无可用主后端时转入备份。

## nginx--ngx_http_upstream_random_module--random

- 语法（`random; ⏎ random two [least_conn];`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_NOARGS|NGX_CONF_TAKE12；ngx_http_upstream_random 对有参数时 value[1] 只接受 two，第 3 个参数只接受 least_conn，其余报 invalid parameter，与 `random; random two [least_conn];` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2, implementation-3
  - 判据：setter 设 init_upstream=init_random 并在 two 时置 rcf->two；init 按权重累加建 ranges，peer 初始化按 rcf->two 选 get_random2_peer 或 get_random_peer；random 用 ngx_random()%total_weight 二分定位后端；random2 抽取两个不同后端（与上一个相同则重抽），较轻者按 peer->conns * prev->weight > prev->conns * peer->weight 比较选取。

## nginx--ngx_http_upstream_zone_module--zone

- 语法（`zone name [size];`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_HTTP_UPS_CONF|NGX_CONF_TAKE12；ngx_http_upstream_zone 要求 value[1] 非空作为 zone 名，可选 value[2] 用 ngx_parse_size 解析并不得小于 8 个页，与 `zone name [size]` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4, implementation-5, implementation-6, summary-copy-peer, summary-shm-alloc, summary-shm-map
  - 判据：setter 经 ngx_shared_memory_add 登记同名共享区（同名同用途可重复声明）并设 init=ngx_http_upstream_init_zone；init 遍历 upstream，把 shm_zone 相同的各组 peers 及其 peer 结构（含 weight、conns、fails 等字段）复制进 shpool（copy_peer 在 slab 中分配 peer 并 ngx_memcpy 整个 peer 结构），之后读写由 rwlock 保护；cycle 对登记的 zone 调用 ngx_shm_alloc（Unix 下 mmap 为 MAP_ANON|MAP_SHARED，需 NGX_HAVE_MAP_ANON）并调用 init，即放入 MAP_ANON|MAP_SHARED 映射的命名共享内存。
- 修正（功能）：将 HTTP upstream 组的 peer 配置及连接数、失败、权重等运行状态放入 MAP_ANON|MAP_SHARED 映射的命名共享内存；多个组可使用同一 zone。
  - 理由：原文“使多个 worker 共享这些状态”依赖 fork 后映射继承，片段中无 fork 环节，收窄为源码可证明的共享映射内存。
- 新增片段：summary-copy-peer（src/http/modules/ngx_http_upstream_zone_module.c:264-325）；summary-shm-alloc（src/core/ngx_cycle.c:485-495）；summary-shm-map（src/os/unix/ngx_shmem.c:11-28）

## nginx--ngx_http_userid_filter_module--userid

- 语法（`userid on | v1 | log | off;`）：verified；source_ids：registration, configuration-definition, implementation-3
  - 判据：注册为 NGX_CONF_TAKE1、ngx_conf_set_enum_slot；取值表 ngx_http_userid_state 只含 off、log、v1、on 四项，与 `on | v1 | log | off` 完整一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-3, implementation-4, implementation-5
  - 判据：enable 取值 OFF=0、LOG=1、V1=2、ON=3；header filter 在 enable < V1（即 off、log）时不发 Cookie，$uid_got 变量仅在 OFF 时无值（log 仍读取请求 Cookie）；set_uid 在 enable == V1 时生成旧格式标识，其余（on）走 v2 格式分支，并写 Set-Cookie。

## nginx--ngx_http_userid_filter_module--userid_service

- 语法（`userid_service number;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1、ngx_conf_set_num_slot，值为 number，与语法一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, implementation-3
  - 判据：指令值写入 conf->service（merge 为 UNSET）；header filter 把 conf 传给 set_uid，v1 分支令 uid_set[0]=conf->service（未设为 0），v2 分支 uid_set[0]=htonl(conf->service)（未设时取本地地址），uid_set 数组即输出标识的各 32 位字段，第一个字段为服务编号。

## nginx--ngx_http_userid_filter_module--userid_name

- 语法（`userid_name name;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1、ngx_conf_set_str_slot，值为单个字符串，与语法一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4
  - 判据：指令值写入 conf->name（merge 默认 "uid"）；get_uid 以 &conf->name 在请求 Cookie 中查找标识；set_uid 以 conf->name 作为 Set-Cookie 名；$uid_got/$uid_set 变量把 &conf->name 作为前缀拼接格式化值。

## nginx--ngx_http_userid_filter_module--userid_domain

- 语法（`userid_domain name | none;`）：verified；source_ids：registration, configuration-definition, implementation-3, implementation-4
  - 判据：注册为 NGX_CONF_TAKE1、ngx_conf_set_str_slot，后置处理 ngx_http_userid_domain 对值 none 置空，其余加上 "; domain=" 前缀，与 `name | none` 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4
  - 判据：后置处理 ngx_http_userid_domain 把值存为 "; domain=name" 或（none）空串，merge 默认空；set_uid 在 conf->domain.len 非 0 时把它复制进 Set-Cookie，因此 none 不输出 Domain。

## nginx--ngx_http_userid_filter_module--userid_path

- 语法（`userid_path path;`）：verified；source_ids：registration, configuration-definition, implementation-3, implementation-4
  - 判据：注册为 NGX_CONF_TAKE1、ngx_conf_set_str_slot，后置处理 ngx_http_userid_path 给值加上 "; path=" 前缀，与 `path` 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4
  - 判据：后置处理 ngx_http_userid_path 把值存为 "; path=value"，merge 默认 "; path=/"；set_uid 把 conf->path 复制进 Set-Cookie。

## nginx--ngx_http_userid_filter_module--userid_expires

- 语法（`userid_expires time | max | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_http_userid_expires 对 value[1] 依次判断 max、off，其余用 ngx_parse_time 解析为时长，与 `time | max | off` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2
  - 判据：setter 把 max 记为 NGX_HTTP_USERID_MAX_EXPIRES、off 记为 0、其余为秒数（merge 默认 0）；set_uid 在 expires 为 MAX 时输出固定的 "expires=Thu, 31-Dec-37 23:55:55 GMT"，为正数时输出 ngx_time()+expires 的 Cookie 时间，为 0 则不输出 Expires。

## nginx--ngx_http_userid_filter_module--userid_flags

- 语法（`userid_flags off | flag ...;`）：verified；source_ids：registration, configuration-definition, implementation-3
  - 判据：注册为 NGX_CONF_1MORE、ngx_conf_set_bitmask_slot，取值表 ngx_http_userid_flags 为 off、secure、httponly、samesite=strict、samesite=lax、samesite=none，与 `off | flag ...` 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, implementation-3
  - 判据：指令值写入 conf->flags 位掩码（merge 默认 0）；set_uid 按 SECURE、HTTPONLY、SAMESITE_STRICT/LAX/NONE 位各追加对应 Cookie 属性，off 对应位值 0，因此单独使用时不追加这些属性。

## nginx--ngx_http_userid_filter_module--userid_p3p

- 语法（`userid_p3p string | none;`）：verified；source_ids：registration, configuration-definition, implementation-3, implementation-4
  - 判据：注册为 NGX_CONF_TAKE1、ngx_conf_set_str_slot，后置处理 ngx_http_userid_p3p 对值 none 置空，与 `string | none` 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4
  - 判据：后置处理使 none 变为空串，merge 默认空；set_uid 在 conf->p3p.len 非 0 时向响应头列表追加 P3P: conf->p3p，为 0 则直接返回，不输出。

## nginx--ngx_http_userid_filter_module--userid_mark

- 语法（`userid_mark letter | digit | = | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_http_userid_mark 对 value[1] 接受 off，或单个字母、数字、=，其余报错，与 `letter | digit | = | off` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4
  - 判据：setter 把 mark 存入 conf->mark（off 为 0）；set_uid 发 Cookie 时若 conf->mark 非 0，把它写入 base64 末尾填充位置；对已有有效标识，若 conf->mark 非 0 且 cookie 中该位置与 mark 不同，则复制 uid_got 到 uid_set 后继续发 Cookie，相同则直接返回不重发。

## nginx--ngx_http_xslt_filter_module--xml_entities

- 语法（`xml_entities path;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1；ngx_http_xslt_entities 以 value[1] 为路径调用 xmlParseDTD，同一路径复用已解析结果，与 `path` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-3
  - 判据：setter 在配置期调用 xmlParseDTD(NULL, path) 并存入 xlcf->dtd；响应体解析时 ngx_http_xslt_add_chunk 把 ctxt->sax->externalSubset 设为 ngx_http_xslt_sax_external_subset，该回调取 loc_conf 的 conf->dtd，将其（复制或复用）设为文档的 extSubset；头过滤器仅在已配置样式表且类型匹配时建立 ctx。
- 修正（功能）：在配置时解析指定路径的DTD，XSLT模块解析响应XML时在外部子集回调中把该DTD设为文档的外部子集。
  - 理由：原文“声明字符实体”描述的是 DTD 文件的预期用途，实体展开由 libxml2 完成，锁定源码只证明配置期 xmlParseDTD 解析与外部子集回调的挂接，收窄为此范围。

## nginx--ngx_http_xslt_filter_module--xslt_stylesheet

- 语法（`xslt_stylesheet stylesheet [parameter=value ...];`）：verified；source_ids：registration, configuration-definition, implementation-4
  - 判据：注册为 NGX_CONF_1MORE；ngx_http_xslt_stylesheet 以 value[1] 为样式表文件（xsltParseStylesheetFile），其后每个参数编译为复杂值，运行时按 `name=value` 解析（同一参数内可用 `:` 连接多项，值做 URI 反转义），与 `stylesheet [parameter=value ...]` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4
  - 判据：setter 把样式表（配置期解析）追加到 xlcf->sheets；头过滤器要求 sheets 非空且类型匹配；体过滤器把整个响应用 push parser 解析完并 well-formed 后，ngx_http_xslt_apply_stylesheet 依次对每个 sheets 调用 xsltApplyStylesheetUser（上一次结果作下一次输入），最后用 xsltSaveResultToString 序列化并作为响应输出。

## nginx--ngx_http_xslt_filter_module--xslt_param

- 语法（`xslt_param parameter value;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE2；ngx_http_xslt_param 取 value[1] 为参数名、value[2] 编译为复杂值，与 `parameter value` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-3, implementation-4
  - 判据：setter 把参数名与编译后的值追加到 xlcf->params（quote=0）；apply_stylesheet 对每个样式表先调用 ngx_http_xslt_params，对复杂值求值后把参数名和结果字符串推入 ctx->params，随后传给 xsltApplyStylesheetUser。
- 修正（功能）：为XSLT样式表定义参数，先计算Nginx变量，再把结果字符串作为参数值传给libxslt（不做字符串引用包装）。
  - 理由：原文“把值作为XPath表达式”是 libxslt 对未引用参数值的解释，锁定源码只证明 nginx 把求值结果字符串原样放入参数数组，收窄为此范围。

## nginx--ngx_http_xslt_filter_module--xslt_string_param

- 语法（`xslt_string_param parameter value;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE2；与 xslt_param 共用 ngx_http_xslt_param，post 非空令 quote=1，与 `parameter value` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-3, implementation-4
  - 判据：共用 setter 因 cmd->post 非空令 param->quote=1；ngx_http_xslt_params 对 quote 参数调用 xsltQuoteOneUserParam(transform, name, value) 注册参数，而不是推入 ctx->params 数组。
- 修正（功能）：为XSLT样式表定义字符串参数，先计算Nginx变量，再通过 xsltQuoteOneUserParam 以引用字符串方式传入。
  - 理由：原文“不把值作为XPath求值”是 libxslt 的内部语义，锁定源码只证明走 xsltQuoteOneUserParam 路径，收窄为此范围。

## nginx--ngx_http_xslt_filter_module--xslt_types

- 语法（`xslt_types mime-type ... | *;`）：verified；source_ids：registration, configuration-definition, implementation-4
  - 判据：注册为 NGX_CONF_1MORE、ngx_http_types_slot；该函数逐参数登记 MIME 类型，参数 `*` 时置为匹配任意类型，与 `mime-type ...` 一致（`*` 的取值见修正）。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4, implementation-5
  - 判据：指令写入 conf->types_keys（默认类型表 text/xml），merge 经 ngx_http_merge_types 转为 types 哈希；头过滤器在 sheets 为空或 ngx_http_test_content_type(r, &conf->types)==NULL 时跳过，因此需配置样式表且类型匹配。
- 修正（语法）：xslt_types mime-type ... | *;
  - 理由：ngx_http_types_slot 对参数 `*` 单独处理（置为匹配任意类型），原语法未列出该取值，按最小化补齐。

## nginx--ngx_http_xslt_filter_module--xslt_last_modified

- 语法（`xslt_last_modified on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_FLAG、ngx_conf_set_flag_slot，只接受 on/off，与语法一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2, implementation-3
  - 判据：指令写入 conf->last_modified（merge 默认 0）；ngx_http_xslt_send 在 r == r->main 时，该值为 0 则 ngx_http_clear_last_modified 与 clear_etag，为真则保留 Last-Modified（ETag 改为弱 ETag）。

## nginx--ngx_http_perl_module--perl_modules

- 语法（`perl_modules path;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1、ngx_conf_set_str_array_slot，每次出现把一个路径追加进数组，与 `path` 一致。
- 功能：verified；source_ids：registration, implementation-0, d340-interpreter-args
  - 判据：指令值写入 pmcf->modules；ngx_http_perl_init_interpreter 对每个路径做 ngx_conf_full_name，并在 perl_parse 的 embedding 参数中为每项加入 "-I" 与路径，随后 -Mnginx。
- 修正（功能）：为嵌入式Perl解释器设置附加目录，创建解释器时以-I参数传给perl_parse。
  - 理由：原文“模块搜索目录”是 Perl 对 -I 的语义，锁定源码只证明 nginx 把路径作为 -I 参数传入 perl_parse，收窄为此范围。

## nginx--ngx_http_perl_module--perl_require

- 语法（`perl_require module;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_CONF_TAKE1、ngx_conf_set_str_array_slot，每次出现把一个模块名追加进数组，与 `module` 一致。
- 功能：verified；source_ids：registration, implementation-0, implementation-1, implementation-2
  - 判据：指令值写入 pmcf->requires；ngx_http_perl_init_interpreter 在创建解释器（perl_parse 之后）及复用已有解释器的分支中都调用 ngx_http_perl_run_requires，它对数组每项执行 require_pv，出错时记录并返回 NGX_ERROR。

## nginx--ngx_http_perl_module--perl

- 语法（`perl module::function | 'sub { ... }';`）：verified；source_ids：registration, configuration-definition, implementation-1
  - 判据：注册为 NGX_HTTP_LOC_CONF|NGX_HTTP_LMT_CONF|NGX_CONF_TAKE1；ngx_http_perl 取 value[1]，ngx_http_perl_eval_anon_sub 对以 "sub "、"sub{" 开头的字符串 eval_pv 为匿名子程序，否则按函数名保存，与 `module::function | 'sub { ... }'` 一致（该函数还把以 "use " 开头的字符串送入 eval_pv，但这不是处理器写法，语法不列）。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2, implementation-3, implementation-4
  - 判据：setter 保存 plcf->handler/sub 并令 clcf->handler=ngx_http_perl_handler，location 选定后作为 content handler 调用；handler 取 plcf->sub 经 ngx_http_perl_call_handler 用 call_sv 调用（函数名或匿名子程序），按返回值处理响应。

## nginx--ngx_http_perl_module--perl_set

- 语法（`perl_set $variable module::function | 'sub { ... }';`）：verified；source_ids：registration, configuration-definition, implementation-1
  - 判据：注册为 NGX_HTTP_MAIN_CONF|NGX_CONF_TAKE2；ngx_http_perl_set 要求 value[1] 以 $ 开头作变量名，value[2] 与 perl 指令相同经 eval_anon_sub 处理为匿名子程序或函数名，与 `$variable module::function | 'sub { ... }'` 一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2
  - 判据：setter 注册变量 get_handler=ngx_http_perl_variable 并保存 pv->sub；变量被读取时该 handler 经 ngx_http_perl_call_handler 调用 pv->sub，把返回的字符串写入 value 并填入 v->data/len，无返回则 not_found。

## nginx--ngx_http_upstream_module--upstream

- 语法（`upstream name { ... }`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_HTTP_MAIN_CONF|NGX_CONF_BLOCK|NGX_CONF_TAKE1；ngx_http_upstream 以 value[1] 为组名（u.host）调用 ngx_http_upstream_add，创建块上下文后用 ngx_conf_parse 解析块内容，与 `upstream name { ... }` 一致。
- 功能：verified；source_ids：configuration-definition, upstream-config-context, implementation-0, implementation-1
  - 判据：setter 以允许 weight、max_conns、max_fails、fail_timeout、down、backup 的标志登记 upstream 组，为块创建独立的 srv_conf/loc_conf 上下文并设 cmd_type=NGX_HTTP_UPS_CONF 后解析，块内无 server 则报错；ngx_http_upstream_init_main_conf 对每个组调用 peer.init_upstream，未设置时使用 ngx_http_upstream_init_round_robin（加权轮询）。

## nginx--ngx_http_upstream_module--server

- 语法（`server address [weight=number] [max_conns=number] [max_fails=number] [fail_timeout=time] [backup] [down];`）：verified；source_ids：registration, configuration-definition
  - 判据：注册为 NGX_HTTP_UPS_CONF|NGX_CONF_1MORE；ngx_http_upstream_server 以 value[1] 为地址（默认端口 80，经 ngx_parse_url 解析），其后逐项识别 weight=、max_conns=、max_fails=、fail_timeout=、backup、down，其余报错，且各参数受所在 upstream 的 flags 限制，与语法一致。
- 功能：verified；source_ids：configuration-definition, implementation-0, implementation-1, implementation-2, implementation-3, implementation-5
  - 判据：setter 把地址解析出的 addrs/naddrs 与 weight、max_conns、max_fails、fail_timeout、backup、down 写入 ngx_http_upstream_server_t；round robin 初始化对每个 server 的每个解析地址各建一个 peer 并复制这些字段，失败后按 max_fails/fail_timeout 在 free_round_robin_peer 中计数暂避，weight 影响轮询权重，max_conns 在选 peer 时限制活动连接，down 的 peer 被跳过。

## nginx--ngx_http_log_module--log_escape_non_ascii

- 语法（`log_escape_non_ascii on | off;`）：verified；source_ids：registration, configuration-definition
  - 判据：注册在补丁中为 NGX_CONF_FLAG、ngx_conf_set_flag_slot，只接受 on/off，与语法一致。
- 功能：verified；source_ids：registration, configuration-definition, escape-patch, summary-escape-fn
  - 判据：补丁把指令存入 loc_conf.escape_non_ascii（merge 默认 1），默认转义函数 ngx_http_log_escape 据此对 escape[4..7]（0x80–0xff）整体置位或清零；位表中其余 ASCII 位不受影响，并以 \xHH 输出。仅默认转义路径带 lcf 参数，JSON/none 路径不引用该值。
- 新增片段：summary-escape-fn（src/http/modules/ngx_http_log_module.c:991-1048）
