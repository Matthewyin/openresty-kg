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

test('提交尚未返回 requestId 就点取消，迟到任务仍被取消，不保存旧会话或回显', async () => {
  const held = deferred();
  const ui = await start({ api: request => request.path === '/api/run' ? held.promise : undefined });
  const done = ui.submit();
  await until(() => ui.requests.some(request => request.path === '/api/run'));
  // 需求变更：原先这里用“改输入”触发取消；输入变化不再取消任务，改用显式取消按钮覆盖同一条迟到任务防线。
  await ui.click('agent-cancel');
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
    // 需求变更：新会话与 release 变化仍清空对话流；取消保留已出现的轮次，但迟到结果不得写入，且该轮标为已取消。
    if (action === 'cancel') {
      assert.ok(ui.nodes.get('agent-result').textContent.includes('已取消'), action);
      assert.ok(!ui.nodes.get('agent-result').textContent.includes('默认 512'), action);
    } else assert.equal(ui.nodes.get('agent-result').textContent, '', action);
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

test('真实模型标签：modelConfig 为 ok / 缺失保持原样，invalid 显示警示并沿用 mock 样式', async () => {
  const live = modelConfig => start({ api: request => request.path === '/api/status' ? reply({ mode: 'live', unifiedInput: true, model: 'GLM-5.3-flash', ...(modelConfig ? { modelConfig } : {}), pollIntervalMs: 2, requestTimeoutMs: 1000 }) : undefined });
  const ok = await live({ state: 'ok' });
  assert.equal(ok.nodes.get('agent-environment').textContent, '真实模型 · GLM-5.3-flash');
  assert.equal(ok.nodes.get('agent-environment').dataset.state, 'ready');
  const missing = await live();
  assert.equal(missing.nodes.get('agent-environment').textContent, '真实模型 · GLM-5.3-flash');
  assert.equal(missing.nodes.get('agent-environment').dataset.state, 'ready');
  const invalid = await live({ state: 'invalid', reason: 'parse' });
  assert.equal(invalid.nodes.get('agent-environment').textContent, '真实模型 · GLM-5.3-flash（配置文件无效，仍用上一份有效配置）');
  assert.equal(invalid.nodes.get('agent-environment').dataset.state, 'mock');
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
  // 需求变更：取消不再清空回答区，改为保留该轮并标记已取消；仍不得出现迟到的最终结果。
  assert.ok(ui.nodes.get('agent-result').textContent.includes('已取消'));
  assert.ok(!ui.nodes.get('agent-result').textContent.includes('默认 512'));
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
  // 需求变更：输入变化不再清空回答区；旧轮仍在，但标为“结果未回填”，且不渲染迟到的最终结果。
  assert.ok(!ui.nodes.get('agent-result').textContent.includes('默认 512'));
  assert.ok(ui.nodes.get('agent-result').textContent.includes('结果未回填'));
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

test('inputResolution.notice 与被省略的外部参考都以文本显示固定文案；会话标题取提交时用户消息的原写法（不做规范名替换）', async () => {
  // 大小写提示由后端写进通用的 notice 字段，前端只按文本显示；没有专门的规范名字段或逻辑。
  const notice = '配置中的 Listen 未匹配。Nginx 指令名区分大小写；索引中有 listen，未自动按其查询。';
  const ui = await start({ api: request => request.path === '/api/run' ? reply(report({
    normalizedRequest: { input: 'client_max_body_size', mode: 'single', question: '默认值', release },
    inputResolution: { action: 'directive', notice },
    webRefsDropped: 2,
    webReferences: refs,
  })) : undefined });
  await ui.change('configuration', 'client_max_body_size 的默认值是什么');
  await ui.submit();
  const text = ui.nodes.get('agent-result').textContent;
  assert.ok(text.includes(notice));
  assert.ok(text.includes('部分外部参考未通过校验，已省略'));
  // 会话标题回到提交时按用户消息取的原写法（不在报告返回后再替换成规范名），也没有“已按 X 理解”之类的说明。
  assert.equal(JSON.parse(ui.saved.get(`${storageKey}:list`))[0].title, 'client_max_body_size 的默认值是什么');
  assert.ok(!text.includes('已按指令名'));
});

test('外部参考全部被丢弃且本次没有联网：显示中性文案，不暗示联网查过，也不出现被丢弃的内容', async () => {
  const ui = await start({ api: request => request.path === '/api/run' ? reply(report({
    webRefsDropped: 2, webReferences: [], webSearch: { calls: 0 },
  })) : undefined });
  await ui.submit();
  const text = ui.nodes.get('agent-result').textContent;
  assert.ok(text.includes('模型给出的外部参考无法核实，已忽略'));
  assert.ok(!text.includes('未通过校验'));
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

// ---------- 对话流（追问保留上一轮回答） ----------
// 轮次卡与其摘要行：fake DOM 中 details 的 open 是普通属性，summary 的摘要写在 turn-summary 子节点。
const turnsOf = ui => ui.nodes.get('agent-result').children.filter(node => node.className === 'agent-turn');
const turnSummary = turn => descendants(turn).find(node => node.className === 'turn-summary')?.textContent;
const publishedRelease = () => JSON.parse(read('dist/knowledge/index.json')).release_id;

test('对话流：输入变化不清空回答区、不取消任务，只在状态行给出轻提示', async () => {
  const ui = await start();
  await ui.submit();
  assert.match(ui.nodes.get('agent-result').textContent, /默认 512/);
  await ui.change('configuration', '继续问继承');
  // 回答仍在；状态行是追问提示，不再说“旧结果不再用于当前输入”。
  assert.match(ui.nodes.get('agent-result').textContent, /默认 512/);
  assert.equal(turnsOf(ui).length, 1);
  assert.match(ui.nodes.get('agent-status').textContent, /输入已变化，提交后将作为追问或新查询处理/);
  assert.doesNotMatch(ui.nodes.get('agent-status').textContent, /旧结果不再用于当前输入/);
  assert.equal(ui.requests.filter(request => request.path === '/api/cancel').length, 0);
  assert.equal(ui.nodes.get('agent-submit').disabled, false);
});

test('对话流：运行中改输入不取消任务，结果落入原轮次；运行中仍不允许重复提交', async () => {
  const held = deferred(); let polling = false;
  const ui = await start({ api: request => {
    if (request.path === '/api/run') return reply(report({ state: 'running', modelSelection: null }));
    if (request.path.startsWith('/api/jobs/')) { polling = true; return held.promise; }
  } });
  const done = ui.submit(); await until(() => polling);
  const before = ui.nodes.get('agent-status').textContent;
  await ui.change('configuration', '运行中追加的新问题');
  // 运行中不覆盖进度文字，提交按钮保持禁用，再次提交不产生第二个 /api/run。
  assert.equal(ui.nodes.get('agent-status').textContent, before);
  assert.equal(ui.nodes.get('agent-submit').disabled, true);
  await ui.submit();
  assert.equal(ui.requests.filter(request => request.path === '/api/run').length, 1);
  held.resolve(reply(report())); await done;
  assert.equal(ui.requests.filter(request => request.path === '/api/cancel').length, 0);
  assert.equal(turnsOf(ui).length, 1);
  assert.match(turnsOf(ui)[0].textContent, /默认 512/);
  assert.equal(ui.nodes.get('configuration').value, '运行中追加的新问题');
  assert.equal(ui.nodes.get('agent-submit').disabled, false);
});

test('对话流：连续两次提交产生两个轮次卡，旧轮折叠、新轮展开，历史轮不触发请求', async () => {
  const ui = await start();
  await ui.change('configuration', '第一问 worker_connections'); await ui.submit();
  let cards = turnsOf(ui);
  assert.equal(cards.length, 1); assert.equal(cards[0].open, true);
  await ui.change('configuration', '第二问 继承'); await ui.submit();
  cards = turnsOf(ui);
  assert.equal(cards.length, 2);
  assert.deepEqual(cards.map(card => card.open), [false, true]);
  assert.deepEqual(cards.map(turnSummary), ['第一问 worker_connections', '第二问 继承']);
  // 两轮的回答都还在；第二次提交携带同一会话。
  assert.ok(cards.every(card => /默认 512/.test(card.textContent)));
  assert.equal(ui.requests.filter(request => request.path === '/api/run').at(-1).body.sessionId, sessionId);
  // 旧轮只是已渲染的 DOM：之后输入、再等待都不再有网络请求。
  const count = ui.requests.length;
  await ui.change('configuration', '第三问草稿');
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(ui.requests.length, count);
});

test('对话流：最多保留 20 轮，超出从最旧一轮移除；摘要截断且按文本显示', async () => {
  const ui = await start();
  for (let i = 1; i <= 22; i++) { await ui.change('configuration', `问题 ${i}`); await ui.submit(); }
  const cards = turnsOf(ui);
  assert.equal(cards.length, 20);
  assert.equal(turnSummary(cards[0]), '问题 3'); assert.equal(turnSummary(cards.at(-1)), '问题 22');
  assert.ok(cards[0].textContent.startsWith('第 3 轮')); assert.ok(cards.at(-1).textContent.startsWith('第 22 轮'));
  assert.deepEqual(cards.map(card => card.open), [...Array(19).fill(false), true]);
  // 长输入只取首个非空行并截断到 60 个字符；含 HTML/script 的用户文本只作为文本。
  const attack = `\n  <script>alert(1)</script><img src=x onerror=alert(1)>${'长'.repeat(80)}\n第二行不进摘要`;
  await ui.change('configuration', attack); await ui.submit();
  const last = turnsOf(ui).at(-1);
  const summary = turnSummary(last);
  assert.equal(Array.from(summary).length, 61);
  assert.ok(summary.startsWith('<script>alert(1)</script><img src=x onerror=alert(1)>') && summary.endsWith('…'));
  assert.ok(!summary.includes('第二行'));
  assert.ok(!descendants(ui.nodes.get('agent-result')).some(node => ['img', 'script'].includes(node.tagName)));
  assert.equal(turnsOf(ui).length, 20);
});

// 真实后端形态：首轮 config 带 inputSource:'message' 与 configRange，question 是用户问题；
// 追问是 inputSource:'meta'、无 configRange，question 是追问句。input/mode/context/module/release 才决定右侧内容。
const firstObject = release_ => ({ input: 'events { worker_connections 1024; }', mode: 'fragment', question: '默认值？', release: release_, inputSource: 'message', configRange: { start: 0, end: 35 } });
const followObject = release_ => ({ input: 'events { worker_connections 1024; }', mode: 'fragment', question: '继承呢', release: release_, inputSource: 'meta' });
const PRIOR = /此处为上一次识别出的对象/;

test('对话流：真实形态的追问（inputSource:meta、无 configRange、question 不同）右侧不重置，input 变了才替换', async () => {
  const published = publishedRelease();
  const objects = [firstObject(published), followObject(published), { input: 'http { gzip on; }', mode: 'fragment', question: '功能？', release: published, inputSource: 'message', configRange: { start: 0, end: 16 } }];
  let runs = 0;
  const ui = await start({ originalApp: true, api: request => request.path === '/api/run'
    ? reply(report({ knowledgeVersion: { release: published }, normalizedRequest: objects[runs++], inputResolution: { action: runs === 2 ? 'followup' : 'config' } })) : undefined });
  const events = [];
  ui.nodes.get('configuration').addEventListener('agent-analysis', () => events.push('agent-analysis'));
  await ui.change('configuration', 'events { worker_connections 1024; }\n默认值？'); await ui.submit();
  await until(() => ui.nodes.get('query-status').textContent.includes('已提取 2 项'));
  const catalogAfterFirst = ui.nodes.get('catalog-list').textContent;
  assert.match(catalogAfterFirst, /worker_connections/);
  // 追问输入：右侧不清除，只加中性标注。
  await ui.change('configuration', '那继承呢？');
  assert.equal(ui.nodes.get('catalog-list').textContent, catalogAfterFirst);
  assert.match(ui.nodes.get('query-status').textContent, PRIOR);
  assert.match(ui.nodes.get('agent-result').textContent, /默认 512/);
  // 提交追问：对象实际内容相同，不再派发 agent-analysis；右侧不变，输入与提交一致故标注撤销。
  await ui.submit();
  assert.deepEqual(events, ['agent-analysis']);
  assert.equal(turnsOf(ui).length, 2);
  assert.equal(ui.nodes.get('catalog-list').textContent, catalogAfterFirst);
  assert.doesNotMatch(ui.nodes.get('query-status').textContent, PRIOR);
  assert.match(ui.nodes.get('query-status').textContent, /已提取 2 项/);
  // input 变了才替换右侧；旧轮卡仍保留。
  await ui.change('configuration', '换成 gzip'); await ui.submit();
  assert.equal(events.length, 2);
  await until(() => ui.nodes.get('catalog-list').textContent.includes('gzip'));
  assert.doesNotMatch(ui.nodes.get('catalog-list').textContent, /worker_connections/);
  assert.equal(turnsOf(ui).length, 3);
});

test('对话流：运行中用户又改了输入，完成后右侧加标注（沿用对象与替换对象两条路径都覆盖）', async () => {
  const published = publishedRelease();
  const gzip = { input: 'http { gzip on; }', mode: 'fragment', question: '功能？', release: published, inputSource: 'message' };
  // 第四轮是 gzip 对象的追问：本轮确认右侧属于它，输入与提交一致时才可撤销标注。
  const objects = [firstObject(published), followObject(published), gzip, { ...gzip, question: '再问', inputSource: 'meta' }];
  let run = -1; let gate = null;
  const ui = await start({ originalApp: true, api: request => {
    if (request.path === '/api/run') { run++; return reply(report({ state: 'running', knowledgeVersion: { release: published }, normalizedRequest: objects[run], inputResolution: { action: run === 1 ? 'followup' : 'config' } })); }
    if (request.path.startsWith('/api/jobs/')) return gate ? gate.promise : reply(report({ knowledgeVersion: { release: published }, normalizedRequest: objects[run], inputResolution: { action: run === 1 ? 'followup' : 'config' } }));
  } });
  await ui.change('configuration', '第一问'); await ui.submit();
  await until(() => ui.nodes.get('query-status').textContent.includes('已提取 2 项'));
  assert.doesNotMatch(ui.nodes.get('query-status').textContent, PRIOR);
  // 路径一：沿用同一对象（不派发 agent-analysis）。运行期间输入框被改，完成后仍要标注。
  gate = deferred();
  const second = ui.change('configuration', '第二问').then(() => ui.submit());
  await until(() => ui.nodes.get('agent-submit').disabled);
  await ui.change('configuration', '第二问之后又改的草稿');
  gate.resolve(reply(report({ knowledgeVersion: { release: published }, normalizedRequest: objects[1], inputResolution: { action: 'followup' } }))); await second;
  assert.match(ui.nodes.get('query-status').textContent, /已提取 2 项/);
  assert.match(ui.nodes.get('query-status').textContent, PRIOR);
  // 路径二：替换为新对象（派发 agent-analysis，runQuery 重建右侧）。同样要在重建后保留/出现标注。
  gate = deferred();
  const third = ui.change('configuration', '第三问').then(() => ui.submit());
  await until(() => ui.nodes.get('agent-submit').disabled);
  await ui.change('configuration', '第三问之后又改的草稿');
  gate.resolve(reply(report({ knowledgeVersion: { release: published }, normalizedRequest: objects[2], inputResolution: { action: 'config' } }))); await third;
  await until(() => ui.nodes.get('catalog-list').textContent.includes('gzip'));
  assert.match(ui.nodes.get('query-status').textContent, PRIOR);
  // 提交的消息与输入框一致时没有标注。
  await ui.change('configuration', '第四问'); gate = null; await ui.submit();
  assert.doesNotMatch(ui.nodes.get('query-status').textContent, PRIOR);
});

test('对话流：本地解析结果在输入变化后仍被清除，不会显示为当前输入的结果', async () => {
  const ui = await start({ originalApp: true });
  await ui.nodes.get('query-form').dispatchEvent({ type: 'submit', preventDefault() {} });
  assert.match(ui.nodes.get('query-status').textContent, /唯一匹配/);
  assert.match(ui.nodes.get('catalog-list').textContent, /worker_connections/);
  await ui.change('configuration', 'gzip');
  assert.match(ui.nodes.get('query-status').textContent, /输入已变化，请重新查询/);
  assert.doesNotMatch(ui.nodes.get('query-status').textContent, /唯一匹配/);
  assert.doesNotMatch(ui.nodes.get('catalog-list').textContent, /worker_connections/);
  // 本地查询之后 Agent 追问即使对象相同，也要重新派发并替换右侧（右侧已不再属于 Agent）。
  const published = publishedRelease();
  const object = { input: 'events { worker_connections 1024; }', mode: 'fragment', question: '默认值？', release: published };
  const agentUi = await start({ originalApp: true, api: request => request.path === '/api/run' ? reply(report({ knowledgeVersion: { release: published }, normalizedRequest: object, inputResolution: { action: 'config' } })) : undefined });
  await agentUi.submit();
  await until(() => agentUi.nodes.get('query-status').textContent.includes('已提取 2 项'));
  await agentUi.nodes.get('query-form').dispatchEvent({ type: 'submit', preventDefault() {} });
  await until(() => agentUi.nodes.get('query-status').textContent.includes('唯一匹配'));
  await agentUi.submit();
  await until(() => agentUi.nodes.get('query-status').textContent.includes('已提取 2 项'));
  assert.equal(turnsOf(agentUi).length, 2);
});

test('对话流：新会话、切换会话、删除当前会话完全清空对话流与右侧，恢复只显示当前对象', async () => {
  const published = publishedRelease();
  const otherId = '44444444-4444-4444-8444-444444444444';
  const listKey = `${storageKey}:list`;
  const subject = { input: 'events { worker_connections 1024; }', mode: 'fragment', question: '默认值？', release: published };
  const restored = { input: 'http { gzip on; }', mode: 'fragment', question: '功能？', release: published };
  const ui = await start({ originalApp: true, stored: sessionId, storedEntries: [[listKey, JSON.stringify([{ id: sessionId, title: '当前', updatedAt: Date.now() }, { id: otherId, title: '另一会话', updatedAt: Date.now() - 1000 }])]], api: request => {
    if (request.path === `/api/sessions/${otherId}`) return reply({ request: { message: 'gzip 的功能', release: published }, currentSubject: restored, messages: 2 });
    if (request.path === '/api/run') return reply(report({ knowledgeVersion: { release: published }, normalizedRequest: subject, inputResolution: { action: 'config' } }));
  } });
  const pending = async () => { await until(() => ui.nodes.get('query-status').textContent.includes('已提取 2 项')); };
  // 先产生两轮，右侧显示 worker_connections。
  await ui.change('configuration', '第一问'); await ui.submit(); await pending();
  await ui.change('configuration', '第二问'); await ui.submit();
  assert.equal(turnsOf(ui).length, 2);
  // 切换会话：对话流只剩恢复卡（不是完整历史），右侧换成恢复的对象。
  const otherRow = ui.nodes.get('agent-history-list').children.find(node => node.textContent.includes('另一会话'));
  await otherRow.children.find(node => node.textContent === '切换').dispatchEvent({ type: 'click' });
  assert.equal(turnsOf(ui).length, 1);
  assert.match(turnsOf(ui)[0].textContent, /会话已恢复.*不含历史轮次/);
  assert.doesNotMatch(ui.nodes.get('agent-result').textContent, /默认 512/);
  await until(() => ui.nodes.get('catalog-list').textContent.includes('gzip'));
  assert.doesNotMatch(ui.nodes.get('catalog-list').textContent, /worker_connections/);
  // 新会话：对话流与右侧都清空。
  await ui.click('agent-new');
  assert.equal(ui.nodes.get('agent-result').textContent, '');
  assert.doesNotMatch(ui.nodes.get('catalog-list').textContent, /gzip/);
  // 新会话后同一对象的提交必须重新替换右侧（不能被“已显示”误判跳过）。
  await ui.change('configuration', '再来'); await ui.submit(); await pending();
  assert.equal(turnsOf(ui).length, 1);
  assert.match(ui.nodes.get('catalog-list').textContent, /worker_connections/);
  // 删除当前会话：对话流与右侧清空。
  const current = ui.nodes.get('agent-history-list').children.find(node => node.className === 'is-current');
  await current.children.find(node => node.textContent === '删除').dispatchEvent({ type: 'click' });
  assert.equal(ui.nodes.get('agent-result').textContent, '');
  assert.doesNotMatch(ui.nodes.get('catalog-list').textContent, /worker_connections/);
});

test('对话流：失败、被拒绝或发布不一致的提交不留下空轮次卡', async () => {
  for (const reply_ of [reply({ error: '忙碌', code: 'busy' }, 409), reply({ error: '服务故障' }, 503), reply(report({ knowledgeVersion: { release: 'wrong-release' } }))]) {
    const ui = await start({ api: request => request.path === '/api/run' ? reply_ : undefined });
    await ui.submit();
    assert.equal(turnsOf(ui).length, 0);
  }
});

test('恢复会话时用户编辑输入导致放弃：状态栏写明原因，不停在“正在恢复”，输入保留', async () => {
  const held = deferred();
  const ui = await start({ stored: sessionId, api: request => request.path.startsWith('/api/sessions/') ? held.promise : undefined });
  const restoring = ui.click('agent-restore');
  await until(() => ui.requests.some(request => request.path.startsWith('/api/sessions/')));
  assert.match(ui.nodes.get('agent-status').textContent, /正在恢复/);
  await ui.change('configuration', '恢复期间编辑');
  held.resolve(reply({ request: { input: '旧输入', release }, messages: 5 })); await restoring;
  assert.match(ui.nodes.get('agent-status').textContent, /输入已变化，已放弃本次恢复回填/);
  assert.doesNotMatch(ui.nodes.get('agent-status').textContent, /正在恢复/);
  assert.equal(ui.nodes.get('configuration').value, '恢复期间编辑');
  assert.equal(ui.nodes.get('agent-restore').disabled, false);
});

test('恢复卡显示后端 restore 返回的 inputResolution.notice，只作为文本', async () => {
  const notice = '已按指令名 worker_connections 理解（原写法 Worker_Connections）。\n<img src=x onerror=alert(1)>';
  const ui = await start({ stored: sessionId, api: request => request.path.startsWith('/api/sessions/')
    ? reply({ request: { message: 'Worker_Connections 的默认值', release }, currentSubject: { input: 'worker_connections', mode: 'single', release }, inputResolution: { action: 'directive', notice }, messages: 2 }) : undefined });
  await ui.click('agent-restore');
  const card = turnsOf(ui)[0];
  assert.ok(card.textContent.includes(notice));
  assert.equal(descendants(card).find(node => node.textContent === notice)?.className, 'verification-notes');
  assert.ok(!descendants(card).some(node => ['img', 'script'].includes(node.tagName)));
  // 没有 notice 时不出现空说明段落。
  const plain = await start({ stored: sessionId });
  await plain.click('agent-restore');
  assert.ok(!descendants(plain.nodes.get('agent-result')).some(node => node.className === 'verification-notes' && node.textContent === ''));
});

test('轮次卡内的说明文字按换行分行显示（white-space: pre-line）', () => {
  const css = read('site/styles.css');
  assert.match(css, /\.agent-turn \.verification-notes\s*\{[^}]*white-space:\s*pre-line/);
});

// M1：不更新右侧的轮次（澄清、问候、范围外）不能撤销标注，右侧仍是更早的对象。
for (const [action, extra] of [['clarify', { state: 'awaiting_input', summary: undefined, modelSelection: null }], ['greeting', { summary: undefined, modelSelection: null }], ['out_of_scope', { summary: undefined, modelSelection: null }]]) {
  test(`对话流：对象 A 之后接一次 ${action}，输入与提交一致时右侧标注仍在；改回 A 的原文才撤销`, async () => {
    const published = publishedRelease();
    let run = 0;
    const ui = await start({ originalApp: true, api: request => request.path === '/api/run'
      ? reply(run++ === 0
        ? report({ knowledgeVersion: { release: published }, normalizedRequest: firstObject(published), inputResolution: { action: 'config' } })
        : report({ knowledgeVersion: { release: published }, normalizedRequest: null, questions: [], inputResolution: { action, message: '固定话术' }, ...extra })) : undefined });
    await ui.change('configuration', '第一问'); await ui.submit();
    await until(() => ui.nodes.get('query-status').textContent.includes('已提取 2 项'));
    assert.doesNotMatch(ui.nodes.get('query-status').textContent, PRIOR);
    await ui.change('configuration', '你好');
    assert.match(ui.nodes.get('query-status').textContent, PRIOR);
    await ui.submit();
    assert.match(turnsOf(ui)[1].textContent, /固定话术/);
    // 终态时输入框值 == 提交消息，但本轮没有更新右侧：标注必须保留，右侧结果不变。
    assert.match(ui.nodes.get('query-status').textContent, PRIOR);
    assert.match(ui.nodes.get('catalog-list').textContent, /worker_connections/);
    // O2：输入变化再改回“你好”仍保留；只有改回产生右侧对象的原文（第一问）才撤销，再改走又出现。
    await ui.change('configuration', '你好呀'); await ui.change('configuration', '你好');
    assert.match(ui.nodes.get('query-status').textContent, PRIOR);
    await ui.change('configuration', '第一问');
    assert.doesNotMatch(ui.nodes.get('query-status').textContent, PRIOR);
    await ui.change('configuration', '第一问？');
    assert.match(ui.nodes.get('query-status').textContent, PRIOR);
  });
}

// O1：Agent 对象没有被右侧采用（查询抛错 / 发布与页面索引不一致被忽略）后，已显示对象键失效，
// 同对象的下一次提交要重新派发，而不是停在“查询未完成”。
test('对话流：右侧 Agent 查询抛错后，同对象的下一次提交重新派发 agent-analysis', async () => {
  const published = publishedRelease();
  // 每次回复新建一个对象：module 的第 1 次读取来自 agent.mjs 的键计算，第 2 次来自页面 submit()，在那里抛错，走 runQuery 的 catch。
  const broken = () => { let reads = 0; return { input: 'worker_connections', mode: 'single', context: 'events', get module() { if (++reads === 2) throw new Error('模拟右侧查询抛错'); return ''; }, question: '默认值？', release: published, inputSource: 'message' }; };
  const ui = await start({ originalApp: true, api: request => request.path === '/api/run'
    ? reply(report({ knowledgeVersion: { release: published }, normalizedRequest: broken(), inputResolution: { action: 'config' } })) : undefined });
  const events = [];
  ui.nodes.get('configuration').addEventListener('agent-analysis', () => events.push('agent-analysis'));
  await ui.change('configuration', '第一问'); await ui.submit();
  await until(() => ui.nodes.get('query-status').textContent.includes('查询未完成'));
  assert.deepEqual(events, ['agent-analysis']);
  await ui.change('configuration', '同一对象的追问'); await ui.submit();
  assert.deepEqual(events, ['agent-analysis', 'agent-analysis']);
  assert.equal(turnsOf(ui).length, 2);
});

test('对话流：Agent 对象的发布与页面索引不一致被右侧忽略后，同对象的下一次提交重新派发', async () => {
  const published = publishedRelease();
  const object = { input: 'events { worker_connections 1024; }', mode: 'fragment', question: '默认值？', release: 'other-release', inputSource: 'message' };
  const ui = await start({ originalApp: true, api: request => request.path === '/api/run'
    ? reply(report({ knowledgeVersion: { release: published }, normalizedRequest: object, inputResolution: { action: 'config' } })) : undefined });
  const events = [];
  ui.nodes.get('configuration').addEventListener('agent-analysis', () => events.push('agent-analysis'));
  await ui.change('configuration', '第一问'); await ui.submit();
  await ui.change('configuration', '追问'); await ui.submit();
  assert.deepEqual(events, ['agent-analysis', 'agent-analysis']);
});

// ---------- 配置校验块 ----------
const NOT_CHECKED = ['参数个数与取值', '重复或冲突', '指令所需模块是否可用', 'include 文件、证书路径与变量是否存在'];
// 按固定契约构造 validation；overrides 可替换 checks 或其中某项，便于构造 fail/needs_input 与非法形状。
const makeValidation = (verdict, checks) => ({ verdict, checks: checks ?? [
  { id: 'syntax', title: '语法', status: 'pass', issues: [] },
  { id: 'directive_names', title: '指令名（区分大小写）', status: verdict === 'fail' ? 'fail' : 'pass', issues: verdict === 'fail' ? [{ line: 3, name: 'Worker_Connections', message: '未知指令 Worker_Connections', suggestions: ['worker_connections', 'worker_aio_requests'] }] : [] },
  { id: 'context', title: '上下文', status: verdict === 'needs_input' ? 'needs_input' : verdict === 'fail' ? 'skipped' : 'pass', issues: verdict === 'needs_input' ? [{ line: 5, name: 'listen', message: '缺少外层 http/server，无法确定上下文' }] : [] },
], notChecked: NOT_CHECKED });
const validationBlock = root => descendants(root).find(node => /^validation-block\b/.test(node.className ?? ''));
const runWith = async patch => {
  const ui = await start({ api: request => request.path === '/api/run' ? reply(report(patch)) : undefined });
  await ui.submit();
  return ui;
};

test('配置校验：三种 verdict 的标题、默认展开/折叠、逐项文字、脚注，且位于本轮其他内容之前', async () => {
  const cases = [['pass', '✓ 配置校验：通过', false], ['fail', '✗ 配置校验：未通过', true], ['needs_input', '… 配置校验：需要补充', true]];
  for (const [verdict, title, open] of cases) {
    const ui = await runWith({ validation: makeValidation(verdict), inputResolution: { action: 'config', message: '固定识别说明' }, normalizedRequest: { input: 'events { worker_connections 1; }', mode: 'fragment', release } });
    const body = turnsOf(ui)[0].children.find(node => node.className === 'turn-body');
    const block = validationBlock(ui.nodes.get('agent-result'));
    assert.ok(block, verdict);
    // 位置：本轮 body 的第一个子节点，先于识别说明、配置折叠块、统计与模型选取。
    assert.equal(body.children[0], block, verdict);
    assert.equal(block.open, open, verdict);
    const summary = block.children.find(node => node.tagName === 'summary');
    assert.equal(summary.textContent, title, verdict);
    const text = block.textContent;
    for (const expected of ['语法：通过', '指令名（区分大小写）：', '上下文：', `未校验：${NOT_CHECKED.join('、')}`]) assert.ok(text.includes(expected), `${verdict} ${expected}`);
    const content = body.textContent;
    assert.ok(content.indexOf('配置校验') < content.indexOf('固定识别说明') && content.indexOf('配置校验') < content.indexOf('默认 512'), verdict);
  }
  // 逐项状态文字：不通过 / 需要补充 / 未检查。
  const fail = await runWith({ validation: makeValidation('fail') });
  assert.ok(fail.nodes.get('agent-result').textContent.includes('指令名（区分大小写）：不通过'));
  assert.ok(fail.nodes.get('agent-result').textContent.includes('上下文：未检查'));
  const needs = await runWith({ validation: makeValidation('needs_input') });
  assert.ok(needs.nodes.get('agent-result').textContent.includes('上下文：需要补充'));
  // 没有 validation 时不出现该块。
  const none = await runWith({});
  assert.equal(validationBlock(none.nodes.get('agent-result')), undefined);
});

test('配置校验：fail 列出“第 N 行：message”与“正确写法”，需要补充列出缺失上下文', async () => {
  const noFacts = { modelSelection: { resolvedFacts: [], citations: [] } };
  const fail = await runWith({ ...noFacts, validation: makeValidation('fail') });
  const failText = fail.nodes.get('agent-result').textContent;
  assert.ok(failText.includes('第 3 行：未知指令 Worker_Connections'));
  assert.ok(failText.includes('正确写法：worker_connections、worker_aio_requests'));
  // 通过项与未检查项不列 issues；只有 fail 项下有“第 N 行”。
  assert.equal((failText.match(/第 \d+ 行：/g) ?? []).length, 1);
  const needs = await runWith({ ...noFacts, validation: makeValidation('needs_input') });
  assert.ok(needs.nodes.get('agent-result').textContent.includes('第 5 行：缺少外层 http/server，无法确定上下文'));
});

// 原因句只在后端确实跳过模型（metrics.gate.modelSkipped === true）、任务已结束且 verdict 为 fail 时显示。
const NO_FACTS = { modelSelection: { resolvedFacts: [], citations: [] } };
const CAUSE = '配置校验未通过，没有继续查询知识字段。';
const gateMetrics = (verdict, modelSkipped) => ({ modelRoundTrips: 0, totalMs: 5, finalOutputBytes: 0, gate: { verdict, modelSkipped } });
const anyCause = text => /没有继续查询知识字段/.test(text);

test('配置校验：fail 且后端跳过模型时显示原因句，并压掉“补充问题后重试”那句', async () => {
  const ui = await runWith({ ...NO_FACTS, validation: makeValidation('fail'), metrics: gateMetrics('fail', true) });
  const text = ui.nodes.get('agent-result').textContent;
  assert.ok(text.includes(CAUSE));
  assert.ok(!text.includes('本次没有可展示的模型选取') && !text.includes('补充问题后重试'));
  assert.ok(text.includes('第 3 行：未知指令 Worker_Connections'));
});

test('配置校验：fail 但没有 metrics.gate（老数据）不显示原因句，原有提示保留', async () => {
  for (const metrics of [undefined, { modelRoundTrips: 1, totalMs: 5, finalOutputBytes: 1 }, { gate: { verdict: 'fail', modelSkipped: false } }]) {
    const ui = await runWith({ ...NO_FACTS, validation: makeValidation('fail'), ...(metrics === undefined ? { metrics: undefined } : { metrics }) });
    const text = ui.nodes.get('agent-result').textContent;
    assert.ok(!anyCause(text), JSON.stringify(metrics));
    assert.ok(text.includes('本次没有可展示的模型选取'), JSON.stringify(metrics));
  }
});

test('配置校验：运行中不显示原因句（validation 已写入但选取尚空）', async () => {
  const held = deferred(); let polling = false;
  const running = report({ state: 'running', modelSelection: null, validation: makeValidation('fail'), metrics: gateMetrics('fail', true) });
  const ui = await start({ api: request => {
    if (request.path === '/api/run') return reply(running);
    if (request.path.startsWith('/api/jobs/')) { polling = true; return held.promise; }
  } });
  const done = ui.submit(); await until(() => polling);
  // 运行中：校验块已显示，原因句与“没有可展示的模型选取”都不出现。
  const during = ui.nodes.get('agent-result').textContent;
  assert.ok(validationBlock(ui.nodes.get('agent-result')));
  assert.ok(!anyCause(during) && !during.includes('本次没有可展示的模型选取'));
  // 终态且后端确实跳过模型后才出现。
  held.resolve(reply({ ...running, state: 'completed', ...NO_FACTS })); await done;
  assert.ok(ui.nodes.get('agent-result').textContent.includes(CAUSE));
});

test('配置校验：needs_input 不再有原因句（模型仍会调用），选取为空或 unsupported 也不写“没有继续查询”', async () => {
  const cases = [
    { ...NO_FACTS, metrics: gateMetrics('needs_input', false) },
    { modelSelection: { status: 'unsupported', resolvedFacts: [], citations: [] }, metrics: gateMetrics('needs_input', false) },
    // 即使数据自相矛盾地带了 modelSkipped:true，needs_input 也不显示。
    { ...NO_FACTS, metrics: gateMetrics('needs_input', true) },
  ];
  for (const patch of cases) {
    const ui = await runWith({ ...patch, validation: makeValidation('needs_input') });
    assert.ok(!anyCause(ui.nodes.get('agent-result').textContent), JSON.stringify(patch));
  }
  // verdict 为 pass 时同样不显示。
  const pass = await runWith({ ...NO_FACTS, validation: makeValidation('pass'), metrics: gateMetrics('pass', true) });
  assert.ok(!anyCause(pass.nodes.get('agent-result').textContent));
  // 已有模型事实时不显示。
  const withFacts = await runWith({ validation: makeValidation('fail'), metrics: gateMetrics('fail', true) });
  assert.ok(!anyCause(withFacts.nodes.get('agent-result').textContent));
});

test('配置校验：缺失或非法形状整块不显示，也不报错、不影响其余回答', async () => {
  const good = () => makeValidation('fail');
  const mutate = change => { const value = good(); change(value); return value; };
  const invalid = [
    '字符串', 42, ['数组'], { verdict: 'pass' }, // 非对象 / 缺 checks
    mutate(value => { value.checks = '不是数组'; }),
    mutate(value => { value.verdict = 'unknown'; }),
    mutate(value => { value.checks[0].status = 'weird'; }),
    mutate(value => { value.checks[0].title = ''; }),
    mutate(value => { value.checks[1].issues = '不是数组'; }),
    mutate(value => { value.checks[1].issues.push('不是对象'); }),
    mutate(value => { value.checks[1].issues.push(null); }),
    mutate(value => { value.checks[1].issues[0].line = 3.5; }),
    mutate(value => { value.checks[1].issues[0].line = '3'; }),
    mutate(value => { value.checks[1].issues[0].message = 7; }),
    mutate(value => { value.checks[1].issues[0].suggestions = 'worker_connections'; }),
    mutate(value => { value.checks[1].issues[0].suggestions = [1]; }),
    mutate(value => { value.notChecked = '不是数组'; }),
  ];
  for (const validation of invalid) {
    const ui = await runWith({ validation, modelSelection: { resolvedFacts: [], citations: [] } });
    const text = ui.nodes.get('agent-result').textContent;
    assert.equal(validationBlock(ui.nodes.get('agent-result')), undefined, JSON.stringify(validation));
    assert.ok(!text.includes('配置校验') && !text.includes('没有继续查询知识字段'), JSON.stringify(validation));
    assert.equal(turnsOf(ui).length, 1);
    assert.match(ui.nodes.get('agent-status').textContent, /完成/);
  }
});

test('配置校验：message/title/suggestions 只作为文本，不生成元素', async () => {
  const attack = '<img src=x onerror=alert(1)>';
  const validation = makeValidation('fail', [{ id: 'directive_names', title: `指令名${attack}`, status: 'fail', issues: [{ line: 1, name: 'x', message: attack, suggestions: [attack] }] }]);
  const ui = await runWith({ validation });
  const result = ui.nodes.get('agent-result');
  assert.ok(result.textContent.includes(`第 1 行：${attack}`) && result.textContent.includes(`正确写法：${attack}`) && result.textContent.includes(`指令名${attack}`));
  assert.ok(!descendants(result).some(node => ['img', 'script'].includes(node.tagName)));
});

test('配置校验：每项检查最多渲染 20 条 issues，超出只提示数量', async () => {
  const issues = Array.from({ length: 25 }, (_, index) => ({ line: index + 1, name: 'x', message: `问题${index + 1}` }));
  const ui = await runWith({ validation: makeValidation('fail', [{ id: 'syntax', title: '语法', status: 'fail', issues }]) });
  const list = descendants(ui.nodes.get('agent-result')).find(node => node.className === 'validation-issues');
  assert.equal(list.children.length, 21);
  const text = ui.nodes.get('agent-result').textContent;
  assert.ok(text.includes('第 20 行：问题20') && !text.includes('问题21'));
  assert.ok(text.includes('另有 5 条未显示'));
});

test('配置校验：会话恢复卡显示后端 restore 返回的 validation，缺失或非法则不显示', async () => {
  const restoreWith = async validation => {
    const ui = await start({ stored: sessionId, api: request => request.path.startsWith('/api/sessions/')
      ? reply({ request: { message: 'worker_connections', release }, currentSubject: { input: 'worker_connections', mode: 'single', release }, inputResolution: { action: 'directive', notice: '恢复说明' }, ...(validation === undefined ? {} : { validation }), messages: 2 }) : undefined });
    await ui.click('agent-restore');
    return ui;
  };
  const shown = await restoreWith(makeValidation('fail'));
  const body = turnsOf(shown)[0].children.find(node => node.className === 'turn-body');
  const block = validationBlock(shown.nodes.get('agent-result'));
  assert.ok(block);
  // 位于恢复卡最前面（先于恢复说明与配置折叠块），未通过默认展开。
  assert.equal(body.children[0], block);
  assert.equal(block.open, true);
  assert.ok(block.textContent.includes('正确写法：worker_connections、worker_aio_requests'));
  // 恢复数据没有 metrics.gate，恢复卡不写“没有继续查询知识字段”。
  assert.ok(!anyCause(shown.nodes.get('agent-result').textContent));
  for (const validation of [undefined, null, '字符串', { verdict: 'fail', checks: 'x' }]) {
    const ui = await restoreWith(validation);
    assert.equal(validationBlock(ui.nodes.get('agent-result')), undefined);
    assert.ok(turnsOf(ui)[0].textContent.includes('恢复说明'));
  }
});
