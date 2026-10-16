# 样例剩余14项：VTS display 证据

日期：2026-10-13。仅改 `nginx-module-vts/ngx_http_vhost_traffic_status_module/vhost_traffic_status_display` 的默认、继承和证据；其他字段及23项扩展保留。固定VTS revision 52fe11e44c47a49b052be89e36dfa17d81bf52a5；核心引用为Nginx 1.27.1/e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928。

## 已核对事实

- display.c:1040–1048 唯一安装 display handler 的配置回调，未读取参数，不是on/off字段。README:1374–1382 default为空，只交叉印证默认未配置；其中context/开关描述原有冲突继续保留，不将整段文档升级为verified。
- core_module.c:3548–3653 完整create_loc_conf将新对象零初始化，没有设置handler；3669–3954完整merge_loc_conf没有复制handler。1377–1384仅当当前location handler非空才设置请求content_handler。
- VTS module.c:987–1163 create/merge只处理模块自身字段，未安装核心handler；全src搜索只有上述display配置回调安装该函数。format/enable等字段的默认与继承不能推导展示入口继承。
- 独立子location与沿用同一location配置区分；不声称现场模块组合行为已运行验证。

## 发行补丁边界

审计所列34个有效补丁中，唯一修改core_module.c的是no_error_pages。已读固定OpenResty补丁全文，涉及create/merge的修改仅error_pages字段，不引入handler赋值或继承。这里引用的核心片段仍为上游原始坐标，不冒充补丁后全文。扩展patch_status继续not_applicable，不改现场兼容性unverified；只核对固定源码配置模型。

验证与独立审核由本批统一记录，本文不冒称Nginx实机运行或上线验收。
