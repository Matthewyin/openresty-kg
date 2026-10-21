import assert from 'node:assert/strict';

if (!uiTest.url || uiTest.spaceId === undefined) throw new Error('需要临时预览 URL 和现有 TaskSpace');
const task = await taskSpace(uiTest.spaceId);
const page = task.page('p1');
const injected = await page.cdp('Page.addScriptToEvaluateOnNewDocument', { source: `
  const originalFetch = window.fetch.bind(window);
  window.__accuracyMode = 'sentinel';
  window.__accuracyRequests = [];
  window.fetch = async (...args) => {
    window.__accuracyRequests.push({url: String(args[0]), method: args[1]?.method ?? 'GET', body: args[1]?.body});
    const response = await originalFetch(...args);
    if (!String(args[0]).endsWith('--lua_shared_dict.json') || !response.ok) return response;
    const detail = await response.json();
    if (window.__accuracyMode === 'broken') detail.availability = {};
    else if (window.__accuracyMode === 'sentinel') {
      detail.defaults = {status: 'not_applicable', text: 'DEFAULT_NOT_APPLICABLE', source_ids: []};
      detail.inheritance = {status: 'verified', text: 'INHERITANCE_VALUE', note: 'INHERITANCE_NOTE', source_ids: ['registration']};
      detail.availability.dependencies = ['DEPENDENCY_VALUE'];
      detail.documentation = [{title: 'DOCUMENTATION_TITLE', url: 'https://example.test/reference', status: 'unverified'}];
    }
    return new Response(JSON.stringify(detail), {status: response.status, headers: response.headers});
  };
` });
try {
  await page.goto(uiTest.url);
  await page.click(".local-query-options summary");
  await page.waitForFunction(() => document.body.dataset.ready === 'true', undefined, { timeout: 10000 });
  await page.selectOption('#input-mode', 'single');
  await page.selectOption('#query-context', 'http');
  await page.fill('#configuration', 'lua_shared_dict PRIVATE_ACCURACY_CACHE 10m;');
  await page.click('#query-submit');
  await page.waitForFunction(() => document.querySelector('.detail-title')?.textContent === 'lua_shared_dict');
  const state = await page.evaluate(async () => {
    const {createKnowledgeClient} = await import('./src/query/knowledge.mjs');
    const index = await (await fetch('./knowledge/index.json')).json();
    const client = createKnowledgeClient({knowledgeBase: new URL('./knowledge/', location.href), siteBase: new URL('./', location.href), timeoutMs: 10000});
    const result = await client.querySingle('lua_shared_dict PRIVATE_ACCURACY_CACHE 10m;', {context: 'http', release: index.release_id});
    return {website: document.querySelector('#detail-panel').textContent, markdown: result.markdown,
      links: [...document.querySelectorAll('#detail-panel a')].map(link => link.href), requests: window.__accuracyRequests};
  });
  for (const text of ['不适用', 'DEFAULT_NOT_APPLICABLE', 'INHERITANCE_VALUE', 'INHERITANCE_NOTE', 'DEPENDENCY_VALUE', 'DOCUMENTATION_TITLE', '未核实']) {
    assert.ok(state.website.includes(text), '网站缺事实：' + text);
    assert.ok(state.markdown.includes(text), 'Markdown 缺事实：' + text);
  }
  assert.ok(state.links.includes('https://example.test/reference'));
  assert.ok(state.markdown.includes('https://example.test/reference'));
  assert.ok(state.requests.every(request => request.method === 'GET' && request.body === undefined));
  assert.ok(!JSON.stringify(state.requests).includes('PRIVATE_ACCURACY_CACHE'));
  console.log('通过：真实浏览器与查询 Markdown 表达相同的事实、状态及文档链接，网络只含静态 GET。');

  await page.evaluate(() => { window.__accuracyMode = 'broken'; });
  await page.click('#query-submit');
  await page.waitForFunction(() => document.querySelector('#query-status').textContent.includes('知识暂不可用'));
  assert.equal(await page.evaluate(() => document.querySelector('.detail-title')?.textContent ?? null), null);
  assert.equal(await page.evaluate(() => document.querySelectorAll('#input-tree .tree-main').length), 1);
  console.log('通过：真实浏览器拒绝 availability={}，撤销旧详情并保留当前候选。');

  await page.evaluate(() => { window.__accuracyMode = 'normal'; });
  await page.selectOption('#query-context', 'stream.server');
  await page.fill('#configuration', 'proxy_timeout 300s;');
  await page.click('#query-submit');
  await page.waitForFunction(() => document.querySelector('.detail-title')?.textContent === 'proxy_timeout');
  const actual = await page.evaluate(() => document.querySelector('#detail-panel').textContent);
  for (const text of ['ngx_stream_proxy_module', '基础内容已核对', '两次连续读写', '10m', '继承', 'Lua', '已核对补丁影响', '未核实']) assert.ok(actual.includes(text), text);
  console.log('通过：真实 stream 超时知识可见，区分总时长、继承、Lua 覆盖和补丁影响。');
} finally {
  await page.cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier: injected.identifier });
  await page.reload();
}
