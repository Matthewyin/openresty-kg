# P11 图像、XSLT、Perl与GeoIP 22项准备

2026-10-12。完整四owner22身份：image7、xslt6、perl4、geoip5；候审，不进入正式330计数。固定Nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928、文档e8b581903e9d41252720053311cea687a5671674、OpenResty8c37412c31621225e7aa7e825b5b50106c9c71c4。

逐项读取注册、配置回调、owner、合并/初始化、使用分支及对应活跃XML。没有运行GD、XML转换、嵌入式Perl、GeoIP查询或来源构建；没有下载外部库或数据库。

- image：test仅前部标记判断后透传，不冒称完整图片解码校验；size部分失败输出空JSON但缓冲错误仍可415。resize/crop原样分支不应用质量、锐化、交错等重新编码选项。质量1–100是文档范围，Nginx回调仅校验正值，不声称有100源码硬上限；WebP输出受编译条件限制。buffer限制原始输入字节，不是GD像素或输出大小上限。透明色与真彩色Alpha分开。
- XSLT：完整XML解析后依序应用样式表并序列化；参数共用列表继承，XPath与引用字符串传参不同。DTD回调替换外部子集，不扩展成所有外部访问都隔离；xml_entities和stylesheet配置期解析，未实际执行。304/MIME/样式表门槛、500失败、结果头处理均有真实分支。
- Perl：模块目录通过-I传解释器，require列表在初始化消费，perl/perl_set可能提前初始化；内容handler与变量getter区分。perl真实content派发有core片段；perl_set不强标请求阶段。不猜固定默认安装路径或完整content handler继承。
- GeoIP：配置期内存缓存打开并检查数据库类型，可选utf8来自实际回调，固定XML没有列出。请求变量查询本地记录；proxy只改变查询局部地址，不改连接sockaddr，XFF从末端按可信链递归。编译及实际部署未知仍由既有availability表达，不增造可用性结论。

实际核208处固定引用及22活跃XML节点，临时回放34补丁、142hunk、47最终摘要通过，164段Nginx原文全部保持。仅对所列事实标局部unaffected，不声明外部库内部行为已审核。

隔离330+22构建得到352基础候选 `1.27.1.1-e0c696bf183a62b4`，1017注册、0深度、范围true；完整owner差集、唯一身份及basic状态核验通过，根current前后保持，临时目录finally清理。尚待独立逐义审核；P10及FastCGI等其他候选不计入本候选。

## R26：补充Perl提前初始化证据

仅给perl_modules/perl_require各增加固定Perl模块982–986、1054–1058两处调用来源，并关联其顺序限制与patch_status；原正文及其他20项不变。新JSON SHA256为cc1fe1fefa7132e9239db420303251def608d1dcfed576e25e06e34f4f6fb949。实际回放34补丁、142hunk、47最终摘要通过，新增4处引用全部保持；显式来源208→212，Nginx引用164→168。临时目录已清理。上述352隔离结果属于旧草稿，新增引用尚待差异审核与正式发布验证，根current仍330。
