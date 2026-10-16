# P22 srcache完整20项基础内容

## R40输出路径补证据（2026-10-13，主执行）

srcache_fetch新增固定fetch.c132–188的命中后send_header/output_filter/finalize分支；srcache_store新增util.c1025–1112的状态行及响应头实际序列化段。两条各绑定limitations[0]/patch_status，正文和其他18对象不变。主实际读取两段源码，新JSON SHA256 8e6d7478978a4c8f54584502e6798565b3192856d6a570925faf801d0a0650ab，交独立差异复核；没有新增Nginx引用或重复回放。

2026-10-13主准备；正式691保持。固定be22ac0dcd9245aadcaca3220da96a0c1a0285a7，HEAD/clean已核。完整读module.c、fetch/store相关流程、util配置方法/复制/请求与响应控制/序列化/解析/隐藏头/比较器、var有效期及config正式六C输入；对照README486–985指令正文，未执行后端缓存或OpenResty。

主要源码与文档差异明确写入：buf_size在正式六C源只有注册/初始化/合并，实际解析用header_buf_size、复制按输入长度；header_buffer_size实际用于fetch恢复每条头而非store序列化。request_cache_control的辅助函数只在no_cache真时返回OK，单独no-store不进入调用方跳过分支；不能照抄README。多个flag和hide/pass/ranges真实注册没有LIF，不采README扩大的if上下文。fetch/store显式空字面args分支误清location，说明建议省略可选参数；未修用户模块源码。

fetch挂access并移至末端，非200/解析不完整不算命中；store复制状态/头/体，末尾子请求提交，不自带存储。max_size含头序列化长度，先Content-Length+15近似预判再累计；skip两次时机；HEAD只fetch；status列表0为终止标记而非有效状态。ranges专指200后变206路径，原206仍需状态许可。private/no-store/no-cache开关只放宽各自响应检查；有效期只计算srcache_expire变量，不自动设置后端TTL。hide/pass完整继承保留未知，未把数组/特殊头标志混成简单规则。

20身份完整owner差集，173显式来源真实EOF有效，17段共享Nginx槽位在真实34patch/142hunk/47最终SHA回放中保持。隔离691+20=711基础/306仅注册，release1.27.1.1-d4c5713d783bf139，basic/来源/身份通过；current前后不变、临时目录finally清理。候审不计正式覆盖。
