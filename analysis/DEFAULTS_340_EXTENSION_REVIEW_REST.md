# 340补证：E组剩余70身份独立补充审核

日期：2026-10-15。审核角色仅写本文；范围为manifest中E组剔除Echo18、Headers More4、VTS2后的70身份、88目标字段（22 defaults、66 inheritance）。不重复主线程E01及已签署项目，不修改知识、实施产物或发布。

## 深度交互：当前结论与边界

当前结论：ER01已完成源码语义及正式发布复核并关闭，70身份、88目标字段全部通过独立审核。最终签署绑定 `1.27.1.1-feffaa9462de60b6`，详见文末关闭记录。以下保留49b7初审发现、原始输入摘要及逐项表作为历史审计，不将旧稿的退回状态解释为当前未关闭。

初审结果为87字段通过、1个inheritance字段退回ER01；当时69身份全部目标通过，set_iconv仅defaults通过。源码语义与证据链接分别检查；829个目标字段来源引用已对固定Git对象校验，覆盖49个源码文件，未发现缺失来源、证据ID碰撞、越界或f9f6片段漂移。此机械检查不替代语义签署。主线程本轮34补丁/47文件回放记录只读引用，不重复执行。

## 直接执行：退回问题

### ER01：set_iconv继承说明误引入不允许的配置上下文

- 精确身份：`iconv-nginx-module--ngx_http_iconv_module--set_iconv`；字段：`inheritance`。
- 当前文本称“server中的动作在server-rewrite阶段先执行”“http级动作代码也不会由merge自动复制给server”，并包含“允许的if内动作”说明；这一段是其他NDK动作的通用文字，放在本项会误导读者认为set_iconv可声明在这些位置。
- 固定revision `67d55c7edd3ab0535afa1e55ec8b2cdeb5167a82`，`src/ngx_http_iconv_module.c:60–66`：注册仅 `NGX_HTTP_LOC_CONF|NGX_CONF_TAKE4`，没有MAIN/SRV/SIF/LIF；593–628的setter进入NDK动作编译不扩大合法context。Nginx固定 `src/core/ngx_conf_file.c` 的指令上下文检查发生在setter调用前。
- 修正：限于合法location与嵌套location的rewrite动作不复制/不追加规则，保留buffer及过滤器参数另行合并的区别；明确本项不允许http/server/if，或删除这些不适用段落。`defaults`关于显式from=/to=及不预置动作的结论未发现此问题。
- 初审状态：退回主线程；现已修正并通过，关闭证据及新产物摘要见文末。

下列签署记录包含全部70个身份；除ER01外，本轮未发现需要退回的目标事实错误。Postgres结果rewrite消费实际遇非DECLINED会停止，表中明确这一边界；现有“逐条件调用”按有条件遍历理解，不解释为所有规则必定执行。

## 审核输入固定与发布对照

初始读取EXTENSION_UPDATES为82项，排除已审22项后60项；随后只新增Postgres10项，前60项JSON元素摘要逐项未变。最终对全部70项重新核对MD正文与JSON事实文本相等，正式发布目标字段与JSON的完整事实对象（含status/source_ids）逐项相等。不是只比状态或数量。

| 输入 | SHA-256 |
| --- | --- |
| `analysis/DEFAULTS_340_MANIFEST.json` | `a685f1d87c9a3afc7812c8ca231cc137dba10db494b3d0f9b183d16c111cff90` |
| `analysis/DEFAULTS_340_EXTENSION_UPDATES.json` | `1581c02a8fa7d448d5b1dff0762f77da1d1d95e68d2a7dc77dc199c1c9f08fc4` |
| `analysis/DEFAULTS_340_EXTENSION_EVIDENCE.md` | `aa63cf4dd79851f038691b1225769db157ad42bd390b87f40db8569c5424f74a` |
| `analysis/defaults-340-patch-replay.json` | `396e548d4732669acc77431bcf51644e25d88530c3d220580343692c19212050` |
| 冻结正式索引 `dist/knowledge/releases/1.27.1.1-49b7ae8d639a1fa0/index.json` | `fdf40c053a43eb1dd6c5292a08bbeb5d27522866fdb53682c111c3983d605401` |

初始82项UPDATES原始摘要为 `a583bc7f67ac66f7a2907a4eee59cb836fcadcb5c9efbbc0debf25ae869a1279`，初始EVIDENCE为 `0c64e6a655b5a709b228804c7e66f5fa7d7fcd093f8a3e2e05ee61582f57d66d`。这些仅记录增量审核过程；签署以最终输入摘要和逐行元素摘要为准。

每行元素摘要定义为Node解析UPDATES后，对对应对象按文件中键顺序 `JSON.stringify(item)` 的UTF-8内容计算SHA-256；用于识别追加其他模块时本条是否变化，不替代整个文件原始字节摘要。修改任何已签署对象须重新检查对应字段；不能沿用本记录放行新文本。

## 固定源码复核记录

本节代号与后文逐项表对应。所有函数与行号是固定Git对象，不使用工作树或现行文档替代。

- 公共Nginx：`e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`。直接读取rewrite模块136–184、221–294、532–644；http.c:486–556、570–666；core模块完整create/merge（3547–3954）及1252–1262、1381–1383；script.c:1525–1544；公共配置宏、flag/size/msec/string-array setter与upstream对象创建、bind setter/消费。确认codes为空时不取父codes，if编译共用数组但解析后子codes清空，server阶段与location阶段不是配置继承；core merge未复制handler，if切换更新只在非NULL时覆盖r->content_handler。
- ND：NDK `91e30eb05085e7f9762f130cbb883a0e753cf74d`，upstream_list.h:2–13、upstream_list.c:59–204；main共享表和不区分大小写重复名检查已读。set_var.c:127–218、256–601逐段读完，核实际取得rewrite loc_conf、追加codes、绑定filter、运行调用及TAKE12源值选择。共享链允许复用，具体指令仍逐注册/post核对。
- SM：Set Misc `31c4ad67bb9e392a734e4e58ea8048e24012311f`，module.c:40–510逐一核26个注册及post，528–565核参数/current合并；专用set_default_value.c、set_hashed_upstream.c:95–153、set_rotate.c:11–112独立核。九个默认缺口均说明未编译动作、不规定变量初值；26项继承均进入上述rewrite链，base32参数与rotate状态区别保留，未借共享setter猜结果。
- AR：Array Var `32188f86599b47f7cd34340e5a2985bd9d550bf8`，module.c:35–112、132–419四setter逐一核对；split的max/to=、map的模板、map_op的post和join不同filter类型都进入NDK，对象没有本模块loc merge。四项原地/新目标不是配置继承。
- FI：Form Input `43ee690c359c06af7d178379cfc37ebc858d9de2`，module.c:35–160、307–380、509–526。两注册仅main/server/location；setter按cmd名选普通/multi消费者、设置main.used并编译NDK。全局读体handler并不生成每处变量动作，正文没有套用if支持。
- IC：Iconv `67d55c7edd3ab0535afa1e55ec8b2cdeb5167a82`，module.c:58–84、593–743。默认动作结论通过；loc-only注册与通用继承文案冲突见ER01。filter的from/to默认与set_iconv显式参数已区分。
- ES：Encrypted Session `0f81b5728db0ece0f60c72354da69f158dc1d2a7`，module.c:57–143、394–426；两动作分别绑定encode/decode post，公共NDK消费已核。key/iv/expires只是参数merge，不能使动作自动出现。
- MC：Memc `b889a6fc3e18b784b454e1bc74e5d0b3513a07ce`，module.c注册、163–325完整创建/合并/setter，handler.c:180–213动态目标求值/回写已读。NULL静态槽会取父指针，complex_target不复制，变量失败不回退固定服务器；core handler与if的独立边界已核。正文没有宣称未设子目标安全运行。
- SC：Srcache `be22ac0dcd9245aadcaca3220da96a0c1a0285a7`，filter_module.c:35–47九个默认头、两注册及248–357；util.c:1144–1284完整hash合并、946–975/995–1020/1080–1110储存响应消费。确认双UNSET时先复用hash并提前返回，确实可能不复制原始数组及特殊头标志；此异常边界已在两条继承中明确，不借普通Nginx隐藏头算法代替。
- RJ：RDS JSON `2d7e07f7c39f98bbb2a8b07f4bae4d892f00329d`，filter_module.c注册、411–546完整创建/合并/ret setter；handler.c:11–37直接取当前errstr求值。参数未merge与core入口不复制均成立，if保留旧handler的风险未被误写成安全继承。
- DR：Drizzle `fb6cf255d91135e18145a98a93947ead4e703b68`，module.c:53–163、205–527、560–569；upstream.c:37–125、303–396、448–503、668–678；keepalive.c:26–159；handler.c:74–153；processor.c:212–225、315–328、495–507；output.c:224–244、590–613。逐一核upstream作用域、query整组、dbname空值、pass未合并的UNSET_PTR、六个参数以及status动作。超时继承本身由模块merge证明，不用公共Nginx超时宏代替Drizzle消费路径。
- RD：Redis `411fef36e130129b670fa7f2672bcad6ab2cbdd3`，module.c:64–90、777–940及发行三补丁完整读取。变量补丁只增加complex_target、setter和消费，没有补merge；default_port_fix的版本条件与固定1.27.1相符。bind的NULL初始化/无merge加上公共setter先检查UNSET_PTR，确实在首次显式声明（包括off）返回duplicate；这只是固定源码组合结果，无运行验证承诺。
- R2：Redis2 `c989c829a2877132cb100f901e320921250e068d`，module.c:注册、148–246、248–470及复杂值setter；handler.c:22–210。四查询的省略值和queries→非空literal→complex_query优先级逐项核对；count缺省1并不创建命令。pass与Memc同样区分静态槽和complex_target；bind也缺少UNSET_PTR初始化与合并，结论同RD但使用本组件独立创建/合并证据。
- PG：Postgres `681980598529f67fcec5c7448452046764a68429`，module.c:注册、255–385、393–1311十项callback/配置槽逐段读取；upstream.c:40–200、handler.c:60–240、processor.c:245–280/404–440、escape.c:42–108及keepalive初始化。目标双槽、query整组、rewrites/variables整表、output handler/binary成对分别签署；postgres_escape直接编译rewrite，不经NDK。postgres_set重复全局变量名不能作为子级覆盖；结果rewrite消费遇非DECLINED停止。connect_timeout经过公共初始化补丁，result_timeout是模块自己在发送成功后直接读取u->conf->read_timeout，二者未混淆。

## 补丁与结构边界

OpenResty固定 `8c37412c31621225e7aa7e825b5b50106c9c71c4`。本轮只读主线程 `defaults-340-patch-replay.json`，记录34补丁/47最终文件；审核核对修改目标集合并直接读取no_error_pages、upstream_timeout_fields、balancer_status_code、upstream_pipelining及Redis三补丁。rewrite模块、http.c、script.c、conf_file.c/h不在有效修改目标中；core的no_error_pages未新增handler复制；upstream绑定setter/NULL消费不在上述hunk范围；超时补丁确实在公共init复制字段并更改计时器读值。发行脚本对应各组件取包段不含直接补丁，Redis三补丁另核；不把此结论扩大为全部运行兼容性。

结构检查同时验证manifest原始SHA、70条f9f6详情原始SHA、每条目标字段存在、所有来源可解析、旧来源代码等于固定对象；最终70项88字段与正式49b7完整事实对象一致，EVIDENCE中文文本一致。源码片段真实只能证明引用存在，语义通过依据为上节逐机制读码和下表逐项签署。

## 49b7初审：70身份逐项目标字段签署

“通过”仅表示本次所列目标字段的固定源码语义和当前证据支持通过，不表示现场有效或整条指令全场景通过。“不在目标”必须保留原字段，不可据本审核修改。代号对应上一节完整revision与读码范围。

| 精确ID | defaults | inheritance | 独立核对锚点/判据 | 审核UPDATES元素SHA-256 |
| --- | --- | --- | --- | --- |
| `memc-nginx-module--ngx_http_memc_module--memc_pass` | 通过 | 通过 | MC：静态upstream复制、complex_target不复制；core handler与if另核 | `43cd522e9ad11a981bf7ba849199ca783b046a163a2ad72aea4fa98c0e16dbac` |
| `srcache-nginx-module--ngx_http_srcache_filter_module--srcache_store_hide_header` | 通过 | 通过 | SC：九项默认隐藏表、双数组及父hash提前返回分别核 | `fd30be760172862e32133f477370244e33fd503e5559a42e52a189dc9b43d5f7` |
| `srcache-nginx-module--ngx_http_srcache_filter_module--srcache_store_pass_header` | 通过 | 通过 | SC：九项默认隐藏表、双数组及父hash提前返回分别核 | `9d1bd85c57cc4b1a3451763d1386983e409c543e1c042986813d4107416ae3c2` |
| `ngx_devel_kit--ndk_http_module--upstream_list` | 不在目标 | 通过 | ND：main共享表，不是server/location merge | `f3b39e8521a39d02ba8242173dcc47c8872150faf6761026d80ae63d4ebf4fb3` |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_encode_base64` | 不在目标 | 通过 | SM：26项注册/post逐项绑定；通用NDK动作，专用set_if_empty、set_hashed_upstream、set_rotate另读setter | `896421f75db90ebccd11525b8fdf2ca689c879ada5aea817d3cb8bf15c9ec567` |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_decode_base64` | 不在目标 | 通过 | SM：26项注册/post逐项绑定；通用NDK动作，专用set_if_empty、set_hashed_upstream、set_rotate另读setter | `e3e28cab916acf66f1bcc82e543f7f340ba533bcb9c009e4eb40ddd38ca03f1b` |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_encode_base64url` | 不在目标 | 通过 | SM：26项注册/post逐项绑定；通用NDK动作，专用set_if_empty、set_hashed_upstream、set_rotate另读setter | `e5a436eba51dc22d2d531f4e0cdfa3360edc94d70fb120fec104da5420bfaf11` |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_decode_base64url` | 不在目标 | 通过 | SM：26项注册/post逐项绑定；通用NDK动作，专用set_if_empty、set_hashed_upstream、set_rotate另读setter | `00347734c204193e3e3a2f1b273a4f44703f8f875b891f9b72c086ca6398cee4` |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_decode_hex` | 不在目标 | 通过 | SM：26项注册/post逐项绑定；通用NDK动作，专用set_if_empty、set_hashed_upstream、set_rotate另读setter | `4093c4a0c9eaeba69b7c1d0d19b36154d1f882de02bc45d65d587f60638b81e7` |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_encode_hex` | 不在目标 | 通过 | SM：26项注册/post逐项绑定；通用NDK动作，专用set_if_empty、set_hashed_upstream、set_rotate另读setter | `5cdb83ac962497f5ad54afb2d8966ea2787f12c9277c7b7b2e5c8fc86d9e6a07` |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_hmac_sha1` | 通过 | 通过 | SM：26项注册/post逐项绑定；通用NDK动作，专用set_if_empty、set_hashed_upstream、set_rotate另读setter | `c549397636b7e660b50307fc2ad9f7c123259f708377a2acac7113eead60ed36` |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_hmac_sha256` | 通过 | 通过 | SM：26项注册/post逐项绑定；通用NDK动作，专用set_if_empty、set_hashed_upstream、set_rotate另读setter | `7cd5b845a136f093d9efd95e115470ece880a91246205efac36052c665d54aaa` |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_md5` | 不在目标 | 通过 | SM：26项注册/post逐项绑定；通用NDK动作，专用set_if_empty、set_hashed_upstream、set_rotate另读setter | `a9f13bddb55cd29dc83c9cf50ff329b1ee5876ac391c9ba21e0ba902f8ff7b7c` |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_sha1` | 不在目标 | 通过 | SM：26项注册/post逐项绑定；通用NDK动作，专用set_if_empty、set_hashed_upstream、set_rotate另读setter | `012e9818b095cc5c583b036bdd759113f85fbb1c670f32be4000a3b0660de2a5` |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_unescape_uri` | 不在目标 | 通过 | SM：26项注册/post逐项绑定；通用NDK动作，专用set_if_empty、set_hashed_upstream、set_rotate另读setter | `16f8ed120cc0f3218bc75871b9f39a12393678780ce4174a2cecf7aa6b10054d` |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_escape_uri` | 不在目标 | 通过 | SM：26项注册/post逐项绑定；通用NDK动作，专用set_if_empty、set_hashed_upstream、set_rotate另读setter | `9e233d35c4feb98b6d93b0dfb1acde0e03a29989c7a9596bb53cb8ee3daf443a` |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_quote_sql_str` | 不在目标 | 通过 | SM：26项注册/post逐项绑定；通用NDK动作，专用set_if_empty、set_hashed_upstream、set_rotate另读setter | `59e0402c465572284d4c1958ac6ca690d69ddab7a5f0320e8a2d8d8c330ab477` |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_quote_pgsql_str` | 不在目标 | 通过 | SM：26项注册/post逐项绑定；通用NDK动作，专用set_if_empty、set_hashed_upstream、set_rotate另读setter | `bab8198aba2a8b8bb919b4098952ae140eabe8f167695acadc63601b3e6bef44` |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_quote_json_str` | 不在目标 | 通过 | SM：26项注册/post逐项绑定；通用NDK动作，专用set_if_empty、set_hashed_upstream、set_rotate另读setter | `e7170278403beb0cea20e62691e9a3971484d815c66b9c261cd92315e882bb85` |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_if_empty` | 通过 | 通过 | SM：set_default_value.c:11–49，专用setter编译两个输入 | `670e7fac2f84c2fa0c2f421ef5a92300c56f772a39dd6e912abf3cde6278c7d4` |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_hashed_upstream` | 通过 | 通过 | SM：set_hashed_upstream.c:95–153，静态/变量列表名各走NDK | `c6d994bd3e33af05b22e9565497c468e4f21defdf8115ed2d05c181a1c8f542f` |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_encode_base32` | 不在目标 | 通过 | SM：module.c:对应注册/post及528–565，alphabet/padding仅参数 | `85f42ea6913bf4985b9699c0cb6a476849f98b8ccd7c85b8657495b2af56b049` |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_decode_base32` | 不在目标 | 通过 | SM：module.c:对应注册/post及528–565，alphabet/padding仅参数 | `fe049c340a56d3400d39fd4c4db777db520cbf8a93e4699d8fbd2e1dbcfa257c` |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_local_today` | 通过 | 通过 | SM：26项注册/post逐项绑定；通用NDK动作，专用set_if_empty、set_hashed_upstream、set_rotate另读setter | `9463fe8388f0ff6e58fc11af331d0e6aa3908e0855a470ad2a78524c9c21bde8` |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_formatted_gmt_time` | 通过 | 通过 | SM：26项注册/post逐项绑定；通用NDK动作，专用set_if_empty、set_hashed_upstream、set_rotate另读setter | `2ada63b3b0af85ab3db53e64e5c209141772df87d9733208af8a74d1284a4019` |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_formatted_local_time` | 通过 | 通过 | SM：26项注册/post逐项绑定；通用NDK动作，专用set_if_empty、set_hashed_upstream、set_rotate另读setter | `7b1c3f1e2ffea68add47044b95b27884c006f43c0f89f90661af5fe7d6e21f99` |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_random` | 通过 | 通过 | SM：26项注册/post逐项绑定；通用NDK动作，专用set_if_empty、set_hashed_upstream、set_rotate另读setter | `3511896ee7c15a8266b3ef55e787042005c83158b235f771ad5018551f8a9322` |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_secure_random_alphanum` | 不在目标 | 通过 | SM：26项注册/post逐项绑定；通用NDK动作，专用set_if_empty、set_hashed_upstream、set_rotate另读setter | `9a259502cb390b73fc6065219c93a531f01b76df3de241f344e191db3b9d6da3` |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_secure_random_lcalpha` | 不在目标 | 通过 | SM：26项注册/post逐项绑定；通用NDK动作，专用set_if_empty、set_hashed_upstream、set_rotate另读setter | `a6f636840eabada9ec588b9bd2549678207eb9b53c35e7b7ae06685e39b4de7b` |
| `set-misc-nginx-module--ngx_http_set_misc_module--set_rotate` | 通过 | 通过 | SM：module.c:528–565；set_rotate.c:11–112，current状态与动作不混同 | `a08bdb8869928ab39db322fcdbc83e3acd22442341ae49c97e78f20d28638b41` |
| `array-var-nginx-module--ngx_http_array_var_module--array_split` | 不在目标 | 通过 | AR：四setter逐项读完；原地/to=进入NDK而非参数数组merge | `6e11f4615e7bc52dab16f1cef2242bbf939c07ac069b1738aec521cf4651042f` |
| `array-var-nginx-module--ngx_http_array_var_module--array_map` | 不在目标 | 通过 | AR：四setter逐项读完；原地/to=进入NDK而非参数数组merge | `cd6c8266b7a7608a1235aefd0547cc53a5b52b12e20aecaab1e1a7fdea7b5256` |
| `array-var-nginx-module--ngx_http_array_var_module--array_map_op` | 不在目标 | 通过 | AR：四setter逐项读完；原地/to=进入NDK而非参数数组merge | `250c5ac055c4336d484d90fd5855a4cd091a461c75805bdd5291b5a7a5e59242` |
| `array-var-nginx-module--ngx_http_array_var_module--array_join` | 不在目标 | 通过 | AR：四setter逐项读完；原地/to=进入NDK而非参数数组merge | `44573fa27b49ae318c01ecfec51567f082d6de6bcbebaabde576319ec2b509e5` |
| `form-input-nginx-module--ngx_http_form_input_module--set_form_input` | 不在目标 | 通过 | FI：按cmd名称选普通/multi消费者；main.used仅挂读体handler | `936cd0c6af8283f17c43a360c4fc1df0ebd3e730417e1d05fdb4e4a229cb0878` |
| `form-input-nginx-module--ngx_http_form_input_module--set_form_input_multi` | 不在目标 | 通过 | FI：按cmd名称选普通/multi消费者；main.used仅挂读体handler | `342f6d34d2ca39da3e19a0dad74651516b5d9af8a7744b2567d4f0ff44f76dbd` |
| `rds-json-nginx-module--ngx_http_rds_json_filter_module--rds_json_ret` | 通过 | 通过 | RJ：errcode/errstr零初值且不merge；ret setter与消费者绑定 | `0cb7e9e7f7fd361d41508146d72d991d00c49869a138879a2a82fafc9f587829` |
| `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_server` | 不在目标 | 通过 | DR：upstream.c:37–125、303–396，组内追加 | `ea1d35bc6fea9d624ce6f2f183d4a278869def26b3b0e67ff5f21f6892644a0a` |
| `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_keepalive` | 不在目标 | 通过 | DR：keepalive.c:26–159，独立srv池 | `5f963718b0057d669a11bf5c84d25b2fdd1095c6189b34c38b409a54245ad6b3` |
| `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_query` | 不在目标 | 通过 | DR：module.c:275–279、334–450；upstream.c:473–503，整组条件 | `8938e36ef93fe8f27ef4679c67cc8523b57944816c437072df8cd004e05cb0d2` |
| `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_dbname` | 不在目标 | 通过 | DR：module.c:271–273、293–330；upstream.c:448–469、668–678，空结果非父dbname | `0440450cf1206dc19ca8d91190159eb69cf34cf6ca6a4271f6ac5355fa827663` |
| `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_pass` | 通过 | 通过 | DR：module.c:205–289、454–523；handler.c:74–153，UNSET_PTR不被merge消除 | `75386357c421c515bc97dce974e22170ee4fbdb6e24533e061dd30ae5880d672` |
| `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_connect_timeout` | 不在目标 | 通过 | DR：module.c:94–99、214、259–260，msec槽；不扩大运行承诺 | `f10db220d0f40b9df7e4fc5556bdc2f047e3457db16c80e2dcc622f482adef40` |
| `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_send_query_timeout` | 不在目标 | 通过 | DR：module.c:101–106、215、262–263；processor.c:212–225 | `f98d18b61558bc17ff526b97e3034c85648b05c55d32f6f37913e370697bd5e3` |
| `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_recv_cols_timeout` | 不在目标 | 通过 | DR：module.c:108–113、217、265–266；processor.c:315–328 | `6f05a50f81d303daa2ce13bc918e7fe13f79ac7dbb75fe40e77f9ec1afb7719e` |
| `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_recv_rows_timeout` | 不在目标 | 通过 | DR：module.c:115–120、218、268–269；processor.c:495–507 | `d6f3778b6d4fe337f65ba89dea05d503604a653643ce8a929d4a5cc17a700b57` |
| `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_module_header` | 不在目标 | 通过 | DR：module.c:122–127、220、256–257；output.c:224–244 | `9b72d739977ee71867ade8f28b8157f89e7a0284a7a315f615087ecee0adb16d` |
| `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_buffer_size` | 不在目标 | 通过 | DR：module.c:129–135、241、281–282；output.c:590–613 | `2fcaa6a0f3742e7e2152efa2dc6e756f34ffe1fe12d188c345bb770dd165b108` |
| `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_status` | 通过 | 通过 | DR：module.c:139–144、560–569；handler.c:396起，core handler无父复制 | `2ae0917adceffbf498a63632e8b25063d6f7373a208ff162bf27ca57222de9ad` |
| `iconv-nginx-module--ngx_http_iconv_module--set_iconv` | 通过 | 退回ER01 | IC：默认动作与过滤器编码分开；继承上下文退回ER01 | `2c15e3fca13fd46986295e98bf41913146856b2865de2cd337688f84710defcf` |
| `encrypted-session-nginx-module--ngx_http_encrypted_session_module--set_encrypt_session` | 不在目标 | 通过 | ES：encode/decode post分别核；key/iv/expires merge不复制动作 | `68b43a19286c9f0daf240764d8dab2f85cf6fe6da0f218c8e35bf3acce679e00` |
| `encrypted-session-nginx-module--ngx_http_encrypted_session_module--set_decrypt_session` | 不在目标 | 通过 | ES：encode/decode post分别核；key/iv/expires merge不复制动作 | `f0cbfee3965b7faa4e9bf14d037ecbcafe719254a85ce5a84696a497e88180c4` |
| `redis-nginx-module--ngx_http_redis_module--redis_pass` | 通过 | 通过 | RD：上游module.c:777–940 + variables_in_redis_pass/default_port_fix补丁 | `db00aea2941cbfb93d9c10a431024bf3ac6451e9f0041fe7224d7ac182c0a54b` |
| `redis-nginx-module--ngx_http_redis_module--redis_bind` | 不在目标 | 通过 | RD：redis module.c:76–83、777–894；Nginx upstream.c:6433–6455、6533–6543 | `31b705a090cce66fe98631b33e560b08ed628e690053c1a0af400d88f2df8936` |
| `ngx_postgres--ngx_postgres_module--postgres_server` | 不在目标 | 通过 | PG：module.c:393–500；upstream.c:40–131，组内servers | `38f91b855c9a36b0d2c5b1fbdfef1e49b54eb59b8527f1d1fb4ddd3f86bb9bbc` |
| `ngx_postgres--ngx_postgres_module--postgres_keepalive` | 不在目标 | 通过 | PG：module.c:503–604、255–291；upstream.c:122–131，off仅本组 | `df292310e63ea23bd72cbf3002fb9d5c040878dcfbb91c384b3e81e856affcec` |
| `ngx_postgres--ngx_postgres_module--postgres_pass` | 不在目标 | 通过 | PG：module.c:357–360、607–682；handler.c:120–152，目标对整体继承 | `06c11f252c414f87f96d3fa1702edf08f2020c3e764cca8559792cf01397087a` |
| `ngx_postgres--ngx_postgres_module--postgres_query` | 不在目标 | 通过 | PG：module.c:362–366、686–814；upstream.c:169–192，方法/默认整组 | `2cda6752a6465facd035a088599c5279a6d54fffbe3c410255cd0d3a6a640d11` |
| `ngx_postgres--ngx_postgres_module--postgres_rewrite` | 不在目标 | 通过 | PG：module.c:368、818–980；processor.c:404–420，整表且消费遇非DECLINED停止 | `b71118d9389d399942dcc8d739e3aed80ae736fb0af7539c9c6fb977c262ad17` |
| `ngx_postgres--ngx_postgres_module--postgres_output` | 不在目标 | 通过 | PG：module.c:370–380、984–1021；processor.c:255–273、437–440，handler/binary成对 | `b2c38742e0059566ad96cb0cdd975bdc3c774911a8602c92c070d1649abae3b7` |
| `ngx_postgres--ngx_postgres_module--postgres_set` | 不在目标 | 通过 | PG：module.c:382、1025–1159；processor.c:423–435，规则表替换与全局变量区别 | `ce55e33a4b0a43a73afe52734aa4d90fb7f1a3df0cf594f691dfc60d1d4745f0` |
| `ngx_postgres--ngx_postgres_module--postgres_escape` | 不在目标 | 通过 | PG：module.c:1167–1311；escape.c:42–108；公共rewrite链 | `12ae2bead42dc71b752dd6a844e56a5c72ab9192d9bde9411933b2ebda4174e0` |
| `ngx_postgres--ngx_postgres_module--postgres_connect_timeout` | 不在目标 | 通过 | PG：module.c:318、351–352；handler.c:211；upstream_timeout_fields.patch | `070da2a026fa9e79136d29fb065bb87b3939f26f044540ba3660b3c8212068f3` |
| `ngx_postgres--ngx_postgres_module--postgres_result_timeout` | 不在目标 | 通过 | PG：module.c:319、354–355；processor.c:273，模块直接读u->conf | `e69676eec9d3ec2678cfc63dcddec93bf710c5802e1f04ed1d1aa388bb01b919` |
| `redis2-nginx-module--ngx_http_redis2_module--redis2_query` | 通过 | 不在目标 | R2：module.c:325起；handler.c:123–130，queries优先且无预置 | `5db4a3b9ef4420dbfb7698321ea5ea548f7e3191b23e534e66a4df20d1ad1805` |
| `redis2-nginx-module--ngx_http_redis2_module--redis2_raw_query` | 通过 | 不在目标 | R2：module.c复杂值setter；handler.c:131–179，count缺省1不是默认命令 | `d51827c628c413e526bbb4f7252cf19507e3f232ee32d17a83dd5ed868159341` |
| `redis2-nginx-module--ngx_http_redis2_module--redis2_raw_queries` | 通过 | 不在目标 | R2：module.c:400起；handler.c:131–179，count/commands分别编译 | `9a43f93c776731e023f5fd167d50e26f03805fb1f8a80afca1da19b9249466bc` |
| `redis2-nginx-module--ngx_http_redis2_module--redis2_literal_raw_query` | 通过 | 不在目标 | R2：module.c:57–63、148–168；handler.c:131、190–199，空串不选字面分支 | `de63a95d15c601bdfb373f7043962d94bc6a2fc5865a5380349578a3e82d1b4e` |
| `redis2-nginx-module--ngx_http_redis2_module--redis2_pass` | 通过 | 通过 | R2：module.c:224–245、249–321；handler.c:22–83，静态槽/动态目标分开 | `3deb8a8f4d9d6704c6af5f741e275a78148b0c52c36c1e270bb16407007ba307` |
| `redis2-nginx-module--ngx_http_redis2_module--redis2_bind` | 不在目标 | 通过 | R2：redis2 module.c注册及148–245；Nginx upstream.c:6433–6455、6533–6543 | `58f2205dc1f2e39ac2f630025727095462ec98318da1ad42381e5ac2f37e625a` |

## 49b7初审收口（历史）

70身份/88字段审核已完成；22 defaults通过、65 inheritance通过、1 inheritance退回ER01。发布49b7含该待修文本，不能因主线程613项测试通过将其语义签为通过。主线程修正后须对该字段、对应证据说明及新发布事实对象做定向复核；其他已签署对象若摘要未变可沿用本轮结论。

本角色未运行测试/build/补丁回放/浏览器，未读取私有样例，未联网、未新增Agent、未修改knowledge或UPDATES/EVIDENCE。仅本审核文件落盘；不存在本角色创建的待清理临时文件。

## ER01关闭复核与最终签署

复核日期：2026-10-15。结论：ER01关闭；70身份88目标字段源码语义及新发布对象对照全部通过，22 defaults、66 inheritance均通过。未新增事实范围，不将本审核扩展为浏览器或现场运行验收。

本次重新直接读取固定Iconv `67d55c7edd3ab0535afa1e55ec8b2cdeb5167a82:src/ngx_http_iconv_module.c:58–68、593–628、698–743`，确认注册仅LOC、TAKE4，setter编译NDK转换动作，模块merge只处理buffer与过滤器参数；重新读取Nginx `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928:src/core/ngx_conf_file.c:393–397` 的上下文检查，以及 `src/http/modules/ngx_http_rewrite_module.c:221–268` 的create/merge不复制父codes分支。其余公共NDK链与补丁依据没有变化，沿用初审已读证据。

通过的修订文本：本项只允许在location配置，不允许http、server或if；转换动作写入当前location的rewrite codes，独立子location不从父location复制该动作，显式子动作不追加父序列；buffer及过滤器参数另行merge，不代表动作继承。此文本与固定注册、setter及合并逻辑一致，已去掉不适用上下文的通用说明。

差异复核结果：

- 其余69个UPDATES元素SHA-256逐项等于初审表，直接复用已完成的独立语义签署。
- 将修订set_iconv对象的inheritance.text还原为49b7文本后，完整元素SHA-256等于初审表；由此确认仅该text变化，defaults、status、source_ids、evidence及patch_source_ids均未变化。
- 当前knowledge中的set_iconv.inheritance与UPDATES完整事实对象相等；EVIDENCE含完全相同修订文本。已读其新增35个NDK动作及upstream_list复查说明，其上下文分类与初审直接读取的注册一致，不因此扩大已有字段范围。
- 对新发布70项逐条核对88目标字段完整对象与最新UPDATES相等；新详情全部携带新release_id。与49b7完整详情比较，仅放行release_id，以及set_iconv唯一inheritance.text变化后逐对象完全相等。其余69项的新发布全部原事实与来源保持，set_iconv其余字段保持。
- 当前索引与新发布冻结索引完整相等。旧49b7仅作为历史对照，不覆盖或修改。
- 只读主线程 `analysis/defaults-340-er01-tests.log`：5项通过、0失败，涵盖固定清单、set_iconv补证与保真、1041项/44深度/参考及现场边界、两类负例。此处记录日志证据，不冒称本角色重新运行测试，也不替代主线程全量与桌面验收。

| 最终复核对象 | SHA-256 |
| --- | --- |
| EXTENSION_UPDATES.json原始字节 | `f6541d30898ae1942b3b21d08c6e5a51404db4098452a3fc1929f9655bf044ad` |
| EXTENSION_EVIDENCE.md原始字节 | `98056f7e6afb18ab98b40f81e640367cae2b749beff3392be1490fd005d3d4ca` |
| set_iconv修订UPDATES元素（JSON.stringify） | `21cbb9e101bdfd5f0b2e408e069fb6d0f3e078135e26ed5a9830e3a27cca4540` |
| `dist/knowledge/releases/1.27.1.1-feffaa9462de60b6/index.json` | `fa26b023a0d679700581b5845123b1ea7282ef3673f104acdc270184ae134eec` |
| 新发布set_iconv完整详情原始字节 | `ca4d1793721c0b1d1f975d17eba1dcdda3c7b25b8af2fe900d32006da073a269` |

本段对初审表中set_iconv继承的“退回ER01”作唯一后续覆盖：现为通过，采用上表修订元素摘要；其他69行签署及摘要继续有效。本次仍仅修改本审核文件，没有其他写入。

