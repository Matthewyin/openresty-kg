# HTTP proxy 全68项：待审基础内容

## 2026-10-12 SNI条件差异

R32同类修正：主复读固定共享upstream.c:1857–1948，仅收窄proxy_ssl_server_name的IPv4概括为名称空、首字符[或ngx_inet_addr结果不等于INADDR_NONE跳过SNI。其他67项及全部来源保持。修后SHA e76c7512e5db4221b21a0744927440be17c9f7c3a873b2c1d75845da5230a208；正式593知识仍保持旧句，待独立差异放行再合入，未自行改正式发布。

## 交付结论与边界

2026-10-10。仅新增 `analysis/content/HTTP_PROXY_BASIC.json` 与本记录。68项均具备逐义中文功能、固定版本语法、显式配置回调、模块 owner、运行实现、官方文档和所列事实的补丁核对证据；均可进入独立内容审核，不以计数代替身份或语义核验。

2026-10-12修正状态：独立审核已通过63项，另5项受WC-R18–R20影响。本轮只修正这5项及本记录；实施验证完成，来源闭合与68项整体准备通过的结论仍待独立差异复核，不自行关闭审核问题或正式发布。修正前的585处引用与172＋68构建记录仅为历史证据，不能代表当前草稿。

HTTP_CORE_REMAINDER 两文件及 helper/test/notes 均保持冻结；不修改正式 knowledge、catalog、config、build、current 或来源仓库，不执行正式 inventory/build，不运行或编译 OpenResty、不运行来源生成器或 mirror-tarballs，不下载源码，不改 UI/MCP。

遵循 research 技能的一手证据方法；本任务是已有分工中的独立实施，不再嵌套 agent。所有永久编辑使用 apply_patch，隔离验证只写 mkdtemp 临时目录并 finally 清理。

## 来源与身份

- Nginx 固定 `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`。
- nginx.org XML 固定 `e8b581903e9d41252720053311cea687a5671674`。
- OpenResty 固定 `8c37412c31621225e7aa7e825b5b50106c9c71c4`，发行版1.27.1.1。
- 通过 git show SHA:path 读取，而非把工作树或回放后的行号冒充固定上游坐标。
- 68个身份精确来自当前 `analysis/directives/catalog.json` 的 `module === ngx_http_proxy_module`，全部 component=nginx。逐个比较 component/module/name 的唯一集合相等；没有 proxy_cache_purge，没有挑选子集。
- owner 是 `src/http/modules/ngx_http_proxy_module.c:802–815`，每条显式提供 `module-owner` source ID；注册表为该文件 `ngx_http_proxy_commands`。
- 所有回调都显式给出 component/file/start_line/end_line，包括 core 通用槽位、upstream bind、脚本复合值和文件缓存回调；不依靠构建时全库同名搜索猜入口。
- XML 注释以空白替换且保留换行，68条均有活跃同名节点。文档含商业版内容时，以固定开源回调支持范围裁定语法，不把商业 purger 等参数列入产品语法。
- 缓存类保持原注册 `NGX_HTTP_CACHE`，TLS 类保持 `NGX_HTTP_SSL`；其余平台/库条件在逐条限制中说明。隔离构建逐条比较发布 guards 与 catalog 原 guards 完全相等。源码注册不表示部署启用。

可直接对照的原始源：
[proxy 模块](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/modules/ngx_http_proxy_module.c)、
[upstream 运行链](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/ngx_http_upstream.c)、
[文件缓存](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/src/http/ngx_http_file_cache.c)、
[冻结官方 XML](https://github.com/nginx/nginx.org/blob/e8b581903e9d41252720053311cea687a5671674/xml/en/docs/http/ngx_http_proxy_module.xml)。

## 逐义核对重点

### URL、请求与响应

proxy_pass 分开研究静态 URL、变量求值、已定义 upstream 组、运行 resolver，以及有无 URI 的分支。静态带 URI 时按有效 location 前缀替换；没有 URI 且原始 URI 可用时使用 unparsed_uri；否则组合规范化 URI 与参数。变量 URL 含 URI 时直接发送求值后的 URI。正则/命名等位置的静态 URI 限制与变量路径不能混为一谈。

proxy_http_version 固定默认1.0，枚举只有1.0/1.1；不套用新版默认值。request_buffering 控制客户端正文，buffering 控制上游响应。流式请求还受 body_values、pass_request_body、chunked 与代理 HTTP 版本条件约束，关闭缓冲不是取消全部内存分配。

proxy_set_body 是发送正文的替换表达式，proxy_pass_request_body 管原始正文，proxy_method 还要让位于缓存 HEAD 转 GET 的 u->method。proxy_pass_request_headers=off 不会消除内部和 proxy_set_header 构造的头。自定义请求头数组仅在本层未定义时整体继承，不逐条拼接父层，默认头再补缺；空值屏蔽对应字段。

proxy_redirect 仅重写响应 Location/Refresh，不改正文链接。cookie domain/path/flags 都是上游 Set-Cookie 处理，非请求 Cookie；多条规则首个匹配生效。flags 支持添加/移除属性、变量和正则，不把多个匹配规则叠加；本层有规则即替代继承数组，off 清除继承。其实际注册参数数量对应 cookie 加1–3个 flag；无效运行时 flag 有忽略分支，不夸大为总能达到目标属性。

### 缓冲、磁盘与超时

buffer_size 包括响应首部读取及有关缓存元数据占用；buffers 是每响应按需分配的块；busy_buffers_size 约束忙缓冲容量，不能当作限速。send_lowat 是写事件低水位，平台可忽略；socket_keepalive 是 SO_KEEPALIVE，不是连接池。

store 根据完整性及200状态等条件保存文件，不是具备缓存失效机制的 proxy_cache；store_access 管落盘权限，不改文件所有者。max_temp_file_size 和 temp_file_write_size 在事件管道非 cacheable 分支限制普通响应缓冲，不能机械限制 cache/store。temp_path 不用于客户端请求正文，cache_path/use_temp_path=off 可改变缓存临时文件目录。

send_timeout 与正文 read_timeout 是事件等待限制而非整请求累计期限。响应头读取定时器有自己的起点，源码没有在每收到头字节时无条件重设，因此没有把文档“连续读间隔”泛化到每个字节。connect_timeout 管连接及相关 TLS 握手等待，不是总请求期限。next_upstream_timeout 则在决定是否重试时检查 peer 起始时间，不是一个到点必杀当前 I/O 的全程定时器。

### 缓存与重试

默认 cache key 的第一段来自实际代理 URL key_start，而非恒等于客户端 scheme 加任意可写变量；第二段取决于变量 URL 自带 URI、有效原始 URI或替换后的规范化 URI/args。草稿明确源码算法，不把文档列出的近似变量串当所有请求的恒等式。

cache_path 只公开开源 parser 支持的 path、levels、keys_zone、use_temp_path、inactive、max_size、min_free、manager_*、loader_*；排除 purger 系列。文件名 MD5、共享区与磁盘正文、manager/loader 作用分别取证；没有把目录容量或 inactive 当有效期。

cache_bypass 控制不读缓存，no_cache 控制不存缓存；谓词是非空且不等于单字符0，二者不能互换。cache_valid 是缺少有效上游期限时的配置来源，不保证可缓存；仅写时间对应200/301/302。cache_methods 保留强制 GET/HEAD，POST 缓存不自动把正文纳入键。关闭 HEAD 转 GET 时应自行让键区分方法。

cache_max_range_offset 的源码比较为 >= 阈值，而不是文档措辞“beyond”的严格大于；后缀范围等还有单独分支，不把这项当请求拒绝或缓存体积限制。cache_lock 是键级协调，lock_timeout 决定等待者不缓存地转上游，lock_age 决定可再放行填充者；并非永远只有一个填充者。background_update 需已有过期项及允许更新中旧值的条件，不是定时预热。revalidate 使用条件头与304分支。use_stale 的配置位与响应头 stale 扩展分别处理，不能承诺无旧项也能回退。

next_upstream 的非幂等限制按 request_sent 和原请求 POST/LOCK/PATCH 判定，non_idempotent 只解除这项限制，不能绕过已发送未缓冲正文不可重放的限制，也不能修复已经向客户端输出响应后的错误。tries=0 关闭额外上限，而不是无限重试。

### 响应头与 TLS

hide/pass_header 操作向客户端复制时的隐藏集合；ignore_headers 关闭已支持响应头的特殊处理，不是删除字段。默认隐藏表是源码列出的字段，不是任意 X-Accel-* 通配匹配。intercept_errors 还需要 error_page 匹配，发行版 no_error_pages 影响该映射的可用性，on 不自动改写所有 >=300 状态。

ssl_name 是证书主机名检查和可选 SNI 的名字来源；server_name 决定是否发送 SNI；verify 决定是否验证证书链及名称。设置其中一项不会自动开启另外两项，也不改 HTTP Host。SNI 过滤空名字、字面 IP 等情况；默认名称取组主机或动态解析目标、再去端口，不等同任意写入后的 $proxy_host。

certificate/key 是发给上游的客户端身份，trusted_certificate 是验证上游的 CA，crl 是吊销列表。静态与变量路径的加载时点分别核对；password_file 是本地私钥口令列表，不是 HTTP 密码。ssl_conf_command 在一般 TLS 配置后应用且依赖 SSL_CONF 接口，数组只在本层未配置时继承。cipher list 对应 SSL_CTX_set_cipher_list，不夸大成控制所有 TLS1.3 ciphersuite。TLS 协议默认掩码记录固定1.27.1的 TLSv1/1.1/1.2/1.3，不据此推断链接库允许或建议部署开启旧协议。

## 完整68身份与读取证据

注册行均指 proxy 模块原始文件。以下运行证据是 JSON 中显式 implementation 来源；默认合并、文档及补丁还有各自来源 ID。表中使用完整身份，不跨模块混同同名项。

| 完整身份 | 注册行 | 显式配置 callback | 运行实现证据 |
| --- | --- | --- | --- |
| `nginx/ngx_http_proxy_module/proxy_pass` | 299–304 | `src/http/modules/ngx_http_proxy_module.c:4114–4232` | `src/http/modules/ngx_http_proxy_module.c:1028–1134`；`src/http/modules/ngx_http_proxy_module.c:1293–1341`；`src/http/modules/ngx_http_proxy_module.c:1417–1463`；`src/http/ngx_http_upstream.c:696–785`；`src/http/ngx_http_core_module.c:1252–1262`；`src/http/ngx_http_core_module.c:1381–1383` |
| `nginx/ngx_http_proxy_module/proxy_redirect` | 306–311 | `src/http/modules/ngx_http_proxy_module.c:4236–4376` | `src/http/modules/ngx_http_proxy_module.c:2667–2695`；`src/http/modules/ngx_http_proxy_module.c:3150–3193`；`src/http/ngx_http_upstream.c:5436–5525` |
| `nginx/ngx_http_proxy_module/proxy_cookie_domain` | 313–318 | `src/http/modules/ngx_http_proxy_module.c:4380–4468` | `src/http/modules/ngx_http_proxy_module.c:2699–2775`；`src/http/modules/ngx_http_proxy_module.c:2900–2918`；`src/http/modules/ngx_http_proxy_module.c:3199–3226` |
| `nginx/ngx_http_proxy_module/proxy_cookie_path` | 320–325 | `src/http/modules/ngx_http_proxy_module.c:4472–4560` | `src/http/modules/ngx_http_proxy_module.c:2699–2775`；`src/http/modules/ngx_http_proxy_module.c:2900–2918`；`src/http/modules/ngx_http_proxy_module.c:3150–3193` |
| `nginx/ngx_http_proxy_module/proxy_cookie_flags` | 327–332 | `src/http/modules/ngx_http_proxy_module.c:4564–4680` | `src/http/modules/ngx_http_proxy_module.c:2922–3017`；`src/http/modules/ngx_http_proxy_module.c:3021–3146`；`src/http/modules/ngx_http_proxy_module.c:901–931` |
| `nginx/ngx_http_proxy_module/proxy_store` | 334–339 | `src/http/modules/ngx_http_proxy_module.c:4721–4769` | `src/http/ngx_http_upstream.c:4135–4181`；`src/http/ngx_http_upstream.c:4244–4321` |
| `nginx/ngx_http_proxy_module/proxy_store_access` | 341–346 | `src/core/ngx_file.c:460–522` | `src/http/ngx_http_upstream.c:4279–4321`；`src/core/ngx_file.c:660–710` |
| `nginx/ngx_http_proxy_module/proxy_buffering` | 348–353 | `src/core/ngx_conf_file.c:1026–1062` | `src/http/modules/ngx_http_proxy_module.c:997–1015`；`src/http/ngx_http_upstream.c:3070–3108`；`src/http/ngx_http_upstream.c:3228–3264`；`src/http/ngx_http_upstream.c:5110–5145` |
| `nginx/ngx_http_proxy_module/proxy_request_buffering` | 355–360 | `src/core/ngx_conf_file.c:1026–1062` | `src/http/modules/ngx_http_proxy_module.c:1015–1023`；`src/http/ngx_http_upstream.c:2192–2308`；`src/http/ngx_http_upstream.c:2312–2345`；`src/http/ngx_http_upstream.c:4415–4428` |
| `nginx/ngx_http_proxy_module/proxy_ignore_client_abort` | 362–367 | `src/core/ngx_conf_file.c:1026–1062` | `src/http/ngx_http_upstream.c:612–630`；`src/http/ngx_http_upstream.c:2293–2307`；`src/http/ngx_http_upstream.c:1358–1398` |
| `nginx/ngx_http_proxy_module/proxy_bind` | 369–374 | `src/http/ngx_http_upstream.c:6433–6529` | `src/http/ngx_http_upstream.c:6533–6582`；`src/event/ngx_event_connect.c:95–161` |
| `nginx/ngx_http_proxy_module/proxy_socket_keepalive` | 376–381 | `src/core/ngx_conf_file.c:1026–1062` | `src/http/ngx_http_upstream.c:639–646`；`src/event/ngx_event_connect.c:76–88` |
| `nginx/ngx_http_proxy_module/proxy_connect_timeout` | 383–388 | `src/core/ngx_conf_file.c:1260–1287` | `src/http/ngx_http_upstream.c:1661–1674`；`src/http/ngx_http_upstream.c:1743–1763` |
| `nginx/ngx_http_proxy_module/proxy_send_timeout` | 390–395 | `src/core/ngx_conf_file.c:1260–1287` | `src/http/ngx_http_upstream.c:2113–2144`；`src/http/ngx_http_upstream.c:2312–2345` |
| `nginx/ngx_http_proxy_module/proxy_send_lowat` | 397–402 | `src/core/ngx_conf_file.c:1198–1225` | `src/http/ngx_http_upstream.c:2121–2130`；`src/http/modules/ngx_http_proxy_module.c:4891–4916` |
| `nginx/ngx_http_proxy_module/proxy_intercept_errors` | 404–409 | `src/core/ngx_conf_file.c:1026–1062` | `src/http/ngx_http_upstream.c:2501–2523`；`src/http/ngx_http_upstream.c:2663–2756` |
| `nginx/ngx_http_proxy_module/proxy_set_header` | 411–416 | `src/core/ngx_conf_file.c:1129–1163` | `src/http/modules/ngx_http_proxy_module.c:819–832`；`src/http/modules/ngx_http_proxy_module.c:1370–1395`；`src/http/modules/ngx_http_proxy_module.c:1470–1519`；`src/http/modules/ngx_http_proxy_module.c:3985–4034`；`src/http/modules/ngx_http_proxy_module.c:3901–3917`；`src/http/modules/ngx_http_proxy_module.c:877–890` |
| `nginx/ngx_http_proxy_module/proxy_headers_hash_max_size` | 418–423 | `src/core/ngx_conf_file.c:1167–1194` | `src/http/modules/ngx_http_proxy_module.c:3834–3853`；`src/http/modules/ngx_http_proxy_module.c:4096–4109`；`src/http/ngx_http_upstream.c:6727–6735` |
| `nginx/ngx_http_proxy_module/proxy_headers_hash_bucket_size` | 425–430 | `src/core/ngx_conf_file.c:1167–1194` | `src/http/modules/ngx_http_proxy_module.c:3837–3853`；`src/http/modules/ngx_http_proxy_module.c:4096–4109`；`src/http/ngx_http_upstream.c:6727–6735` |
| `nginx/ngx_http_proxy_module/proxy_set_body` | 432–437 | `src/core/ngx_conf_file.c:1066–1089` | `src/http/modules/ngx_http_proxy_module.c:1320–1347`；`src/http/modules/ngx_http_proxy_module.c:1547–1600`；`src/http/modules/ngx_http_proxy_module.c:3878–3899` |
| `nginx/ngx_http_proxy_module/proxy_method` | 439–444 | `src/http/ngx_http_script.c:243–275` | `src/http/modules/ngx_http_proxy_module.c:1255–1301` |
| `nginx/ngx_http_proxy_module/proxy_pass_request_headers` | 446–451 | `src/core/ngx_conf_file.c:1026–1062` | `src/http/modules/ngx_http_proxy_module.c:1370–1395`；`src/http/modules/ngx_http_proxy_module.c:1505–1541`；`src/http/modules/ngx_http_proxy_module.c:1470–1519` |
| `nginx/ngx_http_proxy_module/proxy_pass_request_body` | 453–458 | `src/core/ngx_conf_file.c:1026–1062` | `src/http/modules/ngx_http_proxy_module.c:1547–1600`；`src/http/modules/ngx_http_proxy_module.c:1015–1023` |
| `nginx/ngx_http_proxy_module/proxy_buffer_size` | 460–465 | `src/core/ngx_conf_file.c:1198–1225` | `src/http/ngx_http_upstream.c:2394–2406`；`src/http/ngx_http_upstream.c:2469–2496`；`src/http/ngx_http_upstream.c:3070–3108`；`src/http/ngx_http_upstream.c:862–873` |
| `nginx/ngx_http_proxy_module/proxy_read_timeout` | 467–472 | `src/core/ngx_conf_file.c:1260–1287` | `src/http/ngx_http_upstream.c:2173–2185`；`src/http/ngx_http_upstream.c:3328–3340`；`src/http/ngx_http_upstream.c:3797–3816`；`src/event/ngx_event_pipe.c:60–80`；`src/http/ngx_http_upstream.c:2436–2466` |
| `nginx/ngx_http_proxy_module/proxy_buffers` | 474–479 | `src/core/ngx_conf_file.c:1322–1348` | `src/http/ngx_http_upstream.c:3228–3238`；`src/event/ngx_event_pipe.c:229–256`；`src/http/modules/ngx_http_proxy_module.c:3521–3534` |
| `nginx/ngx_http_proxy_module/proxy_busy_buffers_size` | 481–486 | `src/core/ngx_conf_file.c:1198–1225` | `src/http/ngx_http_upstream.c:3228–3238`；`src/event/ngx_event_pipe.c:598–664`；`src/http/modules/ngx_http_proxy_module.c:3537–3564` |
| `nginx/ngx_http_proxy_module/proxy_force_ranges` | 488–493 | `src/core/ngx_conf_file.c:1026–1062` | `src/http/ngx_http_upstream.c:2951–2963`；`src/http/ngx_http_upstream.c:5560–5586` |
| `nginx/ngx_http_proxy_module/proxy_limit_rate` | 495–500 | `src/http/ngx_http_script.c:317–343` | `src/http/ngx_http_upstream.c:3228–3241`；`src/event/ngx_event_pipe.c:205–225` |
| `nginx/ngx_http_proxy_module/proxy_cache` | 504–509 | `src/http/modules/ngx_http_proxy_module.c:4775–4830` | `src/http/ngx_http_upstream.c:826–899`；`src/http/ngx_http_upstream.c:1010–1053`；`src/http/modules/ngx_http_proxy_module.c:3637–3657` |
| `nginx/ngx_http_proxy_module/proxy_cache_key` | 511–516 | `src/http/modules/ngx_http_proxy_module.c:4834–4858` | `src/http/modules/ngx_http_proxy_module.c:1141–1245`；`src/http/modules/ngx_http_proxy_module.c:5083–5113` |
| `nginx/ngx_http_proxy_module/proxy_cache_path` | 518–523 | `src/http/ngx_http_file_cache.c:2379–2722` | `src/http/ngx_http_file_cache.c:228–261`；`src/http/ngx_http_file_cache.c:2022–2104`；`src/http/ngx_http_file_cache.c:2109–2160` |
| `nginx/ngx_http_proxy_module/proxy_cache_bypass` | 525–530 | `src/http/ngx_http_script.c:402–441` | `src/http/ngx_http_upstream.c:881–892`；`src/http/ngx_http_script.c:346–371`；`src/http/ngx_http_upstream.c:3143–3169` |
| `nginx/ngx_http_proxy_module/proxy_no_cache` | 532–537 | `src/http/ngx_http_script.c:402–441` | `src/http/ngx_http_upstream.c:3143–3169`；`src/http/ngx_http_script.c:346–371` |
| `nginx/ngx_http_proxy_module/proxy_cache_valid` | 539–544 | `src/http/ngx_http_file_cache.c:2726–2799` | `src/http/ngx_http_upstream.c:3173–3192`；`src/http/ngx_http_file_cache.c:2350–2375` |
| `nginx/ngx_http_proxy_module/proxy_cache_min_uses` | 546–551 | `src/core/ngx_conf_file.c:1167–1194` | `src/http/ngx_http_upstream.c:873–880`；`src/http/ngx_http_file_cache.c:310–340`；`src/http/ngx_http_file_cache.c:893–929` |
| `nginx/ngx_http_proxy_module/proxy_cache_max_range_offset` | 553–558 | `src/core/ngx_conf_file.c:1229–1256` | `src/http/ngx_http_upstream.c:1141–1190`；`src/http/ngx_http_upstream.c:996–998` |
| `nginx/ngx_http_proxy_module/proxy_cache_use_stale` | 560–565 | `src/core/ngx_conf_file.c:1389–1431` | `src/http/ngx_http_upstream.c:908–941`；`src/http/ngx_http_upstream.c:2562–2591`；`src/http/ngx_http_upstream.c:4428–4460`；`src/http/modules/ngx_http_proxy_module.c:3671–3679` |
| `nginx/ngx_http_proxy_module/proxy_cache_methods` | 567–572 | `src/core/ngx_conf_file.c:1389–1431` | `src/http/ngx_http_upstream.c:826–849`；`src/http/modules/ngx_http_proxy_module.c:3681–3684`；`src/http/ngx_http_upstream.c:452–457` |
| `nginx/ngx_http_proxy_module/proxy_cache_lock` | 574–579 | `src/core/ngx_conf_file.c:1026–1062` | `src/http/ngx_http_upstream.c:894–896`；`src/http/ngx_http_file_cache.c:405–460` |
| `nginx/ngx_http_proxy_module/proxy_cache_lock_timeout` | 581–586 | `src/core/ngx_conf_file.c:1260–1287` | `src/http/ngx_http_file_cache.c:405–460`；`src/http/ngx_http_file_cache.c:503–539`；`src/http/ngx_http_upstream.c:972–977` |
| `nginx/ngx_http_proxy_module/proxy_cache_lock_age` | 588–593 | `src/core/ngx_conf_file.c:1260–1287` | `src/http/ngx_http_file_cache.c:405–439`；`src/http/ngx_http_upstream.c:894–896` |
| `nginx/ngx_http_proxy_module/proxy_cache_revalidate` | 595–600 | `src/core/ngx_conf_file.c:1026–1062` | `src/http/modules/ngx_http_proxy_module.c:855–874`；`src/http/ngx_http_upstream.c:2597–2659`；`src/http/ngx_http_upstream.c:5994–6043` |
| `nginx/ngx_http_proxy_module/proxy_cache_convert_head` | 602–607 | `src/core/ngx_conf_file.c:1026–1062` | `src/http/ngx_http_upstream.c:836–849`；`src/http/modules/ngx_http_proxy_module.c:1265–1276` |
| `nginx/ngx_http_proxy_module/proxy_cache_background_update` | 609–614 | `src/core/ngx_conf_file.c:1026–1062` | `src/http/ngx_http_upstream.c:908–941`；`src/http/ngx_http_upstream.c:1118–1137` |
| `nginx/ngx_http_proxy_module/proxy_temp_path` | 618–623 | `src/core/ngx_file.c:361–417` | `src/http/ngx_http_upstream.c:3242–3265` |
| `nginx/ngx_http_proxy_module/proxy_max_temp_file_size` | 625–630 | `src/core/ngx_conf_file.c:1198–1225` | `src/http/ngx_http_upstream.c:3270–3271`；`src/event/ngx_event_pipe.c:270–282`；`src/event/ngx_event_pipe.c:781–817`；`src/http/modules/ngx_http_proxy_module.c:3588–3608` |
| `nginx/ngx_http_proxy_module/proxy_temp_file_write_size` | 632–637 | `src/core/ngx_conf_file.c:1198–1225` | `src/http/ngx_http_upstream.c:3270–3271`；`src/event/ngx_event_pipe.c:781–817`；`src/http/modules/ngx_http_proxy_module.c:3568–3585` |
| `nginx/ngx_http_proxy_module/proxy_next_upstream` | 639–644 | `src/core/ngx_conf_file.c:1389–1431` | `src/http/modules/ngx_http_proxy_module.c:252–268`；`src/http/ngx_http_upstream.c:2530–2560`；`src/http/ngx_http_upstream.c:4404–4428` |
| `nginx/ngx_http_proxy_module/proxy_next_upstream_tries` | 646–651 | `src/core/ngx_conf_file.c:1167–1194` | `src/http/ngx_http_upstream.c:806–819`；`src/http/ngx_http_upstream.c:1253–1263`；`src/http/ngx_http_upstream.c:4415–4428` |
| `nginx/ngx_http_proxy_module/proxy_next_upstream_timeout` | 653–658 | `src/core/ngx_conf_file.c:1260–1287` | `src/http/ngx_http_upstream.c:2539–2560`；`src/http/ngx_http_upstream.c:4415–4428` |
| `nginx/ngx_http_proxy_module/proxy_pass_header` | 660–665 | `src/core/ngx_conf_file.c:1093–1125` | `src/http/ngx_http_upstream.c:6705–6735`；`src/http/ngx_http_upstream.c:2904–2917` |
| `nginx/ngx_http_proxy_module/proxy_hide_header` | 667–672 | `src/core/ngx_conf_file.c:1093–1125` | `src/http/modules/ngx_http_proxy_module.c:835–846`；`src/http/ngx_http_upstream.c:6661–6703`；`src/http/ngx_http_upstream.c:2904–2917` |
| `nginx/ngx_http_proxy_module/proxy_ignore_headers` | 674–679 | `src/core/ngx_conf_file.c:1389–1431` | `src/http/ngx_http_upstream.c:460–472`；`src/http/ngx_http_upstream.c:2825–2834`；`src/http/ngx_http_upstream.c:4794–4808`；`src/http/ngx_http_upstream.c:4830–4855`；`src/http/ngx_http_upstream.c:5092–5145` |
| `nginx/ngx_http_proxy_module/proxy_http_version` | 681–686 | `src/core/ngx_conf_file.c:1352–1385` | `src/http/modules/ngx_http_proxy_module.c:287–291`；`src/http/modules/ngx_http_proxy_module.c:1444–1454`；`src/http/modules/ngx_http_proxy_module.c:1015–1023` |
| `nginx/ngx_http_proxy_module/proxy_ssl_session_reuse` | 690–695 | `src/core/ngx_conf_file.c:1026–1062` | `src/http/ngx_http_upstream.c:1722–1742`；`src/http/ngx_http_upstream.c:1837–1854`；`src/http/modules/ngx_http_proxy_module.c:5061–5067` |
| `nginx/ngx_http_proxy_module/proxy_ssl_protocols` | 697–702 | `src/core/ngx_conf_file.c:1389–1431` | `src/http/modules/ngx_http_proxy_module.c:274–282`；`src/http/modules/ngx_http_proxy_module.c:4982–5011`；`src/event/ngx_event_openssl.c:296–312`；`src/event/ngx_event_openssl.c:343–427` |
| `nginx/ngx_http_proxy_module/proxy_ssl_ciphers` | 704–709 | `src/core/ngx_conf_file.c:1066–1089` | `src/http/modules/ngx_http_proxy_module.c:5005–5009`；`src/event/ngx_event_openssl.c:884–899` |
| `nginx/ngx_http_proxy_module/proxy_ssl_name` | 711–716 | `src/http/ngx_http_script.c:243–275` | `src/http/ngx_http_upstream.c:696–702`；`src/http/ngx_http_upstream.c:798–803`；`src/http/ngx_http_upstream.c:1705–1712`；`src/http/ngx_http_upstream.c:1858–1948`；`src/http/ngx_http_upstream.c:1794–1811` |
| `nginx/ngx_http_proxy_module/proxy_ssl_server_name` | 718–723 | `src/core/ngx_conf_file.c:1026–1062` | `src/http/ngx_http_upstream.c:1858–1948` |
| `nginx/ngx_http_proxy_module/proxy_ssl_verify` | 725–730 | `src/core/ngx_conf_file.c:1026–1062` | `src/http/modules/ngx_http_proxy_module.c:5045–5060`；`src/http/ngx_http_upstream.c:1794–1811` |
| `nginx/ngx_http_proxy_module/proxy_ssl_verify_depth` | 732–737 | `src/core/ngx_conf_file.c:1167–1194` | `src/http/modules/ngx_http_proxy_module.c:5045–5060`；`src/event/ngx_event_openssl.c:951–963` |
| `nginx/ngx_http_proxy_module/proxy_ssl_trusted_certificate` | 739–744 | `src/core/ngx_conf_file.c:1066–1089` | `src/http/modules/ngx_http_proxy_module.c:5045–5060`；`src/event/ngx_event_openssl.c:951–984` |
| `nginx/ngx_http_proxy_module/proxy_ssl_crl` | 746–751 | `src/core/ngx_conf_file.c:1066–1089` | `src/http/modules/ngx_http_proxy_module.c:5045–5060`；`src/event/ngx_event_openssl.c:988–1029` |
| `nginx/ngx_http_proxy_module/proxy_ssl_certificate` | 753–758 | `src/http/ngx_http_script.c:279–313` | `src/http/modules/ngx_http_proxy_module.c:5014–5043`；`src/http/ngx_http_upstream.c:1714–1725`；`src/http/ngx_http_upstream.c:1952–1988`；`src/event/ngx_event_openssl.c:578–645` |
| `nginx/ngx_http_proxy_module/proxy_ssl_certificate_key` | 760–765 | `src/http/ngx_http_script.c:279–313` | `src/http/modules/ngx_http_proxy_module.c:5014–5043`；`src/http/ngx_http_upstream.c:1952–1988`；`src/event/ngx_event_openssl.c:738–873` |
| `nginx/ngx_http_proxy_module/proxy_ssl_password_file` | 767–772 | `src/http/modules/ngx_http_proxy_module.c:4866–4885` | `src/event/ngx_event_openssl.c:1199–1325`；`src/event/ngx_event_openssl.c:818–855`；`src/http/modules/ngx_http_proxy_module.c:5022–5043` |
| `nginx/ngx_http_proxy_module/proxy_ssl_conf_command` | 774–779 | `src/core/ngx_conf_file.c:1129–1163` | `src/http/modules/ngx_http_proxy_module.c:4922–4929`；`src/http/modules/ngx_http_proxy_module.c:5061–5077`；`src/event/ngx_event_openssl.c:1596–1664` |

## 补丁核对与实际验证

按 `analysis/NGINX_PATCH_AUDIT.json` 的有效顺序在 mkdtemp 中 git archive 解包，再调用系统 patch 回放。没有执行来源脚本。逐项核对 hunk 总数及已核 offset/fuzz，并核对47个最终文件 SHA256；全部一致。server_header 的核定版本替换也作为完整34项回放的一部分处理。

修正前 JSON 共585处来源引用，全部先按原文件有效 EOF 检查；68个 XML 节点均确认不在注释内。442处 Nginx 原始片段在补丁后逐段比较，433处保留原文，9处改变。每一步记录片段首次改变的补丁，结果如下；本轮新数量另见末节：

| 改变的来源 ID | 原始范围 | 首次改变的有效补丁 |
| --- | --- | --- |
| `proxy_request_buffering/implementation-2` | `src/http/ngx_http_upstream.c:2312–2345` | `upstream_pipelining` |
| `proxy_connect_timeout/implementation-0` | `src/http/ngx_http_upstream.c:1661–1674` | `upstream_timeout_fields` |
| `proxy_connect_timeout/implementation-1` | `src/http/ngx_http_upstream.c:1743–1763` | `upstream_timeout_fields` |
| `proxy_send_timeout/implementation-0` | `src/http/ngx_http_upstream.c:2113–2144` | `upstream_timeout_fields` |
| `proxy_send_timeout/implementation-1` | `src/http/ngx_http_upstream.c:2312–2345` | `upstream_pipelining` |
| `proxy_set_header/implementation-5` | `src/http/modules/ngx_http_proxy_module.c:877–890` | `proxy_host_port_vars` |
| `proxy_read_timeout/implementation-0` | `src/http/ngx_http_upstream.c:2173–2185` | `upstream_timeout_fields` |
| `proxy_read_timeout/implementation-1` | `src/http/ngx_http_upstream.c:3328–3340` | `upstream_timeout_fields` |
| `proxy_read_timeout/implementation-2` | `src/http/ngx_http_upstream.c:3797–3816` | `upstream_timeout_fields` |

六条标 verified_affected：

- proxy_connect_timeout、proxy_send_timeout、proxy_read_timeout：引用 `patches/nginx-1.27.1-upstream_timeout_fields.patch:1–112`，说明请求初始化复制配置值到独立字段，定时器改读请求字段。没有假称永远只读不可变 conf。
- proxy_request_buffering 与 proxy_send_timeout：引用 `patches/nginx-1.27.1-upstream_pipelining.patch:1–23`，写事件停止条件从 header_sent 改为 request_body_sent。
- proxy_set_header：引用 `patches/nginx-1.27.1-proxy_host_port_vars.patch:1–19`，相关变量去除 NOHASH；不冒充修改了默认目标计算。
- proxy_intercept_errors：即使本条所选运行片段保持原文，仍引用 `patches/nginx-1.27.1-no_error_pages.patch:1–91`，因为 error_page 配置合并和显式禁用会改变本地映射。不是只有直接改到引用片段才算语义受影响。

其余62条只对当前所列局部事实标 verified_unaffected，不声明完整代理执行链无补丁、也不把 owner 未变当作运行语义未变的唯一理由。

修正前逐条语义检查补充了请求头/正文分支、HTTP版本选择、缓存锁与范围资格来源，执行585处范围及补丁对比。配置回调均通过现有显式函数定义检查；EOF有效不等于语义片段完整，独立审核随后指出的WC-R18缺口按末节补齐。

修正前隔离 build 读取当时主基线172条，仅追加本68条，没有重复合并原27条或主57条；以下结果不能作为WC-R18–R20修正后的发布身份：

- 1017注册、240 basic、0 deep；68个 proxy 身份全部且仅对应预期集合，并逐条为 basic_verified。
- 每条有 module-owner 来源；callback、source ID、publication schema 与引用格式通过现有校验。
- 每条发布 compile_guards 与原注册 guards 完全相等。
- 临时 release 为 `1.27.1.1-e135de6ae379daeb`；只在临时 output 中产生，已 finally 删除。
- build 前后校验共享 knowledge、catalog、coverage、current，以及原 HTTP_CORE_REMAINDER 两文件 SHA256，均未变化。
- 输出 inventory_complete 沿用主既有 matrix，不由本内容块抬高范围闭合或全站完成口径。

## 未解项与待审状态

本块没有以未知功能、未定位 callback 或未核补丁影响升级 basic。补充默认/继承可独立继续核查：51项默认已核、17项仍明确 unverified；51项继承已核、1项不适用、16项仍 unverified。

默认尚未完整核定：
`proxy_pass`、`proxy_redirect`、`proxy_store`、`proxy_set_header`、`proxy_set_body`、`proxy_method`、`proxy_busy_buffers_size`、`proxy_limit_rate`、`proxy_cache`、`proxy_cache_path`、`proxy_cache_methods`、`proxy_temp_path`、`proxy_max_temp_file_size`、`proxy_temp_file_write_size`、`proxy_pass_header`、`proxy_hide_header`、`proxy_ignore_headers`。

继承尚未完整核定：
`proxy_pass`、`proxy_redirect`、`proxy_store`、`proxy_set_body`、`proxy_method`、`proxy_busy_buffers_size`、`proxy_limit_rate`、`proxy_cache`、`proxy_cache_key`、`proxy_cache_methods`、`proxy_temp_path`、`proxy_max_temp_file_size`、`proxy_temp_file_write_size`、`proxy_pass_header`、`proxy_hide_header`、`proxy_ignore_headers`。

这些 unknown 不取消条目中已有的有限事实，例如 cache_methods 运行合并强制 GET/HEAD、set_header 的已核内部默认头；也不把有限事实扩张成完整配置默认/继承契约。平台权限、TLS库实际能力、运行模块启用、性能效果、业务键设计均未部署验证。

独立审核确认63项准备通过，proxy_pass、proxy_send_lowat、proxy_headers_hash_bucket_size、proxy_read_timeout、proxy_ssl_ciphers待WC-R18–R20修正。本轮实施已完成下列差异及验证；上述5项与68项整体来源闭合仍待主和独立审核角色确认，审核通过后由主决定正式合并，不自行发布。

## WC-R18–R20最小修正与隔离验证（2026-10-12）

### 精确变化与固定来源

本轮只改5个JSON对象，其他63项逐对象保持相同；在内存中只将这5项还原，按原2空格缩进及末尾换行序列化，精确重现修正前整文件SHA256 `97999ae434c120d65d3450b9c6323e46bbfed1490db3125788b39eee30338f5b`。修正后JSON SHA256为 `8d07fae9f1ec4b46066ca9249184868d7596a96344d99f3aeeffd43ed4f38db6`。身份集合仍精确等于catalog的68项HTTP proxy，没有改变语法、配置callback、编译guard、默认/继承未知状态或6条affected/62条unaffected的划分。

| 问题 | 本轮差异 | 证据与事实绑定 |
| --- | --- | --- |
| WC-R18 / proxy_pass | implementation-1从1305–1341扩为1293–1341；implementation-2从1420–1463扩为1417–1463，保留原片段并补全分支。 | proxy模块1293–1311有变量URI、有效原始URI、规范化替换及loc_len选择；1417–1444包含变量URI实际复制、原始URI复制、替换与args追加。沿用本条limitations及patch_status的对应source_ids。 |
| WC-R18 / proxy_send_lowat | implementation-0从2122–2130扩为2121–2130。 | upstream2121确实将u->conf->send_lowat传入ngx_handle_write_event；不再只引用错误收尾。 |
| WC-R18 / proxy_ssl_ciphers | implementation-0从5007–5012调整为5005–5009。 | proxy模块5005将plcf->ssl_ciphers传入ngx_ssl_ciphers；已有openssl884–899仍保留SSL_CTX_set_cipher_list实现。 |
| WC-R18 / proxy_read_timeout | 新增implementation-4，upstream2436–2466；limitations明确区分活代码与#if 0，并将新ID绑定limitations与patch_status。 | NGX_AGAIN的活代码注册读事件后返回；2442的ngx_add_timer被#if 0禁用；成功读取只更新bytes_received和buffer.last。既有生效timer及请求级字段证据保持，不将禁用代码算作重置行为。 |
| WC-R19 / proxy_headers_hash_bucket_size | defaults.source_ids保留merge-default并加入implementation-0；不改正文或来源范围。 | 已有proxy模块3837–3853同时包含默认64及3840–3841的ngx_align/ngx_cacheline_size。 |
| WC-R20 / proxy_pass | phase由configuration改为content；新增implementation-4/core1252–1262与implementation-5/core1381–1383，另加一条阶段说明并绑定两个ID和configuration-definition；patch_status也绑定新ID。 | 原callback4114–4232中的4132安装clcf->handler=ngx_http_proxy_handler；core1381–1383复制为r->content_handler；core1252–1262在content阶段调用。其他67项phase保持原值。 |

全部原坐标均由 `git show e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928:path` 读取；文档与原发行patch分别继续使用前述固定XML/OpenResty SHA，没有读取工作树替代固定内容，也没有把补丁后坐标写入JSON。

### 本轮新增/调整片段的实际patch比较

在独立mkdtemp内用固定Git archive解包，按NGINX_PATCH_AUDIT.json的34项顺序及既有server_header版本替换调用系统patch。实际核142个hunk的数量、offset/fuzz，并逐文件核47个最终SHA256，全部相等；没有重新研究旧patch范围。

以下7段在每一项补丁后均可逐字找到，最终仍完整保留；不存在本轮新增的首次改变补丁。摘要对固定上游slice以LF连接、末尾不额外追加换行计算：

| 本轮片段 | 固定上游范围 | slice SHA256 |
| --- | --- | --- |
| proxy_pass/implementation-1 | proxy模块1293–1341 | `3c01eba6654c94de031dc0da71d01e0f88e202abfb18862c34be6add0d047abf` |
| proxy_pass/implementation-2 | proxy模块1417–1463 | `04263266e4e925adf51366ee5ffb6396126e20f0f812dcf5877d7bf0d6f19efb` |
| proxy_pass/implementation-4 | core模块1252–1262 | `ef5a25eb87ff88300898f61c94fc1b3814676491e41a491e02a1900b5fd91d3d` |
| proxy_pass/implementation-5 | core模块1381–1383 | `0d2d94d6b657ee8b5717b0eae6920d827f705c68c675d5710f4df34378a2a838` |
| proxy_send_lowat/implementation-0 | upstream2121–2130 | `e52544d1ba7a18cae9e29d2ef1de110434b55b187ae3ead6f0c6f1e80ff316ba` |
| proxy_read_timeout/implementation-4 | upstream2436–2466 | `5b8e7bd1808823b4e034e7c908c7258f6551b55d0fd0e0d2b9e17c002ee98af8` |
| proxy_ssl_ciphers/implementation-0 | proxy模块5005–5009 | `1877608cdfaa6cd202bd02f847da4bd2a740997259bd58c0aa1ea8a2a7cb876e` |

当前588处注册/callback/evidence引用均通过固定Git原文件EOF检查，事实source_ids均存在且无重复ID。445处Nginx片段中436处完整保留，9处改变仍精确为上节历史表的9项，没有扩大affected范围。这只是所列局部片段实证，不代表整条请求链没有发行改动。

### 修正后隔离build与共享状态

读取本轮实际正式基线197项、current `1.27.1.1-f8d93a840d4f0719`，在另一独立mkdtemp中复制现有site/src与冻结components/catalog，使用apply_patch创建临时配置及197＋68知识输入，调用现有build。所有output/coverage仅落在临时目录，不运行正式根build、OpenResty或来源生成器，不下载。

- 隔离candidate为 `1.27.1.1-4375cae305ce6262`：1017注册、265 basic、0 deep、8 references、inventory_complete=true；仍有752项registration_only，不宣称全站完成。
- 本68项全部且仅预期身份达到basic_verified；callback、source ID、publication schema与catalog-scope门禁通过，每项compile_guards仍与原注册完全相等。发布summary/syntax/defaults/inheritance/limitations/patch_status/related/phases逐字段等于修正后草稿。
- proxy_pass的发布详情和index均为phases=[content]，content导航不再遗漏该入口；没有机械修改其他代理参数的阶段。
- 其余949条发布详情除release_id外逐字段等于正式基线，8份reference payload保持相同；实际全1017详情/index/references通过validatePublication。
- build前后共享knowledge与正式current逐字节相同；另核catalog、components、coverage、project.config、脚本及旧内容文件的原摘要，未由本线程改写。并行期间其他角色的review/verification、项目说明及新变量草稿有变化，因此不将整个共享工作区宣称为冻结，也不回滚这些外部变化。
- 本轮永久写入仅两个指定文件；patch与build临时目录均finally清理。68项整体仍为待独立差异复核，本记录不是审核通过或正式接入结论；完成后停写交接。

