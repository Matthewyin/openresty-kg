# C02：Echo 19项与 Headers More 3项待审内容

2026-10-10。状态：内容块 ready，交 Astra 逐条审核后由主合并；当前 JSON 是独立待审输入，未改变正式知识或发布状态。

## 交付、冻结来源与差集

交付 [ECHO_HEADERS_BASIC.json](content/ECHO_HEADERS_BASIC.json)，顶层是22个对象的数组，沿用 `knowledge/directives.json` 的 object schema。每项都有独立 summary/syntax/mechanism、明确 callback_definition、原文 evidence、限定范围的 patch_status，以及事实级 source_ids。没有写入 verification=basic_verified；是否合并和发布由审核/主处理。

基线为用户交接的 candidate `1.27.1.1-5f8eaad2509aaff6`。本次实际读取正式 catalog 共1017项、主 knowledge 共29项；两个模块合计23条注册，已有 more_set_headers，其余22项全部进入本文件。身份来自正式 catalog，差集校验为：缺失0、额外0、重复0、与现有知识重叠0。没有更改 more_set_headers。

| 来源 | 固定版本 / revision | 用途 |
|---|---|---|
| echo-nginx-module | v0.63 / `8376edc2bbc427e8812d105f4061045449e0db2b` | 注册、配置回调、执行分派、参数解析、文档及测试规格 |
| headers-more-nginx-module | v0.37 / `06dc0be56e5ec9f7fd814e881b066b5540a85bec` | 注册、配置回调、输入/输出头处理、rewrite 尾部处理、合并、文档及测试规格 |
| Nginx | release-1.27.1 / `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928` | echo_status 数字 slot，以及被引用的公共 API/解析函数 |
| OpenResty | v1.27.1.1 / `8c37412c31621225e7aa7e825b5b50106c9c71c4` | 发行来源段、34项有效补丁及其应用顺序 |

所有源码通过完整 SHA 的 Git 对象读取；工作树修改不参与取证。沿用 research 的一手来源研究方式，直接完成，不嵌套 Agent。没有联网下载、编译/运行 OpenResty、UI/浏览器操作，也未改主 knowledge/build/config、inventory 或正式产物。

完整新增身份差集如下；正式稳定ID采用 `component--module--name`：

```text
echo-nginx-module--ngx_http_echo_module--echo
echo-nginx-module--ngx_http_echo_module--echo_request_body
echo-nginx-module--ngx_http_echo_module--echo_sleep
echo-nginx-module--ngx_http_echo_module--echo_flush
echo-nginx-module--ngx_http_echo_module--echo_blocking_sleep
echo-nginx-module--ngx_http_echo_module--echo_reset_timer
echo-nginx-module--ngx_http_echo_module--echo_before_body
echo-nginx-module--ngx_http_echo_module--echo_after_body
echo-nginx-module--ngx_http_echo_module--echo_location_async
echo-nginx-module--ngx_http_echo_module--echo_location
echo-nginx-module--ngx_http_echo_module--echo_subrequest_async
echo-nginx-module--ngx_http_echo_module--echo_subrequest
echo-nginx-module--ngx_http_echo_module--echo_duplicate
echo-nginx-module--ngx_http_echo_module--echo_read_request_body
echo-nginx-module--ngx_http_echo_module--echo_foreach_split
echo-nginx-module--ngx_http_echo_module--echo_end
echo-nginx-module--ngx_http_echo_module--echo_abort_parent
echo-nginx-module--ngx_http_echo_module--echo_exec
echo-nginx-module--ngx_http_echo_module--echo_status
headers-more-nginx-module--ngx_http_headers_more_filter_module--more_clear_headers
headers-more-nginx-module--ngx_http_headers_more_filter_module--more_set_input_headers
headers-more-nginx-module--ngx_http_headers_more_filter_module--more_clear_input_headers
```

## 逐项语义与配置入口

Echo 注册位于 [src/ngx_http_echo_module.c:92–223](https://github.com/openresty/echo-nginx-module/blob/8376edc2bbc427e8812d105f4061045449e0db2b/src/ngx_http_echo_module.c#L92-L223)，19项都是 `NGX_HTTP_LOC_CONF|NGX_HTTP_LIF_CONF`，即 HTTP location / location 内 if。Headers More 本批三项位于 [src/ngx_http_headers_more_filter_module.c:49–71](https://github.com/openresty/headers-more-nginx-module/blob/06dc0be56e5ec9f7fd814e881b066b5540a85bec/src/ngx_http_headers_more_filter_module.c#L49-L71)，允许 http/server/location/location 内 if，不含 server 内 if。22项的注册级 compile_guards 均为空；源码内部的版本兼容和条件分支保留在相应证据中，空 guard 不代表实际二进制已启用模块。

下表 Echo 回调定义均在 `src/ngx_http_echo_module.c`，符号是正式 catalog 的 callback（例如 echo 对应 ngx_http_echo_echo）。只有 echo_status 是显式 `component: nginx` 的 `src/core/ngx_conf_file.c:1167–1194`。没有 NDK 回调或猜测跨仓库同名函数。

| 指令 | 配置回调定义范围 | 核定的必需语义 / 请求侧证据 |
|---|---|---|
| echo | 397–408 | 输出空格连接参数及可选换行；echo_echo.c:79–225，util.c:39–104，README:348–455 |
| echo_request_body | 412–424 | 输出已读缓冲链，未读则无本项输出；echo_echo.c:235–281，README:1145–1172 |
| echo_sleep | 428–433 | 请求级定时等待，返回 NGX_AGAIN 后恢复；echo_sleep.c:26–109，README:585–613 |
| echo_flush | 437–448 | 发出 NGX_HTTP_FLUSH，不保证客户端即时可见；echo_echo.c:228–232，Nginx request.c:3596–3625，README:517–579 |
| echo_blocking_sleep | 452–458 | 直接 ngx_msleep，阻塞当前 worker；echo_sleep.c:160–184，README:615–631 |
| echo_reset_timer | 462–466 | 更新 ctx->timer_begin，供 elapsed 变量计算；echo_timer.c:15–94，README:635–675 |
| echo_before_body | 470–475 | 在正文前执行 before_body_cmds；echo_filter.c:111–282，README:1284–1344 |
| echo_after_body | 479–483 | 遇正文结束标记后追加并补终止缓冲；echo_filter.c:111–282，README:1348–1407 |
| echo_location_async | 487–506 | GET子请求，成功发起后继续命令；echo_location.c:16–75，README:732–845 |
| echo_location | 510–528 | GET子请求，完成回调恢复父命令序列；echo_location.c:78–153，handler.c:383–433，README:851–921 |
| echo_subrequest_async | 532–551 | 自选方法及 -q/-b/-f，异步发起；echo_subrequest.c:62–118、200–450，README:925–1039 |
| echo_subrequest | 555–574 | 同步命令序列等待，不是 worker 阻塞；echo_subrequest.c:121–197、200–450，handler.c:383–433，README:1027–1043 |
| echo_duplicate | 578–588 | 连续重复指定字符串，不补换行；echo_echo.c:284–342，util.c:172–198，README:459–513 |
| echo_read_request_body | 592–597 | 显式读取当前请求体，自身不输出；request_info.c:25–51，handler.c:310–341，README:679–693 |
| echo_foreach_split | 601–605 | 字面分隔串、非空项、$echo_it及循环；echo_foreach.c:12–183，README:1047–1089 |
| echo_end | 609–613 | 推进/结束活动 foreach；echo_foreach.c:153–183，README:1129–1141 |
| echo_abort_parent | 617–621 | 已注册但执行分派缺该 case，走 unknown opcode 内部错误；handler.c:220–359、module.h:19–40、subrequest.c:556–633、t/abort-parent.t:1–9 |
| echo_exec | 625–629 | 普通URI/命名location内部重定向，非外部redirect；echo_subrequest.c:637–697，README:1176–1232 |
| echo_status | Nginx ngx_conf_set_num_slot:1167–1194 | 配置 status 值，独立于命令次序；echo module.c:269–291、util.c:144–169，README:1236–1271 |

表中短文件名均在 Echo 的 `src/ngx_http_echo_*.c`（例如 util.c 即 src/ngx_http_echo_util.c），Nginx 位置已单独标明。JSON 的 evidence 和 callback_definition 全部使用完整仓库相对路径，不能把表中短名当实际文件名。

Echo 通用配置 helper [module.c:295–393](https://github.com/openresty/echo-nginx-module/blob/8376edc2bbc427e8812d105f4061045449e0db2b/src/ngx_http_echo_module.c#L295-L393) 根据注册 offset 选择 handler/before/after 命令数组，保存 opcode 和参数模板；首次 handler 命令安装内容处理器，filter 命令设置 requires_filter。echo_status 使用普通数字 slot，不能套用这个“安装处理器”的机制。其 default=200 和 status 继承已按 merge 核定；其余 Echo 补充 default/inheritance 本批保留 unverified，未机械填入统一默认值。

Headers More 三项的完整配置回调为：

| 指令 | 回调与定义 | 必需语义 / 主要证据 |
|---|---|---|
| more_clear_headers | ngx_http_headers_more_clear_headers；src/ngx_http_headers_more_headers_out.c:554–559 | 输出侧 clear opcode；-t/-s同时满足，末尾*前缀清除，不接受-a；out.c:109–149、191–255、611–756；util.c:18–128；README:218–261 |
| more_set_input_headers | ngx_http_headers_more_set_input_headers；src/ngx_http_headers_more_headers_in.c:469–474 | rewrite尾部修改请求头，-r阻止为不存在的普通头新建字段；in.c:175–340、486–660；util.c:18–158；module.c:241–328；README:265–285 |
| more_clear_input_headers | ngx_http_headers_more_clear_input_headers；src/ngx_http_headers_more_headers_in.c:478–483 | rewrite尾部删除请求头，可按请求Content-Type筛选及前缀清除；与上一项共用输入处理器；README:288–338；t/input.t:1295–1311 |

此表短名 out/in/util/module 都指 `src/ngx_http_headers_more_*` 下对应文件，JSON 中无缩写。三项继承按 [filter_module.c:176–207](https://github.com/openresty/headers-more-nginx-module/blob/06dc0be56e5ec9f7fd814e881b066b5540a85bec/src/ngx_http_headers_more_filter_module.c#L176-L207) 核定：父层命令先执行，本层命令后执行；不是“本层出现就完全覆盖父层”。补充 defaults 保留 unverified。

## 审核需关注的真实差异与限制

1. **echo_abort_parent 不可按名字描述成功功能。** 注册和配置回调保存独立 opcode；完整 switch 无该 case，默认返回 NGX_HTTP_INTERNAL_SERVER_ERROR。另有 ngx_http_echo_exec_abort_parent 辅助函数，但主体在 #if 0 中，分派没有调用它；测试 skip_all 明确注明 not working at all。候选 summary 说明此版本的不可用行为。代码返回内部错误不等于响应头已发送后仍一定能给客户端新发 HTTP500，正文未作这种保证。
2. **echo_location 的查询串旧文档与当前实现冲突。** README:825 声称 URI 不能拼接查询串，但固定 echo_location.c:47–56、114–123 已调用 unsafe URI 解析并取出 args，显式第二参数优先；t/location.t:317–343给出两种场景。候选按实现记录，测试仅阅读，未执行。
3. **echo_sleep 的最小值不能照抄。** README:599写必须大于0.001，但 echo_sleep.c:38–50只检查 ngx_atofp 错误后加定时器，没有该下限；Nginx ngx_atofp:997–1047以3位定点参数解析。本批不把文档的下限当有效限制，也不把0时长解读为可靠的调度时序承诺。
4. **echo_after_body 的简写语法省略选项，不代表禁用选项。** README:1401明确支持-n/--，filter分派与echo输出实现一致。两条filter指令均是正文过滤而非独立内容处理器；header_only或无输入链会跳过正文改写。
5. **子请求体选项不是合并。** echo_subrequest.c:279–308优先非空-b，否则才处理-f；400–450负责将方法/请求体应用到子请求。-f引用文件不是源码文件编辑动作。本次不读取用户文件或执行任何请求。
6. **Headers More 请求与响应 Content-Type 筛选不同。** 输入侧 in.c:486–518对请求 Content-Type 的完整值做字节/长度匹配；不能把响应侧基于content_type_len的处理推广为请求侧会自动剥离charset。输入handler对HTTP<1.0直接跳过；clear_input共用解析器接受-r，但空值清除本来不新建普通头项。
7. **清除位置不保证最后网络响应无此头。** 模块调用后续过滤器；本文没有把more_clear_headers概括成能最终删除任意核心生成头。-a在clear输出指令会被显式拒绝，单独*也会被头解析器拒绝。

## 所列事实的补丁核对

一手发行段 [echo:565–570](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/mirror-tarballs#L565-L570)、[headers-more:607–612](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/mirror-tarballs#L607-L612) 都只有固定tag下载/解包/重命名，没有在该模块源中应用补丁。正式 config 分别连接 Echo12个C文件与Headers More4个C文件；本块从这些正式源码读取配置及执行证据，没有使用 examples 代替入口。

为核对跨组件陈述，本次在 `mkdtemp` 中以固定 Nginx `git archive` 建立副本，按 [NGINX_PATCH_AUDIT.json](NGINX_PATCH_AUDIT.json) 的34项有效补丁及 substitutions 顺序连续应用，逐一对比其47个 `patched_sha256`，全部一致。仅进行文本补丁回放，没有编译或运行Nginx/OpenResty；临时目录 finally 清理。

在最终副本提取下表完整函数，从函数名签名到配对的闭合大括号，逐字与固定上游对应函数比较，18项全部相同。原文坐标与回放后坐标分别列出，发布引用仍使用上游固定SHA，未冒充回放行号。

| Nginx文件 | 函数 | 上游行号 | 回放后行号 |
|---|---|---|---|
| src/http/ngx_http_core_module.c | ngx_http_subrequest | 2315–2495 | 2325–2505 |
| 同上 | ngx_http_internal_redirect | 2499–2550 | 2509–2560 |
| 同上 | ngx_http_named_location | 2554–2626 | 2564–2636 |
| 同上 | ngx_http_core_rewrite_phase | 922–945 | 932–955 |
| 同上 | ngx_http_core_run_phases | 863–881 | 873–891 |
| 同上 | ngx_http_send_header | 1832–1850 | 1842–1860 |
| 同上 | ngx_http_output_filter | 1854–1872 | 1864–1882 |
| 同上 | ngx_http_set_content_type | 1595–1647 | 1605–1657 |
| src/http/ngx_http_request.c | ngx_http_send_special | 3596–3625 | 3596–3625 |
| src/http/ngx_http_request_body.c | ngx_http_read_client_request_body | 32–228 | 32–228 |
| src/http/ngx_http_parse.c | ngx_http_parse_unsafe_uri | 1839–1957 | 1839–1957 |
| src/http/ngx_http_script.c | ngx_http_script_compile | 460–611 | 460–611 |
| 同上 | ngx_http_script_run | 615–660 | 615–660 |
| 同上 | ngx_http_complex_value | 58–104 | 58–104 |
| 同上 | ngx_http_compile_complex_value | 139–239 | 139–239 |
| src/core/ngx_conf_file.c | ngx_conf_set_num_slot | 1167–1194 | 1167–1194 |
| src/core/ngx_string.c | ngx_atofp | 997–1047 | 997–1047 |
| 同上 | ngx_atoi | 967–991 | 967–991 |

例如 ngx_http_subrequest 完整函数片段 SHA256 为 `9bc7176fca84cf5269bd6ef8b14d7b5f77bd6c8df15b048c3517981b41299578`，ngx_conf_set_num_slot 为 `5dd342524e587ac5f26000a19d02b71fa398b80c36cc2d79f804d5aa5ee74bcf`。摘要仅帮助复核读取/比较结果，不独自证明语义。echo_status 的数字解析、变量展开、子请求/内部跳转入口和请求体读取陈述均限定在已读取的模块实现和这些公共入口。

patch_status=verified_unaffected 只覆盖候选逐条陈述的注册/配置/模块执行与列明公共入口；不宣称Nginx全局无补丁影响。例如server_header、no_error_pages以及事件相关补丁仍改变其他路径；本文没有承诺最终错误页、所有过滤器顺序或实际时间/网络行为。没有把“模块未被直接patch”推广成完整运行链不变。

## 静态验收与交接

实际执行只读校验：22身份与正式 catalog 减去现有知识的目标差集完全一致；全部 callback_definition 的 component/file/range包含正式callback的真实函数定义；209个证据/回调范围合法，读取30个不同固定源文件；每个fact/patch source_id都可解析，所有证据ID无冲突，当前 build 的 prepareKnowledgeFacts 接受22项明确patch状态。此次为静态候选校验，没有正式或隔离网站build，不将机械门禁当作语义审核。

补充 default/inheritance 未核部分保留 `{status: unverified, text: null, source_ids: []}`；echo_status的200及继承、Headers More父先子后的命令继承有对应merge原文，才标记verified。语义正文与特殊差异逐条写入，未用名称翻译或默认模板把22项标成已审核basic。

审核输出应逐项核对本表与JSON；通过后由主合并这22个对象，既有more_set_headers保持。若主仍以29输入为基线，合并后候选输入应为51，但这里只提供预期，不报告已发布计数。只写本notes和ECHO_HEADERS_BASIC.json，当前停止写入；剩余九模块66项待主另给写集与授权，不在本交付中提前扩展。

交接冻结：JSON SHA256 `015542f82aff8675cb269d2a661463f88ea994f7fd8f80bf356c19d88e572a85`。最终复核仍为 catalog1017 / 主知识29 / 本块22，209个范围检查通过，两个模块源码仓库均clean且HEAD等于上表固定SHA。
