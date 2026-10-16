# Final25：剩余运行消费统一实施与审核计划

日期：2026-10-14。角色：规划。本文只定义交付契约，不是源码审核通过、实施完成或测试通过记录。输入为 SAMPLE_REMAINING_RUNTIME_PLAN 的 B3—B11，以及 B2 的 PLAN/EVIDENCE/REVIEW/VERIFICATION 契约；本轮只写本文。

## 深度交互：目标与边界

目标是逐项解释固定发行版中的真实消费、条件、失败出口和作用边界，不是将25项强行晋级。B3—B11是研究顺序，统一使用 final25 基线与最终审核，不再要求每小批构建或逐批用户确认。源码注册、配置合并、安装 handler 本身不能代替运行调用；server、zone、log_format 尤须闭合配置产物到真实消费者。

用户已授权连续推进并完成测试和页面验收。主线程流控、实施逐项补证、审核对照本文打回修正；沿用已确认角色，不由本规划新建聊天或重选模型。源码取证只使用本地固定 Git 对象，不需联网。规划子Agent只修改本文；实施者不build、不写dist、不读取或复制私有配置，不修改src、site、schema。上述子Agent边界不限制主线程：主线程本轮必须统一构建、完成测试、将原样例仅在本地内存回放，并对全部25项完成同一最终release的网页验收，无需另行申请构建或验收授权。

## 直接执行：唯一比较基线

固定发布目录：`dist/knowledge/releases/1.27.1.1-06a6394fb516a4bb/`。已只读确认1041 basic（包含deep）、19 deep；bundled 1017/19，department_extension 24/0。所有小批均与此目录比较，不滚动换基线，不以 current 或 HEAD 代替。

本次实读 SHA-256：

| 冻结对象 | SHA-256 |
| --- | --- |
| knowledge/directives.json | a2666ba27952f66a749ae9ab1557d4d13e34e529976b9137ed7cf05570676b82 |
| knowledge/extensions.json | 38524066bf9998aec06d372a04d18753c60aa321173477e1375aac65a3e692d9 |
| 固定发布 index.json | 88ca7cfae65c56e60b5afe3e59d0e6d9479b1f66a0cbbcfb57cc296977cf436c |
| analysis/NGINX_PATCH_AUDIT.json | 4248d0c4634e87f8714e32d194b4da566ff489877e7bf86ea6bf0d5e378d53ce |

实施首次写入前，以上述摘要核定输入，将25对象各自完整对象摘要、旧 evidence 数量与前缀摘要、旧 patch 对象、非目标序列摘要固化在 FINAL25_EVIDENCE 和专项测试常量中。不得从已修改数据动态计算“旧期望”。如摘要已变，由主核对并恢复基线对应关系，不能直接接受漂移。

固定来源已确认在本地为 commit 对象：

| 组件 | 本地目录 | revision |
| --- | --- | --- |
| nginx | repos/nginx | e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928 |
| nginx-docs | repos/nginx-docs | e8b581903e9d41252720053311cea687a5671674 |
| OpenResty | openresty | 8c37412c31621225e7aa7e825b5b50106c9c71c4 |
| VTS | repos/nginx-module-vts | 52fe11e44c47a49b052be89e36dfa17d81bf52a5 |

原19 deep集合从固定索引原样冻结：core的worker_processes/worker_cpu_affinity/worker_rlimit_nofile；event_core的worker_connections/multi_accept；HTTP proxy的proxy_pass/proxy_connect_timeout/proxy_send_timeout/proxy_set_header/proxy_read_timeout/proxy_http_version/proxy_ssl_session_reuse；HTTP rewrite的set；HTTP core的resolver；stream core的resolver；stream proxy的proxy_pass/proxy_connect_timeout/proxy_timeout；stream set的set。必须保护其完整内容，不仅保护数量。

## 25个精确身份与逐项审核要点

以下是必须研究的消费链及失败边界，不是本次已逐行证实的源码结论。实施从固定对象定位实际函数与行区间，将每项“入口→消费→出口”落为步骤及本步直接证据；不得把下表候选路径当已核源码引用。N路径相对 nginx，V路径相对VTS；nginx独立文档来自固定 nginx-docs 的对应模块 XML，VTS独立文档来自固定 README 中对应指令段。

| 批次 | 精确身份 | 源码审核范围及必查边界 |
| --- | --- | --- |
| B3 | nginx--ngx_http_limit_conn_module--limit_conn_zone | N:src/http/modules/ngx_http_limit_conn_module.c。key表达式求值、共享节点查找/建立、计数与清理；空key、超长key、求值/分配失败、锁范围。共享区初始化不够晋级。 |
| B3 | nginx--ngx_http_limit_conn_module--limit_conn | 同模块阶段实际调用、已处理检查、多个zone计数、拒绝/dry-run及回滚/请求清理减计数；按源码与文档限定HTTP多路复用计数，不称TCP socket总量。 |
| B3 | nginx--ngx_http_proxy_module--proxy_limit_rate | N:src/http/modules/ngx_http_proxy_module.c、src/http/ngx_http_upstream.c、src/event/ngx_event_pipe.c。复杂值到上游缓冲读取限速，零值、缓冲开关、delayed/timer及恢复/读失败；不得称客户端下行速率。 |
| B4 | nginx--ngx_http_log_module--log_format | N:src/http/modules/ngx_http_log_module.c。已编译操作在日志handler中长度计算、变量求值、转义与实际填充；缺变量、分配失败及补丁改变的转义规则。 |
| B4 | nginx--ngx_http_log_module--access_log | 同模块及HTTP结束调用链。off/条件过滤、静态目标写入、缓冲与刷新、写入失败；动态路径/gzip/syslog如不纳入须明示范围，不能概括为全分支完成。 |
| B4 | nginx--ngx_stream_log_module--log_format | N:src/stream/ngx_stream_log_module.c。会话日志操作实际执行、变量缺失/转义/长度与输出；独立核stream调用，不复用HTTP语义。 |
| B4 | nginx--ngx_stream_log_module--access_log | 同模块及src/stream/ngx_stream_handler.c。会话finalize到日志调用、条件/分配/写入/刷新失败；状态是会话内部状态，不称HTTP响应码。 |
| B5 | nginx--ngx_errlog_module--error_log | N:src/core/ngx_log.c、ngx_cycle.c及实际进程调用者。cycle日志对象、级别/调试过滤、输出目标、重开与失败；核intercept分支，启动与运行日志区分。 |
| B5 | nginx--ngx_http_core_module--error_log | N:src/http/ngx_http_request.c、ngx_http_core_module.c及src/core/ngx_log.c。连接默认日志、server/location配置切换后的对象关联、真实错误输出与失败；不能虚构统一请求阶段。 |
| B5 | nginx--ngx_stream_core_module--error_log | N:src/stream/ngx_stream_handler.c、ngx_stream_core_module.c及src/core/ngx_log.c。接入选配置到连接日志对象、实际输出/过滤/失败；不套HTTP location或Host选择。 |
| B6 | nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_zone | V:src下实际统计handler、共享区/node代码。初始化到请求统计更新及展示读取；enable条件、节点分配失败/容量边界、同步与清理范围；仅配置zone不够。 |
| B6 | nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_filter_by_host | V:实际key构造与统计handler。开关到host/server键选择、缺失值、节点更新与失败；不是访问过滤或权限控制。 |
| B6 | nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_display | V:展示handler与实际输出代码。请求入口、允许方法、共享状态检查、读取、分配和发送失败；仅注册content handler不够。 |
| B6 | nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_display_format | V:展示格式分派与对应输出代码。配置格式到最终分派，URI/请求覆盖条件与fallback，输出链失败；不扩称全部管理API已审。 |
| B7 | nginx--ngx_core_module--pid | N:src/core/nginx.c、ngx_cycle.c及src/os/unix/ngx_process_cycle.c。PID写入/关闭、reload路径变化、升级重命名、退出删除的实际调用条件及失败；按覆盖范围记录保旧/继续/返回，不把路径解析当运行。 |
| B8 | nginx--ngx_http_core_module--listen | N:src/http/ngx_http.c、ngx_http_request.c及src/core/ngx_connection.c。地址配置到socket建立与accept后地址选择；bind失败、通配/共享监听/reuseport边界；TCP监听范围，不默认覆盖QUIC。 |
| B8 | nginx--ngx_http_core_module--server | N:src/http/ngx_http_request.c、ngx_http_core_module.c。配置对象由默认server及请求虚拟主机选择消费；Host无效/未匹配、TLS SNI条件与配置切换；不把块解析晋级。 |
| B8 | nginx--ngx_http_core_module--location | N:src/http/ngx_http_core_module.c及内部重定向调用者。实际静态/正则/命名查找、配置切换、拒绝与重定向重查/循环限制；区分正则编译条件、匹配失败和执行错误。 |
| B9 | nginx--ngx_stream_core_module--listen | N:src/stream/ngx_stream.c、ngx_stream_handler.c及连接/事件代码。socket到地址关联和会话初始化，失败清理；最小TCP路径，UDP若未独立闭合须明确未覆盖。 |
| B9 | nginx--ngx_stream_core_module--server | 同stream调用链。监听关联server配置到会话阶段调用、初始化失败/终结；不声称HTTP Host/location路由，不以注册阶段替代实际阶段运行。 |
| B10 | nginx--ngx_http_core_module--client_max_body_size | N:src/http/ngx_http_core_module.c、ngx_http_request_body.c及协议相关调用者。声明长度检查、chunked实际累计路径、0值、413/丢弃/清理及错误；HTTP/2/3只在独立核证后纳入，不泛称所有协议。 |
| B10 | nginx--ngx_http_core_module--keepalive_timeout | N:src/http/ngx_http_request.c及header filter。请求结束保留条件、0值、timer设置、下一请求和超时关闭；可选响应头参数与连接timer分别证明，不混上游keepalive。 |
| B11 | nginx--ngx_http_core_module--sendfile | N:src/http/ngx_http_core_module.c、ngx_http_copy_filter_module.c、src/core/ngx_output_chain.c和选定OS发送代码。有效标志到输出链、文件缓冲及系统发送/回退；平台/TLS/线程条件、短写/EAGAIN/错误，不保证零拷贝。 |
| B11 | nginx--ngx_http_core_module--default_type | N:src/http/ngx_http_core_module.c中类型选择及实际content调用者。已有类型、扩展名查找、未命中兜底及分配失败；不是覆盖所有响应头。 |
| B11 | nginx--ngx_http_core_module--server_tokens | N:src/http/ngx_http_header_filter_module.c、ngx_http_special_response.c及纳入的协议filter。Server头与内置错误页选择、已有header/非内置响应边界；OpenResty品牌/页脚/禁用错误页补丁必须合并解释。 |

精确范围为21个nginx身份、4个VTS身份；总数25且无重复。全部通过才有1041/44、bundled1017/40、department_extension24/4。部分通过时 deep 精确集合=基线19项∪实际批准子集，不能预填44。C1六项继续basic；未晋级者逐项列原因，不宣称全部runtime已完成。

## 字段白名单与证据契约

1. 后续实施只允许改 `knowledge/directives.json` 的21个身份及 `knowledge/extensions.json` 的4个身份，新增 runtime、追加必要 evidence、patch_status.source_ids旧前缀后追加及note限定范围说明。非目标1016条发布详情除未来正常release_id外全字段不变；非目标curated对象完整不变。
2. summary、syntax、mechanism、default/defaults、inheritance、limitations、phase/phases、related、availability、注册、配置入口和其他旧键均保护。旧证据ID、正文、顺序与全部元数据不可改；新增ID不能碰撞。旧式limitations字符串只有既有派生机制导致引用扩张时，允许固化为06a639完整facts对象，正文/状态/引用顺序/额外键必须逐字段相同，单列审计；不能借此修旧事实。
3. runtime沿用 `{status,text,steps:[{condition,action,source_ids}],source_ids,corroboration_source_ids}`。每步绑定实际条件、动作、失败出口及所需调用者/清理helper；总source_ids精确等于步骤首次出现去重并集。独立固定文档放corroboration，不能混作运行代码。验证等级使用现有deriveVerification，不手写、不改晋级规则；verification_notes不得整字段豁免。
4. patch原status默认保持。实际新增分支证明受补丁影响时，实施提交精确身份、旧状态/旧范围、新步骤/evidence ID、上游坐标、补丁坐标/hunk、行为改变、拟新状态/note，由主线程核准写入专项白名单，无需重新逐批问用户。未核准迁移必须被测试拒绝；既有affected不得随意降级。VTS既有not_applicable不能替代底层nginx消费链的补丁核查。
5. 来源从固定Git对象重建并比较 id/component/version/revision/file/start_line/end_line/code/url/kind及其他实际键；先读实际对象，不能先替换code、排序或Map去重。发布来源顺序沿B2规则：保留旧sources相对顺序，Nginx暂移末项distribution-version，VTS暂移末项module-build，按新增curated evidence顺序追加后，将对应末项完整对象原样放回；构建时这两类末项均在所有curated evidence之后追加。保留全部旧完整来源。

## 34补丁完整审核

对NGINX_PATCH_AUDIT.json的34项完整集合、顺序、revision、substitutions和固定OpenResty发行脚本映射逐条复核。为每项列“最终新增源码区间/步骤交集、判定依据、相关hunk或无交集理由”，不是只搜索补丁名字。一个矩阵可覆盖整个final25；内容修订引入新片段时增量重核全部34项交集。

重点线索包括日志的intercept_error_log/log_escape_non_ascii/larger_max_error_str/win32_max_err_str，响应的server_header/builtin_error_page_footer/no_error_pages，监听的socket_cloexec/reuseport_close_unused_fds，以及cycle/退出相关补丁；这些只是线索，不能替代其余项检查。原始源码行号与补丁文件行号分别记录，补丁hunk旧坐标不直接当当前nginx坐标。34项任一缺失即不通过。旧patched_sha256/历史回放只能引用为历史，不称本轮已回放。

## 测试、审核与完成判据

后续建议交付 `analysis/SAMPLE_FINAL25_RUNTIME_EVIDENCE.md`、`analysis/SAMPLE_FINAL25_RUNTIME_REVIEW.md`、`analysis/SAMPLE_FINAL25_RUNTIME_VERIFICATION.md` 与 `test/final25-runtime.test.mjs`。本规划不创建这些文件。

1. 实施者先做curated与固定源码验证：25身份完整覆盖、旧前缀常量、旧字段与非目标保护、实际代码/文档固定对象、34补丁矩阵、逐步语义审核。测试分清输入模式：构建前的curated候选不依赖尚未生成的dist；06a639只用于固定旧事实比较。实施者可复用现有纯函数在内存产生待验对象，不写dist、不build、不改src；主线程随后统一构建并验证实际发布对象。
2. 正例运行现有validateRuntime/deriveVerification/validateDetail/validatePublication中与输入对象层级适用的检查；缺完整发布对象时不虚报publication通过。逐项检查真实入口、条件、实际字段消费和每个已声明失败出口，不依赖固定步数或仅中文关键词。独立审核须重取Git片段，不只阅读实施叙述。
3. 必需反例：注册/配置片段冒runtime；缺独立文档；伪/漏/重复来源与顺序漂移；失败证据移到另一合法步骤但总集合不变；条件/平台guard缺失；patch覆盖遗漏或未批准状态迁移；旧事实/旧19deep/非目标修改。语义错位反例先断言validateRuntime仍通过，再确认语义校验拒绝，避免B2“空步骤先结构失败”的无效反例。
4. 定向语义反例至少覆盖：limit_conn空key与拒绝/dry-run混淆；proxy_limit_rate误称下行；HTTP/stream日志互换或转义补丁漏核；error_log对象选择与输出断链；VTS host分组误称访问控制；PID失败误称成功；HTTP server/location混淆stream选择；正文长度与chunked遗漏；keepalive误称请求总超时；sendfile必定零拷贝；default_type无条件覆盖；server_tokens忽略发行版补丁。
5. 历史测试保持各自固定发布和原deep集合。若历史测试把当前curated新增证据与历史发布混比，只允许精确身份使用冻结旧前缀/旧patch对象，并保留原比较强度；final25专项承担当前新增内容保护。不可全局忽略evidence、patch或切掉失败断言。旧19deep仍由06a639完整比较保护。
6. 主线程在候选内容冻结后统一构建，运行final25专项、受影响历史专项及全量测试，记录真实命令、数量、失败/跳过、构建前后输入摘要、最终release和时间。B2的39/39、194/194仅为历史，不能冒称本轮结果。新修改/新失败才重跑相关验证；不必每小批构建。构建前因curated/dist不同步产生的失败须记录原因，并在统一构建后完成复验；不能手改历史冻结发布或伪报全量通过。
7. 主线程统一构建及全部25项同一最终release的网页验收是本轮必须门槛。先检查每条详情release_id，再归一化比较；current与同release冻结索引完整一致；只放行实际评级、计数、正常detail_path/release路径，coverage/gaps/schema及其他元数据保护。旧19+批准集合精确相等。全部25项网页/Markdown的实际评级、scope、每步condition/action/全部引用须与该同一最终发布逐字段核验；保留basic的项核验其实际内容与评级，不伪造runtime。HTTP200/截图徽标不够，须记录实际页面核对结果。内容修订导致新release时，验收记录必须更新并绑定最终版本。
8. 原样例由主线程本轮仅在本地内存回放，不落盘、不复制到仓库、测试夹具或子Agent交付物。核对A24/24、B258/258、50身份、外部2/1、未核默认/继承0，并记录实际结果与同一最终release；B2历史结果只作比较，不能替代本轮回放。子Agent仍不读取私有配置，可用最小自造非私有夹具验证身份分派。现场版本、include内容、真实OpenResty运行与性能均不在本轮验收。
9. 最终25行交账必须含精确身份、基线状态、最终状态、步骤/源码/独立文档、补丁结论、测试结果、页面验收结果、审核结论与未决原因；实施证据、独立审核、主线程测试及原样例/页面验收均绑定同一最终release及对应内容摘要后签署。证据不足保持basic并列明缺口；“已处理25项”与“25项均完成deep”分别报告。内容、自动测试、构建发布、原样例回放和全部25项页面验收分别记录结果；缺任一必须门槛，不得宣布本轮完整完成。

## 给主线程的测试风险

最高风险是历史测试引用当前curated造成跨版本误比，以及统一构建前误用旧dist的19deep验证新候选，或构建后测试、样例与网页仍指向不同release。主线程必须以同一最终release完成全部测试和页面验收。其次是总引用集合合法却步骤失败出口缺证、日志/响应补丁改变了原始nginx语义、VTS扩展来源与nginx补丁边界混用。最终deep上限44不是任务硬指标。审核发现上述问题需退回对应实施项并复核，不扩大字段豁免。

本次只读核对计划、B2文档、测试结构、固定索引/摘要和四个Git commit存在性；没有逐条完成25项源码审核。只通过apply_patch新增本文；未读取私有配置、未联网、未运行build/test/browser、未修改知识或其他文件，未产生临时文件。
