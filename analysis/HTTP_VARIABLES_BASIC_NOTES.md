# P06 变量与链接校验：剩余9项准备

2026-10-12。已有 rewrite 7项保持；本批为 map 3、geo 1、split_clients 1、secure_link 3、ngx_coolkit override_method 1，按 component/module/name 与正式目录的完整差集核对。仅新增 HTTP_VARIABLES_BASIC.json 与本记录，未经独立审核前不计入正式覆盖。

固定来源为 Nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928、nginx.org e8b581903e9d41252720053311cea687a5671674、OpenResty 8c37412c31621225e7aa7e825b5b50106c9c71c4、ngx_coolkit 462b863babe121b900465b4ec8dfba612d723e9a。正文逐条来自实际回调、运行使用处和固定文档，不按注册槽位名称生成解释。

## 逐义边界

- map：配置块编译输入和结果复杂值；运行 getter 查精确键、主机名掩码与顺序正则，最后 default。hostnames、volatile 与 include 是块内规则，不新增目录身份。未设 default 的空结果、正则编译条件有对应证据。
- map 两个哈希参数：整数槽位而非 size 槽位；首次 map 设置默认值，bucket 还按缓存行对齐。调参应先于首次 map。最大桶数不是条目数，目标桶字节也不是不可突破的最终占用上限；hash 初始化警告与错误分支分别读取。
- geo：getter 默认取连接 sockaddr，指定变量时解析该值；CIDR radix 最具体匹配，range 路径按 IPv4。值保存为文字，没有 map 复杂值编译。proxy 只影响本次分类使用的地址，不写回请求连接地址。无配置地理数据库能力，不执行 include 或二进制生成路径。
- split_clients：输入复杂值与输出固定文字分开；MurmurHash2 阈值选择，百分比精度、0%拒绝、总量与星号兜底均核实际回调。不承诺有限请求样本恰好等比例。
- secure_link：变量 getter 执行现代/旧式分派。现代校验需两表达式，base64url解码16字节，严格 expires < now 才过期；expires ctx 在验签前建立。只返回变量，不自行拒绝访问。MD5输入组成由表达式决定。
- secure_link_secret：原始 URI 的 link 加文字 secret，成功返回 link，不是1；没有过期字段。merge 时两种模式有互斥与继承条件。固定源码接受 http/server/location，XML仅列location，明确按注册展示。
- override_method：固定0.2组件注册、create/merge、方法表和两次 rewrite hook/handler均读取；筛选始终以原始方法，空或无效动态值不产生新覆盖，不误写为必恢复原值。location off 可恢复已保存原方法。发行脚本724–730取入该版本，无该组件patch。

除两个哈希配置参数和 override_method 外，变量按使用时机求值，不强行标为某个请求阶段。继承依每组真实配置关系填写。

## 本轮实际检查

使用既有 verify-nginx-patches.mjs 的回放逻辑，在本次 mkdtemp 副本按34个有效patch及固定替换应用，核对142个hunk与47个最终文件SHA256。最终74处注册、既有registration_evidence、callback及evidence引用均在固定源码有效EOF内，49处Nginx片段均保持原文；8份XML节点移除注释后仍为活跃同名节点。ngx_coolkit按其固定Git与发行获取片段核对。结论仅限本批明示事实，不推广到整个请求链。临时副本在finally清理，未执行来源构建或生成器。

首次临时校验命令因嵌套字符串转义失败，第二次因stdin进程argv基数错误失败；修正验证命令后实际检查通过，未把失败当成证据，也未修改产品脚本。

首次隔离build拒绝ngx_coolkit重复的module-owner来源ID：正式catalog已自动提供该来源，草稿不应重复添加。删除草稿中的重复evidence，保留事实对正式module-owner的引用，未修改构建契约。修正后隔离build实际通过：197+9=206，候选 `1.27.1.1-673f9696c504e1fb`，1017注册、0深度、范围true。复制site/src和临时analysis/config，源仓库只读链接；逐条检查basic状态、完整身份差集及根current未变，临时目录finally清理。仍待独立逐义审核，不据准备态宣布C02完成。

独立审核R22指出两个map哈希参数没有在各自引用中包含向hash构建器传值的296–297行。已只将两项implementation-1由300–360扩为295–360，正文与source_ids不变；新范围实际回放检查通过，74来源/49段原文保持。旧隔离候选673f9696c504e1fb为修复前历史，不充作修复后发布；修复交差异复核，其他七项已准备通过。
