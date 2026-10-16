# OpenResty 1.27.1.1 内容范围判据与本地来源说明

日期：2026-10-10。本轮完整读取 REQUIREMENTS.md、IMPLEMENTATION_PLAN.md、CONTENT_PLAN.md、components.json、inventory.mjs、build.mjs；读取锁定源码的构建选择及发行版片段，不联网、不下载、不编译、不执行盘点/构建。采用 research 技能的一手来源和落盘方式；当前无后台子Agent工具，规划方直接完成只读核对。缺失组件的固定tree/源码读取由主线程按已授权路径执行。

## 1. 已核对事实与证据层次

OpenResty `v1.27.1.1` 解析到 `8c37412c31621225e7aa7e825b5b50106c9c71c4`。`util/ver` 的 main_ver=1.27.1、minor_ver=1；现 components.json 有43下载项。本地7个组件已标 C 扫描，其中5个有注册、2个零命中；这个统计只说明当前扫描结果，不是组件类型或全发行版完成证据。

| 一手来源 | 支持的结论与边界 |
|---|---|
| [固定 util/ver](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/ver#L3-L5) | 发行版版本分量；版本声明不能证明任意工作树内容与发行版一致 |
| [mirror-tarballs 的 Nginx 下载](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/mirror-tarballs#L30-L36)、[第三方与库清单](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/mirror-tarballs#L565-L943) | 下载版本、归档重命名及后处理；注释下载行不算有效项，源码仓库名与bundle目录名不同 |
| [configure 模块列表](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/configure#L70-L94)、[选择循环](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/configure#L1217-L1229) | iconv、drizzle、postgres列为disabled，需显式选择；其他列表项可被no选项关闭；此为构建逻辑，不能声称当前实际编译成功 |
| [NDK依赖与stream/LuaJIT选择](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/configure#L536-L578) | NDK关闭联动禁用依赖项；stream和LuaJIT有条件选择；不能由库可用推出指令环境可用 |
| [Lua库及工具安装](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/configure#L1130-L1166)、[add_lua_lib](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/configure#L1235-L1253) | Lua库安装到Lua路径与工具安装不等于注册Nginx配置指令；仍需固定组件树/入口排除混合情况 |
| [Nginx auto/modules](https://github.com/nginx/nginx/blob/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928/auto/modules#L59-L101) | 单个Nginx下载项内有多个模块和条件构建；其完整条件还须对照auto/options及OpenResty有效补丁 |
| [redis模块补丁](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/mirror-tarballs#L692-L710)、[LuaJIT补丁](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/mirror-tarballs#L754-L762) | 补丁不限Nginx；必须逐组件对照实际应用逻辑，不能给所有非Nginx组件统一unaffected |

以上链接均由本地固定tag原文生成，未做远程访问验收。scripts/inventory.mjs、scripts/build.mjs 和 components.json 是本轮当前代码/产物证据，不冒充上游固定revision。官方仓库当前文档不能代替锁定版本。

## 2. 分类判据：先角色、后配置范围

分类要同时保留“发行版获取”“构建用途”“配置注册结论”，不能用一个role字段代替三者。

| 类别 | 正向判据 | 不能采用的捷径 |
|---|---|---|
| 配置指令提供者 | 固定模块config/build关联真实ngx_module_t，commands指向可追踪注册表/宏/生成注册；逐项名称/context/callback可定位 | 仓库名含nginx-module；仅README罗列；仅regex命中 |
| Nginx扩展/开发依赖（注册未决） | configure及模块config显示加入Nginx；检查commands是否空，是否供其他模块宏/头文件注册或仅注入API | “NDK没C命中”或“lua-upstream名称像模块所以一定有指令” |
| Lua库/本机扩展 | 固定树与Makefile显示Lua/FFI API或Lua动态库加载；所有构建入口无Nginxcommands路径，生成/包含文件检查闭合 | “只有Lua”或“没有.c”就直接写无指令 |
| 运行时 | 固定构建/入口显示执行LuaJIT等运行时职责，Nginx通过依赖集成而非其自有commands | 运行时C文件很多就计作Nginx模块 |
| 工具 | 固定安装入口与可执行文件用途、依赖链明确；排除附带模块注册 | 工具会生成配置就把生成文本算成工具自有指令 |

“无配置指令”须有完整固定tree、所有构建入口、模块commands/库入口、宏及生成路径的闭合证据，并明确只针对该版本该组件自己的注册；正向证明是库/工具/运行时且无注册路径。未满足则待核实，`no_c_registrations_found`只保留为扫描观察。NDK可贡献其他模块使用的注册宏，不能在使用方扫描闭合前划掉其影响。

## 3. 43项映射与待核实边界

下表版本逐项来自当前components.json并对照固定下载清单；构建用途由固定configure分类，不是部署报告。D表示configure模块列表常规选择，可被选项/依赖关闭；O表示默认disabled的可选项；L为Lua库安装或本机扩展构建路径；T为工具；R为运行时。D/O均不保证独立配置指令，L/T/R也须检查生成/混合路径后才能确认无指令。

| # | 下载项 / 版本 | 构建用途 | 当前配置范围证据 |
|---|---|---|---|
| 1 | nginx 1.27.1 | 核心，多模块且有可选/平台分支 | 已提取724注册；全树条件/补丁新增删除仍需闭合 |
| 2 | echo-nginx-module 0.63 | D | C扫描19，仍需来源与扫描完整性核对 |
| 3 | xss-nginx-module 0.06 | D | 待固定tree/注册入口 |
| 4 | ngx_devel_kit 0.3.3 | D，开发依赖 | 待config、headers、宏及生成路径，不能零命中划掉 |
| 5 | set-misc-nginx-module 0.33 | D，NDK依赖 | 待固定tree与宏展开 |
| 6 | rds-json-nginx-module 0.17 | D | 待固定tree/注册入口 |
| 7 | rds-csv-nginx-module 0.09 | D | 待固定tree/注册入口 |
| 8 | headers-more-nginx-module 0.37 | D | C扫描4，仍需完整性核对 |
| 9 | drizzle-nginx-module 0.1.12 | O | 待固定tree/注册及库依赖 |
| 10 | lua-nginx-module 0.10.27 | D，bundle名ngx_lua | C扫描79，保留条件/废弃项 |
| 11 | lua-upstream-nginx-module 0.07 | D，bundle名ngx_lua_upstream | 待commands/API注入路径，未断言有/无指令 |
| 12 | stream-lua-nginx-module 0.0.15 | D，bundle名ngx_stream_lua | C扫描50，保留条件项 |
| 13 | array-var-nginx-module 0.06 | D，NDK依赖 | 待固定tree/宏 |
| 14 | memc-nginx-module 0.20 | D | 待固定tree/注册入口 |
| 15 | srcache-nginx-module 0.33 | D | 待固定tree/注册入口 |
| 16 | form-input-nginx-module 0.12 | D，NDK依赖 | 待固定tree/宏 |
| 17 | iconv-nginx-module 0.14 | O，NDK依赖 | 待固定tree/宏及库依赖 |
| 18 | encrypted-session-nginx-module 0.09 | D，NDK依赖 | 待固定tree/宏及依赖 |
| 19 | redis-nginx-module 0.3.9 | D，非GitHub下载 | 待固定原包归属；发行版有有效补丁，不能直接引用未补丁行为 |
| 20 | ngx_postgres 1.0 | O | 待固定tree/注册及库依赖 |
| 21 | ngx_coolkit 0.2 | D | 待固定tree/注册入口 |
| 22 | redis2-nginx-module 0.15 | D | 待固定tree/注册入口 |
| 23 | resty-cli 0.30 | T | 安装入口已查；完整组件tree未核定 |
| 24 | opm 0.0.8 | T | 安装入口已查；完整组件tree未核定 |
| 25 | luajit2 2.1-20240815 | R | C零命中只作观察；补丁与运行时入口待闭合 |
| 26 | lua-cjson 2.1.0.14 | L，本机扩展 | 待固定tree/构建及库加载入口 |
| 27 | lua-redis-parser 0.13 | L，本机扩展 | 待固定tree/构建及库加载入口 |
| 28 | lua-rds-parser 0.06 | L，本机扩展 | 待固定tree/构建及后处理 |
| 29 | lua-resty-dns 0.23 | L | 待固定tree/安装入口闭合 |
| 30 | lua-resty-memcached 0.17 | L | 待固定tree/安装入口闭合 |
| 31 | lua-resty-redis 0.31 | L | 待固定tree/安装入口闭合 |
| 32 | lua-resty-mysql 0.27 | L | 待固定tree/安装入口闭合 |
| 33 | lua-resty-limit-traffic 0.09 | L | 待固定tree/安装入口闭合 |
| 34 | lua-resty-upload 0.11 | L | 待固定tree/安装入口闭合 |
| 35 | lua-resty-string 0.16 | L | 待固定tree/安装入口闭合 |
| 36 | lua-resty-websocket 0.12 | L | 待固定tree/安装入口闭合 |
| 37 | lua-resty-lock 0.09 | L | 待固定tree/安装入口闭合 |
| 38 | lua-resty-lrucache 0.15 | L | 待固定tree/安装入口闭合 |
| 39 | lua-resty-core 0.1.30 | L | C零命中；已见Lua/Makefile树片段，不能据此称全树审核完成 |
| 40 | lua-resty-upstream-healthcheck 0.08 | L | 待固定tree/安装入口闭合 |
| 41 | lua-tablepool 0.03 | L | 待固定tree/安装入口闭合 |
| 42 | lua-resty-signal 0.04 | L，本机扩展 | 平台/构建条件及完整tree待闭合 |
| 43 | lua-resty-shell 0.03 | L | 依赖/安装条件及完整tree待闭合 |

22个核心/扩展/开发依赖候选 + 21个库/运行时/工具用途项 = 43下载项，这不是22个已核定指令模块。Nginx1.27.1是一个源码组件而非一个配置模块；禁用的可选项仍随包，应纳入首版知识范围并标注条件。未提供生产二进制和构建参数，所有“实际环境已启用”判断保持未知。

## 4. 固定读取、扫描和来源保存规则

主线程联网读取时使用既定agent-reach/gh API，不以额外调研扩大范围：tag解析到commit，再以完整SHA读tree/blob。递归tree若truncated必须补读子树，记录分页/缺文件；404、403、429、API限流与目录零命中区别处理。保存component、version、tag、commit/tree/blob标识、文件路径、读取/排除清单及缺口。tree没有源码行号，不能当详情code来源。

本地使用 `git ls-tree -r <固定SHA>` 定文件列表，`git show <固定SHA>:<file>` 读原文；不从工作树glob生成固定来源声明。来源行号按固定原文计算，后续build只统一换行。必要扫描顺序：模块config → ngx_module_t.commands →注册表/宏/生成器→callback/context/flags；向外追踪头文件/include和NDK宏定义，读取生成模板而不执行它。测试注册、文档示例、兼容条件和正式模块注册需分别记录；排除文件必须说明不在构建输入链内。

提取不支持的名称宏、数组大小/存储修饰变化、复杂条件分支、跨文件commands指针、生成注册、module归属不唯一均记录具体文件/符号及待核对原因，不得用猜测模块名给出已核实身份。全发行版分母包含条件项但不重复计算同一语义身份；同名跨模块是不同身份。存在同模块同名的不同语义注册时须人工核定稳定标识，当前build的component--module--name重复拒绝不能靠删除条目解决。

范围结论、目录接入、构建可用、功能核实分别保存。固定API读到源码不等于build能git show：新组件缺本地Git或可追溯来源适配时明确标未接入，旧发布继续可用。不是本批授权去改build或伪造local_path。来源暂不可映射成既有固定GitHub SHA契约时保留缺口，不能为非GitHub包套用其他组件repository。

## 5. 当前代码风险与验收边界

| 当前风险（已读代码依据） | 影响 | 本批应保留/核对 |
|---|---|---|
| inventory 的role由名称推测；只递归.c并排除目录 | 可能漏headers/生成注册，库分类只是启发式 | role不能作终态；零命中保持观察，逐项构建路径闭合 |
| inventory读取工作树内容但记录HEAD revision | 未提交修改可造成注册行号/内容与固定来源不一致 | 固定tree/blob扫描；保留用户改动，不清理工作树 |
| extractCommands仅识别特定数组/ngx_string形式，归属不唯一时猜名称 | 可能漏宏/特殊数组或错误指令身份 | module_verified=false和异常表达式保留；不能自动计完成 |
| scope_complete仅检查inspection不等not_inspected | 全部扫描过仍可有未解macro/header缺口 | 范围终态按本计划C01–C04/C07证据，不能只用脚本布尔值 |
| build依赖config.sources、本地Git及.C定义搜索 | 远程已读组件未接入；header/宏callback可能定位不到 | 主线程分开标研究/接入状态，不将构建失败视作无指令 |
| build的gaps仅按not_inspected加通用缺口，inventory_complete当前硬置false | 扫描零命中或已读但未解问题可能无精细缺口；不能直接置true收口 | 主线程缺口记录包含tree、注册、归属、context、生成及补丁 |
| 非Nginx组件unaffected可由配置回退；redis和LuaJIT实际有补丁 | 扩展config到新组件时可能误升级知识 | 按实际分支逐组件/逐事实核对；已有审核不扩大为新组件 |
| refs构建统一reference_verified，来源结构有效不证明语义 | 大批机械生成API/变量可冒充已核实参考 | 本批不扩展参考生成；少量人工来源核对与指令计数分开 |

本轮不运行构建、不改代码/知识/盘点产物；风险是后续实施需核对的条件，不推断所有既有发布已经有这些错误。五项基础知识在固定来源和有效补丁核实后可以单批验收；自动计数仅代表构建状态，不替代语义审核。全量范围、全量功能、部门深度、网站手机实测、内网部署、Codex宿主仍分别保留完成情况。

验收矩阵以 CONTENT_PLAN.md 的 C01–C08 为准：每个通过结论需附固定来源、读取集合/排除理由、缺口状态和实际产物版本。限流再发生由主线程接手；主线程未获得的tree/源码继续标待核实，本文件不把联网研究写成已完成。
