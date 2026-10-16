# 本批范围接入证据

2026-10-10。主线程通过 agent-reach 的 gh CLI 读取固定 tag→commit→完整树及 README/Makefile；13 个库的安装文件 blob SHA 与冻结树一致。全部结果保存在 knowledge/component-scope.json，并由实际 inventory 写入 components.scope_evidence。读取源码，不执行安装或测试脚本。

## Lua 参考库

下列组件的完整树无原生 Nginx 模块、注册模板或模块 config；安装入口仅安装 Lua 文件（测试目标引用 Nginx 不算自己的注册）。README 正向说明 Lua 库用途。故仅归为 Lua 参考库，不进入配置指令分母，也不宣称这些 API 内容已全量完成。

| 组件 | 版本 | 固定 README | 固定安装入口 |
| --- | --- | --- | --- |
| lua-resty-dns | 0.23 | [来源](https://github.com/openresty/lua-resty-dns/blob/273db4f348d4676f554c5319a902e7b836153192/README.markdown#L1-L65) | [来源](https://github.com/openresty/lua-resty-dns/blob/273db4f348d4676f554c5319a902e7b836153192/Makefile#L1-L19) |
| lua-resty-limit-traffic | 0.09 | [来源](https://github.com/openresty/lua-resty-limit-traffic/blob/e80969b79afcc94856b095fe6163ace21387c6b6/README.md#L1-L65) | [来源](https://github.com/openresty/lua-resty-limit-traffic/blob/e80969b79afcc94856b095fe6163ace21387c6b6/Makefile#L1-L20) |
| lua-resty-lock | 0.09 | [来源](https://github.com/openresty/lua-resty-lock/blob/9dc550e56b6f3b1a2f1a31bb270a91813b5b6861/README.markdown#L1-L65) | [来源](https://github.com/openresty/lua-resty-lock/blob/9dc550e56b6f3b1a2f1a31bb270a91813b5b6861/Makefile#L1-L19) |
| lua-resty-lrucache | 0.15 | [来源](https://github.com/openresty/lua-resty-lrucache/blob/3ff6300e68b73ba20e909c7d16bd839aef2e5a4b/README.markdown#L1-L65) | [来源](https://github.com/openresty/lua-resty-lrucache/blob/3ff6300e68b73ba20e909c7d16bd839aef2e5a4b/Makefile#L1-L31) |
| lua-resty-memcached | 0.17 | [来源](https://github.com/openresty/lua-resty-memcached/blob/122cba2b1cd36cddd941444bcdda7ba37aaad021/README.markdown#L1-L65) | [来源](https://github.com/openresty/lua-resty-memcached/blob/122cba2b1cd36cddd941444bcdda7ba37aaad021/Makefile#L1-L19) |
| lua-resty-mysql | 0.27 | [来源](https://github.com/openresty/lua-resty-mysql/blob/64effe8ff8dd968b7621d8468d06994513576076/README.markdown#L1-L65) | [来源](https://github.com/openresty/lua-resty-mysql/blob/64effe8ff8dd968b7621d8468d06994513576076/Makefile#L1-L19) |
| lua-resty-redis | 0.31 | [来源](https://github.com/openresty/lua-resty-redis/blob/193fbd42e9b7953f5157550eb5253c04c081b143/README.markdown#L1-L65) | [来源](https://github.com/openresty/lua-resty-redis/blob/193fbd42e9b7953f5157550eb5253c04c081b143/Makefile#L1-L19) |
| lua-resty-shell | 0.03 | [来源](https://github.com/openresty/lua-resty-shell/blob/ea23b3d6d4a4b3c475a3e0b530469343694e775c/README.md#L1-L65) | [来源](https://github.com/openresty/lua-resty-shell/blob/ea23b3d6d4a4b3c475a3e0b530469343694e775c/Makefile#L1-L18) |
| lua-resty-string | 0.16 | [来源](https://github.com/openresty/lua-resty-string/blob/7be2e1d907744f965af115819cca9e6580f2e760/README.markdown#L1-L65) | [来源](https://github.com/openresty/lua-resty-string/blob/7be2e1d907744f965af115819cca9e6580f2e760/Makefile#L1-L19) |
| lua-resty-upload | 0.11 | [来源](https://github.com/openresty/lua-resty-upload/blob/03704aee42f7135e7782688d8a9af63a16015edc/README.markdown#L1-L65) | [来源](https://github.com/openresty/lua-resty-upload/blob/03704aee42f7135e7782688d8a9af63a16015edc/Makefile#L1-L19) |
| lua-resty-upstream-healthcheck | 0.08 | [来源](https://github.com/openresty/lua-resty-upstream-healthcheck/blob/6ade2a860a0bc23c471c7c70751682263451eef5/README.markdown#L1-L65) | [来源](https://github.com/openresty/lua-resty-upstream-healthcheck/blob/6ade2a860a0bc23c471c7c70751682263451eef5/Makefile#L1-L21) |
| lua-resty-websocket | 0.12 | [来源](https://github.com/openresty/lua-resty-websocket/blob/0c5ddc7d1a237336d3646c525b2e58b06b2952c4/README.markdown#L1-L65) | [来源](https://github.com/openresty/lua-resty-websocket/blob/0c5ddc7d1a237336d3646c525b2e58b06b2952c4/Makefile#L1-L19) |
| lua-tablepool | 0.03 | [来源](https://github.com/openresty/lua-tablepool/blob/94d3a5f43df6526fbaeb0f06873862f964766683/README.md#L1-L65) | [来源](https://github.com/openresty/lua-tablepool/blob/94d3a5f43df6526fbaeb0f06873862f964766683/Makefile#L1-L20) |

lua-resty-signal 的固定树含 resty_signal.c，Makefile 构建 librestysignal.so；本批不使用“名字像 Lua 库”或 C 注册零命中关闭其整体范围，继续保留未核实。固定 C 文件已读取，是信号常量映射函数；整体依赖/安装/发行版后处理仍待闭合。

## 新注册目录

按需获取三个组件的锁定 Git tag；未运行全 bundle 下载脚本，原源码及用户 tags 未改。

| 组件 | 固定 revision | 目录新增注册 | 模块构建入口 |
| --- | --- | --- | --- |
| xss-nginx-module 0.06 | 6c41076ac066c30c96d70e86da5400ffd49a6186 | 6 | [config](https://github.com/openresty/xss-nginx-module/blob/6c41076ac066c30c96d70e86da5400ffd49a6186/config) |
| memc-nginx-module 0.20 | b889a6fc3e18b784b454e1bc74e5d0b3513a07ce | 11 | [config](https://github.com/openresty/memc-nginx-module/blob/b889a6fc3e18b784b454e1bc74e5d0b3513a07ce/config) |
| srcache-nginx-module 0.33 | be22ac0dcd9245aadcaca3220da96a0c1a0285a7 | 20 | [config](https://github.com/openresty/srcache-nginx-module/blob/be22ac0dcd9245aadcaca3220da96a0c1a0285a7/config) |

固定树 .c/.h 等源码提取共新增 37 项，全部 registration_only；与模块持有的命令数组及上述 config 来源对应。新目录共 913 个注册项，不作为最终全发行版总数。43 项中 10 个本地源码已扫描、13 个远程 Lua 库角色已核对、20 项仍未核实。两类“已检查”粒度不同：本地扫描仍需生成路径/补丁/构建选择等完整性闭合，不能将 23/43 称为最终范围完成比例。

## 已处理的提取与发布风险

固定树枚举及 git show 替代 inventory 和 build 配置回调的工作树枚举/读取；扫描包含头文件，显式命令数组长度不静默漏项。测试在自己的临时 checkout 中改写工作树、增加未跟踪头文件，验证产物仍来自固定树；未触碰用户仓库。未知名称表达式仍拒绝，宏/生成注册未闭合的组件仍保留缺口。

范围缺口也进入发布内容哈希，避免只更新覆盖缺口却复用旧 release 身份；旧 immutable release 不改。inventory_complete 继续 false。
