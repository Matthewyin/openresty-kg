# Nginx 全目录基础内容生产策略

2026-10-10。状态：ready，仅研究交接，不写产品知识，不改已冻结 WEBSITE_COMPLETION_PLAN。首批覆盖下列完整模块；正式完成条件仍是 C01 最终核定的全 Nginx 目录逐条满足 C02，不能以首批通过代替全量。

## 结论与固定证据

采用 research 的一手来源研究和 writing-for-agents 的可检查交接方式；已完整读取两技能，不嵌套 Agent。主首次 docs clone 失败；本研究按用户授权使用 agent-reach 的 GitHub/gh API，只读固定tree/blob，不重复clone或修改现有来源Git。

- 文档：`nginx/nginx.org`，SHA `e8b581903e9d41252720053311cea687a5671674`；API返回committer时间2024-08-15T13:23:04Z，author时间2024-08-14T18:14:32Z。固定递归tree完整、truncated=false。该快照作为交叉证据，不等于全部文字都适用开源Nginx 1.27.1或OpenResty有效补丁行为。
- 源码：`nginx/nginx`，SHA `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`，实际 catalog 的724个上游注册身份。615个不同名称，81个名称跨module重复。请求中的714不作为分母；若指后续未完成集合，应由正式目录减去实际已审核基础ID集合计算。
- API实际读取96个英文 `ngx_*_module.xml`、解析845个directive节点、699个文档名称；去除XML注释，按DTD的实体和结构解析。724个注册中700条存在至少一个同名节点，24条没有；这是候选发现结果，未把700条算作身份映射审核或功能完成。文档节点数包含商业/外部模块、历史项和同名项，不是发行版指令分母。
- C01仍由主并行完成；补丁新增 `no_error_pages`、`log_escape_non_ascii` 等差异不在上述724上游基线内。研究可现在推进，最终提交时对照冻结目录补齐差异，不等待全目录冻结才读实现。

一手入口：[固定文档DTD](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/dtd/module.dtd)、[core/events XML](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/ngx_core_module.xml)、[HTTP core XML](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_core_module.xml)、[HTTP proxy XML](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_proxy_module.xml)。这里只声明固定API读到原文，不声明本地clone或build接入已完成。

## XML与注册身份的映射规则

从正式 `(component,module,name)` 身份出发，以源码注册owner、context和功能类别选取XML directive，保存固定文件的实际节点起止行。文档根module的展示名称、文件名、directive name分别是不同信息；同名候选不能自动任选第一项。规则如下：

| 实际情况 | 映射与核对 |
|---|---|
| 普通同模块节点 | 选对应模块XML的同名directive，再逐条对照注册flags、callback、参数分支、版本和功能正文 |
| events/core集中编排 | `ngx_event_core_module`六条及`ngx_events_module.events`在ngx_core_module.xml；同页还含include、error_log、pcre_jit、thread_pool、ssl_engine和worker_aio_requests，不能把这些owner改成ngx_core_module |
| 按功能跨文件组织 | HTTP core注册的gzip_vary/gzip_http_version/gzip_proxied/gzip_disable位于ngx_http_gzip_module.xml，guard为NGX_HTTP_GZIP；quic_bpf由ngx_quic_bpf_module注册，节点位于HTTP v3 XML；google_perftools_profiles有独立XML |
| 同名跨模块 | error_log的core/http/mail/stream分别保留身份；server区分HTTP服务块与HTTP upstream中的上游节点，stream也分别处理；keepalive_time/timeout/requests在HTTP core与upstream keepalive中不能互换；HTTP/stream proxy_pass、TLS参数及超时各用自己的XML与handler |
| 文档无同名节点 | 走源码专项，不删目录、不猜功能、不机械翻译名称；若必需内容暂无法核实，保留registration_only并给具体缺口 |
| 文档独有节点/参数 | 注册不存在时不增加身份；节点存在也要排除其中商业专有、外部模块、旧版本或未实现的参数分支 |

HTTP core的83条中：76条有同文件同名节点，4条gzip在gzip XML，error_log在core XML，post_action/open_file_cache_events没有同名节点。`ngx_http_module.http`另在HTTP core XML。因此HTTP core生产块不能只把该XML所有directive转为同一owner。HTTP proxy的68条均有本模块同名节点，但proxy XML还含开源当前目录没有的商业 `proxy_cache_purge`。

实际XML字段须保留语义：

- `<syntax>`只给参数正文，不含指令名；可能多条syntax，`block="yes"`必须构成块语法。events/http的syntax文本为空，但不是缺失语法。location有两条块语法。
- 多个`<default>`可共同表示默认配置，如proxy_set_header的Host和Connection两条；空`<default/>`不自动推为没有任何初始化值，也不能当“0”。默认和继承最终对照create/init/merge。
- `<context/>`在include中为空，需对照NGX_ANY_CONF；`server`、`upstream`、`if in location`、`limit_except`都要结合HTTP/stream/mail域和对应注册flags，不能全局替换成单个context。
- `<para>`含literal/value/link/note/list/example和商业说明。只取第一句或简单itertext会丢掉无文字link的目标名、内联参数、条件及限制；源码引用显示原XML，中文说明需要读完整相关段及链接目标后改写。
- appeared-in及正文中的变更版本分别约束指令和参数；快照日期相近不能替代版本核对。无需渲染网站、执行XSL或引入XML生产框架。

## 无同名XML节点的完整专项集合

以下24条是对上述96个英文模块XML的结构化directive检查结果，不宣称整个官方站点任何文章都没有提及。每组须继续读固定源码的注册、字段及使用处；按实际功能写说明，默认不可核时保持unknown。

| module | 指令 |
|---|---|
| ngx_devpoll_module | devpoll_changes、devpoll_events |
| ngx_epoll_module | epoll_events |
| ngx_eventport_module | eventport_events |
| ngx_iocp_module | iocp_threads、post_acceptex、acceptex_read |
| ngx_kqueue_module | kqueue_changes、kqueue_events |
| ngx_http_degradation_module | degradation、degrade |
| ngx_http_gzip_filter_module | gzip_window、gzip_hash、postpone_gzipping、gzip_no_buffer |
| ngx_http_ssi_filter_module | ssi_ignore_recycled_buffers |
| ngx_http_uwsgi_module | uwsgi_string |
| ngx_http_core_module | post_action、open_file_cache_events |
| ngx_http_v2_module | http2_pool_size、http2_streams_index_size |
| ngx_mail_proxy_module | proxy |
| ngx_stream_proxy_module | proxy_downstream_buffer、proxy_upstream_buffer |

已有可直接展开的研究路径：post_action注册为str_slot写core_loc_conf.post_action，merge继承该字段，`src/http/ngx_http_request.c:3629–3660`按其值调用内部跳转或命名location；说明必须对照这条使用路径，不写成任意请求阶段钩子。open_file_cache_events注册为flag_slot，core_loc_conf初始化及merge后传给open_file_cache的打开信息，追踪open_file_cache事件条件后才能写功能。平台事件参数读各模块create_conf/init_conf及事件API使用处；平台条件要从构建选择获取，源码内无guard不等于跨平台可用。

## alias、失效项与版本变化

1. `root`与`alias`共用`ngx_http_core_root`但不是名称别名：注册context不同，handler按cmd名称区分URI拼接与location前缀替换。分别写语法/功能/限制，不因同callback复用同一段正文。[源码](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/ngx_http_core_module.c)、[文档alias](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_core_module.xml#L197)。
2. stream的proxy_downstream_buffer/proxy_upstream_buffer是有正向证据的旧别名：注册均写`ngx_stream_proxy_srv_conf_t.buffer_size`，post调用ngx_conf_deprecated提示proxy_buffer_size。可借用新名称文档解释同一字段，但旧身份、废弃状态、告警与源码必须单独保留。[固定定义](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/stream/ngx_stream_proxy_module.c#L129-L211)。
3. HTTP/2旧指令有文档也未必仍执行旧功能。例如http2_max_requests节点保留旧默认1000及废弃说明，但当前callback为ngx_http_v2_obsolete；`src/http/v2/ngx_http_v2_module.c:481–499`仅警告并返回成功。不得把旧默认值当作当前有效配置值，也不能自动替用户设置keepalive_requests。相关max_field/header_size、recv/idle_timeout、push等逐条核当前注册回调/post与XML历史说明。
4. server_tokens XML包含商业自定义字符串，开源注册使用enum_slot及枚举post；只填写源码实际接受的on/off/build等值。proxy_cache_purge等文档独有商业节点不接入；njs、otel及其他外部模块XML不扩发行范围。resolver在core与upstream文档同时出现时，更要核当前commands实际owner和商业/版本条件。[server_tokens与HTTP core](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_core_module.xml)、[proxy_cache_purge](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_proxy_module.xml#L573)。

## 首批完整模块与生产顺序

以下集合按实际724基线统计，共192身份，其中181有同名XML候选、11无节点。数字只辅助检测遗漏；完成按对应module的全部正式ID集合逐条核对，并在主冻结的补丁目录差异上补齐。已审核的worker/events五项优先复用证据，只有新事实影响时重核，不重复新增。

| 块 | 完整身份边界 | 读取与分组 |
|---|---|---|
| B01 core及支撑，23 | ngx_core_module全部16；ngx_conf_module、ngx_errlog_module、ngx_regex_module、ngx_thread_pool_module、ngx_openssl_module、ngx_quic_bpf_module、ngx_google_perftools_module各1 | core XML与对应支撑XML → 注册 → handler/字段 → core create/init或支撑配置初始化；平台、debug、PCRE/线程/OpenSSL/QUIC条件单列 |
| B02 events，17 | ngx_events_module 1、ngx_event_core_module 6、devpoll 2、epoll 2、eventport 1、iocp 3、kqueue 2 | core/events XML → event配置分发和use选择 → 各event模块create/init及API；9条无节点参数走源码专项，worker_aio_requests虽在epoll owner但有core XML |
| B03 HTTP core，84 | ngx_http_module.http 1、ngx_http_core_module全部83 | main/srv/loc conf三种结构分开；块创建/匹配、请求与响应处理、路径和文件缓存分别研究；四gzip指令、共用error_log与两条无节点不可漏 |
| B04 HTTP proxy，68 | ngx_http_proxy_module全部68，含CACHE/SSL条件项 | proxy_loc_conf及嵌套upstream字段、专用handler、create/merge/init_headers、upstream通用行为；cache/SSL条件不按当前机器裁掉 |

B01必须包括：daemon/master_process；timer_resolution/worker_shutdown_timeout；pid/lock_file/working_directory；worker_processes、debug_points、user、worker_priority、worker_cpu_affinity、worker_rlimit_nofile/core、env、load_module；及上述七个支撑module的各自条目。共享slot只减少重复阅读解析器，不能证明功能等价。

B03按真实callback/字段拆为以下研究组；填写前核该module完整ID集合，不预选“常见项”漏掉难项：

| 组 | 实际配置入口和功能对象 |
|---|---|
| 配置块/匹配 | http→ngx_http_block；server/location/listen/server_name/limit_except各有专用callback，分别核main/srv/loc构建、URI及套接字参数 |
| main/srv容量 | variables/server_names/types hash系列；connection_pool_size/request_pool_size及pool_size post；client_header_buffer_size/large_client_header_buffers和header_timeout，不能混成连接吞吐量说明 |
| 请求体与访问 | client_max_body_size、client_body_buffer_size/timeout/temp_path/in_file_only/in_single_buffer；satisfy/auth_delay；ignore_invalid_headers/underscores_in_headers，按字段和实际读写点解释 |
| 路径与文件 | root/alias、types/default_type、open_file_cache及valid/min_uses/errors/events、disable_symlinks、read_ahead、directio/alignment、aio/aio_write/sendfile/max_chunk、subrequest_output_buffer_size |
| 发送与连接寿命 | tcp_nopush/nodelay、send_timeout/lowat、postpone_output、limit_rate/after（complex value size）；keepalive_time/timeout/requests/disable；lingering_close/time/timeout、reset_timedout_connection |
| 响应与日志 | internal、error_page/recursive_error_pages、error_log、post_action、server_tokens、absolute/server_name/port_in_redirect、msie_padding/refresh、log_not_found/subrequest、chunked_transfer_encoding、etag、if_modified_since、max_ranges |
| 解析与压缩条件 | resolver/resolver_timeout；gzip_vary/http_version/proxied/disable（NGX_HTTP_GZIP）；各enum/bitmask对应post表核选项与条件 |

B04按字段和专用handler分组：

| 组 | 一次共享读取，逐项保持的差异 |
|---|---|
| 转发目标与重写 | proxy_pass/redirect/cookie_domain/path/flags各专用callback；pass URI/变量行为、重写与cookie规则分别解释 |
| 请求构造 | set_header→keyval_slot→headers_source；set_body→str_slot；method→complex_value_slot；pass_request_headers/body→upstream布尔字段；hide/pass_header→str_array；headers hash两个字段和http_version枚举 |
| 传输与缓冲 | buffering与request_buffering分别是响应/请求体；connect/send/read_timeout分别对应upstream字段；buffer_size/buffers/busy_buffers/max_temp_file_size/temp_file_write_size/send_lowat/limit_rate及temp_path逐字段核使用点和merge限制 |
| 上游失败与存储 | bind/socket_keepalive、ignore_client_abort/intercept_errors、force_ranges、next_upstream及tries/timeout；store/store_access的条件与权限，不混作cache |
| 缓存 | cache/cache_key/cache_path、bypass/no_cache、valid、min_uses/max_range_offset、use_stale/methods、lock/timeout/age/revalidate/convert_head/background_update；NGX_HTTP_CACHE条件和专用file_cache/predicate callback分别读 |
| TLS | ssl_protocols bitmask/post，ciphers/name/server_name/session_reuse，verify/depth/trusted_certificate/crl，certificate/key的complex_value_zero入口、password_file、conf_command及post条件；NGX_HTTP_SSL与库版本依赖保留 |

真实字段示例：[HTTP proxy注册](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_proxy_module.c) 中proxy_buffering写`upstream.buffering`，proxy_pass_request_headers写`upstream.pass_request_headers`，二者同flag_slot但意义不同；proxy_read_timeout写`upstream.read_timeout`；proxy_set_header写`headers_source`。配置基础链以 `(callback,conf结构,offset字段,post,create/merge,关键使用处)` 为组内核对单元，不新增产品schema来表示这张研究表。

## 高效生产而保持逐条证据

1. 固定一个完整module的ID集合及XML候选；复用其配置结构和create/merge分析，建立本次内存候选表即可。结果必须列出已写/已有/未解身份，不能用XML匹配数量报告basic完成。
2. 先共读`ngx_conf_set_flag/num/size/msec/sec/off/enum/bitmask/bufs/keyval/str_array/path_slot`等真实定义，理解单位、重复拒绝和post机制；再逐条读注册offset及post。slot只说明如何存配置，不说明配置控制什么行为。
3. 完整阅读该directive的XML功能段、相关限制和条件；对照字段使用处，写具体中文功能和语法。例如proxy_read_timeout是相邻读操作间的等待，不是整次响应总耗时；proxy_buffering与request_buffering的请求/响应对象不同。不可只改名称就复制模板正文。
4. 把create中UNSET与merge最终值区分；复用共同merge文件时仍逐字段核默认和继承。proxy_set_header同层配置会改变整体继承，不能从keyval_slot推出逐键合并；多个默认header要分别保留。[XML证据](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_proxy_module.xml#L1842)、[真实merge/init_headers](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_proxy_module.c#L3442)。
5. 对照主的固定有效补丁与隔离回放，逐所列功能/入口事实核patch状态；相关文件和共享函数的改变需检查，不能因某注册行未变就标全部行为unaffected。无须重做未变化C-R05，也不能把那次五项通过推广给全module。
6. 逐条落入现有knowledge字段，由Sol实施、Astra按完整身份集合及每条语义审核；主负责固定文档证据来源接入、build门禁和发布。未核必需内容留registration_only；默认/继承/补充限制未知可明示，不以可未知项阻断合格基础条目。

主拟增加 `documentation_sources` 作为显式额外Git固定证据来源：docs不属于下载组件，不增加43项或指令计数，不进入注册扫描。XML原文片段使用真实docs SHA、文件、行范围和GitHub URL进入sources；registration/configuration-definition仍用实际实现来源，不能用XML充当配置handler定义。主接入前研究可使用固定API原文，但不假称产物已可站内引用。XML与实现的两个revision不可混用，网页只显示已有来源面板，不增加功能。

## 全Nginx闭合与审核交接

B01–B04完成后，按同样方法连续覆盖其余完整HTTP模块及upstream算法、stream全部module、mail、HTTP v2/v3、平台/可选模块；24条无节点、旧别名、obsolete项及有效patch新增身份并行专项解决。文档有独立upstream章节不表示所有其中名称都由ngx_http_upstream_module持有；按正式owner保留各算法及keepalive module。

正式closure以C01最终全集为准：每条都有具体功能、准确语法/context、配置callback定义及来源、可核适用条件、所列事实的patch状态；所有必需内容已审核且实际发布身份无缺失/重复，才算全Nginx基础内容完成。默认/继承/补充限制可保持unknown并说明，不编造空值语义；缺功能、入口、context或补丁核定不能靠填满字段升格。deep不因本策略自动增长，不伪造部门样例。

审核优先逐项对照首批完整module集合，再核跨owner文档、商业参数、别名/obsolete行为、字段单位/关键限制、默认/继承和补丁影响，最后核固定XML/源码片段与发布一致。机器校验用于完整性、身份和引用，不能代替逐条功能审核；抽查几个页面也不能替代全集字段及语义检查。

本研究只永久写本文件，解析与统计仅在内存中运行，无临时输出文件、无知识写入、无产品或源码Git变更。未执行生成器、编译/运行OpenResty、浏览器、手机、Codex接入、部署或提交。ready后停写，后续Sol/主可据上述完整模块块直接生产，不需等待文档clone成功再启动已取得固定证据的研究。
