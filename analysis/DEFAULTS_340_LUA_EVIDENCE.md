# Lua129项默认值与继承补证

日期：2026-10-15。仅写本报告与 DEFAULTS_340_LUA_UPDATES.json；未修改 knowledge、tests、config、dist 或其他 Agent 写集，未读取私有样例、联网或执行 OpenResty。

## 深度交互：边界与判据

目标不是清零 unknown，而是让每一目标字段的注册、setter、存储、初态、合并与消费可以复查。HTTP 与 stream、main/srv/loc/upstream、NDK 动作及 handler 安装分别判断。research 技能只用于一手来源方法；按用户要求不新建 Agent。

固定 manifest SHA-256：a685f1d87c9a3afc7812c8ca231cc137dba10db494b3d0f9b183d16c111cff90。冻结发布 1.27.1.1-f9f6f0ffb7eba3d8；129 条原详情 SHA 已逐条核对一致。

固定 Git 对象：HTTP Lua ea09d92adf835e30cab8d79343c7b8266e888128；stream Lua 69f0cd762112a6e0cddb07f2b5192e9a65034a93；Nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928；NDK 91e30eb05085e7f9762f130cbb883a0e753cf74d；OpenResty 8c37412c31621225e7aa7e825b5b50106c9c71c4。下文来源路径均相对该组件根目录，行号只指固定对象。

## 直接执行：分组进度

已落盘 129/129 身份、200/200 目标字段（HTTP 79；stream 50）。固定清单已全部覆盖：151字段为verified、49字段为not_applicable，0字段仍为unverified；这里只是实施者自身静态补证结论，独立审核仍由审核线程负责。

## 跨组件与有效补丁最终核对

固定发行入口为 OpenResty `util/mirror-tarballs`，HTTP Lua619–625、stream633–639、NDK579–582没有直接组件 patch 步骤。本报告按 `analysis/NGINX_PATCH_AUDIT.json` 的固定34个有效补丁逐一读取补丁头并提取真实目标；不把同目录其他未启用 patch 当有效补丁。没有改该审计文件，也不把历史偏移/fuzz 写成全部为0。

### NGX 公共宏与 setter

宏结论均以对应指令注册 offset、具体字段 create 哨兵及该字段 merge 调用为前提，不由宏名称自动判断任意指令继承。固定34补丁没有修改 `src/core/ngx_conf_file.c` 或 `.h`，下列实际引用的七类宏与全部公共 setter 保持原文：

| ngx_conf_file.h 固定原始行 | 本次实际核对的判据 |
| --- | --- |
| 205-208 | ngx_conf_merge_value：UNSET 才取父值，否则保留显式 on/off |
| 210-213 | ngx_conf_merge_ptr_value：仅 UNSET_PTR 才取父值；NULL 不是继承哨兵 |
| 215-218 | ngx_conf_merge_uint_value：UNSET_UINT 才取父值 |
| 220-223 | ngx_conf_merge_msec_value：UNSET_MSEC 才取父值 |
| 230-233 | ngx_conf_merge_size_value：UNSET_SIZE 才取父值 |
| 240-249 | ngx_conf_merge_str_value：data==NULL 才取父字符串，不拼接 |
| 262-265 | ngx_conf_merge_bitmask_value：本层0才取父掩码，不做父子 OR |

公共 setter 引用范围：`ngx_conf_file.c` 1026–1062（flag）、1066–1089（str）、1093–1125（str array）、1129–1163（keyval）、1167–1194（num）、1198–1225（size）、1260–1287及1260–1299（msec）、1389–1431（bitmask）。同层重复/追加与父子 merge 分开核对；尤其 str array 在 UNSET_PTR 新建、keyval 在 UNSET_PTR 或 NULL 都可新建，不能混为同一种初态。

`stream lua_ssl_conf_command` 的真实差异不是宏行为变化：其 create 没有把字段置为 UNSET_PTR，故子级 NULL 不取父数组；HTTP 明确置 UNSET_PTR，故子级未设会继承整组。这两项还核过各自 set_ssl 是否共享父 ctx，不能只读公共宏。

### 跨 Nginx 路径覆盖

下表覆盖200个目标字段 fact.source_ids 实际使用的全部跨 Nginx 文件，包含复用基线来源；每个ID的具体来源范围仍在其逐项索引中。

| 文件 | 固定原始行范围 | 补丁核对 |
| --- | --- | --- |
| `src/core/ngx_conf_file.c` | 1167–1194、1026–1062、1260–1287、1260–1299、1198–1225、1389–1431、1066–1089、1093–1125、1129–1163 | 固定34有效补丁不修改此文件，引用原文保持 |
| `src/core/ngx_conf_file.h` | 205–208、220–223、230–233、215–218、262–265、240–249、210–213 | 固定34有效补丁不修改此文件，引用原文保持 |
| `src/http/ngx_http.c` | 562–666、577–589 | 固定34有效补丁不修改此文件，引用原文保持 |
| `src/http/modules/ngx_http_rewrite_module.c` | 221–268、136–184、271–294、604–641 | 固定34有效补丁不修改此文件，引用原文保持 |
| `src/http/ngx_http_core_module.c` | 3548–3555、3669–3954、1381–1384 | no_error_pages 修改完整 merge 内的 error_pages 分支；3548–3555、1381–1384 原文保持，全文3669–3954不保持，详见下节 |
| `src/http/ngx_http_upstream.c` | 6090–6133 | 三项相关补丁不改 create_srv_conf 循环；6090–6133 原文在补丁后6102–6145保持 |
| `src/stream/ngx_stream.c` | 224–239 | 固定34有效补丁不修改此文件，引用原文保持 |
| `src/stream/ngx_stream_core_module.c` | 679–711、715–795 | 固定34有效补丁不修改此文件，引用原文保持 |
| `src/stream/ngx_stream_upstream.c` | 337–383 | 固定34有效补丁不修改此文件，引用原文保持 |
| `src/stream/ngx_stream_variables.c` | 149–218 | 固定34有效补丁不修改此文件，引用原文保持 |
| `src/event/ngx_event_openssl.c` | 1595–1664 | 三项 yield 补丁修改其他握手/early_data分支；ngx_ssl_conf_commands 1595–1664原文保持 |

NDK `src/ndk_set_var.c` 256–304、408–422、449–488、532–555 在固定发行无直接 patch；必须同时结合未修改的 Nginx rewrite create/merge、阶段执行和 if 编译路径，才能证明三项 set_by_lua 动作不是普通 Lua handler 槽继承。

### 被修改文件的内容复核

为避免只凭文件名判断，已按34补丁的固定顺序，将本次相关的3个修改文件对应 hunk **仅在内存中**重建；未创建回放目录、未修改仓库或执行 OpenResty。最终内容分别与既有 `patched_sha256` 完全一致。它是本次片段核对，不代替原47文件补丁门禁，也不修改/重新批准已有 hunk_adjustments。

| 文件 | 本次相关有效补丁 | 重建后 SHA-256（与原审计一致） |
| --- | --- | --- |
| `src/http/ngx_http_core_module.c` | no_error_pages | `44b8a7f58c099540f4b681e1c5ae4cbdd581eb7309bc1779b6dfdc6013354f4f` |
| `src/http/ngx_http_upstream.c` | balancer_status_code、upstream_pipelining、upstream_timeout_fields | `2c0eef99474d3275c5265c44381833f2a66bc1fd70d8966e1c560ab6516e5660` |
| `src/event/ngx_event_openssl.c` | ssl_cert_cb_yield、ssl_sess_cb_yield、ssl_client_hello_cb_yield | `0026b3d2b249ea4385245d9b632628d38af1f18b76902ec8ba213cab9de7f9b6` |

其中 balancer_status_code 改 `ngx_http_upstream_connect` 的特殊状态码分支；upstream_pipelining 改请求发送判断；upstream_timeout_fields 改运行时超时字段，均未改 upstream独立配置对象循环。ssl_cert_cb_yield、ssl_sess_cb_yield、ssl_client_hello_cb_yield 的实际 hunk 修改 handshake/early_data 的异步回调错误分支，不修改1595–1664的命令执行。上下文可能多处相同，本次以最终完整文件 SHA 与既有审计匹配消歧，不凭 patch 头中的旧行号当作当前源码行号。

32段不同跨 Nginx 原始引用范围中，31段在本次确认的补丁后对象保持原文；唯一不保持的是 HTTP core merge 3669–3954。core merge 在补丁前后都没有 `conf->handler` 的复制或赋值；实际 setter 安装和请求选择路径另有逐ID来源支撑。对整段字节的影响与对本条事实的影响分别记录。

### 必须保留的旧补丁结论边界

以下3项的 **inheritance 事实不变**，但新增 `core-merge-full` 来源含被 no_error_pages 修改的分支；不能将旧 patch_status.note 中“实际回放所引用 Nginx 片段保持”的说法无条件扩大到这次完整片段。实际补丁来源为固定 `patches/nginx-1.27.1-no_error_pages.patch`:1–91（已作为新 evidence 追加）。不擅改既有 patch_status.status/note，主线程与独立审核应保持此精确范围说明；若正式 note 要覆盖全部新来源，应仅修正该说明，不声称整段未改。

- `lua-nginx-module--ngx_http_lua_module--content_by_lua`：`inheritance`，新来源 `df340-lua-h-content_by_lua-core-merge-full`；默认值和继承结论无需变更。
- `lua-nginx-module--ngx_http_lua_module--content_by_lua_block`：`inheritance`，新来源 `df340-lua-h-content_by_lua_block-core-merge-full`；默认值和继承结论无需变更。
- `lua-nginx-module--ngx_http_lua_module--content_by_lua_file`：`inheritance`，新来源 `df340-lua-h-content_by_lua_file-core-merge-full`；默认值和继承结论无需变更。

capture 两项另读 intercept_error_log:1–60 与 larger_max_error_str:1–13：前者增加 cycle 日志 hook，后者改变 NGX_MAX_ERROR_STR 的条件缺省；保持旧 verified_affected，不由其他 main 参数外推为无影响。TLS脚本运行时既有 yield 补丁判断也不因配置层继承证据而取消。



### lua-nginx-module--ngx_http_lua_module--lua_load_resty_core

组：B-main-special。目标字段：defaults、inheritance。

注册 main/FLAG → 专用 callback 不解析或保存参数 → VM require resty.core 与该入口无关。父/子覆盖无合法分支。

- defaults [not_applicable]：该入口已废弃：配置回调只告警并返回成功，不保存 on/off 状态，因而没有仍能控制行为的开关默认值。未配置它时，Lua VM 初始化仍强制 require resty.core；off 也不能禁用。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_load_resty_core-create-main`、`df340-lua-h-lua_load_resty_core-deprecated-no-state`、`df340-lua-h-lua_load_resty_core-mandatory-require`。
- inheritance [not_applicable]：只允许在 http 配置的废弃无状态入口；没有供子级继承的开关槽，不能按历史 on/off 语法解释为父子开关合并。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_load_resty_core-create-main`、`df340-lua-h-lua_load_resty_core-deprecated-no-state`、`df340-lua-h-lua_load_resty_core-mandatory-require`。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:100–105（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:189–228（冻结基线保留）。
- `df340-lua-h-lua_load_resty_core-create-main` → lua-nginx-module/`src/ngx_http_lua_module.c`:1016–1043（新）。
- `df340-lua-h-lua_load_resty_core-deprecated-no-state` → lua-nginx-module/`src/ngx_http_lua_directive.c`:189–196（新）。
- `df340-lua-h-lua_load_resty_core-mandatory-require` → lua-nginx-module/`src/ngx_http_lua_util.c`:3930–3944（新）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_thread_cache_max_entries

组：A-main-scalar。目标字段：inheritance。

注册限定 main → setter 写 lua_thread_cache_max_entries → create/init 设置初态及缺省 → 消费端读取同一 main_conf。父设置/子未设置与子显式覆盖均不是本指令合法配置分支。

- inheritance [not_applicable]：仅能在http级配置，写入本模块唯一 main_conf 的 lua_thread_cache_max_entries；server/location不创建该参数的独立槽，也不进行父子合并。仅 HAVE_LUA_RESETTHREAD 分支实际缓存协程；不是操作系统线程池。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_thread_cache_max_entries-create`、`implementation-0`、`implementation-2`。

未设置路径：HTTP init 所列缺省仅用于解释单层 main 配置；本批不改 manifest 外 defaults。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:107–112（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1167–1194（冻结基线保留）。
- `df340-lua-h-lua_thread_cache_max_entries-create` → lua-nginx-module/`src/ngx_http_lua_module.c`:1016–1049（新）。
- `implementation-0` → lua-nginx-module/`src/ngx_http_lua_module.c`:1085–1098（冻结基线保留）。
- `implementation-2` → lua-nginx-module/`src/ngx_http_lua_util.c`:335–365（冻结基线保留）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_max_running_timers

组：A-main-scalar。目标字段：inheritance。

注册限定 main → setter 写 max_running_timers → create/init 设置初态及缺省 → 消费端读取同一 main_conf。父设置/子未设置与子显式覆盖均不是本指令合法配置分支。

- inheritance [not_applicable]：仅能在http级配置，写入本模块唯一 main_conf 的 max_running_timers；server/location不创建该参数的独立槽，也不进行父子合并。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_max_running_timers-create`、`merge-default`、`df340-lua-h-lua_max_running_timers-consume`。

未设置路径：HTTP init 所列缺省仅用于解释单层 main 配置；本批不改 manifest 外 defaults。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:114–119（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1167–1194（冻结基线保留）。
- `df340-lua-h-lua_max_running_timers-create` → lua-nginx-module/`src/ngx_http_lua_module.c`:1016–1048（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1114–1116（冻结基线保留）。
- `df340-lua-h-lua_max_running_timers-consume` → lua-nginx-module/`src/ngx_http_lua_timer.c`:543–563（新）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_max_pending_timers

组：A-main-scalar。目标字段：inheritance。

注册限定 main → setter 写 max_pending_timers → create/init 设置初态及缺省 → 消费端读取同一 main_conf。父设置/子未设置与子显式覆盖均不是本指令合法配置分支。

- inheritance [not_applicable]：仅能在http级配置，写入本模块唯一 main_conf 的 max_pending_timers；server/location不创建该参数的独立槽，也不进行父子合并。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_max_pending_timers-create`、`merge-default`、`df340-lua-h-lua_max_pending_timers-consume`。

未设置路径：HTTP init 所列缺省仅用于解释单层 main 配置；本批不改 manifest 外 defaults。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:121–126（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1167–1194（冻结基线保留）。
- `df340-lua-h-lua_max_pending_timers-create` → lua-nginx-module/`src/ngx_http_lua_module.c`:1016–1048（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1110–1112（冻结基线保留）。
- `df340-lua-h-lua_max_pending_timers-consume` → lua-nginx-module/`src/ngx_http_lua_timer.c`:193–199（新）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_shared_dict

组：B-main-special。目标字段：inheritance。

main 注册 → callback 初始化/追加 shdict_zones、绑定模块 tag 和 init_zone → pcalloc 初态 NULL → 注入 ngx.shared 时按 main 列表枚举。子显式声明不合法，main 共享可见性不叫逐层继承。

- inheritance [not_applicable]：仅 http 级声明，字典加入同一 main_conf 的 shdict_zones，供本域 Lua VM 的 ngx.shared 使用，不是 server/location各自复制或合并一份。不同名称逐次注册；本域重复名称被拒绝；不据此推定 HTTP 与 stream 的同名字典共享。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_shared_dict-create-main`、`df340-lua-h-lua_shared_dict-dict-register`、`df340-lua-h-lua_shared_dict-dict-consume`。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:128–133（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:80–119（冻结基线保留）。
- `df340-lua-h-lua_shared_dict-create-main` → lua-nginx-module/`src/ngx_http_lua_module.c`:1016–1043（新）。
- `df340-lua-h-lua_shared_dict-dict-register` → lua-nginx-module/`src/ngx_http_lua_directive.c`:79–161（新）。
- `df340-lua-h-lua_shared_dict-dict-consume` → lua-nginx-module/`src/ngx_http_lua_shdict.c`:346–372（新）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_capture_error_log

组：B-main-special。目标字段：defaults、inheritance。

main 注册 → requires_capture_log 初态 0 → callback 校验容量、重复和 cycle hook → 分配 ringbuf、安装唯一 handler → log consumer 从 cycle 获取 ringbuf。未配置不执行此安装路径。

- defaults [verified]：未配置本指令时，不由它分配本域日志环形缓冲区，也不注册本域 capture handler；没有隐含缓冲区容量。这不排除另一域或其他入口已占用 cycle 的唯一 intercept_error_log_handler。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_capture_error_log-create-main`、`implementation-0`、`patch-intercept_error_log`、`patch-larger_max_error_str`。
- inheritance [not_applicable]：仅 http 级配置，callback 为 cycle 安装唯一日志拦截器并保存缓冲区，不进行 server/location层级合并。重复配置或已有拦截器会拒绝；无 HAVE_INTERCEPT_ERROR_LOG_PATCH 时显式配置报错。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_capture_error_log-create-main`、`implementation-0`、`patch-intercept_error_log`、`patch-larger_max_error_str`。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:135–140（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:1974–2036（冻结基线保留）。
- `df340-lua-h-lua_capture_error_log-create-main` → lua-nginx-module/`src/ngx_http_lua_module.c`:1016–1043（新）。
- `implementation-0` → lua-nginx-module/`src/ngx_http_lua_log.c`:327–347（冻结基线保留）。
- `patch-intercept_error_log` → openresty/`patches/nginx-1.27.1-intercept_error_log.patch`:1–60（冻结基线保留）。
- `patch-larger_max_error_str` → openresty/`patches/nginx-1.27.1-larger_max_error_str.patch`:1–13（冻结基线保留）。

补丁核对：已读固定 intercept_error_log 与 larger_max_error_str 补丁；前者增加 cycle hook 并在 ngx_log_error_core 调用，后者把默认 NGX_MAX_ERROR_STR 改为4096且允许外部预定义。本条不猜编译覆盖后的最小容量；保持既有 verified_affected。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_sa_restart

组：A-main-scalar。目标字段：inheritance。

注册限定 main → setter 写 set_sa_restart → create/init 设置初态及缺省 → 消费端读取同一 main_conf。父设置/子未设置与子显式覆盖均不是本指令合法配置分支。

- inheritance [not_applicable]：仅能在http级配置，写入本模块唯一 main_conf 的 set_sa_restart；server/location不创建该参数的独立槽，也不进行父子合并。实际作用受 NGX_HTTP_LUA_HAVE_SA_RESTART 条件约束。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_sa_restart-create`、`merge-default`、`implementation-0`。

未设置路径：HTTP init 所列缺省仅用于解释单层 main 配置；本批不改 manifest 外 defaults。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:142–147（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1026–1062（冻结基线保留）。
- `df340-lua-h-lua_sa_restart-create` → lua-nginx-module/`src/ngx_http_lua_module.c`:1053–1056（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1118–1122（冻结基线保留）。
- `implementation-0` → lua-nginx-module/`src/ngx_http_lua_initworkerby.c`:78–82（冻结基线保留）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_regex_cache_max_entries

组：A-main-scalar。目标字段：inheritance。

注册限定 main → setter 写 regex_cache_max_entries → create/init 设置初态及缺省 → 消费端读取同一 main_conf。父设置/子未设置与子显式覆盖均不是本指令合法配置分支。

- inheritance [not_applicable]：仅能在http级配置，写入本模块唯一 main_conf 的 regex_cache_max_entries；server/location不创建该参数的独立槽，也不进行父子合并。NGX_PCRE 条件控制存储与使用；无 PCRE 时专用 setter 返回成功但不产生配置作用。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_regex_cache_max_entries-create`、`merge-default`、`implementation-0`。

未设置路径：HTTP init 所列缺省仅用于解释单层 main 配置；本批不改 manifest 外 defaults。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:149–158（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:241–250（冻结基线保留）。
- `df340-lua-h-lua_regex_cache_max_entries-create` → lua-nginx-module/`src/ngx_http_lua_module.c`:1049–1052（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1100–1103（冻结基线保留）。
- `implementation-0` → lua-nginx-module/`src/ngx_http_lua_regex.c`:957–968（冻结基线保留）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_regex_match_limit

组：A-main-scalar。目标字段：inheritance。

注册限定 main → setter 写 regex_match_limit → create/init 设置初态及缺省 → 消费端读取同一 main_conf。父设置/子未设置与子显式覆盖均不是本指令合法配置分支。

- inheritance [not_applicable]：仅能在http级配置，写入本模块唯一 main_conf 的 regex_match_limit；server/location不创建该参数的独立槽，也不进行父子合并。NGX_PCRE 条件控制存储与使用；无 PCRE 时专用 setter 返回成功但不产生配置作用。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_regex_match_limit-create`、`merge-default`、`df340-lua-h-lua_regex_match_limit-consume`。

未设置路径：HTTP init 所列缺省仅用于解释单层 main 配置；本批不改 manifest 外 defaults。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:160–169（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:253–262（冻结基线保留）。
- `df340-lua-h-lua_regex_match_limit-create` → lua-nginx-module/`src/ngx_http_lua_module.c`:1049–1052（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1105–1107（冻结基线保留）。
- `df340-lua-h-lua_regex_match_limit-consume` → lua-nginx-module/`src/ngx_http_lua_regex.c`:197–202（新）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_package_cpath

组：B-main-special。目标字段：defaults、inheritance。

main 注册 → 专用 setter 写 lua_cpath（非空长度用于重复检查）→ create 零长度 → new_state 区分 parent_vm 与初始 VM → set_path 展开字符串。不能把 C 结构空串等同最终 Lua 搜索路径。

- defaults [verified]：未配置时 lua_cpath.len 为 0，不用空字符串覆盖 package.cpath：无父 VM 的新 VM 保留 Lua 标准库初始化的搜索路径，若定义 LUA_DEFAULT_CPATH 则先把它前置；有父 VM 时复制父 VM 的 package.cpath。最终路径取决于 Lua 初始化环境、编译宏及父 VM，不能写成固定现场绝对路径。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_package_cpath-create-main`、`df340-lua-h-lua_package_cpath-vm-path`、`implementation-1`。
- inheritance [not_applicable]：仅 http 级保存 lua_cpath，无 server/location配置合并。显式非空字符串设置 VM 的 package.cpath；;; 展开为设置前路径，$prefix 与 ${prefix} 展开为 Nginx prefix。新 VM 复制父 VM 路径是 VM 创建机制，不是指令上下文继承。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_package_cpath-create-main`、`df340-lua-h-lua_package_cpath-vm-path`、`implementation-1`。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:171–176（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:199–217（冻结基线保留）。
- `df340-lua-h-lua_package_cpath-create-main` → lua-nginx-module/`src/ngx_http_lua_module.c`:1016–1043（新）。
- `df340-lua-h-lua_package_cpath-vm-path` → lua-nginx-module/`src/ngx_http_lua_util.c`:231–319（新）。
- `implementation-1` → lua-nginx-module/`src/ngx_http_lua_util.c`:159–196（冻结基线保留）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_package_path

组：B-main-special。目标字段：defaults、inheritance。

main 注册 → 专用 setter 写 lua_path（非空长度用于重复检查）→ create 零长度 → new_state 区分 parent_vm 与初始 VM → set_path 展开字符串。不能把 C 结构空串等同最终 Lua 搜索路径。

- defaults [verified]：未配置时 lua_path.len 为 0，不用空字符串覆盖 package.path：无父 VM 的新 VM 保留 Lua 标准库初始化的搜索路径，若定义 LUA_DEFAULT_PATH 则先把它前置；有父 VM 时复制父 VM 的 package.path。最终路径取决于 Lua 初始化环境、编译宏及父 VM，不能写成固定现场绝对路径。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_package_path-create-main`、`df340-lua-h-lua_package_path-vm-path`、`implementation-1`。
- inheritance [not_applicable]：仅 http 级保存 lua_path，无 server/location配置合并。显式非空字符串设置 VM 的 package.path；;; 展开为设置前路径，$prefix 与 ${prefix} 展开为 Nginx prefix。新 VM 复制父 VM 路径是 VM 创建机制，不是指令上下文继承。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_package_path-create-main`、`df340-lua-h-lua_package_path-vm-path`、`implementation-1`。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:178–183（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:220–238（冻结基线保留）。
- `df340-lua-h-lua_package_path-create-main` → lua-nginx-module/`src/ngx_http_lua_module.c`:1016–1043（新）。
- `df340-lua-h-lua_package_path-vm-path` → lua-nginx-module/`src/ngx_http_lua_util.c`:231–319（新）。
- `implementation-1` → lua-nginx-module/`src/ngx_http_lua_util.c`:159–196（冻结基线保留）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_code_cache

组：D-scalar-merge。目标字段：inheritance。

本 ID 的 offset 指向 enable_code_cache → 专用 callback 委派 flag setter → create 设置对应 UNSET → 所列专属 merge 调用及公共宏决定父/子选择 → 消费端读取合并对象。

- inheritance [verified]：写入 loc_conf 的 enable_code_cache。按 http→server→location/嵌套 location 的配置对象合并，合法 location-if 也按其对象参与合并；子项仍为对应 UNSET 哨兵时取父值，子项显式设置则保留，不累加。父子均未设置才采用该字段 merge 的缺省。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_code_cache-create-slot`、`df340-lua-h-lua_code_cache-merge-slot`、`df340-lua-h-lua_code_cache-merge-macro`、`df340-lua-h-lua_code_cache-hierarchy`、`df340-lua-h-lua_code_cache-consume`。

未设置、父设子未设、子显式设置三路均由本字段 merge 宏核对。只补 inheritance；已有 defaults、运行限制及其来源保持。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:185–191（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:165–204（冻结基线保留）。
- `df340-lua-h-lua_code_cache-create-slot` → lua-nginx-module/`src/ngx_http_lua_module.c`:1417–1421（新）。
- `df340-lua-h-lua_code_cache-merge-slot` → lua-nginx-module/`src/ngx_http_lua_module.c`:1548–1548（新）。
- `df340-lua-h-lua_code_cache-merge-macro` → nginx/`src/core/ngx_conf_file.h`:205–208（新）。
- `df340-lua-h-lua_code_cache-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `df340-lua-h-lua_code_cache-consume` → lua-nginx-module/`src/ngx_http_lua_util.h`:301–310（新）。

补丁核对：新增跨 Nginx 来源限定 ngx_conf_file.h 与 ngx_http.c；34条有效补丁没有改这些文件，已核有效目标集及固定补丁头。Lua setter/create/merge/消费来自未直接打补丁的本组件；不外推 socket/事件运行链整体无补丁影响。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_need_request_body

组：D-scalar-merge。目标字段：inheritance。

本 ID 的 offset 指向 force_read_body → src/core/ngx_conf_file.c 的注册 setter → create 设置对应 UNSET → 所列专属 merge 调用及公共宏决定父/子选择 → 消费端读取合并对象。

- inheritance [verified]：写入 loc_conf 的 force_read_body。按 http→server→location/嵌套 location 的配置对象合并，合法 location-if 也按其对象参与合并；子项仍为对应 UNSET 哨兵时取父值，子项显式设置则保留，不累加。父子均未设置才采用该字段 merge 的缺省。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_need_request_body-create-slot`、`merge-default`、`df340-lua-h-lua_need_request_body-merge-macro`、`df340-lua-h-lua_need_request_body-hierarchy`、`implementation-3`。

未设置、父设子未设、子显式设置三路均由本字段 merge 宏核对。只补 inheritance；已有 defaults、运行限制及其来源保持。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:193–199（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1026–1062（冻结基线保留）。
- `df340-lua-h-lua_need_request_body-create-slot` → lua-nginx-module/`src/ngx_http_lua_module.c`:1417–1421（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1547–1547（冻结基线保留）。
- `df340-lua-h-lua_need_request_body-merge-macro` → nginx/`src/core/ngx_conf_file.h`:205–208（新）。
- `df340-lua-h-lua_need_request_body-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `implementation-3` → lua-nginx-module/`src/ngx_http_lua_contentby.c`:198–222（冻结基线保留）。

补丁核对：新增跨 Nginx 来源限定 ngx_conf_file.h 与 ngx_http.c；34条有效补丁没有改这些文件，已核有效目标集及固定补丁头。Lua setter/create/merge/消费来自未直接打补丁的本组件；不外推 socket/事件运行链整体无补丁影响。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_transform_underscores_in_response_headers

组：D-scalar-merge。目标字段：inheritance。

本 ID 的 offset 指向 transform_underscores_in_resp_headers → src/core/ngx_conf_file.c 的注册 setter → create 设置对应 UNSET → 所列专属 merge 调用及公共宏决定父/子选择 → 消费端读取合并对象。

- inheritance [verified]：写入 loc_conf 的 transform_underscores_in_resp_headers。按 http→server→location/嵌套 location 的配置对象合并，合法 location-if 也按其对象参与合并；子项仍为对应 UNSET 哨兵时取父值，子项显式设置则保留，不累加。父子均未设置才采用该字段 merge 的缺省。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_transform_underscores_in_response_headers-create-slot`、`merge-default`、`df340-lua-h-lua_transform_underscores_in_response_headers-merge-macro`、`df340-lua-h-lua_transform_underscores_in_response_headers-hierarchy`、`df340-lua-h-lua_transform_underscores_in_response_headers-consume`。

未设置、父设子未设、子显式设置三路均由本字段 merge 宏核对。只补 inheritance；已有 defaults、运行限制及其来源保持。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:201–207（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1026–1062（冻结基线保留）。
- `df340-lua-h-lua_transform_underscores_in_response_headers-create-slot` → lua-nginx-module/`src/ngx_http_lua_module.c`:1431–1432（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1574–1575（冻结基线保留）。
- `df340-lua-h-lua_transform_underscores_in_response_headers-merge-macro` → nginx/`src/core/ngx_conf_file.h`:205–208（新）。
- `df340-lua-h-lua_transform_underscores_in_response_headers-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `df340-lua-h-lua_transform_underscores_in_response_headers-consume` → lua-nginx-module/`src/ngx_http_lua_headers.c`:1174–1189（新）。

补丁核对：新增跨 Nginx 来源限定 ngx_conf_file.h 与 ngx_http.c；34条有效补丁没有改这些文件，已核有效目标集及固定补丁头。Lua setter/create/merge/消费来自未直接打补丁的本组件；不外推 socket/事件运行链整体无补丁影响。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_socket_log_errors

组：D-scalar-merge。目标字段：inheritance。

本 ID 的 offset 指向 log_socket_errors → src/core/ngx_conf_file.c 的注册 setter → create 设置对应 UNSET → 所列专属 merge 调用及公共宏决定父/子选择 → 消费端读取合并对象。

- inheritance [verified]：写入 loc_conf 的 log_socket_errors。按 http→server→location/嵌套 location 的配置对象合并，合法 location-if 也按其对象参与合并；子项仍为对应 UNSET 哨兵时取父值，子项显式设置则保留，不累加。父子均未设置才采用该字段 merge 的缺省。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_socket_log_errors-create-slot`、`merge-default`、`df340-lua-h-lua_socket_log_errors-merge-macro`、`df340-lua-h-lua_socket_log_errors-hierarchy`、`df340-lua-h-lua_socket_log_errors-consume`。

未设置、父设子未设、子显式设置三路均由本字段 merge 宏核对。只补 inheritance；已有 defaults、运行限制及其来源保持。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:209–215（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1026–1062（冻结基线保留）。
- `df340-lua-h-lua_socket_log_errors-create-slot` → lua-nginx-module/`src/ngx_http_lua_module.c`:1431–1432（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1577–1577（冻结基线保留）。
- `df340-lua-h-lua_socket_log_errors-merge-macro` → nginx/`src/core/ngx_conf_file.h`:205–208（新）。
- `df340-lua-h-lua_socket_log_errors-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `df340-lua-h-lua_socket_log_errors-consume` → lua-nginx-module/`src/ngx_http_lua_socket_tcp.c`:1928–1935（新）。

补丁核对：新增跨 Nginx 来源限定 ngx_conf_file.h 与 ngx_http.c；34条有效补丁没有改这些文件，已核有效目标集及固定补丁头。Lua setter/create/merge/消费来自未直接打补丁的本组件；不外推 socket/事件运行链整体无补丁影响。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--init_by_lua_block

组：C-main-lifecycle。目标字段：defaults、inheritance。

本 ID 注册 post=inline 加载器；block callback 委派专用 setter → setter 检查同族 handler 后保存 init_handler/init_src → main pcalloc 零态 → 消费端以 handler 是否为空判断。

- defaults [verified]：未配置 init_by_lua 族的任何输入形式时，main_conf 的 init_handler 为 NULL、init_src 为空，不运行本族用户脚本；没有默认脚本或默认文件。配置测试或信号进程还会提前跳过模块的 VM 初始化入口。 来源：`registration`、`configuration-definition`、`merge-default`、`implementation-0`、`df340-lua-h-init_by_lua_block-no-script-consume`、`init-mode-guard`、`df340-lua-h-init_by_lua_block-shared-init-guard`、`df340-lua-h-init_by_lua_block-code-cache-vm-init`。
- inheritance [not_applicable]：仅在 http 级配置，init_by_lua_block、init_by_lua、init_by_lua_file 共用 main_conf 的 init_handler/init_src 槽，同族第二次配置按 handler 非空报重复；没有 server/location层级合并，不同生命周期使用不同槽。 来源：`registration`、`configuration-definition`、`merge-default`、`implementation-0`、`df340-lua-h-init_by_lua_block-no-script-consume`、`init-mode-guard`。

未设分支以整族为单位，不能把未写 block 误称为忽略同族 inline/file。父设置/子未设置与子显式设置无合法层级分支；同一 main 再定义是重复，不是覆盖。

init_handler 的配置后调用、共享区全部初始化后的调用，以及 code_cache off 创建请求 VM 时的调用分别存在；本字段只断言缺省无脚本，不声称显式脚本必定只在 master 执行一次。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:217–222（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:1216–1232（冻结基线保留）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1016–1043（冻结基线保留）。
- `implementation-0` → lua-nginx-module/`src/ngx_http_lua_directive.c`:1235–1291（冻结基线保留）。
- `df340-lua-h-init_by_lua_block-no-script-consume` → lua-nginx-module/`src/ngx_http_lua_module.c`:959–971（新）。
- `init-mode-guard` → lua-nginx-module/`src/ngx_http_lua_module.c`:753–767（冻结基线保留）。
- `df340-lua-h-init_by_lua_block-shared-init-guard` → lua-nginx-module/`src/ngx_http_lua_api.c`:195–211（新）。
- `df340-lua-h-init_by_lua_block-code-cache-vm-init` → lua-nginx-module/`src/ngx_http_lua_util.h`:301–341（新）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--init_by_lua

组：C-main-lifecycle。目标字段：defaults、inheritance。

本 ID 注册 post=inline 加载器 → setter 检查同族 handler 后保存 init_handler/init_src → main pcalloc 零态 → 消费端以 handler 是否为空判断。

- defaults [verified]：未配置 init_by_lua 族的任何输入形式时，main_conf 的 init_handler 为 NULL、init_src 为空，不运行本族用户脚本；没有默认脚本或默认文件。配置测试或信号进程还会提前跳过模块的 VM 初始化入口。 来源：`registration`、`configuration-definition`、`merge-default`、`df340-lua-h-init_by_lua-no-script-consume`、`init-mode-guard`、`df340-lua-h-init_by_lua-shared-init-guard`、`df340-lua-h-init_by_lua-code-cache-vm-init`。
- inheritance [not_applicable]：仅在 http 级配置，init_by_lua_block、init_by_lua、init_by_lua_file 共用 main_conf 的 init_handler/init_src 槽，同族第二次配置按 handler 非空报重复；没有 server/location层级合并，不同生命周期使用不同槽。 来源：`registration`、`configuration-definition`、`merge-default`、`df340-lua-h-init_by_lua-no-script-consume`、`init-mode-guard`。

未设分支以整族为单位，不能把未写 block 误称为忽略同族 inline/file。父设置/子未设置与子显式设置无合法层级分支；同一 main 再定义是重复，不是覆盖。

init_handler 的配置后调用、共享区全部初始化后的调用，以及 code_cache off 创建请求 VM 时的调用分别存在；本字段只断言缺省无脚本，不声称显式脚本必定只在 master 执行一次。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:224–229（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:1235–1291（冻结基线保留）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1016–1043（冻结基线保留）。
- `df340-lua-h-init_by_lua-no-script-consume` → lua-nginx-module/`src/ngx_http_lua_module.c`:959–971（新）。
- `init-mode-guard` → lua-nginx-module/`src/ngx_http_lua_module.c`:753–767（冻结基线保留）。
- `df340-lua-h-init_by_lua-shared-init-guard` → lua-nginx-module/`src/ngx_http_lua_api.c`:195–211（新）。
- `df340-lua-h-init_by_lua-code-cache-vm-init` → lua-nginx-module/`src/ngx_http_lua_util.h`:301–341（新）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--init_by_lua_file

组：C-main-lifecycle。目标字段：defaults、inheritance。

本 ID 注册 post=file 加载器 → setter 检查同族 handler 后保存 init_handler/init_src → main pcalloc 零态 → 消费端以 handler 是否为空判断。

- defaults [verified]：未配置 init_by_lua 族的任何输入形式时，main_conf 的 init_handler 为 NULL、init_src 为空，不运行本族用户脚本；没有默认脚本或默认文件。配置测试或信号进程还会提前跳过模块的 VM 初始化入口。 来源：`registration`、`configuration-definition`、`merge-default`、`df340-lua-h-init_by_lua_file-no-script-consume`、`init-mode-guard`、`df340-lua-h-init_by_lua_file-shared-init-guard`、`df340-lua-h-init_by_lua_file-code-cache-vm-init`。
- inheritance [not_applicable]：仅在 http 级配置，init_by_lua_block、init_by_lua、init_by_lua_file 共用 main_conf 的 init_handler/init_src 槽，同族第二次配置按 handler 非空报重复；没有 server/location层级合并，不同生命周期使用不同槽。 来源：`registration`、`configuration-definition`、`merge-default`、`df340-lua-h-init_by_lua_file-no-script-consume`、`init-mode-guard`。

未设分支以整族为单位，不能把未写 block 误称为忽略同族 inline/file。父设置/子未设置与子显式设置无合法层级分支；同一 main 再定义是重复，不是覆盖。此 file 入口配置时补全路径，不套用请求阶段 file 的 complex value 求值。

init_handler 的配置后调用、共享区全部初始化后的调用，以及 code_cache off 创建请求 VM 时的调用分别存在；本字段只断言缺省无脚本，不声称显式脚本必定只在 master 执行一次。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:231–236（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:1235–1291（冻结基线保留）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1016–1043（冻结基线保留）。
- `df340-lua-h-init_by_lua_file-no-script-consume` → lua-nginx-module/`src/ngx_http_lua_module.c`:959–971（新）。
- `init-mode-guard` → lua-nginx-module/`src/ngx_http_lua_module.c`:753–767（冻结基线保留）。
- `df340-lua-h-init_by_lua_file-shared-init-guard` → lua-nginx-module/`src/ngx_http_lua_api.c`:195–211（新）。
- `df340-lua-h-init_by_lua_file-code-cache-vm-init` → lua-nginx-module/`src/ngx_http_lua_util.h`:301–341（新）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--init_worker_by_lua_block

组：C-main-lifecycle。目标字段：defaults、inheritance。

本 ID 注册 post=inline 加载器；block callback 委派专用 setter → setter 检查同族 handler 后保存 init_worker_handler/init_worker_src → main pcalloc 零态 → 消费端以 handler 是否为空判断。

- defaults [verified]：未配置 init_worker_by_lua 族的任何输入形式时，main_conf 的 init_worker_handler 为 NULL、init_worker_src 为空，不运行本族用户脚本；没有默认脚本或默认文件。 来源：`registration`、`configuration-definition`、`merge-default`、`implementation-0`、`df340-lua-h-init_worker_by_lua_block-no-script-consume`、`df340-lua-h-init_worker_by_lua_block-main-handler-members`。
- inheritance [not_applicable]：仅在 http 级配置，init_worker_by_lua_block、init_worker_by_lua、init_worker_by_lua_file 共用 main_conf 的 init_worker_handler/init_worker_src 槽，同族第二次配置按 handler 非空报重复；没有 server/location层级合并，不同生命周期使用不同槽。 来源：`registration`、`configuration-definition`、`merge-default`、`implementation-0`、`df340-lua-h-init_worker_by_lua_block-no-script-consume`、`df340-lua-h-init_worker_by_lua_block-main-handler-members`。

未设分支以整族为单位，不能把未写 block 误称为忽略同族 inline/file。父设置/子未设置与子显式设置无合法层级分支；同一 main 再定义是重复，不是覆盖。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:238–243（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:1294–1310（冻结基线保留）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1016–1043（冻结基线保留）。
- `implementation-0` → lua-nginx-module/`src/ngx_http_lua_directive.c`:1313–1361（冻结基线保留）。
- `df340-lua-h-init_worker_by_lua_block-no-script-consume` → lua-nginx-module/`src/ngx_http_lua_initworkerby.c`:78–86（新）。
- `df340-lua-h-init_worker_by_lua_block-main-handler-members` → lua-nginx-module/`src/ngx_http_lua_common.h`:249–255（新）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--init_worker_by_lua

组：C-main-lifecycle。目标字段：defaults、inheritance。

本 ID 注册 post=inline 加载器 → setter 检查同族 handler 后保存 init_worker_handler/init_worker_src → main pcalloc 零态 → 消费端以 handler 是否为空判断。

- defaults [verified]：未配置 init_worker_by_lua 族的任何输入形式时，main_conf 的 init_worker_handler 为 NULL、init_worker_src 为空，不运行本族用户脚本；没有默认脚本或默认文件。 来源：`registration`、`configuration-definition`、`merge-default`、`df340-lua-h-init_worker_by_lua-no-script-consume`、`df340-lua-h-init_worker_by_lua-main-handler-members`。
- inheritance [not_applicable]：仅在 http 级配置，init_worker_by_lua_block、init_worker_by_lua、init_worker_by_lua_file 共用 main_conf 的 init_worker_handler/init_worker_src 槽，同族第二次配置按 handler 非空报重复；没有 server/location层级合并，不同生命周期使用不同槽。 来源：`registration`、`configuration-definition`、`merge-default`、`df340-lua-h-init_worker_by_lua-no-script-consume`、`df340-lua-h-init_worker_by_lua-main-handler-members`。

未设分支以整族为单位，不能把未写 block 误称为忽略同族 inline/file。父设置/子未设置与子显式设置无合法层级分支；同一 main 再定义是重复，不是覆盖。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:245–250（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:1313–1361（冻结基线保留）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1016–1043（冻结基线保留）。
- `df340-lua-h-init_worker_by_lua-no-script-consume` → lua-nginx-module/`src/ngx_http_lua_initworkerby.c`:78–86（新）。
- `df340-lua-h-init_worker_by_lua-main-handler-members` → lua-nginx-module/`src/ngx_http_lua_common.h`:249–255（新）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--init_worker_by_lua_file

组：C-main-lifecycle。目标字段：defaults、inheritance。

本 ID 注册 post=file 加载器 → setter 检查同族 handler 后保存 init_worker_handler/init_worker_src → main pcalloc 零态 → 消费端以 handler 是否为空判断。

- defaults [verified]：未配置 init_worker_by_lua 族的任何输入形式时，main_conf 的 init_worker_handler 为 NULL、init_worker_src 为空，不运行本族用户脚本；没有默认脚本或默认文件。 来源：`registration`、`configuration-definition`、`merge-default`、`df340-lua-h-init_worker_by_lua_file-no-script-consume`、`df340-lua-h-init_worker_by_lua_file-main-handler-members`。
- inheritance [not_applicable]：仅在 http 级配置，init_worker_by_lua_block、init_worker_by_lua、init_worker_by_lua_file 共用 main_conf 的 init_worker_handler/init_worker_src 槽，同族第二次配置按 handler 非空报重复；没有 server/location层级合并，不同生命周期使用不同槽。 来源：`registration`、`configuration-definition`、`merge-default`、`df340-lua-h-init_worker_by_lua_file-no-script-consume`、`df340-lua-h-init_worker_by_lua_file-main-handler-members`。

未设分支以整族为单位，不能把未写 block 误称为忽略同族 inline/file。父设置/子未设置与子显式设置无合法层级分支；同一 main 再定义是重复，不是覆盖。此 file 入口配置时补全路径，不套用请求阶段 file 的 complex value 求值。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:252–257（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:1313–1361（冻结基线保留）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1016–1043（冻结基线保留）。
- `df340-lua-h-init_worker_by_lua_file-no-script-consume` → lua-nginx-module/`src/ngx_http_lua_initworkerby.c`:78–86（新）。
- `df340-lua-h-init_worker_by_lua_file-main-handler-members` → lua-nginx-module/`src/ngx_http_lua_common.h`:249–255（新）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--exit_worker_by_lua_block

组：C-main-lifecycle。目标字段：defaults、inheritance。

本 ID 注册 post=inline 加载器；block callback 委派专用 setter → setter 检查同族 handler 后保存 exit_worker_handler/exit_worker_src → main pcalloc 零态 → 消费端以 handler 是否为空判断。

- defaults [verified]：未配置 exit_worker_by_lua 族的任何输入形式时，main_conf 的 exit_worker_handler 为 NULL、exit_worker_src 为空，不运行本族用户脚本；没有默认脚本或默认文件。 来源：`registration`、`configuration-definition`、`merge-default`、`implementation-0`、`df340-lua-h-exit_worker_by_lua_block-no-script-consume`、`df340-lua-h-exit_worker_by_lua_block-main-handler-members`。
- inheritance [not_applicable]：仅在 http 级配置，exit_worker_by_lua_block、exit_worker_by_lua_file 共用 main_conf 的 exit_worker_handler/exit_worker_src 槽，同族第二次配置按 handler 非空报重复；没有 server/location层级合并，不同生命周期使用不同槽。 来源：`registration`、`configuration-definition`、`merge-default`、`implementation-0`、`df340-lua-h-exit_worker_by_lua_block-no-script-consume`、`df340-lua-h-exit_worker_by_lua_block-main-handler-members`。

未设分支以整族为单位，不能把未写 block 误称为忽略同族 inline/file。父设置/子未设置与子显式设置无合法层级分支；同一 main 再定义是重复，不是覆盖。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:259–264（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:1364–1380（冻结基线保留）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1016–1043（冻结基线保留）。
- `implementation-0` → lua-nginx-module/`src/ngx_http_lua_directive.c`:1383–1430（冻结基线保留）。
- `df340-lua-h-exit_worker_by_lua_block-no-script-consume` → lua-nginx-module/`src/ngx_http_lua_exitworkerby.c`:34–48（新）。
- `df340-lua-h-exit_worker_by_lua_block-main-handler-members` → lua-nginx-module/`src/ngx_http_lua_common.h`:257–259（新）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--exit_worker_by_lua_file

组：C-main-lifecycle。目标字段：defaults、inheritance。

本 ID 注册 post=file 加载器 → setter 检查同族 handler 后保存 exit_worker_handler/exit_worker_src → main pcalloc 零态 → 消费端以 handler 是否为空判断。

- defaults [verified]：未配置 exit_worker_by_lua 族的任何输入形式时，main_conf 的 exit_worker_handler 为 NULL、exit_worker_src 为空，不运行本族用户脚本；没有默认脚本或默认文件。 来源：`registration`、`configuration-definition`、`merge-default`、`df340-lua-h-exit_worker_by_lua_file-no-script-consume`、`df340-lua-h-exit_worker_by_lua_file-main-handler-members`。
- inheritance [not_applicable]：仅在 http 级配置，exit_worker_by_lua_block、exit_worker_by_lua_file 共用 main_conf 的 exit_worker_handler/exit_worker_src 槽，同族第二次配置按 handler 非空报重复；没有 server/location层级合并，不同生命周期使用不同槽。 来源：`registration`、`configuration-definition`、`merge-default`、`df340-lua-h-exit_worker_by_lua_file-no-script-consume`、`df340-lua-h-exit_worker_by_lua_file-main-handler-members`。

未设分支以整族为单位，不能把未写 block 误称为忽略同族 inline/file。父设置/子未设置与子显式设置无合法层级分支；同一 main 再定义是重复，不是覆盖。此 file 入口配置时补全路径，不套用请求阶段 file 的 complex value 求值。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:266–271（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:1383–1430（冻结基线保留）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1016–1043（冻结基线保留）。
- `df340-lua-h-exit_worker_by_lua_file-no-script-consume` → lua-nginx-module/`src/ngx_http_lua_exitworkerby.c`:34–48（新）。
- `df340-lua-h-exit_worker_by_lua_file-main-handler-members` → lua-nginx-module/`src/ngx_http_lua_common.h`:257–259（新）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--set_by_lua_block

组：F-ndk-actions。目标字段：defaults、inheritance。

本ID post=ngx_http_lua_filter_set_by_lua_inline；block专用解析后调用set_by_lua → filter NDK_SET_VAR_MULTI_VALUE_DATA → ndk_set_var_multi_value_core → 取得rewrite loc_conf → 追加输入求值、filter调用和赋值codes → rewrite handler执行当前数组。

- defaults [verified]：未配置本项时不向当前 rewrite codes 编译相应 Lua 求值与目标变量赋值动作；没有默认脚本、默认文件或固定变量输出值。其他变量声明/赋值或server阶段已经产生的值不由本项缺省决定。 来源：`registration`、`configuration-definition`、`implementation-0`、`df340-lua-h-set_by_lua_block-ndk-rewrite-conf`、`df340-lua-h-set_by_lua_block-ndk-filter-code`、`df340-lua-h-set_by_lua_block-ndk-assign-code`、`df340-lua-h-set_by_lua_block-ndk-multi-value`、`df340-lua-h-set_by_lua_block-rewrite-create-merge`、`df340-lua-h-set_by_lua_block-rewrite-consume`、`df340-lua-h-set_by_lua_block-rewrite-two-phases`、`df340-lua-h-set_by_lua_block-if-shared-codes`。
- inheritance [verified]：这是 NDK 编译到 ngx_http_rewrite_module 当前 loc_conf.codes 的动作，不使用 Lua rewrite/access/content handler 的继承槽。rewrite merge 在子 codes 为NULL时直接返回，不把父 codes 复制给子location；子动作只编入自己的代码序列。server级动作可在SERVER_REWRITE阶段执行，不能称为location继承；if内部编入外层同一codes数组是条件动作编译，不是普通父子参数合并。 来源：`registration`、`configuration-definition`、`implementation-0`、`df340-lua-h-set_by_lua_block-ndk-rewrite-conf`、`df340-lua-h-set_by_lua_block-ndk-filter-code`、`df340-lua-h-set_by_lua_block-ndk-assign-code`、`df340-lua-h-set_by_lua_block-ndk-multi-value`、`df340-lua-h-set_by_lua_block-rewrite-create-merge`、`df340-lua-h-set_by_lua_block-rewrite-consume`、`df340-lua-h-set_by_lua_block-rewrite-two-phases`、`df340-lua-h-set_by_lua_block-if-shared-codes`。

inline/block脚本保存在filter_data.script；支持的目标及额外参数来自本ID注册和setter，不等同另一输入形式的语法。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:275–281（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:266–282（冻结基线保留）。
- `implementation-0` → lua-nginx-module/`src/ngx_http_lua_directive.c`:285–338（冻结基线保留）。
- `df340-lua-h-set_by_lua_block-ndk-rewrite-conf` → ngx_devel_kit/`src/ndk_set_var.c`:256–304（新）。
- `df340-lua-h-set_by_lua_block-ndk-filter-code` → ngx_devel_kit/`src/ndk_set_var.c`:408–422（新）。
- `df340-lua-h-set_by_lua_block-ndk-assign-code` → ngx_devel_kit/`src/ndk_set_var.c`:449–488（新）。
- `df340-lua-h-set_by_lua_block-ndk-multi-value` → ngx_devel_kit/`src/ndk_set_var.c`:532–555（新）。
- `df340-lua-h-set_by_lua_block-rewrite-create-merge` → nginx/`src/http/modules/ngx_http_rewrite_module.c`:221–268（新）。
- `df340-lua-h-set_by_lua_block-rewrite-consume` → nginx/`src/http/modules/ngx_http_rewrite_module.c`:136–184（新）。
- `df340-lua-h-set_by_lua_block-rewrite-two-phases` → nginx/`src/http/modules/ngx_http_rewrite_module.c`:271–294（新）。
- `df340-lua-h-set_by_lua_block-if-shared-codes` → nginx/`src/http/modules/ngx_http_rewrite_module.c`:604–641（新）。

补丁核对：NDK固定发行579–582无直接patch；ngx_http_rewrite_module.c未被34条有效Nginx补丁修改。新增来源只论证NDK动作与rewrite数组关系，不把全局变量表、父server阶段先执行和Lua loc handler槽混成继承。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--set_by_lua

组：F-ndk-actions。目标字段：defaults、inheritance。

本ID post=ngx_http_lua_filter_set_by_lua_inline → filter NDK_SET_VAR_MULTI_VALUE_DATA → ndk_set_var_multi_value_core → 取得rewrite loc_conf → 追加输入求值、filter调用和赋值codes → rewrite handler执行当前数组。

- defaults [verified]：未配置本项时不向当前 rewrite codes 编译相应 Lua 求值与目标变量赋值动作；没有默认脚本、默认文件或固定变量输出值。其他变量声明/赋值或server阶段已经产生的值不由本项缺省决定。 来源：`registration`、`configuration-definition`、`df340-lua-h-set_by_lua-ndk-rewrite-conf`、`df340-lua-h-set_by_lua-ndk-filter-code`、`df340-lua-h-set_by_lua-ndk-assign-code`、`df340-lua-h-set_by_lua-ndk-multi-value`、`df340-lua-h-set_by_lua-rewrite-create-merge`、`df340-lua-h-set_by_lua-rewrite-consume`、`df340-lua-h-set_by_lua-rewrite-two-phases`、`df340-lua-h-set_by_lua-if-shared-codes`。
- inheritance [verified]：这是 NDK 编译到 ngx_http_rewrite_module 当前 loc_conf.codes 的动作，不使用 Lua rewrite/access/content handler 的继承槽。rewrite merge 在子 codes 为NULL时直接返回，不把父 codes 复制给子location；子动作只编入自己的代码序列。server级动作可在SERVER_REWRITE阶段执行，不能称为location继承；if内部编入外层同一codes数组是条件动作编译，不是普通父子参数合并。 来源：`registration`、`configuration-definition`、`df340-lua-h-set_by_lua-ndk-rewrite-conf`、`df340-lua-h-set_by_lua-ndk-filter-code`、`df340-lua-h-set_by_lua-ndk-assign-code`、`df340-lua-h-set_by_lua-ndk-multi-value`、`df340-lua-h-set_by_lua-rewrite-create-merge`、`df340-lua-h-set_by_lua-rewrite-consume`、`df340-lua-h-set_by_lua-rewrite-two-phases`、`df340-lua-h-set_by_lua-if-shared-codes`。

inline/block脚本保存在filter_data.script；支持的目标及额外参数来自本ID注册和setter，不等同另一输入形式的语法。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:284–290（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:285–338（冻结基线保留）。
- `df340-lua-h-set_by_lua-ndk-rewrite-conf` → ngx_devel_kit/`src/ndk_set_var.c`:256–304（新）。
- `df340-lua-h-set_by_lua-ndk-filter-code` → ngx_devel_kit/`src/ndk_set_var.c`:408–422（新）。
- `df340-lua-h-set_by_lua-ndk-assign-code` → ngx_devel_kit/`src/ndk_set_var.c`:449–488（新）。
- `df340-lua-h-set_by_lua-ndk-multi-value` → ngx_devel_kit/`src/ndk_set_var.c`:532–555（新）。
- `df340-lua-h-set_by_lua-rewrite-create-merge` → nginx/`src/http/modules/ngx_http_rewrite_module.c`:221–268（新）。
- `df340-lua-h-set_by_lua-rewrite-consume` → nginx/`src/http/modules/ngx_http_rewrite_module.c`:136–184（新）。
- `df340-lua-h-set_by_lua-rewrite-two-phases` → nginx/`src/http/modules/ngx_http_rewrite_module.c`:271–294（新）。
- `df340-lua-h-set_by_lua-if-shared-codes` → nginx/`src/http/modules/ngx_http_rewrite_module.c`:604–641（新）。

补丁核对：NDK固定发行579–582无直接patch；ngx_http_rewrite_module.c未被34条有效Nginx补丁修改。新增来源只论证NDK动作与rewrite数组关系，不把全局变量表、父server阶段先执行和Lua loc handler槽混成继承。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--set_by_lua_file

组：F-ndk-actions。目标字段：defaults、inheritance。

本ID post=ngx_http_lua_filter_set_by_lua_file → filter NDK_SET_VAR_MULTI_VALUE_DATA → ndk_set_var_multi_value_core → 取得rewrite loc_conf → 追加输入求值、filter调用和赋值codes → rewrite handler执行当前数组。

- defaults [verified]：未配置本项时不向当前 rewrite codes 编译相应 Lua 求值与目标变量赋值动作；没有默认脚本、默认文件或固定变量输出值。其他变量声明/赋值或server阶段已经产生的值不由本项缺省决定。 来源：`registration`、`configuration-definition`、`df340-lua-h-set_by_lua_file-ndk-rewrite-conf`、`df340-lua-h-set_by_lua_file-ndk-filter-code`、`df340-lua-h-set_by_lua_file-ndk-assign-code`、`df340-lua-h-set_by_lua_file-ndk-multi-value`、`df340-lua-h-set_by_lua_file-rewrite-create-merge`、`df340-lua-h-set_by_lua_file-rewrite-consume`、`df340-lua-h-set_by_lua_file-rewrite-two-phases`、`df340-lua-h-set_by_lua_file-if-shared-codes`。
- inheritance [verified]：这是 NDK 编译到 ngx_http_rewrite_module 当前 loc_conf.codes 的动作，不使用 Lua rewrite/access/content handler 的继承槽。rewrite merge 在子 codes 为NULL时直接返回，不把父 codes 复制给子location；子动作只编入自己的代码序列。server级动作可在SERVER_REWRITE阶段执行，不能称为location继承；if内部编入外层同一codes数组是条件动作编译，不是普通父子参数合并。 来源：`registration`、`configuration-definition`、`df340-lua-h-set_by_lua_file-ndk-rewrite-conf`、`df340-lua-h-set_by_lua_file-ndk-filter-code`、`df340-lua-h-set_by_lua_file-ndk-assign-code`、`df340-lua-h-set_by_lua_file-ndk-multi-value`、`df340-lua-h-set_by_lua_file-rewrite-create-merge`、`df340-lua-h-set_by_lua_file-rewrite-consume`、`df340-lua-h-set_by_lua_file-rewrite-two-phases`、`df340-lua-h-set_by_lua_file-if-shared-codes`。

file路径先编译complex value，作为NDK输入在请求阶段求值；不同于生命周期/SSL/balancer的固定路径入口。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:293–299（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:341–400（冻结基线保留）。
- `df340-lua-h-set_by_lua_file-ndk-rewrite-conf` → ngx_devel_kit/`src/ndk_set_var.c`:256–304（新）。
- `df340-lua-h-set_by_lua_file-ndk-filter-code` → ngx_devel_kit/`src/ndk_set_var.c`:408–422（新）。
- `df340-lua-h-set_by_lua_file-ndk-assign-code` → ngx_devel_kit/`src/ndk_set_var.c`:449–488（新）。
- `df340-lua-h-set_by_lua_file-ndk-multi-value` → ngx_devel_kit/`src/ndk_set_var.c`:532–555（新）。
- `df340-lua-h-set_by_lua_file-rewrite-create-merge` → nginx/`src/http/modules/ngx_http_rewrite_module.c`:221–268（新）。
- `df340-lua-h-set_by_lua_file-rewrite-consume` → nginx/`src/http/modules/ngx_http_rewrite_module.c`:136–184（新）。
- `df340-lua-h-set_by_lua_file-rewrite-two-phases` → nginx/`src/http/modules/ngx_http_rewrite_module.c`:271–294（新）。
- `df340-lua-h-set_by_lua_file-if-shared-codes` → nginx/`src/http/modules/ngx_http_rewrite_module.c`:604–641（新）。

补丁核对：NDK固定发行579–582无直接patch；ngx_http_rewrite_module.c未被34条有效Nginx补丁修改。新增来源只论证NDK动作与rewrite数组关系，不把全局变量表、父server阶段先执行和Lua loc handler槽混成继承。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--server_rewrite_by_lua_block

组：E-http-server-rewrite。目标字段：defaults、inheritance。

本ID注册 SRV_CONF_OFFSET（允许http/server）→ block委派或file setter → srv.server_rewrite_src/handler → create_srv零态 → 独立merge_srv → server-rewrite阶段读取srv_conf。

- defaults [verified]：本层未配置且未从父级继承到 server_rewrite_by_lua 族时，srv.server_rewrite_handler 为 NULL，无默认 server-rewrite 脚本或文件，该 Lua 阶段入口返回 NGX_DECLINED。 来源：`registration`、`configuration-definition`、`implementation-0`、`df340-lua-h-server_rewrite_by_lua_block-create-srv`、`merge-default`、`implementation-3`、`df340-lua-h-server_rewrite_by_lua_block-no-script-consume`、`df340-lua-h-server_rewrite_by_lua_block-server-hierarchy`。
- inheritance [verified]：http 级保存 srv 默认对象，合并到 server 时若子 srv.server_rewrite_src.value.len 为0，复制父级本族源码/复杂值、handler、缓存ref/key和chunkname。server显式配置任一种形式整体替换本族槽；同层重复或空脚本拒绝。location共享其server的srv_conf，不另做location继承；此槽与 loc_conf 的 rewrite_by_lua 槽独立。 来源：`registration`、`configuration-definition`、`implementation-0`、`df340-lua-h-server_rewrite_by_lua_block-create-srv`、`merge-default`、`implementation-3`、`df340-lua-h-server_rewrite_by_lua_block-no-script-consume`、`df340-lua-h-server_rewrite_by_lua_block-server-hierarchy`。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:303–308（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:594–609（冻结基线保留）。
- `implementation-0` → lua-nginx-module/`src/ngx_http_lua_directive.c`:612–696（冻结基线保留）。
- `df340-lua-h-server_rewrite_by_lua_block-create-srv` → lua-nginx-module/`src/ngx_http_lua_module.c`:1170–1217（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1364–1371（冻结基线保留）。
- `implementation-3` → lua-nginx-module/`src/ngx_http_lua_module.c`:801–809（冻结基线保留）。
- `df340-lua-h-server_rewrite_by_lua_block-no-script-consume` → lua-nginx-module/`src/ngx_http_lua_server_rewriteby.c`:40–47（新）。
- `df340-lua-h-server_rewrite_by_lua_block-server-hierarchy` → nginx/`src/http/ngx_http.c`:577–589（新）。

补丁核对：新增ngx_http.c层级片段没有有效补丁修改；Lua srv setter/merge及消费无直接组件补丁，不由此扩大阶段执行或全模块补丁结论。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--server_rewrite_by_lua_file

组：E-http-server-rewrite。目标字段：defaults、inheritance。

本ID注册 SRV_CONF_OFFSET（允许http/server）→ block委派或file setter → srv.server_rewrite_src/handler → create_srv零态 → 独立merge_srv → server-rewrite阶段读取srv_conf。

- defaults [verified]：本层未配置且未从父级继承到 server_rewrite_by_lua 族时，srv.server_rewrite_handler 为 NULL，无默认 server-rewrite 脚本或文件，该 Lua 阶段入口返回 NGX_DECLINED。 来源：`registration`、`configuration-definition`、`df340-lua-h-server_rewrite_by_lua_file-create-srv`、`merge-default`、`implementation-1`、`df340-lua-h-server_rewrite_by_lua_file-no-script-consume`、`df340-lua-h-server_rewrite_by_lua_file-server-hierarchy`。
- inheritance [verified]：http 级保存 srv 默认对象，合并到 server 时若子 srv.server_rewrite_src.value.len 为0，复制父级本族源码/复杂值、handler、缓存ref/key和chunkname。server显式配置任一种形式整体替换本族槽；同层重复或空脚本拒绝。location共享其server的srv_conf，不另做location继承；此槽与 loc_conf 的 rewrite_by_lua 槽独立。 来源：`registration`、`configuration-definition`、`df340-lua-h-server_rewrite_by_lua_file-create-srv`、`merge-default`、`implementation-1`、`df340-lua-h-server_rewrite_by_lua_file-no-script-consume`、`df340-lua-h-server_rewrite_by_lua_file-server-hierarchy`。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:311–316（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:612–696（冻结基线保留）。
- `df340-lua-h-server_rewrite_by_lua_file-create-srv` → lua-nginx-module/`src/ngx_http_lua_module.c`:1170–1217（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1364–1371（冻结基线保留）。
- `implementation-1` → lua-nginx-module/`src/ngx_http_lua_module.c`:801–809（冻结基线保留）。
- `df340-lua-h-server_rewrite_by_lua_file-no-script-consume` → lua-nginx-module/`src/ngx_http_lua_server_rewriteby.c`:40–47（新）。
- `df340-lua-h-server_rewrite_by_lua_file-server-hierarchy` → nginx/`src/http/ngx_http.c`:577–589（新）。

补丁核对：新增ngx_http.c层级片段没有有效补丁修改；Lua srv setter/merge及消费无直接组件补丁，不由此扩大阶段执行或全模块补丁结论。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--rewrite_by_lua

组：E-http-phase。目标字段：defaults、inheritance。

本 ID 的 post=inline加载器 → setter写 rewrite_src/rewrite_handler → create零态 → 专属阶段 merge → 当前请求 loc_conf 的空handler/执行分支。

- defaults [verified]：本层未配置且未从父级继承到 rewrite_by_lua 族任一种形式时，没有本阶段用户 Lua 脚本，rewrite_handler 保持 NULL；不生成默认脚本或默认文件。 来源：`registration`、`configuration-definition`、`df340-lua-h-rewrite_by_lua-create-loc`、`merge-default`、`df340-lua-h-rewrite_by_lua-no-handler-consume`、`df340-lua-h-rewrite_by_lua-hierarchy`、`implementation-1`。
- inheritance [verified]：对应 rewrite_src.value.len 为0时，子配置复制父级本阶段的源码/复杂值、handler、缓存 ref/key 和 chunkname；子级配置本族任一种非空输入形式时整体采用自己的本阶段槽，不与父脚本追加，也不改变其他阶段槽。同一层本族不同形式共用 handler，重复被拒绝，显式空脚本不是关闭方式。 来源：`registration`、`configuration-definition`、`df340-lua-h-rewrite_by_lua-create-loc`、`merge-default`、`df340-lua-h-rewrite_by_lua-no-handler-consume`、`df340-lua-h-rewrite_by_lua-hierarchy`、`implementation-1`。

inline/block 保存原始源码，不按 Nginx 请求变量求值。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:319–325（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:511–591（冻结基线保留）。
- `df340-lua-h-rewrite_by_lua-create-loc` → lua-nginx-module/`src/ngx_http_lua_module.c`:1378–1415（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1460–1466（冻结基线保留）。
- `df340-lua-h-rewrite_by_lua-no-handler-consume` → lua-nginx-module/`src/ngx_http_lua_rewriteby.c`:80–85（新）。
- `df340-lua-h-rewrite_by_lua-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `implementation-1` → lua-nginx-module/`src/ngx_http_lua_module.c`:811–818（冻结基线保留）。

补丁核对：新增公共层级源码 ngx_http.c 未被34条有效补丁修改；阶段 setter/create/merge 与空 handler 分支来自固定 HTTP Lua、无直接补丁。只核本阶段槽与挂接，不改变旧其他共享补丁判断。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--rewrite_by_lua_block

组：E-http-phase。目标字段：defaults、inheritance。

本 ID 的 post=inline加载器，block解析后委派专用setter → setter写 rewrite_src/rewrite_handler → create零态 → 专属阶段 merge → 当前请求 loc_conf 的空handler/执行分支。

- defaults [verified]：本层未配置且未从父级继承到 rewrite_by_lua 族任一种形式时，没有本阶段用户 Lua 脚本，rewrite_handler 保持 NULL；不生成默认脚本或默认文件。 来源：`registration`、`configuration-definition`、`implementation-0`、`df340-lua-h-rewrite_by_lua_block-create-loc`、`merge-default`、`df340-lua-h-rewrite_by_lua_block-no-handler-consume`、`df340-lua-h-rewrite_by_lua_block-hierarchy`、`implementation-3`。
- inheritance [verified]：对应 rewrite_src.value.len 为0时，子配置复制父级本阶段的源码/复杂值、handler、缓存 ref/key 和 chunkname；子级配置本族任一种非空输入形式时整体采用自己的本阶段槽，不与父脚本追加，也不改变其他阶段槽。同一层本族不同形式共用 handler，重复被拒绝，显式空脚本不是关闭方式。 来源：`registration`、`configuration-definition`、`implementation-0`、`df340-lua-h-rewrite_by_lua_block-create-loc`、`merge-default`、`df340-lua-h-rewrite_by_lua_block-no-handler-consume`、`df340-lua-h-rewrite_by_lua_block-hierarchy`、`implementation-3`。

inline/block 保存原始源码，不按 Nginx 请求变量求值。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:328–334（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:492–508（冻结基线保留）。
- `implementation-0` → lua-nginx-module/`src/ngx_http_lua_directive.c`:511–591（冻结基线保留）。
- `df340-lua-h-rewrite_by_lua_block-create-loc` → lua-nginx-module/`src/ngx_http_lua_module.c`:1378–1415（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1460–1466（冻结基线保留）。
- `df340-lua-h-rewrite_by_lua_block-no-handler-consume` → lua-nginx-module/`src/ngx_http_lua_rewriteby.c`:80–85（新）。
- `df340-lua-h-rewrite_by_lua_block-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `implementation-3` → lua-nginx-module/`src/ngx_http_lua_module.c`:811–818（冻结基线保留）。

补丁核对：新增公共层级源码 ngx_http.c 未被34条有效补丁修改；阶段 setter/create/merge 与空 handler 分支来自固定 HTTP Lua、无直接补丁。只核本阶段槽与挂接，不改变旧其他共享补丁判断。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--access_by_lua

组：E-http-phase。目标字段：defaults、inheritance。

本 ID 的 post=inline加载器 → setter写 access_src/access_handler → create零态 → 专属阶段 merge → 当前请求 loc_conf 的空handler/执行分支。

- defaults [verified]：本层未配置且未从父级继承到 access_by_lua 族任一种形式时，没有本阶段用户 Lua 脚本，access_handler 保持 NULL；不生成默认脚本或默认文件。 来源：`registration`、`configuration-definition`、`df340-lua-h-access_by_lua-create-loc`、`merge-default`、`df340-lua-h-access_by_lua-no-handler-consume`、`df340-lua-h-access_by_lua-hierarchy`、`implementation-1`。
- inheritance [verified]：对应 access_src.value.len 为0时，子配置复制父级本阶段的源码/复杂值、handler、缓存 ref/key 和 chunkname；子级配置本族任一种非空输入形式时整体采用自己的本阶段槽，不与父脚本追加，也不改变其他阶段槽。同一层本族不同形式共用 handler，重复被拒绝，显式空脚本不是关闭方式。 来源：`registration`、`configuration-definition`、`df340-lua-h-access_by_lua-create-loc`、`merge-default`、`df340-lua-h-access_by_lua-no-handler-consume`、`df340-lua-h-access_by_lua-hierarchy`、`implementation-1`。

inline/block 保存原始源码，不按 Nginx 请求变量求值。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:337–343（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:718–798（冻结基线保留）。
- `df340-lua-h-access_by_lua-create-loc` → lua-nginx-module/`src/ngx_http_lua_module.c`:1378–1415（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1468–1474（冻结基线保留）。
- `df340-lua-h-access_by_lua-no-handler-consume` → lua-nginx-module/`src/ngx_http_lua_accessby.c`:78–83（新）。
- `df340-lua-h-access_by_lua-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `implementation-1` → lua-nginx-module/`src/ngx_http_lua_module.c`:820–827（冻结基线保留）。

补丁核对：新增公共层级源码 ngx_http.c 未被34条有效补丁修改；阶段 setter/create/merge 与空 handler 分支来自固定 HTTP Lua、无直接补丁。只核本阶段槽与挂接，不改变旧其他共享补丁判断。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--access_by_lua_block

组：E-http-phase。目标字段：defaults、inheritance。

本 ID 的 post=inline加载器，block解析后委派专用setter → setter写 access_src/access_handler → create零态 → 专属阶段 merge → 当前请求 loc_conf 的空handler/执行分支。

- defaults [verified]：本层未配置且未从父级继承到 access_by_lua 族任一种形式时，没有本阶段用户 Lua 脚本，access_handler 保持 NULL；不生成默认脚本或默认文件。 来源：`registration`、`configuration-definition`、`df340-lua-h-access_by_lua_block-phase-setter`、`df340-lua-h-access_by_lua_block-create-loc`、`df340-lua-h-access_by_lua_block-phase-merge`、`df340-lua-h-access_by_lua_block-no-handler-consume`、`df340-lua-h-access_by_lua_block-hierarchy`、`df340-lua-h-access_by_lua_block-phase-install`。
- inheritance [verified]：对应 access_src.value.len 为0时，子配置复制父级本阶段的源码/复杂值、handler、缓存 ref/key 和 chunkname；子级配置本族任一种非空输入形式时整体采用自己的本阶段槽，不与父脚本追加，也不改变其他阶段槽。同一层本族不同形式共用 handler，重复被拒绝，显式空脚本不是关闭方式。 来源：`registration`、`configuration-definition`、`df340-lua-h-access_by_lua_block-phase-setter`、`df340-lua-h-access_by_lua_block-create-loc`、`df340-lua-h-access_by_lua_block-phase-merge`、`df340-lua-h-access_by_lua_block-no-handler-consume`、`df340-lua-h-access_by_lua_block-hierarchy`、`df340-lua-h-access_by_lua_block-phase-install`。

inline/block 保存原始源码，不按 Nginx 请求变量求值。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:346–352（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:700–739（冻结基线保留）。
- `df340-lua-h-access_by_lua_block-phase-setter` → lua-nginx-module/`src/ngx_http_lua_directive.c`:718–798（新）。
- `df340-lua-h-access_by_lua_block-create-loc` → lua-nginx-module/`src/ngx_http_lua_module.c`:1378–1415（新）。
- `df340-lua-h-access_by_lua_block-phase-merge` → lua-nginx-module/`src/ngx_http_lua_module.c`:1468–1474（新）。
- `df340-lua-h-access_by_lua_block-no-handler-consume` → lua-nginx-module/`src/ngx_http_lua_accessby.c`:78–83（新）。
- `df340-lua-h-access_by_lua_block-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `df340-lua-h-access_by_lua_block-phase-install` → lua-nginx-module/`src/ngx_http_lua_module.c`:820–827（新）。

补丁核对：新增公共层级源码 ngx_http.c 未被34条有效补丁修改；阶段 setter/create/merge 与空 handler 分支来自固定 HTTP Lua、无直接补丁。只核本阶段槽与挂接，不改变旧其他共享补丁判断。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--content_by_lua

组：E-http-phase。目标字段：defaults、inheritance。

本 ID 的 post=inline加载器 → setter写 content_src/content_handler → create零态 → 专属阶段 merge → 当前请求 loc_conf 的空handler/执行分支。

- defaults [verified]：本层未配置且未从父级继承到 content_by_lua 族任一种形式时，没有本阶段用户 Lua 脚本，content_handler 保持 NULL；不生成默认脚本或默认文件。未显式配置本族时，不由本指令为当前 location 安装 core content handler。 来源：`registration`、`configuration-definition`、`df340-lua-h-content_by_lua-create-loc`、`merge-default`、`df340-lua-h-content_by_lua-no-handler-consume`、`df340-lua-h-content_by_lua-hierarchy`、`implementation-1`、`df340-lua-h-content_by_lua-core-create`、`df340-lua-h-content_by_lua-core-merge-full`、`df340-lua-h-content_by_lua-core-handler-select`、`df340-lua-h-content_by_lua-patch-no-error-pages`。
- inheritance [verified]：Lua loc_conf 的 content_src.value.len 为0时会复制父级 content 源码、handler、缓存 ref/key 和 chunkname；但 Nginx core 的 clcf->handler 不在 core merge 中继承，Lua merge 也不替子 location 安装它。因此不能把 Lua 槽复制解释为子 location 自动成为 Lua 内容处理器。只允许 location/location-if 配置；子级显式配置本族任一种形式才在该配置对象安装 core handler，并使用自己的整套 Lua 槽；同层本族重复或空脚本会拒绝。 来源：`registration`、`configuration-definition`、`df340-lua-h-content_by_lua-create-loc`、`merge-default`、`df340-lua-h-content_by_lua-no-handler-consume`、`df340-lua-h-content_by_lua-hierarchy`、`implementation-1`、`df340-lua-h-content_by_lua-core-create`、`df340-lua-h-content_by_lua-core-merge-full`、`df340-lua-h-content_by_lua-core-handler-select`、`df340-lua-h-content_by_lua-patch-no-error-pages`。

只选中父 location 自身与选中独立子 location 的 core loc_conf 不同；本结论不将请求沿用当前配置指针的情况误判为自动继承 handler，也不把 location-if 条件执行效果简化为无条件内容处理。

inline/block 保存原始源码，不按 Nginx 请求变量求值。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:355–360（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:820–910（冻结基线保留）。
- `df340-lua-h-content_by_lua-create-loc` → lua-nginx-module/`src/ngx_http_lua_module.c`:1378–1415（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1476–1482（冻结基线保留）。
- `df340-lua-h-content_by_lua-no-handler-consume` → lua-nginx-module/`src/ngx_http_lua_contentby.c`:167–172（新）。
- `df340-lua-h-content_by_lua-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `implementation-1` → lua-nginx-module/`src/ngx_http_lua_directive.c`:894–909（冻结基线保留）。
- `df340-lua-h-content_by_lua-core-create` → nginx/`src/http/ngx_http_core_module.c`:3548–3555（新）。
- `df340-lua-h-content_by_lua-core-merge-full` → nginx/`src/http/ngx_http_core_module.c`:3669–3954（新）。
- `df340-lua-h-content_by_lua-core-handler-select` → nginx/`src/http/ngx_http_core_module.c`:1381–1384（新）。
- `df340-lua-h-content_by_lua-patch-no-error-pages` → openresty/`patches/nginx-1.27.1-no_error_pages.patch`:1–91（新）。

补丁核对：新增 core-merge-full 的原文含 error_pages 分支，固定有效 no_error_pages 补丁确实改此分支（NULL→UNSET_PTR宏合并），不能把旧 verified_unaffected 的源码片段保持说法外推为新片段字节保持。已读完整补丁：它没有增加 clcf->handler 的创建/合并/传播；本条“Lua槽复制≠core handler继承”的事实不变。追加实际补丁来源，保留原 patch status/note；主整合若扩展 note 的覆盖范围，须明确上述新片段变化，不能宣称整段未受影响。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--content_by_lua_block

组：E-http-phase。目标字段：defaults、inheritance。

本 ID 的 post=inline加载器，block解析后委派专用setter → setter写 content_src/content_handler → create零态 → 专属阶段 merge → 当前请求 loc_conf 的空handler/执行分支。

- defaults [verified]：本层未配置且未从父级继承到 content_by_lua 族任一种形式时，没有本阶段用户 Lua 脚本，content_handler 保持 NULL；不生成默认脚本或默认文件。未显式配置本族时，不由本指令为当前 location 安装 core content handler。 来源：`registration`、`configuration-definition`、`df340-lua-h-content_by_lua_block-phase-setter`、`df340-lua-h-content_by_lua_block-create-loc`、`df340-lua-h-content_by_lua_block-phase-merge`、`df340-lua-h-content_by_lua_block-no-handler-consume`、`df340-lua-h-content_by_lua_block-hierarchy`、`df340-lua-h-content_by_lua_block-core-handler-install`、`df340-lua-h-content_by_lua_block-core-create`、`df340-lua-h-content_by_lua_block-core-merge-full`、`df340-lua-h-content_by_lua_block-core-handler-select`、`df340-lua-h-content_by_lua_block-patch-no-error-pages`。
- inheritance [verified]：Lua loc_conf 的 content_src.value.len 为0时会复制父级 content 源码、handler、缓存 ref/key 和 chunkname；但 Nginx core 的 clcf->handler 不在 core merge 中继承，Lua merge 也不替子 location 安装它。因此不能把 Lua 槽复制解释为子 location 自动成为 Lua 内容处理器。只允许 location/location-if 配置；子级显式配置本族任一种形式才在该配置对象安装 core handler，并使用自己的整套 Lua 槽；同层本族重复或空脚本会拒绝。 来源：`registration`、`configuration-definition`、`df340-lua-h-content_by_lua_block-phase-setter`、`df340-lua-h-content_by_lua_block-create-loc`、`df340-lua-h-content_by_lua_block-phase-merge`、`df340-lua-h-content_by_lua_block-no-handler-consume`、`df340-lua-h-content_by_lua_block-hierarchy`、`df340-lua-h-content_by_lua_block-core-handler-install`、`df340-lua-h-content_by_lua_block-core-create`、`df340-lua-h-content_by_lua_block-core-merge-full`、`df340-lua-h-content_by_lua_block-core-handler-select`、`df340-lua-h-content_by_lua_block-patch-no-error-pages`。

只选中父 location 自身与选中独立子 location 的 core loc_conf 不同；本结论不将请求沿用当前配置指针的情况误判为自动继承 handler，也不把 location-if 条件执行效果简化为无条件内容处理。

inline/block 保存原始源码，不按 Nginx 请求变量求值。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:363–368（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:802–841（冻结基线保留）。
- `df340-lua-h-content_by_lua_block-phase-setter` → lua-nginx-module/`src/ngx_http_lua_directive.c`:820–910（新）。
- `df340-lua-h-content_by_lua_block-create-loc` → lua-nginx-module/`src/ngx_http_lua_module.c`:1378–1415（新）。
- `df340-lua-h-content_by_lua_block-phase-merge` → lua-nginx-module/`src/ngx_http_lua_module.c`:1476–1482（新）。
- `df340-lua-h-content_by_lua_block-no-handler-consume` → lua-nginx-module/`src/ngx_http_lua_contentby.c`:167–172（新）。
- `df340-lua-h-content_by_lua_block-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `df340-lua-h-content_by_lua_block-core-handler-install` → lua-nginx-module/`src/ngx_http_lua_directive.c`:894–909（新）。
- `df340-lua-h-content_by_lua_block-core-create` → nginx/`src/http/ngx_http_core_module.c`:3548–3555（新）。
- `df340-lua-h-content_by_lua_block-core-merge-full` → nginx/`src/http/ngx_http_core_module.c`:3669–3954（新）。
- `df340-lua-h-content_by_lua_block-core-handler-select` → nginx/`src/http/ngx_http_core_module.c`:1381–1384（新）。
- `df340-lua-h-content_by_lua_block-patch-no-error-pages` → openresty/`patches/nginx-1.27.1-no_error_pages.patch`:1–91（新）。

补丁核对：新增 core-merge-full 的原文含 error_pages 分支，固定有效 no_error_pages 补丁确实改此分支（NULL→UNSET_PTR宏合并），不能把旧 verified_unaffected 的源码片段保持说法外推为新片段字节保持。已读完整补丁：它没有增加 clcf->handler 的创建/合并/传播；本条“Lua槽复制≠core handler继承”的事实不变。追加实际补丁来源，保留原 patch status/note；主整合若扩展 note 的覆盖范围，须明确上述新片段变化，不能宣称整段未受影响。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--log_by_lua

组：E-http-phase。目标字段：defaults、inheritance。

本 ID 的 post=inline加载器 → setter写 log_src/log_handler → create零态 → 专属阶段 merge → 当前请求 loc_conf 的空handler/执行分支。

- defaults [verified]：本层未配置且未从父级继承到 log_by_lua 族任一种形式时，没有本阶段用户 Lua 脚本，log_handler 保持 NULL；不生成默认脚本或默认文件。 来源：`registration`、`configuration-definition`、`df340-lua-h-log_by_lua-create-loc`、`merge-default`、`df340-lua-h-log_by_lua-no-handler-consume`、`df340-lua-h-log_by_lua-hierarchy`、`implementation-1`。
- inheritance [verified]：对应 log_src.value.len 为0时，子配置复制父级本阶段的源码/复杂值、handler、缓存 ref/key 和 chunkname；子级配置本族任一种非空输入形式时整体采用自己的本阶段槽，不与父脚本追加，也不改变其他阶段槽。同一层本族不同形式共用 handler，重复被拒绝，显式空脚本不是关闭方式。 来源：`registration`、`configuration-definition`、`df340-lua-h-log_by_lua-create-loc`、`merge-default`、`df340-lua-h-log_by_lua-no-handler-consume`、`df340-lua-h-log_by_lua-hierarchy`、`implementation-1`。

inline/block 保存原始源码，不按 Nginx 请求变量求值。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:371–377（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:932–1011（冻结基线保留）。
- `df340-lua-h-log_by_lua-create-loc` → lua-nginx-module/`src/ngx_http_lua_module.c`:1378–1415（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1484–1490（冻结基线保留）。
- `df340-lua-h-log_by_lua-no-handler-consume` → lua-nginx-module/`src/ngx_http_lua_logby.c`:114–119（新）。
- `df340-lua-h-log_by_lua-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `implementation-1` → lua-nginx-module/`src/ngx_http_lua_module.c`:831–845（冻结基线保留）。

补丁核对：新增公共层级源码 ngx_http.c 未被34条有效补丁修改；阶段 setter/create/merge 与空 handler 分支来自固定 HTTP Lua、无直接补丁。只核本阶段槽与挂接，不改变旧其他共享补丁判断。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--log_by_lua_block

组：E-http-phase。目标字段：defaults、inheritance。

本 ID 的 post=inline加载器，block解析后委派专用setter → setter写 log_src/log_handler → create零态 → 专属阶段 merge → 当前请求 loc_conf 的空handler/执行分支。

- defaults [verified]：本层未配置且未从父级继承到 log_by_lua 族任一种形式时，没有本阶段用户 Lua 脚本，log_handler 保持 NULL；不生成默认脚本或默认文件。 来源：`registration`、`configuration-definition`、`implementation-0`、`df340-lua-h-log_by_lua_block-create-loc`、`merge-default`、`df340-lua-h-log_by_lua_block-no-handler-consume`、`df340-lua-h-log_by_lua_block-hierarchy`、`implementation-3`。
- inheritance [verified]：对应 log_src.value.len 为0时，子配置复制父级本阶段的源码/复杂值、handler、缓存 ref/key 和 chunkname；子级配置本族任一种非空输入形式时整体采用自己的本阶段槽，不与父脚本追加，也不改变其他阶段槽。同一层本族不同形式共用 handler，重复被拒绝，显式空脚本不是关闭方式。 来源：`registration`、`configuration-definition`、`implementation-0`、`df340-lua-h-log_by_lua_block-create-loc`、`merge-default`、`df340-lua-h-log_by_lua_block-no-handler-consume`、`df340-lua-h-log_by_lua_block-hierarchy`、`implementation-3`。

inline/block 保存原始源码，不按 Nginx 请求变量求值。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:380–386（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:913–929（冻结基线保留）。
- `implementation-0` → lua-nginx-module/`src/ngx_http_lua_directive.c`:932–1011（冻结基线保留）。
- `df340-lua-h-log_by_lua_block-create-loc` → lua-nginx-module/`src/ngx_http_lua_module.c`:1378–1415（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1484–1490（冻结基线保留）。
- `df340-lua-h-log_by_lua_block-no-handler-consume` → lua-nginx-module/`src/ngx_http_lua_logby.c`:114–119（新）。
- `df340-lua-h-log_by_lua_block-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `implementation-3` → lua-nginx-module/`src/ngx_http_lua_module.c`:831–845（冻结基线保留）。

补丁核对：新增公共层级源码 ngx_http.c 未被34条有效补丁修改；阶段 setter/create/merge 与空 handler 分支来自固定 HTTP Lua、无直接补丁。只核本阶段槽与挂接，不改变旧其他共享补丁判断。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--rewrite_by_lua_file

组：E-http-phase。目标字段：defaults、inheritance。

本 ID 的 post=file加载器 → setter写 rewrite_src/rewrite_handler → create零态 → 专属阶段 merge → 当前请求 loc_conf 的空handler/执行分支。

- defaults [verified]：本层未配置且未从父级继承到 rewrite_by_lua 族任一种形式时，没有本阶段用户 Lua 脚本，rewrite_handler 保持 NULL；不生成默认脚本或默认文件。 来源：`registration`、`configuration-definition`、`df340-lua-h-rewrite_by_lua_file-create-loc`、`merge-default`、`df340-lua-h-rewrite_by_lua_file-no-handler-consume`、`df340-lua-h-rewrite_by_lua_file-hierarchy`、`implementation-1`。
- inheritance [verified]：对应 rewrite_src.value.len 为0时，子配置复制父级本阶段的源码/复杂值、handler、缓存 ref/key 和 chunkname；子级配置本族任一种非空输入形式时整体采用自己的本阶段槽，不与父脚本追加，也不改变其他阶段槽。同一层本族不同形式共用 handler，重复被拒绝，显式空脚本不是关闭方式。 来源：`registration`、`configuration-definition`、`df340-lua-h-rewrite_by_lua_file-create-loc`、`merge-default`、`df340-lua-h-rewrite_by_lua_file-no-handler-consume`、`df340-lua-h-rewrite_by_lua_file-hierarchy`、`implementation-1`。

file 路径编译为 complex value；合并复制包含 lengths/values 的整套源码对象，不把变量路径当固定文件名。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:388–394（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:511–591（冻结基线保留）。
- `df340-lua-h-rewrite_by_lua_file-create-loc` → lua-nginx-module/`src/ngx_http_lua_module.c`:1378–1415（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1460–1466（冻结基线保留）。
- `df340-lua-h-rewrite_by_lua_file-no-handler-consume` → lua-nginx-module/`src/ngx_http_lua_rewriteby.c`:80–85（新）。
- `df340-lua-h-rewrite_by_lua_file-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `implementation-1` → lua-nginx-module/`src/ngx_http_lua_module.c`:811–818（冻结基线保留）。

补丁核对：新增公共层级源码 ngx_http.c 未被34条有效补丁修改；阶段 setter/create/merge 与空 handler 分支来自固定 HTTP Lua、无直接补丁。只核本阶段槽与挂接，不改变旧其他共享补丁判断。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--rewrite_by_lua_no_postpone

组：A-main-scalar。目标字段：inheritance。

注册限定 main → setter 写 postponed_to_rewrite_phase_end → create/init 设置初态及缺省 → 消费端读取同一 main_conf。父设置/子未设置与子显式覆盖均不是本指令合法配置分支。

- inheritance [not_applicable]：仅能在http级配置，写入本模块唯一 main_conf 的 postponed_to_rewrite_phase_end；server/location不创建该参数的独立槽，也不进行父子合并。首次阶段处理可能更新此 main 标志，不是子 location 覆盖。 来源：`registration`、`configuration-definition`、`df340-lua-h-rewrite_by_lua_no_postpone-create`、`merge-default`、`df340-lua-h-rewrite_by_lua_no_postpone-consume`。

未设置路径：HTTP init 所列缺省仅用于解释单层 main 配置；本批不改 manifest 外 defaults。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:396–401（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1026–1062（冻结基线保留）。
- `df340-lua-h-rewrite_by_lua_no_postpone-create` → lua-nginx-module/`src/ngx_http_lua_module.c`:1053–1054（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:791–793（冻结基线保留）。
- `df340-lua-h-rewrite_by_lua_no_postpone-consume` → lua-nginx-module/`src/ngx_http_lua_rewriteby.c`:41–78（新）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--access_by_lua_file

组：E-http-phase。目标字段：defaults、inheritance。

本 ID 的 post=file加载器 → setter写 access_src/access_handler → create零态 → 专属阶段 merge → 当前请求 loc_conf 的空handler/执行分支。

- defaults [verified]：本层未配置且未从父级继承到 access_by_lua 族任一种形式时，没有本阶段用户 Lua 脚本，access_handler 保持 NULL；不生成默认脚本或默认文件。 来源：`registration`、`configuration-definition`、`df340-lua-h-access_by_lua_file-create-loc`、`merge-default`、`df340-lua-h-access_by_lua_file-no-handler-consume`、`df340-lua-h-access_by_lua_file-hierarchy`、`implementation-1`。
- inheritance [verified]：对应 access_src.value.len 为0时，子配置复制父级本阶段的源码/复杂值、handler、缓存 ref/key 和 chunkname；子级配置本族任一种非空输入形式时整体采用自己的本阶段槽，不与父脚本追加，也不改变其他阶段槽。同一层本族不同形式共用 handler，重复被拒绝，显式空脚本不是关闭方式。 来源：`registration`、`configuration-definition`、`df340-lua-h-access_by_lua_file-create-loc`、`merge-default`、`df340-lua-h-access_by_lua_file-no-handler-consume`、`df340-lua-h-access_by_lua_file-hierarchy`、`implementation-1`。

file 路径编译为 complex value；合并复制包含 lengths/values 的整套源码对象，不把变量路径当固定文件名。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:403–409（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:718–798（冻结基线保留）。
- `df340-lua-h-access_by_lua_file-create-loc` → lua-nginx-module/`src/ngx_http_lua_module.c`:1378–1415（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1468–1474（冻结基线保留）。
- `df340-lua-h-access_by_lua_file-no-handler-consume` → lua-nginx-module/`src/ngx_http_lua_accessby.c`:78–83（新）。
- `df340-lua-h-access_by_lua_file-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `implementation-1` → lua-nginx-module/`src/ngx_http_lua_module.c`:820–827（冻结基线保留）。

补丁核对：新增公共层级源码 ngx_http.c 未被34条有效补丁修改；阶段 setter/create/merge 与空 handler 分支来自固定 HTTP Lua、无直接补丁。只核本阶段槽与挂接，不改变旧其他共享补丁判断。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--access_by_lua_no_postpone

组：A-main-scalar。目标字段：inheritance。

注册限定 main → setter 写 postponed_to_access_phase_end → create/init 设置初态及缺省 → 消费端读取同一 main_conf。父设置/子未设置与子显式覆盖均不是本指令合法配置分支。

- inheritance [not_applicable]：仅能在http级配置，写入本模块唯一 main_conf 的 postponed_to_access_phase_end；server/location不创建该参数的独立槽，也不进行父子合并。首次阶段处理可能更新此 main 标志，不是子 location 覆盖。 来源：`registration`、`configuration-definition`、`df340-lua-h-access_by_lua_no_postpone-create`、`merge-default`、`df340-lua-h-access_by_lua_no_postpone-consume`。

未设置路径：HTTP init 所列缺省仅用于解释单层 main 配置；本批不改 manifest 外 defaults。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:411–416（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1026–1062（冻结基线保留）。
- `df340-lua-h-access_by_lua_no_postpone-create` → lua-nginx-module/`src/ngx_http_lua_module.c`:1053–1054（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:795–797（冻结基线保留）。
- `df340-lua-h-access_by_lua_no_postpone-consume` → lua-nginx-module/`src/ngx_http_lua_accessby.c`:39–76（新）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--content_by_lua_file

组：E-http-phase。目标字段：defaults、inheritance。

本 ID 的 post=file加载器 → setter写 content_src/content_handler → create零态 → 专属阶段 merge → 当前请求 loc_conf 的空handler/执行分支。

- defaults [verified]：本层未配置且未从父级继承到 content_by_lua 族任一种形式时，没有本阶段用户 Lua 脚本，content_handler 保持 NULL；不生成默认脚本或默认文件。未显式配置本族时，不由本指令为当前 location 安装 core content handler。 来源：`registration`、`configuration-definition`、`df340-lua-h-content_by_lua_file-create-loc`、`merge-default`、`df340-lua-h-content_by_lua_file-no-handler-consume`、`df340-lua-h-content_by_lua_file-hierarchy`、`implementation-1`、`df340-lua-h-content_by_lua_file-core-create`、`df340-lua-h-content_by_lua_file-core-merge-full`、`df340-lua-h-content_by_lua_file-core-handler-select`、`df340-lua-h-content_by_lua_file-patch-no-error-pages`。
- inheritance [verified]：Lua loc_conf 的 content_src.value.len 为0时会复制父级 content 源码、handler、缓存 ref/key 和 chunkname；但 Nginx core 的 clcf->handler 不在 core merge 中继承，Lua merge 也不替子 location 安装它。因此不能把 Lua 槽复制解释为子 location 自动成为 Lua 内容处理器。只允许 location/location-if 配置；子级显式配置本族任一种形式才在该配置对象安装 core handler，并使用自己的整套 Lua 槽；同层本族重复或空脚本会拒绝。 来源：`registration`、`configuration-definition`、`df340-lua-h-content_by_lua_file-create-loc`、`merge-default`、`df340-lua-h-content_by_lua_file-no-handler-consume`、`df340-lua-h-content_by_lua_file-hierarchy`、`implementation-1`、`df340-lua-h-content_by_lua_file-core-create`、`df340-lua-h-content_by_lua_file-core-merge-full`、`df340-lua-h-content_by_lua_file-core-handler-select`、`df340-lua-h-content_by_lua_file-patch-no-error-pages`。

只选中父 location 自身与选中独立子 location 的 core loc_conf 不同；本结论不将请求沿用当前配置指针的情况误判为自动继承 handler，也不把 location-if 条件执行效果简化为无条件内容处理。

file 路径编译为 complex value；合并复制包含 lengths/values 的整套源码对象，不把变量路径当固定文件名。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:419–424（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:820–910（冻结基线保留）。
- `df340-lua-h-content_by_lua_file-create-loc` → lua-nginx-module/`src/ngx_http_lua_module.c`:1378–1415（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1476–1482（冻结基线保留）。
- `df340-lua-h-content_by_lua_file-no-handler-consume` → lua-nginx-module/`src/ngx_http_lua_contentby.c`:167–172（新）。
- `df340-lua-h-content_by_lua_file-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `implementation-1` → lua-nginx-module/`src/ngx_http_lua_directive.c`:894–909（冻结基线保留）。
- `df340-lua-h-content_by_lua_file-core-create` → nginx/`src/http/ngx_http_core_module.c`:3548–3555（新）。
- `df340-lua-h-content_by_lua_file-core-merge-full` → nginx/`src/http/ngx_http_core_module.c`:3669–3954（新）。
- `df340-lua-h-content_by_lua_file-core-handler-select` → nginx/`src/http/ngx_http_core_module.c`:1381–1384（新）。
- `df340-lua-h-content_by_lua_file-patch-no-error-pages` → openresty/`patches/nginx-1.27.1-no_error_pages.patch`:1–91（新）。

补丁核对：新增 core-merge-full 的原文含 error_pages 分支，固定有效 no_error_pages 补丁确实改此分支（NULL→UNSET_PTR宏合并），不能把旧 verified_unaffected 的源码片段保持说法外推为新片段字节保持。已读完整补丁：它没有增加 clcf->handler 的创建/合并/传播；本条“Lua槽复制≠core handler继承”的事实不变。追加实际补丁来源，保留原 patch status/note；主整合若扩展 note 的覆盖范围，须明确上述新片段变化，不能宣称整段未受影响。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--log_by_lua_file

组：E-http-phase。目标字段：defaults、inheritance。

本 ID 的 post=file加载器 → setter写 log_src/log_handler → create零态 → 专属阶段 merge → 当前请求 loc_conf 的空handler/执行分支。

- defaults [verified]：本层未配置且未从父级继承到 log_by_lua 族任一种形式时，没有本阶段用户 Lua 脚本，log_handler 保持 NULL；不生成默认脚本或默认文件。 来源：`registration`、`configuration-definition`、`df340-lua-h-log_by_lua_file-create-loc`、`merge-default`、`df340-lua-h-log_by_lua_file-no-handler-consume`、`df340-lua-h-log_by_lua_file-hierarchy`、`implementation-1`。
- inheritance [verified]：对应 log_src.value.len 为0时，子配置复制父级本阶段的源码/复杂值、handler、缓存 ref/key 和 chunkname；子级配置本族任一种非空输入形式时整体采用自己的本阶段槽，不与父脚本追加，也不改变其他阶段槽。同一层本族不同形式共用 handler，重复被拒绝，显式空脚本不是关闭方式。 来源：`registration`、`configuration-definition`、`df340-lua-h-log_by_lua_file-create-loc`、`merge-default`、`df340-lua-h-log_by_lua_file-no-handler-consume`、`df340-lua-h-log_by_lua_file-hierarchy`、`implementation-1`。

file 路径编译为 complex value；合并复制包含 lengths/values 的整套源码对象，不把变量路径当固定文件名。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:426–432（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:932–1011（冻结基线保留）。
- `df340-lua-h-log_by_lua_file-create-loc` → lua-nginx-module/`src/ngx_http_lua_module.c`:1378–1415（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1484–1490（冻结基线保留）。
- `df340-lua-h-log_by_lua_file-no-handler-consume` → lua-nginx-module/`src/ngx_http_lua_logby.c`:114–119（新）。
- `df340-lua-h-log_by_lua_file-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `implementation-1` → lua-nginx-module/`src/ngx_http_lua_module.c`:831–845（冻结基线保留）。

补丁核对：新增公共层级源码 ngx_http.c 未被34条有效补丁修改；阶段 setter/create/merge 与空 handler 分支来自固定 HTTP Lua、无直接补丁。只核本阶段槽与挂接，不改变旧其他共享补丁判断。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--header_filter_by_lua

组：E-http-phase。目标字段：defaults、inheritance。

本 ID 的 post=inline加载器 → setter写 header_filter_src/header_filter_handler → create零态 → 专属阶段 merge → 当前请求 loc_conf 的空handler/执行分支。

- defaults [verified]：本层未配置且未从父级继承到 header_filter_by_lua 族任一种形式时，没有本阶段用户 Lua 脚本，header_filter_handler 保持 NULL；不生成默认脚本或默认文件。 来源：`registration`、`configuration-definition`、`df340-lua-h-header_filter_by_lua-create-loc`、`merge-default`、`df340-lua-h-header_filter_by_lua-no-handler-consume`、`df340-lua-h-header_filter_by_lua-hierarchy`、`implementation-1`。
- inheritance [verified]：对应 header_filter_src.value.len 为0时，子配置复制父级本阶段的源码/复杂值、handler、缓存 ref/key 和 chunkname；子级配置本族任一种非空输入形式时整体采用自己的本阶段槽，不与父脚本追加，也不改变其他阶段槽。同一层本族不同形式共用 handler，重复被拒绝，显式空脚本不是关闭方式。 来源：`registration`、`configuration-definition`、`df340-lua-h-header_filter_by_lua-create-loc`、`merge-default`、`df340-lua-h-header_filter_by_lua-no-handler-consume`、`df340-lua-h-header_filter_by_lua-hierarchy`、`implementation-1`。

inline/block 保存原始源码，不按 Nginx 请求变量求值。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:435–441（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:1033–1111（冻结基线保留）。
- `df340-lua-h-header_filter_by_lua-create-loc` → lua-nginx-module/`src/ngx_http_lua_module.c`:1378–1415（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1492–1498（冻结基线保留）。
- `df340-lua-h-header_filter_by_lua-no-handler-consume` → lua-nginx-module/`src/ngx_http_lua_headerfilterby.c`:240–249（新）。
- `df340-lua-h-header_filter_by_lua-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `implementation-1` → lua-nginx-module/`src/ngx_http_lua_module.c`:847–852（冻结基线保留）。

补丁核对：新增公共层级源码 ngx_http.c 未被34条有效补丁修改；阶段 setter/create/merge 与空 handler 分支来自固定 HTTP Lua、无直接补丁。只核本阶段槽与挂接，不改变旧其他共享补丁判断。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--header_filter_by_lua_block

组：E-http-phase。目标字段：defaults、inheritance。

本 ID 的 post=inline加载器，block解析后委派专用setter → setter写 header_filter_src/header_filter_handler → create零态 → 专属阶段 merge → 当前请求 loc_conf 的空handler/执行分支。

- defaults [verified]：本层未配置且未从父级继承到 header_filter_by_lua 族任一种形式时，没有本阶段用户 Lua 脚本，header_filter_handler 保持 NULL；不生成默认脚本或默认文件。 来源：`registration`、`configuration-definition`、`implementation-0`、`df340-lua-h-header_filter_by_lua_block-create-loc`、`merge-default`、`df340-lua-h-header_filter_by_lua_block-no-handler-consume`、`df340-lua-h-header_filter_by_lua_block-hierarchy`、`implementation-3`。
- inheritance [verified]：对应 header_filter_src.value.len 为0时，子配置复制父级本阶段的源码/复杂值、handler、缓存 ref/key 和 chunkname；子级配置本族任一种非空输入形式时整体采用自己的本阶段槽，不与父脚本追加，也不改变其他阶段槽。同一层本族不同形式共用 handler，重复被拒绝，显式空脚本不是关闭方式。 来源：`registration`、`configuration-definition`、`implementation-0`、`df340-lua-h-header_filter_by_lua_block-create-loc`、`merge-default`、`df340-lua-h-header_filter_by_lua_block-no-handler-consume`、`df340-lua-h-header_filter_by_lua_block-hierarchy`、`implementation-3`。

inline/block 保存原始源码，不按 Nginx 请求变量求值。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:444–450（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:1014–1030（冻结基线保留）。
- `implementation-0` → lua-nginx-module/`src/ngx_http_lua_directive.c`:1033–1111（冻结基线保留）。
- `df340-lua-h-header_filter_by_lua_block-create-loc` → lua-nginx-module/`src/ngx_http_lua_module.c`:1378–1415（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1492–1498（冻结基线保留）。
- `df340-lua-h-header_filter_by_lua_block-no-handler-consume` → lua-nginx-module/`src/ngx_http_lua_headerfilterby.c`:240–249（新）。
- `df340-lua-h-header_filter_by_lua_block-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `implementation-3` → lua-nginx-module/`src/ngx_http_lua_module.c`:847–852（冻结基线保留）。

补丁核对：新增公共层级源码 ngx_http.c 未被34条有效补丁修改；阶段 setter/create/merge 与空 handler 分支来自固定 HTTP Lua、无直接补丁。只核本阶段槽与挂接，不改变旧其他共享补丁判断。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--header_filter_by_lua_file

组：E-http-phase。目标字段：defaults、inheritance。

本 ID 的 post=file加载器 → setter写 header_filter_src/header_filter_handler → create零态 → 专属阶段 merge → 当前请求 loc_conf 的空handler/执行分支。

- defaults [verified]：本层未配置且未从父级继承到 header_filter_by_lua 族任一种形式时，没有本阶段用户 Lua 脚本，header_filter_handler 保持 NULL；不生成默认脚本或默认文件。 来源：`registration`、`configuration-definition`、`df340-lua-h-header_filter_by_lua_file-create-loc`、`merge-default`、`df340-lua-h-header_filter_by_lua_file-no-handler-consume`、`df340-lua-h-header_filter_by_lua_file-hierarchy`、`implementation-1`。
- inheritance [verified]：对应 header_filter_src.value.len 为0时，子配置复制父级本阶段的源码/复杂值、handler、缓存 ref/key 和 chunkname；子级配置本族任一种非空输入形式时整体采用自己的本阶段槽，不与父脚本追加，也不改变其他阶段槽。同一层本族不同形式共用 handler，重复被拒绝，显式空脚本不是关闭方式。 来源：`registration`、`configuration-definition`、`df340-lua-h-header_filter_by_lua_file-create-loc`、`merge-default`、`df340-lua-h-header_filter_by_lua_file-no-handler-consume`、`df340-lua-h-header_filter_by_lua_file-hierarchy`、`implementation-1`。

file 路径编译为 complex value；合并复制包含 lengths/values 的整套源码对象，不把变量路径当固定文件名。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:452–458（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:1033–1111（冻结基线保留）。
- `df340-lua-h-header_filter_by_lua_file-create-loc` → lua-nginx-module/`src/ngx_http_lua_module.c`:1378–1415（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1492–1498（冻结基线保留）。
- `df340-lua-h-header_filter_by_lua_file-no-handler-consume` → lua-nginx-module/`src/ngx_http_lua_headerfilterby.c`:240–249（新）。
- `df340-lua-h-header_filter_by_lua_file-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `implementation-1` → lua-nginx-module/`src/ngx_http_lua_module.c`:847–852（冻结基线保留）。

补丁核对：新增公共层级源码 ngx_http.c 未被34条有效补丁修改；阶段 setter/create/merge 与空 handler 分支来自固定 HTTP Lua、无直接补丁。只核本阶段槽与挂接，不改变旧其他共享补丁判断。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--body_filter_by_lua

组：E-http-phase。目标字段：defaults、inheritance。

本 ID 的 post=inline加载器 → setter写 body_filter_src/body_filter_handler → create零态 → 专属阶段 merge → 当前请求 loc_conf 的空handler/执行分支。

- defaults [verified]：本层未配置且未从父级继承到 body_filter_by_lua 族任一种形式时，没有本阶段用户 Lua 脚本，body_filter_handler 保持 NULL；不生成默认脚本或默认文件。 来源：`registration`、`configuration-definition`、`df340-lua-h-body_filter_by_lua-create-loc`、`merge-default`、`df340-lua-h-body_filter_by_lua-no-handler-consume`、`df340-lua-h-body_filter_by_lua-hierarchy`、`implementation-1`。
- inheritance [verified]：对应 body_filter_src.value.len 为0时，子配置复制父级本阶段的源码/复杂值、handler、缓存 ref/key 和 chunkname；子级配置本族任一种非空输入形式时整体采用自己的本阶段槽，不与父脚本追加，也不改变其他阶段槽。同一层本族不同形式共用 handler，重复被拒绝，显式空脚本不是关闭方式。 来源：`registration`、`configuration-definition`、`df340-lua-h-body_filter_by_lua-create-loc`、`merge-default`、`df340-lua-h-body_filter_by_lua-no-handler-consume`、`df340-lua-h-body_filter_by_lua-hierarchy`、`implementation-1`。

inline/block 保存原始源码，不按 Nginx 请求变量求值。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:460–466（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:1133–1213（冻结基线保留）。
- `df340-lua-h-body_filter_by_lua-create-loc` → lua-nginx-module/`src/ngx_http_lua_module.c`:1378–1415（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1500–1506（冻结基线保留）。
- `df340-lua-h-body_filter_by_lua-no-handler-consume` → lua-nginx-module/`src/ngx_http_lua_bodyfilterby.c`:245–250（新）。
- `df340-lua-h-body_filter_by_lua-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `implementation-1` → lua-nginx-module/`src/ngx_http_lua_module.c`:854–859（冻结基线保留）。

补丁核对：新增公共层级源码 ngx_http.c 未被34条有效补丁修改；阶段 setter/create/merge 与空 handler 分支来自固定 HTTP Lua、无直接补丁。只核本阶段槽与挂接，不改变旧其他共享补丁判断。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--body_filter_by_lua_block

组：E-http-phase。目标字段：defaults、inheritance。

本 ID 的 post=inline加载器，block解析后委派专用setter → setter写 body_filter_src/body_filter_handler → create零态 → 专属阶段 merge → 当前请求 loc_conf 的空handler/执行分支。

- defaults [verified]：本层未配置且未从父级继承到 body_filter_by_lua 族任一种形式时，没有本阶段用户 Lua 脚本，body_filter_handler 保持 NULL；不生成默认脚本或默认文件。 来源：`registration`、`configuration-definition`、`implementation-0`、`df340-lua-h-body_filter_by_lua_block-create-loc`、`merge-default`、`df340-lua-h-body_filter_by_lua_block-no-handler-consume`、`df340-lua-h-body_filter_by_lua_block-hierarchy`、`implementation-3`。
- inheritance [verified]：对应 body_filter_src.value.len 为0时，子配置复制父级本阶段的源码/复杂值、handler、缓存 ref/key 和 chunkname；子级配置本族任一种非空输入形式时整体采用自己的本阶段槽，不与父脚本追加，也不改变其他阶段槽。同一层本族不同形式共用 handler，重复被拒绝，显式空脚本不是关闭方式。 来源：`registration`、`configuration-definition`、`implementation-0`、`df340-lua-h-body_filter_by_lua_block-create-loc`、`merge-default`、`df340-lua-h-body_filter_by_lua_block-no-handler-consume`、`df340-lua-h-body_filter_by_lua_block-hierarchy`、`implementation-3`。

inline/block 保存原始源码，不按 Nginx 请求变量求值。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:469–475（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:1114–1130（冻结基线保留）。
- `implementation-0` → lua-nginx-module/`src/ngx_http_lua_directive.c`:1133–1213（冻结基线保留）。
- `df340-lua-h-body_filter_by_lua_block-create-loc` → lua-nginx-module/`src/ngx_http_lua_module.c`:1378–1415（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1500–1506（冻结基线保留）。
- `df340-lua-h-body_filter_by_lua_block-no-handler-consume` → lua-nginx-module/`src/ngx_http_lua_bodyfilterby.c`:245–250（新）。
- `df340-lua-h-body_filter_by_lua_block-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `implementation-3` → lua-nginx-module/`src/ngx_http_lua_module.c`:854–859（冻结基线保留）。

补丁核对：新增公共层级源码 ngx_http.c 未被34条有效补丁修改；阶段 setter/create/merge 与空 handler 分支来自固定 HTTP Lua、无直接补丁。只核本阶段槽与挂接，不改变旧其他共享补丁判断。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--body_filter_by_lua_file

组：E-http-phase。目标字段：defaults、inheritance。

本 ID 的 post=file加载器 → setter写 body_filter_src/body_filter_handler → create零态 → 专属阶段 merge → 当前请求 loc_conf 的空handler/执行分支。

- defaults [verified]：本层未配置且未从父级继承到 body_filter_by_lua 族任一种形式时，没有本阶段用户 Lua 脚本，body_filter_handler 保持 NULL；不生成默认脚本或默认文件。 来源：`registration`、`configuration-definition`、`df340-lua-h-body_filter_by_lua_file-create-loc`、`merge-default`、`df340-lua-h-body_filter_by_lua_file-no-handler-consume`、`df340-lua-h-body_filter_by_lua_file-hierarchy`、`implementation-1`。
- inheritance [verified]：对应 body_filter_src.value.len 为0时，子配置复制父级本阶段的源码/复杂值、handler、缓存 ref/key 和 chunkname；子级配置本族任一种非空输入形式时整体采用自己的本阶段槽，不与父脚本追加，也不改变其他阶段槽。同一层本族不同形式共用 handler，重复被拒绝，显式空脚本不是关闭方式。 来源：`registration`、`configuration-definition`、`df340-lua-h-body_filter_by_lua_file-create-loc`、`merge-default`、`df340-lua-h-body_filter_by_lua_file-no-handler-consume`、`df340-lua-h-body_filter_by_lua_file-hierarchy`、`implementation-1`。

file 路径编译为 complex value；合并复制包含 lengths/values 的整套源码对象，不把变量路径当固定文件名。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:477–483（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_directive.c`:1133–1213（冻结基线保留）。
- `df340-lua-h-body_filter_by_lua_file-create-loc` → lua-nginx-module/`src/ngx_http_lua_module.c`:1378–1415（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1500–1506（冻结基线保留）。
- `df340-lua-h-body_filter_by_lua_file-no-handler-consume` → lua-nginx-module/`src/ngx_http_lua_bodyfilterby.c`:245–250（新）。
- `df340-lua-h-body_filter_by_lua_file-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `implementation-1` → lua-nginx-module/`src/ngx_http_lua_module.c`:854–859（冻结基线保留）。

补丁核对：新增公共层级源码 ngx_http.c 未被34条有效补丁修改；阶段 setter/create/merge 与空 handler 分支来自固定 HTTP Lua、无直接补丁。只核本阶段槽与挂接，不改变旧其他共享补丁判断。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--balancer_by_lua_block

组：G-upstream-balancer。目标字段：defaults、inheritance。

本ID UPS_CONF/SRV_CONF_OFFSET → block委派或file setter保存balancer子结构 → 本upstream单独create_srv_conf → setter改当前uscf.peer.init_upstream → init_peer从选中upstream拿本域conf。

- defaults [verified]：当前 upstream 未配置 balancer_by_lua 族时，本模块的 balancer.handler 为NULL，不由该族把 peer.init_upstream 替换为 Lua balancer 初始化器；没有默认 Lua 均衡脚本或默认文件。其余上游均衡方式按当前 upstream 自身配置处理。 来源：`registration`、`configuration-definition`、`df340-lua-h-balancer_by_lua_block-create-balancer-conf`、`df340-lua-h-balancer_by_lua_block-upstream-independent-conf`、`implementation-0`、`implementation-3`。
- inheritance [not_applicable]：仅 upstream 内配置，使用该 upstream 单独创建的 Lua srv_conf.balancer 子结构；不会经过虚拟主机 server 的 Lua srv merge，也不从其他 upstream 或普通 Lua 阶段槽继承。block/file 共用当前 upstream 的 balancer.handler/src 槽，同族重复拒绝；显式配置安装当前 upstream 的 Lua peer 初始化回调。 来源：`registration`、`configuration-definition`、`df340-lua-h-balancer_by_lua_block-create-balancer-conf`、`df340-lua-h-balancer_by_lua_block-upstream-independent-conf`、`implementation-0`、`implementation-3`。

block保存inline脚本；共享handler槽不等于与其他阶段或另一upstream共槽。

setter仅在当前upstream没有server时创建内部占位server；它是显式配置Lua balancer时的初始化辅助，不是未配置时默认业务地址。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:485–490（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_balancer.c`:148–164（冻结基线保留）。
- `df340-lua-h-balancer_by_lua_block-create-balancer-conf` → lua-nginx-module/`src/ngx_http_lua_module.c`:1170–1217（新）。
- `df340-lua-h-balancer_by_lua_block-upstream-independent-conf` → nginx/`src/http/ngx_http_upstream.c`:6090–6133（新）。
- `implementation-0` → lua-nginx-module/`src/ngx_http_lua_balancer.c`:167–283（冻结基线保留）。
- `implementation-3` → lua-nginx-module/`src/ngx_http_lua_balancer.c`:286–381（冻结基线保留）。

补丁核对：新增HTTP upstream独立配置对象片段6090–6133须与该文件的有效补丁分开：balancer_status_code改 upstream_connect 对特殊状态码的收尾分支，upstream_pipelining/upstream_timeout_fields改其他运行字段，均不改此create_srv_conf循环；stream upstream对象构建文件无有效补丁修改。本次不重述这些补丁改变的运行字段，既有affected/unaffected原结论保留。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--balancer_by_lua_file

组：G-upstream-balancer。目标字段：defaults、inheritance。

本ID UPS_CONF/SRV_CONF_OFFSET → block委派或file setter保存balancer子结构 → 本upstream单独create_srv_conf → setter改当前uscf.peer.init_upstream → init_peer从选中upstream拿本域conf。

- defaults [verified]：当前 upstream 未配置 balancer_by_lua 族时，本模块的 balancer.handler 为NULL，不由该族把 peer.init_upstream 替换为 Lua balancer 初始化器；没有默认 Lua 均衡脚本或默认文件。其余上游均衡方式按当前 upstream 自身配置处理。 来源：`registration`、`configuration-definition`、`df340-lua-h-balancer_by_lua_file-create-balancer-conf`、`df340-lua-h-balancer_by_lua_file-upstream-independent-conf`、`implementation-1`。
- inheritance [not_applicable]：仅 upstream 内配置，使用该 upstream 单独创建的 Lua srv_conf.balancer 子结构；不会经过虚拟主机 server 的 Lua srv merge，也不从其他 upstream 或普通 Lua 阶段槽继承。block/file 共用当前 upstream 的 balancer.handler/src 槽，同族重复拒绝；显式配置安装当前 upstream 的 Lua peer 初始化回调。 来源：`registration`、`configuration-definition`、`df340-lua-h-balancer_by_lua_file-create-balancer-conf`、`df340-lua-h-balancer_by_lua_file-upstream-independent-conf`、`implementation-1`。

配置时rebase脚本路径，保存同族src；不把它视为请求变量化路径。

setter仅在当前upstream没有server时创建内部占位server；它是显式配置Lua balancer时的初始化辅助，不是未配置时默认业务地址。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:492–497（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_balancer.c`:167–283（冻结基线保留）。
- `df340-lua-h-balancer_by_lua_file-create-balancer-conf` → lua-nginx-module/`src/ngx_http_lua_module.c`:1170–1217（新）。
- `df340-lua-h-balancer_by_lua_file-upstream-independent-conf` → nginx/`src/http/ngx_http_upstream.c`:6090–6133（新）。
- `implementation-1` → lua-nginx-module/`src/ngx_http_lua_balancer.c`:286–381（冻结基线保留）。

补丁核对：新增HTTP upstream独立配置对象片段6090–6133须与该文件的有效补丁分开：balancer_status_code改 upstream_connect 对特殊状态码的收尾分支，upstream_pipelining/upstream_timeout_fields改其他运行字段，均不改此create_srv_conf循环；stream upstream对象构建文件无有效补丁修改。本次不重述这些补丁改变的运行字段，既有affected/unaffected原结论保留。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--balancer_keepalive

组：G-upstream-balancer。目标字段：inheritance。

UPS_CONF注册 →专用setter写balancer.max_cached，重复/零拒绝 → 每upstream新建srv对象、max_cached=UNSET_UINT → balancer_init在该对象init默认32并创建缓存，非虚拟主机merge。

- inheritance [not_applicable]：仅在当前 upstream 配置，写入该 upstream 独立创建的 Lua srv_conf.balancer.max_cached；没有 http/server/location 或其他 upstream 到此处的父子合并。max_cached 的未设置值仅在当前 Lua balancer 初始化时补为32；它不等同普通 Lua cosocket 的 lua_socket_pool_size/keepalive_timeout，也不从那些参数继承。 来源：`registration`、`configuration-definition`、`df340-lua-h-balancer_keepalive-create-balancer-conf`、`df340-lua-h-balancer_keepalive-upstream-independent-conf`、`df340-lua-h-balancer_keepalive-balancer-init-cache`。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:499–504（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_balancer.c`:1345–1376（冻结基线保留）。
- `df340-lua-h-balancer_keepalive-create-balancer-conf` → lua-nginx-module/`src/ngx_http_lua_module.c`:1170–1217（新）。
- `df340-lua-h-balancer_keepalive-upstream-independent-conf` → nginx/`src/http/ngx_http_upstream.c`:6090–6133（新）。
- `df340-lua-h-balancer_keepalive-balancer-init-cache` → lua-nginx-module/`src/ngx_http_lua_balancer.c`:286–339（新）。

补丁核对：新增HTTP upstream独立配置对象片段6090–6133须与该文件的有效补丁分开：balancer_status_code改 upstream_connect 对特殊状态码的收尾分支，upstream_pipelining/upstream_timeout_fields改其他运行字段，均不改此create_srv_conf循环；stream upstream对象构建文件无有效补丁修改。本次不重述这些补丁改变的运行字段，既有affected/unaffected原结论保留。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_socket_keepalive_timeout

组：D-scalar-merge。目标字段：inheritance。

本 ID 的 offset 指向 keepalive_timeout → src/core/ngx_conf_file.c 的注册 setter → create 设置对应 UNSET → 所列专属 merge 调用及公共宏决定父/子选择 → 消费端读取合并对象。

- inheritance [verified]：写入 loc_conf 的 keepalive_timeout。按 http→server→location/嵌套 location 的配置对象合并，合法 location-if 也按其对象参与合并；子项仍为对应 UNSET 哨兵时取父值，子项显式设置则保留，不累加。父子均未设置才采用该字段 merge 的缺省。运行时 setkeepalive 的显式参数可另行覆盖；不把 Lua API 参数当成配置继承。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_socket_keepalive_timeout-create-slot`、`merge-default`、`df340-lua-h-lua_socket_keepalive_timeout-merge-macro`、`df340-lua-h-lua_socket_keepalive_timeout-hierarchy`、`df340-lua-h-lua_socket_keepalive_timeout-consume`。

未设置、父设子未设、子显式设置三路均由本字段 merge 宏核对。只补 inheritance；已有 defaults、运行限制及其来源保持。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:506–512（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1260–1287（冻结基线保留）。
- `df340-lua-h-lua_socket_keepalive_timeout-create-slot` → lua-nginx-module/`src/ngx_http_lua_module.c`:1423–1429（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1553–1554（冻结基线保留）。
- `df340-lua-h-lua_socket_keepalive_timeout-merge-macro` → nginx/`src/core/ngx_conf_file.h`:220–223（新）。
- `df340-lua-h-lua_socket_keepalive_timeout-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `df340-lua-h-lua_socket_keepalive_timeout-consume` → lua-nginx-module/`src/ngx_http_lua_socket_tcp.c`:5396–5401（新）。

补丁核对：新增跨 Nginx 来源限定 ngx_conf_file.h 与 ngx_http.c；34条有效补丁没有改这些文件，已核有效目标集及固定补丁头。Lua setter/create/merge/消费来自未直接打补丁的本组件；不外推 socket/事件运行链整体无补丁影响。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_socket_connect_timeout

组：D-scalar-merge。目标字段：inheritance。

本 ID 的 offset 指向 connect_timeout → src/core/ngx_conf_file.c 的注册 setter → create 设置对应 UNSET → 所列专属 merge 调用及公共宏决定父/子选择 → 消费端读取合并对象。

- inheritance [verified]：写入 loc_conf 的 connect_timeout。按 http→server→location/嵌套 location 的配置对象合并，合法 location-if 也按其对象参与合并；子项仍为对应 UNSET 哨兵时取父值，子项显式设置则保留，不累加。父子均未设置才采用该字段 merge 的缺省。这是配置对象的继承；运行时 socket API 的独立超时值仍可覆盖此次合并值。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_socket_connect_timeout-create-slot`、`df340-lua-h-lua_socket_connect_timeout-merge-slot`、`df340-lua-h-lua_socket_connect_timeout-merge-macro`、`df340-lua-h-lua_socket_connect_timeout-hierarchy`、`df340-lua-h-lua_socket_connect_timeout-consume`。

未设置、父设子未设、子显式设置三路均由本字段 merge 宏核对。只补 inheritance；已有 defaults、运行限制及其来源保持。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:514–520（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1260–1299（冻结基线保留）。
- `df340-lua-h-lua_socket_connect_timeout-create-slot` → lua-nginx-module/`src/ngx_http_lua_module.c`:1423–1429（新）。
- `df340-lua-h-lua_socket_connect_timeout-merge-slot` → lua-nginx-module/`src/ngx_http_lua_module.c`:1556–1557（新）。
- `df340-lua-h-lua_socket_connect_timeout-merge-macro` → nginx/`src/core/ngx_conf_file.h`:220–223（新）。
- `df340-lua-h-lua_socket_connect_timeout-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `df340-lua-h-lua_socket_connect_timeout-consume` → lua-nginx-module/`src/ngx_http_lua_socket_tcp.c`:1148–1153（新）。

补丁核对：新增跨 Nginx 来源限定 ngx_conf_file.h 与 ngx_http.c；34条有效补丁没有改这些文件，已核有效目标集及固定补丁头。Lua setter/create/merge/消费来自未直接打补丁的本组件；不外推 socket/事件运行链整体无补丁影响。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_socket_send_timeout

组：D-scalar-merge。目标字段：inheritance。

本 ID 的 offset 指向 send_timeout → src/core/ngx_conf_file.c 的注册 setter → create 设置对应 UNSET → 所列专属 merge 调用及公共宏决定父/子选择 → 消费端读取合并对象。

- inheritance [verified]：写入 loc_conf 的 send_timeout。按 http→server→location/嵌套 location 的配置对象合并，合法 location-if 也按其对象参与合并；子项仍为对应 UNSET 哨兵时取父值，子项显式设置则保留，不累加。父子均未设置才采用该字段 merge 的缺省。这是配置对象的继承；运行时 socket API 的独立超时值仍可覆盖此次合并值。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_socket_send_timeout-create-slot`、`df340-lua-h-lua_socket_send_timeout-merge-slot`、`df340-lua-h-lua_socket_send_timeout-merge-macro`、`df340-lua-h-lua_socket_send_timeout-hierarchy`、`df340-lua-h-lua_socket_send_timeout-consume`。

未设置、父设子未设、子显式设置三路均由本字段 merge 宏核对。只补 inheritance；已有 defaults、运行限制及其来源保持。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:522–528（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1260–1299（冻结基线保留）。
- `df340-lua-h-lua_socket_send_timeout-create-slot` → lua-nginx-module/`src/ngx_http_lua_module.c`:1423–1429（新）。
- `df340-lua-h-lua_socket_send_timeout-merge-slot` → lua-nginx-module/`src/ngx_http_lua_module.c`:1559–1560（新）。
- `df340-lua-h-lua_socket_send_timeout-merge-macro` → nginx/`src/core/ngx_conf_file.h`:220–223（新）。
- `df340-lua-h-lua_socket_send_timeout-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `df340-lua-h-lua_socket_send_timeout-consume` → lua-nginx-module/`src/ngx_http_lua_socket_tcp.c`:1155–1160（新）。

补丁核对：新增跨 Nginx 来源限定 ngx_conf_file.h 与 ngx_http.c；34条有效补丁没有改这些文件，已核有效目标集及固定补丁头。Lua setter/create/merge/消费来自未直接打补丁的本组件；不外推 socket/事件运行链整体无补丁影响。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_socket_send_lowat

组：D-scalar-merge。目标字段：inheritance。

本 ID 的 offset 指向 send_lowat → src/core/ngx_conf_file.c 的注册 setter → create 设置对应 UNSET → 所列专属 merge 调用及公共宏决定父/子选择 → 消费端读取合并对象。

- inheritance [verified]：写入 loc_conf 的 send_lowat。按 http→server→location/嵌套 location 的配置对象合并，合法 location-if 也按其对象参与合并；子项仍为对应 UNSET 哨兵时取父值，子项显式设置则保留，不累加。父子均未设置才采用该字段 merge 的缺省。显式值先经过 lowat 平台 post 检查；不支持 SO_SNDLOWAT 的分支告警并改为0，此后合并实际保存值。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_socket_send_lowat-create-slot`、`merge-default`、`df340-lua-h-lua_socket_send_lowat-merge-macro`、`df340-lua-h-lua_socket_send_lowat-hierarchy`、`df340-lua-h-lua_socket_send_lowat-consume`、`implementation-0`、`implementation-1`。

未设置、父设子未设、子显式设置三路均由本字段 merge 宏核对。只补 inheritance；已有 defaults、运行限制及其来源保持。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:530–536（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1198–1225（冻结基线保留）。
- `df340-lua-h-lua_socket_send_lowat-create-slot` → lua-nginx-module/`src/ngx_http_lua_module.c`:1423–1429（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1565–1566（冻结基线保留）。
- `df340-lua-h-lua_socket_send_lowat-merge-macro` → nginx/`src/core/ngx_conf_file.h`:230–233（新）。
- `df340-lua-h-lua_socket_send_lowat-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `df340-lua-h-lua_socket_send_lowat-consume` → lua-nginx-module/`src/ngx_http_lua_socket_tcp.c`:3585–3593（新）。
- `implementation-0` → lua-nginx-module/`src/ngx_http_lua_module.c`:69–70（冻结基线保留）。
- `implementation-1` → lua-nginx-module/`src/ngx_http_lua_module.c`:980–1006（冻结基线保留）。

补丁核对：新增跨 Nginx 来源限定 ngx_conf_file.h 与 ngx_http.c；34条有效补丁没有改这些文件，已核有效目标集及固定补丁头。Lua setter/create/merge/消费来自未直接打补丁的本组件；不外推 socket/事件运行链整体无补丁影响。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_socket_buffer_size

组：D-scalar-merge。目标字段：inheritance。

本 ID 的 offset 指向 buffer_size → src/core/ngx_conf_file.c 的注册 setter → create 设置对应 UNSET → 所列专属 merge 调用及公共宏决定父/子选择 → 消费端读取合并对象。

- inheritance [verified]：写入 loc_conf 的 buffer_size。按 http→server→location/嵌套 location 的配置对象合并，合法 location-if 也按其对象参与合并；子项仍为对应 UNSET 哨兵时取父值，子项显式设置则保留，不累加。父子均未设置才采用该字段 merge 的缺省。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_socket_buffer_size-create-slot`、`merge-default`、`df340-lua-h-lua_socket_buffer_size-merge-macro`、`df340-lua-h-lua_socket_buffer_size-hierarchy`、`df340-lua-h-lua_socket_buffer_size-consume`。

未设置、父设子未设、子显式设置三路均由本字段 merge 宏核对。只补 inheritance；已有 defaults、运行限制及其来源保持。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:538–544（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1198–1225（冻结基线保留）。
- `df340-lua-h-lua_socket_buffer_size-create-slot` → lua-nginx-module/`src/ngx_http_lua_module.c`:1423–1429（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1568–1570（冻结基线保留）。
- `df340-lua-h-lua_socket_buffer_size-merge-macro` → nginx/`src/core/ngx_conf_file.h`:230–233（新）。
- `df340-lua-h-lua_socket_buffer_size-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `df340-lua-h-lua_socket_buffer_size-consume` → lua-nginx-module/`src/ngx_http_lua_socket_tcp.c`:2164–2174（新）。

补丁核对：新增跨 Nginx 来源限定 ngx_conf_file.h 与 ngx_http.c；34条有效补丁没有改这些文件，已核有效目标集及固定补丁头。Lua setter/create/merge/消费来自未直接打补丁的本组件；不外推 socket/事件运行链整体无补丁影响。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_socket_pool_size

组：D-scalar-merge。目标字段：inheritance。

本 ID 的 offset 指向 pool_size → src/core/ngx_conf_file.c 的注册 setter → create 设置对应 UNSET → 所列专属 merge 调用及公共宏决定父/子选择 → 消费端读取合并对象。

- inheritance [verified]：写入 loc_conf 的 pool_size。按 http→server→location/嵌套 location 的配置对象合并，合法 location-if 也按其对象参与合并；子项仍为对应 UNSET 哨兵时取父值，子项显式设置则保留，不累加。父子均未设置才采用该字段 merge 的缺省。运行时 setkeepalive 的显式参数可另行覆盖；不把 Lua API 参数当成配置继承。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_socket_pool_size-create-slot`、`merge-default`、`df340-lua-h-lua_socket_pool_size-merge-macro`、`df340-lua-h-lua_socket_pool_size-hierarchy`、`df340-lua-h-lua_socket_pool_size-consume`。

未设置、父设子未设、子显式设置三路均由本字段 merge 宏核对。只补 inheritance；已有 defaults、运行限制及其来源保持。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:546–552（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1167–1194（冻结基线保留）。
- `df340-lua-h-lua_socket_pool_size-create-slot` → lua-nginx-module/`src/ngx_http_lua_module.c`:1423–1429（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1572–1572（冻结基线保留）。
- `df340-lua-h-lua_socket_pool_size-merge-macro` → nginx/`src/core/ngx_conf_file.h`:215–218（新）。
- `df340-lua-h-lua_socket_pool_size-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `df340-lua-h-lua_socket_pool_size-consume` → lua-nginx-module/`src/ngx_http_lua_socket_tcp.c`:5403–5408（新）。

补丁核对：新增跨 Nginx 来源限定 ngx_conf_file.h 与 ngx_http.c；34条有效补丁没有改这些文件，已核有效目标集及固定补丁头。Lua setter/create/merge/消费来自未直接打补丁的本组件；不外推 socket/事件运行链整体无补丁影响。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_socket_read_timeout

组：D-scalar-merge。目标字段：inheritance。

本 ID 的 offset 指向 read_timeout → src/core/ngx_conf_file.c 的注册 setter → create 设置对应 UNSET → 所列专属 merge 调用及公共宏决定父/子选择 → 消费端读取合并对象。

- inheritance [verified]：写入 loc_conf 的 read_timeout。按 http→server→location/嵌套 location 的配置对象合并，合法 location-if 也按其对象参与合并；子项仍为对应 UNSET 哨兵时取父值，子项显式设置则保留，不累加。父子均未设置才采用该字段 merge 的缺省。这是配置对象的继承；运行时 socket API 的独立超时值仍可覆盖此次合并值。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_socket_read_timeout-create-slot`、`df340-lua-h-lua_socket_read_timeout-merge-slot`、`df340-lua-h-lua_socket_read_timeout-merge-macro`、`df340-lua-h-lua_socket_read_timeout-hierarchy`、`df340-lua-h-lua_socket_read_timeout-consume`。

未设置、父设子未设、子显式设置三路均由本字段 merge 宏核对。只补 inheritance；已有 defaults、运行限制及其来源保持。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:554–560（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1260–1299（冻结基线保留）。
- `df340-lua-h-lua_socket_read_timeout-create-slot` → lua-nginx-module/`src/ngx_http_lua_module.c`:1423–1429（新）。
- `df340-lua-h-lua_socket_read_timeout-merge-slot` → lua-nginx-module/`src/ngx_http_lua_module.c`:1562–1563（新）。
- `df340-lua-h-lua_socket_read_timeout-merge-macro` → nginx/`src/core/ngx_conf_file.h`:220–223（新）。
- `df340-lua-h-lua_socket_read_timeout-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `df340-lua-h-lua_socket_read_timeout-consume` → lua-nginx-module/`src/ngx_http_lua_socket_tcp.c`:1162–1167（新）。

补丁核对：新增跨 Nginx 来源限定 ngx_conf_file.h 与 ngx_http.c；34条有效补丁没有改这些文件，已核有效目标集及固定补丁头。Lua setter/create/merge/消费来自未直接打补丁的本组件；不外推 socket/事件运行链整体无补丁影响。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_http10_buffering

组：D-scalar-merge。目标字段：inheritance。

本 ID 的 offset 指向 http10_buffering → src/core/ngx_conf_file.c 的注册 setter → create 设置对应 UNSET → 所列专属 merge 调用及公共宏决定父/子选择 → 消费端读取合并对象。

- inheritance [verified]：写入 loc_conf 的 http10_buffering。按 http→server→location/嵌套 location 的配置对象合并，合法 location-if 也按其对象参与合并；子项仍为对应 UNSET 哨兵时取父值，子项显式设置则保留，不累加。父子均未设置才采用该字段 merge 的缺省。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_http10_buffering-create-slot`、`merge-default`、`df340-lua-h-lua_http10_buffering-merge-macro`、`df340-lua-h-lua_http10_buffering-hierarchy`、`df340-lua-h-lua_http10_buffering-consume`。

未设置、父设子未设、子显式设置三路均由本字段 merge 宏核对。只补 inheritance；已有 defaults、运行限制及其来源保持。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:562–568（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1026–1062（冻结基线保留）。
- `df340-lua-h-lua_http10_buffering-create-slot` → lua-nginx-module/`src/ngx_http_lua_module.c`:1417–1421（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1549–1549（冻结基线保留）。
- `df340-lua-h-lua_http10_buffering-merge-macro` → nginx/`src/core/ngx_conf_file.h`:205–208（新）。
- `df340-lua-h-lua_http10_buffering-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `df340-lua-h-lua_http10_buffering-consume` → lua-nginx-module/`src/ngx_http_lua_util.c`:585–595（新）。

补丁核对：新增跨 Nginx 来源限定 ngx_conf_file.h 与 ngx_http.c；34条有效补丁没有改这些文件，已核有效目标集及固定补丁头。Lua setter/create/merge/消费来自未直接打补丁的本组件；不外推 socket/事件运行链整体无补丁影响。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_check_client_abort

组：D-scalar-merge。目标字段：inheritance。

本 ID 的 offset 指向 check_client_abort → src/core/ngx_conf_file.c 的注册 setter → create 设置对应 UNSET → 所列专属 merge 调用及公共宏决定父/子选择 → 消费端读取合并对象。

- inheritance [verified]：写入 loc_conf 的 check_client_abort。按 http→server→location/嵌套 location 的配置对象合并，合法 location-if 也按其对象参与合并；子项仍为对应 UNSET 哨兵时取父值，子项显式设置则保留，不累加。父子均未设置才采用该字段 merge 的缺省。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_check_client_abort-create-slot`、`merge-default`、`df340-lua-h-lua_check_client_abort-merge-macro`、`df340-lua-h-lua_check_client_abort-hierarchy`、`df340-lua-h-lua_check_client_abort-consume`。

未设置、父设子未设、子显式设置三路均由本字段 merge 宏核对。只补 inheritance；已有 defaults、运行限制及其来源保持。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:570–576（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1026–1062（冻结基线保留）。
- `df340-lua-h-lua_check_client_abort-create-slot` → lua-nginx-module/`src/ngx_http_lua_module.c`:1417–1421（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1550–1550（冻结基线保留）。
- `df340-lua-h-lua_check_client_abort-merge-macro` → nginx/`src/core/ngx_conf_file.h`:205–208（新）。
- `df340-lua-h-lua_check_client_abort-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `df340-lua-h-lua_check_client_abort-consume` → lua-nginx-module/`src/ngx_http_lua_contentby.c`:99–122（新）。

补丁核对：新增跨 Nginx 来源限定 ngx_conf_file.h 与 ngx_http.c；34条有效补丁没有改这些文件，已核有效目标集及固定补丁头。Lua setter/create/merge/消费来自未直接打补丁的本组件；不外推 socket/事件运行链整体无补丁影响。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_use_default_type

组：D-scalar-merge。目标字段：inheritance。

本 ID 的 offset 指向 use_default_type → src/core/ngx_conf_file.c 的注册 setter → create 设置对应 UNSET → 所列专属 merge 调用及公共宏决定父/子选择 → 消费端读取合并对象。

- inheritance [verified]：写入 loc_conf 的 use_default_type。按 http→server→location/嵌套 location 的配置对象合并，合法 location-if 也按其对象参与合并；子项仍为对应 UNSET 哨兵时取父值，子项显式设置则保留，不累加。父子均未设置才采用该字段 merge 的缺省。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_use_default_type-create-slot`、`merge-default`、`df340-lua-h-lua_use_default_type-merge-macro`、`df340-lua-h-lua_use_default_type-hierarchy`、`df340-lua-h-lua_use_default_type-consume`。

未设置、父设子未设、子显式设置三路均由本字段 merge 宏核对。只补 inheritance；已有 defaults、运行限制及其来源保持。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:578–584（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1026–1062（冻结基线保留）。
- `df340-lua-h-lua_use_default_type-create-slot` → lua-nginx-module/`src/ngx_http_lua_module.c`:1417–1421（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1551–1551（冻结基线保留）。
- `df340-lua-h-lua_use_default_type-merge-macro` → nginx/`src/core/ngx_conf_file.h`:205–208（新）。
- `df340-lua-h-lua_use_default_type-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `df340-lua-h-lua_use_default_type-consume` → lua-nginx-module/`src/ngx_http_lua_util.h`:458–465（新）。

补丁核对：新增跨 Nginx 来源限定 ngx_conf_file.h 与 ngx_http.c；34条有效补丁没有改这些文件，已核有效目标集及固定补丁头。Lua setter/create/merge/消费来自未直接打补丁的本组件；不外推 socket/事件运行链整体无补丁影响。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_malloc_trim

组：A-main-scalar。目标字段：inheritance。

注册限定 main → setter 写 malloc_trim_cycle → create/init 设置初态及缺省 → 消费端读取同一 main_conf。父设置/子未设置与子显式覆盖均不是本指令合法配置分支。

- inheritance [not_applicable]：仅能在http级配置，写入本模块唯一 main_conf 的 malloc_trim_cycle；server/location不创建该参数的独立槽，也不进行父子合并。仅编译支持时生效；setter 在非零配置时设置 requires_log，计数限已挂接的 Lua log 入口，不能由缺省阈值推断必然执行。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_malloc_trim-create`、`merge-default`、`df340-lua-h-lua_malloc_trim-consume`、`implementation-0`。

未设置路径：HTTP init 所列缺省仅用于解释单层 main 配置；本批不改 manifest 外 defaults。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:703–708（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_module.c`:1731–1763（冻结基线保留）。
- `df340-lua-h-lua_malloc_trim-create` → lua-nginx-module/`src/ngx_http_lua_module.c`:1058–1060（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1124–1128（冻结基线保留）。
- `df340-lua-h-lua_malloc_trim-consume` → lua-nginx-module/`src/ngx_http_lua_logby.c`:79–99（新）。
- `implementation-0` → lua-nginx-module/`src/ngx_http_lua_module.c`:831–845（冻结基线保留）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_worker_thread_vm_pool_size

组：A-main-scalar。目标字段：inheritance。

注册限定 main → setter 写 worker_thread_vm_pool_size → create/init 设置初态及缺省 → 消费端读取同一 main_conf。父设置/子未设置与子显式覆盖均不是本指令合法配置分支。

- inheritance [not_applicable]：仅能在http级配置，写入本模块唯一 main_conf 的 worker_thread_vm_pool_size；server/location不创建该参数的独立槽，也不进行父子合并。控制 NGX_THREADS 路径中的 Lua VM 池，不是 thread_pool 线程数量。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_worker_thread_vm_pool_size-create`、`merge-default`、`df340-lua-h-lua_worker_thread_vm_pool_size-consume`。

未设置路径：HTTP init 所列缺省仅用于解释单层 main 配置；本批不改 manifest 外 defaults。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:710–715（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1167–1194（冻结基线保留）。
- `df340-lua-h-lua_worker_thread_vm_pool_size-create` → lua-nginx-module/`src/ngx_http_lua_module.c`:1067–1067（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1152–1154（冻结基线保留）。
- `df340-lua-h-lua_worker_thread_vm_pool_size-consume` → lua-nginx-module/`src/ngx_http_lua_worker_thread.c`:109–116（新）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_load_resty_core

组：B-main-special。目标字段：defaults、inheritance。

注册 main/FLAG → 专用 callback 不解析或保存参数 → VM require resty.core 与该入口无关。父/子覆盖无合法分支。

- defaults [not_applicable]：该入口已废弃：配置回调只告警并返回成功，不保存 on/off 状态，因而没有仍能控制行为的开关默认值。未配置它时，Lua VM 初始化仍强制 require resty.core；off 也不能禁用。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_load_resty_core-create-main`、`df340-lua-s-lua_load_resty_core-mandatory-require`。
- inheritance [not_applicable]：只允许在 stream 配置的废弃无状态入口；没有供子级继承的开关槽，不能按历史 on/off 语法解释为父子开关合并。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_load_resty_core-create-main`、`df340-lua-s-lua_load_resty_core-mandatory-require`。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:96–101（冻结基线保留）。
- `configuration-definition` → stream-lua-nginx-module/`src/ngx_stream_lua_directive.c`:180–190（冻结基线保留）。
- `df340-lua-s-lua_load_resty_core-create-main` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:704–731（新）。
- `df340-lua-s-lua_load_resty_core-mandatory-require` → stream-lua-nginx-module/`src/ngx_stream_lua_util.c`:3369–3383（新）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_max_running_timers

组：A-main-scalar。目标字段：inheritance。

注册限定 main → setter 写 max_running_timers → create/init 设置初态及缺省 → 消费端读取同一 main_conf。父设置/子未设置与子显式覆盖均不是本指令合法配置分支。

- inheritance [not_applicable]：仅能在stream级配置，写入本模块唯一 main_conf 的 max_running_timers；server不创建该参数的独立槽，也不进行父子合并。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_max_running_timers-create`、`merge-default`、`df340-lua-s-lua_max_running_timers-consume`。

未设置路径：stream init 所列缺省仅用于解释单层 main 配置；本批不改 manifest 外 defaults。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:103–108（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1167–1194（冻结基线保留）。
- `df340-lua-s-lua_max_running_timers-create` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:704–738（新）。
- `merge-default` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:779–781（冻结基线保留）。
- `df340-lua-s-lua_max_running_timers-consume` → stream-lua-nginx-module/`src/ngx_stream_lua_timer.c`:591–614（新）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_max_pending_timers

组：A-main-scalar。目标字段：inheritance。

注册限定 main → setter 写 max_pending_timers → create/init 设置初态及缺省 → 消费端读取同一 main_conf。父设置/子未设置与子显式覆盖均不是本指令合法配置分支。

- inheritance [not_applicable]：仅能在stream级配置，写入本模块唯一 main_conf 的 max_pending_timers；server不创建该参数的独立槽，也不进行父子合并。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_max_pending_timers-create`、`merge-default`、`df340-lua-s-lua_max_pending_timers-consume`。

未设置路径：stream init 所列缺省仅用于解释单层 main 配置；本批不改 manifest 外 defaults。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:110–115（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1167–1194（冻结基线保留）。
- `df340-lua-s-lua_max_pending_timers-create` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:704–738（新）。
- `merge-default` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:775–777（冻结基线保留）。
- `df340-lua-s-lua_max_pending_timers-consume` → stream-lua-nginx-module/`src/ngx_stream_lua_timer.c`:191–197（新）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_shared_dict

组：B-main-special。目标字段：defaults、inheritance。

main 注册 → callback 初始化/追加 shdict_zones、绑定模块 tag 和 init_zone → pcalloc 初态 NULL → 注入 ngx.shared 时按 main 列表枚举。子显式声明不合法，main 共享可见性不叫逐层继承。

- defaults [verified]：未配置时不声明本域共享字典，shdict_zones 保持 NULL，ngx.shared 是空表；没有隐含字典名或容量。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_shared_dict-create-main`、`df340-lua-s-lua_shared_dict-dict-consume`。
- inheritance [not_applicable]：仅 stream 级声明，字典加入同一 main_conf 的 shdict_zones，供本域 Lua VM 的 ngx.shared 使用，不是 server各自复制或合并一份。不同名称逐次注册；本域重复名称被拒绝；不据此推定 HTTP 与 stream 的同名字典共享。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_shared_dict-create-main`、`df340-lua-s-lua_shared_dict-dict-consume`。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:117–122（冻结基线保留）。
- `configuration-definition` → stream-lua-nginx-module/`src/ngx_stream_lua_directive.c`:72–153（冻结基线保留）。
- `df340-lua-s-lua_shared_dict-create-main` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:704–731（新）。
- `df340-lua-s-lua_shared_dict-dict-consume` → stream-lua-nginx-module/`src/ngx_stream_lua_shdict.c`:361–387（新）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_sa_restart

组：A-main-scalar。目标字段：inheritance。

注册限定 main → setter 写 set_sa_restart → create/init 设置初态及缺省 → 消费端读取同一 main_conf。父设置/子未设置与子显式覆盖均不是本指令合法配置分支。

- inheritance [not_applicable]：仅能在stream级配置，写入本模块唯一 main_conf 的 set_sa_restart；server不创建该参数的独立槽，也不进行父子合并。实际作用受 NGX_STREAM_LUA_HAVE_SA_RESTART 条件约束。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_sa_restart-create`、`merge-default`、`implementation-0`。

未设置路径：stream init 所列缺省仅用于解释单层 main 配置；本批不改 manifest 外 defaults。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:124–129（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1026–1062（冻结基线保留）。
- `df340-lua-s-lua_sa_restart-create` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:741–743（新）。
- `merge-default` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:783–787（冻结基线保留）。
- `implementation-0` → stream-lua-nginx-module/`src/ngx_stream_lua_initworkerby.c`:87–91（冻结基线保留）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_capture_error_log

组：B-main-special。目标字段：defaults、inheritance。

main 注册 → requires_capture_log 初态 0 → callback 校验容量、重复和 cycle hook → 分配 ringbuf、安装唯一 handler → log consumer 从 cycle 获取 ringbuf。未配置不执行此安装路径。

- defaults [verified]：未配置本指令时，不由它分配本域日志环形缓冲区，也不注册本域 capture handler；没有隐含缓冲区容量。这不排除另一域或其他入口已占用 cycle 的唯一 intercept_error_log_handler。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_capture_error_log-create-main`、`implementation-0`、`patch-intercept_error_log`、`patch-larger_max_error_str`。
- inheritance [not_applicable]：仅 stream 级配置，callback 为 cycle 安装唯一日志拦截器并保存缓冲区，不进行 server层级合并。重复配置或已有拦截器会拒绝；无 HAVE_INTERCEPT_ERROR_LOG_PATCH 时显式配置报错。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_capture_error_log-create-main`、`implementation-0`、`patch-intercept_error_log`、`patch-larger_max_error_str`。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:131–136（冻结基线保留）。
- `configuration-definition` → stream-lua-nginx-module/`src/ngx_stream_lua_directive.c`:1190–1253（冻结基线保留）。
- `df340-lua-s-lua_capture_error_log-create-main` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:704–731（新）。
- `implementation-0` → stream-lua-nginx-module/`src/ngx_stream_lua_log.c`:328–348（冻结基线保留）。
- `patch-intercept_error_log` → openresty/`patches/nginx-1.27.1-intercept_error_log.patch`:1–60（冻结基线保留）。
- `patch-larger_max_error_str` → openresty/`patches/nginx-1.27.1-larger_max_error_str.patch`:1–13（冻结基线保留）。

补丁核对：已读固定 intercept_error_log 与 larger_max_error_str 补丁；前者增加 cycle hook 并在 ngx_log_error_core 调用，后者把默认 NGX_MAX_ERROR_STR 改为4096且允许外部预定义。本条不猜编译覆盖后的最小容量；保持既有 verified_affected。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_regex_cache_max_entries

组：A-main-scalar。目标字段：inheritance。

注册限定 main → setter 写 regex_cache_max_entries → create/init 设置初态及缺省 → 消费端读取同一 main_conf。父设置/子未设置与子显式覆盖均不是本指令合法配置分支。

- inheritance [not_applicable]：仅能在stream级配置，写入本模块唯一 main_conf 的 regex_cache_max_entries；server不创建该参数的独立槽，也不进行父子合并。注册和使用受 NGX_PCRE 条件限制。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_regex_cache_max_entries-create`、`merge-default`、`implementation-0`。

未设置路径：stream init 所列缺省仅用于解释单层 main 配置；本批不改 manifest 外 defaults。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:139–144（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1167–1194（冻结基线保留）。
- `df340-lua-s-lua_regex_cache_max_entries-create` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:736–739（新）。
- `merge-default` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:765–768（冻结基线保留）。
- `implementation-0` → stream-lua-nginx-module/`src/ngx_stream_lua_regex.c`:978–988（冻结基线保留）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_regex_match_limit

组：A-main-scalar。目标字段：inheritance。

注册限定 main → setter 写 regex_match_limit → create/init 设置初态及缺省 → 消费端读取同一 main_conf。父设置/子未设置与子显式覆盖均不是本指令合法配置分支。

- inheritance [not_applicable]：仅能在stream级配置，写入本模块唯一 main_conf 的 regex_match_limit；server不创建该参数的独立槽，也不进行父子合并。注册和使用受 NGX_PCRE 条件限制。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_regex_match_limit-create`、`df340-lua-s-lua_regex_match_limit-init`、`df340-lua-s-lua_regex_match_limit-consume`。

未设置路径：stream init 所列缺省仅用于解释单层 main 配置；本批不改 manifest 外 defaults。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:146–151（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1167–1194（冻结基线保留）。
- `df340-lua-s-lua_regex_match_limit-create` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:736–739（新）。
- `df340-lua-s-lua_regex_match_limit-init` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:770–773（新）。
- `df340-lua-s-lua_regex_match_limit-consume` → stream-lua-nginx-module/`src/ngx_stream_lua_regex.c`:210–215（新）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_package_cpath

组：B-main-special。目标字段：defaults、inheritance。

main 注册 → 专用 setter 写 lua_cpath（非空长度用于重复检查）→ create 零长度 → new_state 区分 parent_vm 与初始 VM → set_path 展开字符串。不能把 C 结构空串等同最终 Lua 搜索路径。

- defaults [verified]：未配置时 lua_cpath.len 为 0，不用空字符串覆盖 package.cpath：无父 VM 的新 VM 保留 Lua 标准库初始化的搜索路径，若定义 LUA_DEFAULT_CPATH 则先把它前置；有父 VM 时复制父 VM 的 package.cpath。最终路径取决于 Lua 初始化环境、编译宏及父 VM，不能写成固定现场绝对路径。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_package_cpath-create-main`、`df340-lua-s-lua_package_cpath-path-setter`、`df340-lua-s-lua_package_cpath-vm-path`、`implementation-1`。
- inheritance [not_applicable]：仅 stream 级保存 lua_cpath，无 server配置合并。显式非空字符串设置 VM 的 package.cpath；;; 展开为设置前路径，$prefix 与 ${prefix} 展开为 Nginx prefix。新 VM 复制父 VM 路径是 VM 创建机制，不是指令上下文继承。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_package_cpath-create-main`、`df340-lua-s-lua_package_cpath-path-setter`、`df340-lua-s-lua_package_cpath-vm-path`、`implementation-1`。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:154–159（冻结基线保留）。
- `configuration-definition` → stream-lua-nginx-module/`src/ngx_stream_lua_directive.c`:193–212（冻结基线保留）。
- `df340-lua-s-lua_package_cpath-create-main` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:704–731（新）。
- `df340-lua-s-lua_package_cpath-path-setter` → stream-lua-nginx-module/`src/ngx_stream_lua_directive.c`:193–213（新）。
- `df340-lua-s-lua_package_cpath-vm-path` → stream-lua-nginx-module/`src/ngx_stream_lua_util.c`:214–303（新）。
- `implementation-1` → stream-lua-nginx-module/`src/ngx_stream_lua_util.c`:142–179（冻结基线保留）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_package_path

组：B-main-special。目标字段：defaults、inheritance。

main 注册 → 专用 setter 写 lua_path（非空长度用于重复检查）→ create 零长度 → new_state 区分 parent_vm 与初始 VM → set_path 展开字符串。不能把 C 结构空串等同最终 Lua 搜索路径。

- defaults [verified]：未配置时 lua_path.len 为 0，不用空字符串覆盖 package.path：无父 VM 的新 VM 保留 Lua 标准库初始化的搜索路径，若定义 LUA_DEFAULT_PATH 则先把它前置；有父 VM 时复制父 VM 的 package.path。最终路径取决于 Lua 初始化环境、编译宏及父 VM，不能写成固定现场绝对路径。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_package_path-create-main`、`df340-lua-s-lua_package_path-vm-path`、`implementation-1`。
- inheritance [not_applicable]：仅 stream 级保存 lua_path，无 server配置合并。显式非空字符串设置 VM 的 package.path；;; 展开为设置前路径，$prefix 与 ${prefix} 展开为 Nginx prefix。新 VM 复制父 VM 路径是 VM 创建机制，不是指令上下文继承。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_package_path-create-main`、`df340-lua-s-lua_package_path-vm-path`、`implementation-1`。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:161–166（冻结基线保留）。
- `configuration-definition` → stream-lua-nginx-module/`src/ngx_stream_lua_directive.c`:215–234（冻结基线保留）。
- `df340-lua-s-lua_package_path-create-main` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:704–731（新）。
- `df340-lua-s-lua_package_path-vm-path` → stream-lua-nginx-module/`src/ngx_stream_lua_util.c`:214–303（新）。
- `implementation-1` → stream-lua-nginx-module/`src/ngx_stream_lua_util.c`:142–179（冻结基线保留）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_code_cache

组：D-scalar-merge。目标字段：inheritance。

本 ID 的 offset 指向 enable_code_cache → 专用 callback 委派 flag setter → create 设置对应 UNSET → 所列专属 merge 调用及公共宏决定父/子选择 → 消费端读取合并对象。

- inheritance [verified]：写入 srv_conf 的 enable_code_cache。由 stream 的 srv 默认对象合并到各 server，不存在 HTTP location 层级；子项仍为对应 UNSET 哨兵时取父值，子项显式设置则保留，不累加。父子均未设置才采用该字段 merge 的缺省。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_code_cache-create-slot`、`merge-default`、`df340-lua-s-lua_code_cache-merge-macro`、`df340-lua-s-lua_code_cache-hierarchy`、`df340-lua-s-lua_code_cache-consume`。

未设置、父设子未设、子显式设置三路均由本字段 merge 宏核对。只补 inheritance；已有 defaults、运行限制及其来源保持。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:168–174（冻结基线保留）。
- `configuration-definition` → stream-lua-nginx-module/`src/ngx_stream_lua_directive.c`:156–177（冻结基线保留）。
- `df340-lua-s-lua_code_cache-create-slot` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:837–848（新）。
- `merge-default` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:992–992（冻结基线保留）。
- `df340-lua-s-lua_code_cache-merge-macro` → nginx/`src/core/ngx_conf_file.h`:205–208（新）。
- `df340-lua-s-lua_code_cache-hierarchy` → nginx/`src/stream/ngx_stream.c`:224–239（新）。
- `df340-lua-s-lua_code_cache-consume` → stream-lua-nginx-module/`src/ngx_stream_lua_util.h`:311–328（新）。

补丁核对：新增跨 Nginx 来源限定 ngx_conf_file.h 与 ngx_stream.c；34条有效补丁没有改这些文件，已核有效目标集及固定补丁头。Lua setter/create/merge/消费来自未直接打补丁的本组件；不外推 socket/事件运行链整体无补丁影响。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_socket_log_errors

组：D-scalar-merge。目标字段：inheritance。

本 ID 的 offset 指向 log_socket_errors → src/core/ngx_conf_file.c 的注册 setter → create 设置对应 UNSET → 所列专属 merge 调用及公共宏决定父/子选择 → 消费端读取合并对象。

- inheritance [verified]：写入 srv_conf 的 log_socket_errors。由 stream 的 srv 默认对象合并到各 server，不存在 HTTP location 层级；子项仍为对应 UNSET 哨兵时取父值，子项显式设置则保留，不累加。父子均未设置才采用该字段 merge 的缺省。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_socket_log_errors-create-slot`、`merge-default`、`df340-lua-s-lua_socket_log_errors-merge-macro`、`df340-lua-s-lua_socket_log_errors-hierarchy`、`df340-lua-s-lua_socket_log_errors-consume`。

未设置、父设子未设、子显式设置三路均由本字段 merge 宏核对。只补 inheritance；已有 defaults、运行限制及其来源保持。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:177–183（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1026–1062（冻结基线保留）。
- `df340-lua-s-lua_socket_log_errors-create-slot` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:837–848（新）。
- `merge-default` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:1016–1016（冻结基线保留）。
- `df340-lua-s-lua_socket_log_errors-merge-macro` → nginx/`src/core/ngx_conf_file.h`:205–208（新）。
- `df340-lua-s-lua_socket_log_errors-hierarchy` → nginx/`src/stream/ngx_stream.c`:224–239（新）。
- `df340-lua-s-lua_socket_log_errors-consume` → stream-lua-nginx-module/`src/ngx_stream_lua_socket_tcp.c`:1841–1846（新）。

补丁核对：新增跨 Nginx 来源限定 ngx_conf_file.h 与 ngx_stream.c；34条有效补丁没有改这些文件，已核有效目标集及固定补丁头。Lua setter/create/merge/消费来自未直接打补丁的本组件；不外推 socket/事件运行链整体无补丁影响。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--init_by_lua_block

组：C-main-lifecycle。目标字段：defaults、inheritance。

本 ID 注册 post=inline 加载器；block callback 委派专用 setter → setter 检查同族 handler 后保存 init_handler/init_src → main pcalloc 零态 → 消费端以 handler 是否为空判断。

- defaults [verified]：未配置 init_by_lua 族的任何输入形式时，main_conf 的 init_handler 为 NULL、init_src 为空，不运行本族用户脚本；没有默认脚本或默认文件。配置测试或信号进程还会提前跳过模块的 VM 初始化入口。 来源：`registration`、`configuration-definition`、`df340-lua-s-init_by_lua_block-create-main`、`implementation-0`、`df340-lua-s-init_by_lua_block-no-script-consume`、`df340-lua-s-init_by_lua_block-test-signaller-guard`、`df340-lua-s-init_by_lua_block-shared-init-guard`、`df340-lua-s-init_by_lua_block-code-cache-vm-init`。
- inheritance [not_applicable]：仅在 stream 级配置，init_by_lua_block、init_by_lua、init_by_lua_file 共用 main_conf 的 init_handler/init_src 槽，同族第二次配置按 handler 非空报重复；没有 server层级合并，不同生命周期使用不同槽。 来源：`registration`、`configuration-definition`、`df340-lua-s-init_by_lua_block-create-main`、`implementation-0`、`df340-lua-s-init_by_lua_block-no-script-consume`、`df340-lua-s-init_by_lua_block-test-signaller-guard`。

未设分支以整族为单位，不能把未写 block 误称为忽略同族 inline/file。父设置/子未设置与子显式设置无合法层级分支；同一 main 再定义是重复，不是覆盖。

init_handler 的配置后调用、共享区全部初始化后的调用，以及 code_cache off 创建请求 VM 时的调用分别存在；本字段只断言缺省无脚本，不声称显式脚本必定只在 master 执行一次。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:185–190（冻结基线保留）。
- `configuration-definition` → stream-lua-nginx-module/`src/ngx_stream_lua_directive.c`:602–618（冻结基线保留）。
- `df340-lua-s-init_by_lua_block-create-main` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:704–731（新）。
- `implementation-0` → stream-lua-nginx-module/`src/ngx_stream_lua_directive.c`:621–666（冻结基线保留）。
- `df340-lua-s-init_by_lua_block-no-script-consume` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:647–659（新）。
- `df340-lua-s-init_by_lua_block-test-signaller-guard` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:514–528（新）。
- `df340-lua-s-init_by_lua_block-shared-init-guard` → stream-lua-nginx-module/`src/ngx_stream_lua_api.c`:200–215（新）。
- `df340-lua-s-init_by_lua_block-code-cache-vm-init` → stream-lua-nginx-module/`src/ngx_stream_lua_util.h`:302–374（新）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--init_by_lua

组：C-main-lifecycle。目标字段：defaults、inheritance。

本 ID 注册 post=inline 加载器 → setter 检查同族 handler 后保存 init_handler/init_src → main pcalloc 零态 → 消费端以 handler 是否为空判断。

- defaults [verified]：未配置 init_by_lua 族的任何输入形式时，main_conf 的 init_handler 为 NULL、init_src 为空，不运行本族用户脚本；没有默认脚本或默认文件。配置测试或信号进程还会提前跳过模块的 VM 初始化入口。 来源：`registration`、`configuration-definition`、`df340-lua-s-init_by_lua-create-main`、`df340-lua-s-init_by_lua-no-script-consume`、`df340-lua-s-init_by_lua-test-signaller-guard`、`df340-lua-s-init_by_lua-shared-init-guard`、`df340-lua-s-init_by_lua-code-cache-vm-init`。
- inheritance [not_applicable]：仅在 stream 级配置，init_by_lua_block、init_by_lua、init_by_lua_file 共用 main_conf 的 init_handler/init_src 槽，同族第二次配置按 handler 非空报重复；没有 server层级合并，不同生命周期使用不同槽。 来源：`registration`、`configuration-definition`、`df340-lua-s-init_by_lua-create-main`、`df340-lua-s-init_by_lua-no-script-consume`、`df340-lua-s-init_by_lua-test-signaller-guard`。

未设分支以整族为单位，不能把未写 block 误称为忽略同族 inline/file。父设置/子未设置与子显式设置无合法层级分支；同一 main 再定义是重复，不是覆盖。

init_handler 的配置后调用、共享区全部初始化后的调用，以及 code_cache off 创建请求 VM 时的调用分别存在；本字段只断言缺省无脚本，不声称显式脚本必定只在 master 执行一次。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:192–197（冻结基线保留）。
- `configuration-definition` → stream-lua-nginx-module/`src/ngx_stream_lua_directive.c`:621–666（冻结基线保留）。
- `df340-lua-s-init_by_lua-create-main` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:704–731（新）。
- `df340-lua-s-init_by_lua-no-script-consume` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:647–659（新）。
- `df340-lua-s-init_by_lua-test-signaller-guard` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:514–528（新）。
- `df340-lua-s-init_by_lua-shared-init-guard` → stream-lua-nginx-module/`src/ngx_stream_lua_api.c`:200–215（新）。
- `df340-lua-s-init_by_lua-code-cache-vm-init` → stream-lua-nginx-module/`src/ngx_stream_lua_util.h`:302–374（新）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--init_by_lua_file

组：C-main-lifecycle。目标字段：defaults、inheritance。

本 ID 注册 post=file 加载器 → setter 检查同族 handler 后保存 init_handler/init_src → main pcalloc 零态 → 消费端以 handler 是否为空判断。

- defaults [verified]：未配置 init_by_lua 族的任何输入形式时，main_conf 的 init_handler 为 NULL、init_src 为空，不运行本族用户脚本；没有默认脚本或默认文件。配置测试或信号进程还会提前跳过模块的 VM 初始化入口。 来源：`registration`、`configuration-definition`、`df340-lua-s-init_by_lua_file-create-main`、`df340-lua-s-init_by_lua_file-no-script-consume`、`df340-lua-s-init_by_lua_file-test-signaller-guard`、`df340-lua-s-init_by_lua_file-shared-init-guard`、`df340-lua-s-init_by_lua_file-code-cache-vm-init`。
- inheritance [not_applicable]：仅在 stream 级配置，init_by_lua_block、init_by_lua、init_by_lua_file 共用 main_conf 的 init_handler/init_src 槽，同族第二次配置按 handler 非空报重复；没有 server层级合并，不同生命周期使用不同槽。 来源：`registration`、`configuration-definition`、`df340-lua-s-init_by_lua_file-create-main`、`df340-lua-s-init_by_lua_file-no-script-consume`、`df340-lua-s-init_by_lua_file-test-signaller-guard`。

未设分支以整族为单位，不能把未写 block 误称为忽略同族 inline/file。父设置/子未设置与子显式设置无合法层级分支；同一 main 再定义是重复，不是覆盖。此 file 入口配置时补全路径，不套用请求阶段 file 的 complex value 求值。

init_handler 的配置后调用、共享区全部初始化后的调用，以及 code_cache off 创建请求 VM 时的调用分别存在；本字段只断言缺省无脚本，不声称显式脚本必定只在 master 执行一次。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:199–204（冻结基线保留）。
- `configuration-definition` → stream-lua-nginx-module/`src/ngx_stream_lua_directive.c`:621–666（冻结基线保留）。
- `df340-lua-s-init_by_lua_file-create-main` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:704–731（新）。
- `df340-lua-s-init_by_lua_file-no-script-consume` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:647–659（新）。
- `df340-lua-s-init_by_lua_file-test-signaller-guard` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:514–528（新）。
- `df340-lua-s-init_by_lua_file-shared-init-guard` → stream-lua-nginx-module/`src/ngx_stream_lua_api.c`:200–215（新）。
- `df340-lua-s-init_by_lua_file-code-cache-vm-init` → stream-lua-nginx-module/`src/ngx_stream_lua_util.h`:302–374（新）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--init_worker_by_lua_block

组：C-main-lifecycle。目标字段：defaults、inheritance。

本 ID 注册 post=inline 加载器；block callback 委派专用 setter → setter 检查同族 handler 后保存 init_worker_handler/init_worker_src → main pcalloc 零态 → 消费端以 handler 是否为空判断。

- defaults [verified]：未配置 init_worker_by_lua 族的任何输入形式时，main_conf 的 init_worker_handler 为 NULL、init_worker_src 为空，不运行本族用户脚本；没有默认脚本或默认文件。 来源：`registration`、`configuration-definition`、`df340-lua-s-init_worker_by_lua_block-create-main`、`implementation-0`、`df340-lua-s-init_worker_by_lua_block-no-script-consume`、`df340-lua-s-init_worker_by_lua_block-main-handler-members`。
- inheritance [not_applicable]：仅在 stream 级配置，init_worker_by_lua_block、init_worker_by_lua、init_worker_by_lua_file 共用 main_conf 的 init_worker_handler/init_worker_src 槽，同族第二次配置按 handler 非空报重复；没有 server层级合并，不同生命周期使用不同槽。 来源：`registration`、`configuration-definition`、`df340-lua-s-init_worker_by_lua_block-create-main`、`implementation-0`、`df340-lua-s-init_worker_by_lua_block-no-script-consume`、`df340-lua-s-init_worker_by_lua_block-main-handler-members`。

未设分支以整族为单位，不能把未写 block 误称为忽略同族 inline/file。父设置/子未设置与子显式设置无合法层级分支；同一 main 再定义是重复，不是覆盖。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:206–211（冻结基线保留）。
- `configuration-definition` → stream-lua-nginx-module/`src/ngx_stream_lua_directive.c`:669–685（冻结基线保留）。
- `df340-lua-s-init_worker_by_lua_block-create-main` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:704–731（新）。
- `implementation-0` → stream-lua-nginx-module/`src/ngx_stream_lua_directive.c`:688–727（冻结基线保留）。
- `df340-lua-s-init_worker_by_lua_block-no-script-consume` → stream-lua-nginx-module/`src/ngx_stream_lua_initworkerby.c`:87–95（新）。
- `df340-lua-s-init_worker_by_lua_block-main-handler-members` → stream-lua-nginx-module/`src/ngx_stream_lua_common.h`:217–221（新）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--init_worker_by_lua

组：C-main-lifecycle。目标字段：defaults、inheritance。

本 ID 注册 post=inline 加载器 → setter 检查同族 handler 后保存 init_worker_handler/init_worker_src → main pcalloc 零态 → 消费端以 handler 是否为空判断。

- defaults [verified]：未配置 init_worker_by_lua 族的任何输入形式时，main_conf 的 init_worker_handler 为 NULL、init_worker_src 为空，不运行本族用户脚本；没有默认脚本或默认文件。 来源：`registration`、`configuration-definition`、`df340-lua-s-init_worker_by_lua-create-main`、`df340-lua-s-init_worker_by_lua-no-script-consume`、`df340-lua-s-init_worker_by_lua-main-handler-members`。
- inheritance [not_applicable]：仅在 stream 级配置，init_worker_by_lua_block、init_worker_by_lua、init_worker_by_lua_file 共用 main_conf 的 init_worker_handler/init_worker_src 槽，同族第二次配置按 handler 非空报重复；没有 server层级合并，不同生命周期使用不同槽。 来源：`registration`、`configuration-definition`、`df340-lua-s-init_worker_by_lua-create-main`、`df340-lua-s-init_worker_by_lua-no-script-consume`、`df340-lua-s-init_worker_by_lua-main-handler-members`。

未设分支以整族为单位，不能把未写 block 误称为忽略同族 inline/file。父设置/子未设置与子显式设置无合法层级分支；同一 main 再定义是重复，不是覆盖。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:213–218（冻结基线保留）。
- `configuration-definition` → stream-lua-nginx-module/`src/ngx_stream_lua_directive.c`:688–727（冻结基线保留）。
- `df340-lua-s-init_worker_by_lua-create-main` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:704–731（新）。
- `df340-lua-s-init_worker_by_lua-no-script-consume` → stream-lua-nginx-module/`src/ngx_stream_lua_initworkerby.c`:87–95（新）。
- `df340-lua-s-init_worker_by_lua-main-handler-members` → stream-lua-nginx-module/`src/ngx_stream_lua_common.h`:217–221（新）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--init_worker_by_lua_file

组：C-main-lifecycle。目标字段：defaults、inheritance。

本 ID 注册 post=file 加载器 → setter 检查同族 handler 后保存 init_worker_handler/init_worker_src → main pcalloc 零态 → 消费端以 handler 是否为空判断。

- defaults [verified]：未配置 init_worker_by_lua 族的任何输入形式时，main_conf 的 init_worker_handler 为 NULL、init_worker_src 为空，不运行本族用户脚本；没有默认脚本或默认文件。 来源：`registration`、`configuration-definition`、`df340-lua-s-init_worker_by_lua_file-create-main`、`df340-lua-s-init_worker_by_lua_file-no-script-consume`、`df340-lua-s-init_worker_by_lua_file-main-handler-members`。
- inheritance [not_applicable]：仅在 stream 级配置，init_worker_by_lua_block、init_worker_by_lua、init_worker_by_lua_file 共用 main_conf 的 init_worker_handler/init_worker_src 槽，同族第二次配置按 handler 非空报重复；没有 server层级合并，不同生命周期使用不同槽。 来源：`registration`、`configuration-definition`、`df340-lua-s-init_worker_by_lua_file-create-main`、`df340-lua-s-init_worker_by_lua_file-no-script-consume`、`df340-lua-s-init_worker_by_lua_file-main-handler-members`。

未设分支以整族为单位，不能把未写 block 误称为忽略同族 inline/file。父设置/子未设置与子显式设置无合法层级分支；同一 main 再定义是重复，不是覆盖。此 file 入口配置时补全路径，不套用请求阶段 file 的 complex value 求值。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:220–225（冻结基线保留）。
- `configuration-definition` → stream-lua-nginx-module/`src/ngx_stream_lua_directive.c`:688–727（冻结基线保留）。
- `df340-lua-s-init_worker_by_lua_file-create-main` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:704–731（新）。
- `df340-lua-s-init_worker_by_lua_file-no-script-consume` → stream-lua-nginx-module/`src/ngx_stream_lua_initworkerby.c`:87–95（新）。
- `df340-lua-s-init_worker_by_lua_file-main-handler-members` → stream-lua-nginx-module/`src/ngx_stream_lua_common.h`:217–221（新）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--preread_by_lua_file

组：E-stream-phase。目标字段：defaults、inheritance。

注册 SRV_CONF_OFFSET → file路径编译complex value → preread_src/handler → pcalloc初态 → 本阶段专属merge → 阶段入口取当前server配置。

- defaults [verified]：本层未配置且未从父级继承到 preread_by_lua 族任何形式时，preread_handler 为NULL，没有默认用户脚本或文件；本阶段Lua入口发现空handler返回NGX_DECLINED。 来源：`registration`、`configuration-definition`、`df340-lua-s-preread_by_lua_file-create-srv`、`merge-default`、`df340-lua-s-preread_by_lua_file-phase-install`、`df340-lua-s-preread_by_lua_file-no-script-consume`、`df340-lua-s-preread_by_lua_file-hierarchy`。
- inheritance [verified]：由 stream 级 srv 默认对象合并到各 server：子 preread_src.value.len 为0时复制父级本阶段源码/复杂值、handler、src_key和chunkname；子显式配置本族任一种非空形式时整体保留自己的槽，不追加父脚本，也不影响另一阶段。同层同族重复被拒绝；stream不存在location层级。 来源：`registration`、`configuration-definition`、`df340-lua-s-preread_by_lua_file-create-srv`、`merge-default`、`df340-lua-s-preread_by_lua_file-phase-install`、`df340-lua-s-preread_by_lua_file-no-script-consume`、`df340-lua-s-preread_by_lua_file-hierarchy`。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:228–233（冻结基线保留）。
- `configuration-definition` → stream-lua-nginx-module/`src/ngx_stream_lua_directive.c`:262–355（冻结基线保留）。
- `df340-lua-s-preread_by_lua_file-create-srv` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:806–856（新）。
- `merge-default` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:1018–1023（冻结基线保留）。
- `df340-lua-s-preread_by_lua_file-phase-install` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:536–543（新）。
- `df340-lua-s-preread_by_lua_file-no-script-consume` → stream-lua-nginx-module/`src/ngx_stream_lua_prereadby.c`:67–73（新）。
- `df340-lua-s-preread_by_lua_file-hierarchy` → nginx/`src/stream/ngx_stream.c`:224–239（新）。

补丁核对：新增跨组件ngx_stream.c不在有效补丁修改目标中；stream Lua本阶段setter/merge与空handler分支无直接组件补丁，不照抄HTTP行为。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--preread_by_lua_block

组：E-stream-phase。目标字段：defaults、inheritance。

注册 SRV_CONF_OFFSET → block解析后委派inline setter → preread_src/handler → pcalloc初态 → 本阶段专属merge → 阶段入口取当前server配置。

- defaults [verified]：本层未配置且未从父级继承到 preread_by_lua 族任何形式时，preread_handler 为NULL，没有默认用户脚本或文件；本阶段Lua入口发现空handler返回NGX_DECLINED。 来源：`registration`、`configuration-definition`、`df340-lua-s-preread_by_lua_block-phase-setter`、`df340-lua-s-preread_by_lua_block-create-srv`、`df340-lua-s-preread_by_lua_block-phase-merge`、`df340-lua-s-preread_by_lua_block-phase-install`、`df340-lua-s-preread_by_lua_block-no-script-consume`、`df340-lua-s-preread_by_lua_block-hierarchy`。
- inheritance [verified]：由 stream 级 srv 默认对象合并到各 server：子 preread_src.value.len 为0时复制父级本阶段源码/复杂值、handler、src_key和chunkname；子显式配置本族任一种非空形式时整体保留自己的槽，不追加父脚本，也不影响另一阶段。同层同族重复被拒绝；stream不存在location层级。 来源：`registration`、`configuration-definition`、`df340-lua-s-preread_by_lua_block-phase-setter`、`df340-lua-s-preread_by_lua_block-create-srv`、`df340-lua-s-preread_by_lua_block-phase-merge`、`df340-lua-s-preread_by_lua_block-phase-install`、`df340-lua-s-preread_by_lua_block-no-script-consume`、`df340-lua-s-preread_by_lua_block-hierarchy`。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:236–241（冻结基线保留）。
- `configuration-definition` → stream-lua-nginx-module/`src/ngx_stream_lua_directive.c`:244–283（冻结基线保留）。
- `df340-lua-s-preread_by_lua_block-phase-setter` → stream-lua-nginx-module/`src/ngx_stream_lua_directive.c`:262–355（新）。
- `df340-lua-s-preread_by_lua_block-create-srv` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:806–856（新）。
- `df340-lua-s-preread_by_lua_block-phase-merge` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:1018–1023（新）。
- `df340-lua-s-preread_by_lua_block-phase-install` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:536–543（新）。
- `df340-lua-s-preread_by_lua_block-no-script-consume` → stream-lua-nginx-module/`src/ngx_stream_lua_prereadby.c`:67–73（新）。
- `df340-lua-s-preread_by_lua_block-hierarchy` → nginx/`src/stream/ngx_stream.c`:224–239（新）。

补丁核对：新增跨组件ngx_stream.c不在有效补丁修改目标中；stream Lua本阶段setter/merge与空handler分支无直接组件补丁，不照抄HTTP行为。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--content_by_lua

组：E-stream-content。目标字段：defaults、inheritance。

server-only注册 → 专用setter写content槽并安装当前core srv handler → Lua与core create零态 → 已读两个完整merge，无content/handler传播 → content入口取当前server并检查空handler。

- defaults [verified]：未在当前server配置 content_by_lua 族任一种形式时，content_handler 为NULL、content源码为空，不由本指令安装stream core handler，没有默认Lua内容脚本；这不排除该server配置了其他内容模块。 来源：`registration`、`configuration-definition`、`df340-lua-s-content_by_lua-create-srv`、`df340-lua-s-content_by_lua-merge-srv-full`、`implementation-2`、`df340-lua-s-content_by_lua-core-create`、`df340-lua-s-content_by_lua-core-merge`、`df340-lua-s-content_by_lua-hierarchy`。
- inheritance [verified]：仅允许server内配置，不能在stream层设置供server继承；stream Lua merge_srv_conf仅复制preread/log而没有content源码、content_handler或chunkname的复制，core srv handler也没有父子复制。各server独立配置本族；inline/block/file共用本server一个content槽，同层重复或空脚本拒绝，不从其他server借用内容处理器。 来源：`registration`、`configuration-definition`、`df340-lua-s-content_by_lua-create-srv`、`df340-lua-s-content_by_lua-merge-srv-full`、`implementation-2`、`df340-lua-s-content_by_lua-core-create`、`df340-lua-s-content_by_lua-core-merge`、`df340-lua-s-content_by_lua-hierarchy`。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:245–250（冻结基线保留）。
- `configuration-definition` → stream-lua-nginx-module/`src/ngx_stream_lua_directive.c`:376–483（冻结基线保留）。
- `df340-lua-s-content_by_lua-create-srv` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:806–856（新）。
- `df340-lua-s-content_by_lua-merge-srv-full` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:861–1033（新）。
- `implementation-2` → stream-lua-nginx-module/`src/ngx_stream_lua_contentby.c`:157–208（冻结基线保留）。
- `df340-lua-s-content_by_lua-core-create` → nginx/`src/stream/ngx_stream_core_module.c`:679–711（新）。
- `df340-lua-s-content_by_lua-core-merge` → nginx/`src/stream/ngx_stream_core_module.c`:715–795（新）。
- `df340-lua-s-content_by_lua-hierarchy` → nginx/`src/stream/ngx_stream.c`:224–239（新）。

补丁核对：新增ngx_stream.c与ngx_stream_core_module.c的本次create/merge范围无有效补丁修改；后者也与既有审计unchanged目标相符。不把HTTP content槽复制套到本域。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--content_by_lua_block

组：E-stream-content。目标字段：defaults、inheritance。

server-only注册 → 专用setter写content槽并安装当前core srv handler → Lua与core create零态 → 已读两个完整merge，无content/handler传播 → content入口取当前server并检查空handler。

- defaults [verified]：未在当前server配置 content_by_lua 族任一种形式时，content_handler 为NULL、content源码为空，不由本指令安装stream core handler，没有默认Lua内容脚本；这不排除该server配置了其他内容模块。 来源：`registration`、`configuration-definition`、`implementation-0`、`df340-lua-s-content_by_lua_block-create-srv`、`df340-lua-s-content_by_lua_block-merge-srv-full`、`implementation-4`、`df340-lua-s-content_by_lua_block-core-create`、`df340-lua-s-content_by_lua_block-core-merge`、`df340-lua-s-content_by_lua_block-hierarchy`。
- inheritance [verified]：仅允许server内配置，不能在stream层设置供server继承；stream Lua merge_srv_conf仅复制preread/log而没有content源码、content_handler或chunkname的复制，core srv handler也没有父子复制。各server独立配置本族；inline/block/file共用本server一个content槽，同层重复或空脚本拒绝，不从其他server借用内容处理器。 来源：`registration`、`configuration-definition`、`implementation-0`、`df340-lua-s-content_by_lua_block-create-srv`、`df340-lua-s-content_by_lua_block-merge-srv-full`、`implementation-4`、`df340-lua-s-content_by_lua_block-core-create`、`df340-lua-s-content_by_lua_block-core-merge`、`df340-lua-s-content_by_lua_block-hierarchy`。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:253–258（冻结基线保留）。
- `configuration-definition` → stream-lua-nginx-module/`src/ngx_stream_lua_directive.c`:357–373（冻结基线保留）。
- `implementation-0` → stream-lua-nginx-module/`src/ngx_stream_lua_directive.c`:376–483（冻结基线保留）。
- `df340-lua-s-content_by_lua_block-create-srv` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:806–856（新）。
- `df340-lua-s-content_by_lua_block-merge-srv-full` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:861–1033（新）。
- `implementation-4` → stream-lua-nginx-module/`src/ngx_stream_lua_contentby.c`:157–208（冻结基线保留）。
- `df340-lua-s-content_by_lua_block-core-create` → nginx/`src/stream/ngx_stream_core_module.c`:679–711（新）。
- `df340-lua-s-content_by_lua_block-core-merge` → nginx/`src/stream/ngx_stream_core_module.c`:715–795（新）。
- `df340-lua-s-content_by_lua_block-hierarchy` → nginx/`src/stream/ngx_stream.c`:224–239（新）。

补丁核对：新增ngx_stream.c与ngx_stream_core_module.c的本次create/merge范围无有效补丁修改；后者也与既有审计unchanged目标相符。不把HTTP content槽复制套到本域。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--content_by_lua_file

组：E-stream-content。目标字段：defaults、inheritance。

server-only注册 → 专用setter写content槽并安装当前core srv handler → Lua与core create零态 → 已读两个完整merge，无content/handler传播 → content入口取当前server并检查空handler。

- defaults [verified]：未在当前server配置 content_by_lua 族任一种形式时，content_handler 为NULL、content源码为空，不由本指令安装stream core handler，没有默认Lua内容脚本；这不排除该server配置了其他内容模块。 来源：`registration`、`configuration-definition`、`df340-lua-s-content_by_lua_file-create-srv`、`df340-lua-s-content_by_lua_file-merge-srv-full`、`implementation-2`、`df340-lua-s-content_by_lua_file-core-create`、`df340-lua-s-content_by_lua_file-core-merge`、`df340-lua-s-content_by_lua_file-hierarchy`。
- inheritance [verified]：仅允许server内配置，不能在stream层设置供server继承；stream Lua merge_srv_conf仅复制preread/log而没有content源码、content_handler或chunkname的复制，core srv handler也没有父子复制。各server独立配置本族；inline/block/file共用本server一个content槽，同层重复或空脚本拒绝，不从其他server借用内容处理器。 来源：`registration`、`configuration-definition`、`df340-lua-s-content_by_lua_file-create-srv`、`df340-lua-s-content_by_lua_file-merge-srv-full`、`implementation-2`、`df340-lua-s-content_by_lua_file-core-create`、`df340-lua-s-content_by_lua_file-core-merge`、`df340-lua-s-content_by_lua_file-hierarchy`。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:261–266（冻结基线保留）。
- `configuration-definition` → stream-lua-nginx-module/`src/ngx_stream_lua_directive.c`:376–483（冻结基线保留）。
- `df340-lua-s-content_by_lua_file-create-srv` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:806–856（新）。
- `df340-lua-s-content_by_lua_file-merge-srv-full` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:861–1033（新）。
- `implementation-2` → stream-lua-nginx-module/`src/ngx_stream_lua_contentby.c`:157–208（冻结基线保留）。
- `df340-lua-s-content_by_lua_file-core-create` → nginx/`src/stream/ngx_stream_core_module.c`:679–711（新）。
- `df340-lua-s-content_by_lua_file-core-merge` → nginx/`src/stream/ngx_stream_core_module.c`:715–795（新）。
- `df340-lua-s-content_by_lua_file-hierarchy` → nginx/`src/stream/ngx_stream.c`:224–239（新）。

补丁核对：新增ngx_stream.c与ngx_stream_core_module.c的本次create/merge范围无有效补丁修改；后者也与既有审计unchanged目标相符。不把HTTP content槽复制套到本域。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--log_by_lua_block

组：E-stream-phase。目标字段：defaults、inheritance。

注册 SRV_CONF_OFFSET → block解析后委派inline setter → log_src/handler → pcalloc初态 → 本阶段专属merge → 阶段入口取当前server配置。

- defaults [verified]：本层未配置且未从父级继承到 log_by_lua 族任何形式时，log_handler 为NULL，没有默认用户脚本或文件；本阶段Lua入口发现空handler返回NGX_DECLINED。 来源：`registration`、`configuration-definition`、`implementation-0`、`df340-lua-s-log_by_lua_block-create-srv`、`merge-default`、`implementation-3`、`df340-lua-s-log_by_lua_block-no-script-consume`、`df340-lua-s-log_by_lua_block-hierarchy`。
- inheritance [verified]：由 stream 级 srv 默认对象合并到各 server：子 log_src.value.len 为0时复制父级本阶段源码/复杂值、handler、src_key和chunkname；子显式配置本族任一种非空形式时整体保留自己的槽，不追加父脚本，也不影响另一阶段。同层同族重复被拒绝；stream不存在location层级。 来源：`registration`、`configuration-definition`、`implementation-0`、`df340-lua-s-log_by_lua_block-create-srv`、`merge-default`、`implementation-3`、`df340-lua-s-log_by_lua_block-no-script-consume`、`df340-lua-s-log_by_lua_block-hierarchy`。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:271–277（冻结基线保留）。
- `configuration-definition` → stream-lua-nginx-module/`src/ngx_stream_lua_directive.c`:486–502（冻结基线保留）。
- `implementation-0` → stream-lua-nginx-module/`src/ngx_stream_lua_directive.c`:505–597（冻结基线保留）。
- `df340-lua-s-log_by_lua_block-create-srv` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:806–856（新）。
- `merge-default` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:1025–1030（冻结基线保留）。
- `implementation-3` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:551–571（冻结基线保留）。
- `df340-lua-s-log_by_lua_block-no-script-consume` → stream-lua-nginx-module/`src/ngx_stream_lua_logby.c`:121–126（新）。
- `df340-lua-s-log_by_lua_block-hierarchy` → nginx/`src/stream/ngx_stream.c`:224–239（新）。

补丁核对：新增跨组件ngx_stream.c不在有效补丁修改目标中；stream Lua本阶段setter/merge与空handler分支无直接组件补丁，不照抄HTTP行为。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--log_by_lua_file

组：E-stream-phase。目标字段：defaults、inheritance。

注册 SRV_CONF_OFFSET → file路径编译complex value → log_src/handler → pcalloc初态 → 本阶段专属merge → 阶段入口取当前server配置。

- defaults [verified]：本层未配置且未从父级继承到 log_by_lua 族任何形式时，log_handler 为NULL，没有默认用户脚本或文件；本阶段Lua入口发现空handler返回NGX_DECLINED。 来源：`registration`、`configuration-definition`、`df340-lua-s-log_by_lua_file-create-srv`、`merge-default`、`implementation-1`、`df340-lua-s-log_by_lua_file-no-script-consume`、`df340-lua-s-log_by_lua_file-hierarchy`。
- inheritance [verified]：由 stream 级 srv 默认对象合并到各 server：子 log_src.value.len 为0时复制父级本阶段源码/复杂值、handler、src_key和chunkname；子显式配置本族任一种非空形式时整体保留自己的槽，不追加父脚本，也不影响另一阶段。同层同族重复被拒绝；stream不存在location层级。 来源：`registration`、`configuration-definition`、`df340-lua-s-log_by_lua_file-create-srv`、`merge-default`、`implementation-1`、`df340-lua-s-log_by_lua_file-no-script-consume`、`df340-lua-s-log_by_lua_file-hierarchy`。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:279–285（冻结基线保留）。
- `configuration-definition` → stream-lua-nginx-module/`src/ngx_stream_lua_directive.c`:505–597（冻结基线保留）。
- `df340-lua-s-log_by_lua_file-create-srv` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:806–856（新）。
- `merge-default` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:1025–1030（冻结基线保留）。
- `implementation-1` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:551–571（冻结基线保留）。
- `df340-lua-s-log_by_lua_file-no-script-consume` → stream-lua-nginx-module/`src/ngx_stream_lua_logby.c`:121–126（新）。
- `df340-lua-s-log_by_lua_file-hierarchy` → nginx/`src/stream/ngx_stream.c`:224–239（新）。

补丁核对：新增跨组件ngx_stream.c不在有效补丁修改目标中；stream Lua本阶段setter/merge与空handler分支无直接组件补丁，不照抄HTTP行为。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--preread_by_lua_no_postpone

组：A-main-scalar。目标字段：inheritance。

注册限定 main → setter 写 postponed_to_preread_phase_end → create/init 设置初态及缺省 → 消费端读取同一 main_conf。父设置/子未设置与子显式覆盖均不是本指令合法配置分支。

- inheritance [not_applicable]：仅能在stream级配置，写入本模块唯一 main_conf 的 postponed_to_preread_phase_end；server不创建该参数的独立槽，也不进行父子合并。首次阶段处理更新同一 main 标志，不是 server 覆盖。 来源：`registration`、`configuration-definition`、`df340-lua-s-preread_by_lua_no_postpone-create`、`merge-default`、`df340-lua-s-preread_by_lua_no_postpone-consume`。

未设置路径：stream init 所列缺省仅用于解释单层 main 配置；本批不改 manifest 外 defaults。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:287–292（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1026–1062（冻结基线保留）。
- `df340-lua-s-preread_by_lua_no_postpone-create` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:741–741（新）。
- `merge-default` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:545–547（冻结基线保留）。
- `df340-lua-s-preread_by_lua_no_postpone-consume` → stream-lua-nginx-module/`src/ngx_stream_lua_prereadby.c`:36–65（新）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--balancer_by_lua_block

组：G-upstream-balancer。目标字段：defaults、inheritance。

本ID UPS_CONF/SRV_CONF_OFFSET → block委派或file setter保存balancer子结构 → 本upstream单独create_srv_conf → setter改当前uscf.peer.init_upstream → init_peer从选中upstream拿本域conf。

- defaults [verified]：当前 upstream 未配置 balancer_by_lua 族时，本模块的 balancer.handler 为NULL，不由该族把 peer.init_upstream 替换为 Lua balancer 初始化器；没有默认 Lua 均衡脚本或默认文件。其余上游均衡方式按当前 upstream 自身配置处理。 来源：`registration`、`configuration-definition`、`df340-lua-s-balancer_by_lua_block-create-balancer-conf`、`df340-lua-s-balancer_by_lua_block-upstream-independent-conf`、`implementation-0`、`df340-lua-s-balancer_by_lua_block-balancer-init-peer`。
- inheritance [not_applicable]：仅 upstream 内配置，使用该 upstream 单独创建的 Lua srv_conf.balancer 子结构；不会经过虚拟主机 server 的 Lua srv merge，也不从其他 upstream 或普通 Lua 阶段槽继承。block/file 共用当前 upstream 的 balancer.handler/src 槽，同族重复拒绝；显式配置安装当前 upstream 的 Lua peer 初始化回调。 来源：`registration`、`configuration-definition`、`df340-lua-s-balancer_by_lua_block-create-balancer-conf`、`df340-lua-s-balancer_by_lua_block-upstream-independent-conf`、`implementation-0`、`df340-lua-s-balancer_by_lua_block-balancer-init-peer`。

block保存inline脚本；共享handler槽不等于与其他阶段或另一upstream共槽。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:294–299（冻结基线保留）。
- `configuration-definition` → stream-lua-nginx-module/`src/ngx_stream_lua_balancer.c`:118–134（冻结基线保留）。
- `df340-lua-s-balancer_by_lua_block-create-balancer-conf` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:806–856（新）。
- `df340-lua-s-balancer_by_lua_block-upstream-independent-conf` → nginx/`src/stream/ngx_stream_upstream.c`:337–383（新）。
- `implementation-0` → stream-lua-nginx-module/`src/ngx_stream_lua_balancer.c`:137–223（冻结基线保留）。
- `df340-lua-s-balancer_by_lua_block-balancer-init-peer` → stream-lua-nginx-module/`src/ngx_stream_lua_balancer.c`:226–293（新）。

补丁核对：新增HTTP upstream独立配置对象片段6090–6133须与该文件的有效补丁分开：balancer_status_code改 upstream_connect 对特殊状态码的收尾分支，upstream_pipelining/upstream_timeout_fields改其他运行字段，均不改此create_srv_conf循环；stream upstream对象构建文件无有效补丁修改。本次不重述这些补丁改变的运行字段，既有affected/unaffected原结论保留。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--balancer_by_lua_file

组：G-upstream-balancer。目标字段：defaults、inheritance。

本ID UPS_CONF/SRV_CONF_OFFSET → block委派或file setter保存balancer子结构 → 本upstream单独create_srv_conf → setter改当前uscf.peer.init_upstream → init_peer从选中upstream拿本域conf。

- defaults [verified]：当前 upstream 未配置 balancer_by_lua 族时，本模块的 balancer.handler 为NULL，不由该族把 peer.init_upstream 替换为 Lua balancer 初始化器；没有默认 Lua 均衡脚本或默认文件。其余上游均衡方式按当前 upstream 自身配置处理。 来源：`registration`、`configuration-definition`、`df340-lua-s-balancer_by_lua_file-create-balancer-conf`、`df340-lua-s-balancer_by_lua_file-upstream-independent-conf`、`df340-lua-s-balancer_by_lua_file-balancer-init-peer`。
- inheritance [not_applicable]：仅 upstream 内配置，使用该 upstream 单独创建的 Lua srv_conf.balancer 子结构；不会经过虚拟主机 server 的 Lua srv merge，也不从其他 upstream 或普通 Lua 阶段槽继承。block/file 共用当前 upstream 的 balancer.handler/src 槽，同族重复拒绝；显式配置安装当前 upstream 的 Lua peer 初始化回调。 来源：`registration`、`configuration-definition`、`df340-lua-s-balancer_by_lua_file-create-balancer-conf`、`df340-lua-s-balancer_by_lua_file-upstream-independent-conf`、`df340-lua-s-balancer_by_lua_file-balancer-init-peer`。

配置时rebase脚本路径，保存同族src；不把它视为请求变量化路径。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:301–306（冻结基线保留）。
- `configuration-definition` → stream-lua-nginx-module/`src/ngx_stream_lua_balancer.c`:137–223（冻结基线保留）。
- `df340-lua-s-balancer_by_lua_file-create-balancer-conf` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:806–856（新）。
- `df340-lua-s-balancer_by_lua_file-upstream-independent-conf` → nginx/`src/stream/ngx_stream_upstream.c`:337–383（新）。
- `df340-lua-s-balancer_by_lua_file-balancer-init-peer` → stream-lua-nginx-module/`src/ngx_stream_lua_balancer.c`:226–293（新）。

补丁核对：新增HTTP upstream独立配置对象片段6090–6133须与该文件的有效补丁分开：balancer_status_code改 upstream_connect 对特殊状态码的收尾分支，upstream_pipelining/upstream_timeout_fields改其他运行字段，均不改此create_srv_conf循环；stream upstream对象构建文件无有效补丁修改。本次不重述这些补丁改变的运行字段，既有affected/unaffected原结论保留。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_socket_keepalive_timeout

组：D-scalar-merge。目标字段：inheritance。

本 ID 的 offset 指向 keepalive_timeout → src/core/ngx_conf_file.c 的注册 setter → create 设置对应 UNSET → 所列专属 merge 调用及公共宏决定父/子选择 → 消费端读取合并对象。

- inheritance [verified]：写入 srv_conf 的 keepalive_timeout。由 stream 的 srv 默认对象合并到各 server，不存在 HTTP location 层级；子项仍为对应 UNSET 哨兵时取父值，子项显式设置则保留，不累加。父子均未设置才采用该字段 merge 的缺省。运行时 setkeepalive 的显式参数可另行覆盖；不把 Lua API 参数当成配置继承。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_socket_keepalive_timeout-create-slot`、`merge-default`、`df340-lua-s-lua_socket_keepalive_timeout-merge-macro`、`df340-lua-s-lua_socket_keepalive_timeout-hierarchy`、`df340-lua-s-lua_socket_keepalive_timeout-consume`。

未设置、父设子未设、子显式设置三路均由本字段 merge 宏核对。只补 inheritance；已有 defaults、运行限制及其来源保持。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:309–315（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1260–1287（冻结基线保留）。
- `df340-lua-s-lua_socket_keepalive_timeout-create-slot` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:840–846（新）。
- `merge-default` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:995–996（冻结基线保留）。
- `df340-lua-s-lua_socket_keepalive_timeout-merge-macro` → nginx/`src/core/ngx_conf_file.h`:220–223（新）。
- `df340-lua-s-lua_socket_keepalive_timeout-hierarchy` → nginx/`src/stream/ngx_stream.c`:224–239（新）。
- `df340-lua-s-lua_socket_keepalive_timeout-consume` → stream-lua-nginx-module/`src/ngx_stream_lua_socket_tcp.c`:5267–5272（新）。

补丁核对：新增跨 Nginx 来源限定 ngx_conf_file.h 与 ngx_stream.c；34条有效补丁没有改这些文件，已核有效目标集及固定补丁头。Lua setter/create/merge/消费来自未直接打补丁的本组件；不外推 socket/事件运行链整体无补丁影响。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_socket_connect_timeout

组：D-scalar-merge。目标字段：inheritance。

本 ID 的 offset 指向 connect_timeout → src/core/ngx_conf_file.c 的注册 setter → create 设置对应 UNSET → 所列专属 merge 调用及公共宏决定父/子选择 → 消费端读取合并对象。

- inheritance [verified]：写入 srv_conf 的 connect_timeout。由 stream 的 srv 默认对象合并到各 server，不存在 HTTP location 层级；子项仍为对应 UNSET 哨兵时取父值，子项显式设置则保留，不累加。父子均未设置才采用该字段 merge 的缺省。这是配置对象的继承；运行时 socket API 的独立超时值仍可覆盖此次合并值。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_socket_connect_timeout-create-slot`、`merge-default`、`df340-lua-s-lua_socket_connect_timeout-merge-macro`、`df340-lua-s-lua_socket_connect_timeout-hierarchy`、`df340-lua-s-lua_socket_connect_timeout-consume`。

未设置、父设子未设、子显式设置三路均由本字段 merge 宏核对。只补 inheritance；已有 defaults、运行限制及其来源保持。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:317–323（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1260–1287（冻结基线保留）。
- `df340-lua-s-lua_socket_connect_timeout-create-slot` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:840–846（新）。
- `merge-default` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:998–999（冻结基线保留）。
- `df340-lua-s-lua_socket_connect_timeout-merge-macro` → nginx/`src/core/ngx_conf_file.h`:220–223（新）。
- `df340-lua-s-lua_socket_connect_timeout-hierarchy` → nginx/`src/stream/ngx_stream.c`:224–239（新）。
- `df340-lua-s-lua_socket_connect_timeout-consume` → stream-lua-nginx-module/`src/ngx_stream_lua_socket_tcp.c`:1081–1086（新）。

补丁核对：新增跨 Nginx 来源限定 ngx_conf_file.h 与 ngx_stream.c；34条有效补丁没有改这些文件，已核有效目标集及固定补丁头。Lua setter/create/merge/消费来自未直接打补丁的本组件；不外推 socket/事件运行链整体无补丁影响。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_socket_send_timeout

组：D-scalar-merge。目标字段：inheritance。

本 ID 的 offset 指向 send_timeout → src/core/ngx_conf_file.c 的注册 setter → create 设置对应 UNSET → 所列专属 merge 调用及公共宏决定父/子选择 → 消费端读取合并对象。

- inheritance [verified]：写入 srv_conf 的 send_timeout。由 stream 的 srv 默认对象合并到各 server，不存在 HTTP location 层级；子项仍为对应 UNSET 哨兵时取父值，子项显式设置则保留，不累加。父子均未设置才采用该字段 merge 的缺省。这是配置对象的继承；运行时 socket API 的独立超时值仍可覆盖此次合并值。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_socket_send_timeout-create-slot`、`merge-default`、`df340-lua-s-lua_socket_send_timeout-merge-macro`、`df340-lua-s-lua_socket_send_timeout-hierarchy`、`implementation-0`。

未设置、父设子未设、子显式设置三路均由本字段 merge 宏核对。只补 inheritance；已有 defaults、运行限制及其来源保持。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:325–331（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1260–1287（冻结基线保留）。
- `df340-lua-s-lua_socket_send_timeout-create-slot` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:840–846（新）。
- `merge-default` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:1001–1002（冻结基线保留）。
- `df340-lua-s-lua_socket_send_timeout-merge-macro` → nginx/`src/core/ngx_conf_file.h`:220–223（新）。
- `df340-lua-s-lua_socket_send_timeout-hierarchy` → nginx/`src/stream/ngx_stream.c`:224–239（新）。
- `implementation-0` → stream-lua-nginx-module/`src/ngx_stream_lua_socket_tcp.c`:1088–1093（冻结基线保留）。

补丁核对：新增跨 Nginx 来源限定 ngx_conf_file.h 与 ngx_stream.c；34条有效补丁没有改这些文件，已核有效目标集及固定补丁头。Lua setter/create/merge/消费来自未直接打补丁的本组件；不外推 socket/事件运行链整体无补丁影响。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_socket_send_lowat

组：D-scalar-merge。目标字段：inheritance。

本 ID 的 offset 指向 send_lowat → src/core/ngx_conf_file.c 的注册 setter → create 设置对应 UNSET → 所列专属 merge 调用及公共宏决定父/子选择 → 消费端读取合并对象。

- inheritance [verified]：写入 srv_conf 的 send_lowat。由 stream 的 srv 默认对象合并到各 server，不存在 HTTP location 层级；子项仍为对应 UNSET 哨兵时取父值，子项显式设置则保留，不累加。父子均未设置才采用该字段 merge 的缺省。显式值先经过 lowat 平台 post 检查；不支持 SO_SNDLOWAT 的分支告警并改为0，此后合并实际保存值。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_socket_send_lowat-create-slot`、`merge-default`、`df340-lua-s-lua_socket_send_lowat-merge-macro`、`df340-lua-s-lua_socket_send_lowat-hierarchy`、`implementation-2`、`implementation-0`、`implementation-1`。

未设置、父设子未设、子显式设置三路均由本字段 merge 宏核对。只补 inheritance；已有 defaults、运行限制及其来源保持。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:333–339（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1198–1225（冻结基线保留）。
- `df340-lua-s-lua_socket_send_lowat-create-slot` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:840–846（新）。
- `merge-default` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:1007–1008（冻结基线保留）。
- `df340-lua-s-lua_socket_send_lowat-merge-macro` → nginx/`src/core/ngx_conf_file.h`:230–233（新）。
- `df340-lua-s-lua_socket_send_lowat-hierarchy` → nginx/`src/stream/ngx_stream.c`:224–239（新）。
- `implementation-2` → stream-lua-nginx-module/`src/ngx_stream_lua_socket_tcp.c`:3558–3567（冻结基线保留）。
- `implementation-0` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:64–65（冻结基线保留）。
- `implementation-1` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:668–694（冻结基线保留）。

补丁核对：新增跨 Nginx 来源限定 ngx_conf_file.h 与 ngx_stream.c；34条有效补丁没有改这些文件，已核有效目标集及固定补丁头。Lua setter/create/merge/消费来自未直接打补丁的本组件；不外推 socket/事件运行链整体无补丁影响。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_socket_buffer_size

组：D-scalar-merge。目标字段：inheritance。

本 ID 的 offset 指向 buffer_size → src/core/ngx_conf_file.c 的注册 setter → create 设置对应 UNSET → 所列专属 merge 调用及公共宏决定父/子选择 → 消费端读取合并对象。

- inheritance [verified]：写入 srv_conf 的 buffer_size。由 stream 的 srv 默认对象合并到各 server，不存在 HTTP location 层级；子项仍为对应 UNSET 哨兵时取父值，子项显式设置则保留，不累加。父子均未设置才采用该字段 merge 的缺省。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_socket_buffer_size-create-slot`、`merge-default`、`df340-lua-s-lua_socket_buffer_size-merge-macro`、`df340-lua-s-lua_socket_buffer_size-hierarchy`、`implementation-0`。

未设置、父设子未设、子显式设置三路均由本字段 merge 宏核对。只补 inheritance；已有 defaults、运行限制及其来源保持。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:341–347（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1198–1225（冻结基线保留）。
- `df340-lua-s-lua_socket_buffer_size-create-slot` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:840–846（新）。
- `merge-default` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:1010–1012（冻结基线保留）。
- `df340-lua-s-lua_socket_buffer_size-merge-macro` → nginx/`src/core/ngx_conf_file.h`:230–233（新）。
- `df340-lua-s-lua_socket_buffer_size-hierarchy` → nginx/`src/stream/ngx_stream.c`:224–239（新）。
- `implementation-0` → stream-lua-nginx-module/`src/ngx_stream_lua_socket_tcp.c`:2226–2238（冻结基线保留）。

补丁核对：新增跨 Nginx 来源限定 ngx_conf_file.h 与 ngx_stream.c；34条有效补丁没有改这些文件，已核有效目标集及固定补丁头。Lua setter/create/merge/消费来自未直接打补丁的本组件；不外推 socket/事件运行链整体无补丁影响。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_socket_pool_size

组：D-scalar-merge。目标字段：inheritance。

本 ID 的 offset 指向 pool_size → src/core/ngx_conf_file.c 的注册 setter → create 设置对应 UNSET → 所列专属 merge 调用及公共宏决定父/子选择 → 消费端读取合并对象。

- inheritance [verified]：写入 srv_conf 的 pool_size。由 stream 的 srv 默认对象合并到各 server，不存在 HTTP location 层级；子项仍为对应 UNSET 哨兵时取父值，子项显式设置则保留，不累加。父子均未设置才采用该字段 merge 的缺省。运行时 setkeepalive 的显式参数可另行覆盖；不把 Lua API 参数当成配置继承。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_socket_pool_size-create-slot`、`merge-default`、`df340-lua-s-lua_socket_pool_size-merge-macro`、`df340-lua-s-lua_socket_pool_size-hierarchy`、`df340-lua-s-lua_socket_pool_size-consume`。

未设置、父设子未设、子显式设置三路均由本字段 merge 宏核对。只补 inheritance；已有 defaults、运行限制及其来源保持。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:349–355（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1167–1194（冻结基线保留）。
- `df340-lua-s-lua_socket_pool_size-create-slot` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:840–846（新）。
- `merge-default` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:1014–1014（冻结基线保留）。
- `df340-lua-s-lua_socket_pool_size-merge-macro` → nginx/`src/core/ngx_conf_file.h`:215–218（新）。
- `df340-lua-s-lua_socket_pool_size-hierarchy` → nginx/`src/stream/ngx_stream.c`:224–239（新）。
- `df340-lua-s-lua_socket_pool_size-consume` → stream-lua-nginx-module/`src/ngx_stream_lua_socket_tcp.c`:5274–5280（新）。

补丁核对：新增跨 Nginx 来源限定 ngx_conf_file.h 与 ngx_stream.c；34条有效补丁没有改这些文件，已核有效目标集及固定补丁头。Lua setter/create/merge/消费来自未直接打补丁的本组件；不外推 socket/事件运行链整体无补丁影响。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_socket_read_timeout

组：D-scalar-merge。目标字段：inheritance。

本 ID 的 offset 指向 read_timeout → src/core/ngx_conf_file.c 的注册 setter → create 设置对应 UNSET → 所列专属 merge 调用及公共宏决定父/子选择 → 消费端读取合并对象。

- inheritance [verified]：写入 srv_conf 的 read_timeout。由 stream 的 srv 默认对象合并到各 server，不存在 HTTP location 层级；子项仍为对应 UNSET 哨兵时取父值，子项显式设置则保留，不累加。父子均未设置才采用该字段 merge 的缺省。这是配置对象的继承；运行时 socket API 的独立超时值仍可覆盖此次合并值。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_socket_read_timeout-create-slot`、`merge-default`、`df340-lua-s-lua_socket_read_timeout-merge-macro`、`df340-lua-s-lua_socket_read_timeout-hierarchy`、`implementation-0`。

未设置、父设子未设、子显式设置三路均由本字段 merge 宏核对。只补 inheritance；已有 defaults、运行限制及其来源保持。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:357–363（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1260–1287（冻结基线保留）。
- `df340-lua-s-lua_socket_read_timeout-create-slot` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:840–846（新）。
- `merge-default` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:1004–1005（冻结基线保留）。
- `df340-lua-s-lua_socket_read_timeout-merge-macro` → nginx/`src/core/ngx_conf_file.h`:220–223（新）。
- `df340-lua-s-lua_socket_read_timeout-hierarchy` → nginx/`src/stream/ngx_stream.c`:224–239（新）。
- `implementation-0` → stream-lua-nginx-module/`src/ngx_stream_lua_socket_tcp.c`:1095–1100（冻结基线保留）。

补丁核对：新增跨 Nginx 来源限定 ngx_conf_file.h 与 ngx_stream.c；34条有效补丁没有改这些文件，已核有效目标集及固定补丁头。Lua setter/create/merge/消费来自未直接打补丁的本组件；不外推 socket/事件运行链整体无补丁影响。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_check_client_abort

组：D-scalar-merge。目标字段：inheritance。

本 ID 的 offset 指向 check_client_abort → src/core/ngx_conf_file.c 的注册 setter → create 设置对应 UNSET → 所列专属 merge 调用及公共宏决定父/子选择 → 消费端读取合并对象。

- inheritance [verified]：写入 srv_conf 的 check_client_abort。由 stream 的 srv 默认对象合并到各 server，不存在 HTTP location 层级；子项仍为对应 UNSET 哨兵时取父值，子项显式设置则保留，不累加。父子均未设置才采用该字段 merge 的缺省。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_check_client_abort-create-slot`、`merge-default`、`df340-lua-s-lua_check_client_abort-merge-macro`、`df340-lua-s-lua_check_client_abort-hierarchy`、`df340-lua-s-lua_check_client_abort-consume`。

未设置、父设子未设、子显式设置三路均由本字段 merge 宏核对。只补 inheritance；已有 defaults、运行限制及其来源保持。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:366–372（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1026–1062（冻结基线保留）。
- `df340-lua-s-lua_check_client_abort-create-slot` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:837–838（新）。
- `merge-default` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:993–993（冻结基线保留）。
- `df340-lua-s-lua_check_client_abort-merge-macro` → nginx/`src/core/ngx_conf_file.h`:205–208（新）。
- `df340-lua-s-lua_check_client_abort-hierarchy` → nginx/`src/stream/ngx_stream.c`:224–239（新）。
- `df340-lua-s-lua_check_client_abort-consume` → stream-lua-nginx-module/`src/ngx_stream_lua_contentby.c`:100–120（新）。

补丁核对：新增跨 Nginx 来源限定 ngx_conf_file.h 与 ngx_stream.c；34条有效补丁没有改这些文件，已核有效目标集及固定补丁头。Lua setter/create/merge/消费来自未直接打补丁的本组件；不外推 socket/事件运行链整体无补丁影响。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_malloc_trim

组：A-main-scalar。目标字段：inheritance。

注册限定 main → setter 写 malloc_trim_cycle → create/init 设置初态及缺省 → 消费端读取同一 main_conf。父设置/子未设置与子显式覆盖均不是本指令合法配置分支。

- inheritance [not_applicable]：仅能在stream级配置，写入本模块唯一 main_conf 的 malloc_trim_cycle；server不创建该参数的独立槽，也不进行父子合并。仅编译支持时生效；非零显式配置设置 requires_log，缺省阈值不保证挂接日志计数入口。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_malloc_trim-create`、`merge-default`、`df340-lua-s-lua_malloc_trim-consume`、`implementation-0`。

未设置路径：stream init 所列缺省仅用于解释单层 main 配置；本批不改 manifest 外 defaults。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:466–471（冻结基线保留）。
- `configuration-definition` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:1136–1168（冻结基线保留）。
- `df340-lua-s-lua_malloc_trim-create` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:745–747（新）。
- `merge-default` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:789–793（冻结基线保留）。
- `df340-lua-s-lua_malloc_trim-consume` → stream-lua-nginx-module/`src/ngx_stream_lua_logby.c`:87–108（新）。
- `implementation-0` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:551–571（冻结基线保留）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_add_variable

组：B-main-special。目标字段：defaults、inheritance。

main 注册 → ngx_stream_lua_add_variable → ngx_stream_add_variable 的 core main 表 → 无 getter 才挂 undefined_var → getter 置 not_found。父/子覆盖不是合法分支。

- defaults [verified]：未配置本指令时，不由它声明任何变量，也没有隐含变量名或初始字符串。显式声明后，只有原变量没有 getter 才安装返回 not_found 的 getter；其他模块已声明或赋值的变量需按各自逻辑处理。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_add_variable-declaration`、`implementation-2`。
- inheritance [not_applicable]：仅 stream 级声明，注册到 stream core 的 main_conf 变量表并取得索引，server 共享该表，不是父子变量值合并。已有不可变变量会报重复，可变变量可复用；声明不等于运行时赋值。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_add_variable-declaration`、`implementation-2`。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:473–478（冻结基线保留）。
- `configuration-definition` → stream-lua-nginx-module/`src/ngx_stream_lua_directive.c`:1300–1335（冻结基线保留）。
- `df340-lua-s-lua_add_variable-declaration` → stream-lua-nginx-module/`src/ngx_stream_lua_directive.c`:1290–1335（新）。
- `implementation-2` → nginx/`src/stream/ngx_stream_variables.c`:149–218（冻结基线保留）。

补丁核对：新引用限该 Lua 组件、未被有效补丁修改的公共配置 setter/宏及相应生命周期路径；核对边界见报告总则。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--ssl_client_hello_by_lua_block

组：H-downstream-tls。目标字段：defaults、inheritance。

本ID的 MAIN/SRV_CONF与SRV_CONF_OFFSET → block委派inline setter → srv.ssl_client_hello_src/handler → pcalloc零态 → 本族merge与SSL_CTX安装分支 → 回调从所选server读取本族槽。

- defaults [verified]：在 NGX_HTTP_SSL 可用分支，当前server既无本族有效源码也未取得父级本族源码时，srv.ssl_client_hello_handler 初始为NULL，不由本族安装Lua ssl_client_hello 回调；没有默认脚本或默认文件。这不关闭Nginx自身的TLS处理。 来源：`registration`、`configuration-definition`、`implementation-0`、`df340-lua-h-ssl_client_hello_by_lua_block-create-tls-srv`、`implementation-3`、`df340-lua-h-ssl_client_hello_by_lua_block-tls-script-consume`、`df340-lua-h-ssl_client_hello_by_lua_block-server-hierarchy`。
- inheritance [verified]：http的srv默认对象→server。按 srv.ssl_client_hello_src.len==0 判定未设，复制父级本族源码、handler和src_key，并复制src_ref和chunkname；本层有效非零长度源码保留自己的整套槽，不追加父脚本。本族block/file共槽且同层重复拒绝，其他TLS阶段使用独立槽。继承发生在SSL_CTX检查之前：合并后源码非空时，当前server缺少SSL_CTX会报no ssl configured；LibreSSL拒绝，还要求SSL_ERROR_WANT_CLIENT_HELLO_CB（至少OpenSSL1.1.1）才安装对应回调。 来源：`registration`、`configuration-definition`、`implementation-0`、`df340-lua-h-ssl_client_hello_by_lua_block-create-tls-srv`、`implementation-3`、`df340-lua-h-ssl_client_hello_by_lua_block-tls-script-consume`、`df340-lua-h-ssl_client_hello_by_lua_block-server-hierarchy`。

本族merge以src.len为准；不能将保存了handler但源码长度为0的配置当成可靠的关闭指令。未设、父设子未设及子非零长度显式设置分别由上述条件判定；库/API不满足时显式setter仍可能先失败，不以merge外层条件豁免setter检查。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:602–607（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_ssl_client_helloby.c`:76–92（冻结基线保留）。
- `implementation-0` → lua-nginx-module/`src/ngx_http_lua_ssl_client_helloby.c`:95–178（冻结基线保留）。
- `df340-lua-h-ssl_client_hello_by_lua_block-create-tls-srv` → lua-nginx-module/`src/ngx_http_lua_module.c`:1170–1213（新）。
- `implementation-3` → lua-nginx-module/`src/ngx_http_lua_module.c`:1233–1272（冻结基线保留）。
- `df340-lua-h-ssl_client_hello_by_lua_block-tls-script-consume` → lua-nginx-module/`src/ngx_http_lua_ssl_client_helloby.c`:293–303（新）。
- `df340-lua-h-ssl_client_hello_by_lua_block-server-hierarchy` → nginx/`src/http/ngx_http.c`:577–589（新）。

补丁核对：本次新增引用只取固定Lua组件的setter/create/merge/consumer和未被补丁修改的Nginx配置层级文件。既有ssl_cert_cb_yield/ssl_sess_cb_yield/ssl_client_hello_cb_yield的运行握手影响不据此撤销；新事实只判配置槽传播与安装条件，未新增Nginx握手片段来泛化旧patch范围。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--ssl_client_hello_by_lua_file

组：H-downstream-tls。目标字段：defaults、inheritance。

本ID的 MAIN/SRV_CONF与SRV_CONF_OFFSET → file setter配置时rebase路径 → srv.ssl_client_hello_src/handler → pcalloc零态 → 本族merge与SSL_CTX安装分支 → 回调从所选server读取本族槽。

- defaults [verified]：在 NGX_HTTP_SSL 可用分支，当前server既无本族有效源码也未取得父级本族源码时，srv.ssl_client_hello_handler 初始为NULL，不由本族安装Lua ssl_client_hello 回调；没有默认脚本或默认文件。这不关闭Nginx自身的TLS处理。 来源：`registration`、`configuration-definition`、`df340-lua-h-ssl_client_hello_by_lua_file-create-tls-srv`、`implementation-1`、`df340-lua-h-ssl_client_hello_by_lua_file-tls-script-consume`、`df340-lua-h-ssl_client_hello_by_lua_file-server-hierarchy`。
- inheritance [verified]：http的srv默认对象→server。按 srv.ssl_client_hello_src.len==0 判定未设，复制父级本族源码、handler和src_key，并复制src_ref和chunkname；本层有效非零长度源码保留自己的整套槽，不追加父脚本。本族block/file共槽且同层重复拒绝，其他TLS阶段使用独立槽。继承发生在SSL_CTX检查之前：合并后源码非空时，当前server缺少SSL_CTX会报no ssl configured；LibreSSL拒绝，还要求SSL_ERROR_WANT_CLIENT_HELLO_CB（至少OpenSSL1.1.1）才安装对应回调。 来源：`registration`、`configuration-definition`、`df340-lua-h-ssl_client_hello_by_lua_file-create-tls-srv`、`implementation-1`、`df340-lua-h-ssl_client_hello_by_lua_file-tls-script-consume`、`df340-lua-h-ssl_client_hello_by_lua_file-server-hierarchy`。

本族merge以src.len为准；不能将保存了handler但源码长度为0的配置当成可靠的关闭指令。未设、父设子未设及子非零长度显式设置分别由上述条件判定；库/API不满足时显式setter仍可能先失败，不以merge外层条件豁免setter检查。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:609–614（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_ssl_client_helloby.c`:95–178（冻结基线保留）。
- `df340-lua-h-ssl_client_hello_by_lua_file-create-tls-srv` → lua-nginx-module/`src/ngx_http_lua_module.c`:1170–1213（新）。
- `implementation-1` → lua-nginx-module/`src/ngx_http_lua_module.c`:1233–1272（冻结基线保留）。
- `df340-lua-h-ssl_client_hello_by_lua_file-tls-script-consume` → lua-nginx-module/`src/ngx_http_lua_ssl_client_helloby.c`:293–303（新）。
- `df340-lua-h-ssl_client_hello_by_lua_file-server-hierarchy` → nginx/`src/http/ngx_http.c`:577–589（新）。

补丁核对：本次新增引用只取固定Lua组件的setter/create/merge/consumer和未被补丁修改的Nginx配置层级文件。既有ssl_cert_cb_yield/ssl_sess_cb_yield/ssl_client_hello_cb_yield的运行握手影响不据此撤销；新事实只判配置槽传播与安装条件，未新增Nginx握手片段来泛化旧patch范围。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--ssl_certificate_by_lua_block

组：H-downstream-tls。目标字段：defaults、inheritance。

本ID的 MAIN/SRV_CONF与SRV_CONF_OFFSET → block委派inline setter → srv.ssl_cert_src/handler → pcalloc零态 → 本族merge与SSL_CTX安装分支 → 回调从所选server读取本族槽。

- defaults [verified]：在 NGX_HTTP_SSL 可用分支，当前server既无本族有效源码也未取得父级本族源码时，srv.ssl_cert_handler 初始为NULL，不由本族安装Lua ssl_certificate 回调；没有默认脚本或默认文件。这不关闭Nginx自身的TLS处理。 来源：`registration`、`configuration-definition`、`implementation-0`、`df340-lua-h-ssl_certificate_by_lua_block-create-tls-srv`、`implementation-3`、`df340-lua-h-ssl_certificate_by_lua_block-tls-script-consume`、`df340-lua-h-ssl_certificate_by_lua_block-server-hierarchy`。
- inheritance [verified]：http的srv默认对象→server。按 srv.ssl_cert_src.len==0 判定未设，复制父级本族源码、handler和src_key，并复制src_ref和chunkname；本层有效非零长度源码保留自己的整套槽，不追加父脚本。本族block/file共槽且同层重复拒绝，其他TLS阶段使用独立槽。继承发生在SSL_CTX检查之前：合并后源码非空时，当前server缺少SSL_CTX会报no ssl configured；LibreSSL拒绝，还要求OpenSSL≥1.0.2e才安装对应回调。 来源：`registration`、`configuration-definition`、`implementation-0`、`df340-lua-h-ssl_certificate_by_lua_block-create-tls-srv`、`implementation-3`、`df340-lua-h-ssl_certificate_by_lua_block-tls-script-consume`、`df340-lua-h-ssl_certificate_by_lua_block-server-hierarchy`。

本族merge以src.len为准；不能将保存了handler但源码长度为0的配置当成可靠的关闭指令。未设、父设子未设及子非零长度显式设置分别由上述条件判定；库/API不满足时显式setter仍可能先失败，不以merge外层条件豁免setter检查。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:616–621（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_ssl_certby.c`:86–102（冻结基线保留）。
- `implementation-0` → lua-nginx-module/`src/ngx_http_lua_ssl_certby.c`:105–185（冻结基线保留）。
- `df340-lua-h-ssl_certificate_by_lua_block-create-tls-srv` → lua-nginx-module/`src/ngx_http_lua_module.c`:1170–1213（新）。
- `implementation-3` → lua-nginx-module/`src/ngx_http_lua_module.c`:1274–1312（冻结基线保留）。
- `df340-lua-h-ssl_certificate_by_lua_block-tls-script-consume` → lua-nginx-module/`src/ngx_http_lua_ssl_certby.c`:298–308（新）。
- `df340-lua-h-ssl_certificate_by_lua_block-server-hierarchy` → nginx/`src/http/ngx_http.c`:577–589（新）。

补丁核对：本次新增引用只取固定Lua组件的setter/create/merge/consumer和未被补丁修改的Nginx配置层级文件。既有ssl_cert_cb_yield/ssl_sess_cb_yield/ssl_client_hello_cb_yield的运行握手影响不据此撤销；新事实只判配置槽传播与安装条件，未新增Nginx握手片段来泛化旧patch范围。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--ssl_certificate_by_lua_file

组：H-downstream-tls。目标字段：defaults、inheritance。

本ID的 MAIN/SRV_CONF与SRV_CONF_OFFSET → file setter配置时rebase路径 → srv.ssl_cert_src/handler → pcalloc零态 → 本族merge与SSL_CTX安装分支 → 回调从所选server读取本族槽。

- defaults [verified]：在 NGX_HTTP_SSL 可用分支，当前server既无本族有效源码也未取得父级本族源码时，srv.ssl_cert_handler 初始为NULL，不由本族安装Lua ssl_certificate 回调；没有默认脚本或默认文件。这不关闭Nginx自身的TLS处理。 来源：`registration`、`configuration-definition`、`df340-lua-h-ssl_certificate_by_lua_file-create-tls-srv`、`implementation-1`、`df340-lua-h-ssl_certificate_by_lua_file-tls-script-consume`、`df340-lua-h-ssl_certificate_by_lua_file-server-hierarchy`。
- inheritance [verified]：http的srv默认对象→server。按 srv.ssl_cert_src.len==0 判定未设，复制父级本族源码、handler和src_key，并复制src_ref和chunkname；本层有效非零长度源码保留自己的整套槽，不追加父脚本。本族block/file共槽且同层重复拒绝，其他TLS阶段使用独立槽。继承发生在SSL_CTX检查之前：合并后源码非空时，当前server缺少SSL_CTX会报no ssl configured；LibreSSL拒绝，还要求OpenSSL≥1.0.2e才安装对应回调。 来源：`registration`、`configuration-definition`、`df340-lua-h-ssl_certificate_by_lua_file-create-tls-srv`、`implementation-1`、`df340-lua-h-ssl_certificate_by_lua_file-tls-script-consume`、`df340-lua-h-ssl_certificate_by_lua_file-server-hierarchy`。

本族merge以src.len为准；不能将保存了handler但源码长度为0的配置当成可靠的关闭指令。未设、父设子未设及子非零长度显式设置分别由上述条件判定；库/API不满足时显式setter仍可能先失败，不以merge外层条件豁免setter检查。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:623–628（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_ssl_certby.c`:105–185（冻结基线保留）。
- `df340-lua-h-ssl_certificate_by_lua_file-create-tls-srv` → lua-nginx-module/`src/ngx_http_lua_module.c`:1170–1213（新）。
- `implementation-1` → lua-nginx-module/`src/ngx_http_lua_module.c`:1274–1312（冻结基线保留）。
- `df340-lua-h-ssl_certificate_by_lua_file-tls-script-consume` → lua-nginx-module/`src/ngx_http_lua_ssl_certby.c`:298–308（新）。
- `df340-lua-h-ssl_certificate_by_lua_file-server-hierarchy` → nginx/`src/http/ngx_http.c`:577–589（新）。

补丁核对：本次新增引用只取固定Lua组件的setter/create/merge/consumer和未被补丁修改的Nginx配置层级文件。既有ssl_cert_cb_yield/ssl_sess_cb_yield/ssl_client_hello_cb_yield的运行握手影响不据此撤销；新事实只判配置槽传播与安装条件，未新增Nginx握手片段来泛化旧patch范围。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--ssl_session_store_by_lua_block

组：H-downstream-tls。目标字段：defaults、inheritance。

本ID的 MAIN_CONF但SRV_CONF_OFFSET → block委派inline setter → srv.ssl_sess_store_src/handler → pcalloc零态 → 本族merge与SSL_CTX安装分支 → 回调从所选server读取本族槽。

- defaults [verified]：在 NGX_HTTP_SSL 可用分支，当前server既无本族有效源码也未取得父级本族源码时，srv.ssl_sess_store_handler 初始为NULL，不由本族安装Lua ssl_session_store 回调；没有默认脚本或默认文件。这不关闭Nginx自身的TLS处理。 来源：`registration`、`configuration-definition`、`implementation-0`、`df340-lua-h-ssl_session_store_by_lua_block-create-tls-srv`、`implementation-3`、`df340-lua-h-ssl_session_store_by_lua_block-tls-script-consume`、`df340-lua-h-ssl_session_store_by_lua_block-server-hierarchy`。
- inheritance [verified]：http的srv默认对象→server。按 srv.ssl_sess_store_src.len==0 判定未设，复制父级本族源码、handler和src_key，并复制src_ref和chunkname；本层有效非零长度源码保留自己的整套槽，不追加父脚本。本族block/file共槽且同层重复拒绝，其他TLS阶段使用独立槽。该族仅允许http级配置，却存入http层srv默认对象并由merge_srv_conf传播到server，不是main handler槽；server不能显式重配本族。合并后仅在sscf及SSL_CTX存在时安装session回调；无ctx不在此分支报no ssl configured，有ctx且LibreSSL则报错。 来源：`registration`、`configuration-definition`、`implementation-0`、`df340-lua-h-ssl_session_store_by_lua_block-create-tls-srv`、`implementation-3`、`df340-lua-h-ssl_session_store_by_lua_block-tls-script-consume`、`df340-lua-h-ssl_session_store_by_lua_block-server-hierarchy`。

本族merge以src.len为准；不能将保存了handler但源码长度为0的配置当成可靠的关闭指令。未设、父设子未设及子非零长度显式设置分别由上述条件判定；子server显式设置为注册层面不允许。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:630–635（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_ssl_session_storeby.c`:79–95（冻结基线保留）。
- `implementation-0` → lua-nginx-module/`src/ngx_http_lua_ssl_session_storeby.c`:99–170（冻结基线保留）。
- `df340-lua-h-ssl_session_store_by_lua_block-create-tls-srv` → lua-nginx-module/`src/ngx_http_lua_module.c`:1170–1213（新）。
- `implementation-3` → lua-nginx-module/`src/ngx_http_lua_module.c`:1314–1336（冻结基线保留）。
- `df340-lua-h-ssl_session_store_by_lua_block-tls-script-consume` → lua-nginx-module/`src/ngx_http_lua_ssl_session_storeby.c`:276–287（新）。
- `df340-lua-h-ssl_session_store_by_lua_block-server-hierarchy` → nginx/`src/http/ngx_http.c`:577–589（新）。

补丁核对：本次新增引用只取固定Lua组件的setter/create/merge/consumer和未被补丁修改的Nginx配置层级文件。既有ssl_cert_cb_yield/ssl_sess_cb_yield/ssl_client_hello_cb_yield的运行握手影响不据此撤销；新事实只判配置槽传播与安装条件，未新增Nginx握手片段来泛化旧patch范围。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--ssl_session_store_by_lua_file

组：H-downstream-tls。目标字段：defaults、inheritance。

本ID的 MAIN_CONF但SRV_CONF_OFFSET → file setter配置时rebase路径 → srv.ssl_sess_store_src/handler → pcalloc零态 → 本族merge与SSL_CTX安装分支 → 回调从所选server读取本族槽。

- defaults [verified]：在 NGX_HTTP_SSL 可用分支，当前server既无本族有效源码也未取得父级本族源码时，srv.ssl_sess_store_handler 初始为NULL，不由本族安装Lua ssl_session_store 回调；没有默认脚本或默认文件。这不关闭Nginx自身的TLS处理。 来源：`registration`、`configuration-definition`、`df340-lua-h-ssl_session_store_by_lua_file-create-tls-srv`、`implementation-1`、`df340-lua-h-ssl_session_store_by_lua_file-tls-script-consume`、`df340-lua-h-ssl_session_store_by_lua_file-server-hierarchy`。
- inheritance [verified]：http的srv默认对象→server。按 srv.ssl_sess_store_src.len==0 判定未设，复制父级本族源码、handler和src_key，并复制src_ref和chunkname；本层有效非零长度源码保留自己的整套槽，不追加父脚本。本族block/file共槽且同层重复拒绝，其他TLS阶段使用独立槽。该族仅允许http级配置，却存入http层srv默认对象并由merge_srv_conf传播到server，不是main handler槽；server不能显式重配本族。合并后仅在sscf及SSL_CTX存在时安装session回调；无ctx不在此分支报no ssl configured，有ctx且LibreSSL则报错。 来源：`registration`、`configuration-definition`、`df340-lua-h-ssl_session_store_by_lua_file-create-tls-srv`、`implementation-1`、`df340-lua-h-ssl_session_store_by_lua_file-tls-script-consume`、`df340-lua-h-ssl_session_store_by_lua_file-server-hierarchy`。

本族merge以src.len为准；不能将保存了handler但源码长度为0的配置当成可靠的关闭指令。未设、父设子未设及子非零长度显式设置分别由上述条件判定；子server显式设置为注册层面不允许。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:637–642（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_ssl_session_storeby.c`:99–170（冻结基线保留）。
- `df340-lua-h-ssl_session_store_by_lua_file-create-tls-srv` → lua-nginx-module/`src/ngx_http_lua_module.c`:1170–1213（新）。
- `implementation-1` → lua-nginx-module/`src/ngx_http_lua_module.c`:1314–1336（冻结基线保留）。
- `df340-lua-h-ssl_session_store_by_lua_file-tls-script-consume` → lua-nginx-module/`src/ngx_http_lua_ssl_session_storeby.c`:276–287（新）。
- `df340-lua-h-ssl_session_store_by_lua_file-server-hierarchy` → nginx/`src/http/ngx_http.c`:577–589（新）。

补丁核对：本次新增引用只取固定Lua组件的setter/create/merge/consumer和未被补丁修改的Nginx配置层级文件。既有ssl_cert_cb_yield/ssl_sess_cb_yield/ssl_client_hello_cb_yield的运行握手影响不据此撤销；新事实只判配置槽传播与安装条件，未新增Nginx握手片段来泛化旧patch范围。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--ssl_session_fetch_by_lua_block

组：H-downstream-tls。目标字段：defaults、inheritance。

本ID的 MAIN_CONF但SRV_CONF_OFFSET → block委派inline setter → srv.ssl_sess_fetch_src/handler → pcalloc零态 → 本族merge与SSL_CTX安装分支 → 回调从所选server读取本族槽。

- defaults [verified]：在 NGX_HTTP_SSL 可用分支，当前server既无本族有效源码也未取得父级本族源码时，srv.ssl_sess_fetch_handler 初始为NULL，不由本族安装Lua ssl_session_fetch 回调；没有默认脚本或默认文件。这不关闭Nginx自身的TLS处理。 来源：`registration`、`configuration-definition`、`implementation-0`、`df340-lua-h-ssl_session_fetch_by_lua_block-create-tls-srv`、`implementation-3`、`df340-lua-h-ssl_session_fetch_by_lua_block-tls-script-consume`、`df340-lua-h-ssl_session_fetch_by_lua_block-server-hierarchy`。
- inheritance [verified]：http的srv默认对象→server。按 srv.ssl_sess_fetch_src.len==0 判定未设，复制父级本族源码、handler和src_key，并复制src_ref和chunkname；本层有效非零长度源码保留自己的整套槽，不追加父脚本。本族block/file共槽且同层重复拒绝，其他TLS阶段使用独立槽。该族仅允许http级配置，却存入http层srv默认对象并由merge_srv_conf传播到server，不是main handler槽；server不能显式重配本族。合并后仅在sscf及SSL_CTX存在时安装session回调；无ctx不在此分支报no ssl configured，有ctx且LibreSSL则报错。 来源：`registration`、`configuration-definition`、`implementation-0`、`df340-lua-h-ssl_session_fetch_by_lua_block-create-tls-srv`、`implementation-3`、`df340-lua-h-ssl_session_fetch_by_lua_block-tls-script-consume`、`df340-lua-h-ssl_session_fetch_by_lua_block-server-hierarchy`。

本族merge以src.len为准；不能将保存了handler但源码长度为0的配置当成可靠的关闭指令。未设、父设子未设及子非零长度显式设置分别由上述条件判定；子server显式设置为注册层面不允许。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:644–649（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_ssl_session_fetchby.c`:81–97（冻结基线保留）。
- `implementation-0` → lua-nginx-module/`src/ngx_http_lua_ssl_session_fetchby.c`:101–172（冻结基线保留）。
- `df340-lua-h-ssl_session_fetch_by_lua_block-create-tls-srv` → lua-nginx-module/`src/ngx_http_lua_module.c`:1170–1213（新）。
- `implementation-3` → lua-nginx-module/`src/ngx_http_lua_module.c`:1338–1359（冻结基线保留）。
- `df340-lua-h-ssl_session_fetch_by_lua_block-tls-script-consume` → lua-nginx-module/`src/ngx_http_lua_ssl_session_fetchby.c`:314–321（新）。
- `df340-lua-h-ssl_session_fetch_by_lua_block-server-hierarchy` → nginx/`src/http/ngx_http.c`:577–589（新）。

补丁核对：本次新增引用只取固定Lua组件的setter/create/merge/consumer和未被补丁修改的Nginx配置层级文件。既有ssl_cert_cb_yield/ssl_sess_cb_yield/ssl_client_hello_cb_yield的运行握手影响不据此撤销；新事实只判配置槽传播与安装条件，未新增Nginx握手片段来泛化旧patch范围。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--ssl_session_fetch_by_lua_file

组：H-downstream-tls。目标字段：defaults、inheritance。

本ID的 MAIN_CONF但SRV_CONF_OFFSET → file setter配置时rebase路径 → srv.ssl_sess_fetch_src/handler → pcalloc零态 → 本族merge与SSL_CTX安装分支 → 回调从所选server读取本族槽。

- defaults [verified]：在 NGX_HTTP_SSL 可用分支，当前server既无本族有效源码也未取得父级本族源码时，srv.ssl_sess_fetch_handler 初始为NULL，不由本族安装Lua ssl_session_fetch 回调；没有默认脚本或默认文件。这不关闭Nginx自身的TLS处理。 来源：`registration`、`configuration-definition`、`df340-lua-h-ssl_session_fetch_by_lua_file-create-tls-srv`、`implementation-1`、`df340-lua-h-ssl_session_fetch_by_lua_file-tls-script-consume`、`df340-lua-h-ssl_session_fetch_by_lua_file-server-hierarchy`。
- inheritance [verified]：http的srv默认对象→server。按 srv.ssl_sess_fetch_src.len==0 判定未设，复制父级本族源码、handler和src_key，并复制src_ref和chunkname；本层有效非零长度源码保留自己的整套槽，不追加父脚本。本族block/file共槽且同层重复拒绝，其他TLS阶段使用独立槽。该族仅允许http级配置，却存入http层srv默认对象并由merge_srv_conf传播到server，不是main handler槽；server不能显式重配本族。合并后仅在sscf及SSL_CTX存在时安装session回调；无ctx不在此分支报no ssl configured，有ctx且LibreSSL则报错。 来源：`registration`、`configuration-definition`、`df340-lua-h-ssl_session_fetch_by_lua_file-create-tls-srv`、`implementation-1`、`df340-lua-h-ssl_session_fetch_by_lua_file-tls-script-consume`、`df340-lua-h-ssl_session_fetch_by_lua_file-server-hierarchy`。

本族merge以src.len为准；不能将保存了handler但源码长度为0的配置当成可靠的关闭指令。未设、父设子未设及子非零长度显式设置分别由上述条件判定；子server显式设置为注册层面不允许。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:651–656（冻结基线保留）。
- `configuration-definition` → lua-nginx-module/`src/ngx_http_lua_ssl_session_fetchby.c`:101–172（冻结基线保留）。
- `df340-lua-h-ssl_session_fetch_by_lua_file-create-tls-srv` → lua-nginx-module/`src/ngx_http_lua_module.c`:1170–1213（新）。
- `implementation-1` → lua-nginx-module/`src/ngx_http_lua_module.c`:1338–1359（冻结基线保留）。
- `df340-lua-h-ssl_session_fetch_by_lua_file-tls-script-consume` → lua-nginx-module/`src/ngx_http_lua_ssl_session_fetchby.c`:314–321（新）。
- `df340-lua-h-ssl_session_fetch_by_lua_file-server-hierarchy` → nginx/`src/http/ngx_http.c`:577–589（新）。

补丁核对：本次新增引用只取固定Lua组件的setter/create/merge/consumer和未被补丁修改的Nginx配置层级文件。既有ssl_cert_cb_yield/ssl_sess_cb_yield/ssl_client_hello_cb_yield的运行握手影响不据此撤销；新事实只判配置槽传播与安装条件，未新增Nginx握手片段来泛化旧patch范围。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--ssl_client_hello_by_lua_block

组：H-downstream-tls。目标字段：defaults、inheritance。

本ID的 MAIN/SRV_CONF与SRV_CONF_OFFSET → block委派inline setter → srv.ssl_client_hello_src/handler → pcalloc零态 → 本族merge与SSL_CTX安装分支 → 回调从所选server读取本族槽。

- defaults [verified]：在 NGX_STREAM_SSL 可用分支，当前server既无本族有效源码也未取得父级本族源码时，srv.ssl_client_hello_handler 初始为NULL，不由本族安装Lua ssl_client_hello 回调；没有默认脚本或默认文件。这不关闭Nginx自身的TLS处理。 来源：`registration`、`configuration-definition`、`implementation-0`、`df340-lua-s-ssl_client_hello_by_lua_block-create-tls-srv`、`df340-lua-s-ssl_client_hello_by_lua_block-tls-inherit-install`、`df340-lua-s-ssl_client_hello_by_lua_block-tls-script-consume`、`df340-lua-s-ssl_client_hello_by_lua_block-server-hierarchy`。
- inheritance [verified]：stream的srv默认对象→server（有TLS条件）。按 srv.ssl_client_hello_src.len==0 判定未设，复制父级本族源码、handler和src_key；本层有效非零长度源码保留自己的整套槽，不追加父脚本。本族block/file共槽且同层重复拒绝，其他TLS阶段使用独立槽。固定Nginx1.27.1走>=1.25.5分支，整个源码继承与回调安装都位于 sscf && sscf->ssl.ctx 外层条件内；无ctx时不从stream层复制本族到server，也不在该块安装回调。满足ctx条件后仍检查LibreSSL与ClientHello回调API；不能照搬HTTP先继承再报缺SSL的路径。 来源：`registration`、`configuration-definition`、`implementation-0`、`df340-lua-s-ssl_client_hello_by_lua_block-create-tls-srv`、`df340-lua-s-ssl_client_hello_by_lua_block-tls-inherit-install`、`df340-lua-s-ssl_client_hello_by_lua_block-tls-script-consume`、`df340-lua-s-ssl_client_hello_by_lua_block-server-hierarchy`。

本族merge以src.len为准；不能将保存了handler但源码长度为0的配置当成可靠的关闭指令。未设、父设子未设及子非零长度显式设置分别由上述条件判定；库/API不满足时显式setter仍可能先失败，不以merge外层条件豁免setter检查。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:392–397（冻结基线保留）。
- `configuration-definition` → stream-lua-nginx-module/`src/ngx_stream_lua_ssl_client_helloby.c`:74–90（冻结基线保留）。
- `implementation-0` → stream-lua-nginx-module/`src/ngx_stream_lua_ssl_client_helloby.c`:93–178（冻结基线保留）。
- `df340-lua-s-ssl_client_hello_by_lua_block-create-tls-srv` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:806–856（新）。
- `df340-lua-s-ssl_client_hello_by_lua_block-tls-inherit-install` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:866–919（新）。
- `df340-lua-s-ssl_client_hello_by_lua_block-tls-script-consume` → stream-lua-nginx-module/`src/ngx_stream_lua_ssl_client_helloby.c`:295–304（新）。
- `df340-lua-s-ssl_client_hello_by_lua_block-server-hierarchy` → nginx/`src/stream/ngx_stream.c`:224–239（新）。

补丁核对：本次新增引用只取固定Lua组件的setter/create/merge/consumer和未被补丁修改的Nginx配置层级文件。既有ssl_cert_cb_yield/ssl_sess_cb_yield/ssl_client_hello_cb_yield的运行握手影响不据此撤销；新事实只判配置槽传播与安装条件，未新增Nginx握手片段来泛化旧patch范围。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--ssl_client_hello_by_lua_file

组：H-downstream-tls。目标字段：defaults、inheritance。

本ID的 MAIN/SRV_CONF与SRV_CONF_OFFSET → file setter配置时rebase路径 → srv.ssl_client_hello_src/handler → pcalloc零态 → 本族merge与SSL_CTX安装分支 → 回调从所选server读取本族槽。

- defaults [verified]：在 NGX_STREAM_SSL 可用分支，当前server既无本族有效源码也未取得父级本族源码时，srv.ssl_client_hello_handler 初始为NULL，不由本族安装Lua ssl_client_hello 回调；没有默认脚本或默认文件。这不关闭Nginx自身的TLS处理。 来源：`registration`、`configuration-definition`、`df340-lua-s-ssl_client_hello_by_lua_file-create-tls-srv`、`df340-lua-s-ssl_client_hello_by_lua_file-tls-inherit-install`、`df340-lua-s-ssl_client_hello_by_lua_file-tls-script-consume`、`df340-lua-s-ssl_client_hello_by_lua_file-server-hierarchy`。
- inheritance [verified]：stream的srv默认对象→server（有TLS条件）。按 srv.ssl_client_hello_src.len==0 判定未设，复制父级本族源码、handler和src_key；本层有效非零长度源码保留自己的整套槽，不追加父脚本。本族block/file共槽且同层重复拒绝，其他TLS阶段使用独立槽。固定Nginx1.27.1走>=1.25.5分支，整个源码继承与回调安装都位于 sscf && sscf->ssl.ctx 外层条件内；无ctx时不从stream层复制本族到server，也不在该块安装回调。满足ctx条件后仍检查LibreSSL与ClientHello回调API；不能照搬HTTP先继承再报缺SSL的路径。 来源：`registration`、`configuration-definition`、`df340-lua-s-ssl_client_hello_by_lua_file-create-tls-srv`、`df340-lua-s-ssl_client_hello_by_lua_file-tls-inherit-install`、`df340-lua-s-ssl_client_hello_by_lua_file-tls-script-consume`、`df340-lua-s-ssl_client_hello_by_lua_file-server-hierarchy`。

本族merge以src.len为准；不能将保存了handler但源码长度为0的配置当成可靠的关闭指令。未设、父设子未设及子非零长度显式设置分别由上述条件判定；库/API不满足时显式setter仍可能先失败，不以merge外层条件豁免setter检查。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:399–404（冻结基线保留）。
- `configuration-definition` → stream-lua-nginx-module/`src/ngx_stream_lua_ssl_client_helloby.c`:93–178（冻结基线保留）。
- `df340-lua-s-ssl_client_hello_by_lua_file-create-tls-srv` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:806–856（新）。
- `df340-lua-s-ssl_client_hello_by_lua_file-tls-inherit-install` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:866–919（新）。
- `df340-lua-s-ssl_client_hello_by_lua_file-tls-script-consume` → stream-lua-nginx-module/`src/ngx_stream_lua_ssl_client_helloby.c`:295–304（新）。
- `df340-lua-s-ssl_client_hello_by_lua_file-server-hierarchy` → nginx/`src/stream/ngx_stream.c`:224–239（新）。

补丁核对：本次新增引用只取固定Lua组件的setter/create/merge/consumer和未被补丁修改的Nginx配置层级文件。既有ssl_cert_cb_yield/ssl_sess_cb_yield/ssl_client_hello_cb_yield的运行握手影响不据此撤销；新事实只判配置槽传播与安装条件，未新增Nginx握手片段来泛化旧patch范围。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--ssl_certificate_by_lua_block

组：H-downstream-tls。目标字段：defaults、inheritance。

本ID的 MAIN/SRV_CONF与SRV_CONF_OFFSET → block委派inline setter → srv.ssl_cert_src/handler → pcalloc零态 → 本族merge与SSL_CTX安装分支 → 回调从所选server读取本族槽。

- defaults [verified]：在 NGX_STREAM_SSL 可用分支，当前server既无本族有效源码也未取得父级本族源码时，srv.ssl_cert_handler 初始为NULL，不由本族安装Lua ssl_certificate 回调；没有默认脚本或默认文件。这不关闭Nginx自身的TLS处理。 来源：`registration`、`configuration-definition`、`implementation-0`、`df340-lua-s-ssl_certificate_by_lua_block-create-tls-srv`、`df340-lua-s-ssl_certificate_by_lua_block-tls-inherit-install`、`df340-lua-s-ssl_certificate_by_lua_block-tls-script-consume`、`df340-lua-s-ssl_certificate_by_lua_block-server-hierarchy`。
- inheritance [verified]：stream的srv默认对象→server（有TLS条件）。按 srv.ssl_cert_src.len==0 判定未设，复制父级本族源码、handler和src_key；本层有效非零长度源码保留自己的整套槽，不追加父脚本。本族block/file共槽且同层重复拒绝，其他TLS阶段使用独立槽。固定Nginx1.27.1走>=1.25.5分支，整个源码继承与回调安装都位于 sscf && sscf->ssl.ctx 外层条件内；无ctx时不从stream层复制本族到server，也不在该块安装回调。满足ctx条件后仍检查LibreSSL与OpenSSL1.0.2e最低版本；不能照搬HTTP先继承再报缺SSL的路径。 来源：`registration`、`configuration-definition`、`implementation-0`、`df340-lua-s-ssl_certificate_by_lua_block-create-tls-srv`、`df340-lua-s-ssl_certificate_by_lua_block-tls-inherit-install`、`df340-lua-s-ssl_certificate_by_lua_block-tls-script-consume`、`df340-lua-s-ssl_certificate_by_lua_block-server-hierarchy`。

本族merge以src.len为准；不能将保存了handler但源码长度为0的配置当成可靠的关闭指令。未设、父设子未设及子非零长度显式设置分别由上述条件判定；库/API不满足时显式setter仍可能先失败，不以merge外层条件豁免setter检查。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:406–411（冻结基线保留）。
- `configuration-definition` → stream-lua-nginx-module/`src/ngx_stream_lua_ssl_certby.c`:91–107（冻结基线保留）。
- `implementation-0` → stream-lua-nginx-module/`src/ngx_stream_lua_ssl_certby.c`:110–193（冻结基线保留）。
- `df340-lua-s-ssl_certificate_by_lua_block-create-tls-srv` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:806–856（新）。
- `df340-lua-s-ssl_certificate_by_lua_block-tls-inherit-install` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:866–959（新）。
- `df340-lua-s-ssl_certificate_by_lua_block-tls-script-consume` → stream-lua-nginx-module/`src/ngx_stream_lua_ssl_certby.c`:308–317（新）。
- `df340-lua-s-ssl_certificate_by_lua_block-server-hierarchy` → nginx/`src/stream/ngx_stream.c`:224–239（新）。

补丁核对：本次新增引用只取固定Lua组件的setter/create/merge/consumer和未被补丁修改的Nginx配置层级文件。既有ssl_cert_cb_yield/ssl_sess_cb_yield/ssl_client_hello_cb_yield的运行握手影响不据此撤销；新事实只判配置槽传播与安装条件，未新增Nginx握手片段来泛化旧patch范围。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--ssl_certificate_by_lua_file

组：H-downstream-tls。目标字段：defaults、inheritance。

本ID的 MAIN/SRV_CONF与SRV_CONF_OFFSET → file setter配置时rebase路径 → srv.ssl_cert_src/handler → pcalloc零态 → 本族merge与SSL_CTX安装分支 → 回调从所选server读取本族槽。

- defaults [verified]：在 NGX_STREAM_SSL 可用分支，当前server既无本族有效源码也未取得父级本族源码时，srv.ssl_cert_handler 初始为NULL，不由本族安装Lua ssl_certificate 回调；没有默认脚本或默认文件。这不关闭Nginx自身的TLS处理。 来源：`registration`、`configuration-definition`、`df340-lua-s-ssl_certificate_by_lua_file-create-tls-srv`、`df340-lua-s-ssl_certificate_by_lua_file-tls-inherit-install`、`df340-lua-s-ssl_certificate_by_lua_file-tls-script-consume`、`df340-lua-s-ssl_certificate_by_lua_file-server-hierarchy`。
- inheritance [verified]：stream的srv默认对象→server（有TLS条件）。按 srv.ssl_cert_src.len==0 判定未设，复制父级本族源码、handler和src_key；本层有效非零长度源码保留自己的整套槽，不追加父脚本。本族block/file共槽且同层重复拒绝，其他TLS阶段使用独立槽。固定Nginx1.27.1走>=1.25.5分支，整个源码继承与回调安装都位于 sscf && sscf->ssl.ctx 外层条件内；无ctx时不从stream层复制本族到server，也不在该块安装回调。满足ctx条件后仍检查LibreSSL与OpenSSL1.0.2e最低版本；不能照搬HTTP先继承再报缺SSL的路径。 来源：`registration`、`configuration-definition`、`df340-lua-s-ssl_certificate_by_lua_file-create-tls-srv`、`df340-lua-s-ssl_certificate_by_lua_file-tls-inherit-install`、`df340-lua-s-ssl_certificate_by_lua_file-tls-script-consume`、`df340-lua-s-ssl_certificate_by_lua_file-server-hierarchy`。

本族merge以src.len为准；不能将保存了handler但源码长度为0的配置当成可靠的关闭指令。未设、父设子未设及子非零长度显式设置分别由上述条件判定；库/API不满足时显式setter仍可能先失败，不以merge外层条件豁免setter检查。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:413–418（冻结基线保留）。
- `configuration-definition` → stream-lua-nginx-module/`src/ngx_stream_lua_ssl_certby.c`:110–193（冻结基线保留）。
- `df340-lua-s-ssl_certificate_by_lua_file-create-tls-srv` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:806–856（新）。
- `df340-lua-s-ssl_certificate_by_lua_file-tls-inherit-install` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:866–959（新）。
- `df340-lua-s-ssl_certificate_by_lua_file-tls-script-consume` → stream-lua-nginx-module/`src/ngx_stream_lua_ssl_certby.c`:308–317（新）。
- `df340-lua-s-ssl_certificate_by_lua_file-server-hierarchy` → nginx/`src/stream/ngx_stream.c`:224–239（新）。

补丁核对：本次新增引用只取固定Lua组件的setter/create/merge/consumer和未被补丁修改的Nginx配置层级文件。既有ssl_cert_cb_yield/ssl_sess_cb_yield/ssl_client_hello_cb_yield的运行握手影响不据此撤销；新事实只判配置槽传播与安装条件，未新增Nginx握手片段来泛化旧patch范围。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_ssl_protocols

组：I-outbound-ssl。目标字段：inheritance。

注册 LOC_CONF_OFFSET → src/core/ngx_conf_file.c 的 bitmask setter → ssl_protocols 初态 → 本域逐字段 merge → set_ssl → socket 的 u->conf->ssl。

- inheritance [verified]：在 NGX_HTTP_SSL 分支，http→server→location 逐级合并 loc_conf.ssl_protocols：本层值为0（未配置）时整体采用父级非零协议掩码；父也未配置才取本域 merge 的缺省掩码。本层显式协议生成自己的掩码，阻断父掩码，不把父协议追加进来；同层多次配置由 bitmask setter 按位合并，与父子继承不同。 当全部 SSL 配置槽都未设置时 merge_ssl 可共享父 SSL 对象；已有 ctx 时 set_ssl 跳过重复构建，不改变上述各字段的合并规则。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_ssl_protocols-ssl-create`、`merge-default`、`implementation-1`、`df340-lua-h-lua_ssl_protocols-ssl-merge-macro`、`df340-lua-h-lua_ssl_protocols-ssl-hierarchy`、`implementation-3`、`df340-lua-h-lua_ssl_protocols-ssl-context-already-created`、`implementation-4`。

父未设/子未设取本域 merge 分支（命令数组 NULL 特例见事实）；父已设/子未设与子显式设置的判据分别见上，不从 HTTP 的实现类推 stream。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:588–593（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1389–1431（冻结基线保留）。
- `df340-lua-h-lua_ssl_protocols-ssl-create` → lua-nginx-module/`src/ngx_http_lua_module.c`:1378–1451（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1514–1521（冻结基线保留）。
- `implementation-1` → lua-nginx-module/`src/ngx_http_lua_module.c`:1657–1659（冻结基线保留）。
- `df340-lua-h-lua_ssl_protocols-ssl-merge-macro` → nginx/`src/core/ngx_conf_file.h`:262–265（新）。
- `df340-lua-h-lua_ssl_protocols-ssl-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `implementation-3` → lua-nginx-module/`src/ngx_http_lua_module.c`:1585–1631（冻结基线保留）。
- `df340-lua-h-lua_ssl_protocols-ssl-context-already-created` → lua-nginx-module/`src/ngx_http_lua_module.c`:1635–1641（新）。
- `implementation-4` → lua-nginx-module/`src/ngx_http_lua_socket_tcp.c`:1689–1697（冻结基线保留）。

补丁核对：本次新增 Nginx 引用为未受有效补丁修改的 ngx_conf_file.h、ngx_http.c。逐一核对固定34补丁目标；openssl.c 的 ssl_cert_cb_yield、ssl_sess_cb_yield、ssl_client_hello_cb_yield 实际 hunk 仅改 handshake/early_data 的异步回调错误分支，不改命令执行函数。Lua create/merge/set_ssl 无直接补丁；此处仅新增配置传播结论，不扩大旧 SSL 运行补丁结论。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_ssl_ciphers

组：I-outbound-ssl。目标字段：inheritance。

注册 LOC_CONF_OFFSET → src/core/ngx_conf_file.c 的 str setter → ssl_ciphers 初态 → 本域逐字段 merge → set_ssl → socket 的 u->conf->ssl。

- inheritance [verified]：在 NGX_HTTP_SSL 分支，http→server→location 逐级合并 loc_conf.ssl_ciphers：本层字符串 data==NULL 时复制父级整个字符串；父也未设置才取本域 merge 缺省。本层显式字符串（包括已解析的空字符串）阻断父值，不追加、不拼接；同层重复由 str setter 拒绝。 当全部 SSL 配置槽都未设置时 merge_ssl 可共享父 SSL 对象；已有 ctx 时 set_ssl 跳过重复构建，不改变上述各字段的合并规则。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_ssl_ciphers-ssl-create`、`merge-default`、`implementation-0`、`df340-lua-h-lua_ssl_ciphers-ssl-merge-macro`、`df340-lua-h-lua_ssl_ciphers-ssl-hierarchy`、`implementation-1`、`df340-lua-h-lua_ssl_ciphers-ssl-context-already-created`、`implementation-2`。

父未设/子未设取本域 merge 分支（命令数组 NULL 特例见事实）；父已设/子未设与子显式设置的判据分别见上，不从 HTTP 的实现类推 stream。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:595–600（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1066–1089（冻结基线保留）。
- `df340-lua-h-lua_ssl_ciphers-ssl-create` → lua-nginx-module/`src/ngx_http_lua_module.c`:1378–1451（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1523–1524（冻结基线保留）。
- `implementation-0` → lua-nginx-module/`src/ngx_http_lua_module.c`:1670–1678（冻结基线保留）。
- `df340-lua-h-lua_ssl_ciphers-ssl-merge-macro` → nginx/`src/core/ngx_conf_file.h`:240–249（新）。
- `df340-lua-h-lua_ssl_ciphers-ssl-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `implementation-1` → lua-nginx-module/`src/ngx_http_lua_module.c`:1585–1631（冻结基线保留）。
- `df340-lua-h-lua_ssl_ciphers-ssl-context-already-created` → lua-nginx-module/`src/ngx_http_lua_module.c`:1635–1641（新）。
- `implementation-2` → lua-nginx-module/`src/ngx_http_lua_socket_tcp.c`:1689–1697（冻结基线保留）。

补丁核对：本次新增 Nginx 引用为未受有效补丁修改的 ngx_conf_file.h、ngx_http.c。逐一核对固定34补丁目标；openssl.c 的 ssl_cert_cb_yield、ssl_sess_cb_yield、ssl_client_hello_cb_yield 实际 hunk 仅改 handshake/early_data 的异步回调错误分支，不改命令执行函数。Lua create/merge/set_ssl 无直接补丁；此处仅新增配置传播结论，不扩大旧 SSL 运行补丁结论。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_ssl_verify_depth

组：I-outbound-ssl。目标字段：inheritance。

注册 LOC_CONF_OFFSET → src/core/ngx_conf_file.c 的 uint setter → ssl_verify_depth 初态 → 本域逐字段 merge → set_ssl → socket 的 u->conf->ssl。

- inheritance [verified]：在 NGX_HTTP_SSL 分支，http→server→location 逐级合并 loc_conf.ssl_verify_depth：本层为 NGX_CONF_UNSET_UINT 时采用父值，父也未设置才用1；本层显式非负数覆盖父值，不累加，同层重复拒绝。此字段供 CA 加载时设置验证深度，不据此推断调用者已开启对端验证。 当全部 SSL 配置槽都未设置时 merge_ssl 可共享父 SSL 对象；已有 ctx 时 set_ssl 跳过重复构建，不改变上述各字段的合并规则。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_ssl_verify_depth-ssl-create`、`merge-default`、`implementation-0`、`df340-lua-h-lua_ssl_verify_depth-ssl-merge-macro`、`df340-lua-h-lua_ssl_verify_depth-ssl-hierarchy`、`implementation-4`、`df340-lua-h-lua_ssl_verify_depth-ssl-context-already-created`、`implementation-5`。

父未设/子未设取本域 merge 分支（命令数组 NULL 特例见事实）；父已设/子未设与子显式设置的判据分别见上，不从 HTTP 的实现类推 stream。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:658–663（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1167–1194（冻结基线保留）。
- `df340-lua-h-lua_ssl_verify_depth-ssl-create` → lua-nginx-module/`src/ngx_http_lua_module.c`:1378–1451（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1526–1527（冻结基线保留）。
- `implementation-0` → lua-nginx-module/`src/ngx_http_lua_module.c`:1690–1697（冻结基线保留）。
- `df340-lua-h-lua_ssl_verify_depth-ssl-merge-macro` → nginx/`src/core/ngx_conf_file.h`:215–218（新）。
- `df340-lua-h-lua_ssl_verify_depth-ssl-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `implementation-4` → lua-nginx-module/`src/ngx_http_lua_module.c`:1585–1631（冻结基线保留）。
- `df340-lua-h-lua_ssl_verify_depth-ssl-context-already-created` → lua-nginx-module/`src/ngx_http_lua_module.c`:1635–1641（新）。
- `implementation-5` → lua-nginx-module/`src/ngx_http_lua_socket_tcp.c`:1689–1697（冻结基线保留）。

补丁核对：本次新增 Nginx 引用为未受有效补丁修改的 ngx_conf_file.h、ngx_http.c。逐一核对固定34补丁目标；openssl.c 的 ssl_cert_cb_yield、ssl_sess_cb_yield、ssl_client_hello_cb_yield 实际 hunk 仅改 handshake/early_data 的异步回调错误分支，不改命令执行函数。Lua create/merge/set_ssl 无直接补丁；此处仅新增配置传播结论，不扩大旧 SSL 运行补丁结论。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_ssl_certificate

组：I-outbound-ssl。目标字段：inheritance。

注册 LOC_CONF_OFFSET → src/core/ngx_conf_file.c 的 array setter → ssl_certificates 初态 → 本域逐字段 merge → set_ssl → socket 的 u->conf->ssl。

- inheritance [verified]：在 NGX_HTTP_SSL 分支，http→server→location 逐级合并 loc_conf.ssl_certificates：本层为 NGX_CONF_UNSET_PTR 时继承父级整个同名数组，父也未设则为 NULL；本层至少一条时采用本层数组整体替代父数组，不追加父元素；同层多次配置按顺序追加。证书数组与私钥数组各自独立合并，最终加载前校验存在证书时私钥数量不少于证书数量，不把两指令误写为绑定覆盖槽。 当全部 SSL 配置槽都未设置时 merge_ssl 可共享父 SSL 对象；已有 ctx 时 set_ssl 跳过重复构建，不改变上述各字段的合并规则。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_ssl_certificate-ssl-create`、`merge-default`、`df340-lua-h-lua_ssl_certificate-ssl-consume`、`df340-lua-h-lua_ssl_certificate-ssl-merge-macro`、`df340-lua-h-lua_ssl_certificate-ssl-hierarchy`、`implementation-3`、`df340-lua-h-lua_ssl_certificate-ssl-context-already-created`、`implementation-4`。

父未设/子未设取本域 merge 分支（命令数组 NULL 特例见事实）；父已设/子未设与子显式设置的判据分别见上，不从 HTTP 的实现类推 stream。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:665–670（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1093–1125（冻结基线保留）。
- `df340-lua-h-lua_ssl_certificate-ssl-create` → lua-nginx-module/`src/ngx_http_lua_module.c`:1378–1451（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1528–1529（冻结基线保留）。
- `df340-lua-h-lua_ssl_certificate-ssl-consume` → lua-nginx-module/`src/ngx_http_lua_module.c`:1643–1688（新）。
- `df340-lua-h-lua_ssl_certificate-ssl-merge-macro` → nginx/`src/core/ngx_conf_file.h`:210–213（新）。
- `df340-lua-h-lua_ssl_certificate-ssl-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `implementation-3` → lua-nginx-module/`src/ngx_http_lua_module.c`:1585–1631（冻结基线保留）。
- `df340-lua-h-lua_ssl_certificate-ssl-context-already-created` → lua-nginx-module/`src/ngx_http_lua_module.c`:1635–1641（新）。
- `implementation-4` → lua-nginx-module/`src/ngx_http_lua_socket_tcp.c`:1689–1697（冻结基线保留）。

补丁核对：本次新增 Nginx 引用为未受有效补丁修改的 ngx_conf_file.h、ngx_http.c。逐一核对固定34补丁目标；openssl.c 的 ssl_cert_cb_yield、ssl_sess_cb_yield、ssl_client_hello_cb_yield 实际 hunk 仅改 handshake/early_data 的异步回调错误分支，不改命令执行函数。Lua create/merge/set_ssl 无直接补丁；此处仅新增配置传播结论，不扩大旧 SSL 运行补丁结论。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_ssl_certificate_key

组：I-outbound-ssl。目标字段：inheritance。

注册 LOC_CONF_OFFSET → src/core/ngx_conf_file.c 的 array setter → ssl_certificate_keys 初态 → 本域逐字段 merge → set_ssl → socket 的 u->conf->ssl。

- inheritance [verified]：在 NGX_HTTP_SSL 分支，http→server→location 逐级合并 loc_conf.ssl_certificate_keys：本层为 NGX_CONF_UNSET_PTR 时继承父级整个同名数组，父也未设则为 NULL；本层至少一条时采用本层数组整体替代父数组，不追加父元素；同层多次配置按顺序追加。证书数组与私钥数组各自独立合并，最终加载前校验存在证书时私钥数量不少于证书数量，不把两指令误写为绑定覆盖槽。 当全部 SSL 配置槽都未设置时 merge_ssl 可共享父 SSL 对象；已有 ctx 时 set_ssl 跳过重复构建，不改变上述各字段的合并规则。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_ssl_certificate_key-ssl-create`、`merge-default`、`df340-lua-h-lua_ssl_certificate_key-ssl-consume`、`df340-lua-h-lua_ssl_certificate_key-ssl-merge-macro`、`df340-lua-h-lua_ssl_certificate_key-ssl-hierarchy`、`implementation-4`、`df340-lua-h-lua_ssl_certificate_key-ssl-context-already-created`、`implementation-5`。

父未设/子未设取本域 merge 分支（命令数组 NULL 特例见事实）；父已设/子未设与子显式设置的判据分别见上，不从 HTTP 的实现类推 stream。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:672–677（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1093–1125（冻结基线保留）。
- `df340-lua-h-lua_ssl_certificate_key-ssl-create` → lua-nginx-module/`src/ngx_http_lua_module.c`:1378–1451（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1530–1531（冻结基线保留）。
- `df340-lua-h-lua_ssl_certificate_key-ssl-consume` → lua-nginx-module/`src/ngx_http_lua_module.c`:1643–1688（新）。
- `df340-lua-h-lua_ssl_certificate_key-ssl-merge-macro` → nginx/`src/core/ngx_conf_file.h`:210–213（新）。
- `df340-lua-h-lua_ssl_certificate_key-ssl-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `implementation-4` → lua-nginx-module/`src/ngx_http_lua_module.c`:1585–1631（冻结基线保留）。
- `df340-lua-h-lua_ssl_certificate_key-ssl-context-already-created` → lua-nginx-module/`src/ngx_http_lua_module.c`:1635–1641（新）。
- `implementation-5` → lua-nginx-module/`src/ngx_http_lua_socket_tcp.c`:1689–1697（冻结基线保留）。

补丁核对：本次新增 Nginx 引用为未受有效补丁修改的 ngx_conf_file.h、ngx_http.c。逐一核对固定34补丁目标；openssl.c 的 ssl_cert_cb_yield、ssl_sess_cb_yield、ssl_client_hello_cb_yield 实际 hunk 仅改 handshake/early_data 的异步回调错误分支，不改命令执行函数。Lua create/merge/set_ssl 无直接补丁；此处仅新增配置传播结论，不扩大旧 SSL 运行补丁结论。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_ssl_trusted_certificate

组：I-outbound-ssl。目标字段：inheritance。

注册 LOC_CONF_OFFSET → src/core/ngx_conf_file.c 的 str setter → ssl_trusted_certificate 初态 → 本域逐字段 merge → set_ssl → socket 的 u->conf->ssl。

- inheritance [verified]：在 NGX_HTTP_SSL 分支，http→server→location 逐级合并 loc_conf.ssl_trusted_certificate：本层字符串 data==NULL 时复制父级整个字符串；父也未设置才取本域 merge 缺省。本层显式字符串（包括已解析的空字符串）阻断父值，不追加、不拼接；同层重复由 str setter 拒绝。 当全部 SSL 配置槽都未设置时 merge_ssl 可共享父 SSL 对象；已有 ctx 时 set_ssl 跳过重复构建，不改变上述各字段的合并规则。合并值 len==0 时不调用此 CA 文件加载。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_ssl_trusted_certificate-ssl-create`、`merge-default`、`implementation-0`、`df340-lua-h-lua_ssl_trusted_certificate-ssl-merge-macro`、`df340-lua-h-lua_ssl_trusted_certificate-ssl-hierarchy`、`implementation-4`、`df340-lua-h-lua_ssl_trusted_certificate-ssl-context-already-created`、`implementation-5`。

父未设/子未设取本域 merge 分支（命令数组 NULL 特例见事实）；父已设/子未设与子显式设置的判据分别见上，不从 HTTP 的实现类推 stream。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:679–684（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1066–1089（冻结基线保留）。
- `df340-lua-h-lua_ssl_trusted_certificate-ssl-create` → lua-nginx-module/`src/ngx_http_lua_module.c`:1378–1451（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1532–1533（冻结基线保留）。
- `implementation-0` → lua-nginx-module/`src/ngx_http_lua_module.c`:1690–1697（冻结基线保留）。
- `df340-lua-h-lua_ssl_trusted_certificate-ssl-merge-macro` → nginx/`src/core/ngx_conf_file.h`:240–249（新）。
- `df340-lua-h-lua_ssl_trusted_certificate-ssl-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `implementation-4` → lua-nginx-module/`src/ngx_http_lua_module.c`:1585–1631（冻结基线保留）。
- `df340-lua-h-lua_ssl_trusted_certificate-ssl-context-already-created` → lua-nginx-module/`src/ngx_http_lua_module.c`:1635–1641（新）。
- `implementation-5` → lua-nginx-module/`src/ngx_http_lua_socket_tcp.c`:1689–1697（冻结基线保留）。

补丁核对：本次新增 Nginx 引用为未受有效补丁修改的 ngx_conf_file.h、ngx_http.c。逐一核对固定34补丁目标；openssl.c 的 ssl_cert_cb_yield、ssl_sess_cb_yield、ssl_client_hello_cb_yield 实际 hunk 仅改 handshake/early_data 的异步回调错误分支，不改命令执行函数。Lua create/merge/set_ssl 无直接补丁；此处仅新增配置传播结论，不扩大旧 SSL 运行补丁结论。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_ssl_crl

组：I-outbound-ssl。目标字段：inheritance。

注册 LOC_CONF_OFFSET → src/core/ngx_conf_file.c 的 str setter → ssl_crl 初态 → 本域逐字段 merge → set_ssl → socket 的 u->conf->ssl。

- inheritance [verified]：在 NGX_HTTP_SSL 分支，http→server→location 逐级合并 loc_conf.ssl_crl：本层字符串 data==NULL 时复制父级整个字符串；父也未设置才取本域 merge 缺省。本层显式字符串（包括已解析的空字符串）阻断父值，不追加、不拼接；同层重复由 str setter 拒绝。 当全部 SSL 配置槽都未设置时 merge_ssl 可共享父 SSL 对象；已有 ctx 时 set_ssl 跳过重复构建，不改变上述各字段的合并规则。空值交由 ngx_ssl_crl 的空路径分支处理。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_ssl_crl-ssl-create`、`merge-default`、`implementation-0`、`df340-lua-h-lua_ssl_crl-ssl-merge-macro`、`df340-lua-h-lua_ssl_crl-ssl-hierarchy`、`implementation-4`、`df340-lua-h-lua_ssl_crl-ssl-context-already-created`、`implementation-5`、`df340-lua-h-lua_ssl_crl-crl-empty-path`。

父未设/子未设取本域 merge 分支（命令数组 NULL 特例见事实）；父已设/子未设与子显式设置的判据分别见上，不从 HTTP 的实现类推 stream。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:686–691（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1066–1089（冻结基线保留）。
- `df340-lua-h-lua_ssl_crl-ssl-create` → lua-nginx-module/`src/ngx_http_lua_module.c`:1378–1451（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1534–1534（冻结基线保留）。
- `implementation-0` → lua-nginx-module/`src/ngx_http_lua_module.c`:1701–1703（冻结基线保留）。
- `df340-lua-h-lua_ssl_crl-ssl-merge-macro` → nginx/`src/core/ngx_conf_file.h`:240–249（新）。
- `df340-lua-h-lua_ssl_crl-ssl-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `implementation-4` → lua-nginx-module/`src/ngx_http_lua_module.c`:1585–1631（冻结基线保留）。
- `df340-lua-h-lua_ssl_crl-ssl-context-already-created` → lua-nginx-module/`src/ngx_http_lua_module.c`:1635–1641（新）。
- `implementation-5` → lua-nginx-module/`src/ngx_http_lua_socket_tcp.c`:1689–1697（冻结基线保留）。
- `df340-lua-h-lua_ssl_crl-crl-empty-path` → nginx/`src/event/ngx_event_openssl.c`:988–995（新，L01空CRL路径消费）。

补丁核对：本次新增 Nginx 引用为未受有效补丁修改的 ngx_conf_file.h、ngx_http.c。逐一核对固定34补丁目标；openssl.c 的 ssl_cert_cb_yield、ssl_sess_cb_yield、ssl_client_hello_cb_yield 实际 hunk 仅改 handshake/early_data 的异步回调错误分支，不改命令执行函数。Lua create/merge/set_ssl 无直接补丁；此处仅新增配置传播结论，不扩大旧 SSL 运行补丁结论。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### lua-nginx-module--ngx_http_lua_module--lua_ssl_conf_command

组：I-outbound-ssl。目标字段：inheritance。

注册 LOC_CONF_OFFSET → src/core/ngx_conf_file.c 的 commands setter → ssl_conf_commands 初态 → 本域逐字段 merge → set_ssl → socket 的 u->conf->ssl。

- inheritance [verified]：在 NGX_HTTP_SSL 分支，http→server→location 逐级合并 loc_conf.ssl_conf_commands：create 将本层设为 NGX_CONF_UNSET_PTR，未配置时继承父级整组命令，父也未设则 NULL；本层至少一条时用本层整组替代父组。同层 keyval setter 按出现顺序追加，执行位于其他 Lua SSL 参数设置之后，可能覆盖相应 SSL_CTX 属性。该指令在固定 Nginx 1.27.1 满足版本门槛，但显式配置仍需 SSL_CONF_FLAG_FILE 平台支持；不支持时 post 检查报错。 当全部 SSL 配置槽都未设置时 merge_ssl 可共享父 SSL 对象；已有 ctx 时 set_ssl 跳过重复构建，不改变上述各字段的合并规则。 来源：`registration`、`configuration-definition`、`df340-lua-h-lua_ssl_conf_command-ssl-create`、`merge-default`、`implementation-1`、`df340-lua-h-lua_ssl_conf_command-ssl-merge-macro`、`df340-lua-h-lua_ssl_conf_command-ssl-hierarchy`、`implementation-4`、`df340-lua-h-lua_ssl_conf_command-ssl-context-already-created`、`implementation-5`、`implementation-2`、`implementation-3`。

父未设/子未设取本域 merge 分支（命令数组 NULL 特例见事实）；父已设/子未设与子显式设置的判据分别见上，不从 HTTP 的实现类推 stream。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → lua-nginx-module/`src/ngx_http_lua_module.c`:694–699（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1129–1163（冻结基线保留）。
- `df340-lua-h-lua_ssl_conf_command-ssl-create` → lua-nginx-module/`src/ngx_http_lua_module.c`:1378–1451（新）。
- `merge-default` → lua-nginx-module/`src/ngx_http_lua_module.c`:1536–1539（冻结基线保留）。
- `implementation-1` → lua-nginx-module/`src/ngx_http_lua_module.c`:1705–1713（冻结基线保留）。
- `df340-lua-h-lua_ssl_conf_command-ssl-merge-macro` → nginx/`src/core/ngx_conf_file.h`:210–213（新）。
- `df340-lua-h-lua_ssl_conf_command-ssl-hierarchy` → nginx/`src/http/ngx_http.c`:562–666（新）。
- `implementation-4` → lua-nginx-module/`src/ngx_http_lua_module.c`:1585–1631（冻结基线保留）。
- `df340-lua-h-lua_ssl_conf_command-ssl-context-already-created` → lua-nginx-module/`src/ngx_http_lua_module.c`:1635–1641（新）。
- `implementation-5` → lua-nginx-module/`src/ngx_http_lua_socket_tcp.c`:1689–1697（冻结基线保留）。
- `implementation-2` → lua-nginx-module/`src/ngx_http_lua_module.c`:1716–1725（冻结基线保留）。
- `implementation-3` → nginx/`src/event/ngx_event_openssl.c`:1595–1664（冻结基线保留）。

补丁核对：本次新增 Nginx 引用为未受有效补丁修改的 ngx_conf_file.h、ngx_http.c 及 ngx_event_openssl.c:1595–1664 的 ngx_ssl_conf_commands。逐一核对固定34补丁目标；openssl.c 的 ssl_cert_cb_yield、ssl_sess_cb_yield、ssl_client_hello_cb_yield 实际 hunk 仅改 handshake/early_data 的异步回调错误分支，不改命令执行函数。Lua create/merge/set_ssl 无直接补丁；此处仅新增配置传播结论，不扩大旧 SSL 运行补丁结论。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_ssl_protocols

组：I-outbound-ssl。目标字段：inheritance。

注册 SRV_CONF_OFFSET → src/core/ngx_conf_file.c 的 bitmask setter → ssl_protocols 初态 → 本域逐字段 merge → set_ssl → socket 的 u->conf->ssl。

- inheritance [verified]：在 NGX_STREAM_SSL 分支，stream 默认 srv_conf→各 server 的独立 srv_conf 合并 ssl_protocols：本层值为0（未配置）时整体采用父级非零协议掩码；父也未配置才取本域 merge 的缺省掩码。本层显式协议生成自己的掩码，阻断父掩码，不把父协议追加进来；同层多次配置由 bitmask setter 按位合并，与父子继承不同。合并后的字段用于当前 server 新建的 Lua 出站 SSL_CTX，不是下游 ssl_*_by_lua 回调槽。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_ssl_protocols-ssl-create`、`merge-default`、`implementation-1`、`df340-lua-s-lua_ssl_protocols-ssl-merge-macro`、`df340-lua-s-lua_ssl_protocols-ssl-hierarchy`、`df340-lua-s-lua_ssl_protocols-ssl-context-per-server`、`implementation-3`。

父未设/子未设取本域 merge 分支（命令数组 NULL 特例见事实）；父已设/子未设与子显式设置的判据分别见上，不从 HTTP 的实现类推 stream。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:378–383（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1389–1431（冻结基线保留）。
- `df340-lua-s-lua_ssl_protocols-ssl-create` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:805–856（新）。
- `merge-default` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:964–967（冻结基线保留）。
- `implementation-1` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:1066–1068（冻结基线保留）。
- `df340-lua-s-lua_ssl_protocols-ssl-merge-macro` → nginx/`src/core/ngx_conf_file.h`:262–265（新）。
- `df340-lua-s-lua_ssl_protocols-ssl-hierarchy` → nginx/`src/stream/ngx_stream.c`:224–239（新）。
- `df340-lua-s-lua_ssl_protocols-ssl-context-per-server` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:1041–1050（新）。
- `implementation-3` → stream-lua-nginx-module/`src/ngx_stream_lua_socket_tcp.c`:1628–1638（冻结基线保留）。

补丁核对：本次新增 Nginx 引用为未受有效补丁修改的 ngx_conf_file.h、ngx_stream.c。逐一核对固定34补丁目标；openssl.c 的 ssl_cert_cb_yield、ssl_sess_cb_yield、ssl_client_hello_cb_yield 实际 hunk 仅改 handshake/early_data 的异步回调错误分支，不改命令执行函数。Lua create/merge/set_ssl 无直接补丁；此处仅新增配置传播结论，不扩大旧 SSL 运行补丁结论。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_ssl_ciphers

组：I-outbound-ssl。目标字段：inheritance。

注册 SRV_CONF_OFFSET → src/core/ngx_conf_file.c 的 str setter → ssl_ciphers 初态 → 本域逐字段 merge → set_ssl → socket 的 u->conf->ssl。

- inheritance [verified]：在 NGX_STREAM_SSL 分支，stream 默认 srv_conf→各 server 的独立 srv_conf 合并 ssl_ciphers：本层字符串 data==NULL 时复制父级整个字符串；父也未设置才取本域 merge 缺省。本层显式字符串（包括已解析的空字符串）阻断父值，不追加、不拼接；同层重复由 str setter 拒绝。合并后的字段用于当前 server 新建的 Lua 出站 SSL_CTX，不是下游 ssl_*_by_lua 回调槽。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_ssl_ciphers-ssl-create`、`merge-default`、`implementation-0`、`df340-lua-s-lua_ssl_ciphers-ssl-merge-macro`、`df340-lua-s-lua_ssl_ciphers-ssl-hierarchy`、`df340-lua-s-lua_ssl_ciphers-ssl-context-per-server`、`implementation-2`。

父未设/子未设取本域 merge 分支（命令数组 NULL 特例见事实）；父已设/子未设与子显式设置的判据分别见上，不从 HTTP 的实现类推 stream。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:385–390（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1066–1089（冻结基线保留）。
- `df340-lua-s-lua_ssl_ciphers-ssl-create` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:805–856（新）。
- `merge-default` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:969–970（冻结基线保留）。
- `implementation-0` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:1078–1086（冻结基线保留）。
- `df340-lua-s-lua_ssl_ciphers-ssl-merge-macro` → nginx/`src/core/ngx_conf_file.h`:240–249（新）。
- `df340-lua-s-lua_ssl_ciphers-ssl-hierarchy` → nginx/`src/stream/ngx_stream.c`:224–239（新）。
- `df340-lua-s-lua_ssl_ciphers-ssl-context-per-server` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:1041–1050（新）。
- `implementation-2` → stream-lua-nginx-module/`src/ngx_stream_lua_socket_tcp.c`:1628–1638（冻结基线保留）。

补丁核对：本次新增 Nginx 引用为未受有效补丁修改的 ngx_conf_file.h、ngx_stream.c。逐一核对固定34补丁目标；openssl.c 的 ssl_cert_cb_yield、ssl_sess_cb_yield、ssl_client_hello_cb_yield 实际 hunk 仅改 handshake/early_data 的异步回调错误分支，不改命令执行函数。Lua create/merge/set_ssl 无直接补丁；此处仅新增配置传播结论，不扩大旧 SSL 运行补丁结论。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_ssl_verify_depth

组：I-outbound-ssl。目标字段：inheritance。

注册 SRV_CONF_OFFSET → src/core/ngx_conf_file.c 的 uint setter → ssl_verify_depth 初态 → 本域逐字段 merge → set_ssl → socket 的 u->conf->ssl。

- inheritance [verified]：在 NGX_STREAM_SSL 分支，stream 默认 srv_conf→各 server 的独立 srv_conf 合并 ssl_verify_depth：本层为 NGX_CONF_UNSET_UINT 时采用父值，父也未设置才用1；本层显式非负数覆盖父值，不累加，同层重复拒绝。此字段供 CA 加载时设置验证深度，不据此推断调用者已开启对端验证。合并后的字段用于当前 server 新建的 Lua 出站 SSL_CTX，不是下游 ssl_*_by_lua 回调槽。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_ssl_verify_depth-ssl-create`、`merge-default`、`implementation-0`、`df340-lua-s-lua_ssl_verify_depth-ssl-merge-macro`、`df340-lua-s-lua_ssl_verify_depth-ssl-hierarchy`、`df340-lua-s-lua_ssl_verify_depth-ssl-context-per-server`、`df340-lua-s-lua_ssl_verify_depth-ssl-socket-context`。

父未设/子未设取本域 merge 分支（命令数组 NULL 特例见事实）；父已设/子未设与子显式设置的判据分别见上，不从 HTTP 的实现类推 stream。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:421–426（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1167–1194（冻结基线保留）。
- `df340-lua-s-lua_ssl_verify_depth-ssl-create` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:805–856（新）。
- `merge-default` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:972–973（冻结基线保留）。
- `implementation-0` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:1098–1105（冻结基线保留）。
- `df340-lua-s-lua_ssl_verify_depth-ssl-merge-macro` → nginx/`src/core/ngx_conf_file.h`:215–218（新）。
- `df340-lua-s-lua_ssl_verify_depth-ssl-hierarchy` → nginx/`src/stream/ngx_stream.c`:224–239（新）。
- `df340-lua-s-lua_ssl_verify_depth-ssl-context-per-server` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:1041–1050（新）。
- `df340-lua-s-lua_ssl_verify_depth-ssl-socket-context` → stream-lua-nginx-module/`src/ngx_stream_lua_socket_tcp.c`:1628–1638（新）。

补丁核对：本次新增 Nginx 引用为未受有效补丁修改的 ngx_conf_file.h、ngx_stream.c。逐一核对固定34补丁目标；openssl.c 的 ssl_cert_cb_yield、ssl_sess_cb_yield、ssl_client_hello_cb_yield 实际 hunk 仅改 handshake/early_data 的异步回调错误分支，不改命令执行函数。Lua create/merge/set_ssl 无直接补丁；此处仅新增配置传播结论，不扩大旧 SSL 运行补丁结论。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_ssl_certificate

组：I-outbound-ssl。目标字段：inheritance。

注册 SRV_CONF_OFFSET → src/core/ngx_conf_file.c 的 array setter → ssl_certificates 初态 → 本域逐字段 merge → set_ssl → socket 的 u->conf->ssl。

- inheritance [verified]：在 NGX_STREAM_SSL 分支，stream 默认 srv_conf→各 server 的独立 srv_conf 合并 ssl_certificates：本层为 NGX_CONF_UNSET_PTR 时继承父级整个同名数组，父也未设则为 NULL；本层至少一条时采用本层数组整体替代父数组，不追加父元素；同层多次配置按顺序追加。证书数组与私钥数组各自独立合并，最终加载前校验存在证书时私钥数量不少于证书数量，不把两指令误写为绑定覆盖槽。合并后的字段用于当前 server 新建的 Lua 出站 SSL_CTX，不是下游 ssl_*_by_lua 回调槽。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_ssl_certificate-ssl-create`、`merge-default`、`df340-lua-s-lua_ssl_certificate-ssl-consume`、`df340-lua-s-lua_ssl_certificate-ssl-merge-macro`、`df340-lua-s-lua_ssl_certificate-ssl-hierarchy`、`df340-lua-s-lua_ssl_certificate-ssl-context-per-server`、`implementation-3`。

父未设/子未设取本域 merge 分支（命令数组 NULL 特例见事实）；父已设/子未设与子显式设置的判据分别见上，不从 HTTP 的实现类推 stream。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:428–433（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1093–1125（冻结基线保留）。
- `df340-lua-s-lua_ssl_certificate-ssl-create` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:805–856（新）。
- `merge-default` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:974–975（冻结基线保留）。
- `df340-lua-s-lua_ssl_certificate-ssl-consume` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:1052–1096（新）。
- `df340-lua-s-lua_ssl_certificate-ssl-merge-macro` → nginx/`src/core/ngx_conf_file.h`:210–213（新）。
- `df340-lua-s-lua_ssl_certificate-ssl-hierarchy` → nginx/`src/stream/ngx_stream.c`:224–239（新）。
- `df340-lua-s-lua_ssl_certificate-ssl-context-per-server` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:1041–1050（新）。
- `implementation-3` → stream-lua-nginx-module/`src/ngx_stream_lua_socket_tcp.c`:1628–1638（冻结基线保留）。

补丁核对：本次新增 Nginx 引用为未受有效补丁修改的 ngx_conf_file.h、ngx_stream.c。逐一核对固定34补丁目标；openssl.c 的 ssl_cert_cb_yield、ssl_sess_cb_yield、ssl_client_hello_cb_yield 实际 hunk 仅改 handshake/early_data 的异步回调错误分支，不改命令执行函数。Lua create/merge/set_ssl 无直接补丁；此处仅新增配置传播结论，不扩大旧 SSL 运行补丁结论。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_ssl_certificate_key

组：I-outbound-ssl。目标字段：inheritance。

注册 SRV_CONF_OFFSET → src/core/ngx_conf_file.c 的 array setter → ssl_certificate_keys 初态 → 本域逐字段 merge → set_ssl → socket 的 u->conf->ssl。

- inheritance [verified]：在 NGX_STREAM_SSL 分支，stream 默认 srv_conf→各 server 的独立 srv_conf 合并 ssl_certificate_keys：本层为 NGX_CONF_UNSET_PTR 时继承父级整个同名数组，父也未设则为 NULL；本层至少一条时采用本层数组整体替代父数组，不追加父元素；同层多次配置按顺序追加。证书数组与私钥数组各自独立合并，最终加载前校验存在证书时私钥数量不少于证书数量，不把两指令误写为绑定覆盖槽。合并后的字段用于当前 server 新建的 Lua 出站 SSL_CTX，不是下游 ssl_*_by_lua 回调槽。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_ssl_certificate_key-ssl-create`、`merge-default`、`df340-lua-s-lua_ssl_certificate_key-ssl-consume`、`df340-lua-s-lua_ssl_certificate_key-ssl-merge-macro`、`df340-lua-s-lua_ssl_certificate_key-ssl-hierarchy`、`df340-lua-s-lua_ssl_certificate_key-ssl-context-per-server`、`implementation-4`。

父未设/子未设取本域 merge 分支（命令数组 NULL 特例见事实）；父已设/子未设与子显式设置的判据分别见上，不从 HTTP 的实现类推 stream。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:435–440（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1093–1125（冻结基线保留）。
- `df340-lua-s-lua_ssl_certificate_key-ssl-create` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:805–856（新）。
- `merge-default` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:976–977（冻结基线保留）。
- `df340-lua-s-lua_ssl_certificate_key-ssl-consume` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:1052–1096（新）。
- `df340-lua-s-lua_ssl_certificate_key-ssl-merge-macro` → nginx/`src/core/ngx_conf_file.h`:210–213（新）。
- `df340-lua-s-lua_ssl_certificate_key-ssl-hierarchy` → nginx/`src/stream/ngx_stream.c`:224–239（新）。
- `df340-lua-s-lua_ssl_certificate_key-ssl-context-per-server` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:1041–1050（新）。
- `implementation-4` → stream-lua-nginx-module/`src/ngx_stream_lua_socket_tcp.c`:1628–1638（冻结基线保留）。

补丁核对：本次新增 Nginx 引用为未受有效补丁修改的 ngx_conf_file.h、ngx_stream.c。逐一核对固定34补丁目标；openssl.c 的 ssl_cert_cb_yield、ssl_sess_cb_yield、ssl_client_hello_cb_yield 实际 hunk 仅改 handshake/early_data 的异步回调错误分支，不改命令执行函数。Lua create/merge/set_ssl 无直接补丁；此处仅新增配置传播结论，不扩大旧 SSL 运行补丁结论。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_ssl_trusted_certificate

组：I-outbound-ssl。目标字段：inheritance。

注册 SRV_CONF_OFFSET → src/core/ngx_conf_file.c 的 str setter → ssl_trusted_certificate 初态 → 本域逐字段 merge → set_ssl → socket 的 u->conf->ssl。

- inheritance [verified]：在 NGX_STREAM_SSL 分支，stream 默认 srv_conf→各 server 的独立 srv_conf 合并 ssl_trusted_certificate：本层字符串 data==NULL 时复制父级整个字符串；父也未设置才取本域 merge 缺省。本层显式字符串（包括已解析的空字符串）阻断父值，不追加、不拼接；同层重复由 str setter 拒绝。合并后的字段用于当前 server 新建的 Lua 出站 SSL_CTX，不是下游 ssl_*_by_lua 回调槽。合并值 len==0 时不调用此 CA 文件加载。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_ssl_trusted_certificate-ssl-create`、`merge-default`、`implementation-0`、`df340-lua-s-lua_ssl_trusted_certificate-ssl-merge-macro`、`df340-lua-s-lua_ssl_trusted_certificate-ssl-hierarchy`、`df340-lua-s-lua_ssl_trusted_certificate-ssl-context-per-server`、`df340-lua-s-lua_ssl_trusted_certificate-ssl-socket-context`。

父未设/子未设取本域 merge 分支（命令数组 NULL 特例见事实）；父已设/子未设与子显式设置的判据分别见上，不从 HTTP 的实现类推 stream。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:442–447（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1066–1089（冻结基线保留）。
- `df340-lua-s-lua_ssl_trusted_certificate-ssl-create` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:805–856（新）。
- `merge-default` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:978–979（冻结基线保留）。
- `implementation-0` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:1098–1105（冻结基线保留）。
- `df340-lua-s-lua_ssl_trusted_certificate-ssl-merge-macro` → nginx/`src/core/ngx_conf_file.h`:240–249（新）。
- `df340-lua-s-lua_ssl_trusted_certificate-ssl-hierarchy` → nginx/`src/stream/ngx_stream.c`:224–239（新）。
- `df340-lua-s-lua_ssl_trusted_certificate-ssl-context-per-server` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:1041–1050（新）。
- `df340-lua-s-lua_ssl_trusted_certificate-ssl-socket-context` → stream-lua-nginx-module/`src/ngx_stream_lua_socket_tcp.c`:1628–1638（新）。

补丁核对：本次新增 Nginx 引用为未受有效补丁修改的 ngx_conf_file.h、ngx_stream.c。逐一核对固定34补丁目标；openssl.c 的 ssl_cert_cb_yield、ssl_sess_cb_yield、ssl_client_hello_cb_yield 实际 hunk 仅改 handshake/early_data 的异步回调错误分支，不改命令执行函数。Lua create/merge/set_ssl 无直接补丁；此处仅新增配置传播结论，不扩大旧 SSL 运行补丁结论。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_ssl_crl

组：I-outbound-ssl。目标字段：inheritance。

注册 SRV_CONF_OFFSET → src/core/ngx_conf_file.c 的 str setter → ssl_crl 初态 → 本域逐字段 merge → set_ssl → socket 的 u->conf->ssl。

- inheritance [verified]：在 NGX_STREAM_SSL 分支，stream 默认 srv_conf→各 server 的独立 srv_conf 合并 ssl_crl：本层字符串 data==NULL 时复制父级整个字符串；父也未设置才取本域 merge 缺省。本层显式字符串（包括已解析的空字符串）阻断父值，不追加、不拼接；同层重复由 str setter 拒绝。合并后的字段用于当前 server 新建的 Lua 出站 SSL_CTX，不是下游 ssl_*_by_lua 回调槽。空值交由 ngx_ssl_crl 的空路径分支处理。 来源：`registration`、`configuration-definition`、`df340-lua-s-lua_ssl_crl-ssl-create`、`merge-default`、`implementation-0`、`df340-lua-s-lua_ssl_crl-ssl-merge-macro`、`df340-lua-s-lua_ssl_crl-ssl-hierarchy`、`df340-lua-s-lua_ssl_crl-ssl-context-per-server`、`df340-lua-s-lua_ssl_crl-ssl-socket-context`、`df340-lua-s-lua_ssl_crl-crl-empty-path`。

父未设/子未设取本域 merge 分支（命令数组 NULL 特例见事实）；父已设/子未设与子显式设置的判据分别见上，不从 HTTP 的实现类推 stream。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:449–454（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1066–1089（冻结基线保留）。
- `df340-lua-s-lua_ssl_crl-ssl-create` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:805–856（新）。
- `merge-default` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:980–980（冻结基线保留）。
- `implementation-0` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:1107–1111（冻结基线保留）。
- `df340-lua-s-lua_ssl_crl-ssl-merge-macro` → nginx/`src/core/ngx_conf_file.h`:240–249（新）。
- `df340-lua-s-lua_ssl_crl-ssl-hierarchy` → nginx/`src/stream/ngx_stream.c`:224–239（新）。
- `df340-lua-s-lua_ssl_crl-ssl-context-per-server` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:1041–1050（新）。
- `df340-lua-s-lua_ssl_crl-ssl-socket-context` → stream-lua-nginx-module/`src/ngx_stream_lua_socket_tcp.c`:1628–1638（新）。
- `df340-lua-s-lua_ssl_crl-crl-empty-path` → nginx/`src/event/ngx_event_openssl.c`:988–995（新，L01空CRL路径消费）。

补丁核对：本次新增 Nginx 引用为未受有效补丁修改的 ngx_conf_file.h、ngx_stream.c。逐一核对固定34补丁目标；openssl.c 的 ssl_cert_cb_yield、ssl_sess_cb_yield、ssl_client_hello_cb_yield 实际 hunk 仅改 handshake/early_data 的异步回调错误分支，不改命令执行函数。Lua create/merge/set_ssl 无直接补丁；此处仅新增配置传播结论，不扩大旧 SSL 运行补丁结论。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

### stream-lua-nginx-module--ngx_stream_lua_module--lua_ssl_conf_command

组：I-outbound-ssl。目标字段：defaults、inheritance。

注册 SRV_CONF_OFFSET → src/core/ngx_conf_file.c 的 commands setter → ssl_conf_commands 初态 → 本域逐字段 merge → set_ssl → socket 的 u->conf->ssl。

- defaults [verified]：在本固定 stream Lua 版本，未写本指令的 srv_conf.ssl_conf_commands 保持 pcalloc 得到的 NULL（create 没有设置 UNSET_PTR）；merge_ptr 不把它改成父级命令。每个 server 创建自己的 SSL_CTX，ngx_ssl_conf_commands 收到 NULL 直接返回，不附加任何 SSL_CONF 命令；这不表示关闭 SSL 或其余 lua_ssl_* 设置。 来源：`registration`、`configuration-definition`、`implementation-2`、`df340-lua-s-lua_ssl_conf_command-ssl-merge`、`implementation-4`、`implementation-5`、`df340-lua-s-lua_ssl_conf_command-ssl-hierarchy`、`df340-lua-s-lua_ssl_conf_command-ssl-context-per-server`、`df340-lua-s-lua_ssl_conf_command-ssl-socket-context`、`implementation-1`、`implementation-7`。
- inheritance [verified]：在 NGX_STREAM_SSL 分支，stream 默认 srv_conf→各 server 的独立 srv_conf 合并 ssl_conf_commands：本固定版本 create 仅 pcalloc、未把 ssl_conf_commands 设为 NGX_CONF_UNSET_PTR，因此本层未配置为 NULL；merge_ptr 只检查 UNSET_PTR，NULL 不触发父数组继承。即使 stream 级有命令，未显式配置的 server 仍无该命令数组；本层配置时 keyval setter 从 NULL 新建数组并按出现顺序追加，不追加父命令。每个 server 单独创建 SSL_CTX，未通过共享父 SSL_CTX 间接取得父命令。该指令在固定 Nginx 1.27.1 满足版本门槛，但显式配置仍需 SSL_CONF_FLAG_FILE 平台支持；不支持时 post 检查报错。 来源：`registration`、`configuration-definition`、`implementation-2`、`df340-lua-s-lua_ssl_conf_command-ssl-merge`、`implementation-4`、`implementation-5`、`df340-lua-s-lua_ssl_conf_command-ssl-hierarchy`、`df340-lua-s-lua_ssl_conf_command-ssl-context-per-server`、`df340-lua-s-lua_ssl_conf_command-ssl-socket-context`、`implementation-1`、`implementation-7`。

父未设/子未设取本域 merge 分支（命令数组 NULL 特例见事实）；父已设/子未设与子显式设置的判据分别见上，不从 HTTP 的实现类推 stream。

逐 ID 来源索引（旧来源复用，新来源仅追加）：

- `registration` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:457–462（冻结基线保留）。
- `configuration-definition` → nginx/`src/core/ngx_conf_file.c`:1129–1163（冻结基线保留）。
- `implementation-2` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:805–856（冻结基线保留）。
- `df340-lua-s-lua_ssl_conf_command-ssl-merge` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:981–984（新）。
- `implementation-4` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:1113–1118（冻结基线保留）。
- `implementation-5` → nginx/`src/core/ngx_conf_file.h`:210–213（冻结基线保留）。
- `df340-lua-s-lua_ssl_conf_command-ssl-hierarchy` → nginx/`src/stream/ngx_stream.c`:224–239（新）。
- `df340-lua-s-lua_ssl_conf_command-ssl-context-per-server` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:1041–1050（新）。
- `df340-lua-s-lua_ssl_conf_command-ssl-socket-context` → stream-lua-nginx-module/`src/ngx_stream_lua_socket_tcp.c`:1628–1638（新）。
- `implementation-1` → stream-lua-nginx-module/`src/ngx_stream_lua_module.c`:1123–1131（冻结基线保留）。
- `implementation-7` → nginx/`src/event/ngx_event_openssl.c`:1595–1664（冻结基线保留）。

补丁核对：本次新增 Nginx 引用为未受有效补丁修改的 ngx_conf_file.h、ngx_stream.c 及 ngx_event_openssl.c:1595–1664 的 ngx_ssl_conf_commands。逐一核对固定34补丁目标；openssl.c 的 ssl_cert_cb_yield、ssl_sess_cb_yield、ssl_client_hello_cb_yield 实际 hunk 仅改 handshake/early_data 的异步回调错误分支，不改命令执行函数。Lua create/merge/set_ssl 无直接补丁；此处仅新增配置传播结论，不扩大旧 SSL 运行补丁结论。 patch_source_ids 仅列本次新 evidence ID，且与原 patch_status.source_ids 无交集；复用的旧来源仅在事实字段引用；不改变原 status/note。

## 自身逐项校验与最终交付

已回看129个ID的200个目标字段，逐一核对注册callback/offset、实际存储、create/init、未设/父设子未设/子显式设置与消费分支。无证据不足待保留项；not_applicable仅用于真实main无父子槽、独立upstream或废弃无状态入口，不用来代替未知。

| 组 | 身份 | 目标字段 |
| --- | ---: | ---: |
| B-main-special | 11 | 21 |
| A-main-scalar | 17 | 17 |
| D-scalar-merge | 24 | 24 |
| C-main-lifecycle | 14 | 28 |
| F-ndk-actions | 3 | 6 |
| E-http-server-rewrite | 2 | 4 |
| E-http-phase | 18 | 36 |
| G-upstream-balancer | 5 | 9 |
| E-stream-phase | 4 | 8 |
| E-stream-content | 3 | 6 |
| H-downstream-tls | 12 | 24 |
| I-outbound-ssl | 16 | 17 |
| 合计 | 129 | 200 |

只读结构校验结果：129身份精确等于manifest Lua子集（HTTP79/stream50）；字段精确71 defaults+129 inheritance；原目标字段在冻结详情均为unverified，未覆盖任何已有verified字段。129冻结详情SHA均匹配manifest。447条新evidence ID无碰撞，1388次字段来源引用均能解析到固定对象，覆盖60个来源文件；所有引用范围在真实文件内。每条patch_source_ids均为本条新增evidence ID，且与原patch.source_ids无交集，不含复用的registration/configuration-definition等旧ID。

数组在收到只追加要求后保持已交付101项前缀及其相对顺序，新增12项下游TLS和16项出站SSL依次追加。后续自身校验未改变129项JSON的事实、证据或顺序；JSON SHA-256：`5c4a87b8226c83f484a80bcf5ffd93953a4893fdb794b7c21354bda04a3afd0c`。

只读核对主线程当前集成快照：129项目标facts、新evidence及patch引用与本JSON全部一致，差异0；原知识快照1050条evidence保持内容和前缀顺序。该快照核对不是对主线程后续build/页面结果的验收，也未改knowledge。

最后一次补充仅改本报告：将3项HTTP balancer的补丁摘要“改请求初始化”精确为“改upstream_connect特殊状态码分支”，并加入宏、补丁后摘要和逐片段比较；不是JSON facts修正。HTTP content三项旧note覆盖边界已单列完整ID，不能漏到正式整合说明之外。

未运行build/tests、未执行OpenResty或读取私有样例；无新建Agent或联网，无429。没有产生需清理的临时文件。源事实补证与最终发行/桌面/现场验收分开计算。

## 保真与集成约束

主线程仅覆盖 manifest 指定字段并追加 evidence、patch source_ids；旧 evidence 与其顺序、隐式 defaults/inheritance/patch_status 派生及其来源必须保留，不应把旧条目重建为只含这次字段的新对象。特别是早期未显式写 defaults、patch_status 的条目，须以冻结详情及原始 default、evidence 派生关系保护；本 JSON 不是完整知识对象。

当前完成数仅指本线程静态源码补证交付，不等于独立审核、正式整合、build、浏览器或现场运行验收。

## L01返修：空CRL路径消费证据（2026-10-15）

独立审核首轮129身份/200字段中198字段通过，以下两项 inheritance 因缺消费分支引用退回。此次仅追加引用，不改变事实正文、status、任何既有来源对象或数组顺序；正式200字段通过仍待独立复核与主线程集成后的发布校验。

- `lua-nginx-module--ngx_http_lua_module--lua_ssl_crl / inheritance`：evidence、inheritance.source_ids、patch_source_ids 各在末尾新增 `df340-lua-h-lua_ssl_crl-crl-empty-path`。
- `stream-lua-nginx-module--ngx_stream_lua_module--lua_ssl_crl / inheritance`：三处各在末尾新增 `df340-lua-s-lua_ssl_crl-crl-empty-path`。

两个新evidence均为 component=nginx、file=`src/event/ngx_event_openssl.c`、start_line=988、end_line=995，固定revision=`e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`。988行为ngx_ssl_crl函数，993–995明确 `crl->len == 0` 时直接 `NGX_OK`，补齐“空值交由 ngx_ssl_crl 的空路径分支处理”的消费证据。

重新读取三项有效 ssl_cert_cb_yield、ssl_sess_cb_yield、ssl_client_hello_cb_yield 补丁全文，其hunk只改handshake/early_data回调分支，不改988–995。沿用前述内存重建方法核对最终openssl.c SHA-256仍等于既有审计 `0026b3d2b249ea4385245d9b632628d38af1f18b76902ec8ba213cab9de7f9b6`，新增988–995在补丁后仍位于988–995且原文完整保持。不改变既有patch_status.status/note；patch_source_ids各只追加本次新ID。

返修差异校验：仅上述2个JSON对象变化，每项仅evidence追加1条、inheritance.source_ids追加1个、patch_source_ids追加1个；正文/status、其他127项及全部对象顺序保持。新增来源均能解析、ID无碰撞、源文件范围与固定对象一致。总数保持129项/200字段，新evidence累计449条、字段来源引用累计1390次、来源文件仍60个；跨Nginx不同范围现33段，其中32段原文保持，唯一变化仍为已记录的HTTP core merge。

本节为最终返修快照，以上447条证据/1388次引用及旧JSON摘要、与主集成一致的记录均为返修前快照。返修后UPDATES SHA-256：`2c97b20b095df3634ccac1afb39c634a9928782d4358f66152203f578eae3c7c`。本次只改UPDATES及EVIDENCE，未改knowledge、tests、config、dist或审核文件。

