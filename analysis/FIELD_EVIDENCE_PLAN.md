# 功能与语法字段级证据补齐计划

日期：2026-10-16。主线程负责规划、抽查、集成构建与验收；实施与逐字段审核由子 agent（Claude Sonnet 5.5）执行。本文是实施与审核的共同判据，不表示补齐已经完成。

## 目标与现状

当前发布 `1.27.1.1-f43ab3d7392bdcc9` 的 1041 个条目中，`summary`（功能）与 `syntax`（语法）均为纯字符串，没有字段级 `status/source_ids`。条目级基础核对按 `BASIC_SCOPE_NOTE` 已覆盖功能、语法、上下文与配置入口，但 Agent（`experiments/pi-sdk/src/knowledge-tools.mjs` 的 `fieldInfo`）对纯字符串一律返回 `unverified`，页面因此对全部条目显示“未核实”；详情页则不显示任何状态，两处表述不一致。

目标：为 1041 × 2 = 2082 个字段逐项登记锁定源码出处并给出字段级状态；统一网站、Markdown、Agent 的显示。不得以条目评级、已有来源列表或测试通过批量晋级字段。证据不足的字段保留 `unverified` 并写明缺口，不为凑数晋级。

任务范围固定为 `analysis/FIELD_EVIDENCE_MANIFEST.json`（身份、批次、基线摘要）。manifest 是范围，不是证据。

## 数据结构（只增不改）

不改变 `summary`、`syntax` 字符串类型，避免波及解析、匹配、历史发布与既有消费者。新增按批次的证据覆盖文件 `knowledge/field-evidence/<批次>.json`：

```json
{
  "batch": "B02",
  "entries": [{
    "id": "nginx--ngx_http_core_module--variables_hash_bucket_size",
    "evidence": [{ "id": "syntax-parser", "component": "nginx", "file": "src/core/ngx_conf_file.c", "start_line": 1, "end_line": 2 }],
    "syntax_evidence": { "status": "verified", "source_ids": ["registration", "configuration-definition"], "note": "简短判据" },
    "summary_evidence": { "status": "verified", "source_ids": ["implementation-1", "hash-builder"], "note": "简短判据" },
    "corrections": { "syntax": { "text": "修正后的文字", "reason": "与源码不符之处" } }
  }]
}
```

- `evidence` 仅追加新的源码片段，ID 不得与该条目已有来源碰撞；构建从固定 revision 读取原文。
- `*_evidence.status` 取 `verified` 或 `unverified`；`unverified` 必须在 `note` 写明缺口。
- `corrections` 可选，仅在源码证明原文错误时使用，必须写理由，审核单独签署。
- 发布详情新增 `summary_evidence`、`syntax_evidence` 对象；无覆盖时构建写入 `{status:"unverified", source_ids:[], note:null}`。历史发布没有这两个字段，读取时按缺省处理，不重写旧发布。

## 字段证据判据

语法 `verified` 必须同时满足：

1. `source_ids` 含 `registration`；参数个数与注册标志（`NGX_CONF_NOARGS/TAKEn/FLAG/BLOCK/1MORE/2MORE/ANY` 等）一致，多种写法逐行核对。
2. 参数形态有源码依据：标准 setter（`ngx_conf_set_flag/num/size/off/msec/sec/bufs/enum/bitmask/str/keyval/path/access_slot` 等）引用 `configuration-definition`，enum/bitmask 另需取值表片段；自定义解析函数必须引用该函数中解析参数的片段，关键字、可选参数、`key=value` 形式逐项对应。
3. 官方文档（`official-doc`）只能交叉印证，不能作为唯一依据；文档为现行版本，与锁定源码冲突时以源码为准并在 note 说明。

功能 `verified` 必须同时满足：

1. `source_ids` 至少含一个实现类源码（`.c/.h/.patch`），不能只有 `registration`、`configuration-definition`、`module-owner`、`distribution-*`、`module-build` 或文档。
2. 引用片段能直接支撑 summary 的每个行为陈述；有条件或平台限定的陈述，片段必须覆盖该条件。
3. 共享片段可以复用，但 note 必须写出本条指令如何进入该逻辑，不得整模块复制同一结论。

两类字段均要求该条目 `patch_status` 不是 `unverified`；新增引用涉及补丁后分支时须核对固定发行补丁。部门扩展（VTS）按独立 commit 快照核对，不推断现场版本。

## 显示规则

- 字段 `verified`：显示“已核实”及其源码出处（可展开）。
- 字段 `unverified` 且条目为基础或深度核对：显示中性标签“待补出处”，说明“已随条目基础核对；尚未逐字段登记源码出处”。不显示为与“未核实”相同的警示样式。
- 条目仅注册信息：维持“未核实”。
- 网站详情、Markdown（`renderMarkdown`）、Agent 卡片与模型工具返回使用同一状态来源（`*_evidence`）。

## 批次（互斥分区，并集为 1041）

| 批次 | 范围 |
| --- | --- |
| B01 | nginx 核心、事件、线程池、正则、OpenSSL 等全局模块，及 http/stream/mail 块入口 |
| B02 | ngx_http_core_module |
| B03 | ngx_http_proxy_module |
| B04 | ngx_http_fastcgi_module、ngx_http_memcached_module |
| B05 | ngx_http_scgi_module、ngx_http_grpc_module |
| B06 | ngx_http_uwsgi_module |
| B07 | ngx_http_ssl_module、ngx_http_v2_module、ngx_http_v3_module |
| B08 | 其余 HTTP 模块（模块名 access 至 limit_req） |
| B09 | 其余 HTTP 模块（模块名 log 至 xslt，含 upstream 系列） |
| B10 | 全部 ngx_stream_* 模块（块入口除外） |
| B11 | 全部 ngx_mail_* 模块（块入口除外） |
| B12 | lua-nginx-module |
| B13 | stream-lua-nginx-module |
| B14 | echo、headers-more、set-misc、srcache、array-var、form-input、encrypted-session、iconv、ngx_devel_kit、ngx_coolkit |
| B15 | drizzle、memc、ngx_postgres、rds-csv、rds-json、redis、redis2、xss |
| B16 | nginx-module-vts（部门扩展） |

精确 ID 以 manifest 为准。各批写集只包含自己的 `knowledge/field-evidence/Bxx.json` 与 `analysis/field-evidence/Bxx-EVIDENCE.md`，因此批次可并行实施；构建、测试与发布只由主线程执行。

## 交付与审核

每批实施交付：覆盖文件、逐条证据记录（ID、字段、结论、引用片段与判据、缺口）、`node scripts/build.mjs --config project.config.json --check` 通过结果、未解决项清单。

每批审核由独立子 agent 逐字段执行，对照固定 revision 原文核对每个 `source_ids` 是否支撑结论，结果写入 `analysis/field-evidence/Bxx-REVIEW.md`，逐项标记通过 / 退回 / 证据不足。退回项由实施者修正后复审。主线程对每批抽查，并核对计数与写集。

## 保真与全量验收

1. 除新增 `summary_evidence`、`syntax_evidence`、追加 `sources` 与经审核的 `corrections` 外，1041 个详情其余字段与基线发布逐项一致；身份、顺序、基础 997 / 深度 44 集合、来源分组计数不变。
2. 每个 `verified` 字段的 `source_ids` 可解析且满足上文判据；构建校验强制执行可机械检查的部分。
3. 旧发布不重写；历史测试契约按原基线保留，新增本轮基线到新发布的字段白名单保护。
4. 全量测试、Agent 测试、部署测试通过；浏览器核对网站与 Agent 两处显示一致。
5. 验收记录写入 `analysis/FIELD_EVIDENCE_VERIFICATION.md`，绑定 manifest 摘要、知识输入摘要与发布 ID。
