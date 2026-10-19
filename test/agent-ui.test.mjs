import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as core from '../src/core/core.mjs';
import * as knowledge from '../src/query/knowledge.mjs';
import * as source from '../src/core/source.mjs';
import * as results from '../src/query/config-results.mjs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const html = read('site/index.html');
const agent = read('site/agent.mjs');
const sessionId = '11111111-1111-4111-8111-111111111111';
const requestId = '22222222-2222-4222-8222-222222222222';
const release = 'test-release';
const entryId = 'nginx--ngx_event_core_module--worker_connections';
const storageKey = 'openresty-agent-session';
const reply = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const tick = () => new Promise(resolve => setImmediate(resolve));
async function until(check) { for (let i = 0; i < 100; i++) { if (check()) return; await new Promise(resolve => setTimeout(resolve, 2)); } throw new Error('页面测试等待超时'); }
class Node {
  constructor(tag = 'div') {
    this.tagName = tag; this.children = []; this.dataset = {}; this.events = {};
    this.value = ''; this.disabled = false; this.hidden = false; this.checked = false;
    this.classList = { toggle() {}, add() {} }; this.attributes = {};
  }
  set textContent(value) { this.text = String(value); this.children = []; }
  get textContent() { return (this.text ?? '') + this.children.map(child => child.textContent).join(''); }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.text = ''; this.children = nodes; }
  setAttribute(name, value) { this.attributes[name] = value; }
  addEventListener(name, handler) { (this.events[name] ??= []).push(handler); }
  dispatchEvent(event) { return Promise.all((this.events[event.type] ?? []).map(handler => handler(event))); }
  focus() {}
}
const descendants = node => [node, ...node.children.flatMap(descendants)];

test('现有链接安全函数解析根相对详情地址，跟随页面地址且拒绝非 HTTP(S)', () => {
  const linkFunction = agent.slice(agent.indexOf('function link('), agent.indexOf('function evidence('));
  for (const origin of ['http://192.0.2.10:30000', 'http://198.51.100.20:30000']) {
    const parent = new Node();
    const context = vm.createContext({ URL, location: { href: `${origin}/pi/index.html` }, node: (tag, text, target) => { const child = new Node(tag); child.textContent = text; target.append(child); return child; }, parent });
    vm.runInContext(`${linkFunction}\nlink(parent, '/pi/index.html?release=test-release&id=test-entry', '详情');\nlink(parent, 'javascript:alert(1)', '拒绝');\nlink(parent, 'data:text/html,test', '拒绝');`, context);
    assert.equal(parent.children.length, 1);
    const link = parent.children[0];
    assert.equal(link.href, `${origin}/pi/index.html?release=test-release&id=test-entry`);
    assert.equal(link.rel, 'noopener noreferrer');
  }
});

function report(patch = {}) {
  return { requestId, sessionId, state: 'completed', phase: 'selection', cacheHit: false,
    knowledgeVersion: { release }, summary: { directives: 1, matched: 1, attention: 0, block_entries: 0, external_references: 0 }, questions: [],
    modelSelection: { facts: [{ entryId, field: 'defaults' }], resolvedFacts: [{ entryId, field: 'defaults', value: { text: '默认 512', status: 'verified', source_ids: ['merge'] }, text: '默认 512', status: 'verified', source_ids: ['merge'] }],
      citations: [{ entryId, field: 'defaults', sourceId: 'merge', quote: 'source code', revision: 'a'.repeat(40), file: 'src/test.c', start_line: 1, end_line: 1, url: `https://github.com/example/test/blob/${'a'.repeat(40)}/src/test.c#L1-L1` }] },
    metrics: { modelRoundTrips: 1, totalMs: 20, finalOutputBytes: 100 }, ...patch };
}
async function start({ api, stored = '', storedEntries = [], originalApp = false, initialRelease = release, basePath = '/' } = {}) {
  const requests = []; const observers = [];
  const nodes = new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(match => [match[1], new Node()]));
  nodes.get('agent-panel').dataset.probeTimeoutMs = '1000';
  nodes.get('input-mode').value = 'single'; nodes.get('result-filter').value = 'all';
  nodes.get('configuration').value = 'worker_connections'; nodes.get('query-context').value = 'events';
  const body = new Node('body');
  body.dataset = new Proxy({ ...(initialRelease ? { release: initialRelease } : {}) }, { set(target, key, value) { target[key] = value; queueMicrotask(() => observers.forEach(callback => callback())); return true; } });
  const document = { body, getElementById: id => nodes.get(id), createElement: tag => new Node(tag) };
  const saved = new Map([...(stored ? [[storageKey, stored]] : []), ...storedEntries]);
  const fetcher = async (url, options = {}) => {
    const parsed = new URL(url, 'http://site.test/'); const path = parsed.pathname;
    const request = { path, search: parsed.search, method: options.method ?? 'GET', body: options.body ? JSON.parse(options.body) : undefined, signal: options.signal };
    requests.push(request);
    if (path.startsWith(`${basePath}api/`)) {
      const localPath = '/' + path.slice(basePath.length);
      const custom = api?.({ ...request, path: localPath });
      if (custom !== undefined) return custom;
      if (localPath === '/api/status') return reply({ mode: 'mock', unifiedInput: true, model: 'test', siteBase: `http://site.test${basePath}`, pollIntervalMs: 2, requestTimeoutMs: 1000 });
      if (localPath === '/api/run') return reply(report());
      if (localPath === '/api/cancel') return reply({ state: 'cancelled' });
      if (localPath.startsWith('/api/jobs/')) return reply(report());
      return reply({ request: { input: 'multi_accept off;', mode: 'single', context: 'events', module: 'ngx_event_core_module', question: '继承？', release }, messages: 4 });
    }
    return reply(JSON.parse(read(`dist/${path.slice(basePath.length)}`)));
  };
  const sandbox = { document, fetch: fetcher, localStorage: { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value), removeItem: key => saved.delete(key) },
    MutationObserver: class { constructor(callback) { this.callback = callback; } observe() { observers.push(this.callback); } },
    location: { href: `http://site.test${basePath}index.html`, search: '' }, URL, URLSearchParams, AbortController, AbortSignal, Event, CustomEvent, setTimeout, clearTimeout, queueMicrotask };
  Object.assign(sandbox, core, knowledge, source, results, { createKnowledgeClient: options => knowledge.createKnowledgeClient({ ...options, fetcher }) });
  const context = vm.createContext(sandbox);
  vm.runInContext(agent.replace(/^import .*;\n/gm, '').replaceAll('import.meta.url', JSON.stringify(`http://site.test${basePath}agent.mjs`)), context);
  if (originalApp) await vm.runInContext(read('site/app.mjs').replace(/^import .*;\n/gm, '').replaceAll('import.meta.url', JSON.stringify(`http://site.test${basePath}app.mjs`)), context);
  await tick();
  const click = id => nodes.get(id).dispatchEvent({ type: 'click', preventDefault() {} });
  const change = async (id, value) => { nodes.get(id).value = value; await nodes.get(id).dispatchEvent({ type: ['input-mode', 'query-context', 'query-module'].includes(id) ? 'change' : 'input', preventDefault() {} }); };
  return { nodes, document, requests, saved, click, change, submit: () => nodes.get('agent-form').dispatchEvent({ type: 'submit', preventDefault() {} }) };
}

test('静态无 API 时 Agent 灰显，实际原查询/目录/参考仍运行，原查询不触发 POST', async () => {
  const ui = await start({ originalApp: true, api: request => request.path.startsWith('/api/') ? reply({ error: '无 API' }, 404) : undefined });
  assert.equal(ui.nodes.get('agent-submit').disabled, true);
  assert.match(ui.nodes.get('agent-status').textContent, /原查询|识别查询/);
  assert.equal(ui.document.body.dataset.ready, 'true');
  assert.equal(ui.document.body.dataset.release, JSON.parse(read('dist/knowledge/index.json')).release_id);
  assert.ok(ui.nodes.get('catalog-list').children.length > 0); assert.ok(ui.nodes.get('reference-list').children.length > 0);
  await ui.change('configuration', 'worker_connections 1024;');
  assert.match(ui.nodes.get('agent-status').textContent, /Agent.*不可用.*原查询.*可用/);
  assert.equal(ui.nodes.get('agent-submit').disabled, true);
  await ui.nodes.get('query-form').dispatchEvent({ type: 'submit', preventDefault() {} });
  assert.match(ui.nodes.get('query-status').textContent, /唯一匹配/);
  assert.equal(ui.requests.filter(request => request.method === 'POST').length, 0);
});

test('服务忙碌保留输入且不自动重提或取消其他请求，结束后手动重试', async () => {
  let busy = true;
  const ui = await start({ api: request => request.path === '/api/run' && busy ? reply({ error: '忙碌', code: 'busy' }, 409) : undefined });
  const input = ui.nodes.get('configuration').value;
  await ui.submit();
  assert.match(ui.nodes.get('agent-status').textContent, /忙碌.*手动重试/);
  assert.equal(ui.nodes.get('configuration').value, input);
  assert.equal(ui.requests.filter(request => request.path === '/api/run').length, 1);
  assert.equal(ui.requests.filter(request => request.path === '/api/cancel').length, 0);
  assert.equal(ui.nodes.get('agent-submit').disabled, false);
  busy = false; await ui.submit();
  assert.equal(ui.requests.filter(request => request.path === '/api/run').length, 2);
  assert.equal(ui.saved.get(storageKey), sessionId);
});

test('轮询结果已过期时释放页面操作，不陷入取消未确认', async () => {
  const ui = await start({ api: request => {
    if (request.path === '/api/run') return reply(report({ state: 'running', phase: 'basic', modelSelection: null }));
    if (request.path.startsWith('/api/jobs/')) return reply({ error: '请求已过期或不存在', code: 'job_unavailable' }, 404);
  } });
  await ui.submit();
  assert.match(ui.nodes.get('agent-status').textContent, /过期/);
  assert.equal(ui.nodes.get('agent-submit').disabled, false);
  assert.equal(ui.requests.filter(request => request.path === '/api/cancel').length, 0);
});

test('只有明确提交才发送统一 message；本地解析选项不混入 Agent 请求，追问携带会话', async () => {
  const ui = await start();
  assert.equal(ui.requests.length, 1); assert.equal(ui.requests[0].path, '/api/status'); assert.equal(ui.requests[0].body, undefined);
  await ui.change('query-module', 'ngx_event_core_module');
  assert.equal(ui.requests.length, 1);
  await ui.submit();
  const sent = ui.requests.find(request => request.path === '/api/run');
  assert.deepEqual(sent.body.request, { message: 'worker_connections', release });
  assert.equal(ui.saved.get(storageKey), sessionId);
  assert.equal(JSON.parse(ui.saved.get(`${storageKey}:list`)).length, 1);
  await ui.change('configuration', '继续问继承'); await ui.submit();
  assert.equal(ui.requests.filter(request => request.path === '/api/run').at(-1).body.sessionId, sessionId);
  for (const mode of ['config', 'main']) {
    await ui.change('input-mode', mode); await ui.submit();
    const request = ui.requests.filter(request => request.path === '/api/run').at(-1).body.request;
    assert.deepEqual(request, { message: '继续问继承', release });
  }
});

test('brief 轮询先显示 summary，最终只渲染选中字段与固定来源，不重复整份目录', async () => {
  const held = deferred(); let polls = 0;
  const ui = await start({ api: request => {
    if (request.path === '/api/run') return reply(report({ state: 'running', modelSelection: null }));
    if (request.path.startsWith('/api/jobs/')) { polls++; return held.promise; }
  } });
  const done = ui.submit();
  await until(() => polls === 1);
  assert.match(ui.nodes.get('agent-result').textContent, /唯一匹配 1/);
  assert.match(ui.nodes.get('agent-status').textContent, /等待模型/);
  held.resolve(reply(report({ items: [{ name: '不应重复的完整目录' }], cacheHit: true })));
  await done;
  assert.ok(ui.requests.filter(request => request.path.startsWith('/api/jobs/')).every(request => request.search === '?brief=1'));
  assert.match(ui.nodes.get('agent-result').textContent, /默认 512/); assert.doesNotMatch(ui.nodes.get('agent-result').textContent, /不应重复的完整目录/);
  assert.match(ui.nodes.get('agent-status').textContent, /历史精确缓存.*本次未推理/);
  const links = descendants(ui.nodes.get('agent-result')).filter(node => node.tagName === 'a').map(node => new URL(node.href));
  assert.ok(links.some(url => url.searchParams.get('id') === entryId && url.searchParams.get('release') === release));
  assert.ok(links.some(url => url.hostname === 'github.com'));
});

test('提交尚未返回 requestId 就改输入，迟到任务仍被取消，不保存旧会话或回显', async () => {
  const held = deferred();
  const ui = await start({ api: request => request.path === '/api/run' ? held.promise : undefined });
  const done = ui.submit();
  await until(() => ui.requests.some(request => request.path === '/api/run'));
  await ui.change('configuration', '另一份配置');
  held.resolve(reply(report({ state: 'running' }))); await done;
  assert.ok(ui.requests.some(request => request.path === '/api/cancel' && request.body.requestId === requestId));
  assert.equal(ui.nodes.get('agent-result').textContent, ''); assert.equal(ui.saved.size, 0);
  assert.equal(ui.nodes.get('agent-submit').disabled, false);
});

test('取消、新会话与 release 变化均防止迟到轮询覆盖当前输入', async () => {
  for (const action of ['cancel', 'new', 'release']) {
    const held = deferred(); let polling = false;
    const ui = await start({ api: request => {
      if (request.path === '/api/run') return reply(report({ state: 'running' }));
      if (request.path.startsWith('/api/jobs/')) { polling = true; return held.promise; }
    } });
    const done = ui.submit(); await until(() => polling);
    if (action === 'release') { ui.document.body.dataset.release = 'next-release'; await tick(); }
    else await ui.click(action === 'cancel' ? 'agent-cancel' : 'agent-new');
    held.resolve(reply(report())); await done;
    assert.equal(ui.nodes.get('agent-result').textContent, '', action);
    assert.ok(ui.requests.some(request => request.path === '/api/cancel'), action);
    if (action === 'new') { assert.equal(ui.saved.has(storageKey), false); assert.equal(ui.nodes.get('configuration').value, 'worker_connections'); }
  }
});

test('恢复须显式点击，旧双字段会话合并到单框；发布不符或恢复期间编辑不得覆盖输入', async () => {
  const ui = await start({ stored: sessionId });
  assert.ok(!ui.requests.some(request => request.path.startsWith('/api/sessions/')));
  await ui.click('agent-restore');
  assert.equal(ui.nodes.get('configuration').value, 'multi_accept off;\n\n继承？');
  assert.match(ui.nodes.get('agent-status').textContent, /已恢复 4/);
  const mismatch = await start({ stored: sessionId, api: request => request.path.startsWith('/api/sessions/') ? reply({ request: { release: 'other-release' } }) : undefined });
  await mismatch.click('agent-restore'); assert.equal(mismatch.nodes.get('configuration').value, 'worker_connections');
  assert.match(mismatch.nodes.get('agent-status').textContent, /另一知识发布/);
  const held = deferred();
  const stale = await start({ stored: sessionId, api: request => request.path.startsWith('/api/sessions/') ? held.promise : undefined });
  const restoring = stale.click('agent-restore'); await stale.change('configuration', '新输入');
  held.resolve(reply({ request: { input: '旧输入', release }, messages: 5 })); await restoring;
  assert.equal(stale.nodes.get('configuration').value, '新输入');
});

test('限制与 runtime 保留逐项状态/步骤来源，空限制不暗示无限制，内容只作为文本', async () => {
  const malicious = '<img src=x onerror=alert(1)>';
  const facts = [
    { entryId, field: 'limitations', value: [{ text: malicious, status: 'unverified', source_ids: [] }, { text: '已有核实限制', status: 'verified', source_ids: ['limit'] }], status: 'unverified', source_ids: ['limit'] },
    { entryId, field: 'limitations', value: [], status: 'unverified', source_ids: [] },
    { entryId, field: 'defaults', value: { text: null, status: 'unverified', source_ids: [] }, source_ids: [] },
    { entryId, field: 'runtime', value: { text: '已核实范围内的运行时', status: 'verified', source_ids: ['runtime'], corroboration_source_ids: ['doc'], steps: [{ condition: '条件一', action: '步骤一', source_ids: ['runtime'] }] }, status: 'verified', source_ids: ['runtime', 'doc'] },
  ];
  const citations = [ ['limitations', 'limit'], ['runtime', 'runtime'], ['runtime', 'doc'] ].map(([field, sourceId]) => ({ ...report().modelSelection.citations[0], field, sourceId, quote: `固定证据 ${sourceId}`, url: sourceId === 'limit' ? 'javascript:alert(1)' : report().modelSelection.citations[0].url }));
  const ui = await start({ api: request => request.path === '/api/run' ? reply(report({ modelSelection: { resolvedFacts: facts, citations } })) : undefined });
  await ui.submit();
  const content = ui.nodes.get('agent-result').textContent;
  for (const text of [malicious, '未核实', '已有核实限制', '已核实', '尚未记录限制，不代表没有限制', '该字段尚未记录正文', '步骤一', '条件一', '交叉印证', '固定证据 runtime', '固定证据 doc']) assert.ok(content.includes(text), text);
  assert.ok(!descendants(ui.nodes.get('agent-result')).some(node => ['img', 'script'].includes(node.tagName)));
  assert.ok(descendants(ui.nodes.get('agent-result')).filter(node => node.tagName === 'a').every(node => /^https?:/.test(node.href)));
  assert.ok(!agent.includes('innerHTML'));
});

test('拒绝无 release 提交；结果 release 不一致、unsupported 和服务失败均不伪装成功', async () => {
  const unready = await start({ initialRelease: '' }); await unready.submit();
  assert.equal(unready.nodes.get('agent-submit').disabled, true); assert.ok(!unready.requests.some(request => request.method === 'POST'));
  const mismatch = await start({ api: request => request.path === '/api/run' ? reply(report({ knowledgeVersion: { release: 'wrong-release' } })) : undefined });
  await mismatch.submit(); assert.match(mismatch.nodes.get('agent-status').textContent, /发布.*不一致/); assert.equal(mismatch.nodes.get('agent-result').textContent, '');
  const unsupported = await start({ api: request => request.path === '/api/run' ? reply(report({ state: 'awaiting_input', modelSelection: { status: 'unsupported', resolvedFacts: [] } })) : undefined });
  await unsupported.submit(); assert.match(unsupported.nodes.get('agent-status').textContent, /等待补充/); assert.match(unsupported.nodes.get('agent-result').textContent, /未生成自由解释/);
  const failed = await start({ api: request => request.path === '/api/run' ? reply({ error: '服务故障' }, 503) : undefined });
  await failed.submit(); assert.match(failed.nodes.get('agent-status').textContent, /服务故障.*原查询不受影响/); assert.equal(failed.nodes.get('agent-submit').disabled, false);
});

test('页面只有一个配置消息框，空输入不提交，旧服务能力不足给出更新提示', async () => {
  assert.equal([...html.matchAll(/<textarea\b/g)].length, 1);
  assert.doesNotMatch(html, /id="agent-question"/);
  const ui = await start();
  await ui.change('configuration', '  '); await ui.submit();
  assert.equal(ui.requests.filter(request => request.method === 'POST').length, 0);
  assert.match(ui.nodes.get('agent-status').textContent, /请输入配置、问题或追问/);
  const old = await start({ api: request => request.path === '/api/status' ? reply({ mode: 'live', model: 'old', pollIntervalMs: 2, requestTimeoutMs: 1000 }) : undefined });
  assert.equal(old.nodes.get('agent-submit').disabled, true);
  assert.match(old.nodes.get('agent-status').textContent, /重启.*npm run agent/);
  assert.equal(old.nodes.get('configuration').disabled, false);
  old.document.body.dataset.release = 'next-release'; await tick();
  assert.match(old.nodes.get('agent-status').textContent, /重启.*npm run agent/);
});

test('Agent 规范化配置复用原目录和解析，消息原文不变；追问显示沿用对象', async () => {
  const published = JSON.parse(read('dist/knowledge/index.json')).release_id;
  const normalizedRequest = { input: 'events { worker_connections 1024; }', mode: 'fragment', question: '默认值？', release: published };
  const ui = await start({ originalApp: true, api: request => request.path === '/api/run' ? reply(report({ knowledgeVersion: { release: published }, normalizedRequest, inputResolution: { action: 'followup' } })) : undefined });
  await ui.change('configuration', '那默认值呢？'); await ui.submit();
  await until(() => ui.nodes.get('query-status').textContent.includes('已提取 2 项'));
  assert.equal(ui.nodes.get('configuration').value, '那默认值呢？');
  assert.match(ui.nodes.get('agent-result').textContent, /本次沿用的配置/);
  assert.match(ui.nodes.get('catalog-list').textContent, /worker_connections/);
  assert.doesNotMatch(ui.nodes.get('catalog-list').textContent, /lua_load_resty_core/);
  await ui.click('agent-new');
  assert.doesNotMatch(ui.nodes.get('catalog-list').textContent, /worker_connections/);
});

test('澄清不伪装成已解析，统一会话恢复保留原消息', async () => {
  const ui = await start({ stored: sessionId, api: request => {
    if (request.path === '/api/run') return reply(report({ state: 'awaiting_input', summary: undefined, inputResolution: { action: 'clarify', message: '请提供配置或指令名称。' }, modelSelection: null }));
    if (request.path.startsWith('/api/sessions/')) return reply({ request: { message: '请解释这份配置\nevents { multi_accept on; }', release }, currentConfig: { input: 'events { multi_accept on; }', mode: 'fragment', release }, messages: 2 });
  } });
  await ui.submit();
  assert.match(ui.nodes.get('agent-result').textContent, /请提供配置或指令名称/);
  assert.doesNotMatch(ui.nodes.get('agent-result').textContent, /本次没有可展示/);
  await ui.click('agent-restore');
  assert.equal(ui.nodes.get('configuration').value, '请解释这份配置\nevents { multi_accept on; }');
  assert.match(ui.nodes.get('agent-result').textContent, /恢复的会话配置.*events \{ multi_accept on;/);
});

test('取消运行中的 Agent 同步清除它派生的解析目录，不留无对象的基础结果', async () => {
  const held = deferred(); let polling = false;
  const published = JSON.parse(read('dist/knowledge/index.json')).release_id;
  const ui = await start({ originalApp: true, api: request => {
    if (request.path === '/api/run') return reply(report({ state: 'running', knowledgeVersion: { release: published }, normalizedRequest: { input: 'events { worker_connections 1024; }', mode: 'fragment', release: published }, inputResolution: { action: 'config' } }));
    if (request.path.startsWith('/api/jobs/')) { polling = true; return held.promise; }
  } });
  const done = ui.submit();
  await until(() => polling && ui.nodes.get('catalog-list').textContent.includes('worker_connections'));
  await ui.click('agent-cancel');
  held.resolve(reply(report())); await done;
  assert.doesNotMatch(ui.nodes.get('catalog-list').textContent, /worker_connections/);
  assert.equal(ui.nodes.get('parsed-results').children.length, 0);
  assert.equal(ui.nodes.get('agent-result').textContent, '');
});

test('切换本地查询会取消旧 Agent，后续取消及迟到结果不清除本地查询', async () => {
  const held = deferred(); let polling = false;
  const published = JSON.parse(read('dist/knowledge/index.json')).release_id;
  const ui = await start({ originalApp: true, api: request => {
    if (request.path === '/api/run') return reply(report({ state: 'running', knowledgeVersion: { release: published }, normalizedRequest: { input: 'events { worker_connections 1024; }', mode: 'fragment', release: published }, inputResolution: { action: 'config' } }));
    if (request.path.startsWith('/api/jobs/')) { polling = true; return held.promise; }
  } });
  const done = ui.submit(); await until(() => polling);
  await ui.nodes.get('query-form').dispatchEvent({ type: 'submit', preventDefault() {} });
  assert.match(ui.nodes.get('query-status').textContent, /唯一匹配/);
  await ui.click('agent-cancel'); held.resolve(reply(report())); await done;
  assert.match(ui.nodes.get('query-status').textContent, /唯一匹配/);
  assert.match(ui.nodes.get('catalog-list').textContent, /worker_connections/);
  assert.equal(ui.requests.filter(request => request.path === '/api/run').length, 1);
});

test('配置后查询单个名称，恢复显示实际追问对象而非另存的完整配置', async () => {
  const published = JSON.parse(read('dist/knowledge/index.json')).release_id;
  const currentSubject = { input: 'worker_connections', mode: 'single', question: '默认值呢', release: published };
  const ui = await start({ stored: sessionId, originalApp: true, api: request => {
    if (request.path.startsWith('/api/sessions/')) return reply({ request: { message: 'worker_connections 的默认值', release: published }, currentConfig: { input: 'events { multi_accept on; worker_connections 1024; }', mode: 'fragment', release: published }, currentSubject, messages: 4 });
    if (request.path === '/api/run') return reply(report({ knowledgeVersion: { release: published }, normalizedRequest: currentSubject, inputResolution: { action: 'followup' } }));
  } });
  await ui.click('agent-restore');
  const previews = () => descendants(ui.nodes.get('agent-result')).filter(node => node.tagName === 'pre').map(node => node.textContent);
  assert.deepEqual(previews(), ['worker_connections']);
  await until(() => ui.nodes.get('catalog-list').textContent.includes('worker_connections'));
  assert.doesNotMatch(ui.nodes.get('catalog-list').textContent, /multi_accept/);
  await ui.change('configuration', '默认值呢'); await ui.submit();
  assert.equal(previews()[0], 'worker_connections');
});

test('子路径 API、知识与详情链接跟随模块目录，会话存储与根路径隔离', async () => {
  const published = JSON.parse(read('dist/knowledge/index.json')).release_id;
  const ui = await start({ basePath: '/pi/', stored: sessionId, originalApp: true, api: request => request.path === '/api/run' ? reply(report({ knowledgeVersion: { release: published } })) : undefined });
  assert.equal(ui.nodes.get('agent-session').textContent, '未创建');
  assert.equal(ui.requests[0].path, '/pi/api/status');
  assert.ok(ui.requests.every(request => request.path.startsWith('/pi/')));
  assert.ok(ui.nodes.get('catalog-list').children.length > 0);
  await ui.submit();
  assert.match(ui.nodes.get('agent-status').textContent, /完成/);
  const sent = ui.requests.find(request => request.path === '/pi/api/run');
  assert.equal(sent.body.sessionId, undefined);
  assert.equal(ui.saved.get(storageKey), sessionId);
  assert.equal(ui.saved.get(`${storageKey}:/pi/`), sessionId);
  const standalone = await start({ basePath: '/pi/', storedEntries: [[`${storageKey}:/pi/`, sessionId]] });
  await standalone.submit();
  assert.equal(standalone.requests.find(request => request.path === '/pi/api/run').body.sessionId, sessionId);
  const links = descendants(standalone.nodes.get('agent-result')).filter(node => node.tagName === 'a').map(node => new URL(node.href));
  assert.ok(links.some(url => url.pathname === '/pi/' && url.searchParams.get('release') === release));
  assert.ok(standalone.requests.every(request => request.path.startsWith('/pi/')));
  const nested = await start({ basePath: '/tools/config/' });
  await nested.submit();
  assert.ok(nested.requests.every(request => request.path.startsWith('/tools/config/api/')));
  assert.equal(nested.saved.get(`${storageKey}:/tools/config/`), sessionId);
});

const unauthorizedHtml = () => ({ ok: false, status: 401, json: async () => { throw new Error('不应解析登录 HTML'); } });
function assertLoggedOut(ui) {
  assert.match(ui.nodes.get('agent-status').textContent, /登录已失效/);
  assert.doesNotMatch(ui.nodes.get('agent-status').textContent, /已取消|不应解析|取消尚未确认/);
  assert.equal(ui.nodes.get('agent-result').attributes['aria-busy'], 'false');
  assert.equal(ui.nodes.get('agent-retry').disabled, false);
  assert.ok(descendants(ui.nodes.get('agent-status')).some(node => node.tagName === 'a' && node.href === 'http://site.test/login'));
}

for (const endpoint of ['/api/status', '/api/run', `/api/sessions/${sessionId}`]) {
  test(`F07：${endpoint}返回401后先probe再restore保留草稿与session，完成后普通恢复仍回填`, async () => {
    let rejectAuth = false;
    const ui = await start({ stored: sessionId, api: request => rejectAuth && request.path === endpoint ? unauthorizedHtml() : undefined });
    await ui.change('configuration', '必须保留的新草稿');
    rejectAuth = true;
    if (endpoint === '/api/status') await ui.click('agent-retry');
    else if (endpoint === '/api/run') await ui.submit();
    else await ui.click('agent-restore');
    assertLoggedOut(ui);
    rejectAuth = false;
    await ui.click('agent-retry');
    await ui.click('agent-restore');
    assert.equal(ui.nodes.get('configuration').value, '必须保留的新草稿');
    assert.equal(ui.saved.get(storageKey), sessionId);
    assert.match(ui.nodes.get('agent-status').textContent, /已恢复.*输入已保留/);
    assert.equal(ui.requests.filter(request => request.method === 'POST').length, endpoint === '/api/run' ? 1 : 0);
    assert.ok(!ui.requests.some(request => request.path === '/api/cancel' || request.path.includes('/jobs/')));
    await ui.change('configuration', '普通主动恢复前的输入');
    await ui.click('agent-restore');
    assert.equal(ui.nodes.get('configuration').value, 'multi_accept off;\n\n继承？');
    assert.equal(ui.saved.get(storageKey), sessionId);
  });
}

test('F07：用户主动新会话清除认证草稿保护，后续普通恢复保持回填行为', async () => {
  let rejectAuth = false;
  const ui = await start({ stored: sessionId, api: request => rejectAuth && request.path === '/api/status' ? unauthorizedHtml() : undefined });
  await ui.change('configuration', '新草稿');
  rejectAuth = true; await ui.click('agent-retry');
  rejectAuth = false; await ui.click('agent-retry');
  await ui.click('agent-new');
  assert.equal(ui.nodes.get('configuration').value, '新草稿');
  assert.equal(ui.saved.has(storageKey), false);
  assert.equal(ui.requests.filter(request => request.method === 'POST').length, 0);
  await ui.submit();
  assert.equal(ui.requests.find(request => request.path === '/api/run').body.sessionId, undefined);
  await ui.change('configuration', '普通恢复前的输入');
  await ui.click('agent-restore');
  assert.equal(ui.nodes.get('configuration').value, 'multi_accept off;\n\n继承？');
  assert.equal(ui.saved.get(storageKey), sessionId);
});

test('状态、提交、会话恢复的401先于JSON解析，保留输入并释放等待锁', async () => {
  for (const endpoint of ['/api/status', '/api/run', `/api/sessions/${sessionId}`]) {
    const ui = await start({ stored: sessionId, api: request => request.path === endpoint ? unauthorizedHtml() : undefined });
    if (endpoint === '/api/run') await ui.submit();
    if (endpoint.includes('/sessions/')) await ui.click('agent-restore');
    assertLoggedOut(ui);
    assert.equal(ui.nodes.get('configuration').value, 'worker_connections');
    assert.equal(ui.saved.get(storageKey), sessionId);
    assert.equal(ui.requests.filter(request => request.path === '/api/cancel').length, 0);
  }
});

test('轮询401停止请求，重登录仅显式检查原job，不重复提交或恢复正在运行的session', async () => {
  let loggedIn = false;
  let resumedPolls = 0;
  const ui = await start({ basePath: '/pi/', api: request => {
    if (request.path === '/api/run') return reply(report({ state: 'running' }));
    if (request.path.startsWith('/api/jobs/')) {
      if (!loggedIn) return unauthorizedHtml();
      resumedPolls++;
      return reply(report({ state: resumedPolls === 1 ? 'running' : 'completed' }));
    }
  } });
  await ui.submit();
  assertLoggedOut(ui);
  assert.equal(ui.nodes.get('agent-restore').disabled, false);
  const count = ui.requests.length;
  await new Promise(resolve => setTimeout(resolve, 15));
  assert.equal(ui.requests.length, count);
  loggedIn = true;
  await ui.click('agent-retry');
  assert.equal(resumedPolls, 0);
  assert.equal(ui.nodes.get('agent-submit').disabled, true);
  await ui.click('agent-restore');
  assert.equal(resumedPolls, 2);
  assert.match(ui.nodes.get('agent-result').textContent, /默认 512/);
  assert.equal(ui.nodes.get('configuration').value, 'worker_connections');
  assert.equal(ui.nodes.get('agent-submit').disabled, false);
  assert.equal(ui.requests.filter(request => request.method === 'POST').length, 1);
  assert.ok(!ui.requests.some(request => request.path.includes('/sessions/')));
  assert.ok(ui.requests.filter(request => request.path.includes('/jobs/')).every(request => request.path === `/pi/api/jobs/${requestId}`));
});

test('重登录后job已回收才恢复session，保留中断后编辑的输入和会话标识', async () => {
  let loggedIn = false;
  const ui = await start({ api: request => {
    if (request.path === '/api/run') return reply(report({ state: 'running' }));
    if (request.path.startsWith('/api/jobs/')) return loggedIn ? reply({ code: 'job_unavailable' }, 404) : unauthorizedHtml();
  } });
  await ui.submit();
  await ui.change('configuration', '暂存的新问题');
  assertLoggedOut(ui);
  loggedIn = true;
  const before = ui.requests.length;
  await ui.click('agent-restore');
  assert.deepEqual(ui.requests.slice(before).map(request => request.path), ['/api/status', `/api/jobs/${requestId}`, `/api/sessions/${sessionId}`]);
  assert.equal(ui.nodes.get('configuration').value, '暂存的新问题');
  assert.equal(ui.saved.get(storageKey), sessionId);
  assert.match(ui.nodes.get('agent-status').textContent, /已恢复.*旧任务不可续传.*输入已保留/);
  assert.equal(ui.nodes.get('agent-submit').disabled, false);
  assert.equal(ui.requests.filter(request => request.method === 'POST').length, 1);
});

test('取消返回401不会再查询或重试取消，也不显示已取消；显式恢复仍找到原任务', async () => {
  const held = deferred(); let polling = false; let loggedIn = false;
  const ui = await start({ api: request => {
    if (request.path === '/api/run') return reply(report({ state: 'running' }));
    if (request.path === '/api/cancel') return unauthorizedHtml();
    if (request.path.startsWith('/api/jobs/')) {
      if (loggedIn) return reply(report());
      polling = true; return held.promise;
    }
  } });
  const done = ui.submit();
  await until(() => polling);
  await ui.click('agent-cancel');
  await until(() => ui.nodes.get('agent-status').textContent.includes('登录已失效'));
  held.resolve(reply(report({ state: 'running' })));
  await done;
  assertLoggedOut(ui);
  assert.equal(ui.requests.filter(request => request.path === '/api/cancel').length, 1);
  assert.equal(ui.requests.filter(request => request.path.includes('/jobs/')).length, 1);
  loggedIn = true; await ui.click('agent-restore');
  assert.match(ui.nodes.get('agent-status').textContent, /完成/);
  assert.equal(ui.nodes.get('agent-submit').disabled, false);
});

test('恢复原job后仍可取消，确认后清除待恢复标记和操作锁', async () => {
  let loggedIn = false; let resumed = false; const held = deferred();
  const ui = await start({ api: request => {
    if (request.path === '/api/run') return reply(report({ state: 'running' }));
    if (request.path.startsWith('/api/jobs/')) {
      if (!loggedIn) return unauthorizedHtml();
      if (!resumed) { resumed = true; return reply(report({ state: 'running' })); }
      return held.promise;
    }
  } });
  await ui.submit(); loggedIn = true;
  const restoring = ui.click('agent-restore');
  await until(() => resumed && !ui.nodes.get('agent-cancel').disabled);
  await ui.click('agent-cancel');
  held.resolve(reply(report({ state: 'cancelled' })));
  await restoring;
  await until(() => !ui.nodes.get('agent-submit').disabled);
  assert.equal(ui.requests.filter(request => request.path === '/api/cancel').length, 1);
  assert.match(ui.nodes.get('agent-status').textContent, /已取消/);
  assert.equal(ui.nodes.get('agent-result').attributes['aria-busy'], 'false');
});

test('登录中断后编辑输入，恢复旧job不覆盖输入、不渲染旧配置或迟到结果', async () => {
  let loggedIn = false;
  const ui = await start({ api: request => {
    if (request.path === '/api/run') return reply(report({ state: 'running' }));
    if (request.path.startsWith('/api/jobs/')) return loggedIn ? reply(report()) : unauthorizedHtml();
  } });
  await ui.submit(); await ui.change('configuration', '新问题');
  loggedIn = true; await ui.click('agent-restore');
  assert.equal(ui.nodes.get('configuration').value, '新问题');
  assert.equal(ui.nodes.get('agent-result').textContent, '');
  assert.match(ui.nodes.get('agent-status').textContent, /原任务完成.*输入已保留/);
  assert.equal(ui.nodes.get('agent-submit').disabled, false);
});

test('job丢失后session恢复再次401，下一次显式恢复仍保留输入和原任务标识', async () => {
  let loggedIn = false; let sessionAvailable = false;
  const ui = await start({ api: request => {
    if (request.path === '/api/run') return reply(report({ state: 'running' }));
    if (request.path.startsWith('/api/jobs/')) return loggedIn ? reply({ code: 'job_unavailable' }, 404) : unauthorizedHtml();
    if (request.path.startsWith('/api/sessions/') && !sessionAvailable) return unauthorizedHtml();
  } });
  await ui.submit(); await ui.change('configuration', '登录中断后的新草稿');
  loggedIn = true; await ui.click('agent-restore');
  assertLoggedOut(ui);
  assert.equal(ui.nodes.get('configuration').value, '登录中断后的新草稿');
  sessionAvailable = true;
  const before = ui.requests.length;
  await ui.click('agent-restore');
  assert.deepEqual(ui.requests.slice(before).map(request => request.path), ['/api/status', `/api/jobs/${requestId}`, `/api/sessions/${sessionId}`]);
  assert.equal(ui.nodes.get('configuration').value, '登录中断后的新草稿');
  assert.equal(ui.nodes.get('agent-submit').disabled, false);
  assert.equal(ui.requests.filter(request => request.method === 'POST').length, 1);
});

test('恢复前重新检测期间编辑输入使旧恢复失效，重复点击不产生并行恢复', async () => {
  let probeCount = 0; const held = deferred();
  const ui = await start({ stored: sessionId, api: request => {
    if (request.path === '/api/status') return ++probeCount === 1 ? unauthorizedHtml() : held.promise;
  } });
  const restoring = ui.click('agent-restore');
  await ui.click('agent-restore');
  assert.equal(probeCount, 2);
  await ui.change('configuration', '检测期间编辑的新问题');
  held.resolve(reply({ mode: 'mock', unifiedInput: true, model: 'test', pollIntervalMs: 2, requestTimeoutMs: 1000 }));
  await restoring;
  assert.equal(ui.nodes.get('configuration').value, '检测期间编辑的新问题');
  assert.ok(!ui.requests.some(request => request.path.includes('/sessions/')));
  assert.equal(ui.nodes.get('agent-result').attributes['aria-busy'], 'false');
});

test('Agent 卡片区分功能/语法的已核实、待补出处与未核实', async () => {
  const fact = (field, status, verification, source_ids = []) => ({ entryId, field, value: `${field}正文`, text: `${field}正文`, status, source_ids, verification });
  const citation = { ...report().modelSelection.citations[0], field: 'syntax', sourceId: 'registration', quote: '注册原文' };
  const render = async facts => {
    const ui = await start({ api: request => request.path === '/api/run' ? reply(report({ modelSelection: { resolvedFacts: facts, citations: [citation] } })) : undefined });
    await ui.submit();
    return ui.nodes.get('agent-result');
  };
  const badges = root => descendants(root).filter(node => node.tagName === 'span' && /fact-status/.test(node.className ?? ''));
  const basic = await render([fact('summary', 'unverified', 'basic_verified'), fact('syntax', 'verified', 'basic_verified', ['registration'])]);
  const text = basic.textContent;
  assert.ok(text.includes(knowledge.FIELD_PENDING_LABEL) && text.includes(knowledge.FIELD_PENDING_NOTE));
  assert.ok(text.includes('已核实') && text.includes('注册原文'));
  // 待补出处使用中性样式，已核实使用 verified 样式；二者都不是警示色。
  assert.deepEqual(badges(basic).map(node => node.textContent + ':' + node.className), [`${knowledge.FIELD_PENDING_LABEL}:fact-status neutral`, '已核实:fact-status verified']);
  const registrationOnly = await render([fact('summary', 'unverified', 'registration_only')]);
  assert.ok(registrationOnly.textContent.includes('未核实') && registrationOnly.textContent.includes('尚未记录该项字段级来源；不借用其他源码作为证明。'));
  assert.ok(!registrationOnly.textContent.includes(knowledge.FIELD_PENDING_LABEL));
  assert.match(badges(registrationOnly)[0].className, /pending/);
  // 只有功能/语法才使用“待补出处”；其他字段未核实仍按原样显示。
  const other = await render([{ ...fact('defaults', 'unverified', 'basic_verified'), value: { text: '默认', status: 'unverified', source_ids: [] } }]);
  assert.ok(!other.textContent.includes(knowledge.FIELD_PENDING_LABEL));
});

test('业务范围：范围外与问候只显示固定话术，不出现空模型选取提示或配置预览', async () => {
  const cases = [['out_of_scope', '本服务只查询 OpenResty/Nginx 配置。'], ['greeting', '你好，我是配置查询助手。']];
  for (const [action, message] of cases) {
    const ui = await start({ api: request => request.path === '/api/run'
      ? reply(report({ state: 'completed', summary: undefined, questions: [], normalizedRequest: null, modelSelection: null, inputResolution: { action, message } })) : undefined });
    await ui.submit();
    const text = ui.nodes.get('agent-result').textContent;
    assert.ok(text.includes(message), action);
    assert.doesNotMatch(text, /本次没有可展示的模型选取/, action);
    assert.doesNotMatch(text, /本次识别的配置|本次沿用的配置/, action);
  }
});

test('指令名说明和被省略的外部参考都以文本显示固定文案，会话标题用规范名', async () => {
  const notice = '已按指令名 client_max_body_size 理解（Nginx 指令名区分大小写，原写法 Client_Max_Body_Size）。';
  const ui = await start({ api: request => request.path === '/api/run' ? reply(report({
    normalizedRequest: { input: 'client_max_body_size', mode: 'single', question: '默认值', release },
    inputResolution: { action: 'directive', notice, canonicalized: { from: 'Client_Max_Body_Size', to: 'client_max_body_size' } },
    webRefsDropped: 2,
    webReferences: refs,
  })) : undefined });
  await ui.change('configuration', 'Client_Max_Body_Size 的默认值是什么');
  await ui.submit();
  const text = ui.nodes.get('agent-result').textContent;
  assert.ok(text.includes(notice));
  assert.ok(text.includes('部分外部参考未通过校验，已省略'));
  assert.equal(JSON.parse(ui.saved.get(`${storageKey}:list`))[0].title, 'client_max_body_size');
});

test('业务范围：ignored 结果显示未处理提示，并仍渲染业务结果', async () => {
  const notice = '消息中与配置无关的部分未处理。';
  const ui = await start({ api: request => request.path === '/api/run' ? reply(report({ inputResolution: { action: 'config', ignored: true, notice } })) : undefined });
  await ui.submit();
  const text = ui.nodes.get('agent-result').textContent;
  assert.ok(text.includes(notice));
  assert.ok(text.includes('默认 512'));
});

// 外部参考测试：宿主已校验过的 webReferences 形状为 {url,title,site,quote}。
const refs = [
  { url: 'https://nginx.org/en/docs/http/ngx_http_proxy_module.html', title: '官方文档标题', site: 'nginx.org', quote: 'proxy_cache_lock enables locking of cache fills' },
];
const refTitle = '官方文档标题';
// 查找外部参考区块，供多个测试复用。
const referenceBlock = root => descendants(root).find(node => node.className === 'external-refs');

test('外部参考：有参考时区块位于事实卡片之后，标题链接属性正确，引文作为文本显示', async () => {
  const ui = await start({ api: request => request.path === '/api/run' ? reply(report({ webReferences: refs })) : undefined });
  await ui.submit();
  const result = ui.nodes.get('agent-result');
  const text = result.textContent;
  assert.ok(text.includes('外部参考（未按锁定版本核实）'));
  assert.ok(text.includes('来自联网搜索，仅供参考；内容可能对应其他版本，未经本站源码核对。'));
  // 区块在模型事实卡片之后渲染。
  assert.ok(text.indexOf('默认 512') < text.indexOf('外部参考（未按锁定版本核实）'));
  const block = referenceBlock(result);
  assert.ok(block, '应渲染外部参考区块');
  const title = descendants(block).find(node => node.textContent === refTitle);
  assert.equal(title.tagName, 'a');
  assert.equal(title.href, refs[0].url);
  assert.equal(title.target, '_blank');
  assert.equal(title.rel, 'noopener noreferrer');
  assert.ok(descendants(block).some(node => node.className === 'external-ref-site' && node.textContent === 'nginx.org'));
  assert.ok(descendants(block).some(node => node.tagName === 'blockquote' && node.textContent === refs[0].quote));
  assert.ok(!descendants(result).some(node => ['img', 'script'].includes(node.tagName)));
});

test('外部参考：非 https 地址不设置 href，仅以文本显示', async () => {
  const unsafe = [
    { url: 'http://nginx.org/en/plain.html', title: 'HTTP 标题', site: 'nginx.org', quote: '普通 http 地址的引文内容' },
    { url: 'javascript:alert(1)', title: 'JS 标题', site: 'nginx.org', quote: '脚本协议地址的引文内容' },
  ];
  const ui = await start({ api: request => request.path === '/api/run' ? reply(report({ webReferences: unsafe })) : undefined });
  await ui.submit();
  const block = referenceBlock(ui.nodes.get('agent-result'));
  for (const label of ['HTTP 标题', 'JS 标题']) {
    const el = descendants(block).find(node => node.textContent === label);
    assert.ok(el, label);
    assert.equal(el.href, undefined, label);
    assert.notEqual(el.tagName, 'a', label);
  }
  assert.ok(!descendants(block).some(node => typeof node.href === 'string' && /^(javascript|http:)/.test(node.href)));
});

test('外部参考：恶意标题以文本显示，不生成元素', async () => {
  const malicious = '<img src=x onerror=alert(1)>';
  const ui = await start({ api: request => request.path === '/api/run' ? reply(report({ webReferences: [{ ...refs[0], title: malicious }] })) : undefined });
  await ui.submit();
  const result = ui.nodes.get('agent-result');
  assert.ok(result.textContent.includes(malicious));
  assert.ok(!descendants(result).some(node => ['img', 'script'].includes(node.tagName)));
  assert.equal(descendants(result).find(node => node.textContent === malicious).tagName, 'a');
});

test('外部参考：unsupported 且有参考时显示指向参考的文案，不显示空选取提示', async () => {
  const ui = await start({ api: request => request.path === '/api/run'
    ? reply(report({ state: 'awaiting_input', modelSelection: { status: 'unsupported', resolvedFacts: [], citations: [] }, webReferences: refs })) : undefined });
  await ui.submit();
  const text = ui.nodes.get('agent-result').textContent;
  assert.ok(text.includes('当前知识字段无法回答此问题；下面是联网找到的外部参考。'));
  assert.ok(!text.includes('未生成自由解释'));
  assert.ok(!text.includes('本次没有可展示的模型选取'));
  assert.ok(referenceBlock(ui.nodes.get('agent-result')));
});

test('外部参考：unsupported 无参考时保持原文案', async () => {
  const ui = await start({ api: request => request.path === '/api/run'
    ? reply(report({ state: 'awaiting_input', modelSelection: { status: 'unsupported', resolvedFacts: [], citations: [] } })) : undefined });
  await ui.submit();
  const text = ui.nodes.get('agent-result').textContent;
  assert.ok(text.includes('当前知识字段无法回答此问题；未生成自由解释，请调整问题。'));
  assert.ok(text.includes('本次没有可展示的模型选取'));
  assert.equal(referenceBlock(ui.nodes.get('agent-result')), undefined);
});

test('外部参考：未收录指令有参考时追加指向参考的文案，不显示空选取提示', async () => {
  const ui = await start({ api: request => request.path === '/api/run'
    ? reply(report({ state: 'awaiting_input', inputResolution: { action: 'directive', unindexed: true }, modelSelection: { status: 'no_candidates', resolvedFacts: [], citations: [] }, webReferences: refs })) : undefined });
  await ui.submit();
  const text = ui.nodes.get('agent-result').textContent;
  assert.ok(text.includes('当前知识发布未收录该指令。下面是联网找到的外部参考。'));
  assert.ok(!text.includes('本次没有可展示的模型选取'));
  assert.ok(referenceBlock(ui.nodes.get('agent-result')));
});

test('外部参考：未收录指令无参考时只显示未收录文案', async () => {
  const ui = await start({ api: request => request.path === '/api/run'
    ? reply(report({ state: 'awaiting_input', inputResolution: { action: 'directive', unindexed: true }, modelSelection: { status: 'no_candidates', resolvedFacts: [], citations: [] } })) : undefined });
  await ui.submit();
  const text = ui.nodes.get('agent-result').textContent;
  assert.ok(text.includes('当前知识发布未收录该指令。'));
  assert.ok(!text.includes('下面是联网找到的外部参考'));
  assert.equal(referenceBlock(ui.nodes.get('agent-result')), undefined);
});

test('外部参考：带用户信息或端口的 https 地址同样不设置 href', async () => {
  const tricky = [
    { url: 'https://user@nginx.org/en/user.html', title: '带用户名标题', site: 'nginx.org', quote: '带用户名地址的引文内容' },
    { url: 'https://user:secret@nginx.org/en/pw.html', title: '带密码标题', site: 'nginx.org', quote: '带密码地址的引文内容' },
    { url: 'https://nginx.org:8443/en/port.html', title: '带端口标题', site: 'nginx.org', quote: '带端口地址的引文内容' },
  ];
  const ui = await start({ api: request => request.path === '/api/run' ? reply(report({ webReferences: tricky })) : undefined });
  await ui.submit();
  const block = referenceBlock(ui.nodes.get('agent-result'));
  for (const label of ['带用户名标题', '带密码标题', '带端口标题']) {
    const el = descendants(block).find(node => node.textContent === label);
    assert.ok(el, label);
    assert.equal(el.tagName, 'span', label);
    assert.equal(el.href, undefined, label);
  }
});

test('外部参考：引文为空时不渲染 blockquote，标题与站点仍显示', async () => {
  const ui = await start({ api: request => request.path === '/api/run' ? reply(report({ webReferences: [{ ...refs[0], quote: '' }] })) : undefined });
  await ui.submit();
  const block = referenceBlock(ui.nodes.get('agent-result'));
  assert.ok(block);
  assert.ok(!descendants(block).some(node => node.tagName === 'blockquote'));
  assert.ok(descendants(block).some(node => node.textContent === refTitle));
});

test('外部参考：未收录且没有 status 的空事实加参考时，显示未收录文案并指向参考', async () => {
  // 模型未输出 status 时（契约不强制），仍须依据 unindexed 与空事实显示未收录文案。
  const ui = await start({ api: request => request.path === '/api/run'
    ? reply(report({ state: 'awaiting_input', inputResolution: { action: 'directive', unindexed: true }, modelSelection: { resolvedFacts: [], citations: [] }, webReferences: refs })) : undefined });
  await ui.submit();
  const text = ui.nodes.get('agent-result').textContent;
  assert.ok(text.includes('当前知识发布未收录该指令。下面是联网找到的外部参考。'));
  assert.ok(!text.includes('本次没有可展示的模型选取'));
  assert.ok(referenceBlock(ui.nodes.get('agent-result')));
});

test('外部参考：未收录与 unsupported 同时出现时，优先显示未收录文案', async () => {
  const withRefs = await start({ api: request => request.path === '/api/run'
    ? reply(report({ state: 'awaiting_input', inputResolution: { action: 'directive', unindexed: true }, modelSelection: { status: 'unsupported', resolvedFacts: [], citations: [] }, webReferences: refs })) : undefined });
  await withRefs.submit();
  const textWithRefs = withRefs.nodes.get('agent-result').textContent;
  assert.ok(textWithRefs.includes('当前知识发布未收录该指令。下面是联网找到的外部参考。'));
  assert.ok(!textWithRefs.includes('当前知识字段无法回答此问题'));
  const noRefs = await start({ api: request => request.path === '/api/run'
    ? reply(report({ state: 'awaiting_input', inputResolution: { action: 'directive', unindexed: true }, modelSelection: { status: 'unsupported', resolvedFacts: [], citations: [] } })) : undefined });
  await noRefs.submit();
  const textNoRefs = noRefs.nodes.get('agent-result').textContent;
  assert.ok(textNoRefs.includes('当前知识发布未收录该指令。'));
  assert.ok(!textNoRefs.includes('未生成自由解释'));
  assert.ok(!textNoRefs.includes('当前知识字段无法回答此问题'));
});

test('外部参考：未收录且无参考时，不出现“没有可展示的模型选取”（无论是否有 status）', async () => {
  for (const modelSelection of [{ resolvedFacts: [], citations: [] }, { status: 'no_candidates', resolvedFacts: [], citations: [] }]) {
    const ui = await start({ api: request => request.path === '/api/run'
      ? reply(report({ state: 'awaiting_input', inputResolution: { action: 'directive', unindexed: true }, modelSelection })) : undefined });
    await ui.submit();
    const text = ui.nodes.get('agent-result').textContent;
    assert.ok(text.includes('当前知识发布未收录该指令。'));
    assert.ok(!text.includes('本次没有可展示的模型选取'));
  }
});

test('历史会话列表：新增、更新、上限 20、删除、过期与标题只走文本', async t => {
  const pages = [];
  // 页面沙箱会留住知识索引；测完放开引用，避免和同文件其他用例叠在一起。
  t.after(() => { pages.length = 0; });
  const keep = page => { pages.push(page); return page; };
  const listKey = `${storageKey}:list`;
  const buttons = (root, label) => descendants(root).filter(node => node.tagName === 'button' && node.textContent === label);
  const baseStatus = { mode: 'mock', unifiedInput: true, model: 'test', siteBase: 'http://site.test/', pollIntervalMs: 2, requestTimeoutMs: 1000, retentionEnabled: true, sessionTtlMs: 259200000 };
  const added = keep(await start());
  await added.submit();
  const created = JSON.parse(added.saved.get(listKey));
  assert.equal(created.length, 1); assert.equal(created[0].id, sessionId); assert.equal(created[0].title, 'worker_connections');
  const titled = keep(await start());
  await titled.change('configuration', `${'字'.repeat(40)}\n第二行不进标题`);
  await titled.submit();
  assert.equal(JSON.parse(titled.saved.get(listKey))[0].title, '字'.repeat(30));
  const named = keep(await start({ stored: sessionId, api: request => {
    if (request.path === '/api/status') return reply(baseStatus);
    if (request.path.startsWith('/api/sessions/')) return reply({ request: { message: 'worker_connections 的默认值', release }, currentSubject: { input: 'worker_connections', mode: 'single', release }, messages: 2 });
  } }));
  await named.click('agent-restore');
  await named.change('configuration', '默认值呢');
  await named.submit();
  assert.equal(JSON.parse(named.saved.get(listKey))[0].title, 'worker_connections');
  const previous = [{ id: sessionId, title: '旧标题', updatedAt: 10 }];
  const updated = keep(await start({ stored: sessionId, storedEntries: [[listKey, JSON.stringify(previous)]] }));
  await updated.submit();
  const touched = JSON.parse(updated.saved.get(listKey))[0];
  assert.equal(touched.title, 'worker_connections'); assert.ok(touched.updatedAt > 10);
  const seeded = Array.from({ length: 20 }, (_, index) => ({ id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`, title: `旧${index}`, updatedAt: 1000 + index }));
  const capped = keep(await start({ storedEntries: [[listKey, JSON.stringify(seeded)]] }));
  await capped.submit();
  const limited = JSON.parse(capped.saved.get(listKey));
  assert.equal(limited.length, 20);
  assert.equal(limited.some(item => item.id === sessionId), true);
  assert.equal(limited.some(item => item.id === seeded[0].id), false);
  const malicious = '<img src=x onerror=alert(1)>';
  const staleId = '33333333-3333-4333-8333-333333333333';
  const expired = keep(await start({ storedEntries: [[listKey, JSON.stringify([{ id: staleId, title: malicious, updatedAt: Date.now() - 10000 }])]], api: request => request.path === '/api/status' ? reply({ ...baseStatus, sessionTtlMs: 1000 }) : undefined }));
  const expiredText = expired.nodes.get('agent-history-list').textContent;
  assert.match(expiredText, /已过期/); assert.ok(expiredText.includes(malicious));
  assert.ok(!descendants(expired.nodes.get('agent-history-list')).some(node => node.tagName === 'img'));
  assert.equal(expired.requests.some(request => request.method === 'DELETE'), false);
  await buttons(expired.nodes.get('agent-history-list'), '移除')[0].dispatchEvent({ type: 'click' });
  assert.equal(JSON.parse(expired.saved.get(listKey)).length, 0);
  const otherId = '44444444-4444-4444-8444-444444444444';
  const removable = keep(await start({ stored: sessionId, storedEntries: [[listKey, JSON.stringify([{ id: sessionId, title: '当前', updatedAt: Date.now() }, { id: otherId, title: '另一会话', updatedAt: Date.now() - 1000 }])]] }));
  const otherRow = removable.nodes.get('agent-history-list').children.find(node => node.textContent.includes('另一会话'));
  await otherRow.children.find(node => node.tagName === 'button' && node.textContent === '切换').dispatchEvent({ type: 'click' });
  assert.equal(removable.saved.get(storageKey), otherId);
  assert.ok(removable.requests.some(request => request.method === 'GET' && request.path === `/api/sessions/${otherId}`));
  const currentRow = removable.nodes.get('agent-history-list').children.find(node => node.className === 'is-current');
  await currentRow.children.find(node => node.textContent === '删除').dispatchEvent({ type: 'click' });
  assert.ok(removable.requests.some(request => request.method === 'DELETE' && request.path === `/api/sessions/${otherId}`));
  assert.equal(removable.saved.has(storageKey), false);
  assert.match(removable.nodes.get('agent-status').textContent, /已删除当前会话/);
  const broken = keep(await start({ storedEntries: [[listKey, '{']] }));
  assert.equal(broken.nodes.get('agent-history-list').children.length, 0);
  const held = deferred();
  const busy = keep(await start({ storedEntries: [[listKey, JSON.stringify([{ id: sessionId, title: '当前', updatedAt: Date.now() }])]], api: request => {
    if (request.path === '/api/run') return reply(report({ state: 'running', modelSelection: null }));
    if (request.path.startsWith('/api/jobs/')) return held.promise;
  } }));
  const pending = busy.submit();
  await until(() => busy.nodes.get('agent-submit').disabled);
  assert.equal(buttons(busy.nodes.get('agent-history-list'), '切换')[0].disabled, true);
  assert.equal(buttons(busy.nodes.get('agent-history-list'), '删除')[0].disabled, true);
  held.resolve(reply(report()));
  await pending;
});

test('切换失败回滚到旧会话标识，删除当前会话清空结果', async t => {
  const pages = [];
  t.after(() => { pages.length = 0; });
  const listKey = `${storageKey}:list`;
  const otherId = '44444444-4444-4444-8444-444444444444';
  const switched = await start({ stored: sessionId, storedEntries: [[listKey, JSON.stringify([{ id: sessionId, title: '当前', updatedAt: Date.now() }, { id: otherId, title: '另一会话', updatedAt: Date.now() - 1000 }])]], api: request => request.path === `/api/sessions/${otherId}` ? reply({ error: '服务故障', code: 'request_failed' }, 500) : undefined });
  pages.push(switched);
  const otherRow = switched.nodes.get('agent-history-list').children.find(node => node.textContent.includes('另一会话'));
  await otherRow.children.find(node => node.textContent === '切换').dispatchEvent({ type: 'click' });
  assert.equal(switched.saved.get(storageKey), sessionId);
  assert.equal(switched.nodes.get('agent-session').textContent, sessionId);
  assert.match(switched.nodes.get('agent-status').textContent, /恢复未完成/);
  const removed = await start();
  pages.push(removed);
  await removed.submit();
  assert.match(removed.nodes.get('agent-result').textContent, /默认 512/);
  const currentRow = removed.nodes.get('agent-history-list').children.find(node => node.className === 'is-current');
  await currentRow.children.find(node => node.textContent === '删除').dispatchEvent({ type: 'click' });
  assert.equal(removed.nodes.get('agent-result').textContent, '');
  assert.match(removed.nodes.get('agent-status').textContent, /已删除当前会话/);
  assert.equal(removed.saved.has(storageKey), false);
});

test('外部参考：无参考或空数组时不出现区块与参考文案', async () => {
  for (const patch of [{}, { webReferences: [] }]) {
    const ui = await start({ api: request => request.path === '/api/run' ? reply(report(patch)) : undefined });
    await ui.submit();
    const text = ui.nodes.get('agent-result').textContent;
    assert.ok(text.includes('默认 512'));
    assert.ok(!text.includes('外部参考'));
    assert.equal(referenceBlock(ui.nodes.get('agent-result')), undefined);
  }
});
