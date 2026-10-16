# B04 独立审核（ngx_http_fastcgi_module 49 条 + ngx_http_memcached_module 11 条，共 60 条）

审核依据：review-brief.md（含统一尺度裁定 1、2）、FIELD_EVIDENCE_PLAN 判据。已有来源取自 dist 基线发布各条目 sources[].code，并对 nginx 来源逐段与 `git show e06bdbd4…:<file>`（release-1.27.1）比对，无行号偏移、无内容不符；5 个新增片段已按 revision 与行号实读。

## 结论：复审 1 后全部通过（初审：有退回 syntax 3、summary 45，见下方原退回清单）

## 总表

| ID（省略前缀） | syntax | summary | 退回原因 |
| --- | --- | --- | --- |
| fastcgi_pass | 通过 | 通过 |  |
| fastcgi_index | 通过 | 通过 |  |
| fastcgi_split_path_info | 通过 | 通过 |  |
| fastcgi_store | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_store_access | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_buffering | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_request_buffering | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_ignore_client_abort | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_bind | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_socket_keepalive | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_connect_timeout | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_send_timeout | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_send_lowat | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_buffer_size | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_pass_request_headers | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_pass_request_body | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_intercept_errors | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_read_timeout | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_buffers | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_busy_buffers_size | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_force_ranges | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_limit_rate | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_cache | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_cache_key | 通过 | 通过 |  |
| fastcgi_cache_path | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_cache_bypass | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_no_cache | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_cache_valid | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_cache_min_uses | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_cache_max_range_offset | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_cache_use_stale | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_cache_methods | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_cache_lock | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_cache_lock_timeout | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_cache_lock_age | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_cache_revalidate | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_cache_background_update | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_temp_path | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_max_temp_file_size | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_temp_file_write_size | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_next_upstream | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_next_upstream_tries | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_next_upstream_timeout | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_param | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_pass_header | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_hide_header | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_ignore_headers | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| fastcgi_catch_stderr | 通过 | 通过 |  |
| fastcgi_keep_conn | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |
| memcached_pass | 通过 | 通过 |  |
| memcached_bind | 通过 | 通过 |  |
| memcached_socket_keepalive | 通过 | 通过 |  |
| memcached_connect_timeout | 通过 | 通过 |  |
| memcached_send_timeout | 通过 | 通过 |  |
| memcached_buffer_size | 通过 | 通过 |  |
| memcached_read_timeout | 通过 | 通过 |  |
| memcached_next_upstream | 通过 | 通过 |  |
| memcached_next_upstream_tries | 通过 | 通过 |  |
| memcached_next_upstream_timeout | 通过 | 通过 |  |
| memcached_gzip_flag | 通过 | 通过 | （初审退回，复审 1 ADDRESSED） |

## 计数（复审 1 后；初审为 syntax 57/3、summary 15/45）

| 字段 | 通过 | 退回 |
| --- | --- | --- |
| syntax | 60 | 0 |
| summary | 60 | 0 |

## 退回清单

### 一、syntax（3 条）

1. `fastcgi_next_upstream`：`ngx_http_fastcgi_next_upstream_masks`（fastcgi.c:208-220）含 `updating`，语法缺。实施者自述“漏列仍判 verified”，按裁定 2 不接受。修正：`corrections.syntax` = `fastcgi_next_upstream error | timeout | invalid_header | http_500 | http_503 | http_403 | http_404 | http_429 | non_idempotent | updating | off ...;`，source_ids 已含 implementation-0（取值表），note 删去“不完整但不矛盾”的说法。
2. `fastcgi_cache_use_stale`：同一张取值表含 `non_idempotent`，语法缺。修正：`corrections.syntax` = `fastcgi_cache_use_stale error | timeout | invalid_header | non_idempotent | updating | http_500 | http_503 | http_403 | http_404 | http_429 | off ...;`，引用已有 implementation-1（取值表），note 同上改写。
3. `fastcgi_ignore_headers`：bitmask 必须引用取值表片段，但 syntax source_ids 只有 registration、configuration-definition。`ngx_http_upstream_ignore_headers_masks` 在 `ngx_http_upstream.c:460-470`，9 项（X-Accel-Redirect、X-Accel-Expires、X-Accel-Limit-Rate、X-Accel-Buffering、X-Accel-Charset、Expires、Cache-Control、Set-Cookie、Vary）。修正：新增 evidence 指向该行号，加入 syntax source_ids；按 B03/B05 同一尺度，`corrections.syntax` 把 `field ...` 改为列出这 9 个取值。

### 二、summary（45 条）

**A. 系统性缺环（41 条）**：`ngx_http_fastcgi_handler` 中 `flcf = ngx_http_get_module_loc_conf(r, ngx_http_fastcgi_module);`（fastcgi.c:702）不在 `upstream-binding`（710-744）或这些条目的其他片段内，`u->conf = &flcf->upstream;`（715）中 flcf 的来源缺环，属裁定 1 的中间赋值行缺失（memcached 的对应片段含 `mlcf = ...`，不受影响）。修正：新增一个共享 evidence（如 `handler-flcf`，nginx `src/http/modules/ngx_http_fastcgi_module.c:702-702`，或 702-715），追加到下列条目 summary 的 source_ids，note 加一句说明。

涉及：fastcgi_bind、buffer_size、buffering、buffers、busy_buffers_size、cache、cache_background_update、cache_bypass、cache_lock、cache_lock_age、cache_lock_timeout、cache_max_range_offset、cache_methods、cache_min_uses、cache_revalidate、cache_use_stale、cache_valid、connect_timeout、force_ranges、hide_header、ignore_client_abort、ignore_headers、intercept_errors、limit_rate、max_temp_file_size、next_upstream、next_upstream_timeout、next_upstream_tries、no_cache、pass_header、pass_request_body、pass_request_headers、read_timeout、request_buffering、send_lowat（含 corrections，文字收窄正确）、send_timeout、socket_keepalive、store、store_access、temp_file_write_size、temp_path（均为 `fastcgi_*`）。其中 `pass_request_headers`、`pass_request_body`、`request_buffering` 的 create_request 片段（1111 起等）还依赖 create_request 自身的 `flcf = ...`（860），应一并补入 860-863。

**B. 个别缺环（4 条）**
- `fastcgi_param`：补 create_request 的 860-865（flcf 赋值与 params 选择行）。
- `fastcgi_keep_conn`：补 860 行（create_request 的 flcf 赋值）；修正文字有源码依据（1026-1030 设置 flags、2540 `u->keepalive = 1`、keepalive 模块 342 行读取），无误。
- `fastcgi_cache_path`：note 称“manager 依 inactive 清理、loader 依 loader_files/sleep/threshold 加载”，片段无这些使用点。应新增 `ngx_http_file_cache.c` 约 2160-2210（manage_file 中 `++cache->files >= cache->loader_files`、`elapsed >= cache->loader_threshold`、`ngx_http_file_cache_loader_sleep` 的 `ngx_msleep(cache->loader_sleep)`）与 inactive 使用点（977 `fcn->expire = ngx_time() + cache->inactive;` 等），或把 summary/note 收窄到片段可证明的范围（manager 的 max_size/min_free/manager_*）。
- `memcached_gzip_flag`：补 `memcached.c:348`（`mlcf = ...`）。

## 其他核对结论（通过项要点）

- syntax：registration 标志与参数个数、setter 逐一对应（TAKE12 的 bind、TAKE23 的 param 第 3 参只接受 if_not_empty、TAKE123 的 store_access、TAKE1234 的 temp_path、2MORE 的 cache_path）；`fastcgi_cache_methods` 取值表 GET/HEAD/POST、`memcached_next_upstream`（error/timeout/invalid_response/not_found/off）与语法一致；`fastcgi_cache_path` 语法与 `ngx_http_file_cache_set_slot` 的 levels/use_temp_path/keys_zone/inactive/max_size/min_free/loader_*/manager_* 逐项对应，源码无文档所列 purger*，以源码为准，处理正确。`memcached_bind` 语法串里 `[transparent ]` 有多余空格，属排版小问题，不计退回。
- corrections：`fastcgi_send_lowat`（lowat_check 在无 SO_SNDLOWAT 时置 0 并警告、FreeBSD 要求小于 sendspace）与 `fastcgi_keep_conn` 的收窄均有源码依据、最小化，未引入新错误；两条的退回仅因 A/B 类缺环。
- 其余 summary 的行为陈述已按片段逐句核对（如 cache_max_range_offset 的 `-` 后缀范围、pass_request_headers 的 HTTP_ 前缀/大写/`-` 转 `_`/Cookie 用 `;`、store 的 200 + Content-Length 条件、catch_stderr 的 `flcf` 就在片段 1793 行），除上述缺环外无不符。
- `fastcgi_cache_key`、`fastcgi_catch_stderr`、`fastcgi_pass`、`fastcgi_index`、`fastcgi_split_path_info` 及 memcached 10 条的 summary 通过（conf 来源在各自片段内）。
- unverified：本批无。

## 构建检查

`node scripts/build.mjs --config project.config.json --check`：退出码 0；B04 输出 syntax 60/0、summary 60/0、entries 60。该检查只验证可机械检查部分，不覆盖上述缺环与取值表完整性。

## 复审 1

依据：更新后的 review-brief（裁定 1-6）、B04-report「修复轮次 1」。新增片段全部按 revision e06bdbd4… 与行号实读。

### （1）48 条逐条结论：全部 ADDRESSED
- syntax 3 条：`fastcgi_next_upstream`（补 `updating`）、`fastcgi_cache_use_stale`（补 `non_idempotent`）均为 11 项，与 `ngx_http_fastcgi_next_upstream_masks`（fastcgi.c:208-220）逐项一致；`fastcgi_ignore_headers` 列出 9 项，与 `ngx_http_upstream_ignore_headers_masks`（upstream.c:460-471）一致，syntax source_ids 已含该取值表（implementation-0，已核对内容为该表）。ADDRESSED。
- summary 41 条（原 A 类）：全部已含 `handler-flcf`（fastcgi.c:702-715，702 为 `flcf = ngx_http_get_module_loc_conf(...)`，715 为 `u->conf = &flcf->upstream;`，同一处理函数内一个片段闭环，符合裁定 3/5），脚本逐条核对无遗漏、无多余。ADDRESSED。
- `fastcgi_pass_request_headers`、`fastcgi_pass_request_body`、`fastcgi_request_buffering`、`fastcgi_param`、`fastcgi_keep_conn`：已含 `create-request-flcf`（fastcgi.c:860-865，含 flcf 赋值与 `params = u->cacheable ? &flcf->params_cache : &flcf->params`）。ADDRESSED。
- `fastcgi_cache_path`：新增 `summary-loader-use`（file_cache.c:2173-2210，含 loader_files/loader_threshold/loader_sleep 使用点与 `ngx_msleep(cache->loader_sleep)`）、`summary-inactive-use`（:977 `fcn->expire = ngx_time() + cache->inactive;`），并引用 implementation-7（`ngx_http_file_cache_expire`，按 `fcn->expire` 清理），manager 经 `ngx_http_file_cache_expire`（implementation-3 第 2034 行）；note 与片段一致。ADDRESSED。
- `memcached_gzip_flag`：新增 `handler-mlcf`（memcached.c:348）。ADDRESSED。

### （2）新片段与 corrections：属实，无新错
- 新增片段 handler-flcf、create-request-flcf、summary-loader-use、summary-inactive-use、handler-mlcf 行号与内容均与锁定 revision 一致；既有来源与 revision 逐段比对无不符。
- corrections 共 5 条：syntax 3 条如上；summary 2 条（`fastcgi_send_lowat`、`fastcgi_keep_conn`）文字未变，仍有源码依据且最小化。
- EVIDENCE.md 已同步（含新片段与修正）。

### （3）`fastcgi_cache_key`、`fastcgi_cache_path` 不需要 handler-flcf：理由成立
- `fastcgi_cache_key`：读取 `flcf->cache_key` 的 `ngx_http_fastcgi_create_key` 自身含 `flcf = ngx_http_get_module_loc_conf(...)`，不经 `u->conf`；handler 设 `u->create_key` 在 upstream-binding（721 行）内。
- `fastcgi_cache_path`：配置存入 `fmcf->caches`（main conf），handler 的 `fmcf = ngx_http_get_module_main_conf(...)` 与 `u->caches = &fmcf->caches;`（718-720）均在 upstream-binding 片段内；不走 `u->conf = &flcf->...`。

### 新发现 / 仍未解决
无。（旁注，不计退回：`memcached_bind` 语法串 `[transparent ]` 有多余空格；按裁定 4/6，`fastcgi_catch_stderr string`、`fastcgi_pass_header field` 等值被原样使用，不属需改 `value` 之列。）

### 构建检查（复审 1）
`node scripts/build.mjs --config project.config.json --check`：退出码 0；B04 syntax 60/0、summary 60/0、entries 60。
