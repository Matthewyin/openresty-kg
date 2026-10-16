# 项目上下文入口

本文件仅补充本项目的事实来源；通用协作规则沿用当前生效的上级 `AGENTS.md`。`CLAUDE.md` 仅为兼容入口。

- 判断目标、范围或变更优先级，先读 [REQUIREMENTS.md](REQUIREMENTS.md)。
- 修改网站、Agent、接口、会话、缓存或部署方式，先读 [ARCHITECTURE.md](ARCHITECTURE.md)，再核对其中指向的实现与配置。
- 接续开发或报告完成情况，先读 [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) 的状态及对应验收记录；区分当前实现、历史验收和待设计能力。
- 构建、启动与使用入口见 [README.md](README.md)；环境值以其引用的配置文件为准。
- 研究配置内容时，以 `project.config.json` 指定的来源、revision、补丁和知识材料为依据；当前发布读取 `dist/knowledge/index.json`。新增模块沿用现有固定来源与内容核对流程。

项目用于理解配置与追溯源码，现场有效性不属于交付目标。Pi 使用项目内依赖与状态目录；本机验收不代表部门部署完成。旧决策原文见 [历史说明](analysis/history/README.md)，不作为现行执行约束。
