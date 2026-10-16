# 340补证：发行扩展E组独立证据

## 深度交互：范围与判定边界

本组只处理固定manifest中component非nginx/lua-nginx-module/stream-lua-nginx-module/nginx-module-vts的92身份、128字段（43 defaults、85 inheritance）。manifest SHA-256为a685f1d87c9a3afc7812c8ca231cc137dba10db494b3d0f9b183d16c111cff90。92份f9f6详情原文SHA-256逐一匹配manifest，保持原有source_ids前缀与所有旧证据。产物是待主线程整合、独立复核的事实建议，不表示已完成构建、测试或桌面验收。

固定源码通过git show读取；未执行源码生成器、构建、运行时、补丁回放或读取私有样例。只写本MD及同名EXTENSION_UPDATES.json。动作代码、配置合并和handler安装分开，不以注册上下文或通用setter推导继承。

## 固定来源

- `nginx`：`e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`。
- `echo-nginx-module`：`8376edc2bbc427e8812d105f4061045449e0db2b`。
- `ngx_devel_kit`：`91e30eb05085e7f9762f130cbb883a0e753cf74d`。
- `set-misc-nginx-module`：`31c4ad67bb9e392a734e4e58ea8048e24012311f`。
- `rds-json-nginx-module`：`2d7e07f7c39f98bbb2a8b07f4bae4d892f00329d`。
- `headers-more-nginx-module`：`06dc0be56e5ec9f7fd814e881b066b5540a85bec`。
- `drizzle-nginx-module`：`fb6cf255d91135e18145a98a93947ead4e703b68`。
- `array-var-nginx-module`：`32188f86599b47f7cd34340e5a2985bd9d550bf8`。
- `memc-nginx-module`：`b889a6fc3e18b784b454e1bc74e5d0b3513a07ce`。
- `srcache-nginx-module`：`be22ac0dcd9245aadcaca3220da96a0c1a0285a7`。
- `form-input-nginx-module`：`43ee690c359c06af7d178379cfc37ebc858d9de2`。
- `iconv-nginx-module`：`67d55c7edd3ab0535afa1e55ec8b2cdeb5167a82`。
- `encrypted-session-nginx-module`：`0f81b5728db0ece0f60c72354da69f158dc1d2a7`。
- `redis-nginx-module`：`411fef36e130129b670fa7f2672bcad6ab2cbdd3`。
- `ngx_postgres`：`681980598529f67fcec5c7448452046764a68429`。
- `redis2-nginx-module`：`c989c829a2877132cb100f901e320921250e068d`。
- `openresty`：`8c37412c31621225e7aa7e825b5b50106c9c71c4`。

## 补丁核对口径

已完整读取固定OpenResty的34份有效Nginx补丁，并与NGINX_PATCH_AUDIT.json有效集对齐。rewrite、ngx_http.c、ngx_http_script.c、ngx_conf_file.c/h无有效补丁hunk；core模块仅no_error_pages修改error_pages初始化、合并和setter，不增加handler复制。新增公共引用逐段检查相关hunk；未重新回放，不将历史摘要当作本轮新增回放。发行各组件处理段逐项引用，仅表明该组件处理过程，不扩大为完整请求链未受影响。patch_source_ids为主整合需补入patch_status来源的ID，既有顺序不改；此产物不改patch_status文字。

## 直接执行：逐ID字段记录

### `echo-nginx-module--ngx_http_echo_module--echo`

机制核对：注册 offset=handler_cmds，专用callback经echo_helper保存opcode；pcalloc置三数组NULL，merge逐数组判空。内容执行器仅遍历当前handler_cmds；普通子location的core handler未由core merge复制。 E01修正：配置保存顺序不等于逐条执行保证；foreach/end控制循环、exec可提前转移，abort_parent缺少有效分派。

- defaults / verified：没有内置的 echo 动作或参数默认值；本层及其可用父层的 handler_cmds 均未配置本项时，不产生本项文本输出。仅本层省略时仍须按该列表的合并规则判断，不能当作禁用父列表。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`。
- inheritance / verified：按 handler_cmds 整个命令列表合并：子层列表为 NULL 时复用父列表；子层配置任何进入该列表的命令后使用自己的整张列表，不追加父列表。同层命令按配置顺序保存，实际执行受相应控制流约束。handler_cmds、before_body_cmds、after_body_cmds 分别合并；列表复制不等于 core content handler 复制，普通嵌套 location 仍需有实际内容处理入口。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`、`ext340-core-create`、`ext340-core-merge`、`ext340-core-handler`、`ext340-core-patch`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `echo-nginx-module:src/ngx_http_echo_module.c:92–97`。
- `configuration-definition` → `echo-nginx-module:src/ngx_http_echo_module.c:397–408`。
- `ext340-echo-create-merge` → `echo-nginx-module:src/ngx_http_echo_module.c:245–291`。
- `command-compiler` → `echo-nginx-module:src/ngx_http_echo_module.c:295–393`。
- `ext340-echo-consumer` → `echo-nginx-module:src/ngx_http_echo_handler.c:155–379`。
- `ext340-core-create` → `nginx:src/http/ngx_http_core_module.c:3547–3653`。
- `ext340-core-merge` → `nginx:src/http/ngx_http_core_module.c:3668–3954`。
- `ext340-core-handler` → `nginx:src/http/ngx_http_core_module.c:1381–1383`。
- `ext340-core-patch` → `openresty:patches/nginx-1.27.1-no_error_pages.patch:1–91`。

### `echo-nginx-module--ngx_http_echo_module--echo_request_body`

机制核对：注册 offset=handler_cmds，专用callback经echo_helper保存opcode；pcalloc置三数组NULL，merge逐数组判空。内容执行器仅遍历当前handler_cmds；普通子location的core handler未由core merge复制。 E01修正：配置保存顺序不等于逐条执行保证；foreach/end控制循环、exec可提前转移，abort_parent缺少有效分派。

- defaults / verified：没有内置的 echo_request_body 动作或参数默认值；本层及其可用父层的 handler_cmds 均未配置本项时，不追加本项请求体输出。仅本层省略时仍须按该列表的合并规则判断，不能当作禁用父列表。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`。
- inheritance / verified：按 handler_cmds 整个命令列表合并：子层列表为 NULL 时复用父列表；子层配置任何进入该列表的命令后使用自己的整张列表，不追加父列表。同层命令按配置顺序保存，实际执行受相应控制流约束。handler_cmds、before_body_cmds、after_body_cmds 分别合并；列表复制不等于 core content handler 复制，普通嵌套 location 仍需有实际内容处理入口。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`、`ext340-core-create`、`ext340-core-merge`、`ext340-core-handler`、`ext340-core-patch`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `echo-nginx-module:src/ngx_http_echo_module.c:99–104`。
- `configuration-definition` → `echo-nginx-module:src/ngx_http_echo_module.c:412–424`。
- `ext340-echo-create-merge` → `echo-nginx-module:src/ngx_http_echo_module.c:245–291`。
- `command-compiler` → `echo-nginx-module:src/ngx_http_echo_module.c:295–393`。
- `ext340-echo-consumer` → `echo-nginx-module:src/ngx_http_echo_handler.c:155–379`。
- `ext340-core-create` → `nginx:src/http/ngx_http_core_module.c:3547–3653`。
- `ext340-core-merge` → `nginx:src/http/ngx_http_core_module.c:3668–3954`。
- `ext340-core-handler` → `nginx:src/http/ngx_http_core_module.c:1381–1383`。
- `ext340-core-patch` → `openresty:patches/nginx-1.27.1-no_error_pages.patch:1–91`。

### `echo-nginx-module--ngx_http_echo_module--echo_sleep`

机制核对：注册 offset=handler_cmds，专用callback经echo_helper保存opcode；pcalloc置三数组NULL，merge逐数组判空。内容执行器仅遍历当前handler_cmds；普通子location的core handler未由core merge复制。 E01修正：配置保存顺序不等于逐条执行保证；foreach/end控制循环、exec可提前转移，abort_parent缺少有效分派。

- defaults / verified：没有内置的 echo_sleep 动作或参数默认值；本层及其可用父层的 handler_cmds 均未配置本项时，不设置本项异步等待。仅本层省略时仍须按该列表的合并规则判断，不能当作禁用父列表。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`。
- inheritance / verified：按 handler_cmds 整个命令列表合并：子层列表为 NULL 时复用父列表；子层配置任何进入该列表的命令后使用自己的整张列表，不追加父列表。同层命令按配置顺序保存，实际执行受相应控制流约束。handler_cmds、before_body_cmds、after_body_cmds 分别合并；列表复制不等于 core content handler 复制，普通嵌套 location 仍需有实际内容处理入口。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`、`ext340-core-create`、`ext340-core-merge`、`ext340-core-handler`、`ext340-core-patch`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `echo-nginx-module:src/ngx_http_echo_module.c:106–111`。
- `configuration-definition` → `echo-nginx-module:src/ngx_http_echo_module.c:428–433`。
- `ext340-echo-create-merge` → `echo-nginx-module:src/ngx_http_echo_module.c:245–291`。
- `command-compiler` → `echo-nginx-module:src/ngx_http_echo_module.c:295–393`。
- `ext340-echo-consumer` → `echo-nginx-module:src/ngx_http_echo_handler.c:155–379`。
- `ext340-core-create` → `nginx:src/http/ngx_http_core_module.c:3547–3653`。
- `ext340-core-merge` → `nginx:src/http/ngx_http_core_module.c:3668–3954`。
- `ext340-core-handler` → `nginx:src/http/ngx_http_core_module.c:1381–1383`。
- `ext340-core-patch` → `openresty:patches/nginx-1.27.1-no_error_pages.patch:1–91`。

### `echo-nginx-module--ngx_http_echo_module--echo_flush`

机制核对：注册 offset=handler_cmds，专用callback经echo_helper保存opcode；pcalloc置三数组NULL，merge逐数组判空。内容执行器仅遍历当前handler_cmds；普通子location的core handler未由core merge复制。 E01修正：配置保存顺序不等于逐条执行保证；foreach/end控制循环、exec可提前转移，abort_parent缺少有效分派。

- defaults / verified：没有内置的 echo_flush 动作或参数默认值；本层及其可用父层的 handler_cmds 均未配置本项时，不提交本项flush缓冲。仅本层省略时仍须按该列表的合并规则判断，不能当作禁用父列表。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`。
- inheritance / verified：按 handler_cmds 整个命令列表合并：子层列表为 NULL 时复用父列表；子层配置任何进入该列表的命令后使用自己的整张列表，不追加父列表。同层命令按配置顺序保存，实际执行受相应控制流约束。handler_cmds、before_body_cmds、after_body_cmds 分别合并；列表复制不等于 core content handler 复制，普通嵌套 location 仍需有实际内容处理入口。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`、`ext340-core-create`、`ext340-core-merge`、`ext340-core-handler`、`ext340-core-patch`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `echo-nginx-module:src/ngx_http_echo_module.c:113–118`。
- `configuration-definition` → `echo-nginx-module:src/ngx_http_echo_module.c:437–448`。
- `ext340-echo-create-merge` → `echo-nginx-module:src/ngx_http_echo_module.c:245–291`。
- `command-compiler` → `echo-nginx-module:src/ngx_http_echo_module.c:295–393`。
- `ext340-echo-consumer` → `echo-nginx-module:src/ngx_http_echo_handler.c:155–379`。
- `ext340-core-create` → `nginx:src/http/ngx_http_core_module.c:3547–3653`。
- `ext340-core-merge` → `nginx:src/http/ngx_http_core_module.c:3668–3954`。
- `ext340-core-handler` → `nginx:src/http/ngx_http_core_module.c:1381–1383`。
- `ext340-core-patch` → `openresty:patches/nginx-1.27.1-no_error_pages.patch:1–91`。

### `echo-nginx-module--ngx_http_echo_module--echo_blocking_sleep`

机制核对：注册 offset=handler_cmds，专用callback经echo_helper保存opcode；pcalloc置三数组NULL，merge逐数组判空。内容执行器仅遍历当前handler_cmds；普通子location的core handler未由core merge复制。 E01修正：配置保存顺序不等于逐条执行保证；foreach/end控制循环、exec可提前转移，abort_parent缺少有效分派。

- defaults / verified：没有内置的 echo_blocking_sleep 动作或参数默认值；本层及其可用父层的 handler_cmds 均未配置本项时，不执行本项阻塞等待。仅本层省略时仍须按该列表的合并规则判断，不能当作禁用父列表。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`。
- inheritance / verified：按 handler_cmds 整个命令列表合并：子层列表为 NULL 时复用父列表；子层配置任何进入该列表的命令后使用自己的整张列表，不追加父列表。同层命令按配置顺序保存，实际执行受相应控制流约束。handler_cmds、before_body_cmds、after_body_cmds 分别合并；列表复制不等于 core content handler 复制，普通嵌套 location 仍需有实际内容处理入口。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`、`ext340-core-create`、`ext340-core-merge`、`ext340-core-handler`、`ext340-core-patch`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `echo-nginx-module:src/ngx_http_echo_module.c:120–125`。
- `configuration-definition` → `echo-nginx-module:src/ngx_http_echo_module.c:452–458`。
- `ext340-echo-create-merge` → `echo-nginx-module:src/ngx_http_echo_module.c:245–291`。
- `command-compiler` → `echo-nginx-module:src/ngx_http_echo_module.c:295–393`。
- `ext340-echo-consumer` → `echo-nginx-module:src/ngx_http_echo_handler.c:155–379`。
- `ext340-core-create` → `nginx:src/http/ngx_http_core_module.c:3547–3653`。
- `ext340-core-merge` → `nginx:src/http/ngx_http_core_module.c:3668–3954`。
- `ext340-core-handler` → `nginx:src/http/ngx_http_core_module.c:1381–1383`。
- `ext340-core-patch` → `openresty:patches/nginx-1.27.1-no_error_pages.patch:1–91`。

### `echo-nginx-module--ngx_http_echo_module--echo_reset_timer`

机制核对：注册 offset=handler_cmds，专用callback经echo_helper保存opcode；pcalloc置三数组NULL，merge逐数组判空。内容执行器仅遍历当前handler_cmds；普通子location的core handler未由core merge复制。 E01修正：配置保存顺序不等于逐条执行保证；foreach/end控制循环、exec可提前转移，abort_parent缺少有效分派。

- defaults / verified：没有内置的 echo_reset_timer 动作或参数默认值；本层及其可用父层的 handler_cmds 均未配置本项时，不执行本项计时器重置。仅本层省略时仍须按该列表的合并规则判断，不能当作禁用父列表。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`。
- inheritance / verified：按 handler_cmds 整个命令列表合并：子层列表为 NULL 时复用父列表；子层配置任何进入该列表的命令后使用自己的整张列表，不追加父列表。同层命令按配置顺序保存，实际执行受相应控制流约束。handler_cmds、before_body_cmds、after_body_cmds 分别合并；列表复制不等于 core content handler 复制，普通嵌套 location 仍需有实际内容处理入口。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`、`ext340-core-create`、`ext340-core-merge`、`ext340-core-handler`、`ext340-core-patch`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `echo-nginx-module:src/ngx_http_echo_module.c:127–132`。
- `configuration-definition` → `echo-nginx-module:src/ngx_http_echo_module.c:462–466`。
- `ext340-echo-create-merge` → `echo-nginx-module:src/ngx_http_echo_module.c:245–291`。
- `command-compiler` → `echo-nginx-module:src/ngx_http_echo_module.c:295–393`。
- `ext340-echo-consumer` → `echo-nginx-module:src/ngx_http_echo_handler.c:155–379`。
- `ext340-core-create` → `nginx:src/http/ngx_http_core_module.c:3547–3653`。
- `ext340-core-merge` → `nginx:src/http/ngx_http_core_module.c:3668–3954`。
- `ext340-core-handler` → `nginx:src/http/ngx_http_core_module.c:1381–1383`。
- `ext340-core-patch` → `openresty:patches/nginx-1.27.1-no_error_pages.patch:1–91`。

### `echo-nginx-module--ngx_http_echo_module--echo_before_body`

机制核对：注册 offset=before_body_cmds，专用callback经echo_helper保存opcode；pcalloc置三数组NULL，merge逐数组判空。过滤器读取当前loc列表，正文前与末尾分支分别消费。 E01修正：配置保存顺序不等于逐条执行保证；foreach/end控制循环、exec可提前转移，abort_parent缺少有效分派。

- defaults / verified：没有内置的 echo_before_body 动作或参数默认值；本层及其可用父层的 before_body_cmds 均未配置本项时，不插入本项正文前内容。仅本层省略时仍须按该列表的合并规则判断，不能当作禁用父列表。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`。
- inheritance / verified：按 before_body_cmds 整个命令列表合并：子层列表为 NULL 时复用父列表；子层配置任何进入该列表的命令后使用自己的整张列表，不追加父列表。同层命令按配置顺序保存，实际执行受相应控制流约束。该列表独立于另两张 Echo 列表；配置另一类别的命令不会阻止本列表继承。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `echo-nginx-module:src/ngx_http_echo_module.c:134–139`。
- `configuration-definition` → `echo-nginx-module:src/ngx_http_echo_module.c:470–475`。
- `ext340-echo-create-merge` → `echo-nginx-module:src/ngx_http_echo_module.c:245–291`。
- `command-compiler` → `echo-nginx-module:src/ngx_http_echo_module.c:295–393`。
- `ext340-echo-consumer` → `echo-nginx-module:src/ngx_http_echo_filter.c:64–193`。

### `echo-nginx-module--ngx_http_echo_module--echo_after_body`

机制核对：注册 offset=after_body_cmds，专用callback经echo_helper保存opcode；pcalloc置三数组NULL，merge逐数组判空。过滤器读取当前loc列表，正文前与末尾分支分别消费。 E01修正：配置保存顺序不等于逐条执行保证；foreach/end控制循环、exec可提前转移，abort_parent缺少有效分派。

- defaults / verified：没有内置的 echo_after_body 动作或参数默认值；本层及其可用父层的 after_body_cmds 均未配置本项时，不插入本项正文后内容。仅本层省略时仍须按该列表的合并规则判断，不能当作禁用父列表。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`。
- inheritance / verified：按 after_body_cmds 整个命令列表合并：子层列表为 NULL 时复用父列表；子层配置任何进入该列表的命令后使用自己的整张列表，不追加父列表。同层命令按配置顺序保存，实际执行受相应控制流约束。该列表独立于另两张 Echo 列表；配置另一类别的命令不会阻止本列表继承。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `echo-nginx-module:src/ngx_http_echo_module.c:141–146`。
- `configuration-definition` → `echo-nginx-module:src/ngx_http_echo_module.c:479–483`。
- `ext340-echo-create-merge` → `echo-nginx-module:src/ngx_http_echo_module.c:245–291`。
- `command-compiler` → `echo-nginx-module:src/ngx_http_echo_module.c:295–393`。
- `ext340-echo-consumer` → `echo-nginx-module:src/ngx_http_echo_filter.c:64–193`。

### `echo-nginx-module--ngx_http_echo_module--echo_location_async`

机制核对：注册 offset=handler_cmds，专用callback经echo_helper保存opcode；pcalloc置三数组NULL，merge逐数组判空。内容执行器仅遍历当前handler_cmds；普通子location的core handler未由core merge复制。 E01修正：配置保存顺序不等于逐条执行保证；foreach/end控制循环、exec可提前转移，abort_parent缺少有效分派。

- defaults / verified：没有内置的 echo_location_async 动作或参数默认值；本层及其可用父层的 handler_cmds 均未配置本项时，不发起本项异步location子请求。仅本层省略时仍须按该列表的合并规则判断，不能当作禁用父列表。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`。
- inheritance / verified：按 handler_cmds 整个命令列表合并：子层列表为 NULL 时复用父列表；子层配置任何进入该列表的命令后使用自己的整张列表，不追加父列表。同层命令按配置顺序保存，实际执行受相应控制流约束。handler_cmds、before_body_cmds、after_body_cmds 分别合并；列表复制不等于 core content handler 复制，普通嵌套 location 仍需有实际内容处理入口。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`、`ext340-core-create`、`ext340-core-merge`、`ext340-core-handler`、`ext340-core-patch`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `echo-nginx-module:src/ngx_http_echo_module.c:148–153`。
- `configuration-definition` → `echo-nginx-module:src/ngx_http_echo_module.c:487–506`。
- `ext340-echo-create-merge` → `echo-nginx-module:src/ngx_http_echo_module.c:245–291`。
- `command-compiler` → `echo-nginx-module:src/ngx_http_echo_module.c:295–393`。
- `ext340-echo-consumer` → `echo-nginx-module:src/ngx_http_echo_handler.c:155–379`。
- `ext340-core-create` → `nginx:src/http/ngx_http_core_module.c:3547–3653`。
- `ext340-core-merge` → `nginx:src/http/ngx_http_core_module.c:3668–3954`。
- `ext340-core-handler` → `nginx:src/http/ngx_http_core_module.c:1381–1383`。
- `ext340-core-patch` → `openresty:patches/nginx-1.27.1-no_error_pages.patch:1–91`。

### `echo-nginx-module--ngx_http_echo_module--echo_location`

机制核对：注册 offset=handler_cmds，专用callback经echo_helper保存opcode；pcalloc置三数组NULL，merge逐数组判空。内容执行器仅遍历当前handler_cmds；普通子location的core handler未由core merge复制。 E01修正：配置保存顺序不等于逐条执行保证；foreach/end控制循环、exec可提前转移，abort_parent缺少有效分派。

- defaults / verified：没有内置的 echo_location 动作或参数默认值；本层及其可用父层的 handler_cmds 均未配置本项时，不发起本项同步location子请求。仅本层省略时仍须按该列表的合并规则判断，不能当作禁用父列表。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`。
- inheritance / verified：按 handler_cmds 整个命令列表合并：子层列表为 NULL 时复用父列表；子层配置任何进入该列表的命令后使用自己的整张列表，不追加父列表。同层命令按配置顺序保存，实际执行受相应控制流约束。handler_cmds、before_body_cmds、after_body_cmds 分别合并；列表复制不等于 core content handler 复制，普通嵌套 location 仍需有实际内容处理入口。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`、`ext340-core-create`、`ext340-core-merge`、`ext340-core-handler`、`ext340-core-patch`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `echo-nginx-module:src/ngx_http_echo_module.c:155–160`。
- `configuration-definition` → `echo-nginx-module:src/ngx_http_echo_module.c:510–528`。
- `ext340-echo-create-merge` → `echo-nginx-module:src/ngx_http_echo_module.c:245–291`。
- `command-compiler` → `echo-nginx-module:src/ngx_http_echo_module.c:295–393`。
- `ext340-echo-consumer` → `echo-nginx-module:src/ngx_http_echo_handler.c:155–379`。
- `ext340-core-create` → `nginx:src/http/ngx_http_core_module.c:3547–3653`。
- `ext340-core-merge` → `nginx:src/http/ngx_http_core_module.c:3668–3954`。
- `ext340-core-handler` → `nginx:src/http/ngx_http_core_module.c:1381–1383`。
- `ext340-core-patch` → `openresty:patches/nginx-1.27.1-no_error_pages.patch:1–91`。

### `echo-nginx-module--ngx_http_echo_module--echo_subrequest_async`

机制核对：注册 offset=handler_cmds，专用callback经echo_helper保存opcode；pcalloc置三数组NULL，merge逐数组判空。内容执行器仅遍历当前handler_cmds；普通子location的core handler未由core merge复制。 E01修正：配置保存顺序不等于逐条执行保证；foreach/end控制循环、exec可提前转移，abort_parent缺少有效分派。

- defaults / verified：没有内置的 echo_subrequest_async 动作或参数默认值；本层及其可用父层的 handler_cmds 均未配置本项时，不发起本项异步通用子请求。仅本层省略时仍须按该列表的合并规则判断，不能当作禁用父列表。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`。
- inheritance / verified：按 handler_cmds 整个命令列表合并：子层列表为 NULL 时复用父列表；子层配置任何进入该列表的命令后使用自己的整张列表，不追加父列表。同层命令按配置顺序保存，实际执行受相应控制流约束。handler_cmds、before_body_cmds、after_body_cmds 分别合并；列表复制不等于 core content handler 复制，普通嵌套 location 仍需有实际内容处理入口。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`、`ext340-core-create`、`ext340-core-merge`、`ext340-core-handler`、`ext340-core-patch`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `echo-nginx-module:src/ngx_http_echo_module.c:162–167`。
- `configuration-definition` → `echo-nginx-module:src/ngx_http_echo_module.c:532–551`。
- `ext340-echo-create-merge` → `echo-nginx-module:src/ngx_http_echo_module.c:245–291`。
- `command-compiler` → `echo-nginx-module:src/ngx_http_echo_module.c:295–393`。
- `ext340-echo-consumer` → `echo-nginx-module:src/ngx_http_echo_handler.c:155–379`。
- `ext340-core-create` → `nginx:src/http/ngx_http_core_module.c:3547–3653`。
- `ext340-core-merge` → `nginx:src/http/ngx_http_core_module.c:3668–3954`。
- `ext340-core-handler` → `nginx:src/http/ngx_http_core_module.c:1381–1383`。
- `ext340-core-patch` → `openresty:patches/nginx-1.27.1-no_error_pages.patch:1–91`。

### `echo-nginx-module--ngx_http_echo_module--echo_subrequest`

机制核对：注册 offset=handler_cmds，专用callback经echo_helper保存opcode；pcalloc置三数组NULL，merge逐数组判空。内容执行器仅遍历当前handler_cmds；普通子location的core handler未由core merge复制。 E01修正：配置保存顺序不等于逐条执行保证；foreach/end控制循环、exec可提前转移，abort_parent缺少有效分派。

- defaults / verified：没有内置的 echo_subrequest 动作或参数默认值；本层及其可用父层的 handler_cmds 均未配置本项时，不发起本项同步通用子请求。仅本层省略时仍须按该列表的合并规则判断，不能当作禁用父列表。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`。
- inheritance / verified：按 handler_cmds 整个命令列表合并：子层列表为 NULL 时复用父列表；子层配置任何进入该列表的命令后使用自己的整张列表，不追加父列表。同层命令按配置顺序保存，实际执行受相应控制流约束。handler_cmds、before_body_cmds、after_body_cmds 分别合并；列表复制不等于 core content handler 复制，普通嵌套 location 仍需有实际内容处理入口。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`、`ext340-core-create`、`ext340-core-merge`、`ext340-core-handler`、`ext340-core-patch`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `echo-nginx-module:src/ngx_http_echo_module.c:169–174`。
- `configuration-definition` → `echo-nginx-module:src/ngx_http_echo_module.c:555–574`。
- `ext340-echo-create-merge` → `echo-nginx-module:src/ngx_http_echo_module.c:245–291`。
- `command-compiler` → `echo-nginx-module:src/ngx_http_echo_module.c:295–393`。
- `ext340-echo-consumer` → `echo-nginx-module:src/ngx_http_echo_handler.c:155–379`。
- `ext340-core-create` → `nginx:src/http/ngx_http_core_module.c:3547–3653`。
- `ext340-core-merge` → `nginx:src/http/ngx_http_core_module.c:3668–3954`。
- `ext340-core-handler` → `nginx:src/http/ngx_http_core_module.c:1381–1383`。
- `ext340-core-patch` → `openresty:patches/nginx-1.27.1-no_error_pages.patch:1–91`。

### `echo-nginx-module--ngx_http_echo_module--echo_duplicate`

机制核对：注册 offset=handler_cmds，专用callback经echo_helper保存opcode；pcalloc置三数组NULL，merge逐数组判空。内容执行器仅遍历当前handler_cmds；普通子location的core handler未由core merge复制。 E01修正：配置保存顺序不等于逐条执行保证；foreach/end控制循环、exec可提前转移，abort_parent缺少有效分派。

- defaults / verified：没有内置的 echo_duplicate 动作或参数默认值；本层及其可用父层的 handler_cmds 均未配置本项时，不重复输出本项字符串。仅本层省略时仍须按该列表的合并规则判断，不能当作禁用父列表。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`。
- inheritance / verified：按 handler_cmds 整个命令列表合并：子层列表为 NULL 时复用父列表；子层配置任何进入该列表的命令后使用自己的整张列表，不追加父列表。同层命令按配置顺序保存，实际执行受相应控制流约束。handler_cmds、before_body_cmds、after_body_cmds 分别合并；列表复制不等于 core content handler 复制，普通嵌套 location 仍需有实际内容处理入口。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`、`ext340-core-create`、`ext340-core-merge`、`ext340-core-handler`、`ext340-core-patch`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `echo-nginx-module:src/ngx_http_echo_module.c:176–181`。
- `configuration-definition` → `echo-nginx-module:src/ngx_http_echo_module.c:578–588`。
- `ext340-echo-create-merge` → `echo-nginx-module:src/ngx_http_echo_module.c:245–291`。
- `command-compiler` → `echo-nginx-module:src/ngx_http_echo_module.c:295–393`。
- `ext340-echo-consumer` → `echo-nginx-module:src/ngx_http_echo_handler.c:155–379`。
- `ext340-core-create` → `nginx:src/http/ngx_http_core_module.c:3547–3653`。
- `ext340-core-merge` → `nginx:src/http/ngx_http_core_module.c:3668–3954`。
- `ext340-core-handler` → `nginx:src/http/ngx_http_core_module.c:1381–1383`。
- `ext340-core-patch` → `openresty:patches/nginx-1.27.1-no_error_pages.patch:1–91`。

### `echo-nginx-module--ngx_http_echo_module--echo_read_request_body`

机制核对：注册 offset=handler_cmds，专用callback经echo_helper保存opcode；pcalloc置三数组NULL，merge逐数组判空。内容执行器仅遍历当前handler_cmds；普通子location的core handler未由core merge复制。 E01修正：配置保存顺序不等于逐条执行保证；foreach/end控制循环、exec可提前转移，abort_parent缺少有效分派。

- defaults / verified：没有内置的 echo_read_request_body 动作或参数默认值；本层及其可用父层的 handler_cmds 均未配置本项时，不通过本项主动读取请求体。仅本层省略时仍须按该列表的合并规则判断，不能当作禁用父列表。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`。
- inheritance / verified：按 handler_cmds 整个命令列表合并：子层列表为 NULL 时复用父列表；子层配置任何进入该列表的命令后使用自己的整张列表，不追加父列表。同层命令按配置顺序保存，实际执行受相应控制流约束。handler_cmds、before_body_cmds、after_body_cmds 分别合并；列表复制不等于 core content handler 复制，普通嵌套 location 仍需有实际内容处理入口。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`、`ext340-core-create`、`ext340-core-merge`、`ext340-core-handler`、`ext340-core-patch`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `echo-nginx-module:src/ngx_http_echo_module.c:183–188`。
- `configuration-definition` → `echo-nginx-module:src/ngx_http_echo_module.c:592–597`。
- `ext340-echo-create-merge` → `echo-nginx-module:src/ngx_http_echo_module.c:245–291`。
- `command-compiler` → `echo-nginx-module:src/ngx_http_echo_module.c:295–393`。
- `ext340-echo-consumer` → `echo-nginx-module:src/ngx_http_echo_handler.c:155–379`。
- `ext340-core-create` → `nginx:src/http/ngx_http_core_module.c:3547–3653`。
- `ext340-core-merge` → `nginx:src/http/ngx_http_core_module.c:3668–3954`。
- `ext340-core-handler` → `nginx:src/http/ngx_http_core_module.c:1381–1383`。
- `ext340-core-patch` → `openresty:patches/nginx-1.27.1-no_error_pages.patch:1–91`。

### `echo-nginx-module--ngx_http_echo_module--echo_foreach_split`

机制核对：注册 offset=handler_cmds，专用callback经echo_helper保存opcode；pcalloc置三数组NULL，merge逐数组判空。内容执行器仅遍历当前handler_cmds；普通子location的core handler未由core merge复制。成对控制结构随整张列表保留或替换，不跨列表补配另一半。 E01修正：配置保存顺序不等于逐条执行保证；foreach/end控制循环、exec可提前转移，abort_parent缺少有效分派。

- defaults / verified：没有内置的 echo_foreach_split 动作或参数默认值；本层及其可用父层的 handler_cmds 均未配置本项时，不创建本项遍历起点。仅本层省略时仍须按该列表的合并规则判断，不能当作禁用父列表。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`。
- inheritance / verified：按 handler_cmds 整个命令列表合并：子层列表为 NULL 时复用父列表；子层配置任何进入该列表的命令后使用自己的整张列表，不追加父列表。同层命令按配置顺序保存，实际执行受相应控制流约束。handler_cmds、before_body_cmds、after_body_cmds 分别合并；列表复制不等于 core content handler 复制，普通嵌套 location 仍需有实际内容处理入口。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`、`ext340-core-create`、`ext340-core-merge`、`ext340-core-handler`、`ext340-core-patch`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `echo-nginx-module:src/ngx_http_echo_module.c:190–195`。
- `configuration-definition` → `echo-nginx-module:src/ngx_http_echo_module.c:601–605`。
- `ext340-echo-create-merge` → `echo-nginx-module:src/ngx_http_echo_module.c:245–291`。
- `command-compiler` → `echo-nginx-module:src/ngx_http_echo_module.c:295–393`。
- `ext340-echo-consumer` → `echo-nginx-module:src/ngx_http_echo_handler.c:155–379`。
- `ext340-core-create` → `nginx:src/http/ngx_http_core_module.c:3547–3653`。
- `ext340-core-merge` → `nginx:src/http/ngx_http_core_module.c:3668–3954`。
- `ext340-core-handler` → `nginx:src/http/ngx_http_core_module.c:1381–1383`。
- `ext340-core-patch` → `openresty:patches/nginx-1.27.1-no_error_pages.patch:1–91`。

### `echo-nginx-module--ngx_http_echo_module--echo_end`

机制核对：注册 offset=handler_cmds，专用callback经echo_helper保存opcode；pcalloc置三数组NULL，merge逐数组判空。内容执行器仅遍历当前handler_cmds；普通子location的core handler未由core merge复制。成对控制结构随整张列表保留或替换，不跨列表补配另一半。 E01修正：配置保存顺序不等于逐条执行保证；foreach/end控制循环、exec可提前转移，abort_parent缺少有效分派。

- defaults / verified：没有内置的 echo_end 动作或参数默认值；本层及其可用父层的 handler_cmds 均未配置本项时，不创建本项遍历终点。仅本层省略时仍须按该列表的合并规则判断，不能当作禁用父列表。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`。
- inheritance / verified：按 handler_cmds 整个命令列表合并：子层列表为 NULL 时复用父列表；子层配置任何进入该列表的命令后使用自己的整张列表，不追加父列表。同层命令按配置顺序保存，实际执行受相应控制流约束。handler_cmds、before_body_cmds、after_body_cmds 分别合并；列表复制不等于 core content handler 复制，普通嵌套 location 仍需有实际内容处理入口。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`、`ext340-core-create`、`ext340-core-merge`、`ext340-core-handler`、`ext340-core-patch`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `echo-nginx-module:src/ngx_http_echo_module.c:197–202`。
- `configuration-definition` → `echo-nginx-module:src/ngx_http_echo_module.c:609–613`。
- `ext340-echo-create-merge` → `echo-nginx-module:src/ngx_http_echo_module.c:245–291`。
- `command-compiler` → `echo-nginx-module:src/ngx_http_echo_module.c:295–393`。
- `ext340-echo-consumer` → `echo-nginx-module:src/ngx_http_echo_handler.c:155–379`。
- `ext340-core-create` → `nginx:src/http/ngx_http_core_module.c:3547–3653`。
- `ext340-core-merge` → `nginx:src/http/ngx_http_core_module.c:3668–3954`。
- `ext340-core-handler` → `nginx:src/http/ngx_http_core_module.c:1381–1383`。
- `ext340-core-patch` → `openresty:patches/nginx-1.27.1-no_error_pages.patch:1–91`。

### `echo-nginx-module--ngx_http_echo_module--echo_abort_parent`

机制核对：注册 offset=handler_cmds，专用callback经echo_helper保存opcode；pcalloc置三数组NULL，merge逐数组判空。内容执行器仅遍历当前handler_cmds；普通子location的core handler未由core merge复制。特别报告：setter保存echo_opcode_echo_abort_parent，但完整switch 222–359无对应case，落default报unknown opcode/500；不把列表继承写成该动作可正常执行。 E01修正：配置保存顺序不等于逐条执行保证；foreach/end控制循环、exec可提前转移，abort_parent缺少有效分派。

- defaults / verified：没有内置的 echo_abort_parent 动作或参数默认值；本层及其可用父层的 handler_cmds 均未配置本项时，不生成本项opcode。仅本层省略时仍须按该列表的合并规则判断，不能当作禁用父列表。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`。
- inheritance / verified：按 handler_cmds 整个命令列表合并：子层列表为 NULL 时复用父列表；子层配置任何进入该列表的命令后使用自己的整张列表，不追加父列表。同层命令按配置顺序保存，实际执行受相应控制流约束。handler_cmds、before_body_cmds、after_body_cmds 分别合并；列表复制不等于 core content handler 复制，普通嵌套 location 仍需有实际内容处理入口。 本项虽保存并可复制echo_opcode_echo_abort_parent，但固定执行器switch没有对应case，会进入unknown opcode错误分支；列表复制不表示中止父请求动作可用。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`、`ext340-core-create`、`ext340-core-merge`、`ext340-core-handler`、`ext340-core-patch`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `echo-nginx-module:src/ngx_http_echo_module.c:204–209`。
- `configuration-definition` → `echo-nginx-module:src/ngx_http_echo_module.c:617–621`。
- `ext340-echo-create-merge` → `echo-nginx-module:src/ngx_http_echo_module.c:245–291`。
- `command-compiler` → `echo-nginx-module:src/ngx_http_echo_module.c:295–393`。
- `ext340-echo-consumer` → `echo-nginx-module:src/ngx_http_echo_handler.c:155–379`。
- `ext340-core-create` → `nginx:src/http/ngx_http_core_module.c:3547–3653`。
- `ext340-core-merge` → `nginx:src/http/ngx_http_core_module.c:3668–3954`。
- `ext340-core-handler` → `nginx:src/http/ngx_http_core_module.c:1381–1383`。
- `ext340-core-patch` → `openresty:patches/nginx-1.27.1-no_error_pages.patch:1–91`。

### `echo-nginx-module--ngx_http_echo_module--echo_exec`

机制核对：注册 offset=handler_cmds，专用callback经echo_helper保存opcode；pcalloc置三数组NULL，merge逐数组判空。内容执行器仅遍历当前handler_cmds；普通子location的core handler未由core merge复制。 E01修正：配置保存顺序不等于逐条执行保证；foreach/end控制循环、exec可提前转移，abort_parent缺少有效分派。

- defaults / verified：没有内置的 echo_exec 动作或参数默认值；本层及其可用父层的 handler_cmds 均未配置本项时，不执行本项内部跳转。仅本层省略时仍须按该列表的合并规则判断，不能当作禁用父列表。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`。
- inheritance / verified：按 handler_cmds 整个命令列表合并：子层列表为 NULL 时复用父列表；子层配置任何进入该列表的命令后使用自己的整张列表，不追加父列表。同层命令按配置顺序保存，实际执行受相应控制流约束。handler_cmds、before_body_cmds、after_body_cmds 分别合并；列表复制不等于 core content handler 复制，普通嵌套 location 仍需有实际内容处理入口。 来源：`registration`、`configuration-definition`、`ext340-echo-create-merge`、`command-compiler`、`ext340-echo-consumer`、`ext340-core-create`、`ext340-core-merge`、`ext340-core-handler`、`ext340-core-patch`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `echo-nginx-module:src/ngx_http_echo_module.c:211–216`。
- `configuration-definition` → `echo-nginx-module:src/ngx_http_echo_module.c:625–629`。
- `ext340-echo-create-merge` → `echo-nginx-module:src/ngx_http_echo_module.c:245–291`。
- `command-compiler` → `echo-nginx-module:src/ngx_http_echo_module.c:295–393`。
- `ext340-echo-consumer` → `echo-nginx-module:src/ngx_http_echo_handler.c:155–379`。
- `ext340-core-create` → `nginx:src/http/ngx_http_core_module.c:3547–3653`。
- `ext340-core-merge` → `nginx:src/http/ngx_http_core_module.c:3668–3954`。
- `ext340-core-handler` → `nginx:src/http/ngx_http_core_module.c:1381–1383`。
- `ext340-core-patch` → `openresty:patches/nginx-1.27.1-no_error_pages.patch:1–91`。

### `headers-more-nginx-module--ngx_http_headers_more_filter_module--more_set_headers`

机制核对：注册共享loc对象；set/clear parser分别追加同一cmds，pcalloc为NULL；merge父先子后，输出filter跳过is_input，输入handler跳过非is_input。默认只指没有自动命令，不承诺后续过滤链最终头值。仅补manifest列出的字段。

- inheritance / verified：http/server/location/location内if 的 cmds 共用一个命令列表：子层没有命令（NULL或空表）时复用父列表；子层有命令且父列表非空时，将父命令插在子命令前。输入和输出命令均保留在同一表，各自消费阶段跳过另一类；子级 more_set_headers 不会清掉父级列表。 来源：`registration`、`configuration-definition`、`ext340-headers-create-merge`、`ext340-headers-out-append`、`ext340-headers-in-append`、`ext340-headers-out-consumer`、`ext340-headers-in-consumer`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `headers-more-nginx-module:src/ngx_http_headers_more_filter_module.c:41–47`。
- `configuration-definition` → `headers-more-nginx-module:src/ngx_http_headers_more_headers_out.c:545–584`。
- `ext340-headers-create-merge` → `headers-more-nginx-module:src/ngx_http_headers_more_filter_module.c:156–207`。
- `ext340-headers-out-append` → `headers-more-nginx-module:src/ngx_http_headers_more_headers_out.c:611–665`。
- `ext340-headers-in-append` → `headers-more-nginx-module:src/ngx_http_headers_more_headers_in.c:521–565`。
- `ext340-headers-out-consumer` → `headers-more-nginx-module:src/ngx_http_headers_more_filter_module.c:114–143`。
- `ext340-headers-in-consumer` → `headers-more-nginx-module:src/ngx_http_headers_more_filter_module.c:258–328`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:607–612`。

### `headers-more-nginx-module--ngx_http_headers_more_filter_module--more_clear_headers`

机制核对：注册共享loc对象；set/clear parser分别追加同一cmds，pcalloc为NULL；merge父先子后，输出filter跳过is_input，输入handler跳过非is_input。默认只指没有自动命令，不承诺后续过滤链最终头值。仅补manifest列出的字段。

- defaults / verified：没有自动生成的 more_clear_headers 命令；创建时 cmds 为 NULL，仅显式配置才追加本项。若当前层省略但父层有命令，合并后仍执行父层相应命令，不能将省略解释为禁止继承或清除全部头。 来源：`registration`、`configuration-definition`、`ext340-headers-create-merge`、`option-parser`、`filter-install`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `headers-more-nginx-module:src/ngx_http_headers_more_filter_module.c:49–55`。
- `configuration-definition` → `headers-more-nginx-module:src/ngx_http_headers_more_headers_out.c:554–559`。
- `ext340-headers-create-merge` → `headers-more-nginx-module:src/ngx_http_headers_more_filter_module.c:156–207`。
- `option-parser` → `headers-more-nginx-module:src/ngx_http_headers_more_headers_out.c:611–756`。
- `filter-install` → `headers-more-nginx-module:src/ngx_http_headers_more_filter_module.c:114–153`。

### `headers-more-nginx-module--ngx_http_headers_more_filter_module--more_set_input_headers`

机制核对：注册共享loc对象；set/clear parser分别追加同一cmds，pcalloc为NULL；merge父先子后，输出filter跳过is_input，输入handler跳过非is_input。默认只指没有自动命令，不承诺后续过滤链最终头值。仅补manifest列出的字段。

- defaults / verified：没有自动生成的 more_set_input_headers 命令；创建时 cmds 为 NULL，仅显式配置才追加本项。若当前层省略但父层有命令，合并后仍执行父层相应命令，不能将省略解释为禁止继承或清除全部头。 来源：`registration`、`configuration-definition`、`ext340-headers-create-merge`、`input-options`、`rewrite-tail`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `headers-more-nginx-module:src/ngx_http_headers_more_filter_module.c:57–63`。
- `configuration-definition` → `headers-more-nginx-module:src/ngx_http_headers_more_headers_in.c:469–474`。
- `ext340-headers-create-merge` → `headers-more-nginx-module:src/ngx_http_headers_more_filter_module.c:156–207`。
- `input-options` → `headers-more-nginx-module:src/ngx_http_headers_more_headers_in.c:521–660`。
- `rewrite-tail` → `headers-more-nginx-module:src/ngx_http_headers_more_filter_module.c:241–328`。

### `headers-more-nginx-module--ngx_http_headers_more_filter_module--more_clear_input_headers`

机制核对：注册共享loc对象；set/clear parser分别追加同一cmds，pcalloc为NULL；merge父先子后，输出filter跳过is_input，输入handler跳过非is_input。默认只指没有自动命令，不承诺后续过滤链最终头值。仅补manifest列出的字段。

- defaults / verified：没有自动生成的 more_clear_input_headers 命令；创建时 cmds 为 NULL，仅显式配置才追加本项。若当前层省略但父层有命令，合并后仍执行父层相应命令，不能将省略解释为禁止继承或清除全部头。 来源：`registration`、`configuration-definition`、`ext340-headers-create-merge`、`input-options`、`rewrite-tail`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `headers-more-nginx-module:src/ngx_http_headers_more_filter_module.c:65–71`。
- `configuration-definition` → `headers-more-nginx-module:src/ngx_http_headers_more_headers_in.c:478–483`。
- `ext340-headers-create-merge` → `headers-more-nginx-module:src/ngx_http_headers_more_filter_module.c:156–207`。
- `input-options` → `headers-more-nginx-module:src/ngx_http_headers_more_headers_in.c:521–660`。
- `rewrite-tail` → `headers-more-nginx-module:src/ngx_http_headers_more_filter_module.c:241–328`。

### `set-misc-nginx-module--ngx_http_set_misc_module--set_encode_base64`

机制核对：注册callback=ndk_set_var_value；cmd->post=ngx_http_set_misc_set_encode_base64_filter，经NDK保存并调用对应函数；NDK target取得rewrite loc_conf，filter编译及赋值消费闭合；rewrite create为NULL、merge不补父codes、if同数组、独立子配置由http merge树验证。模块自己的merge不复制动作。

- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`module-conf`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:236–243`。
- `configuration-definition` → `ngx_devel_kit:src/ndk_set_var.c:574–586`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `filter-bindings` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:40–232`。
- `module-conf` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:528–586`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:586–591`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `set-misc-nginx-module--ngx_http_set_misc_module--set_decode_base64`

机制核对：注册callback=ndk_set_var_value；cmd->post=ngx_http_set_misc_set_decode_base64_filter，经NDK保存并调用对应函数；NDK target取得rewrite loc_conf，filter编译及赋值消费闭合；rewrite create为NULL、merge不补父codes、if同数组、独立子配置由http merge树验证。模块自己的merge不复制动作。

- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`module-conf`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:244–251`。
- `configuration-definition` → `ngx_devel_kit:src/ndk_set_var.c:574–586`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `filter-bindings` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:40–232`。
- `module-conf` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:528–586`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:586–591`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `set-misc-nginx-module--ngx_http_set_misc_module--set_encode_base64url`

机制核对：注册callback=ndk_set_var_value；cmd->post=ngx_http_set_misc_set_encode_base64url_filter，经NDK保存并调用对应函数；NDK target取得rewrite loc_conf，filter编译及赋值消费闭合；rewrite create为NULL、merge不补父codes、if同数组、独立子配置由http merge树验证。模块自己的merge不复制动作。

- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`module-conf`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:252–259`。
- `configuration-definition` → `ngx_devel_kit:src/ndk_set_var.c:574–586`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `filter-bindings` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:40–232`。
- `module-conf` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:528–586`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:586–591`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `set-misc-nginx-module--ngx_http_set_misc_module--set_decode_base64url`

机制核对：注册callback=ndk_set_var_value；cmd->post=ngx_http_set_misc_set_decode_base64url_filter，经NDK保存并调用对应函数；NDK target取得rewrite loc_conf，filter编译及赋值消费闭合；rewrite create为NULL、merge不补父codes、if同数组、独立子配置由http merge树验证。模块自己的merge不复制动作。

- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`module-conf`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:260–267`。
- `configuration-definition` → `ngx_devel_kit:src/ndk_set_var.c:574–586`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `filter-bindings` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:40–232`。
- `module-conf` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:528–586`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:586–591`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `set-misc-nginx-module--ngx_http_set_misc_module--set_decode_hex`

机制核对：注册callback=ndk_set_var_value；cmd->post=ngx_http_set_misc_set_decode_hex_filter，经NDK保存并调用对应函数；NDK target取得rewrite loc_conf，filter编译及赋值消费闭合；rewrite create为NULL、merge不补父codes、if同数组、独立子配置由http merge树验证。模块自己的merge不复制动作。

- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`module-conf`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:268–275`。
- `configuration-definition` → `ngx_devel_kit:src/ndk_set_var.c:574–586`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `filter-bindings` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:40–232`。
- `module-conf` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:528–586`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:586–591`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `set-misc-nginx-module--ngx_http_set_misc_module--set_encode_hex`

机制核对：注册callback=ndk_set_var_value；cmd->post=ngx_http_set_misc_set_encode_hex_filter，经NDK保存并调用对应函数；NDK target取得rewrite loc_conf，filter编译及赋值消费闭合；rewrite create为NULL、merge不补父codes、if同数组、独立子配置由http merge树验证。模块自己的merge不复制动作。

- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`module-conf`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:276–283`。
- `configuration-definition` → `ngx_devel_kit:src/ndk_set_var.c:574–586`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `filter-bindings` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:40–232`。
- `module-conf` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:528–586`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:586–591`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `set-misc-nginx-module--ngx_http_set_misc_module--set_hmac_sha1`

机制核对：注册callback=ndk_set_var_multi_value；cmd->post=ngx_http_set_misc_set_hmac_sha1_filter，经NDK保存并调用对应函数；NDK target取得rewrite loc_conf，filter编译及赋值消费闭合；rewrite create为NULL、merge不补父codes、if同数组、独立子配置由http merge树验证。模块自己的merge不复制动作。

- defaults / verified：没有预设的 set_hmac_sha1 动作；未配置时不编译本项，不会自动计算HMAC-SHA1。这不规定目标变量的初值，变量仍可能由其他指令或先前阶段赋值；显式配置后的结果取决于相应输入及运行时状态。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`module-conf`。
- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`module-conf`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:285–292`。
- `configuration-definition` → `ngx_devel_kit:src/ndk_set_var.c:590–602`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `filter-bindings` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:40–232`。
- `module-conf` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:528–586`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:586–591`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `set-misc-nginx-module--ngx_http_set_misc_module--set_hmac_sha256`

机制核对：注册callback=ndk_set_var_multi_value；cmd->post=ngx_http_set_misc_set_hmac_sha256_filter，经NDK保存并调用对应函数；NDK target取得rewrite loc_conf，filter编译及赋值消费闭合；rewrite create为NULL、merge不补父codes、if同数组、独立子配置由http merge树验证。模块自己的merge不复制动作。

- defaults / verified：没有预设的 set_hmac_sha256 动作；未配置时不编译本项，不会自动计算HMAC-SHA256。这不规定目标变量的初值，变量仍可能由其他指令或先前阶段赋值；显式配置后的结果取决于相应输入及运行时状态。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`module-conf`。
- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`module-conf`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:293–300`。
- `configuration-definition` → `ngx_devel_kit:src/ndk_set_var.c:590–602`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `filter-bindings` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:40–232`。
- `module-conf` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:528–586`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:586–591`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `set-misc-nginx-module--ngx_http_set_misc_module--set_md5`

机制核对：注册callback=ndk_set_var_value；cmd->post=ngx_http_set_misc_set_md5_filter，经NDK保存并调用对应函数；NDK target取得rewrite loc_conf，filter编译及赋值消费闭合；rewrite create为NULL、merge不补父codes、if同数组、独立子配置由http merge树验证。模块自己的merge不复制动作。

- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`module-conf`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:303–310`。
- `configuration-definition` → `ngx_devel_kit:src/ndk_set_var.c:574–586`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `filter-bindings` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:40–232`。
- `module-conf` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:528–586`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:586–591`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `set-misc-nginx-module--ngx_http_set_misc_module--set_sha1`

机制核对：注册callback=ndk_set_var_value；cmd->post=ngx_http_set_misc_set_sha1_filter，经NDK保存并调用对应函数；NDK target取得rewrite loc_conf，filter编译及赋值消费闭合；rewrite create为NULL、merge不补父codes、if同数组、独立子配置由http merge树验证。模块自己的merge不复制动作。

- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`module-conf`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:312–320`。
- `configuration-definition` → `ngx_devel_kit:src/ndk_set_var.c:574–586`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `filter-bindings` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:40–232`。
- `module-conf` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:528–586`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:586–591`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `set-misc-nginx-module--ngx_http_set_misc_module--set_unescape_uri`

机制核对：注册callback=ndk_set_var_value；cmd->post=ngx_http_set_misc_unescape_uri_filter，经NDK保存并调用对应函数；NDK target取得rewrite loc_conf，filter编译及赋值消费闭合；rewrite create为NULL、merge不补父codes、if同数组、独立子配置由http merge树验证。模块自己的merge不复制动作。

- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`module-conf`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:323–331`。
- `configuration-definition` → `ngx_devel_kit:src/ndk_set_var.c:574–586`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `filter-bindings` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:40–232`。
- `module-conf` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:528–586`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:586–591`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `set-misc-nginx-module--ngx_http_set_misc_module--set_escape_uri`

机制核对：注册callback=ndk_set_var_value；cmd->post=ngx_http_set_misc_escape_uri_filter，经NDK保存并调用对应函数；NDK target取得rewrite loc_conf，filter编译及赋值消费闭合；rewrite create为NULL、merge不补父codes、if同数组、独立子配置由http merge树验证。模块自己的merge不复制动作。

- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`module-conf`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:332–340`。
- `configuration-definition` → `ngx_devel_kit:src/ndk_set_var.c:574–586`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `filter-bindings` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:40–232`。
- `module-conf` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:528–586`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:586–591`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `set-misc-nginx-module--ngx_http_set_misc_module--set_quote_sql_str`

机制核对：注册callback=ndk_set_var_value；cmd->post=ngx_http_set_misc_quote_sql_str_filter，经NDK保存并调用对应函数；NDK target取得rewrite loc_conf，filter编译及赋值消费闭合；rewrite create为NULL、merge不补父codes、if同数组、独立子配置由http merge树验证。模块自己的merge不复制动作。

- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`module-conf`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:341–349`。
- `configuration-definition` → `ngx_devel_kit:src/ndk_set_var.c:574–586`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `filter-bindings` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:40–232`。
- `module-conf` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:528–586`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:586–591`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `set-misc-nginx-module--ngx_http_set_misc_module--set_quote_pgsql_str`

机制核对：注册callback=ndk_set_var_value；cmd->post=ngx_http_set_misc_quote_pgsql_str_filter，经NDK保存并调用对应函数；NDK target取得rewrite loc_conf，filter编译及赋值消费闭合；rewrite create为NULL、merge不补父codes、if同数组、独立子配置由http merge树验证。模块自己的merge不复制动作。

- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`module-conf`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:350–358`。
- `configuration-definition` → `ngx_devel_kit:src/ndk_set_var.c:574–586`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `filter-bindings` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:40–232`。
- `module-conf` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:528–586`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:586–591`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `set-misc-nginx-module--ngx_http_set_misc_module--set_quote_json_str`

机制核对：注册callback=ndk_set_var_value；cmd->post=ngx_http_set_misc_quote_json_str_filter，经NDK保存并调用对应函数；NDK target取得rewrite loc_conf，filter编译及赋值消费闭合；rewrite create为NULL、merge不补父codes、if同数组、独立子配置由http merge树验证。模块自己的merge不复制动作。

- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`module-conf`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:359–367`。
- `configuration-definition` → `ngx_devel_kit:src/ndk_set_var.c:574–586`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `filter-bindings` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:40–232`。
- `module-conf` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:528–586`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:586–591`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `set-misc-nginx-module--ngx_http_set_misc_module--set_if_empty`

机制核对：注册callback=ngx_http_set_if_empty；专用setter以当前变量及fallback两值编译multi-value；NDK target取得rewrite loc_conf，filter编译及赋值消费闭合；rewrite create为NULL、merge不补父codes、if同数组、独立子配置由http merge树验证。模块自己的merge不复制动作。

- defaults / verified：没有预设的 set_if_empty 动作；未配置时不编译本项，不会自动执行空值兜底赋值。这不规定目标变量的初值，变量仍可能由其他指令或先前阶段赋值；显式配置后的结果取决于相应输入及运行时状态。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`implementation`、`module-conf`。
- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`implementation`、`module-conf`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:368–376`。
- `configuration-definition` → `set-misc-nginx-module:src/ngx_http_set_default_value.c:34–48`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `implementation` → `set-misc-nginx-module:src/ngx_http_set_default_value.c:10–48`。
- `module-conf` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:528–586`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:586–591`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `set-misc-nginx-module--ngx_http_set_misc_module--set_hashed_upstream`

机制核对：注册callback=ngx_http_set_hashed_upstream；专用setter对动态列表名编译multi-value-data，对静态名先查NDK main表后编译value-data；NDK target取得rewrite loc_conf，filter编译及赋值消费闭合；rewrite create为NULL、merge不补父codes、if同数组、独立子配置由http merge树验证。模块自己的merge不复制动作。

- defaults / verified：没有预设的 set_hashed_upstream 动作；未配置时不编译本项，不会自动按键选择upstream列表成员。这不规定目标变量的初值，变量仍可能由其他指令或先前阶段赋值；显式配置后的结果取决于相应输入及运行时状态。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`module-conf`。
- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`module-conf`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:377–385`。
- `configuration-definition` → `set-misc-nginx-module:src/ngx_http_set_hashed_upstream.c:95–141`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `module-conf` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:528–586`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:586–591`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `set-misc-nginx-module--ngx_http_set_misc_module--set_encode_base32`

机制核对：注册callback=ndk_set_var_value；cmd->post=ngx_http_set_misc_encode_base32_filter，经NDK保存并调用对应函数；NDK target取得rewrite loc_conf，filter编译及赋值消费闭合；rewrite create为NULL、merge不补父codes、if同数组、独立子配置由http merge树验证。模块自己的merge不复制动作。

- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 base32 字母表及填充参数另行合并，不等于此转换动作继承。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`module-conf`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:414–422`。
- `configuration-definition` → `ngx_devel_kit:src/ndk_set_var.c:574–586`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `filter-bindings` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:40–232`。
- `module-conf` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:528–586`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:586–591`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `set-misc-nginx-module--ngx_http_set_misc_module--set_decode_base32`

机制核对：注册callback=ndk_set_var_value；cmd->post=ngx_http_set_misc_decode_base32_filter，经NDK保存并调用对应函数；NDK target取得rewrite loc_conf，filter编译及赋值消费闭合；rewrite create为NULL、merge不补父codes、if同数组、独立子配置由http merge树验证。模块自己的merge不复制动作。

- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 base32 字母表及填充参数另行合并，不等于此转换动作继承。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`module-conf`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:423–431`。
- `configuration-definition` → `ngx_devel_kit:src/ndk_set_var.c:574–586`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `filter-bindings` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:40–232`。
- `module-conf` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:528–586`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:586–591`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `set-misc-nginx-module--ngx_http_set_misc_module--set_local_today`

机制核对：注册callback=ndk_set_var_value；cmd->post=ngx_http_set_misc_local_today_filter，经NDK保存并调用对应函数；NDK target取得rewrite loc_conf，filter编译及赋值消费闭合；rewrite create为NULL、merge不补父codes、if同数组、独立子配置由http merge树验证。模块自己的merge不复制动作。

- defaults / verified：没有预设的 set_local_today 动作；未配置时不编译本项，不会自动生成日期。这不规定目标变量的初值，变量仍可能由其他指令或先前阶段赋值；显式配置后的结果取决于相应输入及运行时状态。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`module-conf`。
- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`module-conf`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:432–440`。
- `configuration-definition` → `ngx_devel_kit:src/ndk_set_var.c:574–586`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `filter-bindings` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:40–232`。
- `module-conf` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:528–586`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:586–591`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `set-misc-nginx-module--ngx_http_set_misc_module--set_formatted_gmt_time`

机制核对：注册callback=ndk_set_var_value；cmd->post=ngx_http_set_misc_formatted_gmt_time_filter，经NDK保存并调用对应函数；NDK target取得rewrite loc_conf，filter编译及赋值消费闭合；rewrite create为NULL、merge不补父codes、if同数组、独立子配置由http merge树验证。模块自己的merge不复制动作。

- defaults / verified：没有预设的 set_formatted_gmt_time 动作；未配置时不编译本项，不会自动格式化GMT时间。这不规定目标变量的初值，变量仍可能由其他指令或先前阶段赋值；显式配置后的结果取决于相应输入及运行时状态。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`module-conf`。
- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`module-conf`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:441–449`。
- `configuration-definition` → `ngx_devel_kit:src/ndk_set_var.c:574–586`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `filter-bindings` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:40–232`。
- `module-conf` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:528–586`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:586–591`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `set-misc-nginx-module--ngx_http_set_misc_module--set_formatted_local_time`

机制核对：注册callback=ndk_set_var_value；cmd->post=ngx_http_set_misc_formatted_local_time_filter，经NDK保存并调用对应函数；NDK target取得rewrite loc_conf，filter编译及赋值消费闭合；rewrite create为NULL、merge不补父codes、if同数组、独立子配置由http merge树验证。模块自己的merge不复制动作。

- defaults / verified：没有预设的 set_formatted_local_time 动作；未配置时不编译本项，不会自动格式化本地时间。这不规定目标变量的初值，变量仍可能由其他指令或先前阶段赋值；显式配置后的结果取决于相应输入及运行时状态。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`module-conf`。
- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`module-conf`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:450–458`。
- `configuration-definition` → `ngx_devel_kit:src/ndk_set_var.c:574–586`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `filter-bindings` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:40–232`。
- `module-conf` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:528–586`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:586–591`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `set-misc-nginx-module--ngx_http_set_misc_module--set_random`

机制核对：注册callback=ndk_set_var_multi_value；cmd->post=ngx_http_set_misc_set_random_filter，经NDK保存并调用对应函数；NDK target取得rewrite loc_conf，filter编译及赋值消费闭合；rewrite create为NULL、merge不补父codes、if同数组、独立子配置由http merge树验证。模块自己的merge不复制动作。

- defaults / verified：没有预设的 set_random 动作；未配置时不编译本项，不会自动生成随机数。这不规定目标变量的初值，变量仍可能由其他指令或先前阶段赋值；显式配置后的结果取决于相应输入及运行时状态。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`module-conf`。
- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`module-conf`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:459–466`。
- `configuration-definition` → `ngx_devel_kit:src/ndk_set_var.c:590–602`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `filter-bindings` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:40–232`。
- `module-conf` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:528–586`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:586–591`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `set-misc-nginx-module--ngx_http_set_misc_module--set_secure_random_alphanum`

机制核对：注册callback=ndk_set_var_value；cmd->post=ngx_http_set_misc_set_secure_random_alphanum_filter，经NDK保存并调用对应函数；NDK target取得rewrite loc_conf，filter编译及赋值消费闭合；rewrite create为NULL、merge不补父codes、if同数组、独立子配置由http merge树验证。模块自己的merge不复制动作。

- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`module-conf`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:467–474`。
- `configuration-definition` → `ngx_devel_kit:src/ndk_set_var.c:574–586`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `filter-bindings` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:40–232`。
- `module-conf` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:528–586`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:586–591`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `set-misc-nginx-module--ngx_http_set_misc_module--set_secure_random_lcalpha`

机制核对：注册callback=ndk_set_var_value；cmd->post=ngx_http_set_misc_set_secure_random_lcalpha_filter，经NDK保存并调用对应函数；NDK target取得rewrite loc_conf，filter编译及赋值消费闭合；rewrite create为NULL、merge不补父codes、if同数组、独立子配置由http merge树验证。模块自己的merge不复制动作。

- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`module-conf`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:475–482`。
- `configuration-definition` → `ngx_devel_kit:src/ndk_set_var.c:574–586`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `filter-bindings` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:40–232`。
- `module-conf` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:528–586`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:586–591`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `set-misc-nginx-module--ngx_http_set_misc_module--set_rotate`

机制核对：注册callback=ngx_http_set_rotate；专用setter把当前值、from、to编译为multi-value；current创建为UNSET，merge仍可为UNSET；consumer仅在动作执行时根据变量/已有状态计算并回写，状态与动作分开。NDK target取得rewrite loc_conf，filter编译及赋值消费闭合；rewrite create为NULL、merge不补父codes、if同数组、独立子配置由http merge树验证。模块自己的merge不复制动作。

- defaults / verified：没有预设的 set_rotate 动作；未配置时不编译本项，不会自动递增或轮转。这不规定目标变量的初值，变量仍可能由其他指令或先前阶段赋值；显式配置后的结果取决于相应输入及运行时状态。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`implementation`、`module-conf`。
- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 模块 current 的配置期合并只复制其状态初值；请求执行时回写当前 loc 的 current，不使父动作在子 location 自动出现。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`implementation`、`module-conf`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:483–490`。
- `configuration-definition` → `set-misc-nginx-module:src/ngx_http_set_rotate.c:99–112`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `implementation` → `set-misc-nginx-module:src/ngx_http_set_rotate.c:12–113`。
- `module-conf` → `set-misc-nginx-module:src/ngx_http_set_misc_module.c:528–586`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:586–591`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `array-var-nginx-module--ngx_http_array_var_module--array_split`

机制核对：逐项追专用setter：array_split；根据max/to=分支选择2或3个输入，绑定split函数。模块没有独立loc对象；实际动作由NDK filter opcode消费，不因数组变量而存在配置继承。

- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 原地处理与 to= 新目标分支只决定请求阶段的数组/字符串赋值目标，不是父子配置数组合并。 来源：`registration`、`configuration-definition`、`ext340-array-context`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `array-var-nginx-module:src/ngx_http_array_var_module.c:56–64`。
- `configuration-definition` → `array-var-nginx-module:src/ngx_http_array_var_module.c:132–222`。
- `ext340-array-context` → `array-var-nginx-module:src/ngx_http_array_var_module.c:100–112`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `array-var-nginx-module--ngx_http_array_var_module--array_map`

机制核对：逐项追专用setter：array_map；绑定模板和array_it索引，以value-data编译。模块没有独立loc对象；实际动作由NDK filter opcode消费，不因数组变量而存在配置继承。

- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 原地处理与 to= 新目标分支只决定请求阶段的数组/字符串赋值目标，不是父子配置数组合并。 来源：`registration`、`configuration-definition`、`ext340-array-context`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `array-var-nginx-module:src/ngx_http_array_var_module.c:65–74`。
- `configuration-definition` → `array-var-nginx-module:src/ngx_http_array_var_module.c:226–298`。
- `ext340-array-context` → `array-var-nginx-module:src/ngx_http_array_var_module.c:100–112`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `array-var-nginx-module--ngx_http_array_var_module--array_map_op`

机制核对：逐项追专用setter：array_map_op；用cmd->post绑定map_op，按to=决定in_place，编译multi-value-data。模块没有独立loc对象；实际动作由NDK filter opcode消费，不因数组变量而存在配置继承。

- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 原地处理与 to= 新目标分支只决定请求阶段的数组/字符串赋值目标，不是父子配置数组合并。 来源：`registration`、`configuration-definition`、`ext340-array-context`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `array-var-nginx-module:src/ngx_http_array_var_module.c:75–84`。
- `configuration-definition` → `array-var-nginx-module:src/ngx_http_array_var_module.c:302–363`。
- `ext340-array-context` → `array-var-nginx-module:src/ngx_http_array_var_module.c:100–112`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `array-var-nginx-module--ngx_http_array_var_module--array_join`

机制核对：逐项追专用setter：array_join；用cmd->post绑定join，按to=选择目标，编译multi-value。模块没有独立loc对象；实际动作由NDK filter opcode消费，不因数组变量而存在配置继承。

- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 原地处理与 to= 新目标分支只决定请求阶段的数组/字符串赋值目标，不是父子配置数组合并。 来源：`registration`、`configuration-definition`、`ext340-array-setter`、`ext340-array-context`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `array-var-nginx-module:src/ngx_http_array_var_module.c:85–94`。
- `configuration-definition` → `array-var-nginx-module:src/ngx_http_array_var_module.c:367–417`。
- `ext340-array-setter` → `array-var-nginx-module:src/ngx_http_array_var_module.c:367–419`。
- `ext340-array-context` → `array-var-nginx-module:src/ngx_http_array_var_module.c:100–112`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `form-input-nginx-module--ngx_http_form_input_module--set_form_input`

机制核对：callback按cmd名称选择普通consumer，省略字段名取目标变量去$后的名字，再NDK multi-value。main.used只控制全局rewrite读体hook；POST/PUT及form-urlencoded检查、请求上下文完成状态与变量赋值分别核对。注册不允许if，故不套用actionText的if分支。

- inheritance / verified：表单取值动作不由父配置复制给独立子 location；server 动作与 location 动作按各自 rewrite 阶段运行，http 级 codes 不自动复制给 server。子级显式配置时只把自己的 set_form_input 动作编入当前 rewrite 数组。任一配置使 main.used=1 并全局挂载读体 handler，但该标志不是变量动作继承；仅有全局读体处理不会自动执行本项赋值。 来源：`registration`、`configuration-definition`、`ext340-form-setter-init`、`ext340-form-consumer`、`body-read-phase`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `form-input-nginx-module:src/ngx_http_form_input_module.c:43–48`。
- `configuration-definition` → `form-input-nginx-module:src/ngx_http_form_input_module.c:307–352`。
- `ext340-form-setter-init` → `form-input-nginx-module:src/ngx_http_form_input_module.c:307–380`。
- `ext340-form-consumer` → `form-input-nginx-module:src/ngx_http_form_input_module.c:93–160`。
- `body-read-phase` → `form-input-nginx-module:src/ngx_http_form_input_module.c:357–523`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `form-input-nginx-module--ngx_http_form_input_module--set_form_input_multi`

机制核对：callback按cmd名称选择multiconsumer，省略字段名取目标变量去$后的名字，再NDK multi-value。main.used只控制全局rewrite读体hook；POST/PUT及form-urlencoded检查、请求上下文完成状态与变量赋值分别核对。注册不允许if，故不套用actionText的if分支。

- inheritance / verified：表单取值动作不由父配置复制给独立子 location；server 动作与 location 动作按各自 rewrite 阶段运行，http 级 codes 不自动复制给 server。子级显式配置时只把自己的 set_form_input_multi 动作编入当前 rewrite 数组。任一配置使 main.used=1 并全局挂载读体 handler，但该标志不是变量动作继承；仅有全局读体处理不会自动执行本项赋值。 来源：`registration`、`configuration-definition`、`ext340-form-setter-init`、`ext340-form-consumer`、`body-read-phase`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `form-input-nginx-module:src/ngx_http_form_input_module.c:50–55`。
- `configuration-definition` → `form-input-nginx-module:src/ngx_http_form_input_module.c:307–352`。
- `ext340-form-setter-init` → `form-input-nginx-module:src/ngx_http_form_input_module.c:307–380`。
- `ext340-form-consumer` → `form-input-nginx-module:src/ngx_http_form_input_module.c:93–160`。
- `body-read-phase` → `form-input-nginx-module:src/ngx_http_form_input_module.c:357–523`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `iconv-nginx-module--ngx_http_iconv_module--set_iconv`

机制核对：本项注册仅允许location，不允许http/server/if；专用setter将源值、from、to三个输入绑定iconv consumer，调用NDK multi-value，不扩大注册上下文。consumer读取当前loc buf_size，编码来自显式参数，不取过滤器from/to默认。ER01仅修继承说明的上下文泛化，独立location动作不复制/不追加的结论保留。

- defaults / verified：没有预置的 set_iconv 动作；未写此指令就不编译本项变量转换，不规定目标变量初值。显式配置必须传源值和 from=/to=，动作使用这些参数；过滤器的 utf-8/gbk 默认值不是本动作的源/目标编码默认值。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`ext340-iconv-action`、`ext340-iconv-create-merge`。
- inheritance / verified：本项只允许在 location 中配置，不允许 http、server 或 if。setter 将转换动作写入当前 location 的 rewrite codes，不按普通 loc 参数复制；未写本项的独立子 location 不会从父 location 复制此动作，子级显式动作编入自己的序列，不追加父 location 序列。转换 buffer 参数和过滤器开关/编码另有 merge，不代表 set_iconv 动作继承。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`ext340-iconv-action`、`ext340-iconv-create-merge`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `iconv-nginx-module:src/ngx_http_iconv_module.c:60–66`。
- `configuration-definition` → `iconv-nginx-module:src/ngx_http_iconv_module.c:593–628`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–562`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `ext340-iconv-action` → `iconv-nginx-module:src/ngx_http_iconv_module.c:593–694`。
- `ext340-iconv-create-merge` → `iconv-nginx-module:src/ngx_http_iconv_module.c:697–743`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:670–675`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `encrypted-session-nginx-module--ngx_http_encrypted_session_module--set_encrypt_session`

机制核对：两个注册均用ndk_set_var_value，但post分别绑定encode/decode filter。NDK编译动作与session模块key/iv/expires merge独立，不改非目标参数事实。

- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 key/iv/expires 参数另行合并，不使本加解密动作在子 location 自动出现；TAKE12省略源值时原地处理，不属于配置继承。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`ext340-session-create-merge`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `encrypted-session-nginx-module:src/ngx_http_encrypted_session_module.c:100–108`。
- `configuration-definition` → `ngx_devel_kit:src/ndk_set_var.c:574–586`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–529`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `filter-bindings` → `encrypted-session-nginx-module:src/ngx_http_encrypted_session_module.c:57–69`。
- `ext340-session-create-merge` → `encrypted-session-nginx-module:src/ngx_http_encrypted_session_module.c:394–426`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:677–682`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `encrypted-session-nginx-module--ngx_http_encrypted_session_module--set_decrypt_session`

机制核对：两个注册均用ndk_set_var_value，但post分别绑定encode/decode filter。NDK编译动作与session模块key/iv/expires merge独立，不改非目标参数事实。

- inheritance / verified：这是写入当前配置块 rewrite codes 的动作，不按普通 loc 参数复制。未写动作的独立子 location 保持自身 codes 为空；子级显式动作编入自己的序列，不追加父 location 序列。server 中的动作在 server-rewrite 阶段先执行，随后进入匹配 location 的 rewrite 阶段，这是阶段执行而不是配置继承；http 级动作代码也不会由 merge 自动复制给 server。允许的 if 内动作编入外层同一数组，受 if 条件控制。 key/iv/expires 参数另行合并，不使本加解密动作在子 location 自动出现；TAKE12省略源值时原地处理，不属于配置继承。 来源：`registration`、`configuration-definition`、`ndk-compile`、`ext340-ndk-compile`、`ext340-ndk-consumer`、`rewrite-execution`、`ext340-rewrite-create-merge`、`ext340-rewrite-if`、`ext340-http-merge-tree`、`ext340-http-phases`、`filter-bindings`、`ext340-session-create-merge`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `encrypted-session-nginx-module:src/ngx_http_encrypted_session_module.c:109–117`。
- `configuration-definition` → `ngx_devel_kit:src/ndk_set_var.c:574–586`。
- `ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:254–529`。
- `ext340-ndk-compile` → `ngx_devel_kit:src/ndk_set_var.c:449–601`。
- `ext340-ndk-consumer` → `ngx_devel_kit:src/ndk_set_var.c:127–218`。
- `rewrite-execution` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-rewrite-if` → `nginx:src/http/modules/ngx_http_rewrite_module.c:532–644`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `filter-bindings` → `encrypted-session-nginx-module:src/ngx_http_encrypted_session_module.c:57–69`。
- `ext340-session-create-merge` → `encrypted-session-nginx-module:src/ngx_http_encrypted_session_module.c:394–426`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:677–682`。
- `ext340-ndk-distribution` → `openresty:util/mirror-tarballs:579–584`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `ngx_devel_kit--ndk_http_module--upstream_list`

机制核对：生成注册来源header宏已按固定Git读取，不执行生成器；main创建零初始化，setter忽略传入conf而取main_conf，查找同一数组。跨server可见属于main共享，不是loc继承；未配置时没有该列表，子同名声明被拒绝。

- inheritance / not_applicable：不适用逐server/location的父子合并：虽然允许在http或server声明，setter始终取得同一NDK main_conf并写入共享upstreams表。不同位置的不同列表名加入同表；名称大小写不敏感，重复名称直接配置报错，不是子server覆盖父列表。查找也读取该main表。 来源：`registration`、`configuration-definition`、`ext340-upstream-list-registration`、`ext340-upstream-list-table`、`main-config`、`ext340-http-main-sharing`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `ngx_devel_kit:src/ndk_upstream_list.h:6–13`。
- `configuration-definition` → `ngx_devel_kit:src/ndk_upstream_list.c:59–180`。
- `ext340-upstream-list-registration` → `ngx_devel_kit:src/ndk_upstream_list.h:2–13`。
- `ext340-upstream-list-table` → `ngx_devel_kit:src/ndk_upstream_list.c:59–204`。
- `main-config` → `ngx_devel_kit:src/ndk.c:144–154`。
- `ext340-http-main-sharing` → `nginx:src/http/ngx_http.c:152–215`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `memc-nginx-module--ngx_http_memc_module--memc_pass`

机制核对：已实际读完整create/merge、静态/变量setter、handler180–213与core merge；动态目标成功时回写配置静态槽，不是配置期继承。if切换可保留旧content_handler但complex_target仍为空，后续结果没有运行验证，不猜具体崩溃/响应。固定脚本只解包memc；core no_error_pages及upstream三有效补丁未增加上述目标或handler复制。

- defaults / verified：没有内置默认memc目标；初始静态upstream和complex_target均为空，只有显式 memc_pass 安装本层内容handler。本层未写不等于总不运行：静态父指针可经merge复制，location内if还可能在切换配置后保留原请求handler。变量目标求值为空或找不到已配置upstream时返回500，不会回退到某个固定默认服务器。 来源：`registration`、`configuration-definition`、`create-merge`、`ext340-memc-consumer`、`ext340-core-create`、`ext340-core-merge`、`ext340-core-handler`、`ext340-core-patch`、`ext340-if-location-switch`。
- inheritance / verified：merge仅在子upstream.upstream为空时复制父静态指针，完全不复制complex_target。子显式静态目标保留自己的指针；子显式变量目标保留自己的complex_target，但其空静态槽仍可被父静态指针填入，运行时成功求值后再回写目标。普通嵌套location不会由core merge自动取得父content handler，不能将参数复制写成完整memc_pass继承。location内if成立会切换loc_conf，当前core handler为空时不清除已有r->content_handler；父变量目标未复制时尤其不能承诺安全沿用。 来源：`registration`、`configuration-definition`、`create-merge`、`ext340-memc-consumer`、`ext340-core-create`、`ext340-core-merge`、`ext340-core-handler`、`ext340-core-patch`、`ext340-if-location-switch`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `memc-nginx-module:src/ngx_http_memc_module.c:57–62`。
- `configuration-definition` → `memc-nginx-module:src/ngx_http_memc_module.c:259–321`。
- `create-merge` → `memc-nginx-module:src/ngx_http_memc_module.c:162–255`。
- `ext340-memc-consumer` → `memc-nginx-module:src/ngx_http_memc_handler.c:180–213`。
- `ext340-core-create` → `nginx:src/http/ngx_http_core_module.c:3547–3653`。
- `ext340-core-merge` → `nginx:src/http/ngx_http_core_module.c:3668–3954`。
- `ext340-core-handler` → `nginx:src/http/ngx_http_core_module.c:1381–1383`。
- `ext340-core-patch` → `openresty:patches/nginx-1.27.1-no_error_pages.patch:1–91`。
- `ext340-if-location-switch` → `nginx:src/http/ngx_http_script.c:1525–1544`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:649–654`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。
- `ext340-upstream-patch-balancer_status_code` → `openresty:patches/nginx-1.27.1-balancer_status_code.patch:1–72`。
- `ext340-upstream-patch-upstream_pipelining` → `openresty:patches/nginx-1.27.1-upstream_pipelining.patch:1–23`。
- `ext340-upstream-patch-upstream_timeout_fields` → `openresty:patches/nginx-1.27.1-upstream_timeout_fields.patch:1–112`。

### `srcache-nginx-module--ngx_http_srcache_filter_module--srcache_store_hide_header`

机制核对：注册offset独立指向hide_headers/pass_headers，公共str_array setter按UNSET建立数组再追加；create均UNSET，hash按实际分支构造，pass可删除同名项及重置特殊标志。特别报告固定源码1153–1165提前return发生在复制原始数组/标志之前；serializer953/1037与964/1055对特殊头走独立标志，不能用hash复用代表这些标志已传播。此缺陷不修上游。

- defaults / verified：不额外声明自定义hide列表；无父级自定义配置时，默认隐藏Connection、Keep-Alive、Proxy-Authenticate、Proxy-Authorization、TE、Trailers、Transfer-Encoding、Upgrade、Set-Cookie。 省略本层列表须另看父层hash/列表合并；这些规则只作用于写入缓存的响应副本，不删除当前发给客户端的头。 来源：`registration`、`configuration-definition`、`create-merge`、`default-hidden`、`hide-build`、`ext340-srcache-header-size`、`ext340-srcache-header-write`。
- inheritance / verified：本层显式设置的hide或pass数组不与父级同类数组追加；只设置其中一种时，另一种未设置数组从父级取得，再按默认hide→hide数组→pass删除项构造hash。同层重复声明向本层数组追加。两数组均为UNSET时先复用父hash：父hash已存在则立即返回，并未复制原始hide/pass数组或hide_content_type/hide_last_modified；仅父hash未建立时才继续复制这些成员。因此普通头可复用父hash，但不能声称特殊头隐藏标志完整继承，也不能保证孙级重建hash时保留祖先原始自定义列表。 来源：`registration`、`configuration-definition`、`create-merge`、`default-hidden`、`hide-build`、`ext340-srcache-header-size`、`ext340-srcache-header-write`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `srcache-nginx-module:src/ngx_http_srcache_filter_module.c:160–165`。
- `configuration-definition` → `nginx:src/core/ngx_conf_file.c:1093–1126`。
- `create-merge` → `srcache-nginx-module:src/ngx_http_srcache_filter_module.c:247–357`。
- `default-hidden` → `srcache-nginx-module:src/ngx_http_srcache_filter_module.c:36–47`。
- `hide-build` → `srcache-nginx-module:src/ngx_http_srcache_util.c:1144–1284`。
- `ext340-srcache-header-size` → `srcache-nginx-module:src/ngx_http_srcache_util.c:953–1018`。
- `ext340-srcache-header-write` → `srcache-nginx-module:src/ngx_http_srcache_util.c:1037–1110`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:656–661`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `srcache-nginx-module--ngx_http_srcache_filter_module--srcache_store_pass_header`

机制核对：注册offset独立指向hide_headers/pass_headers，公共str_array setter按UNSET建立数组再追加；create均UNSET，hash按实际分支构造，pass可删除同名项及重置特殊标志。特别报告固定源码1153–1165提前return发生在复制原始数组/标志之前；serializer953/1037与964/1055对特殊头走独立标志，不能用hash复用代表这些标志已传播。此缺陷不修上游。

- defaults / verified：不自动声明任何pass例外；无父级自定义配置时，默认九项隐藏头仍有效，普通未隐藏头仍可存储。 省略本层列表须另看父层hash/列表合并；这些规则只作用于写入缓存的响应副本，不删除当前发给客户端的头。 来源：`registration`、`configuration-definition`、`create-merge`、`default-hidden`、`hide-build`、`ext340-srcache-header-size`、`ext340-srcache-header-write`。
- inheritance / verified：本层显式设置的hide或pass数组不与父级同类数组追加；只设置其中一种时，另一种未设置数组从父级取得，再按默认hide→hide数组→pass删除项构造hash。同层重复声明向本层数组追加。两数组均为UNSET时先复用父hash：父hash已存在则立即返回，并未复制原始hide/pass数组或hide_content_type/hide_last_modified；仅父hash未建立时才继续复制这些成员。因此普通头可复用父hash，但不能声称特殊头隐藏标志完整继承，也不能保证孙级重建hash时保留祖先原始自定义列表。 来源：`registration`、`configuration-definition`、`create-merge`、`default-hidden`、`hide-build`、`ext340-srcache-header-size`、`ext340-srcache-header-write`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `srcache-nginx-module:src/ngx_http_srcache_filter_module.c:167–172`。
- `configuration-definition` → `nginx:src/core/ngx_conf_file.c:1093–1126`。
- `create-merge` → `srcache-nginx-module:src/ngx_http_srcache_filter_module.c:247–357`。
- `default-hidden` → `srcache-nginx-module:src/ngx_http_srcache_filter_module.c:36–47`。
- `hide-build` → `srcache-nginx-module:src/ngx_http_srcache_util.c:1144–1284`。
- `ext340-srcache-header-size` → `srcache-nginx-module:src/ngx_http_srcache_util.c:953–1018`。
- `ext340-srcache-header-write` → `srcache-nginx-module:src/ngx_http_srcache_util.c:1037–1110`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:656–661`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `rds-json-nginx-module--ngx_http_rds_json_filter_module--rds_json_ret`

机制核对：setter保存必填errcode、编译errstr并装core handler；完整模块merge仅处理格式/过滤参数，无errcode/errstr复制。ret consumer31直接消费当前errstr；结合if脚本切换配置与core保留旧handler，报告潜在参数缺口，未运行故不报确定现场响应/崩溃。

- defaults / verified：未配置时没有默认rds_json_ret响应动作或默认错误参数：errcode初始为空、errstr为NULL，只有显式配置才设置参数并安装本层content handler。不能把errcode_key/errstr_key的JSON字段名默认值当作默认错误响应，也不能将本层省略解释成任意if路径都安全无动作。 来源：`registration`、`configuration-definition`、`create-merge`、`ret-handler`、`ext340-core-create`、`ext340-core-merge`、`ext340-core-handler`、`ext340-core-patch`、`ext340-if-location-switch`。
- inheritance / verified：本项的errcode与errstr没有出现在模块merge中，子层不会复制父错误参数；其他JSON格式参数的merge不等于ret动作继承。core merge也不复制父content handler，普通嵌套location须显式设置自己的ret入口及参数。location内if切换loc_conf可能保留先前r->content_handler；ret handler读取当前loc errstr并直接交给复杂值求值，未补参数的if配置不能据此宣称安全继承父ret。 来源：`registration`、`configuration-definition`、`create-merge`、`ret-handler`、`ext340-core-create`、`ext340-core-merge`、`ext340-core-handler`、`ext340-core-patch`、`ext340-if-location-switch`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `rds-json-nginx-module:src/ngx_http_rds_json_filter_module.c:136–141`。
- `configuration-definition` → `rds-json-nginx-module:src/ngx_http_rds_json_filter_module.c:483–546`。
- `create-merge` → `rds-json-nginx-module:src/ngx_http_rds_json_filter_module.c:411–479`。
- `ret-handler` → `rds-json-nginx-module:src/ngx_http_rds_json_handler.c:10–195`。
- `ext340-core-create` → `nginx:src/http/ngx_http_core_module.c:3547–3653`。
- `ext340-core-merge` → `nginx:src/http/ngx_http_core_module.c:3668–3954`。
- `ext340-core-handler` → `nginx:src/http/ngx_http_core_module.c:1381–1383`。
- `ext340-core-patch` → `openresty:patches/nginx-1.27.1-no_error_pages.patch:1–91`。
- `ext340-if-location-switch` → `nginx:src/http/ngx_http_script.c:1525–1544`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:593–598`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_server`

机制核对：server setter取得该upstream的uscf，把本组servers关联到uscf->servers并指定peer.init_upstream；公共upstream创建独立srv_conf，module无merge_srv_conf。 固定发行Drizzle段只有取包解包；新增公共nginx引用逐份比对34有效补丁相关hunk，无本项合并/handler传播改动。

- inheritance / not_applicable：不适用http/server/location父子继承：只在upstream块声明，为该组独立srv_conf追加servers成员，初始化时据该组成员生成peers。不同upstream不互相合并；同组多次声明追加成员，不能写成父组服务器列表被子组继承。 来源：`registration`、`configuration-definition`、`ext340-drizzle-module-context`、`ext340-drizzle-upstream-create`、`ext340-upstream-context`、`ext340-drizzle-upstream-init`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `drizzle-nginx-module:src/ngx_http_drizzle_module.c:54–59`。
- `configuration-definition` → `drizzle-nginx-module:src/ngx_http_drizzle_upstream.c:84–299`。
- `ext340-drizzle-module-context` → `drizzle-nginx-module:src/ngx_http_drizzle_module.c:150–164`。
- `ext340-drizzle-upstream-create` → `drizzle-nginx-module:src/ngx_http_drizzle_upstream.c:37–78`。
- `ext340-upstream-context` → `nginx:src/http/ngx_http_upstream.c:6080–6148`。
- `ext340-drizzle-upstream-init` → `drizzle-nginx-module:src/ngx_http_drizzle_upstream.c:294–395`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:614–619`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。
- `ext340-upstream-patch-balancer_status_code` → `openresty:patches/nginx-1.27.1-balancer_status_code.patch:1–72`。
- `ext340-upstream-patch-upstream_pipelining` → `openresty:patches/nginx-1.27.1-upstream_pipelining.patch:1–23`。
- `ext340-upstream-patch-upstream_timeout_fields` → `openresty:patches/nginx-1.27.1-upstream_timeout_fields.patch:1–112`。

### `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_keepalive`

机制核对：keepalive setter写本组srv_conf；create清零，init按本组max_cached分配cache，module无srv merge。 固定发行Drizzle段只有取包解包；新增公共nginx引用逐份比对34有效补丁相关hunk，无本项合并/handler传播改动。

- inheritance / not_applicable：不适用location父子继承：仅配置当前upstream独立srv_conf的max_cached、single、overflow，peer初始化只按本组参数建立缓存队列，不复制其他upstream或外层server的连接池。多处location引用同组是共用该组对象，不是继承池参数。 来源：`registration`、`configuration-definition`、`ext340-drizzle-module-context`、`implementation-0`、`ext340-upstream-context`、`ext340-drizzle-keepalive`、`ext340-drizzle-pool-init`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `drizzle-nginx-module:src/ngx_http_drizzle_module.c:61–66`。
- `configuration-definition` → `drizzle-nginx-module:src/ngx_http_drizzle_keepalive.c:25–129`。
- `ext340-drizzle-module-context` → `drizzle-nginx-module:src/ngx_http_drizzle_module.c:150–164`。
- `implementation-0` → `drizzle-nginx-module:src/ngx_http_drizzle_upstream.c:36–78`。
- `ext340-upstream-context` → `nginx:src/http/ngx_http_upstream.c:6080–6148`。
- `ext340-drizzle-keepalive` → `drizzle-nginx-module:src/ngx_http_drizzle_keepalive.c:26–157`。
- `ext340-drizzle-pool-init` → `drizzle-nginx-module:src/ngx_http_drizzle_upstream.c:386–395`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:614–619`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。
- `ext340-upstream-patch-balancer_status_code` → `openresty:patches/nginx-1.27.1-balancer_status_code.patch:1–72`。
- `ext340-upstream-patch-upstream_pipelining` → `openresty:patches/nginx-1.27.1-upstream_pipelining.patch:1–23`。
- `ext340-upstream-patch-upstream_timeout_fields` → `openresty:patches/nginx-1.27.1-upstream_timeout_fields.patch:1–112`。

### `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_query`

机制核对：query setter按无方法/带方法分别建default_query/queries，methods_set联动；handler无可用query时按methods_set区分405/500；引用字段不是默认值修改。 固定发行Drizzle段只有取包解包；新增公共nginx引用逐份比对34有效补丁相关hunk，无本项合并/handler传播改动。

- inheritance / verified：仅当子default_query与queries同时为NULL时，整组复制父default_query、methods_set、queries。子级定义任意默认查询或任一方法查询，就停止整组继承；不会将父级其他方法查询或父默认查询补到子表。同层方法表追加不同方法，重复方法报错；消费时优先方法查询，否则用本组合并结果中的默认查询。 来源：`registration`、`configuration-definition`、`merge-default`、`ext340-drizzle-query-missing`、`implementation-2`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `drizzle-nginx-module:src/ngx_http_drizzle_module.c:68–74`。
- `configuration-definition` → `drizzle-nginx-module:src/ngx_http_drizzle_module.c:333–450`。
- `merge-default` → `drizzle-nginx-module:src/ngx_http_drizzle_module.c:204–289`。
- `ext340-drizzle-query-missing` → `drizzle-nginx-module:src/ngx_http_drizzle_handler.c:72–86`。
- `implementation-2` → `drizzle-nginx-module:src/ngx_http_drizzle_upstream.c:471–525`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:614–619`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_dbname`

机制核对：setter空字符串分支仍分配复杂值对象，merge只按指针NULL判空，consumer仅非空求值结果覆盖dp->dbname。 固定发行Drizzle段只有取包解包；新增公共nginx引用逐份比对34有效补丁相关hunk，无本项合并/handler传播改动。

- inheritance / verified：子dbname指针为空时复制父复杂值指针；子显式配置即保留自己的复杂值，不追加父值。显式空字符串也会创建非NULL复杂值，因此阻止父dbname继承；消费时求值为空不作为数据库名覆盖，不能把空结果当成继续继承父dbname。 来源：`registration`、`configuration-definition`、`merge-default`、`implementation-0`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `drizzle-nginx-module:src/ngx_http_drizzle_module.c:76–82`。
- `configuration-definition` → `drizzle-nginx-module:src/ngx_http_drizzle_module.c:292–330`。
- `merge-default` → `drizzle-nginx-module:src/ngx_http_drizzle_module.c:204–289`。
- `implementation-0` → `drizzle-nginx-module:src/ngx_http_drizzle_upstream.c:448–469`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:614–619`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_pass`

机制核对：特别报告：create241设complex_target=UNSET_PTR；merge无目标处理；handler119仅作真值判断后交给复杂值求值，不识别UNSET。普通独立location无自动handler，但if保留旧handler路径存在静态缺口，不修源码、不猜实际崩溃结果。 固定发行Drizzle段只有取包解包；新增公共nginx引用逐份比对34有效补丁相关hunk，无本项合并/handler传播改动。

- defaults / verified：没有内置drizzle后端；未写pass不会设置本层静态目标或安装drizzle content handler。complex_target创建为UNSET_PTR且merge不消除此哨兵，这不是有效默认目标；若通过if等路径保留旧handler而读到未配置子loc，不能把省略解释为安全执行。显式变量目标求值为空/查找不到组会返回500，无固定目标回退。 来源：`registration`、`configuration-definition`、`ext340-drizzle-create-merge`、`ext340-drizzle-pass-consumer`、`ext340-core-create`、`ext340-core-merge`、`ext340-core-handler`、`ext340-core-patch`、`ext340-if-location-switch`。
- inheritance / verified：固定merge既不复制静态upstream.upstream，也不合并complex_target；父pass目标不自动传给子location。子显式静态/变量pass分别设置自己的目标并安装本层handler，core merge不复制父content handler。location内if可能保留先前请求handler但改读子loc；未配置子pass时complex_target仍是UNSET_PTR，不能据此承诺安全继承目标或正常运行。 来源：`registration`、`configuration-definition`、`ext340-drizzle-create-merge`、`ext340-drizzle-pass-consumer`、`ext340-core-create`、`ext340-core-merge`、`ext340-core-handler`、`ext340-core-patch`、`ext340-if-location-switch`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `drizzle-nginx-module:src/ngx_http_drizzle_module.c:84–89`。
- `configuration-definition` → `drizzle-nginx-module:src/ngx_http_drizzle_module.c:453–523`。
- `ext340-drizzle-create-merge` → `drizzle-nginx-module:src/ngx_http_drizzle_module.c:205–289`。
- `ext340-drizzle-pass-consumer` → `drizzle-nginx-module:src/ngx_http_drizzle_handler.c:72–164`。
- `ext340-core-create` → `nginx:src/http/ngx_http_core_module.c:3547–3653`。
- `ext340-core-merge` → `nginx:src/http/ngx_http_core_module.c:3668–3954`。
- `ext340-core-handler` → `nginx:src/http/ngx_http_core_module.c:1381–1383`。
- `ext340-core-patch` → `openresty:patches/nginx-1.27.1-no_error_pages.patch:1–91`。
- `ext340-if-location-switch` → `nginx:src/http/ngx_http_script.c:1525–1544`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:614–619`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_connect_timeout`

机制核对：注册callback=ngx_conf_set_msec_slot，offset精确指向upstream.connect_timeout；create对应UNSET，merge调用相应宏；src/ngx_http_drizzle_util.c:729–734消费当前已合并字段。 固定发行Drizzle段只有取包解包；新增公共nginx引用逐份比对34有效补丁相关hunk，无本项合并/handler传播改动。

- inheritance / verified：按loc配置对象的 upstream.connect_timeout 单独合并：子层未显式设置、仍为UNSET时取父层值；子层显式值保留，不叠加父值。http/server/location及允许的location内if沿配置树应用此规则，不与query整组或pass目标合并混同。 来源：`registration`、`configuration-definition`、`ext340-drizzle-create-merge`、`ext340-merge-macros`、`implementation-4`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `drizzle-nginx-module:src/ngx_http_drizzle_module.c:91–97`。
- `configuration-definition` → `nginx:src/core/ngx_conf_file.c:1260–1287`。
- `ext340-drizzle-create-merge` → `drizzle-nginx-module:src/ngx_http_drizzle_module.c:205–289`。
- `ext340-merge-macros` → `nginx:src/core/ngx_conf_file.h:205–233`。
- `implementation-4` → `drizzle-nginx-module:src/ngx_http_drizzle_util.c:729–743`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:614–619`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_send_query_timeout`

机制核对：注册callback=ngx_conf_set_msec_slot，offset精确指向upstream.send_timeout；create对应UNSET，merge调用相应宏；src/ngx_http_drizzle_processor.c:208–224消费当前已合并字段。 固定发行Drizzle段只有取包解包；新增公共nginx引用逐份比对34有效补丁相关hunk，无本项合并/handler传播改动。

- inheritance / verified：按loc配置对象的 upstream.send_timeout 单独合并：子层未显式设置、仍为UNSET时取父层值；子层显式值保留，不叠加父值。http/server/location及允许的location内if沿配置树应用此规则，不与query整组或pass目标合并混同。 来源：`registration`、`configuration-definition`、`ext340-drizzle-create-merge`、`ext340-merge-macros`、`implementation-4`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `drizzle-nginx-module:src/ngx_http_drizzle_module.c:99–105`。
- `configuration-definition` → `nginx:src/core/ngx_conf_file.c:1260–1287`。
- `ext340-drizzle-create-merge` → `drizzle-nginx-module:src/ngx_http_drizzle_module.c:205–289`。
- `ext340-merge-macros` → `nginx:src/core/ngx_conf_file.h:205–233`。
- `implementation-4` → `drizzle-nginx-module:src/ngx_http_drizzle_processor.c:180–228`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:614–619`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_recv_cols_timeout`

机制核对：注册callback=ngx_conf_set_msec_slot，offset精确指向recv_cols_timeout；create对应UNSET，merge调用相应宏；src/ngx_http_drizzle_processor.c:312–325消费当前已合并字段。 固定发行Drizzle段只有取包解包；新增公共nginx引用逐份比对34有效补丁相关hunk，无本项合并/handler传播改动。

- inheritance / verified：按loc配置对象的 recv_cols_timeout 单独合并：子层未显式设置、仍为UNSET时取父层值；子层显式值保留，不叠加父值。http/server/location及允许的location内if沿配置树应用此规则，不与query整组或pass目标合并混同。 来源：`registration`、`configuration-definition`、`ext340-drizzle-create-merge`、`ext340-merge-macros`、`implementation-4`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `drizzle-nginx-module:src/ngx_http_drizzle_module.c:107–113`。
- `configuration-definition` → `nginx:src/core/ngx_conf_file.c:1260–1287`。
- `ext340-drizzle-create-merge` → `drizzle-nginx-module:src/ngx_http_drizzle_module.c:205–289`。
- `ext340-merge-macros` → `nginx:src/core/ngx_conf_file.h:205–233`。
- `implementation-4` → `drizzle-nginx-module:src/ngx_http_drizzle_processor.c:305–339`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:614–619`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_recv_rows_timeout`

机制核对：注册callback=ngx_conf_set_msec_slot，offset精确指向recv_rows_timeout；create对应UNSET，merge调用相应宏；src/ngx_http_drizzle_processor.c:494–504消费当前已合并字段。 固定发行Drizzle段只有取包解包；新增公共nginx引用逐份比对34有效补丁相关hunk，无本项合并/handler传播改动。

- inheritance / verified：按loc配置对象的 recv_rows_timeout 单独合并：子层未显式设置、仍为UNSET时取父层值；子层显式值保留，不叠加父值。http/server/location及允许的location内if沿配置树应用此规则，不与query整组或pass目标合并混同。 来源：`registration`、`configuration-definition`、`ext340-drizzle-create-merge`、`ext340-merge-macros`、`implementation-5`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `drizzle-nginx-module:src/ngx_http_drizzle_module.c:115–121`。
- `configuration-definition` → `nginx:src/core/ngx_conf_file.c:1260–1287`。
- `ext340-drizzle-create-merge` → `drizzle-nginx-module:src/ngx_http_drizzle_module.c:205–289`。
- `ext340-merge-macros` → `nginx:src/core/ngx_conf_file.h:205–233`。
- `implementation-5` → `drizzle-nginx-module:src/ngx_http_drizzle_processor.c:494–512`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:614–619`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_module_header`

机制核对：注册callback=ngx_conf_set_flag_slot，offset精确指向enable_module_header；create对应UNSET，merge调用相应宏；src/ngx_http_drizzle_output.c:230–244消费当前已合并字段。 固定发行Drizzle段只有取包解包；新增公共nginx引用逐份比对34有效补丁相关hunk，无本项合并/handler传播改动。

- inheritance / verified：按loc配置对象的 enable_module_header 单独合并：子层未显式设置、仍为UNSET时取父层值；子层显式值保留，不叠加父值。子级显式off可以覆盖父级on。http/server/location及允许的location内if沿配置树应用此规则，不与query整组或pass目标合并混同。 来源：`registration`、`configuration-definition`、`ext340-drizzle-create-merge`、`ext340-merge-macros`、`implementation-1`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `drizzle-nginx-module:src/ngx_http_drizzle_module.c:123–129`。
- `configuration-definition` → `nginx:src/core/ngx_conf_file.c:1026–1062`。
- `ext340-drizzle-create-merge` → `drizzle-nginx-module:src/ngx_http_drizzle_module.c:205–289`。
- `ext340-merge-macros` → `nginx:src/core/ngx_conf_file.h:205–233`。
- `implementation-1` → `drizzle-nginx-module:src/ngx_http_drizzle_output.c:224–245`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:614–619`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_buffer_size`

机制核对：注册callback=ngx_conf_set_size_slot，offset精确指向buf_size；create对应UNSET，merge调用相应宏；src/ngx_http_drizzle_output.c:587–612消费当前已合并字段。 固定发行Drizzle段只有取包解包；新增公共nginx引用逐份比对34有效补丁相关hunk，无本项合并/handler传播改动。

- inheritance / verified：按loc配置对象的 buf_size 单独合并：子层未显式设置、仍为UNSET时取父层值；子层显式值保留，不叠加父值。http/server/location及允许的location内if沿配置树应用此规则，不与query整组或pass目标合并混同。 来源：`registration`、`configuration-definition`、`ext340-drizzle-create-merge`、`ext340-merge-macros`、`ext340-drizzle-value-consumer`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `drizzle-nginx-module:src/ngx_http_drizzle_module.c:131–137`。
- `configuration-definition` → `nginx:src/core/ngx_conf_file.c:1198–1225`。
- `ext340-drizzle-create-merge` → `drizzle-nginx-module:src/ngx_http_drizzle_module.c:205–289`。
- `ext340-merge-macros` → `nginx:src/core/ngx_conf_file.h:205–233`。
- `ext340-drizzle-value-consumer` → `drizzle-nginx-module:src/ngx_http_drizzle_output.c:587–612`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:614–619`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `drizzle-nginx-module--ngx_http_drizzle_module--drizzle_status`

机制核对：NOARGS setter只赋clcf->handler，consumer遍历main upstream表；没有独立status字段参与merge。 固定发行Drizzle段只有取包解包；新增公共nginx引用逐份比对34有效补丁相关hunk，无本项合并/handler传播改动。

- defaults / verified：未配置时不为当前配置对象安装drizzle状态内容handler，也没有默认开启的状态页；不等于显式配置后的状态输出为空，后者由请求时读取的upstream/连接池状态决定。 来源：`registration`、`configuration-definition`、`ext340-drizzle-create-merge`、`implementation-0`、`ext340-core-create`、`ext340-core-merge`、`ext340-core-handler`、`ext340-core-patch`。
- inheritance / verified：此指令只把当前core loc handler设为状态handler；模块merge不保存或传播status动作，core merge也不复制父handler。因此普通独立子location省略时不会自动成为drizzle状态页，显式配置才安装本层入口；没有状态开关数组可作父子追加。 来源：`registration`、`configuration-definition`、`ext340-drizzle-create-merge`、`implementation-0`、`ext340-core-create`、`ext340-core-merge`、`ext340-core-handler`、`ext340-core-patch`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `drizzle-nginx-module:src/ngx_http_drizzle_module.c:139–144`。
- `configuration-definition` → `drizzle-nginx-module:src/ngx_http_drizzle_module.c:560–569`。
- `ext340-drizzle-create-merge` → `drizzle-nginx-module:src/ngx_http_drizzle_module.c:205–289`。
- `implementation-0` → `drizzle-nginx-module:src/ngx_http_drizzle_handler.c:396–520`。
- `ext340-core-create` → `nginx:src/http/ngx_http_core_module.c:3547–3653`。
- `ext340-core-merge` → `nginx:src/http/ngx_http_core_module.c:3668–3954`。
- `ext340-core-handler` → `nginx:src/http/ngx_http_core_module.c:1381–1383`。
- `ext340-core-patch` → `openresty:patches/nginx-1.27.1-no_error_pages.patch:1–91`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:614–619`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `redis-nginx-module--ngx_http_redis_module--redis_pass`

机制核对：上游原pass仅静态，必须结合实际变量补丁7/32–64/110–184行：新complex_target随pcalloc为NULL，无merge补丁；handler动态求值后回写静态目标。default_port_fix的nginx_version<1011006在1.27.1为假，不将补丁外未编译default_port比较当实际限制。参数复制、请求时回写、handler安装与if切换分开；原有非目标事实保留。

- defaults / verified：没有预设Redis目标，未显式配置时本层静态指针和复杂目标指针均为空，只有pass setter安装本层content handler。本层省略不等于禁用所有父参数：静态指针仍可由merge复制；if切换配置也可能保留已有请求handler。变量目标求值为空或未找到已配置upstream时返回500，不回退到固定默认服务器。 来源：`registration`、`configuration-definition`、`create-merge`、`ext340-core-create`、`ext340-core-merge`、`ext340-core-handler`、`ext340-core-patch`、`ext340-if-location-switch`、`variable-pass`、`port-compat`、`ext340-redis-patch-remove_content_encoding`。
- inheritance / verified：仅当子upstream.upstream为空时复制父静态目标，complex_target并未由merge复制。子显式静态pass保留自己的指针；子显式变量pass保留自己的复杂目标，静态槽仍可能从父层填入，运行时成功求值后再回写目标。core merge不复制父content handler，普通独立子location不会仅因静态参数存在而自动启用该处理器；location内if切换可能保留旧handler但读取子配置，不能保证父变量目标安全沿用。发行variables_in_redis_pass补丁新增变量分支而未补merge；固定1.27.1下default_port_fix使旧default_port成员比较不编译，只按组名和port查找。 来源：`registration`、`configuration-definition`、`create-merge`、`ext340-core-create`、`ext340-core-merge`、`ext340-core-handler`、`ext340-core-patch`、`ext340-if-location-switch`、`variable-pass`、`port-compat`、`ext340-redis-patch-remove_content_encoding`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `redis-nginx-module:ngx_http_redis_module.c:66–71`。
- `configuration-definition` → `redis-nginx-module:ngx_http_redis_module.c:898–940`。
- `create-merge` → `redis-nginx-module:ngx_http_redis_module.c:776–894`。
- `ext340-core-create` → `nginx:src/http/ngx_http_core_module.c:3547–3653`。
- `ext340-core-merge` → `nginx:src/http/ngx_http_core_module.c:3668–3954`。
- `ext340-core-handler` → `nginx:src/http/ngx_http_core_module.c:1381–1383`。
- `ext340-core-patch` → `openresty:patches/nginx-1.27.1-no_error_pages.patch:1–91`。
- `ext340-if-location-switch` → `nginx:src/http/ngx_http_script.c:1525–1544`。
- `variable-pass` → `openresty:patches/ngx_http_redis-0.3.9-variables_in_redis_pass.patch:1–189`。
- `port-compat` → `openresty:patches/ngx_http_redis-0.3.9-default_port_fix.patch:1–17`。
- `ext340-redis-patch-remove_content_encoding` → `openresty:patches/ngx_http_redis-0.3.9-remove_content_encoding.patch:1–14`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。
- `ext340-upstream-patch-balancer_status_code` → `openresty:patches/nginx-1.27.1-balancer_status_code.patch:1–72`。
- `ext340-upstream-patch-upstream_pipelining` → `openresty:patches/nginx-1.27.1-upstream_pipelining.patch:1–23`。
- `ext340-upstream-patch-upstream_timeout_fields` → `openresty:patches/nginx-1.27.1-upstream_timeout_fields.patch:1–112`。

### `redis-nginx-module--ngx_http_redis_module--redis_bind`

机制核对：已实际确认注册TAKE1、offset=upstream.local；固定源码全文件搜索local只有该注册offset，完整create/merge无初始化哨兵和复制。公共检查6446先于off6452，NULL不等于(void*)-1。Redis三有效补丁未增加local初始化/merge，default_port_fix有offset=2的历史审计，不写零偏移。现有defaults及limitations已明确同一缺陷，本次无冲突且原样保留。

- inheritance / verified：固定版本没有对upstream.local的父子合并：本层pcalloc使其为NULL，完整merge没有复制父local。更重要的是公共bind setter先要求NGX_CONF_UNSET_PTR，而模块没有设该哨兵，故首次显式配置（包括off）也在重复检查处返回is duplicate。不存在可正常配置后再按父子覆盖/取消的bind路径，不能写成“未设置继承父绑定”或“off取消父绑定”。未设置NULL由消费端表示不指定出站源地址。此为固定源码组合结论，未运行验证。 来源：`registration`、`configuration-definition`、`create-merge`、`unset-pointer`、`local-null`、`ext340-redis-patch-variables_in_redis_pass`、`ext340-redis-patch-default_port_fix`、`ext340-redis-patch-remove_content_encoding`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `redis-nginx-module:ngx_http_redis_module.c:74–79`。
- `configuration-definition` → `nginx:src/http/ngx_http_upstream.c:6433–6529`。
- `create-merge` → `redis-nginx-module:ngx_http_redis_module.c:776–894`。
- `unset-pointer` → `nginx:src/core/ngx_conf_file.h:55–60`。
- `local-null` → `nginx:src/http/ngx_http_upstream.c:6533–6552`。
- `ext340-redis-patch-variables_in_redis_pass` → `openresty:patches/ngx_http_redis-0.3.9-variables_in_redis_pass.patch:1–189`。
- `ext340-redis-patch-default_port_fix` → `openresty:patches/ngx_http_redis-0.3.9-default_port_fix.patch:1–17`。
- `ext340-redis-patch-remove_content_encoding` → `openresty:patches/ngx_http_redis-0.3.9-remove_content_encoding.patch:1–14`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。
- `ext340-upstream-patch-balancer_status_code` → `openresty:patches/nginx-1.27.1-balancer_status_code.patch:1–72`。
- `ext340-upstream-patch-upstream_pipelining` → `openresty:patches/nginx-1.27.1-upstream_pipelining.patch:1–23`。
- `ext340-upstream-patch-upstream_timeout_fields` → `openresty:patches/nginx-1.27.1-upstream_timeout_fields.patch:1–112`。

### `redis2-nginx-module--ngx_http_redis2_module--redis2_query`

机制核对：逐项绑定ngx_http_redis2_query，create清零相应槽；merge对queries/complex_query/complex_query_count/literal_query逐槽处理，并非互斥整组。consumer123先queries，131测试literal长度后进入raw，189为literal分支；本轮只补defaults，不改已核继承。

- defaults / verified：没有自动生成的命令数组（queries=NULL）；不因未写本项而自动生成GET/SELECT等命令。 本层省略须结合各槽合并结果判断：实际构造依次优先queries，其次非空literal，再complex_query；全部无有效查询时返回NGX_ERROR，不发送虚构默认命令。 来源：`registration`、`configuration-definition`、`create-merge`、`query-selection`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `redis2-nginx-module:src/ngx_http_redis2_module.c:34–39`。
- `configuration-definition` → `redis2-nginx-module:src/ngx_http_redis2_module.c:313–382`。
- `create-merge` → `redis2-nginx-module:src/ngx_http_redis2_module.c:147–246`。
- `query-selection` → `redis2-nginx-module:src/ngx_http_redis2_handler.c:108–216`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:732–737`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `redis2-nginx-module--ngx_http_redis2_module--redis2_raw_query`

机制核对：逐项绑定ngx_http_redis2_set_complex_value_slot，create清零相应槽；merge对queries/complex_query/complex_query_count/literal_query逐槽处理，并非互斥整组。consumer123先queries，131测试literal长度后进入raw，189为literal分支；本轮只补defaults，不改已核继承。

- defaults / verified：没有预置raw复杂查询（complex_query=NULL）；在实际选中raw路径且未配置或合并到complex_query时，构造请求报缺少查询。raw分支有查询但未设置complex_query_count时按1个回复处理。 本层省略须结合各槽合并结果判断：实际构造依次优先queries，其次非空literal，再complex_query；全部无有效查询时返回NGX_ERROR，不发送虚构默认命令。 来源：`registration`、`configuration-definition`、`create-merge`、`query-selection`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `redis2-nginx-module:src/ngx_http_redis2_module.c:41–46`。
- `configuration-definition` → `redis2-nginx-module:src/ngx_http_redis2_util.c:13–50`。
- `create-merge` → `redis2-nginx-module:src/ngx_http_redis2_module.c:147–246`。
- `query-selection` → `redis2-nginx-module:src/ngx_http_redis2_handler.c:108–216`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:732–737`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `redis2-nginx-module--ngx_http_redis2_module--redis2_raw_queries`

机制核对：逐项绑定ngx_http_redis2_raw_queries，create清零相应槽；merge对queries/complex_query/complex_query_count/literal_query逐槽处理，并非互斥整组。consumer123先queries，131测试literal长度后进入raw，189为literal分支；本轮只补defaults，不改已核继承。

- defaults / verified：没有自动配置的N和CMDS复杂值（complex_query_count/complex_query均为NULL）；N只有显式本项才编译。实际raw路径若count未设置则按1个回复处理，不代表默认生成一条查询。 本层省略须结合各槽合并结果判断：实际构造依次优先queries，其次非空literal，再complex_query；全部无有效查询时返回NGX_ERROR，不发送虚构默认命令。 来源：`registration`、`configuration-definition`、`create-merge`、`query-selection`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `redis2-nginx-module:src/ngx_http_redis2_module.c:48–53`。
- `configuration-definition` → `redis2-nginx-module:src/ngx_http_redis2_module.c:386–432`。
- `create-merge` → `redis2-nginx-module:src/ngx_http_redis2_module.c:147–246`。
- `query-selection` → `redis2-nginx-module:src/ngx_http_redis2_handler.c:108–216`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:732–737`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `redis2-nginx-module--ngx_http_redis2_module--redis2_literal_raw_query`

机制核对：逐项绑定ngx_conf_set_str_slot，create清零相应槽；merge对queries/complex_query/complex_query_count/literal_query逐槽处理，并非互斥整组。consumer123先queries，131测试literal长度后进入raw，189为literal分支；本轮只补defaults，不改已核继承。

- defaults / verified：literal_query初始为{0,NULL}，没有预置字面命令。非空literal才被选中，显式空串也不产生可发送的默认命令。 本层省略须结合各槽合并结果判断：实际构造依次优先queries，其次非空literal，再complex_query；全部无有效查询时返回NGX_ERROR，不发送虚构默认命令。 来源：`registration`、`configuration-definition`、`create-merge`、`query-selection`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `redis2-nginx-module:src/ngx_http_redis2_module.c:55–60`。
- `configuration-definition` → `nginx:src/core/ngx_conf_file.c:1066–1089`。
- `create-merge` → `redis2-nginx-module:src/ngx_http_redis2_module.c:147–246`。
- `query-selection` → `redis2-nginx-module:src/ngx_http_redis2_handler.c:108–216`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:732–737`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `redis2-nginx-module--ngx_http_redis2_module--redis2_pass`

机制核对：静态/变量setter分别写目标槽，handler43–70按当前complex_target求值，merge224–226仅复制静态槽。参数复制、请求时回写、handler安装与if切换分开；原有非目标事实保留。

- defaults / verified：没有预设Redis2目标，未显式配置时本层静态指针和复杂目标指针均为空，只有pass setter安装本层content handler。本层省略不等于禁用所有父参数：静态指针仍可由merge复制；if切换配置也可能保留已有请求handler。变量目标求值为空或未找到已配置upstream时返回500，不回退到固定默认服务器。 来源：`registration`、`configuration-definition`、`create-merge`、`ext340-core-create`、`ext340-core-merge`、`ext340-core-handler`、`ext340-core-patch`、`ext340-if-location-switch`、`handler`。
- inheritance / verified：仅当子upstream.upstream为空时复制父静态目标，complex_target并未由merge复制。子显式静态pass保留自己的指针；子显式变量pass保留自己的复杂目标，静态槽仍可能从父层填入，运行时成功求值后再回写目标。core merge不复制父content handler，普通独立子location不会仅因静态参数存在而自动启用该处理器；location内if切换可能保留旧handler但读取子配置，不能保证父变量目标安全沿用。 来源：`registration`、`configuration-definition`、`create-merge`、`ext340-core-create`、`ext340-core-merge`、`ext340-core-handler`、`ext340-core-patch`、`ext340-if-location-switch`、`handler`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `redis2-nginx-module:src/ngx_http_redis2_module.c:63–68`。
- `configuration-definition` → `redis2-nginx-module:src/ngx_http_redis2_module.c:250–309`。
- `create-merge` → `redis2-nginx-module:src/ngx_http_redis2_module.c:147–246`。
- `ext340-core-create` → `nginx:src/http/ngx_http_core_module.c:3547–3653`。
- `ext340-core-merge` → `nginx:src/http/ngx_http_core_module.c:3668–3954`。
- `ext340-core-handler` → `nginx:src/http/ngx_http_core_module.c:1381–1383`。
- `ext340-core-patch` → `openresty:patches/nginx-1.27.1-no_error_pages.patch:1–91`。
- `ext340-if-location-switch` → `nginx:src/http/ngx_http_script.c:1525–1544`。
- `handler` → `redis2-nginx-module:src/ngx_http_redis2_handler.c:22–104`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:732–737`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。
- `ext340-upstream-patch-balancer_status_code` → `openresty:patches/nginx-1.27.1-balancer_status_code.patch:1–72`。
- `ext340-upstream-patch-upstream_pipelining` → `openresty:patches/nginx-1.27.1-upstream_pipelining.patch:1–23`。
- `ext340-upstream-patch-upstream_timeout_fields` → `openresty:patches/nginx-1.27.1-upstream_timeout_fields.patch:1–112`。

### `redis2-nginx-module--ngx_http_redis2_module--redis2_bind`

机制核对：已实际确认注册TAKE1、offset=upstream.local；固定源码全文件搜索local只有该注册offset，完整create/merge无初始化哨兵和复制。公共检查6446先于off6452，NULL不等于(void*)-1。Redis2发行仅解包，无组件补丁。现有defaults及limitations已明确同一缺陷，本次无冲突且原样保留。

- inheritance / verified：固定版本没有对upstream.local的父子合并：本层pcalloc使其为NULL，完整merge没有复制父local。更重要的是公共bind setter先要求NGX_CONF_UNSET_PTR，而模块没有设该哨兵，故首次显式配置（包括off）也在重复检查处返回is duplicate。不存在可正常配置后再按父子覆盖/取消的bind路径，不能写成“未设置继承父绑定”或“off取消父绑定”。未设置NULL由消费端表示不指定出站源地址。此为固定源码组合结论，未运行验证。 来源：`registration`、`configuration-definition`、`create-merge`、`unset-pointer`、`local-null`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `redis2-nginx-module:src/ngx_http_redis2_module.c:70–75`。
- `configuration-definition` → `nginx:src/http/ngx_http_upstream.c:6433–6529`。
- `create-merge` → `redis2-nginx-module:src/ngx_http_redis2_module.c:147–246`。
- `unset-pointer` → `nginx:src/core/ngx_conf_file.h:55–60`。
- `local-null` → `nginx:src/http/ngx_http_upstream.c:6533–6552`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:732–737`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。
- `ext340-upstream-patch-balancer_status_code` → `openresty:patches/nginx-1.27.1-balancer_status_code.patch:1–72`。
- `ext340-upstream-patch-upstream_pipelining` → `openresty:patches/nginx-1.27.1-upstream_pipelining.patch:1–23`。
- `ext340-upstream-patch-upstream_timeout_fields` → `openresty:patches/nginx-1.27.1-upstream_timeout_fields.patch:1–112`。

### `ngx_postgres--ngx_postgres_module--postgres_server`

机制核对：setter取得本组uscf并把pgscf->servers关联至uscf->servers，安装本组peer初始化；公共upstream重新create_srv_conf，module无merge_srv_conf。 固定发行718–723仅取包解包，无Postgres组件补丁；相关公共逻辑按34有效补丁hunk核对。

- inheritance / not_applicable：不适用http/server/location的父子继承：只在当前upstream独立srv_conf声明，同组多条postgres_server追加本组servers，初始化据本组成员生成peers；不同upstream不合并。多个location引用同组是共享该组，不是继承或复制服务器列表。 来源：`registration`、`configuration-definition`、`lifecycle-owner`、`ext340-postgres-upstream-create`、`ext340-upstream-context`、`ext340-postgres-upstream-init`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `ngx_postgres:src/ngx_postgres_module.c:50–55`。
- `configuration-definition` → `ngx_postgres:src/ngx_postgres_module.c:392–486`。
- `lifecycle-owner` → `ngx_postgres:src/ngx_postgres_module.c:147–174`。
- `ext340-postgres-upstream-create` → `ngx_postgres:src/ngx_postgres_module.c:255–292`。
- `ext340-upstream-context` → `nginx:src/http/ngx_http_upstream.c:6080–6148`。
- `ext340-postgres-upstream-init` → `ngx_postgres:src/ngx_postgres_upstream.c:40–130`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:718–723`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。
- `ext340-upstream-patch-balancer_status_code` → `openresty:patches/nginx-1.27.1-balancer_status_code.patch:1–72`。
- `ext340-upstream-patch-upstream_pipelining` → `openresty:patches/nginx-1.27.1-upstream_pipelining.patch:1–23`。
- `ext340-upstream-patch-upstream_timeout_fields` → `openresty:patches/nginx-1.27.1-upstream_timeout_fields.patch:1–112`。

### `ngx_postgres--ngx_postgres_module--postgres_keepalive`

机制核对：create为每组提供独立参数，setter含off/max/mode/overflow分支并写当前pgscf，init按本组max_cached建立缓存。 固定发行718–723仅取包解包，无Postgres组件补丁；相关公共逻辑按34有效补丁hunk核对。

- inheritance / not_applicable：不适用location父子合并：仅设置当前upstream独立srv_conf的max_cached、single、reject等池参数，初始化为该组建立cache/free队列。不同upstream各有自己的配置和池，不继承外层http/server或其他upstream的keepalive设置；off只关闭当前组的缓存容量。 来源：`registration`、`configuration-definition`、`lifecycle-owner`、`merge-default`、`ext340-upstream-context`、`ext340-postgres-upstream-init`、`ext340-postgres-keepalive-init`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `ngx_postgres:src/ngx_postgres_module.c:57–62`。
- `configuration-definition` → `ngx_postgres:src/ngx_postgres_module.c:488–604`。
- `lifecycle-owner` → `ngx_postgres:src/ngx_postgres_module.c:147–174`。
- `merge-default` → `ngx_postgres:src/ngx_postgres_module.c:254–292`。
- `ext340-upstream-context` → `nginx:src/http/ngx_http_upstream.c:6080–6148`。
- `ext340-postgres-upstream-init` → `ngx_postgres:src/ngx_postgres_upstream.c:40–130`。
- `ext340-postgres-keepalive-init` → `ngx_postgres:src/ngx_postgres_keepalive.c:37–62`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:718–723`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。
- `ext340-upstream-patch-balancer_status_code` → `openresty:patches/nginx-1.27.1-balancer_status_code.patch:1–72`。
- `ext340-upstream-patch-upstream_pipelining` → `openresty:patches/nginx-1.27.1-upstream_pipelining.patch:1–23`。
- `ext340-upstream-patch-upstream_timeout_fields` → `openresty:patches/nginx-1.27.1-upstream_timeout_fields.patch:1–112`。

### `ngx_postgres--ngx_postgres_module--postgres_pass`

机制核对：setter拒绝重复/空目标，静态与变量分路，安装当前clcf handler；merge双空条件与consumer118变量求值闭合。区别于Memc/Redis2单槽复制，保留原默认/限制事实。 固定发行718–723仅取包解包，无Postgres组件补丁；相关公共逻辑按34有效补丁hunk核对。

- inheritance / verified：仅当子静态upstream.upstream和upstream_cv同时为空时，才一起取得父静态目标及复杂目标。子显式配置任一形式即阻止整对目标继承，不将父静态槽与子复杂槽混合。此为目标参数合并，core merge不复制父content handler，普通独立子location须有自己的内容入口；location内if切换可能保留已有handler，届时消费当前子loc合并后的目标。 来源：`registration`、`configuration-definition`、`ext340-postgres-create-merge`、`implementation-0`、`ext340-core-create`、`ext340-core-merge`、`implementation-5`、`ext340-core-patch`、`ext340-if-location-switch`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `ngx_postgres:src/ngx_postgres_module.c:64–69`。
- `configuration-definition` → `ngx_postgres:src/ngx_postgres_module.c:606–681`。
- `ext340-postgres-create-merge` → `ngx_postgres:src/ngx_postgres_module.c:295–386`。
- `implementation-0` → `ngx_postgres:src/ngx_postgres_handler.c:41–150`。
- `ext340-core-create` → `nginx:src/http/ngx_http_core_module.c:3547–3653`。
- `ext340-core-merge` → `nginx:src/http/ngx_http_core_module.c:3668–3954`。
- `implementation-5` → `nginx:src/http/ngx_http_core_module.c:1381–1383`。
- `ext340-core-patch` → `openresty:patches/nginx-1.27.1-no_error_pages.patch:1–91`。
- `ext340-if-location-switch` → `nginx:src/http/ngx_http_script.c:1525–1544`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:718–723`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。
- `ext340-upstream-patch-balancer_status_code` → `openresty:patches/nginx-1.27.1-balancer_status_code.patch:1–72`。
- `ext340-upstream-patch-upstream_pipelining` → `openresty:patches/nginx-1.27.1-upstream_pipelining.patch:1–23`。
- `ext340-upstream-patch-upstream_timeout_fields` → `openresty:patches/nginx-1.27.1-upstream_timeout_fields.patch:1–112`。

### `ngx_postgres--ngx_postgres_module--postgres_query`

机制核对：setter按无方法/有方法分别建立def/methods并记录methods_set；handler缺查询分支与init_peer选择一致，非逐方法父子合并。 固定发行718–723仅取包解包，无Postgres组件补丁；相关公共逻辑按34有效补丁hunk核对。

- inheritance / verified：仅当子query.def和query.methods都为NULL时，整组复制父query.methods_set、query.methods、query.def。子级定义任一方法查询或默认查询即停止整组继承，不补父级其他方法或默认查询；同层不同方法可追加，重复方法报错。消费时先按methods_set选择方法查询，否则取本组默认查询；子仅定义一个方法不保留父默认查询作为兜底。 来源：`registration`、`configuration-definition`、`ext340-postgres-create-merge`、`ext340-postgres-query-missing`、`implementation-2`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `ngx_postgres:src/ngx_postgres_module.c:71–77`。
- `configuration-definition` → `ngx_postgres:src/ngx_postgres_module.c:683–811`。
- `ext340-postgres-create-merge` → `ngx_postgres:src/ngx_postgres_module.c:295–386`。
- `ext340-postgres-query-missing` → `ngx_postgres:src/ngx_postgres_handler.c:67–83`。
- `implementation-2` → `ngx_postgres:src/ngx_postgres_upstream.c:169–222`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:718–723`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `ngx_postgres--ngx_postgres_module--postgres_rewrite`

机制核对：create置UNSET_PTR，setter首条建表后按条件/方法写规则；merge用ptr宏，processor在查询结果之后迭代当前表。 固定发行718–723仅取包解包，无Postgres组件补丁；相关公共逻辑按34有效补丁hunk核对。

- inheritance / verified：rewrites为UNSET_PTR时整张复用父规则表；子级声明任何一条规则后使用自己的整表，不追加父规则，也不逐条件/方法补父规则。同层按条件分组保存默认或方法规则，结果处理阶段逐条件调用；它不是Nginx rewrite阶段代码继承。若无父规则且子未设，merge得到NULL、不执行结果重写。 来源：`registration`、`configuration-definition`、`ext340-postgres-create-merge`、`ext340-pointer-merge`、`implementation-2`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `ngx_postgres:src/ngx_postgres_module.c:79–85`。
- `configuration-definition` → `ngx_postgres:src/ngx_postgres_module.c:813–981`。
- `ext340-postgres-create-merge` → `ngx_postgres:src/ngx_postgres_module.c:295–386`。
- `ext340-pointer-merge` → `nginx:src/core/ngx_conf_file.h:210–213`。
- `implementation-2` → `ngx_postgres:src/ngx_postgres_processor.c:389–444`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:718–723`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `ngx_postgres--ngx_postgres_module--postgres_output`

机制核对：setter从格式表同时写handler/binary；merge370–380联动；consumer发送和输出两个位置分别核实。 固定发行718–723仅取包解包，无Postgres组件补丁；相关公共逻辑按34有效补丁hunk核对。 格式表222–228明确none=NULL、binary_value标志为1，纳入目标字段来源。

- inheritance / verified：子output_handler仍为UNSET_PTR时，连同output_binary一起继承父handler与二进制标志；父也未设才采用模块缺省配对。子显式配置保留自己的handler/标志，即使选择none写入NULL也阻止继承；不能把NULL等同UNSET，或只继承handler而丢失binary。查询发送按binary选择PQ调用，结果处理按handler决定输出。 来源：`registration`、`configuration-definition`、`ext340-postgres-create-merge`、`ext340-postgres-output-binary`、`implementation-2`、`implementation-0`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `ngx_postgres:src/ngx_postgres_module.c:87–93`。
- `configuration-definition` → `ngx_postgres:src/ngx_postgres_module.c:983–1021`。
- `ext340-postgres-create-merge` → `ngx_postgres:src/ngx_postgres_module.c:295–386`。
- `ext340-postgres-output-binary` → `ngx_postgres:src/ngx_postgres_processor.c:241–260`。
- `implementation-2` → `ngx_postgres:src/ngx_postgres_processor.c:404–444`。
- `implementation-0` → `ngx_postgres:src/ngx_postgres_module.c:222–229`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:718–723`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `ngx_postgres--ngx_postgres_module--postgres_set`

机制核对：setter写variables数组且pgvar.idx取本层序号，注册get_handler/data；merge382按UNSET复制；请求store仅按当前loc数组分配和填充。特别报告：全局父变量handler仍持父pgvar->idx，而子独立规则数组可能长度/顺序不同，getter176–187直接按旧idx访问当前store。存在索引错位/越界静态风险；不推定父变量在子结果中的正确值、不修上游，供主审核复核。 固定发行718–723仅取包解包，无Postgres组件补丁；相关公共逻辑按34有效补丁hunk核对。

- inheritance / verified：子variables仍为UNSET_PTR时复用父整张提取规则数组；子声明任一postgres_set后建立自己的数组，停止整表继承，不逐变量追加父规则。同层声明追加本层规则，但同名变量已具有get_handler即拒绝，不能在子层用同名声明覆盖父定义。变量名注册本身是全局的，规则数组替换不等于注销父变量名或给它承诺某个默认值。 来源：`registration`、`configuration-definition`、`ext340-postgres-create-merge`、`ext340-pointer-merge`、`implementation-1`、`implementation-2`、`implementation-3`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `ngx_postgres:src/ngx_postgres_module.c:95–100`。
- `configuration-definition` → `ngx_postgres:src/ngx_postgres_module.c:1023–1160`。
- `ext340-postgres-create-merge` → `ngx_postgres:src/ngx_postgres_module.c:295–386`。
- `ext340-pointer-merge` → `nginx:src/core/ngx_conf_file.h:210–213`。
- `implementation-1` → `ngx_postgres:src/ngx_postgres_handler.c:171–184`。
- `implementation-2` → `ngx_postgres:src/ngx_postgres_processor.c:404–444`。
- `implementation-3` → `ngx_postgres:src/ngx_postgres_variable.c:155–288`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:718–723`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `ngx_postgres--ngx_postgres_module--postgres_escape`

机制核对：实际追到1247取rewrite loc_conf，1249编译源，1254写escape opcode，1287写目标变量索引；consumer按e->ip和栈值处理NULL/空字符串/转义。与postgres_rewrite和postgres_set分别判定；注册不允许if，不套用NDK或if注册行为。 固定发行718–723仅取包解包，无Postgres组件补丁；相关公共逻辑按34有效补丁hunk核对。

- inheritance / verified：本项由专用setter直接将求值、escape和变量赋值opcode编入当前ngx_http_rewrite_module的codes，不是Postgres查询结果规则，也不经NDK。独立子location未写本项时codes不会由父location自动复制；子显式动作编入自己的序列，不追加父序列。server动作先在server-rewrite阶段执行，不表示location继承；http级codes也不会经merge复制给server。省略源参数的原地转义仅决定赋值输入/目标，不是配置继承。 来源：`registration`、`configuration-definition`、`implementation-0`、`implementation-1`、`implementation-2`、`ext340-rewrite-create-merge`、`ext340-http-merge-tree`、`ext340-http-phases`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `ngx_postgres:src/ngx_postgres_module.c:102–107`。
- `configuration-definition` → `ngx_postgres:src/ngx_postgres_module.c:1166–1292`。
- `implementation-0` → `ngx_postgres:src/ngx_postgres_util.c:318–406`。
- `implementation-1` → `ngx_postgres:src/ngx_postgres_escape.c:41–97`。
- `implementation-2` → `nginx:src/http/modules/ngx_http_rewrite_module.c:136–184`。
- `ext340-rewrite-create-merge` → `nginx:src/http/modules/ngx_http_rewrite_module.c:221–294`。
- `ext340-http-merge-tree` → `nginx:src/http/ngx_http.c:570–666`。
- `ext340-http-phases` → `nginx:src/http/ngx_http.c:486–556`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:718–723`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

### `ngx_postgres--ngx_postgres_module--postgres_connect_timeout`

机制核对：注册msec setter offset=upstream.connect_timeout；create明确UNSET_MSEC，merge分别取父值后缺省10000/30000ms（本轮不改默认字段）；handler赋u->conf并调用公共初始化。新增跨组件消费引用已核有效超时补丁，不把上游原u->conf消费行当最终发行实现。 固定发行718–723仅取包解包，无Postgres组件补丁；相关公共逻辑按34有效补丁hunk核对。

- inheritance / verified：子upstream.connect_timeout仍为UNSET_MSEC时取父值；子显式值保留，不与父超时相加。http/server/location沿loc配置树单字段合并。固定发行公共upstream_timeout_fields补丁在upstream初始化时从u->conf复制连接超时到u->connect_timeout，连接等待使用该请求字段；补丁不改变本模块父子merge规则。 来源：`registration`、`configuration-definition`、`ext340-postgres-create-merge`、`ext340-msec-merge`、`implementation-0`、`ext340-upstream-init`、`ext340-upstream-connect-timer`、`patch-upstream_timeout_fields`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `ngx_postgres:src/ngx_postgres_module.c:109–114`。
- `configuration-definition` → `nginx:src/core/ngx_conf_file.c:1260–1287`。
- `ext340-postgres-create-merge` → `ngx_postgres:src/ngx_postgres_module.c:295–386`。
- `ext340-msec-merge` → `nginx:src/core/ngx_conf_file.h:220–223`。
- `implementation-0` → `ngx_postgres:src/ngx_postgres_handler.c:188–216`。
- `ext340-upstream-init` → `nginx:src/http/ngx_http_upstream.c:508–529`。
- `ext340-upstream-connect-timer` → `nginx:src/http/ngx_http_upstream.c:1659–1668`。
- `patch-upstream_timeout_fields` → `openresty:patches/nginx-1.27.1-upstream_timeout_fields.patch:1–112`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:718–723`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。
- `ext340-upstream-patch-upstream_pipelining` → `openresty:patches/nginx-1.27.1-upstream_pipelining.patch:1–23`。

### `ngx_postgres--ngx_postgres_module--postgres_result_timeout`

机制核对：注册msec setter offset=upstream.read_timeout；create明确UNSET_MSEC，merge分别取父值后缺省10000/30000ms（本轮不改默认字段）；handler赋u->conf并调用公共初始化。本组件结果计时器不是公共补丁中替换的源码行。 固定发行718–723仅取包解包，无Postgres组件补丁；相关公共逻辑按34有效补丁hunk核对。

- inheritance / verified：子upstream.read_timeout仍为UNSET_MSEC时取父值；子显式值保留，不与父超时相加。http/server/location沿loc配置树单字段合并。结果等待由本模块在发送查询成功后给read事件安装当前u->conf->read_timeout计时器，取已合并值。 来源：`registration`、`configuration-definition`、`ext340-postgres-create-merge`、`ext340-msec-merge`、`implementation-0`、`implementation-1`。

来源锚点（以下行号均属于上表固定revision）：

- `registration` → `ngx_postgres:src/ngx_postgres_module.c:116–121`。
- `configuration-definition` → `nginx:src/core/ngx_conf_file.c:1260–1287`。
- `ext340-postgres-create-merge` → `ngx_postgres:src/ngx_postgres_module.c:295–386`。
- `ext340-msec-merge` → `nginx:src/core/ngx_conf_file.h:220–223`。
- `implementation-0` → `ngx_postgres:src/ngx_postgres_handler.c:188–216`。
- `implementation-1` → `ngx_postgres:src/ngx_postgres_processor.c:231–283`。
- `ext340-distribution` → `openresty:util/mirror-tarballs:718–723`。
- `ext340-patch-set` → `openresty:util/mirror-tarballs:35–550`。

## ER01修订与NDK上下文逐项复查

本轮已交付事实仅修改 `iconv-nginx-module--ngx_http_iconv_module--set_iconv` 的 `inheritance.text`；`status`、`source_ids`、`defaults`、`evidence`、`patch_source_ids` 和全部92项数组顺序均不变，其他91身份完整对象不变。旧稿把其他NDK动作允许的http/server/if说明套到本项，属于文案错误；修订限定合法location及嵌套location，不再暗示这些非法上下文可声明本项。此修订待独立复核，不代替主线程按精确字段合并。

固定Iconv注册60–66仅有 `NGX_HTTP_LOC_CONF|NGX_CONF_TAKE4`，setter593–628调用NDK不扩大上下文。固定Nginx `src/core/ngx_conf_file.c:393–397` 先检查 `cmd->type & cf->cmd_type`，463行才调用setter；该公共文件无有效发行补丁hunk，沿用上节已核补丁集合。NDK编译写当前rewrite codes，公共rewrite的create/merge（221–267）不复制父动作；Iconv697–743只对buffer及过滤器参数另行合并。注册、编译及merge的原有来源已足够支撑修订，不改来源前缀。

以下35个NDK动作均重新从上表固定Git对象读取各自注册，并逐项对照现有inheritance文案。除ER01外，其余34项未发现同类非法上下文泛化；Form Input两项只有MAIN/SRV/LOC，现有文案没有if段。另核非动作项 `ngx_devel_kit--ndk_http_module--upstream_list`：固定 `src/ndk_upstream_list.h:6–13` 仅MAIN/SRV，既有共享main表说明未泛化到location/if，无需修改。此检查不重新扩大其他既有语义的签署范围。

| 指令 | 固定注册锚点 | 注册允许上下文 |
| --- | --- | --- |
| `set_encode_base64` | `set-misc-nginx-module:src/ngx_http_set_misc_module.c:236–243` | http、server、location、server/ location 内的 if |
| `set_decode_base64` | `set-misc-nginx-module:src/ngx_http_set_misc_module.c:244–251` | http、server、location、server/ location 内的 if |
| `set_encode_base64url` | `set-misc-nginx-module:src/ngx_http_set_misc_module.c:252–259` | http、server、location、server/ location 内的 if |
| `set_decode_base64url` | `set-misc-nginx-module:src/ngx_http_set_misc_module.c:260–267` | http、server、location、server/ location 内的 if |
| `set_decode_hex` | `set-misc-nginx-module:src/ngx_http_set_misc_module.c:268–275` | http、server、location、server/ location 内的 if |
| `set_encode_hex` | `set-misc-nginx-module:src/ngx_http_set_misc_module.c:276–283` | http、server、location、server/ location 内的 if |
| `set_hmac_sha1` | `set-misc-nginx-module:src/ngx_http_set_misc_module.c:285–292` | http、server、location、server/ location 内的 if |
| `set_hmac_sha256` | `set-misc-nginx-module:src/ngx_http_set_misc_module.c:293–300` | http、server、location、server/ location 内的 if |
| `set_md5` | `set-misc-nginx-module:src/ngx_http_set_misc_module.c:303–310` | http、server、location、server/ location 内的 if |
| `set_sha1` | `set-misc-nginx-module:src/ngx_http_set_misc_module.c:312–320` | http、server、location、server/ location 内的 if |
| `set_unescape_uri` | `set-misc-nginx-module:src/ngx_http_set_misc_module.c:323–331` | http、server、location、server/ location 内的 if |
| `set_escape_uri` | `set-misc-nginx-module:src/ngx_http_set_misc_module.c:332–340` | http、server、location、server/ location 内的 if |
| `set_quote_sql_str` | `set-misc-nginx-module:src/ngx_http_set_misc_module.c:341–349` | http、server、location、server/ location 内的 if |
| `set_quote_pgsql_str` | `set-misc-nginx-module:src/ngx_http_set_misc_module.c:350–358` | http、server、location、server/ location 内的 if |
| `set_quote_json_str` | `set-misc-nginx-module:src/ngx_http_set_misc_module.c:359–367` | http、server、location、server/ location 内的 if |
| `set_if_empty` | `set-misc-nginx-module:src/ngx_http_set_misc_module.c:368–376` | http、server、location、server/ location 内的 if |
| `set_hashed_upstream` | `set-misc-nginx-module:src/ngx_http_set_misc_module.c:377–385` | http、server、location、server/ location 内的 if |
| `set_encode_base32` | `set-misc-nginx-module:src/ngx_http_set_misc_module.c:414–422` | http、server、location、server/ location 内的 if |
| `set_decode_base32` | `set-misc-nginx-module:src/ngx_http_set_misc_module.c:423–431` | http、server、location、server/ location 内的 if |
| `set_local_today` | `set-misc-nginx-module:src/ngx_http_set_misc_module.c:432–440` | http、server、location、server/ location 内的 if |
| `set_formatted_gmt_time` | `set-misc-nginx-module:src/ngx_http_set_misc_module.c:441–449` | http、server、location、server/ location 内的 if |
| `set_formatted_local_time` | `set-misc-nginx-module:src/ngx_http_set_misc_module.c:450–458` | http、server、location、server/ location 内的 if |
| `set_random` | `set-misc-nginx-module:src/ngx_http_set_misc_module.c:459–466` | http、server、location、server/ location 内的 if |
| `set_secure_random_alphanum` | `set-misc-nginx-module:src/ngx_http_set_misc_module.c:467–474` | http、server、location、server/ location 内的 if |
| `set_secure_random_lcalpha` | `set-misc-nginx-module:src/ngx_http_set_misc_module.c:475–482` | http、server、location、server/ location 内的 if |
| `set_rotate` | `set-misc-nginx-module:src/ngx_http_set_misc_module.c:483–490` | http、server、location、server/ location 内的 if |
| `array_split` | `array-var-nginx-module:src/ngx_http_array_var_module.c:56–64` | http、server、location、server/ location 内的 if |
| `array_map` | `array-var-nginx-module:src/ngx_http_array_var_module.c:65–74` | http、server、location、server/ location 内的 if |
| `array_map_op` | `array-var-nginx-module:src/ngx_http_array_var_module.c:75–84` | http、server、location、server/ location 内的 if |
| `array_join` | `array-var-nginx-module:src/ngx_http_array_var_module.c:85–94` | http、server、location、server/ location 内的 if |
| `set_form_input` | `form-input-nginx-module:src/ngx_http_form_input_module.c:43–48` | http、server、location；不含 if |
| `set_form_input_multi` | `form-input-nginx-module:src/ngx_http_form_input_module.c:50–55` | http、server、location；不含 if |
| `set_iconv` | `iconv-nginx-module:src/ngx_http_iconv_module.c:60–66` | 仅 location |
| `set_encrypt_session` | `encrypted-session-nginx-module:src/ngx_http_encrypted_session_module.c:100–108` | http、server、location、server/ location 内的 if |
| `set_decrypt_session` | `encrypted-session-nginx-module:src/ngx_http_encrypted_session_module.c:109–117` | http、server、location、server/ location 内的 if |

## 本批交付状态

已落盘 92 / 92 身份、128 / 128 字段。完成表示证据与建议已交付，不等于主审核已通过。未解决问题与受保护字段冲突见对应ID的机制核对。
