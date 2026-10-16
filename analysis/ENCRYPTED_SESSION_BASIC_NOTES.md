# P20 encrypted-session完整5项基础内容

2026-10-13主准备，仅新增content/ENCRYPTED_SESSION_BASIC.json与本记录，未修改正式知识。JSON SHA256 eeb6f34620bf0aa684c4bf5aa35e1588e87ad4c52cf98d9304bc6ed8a087af87；完整覆盖本owner五身份。

固定模块0f81b5728db0ece0f60c72354da69f158dc1d2a7，HEAD及clean已核。完整读module.c、cipher.c/.h、config、README指令章节及t/sanity.t:20–120第二信号；测试只读，未执行Nginx/加解密、未读取用户密钥、IV或会话数据。共享NDK、Nginx、OpenResty仍按项目固定SHA取git show。

key回调239–263要求原始32字节，不作解码或KDF；iv267–302按EVP_MAX_IV_LENGTH上限、短值清零补齐，默认源码固定deadbeefdeadbeef，不声称随机IV；expires306–327按秒解析，merge394–425默认86400。加密155–196与cipher24–132核原值加8字节时间、MD5摘要前缀与AES-256-CBC数据；不是HMAC、JWT或自动Base64。解密200–235与cipher138–269核格式/摘要/内嵌到期时间，时间0不拒绝、非零<=now拒绝；没有使用解密端expires重新计算。

两set指令真正配置callback是NDK ndk_set_var_value574–586，支持省略输入后原地转换；模块57–69完整filter对象绑定各运行函数，331–390核OpenSSL版本分支reset。NDK finalize及Nginx rewrite挂接有固定来源。缺key返回NGX_ERROR与其他cipher错误转空结果/NGX_OK分开；空结果也可能合法空明文，不写成认证成功或自动401。配置与转换不自动建立服务端session或Cookie。

五项默认已核，三个配置字段继承按merge核定；两set的rewrite继承保留unknown。编译依赖来自config与openssl头/API，不从模块名推断实际部署启用。固定发行676–680只有解包，没有直接patch；Nginx共享局部另在实际回放比较。

mkdtemp固定git archive真实回放34patch、142hunks、47最终SHA通过，81处显式引用有效EOF，4段Nginx rewrite原文保持。准备后将两项filter引用收整为57–69、lifecycle收整至390，追加行已现场读取，均为同一无直接补丁组件，不重复全批回放。真实隔离build660+5=665、352仅注册、1017注册、0deep；修后candidate1.27.1.1-b7a0ead15e69446d（原2110ad467dea9369属补全来源前候选）。五项basic、完整owner差集及无重复通过；current前后字节不变。临时目录finally清理。交独立语义审核，正式仍660，不宣称P20/C02全部完成。
