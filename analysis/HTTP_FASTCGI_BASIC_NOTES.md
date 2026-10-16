# P02 HTTP FastCGI 49项实施与隔离验证记录

## 结论与写集

49/49身份已完成基础事实草稿，等待独立审核，未合入正式知识或发布。仅新增 analysis/content/HTTP_FASTCGI_BASIC.json 与本记录；proxy/upstream草稿冻结，P06/P07/P08/P09不在本写集。功能、语法、限制、配置回调及实际使用点逐条来自FastCGI模块和其接入的共享代码，不从proxy正文换前缀。

JSON SHA-256：8c0139266ee397454a00d60d05d50a565de71e31360cdd5770a31404920d5b53。

## 固定来源与方法

- nginx：e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928（1.27.1）。
- nginx-docs：e8b581903e9d41252720053311cea687a5671674；xml/en/docs/http/ngx_http_fastcgi_module.xml。
- openresty：8c37412c31621225e7aa7e825b5b50106c9c71c4（1.27.1.1）；util/mirror-tarballs及实际发行补丁。

读取既有P02计划、readiness和内容策略；所有源码/文档从本地 git show SHA:path 读取。注册身份使用现有catalog，回调显式引用完整定义，避免自动截取40行漏掉有效分支。来源范围先逐条检查，再与发行patch后的局部代码比较；网站构建只在临时副本执行，未执行来源生成器、configure、Nginx/OpenResty，未联网下载或修改源仓库。

## FastCGI真实链路与重要边界

F表示 src/http/modules/ngx_http_fastcgi_module.c，U表示 src/http/ngx_http_upstream.c；其余路径在下表展开。

- F681–757实际创建upstream；F710–744把本模块upstream配置和create_request/process_header/input_filter回调绑定到请求。共享upstream事实均通过这个绑定接入，不把注册槽位等同实际执行。
- fastcgi_pass的配置回调F3658–3716安装handler；core1252–1262与1381–1383证明content阶段实际入口。地址求值F762–806不做proxy式URI前缀替换。其余48项phase为configuration，仅表示配置入口，不表示请求期没有效果。
- F835–1364生成BEGIN_REQUEST、PARAMS与STDIN；参数编码总长超过65535报错；请求头转换为HTTP_变量并处理重复Cookie；请求体按FastCGI记录发送。参数脚本编译/抑制默认头由F3315–3516负责，if_not_empty仅跳过空值。
- split_path_info要求两个捕获组；F3587–3654处理匹配及未匹配，变量本身不检查文件存在。固定XML写location，但真实注册允许http/server/location；按注册表保留实际上下文，并明确文档差异。
- cache_key由F812–829生成键片段，file_cache再做MD5与路径布局，不能默认替用户构造URL键。cache无显式key的merge分支是警告，不宣称必然配置失败。
- cache相关15项受NGX_HTTP_CACHE条件编译约束；cache_path只允许http主上下文。FastCGI cache params与普通params分别初始化，缓存重验证头由专用默认参数接入。
- send_lowat引用U2121–2125实际调用；read_timeout区分U2436–2466中的活代码与#if 0禁用定时器。正文、管道和非缓冲读取的定时器各有独立证据。
- catch_stderr匹配头解析期间当前收到的STDERR片段中的字符串，不是正则，也不保证跨片段匹配；keep_conn设置FastCGI标志并检查END_REQUEST边界，但不单独建立upstream连接池。
- buffers/busy_buffers_size/temp文件约束、ignore/pass/hide头及缓存判定均同时检查merge与使用点。数组继承未按标量默认推断；未充分覆盖的可选事实保留unverified。

## 完整身份及证据索引

全部身份为 nginx / ngx_http_fastcgi_module，下列注册行均在F；每行还包含固定XML、模块归属及发行处理来源。此表只索引实现证据；完整source_ids和事实文字以JSON为准。

| 指令 | 注册行 | 配置回调完整定义 | 实际实现证据 |
| --- | --- | --- | --- |
| fastcgi_pass | 229–234 | ngx_http_fastcgi_pass F:3658–3716 | F:681–757；F:762–806；F:611–631；F:1046–1108；U:693–785；U:6322–6340；src/http/ngx_http_core_module.c:1252–1262；src/http/ngx_http_core_module.c:1381–1383 |
| fastcgi_index | 236–241 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | F:634–644；F:3520–3558；F:3587–3629 |
| fastcgi_split_path_info | 243–248 | ngx_http_fastcgi_split_path_info F:3720–3762 | F:3520–3583；F:3587–3654；F:3264–3269 |
| fastcgi_store | 250–255 | ngx_http_fastcgi_store F:3766–3814 | F:2955–2973；U:4164–4180；U:4244–4321 |
| fastcgi_store_access | 257–262 | ngx_conf_set_access_slot src/core/ngx_file.c:460–522 | U:4279–4284；U:4312–4321；src/core/ngx_file.c:660–704 |
| fastcgi_buffering | 264–269 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | F:710–743；F:2929–2932；U:3070–3132；U:3228–3272；U:5111–5145 |
| fastcgi_request_buffering | 271–276 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | F:745–757；F:1228–1235；F:1393–1443；F:1510–1573；F:1616–1637；U:2312–2345；U:4415–4426 |
| fastcgi_ignore_client_abort | 278–283 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | U:612–628；U:1505–1523；U:4232–4238 |
| fastcgi_bind | 285–290 | ngx_http_upstream_bind_set_slot U:6433–6529 | U:639–642；U:6533–6582；src/event/ngx_event_connect.c:95–158 |
| fastcgi_socket_keepalive | 292–297 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | U:644–646；src/event/ngx_event_connect.c:76–86 |
| fastcgi_connect_timeout | 299–304 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | U:1660–1678 |
| fastcgi_send_timeout | 306–311 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | U:2113–2150；U:2312–2345 |
| fastcgi_send_lowat | 313–318 | ngx_conf_set_size_slot src/core/ngx_conf_file.c:1198–1225 | U:2121–2125；F:3909–3934 |
| fastcgi_buffer_size | 320–325 | ngx_conf_set_size_slot src/core/ngx_conf_file.c:1198–1225 | U:2394–2433；U:2474–2496；F:1704–1731；F:1767–1831；U:3070–3132；U:862–870 |
| fastcgi_pass_request_headers | 327–332 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | F:898–997；F:1046–1108；F:1111–1207；F:3413–3431 |
| fastcgi_pass_request_body | 334–339 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | F:745–757；F:1228–1245；F:1267–1308；F:1343–1359；F:1046–1108 |
| fastcgi_intercept_errors | 341–346 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | U:2508–2517；U:2667–2759 |
| fastcgi_read_timeout | 348–353 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | U:2174–2187；U:2436–2466；U:3336–3340；U:3797–3815；src/event/ngx_event_pipe.c:60–80 |
| fastcgi_buffers | 355–360 | ngx_conf_set_bufs_slot src/core/ngx_conf_file.c:1322–1348 | U:3230–3238；src/event/ngx_event_pipe.c:224–254；F:3022–3029 |
| fastcgi_busy_buffers_size | 362–367 | ngx_conf_set_size_slot src/core/ngx_conf_file.c:1198–1225 | F:3032–3066；U:3230–3238；src/event/ngx_event_pipe.c:603–664 |
| fastcgi_force_ranges | 369–374 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | U:2951–2960；U:5564–5586 |
| fastcgi_limit_rate | 376–381 | ngx_http_set_complex_value_size_slot src/http/ngx_http_script.c:317–343 | U:3070–3132；U:3230–3242；src/event/ngx_event_pipe.c:205–222；src/http/ngx_http_script.c:108–135 |
| fastcgi_cache | 385–390 | ngx_http_fastcgi_cache F:3820–3875 | F:710–722；F:3140–3158；U:826–860；U:1006–1046；F:3196–3203；U:3173–3211；U:567–578 |
| fastcgi_cache_key | 392–397 | ngx_http_fastcgi_cache_key F:3879–3903 | F:812–829；F:3196–3203；src/http/ngx_http_file_cache.c:228–261 |
| fastcgi_cache_path | 399–404 | ngx_http_file_cache_set_slot src/http/ngx_http_file_cache.c:2379–2722 | F:812–829；src/http/ngx_http_file_cache.c:228–261；src/http/ngx_http_file_cache.c:994–1025；src/http/ngx_http_file_cache.c:2022–2105；src/http/ngx_http_file_cache.c:2109–2151；U:3250–3263；src/http/ngx_http_file_cache.c:975–983；src/http/ngx_http_file_cache.c:1860–1919 |
| fastcgi_cache_bypass | 406–411 | ngx_http_set_predicate_slot src/http/ngx_http_script.c:402–441 | U:881–892；src/http/ngx_http_script.c:347–370；U:3143–3166 |
| fastcgi_no_cache | 413–418 | ngx_http_set_predicate_slot src/http/ngx_http_script.c:402–441 | U:3143–3166；src/http/ngx_http_script.c:347–370 |
| fastcgi_cache_valid | 420–425 | ngx_http_file_cache_valid_set_slot src/http/ngx_http_file_cache.c:2726–2799 | src/http/ngx_http_file_cache.c:2353–2375；U:3173–3211；U:2825–2827 |
| fastcgi_cache_min_uses | 427–432 | ngx_conf_set_num_slot src/core/ngx_conf_file.c:1167–1194 | U:873–879；src/http/ngx_http_file_cache.c:310–338；src/http/ngx_http_file_cache.c:893–927 |
| fastcgi_cache_max_range_offset | 434–439 | ngx_conf_set_off_slot src/core/ngx_conf_file.c:1229–1256 | U:1141–1187；U:996–1002 |
| fastcgi_cache_use_stale | 441–446 | ngx_conf_set_bitmask_slot src/core/ngx_conf_file.c:1389–1431 | F:3167–3179；F:208–220；U:908–938；U:2562–2591；U:4423–4460 |
| fastcgi_cache_methods | 448–453 | ngx_conf_set_bitmask_slot src/core/ngx_conf_file.c:1389–1431 | U:452–457；F:3181–3185；U:834–848；F:812–829 |
| fastcgi_cache_lock | 455–460 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | U:894–899；src/http/ngx_http_file_cache.c:405–460；src/http/ngx_http_file_cache.c:503–539；U:973–977 |
| fastcgi_cache_lock_timeout | 462–467 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | U:894–896；src/http/ngx_http_file_cache.c:405–460；src/http/ngx_http_file_cache.c:503–539；U:973–977 |
| fastcgi_cache_lock_age | 469–474 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | U:894–896；src/http/ngx_http_file_cache.c:405–439 |
| fastcgi_cache_revalidate | 476–481 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | F:661–670；F:862–866；F:3279–3292；F:3364–3411；U:5994–6043；U:2598–2659 |
| fastcgi_cache_background_update | 483–488 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | U:908–938；U:1118–1137 |
| fastcgi_temp_path | 492–497 | ngx_conf_set_path_slot src/core/ngx_file.c:361–417 | F:675–677；F:3130–3136；U:3242–3272；U:4254–4276 |
| fastcgi_max_temp_file_size | 499–504 | ngx_conf_set_size_slot src/core/ngx_conf_file.c:1198–1225 | F:3032–3035；F:3090–3111；U:3242–3272；src/event/ngx_event_pipe.c:272–281；src/event/ngx_event_pipe.c:784–821 |
| fastcgi_temp_file_write_size | 506–511 | ngx_conf_set_size_slot src/core/ngx_conf_file.c:1198–1225 | F:3032–3035；F:3069–3087；U:3242–3272；src/event/ngx_event_pipe.c:784–825 |
| fastcgi_next_upstream | 513–518 | ngx_conf_set_bitmask_slot src/core/ngx_conf_file.c:1389–1431 | F:208–220；U:2534–2560；U:4415–4426 |
| fastcgi_next_upstream_tries | 520–525 | ngx_conf_set_num_slot src/core/ngx_conf_file.c:1167–1194 | U:805–819；U:1254–1262；U:4415–4426 |
| fastcgi_next_upstream_timeout | 527–532 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | U:811–819；U:1254–1262；U:2542–2560；U:4415–4426 |
| fastcgi_param | 534–539 | ngx_http_upstream_param_set_slot U:6586–6626 | F:3271–3292；F:3330–3337；F:3364–3496；F:868–997；F:1046–1108；F:1216–1226 |
| fastcgi_pass_header | 541–546 | ngx_conf_set_str_array_slot src/core/ngx_conf_file.c:1093–1125 | F:3237–3246；U:6707–6735；U:2906–2934 |
| fastcgi_hide_header | 548–553 | ngx_conf_set_str_array_slot src/core/ngx_conf_file.c:1093–1125 | F:648–656；F:3237–3246；U:6667–6705；U:2906–2934 |
| fastcgi_ignore_headers | 555–560 | ngx_conf_set_bitmask_slot src/core/ngx_conf_file.c:1389–1431 | U:460–471；U:2825–2832；U:4789–4810；U:4828–4853；U:4966–4991；U:5016–5068；U:5092–5145；U:5149–5163；U:5251–5268；U:2906–2914 |
| fastcgi_catch_stderr | 562–567 | ngx_conf_set_str_array_slot src/core/ngx_conf_file.c:1093–1125 | F:1681–1704；F:1767–1831；U:2493–2496；U:4415–4426 |
| fastcgi_keep_conn | 569–574 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | F:611–631；F:1026–1030；F:2132–2161；F:2211–2280；F:2521–2546；src/http/modules/ngx_http_upstream_keepalive_module.c:323–348 |

## 发行补丁实际回放

按照既有NGINX_PATCH_AUDIT的发行顺序在临时目录展开固定Nginx树并应用34个patch；142个hunk（包括offset/fuzz）及47个最终文件哈希与既有审计记录吻合。525处显式注册/回调/证据引用范围有效，其中421段Nginx源码：414段保持，7段变化如下。各片段逐补丁比较，未用文件名推断局部保持。

| 指令 / 证据 | 原始上游范围 | 首个改变该片段的patch |
| --- | --- | --- |
| fastcgi_request_buffering / implementation-5 | U:2312–2345 | upstream_pipelining |
| fastcgi_connect_timeout / implementation-0 | U:1660–1678 | upstream_timeout_fields |
| fastcgi_send_timeout / implementation-0 | U:2113–2150 | upstream_timeout_fields |
| fastcgi_send_timeout / implementation-1 | U:2312–2345 | upstream_pipelining |
| fastcgi_read_timeout / implementation-0 | U:2174–2187 | upstream_timeout_fields |
| fastcgi_read_timeout / implementation-2 | U:3336–3340 | upstream_timeout_fields |
| fastcgi_read_timeout / implementation-3 | U:3797–3815 | upstream_timeout_fields |

整个F补丁前后字节一致，SHA-256为 762fc537a2ddcc86e0e84c6c392d493e60b2c2d5d9c30c57e4fb43def95f7953。这不意味着整个FastCGI请求链不受补丁影响。

5项verified_affected：request_buffering、connect_timeout、send_timeout、read_timeout、intercept_errors（均加fastcgi_前缀）。前四类所引局部变化对应upstream_timeout_fields/pipelining；intercept_errors还引用no_error_pages对错误页配置/处理的影响，不能因本地调用片段保持就判无影响。其余44项verified_unaffected只覆盖各条明示事实及所列链路。JSON固定引用timeout patch1–112、pipelining patch1–23、no_error_pages patch1–91。

## 隔离网站构建验证

输入为已捕获的正式299项快照（release 1.27.1.1-5938e3d7ce7b0a14）加本批49项，无重复身份。临时配置指向本地只读固定源，复制现有components/catalog/site/src，用现有scripts/build.mjs导出的build与内置validatePublication校验，不重跑来源盘点。

- 临时release：1.27.1.1-161279b6e780a2c6。
- 注册1017，basic_verified348（299+49），deep_verified0，registration_only669；不宣称全站完成。
- 49项均为basic_verified，summary/syntax/defaults/inheritance/limitations/patch_status/related与输入逐项相等；phase、真实callback及compile_guards匹配。
- 发布的574个来源（525处显式引用加49处自动distribution-version）逐一检查固定SHA、原文、范围及固定URL锚点。
- 其余968个详情除release_id外与299快照逐字段相同；8个参考对象不变。
- 首次收尾检测发现主线已由299更新为330（其他批次31项），因此没有将并行变化错误归咎于隔离build，也没有回滚主线。仍使用原299快照完成对照复验；复验期间正式current为 1.27.1.1-c66c7c93f58b312c，正式知识/current字节均保持不变。
- project.config.json、scripts/build.mjs、components/catalog及冻结proxy/upstream两组文件与P02开始时哈希相同。未写shared knowledge、正式dist/current、配置或脚本。
- patch及build临时目录均finally清理；最终检查无nginx-fastcgi-前缀遗留。

## 可选事实与审核限制

默认值38项verified，11项unverified：fastcgi_pass、fastcgi_split_path_info、fastcgi_store、fastcgi_limit_rate、fastcgi_cache、fastcgi_cache_key、fastcgi_cache_path、fastcgi_temp_path、fastcgi_param、fastcgi_pass_header、fastcgi_hide_header。

继承41项verified，7项unverified：fastcgi_pass、fastcgi_store、fastcgi_limit_rate、fastcgi_cache、fastcgi_temp_path、fastcgi_pass_header、fastcgi_hide_header；cache_path为not_applicable。未将unknown伪装为off、空值或父层继承。可选字段未知不替代任何必需事实。

本批完整49身份及必需中文事实已提供；源码/文档/实际发行patch和隔离静态发布校验完成。未运行FastCGI服务或OpenResty，实际构建启用/环境行为仍须按部署核实；没有把源码存在解释为环境已启用。独立审核尚未完成，需审核通过后由主合入，本实施角色不发布、不修改review记录。

## R25差异修复（仅fastcgi_send_lowat）

独立审核48项通过，send_lowat缺post变量到校验函数的绑定。本次只新增lowat-post-binding：固定Nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928 的 src/http/modules/ngx_http_fastcgi_module.c:204–205，原文为ngx_http_fastcgi_lowat_post绑定ngx_http_fastcgi_lowat_check；仅追加到该项limitation和patch_status.source_ids。功能、语法、默认、继承、既有来源与其他48项逐对象保持不变。

在独立mkdtemp展开固定Nginx树，按原34项发行patch和已核server_header替换实际回放；每步后只比较本次新增204–205两行，全部原文保持。片段SHA-256（两行以LF连接、不含末尾LF）：85229d6a0c4d3d6e9de0bc67706f22ff61b0256098a3e094e3ef0f0abc6f261a。未重做旧49项全盘或旧47文件审计，未构建根目录/隔离网站，旧构建实证仅属于原草稿版本，不冒称本次新增来源已发布。临时副本finally清理。

JSON由 8c0139266ee397454a00d60d05d50a565de71e31360cdd5770a31404920d5b53 更新为 1566a494bde564ffe6800832c0d01ce949b132dbadf85839cb405216f593956b。显式来源525→526，Nginx片段421→422；增量为1段保持、0段改变，结合既有记录为415保持/7改变。独立差异审核待确认，不自行将整批标为通过。SCGI及uWSGI现场保持，不写shared/current或review。
