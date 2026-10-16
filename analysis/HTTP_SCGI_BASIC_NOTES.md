# P03 SCGI 44项实施、固定来源与隔离验证

## 结论与边界

完整 nginx / ngx_http_scgi_module 的44身份已编写，schema基础校验及隔离发布通过；状态为候独立审核，未合入正式知识。永久写集仅 analysis/content/HTTP_SCGI_BASIC.json 与本记录。P02 FastCGI冻结不动，P10/P11及其他shared/current不在本写集。

SCGI JSON SHA-256：ad46e38c2ac0315684cea3260e95f460ffe7b15894a0c581014fcc21df98ba9a。

遵循C02冻结计划P03及NGINX_BASIC_CONTENT_STRATEGY：先读SCGI自身结构、注册offset/post、handler、create_request、params_init和merge，再接已核定的共享upstream/file_cache。research技能只使用一手固定源；当前是实施分工线程，不另建嵌套线程。未复制FastCGI正文换前缀，44项无FastCGI模块源码引用。

## 固定证据

- nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928（1.27.1）；SCGI文件为src/http/modules/ngx_http_scgi_module.c。
- nginx-docs e8b581903e9d41252720053311cea687a5671674；xml/en/docs/http/ngx_http_scgi_module.xml。44个活跃directive节点逐项读取；不从XML商业scgi_cache_purge或purger参数增加身份/语法。
- openresty 8c37412c31621225e7aa7e825b5b50106c9c71c4（1.27.1.1）；util/mirror-tarballs及34项实际发行patch。

所有原文使用本地git show SHA:path，未使用浮动工作树正文替代固定源。通用回调复用已读完整定义的位置，但每条重新对应SCGI自己的字段/合并/实际使用点。暂记 G=src/http/modules/ngx_http_scgi_module.c，U=src/http/ngx_http_upstream.c。

## 协议及实际链路

- G28–43的SCGI配置嵌入upstream，另持params/params_cache和动态地址脚本；G414–442明确模块归属及create/merge。G499–549把本模块配置、create_request、响应解析器、cache key和输入过滤器绑定到请求。
- scgi_pass专用回调G1903–1961安装handler；变量目标由G559–604运行脚本并解析地址；U693–785查已有upstream或resolver。core1252–1262、1381–1383证明content入口。其余43项phase=configuration，不表示其效果只在配置期。
- G651–662按已有request_bufs累计CONTENT_LENGTH。G795–810以十进制长度加冒号开头，先写CONTENT_LENGTH及NUL分隔值；G812–870写显式参数，G872–947写自动HTTP_参数与结尾逗号。G949–981将原始正文链直接接到头后，没有FastCGI BEGIN_REQUEST/PARAMS/STDIN记录，也没有照搬其65535字节校验。
- G542–547的非缓冲条件同时要求request_buffering=off、pass_request_body开启及非chunked；HTTP/1.1 chunked仍缓冲。pass_request_body只决定正文链；不能从off推断先前按已有bufs生成的CONTENT_LENGTH必定归零。此记录不凭静态路径宣称运行中的全部组合已测试。
- SCGI=1不是create_request自动补入，固定conf/scgi_params:1–18通过scgi_param显式提供SCGI、REQUEST_METHOD、QUERY_STRING等。只有显式配置或include才进入参数集合，不把发行示例当模块自动默认。
- G1698–1900编译变量及HTTP_*抑制哈希，G1655–1695仅本层params_source为空时继承整组参数；不逐键合并父子层。if_not_empty只过滤空结果，不过滤字符串0。HTTP_名字大写、横线改下划线；重复Cookie用分号空格，其他头用逗号空格。
- G1008–1199先解析HTTP状态行，否则回退CGI式响应头；没有Status但有Location时用302，否则200。G1114–1123将头交给共享upstream处理器，G1202–1230给普通响应过滤设置长度，不解析FastCGI响应记录。
- SCGI专用缓存键G609–627及params_cache G458–467、669–673、1670–1676与共享缓存相接；重验证条件头不是凭FastCGI同名配置推断。store与cache区分，scgi_cache_path使用SCGI模块tag；15项CACHE条件来自真实注册。
- 所有缓冲/临时文件尺寸先读G1430–1509派生与检查再读事件管道使用处；busy上界实际上为>才拒绝。max_range_offset实际比较>=而非文档beyond的严格大于。send/read/connect不是统一整请求时限；read_timeout明确区分U2436–2466中的#if 0禁用代码与实际定时器路径。

## 完整44身份证据索引

每条还保留官方XML、module-owner、upstream-binding及distribution-processing证据。配置回调为完整定义，不使用自动40行截断；完整事实文字/source_ids以JSON为准。

| 指令 | G注册行 | 配置回调及定义 | 实际实现证据 |
| --- | --- | --- | --- |
| scgi_pass | 98–103 | ngx_http_scgi_pass G:1903–1961 | G:477–556；G:559–604；G:651–673；G:795–810；G:947–981；U:693–785；U:6322–6340；src/http/ngx_http_core_module.c:1252–1262；src/http/ngx_http_core_module.c:1381–1383 |
| scgi_store | 105–110 | ngx_http_scgi_store G:1964–2013 | G:1354–1371；U:4164–4180；U:4244–4321 |
| scgi_store_access | 112–117 | ngx_conf_set_access_slot src/core/ngx_file.c:460–522 | G:1373–1374；U:4270–4321；src/core/ngx_file.c:660–704 |
| scgi_buffering | 119–124 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | G:528–540；G:1332–1337；G:1202–1230；U:3070–3132；U:3228–3272；U:5111–5145 |
| scgi_request_buffering | 126–131 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | G:542–549；G:651–662；G:947–981；U:2312–2345；U:2534–2560；U:4415–4426 |
| scgi_ignore_client_abort | 133–138 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | U:612–628；U:1505–1523 |
| scgi_bind | 140–145 | ngx_http_upstream_bind_set_slot U:6433–6529 | U:639–646；U:6533–6582；src/event/ngx_event_connect.c:95–158 |
| scgi_socket_keepalive | 147–152 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | U:639–646；src/event/ngx_event_connect.c:76–86 |
| scgi_connect_timeout | 154–159 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | U:1660–1678 |
| scgi_send_timeout | 161–166 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | U:2113–2150；U:2312–2345；G:947–981 |
| scgi_buffer_size | 168–173 | ngx_conf_set_size_slot src/core/ngx_conf_file.c:1198–1225 | G:1008–1058；G:1061–1077；U:2394–2433；U:2474–2496；U:3070–3132 |
| scgi_pass_request_headers | 175–180 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | G:705–793；G:872–947；G:1797–1815；G:809–810 |
| scgi_pass_request_body | 182–187 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | G:542–549；G:651–662；G:809–810；G:947–981 |
| scgi_intercept_errors | 189–194 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | G:1008–1058；G:1131–1183；U:2508–2517；U:2667–2759 |
| scgi_read_timeout | 196–201 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | U:2174–2187；U:2436–2466；U:3336–3340；U:3797–3815；src/event/ngx_event_pipe.c:60–80；G:1202–1230 |
| scgi_buffers | 203–208 | ngx_conf_set_bufs_slot src/core/ngx_conf_file.c:1322–1348 | G:1420–1433；U:3230–3242；src/event/ngx_event_pipe.c:224–254 |
| scgi_busy_buffers_size | 210–215 | ngx_conf_set_size_slot src/core/ngx_conf_file.c:1198–1225 | G:1430–1464；U:3230–3242；src/event/ngx_event_pipe.c:603–664 |
| scgi_force_ranges | 217–222 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | U:2951–2960；U:5564–5586 |
| scgi_limit_rate | 224–229 | ngx_http_set_complex_value_size_slot src/http/ngx_http_script.c:317–343 | G:1416–1417；src/http/ngx_http_script.c:108–135；U:3230–3242；src/event/ngx_event_pipe.c:205–222；src/event/ngx_event_pipe.c:272–281 |
| scgi_cache | 233–238 | ngx_http_scgi_cache G:2018–2074 | G:514–519；G:1354–1364；G:1538–1556；U:567–578；U:1006–1046 |
| scgi_cache_key | 240–245 | ngx_http_scgi_cache_key G:2077–2102 | G:609–627；G:1594–1601；src/http/ngx_http_file_cache.c:228–261 |
| scgi_cache_path | 247–252 | ngx_http_file_cache_set_slot src/http/ngx_http_file_cache.c:2379–2722 | G:1253–1273；src/http/ngx_http_file_cache.c:228–261；src/http/ngx_http_file_cache.c:994–1025；src/http/ngx_http_file_cache.c:1860–1919；src/http/ngx_http_file_cache.c:2022–2105；src/http/ngx_http_file_cache.c:2109–2151；U:3242–3272 |
| scgi_cache_bypass | 254–259 | ngx_http_set_predicate_slot src/http/ngx_http_script.c:402–441 | src/http/ngx_http_script.c:347–370；U:881–892；U:3143–3166 |
| scgi_no_cache | 261–266 | ngx_http_set_predicate_slot src/http/ngx_http_script.c:402–441 | src/http/ngx_http_script.c:347–370；U:3143–3166；U:2825–2832 |
| scgi_cache_valid | 268–273 | ngx_http_file_cache_valid_set_slot src/http/ngx_http_file_cache.c:2726–2799 | src/http/ngx_http_file_cache.c:2353–2375；U:3173–3211；U:4789–4810；U:4828–4853；U:4966–4991；U:5016–5068；U:5251–5268 |
| scgi_cache_min_uses | 275–280 | ngx_conf_set_num_slot src/core/ngx_conf_file.c:1167–1194 | U:873–879；src/http/ngx_http_file_cache.c:310–338；src/http/ngx_http_file_cache.c:893–927；U:973–977 |
| scgi_cache_max_range_offset | 282–287 | ngx_conf_set_off_slot src/core/ngx_conf_file.c:1229–1256 | U:996–1002；U:1141–1187 |
| scgi_cache_use_stale | 289–294 | ngx_conf_set_bitmask_slot src/core/ngx_conf_file.c:1389–1431 | G:77–90；G:1565–1577；U:908–938；U:2562–2591；U:4423–4460 |
| scgi_cache_methods | 296–301 | ngx_conf_set_bitmask_slot src/core/ngx_conf_file.c:1389–1431 | G:1579–1583；U:452–457；U:826–860 |
| scgi_cache_lock | 303–308 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | U:894–899；src/http/ngx_http_file_cache.c:405–460；src/http/ngx_http_file_cache.c:503–539 |
| scgi_cache_lock_timeout | 310–315 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | U:894–899；src/http/ngx_http_file_cache.c:405–460；src/http/ngx_http_file_cache.c:503–539；U:973–977 |
| scgi_cache_lock_age | 317–322 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | U:894–899；src/http/ngx_http_file_cache.c:405–460 |
| scgi_cache_revalidate | 324–329 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | G:458–467；G:669–673；G:1670–1676；G:1748–1795；U:5994–6043；U:2598–2659 |
| scgi_cache_background_update | 331–336 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | U:908–938；U:1118–1137 |
| scgi_temp_path | 340–345 | ngx_conf_set_path_slot src/core/ngx_file.c:361–417 | G:472–474；G:1528–1534；U:3242–3272；U:4244–4321 |
| scgi_max_temp_file_size | 347–352 | ngx_conf_set_size_slot src/core/ngx_conf_file.c:1198–1225 | G:1430–1433；G:1488–1509；U:3242–3272；src/event/ngx_event_pipe.c:272–281 |
| scgi_temp_file_write_size | 354–359 | ngx_conf_set_size_slot src/core/ngx_conf_file.c:1198–1225 | G:1430–1433；G:1467–1485；U:3242–3272；src/event/ngx_event_pipe.c:784–825 |
| scgi_next_upstream | 361–366 | ngx_conf_set_bitmask_slot src/core/ngx_conf_file.c:1389–1431 | G:77–90；G:1517–1526；G:985–1005；U:2534–2560；U:4415–4426 |
| scgi_next_upstream_tries | 368–373 | ngx_conf_set_num_slot src/core/ngx_conf_file.c:1167–1194 | U:805–819；U:1254–1262；U:2534–2560；U:4415–4426 |
| scgi_next_upstream_timeout | 375–380 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | U:805–819；U:2534–2560；U:4415–4426 |
| scgi_param | 382–387 | ngx_http_upstream_param_set_slot U:6586–6626 | G:651–703；G:795–870；G:947–981；G:1655–1695；G:1698–1900；conf/scgi_params:1–18 |
| scgi_pass_header | 389–394 | ngx_conf_set_str_array_slot src/core/ngx_conf_file.c:1093–1125 | G:445–453；G:1628–1637；G:1114–1123；U:6667–6735；U:2906–2934 |
| scgi_hide_header | 396–401 | ngx_conf_set_str_array_slot src/core/ngx_conf_file.c:1093–1125 | G:445–453；G:1628–1637；G:1114–1123；U:6667–6735；U:2906–2934 |
| scgi_ignore_headers | 403–408 | ngx_conf_set_bitmask_slot src/core/ngx_conf_file.c:1389–1431 | G:1114–1123；U:460–471；U:2825–2832；U:4789–4810；U:4828–4853；U:4966–4991；U:5016–5068；U:5092–5163；U:5251–5268 |

## 实际发行patch对照

在mkdtemp目录中git archive展开固定Nginx树，以系统patch --batch --verbose -p1按既有NGINX_PATCH_AUDIT顺序应用34个patch；server_header执行审计记录已定义的版本替换。142个hunk全部应用，offset/fuzz逐项等于既有审计，47个最终文件SHA-256相等。未运行回放生成器或改变审计记录。

486处显式注册/回调/证据范围有效，392处为Nginx片段。每步patch后对所引原始片段做原文保持比较：385段保持，7段首次变化如下；没有以整文件名未命中替代局部验证。

| 指令 / 证据ID | 原始U范围 | 首个改变片段的patch |
| --- | --- | --- |
| scgi_request_buffering / implementation-3 | 2312–2345 | upstream_pipelining |
| scgi_send_timeout / implementation-1 | 2312–2345 | upstream_pipelining |
| scgi_connect_timeout / implementation-0 | 1660–1678 | upstream_timeout_fields |
| scgi_send_timeout / implementation-0 | 2113–2150 | upstream_timeout_fields |
| scgi_read_timeout / implementation-0 | 2174–2187 | upstream_timeout_fields |
| scgi_read_timeout / implementation-2 | 3336–3340 | upstream_timeout_fields |
| scgi_read_timeout / implementation-3 | 3797–3815 | upstream_timeout_fields |

SCGI整文件补丁前后相同，SHA-256：ea07bb88ff78310b1d77f6c85245a6180a47f60bbcbb5458d7ffe2e2ec3f5983。

5项verified_affected为scgi_request_buffering、scgi_connect_timeout、scgi_send_timeout、scgi_read_timeout、scgi_intercept_errors。最后一项虽然所引intercept函数保持原文，error_page配置及请求处理仍受no_error_pages影响，故引用该补丁1–91；前三类相关片段另引upstream_pipelining 1–23及upstream_timeout_fields 1–112。其余39项unaffected只覆盖本条明示事实，不声称整个SCGI请求链未受补丁影响。

## 隔离构建实证

捕获正式330项基线 1.27.1.1-c66c7c93f58b312c，只在临时知识输入中加44项；当前主线差集中SCGI仍44项，没有重复身份。复制既有components/catalog/site/src，临时配置指向本地固定来源，用现有scripts/build.mjs的build及其内置validatePublication完成网站静态知识验证；不是编译或运行OpenResty。

- 临时release：1.27.1.1-94d4c71417ca0852。
- 注册1017，basic_verified374=330+44，deep_verified0，registration_only643；不是正式发布，也不代表全站完成。
- 本批44项全部basic_verified；中文summary、syntax、defaults、inheritance、limitations、patch_status、related与输入逐项相等；phase、配置回调symbol及compile_guards匹配。
- 530个发布来源=486处显式引用+44个自动distribution-version，逐一检查固定SHA、真实代码、范围与固定URL锚点。
- 其余973个详情除release_id外逐字段不变，包括FastCGI49仍保持正式基线原状态；没有夹带候审FastCGI草稿。8个reference对象不变。
- 测试前后正式knowledge/directives.json及dist/knowledge/index.json字节完全相同。正式仍330，不将临时374冒充正式计数。
- 配置/build脚本/components/catalog及冻结proxy/upstream/FastCGI两文件组哈希均无变化；测试期间只在mkdtemp产生临时配置、知识输入、coverage和dist。
- patch日志解析首次因本机Patching file大小写/引号格式不符而中断；确认格式后修正内存验收表达式，完整重放成功，不改项目脚本。所有尝试目录均finally清理。

## 冻结与未决

FastCGI冻结哈希复核一致：JSON 8c0139266ee397454a00d60d05d50a565de71e31360cdd5770a31404920d5b53；NOTES 38cc8f64fe0b8998d416ce986c2b076e75dec4f6bb3ea510f3607667b2266a00。无新指定finding，未修改。

SCGI可选默认值未知10项：scgi_pass、scgi_store、scgi_limit_rate、scgi_cache、scgi_cache_key、scgi_cache_path、scgi_temp_path、scgi_param、scgi_pass_header、scgi_hide_header。

SCGI可选继承未知7项：scgi_pass、scgi_store、scgi_limit_rate、scgi_cache、scgi_temp_path、scgi_pass_header、scgi_hide_header；cache_path为not_applicable。上述未知已在JSON明确标注，不以空default猜测off，也不把可选未知充作必需事实缺口。

44项必需功能/语法/限制/真实入口/固定来源及patch状态均已提供，仍需独立审核语义和完整性。本角色不修改review/shared/current，不执行来源生成器、OpenResty或源仓库构建，不下载，不宣称实际环境已经启用模块或已验证SCGI服务端互通。审核通过后由主合入；若发现具体问题仅按指定finding修改对应条目。

## 主线程修复R27/R28

2026-10-12。独立审核42项通过后，主仅改scgi_cache_valid的any匹配优先级说明为配置记录顺序首匹配（any在前会遮后续具体状态），以及scgi_param示例来源conf/scgi_params末行18→真实EOF17。其余正文、来源和42项保持。固定ngx_http_file_cache.c:2353–2375实际逐项扫描已读；两个变动关联片段在临时34补丁/142hunk/47最终摘要回放后保持，目录finally清理，未重新构建根站点。新JSON SHA256为9af980ecfd82472aa6cbceb645e5b7106b784d31f48916136e12f3d032ca5c70；旧374隔离构建只代表修正前版本，不冒称新版已发布。待差异复核。
