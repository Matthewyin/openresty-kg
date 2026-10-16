# NDK 与三个使用方的固定来源

2026-10-10，主线程记录。本批只核定固定发行版的目录范围与注册链；不补无证据的功能解释，不编译、不运行生成器，也不修改用户既有源码。

## 版本、固定树与获取

从固定 OpenResty 1.27.1.1 发行脚本逐项核对后，使用 agent-reach 的 GitHub/gh 后端按单仓库、固定 tag、depth=1 获取下列源码。没有运行 mirror-tarballs 或下载全 bundle；git ls-tree 是完整本地固定树，不使用未固定的分支工作树扫描。

| 组件 | tag / 完整 revision | 固定 tree | 文件数 |
|---|---|---|---|
| ngx_devel_kit | v0.3.3 / 91e30eb05085e7f9762f130cbb883a0e753cf74d | 0fdc2ba9444890dd9e91357dda145066b19ebfd6 | 88 |
| set-misc-nginx-module | v0.33 / 31c4ad67bb9e392a734e4e58ea8048e24012311f | 623c679ae24ed7edcf28b90d9713c4577286e1e9 | 60 |
| array-var-nginx-module | v0.06 / 32188f86599b47f7cd34340e5a2985bd9d550bf8 | 04bdb7e8f1c708475c2ae4c62392d7151ef94e7c | 12 |
| form-input-nginx-module | v0.12 / 43ee690c359c06af7d178379cfc37ebc858d9de2 | b073aff720773a42c38013d6411ba58192f822cf | 15 |

获取后四个仓库均 clean。这些目录作为后续知识生产来源保留；文件数不是指令数，获取成功不是功能核对完成。

发行归属依据：[NDK/set-misc 下载及版本](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/mirror-tarballs#L578-L589)、[array-var](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/mirror-tarballs#L642-L645)、[form-input](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/mirror-tarballs#L663-L666)。以上版本与既有43项发行矩阵一致。

## 构建关系与启用条件

固定 OpenResty [configure:70–94](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/configure#L70-L94) 将 NDK 和三个使用方列为默认选择；[536–546](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/configure#L536-L546) 在 NDK 禁用时联动禁用依赖项。这里描述发行脚本选择，不表示用户部署的二进制实际启用。

NDK [config:34–66](https://github.com/simplresty/ngx_devel_kit/blob/91e30eb05085e7f9762f130cbb883a0e753cf74d/config#L34-L66) 把 src/ndk.c 和 ndk_http_module 加入正式构建，src/objs 进入 include 路径。array-var [config](https://github.com/openresty/array-var-nginx-module/blob/32188f86599b47f7cd34340e5a2985bd9d550bf8/config)、form-input [config](https://github.com/calio/form-input-nginx-module/blob/43ee690c359c06af7d178379cfc37ebc858d9de2/config) 均检查 NDK 先行注册，再加入自己的源文件，并定义 NDK_SET_VAR；并非仅从仓库名称推断依赖。

set-misc 的 [config:1–17](https://github.com/openresty/set-misc-nginx-module/blob/31c4ad67bb9e392a734e4e58ea8048e24012311f/config#L1-L17) 检查 NDK，[62–78](https://github.com/openresty/set-misc-nginx-module/blob/31c4ad67bb9e392a734e4e58ea8048e24012311f/config#L62-L78) 定义 NDK_SET_VAR 与 NDK_UPSTREAM_LIST，并加入模块。因此 NDK 的 upstream_list 必须区分单独构建时的条件和 OpenResty 默认 set-misc 组合的宏激活；不能统一写成“默认启用”或“默认不可用”。实际编译和部署仍未知。

NDK 自身路径是 [src/ndk.c](https://github.com/simplresty/ngx_devel_kit/blob/91e30eb05085e7f9762f130cbb883a0e753cf74d/src/ndk.c) 包含 [objs/ndk_config.c](https://github.com/simplresty/ngx_devel_kit/blob/91e30eb05085e7f9762f130cbb883a0e753cf74d/objs/ndk_config.c)，后者在 NDK_UPSTREAM_LIST 条件下将 [src/ndk_upstream_list.h](https://github.com/simplresty/ngx_devel_kit/blob/91e30eb05085e7f9762f130cbb883a0e753cf74d/src/ndk_upstream_list.h) 的注册片段加入 ndk_http_commands。这不是独立数组，也不是源码全目录命中后可猜 owner 的情况。

生成关系须只读核对 [auto/build](https://github.com/simplresty/ngx_devel_kit/blob/91e30eb05085e7f9762f130cbb883a0e753cf74d/auto/build) 的 generate_commands、modules_optional 数据与已提交 objs 结果；不执行生成器。examples/http/set_var 有独立 config，不能混入正式 NDK 注册。详细注册边界由 NDK_PLAN.md 与 NDK_MACRO_NOTES.md 核定，最终以 NDK_REVIEW.md 的独立审核为准。

## 主线程实际预检

在新固定 set-misc 原文上调用旧 extractCommands，实际拒绝 `ngx_string ("set_encode_base64")`：旧正则不接受标识与括号间空白。拒绝比静默漏项正确，但该合法字面注册形态应做最小兼容；没有据此假称当前目录已覆盖新组件。另三个文件/条件片段也有这种空白形态，实施方按实际固定源码处理。

本批的新增指令全部只进入 registration_only；已有23个 basic 和8个独立参考不改变。其余未核定组件及全发行版范围状态仍保留缺口。手机不作为本批任务，Codex 真实接入后移。
