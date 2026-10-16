# P04 uWSGI完整60项实施与隔离验证

## 结论和独立写集

nginx / ngx_http_uwsgi_module完整60身份已编写，静态基础校验及隔离构建通过，候独立审核；未合入正式知识。P04仅新增analysis/content/HTTP_UWSGI_BASIC.json及本记录，不修改shared/current、配置、脚本、源仓库或其他批次。P03 SCGI44冻结排队；中途按指定R25最小补FastCGI post绑定，已单独汇报且用户通知独立关闭，不混入本批输入。

uWSGI JSON SHA-256：dbc8d988bed959b843f00447745b9bc4d0f8ad83b1ec7cec517d08d645a8cac0。

使用research技能的一手来源方法：完整读取本模块注册offset/post、配置结构、handler、create_request、params_init、merge及专用SSL设置，然后接共享upstream/cache/OpenSSL实际调用。不复制其他协议正文换前缀。没有创建嵌套任务，不跨主负责的Stream core、P11/P14/P15等写集。

## 固定来源与身份边界

- Nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928，版本1.27.1。
- nginx-docs e8b581903e9d41252720053311cea687a5671674；xml/en/docs/http/ngx_http_uwsgi_module.xml。
- OpenResty 8c37412c31621225e7aa7e825b5b50106c9c71c4，版本1.27.1.1；util/mirror-tarballs及固定发行patch。

所有来源均由本地git show SHA:path读取。60项精确匹配当前catalog；15项NGX_HTTP_CACHE、13项NGX_HTTP_SSL条件来自实际注册。59个同名活跃XML节点；uwsgi_string没有节点，走源码专项，不增加商业cache_purge身份或purger参数。

下文W=src/http/modules/ngx_http_uwsgi_module.c，U=src/http/ngx_http_upstream.c，O=src/event/ngx_event_openssl.c。共享回调完整定义复用已读来源，但每条重新对应uWSGI自身offset、post及使用点。

## 真实协议、参数和TLS链路

- W582–610绑定模块/commands/create/merge。W666–730将本模块配置、caches、create_key、请求构造和响应过滤回调接入upstream。uwsgi_pass在W2201–2283安装handler，core1252–1262、1381–1383证明content调用；其余59项phase=configuration表示配置入口，不否认请求期效果。
- W1024–1027产生四字节头：modifier1、参数块长度低字节、高字节、modifier2；两个modifier由W106–108真实post加通用bounds函数限制在0–255。请求不是SCGI netstring，也不是FastCGI记录序列。
- W875–903统计显式参数，W905–993统计自动HTTP_头，W995加入uwsgi_string长度，W1006–1010拒绝总长>65535。长度字段不包括后续原始正文。W997–1004中的过小包检查在#if 0内，不称活代码。
- W1039–1089对键/值各写两字节小端长度。固定1042行先将显式键长转u_char，不能因协议长度字段为16位就保证任意长配置键都能正确编码；正文已指出这一实现边界。
- uwsgi_string通过str_slot直接保存并由W1916继承，W1173–1174将原始字节追加到参数块尾部、正文前。它不自动封装键值、不执行变量表达式、不替换四字节头；无XML节点不影响完整身份交付。
- CONTENT_LENGTH及其他CGI变量由显式uwsgi_param或conf/uwsgi_params提供，模块不像SCGI自动插入该参数。pass_request_body=off只影响正文链，不能推断显式参数自动删除。流式请求必须同时满足request_buffering=off、pass_request_body和非chunked，HTTP/1.1 chunked仍缓冲。
- W1996–2198编译参数脚本和HTTP_*抑制哈希；W1953–1993按整组继承，不逐键叠加。if_not_empty只过滤空结果。自动头的名称规范化、重复Cookie分号及其他头逗号拼接从W1091–1174核定。
- 响应由W1236–1427解析HTTP状态行或CGI头，交共享upstream头handler；不把请求包结构套给响应。Status可用于决定响应状态，但uWSGI默认hide列表W613–620只有五个X-Accel头，未包含Status；U193–198和2906–2934仍有Status复制路径。固定XML写默认隐藏Status，与实际代码不同，两个头指令明确按源码说明。
- 缓存通过W695–700、824–842、625–634、1966–1976独立接入key及params_cache；缓存区tag为uWSGI。store、cache、普通临时文件边界分别核定，范围阈值实际>=比较、busy上界实际>拒绝均不照搬文档措辞。
- uwsgi_pass同时支持uwsgi://与suwsgi://。静态TLS支持在配置回调检查；变量目标在SSL构建中预建SSL配置，但请求期W740–819只对suwsgi启用TLS。W1871–1914调用merge_ssl/set_ssl，W2467–2513决定共享/创建SSL上下文。
- W2525真实调用ngx_ssl_create；W2540–2544真实调用ngx_ssl_ciphers→O884–899的SSL_CTX_set_cipher_list，不声称覆盖TLS1.3的set_ciphersuites。固定源码和固定XML默认协议均为TLSv1/TLSv1.1/TLSv1.2/TLSv1.3；早期口头怀疑差异经完整文档对照已撤回，未写入草稿。实际可协商版本仍受SSL库及宏约束。
- SNI/校验由U1705–1711、1857–1948使用名称；空/IP字面量不发送SNI，证书验证与SNI开关独立。信任文件/CRL/verify_depth由W2578–2596传到真实API；只配置文件不自动打开验证。
- 静态客户端证书在set_ssl加载，变量证书/私钥在U1713–1723及1951–1987请求期求值加载。口令文件在配置期读取，动态加载保留口令，不承诺每次握手重读。ssl_conf_command有W139–140→2456–2464真实post绑定，库缺SSL_CONF_FLAG_FILE时拒绝，W2605–2609调用实际SSL_CONF_cmd链。

## 完整60身份证据索引

所有行另有固定module-owner、upstream-binding、distribution-processing；TLS13项额外提供ssl-setup-binding。配置回调引用完整定义，避免自动40行片段遗漏。事实/source_ids全量见JSON。

| 指令 | W注册行 | 配置回调与完整定义 | 实际实现证据 |
| --- | --- | --- | --- |
| uwsgi_pass | 150–155 | ngx_http_uwsgi_pass W:2201–2283 | W:644–737；W:740–819；W:995–1027；U:693–785；src/http/ngx_http_core_module.c:1252–1262；src/http/ngx_http_core_module.c:1381–1383 |
| uwsgi_modifier1 | 157–162 | ngx_conf_set_num_slot src/core/ngx_conf_file.c:1167–1194 | W:106–108；src/core/ngx_conf_file.c:1460–1486；W:1024–1027 |
| uwsgi_modifier2 | 164–169 | ngx_conf_set_num_slot src/core/ngx_conf_file.c:1167–1194 | W:106–108；src/core/ngx_conf_file.c:1460–1486；W:1024–1027 |
| uwsgi_store | 171–176 | ngx_http_uwsgi_store W:2286–2337 | W:1597–1614；U:4164–4180；U:4244–4321 |
| uwsgi_store_access | 178–183 | ngx_conf_set_access_slot src/core/ngx_file.c:460–522 | U:4270–4321；src/core/ngx_file.c:660–704 |
| uwsgi_buffering | 185–190 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | W:709–721；W:1575–1580；W:1430–1458；U:3070–3132；U:3228–3272；U:5111–5145 |
| uwsgi_request_buffering | 192–197 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | W:723–730；W:1173–1209；U:2312–2345；U:2534–2560；U:4415–4426 |
| uwsgi_ignore_client_abort | 199–204 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | U:612–628；U:1505–1523 |
| uwsgi_bind | 206–211 | ngx_http_upstream_bind_set_slot U:6433–6529 | U:639–646；U:6533–6582；src/event/ngx_event_connect.c:95–158 |
| uwsgi_socket_keepalive | 213–218 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | U:639–646；src/event/ngx_event_connect.c:76–86 |
| uwsgi_connect_timeout | 220–225 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | U:1660–1678；U:1745–1760 |
| uwsgi_send_timeout | 227–232 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | U:2113–2150；U:2312–2345；W:1173–1209 |
| uwsgi_buffer_size | 234–239 | ngx_conf_set_size_slot src/core/ngx_conf_file.c:1198–1225 | W:1236–1286；W:1289–1305；U:2394–2433；U:2474–2496；U:3070–3132 |
| uwsgi_pass_request_headers | 241–246 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | W:905–993；W:995–1010；W:1091–1174；W:2095–2113 |
| uwsgi_pass_request_body | 248–253 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | W:1173–1209；W:847–875；conf/uwsgi_params:1–17 |
| uwsgi_intercept_errors | 255–260 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | W:1236–1286；W:1359–1411；U:2508–2517；U:2667–2759 |
| uwsgi_read_timeout | 262–267 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | U:2174–2187；U:2436–2466；U:3336–3340；U:3797–3815；src/event/ngx_event_pipe.c:60–80；W:1430–1458 |
| uwsgi_buffers | 269–274 | ngx_conf_set_bufs_slot src/core/ngx_conf_file.c:1322–1348 | W:1663–1676；U:3230–3242；src/event/ngx_event_pipe.c:224–254 |
| uwsgi_busy_buffers_size | 276–281 | ngx_conf_set_size_slot src/core/ngx_conf_file.c:1198–1225 | W:1673–1707；U:3230–3242；src/event/ngx_event_pipe.c:603–664 |
| uwsgi_force_ranges | 283–288 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | U:2951–2960；U:5564–5586 |
| uwsgi_limit_rate | 290–295 | ngx_http_set_complex_value_size_slot src/http/ngx_http_script.c:317–343 | W:1659–1660；src/http/ngx_http_script.c:108–135；U:3230–3242；src/event/ngx_event_pipe.c:205–222；src/event/ngx_event_pipe.c:272–281 |
| uwsgi_cache | 299–304 | ngx_http_uwsgi_cache W:2342–2398 | W:695–700；W:1597–1607；W:1781–1799；U:567–578；U:1006–1046 |
| uwsgi_cache_key | 306–311 | ngx_http_uwsgi_cache_key W:2401–2426 | W:824–842；W:1837–1844；src/http/ngx_http_file_cache.c:228–261 |
| uwsgi_cache_path | 313–318 | ngx_http_file_cache_set_slot src/http/ngx_http_file_cache.c:2379–2722 | W:1481–1501；src/http/ngx_http_file_cache.c:228–261；src/http/ngx_http_file_cache.c:994–1025；src/http/ngx_http_file_cache.c:1860–1919；src/http/ngx_http_file_cache.c:2022–2105；src/http/ngx_http_file_cache.c:2109–2151；U:3242–3272 |
| uwsgi_cache_bypass | 320–325 | ngx_http_set_predicate_slot src/http/ngx_http_script.c:402–441 | src/http/ngx_http_script.c:347–370；U:881–892；U:3143–3166 |
| uwsgi_no_cache | 327–332 | ngx_http_set_predicate_slot src/http/ngx_http_script.c:402–441 | src/http/ngx_http_script.c:347–370；U:3143–3166；U:2825–2832 |
| uwsgi_cache_valid | 334–339 | ngx_http_file_cache_valid_set_slot src/http/ngx_http_file_cache.c:2726–2799 | src/http/ngx_http_file_cache.c:2353–2375；U:3173–3211；U:4789–4810；U:4828–4853；U:4966–4991；U:5016–5068；U:5251–5268 |
| uwsgi_cache_min_uses | 341–346 | ngx_conf_set_num_slot src/core/ngx_conf_file.c:1167–1194 | U:873–879；src/http/ngx_http_file_cache.c:310–338；src/http/ngx_http_file_cache.c:893–927；U:973–977 |
| uwsgi_cache_max_range_offset | 348–353 | ngx_conf_set_off_slot src/core/ngx_conf_file.c:1229–1256 | U:996–1002；U:1141–1187 |
| uwsgi_cache_use_stale | 355–360 | ngx_conf_set_bitmask_slot src/core/ngx_conf_file.c:1389–1431 | W:111–124；W:1808–1820；U:908–938；U:2562–2591；U:4423–4460 |
| uwsgi_cache_methods | 362–367 | ngx_conf_set_bitmask_slot src/core/ngx_conf_file.c:1389–1431 | W:1822–1826；W:824–842；U:452–457；U:826–860 |
| uwsgi_cache_lock | 369–374 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | U:894–899；src/http/ngx_http_file_cache.c:405–460；src/http/ngx_http_file_cache.c:503–539 |
| uwsgi_cache_lock_timeout | 376–381 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | U:894–899；src/http/ngx_http_file_cache.c:405–460；src/http/ngx_http_file_cache.c:503–539；U:973–977 |
| uwsgi_cache_lock_age | 383–388 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | U:894–899；src/http/ngx_http_file_cache.c:405–460 |
| uwsgi_cache_revalidate | 390–395 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | W:625–634；W:869–873；W:1966–1976；W:2046–2093；U:5994–6043；U:2598–2659 |
| uwsgi_cache_background_update | 397–402 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | U:908–938；U:1118–1137 |
| uwsgi_temp_path | 406–411 | ngx_conf_set_path_slot src/core/ngx_file.c:361–417 | W:639–641；W:1771–1777；U:3242–3272；U:4244–4321 |
| uwsgi_max_temp_file_size | 413–418 | ngx_conf_set_size_slot src/core/ngx_conf_file.c:1198–1225 | W:1673–1676；W:1731–1752；U:3242–3272；src/event/ngx_event_pipe.c:272–281 |
| uwsgi_temp_file_write_size | 420–425 | ngx_conf_set_size_slot src/core/ngx_conf_file.c:1198–1225 | W:1673–1676；W:1710–1728；U:3242–3272；src/event/ngx_event_pipe.c:784–825 |
| uwsgi_next_upstream | 427–432 | ngx_conf_set_bitmask_slot src/core/ngx_conf_file.c:1389–1431 | W:111–124；W:1760–1769；W:1213–1233；U:2534–2560；U:4415–4426 |
| uwsgi_next_upstream_tries | 434–439 | ngx_conf_set_num_slot src/core/ngx_conf_file.c:1167–1194 | U:805–819；U:1254–1262；U:2534–2560；U:4415–4426 |
| uwsgi_next_upstream_timeout | 441–446 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | U:805–819；U:2534–2560；U:4415–4426 |
| uwsgi_param | 448–453 | ngx_http_upstream_param_set_slot U:6586–6626 | W:863–903；W:995–1089；W:1953–1993；W:1996–2198；conf/uwsgi_params:1–17 |
| uwsgi_string | 455–460 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | W:995–1027；W:1173–1209；W:1916–1916 |
| uwsgi_pass_header | 462–467 | ngx_conf_set_str_array_slot src/core/ngx_conf_file.c:1093–1125 | W:613–620；W:1918–1927；W:1342–1351；U:6667–6735；U:2906–2934；U:193–198 |
| uwsgi_hide_header | 469–474 | ngx_conf_set_str_array_slot src/core/ngx_conf_file.c:1093–1125 | W:613–620；W:1918–1927；W:1342–1351；U:6667–6735；U:2906–2934；U:193–198 |
| uwsgi_ignore_headers | 476–481 | ngx_conf_set_bitmask_slot src/core/ngx_conf_file.c:1389–1431 | W:1342–1351；U:460–471；U:2825–2832；U:4789–4810；U:4828–4853；U:4966–4991；U:5016–5068；U:5092–5163；U:5251–5268 |
| uwsgi_ssl_session_reuse | 485–490 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | W:2598–2603；O:1668–1681；U:1725–1743；U:1836–1854 |
| uwsgi_ssl_protocols | 492–497 | ngx_conf_set_bitmask_slot src/core/ngx_conf_file.c:1389–1431 | W:129–137；W:2521–2529；O:296–399 |
| uwsgi_ssl_ciphers | 499–504 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | W:2525–2544；O:884–899 |
| uwsgi_ssl_name | 506–511 | ngx_http_set_complex_value_slot src/http/ngx_http_script.c:242–275 | U:693–701；U:800–803；U:1705–1711；U:1857–1948；U:1792–1810 |
| uwsgi_ssl_server_name | 513–518 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | U:1705–1711；U:1857–1948 |
| uwsgi_ssl_verify | 520–525 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | W:2578–2596；U:1705–1711；U:1786–1833；O:951–984 |
| uwsgi_ssl_verify_depth | 527–532 | ngx_conf_set_num_slot src/core/ngx_conf_file.c:1167–1194 | W:2578–2591；O:951–984 |
| uwsgi_ssl_trusted_certificate | 534–539 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | W:2578–2591；O:951–984 |
| uwsgi_ssl_crl | 541–546 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | W:2578–2596；O:988–1029 |
| uwsgi_ssl_certificate | 548–553 | ngx_http_set_complex_value_zero_slot src/http/ngx_http_script.c:278–313 | W:2546–2576；U:1713–1723；U:1951–1987；O:457–476；O:578–644 |
| uwsgi_ssl_certificate_key | 555–560 | ngx_http_set_complex_value_zero_slot src/http/ngx_http_script.c:278–313 | W:2546–2576；U:1951–1987；O:739–852；O:624–644 |
| uwsgi_ssl_password_file | 562–567 | ngx_http_uwsgi_ssl_password_file W:2433–2453 | W:2557–2574；O:1199–1325；O:1329–1388；O:819–852 |
| uwsgi_ssl_conf_command | 569–574 | ngx_conf_set_keyval_slot src/core/ngx_conf_file.c:1129–1163 | W:139–140；W:2456–2464；W:2605–2609；O:1596–1664 |

## 固定发行patch实证

在mkdtemp用git archive展开固定Nginx树，以系统patch --batch --verbose -p1按既有NGINX_PATCH_AUDIT顺序实际应用34个patch及已核server_header版本替换。142个hunk全部通过，offset/fuzz逐项匹配，47个最终文件SHA-256全部相等；未运行来源/回放生成器，未重写审计记录。

659处显式引用范围有效，其中534处Nginx源码；每步patch后按片段原文检查，526段保持、8段首次变化如下。不是只因某文件没有列在patch目标就判局部unaffected。

| 指令 / 证据 | 原始U范围 | 首个改变片段的patch |
| --- | --- | --- |
| uwsgi_request_buffering / implementation-2 | 2312–2345 | upstream_pipelining |
| uwsgi_send_timeout / implementation-1 | 2312–2345 | upstream_pipelining |
| uwsgi_connect_timeout / implementation-0 | 1660–1678 | upstream_timeout_fields |
| uwsgi_connect_timeout / implementation-1 | 1745–1760 | upstream_timeout_fields |
| uwsgi_send_timeout / implementation-0 | 2113–2150 | upstream_timeout_fields |
| uwsgi_read_timeout / implementation-0 | 2174–2187 | upstream_timeout_fields |
| uwsgi_read_timeout / implementation-2 | 3336–3340 | upstream_timeout_fields |
| uwsgi_read_timeout / implementation-3 | 3797–3815 | upstream_timeout_fields |

W整文件补丁前后字节相同，SHA-256 05ab4e31b3700ef680a93abced3bf091485277351820831ca45f7839cd80bfb1。比SCGI多出的变化片段是TLS握手等待使用connect_timeout，已加入该项引用及affected状态。

5项verified_affected：uwsgi_request_buffering、uwsgi_connect_timeout、uwsgi_send_timeout、uwsgi_read_timeout、uwsgi_intercept_errors；最后一项另外考虑no_error_pages间接行为。55项verified_unaffected仅覆盖各条明示有限事实及引用链，不把SSL/TLS的整个请求生命周期或库所有行为标为未受补丁影响。固定补丁片段为upstream_pipelining1–23、upstream_timeout_fields1–112及no_error_pages1–91。

## 隔离构建与回归比对

读取实际正式330项基线 1.27.1.1-c66c7c93f58b312c，只在临时知识输入中加入60项；没有夹带FastCGI/SCGI候审稿。临时目录复制既有components/catalog/site/src，配置指向本地只读来源，以现有scripts/build.mjs执行网站build及内置validatePublication，不运行根build、来源生成器或Nginx/OpenResty。

- 临时release：1.27.1.1-416738db523621f9。
- 1017注册、390基础=330+60、0深度、627仅注册；这不是正式计数或全站完成。
- 本批60项全为basic_verified；summary/syntax/defaults/inheritance/limitations/patch_status/related与输入逐项一致，phase、配置symbol、compile_guards匹配。
- 719处发布来源=659处显式引用+60个自动distribution-version；每处固定SHA、原文、行范围及URL锚点全部比对。
- 其余957项详情仅release_id变化，其他字段完全等于330基线；8个reference对象不变。
- 测试前后正式knowledge/directives.json、dist/knowledge/index.json字节相同，正式仍330。本角色未修改shared/current。
- 配置、build脚本、components/catalog、冻结proxy/upstream/FastCGI（R25后）/SCGI哈希保持；P04仅写两个指定文件。patch/build临时目录finally清理，不留候选dist或临时配置。

## 可选未知与候审限制

默认值未知10项：uwsgi_pass、uwsgi_store、uwsgi_limit_rate、uwsgi_cache、uwsgi_cache_key、uwsgi_cache_path、uwsgi_temp_path、uwsgi_param、uwsgi_pass_header、uwsgi_hide_header。

继承未知7项：uwsgi_pass、uwsgi_store、uwsgi_limit_rate、uwsgi_cache、uwsgi_temp_path、uwsgi_pass_header、uwsgi_hide_header；cache_path为not_applicable。其余默认/继承按所引merge核定，运行时派生默认额外绑定实际使用证据；未知不猜off/空值或逐键合并。

完整60身份的必需功能、语法、限制、真实入口、固定文档/源码及所述事实patch状态均已提供；语义和边界仍待独立审核。未做后端协议互通、TLS握手或实际部署测试，不把源码注册当成目标环境已启用。由主在审核通过后集成，本实施角色不发布、不修改review；后续仅按指定finding更改具体条目。

## 提交前同类差异修正：cache_valid顺序与真实EOF

收到SCGI R27/R28后只在uWSGI本写集核对同类点，不修改SCGI。uwsgi_cache_valid的limitation已改为配置数组顺序首匹配：固定ngx_http_file_cache_valid（src/http/ngx_http_file_cache.c:2353–2375）每次迭代先遇any（status=0）即返回，或遇当前状态返回；先配置any会遮蔽后面的具体状态，不能表述成具体状态优先、any只作后备。沿用原有implementation-0证据，其固定原文及已有patch保持结果不变。

固定conf/uwsgi_params真实物理EOF为17；文件末尾LF不增加第18行。uwsgi_pass_request_body/implementation-2与uwsgi_param/implementation-4仅将end_line从18收至17，无正文变化。以去掉单个末尾LF后计物理行的方式复核全部659处引用，全部在真实EOF内。收窄的两段是原已核定保持片段的子集，没有新增实现或patch主张。

本次只有3处JSON行变化（1处limitation文字、2处end_line），涉及3项，其余57项逐对象完全相同。JSON由53fcbfd8a6b3111e4c5846449a848a11c642c03d9ba97f2f0a950ae24f25f24b更新为dbc8d988bed959b843f00447745b9bc4d0f8ad83b1ec7cec517d08d645a8cac0。上文390/416738db523621f9及719处发布来源检查是修正前隔离候选的历史实证，不冒称修正后已重建；本次按用户要求不重复全盘测试、不运行根build，只做差异和真实EOF校验。独立审核仍待完成。

## R31最小修正：SNI跳过条件

主线程复读固定ngx_http_upstream.c:1857–1948和ngx_inet.c:20–60后，仅收窄uwsgi_ssl_server_name的一句限制：按名称为空、首字符[或ngx_inet_addr结果不等于INADDR_NONE描述跳过条件，不再泛指全部IPv4字面量。255.255.255.255解析为INADDR_NONE，不能被旧概括覆盖。沿用既有implementation-1，其他59项、来源及产品代码未变；本次未做TLS实测或重复全批补丁回放，交独立差异复核。
