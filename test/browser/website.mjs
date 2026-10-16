import assert from 'node:assert/strict';

const task = await taskSpace(uiTest.spaceId);
const page = task.page('p1');
const injected = await page.cdp('Page.addScriptToEvaluateOnNewDocument', { source: `
  const realFetch = window.fetch.bind(window);
  window.__websiteRequests = [];
  window.__websiteMode = new URLSearchParams(location.search).get('test_mode');
  window.fetch = async (...args) => {
    const url = String(args[0]);
    window.__websiteRequests.push({url, method: args[1]?.method ?? 'GET', body: args[1]?.body});
    if (window.__websiteFailDetail && url.endsWith('--content_by_lua_file.json')) throw new Error('受控详情失败');
    if (window.__websiteHold && url.endsWith(window.__websiteHold.suffix)) {
      const fail = window.__websiteHold.fail; window.__websiteHold = null; window.__websiteHeld = true;
      await new Promise(resolve => { window.__websiteRelease = resolve; });
      window.__websiteFinished = true;
      if (fail) throw new Error('受控关联读取失败');
    }
    const response = await realFetch(...args);
    if (!url.endsWith('/references.json')) return response;
    if (window.__websiteMode === 'bad_json') return new Response('{broken', {status:200});
    if (window.__websiteMode === 'missing') return new Response('', {status:404});
    const value = await response.json();
    if (window.__websiteMode === 'cross_release') value.release_id = 'other';
    if (window.__websiteMode === 'bad_nested') value.references[0].limitations = [null];
    return new Response(JSON.stringify(value), {status:response.status, headers:response.headers});
  };
` });
try {
  await page.goto(uiTest.url);
  await page.click(".local-query-options summary");
  await page.waitForFunction(() => document.querySelectorAll('.reference-entry').length === 8);
  await page.selectOption('#input-mode', 'single');
  await page.fill('#configuration', 'include /private/PRIVATE_EXTERNAL/*.conf;');
  await page.click('#query-submit');
  await page.waitForFunction(() => document.querySelector('#query-status').textContent.includes('外部内容未提供'));
  assert.ok((await page.evaluate(() => document.querySelector('#query-status').textContent)).includes('/private/PRIVATE_EXTERNAL/*.conf'));
  await page.selectOption('#query-context', 'http.location');
  await page.selectOption('#query-module', 'ngx_http_lua_module');
  await page.fill('#configuration', 'content_by_lua_file /private/PRIVATE_EXTERNAL.lua;');
  await page.click('#query-submit');
  await page.waitForFunction(() => document.querySelector('.detail-title')?.textContent === 'content_by_lua_file');
  assert.ok((await page.evaluate(() => document.querySelector('#query-status').textContent)).includes('外部内容未提供'));
  await page.evaluate(() => { window.__websiteFailDetail = true; });
  await page.click('#query-submit');
  await page.waitForFunction(() => document.querySelector('#query-status').textContent.includes('知识暂不可用'));
  assert.ok((await page.evaluate(() => document.querySelector('#query-status').textContent)).includes('PRIVATE_EXTERNAL.lua'));
  await page.evaluate(() => { window.__websiteFailDetail = false; });

  await page.fill('#configuration', 'content_by_lua_block { return }');
  await page.click('#query-submit');
  await page.waitForFunction(() => document.querySelector('.detail-title')?.textContent === 'content_by_lua_block');
  const before = await page.evaluate(() => ({input: document.querySelector('#configuration').value, status: document.querySelector('#query-status').textContent,
    parsed: document.querySelector('#parsed-results').textContent, ids: [...document.querySelectorAll('.catalog-entry')].map(node => node.dataset.id)}));
  const relatedIds = await page.evaluate(() => [...document.querySelectorAll('.related-entry')].map(node => node.dataset.id));
  assert.ok(relatedIds.includes('nginx--ngx_http_proxy_module--proxy_pass'));
  assert.ok(relatedIds.includes('nginx--ngx_stream_proxy_module--proxy_pass'));
  await page.click('.related-entry[data-id="nginx--ngx_stream_proxy_module--proxy_pass"]');
  await page.waitForFunction(() => document.querySelector('.detail-title')?.textContent === 'proxy_pass');
  assert.ok((await page.evaluate(() => document.querySelector('#detail-panel').textContent)).includes('关联知识预览，不代表当前输入匹配'));
  const after = await page.evaluate(() => ({input: document.querySelector('#configuration').value, status: document.querySelector('#query-status').textContent,
    parsed: document.querySelector('#parsed-results').textContent, ids: [...document.querySelectorAll('.catalog-entry')].map(node => node.dataset.id)}));
  assert.deepEqual(after, before);
  for (const fail of [false, true]) {
    await page.click('.catalog-entry[data-id="lua-nginx-module--ngx_http_lua_module--content_by_lua_block"]');
    await page.waitForFunction(() => document.querySelector('.detail-title')?.textContent === 'content_by_lua_block');
    await page.evaluate(fail => { window.__websiteHeld = false; window.__websiteFinished = false; window.__websiteHold = {suffix:'ngx_stream_proxy_module--proxy_pass.json', fail}; }, fail);
    await page.click('.related-entry[data-id="nginx--ngx_stream_proxy_module--proxy_pass"]');
    await page.waitForFunction(() => window.__websiteHeld);
    await page.click('.catalog-entry[data-id="lua-nginx-module--ngx_http_lua_module--content_by_lua_block"]');
    await page.waitForFunction(() => document.querySelector('.detail-title')?.textContent === 'content_by_lua_block');
    await page.evaluate(() => window.__websiteRelease());
    await page.waitForFunction(() => window.__websiteFinished);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await page.evaluate(() => document.querySelector('.detail-title').textContent), 'content_by_lua_block');
  }
  console.log('通过：单项外部引用在成功/详情失败中保留；关联保留多模块、不改变原查询，迟到成功/失败不覆盖后选项。');

  await page.selectOption('#reference-kind', 'lua_api');
  assert.equal(await page.evaluate(() => document.querySelectorAll('.reference-entry').length), 4);
  await page.fill('#reference-search', 'ngx.log');
  await page.click('.reference-entry[data-id="lua-nginx-module--ngx.log"]');
  const log = await page.evaluate(() => document.querySelector('#reference-detail').textContent);
  assert.ok(log.includes('未预先定义 NGX_MAX_ERROR_STR'));
  assert.ok(log.includes('日志前缀'));
  await page.fill('#reference-search', '');
  await page.selectOption('#reference-kind', 'variable');
  assert.equal(await page.evaluate(() => document.querySelectorAll('.reference-entry').length), 4);
  assert.equal(await page.evaluate(() => document.querySelector('.reference-title')?.textContent ?? null), null);
  await page.click('.reference-entry[data-id="nginx--stream-session_time"]');
  await page.click('.reference-entry[data-id="nginx--stream-status"]');
  assert.equal(await page.evaluate(() => document.querySelector('.reference-title').textContent), '$status');
  assert.equal(await page.evaluate(() => document.querySelector('.detail-title').textContent), 'content_by_lua_block');
  const requests = await page.evaluate(() => window.__websiteRequests);
  assert.ok(requests.every(request => request.method === 'GET' && request.body === undefined));
  assert.ok(!JSON.stringify(requests).includes('PRIVATE_EXTERNAL'));
  console.log('通过：API/变量筛选及固定来源展示，参考区与配置区互不覆盖，无原输入上传。');

  for (const mode of ['bad_json', 'missing', 'cross_release', 'bad_nested']) {
    await page.goto(new URL('?test_mode='+mode, uiTest.url).href);
    await page.click(".local-query-options summary");
    await page.waitForFunction(() => document.querySelector('#reference-status').textContent.includes('参考库读取失败'));
    await page.selectOption('#query-context', 'stream.server');
    await page.fill('#configuration', 'proxy_timeout 300s;');
    await page.click('#query-submit');
    await page.waitForFunction(() => document.querySelector('.detail-title')?.textContent === 'proxy_timeout');
    assert.equal(await page.evaluate(() => document.querySelectorAll('.reference-entry').length), 0);
  }
  await page.goto(new URL('?release=1.27.1.1-e27dbc95131afc51&id=nginx--ngx_stream_proxy_module--proxy_timeout', uiTest.url).href);
  await page.click(".local-query-options summary");
  await page.waitForFunction(() => document.querySelector('#reference-status').textContent.includes('此发布尚无参考库'));
  assert.equal(await page.evaluate(() => document.querySelector('.detail-title').textContent), 'proxy_timeout');
  assert.ok(!(await page.evaluate(() => window.__websiteRequests)).some(request => request.url.endsWith('/references.json')));
  console.log('通过：坏 JSON/404/跨发布/坏嵌套参考只影响参考区，旧发布永久链接可用且不读取新参考库。');
} finally {
  await page.cdp('Page.removeScriptToEvaluateOnNewDocument', {identifier: injected.identifier});
  await page.evaluate(() => window.__websiteRelease?.());
  await page.goto(uiTest.url);
  await page.click(".local-query-options summary");
}
