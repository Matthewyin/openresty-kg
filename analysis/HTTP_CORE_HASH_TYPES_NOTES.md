# HTTP 核心基础内容：哈希、类型和路径首组

日期：2026-10-10。准备草稿10身份，不代表完整 HTTP core 84项完成；正式发布前等待独立审核。仅写两个准备文件，不覆盖 current。

完整分组：variables_hash_max_size、variables_hash_bucket_size、server_names_hash_max_size、server_names_hash_bucket_size、types_hash_max_size、types_hash_bucket_size、types、default_type、root、alias。均为 ngx_http_core_module 的各自独立身份；不合并 root/alias。

固定 Nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928，官方文档 e8b581903e9d41252720053311cea687a5671674。读取文档前去掉XML注释并保留行号，只接受当前有效同名节点；原始片段仍引用固定Git原文。

逐条功能由字段使用点核定：变量哈希构建、server精确/通配名称哈希构建、types解析及合并、Content-Type选择、URI映射以及root/alias配置回调。六项哈希参数是桶数/容量，不是允许变量/主机/扩展名个数；注册用 num_slot，不能照文档占位 size 写成支持 k/m 后缀。桶容量还按缓存行对齐，server_names_hash_bucket_size不硬写为64。

types子层定义（含空块）不逐项合并父映射，同层重复扩展名告警并以后者替换；default_type不覆盖已有响应类型。root追加URI，alias替换location前缀或用正则捕获构造路径；共享callback不意味着语义相同。两者拒绝重复/同层并用及两个路径变量；alias不能在命名location使用，location失效时URI映射拒绝。root缺可继承值时默认html相对prefix解析；alias继承和types默认仍保持未核实。

主在mkdtemp隔离源码实际回放34项有效补丁，47个补丁最终文件SHA256与 NGINX_PATCH_AUDIT.json全同；10项58段注册/owner/callback/实现原文在补丁后逐字保留。没有因模块文件整体变化就虚报所列局部事实受影响，也不把局部未变扩大为完整请求链无补丁。隔离副本已删除，没有运行生成器或Nginx。

准备审核发现 WC-R10/WC-R11：缺少 module-owner 来源ID，变量实现段越过EOF。已显式补固定 owner:800–813，变量段收至真实EOF:2836；没有放宽发布范围检查。此前58段比较中有两段被slice截短，不能作为原行范围有效的证明。修正后的10条与transport17条一同实际隔离build成功，115basic、来源坐标与事实来源ID全部通过；隔离副本finally删除。交审核差异复核，未计入当前88basic。
