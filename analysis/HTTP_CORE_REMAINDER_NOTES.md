# HTTP core 剩余27条：待审基础内容

## 结论与边界

2026-10-10。本块仅提交 `analysis/content/HTTP_CORE_REMAINDER_BASIC.json` 与本记录，等待主集成、Astra 逐条审核；不修改主57条、knowledge、正式 catalog、配置、构建脚本或 current。既有 registration-build helper/test/notes 继续冻结。本次没有联网下载、编译运行 OpenResty、执行来源生成器或 mirror-tarballs。

先按真实身份核差集，再逐条核功能、语法、配置回调与运行字段；没有通过零命中、槽位名称或统一文本模板将条目升级。按 research 技能采用一手固定源码及活跃官方文档；不创建嵌套 agent，不扩展到网站其他范围。

## 固定来源

- Nginx：`e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`（1.27.1）。
- OpenResty：`8c37412c31621225e7aa7e825b5b50106c9c71c4`（1.27.1.1）。
- nginx.org 文档：`e8b581903e9d41252720053311cea687a5671674`。
- 所有源文均以 `git show SHA:path` 读取；证据中的行号对应原始 Git 文件，补丁引用对应 OpenResty 原始 patch，不引用回放目录行号冒充上游坐标。
- 每条显式指定 callback 的 component/file/start_line/end_line，并提供 `module-owner` source ID。core owner 为 `src/http/ngx_http_core_module.c:800–813`；http owner 为 `src/http/ngx_http.c:105–118`。
- 文档读取时以空白替换 XML 注释非换行字符，保留行号。25条具有活跃同名节点；HTTP error_log 不借用其他模块同名节点，open_file_cache_events 的注释节点不作为官方文档证据。
- gzip_vary、gzip_http_version、gzip_proxied、gzip_disable 的 owner 是 HTTP core，活跃文档来自 `xml/en/docs/http/ngx_http_gzip_module.xml`。四条均保留目录注册中的 `NGX_HTTP_GZIP` 条件；disable_symlinks 保留 `NGX_HAVE_OPENAT`。

## 完整身份差集与读取证据

基于当前正式 catalog：上游 core 的83项加 `ngx_http_module.http`，排除 HASH_TYPES10、TRANSPORT17、RESPONSE_ACCESS16、REQUEST_BODY14 共57个完整身份；发行新增 `no_error_pages` 不进入本集合。逐个比较 component/module/name 的集合相等，确认27个唯一身份、与主57条无交集，而非只断言总数。

下表是逐条实际配置入口和运行实现读取范围；更多默认/合并、文档、发行处理及补丁证据在 JSON 中保留，各来源均显式 component。

| 完整身份 | 配置回调范围 | 运行实现/取值证据 |
| --- | --- | --- |
| `nginx/ngx_http_module/http` | `src/http/ngx_http.c:122–346` | `src/http/ngx_http.c:149–215`；`src/http/ngx_http.c:270–310` |
| `nginx/ngx_http_core_module/server` | `src/http/ngx_http_core_module.c:2895–3036` | `src/http/ngx_http_core_module.c:2910–2983`；`src/http/ngx_http_request.c:2320–2402` |
| `nginx/ngx_http_core_module/location` | `src/http/ngx_http_core_module.c:3040–3230` | `src/http/ngx_http_core_module.c:1396–1462`；`src/http/ngx_http_core_module.c:3169–3229` |
| `nginx/ngx_http_core_module/listen` | `src/http/ngx_http_core_module.c:3958–4381` | `src/http/ngx_http.c:1807–1832` |
| `nginx/ngx_http_core_module/server_name` | `src/http/ngx_http_core_module.c:4385–4482` | `src/http/ngx_http_request.c:2320–2402` |
| `nginx/ngx_http_core_module/limit_except` | `src/http/ngx_http_core_module.c:4607–4703` | `src/http/ngx_http_core_module.c:1305–1318` |
| `nginx/ngx_http_core_module/subrequest_output_buffer_size` | `src/core/ngx_conf_file.c:1198–1225` | `src/http/ngx_http_postpone_filter_module.c:181–249`；`src/http/ngx_http_core_module.c:3814–3816` |
| `nginx/ngx_http_core_module/aio` | `src/http/ngx_http_core_module.c:4707–4800` | `src/http/ngx_http_copy_filter_module.c:98–145`；`src/core/ngx_output_chain.c:559–590` |
| `nginx/ngx_http_core_module/aio_write` | `src/core/ngx_conf_file.c:1026–1062` | `src/http/ngx_http_upstream.c:3250–3279` |
| `nginx/ngx_http_core_module/read_ahead` | `src/core/ngx_conf_file.c:1198–1225` | `src/core/ngx_open_file_cache.c:915–919`；`src/os/unix/ngx_files.h:304–321`；`src/os/unix/ngx_files.c:813–830` |
| `nginx/ngx_http_core_module/directio` | `src/http/ngx_http_core_module.c:4804–4827` | `src/core/ngx_open_file_cache.c:922–930`；`src/core/ngx_output_chain.c:275–286` |
| `nginx/ngx_http_core_module/directio_alignment` | `src/core/ngx_conf_file.c:1229–1256` | `src/http/ngx_http_copy_filter_module.c:110–114`；`src/core/ngx_output_chain.c:379–418`；`src/core/ngx_output_chain.c:471–478` |
| `nginx/ngx_http_core_module/server_tokens` | `src/core/ngx_conf_file.c:1352–1385` | `src/http/ngx_http_core_module.c:124–129`；`src/http/ngx_http_header_filter_module.c:455–470`；`src/http/v2/ngx_http_v2_filter_module.c:443–464`；`src/http/v3/ngx_http_v3_filter_module.c:342–362`；`src/http/ngx_http_special_response.c:21–38`；`src/http/ngx_http_special_response.c:683–694` |
| `nginx/ngx_http_core_module/error_page` | `src/http/ngx_http_core_module.c:4831–4946` | `src/http/ngx_http_special_response.c:456–469`；`src/http/ngx_http_special_response.c:588–657` |
| `nginx/ngx_http_core_module/error_log` | `src/http/ngx_http_core_module.c:5028–5033` | `src/core/ngx_log.c:479–504`；`src/core/ngx_log.c:553–672`；`src/http/ngx_http_core_module.c:1305–1318` |
| `nginx/ngx_http_core_module/open_file_cache` | `src/http/ngx_http_core_module.c:4950–5024` | `src/core/ngx_open_file_cache.c:195–267`；`src/core/ngx_open_file_cache.c:354–364`；`src/core/ngx_open_file_cache.c:1094–1125` |
| `nginx/ngx_http_core_module/open_file_cache_valid` | `src/core/ngx_conf_file.c:1291–1318` | `src/core/ngx_open_file_cache.c:213–238` |
| `nginx/ngx_http_core_module/open_file_cache_min_uses` | `src/core/ngx_conf_file.c:1167–1194` | `src/core/ngx_open_file_cache.c:213–238`；`src/core/ngx_open_file_cache.c:1032–1066` |
| `nginx/ngx_http_core_module/open_file_cache_errors` | `src/core/ngx_conf_file.c:1026–1062` | `src/core/ngx_open_file_cache.c:240–267`；`src/core/ngx_open_file_cache.c:354–364` |
| `nginx/ngx_http_core_module/open_file_cache_events` | `src/core/ngx_conf_file.c:1026–1062` | `src/core/ngx_open_file_cache.c:948–1014`；`src/core/ngx_open_file_cache.c:1224–1253` |
| `nginx/ngx_http_core_module/resolver` | `src/http/ngx_http_core_module.c:5085–5103` | `src/core/ngx_resolver.c:213–309`；`src/http/ngx_http_upstream.c:755–785` |
| `nginx/ngx_http_core_module/resolver_timeout` | `src/core/ngx_conf_file.c:1260–1287` | `src/http/ngx_http_upstream.c:755–785`；`src/core/ngx_resolver.c:4072–4110` |
| `nginx/ngx_http_core_module/gzip_vary` | `src/core/ngx_conf_file.c:1026–1062` | `src/http/ngx_http_header_filter_module.c:404–413`；`src/http/ngx_http_header_filter_module.c:576–581` |
| `nginx/ngx_http_core_module/gzip_http_version` | `src/core/ngx_conf_file.c:1352–1385` | `src/http/ngx_http_core_module.c:155–161`；`src/http/ngx_http_core_module.c:2020–2073` |
| `nginx/ngx_http_core_module/gzip_proxied` | `src/core/ngx_conf_file.c:1389–1431` | `src/http/ngx_http_core_module.c:164–172`；`src/http/ngx_http_core_module.c:2071–2159` |
| `nginx/ngx_http_core_module/gzip_disable` | `src/http/ngx_http_core_module.c:5109–5203` | `src/http/ngx_http_core_module.c:2063–2069`；`src/http/ngx_http_core_module.c:2162–2179` |
| `nginx/ngx_http_core_module/disable_symlinks` | `src/http/ngx_http_core_module.c:5211–5297` | `src/http/ngx_http_core_module.c:2664–2710`；`src/core/ngx_open_file_cache.c:489–553`；`src/core/ngx_open_file_cache.c:690–729` |

## 关键语义与补丁核对

1. 三个配置块和 listen/server_name 分开说明：http 初始化 HTTP 模块上下文；server 建立虚拟服务器；location 建立 URI 匹配配置；listen 登记接入地址/协议，server_name 参与虚拟服务器查找。配置存在不表示端口实际开放。limit_except 是方法条件下的配置切换，不自行返回405，GET 同时排除 HEAD。
2. 内存子请求缓冲仅覆盖响应收集路径；aio_write 限定在线程 AIO 的上游临时文件写入。read_ahead 在 POSIX_FADVISE 路径不使用指定尺寸；directio 的 sendfile 行为保留 NGX_HAVE_SENDFILE_NODISKIO 例外。对齐值、线程池、平台能力均不假定为部署事实。
3. 文件缓存是描述符/文件信息而非正文缓存。valid 在访问路径决定重验证，不是后台定时扫描；min_uses 影响描述符保留及事件资格；errors 不等同关闭错误日志；events 需要 vnode 能力、有效 fd 与使用次数条件，不能宣称跨平台监听均生效。
4. server_tokens：开源枚举仅 on/off/build，不照搬商业版字符串语法。server_header.patch 改写 NGINX_VER 和 HTTP/1、HTTP/2 的无版本标识；发行脚本161–165行将 `.unknown` 替换为 `.1`，形成 openresty/1.27.1.1。builtin_error_page_footer.patch 将内建错误页无版本尾部改为 openresty。HTTP/3 on/build 使用版本宏，但 off 分支仍是字面 nginx；off 不是删除 Server 头，已有 Server 头或自定义错误页不保证使用自动生成规则。
5. error_page：no_error_pages.patch 将未设置值改为 NGX_CONF_UNSET_PTR，NULL 表示显式关闭；当前层两者任一顺序并存均冲突。当前层未设置时继承父层，显式关闭阻止继承，新建映射数组不拼接父层。上游 callback 引用由原补丁补充解释，未声称完整 callback 未变。URI、命名 location 与外部重定向分别处理；内部 URI 除 HEAD 外转 GET。
6. HTTP error_log：显式归属 ngx_http_core_module，不混入 core/stream 同名身份。intercept_error_log.patch 增加带递归保护的可选拦截处理器，在常规写入前得到消息；不据此推断用户安装了拦截器或改变目标/级别。本条不宣称整个日志链没有其他补丁影响。
7. resolver：resolver_conf_parsing.patch 的 local=on/path 是非 Windows 扩展，前者读取 /etc/resolv.conf，后者读取指定文件；local=off 只是跳过文件读取，没有其他服务器时仍会触发无 nameserver 错误。safe_resolver_ipv6_option.patch 允许无 IPv6 构建接受 ipv6=off，而 ipv6=on 报错。不声称未配置 resolver 时自动采用系统 DNS，也不引入商业版 status_zone。resolver_timeout 是解析上下文定时器，不是 HTTP 总时长。
8. gzip_proxied 由请求 Via 头识别，不等同 proxy_pass；gzip_vary 是有条件的 Vary 头控制，不是压缩总开关；gzip_http_version 只是资格条件之一；gzip_disable 区分 PCRE 正则及受编译条件限制的内建项。
9. disable_symlinks 核到 openat/fstatat 与 uid 比较，from= 是带前缀边界判断的检查起点，不能与 off 组合；不推广到绕开此打开路径的第三方实现。

## 实际隔离验证

使用 mkdtemp 创建临时副本，只在其中执行 `git archive | tar` 和系统 patch，始终 finally 清理。不执行 Nginx/OpenResty 或来源 shell 脚本。

- 按 `analysis/NGINX_PATCH_AUDIT.json` 顺序回放34项有效补丁，应用 server_header 的核定版本替换。
- 每项核对实际 hunk 数及核定的 offset/fuzz 列表；47个最终文件 SHA256 全部一致。
- 27条的注册、callback、owner、实现、文档、补丁和默认合并等共208处引用均在有效 EOF 内；不以尾部空行放宽范围。
- 其中149处上游 Nginx 引用逐段在回放结果中比较：146处保持完整原文。3处变化为 `server_tokens/implementation-4`（内建页尾）、`error_page/configuration-definition`（冲突检查）、`resolver/implementation-0`（选项扩展）；全部已有对应原补丁证据。error_log 运行拦截扩展另以原补丁明确标为 affected。其余23条只对所列局部事实标 verified_unaffected，不扩展成整个请求链不受补丁影响。
- 初次准备合并全部草稿时发现主已将57条纳入 knowledge，身份重复检查提前拒绝；重新读取基线145，仅追加本27条。第一次临时 build 的 site 符号链接触发 Node cp 的目录类型检查，临时目录已清理；改为临时目录实际副本后完整 build 成功，没有改产品代码。
- 最终隔离 build：1017注册、172 basic、0 deep；新增27条均为 basic_verified，均存在显式 module-owner 来源，通过现有 publication/schema/source ID/callback 校验。临时 release 为 `1.27.1.1-42e772f85f1511da`，仅属隔离候选，已随临时目录清理。
- build 前后核对 `knowledge/directives.json`、`analysis/directives/catalog.json`、`analysis/coverage.json`、`dist/knowledge/index.json` 的 SHA256，均未变化。本块未运行正式 inventory/build，也未写 current。隔离输出的 inventory_complete 沿用主既有 matrix，不由本内容块提高范围闭合口径。

## 尚未核实与交接

默认值/继承只在已核合并代码能支撑时标 verified：server_tokens、open_file_cache 五项、resolver_timeout、gzip_vary/http_version/proxied 共10项；error_page 的发行版继承单独核实，http 同名块继承为不适用。其他默认/完整合并规则保持 unverified，而非填入猜测数值。这些是补充事实缺口，不隐藏功能、callback 或补丁的未完成项。

未编译、不证明真实环境模块启用、文件系统对齐要求或性能收益。当前没有阻塞这27条基础说明的未解证据矛盾；内容须待 Astra 逐条审核通过后由主合并。本次仅这27条待审输入就绪，不改变其他注册项的内容完成状态，也不认定全站完成。已停写本块，等待审核差异。

