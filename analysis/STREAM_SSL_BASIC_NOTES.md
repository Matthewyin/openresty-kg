# P13 Stream SSL完整21项实施与隔离验证

## 冻结候审与范围

ngx_stream_ssl_module完整21身份，JSON SHA-256：226d6bde78b67405a96f273fce35ccce8d6ca7ebab97ac71a3c43e45779b5e0b。只新增analysis/content/STREAM_SSL_BASIC.json及本记录；未合入正式knowledge/current。HTTP28已独立冻结；Mail19继续。主修gRPC/HTTPProxy/StreamProxy及uWSGI草稿均不恢复。

固定Nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928、nginx-docs e8b581903e9d41252720053311cea687a5671674、OpenResty 8c37412c31621225e7aa7e825b5b50106c9c71c4。本地git show固定原文；21活跃官方节点来自xml/en/docs/stream/ngx_stream_ssl_module.xml。258处显式来源：204 Nginx、21 docs、33 OpenResty，均检查真实EOF及source_ids。没有下载、来源生成器、服务启动、实际握手或凭据读取。

## 本域事实与边界

S=src/stream/ngx_stream_ssl_module.c，O=src/event/ngx_event_openssl.c。S240–265的模块create/merge/postconfiguration与S1299–1317真实NGX_STREAM_SSL_PHASE挂接均绑定每条；phase=configuration是配置入口。S339–440只有s->ssl进入，ngx_ssl_create_connection不使用HTTP的NGX_SSL_BUFFER；握手等待用S808–809默认60s的ssl_handshake_timeout。S443–460超时/失败结束stream，会话恢复时继续core phases。

- S852–931核证书/key数量，静态加载或安装本域动态证书callback；S1011–1096编译stream复杂值，S621–670从stream session求值并用c->pool加载，不创建HTTP request。数组各自整组继承并按序配对；口令配置期读取，动态证书保留口令数组。
- S463–574验证SNI并切换s->srv_conf及SSL_CTX，拒绝握手发UNRECOGNIZED_NAME。协议最初用默认server上下文，不能保证SNI目标独立决定全部协商参数。固定默认TLSv1/TLSv1.1/TLSv1.2/TLSv1.3，实际库与宏仍限制支持。
- S933–960把client_certificate、trusted_certificate、CRL加载全部放在verify非零块；不是HTTP中trusted/CRL的无条件加载位置。S366–398在握手成功后消费验证结果与缺证书条件；optional_no_ca只豁免共享宏列出的五种错误。
- ciphers调用SSL_CTX_set_cipher_list，不等于TLS1.3专用ciphersuites；DH/curve沿本域S962–968到共享实现，库不支持分支不能推断已生效。
- session_cache完整callback S1122–1231解析off/none/builtin/shared，共享区至少8页且tag为stream SSL模块。S970–975将builtin与shm_zone分开继承；本层off不等于清空父层共享区指针。S977–983使用STREAM session context。票据key严格48/80字节，首key加密，解密按名称；自动轮换依赖共享缓存与SSL库支持。session_timeout不是握手超时。
- ssl_conf_command注册post S83–84确实指向S1288–1296；S1003–1005在其他设置后调用共享SSL_CONF处理，不支持时配置失败。
- ssl_alpn专有callback S1234–1285做单字节长度前缀编码，单项不能超过255字节；S887–892安装选择callback，S579–616无交集时fatal。客户端不发送ALPN不等于必然拒绝；选择h2也不实现HTTP/2。平台缺ALPN支持时报配置错误。

## 完整21项证据索引

注册范围位于S；merge、官方节点、post和phase来源的逐事实绑定见JSON。

| ssl_handshake_timeout | 89–94 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | src/stream/ngx_stream_ssl_module.c:339–364；src/stream/ngx_stream_ssl_module.c:401–460；src/event/ngx_event_openssl.c:2143–2163；src/event/ngx_event_openssl.c:1881–1942 |
| ssl_certificate | 96–101 | ngx_conf_set_str_array_slot src/core/ngx_conf_file.c:1093–1125 | src/stream/ngx_stream_ssl_module.c:852–931；src/stream/ngx_stream_ssl_module.c:1011–1096；src/stream/ngx_stream_ssl_module.c:621–670；src/stream/ngx_stream_ssl_module.c:1329–1368；src/event/ngx_event_openssl.c:434–481；src/event/ngx_event_openssl.c:648–735；src/event/ngx_event_openssl.c:1881–1942 |
| ssl_certificate_key | 103–108 | ngx_conf_set_str_array_slot src/core/ngx_conf_file.c:1093–1125 | src/stream/ngx_stream_ssl_module.c:852–931；src/stream/ngx_stream_ssl_module.c:1024–1096；src/stream/ngx_stream_ssl_module.c:637–670；src/event/ngx_event_openssl.c:553–574；src/event/ngx_event_openssl.c:624–644；src/event/ngx_event_openssl.c:738–852；src/event/ngx_event_openssl.c:1881–1942 |
| ssl_password_file | 110–115 | ngx_stream_ssl_password_file src/stream/ngx_stream_ssl_module.c:1099–1119 | src/stream/ngx_stream_ssl_module.c:1090–1096；src/event/ngx_event_openssl.c:1199–1325；src/event/ngx_event_openssl.c:1329–1388；src/event/ngx_event_openssl.c:819–852 |
| ssl_dhparam | 117–122 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | src/stream/ngx_stream_ssl_module.c:962–964；src/event/ngx_event_openssl.c:1407–1481 |
| ssl_ecdh_curve | 124–129 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | src/stream/ngx_stream_ssl_module.c:17–18；src/stream/ngx_stream_ssl_module.c:966–968；src/event/ngx_event_openssl.c:1484–1563 |
| ssl_protocols | 131–136 | ngx_conf_set_bitmask_slot src/core/ngx_conf_file.c:1389–1431 | src/stream/ngx_stream_ssl_module.c:63–71；src/stream/ngx_stream_ssl_module.c:869–885；src/stream/ngx_stream_ssl_module.c:401–440；src/stream/ngx_stream_ssl_module.c:514–556；src/event/ngx_event_openssl.c:296–399 |
| ssl_ciphers | 138–143 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | src/stream/ngx_stream_ssl_module.c:17–17；src/stream/ngx_stream_ssl_module.c:894–899；src/event/ngx_event_openssl.c:884–899；src/stream/ngx_stream_ssl_module.c:1003–1005 |
| ssl_verify_client | 145–150 | ngx_conf_set_enum_slot src/core/ngx_conf_file.c:1351–1385 | src/stream/ngx_stream_ssl_module.c:74–80；src/stream/ngx_stream_ssl_module.c:366–398；src/stream/ngx_stream_ssl_module.c:933–960；src/event/ngx_event_openssl.c:903–947；src/event/ngx_event_openssl.h:254–259 |
| ssl_verify_depth | 152–157 | ngx_conf_set_num_slot src/core/ngx_conf_file.c:1167–1194 | src/stream/ngx_stream_ssl_module.c:941–955；src/stream/ngx_stream_ssl_module.c:540–543；src/event/ngx_event_openssl.c:903–914；src/event/ngx_event_openssl.c:950–961 |
| ssl_client_certificate | 159–164 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | src/stream/ngx_stream_ssl_module.c:933–960；src/event/ngx_event_openssl.c:903–947 |
| ssl_trusted_certificate | 166–171 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | src/stream/ngx_stream_ssl_module.c:933–960；src/event/ngx_event_openssl.c:950–984 |
| ssl_prefer_server_ciphers | 173–178 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | src/stream/ngx_stream_ssl_module.c:894–899；src/event/ngx_event_openssl.c:884–899 |
| ssl_session_cache | 180–185 | ngx_stream_ssl_session_cache src/stream/ngx_stream_ssl_module.c:1122–1231 | src/stream/ngx_stream_ssl_module.c:336–336；src/stream/ngx_stream_ssl_module.c:970–983；src/event/ngx_event_openssl.c:3713–3784；src/event/ngx_event_openssl.c:4395–4461；src/event/ngx_event_openssl.c:1881–1942 |
| ssl_session_tickets | 187–192 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | src/stream/ngx_stream_ssl_module.c:985–1001 |
| ssl_session_ticket_key | 194–199 | ngx_conf_set_str_array_slot src/core/ngx_conf_file.c:1093–1125 | src/stream/ngx_stream_ssl_module.c:994–1001；src/event/ngx_event_openssl.c:4395–4553；src/event/ngx_event_openssl.c:4570–4644；src/event/ngx_event_openssl.c:4695–4821；src/event/ngx_event_openssl.c:4833–4846 |
| ssl_session_timeout | 201–206 | ngx_conf_set_sec_slot src/core/ngx_conf_file.c:1290–1318 | src/stream/ngx_stream_ssl_module.c:977–983；src/event/ngx_event_openssl.c:3713–3728；src/event/ngx_event_openssl.c:4725–4729 |
| ssl_crl | 208–213 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | src/stream/ngx_stream_ssl_module.c:933–960；src/event/ngx_event_openssl.c:987–1029；src/stream/ngx_stream_ssl_module.c:366–390 |
| ssl_conf_command | 215–220 | ngx_conf_set_keyval_slot src/core/ngx_conf_file.c:1129–1163 | src/stream/ngx_stream_ssl_module.c:83–84；src/stream/ngx_stream_ssl_module.c:1288–1296；src/stream/ngx_stream_ssl_module.c:994–1007；src/event/ngx_event_openssl.c:1595–1664 |
| ssl_reject_handshake | 222–227 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | src/stream/ngx_stream_ssl_module.c:852–885；src/stream/ngx_stream_ssl_module.c:485–574；src/stream/ngx_stream_ssl_module.c:1329–1368 |
| ssl_alpn | 229–234 | ngx_stream_ssl_alpn src/stream/ngx_stream_ssl_module.c:1234–1285 | src/stream/ngx_stream_ssl_module.c:887–892；src/stream/ngx_stream_ssl_module.c:579–616；src/stream/ngx_stream_ssl_module.c:294–295 |

## 实际发行补丁

临时git archive固定源并顺序实际应用34patch、142hunk及server_header替换；offset/fuzz与既有审计相等，47最终文件SHA匹配。S整文件保持：5a7444b60149d382046c2cfeb9831a7735c161ea542a93751dbede61dca8dc1c。

204段Nginx证据中200保持，4段首次被ssl_cert_cb_yield改变：ssl_handshake_timeout implementation-3、ssl_certificate implementation-6、ssl_certificate_key implementation-6、ssl_session_cache implementation-4，均为O1881–1942。随后ssl_sess_cb_yield与ssl_client_hello_cb_yield继续改共享握手分支；完整patch绑定对应source_ids，4项verified_affected，其余17项仅明示事实verified_unaffected。异步让出宏分支不证明原生指令自动安装第三方回调，更不是运行握手实测。

## 隔离验证

现场基线593，1.27.1.1-e33f9a74f8157679；只加入本owner21，临时release 1.27.1.1-b623f1e581d09a59。使用既有build.mjs/validatePublication，1017注册、614基础、0深度、403仅注册。21详情字段及callback/phase/guards匹配，279发布来源原文/固定SHA/真实EOF/锚点全部相等；其余996详情除release_id保持，8参考对象保持。

验证窗口根knowledge/current字节不变。patch/build临时目录均finally清理；未写正式/shared/脚本/配置/源仓库。默认与继承21项均已按固定merge核定；静态内容不承诺运行库支持或实际握手效果。等待独立审核，新finding仅按指定项修正。
