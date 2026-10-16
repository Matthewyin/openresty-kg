# B10 独立审核（nginx 全部 ngx_stream_* 模块，94 条）

结论：**初审有退回；复审 1 后仅余 1 条小问题，见文末「复审 1」。**源码按 revision `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928` 用 `git show` 读取核对；openresty 补丁取自 `source_ids` 所指固定 revision 的片段，并对 stream_ssl_preread_no_skip 用 `patch -p1` 在锁定源码上实测落点。

## 方法与范围核对

- 94 条 × 2 字段逐条核对，没有抽样：注册标志与语法参数个数逐条对照；enum/bitmask 取值表（`ssl_protocols`、`proxy_ssl_protocols`、`ssl_verify_client`、`limit_conn_log_level`）逐项对照；自定义解析函数（`listen`、`proxy_bind`、`access_log`、`log_format`、`open_log_file_cache`、`ssl_session_cache`、`limit_conn*`、`geoip_*`、`upstream server`、`resolver` 等）与语法关键字逐项对照。
- **stream 与 HTTP 同名代码**：全部 source_ids 解析出的文件均在 `src/stream/*`，或为 stream 模块实际调用的公共实现（`src/core/ngx_conf_file.c`、`ngx_inet.c`、`ngx_log.c`、`ngx_hash.c`、`ngx_resolver.c`、`src/event/ngx_event_openssl.c`、`ngx_event_udp.c`、`ngx_event_connect.c`）以及 6 个 openresty 补丁；没有任何 `src/http/*` 片段被借用（脚本核对文件清单，0 个命中）。
- 94 条 `syntax_evidence`/`summary_evidence` 的 source_ids 全部能解析；summary 均含实现类来源；`patch_status` 无 `unverified`。
- B10-EVIDENCE.md 与 B10.json 逐条一致（状态、source_ids、note 全文）；JSON 顺序与工作底稿一致。
- 新增 evidence 共 46 处登记（23 个不同片段），行号逐个核对无偏移。
- 计数口径：本批无 `unverified`，因此无“证据不足属实/可晋级”项。

## 总表

未列出的条目，syntax 与 summary 均为“通过”。

| ID（省略前缀 `nginx--ngx_stream_`） | syntax | summary | 退回原因 |
| --- | --- | --- | --- |
| core_module--listen | 通过 | 退回 | 调用链缺环：`ngx_stream_add_listen` 把 `lsopt` 交给 `ngx_stream_add_address`（ngx_stream.c:438；port 以 `lsopt->type` 分组 414-416）以及 `ngx_stream_init_listening` 取 `addr = port->addrs.elts`（924）两环均不在片段内，实施者自述第 3 点只提了 498 行分支，实际缺的是这两环。 |
| proxy_module--proxy_requests | 通过 | 退回 | “后续数据报因找不到而新建会话”缺 `ngx_lookup_udp_connection` 函数体：删除只证明 `ngx_rbtree_delete(&c->listening->rbtree, …)`，而查找读取 `ls->rbtree.root`（ngx_event_udp.c:534）不在片段内，靠函数名推断。 |
| ssl_module--ssl_verify_client | 通过 | 退回 | 1) `sscf = ngx_stream_get_module_srv_conf(...)`（ngx_stream_ssl_module.c:354）不在片段内（implementation-1 从 366 起）；2) “在 SSL 阶段”缺 `ngx_stream_ssl_init` 把 handler 挂入 NGX_STREAM_SSL_PHASE 的片段（1312-1317）。 |
| ssl_module--ssl_dhparam | 通过 | 退回 | “DHE”是 OpenSSL 对该参数的使用方式，源码只证明读取 PEM DH 参数并 `SSL_CTX_set_tmp_dh`（或 set0_tmp_dh_pkey）；与 B07 对 HTTP ssl_dhparam 的裁定一致。 |
| ssl_module--ssl_ecdh_curve | 通过 | 退回 | “ECDHE曲线”为 OpenSSL 语义；且 note“按曲线名设置”漏掉 `auto`：auto 只设 SSL_OP_SINGLE_ECDH_USE 而不设曲线（ngx_event_openssl.c ngx_ssl_ecdh_curve），旧库分支 auto 映射 prime256v1。与 B07 的 ssl_ecdh_curve 裁定一致。 |
| ssl_module--ssl_client_certificate | 通过 | 退回 | “公告可接受CA名称”是协议行为，源码只体现 `SSL_CTX_set_client_CA_list`；summary 漏掉“仅在 ssl_verify_client 不为 off（conf->verify 非 0）时装载”的条件（933-960）。与 B07 的 ssl_client_certificate 裁定一致。 |
| ssl_module--ssl_trusted_certificate | 通过 | 退回 | “客户端证书验证使用、但不向客户端公告名称”依赖 OpenSSL 对证书存储的使用与协议行为，源码只体现 `SSL_CTX_set_verify(…, ngx_ssl_verify_callback)`、`SSL_CTX_set_verify_depth`、`SSL_CTX_load_verify_locations`，且仅在 conf->verify 非 0 时调用。与 B07 的 ssl_trusted_certificate 裁定一致。 |
| ssl_preread_module--ssl_preread | 通过 | 退回 | summary_evidence.note 的补丁陈述与锁定源码不符：1.27.1 的 handler 在 `rc == NGX_OK` 时已于 192-194 行返回 `ngx_stream_ssl_preread_servername(...)`（该函数只返回 NGX_OK/NGX_ERROR），补丁只改 196-198 的兜底 `return rc;`，对成功路径不可达（`patch -p1` 用 fuzz 落在 196-198，已实测）；“令解析成功时返回 NGX_DECLINED、使后续预读处理函数不被跳过”不成立。 |
| proxy_module--proxy_ssl_protocols | 通过 | 退回 | 调用链缺环：`ngx_stream_proxy_set_ssl(cf, conf)` 的调用行（ngx_stream_proxy_module.c:2197，位于 merge 2113-2204）不在任何 source_ids 片段内，`pscf` 形参与本指令写入的配置之间缺环（与 B03 `summary-set-ssl-gate`、B05/B06 `ssl-setup-binding` 同一尺度）。 |
| proxy_module--proxy_ssl_ciphers | 通过 | 退回 | 调用链缺环：`ngx_stream_proxy_set_ssl(cf, conf)` 的调用行（ngx_stream_proxy_module.c:2197，位于 merge 2113-2204）不在任何 source_ids 片段内，`pscf` 形参与本指令写入的配置之间缺环（与 B03 `summary-set-ssl-gate`、B05/B06 `ssl-setup-binding` 同一尺度）。 |
| proxy_module--proxy_ssl_verify_depth | 通过 | 退回 | 调用链缺环：`ngx_stream_proxy_set_ssl(cf, conf)` 的调用行（ngx_stream_proxy_module.c:2197，位于 merge 2113-2204）不在任何 source_ids 片段内，`pscf` 形参与本指令写入的配置之间缺环（与 B03 `summary-set-ssl-gate`、B05/B06 `ssl-setup-binding` 同一尺度）。 |
| proxy_module--proxy_ssl_trusted_certificate | 通过 | 退回 | 调用链缺环：`ngx_stream_proxy_set_ssl(cf, conf)` 的调用行（ngx_stream_proxy_module.c:2197，位于 merge 2113-2204）不在任何 source_ids 片段内，`pscf` 形参与本指令写入的配置之间缺环（与 B03 `summary-set-ssl-gate`、B05/B06 `ssl-setup-binding` 同一尺度）。；另 summary“证书验证使用的可信CA”属 OpenSSL 语义（B07 ssl_trusted_certificate 同类裁定）。 |
| proxy_module--proxy_ssl_crl | 通过 | 退回 | 调用链缺环：`ngx_stream_proxy_set_ssl(cf, conf)` 的调用行（ngx_stream_proxy_module.c:2197，位于 merge 2113-2204）不在任何 source_ids 片段内，`pscf` 形参与本指令写入的配置之间缺环（与 B03 `summary-set-ssl-gate`、B05/B06 `ssl-setup-binding` 同一尺度）。 |
| proxy_module--proxy_ssl_certificate | 通过 | 退回 | 调用链缺环：`ngx_stream_proxy_set_ssl(cf, conf)` 的调用行（ngx_stream_proxy_module.c:2197，位于 merge 2113-2204）不在任何 source_ids 片段内，`pscf` 形参与本指令写入的配置之间缺环（与 B03 `summary-set-ssl-gate`、B05/B06 `ssl-setup-binding` 同一尺度）。；另运行期路径的调用点（`ngx_stream_proxy_ssl_init_connection` 1076-1085 调 `ngx_stream_proxy_ssl_certificate`）也未引用。 |
| proxy_module--proxy_ssl_certificate_key | 通过 | 退回 | 调用链缺环：`ngx_stream_proxy_set_ssl(cf, conf)` 的调用行（ngx_stream_proxy_module.c:2197，位于 merge 2113-2204）不在任何 source_ids 片段内，`pscf` 形参与本指令写入的配置之间缺环（与 B03 `summary-set-ssl-gate`、B05/B06 `ssl-setup-binding` 同一尺度）。；运行期调用点同上。 |
| proxy_module--proxy_ssl_password_file | 通过 | 退回 | 调用链缺环：`ngx_stream_proxy_set_ssl(cf, conf)` 的调用行（ngx_stream_proxy_module.c:2197，位于 merge 2113-2204）不在任何 source_ids 片段内，`pscf` 形参与本指令写入的配置之间缺环（与 B03 `summary-set-ssl-gate`、B05/B06 `ssl-setup-binding` 同一尺度）。 |
| proxy_module--proxy_ssl_conf_command | 通过 | 退回 | 调用链缺环：`ngx_stream_proxy_set_ssl(cf, conf)` 的调用行（ngx_stream_proxy_module.c:2197，位于 merge 2113-2204）不在任何 source_ids 片段内，`pscf` 形参与本指令写入的配置之间缺环（与 B03 `summary-set-ssl-gate`、B05/B06 `ssl-setup-binding` 同一尺度）。 |

## 退回清单（17 条，全部为 summary）

1. `nginx--ngx_stream_core_module--listen` · summary
   - 问题：调用链缺环：`ngx_stream_add_listen` 把 `lsopt` 交给 `ngx_stream_add_address`（ngx_stream.c:438；port 以 `lsopt->type` 分组 414-416）以及 `ngx_stream_init_listening` 取 `addr = port->addrs.elts`（924）两环均不在片段内，实施者自述第 3 点只提了 498 行分支，实际缺的是这两环。
   - 修正：summary source_ids 追加新增 evidence ngx_stream.c:389-438（add_listen，含 `lsopt->type != port[i].type` 与 `return ngx_stream_add_address(cf, cscf, port, lsopt)`）与 ngx_stream.c:916-925（`addr = port->addrs.elts`）；note 补一句“lsopt 经 add_listen 按 type 分组后传入 add_address，复制进 addr->opt”。

2. `nginx--ngx_stream_proxy_module--proxy_requests` · summary
   - 问题：“后续数据报因找不到而新建会话”缺 `ngx_lookup_udp_connection` 函数体：删除只证明 `ngx_rbtree_delete(&c->listening->rbtree, …)`，而查找读取 `ls->rbtree.root`（ngx_event_udp.c:534）不在片段内，靠函数名推断。
   - 修正：追加新增 evidence ngx_event_udp.c:509-540（lookup 从 `ls->rbtree.root` 起查）加入 summary source_ids，note 写明“delete 与 lookup 操作同一棵 ls->rbtree”。

3. `nginx--ngx_stream_ssl_module--ssl_verify_client` · summary
   - 问题：1) `sscf = ngx_stream_get_module_srv_conf(...)`（ngx_stream_ssl_module.c:354）不在片段内（implementation-1 从 366 起）；2) “在 SSL 阶段”缺 `ngx_stream_ssl_init` 把 handler 挂入 NGX_STREAM_SSL_PHASE 的片段（1312-1317）。
   - 修正：追加新增 evidence ngx_stream_ssl_module.c:339-366（handler 头含 354 取配置）与 1300-1318（ssl_init 挂载 SSL_PHASE）加入 summary source_ids。

4. `nginx--ngx_stream_ssl_module--ssl_dhparam` · summary
   - 问题：“DHE”是 OpenSSL 对该参数的使用方式，源码只证明读取 PEM DH 参数并 `SSL_CTX_set_tmp_dh`（或 set0_tmp_dh_pkey）；与 B07 对 HTTP ssl_dhparam 的裁定一致。
   - 修正：corrections.summary 改为：“加载PEM格式DH参数文件，并经SSL_CTX_set_tmp_dh（或新版接口SSL_CTX_set0_tmp_dh_pkey）设置到Stream TLS上下文。”reason 写“源码未体现‘用于DHE’”；文件为空时直接返回（可补半句）。

5. `nginx--ngx_stream_ssl_module--ssl_ecdh_curve` · summary
   - 问题：“ECDHE曲线”为 OpenSSL 语义；且 note“按曲线名设置”漏掉 `auto`：auto 只设 SSL_OP_SINGLE_ECDH_USE 而不设曲线（ngx_event_openssl.c ngx_ssl_ecdh_curve），旧库分支 auto 映射 prime256v1。与 B07 的 ssl_ecdh_curve 裁定一致。
   - 修正：corrections.summary 改写为：“设置Stream TLS上下文的ECDH曲线或曲线列表：SSL库支持曲线列表时，auto只启用SSL_OP_SINGLE_ECDH_USE而不额外设置曲线，其他值经SSL_CTX_set1_curves_list设置；不支持时按单个曲线名设置（auto取prime256v1）。”

6. `nginx--ngx_stream_ssl_module--ssl_client_certificate` · summary
   - 问题：“公告可接受CA名称”是协议行为，源码只体现 `SSL_CTX_set_client_CA_list`；summary 漏掉“仅在 ssl_verify_client 不为 off（conf->verify 非 0）时装载”的条件（933-960）。与 B07 的 ssl_client_certificate 裁定一致。
   - 修正：corrections.summary 改为：“指定验证客户端证书所用的CA文件（SSL_CTX_load_verify_locations），并用该文件设置SSL上下文的客户端CA名称列表（SSL_CTX_set_client_CA_list）；仅在 ssl_verify_client 不为 off 时装载。”

7. `nginx--ngx_stream_ssl_module--ssl_trusted_certificate` · summary
   - 问题：“客户端证书验证使用、但不向客户端公告名称”依赖 OpenSSL 对证书存储的使用与协议行为，源码只体现 `SSL_CTX_set_verify(…, ngx_ssl_verify_callback)`、`SSL_CTX_set_verify_depth`、`SSL_CTX_load_verify_locations`，且仅在 conf->verify 非 0 时调用。与 B07 的 ssl_trusted_certificate 裁定一致。
   - 修正：corrections.summary 改为：“用SSL_CTX_load_verify_locations加载受信CA文件，并设置验证回调与验证深度；仅在 ssl_verify_client 不为 off 时装载，不设置客户端CA名称列表。”

8. `nginx--ngx_stream_ssl_preread_module--ssl_preread` · summary
   - 问题：summary_evidence.note 的补丁陈述与锁定源码不符：1.27.1 的 handler 在 `rc == NGX_OK` 时已于 192-194 行返回 `ngx_stream_ssl_preread_servername(...)`（该函数只返回 NGX_OK/NGX_ERROR），补丁只改 196-198 的兜底 `return rc;`，对成功路径不可达（`patch -p1` 用 fuzz 落在 196-198，已实测）；“令解析成功时返回 NGX_DECLINED、使后续预读处理函数不被跳过”不成立。
   - 修正：note 删去该句，改为：“发行补丁只把 196-198 行的兜底 return 改为 `rc == NGX_OK ? NGX_DECLINED : rc`；成功路径在 192-194 先返回 servername 函数结果，补丁不改变成功分支（ngx_stream_core_preread_phase 对 NGX_OK 仍 s->phase_handler = ph->next）。”summary 正文无需改。

9. `nginx--ngx_stream_proxy_module--proxy_ssl_protocols` · summary
   - 问题：调用链缺环：`ngx_stream_proxy_set_ssl(cf, conf)` 的调用行（ngx_stream_proxy_module.c:2197，位于 merge 2113-2204）不在任何 source_ids 片段内，`pscf` 形参与本指令写入的配置之间缺环（与 B03 `summary-set-ssl-gate`、B05/B06 `ssl-setup-binding` 同一尺度）。
   - 修正：summary source_ids 追加已有来源 `merge`（ngx_stream_proxy_module.c:2113-2204，含 2160 的 ssl_enable 合并与 2197 的调用）；note 补一句“merge 在 ssl_enable 为真时以合并后的 conf 调用 set_ssl”。

10. `nginx--ngx_stream_proxy_module--proxy_ssl_ciphers` · summary
   - 问题：调用链缺环：`ngx_stream_proxy_set_ssl(cf, conf)` 的调用行（ngx_stream_proxy_module.c:2197，位于 merge 2113-2204）不在任何 source_ids 片段内，`pscf` 形参与本指令写入的配置之间缺环（与 B03 `summary-set-ssl-gate`、B05/B06 `ssl-setup-binding` 同一尺度）。
   - 修正：summary source_ids 追加已有来源 `merge`（ngx_stream_proxy_module.c:2113-2204，含 2160 的 ssl_enable 合并与 2197 的调用）；note 补一句“merge 在 ssl_enable 为真时以合并后的 conf 调用 set_ssl”。

11. `nginx--ngx_stream_proxy_module--proxy_ssl_verify_depth` · summary
   - 问题：调用链缺环：`ngx_stream_proxy_set_ssl(cf, conf)` 的调用行（ngx_stream_proxy_module.c:2197，位于 merge 2113-2204）不在任何 source_ids 片段内，`pscf` 形参与本指令写入的配置之间缺环（与 B03 `summary-set-ssl-gate`、B05/B06 `ssl-setup-binding` 同一尺度）。
   - 修正：summary source_ids 追加已有来源 `merge`（ngx_stream_proxy_module.c:2113-2204，含 2160 的 ssl_enable 合并与 2197 的调用）；note 补一句“merge 在 ssl_enable 为真时以合并后的 conf 调用 set_ssl”。

12. `nginx--ngx_stream_proxy_module--proxy_ssl_trusted_certificate` · summary
   - 问题：调用链缺环：`ngx_stream_proxy_set_ssl(cf, conf)` 的调用行（ngx_stream_proxy_module.c:2197，位于 merge 2113-2204）不在任何 source_ids 片段内，`pscf` 形参与本指令写入的配置之间缺环（与 B03 `summary-set-ssl-gate`、B05/B06 `ssl-setup-binding` 同一尺度）。；另 summary“证书验证使用的可信CA”属 OpenSSL 语义（B07 ssl_trusted_certificate 同类裁定）。
   - 修正：在追加 `merge` 的同时 corrections.summary 收窄为：“在 proxy_ssl_verify 开启时，用SSL_CTX_load_verify_locations加载受信CA文件（开启验证而该文件为空时配置报错）。”

13. `nginx--ngx_stream_proxy_module--proxy_ssl_crl` · summary
   - 问题：调用链缺环：`ngx_stream_proxy_set_ssl(cf, conf)` 的调用行（ngx_stream_proxy_module.c:2197，位于 merge 2113-2204）不在任何 source_ids 片段内，`pscf` 形参与本指令写入的配置之间缺环（与 B03 `summary-set-ssl-gate`、B05/B06 `ssl-setup-binding` 同一尺度）。
   - 修正：summary source_ids 追加已有来源 `merge`（ngx_stream_proxy_module.c:2113-2204，含 2160 的 ssl_enable 合并与 2197 的调用）；note 补一句“merge 在 ssl_enable 为真时以合并后的 conf 调用 set_ssl”。

14. `nginx--ngx_stream_proxy_module--proxy_ssl_certificate` · summary
   - 问题：调用链缺环：`ngx_stream_proxy_set_ssl(cf, conf)` 的调用行（ngx_stream_proxy_module.c:2197，位于 merge 2113-2204）不在任何 source_ids 片段内，`pscf` 形参与本指令写入的配置之间缺环（与 B03 `summary-set-ssl-gate`、B05/B06 `ssl-setup-binding` 同一尺度）。；另运行期路径的调用点（`ngx_stream_proxy_ssl_init_connection` 1076-1085 调 `ngx_stream_proxy_ssl_certificate`）也未引用。
   - 修正：除追加 `merge` 外，追加已有 `proxy-ssl-init`（1056-1110，含 1076-1085）。

15. `nginx--ngx_stream_proxy_module--proxy_ssl_certificate_key` · summary
   - 问题：调用链缺环：`ngx_stream_proxy_set_ssl(cf, conf)` 的调用行（ngx_stream_proxy_module.c:2197，位于 merge 2113-2204）不在任何 source_ids 片段内，`pscf` 形参与本指令写入的配置之间缺环（与 B03 `summary-set-ssl-gate`、B05/B06 `ssl-setup-binding` 同一尺度）。；运行期调用点同上。
   - 修正：除追加 `merge` 外，追加 `proxy-ssl-init`。

16. `nginx--ngx_stream_proxy_module--proxy_ssl_password_file` · summary
   - 问题：调用链缺环：`ngx_stream_proxy_set_ssl(cf, conf)` 的调用行（ngx_stream_proxy_module.c:2197，位于 merge 2113-2204）不在任何 source_ids 片段内，`pscf` 形参与本指令写入的配置之间缺环（与 B03 `summary-set-ssl-gate`、B05/B06 `ssl-setup-binding` 同一尺度）。
   - 修正：summary source_ids 追加已有来源 `merge`（ngx_stream_proxy_module.c:2113-2204，含 2160 的 ssl_enable 合并与 2197 的调用）；note 补一句“merge 在 ssl_enable 为真时以合并后的 conf 调用 set_ssl”。

17. `nginx--ngx_stream_proxy_module--proxy_ssl_conf_command` · summary
   - 问题：调用链缺环：`ngx_stream_proxy_set_ssl(cf, conf)` 的调用行（ngx_stream_proxy_module.c:2197，位于 merge 2113-2204）不在任何 source_ids 片段内，`pscf` 形参与本指令写入的配置之间缺环（与 B03 `summary-set-ssl-gate`、B05/B06 `ssl-setup-binding` 同一尺度）。
   - 修正：summary source_ids 追加已有来源 `merge`（ngx_stream_proxy_module.c:2113-2204，含 2160 的 ssl_enable 合并与 2197 的调用）；note 补一句“merge 在 ssl_enable 为真时以合并后的 conf 调用 set_ssl”。

## 计数

| 字段 | 通过 | 退回 | 证据不足属实 | 可晋级 |
| --- | --- | --- | --- | --- |
| syntax | 94 | 0 | 0 | 0 |
| summary | 77 | 17 | 0 | 0 |

## 对实施者 2 条 corrections 的结论

- `core_module--error_log`：`error_log file | stderr | syslog:parameter ... | memory:size [level];` 与 `ngx_log_set_log` 对 value[1] 的 stderr（576）、`memory:`（585，非 NGX_DEBUG 构建报 “built without debug support” 638-642）、`syslog:`（644）分支一致，与 B02 对 HTTP error_log 的修正同形，最小化，未引入新错误，通过。
- `log_module--access_log`：`access_log path|syslog:parameter ... format [parameters];` 换行 `access_log off;` 与 `ngx_stream_log_set_log`（off 仅限单参数 989-998；syslog: 1017-1031；缺 format 报 “log format is not specified” 1068-1075）一致；stream 版本 format 为必填，与 HTTP 的“可省略”不同，修正正确，通过。

## 对实施者自审 6 点与“请求重点复核”的逐项判定

重点复核：
1. **proxy_requests（UDP 会话绑定）**：计数（`u->requests` 初值 1、process 读取每个客户端数据报 ++，1745）、阈值判断与删除（`proxy-tf-head` 1821-1827，`ngx_delete_udp_connection` 493-505）、新建会话与 `ls->handler`（udp-new/udp-handler）均属实，summary 语义正确；缺口仅是 lookup 函数体（见退回 #2），判退回。
2. **proxy_timeout / proxy_connect_timeout（stream-lua 补丁）**：已在补丁正文逐 hunk 核对（`pctx` 初始化、connect/ssl_init 用 `ctx->connect_timeout`，process/process_connection/send_proxy_protocol 用 `ctx->timeout`），note 与补丁一致，两条通过。自审第 4 点（未展开 stream-lua 覆盖）：stream-lua v0.0.15 的 `ngx_stream_lua_ffi_balancer_set_timeouts`（balancer.c:591-640）确可在 balancer_by_lua 上下文改写 `pctx->connect_timeout/timeout`（需 `NGX_STREAM_HAVE_PROXY_TIMEOUT_FIELDS_PATCH`），也就是指令值只是每个会话的**初值**。summary 两条都没有说“恒等于配置值”，**不构成误导**；建议在 limitations 补半句“启用 stream-lua balancer 时可被 `set_timeouts` 按会话覆盖”（建议项，不计退回）。
3. **listen 调用链**：lsopt.type 默认值与 `udp` 置位（设置侧）、`ngx_parse_url` 的 unix:/inet6/inet 分流、`add_listening` 写 `ls->type`、`ngx_socket(…, ls[i].type, 0)` 均属实；缺 add_listen→add_address 与 init_listening 取 addr 两环，判退回（见 #1）。自审第 3 点所说的 498 行分支并非缺口所在。

自审 6 点：
1. **hash 不支持 backup**：源码确认 hash、random 的 flags 不含 `NGX_STREAM_UPSTREAM_BACKUP`（hash.c:665-670、random.c:469-474），仅 round_robin 默认与 least_conn（301-307）含；`not_supported` 分支在 configuration-definition 片段内。syntax 列出 `backup` 属“源码接受的集合”，syntax note 已说明由方法 flags 决定，与 B09 http upstream server 同口径，**通过**；summary 的“主备标记”未限定方法，**不构成误导但建议**在 summary 末尾补“backup 不适用于 hash、random”（建议项，不计退回）。
2. **access unix: 的 TODO**：`ngx_stream_access_unix` 中 `if (1)`（260-262）使任一 Unix 连接命中第一条 unix 规则；`unix:` 本就表示“所有 Unix-domain socket”，summary 与 syntax 均未声称按路径匹配，**不构成误导**。
3. **listen 内部去重分支**：见上，退回项另有缺环。
4. **补丁下的 timeout**：见上，**不构成误导**。
5. **proxy_ssl_certificate(_key) 语法依据**：`ngx_stream_set_complex_value_zero_slot` 编译为以零结尾的复合值，源码无 off 特殊分支，syntax `file` 与源码不矛盾，**通过**。
6. **.c 扩展名判实现类**：与判据一致，**通过**。

## 其他观察（不计退回的建议项）

- `access_log`、`listen` 的 syntax note 提到 `buffer=/flush=/gzip/if=`、`setfib=/fastopen=/backlog=`，但对应循环（log_module.c 1097-1188；core_module.c 950-1208）不在该字段 source_ids 内；因 syntax 文字只写 `[parameters]`，不构成错误，建议 note 去掉未被片段覆盖的枚举或补片段。
- `proxy_pass` syntax note 提到 `ngx_stream_upstream_add`，所引 configuration-definition（2355-2394）截断在该调用之前；同样只是 note 与片段不一致（summary 侧的 `proxy-config` 2354-2420 已含该调用）。
- `proxy_next_upstream` 的 summary_evidence 未引用已在发行补丁清单内的 `balancer-status-patch`；该补丁在 `rc >= NGX_STREAM_SPECIAL_RESPONSE` 时先结束会话，不改变 DECLINED→next_upstream 的结论，保持通过。

## `--check`

`node scripts/build.mjs --config project.config.json --check`：成功；B10 行 `syntax_verified 94 / syntax_unverified 0 / summary_verified 94 / summary_unverified 0 / entries 94`，与报告一致（全量合计当前为 syntax 830/211、summary 830/211、共 1041，其他批次无报错）。注意：summary 的 17 条退回修正后，B10 计数不变（退回项经 corrections/补片段修复，仍为 verified）。


## 复审 1（修复轮次 1）

范围：初审 17 条 summary 退回逐条复核；新增片段与 6 条新 corrections（ssl_dhparam、ssl_ecdh_curve、ssl_client_certificate、ssl_trusted_certificate、proxy_ssl_trusted_certificate、hash）按锁定 revision 取回核对。stream-lua 片段按 `v0.0.15`（revision 69f0cd76…）取回。

### 17 条判定

| # | ID（省略前缀） | 判定 | 依据 |
| --- | --- | --- | --- |
| 1 | core_module--listen | ADDRESSED | `listen-add-listen`（ngx_stream.c:389-438，含 type 分组与 438 行 `return ngx_stream_add_address(cf, cscf, port, lsopt)`）、`listen-init-listening`（916-925，含 924 `addr = port->addrs.elts`）行号属实，链条闭合 |
| 2 | proxy_module--proxy_requests | ADDRESSED | `udp-lookup-body` ngx_event_udp.c:509-540 起于函数头、含 534 `ls->rbtree.root`，与 delete 同一棵树 |
| 3 | ssl_module--ssl_verify_client | ADDRESSED | `ssl-handler-head` 339-366 含 354 取 sscf；`ssl-init-phase` 1299-1318 含 1312-1317 挂载 SSL_PHASE |
| 4 | ssl_module--ssl_dhparam | ADDRESSED | correction 与 B07 同口径，“文件名为空时不加载”对应 `file->len == 0` 返回；无新错 |
| 5 | ssl_module--ssl_ecdh_curve | ADDRESSED | auto 行为、旧库 prime256v1 分支与 ngx_ssl_ecdh_curve 一致 |
| 6 | ssl_module--ssl_client_certificate | ADDRESSED | 条件“verify 非 off 才装载”对应 933-960 |
| 7 | ssl_module--ssl_trusted_certificate | ADDRESSED | 只写源码可见的 load_verify_locations、验证回调与深度，及 verify 条件；无新错 |
| 8 | ssl_preread_module--ssl_preread | ADDRESSED | note 与实测一致：补丁只改 196-198 兜底 return，成功路径 192-194 先返回 |
| 9-17 | proxy_ssl_protocols / ciphers / verify_depth / trusted_certificate / crl / certificate / certificate_key / password_file / conf_command | ADDRESSED（9/9） | 均已含 `merge`（2113-2204，含 2160、2197 调用行）；certificate、certificate_key 另含 `proxy-ssl-init`（1056-1110，含 1076-1085） |

### 建议项采纳核对

- proxy_timeout / proxy_connect_timeout：`lua-override`（ngx_stream_lua_balancer.c 591-631，v0.0.15）行号属实，note 表述与 `set_timeouts` 一致，通过。
- hash：correction 依据的 flags（hash.c:665-670）位于该条已有来源 `configuration-definition`（638-685）内，取回内容无 `NGX_STREAM_UPSTREAM_BACKUP`，通过。

### 新发现（1 条，小）

- `proxy_module--proxy_ssl_trusted_certificate` 的 correction 文字“在 proxy_ssl_verify 开启时，用 SSL_CTX_load_verify_locations 加载受信CA文件”漏掉前置条件：`ngx_stream_proxy_set_ssl` 只在 `conf->ssl_enable`（proxy_ssl on）时被调用（merge 2197）。**修正：** 文字改为“在 proxy_ssl 与 proxy_ssl_verify 均开启时……”。其余 5 条 corrections 无此类问题。

### 其他

- 裁定 7（否定陈述）：本批没有“运行期无人读取”类陈述（“不设置 CA 名称列表”“补丁不改变成功分支”等均为对所引函数体的直接事实，已在锁定 revision 复核），无需复跑检索。
- 总表更新：summary 退回由 17 降为 **1**（proxy_ssl_trusted_certificate，仅 correction 文字），其余 93 通过；syntax 94 通过。
- `node scripts/build.mjs --config project.config.json --check` 通过；B10 行 syntax 94/0、summary 94/0。

## 复审 2（修复轮次 2）

范围：9 条 proxy_ssl_* 的前置条件与 `ngx_stream_proxy_set_ssl`、merge 源码是否一致（锁定 revision e06bdbd4…）。

核对依据：
- merge 2197 行 `if (conf->ssl_enable && ngx_stream_proxy_set_ssl(cf, conf) != NGX_OK)`：set_ssl 仅在 proxy_ssl 开启时调用。
- set_ssl 内 `ssl_protocols`（2267）、`ssl_ciphers`（2280）、证书/私钥装载（2284-2313）、`ngx_ssl_conf_commands`（2342）为无 verify 条件的无条件路径。
- `ssl_trusted_certificate` 非空检查、`ngx_ssl_trusted_certificate(…, ssl_verify_depth)`、`ngx_ssl_crl` 均位于 `if (pscf->ssl_verify)`（2316-2334）内。
- 在锁定 revision 对该文件检索 `ssl_verify_depth|ssl_crl`：运行期读取点仅 2325、2331（其余为字段声明、指令表、create/merge 默认值），因此 verify_depth、crl 确实只在 verify 开启时生效。

| ID（省略 nginx--ngx_stream_proxy_module--） | 新前置条件 | 判定 |
| --- | --- | --- |
| proxy_ssl_protocols | proxy_ssl 开启 | ADDRESSED |
| proxy_ssl_ciphers | proxy_ssl 开启 | ADDRESSED |
| proxy_ssl_certificate | proxy_ssl 开启 | ADDRESSED |
| proxy_ssl_certificate_key | proxy_ssl 开启 | ADDRESSED |
| proxy_ssl_conf_command | proxy_ssl 开启 | ADDRESSED |
| proxy_ssl_verify_depth | proxy_ssl 与 proxy_ssl_verify 均开启 | ADDRESSED |
| proxy_ssl_crl | proxy_ssl 与 proxy_ssl_verify 均开启 | ADDRESSED |
| proxy_ssl_trusted_certificate | proxy_ssl 与 proxy_ssl_verify 均开启 | ADDRESSED（复审 1 遗留项关闭） |
| proxy_ssl_password_file | 未改 | 无需改：原文字写“口令文件”，未声称装载行为，不构成误导（不计入 9 条的退回） |

总表更新：B10 summary 退回 0，syntax 94 通过、summary 94 通过；复审 1 遗留的 1 条已关闭。
