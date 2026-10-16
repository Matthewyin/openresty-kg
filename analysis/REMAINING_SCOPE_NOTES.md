# C01 剩余16来源：正式入口与实施交接

2026-10-10。状态：本实施块 ready，停止写入，交主线程集成及独立审核；不表示整个 C01 或网站完成。

## 结论与边界

16 个固定来源已经逐项核对：九个正式 Nginx 模块共66条注册；一个 Lua API 注入模块、三个原生 Lua C 扩展、一个 Lua/原生 FFI 库及两个发行命令行工具没有自身 Nginx 配置指令。后七项的依据是实际构建、安装、入口或 module.commands=NULL，不是仓库名字、零匹配或“没有 C 文件”。新增注册全部保持 `registration_only`，知识正文未改。

一手来源以 [REMAINING_SOURCE_PROVENANCE.json](REMAINING_SOURCE_PROVENANCE.json) 的完整 revision/tree/files 为准。已用固定 SHA 的 `git ls-tree -r` 逐文件比对其 manifest，并核对16仓库 HEAD；全部一致、工作树 clean。读取只用 Git 固定对象，不读可能被修改的工作树文件。OpenResty 发行入口固定为 `8c37412c31621225e7aa7e825b5b50106c9c71c4`，不执行其 configure、mirror-tarballs 或任何生成器。

本次使用 research 技能沿一手源码落盘；按用户禁止嵌套 Agent 的边界直接完成。来源获取由主线程完成，本交接没有重复下载或创建新仓库。

永久写集仅 `scripts/inventory.mjs`、`test/remaining-scope.test.mjs`、本文件。没有写正式 catalog/components/dist/current/config/build/知识文件，没有执行正式 inventory/build。测试所有写入位于 `mkdtemp` 目录并由 `finally` 清理。

## 九模块正式注册路径

表中“注册源”链接固定 SHA 原文，路径也是唯一 `registration_inputs[].file`。构建入口是该组件同 revision 的 `config`，不是从所有 C/h 命中推定正式范围。owner 必须是完整 `ngx_module_t` 初始化器第三字段实际关联的 commands 数组，不能以模块/数组名字推断。注册源的普通头文件和辅助源码不等于额外注册入口；本组没有需要新展开能力的注册宏或跨文件 commands 片段。

| 组件 / 冻结版本 | 构建入口 | 注册源、数组起点 / owner 起点 | 数量与边界 |
|---|---|---|---|
| rds-json-nginx-module 0.17 / v0.17 | config:1–30，filter 源集合及 ngx_module_srcs | [src/ngx_http_rds_json_filter_module.c](https://github.com/openresty/rds-json-nginx-module/blob/2d7e07f7c39f98bbb2a8b07f4bae4d892f00329d/src/ngx_http_rds_json_filter_module.c#L62)：62 / 170 | 10，HTTP AUX filter；辅助 handler/processor/output 不另算 owner |
| rds-csv-nginx-module 0.09 / v0.09 | config:1–4，NGX_ADDON_SRCS | [src/ngx_http_rds_csv_filter_module.c](https://github.com/openresty/rds-csv-nginx-module/blob/b4095fcb8a866835ddec7ea0c414b8a4af35741a/src/ngx_http_rds_csv_filter_module.c#L44)：44 / 118 | 6，处理器不是独立配置模块 |
| drizzle-nginx-module 0.1.12 / v0.1.12 | config:82–87，正式 module 和辅助源集合 | [src/ngx_http_drizzle_module.c](https://github.com/openresty/drizzle-nginx-module/blob/fb6cf255d91135e18145a98a93947ead4e703b68/src/ngx_http_drizzle_module.c#L53)：53 / 167 | 12；config 前段检查 libdrizzle，未运行依赖检查或访问 DB |
| iconv-nginx-module 0.14 / v0.14 | config:96–116，HTTP_ICONV_SRCS，NDK_SET_VAR | [src/ngx_http_iconv_module.c](https://github.com/calio/iconv-nginx-module/blob/67d55c7edd3ab0535afa1e55ec8b2cdeb5167a82/src/ngx_http_iconv_module.c#L58)：58 / 99 | 3；NDK/iconv 依赖不等于部署已启用 |
| encrypted-session-nginx-module 0.09 / v0.09 | config:17–44，HTTP_ENCRYPTED_SESSION_SRCS，NDK_SET_VAR | [src/ngx_http_encrypted_session_module.c](https://github.com/openresty/encrypted-session-nginx-module/blob/0f81b5728db0ece0f60c72354da69f158dc1d2a7/src/ngx_http_encrypted_session_module.c#L72)：72 / 138 | 5；辅助 cipher 源不单独注册 |
| redis-nginx-module 0.3.9 / 0.3.9 | config:1–18，HTTP_REDIS_SRCS | [ngx_http_redis_module.c](https://github.com/osokin/ngx_http_redis/blob/411fef36e130129b670fa7f2672bcad6ab2cbdd3/ngx_http_redis_module.c#L64)：64 / 143 | 8；redis_bind 保留 `if defined nginx_version && nginx_version >= 8022` |
| ngx_postgres 1.0 / 1.0 | config:206–216，NGX_ADDON_SRCS | [src/ngx_postgres_module.c](https://github.com/openresty/ngx_postgres/blob/681980598529f67fcec5c7448452046764a68429/src/ngx_postgres_module.c#L48)：48 / 161 | 10；config 前段检查 libpq，未运行构建或 DB |
| ngx_coolkit 0.2 / 0.2 | config:1–7，正式 module/handlers/variables | [src/ngx_coolkit_module.c](https://github.com/FRiCKLE/ngx_coolkit/blob/462b863babe121b900465b4ec8dfba612d723e9a/src/ngx_coolkit_module.c#L32)：32 / 71 | 1；另有变量，不加入指令数 |
| redis2-nginx-module 0.15 / v0.15 | config:1–29，REDIS2_SRCS | [src/ngx_http_redis2_module.c](https://github.com/openresty/redis2-nginx-module/blob/c989c829a2877132cb100f901e320921250e068d/src/ngx_http_redis2_module.c#L32)：32 / 131 | 11；正式入口使用已提交 reply.c，.rl 是 reply 解析生成输入，不运行生成器、不计作 commands |

## 七项非自身指令的正向用途

下表同时是可直接配置的 `scope_review.evidence` 精确范围。除 CLI 安装证据显式标记 `component: "openresty"` 外，证据组件默认同 source；记录固定原文 `code`，OpenResty 跨组件证据还记录其 revision。分类不借用旧只接受纯 Lua 的 `knowledge/component-scope.json`。

| 组件 / 完整 revision | classification | 必需证据 id、文件及范围 | 正向结论 |
|---|---|---|---|
| lua-upstream-nginx-module / a84fbbb3d3b07684c232f642eccbc5334bafcbfe | nginx_lua_api_module | build-entry config:1–16；module-owner src/ngx_http_lua_upstream_module.c:52–65；api-entry 同文件:68–105 | [module 初始化器](https://github.com/openresty/lua-upstream-nginx-module/blob/a84fbbb3d3b07684c232f642eccbc5334bafcbfe/src/ngx_http_lua_upstream_module.c#L52) 第三字段明确 NULL；postconfiguration 路径调用 ngx_http_lua_add_package_preload 注册 ngx.upstream，不是配置指令 |
| lua-cjson / 91ca29db9a4a4fd0eedaebcd5d5f3ba2ace5ae63 | lua_c_extension | build-entry Makefile:14–107；installation Makefile:104–108；api-entry lua_cjson.c:1659–1679 | [Makefile](https://github.com/openresty/lua-cjson/blob/91ca29db9a4a4fd0eedaebcd5d5f3ba2ace5ae63/Makefile#L87) 构建/安装 cjson.so；luaopen_cjson 与 safe 入口是 Lua 原生扩展，不是纯 Lua；CMake 的 Lua MODULE 路径也不是 Nginx owner |
| lua-redis-parser / 2c5a4e960da7870ab29dd6001ba6a2828ce77760 | lua_c_extension | build-entry Makefile:13–41；installation Makefile:43–45；api-entry redis-parser.c:65–100 | [Lua API 入口](https://github.com/openresty/lua-redis-parser/blob/2c5a4e960da7870ab29dd6001ba6a2828ce77760/redis-parser.c#L75) luaopen_redis_parser；Makefile 构建 parser.so 并安装在 redis 下 |
| lua-rds-parser / 621e6b978983b4779435a56480ea636eae93d65d | lua_c_extension | build-entry Makefile:13–41；installation Makefile:43–45；api-entry src/rds_parser.c:34–52 | [Lua API 入口](https://github.com/openresty/lua-rds-parser/blob/621e6b978983b4779435a56480ea636eae93d65d/src/rds_parser.c#L41) luaopen_rds_parser；内部旧 VERSION 文字不能替代发行 tag |
| lua-resty-signal / 737d8ccfaa59c08ad4d32a712611a856775a61c5 | lua_ffi_library | build-entry Makefile:10–34；installation Makefile:40–43；api-entry lib/resty/signal.lua:21–67；native-entry resty_signal.c:40–49 | [Lua loader/FFI 声明](https://github.com/openresty/lua-resty-signal/blob/737d8ccfaa59c08ad4d32a712611a856775a61c5/lib/resty/signal.lua#L21) 加载 librestysignal.so；声明 resty_signal_signum 与实际 C 定义相连；不能当纯 Lua |
| resty-cli / 3022948ef3d670b915bcf7027bcdd917591b96e4 | cli_tool | distribution-install openresty util/configure:1155–1166；cli-entry bin/resty:1–26 | [发行安装入口](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/configure#L1155) auto_complete resty-cli 与 INSTALL bin/*；bin/resty 为 Perl CLI。生成配置字符串不是新 C 注册 |
| opm / 315e56b907eb5edefa704df0b0fe286998e0317e | cli_tool | distribution-install openresty util/configure:1140–1153；cli-entry bin/opm:1–19 | [发行安装入口](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/configure#L1140) auto_complete opm 与 INSTALL bin/*；bin/opm 是 Perl CLI。仓库 Makefile 的服务端/web 模板及 nginx.conf 不属于发行 CLI 注册入口，不运行 backend |

范围审查仍扫描固定树生产 native 文件以拒绝“非指令分类但实际存在注册”的矛盾；这个扫描只是交叉检查，分类终态由上表正证据建立。工具示例、测试配置、Lua 库 API 名称不计入注册数。

## 最小配置与输出 shape

九个有指令模块沿用 NDK 阶段已经支持的输入，无需新宏展开。例如：

```json
{
  "component": "rds-csv-nginx-module",
  "path": "repos/rds-csv-nginx-module",
  "repository": "https://github.com/openresty/rds-csv-nginx-module",
  "tag": "v0.09",
  "revision": "b4095fcb8a866835ddec7ea0c414b8a4af35741a",
  "version": "0.09",
  "role": "nginx-module",
  "registration_inputs": [{ "file": "src/ngx_http_rds_csv_filter_module.c" }]
}
```

非指令来源示例；其余六项按上一表 id/path/range 逐项照填：

```json
{
  "component": "lua-upstream-nginx-module",
  "path": "repos/lua-upstream-nginx-module",
  "repository": "https://github.com/openresty/lua-upstream-nginx-module",
  "tag": "v0.07",
  "revision": "a84fbbb3d3b07684c232f642eccbc5334bafcbfe",
  "version": "0.07",
  "role": "nginx_lua_api_module",
  "scope_review": {
    "classification": "nginx_lua_api_module",
    "evidence": [
      { "id": "build-entry", "file": "config", "start_line": 1, "end_line": 16 },
      { "id": "module-owner", "file": "src/ngx_http_lua_upstream_module.c", "start_line": 52, "end_line": 65 },
      { "id": "api-entry", "file": "src/ngx_http_lua_upstream_module.c", "start_line": 68, "end_line": 105 }
    ]
  }
}
```

`scope_review` 与 `registration_inputs` 互斥；未知分类、缺证据、重复/未知 id、缺文件、越界行号、错误组件、断开的入口/安装关系均拒绝。现有 gate 只接受本批真实出现的四种分类，不提供通用构建解释器。输出对应 matrix 项为 `inspection: fixed_build_and_entry_review`、`directive_scope: no_own_directives`、实际 classification 和带 code 的 scope_review；这不是 API 知识全量完成状态。

有注册的输出仍为 `fixed_registration_inputs`，保留 flags/context/callback/post、compile_guards、完整注册原文坐标和 `registration_evidence` owner/container 坐标；build 可据后者发布原文，包括字段中的 conf/offset。不执行 eval，不泛化 C 预处理器；未知注册宏、名称表达式、include 等仍错误退出。

## Redis 来源桥配置

`redis-nginx-module` 的发行下载 URL 来自固定 [mirror-tarballs](https://github.com/openresty/openresty/blob/8c37412c31621225e7aa7e825b5b50106c9c71c4/util/mirror-tarballs#L692)，矩阵 repository 为 null。显式覆盖为 `https://github.com/osokin/ngx_http_redis`、真实 tag `0.3.9`、revision `411fef36e130129b670fa7f2672bcad6ab2cbdd3`，不 fallback 到 nginx。

`archive_evidence` 精确字段为 `{ url, path, sha256, files: [{ path, sha }] }`：

- url：`https://people.freebsd.org/~osa/ngx_http_redis-0.3.9.tar.gz`，必须与发行下载项相同。
- path：主持久保存的 `analysis/source-archives/ngx_http_redis-0.3.9.tar.gz`；正式配置可相对配置目录，隔离配置必须使用实际绝对路径。
- sha256：`21f87540f0a44b23ffa5df16fb3d788bc90803b255ef14f9c26e3847a6f26f46`。
- files：完整复制来源 manifest 的九个 `{path,sha}`：AUTHOR、CHANGES、LICENSE、README、config、ngx_http_redis_module.c、t/Test/Nginx.pm、t/redis.t、t/redis_db_not_set.t；sha 是真实 Git blob SHA-1，不是文本 SHA 或归档 SHA。

门禁先实际核原包 SHA-256，再只读 tar 成员并计算 `blob <bytes>\0<data>` SHA-1，要求归档、配置全 files 清单与 Git 固定树的全部路径/blob 完全相等，检查实际 origin 等于显式 repository。不解包进源码；拒绝链接、危险路径、缺/额外/重复文件、不相同字节或任一映射失败。用户输入的 `tree_matches:true` 不作为凭据；输出的该值仅在实际检查通过后生成。

原包 AUTHOR 的维护者身份是主已核的来源归属证据；不能由维护者名字替代完整树绑定。三个发行 redis patch 的逐事实影响仍归主线程后续范围/知识审核，未将本次原包注册提取当作 patch_unaffected。

## 66条完整新增名称集合

集合按固定 commands 原始顺序逐项测试，不仅比对数量：

- rds-json-nginx-module（10）：rds_json、rds_json_root、rds_json_success_property、rds_json_user_property、rds_json_errcode_key、rds_json_errstr_key、rds_json_format、rds_json_content_type、rds_json_ret、rds_json_buffer_size。
- rds-csv-nginx-module（6）：rds_csv、rds_csv_row_terminator、rds_csv_field_separator、rds_csv_field_name_header、rds_csv_content_type、rds_csv_buffer_size。
- drizzle-nginx-module（12）：drizzle_server、drizzle_keepalive、drizzle_query、drizzle_dbname、drizzle_pass、drizzle_connect_timeout、drizzle_send_query_timeout、drizzle_recv_cols_timeout、drizzle_recv_rows_timeout、drizzle_module_header、drizzle_buffer_size、drizzle_status。
- iconv-nginx-module（3）：set_iconv、iconv_buffer_size、iconv_filter。
- encrypted-session-nginx-module（5）：encrypted_session_key、encrypted_session_iv、encrypted_session_expires、set_encrypt_session、set_decrypt_session。
- redis-nginx-module（8）：redis_pass、redis_bind、redis_connect_timeout、redis_send_timeout、redis_buffer_size、redis_read_timeout、redis_next_upstream、redis_gzip_flag。
- ngx_postgres（10）：postgres_server、postgres_keepalive、postgres_pass、postgres_query、postgres_rewrite、postgres_output、postgres_set、postgres_escape、postgres_connect_timeout、postgres_result_timeout。
- ngx_coolkit（1）：override_method。
- redis2-nginx-module（11）：redis2_query、redis2_raw_query、redis2_raw_queries、redis2_literal_raw_query、redis2_pass、redis2_bind、redis2_connect_timeout、redis2_send_timeout、redis2_buffer_size、redis2_read_timeout、redis2_next_upstream。

## 补丁集成与未完成 metadata

inventory 在所有来源/旧范围证据通过后动态导入主负责的 `nginxPatchRegistrations`，传实际 `root/config/configPath/show/mainRevision` 及追加前的 `existingDirectives = directives.filter(item => item.component === 'nginx')`。追加返回 directives，保存 `matrix.nginx.patch_scope`，不修改主 patchmodule。主已负责完整初始化器 signature、重复身份和跨文件冲突验证；主报告 distribution 测试3/3，本次不重复冒称执行。

本批66条加旧949条为1015；若主实际集成补丁新增两条，则应为1017。此处是交接预期，不是正式 inventory/build 实跑结果，也未使新增 registration_only 升格 basic。

`scope_complete` 不再仅看43项是否 inspected：只有明确 `fixed_registration_inputs`、`fixed_build_and_entry_review`、`fixed_tree_and_install_review` 的检查终态才参与该门槛。旧 `local_c_registration_scan` / `no_c_registrations_found` 不闭合。该信号仍不能单独代表发行补丁、全 C01、基础知识或全网站完成；最终 inventory_complete 由主按冻结计划审正式构建范围与补丁元数据，不在本实现赋全局 true。

主 config 的16项已与本测试精确输入一致，本实施块没有缺配置 metadata。剩余另阶段工作：

1. 旧 LuaJIT2 与 lua-resty-core 正向用途 gate 和对应 source.scope_review 尚未实施，不能先配置成已支持分类。已只读准备：LuaJIT2 固定 `33d6b04681d2f079a6d013988a426a841c52e29e`，src/Makefile:501–549 的 BUILDVM/LJVM/LJCORE/LUAJIT 目标、根 Makefile:122–147 的 install、src/luajit.c:569–581 的 main/lua_open、src/lj_state.c:239–260 的条件 VM 创建器；这应独立核为 Lua runtime，不能当 Lua C 扩展或零匹配终态。lua-resty-core 固定 `2da3d7719a05b2981f3808ca874517b558f29fa9`，Makefile:11–20 安装 lib/resty/core/*.lua 等，lib/resty/core.lua:1–37 为 require/return 正向入口；需原生/生成输入排除的纯 Lua 分类 gate。两类后续只补这两来源，不重扫已过13旧纯 Lua 远程范围。
2. 旧 C 模块与 Nginx711条的正式构建 closure、补丁两项与最终全局完成计算由主/审核处理；不是换 inspection 名字即可通过。
3. C02 下一批按主通知执行 headers_more 剩余3条 + echo19条，然后其他第三方96、HTTP Lua71 / stream49；本批未写这些内容。Nginx711+补丁2归主独占，分组知识文件及精确写集须主接入后冻结，不并写公共汇总文件。

## 本阶段实测验收

执行 `node --test test/remaining-scope.test.mjs`，4/4 通过（0失败/0跳过）。仅隔离配置和目录，正式 current/catalog/dist 没有执行写入。

- 真实16固定输入：完整66名称集合、owner、revision/repository、原文坐标、registration_only、redis_bind guard、七项用途证据及九文件来源桥。
- scope gate：错误/未知分类、缺/重复证据、错文件/范围/组件、错误安装/入口、与 registration_inputs 互斥、实际有注册却套非指令分类等均拒绝，失败保留已有隔离目录。
- Redis 桥：缺 repository/proof、错误 URL/SHA/revision、缺/额外/错误 blob 等拒绝；用完整但更改 AUTHOR 的归档更新摘要并谎称 tree_matches 仍拒绝，不信布尔声明。
- 九个真实模块原文均注入未知注册宏作为负例并拒绝；lua-upstream 真 NULL commands/preload 原文正证据保持，不以 strict extractor 零结果冒充分类完成。

下一步由主运行实际 inventory/build、审核来源展示和全局范围 metadata；实施者本阶段 ready 后停写，不等待全网站完成。

## C01 第二子阶段：旧两来源本地正向用途 gate

2026-10-10。此追加节更新上文“LuaJIT/core 尚未实施”的历史状态：两类 gate 已实现、隔离测试通过，现 ready 停写供主配置及审核。原16来源配置、注册集合和 gate 没有改动；全局 scope_complete 判定、13项远程纯 Lua 范围记录、知识正文均未调整。本子阶段没有新增配置指令。

### 主可直接使用的两项 scope_review

保留各 source 既有 path/tag/version，补以下 revision、role 和 scope_review。`classification` 是 gate 的输入，role 与其一致便于直接查看配置；inventory 输出 role 由已核 classification 决定。所有证据默认归属该 source，无跨组件定位。

```json
[
  {
    "component": "luajit2",
    "revision": "33d6b04681d2f079a6d013988a426a841c52e29e",
    "role": "lua_runtime",
    "scope_review": {
      "classification": "lua_runtime",
      "evidence": [
        { "id": "build-entry", "file": "src/Makefile", "start_line": 501, "end_line": 763 },
        { "id": "installation", "file": "Makefile", "start_line": 92, "end_line": 147 },
        { "id": "api-entry", "file": "src/luajit.c", "start_line": 569, "end_line": 581 },
        { "id": "vm-entry", "file": "src/lj_state.c", "start_line": 239, "end_line": 265 }
      ]
    }
  },
  {
    "component": "lua-resty-core",
    "revision": "2da3d7719a05b2981f3808ca874517b558f29fa9",
    "role": "lua_reference_library",
    "scope_review": {
      "classification": "lua_reference_library",
      "evidence": [
        { "id": "installation", "file": "Makefile", "start_line": 11, "end_line": 20 },
        { "id": "api-entry", "file": "lib/resty/core.lua", "start_line": 1, "end_line": 37 }
      ]
    }
  }
]
```

### LuaJIT 正向证据与支持边界

固定 [src/Makefile:501–763](https://github.com/openresty/luajit2/blob/33d6b04681d2f079a6d013988a426a841c52e29e/src/Makefile#L501) 把 host/buildvm、LJVM、包含 lj_state.o 的 LJCORE、luajit.o 及静态/动态库目标连到实际规则：683–695 的 DynASM/buildvm 生成路径，749–761 的库和 CLI 链接规则。故本次将准备时501–549的目标声明范围扩展到763，避免缺少生成和链接的正证据。生成器仅静态读取，未运行；其产物是 LuaJIT VM/内部定义，未计为 Nginx commands。

固定 [根 Makefile:92–147](https://github.com/openresty/luajit2/blob/33d6b04681d2f079a6d013988a426a841c52e29e/Makefile#L92) 给出 FILE_T/FILE_A/FILE_SO 实际文件名、INSTALL_DEP=src/luajit、进入 src 的构建入口，以及可执行文件和存在时的静态/动态库安装规则；gate 将这些名字与 src/Makefile 目标核对。条件安装和平台分支原文保留，不推断当前机器构建或部署状态。

固定 [src/luajit.c:569–581](https://github.com/openresty/luajit2/blob/33d6b04681d2f079a6d013988a426a841c52e29e/src/luajit.c#L569) 是实际 main 定义和 lua_open 调用；[src/lj_state.c:239–265](https://github.com/openresty/luajit2/blob/33d6b04681d2f079a6d013988a426a841c52e29e/src/lj_state.c#L239) 是实际 VM 创建器定义，保留 LJ_64 等条件下 lj_state_newstate / lua_newstate 的两个签名和共同函数体。gate 要求两个源文件位于对应 src/Makefile 同目录、对象名存在于该构建证据，并验证上述生成/链接/安装关系。运行时不是 Lua 插件库，也没有把 C 扫描零命中作为用途分类依据。

### lua-resty-core 正向证据与支持边界

固定 [Makefile:11–20](https://github.com/openresty/lua-resty-core/blob/2da3d7719a05b2981f3808ca874517b558f29fa9/Makefile#L11) 的 all 为空目标，install 将四组 lib 下的 Lua 文件复制到对应 LUA_LIB_DIR 子目录。gate 只接受当前真实的单层 `lib/.../*.lua` 安装形态，要求完整固定树的每个生产 lib/*.lua 都被对应目标目录覆盖，不能漏掉 lib/ngx/ssl 等子目录。

固定 [lib/resty/core.lua:1–37](https://github.com/openresty/lua-resty-core/blob/2da3d7719a05b2981f3808ca874517b558f29fa9/lib/resty/core.lua#L1) 是实际 require/return 入口；gate 核其入口及 require 的各个库模块确实存在于安装的 Lua 文件集合，保留 http subsystem 条件。完整固定树同时排除已支持检查的 native/生成输入及 config/configure；出现不符合该形态的来源不能套用此类终态。此处“纯 Lua”描述本组件发行源码与安装内容，不表示没有对 Nginx/LuaJIT 的 FFI 或其他运行时依赖。

该本地 `source.scope_review` 类别与旧13项远程 `component_scope_file` 仅共享分类名称；旧文件及验证分支未修改或重扫。两项 matrix 输出均为 fixed_build_and_entry_review / no_own_directives，并保存原文证据；不改变其他组件的扫描状态或推定全 C01 完成。

### 隔离验收与剩余交接

执行 `node --test test/remaining-scope.test.mjs`：6/6通过，其中原16来源4项测试保持通过，新增2项覆盖本批。两源隔离盘点0注册，41项仍 not_inspected，scope_complete=false。

新增正例逐项比对证据 code 与固定 SHA 的原文，核用途、revision、零注册和 VM 条件保留。另在 mkdtemp 内本地克隆 core，改坏工作树 Makefile/API 并放入未跟踪 C 注册，输出仍等于固定树证据；临时目录 finally 清理，用户两仓库依旧 clean，HEAD 未变。

新增负例共17种：仅目标声明而缺生成/链接、仅末尾链接而缺对象集合、缺安装文件定义、安装被截断、缺 main 中 lua_open、把 VM 文件当 CLI、缺 VM 函数体、丢失 VM 初始条件、缺证据；core 漏安装子目录、缺 install/all 目标、缺入口 return、README 冒充入口、错误组件、错误类别；revision 不匹配；原生 FFI signal 冒充纯 Lua。全部拒绝且不覆盖已有隔离 components.json。

本子阶段只改 inventory 的两类 scope gate、同一测试文件和本 notes 追加节。主下一步将以上 metadata 加入两个既有 source，按需正式重跑 inventory/build 并交审核；实施者没有运行正式产物生成，也未写 C02 内容。旧 C 模块/Nginx 构建范围与补丁完整性仍由主/审核单独闭合。
