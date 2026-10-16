# API 与变量参考研究范围

本批提供 4 个 HTTP Lua API 与 4 个 stream 变量的固定版本参考，旨在验证网站独立参考浏览通路。摘要和限制只说明所列范围，不对输入 Lua 代码做语义分析，也不计算变量值。

API：ngx.log、ngx.var、ngx.shared.DICT.get、ngx.shared.DICT.set。主依据 HTTP Lua 0.10.27 的固定 README 与 C 实现；共享字典另引 lua-resty-core 0.1.30 的 FFI wrapper。DICT 是配置字典名占位。set 的 nil 删除路径有 C 证据，不将 nil 描述为持久存储值。

变量：stream $remote_addr、$upstream_addr、$session_time、$status。依据 Nginx 1.27.1 的注册与 getter；不能混为 HTTP 同名变量，也不据 getter 推断完整业务/重试/状态生成路径。本项目已有有效补丁审计，所引 stream 变量与 upstream 源文件不在有效补丁修改目标内。

ngx.log 的宏长度单独引用 OpenResty larger_max_error_str 生效脚本及补丁：未预先定义该宏时默认 4096，已有定义不被覆盖；日志前缀共享缓冲区。没有据上游 README 的 2048 直接推断 OpenResty 最终行为。

构建从固定 revision 取原文，包含组件、版本、完整 SHA、路径、行号及固定远程 URL。本批语义经过独立审查并修正，不是通过自动提取来源就宣布事实可靠。发布中所有参考 sources 另逐字与 Git 核对。尚未编译或运行 OpenResty。
