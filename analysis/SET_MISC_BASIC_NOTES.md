# P20 set-misc完整29项基础内容

2026-10-13主准备，仅新增content/SET_MISC_BASIC.json及本记录。固定版本31c4ad67bb9e392a734e4e58ea8048e24012311f（0.33），HEAD及clean已核；JSON SHA256 bd9ef4c1de2fca2410218b7dbf8e5abd3b608d82c0a925d7de1126979c5d2d71。29身份精确覆盖完整owner，与正式670无交集；P20另15项已各自准备但均按独立审核结果计入，不在此冒称全44已通过。

## 实际阅读与逐义边界

完整阅读module.c及所有17个运算C文件、module.h/config，README每项的标题/语法/默认/phase与说明起段，补读已涉及的说明；每项取固定文档15行，细节以源码为依据。共享NDK set_var/rewrite、Nginx core字符串/Base64/hex/hash/setter及rewrite执行/挂接按固定版本读取。不调用外部服务、随机设备、密码库或数据库，只研究源码。

- Base64四项：标准+/有填充与URL安全-_无填充分开。解码遇首个=停止有效扫描，未严格校验后续内容，不能描述为严格格式验证；非法有效字母/模4为1由Nginx返回错误。
- hex两项与MD5/SHA1：编码小写hex、解码偶数长度/大小写A–F；摘要输出32/40位hex，不混二进制。SHA1及NGX_HTTP_SET_HASH注册条件保留，模块头的新Nginx宏补充有来源。
- HMAC两项：真实TAKE3为目标+密钥+输入；README只给目标的第二条syntax不采纳。结果原始二进制，NGX_OPENSSL及config条件保留。
- URI两项：模块自有字节表及状态机，不借当前Nginx其他escape语义；unescape实际type0会解+为空格、不中断于?，非法/截断%序列不保证报错。
- SQL/PGSQL/JSON三项：SQL空值为两个单引号，转义$等指定字节；PG非空E前缀及内部UTF检查/高位八进制分支，未说完整字符集验证；JSON空值为null不是空字符串，高位字节不验证UTF-8。不把字面量转换写成数据库参数绑定。
- set_if_empty：只按not_found/len0选择默认，0字符串不空；NDK先编译两个输入，不承诺惰性求值。set_hashed_upstream按小写键hash再取模，字面列表配置期、变量列表运行期找NDK列表，空/单桶分别处理；不是健康检查或一致性哈希。
- Base32五项：默认小写base32hex和填充on，旧set_misc_base32_padding顶层deprecated:true且仍写相同flag后告警；不是参数忽略。alphabet仅检查32字节，重复字符解码表后写覆盖。decode长度模8及首=条件明确，失败转空/NGX_OK；create/merge未初始化全部basis32，故不保证严格拒绝所有表外字节。
- 日期三项：缓存时间/时区与GMT、本地libc时间分开，格式输出缓冲宏默认256字节，空格式与strftime失败分开；set_local_today只有目标参数。
- 随机三项：set_random实际rand取模、非负端点及交换；secure两项/dev/urandom读足1–64、模62/26映射，不附严格无偏保证。set_rotate保存在worker内location配置current，非跨worker计数器；原值空/无效回退及越界回绕明确。

除三个Base32配置字段之外，值指令通过NDK编译入rewrite，读取Nginx两类rewrite挂接，不把文档较窄context替代正式注册。转换指令继承按需求允许保留unknown，不从模块有无merge猜rewrite脚本继承。

## 来源和实际验证

固定git show逐段检查463处显式来源真实EOF；66段Nginx原文在mkdtemp实际34patch回放后全部保持，142hunk匹配及47最终SHA均通过。随后仅把专用callback起点收整为hash95、rotate99–112及字符串槽1066–1089，都是原证明子集，没有新事实，不重复补丁回放。发行585–589只解包set-misc，无直接patch；NDK引用也用固定SHA，未执行生成器。

第一次隔离build与主660→670正式发布时间重叠，虽临时699构建完成，finally的current字节保持断言捕获了主授权更新，因此该次不计通过。主670冻结后重新运行完整隔离build：670+29=699基础、318仅注册、1017注册、0深度，candidate1.27.1.1-8e843b5829b9f168；29项basic、owner全集差集及唯一身份通过，正式current前后字节一致。两次临时目录均finally清理，未覆盖正式知识/发布。当前只准备完成，交独立逐项审核。
