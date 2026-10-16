# P10 第二组：字符集、SSI与用户标识21项准备

2026-10-12。完整3个owner：charset5、SSI7、userid9。与第一组14项共同覆盖P10全部35身份，不重复既有知识，尚未合入正式330。唯一准备写集为HTTP_CHARSET_SSI_USERID_BASIC.json及本记录。

固定Nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928、nginx.org e8b581903e9d41252720053311cea687a5671674、OpenResty8c37412c31621225e7aa7e825b5b50106c9c71c4。直接阅读固定源码的注册、回调、merge和使用路径及官方XML。没有编译/运行来源程序或处理真实Cookie、SSI、文本转码。

## 重点边界

- charset：主响应目标/源选择、已有charset/Content-Encoding、子请求使用主请求目标分别核定。source_charset的off不是目标charset那样的特殊关闭值；不同静态编码缺表在postconfiguration报错，动态缺表在请求路径处理。charset_types不是所有转换路径的全局门禁，显式列表不保留全部六种默认。charset_map建立双向表但不是任意编码转换器。
- SSI：注册7项与内部include/echo等命令分开；配置开关、MIME/空正文、错误文字、文件缓冲严格大于阈值、recycled标志传播、主响应头变化逐项有据。ssi_ignore_recycled_buffers没有同名XML，直接引用实现。ssi_value_length固定XML默认256与源码merge255不一致，正文明确写出255及value_len+1缓冲，不机械采用文档数字。
- userid：off/log/v1/on及变量读取与发送条件区分；service按v1/v2和地址族分支，name/domain/path/p3p按字面保存；domain/path/p3p引用真实post绑定及函数。expires off只是无Expires，不是删除Cookie；已有ID保留时不自动刷新。mark保留ID重发与uid_reset新建区分。flags位掩码的off不是清零，SameSite共享位有重复拦截，不声称none自动补secure。

## 实际验证

201处固定引用均在有效EOF内，20个同名XML节点活跃；34补丁、142hunk、47最终SHA256临时回放通过，160段Nginx引用全部逐字保持。准备期间修正了三个文件末尾范围及SSI owner起点，未将超EOF候选送审。

隔离330+21构建实际得到351基础候选 `1.27.1.1-d4dc5d72014f787a`，1017注册、0深度、范围true。按3完整owner核身份差集及每项basic状态，根current读取前后不变，临时副本finally清理。该候选仅实施验证，不作为正式接入或独立审核结论。
