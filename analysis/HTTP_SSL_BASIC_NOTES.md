# P13 HTTP SSL完整28项实施与隔离验证

## R37单句修正（2026-10-13，主执行）

仅收窄ssl_stapling限制：在线获取响应才需已知发行者，ssl_stapling_file本地路径先装载并返回，不走发行者查找。主已读固定openssl_stapling.c250–287；既有implementation-2覆盖关键分支，无新增来源或其他对象变化。新JSON SHA256为906a22dd89bceea332667dd7517ef77a1a735ec260ee469016e3328834144442，交独立差异复核，下文保留初始验证历史。

## 冻结候审与写集

ngx_http_ssl_module完整28身份已完成，固定证据/逐事实补丁与网站隔离验证通过，候独立审核；未合入正式knowledge/current。仅新增analysis/content/HTTP_SSL_BASIC.json及本记录。Stream21与Mail19按独立owner顺序继续，不夹带到本次隔离输入；主负责StreamUpstream6，不重叠。

JSON SHA-256：4fab7d587a1c7c2e1ca0bd25a8faec3c08966dc87a2e70f18ed64a57959306f3。

P17非TLS31已单独冻结交主排队，uWSGI R31由主修改，本角色未覆盖。未读取证书/私钥/口令真实文件，只读固定源码、文档与发行patch；不下载、不运行来源生成器、configure、Nginx/OpenResty、TLS握手或任何认证服务，不嵌套Agent。

## 固定来源与身份

Nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928（1.27.1）；nginx-docs e8b581903e9d41252720053311cea687a5671674；OpenResty 8c37412c31621225e7aa7e825b5b50106c9c71c4（1.27.1.1）。使用本地git show SHA:path，沿research的一手来源方法核注册offset/post、module ctx、merge、HTTP握手/请求处理及共享SSL函数。

领取时正式516、三域TLS68均无交集；HTTP构建前主线已593，本owner28仍无交集，按实际593快照隔离，不回滚主线。28个活跃官方节点来自xml/en/docs/http/ngx_http_ssl_module.xml，未把较新版本未注册指令加入。

336处显式引用：268处Nginx、28处docs、40处OpenResty。逐一检查固定原文与真实物理EOF，末尾LF不算新行。下文H=src/http/modules/ngx_http_ssl_module.c；Q=src/http/ngx_http_request.c；O=src/event/ngx_event_openssl.c；T=src/event/ngx_event_openssl_stapling.c。

## 本域实际绑定与关键边界

H297–325绑定HTTP模块create/merge/postconfiguration；H637–894实际创建SSL上下文并配置证书、CA、DH、曲线、session、stapling、early_data与SSL_CONF命令。Q767–793以NGX_SSL_BUFFER创建下游连接并调用ngx_ssl_handshake，等待计时用HTTP core client_header_timeout，不借用stream握手超时。每项引用本域tls-binding；phase=configuration表示配置入口。

- H699–784检查证书/key数量、静态装载或安装ngx_http_ssl_certificate；H897–982编译变量并保留口令。Q1011–1075在临时HTTP request上求值，调用O578–644动态装载；不是上游代理客户端证书。证书与key数组各自整组继承，按序配对。
- 口令文件只在配置期读取，动态证书保留数组供加载，不宣称每次握手重读。engine/data/file路径按O738–852核定，不读取实际用户凭据。
- 固定protocols默认TLSv1/TLSv1.1/TLSv1.2/TLSv1.3，与本次固定XML一致；可协商版本依SSL库/宏。Q767–789先用默认server上下文，Q942–977再SNI切换，不保证每个server的协议集合都独立生效。ssl_ciphers真实调用SSL_CTX_set_cipher_list，不等于TLS1.3专用ciphersuites。
- ssl_buffer_size在H786、Q948–950、O1713–1714传给连接，并由O2659–2727聚合发送；不是请求大小或TLS记录固定长度。
- verify_client的on/optional/optional_no_ca以枚举H74–80核定；Q2074–2120在HTTP请求处理检查结果、缺证书、OCSP状态。optional_no_ca只豁免ngx_ssl_verify_error_optional列出的五种错误，不是忽略全部错误。client_certificate仅verify非零时加载并设置客户端可见CA名称列表；trusted_certificate不发该列表，文件配置不自动开启验证。
- session_cache off/none/builtin/shared分别走本域完整callback H1008–1117及O3713–3784；共享区至少8页，tag为HTTP SSL模块。builtin模式与shm_zone独立合并，不能把本层off等同于清空父层shm_zone指针。共享缓存绑定new/get/remove回调，也可参与票据key轮换。
- session_ticket_key严格48/80字节，首key加密，解密遍历名称。O4395–4553安装callback，O4568–4692执行，O4695–4821轮换。session_timeout传SSL_CTX_set_timeout，并不是keepalive/握手时间；tickets与session_cache不是同一个开关。
- ssl_ocsp验证客户端证书；on逐链但不查最终根，leaf仅首证书。H817–832拒绝optional_no_ca组合；T845–970跳过无证书/基础验证失败，Q2110–2119消费OCSP结果。响应器只http://，缺省从客户端证书AIA派生。OCSP状态共享cache不等于TLS会话cache，无nextUpdate时缓存写入取1小时。
- ssl_stapling服务于服务器证书；H874–883安装状态回调，T195–293为静态上下文证书准备数据。T564–613允许当前无有效staple并异步更新，不保证首握手带响应；变量动态证书没有这套配置期数据，不承诺自动适用。
- stapling_file走DER装载早返回；T296–360将valid设最大值，不执行在线刷新/验签流程。stapling_verify只控制在线流程的验证flags，off仍检查响应状态/证书对应关系/有效期；不把off说成完全不校验。
- H1235–1251把HTTP core resolver/timeout分别交stapling/OCSP；本批未复制resolver指令身份。平台不支持时，stapling警告忽略而ssl_ocsp报错，T2710–2740分别有证据。
- early_data有应用重放风险，O405–407在可用时设置NO_ANTI_REPLAY；H885及O1566–1592真实调用，OpenSSL与BoringSSL分支不同，平台不支持警告忽略。O1948–2082为真实提前读取/再握手，不凭宏名称推断。
- ssl_conf_command由H91–92真实post绑定到H1199–1207，缺SSL_CONF_FLAG_FILE拒绝；H889在常规设置后调用O1595–1664，按SSL_CONF类型处理路径。
- reject_handshake在Q988–998的SNI回调结束处以UNRECOGNIZED_NAME拒绝，不产生HTTP拒绝状态码；H1281–1325核证书/reject组合约束，不把请求Host当握手前选择。

## 完整28项证据索引

注册范围均位于H；表列完整配置callback定义及本条实现，merge-default、官方节点和source_ids详见JSON。

| 指令 | 注册行 | 配置回调完整定义 | 实际实现证据 |
| --- | --- | --- | --- |
| ssl_certificate | 97–102 | ngx_conf_set_str_array_slot src/core/ngx_conf_file.c:1093–1125 | src/http/modules/ngx_http_ssl_module.c:699–784；src/http/modules/ngx_http_ssl_module.c:897–982；src/http/ngx_http_request.c:1011–1075；src/event/ngx_event_openssl.c:434–481；src/event/ngx_event_openssl.c:648–735；src/event/ngx_event_openssl.c:578–644；src/event/ngx_event_openssl.c:1881–1942；src/http/modules/ngx_http_ssl_module.c:1281–1325 |
| ssl_certificate_key | 104–109 | ngx_conf_set_str_array_slot src/core/ngx_conf_file.c:1093–1125 | src/http/modules/ngx_http_ssl_module.c:699–784；src/http/modules/ngx_http_ssl_module.c:910–981；src/http/ngx_http_request.c:1034–1062；src/event/ngx_event_openssl.c:553–574；src/event/ngx_event_openssl.c:624–644；src/event/ngx_event_openssl.c:738–852；src/event/ngx_event_openssl.c:1881–1942 |
| ssl_password_file | 111–116 | ngx_http_ssl_password_file src/http/modules/ngx_http_ssl_module.c:985–1005 | src/http/modules/ngx_http_ssl_module.c:976–981；src/event/ngx_event_openssl.c:1199–1325；src/event/ngx_event_openssl.c:1329–1388；src/event/ngx_event_openssl.c:819–852 |
| ssl_dhparam | 118–123 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | src/http/modules/ngx_http_ssl_module.c:834–836；src/event/ngx_event_openssl.c:1407–1481 |
| ssl_ecdh_curve | 125–130 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | src/http/modules/ngx_http_ssl_module.c:21–22；src/http/modules/ngx_http_ssl_module.c:838–840；src/event/ngx_event_openssl.c:1484–1563 |
| ssl_protocols | 132–137 | ngx_conf_set_bitmask_slot src/core/ngx_conf_file.c:1389–1431 | src/http/modules/ngx_http_ssl_module.c:63–71；src/http/modules/ngx_http_ssl_module.c:716–718；src/event/ngx_event_openssl.c:296–399；src/http/ngx_http_request.c:767–789；src/http/ngx_http_request.c:942–977；src/http/modules/ngx_http_ssl_module.c:1284–1292 |
| ssl_ciphers | 139–144 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | src/http/modules/ngx_http_ssl_module.c:21–21；src/http/modules/ngx_http_ssl_module.c:747–752；src/event/ngx_event_openssl.c:884–899；src/http/modules/ngx_http_ssl_module.c:885–891 |
| ssl_buffer_size | 146–151 | ngx_conf_set_size_slot src/core/ngx_conf_file.c:1198–1225 | src/http/modules/ngx_http_ssl_module.c:786–786；src/http/ngx_http_request.c:767–775；src/http/ngx_http_request.c:948–950；src/event/ngx_event_openssl.c:1703–1715；src/event/ngx_event_openssl.c:2616–2727；src/event/ngx_event_openssl.h:188–188 |
| ssl_verify_client | 153–158 | ngx_conf_set_enum_slot src/core/ngx_conf_file.c:1351–1385 | src/http/modules/ngx_http_ssl_module.c:74–80；src/http/modules/ngx_http_ssl_module.c:788–832；src/event/ngx_event_openssl.c:903–947；src/http/ngx_http_request.c:2074–2120；src/event/ngx_event_openssl.h:254–260 |
| ssl_verify_depth | 160–165 | ngx_conf_set_num_slot src/core/ngx_conf_file.c:1167–1194 | src/http/modules/ngx_http_ssl_module.c:796–811；src/event/ngx_event_openssl.c:903–914；src/event/ngx_event_openssl.c:950–961；src/http/ngx_http_request.c:962–965 |
| ssl_client_certificate | 167–172 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | src/http/modules/ngx_http_ssl_module.c:788–811；src/event/ngx_event_openssl.c:903–947 |
| ssl_trusted_certificate | 174–179 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | src/http/modules/ngx_http_ssl_module.c:805–811；src/event/ngx_event_openssl.c:950–984；src/event/ngx_event_openssl_stapling.c:2366–2377 |
| ssl_prefer_server_ciphers | 181–186 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | src/http/modules/ngx_http_ssl_module.c:747–752；src/event/ngx_event_openssl.c:884–899；src/event/ngx_event_openssl.c:1496–1525 |
| ssl_session_cache | 188–193 | ngx_http_ssl_session_cache src/http/modules/ngx_http_ssl_module.c:1008–1117 | src/http/modules/ngx_http_ssl_module.c:842–855；src/event/ngx_event_openssl.c:3713–3784；src/event/ngx_event_openssl.c:4395–4461；src/event/ngx_event_openssl.c:4695–4756；src/event/ngx_event_openssl.c:1881–1942 |
| ssl_session_tickets | 195–200 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | src/http/modules/ngx_http_ssl_module.c:857–872 |
| ssl_session_ticket_key | 202–207 | ngx_conf_set_str_array_slot src/core/ngx_conf_file.c:1093–1125 | src/http/modules/ngx_http_ssl_module.c:865–872；src/event/ngx_event_openssl.c:4395–4553；src/event/ngx_event_openssl.c:4570–4644；src/event/ngx_event_openssl.c:4695–4821；src/event/ngx_event_openssl.c:4833–4852 |
| ssl_session_timeout | 209–214 | ngx_conf_set_sec_slot src/core/ngx_conf_file.c:1290–1318 | src/http/modules/ngx_http_ssl_module.c:849–855；src/event/ngx_event_openssl.c:3713–3728；src/event/ngx_event_openssl.c:4725–4729 |
| ssl_crl | 216–221 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | src/http/modules/ngx_http_ssl_module.c:813–815；src/event/ngx_event_openssl.c:987–1029；src/http/ngx_http_request.c:2074–2090 |
| ssl_ocsp | 223–228 | ngx_conf_set_enum_slot src/core/ngx_conf_file.c:1351–1385 | src/http/modules/ngx_http_ssl_module.c:83–88；src/http/modules/ngx_http_ssl_module.c:817–832；src/http/modules/ngx_http_ssl_module.c:1244–1251；src/event/ngx_event_openssl.c:1864–1878；src/event/ngx_event_openssl_stapling.c:845–970；src/event/ngx_event_openssl_stapling.c:985–1062；src/http/ngx_http_request.c:2110–2119；src/event/ngx_event_openssl_stapling.c:2710–2740 |
| ssl_ocsp_responder | 230–235 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | src/http/modules/ngx_http_ssl_module.c:817–832；src/http/modules/ngx_http_ssl_module.c:1244–1251；src/event/ngx_event_openssl_stapling.c:769–827；src/event/ngx_event_openssl_stapling.c:1012–1033；src/event/ngx_event_openssl_stapling.c:1120–1205 |
| ssl_ocsp_cache | 237–242 | ngx_http_ssl_ocsp_cache src/http/modules/ngx_http_ssl_module.c:1120–1196 | src/http/modules/ngx_http_ssl_module.c:826–831；src/event/ngx_event_openssl_stapling.c:1018–1055；src/event/ngx_event_openssl_stapling.c:2490–2548；src/event/ngx_event_openssl_stapling.c:2552–2625 |
| ssl_stapling | 244–249 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | src/http/modules/ngx_http_ssl_module.c:874–883；src/http/modules/ngx_http_ssl_module.c:1235–1242；src/event/ngx_event_openssl_stapling.c:195–293；src/event/ngx_event_openssl_stapling.c:364–445；src/event/ngx_event_openssl_stapling.c:564–613；src/event/ngx_event_openssl_stapling.c:617–657；src/event/ngx_event_openssl_stapling.c:2710–2721；src/http/modules/ngx_http_ssl_module.c:758–784 |
| ssl_stapling_file | 251–256 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | src/http/modules/ngx_http_ssl_module.c:874–883；src/event/ngx_event_openssl_stapling.c:262–293；src/event/ngx_event_openssl_stapling.c:296–360；src/event/ngx_event_openssl_stapling.c:617–624 |
| ssl_stapling_responder | 258–263 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | src/http/modules/ngx_http_ssl_module.c:874–883；src/http/modules/ngx_http_ssl_module.c:1235–1242；src/event/ngx_event_openssl_stapling.c:262–293；src/event/ngx_event_openssl_stapling.c:448–541；src/event/ngx_event_openssl_stapling.c:545–561；src/event/ngx_event_openssl_stapling.c:641–654 |
| ssl_stapling_verify | 265–270 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | src/http/modules/ngx_http_ssl_module.c:874–881；src/event/ngx_event_openssl_stapling.c:255–270；src/event/ngx_event_openssl_stapling.c:634–654；src/event/ngx_event_openssl_stapling.c:661–679；src/event/ngx_event_openssl_stapling.c:2319–2411 |
| ssl_early_data | 272–277 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | src/http/modules/ngx_http_ssl_module.c:885–887；src/event/ngx_event_openssl.c:1566–1592；src/event/ngx_event_openssl.c:405–407；src/event/ngx_event_openssl.c:1718–1722；src/event/ngx_event_openssl.c:1798–1812；src/event/ngx_event_openssl.c:1948–2082 |
| ssl_conf_command | 279–284 | ngx_conf_set_keyval_slot src/core/ngx_conf_file.c:1129–1163 | src/http/modules/ngx_http_ssl_module.c:91–92；src/http/modules/ngx_http_ssl_module.c:1199–1207；src/http/modules/ngx_http_ssl_module.c:885–891；src/event/ngx_event_openssl.c:1595–1664 |
| ssl_reject_handshake | 286–291 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | src/http/modules/ngx_http_ssl_module.c:699–744；src/http/modules/ngx_http_ssl_module.c:1281–1325；src/http/ngx_http_request.c:895–933；src/http/ngx_http_request.c:942–998 |

## 实际发行补丁

临时git archive固定Nginx，按既有审计顺序实际应用34个patch及server_header版本替换；142个hunk成功，offset/fuzz逐项与审计一致，47个最终文件SHA全部匹配。没有运行来源生成器或改审计。

H整文件保持，SHA-256 c86e053fe114d1958296b51750f72e8214a60eae0ec287f1b268086d3219e4cd。268段Nginx证据逐步比较：264保持，4段首次被ssl_cert_cb_yield改变：

- ssl_certificate / implementation-6：src/event/ngx_event_openssl.c:1881–1942
- ssl_certificate_key / implementation-6：src/event/ngx_event_openssl.c:1881–1942
- ssl_session_cache / implementation-4：src/event/ngx_event_openssl.c:1881–1942
- ssl_early_data / implementation-5：src/event/ngx_event_openssl.c:1948–2082

4项verified_affected为ssl_certificate、ssl_certificate_key、ssl_session_cache、ssl_early_data。随后ssl_sess_cb_yield、ssl_client_hello_cb_yield进一步修改这些共享分支；三补丁完整范围均绑定对应patch_status。宏允许时，握手/early-data遇WANT_X509_LOOKUP、PENDING_SESSION或WANT_CLIENT_HELLO_CB挂回事件并返回AGAIN。它们支持第三方回调让出，不表示HTTP原生指令自动安装所有异步回调或发生了真实握手。其余24项verified_unaffected只限明示事实，不能外推整个SSL生命周期。

## 现场基线隔离与回归

基线593，release 1.27.1.1-e33f9a74f8157679；临时release 1.27.1.1-a49dd0159b831e59。只在mkdtemp复制现有components/catalog/site/src、配置及临时知识，使用既有build.mjs和validatePublication，根knowledge/current未写。

- 1017注册、621基础=593+28、0深度、396仅注册；不是正式计数。
- 28项全部basic_verified，正文/可选事实/限制/patch/related字段逐项相等；phase、配置symbol、compile_guards匹配。
- 364处发布来源=336显式+28 distribution-version；固定revision、原文、物理EOF、URL行锚点逐一核验。
- 其余989项详情仅release_id变化，其他字段完全不变；8个reference对象保持。
- 验证前后正式knowledge与current字节相同；patch/build临时目录均finally清理，不遗留候选dist、配置、symlink。

## 未决与交付限制

28项必需事实与默认/继承已给出，默认值只按当前固定源码而非新文档推断；静态配置事实不等于实际库、编译选项或运行握手验证。候独立审核，不提升deep_verified，不合入正式知识。后续新finding按指定条目最小修复。
