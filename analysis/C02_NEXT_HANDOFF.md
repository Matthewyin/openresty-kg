# C02 下一步交接

2026-10-12；规划角色（用户确认 Astra low）。本轮只读核对，唯一写入本文件；23批计划及冻结总方案不重写。

## 深度交互：恢复成果的判断

P01 已完成内容准备，可直接交独立审核，不重新派生产或研究。`analysis/content/HTTP_UPSTREAM_BASIC.json` 可解析且含11个唯一完整身份，与正式catalog七个HTTP upstream owner全集相等，与当前knowledge无交集；`analysis/HTTP_UPSTREAM_BASIC_NOTES.md` 已保存逐项入口、运行证据、补丁及隔离验收记录。准备完成不等于独立语义审核通过；本轮未代替审核角色逐条重审。

当前现场：catalog 1017、knowledge 197（唯一197，无catalog外身份）、差集820；proxy占68，P01占11，其余741。当前发布 `1.27.1.1-f8d93a840d4f0719` 为197 basic、0 deep；本轮调用既有 `validateCatalogScope`、`validatePublication` 只读校验1017详情及参考发布通过。不能把候审proxy/P01计入正式覆盖。

历史NOTES记录：191+11=202 basic、134处引用、34补丁/47文件哈希通过，临时release为 `1.27.1.1-14a8202bd73df8cc`，两项affected、九项局部unaffected；这些是此前实施记录，本轮没有重跑或独立确认该隔离构建。旧191/202计数不可直接用于当前验收。

## 直接执行：交主线程的接续步骤

1. proxy68继续原责任方差异修复及审核，依据 `analysis/WEBSITE_COMPLETION_REVIEW.md` WC-R18–R20：proxy_pass、proxy_send_lowat、proxy_ssl_ciphers、proxy_read_timeout、proxy_headers_hash_bucket_size五项涉及引用/阶段问题；只复核差异，不重新生产其余63项。68整体通过前不合并。
2. 将上述P01两份原成果原样交Astra独立逐项审核；输入仍是七owner十一身份及NOTES固定证据。重点按既有方案核server实际参数、keepalive三个寿命字段、zone共享范围，以及upstream_pipelining、balancer_status_code、upstream_timeout_fields的事实边界。输出逐项通过/明确差异；有问题仅退回原实施角色修对应条目，循环复核至11项全部闭合。
3. 审核可提前进行；建议接续顺序为197 → proxy68通过后265 → P01通过后276；主可按独立审核完成顺序合并，无其他并行集成时，两批均合入后为276、剩余741。实际合并前重算完整身份差集；如基线变化以现场集合为准，不机械断言数量。主负责隔离构建、来源片段/compile_guards、发布身份核验及正式合入，规划角色不执行。
4. P06下面9项已由主准备，不再派工；rewrite七项已在knowledge，不重复生产。P02仍按冻结23批顺序接续，本文件不改批次。

P01完整交付集合（component均为nginx）：

| module | name |
| --- | --- |
| ngx_http_upstream_module | upstream、server |
| ngx_http_upstream_hash_module | hash |
| ngx_http_upstream_ip_hash_module | ip_hash |
| ngx_http_upstream_keepalive_module | keepalive、keepalive_time、keepalive_timeout、keepalive_requests |
| ngx_http_upstream_least_conn_module | least_conn |
| ngx_http_upstream_random_module | random |
| ngx_http_upstream_zone_module | zone |

## P06剩余9个完整身份

```text
nginx/ngx_http_geo_module/geo
nginx/ngx_http_map_module/map
nginx/ngx_http_map_module/map_hash_max_size
nginx/ngx_http_map_module/map_hash_bucket_size
nginx/ngx_http_secure_link_module/secure_link
nginx/ngx_http_secure_link_module/secure_link_md5
nginx/ngx_http_secure_link_module/secure_link_secret
nginx/ngx_http_split_clients_module/split_clients
ngx_coolkit/ngx_coolkit_module/override_method
```

## 可复用验证与限制

在仓库根目录运行以下只读命令；发布校验已在本轮执行通过。它校验当前正式发布，不验证候审P01语义：

```sh
node --input-type=module <<'JS'
import {readFileSync as read} from 'node:fs';
import {validatePublication,validateCatalogScope} from './scripts/build.mjs';
const json=p=>JSON.parse(read(p,'utf8'));
const index=json('dist/knowledge/index.json');
validateCatalogScope(json('analysis/components.json'),json('analysis/directives/catalog.json'));
validatePublication(index,index.directives.map(x=>json('dist/knowledge/'+x.detail_path)),json('dist/knowledge/'+index.references_path));
console.log(index.release_id,index.directives.length,index.coverage.basic_verified_count);
JS
```

P01集合复核可直接执行，不生成文件：

```sh
node --input-type=module <<'JS'
import {readFileSync as read} from 'node:fs';
import assert from 'node:assert/strict';
const json=p=>JSON.parse(read(p,'utf8'));
const id=x=>[x.component,x.module,x.name].join('/');
const catalog=json('analysis/directives/catalog.json').directives;
const knowledge=new Set(json('knowledge/directives.json').map(id));
const draft=json('analysis/content/HTTP_UPSTREAM_BASIC.json');
const owners=new Set(['ngx_http_upstream_module','ngx_http_upstream_hash_module','ngx_http_upstream_ip_hash_module','ngx_http_upstream_keepalive_module','ngx_http_upstream_least_conn_module','ngx_http_upstream_random_module','ngx_http_upstream_zone_module']);
const expected=catalog.filter(x=>x.component==='nginx'&&owners.has(x.module));
assert.equal(new Set(draft.map(id)).size,draft.length);
assert.deepEqual(draft.map(id).sort(),expected.map(id).sort());
console.log({prepared:draft.length,remaining:expected.filter(x=>!knowledge.has(id(x))).map(id),alreadyIntegrated:draft.filter(x=>knowledge.has(id(x))).map(id)});
JS
```

未在已搜索的仓库文件及临时目录中找到保留的P01专用回放/隔离构建脚本；NOTES也没有完整可复制命令。不可声称旧命令已恢复。既有 `analysis/verify-reference-build.mjs` 可供主线程复用隔离目录、复制site/src、临时config/catalog/matrix及finally清理的实现方式；`node analysis/verify-reference-build.mjs` 是通用参考发布门禁，不会自动纳入P01。`node analysis/verify-build-gate.mjs --config project.config.json` 是通用失败门禁，也不是P01证明。本轮均未执行，因它们会写临时文件。后续由获准实施/主角色复用这些隔离机制纳入当前knowledge及已审草稿；不要在根目录执行 `npm run build` 充当隔离验收。

本次快照SHA256：

- catalog：`1a625dd29a400e23d49437082a895e7d4f37bab9bcd97c2e859415871531399c`
- knowledge：`086a64249f7b24df7cec17cb12cd2adccf95c898c69ce0da66d8be3c8d806152`
- P01 JSON：`a27c24d12f10d2f62c73cba6c4be034e770ad344e89193d5f6f109abb238be72`
- P01 NOTES：`7a7b35665303c11310001c0e736d3956380a457e0ff5f1f1c86378b6721d7b56`

边界：全部1017基础覆盖属于C02；Codex实际接入及手机验收已确认后移，不阻塞本轮内容交接。不新增草稿、不改knowledge/catalog/shared config/dist/审核记录、不重跑C01、不编译运行OpenResty、不创建嵌套线程。本文件只是状态和交接，不替代冻结方案或独立审核。
