# 主配置根上下文验收

## 修复前

- 直接调用 `parseConfig`：用户样例主配置提取 24 项，无结构错误；五个顶层项 context=null，匹配状态 context_required；四项 VTS 已 matched。
- 最小复现 `events {}`：顶层 context=null。
- 同样五项向匹配器显式传入 main 后全部 matched，定位为解析根上下文遗漏，不是知识缺失。
- 内置浏览器原页面实际提交同一样例：提取 24 项，其中 5 项“上下文尚未确定”。

## 范围

用户采集文件仅取主配置（原文件第 3–73 行），不合并其他主机片段；两个 include 外部内容未提供。原配置不复制进测试或新增仓库文件。

## 修复后

- 实施先写回归并确认五项失败（null 不等于 main），修复后 parser/matcher 32 项通过。
- `npm test`：101 项通过，0 失败；`npm run build` 成功。
- 发布知识内容未改，release 仍为 `1.27.1.1-948dd5954553c1bf`，1041 条知识；本次更新的是静态解析代码。读取构建后的解析器验证与源码逐字一致。
- 直接对构建产物调用 parseConfig/matchDirective：用户样例 24 项全部 matched，五个顶层节点全部 main，两个 include 仍为 not_analyzed。
- 内置浏览器实际复测：主配置 24 项全部“唯一匹配”，worker_processes、worker_cpu_affinity、events、stream、http 全部显示 main；四项 VTS 分别保留 http/http.location，两处外部引用提示保留。
- 浏览器反例：孤立 `server { listen 12013; proxy_timeout 300s; }` 三项均 context 未知，并提示提供外层块；`events {} http {` 明示解析失败/不完整，无候选按钮，未推断 main。
- 最后恢复用户主配置、展开 VTS display_format 详情，并定位到顶层结果供查看。截图：`analysis/root-context-fixed.png`。
- 旧预览到期，新预览 `http://127.0.0.1:61191/`；仅本机、依现有配置 10 分钟到期。没有改预览时长或新增后台常驻服务。
- Astra low 独立审核通过，关键边界探针通过，无需打回；详见 `analysis/ROOT_CONTEXT_FIX_REVIEW.md`。
