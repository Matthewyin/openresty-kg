import assert from 'node:assert/strict';

const task = await taskSpace(uiTest.spaceId);
const page = task.page('p1');
console.log({ spaceId: task.spaceId });
const injected = await page.cdp('Page.addScriptToEvaluateOnNewDocument', { source: `
  const originalFetch = window.fetch.bind(window);
  window.__ndkRequests = [];
  window.fetch = (...args) => { window.__ndkRequests.push({url:String(args[0]),method:args[1]?.method ?? 'GET',body:args[1]?.body}); return originalFetch(...args); };
` });
try {
  await page.goto(uiTest.url);
  await page.click(".local-query-options summary");
  await page.waitForFunction(() => document.body.dataset.ready === 'true');
  console.log(await page.snapshot({ scope: 'full_page' }));
  const counts = await page.evaluate(() => ({ registration: document.querySelector('#registration-count').textContent,
    verified: document.querySelector('#verified-count').textContent }));
  assert.deepEqual(counts, { registration: '949', verified: '23' });
  await page.selectOption('#input-mode', 'single');
  for (const [name, context, module, input] of [
    ['upstream_list', 'http', 'ndk_http_module', 'upstream_list PRIVATE_NDK_VALUE example.invalid;'],
    ['set_encode_base64', 'http.location', 'ngx_http_set_misc_module', 'set_encode_base64 $result PRIVATE_NDK_VALUE;'],
    ['array_split', 'http.location', 'ngx_http_array_var_module', 'array_split "," PRIVATE_NDK_VALUE;'],
    ['set_form_input', 'http.location', 'ngx_http_form_input_module', 'set_form_input $result PRIVATE_NDK_VALUE;'],
  ]) {
    await page.selectOption('#query-context', context);
    await page.selectOption('#query-module', module);
    await page.fill('#configuration', input);
    await page.click('#query-submit');
    await page.waitForFunction(name => document.querySelector('.detail-title')?.textContent === name, name);
    const detail = await page.evaluate(() => document.querySelector('#detail-panel').textContent);
    assert.ok(detail.includes('仅注册信息'));
    assert.ok(detail.includes(module));
    if (name === 'upstream_list') {
      for (const text of ['NDK_UPSTREAM_LIST', 'src/ndk_upstream_list.h', 'src/ndk.c', 'objs/ndk_config.c',
        '临时定义 NDK_UPSTREAM_LIST_CMDS=1', '不是需要用户额外设置']) assert.ok(detail.includes(text), text);
      console.log(await page.snapshot({ scope: 'full_page' }));
    }
  }
  const requests = await page.evaluate(() => window.__ndkRequests);
  assert.ok(requests.every(request => request.method === 'GET' && request.body === undefined));
  assert.ok(!JSON.stringify(requests).includes('PRIVATE_NDK_VALUE'));
  await page.goto(new URL(`?release=${encodeURIComponent(uiTest.previousRelease)}&id=nginx--ngx_event_core_module--multi_accept`, uiTest.url).href);
  await page.click(".local-query-options summary");
  await page.waitForFunction(() => document.querySelector('.detail-title')?.textContent === 'multi_accept');
  assert.ok((await page.evaluate(() => document.querySelector('#detail-panel').textContent)).includes('基础内容已核对'));
  console.log('通过：桌面949/23、四组件查询、NDK条件/owner/include/局部宏说明、仅注册状态、旧链接及静态GET隐私。');
} finally {
  await page.cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier: injected.identifier });
}
await task.finish({ keep: [] });
