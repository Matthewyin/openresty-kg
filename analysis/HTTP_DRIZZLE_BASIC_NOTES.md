# P23 Drizzle12 候选冻结

## 边界与身份

仅新增本批JSON与NOTES。catalog中drizzle-nginx-module / ngx_http_drizzle_module完整12项，与隔离基线697无交集。P23已由主重新分工：本角色仅Drizzle12与Postgres10；RDS JSON10/CSV6四文件不创建、不修改。HTTP Lua71与Stream Lua49保持冻结，未经finding不改。

## 固定来源

- Drizzle 0.1.12：`fb6cf255d91135e18145a98a93947ead4e703b68`。
- Nginx：`e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`。
- OpenResty：`8c37412c31621225e7aa7e825b5b50106c9c71c4`。
- 文档为该Drizzle SHA的README.markdown，不使用最新网页推断固定版本。发行处理util/mirror-tarballs:614–617未直接应用组件patch。
- JSON SHA256：`0b3516f17ffe5e3a1d4f8eb217dbc7672852b1167044281cfc0952a5a1b22d1b`。

## 逐项入口与使用证据

| drizzle_server | 54–59 | ngx_http_upstream_drizzle_server src/ngx_http_drizzle_upstream.c:84–299 | src/ngx_http_drizzle_upstream.c:14–16；src/ngx_http_drizzle_upstream.c:301–398；src/ngx_http_drizzle_upstream.c:668–696；src/ngx_http_drizzle_processor.c:180–228 |
| drizzle_keepalive | 61–66 | ngx_http_upstream_drizzle_keepalive src/ngx_http_drizzle_keepalive.c:25–129 | src/ngx_http_drizzle_upstream.c:36–78；src/ngx_http_drizzle_keepalive.c:160–243；src/ngx_http_drizzle_upstream.c:576–637；src/ngx_http_drizzle_handler.c:191–207 |
| drizzle_query | 68–74 | ngx_http_drizzle_query src/ngx_http_drizzle_module.c:333–450 | src/ngx_http_drizzle_module.c:183–200；src/ngx_http_drizzle_module.c:250–289；src/ngx_http_drizzle_upstream.c:471–525；src/ngx_http_drizzle_handler.c:74–85；src/ngx_http_drizzle_processor.c:180–228 |
| drizzle_dbname | 76–82 | ngx_http_drizzle_set_complex_value_slot src/ngx_http_drizzle_module.c:292–330 | src/ngx_http_drizzle_upstream.c:448–469；src/ngx_http_drizzle_upstream.c:668–678；src/ngx_http_drizzle_keepalive.c:160–243 |
| drizzle_pass | 84–89 | ngx_http_drizzle_pass src/ngx_http_drizzle_module.c:453–523 | src/ngx_http_drizzle_handler.c:44–146；src/ngx_http_drizzle_handler.c:157–189；src/ngx_http_drizzle_upstream.c:1012–1054；src/ngx_http_drizzle_processor.c:37–127；src/ngx_http_drizzle_output.c:110–125；src/ngx_http_drizzle_output.c:224–245 |
| drizzle_connect_timeout | 91–97 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | src/ngx_http_drizzle_handler.c:157–189；src/ngx_http_drizzle_handler.c:214–280；src/ngx_http_drizzle_processor.c:37–127；src/ngx_http_drizzle_upstream.c:66–75；src/ngx_http_drizzle_util.c:729–743 |
| drizzle_send_query_timeout | 99–105 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | src/ngx_http_drizzle_handler.c:157–189；src/ngx_http_drizzle_handler.c:214–280；src/ngx_http_drizzle_processor.c:37–127；src/ngx_http_drizzle_upstream.c:66–75；src/ngx_http_drizzle_processor.c:180–228 |
| drizzle_recv_cols_timeout | 107–113 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | src/ngx_http_drizzle_handler.c:157–189；src/ngx_http_drizzle_handler.c:214–280；src/ngx_http_drizzle_processor.c:37–127；src/ngx_http_drizzle_upstream.c:66–75；src/ngx_http_drizzle_processor.c:305–339 |
| drizzle_recv_rows_timeout | 115–121 | ngx_conf_set_msec_slot src/core/ngx_conf_file.c:1260–1287 | src/ngx_http_drizzle_handler.c:157–189；src/ngx_http_drizzle_handler.c:214–280；src/ngx_http_drizzle_processor.c:37–127；src/ngx_http_drizzle_upstream.c:66–75；src/ngx_http_drizzle_processor.c:394–424；src/ngx_http_drizzle_processor.c:494–512 |
| drizzle_module_header | 123–129 | ngx_conf_set_flag_slot src/core/ngx_conf_file.c:1026–1062 | src/ngx_http_drizzle_output.c:21–31；src/ngx_http_drizzle_output.c:224–245 |
| drizzle_buffer_size | 131–137 | ngx_conf_set_size_slot src/core/ngx_conf_file.c:1198–1225 | src/ngx_http_drizzle_output.c:596–612；src/ngx_http_drizzle_output.c:662–692 |
| drizzle_status | 139–144 | ngx_http_drizzle_enable_status src/ngx_http_drizzle_module.c:560–569 | src/ngx_http_drizzle_handler.c:396–520；src/ngx_http_drizzle_handler.c:530–636；src/ngx_http_drizzle_handler.c:648–669 |

## 语义实证与限制

- keepalive初始化single=0，实际默认multi；README声称single，不照搬。multi仅按socket地址匹配，不核dbname/user；dbname动态值只用于新连接。
- SQL按方法匹配后回落默认查询；方法集合与默认查询只在子层二者均为空时整组继承。变量SQL不是参数绑定或自动转义。
- send/cols/rows定时器在进入对应等待阶段时挂载，不按每次I/O重置；引用明确保留#if 0上下文，不把禁用事件注册当活代码。
- pass经本域dbd初始化与事件处理器输出RDS，status遍历HTTP main upstream的进程本地计数；均为content入口。buffer_size可为完整RDS原子扩容，不是结果集硬上限。
- drizzle_dbname没有独立README段，采用真实回调、merge与新连接/缓存使用证据。connect_timeout文档语法误写connect_time，按真实注册名。
- defaults未核实2项；完整继承规则12项明确unverified，正文已核定的局部merge行为仍保留证据。不运行数据库、Nginx/OpenResty，不读取现场认证信息。源码核定不等于本机可编译或数据库集成已验收。

## 实际补丁与固定快照

固定Nginx archive上逐个实际应用34个发行patch，共142 hunk；逐步核对offset/fuzz和47个最终目标SHA。6个引用Nginx setter片段全部保持；结论仅覆盖本批事实，不扩大到所有运行路径。Drizzle固定archive的101个片段、8个来源文件逐字节/行范围核对，真实EOF均合法；未下载发行tarball。

```json
{
  "patch": {
    "patches": 34,
    "hunks": 142,
    "final_hashes": 47,
    "references": 119,
    "nginx_slices": 6,
    "unchanged": 6,
    "changes": [],
    "moduleHashes": {}
  },
  "snapshot": {
    "component": "drizzle-nginx-module",
    "revision": "fb6cf255d91135e18145a98a93947ead4e703b68",
    "slices": 101,
    "files": {
      "src/ngx_http_drizzle_module.c": "240a1b7c1e341d3df00774429cb42c508e47c24c01d862ccf814130dc0538f8f",
      "src/ngx_http_drizzle_upstream.c": "489aada3b4445805d8cf5bab48384528666064c5a4e8441c84a72c907139918a",
      "src/ngx_http_drizzle_processor.c": "811ea48577f4b2fd8ac2f4bd82299b4d1ac5eaea71c45ac09adc5aa6943b9743",
      "README.markdown": "289ed65b32feff90cb0247fbd7ab6c0e1dc95209c580797156a6da25131ad1e3",
      "src/ngx_http_drizzle_keepalive.c": "d02b94c4cd02b30c63cd558fc1f237522c438ff935429f1c60570218d92bb451",
      "src/ngx_http_drizzle_handler.c": "26a51889f1d8fc0a14e748f5e0594692e11bb05b0065b91df7e4f849bf21569b",
      "src/ngx_http_drizzle_output.c": "de82a992ba0843fe0bf54950426dc83b9454fb367d46735833055fe242153802",
      "src/ngx_http_drizzle_util.c": "48abf9f33b2e68a8039c15dedda747ffba66ea0eabb54f4ca009c28561b059f0"
    }
  }
}
```

## 隔离构建

首轮发现草稿module-owner与catalog自动注入同名ID冲突，仅把本批显式ID改成lifecycle-owner，未改脚本/catalog。修复后真实隔离build和内置publication校验通过；本批正文/事实桶、回调、阶段、guards、来源固定SHA、代码与URL逐项断言通过。

```json
{
  "baseline": "1.27.1.1-3131d2594e9a02cd",
  "baseline_count": 697,
  "release_id": "1.27.1.1-4ccc760a4c8839db",
  "coverage": {
    "inventory_complete": true,
    "registration_count": 1017,
    "basic_verified_count": 709,
    "deep_verified_count": 0,
    "gaps": [
      "部分 Nginx 指令的功能补丁影响尚未逐项核定",
      "308 个注册项尚未完成功能说明",
      "部门真实脱敏样例待提供",
      "Codex 宿主实际接入与内网站点可达性待验收"
    ]
  },
  "new_verified": 12,
  "checked_sources": 155,
  "unchanged_details": 1005,
  "unchanged_references": 8,
  "current_unchanged": true,
  "knowledge_unchanged": true
}
```

1005条其他详情及8个参考页除release_id外保持；隔离窗口根current与knowledge字节未变。补丁回放、快照及build临时目录均在finally清理。未执行根build，未改正式发布；候选待独立语义审核。
