# B16 字段证据（nginx-module-vts 部门扩展）

范围：24 条；固定快照 nginx-module-vts `52fe11e44c47a49b052be89e36dfa17d81bf52a5`（commit_snapshot，不推断现场版本）。新增 evidence 均读取该快照源码；nginx 核心引用来自 `release-1.27.1`。README 仅交叉印证，未作为唯一依据。

## nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status

- 语法：verified
  - source_ids：registration（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:76-81）；configuration-definition（nginx:src/core/ngx_conf_file.c:1026-1063）
  - 判据：标准 flag setter：注册标志含 NGX_CONF_FLAG（仅 on/off 一个参数），ngx_conf_set_flag_slot 解析 on/off。
- 功能：verified
  - source_ids：stats-handler（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:281-329）；main-defaults（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:970-980）；zone-enable（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:583-605）；merge-values（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:1123-1150）；limit-handler（nginx-module-vts:src/ngx_http_vhost_traffic_status_limit.c:13-54）
  - 判据：LOG 统计 handler 首行判断 !ctx->enable || !vtscf->enable（本指令写入 enable）；ctx->enable 在 init_main_conf 初值 0、zone 解析时置 1；merge 默认 enable=1；limit-handler 只检查 limit/bypass_limit 而不读 enable，印证“不是统一总开关”。
- 修正：无
- 缺口：无

## nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_filter

- 语法：verified
  - source_ids：registration（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:83-88）；configuration-definition（nginx:src/core/ngx_conf_file.c:1026-1063）
  - 判据：标准 flag setter：注册标志含 NGX_CONF_FLAG（仅 on/off 一个参数），ngx_conf_set_flag_slot 解析 on/off。
- 功能：verified
  - source_ids：filter-handler（nginx-module-vts:src/ngx_http_vhost_traffic_status_shm.c:521-589）；set-handler（nginx-module-vts:src/ngx_http_vhost_traffic_status_set.c:30-52）；stats-handler（新增，nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:281-329）；merge-values（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:1123-1150）
  - 判据：本指令写入 loc->filter：shm_add_server 以 filter && filter_host 选 Host 键，shm_add_filter 在 !filter 时直接返回，set_handler 在 !filter 时跳过变量处理；stats-handler 中 server/upstream 统计不检查 filter，故关闭后仍保留。
- 修正：无
- 缺口：无

## nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_filter_by_host

- 语法：verified
  - source_ids：registration（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:90-95）；configuration-definition（nginx:src/core/ngx_conf_file.c:1026-1063）
  - 判据：标准 flag setter：注册标志含 NGX_CONF_FLAG（仅 on/off 一个参数），ngx_conf_set_flag_slot 解析 on/off。
- 功能：verified
  - source_ids：host-key（nginx-module-vts:src/ngx_http_vhost_traffic_status_shm.c:521-554）；final25-key-build（nginx-module-vts:src/ngx_http_vhost_traffic_status_node.c:13-36）
  - 判据：本指令写入 loc->filter_host：shm_add_server/find_name 以 filter && filter_host && headers_in.server.len 取 Host，否则取 cscf->server_name，空名称置为 "_"，随后由 generate_key 组成节点键。
- 修正：无
- 缺口：无

## nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_filter_check_duplicate

- 语法：verified
  - source_ids：registration（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:97-102）；configuration-definition（nginx:src/core/ngx_conf_file.c:1026-1063）
  - 判据：标准 flag setter：注册标志含 NGX_CONF_FLAG（仅 on/off 一个参数），ngx_conf_set_flag_slot 解析 on/off。
- 功能：verified
  - source_ids：main-filter-unique（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:934-951）；local-filter-unique（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:1069-1083）；filter-unique（nginx-module-vts:src/ngx_http_vhost_traffic_status_filter.c:36-129）；merge-values（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:1123-1150）
  - 判据：本指令写入 filter_check_duplicate：init_main_conf 与 merge_loc_conf 在其非 0 时调用 filter_unique；该函数以 filter_key 与 filter_name 拼接后的 crc32 去重。
- 修正：无
- 缺口：无

## nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_filter_by_set_key

- 语法：verified
  - source_ids：registration（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:104-109）；filter-parser（nginx-module-vts:src/ngx_http_vhost_traffic_status_filter.c:365-437）
  - 判据：NGX_CONF_TAKE12（1–2 个参数）；解析函数读取 value[1] 作为键，nelts==3 时 value[2] 作为组名，否则组名为空串，均 ngx_http_compile_complex_value。
- 功能：verified
  - source_ids：filter-parser（nginx-module-vts:src/ngx_http_vhost_traffic_status_filter.c:365-437）；filter-runtime（nginx-module-vts:src/ngx_http_vhost_traffic_status_shm.c:558-589）；filter-node（新增，nginx-module-vts:src/ngx_http_vhost_traffic_status_shm.c:444-517）；stats-handler（新增，nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:281-329）；log-register（新增，nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:876-884）；filter-inheritance（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:1069-1083）
  - 判据：解析函数把键/组名存入 ctx->filter_keys（http 层）或 loc->filter_keys；LOG 阶段 stats-handler 调 shm_add_filter，分别遍历 ctx 与 loc 规则，filter_node 求值键后按“组@键”入节点累计，空键跳过；merge 阶段子级继承父级规则。
- 修正：无
- 缺口：无

## nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_filter_max_node

- 语法：verified
  - source_ids：registration（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:111-116）；max-node-parser（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:702-748）
  - 判据：NGX_CONF_1MORE；解析函数 value[1] 经 ngx_atoi 作为数量（负数报错），value[2..] 逐个保存为组前缀。
- 功能：verified
  - source_ids：max-node-parser（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:702-748）；group-prefix（nginx-module-vts:src/ngx_http_vhost_traffic_status_filter.c:336-361）；filter-lru（nginx-module-vts:src/ngx_http_vhost_traffic_status_node.c:219-291）；lru-scan（新增，nginx-module-vts:src/ngx_http_vhost_traffic_status_node.c:294-346）；last-used（nginx-module-vts:src/ngx_http_vhost_traffic_status_node.c:327-346）；node-evict（新增，nginx-module-vts:src/ngx_http_vhost_traffic_status_shm.c:220-238）
  - 判据：解析函数写入 ctx->filter_max_node 与 matches；新建节点时 shm_add_node 调 find_lru：上限为 0 禁用，仅对 FG 组且命中前缀（strncmp）计数，used>=上限时 find_lru_node 在命中范围内按 stat_last_seen 取最小者，随后被删除。
- 修正：无
- 缺口：无

## nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_limit

- 语法：verified
  - source_ids：registration（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:118-123）；configuration-definition（nginx:src/core/ngx_conf_file.c:1026-1063）
  - 判据：标准 flag setter：注册标志含 NGX_CONF_FLAG（仅 on/off 一个参数），ngx_conf_set_flag_slot 解析 on/off。
- 功能：verified
  - source_ids：limit-handler（nginx-module-vts:src/ngx_http_vhost_traffic_status_limit.c:13-54）；limit-register（新增，nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:860-866）；merge-values（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:1123-1150）
  - 判据：本指令写入 loc->limit：limit-register 把 limit_handler 挂入 PREACCESS 阶段，handler 首行 !ctx->enable || !vtscf->limit || vtscf->bypass_limit 即返回 DECLINED；其后才逐类检查规则。
- 修正：无
- 缺口：无

## nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_limit_check_duplicate

- 语法：verified
  - source_ids：registration（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:125-130）；configuration-definition（nginx:src/core/ngx_conf_file.c:1026-1063）
  - 判据：标准 flag setter：注册标志含 NGX_CONF_FLAG（仅 on/off 一个参数），ngx_conf_set_flag_slot 解析 on/off。
- 功能：verified
  - source_ids：main-limit-unique（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:953-970）；local-limit-unique（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:1085-1120）；limit-unique（nginx-module-vts:src/ngx_http_vhost_traffic_status_limit.c:378-471）；merge-values（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:1123-1150）
  - 判据：本指令写入 limit_check_duplicate：init_main_conf 对 ctx->limit_traffics 与 limit_filter_traffics 去重，merge_loc_conf 对局部两类列表去重；limit_traffic_unique 以 key 与 variable 拼接的 crc32 比较。
- 修正：无
- 缺口：无

## nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_limit_traffic

- 语法：verified
  - source_ids：registration（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:132-137）；limit-parser（nginx-module-vts:src/ngx_http_vhost_traffic_status_limit.c:164-255）
  - 判据：NGX_CONF_TAKE12；解析函数 value[1] 以首个 ":" 拆为 member 与 size（ngx_parse_offset），nelts==3 时 value[2] 经 ngx_atoi 为 code，否则 503。
- 功能：verified
  - source_ids：limit-parser（nginx-module-vts:src/ngx_http_vhost_traffic_status_limit.c:164-255）；limit-evaluation（nginx-module-vts:src/ngx_http_vhost_traffic_status_limit.c:13-159）；limit-register（新增，nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:860-866）；limit-inheritance（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:1085-1120）
  - 判据：解析结果按层级存入 ctx->limit_traffics 或 loc->limit_traffics（type=server，key 为空）；PREACCESS 的 limit_handler 依次评估，handler_traffic 用当前 server 名生成键查已有节点，traffic_used > size 时返回 code；merge 阶段继承。
- 修正：无
- 缺口：无

## nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_limit_traffic_by_set_key

- 语法：verified
  - source_ids：registration（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:139-144）；key-limit-parser（nginx-module-vts:src/ngx_http_vhost_traffic_status_limit.c:259-374）
  - 判据：NGX_CONF_TAKE23；解析函数 value[1] 为键、value[2] 以 ":" 拆为 member 与 size，nelts==4 时 value[3] 为 code，否则 503。
- 功能：verified
  - source_ids：key-limit-parser（nginx-module-vts:src/ngx_http_vhost_traffic_status_limit.c:259-374）；limit-evaluation（nginx-module-vts:src/ngx_http_vhost_traffic_status_limit.c:13-159）；limit-register（新增，nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:860-866）；limit-inheritance（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:1085-1120）
  - 判据：解析函数把键与 member 分别编译为复杂值，并由键前缀得到 group 类型，存入 limit_filter_traffics；PREACCESS 评估时 key 非空，按求值键与 type 查找节点并读取 member，严格大于 size 返回 code。
- 修正：无
- 缺口：无

## nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_zone

- 语法：verified
  - source_ids：registration（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:146-151）；zone-parser（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:583-666）；module-constants（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.h:49-56）；arg-count（新增，nginx:src/core/ngx_conf_file.c:413-443）；argument-table（新增，nginx:src/core/ngx_conf_file.c:50-59）
  - 判据：注册标志 NOARGS|TAKE1，ngx_conf_handler 以 argument_number 表放行 0 或 1 个参数；解析函数循环 value[i]，只接受 "shared:" 前缀，以 ":" 拆 name 与 size（ngx_parse_size），其他参数报 invalid parameter；默认名/大小见常量。
- 功能：verified
  - source_ids：zone-parser（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:583-666）；module-constants（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.h:49-56）；main-defaults（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:970-980）
  - 判据：解析函数置 ctx->enable=1，使用默认名称/大小或 shared:name:size，经 ngx_shared_memory_add 绑定并设置 init；MAIN_CONF 限定仅 http 层。
- 修正：无
- 缺口：无

## nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_measure_status_codes

- 语法：verified
  - source_ids：registration（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:153-158）；status-code-parser（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:520-579）；arg-count（新增，nginx:src/core/ngx_conf_file.c:413-443）
  - 判据：注册标志 NOARGS|1MORE，ngx_conf_handler 先判 1MORE 要求 nelts>=2，故至少 1 个参数；解析函数 value[1] 以 "all" 开头走全量分支，否则逐个 ngx_atoi 校验 100–599 且不得递减。
- 功能：verified
  - source_ids：status-code-parser（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:520-579）；status-code-output（nginx-module-vts:src/ngx_http_vhost_traffic_status_display_prometheus.c:80-111）；status-code-json-output（nginx-module-vts:src/ngx_http_vhost_traffic_status_display_json.c:164-181）；status-slot（新增，nginx-module-vts:src/ngx_http_vhost_traffic_status_shm.c:189-201）；status-counters（新增，nginx-module-vts:src/ngx_http_vhost_traffic_status_shm.c:258-268）
  - 判据：解析函数填充 ctx->measure_status_codes（all 时 100–599）；shm_add_node 据此分配计数器并计算槽位；JSON 与 Prometheus 输出逐码读取计数。
- 修正：无
- 缺口：无

## nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_dump

- 语法：verified
  - source_ids：registration（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:160-165）；dump-parser（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:670-698）
  - 判据：NGX_CONF_TAKE12；解析函数 value[1] 为文件路径，nelts==3 时 value[2] 经 ngx_parse_time(..., 0) 得到毫秒周期。
- 功能：verified
  - source_ids：dump-parser（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:670-698）；dump-worker（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:1167-1230）
  - 判据：解析函数置 ctx->dump=1 并保存 dump_file/dump_period；init_worker 在 ctx->enable & ctx->dump 且 rbtree 存在时 ngx_add_timer 并执行 restore，exit_worker 同条件下执行 dump。
- 修正：无
- 缺口：无

## nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_display

- 语法：verified
  - source_ids：registration（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:167-172）；display-binding（nginx-module-vts:src/ngx_http_vhost_traffic_status_display.c:1040-1048）；arg-count（新增，nginx:src/core/ngx_conf_file.c:413-443）；argument-table（新增，nginx:src/core/ngx_conf_file.c:50-59）
  - 判据：注册标志 NOARGS|TAKE1，放行 0 或 1 个参数；display 函数全程不读取 cf->args，仅设置 clcf->handler，故参数被忽略。
- 功能：verified
  - source_ids：display-binding（nginx-module-vts:src/ngx_http_vhost_traffic_status_display.c:1040-1048）；display-handler（nginx-module-vts:src/ngx_http_vhost_traffic_status_display.c:116-159）；control-commands（nginx-module-vts:src/ngx_http_vhost_traffic_status_display.c:45-55）
  - 判据：本指令把当前层 ngx_http_core_loc_conf 的 handler 设为 display_handler；该 handler 对 URI 以 /control 结尾的请求走控制处理，其余走默认展示，控制命令为 status/delete/reset。
- 修正：无
- 缺口：无

## nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_display_format

- 语法：verified
  - source_ids：registration（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:174-179）；configuration-definition（nginx:src/core/ngx_conf_file.c:1352-1385）；formats（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:49-55）
  - 判据：NGX_CONF_TAKE1，ngx_conf_set_enum_slot 以取值表匹配，表项为 json、html、jsonp、prometheus。
- 功能：verified
  - source_ids：formats（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:49-55）；merge-values（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:1123-1150）；format-output（nginx-module-vts:src/ngx_http_vhost_traffic_status_display.c:410-540）
  - 判据：本指令写入 loc->format，merge 默认 JSON；display_handler_default 在 URI 未指定 /format/ 时取 vtscf->format 并据此选择 Content-Type 与输出路径。
- 修正：无
- 缺口：无

## nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_display_jsonp

- 语法：verified
  - source_ids：registration（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:181-186）；configuration-definition（nginx:src/core/ngx_conf_file.c:1066-1090）
  - 判据：NGX_CONF_TAKE1，ngx_conf_set_str_slot 保存单个字符串到 jsonp。
- 功能：verified
  - source_ids：jsonp-output（nginx-module-vts:src/ngx_http_vhost_traffic_status_display.c:480-560）；merge-values（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:1123-1150）
  - 判据：本指令写入 loc->jsonp（默认回调名常量）；仅 JSONP 分支以 %V( 输出该名称并包裹数据，格式选择仍由 URI 的 /format/ 或 loc->format 决定（同一函数先赋值 format）。
- 修正：无
- 缺口：无

## nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_display_sum_key

- 语法：verified
  - source_ids：registration（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:188-193）；configuration-definition（nginx:src/core/ngx_conf_file.c:1066-1090）
  - 判据：NGX_CONF_TAKE1，ngx_conf_set_str_slot 保存单个字符串到 sum_key。
- 功能：verified
  - source_ids：sum-output（nginx-module-vts:src/ngx_http_vhost_traffic_status_display_json.c:880-934）；merge-values（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:1123-1150）；module-constants（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.h:49-56）
  - 判据：本指令写入 loc->sum_key，默认 "*"；JSON 输出以 sum_key 为名写出累计的 vtscf->stats 节点（Prometheus 同样转义后使用），各 server 节点的统计不因此改变。
- 修正：无
- 缺口：无

## nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_set_by_filter

- 语法：verified
  - source_ids：registration（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:195-201）；set-parser（nginx-module-vts:src/ngx_http_vhost_traffic_status_set.c:483-544）；set-format（nginx-module-vts:src/ngx_http_vhost_traffic_status_set.c:157-249）
  - 判据：NGX_CONF_TAKE2；解析函数要求 value[1] 以 "$" 开头，value[2] 编译为复杂值；运行时 set_by_filter_init 以 "/" 拆为 group、zone、name(member)。
- 功能：verified
  - source_ids：set-parser（nginx-module-vts:src/ngx_http_vhost_traffic_status_set.c:483-544）；set-handler（nginx-module-vts:src/ngx_http_vhost_traffic_status_set.c:30-52）；set-value（nginx-module-vts:src/ngx_http_vhost_traffic_status_set.c:392-479）；set-node（新增，nginx-module-vts:src/ngx_http_vhost_traffic_status_set.c:253-375）；set-format（nginx-module-vts:src/ngx_http_vhost_traffic_status_set.c:157-249）；phase-hook（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:850-884）
  - 判据：解析函数登记变量并保存 value[2]；phase-hook 把 set_handler 挂入 ACCESS 阶段，filter 开启时逐变量求值 group/zone/member，由 set_node 在锁内查节点并写入变量值，查不到则 not_found。
- 修正：无
- 缺口：无

## nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_average_method

- 语法：verified
  - source_ids：registration（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:203-208）；average-parser（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:752-787）；average-methods（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:57-62）；enum-slot（新增，nginx:src/core/ngx_conf_file.c:1352-1385）
  - 判据：NGX_CONF_TAKE12；解析函数以 AMM/WMA 取值表调用 ngx_conf_set_enum_slot 解析 value[1]，nelts==3 时 value[2] 经 ngx_parse_time 作为周期。
- 功能：verified
  - source_ids：average-parser（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:752-787）；average-runtime（nginx-module-vts:src/ngx_http_vhost_traffic_status_node.c:658-759）；average-consumer（新增，nginx-module-vts:src/ngx_http_vhost_traffic_status_display_json.c:513-527）；merge-values（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:1123-1150）；module-constants（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.h:49-56）
  - 判据：解析函数写入 average_method/average_period，merge 默认 AMM 与 60 秒；JSON/Prometheus 输出对请求耗时队列和上游响应耗时队列调用 time_queue_average，按方法与周期计算 AMM/WMA。
- 修正：无
- 缺口：无

## nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_histogram_buckets

- 语法：verified
  - source_ids：registration（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:210-215）；histogram-parser（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:791-837）
  - 判据：NGX_CONF_1MORE；解析函数逐个 value[i] 以 ngx_atofp(...,3) 解析（非零），写入桶数组。
- 功能：verified
  - source_ids：histogram-parser（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:791-837）；bucket-limit（nginx-module-vts:src/ngx_http_vhost_traffic_status_node.h:8-16）；bucket-consumer（nginx-module-vts:src/ngx_http_vhost_traffic_status_node.c:809-848）；merge-values（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:1123-1150）
  - 判据：解析函数写入 loc->histogram_buckets（秒按三位小数转毫秒，超过 32 个上限即停止）；bucket_init 在其为 NULL 时 len=0（无分桶），否则按配置初始化；merge 为指针继承。
- 修正：无
- 缺口：无

## nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_bypass_limit

- 语法：verified
  - source_ids：registration（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:217-222）；configuration-definition（nginx:src/core/ngx_conf_file.c:1026-1063）
  - 判据：标准 flag setter：注册标志含 NGX_CONF_FLAG（仅 on/off 一个参数），ngx_conf_set_flag_slot 解析 on/off。
- 功能：verified
  - source_ids：limit-bypass（nginx-module-vts:src/ngx_http_vhost_traffic_status_limit.c:13-54）；limit-register（新增，nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:860-866）；merge-values（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:1123-1150）
  - 判据：本指令写入 loc->bypass_limit（默认 0）；PREACCESS 的 limit_handler 首行 vtscf->bypass_limit 为真即返回 NGX_DECLINED，之后的阈值检查不执行。
- 修正：无
- 缺口：无

## nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_bypass_stats

- 语法：verified
  - source_ids：registration（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:224-229）；configuration-definition（nginx:src/core/ngx_conf_file.c:1026-1063）
  - 判据：标准 flag setter：注册标志含 NGX_CONF_FLAG（仅 on/off 一个参数），ngx_conf_set_flag_slot 解析 on/off。
- 功能：verified
  - source_ids：stats-bypass（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:281-329）；log-register（新增，nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:876-884）；merge-values（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:1123-1150）
  - 判据：本指令写入 loc->bypass_stats（默认 0）；LOG 阶段 stats-handler 首行 vtscf->bypass_stats 为真即返回，server、upstream、filter 及 NGX_HTTP_CACHE 下的 cache 统计都在其后。
- 修正：无
- 缺口：无

## nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_stats_by_upstream

- 语法：verified
  - source_ids：registration（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:231-236）；configuration-definition（nginx:src/core/ngx_conf_file.c:1026-1063）
  - 判据：标准 flag setter：注册标志含 NGX_CONF_FLAG（仅 on/off 一个参数），ngx_conf_set_flag_slot 解析 on/off。且注册上下文仅 NGX_HTTP_MAIN_CONF。
- 功能：verified
  - source_ids：upstream-switch（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:281-329）；log-register（新增，nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:876-884）；merge-values（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:1123-1150）
  - 判据：本指令写入 loc->stats_by_upstream，merge 默认 1；LOG 阶段 stats-handler 仅在其为真时调用 shm_add_upstream；MAIN_CONF 限定只在 http 层配置。
- 修正：无
- 缺口：无

## nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_ignore_status

- 语法：verified
  - source_ids：registration（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:238-243）；configuration-definition（nginx:src/core/ngx_conf_file.c:1389-1433）；status-masks（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:64-72）
  - 判据：NGX_CONF_1MORE；ngx_conf_set_bitmask_slot 按取值表逐个参数累加位，表项 1xx–5xx 与 off。
- 功能：verified
  - source_ids：mask-check（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.h:64-78）；node-update（nginx-module-vts:src/ngx_http_vhost_traffic_status_node.c:507-586）；node-callers（nginx-module-vts:src/ngx_http_vhost_traffic_status_shm.c:249-317）；node-set（新增，nginx-module-vts:src/ngx_http_vhost_traffic_status_node.c:479-503）；merge-values（nginx-module-vts:src/ngx_http_vhost_traffic_status_module.c:1123-1150）
  - 判据：本指令写入 loc->ignore_status，新建节点（shm_add_node）与已有节点（node_set）都把它复制到 vtsn->ignore_status；node_update 先取 state->status（重试尝试）或响应状态，更新 last_seen 后用 ignore_status 宏按类别判断并提前返回。
- 修正：无
- 缺口：无
