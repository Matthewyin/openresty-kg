# B11 独立审核（nginx 全部 ngx_mail_* 模块，49 条）

结论：初审有退回（summary 7 条）；**复审 1 全部通过**，现为 syntax 49/49、summary 49/49 通过（见文末「复审 1」）。初审原文如下。源码按 revision `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`（release-1.27.1）用 `git show`/`git grep` 读取，没有使用工作树文件。

## 方法与范围核对

- 49 条 × 2 字段逐条核对，没有抽样：
  - 注册标志与语法参数个数逐条对照；
  - enum/bitmask 取值表（`imap_auth`、`pop3_auth`、`smtp_auth`、`ssl_protocols`、`ssl_verify_client`、`starttls`）逐项对照；
  - 自定义解析函数（`listen`、`error_log`/`ngx_log_set_log`、`resolver`/`ngx_resolver_create`、`ssl_session_cache`、`set_real_ip_from`、`auth_http`、`auth_http_header`、`ssl_password_file`）与语法关键字逐项对照。
- 脚本核对：275 个被引用的已有来源，`dist/.../directives/<id>.json` 的 `code` 与锁定 revision 对应行逐一一致（0 偏移）；新增 evidence 的行号逐个读取核对（`summary-init`、`summary-pem`、`summary-escape`、`summary-listen-ctx`、`summary-add-ports`、`summary-addr-ctx`、`summary-session-conf`、`summary-pop3-init` 等），内容与 EVIDENCE.md 判据一致；新增 ID 与已有来源 ID 无碰撞；全部 source_ids 可解析；49 条 summary 均含实现类来源。
- **证据取自 src/mail/ 而非 HTTP/stream**：全部片段文件只来自 `src/mail/*`、mail 实际调用的公共实现（`src/core/ngx_conf_file.c`、`ngx_log.c`、`ngx_resolver.c`、`ngx_proxy_protocol.c`、`ngx_string.c`、`src/event/ngx_event_openssl.c|.h`）以及 2 个 openresty 补丁；`src/http/*`、`src/stream/*` 命中数为 0。
- **auth_http 与 IMAP/POP3/SMTP 协议语义**：片段内可见的行为（`Auth-Status OK/WAIT`、`Auth-Server/Auth-Port`、`Auth-Method/User/Pass/Salt/Protocol/Login-Attempt/Client-IP/Client-Host`、`Auth-SSL-*`、`Auth-SMTP-Helo/From/To`、IMAP/POP3/SMTP 的 CAPABILITY/CAPA/EHLO、AUTH 状态机、STARTTLS/STLS、XCLIENT、AUTH PLAIN、PROXY 头）逐条在片段中找到；未发现超出片段的协议陈述。
- **补丁**：核对了 `NGINX_PATCH_AUDIT.json` 的 34 个补丁与 `openresty/patches/nginx-1.27.1-*.patch` 的 hunk 函数：`resolver_conf_parsing`、`safe_resolver_ipv6_option` 改 `ngx_resolver_create`（resolver 语法的 `local=` 与证据一致）；`ssl_*_cb_yield` 只改 `ngx_ssl_handshake`/`ngx_ssl_try_early_data`；`intercept_error_log`、`larger_max_error_str` 只改 `ngx_log_error_core`/错误串长度，均不涉及被引用的解析/加载函数；`socket_cloexec` 改 `ngx_event_connect_peer` 的套接字创建但不影响所述行为。
- B11-EVIDENCE.md 与 B11.json 逐条一致（状态、source_ids、note）；JSON 顺序与工作底稿一致，49 条 ID 全覆盖。

## 裁定 7 复跑（proxy）

在锁定 revision 上复跑：

```
git -C repos/nginx grep -n "enable\b" e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928 -- src/mail
git -C repos/nginx grep -n -E "(->|\.)enable\b" e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928 -- src      # 过滤含 mail 的路径
git -C repos/nginx grep -n "ngx_mail_proxy_conf_t" e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928 -- src
```

结果：`enable` 在 `src/mail` 只有 4 处命中（`ngx_mail_proxy_module.c`:16 结构体声明、49 注册偏移、1347 `pcf->enable = NGX_CONF_UNSET`、1365 `ngx_conf_merge_value(conf->enable, prev->enable, 0)`）；全 `src` 范围没有任何 mail 路径下的 `->enable`/`.enable` 读取；`ngx_mail_proxy_conf_t` 只在该文件内使用。**结论与实施者一致，否定陈述本身属实。** 但 note 只写了“revision 上 git grep 核对”，没有写出检索命令、范围与全部命中位置，不满足裁定 7 的 verified 条件，退回补写。

## 总表

未列出的条目，syntax 与 summary 均为“通过”（共 49 条 syntax 通过）。

| ID（省略前缀 `nginx--ngx_mail_`） | syntax | summary | 退回原因 |
| --- | --- | --- | --- |
| core_module--server | 通过 | 退回 | 调用链缺环：“供监听地址选择协议会话”依赖 `ls->servers = mport`、`ngx_mail_add_addrs(cf, mport, addr)` 调用（ngx_mail.c:355、368）与 init_connection 取 `addr_conf`（ngx_mail_handler.c:49-122），均不在片段内 |
| core_module--listen | 通过 | 退回 | 同上，另缺 `ngx_mail_block` 对 `ngx_mail_add_ports(cf, &ports, &listen[i])` 的调用（该片段 d340-mail-context 只在 server 条内，listen 的 source_ids 未引用） |
| proxy_module--proxy | 通过 | 退回 | 裁定 7：note 未写检索命令、范围与全部命中位置（复跑结果一致，仅补文字） |
| ssl_module--starttls | 通过 | 退回 | summary_evidence 缺指令到 `sslcf->starttls` 的链接：无注册偏移/setter（`ngx_mail_ssl_starttls`，ngx_mail_ssl_module.c:529-548）与取值表（37-42，on/only 到 `NGX_MAIL_STARTTLS_ON/ONLY`），而 summary 的 only 语义完全依赖该映射 |
| ssl_module--ssl_verify_client | 通过 | 退回 | summary note 使用 `verify != 3`（optional_no_ca）、`verify == 1`（on），名称到数值的映射表（ngx_mail_ssl_module.c:57-63）不在 summary 的 source_ids 内 |
| ssl_module--ssl_dhparam | 通过 | 退回 | “DHE密码套件所需”是 OpenSSL 对该参数的使用方式，源码只证明读取 PEM DH 参数并 `SSL_CTX_set_tmp_dh`（或 `SSL_CTX_set0_tmp_dh_pkey`）；与 B07/B10 同类裁定一致 |
| ssl_module--ssl_ecdh_curve | 通过 | 退回 | “ECDHE曲线”为 OpenSSL 语义；且 `auto` 只启用 `SSL_OP_SINGLE_ECDH_USE`、不调用 `SSL_CTX_set1_curves_list`（旧库分支才映射 prime256v1），summary 未区分；与 B07/B10 同类裁定一致 |

## 退回清单（7 条，全部为 summary）

1. `nginx--ngx_mail_core_module--server` · summary
   - 问题：“供监听地址选择协议会话”所需链条缺三环：`ls->servers = mport;`（ngx_mail.c:355）与 `ngx_mail_add_addrs(cf, mport, addr)` 调用（368，位于 optimize_servers 的 350-372，现有 implementation-4 只到 348）；`ngx_mail_init_connection` 里 `port = c->listening->servers` 与 `addr_conf = &addr[i].conf`/`&addr[0].conf`（ngx_mail_handler.c:49-122），现有 implementation-2（130-146）从 `s->srv_conf = addr_conf->ctx->srv_conf` 开始，`addr_conf` 的来源不在片段内。
   - 修正：新增 evidence ngx_mail.c:350-372，及 ngx_mail_handler.c:47-51 与 100-122（或合并成不超 60 行的两个短片段）；note 补一句“ls->servers 指向 mport，add_addrs 把 opt.ctx 赋给 conf.ctx，init_connection 经 c->listening->servers 取 addr_conf 后用其 ctx->srv_conf 作会话配置”。也可把 summary 文字收窄为“在mail块创建独立邮件服务器配置”，则无需上述片段。

2. `nginx--ngx_mail_core_module--listen` · summary
   - 问题：同上三环，另外 `ngx_mail_block` 中对 `cmcf->listen` 逐项调用 `ngx_mail_add_ports(cf, &ports, &listen[i])` 的 215-219 行（现有 d340-mail-context 67-221 已覆盖，但未列入 listen 的 source_ids）。
   - 修正：source_ids 追加 `d340-mail-context` 与上条的新增片段（ngx_mail.c:350-372；ngx_mail_handler.c:47-51、100-122）；note 补“listen[i] 经 ngx_mail_add_ports 进入 port->addrs，ls->servers 与 add_addrs 把 opt.ctx 传给 conf.ctx，init_connection 取 addr_conf”。

3. `nginx--ngx_mail_proxy_module--proxy` · summary
   - 问题：否定陈述属实（已复跑），但 note 不满足裁定 7 的格式。
   - 修正：note 写明命令与范围，例如：“`git -C repos/nginx grep -n "enable\b" e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928 -- src/mail` 全部命中：ngx_mail_proxy_module.c:16（结构体）、49（注册偏移）、1347（create_conf）、1365（merge_conf）；`-- src` 全树检索 `(->|\.)enable\b` 在 mail 路径下无命中；`ngx_mail_proxy_conf_t` 仅在该文件使用”。

4. `nginx--ngx_mail_ssl_module--starttls` · summary
   - 问题：summary_evidence.source_ids 只有 implementation-*，没有 `registration`（`offsetof(ngx_mail_ssl_conf_t, starttls)`，post=ngx_mail_starttls_state）、`configuration-definition`（`ngx_mail_ssl_starttls` 调 `ngx_conf_set_enum_slot`，529-548）和取值表 implementation-1（37-42）。
   - 修正：source_ids 追加 `registration`、`configuration-definition`、`implementation-1`（新增 evidence 非必须，这三者已是该条目的已有来源）；note 补“off/on/only 经取值表映射为 NGX_MAIL_STARTTLS_OFF/ON/ONLY，写入 sslcf->starttls”。

5. `nginx--ngx_mail_ssl_module--ssl_verify_client` · summary
   - 问题：功能 note 以 `verify != 3`、`verify == 1` 解释 optional_no_ca/on，取值表（`ngx_mail_ssl_verify[]`，ngx_mail_ssl_module.c:57-63）在 syntax_evidence 内但不在 summary_evidence 内。
   - 修正：summary source_ids 追加 `implementation-1`（取值表）；note 补“表中 off=0、on=1、optional=2、optional_no_ca=3”。

6. `nginx--ngx_mail_ssl_module--ssl_dhparam` · summary
   - 问题：“DHE密码套件所需”超出源码。
   - 修正：`corrections.summary` 改为：“加载PEM格式DH参数文件，并经SSL_CTX_set_tmp_dh（或新版接口SSL_CTX_set0_tmp_dh_pkey）设置到邮件TLS上下文；未配置时不加载。”reason 写“源码未体现‘用于DHE’；文件名为空时 ngx_ssl_dhparam 直接返回”。

7. `nginx--ngx_mail_ssl_module--ssl_ecdh_curve` · summary
   - 问题：“ECDHE曲线”为 OpenSSL 语义；note 与 summary 均未区分 `auto`（默认值）：auto 在支持曲线列表的库上只设 `SSL_OP_SINGLE_ECDH_USE`（及 `SSL_CTX_set_ecdh_auto`），不调用 `SSL_CTX_set1_curves_list`。
   - 修正：`corrections.summary` 改为：“设置邮件TLS上下文的ECDH曲线或曲线列表：SSL库支持曲线列表时，auto只启用SSL_OP_SINGLE_ECDH_USE而不额外设置曲线，其他值经SSL_CTX_set1_curves_list设置；不支持曲线列表时按单个曲线名设置（auto取prime256v1）。”

## 非阻塞提示（未计入退回）

- `ssl_client_certificate`、`ssl_trusted_certificate`（已收窄的 corrections）、`ssl_crl`、`ssl_verify_depth`、`auth_http_pass_client_cert` 的 summary 文字未写明“仅在 ssl_verify_client 不为 off / 连接已 TLS 时生效”，该条件已在 note 与片段中覆盖（merge 451-478、create_request 1177），文字上未歧义，故未退回；如要与 B10 完全对齐可在 summary 末尾补半句。
- `error_log` 的“接入监听和会话日志”依赖 `ls->ctx = cf->ctx` 与 `s->srv_conf = addr_conf->ctx->srv_conf` 才能与当前 server 对上；与 B10 对 stream error_log 的处理一致，按通过处理。若退回项 2 补齐了 listen 链，可顺手把 summary-listen-ctx、summary-session-conf 加入 error_log 的 source_ids。
- `ssl_certificate_key` 的 summary 称“PEM私钥”，片段显示还支持 `engine:`、`data:`；note 已说明，未判错。

## 3 条 corrections 复核

1. `error_log` syntax → `error_log file | stderr | syslog:parameter ... | memory:size [level];`：依据 ngx_log.c 576（stderr）、585（memory:，仅 NGX_DEBUG）、644（syslog:）逐行核对属实，补齐最小，未引入新错误。**通过。**
2. `ssl_client_certificate` summary 收窄：只保留 `SSL_CTX_load_verify_locations`、`SSL_load_client_CA_file`、`SSL_CTX_set_client_CA_list` 可见的行为，去掉 PEM/“向客户端发送”，有源码依据。**通过。**
3. `ssl_trusted_certificate` summary 收窄：与 `ngx_ssl_client_certificate` 对比，`ngx_ssl_trusted_certificate` 无 `SSL_CTX_set_client_CA_list`，属实；去掉 PEM/“公告”。**通过。**

## 计数

| 字段 | 通过 | 退回 |
| --- | --- | --- |
| syntax | 49 | 0 |
| summary | 42 | 7 |

## `--check`

`node scripts/build.mjs --config project.config.json --check`：退出码 0；B11 段 `syntax_verified 49 / syntax_unverified 0 / summary_verified 49 / summary_unverified 0 / entries 49`，与实施者报告一致（构建只校验引用可解析与行号，不判断证据是否足够）。

## 复审 1（修复轮次 1）

结论：**全部通过**。7 条退回项均 ADDRESSED，无新增问题。

### 更新后的总表（仅列初审退回项，其余条目结论不变）

| ID（省略前缀 `nginx--ngx_mail_`） | syntax | summary（复审后） |
| --- | --- | --- |
| core_module--server | 通过 | 通过（ADDRESSED） |
| core_module--listen | 通过 | 通过（ADDRESSED） |
| proxy_module--proxy | 通过 | 通过（ADDRESSED） |
| ssl_module--starttls | 通过 | 通过（ADDRESSED） |
| ssl_module--ssl_verify_client | 通过 | 通过（ADDRESSED） |
| ssl_module--ssl_dhparam | 通过 | 通过（ADDRESSED） |
| ssl_module--ssl_ecdh_curve | 通过 | 通过（ADDRESSED） |

计数：syntax 通过 49 / 退回 0；summary 通过 49 / 退回 0。

### 逐条判定

1. `core_module--server`：ADDRESSED。新增 summary-servers-bind（ngx_mail.c:350-372，含 355 `ls->servers = mport`、368 `ngx_mail_add_addrs`）、summary-conn-port（handler 47-51，含 49 `port = c->listening->servers`）、summary-conn-addr（handler 100-122，含 102/113/119 `addr_conf = &…conf`），按 revision 逐行读取属实；source_ids 已含 d340-mail-context（`ngx_mail_add_ports(cf,&ports,&listen[i])`）；note 链条与片段一致。
2. `core_module--listen`：ADDRESSED。同上三个新片段，并追加 d340-mail-context；note 链条（block→add_ports→optimize_servers→servers/add_addrs→conf.ctx→init_connection 取 addr_conf）每环有片段。
3. `proxy_module--proxy`：ADDRESSED。note 已写命令、范围、4 处全部命中与全树检索结果。
4. `ssl_module--starttls`：ADDRESSED。source_ids 已含 registration、configuration-definition（ngx_mail_ssl_starttls）、implementation-1（取值表 37-42），note 写明 off/on/only 映射。
5. `ssl_module--ssl_verify_client`：ADDRESSED。source_ids 已含 implementation-1（取值表 57-63），note 写明 0/1/2/3 映射，与 `verify != 3`、`verify == 1` 的使用一致。
6. `ssl_module--ssl_dhparam`：ADDRESSED。corrections.summary 只保留 PEM_read_bio_DHparams → SSL_CTX_set_tmp_dh / SSL_CTX_set0_tmp_dh_pkey 与“文件名为空不加载”，均在 ngx_ssl_dhparam（1407-1481）片段内。
7. `ssl_module--ssl_ecdh_curve`：ADDRESSED。corrections.summary 区分曲线列表分支（auto 只设 SSL_OP_SINGLE_ECDH_USE，其他值 SSL_CTX_set1_curves_list）与旧库单曲线分支（auto→prime256v1，SSL_CTX_set_tmp_ecdh），与 ngx_ssl_ecdh_curve（1484-1563）一致。

### 核对项

- 新片段与新 corrections：按 `e06bdbd4…` 的 `git show` 读取，行号与内容和 JSON、note 一致，新增 ID 无碰撞，片段均不超过 60 行；建议项 `ssl_client_certificate`、`ssl_trusted_certificate` 的修正文字补“仅在 ssl_verify_client 非 off 时”，与 merge 451-478 的 `if (conf->verify)` 一致，未引入新错误。
- proxy 复跑（锁定 revision）：`git grep -n "enable\b" … -- src/mail` 命中 :16、:49、:1347、:1365 共 4 处；全 `src` 树 `(->|\.)enable\b` 在 mail 路径无命中；`ngx_mail_proxy_conf_t` 仅出现在 ngx_mail_proxy_module.c。与 note 一致。
- B11-EVIDENCE.md 与 B11.json 逐条一致（状态、source_ids），0 处不一致。
- `node scripts/build.mjs --config project.config.json --check`：退出码 0；B11 段 49/0/49/0，entries 49。
- 非阻塞提示：`listen`/`server` 的链条按 IPv4 路径（`ngx_mail_add_addrs`、`addr[]`）取证；IPv6 路径（`ngx_mail_add_addrs6`、`addr6[]`）同构，未单独引用，不影响结论。
