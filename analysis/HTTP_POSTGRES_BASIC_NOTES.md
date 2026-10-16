# P23 PostgreSQL10 候选冻结

## 交付边界

本批仅新增analysis/content/HTTP_POSTGRES_BASIC.json与本NOTES。主已接管RDS JSON10/CSV6，四个RDS文件本角色不写；Drizzle12保持冻结。HTTP Lua71的L-R01及后续主修复不覆盖；本次只读核验其现场SHA为41329a44c5ab3d1b4a63e3591ce01f879c0f2e35c08c3cab733241d80bb72d7e，不将先前消息SHA当恢复依据。

catalog中ngx_postgres / ngx_postgres_module完整10身份，领取与隔离现场knowledge中该owner均为0，完整差集10，无重复。候选仅待独立语义审核，不代表已正式接入。

## 固定版本与冻结SHA

- JSON SHA256：`181216c2a7a7304a44f1760803a2fb5c4f33103c2c1992b9332f68b76dac6095`。
- ngx_postgres 1.0：`681980598529f67fcec5c7448452046764a68429`。
- Nginx：`e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`。
- OpenResty：`8c37412c31621225e7aa7e825b5b50106c9c71c4`。
- 文档为同一ngx_postgres SHA的README.md:26–164。固定发行util/mirror-tarballs:718–721仅取包/展开/改名，没有组件直接patch；没有下载发行包或运行来源生成器。

## 逐项真实配置与实现证据

| postgres_server | 50–55 | ngx_postgres_conf_server src/ngx_postgres_module.c:392–486 | src/ngx_postgres_upstream.c:40–129；src/ngx_postgres_upstream.c:332–384 |
| postgres_keepalive | 57–62 | ngx_postgres_conf_keepalive src/ngx_postgres_module.c:488–604 | src/ngx_postgres_module.c:196–206；src/ngx_postgres_upstream.c:120–126；src/ngx_postgres_upstream.c:264–330；src/ngx_postgres_keepalive.c:64–167；src/ngx_postgres_keepalive.c:184–258；src/ngx_postgres_handler.c:218–241 |
| postgres_pass | 64–69 | ngx_postgres_conf_pass src/ngx_postgres_module.c:606–681 | src/ngx_postgres_handler.c:41–150；src/ngx_postgres_handler.c:188–216；src/ngx_postgres_module.c:1294–1338；src/ngx_postgres_processor.c:40–110；src/http/ngx_http_core_module.c:1252–1262；src/http/ngx_http_core_module.c:1381–1383；src/http/ngx_http_upstream.c:805–819；src/ngx_postgres_upstream.c:153–167 |
| postgres_query | 71–77 | ngx_postgres_conf_query src/ngx_postgres_module.c:683–811 | src/ngx_postgres_module.c:176–194；src/ngx_postgres_handler.c:69–83；src/ngx_postgres_upstream.c:169–222；src/ngx_postgres_processor.c:231–283；src/ngx_postgres_processor.c:286–368；src/ngx_postgres_processor.c:447–491 |
| postgres_rewrite | 79–85 | ngx_postgres_conf_rewrite src/ngx_postgres_module.c:813–981 | src/ngx_postgres_module.c:214–220；src/ngx_postgres_rewrite.c:36–114；src/ngx_postgres_processor.c:389–444；src/ngx_postgres_processor.c:493–513；src/ngx_postgres_util.c:81–87；src/ngx_postgres_handler.c:353–367；src/ngx_postgres_output.c:546–574；src/http/ngx_http_request.h:78–144 |
| postgres_output | 87–93 | ngx_postgres_conf_output src/ngx_postgres_module.c:983–1021 | src/ngx_postgres_module.c:222–229；src/ngx_postgres_processor.c:255–260；src/ngx_postgres_processor.c:404–444；src/ngx_postgres_output.c:38–119；src/ngx_postgres_output.c:121–203；src/ngx_postgres_output.c:206–270；src/ngx_postgres_output.c:546–574 |
| postgres_set | 95–100 | ngx_postgres_conf_set src/ngx_postgres_module.c:1023–1160 | src/ngx_postgres_module.c:208–212；src/ngx_postgres_handler.c:171–184；src/ngx_postgres_processor.c:404–444；src/ngx_postgres_variable.c:155–288 |
| postgres_escape | 102–107 | ngx_postgres_conf_escape src/ngx_postgres_module.c:1166–1292 | src/ngx_postgres_util.c:318–406；src/ngx_postgres_escape.c:41–97；src/http/modules/ngx_http_rewrite_module.c:136–184；src/http/modules/ngx_http_rewrite_module.c:271–294 |
| postgres_connect_timeout | 109–114 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | src/ngx_postgres_handler.c:188–216；src/ngx_postgres_upstream.c:153–167；src/ngx_postgres_upstream.c:268–313；src/ngx_postgres_upstream.c:350–384；src/ngx_postgres_upstream.c:457–461；src/http/ngx_http_upstream.c:805–819；src/http/ngx_http_upstream.c:1555–1576；src/event/ngx_event_connect.c:34–37；src/http/ngx_http_upstream.c:1660–1667；src/ngx_postgres_processor.c:112–158；src/ngx_postgres_processor.c:203–228；src/ngx_postgres_processor.c:294–315；src/ngx_postgres_handler.c:247–280 |
| postgres_result_timeout | 116–121 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | src/ngx_postgres_handler.c:188–216；src/ngx_postgres_processor.c:231–283；src/ngx_postgres_processor.c:294–368；src/ngx_postgres_processor.c:447–491；src/ngx_postgres_handler.c:283–317；src/ngx_postgres_util.c:173–190 |

## 本域语义与文档边界

1. server经配置期ngx_parse_url和peer初始化，真实使用链到PQconnectStart/PQsetnonblocking；连接字符串显式sslmode=disable，Unix socket仍TODO，不能套用HTTP/Stream TLS指令。认证选项直接拼接而非逐参数传入，本批不读取真实配置或凭据。
2. keepalive默认10/single/ignore，与Drizzle实际multi/0不同。single池头复用，multi仅socket地址匹配，不包含数据库名或用户；ignore池满归还会淘汰缓存尾连接，reject检查active_conns并走503。重复检测以max_cached是否仍为10判定，不写成所有重复配置必报错。
3. pass通过clcf->handler绑定content；core 1381–1383与1252–1262提供执行阶段证据。本域拒绝subrequest_in_memory并丢弃请求体，变量目标仅查已登记upstream；共享初始化后覆盖自己的读写事件处理器。
4. query按方法优先、默认回退；PQsendQueryParams在binary_value分支的参数个数仍为0，不能宣传自动参数绑定。代码只消费一个PGresult；额外结果在ACK阶段报500。
5. rewrite先按条件首次出现顺序形成数组，各条件内按方法选规则，首个适用条件结束。不同于把每一配置行依次检查；SELECT不设置affected计数。普通错误状态在postgres_set和output前返回；=状态以负值保留正文，通过finalize→output_chain取绝对值发送。
6. output value/binary_value必须一行一列、非NULL非空；text以换行分隔并将NULL写为(null)；RDS有专用Content-Type，none仅跳过正文生成。本批不写RDS过滤器owner。
7. set按0基行列或列名提取；optional缺失呈not_found，required在实际执行提取时可改500，不保证已被错误状态重写跳过的路径仍执行。
8. escape把代码加入HTTP rewrite脚本，真实调用PQescapeString而非PQescapeStringConn；=只控制空字符串分支，not_found仍生成NULL。不作任意数据库编码下安全承诺，不把它当SQL标识符转义。
9. connect_timeout通过共享upstream timer挂载，新连接与复用返回NGX_AGAIN的路径均核定；本域PQconnectPoll/get_result负责清理。result_timeout在发送成功后挂一次，覆盖结果及结束确认等待，不是每次I/O刷新。

本批10项defaults均有核定依据；完整inheritance10项显式unverified，正文仅保留已核定局部merge事实。未执行Nginx/OpenResty、configure、libpq或数据库服务；源码/发行证据不等于编译或数据库集成测试通过。

## 实际补丁与快照验证

从固定Nginx git archive开始逐个实际应用34个发行patch，共142 hunk，offset/fuzz与既有审计一致，47个最终目标SHA匹配。12个Nginx引用片段中10保持，2变化均属connect_timeout：balancer_status_code新增特殊状态返回分支；upstream_timeout_fields先复制配置值到请求级字段，再令timer读取u->connect_timeout。该项明确verified_affected并绑定两份固定patch；其他9项为限定事实verified_unaffected，不推断整个共享运行时无补丁影响。

初次回放统计124引用；补入2份完整patch证据后126引用，源码片段未改，未无意义重复全盘补丁回放。全部新增patch引用的固定版本、原文、URL与EOF在最终隔离构建再次核对。

```json
{
  "patch": {
    "patches": 34,
    "hunks": 142,
    "final_hashes": 47,
    "references": 124,
    "nginx_slices": 12,
    "unchanged": 10,
    "changes": [
      {
        "name": "postgres_connect_timeout",
        "id": "implementation-6",
        "file": "src/http/ngx_http_upstream.c",
        "start_line": 1555,
        "end_line": 1576,
        "first_patch": "balancer_status_code"
      },
      {
        "name": "postgres_connect_timeout",
        "id": "implementation-8",
        "file": "src/http/ngx_http_upstream.c",
        "start_line": 1660,
        "end_line": 1667,
        "first_patch": "upstream_timeout_fields"
      }
    ],
    "moduleHashes": {}
  },
  "snapshot": {
    "component": "ngx_postgres",
    "revision": "681980598529f67fcec5c7448452046764a68429",
    "slices": 102,
    "files": {
      "src/ngx_postgres_module.c": "a89eb9be4154eb2efe3becbfb0333e7b22f291bda316cd26587781e9a3fa7951",
      "src/ngx_postgres_upstream.c": "2caf8a59c188ad84047661f680699fe4292eb486b0b0318687499b6e8a9a416c",
      "README.md": "b3ec75a3299e8a7c079f5675ee8f6217c143d95e799643cd392279d8f8e91ccf",
      "src/ngx_postgres_keepalive.c": "4ca00c361099c938e50c85bc2a884ac3e6f7aba1fbccc7d96c5d32f87a464f2f",
      "src/ngx_postgres_handler.c": "454d573fb951bc453a3812ed3e0bfbc6c105327a30802ead739d13da7458fbe2",
      "src/ngx_postgres_processor.c": "489b4cd96c5287c453bb6b280eb4ca309918dd4a4a4a8961c1967eead4a3e78a",
      "src/ngx_postgres_rewrite.c": "21d4408c2fb371aa4482b9a5913e10652ae2e1bcf35b936de61c4f1511fed021",
      "src/ngx_postgres_util.c": "1a6ae1ec712d0dca71dd4f10c45be37b97283db0bc29d0c961600074e3fdac23",
      "src/ngx_postgres_output.c": "08170a12c1b31ac992633dcc1e7dcf3ccdffae19d9c714a55718628b2b4312e4",
      "src/ngx_postgres_variable.c": "95b833cc7a4eb1bba8277f85d52e72ad0b2e97e16a157e9f39931af395e8abae",
      "src/ngx_postgres_escape.c": "3793560b0473e632be7c8bf76143a5a37bea58f5b8d1d0f4709870fd92069456"
    }
  }
}
```

本组件102个片段、11文件在独立git archive中核对字节与行范围，末尾换行不当作额外物理行。

## 真实隔离构建结果

从现场820基线读取并断言knowledge数量与当前index一致，完整owner10仅加入临时knowledge；根脚本以临时project.config运行，未改根脚本/配置或触发根build。内置publication校验及本批正文、语法、事实桶、回调、阶段、guards、来源固定SHA/原文/URL断言全部通过。

```json
{
  "baseline": "1.27.1.1-513d4b289e7a100d",
  "baseline_count": 820,
  "release_id": "1.27.1.1-e799de83feed3fe2",
  "coverage": {
    "inventory_complete": true,
    "registration_count": 1017,
    "basic_verified_count": 830,
    "deep_verified_count": 0,
    "gaps": [
      "部分 Nginx 指令的功能补丁影响尚未逐项核定",
      "187 个注册项尚未完成功能说明",
      "部门真实脱敏样例待提供",
      "Codex 宿主实际接入与内网站点可达性待验收"
    ]
  },
  "new_verified": 10,
  "checked_sources": 156,
  "unchanged_details": 1007,
  "unchanged_references": 8,
  "current_unchanged": true,
  "knowledge_unchanged": true
}
```

1007条其他详情及8个参考页除release_id外保持；隔离窗口根knowledge与current字节保持。临时补丁、快照、build目录均finally清理。没有正式接入、共享写入、下载或服务运行。
