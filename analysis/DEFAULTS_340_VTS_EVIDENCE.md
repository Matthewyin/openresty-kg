# VTS两项默认值补证

日期：2026-10-15。范围为固定340清单中两个VTS身份的defaults字段；原有inheritance、limitations、availability及其他字段均不变。未进行现场模块安装或运行验证。

## 固定来源与补丁归属

读取 `repos/nginx-module-vts` 的Git对象 `52fe11e44c47a49b052be89e36dfa17d81bf52a5`，不使用工作树或最新版本替代。两项均为部门扩展快照，沿用原 not_applicable 发行补丁状态与 module-build/registration 来源，不将其视为OpenResty内置。没有改动第三方源码。

## 逐项结论

| 完整身份 | 字段 | 省略行为与证据 | 显式配置及父级边界 |
| --- | --- | --- | --- |
| nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_filter_by_set_key | defaults | module.c:888–903 的main创建及986–1006的local创建均零初始化filter_keys；shm.c:558–589只在相应列表非NULL时运行统计。无主规则及父级链规则时，不产生默认过滤规则。 | filter.c:365–437仅由指令回调创建/追加数组，http写ctx、其他上下文写vtscf；module.c:1069–1083局部空列表继承。省略本层不等于覆盖或禁用http主列表/父级局部列表。 |
| nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_set_by_filter | defaults | module.c:986–1031将filter_vars设为UNSET_PTR，1123–1150在模块启用的合并路径中以父列表或NULL归一；set.c:392–479在NULL时不赋值。不是将变量设为0。 | set.c:483–544仅显式指令创建规则及注册变量；父级有列表时继承，子显式列表不追加父列表。set.c:30–52的处理入口受模块/过滤开关约束；模块禁用时不承诺执行合并后的值。 |

引用ID：第一项新增filter-main-create、filter-local-create，复用filter-parser/filter-inheritance/filter-runtime；第二项新增set-local-create、set-merge-enabled，复用merge-values/set-parser/set-value/set-handler/phase-hook。按审核VTS-R1补上module.c:1063–1067的合并早退及原ACCESS阶段注册引用，未改变旧证据范围。源码初始值与最终可见默认行为分别说明；不改原继承事实。此次只补默认字段，不增加runtime或提升评级。

实施已完成，独立审核及最终发布/测试/页面结果由DEFAULTS_340_REVIEW、DEFAULTS_340_VERIFICATION记录；本文不预写通过。
