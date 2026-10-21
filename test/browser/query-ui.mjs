import assert from 'node:assert/strict';

const url = uiTest.url;
if (!url) throw new Error('需要 UI_TEST_URL 指向临时 HTTP 预览');
const task = await taskSpace(uiTest.spaceId ?? '配置查询联动回归');
const page = task.page('p1');
console.log({ spaceId: task.spaceId });
await page.goto(url);
await page.click(".local-query-options summary");
await page.waitForFunction(() => document.body.dataset.ready === 'true', undefined, { timeout: 10000 });

const configuration = `server {
    listen 12013;
    proxy_connect_timeout 300s;
    proxy_timeout 300s;
    set $target cdn.example.com:443;
    proxy_pass $target;
    access_log /tmp/proxy.log proxy;
    error_log /tmp/proxy_error.log;
}`;
const names = ['server', 'listen', 'proxy_connect_timeout', 'proxy_timeout', 'set', 'proxy_pass', 'access_log', 'error_log'];
await page.selectOption('#input-mode', 'config');
await page.fill('#configuration', configuration);
await page.click('#query-submit');
// 本次输入的识别行全部在左栏“本次输入”标签（#input-tree）里，块与指令各占一行。
await page.waitForFunction(() => document.querySelectorAll('#input-tree .tree-main').length === 8);
const state = await page.evaluate(() => ({
  names: [...document.querySelectorAll('#input-tree .tree-name')].map(node => node.textContent),
  detail: document.querySelector('.detail-title')?.textContent ?? null,
  rows: [...document.querySelectorAll('#input-tree .tree-main')].map(node => node.textContent),
  verifiedOnly: document.querySelector('#verified-only').checked,
  catalogCount: document.querySelector('#catalog-count').textContent,
  // 全部目录的计数应等于各模块分组计数之和，与本次输入无关。
  catalogTotal: [...document.querySelectorAll('.catalog-group-count')].reduce((sum, node) => sum + Number(node.textContent.replace(/\D/g, '')), 0),
}));
assert.deepEqual([...state.names].sort(), [...names].sort(), '8 个配置名称都应在本次输入中出现');
assert.equal(state.detail, null, '多条且歧义时不能显示默认或旧详情');
assert.equal(state.verifiedOnly, false, '默认核对状态筛选不能隐藏本次 Nginx 注册项');
// 孤立 server 下的 proxy_pass 同时对应 http 与 stream，不能猜测上下文，只能显示为存在多个候选。
assert.ok(state.rows.some(row => row.includes('proxy_pass') && row.includes('存在多个候选')), '孤立 server 不能猜测 HTTP/stream 上下文');
assert.equal(state.catalogCount, String(state.catalogTotal), '全部目录计数与分组计数一致');
assert.ok((await page.evaluate(() => document.querySelector('#query-status').textContent)).includes('请提供外层'));
console.log('通过：本次输入树与输入联动，未知上下文未猜测，旧详情已清除，全部目录计数自洽。');

// 目录分组收起时不构建条目按钮：先展开 ngx_stream_proxy_module 组，再点击 stream 的 proxy_pass。
await page.click('.catalog-group[data-module="ngx_stream_proxy_module"] > summary');
await page.waitForFunction(() => document.querySelector('.catalog-entry[data-id="nginx--ngx_stream_proxy_module--proxy_pass"]') !== null);
await page.click('.catalog-entry[data-id="nginx--ngx_stream_proxy_module--proxy_pass"]');
await page.waitForFunction(() => document.querySelector('.detail-title')?.textContent === 'proxy_pass');
assert.ok((await page.evaluate(() => document.querySelector('.detail-kicker').textContent)).includes('ngx_stream_proxy_module'));
assert.ok(await page.evaluate(() => [...document.querySelectorAll('#input-tree .tree-main')].some(node => node.textContent.includes('proxy_pass') && node.textContent.includes('存在多个候选'))), '手动知识预览不能改写歧义匹配结果');

await page.fill('#configuration', 'unknown_directive;');
assert.equal(await page.evaluate(() => document.querySelector('.detail-title')?.textContent ?? null), null, '编辑输入应立即清除旧详情');
await page.click('#query-submit');
// 未知输入只让本次输入显示“未收录”；全部目录不随之收缩，计数保持全量。
assert.ok((await page.evaluate(() => document.querySelector('#input-tree').textContent)).includes('当前索引未收录'));
assert.equal(await page.evaluate(() => document.querySelector('#catalog-count').textContent), state.catalogCount, '未知输入不能改变全部目录');
assert.equal(await page.evaluate(() => document.querySelector('.detail-title')?.textContent ?? null), null);

await page.fill('#configuration', 'events { worker_connections 1024;');
await page.click('#query-submit');
assert.ok((await page.evaluate(() => document.querySelector('#query-status').textContent)).includes('解析失败'));
assert.equal(await page.evaluate(() => document.querySelector('.detail-title')?.textContent ?? null), null, '解析错误不能残留旧详情');
assert.equal(await page.evaluate(() => document.querySelector('#catalog-count').textContent), state.catalogCount, '解析错误不能改变全部目录');

await page.fill('#configuration', 'stream { ' + configuration + ' }');
await page.click('#query-submit');
await page.waitForFunction(() => document.querySelectorAll('#input-tree .tree-main').length === 9);
// 外层 stream 块提供了上下文：proxy_pass 应唯一匹配到 stream 的 proxy_pass，详情按钮可直接打开。
await page.click('#input-tree .tree-row:has-text("proxy_pass") .tree-expand');
await page.waitForFunction(() => document.querySelector('.detail-title')?.textContent === 'proxy_pass');
assert.ok((await page.evaluate(() => document.querySelector('.detail-kicker').textContent)).includes('ngx_stream_proxy_module'), '提供真实外层块后应得到 stream 子系统的匹配');

// 旧的“全部浏览”按钮与范围提示已删除：全部目录是左栏的一个标签，切过去后搜索框与筛选始终可用。
await page.click('#library-tab-catalog');
assert.equal(await page.evaluate(() => document.querySelector('#library-tab-catalog').getAttribute('aria-selected')), 'true');
assert.equal(await page.evaluate(() => document.querySelector('#catalog-search').disabled), false);
await page.fill('#catalog-search', 'lua_load_resty_core');
// 搜索是防抖的（120ms）：等待结果落地，即只剩命中的少数模块组（全量时有几十个组）。
await page.waitForFunction(() => document.querySelectorAll('.catalog-group').length <= 2);
await page.click('#verified-only');
await page.fill('#configuration', configuration);
await page.click('#query-submit');
// 全部目录的搜索与筛选独立于本次查询：再次查询不清除它们。
assert.equal(await page.evaluate(() => document.querySelector('#catalog-search').value), 'lua_load_resty_core', '再次查询不能清除全部目录的搜索');
assert.equal(await page.evaluate(() => document.querySelector('#verified-only').checked), true, '再次查询不能清除全部目录的筛选');

await page.selectOption('#input-mode', 'single');
await page.selectOption('#query-context', '');
await page.fill('#configuration', 'more_set_headers');
await page.click('#query-submit');
await page.waitForFunction(() => document.querySelector('.detail-title')?.textContent === 'more_set_headers');
assert.ok((await page.evaluate(() => document.querySelector('#query-status').textContent)).includes('上下文尚未确定'));
const permalink = await page.evaluate(() => [...document.querySelectorAll('#detail-panel a')].find(node => node.textContent.includes('永久详情'))?.href);
assert.ok(permalink.includes('release='));
await page.goto(permalink);
await page.click(".local-query-options summary");
await page.waitForFunction(() => document.body.dataset.ready === 'true', undefined, { timeout: 10000 });
assert.equal(await page.evaluate(() => document.querySelector('.detail-title')?.textContent), 'more_set_headers', '明确永久链接仍可预览');
console.log('通过：手动选择、编辑清理、未知、解析错误及显式 stream 外层。');
console.log('通过：全部目录标签的搜索与筛选独立于查询，单项唯一候选预览及永久链接。');
console.log(await page.snapshot());
