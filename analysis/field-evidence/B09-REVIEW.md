# B09 审核结论

结论：**有退回**（1 条，summary 字段）。已逐条读取 75 条的 source_ids 对应片段（已有来源取自发布 JSON，新增 evidence 用 `git show release-1.27.1:<file>` 按行号核对，行号无偏移，无缺失 source_id）。

## 总表

| ID（省略 nginx--） | syntax | summary | 退回原因 |
| --- | --- | --- | --- |
| `ngx_http_log_module--log_format` | 通过 | 通过 |  |
| `ngx_http_log_module--access_log` | 通过 | 通过 |  |
| `ngx_http_log_module--open_log_file_cache` | 通过 | 通过 |  |
| `ngx_http_map_module--map` | 通过 | 通过 |  |
| `ngx_http_map_module--map_hash_max_size` | 通过 | 通过 |  |
| `ngx_http_map_module--map_hash_bucket_size` | 通过 | 通过 |  |
| `ngx_http_mirror_module--mirror` | 通过 | 通过 |  |
| `ngx_http_mirror_module--mirror_request_body` | 通过 | 通过 |  |
| `ngx_http_mp4_module--mp4` | 通过 | 通过 |  |
| `ngx_http_mp4_module--mp4_buffer_size` | 通过 | 通过 |  |
| `ngx_http_mp4_module--mp4_max_buffer_size` | 通过 | 通过 |  |
| `ngx_http_mp4_module--mp4_start_key_frame` | 通过 | 通过 |  |
| `ngx_http_random_index_module--random_index` | 通过 | 通过 |  |
| `ngx_http_realip_module--set_real_ip_from` | 通过 | 通过 |  |
| `ngx_http_realip_module--real_ip_header` | 通过 | 通过 |  |
| `ngx_http_realip_module--real_ip_recursive` | 通过 | 通过 |  |
| `ngx_http_referer_module--valid_referers` | 通过 | 通过 |  |
| `ngx_http_referer_module--referer_hash_max_size` | 通过 | 通过 |  |
| `ngx_http_referer_module--referer_hash_bucket_size` | 通过 | 通过 |  |
| `ngx_http_rewrite_module--rewrite` | 通过 | 通过 |  |
| `ngx_http_rewrite_module--return` | 通过 | 通过 |  |
| `ngx_http_rewrite_module--break` | 通过 | 通过（含修正，已核） |  |
| `ngx_http_rewrite_module--if` | 通过 | 通过 |  |
| `ngx_http_rewrite_module--set` | 通过 | 通过 |  |
| `ngx_http_rewrite_module--rewrite_log` | 通过 | 通过 |  |
| `ngx_http_rewrite_module--uninitialized_variable_warn` | 通过 | 通过 |  |
| `ngx_http_secure_link_module--secure_link` | 通过 | 通过 |  |
| `ngx_http_secure_link_module--secure_link_md5` | 通过 | 通过 |  |
| `ngx_http_secure_link_module--secure_link_secret` | 通过 | 通过 |  |
| `ngx_http_slice_filter_module--slice` | 通过 | 通过 |  |
| `ngx_http_split_clients_module--split_clients` | 通过 | 通过 |  |
| `ngx_http_ssi_filter_module--ssi` | 通过 | 通过 |  |
| `ngx_http_ssi_filter_module--ssi_silent_errors` | 通过 | 通过 |  |
| `ngx_http_ssi_filter_module--ssi_ignore_recycled_buffers` | 通过 | 通过（含修正，已核） |  |
| `ngx_http_ssi_filter_module--ssi_min_file_chunk` | 通过 | 通过（含修正，已核） |  |
| `ngx_http_ssi_filter_module--ssi_value_length` | 通过 | 通过 |  |
| `ngx_http_ssi_filter_module--ssi_types` | 通过（含修正，已核） | 通过 |  |
| `ngx_http_ssi_filter_module--ssi_last_modified` | 通过 | 通过 |  |
| `ngx_http_stub_status_module--stub_status` | 通过（含修正，已核） | 通过 |  |
| `ngx_http_sub_filter_module--sub_filter` | 通过 | 通过 |  |
| `ngx_http_sub_filter_module--sub_filter_types` | 通过（含修正，已核） | 通过 |  |
| `ngx_http_sub_filter_module--sub_filter_once` | 通过 | 通过 |  |
| `ngx_http_sub_filter_module--sub_filter_last_modified` | 通过 | 通过 |  |
| `ngx_http_try_files_module--try_files` | 通过 | 通过 |  |
| `ngx_http_upstream_hash_module--hash` | 通过 | 通过（含修正，已核） |  |
| `ngx_http_upstream_ip_hash_module--ip_hash` | 通过 | 通过 |  |
| `ngx_http_upstream_keepalive_module--keepalive` | 通过 | 通过（含修正，已核） |  |
| `ngx_http_upstream_keepalive_module--keepalive_time` | 通过 | 通过 |  |
| `ngx_http_upstream_keepalive_module--keepalive_timeout` | 通过 | 通过 |  |
| `ngx_http_upstream_keepalive_module--keepalive_requests` | 通过 | 通过 |  |
| `ngx_http_upstream_least_conn_module--least_conn` | 通过 | 通过 |  |
| `ngx_http_upstream_random_module--random` | 通过 | 通过 |  |
| `ngx_http_upstream_zone_module--zone` | 通过 | 通过（复审 1 ADDRESSED，含修正） | summary 的“peer 运行状态放入共享内存”缺 ngx_http_upstream_zone_copy_peer 函数体（ngx_memcpy 整个 peer 结构）；“fork 出的 worker 共享”缺 fork 环节 |
| `ngx_http_userid_filter_module--userid` | 通过 | 通过 |  |
| `ngx_http_userid_filter_module--userid_service` | 通过 | 通过 |  |
| `ngx_http_userid_filter_module--userid_name` | 通过 | 通过 |  |
| `ngx_http_userid_filter_module--userid_domain` | 通过 | 通过 |  |
| `ngx_http_userid_filter_module--userid_path` | 通过 | 通过 |  |
| `ngx_http_userid_filter_module--userid_expires` | 通过 | 通过 |  |
| `ngx_http_userid_filter_module--userid_flags` | 通过 | 通过 |  |
| `ngx_http_userid_filter_module--userid_p3p` | 通过 | 通过 |  |
| `ngx_http_userid_filter_module--userid_mark` | 通过 | 通过 |  |
| `ngx_http_xslt_filter_module--xml_entities` | 通过 | 通过（含修正，已核） |  |
| `ngx_http_xslt_filter_module--xslt_stylesheet` | 通过 | 通过 |  |
| `ngx_http_xslt_filter_module--xslt_param` | 通过 | 通过（含修正，已核） |  |
| `ngx_http_xslt_filter_module--xslt_string_param` | 通过 | 通过（含修正，已核） |  |
| `ngx_http_xslt_filter_module--xslt_types` | 通过（含修正，已核） | 通过 |  |
| `ngx_http_xslt_filter_module--xslt_last_modified` | 通过 | 通过 |  |
| `ngx_http_perl_module--perl_modules` | 通过 | 通过（含修正，已核） |  |
| `ngx_http_perl_module--perl_require` | 通过 | 通过 |  |
| `ngx_http_perl_module--perl` | 通过 | 通过 |  |
| `ngx_http_perl_module--perl_set` | 通过 | 通过 |  |
| `ngx_http_upstream_module--upstream` | 通过 | 通过 |  |
| `ngx_http_upstream_module--server` | 通过 | 通过 |  |
| `ngx_http_log_module--log_escape_non_ascii` | 通过 | 通过 |  |

## 退回清单

### nginx--ngx_http_upstream_zone_module--zone（summary）
- 问题：summary 称“peer 配置及连接数、失败、权重等运行状态放入共享内存”，note 称 init 把 peer 结构“复制进 shpool”。`implementation-1`（187-260）只含 `ngx_http_upstream_zone_copy_peers`，对每个 peer 仅调用 `ngx_http_upstream_zone_copy_peer(...)`，复制整个 peer 结构的函数体（该文件 262 行起，`ngx_memcpy(dst, src, sizeof(ngx_http_upstream_rr_peer_t))`）不在任何片段内，属调用链缺环（裁定 1）。另外“因而 fork 出的各 worker 访问同一块共享内存”中的 fork 环节无片段，仅由 `MAP_ANON|MAP_SHARED` 推断。
- 修正：新增 evidence `summary-copy-peer`（nginx `src/http/modules/ngx_http_upstream_zone_module.c` 约 262-300，含 `ngx_slab_calloc_locked` 与 `ngx_memcpy(dst, src, ...)`）并加入 summary 的 source_ids；对 worker 共享一句，二选一：补 `ngx_spawn_process` 的 fork 片段（`src/os/unix/ngx_process.c`），或把 summary 中“使多个 worker 共享这些状态”收窄为“放入 MAP_ANON|MAP_SHARED 映射的命名共享内存”。

## 重点抽查结果
- upstream 负载均衡（hash / ip_hash / least_conn / random / keepalive）：`init_upstream→us->peer.init=…` 与 `peer.init→r->upstream->peer.get=…` 两环的赋值行均在各自片段内（hash 的 chash 路径含 `init_chash` 的 `us->peer.init`、`init_chash_peer` 的 `peer.get`；keepalive 含新增 `summary-kp-conf` 的 `kp->conf = kcf` 及 get/free 包装与 `original_get_peer`）。`us->peer.init(r, us)` 的调用点在 upstream 框架中，按裁定 3 不要求。hash 修正后文字（crc32 加权取模 / 带权重点环）与片段一致；`random two [least_conn]` 中 least_conn 被接受但源码未使用，语法与 summary 均不与源码矛盾。
- rewrite / map / realip：summary 均能在片段中找到对应行为，未发现把推断当事实；`break` 的收窄文字与 `ngx_http_script_break_code` 一致；`real_ip_recursive` 与 `ngx_http_get_forwarded_addr_internal` 的循环/停止条件一致；`map` 的“读取时求值”与 get_handler 一致。
- `userid_flags`“一种 SameSite”：`samesite=*` 共用 SAMESITE 位，`ngx_conf_set_bitmask_slot` 对重复位报 duplicate value，成立。
- `*_types` 补 `| *`：`ngx_http_types_slot` 对 `*` 单独处理，修正有据；ssi/sub_filter/xslt 一致。注意跨批：B08 的 addition_types/charset_types/gzip_types 未补 `*`，与本批尺度不一致，需主线程统一。
- `stub_status value;`：符合裁定 4。

## 计数
| 字段 | 通过 | 退回 |
| --- | --- | --- |
| syntax | 75 | 0 |
| summary | 74（初审）→ 75（复审 1 后） | 1 → 0 |

## 构建检查
`node scripts/build.mjs --config project.config.json --check` 退出码 0；B09 输出 syntax_verified 75 / syntax_unverified 0 / summary_verified 75 / summary_unverified 0 / entries 75（与实施者报告一致，退回项修正前的状态）。

## 复审 1（zone summary）
结论：**ADDRESSED**，B09 全部通过。
- 新增片段 `summary-copy-peer`：按 release-1.27.1 读取 `ngx_http_upstream_zone_module.c` 264-325，起于函数名行 `ngx_http_upstream_zone_copy_peer(`，止于函数结尾 `}`，行号无偏移；内含 `ngx_slab_calloc_locked` 分配与 `ngx_memcpy(dst, src, sizeof(ngx_http_upstream_rr_peer_t))`，补齐 peer 结构（weight/conns/fails 等）复制环节，且已在 summary 的 source_ids 中。
- fork 环节：corrections 将“使多个 worker 共享”收窄为“放入 MAP_ANON|MAP_SHARED 映射的命名共享内存”，与 `summary-shm-alloc`/`summary-shm-map` 片段一致，不再依赖 fork 推断。
- B08 `| *` 口径已统一，按说明接受。
- `--check` 退出码 0，B09 为 75/0/75/0。
