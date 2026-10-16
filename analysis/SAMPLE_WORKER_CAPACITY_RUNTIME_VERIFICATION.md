# B2 worker、连接容量及事件接入验收

日期：2026-10-14。状态：B2完成。最终构建、39项定向、194项全量及桌面验收通过，独立审核已签署06a639；记录见同前缀REVIEW。

## 深度交互：范围与前置验收

仅补SAMPLE_WORKER_CAPACITY_RUNTIME_PLAN规定的五身份。进程数量、CPU绑定、文件描述符限额、连接对象池和accept循环各有不同生命周期，不换算成固定请求容量。固定基线ca870，1041 basic/14 deep。

主线程本轮先完成ca870桌面复测：原样例A24/24、外部2；B258/258、外部1；上一批五项33步骤及全部引用与最终发布逐字段一致。证据补在SAMPLE_PROXY_CHAIN_RUNTIME_VERIFICATION，截图sample-proxy-chain-runtime-final-browser.png。之后完整阅读B2计划，放行实施。未运行OpenResty或现场网络。

## 直接执行：本轮检查记录

- 主独立冻结五项原evidence数量及SHA256到test/worker-capacity-runtime.test.mjs；与规划表一致。
- 初始7项新保护及真实查询检查在ca870上全部预期失败：五项无runtime、deep集合仍14而非19；这是未实施基线，不冒称产品回归。
- 历史proxy-chain专项固定ca870索引，保留原14集合及旧内容保护；本批新增专项承担current与ca870的全字段比较。
- 已实际读取固定源码的master派生/reload、worker初始化、CPU掩码与系统调用、setrlimit、连接池与回收/归还、上游和客户端取槽、accept循环分支；补5项运行代码锚点检查。对应步骤语义错位负例待最终步骤冻结后添加。
- 主已读固定OpenResty的privileged_agent_process、single_process_graceful_exit、socket_cloexec与reuseport_close_unused_fds相关hunks。任何状态迁移仍须按精确身份/实际新步骤核定，不能只凭同文件命中。

后续门槛：冻结稿、步骤语义/证据负例、必要状态迁移确认、统一构建、定向/全量测试、两样例回放与同版本桌面验收、独立最终审核。达到后才改完成状态和剩余计数。

主已独立核固定reuseport_close_unused_fds.patch:17–38及ngx_event.c:807–811：非本worker的reuseport监听在continue前close，失败记录EMERG、随后fd=-1。批准仅worker_connections由verified_unaffected迁移verified_affected；数组容量旧事实不变，迁移因新监听运行步骤包含该直接修改。其他四项状态保持。对应专项白名单及content旧评级断言按精确三项晋级更新，不放宽所有条目。

## 初稿构建及打回修正

- knowledge初稿SHA256为875fbf13ac9c34c6c12a4ee05685fb4400b0dee9f7422af63d15f30baf475ece，主构建前后相同。初稿发布3a75efdaffe0642c，1041/19，五项26步（processes5、affinity4、nofile4、connections6、accept7）。
- 13项B2专项加content/sample-facts共23项，首次22通过、1失败。失败为审核R5指出的测试夹具：移走nofile全部锚点后source_ids空，结构校验先拒绝，未到达预期语义拒绝。已保留总集合中不覆盖锚点的合法代码引用，确保结构仍合法，不改产品规则或知识来迎合反例。
- 审核R1/R2补强：详情归一化前先检查当前release_id，current索引与同release冻结索引完整相等，并分别增加残留旧版本/冻结索引漂移负例。
- 内容审核R3/R4打回实施：connections监听关闭需同时满足NGX_HAVE_REUSEPORT、监听自身启用reuseport、worker不符；accept posted路径需绑定ngx_event.c248–255的实际消费调用。已为两点加入对应步骤锚点/正文反例，在初稿上单项测试明确失败于R3条件缺失。旧事实、完整来源及非目标保护在初稿均通过，不替代修订后测试。

## 最终候选06a639：构建、样例和桌面

R3/R4最小修订后，knowledge SHA256为a2666ba27952f66a749ae9ab1557d4d13e34e529976b9137ed7cf05570676b82；构建前后相同，匹配实施冻结记录。最终发布为 `1.27.1.1-06a6394fb516a4bb`，1041 basic/19 deep，bundled1017/19、扩展24/0。五项26步、44条新evidence；原47条curated证据及62条基线sources保留，当前五项共106条sources。

- 最终23项定向全部通过，日志sample-worker-capacity-runtime-focused.log。随后首轮全量194项中191通过、3失败：sample-remaining14历史索引固定6477，却使用当前affinity/nofile新增证据和补丁说明作为旧发布期望。修复仅这两身份：用已冻结旧证据前缀9/5和ca870旧patch对象保留历史比较；本批专项仍以固定前缀hash、current完整来源/状态/旧事实进行独立保护，未放宽其余12身份。修后合并39项定向全过，无跳过，日志sample-worker-capacity-runtime-final-focused.log。全量最终结果另补。
- 本地CLI只读原样例：A第3—73行24项/0解析错误/24唯一匹配，B全文258项/0错误/258匹配；合计50个唯一身份，其中19deep，默认/继承未核实仍0。原文未落盘到仓库。
- 最终页面reload后页脚确认为06a639、固定发行版深度19。A24/24外部2，逐项打开processes5、affinity4、connections6、multi_accept7；B258/258外部1，打开nofile4。五项26步condition/action、顺序、scope、全部源码/文档URL以及deep徽标与最终dist逐字段一致。
- 初次复用旧checkPage验收函数时，闭包仍读旧ca870目标详情，报runtime undefined；显式传最终entry/detail后全部核对通过。只修验收脚本，没有修改产品。异步详情等待末步骤可见。截图sample-worker-capacity-runtime-browser.png已保存并目视检查，页面保留供用户查看。
- 本轮仅固定源码知识与页面显示验证，不声称OpenResty真实启动、系统额度、CPU绑定、网络性能或外部include已验证。

## 最终自动测试及范围交账

最终 `npm test`：194/194通过，0失败/取消/跳过/todo，耗时34149.866875毫秒，日志sample-worker-capacity-runtime-final-tests.log；知识SHA仍a2666ba27952f66a749ae9ab1557d4d13e34e529976b9137ed7cf05570676b82。合并定向39/39通过、1289.820334毫秒。没有在测试后改知识或重建其他发布。

B2五身份在06a639全部满足限定运行时消费、独立文档、逐步证据、完整来源与旧字段保护。样例50身份为19项限定深度、6项配置边界收口仍basic、25个运行时候选待补。下一批B3是limit_conn_zone、limit_conn、proxy_limit_rate，本轮未实施。此前失败日志保留为修订过程记录；没有未用临时脚本或配置副本需要清理。
