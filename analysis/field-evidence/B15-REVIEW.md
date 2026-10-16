# B15 审核记录

批次：OpenResty 第三方模块（xss/memc/redis/redis2/drizzle/postgres/rds-json/rds-csv），74 条 × syntax/summary。
审核方式：按各组件锁定 revision（xss v0.06=6c41076a、memc v0.20=b889a6fc、rds-json 2d7e07f7、rds-csv b4095fcb、drizzle fb6cf255、redis 411fef36、ngx_postgres 68198059、redis2 c989c829；nginx 取 release-1.27.1=e06bdbd4，补丁取 openresty 8c37412c）逐条读取 `source_ids` 对应片段（已有来源取发布 JSON 的 code，新增 evidence 用 `git show <revision>:<file>` 按行号核对）；已核对每个组件的片段 revision 与配置一致，新增 evidence 无与已有来源 ID 重复，无缺失 ID。

## 总表

| ID | syntax | summary | 说明 |
| --- | --- | --- | --- |
| `xss-nginx-module--ngx_http_xss_filter_module--xss_get` | 通过 | 通过 |  |
| `xss-nginx-module--ngx_http_xss_filter_module--xss_callback_arg` | 通过 | 通过 |  |
| `xss-nginx-module--ngx_http_xss_filter_module--xss_input_types` | 通过 | 通过 | 修正 `| *` 有 types-slot 第 2070-2073 行依据，通过 |
| `xss-nginx-module--ngx_http_xss_filter_module--xss_check_status` | 通过 | 通过 |  |
| `xss-nginx-module--ngx_http_xss_filter_module--xss_override_status` | 通过 | 通过 |  |
| `xss-nginx-module--ngx_http_xss_filter_module--xss_output_type` | 通过 | 通过 |  |
| `memc-nginx-module--ngx_http_memc_module--memc_cmds_allowed` | 通过 | 通过 | 语法 `command ...` 为占位，取值表（12 个命令名）已在判据列出，不矛盾，通过 |
| `memc-nginx-module--ngx_http_memc_module--memc_pass` | 通过 | 通过 |  |
| `memc-nginx-module--ngx_http_memc_module--memc_connect_timeout` | 通过 | 通过 |  |
| `memc-nginx-module--ngx_http_memc_module--memc_send_timeout` | 通过 | 通过 |  |
| `memc-nginx-module--ngx_http_memc_module--memc_read_timeout` | 通过 | 通过 |  |
| `memc-nginx-module--ngx_http_memc_module--memc_buffer_size` | 通过 | 通过 |  |
| `memc-nginx-module--ngx_http_memc_module--memc_next_upstream` | 通过 | 通过 |  |
| `memc-nginx-module--ngx_http_memc_module--memc_upstream_max_fails` | 通过 | 通过 | 改 value 符合裁定 4（处理函数不读 cf->args），通过 |
| `memc-nginx-module--ngx_http_memc_module--memc_upstream_fail_timeout` | 通过 | 通过 | 改 value 符合裁定 4，通过 |
| `memc-nginx-module--ngx_http_memc_module--memc_flags_to_last_modified` | 通过 | 通过 |  |
| `memc-nginx-module--ngx_http_memc_module--memc_ignore_client_abort` | 通过 | 通过 |  |
| `rds-json-nginx-module--ngx_http_rds_json_filter_module--rds_json` | 通过 | 通过 |  |
| `rds-json-nginx-module--ngx_http_rds_json_filter_module--rds_json_root` | 通过 | 通过 |  |
| `rds-json-nginx-module--ngx_http_rds_json_filter_module--rds_json_success_property` | 通过 | 通过 |  |
| `rds-json-nginx-module--ngx_http_rds_json_filter_module--rds_json_user_property` | 通过 | 通过 |  |
| `rds-json-nginx-module--ngx_http_rds_json_filter_module--rds_json_errcode_key` | 通过 | 通过 |  |
| `rds-json-nginx-module--ngx_http_rds_json_filter_module--rds_json_errstr_key` | 通过 | 通过 |  |
| `rds-json-nginx-module--ngx_http_rds_json_filter_module--rds_json_format` | 通过 | 通过 |  |
| `rds-json-nginx-module--ngx_http_rds_json_filter_module--rds_json_content_type` | 通过 | 通过 |  |
| `rds-json-nginx-module--ngx_http_rds_json_filter_module--rds_json_ret` | 通过 | 通过 |  |
| `rds-json-nginx-module--ngx_http_rds_json_filter_module--rds_json_buffer_size` | 通过 | 通过 |  |
| `rds-csv-nginx-module--ngx_http_rds_csv_filter_module--rds_csv` | 通过 | 通过 |  |
| `rds-csv-nginx-module--ngx_http_rds_csv_filter_module--rds_csv_row_terminator` | 通过 | 通过 |  |
| `rds-csv-nginx-module--ngx_http_rds_csv_filter_module--rds_csv_field_separator` | 通过 | 通过 |  |
| `rds-csv-nginx-module--ngx_http_rds_csv_filter_module--rds_csv_field_name_header` | 通过 | 通过 |  |
| `rds-csv-nginx-module--ngx_http_rds_csv_filter_module--rds_csv_content_type` | 通过 | 通过 |  |
| `rds-csv-nginx-module--ngx_http_rds_csv_filter_module--rds_csv_buffer_size` | 通过 | 通过 |  |
| `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_server` | 通过 | 通过（复审1） | “新连接字符集”缺 dp->set_names_query 取自 peer->set_names_query 的赋值行（upstream.c:602-603），调用链缺环 |
| `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_keepalive` | 通过 | 通过 | 删“每worker”修正正确；max= 非强制，语法写法不矛盾，通过 |
| `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_query` | 通过 | 通过 | `method` 占位，方法名表在判据列出，通过 |
| `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_dbname` | 通过 | 通过（复审1） | “覆盖服务器级 dbname”缺 drizzle_server 解析与复制到 peer 的片段，peer->dbname 来源属推断 |
| `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_pass` | 通过 | 通过 |  |
| `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_connect_timeout` | 通过 | 通过 |  |
| `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_send_query_timeout` | 通过 | 通过 |  |
| `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_recv_cols_timeout` | 通过 | 通过 |  |
| `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_recv_rows_timeout` | 通过 | 通过 |  |
| `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_module_header` | 通过 | 通过 |  |
| `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_buffer_size` | 通过 | 通过 |  |
| `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_status` | 通过 | 通过 |  |
| `redis-nginx-module--ngx_http_redis_module--redis_pass` | 通过 | 通过 |  |
| `redis-nginx-module--ngx_http_redis_module--redis_bind` | 通过 | 通过（复审1） | “从未置 UNSET_PTR / 一经配置即拒绝”是整模块缺失性陈述，note 未写检索命令、范围与命中（裁定 7） |
| `redis-nginx-module--ngx_http_redis_module--redis_connect_timeout` | 通过 | 通过 |  |
| `redis-nginx-module--ngx_http_redis_module--redis_send_timeout` | 通过 | 通过 |  |
| `redis-nginx-module--ngx_http_redis_module--redis_buffer_size` | 通过 | 通过 |  |
| `redis-nginx-module--ngx_http_redis_module--redis_read_timeout` | 通过 | 通过 |  |
| `redis-nginx-module--ngx_http_redis_module--redis_next_upstream` | 通过 | 通过 |  |
| `redis-nginx-module--ngx_http_redis_module--redis_gzip_flag` | 通过 | 通过 |  |
| `ngx_postgres--ngx_postgres_module--postgres_server` | 通过 | 通过 |  |
| `ngx_postgres--ngx_postgres_module--postgres_keepalive` | 通过 | 通过 | 删“每worker”修正正确，通过 |
| `ngx_postgres--ngx_postgres_module--postgres_pass` | 通过 | 通过 |  |
| `ngx_postgres--ngx_postgres_module--postgres_query` | 通过 | 通过 | `method` 占位，通过 |
| `ngx_postgres--ngx_postgres_module--postgres_rewrite` | 通过（复审1） | 通过 | note 写“状态须为 200–599”，源码上限是 NGX_HTTP_INSUFFICIENT_STORAGE(507)且排除 300–399；语法文字无误，仅 note 不实 |
| `ngx_postgres--ngx_postgres_module--postgres_output` | 通过 | 通过 |  |
| `ngx_postgres--ngx_postgres_module--postgres_set` | 通过 | 通过 |  |
| `ngx_postgres--ngx_postgres_module--postgres_escape` | 通过 | 通过 |  |
| `ngx_postgres--ngx_postgres_module--postgres_connect_timeout` | 通过 | 通过 |  |
| `ngx_postgres--ngx_postgres_module--postgres_result_timeout` | 通过 | 通过 |  |
| `redis2-nginx-module--ngx_http_redis2_module--redis2_query` | 通过 | 通过 |  |
| `redis2-nginx-module--ngx_http_redis2_module--redis2_raw_query` | 通过 | 通过 |  |
| `redis2-nginx-module--ngx_http_redis2_module--redis2_raw_queries` | 通过 | 通过 |  |
| `redis2-nginx-module--ngx_http_redis2_module--redis2_literal_raw_query` | 通过 | 通过 |  |
| `redis2-nginx-module--ngx_http_redis2_module--redis2_pass` | 通过 | 通过 |  |
| `redis2-nginx-module--ngx_http_redis2_module--redis2_bind` | 通过 | 通过（复审2） | 同上（裁定 7） |
| `redis2-nginx-module--ngx_http_redis2_module--redis2_connect_timeout` | 通过 | 通过 |  |
| `redis2-nginx-module--ngx_http_redis2_module--redis2_send_timeout` | 通过 | 通过 |  |
| `redis2-nginx-module--ngx_http_redis2_module--redis2_buffer_size` | 通过 | 通过 |  |
| `redis2-nginx-module--ngx_http_redis2_module--redis2_read_timeout` | 通过 | 通过 |  |
| `redis2-nginx-module--ngx_http_redis2_module--redis2_next_upstream` | 通过 | 通过 |  |

## 退回清单

1. `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_dbname`（summary）：功能写“供新数据库连接覆盖服务器级dbname”。现有片段只证明连接时 `dp->dbname.len` 为 0 则用 `peer->dbname`，peer->dbname 来自 `drizzle_server dbname=` 属推断。修正：把 `src/ngx_http_drizzle_upstream.c` 148-165（drizzle_server 解析 dbname=）与 362（peers->peer[n].dbname = server[i].dbname）作为新增 evidence 并入 `source_ids`；或将文字收窄为“否则使用 upstream peer 自带的 dbname”。
2. `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_server`（summary）：功能含“新连接字符集”。processor 片段使用的是 `dp->set_names_query`，而 `dp->set_names_query = peer->set_names_query`（并 `dp->enable_charset = (peer->set_names_query->len > 0)`）在 `src/ngx_http_drizzle_upstream.c` 602-603，不在 `source_ids`，peer→dp 缺环（裁定 1）。修正：新增该处短片段并入 `source_ids`，note 写明这条赋值。
3. `ngx_postgres--ngx_postgres_module--postgres_rewrite`（syntax，note 不实）：note 写“状态须为 200–599 且排除 3xx”，而 setter 实际拒绝 `status < 200`、`> NGX_HTTP_INSUFFICIENT_STORAGE`（nginx 中为 507）以及 300–399。语法文字 `[=]status_code` 不变；仅需把 note（含 B15-EVIDENCE.md 对应行）改为“200–507 且排除 300–399”。
4. `redis-nginx-module--ngx_http_redis_module--redis_bind` 与 `redis2-nginx-module--ngx_http_redis2_module--redis2_bind`（summary）：“create_loc_conf 从未把 upstream.local 置为 NGX_CONF_UNSET_PTR，故一经配置即被拒绝”属缺失性陈述，按裁定 7 须在 note 写检索命令、范围与全部命中。审核者已复跑：`git -C repos/redis-nginx-module grep -n -E "upstream\.local|\blocal\b|UNSET_PTR" 411fef36…` 仅命中 registration 的 offsetof（78 行）与 824/825 行 hide_headers/pass_headers 的 UNSET_PTR；redis2 同命令（revision c989c829…）仅命中 registration 的 offsetof（74 行）。结论属实，只需把命令、范围、命中补入 note。

## 其余重点结论（均通过）

- redis variable-pass 补丁：补丁把 `rlcf = ngx_http_get_module_loc_conf` 移到 `ngx_http_upstream_create` 之后并删除后面的重复赋值，`conf-assign`（231 行 `u->conf = &rlcf->upstream;`）与 `init-call`（261 行 `ngx_http_upstream_init(r);`）两行不在补丁改动范围，补丁片段（patch 20-79）+ conf-assign + init-call 三环齐全，redis_buffer/connect/read/send/next_upstream/pass 均按补丁应用后的实际代码闭环，符合裁定 1/5。
- memc、redis2：`mlcf/rlcf` 取配置（137 / 41 行）、`u->conf = &…->upstream`（213 / 75 行）、`ngx_http_read_client_request_body(r, ngx_http_upstream_init)`（379 / 97 行）均在 `source_ids` 内，再接 upstream_timeout_fields 补丁（u->connect/send/read_timeout 由 u->conf 取值并在补丁后的 upstream.c 中使用），符合裁定 1/3/5。
- drizzle/postgres 的超时与缓冲类条目：drizzle 经 `drz-handler`（u->conf）与 init_peer（dp->loc_conf）取值，ngx_postgres 经 handler 的 pglcf（67 行）+ u->conf（193 行）+ send_query 内读取 `r->upstream->conf->read_timeout`（273 行），值流闭环；仅 drizzle_connect_timeout 的 handler→dbd_init→dbd_connect 为模块内多跳调用，但值流（u->conf→use site）完整，未要求补跳。
- 裁定 4：memc_upstream_max_fails / memc_upstream_fail_timeout 的处理函数只记日志并返回 NGX_CONF_ERROR，不读 `cf->args`，改 `value` 正确。
- 裁定 6：xss_input_types 补 `| *` 有 ngx_http_types_slot 2070-2073 行依据；`drizzle_pass`/`postgres_pass`/`memc_pass` 的 upstream 变量形式属单参数内部变体，不强制展开。

## 计数

- syntax：通过 73，退回 1
- summary：通过 70，退回 4

## --check

`node scripts/build.mjs --config project.config.json --check` 退出码 0；B15 计数 syntax_verified 74 / syntax_unverified 0 / summary_verified 74 / summary_unverified 0 / entries 74；总计 1041/0/1041/0。（该检查不判断证据是否足以支撑文字，上述退回项是人工核对结果。）

## 复审 1

按各组件锁定 revision 逐行核对新片段与 note，并复跑检索命令。

| ID | 字段 | 结果 | 说明 |
| --- | --- | --- | --- |
| `drizzle_dbname` | summary | ADDRESSED | `server-dbname-parse`（drizzle fb6cf255，`ngx_http_drizzle_upstream.c` 148-166）确为 `dbname=` 解析并写入 `ds->dbname`；`peer-copy`（354-364）含 `peers->peer[n].dbname = server[i].dbname`；行号无偏移，source_ids 已并入。 |
| `drizzle_server` | summary | ADDRESSED | `set-names-assign`（602-603）为 `dp->enable_charset = (peer->set_names_query->len > 0)` 与 `dp->set_names_query = peer->set_names_query`，属实；与 implementation-1 的 peer 复制、implementation-3 的发送构成闭环。 |
| `postgres_rewrite` | syntax | ADDRESSED | note 改为 200–507 且排除 300–399，与 setter 及 `NGX_HTTP_INSUFFICIENT_STORAGE`=507 一致（B15-EVIDENCE.md 中已无“200–599”）。 |
| `redis_bind` | summary | ADDRESSED | 复跑 `git -C repos/redis-nginx-module grep -n ".local\|NGX_CONF_UNSET_PTR" 411fef36…`：除 t/ 外命中仅 module.c:78、:824、:825，与 note 一致。 |
| `redis2_bind` | summary | NOT ADDRESSED | 复跑 `git -C repos/redis2-nginx-module grep -n ".local\|NGX_CONF_UNSET_PTR" c989c829…`：除 t/、README 外还命中 `util/build.sh:18`（`-L… /usr/local/lib` 里的 “/local”，与 upstream.local 无关）。note 称“全部命中…仅此一处”，与自己写明的命令及排除范围不一致（裁定 7：结果不一致即退回）。修正：在命中列表补 `util/build.sh:18（路径 /usr/local/lib，无关）`，或在排除范围里写明 util/，并把检索模式收紧为 `upstream\.local` 后重列命中。 |

复审 1 结论：5 条中 4 条 ADDRESSED，1 条（`redis2_bind` summary）NOT ADDRESSED。`--check` 退出码 0，B15 计数 74/0/74/0。

更新后计数：syntax 通过 74、退回 0；summary 通过 73、退回 1。

## 复审 2

在锁定 revision 全目录复跑 note 中的两条命令：

| ID | 字段 | 结果 | 说明 |
| --- | --- | --- | --- |
| `redis_bind` | summary | ADDRESSED | `grep -n "upstream\.local"` 仅命中 module.c:78；`grep -n "NGX_CONF_UNSET_PTR"` 仅命中 :824、:825，与 note 一致。 |
| `redis2_bind` | summary | ADDRESSED | `grep -n "upstream\.local"` 仅命中 src/ngx_http_redis2_module.c:74；`grep -n "NGX_CONF_UNSET_PTR"` 无命中，与 note 一致。 |

复审 2 结论：全部 ADDRESSED。`--check` 退出码 0，B15 计数 74/0/74/0。最终计数：syntax 通过 74、退回 0；summary 通过 74、退回 0。
