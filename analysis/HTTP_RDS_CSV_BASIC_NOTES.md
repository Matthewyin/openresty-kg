# P23 RDS CSV完整6项基础内容

## L-R05来源补全（2026-10-13，主执行）

四项仅追加本条缺失来源及source_ids：rds_csv的RDS MIME常量；row_terminator的CRLF宏；field_name_header的CSV MIME及零列分派；content_type的默认宏和输入过滤/MIME判断。正文、默认文字、其他两项和Nginx引用均无变化，不重复原补丁回放。新JSON SHA256 195c629cc6692ecb1b22f6671c01bd677e462f82d8593cfc59393e66de089fb3，交独立差异复核。

2026-10-13主准备。固定b4095fcb8a866835ddec7ea0c414b8a4af35741a，正式691不变。完整读取module.c、util.c、相关processor/output/RDS头部检查、config和README60–150；仅读测试用例检索，未启动数据库或转换运行。

过滤器只对状态200–299排除204/205及精确RDS MIME生效；不是SQL执行器或JSON转CSV。行结束只LF/CRLF、分隔只逗号/分号/Tab；字符串引用和双引号重复遵循实际escape函数，SQL NULL和空串同为空字段。field_name_header默认按merge为on，不采README的off；text/csv实际输出header=presence/absence，不采文档present拼写。

零列结果output_header存在静态不一致：field_name_header off仅减少长度预算，后续仍无条件写入元信息标题；已明确限定该路径，不宣称off普遍可用。buffer_size是常规输出缓冲，可另分配暂存并分段复制，不是最大字段/结果限制，0不是关闭开关。原模块源码未修改。

59显式来源真实EOF有效，3共享Nginx槽位在真实34patch/142hunk/47最终SHA回放保持。隔离691+6=697基础/320仅注册，release1.27.1.1-087e81b9b056ba45，完整owner差集/basic/来源通过；current前后不变，临时目录finally清理。候审不计正式覆盖。
