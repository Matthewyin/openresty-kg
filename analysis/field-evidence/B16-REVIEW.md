# B16 审核（nginx-module-vts 部门扩展，24 条）

审核方式：VTS 取 `project.config.json` 固定 commit `52fe11e44c47a49b052be89e36dfa17d81bf52a5` 经 `git show` 读取，nginx 核心取 `release-1.27.1`；新增 evidence 的 14 处行号逐一核对无偏移；已有来源按 EVIDENCE.md 所引行号复核。未使用工作树文件，README 仅作印证、未作唯一依据。

## 总表

| # | 指令 | syntax | summary | 退回原因 |
| --- | --- | --- | --- | --- |
| 1 | `vhost_traffic_status` | 通过 | 通过 | — |
| 2 | `vhost_traffic_status_filter` | 通过 | 通过 | — |
| 3 | `vhost_traffic_status_filter_by_host` | 通过 | 通过 | — |
| 4 | `vhost_traffic_status_filter_check_duplicate` | 通过 | 通过 | — |
| 5 | `vhost_traffic_status_filter_by_set_key` | 通过 | 通过 | — |
| 6 | `vhost_traffic_status_filter_max_node` | 通过 | 通过 | — |
| 7 | `vhost_traffic_status_limit` | 通过 | 通过 | — |
| 8 | `vhost_traffic_status_limit_check_duplicate` | 通过 | 通过 | — |
| 9 | `vhost_traffic_status_limit_traffic` | 通过 | 通过 | — |
| 10 | `vhost_traffic_status_limit_traffic_by_set_key` | 通过 | 通过 | — |
| 11 | `vhost_traffic_status_zone` | 通过 | 通过 | — |
| 12 | `vhost_traffic_status_measure_status_codes` | 通过 | 通过 | — |
| 13 | `vhost_traffic_status_dump` | 通过 | 通过 | — |
| 14 | `vhost_traffic_status_display` | 通过 | 通过 | — |
| 15 | `vhost_traffic_status_display_format` | 通过 | 通过 | — |
| 16 | `vhost_traffic_status_display_jsonp` | 通过 | 通过 | — |
| 17 | `vhost_traffic_status_display_sum_key` | 通过 | 通过 | — |
| 18 | `vhost_traffic_status_set_by_filter` | 通过 | 通过 | — |
| 19 | `vhost_traffic_status_average_method` | 通过 | 通过 | — |
| 20 | `vhost_traffic_status_histogram_buckets` | 通过 | 通过 | — |
| 21 | `vhost_traffic_status_bypass_limit` | 通过 | 通过 | — |
| 22 | `vhost_traffic_status_bypass_stats` | 通过 | 通过 | — |
| 23 | `vhost_traffic_status_stats_by_upstream` | 通过 | 通过 | — |
| 24 | `vhost_traffic_status_ignore_status` | 通过 | 通过 | — |

## 退回清单

无。

## 计数

| 字段 | 通过 | 退回 | 证据不足属实 | 可晋级 |
| --- | --- | --- | --- | --- |
| syntax | 24 | 0 | 0 | 0 |
| summary | 24 | 0 | 0 | 0 |

## 关键核对点

- 参数个数：flag 类 7 条（含 `stats_by_upstream` 仅 MAIN_CONF）为 `NGX_CONF_FLAG`，`ngx_conf_set_flag_slot` 解析 on/off；`TAKE12`（filter_by_set_key、limit_traffic、dump、average_method）、`TAKE23`（limit_traffic_by_set_key）、`TAKE2`（set_by_filter）、`1MORE`（filter_max_node、histogram_buckets、ignore_status）与解析函数中的 `nelts` 分支一致。
- `NOARGS|TAKE1`（zone、display）与 `NOARGS|1MORE`（measure_status_codes）：`ngx_conf_handler` 中 1MORE 要求 `nelts>=2`，`argument_number[]` 表放行 0/1 个参数，`arg-count`、`argument-table` 两个新增片段支撑成立；display 函数不读 `cf->args`，“忽略参数”属实。
- 枚举/位掩码：display_format 取值表 json/html/jsonp/prometheus，average_method 取值表 AMM/WMA，ignore_status 为 1xx–5xx 与 off（off=0x2 不触发宏判断）。
- 功能：各指令值均能追踪到使用点——`enable`→LOG handler 首行；`limit`/`bypass_limit`→PREACCESS limit handler 首行；`bypass_stats`、`stats_by_upstream`→LOG handler（含 `#if NGX_HTTP_CACHE`）；`filter`/`filter_host`→`shm_add_server`、`shm_add_filter`、`set_handler`；`filter_max_node`→`find_lru`（FG 组、前缀匹配、`stat_last_seen` 最小者）→`shm_add_node` 删除；`measure_status_codes`→槽位与计数器分配、JSON/Prometheus 输出；`ignore_status`→`node_update`（先写 last_seen 再返回）；`average_method`→`time_queue_average` 的 JSON/Prometheus 消费；`histogram_buckets`→`bucket_init`；`display*`→内容 handler 与格式选择。
- corrections：本批无，无需签署。

## 非阻断的备注（不影响结论，建议实施者顺手修 EVIDENCE.md 的 note）

1. `display` 功能 note 写“控制命令为 status/delete/reset”，但已有来源 `control-commands`（display.c:45-55）实际只截到 `status` 一行（delete/reset 在 56-57 行）；且“URI 以 /control 结尾”不严谨，源码还要求 URI 含至少两个 `/`（display.c:135-148，如 `/control` 单段不会进入控制分支）。summary 本身只说“提供展示及 URI 对应的控制处理”，由 `display-handler` 支撑，故不退回。
2. `display_sum_key` 功能 note 括号内“Prometheus 同样转义后使用”所对应的 prometheus.c:566 未在 `source_ids` 中；summary 未涉及，不影响。
3. `vhost_traffic_status` 功能 note 称 limit-handler“不读 enable”，实际它读 `ctx->enable`（limit.c:26），只是不读局部 `vtscf->enable`；结论“不是统一总开关”成立，措辞建议改为“不读局部 enable”。
4. `filter_by_host` 功能 note 提到的 `find_name`（node.c:82）未被引用，但 summary 的 server 键选择逻辑已由 `host-key`（shm.c:521-554）完整支撑。

## `--check`

`node scripts/build.mjs --config project.config.json --check` 成功：B16 syntax_verified 24 / unverified 0，summary_verified 24 / unverified 0，entries 24；全库 entries 1041（syntax_verified 67、summary_verified 67）。
