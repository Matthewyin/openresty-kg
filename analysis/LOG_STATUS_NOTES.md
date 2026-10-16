# HTTP/stream 日志及基础状态：6项待审

2026-10-10。按 C02 后续方案 P12 精确差集准备：HTTP log_format/access_log/open_log_file_cache 三项、stream log_format/open_log_file_cache 两项、stub_status 一项。旧HTTP补丁新增log_escape_non_ascii及已核stream access_log保持，不重复产出。仅新写 `content/LOG_STATUS_BASIC.json` 及本记录；当前正式191项之外不计覆盖。

## 一手来源与逐义核对

固定 Nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928、docs e8b581903e9d41252720053311cea687a5671674、OpenResty8c37412c31621225e7aa7e825b5b50106c9c71c4。每条包含显式callback/module-owner/运行与合并代码、活跃同名XML；三种owner和两域同名项不合并。

- HTTP log_format：文字/变量编译为日志操作，default/json/none只作用于变量；JSON转义不保证整行JSON合法。普通变量缺值在default输出连字符，在json/none不输出字符。命名格式仅http层，combined预建。
- HTTP access_log：日志阶段按最终location配置输出，多个目标与off、条件空值/单字符0、格式选择、缓冲和gzip限制分别核。变量名称或syslog不允许buffer，flush须有缓冲，gzip须zlib。路径默认来自构建常量，不猜用户安装路径。父日志数组整体继承，本层数组或off阻止继承。
- 两项HTTP正文涉及log_escape_non_ascii：默认转义的非ASCII行为由请求层开关决定，默认on；引用原发行patch，不套用未补丁XML的固定表述。json/none路径独立。缓存相关事实不因此机械标整个模块affected。
- stream log_format：独立会话变量和转义路径；主配置格式数组初始为空，没有HTTP内置combined。不受HTTP的log_escape_non_ascii控制，也不自动启用access_log。
- 两域open_log_file_cache：变量名称日志的打开文件描述符/信息缓存，非正文缓冲；max、inactive、min_uses与访问时valid重验证有各自代码，不称后台定时轮转。stream没有HTTP请求root目录检查；都保留目录权限/文件打开限制，不承诺落盘必成功。
- stub_status：安装内容handler，GET/HEAD输出运行全局计数的text/plain，其他方法405。注册兼容0或1参数，但callback不读取参数，所以off不是关闭开关。未声称现部署启用、提供完整监控或upstream健康判断；默认/完整继承保持unknown。

## 实际隔离检查

mkdtemp回放固定34项补丁与核定版本替换，142个hunk的数量/偏移/fuzz及47个最终SHA256一致。最终59处注册/callback/evidence均在有效EOF内；45处Nginx片段中42处保留，3处变化恰为HTTP log_format的普通变量转义片段、HTTP access_log的merge及相同转义片段，均由log_escape_non_ascii原patch:43–117覆盖。两项为verified_affected，其余四项只核所列局部事实unaffected，不把片段不变推广为整条错误日志链不变。临时源码finally清理，未编译运行或执行生成器。

实际隔离build基于当前191项仅追加本6项，得到1017注册、197基础、0深度、范围true，临时候选 `1.27.1.1-f8d93a840d4f0719`；callback/source IDs/schema/目录范围及发布门禁通过，临时副本及产物finally清理，根current未变。本组完整6项就绪，待独立逐义审核；不以隔离计数宣布全站内容或C04完成。
