# 样例stream运行时验收

日期：2026-10-13。状态：最终修复、构建、测试、桌面验收及独立审核全部完成。以下保留各阶段实际记录。

## 深度交互：本批范围

依据 `SAMPLE_STREAM_RUNTIME_PLAN.md`，基线为 `1.27.1.1-15e6ba8dfd628573`，1041 basic、1 HTTP deep。仅补 stream proxy_pass、proxy_connect_timeout、proxy_timeout、resolver 的运行时；不修改既有runtime契约、页面或构建逻辑。

原样例主线程只读聚合：A第3—73行主配置24项，未含本批4身份；B全配置258项，resolver出现1次，其他三项各4次。未出现resolver_timeout，不单独升级该身份，只在解析链说明其消费。原配置正文没有复制到仓库。

## 直接执行：检查记录

- 主线程确认nginx HEAD为e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928且工作树干净；docs为e8b581903e9d41252720053311cea687a5671674，OpenResty为8c37412c31621225e7aa7e825b5b50106c9c71c4。发布证据仍必须从固定对象逐字比较，不只依赖HEAD。
- 历史HTTP运行时测试固定到15e6发布，保留原先仅1 deep的断言；本批另设4身份白名单和精确5 deep集合，保护其他1037身份及全部索引元数据。
- 新测试初稿对旧发布执行6项失败，预期原因是旧产物缺少本批runtime/deep；记录 `sample-stream-runtime-before.log`。后续追加4项固定源码分支断言，待冻结新内容后执行10项，不将旧产物失败冒称新实现失败或成功。
- 覆盖实际sources/元数据、文档及patch引用逐字比较，坏来源、旧证据删改、缺前置、伪deep、unverified、配置/注册完整和裁剪别名等负例。四项patch状态独立与既定verified_affected基线比较，防止actual与curated同步误改绕过。
- 专项预期分别核对动态目标分流、stream解析失败出口、连接等待及重试门槛、转发timer刷新/delayed与TCP/UDP分支；真实语义仍须独立源码审核，关键词不等于完整事实证明。

## 待验收

本节为首次实施时的待办：四项知识冻结、源码/文档/补丁审核、统一build、专项及全量测试、原样例回放和四项桌面网页对照。后续执行结果见下文；未运行真实OpenResty或现场网络请求。

## 首次构建与字段保护发现

- 四项首轮冻结37步、102新增证据，`npm run build`生成 `1.27.1.1-7bde513999a7df29`，计数1041 basic/5 deep正确。
- 首轮定向25项中24通过，固定源码分支、真实证据、查询与等级检查通过；唯一失败是全字段保护。代理三个条目的旧limitations是字符串，构建按全部evidence自动生成source_ids，新增runtime导致旧限制说明的证据列表意外扩大；resolver本来使用显式对象，未受此影响。原正文及其他受保护字段没有发现变化。
- 已打回Sol：仅把三个代理条目的limitations表示改为旧15e6发布中的明确对象，正文、状态和source_ids逐字固定为旧值；不改变事实、不改产品逻辑、不放宽测试。此表示层必要修复已明确交审核复核，修复后须重新构建验证。
- 历史HTTP与四项基础事实的15项定向回归已在本轮调整历史基线后通过；不能作为尚待验证的新stream全批通过。

## 表示层修复后的中间验收

- 表示层修复构建为 `1.27.1.1-b0309835ff2efa62`。25项定向全过（`sample-stream-runtime-final-focused.log`），全量156/156通过（`sample-stream-runtime-tests.log`），无跳过。
- 桌面56832预览中，原A仍24/24及外部2，B258/258及外部1；从B目录打开四stream详情，12/8/8/9共37步的条件、动作及范围均与实际dist逐字段相同，全部步骤及独立文档链接按顺序相同，深度徽标正确。首次JSON字符串比较因浏览器工具返回对象键序不同产生false，改按字段比较后全部一致，未改页面规避问题。
- 这些测试和展示通过不代替内容审查。最终独立审核又发现P2-A：connect_timeout第7步缺少直接结束DNS失败的stream回调证据；P2-B：proxy_pass第10步把失败peer释放错误放到重试门槛之后。已打回Sol最小修复，新增每步绑定回调及释放前于tries的独立回归；不得将b030称为审核完成。

## 最终修复及主线程验收

- P2-A追加并绑定固定proxy resolve_handler 1328–1355至connect_timeout第7步、runtime并集和patch覆盖；P2-B更正为buffered检查后先释放选中的失败peer，再根据更新后tries/开关/累计窗口判断终止或重试。旧facts、limitations及所有旧证据保持。
- 新增两处回归在b030上2/2失败（`sample-stream-runtime-audit-before.log`）；修复后随全部专项通过，没有删除或放宽断言。
- 最终 `npm run build`发布 `1.27.1.1-f8c21e3662af9366`，1041 basic/5 deep，bundled 1017 basic/5 deep，扩展24 basic/0 deep。新增深度严格为本批四身份，原HTTP深度保持；本批37步、103项新增证据。
- `node --test test/stream-runtime.test.mjs test/runtime.test.mjs test/sample-facts.test.mjs`：25/25通过，日志 `sample-stream-runtime-reviewed-focused.log`。
- `npm test`：156/156通过，0失败/跳过，日志 `sample-stream-runtime-reviewed-tests.log`，包含真实发布与既有隔离补丁回放。此前146或中间156结果不替代本次最终结果。
- 最终dist重读原样例并断言：A24/24、B258/258全部matched、无解析错误；50去重身份，defaults/inheritance的unverified仍为0。
- 56832桌面预览刷新后确认release=f8c21；B再次258/258、外部1。从B目录逐项打开resolver8步、proxy_timeout9步、proxy_connect_timeout8步、proxy_pass12步；条件、动作、顺序及全部步骤/文档链接与最终dist逐项相同。A外部2在本轮中间网页已复测，最终CLI24项保持；没有展开或臆造任何外部文件。
- 截图 `sample-stream-runtime-browser.png`为最终stream proxy_pass运行时区块。复用用户桌面标签页，无手机验收，无外网部署；产品src/site/build代码未修改。

## 独立签署与收口

`SAMPLE_STREAM_RUNTIME_REVIEW.md`已对f8c21最终签署通过：测试P2及内容P2-A/B全部关闭，37步、103项新增证据、全字段边界和主线程测试/网页记录均核对通过，无剩余审核阻塞。

本批四身份完成。resolver_timeout仅作为依赖解释，仍未单独升级；完整TLS、DNS协议、重试策略及现场网络运行不属于本批完成范围。Codex真实接入仍后移。
