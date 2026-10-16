# P10 第一组：响应过滤与浏览器分类14项准备

2026-10-12。完整覆盖addition3、headers3、sub4、browser4共4个owner14项；这不是P10全35项，charset5、SSI7、userid9继续处理。没有新增网站功能或运行Nginx。

固定Nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928、文档e8b581903e9d41252720053311cea687a5671674、OpenResty8c37412c31621225e7aa7e825b5b50106c9c71c4。逐条读取实际配置函数、owner、create/merge、头/体过滤器或变量getter、同名活跃XML，不按最新在线文档套用新能力。

## 逐组语义

- addition：状态200主请求与类型筛选，header_only跳过；before/after各自字符串继承，空字符串取消对应位置添加；子请求URI不是直接文件读取。types共享回调及merge/default数组核定。
- headers：add_header、add_trailer各自整列表继承；always仅放开状态检查。普通空头、Cache-Control/Link、Last-Modified/ETag特殊处理区分。trailer在last_buf加入尾部字段列表，不把此处证据扩大成所有协议/客户端必能收到。expires不是proxy_cache或禁止存储，动态无效值跳过，modified回退与每日时点条件明确。
- sub：匹配不是正则，最多255条、空静态查找拒绝、空动态查找跳过；替换值首次命中计算后缓存。once按每模式一次不是每缓冲一次；last_modified改变头字段，不产生新的修改时间或摘要。types与整体规则继承分别核定。
- browser：固定五种内置浏览器，UA字符串/版本分类不等于能力探测；modern匹配立即返回，ancient子串区分大小写，netscape4特殊匹配。两套列表各自有条件整体继承，value按字面保存，命中对应类别默认1、另一类别空值。

## 实际准备验证

121处固定来源均在有效EOF内，14个XML同名节点活跃；临时回放34补丁、142hunk及47最终SHA256通过，93段Nginx引用保持，改变0段。unaffected只限定所列事实，不宣称整个响应过滤链无补丁影响。

隔离299+14构建实际得到313基础候选 `1.27.1.1-8b6871277ec3a71b`，范围true、1017注册、0深度；完整owner集合、唯一身份及basic状态检查通过。临时目录finally清理，根current保持。该候选不是正式接入，须独立逐义审核后再由主合并。
