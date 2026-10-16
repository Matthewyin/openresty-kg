# 查询目录与详情联动：主线程验证记录

日期：2026-10-10。对应方案：`analysis/QUERY_UI_PLAN.md`。本记录只证明本轮 UI 联动，不表示全量知识和 Codex 宿主验收完成。

## 原始故障及最小原因

用户 server 片段包含 server、listen、proxy_connect_timeout、proxy_timeout、set、proxy_pass、access_log、error_log。修复前真实 HTTP 浏览器能提取 8 项，但目录仍显示 10 项 Lua 示例，详情保持 lua_load_resty_core。`test/browser/query-ui.mjs` 在同一代码路径断言目录名称全部来自输入，修复前报“目录不能保留本次输入之外的 Lua 示例”。

页面原先仅更新解析行，目录始终从全站过滤，详情则启动时自动打开首条。目录的默认核对筛选又隐藏了仅注册的 Nginx 候选。修复加入当前候选范围及查询代次；不修改核心解析、知识 JSON、MCP 或真实配置语义。

## 已完成验证

- `node --check site/app.mjs`、`node --check site/bootstrap.js` 通过；构建成功，site 三份修改资产与 dist 对应文件 cmp 一致。
- `npm test`：31 项通过。该命令不包含下述浏览器回归。
- `test/browser/query-ui.mjs` 真实浏览器通过：目录仅当前候选，8 个名称完整可见、注册项不被隐藏、候选计数一致；孤立 server 保持未知并提示提供实际外层；无旧详情；选定 stream 的 proxy_pass 预览不改写原歧义结果；编辑、未知、解析错误清旧状态；显式 stream 外层得到对应匹配；全站浏览、旧筛选撤销、单项唯一候选预览和永久链接正常。
- `test/browser/query-ui-async.mjs` 真实浏览器通过：在客户端初始化前注入受控 fetch 暂停；A 详情读取中编辑并提交 B，A 迟到成功和失败均不能改写 B 的目录、详情、状态或按钮；先选 A 后选 B，A 迟到详情不能覆盖 B。测试结束移除注入并 reload，未修改站点运行代码或留下测试 hook。
- 独立审核发现 UI-01：当前单项已匹配但详情失败时候选被提前清空。新增真实浏览器断言先复现 0 候选而期望 1；返工后确认保留 1 候选、重选恢复详情且不将原失败状态改成 matched。索引失败仍为 0；普通候选详情失败保留本次列表、撤销选中态。扩充后的异步脚本全部通过。
- 应用内浏览器重放用户原文：提取 8 个配置项，目录 22 个去重知识候选（同名跨模块保留），没有旧 Lua 条目；详情提示本次多条输入须选择候选。候选数不等于配置项数。
- 按用户标记的 744×778 视口保存 `analysis/query-ui-fixed.png`；无横向页面溢出。临时测试视口随后恢复。

## 浏览器回归复现命令

先 `npm run build`，再启动有限生命周期的 `npm run preview`。UI_TEST_URL 取该命令输出的实际地址；UI_TEST_SPACE_ID 为当前目标首次创建并打印的 TaskSpace 编号，同一目标中复用。ego-browser 的远端脚本环境不透传 shell 环境变量，所以由本地 Node 读变量、生成一行参数，随后拼接已保存脚本：

```sh
UI_TEST_URL="http://127.0.0.1:<实际端口>/" UI_TEST_SPACE_ID="<已有编号>" node --input-type=module -e 'import {readFile} from "node:fs/promises"; process.stdout.write("const uiTest = "+JSON.stringify({url:process.env.UI_TEST_URL,spaceId:Number(process.env.UI_TEST_SPACE_ID)})+";\n"+await readFile("test/browser/query-ui.mjs","utf8"));' | ego-browser nodejs
```

异步检查使用相同参数与同一空间，把文件名换成 `test/browser/query-ui-async.mjs`。这是临时本机静态浏览器验证，不修改 Codex 配置、内网托管或生产环境。

独立审核结论单列于 `analysis/QUERY_UI_REVIEW.md`，不由本记录代替。
