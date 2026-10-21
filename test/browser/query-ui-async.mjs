import assert from 'node:assert/strict';

if (!uiTest.url || uiTest.spaceId === undefined) throw new Error('需要传入临时预览 URL 及现有 TaskSpace');
const task = await taskSpace(uiTest.spaceId);
const page = task.page('p1');
const injected = await page.cdp('Page.addScriptToEvaluateOnNewDocument', { source: `
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const hold = window.__uiHold;
    if (!hold || !String(args[0]).endsWith(hold.suffix)) return originalFetch(...args);
    window.__uiHold = null;
    window.__uiHeld = true;
    await new Promise(resolve => { window.__uiRelease = resolve; });
    try {
      if (hold.fail) throw new Error('受控的知识读取失败');
      return await originalFetch(...args);
    } finally { window.__uiFinished = true; }
  };
` });
try {
  await page.goto(uiTest.url);
  await page.click(".local-query-options summary");
  await page.waitForFunction(() => document.body.dataset.ready === 'true', undefined, { timeout: 10000 });
  for (const fail of [false, true]) {
    await page.selectOption('#input-mode', 'single');
    await page.selectOption('#query-context', 'http');
    await page.fill('#configuration', 'lua_shared_dict private_cache 10m;');
    await page.evaluate(fail => { window.__uiHeld = false; window.__uiFinished = false; window.__uiHold = { suffix: '--lua_shared_dict.json', fail }; }, fail);
    await page.click('#query-submit');
    await page.waitForFunction(() => window.__uiHeld);
    await page.fill('#configuration', 'not_in_current_index;');
    assert.equal(await page.evaluate(() => document.querySelector('#query-submit').disabled), false, '编辑时不能被旧查询锁住提交按钮');
    await page.selectOption('#input-mode', 'config');
    await page.click('#query-submit');
    await page.waitForFunction(() => document.querySelector('#input-tree').textContent.includes('当前索引未收录'));
    await page.evaluate(() => window.__uiRelease());
    await page.waitForFunction(() => window.__uiFinished);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    // 未收录的指令没有候选：本次输入里不能出现可点的候选或详情按钮。
    assert.equal(await page.evaluate(() => document.querySelectorAll('#input-tree .tree-candidate, #input-tree .tree-expand').length), 0);
    assert.equal(await page.evaluate(() => document.querySelector('.detail-title')?.textContent ?? null), null);
    assert.ok((await page.evaluate(() => document.querySelector('#input-tree').textContent)).includes('not_in_current_index'));
    assert.ok(!(await page.evaluate(() => document.querySelector('#query-status').textContent)).includes('知识暂不可用'), '旧查询失败不能覆盖新查询状态');
  }

  await page.selectOption('#input-mode', 'single');
  await page.selectOption('#query-context', 'http');
  await page.fill('#configuration', 'lua_shared_dict private_cache 10m;');
  await page.evaluate(() => { window.__uiHeld = false; window.__uiFinished = false; window.__uiHold = { suffix: '--lua_shared_dict.json', fail: true }; });
  await page.click('#query-submit');
  await page.waitForFunction(() => window.__uiHeld);
  await page.evaluate(() => window.__uiRelease());
  await page.waitForFunction(() => document.querySelector('#query-status').textContent.includes('知识暂不可用'));
  assert.equal(await page.evaluate(() => document.querySelectorAll('#input-tree .tree-main').length), 1, '当前单项详情失败时仍应保留已经匹配的候选以便重选');
  assert.equal(await page.evaluate(() => document.querySelector('.detail-title')?.textContent ?? null), null);
  // 唯一候选的行提供“详情”按钮，一次点击即重新读取该条目。
  await page.click('#input-tree .tree-row:has-text("lua_shared_dict") .tree-expand');
  await page.waitForFunction(() => document.querySelector('.detail-title')?.textContent === 'lua_shared_dict');
  console.log('通过：当前单项详情失败保留候选，重选可恢复预览。');

  await page.fill('#configuration', 'lua_shared_dict private_cache 10m;');
  await page.evaluate(() => { window.__uiHeld = false; window.__uiHold = { suffix: 'index.json', fail: true }; });
  await page.click('#query-submit');
  await page.waitForFunction(() => window.__uiHeld);
  await page.evaluate(() => window.__uiRelease());
  await page.waitForFunction(() => document.querySelector('#query-status').textContent.includes('知识暂不可用'));
  assert.equal(await page.evaluate(() => document.querySelectorAll('#input-tree .tree-main').length), 0, '索引失败不能沿用之前匹配候选');
  assert.equal(await page.evaluate(() => document.querySelector('.detail-title')?.textContent ?? null), null);

  await page.selectOption('#input-mode', 'config');
  await page.fill('#configuration', 'events { multi_accept on; worker_connections 1024; }');
  await page.click('#query-submit');
  await page.evaluate(() => { window.__uiHeld = false; window.__uiFinished = false; window.__uiHold = { suffix: '--multi_accept.json', fail: false }; });
  await page.click('#input-tree .tree-row:has-text("multi_accept") .tree-expand');
  await page.waitForFunction(() => window.__uiHeld);
  await page.click('#input-tree .tree-row:has-text("worker_connections") .tree-expand');
  await page.waitForFunction(() => document.querySelector('.detail-title')?.textContent === 'worker_connections');
  await page.evaluate(() => window.__uiRelease());
  await page.waitForFunction(() => window.__uiFinished);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(await page.evaluate(() => document.querySelector('.detail-title').textContent), 'worker_connections', '先选项的迟到详情不能覆盖后选项');

  await page.evaluate(() => { window.__uiHeld = false; window.__uiHold = { suffix: '--multi_accept.json', fail: true }; });
  await page.click('#input-tree .tree-row:has-text("multi_accept") .tree-expand');
  await page.waitForFunction(() => window.__uiHeld);
  await page.evaluate(() => window.__uiRelease());
  await page.waitForFunction(() => Boolean(document.querySelector('#detail-panel .notice.error')));
  assert.ok((await page.evaluate(() => document.querySelector('#detail-panel').textContent)).includes('无法读取知识文件'), '候选读取失败应显示客户端返回的中文原因');
  assert.equal(await page.evaluate(() => document.querySelectorAll('#input-tree .tree-main').length), 3, '候选详情读取失败时应保留当前候选');
  assert.equal(await page.evaluate(() => document.querySelectorAll('.catalog-entry.active, #input-tree .tree-main.is-selected').length), 0, '失败的候选不保持选中状态');
  console.log('通过：索引失败无旧候选，当前候选详情失败保留列表并撤销选中态。');
  console.log('通过：迟到单项成功、失败及迟到候选详情均不能覆盖当前输入或选择。');
} finally {
  await page.cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier: injected.identifier });
  await page.evaluate(() => { window.__uiRelease?.(); });
  await page.reload();
}
