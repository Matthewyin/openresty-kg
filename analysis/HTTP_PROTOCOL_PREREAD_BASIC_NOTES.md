# P14 HTTP/2、HTTP/3及stream TLS预读24项准备

2026-10-12。完整三个owner24身份：v2 15、v3 8、ssl_preread1；独立准备，未合入正式330。固定Nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928、nginx.org e8b581903e9d41252720053311cea687a5671674、OpenResty8c37412c31621225e7aa7e825b5b50106c9c71c4。

## 核定内容

- v2：完整读取模块文件，7个有效字段均追到实际使用；5个post绑定及校验函数单独引用。recv缓冲是worker主配置共享输入，不是请求体上限；pool可追加块，index是2次幂桶数不是并发数；chunk实际取帧/窗口约束。http2开关与旧listen地址标志为OR，不把off当监听协议绝对关闭。
- 8个v2旧指令全部走ngx_http_v2_obsolete：仅警告并返回OK，不存储参数。默认/继承明确无运行效果，替代名字不等于自动转写，文档旧默认不冒充此版本有效默认。pool_size、streams_index_size没有同名XML，以源码专项说明。
- v3：协议协商的enable/HQ与QUIC监听前提、选择服务器后的协议复核分开；并发流映射双向流额度，控制流另计；stream_buffer影响收发窗口而非响应大小。retry off不绕过非空token校验；GSO还受编译、路径验证、握手队列和批量门槛约束。host_key配置期读文件并派生两个密钥，未设置时随机；connection_id_limit是客户端连接ID数量，不是连接数。
- ssl_preread：完整解析状态及变量路径、SNI选server、阶段挂接均读取。SOCK_STREAM/Data不足/非握手边界明确；客户端声明不等于已协商或证书验证。没有编译运行QUIC、TLS或读取真实密钥文件。

## no_skip补丁实际边界

实际临时回放发行34补丁后，ssl_preread handler第197行变为 `return rc == NGX_OK ? NGX_DECLINED : rc;`；此前192–193的 `if (rc == NGX_OK) return ngx_stream_ssl_preread_servername(...)` 原样保留。因此不能根据补丁文件名声称所有成功预读均返回DECLINED或继续其他preread handler。草稿标verified_affected并引用固定补丁原文1–11及完整上游handler；正文解释该版本提前返回的边界，不伪造补丁后Git坐标。

193处固定引用有效EOF，22个同名XML节点活跃；临时34patch、142hunk、47最终摘要通过。146段Nginx引用中145原文保持，唯一改变为ssl_preread/implementation-0，与上述补丁一致，其余未扩大为全协议无影响。

隔离330+24构建实际得到354基础候选 `1.27.1.1-f04070de513c9bba`，1017注册、0深度、范围true；完整owner身份差集、唯一性和basic状态核验，根current前后保持，临时副本finally清理。仅准备完成，须独立逐义审核；既有协议栈没有被运行测试。

## R30：已知废弃事实补入结构化元数据

504桌面及真实HTTP查询发现八个ngx_http_v2_obsolete条目正文“已废弃”而状态为null；独立审核确认遗漏。只给这八个条目增加顶层deprecated:true，其余16项及全部正文/来源/phase保持，既有build/UI支持该字段，不修改产品程序或整体availability核实状态。新草稿SHA256 c902f4f44c43b5206d87df0431a20da506609a2b44d780b6ce9d72b2a4f6c018；内存删除八字段后精确重现原393a7a8d3e89adb1cf3b4a0bcb5dfb141a0687cff7af6211b9f43296854123f1。沿用481–498真实obsolete回调及已审来源，无新补丁主张。待差异审核后更新正式知识并重建，不修改504历史目录。此为可逆数据标记补齐，不新增复述八字段的永久测试，使用已失败的实际HTTP查询断言及桌面展示复核闭环。
