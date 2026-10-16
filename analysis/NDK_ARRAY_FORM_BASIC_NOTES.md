# P20 NDK列表、数组与表单7项基础内容

2026-10-12主准备。仅新增content/NDK_ARRAY_FORM_BASIC.json和本记录，未改正式知识或C01注册路径。JSON SHA256：8c46fc9bb83f343b87459732d1426463b2293df0bab870c7c55eabfb9e3a5307。完整覆盖NDK1、array-var4、form-input2三个owner当前差集；set-misc29、iconv3和encrypted-session5仍由主继续，不借七项代表P20全44完成。

## 固定来源与事实边界

NDK 91e30eb05085e7f9762f130cbb883a0e753cf74d；array-var 32188f86599b47f7cd34340e5a2985bd9d550bf8；form-input 43ee690c359c06af7d178379cfc37ebc858d9de2。三者HEAD与clean状态均现场核对，最终来源由固定git show读取。共享Nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928；OpenResty 8c37412c31621225e7aa7e825b5b50106c9c71c4。未执行生成器/配置脚本，只复用正式目录已审核的owner和include证据。

| 名称 | 真正配置回调 | 逐义核定 |
| --- | --- | --- |
| upstream_list | ndk_upstream_list.c:59–180 | main_conf共享列表、名字不分大小写查重和读取；按权重展开字符串桶，不解析成upstream对象。无数字前缀权重1，数字前缀要求冒号；纯数字报错，未声称对权重/空内容有额外验证。NDK条件、set-misc启用及发行默认组合分开。 |
| array_split | array_var_module.c:132–222 | 421–522及util23–42核字节切分、max0不限制、保留末项、to或原地目标；空分隔按字节非Unicode。 |
| array_map | array_var_module.c:226–298 | 526–607及util97–118核复杂模板、array_it在成功末尾失效、原地/新数组及内部数组类型。 |
| array_map_op | array_var_module.c:302–363 | 611–684及util47–93核运行时模块遍历，只接受ndk_set_var_value配置入口且post非空的同名指令；不是任意指令调用。 |
| array_join | array_var_module.c:367–417 | 688–756核空数组、逐字节连接及to；README本节syntax误写array_split，以真实回调为准。不自动转义。 |
| set_form_input | form_input_module.c:307–352 | 单值93–124、共用169–303解析返回首字段；原字节未解码%XX/+。 |
| set_form_input_multi | 同上 | 多值128–160；读取完成的解析路径给内部数组，但ctx未就绪给空字符串，不能说永远输出数组。 |

form-input357–523核POST/PUT、Content-Type前缀条件、rewrite读正文及异步恢复，不改为严格MIME解析的概括；磁盘缓冲无读取支持，多buffer遇in_file直接停止提取。server context合法与server rewrite时正文就绪是不同事实。NDK ndk_set_var.c45–214、254–562及ndk_rewrite.c12–67核转换函数与rewrite字节码编译；共享Nginx rewrite136–184、272–294核运行挂接。继承均保留unverified，没有把指令模块无merge当成rewrite脚本完全不继承。

已读对应固定README和NDK docs/upstream/list；配置依赖来自两个使用方config，不根据组件名称猜。NDK注册的module-owner/owner-include/registration-container由catalog自动携入，不重复覆盖来源ID。发行脚本对应NDK/set-misc578–589、array642–647、form663–668连续无直接patch操作；Nginx补丁另按下面回放。

## 实际验证

最初来源检查误用OpenResty根configure路径，固定git show拒绝后改为util/configure，未把失败当通过。独立mkdtemp内真实回放34项发行patch，142hunk匹配及47最终SHA通过；100处原显式来源有效EOF，其中12段Nginx rewrite原文全部保持，无变化片段。随后新增7处component-distribution来源分别读取固定原文并核组件名称及EOF，不因只加发行引用重跑无变化patch；最终107处显式来源。

隔离以正式593/e33f9a74f8157679加7项构建，真实通过既有build和发布门禁：1017注册、600基础、417仅注册、0深度，临时release为1.27.1.1-1c1a37c1f05d9b5a。七项basic及owner差集相等、身份无重复；正式current前后字节保持。两个临时目录finally清理，不留下临时dist，不读实际用户请求体或运行Nginx。此为准备结果，仍待独立语义审核，不计入正式593。
