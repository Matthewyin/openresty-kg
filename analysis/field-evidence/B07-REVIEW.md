# B07 独立审核（ngx_http_ssl_module / ngx_http_v2_module / ngx_http_v3_module，51 条）

结论：**有退回**。源码按 revision `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928` 用 `git show` 读取核对。

## 总表

未列出的条目，syntax 与 summary 均为“通过”。

| ID（省略前缀 `nginx--`） | syntax | summary | 退回原因 |
| --- | --- | --- | --- |
| ssl_dhparam | 通过 | 退回 | “用于DHE”仅来自接口名，源码只证明读取 PEM DH 参数并 `SSL_CTX_set_tmp_dh` |
| ssl_ecdh_curve | 通过 | 退回 | “ECDHE”为 OpenSSL 语义（源码只有 ECDH 注释与 `SSL_OP_SINGLE_ECDH_USE`），应收窄 |
| ssl_trusted_certificate | 通过 | 退回 | “用于链验证”依赖 OpenSSL 对证书存储的使用，nginx 源码未体现 |
| ssl_ocsp | 通过 | 退回 | 调用链缺环：`ocf` 经 `SSL_CTX_set_ex_data(ssl->ctx, ngx_ssl_ocsp_index, ocf)`（stapling.c:820）才被 `ngx_ssl_ocsp_validate` 取出（870），该行不在任何 source_ids 片段内 |
| ssl_ocsp_cache | 通过 | 退回 | 同上：`ocf->shm_zone` 到验证使用点缺 `set_ex_data` 行（`ocsp-conf-assign` 仅覆盖 775-782） |
| http2_max_concurrent_pushes | 退回 | 通过 | 占位符 `number` 源码不校验 |
| http2_max_requests | 退回 | 通过 | 同上（`number`） |
| http2_max_field_size | 退回 | 通过 | 同上（`size`） |
| http2_max_header_size | 退回 | 通过 | 同上（`size`） |
| http2_recv_timeout | 退回 | 通过 | 同上（`time`） |
| http2_idle_timeout | 退回 | 通过 | 同上（`time`） |
| http2_push_preload | 退回 | 通过 | 同上（`on | off`） |
| http2_push | 退回 | 通过 | 同上（`uri | off`） |
| quic_gso | 通过 | 退回 | corrections 漏掉条件：`ngx_quic_allow_segmentation` 还要求 initial、handshake 级别无待发帧 |

其余 37 条逐字段核对通过。重点复核结论如下：

- `ssl_protocols`：`ngx_http_ssl_protocols`（ngx_http_ssl_module.c:63-71）恰为 SSLv2、SSLv3、TLSv1、TLSv1.1、TLSv1.2、TLSv1.3，与语法一致。
- `ssl_verify_client`、`ssl_ocsp`：取值表（74-88）与语法一致。`ssl_ocsp` 注册为 FLAG，`syntax-arg-check`（ngx_conf_file.c:413-443）对应无误。
- `ssl_session_cache`：解析函数（1009-1117）接受 off、none、builtin、builtin:N、shared:name:size，与语法一致。`ssl_ocsp_cache`（1121-）对 off 与 shared:name:size 的描述也一致。
- `ssl_client_certificate`、`ssl_stapling_file`、`ssl_early_data`、`http3_hq` 的 corrections：改写均有源码依据，未引入新错误。
  - `ssl_client_certificate`：ngx_event_openssl.c:903-947，且仅在 `verify` 非 0 时装载。
  - `ssl_stapling_file`：297-360，`d2i_OCSP_RESPONSE_bio`。
  - `ssl_early_data`：1567-1592 的宏分支与警告。
  - `http3_hq`：ALPN 回调 448-471、`ngx_http_v3_init` 的 `hq` 标记、`ngx_http_v3_variable` 返回 `hq`。
- `quic_*`、`http3_*` 的 5 个调用链片段（`ngx_quic_run` → `ngx_quic_handle_datagram` → `ngx_quic_handle_packet` → `ngx_quic_new_connection` → `qc->conf = conf`）行号无偏移，裁定 1 闭环。
- `ssl_certificate` 静态路径、`ssl_password_file` 的传递行（ssl_module 774-784、ngx_ssl_certificates 434-451、ngx_ssl_certificate 553-554、request.c 1056-1058）核对无误。

## 退回清单

1. **8 条废弃 http2_* 指令的 syntax**（按裁定 4）
   - 涉及 `http2_max_concurrent_pushes`、`http2_max_requests`、`http2_max_field_size`、`http2_max_header_size`、`http2_recv_timeout`、`http2_idle_timeout`、`http2_push_preload`、`http2_push`。
   - 问题：处理函数 `ngx_http_v2_obsolete`（ngx_http_v2_module.c:480-498）只输出警告并返回 OK，不读参数值；注册标志仅限参数个数（TAKE1 或 FLAG）。占位符 `number`、`size`、`time`、`on | off`、`uri | off` 没有源码依据，不能判 verified。
   - 修正：对每条加 `corrections.syntax`，把占位符改为 `value`，例如 `http2_max_requests value;`。note 写明“处理函数不解析参数值，只有参数个数受注册标志约束”。
2. **ssl_dhparam summary**
   - 修正：去掉“用于DHE密钥交换”，改为“加载PEM格式DH参数文件，并经 `SSL_CTX_set_tmp_dh` 设置到HTTP TLS上下文”。
   - 修正：同时补 corrections（含 reason）。
3. **ssl_ecdh_curve summary**
   - 修正：“ECDHE曲线或曲线列表”改为“ECDH曲线或曲线列表”，并写明 `auto` 时只启用 `SSL_OP_SINGLE_ECDH_USE`，不额外设置曲线。
   - 修正：补 corrections。
4. **ssl_trusted_certificate summary**
   - 修正：改为“用 `SSL_CTX_load_verify_locations` 加载受信CA文件，设置验证回调与验证深度；OCSP 响应验证时取该上下文的证书存储调用 `OCSP_basic_verify`”。
   - 修正：去掉“用于链验证”，补 corrections。
5. **ssl_ocsp、ssl_ocsp_cache summary**
   - 修正：把 evidence `ocsp-conf-assign` 范围改为 775-823（含 820-823 的 `SSL_CTX_set_ex_data(ssl->ctx, ngx_ssl_ocsp_index, ocf)`），仍保留 `ocf->depth`、`ocf->shm_zone` 两行。
   - 修正：两条的 summary_evidence 都引用该片段；`implementation-4` 的 870 行 `SSL_CTX_get_ex_data` 已覆盖取出端。
   - 注意：`ssl_ocsp_responder` 已因 `implementation-2`（769-827）覆盖该行而闭环，无需改。
6. **quic_gso summary 的 corrections 文字**
   - 修正：改为“在平台支持UDP分段、`gso_enabled` 开启、路径已验证、initial 与 handshake 级别无待发帧且应用级待发帧约超过 3 个满包时，改用 `ngx_quic_create_segments` 发送”，并在 reason 中同步。

## 非阻塞提示（不计退回）

- `quic_host_key` 原文“从配置文件读取”易被理解为 nginx.conf。实指是读取指令所给文件。另外源码在未配置时会用 `RAND_bytes` 生成随机密钥，可酌情补一句。
- `http3_hq` 修正文字“协商到该协议的连接按hq模式处理”不完整：`enable_hq` 开且 `enable` 关时，`ngx_http_v3_init`（122-124）不看 ALPN 直接置 `hq=1`。不算错误，可顺带补充。
- `ssl_ocsp` 的 note 中 `ocsp-conf-assign` 的行号描述需随上述片段范围更新。

## 计数

| 字段 | 通过 | 退回 |
| --- | --- | --- |
| syntax | 43 | 8 |
| summary | 45 | 6 |

（unverified 为 0，无“证据不足属实”或“可晋级”条目。）

## 构建检查

`node scripts/build.mjs --config project.config.json --check` 运行成功（B07 当前提交内容：syntax_verified 51 / summary_verified 51 / entries 51，未报错）。检查通过只表示格式与行号对得上，上述语义退回项不影响其通过。

---

## 复审 1

按 revision `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928` 重读 review-brief 裁定 1-7，并对本轮改动逐条核对。

### （1）初审 14 条退回逐条判定

| 初审退回项 | 字段 | 判定 | 说明 |
| --- | --- | --- | --- |
| http2_max_concurrent_pushes / http2_max_requests / http2_max_field_size / http2_max_header_size / http2_recv_timeout / http2_idle_timeout / http2_push_preload / http2_push（8 条） | syntax | ADDRESSED | `corrections.syntax` 均改为 `<name> value;`，引用 `obsolete-handler`（480-498，只告警、不读参数值），note 与 reason 说明按裁定 4，行号属实 |
| ssl_dhparam | summary | ADDRESSED | 去掉“DHE”，改为 PEM DH 参数 + `SSL_CTX_set_tmp_dh` / `SSL_CTX_set0_tmp_dh_pkey`，与 1408-1481 一致 |
| ssl_ecdh_curve | summary | ADDRESSED | 改为“ECDH”；auto 与旧库分支与 1485-1563 一致 |
| ssl_trusted_certificate | summary | ADDRESSED | 只陈述 `SSL_CTX_load_verify_locations`、验证回调与深度、OCSP 取证书存储，与 951-984 一致 |
| ssl_ocsp | summary | ADDRESSED | `ocsp-conf-assign` 775-823 含 820 `SSL_CTX_set_ex_data(... ocf)`；870 `get_ex_data` 在 implementation-4；新增 `ocsp-next-conf` 982-983 属实 |
| ssl_ocsp_cache | summary | ADDRESSED | 同上，另有 `ocsp-conf-fetch` 868-894（含 `ocsp->conf = ocf`），行号属实 |
| quic_gso | summary | ADDRESSED | 补全平台宏、`gso_enabled`、`path->validated`、initial/handshake 队列为空、应用级超过约 3 个满包，与 252-307 一致 |

初审 14 条全部 ADDRESSED，0 条 NOT ADDRESSED。

### （2）本轮新增片段与 corrections（17 条）核对

- 新增片段行号均属实：
  - `ocsp-conf-assign` 775-823、`ocsp-conf-fetch` 868-894、`ocsp-next-conf` 982-983。
  - `staple-attach` 238-241（`X509_set_ex_data(cert, ngx_ssl_stapling_index, staple)`）、`staple-cb` 580-613（取回 staple、`SSL_set_tlsext_status_ocsp_resp`、`ngx_ssl_stapling_update`）。
- 17 条 corrections 全部有源码依据：
  - 8 条 syntax 为 http2_* 占位符改 `value`。
  - 9 条 summary 为 ssl_client_certificate、ssl_stapling_file、ssl_early_data、http3_hq、quic_gso、ssl_dhparam、ssl_ecdh_curve、ssl_trusted_certificate、quic_host_key。
- `http3_hq` 补充的 `!enable` 时直接 `hq=1` 与 `ngx_http_v3_init` 121-124 一致。`quic_host_key` 的 `RAND_bytes` 默认密钥与 merge 253-267 一致，派生 `av_token_key` / `sr_token_key` 与 269-283 一致。均无新错误，已最小化。

### 仍未解决 / 新发现

| ID | 字段 | 问题 | 应如何修正 |
| --- | --- | --- | --- |
| ssl_stapling_file、ssl_stapling_responder、ssl_stapling_verify | summary | 新增 note 称“握手时 `ngx_ssl_certificate_status_callback` 取回 staple”，但回调注册行 `SSL_CTX_set_tlsext_status_cb(ssl->ctx, ngx_ssl_certificate_status_callback)`（stapling.c:211，在 `ngx_ssl_stapling` 195-214 内）不在这三条的任何 source_ids 片段中。裁定 1：中间环节缺行即退回。`staple-attach`（238）与 `staple-cb`（580）之间缺“回调如何挂到 SSL_CTX”这一环 | 三条补一个共享片段 `staple-cb-reg`（stapling.c:195-214，或仅 211），加入 summary 的 source_ids，并在 note 提及该片段 |

非阻塞：`ssl_ecdh_curve` 的 note 写“merge 默认 auto”，默认值宏 `NGX_DEFAULT_ECDH_CURVE`（ssl_module.c:679-680）的定义不在所引片段内。summary 与 corrections 未陈述默认值，故不计退回，建议删去该半句或补片段。

### 更新后总表（相对初审的变化）

| ID | syntax | summary | 备注 |
| --- | --- | --- | --- |
| http2_max_concurrent_pushes、http2_max_requests、http2_max_field_size、http2_max_header_size、http2_recv_timeout、http2_idle_timeout、http2_push_preload、http2_push | 通过 | 通过 | 初审退回，已解决 |
| ssl_dhparam、ssl_ecdh_curve、ssl_trusted_certificate、ssl_ocsp、ssl_ocsp_cache、quic_gso | 通过 | 通过 | 初审退回，已解决 |
| ssl_stapling_file、ssl_stapling_responder、ssl_stapling_verify | 通过 | **退回** | 新发现：缺 `SSL_CTX_set_tlsext_status_cb` 注册行 |
| 其余 | 通过 | 通过 | 同初审 |

### 计数（复审 1 后）

| 字段 | 通过 | 退回 |
| --- | --- | --- |
| syntax | 51 | 0 |
| summary | 48 | 3 |

### 构建检查

`node scripts/build.mjs --config project.config.json --check` 退出码 0，B07 为 syntax_verified 51 / summary_verified 51 / entries 51，未报错。

---

## 复审 2

| 项 | 判定 | 说明 |
| --- | --- | --- |
| ssl_stapling_file summary | ADDRESSED | 新增 `staple-cb-reg`（stapling.c:211，`SSL_CTX_set_tlsext_status_cb(ssl->ctx, ngx_ssl_certificate_status_callback)`）按 revision 核对属实，已加入 source_ids，note 已引用 |
| ssl_stapling_responder summary | ADDRESSED | 同上 |
| ssl_stapling_verify summary | ADDRESSED | 同上 |
| ssl_ecdh_curve note | ADDRESSED | 已删去“merge 默认 auto”，其余陈述与 ngx_ssl_ecdh_curve 一致 |

无新增问题。

### 更新后总表

3 条 stapling 指令 summary 由“退回”改为“通过”，其余同复审 1。

### 计数（复审 2 后）

| 字段 | 通过 | 退回 |
| --- | --- | --- |
| syntax | 51 | 0 |
| summary | 51 | 0 |

### 构建检查

`node scripts/build.mjs --config project.config.json --check` 退出码 0，B07 为 syntax_verified 51 / summary_verified 51 / entries 51。

**B07 全部通过。**
