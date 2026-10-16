# 部门样例四项 HTTP 事实证据

日期：2026-10-13。对应 `SAMPLE_PRIORITY_PLAN.md` 第一项；实施写集合仅 `knowledge/directives.json`、`test/sample-facts.test.mjs` 和本文。

## 深度交互：结论与边界

主线程审核收尾补充：实施原6项定向通过后，独立审核要求直接核对实际发布的新证据，已在 `test/sample-facts.test.mjs` 增加第7项，比较实际sources完整集合及固定revision原文，并拒绝错误新片段和额外未授权证据。最后10项相关定向检查通过；实施记录的6项计数保留为当时结果，不冒称实施角色执行了后补测试。主线程全量121项属于新增第7项之前，详见 `SAMPLE_PRIORITY_VERIFICATION.md`。

本轮只补四个既有 HTTP 身份的默认值与继承事实，不改变 summary、syntax、limitations、mechanism、评级或构建逻辑。`set` 是请求期赋值，不宜用普通配置字段的默认值和逐项继承模型描述；因此其 defaults 为有证据的 not_applicable，inheritance 按 rewrite codes 的实际边界记 verified。其他三项 defaults 与 inheritance 为 verified；保留原 `proxy_set_header` inheritance 正文和 source_ids。

这些是锁定源码结论，不是现场配置有效性判断，也不是运行时 deep 晋级。未读取、复制或提交原始部门配置；不执行构建，交由主线程统一构建与验收。

## 直接执行：锁定版本与契约

本轮通过 `git rev-parse HEAD` 和 `git status --short` 核对：

| 来源 | 固定版本 | revision |
| --- | --- | --- |
| repos/nginx | release-1.27.1 / 1.27.1 | e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928 |
| repos/nginx-docs | 2024-08-15 文档快照 | e8b581903e9d41252720053311cea687a5671674 |
| openresty | v1.27.1.1 | 8c37412c31621225e7aa7e825b5b50106c9c71c4 |

Nginx 与文档工作树干净；OpenResty 只有已有未跟踪 tags，不用于事实证据。构建器从固定 revision 的 `git show` 生成片段，新增 evidence 仍沿用 component/file/start_line/end_line 契约；source_ids 指向真实片段，不写补丁后行号。

契约核查位置为 `scripts/build.mjs` 的 `prepareKnowledgeFacts`、`validatePublication` 和片段生成逻辑，以及 `src/query/knowledge.mjs` 的 `validateDetail`。测试只在内存中将四项事实覆盖到既有发布详情，再调用真实校验器；不调用 build、不写 dist。verified 和 not_applicable 都必须有非空正文与证据；事实引用缺失的反例必须被拒绝。基础数量和 deep 数量不手改。

## 1. HTTP resolver

身份：`nginx/ngx_http_core_module/resolver`。

默认值 verified：没有默认 DNS 服务器，合并产生的 dummy resolver 没有 nameserver，不能解释成自动读取系统 DNS。显式服务器默认端口53；IPv4 默认开启，IPv6 受 `NGX_HAVE_INET6` 限制；成功答案在未设 valid 时按响应 TTL 缓存。非 Windows 的 `local=on|path` 需显式配置。

继承 verified：仅在子级 `conf->resolver == NULL` 时引用父级对象；父级也为空时创建 dummy。显式子级配置创建新对象，不拼接父级 nameserver 列表。

| source_id | 锁定文件与行号 | 证明内容 |
| --- | --- | --- |
| configuration-definition | nginx:src/http/ngx_http_core_module.c:5085–5103 | 显式创建解析器、重复配置检查 |
| resolver-create | nginx:src/core/ngx_resolver.c:132–211 | 零初始化、IPv4/IPv6 开关、valid=0、仅 n 非零初始化服务器数组 |
| resolver-merge | nginx:src/http/ngx_http_core_module.c:3858–3874 | 空子级引用父级；空父级创建 dummy |
| resolver-empty | nginx:src/core/ngx_resolver.c:418–420 | 无服务器的 DNS 解析返回 NGX_NO_RESOLVER |
| implementation-0 | nginx:src/core/ngx_resolver.c:213–309 | 显式选项、default_port=53、无 nameserver 配置报错 |
| resolver-positive-ttl | nginx:src/core/ngx_resolver.c:2443–2448 | 成功地址答案 valid 或 TTL 分支；不声称全部错误缓存也同此规则 |
| official-doc | nginx-docs:xml/en/docs/http/ngx_http_core_module.xml:2184–2250 | 空 default、端口53、双栈与 TTL；文档商业 status_zone 不套用开源源码 |
| resolver-local-patch | openresty:patches/nginx-1.27.1-resolver_conf_parsing.patch:1–263 | local 读取是 names[i] 的显式分支，非隐式系统 DNS |
| resolver-ipv6-patch | openresty:patches/nginx-1.27.1-safe_resolver_ipv6_option.patch:1–60 | 无 IPv6 构建时选项检查边界 |

## 2. HTTP proxy_pass

身份：`nginx/ngx_http_proxy_module/proxy_pass`。

默认值 verified：新对象没有默认 URL、上游或变量 URL 脚本；显式回调安装代理入口。不能据此推断未配置的匿名子块没有目标。

继承 verified：只有 noname 且子级静态目标和变量脚本都为空时，复制父级目标、location、vars、脚本和条件编译的 ssl 标记。if in location、limit_except 产生 noname；普通嵌套 location 不走该分支。limit_except 在无 handler 但已有目标时安装代理入口，子级显式目标则不被父级覆盖。

| source_id | 锁定文件与行号 | 证明内容 |
| --- | --- | --- |
| proxy-target-create | nginx:src/http/modules/ngx_http_proxy_module.c:3314–3354 | 配置对象零初始化，无默认目标 |
| configuration-definition | nginx:src/http/modules/ngx_http_proxy_module.c:4114–4232 | 显式静态/变量目标、handler 安装、重复配置检查 |
| proxy-target-merge | nginx:src/http/modules/ngx_http_proxy_module.c:3854–3875 | noname、双空目标条件、SSL 条件、limit_except handler |
| proxy-if-noname | nginx:src/http/modules/ngx_http_rewrite_module.c:579–588 | if 创建的子配置 noname 标记 |
| proxy-limit-except-noname | nginx:src/http/ngx_http_core_module.c:4680–4693 | limit_except 子配置 noname 与 lmt_excpt 标记 |
| official-doc | nginx-docs:xml/en/docs/http/ngx_http_proxy_module.xml:1425–1551 | 无默认 URL、location/if in location/limit_except；条件合并以源码为准 |

## 3. HTTP set

身份：`nginx/ngx_http_rewrite_module/set`。

默认值 not_applicable：没有通用默认 set 或默认变量值。回调编译表达式与写变量/setter 的指令；未初始化读取返回 null 的分支，仅限使用 rewrite getter 的变量，不推广到所有内置变量。

继承 verified：create 将 codes 置空；merge 不复制父 codes，不按变量名继承或合并。子 codes 为空或与父同指针时返回，独立序列补终止标记。if 内指令编译到父序列，解析结束清空 if 子配置 codes。server 与 location 分阶段执行，前阶段写入请求变量可被后阶段读取；这不是子级继承了父级 set 指令，也不能简单宣称“无继承”。

| source_id | 锁定文件与行号 | 证明内容 |
| --- | --- | --- |
| configuration-definition | nginx:src/http/modules/ngx_http_rewrite_module.c:897–962 | 变量注册、表达式编译、setter/索引赋值两路 |
| rewrite-create-merge | nginx:src/http/modules/ngx_http_rewrite_module.c:221–268 | codes 初始为空、NULL/同指针返回、不复制父 codes、结束标记 |
| rewrite-if-codes | nginx:src/http/modules/ngx_http_rewrite_module.c:599–643 | if 与父块共享编译序列；解析结束子 codes 清空 |
| rewrite-phase-registration | nginx:src/http/modules/ngx_http_rewrite_module.c:271–293 | server_rewrite 与 rewrite 的 handler 注册 |
| implementation-1 | nginx:src/http/modules/ngx_http_rewrite_module.c:136–222 | 读取当前 codes、无 codes 跳过、未初始化 getter 限定行为 |
| implementation-2 | nginx:src/http/ngx_http_script.c:1813–1863 | 请求变量写入、setter 执行 |
| official-doc | nginx-docs:xml/en/docs/http/ngx_http_rewrite_module.xml:379–391 | set 语法和空 default，仅交叉印证，不单独证明不适用 |
| rewrite-order-doc | nginx-docs:xml/en/docs/http/ngx_http_rewrite_module.xml:23–60 | server 序列先执行，再选择并执行 location 序列 |

## 4. HTTP proxy_set_header

身份：`nginx/ngx_http_proxy_module/proxy_set_header`。

默认值 verified：Host=$proxy_host、Connection=close；完整内部表还包含正文长度、chunked 和空值屏蔽的 hop-by-hop 字段。显式字段按不区分大小写的名称挡住同名默认值，显式空值也不被默认恢复。缓存构建且启用代理缓存时另用缓存默认表，包含缓存重验证值及条件/范围字段屏蔽，不能把文档的“两项默认重定义”解释为内部只有两项。

原 inheritance 保持 verified：当前层无显式头列表时整组继承；当前层有定义时不逐项并入父数组，内部默认表再补缺失项。复核后原文和 source_ids 不改。

| source_id | 锁定文件与行号 | 证明内容 |
| --- | --- | --- |
| implementation-0 | nginx:src/http/modules/ngx_http_proxy_module.c:819–832 | 常规默认头完整数组 |
| implementation-1 / implementation-2 | nginx:src/http/modules/ngx_http_proxy_module.c:1370–1395 / 1470–1519 | 空结果不发送及实际请求头输出 |
| implementation-3 | nginx:src/http/modules/ngx_http_proxy_module.c:3985–4034 | 先显式列表，后按不区分大小写名称补默认值 |
| implementation-4 | nginx:src/http/modules/ngx_http_proxy_module.c:3901–3917 | 头列表整组继承和常规初始化 |
| proxy-cache-default-headers | nginx:src/http/modules/ngx_http_proxy_module.c:848–869 | NGX_HTTP_CACHE 默认表、重验证与空字段 |
| proxy-cache-headers-init | nginx:src/http/modules/ngx_http_proxy_module.c:3916–3926 | 构建支持且 upstream.cache 启用才初始化缓存表 |
| official-doc | nginx-docs:xml/en/docs/http/ngx_http_proxy_module.xml:1842–1907 | 两项默认重定义、整组继承、空头及缓存边界 |
| proxy-host-port-vars | openresty:patches/nginx-1.27.1-proxy_host_port_vars.patch:1–19 | 变量 NOHASH 补丁，不改变默认头数组与合并规则 |

## 补丁与验收记录

本轮执行 `node analysis/verify-nginx-patches.mjs --config project.config.json --audit analysis/NGINX_PATCH_AUDIT.json`，34 项补丁实际回放通过，既定偏移/模糊匹配和47个最终文件摘要全部匹配，脚本自动清理隔离目录。新增 Nginx 证据 id 均加入对应 patch_status.source_ids；保持 resolver/proxy_set_header 的 affected 和 set/proxy_pass 的 unaffected 状态。

补丁定位：resolver 受 resolver_conf_parsing 与 safe_resolver_ipv6_option 影响；core 文件的其他修改不在新增 merge 行段。proxy 模块唯一发行补丁为 proxy_host_port_vars，修改变量 flags，新增 create/merge/headers 段不变；rewrite 模块不在发行补丁目标中。公开证据使用上游坐标与原补丁坐标。

本轮执行 `node --test test/sample-facts.test.mjs`，新增6项测试全部通过，失败/跳过均为0。覆盖固定 revision 与片段范围、四项源码语义边界、保留 proxy_set_header 原继承事实、不适用状态的正文与证据、真实 validatePublication 内存校验及悬空 source_id 拒绝。内存详情覆盖后仍为1041 basic、0 deep；这不是新构建已发布的证明。

精确差异限四个 HTTP 身份的 defaults、inheritance、evidence 和 patch_status.source_ids；proxy_set_header 的 inheritance 完全不变。未改 summary、syntax、limitations、mechanism、availability 或评级字段；未修改其他同名 stream/mail 身份，也未修改 build/site/parser/README。

知识与测试已冻结，可供主线程统一全量测试。独立内容审核、统一构建及新发布1041 basic/0 deep验收由主线程负责，本实施角色未构建或操作 UI。补丁回放隔离目录已自动清理，没有遗留本轮临时文件。
