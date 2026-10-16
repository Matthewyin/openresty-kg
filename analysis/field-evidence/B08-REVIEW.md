# B08 审核结论

审核者：独立审核（只读）。范围：nginx 其余 HTTP 模块（access 至 limit_req，含 copy_filter 的 `output_buffers`），70 条 × syntax/summary，共 140 个字段。

方式：逐条读取 `source_ids` 对应片段；已有来源取自 `dist/.../directives/<id>.json`，新增 evidence（13 个）及全部片段均用 `git -C repos/nginx show e06bdbd4…:<file>` 按行号取回核对，行号无偏移；70 条 `patch_status` 均为 `verified_unaffected`。注册标志逐条与语法参数个数核对；enum/bitmask 取值表（autoindex_format、degrade、dav_methods、gzip_static、limit_conn/req_log_level）与语法一致，裁定 2 无遗漏。按裁定 1/3 逐函数检查“取配置变量是否在片段内赋值”（脚本 + 人工），发现下列调用链缺环。

## 总表

| # | 指令 | syntax | summary | 退回原因（一句） |
| --- | --- | --- | --- | --- |
| 1 | allow | 通过 | 通过 |  |
| 2 | deny | 通过 | 通过 |  |
| 3 | add_before_body | 通过 | 通过 | 修正通过（见下） |
| 4 | add_after_body | 通过 | 通过 | 修正通过（见下） |
| 5 | addition_types | 通过 | 通过 |  |
| 6 | auth_basic | 通过 | 通过 |  |
| 7 | auth_basic_user_file | 通过 | 通过 |  |
| 8 | auth_request | 通过 | 通过（复审1） | off→空 uri 的配置解析行未引用 |
| 9 | auth_request_set | 通过 | 通过 | summary 修正通过 |
| 10 | autoindex | 通过 | 通过 |  |
| 11 | autoindex_format | 通过 | 通过 |  |
| 12 | autoindex_localtime | 通过 | 通过 |  |
| 13 | autoindex_exact_size | 通过 | 通过（复审1） | alcf 取配置行（544）未引用 |
| 14 | modern_browser | 通过 | 通过 |  |
| 15 | ancient_browser | 通过 | 通过 |  |
| 16 | modern_browser_value | 通过 | 通过 |  |
| 17 | ancient_browser_value | 通过 | 通过 |  |
| 18 | charset | 通过 | 通过 |  |
| 19 | source_charset | 通过 | 通过 |  |
| 20 | override_charset | 通过 | 通过 |  |
| 21 | charset_types | 通过 | 通过 |  |
| 22 | charset_map | 通过 | 通过 |  |
| 23 | dav_methods | 通过 | 通过 | summary 修正通过 |
| 24 | create_full_put_path | 通过 | 通过 |  |
| 25 | min_delete_depth | 通过 | 通过 | summary 修正通过 |
| 26 | dav_access | 通过 | 通过（复审1） | mkcol 的 dlcf 取配置/传参行未引用 |
| 27 | degradation | 通过 | 通过 |  |
| 28 | degrade | 通过 | 通过 |  |
| 29 | empty_gif | 通过 | 通过 |  |
| 30 | flv | 通过 | 通过 |  |
| 31 | geo | 通过 | 通过 |  |
| 32 | geoip_country | 通过 | 通过 |  |
| 33 | geoip_org | 通过 | 通过 |  |
| 34 | geoip_city | 通过 | 通过 |  |
| 35 | geoip_proxy | 通过 | 通过（复审1） | addr 函数形参 gcf 的取配置/传参未引用 |
| 36 | geoip_proxy_recursive | 通过 | 通过（复审1） | 同 geoip_proxy |
| 37 | gunzip | 通过 | 通过 |  |
| 38 | gunzip_buffers | 通过 | 通过 |  |
| 39 | gzip | 通过 | 通过 |  |
| 40 | gzip_buffers | 通过 | 通过 |  |
| 41 | gzip_types | 通过 | 通过 |  |
| 42 | gzip_comp_level | 通过 | 通过 |  |
| 43 | gzip_window | 通过 | 通过（复审1） | ctx->wbits 的 memory() 调用点未引用 |
| 44 | gzip_hash | 通过 | 通过（复审1） | ctx->memlevel 的 memory() 调用点未引用 |
| 45 | postpone_gzipping | 通过 | 通过（复审1） | header_filter 的 conf 取配置行（227）未引用 |
| 46 | gzip_no_buffer | 通过 | 通过 | summary 修正通过 |
| 47 | gzip_min_length | 通过 | 通过 |  |
| 48 | gzip_static | 通过 | 通过 |  |
| 49 | expires | 通过（复审1） | 通过 | 语法关键字 epoch/max/off 的解析函数未引用 |
| 50 | add_header | 通过 | 通过 |  |
| 51 | add_trailer | 通过 | 通过 |  |
| 52 | image_filter | 通过 | 通过 |  |
| 53 | image_filter_jpeg_quality | 通过 | 通过 |  |
| 54 | image_filter_webp_quality | 通过 | 通过 | summary 修正通过 |
| 55 | image_filter_sharpen | 通过 | 通过 | summary 修正通过 |
| 56 | image_filter_transparency | 通过 | 通过 | summary 修正通过 |
| 57 | image_filter_interlace | 通过 | 通过 | summary 修正通过 |
| 58 | image_filter_buffer | 通过 | 通过 |  |
| 59 | index | 通过 | 通过 |  |
| 60 | limit_conn_zone | 通过 | 通过 |  |
| 61 | limit_conn | 通过 | 通过 |  |
| 62 | limit_conn_log_level | 通过 | 通过 |  |
| 63 | limit_conn_status | 通过 | 通过 |  |
| 64 | limit_conn_dry_run | 通过 | 通过 |  |
| 65 | limit_req_zone | 通过 | 通过 |  |
| 66 | limit_req | 通过 | 通过 |  |
| 67 | limit_req_log_level | 通过 | 通过 |  |
| 68 | limit_req_status | 通过 | 通过 |  |
| 69 | limit_req_dry_run | 通过 | 通过 |  |
| 70 | output_buffers | 通过 | 通过 |  |

## 退回清单（9 条，均为引用补缺，文字本身没有被源码证伪）

| ID（nginx--模块--名） | 字段 | 问题 | 应如何修正 |
| --- | --- | --- | --- |
| expires | 语法 | 关键字 `epoch`/`max`/`off` 与 `@` 日时点只在 `ngx_http_parse_expires`（headers_filter.c 约 463-533）中解析；syntax source_ids 仅有 registration + configuration-definition(707-771，只到调用 parse_expires 处)，关键字无片段对应。 | syntax source_ids 增加已有来源 `implementation-2`（headers_filter.c:325-533，含 parse_expires 472-488 的 epoch/max/off 分支），note 指明关键字出处。 |
| auth_request | 功能 | 「off关闭此检查」依赖 `ngx_http_auth_request` 把 off 置为空 uri（config-def 375 行）；summary source_ids 只有 implementation-0/1，只见 handler 的 `uri.len==0` 返回 DECLINED，缺 off→空串这一环。 | summary source_ids 增加已有来源 `configuration-definition`（auth_request.c:363-385）。 |
| autoindex_exact_size | 功能 | `if (alcf->exact_size)`（637）中的 `alcf` 来自 html 函数 544 行 `alcf = ngx_http_get_module_loc_conf(...)`，该行不在任何所引片段内（同批 autoindex_localtime 已用 summary-tp 补了 544-545）。 | 新增 evidence 覆盖 autoindex.c:544（可直接复用 544-545 的范围）并加入 summary source_ids。 |
| dav_access | 功能 | 「MKCOL建目录时把该配置传给文件操作」：mkcol_handler 的 `dlcf` 是形参，来源为 dav_handler 148 行取配置与 190 行 `ngx_http_dav_mkcol_handler(r, dlcf)`，两行均不在 dav_access 的 summary 片段内（PUT 一侧 263-266 已覆盖）。 | 新增 evidence dav.c:146-190（或分别 148、190 行）加入 summary source_ids；也可复用 dav_methods 的 implementation-1(143-302)。 |
| geoip_proxy | 功能 | `ngx_http_geoip_addr(r, gcf)` 的 `gcf` 是形参，取主配置与传参发生在各变量取值函数（如 country_variable 354/365 行），不在本条片段内，`gcf->proxies` 与本指令写入的配置之间缺环。 | 新增 evidence geoip.c:341-385（含 `gcf = ngx_http_get_module_main_conf` 与 `ngx_http_geoip_addr(r, gcf)`）加入 summary source_ids。 |
| geoip_proxy_recursive | 功能 | 同 geoip_proxy：`gcf->proxy_recursive` 经形参进入 addr 函数，`gcf` 的取得与传参不在片段内。 | 同 geoip_proxy，补 geoip.c:341-385。 |
| gzip_window | 功能 | `ctx->wbits` 只在 `ngx_http_gzip_filter_memory()` 内由 `conf->wbits` 赋值；该函数的调用点（header_filter 276 行）不在所引片段内（implementation-2 是函数定义 469-533），调用链缺环。 | 新增 evidence gzip_filter.c:271-276（`ctx->buffering…; ngx_http_gzip_filter_memory(r, ctx);`）加入 summary source_ids。 |
| gzip_hash | 功能 | 同 gzip_window：`ctx->memlevel` 经 `ngx_http_gzip_filter_memory()` 赋值，其调用点（276 行）未被引用。 | 同 gzip_window，补 276 行调用点。 |
| postpone_gzipping | 功能 | header_filter 中 `ctx->buffering = (conf->postpone_gzipping != 0)`（274 行）所用 `conf` 来自 227 行取配置，implementation-0 仅为 267-276，不含 227 行（裁定 3 要求取配置与使用在同一共享片段内）。 | 把 implementation-0 的范围扩为包含 227 与 274 的片段（如新增 evidence 227-276），替换/补充原 267-276。 |

## 计数

| 字段 | 通过 | 退回 | 证据不足属实 | 可晋级 |
| --- | --- | --- | --- | --- |
| syntax | 70 | 0（初审退回 1，复审 1 已解决） | 0 | 0 |
| summary | 70 | 0（初审退回 8，复审 1 已解决） | 0 | 0 |

## 重点判断

### add_before_body / add_after_body 收窄后的文字
- **准确**：源码（addition_filter.c 96-209）显示：头过滤器要求状态 200、`r == r->main`、before/after 至少一个非空、类型匹配；体过滤器在 `!ctx->before_body_sent` 时于 `ngx_http_next_body_filter` 之前对 `before_body` 调 `ngx_http_subrequest`；after 在遇到 last_buf 后清掉 last_buf、先传给后续过滤器，再对 `after_body` 建子请求并 `ngx_http_send_special(NGX_HTTP_LAST)`。两条修正的每个时点都有行号对应，无新增错误。
- **有用性**：可接受但偏弱。读者能知道“何时、对什么响应、创建指向哪个 URI 的子请求”，但看不出“输出内容会出现在正文前/后”。输出排序由 postpone 过滤器与 `ngx_http_subrequest` 的 postponed 队列决定，两者均不在片段内，因此不能晋级原文。建议（非退回项）：在现有修正后保留一句不作核实声明的说明，例如“子请求输出与主响应的先后由 postpone 机制决定，本条不核实”，避免读者误以为本站已证明插入位置。

### 外部库收窄（zlib / GD / GeoIP）
- 已收窄的描述均与源码一致：gdImageJpegPtr/WebpPtrEx/Sharpen/Interlace 的实参来源、deflateInit2/inflateInit2 的参数、GeoIP_open 与 `_by_ipnum` 调用都能在片段中找到；WebP 补充的 `NGX_HAVE_GD_WEBP` 条件有 image_out 1195-1213 的 `#if` 与 `#else` 报错分支支撑。
- 小瑕疵（不退回）：`image_filter_transparency` 修正后仍写“仅处理颜色总数非零的调色板图像”。源码只证明 `colors`（来自 `gdImageColorsTotal`）非零；“调色板图像”是 GD 的语义。可再收窄为“仅在源图颜色总数非零时”。`gunzip_buffers` 的“等待下游消耗”实为 nomem 时先把已有输出交给后续过滤器并回收缓冲，措辞略宽但与片段不冲突。

### 11 条 corrections 逐条
| 指令 | 结论 |
| --- | --- |
| add_before_body / add_after_body | 有源码依据、最小化，见上。 |
| auth_request_set | 删去“可用于读取认证上游的响应信息”，该分句无片段支撑，修正合理。 |
| dav_methods | PUT（put_handler 262-289 的 `ngx_ext_rename_file`）、MKCOL（`ngx_create_dir`）有片段，DELETE/COPY/MOVE 仅陈述分派（dav_handler 的 switch），措辞与片段一致。 |
| min_delete_depth | 按 `/` 计数且 `i < r->uri.len`、日志后返回 409、merge 默认 0，均与 delete_handler 321-337 吻合。 |
| dav_access | 收窄为 PUT 与 MKCOL 合理；但其 MKCOL 一侧的取配置/传参未被引用（见退回）。 |
| gzip_no_buffer | 与 deflate 末尾 `conf->no_buffer && ctx->in == NULL` 分支（853-866）一致，“返回等待更多输入”对应 `NGX_AGAIN`。 |
| image_filter_webp_quality | 补条件有据。 |
| image_filter_sharpen | “强度值（大于0时才调用）”与 `if (sharpen > 0) gdImageSharpen` 一致。 |
| image_filter_transparency | 方向正确，见上小瑕疵。 |
| image_filter_interlace | 与 `gdImageInterlace(dst, (int) conf->interlace)` 一致。 |
全部 corrections 未引入新错误；语法无修正（`ancient_browser` 的 `netscape4`、`limit_req_zone` 官方文档的 `sync`、`geoip_*` 的 `utf8`、`gzip_window/hash` 的取值限制已按源码核对，原语法字符串不少列关键字，接受）。

### 其他核对要点
- 语法 verified 的 70 个字段中仅 `expires` 缺关键字出处：`epoch|max|off`、`@` 在 `ngx_http_parse_expires`（headers_filter.c 472-488），而 syntax 只引了 707-771 的 `ngx_http_headers_expires`。
- 裁定 4 无适用项（本批无废弃指令）。
- 官方文档仅作交叉印证，无冲突。

## 构建检查

`node scripts/build.mjs --config project.config.json --check` 退出码 0；B08 为 syntax 70/0、summary 70/0、entries 70，与实施报告一致（该计数不反映本次审核退回，退回项补充引用后应保持 70/0）。

## 复审 1

依据 review-brief 裁定 1-7 重读；全部片段按 revision e06bdbd4… 与行号用 `git show` 取回核对；新增 evidence 共 7 个（总数 20），corrections 14 条。

### 初审 9 条退回
| 指令 | 字段 | 结论 | 依据 |
| --- | --- | --- | --- |
| expires | syntax | ADDRESSED | source_ids 增 implementation-2（headers_filter.c:325-533），含 parse_expires 的 epoch/max/off（472-482）与 `@`（488）。 |
| auth_request | summary | ADDRESSED | 增 configuration-definition（363-385，375 行 off 分支）。 |
| autoindex_exact_size | summary | ADDRESSED | summary-alcf（autoindex.c:544-545）含 `alcf = ngx_http_get_module_loc_conf`。 |
| dav_access | summary | ADDRESSED | summary-dav-dispatch（dav.c:146-190）含 148 取 dlcf、190 传给 mkcol_handler。 |
| geoip_proxy | summary | ADDRESSED | summary-gcf（geoip.c:341-385）含 354 取主配置与 363/365 传入 ngx_http_geoip_addr。 |
| geoip_proxy_recursive | summary | ADDRESSED | 同上。 |
| gzip_window | summary | ADDRESSED | summary-memory-call（gzip_filter.c:271-276）含 276 行 memory() 调用。 |
| gzip_hash | summary | ADDRESSED | 同上。 |
| postpone_gzipping | summary | ADDRESSED | summary-header-conf（227-276）含 227 取 conf 与 274 buffering 赋值，已替换原 267-276。 |

### 新增修正与片段
- `addition_types` / `charset_types` / `gzip_types` 语法补 `| *`：ngx_http_types_slot（ngx_http.c:2030-2103）中任一参数为单字符 `*` 即置 `*types = -1` 并返回，补充有源码依据，不与源码矛盾（符合裁定 6），无新错。
- `add_before_body` / `add_after_body`：追加“输出先后由 postpone 机制决定，本条不核实”，与片段无冲突，准确。
- `image_filter_transparency`：改为“仅在源图颜色总数非零时处理”，与 `colors && conf->transparency` 一致，已去除 GD 语义。
- 7 个新增片段行号与内容均与 revision 一致，ID 无碰撞，所有 source_ids 可解析。
- 复跑 `node scripts/build.mjs --config project.config.json --check`：退出码 0，B08 为 syntax 70/0、summary 70/0、entries 70。

复审 1 结论：全部通过，无遗留与新发现问题。
