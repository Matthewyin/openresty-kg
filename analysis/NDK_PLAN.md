# NDK 四组件目录接入计划

日期：2026-10-10。状态：ready，供主线程冻结；本文件完成后规划停写。承接 CONTENT_PLAN 最终通过状态：发布 dee833a2c9381a27，913 注册、23 basic、0 deep、8 参考、20 下载项待核实。本批目标仅为准确接入四组件正式注册目录；不补知识正文、不以目录接入宣称全发行版或基础内容完成。

## 深度交互：结论与最小路径

已读 research 技能、CONTENT_PLAN、REQUIREMENTS、inventory.mjs、build.mjs 和 project.config.json。本规划就是主线程已委派的研究工作，不另开嵌套线程。研究只读固定 Git 对象，以正式 config、模块结构的 commands 字段及 include 链核定范围。

三个使用方的 commands 都是字面量初始化，不需要通用 NDK 宏展开。当前真正缺口是：`ngx_string ("...")` 的空白兼容、正式构建文件选择、NDK 跨文件 commands 归属和 include 条件保留。已只读调用现有 extractCommands，在 set-misc 首条 `set_encode_base64` 实际得到“未支持的命令名称表达式 ngx_string (\"set_encode_base64\")”；修复限定为允许函数标识与左括号间空白。

NDK 并非无自身指令：`upstream_list` 属于 `ndk_http_module`。NDK 单独使用时它受 `NDK_UPSTREAM_LIST` 条件控制；OpenResty 默认组合包含 set-misc，后者 config 设置 `-DNDK_UPSTREAM_LIST`，因而在该默认构建组合中激活这一路径。实际部署选项未知，目录必须保留 guard，不能声称用户环境已经启用。

## 固定来源与正式输入

所有本地读取使用 `git show <完整SHA>:<path>`、`git ls-tree`；不读取工作树作为版本证据。四目录已到场且本规划读取时 status clean。版本归属按固定 OpenResty 下载脚本核对，不采用 NDK src/ndk.h 内残留的旧版本字符串。

| 组件 / 版本 | 完整 SHA | 正式注册路径与持有者 |
|---|---|---|
| ngx_devel_kit / 0.3.3 | 91e30eb05085e7f9762f130cbb883a0e753cf74d | config → src/ndk.c → objs/ndk_config.c 的 ndk_http_commands → src/ndk_upstream_list.h；持有者 ndk_http_module |
| set-misc-nginx-module / 0.33 | 31c4ad67bb9e392a734e4e58ea8048e24012311f | config 的 SET_MISC_SRCS / SET_MISC_DEPS；src/ngx_http_set_misc_module.c 的 ngx_http_set_misc_commands，由 ngx_http_set_misc_module 持有 |
| array-var-nginx-module / 0.06 | 32188f86599b47f7cd34340e5a2985bd9d550bf8 | config 的 module.c、util.c 及对应依赖；src/ngx_http_array_var_module.c 的 ngx_http_array_var_commands，由 ngx_http_array_var_module 持有 |
| form-input-nginx-module / 0.12 | 43ee690c359c06af7d178379cfc37ebc858d9de2 | config 的 src/ngx_http_form_input_module.c 和 ddebug.h；ngx_http_form_input_commands，由 ngx_http_form_input_module 持有 |

一手来源：

- [OpenResty 默认模块列表](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/configure#L70-L95)、[no_ndk 联动禁用](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/configure#L536-L546)、[固定下载脚本](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/mirror-tarballs)：四项下载行由主线程核定为 580/587/643/664。
- [NDK config](https://github.com/simplresty/ngx_devel_kit/blob/91e30eb05085e7f9762f130cbb883a0e753cf74d/config) 注册 src/ndk.c，include 路径包含 src、仓库 objs 和构建输出 addon/ndk；[src/ndk.c](https://github.com/simplresty/ngx_devel_kit/blob/91e30eb05085e7f9762f130cbb883a0e753cf74d/src/ndk.c) 包含 ndk_config.c，并把 ndk_http_commands 赋给正式 module。
- [NDK commands 容器](https://github.com/simplresty/ngx_devel_kit/blob/91e30eb05085e7f9762f130cbb883a0e753cf74d/objs/ndk_config.c#L63-L72) 在 NDK_UPSTREAM_LIST 下临时定义 NDK_UPSTREAM_LIST_CMDS 后包含 header；[指令片段](https://github.com/simplresty/ngx_devel_kit/blob/91e30eb05085e7f9762f130cbb883a0e753cf74d/src/ndk_upstream_list.h#L2-L15) 给出名字、http/server context、NGX_CONF_2MORE 及 ndk_upstream_list 回调。
- [set-misc config](https://github.com/openresty/set-misc-nginx-module/blob/31c4ad67bb9e392a734e4e58ea8048e24012311f/config) 检查 NDK 依赖、列出正式文件，按 USE_OPENSSL/MAIL_SSL 加入 HMAC 源，62 行设置 NDK_SET_VAR 和 NDK_UPSTREAM_LIST；[正式 commands 与 owner](https://github.com/openresty/set-misc-nginx-module/blob/31c4ad67bb9e392a734e4e58ea8048e24012311f/src/ngx_http_set_misc_module.c#L235-L515) 保留 NGX_OPENSSL、NGX_HTTP_SET_HASH、NGX_HAVE_SHA1 分支。
- [array-var config](https://github.com/openresty/array-var-nginx-module/blob/32188f86599b47f7cd34340e5a2985bd9d550bf8/config) 和 [module](https://github.com/openresty/array-var-nginx-module/blob/32188f86599b47f7cd34340e5a2985bd9d550bf8/src/ngx_http_array_var_module.c)；[form-input config](https://github.com/calio/form-input-nginx-module/blob/43ee690c359c06af7d178379cfc37ebc858d9de2/config) 和 [module](https://github.com/calio/form-input-nginx-module/blob/43ee690c359c06af7d178379cfc37ebc858d9de2/src/ngx_http_form_input_module.c)。二者要求 NDK 先接入，均设置 NDK_SET_VAR；分别四条、两条字面量注册。

## NDK 生成与纳入边界

[src/ndk.h](https://github.com/simplresty/ngx_devel_kit/blob/91e30eb05085e7f9762f130cbb883a0e753cf74d/src/ndk.h) → [objs/ndk_config.h](https://github.com/simplresty/ngx_devel_kit/blob/91e30eb05085e7f9762f130cbb883a0e753cf74d/objs/ndk_config.h) / [objs/ndk_includes.h](https://github.com/simplresty/ngx_devel_kit/blob/91e30eb05085e7f9762f130cbb883a0e753cf74d/objs/ndk_includes.h) 闭合到可选 src headers/C 和 objs 内的生成宏 headers。NDK_SET_VAR 关联 NDK_REWRITE；NDK_UPSTREAM_LIST 关联 NDK_HTTP_CREATE_MAIN_CONF。NDK_ALL 可设置尚未显式定义的可选宏，但不能当作默认已定义，也不能覆盖显式的零值。

[auto/build](https://github.com/simplresty/ngx_devel_kit/blob/91e30eb05085e7f9762f130cbb883a0e753cf74d/auto/build) 的 generate_commands 读取 [auto/data/modules_optional](https://github.com/simplresty/ngx_devel_kit/blob/91e30eb05085e7f9762f130cbb883a0e753cf74d/auto/data/modules_optional)，仅 upstream_list 带星号，生成上述条件 include。其他生成输入包括 auto/data 的 headers/header_files、module_dependencies、conf_args/conf_locs/conf_macros、prefixes/action_types/action_replacements，及 auto/src、auto/actions、auto/text。它们是解释已提交生成文件的证据，不作为独立指令扫描入口；本批不执行或复刻生成器，不声称重生成结果已验证。config 中存在 ndk_generate_files 函数定义不等于实际执行过它。

纳入条件：注册必须位于 config 正式源文件或其可追溯 include 路径，且能连接到正式 ngx_module_t 的 commands 字段。保留源码条件及原始文件行号；条件不满足当前机器不构成排除理由。NDK header 中另一分支的 typedef/声明不计指令。仓库 objs 是实际 include 输入，不能因目录名而排除。

排除条件：examples/http/set_var 有自己 config 和示例 module，但四组件正式 config 没有接入它，因此不进入本批目录；测试、文档示例、未接入的宏定义也不计注册。NDK 的宏模板本身不含一个已实例化的正式注册就不计数。辅助 C、headers 应核对其构建或 include 角色，但不要求为每个无注册文件建立独立账本。未解宏调用、include/owner 歧义、缺失生成产物或条件来源无法闭合时显式 pending，不以全树扫描或零命中结束范围核定。

## 直接执行：N01–N05

| 批次 | 责任与最小工作 | 可检查完成条件 |
|---|---|---|
| N01 固定输入 | 主核四 tag/SHA、下载行和 config；Sol 提出最小 input shape，主据此配置正式入口与 NDK include 关系 | 四版本与固定树相符；正式源与示例分开；没有运行生成器；来源不足项仍 pending |
| N02 字面量目录 | Sol 在 inventory 的现有提取器中允许 ngx_string 与括号间空白；三使用方限定正式 config 文件集合，沿用现有字面量解析和条件记录 | 三个正式 owner 均核实；array 四项、form 两项；set-misc 名称集合对照完整 commands，不将 filter 结构/示例计数；条件项保留 |
| N03 NDK include | Sol 只支持本批已知 commands 跨文件片段关系；主提供来源配置。验证 src/ndk.c 的 owner → objs/ndk_config.c 的数组 → header 指令片段及局部宏条件 | upstream_list 唯一归 ndk_http_module；registration 源为真实 header 行；可追溯 owner 和中间 include；NDK_UPSTREAM_LIST 可见，NDK_UPSTREAM_LIST_CMDS 标明为容器临时定义；缺链拒绝核实或保持 pending |
| N04 接入验证 | 主接 config、来源及 build 必要证据；Sol 运行与变更相称的提取/边界检查，主运行既有构建门禁、HTTP 与桌面验收 | 新项均 registration_only；23 basic/0 deep/8参考不提升；固定 URL/SHA/片段行号准确；examples 不出现；旧发布可读；未解生成/条件路径缺口仍在产物或既有范围说明可见 |
| N05 独立审核 | Astra 逐 N01–N04 对照固定源、目录与实际发布；具体错误退回 Sol 或主，责任方修复后复核 | 审核确认正式输入、owner、条件、排除和发布一致才通过；范围已核定/目录接入/构建通过/基础知识分开结论；其余组件不自动完成 |

最小 input shape 建议：在现有 source 配置旁按需增加“正式扫描文件集合”和 NDK 一条明确关系（owner 文件/符号、commands 文件/符号、片段文件），来源行由读取固定内容定位或经校验的范围提供。名称可由 Sol 与主按现有代码选择，不要求新独立 ledger 或通用依赖图。显式关系必须用实际源码校验，不可单凭配置把 module_verified 置真；输出的 guards 应来自实际容器和片段，不能只手填一个标签。维持原始文件坐标，不把拼接文本行号冒充 GitHub 行号。

必要验证集中在此次风险：带空白字面量成功；示例排除；跨文件 owner 和片段条件保留；故意断开 include 或 owner 后不能仍标 verified；条件注册不被当前机器裁掉；固定源码引用落点准确。可用现有测试与隔离夹具，不新增测试框架。临时目录仅 mkdtemp 创建并 finally 清理。

build 目前回调查找只搜索所属组件与 nginx，本批注册级目录并不要求跨组件回调正文解析；不要为 NDK 回调扩展通用符号解析器，也不改变 basic 判定。若需携带 owner/include 证据，仅补本批必要的固定源码来源。最终计数由实际目录计算，不预设总数作为放行手段；关闭四项 pending 必须逐项有闭合证据，不能只因 source 被扫描就自动计为完成。

## 执行边界

规划唯一永久写入为本文件；Sol 实施、主负责 config/来源及后续构建和桌面 HTTP/浏览器，Astra 审核，沿用已确认模型与各自授权文件范围。不新增 UI/新功能、backend/DB/RAG、手机验收或 Codex 真实接入；不编译或运行 OpenResty、不执行 mirror-tarballs 或 NDK 生成器、不修改用户源仓库、不提交或 push。本批不要求完整 C 解释器、全生成物重建或额外 hash ledger。

## 主线程执行收口

2026-10-10，N01–N05 全部完成并经独立审核通过；上方 ready 为规划阶段历史状态。正式发布 `1.27.1.1-7e53dde6171ab67c`，新增36项，当前949注册、23 basic、0 deep、8独立参考；剩余16个下载项待核定，inventory_complete=false。

64项自动测试、隔离构建门禁、真实 HTTP 及用户授权 TaskSpace7 桌面验收通过。主执行记录见 NDK_VERIFICATION.md，独立逐项审核及证据边界见 NDK_REVIEW.md。既有913详情除 release_id 外与8参考内容保持；未增知识正文，不将本批目录接入认定为全量功能说明完成。原源码仓库除用户既有 openresty/tags 外均 clean；临时夹具清理，新增四源码目录保留供内容生产。
