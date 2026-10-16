# P23 RDS JSON完整10项基础内容

## L-R06来源补全（2026-10-13，主执行）

四项仅追加本条来源及source_ids：rds_json的RDS MIME常量和NULL/空串实际输出；root的独立ret handler；format的零列/ret路径和真实行形态输出及闭合预算；content_type的默认常量和输入MIME判断。正文及其他六项保持，Nginx引用无变化，不重复原补丁回放。新JSON SHA256 2d2465ab29d76919c2f5849ddeadeb768a816eae2a7571e9f6d0931ef18ee6db，交独立差异复核。

2026-10-13主准备；固定2d7e07f7c39f98bbb2a8b07f4bae4d892f00329d，HEAD/clean已核。完整读取module、ret handler及util，读取processor有列/无列入口、输出元信息/属性/列/字段/缓冲路径、config及README78–266；未运行数据库或RDS转换。

normal是逐行对象，compact首元素列名数组后跟值数组，不是去空格；root只包装有列结果，附加success/user_property且root空时默认data；不笼统套用到零列元信息和ret。user_property值总按字符串转义，不是JSON片段，不检查重复键；errcode/errstr改键名不改HTTP状态。过滤入口严格RDS MIME/2xx排除204/205，字符串不验证UTF-8，浮点文本未完整验证，不声称任何输入都能得到有效JSON。

rds_json_ret是content handler，读取数字串错误码及表达式描述，正常HTTP200，非rewrite return；源码NGX_CONF_2MORE允许额外参数，但callback不消费后续值，已注明。错误码直接拷入，不规范化前导零；ret完整继承保留未知。buffer使用常规缓冲加暂存分段，非结果/字段最大值，也不限制ret按响应长度分配。

101显式来源真实EOF有效，3共享Nginx槽位在实际34patch/142hunk/47最终SHA回放保持。隔离691+10=701基础/316仅注册，release1.27.1.1-afdc5ce7a02e895f，完整owner差集/basic/来源通过；current前后不变，临时目录finally清理。JSON SHA256 72348c44e92d01b4ebabb1b41d3633fe045f42d89ee89186733bf78a90726fa1。候审不计正式覆盖。
