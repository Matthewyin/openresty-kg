# 340补证：E组主线程独立源码审核

日期：2026-10-15。状态：执行中。只审核固定清单E组92身份128字段；VTS两项另见DEFAULTS_340_REVIEW.md。实施产物、源码语义、发布测试和真实页面验收分别记录，不以状态数量推断完成。

## 深度交互：审核边界

主线程直接读取固定Git对象，实施说明只作定位入口。尚未逐条完成的模块保持待审。补丁回放记录为defaults-340-patch-replay.json：34个补丁、47个最终文件摘要通过；隔离副本由现有脚本自动清理。另直接核对全部补丁目标文件，rewrite、HTTP配置组织、公共配置setter不在改动文件中；core merge的no_error_pages补丁只改变错误页字段，不能由此推导handler继承。

## 直接执行：Echo18项

固定来源8376edc2bbc427e8812d105f4061045449e0db2b。已完整读取module.c命令表、create/merge、所有18个callback与helper（92–650附近）；handler.c:155–379完整分派；filter.c:55–190前后正文消费。对照18项目标说明逐一核对：16项绑定handler_cmds，before_body及after_body各自绑定独立数组。pcalloc不预置动作；merge按NULL逐数组复用父表，子表非空不追加父表。helper仅为handler类别安装core handler。另读固定Nginx core:1252–1262、1381–1383，列表继承不等于入口复制。

18个defaults的省略语义通过初审：未配置无对应动作，不把省略当禁止父表；abort_parent仅说明不产生opcode，不宣称此动作有效。18个inheritance共同退回E01：`同层命令按保存顺序执行`忽略foreach/end、exec提前退出和abort_parent无分派。最小修正为按配置顺序保存、实际执行受控制流约束；abort_parent另明确分派缺口。修正及逐ID来源集合检查完成前不计整项通过。

## Headers More4项

固定来源06dc0be56e5ec9f7fd814e881b066b5540a85bec。直接读取filter_module.c:25–320注册、create、完整merge及输入/输出过滤入口；headers_out.c:545–558、630–659及headers_in.c:469–482、538–565两个setter族及数组创建追加。

- more_set_headers / inheritance：语义通过。子NULL或空表复用父表；非空子表前插父表；同一cmds内输入/输出由is_input分别消费，不是子级配置整组覆盖。
- more_clear_headers / defaults：语义通过。不自动创建命令，不把未配置解释为清除所有头或阻止继承。
- more_set_input_headers / defaults：语义通过。创建NULL，显式配置追加，父表可经merge进入子表。
- more_clear_input_headers / defaults：语义通过。创建NULL，显式配置追加，父表可经merge进入子表。

本节仅签署4个目标字段源码语义；正式集成后仍须逐项引用、非目标保真、构建测试与桌面检查。

## E01复核及22项字段签署

实施已将18项继承说明改为“按配置顺序保存，实际执行受相应控制流约束”；abort_parent明确没有对应case、进入unknown opcode错误分支。主线程对照已读取的固定分派再次核对，E01关闭。首22项实施对象JSON.stringify聚合摘要：ea926a609ad4779dda359725d78dbfec1416a7d0fe0fc80103d1737828e465d8。

22项共40字段在发布1.27.1.1-ea92fbc05c58dbe5中通过固定源码原文、引用ID、Git revision、旧字段保真专项；同批318项测试全过。源码语义及证据通过不替代未完成的真实页面验收。

| 完整身份 | defaults | inheritance |
| --- | --- | --- |
| echo-nginx-module--ngx_http_echo_module--echo | 通过 | 通过 |
| echo-nginx-module--ngx_http_echo_module--echo_request_body | 通过 | 通过 |
| echo-nginx-module--ngx_http_echo_module--echo_sleep | 通过 | 通过 |
| echo-nginx-module--ngx_http_echo_module--echo_flush | 通过 | 通过 |
| echo-nginx-module--ngx_http_echo_module--echo_blocking_sleep | 通过 | 通过 |
| echo-nginx-module--ngx_http_echo_module--echo_reset_timer | 通过 | 通过 |
| echo-nginx-module--ngx_http_echo_module--echo_before_body | 通过 | 通过 |
| echo-nginx-module--ngx_http_echo_module--echo_after_body | 通过 | 通过 |
| echo-nginx-module--ngx_http_echo_module--echo_location_async | 通过 | 通过 |
| echo-nginx-module--ngx_http_echo_module--echo_location | 通过 | 通过 |
| echo-nginx-module--ngx_http_echo_module--echo_subrequest_async | 通过 | 通过 |
| echo-nginx-module--ngx_http_echo_module--echo_subrequest | 通过 | 通过 |
| echo-nginx-module--ngx_http_echo_module--echo_duplicate | 通过 | 通过 |
| echo-nginx-module--ngx_http_echo_module--echo_read_request_body | 通过 | 通过 |
| echo-nginx-module--ngx_http_echo_module--echo_foreach_split | 通过 | 通过 |
| echo-nginx-module--ngx_http_echo_module--echo_end | 通过 | 通过 |
| echo-nginx-module--ngx_http_echo_module--echo_abort_parent | 通过 | 通过 |
| echo-nginx-module--ngx_http_echo_module--echo_exec | 通过 | 通过 |
| headers-more-nginx-module--ngx_http_headers_more_filter_module--more_set_headers | — | 通过 |
| headers-more-nginx-module--ngx_http_headers_more_filter_module--more_clear_headers | 通过 | — |
| headers-more-nginx-module--ngx_http_headers_more_filter_module--more_set_input_headers | 通过 | — |
| headers-more-nginx-module--ngx_http_headers_more_filter_module--more_clear_input_headers | 通过 | — |

其他70身份改由复用的Astra审核者独立核对，详见DEFAULTS_340_EXTENSION_REVIEW_REST.md；不在本文预签署。
