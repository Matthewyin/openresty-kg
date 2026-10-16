import assert from 'node:assert/strict';

const task = await taskSpace(uiTest.spaceId);
const page = task.page('p1');
const injected = await page.cdp('Page.addScriptToEvaluateOnNewDocument', { source: `
  const originalFetch = window.fetch.bind(window);
  window.__extensionRequests = [];
  window.fetch = (...args) => {
    window.__extensionRequests.push({url: String(args[0]), method: args[1]?.method ?? 'GET', body: args[1]?.body});
    return originalFetch(...args);
  };
` });
try {
  await page.goto(uiTest.url);
  await page.waitForFunction(() => document.body.dataset.ready === 'true');
  const overview = await page.evaluate(() => ({
    count: document.querySelector('#registration-count').textContent,
    groups: document.querySelector('#coverage-groups').textContent,
    release: document.querySelector('#release-label').textContent,
  }));
  assert.equal(overview.count, '1041');
  assert.ok(overview.groups.includes('固定发行版：1017'));
  assert.ok(overview.groups.includes('部门扩展：24'));
  await page.selectOption('#catalog-source', 'department_extension');
  assert.equal(await page.evaluate(() => document.querySelectorAll('.catalog-entry').length), 24);
  await page.fill('#catalog-search', 'vhost_traffic_status_zone');
  assert.equal(await page.evaluate(() => document.querySelectorAll('.catalog-entry').length), 1);
  await page.click('.catalog-entry[data-id="nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_zone"]');
  await page.waitForFunction(() => document.querySelector('.detail-title')?.textContent === 'vhost_traffic_status_zone');
  const detail = await page.evaluate(() => document.querySelector('#detail-panel').textContent);
  for (const text of ['部门扩展', 'commit 快照', '现场版本与安装情况未知', '不属于发行补丁处理范围', '52fe11e44c47a49b052be89e36dfa17d81bf52a5']) assert.ok(detail.includes(text), text);
  await page.selectOption('#input-mode', 'config');
  await page.fill('#configuration', `http {
    vhost_traffic_status_zone;
    vhost_traffic_status_filter_by_host on;
    server { location /PRIVATE_EXTENSION_SAMPLE {
      vhost_traffic_status_display;
      vhost_traffic_status_display_format html;
    } }
  }`);
  await page.click('#query-submit');
  await page.waitForFunction(() => document.querySelectorAll('.parsed-row').length === 7);
  const sample = await page.evaluate(() => ({
    status: document.querySelector('#query-status').textContent,
    rows: [...document.querySelectorAll('.parsed-row')].filter(row => row.querySelector('.parsed-name').textContent.startsWith('vhost_traffic_status')).map(row => row.textContent),
    ids: [...document.querySelectorAll('.catalog-entry')].map(node => node.dataset.id),
  }));
  assert.ok(!sample.status.includes('解析失败'));
  assert.equal(sample.rows.length, 4);
  assert.ok(sample.rows.every(text => text.includes('唯一匹配') && text.includes('部门扩展')));
  assert.ok(!sample.ids.some(id => id.includes('lua_load_resty_core')));
  await page.click('.parsed-row .candidate-button[data-id="nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_display_format"]');
  await page.waitForFunction(() => document.querySelector('.detail-title')?.textContent === 'vhost_traffic_status_display_format');
  assert.ok((await page.evaluate(() => document.querySelector('#detail-panel').textContent)).includes('prometheus'));
  await page.fill('#configuration', 'http { future_extension_probe on; }');
  await page.click('#query-submit');
  await page.waitForFunction(() => document.querySelectorAll('.parsed-row').length === 2);
  assert.ok((await page.evaluate(() => document.querySelector('#parsed-results').textContent)).includes('当前索引未收录'));
  assert.ok(!(await page.evaluate(() => document.querySelector('#query-status').textContent)).includes('解析失败'));
  assert.equal(await page.evaluate(() => document.querySelector('.detail-title')?.textContent ?? null), null);
  await page.fill('#configuration', 'http { vhost_traffic_status_zone;');
  await page.click('#query-submit');
  await page.waitForFunction(() => document.querySelector('#query-status').textContent.includes('解析失败'));
  assert.equal(await page.evaluate(() => document.querySelectorAll('.catalog-entry').length), 0);
  assert.equal(await page.evaluate(() => document.querySelector('.detail-title')?.textContent ?? null), null);
  const requests = await page.evaluate(() => window.__extensionRequests);
  assert.ok(requests.every(request => request.method === 'GET' && request.body === undefined));
  assert.ok(!JSON.stringify(requests).includes('PRIVATE_EXTENSION_SAMPLE'));
  await page.goto(new URL('?release=1.27.1.1-eeabda4eba7f5c16&id=nginx--ngx_event_core_module--worker_connections', uiTest.url).href);
  await page.waitForFunction(() => document.querySelector('.detail-title')?.textContent === 'worker_connections');
  assert.equal(await page.evaluate(() => document.querySelector('#registration-count').textContent), '1017');
  assert.ok((await page.evaluate(() => document.querySelector('#coverage-groups').textContent)).includes('固定发行版：1017'));
  await page.goto(new URL('?id=nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_zone', uiTest.url).href);
  await page.waitForFunction(() => document.querySelector('.detail-title')?.textContent === 'vhost_traffic_status_zone');
  console.log(JSON.stringify({ ...overview, result: '通过', source_filter: 24, sample_matches: 4,
    unknown_and_parse_error_separate: true, old_link: true, static_get_privacy: true }));
  console.log(await page.snapshot());
} finally {
  await page.cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier: injected.identifier });
}
