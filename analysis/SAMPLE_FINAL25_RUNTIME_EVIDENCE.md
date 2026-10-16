# Final25：21个Nginx身份实施证据

日期：2026-10-14。实施者最终证据交付；最终发布及主线程验收结果见末尾附注，本文件不替代独立审核报告。VTS四项及extensions.json已移交主线程，另见SAMPLE_FINAL25_VTS_EVIDENCE.md；移交时该文件SHA-256仍为 `38524066bf9998aec06d372a04d18753c60aa321173477e1375aac65a3e692d9`。

## 深度交互：完成口径

目标为真实消费、条件、失败出口，不凑deep。进程、请求、会话分别取证；注册/配置生成不单独作为runtime。基线 `1.27.1.1-06a6394fb516a4bb`，基线19 deep事实完整保留；中间e1d693为33 deep。最终发布为 `1.27.1.1-1c2ead24459672e6`，当前公开索引为44 deep，不把基线或中间状态描述为当前dist。统一测试、构建与原样例/25项UI验收已由主线程报告通过。实施者不联网、不读私有配置、不build、不写src/site/schema/test/dist。

## 直接执行：修改前冻结

knowledge/directives.json SHA-256：`a2666ba27952f66a749ae9ab1557d4d13e34e529976b9137ed7cf05570676b82`。主线程修改前fixture非目标摘要：`928b9c89873daa84f1a9dcb284839463ec5eeb6c940d1ad5f6e5e83f7032f7b5`。旧摘要由首次修改前对象计算，非改后反推。

- nginx：`e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`。
- nginx-docs：`e8b581903e9d41252720053311cea687a5671674`。
- openresty：`8c37412c31621225e7aa7e825b5b50106c9c71c4`。

| 精确身份 | 旧对象SHA-256 | 旧evidence数量 / SHA-256 | 旧patch状态 |
| --- | --- | --- | --- |
| nginx--ngx_http_limit_conn_module--limit_conn_zone | 6c437c27a940c38fb92c6fb27f870d11f75988fa85dca0b818ea8a154b3fbcf0 | 8 / 186932af00c462a202a168979d85501855b886a5041f6fada7f6264121a69798 | verified_unaffected |
| nginx--ngx_http_limit_conn_module--limit_conn | 3a8e7a2c7fb9a69a07d9cdae41cb8f754ff964cedae37e7089ad760661767149 | 8 / 56cd7b436f65afaa550ca9087ae9d8533deb3eee90b01389edc782de2c616e8e | verified_unaffected |
| nginx--ngx_http_proxy_module--proxy_limit_rate | d5aa23c1437d75398b3042a489c9f3029476364646682ea6f7e82ab4e1571b6b | 11 / a486c4d735258e0e492c53d428bd514c45d2300a7ad7c2867a77496793872d36 | verified_unaffected |
| nginx--ngx_http_log_module--log_format | 64f76c12baf60b4d5d7919f16f44d593727d91a766809addf94382e5a1b60159 | 8 / 066d8ef9077bb6ada487433fed28ae9d55f6419ba4bb5ac4218c18763d768a93 | verified_affected |
| nginx--ngx_http_log_module--access_log | 80e715df2c7ab617146e3352450b53555dceed58d9f7a402b574f90236b88b85 | 11 / d0f38d5769fcb5e30b4b6f02f9f46507b9b17b286ab7ab5e0970d2633b01c2f3 | verified_affected |
| nginx--ngx_stream_log_module--log_format | ad10b057534fa02a2efc14eb371893252076992e3b5194a63ea5419a3bde2b4f | 6 / 842c40c4c6c0ff2915d465085a76cb7ad8b862fbdf483e88e4e7d54c00e3272f | verified_unaffected |
| nginx--ngx_stream_log_module--access_log | 1c59824001fb8b40fe641645e72a3370a37a5a9ca39c62d0703ed120cdcc64fe | 7 / f27fb0a0c9ddc884238747ff8cc38ea73ab4b3c06eff4e7b446b0bb3ce0c573e | verified_unaffected |
| nginx--ngx_errlog_module--error_log | 66005b608575a6fa7a283441b2cf2b0553b6362622dc89c3d5d3769338158a8f | 18 / 97b61f8d33141f1fd7d11b138d6a29c029a1bfae5c5f31dcfb6fdc9905d85fea | verified_affected |
| nginx--ngx_http_core_module--error_log | 4b6cc4f06778fef2222b47fd0ff9f511e1cd4b630d99f501232b52d473b4b6bc | 14 / b37d969ecca9e5803c67ac558ddc22a52afa2e71ec2c489761b4c6f1f68bbe92 | verified_affected |
| nginx--ngx_stream_core_module--error_log | 7bc7dedff7d0d7e58f4878c4fc89ededdff7f506a680bd887cb7310c1089c4da | 6 / ea7f65ba6f49fc8772b912c61373710907deaeaa034d6bffdb161eca0dfb6c56 | verified_affected |
| nginx--ngx_core_module--pid | 319edbfcb83a24065fabf275116fc84fc3a0de9635e7972bbe60d5937ae607b8 | 15 / b80387e8e9b30dd653d60aa2082cb9887bceef85c6d873b561c9d8fbfdc0ce62 | verified_unaffected |
| nginx--ngx_http_core_module--listen | 45fe69bb7cd449e5b0be83ddde884a6bb2215ff8dd69926a07676e78e29b5bf7 | 9 / a11e55182eebb8093f3ae7d005a87cf13d9c63252de06e41e4f8cb5681310fb8 | verified_unaffected |
| nginx--ngx_http_core_module--server | 55b8dc223549fc5d95ad694deb883f4a55326f893577f5798f0c51338e436471 | 9 / 50ed252e1b2f4781e846cb563d93b5793e486404a99b24da6c696bcee33fd2db | verified_unaffected |
| nginx--ngx_http_core_module--location | a588d3f63dcef2bf486c6d4881526740a260417e723f725b062ceb7fe82f7d67 | 10 / e3caba8fdfda94651a24b5cc1222f26aa92daf9bd04b76d21f6e9b190c872162 | verified_unaffected |
| nginx--ngx_stream_core_module--listen | 9aba092ad90f1648c03edc93abd794c9c4dc270810ad410123d9572d5421c504 | 5 / 23d9e82e1f2d71dd339b1e089a0e4342686a15a689c4cfdd0c19ddaa5be39bb9 | verified_unaffected |
| nginx--ngx_stream_core_module--server | d9c249efaaf9e7eeea9331bdbcd61035a9a2a4a38df3fbe210faf76f0215f8b3 | 3 / 0c6c2bc4bcf071b2541f02c0a9684eacc168ea010b9872b01020542749f91e29 | verified_unaffected |
| nginx--ngx_http_core_module--client_max_body_size | d76f94478f2ad56ba90ddf02d449db544162f92edc8fbffc5ff7dcc1b554f22d | 6 / e66fd8c397d46ef798140831e9095242de8f954c39615a9524d0d364444b57fc | verified_unaffected |
| nginx--ngx_http_core_module--keepalive_timeout | ba2043f4b7d67d95af9ae58d139b853af34d7017fb53a4984c37bed98d9d175c | 7 / 8aea88aef2b0fb09543ee1388d4b71ef29b0010a0bfe1fc8758045e8b1d541cb | verified_unaffected |
| nginx--ngx_http_core_module--sendfile | 91cbcc27acfda8bdb2bc20ed4a644fdf0e3c33c837478db42b0f7dad5f6eda24 | 5 / 90eeb39b8c9c7f1100a77768135fa5b049c5d9d5561b9e34f4434b6fbab9130c | verified_unaffected |
| nginx--ngx_http_core_module--default_type | 753d61b7f3135cf52c82a1e06a37fb6522fbe4b458b6d7f4adb200be0a54fca1 | 5 / 54df1afe2ee686932bada588b9ba2b58730cab17a1ef5644f606c6e56f165dea | verified_unaffected |
| nginx--ngx_http_core_module--server_tokens | 225748367b727c6dd4c44b8ca9ee319c4e9f1fcc475d4a6536ab7412206d5677 | 13 / 768eaf5239cf526b6192ca449430bed5f40b637037aa37e502232102791f54c8 | verified_affected |

## 最终稳定交接

已落盘并冻结21/21个Nginx身份，主线程已完成最终发布及测试/UI验收。下表已逐项对齐冻结knowledge；对象SHA-256按JSON.stringify完整curated对象计算，不是知识文件字节SHA。

本批最终合计：105步、310条新增evidence、311个直接代码refs、22个独立文档refs，总refs为333。refs按21个身份各自的runtime并集累加，不是跨身份全局去重，也不是把每步重复引用再次累加。HTTP access_log为12个代码refs，server_tokens为22个代码refs；client_max_body_size、server_tokens、HTTP access_log三项修订后的对象SHA均以下表最终值为准。修改前冻结表及明确标为历史的交接记录不作为最终统计。

| 精确身份 | 步数 | 代码refs | 文档refs | 新evidence | patch变化 | 最终冻结对象SHA-256 |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| nginx--ngx_http_limit_conn_module--limit_conn_zone | 5 | 11 | 1 | 10 | verified_unaffected → verified_unaffected | bd0d92952ef190e05db799533c5c4b8af221579865e7106c48d7090c3215e45a |
| nginx--ngx_http_limit_conn_module--limit_conn | 5 | 11 | 1 | 10 | verified_unaffected → verified_unaffected | 90c5c9045793ff53a0322c2355b62bfda2b247ec1bd1899126970c0d208ac770 |
| nginx--ngx_http_proxy_module--proxy_limit_rate | 5 | 19 | 1 | 18 | verified_unaffected → verified_unaffected | 2f16a55417e14a297ae6c5b1a8592bf8c15c10f5c3b1622dc801c23c3786b36c |
| nginx--ngx_http_log_module--log_format | 4 | 13 | 1 | 13 | verified_affected → verified_affected | a4eceae5db720d6e48b24dbafa1f8820575df9921c0b554541db66d4595c9fb2 |
| nginx--ngx_http_log_module--access_log | 5 | 12 | 1 | 13 | verified_affected → verified_affected | 399a33f88268885972911446c8ac4e8b4b01f0fdb08309b8136e96caf0915add |
| nginx--ngx_stream_log_module--log_format | 4 | 11 | 1 | 11 | verified_unaffected → verified_unaffected | 25e0ee596fb60b746d9829e87b2ab1ff15b6c65d9a8247767422d11e0a3f137d |
| nginx--ngx_stream_log_module--access_log | 5 | 11 | 1 | 12 | verified_unaffected → verified_unaffected | 45cc73af005916f9cf19fb50d2dc5f0ea26ca4f22db21affcbbdbe226a8ebf90 |
| nginx--ngx_errlog_module--error_log | 5 | 13 | 1 | 13 | verified_affected → verified_affected | 0ac7dd4e7dcae3834c993f015043c22d99b7799a5a38e2af4384e96887f62351 |
| nginx--ngx_http_core_module--error_log | 5 | 17 | 1 | 18 | verified_affected → verified_affected | 98cf399f02cbb5fb70701ac1e3be4453bd4f00770cab179349a497ed0535c448 |
| nginx--ngx_stream_core_module--error_log | 5 | 15 | 1 | 16 | verified_affected → verified_affected | af5fdbd19670ffca61e9fffacde6231e7b4505a2a392b6ca7bf0496cb86dd5a4 |
| nginx--ngx_core_module--pid | 6 | 16 | 1 | 15 | verified_unaffected → verified_unaffected | 8db310ff9718c5692c8f0cfebe8645e2db011114024cf53b6effb513b7bb1942 |
| nginx--ngx_http_core_module--listen | 6 | 23 | 1 | 24 | verified_unaffected → verified_affected | 38c7c83d3fa8e1d5dcfa21d39236b65131b987cc640009a654bcd3ab9bbc164b |
| nginx--ngx_http_core_module--server | 5 | 15 | 2 | 15 | verified_unaffected → verified_unaffected | 579e3b0a6404fdcbac1a0057044ba8e833ac1377e6c669ada494120b3cb33bd3 |
| nginx--ngx_http_core_module--location | 6 | 15 | 1 | 14 | verified_unaffected → verified_unaffected | 5aaef00dfcb384f50872917826bcd982875d4cf54621284416390da75dda23ab |
| nginx--ngx_stream_core_module--listen | 6 | 24 | 1 | 25 | verified_unaffected → verified_affected | ee9ced4ac9609c1279cbcc68b7ae70caa258362085011aa3da8d2fdc909f738d |
| nginx--ngx_stream_core_module--server | 5 | 11 | 1 | 12 | verified_unaffected → verified_unaffected | 40e09ff4cefbc97fef997fc8a807a7c597a56897b61dee133f5f22e425a2c22e |
| nginx--ngx_http_core_module--client_max_body_size | 4 | 15 | 1 | 15 | verified_unaffected → verified_unaffected | e9389dbcf3904186e04e1de5d3fcea0f3978794c2e9911679830587f39ddcc0a |
| nginx--ngx_http_core_module--keepalive_timeout | 6 | 13 | 1 | 13 | verified_unaffected → verified_unaffected | aa0ca3184008e40e8800f586835569635840e9a830f4cc442a7524fde8b54336 |
| nginx--ngx_http_core_module--sendfile | 5 | 19 | 1 | 19 | verified_unaffected → verified_unaffected | e6c50343c7a62e48ec07f6221d750f80c23bea434b1eb81bb4bed554e09b9b2c |
| nginx--ngx_http_core_module--default_type | 3 | 5 | 1 | 5 | verified_unaffected → verified_unaffected | 0f7e6ece68fab042ab0096756ed51edc8bd8e586635753b721175bda814198fd |
| nginx--ngx_http_core_module--server_tokens | 5 | 22 | 1 | 19 | verified_affected → verified_affected | fdff998f93db7a1662ea35280c7d72a6b733548ef264267737fd8cfbd134573b |

### B3 / nginx--ngx_http_limit_conn_module--limit_conn_zone

限定 HTTP preaccess 中已关联 limit_conn 的共享区：请求 key 求值、共享节点计数与请求池清理；不是全部 TCP socket 统计。

1. 条件：请求进入已注册的 preaccess handler；main 已有状态时跳过。动作/出口：generic phase 实际调用 handler；已处理返回 DECLINED，不重复计数。对 limits 中每个 zone 取出其 ctx；复杂值失败返回500，空 key 跳过，超过255字节记录错误并跳过，不是拒绝或截断。

   直接源码：`implementation-4` (nginx:src/http/modules/ngx_http_limit_conn_module.c:743–758)；`runtime-generic-phase` (nginx:src/http/ngx_http_core_module.c:897–917)；`runtime-limit-key` (nginx:src/http/modules/ngx_http_limit_conn_module.c:194–220)。

2. 条件：非空且不超长的 key 到达共享区。动作/出口：以 CRC32 和完整 key 查红黑树，在共享锁内查找/建立节点；新节点置1、命中且未达限额才加1。slab 分配失败先解锁并回滚前面 zone；dry-run 标记后继续框架，否则返回配置状态码。

   直接源码：`runtime-limit-node` (nginx:src/http/modules/ngx_http_limit_conn_module.c:222–263)；`runtime-limit-lookup` (nginx:src/http/modules/ngx_http_limit_conn_module.c:353–388)；`runtime-limit-rollback` (nginx:src/http/modules/ngx_http_limit_conn_module.c:421–433)；`runtime-limit-reject` (nginx:src/http/modules/ngx_http_limit_conn_module.c:264–287)；`runtime-limit-cleanup` (nginx:src/http/modules/ngx_http_limit_conn_module.c:392–433)；`runtime-generic-phase` (nginx:src/http/ngx_http_core_module.c:897–917)。

3. 条件：已有节点计数达到本 zone 限额。动作/出口：先解锁并记录限额事件，回滚本请求先前计数；dry-run 返回 DECLINED 并标记模拟拒绝，正常拒绝返回 status_code，由框架 finalize，不保证最终内容或状态完全由此模块决定。

   直接源码：`runtime-limit-reject` (nginx:src/http/modules/ngx_http_limit_conn_module.c:264–287)；`runtime-limit-rollback` (nginx:src/http/modules/ngx_http_limit_conn_module.c:421–433)；`runtime-generic-phase` (nginx:src/http/ngx_http_core_module.c:897–917)；`runtime-limit-cleanup` (nginx:src/http/modules/ngx_http_limit_conn_module.c:392–433)。

4. 条件：节点计数成功后。动作/出口：解锁并注册请求池 cleanup，保存 zone/node；cleanup 分配失败直接返回500，该分支没有即时撤销刚增加计数，不能声称所有内存失败都完整回滚。正常完成返回 DECLINED。

   直接源码：`runtime-limit-cleanup-install` (nginx:src/http/modules/ngx_http_limit_conn_module.c:289–308)；`runtime-generic-phase` (nginx:src/http/ngx_http_core_module.c:897–917)。

5. 条件：已注册 cleanup 且请求池被销毁，或前述 rollback 显式调用。动作/出口：请求结束销毁池实际执行 cleanup；共享锁内减1，为0则删节点并 slab free。cleanup_all 只处理链头连续的本模块 cleanup，不清理其他请求或销毁整个共享区。

   直接源码：`runtime-request-pool-destroy` (nginx:src/http/ngx_http_request.c:3786–3789)；`runtime-pool-cleanup-consume` (nginx:src/core/ngx_palloc.c:53–59)；`runtime-limit-cleanup` (nginx:src/http/modules/ngx_http_limit_conn_module.c:392–433)。

独立固定文档：`official-doc` (nginx-docs:xml/en/docs/http/ngx_http_limit_conn_module.xml:165–217)。

补丁范围：final25/B3新增范围为preaccess key/共享节点/cleanup与框架实际调用；34项补丁不直接改这些所选分支，不扩大为完整响应或公共错误日志无影响。 B3-R1–R4最小修订：各步补齐计数比较/cleanup/generic-phase、非缓冲return、读handler和read事件安装、完成外层peer/NGX_THREADS writing条件；公式明确括号。新增片段重核34补丁无直接改写，不包含timeout赋值。

旧patch完整冻结对象：

```json
{
  "status": "verified_unaffected",
  "note": "固定发行补丁回放后核对所引注册、配置入口与使用片段；仅核本条所述本地判定，不据此保证后续响应链或其他模块不受补丁影响。",
  "source_ids": [
    "registration",
    "configuration-definition",
    "module-owner",
    "implementation-0",
    "implementation-1",
    "implementation-2",
    "implementation-3",
    "implementation-4",
    "official-doc",
    "distribution-processing"
  ]
}
```

### B3 / nginx--ngx_http_limit_conn_module--limit_conn

限定 HTTP preaccess 并发请求检查：多个共享区逐项计数、拒绝或 dry-run、回滚与请求结束清理；HTTP/2、HTTP/3并发请求按独立请求计数，不表示全部连接。

1. 条件：请求进入已注册的 preaccess handler；main 已有状态时跳过。动作/出口：generic phase 实际调用 handler；已处理返回 DECLINED，不重复计数。对 limits 中每个 zone 取出其 ctx；复杂值失败返回500，空 key 跳过，超过255字节记录错误并跳过，不是拒绝或截断。

   直接源码：`implementation-4` (nginx:src/http/modules/ngx_http_limit_conn_module.c:743–758)；`runtime-generic-phase` (nginx:src/http/ngx_http_core_module.c:897–917)；`runtime-limit-key` (nginx:src/http/modules/ngx_http_limit_conn_module.c:194–220)。

2. 条件：非空且不超长的 key 到达共享区。动作/出口：以 CRC32 和完整 key 查红黑树，在共享锁内查找/建立节点；新节点置1、命中且未达限额才加1。slab 分配失败先解锁并回滚前面 zone；dry-run 标记后继续框架，否则返回配置状态码。

   直接源码：`runtime-limit-node` (nginx:src/http/modules/ngx_http_limit_conn_module.c:222–263)；`runtime-limit-lookup` (nginx:src/http/modules/ngx_http_limit_conn_module.c:353–388)；`runtime-limit-rollback` (nginx:src/http/modules/ngx_http_limit_conn_module.c:421–433)；`runtime-limit-reject` (nginx:src/http/modules/ngx_http_limit_conn_module.c:264–287)；`runtime-limit-cleanup` (nginx:src/http/modules/ngx_http_limit_conn_module.c:392–433)；`runtime-generic-phase` (nginx:src/http/ngx_http_core_module.c:897–917)。

3. 条件：已有节点计数达到本 zone 限额。动作/出口：先解锁并记录限额事件，回滚本请求先前计数；dry-run 返回 DECLINED 并标记模拟拒绝，正常拒绝返回 status_code，由框架 finalize，不保证最终内容或状态完全由此模块决定。

   直接源码：`runtime-limit-reject` (nginx:src/http/modules/ngx_http_limit_conn_module.c:264–287)；`runtime-limit-rollback` (nginx:src/http/modules/ngx_http_limit_conn_module.c:421–433)；`runtime-generic-phase` (nginx:src/http/ngx_http_core_module.c:897–917)；`runtime-limit-cleanup` (nginx:src/http/modules/ngx_http_limit_conn_module.c:392–433)。

4. 条件：节点计数成功后。动作/出口：解锁并注册请求池 cleanup，保存 zone/node；cleanup 分配失败直接返回500，该分支没有即时撤销刚增加计数，不能声称所有内存失败都完整回滚。正常完成返回 DECLINED。

   直接源码：`runtime-limit-cleanup-install` (nginx:src/http/modules/ngx_http_limit_conn_module.c:289–308)；`runtime-generic-phase` (nginx:src/http/ngx_http_core_module.c:897–917)。

5. 条件：已注册 cleanup 且请求池被销毁，或前述 rollback 显式调用。动作/出口：请求结束销毁池实际执行 cleanup；共享锁内减1，为0则删节点并 slab free。cleanup_all 只处理链头连续的本模块 cleanup，不清理其他请求或销毁整个共享区。

   直接源码：`runtime-request-pool-destroy` (nginx:src/http/ngx_http_request.c:3786–3789)；`runtime-pool-cleanup-consume` (nginx:src/core/ngx_palloc.c:53–59)；`runtime-limit-cleanup` (nginx:src/http/modules/ngx_http_limit_conn_module.c:392–433)。

独立固定文档：`official-doc` (nginx-docs:xml/en/docs/http/ngx_http_limit_conn_module.xml:56–109)。

补丁范围：final25/B3新增范围为preaccess key/共享节点/cleanup与框架实际调用；34项补丁不直接改这些所选分支，不扩大为完整响应或公共错误日志无影响。 B3-R1–R4最小修订：各步补齐计数比较/cleanup/generic-phase、非缓冲return、读handler和read事件安装、完成外层peer/NGX_THREADS writing条件；公式明确括号。新增片段重核34补丁无直接改写，不包含timeout赋值。

旧patch完整冻结对象：

```json
{
  "status": "verified_unaffected",
  "note": "固定发行补丁回放后核对所引注册、配置入口与使用片段；仅核本条所述本地判定，不据此保证后续响应链或其他模块不受补丁影响。",
  "source_ids": [
    "registration",
    "configuration-definition",
    "module-owner",
    "implementation-0",
    "implementation-1",
    "implementation-2",
    "implementation-3",
    "implementation-4",
    "official-doc",
    "distribution-processing"
  ]
}
```

### B3 / nginx--ngx_http_proxy_module--proxy_limit_rate

限定启用上游响应缓冲时的 event_pipe 读取限速：每请求的上游读取额度、延迟事件与错误结束；不是客户端下行限速或全局总限额。

1. 条件：响应未走非缓冲分支，进入 event_pipe 设置。动作/出口：非缓冲分支另装 handler；缓冲路径把 proxy limit_rate 复杂值求为 p.limit_rate，常量直接取值，缺值/求值失败/非法大小回退0，非法大小记录错误；0不启用读取限速。

   直接源码：`runtime-rate-buffer-guard` (nginx:src/http/ngx_http_upstream.c:3072–3098)；`runtime-rate-consume` (nginx:src/http/ngx_http_upstream.c:3230–3241)；`proxy-rate-value-size` (nginx:src/http/ngx_http_script.c:107–135)；`runtime-rate-nonbuffered-return` (nginx:src/http/ngx_http_upstream.c:3117–3132)。

2. 条件：上游缓冲 read handler 实际进入 event_pipe 读取。动作/出口：process_upstream 调用 pipe，pipe 调用 read_upstream；额度=rate*(now-start_sec+1)-read_length。已有 delayed 暂停；额度<=0设置 delayed 并加恢复 timer，不是响应总超时。

   直接源码：`runtime-pipe-upstream-call` (nginx:src/http/ngx_http_upstream.c:4088–4131)；`runtime-pipe-read-call` (nginx:src/event/ngx_event_pipe.c:45–78)；`runtime-pipe-rate-budget` (nginx:src/event/ngx_event_pipe.c:205–222)；`runtime-rate-read-handler-install` (nginx:src/http/ngx_http_upstream.c:3340–3353)。

3. 条件：有可用缓冲及正额度，或0表示不限制。动作/出口：recv_chain 消费额度；缓冲分配失败 NGX_ABORT，recv ERROR置 upstream_error，AGAIN等待，0标 EOF；成功增加 read_length，按本次字节/速率添加延迟 timer。

   直接源码：`runtime-pipe-buffer-failure` (nginx:src/event/ngx_event_pipe.c:236–254)；`runtime-pipe-rate-read` (nginx:src/event/ngx_event_pipe.c:312–345)；`runtime-pipe-rate-delay` (nginx:src/event/ngx_event_pipe.c:382–386)；`runtime-pipe-abort-consume` (nginx:src/http/ngx_http_upstream.c:4124–4130)。

4. 条件：限速timer到期后上游事件分派。动作/出口：delayed且timedout先同时清两标记，再调用读handler恢复；尚 delayed 的事件只重注册后返回，注册失败 finalize NGX_ERROR。pipe 在 delayed 时不覆盖为 read_timeout，普通读取等待才加读超时。

   直接源码：`runtime-rate-event-resume` (nginx:src/http/ngx_http_upstream.c:1272–1303)；`runtime-pipe-resume-failure` (nginx:src/http/ngx_http_upstream.c:4105–4131)；`runtime-pipe-read-timer` (nginx:src/event/ngx_event_pipe.c:60–78)；`runtime-rate-read-event-install` (nginx:src/http/ngx_http_upstream.c:1581–1593)。

5. 条件：NGX_THREADS分支的未完p.writing等待已退出，且u.peer.connection存在，才检查读失败/EOF完成状态。动作/出口：upstream_done 或允许的未知长度 EOF结束0，其余不足/错误候选502；pipe ABORT直接 NGX_ERROR。已经发头的特殊码会转换错误/flush，不保证客户端收到新502，不展开缓存/store或升级响应。

   直接源码：`runtime-pipe-abort-consume` (nginx:src/http/ngx_http_upstream.c:4124–4130)；`runtime-pipe-error-finalize` (nginx:src/http/ngx_http_upstream.c:4211–4228)；`runtime-upstream-finalize-header` (nginx:src/http/ngx_http_upstream.c:4628–4666)；`runtime-pipe-completion-guards` (nginx:src/http/ngx_http_upstream.c:4135–4164)。

独立固定文档：`official-doc` (nginx-docs:xml/en/docs/http/ngx_http_proxy_module.xml:1195–1216)。

补丁范围：final25/B3新增rate求值/缓冲读取与delayed恢复；所选read计时仅引用pipe条件，不引用upstream_timeout_fields改写的p.read_timeout赋值；34项补丁不直接改新增rate片段，保留原局部unaffected，不代表完整upstream或日志链不受影响。 B3-R1–R4最小修订：各步补齐计数比较/cleanup/generic-phase、非缓冲return、读handler和read事件安装、完成外层peer/NGX_THREADS writing条件；公式明确括号。新增片段重核34补丁无直接改写，不包含timeout赋值。

旧patch完整冻结对象：

```json
{
  "status": "verified_unaffected",
  "note": "实际隔离回放34项补丁、核对47个最终文件摘要；所引注册、owner、配置回调与局部实现保持原文。此结论只覆盖本条事实，不表示整个代理请求链未受补丁影响。",
  "source_ids": [
    "registration",
    "module-owner",
    "configuration-definition",
    "implementation-0",
    "implementation-1",
    "distribution-processing",
    "proxy-rate-create",
    "proxy-rate-merge",
    "merge-pointer-rule",
    "proxy-rate-expression-slot",
    "proxy-rate-size-slot",
    "proxy-rate-value-size"
  ]
}
```

### B4 / nginx--ngx_http_log_module--log_format

限定HTTP请求结束时被 access_log 引用的已编译日志格式操作实际执行：长度、变量缺值、default/json/none转义和填充；定义格式本身不启用日志，不自动构成JSON。

1. 条件：请求释放前未logged。动作/出口：结束调用实际遍历 LOG handler；日志模块取当前location配置中的格式操作；off跳过。

   直接源码：`runtime-http-log-end` (nginx:src/http/ngx_http_request.c:3744–3748)；`runtime-http-log-consume` (nginx:src/http/ngx_http_request.c:3794–3808)；`runtime-http-log-install` (nginx:src/http/modules/ngx_http_log_module.c:1899–1909)；`runtime-http-log-select` (nginx:src/http/modules/ngx_http_log_module.c:269–276)。

2. 条件：已选择日志格式，过滤未跳过。动作/出口：刷新非缓存变量，遍历 ops：固定长度直接累计，变量操作调用 getlen；后续按同一ops调用run填充。不是把配置编译过程当请求执行。

   直接源码：`runtime-http-format-length` (nginx:src/http/modules/ngx_http_log_module.c:299–310)；`runtime-http-format-buffer` (nginx:src/http/modules/ngx_http_log_module.c:336–365)；`runtime-http-format-run` (nginx:src/http/modules/ngx_http_log_module.c:373–398)。

3. 条件：变量操作选择 default 转义。动作/出口：索引变量不存在输出单字符 -；存在时计算扩展长度并复制或转义。OpenResty补丁传入当前日志配置，按 escape_non_ascii 控制高字节转义，合并缺省on；不能照抄上游无条件高字节转义。

   直接源码：`runtime-http-default-escape` (nginx:src/http/modules/ngx_http_log_module.c:916–1048)；`runtime-http-escape-patch` (openresty:patches/nginx-1.27.1-log_escape_non_ascii.patch:38–117)。

4. 条件：变量操作选择 json 或 none，随后填充行。动作/出口：json/none普通变量未找到长度0且不输出字符；json按 JSON 字符串转义，none原样复制。行无法容入buffer时另分配，失败返回NGX_ERROR；结束日志调用者不使用该返回值改变既定请求/会话结果。

   直接源码：`runtime-http-format-mode` (nginx:src/http/modules/ngx_http_log_module.c:928–942)；`runtime-http-other-escape` (nginx:src/http/modules/ngx_http_log_module.c:1051–1122)；`runtime-http-format-allocation` (nginx:src/http/modules/ngx_http_log_module.c:336–374)；`runtime-http-log-return-unused` (nginx:src/http/ngx_http_request.c:3802–3807)。

独立固定文档：`official-doc` (nginx-docs:xml/en/docs/http/ngx_http_log_module.xml:194–345)。

补丁范围：final25/B4新增LOG真实调用/ops消费；log_escape_non_ascii:38–117改写默认转义的长度/写出及高字节表，原affected保留。JSON/none不由该补丁改写，其他33项不直接改所选ops/结束调用。 审核B4/B5最小修订：本模块文案分离；flush步骤绑定event handler/data/log赋值，先取消timer再分配；error_log绑定NGX_DEBUG空宏并明确重开user/所有者/权限guard。新增片段重核34补丁无额外直接改写。

旧patch完整冻结对象：

```json
{
  "status": "verified_affected",
  "note": "固定发行版 log_escape_non_ascii 补丁为默认转义增加请求配置开关并设缺省on，改写普通变量长度计算/写出路径；JSON及none路径独立。引用保留原上游与原补丁坐标，不把上游文档的固定非ASCII转义概括成最终行为。",
  "source_ids": [
    "registration",
    "configuration-definition",
    "module-owner",
    "implementation-0",
    "implementation-1",
    "implementation-2",
    "implementation-3",
    "distribution-patch-0",
    "distribution-processing"
  ]
}
```

### B4 / nginx--ngx_http_log_module--access_log

限定HTTP请求结束、当前location配置中的静态文件普通写入及buffer/flush；动态文件名、gzip和syslog只标为独立分支，不在本次完整消费范围，不保证持久落盘。

1. 条件：请求释放前未logged。动作/出口：真实结束调用遍历LOG handler，模块取有效location配置；off不写。条件求值失败返回NGX_ERROR，空值或单字符0跳过该条；disk_full同秒跳过。结束调用者不据日志返回值重新决定结果。

   直接源码：`runtime-http-log-end` (nginx:src/http/ngx_http_request.c:3744–3748)；`runtime-http-log-consume` (nginx:src/http/ngx_http_request.c:3794–3808)；`runtime-http-log-install` (nginx:src/http/modules/ngx_http_log_module.c:1899–1909)；`runtime-http-log-filter` (nginx:src/http/modules/ngx_http_log_module.c:269–310)。

2. 条件：选定静态文件普通格式行。动作/出口：逐ops算长度并执行run；default缺变量为 -，HTTP默认转义按发行版escape_non_ascii消费；不是格式定义即写日志。分配失败NGX_ERROR。

   直接源码：`runtime-http-access-format` (nginx:src/http/modules/ngx_http_log_module.c:299–365)；`runtime-http-access-run` (nginx:src/http/modules/ngx_http_log_module.c:373–398)；`runtime-http-access-escape` (nginx:src/http/modules/ngx_http_log_module.c:950–1048)；`runtime-http-access-escape-patch` (openresty:patches/nginx-1.27.1-log_escape_non_ascii.patch:38–117)。

3. 条件：静态文件有buffer；排除gzip与syslog。动作/出口：下一行超剩余容量先调用write并重置位置；能装入时首条设置flush timer，ops写入buffer并加换行；超大行先取消已有flush timer，再另分配直接写，分配失败直接返回NGX_ERROR。

   直接源码：`runtime-http-access-buffer` (nginx:src/http/modules/ngx_http_log_module.c:312–365)；`runtime-http-access-write-call` (nginx:src/http/modules/ngx_http_log_module.c:398–430)。

4. 条件：静态文件无gzip普通write。动作/出口：直接 ngx_write_fd；完整写入返回，-1且ENOSPC记disk_full_time，错误或短写按59秒阈值记录ALERT，无重试/持久化保证。script/gzip分支不按本普通write解释。

   直接源码：`runtime-http-file-write` (nginx:src/http/modules/ngx_http_log_module.c:405–468)。

5. 条件：已安装的flush回调被调用时（限定非gzip普通文件路径）。动作/出口：flush handler实际调用flush；空buffer直接返回。非空普通文件调用write，失败或短写记录ALERT，随后仍重置buffer；仅buffer.event存在且timer_set为真才删除timer。不承诺失败数据自动重写；本步不证明回调安装或timer触发，不展开gzip。

   直接源码：`runtime-http-buffer-flush` (nginx:src/http/modules/ngx_http_log_module.c:719–769)。

独立固定文档：`official-doc` (nginx-docs:xml/en/docs/http/ngx_http_log_module.xml:49–191)。

补丁范围：final25/B4新增静态普通write与buffer/flush，默认转义仍受log_escape_non_ascii对应hunk影响，保留affected；不展开动态路径/gzip/syslog或公共error_log链。 审核B4/B5最小修订：本模块文案分离；flush步骤绑定event handler/data/log赋值，先取消timer再分配；error_log绑定NGX_DEBUG空宏并明确重开user/所有者/权限guard。新增片段重核34补丁无额外直接改写。

旧patch完整冻结对象：

```json
{
  "status": "verified_affected",
  "note": "固定发行版 log_escape_non_ascii 补丁为默认转义增加请求配置开关并设缺省on，改写普通变量长度计算/写出路径；JSON及none路径独立。引用保留原上游与原补丁坐标，不把上游文档的固定非ASCII转义概括成最终行为。",
  "source_ids": [
    "registration",
    "configuration-definition",
    "module-owner",
    "default-path",
    "log-phase",
    "implementation-0",
    "implementation-1",
    "implementation-2",
    "implementation-3",
    "implementation-4",
    "distribution-patch-0",
    "distribution-processing"
  ]
}
```

### B4 / nginx--ngx_stream_log_module--log_format

限定stream会话结束时被 access_log 引用的已编译日志格式操作实际执行：长度、变量缺值、default/json/none转义和填充；定义格式本身不启用日志，不自动构成JSON。

1. 条件：finalize_session 设置内部状态后。动作/出口：结束调用实际遍历 LOG handler；日志模块取当前server配置中的格式操作；off或无logs跳过。status 是内部会话状态，不是HTTP响应码。

   直接源码：`runtime-stream-log-consume` (nginx:src/stream/ngx_stream_handler.c:301–329)；`runtime-stream-log-install` (nginx:src/stream/ngx_stream_log_module.c:1580–1596)；`runtime-stream-log-select` (nginx:src/stream/ngx_stream_log_module.c:216–223)。

2. 条件：已选择日志格式，过滤未跳过。动作/出口：刷新非缓存变量，遍历 ops：固定长度直接累计，变量操作调用 getlen；后续按同一ops调用run填充。不是把配置编译过程当请求执行。

   直接源码：`runtime-stream-format-length` (nginx:src/stream/ngx_stream_log_module.c:246–258)；`runtime-stream-format-buffer` (nginx:src/stream/ngx_stream_log_module.c:284–312)；`runtime-stream-format-run` (nginx:src/stream/ngx_stream_log_module.c:321–346)。

3. 条件：变量操作选择 default 转义。动作/出口：索引变量不存在输出单字符 -；存在时计算扩展长度并复制或转义。stream自身按转义表处理引号、反斜杠、控制和非ASCII字节；HTTP log_escape_non_ascii 不修改此文件。

   直接源码：`runtime-stream-default-escape` (nginx:src/stream/ngx_stream_log_module.c:705–826)。

4. 条件：变量操作选择 json 或 none，随后填充行。动作/出口：json/none普通变量未找到长度0且不输出字符；json按 JSON 字符串转义，none原样复制。行无法容入buffer时另分配，失败返回NGX_ERROR；结束日志调用者不使用该返回值改变既定请求/会话结果。

   直接源码：`runtime-stream-format-mode` (nginx:src/stream/ngx_stream_log_module.c:705–724)；`runtime-stream-other-escape` (nginx:src/stream/ngx_stream_log_module.c:829–901)；`runtime-stream-format-allocation` (nginx:src/stream/ngx_stream_log_module.c:284–322)；`runtime-stream-log-return-unused` (nginx:src/stream/ngx_stream_handler.c:323–328)。

独立固定文档：`official-doc` (nginx-docs:xml/en/docs/stream/ngx_stream_log_module.xml:155–206)。

补丁范围：final25/B4新增stream会话LOG/ops及转义消费；34补丁无直接修改这些片段；不借HTTP转义补丁或公共错误日志的间接影响迁移本项。 审核B4/B5最小修订：本模块文案分离；flush步骤绑定event handler/data/log赋值，先取消timer再分配；error_log绑定NGX_DEBUG空宏并明确重开user/所有者/权限guard。新增片段重核34补丁无额外直接改写。

旧patch完整冻结对象：

```json
{
  "status": "verified_unaffected",
  "note": "实际回放34项有效补丁并核47个最终摘要，所引注册、配置入口及运行片段保持原文；仅覆盖这里列出的缓存/格式/状态事实，不推广到完整会话或错误日志链。",
  "source_ids": [
    "registration",
    "configuration-definition",
    "module-owner",
    "implementation-0",
    "implementation-1",
    "implementation-2",
    "distribution-processing"
  ]
}
```

### B4 / nginx--ngx_stream_log_module--access_log

限定stream会话结束、当前server配置中的静态文件普通写入及buffer/flush；动态文件名、gzip和syslog只标为独立分支，不在本次完整消费范围，不保证持久落盘。

1. 条件：会话finalize设置内部status后。动作/出口：真实结束调用遍历LOG handler，模块取有效server配置；off或无logs不写。条件求值失败返回NGX_ERROR，空值或单字符0跳过该条；disk_full同秒跳过。结束调用者不据日志返回值重新决定结果。

   直接源码：`runtime-stream-log-consume` (nginx:src/stream/ngx_stream_handler.c:301–329)；`runtime-stream-log-install` (nginx:src/stream/ngx_stream_log_module.c:1580–1596)；`runtime-stream-log-filter` (nginx:src/stream/ngx_stream_log_module.c:216–258)。

2. 条件：选定静态文件普通格式行。动作/出口：逐ops算长度并执行run；default缺变量为 -，stream按自身转义表处理；不是格式定义即写日志。分配失败NGX_ERROR。

   直接源码：`runtime-stream-access-format` (nginx:src/stream/ngx_stream_log_module.c:246–312)；`runtime-stream-access-run` (nginx:src/stream/ngx_stream_log_module.c:321–346)；`runtime-stream-access-escape` (nginx:src/stream/ngx_stream_log_module.c:727–826)。

3. 条件：静态文件有buffer；排除gzip与syslog。动作/出口：下一行超剩余容量先调用write并重置位置；能装入时首条设置flush timer，ops写入buffer并加换行；超大行先取消已有flush timer，再另分配直接写，分配失败直接返回NGX_ERROR。

   直接源码：`runtime-stream-access-buffer` (nginx:src/stream/ngx_stream_log_module.c:260–312)；`runtime-stream-access-write-call` (nginx:src/stream/ngx_stream_log_module.c:346–378)。

4. 条件：静态文件无gzip普通write。动作/出口：直接 ngx_write_fd；完整写入返回，-1且ENOSPC记disk_full_time，错误或短写按59秒阈值记录ALERT，无重试/持久化保证。script/gzip分支不按本普通write解释。

   直接源码：`runtime-stream-file-write` (nginx:src/stream/ngx_stream_log_module.c:354–416)。

5. 条件：配置了flush事件且timer触发，buffer非空。动作/出口：flush handler实际调用flush；普通文件write失败或短写记录ALERT，随后仍重置buffer并删timer；空buffer直接返回。不承诺失败数据自动重写；本范围不展开gzip。

   直接源码：`runtime-stream-buffer-flush` (nginx:src/stream/ngx_stream_log_module.c:611–662)；`runtime-stream-flush-event-install` (nginx:src/stream/ngx_stream_log_module.c:1241–1253)。

独立固定文档：`runtime-stream-access-doc` (nginx-docs:xml/en/docs/stream/ngx_stream_log_module.xml:41–152)。

补丁范围：final25/B4新增会话LOG/静态普通write与flush消费，34补丁无直接改所选stream日志/终结分支，保留原局部unaffected；公共error_log间接输出不冒充本条完整运行链。 审核B4/B5最小修订：本模块文案分离；flush步骤绑定event handler/data/log赋值，先取消timer再分配；error_log绑定NGX_DEBUG空宏并明确重开user/所有者/权限guard。新增片段重核34补丁无额外直接改写。

旧patch完整冻结对象：

```json
{
  "status": "verified_unaffected",
  "note": "应用发行版 34 项有效补丁后 stream log 文件逐字节未变；所列格式校验、日志列表继承和基本开关不变。log_escape_non_ascii 补丁修改的是 HTTP log 文件而非 stream log；其他底层日志行为不在本条已核对范围，未运行。",
  "source_ids": [
    "patch-effective-set",
    "patch-selection",
    "log-merge",
    "log-format"
  ]
}
```

### B5 / nginx--ngx_errlog_module--error_log

限定Unix cycle/普通master与worker到公共错误日志的级别/调试过滤、可选拦截及目标写入；文件重开独立核定。memory/syslog writer内部和Windows事件日志未展开，不保证日志持久落盘。

1. 条件：cycle 初始化并成功打开日志文件后。动作/出口：cycle将日志切为new_log，启动旧日志与运行日志是不同对象；master或普通worker收到reopen标记后以cycle.log真实输出NOTICE并重开。文件open/Unix CLOEXEC失败进入cycle failed，不能把配置成功当日志目标可用。

   直接源码：`runtime-cycle-log-open` (nginx:src/core/ngx_cycle.c:363–410)；`runtime-master-log-reopen` (nginx:src/os/unix/ngx_process_cycle.c:254–260)；`runtime-worker-log-reopen` (nginx:src/os/unix/ngx_process_cycle.c:743–747)。

2. 条件：master或普通worker的reopen标记。动作/出口：实际调用 ngx_log_error，以当前cycle日志对象进入公共输出。普通宏只在log_level>=level调用，debug0至8仅在NGX_DEBUG编译时有效，本范围variadic debug宏按类别位掩码；未编入NGX_DEBUG时这些debug宏为空，不产生输出；日志头在对象链低于level且非debug_connection时停止。

   直接源码：`runtime-master-log-reopen` (nginx:src/os/unix/ngx_process_cycle.c:254–260)；`runtime-worker-log-reopen` (nginx:src/os/unix/ngx_process_cycle.c:743–747)；`runtime-log-filter-macros` (nginx:src/core/ngx_log.h:81–137)；`runtime-log-chain-filter` (nginx:src/core/ngx_log.c:158–169)；`runtime-log-debug-disabled` (nginx:src/core/ngx_log.h:213–225)。

3. 条件：经过入口过滤的日志进入ngx_log_error_core。动作/出口：格式化时间、级别、PID、连接与错误信息，非DEBUG可调用上下文handler，限定buffer末尾；larger_max_error_str补丁只在宏未定义时缺省4096。intercept补丁在换行前读取cycle回调，用entered_logger防重入，回调返回值不取消后续写出。

   直接源码：`runtime-error-log-format` (nginx:src/core/ngx_log.c:106–159)；`runtime-error-log-buffer-macro` (nginx:src/core/ngx_log.h:76–76)；`runtime-error-buffer-patch` (openresty:patches/nginx-1.27.1-larger_max_error_str.patch:1–10)；`runtime-error-intercept-patch` (openresty:patches/nginx-1.27.1-intercept_error_log.patch:35–60)。

4. 条件：日志链当前项达到级别，选择writer或普通file。动作/出口：writer非空调用后继续下一项；普通file同秒磁盘满跳过，否则write_fd；-1且ENOSPC记disk_full_time。所引普通file路径没有短写补偿，不以函数返回保证持久写入。条件满足才补写stderr，本范围不展开writer内部。

   直接源码：`runtime-error-log-output` (nginx:src/core/ngx_log.c:161–210)。

5. 条件：所列普通master/worker调用重开；有命名file。动作/出口：先flush再open append；open失败继续且保留旧fd。仅Unix且user != NGX_CONF_UNSET_UINT才执行stat及权限检查，master传ccf.user，普通worker传-1跳过：所有者不同才chown，用户读写权限不全才chmod；这组失败关闭新fd并继续。Unix CLOEXEC独立于user门控，失败也关闭新fd并继续。close旧fd失败仅记错仍换新fd；最终重定向stderr，helper返回错误被reopen调用忽略。

   直接源码：`runtime-master-log-reopen` (nginx:src/os/unix/ngx_process_cycle.c:254–260)；`runtime-worker-log-reopen` (nginx:src/os/unix/ngx_process_cycle.c:743–747)；`runtime-error-log-reopen` (nginx:src/core/ngx_cycle.c:1168–1288)；`runtime-stderr-redirect` (nginx:src/core/ngx_log.c:438–460)。

独立固定文档：`official-doc` (nginx-docs:xml/en/docs/ngx_core_module.xml:211–271)。

补丁范围：final25/B5新增对象选择/真实调用与公共输出、Unix普通master-worker重开；intercept_error_log:35–60改变换行前回调，larger_max_error_str:1–10改变未定义宏默认。原affected保留，未纳Windows win32_max_err_str、single退出或writer内部，不把整个cycle/进程描述为无补丁影响。 审核B4/B5最小修订：本模块文案分离；flush步骤绑定event handler/data/log赋值，先取消timer再分配；error_log绑定NGX_DEBUG空宏并明确重开user/所有者/权限guard。新增片段重核34补丁无额外直接改写。

旧patch完整冻结对象：

```json
{
  "status": "verified_affected",
  "note": "OpenResty 在错误日志生成路径增加可重入保护的捕获回调；main 指令的目的地与级别配置入口未变。本说明不把整条日志处理链视为未受补丁影响。",
  "source_ids": [
    "registration",
    "configuration-definition",
    "distribution-processing",
    "runtime-patch",
    "cycle-log-default",
    "cycle-log-path",
    "build-log-path",
    "build-log-macro",
    "startup-log-init",
    "startup-log-open-fallback",
    "startup-log-option",
    "log-file-prefix",
    "log-empty-stderr",
    "log-file-list",
    "log-default-level",
    "cycle-new-log-zero",
    "cycle-log-switch",
    "cycle-log-current"
  ]
}
```

### B5 / nginx--ngx_http_core_module--error_log

限定HTTP请求/连接有效对象选择到公共错误日志的级别/调试过滤、可选拦截及目标写入；文件重开独立核定。memory/syslog writer内部和Windows事件日志未展开，不保证日志持久落盘。

1. 条件：HTTP连接创建请求、虚拟主机或location配置切换。动作/出口：创建请求取clcf.error_log；已匹配虚拟主机换srv_conf/loc_conf后改连接日志；主请求location更新含limit_except后也选择新日志。选择宏复制file/next/writer/wdata，debug_connection已设时保留该调试级别；并非固定一次日志阶段。

   直接源码：`runtime-http-error-log-create` (nginx:src/http/ngx_http_request.c:535–547)；`runtime-http-error-log-server` (nginx:src/http/ngx_http_request.c:2304–2315)；`runtime-http-error-log-location` (nginx:src/http/ngx_http_core_module.c:1311–1318)；`runtime-connection-log-select` (nginx:src/core/ngx_connection.h:206–214)。

2. 条件：解析HTTP头遇到所列无效字段条件。动作/出口：实际调用 ngx_log_error，以当前HTTP连接日志对象进入公共输出。普通宏只在log_level>=level调用，debug0至8仅在NGX_DEBUG编译时有效，本范围variadic debug宏按类别位掩码；未编入NGX_DEBUG时这些debug宏为空，不产生输出；日志头在对象链低于level且非debug_connection时停止。

   直接源码：`runtime-http-error-log-call` (nginx:src/http/ngx_http_request.c:1454–1465)；`runtime-log-filter-macros` (nginx:src/core/ngx_log.h:81–137)；`runtime-log-chain-filter` (nginx:src/core/ngx_log.c:158–169)；`runtime-log-debug-disabled` (nginx:src/core/ngx_log.h:213–225)。

3. 条件：经过入口过滤的日志进入ngx_log_error_core。动作/出口：格式化时间、级别、PID、连接与错误信息，非DEBUG可调用上下文handler，限定buffer末尾；larger_max_error_str补丁只在宏未定义时缺省4096。intercept补丁在换行前读取cycle回调，用entered_logger防重入，回调返回值不取消后续写出。

   直接源码：`runtime-error-log-format` (nginx:src/core/ngx_log.c:106–159)；`runtime-error-log-buffer-macro` (nginx:src/core/ngx_log.h:76–76)；`runtime-error-buffer-patch` (openresty:patches/nginx-1.27.1-larger_max_error_str.patch:1–10)；`runtime-error-intercept-patch` (openresty:patches/nginx-1.27.1-intercept_error_log.patch:35–60)。

4. 条件：日志链当前项达到级别，选择writer或普通file。动作/出口：writer非空调用后继续下一项；普通file同秒磁盘满跳过，否则write_fd；-1且ENOSPC记disk_full_time。所引普通file路径没有短写补偿，不以函数返回保证持久写入。条件满足才补写stderr，本范围不展开writer内部。

   直接源码：`runtime-error-log-output` (nginx:src/core/ngx_log.c:161–210)。

5. 条件：所列普通master/worker调用重开；有命名file。动作/出口：先flush再open append；open失败继续且保留旧fd。仅Unix且user != NGX_CONF_UNSET_UINT才执行stat及权限检查，master传ccf.user，普通worker传-1跳过：所有者不同才chown，用户读写权限不全才chmod；这组失败关闭新fd并继续。Unix CLOEXEC独立于user门控，失败也关闭新fd并继续。close旧fd失败仅记错仍换新fd；最终重定向stderr，helper返回错误被reopen调用忽略。

   直接源码：`runtime-master-log-reopen` (nginx:src/os/unix/ngx_process_cycle.c:254–260)；`runtime-worker-log-reopen` (nginx:src/os/unix/ngx_process_cycle.c:743–747)；`runtime-error-log-reopen` (nginx:src/core/ngx_cycle.c:1168–1288)；`runtime-stderr-redirect` (nginx:src/core/ngx_log.c:438–460)。

独立固定文档：`runtime-error-log-doc` (nginx-docs:xml/en/docs/ngx_core_module.xml:211–271)。

补丁范围：final25/B5新增对象选择/真实调用与公共输出、Unix普通master-worker重开；intercept_error_log:35–60改变换行前回调，larger_max_error_str:1–10改变未定义宏默认。原affected保留，未纳Windows win32_max_err_str、single退出或writer内部，不把整个cycle/进程描述为无补丁影响。 审核B4/B5最小修订：本模块文案分离；flush步骤绑定event handler/data/log赋值，先取消timer再分配；error_log绑定NGX_DEBUG空宏并明确重开user/所有者/权限guard。新增片段重核34补丁无额外直接改写。

旧patch完整冻结对象：

```json
{
  "status": "verified_affected",
  "note": "实际回放34项补丁并核对47个最终文件摘要：intercept_error_log 在日志写入前增加带递归保护的可选拦截回调；所引 HTTP 注册、owner、配置回调、目标构建与请求日志切换段保持原文。这不是对整个日志链未受其他补丁影响的声明。",
  "source_ids": [
    "registration",
    "module-owner",
    "configuration-definition",
    "implementation-0",
    "implementation-1",
    "implementation-2",
    "distribution-processing",
    "intercept-error-log-patch",
    "http-log-create",
    "http-log-merge",
    "cycle-log-default",
    "cycle-log-path",
    "build-log-path",
    "log-file-prefix",
    "log-empty-stderr",
    "http-log-parent-merge"
  ]
}
```

### B5 / nginx--ngx_stream_core_module--error_log

限定stream默认接入会话/连接有效对象选择到公共错误日志的级别/调试过滤、可选拦截及目标写入；文件重开独立核定。memory/syslog writer内部和Windows事件日志未展开，不保证日志持久落盘。

1. 条件：stream默认地址配置的会话已分配。动作/出口：以default_server ctx设置srv_conf与virtual_names，取cscf.error_log关联连接；选日志后实际输出接入INFO，再安装会话上下文日志handler。ctx分配失败关闭连接。本范围限定默认接入，不否认virtual_names或扩展SNI后续切换。

   直接源码：`runtime-stream-error-log-select` (nginx:src/stream/ngx_stream_handler.c:119–163)；`runtime-connection-log-select` (nginx:src/core/ngx_connection.h:206–214)。

2. 条件：已选stream默认server日志后接入输出。动作/出口：实际调用 ngx_log_error，以当前stream连接日志对象进入公共输出。普通宏只在log_level>=level调用，debug0至8仅在NGX_DEBUG编译时有效，本范围variadic debug宏按类别位掩码；未编入NGX_DEBUG时这些debug宏为空，不产生输出；日志头在对象链低于level且非debug_connection时停止。

   直接源码：`runtime-stream-error-log-call` (nginx:src/stream/ngx_stream_handler.c:143–157)；`runtime-log-filter-macros` (nginx:src/core/ngx_log.h:81–137)；`runtime-log-chain-filter` (nginx:src/core/ngx_log.c:158–169)；`runtime-log-debug-disabled` (nginx:src/core/ngx_log.h:213–225)。

3. 条件：经过入口过滤的日志进入ngx_log_error_core。动作/出口：格式化时间、级别、PID、连接与错误信息，非DEBUG可调用上下文handler，限定buffer末尾；larger_max_error_str补丁只在宏未定义时缺省4096。intercept补丁在换行前读取cycle回调，用entered_logger防重入，回调返回值不取消后续写出。

   直接源码：`runtime-error-log-format` (nginx:src/core/ngx_log.c:106–159)；`runtime-error-log-buffer-macro` (nginx:src/core/ngx_log.h:76–76)；`runtime-error-buffer-patch` (openresty:patches/nginx-1.27.1-larger_max_error_str.patch:1–10)；`runtime-error-intercept-patch` (openresty:patches/nginx-1.27.1-intercept_error_log.patch:35–60)。

4. 条件：日志链当前项达到级别，选择writer或普通file。动作/出口：writer非空调用后继续下一项；普通file同秒磁盘满跳过，否则write_fd；-1且ENOSPC记disk_full_time。所引普通file路径没有短写补偿，不以函数返回保证持久写入。条件满足才补写stderr，本范围不展开writer内部。

   直接源码：`runtime-error-log-output` (nginx:src/core/ngx_log.c:161–210)。

5. 条件：所列普通master/worker调用重开；有命名file。动作/出口：先flush再open append；open失败继续且保留旧fd。仅Unix且user != NGX_CONF_UNSET_UINT才执行stat及权限检查，master传ccf.user，普通worker传-1跳过：所有者不同才chown，用户读写权限不全才chmod；这组失败关闭新fd并继续。Unix CLOEXEC独立于user门控，失败也关闭新fd并继续。close旧fd失败仅记错仍换新fd；最终重定向stderr，helper返回错误被reopen调用忽略。

   直接源码：`runtime-master-log-reopen` (nginx:src/os/unix/ngx_process_cycle.c:254–260)；`runtime-worker-log-reopen` (nginx:src/os/unix/ngx_process_cycle.c:743–747)；`runtime-error-log-reopen` (nginx:src/core/ngx_cycle.c:1168–1288)；`runtime-stderr-redirect` (nginx:src/core/ngx_log.c:438–460)。

独立固定文档：`runtime-error-log-doc` (nginx-docs:xml/en/docs/ngx_core_module.xml:211–271)。

补丁范围：final25/B5新增对象选择/真实调用与公共输出、Unix普通master-worker重开；intercept_error_log:35–60改变换行前回调，larger_max_error_str:1–10改变未定义宏默认。原affected保留，未纳Windows win32_max_err_str、single退出或writer内部，不把整个cycle/进程描述为无补丁影响。 审核B4/B5最小修订：本模块文案分离；flush步骤绑定event handler/data/log赋值，先取消timer再分配；error_log绑定NGX_DEBUG空宏并明确重开user/所有者/权限guard。新增片段重核34补丁无额外直接改写。

旧patch完整冻结对象：

```json
{
  "status": "verified_affected",
  "note": "stream core 配置入口/继承与公共 ngx_log_set_levels 未被有效补丁改动；公共日志运行时 ngx_log_error_core 受 intercept_error_log 补丁修改，加入防重入的拦截回调。此处明确区分配置事实与运行时补丁，不宣称日志全链路不受影响；未运行。",
  "source_ids": [
    "intercept-selection",
    "intercept-patch",
    "log-level",
    "error-log-merge"
  ]
}
```

### B7 / nginx--ngx_core_module--pid

限定Unix main/master的PID文件生命周期：首次写入、reload路径变化、热升级rename/失败恢复和master退出删除；不是请求阶段或每worker一个PID文件。single退出、完整cycle pool/回收hook和现场文件系统不在本次范围。

1. 条件：main初始化完成，调用create_pidfile；非worker进程。动作/出口：main调用失败返回1；create_pidfile在process>MASTER直接跳过。测试配置只create/open不写PID；正常用truncate打开，失败记EMERG并返回ERROR。

   直接源码：`implementation-1` (nginx:src/core/nginx.c:363–365)；`runtime-pid-create-open` (nginx:src/core/ngx_cycle.c:1018–1044)。

2. 条件：正常create_pidfile成功open且非测试配置。动作/出口：将当前ngx_pid加换行写文件；write_file按pwrite能力或write分支处理EINTR/续短写，其他错误返回ERROR，使create返回错误。close失败仅ALERT，不单独改变rc；不把open或close失败称写入成功。

   直接源码：`runtime-pid-write-close` (nginx:src/core/ngx_cycle.c:1046–1062)；`runtime-pid-write-helper` (nginx:src/os/unix/ngx_files.c:195–275)；`implementation-1` (nginx:src/core/nginx.c:363–365)。

3. 条件：普通master reload真正进入init_cycle，旧cycle不是初始cycle且pid路径改变。动作/出口：路径不变不重写；变化先create新文件，失败进入failed最终NULL，master保留旧cycle继续；成功后才delete旧路径，delete失败只ALERT。本局部操作不承诺后续整个cycle失败时完全撤销文件副作用。

   直接源码：`runtime-pid-reload-call` (nginx:src/os/unix/ngx_process_cycle.c:223–229)；`runtime-pid-reload-path` (nginx:src/core/ngx_cycle.c:318–345)；`runtime-pid-cycle-failure-return` (nginx:src/core/ngx_cycle.c:919–939)；`runtime-pid-delete` (nginx:src/core/ngx_cycle.c:1066–1079)。

4. 条件：master change_binary分支调用exec_new_binary。动作/出口：先rename pid到oldpid，rename失败释放本地env/var后返回INVALID_PID；成功再execute，execute失败尝试rename回去，恢复失败只记录ALERT，返回失败PID；不展开exec/fork实现。

   直接源码：`runtime-pid-upgrade-call` (nginx:src/os/unix/ngx_process_cycle.c:262–266)；`runtime-pid-upgrade-rename` (nginx:src/core/nginx.c:767–797)。

5. 条件：master reap中该进程已exited，未走允许respawn的continue，且进程PID等于ngx_new_binary。动作/出口：尝试oldpid恢复为pid；rename失败ALERT，随后仍清ngx_new_binary并按noaccepting设置restart。本范围只核文件动作，不泛称proc_exit_handler新增的收割hook未受影响。

   直接源码：`runtime-pid-reap-call` (nginx:src/os/unix/ngx_process_cycle.c:167–175)；`runtime-pid-upgrade-exit-restore` (nginx:src/os/unix/ngx_process_cycle.c:617–636)；`runtime-pid-reap-exited-guard` (nginx:src/os/unix/ngx_process_cycle.c:559–564)；`runtime-pid-reap-respawn-guard` (nginx:src/os/unix/ngx_process_cycle.c:593–615)。

6. 条件：master没有存活子进程且terminate或quit，进入master_exit。动作/出口：实际调用delete_pidfile；按ngx_new_binary非零选择oldpid，否则pid。delete失败记ALERT，函数无错误返回，不阻断随后退出；不扩single的已补丁graceful exit或master pool销毁。

   直接源码：`runtime-pid-master-exit-call` (nginx:src/os/unix/ngx_process_cycle.c:177–179)；`runtime-pid-master-delete-call` (nginx:src/os/unix/ngx_process_cycle.c:655–662)；`runtime-pid-delete` (nginx:src/core/ngx_cycle.c:1066–1079)。

独立固定文档：`official-doc` (nginx-docs:xml/en/docs/ngx_core_module.xml:405–414)。

补丁范围：final25/B7新增Unix main/master PID文件操作消费；34hunk中init_cycle_pool_release的master尾部pool、proc_exit_handler的init重设/收割回调、privileged agent增进程和single退出均在所选PID文件动作之外。保留原局部unaffected，不宣称完整cycle/退出机制未受补丁影响。 B7-R1补齐reap的exited与respawn/continue门控，仅未走respawn continue才到new_binary恢复；新559–564/593–615重核34hunk无直接改写，不展开proc_exit_handler收割hook。

旧patch完整冻结对象：

```json
{
  "status": "verified_unaffected",
  "note": "对固定发行版34项有效补丁回放逐段核对：本条所列配置入口、功能对象及限制保持；不把这一局部结论推广为完整事件循环、进程生命周期或实际环境未受影响。",
  "source_ids": [
    "registration",
    "configuration-definition",
    "distribution-processing",
    "implementation-0",
    "implementation-1",
    "pid-core-create",
    "core-cycle-create",
    "build-path-options",
    "build-pid-default",
    "build-prefix-pid-macros",
    "runtime-prefix",
    "path-prefix-select",
    "path-full-name",
    "distribution-prefix-default",
    "distribution-nginx-prefix",
    "distribution-configure-prefix"
  ]
}
```

### B8 / nginx--ngx_http_core_module--listen

限定Unix INET TCP：HTTP listen地址对象到实际socket开启、普通worker accept、接入本地地址和默认HTTP上下文选择；不覆盖QUIC/UDP、IOCP或完整TLS握手，不承诺现场成功。

1. 条件：监听配置已形成地址关联的ls/servers对象。动作/出口：配置生成器关联HTTP地址配置与连接handler；真实cycle调用open_listening_sockets消费该列表，失败进入cycle失败路径。注册本身不作为runtime；后续步骤证明这些对象被socket和连接使用。

   直接源码：`runtime-http-listen-addresses` (nginx:src/http/ngx_http.c:1764–1799)；`runtime-http-listen-handler` (nginx:src/http/ngx_http.c:1810–1832)；`runtime-listen-open-call` (nginx:src/core/ngx_cycle.c:618–620)。

2. 条件：限定Unix INET TCP监听，非ignore且没有已有效/继承fd。动作/出口：按有效地址和类型创建socket，失败ERROR；新socket的reuseaddr设置失败关socket并ERROR；reuseport仅在NGX_HAVE_REUSEPORT编译能力、ls.reuseport监听开启且!ngx_test_config三条件同时满足时设置，失败关新socket并ERROR。本步不包含旧fd的add_reuseport迁移/失败忽略分支。非IOCP非阻塞失败也关闭返回。bind失败关闭；非EADDRINUSE立即ERROR，正常配置EADDRINUSE标失败重试；最多5次、每次失败等待500ms，最终仍失败ERROR。listen成功保存fd，listen错误对应关闭/重试/ERROR。

   直接源码：`runtime-listen-socket-options` (nginx:src/core/ngx_connection.c:425–564)；`runtime-listen-bind-errors` (nginx:src/core/ngx_connection.c:585–628)；`runtime-listen-activate-retry` (nginx:src/core/ngx_connection.c:652–711)。

3. 条件：普通Unix worker进行监听事件初始化。动作/出口：NGX_HAVE_REUSEPORT且ls.reuseport且ls.worker!=ngx_worker时，发行补丁关闭本worker不使用fd，关闭失败记EMERG，仍置-1后continue。适用监听取连接对象失败ERROR；NGX_WIN32平台分支的#else限定Unix，SOCK_STREAM设置accept handler；reuseport直接add_event，失败ERROR。普通非reuseport若ngx_use_accept_mutex为真则continue延后启用，本次不展开该启用路径；否则NGX_HAVE_EPOLLEXCLUSIVE且EPOLL且worker_processes>1时以EXCLUSIVE注册，其他以普通标志注册，两者失败均ERROR。已注册事件由epoll直接调用或posted accept队列消费。其他后端未展开。

   直接源码：`runtime-listen-worker-activate` (nginx:src/event/ngx_event.c:804–828)；`runtime-listen-reuseport-patch` (openresty:patches/nginx-1.27.1-reuseport_close_unused_fds.patch:17–38)；`runtime-listen-accept-install` (nginx:src/event/ngx_event.c:892–915)；`runtime-listen-epoll-consume` (nginx:src/event/modules/ngx_epoll_module.c:883–903)；`runtime-listen-posted-consume` (nginx:src/event/ngx_event.c:248–255)；`runtime-listen-posted-call` (nginx:src/event/ngx_event_posted.c:18–35)；`runtime-listen-platform-guard` (nginx:src/event/ngx_event.c:856–856)；`runtime-listen-ordinary-register` (nginx:src/event/ngx_event.c:917–943)。

4. 条件：监听读事件到accept，创建接受到的TCP socket。动作/出口：NGX_HAVE_ACCEPT4且use_accept4时补丁使用NONBLOCK|CLOEXEC，否则accept；EAGAIN返回，ENOSYS关闭accept4能力后continue仍须经过循环条件，不保证同次立即fallback。取连接槽/池/地址/日志失败按源码关闭；!inherited_nonblocking且!IOCP并NGX_HAVE_FD_CLOEXEC才执行新增cloexec，失败cleanup返回。

   直接源码：`runtime-listen-accept-errors` (nginx:src/event/ngx_event_accept.c:38–133)；`runtime-listen-cloexec-patch` (openresty:patches/nginx-1.27.1-socket_cloexec.patch:82–113)；`runtime-listen-accept-init` (nginx:src/event/ngx_event_accept.c:139–218)；`runtime-listen-accept-handoff` (nginx:src/event/ngx_event_accept.c:303–319)；`runtime-listen-accept-cleanup` (nginx:src/event/ngx_event_accept.c:482–503)。

5. 条件：accepted连接已初始化并交给HTTP handler。动作/出口：accept实际调用ls.handler；HTTP handler分配连接上下文，失败调用关闭。由listening.servers选地址配置，多地址需本地sockaddr查询，失败关闭；按IPv4或NGX_HAVE_INET6下IPv6匹配，未匹配用最后通配项，单地址用首项。

   直接源码：`runtime-listen-accepted-association` (nginx:src/event/ngx_event_accept.c:206–218)；`runtime-listen-accept-handoff` (nginx:src/event/ngx_event_accept.c:303–319)；`runtime-http-listen-address-consume` (nginx:src/http/ngx_http_request.c:215–295)。

6. 条件：HTTP地址配置确定后。动作/出口：以该地址default_server.ctx设置hc.conf_ctx，日志上下文分配失败关闭；读事件初始安装wait_request handler，SSL地址随后可覆盖为ssl_handshake；不声称所有TCP始终使用wait_request。本范围不展开QUIC、IOCP、TLS握手及PROXY协议消费，不据监听成功断言请求成功或现场端口开放。

   直接源码：`runtime-http-listen-default-context` (nginx:src/http/ngx_http_request.c:297–334)；`runtime-listen-ssl-handler-boundary` (nginx:src/http/ngx_http_request.c:328–333)。

独立固定文档：`runtime-http-listen-doc` (nginx-docs:xml/en/docs/http/ngx_http_core_module.xml:1269–1364)。

补丁范围：final25/B8：旧unaffected只核listen配置；新增worker/accept消费绑定nginx event.c:804–828、accept.c:38–218、303–319，reuseport_close_unused_fds:17–38新增关闭/置-1，socket_cloexec:82–113新增accept4 CLOEXEC及受外层guard控制的cloexec失败清理；故verified_unaffected→verified_affected。本项不扩完整事件系统、TLS或所有socket路径。

旧patch完整冻结对象：

```json
{
  "status": "verified_unaffected",
  "note": "实际回放本发行版34项 Nginx 补丁并核对47个最终文件摘要后，所引注册、模块归属、配置回调及实现段保持原文；结论仅覆盖本条所列事实，不表示整个 HTTP 请求链没有补丁影响。",
  "source_ids": [
    "registration",
    "module-owner",
    "configuration-definition",
    "implementation-0",
    "distribution-processing",
    "listen-implicit",
    "listen-option-defaults",
    "listen-port-group",
    "listen-address-group",
    "listen-first-default"
  ]
}
```

### B8 / nginx--ngx_http_core_module--server

限定HTTP server配置对象的真实路由消费：接入地址默认配置、请求Host/名称选择及有编译条件的SNI配置切换；不把server块解析当运行执行，不扩完整TLS握手或stream路由。

1. 条件：HTTP连接已按监听地址选择addr_conf。动作/出口：addr_conf.default_server.ctx作为hc.conf_ctx；创建请求复制main/srv/loc_conf。连接上下文/日志分配失败关闭；request创建调用失败关闭。默认server对象由请求真正使用，不仅配置时创建。

   直接源码：`runtime-server-default-address` (nginx:src/http/ngx_http_request.c:215–304)；`runtime-server-request-create-call` (nginx:src/http/ngx_http_request.c:516–523)；`runtime-server-request-default` (nginx:src/http/ngx_http_request.c:584–604)。

2. 条件：请求解析Host字段或结束头部尚无server名称。动作/出口：Host先validate，非法400，分配/内部错误500；已由请求行确定server时不再用Host重选，否则实际set_virtual_server。头结束无名称仍调用选择，HTTP/1.1无Host400。未匹配名称与非法Host是不同情况。

   直接源码：`runtime-server-host-call` (nginx:src/http/ngx_http_request.c:1844–1869)；`runtime-server-empty-host-call` (nginx:src/http/ngx_http_request.c:1964–1978)。

3. 条件：set_virtual_server需进行名称选择。动作/出口：find_virtual_server查询combined hash并在NGX_PCRE条件下按regex序列查找；不存在或均未匹配返回DECLINED，仅不进入SNI名称差异处理的分支维持现有配置。已有SNI且与Host不同的例外转第5步：DECLINED改选默认server并检查verify，不能概括为始终维持原配置。执行错误返回ERROR由调用者500；匹配后切换r.srv_conf/loc_conf并日志对象。

   直接源码：`runtime-server-name-find-call` (nginx:src/http/ngx_http_request.c:2272–2279)；`implementation-1` (nginx:src/http/ngx_http_request.c:2320–2402)；`runtime-server-name-switch` (nginx:src/http/ngx_http_request.c:2304–2315)；`runtime-server-declined-sni-boundary` (nginx:src/http/ngx_http_request.c:2281–2325)。

4. 条件：已编译HTTP SSL与SNI能力，TLS库调用所安装SNI回调。动作/出口：SSL_CTRL_SET_TLSEXT_HOSTNAME条件下安装callback；回调拒绝重协商；无/空/非法/未匹配名称到done，有效名称find，错误或分配失败到fatal internal-error出口，匹配则保存SNI并换hc.conf_ctx/log。done从当前选定配置检查sscf->reject_handshake：非零设置handshake_rejected，给UNRECOGNIZED_NAME并返回SSL_TLSEXT_ERR_ALERT_FATAL；否则返回SSL_TLSEXT_ERR_OK。本步只核回调配置选择，不展开shared握手yield。

   直接源码：`runtime-server-sni-install` (nginx:src/http/modules/ngx_http_ssl_module.c:729–741)；`runtime-server-sni-consume` (nginx:src/http/ngx_http_request.c:875–947)；`runtime-server-sni-name-find` (nginx:src/http/ngx_http_request.c:2320–2378)；`runtime-server-sni-exit` (nginx:src/http/ngx_http_request.c:988–1006)；`runtime-server-sni-guard` (nginx:src/http/ngx_http_request.c:872–876)。

5. 条件：请求已有协商SNI且进入set_virtual_server。动作/出口：Host与SNI相同可直接返回，有SNI regex须重执行，错误500；不同时查名称，未匹配回默认server，选定sscf.verify非零时finalize421并ERROR。无此条件则按已查得配置切换；SNI/Host/监听目标不混同。

   直接源码：`runtime-server-sni-host-conditions` (nginx:src/http/ngx_http_request.c:2248–2315)。

独立固定文档：`official-doc` (nginx-docs:xml/en/docs/http/ngx_http_core_module.xml:2444–2461)；`runtime-server-routing-doc` (nginx-docs:xml/en/docs/http/request_processing.xml:43–70)。

补丁范围：final25/B8新增默认请求上下文、名称/SNI回调配置选择，34补丁不直接改这些选定分支；未纳shared TLS握手yield、logger内部、error_pages合并，原局部unaffected保持。

旧patch完整冻结对象：

```json
{
  "status": "verified_unaffected",
  "note": "实际回放本发行版34项 Nginx 补丁并核对47个最终文件摘要后，所引注册、模块归属、配置回调及实现段保持原文；结论仅覆盖本条所列事实，不表示整个 HTTP 请求链没有补丁影响。",
  "source_ids": [
    "registration",
    "module-owner",
    "configuration-definition",
    "implementation-0",
    "implementation-1",
    "distribution-processing",
    "server-context-create",
    "http-parent-context",
    "http-server-merge",
    "http-empty-servers"
  ]
}
```

### B8 / nginx--ngx_http_core_module--location

限定HTTP请求的location查找与配置切换：静态树、条件编译正则、自动补斜杠重定向、内部URI重查和命名跳转；不把配置merge当请求匹配，不套stream。

1. 条件：HTTP阶段引擎运行find_config checker。动作/出口：phase_engine实际调用checker；find_config调用find_location，执行错误finalize500；外部请求匹配internal位置404。成功后update_location_config消费被选loc_conf，不是只编译配置。

   直接源码：`runtime-location-phase-consume` (nginx:src/http/ngx_http_core_module.c:862–884)；`runtime-location-find-call` (nginx:src/http/ngx_http_core_module.c:952–979)；`runtime-location-checker-install` (nginx:src/http/ngx_http.c:495–507)。

2. 条件：当前配置下查静态location树及嵌套。动作/出口：按URI与节点比较；前缀命中保存loc_conf并继续子树，精确同长返回OK，普通同长前缀AGAIN，差一斜杠且auto_redirect返回DONE；无节点返回已保留rv。find_location对AGAIN递归嵌套，精确/DONE优先返回。

   直接源码：`runtime-location-static-call` (nginx:src/http/ngx_http_core_module.c:1396–1429)；`runtime-location-static-consume` (nginx:src/http/ngx_http_core_module.c:1471–1549)。

3. 条件：NGX_PCRE且本层局部noregex为0且本层pclcf有regex_locations。动作/出口：每次find_location调用独立初始化本层noregex为0；本层静态前缀命中AGAIN时，在递归前保存该本层前缀的noregex。嵌套返回未OK/DONE后，按本层保存值决定是否查本层pclcf正则数组；最深嵌套的noregex不向外层传播。按本层数组顺序regex_exec；匹配换loc_conf并递归嵌套，DECLINED继续，执行错误ERROR交find_config500。本层noregex或无编译能力不执行该层正则分支，不能称所有location按文件顺序匹配。

   直接源码：`implementation-0` (nginx:src/http/ngx_http_core_module.c:1396–1462)；`runtime-location-regex-failure` (nginx:src/http/ngx_http_core_module.c:960–964)。

4. 条件：查找结果DONE且先前请求检查未提前结束。动作/出口：进入自动重定向，Location头列表分配失败500；有args另分配拼接失败清Location并500；成功finalize301。更新location配置可替换主请求日志、limit_except及content_handler，按实际字段guard消费。

   直接源码：`runtime-location-auto-redirect` (nginx:src/http/ngx_http_core_module.c:979–1040)；`runtime-location-effective-config` (nginx:src/http/ngx_http_core_module.c:1311–1325)；`runtime-location-content-config` (nginx:src/http/ngx_http_core_module.c:1381–1383)。

5. 条件：rewrite改变URI，或实际内容模块请求内部URI跳转。动作/出口：post_rewrite只在uri_changed时减uri_changes，到0为500，否则回server loc_conf并切find-config位置重查。try_files末项实际调用internal_redirect；其减循环计数，到0为500，成功清模块ctx并回server配置、标internal、调用HTTP handler重新进入server rewrite/阶段引擎。

   直接源码：`runtime-location-rewrite-recheck` (nginx:src/http/ngx_http_core_module.c:1044–1083)；`runtime-location-redirect-caller` (nginx:src/http/modules/ngx_http_try_files_module.c:194–214)；`runtime-location-internal-redirect` (nginx:src/http/ngx_http_core_module.c:2499–2550)；`runtime-location-reentry` (nginx:src/http/ngx_http_core_module.c:820–859)。

6. 条件：实际调用named_location，如try_files末项@name。动作/出口：减uri_changes至0或URI空则500；按命名列表精确比较，匹配换loc_conf、清ctx、update并从location rewrite跑阶段，不走URI静态/正则树；未找到500。

   直接源码：`runtime-location-redirect-caller` (nginx:src/http/modules/ngx_http_try_files_module.c:194–214)；`runtime-location-named-consume` (nginx:src/http/ngx_http_core_module.c:2554–2625)。

独立固定文档：`official-doc` (nginx-docs:xml/en/docs/http/ngx_http_core_module.xml:1601–1753)。

补丁范围：final25/B8新增实际静态/正则/命名查找及重查，34补丁无直接修改所选查找/guard/跳转分支。no_error_pages在配置合并/指令入口，不改变本步骤内部跳转实现；未概括完整错误页策略或所有模块路径，原局部unaffected保持。

旧patch完整冻结对象：

```json
{
  "status": "verified_unaffected",
  "note": "实际回放本发行版34项 Nginx 补丁并核对47个最终文件摘要后，所引注册、模块归属、配置回调及实现段保持原文；结论仅覆盖本条所列事实，不表示整个 HTTP 请求链没有补丁影响。",
  "source_ids": [
    "registration",
    "module-owner",
    "configuration-definition",
    "implementation-0",
    "implementation-1",
    "distribution-processing",
    "location-context-create",
    "location-match-definition",
    "location-parent-merge",
    "http-server-merge",
    "server-context-create"
  ]
}
```

### B9 / nginx--ngx_stream_core_module--listen

限定Unix INET TCP：stream listen到socket开启、普通worker accept、本地地址配置和默认会话建立。UDP recvmsg、PROXY协议、完整TLS/SNI和其他后端不在本次闭合范围；不会自动成为HTTP路由。

1. 条件：stream监听配置形成ls/servers地址对象。动作/出口：配置阶段把stream地址列表及init_connection关联到监听；真实cycle调用open_listening_sockets消费相同列表，失败进入cycle failed。只有该生产点不晋级；以下TCP实际消费闭合。

   直接源码：`runtime-stream-listen-addresses` (nginx:src/stream/ngx_stream.c:944–979)；`runtime-stream-listen-handler` (nginx:src/stream/ngx_stream.c:989–1015)；`runtime-listen-open-call` (nginx:src/core/ngx_cycle.c:618–620)。

2. 条件：限定Unix INET TCP监听，非ignore且没有已有效/继承fd。动作/出口：按有效地址和类型创建socket，失败ERROR；新socket的reuseaddr设置失败关socket并ERROR；reuseport仅在NGX_HAVE_REUSEPORT编译能力、ls.reuseport监听开启且!ngx_test_config三条件同时满足时设置，失败关新socket并ERROR。本步不包含旧fd的add_reuseport迁移/失败忽略分支。非IOCP非阻塞失败也关闭返回。bind失败关闭；非EADDRINUSE立即ERROR，正常配置EADDRINUSE标失败重试；最多5次、每次失败等待500ms，最终仍失败ERROR。listen成功保存fd，listen错误对应关闭/重试/ERROR。

   直接源码：`runtime-listen-socket-options` (nginx:src/core/ngx_connection.c:425–564)；`runtime-listen-bind-errors` (nginx:src/core/ngx_connection.c:585–628)；`runtime-listen-activate-retry` (nginx:src/core/ngx_connection.c:652–711)。

3. 条件：普通Unix worker进行监听事件初始化。动作/出口：NGX_HAVE_REUSEPORT且ls.reuseport且ls.worker!=ngx_worker时，发行补丁关闭本worker不使用fd，关闭失败记EMERG，仍置-1后continue。适用监听取连接对象失败ERROR；NGX_WIN32平台分支的#else限定Unix，SOCK_STREAM设置accept handler；reuseport直接add_event，失败ERROR。普通非reuseport若ngx_use_accept_mutex为真则continue延后启用，本次不展开该启用路径；否则NGX_HAVE_EPOLLEXCLUSIVE且EPOLL且worker_processes>1时以EXCLUSIVE注册，其他以普通标志注册，两者失败均ERROR。已注册事件由epoll直接调用或posted accept队列消费。其他后端未展开。

   直接源码：`runtime-listen-worker-activate` (nginx:src/event/ngx_event.c:804–828)；`runtime-listen-reuseport-patch` (openresty:patches/nginx-1.27.1-reuseport_close_unused_fds.patch:17–38)；`runtime-listen-accept-install` (nginx:src/event/ngx_event.c:892–915)；`runtime-listen-epoll-consume` (nginx:src/event/modules/ngx_epoll_module.c:883–903)；`runtime-listen-posted-consume` (nginx:src/event/ngx_event.c:248–255)；`runtime-listen-posted-call` (nginx:src/event/ngx_event_posted.c:18–35)；`runtime-listen-platform-guard` (nginx:src/event/ngx_event.c:856–856)；`runtime-listen-ordinary-register` (nginx:src/event/ngx_event.c:917–943)。

4. 条件：监听读事件到accept，创建接受到的TCP socket。动作/出口：NGX_HAVE_ACCEPT4且use_accept4时补丁使用NONBLOCK|CLOEXEC，否则accept；EAGAIN返回，ENOSYS关闭accept4能力后continue仍须经过循环条件，不保证同次立即fallback。取连接槽/池/地址/日志失败按源码关闭；!inherited_nonblocking且!IOCP并NGX_HAVE_FD_CLOEXEC才执行新增cloexec，失败cleanup返回。

   直接源码：`runtime-listen-accept-errors` (nginx:src/event/ngx_event_accept.c:38–133)；`runtime-listen-cloexec-patch` (openresty:patches/nginx-1.27.1-socket_cloexec.patch:82–113)；`runtime-listen-accept-init` (nginx:src/event/ngx_event_accept.c:139–218)；`runtime-listen-accept-handoff` (nginx:src/event/ngx_event_accept.c:303–319)；`runtime-listen-accept-cleanup` (nginx:src/event/ngx_event_accept.c:482–503)。

5. 条件：accepted TCP连接初始化并交给stream handler。动作/出口：accept实际调用ls.handler；stream用listening.servers选择IPv4或编译支持下IPv6的本地地址配置，多地址getsockname失败调用关闭；无匹配用最后通配地址，单地址取首项。TCP路径不以此证明UDP recvmsg消费。

   直接源码：`runtime-listen-accepted-association` (nginx:src/event/ngx_event_accept.c:206–218)；`runtime-listen-accept-handoff` (nginx:src/event/ngx_event_accept.c:303–319)；`runtime-stream-listen-address-consume` (nginx:src/stream/ngx_stream_handler.c:42–117)。

6. 条件：本地地址已选择，限定默认接入。动作/出口：分配session失败关闭；addr_conf.default_server.ctx提供main/srv_conf，同时保存virtual_names；关联连接后分配ctx/变量失败关闭。普通无PROXY协议路径设置session_handler，并实际直接或posted队列调用，不否认SNI/virtual_names，未展开TLS/UDP。

   直接源码：`runtime-stream-listen-session` (nginx:src/stream/ngx_stream_handler.c:119–205)；`runtime-stream-listen-phase-entry` (nginx:src/stream/ngx_stream_handler.c:287–297)；`runtime-stream-posted-consume` (nginx:src/event/ngx_event.c:263–263)；`runtime-listen-posted-call` (nginx:src/event/ngx_event_posted.c:18–35)。

独立固定文档：`runtime-stream-listen-doc` (nginx-docs:xml/en/docs/stream/ngx_stream_core_module.xml:79–145)。

补丁范围：final25/B9：旧unaffected仅核stream listen声明/参数；新增共用event.c:804–828与accept.c:38–218、303–319消费直接绑定reuseport_close_unused_fds:17–38、socket_cloexec:82–113，因此verified_unaffected→verified_affected；普通默认接入不扩UDP/完整TLS。本项独立重核34补丁，不以stream core未改替代底层判断。

旧patch完整冻结对象：

```json
{
  "status": "verified_unaffected",
  "note": "隔离副本应用发行脚本的 34 项有效补丁后，stream core 文件未变；监听声明、默认传输类型及所列参数校验不变。socket/reuseport 等底层代码另有补丁，不能将本条解释为监听运行时完全等同上游；未运行目标环境。",
  "source_ids": [
    "patch-effective-set",
    "patch-selection",
    "listen-options",
    "udp-limits"
  ]
}
```

### B9 / nginx--ngx_stream_core_module--server

限定普通TCP无PROXY协议的stream默认接入server：本地地址关联default_server配置、session字段到实际阶段和content handler消费及失败终结。固定版本存在virtual_names，不声称没有虚拟主机，不扩完整SNI、SSL preread、UDP或HTTP Host/location。

1. 条件：TCP接入handler按本地监听地址确定addr_conf。动作/出口：多地址先查本地sockaddr，失败关闭；选择addr_conf后分配session失败关闭；default_server.ctx被复制到main/srv_conf，并保存virtual_names。这是配置对象实际被会话消费，不是仅server块解析。

   直接源码：`runtime-stream-server-default-consume` (nginx:src/stream/ngx_stream_handler.c:42–130)。

2. 条件：已关联默认server的会话初始化。动作/出口：使用cscf.error_log选择连接日志；分配ctx和变量失败调用关闭，成功记录会话起始时间并把read.handler设为session_handler。本范围不套HTTP请求或location配置。

   直接源码：`runtime-stream-server-session-init` (nginx:src/stream/ngx_stream_handler.c:140–182)。

3. 条件：无PROXY协议的普通入口；有accept_mutex可posted。动作/出口：init_connection实际调用已装handler，accept_mutex时投普通posted队列返回，事件处理函数实际消费该队列并调用handler；session_handler取c.data并调用core_run_phases。PROXY路径不在本次范围。

   直接源码：`runtime-stream-server-session-call` (nginx:src/stream/ngx_stream_handler.c:180–205)；`runtime-stream-server-posted-consume` (nginx:src/event/ngx_event.c:263–263)；`runtime-stream-server-posted-call` (nginx:src/event/ngx_event_posted.c:18–35)；`runtime-stream-server-run-call` (nginx:src/stream/ngx_stream_handler.c:287–297)。

4. 条件：阶段引擎处理当前会话的有效配置。动作/出口：core_run_phases循环实际checker；generic checker调用ph.handler，OK/DECLINED推进，AGAIN/DONE暂停，ERROR转内部服务器状态再finalize。content checker按有效cscf取handler，SOCK_STREAM tcp_nodelay设置失败或无handler均内部错误终结，否则实际handler(s)。不展开下属代理或TLS/preread全链。

   直接源码：`runtime-stream-server-phases` (nginx:src/stream/ngx_stream_core_module.c:169–227)；`runtime-stream-server-content-consume` (nginx:src/stream/ngx_stream_core_module.c:441–471)；`runtime-stream-server-phase-install` (nginx:src/stream/ngx_stream.c:354–386)。

5. 条件：前述失败到finalize_session。动作/出口：记录会话内部status，执行LOG数组，再关闭连接；不是HTTP响应码。限定未启用TLS的普通close会清连接并销毁pool；SSL shutdown等待分支只作为范围外，不冒称本步已核TLS清理。

   直接源码：`runtime-stream-server-finalize` (nginx:src/stream/ngx_stream_handler.c:301–329)；`runtime-stream-server-close` (nginx:src/stream/ngx_stream_handler.c:333–371)。

独立固定文档：`runtime-stream-server-doc` (nginx-docs:xml/en/docs/stream/ngx_stream_core_module.xml:478–497)。

补丁范围：final25/B9新增默认配置→session→phase/content实际消费；34补丁未直接改所选默认接入/通用阶段/content/普通关闭分支。保留原局部unaffected；stream_ssl_preread_no_skip、stream_proxy_timeout_fields及TLS yield不被默认为本server全链已审。

旧patch完整冻结对象：

```json
{
  "status": "verified_unaffected",
  "note": "已按 OpenResty 1.27.1.1 发行脚本在隔离源码副本应用 34 项有效 Nginx 补丁；stream core 文件逐字节未变。本结论仅覆盖这里列出的结构与配置入口事实，不表示全部运行时或其他 Nginx 指令不受补丁影响；未编译或运行 OpenResty。",
  "source_ids": [
    "patch-effective-set",
    "patch-selection",
    "server-create"
  ]
}
```

### B10 / nginx--ngx_http_core_module--client_max_body_size

限定HTTP/1请求：find_config对声明Content-Length的检查，以及被实际读正文路径调用的chunked累计检查；0关闭大小检查。HTTP/2、HTTP/3独立正文实现、全部正文存储/丢弃策略未纳入本次范围。

1. 条件：find_config匹配有效location并通过先前查找/内部位置检查后。动作/出口：已知content_length_n!=-1、未discard_body且client_max_body_size非0且声明长度更大才拒绝；设置expect_tested，调用discard但忽略其返回，然后finalize413并停止阶段。0不作该限额判断；声明长度不是预分配内存。

   直接源码：`runtime-body-declared-length` (nginx:src/http/ngx_http_core_module.c:952–998)；`runtime-body-declared-discard` (nginx:src/http/ngx_http_request_body.c:630–705)。

2. 条件：内容处理器实际请求读取HTTP/1正文。动作/出口：例如proxy handler调用read_client_request_body，特殊返回码传回内容阶段finalize；子请求/已有body/discard则调用post_handler后直接OK。HTTP/2/3走独立分支，不以本chunked链覆盖；HTTP/1读取把recv数据送body_filter，非OK直接回传。

   直接源码：`runtime-body-read-caller` (nginx:src/http/modules/ngx_http_proxy_module.c:1023–1029)；`runtime-body-content-result` (nginx:src/http/ngx_http_core_module.c:1252–1273)；`runtime-body-read-guard` (nginx:src/http/ngx_http_request_body.c:43–59)；`runtime-body-protocol-branches` (nginx:src/http/ngx_http_request_body.c:86–108)；`runtime-body-filter-call` (nginx:src/http/ngx_http_request_body.c:399–409)；`runtime-body-filter-dispatch` (nginx:src/http/ngx_http_request_body.c:988–997)。

3. 条件：HTTP/1 chunked filter实际解析出NGX_OK的chunk。动作/出口：初次chunked状态分配失败立即返回500；分配成功后才把content_length_n归0。按有效clcf大小非0且max-累计长度<chunk_size判超限，设lingering_close后返回413，不先接收整chunk；普通分支按实际复制字节更新累计长度，零值跳过限额，不表示跳过chunk语法校验。

   直接源码：`runtime-body-chunk-limit` (nginx:src/http/ngx_http_request_body.c:1088–1155)；`runtime-body-chunk-account` (nginx:src/http/ngx_http_request_body.c:1157–1215)。

4. 条件：正文过滤返回超限、分配失败或无效chunk。动作/出口：空闲chain buffer分配失败500，无效chunk400；读循环把非OK回传。同步read函数对特殊码减main.count并返回，由调用方/content finalize；已装read_handler异步收到特殊码直接finalize。拒绝不保证最终内置错误页或固定连接关闭方式，chunked超限只是标lingering_close。

   直接源码：`runtime-body-chunk-buffer-failure` (nginx:src/http/ngx_http_request_body.c:1178–1183)；`runtime-body-chunk-invalid` (nginx:src/http/ngx_http_request_body.c:1250–1267)；`runtime-body-filter-call` (nginx:src/http/ngx_http_request_body.c:399–409)；`runtime-body-read-return` (nginx:src/http/ngx_http_request_body.c:198–228)；`runtime-body-read-caller` (nginx:src/http/modules/ngx_http_proxy_module.c:1023–1029)；`runtime-body-content-result` (nginx:src/http/ngx_http_core_module.c:1252–1273)；`runtime-body-async-finalize` (nginx:src/http/ngx_http_request_body.c:275–291)；`runtime-body-limit-lingering` (nginx:src/http/ngx_http_request_body.c:1142–1155)。

独立固定文档：`official-doc` (nginx-docs:xml/en/docs/http/ngx_http_core_module.xml:453–472)。

补丁范围：final25/B10新增HTTP/1声明/实际chunked大小消费与回传；34补丁无直接修改这些检查/正文filter/所选调用。无no_error_pages最终内容承诺，不扩HTTP2/3实现，原局部unaffected保持。

旧patch完整冻结对象：

```json
{
  "status": "verified_unaffected",
  "note": "实际回放本发行版34项 Nginx 补丁并核对47个最终文件摘要后，所引用的注册、模块归属、配置回调及实现段均保持原文；此结论只覆盖这里列出的事实，不表示整个 HTTP 请求链没有补丁影响。",
  "source_ids": [
    "registration",
    "module-owner",
    "configuration-definition",
    "implementation-0",
    "implementation-1",
    "implementation-2",
    "distribution-processing"
  ]
}
```

### B10 / nginx--ngx_http_core_module--keepalive_timeout

限定HTTP/1普通客户端连接在请求结束后的keepalive：有效开关/保留条件、pipeline与空闲timer、下一请求及超时关闭；第二参数只为响应头提示，不是同一timer。非上游keepalive或整请求超时；TLS完整关闭未展开。

1. 条件：HTTP/1请求有效配置更新且r.keepalive原本为真。动作/出口：原始Connection/协议确定keepalive；timeout=0、请求数量或keepalive_time门槛、配置的MSIE6 POST或Safari条件可再清keepalive。第一参数0关闭，不保证大于0即一定保留。

   直接源码：`runtime-keepalive-protocol` (nginx:src/http/ngx_http_core_module.c:826–839)；`runtime-keepalive-effective-gates` (nginx:src/http/ngx_http_core_module.c:1340–1374)。

2. 条件：请求结束进入finalize_connection。动作/出口：EOF先关，仍在读body清keepalive并设lingering；只有非terminate、非exiting、r.keepalive且timeout>0才实际set_keepalive；否则可走lingering_close或close_request，不称一律立即关socket。

   直接源码：`runtime-keepalive-finalize-call` (nginx:src/http/ngx_http_request.c:2789–2822)。

3. 条件：set_keepalive已有读入的pipeline剩余字节。动作/出口：先保存必要header buffer，分配chain失败close_request；清当前keepalive防递归并free_request，再读事件注册失败关闭；有剩余字节创建新请求，失败关闭，删旧read timer，装process_request_line并post，直接返回，不进入空闲timeout路径。

   直接源码：`runtime-keepalive-pipeline` (nginx:src/http/ngx_http_request.c:3118–3208)。

4. 条件：没有pipeline剩余且普通TCP准备空闲。动作/出口：经过pipeline提前return后设置read.handler=keepalive_handler；level事件移除失败关闭，tcp_push或满足条件的tcp_nodelay失败关闭。c.idle=1并标reusable，加read timer=clcf.keepalive_timeout；read已ready则投posted队列。这是请求结束后的闲置期限。

   直接源码：`runtime-keepalive-pipeline-guard` (nginx:src/http/ngx_http_request.c:3181–3208)；`runtime-keepalive-value-context` (nginx:src/http/ngx_http_request.c:3109–3112)；`runtime-keepalive-idle-timer` (nginx:src/http/ngx_http_request.c:3268–3310)。

5. 条件：read timer到期或下次读事件触发keepalive_handler。动作/出口：实际到期机制清timer_set、标timedout并调用已装handler；timedout或c.close直接关闭。buffer重新分配失败关闭；recv AGAIN注册读事件失败关闭，否则等待；ERROR/EOF关闭；成功清idle/reusable，创建请求失败关闭，删timer并直接处理下一请求行。普通非TLS close清连接并销毁pool。

   直接源码：`runtime-keepalive-timer-expire` (nginx:src/event/ngx_event_timer.c:53–96)；`runtime-keepalive-handler-install` (nginx:src/http/ngx_http_request.c:3268–3268)；`runtime-keepalive-timeout-close` (nginx:src/http/ngx_http_request.c:3315–3329)；`runtime-keepalive-next-request` (nginx:src/http/ngx_http_request.c:3351–3442)；`runtime-keepalive-close-helper` (nginx:src/http/ngx_http_request.c:3813–3846)。

6. 条件：HTTP/1头过滤且status不是101，r.keepalive为真。动作/出口：写Connection: keep-alive；只有keepalive_header非0才写第二参数Keep-Alive: timeout提示；未keepalive写close。第二参数不设置连接timer，也不约束上游复用。

   直接源码：`runtime-keepalive-response-hint` (nginx:src/http/ngx_http_header_filter_module.c:558–574)。

独立固定文档：`official-doc` (nginx-docs:xml/en/docs/http/ngx_http_core_module.xml:986–1012)。

补丁范围：final25/B10新增HTTP/1请求结束/idle/下一请求、独立timer expire和响应头提示；不引用整段process_events_and_timers，因此delayed_posted_events未直接改所选消费，server_header改品牌常量不改hint分支，原局部unaffected保持。

旧patch完整冻结对象：

```json
{
  "status": "verified_unaffected",
  "note": "实际回放本发行版34项 Nginx 补丁并核对47个最终文件摘要后，所引用的注册、模块归属、配置回调及实现段均保持原文；此结论只覆盖这里列出的事实，不表示整个 HTTP 请求链没有补丁影响。",
  "source_ids": [
    "registration",
    "module-owner",
    "configuration-definition",
    "implementation-0",
    "implementation-1",
    "implementation-2",
    "implementation-3",
    "distribution-processing"
  ]
}
```

### B11 / nginx--ngx_http_core_module--sendfile

限定Linux普通非TLS、无AIO/线程任务的文件响应输出：有效sendfile标志→copy/output链→write filter→Linux sendfile系统调用；内存复制、directio与TLS/线程独立分支作边界，不保证所有输出零拷贝。

1. 条件：有效HTTP location配置应用于连接，Linux具备sendfile能力。动作/出口：只有ngx_io.flags含NGX_IO_SENDFILE且clcf.sendfile才置c.sendfile=1，否则0；Linux OS表按NGX_HAVE_SENDFILE选择sendfile_chain或writev，epoll初始化取OS表，接受连接的send_chain取ngx_io。不是配置on就无条件执行系统调用。

   直接源码：`runtime-sendfile-effective-flag` (nginx:src/http/ngx_http_core_module.c:1320–1325)；`runtime-sendfile-linux-io-table` (nginx:src/os/unix/ngx_linux_init.c:16–30)；`runtime-sendfile-os-io-install` (nginx:src/os/unix/ngx_linux_init.c:49–51)；`runtime-sendfile-event-io-install` (nginx:src/event/modules/ngx_epoll_module.c:364–369)；`runtime-sendfile-io-macros` (nginx:src/event/ngx_event.h:414–422)；`runtime-sendfile-connection-io` (nginx:src/event/ngx_event_accept.c:206–214)。

2. 条件：响应实际进入copy filter，首次创建ctx。动作/出口：HTTP output_filter调用body过滤链；copy模块挂入top链并保存next，copy handler分配ctx失败ERROR，把c.sendfile、need_in_memory/temp与输出filter放ctx，实际调用output_chain。TLS握手成功会改c.send_chain为SSL函数，本次不把TLS当直接Linux路径；AIO/线程设置只标范围外。

   直接源码：`runtime-sendfile-output-call` (nginx:src/http/ngx_http_core_module.c:1854–1872)；`runtime-sendfile-copy-install` (nginx:src/http/ngx_http_copy_filter_module.c:388–397)；`runtime-sendfile-copy-consume` (nginx:src/http/ngx_http_copy_filter_module.c:88–157)；`runtime-sendfile-tls-boundary` (nginx:src/event/ngx_event_openssl.c:1834–1837)。

3. 条件：output_chain判断buffer能否原样传递，或需要复制。动作/出口：特殊buffer可原样；消费ctx.sendfile，在NGX_SENDFILE_LIMIT边界及无NODISKIO能力的directio条件下关闭本buffer sendfile；need_in_memory/temp可要求复制。不需复制单buf直接调next；需复制时分配/复制失败ERROR，普通无AIO/thread文件读入内存，读错误或短读ERROR；是否保留in_file还受实际sendfile标志。

   直接源码：`runtime-sendfile-fast-path` (nginx:src/core/ngx_output_chain.c:48–80)；`runtime-sendfile-buffer-decisions` (nginx:src/core/ngx_output_chain.c:250–305)；`runtime-sendfile-copy-dispatch` (nginx:src/core/ngx_output_chain.c:162–241)；`runtime-sendfile-copy-fallback` (nginx:src/core/ngx_output_chain.c:506–644)。

4. 条件：所列普通Linux输出最终到write filter，文件buf可发送。动作/出口：write filter实际调用c.send_chain，CHAIN_ERROR置连接error并返回ERROR；Linux chain写事件未ready返回未完成链，先处理内存iovec；仅没有内存头、后续filebuf且限额剩余时coalesce并调sendfile，其他为writev。本步不保证过滤链之间没有其他模块。

   直接源码：`runtime-sendfile-write-filter-call` (nginx:src/http/ngx_http_write_filter_module.c:294–307)；`runtime-sendfile-linux-ready` (nginx:src/os/unix/ngx_linux_sendfile_chain.c:50–93)；`runtime-sendfile-linux-dispatch` (nginx:src/os/unix/ngx_linux_sendfile_chain.c:162–228)。

5. 条件：Linux file发送，NGX_THREADS下无file.thread_handler。动作/出口：有thread_handler则独立线程分支，本次不展开；否则sendfile(fd,filefd,offset,size)。EAGAIN返回AGAIN，EINTR重试，其他错误置write.error并ERROR，0视截断ERROR。chain层错误转CHAIN_ERROR；按实际sent更新file/链，AGAIN清ready并保留未发链，短写继续至限额/链结束；不承诺零拷贝或全部已发。

   直接源码：`runtime-sendfile-syscall-result` (nginx:src/os/unix/ngx_linux_sendfile_chain.c:231–300)；`runtime-sendfile-short-write-consume` (nginx:src/os/unix/ngx_linux_sendfile_chain.c:177–228)；`runtime-sendfile-write-filter-call` (nginx:src/http/ngx_http_write_filter_module.c:294–307)。

独立固定文档：`official-doc` (nginx-docs:xml/en/docs/http/ngx_http_core_module.xml:2382–2421)。

补丁范围：final25/B11新增Linux普通文件输出及copy/directio/TLS边界；34补丁不直接改所选标志/copy/output/write_filter/Linux sendfile分支。SSL三yield在shared握手等待，未改所引成功后send_chain赋值；未纳helper线程池初始化，原局部unaffected保持。

旧patch完整冻结对象：

```json
{
  "status": "verified_unaffected",
  "note": "实际回放本发行版34项 Nginx 补丁并核对47个最终文件摘要后，所引用的注册、模块归属、配置回调及实现段均保持原文；此结论只覆盖这里列出的事实，不表示整个 HTTP 请求链没有补丁影响。",
  "source_ids": [
    "registration",
    "module-owner",
    "configuration-definition",
    "implementation-0",
    "implementation-1",
    "distribution-processing"
  ]
}
```

### B11 / nginx--ngx_http_core_module--default_type

限定调用ngx_http_set_content_type的实际内容处理路径：已有类型不覆盖，扩展名MIME查找，未命中取有效default_type；不是所有响应的无条件Content-Type覆盖。

1. 条件：静态文件content handler已准备响应字段后。动作/出口：实际调用set_content_type，失败返回500；content阶段调用handler并finalize返回值。配置默认类型本身不生成响应；只闭合该调用者，不扩大代理上游或内置错误页的类型策略。

   直接源码：`runtime-default-type-static-caller` (nginx:src/http/modules/ngx_http_static_module.c:229–239)；`runtime-default-type-content-result` (nginx:src/http/ngx_http_core_module.c:1252–1273)。

2. 条件：set_content_type进入，headers_out已有非空类型。动作/出口：已有类型立即OK；否则取有效clcf。有扩展名时计算hash，遇大写先分配小写副本，失败ERROR回调用者500；有效MIME表命中填入类型并OK，不使用fallback。

   直接源码：`runtime-default-type-mime-consume` (nginx:src/http/ngx_http_core_module.c:1594–1640)；`runtime-default-type-failure-caller` (nginx:src/http/modules/ngx_http_static_module.c:237–239)。

3. 条件：无扩展名或types_hash未命中。动作/出口：headers_out.content_type_len/content_type取clcf.default_type，返回OK；没有另分配。只兜底，不覆盖其他处理器已经设置类型。

   直接源码：`runtime-default-type-fallback` (nginx:src/http/ngx_http_core_module.c:1602–1646)。

独立固定文档：`official-doc` (nginx-docs:xml/en/docs/http/ngx_http_core_module.xml:495–508)。

补丁范围：final25/B11新增真实static→set_content_type及MIME/fallback/失败；34补丁未直接改所选消费。no_error_pages只改变相邻error_pages配置merge，不改变default_type语义，原局部unaffected保持。

旧patch完整冻结对象：

```json
{
  "status": "verified_unaffected",
  "note": "实际回放本发行版34项 Nginx 补丁并核对47个最终文件摘要后，所引用的注册、模块归属、配置回调及实现段均保持原文；此结论只覆盖这里列出的事实，不表示整个 HTTP 请求链没有补丁影响。",
  "source_ids": [
    "registration",
    "module-owner",
    "configuration-definition",
    "implementation-0",
    "implementation-1",
    "distribution-processing"
  ]
}
```

### B11 / nginx--ngx_http_core_module--server_tokens

限定HTTP/1响应Server头及进入内置错误页时的server_tokens消费；HTTP/2/3原有事实保留，本次不扩其完整运行链。OpenResty品牌/版本替换、错误页页脚和no_error_pages有效数组分别解释；off不是删除Server头。

1. 条件：发送HTTP/1主请求响应头，进入实际header filter。动作/出口：send_header经top_header_filter实际调用；post_action跳过、已发头ERROR，header filter自身已发头/子请求/HTTP<1.0提前返回。仅未有headers_out.server时计算自动头长度，按on/build/off选品牌字符串。

   直接源码：`runtime-tokens-header-call` (nginx:src/http/ngx_http_core_module.c:1832–1850)；`runtime-tokens-header-install` (nginx:src/http/ngx_http_header_filter_module.c:628–634)；`runtime-tokens-header-guards` (nginx:src/http/ngx_http_header_filter_module.c:172–188)；`runtime-tokens-header-length` (nginx:src/http/ngx_http_header_filter_module.c:284–296)。

2. 条件：HTTP/1自动Server头缺失，分配响应buffer并写头。动作/出口：buffer分配失败ERROR；按on取NGINX_VER，build取NGINX_VER_BUILD，off取无版本字符串。server_header品牌补丁将品牌改为openresty；宏值的品牌版本来源由原配置/发行事实解释，本步只核运行代码及品牌patch实际消费。build仅在NGX_BUILD存在时追加构建信息，off仍写Server: openresty。

   直接源码：`runtime-tokens-header-write` (nginx:src/http/ngx_http_header_filter_module.c:438–470)；`runtime-tokens-header-strings` (nginx:src/http/ngx_http_header_filter_module.c:49–51)；`runtime-tokens-version-macros` (nginx:src/core/nginx.h:12–20)；`runtime-tokens-brand-patch` (openresty:patches/nginx-1.27.1-server_header.patch:1–26)。

3. 条件：已有自定义Server头或头buffer已生成。动作/出口：已有server对象跳过自动生成；通用header列表仅写hash非0项，不保证自定义项一定发出。最终header buffer调用write filter，错误按返回值传播。本范围不把外部定制响应头套成自动品牌规则。

   直接源码：`implementation-1` (nginx:src/http/ngx_http_header_filter_module.c:455–470)；`runtime-tokens-custom-header-output` (nginx:src/http/ngx_http_header_filter_module.c:598–607)；`runtime-tokens-header-output` (nginx:src/http/ngx_http_header_filter_module.c:612–624)；`runtime-tokens-output-error` (nginx:src/http/ngx_http_write_filter_module.c:294–307)。

4. 条件：finalize特殊状态进入special_response_handler。动作/出口：实际调用错误处理器；先按有效clcf.error_pages、r.error_page与uri_changes决定是否走自定义错误页。no_error_pages补丁把本层有效数组显式NULL并用pointer merge继承/默认，冲突检查在配置期；因此可跳过自定义错误页，但不是关闭内置错误正文。自定义/refresh返回不套下面builtin尾部；本次不展开这些目标处理器。

   直接源码：`runtime-tokens-special-response-call` (nginx:src/http/ngx_http_request.c:2544–2568)；`runtime-tokens-error-page-selection` (nginx:src/http/ngx_http_special_response.c:452–483)；`runtime-tokens-no-error-pages-patch` (openresty:patches/nginx-1.27.1-no_error_pages.patch:28–86)；`runtime-tokens-upstream-error-merge` (nginx:src/http/ngx_http_core_module.c:3779–3784)；`runtime-tokens-builtin-call` (nginx:src/http/ngx_http_special_response.c:518–524)。

5. 条件：进入send_special_response且所选内置错误正文非空。动作/出口：按server_tokens选full/build/short tail；server_header品牌补丁影响full/build，品牌版本由原配置/发行事实解释，发行脚本不作直接运行源码；builtin_error_page_footer把short尾nginx换openresty。空正文不实际发送尾部；HEAD或send_header ERROR提前返回，正文与tail buffer分配失败ERROR，成功拼链调用output_filter。非内置内容不保证有这些尾部。

   直接源码：`runtime-tokens-builtin-output` (nginx:src/http/ngx_http_special_response.c:672–784)；`implementation-4` (nginx:src/http/ngx_http_special_response.c:21–38)；`runtime-tokens-error-brand-patch` (openresty:patches/nginx-1.27.1-server_header.patch:1–13)；`builtin-footer-patch` (openresty:patches/nginx-1.27.1-builtin_error_page_footer.patch:1–13)；`runtime-tokens-body-output-error` (nginx:src/http/ngx_http_core_module.c:1854–1872)。

独立固定文档：`official-doc` (nginx-docs:xml/en/docs/http/ngx_http_core_module.xml:2666–2698)。

补丁范围：final25/B11新增HTTP1头/内置错误页消费；server_header:1–26与发行minor替换、builtin_error_page_footer:1–13直接改变输出字串，no_error_pages:28–86改变有效error_pages数组→special_response:456的自定义分流。原affected保持；不扩HTTP2/3、全部error_page目标或自定义头策略。

旧patch完整冻结对象：

```json
{
  "status": "verified_affected",
  "note": "实际回放34项补丁并核对47个最终文件摘要：server_header 与发行脚本版本替换改变 HTTP/1、HTTP/2 的标识及 NGINX_VER，builtin_error_page_footer 改变内建错误页的无版本尾部；HTTP/3 off 分支仍为字面 nginx。公开引用保留上游与原补丁各自坐标。",
  "source_ids": [
    "registration",
    "module-owner",
    "configuration-definition",
    "implementation-0",
    "implementation-1",
    "implementation-2",
    "implementation-3",
    "implementation-4",
    "implementation-5",
    "distribution-processing",
    "server-header-patch",
    "builtin-footer-patch",
    "version-substitution",
    "merge-default"
  ]
}
```

## 34补丁最终矩阵

固定OpenResty Git对象内34补丁原文及142 hunk全部核对，覆盖21个Nginx身份最终runtime消费区间；下表是最终判定，没有留待后续组的占位结论。每项完整hunk位置与原文摘要列在后附清单。发行脚本util/mirror-tarballs:35–550的版本条件/顺序、161–165的server_header minor_ver=1替换已核；历史回放/字节摘要保留，不冒称本轮重放。未展开的内部调用不能用于扩张unaffected结论。

| 固定补丁 | hunk数 | 最终消费/hunk判定 |
| --- | ---: | --- |
| win32_max_err_str | 1 | hunk5仅Windows事件日志缓冲上限；三error_log运行范围限定Unix，未展开Windows writer，不新增直接交集。 |
| stream_balancer_export | 4 | 4 hunk导出stream round-robin会话/通知符号及声明；listen/server默认会话阶段不展开上游balancer，无直接交集。 |
| stream_proxy_get_next_upstream_tries | 2 | 2 hunk新增stream getter/声明；本次无stream proxy重试消费，无直接交集。 |
| stream_proxy_timeout_fields | 16 | 16 hunk为stream上游超时字段/初始化、连接与转发计时；本次stream core阶段只核checker和content_handler指针调用，不展开proxy内部，无直接交集。 |
| stream_ssl_preread_no_skip | 1 | hunk5改SSL preread handler；stream server明确限定默认接入，不展开该模块内部，不把通用phase checker等同此handler，无直接交集。 |
| resolver_conf_parsing | 3 | 3 hunk解析resolver文件/创建nameserver；本次21项无resolver_create消费，无直接交集。 |
| daemon_destroy_pool | 1 | hunk5改daemon父进程退出前释放pool；pid范围为main后续create、master重配/改名/删除，不声称daemon生命周期，无直接交集。 |
| init_cycle_pool_release | 5 | 5 hunk保存init_cycle pool并在cycle/master尾部释放；pid所选main创建、cycle:318–345路径切换及process_cycle:655–662删除不含补丁的pool动作。普通重开/监听也未引用cycle:748释放动作，无直接改写。 |
| balancer_status_code | 5 | 5 hunk为HTTP/stream connect特殊status和符号声明；rate仅绑定upstream:1581–1593读事件handler，不包含HTTP connect内较早特殊status分支；stream默认会话不展开proxy，无直接交集。 |
| builtin_error_page_footer | 1 | hunk5直接把special_response短tail中的nginx改为openresty；server_tokens第5步绑定patch:1–13和special_response:672–784内置页尾选择/输出，保留affected。其他身份不展开内置错误页。 |
| delayed_posted_events | 6 | 6 hunk新增delayed队列、poll计时与遍历。listen/stream server引用event:248–255原accept队列及263原普通队列调用，263虽在hunk29上下文但未改该调用；posted.c普通handler循环未改。rate自身read_event.delayed与keepalive独立expire:53–96不等于新队列。不声称整事件调度无影响，所选动作无直接改写。 |
| privileged_agent_process | 15 | 15 hunk配置/声明、master新增启动调用、helper循环与降权条件；pid的process_cycle:223–229仅重配init_cycle失败guard，新增agent启动在该分支其他位置；reap/PID文件动作未改。三error_log仅普通master/worker重开，listen仅普通worker，不展开agent新增循环/降权，无新增直接交集。 |
| privileged_agent_process_connections | 6 | 6 hunk设置agent连接数/配置、helper socket缩减；普通worker监听和pid文件步骤未取这些helper动作，无直接交集。 |
| privileged_agent_process_thread_pool | 1 | hunk3新增agent线程池guard；sendfile限定无线程任务，未展开thread pool初始化，无直接交集。 |
| single_process_graceful_exit | 3 | 3 hunk修改single进程signal/退出循环；pid、error_log明确普通master-worker，不展开single，无直接交集。 |
| intercept_error_log | 4 | 4 hunk为cycle字段及log核心。三error_log实际调用到log:106–159，patch:35–60增加条件回调及递归guard，保留affected。其他步骤只保留各自logger调用，不宣称公共输出内部完整消费。 |
| upstream_pipelining | 1 | hunk15改send_request_handler在header_sent后的条件；rate缓冲读响应、body_read的proxy调用不展开send_request_handler，无直接交集。 |
| server_header | 3 | 3 hunk分别nginx.h品牌/版本宏、HTTP1默认Server短字符串、HTTP2字符串。server_tokens步骤2/5直接消费前两处，保留affected；util/mirror-tarballs:161–165 minor_ver=1替换属于既有发行事实，不列为直接runtime源码；HTTP2旧事实保留不新扩链。keepalive_header提示分支未改，off仍输出品牌而非删除。 |
| no_error_pages | 7 | 7 hunk配置生产error_pages的UNSET_PTR、merge及no_error_pages置NULL/冲突。server_tokens步骤4以patch:28–86、core:3779–3784绑定生产端和special_response:452–483数组消费，保留affected。location路由及default_type未把相邻配置merge当改写自身消费；正文413不承诺最终内置页。 |
| no_Werror | 3 | 3 hunk仅auto/cc编译告警参数；本次不build，不改变运行消费判断。 |
| log_escape_non_ascii | 10 | 10 hunk仅HTTP日志配置字段/入口及默认getlen/run/escape。HTTP log_format/access_log默认ops直接绑定patch:38–117，保留affected；JSON/none未改，stream使用自身表，无直接交集。 |
| proxy_host_port_vars | 1 | hunk3仅proxy_host/proxy_port变量注册flags；rate求值及proxy实际body_read调用未消费这两变量，无直接交集。 |
| cache_manager_exit | 1 | hunk11仅cache_manager循环退出条件；pid普通master文件动作、普通worker日志重开不扩cache manager循环，无直接交集。 |
| larger_max_error_str | 1 | hunk3对未预定义NGX_MAX_ERROR_STR的默认值设4096；三error_log实际log核心栈缓冲/格式化绑定头宏patch:1–10，保留affected，不称所有构建恒为4096。其他身份不新展开公共logger核心。 |
| pcre_conf_opt | 2 | 2 hunk仅auto/options提供PCRE配置选项；server/location保留NGX_PCRE实际编译guard，不据此保证构建能力，本次无运行改写。 |
| always_enable_cc_feature_tests | 1 | hunk3只改compiler feature test开关；sendfile明确Linux路径/能力条件，不把探测改变当现场能力，无直接运行改写。 |
| ssl_cert_cb_yield | 2 | 2 hunk shared SSL handshake/early_data等待；HTTP server仅SNI回调配置选择，listen仅SSL handler覆盖边界，sendfile仅openssl:1834–1837成功后的send_chain设置，不展开shared等待，无直接交集。 |
| ssl_sess_cb_yield | 2 | 2 hunk shared SSL握手/early_data会话等待；同上限定SNI配置选择及成功I/O赋值，未包含改写等待分支，无直接交集。 |
| ssl_client_hello_cb_yield | 2 | 2 hunk shared握手/early_data ClientHello等待；同上不扩shared握手，所选SNI/config/I/O赋值未改，无直接交集。 |
| upstream_timeout_fields | 10 | 10 hunk初始化u的独立超时字段并替换各计时来源。rate范围不含upstream:3336的p.read_timeout赋值，3340–3353仅其后读handler安装，event_pipe读计时只消费既有pipe字段；不声称完整upstream不受影响。其他身份不展开这些上游超时生产/计时，无新增直接改写。 |
| safe_resolver_ipv6_option | 3 | 3 hunk resolver_create IPv6选项及非法参数处理；无所选resolver配置消费，无直接交集。 |
| socket_cloexec | 10 | 10 hunk完整核验；两listen步骤4直接交accept4 flags hunk86及fcntl hunk97，绑定patch:82–113和accept:38–218外层条件/cleanup。因此仅两listen按主认可白名单unaffected→affected。其余8 hunk为探测、resolver/connect、event字段、worker漏检与宏；sendfile accept:206–214仅I/O赋值不含新增fcntl前置块，pid未纳worker漏检，其他身份不扩这些内部动作。 |
| reuseport_close_unused_fds | 2 | 2 hunk完整核验；两listen步骤3的event:804–828交hunk20，绑定patch:17–38，NGX_HAVE_REUSEPORT且本监听reuseport且worker不匹配才关闭/置-1/continue，主认可两项迁移。hunk4 close_listening的-1跳过未被其他身份当完整生命周期消费；新socket options仍需自身三条件，旧fd迁移不混同。 |
| proc_exit_handler | 7 | 7 hunk声明hook、init重设及process.c状态收割callback；pid实际process_cycle.c:559–615是exited/respawn门控而非process.c:564的hook，文件恢复/删除未改。普通日志重开与listen也不展开hook，无直接交集。 |

### 34份原文摘要及142个hunk完整清单

下述行号为固定OpenResty补丁文件行，不将hunk旧坐标误当最终nginx源码行。各hunk的作用与21项交集以最终矩阵判定为准；上下文出现不等于动作被改写。

#### win32_max_err_str

固定文件：`patches/nginx-1.27.1-win32_max_err_str.patch`；原文SHA-256：`04c15411f9d66f33accd9c9edd14fe02facd4ed671ed3a4ec6e7b9c6680850e4`。

- 补丁行5，目标 `src/os/win32/ngx_event_log.c`，`@@ -8,7 +8,9 @@`。

#### stream_balancer_export

固定文件：`patches/nginx-1.27.1-stream_balancer_export.patch`；原文SHA-256：`6492a6c2eadeea4f7731efedff5920804e25bfcc033744e72aa3e96f294e658d`。

- 补丁行5，目标 `src/stream/ngx_stream_upstream_round_robin.c`，`@@ -21,10 +21,6 @@ static void ngx_stream_upstream_notify_round_robin_peer(`。
- 补丁行16，目标 `src/stream/ngx_stream_upstream_round_robin.c`，`@@ -690,7 +686,7 @@ ngx_stream_upstream_notify_round_robin_peer(ngx_peer_connection_t *pc,`。
- 补丁行25，目标 `src/stream/ngx_stream_upstream_round_robin.c`，`@@ -756,7 +752,7 @@ ngx_stream_upstream_set_round_robin_peer_session(ngx_peer_connection_t *pc,`。
- 补丁行38，目标 `src/stream/ngx_stream_upstream_round_robin.h`，`@@ -142,5 +142,15 @@ ngx_int_t ngx_stream_upstream_get_round_robin_peer(ngx_peer_connection_t *pc,`。

#### stream_proxy_get_next_upstream_tries

固定文件：`patches/nginx-1.27.1-stream_proxy_get_next_upstream_tries.patch`；原文SHA-256：`00f5a57d3784592f99d2340bf42f31923f31ff107275c213aadaf854ca066be9`。

- 补丁行5，目标 `src/stream/ngx_stream.h`，`@@ -303,4 +303,7 @@ typedef ngx_int_t (*ngx_stream_filter_pt)(ngx_stream_session_t *s,`。
- 补丁行17，目标 `src/stream/ngx_stream_proxy_module.c`，`@@ -2156,3 +2156,14 @@ ngx_stream_proxy_bind(ngx_conf_t *cf, ngx_command_t *cmd, void *conf)`。

#### stream_proxy_timeout_fields

固定文件：`patches/nginx-1.27.1-stream_proxy_timeout_fields.patch`；原文SHA-256：`6cfe6a6d50eed61e7362a9d07b8a84987fe2aa204e19c35f9f5b3232ee6eb200`。

- 补丁行4，目标 `src/stream/ngx_stream.h`，`@@ -254,6 +254,15 @@ typedef struct {`。
- 补丁行20，目标 `src/stream/ngx_stream.h`，`@@ -307,6 +316,7 @@ void ngx_stream_finalize_session(ngx_str`。
- 补丁行31，目标 `src/stream/ngx_stream_proxy_module.c`，`@@ -400,6 +400,7 @@ ngx_stream_proxy_handler(ngx_stream_sess`。
- 补丁行39，目标 `src/stream/ngx_stream_proxy_module.c`，`@@ -408,6 +409,17 @@ ngx_stream_proxy_handler(ngx_stream_sess`。
- 补丁行57，目标 `src/stream/ngx_stream_proxy_module.c`，`@@ -699,6 +711,7 @@ ngx_stream_proxy_connect(ngx_stream_sess`。
- 补丁行65，目标 `src/stream/ngx_stream_proxy_module.c`，`@@ -706,6 +719,8 @@ ngx_stream_proxy_connect(ngx_stream_sess`。
- 补丁行74，目标 `src/stream/ngx_stream_proxy_module.c`，`@@ -774,7 +789,7 @@ ngx_stream_proxy_connect(ngx_stream_sess`。
- 补丁行83，目标 `src/stream/ngx_stream_proxy_module.c`，`@@ -957,12 +957,14 @@ ngx_stream_proxy_init_upstream(ngx_stream_session_t *s)`。
- 补丁行104，目标 `src/stream/ngx_stream_proxy_module.c`，`@@ -976,9 +993,7 @@ ngx_stream_proxy_send_proxy_protocol(ngx`。
- 补丁行115，目标 `src/stream/ngx_stream_proxy_module.c`，`@@ -1053,6 +1068,9 @@ ngx_stream_proxy_ssl_init_connection(ngx`。
- 补丁行125，目标 `src/stream/ngx_stream_proxy_module.c`，`@@ -1099,7 +1117,7 @@ ngx_stream_proxy_ssl_init_connection(ngx`。
- 补丁行134，目标 `src/stream/ngx_stream_proxy_module.c`，`@@ -1408,6 +1426,7 @@ ngx_stream_proxy_process_connection(ngx_`。
- 补丁行142，目标 `src/stream/ngx_stream_proxy_module.c`，`@@ -1419,6 +1438,8 @@ ngx_stream_proxy_process_connection(ngx_`。
- 补丁行151，目标 `src/stream/ngx_stream_proxy_module.c`，`@@ -1438,7 +1459,7 @@ ngx_stream_proxy_process_connection(ngx_`。
- 补丁行160，目标 `src/stream/ngx_stream_proxy_module.c`，`@@ -1600,6 +1621,9 @@ ngx_stream_proxy_process(ngx_stream_sess`。
- 补丁行170，目标 `src/stream/ngx_stream_proxy_module.c`，`@@ -1807,7 +1831,7 @@ ngx_stream_proxy_process(ngx_stream_sess`。

#### stream_ssl_preread_no_skip

固定文件：`patches/nginx-1.27.1-stream_ssl_preread_no_skip.patch`；原文SHA-256：`93e5d42fffc6d0b4e194b8840e58481ba798a3e2652383843bdcd1db3640f5a9`。

- 补丁行5，目标 `src/stream/ngx_stream_ssl_preread_module.c`，`@@ -159,7 +159,7 @@ ngx_stream_ssl_preread_handler(ngx_stream_session_t *s)`。

#### resolver_conf_parsing

固定文件：`patches/nginx-1.27.1-resolver_conf_parsing.patch`；原文SHA-256：`bda9db7d2766b20c9490f1ccd6d2da72fee402ade219efb32fe341851dbdd7c8`。

- 补丁行5，目标 `src/core/ngx_resolver.c`，`@@ -9,12 +9,26 @@`。
- 补丁行32，目标 `src/core/ngx_resolver.c`，`@@ -131,6 +145,191 @@ static ngx_resolver_node_t *ngx_resolver_lookup_addr6(ngx_resolver_t *r,`。
- 补丁行224，目标 `src/core/ngx_resolver.c`，`@@ -246,6 +445,39 @@ ngx_resolver_create(ngx_conf_t *cf, ngx_str_t *names, ngx_uint_t n)`。

#### daemon_destroy_pool

固定文件：`patches/nginx-1.27.1-daemon_destroy_pool.patch`；原文SHA-256：`aeb6af61c4fd7425ea0089713c3ca106500dc89ef7dc8f09022675158bc775c6`。

- 补丁行5，目标 `src/os/unix/ngx_daemon.c`，`@@ -23,6 +23,8 @@ ngx_daemon(ngx_log_t *log)`。

#### init_cycle_pool_release

固定文件：`patches/nginx-1.27.1-init_cycle_pool_release.patch`；原文SHA-256：`e5ff4da01c3f2b1399e86002e6b4f2b3a2654b857f08071f91ddc90e812750e9`。

- 补丁行4，目标 `src/core/nginx.c`，`@@ -186,6 +186,7 @@ static u_char      *ngx_prefix;`。
- 补丁行12，目标 `src/core/nginx.c`，`@@ -253,6 +254,8 @@ main(int argc, char *const *argv)`。
- 补丁行24，目标 `src/core/ngx_core.h`，`@@ -108,4 +108,6 @@ void ngx_cpuinfo(void);`。
- 补丁行34，目标 `src/core/ngx_cycle.c`，`@@ -748,6 +748,10 @@ old_shm_zone_done:`。
- 补丁行48，目标 `src/os/unix/ngx_process_cycle.c`，`@@ -687,6 +692,11 @@ ngx_master_process_exit(ngx_cycle_t *cyc`。

#### balancer_status_code

固定文件：`patches/nginx-1.27.1-balancer_status_code.patch`；原文SHA-256：`42251d844f377f86b88a66011946e5ff7107c1833d107235546ad0b68ab3af6b`。

- 补丁行5，目标 `src/http/ngx_http_upstream.c`，`@@ -1515,6 +1515,11 @@ ngx_http_upstream_connect(ngx_http_request_t *r, ngx_http_upstream_t *u)`。
- 补丁行21，目标 `src/http/ngx_http_upstream.h`，`@@ -427,4 +427,9 @@ extern ngx_conf_bitmask_t  ngx_http_upstream_cache_method_mask[];`。
- 补丁行35，目标 `src/stream/ngx_stream.h`，`@@ -27,6 +27,7 @@ typedef struct ngx_stream_session_s  ngx_stream_session_t;`。
- 补丁行47，目标 `src/stream/ngx_stream_proxy_module.c`，`@@ -691,6 +691,11 @@ ngx_stream_proxy_connect(ngx_stream_session_t *s)`。
- 补丁行63，目标 `src/stream/ngx_stream_upstream.h`，`@@ -151,4 +151,9 @@ ngx_stream_upstream_srv_conf_t *ngx_stream_upstream_add(ngx_conf_t *cf,`。

#### builtin_error_page_footer

固定文件：`patches/nginx-1.27.1-builtin_error_page_footer.patch`；原文SHA-256：`b089857622804cc55ae06bb54ec18b5efa4f7fc2dc9dd8e424ed9651ef8af541`。

- 补丁行5，目标 `src/http/ngx_http_special_response.c`，`@@ -26,7 +26,7 @@ static u_char ngx_http_error_full_tail[] =`。

#### delayed_posted_events

固定文件：`patches/nginx-1.27.1-delayed_posted_events.patch`；原文SHA-256：`243ed36b8c2d04450483b5c8fa8997370e4086e28ffc1459285fcd20414702df`。

- 补丁行5，目标 `src/event/ngx_event.c`，`@@ -196,6 +196,9 @@ ngx_process_events_and_timers(ngx_cycle_t *cycle)`。
- 补丁行15，目标 `src/event/ngx_event.c`，`@@ -215,6 +218,13 @@ ngx_process_events_and_timers(ngx_cycle_t *cycle)`。
- 补丁行29，目标 `src/event/ngx_event.c`，`@@ -257,6 +267,35 @@ ngx_process_events_and_timers(ngx_cycle_t *cycle)`。
- 补丁行65，目标 `src/event/ngx_event.c`，`@@ -600,6 +639,7 @@ ngx_event_process_init(ngx_cycle_t *cycle)`。
- 补丁行77，目标 `src/event/ngx_event_posted.c`，`@@ -12,6 +12,7 @@`。
- 补丁行89，目标 `src/event/ngx_event_posted.h`，`@@ -43,6 +43,9 @@ void ngx_event_process_posted(ngx_cycle_t *cycle, ngx_queue_t *posted);`。

#### privileged_agent_process

固定文件：`patches/nginx-1.27.1-privileged_agent_process.patch`；原文SHA-256：`099d5c0726708706ae90586fc8c319b751df827df3d5ee5603fb77335c957d55`。

- 补丁行5，目标 `src/core/nginx.c`，`@@ -981,6 +981,7 @@ ngx_core_module_create_conf(ngx_cycle_t *cycle)`。
- 补丁行13，目标 `src/core/nginx.c`，`@@ -1009,6 +1010,7 @@ ngx_core_module_init_conf(ngx_cycle_t *cycle, void *conf)`。
- 补丁行25，目标 `src/core/ngx_cycle.h`，`@@ -22,6 +22,9 @@`。
- 补丁行35，目标 `src/core/ngx_cycle.h`，`@@ -81,6 +84,7 @@ struct ngx_cycle_s {`。
- 补丁行47，目标 `src/os/unix/ngx_process_cycle.c`，`@@ -15,6 +15,8 @@ static void ngx_start_worker_processes(ngx_cycle_t *cycle, ngx_int_t n,`。
- 补丁行56，目标 `src/os/unix/ngx_process_cycle.c`，`@@ -24,6 +26,7 @@ static void ngx_worker_process_init(ngx_cycle_t *cycle, ngx_int_t worker);`。
- 补丁行64，目标 `src/os/unix/ngx_process_cycle.c`，`@@ -51,6 +54,8 @@ sig_atomic_t  ngx_noaccept;`。
- 补丁行73，目标 `src/os/unix/ngx_process_cycle.c`，`@@ -130,6 +135,7 @@ ngx_master_process_cycle(ngx_cycle_t *cycle)`。
- 补丁行81，目标 `src/os/unix/ngx_process_cycle.c`，`@@ -215,6 +221,7 @@ ngx_master_process_cycle(ngx_cycle_t *cycle)`。
- 补丁行89，目标 `src/os/unix/ngx_process_cycle.c`，`@@ -234,6 +241,7 @@ ngx_master_process_cycle(ngx_cycle_t *cycle)`。
- 补丁行97，目标 `src/os/unix/ngx_process_cycle.c`，`@@ -248,6 +256,7 @@ ngx_master_process_cycle(ngx_cycle_t *cycle)`。
- 补丁行105，目标 `src/os/unix/ngx_process_cycle.c`，`@@ -393,6 +431,26 @@ ngx_start_cache_manager_processes(ngx_cycle_t *cycle, ngx_uint_t respawn)`。
- 补丁行132，目标 `src/os/unix/ngx_process_cycle.c`，`@@ -794,7 +860,10 @@ ngx_worker_process_init(ngx_cycle_t *cycle, ngx_int_t worker)`。
- 补丁行144，目标 `src/os/unix/ngx_process_cycle.c`，`@@ -1149,6 +1216,47 @@ ngx_cache_manager_process_cycle(ngx_cycle_t *cycle, void *data)`。
- 补丁行196，目标 `src/os/unix/ngx_process_cycle.h`，`@@ -45,6 +45,7 @@ extern ngx_pid_t       ngx_new_binary;`。

#### privileged_agent_process_connections

固定文件：`patches/nginx-1.27.1-privileged_agent_process_connections.patch`；原文SHA-256：`fb91b94228fa2562cb2a12be7636bfebd800eb9f9c29b999f2ec0dbf48f5f898`。

- 补丁行5，目标 `src/core/nginx.c`，`@@ -1062,6 +1062,7 @@ ngx_core_module_create_conf(ngx_cycle_t *cycle)`。
- 补丁行13，目标 `src/core/nginx.c`，`@@ -1092,6 +1093,7 @@ ngx_core_module_init_conf(ngx_cycle_t *cycle, void *conf)`。
- 补丁行25，目标 `src/core/ngx_cycle.h`，`@@ -93,6 +93,7 @@ typedef struct {`。
- 补丁行37，目标 `src/os/unix/ngx_process_cycle.c`，`@@ -1179,6 +1179,7 @@ static void`。
- 补丁行45，目标 `src/os/unix/ngx_process_cycle.c`，`@@ -1190,7 +1191,7 @@ ngx_privileged_agent_process_cycle(ngx_cycle_t *cycle, void *data)`。
- 补丁行58，目标 `src/os/unix/ngx_process_cycle.c`，`@@ -442,6 +442,15 @@`。

#### privileged_agent_process_thread_pool

固定文件：`patches/nginx-1.27.1-privileged_agent_process_thread_pool.patch`；原文SHA-256：`1bd0817a8436d2ba3bc64ae405d06a5b616dcd273f2e8b88e55c032d69aab1a1`。

- 补丁行3，目标 `src/core/ngx_thread_pool.c`，`@@ -587,7 +587,8 @@`。

#### single_process_graceful_exit

固定文件：`patches/nginx-1.27.1-single_process_graceful_exit.patch`；原文SHA-256：`90622f1edaae53a0e7f13cc22b597031c996d8c7df59b73d90fb0150725bb3d2`。

- 补丁行5，目标 `src/os/unix/ngx_process.c`，`@@ -362,8 +362,15 @@ ngx_signal_handler(int signo, siginfo_t *siginfo, void *ucontext)`。
- 补丁行27，目标 `src/os/unix/ngx_process_cycle.c`，`@@ -305,11 +305,26 @@ ngx_single_process_cycle(ngx_cycle_t *cycle)`。
- 补丁行55，目标 `src/os/unix/ngx_process_cycle.c`，`@@ -320,6 +335,20 @@ ngx_single_process_cycle(ngx_cycle_t *cycle)`。

#### intercept_error_log

固定文件：`patches/nginx-1.27.1-intercept_error_log.patch`；原文SHA-256：`30e2222ff2e5c60ff6ca4eb8f13f3a9c22c4df829002bf7bf63e9fa6cfa400ea`。

- 补丁行5，目标 `src/core/ngx_cycle.h`，`@@ -22,9 +22,14 @@`。
- 补丁行20，目标 `src/core/ngx_cycle.h`，`@@ -75,6 +80,10 @@ struct ngx_cycle_s {`。
- 补丁行35，目标 `src/core/ngx_log.c`，`@@ -112,6 +112,8 @@ ngx_log_error_core(ngx_uint_t level, ngx_log_t *log, ngx_err_t err,`。
- 补丁行44，目标 `src/core/ngx_log.c`，`@@ -153,6 +155,16 @@ ngx_log_error_core(ngx_uint_t level, ngx_log_t *log, ngx_err_t err,`。

#### upstream_pipelining

固定文件：`patches/nginx-1.27.1-upstream_pipelining.patch`；原文SHA-256：`f147c9724a0ad33084a3cb51acdafbd4dbd2c40ba5840af1684b7b9595b24ae2`。

- 补丁行15，目标 `src/http/ngx_http_upstream.c`，`@@ -2239,7 +2239,7 @@ ngx_http_upstream_send_request_handler(ngx_http_request_t *r,`。

#### server_header

固定文件：`patches/nginx-1.27.1-server_header.patch`；原文SHA-256：`2e60414dbf81cbd349cae59b4920898ae92505dbcc4149070631303f19f5560f`。

- 补丁行5，目标 `src/core/nginx.h`，`@@ -11,7 +11,7 @@`。
- 补丁行18，目标 `src/http/ngx_http_header_filter_module.c`，`@@ -46,7 +46,7 @@ ngx_module_t  ngx_http_header_filter_module = {`。
- 补丁行31，目标 `src/http/v2/ngx_http_v2_filter_module.c`，`@@ -143,7 +143,7 @@ ngx_http_v2_header_filter(ngx_http_request_t *r)`。

#### no_error_pages

固定文件：`patches/nginx-1.27.1-no_error_pages.patch`；原文SHA-256：`2a83b90e2d57cfdcf338a18a06e589ef1113c6d860ea7975c6f6625a01f8f421`。

- 补丁行4，目标 `src/http/ngx_http_core_module.c`，`@@ -64,6 +64,8 @@ static char *ngx_http_core_directio(ngx_conf_t *cf, ngx_command_t *cmd,`。
- 补丁行13，目标 `src/http/ngx_http_core_module.c`，`@@ -671,6 +673,14 @@ static ngx_command_t  ngx_http_core_commands[] = {`。
- 补丁行28，目标 `src/http/ngx_http_core_module.c`，`@@ -3564,7 +3574,6 @@ ngx_http_core_create_loc_conf(ngx_conf_t *cf)`。
- 补丁行36，目标 `src/http/ngx_http_core_module.c`，`@@ -3574,6 +3583,7 @@ ngx_http_core_create_loc_conf(ngx_conf_t *cf)`。
- 补丁行44，目标 `src/http/ngx_http_core_module.c`，`@@ -3776,9 +3786,7 @@ ngx_http_core_merge_loc_conf(ngx_conf_t *cf, void *parent, void *child)`。
- 补丁行55，目标 `src/http/ngx_http_core_module.c`，`@@ -4815,6 +4823,10 @@ ngx_http_core_error_page(ngx_conf_t *cf, ngx_command_t *cmd, void *conf)`。
- 补丁行66，目标 `src/http/ngx_http_core_module.c`，`@@ -4920,6 +4932,25 @@ ngx_http_core_error_page(ngx_conf_t *cf, ngx_command_t *cmd, void *conf)`。

#### no_Werror

固定文件：`patches/nginx-1.27.1-no_Werror.patch`；原文SHA-256：`ecd8d7f18c9c6499cdeaaa14e3bd134e4ca46c806415b9fac9df678658ae1b95`。

- 补丁行4，目标 `auto/cc/clang`，`@@ -89,7 +89,7 @@ CFLAGS="$CFLAGS -Wconditional-uninitiali`。
- 补丁行16，目标 `auto/cc/gcc`，`@@ -168,7 +168,7 @@ esac`。
- 补丁行28，目标 `auto/cc/icc`，`@@ -115,7 +115,7 @@ case "$NGX_ICC_VER" in`。

#### log_escape_non_ascii

固定文件：`patches/nginx-1.27.1-log_escape_non_ascii.patch`；原文SHA-256：`7f912ceef27ca108acbe76e05e9f22277af959cbd726c85db862874cafafaaa5`。

- 补丁行5，目标 `src/http/modules/ngx_http_log_module.c`，`@@ -79,6 +79,8 @@ typedef struct {`。
- 补丁行14，目标 `src/http/modules/ngx_http_log_module.c`，`@@ -131,7 +133,8 @@ static size_t ngx_http_log_variable_getlen(ngx_http_request_t *r,`。
- 补丁行24，目标 `src/http/modules/ngx_http_log_module.c`，`@@ -177,6 +180,13 @@ static ngx_command_t  ngx_http_log_commands[] = {`。
- 补丁行38，目标 `src/http/modules/ngx_http_log_module.c`，`@@ -935,6 +945,7 @@ static size_t`。
- 补丁行46，目标 `src/http/modules/ngx_http_log_module.c`，`@@ -943,7 +954,9 @@ ngx_http_log_variable_getlen(ngx_http_request_t *r, uintptr_t data)`。
- 补丁行57，目标 `src/http/modules/ngx_http_log_module.c`，`@@ -954,6 +967,7 @@ ngx_http_log_variable_getlen(ngx_http_request_t *r, uintptr_t data)`。
- 补丁行65，目标 `src/http/modules/ngx_http_log_module.c`，`@@ -967,16 +981,18 @@ ngx_http_log_variable(ngx_http_request_t *r, u_char *buf, ngx_http_log_op_t *op)`。
- 补丁行88，目标 `src/http/modules/ngx_http_log_module.c`，`@@ -996,6 +1012,12 @@ ngx_http_log_escape(u_char *dst, u_char *src, size_t size)`。
- 补丁行101，目标 `src/http/modules/ngx_http_log_module.c`，`@@ -1120,6 +1142,7 @@ ngx_http_log_create_loc_conf(ngx_conf_t *cf)`。
- 补丁行109，目标 `src/http/modules/ngx_http_log_module.c`，`@@ -1135,6 +1158,8 @@ ngx_http_log_merge_loc_conf(ngx_conf_t *cf, void *parent, void *child)`。

#### proxy_host_port_vars

固定文件：`patches/nginx-1.27.1-proxy_host_port_vars.patch`；原文SHA-256：`8ae3e489ed9a92cff272942a4e4e00d1896ec5632a09680e780a72bc546e37cc`。

- 补丁行3，目标 `src/http/modules/ngx_http_proxy_module.c`，`@@ -793,13 +793,13 @@ static ngx_keyval_t  ngx_http_proxy_cach`。

#### cache_manager_exit

固定文件：`patches/nginx-1.27.1-cache_manager_exit.patch`；原文SHA-256：`d02854ec01101563e34f1997508b09750e258dc63613b0e0f352505cfaa103fd`。

- 补丁行11，目标 `src/os/unix/ngx_process_cycle.c`，`@@ -1134,7 +1134,7 @@`。

#### larger_max_error_str

固定文件：`patches/nginx-1.27.1-larger_max_error_str.patch`；原文SHA-256：`a8548e699899340195c2af97f315cae32438e729ab8cff50bc1562e1b6039d66`。

- 补丁行3，目标 `src/core/ngx_log.h`，`@@ -64,7 +64,9 @@ struct ngx_log_s {`。

#### pcre_conf_opt

固定文件：`patches/nginx-1.27.1-pcre_conf_opt.patch`；原文SHA-256：`743f55664ab844af6cb0ce1751e6d318fe7804007dc13fe6405a4463a5ff81e2`。

- 补丁行11，目标 `auto/options`，`@@ -286,6 +286,7 @@`。
- 补丁行19，目标 `auto/options`，`@@ -441,6 +442,7 @@`。

#### always_enable_cc_feature_tests

固定文件：`patches/nginx-1.27.1-always_enable_cc_feature_tests.patch`；原文SHA-256：`fdb1f2dd9b968a6cd810f64cc9da97c9d09b62f6fb6a405fa5ba99331aa3c15e`。

- 补丁行3，目标 `auto/cc/conf`，`@@ -144,7 +144,7 @@ fi`。

#### ssl_cert_cb_yield

固定文件：`patches/nginx-1.27.1-ssl_cert_cb_yield.patch`；原文SHA-256：`661bdbaa52cf4159c91ebf30095e38d0a0824757a71f036f5fbf27f6d37f475e`。

- 补丁行19，目标 `src/event/ngx_event_openssl.c`，`@@ -1445,6 +1445,23 @@ ngx_ssl_handshake(ngx_connection_t *c)`。
- 补丁行43，目标 `src/event/ngx_event_openssl.c`，`@@ -1558,6 +1575,21 @@ ngx_ssl_try_early_data(ngx_connection_t *c)`。

#### ssl_sess_cb_yield

固定文件：`patches/nginx-1.27.1-ssl_sess_cb_yield.patch`；原文SHA-256：`30baa61b13a359c029d5904efa45bb924591d7cd66f0093a1510d386fbed2148`。

- 补丁行4，目标 `src/event/ngx_event_openssl.c`，`@@ -1446,7 +1446,12 @@ ngx_ssl_handshake(ngx_connection_t *c)`。
- 补丁行18，目标 `src/event/ngx_event_openssl.c`，`@@ -1575,6 +1580,23 @@ ngx_ssl_try_early_data(ngx_connection_t *c)`。

#### ssl_client_hello_cb_yield

固定文件：`patches/nginx-1.27.1-ssl_client_hello_cb_yield.patch`；原文SHA-256：`9a41cd393bf8bf7e5ddf3dd33a25f2bf1e7b1a1b8b739da4c14d91b4e10a5c15`。

- 补丁行5，目标 `src/event/ngx_event_openssl.c`，`@@ -1712,6 +1712,9 @@ ngx_ssl_handshake(ngx_connection_t *c)`。
- 补丁行15，目标 `src/event/ngx_event_openssl.c`，`@@ -1889,6 +1892,23 @@ ngx_ssl_try_early_data(ngx_connection_t *c)`。

#### upstream_timeout_fields

固定文件：`patches/nginx-1.27.1-upstream_timeout_fields.patch`；原文SHA-256：`c5773f5098396d426b8bc7a30077b5ae306930daa65032b188efb5626eb94b76`。

- 补丁行5，目标 `src/http/ngx_http_upstream.c`，`@@ -509,12 +509,19 @@ void`。
- 补丁行25，目标 `src/http/ngx_http_upstream.c`，`@@ -1626,7 +1633,7 @@ ngx_http_upstream_connect(ngx_http_request_t *r, ngx_http_upstream_t *u)`。
- 补丁行34，目标 `src/http/ngx_http_upstream.c`，`@@ -1704,7 +1711,7 @@ ngx_http_upstream_ssl_init_connection(ngx_http_request_t *r,`。
- 补丁行43，目标 `src/http/ngx_http_upstream.c`，`@@ -2022,7 +2029,7 @@ ngx_http_upstream_send_request(ngx_http_request_t *r, ngx_http_upstream_t *u,`。
- 补丁行52，目标 `src/http/ngx_http_upstream.c`，`@@ -2084,7 +2091,7 @@ ngx_http_upstream_send_request(ngx_http_request_t *r, ngx_http_upstream_t *u,`。
- 补丁行61，目标 `src/http/ngx_http_upstream.c`，`@@ -3213,7 +3220,7 @@ ngx_http_upstream_send_response(ngx_http_request_t *r, ngx_http_upstream_t *u)`。
- 补丁行70，目标 `src/http/ngx_http_upstream.c`，`@@ -3458,7 +3465,7 @@ ngx_http_upstream_process_upgraded(ngx_http_request_t *r,`。
- 补丁行79，目标 `src/http/ngx_http_upstream.c`，`@@ -3470,7 +3477,7 @@ ngx_http_upstream_process_upgraded(ngx_http_request_t *r,`。
- 补丁行88，目标 `src/http/ngx_http_upstream.c`，`@@ -3664,7 +3671,7 @@ ngx_http_upstream_process_non_buffered_request(ngx_http_request_t *r,`。
- 补丁行101，目标 `src/http/ngx_http_upstream.h`，`@@ -333,6 +333,11 @@ struct ngx_http_upstream_s {`。

#### safe_resolver_ipv6_option

固定文件：`patches/nginx-1.27.1-safe_resolver_ipv6_option.patch`；原文SHA-256：`7906bd4d03344c0da10c4977bea395b6bd1c99db3b8c7ebc3d99eb527553ee70`。

- 补丁行25，目标 `src/core/ngx_resolver.c`，`@@ -425,7 +425,6 @@ ngx_resolver_create(ngx_conf_t *cf, ngx_str_t *names, ngx_uint_t n)`。
- 补丁行33，目标 `src/core/ngx_resolver.c`，`@@ -446,10 +445,19 @@ ngx_resolver_create(ngx_conf_t *cf, ngx_str_t *names, ngx_uint_t n)`。
- 补丁行53，目标 `src/core/ngx_resolver.c`，`@@ -459,7 +467,6 @@ ngx_resolver_create(ngx_conf_t *cf, ngx_str_t *names, ngx_uint_t n)`。

#### socket_cloexec

固定文件：`patches/nginx-1.27.1-socket_cloexec.patch`；原文SHA-256：`6b22ad9027f08ce5dfb577b222dd0495405e638616369cfd1f4d2f4b5fd44e61`。

- 补丁行5，目标 `auto/unix`，`@@ -990,3 +990,27 @@ ngx_feature_test='struct addrinfo *res;`。
- 补丁行37，目标 `src/core/ngx_resolver.c`，`@@ -4466,8 +4466,14 @@ ngx_tcp_connect(ngx_resolver_connection_t *rec)`。
- 补丁行52，目标 `src/core/ngx_resolver.c`，`@@ -4494,6 +4500,15 @@ ngx_tcp_connect(ngx_resolver_connection_t *rec)`。
- 补丁行72，目标 `src/event/ngx_event.h`，`@@ -73,6 +73,9 @@ struct ngx_event_s {`。
- 补丁行86，目标 `src/event/ngx_event_accept.c`，`@@ -62,7 +62,9 @@ ngx_event_accept(ngx_event_t *ev)`。
- 补丁行97，目标 `src/event/ngx_event_accept.c`，`@@ -202,6 +204,16 @@ ngx_event_accept(ngx_event_t *ev)`。
- 补丁行118，目标 `src/event/ngx_event_connect.c`，`@@ -38,8 +38,15 @@ ngx_event_connect_peer(ngx_peer_connection_t *pc)`。
- 补丁行134，目标 `src/event/ngx_event_connect.c`，`@@ -80,6 +87,15 @@ ngx_event_connect_peer(ngx_peer_connection_t *pc)`。
- 补丁行154，目标 `src/os/unix/ngx_process_cycle.c`，`@@ -960,6 +1029,9 @@ ngx_worker_process_exit(ngx_cycle_t *cycle)`。
- 补丁行168，目标 `src/os/unix/ngx_socket.h`，`@@ -38,6 +38,17 @@ int ngx_blocking(ngx_socket_t s);`。

#### reuseport_close_unused_fds

固定文件：`patches/nginx-1.27.1-reuseport_close_unused_fds.patch`；原文SHA-256：`7f1c3eefcd841502515f529e3a0c0a17492e7e44ba5c47fc50ae6a3123d8937f`。

- 补丁行4，目标 `src/core/ngx_connection.c`，`@@ -1118,6 +1118,12 @@ ngx_close_listening_sockets(ngx_cycle_t *cycle)`。
- 补丁行20，目标 `src/event/ngx_event.c`，`@@ -775,6 +775,18 @@ ngx_event_process_init(ngx_cycle_t *cycle)`。

#### proc_exit_handler

固定文件：`patches/nginx-1.27.1-proc_exit_handler.patch`；原文SHA-256：`f4b90cf10ffbb58083f607b0a1d49d474f26f224e1d02000f64d7386e3978c1c`。

- 补丁行5，目标 `src/core/ngx_cycle.c`，`@@ -264,6 +264,9 @@ ngx_init_cycle(ngx_cycle_t *old_cycle)`。
- 补丁行19，目标 `src/os/unix/ngx_process.c`，`@@ -34,6 +34,7 @@ ngx_int_t        ngx_process_slot;`。
- 补丁行27，目标 `src/os/unix/ngx_process.c`，`@@ -83,6 +84,13 @@ ngx_signal_t  signals[] = {`。
- 补丁行41，目标 `src/os/unix/ngx_process.c`，`@@ -564,6 +572,7 @@ ngx_process_get_status(void)`。
- 补丁行53，目标 `src/os/unix/ngx_process.h`，`@@ -18,6 +18,8 @@ typedef pid_t       ngx_pid_t;`。
- 补丁行62，目标 `src/os/unix/ngx_process.h`，`@@ -66,6 +68,7 @@ ngx_pid_t ngx_spawn_process(ngx_cycle_t *cycle,`。
- 补丁行70，目标 `src/os/unix/ngx_process.h`，`@@ -85,6 +88,7 @@ extern ngx_socket_t   ngx_channel;`。

## 实施只读检查及交接边界

旧evidence完整前缀及全部元数据保留，旧patch.source_ids保留前缀。runtime.source_ids精确等于步骤首次出现并集，独立文档分开。新片段从固定git show取出核对，不使用工作树源码行号。实施者只做源码、数据保护与现有validateRuntime只读校验，未运行产品测试/build/browser；这些由主线程统一执行。下文保留交接与构建退回记录，当前发布状态以末尾最终发布附注为准；dist未由实施者写入。

### B8-R1至R5候选修订

两listen第2步限定新socket的NGX_HAVE_REUSEPORT、ls.reuseport、!ngx_test_config三条件，不把旧fd add_reuseport错误结论混入。第3步新增event:856平台guard和917–943普通注册/失败出口，accept_mutex分支明确延后启用且本次不展开启用链。HTTP server第3步新增request:2281–2325绑定SNI差异例外，第4步明确done后的reject_handshake/fatal。location第3步改为每层独立保存本层noregex，嵌套不向外层传播。HTTP listen第6步新增request:328–333说明SSL地址可覆盖初始read handler。新增范围完成34补丁复核，除已批准两listen外没有其他迁移。审核关闭由审核线程复核确认。

### 最终候选只读保护检查

21项旧evidence精确前缀/hash均匹配修改前fixture；1016个非目标对象整体SHA-256为 `928b9c89873daa84f1a9dcb284839463ec5eeb6c940d1ad5f6e5e83f7032f7b5`，与fixture完全一致。旧字段在排除授权runtime/evidence、patch_status引用/note及两listen状态后逐对象完全相同；四项旧字符串limitations仅按基线published完整对象冻结。旧patch引用保留精确前缀、旧note保留前缀；runtime步骤首次出现并集与source_ids精确一致，全部直接引用覆盖进patch_status。

共21身份、105步、310条新增evidence；最终311个直接代码refs与22个独立文档refs合计333，按身份各自runtime并集累加，均已核固定Git有效范围与身份归属，非现场执行次数。34补丁共142 hunk的固定原文摘要重新核验一致。只读检查错误0。

knowledge/directives.json最终候选SHA-256：`aa4cec0555f452638815b155ea0b625f626ae5cd7cac61fb80ba70531ddaeb14`。

唯一状态迁移：

- `nginx--ngx_http_core_module--listen`：verified_unaffected → verified_affected。
- `nginx--ngx_stream_core_module--listen`：verified_unaffected → verified_affected。

两项均为新增reuseport worker关闭及accept CLOEXEC消费；实际改写hunk为reuseport_close_unused_fds补丁行20、socket_cloexec补丁行86/97。主已批准精确白名单，其他状态不变。

### legacy limitations固化

- nginx--ngx_stream_log_module--access_log：旧字符串按06a639已发布完整facts对象原文/状态/source_ids顺序/额外键复制，不修改旧事实，防新增evidence自动扩张。
- nginx--ngx_stream_core_module--error_log：旧字符串按06a639已发布完整facts对象原文/状态/source_ids顺序/额外键复制，不修改旧事实，防新增evidence自动扩张。
- nginx--ngx_stream_core_module--listen：旧字符串按06a639已发布完整facts对象原文/状态/source_ids顺序/额外键复制，不修改旧事实，防新增evidence自动扩张。
- nginx--ngx_stream_core_module--server：旧字符串按06a639已发布完整facts对象原文/状态/source_ids顺序/额外键复制，不修改旧事实，防新增evidence自动扩张。

### 构建退回最小修订与历史交接边界

主转达审核同意server_tokens引用修订：仅从第2/5步及runtime并集移除version-substitution，直接代码/品牌patch仍绑定；第2步移除脚本minor替换解释，只描述宏和品牌补丁消费。发行版本替换的既有全sources/evidence、旧版本事实及patch_status（包括version-substitution引用、note、status）完整保留，不放宽src校验标准。

B10-R1：第3步明确初次状态分配失败立即返回500，分配成功后才将content_length_n归0，绑定固定request_body.c:1108–1115；已有证据不增加、不移除。

两项采用基线已核基础事实及当前固定Git证据（显式完整revision）调用未修改的validateRuntime，均返回true；旧server_tokens直接脚本引用负例仍被拒绝。这是两项只读校验，不冒称全量构建通过。仅修改这两项runtime，其evidence和patch_status完全不变；21项旧证据前缀及1016非目标对象保护结果仍保留。

前次构建定位HTTP access_log安装片段处于configuration-definition内部；主与审核随后批准下述消费范围收窄。未扩行跨callback、未放宽src。整批build/test/UI由主线程执行，不以本次校验冒称已完成发布。

### HTTP access_log flush最小修订及最终冻结

按主转达审核认可：保留runtime-http-flush-event-install完整evidence与patch_status引用，仅从第5步和runtime并集移除；条件改为已安装flush回调被调用，限定非gzip普通文件。719–769完整绑定handler→flush→write、空buffer返回、失败/短写ALERT、位置重置及仅event存在且timer_set时删除timer。本步不声称证明安装或timer触发。mechanism、白名单及patch状态均不修改。原patch note保留修订历史，当前步骤范围以本次修订为准。

最终21项以基线已核基础事实及当前固定Git evidence构造detail，显式填充正确component/revision后调用原validateRuntime，21项均true；不绕过configuration-definition排除，不修改src。两项此前授权修订与本次flush合并后，仅三身份runtime变化：server_tokens直接脚本引用移除、client_max_body_size失败顺序澄清、HTTP access_log回调消费范围收窄。全部evidence和patch_status保持不变，旧21项evidence前缀匹配，1016非目标整体摘要仍为 `928b9c89873daa84f1a9dcb284839463ec5eeb6c940d1ad5f6e5e83f7032f7b5`。

知识文件已冻结；主线程已报告最终build/test/UI通过，见以下最终发布附注。实施不再写知识。最终knowledge/directives.json SHA-256：`aa4cec0555f452638815b155ea0b625f626ae5cd7cac61fb80ba70531ddaeb14`。

## 最终发布附注

日期：2026-10-14。主线程报告最终build成功，发布身份为 `1.27.1.1-1c2ead24459672e6`。实施者仅只读核对当前 `dist/knowledge/index.json`：release_id一致，1041项basic、44项deep，其中发行组件40项deep、部门扩展4项deep。最终25项由本实施者21个Nginx身份及主线程4个VTS身份共同完成；本文件21项共105步、310条新增evidence，VTS独立证据另见SAMPLE_FINAL25_VTS_EVIDENCE.md。34补丁/142 hunk最终矩阵及三项构建退回最小修订均保留在上文。

主线程最终验收报告：

- 定向测试89/89通过。
- 全量测试247/247通过。
- 原样例检查通过，25项UI检查全部通过。

测试、样例与UI结果来自主线程本轮完成报告；本实施者未重复执行，不读取或复制私有配置，也不将网站验收泛化为现场Nginx/OpenResty请求运行成功。当前公开索引仍保留现场版本、模块安装/运行兼容性及宿主接入等既有验收边界。

最终只读复核的知识SHA-256仍为 `aa4cec0555f452638815b155ea0b625f626ae5cd7cac61fb80ba70531ddaeb14`。本次收尾只修改本EVIDENCE文档，不修改knowledge、src、site、schema、test或dist，不重新build。两listen的verified_unaffected→verified_affected为唯一状态迁移，旧证据前缀和1016个非目标对象保护结论不变。

### 主执行结果与最终交接

主线程本轮实际执行结果：最终build成功发布 `1.27.1.1-1c2ead24459672e6`，89定向/247全量测试全部通过，原样例和25项UI全部通过；当前公开索引为44 deep。上述结果由主线程执行并交付，本实施者未重复执行。

本实施者已完成最终稳定交接表、21身份总refs及三项修订后对象SHA的一致性核对；34补丁/142 hunk矩阵完整，无待核占位。知识保持冻结，实施交接结束，不再修改knowledge。



