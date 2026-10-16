# 正式构建注册 gate：固定构建与生成边界 ready

2026-10-10。只修改本说明、`scripts/registration-build.mjs`、`test/registration-build.test.mjs`。未修改 inventory/build/config/knowledge，未运行正式 inventory/build，未编译、配置或运行 OpenResty，未执行任何来源脚本或生成器。

## 结论

小接口已实现，真实固定来源测试通过。20 个字面构建组件可核：16 个第三方模块共255条；set-misc/array/form 为29/4/2；lua-upstream 以正式 initializer 的 NULL commands 确认0条。不是全树扫描或用零匹配判无。

**Nginx 与 NDK 两处已补足，固定22个组件均返回 verified，门禁实施 ready。** 这是固定上游构建注册边界完成，不等于本机编译成功、发行默认全部开启、补丁回放完成或整个 C01 已由主验收。主仍须结合独立归档、发行补丁和其余非指令组件 gate 决定 inventory_complete；当前发布未变。

## 主接入接口与配置

```js
const review = await reviewRegistrationBuild({
  source,
  read: (file, component) => showFrozen(component, file),
  paths: fullFixedTreePaths,
  records: upstreamComponentRecords
});
```

`read` 可以同步或异步，返回 UTF-8 原文。第二参数总是明确组件名；不能默认在当前组件查不到就回退 Nginx。调用方负责把组件绑定到已验证的 repository/revision 和完整固定 Git tree，不允许读工作树。门禁自身不读磁盘、不联网、不执行源码、不写产物。

`records` 只传当前组件未加发行补丁的上游记录。Nginx 用 `!record.distribution_patch` 隔离724条；两条发行新增由主的独立回放门禁处理。Redis 同样不以本 gate 代替 archive_evidence 或发行补丁审计。若传入别的组件/发行新增则拒绝。

可直接合并到每个已有 addon source 的 JSON 片段：

```json
{"registration_build":{"entry":"config"}}
```

Nginx：

```json
{"registration_build":{"entry":"auto/configure"}}
```

不用额外源码清单、owner 名称配置或新的公共 schema；NDK 沿用既有 registration_inputs，缺/重复/未消费映射拒绝。未配置 registration_build 返回 pending，而非回退全树扫描。当前只接受上述 entry 字段，不接受未解释的新 metadata。

需提供跨组件固定读取：各 addon 的 `nginx:auto/module`、`nginx:auto/modules`、`nginx:auto/make`；Nginx 另读 `openresty:util/configure`。测试固定使用 Nginx `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`、OpenResty `8c37412c31621225e7aa7e825b5b50106c9c71c4`；其余22项相关 SHA 在测试常量中，所有 blob 与 tree 均按完整 SHA 读取，不解析当前 HEAD。

返回值：

- `status: verified|pending`、`complete`：只描述本组件的本 gate，不是发行总范围完成标志。
- `source_files`：根构建消费者关联的完整固定 `.c` 路径。NDK 被 include 的容器及辅助 C 另在 generated_evidence.included_c_files，不能把包含片段再当独立编译单元；C++ 与 Perl XS 另分类。
- `owners`：实际 initializer 的 module/commands、位置、正式 consumer；NULL 单独记录。Nginx同文件双owner全部保留。
- `registrations`：现有严格 extractCommands 的原始记录，保留 guards、owner/container/include 证据和 NDK 临时 defines，不提升知识正文。
- `units`、`assignment_evidence`：实际 name/srcs 赋值、消费位置、源列表及条件原文。现代分支核 auto/module，legacy 核正式 module 集合与 NGX_ADDON_SRCS。
- `build_evidence`：构建脚本原文及真实组件/文件/范围；包含消费者与条件上下文。供审核使用，不要求主把整段脚本无差别加入公共 snippets。
- `generated_evidence`：Lua autoconf 注释头、Perl XS 扩展、C++ 兼容测试、Nginx 静态/动态模块指针聚合、NDK 已提交生成输入。记录用途、生产者、条件及未执行事实；完整原文在去重的 build_evidence。
- `excluded`、`reasons`：有证据的排除与尚未闭合路径。错误抛出，调用方应保留旧 current，不得 catch 后改成0条/complete。

## 实际核验结果

|组件|正式根 C 源数|上游注册数|结果|
|---|---:|---:|---|
|lua-nginx-module|64|79|verified，fake-shm 独立 config 未进入根列表|
|stream-lua-nginx-module|44|50|verified|
|echo-nginx-module|12|19|verified|
|headers-more-nginx-module|4|4|verified|
|xss-nginx-module|2|6|verified|
|memc-nginx-module|5|11|verified|
|srcache-nginx-module|6|20|verified|
|rds-json-nginx-module|5|10|verified|
|rds-csv-nginx-module|4|6|verified|
|drizzle-nginx-module|9|12|verified|
|iconv-nginx-module|1|3|verified|
|encrypted-session-nginx-module|2|5|verified|
|redis-nginx-module|1|8|verified，归档/补丁独立核|
|ngx_postgres|10|10|verified，owner 实际为 ngx_postgres_module，不猜 addon 名|
|ngx_coolkit|3|1|verified|
|redis2-nginx-module|4|11|verified|
|set-misc-nginx-module|17|29|verified，HMAC 条件源保留|
|array-var-nginx-module|2|4|verified|
|form-input-nginx-module|1|2|verified|
|lua-upstream-nginx-module|1|0|verified，实际 module initializer commands=NULL|
|ngx_devel_kit|1|1|verified；另核容器、15个optional C和嵌套MurmurHash2共17个被include的C文件|
|nginx|253|724|verified；119个initializer，其中103个有指令owner，注册文件102；另分类C++和Perl生成C|

以上是固定测试快照，不是产品硬编码计数。全部注册按 component/module/array/file/line/end_line/name/flags/context/callback/post/compile_guards 精确比较，不仅比较数量。原始 conf/offset 仍可从对应注册原文读取；此版本没有给 catalog 补造 extractCommands 尚未输出的字段。

## HTTP_STATUS 更正后的处理

依据实际 `auto/options:80` 初始 HTTP_STATUS=NO、`:271` 唯一 `--without-http_status_module` 参数仍设 NO，及 `auto/modules:630–638` 确实消费缺失的 status 源。读取固定 OpenResty util/configure，确认没有 with 参数/HTTP_STATUS 设置，并检查此次读取的 Nginx sources/modules/os/unix/threads 文件没有新增该变量赋值。

排除理由是**固定入口未提供启用 YES 的路径**，不是“HTTP_STATUS_SRCS 未消费”，也不是“所有默认 NO 都排除”。若 options 增加 YES、控制文件新增赋值、发行入口提供 with 选项，门禁拒绝此排除结论。HTTP V3、Perl、stream、Win32 IOCP 等仍在候选条件并集中。该判断不覆盖用户另外修改源码或私加入口的构建。

## 两处原未决的实际闭合

1. **Nginx 有序平台输入**：先展开 auto/sources 的定义快照，按 auto/os/conf 的11个实际 case 分支分别复制状态，应用其平台脚本或直接 POSIX/DragonFly 赋值，再按正式入口接 Unix（非Win32）、threads（非Win32）和 auto/modules 的 core/event 消费。条件自追加保留条件并集；未知引用/表达式、未知条件覆盖拒绝，不再通过全局 CORE_SRCS↔UNIX_SRCS 环递归推导正式集合。Win32 SELECT/POLL 正向覆盖为对应 Win32 文件，不混入 Unix select/poll；Windows 不加入 thread_pool。每个 unit 保存平台和赋值原文位置。HTTP/mail/stream 块的 name/srcs 与 auto/module 消费逐个绑定；MAIL/STREAM=DYNAMIC 的聚合变量、link 和 make 对 SRCS/SHRD 的消费另核。case/入口 include 的新增或顺序变化拒绝。类型探针保存实际 AUTOTEST/autoconf 输出用途，不作正式源。
2. **Nginx 生成/非C用途**：auto/modules、auto/make 的生成文本是 extern/module指针、名称和顺序聚合；核指针输出和动态源码循环，出现 ngx_command_t 拒绝。Perl 沿 auto/lib/make 的 USE_PERL 条件→auto/lib/perl/make 复制 XS/调用 Makefile.PL→ExtUtils::MakeMaker 的 nginx 扩展/生成 nginx.c 依赖→XS 的 MODULE/PACKAGE 正证据闭合；未知 XS INCLUDE/BOOT、新头、注册声明拒绝。4条正式指令仍来自已核 ngx_http_perl_module，不重复计 Perl 产物。C++ 源严格核 extern-C 固定头集合、无正式module name和仅return的兼容测试函数，新增语句或include拒绝。
3. **NDK 已提交生成输入**：正式根 config 包含 src 与 objs，编译 src/ndk.c；ndk_generate_files 只有函数定义而非根调用，因此实际消费 Git 已提交的生成片段，不假装重新生成结果。modules_optional 星号与 commands include 映射精确相等；optional C 列表和guard、NDK_ALL默认/依赖头、optional/普通/生成头清单分别按实际数据与固定模板对照提交内容。NDK头递归仅沿正式 src/objs include 路径，并核auto/src、actions、conf数据的正向输入，非凭全库同名搜索。
4. **新增发现及边界**：src/ndk_hash.c 的 NDK_MURMUR2 分支还 include `hash/murmurhash2.c`，已作为正式嵌套辅助C消费，边记录 `ifdef NDK_MURMUR2`；未知嵌套路径、缺文件、新注册拒绝。ngx_auto_lib_core 作为函数定义库读取，根config/library新增实际调用拒绝。NDK examples 不纳入。set-misc 正式 CFLAGS 可激活 upstream_list，但不推定 NDK 单独默认或用户部署已启用；此前 NDK notes 的默认组合解释继续有效。没有重新执行生成器，也没有声明所有生成头的字节等于重新生成结果：正式构建本来消费已提交头，门禁证明的是这些实际输入及注册边界。

普通系统头/外部依赖探针不按本机求值。verified 指这里支持的根正式 C 注册列表和 owner 绑定，不是“任意传递头宏、任何用户追加 CFLAGS、外部库、本机编译均证明”。HTTP Lua 的额外 DTrace patch/NGX_DTRACE=1 条件仍按 boundary 研究的未核自定义构建处理，不混同正式发行根注册列表。

## 支持与拒绝边界

仅支持当前冻结源码的字面列表、已定义变量引用、自追加列表、现代 auto/module 或 legacy NGX_ADDON_SRCS。字面 addon 按消费者前的赋值读取；条件保留，不执行。新变量、命令替换、变量覆盖、eval/export/unset 构建写入、未知 module type、addon 自行覆盖 link、缺现代消费者、未绑定 owner、缺帮助源、未知 C/inc include、未消费 registration_inputs 全部拒绝。额外 shell include 保持 pending。

不支持通用 shell/C 解释、函数求值、任意新增 config 形态，也不以“文件中含路径”替代绑定。NGX_MODULE_V1 的第三字段必须为可核 commands 符号或 NULL；有数组用现有 strict extractor，缺数组不能判无指令。

## 验收与交接

运行 `node --test test/registration-build.test.mjs`：8组通过。覆盖22个真实固定组件（含NULL owner），以及未知变量/表达式/覆盖/隐藏写入、link/type/消费者断链、缺源/重复tree、身份字段篡改、漏记录、未知include/未消费映射、HTTP_STATUS 新启用路径；新增平台覆盖/入口顺序、MAIL动态聚合、XS/C++用途、NDK星号/条件生成头/嵌套C/新增生成器调用等负例。测试修改仅存在于内存 read 包装，不改变来源工作树，不下载、不创建临时副本。

主可按原最小 registration_build.entry 配置接入，无新增metadata、公共schema或ledger。**本实现已ready；全C01仍须主汇总其余分类、归档、有效补丁门禁并独立审核后正式验收。** 保留当前发布。此前 codebase-design 技能用于把固定读取依赖放在接口外、测试与调用方共用一个入口；本次没有据技能扩大写集或创建新线程。

## WC-R12–R15 差异修复 ready，待独立复核

依据 `WEBSITE_COMPLETION_REVIEW.md:598` 起的5个真实反例修复四项；R13按审核原文是Nginx分支的两例，不涉及Lua autoconf。本次没有改Lua autoconf、配置、调用方或发布，也没有运行生成器/正式inventory/build。

|审核项|最小修复|实际负例|
|---|---|---|
|WC-R12|auto/configure的入口序列保留调用次数，不再unique；固定源中原有5次独立auto/define明确保留|在auto/modules之前再调用auto/sources，拒绝调用顺序变化|
|WC-R13|Nginx控制输入同样检查额外eval/export/unset和非独立构建写入；auto/module消费时核CORE/HTTP/HTTP_FILTER/HTTP_INIT_FILTER/MAIL/STREAM/MISC已支持type|追加eval改HTTP_SRCS、首次HTTP type改UNKNOWN均拒绝；另补export和unset负例。auto/module/auto/make中原有已核eval消费者没有被全局禁用|
|WC-R14|NDK根config识别行首或分号/连接符后的已知library函数调用，不把函数定义当调用|`:; ngx_auto_lib_init`、`: && ngx_auto_lib_init`、`: \|\| ngx_auto_lib_init`均拒绝|
|WC-R15|正式根C的每条include先核字面形态，再处理既有.c/.inc及NDK映射；不展开宏|在ngx_http_core_module.c追加EXTRA宏及`#include EXTRA`，明确拒绝未知根C include表达式|

将9个新增负例并入原有8组，没有删除或弱化既有断言。实际运行 `node --test test/registration-build.test.mjs`：8/8通过、0失败、0跳过；22组件固定正例仍通过。反例只改内存read返回值，不编辑来源文件。此处的ready是修复交接，不代独立复核通过；主复核前不提升scope_complete。

### R14 第二次差异修复：library 顶层连接符调用

按独立复核 `WEBSITE_COMPLETION_REVIEW.md:684–696` 仅补 R14，不重开已关闭的 R12/R13/R15。原来 library 的 column0 检查遗漏了被根 config source 后真正执行的顶层连接符语句。

现在先按冻结 library 的 `name() {` 至独立行 `}` 形态屏蔽完整函数定义体，保留换行，核定义块数量一致；对剩余顶层文本使用与根config相同的行首/分号/连接符调用检查。这个有限的函数定义边界识别不执行 shell，不把所有缩进行当顶层，也不实现通用 shell 解释器。

将三例分别加入原第8组：library末尾的 `:; ngx_auto_lib_init`、`: && ngx_auto_lib_init`、`false || ngx_auto_lib_init` 均以“NDK library 从仅定义变为被根入口调用”拒绝。另加正例：同样三种连接符调用位于 `ngx_auto_lib_init` 函数体内、目标为已有 `ngx_auto_lib_init_latest` 时，仍返回verified，证明没有因函数体内部调用误杀。

实际复跑 `node --test test/registration-build.test.mjs`：8/8通过，0失败、0跳过。没有删除或放宽原断言，没有运行生成器、正式inventory/build或改动config/current。R14修复ready，停写交独立差异复核；不把实现测试通过表述为审核已经关闭。
