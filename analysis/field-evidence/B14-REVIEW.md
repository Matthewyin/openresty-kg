# B14 审核（OpenResty 第三方模块，88 条）

审核者独立复核：按各组件锁定 revision 用 `git show <revision>:<file>` 取行（echo 8376edc2、headers-more 06dc0be5、srcache be22ac0d、ngx_devel_kit 91e30eb0、set-misc 31c4ad67、array-var 32188f86、form-input 43ee690c、iconv 67d55c7e、encrypted-session 0f81b572、ngx_coolkit 462b863b，nginx e06bdbd4）。42 个新增片段逐一按行号读取，内容与判据一致、无偏移；已有片段与锁定 revision 原文逐字一致；无重复 ID、无缺失引用。

## 重点核对
- **选项语法与解析代码**：echo 系 `eval_cmd_args`（仅参数首部、无变量时识别 `-x`，`--` 开头即结束选项区，`exec_echo` 只认 `n`）与 `[-n] [--]` 一致；`echo_foreach_split [--]` 一致；`echo_subrequest*` 的 `-q/-b/-f` 一致。headers-more 输出版 `-t/-s/-a`（`-a` 仅 more_set_headers 接受）、输入版 `-t/-r` 与 `parse_directive` 一致；`more_clear_input_headers` 补 `-r` 正确。
- **裁定 7（srcache_buffer）**：在 srcache be22ac0d 全目录复跑 `git grep -n buf_size`，非 `header_buf_size`/`ngx_buf_size` 的命中仅 `src/ngx_http_srcache_filter_module.c` 67（注册 offsetof）、271（create）、305（merge）与 `src/ngx_http_srcache_filter_module.h` 55（声明），无运行时读取；结论成立，但 note 未列命令范围与命中位置，按裁定 7 退回补记。
- **裁定 1/3/5**：srcache 各使用点补的 `slcf = ngx_http_get_module_loc_conf` 单行片段（store.c 135、403；fetch.c 39；util.c 882）均在同一函数内，闭环；set-misc 经 `ndk_set_var_value`（`nelts == 2` 取目标自身）与 `ndk_set_var_multi_value` 链条完整。
- **裁定 2**：`srcache_methods` 取值表仅 GET/HEAD/POST/PUT/DELETE，`override_method` 方法表 14 项（PATCH 受版本宏保护）与说明一致。

## 总表
| ID | syntax | summary | 备注 |
|---|---|---|---|
| `echo-nginx-module--ngx_http_echo_module--echo` | 通过 | 通过 |  |
| `echo-nginx-module--ngx_http_echo_module--echo_request_body` | 通过 | 通过（复审 2） | ADDRESSED：检索范围与命中（含 README 文档命中）已如实记录 |
| `echo-nginx-module--ngx_http_echo_module--echo_sleep` | 通过 | 通过（复审 2） | ADDRESSED：检索范围与命中（含 README 文档命中）已如实记录 |
| `echo-nginx-module--ngx_http_echo_module--echo_flush` | 通过 | 通过 |  |
| `echo-nginx-module--ngx_http_echo_module--echo_blocking_sleep` | 通过 | 通过 | corrections 收窄经核对正确 |
| `echo-nginx-module--ngx_http_echo_module--echo_reset_timer` | 通过 | 通过 |  |
| `echo-nginx-module--ngx_http_echo_module--echo_before_body` | 通过 | 通过 |  |
| `echo-nginx-module--ngx_http_echo_module--echo_after_body` | 通过 | 通过 |  |
| `echo-nginx-module--ngx_http_echo_module--echo_location_async` | 通过 | 通过 |  |
| `echo-nginx-module--ngx_http_echo_module--echo_location` | 通过 | 通过 |  |
| `echo-nginx-module--ngx_http_echo_module--echo_subrequest_async` | 通过 | 通过 |  |
| `echo-nginx-module--ngx_http_echo_module--echo_subrequest` | 通过 | 通过 |  |
| `echo-nginx-module--ngx_http_echo_module--echo_duplicate` | 通过 | 通过 |  |
| `echo-nginx-module--ngx_http_echo_module--echo_read_request_body` | 通过 | 通过 |  |
| `echo-nginx-module--ngx_http_echo_module--echo_foreach_split` | 通过 | 通过 |  |
| `echo-nginx-module--ngx_http_echo_module--echo_end` | 通过 | 通过 |  |
| `echo-nginx-module--ngx_http_echo_module--echo_abort_parent` | 通过 | 通过 |  |
| `echo-nginx-module--ngx_http_echo_module--echo_exec` | 通过 | 通过 |  |
| `echo-nginx-module--ngx_http_echo_module--echo_status` | 通过 | 通过 |  |
| `headers-more-nginx-module--ngx_http_headers_more_filter_module--more_set_headers` | 通过 | 通过 |  |
| `headers-more-nginx-module--ngx_http_headers_more_filter_module--more_clear_headers` | 通过 | 通过 |  |
| `headers-more-nginx-module--ngx_http_headers_more_filter_module--more_set_input_headers` | 通过 | 通过 |  |
| `headers-more-nginx-module--ngx_http_headers_more_filter_module--more_clear_input_headers` | 通过 | 通过 | corrections 补 -r 经核对正确 |
| `srcache-nginx-module--ngx_http_srcache_filter_module--srcache_buffer` | 通过 | 通过（复审 1） | ADDRESSED：note 已补命令、范围、4 处命中 |
| `srcache-nginx-module--ngx_http_srcache_filter_module--srcache_fetch` | 通过 | 通过 |  |
| `srcache-nginx-module--ngx_http_srcache_filter_module--srcache_store` | 通过 | 通过 |  |
| `srcache-nginx-module--ngx_http_srcache_filter_module--srcache_store_max_size` | 通过 | 通过 |  |
| `srcache-nginx-module--ngx_http_srcache_filter_module--srcache_fetch_skip` | 通过 | 通过 |  |
| `srcache-nginx-module--ngx_http_srcache_filter_module--srcache_store_skip` | 通过 | 通过 |  |
| `srcache-nginx-module--ngx_http_srcache_filter_module--srcache_store_statuses` | 通过 | 通过 |  |
| `srcache-nginx-module--ngx_http_srcache_filter_module--srcache_methods` | 通过 | 通过 |  |
| `srcache-nginx-module--ngx_http_srcache_filter_module--srcache_request_cache_control` | 通过 | 通过 |  |
| `srcache-nginx-module--ngx_http_srcache_filter_module--srcache_store_private` | 通过 | 通过 |  |
| `srcache-nginx-module--ngx_http_srcache_filter_module--srcache_store_no_store` | 通过 | 通过 |  |
| `srcache-nginx-module--ngx_http_srcache_filter_module--srcache_store_no_cache` | 通过 | 通过 |  |
| `srcache-nginx-module--ngx_http_srcache_filter_module--srcache_response_cache_control` | 通过 | 通过 |  |
| `srcache-nginx-module--ngx_http_srcache_filter_module--srcache_store_hide_header` | 通过 | 通过 |  |
| `srcache-nginx-module--ngx_http_srcache_filter_module--srcache_store_pass_header` | 通过 | 通过 |  |
| `srcache-nginx-module--ngx_http_srcache_filter_module--srcache_store_ranges` | 通过 | 通过 |  |
| `srcache-nginx-module--ngx_http_srcache_filter_module--srcache_ignore_content_encoding` | 通过 | 通过 |  |
| `srcache-nginx-module--ngx_http_srcache_filter_module--srcache_header_buffer_size` | 通过 | 通过 |  |
| `srcache-nginx-module--ngx_http_srcache_filter_module--srcache_max_expire` | 通过 | 通过 |  |
| `srcache-nginx-module--ngx_http_srcache_filter_module--srcache_default_expire` | 通过 | 通过 |  |
| `ngx_devel_kit--ndk_http_module--upstream_list` | 通过 | 通过 |  |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_encode_base64` | 通过 | 通过 |  |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_decode_base64` | 通过 | 通过 |  |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_encode_base64url` | 通过 | 通过 |  |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_decode_base64url` | 通过 | 通过 |  |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_decode_hex` | 通过 | 通过 |  |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_encode_hex` | 通过 | 通过 |  |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_hmac_sha1` | 通过 | 通过 |  |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_hmac_sha256` | 通过 | 通过 |  |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_md5` | 通过 | 通过 |  |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_sha1` | 通过 | 通过 |  |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_unescape_uri` | 通过 | 通过 |  |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_escape_uri` | 通过 | 通过 |  |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_quote_sql_str` | 通过 | 通过（复审 1） | ADDRESSED：corrections 与 note 已逐字符改正 |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_quote_pgsql_str` | 通过 | 通过 | corrections 经核对正确（E 前缀、\\+三位八进制） |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_quote_json_str` | 通过 | 通过 |  |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_if_empty` | 通过 | 通过 |  |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_hashed_upstream` | 通过 | 通过 |  |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_misc_base32_padding` | 通过 | 通过 |  |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_base32_padding` | 通过 | 通过 |  |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_base32_alphabet` | 通过 | 通过 |  |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_encode_base32` | 通过 | 通过 |  |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_decode_base32` | 通过 | 通过 |  |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_local_today` | 通过 | 通过 |  |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_formatted_gmt_time` | 通过 | 通过 |  |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_formatted_local_time` | 通过 | 通过 |  |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_random` | 通过 | 通过 |  |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_secure_random_alphanum` | 通过 | 通过 |  |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_secure_random_lcalpha` | 通过 | 通过 |  |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_rotate` | 通过 | 通过 |  |
| `array-var-nginx-module--ngx_http_array_var_module--array_split` | 通过 | 通过 |  |
| `array-var-nginx-module--ngx_http_array_var_module--array_map` | 通过 | 通过 |  |
| `array-var-nginx-module--ngx_http_array_var_module--array_map_op` | 通过 | 通过 |  |
| `array-var-nginx-module--ngx_http_array_var_module--array_join` | 通过 | 通过 |  |
| `form-input-nginx-module--ngx_http_form_input_module--set_form_input` | 通过 | 通过 |  |
| `form-input-nginx-module--ngx_http_form_input_module--set_form_input_multi` | 通过 | 通过 |  |
| `iconv-nginx-module--ngx_http_iconv_module--set_iconv` | 通过 | 通过 |  |
| `iconv-nginx-module--ngx_http_iconv_module--iconv_buffer_size` | 通过 | 通过 |  |
| `iconv-nginx-module--ngx_http_iconv_module--iconv_filter` | 通过 | 通过 |  |
| `encrypted-session-nginx-module--ngx_http_encrypted_session_module--encrypted_session_key` | 通过 | 通过 |  |
| `encrypted-session-nginx-module--ngx_http_encrypted_session_module--encrypted_session_iv` | 通过 | 通过 |  |
| `encrypted-session-nginx-module--ngx_http_encrypted_session_module--encrypted_session_expires` | 通过 | 通过 |  |
| `encrypted-session-nginx-module--ngx_http_encrypted_session_module--set_encrypt_session` | 通过 | 通过 |  |
| `encrypted-session-nginx-module--ngx_http_encrypted_session_module--set_decrypt_session` | 通过 | 通过 |  |
| `ngx_coolkit--ngx_coolkit_module--override_method` | 通过 | 通过 |  |

## 退回清单
1. `srcache-nginx-module--ngx_http_srcache_filter_module--srcache_buffer`（summary）：裁定 7。note 须写明命令与范围，例如：在 srcache-nginx-module revision be22ac0d 全目录执行 `git grep -n buf_size`，排除 `header_buf_size` 与 `ngx_buf_size` 宏后全部命中为 `src/ngx_http_srcache_filter_module.c:67`（命令注册）、`:271`（create）、`:305`（merge）、`src/ngx_http_srcache_filter_module.h:55`（字段声明），无读取该字段的运行时代码。我已在锁定 revision 复跑，结果与此一致。
2. `set-misc-nginx-module--ngx_http_set_misc_module--set_quote_sql_str`（summary corrections 与 summary_evidence.note）：`ngx_http_set_misc_escape_sql_str` 对 `\0`、`\b`、`\n`、`\r`、`\t`、0x1A 是整体替换为两个字符（反斜杠加 `0`、`b`、`n`、`r`、`t`、`Z`），只有 `\`、`'`、`"`、`$` 是在原字符前加反斜杠。应改为：“给输入加单引号；NUL、退格、换行、回车、制表符、0x1A 分别写成 `\0`、`\b`、`\n`、`\r`、`\t`、`\Z`，`\`、`'`、`"`、`$` 前加反斜杠；输入为空时输出 `''`。”note 同步修改。

## 计数
- syntax：通过 88，退回 0。
- summary：通过 86，退回 2。
- unverified：0；可晋级：0。

## `node scripts/build.mjs --config project.config.json --check`
通过（输出汇总 syntax_verified 1041 / unverified 0，summary_verified 1041 / unverified 0，entries 1041）。


## 复审 1（修复轮次 1）
| 项 | 判定 |
|---|---|
| srcache_buffer summary | ADDRESSED。在 be22ac0d 全目录复跑 `git grep -n buf_size`，排除 `header_buf_size`/`ngx_buf_size` 后恰为 `.c:67/271/305`、`.h:55` 四处，与 note 一致。 |
| set_quote_sql_str summary | ADDRESSED。corrections 与 note 均写为 \0、\b、\n、\r、\t、0x1A 整体替换为反斜杠加 0/b/n/r/t/Z，\、'、"、$ 前加反斜杠，与 `ngx_http_set_misc_escape_sql_str` 一致。 |
| echo_sleep 新增检索 | 复跑 echo 8376edc2 `git grep -n ngx_msleep`：命中 `src/ngx_http_echo_sleep.c:181` 与 `README.markdown:629`。note 声称“全目录仅命中 sleep.c:181”，漏记 README 命中，不符合裁定 7“全部命中”。结论本身成立。 |
| echo_request_body 新增检索 | 复跑 `git grep -n read_client_request_body`：命中 `src/ngx_http_echo_request_info.c:29` 与 `README.markdown:1726`（更新日志文字）。note 同样漏记 README 命中。结论本身成立。 |

新发现的 2 条应如何修正：把 note 中“全目录……仅命中 X”改为“src/ 目录下仅命中 X（全目录另有 README.markdown:N 文档文字，非代码）”，或补记 README 命中。

更新后计数：syntax 通过 88、退回 0；summary 通过 86、退回 2（echo_sleep、echo_request_body）。


## 复审 2（修复轮次 2）
| 项 | 判定 |
|---|---|
| echo_sleep summary | ADDRESSED。8376edc2 复跑：`src/` 下 `git grep -n ngx_msleep` 仅 `src/ngx_http_echo_sleep.c:181`，文档命中 `README.markdown:629`，与 note 一致。 |
| echo_request_body summary | ADDRESSED。8376edc2 复跑：`src/` 下 `git grep -n read_client_request_body` 仅 `src/ngx_http_echo_request_info.c:29`，文档命中 `README.markdown:1726`，与 note 一致。 |
| srcache_buffer summary | 未改动，上轮 ADDRESSED 维持。 |

最终计数：syntax 通过 88、退回 0；summary 通过 88、退回 0。`--check` 通过（summary_unverified 0）。
