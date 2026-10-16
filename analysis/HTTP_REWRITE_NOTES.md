# HTTP rewrite 全模块：7项基础内容待审

2026-10-10。完整覆盖 ngx_http_rewrite_module 的7个身份；仅准备 `content/HTTP_REWRITE_BASIC.json`，未修改正式知识或 current。基础事实据固定 Nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928 与活跃官方XML e8b581903e9d41252720053311cea687a5671674，不套用 stream 同名 set。

## 逐义与入口

- rewrite：配置编译为脚本，运行时匹配当前URI。last/break/redirect/permanent、自动HTTP(S)/$scheme重定向、新旧参数追加及尾问号清除分别核实际编译与正则执行代码；不是把所有flag都解释为结束请求。
- return：状态和表达式在配置阶段编译；HTTP(S)/$scheme单参数采用302。301/302/303/307/308走Location，其他带文本状态走正文路径。444仅说明无文本 `return 444;` 的请求终止分支，不把特殊代码说成保证发送的报文或扩大到任意带正文形式。
- break：退出当前脚本组，并在URI已改变时清除重新匹配标志，不结束后续请求阶段。if：空或恰为单字符0才是假；比较、正则和文件测试是限定语法，location内还切换请求配置，不是通用条件语言。
- set：表达式编译后在请求变量数组赋值或调用已有setter；目标$语法及不可变变量由真实注册入口检查，不当作环境或共享变量赋值。变量/捕获组合与执行顺序明确，完整指令组继承仍保持unknown。
- rewrite_log：notice级别的匹配/改写日志；off不屏蔽其他日志或HTTP debug条件。uninitialized_variable_warn：仅本模块未赋值变量warn开关，off仍返回空值，不自动修复初始化。

七条都保存真实callback显式定义、module-owner、运行片段与同名活跃XML。两个开关的默认/继承核到merge；其余可选默认/完整组继承明确unverified，不把空default节点作为确定性依据。所列context按真实注册保留server/location及各自if区别，不新造配置域。

## 实际隔离检查

mkdtemp内回放固定34项有效补丁与核定版本替换：142个hunk的数量/偏移/fuzz和47个最终SHA256一致。全部60处注册、callback与证据均在有效EOF内，其中46段上游片段在补丁后完整保留；只给所列事实verified_unaffected，不声称整个请求或日志链不受补丁影响。finally已清理源码副本，未编译、运行OpenResty或执行来源生成器。

实际隔离构建基于172条正式知识仅追加本7条，通过全部发布/来源/callback门禁：1017注册、179基础、0深度、范围true，临时候选 `1.27.1.1-62c29cab01ee7074`；临时副本与产物已finally清理，根current未变。该隔离候选属于R17修正前记录，不替代修正后最终发布身份。须独立逐项审核通过才由主接入，不计当前正式覆盖。

## WC-R17最小修正

独立审核指出444不可无协议限定保证终止整条传输连接。主读取固定HTTP请求结束路径3665–3695及HTTP/2关闭流4397–4440，确认HTTP/2可只关闭stream；将return第二限制收窄为进入请求终止路径，不扩写新协议细节或新增来源字段。仅正文一句变化，其余6条、引用及补丁依据不变，交差异复核，不冒称7项整体审核已过。
