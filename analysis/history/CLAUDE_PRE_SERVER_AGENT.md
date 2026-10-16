# 项目：OpenResty 开源仓库研究（锁定版本 v1.27.1.1）

本项目用于研究 [openresty/openresty](https://github.com/openresty/openresty)，产出中文分析报告。沟通与输出默认使用中文。

**全程锁定 openresty v1.27.1.1**（所有组件版本以该 tag 的 `util/mirror-tarballs` 为准）。
**原则：只做源码分析，不做本地部署**——不运行 mirror-tarballs、不编译、不启动任何本地服务（含 understand-dashboard）；所有产物为 `analysis/` 下的 markdown 文档。

## 仓库现状

- 主仓库克隆于 `./openresty`，checkout 在 tag **v1.27.1.1**（基于 nginx 1.27.1）。
- 主仓库是"打包/构建仓库"：核心代码在构建时由 `util/mirror-tarballs` 下载，非 git submodule。

## v1.27.1.1 组件版本矩阵（关键项，来源：该 tag 的 util/mirror-tarballs）

| 组件 | 版本 | 本地位置 |
|---|---|---|
| nginx | 1.27.1 | 未下载（需要时补克隆） |
| lua-nginx-module | v0.10.27 | `repos/lua-nginx-module` |
| lua-resty-core | v0.1.30 | `repos/lua-resty-core` |
| stream-lua-nginx-module | v0.0.15 | `repos/stream-lua-nginx-module` |
| luajit2 | v2.1-20240815 | `repos/luajit2` |
| lua-cjson | 2.1.0.14 | 未下载（zread 按需查） |
| resty-cli | 0.30 / opm 0.0.8 | 未下载 |

其余 ~35 个组件（lua-resty-dns/redis/mysql/memcached/websocket/string/lock/lrucache…、echo/headers-more/memc/redis2 等 C 模块）**不下载**，用 zread MCP 远程按需查阅。

## 目录布局

```
nginx/
├── openresty/     # 主仓库 @ v1.27.1.1（Makefile、util/、patches/、t/）
├── repos/         # 4 个核心仓库（clone 后 checkout 到上表版本）
└── analysis/      # 分析报告（markdown）
```

## 主仓库结构速查

| 路径 | 内容 |
|---|---|
| `Makefile` / `util/mirror-tarballs` | 组件清单与版本矩阵（本项目的版本权威依据） |
| `util/ver` | main_ver=1.27.1, minor_ver=1 |
| `util/configure` | 构建配置生成器 |
| `patches/nginx/1.27.1/` | 对 nginx 核心的 OpenResty 手写补丁 |
| `patches/` | 对 LuaJIT / OpenSSL(cosocket yield) / lua-5.1.5 等的补丁 |
| `t/` | sanity 测试 |

## 工具链状态（2026-09-30 已装好）

- **Understand-Anything v2.9.7**（知识图谱插件），三环境全部安装完成：
  - 底座：`~/.understand-anything/repo` + 9 个 skill 链接到 `~/.agents/skills/`（ZCode、Codex 共用）+ `~/.understand-anything-plugin` 插件根链接；`pnpm install` + `@understand-anything/core` 已构建（tree-sitter C/C++ 等语法可用）
  - Codex：`$understand` 调用
  - Claude Code：插件方式安装（`understand-anything@understand-anything`，user scope，含 agents/hooks 全功能）；marketplace 注册用 https URL + `CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS=600000`（本机 SSH 不通、默认 120s 超时不够）
  - ZCode：`/understand` 调用，**需重启 ZCode 加载新技能**
- 本地 CLI：`rg`、universal-ctags 6.2.1（`/opt/homebrew/bin/ctags`，Xcode 自带 BSD ctags 不支持 -R）、`tree`、`git`；MCP：`zread`（免 clone 读 GitHub）、`context7`
- ctags 索引已建：openresty 13.6k / lua-nginx-module 2.7k / lua-resty-core 0.7k / stream-lua 1.7k / luajit2 10.8k 符号

## 分析路线

1. **主仓库解剖**：v1.27.1.1 的组件矩阵 → `patches/nginx/1.27.1/` 差异分析（OpenResty 改了 nginx 什么）→ util/configure 构建编排 → t/ 测试
2. **核心组件**：按 lua-resty-core → lua-nginx-module（README 即权威文档 + t/*.t 当规格书）→ stream-lua → luajit2 的顺序深读
3. **机制主线**：nginx 11 个请求阶段 × Lua 挂载点、cosocket/协程调度（含 OpenSSL yield 补丁缘由）、shared dict / worker 事件模型、light thread
4. **工具辅助**：`/understand <repos/某仓库>` 生成 knowledge-graph.json（产物留在项目内，不启动 dashboard），解析后并入 markdown 报告；token 消耗先小后大

### 分析纪律（借鉴 codebase-analysis-skill 方法论）

- 所有结论必须带 `file:line` 引用；不确定就标注"未验证"
- 优先读 t/*.t 测试作为行为规格，再读 C 实现
- 区分"v1.27.1.1 的行为"与"master 最新行为"，不混用
