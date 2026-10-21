import assert from 'node:assert/strict';

const task = await taskSpace(uiTest.spaceId ?? '核心知识与新增目录验收');
const page = task.page('p1');
console.log({spaceId:task.spaceId});
const injected = await page.cdp('Page.addScriptToEvaluateOnNewDocument',{source:`
  const originalFetch = window.fetch.bind(window);
  window.__contentRequests = [];
  window.fetch = (...args) => { window.__contentRequests.push({url:String(args[0]),method:args[1]?.method ?? 'GET',body:args[1]?.body}); return originalFetch(...args); };
`});
try {
  await page.goto(uiTest.url);
  await page.click(".local-query-options summary");
  await page.waitForFunction(()=>document.body.dataset.ready==='true');
  console.log(await page.snapshot());
  const counts=await page.evaluate(()=>({registration:document.querySelector('#registration-count').textContent,verified:document.querySelector('#verified-count').textContent}));
  assert.deepEqual(counts,{registration:'913',verified:'23'});
  await page.selectOption('#input-mode','config');
  await page.fill('#configuration','events { multi_accept on; worker_connections 65535; }');
  await page.click('#query-submit');
  await page.waitForFunction(()=>document.querySelectorAll('#input-tree .tree-main').length===3);
  await page.click('#input-tree .tree-row:has-text("multi_accept") .tree-expand');
  await page.waitForFunction(()=>document.querySelector('.detail-title')?.textContent==='multi_accept');
  const multi=await page.evaluate(()=>document.querySelector('#detail-panel').textContent);
  for(const text of ['基础内容已核对','off','ENOSYS','ECONNABORTED','已核对补丁影响']) assert.ok(multi.includes(text),text);
  await page.click('#input-tree .tree-row:has-text("worker_connections") .tree-expand');
  await page.waitForFunction(()=>document.querySelector('.detail-title')?.textContent==='worker_connections');
  const connections=await page.evaluate(()=>document.querySelector('#detail-panel').textContent);
  for(const text of ['基础内容已核对','512','上游','文件描述符']) assert.ok(connections.includes(text),text);
  await page.selectOption('#input-mode','single');
  await page.selectOption('#query-context','events');
  await page.fill('#configuration','accept_mutex_delay 500ms;');
  await page.click('#query-submit');
  await page.waitForFunction(()=>document.querySelector('.detail-title')?.textContent==='accept_mutex_delay');
  const delay=await page.evaluate(()=>document.querySelector('#detail-panel').textContent);
  for(const text of ['500ms','EMFILE/ENFILE','不是固定休眠']) assert.ok(delay.includes(text),text);
  await page.selectOption('#query-context','http.location');
  await page.selectOption('#query-module','ngx_http_memc_module');
  await page.fill('#configuration','memc_pass PRIVATE_ADDRESS;');
  await page.click('#query-submit');
  await page.waitForFunction(()=>document.querySelector('.detail-title')?.textContent==='memc_pass');
  assert.ok((await page.evaluate(()=>document.querySelector('#detail-panel').textContent)).includes('仅注册信息'));
  assert.ok((await page.evaluate(()=>document.querySelector('#detail-panel').textContent)).includes('b889a6fc3e18b784b454e1bc74e5d0b3513a07ce'));
  const requests=await page.evaluate(()=>window.__contentRequests);
  assert.ok(requests.every(request=>request.method==='GET'&&request.body===undefined));
  assert.ok(!JSON.stringify(requests).includes('PRIVATE_ADDRESS'));
  await page.goto(new URL('?release=1.27.1.1-a90b2ce291c5ed35&id=nginx--ngx_event_core_module--worker_connections',uiTest.url).href);
  await page.click(".local-query-options summary");
  await page.waitForFunction(()=>document.querySelector('.detail-title')?.textContent==='worker_connections');
  assert.ok((await page.evaluate(()=>document.querySelector('#detail-panel').textContent)).includes('仅注册信息'));
  console.log('通过：桌面实际页面显示913/23、原events片段的已核实说明、错误重试和资源限制、新模块仅注册状态、旧链接与静态GET隐私。');
} finally {
  await page.cdp('Page.removeScriptToEvaluateOnNewDocument',{identifier:injected.identifier});
}
await task.finish({keep:[]});
