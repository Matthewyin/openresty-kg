# M1/M2 最小可审查执行计划与冻结契约

日期：2026-10-10。依据：完整读取的 `REQUIREMENTS.md`、`IMPLEMENTATION_PLAN.md` 及本轮授权。本文件细化实施，不修改两份基线；基线中的历史“未启动”不覆盖本轮实施授权。当前主线程负责 M1 盘点，实施方按本文契约推进，审核方按验收矩阵复核。本规划任务只新增本文件，不下载源码、不启动服务、不改 tag 或已有实现。

## 1. 需求检查与最小路径

目标是用同一份可追溯知识走通网站与本地 MCP。先完成少量已核实代表内容，其余注册目录保留 `registration_only`；不能用目录条数冒充功能覆盖。部门样例稍后提供，不阻塞通用链路，但部门验收和 M4 不能提前记为完成。

采用零前端框架、原生 ES modules、Node 自带 `node:test`；公共解析与匹配为无 I/O 纯函数，浏览器与 Node 导入相同源文件。按 codebase-design 技能收敛 Interface：输入解析、候选判定各维护一次，不在页面与 MCP 重写规则。解析实现选最小词法/块结构扫描，先通过边界样例再认定可用，不能用单个正则扫描指令名。

已检查当前 `package.json`、`project.config.json` 与盘点脚本：已有 Node >=22、ESM、官方 MCP SDK 依赖和 inventory/build/test/mcp 入口。沿用主线程配置及用户 tag；SDK 的确切调用方式由实施方对照已安装官方 SDK 的导出、类型与示例，不在本计划凭记忆指定方法签名。现有 `knowledge_file` 是知识输入位置，不与发布索引路径混用。

## 2. 优先冻结：公共解析 Interface

公共入口统一冻结为 `src/core/core.mjs`，浏览器和 Node 从该文件导入。只有以下三个命名导出是当前必需外部契约；是否拆分 parser/matcher 内部文件由实施方决定，不构成调用方依赖。

```js
parseConfig(text)
parseSingle(text)
matchDirective(parsed, index, { context = null, module = null } = {})
```

本轮即时实施输入为主线程已有 inventory 与 `knowledge/directives.json` 中的 12 条基础知识；实施方直接接入，不等待新增盘点或研究。index/detail 沿用本文第4节及此前确认的发布路径；组件完整性由主线程处理，不作为公共解析模块启动前置条件。

返回形状速查：

```js
// parseConfig(text)
({ directives: [], errors: [] })
// parseSingle(text)：失败时 directive 固定为 null
({ status: 'ok', directive: parsedDirective, errors: [] })
// matchDirective(parsedDirective, index, options)
({ status: 'matched', candidates: [indexEntry], selected_id: indexEntry.id,
   effective_context: 'http', reason: 'unique_candidate' })
```

`text` 必须是字符串；预期输入错误以返回值表达，不抛出异常。非字符串返回 `invalid_input` 诊断。共享代码不得依赖 DOM、Node 内置模块、网络、文件系统或模型。

### 2.1 固定数据形状

```ts
type Diagnostic = {
  code: string;
  message: string;                 // 中文，不包含整段原始输入
  line: number; column: number;    // 1 起始
  offset: number;                  // 0 起始，JS UTF-16 索引
};
type ParsedDirective = {
  name: string;
  args: string[];                  // 词法取值，去外层引号，按 Nginx 规则处理转义
  raw_args: string[];              // 原始 token，保留引号、转义与变量
  line: number; column: number;
  offset: number; end_offset: number; // [offset,end_offset)，包括终止符
  kind: 'simple' | 'block' | 'lua_block' | 'name';
  contexts: string[];              // 外到内的父块名称，排除自身；不是适用 context
  context: string | null;          // 可证明的规范 context；未知必须 null
  parent_index: number | null;     // directives 数组中的父块索引
  complete: boolean;               // 词法闭合且所属块结构完整
  external_references: { kind: 'include' | 'lua_file'; value: string;
    status: 'not_analyzed' }[];
};
type ConfigResult = {
  directives: ParsedDirective[];   // 源码先序，含块头，不含 Lua 正文
  errors: Diagnostic[];
};
type SingleResult = {
  status: 'ok' | 'empty_input' | 'invalid_input' | 'parse_error' | 'out_of_scope';
  directive: ParsedDirective | null;
  errors: Diagnostic[];
};
```

位置以原始文本计算，CRLF 计一行；column 按 UTF-16 码元计数，与 offset 一致。`args` 不做变量展开、文件读取、参数类型或安全验证；`raw_args` 用于原样展示。`parseConfig` 空白或仅注释返回空数组且无错误，页面自行提示无指令。两入口不输出或上传整个输入日志。

### 2.2 parseConfig 行为

普通词法必须处理 `#` 行注释、单双引号、反斜杠、分号、块括号和变量 token；引号/转义中的分隔符及 `${name}` 不能误当块边界。块头在 directives 中独立记录，子项通过 parent_index 定位。缺分号、孤立闭括号、未闭引号/普通块/Lua 块分别报错并提供位置，不自动修补。

错误码至少：`invalid_input`、`missing_semicolon`、`unexpected_closing_brace`、`unclosed_quote`、`unclosed_block`、`unclosed_lua_block`、`invalid_token`。遇到不能可靠恢复的错误，保留已确认前缀及未完成项，停止扫描剩余不确定区；未闭合父块的后代 complete 也置 false。页面可以查看独立完整项的知识，但整体必须呈现“输入不完整/解析失败”，不能显示整体成功。

Lua 块依据锁定版本已核实的 Lua block 指令名称表识别，不能将任意 `_block` 后缀都当 Lua。名单由知识生产端从 HTTP/stream Lua 注册及实现核对后生成，共享解析器导入同一张表；名单缺口记入验收记录。Lua 扫描处理单双引号及转义、`--` 行注释、`--[=[...]=]` 长注释、`[=[...]=]` 长字符串（任意数量 `=`）、正文 table 嵌套花括号。只在这些结构之外配对花括号，不把 `if/end` 当配置块，不解释 Lua 语义；未闭字符串/注释使整个 Lua 块未完成。正文不进入 directives。

`include` 和已核实的外部 Lua 文件指令记录 external_references，value 为原 token 的词法值，包括变量；提示“外部内容未提供，未分析”。词法解析成功不表示 include 内容、Lua 语法或参数已验证。

### 2.3 context 的含义与确定方式

规范 context 使用语义槽名称：`main`、`events`、`http`、`http.server`、`http.location`、`http.upstream`、`http.if.server`、`http.if.location`、`http.limit_except`、`stream`、`stream.server`、`stream.upstream`、`mail`、`mail.server`；其他模块槽位按盘点证据追加，不允许把未知 flag 降格为 main。嵌套 location 的语义槽仍为 http.location，原始层级保留在 contexts/parent_index。

parseConfig 顶层 context 一律 null：同一文本可能是完整文件也可能是片段，不能从缺少父块推断 main。显式 `http {}` / `stream {}` / `mail {}` / `events {}` 为内部子项提供子系统锚点；锚点下经核实的块转换表决定 context。孤立 `server {}` / `location {}` 不能唯一确定子系统或完整祖先，因此保持 null。块头按父 context 匹配，不能拿其自身名称当其适用 context。未知块下不继承确定 context 给子项；保留层级并提示未能确定。

matcher 的 context 选项只指“当前被查询指令的有效槽位”，不是配置文件根 context，不自动拼接到 contexts。显式值与 parsed.context 同时存在但不一致时返回 context_conflict，不能覆盖已经观察到的层级。

### 2.4 parseSingle 严格行为

返回值始终恰含 status、directive、errors；status 非 ok 时 directive 必须 null。成功 errors 为 []，directive.complete 为 true。

允许：去掉外围空白/注释后的单个未引号包围的指令名称（kind=name、args=[]）；完整的一条以分号结尾的普通配置（kind=simple）；或一条完整的已核实 Lua 块指令（kind=lua_block，正文不解析为子指令）。裸名称用独立 token 分支识别，不能令 parseConfig 默许缺分号。`worker_processes auto` 必须 parse_error；`worker_processes` 可以查询名称。`foo;` 词法上允许，由 matcher 判断是否未知，不在此检查参数。

拒绝：两条及以上配置或普通配置块（例如 http/server/location，即使空块也超出单项查询范围）。多条范围错误码 `multiple_directives`，普通块范围错误码 `block_not_supported`。输入含词法/闭合错误时优先 parse_error；只有可可靠分辨的多条/块结构才返回 out_of_scope，不能在未闭引号中猜测第二条。空输入或仅注释为 empty_input（附同名诊断）；非字符串为 invalid_input。失败诊断保留原文位置，MCP 不改写为查询成功。

## 3. 优先冻结：匹配 Interface 与状态

`matchDirective` 的 parsed 参数只接受一个 ParsedDirective，不接受 ConfigResult 或 SingleResult；调用示例为 `matchDirective(single.directive, index, options)`，仅在 single.status=ok 时执行。页面逐项传入 config.directives 中的记录。

```ts
type MatchResult = {
  status: 'matched' | 'ambiguous' | 'context_required' | 'unknown'
    | 'context_mismatch' | 'module_mismatch' | 'context_conflict'
    | 'invalid_input' | 'invalid_index';
  candidates: IndexEntry[];
  selected_id: string | null;
  effective_context: string | null;
  reason: string;                 // 稳定状态原因码；展示文案由客户端中文映射
};
```

所有分支均返回全部五个字段，只有 matched 的 selected_id 非 null。候选按 id 字典序稳定排序；不能按参数、常见程度、数组顺序或实际环境猜测模块。匹配只判定知识身份，不判定运行环境适用性；registration_only 也可成为 matched，但展示必须标明仅有注册证据。

按以下优先顺序判定，候选字段含义固定：

| 条件 | status / reason | candidates |
|---|---|---|
| parsed 缺失、形状错误、complete=false，或选项类型/非规范 context 错误 | invalid_input / invalid_parsed、incomplete_directive 或 invalid_options | [] |
| 索引格式版本不支持、必需字段错误、id 重复 | invalid_index / invalid_schema | [] |
| 显式 context 与 parsed.context 冲突 | context_conflict / conflicting_context | 全部同名项 |
| 索引无精确同名项（大小写敏感） | unknown / name_not_in_index | [] |
| 有同名项，但指定 module 后无候选 | module_mismatch / module_not_in_candidates | 全部同名项，供纠正模块提示 |
| 已知 effective_context，筛选后的模块候选无适用项 | context_mismatch / context_not_in_candidates | context 筛选前的模块候选，供解释 |
| 尚未提供/推得 context，剩余同名候选超过一个 | ambiguous / multiple_candidates | 模块筛选后的全部候选 |
| 尚未提供/推得 context，剩余候选仅一个 | context_required / missing_context | 单候选；可预览知识，不声称匹配完成 |
| 已知 context，适用候选超过一个 | ambiguous / multiple_candidates | context 筛选后的候选 |
| 已知 context，适用候选恰一个 | matched / unique_candidate | 单候选 |

effective_context 为合法显式值，否则 parsed.context，否则 null；冲突时取 null。unknown 仅表示“未在本发布索引中找到”，索引未全量时不得说 OpenResty 不支持该指令。context_mismatch 不等于配置无效。若注册 flag 尚无法映射，条目标记 contexts_verified=false：不得因此排除候选或返回 matched；只要残留这种候选，返回 context_required / unverified_context_mapping，candidates 保留已知适用项与这些待核实项。该分支置于 context 筛选及唯一性判定之前。

## 4. 冻结：静态 JSON 与发布路径

### 4.1 路径、身份与一致性

```text
dist/knowledge/index.json
dist/knowledge/releases/<release_id>/index.json
dist/knowledge/releases/<release_id>/directives/<id>.json
dist/index.html
```

当前发布索引为完整 index 对象，不是另建一种 pointer 格式；它与该 release 的 index 内容一致。detail_path 固定为 `releases/<release_id>/directives/<id>.json`，相对于 knowledge/ 解析。所有读取 GET，仅路径由受验证索引中的 release_id/id 产生；不将用户原文或 args 拼入 URL、请求体、日志上传。

`schema_version` 固定整数 1；`release_id` 为本次不可变知识发布标识（配置/构建参数传入，不等同 OpenResty 版本），限制 `[A-Za-z0-9][A-Za-z0-9._-]*` 且不得为 `.` 或 `..`。相同 release_id 下禁止覆盖不同内容。先发布完整 release 目录，验证后原子替换当前 index；部署动作另行授权。一次查询固定一份 index 快照，后续只读其中的 detail_path，不能中途改用新发布详情。

id 采用稳定 `<component>--<module>--<name>`，各部分限定安全字符；如同模块同名注册确实语义不同，加来自稳定注册符号的后缀，不能以数组序号或行号造身份。构建器拒绝重复 id。module 必须人工或证据核对后的真实模块标识，不能仅凭命令数组名猜测。源码 tag 保留为 provenance，revision 使用固定完整 commit SHA；不切分支或更改用户 tag。

### 4.2 index 必需结构

```ts
type IndexEntry = {
  id: string; name: string; module: string; component: string;
  contexts: string[];
  contexts_verified: boolean;
  detail_path: string;
  verification: 'registration_only' | 'basic_verified' | 'deep_verified';
  phases: string[];                // 无可核实相关阶段时 []，不得臆配阶段
};
type KnowledgeIndex = {
  schema_version: 1;
  release_id: string;
  openresty_version: '1.27.1.1';
  coverage: { inventory_complete: boolean; registration_count: number;
    basic_verified_count: number; deep_verified_count: number;
    gaps: string[] };
  directives: IndexEntry[];
};
```

registration_count 为索引内去重 id 数，basic_verified_count 包含 deep_verified，深度数为其子集；inventory_complete 只能由全发行版组件/命令盘点证据置真。本轮少量代表内容不触发全量完成。

### 4.3 detail 必需结构

```ts
type Source = {
  id: string;
  component: string; version: string; revision: string;
  file: string; start_line: number; end_line: number;
  code: string; url: string;
  kind: 'upstream' | 'openresty_patch';
};
type Fact = { status: 'verified' | 'unverified' | 'not_applicable';
  text: string | null; source_ids: string[] };
type Detail = {
  schema_version: 1; release_id: string; openresty_version: '1.27.1.1';
  id: string; name: string; module: string; component: string;
  contexts: string[]; contexts_verified: boolean;
  syntax: string | null; summary: string | null;
  defaults: Fact; inheritance: Fact;
  limitations: { text: string; status: 'verified' | 'unverified';
    source_ids: string[] }[];
  availability: { compile_guards: string[]; dependencies: string[];
    deprecated: boolean | null; status: 'verified' | 'unverified' };
  verification: 'registration_only' | 'basic_verified' | 'deep_verified';
  verification_notes: string[];
  configuration_entry: { symbol: string | null; source_ids: string[] };
  sources: Source[];
  documentation: { title: string; url: string; status: 'verified' | 'unverified' }[];
  patch_status: { status: 'verified_unaffected' | 'verified_affected' | 'unverified';
    note: string; source_ids: string[] };
  phases: string[];
};
```

registration_only 的 summary/syntax 可为 null；显示“仅核实注册信息，功能说明尚未核实”，不能自动填模板功能文案。其 sources 至少包含真实注册片段，未追踪到回调定义时 configuration_entry.symbol 可记录注册的符号，但 verification_notes 明示定义未核实；注册片段不等于回调实现证据。

basic_verified 至少要求非空 syntax/summary、已核实 contexts、配置回调定义及注册证据、版本和补丁影响已核定；默认值/继承允许显式 unverified，不妨碍基线定义的基本功能覆盖。limitations=[] 只表示当前没有记录到限制，不意味着无任何限制。深度条目可追加 `runtime_chain`、`mechanism_ids`，但 deep_verified 必须有实际链路及第二信号证据；只读测试要注明“规格核对，未执行”。M2 不要求所有代表条目都升级深度。

sources 行号均为 1 起始、首尾包含，code 为指定 revision 文件中该范围原始内容（只统一 CRLF/LF），片段行数与范围一致；URL 使用 `https://github.com/<owner>/<repo>/blob/<完整SHA>/<file>#L<start>-L<end>`。不能用 master、可移动 tag 或研究机器本地路径替代。补丁生效后的行为不能伪造上游行号：分别引用上游片段与 OpenResty 固定 revision 的补丁片段，以 patch_status 解释应用条件，未确认则保持 unverified。Source 所属版本来自 detail 所在 release 的构建锁定信息，不跨发布拼接。

构建验证 index/detail 的 schema_version、release_id、openresty_version、id/name/module/component/contexts/verification 一致，source_ids 可解析、路径无逃逸且源片段可重现。未知 schema、缺失详情、内容不一致明确失败；不得自动降级拼接旧缓存。新增可选字段可保持 schema 1，改变字段语义/必需性须升级 schema 并同步两端。

网站详情链接固定为 `${siteBase}/index.html?release=<release_id>&id=<id>`（编码参数）；URL 只含发布和知识身份，不含输入及参数。siteBase、knowledgeBase、发布 id 均通过配置、环境变量或参数传入；加载指定 release 时读其不可变 index。

## 5. M2 两入口最小结果与错误传播

页面用同一解析器/匹配器，展示输入、逐项位置、整体诊断、候选选择、状态及详情；候选点击只是用户选择知识预览，不重写为自动匹配成功。纯名称查询调用 parseSingle，片段/完整文本调用 parseConfig；模式需明确，不能在 parseConfig 失败后悄悄放宽为名称查询。源码和配置用 textContent 展示，禁止作为 HTML 执行。

本地 MCP 使用已有官方 SDK、stdio，只读工具名 `query_directive`，输入 `{input:string, context?:string, module?:string}`；选项语义与 matcher 完全一致。进程只连接静态站点，不监听 HTTP；stdout 专供协议，stderr 诊断不得含用户原文或参数。地址来自环境/配置，安装及 Codex 接入由主线程按授权处理。

统一查询结果：`{status, schema_version, release_id, match, detail, markdown, detail_url, errors}`。schema_version=1；索引尚不可用时 release_id=null；match 未执行时为 null；未读得有效详情时 detail/detail_url 为 null。status 为匹配状态或 `empty_input|parse_error|out_of_scope|knowledge_unavailable`；invalid_input 沿用解析/匹配状态。知识不可用通过 errors.code 区分 `fetch_failed|invalid_json|unsupported_schema|release_mismatch|missing_detail|invalid_detail`。不得把 HTTP 失败变成 unknown。

matched 自动取详情；context_required 且仅有一个候选时也取详情供知识预览，保留 context_required 状态并注明尚不能判定输入的上下文适用性。其他候选通过结构化结果及稳定详情链接提供给用户，不猜测选择。detail.verification=registration_only 时 Markdown 必须先说明知识缺口，不能声称已返回已核实功能说明。Markdown 与结构化 JSON 均由这一个结果生成，包含 release、OpenResty 版本、状态、已核实事实和 source 引用；SDK 协议包装不改变这一数据对象。

## 6. 可独立审核的实施批次

| 批次 / 责任 | 输入与产物 | 完成判据 |
|---|---|---|
| M1-A 主线程盘点 | 锁定源码、mirror-tarballs、configure、补丁分支 → 组件矩阵、注册目录、缺口 | 版本/revision/tag、是否含指令及证据逐组件可查；未核实项保留 registration_only；不以现有 repos 列表冒充发行版全集 |
| M2-A 实施：优先启动 | 本文第2、3节 → shared parser/matcher、Node 边界样例 | 固定形状与全部状态通过接口级测试，浏览器无 Node 依赖；Lua 正文零误识别 |
| M1-B 主线程知识样例 | 盘点与源码 → knowledge/directives.json 等配置指定输入 | 核心、HTTP Lua、stream Lua、同名和条件限制有代表证据；无法核实的代表项不能升级 basic_verified |
| M2-B 实施：静态构建 | 样例与目录 → dist/index.html、共用模块、index/release/details | 构建验证契约及源码，注册内容与核实内容可区分；重复发布不能静默覆盖 |
| M2-C 实施：MCP | 公共接口、静态读取与本地 SDK → mcp/server.mjs、说明 | stdio 工具离线调用可核对，JSON/Markdown 同源，错误不伪装成功 |
| M2-D 审核与主线程验收 | 落盘计划、实现、测试记录 → analysis/REVIEW.md 或既有审核记录 | 逐条核对下表；遗漏退回实施，再复核；真实浏览器和 Codex 未测不得标全通过 |

M2-A 不等待全量盘点，可以用明确标为测试夹具的最小索引；夹具不得发布成真实知识。M2-B 等待至少少量真实 basic_verified 数据；M2-C 可先用注入 fetch 的静态响应测试，再接真实产物。主线程负责三方流控，不要求规划任务另建聊天或修改模型。

## 7. 必要验收矩阵与收口

| 验收面 | 最低样例与预期 |
|---|---|
| 单项入口 | 裸名称 ok；一条带分号 ok；只有名称带尾注释 ok；缺分号带参数 parse_error；单条完整 Lua 块 ok；多条/普通配置块 out_of_scope；未闭词法 parse_error |
| 普通词法 | 注释、单双引号、转义、引号内 #;{}、${variable}、CRLF、中文位置；指令、参数、层级与预期完全一致 |
| 结构失败 | 未闭引号/块、缺分号、孤立 }；有位置和 complete=false，不从不可靠后缀产生成功匹配 |
| Lua 边界 | 字符串中的 }、-- 注释、任意等号长字符串/长注释、嵌套 table、未闭合；闭合后下一条正常识别，正文无伪指令 |
| 上下文 | 顶层片段未知；孤立 server 不猜 HTTP；http/stream 内同名指令分开；块头按父 context；显式 context 冲突独立状态 |
| 匹配 | 表中每个 status 与 reason，未知 flag、同名跨模块、唯一名称但 context 缺失，候选排序及 selected_id 不变量 |
| 外部输入 | include、外部 Lua、变量均保留但不读取/求值，提示未分析 |
| 发布一致性 | 缺详情、旧 schema、跨 release、索引身份不一致、路径逃逸、重复 id、片段与行号不符均拒绝；当前索引切换不影响在途快照 |
| 内容状态 | registration_only 不计基本覆盖，未知默认值和限制保留状态；条件编译/依赖/废弃不能推断环境启用 |
| 两端一致 | 同输入/选项/索引得到相同候选；Markdown、页面、JSON 事实及来源一致 |
| 浏览器实测 | 实际操作输入到详情，查看片段；记录网络请求仅取静态资源，无配置原文/参数上传；离线测试不能替代 |
| Codex 实测 | Codex 真实调用 stdio 工具，名称和单配置及错误状态可见；引用能打开，无 HTTP 监听；离线工具测试不能替代 |

优先以 `node --test` 测公共 Interface 和错误行为，fetch 通过注入/桩测试，无须为测试启动 HTTP 服务。浏览器及 Codex 使用既有授权环境；无可用预览/接入条件则标“待实测”并列具体缺项。配置与源码校验、构建、离线测试通过只表示相应批次完成，不表示 M2 或首版总体通过。

收尾保留可复现测试夹具和审核证据，删除本批次无后续用途的临时文件；不清理主线程或用户产物，不修改基线或用户 tags。M3 全量知识、M4 部门样例与 M5 正式交付继续按两份基线执行。
