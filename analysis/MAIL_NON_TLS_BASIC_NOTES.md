# P17 mail非TLS完整31项实施与隔离验证

## 结论与独立写集

按C02计划八个非SSL owner完整31身份准备批次，中文功能、语法、限制、真实配置入口、固定源码/文档/发行补丁均已绑定；静态验证与隔离网站build通过，冻结候独立审核，未合入正式knowledge/current。

仅新增analysis/content/MAIL_NON_TLS_BASIC.json及本记录。不改review、配置、脚本、源仓库或其他角色内容；与主P13 SSL、P16 stream proxy不重叠。不嵌套Agent，不运行邮件服务/认证HTTP，不读取凭据或上传配置，不下载，不执行来源生成器、configure或Nginx/OpenResty。

JSON SHA-256：7d735bb29aa78ea172022ccc614e3eff5038d328a55e8410b95bcbdfca09916b。

前批P05已在领取时复核冻结：JSON 6868c0a5db6945639a91983abd8d07d822c19b2be0240429131ecc3f307f8759；NOTES 74e9aeceb43797075447b126c239c03483791d2508929133e829599cbcdd1e7e。本批不改P05，审核由主排队。

## 身份、固定来源与方法

领取及隔离前对实际catalog与knowledge按(component,module,name)重新作差：1017注册、正式516，P17全部31均无交集。八组分别为wrapper1、core9、auth_http4、IMAP3、POP3 2、SMTP4、proxy7、realip1。没有包含ngx_mail_ssl_module，也不混入HTTP或stream同名指令。

- Nginx：e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928，1.27.1。
- 官方文档：e8b581903e9d41252720053311cea687a5671674；mail各模块XML，mail.error_log借xml/en/docs/ngx_core_module.xml。
- OpenResty：8c37412c31621225e7aa7e825b5b50106c9c71c4，1.27.1.1；util/mirror-tarballs和固定发行patch。

沿用research技能的一手证据方法，本地git show SHA:path取源；读取owner/create/merge、配置callback、post表、协议handler及真正使用处，不按名称套用HTTP正文。342处显式来源严格检查固定原文及真实物理EOF，末尾LF不算额外行：277处Nginx、30处活跃XML节点、35处OpenResty。proxy的XML节点处于注释内，不作为活跃文档；该项走完整源码专项。

缩写：

- B = src/mail/ngx_mail.c
- C = src/mail/ngx_mail_core_module.c
- A = src/mail/ngx_mail_auth_http_module.c
- I = src/mail/ngx_mail_imap_module.c
- P = src/mail/ngx_mail_pop3_module.c
- S = src/mail/ngx_mail_smtp_module.c
- X = src/mail/ngx_mail_proxy_module.c
- R = src/mail/ngx_mail_realip_module.c
- H = src/mail/ngx_mail_handler.c
- IH = src/mail/ngx_mail_imap_handler.c
- PH = src/mail/ngx_mail_pop3_handler.c
- SH = src/mail/ngx_mail_smtp_handler.c

## 关键行为与易混淆边界

### 配置框架与core

B66–221创建所有mail模块main/srv配置，以MAIL_MAIN_CONF解析mail块，并对每个server调用真实merge；C223–300创建独立srv配置，要求listen；B319–348建立监听且安装ngx_mail_init_connection，H130–146选择对应srv_conf，H454–476调用协议init_session。31项phase统一configuration表示配置入口，不冒称HTTP content阶段。

C352–371按各协议表的已知端口推断协议，C624–654也允许显式选择已编入协议。协议识别不等于启用TLS；listen的ssl参数只记录NGX_MAIL_SSL边界，不领取SSL owner。C571–621拒绝重复监听地址端口。listen proxy_protocol是入站头读取，X中的同名独立指令是出站发送，不混用。

core timeout用于代理开始前，auth_http_timeout与resolver_timeout是独立流程；透明转发后才用proxy_timeout。C196–200的server_name最终空值回退cycle.hostname；它不是HTTP式虚拟主机路由，POP3仅在需要盐时插入名称，不能照文档概述写成所有POP3欢迎必带名称。

H856–888只对parse_command返回INVALID_COMMAND累加max_errors，不能当错误密码次数限制或所有语义错误计数；缓冲占满仍未形成完整命令会直接quit。0不是无限制。H792–799证明quit后的关闭。

resolver通过C666–690调用共享创建函数，SH56–245做客户端地址反查再正查验证，结果用于Client-Host与XCLIENT NAME；不是用来解析Auth-Server主机名。上游只接受对应的DNS参数；固定发行补丁的local=及无IPv6构建行为单列，商业status_zone未列入固定源码能力。

error_log通过C657–663进入ngx_log_set_log，B329–333与H144–164接入监听/连接。默认是继承父层或cycle.new_log，不把mail默认路径写死。共享日志输出另受intercept_error_log及larger_max_error_str影响，已标affected，不因mail注册文件保持就称完整日志不受影响。

### auth_http

H903–922进入认证，A186–232创建请求并连接认证端；A1299–1350产生HTTP/1.0 GET和Auth-*头。配置回调A1584–1630支持http://或裸地址、Unix URL，默认80与空URI回退/；无HTTPS握手、变量脚本或运行期resolver链。

A497–519、574–638、685–837按响应头处理状态、用户名/密码替换、等待及后端路由，不是只读HTTP状态码；Auth-Server按IP解析，Auth-Port限制1–65535。读取的是固定源码中的字段定义与调用，没有读取真实凭据或发出认证请求。

A219–232初始读写定时器，A252–296发送完成删除写计时；读侧A315–345没有每次收包重置定时器。Auth-Wait是服务响应指定延迟，不等于auth_http_timeout。

auth_http_header直接存储字面字符串并merge序列化后追加；本层有一条即不继承父层整组，不是变量求值或同名头替换。auth_http_pass_client_cert归此非SSL owner，但A1177–1226真实消费需NGX_MAIL_SSL、SSL连接及verify非零；再取raw cert、URL编码，A1448–1453仅非空才发Auth-SSL-Cert。开关不启用验证或给认证HTTP连接加密。

### IMAP、POP3、SMTP

各协议的module ctx绑定专属protocol，表中保存init_session/init_protocol/parse_command/auth_state；I、P、S分别create/merge各自client_buffer、capabilities和auth_methods，不能互换默认值。

三种协议的PLAIN/LOGIN未公告并不代表禁止明文认证：IH303–423、PH309–366/473–544、SH656–736保留相关路径；CRAM-MD5/EXTERNAL（POP3另有APOP）才检查相应掩码。STARTTLS-only限制独立，不扩写SSL owner。协议NGX_DONE分别在IH235–237、PH271–273、SH559–561进入ngx_mail_auth，最终由auth_http处理。

IMAP默认IMAP4 IMAP4rev1 UIDPLUS，POP3默认TOP USER UIDL；SMTP无自定义扩展默认，仍组合服务器名/AUTH。capabilities同层追加，子层为空才继承父层整组，公告不实现后端能力。各handler依据实际TLS状态选择普通、STARTTLS、STARTTLS-only公告。

SMTP none允许MAIL/RCPT输入；SH789–825在RCPT设置auth_method=NONE并返回NGX_DONE，仍走auth_http取得路由，不是直接放行后端。smtp_greeting_delay在SH280–373延迟欢迎、拒绝抢先发命令客户端；到时恢复core timeout，而非逐命令延迟。

### mail proxy与realip

proxy确有注册与enable字段、默认off，但全固定src/mail检索发现enable仅声明、offset、初始化与merge，无运行期读取；A813–837直接调用X128–206，后者没有enable门控。故正文明确此字段不构成停止邮件代理保证，不把注释中的XML当活跃说明。

proxy_buffer只分配s->proxy->buffer用于后端登录响应/后端到客户端；X1150–1181的客户端到后端复用协议s->buffer。proxy_timeout在登录完成时移除上游read计时并给客户端read装新计时，X1279–1282在处理客户端侧事件时更新；不笼统声称任何后端事件都直接更新，也不是会话总寿命。

proxy_pass_error_message只处理后端登录响应检查失败时的原文保存及回传，不等于Auth-Status透传。xclient按SMTP状态机发送EHLO→XCLIENT→条件性客户端HELO/EHLO；proxy_smtp_auth启用时省略XCLIENT LOGIN，并以AUTH PLAIN发送Base64的NUL+用户名+NUL+密码。NONE路径优先走MAIL FROM，不强行补AUTH。

出站proxy_protocol实际用ngx_proxy_protocol_write产生v1文本头，不能称v2；AGAIN可重试，部分发送当错误。realip需先收到入站PROXY头且原始连接地址可信，R67–132才替换客户端地址/端口；不读取X-Forwarded-For，固定callback还支持配置期主机名解析。

## 完整31项证据索引

每条另有module-owner及B165–201真实merge调用绑定；完整merge-default、文档、patch和事实source_ids见JSON。

| 身份 | 注册 | 配置callback完整定义 | 具体实现证据 |
| --- | --- | --- | --- |
| ngx_mail_module / mail | B:32–37 | ngx_mail_block B:66–221 | B:79–201；B:206–220；B:319–348 |
| ngx_mail_auth_http_module / auth_http | A:89–94 | ngx_mail_auth_http A:1584–1630 | A:186–232；A:1299–1350；A:497–519；A:574–638；A:685–837；H:903–922 |
| ngx_mail_auth_http_module / auth_http_timeout | A:96–101 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | A:219–232；A:252–296；A:315–345；A:720–752 |
| ngx_mail_auth_http_module / auth_http_header | A:103–108 | ngx_mail_auth_http_header A:1633–1659 | A:1552–1578；A:1458–1463；A:1503–1520 |
| ngx_mail_auth_http_module / auth_http_pass_client_cert | A:110–115 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | A:1139–1143；A:1177–1226；A:1393–1456；A:1475–1500 |
| ngx_mail_core_module / server | C:32–37 | ngx_mail_core_server C:223–300 | C:240–299；C:202–207；H:130–146 |
| ngx_mail_core_module / listen | C:39–44 | ngx_mail_core_listen C:303–621 | C:315–371；C:425–469；C:471–569；C:571–621；B:291–348；H:169–193；H:249–268 |
| ngx_mail_core_module / protocol | C:46–51 | ngx_mail_core_protocol C:624–654 | C:352–371；C:202–207；I:47–61；P:47–61；S:40–54；H:454–476 |
| ngx_mail_core_module / timeout | C:53–58 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | IH:37–53；PH:62–73；SH:290–313；H:813–824；X:138–162；X:816–823 |
| ngx_mail_core_module / server_name | C:60–65 | ngx_conf_set_str_slot src/core/ngx_conf_file.c:1066–1089 | S:167–196；X:585–616；H:480–497；PH:39–64 |
| ngx_mail_core_module / error_log | C:67–72 | ngx_mail_core_error_log C:657–663 | src/core/ngx_log.c:478–538；src/core/ngx_log.c:552–673；B:329–333；H:144–164；src/core/ngx_log.c:95–196 |
| ngx_mail_core_module / resolver | C:74–79 | ngx_mail_core_resolver C:666–690 | src/core/ngx_resolver.c:132–309；SH:56–98；SH:102–148；SH:152–245；A:1340–1350；X:650–663 |
| ngx_mail_core_module / resolver_timeout | C:81–86 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | SH:62–98；SH:163–181 |
| ngx_mail_core_module / max_errors | C:88–93 | ngx_conf_set_num_slot src/core/ngx_conf_file.c:1167–1194 | H:856–888；H:792–799 |
| ngx_mail_imap_module / imap_client_buffer | I:66–71 | ngx_conf_set_size_slot src/core/ngx_conf_file.c:1198–1225 | IH:77–97；H:836–874 |
| ngx_mail_imap_module / imap_capabilities | I:73–78 | ngx_mail_capabilities C:693–716 | I:20–25；I:161–255；IH:426–455 |
| ngx_mail_imap_module / imap_auth | I:80–85 | ngx_conf_set_bitmask_slot src/core/ngx_conf_file.c:1389–1431 | I:28–44；I:184–219；IH:303–423；IH:231–239；H:903–922 |
| ngx_mail_pop3_module / pop3_capabilities | P:66–71 | ngx_mail_capabilities C:693–716 | P:20–25；P:151–250；P:299–323；PH:369–398 |
| ngx_mail_pop3_module / pop3_auth | P:73–78 | ngx_conf_set_bitmask_slot src/core/ngx_conf_file.c:1389–1431 | P:28–44；P:142–149；PH:309–366；PH:423–544；PH:267–276；H:903–922；A:764–773 |
| ngx_mail_proxy_module / proxy | X:45–50 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | X:15–23；X:1337–1375；A:813–837；X:128–206 |
| ngx_mail_proxy_module / proxy_buffer | X:52–57 | ngx_conf_set_size_slot src/core/ngx_conf_file.c:1198–1225 | X:170–177；X:954–993；X:1150–1181 |
| ngx_mail_proxy_module / proxy_timeout | X:59–64 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | X:155–162；X:313–336；X:476–497；X:816–834；X:1130–1147；X:1279–1282 |
| ngx_mail_proxy_module / proxy_pass_error_message | X:66–71 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | X:969–993；X:1093–1112；X:1286–1304 |
| ngx_mail_proxy_module / xclient | X:73–78 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | X:580–713；SH:62–75；SH:110–148；SH:195–244 |
| ngx_mail_proxy_module / proxy_smtp_auth | X:80–85 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | X:605–616；X:653–711；X:715–758 |
| ngx_mail_proxy_module / proxy_protocol | X:87–92 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | X:179–205；X:864–951；src/core/ngx_proxy_protocol.c:279–322 |
| ngx_mail_realip_module / set_real_ip_from | R:29–34 | ngx_mail_realip_from R:135–235 | H:249–268；R:67–132；R:152–235；R:238–255 |
| ngx_mail_smtp_module / smtp_client_buffer | S:59–64 | ngx_conf_set_size_slot src/core/ngx_conf_file.c:1198–1225 | SH:395–427；H:836–874 |
| ngx_mail_smtp_module / smtp_greeting_delay | S:66–71 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | SH:280–373；SH:44–46 |
| ngx_mail_smtp_module / smtp_capabilities | S:73–78 | ngx_mail_capabilities C:693–716 | S:199–270；S:272–312；SH:622–652；S:118–138 |
| ngx_mail_smtp_module / smtp_auth | S:80–85 | ngx_conf_set_bitmask_slot src/core/ngx_conf_file.c:1389–1431 | S:20–37；SH:656–785；SH:789–825；SH:555–564；H:903–922；A:1372–1391 |

## 实际发行patch与局部保持

临时mkdtemp展开git archive固定Nginx树，按既有NGINX_PATCH_AUDIT顺序以系统patch --batch --verbose -p1实际应用34个patch与server_header已核版本替换。142个hunk成功，offset/fuzz逐项相同；47个最终文件SHA-256与既有审计相等。未执行来源生成器或审计生成器。

277处Nginx片段逐步比较原文，275段保持、2段首次变化：

| 条目 / source_id | 原始范围 | 首次改变patch |
| --- | --- | --- |
| resolver / implementation-0 | src/core/ngx_resolver.c:132–309 | resolver_conf_parsing |
| error_log / log-output | src/core/ngx_log.c:95–196 | intercept_error_log |

resolver引用resolver_conf_parsing1–263及safe_resolver_ipv6_option1–60；error_log引用intercept_error_log及larger_max_error_str的完整物理范围。2项verified_affected、29项verified_unaffected只覆盖各条明示事实，不外推邮件完整生命周期无任何共享补丁影响。socket_cloexec等全局事件/连接变化不冒充本批指令新增语义。

八个owner整文件补丁前后字节保持，SHA-256如下：

- src/mail/ngx_mail.c：2a61a36581db88770ea207f760b64ef3cf9a45ee22b9ccdd60024426e11f33f6
- src/mail/ngx_mail_auth_http_module.c：9a11dc6b5999ec7d609262f989ff1280181da5b371903bd53336e34d77d687eb
- src/mail/ngx_mail_core_module.c：f8bc8c0ba71b156b0998c4d02171c75eb5d425732955c1e1e73427af5331fd45
- src/mail/ngx_mail_imap_module.c：1e5d2eb5f193a96316cf82a8a2687b0209fa4193685f58d585e5ae28fcfb500b
- src/mail/ngx_mail_pop3_module.c：2847fd1ad5935efca5fdee52d7e4ac662ede1ee88e06cf46bb0bb8ca5f8089a6
- src/mail/ngx_mail_proxy_module.c：4d848c5dcdefeeab71a5261fe8c3bae15a79170448b95398519bd43fd1be243f
- src/mail/ngx_mail_realip_module.c：233b7f4a29d4b63c6d1cd03ac3a2da87d910bdf69d42c15cd1490376a431e304
- src/mail/ngx_mail_smtp_module.c：b19b839b2c41583151dea9bf6a6eb7313ace007a31102cc6ce099e0b3db0621e

patch临时目录在finally清理，没有修改固定源仓库。

## 隔离构建与回归

正式基线516，release 1.27.1.1-76405f32ab987818。仅在临时知识输入追加31，以现有scripts/build.mjs执行网站构建及内置validatePublication，临时配置/源路径只指本地固定来源；不执行根build或修改正式发布。

- 临时release：1.27.1.1-fdaaf81be7a34252。
- 1017注册，547基础=516+31，0深度，470仅注册；该计数不是正式合入结果。
- 31项全部basic_verified，summary/syntax/defaults/inheritance/limitations/patch_status/related逐项等于草稿，phase、配置symbol、compile_guards匹配。
- 373处发布来源=342显式+31 distribution-version；固定SHA、片段原文、真实EOF及URL锚点全部逐一核验。
- 其余986条详情除release_id外完全不变；8个reference对象不变。
- 测试前后knowledge/directives.json及dist/knowledge/index.json字节保持，本角色未写shared/current。
- 配置、build脚本、catalog、components和冻结proxy/upstream/FastCGI/SCGI/uWSGI/P05两个文件的领取哈希作为16个保护对象；本批只写两个获准文件。
- 最终检查中14个保护文件保持；uWSGI JSON/NOTES在并行期间变化，用户已明确为主修R31单句SNI描述。本角色未写这两个文件、不恢复旧稿；P17正式516及current仍与隔离前字节相同。
- build临时目录及候选dist在finally清理，不留下临时配置、构建输出或symlink。

## 可选未知与未决

defaults及inheritance均明确unverified的4项：mail、server、listen、protocol；不按文档空default猜值。其余27项默认/合并事实以各自真实merge和必要派生使用处核定。

必需31项已齐备，但独立审核尚未完成；静态源码与网站构建不等于邮件服务、TLS握手或认证HTTP运行验证。本批未读取凭据、未运行上述服务或上传配置，不提升deep_verified。只提交完整草稿供主排队审核；后续有具体finding再最小修改指定项。
# R35补充：IMAP EXTERNAL初始响应路径（2026-10-13）

仅修正imap_auth的summary及一条限制，并追加固定ngx_mail_parse.c:903–975和ngx_mail_handler.c:722–753来源及限制/补丁引用。主读回共享解析器：EXTERNAL无初始响应返回NGX_MAIL_AUTH_EXTERNAL，IMAP handler检查方法掩码；有初始响应直接解码返回NGX_DONE，后续仍交auth_http，不代表认证成功。STARTTLS-only独立检查保留。审核已实际确认新增两段在34补丁回放树保持；其他30项保持，交单项差异复核，不将整份31提前放行。

# R36补充：POP3/SMTP共享EXTERNAL路径（2026-10-13）

主读回POP3 handler:480–544及SMTP handler:663–735，确认与R35相同的返回值分流。仅收窄pop3_auth摘要并追加限制、收窄smtp_auth限制，追加auth-parser/auth-external来源及限制/补丁引用；保留APOP、CRAM-MD5、none及现有字段。其余29对象不变。新增共享片段已由审核在实际补丁回放树核定保持，交两项差异复核。

