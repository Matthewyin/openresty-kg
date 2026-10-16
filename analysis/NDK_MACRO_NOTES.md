# NDK 正式注册形态与构建路径核对

日期：2026-10-10。主线程已冻结 NDK_PLAN N01–N05；本实施写集已 ready 并停写，等待主线程集成与独立审核，不构成发布验收。全部原文通过 `git show <完整 SHA>:<path>` 读取，未执行生成器或 OpenResty 构建。

## 深度交互：实际问题与最小路径

本批四组件的正式注册不需要 NDK 命令宏展开。三个使用方均为 literal `ngx_string` 加六字段花括号项；NDK 通过正式 commands 数组包含一个受条件控制的头文件片段。真正缺口是空白、尾逗号、跨文件 owner/include/guard 与正式输入范围。不能以全部 C/h 命中或宏模板数量冒充注册数量。

建议只增加可选 `source.registration_inputs`：普通模块使用 `[{"file":"src/对应_module.c"}]`，NDK 使用以下约定。主线程负责配置，实施线程不自加其他 schema 或组件范围文件。

```json
[
  {
    "file": "objs/ndk_config.c",
    "owner_file": "src/ndk.c",
    "includes": {
      "ndk_upstream_list.h": "src/ndk_upstream_list.h"
    }
  }
]
```

仅从固定树读取这些正式输入；owner 的 commands 字段必须是该数组，且 owner 文件实际包含注册源。数组内 include 必须命中显式映射，保留父数组条件及头内条件。不执行原文、不泛化 C 预处理器，未知宏、include 或名称表达式必须错误或明确待核实。字段可在冻结计划中调整，本记录不提前授权实现。

## 直接执行：冻结版本与正式注册

| 组件/tag | 固定 SHA | 正式路径与数量 |
|---|---|---|
| ngx_devel_kit / v0.3.3 | 91e30eb05085e7f9762f130cbb883a0e753cf74d | `config:38,45–55` → `src/ndk.c:8,102–107` → `objs/ndk_config.c:65–72` → `src/ndk_upstream_list.h:2,6–13`；1 条条件注册 |
| set-misc-nginx-module / v0.33 | 31c4ad67bb9e392a734e4e58ea8048e24012311f | `config:19–36,66–78` → `src/ngx_http_set_misc_module.c:235–493`；29 条，包括条件项及弃用名称；owner 在 511–515 行 |
| array-var-nginx-module / v0.06 | 32188f86599b47f7cd34340e5a2985bd9d550bf8 | `config:19–22,29–41` → `src/ngx_http_array_var_module.c:55–97`；4 条：`array_split`、`array_map`、`array_map_op`、`array_join`；owner 在 115–119 行 |
| form-input-nginx-module / v0.12 | 43ee690c359c06af7d178379cfc37ebc858d9de2 | `config:17,22–34` → `src/ngx_http_form_input_module.c:41–58`；2 条：`set_form_input`、`set_form_input_multi` |

四仓库到场后工作树检查为空。NDK 片段 flags 是 `NGX_HTTP_MAIN_CONF|NGX_HTTP_SRV_CONF|NGX_CONF_2MORE`，callback 是 `ndk_upstream_list`，post 是 `NULL`。正式 owner 是 `ndk_http_module`，不是由数组名推导出的 `ndk_http_module` 字符串巧合：其 initializer 明确引用 `ndk_http_commands`。

### 默认组合、可选模块与部署状态

`set-misc/config:62` 实际原文是 `CFLAGS="$CFLAGS -DNDK_SET_VAR -DNDK_UPSTREAM_LIST"`；array 的 `config:44`、form 的 `config:37` 只追加 `-DNDK_SET_VAR`。NDK 的 `objs/ndk_config.h:16–64` 仅在 `NDK_ALL` 被定义时启用全部可选模块；`87–96` 分别给 set_var 添加 rewrite 依赖，给 upstream_list 添加 main_conf 依赖。

主线程已核定固定 OpenResty `configure` 默认组件组合包含 set-misc，并核定 `no_ndk` 联动禁用。结合上面的 set-misc 固定 config，默认组件组合会激活 `NDK_UPSTREAM_LIST`；不能将此说成 NDK 独立启用就总有该指令，也不能说该默认组合未激活。部署实际 configure 参数、宏值和运行模块未核定。本批为静态注册证据，不证明具体部署可用。目录仍须展示 `NDK_UPSTREAM_LIST` 与 `NDK_UPSTREAM_LIST_CMDS` 条件，新增全部 `registration_only`。

### 生成器、模板与正式命令关系

`config:9–15` 定义 `ndk_generate_files`，读取的 config 中未调用它；本次不执行生成器。`auto/build:5–15` 决定输出目录（缺省 `../objs`），`531–557` 的 `generate_commands` 遍历 `auto/data/modules_optional`，仅对带星号的条目生成 commands include；该数据 `14` 行仅 `upstream_list *` 有星号。其生成结构与已提交 `objs/ndk_config.c:65–72` 相符：

```c
static ngx_command_t ndk_http_commands[] = {
#if (NDK_UPSTREAM_LIST)
#define NDK_UPSTREAM_LIST_CMDS 1
#include <ndk_upstream_list.h>
#undef NDK_UPSTREAM_LIST_CMDS
#endif
    ngx_null_command
};
```

头文件 `src/ndk_upstream_list.h:2–15` 在 `NDK_UPSTREAM_LIST_CMDS` 条件下给出 literal 注册项，其 `#else` 分支是类型/API 定义，不是注册。`src/ndk.h` 包含 `ndk_config.h` 和 `ndk_includes.h`；后者 `63–64` 包含命令宏定义头，但宏定义本身没有新增正式配置名称。

`auto/build:377–442` 从 `auto/data/conf_args`、`conf_locs` 和 `auto/src/conf_cmd_basic.h` 生成基础命令宏。`objs/ndk_conf_cmd_basic.h` 有 423 个函数式宏定义，其中 420 个为 20 种参数标志乘 21 种上下文，另外 3 个为属性 offset 宏。具体定义示例：

```c
// objs/ndk_conf_cmd_basic.h:841–844
#define NDK_HTTP_LOC_CONF_TAKE1(name,func,off1,off2,post) \
    {ngx_string (name), NGX_CONF_TAKE1|NDK_HTTP_LOC_CONF, func, off1, off2, post},
// objs/ndk_conf_cmd_basic.h:1017–1020
#define NDK_HTTP_CONF_TAKE12(name,func,off1,off2,post) \
    {ngx_string (name), NGX_CONF_TAKE12|NDK_HTTP_CONF, func, off1, off2, post},
```

`auto/build:446–487` 根据 `conf_macros` 和 `conf_locs` 生成 `objs/ndk_conf_cmd_extra.h` 的 672 个函数式宏（32 × 21）；例如 `5222–5228` 的 `NDK_HTTP_CONF_STR(name,p,post)` 转调 `NDK_HTTP_CONF_TAKE1(name, ndk_conf_set_str_slot, NGX_HTTP_LOC_CONF_OFFSET, offsetof(ndk_module_loc_conf_t,p), post)`。宏形参 `name` 不是具体注册名称；本批正式数组未调用这些宏，不为此实现展开器。

### 排除 examples 的实际证据

`examples/http/set_var/config:1–4` 单独注册 `ngx_http_set_var_examples_module`，并独立加入其 C 文件；正式 NDK `config:38,47–55` 只接入 `src/ndk.c` 和 `ndk_http_module`，无 examples 入口。示例数组的 `set_concat2`、`set_prepend_hello`（示例 C 的 `22–40` 行）必须排除。单纯添加 examples 目录过滤不是构建关系证明。

### 解析器已复现的缺口与验收边界

- 旧名称正则只接受 `ngx_string(`；固定 set-misc 和 array 的 `ngx_string ("…")` 会报错。最小改动是标识符与括号之间允许空白，保留 literal 名称要求。
- set-misc 的弃用项 `set_misc_base32_padding` 在 `394` 行 post 后带尾逗号；不能将它计为第七个字段或把空字符串作 post，须保留 `&ngx_conf_deprecated_set_misc_base32_padding`。
- 数组内无花括号的宏调用/include 当前会被逐字符跳过。此次只支持真实 include 片段关系；未知形态不得静默得到完整扫描结果。
- NDK owner 在另一个文件，头文件片段无数组声明；不能按模块名猜、不能把拼接文本行号作为原文位置。registration 文件、片段原文行范围、owner 文件/行号、父数组文件及 include 点必须可审查。
- set-misc 的 `NGX_OPENSSL`、`ifndef NGX_HTTP_SET_HASH`、`NGX_HAVE_SHA1` 条件必须保留；29 条是静态条件注册集合，不是任意二进制均同时启用 29 条。
- 测试须使用四组件完整 SHA 原文、片段和生成链，包含未知宏/表达式/include、错误 owner 关系、尾逗号与原文行号负例。隔离目录 `mkdtemp` 创建且 `finally` 清理；不写正式 catalog/dist，不改变知识正文。

## 实施交接与验收

主线程确认上述 `registration_inputs` 约定后已实施，仅永久修改 `scripts/inventory.mjs`、新建 `test/ndk.test.mjs` 及本记录；`test/inventory.test.mjs` 无需修改。没有写 project.config、build、知识正文、正式 catalog 或 dist。

字面量识别允许 `ngx_string` 与括号之间空白；字段拆分只忽略最后一个空字段以处理尾逗号，保留真实 post。正式输入模式要求唯一 ngx_module_t initializer 的第三个显式字段确为 commands 数组；跨文件还要求 owner 原文中存在唯一注册容器 include。未知宏调用、未知名称、未支持 flags 表达式、未配置/重复/未消费的 include、注册项内未知预处理操作、错 owner 或缺文件均报错，不以配置赋予 verified。

片段支持范围仅为已核 `#define MACRO 1 → #include header → #undef MACRO` 及 header 的 `#if (MACRO) / #else / #endif` 结构，不实现任意头文件展开或宏求值。注册的 `file/line/end_line` 仍为真实片段文件坐标；`module_file/module_line` 为真实 owner 坐标。`registration_evidence` 使用主线程约定的 `{id,file,start_line,end_line}`，提供 `module-owner`、`owner-include`、`registration-container` 原文。`registration_defines` 使用 `{name,value,file,line,temporary:true}`，表示容器临时定义而非用户应额外设置的开关。NDK 结果保留 `if (NDK_UPSTREAM_LIST)` 和 `if (NDK_UPSTREAM_LIST_CMDS)`。

最后一轮验收命令：

```sh
node --test test/ndk.test.mjs test/inventory.test.mjs test/knowledge.test.mjs
node --check scripts/inventory.mjs
node --check test/ndk.test.mjs
```

24 项测试全部通过，语法检查通过。新测试以四个完整 SHA 的真正原文核对名称集合、原文坐标、callback/post、flags、guards、owner、证据和临时定义；负例覆盖未知注册宏、未知名称/flags、未配置 include、错宏定义/undef、断 owner/include、未消费映射、重复/缺失/非法输入。

隔离全项目盘点得到 949 条（36 条新增全部 registration_only）；原 913 条在同一输入顺序下逐字段对照原目录保持不变（隔离配置的绝对 local_path 在比较时还原）。矩阵为 43 项、14 本地来源、27 已检查、其余 16 未检查，`scope_complete:false`。这只是隔离产物验收，不表示正式目录已更新，也不代表 N05 审核通过。

隔离 NDK clone 的 owner/header 工作树被改写、容器被删除、另添未跟踪 C 文件后，实际 inventory 仍从冻结 Git 对象读到同一正式 1 条注册，examples 未进入目录；非法配置失败时先前隔离 catalog 保持不变。所有临时目录由 `mkdtemp` 创建并已 `finally` 清理。四个原源码仓库仍 clean，OpenResty 原仓库仍仅 `?? tags`。正式构建、HTTP/桌面与发布验收交由主线程；本实施 ready 后停写。
