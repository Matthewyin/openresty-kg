# P13 Mail SSL完整19项实施与隔离验证

## R38继承句修正（2026-10-13，主执行）

仅更正ssl_session_cache及ssl_session_tickets的inheritance.text：本层已有值保持本层，本层未设继承父值，父子均未设才取none/on；TLS启用及共享区独立继承边界保留。主读取固定mail ssl merge488–504及ngx_conf_merge_value宏205–208核实，引用无变化，其余17对象保持。新JSON SHA256 9c0bbd1ff9cc025260b0da7fe01792250209a07d629fb7c01b98def857a911db，交独立差异复核。

## 冻结候审与写集

ngx_mail_ssl_module完整19身份，JSON SHA-256：a09cdf5f5f79238d69f3a7773e01f7caf5511327b3f2afc014718eb6681ff3ad。仅新增analysis/content/MAIL_SSL_BASIC.json与本记录，P13三域HTTP28+Stream21+Mail19共68完整准备，等待独立审核，不合入正式knowledge/current。Mail非TLS31的JSON仍为7d735bb29aa78ea172022ccc614e3eff5038d328a55e8410b95bcbdfca09916b，未修改；其他角色的R31/R32及代理SNI修订不恢复。

固定Nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928（1.27.1）、nginx-docs e8b581903e9d41252720053311cea687a5671674、OpenResty 8c37412c31621225e7aa7e825b5b50106c9c71c4（1.27.1.1）；本地git show固定来源，不下载。19活跃官方节点来自xml/en/docs/mail/ngx_mail_ssl_module.xml。245处显式引用：195 Nginx、19 docs、31 OpenResty，真实EOF（末尾换行不虚增）、配置callback完整定义及逐事实source_ids已核。

## 本域入口及重要区别

M=src/mail/ngx_mail_ssl_module.c，H=src/mail/ngx_mail_handler.c，O=src/event/ngx_event_openssl.c。M209–233实际绑定create/merge，不是HTTP phase handler；每项phase=configuration表示配置入口。H272–384为隐式TLS与STARTTLS共同握手使用链，ngx_ssl_create_connection不带HTTP的buffer标志；握手等待沿mail core timeout，非Stream专有超时。

- M376–420只在listen ... ssl或starttls非off时创建SSL上下文；否则merge提前返回。M488–519的cache/ticket默认与继承位于此检查之后，文案明确TLS启用条件，未启用不宣称SSL库已设置。
- starttls由M529–548真实callback调用enum setter，M37–42定义off/on/only。POP3使用STLS，IMAP/SMTP用STARTTLS；三协议均要求未存在c->ssl，清空输入缓冲并挂H305的handler。SMTP还清除升级前HELO、MAIL、RCPT；握手后重新init_protocol。
- only在IMAP LOGIN/AUTHENTICATE、POP3 USER/APOP/AUTH和SMTP AUTH入口调用H503–518检查；能力应答随模式变化。固定SMTP handler739–785的auth none MAIL分支没有该检查，不能把only说成禁止所有明文命令或所有auth none流程。
- M393–449核证书/key存在及数量后静态调用ngx_ssl_certificates；本域没有HTTP/Stream的变量证书编译或动态证书callback。PEM链主证书在前、中间证书在后，私钥支持file/data/engine的共享分支。证书/key数组独立整组继承，按序配对。M551–571配置期读取口令，非每次握手重读。
- 协议默认固定为TLSv1/TLSv1.1/TLSv1.2/TLSv1.3；本域没有HTTP/Stream的SNI server切换安装。M437调用SSL_CTX_set_cipher_list，不把ssl_ciphers误作TLS1.3专用ciphersuites；曲线/DH分别绑定M480–486共享真实实现。
- M451–478将client CA、trusted CA与CRL加载全部放在verify非零条件；on/optional仍要求非空client_certificate，不能仅trusted_certificate替代该条件。client CA设置客户端可见CA名称列表，trusted CA只加载信任不公告。
- H352–449在握手成功后验证客户端证书，失败删除缓存session并发送本协议cert_error/no_cert后结束。optional_no_ca仅豁免共享宏列出的五种CA错误，不是无条件接受。认证HTTP模块1177–1226、1393–1456只在TLS且verify非零时组证书验证详情；原证书还受pass_client_cert条件，失败连接不保证走到认证HTTP。
- M574–683完整cache callback核参数、共享区至少8页、mail SSL tag及init绑定，M236的MAIL参与session上下文。M488–493对builtin与共享区独立继承，本层off不清空父共享指针。none不存储session但保持可复用表示；builtin未给大小沿用SSL库，不将库默认数字冒充Nginx显式赋值。
- 票据key实际严格48/80字节，首key加密，解密按名称，默认共享key及轮换依共享缓存与库支持；不支持callback时配置文件警告忽略。session_timeout由SSL_CTX_set_timeout使用，不是握手/邮件读写超时。
- ssl_conf_command注册post M66–67真实指向M686–694的平台支持检查，M521在常规设置后调用共享SSL_CONF链；数组只在本层没有时整组继承。

## 完整19项证据索引

注册行均在M，merge-default、官方节点及逐事实source_ids见JSON。

| starttls | 72–77 | ngx_mail_ssl_starttls src/mail/ngx_mail_ssl_module.c:529–548 | src/mail/ngx_mail_ssl_module.c:376–420；src/mail/ngx_mail_ssl_module.c:37–42；src/mail/ngx_mail_core_module.c:450–468；src/mail/ngx_mail_handler.c:272–384；src/mail/ngx_mail_handler.c:500–518；src/mail/ngx_mail_imap_handler.c:303–312；src/mail/ngx_mail_imap_handler.c:350–360；src/mail/ngx_mail_imap_handler.c:426–477；src/mail/ngx_mail_pop3_handler.c:309–318；src/mail/ngx_mail_pop3_handler.c:369–420；src/mail/ngx_mail_pop3_handler.c:423–433；src/mail/ngx_mail_pop3_handler.c:473–482；src/mail/ngx_mail_smtp_handler.c:625–667；src/mail/ngx_mail_smtp_handler.c:739–785；src/mail/ngx_mail_smtp_handler.c:839–869；src/event/ngx_event_openssl.c:1881–1942 |
| ssl_certificate | 79–84 | ngx_conf_set_str_array_slot src/core/ngx_conf_file.c:1093–1125 | src/mail/ngx_mail_ssl_module.c:376–420；src/mail/ngx_mail_ssl_module.c:393–449；src/event/ngx_event_openssl.c:434–553；src/event/ngx_event_openssl.c:648–735；src/mail/ngx_mail_handler.c:323–349；src/event/ngx_event_openssl.c:1881–1942 |
| ssl_certificate_key | 86–91 | ngx_conf_set_str_array_slot src/core/ngx_conf_file.c:1093–1125 | src/mail/ngx_mail_ssl_module.c:376–420；src/mail/ngx_mail_ssl_module.c:393–449；src/event/ngx_event_openssl.c:434–453；src/event/ngx_event_openssl.c:553–574；src/event/ngx_event_openssl.c:738–852；src/event/ngx_event_openssl.c:1881–1942 |
| ssl_password_file | 93–98 | ngx_mail_ssl_password_file src/mail/ngx_mail_ssl_module.c:551–571 | src/mail/ngx_mail_ssl_module.c:376–420；src/mail/ngx_mail_ssl_module.c:444–449；src/event/ngx_event_openssl.c:1199–1325；src/event/ngx_event_openssl.c:819–852 |
| ssl_dhparam | 100–105 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | src/mail/ngx_mail_ssl_module.c:376–420；src/mail/ngx_mail_ssl_module.c:480–482；src/event/ngx_event_openssl.c:1407–1481 |
| ssl_ecdh_curve | 107–112 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | src/mail/ngx_mail_ssl_module.c:376–420；src/mail/ngx_mail_ssl_module.c:13–14；src/mail/ngx_mail_ssl_module.c:484–486；src/event/ngx_event_openssl.c:1484–1563 |
| ssl_protocols | 114–119 | ngx_conf_set_bitmask_slot src/core/ngx_conf_file.c:1389–1431 | src/mail/ngx_mail_ssl_module.c:376–420；src/mail/ngx_mail_ssl_module.c:46–54；src/mail/ngx_mail_ssl_module.c:420–449；src/mail/ngx_mail_handler.c:130–137；src/mail/ngx_mail_handler.c:272–349；src/event/ngx_event_openssl.c:296–399 |
| ssl_ciphers | 121–126 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | src/mail/ngx_mail_ssl_module.c:376–420；src/mail/ngx_mail_ssl_module.c:13–13；src/mail/ngx_mail_ssl_module.c:437–442；src/mail/ngx_mail_ssl_module.c:521–523；src/event/ngx_event_openssl.c:884–899 |
| ssl_prefer_server_ciphers | 128–133 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | src/mail/ngx_mail_ssl_module.c:376–420；src/mail/ngx_mail_ssl_module.c:437–442；src/mail/ngx_mail_ssl_module.c:521–523；src/event/ngx_event_openssl.c:884–899 |
| ssl_session_cache | 135–140 | ngx_mail_ssl_session_cache src/mail/ngx_mail_ssl_module.c:574–683 | src/mail/ngx_mail_ssl_module.c:376–420；src/mail/ngx_mail_ssl_module.c:236–236；src/mail/ngx_mail_ssl_module.c:488–501；src/event/ngx_event_openssl.c:3713–3784；src/event/ngx_event_openssl.c:4395–4461；src/event/ngx_event_openssl.c:1881–1942 |
| ssl_session_tickets | 142–147 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | src/mail/ngx_mail_ssl_module.c:376–420；src/mail/ngx_mail_ssl_module.c:503–519 |
| ssl_session_ticket_key | 149–154 | ngx_conf_set_str_array_slot src/core/ngx_conf_file.c:1093–1125 | src/mail/ngx_mail_ssl_module.c:376–420；src/mail/ngx_mail_ssl_module.c:512–519；src/event/ngx_event_openssl.c:4395–4553；src/event/ngx_event_openssl.c:4570–4644；src/event/ngx_event_openssl.c:4695–4821；src/event/ngx_event_openssl.c:4833–4846 |
| ssl_session_timeout | 156–161 | ngx_conf_set_sec_slot src/core/ngx_conf_file.c:1290–1318 | src/mail/ngx_mail_ssl_module.c:376–420；src/mail/ngx_mail_ssl_module.c:495–501；src/event/ngx_event_openssl.c:3713–3728；src/event/ngx_event_openssl.c:4725–4729；src/mail/ngx_mail_handler.c:334–345 |
| ssl_verify_client | 163–168 | ngx_conf_set_enum_slot src/core/ngx_conf_file.c:1351–1385 | src/mail/ngx_mail_ssl_module.c:376–420；src/mail/ngx_mail_ssl_module.c:57–63；src/mail/ngx_mail_ssl_module.c:451–478；src/event/ngx_event_openssl.c:903–947；src/mail/ngx_mail_handler.c:352–449；src/event/ngx_event_openssl.h:254–259；src/mail/ngx_mail_auth_http_module.c:1177–1226；src/mail/ngx_mail_auth_http_module.c:1393–1456 |
| ssl_verify_depth | 170–175 | ngx_conf_set_num_slot src/core/ngx_conf_file.c:1167–1194 | src/mail/ngx_mail_ssl_module.c:376–420；src/mail/ngx_mail_ssl_module.c:451–478；src/event/ngx_event_openssl.c:903–914；src/event/ngx_event_openssl.c:950–961 |
| ssl_client_certificate | 177–182 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | src/mail/ngx_mail_ssl_module.c:376–420；src/mail/ngx_mail_ssl_module.c:451–478；src/event/ngx_event_openssl.c:903–947 |
| ssl_trusted_certificate | 184–189 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | src/mail/ngx_mail_ssl_module.c:376–420；src/mail/ngx_mail_ssl_module.c:451–478；src/event/ngx_event_openssl.c:950–984 |
| ssl_crl | 191–196 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | src/mail/ngx_mail_ssl_module.c:376–420；src/mail/ngx_mail_ssl_module.c:451–478；src/event/ngx_event_openssl.c:987–1029；src/mail/ngx_mail_handler.c:387–449 |
| ssl_conf_command | 198–203 | ngx_conf_set_keyval_slot src/core/ngx_conf_file.c:1129–1163 | src/mail/ngx_mail_ssl_module.c:376–420；src/mail/ngx_mail_ssl_module.c:66–67；src/mail/ngx_mail_ssl_module.c:686–694；src/mail/ngx_mail_ssl_module.c:515–525；src/event/ngx_event_openssl.c:1595–1664 |

## 实际发行patch

mkdtemp内git archive固定Nginx，按既有审计实际应用34patch、142hunk和server_header替换；offset/fuzz逐项一致，47最终文件SHA匹配。M整文件保持，SHA 0caaf3049ba7010d75dc45b964c46c3e6230d69b03296a7d4fc452b6fd603a86。

195段Nginx来源191保持，4段均O1881–1942，首次被ssl_cert_cb_yield改变：starttls implementation-15、ssl_certificate implementation-5、ssl_certificate_key implementation-5、ssl_session_cache implementation-5。随后ssl_sess_cb_yield及ssl_client_hello_cb_yield继续扩展共享握手分支；三补丁全文绑定对应patch_status，4项verified_affected，其余15项仅明示事实verified_unaffected。宏支持的回调让出不意味着原生mail指令装入动态证书回调或运行时一定触发异步路径。

## 660现场隔离验证

基线660，1.27.1.1-d3966b115cc98f81；仅叠加本owner19，临时release 1.27.1.1-631520f4a17ba606。未把HTTP/Stream候审稿加入本次输入。调用既有build.mjs和validatePublication：1017注册、679基础、0深度、338仅注册（仅临时产物）。

19项全部basic_verified，正文/默认/继承/限制/patch/related逐项与draft相等，phase/callback symbol/guards匹配。264发布来源固定SHA、原文、真实EOF及URL锚点全部相等；其余998详情除release_id全保持，8参考对象保持。验证前后根knowledge/current字节不变，patch/build临时目录均finally清理。

## 未决

本owner19必需事实齐全，默认/继承都按固定merge注明适用条件；无运行TLS握手、证书验证、邮件或认证HTTP服务测试，不读取真实证书/私钥/口令，不上传配置。不修改shared/current/脚本/源仓库，不运行来源生成器或OpenResty。候独立审核，后续仅按指定finding最小修正。
