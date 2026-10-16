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
await page.waitForFunction(() => document.querySelectorAll('.parsed-row').length === 8);
const state = await page.evaluate(() => ({
  catalog: [...document.querySelectorAll('.catalog-entry strong')].map(node => node.textContent),
  detail: document.querySelector('.detail-title')?.textContent ?? null,
  rows: [...document.querySelectorAll('.parsed-row')].map(node => node.textContent),
  verifiedOnly: document.querySelector('#verified-only').checked,
}));
assert.ok(state.catalog.length > 0, '本次输入的注册候选应可见');
assert.ok(state.catalog.every(name => names.includes(name)), '目录不能保留本次输入之外的 Lua 示例');
assert.deepEqual([...new Set(state.catalog)].sort(), [...names].sort(), '8 个配置名称都应有对应候选');
assert.equal(state.detail, null, '多条且歧义时不能显示默认或旧详情');
assert.equal(state.verifiedOnly, false, '默认核对状态筛选不能隐藏本次 Nginx 注册项');
assert.ok(state.rows.every(row => row.includes('当前 context：未知')), '不能猜测孤立 server 的 HTTP/stream 上下文');
assert.equal(await page.evaluate(() => document.querySelector('#catalog-count').textContent), String(state.catalog.length));
assert.ok((await page.evaluate(() => document.querySelector('#query-status').textContent)).includes('请提供外层'));
console.log('通过：配置目录与输入联动，未知上下文未猜测，旧详情已清除。');

await page.click('.catalog-entry[data-id="nginx--ngx_stream_proxy_module--proxy_pass"]');
await page.waitForFunction(() => document.querySelector('.detail-title')?.textContent === 'proxy_pass');
assert.ok((await page.evaluate(() => document.querySelector('.detail-kicker').textContent)).includes('ngx_stream_proxy_module'));
assert.ok(await page.evaluate(() => [...document.querySelectorAll('.parsed-row')].some(node => node.textContent.includes('proxy_pass') && node.textContent.includes('存在多个候选'))), '手动知识预览不能改写歧义匹配结果');

await page.fill('#configuration', 'unknown_directive;');
assert.equal(await page.evaluate(() => document.querySelector('.detail-title')?.textContent ?? null), null, '编辑输入应立即清除旧详情');
await page.click('#query-submit');
assert.equal(await page.evaluate(() => document.querySelectorAll('.catalog-entry').length), 0, '未知输入不能回落全站目录');
assert.equal(await page.evaluate(() => document.querySelector('.detail-title')?.textContent ?? null), null);

await page.fill('#configuration', 'events { worker_connections 1024;');
await page.click('#query-submit');
assert.ok((await page.evaluate(() => document.querySelector('#query-status').textContent)).includes('解析失败'));
assert.equal(await page.evaluate(() => document.querySelector('.detail-title')?.textContent ?? null), null, '解析错误不能残留旧详情');
assert.equal(await page.evaluate(() => document.querySelectorAll('.catalog-entry').length), 0, '错误输入不能发布可选候选');

await page.fill('#configuration', 'stream { ' + configuration + ' }');
await page.click('#query-submit');
await page.waitForFunction(() => document.querySelectorAll('.parsed-row').length === 9);
assert.ok(await page.evaluate(() => [...document.querySelectorAll('.parsed-row')].some(node => node.textContent.includes('proxy_pass') && node.textContent.includes('唯一匹配') && node.textContent.includes('stream.server'))), '提供真实外层块后应得到对应子系统匹配');

await page.click('#browse-all');
assert.ok((await page.evaluate(() => document.querySelector('#catalog-scope').textContent)).includes('全部目录浏览'));
assert.equal(await page.evaluate(() => document.querySelector('#catalog-search').disabled), false);
await page.fill('#catalog-search', 'lua_load_resty_core');
await page.click('#verified-only');
await page.fill('#configuration', configuration);
await page.click('#query-submit');
assert.ok(await page.evaluate(() => [...document.querySelectorAll('.catalog-entry strong')].every(node => ['server', 'listen', 'proxy_connect_timeout', 'proxy_timeout', 'set', 'proxy_pass', 'access_log', 'error_log'].includes(node.textContent))), '再次查询必须撤销全局浏览筛选');

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
console.log('通过：全目录浏览与筛选撤销、单项唯一候选预览及永久链接。');
console.log(await page.snapshot());
