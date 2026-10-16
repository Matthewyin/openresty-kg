# P09 压缩、切片与输出缓冲：14项准备

2026-10-12。gzip9、gunzip2、gzip_static1、slice1、copy_filter的output_buffers1，完整5个owner14身份；既有HTTP core的gzip_disable/http_version/proxied/vary等不重复。只写HTTP_COMPRESSION_BASIC.json与本记录，正式299不变。

固定Nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928、nginx.org e8b581903e9d41252720053311cea687a5671674、OpenResty8c37412c31621225e7aa7e825b5b50106c9c71c4。已读各模块配置、merge、过滤器安装、使用处与活跃XML；gzip_window/gzip_hash/postpone_gzipping/gzip_no_buffer四项没有同名XML，直接由校验器及运行代码提供功能证据。官方XML名称不等于C模块owner，保持真实身份。

## 核对要点

- gzip：200/403/404、既有Content-Encoding、已知长度、Content-Type、header_only与gzip_ok资格分开；不能据gzip on声称所有响应必压缩。types按响应MIME，text/html默认加入，*特殊，显式集合不拼接父层。
- buffers：gzip/gunzip按页大小及128KiB预算设置默认数量，输出块按需分配和复用，非压缩/解压库工作内存总额，也不限制最终响应长度。
- comp_level：post bounds1–9、默认1，真实deflateInit2传值。window/hash校验器分别将字节尺寸转wbits/memlevel，窗口512–32k、hash512–128k离散值。默认依赖库编译常量，统一字节值保留unverified；运行可能随已知长度调整，zlib变体另有内存估算，不能写固定内存承诺。
- postpone_gzipping：累计严格大于阈值或flush/last_buf停止输入暂存，默认0；不是毫秒或硬容量。gzip_no_buffer只在无待处理输入时下传部分输出，不等同无缓冲或强制库同步flush。min_length只检查已知Content-Length，不先读取完整响应测量。
- gunzip：仅识别单一gzip编码，gzip_ok为真则保留；移除编码、长度、范围并弱化ETag，不涉及客户端请求体解压。
- gzip_static：路径追加.gz，on接受资格与always跳过资格分别读分支，仍需文件存在；不生成压缩文件，缺失返回DECLINED不保证原文件可用。
- slice：size0禁用，变量getter建上下文、主/子请求过滤与clone接续；需把slice_range传Range并参与缓存键与206缓存。文档背景更新限制额外引用issues原段，206/Content-Range/ETag检查分别有运行证据。
- output_buffers：copy_filter把conf.bufs传ctx再交output_chain；as_is、sendfile、按需复用、尾块缩小或单块小幅扩容都核实际路径。XML归core，owner仍为copy_filter，不套proxy_buffers。

## 实际准备检查

123处固定来源全部有效EOF；98段Nginx原文在临时34patch回放后完整保留，142hunk及47最终SHA256一致，10个同名XML节点去注释后活跃，另slice issues片段来源保持。该结果只核所述局部行为，不声明整个输出链不受任何发行补丁影响。

隔离构建在临时site/src/config/analysis与knowledge副本中，将当前299追加14项，实际得到313基础候选 `1.27.1.1-ed03fa692ee84de4`，1017注册、0深度、范围true；完整差集与basic状态核验，根current读取前后保持，临时文件finally清理。未编译运行来源、执行生成器或媒体处理；仍待独立逐义审核，不据隔离候选声明正式覆盖。

## R23 / R24 最小修正

gzip_window的implementation-0改为固定源码107单行，gzip_hash改为108单行，分别包含真实post函数绑定；其余字段保持。slice第二条限制改为仅在已记录非空ETag时强制后续一致，未记录时不要求ETag存在；原implementation-0已包含128–144条件分支，未改变其他限制。

修正后草稿SHA256为 `a6dae19d87b1e1d81a7b44f2d30a0d54d771d708a1a2992715a7d4adbcc84256`。实际重新核123处引用、98段Nginx原文保持，34补丁/142hunk/47最终摘要一致，临时副本已清理。没有新隔离构建，前述313候选是修正前历史；正式current仍299，修正仅待独立差异复核。
