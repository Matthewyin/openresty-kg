# 配置输入无反馈：修复记录

日期：2026-10-10。用户输入：

```nginx
events {
    multi_accept on;
    worker_connections  65535;
}
```

## 原因与修复

原页面 URL 为 `file:///…/site/index.html`。浏览器实测点击查询后结果区为空，加载状态不变；模块脚本无法启动，连模块内的失败 catch 也不能执行。另外 `site/` 为源文件目录，不包含构建生成的知识和共用模块。

新增普通启动脚本：本地文件打开直接显示构建与 HTTP 打开方法，点击查询仍有明确反馈；HTTP 下动态导入失败也明确提示。新增有限生命周期、只监听 loopback 的临时静态预览，不留常驻业务服务。误在单项模式提交普通块时，提示切换“配置片段 / 完整文本”。

另修复构建来源问题：发行版 Nginx 下载来源是 tarball，组件矩阵的 repository 为 null，曾生成 `null/blob/...` 引用，导致详情校验失败。构建从本地仓库真实 origin 补齐来源并保留固定 SHA。

## 验证结果

- 修复前真实浏览器复现点击后 `query-status` 为空；修复后相同 file 页面及点击均显示 `npm run build`、`npm run preview` 提示。
- HTTP 页面选择配置文本模式后提取 3 项；块头 `events` 外层未知保持 `context_required`，两个子项均在 `events` context 返回 `matched`。
- 点击 `worker_connections`、`multi_accept` 均能读取对应详情，来源链接使用固定 Nginx 完整 SHA。`worker_connections` 的功能草稿仍标明 OpenResty 补丁及完整限制未核定；成功匹配不等于基础知识完成。
- 浏览器 Network.requestWillBeSent 记录显示详情读取是 GET，URL 仅含发布与知识身份，没有原配置或参数，没有请求正文。配置文本模式本身不发配置上传请求。
- `npm test`：31 项通过，含用户原始 events 片段的解析及匹配回归，以及网页单项查询固定发布快照；876 份当前详情通过格式、身份和源码行数检查。
- 官方 SDK 启动真实 stdio MCP 子进程，使用正常 HTTP fetch 读取临时站点；`worker_connections 65535;` 加 `context=events` 返回 matched、同一发布及 4 份来源。子进程检查结束即关闭；这不是 Codex 宿主接入验收。
- 当前构建发布：`1.27.1.1-a0b3eef729cb3819`。截图：`analysis/events-query.png`。
- 旧的未通过来源校验的生成发布已移出 `dist/`，保留在 `analysis/rejected-builds/`，不进入网站托管产物。

不据此宣布全量基础覆盖或 Codex 宿主接入验收完成。打开方法与托管、工具配置见项目 README。
