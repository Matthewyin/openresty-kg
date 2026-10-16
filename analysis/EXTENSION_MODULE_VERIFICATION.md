# 部门扩展模块验收记录

日期：2026-10-13。状态：已完成，本轮实现、主验收及独立审核通过。最终发布为 `1.27.1.1-948dd5954553c1bf`；以下保留准备与首轮检查记录，最终结论以文末及独立审核记录为准。

## 范围与基线

- 原发布：`1.27.1.1-eeabda4eba7f5c16`，1017 个注册项及基础条目，0 个深度条目。
- 本轮增加部门扩展模块来源分类，首批只接入 VTS；不修改用户配置样例，不接触生产主机，不部署外网。
- 部门已提供两份配置样例，接收记录见 `DEPARTMENT_SAMPLE_INTAKE.md`。现场模块版本、编译参数和兼容性仍未知。

## 固定来源准备（主 Agent 实测）

- 官方仓库：`https://github.com/vozlt/nginx-module-vts`。
- 使用 `gh repo clone` 获取到此前不存在的 `repos/nginx-module-vts`；未覆盖原有仓库。
- 本地 detached HEAD：`52fe11e44c47a49b052be89e36dfa17d81bf52a5`。
- 提交时间：`2026-10-11T11:04:24+09:00`。
- 提交标题：`Merge pull request #402 from u5surf/test/measure-status-codes`。
- origin 与官方仓库一致，工作树干净。
- 头文件版本宏为 `v0.2.7`，但本轮锁定的是提交快照，不据此宣称为 `v0.2.7` 正式发布或现场版本。
- 使用现有 `extractCommands` 提取固定 `src/ngx_http_vhost_traffic_status_module.c`，得到 24 个命令注册。
- 使用现有 `reviewRegistrationBuild`，以固定源码树和 `config` 为输入，返回 `status=verified`、`complete=true`、`reasons=[]`、24 个正式构建注册。全程只读，不执行模块构建脚本。
- README 目录为 22 项；必须以正式构建注册集合验收，另两项为 `vhost_traffic_status_measure_status_codes`、`vhost_traffic_status_ignore_status`。

## 验收检查项（已完成）

1. 发行版与扩展来源分别计数、标注版本和适用边界，旧发布保持可读。
2. VTS 全 24 项注册、中文基础内容、context、回调和证据一致。
3. 样例四项经真实查询链路匹配；未知项与语法错误区分。
4. 错误来源、revision、重复身份和越界补丁状态等输入被拒绝。
5. 最终构建、自动测试、HTTP 和桌面验收及独立审核。

## 首轮实际构建及验收（非最终审核结论）

- `npm run inventory && npm run build` 成功，发布 `1.27.1.1-ed476aa8a478d5e9`。
- schema 2，总注册/基础/深度 `1041/1041/0`；发行 `1017/1017/0`、扩展 `24/24/0`；两组范围核定状态均为 true。
- 发行组件矩阵仍为 43 项，VTS 不加入该发行矩阵；扩展另行盘点。
- 本地限时预览 `http://127.0.0.1:64706/`。
- `node analysis/verify-extension-http.mjs http://127.0.0.1:64706/` 成功：24 项真实 HTTP 查询、合成样例四项匹配、错误 HTTP/stream context、未知项、静态 GET 隐私、旧发布查询均通过。
- 同一 HTTP 验收逐份比较旧 1017 份详情，除 schema/release 和新增来源字段外，所有既有字段原样保留；旧 index SHA256 仍为 `961e1ad50943cd57abbb5847d0aae800d1bfce4e4f886e8f2a016c1a8c358d6d`。
- 桌面通过 ego-browser 空间 2 / p1 执行 `analysis/verify-extension-browser.mjs`：24 项来源筛选、四项配置候选与详情联动、未知与语法错误分离、不残留旧详情、历史链接及 GET 隐私通过。
- 桌面初次使用 eval 加载含静态 import 的脚本失败；未执行页面操作。改为 ESM import 后完整执行成功，不将此执行方式错误记为网站问题。
- 主已查看 `analysis/vts-desktop-verification.png`，1352px 桌面无整页横向溢出。来源筛选宽度及目录小字相贴问题已退回实施做最小样式修正。
- 审核 R03 的证据补充、完整自动测试和最终冻结发布尚未收口；以上仅证明首轮真实流程，不提前宣布本轮通过。

## 最终发布验收

- 最终候选发布：`1.27.1.1-948dd5954553c1bf`，schema 2，数量保持 `1041/1041/0`、发行 `1017/1017/0`、扩展 `24/24/0`。
- current index SHA256：`3df45bf8ad9759a7b48bb8cd5cb22153c1bc72c30036f88d39503f23fab63076`。
- 实施阶段曾有 6 项旧测试夹具失败，实施已修正相关 schema/扩展配置夹具，专项 27/27 通过。主在最终候选上执行 `npm run build && npm test`，完整结果 **90/90 通过**，0 失败、0 跳过，约 33.36 秒；不是仅引用实施者自报。
- 新测试覆盖 A01–A09：发行内容保真、24 项正式集合与逐字源码、context/unknown/语法区分、旧 schema 来源注入拒绝、同组件来源混用拒绝、历史查询，以及隔离第二模块的真实盘点/构建/查询、连续构建稳定、错误来源失败不替换 current、移除扩展后无残留。测试隔离目录在 finally 中清理，未初始化项目根 Git。
- R03 所需的节点/调用者、bitmask setter、JSON 消费证据均已补入；主明确了 bypass_stats/ignore_status 的执行顺序，并改正两处旧文档“样例待提供”表述。来源标签分行、来源筛选宽度与模块筛选一致。
- 原预览 64706 按十分钟定时正常退出，重新启动限时预览 65412；复用同一桌面空间 2，没有新建替代空间。
- `node analysis/verify-extension-http.mjs http://127.0.0.1:65412/` 在最终候选通过全部检查，原 1017 份详情和旧 index 仍保持一致。
- 最终桌面首次点击长目录中深处的条目遇到自动滚动后的 pointer intercept。观察页面及截图后，使用可见条目 ref 实际点击成功；脚本改为真实“来源筛选 → 名称搜索 → 点击”流程，并使用配置行候选进入详情，未绕过点击或调用内部事件处理器。
- 随后 `analysis/verify-extension-browser.mjs` 在最终候选完整通过：来源筛选24、样例四项、详情联动、unknown/parse_error分离、旧详情清除、历史链接、静态GET与参数不上传均通过。最终截图覆盖为 `analysis/vts-desktop-verification.png`。
- 不做手机、模块编译运行、现场版本推断或生产部署。独立审核最终结论另见 `EXTENSION_MODULE_REVIEW.md`。

## 收口结论

- 独立审核确认 R01–R03 全部关闭，无阻断项；E01–E04、A01–A09 本轮通过。
- 最终截图经主查看：1352px 桌面没有整页横向溢出，目录来源单独分行，来源/模块筛选均宽310px，VTS详情内容与最终发布一致。
- 后续模块按 `EXTENSION_MODULE_PLAN.md` 的追加流程执行，不自动抓取最新版；现场部署与兼容性、部门深度内容仍单独待验收。
- 桌面验收空间已正常关闭。验收用临时 HTTP 服务在收尾停止；后续查看运行 `npm run preview`，不复用记录里的临时端口。
