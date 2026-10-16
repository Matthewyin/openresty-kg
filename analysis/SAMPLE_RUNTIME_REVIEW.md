# HTTP proxy_pass首批runtime独立审核

日期：2026-10-13。状态：冻结内容、框架及实际发布独立审核通过，首批阶段二收口；P2已关闭，无未解决审核问题。签署发布`1.27.1.1-15e6ba8dfd628573`。写集合仅本文件，不构建、不操作UI、不全测、不修改产品。下文初审待验描述为过程记录，以末尾最终签署为准。

## 深度交互：边界与结论

本批审查共享校验、派生评级、旧发布兼容以及展示入口；源码语义仍须由proxy_pass专项证据和独立审核证明，不能把结构通过等同真实运行验证。按用户最新指令，corroboration_source_ids与runtime.source_ids分开，unverified.text也必须非空；规划正文若尚未同步，以该明确要求为准，不重复报成问题。

## 直接执行：发现与建议

### P2（已关闭）：注册/配置片段换ID可冒充运行时证据

位置：`src/query/knowledge.mjs`的validateRuntime/codeSource（初审约第34行）。当前仅排除ID registration、configuration-definition、distribution-version，并以c/h/patch后缀判断代码证据。真实注册表换一个ID后，固定revision/file/行号/code全部原样，仍可充当唯一runtime步骤证据并晋级deep；因此不是需要解析中文才能识别的语义问题。

只读内存探针已复现实际入口：读取阶段一固定release `1.27.1.1-647706874ae7c03c`的HTTP proxy_pass详情；将registration源对象复制为runtime-registration-copy，加入patch引用；唯一runtime步骤引用该对象，corroboration引用既有official-doc，保留已核实defaults/inheritance及其他基础事实。调用deriveVerification得到deep_verified，再用对应评级的entry调用validateDetail仍通过。未修改知识或发布文件，没有测试尚未完成的Sol内容。

建议最小修复：codeSource除ID之外核对真实证据身份，拒绝与注册/配置回调证据相同固定组件、revision、file及片段范围的别名冒充运行时路径，并覆盖被配置片段包含的裁剪别名；补deriveVerification及validateDetail/validatePublication实际入口负例。无需通用语义分析框架。任意真实代码是否足以证明动态目标/DNS/连接链，继续由本身份专项测试与源码审核判定。

修复复核：当前codeSource以component/revision/file和包含范围排除配置片段，不再只认ID。本角色基于已发布阶段一数据的只读内存探针确认registration/configuration-definition各完整及裁剪两类，共4个反例均被deriveVerification及validateDetail拒绝。新runtime测试同样将这4类反例送入deriveVerification和真实validatePublication入口；未在尚未有runtime的旧产物上重跑测试。原P2关闭，不宣称通用校验能证明任意代码片段的运行语义。

## 已核对的框架路径

| 项目 | 初审结论 |
| --- | --- |
| runtime结构 | status、非空text、steps、非空条件/动作、引用类型/唯一性/可解析校验存在；unverified不晋级，已填坏引用仍拒绝 |
| 运行时与文档引用 | verified运行时引用覆盖所有step且无未消费项；文档集合独立且与运行时ID不交叠；文档真实性/支撑关系待内容审核，文件后缀本身不能证明语义 |
| 晋级前置 | defaults/inheritance正文、状态及证据，summary/syntax/context、配置入口、运行时补丁覆盖均检查；上述注册别名缺口除外 |
| 构建失败关闭 | build复制curated runtime，调用deriveVerification而非采用手写评级；verified缺条件抛错，不静默降为basic；prepareKnowledgeFacts降级基础事实会导致runtime前置拒绝 |
| 补丁范围 | validateDetail及prepareKnowledgeFacts阻止bundled借not_applicable绕过；affected要求实际patch kind片段；新增路径的实际hunk影响仍待Sol证据审核 |
| 总量/来源组 | deep按最终详情派生，basic仍包含deep；validateIndex核总量，validSourceCoverage核分组，validateDetail核详情/索引评级一致 |
| 发布写入顺序 | validatePublication在immutable详情和index写入前调用；其逐项调用validateDetail，可拒绝缺runtime的手写deep或verified runtime却未deep |
| 旧发布 | 无runtime返回false，不生成占位runtime、不将mechanism升级。已对阶段一proxy_pass详情分别设schema1/2执行validateDetail，均通过；完整旧查询回归由主线程测试覆盖 |
| 网站安全与一致性 | runtime文本、条件、动作和链接标签使用textContent；引用URL来自已validateSources的HTTPS GitHub固定链接，noopener noreferrer保留；getDetail先validateDetail再renderDetail |
| Markdown | 与页面共用状态映射、范围提示、步骤顺序和同一source引用；缺runtime/unverified有明确未核实显示，配置mechanism保留。当前静态检查未发现新增DOM HTML注入路径；实际展示尚未验收 |

## 新增测试设计审核

已读取`test/runtime.test.mjs`。真实发布validatePublication入口、builder共用deriveVerification、旧schema和真实查询Markdown入口均实际调用；sources直接比较实际发布数组与旧证据加固定Git生成片段，未先覆盖实际新增code；重复ID先检查。1041身份保护只放行唯一HTTP proxy_pass，保留defaults/inheritance等旧事实，其他身份逐字比较。当前6项红来自旧产物缺runtime，不记为通过或实现失败。

待内容冻结补齐的专项边界：现有“所有动态目标必发DNS”只修改actual.action后与curated比较，证明两份数据一致性，不能证明curated本身的分支正确。应对首批确定的动态求值、已有组/IP绕过、缺resolver、DNS失败/超时及连接错误出口建立独立预期和固定源码片段对应断言；不能仅与当前curated互相比对。文档第二信号还须核定明确的nginx-docs组件/revision/片段与其佐证内容，不能把允许的文件后缀作为充分证明。源码语义不由通用中文关键词猜测。

用户已明确批准该HTTP身份patch_status从verified_unaffected改verified_affected及精确note。该调整属于本批授权，不要求再次批准；旧refs/facts和其余身份保护不变。测试允许与curated一致的patch调整，最终审核需核对其确切授权差异及补丁来源。

## Sol证据首轮阅读

已读`SAMPLE_RUNTIME_EVIDENCE.md`，内容尚未冻结。已核对nginx HEAD为固定e06bdbd4且工作树干净，并阅读proxy handler/eval、upstream目标分类/解析回调、resolver缓存/等待/超时和next_upstream错误映射；从固定OpenResty对象读取balancer_status_code及socket_cloexec对应hunk。

当前研究结论未发现上述关键分支错误：已有upstream组匹配在sockaddr路径之前，IP/组不必DNS，有效答案缓存和等待链不必发新查询；缺resolver/DNS非零state含解析超时为502，内部分配/求值失败为500，连接错误/超时进入next_upstream，停止时通常502/504，缓存陈旧响应及客户端错误等另有边界；不能统一所有错误为502。balancer补丁额外finalize特殊响应、cloexec新增失败路径和请求级timeout字段确实要求精确affected说明。其余源片段、固定文档、最终runtime步骤/引用集合及完整补丁局部覆盖尚待冻结后完成审核，本段不是内容通过签署。

## 待交付与签署

初审时待Sol冻结与主线程发布；上述条件已由以下最终审核覆盖。本角色未自行重复实现或构建。

## 冻结16步骤逐项审核

已完整读取冻结runtime及每项所引片段，来源为固定nginx `e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928`、nginx-docs `e8b581903e9d41252720053311cea687a5671674`、OpenResty `8c37412c31621225e7aa7e825b5b50106c9c71c4`。前轮已读片段沿用核查，本轮补全其余片段与7项文档全文。

| 步骤 | 审核结论及关键证据 |
| --- | --- |
| 1 动态URL求值 | 通过；proxy handler调用eval，脚本/协议/URL解析失败返回500，缺省80/443及SSL条件吻合 |
| 2 请求体与初始化 | 通过；body回调进入upstream_init/init_request；preflight失败500；timeout补丁复制至请求级字段 |
| 3 响应缓存前置出口 | 通过；569–608在地址分类之前完成缓存响应/等待/错误出口，未混为DNS缓存 |
| 4 已配置upstream | 通过；host长度、端口/no_port、大小写比较后goto found，先于sockaddr分支；peer.init失败500 |
| 5 IP/Unix直连 | 通过；inet先建立数字地址，Unix及IPv6有平台条件；请求级peer不启动DNS，内部分配失败500 |
| 6 需要resolver | 通过；NGX_NO_RESOLVER为502，NULL/缺端口500，ctx绑定回调和timeout；不自动兜底系统DNS |
| 7 DNS答案缓存 | 通过；valid未过期且有地址直接回调，valid/TTL决定期限，未宣称必发查询 |
| 8 同名等待 | 通过；waiting链加入与timeout检查、NGX_AGAIN由dispatch转NGX_OK，设置失败走500 |
| 9 新DNS查询 | 通过；DECLINED以NXDOMAIN回调，内部失败返回ERROR；发送失败有立即重试及后续等待，未错误声称立即500 |
| 10 DNS失败/超时 | 通过；TIMEDOUT置state后回调，resolve_handler非零state为502，finalize清理ctx |
| 11 DNS成功 | 通过；保存地址、构造round-robin peer并写端口，结束ctx再connect，未把地址返回视为连接成功 |
| 12 peer选择与返回值 | 通过；get先于socket；ERROR500、BUSY/DECLINED进入next；balancer补丁特殊HTTP状态直接finalize |
| 13 keepalive复用 | 通过；匹配缓存连接恢复pc，返回DONE，event_connect提前返回而不创建新socket |
| 14 新建连接 | 通过；非阻塞connect的OK/AGAIN/DECLINED与内部ERROR出口吻合，cloexec新增标志及失败出口已说明 |
| 15 等待/异步连接错误 | 通过；补丁后的u->connect_timeout、写超时FT_TIMEOUT、发送前test_connect及kqueue/SO_ERROR检测吻合；TLS边界未扩展 |
| 16 next_upstream边界 | 通过；TIMEOUT候选504，ERROR/NOLIVE默认502；条件允许再connect，停止时可用stale响应，否则finalize，未承诺错误必立即返回 |

7项独立文档分别支撑变量目标先查组后resolver、DNS TTL/valid、解析timeout、连接timeout、next_upstream错误类型、keepalive连接缓存及显式响应缓存。没有把文档当作全部内部错误码或OpenResty专有分支的证明。runtime的35项代码引用精确等于步骤引用并集，7项文档独立，local配置补丁只作背景，不冒充运行消费代码。

## 补丁与最终产物复核

独立枚举34个固定有效补丁对runtime所引文件的目标和hunk，核对balancer_status_code、upstream_timeout_fields、socket_cloexec的实际增改与步骤对应；resolver_conf_parsing/local与safe_resolver_ipv6_option修改配置解析，不改变所引缓存/等待/回调路径。upstream_pipelining改变preserve_output前置条件，不改变本批连接超时分支；proxy_host_port_vars位于变量注册。补丁历史坐标不冒充上游坐标，原片段与补丁分别绑定固定对象。允许且正确地仅将目标HTTP身份改为verified_affected及精确note，保留旧引用。

只读实际产物探针已通过：直接读取当前release `1.27.1.1-15e6ba8dfd628573`，validateIndex及1041份validateDetail通过；只有`nginx--ngx_http_proxy_module--proxy_pass`为deep。16steps/35code/7docs与冻结curated逐字一致，40项新增sources的全部字段（含code、component、version、revision、file、范围、URL、kind）分别与固定Git对象及来源配置逐字相等。实际sources没有先被正确值覆盖；全部旧sources逐字保留，patch引用精确为旧数组加40项新增ID，状态/note与获准curated一致。

相对阶段一647706874ae7c03c，全1041身份集合一致；目标仅有runtime、deep评级、40新增sources及获准patch变化，其余字段含defaults/inheritance/verification_notes全部逐字保留；其他1040身份详情只剥离release_id后完全一致。统计basic仍1041且包含deep1；bundled为1017 basic/1 deep，department_extension为24 basic/0 deep。

已核读新增专项断言：固定消费文件/行覆盖eval、组/IP分流、无resolver、DNS缓存/等待/超时502、peer/connect、next超时504及三个运行时补丁；文档核固定nginx-docs revision与组查询/TTL原文。此前仅actual==curated的一致性盲点已补，具体中文语义由上表逐项审核支撑，不把关键词测试当完整语义证明。

## 最终签署

独立核读`sample-runtime-focused-tests.log`：22/22通过；`sample-runtime-tests.log`：146/146通过，fail/cancelled/skipped/todo均0，包含既有实际发行补丁回放。未重复执行测试。主线程在`SAMPLE_RUNTIME_VERIFICATION.md`记录实际浏览器A24/B258、external2/1，展开deep/runtime并逐条核对16步文本；本角色核读该验收记录，不冒称自行操作浏览器。

审核角色：Codex。签署日期：2026-10-13。冻结内容、共享校验、派生评级、legacy兼容、展示实现、实际发布字段与固定证据及主线程测试/浏览器验收记录审核通过，P2关闭，无剩余审核阻塞。首批仅HTTP proxy_pass指定范围达到deep，不代表完整TLS/重试/缓存机制、其他身份或现场运行兼容性已验证。后续范围另行授权；本轮仅修改本审核文档，未生成临时文件。
