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
// 假 DOM 要能跑真实的 agent.mjs：类名切换、查询、滚动和焦点都记下，缺 IntersectionObserver 时由页面自己跳过。
class ClassList {
  constructor(node) { this.node = node; }
  tokens() { return String(this.node.className || '').split(/\s+/).filter(Boolean); }
  contains(name) { return this.tokens().includes(name); }
  add(...names) { const set = new Set(this.tokens()); for (const name of names) if (name) set.add(name); this.node.className = [...set].join(' '); }
  remove(...names) { const drop = new Set(names); this.node.className = this.tokens().filter(token => !drop.has(token)).join(' '); }
  toggle(name, force) { const next = force === undefined ? !this.contains(name) : Boolean(force); if (next) this.add(name); else this.remove(name); return next; }
}
const matchesSelector = (node, selector) => selector.startsWith('.') && (node.className || '').split(/\s+/).includes(selector.slice(1));
class Node {
  constructor(tag = 'div') {
    this.tagName = String(tag).toUpperCase(); this.children = []; this.dataset = {}; this.events = {};
    this.value = ''; this.disabled = false; this.hidden = false; this.checked = false;
    this.attributes = {}; this.className = ''; this.classList = new ClassList(this);
    this.parentNode = null; this.id = ''; this.style = {}; this.tabIndex = 0;
  }
  set textContent(value) { for (const child of this.children) child.parentNode = null; this.text = String(value); this.children = []; }
  get textContent() { return (this.text ?? '') + this.children.map(child => child.textContent).join(''); }
  append(...nodes) {
    for (const node of nodes) {
      if (node?.parentNode) node.parentNode.children = node.parentNode.children.filter(child => child !== node);
      if (node) node.parentNode = this;
      this.children.push(node);
    }
  }
  replaceChildren(...nodes) { for (const child of this.children) child.parentNode = null; this.text = ''; this.children = []; this.append(...nodes); }
  setAttribute(name, value) { this.attributes[name] = String(value); if (name === 'id') this.id = String(value); }
  getAttribute(name) { return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null; }
  removeAttribute(name) { delete this.attributes[name]; }
  addEventListener(name, handler) { (this.events[name] ??= []).push(handler); }
  // 与真实 DOM 一致：按函数引用移除监听，抽屉取消待执行收起时要靠它拆掉 transitionend 监听。
  removeEventListener(name, handler) { this.events[name] = (this.events[name] ?? []).filter(item => item !== handler); }
  dispatchEvent(event) { return Promise.all((this.events[event.type] ?? []).map(handler => handler(event))); }
  focus() { this.focused = true; if (this.ownerDocument) this.ownerDocument.activeElement = this; }
  scrollIntoView(options) { this.scrollIntoViewArgs = options ?? {}; }
  querySelectorAll(selector) {
    const out = [];
    const visit = node => { for (const child of node.children ?? []) { if (matchesSelector(child, selector)) out.push(child); visit(child); } };
    visit(this);
    return out;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
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
async function start({ api, stored = '', storedEntries = [], originalApp = false, initialRelease = release, basePath = '/', sessions = [], intersectionObserver, globals = {}, clock = null } = {}) {
  const requests = []; const observers = [];
  const nodes = new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(match => [match[1], new Node()]));
  nodes.get('agent-panel').dataset.probeTimeoutMs = '1000';
  nodes.get('input-mode').value = 'single'; nodes.get('result-filter').value = 'all';
  nodes.get('configuration').value = 'worker_connections'; nodes.get('query-context').value = 'events';
  const body = new Node('body');
  body.dataset = new Proxy({ ...(initialRelease ? { release: initialRelease } : {}) }, { set(target, key, value) { target[key] = value; queueMicrotask(() => observers.forEach(callback => callback())); return true; } });
  const listeners = new Map();
  const document = { body, activeElement: null, getElementById: id => nodes.get(id), createElement: tag => { const node = new Node(tag); node.ownerDocument = document; return node; },
    addEventListener: (type, handler) => { const list = listeners.get(type) ?? []; list.push(handler); listeners.set(type, list); },
    removeEventListener: (type, handler) => listeners.set(type, (listeners.get(type) ?? []).filter(item => item !== handler)),
    dispatchEvent: event => { for (const handler of listeners.get(event.type) ?? []) handler(event); return true; } };
  for (const node of nodes.values()) node.ownerDocument = document;
  body.ownerDocument = document;
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
      // 服务端历史会话列表：每次请求时现取，测试可在运行中改动返回内容。
      if (localPath === '/api/sessions') return reply({ sessions: typeof sessions === 'function' ? sessions() : sessions });
      if (localPath === '/api/cancel') return reply({ state: 'cancelled' });
      if (localPath.startsWith('/api/jobs/')) return reply(report());
      return reply({ request: { input: 'multi_accept off;', mode: 'single', context: 'events', module: 'ngx_event_core_module', question: '继承？', release }, messages: 4 });
    }
    return reply(JSON.parse(read(`dist/${path.slice(basePath.length)}`)));
  };
  const sandbox = { document, fetch: fetcher, localStorage: { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value), removeItem: key => saved.delete(key) },
    MutationObserver: class { constructor(callback) { this.callback = callback; } observe() { observers.push(this.callback); } },
    location: { href: `http://site.test${basePath}index.html`, search: '' }, URL, URLSearchParams, AbortController, AbortSignal, Event, CustomEvent, setTimeout, clearTimeout, queueMicrotask };
  if (intersectionObserver) sandbox.IntersectionObserver = intersectionObserver;
  // 可控时钟（会话列表节流测试用）：只替换 Date.now，页面里的 new Date(...) 仍是真实 Date；测试通过推进 clock.now 决定“是否已满 1 秒”。
  if (clock) sandbox.Date = class extends Date { static now() { return clock.now; } };
  // 额外的浏览器全局（matchMedia、getComputedStyle 等），按用例需要注入。
  Object.assign(sandbox, globals);
  Object.assign(sandbox, core, knowledge, source, results, { createKnowledgeClient: options => knowledge.createKnowledgeClient({ ...options, fetcher }) });
  const context = vm.createContext(sandbox);
  // 选择模块和页面跑在同一个 vm 里，选中状态才能两边共用。import 行在下面会被剥掉。
  vm.runInContext(read('site/selection.mjs').replace(/^export /gm, ''), context);
  vm.runInContext(read('site/analysis-state.mjs').replace(/^export /gm, '').replace(/^import .*;\n/gm, ''), context);
  vm.runInContext(agent.replace(/^import .*;\n/gm, '').replaceAll('import.meta.url', JSON.stringify(`http://site.test${basePath}agent.mjs`)), context);
  if (originalApp) await vm.runInContext(read('site/app.mjs').replace(/^import .*;\n/gm, '').replaceAll('import.meta.url', JSON.stringify(`http://site.test${basePath}app.mjs`)), context);
  await tick();
  const click = id => nodes.get(id).dispatchEvent({ type: 'click', preventDefault() {} });
  const change = async (id, value) => { nodes.get(id).value = value; await nodes.get(id).dispatchEvent({ type: ['input-mode', 'query-context', 'query-module'].includes(id) ? 'change' : 'input', preventDefault() {} }); };
  // 在页面脚本的同一个上下文里求值：用于读取识别数据层、监听器等页面内部状态。
  const page = code => vm.runInContext(code, context);
  return { nodes, document, requests, saved, click, change, page, listeners, submit: () => nodes.get('agent-form').dispatchEvent({ type: 'submit', preventDefault() {} }) };
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
  // 只有连接探测与连接后的列表拉取两个 GET，没有任何提交。
  assert.deepEqual(ui.requests.map(request => request.path), ['/api/status', '/api/sessions']); assert.ok(ui.requests.every(request => request.method === 'GET' && request.body === undefined));
  await ui.change('query-module', 'ngx_event_core_module');
  assert.equal(ui.requests.length, 2);
  await ui.submit();
  const sent = ui.requests.find(request => request.path === '/api/run');
  assert.deepEqual(sent.body.request, { message: 'worker_connections', release });
  assert.equal(ui.saved.get(storageKey), sessionId);
  // 列表不再写本地键，改由服务端提供；提交被接受后会刷新一次。
  assert.equal(ui.saved.has(`${storageKey}:list`), false);
  assert.ok(ui.requests.filter(request => request.path === '/api/sessions').length >= 2);
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
  const links = descendants(ui.nodes.get('agent-result')).filter(node => node.tagName === 'A').map(node => new URL(node.href));
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
  assert.ok(!descendants(ui.nodes.get('agent-result')).some(node => ['IMG', 'SCRIPT'].includes(node.tagName)));
  // 协议检查是 every 断言：先确认确有链接，否则空集合会让它无条件通过。
  assert.ok(descendants(ui.nodes.get('agent-result')).some(node => node.tagName === 'A'), '应渲染固定来源链接');
  assert.ok(descendants(ui.nodes.get('agent-result')).filter(node => node.tagName === 'A').every(node => /^https?:/.test(node.href)));
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
  assert.match(ui.nodes.get('input-tree').textContent, /worker_connections/);
  assert.doesNotMatch(ui.nodes.get('input-tree').textContent, /lua_load_resty_core/);
  await ui.click('agent-new');
  assert.doesNotMatch(ui.nodes.get('input-tree').textContent, /worker_connections/);
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
  await until(() => polling && ui.nodes.get('input-tree').textContent.includes('worker_connections'));
  await ui.click('agent-cancel');
  held.resolve(reply(report())); await done;
  assert.doesNotMatch(ui.nodes.get('input-tree').textContent, /worker_connections/);
  assert.equal(ui.nodes.get('input-tree').children.length, 0);
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
  assert.match(ui.nodes.get('input-tree').textContent, /worker_connections/);
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
  const previews = () => descendants(ui.nodes.get('agent-result')).filter(node => node.tagName === 'PRE').map(node => node.textContent);
  assert.deepEqual(previews(), ['worker_connections']);
  await until(() => ui.nodes.get('input-tree').textContent.includes('worker_connections'));
  assert.doesNotMatch(ui.nodes.get('input-tree').textContent, /multi_accept/);
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
  const links = descendants(standalone.nodes.get('agent-result')).filter(node => node.tagName === 'A').map(node => new URL(node.href));
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
  assert.ok(descendants(ui.nodes.get('agent-status')).some(node => node.tagName === 'A' && node.href === 'http://site.test/login'));
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
  assert.deepEqual(ui.requests.slice(before).map(request => request.path).filter(path => path !== '/api/sessions'), ['/api/status', `/api/jobs/${requestId}`, `/api/sessions/${sessionId}`]);
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
  assert.deepEqual(ui.requests.slice(before).map(request => request.path).filter(path => path !== '/api/sessions'), ['/api/status', `/api/jobs/${requestId}`, `/api/sessions/${sessionId}`]);
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
  const badges = root => descendants(root).filter(node => node.tagName === 'SPAN' && /fact-status/.test(node.className ?? ''));
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

test('inputResolution.notice 与被省略的外部参考都以文本显示固定文案；列表标题由服务端计算，前端不再起标题', async () => {
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
  // 前端不再自己起标题、也不写本地列表键；也没有“已按 X 理解”之类的说明。
  assert.equal(ui.saved.has(`${storageKey}:list`), false);
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
  assert.equal(title.tagName, 'A');
  assert.equal(title.href, refs[0].url);
  assert.equal(title.target, '_blank');
  assert.equal(title.rel, 'noopener noreferrer');
  assert.ok(descendants(block).some(node => node.className === 'external-ref-site' && node.textContent === 'nginx.org'));
  assert.ok(descendants(block).some(node => node.tagName === 'BLOCKQUOTE' && node.textContent === refs[0].quote));
  assert.ok(!descendants(result).some(node => ['IMG', 'SCRIPT'].includes(node.tagName)));
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
    assert.notEqual(el.tagName, 'A', label);
  }
  assert.ok(!descendants(block).some(node => typeof node.href === 'string' && /^(javascript|http:)/.test(node.href)));
});

test('外部参考：恶意标题以文本显示，不生成元素', async () => {
  const malicious = '<img src=x onerror=alert(1)>';
  const ui = await start({ api: request => request.path === '/api/run' ? reply(report({ webReferences: [{ ...refs[0], title: malicious }] })) : undefined });
  await ui.submit();
  const result = ui.nodes.get('agent-result');
  assert.ok(result.textContent.includes(malicious));
  assert.ok(!descendants(result).some(node => ['IMG', 'SCRIPT'].includes(node.tagName)));
  assert.equal(descendants(result).find(node => node.textContent === malicious).tagName, 'A');
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
    assert.equal(el.tagName, 'SPAN', label);
    assert.equal(el.href, undefined, label);
  }
});

test('外部参考：引文为空时不渲染 blockquote，标题与站点仍显示', async () => {
  const ui = await start({ api: request => request.path === '/api/run' ? reply(report({ webReferences: [{ ...refs[0], quote: '' }] })) : undefined });
  await ui.submit();
  const block = referenceBlock(ui.nodes.get('agent-result'));
  assert.ok(block);
  assert.ok(!descendants(block).some(node => node.tagName === 'BLOCKQUOTE'));
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

const otherId = '44444444-4444-4444-8444-444444444444';
const listOf = page => page.nodes.get('agent-history-list');
const listRequests = page => page.requests.filter(request => request.method === 'GET' && request.path === '/api/sessions').length;
const buttonsIn = (root, label) => descendants(root).filter(node => node.tagName === 'BUTTON' && node.textContent === label);
const item = (id, title, updatedAt = Date.now()) => ({ id, title, updatedAt });

test('历史会话（服务端）：连接后渲染、高亮当前会话、不再写 :list 键且加载时清理旧键', async () => {
  const ui = await start({ stored: sessionId, storedEntries: [[`${storageKey}:list`, '[{"stale":1}]']], sessions: [item(sessionId, '当前会话'), item(otherId, '另一会话', Date.now() - 1000)] });
  await until(() => listOf(ui).children.length === 2);
  // 旧版本留下的本地列表键被清掉；当前会话 ID 键不动。
  assert.equal(ui.saved.has(`${storageKey}:list`), false);
  assert.equal(ui.saved.get(storageKey), sessionId);
  const rows = listOf(ui).children;
  assert.equal(rows[0].className, 'is-current'); assert.notEqual(rows[1].className, 'is-current');
  assert.ok(rows[0].textContent.includes('当前会话') && rows[1].textContent.includes('另一会话'));
  // 提交、恢复等操作之后也不会写回本地列表键。
  await ui.submit();
  assert.equal(ui.saved.has(`${storageKey}:list`), false);
  // HTML 里有一句共用说明。
  assert.match(html, /列表由服务端保存，所有访问者共用/);
});

test('历史会话（服务端）：提交、任务完成、删除、展开都会刷新列表', async () => {
  let current = [item(otherId, '第一版')];
  // 展开历史会话受 1 秒节流：用可控时钟，在需要刷新的展开前推进 2 秒。
  const clock = { now: 1000000 };
  const ui = await start({ clock, stored: sessionId, sessions: () => current, api: request => request.method === 'DELETE' ? reply({}) : undefined });
  await until(() => listOf(ui).children.length === 1);
  // 提交：服务端接受后刷新，任务结束后再刷新，至少多出两次请求。
  current = [item(sessionId, '新会话'), item(otherId, '第一版')];
  let before = listRequests(ui);
  await ui.submit();
  await until(() => listOf(ui).children.length === 2);
  assert.ok(listRequests(ui) - before >= 2);
  // 展开：其他访问者新建的会话在展开时出现；折叠不请求。
  const third = '55555555-5555-4555-8555-555555555555';
  current = [item(third, '别人建的'), ...current];
  before = listRequests(ui);
  ui.nodes.get('agent-history').open = false;
  await ui.nodes.get('agent-history').dispatchEvent({ type: 'toggle' });
  assert.equal(listRequests(ui), before);
  clock.now += 2000;
  ui.nodes.get('agent-history').open = true;
  await ui.nodes.get('agent-history').dispatchEvent({ type: 'toggle' });
  await until(() => listOf(ui).children.length === 3);
  // 删除成功后刷新。
  current = [item(third, '别人建的'), item(sessionId, '新会话')];
  before = listRequests(ui);
  const row = listOf(ui).children.find(node => node.textContent.includes('第一版'));
  await buttonsIn(row, '删除')[0].dispatchEvent({ type: 'click' });
  assert.ok(ui.requests.some(request => request.method === 'DELETE' && request.path === `/api/sessions/${otherId}`));
  await until(() => listOf(ui).children.length === 2);
  assert.ok(listRequests(ui) > before);
});

test('历史会话（服务端）：非法条目丢弃、整表形状非法为空、标题截断且只走文本', async () => {
  const malicious = '<img src=x onerror=alert(1)>';
  const long = '字'.repeat(150);
  const emoji = '😀'.repeat(120); // 码点截断：不能切出半个代理对
  const ui = await start({ api: request => request.path === '/api/sessions' ? reply({ sessions: [
    item(sessionId, malicious), item(otherId, long), item('55555555-5555-4555-8555-555555555555', emoji),
    { id: 'bad', title: 'x', updatedAt: 1 }, { id: otherId, title: 1, updatedAt: 1 }, { id: otherId, title: 'x', updatedAt: '1' },
    { id: otherId, title: 'x', updatedAt: Infinity }, null, 'str', [],
  ] }) : undefined });
  await until(() => listOf(ui).children.length === 3);
  const text = listOf(ui).textContent;
  assert.ok(text.includes(malicious));
  assert.ok(!descendants(listOf(ui)).some(node => node.tagName === 'IMG'));
  const titles = descendants(listOf(ui)).filter(node => node.className === 'session-title').map(node => node.textContent);
  assert.ok(titles.includes(long.slice(0, 100)));
  assert.ok(titles.includes('😀'.repeat(100)));
  // 超过 50 条只显示 50 条。
  const many = await start({ sessions: Array.from({ length: 60 }, (_, index) => item(`00000000-0000-4000-8000-${String(index).padStart(12, '0')}`, `会话${index}`, 1000 + index)) });
  await until(() => listOf(many).children.length === 50);
  // 整表形状非法（顶层数组 / sessions 不是数组）一律为空列表。
  // 先有一份合法列表，再让下一次刷新返回非法形状：必须清空，而不是沿用旧表（沿用只用于“请求失败”）。
  const clock = { now: 1000000 }; // 展开受节流：每次展开前推进 2 秒，保证这次展开真的刷新。
  for (const bad of [[], { sessions: 'x' }, { sessions: { 0: 1 } }, null, 'oops']) {
    let payload = { sessions: [item(sessionId, '旧')] };
    const broken = await start({ clock, api: request => request.path === '/api/sessions' ? reply(payload) : undefined });
    await until(() => listOf(broken).children.length === 1);
    payload = bad;
    clock.now += 2000;
    broken.nodes.get('agent-history').open = true;
    await broken.nodes.get('agent-history').dispatchEvent({ type: 'toggle' });
    await until(() => listOf(broken).children.length === 0);
  }
});

test('历史会话（服务端）：刷新失败保留旧列表且不弹错误；过期响应不覆盖新响应', async () => {
  let fail = false; const gates = [];
  let current = [item(sessionId, '旧列表')];
  const clock = { now: 1000000 }; // 展开受节流：需要刷新的展开前推进时钟。
  const ui = await start({ clock, api: request => {
    if (request.path !== '/api/sessions') return undefined;
    if (fail) return reply({ error: '坏了' }, 500);
    const snapshot = current;
    if (gates.length) { const gate = gates.shift(); return gate.promise.then(() => reply({ sessions: snapshot })); }
    return reply({ sessions: snapshot });
  } });
  await until(() => listOf(ui).children.length === 1);
  const statusBefore = ui.nodes.get('agent-status').textContent;
  // 失败（HTTP 500 / 网络异常）：旧列表还在，状态栏不变，也不标红。
  fail = true;
  clock.now += 2000;
  ui.nodes.get('agent-history').open = true;
  await ui.nodes.get('agent-history').dispatchEvent({ type: 'toggle' }); await tick();
  assert.equal(listOf(ui).children.length, 1);
  assert.equal(ui.nodes.get('agent-status').textContent, statusBefore);
  fail = false;
  // 乱序：先发出的请求（旧数据）后返回，不能覆盖后发出的请求（新数据）。
  const slow = deferred(); const fast = deferred();
  gates.push(slow, fast);
  current = [item(sessionId, '旧数据')];
  clock.now += 2000;
  const first = ui.nodes.get('agent-history').dispatchEvent({ type: 'toggle' });
  await tick();
  current = [item(sessionId, '新数据'), item(otherId, '新增')];
  // 第二个请求改由“重新检测服务”发出：它是强制刷新，不走节流也不复用在途请求，两次请求才会真正并发。
  const listCount = () => ui.requests.filter(request => request.method === 'GET' && request.path === '/api/sessions').length;
  const countBeforeSecond = listCount();
  const second = ui.click('agent-retry');
  await until(() => listCount() === countBeforeSecond + 1);
  fast.resolve(); await second; await until(() => listOf(ui).children.length === 2);
  slow.resolve(); await first; await tick(); await tick();
  assert.equal(listOf(ui).children.length, 2);
  assert.ok(listOf(ui).textContent.includes('新数据') && !listOf(ui).textContent.includes('旧数据'));
});

test('历史会话（服务端）：剩余天数按保留期显示；忙碌时切换/删除禁用', async () => {
  const baseStatus = { mode: 'mock', unifiedInput: true, model: 'test', siteBase: 'http://site.test/', pollIntervalMs: 2, requestTimeoutMs: 1000, retentionEnabled: true, sessionTtlMs: 259200000 };
  const held = deferred();
  const ui = await start({ sessions: [item(sessionId, '当前')], api: request => {
    if (request.path === '/api/status') return reply(baseStatus);
    if (request.path === '/api/run') return reply(report({ state: 'running', modelSelection: null }));
    if (request.path.startsWith('/api/jobs/')) return held.promise;
  } });
  await until(() => listOf(ui).children.length === 1);
  assert.match(listOf(ui).textContent, /剩余 3 天/);
  assert.doesNotMatch(listOf(ui).textContent, /已过期|移除/);
  const pending = ui.submit();
  await until(() => ui.nodes.get('agent-submit').disabled);
  assert.equal(buttonsIn(listOf(ui), '切换')[0].disabled, true);
  assert.equal(buttonsIn(listOf(ui), '删除')[0].disabled, true);
  held.resolve(reply(report()));
  await pending;
});

test('历史会话（服务端）：切换失败回滚旧会话，切换成功更新当前会话，删除当前会话清空结果', async () => {
  const sessions = [item(sessionId, '当前'), item(otherId, '另一会话', Date.now() - 1000)];
  const switched = await start({ stored: sessionId, sessions, api: request => request.path === `/api/sessions/${otherId}` ? reply({ error: '服务故障', code: 'request_failed' }, 500) : undefined });
  await until(() => listOf(switched).children.length === 2);
  const otherRow = listOf(switched).children.find(node => node.textContent.includes('另一会话'));
  await buttonsIn(otherRow, '切换')[0].dispatchEvent({ type: 'click' });
  assert.equal(switched.saved.get(storageKey), sessionId);
  assert.match(switched.nodes.get('agent-status').textContent, /恢复未完成/);
  const removed = await start({ sessions: [item(sessionId, '当前')], api: request => request.method === 'DELETE' ? reply({}) : undefined });
  await removed.submit();
  assert.match(removed.nodes.get('agent-result').textContent, /默认 512/);
  await until(() => listOf(removed).children.some(node => node.className === 'is-current'));
  const currentRow = listOf(removed).children.find(node => node.className === 'is-current');
  await buttonsIn(currentRow, '删除')[0].dispatchEvent({ type: 'click' });
  assert.equal(removed.nodes.get('agent-result').textContent, '');
  assert.match(removed.nodes.get('agent-status').textContent, /已删除当前会话/);
  assert.equal(removed.saved.has(storageKey), false);
});

test('历史会话（服务端）：恢复遇 session_unavailable 清除当前会话并刷新；登录失效走登录流程', async () => {
  // 恢复 404：当前会话 ID 被清除，列表重新拉取（服务端已不含该项）。
  let current = [item(sessionId, '将过期')];
  const ui = await start({ stored: sessionId, sessions: () => current, api: request => request.path === `/api/sessions/${sessionId}` ? reply({ error: '会话已过期', code: 'session_unavailable' }, 404) : undefined });
  await until(() => listOf(ui).children.length === 1);
  current = [];
  const before = listRequests(ui);
  await ui.click('agent-restore');
  assert.equal(ui.saved.has(storageKey), false);
  assert.match(ui.nodes.get('agent-status').textContent, /会话已过期/);
  await until(() => listOf(ui).children.length === 0);
  assert.ok(listRequests(ui) > before);
  // 刷新时 401：进入登录流程，提示重新登录。
  let loggedIn = true;
  const authClock = { now: 1000000 };
  const auth = await start({ clock: authClock, sessions: [item(sessionId, 'x')], api: request => request.path === '/api/sessions' && !loggedIn ? { ok: false, status: 401, json: async () => { throw new Error('html'); } } : undefined });
  await until(() => listOf(auth).children.length === 1);
  loggedIn = false;
  authClock.now += 2000;
  auth.nodes.get('agent-history').open = true;
  await auth.nodes.get('agent-history').dispatchEvent({ type: 'toggle' }); await tick();
  assert.match(auth.nodes.get('agent-environment').textContent, /重新登录/);
  assert.match(auth.nodes.get('agent-status').textContent, /登录已失效/);
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
// 轮次面板仍是 #agent-result 的直接子节点；摘要和“第 N 轮”在上方标签上，不在面板里。
const turnsOf = ui => ui.nodes.get('agent-result').children.filter(node => (node.className || '').split(/\s+/).includes('agent-turn'));
const tabsOf = ui => [...ui.nodes.get('agent-turn-tabs').children];
const tabFor = (ui, turn) => tabsOf(ui).find(tab => tab.getAttribute('aria-controls') === turn.id);
const turnSummary = (ui, turn) => descendants(tabFor(ui, turn) ?? turn).find(node => (node.className || '').split(/\s+/).includes('turn-summary'))?.textContent;
const turnNo = tab => descendants(tab).find(node => node.className === 'turn-no')?.textContent;
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
  assert.equal(cards.length, 1);
  assert.equal(cards[0].hidden, false);
  assert.equal(tabFor(ui, cards[0]).getAttribute('aria-selected'), 'true');
  await ui.change('configuration', '第二问 继承'); await ui.submit();
  cards = turnsOf(ui);
  assert.equal(cards.length, 2);
  // 旧轮留在 DOM 里但不可见，新轮被选中。aria-selected 与 hidden 必须一致。
  assert.deepEqual(cards.map(card => card.hidden), [true, false]);
  assert.deepEqual(tabsOf(ui).map(tab => tab.getAttribute('aria-selected')), ['false', 'true']);
  assert.deepEqual(tabsOf(ui).map(tab => tab.getAttribute('aria-controls')), cards.map(card => card.id));
  assert.deepEqual(cards.map(card => turnSummary(ui, card)), ['第一问 worker_connections', '第二问 继承']);
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
  assert.equal(turnSummary(ui, cards[0]), '问题 3'); assert.equal(turnSummary(ui, cards.at(-1)), '问题 22');
  assert.equal(turnNo(tabFor(ui, cards[0])), '第 3 轮'); assert.equal(turnNo(tabFor(ui, cards.at(-1))), '第 22 轮');
  assert.deepEqual(cards.map(card => card.hidden), [...Array(19).fill(true), false]);
  assert.equal(tabFor(ui, cards.at(-1)).getAttribute('aria-selected'), 'true');
  assert.equal(tabsOf(ui).filter(tab => tab.getAttribute('aria-selected') === 'true').length, 1);
  // 长输入只取首个非空行并截断到 60 个字符；含 HTML/script 的用户文本只作为文本。
  const attack = `\n  <script>alert(1)</script><img src=x onerror=alert(1)>${'长'.repeat(80)}\n第二行不进摘要`;
  await ui.change('configuration', attack); await ui.submit();
  const last = turnsOf(ui).at(-1);
  const summary = turnSummary(ui, last);
  assert.equal(Array.from(summary).length, 61);
  assert.ok(summary.startsWith('<script>alert(1)</script><img src=x onerror=alert(1)>') && summary.endsWith('…'));
  assert.ok(!summary.includes('第二行'));
  assert.ok(!descendants(ui.nodes.get('agent-result')).some(node => ['IMG', 'SCRIPT'].includes(node.tagName)));
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
  const treeAfterFirst = ui.nodes.get('input-tree').textContent;
  assert.match(treeAfterFirst, /worker_connections/);
  // 追问输入：右侧不清除，只加中性标注。
  await ui.change('configuration', '那继承呢？');
  assert.equal(ui.nodes.get('input-tree').textContent, treeAfterFirst);
  assert.match(ui.nodes.get('query-status').textContent, PRIOR);
  assert.match(ui.nodes.get('agent-result').textContent, /默认 512/);
  // 提交追问：对象实际内容相同，不再派发 agent-analysis；右侧不变，输入与提交一致故标注撤销。
  await ui.submit();
  assert.deepEqual(events, ['agent-analysis']);
  assert.equal(turnsOf(ui).length, 2);
  assert.equal(ui.nodes.get('input-tree').textContent, treeAfterFirst);
  assert.doesNotMatch(ui.nodes.get('query-status').textContent, PRIOR);
  assert.match(ui.nodes.get('query-status').textContent, /已提取 2 项/);
  // input 变了才替换右侧；旧轮卡仍保留。
  await ui.change('configuration', '换成 gzip'); await ui.submit();
  assert.equal(events.length, 2);
  await until(() => ui.nodes.get('input-tree').textContent.includes('gzip'));
  assert.doesNotMatch(ui.nodes.get('input-tree').textContent, /worker_connections/);
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
  await until(() => ui.nodes.get('input-tree').textContent.includes('gzip'));
  assert.match(ui.nodes.get('query-status').textContent, PRIOR);
  // 提交的消息与输入框一致时没有标注。
  await ui.change('configuration', '第四问'); gate = null; await ui.submit();
  assert.doesNotMatch(ui.nodes.get('query-status').textContent, PRIOR);
});

test('对话流：本地解析结果在输入变化后仍被清除，不会显示为当前输入的结果', async () => {
  const ui = await start({ originalApp: true });
  await ui.nodes.get('query-form').dispatchEvent({ type: 'submit', preventDefault() {} });
  assert.match(ui.nodes.get('query-status').textContent, /唯一匹配/);
  assert.match(ui.nodes.get('input-tree').textContent, /worker_connections/);
  await ui.change('configuration', 'gzip');
  assert.match(ui.nodes.get('query-status').textContent, /输入已变化，请重新查询/);
  assert.doesNotMatch(ui.nodes.get('query-status').textContent, /唯一匹配/);
  assert.doesNotMatch(ui.nodes.get('input-tree').textContent, /worker_connections/);
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
  const subject = { input: 'events { worker_connections 1024; }', mode: 'fragment', question: '默认值？', release: published };
  const restored = { input: 'http { gzip on; }', mode: 'fragment', question: '功能？', release: published };
  const ui = await start({ originalApp: true, stored: sessionId, sessions: [{ id: sessionId, title: '当前', updatedAt: Date.now() }, { id: otherId, title: '另一会话', updatedAt: Date.now() - 1000 }], api: request => {
    if (request.method === 'DELETE') return reply({});
    if (request.path === `/api/sessions/${otherId}`) return reply({ request: { message: 'gzip 的功能', release: published }, currentSubject: restored, messages: 2 });
    if (request.path === '/api/run') return reply(report({ knowledgeVersion: { release: published }, normalizedRequest: subject, inputResolution: { action: 'config' } }));
  } });
  await until(() => ui.nodes.get('agent-history-list').children.length === 2);
  const pending = async () => { await until(() => ui.nodes.get('query-status').textContent.includes('已提取 2 项')); };
  // 先产生两轮，右侧显示 worker_connections。
  await ui.change('configuration', '第一问'); await ui.submit(); await pending();
  await ui.change('configuration', '第二问'); await ui.submit();
  assert.equal(turnsOf(ui).length, 2);
  // 切换会话：对话流只剩恢复卡（不是完整历史），右侧换成恢复的对象。
  const otherRow = ui.nodes.get('agent-history-list').children.find(node => node.textContent.includes('另一会话'));
  await otherRow.children.find(node => node.textContent === '切换').dispatchEvent({ type: 'click' });
  assert.equal(turnsOf(ui).length, 1);
  // 恢复说明在轮次标签上；面板里仍是当前对象，不是被清空前的模型回答。
  assert.match(tabFor(ui, turnsOf(ui)[0]).textContent, /会话已恢复.*不含历史轮次/);
  assert.match(turnsOf(ui)[0].textContent, /恢复的会话配置/);
  assert.doesNotMatch(ui.nodes.get('agent-result').textContent, /默认 512/);
  await until(() => ui.nodes.get('input-tree').textContent.includes('gzip'));
  assert.doesNotMatch(ui.nodes.get('input-tree').textContent, /worker_connections/);
  // 新会话：对话流与右侧都清空。
  await ui.click('agent-new');
  assert.equal(ui.nodes.get('agent-result').textContent, '');
  assert.doesNotMatch(ui.nodes.get('input-tree').textContent, /gzip/);
  // 新会话后同一对象的提交必须重新替换右侧（不能被“已显示”误判跳过）。
  await ui.change('configuration', '再来'); await ui.submit(); await pending();
  assert.equal(turnsOf(ui).length, 1);
  assert.match(ui.nodes.get('input-tree').textContent, /worker_connections/);
  // 删除当前会话：对话流与右侧清空。
  const current = ui.nodes.get('agent-history-list').children.find(node => node.className === 'is-current');
  await current.children.find(node => node.textContent === '删除').dispatchEvent({ type: 'click' });
  assert.equal(ui.nodes.get('agent-result').textContent, '');
  assert.doesNotMatch(ui.nodes.get('input-tree').textContent, /worker_connections/);
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
  assert.ok(!descendants(card).some(node => ['IMG', 'SCRIPT'].includes(node.tagName)));
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
    assert.match(ui.nodes.get('input-tree').textContent, /worker_connections/);
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
    const summary = block.children.find(node => node.tagName === 'SUMMARY');
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
  assert.ok(!descendants(result).some(node => ['IMG', 'SCRIPT'].includes(node.tagName)));
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

// ---------- 右栏回答区：轮次标签、折叠卡片、大纲、抽屉 ----------
const cardsIn = turn => descendants(turn).filter(node => (node.className || '').split(/\s+/).includes('agent-entry') && node.tagName === 'DETAILS');
const directiveFact = (name, text, status = 'verified', field = 'summary') => {
  const entryIdFor = `nginx--ngx_http_proxy_module--${name}`;
  const source_ids = status === 'verified' ? ['merge'] : [];
  return { entryId: entryIdFor, field, value: { text, status, source_ids }, text, status, source_ids, verification: 'basic_verified' };
};
const cite = (name, field = 'summary') => ({ ...report().modelSelection.citations[0], entryId: `nginx--ngx_http_proxy_module--${name}`, field });
function directivesReport(items, extra = {}) {
  const facts = items.map(item => directiveFact(item.name, item.text, item.status ?? 'verified', item.field ?? 'summary'));
  const citations = items.filter(item => (item.status ?? 'verified') === 'verified').map(item => cite(item.name, item.field ?? 'summary'));
  return report({ modelSelection: { resolvedFacts: facts, citations }, ...extra });
}

test('轮次栏：新轮自动选中，手动改选旧轮后迟到响应只写入自己的轮', async () => {
  const held = deferred();
  let stage = 0;
  const ui = await start({ api: request => {
    if (request.path === '/api/run') return reply(report({ state: 'running', modelSelection: null }));
    if (request.path.startsWith('/api/jobs/')) return stage === 0 ? reply(report()) : held.promise;
  } });
  await ui.change('configuration', '第一问'); await ui.submit();
  assert.equal(turnsOf(ui).length, 1);
  assert.equal(turnsOf(ui)[0].hidden, false);
  assert.equal(tabFor(ui, turnsOf(ui)[0]).getAttribute('aria-selected'), 'true');
  stage = 1;
  const second = ui.change('configuration', '第二问').then(() => ui.submit());
  await until(() => turnsOf(ui).length === 2 && turnsOf(ui)[1].hidden === false);
  assert.equal(tabFor(ui, turnsOf(ui)[1]).getAttribute('aria-selected'), 'true');
  assert.equal(turnsOf(ui)[0].hidden, true);
  await tabsOf(ui)[0].dispatchEvent({ type: 'click' });
  assert.equal(turnsOf(ui)[0].hidden, false);
  assert.equal(turnsOf(ui)[1].hidden, true);
  const late = report();
  late.modelSelection = { resolvedFacts: [{ ...report().modelSelection.resolvedFacts[0], text: '第二轮专属正文', value: { text: '第二轮专属正文', status: 'verified', source_ids: ['merge'] } }], citations: report().modelSelection.citations };
  held.resolve(reply(late));
  await second;
  assert.equal(turnsOf(ui)[0].hidden, false);
  assert.equal(tabFor(ui, turnsOf(ui)[0]).getAttribute('aria-selected'), 'true');
  assert.equal(tabFor(ui, turnsOf(ui)[1]).getAttribute('aria-selected'), 'false');
  assert.match(turnsOf(ui)[1].textContent, /第二轮专属正文/);
  assert.doesNotMatch(turnsOf(ui)[0].textContent, /第二轮专属正文/);
});

test('轮次栏：左右键只移动焦点，Enter 与空格才切换，并在两端回绕', async () => {
  const ui = await start();
  for (const label of ['甲', '乙', '丙']) { await ui.change('configuration', label); await ui.submit(); }
  const tabs = tabsOf(ui);
  assert.deepEqual(tabs.map(tab => tab.getAttribute('role')), ['tab', 'tab', 'tab']);
  assert.equal(tabs[2].getAttribute('aria-selected'), 'true');
  assert.equal(tabs[2].tabIndex, 0);
  assert.equal(tabs[0].tabIndex, -1);
  tabs[2].focus();
  const list = ui.nodes.get('agent-turn-tabs');
  await list.dispatchEvent({ type: 'keydown', key: 'ArrowLeft', preventDefault() {} });
  assert.equal(ui.document.activeElement, tabs[1]);
  assert.equal(tabs[2].getAttribute('aria-selected'), 'true');
  assert.equal(tabs[1].getAttribute('aria-selected'), 'false');
  await list.dispatchEvent({ type: 'keydown', key: 'Enter', preventDefault() {} });
  assert.equal(tabs[1].getAttribute('aria-selected'), 'true');
  assert.equal(turnsOf(ui)[1].hidden, false);
  assert.equal(turnsOf(ui)[2].hidden, true);
  tabs[0].focus();
  await list.dispatchEvent({ type: 'keydown', key: ' ', preventDefault() {} });
  assert.equal(tabs[0].getAttribute('aria-selected'), 'true');
  assert.equal(turnsOf(ui)[0].hidden, false);
  tabs[0].focus();
  await list.dispatchEvent({ type: 'keydown', key: 'ArrowLeft', preventDefault() {} });
  assert.equal(ui.document.activeElement, tabs[2]);
  await list.dispatchEvent({ type: 'keydown', key: 'ArrowRight', preventDefault() {} });
  assert.equal(ui.document.activeElement, tabs[0]);
});

test('指令卡默认展开：两张及以下全开，更多时只开需关注，识别结果里的非唯一匹配也算需关注', async () => {
  const one = await start();
  await one.submit();
  const single = cardsIn(turnsOf(one)[0]);
  assert.equal(single.length, 1);
  assert.equal(single[0].open, true);
  assert.equal(descendants(turnsOf(one)[0]).some(node => (node.className || '').split(/\s+/).includes('answer-nav')), false);
  const closed = await start({ api: request => request.path === '/api/run' ? reply(directivesReport([
    { name: 'alpha', text: '甲已核实' }, { name: 'beta', text: '乙已核实' }, { name: 'gamma', text: '丙已核实' },
  ])) : undefined });
  await closed.submit();
  const folded = cardsIn(turnsOf(closed)[0]);
  assert.deepEqual(folded.map(card => card.open), [false, false, false]);
  assert.equal(descendants(turnsOf(closed)[0]).filter(node => (node.className || '').split(/\s+/).includes('outline-entry')).length, 3);
  const mixed = await start({ api: request => request.path === '/api/run' ? reply(directivesReport([
    { name: 'alpha', text: '甲已核实' },
    { name: 'beta', text: '乙未核实', status: 'unverified' },
    { name: 'gamma', text: '丙已核实' },
  ], {
    parsed: { directives: [
      { name: 'alpha', external_references: [] },
      { name: 'beta', external_references: [] },
      { name: 'gamma', external_references: [] },
    ], errors: [] },
    matches: [{ status: 'matched' }, { status: 'matched' }, { status: 'ambiguous' }],
  })) : undefined });
  await mixed.submit();
  const picked = cardsIn(turnsOf(mixed)[0]);
  // beta 字段未核实，gamma 在识别结果里不是唯一匹配：两张都展开，alpha 折叠。
  assert.deepEqual(picked.map(card => card.dataset.name), ['alpha', 'beta', 'gamma']);
  assert.deepEqual(picked.map(card => card.open), [false, true, true]);
  assert.deepEqual(picked.map(card => card.dataset.attention), ['false', 'true', 'true']);
  assert.match(tabFor(mixed, turnsOf(mixed)[0]).textContent, /待处理 2/);
  assert.doesNotMatch(tabFor(mixed, turnsOf(mixed)[0]).textContent, /需关注/);
  const dot = descendants(tabFor(mixed, turnsOf(mixed)[0])).find(node => (node.className || '').includes('status-dot'));
  assert.equal(dot.dataset.tone, 'warn');
});

test('折叠行摘要按码点截到 80 并折叠空白，HTML 字样只作为文本', async () => {
  const messy = '  行首\n\t  中间   空白  ';
  const evil = `<img src=x onerror=alert(1)>${'字'.repeat(70)}`;
  const ui = await start({ api: request => request.path === '/api/run' ? reply(directivesReport([
    { name: 'alpha', text: messy }, { name: 'beta', text: evil },
  ])) : undefined });
  await ui.submit();
  const cards = cardsIn(turnsOf(ui)[0]);
  const blurb = card => descendants(card).find(node => node.className === 'agent-entry-blurb').textContent;
  assert.equal(blurb(cards[0]), '行首 中间 空白');
  assert.equal(Array.from(blurb(cards[1])).length, 81);
  assert.ok(blurb(cards[1]).startsWith('<img src=x onerror=alert(1)>') && blurb(cards[1]).endsWith('…'));
  assert.ok(cards[1].textContent.includes(evil));
  assert.ok(!descendants(turnsOf(ui)[0]).some(node => ['IMG', 'SCRIPT'].includes(node.tagName)));
  assert.match(descendants(cards[0]).find(node => node.className === 'agent-entry-count').textContent, /字段 1/);
});

test('字段标签页默认显示第一个字段，证据折叠，键盘在字段间移动后才切换', async () => {
  const ui = await start({ api: request => request.path === '/api/run' ? reply(directivesReport([
    { name: 'alpha', text: '功能正文', field: 'summary' },
    { name: 'alpha', text: '语法正文', field: 'syntax' },
  ])) : undefined });
  await ui.submit();
  const card = cardsIn(turnsOf(ui)[0])[0];
  assert.equal(card.open, true);
  const tabs = descendants(card).filter(node => node.getAttribute?.('role') === 'tab');
  const panels = descendants(card).filter(node => node.getAttribute?.('role') === 'tabpanel');
  assert.deepEqual(tabs.map(tab => tab.textContent), ['功能', '语法']);
  assert.equal(tabs[0].getAttribute('aria-selected'), 'true');
  assert.equal(panels[0].hidden, false);
  assert.equal(panels[1].hidden, true);
  assert.match(panels[0].textContent, /功能正文/);
  assert.match(panels[1].textContent, /语法正文/);
  const fold = descendants(panels[0]).find(node => (node.className || '').split(/\s+/).includes('evidence-fold'));
  assert.equal(fold.open, false);
  assert.match(descendants(fold).find(node => node.tagName === 'SUMMARY').textContent, /源码证据 \(1\)/);
  tabs[0].focus();
  const tablist = descendants(card).find(node => node.getAttribute?.('role') === 'tablist');
  await tablist.dispatchEvent({ type: 'keydown', key: 'ArrowRight', preventDefault() {} });
  assert.equal(tabs[0].getAttribute('aria-selected'), 'true');
  assert.equal(ui.document.activeElement, tabs[1]);
  await tablist.dispatchEvent({ type: 'keydown', key: 'Enter', preventDefault() {} });
  assert.equal(tabs[1].getAttribute('aria-selected'), 'true');
  assert.equal(panels[0].hidden, true);
  assert.equal(panels[1].hidden, false);  // Home / End 只移动焦点到首末字段，不切换面板。
  await tablist.dispatchEvent({ type: 'keydown', key: 'Home', preventDefault() {} });
  assert.equal(ui.document.activeElement, tabs[0]);
  assert.equal(panels[1].hidden, false);
  await tablist.dispatchEvent({ type: 'keydown', key: 'End', preventDefault() {} });
  assert.equal(ui.document.activeElement, tabs[1]);
  assert.equal(tabs[1].tabIndex, 0);
  assert.equal(tabs[0].tabIndex, -1);
});

test('大纲点击定位并短暂高亮但不打开详情，搜索和只看需关注同时过滤卡片与大纲', async () => {
  const ui = await start({ api: request => request.path === '/api/run' ? reply(directivesReport([
    { name: 'alpha', text: '甲' }, { name: 'beta', text: '乙未核实', status: 'unverified' }, { name: 'gamma', text: '丙' },
  ])) : undefined });
  const opened = [];
  ui.document.addEventListener('directive-open-detail', event => opened.push(event.detail.entryId));
  await ui.submit();
  const turn = turnsOf(ui)[0];
  const cards = cardsIn(turn);
  const items = descendants(turn).filter(node => (node.className || '').split(/\s+/).includes('outline-entry'));
  items[2].children[0].dispatchEvent({ type: 'click' });
  assert.equal(cards[2].open, true);
  // 参数对象由页面 vm 创建，按字段比较，避免跨上下文的原型比较失败。
  assert.equal(cards[2].scrollIntoViewArgs.behavior, 'auto');
  assert.equal(cards[2].scrollIntoViewArgs.block, 'nearest');
  assert.equal(cards[2].classList.contains('is-flash'), true);
  assert.equal(cards[2].classList.contains('is-selected'), true);
  assert.equal(items[2].classList.contains('is-selected'), true);
  assert.deepEqual(opened, []);
  const search = descendants(turn).find(node => node.className === 'directive-search');
  search.value = 'beta';
  await search.dispatchEvent({ type: 'input' });
  assert.deepEqual(cards.map(card => card.hidden), [true, false, true]);
  assert.deepEqual(items.map(item => item.hidden), [true, false, true]);
  search.value = '';
  await search.dispatchEvent({ type: 'input' });
  const box = descendants(turn).find(node => node.className === 'attention-only');
  box.checked = true;
  await box.dispatchEvent({ type: 'change' });
  assert.deepEqual(cards.map(card => card.hidden), [true, false, true]);
  assert.equal(items[1].hidden, false);
  const expand = descendants(turn).find(node => node.textContent === '全部展开');
  expand.dispatchEvent({ type: 'click' });
  assert.deepEqual(cards.map(card => card.open), [true, true, true]);
  const collapse = descendants(turn).find(node => node.textContent === '全部折叠');
  collapse.dispatchEvent({ type: 'click' });
  assert.deepEqual(cards.map(card => card.open), [false, false, false]);
});

test('没有 IntersectionObserver 时仍能渲染；提供观察器时会观察每张指令卡', async () => {
  class IO {
    constructor(callback, options) { this.callback = callback; this.options = options; this.observed = []; IO.last = this; }
    observe(node) { this.observed.push(node); }
    disconnect() { this.disconnected = true; }
  }
  const ui = await start({ intersectionObserver: IO, api: request => request.path === '/api/run' ? reply(directivesReport([
    { name: 'alpha', text: '甲' }, { name: 'beta', text: '乙' },
  ])) : undefined });
  await ui.submit();
  assert.equal(IO.last.observed.length, 2);
  assert.equal(IO.last.options.root, ui.nodes.get('pane-right'));
  IO.last.callback([{ isIntersecting: true, boundingClientRect: { top: 10 }, target: IO.last.observed[1] }, { isIntersecting: false, boundingClientRect: { top: 0 }, target: IO.last.observed[0] }]);
  const items = descendants(turnsOf(ui)[0]).filter(node => (node.className || '').split(/\s+/).includes('outline-entry'));
  assert.equal(items[1].classList.contains('is-spy'), true);
  assert.equal(items[0].classList.contains('is-spy'), false);
});

test('详情抽屉在详情写完后打开并还原焦点，Esc 与关闭按钮等效；大纲点击不打开', async () => {
  const published = publishedRelease();
  const ui = await start({ originalApp: true, api: request => request.path === '/api/run' ? reply(report({ knowledgeVersion: { release: published } })) : undefined });
  assert.equal(ui.nodes.get('detail-drawer').hidden, true);
  await ui.submit();
  const button = descendants(ui.nodes.get('agent-result')).find(node => node.textContent === '查看完整详情');
  button.focus();
  await button.dispatchEvent({ type: 'click', preventDefault() {}, stopPropagation() {} });
  await until(() => ui.nodes.get('detail-drawer').hidden === false && ui.nodes.get('detail-panel').textContent.includes('worker_connections'));
  // 抽屉栏标题固定，指令名只在正文标题里。
  assert.match(html, /<h2 id="detail-drawer-title"[^>]*>完整知识与源码<\/h2>/);
  assert.doesNotMatch(ui.nodes.get('detail-drawer-title').textContent, /worker_connections/);
  assert.match(ui.nodes.get('detail-panel').textContent, /worker_connections/);
  assert.equal(ui.document.activeElement, ui.nodes.get('detail-drawer-title'));
  assert.match(html, /id="detail-drawer"[^>]*role="complementary"/);
  assert.match(html, /aria-labelledby="detail-drawer-title"/);
  await ui.nodes.get('detail-close').dispatchEvent({ type: 'click' });
  assert.equal(ui.nodes.get('detail-drawer').hidden, true);
  assert.equal(ui.document.activeElement, button);
  button.focus();
  await button.dispatchEvent({ type: 'click', preventDefault() {}, stopPropagation() {} });
  await until(() => ui.nodes.get('detail-drawer').hidden === false);
  await ui.document.dispatchEvent({ type: 'keydown', key: 'Escape' });
  assert.equal(ui.nodes.get('detail-drawer').hidden, true);
  assert.equal(ui.document.activeElement, button);
});

test('右栏不再有逐条识别结果：#parsed-fold 与 #parsed-results 等旧节点已删除，无悬空引用', async () => {
  const ui = await start({ originalApp: true });
  // 旧的右栏识别结果区与其计数已移除；识别结果只在左栏资料库“本次输入”里出现一次。
  for (const gone of ['parsed-fold', 'parsed-results', 'parsed-count']) assert.doesNotMatch(html, new RegExp(`id="${gone}"`), gone);
  assert.doesNotMatch(html, /逐条识别结果/);
  assert.doesNotMatch(agent, /parsed-results/);
  // 查询后结果进入资料库“本次输入”，计数同步到标签上，不再有折叠块。
  await ui.nodes.get('query-form').dispatchEvent({ type: 'submit', preventDefault() {} });
  await until(() => ui.nodes.get('query-status').textContent.includes('唯一匹配'));
  assert.equal(ui.nodes.get('library-input-count').textContent, '1');
  assert.equal(ui.nodes.get('input-tree').children.length, 1);
  assert.equal(ui.nodes.get('library-tab-input').getAttribute('aria-selected'), 'true');
});

test('页面脚本引用的每个 id 都在 index.html 中存在（无悬空引用）', async () => {
  // 扫描页面脚本里的 byId('x') / $('x') / getElementById('x')，逐个确认 HTML 中有对应节点。
  const ids = new Set();
  for (const source of [read('site/app.mjs'), agent]) {
    for (const match of source.matchAll(/(?:byId|\$|getElementById)\(\s*['"]([^'"]+)['"]/g)) ids.add(match[1]);
  }
  const missing = [...ids].filter(id => !new RegExp(`\\bid="${id}"`).test(html));
  assert.deepEqual(missing, []);
});


// ---------- 审核修复：抽屉不抢焦点、待处理口径、识别结果按轮生效、窄屏对话框 ----------
const hasClass = (node, name) => (node.className || '').split(/\s+/).includes(name);
const byClass = (root, name) => descendants(root).filter(node => hasClass(node, name));
// 把抽屉挂进一棵和页面相近的树：body > split > (pane-left, pane-right > (drawer > 标题/关闭/正文, agent-result))。
function mountDrawerTree(ui) {
  const n = id => ui.nodes.get(id);
  // 假 DOM 的 id 节点默认是 DIV；关闭按钮在页面上是 <button>，焦点陷阱按标签名识别。
  n('detail-close').tagName = 'BUTTON';
  n('detail-drawer').append(n('detail-drawer-title'), n('detail-close'), n('detail-panel'));
  n('pane-right').append(n('detail-drawer'), n('agent-result'));
  n('split').append(n('pane-left'), n('splitter'), n('pane-right'));
  ui.document.body.append(n('split'));
}

test('Agent 回答后自动预览唯一候选：只写详情面板，抽屉保持关闭，焦点不动', async () => {
  const published = publishedRelease();
  const ui = await start({ originalApp: true, api: request => request.path === '/api/run'
    ? reply(report({ knowledgeVersion: { release: published }, normalizedRequest: { input: 'worker_connections', mode: 'single', context: 'events', module: null, release: published } }))
    : undefined });
  const analyses = [];
  ui.nodes.get('configuration').addEventListener('agent-analysis', event => analyses.push(event.detail));
  const input = ui.nodes.get('configuration');
  input.focus();
  await ui.submit();
  await until(() => ui.nodes.get('detail-panel').textContent.includes('worker_connections'));
  assert.equal(analyses.length, 1);
  assert.equal(ui.nodes.get('detail-drawer').hidden, true);
  assert.equal(ui.document.activeElement, input);
  // 之后用户主动点“查看完整详情”才打开并移焦点。
  const button = descendants(ui.nodes.get('agent-result')).find(node => node.textContent === '查看完整详情');
  button.focus();
  await button.dispatchEvent({ type: 'click', preventDefault() {}, stopPropagation() {} });
  await until(() => ui.nodes.get('detail-drawer').hidden === false);
  assert.equal(ui.document.activeElement, ui.nodes.get('detail-drawer-title'));
});

test('待处理与需关注分开：统计 chip 保持服务端 attention，标签与复选框用“待处理”并说明口径', async () => {
  const ui = await start({ api: request => request.path === '/api/run' ? reply(directivesReport([
    { name: 'alpha', text: '甲' }, { name: 'beta', text: '乙未核实', status: 'unverified' }, { name: 'gamma', text: '丙未核实', status: 'unverified' },
  ], { summary: { directives: 3, matched: 3, attention: 0, block_entries: 0, external_references: 0 } })) : undefined });
  await ui.submit();
  const turn = turnsOf(ui)[0];
  const chips = byClass(turn, 'chip').map(node => node.textContent);
  assert.ok(chips.includes('需关注 0'));
  const badge = byClass(tabFor(ui, turn), 'turn-attention')[0];
  assert.equal(badge.textContent, '待处理 2');
  assert.match(badge.title, /含未核实字段或识别需关注/);
  assert.match(badge.getAttribute('aria-label'), /待处理 2 条.*含未核实字段或识别需关注/);
  const box = byClass(turn, 'attention-only')[0];
  assert.match(box.getAttribute('aria-label'), /只看待处理.*含未核实字段或识别需关注/);
  assert.equal(box.parentNode.children.find(node => node.tagName === 'SPAN').textContent, '只看待处理');
  assert.match(box.parentNode.title, /待处理 = 含未核实字段或识别需关注/);
});

test('识别结果只更新对应那一轮：新轮识别不改旧轮同名卡片、大纲点与待处理计数', async () => {
  const requestFor = input => ({ input, mode: 'config', context: null, module: null, release });
  let round = 0;
  const ui = await start({ api: request => {
    if (request.path !== '/api/run') return undefined;
    round += 1;
    return reply(directivesReport([{ name: 'alpha', text: '甲' }, { name: 'beta', text: '乙' }], { normalizedRequest: requestFor(`round-${round}`) }));
  } });
  await ui.change('configuration', '第一问'); await ui.submit();
  await ui.change('configuration', '第二问'); await ui.submit();
  const [first, second] = turnsOf(ui);
  // 模拟 app 为第二轮对象写入的识别快照：alpha 未唯一匹配（需关注）。与 app 同源，直接写入 analysis-state。
  const key = ui.page(`analysisKey(${JSON.stringify(requestFor('round-2'))})`);
  ui.page(`setAnalysisSnapshot(buildSnapshot({ key: ${JSON.stringify(key)}, mode: 'config', input: 'alpha on;', parsed: { directives: [{ name: 'alpha', args: ['on'], raw_args: ['on'], line: 1, column: 1, offset: 0, end_offset: 9, kind: 'simple', contexts: [], context: null, parent_index: null, complete: true, external_references: [] }], errors: [] }, matches: [{ status: 'ambiguous', candidates: [] }] }))`);
  await ui.nodes.get('configuration').dispatchEvent(new CustomEvent('agent-parsed', { detail: { request: requestFor('round-2') } }));
  const alphaOf = turn => cardsIn(turn).find(card => card.dataset.name === 'alpha');
  const dotOf = turn => byClass(turn, 'outline-entry').find(item => item.dataset.entryId === alphaOf(turn).dataset.entryId).dot;
  assert.equal(alphaOf(second).dataset.attention, 'true');
  assert.equal(dotOf(second).dataset.tone, 'warn');
  assert.equal(byClass(tabFor(ui, second), 'turn-attention')[0].textContent, '待处理 1');
  assert.equal(alphaOf(first).dataset.attention, 'false');
  assert.equal(dotOf(first).dataset.tone, 'good');
  assert.equal(byClass(tabFor(ui, first), 'turn-attention')[0].hidden, true);
  // 本地查询的网格（request 为 null）不属于任何轮。
  await ui.nodes.get('configuration').dispatchEvent(new CustomEvent('agent-parsed', { detail: { request: null } }));
  assert.equal(alphaOf(first).dataset.attention, 'false');
});

test('“完整知识详情”链接按返回元素加样式，不依赖小写 tagName', async () => {
  const ui = await start();
  await ui.submit();
  const anchor = descendants(ui.nodes.get('agent-result')).find(node => node.textContent === '完整知识详情 ↗');
  assert.equal(anchor.tagName, 'A');
  assert.ok(hasClass(anchor, 'detail-link') && hasClass(anchor, 'text-button'));
});

test('滚动跟随：右栏不是滚动容器时以视口为 root，是滚动容器时用右栏', async () => {
  class IO { constructor(callback, options) { this.options = options; IO.last = this; } observe() {} disconnect() {} }
  const twoCards = request => request.path === '/api/run' ? reply(directivesReport([{ name: 'alpha', text: '甲' }, { name: 'beta', text: '乙' }])) : undefined;
  const narrow = await start({ intersectionObserver: IO, api: twoCards, globals: { getComputedStyle: () => ({ overflowY: 'visible' }) } });
  await narrow.submit();
  assert.equal(IO.last.options.root, null);
  const wide = await start({ intersectionObserver: IO, api: twoCards, globals: { getComputedStyle: () => ({ overflowY: 'auto' }) } });
  await wide.submit();
  assert.equal(IO.last.options.root, wide.nodes.get('pane-right'));
});

test('滚动观察根随窗口尺寸重算：跨过断点的 resize 按帧合并；缺 getComputedStyle 与 requestAnimationFrame 时安全降级', async () => {
  class IO { constructor(callback, options) { this.options = options; IO.all.push(this); IO.last = this; } observe() {} disconnect() { this.disconnects = (this.disconnects ?? 0) + 1; } }
  IO.all = [];
  const twoCards = request => request.path === '/api/run' ? reply(directivesReport([{ name: 'alpha', text: '甲' }, { name: 'beta', text: '乙' }])) : undefined;
  // 右栏是否为滚动容器由测试切换，模拟窗口跨过 960px 断点前后的 computed overflow。
  let overflow = 'visible';
  const resizeHandlers = []; const frames = [];
  const globals = {
    getComputedStyle: () => ({ overflowY: overflow }),
    addEventListener: (type, handler) => { if (type === 'resize') resizeHandlers.push(handler); },
    requestAnimationFrame: callback => { frames.push(callback); return frames.length; },
  };
  const ui = await start({ intersectionObserver: IO, api: twoCards, globals });
  await ui.submit();
  // 断点之上（右栏非滚动容器）：root 为视口。
  assert.equal(IO.last.options.root, null);
  // 窗口拉宽跨过 960px，右栏变为滚动容器。一次拖拽会连续触发多次 resize，只应排一帧。
  overflow = 'auto';
  for (let i = 0; i < 3; i++) resizeHandlers.forEach(handler => handler({ type: 'resize' }));
  assert.equal(frames.length, 1);
  assert.equal(IO.all.length, 1);
  frames.shift()();
  // 旧观察器被断开，新观察器以右栏为 root。
  assert.equal(IO.all.length, 2);
  assert.equal(IO.all[0].disconnects, 1);
  assert.equal(IO.last.options.root, ui.nodes.get('pane-right'));
  // 再次缩回断点之下：root 跟着换回视口。
  overflow = 'visible';
  resizeHandlers.forEach(handler => handler({ type: 'resize' }));
  frames.shift()();
  assert.equal(IO.last.options.root, null);

  // 假环境：没有 getComputedStyle 时沿用右栏；没有 requestAnimationFrame 时同步重算；都不抛错。
  const bareHandlers = [];
  const bare = await start({ intersectionObserver: IO, api: twoCards, globals: { addEventListener: (type, handler) => { if (type === 'resize') bareHandlers.push(handler); } } });
  await bare.submit();
  assert.equal(IO.last.options.root, bare.nodes.get('pane-right'));
  const before = IO.all.length;
  bareHandlers.forEach(handler => handler({ type: 'resize' }));
  assert.equal(IO.all.length, before + 1);
  assert.equal(IO.last.options.root, bare.nodes.get('pane-right'));
});

test('窄屏抽屉是模态对话框：背景 inert、Tab 循环、Esc 关闭后全部还原', async () => {
  const published = publishedRelease();
  const ui = await start({ originalApp: true, globals: { matchMedia: query => ({ matches: /max-width|reduce/.test(query) }) },
    api: request => request.path === '/api/run' ? reply(report({ knowledgeVersion: { release: published } })) : undefined });
  mountDrawerTree(ui);
  await ui.submit();
  const button = descendants(ui.nodes.get('agent-result')).find(node => node.textContent === '查看完整详情');
  button.focus();
  await button.dispatchEvent({ type: 'click', preventDefault() {}, stopPropagation() {} });
  await until(() => ui.nodes.get('detail-drawer').hidden === false && ui.nodes.get('detail-panel').textContent.includes('worker_connections'));
  const drawer = ui.nodes.get('detail-drawer');
  assert.equal(drawer.getAttribute('role'), 'dialog');
  assert.equal(drawer.getAttribute('aria-modal'), 'true');
  assert.equal(ui.nodes.get('agent-result').inert, true);
  assert.equal(ui.nodes.get('pane-left').inert, true);
  assert.notEqual(drawer.inert, true);
  assert.ok(ui.document.body.classList.contains('drawer-modal'));
  // 最后一个可聚焦元素按 Tab 回到第一个（关闭按钮），关闭按钮上 Shift+Tab 回到最后一个。
  // 详情最后一项是永久链接，它就是抽屉里最后一个可聚焦元素。
  const last = ui.nodes.get('detail-panel').children.at(-1);
  assert.equal(last.textContent, '此条目永久详情链接 ↗');
  last.focus();
  let prevented = false;
  await ui.document.dispatchEvent({ type: 'keydown', key: 'Tab', shiftKey: false, preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.ok(ui.document.activeElement === ui.nodes.get('detail-close'), '焦点应回到关闭按钮');
  await ui.document.dispatchEvent({ type: 'keydown', key: 'Tab', shiftKey: true, preventDefault() {} });
  assert.ok(ui.document.activeElement === last, '焦点位置：last');
  // 模态下焦点在哪都能用 Esc 关。
  await ui.document.dispatchEvent({ type: 'keydown', key: 'Escape' });
  assert.equal(drawer.hidden, true);
  assert.equal(drawer.getAttribute('role'), 'complementary');
  assert.equal(drawer.getAttribute('aria-modal'), null);
  assert.equal(ui.nodes.get('agent-result').inert, false);
  assert.equal(ui.nodes.get('pane-left').inert, false);
  assert.equal(ui.document.body.classList.contains('drawer-modal'), false);
  assert.ok(ui.document.activeElement === button, '焦点位置：button');
});

test('宽屏抽屉非模态：输入框里按 Esc 不关，焦点在抽屉内才关；关闭时不加 inert', async () => {
  const published = publishedRelease();
  const ui = await start({ originalApp: true, api: request => request.path === '/api/run' ? reply(report({ knowledgeVersion: { release: published } })) : undefined });
  mountDrawerTree(ui);
  await ui.submit();
  const button = descendants(ui.nodes.get('agent-result')).find(node => node.textContent === '查看完整详情');
  button.focus();
  await button.dispatchEvent({ type: 'click', preventDefault() {}, stopPropagation() {} });
  await until(() => ui.nodes.get('detail-drawer').hidden === false);
  const drawer = ui.nodes.get('detail-drawer');
  assert.equal(drawer.getAttribute('role'), 'complementary');
  assert.equal(drawer.getAttribute('aria-modal'), null);
  assert.notEqual(ui.nodes.get('pane-left').inert, true);
  const input = ui.nodes.get('configuration');
  input.tagName = 'TEXTAREA';
  input.focus();
  await ui.document.dispatchEvent({ type: 'keydown', key: 'Escape' });
  assert.equal(drawer.hidden, false);
  ui.nodes.get('detail-close').focus();
  await ui.document.dispatchEvent({ type: 'keydown', key: 'Escape' });
  assert.equal(drawer.hidden, true);
  // 抽屉已关时 Esc 什么也不做。
  input.focus();
  await ui.document.dispatchEvent({ type: 'keydown', key: 'Escape' });
  assert.ok(ui.document.activeElement === input, '焦点位置：input');
});

// ---------- 抽屉关闭动效：重开取消待执行收起、transitionend 只认自身 transform ----------
const realSetTimeout = setTimeout;
const realClearTimeout = clearTimeout;
// 受控的关闭兜底定时器：只接管抽屉关闭动效的 400ms 计时，其它延时仍走真实定时器（轮询、闪烁高亮不受影响）。
// 测试不靠真实等待：fire() 模拟“到点”，被 clearTimeout 取消或已触发过的计时不会再次触发。
function closeTimers() {
  const timers = [];
  const setTimer = (fn, ms, ...args) => {
    if (ms !== 400) return realSetTimeout(fn, ms, ...args);
    const timer = { fn, args, cleared: false, fired: false };
    timers.push(timer);
    return timer;
  };
  const clearTimer = timer => {
    if (timer && typeof timer === 'object' && Object.hasOwn(timer, 'fn')) timer.cleared = true;
    else realClearTimeout(timer);
  };
  const fire = () => { for (const timer of timers) if (!timer.cleared && !timer.fired) { timer.fired = true; timer.fn(...timer.args); } };
  const pending = () => timers.filter(timer => !timer.cleared && !timer.fired).length;
  return { timers, setTimeout: setTimer, clearTimeout: clearTimer, fire, pending };
}
// 按真实冒泡路径派发 transitionend：从源节点沿 parentNode 向上，途经节点上的监听都会收到，target 始终是源节点。
function bubbleTransitionEnd(source, propertyName) {
  for (let node = source; node; node = node.parentNode) {
    for (const handler of [...(node.events?.transitionend ?? [])]) handler({ type: 'transitionend', target: source, currentTarget: node, propertyName, preventDefault() {} });
  }
}
// 从右栏的“查看完整详情”打开抽屉（动效开启的窄屏场景）。点击后等详情真正写入抽屉才返回。
async function openFromResult(ui) {
  const button = descendants(ui.nodes.get('agent-result')).find(node => node.textContent === '查看完整详情');
  button.focus();
  await button.dispatchEvent({ type: 'click', preventDefault() {}, stopPropagation() {} });
  await until(() => ui.nodes.get('detail-drawer').hidden === false && ui.nodes.get('detail-panel').textContent.includes('worker_connections'));
  return button;
}
// 窄屏且动效开启：matchMedia 只对 max-width 命中，reduce 不命中，所以关闭会走 transitionend + 400ms 兜底的动效路径。
async function narrowMotionDrawer(timers) {
  const published = publishedRelease();
  const ui = await start({ originalApp: true,
    globals: { matchMedia: query => ({ matches: /max-width/.test(query) }), setTimeout: timers.setTimeout, clearTimeout: timers.clearTimeout },
    api: request => request.path === '/api/run' ? reply(report({ knowledgeVersion: { release: published } })) : undefined });
  mountDrawerTree(ui);
  await ui.submit();
  await openFromResult(ui);
  return ui;
}

test('关闭动效未结束时重新打开：待执行的收起被取消，到点不收起，窄屏 inert 与滚动锁保留', async () => {
  const timers = closeTimers();
  const ui = await narrowMotionDrawer(timers);
  const drawer = ui.nodes.get('detail-drawer');
  const agentResult = ui.nodes.get('agent-result');
  const paneLeft = ui.nodes.get('pane-left');
  assert.equal(drawer.getAttribute('aria-modal'), 'true');
  // 第一次关闭：is-open 已移除、400ms 兜底已排队，但动效还没结束。
  await ui.nodes.get('detail-close').dispatchEvent({ type: 'click' });
  assert.equal(drawer.hidden, false);
  assert.equal(hasClass(drawer, 'is-open'), false);
  assert.equal(timers.pending(), 1);
  // 动效未结束（约 100ms 内）就再次打开：应取消旧的收起，并把 is-open 加回去。
  await openFromResult(ui);
  assert.equal(hasClass(drawer, 'is-open'), true);
  assert.equal(timers.pending(), 0);
  // 旧的 400ms 到点：抽屉仍是打开的，背景 inert 与滚动锁也没有被误清。
  timers.fire();
  assert.equal(drawer.hidden, false);
  assert.equal(hasClass(drawer, 'is-open'), true);
  assert.equal(agentResult.inert, true);
  assert.equal(paneLeft.inert, true);
  assert.equal(ui.document.body.classList.contains('drawer-modal'), true);
  // 旧的 transitionend 监听也已移除：抽屉自身 transform 结束不会把刚打开的抽屉收走。
  bubbleTransitionEnd(drawer, 'transform');
  assert.equal(drawer.hidden, false);
  // 重开之后的正常关闭仍然有效：再次关闭、到点后真正收起并还原 inert 与滚动锁。
  await ui.nodes.get('detail-close').dispatchEvent({ type: 'click' });
  timers.fire();
  assert.equal(drawer.hidden, true);
  assert.equal(agentResult.inert, false);
  assert.equal(paneLeft.inert, false);
  assert.equal(ui.document.body.classList.contains('drawer-modal'), false);
});

test('抽屉关闭只认自身 transform 的 transitionend：子元素冒泡的过渡结束与抽屉其它属性都不提前收起', async () => {
  const timers = closeTimers();
  const ui = await narrowMotionDrawer(timers);
  const drawer = ui.nodes.get('detail-drawer');
  await ui.nodes.get('detail-close').dispatchEvent({ type: 'click' });
  assert.equal(timers.pending(), 1);
  // 详情里的子元素 transform 过渡结束会冒泡到抽屉上，但 target 不是抽屉本身，不能收起。
  const inner = ui.nodes.get('detail-panel').children[0];
  bubbleTransitionEnd(inner, 'transform');
  assert.equal(drawer.hidden, false);
  // 抽屉自身的其它属性过渡结束（如 box-shadow）也不收起。
  bubbleTransitionEnd(drawer, 'box-shadow');
  assert.equal(drawer.hidden, false);
  assert.equal(timers.pending(), 1);
  // 只有抽屉自身的 transform 过渡结束才收起，并取消仍在排队的兜底定时器。
  bubbleTransitionEnd(drawer, 'transform');
  assert.equal(drawer.hidden, true);
  assert.equal(timers.pending(), 0);
  assert.equal(ui.nodes.get('agent-result').inert, false);
  assert.equal(ui.document.body.classList.contains('drawer-modal'), false);
});

test('每轮的搜索词与“只看待处理”各自保存，切换轮次后保持且互不影响', async () => {
  const ui = await start({ api: request => request.path === '/api/run' ? reply(directivesReport([
    { name: 'alpha', text: '甲' }, { name: 'beta', text: '乙未核实', status: 'unverified' }, { name: 'gamma', text: '丙' },
  ])) : undefined });
  await ui.change('configuration', '一'); await ui.submit();
  await ui.change('configuration', '二'); await ui.submit();
  const [first, second] = turnsOf(ui);
  await tabFor(ui, first).dispatchEvent({ type: 'click' });
  const search = byClass(first, 'directive-search')[0];
  search.value = 'gam';
  await search.dispatchEvent({ type: 'input' });
  await tabFor(ui, second).dispatchEvent({ type: 'click' });
  const box = byClass(second, 'attention-only')[0];
  box.checked = true;
  await box.dispatchEvent({ type: 'change' });
  await tabFor(ui, first).dispatchEvent({ type: 'click' });
  assert.equal(first.hidden, false);
  assert.equal(byClass(first, 'directive-search')[0].value, 'gam');
  assert.equal(byClass(first, 'attention-only')[0].checked, false);
  assert.deepEqual(cardsIn(first).map(card => card.hidden), [true, true, false]);
  assert.equal(byClass(second, 'directive-search')[0].value, '');
  assert.equal(byClass(second, 'attention-only')[0].checked, true);
  assert.deepEqual(cardsIn(second).map(card => card.hidden), [true, false, true]);
});

test('滚动观察器在清空会话与裁掉旧轮时断开；超过 20 轮时标签与面板同步裁剪且 aria-controls 对得上', async () => {
  const made = [];
  class IO { constructor() { this.disconnects = 0; made.push(this); } observe() {} disconnect() { this.disconnects += 1; } }
  const ui = await start({ intersectionObserver: IO, api: request => request.path === '/api/run' ? reply(directivesReport([{ name: 'alpha', text: '甲' }, { name: 'beta', text: '乙' }])) : undefined });
  for (let index = 1; index <= 21; index++) { await ui.change('configuration', `第 ${index} 问`); await ui.submit(); }
  assert.equal(made.length, 21);
  // 第 1 轮被裁掉，它的观察器断开；其余仍在观察。
  assert.equal(made[0].disconnects, 1);
  assert.ok(made.slice(1).every(observer => observer.disconnects === 0));
  const tabs = tabsOf(ui);
  const panels = turnsOf(ui);
  assert.equal(tabs.length, 20);
  assert.equal(panels.length, 20);
  assert.deepEqual(tabs.map(tab => tab.getAttribute('aria-controls')), panels.map(panel => panel.id));
  assert.deepEqual(panels.map(panel => panel.getAttribute('aria-labelledby')), tabs.map(tab => tab.id));
  assert.match(tabs[0].textContent, /第 2 轮/);
  assert.match(tabs.at(-1).textContent, /第 21 轮/);
  // 新会话清空对话流：剩下的 20 个观察器全部断开。
  await ui.click('agent-new');
  assert.ok(made.slice(1).every(observer => observer.disconnects === 1));
  assert.equal(tabsOf(ui).length, 0);
});

test('大纲超过三条时给出总数提示，选中与滚动跟随用不同的类', async () => {
  const ui = await start({ api: request => request.path === '/api/run' ? reply(directivesReport([
    { name: 'a1', text: '1' }, { name: 'a2', text: '2' }, { name: 'a3', text: '3' }, { name: 'a4', text: '4' },
  ])) : undefined });
  await ui.submit();
  const nav = byClass(turnsOf(ui)[0], 'answer-nav')[0];
  assert.equal(nav.dataset.overflow, 'true');
  assert.equal(byClass(nav, 'outline-total')[0].textContent, '共 4 条，大纲内可滚动');
  const css = read('site/styles.css');
  assert.match(css, /\.outline-entry\.is-spy button \{ background: var\(--paper-deep\); \}/);
  assert.match(css, /\.outline-entry\.is-selected button \{[^}]*inset 3px 0 0 var\(--accent\)/);
});

// ---------- 第二步：资料库（三标签页、本次输入树、全部目录、API/变量） ----------
const TAB = name => `library-tab-${name}`;
const selectedTab = ui => ['input', 'catalog', 'reference'].find(name => ui.nodes.get(TAB(name)).getAttribute('aria-selected') === 'true');
const treeMains = ui => byClass(ui.nodes.get('input-tree'), 'tree-main');
const treeNamed = (ui, name) => treeMains(ui).find(main => byClass(main, 'tree-name')[0]?.textContent === name);
// 树节点 li 是 main 的祖父（main → 行 div → li）。
const itemOf = main => main.parentNode.parentNode;
const rowOf = item => item.children.find(child => hasClass(child, 'tree-row'));
const lineOfItem = item => byClass(rowOf(item), 'tree-line')[0].textContent;
const nameOfItem = item => byClass(rowOf(item), 'tree-name')[0].textContent;
const childrenOfItem = item => item.children.find(child => hasClass(child, 'tree-children'))?.children ?? [];
const catalogButtonsOf = ui => byClass(ui.nodes.get('catalog-list'), 'catalog-entry');
const groupsOf = ui => byClass(ui.nodes.get('catalog-list'), 'catalog-group');
// 分组计数（摘要里的“N 条”）：收起的组没有条目按钮，目录总数只能从计数读。
const groupCountOf = group => Number(byClass(group, 'catalog-group-count')[0].textContent.replace(/\D/g, ''));
const catalogTotalOf = ui => groupsOf(ui).reduce((sum, group) => sum + groupCountOf(group), 0);
const groupNamed = (ui, moduleName) => groupsOf(ui).find(group => group.dataset.module === moduleName);
// 页面里的搜索是防抖的（120ms）；测试用页面内的 flush 入口立即执行挂起的目录渲染，不做真实等待。
const flushCatalog = ui => ui.page('flushCatalogRender()');
async function searchCatalog(ui, value) {
  ui.nodes.get('catalog-search').value = value;
  await ui.nodes.get('catalog-search').dispatchEvent({ type: 'input' });
  flushCatalog(ui);
}
// 模拟用户手动展开/收起一个模块组（浏览器里 open 变化会触发 toggle）。
async function toggleGroup(ui, moduleName) {
  const group = groupNamed(ui, moduleName);
  group.open = !group.open;
  await group.dispatchEvent({ type: 'toggle' });
  return group;
}
const indexEntries = JSON.parse(read('dist/knowledge/index.json')).directives;
// 与用户一样通过本地查询入口提交配置（不调用 Agent）。
async function localQuery(ui, mode, text) {
  await ui.change('input-mode', mode);
  await ui.change('configuration', text);
  await ui.nodes.get('query-form').dispatchEvent({ type: 'submit', preventDefault() {} });
}

test('资料库默认标签：没有本次输入时为“全部目录”；识别出指令后切到“本次输入”；清空后回到目录', async () => {
  const ui = await start({ originalApp: true });
  assert.equal(selectedTab(ui), 'catalog');
  assert.equal(ui.nodes.get('library-panel-catalog').hidden, false);
  assert.equal(ui.nodes.get('library-panel-input').hidden, true);
  assert.equal(ui.nodes.get('input-empty').hidden, false);
  assert.match(ui.nodes.get('input-empty').textContent, /在上方输入配置后.*全部目录/);
  await localQuery(ui, 'config', 'events { worker_connections 1024; }');
  assert.equal(selectedTab(ui), 'input');
  assert.equal(ui.nodes.get('library-panel-input').hidden, false);
  assert.equal(ui.nodes.get('library-panel-catalog').hidden, true);
  assert.equal(ui.nodes.get('library-input-count').textContent, '2');
  assert.equal(ui.nodes.get('input-empty').hidden, true);
  // 输入变化后本地结果被清掉：没有分析对象，标签回到“全部目录”，计数消失。
  await ui.change('configuration', 'gzip on;');
  assert.equal(selectedTab(ui), 'catalog');
  assert.equal(ui.nodes.get('library-input-count').textContent, '');
});

test('资料库标签手动切换后，后台的新识别结果不再改选标签', async () => {
  const ui = await start({ originalApp: true });
  await localQuery(ui, 'config', 'events { worker_connections 1024; }');
  assert.equal(selectedTab(ui), 'input');
  await ui.nodes.get(TAB('catalog')).dispatchEvent({ type: 'click' });
  assert.equal(selectedTab(ui), 'catalog');
  await localQuery(ui, 'config', 'http { gzip on; server { listen 80; } }');
  assert.equal(selectedTab(ui), 'catalog');
  assert.equal(ui.nodes.get('library-input-count').textContent, '4');
  assert.equal(ui.nodes.get('library-panel-input').hidden, true);
});

test('资料库标签支持左右方向键（首尾回绕）、Home、End，焦点与 tabIndex 同步', async () => {
  const ui = await start({ originalApp: true });
  const tabs = ui.nodes.get('library-tabs');
  const key = k => tabs.dispatchEvent({ type: 'keydown', key: k, preventDefault() {} });
  ui.nodes.get(TAB('catalog')).focus();
  await key('ArrowRight');
  assert.equal(ui.document.activeElement, ui.nodes.get(TAB('reference')));
  assert.equal(selectedTab(ui), 'reference');
  assert.equal(ui.nodes.get(TAB('reference')).tabIndex, 0);
  assert.equal(ui.nodes.get(TAB('catalog')).tabIndex, -1);
  await key('ArrowRight');
  assert.equal(selectedTab(ui), 'input');
  await key('ArrowLeft');
  assert.equal(selectedTab(ui), 'reference');
  await key('Home');
  assert.equal(selectedTab(ui), 'input');
  assert.equal(ui.document.activeElement, ui.nodes.get(TAB('input')));
  await key('End');
  assert.equal(selectedTab(ui), 'reference');
  assert.equal(ui.nodes.get('library-panel-reference').hidden, false);
  assert.equal(ui.nodes.get('library-panel-catalog').hidden, true);
  // 标签的 aria 关系写在 HTML 里：每个 tab 指向对应 tabpanel，tabpanel 反向指向 tab。
  for (const name of ['input', 'catalog', 'reference']) {
    assert.match(html, new RegExp(`id="library-tab-${name}"[^>]*aria-controls="library-panel-${name}"`));
    assert.match(html, new RegExp(`id="library-panel-${name}"[^>]*aria-labelledby="library-tab-${name}"`));
  }
});

test('本次输入按配置块分组：块带起止行号，指令行带行号；嵌套关系与行号正确，块可折叠', async () => {
  const ui = await start({ originalApp: true });
  await localQuery(ui, 'config', 'http {\n  server {\n    listen 80;\n    server_name a.com;\n  }\n}\nevents { worker_connections 1024; }');
  const [http, events] = ui.nodes.get('input-tree').children;
  assert.equal(nameOfItem(http), 'http');
  assert.equal(lineOfItem(http), '第 1–6 行');
  assert.equal(nameOfItem(events), 'events');
  assert.equal(lineOfItem(events), '第 7 行');
  const [server] = childrenOfItem(http);
  assert.equal(nameOfItem(server), 'server');
  assert.equal(lineOfItem(server), '第 2–5 行');
  const [listen, serverName] = childrenOfItem(server);
  assert.deepEqual([nameOfItem(listen), lineOfItem(listen)], ['listen', '行 3']);
  assert.deepEqual([nameOfItem(serverName), lineOfItem(serverName)], ['server_name', '行 4']);
  assert.deepEqual(childrenOfItem(events).map(nameOfItem), ['worker_connections']);
  assert.equal(lineOfItem(childrenOfItem(events)[0]), '行 7');
  // 唯一匹配的指令行是绿点，块也带状态点。
  assert.ok(byClass(rowOf(listen), 'status-dot-good').length === 1);
  assert.ok(byClass(rowOf(http), 'status-dot').length === 1);
  // 折叠按钮隐藏子项并写入 aria-expanded，再次点击恢复。
  const toggle = byClass(rowOf(http), 'tree-toggle')[0];
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  await toggle.dispatchEvent({ type: 'click' });
  assert.ok(hasClass(http, 'is-folded'));
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(http.children.find(child => hasClass(child, 'tree-children')).hidden, true);
  await toggle.dispatchEvent({ type: 'click' });
  assert.equal(hasClass(http, 'is-folded'), false);
  assert.equal(http.children.find(child => hasClass(child, 'tree-children')).hidden, false);
});

test('状态点三档：唯一匹配绿，未收录与块内项灰，未唯一匹配需关注琥珀；状态文字同时写出', async () => {
  const ui = await start({ originalApp: true });
  await localQuery(ui, 'config', 'http {\n  gzip on;\n}\nunknown_xyz on;\nproxy_pass http://a;');
  const dot = name => byClass(treeNamed(ui, name), 'status-dot')[0];
  assert.ok(hasClass(dot('gzip'), 'status-dot-good'));
  assert.ok(hasClass(dot('unknown_xyz'), 'status-dot-muted'));
  assert.ok(hasClass(dot('proxy_pass'), 'status-dot-warn'));
  assert.equal(byClass(treeNamed(ui, 'unknown_xyz'), 'tree-status')[0].textContent, '当前索引未收录');
  assert.equal(byClass(treeNamed(ui, 'proxy_pass'), 'tree-status')[0].textContent, '上下文没有匹配项');
  assert.equal(byClass(treeNamed(ui, 'gzip'), 'tree-status')[0].textContent, '唯一匹配');
});

test('点击资料库唯一候选：广播 library 来源的选中，全部目录与本次输入同步高亮；多候选行点击只展开', async () => {
  const ui = await start({ originalApp: true });
  const seen = [];
  ui.document.addEventListener('directive-select', event => seen.push(event.detail));
  await localQuery(ui, 'config', 'events { worker_connections 1024; }\nproxy_pass http://a;');
  // 目录分组懒构建：要看到目录里的高亮，需要先展开对应的模块组（用户手动展开）。
  await toggleGroup(ui, 'ngx_event_core_module');
  const worker = treeNamed(ui, 'worker_connections');
  await worker.dispatchEvent({ type: 'click' });
  assert.equal(seen.at(-1).entryId, entryId);
  assert.equal(seen.at(-1).source, 'library');
  assert.ok(hasClass(worker, 'is-selected'));
  assert.equal(worker.getAttribute('aria-pressed'), 'true');
  const catalogEntry = catalogButtonsOf(ui).find(node => node.dataset.id === entryId);
  assert.ok(hasClass(catalogEntry, 'active'));
  assert.equal(catalogEntry.getAttribute('aria-current'), 'true');
  // 从全部目录点选其他条目：资料库树上的高亮随之移走。
  await toggleGroup(ui, 'ngx_http_gzip_filter_module');
  const other = catalogButtonsOf(ui).find(node => node.dataset.id === 'nginx--ngx_http_gzip_filter_module--gzip');
  await other.dispatchEvent({ type: 'click' });
  assert.equal(hasClass(worker, 'is-selected'), false);
  assert.equal(worker.getAttribute('aria-pressed'), 'false');
  assert.equal(hasClass(catalogEntry, 'active'), false);
  // 多候选（proxy_pass 上下文未定）：点行只展开候选，不发出选中事件。
  const before = seen.length;
  await treeNamed(ui, 'proxy_pass').dispatchEvent({ type: 'click' });
  assert.equal(seen.length, before);
  assert.equal(byClass(itemOf(treeNamed(ui, 'proxy_pass')), 'tree-candidates')[0].hidden, false);
});

test('多候选在行内展开；候选点击打开抽屉并预览；唯一候选的展开入口同样可用', async () => {
  const ui = await start({ originalApp: true });
  await localQuery(ui, 'config', 'proxy_pass http://a;');
  const item = itemOf(treeNamed(ui, 'proxy_pass'));
  const expand = byClass(rowOf(item), 'tree-expand')[0];
  assert.equal(expand.textContent, '候选 2');
  assert.equal(expand.getAttribute('aria-expanded'), 'false');
  const list = byClass(item, 'tree-candidates')[0];
  assert.equal(list.hidden, true);
  assert.equal(ui.nodes.get('detail-drawer').hidden, true);
  await expand.dispatchEvent({ type: 'click' });
  assert.equal(list.hidden, false);
  assert.equal(expand.getAttribute('aria-expanded'), 'true');
  const candidates = byClass(list, 'tree-candidate');
  assert.equal(candidates.length, 2);
  await candidates[0].dispatchEvent({ type: 'click' });
  // reveal:true：候选点击是用户主动操作，抽屉打开并显示该候选的详情。
  assert.equal(ui.nodes.get('detail-drawer').hidden, false);
  assert.match(ui.nodes.get('detail-panel').textContent, /proxy_pass/);
});

test('唯一候选的行提供“详情”按钮：一次点击直接打开该条目的抽屉，不再多列一层候选', async () => {
  const ui = await start({ originalApp: true });
  await localQuery(ui, 'config', 'events { worker_connections 1024; }');
  const item = itemOf(treeNamed(ui, 'worker_connections'));
  const detail = byClass(rowOf(item), 'tree-expand')[0];
  assert.equal(detail.textContent, '详情');
  assert.equal(detail.getAttribute('aria-label'), '查看 worker_connections 的完整详情');
  assert.equal(byClass(item, 'tree-candidates').length, 0);
  assert.equal(ui.nodes.get('detail-drawer').hidden, true);
  await detail.dispatchEvent({ type: 'click' });
  assert.equal(ui.nodes.get('detail-drawer').hidden, false);
  assert.match(ui.nodes.get('detail-panel').textContent, /worker_connections/);
});

test('全部目录：搜索与筛选在有本次输入候选时仍可用；按模块分组默认折叠，搜索时命中组自动展开，清空后恢复', async () => {
  const ui = await start({ originalApp: true });
  await localQuery(ui, 'config', 'events { worker_connections 1024; }');
  for (const id of ['catalog-search', 'catalog-source', 'catalog-module', 'catalog-context', 'catalog-phase', 'verified-only', 'catalog-reset']) assert.equal(ui.nodes.get(id).disabled, false, id);
  // 搜索（防抖后 flush 立即重建）：有本次输入候选时搜索框仍可输入、仍然过滤。
  await searchCatalog(ui, 'lua');
  assert.equal(ui.nodes.get('catalog-search').disabled, false);
  assert.ok(catalogButtonsOf(ui).length > 0 && catalogButtonsOf(ui).every(node => /lua/i.test(`${node.dataset.id}`)));
  await searchCatalog(ui, '');
  const groups = groupsOf(ui);
  assert.ok(groups.length > 1);
  assert.ok(groups.every(group => group.open === false));
  // 收起的组不构建条目按钮；总数仍由分组计数给出。
  assert.equal(catalogButtonsOf(ui).length, 0);
  assert.equal(catalogTotalOf(ui), indexEntries.length);
  // 搜索 worker_connections：只剩命中的模块组，且自动展开并构建。
  await searchCatalog(ui, 'worker_connections');
  const hits = groupsOf(ui);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].dataset.module, 'ngx_event_core_module');
  assert.equal(hits[0].open, true);
  assert.equal(catalogButtonsOf(ui).length, 1);
  // 清空搜索：回到默认折叠，收起的组不再构建按钮，总数恢复全量。
  await searchCatalog(ui, '');
  assert.ok(groupsOf(ui).every(group => group.open === false));
  assert.equal(catalogButtonsOf(ui).length, 0);
  assert.equal(catalogTotalOf(ui), indexEntries.length);
});

test('全部目录：用户展开的模块组在重新渲染后保持展开；“只看已核对项”与“清除搜索与筛选”生效', async () => {
  const ui = await start({ originalApp: true });
  const group = groupsOf(ui).find(item => item.dataset.module === 'ngx_event_core_module');
  group.open = true;
  await group.dispatchEvent({ type: 'toggle' });
  // 当前发行版的条目全部至少基础核对，无法靠真实数据验证该筛选；这里在页面内存的目录副本上把前 5 条标为仅注册信息。
  ui.page(`for (const entry of index.directives.slice(0, 5)) entry.verification = 'registration_only'`);
  const hiddenIds = ui.page(`index.directives.slice(0, 5).map(entry => entry.id)`);
  ui.nodes.get('verified-only').checked = true;
  await ui.nodes.get('verified-only').dispatchEvent({ type: 'change' });
  const verifiedIds = catalogButtonsOf(ui).map(node => node.dataset.id);
  assert.equal(verifiedIds.length, indexEntries.length - 5);
  assert.ok(verifiedIds.every(id => !hiddenIds.includes(id)));
  assert.equal(ui.nodes.get('catalog-count').textContent, String(indexEntries.length - 5));
  assert.equal(groupsOf(ui).find(item => item.dataset.module === 'ngx_event_core_module').open, true);
  await searchCatalog(ui, 'proxy');
  await ui.nodes.get('catalog-reset').dispatchEvent({ type: 'click' });
  assert.equal(ui.nodes.get('verified-only').checked, false);
  assert.equal(ui.nodes.get('catalog-search').value, '');
  // 清除后用户展开过的 ngx_event_core_module 仍展开并构建；其余组收起，总数恢复全量。
  assert.equal(groupNamed(ui, 'ngx_event_core_module').open, true);
  assert.equal(catalogButtonsOf(ui).length, groupCountOf(groupNamed(ui, 'ngx_event_core_module')));
  assert.equal(catalogTotalOf(ui), indexEntries.length);
  assert.equal(ui.nodes.get('catalog-count').textContent, String(indexEntries.length));
});

test('“只看需关注”：保留需关注的行与它所在的块，没有时显示空状态；选择在新识别后仍然生效', async () => {
  const ui = await start({ originalApp: true });
  await localQuery(ui, 'config', 'http {\n  gzip on;\n  proxy_pass http://a;\n}');
  ui.nodes.get('result-filter').value = 'attention';
  await ui.nodes.get('result-filter').dispatchEvent({ type: 'change' });
  assert.equal(treeNamed(ui, 'gzip'), undefined);
  assert.ok(treeNamed(ui, 'proxy_pass'));
  assert.ok(treeNamed(ui, 'http'), '需关注子项所在的块保留');
  assert.equal(ui.nodes.get('result-empty').hidden, true);
  // 全部唯一匹配：筛选后没有行，显示空状态且不冒充验证通过。
  await localQuery(ui, 'config', 'events { worker_connections 1024; }');
  assert.equal(ui.nodes.get('result-filter').value, 'attention');
  assert.equal(ui.nodes.get('input-tree').children.length, 0);
  assert.equal(ui.nodes.get('result-empty').hidden, false);
  // 空状态文案写在 HTML 中（测试假 DOM 不解析静态文本），这里核对它的原文。
  assert.match(html, /id="result-empty"[^>]*>当前没有需关注的指令；这不代表参数或运行环境验证通过。/);
  assert.equal(ui.nodes.get('result-count').textContent, '0 / 2 行');
});

test('空状态：没有本次输入、输入中没有指令时各有清晰文案，标签计数不显示 0', async () => {
  const ui = await start({ originalApp: true });
  assert.equal(ui.nodes.get('input-empty').hidden, false);
  assert.equal(ui.nodes.get('result-toolbar').hidden, true);
  await localQuery(ui, 'config', '');
  assert.equal(ui.nodes.get('input-empty').hidden, false);
  assert.equal(ui.nodes.get('input-empty').textContent, '本次输入中没有可识别的指令。');
  assert.equal(ui.nodes.get('input-tree').children.length, 0);
  assert.equal(ui.nodes.get('library-input-count').textContent, '');
  assert.equal(selectedTab(ui), 'catalog');
});

test('块与指令参数只作为文本显示：HTML 字样不生成元素，名称与参数保持原文', async () => {
  const ui = await start({ originalApp: true });
  await localQuery(ui, 'config', 'http {\n  server {\n    server_name <img src=x onerror=alert(1)>;\n  }\n}');
  const tree = ui.nodes.get('input-tree');
  assert.ok(!descendants(tree).some(node => ['IMG', 'SCRIPT'].includes(node.tagName)));
  assert.match(tree.textContent, /<img src=x onerror=alert\(1\)>/);
  assert.ok(!agent.includes('innerHTML'));
  assert.ok(!read('site/app.mjs').includes('innerHTML'));
});

test('API/变量参考已迁到资料库第三个标签，右栏不再包含参考区块，计数随标签显示', async () => {
  const rightStart = html.indexOf('id="pane-right"');
  assert.ok(rightStart > 0);
  assert.doesNotMatch(html.slice(rightStart), /reference-|step-reference|API 与变量参考/);
  const left = html.slice(0, html.indexOf('id="splitter"'));
  for (const id of ['library-panel-reference', 'reference-list', 'reference-detail', 'reference-search', 'reference-kind', 'reference-status', 'reference-count']) assert.match(left, new RegExp(`id="${id}"`), id);
  // 查询状态位于标签栏下方，切换标签时仍在同一位置可见。
  assert.ok(html.indexOf('id="library-tabs"') < html.indexOf('id="query-status"'));
  assert.ok(html.indexOf('id="query-status"') < html.indexOf('id="library-panel-input"'));
  const ui = await start({ originalApp: true });
  assert.ok(ui.nodes.get('reference-list').children.length > 0);
  await ui.nodes.get(TAB('reference')).dispatchEvent({ type: 'click' });
  assert.equal(ui.nodes.get('library-panel-reference').hidden, false);
  assert.match(ui.nodes.get('reference-count').textContent, /^\d+ \/ \d+$/);
});

test('页面监听不重复绑定：directive-select 由页面脚本与回答区各绑定一次，反复查询与切换不增加', async () => {
  const ui = await start({ originalApp: true });
  const count = () => (ui.listeners.get('directive-select') ?? []).length;
  assert.equal(count(), 2);
  await localQuery(ui, 'config', 'events { worker_connections 1024; }');
  await ui.nodes.get(TAB('reference')).dispatchEvent({ type: 'click' });
  await localQuery(ui, 'config', 'http { gzip on; }');
  await treeNamed(ui, 'gzip').dispatchEvent({ type: 'click' });
  assert.equal(count(), 2);
  const plain = await start();
  assert.equal((plain.listeners.get('directive-select') ?? []).length, 1);
});

// 资料库点选唯一候选，右栏卡片的定位：agent 返回的卡片 entryId 与识别出的唯一候选一致。
function cardReport(entryIdValue, text, extra = {}) {
  const citation = { ...report().modelSelection.citations[0], entryId: entryIdValue, field: 'defaults' };
  return report({ modelSelection: { resolvedFacts: [{ entryId: entryIdValue, field: 'defaults', value: { text, status: 'verified', source_ids: ['merge'] }, text, status: 'verified', source_ids: ['merge'] }], citations: [citation] }, ...extra });
}

test('资料库点选唯一候选：右栏展开、闪烁并滚动到对应卡片（来源 library）', async () => {
  const published = publishedRelease();
  const normalizedRequest = { input: 'events { worker_connections 1024; }', mode: 'fragment', question: '默认值？', release: published };
  const ui = await start({ originalApp: true, api: request => request.path === '/api/run'
    ? reply(cardReport(entryId, '默认 1024', { knowledgeVersion: { release: published }, normalizedRequest, inputResolution: { action: 'config' } })) : undefined });
  await ui.change('configuration', 'events { worker_connections 1024; }'); await ui.submit();
  await until(() => treeNamed(ui, 'worker_connections') !== undefined && cardsIn(turnsOf(ui)[0]).length === 1);
  const card = cardsIn(turnsOf(ui)[0])[0];
  card.open = false;
  await treeNamed(ui, 'worker_connections').dispatchEvent({ type: 'click' });
  assert.equal(card.open, true);
  assert.equal(card.classList.contains('is-flash'), true);
  assert.equal(card.scrollIntoViewArgs.block, 'nearest');
  assert.ok(hasClass(card, 'is-selected'));
});

test('资料库定位时若右栏停在旧轮，切回持有该卡片的当前对象轮次', async () => {
  const published = publishedRelease();
  const gzipId = 'nginx--ngx_http_gzip_filter_module--gzip';
  const eventsRequest = { input: 'events { worker_connections 1024; }', mode: 'fragment', question: '默认值？', release: published };
  const httpRequest = { input: 'http { gzip on; }', mode: 'fragment', question: '功能？', release: published };
  let round = 0;
  const ui = await start({ originalApp: true, api: request => {
    if (request.path !== '/api/run') return undefined;
    round += 1;
    return round === 1
      ? reply(cardReport(entryId, '默认 1024', { knowledgeVersion: { release: published }, normalizedRequest: eventsRequest, inputResolution: { action: 'config' } }))
      : reply(cardReport(gzipId, '默认关闭', { knowledgeVersion: { release: published }, normalizedRequest: httpRequest, inputResolution: { action: 'config' } }));
  } });
  await ui.change('configuration', 'events { worker_connections 1024; }'); await ui.submit();
  await ui.change('configuration', 'http { gzip on; }'); await ui.submit();
  await until(() => treeNamed(ui, 'gzip') !== undefined && turnsOf(ui).length === 2);
  const [first, second] = turnsOf(ui);
  // 用户停在第 1 轮：右栏对象仍是第 2 轮，资料库点选 gzip 应切回第 2 轮。
  await tabFor(ui, first).dispatchEvent({ type: 'click' });
  assert.equal(first.hidden, false);
  await treeNamed(ui, 'gzip').dispatchEvent({ type: 'click' });
  assert.equal(second.hidden, false);
  assert.equal(first.hidden, true);
  assert.ok(cardsIn(second).some(card => card.dataset.entryId === gzipId && card.open === true));
});

test('资料库点选没有对应卡片的指令时只发出选中事件，不报错、不改变当前轮', async () => {
  const published = publishedRelease();
  const twoBlocks = 'events { worker_connections 1024; }\nhttp { gzip on; }';
  // 回答只覆盖 worker_connections 一条卡片；资料库里的 gzip 没有卡片。
  const ui = await start({ originalApp: true, api: request => request.path === '/api/run'
    ? reply(cardReport(entryId, '默认 1024', { knowledgeVersion: { release: published }, normalizedRequest: { input: twoBlocks, mode: 'fragment', release: published }, inputResolution: { action: 'config' } })) : undefined });
  const seen = [];
  ui.document.addEventListener('directive-select', event => seen.push(event.detail));
  await ui.change('configuration', twoBlocks); await ui.submit();
  await until(() => treeNamed(ui, 'gzip') !== undefined && turnsOf(ui).length === 1);
  const turn = turnsOf(ui)[0];
  await treeNamed(ui, 'gzip').dispatchEvent({ type: 'click' });
  assert.equal(seen.at(-1).entryId, 'nginx--ngx_http_gzip_filter_module--gzip');
  assert.equal(seen.at(-1).source, 'library');
  assert.equal(turnsOf(ui)[0], turn);
  assert.equal(cardsIn(turn).length, 1);
});

// ---------- 第二步审核修复：同对象多轮点选、同名指令待处理口径、目录筛选/防抖/懒构建 ----------

// 资料库里同名指令的所有行（同一指令可能在块内出现多次）。
const rowsNamed = (ui, name) => treeMains(ui).filter(main => byClass(main, 'tree-name')[0]?.textContent === name);

test('同对象两轮都持卡：资料库点选落在当前选中轮；选中轮是旧的持卡轮时不切走', async () => {
  const published = publishedRelease();
  const eventsRequest = { input: 'events { worker_connections 1024; }', mode: 'fragment', question: '默认值？', release: published };
  const ui = await start({ originalApp: true, api: request => request.path === '/api/run'
    ? reply(cardReport(entryId, '默认 1024', { knowledgeVersion: { release: published }, normalizedRequest: eventsRequest, inputResolution: { action: 'config' } })) : undefined });
  // 第二轮提交同一对象（analysisKey 相同），右侧不会被替换，两轮都挂在同一份识别结果上。
  await ui.change('configuration', eventsRequest.input); await ui.submit();
  await ui.change('configuration', eventsRequest.input); await ui.submit();
  await until(() => turnsOf(ui).length === 2 && turnsOf(ui).every(turn => cardsIn(turn).length === 1) && rowsNamed(ui, 'worker_connections').length === 1);
  const [first, second] = turnsOf(ui);
  // 轮次记录（agent.mjs 的 turns）上的对象键必须相同且非空，这正是“同对象”的前提。
  const keys = ui.page('turns.map(turn => turn.analysisKey)');
  assert.equal(keys.length, 2);
  assert.ok(keys[0] && keys[0] === keys[1]);
  // 默认选中新轮：点选资料库落在新轮（它也持卡）。
  await rowsNamed(ui, 'worker_connections')[0].dispatchEvent({ type: 'click' });
  assert.equal(second.hidden, false);
  assert.equal(first.hidden, true);
  // 用户手动切到旧轮（同样持卡）：再点选不能被切回新轮。
  await tabFor(ui, first).dispatchEvent({ type: 'click' });
  assert.equal(first.hidden, false);
  await rowsNamed(ui, 'worker_connections')[0].dispatchEvent({ type: 'click' });
  assert.equal(first.hidden, false);
  assert.equal(second.hidden, true);
  assert.ok(cardsIn(first).some(card => card.dataset.entryId === entryId && card.open === true));
});

test('同对象的选中轮不持卡（回答未覆盖该指令）时，资料库点选切到最近持卡的同对象轮次', async () => {
  const published = publishedRelease();
  const eventsRequest = { input: 'events { worker_connections 1024; }', mode: 'fragment', question: '默认值？', release: published };
  let round = 0;
  const ui = await start({ originalApp: true, api: request => {
    if (request.path !== '/api/run') return undefined;
    round += 1;
    // 第二轮同对象，但模型没有为它给出任何字段：该轮没有卡片。
    return round === 1
      ? reply(cardReport(entryId, '默认 1024', { knowledgeVersion: { release: published }, normalizedRequest: eventsRequest, inputResolution: { action: 'config' } }))
      : reply(report({ knowledgeVersion: { release: published }, normalizedRequest: eventsRequest, inputResolution: { action: 'config' }, modelSelection: { resolvedFacts: [], citations: [] } }));
  } });
  await ui.change('configuration', eventsRequest.input); await ui.submit();
  await ui.change('configuration', eventsRequest.input); await ui.submit();
  await until(() => turnsOf(ui).length === 2 && rowsNamed(ui, 'worker_connections').length === 1 && cardsIn(turnsOf(ui)[0]).length === 1);
  const [first, second] = turnsOf(ui);
  assert.equal(cardsIn(second).length, 0);
  assert.equal(second.hidden, false);
  await rowsNamed(ui, 'worker_connections')[0].dispatchEvent({ type: 'click' });
  assert.equal(first.hidden, false);
  assert.equal(second.hidden, true);
  assert.ok(cardsIn(first).some(card => card.dataset.entryId === entryId && card.open === true));
});

test('同名指令多次出现：任一行需关注，回答卡即待处理（口径偏宽）；同名只出现一次的唯一匹配则不待处理', async () => {
  const published = publishedRelease();
  // 第二行是顶层 worker_connections，没有 events 上下文，不是唯一匹配，需关注。
  const twice = 'events { worker_connections 1024; }\nworker_connections 2048;';
  const once = 'events { worker_connections 1024; }';
  const make = input => start({ originalApp: true, api: request => request.path === '/api/run'
    ? reply(cardReport(entryId, '默认 1024', { knowledgeVersion: { release: published }, normalizedRequest: { input, mode: 'fragment', question: '默认值？', release: published }, inputResolution: { action: 'config' } })) : undefined });
  const ui = await make(twice);
  await ui.change('configuration', twice); await ui.submit();
  // 等识别结果写入（parsedKey 为字符串即表示 agent-parsed 已处理），再看卡片与资料库行。
  await until(() => rowsNamed(ui, 'worker_connections').length === 2 && typeof ui.page('parsedKey') === 'string' && cardsIn(turnsOf(ui)[0]).length === 1);
  const [good, warn] = rowsNamed(ui, 'worker_connections');
  assert.ok(hasClass(byClass(good, 'status-dot')[0], 'status-dot-good'));
  assert.ok(hasClass(byClass(warn, 'status-dot')[0], 'status-dot-warn'));
  const card = cardsIn(turnsOf(ui)[0])[0];
  assert.equal(card.dataset.attention, 'true');
  assert.match(tabFor(ui, turnsOf(ui)[0]).textContent, /待处理 1/);

  const solo = await make(once);
  await solo.change('configuration', once); await solo.submit();
  await until(() => rowsNamed(solo, 'worker_connections').length === 1 && typeof solo.page('parsedKey') === 'string' && cardsIn(turnsOf(solo)[0]).length === 1);
  assert.equal(cardsIn(turnsOf(solo)[0])[0].dataset.attention, 'false');
  assert.doesNotMatch(tabFor(solo, turnsOf(solo)[0]).textContent, /待处理/);
});

test('全部目录：来源、context、阶段、模块任一筛选生效都自动展开命中组并构建；清除后只保留用户自己的展开记录', async () => {
  const ui = await start({ originalApp: true });
  await toggleGroup(ui, 'ngx_event_core_module');
  const phase = indexEntries.flatMap(entry => entry.phases)[0];
  const scenarios = [
    ['context', 'catalog-context', 'http', entry => entry.contexts.includes('http')],
    ['阶段', 'catalog-phase', phase, entry => entry.phases.includes(phase)],
    ['来源', 'catalog-source', 'department_extension', entry => (entry.source?.kind ?? 'bundled') === 'department_extension'],
    ['模块', 'catalog-module', 'ngx_http_gzip_filter_module', entry => entry.module === 'ngx_http_gzip_filter_module'],
  ];
  for (const [label, id, value, predicate] of scenarios) {
    const expected = indexEntries.filter(predicate);
    assert.ok(expected.length > 0, label);
    ui.nodes.get(id).value = value;
    await ui.nodes.get(id).dispatchEvent({ type: 'change' });
    assert.deepEqual(groupsOf(ui).map(group => group.dataset.module).sort(), [...new Set(expected.map(entry => entry.module))].sort(), label);
    assert.ok(groupsOf(ui).every(group => group.open === true), label);
    assert.equal(catalogButtonsOf(ui).length, expected.length, label);
    assert.equal(catalogTotalOf(ui), expected.length, label);
    await ui.nodes.get('catalog-reset').dispatchEvent({ type: 'click' });
    // 清除后：用户自己展开的 ngx_event_core_module 仍展开；其余组收起，且不构建按钮。
    assert.deepEqual(groupsOf(ui).filter(group => group.open).map(group => group.dataset.module), ['ngx_event_core_module'], label);
    assert.equal(catalogButtonsOf(ui).length, groupCountOf(groupNamed(ui, 'ngx_event_core_module')), label);
  }
});

test('全部目录：搜索输入防抖 120ms，连续输入只整表重建一次；立即渲染会取消挂起的防抖', async () => {
  const ui = await start({ originalApp: true });
  // 统计整表重建次数：包一层 renderCatalog（页面内的调用都按名字查找全局函数，会走到包装）。
  ui.page('globalThis.__catalogRenders = 0; { const real = renderCatalog; renderCatalog = (...args) => { __catalogRenders += 1; return real(...args); }; }');
  const renders = () => ui.page('__catalogRenders');
  const base = renders();
  const search = ui.nodes.get('catalog-search');
  for (const value of ['l', 'lu', 'lua']) { search.value = value; await search.dispatchEvent({ type: 'input' }); }
  assert.equal(renders(), base);
  assert.equal(ui.nodes.get('catalog-count').textContent, String(indexEntries.length));
  // 唯一一处真实等待：确认防抖确实由计时器触发，且只触发一次。
  await until(() => renders() === base + 1);
  assert.equal(renders(), base + 1);
  const luaCount = indexEntries.filter(entry => `${entry.name} ${entry.module} ${entry.component}`.toLowerCase().includes('lua')).length;
  assert.equal(ui.nodes.get('catalog-count').textContent, String(luaCount));
  // 挂起时立即渲染：取消计时器，只渲染这一次。
  search.value = 'worker'; await search.dispatchEvent({ type: 'input' });
  assert.notEqual(ui.page('catalogSearchTimer'), null);
  flushCatalog(ui);
  assert.equal(renders(), base + 2);
  assert.equal(ui.page('catalogSearchTimer'), null);
  flushCatalog(ui);
  assert.equal(renders(), base + 2);
  // 清除按钮是立即操作，也会取消挂起的防抖。
  search.value = 'proxy'; await search.dispatchEvent({ type: 'input' });
  await ui.nodes.get('catalog-reset').dispatchEvent({ type: 'click' });
  assert.equal(ui.page('catalogSearchTimer'), null);
  assert.equal(renders(), base + 3);
});

test('全部目录：收起的模块组不构建条目按钮；首次展开才构建且不重复；构建时带上当前选中高亮', async () => {
  const ui = await start({ originalApp: true });
  assert.equal(catalogButtonsOf(ui).length, 0);
  assert.equal(catalogTotalOf(ui), indexEntries.length);
  // 先在资料库选中一条指令，此时目录里还没有它的按钮。
  await localQuery(ui, 'config', 'events { worker_connections 1024; }');
  await treeNamed(ui, 'worker_connections').dispatchEvent({ type: 'click' });
  const group = await toggleGroup(ui, 'ngx_event_core_module');
  assert.equal(catalogButtonsOf(ui).length, groupCountOf(group));
  // 首次构建时就带上选中高亮（refreshSelectionHighlight 在构建后执行）。
  const selected = catalogButtonsOf(ui).find(node => node.dataset.id === entryId);
  assert.ok(hasClass(selected, 'active'));
  assert.equal(selected.getAttribute('aria-current'), 'true');
  // 收起再展开：按钮已经构建过，不重复追加。
  await toggleGroup(ui, 'ngx_event_core_module');
  await toggleGroup(ui, 'ngx_event_core_module');
  assert.equal(catalogButtonsOf(ui).length, groupCountOf(group));
});

test('全部目录：筛选重建后，旧表分组迟到的 toggle 不写入新表，也不改动用户的展开记录', async () => {
  const ui = await start({ originalApp: true });
  const stale = groupNamed(ui, 'ngx_event_core_module');
  // 搜索触发整表重建：旧分组节点已脱离目录。
  await searchCatalog(ui, 'worker');
  assert.notEqual(groupNamed(ui, 'ngx_event_core_module'), stale);
  // 旧节点的 toggle 迟到到达：不应把该组记为用户展开。
  stale.open = true;
  await stale.dispatchEvent({ type: 'toggle' });
  await searchCatalog(ui, '');
  assert.ok(groupsOf(ui).every(group => group.open === false));
  assert.equal(catalogButtonsOf(ui).length, 0);
});

// 浏览器回归脚本不在 npm test 里（需要外部 TaskSpace 驱动），这里做静态扫描：不得再引用已删除的 id/class，
// 否则脚本会在等待一个永远不存在的节点时超时，且失败信息不指向真正原因。
test('浏览器回归与分析脚本不引用已删除的 id/class，且这些 id 在页面中确已删除', () => {
  const removedIds = ['parsed-fold', 'parsed-results', 'parsed-count', 'browse-all', 'catalog-scope'];
  const removedClasses = ['.parsed-row', '.catalog-toolbar', '.step-catalog', '.step-reference'];
  const scripts = ['test/browser/query-ui.mjs', 'test/browser/query-ui-async.mjs', 'test/browser/website.mjs', 'test/browser/content.mjs', 'test/browser/accuracy.mjs', 'test/browser/ndk.mjs', 'analysis/verify-extension-browser.mjs'];
  for (const id of removedIds) assert.doesNotMatch(html, new RegExp(`id="${id}"`), `页面仍有 #${id}`);
  for (const script of scripts) {
    const source = read(script);
    for (const id of removedIds) assert.ok(!source.includes(`#${id}`), `${script} 仍引用 #${id}`);
    for (const cls of removedClasses) assert.ok(!source.includes(cls), `${script} 仍引用 ${cls}`);
  }
});

// ---------- 第三步：会话菜单、隐私提示、“关于”弹层与左栏/顶栏布局 ----------
const css = read('site/styles.css');
// 判断 node 是否位于 root 之内（沿 parentNode 向上）。假 DOM 没有 contains，这里自己实现。
const s3Within = (root, node) => { for (let current = node; current; current = current.parentNode) if (current === root) return true; return false; };
// 构造 keydown 事件：记录是否被 preventDefault / stopPropagation，用于断言 Esc 不冒泡到文档层。
const s3Key = key => ({ type: 'keydown', key, defaultPrevented: false, propagated: true, preventDefault() { this.defaultPrevented = true; }, stopPropagation() { this.propagated = false; } });
// 指针事件：从文档层派发，target 决定“点在菜单内还是菜单外”。
const s3Pointer = (ui, target) => ui.document.dispatchEvent({ type: 'pointerdown', target });

// 把会话菜单的 HTML 嵌套还原到假 DOM 中（假 DOM 不解析 HTML，只能靠 append 建立父子关系）。
function s3MountMenu(ui) {
  const n = id => ui.nodes.get(id);
  n('session-bar').append(n('session-menu-toggle'), n('session-title'), n('agent-retry'), n('session-menu'));
  n('session-menu').append(n('agent-session'), n('agent-new'), n('agent-restore'), n('agent-history'));
  n('agent-history').append(n('agent-history-list'));
}
// 把“关于”弹层的 HTML 嵌套还原到假 DOM 中。
function s3MountAbout(ui) {
  const n = id => ui.nodes.get(id);
  n('about-wrap').append(n('about-toggle'), n('about-popover'));
  n('about-popover').append(n('about-title'), n('about-close'), n('coverage-gaps'));
}

test('第三步：会话工具收进“会话 ▾”菜单，按钮与弹层 aria 完整，默认收起；重新检测服务留在栏上', async () => {
  // 静态属性与嵌套结构以 HTML 为准（假 DOM 不解析属性）。
  const bar = html.slice(html.indexOf('id="session-bar"'), html.indexOf('<div class="privacy-note">'));
  assert.match(html, /<button id="session-menu-toggle" class="session-menu-toggle" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="session-menu">会话 ▾<\/button>/);
  assert.match(html, /<div id="session-menu" class="session-menu" role="dialog" aria-label="会话菜单" hidden>/);
  const menu = html.slice(html.indexOf('<div id="session-menu"'), html.indexOf('</details>', html.indexOf('id="agent-history"')) + 10);
  for (const id of ['agent-session', 'agent-new', 'agent-restore', 'agent-history', 'agent-history-list']) assert.ok(menu.includes(`id="${id}"`), id);
  assert.equal(menu.includes('id="agent-retry"'), false);
  assert.ok(bar.includes('id="agent-retry"') && bar.includes('id="session-title"'));
  // 运行时：初始状态与 aria-expanded 同步。
  const ui = await start({ sessions: [item(sessionId, '旧会话')] });
  assert.equal(ui.nodes.get('session-menu-toggle').getAttribute('aria-expanded'), 'false');
  assert.equal(ui.nodes.get('session-menu').hidden, true);
});

test('会话菜单：点击打开并把焦点移到“新会话”，再次点击收起，aria-expanded 同步', async () => {
  const ui = await start();
  const toggle = ui.nodes.get('session-menu-toggle');
  const panel = ui.nodes.get('session-menu');
  ui.click('session-menu-toggle');
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(panel.hidden, false);
  assert.equal(ui.document.activeElement, ui.nodes.get('agent-new'));
  ui.click('session-menu-toggle');
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(panel.hidden, true);
});

test('会话菜单：Esc 收起并把焦点还给按钮，且阻止冒泡（不误关右侧抽屉）；菜单收起时 Esc 不拦截', async () => {
  const ui = await start();
  const toggle = ui.nodes.get('session-menu-toggle');
  // 收起时按 Esc：不处理、不阻止冒泡，让其它层（如右侧抽屉）照常响应。
  const idle = s3Key('Escape');
  await ui.nodes.get('session-bar').dispatchEvent(idle);
  assert.equal(idle.propagated, true);
  ui.click('session-menu-toggle');
  const event = s3Key('Escape');
  await ui.nodes.get('session-bar').dispatchEvent(event);
  assert.equal(event.defaultPrevented, true);
  assert.equal(event.propagated, false);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(ui.nodes.get('session-menu').hidden, true);
  assert.equal(ui.document.activeElement, toggle);
});

test('会话菜单：点菜单外关闭且不抢焦点；点菜单内不关闭；监听只在打开期间挂载并在关闭时摘除', async () => {
  const ui = await start();
  s3MountMenu(ui);
  const toggle = ui.nodes.get('session-menu-toggle');
  const panel = ui.nodes.get('session-menu');
  ui.click('session-menu-toggle');
  assert.equal(ui.listeners.get('pointerdown')?.length, 1);
  s3Pointer(ui, ui.nodes.get('agent-history-list'));
  assert.equal(panel.hidden, false, '点菜单内不应关闭');
  s3Pointer(ui, ui.nodes.get('configuration'));
  assert.equal(panel.hidden, true);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.notEqual(ui.document.activeElement, toggle, '点外部关闭不应抢焦点');
  assert.equal(ui.listeners.get('pointerdown').length, 0);
});

test('会话菜单：反复开关与重复打开不堆积 pointerdown 监听，连续触发窗口变化也只收起一次', async () => {
  const resizers = [];
  const ui = await start({ globals: { addEventListener: (type, handler) => { if (type === 'resize') resizers.push(handler); } } });
  for (let i = 0; i < 5; i++) { ui.click('session-menu-toggle'); ui.click('session-menu-toggle'); }
  assert.equal(ui.listeners.get('pointerdown')?.length ?? 0, 0);
  ui.click('session-menu-toggle');
  // 打开中再次触发同一状态的同步（如 resize 收起前的重复调用）不得新增监听。
  for (const handler of resizers) handler({ type: 'resize' });
  for (const handler of resizers) handler({ type: 'resize' });
  assert.equal(ui.nodes.get('session-menu').hidden, true);
  assert.equal(ui.listeners.get('pointerdown').length, 0);
  assert.equal(ui.nodes.get('session-menu-toggle').getAttribute('aria-expanded'), 'false');
});

test('会话菜单内的新会话仍清空会话、保留输入，恢复会话按钮随会话状态启停', async () => {
  const ui = await start({ stored: sessionId, sessions: [item(sessionId, '当前会话')] });
  await until(() => ui.nodes.get('session-title').textContent === '当前会话');
  assert.equal(ui.nodes.get('agent-restore').disabled, false);
  ui.click('session-menu-toggle');
  ui.click('agent-new');
  assert.equal(ui.saved.has(storageKey), false);
  assert.equal(ui.nodes.get('session-title').textContent, '未开始');
  assert.equal(ui.nodes.get('agent-restore').disabled, true);
  assert.equal(ui.nodes.get('configuration').value, 'worker_connections');
});

test('会话菜单：当前会话标题在按钮旁按码点省略，完整标题只放在 title 提示里；没有会话与列表未到时有明确文案', async () => {
  const long = '😀'.repeat(40);
  const ui = await start({ stored: sessionId, sessions: [item(sessionId, long)] });
  await until(() => ui.nodes.get('session-title').textContent.endsWith('…'));
  const shown = ui.nodes.get('session-title').textContent;
  assert.equal(shown, `${'😀'.repeat(36)}…`);
  assert.equal(Array.from(shown).length, 37);
  assert.equal(ui.nodes.get('session-title').title, long);
  // 恰好 36 个码点不加省略号。
  const exact = await start({ stored: sessionId, sessions: [item(sessionId, '😀'.repeat(36))] });
  await until(() => exact.nodes.get('session-title').textContent !== '标题待刷新');
  assert.equal(exact.nodes.get('session-title').textContent, '😀'.repeat(36));
  // 列表里没有该会话：提示待刷新，不误写成“未开始”。空标题显示“未命名会话”。
  const missing = await start({ stored: sessionId, sessions: [] });
  await until(() => missing.requests.some(request => request.path === '/api/sessions'));
  assert.equal(missing.nodes.get('session-title').textContent, '标题待刷新');
  const unnamed = await start({ stored: sessionId, sessions: [item(sessionId, '')] });
  await until(() => unnamed.nodes.get('session-title').textContent === '未命名会话');
  const none = await start();
  assert.equal(none.nodes.get('session-title').textContent, '未开始');
});

test('会话菜单：列表标题仍按文本换行显示，不沿用顶栏“当前标题”的省略样式', () => {
  assert.match(css, /\.session-bar > \.session-title \{[^}]*text-overflow: ellipsis;/);
  assert.match(css, /\.session-history \.session-title \{ color: var\(--ink-soft\); overflow-wrap: anywhere; \}/);
  assert.doesNotMatch(css, /\.session-bar \.session-title/);
});

test('会话菜单收起时，登录失效仍在“会话 ▾”按钮上给出提示色，状态文字指向菜单里的恢复会话', async () => {
  const ui = await start({ stored: sessionId, api: request => request.path === '/api/status' ? reply({ error: '登录已失效' }, 401) : undefined });
  await until(() => ui.nodes.get('session-menu-toggle').classList.contains('needs-attention'));
  assert.equal(ui.nodes.get('session-menu').hidden, true);
  assert.match(ui.nodes.get('agent-status').textContent, /“会话 ▾”菜单.*恢复会话/);
  assert.equal(ui.nodes.get('session-menu-toggle').getAttribute('aria-expanded'), 'false');
});

test('隐私提示压缩为一行短句，完整原文保留在默认折叠的“了解详情”中，且与需求/架构文档的语义一致', () => {
  const block = html.slice(html.indexOf('<div class="privacy-note">'), html.indexOf('<details class="local-query-options">'));
  const full = '提交后，整段内容（含配置原文）会发送到服务端 Pi 及所配置的模型，并保存会话用于追问；回答里的说明与源码均取自固定版本知识库。';
  assert.ok(block.includes(full), '完整原文必须保留');
  assert.match(block, /<details class="privacy-more">/);
  assert.doesNotMatch(block, /<details class="privacy-more"[^>]*open/);
  assert.match(block, /<summary>了解详情<\/summary>/);
  const shortLine = block.slice(block.indexOf('<span>') + 6, block.indexOf('</span>'));
  for (const part of ['整段内容（含配置原文）', '发送', '并保存会话', '未自动脱敏', '请勿粘贴密钥或证书']) assert.ok(shortLine.includes(part), part);
  // 与现行文档一致：架构与需求都写明配置原文会送往模型、输入未自动脱敏，不承诺自动脱敏。
  assert.match(read('ARCHITECTURE.md'), /输入未自动脱敏/);
  assert.match(read('REQUIREMENTS.md'), /不承诺自动脱敏/);
});

test('仅本地查询默认折叠，摘要行紧凑（名称 + 一行提示），表单内容未删减', () => {
  const block = html.slice(html.indexOf('<details class="local-query-options">'), html.indexOf('</details>', html.indexOf('<details class="local-query-options">')));
  assert.doesNotMatch(block.slice(0, block.indexOf('>') + 1), /open/);
  assert.match(block, /<summary>仅本地查询<span class="summary-hint">不调用 Agent<\/span><\/summary>/);
  for (const id of ['query-form', 'input-mode', 'query-context', 'query-module', 'query-submit']) assert.ok(html.includes(`id="${id}"`), id);
});

test('输入框可上下拖动：resize 为 vertical，有合理的 min/max-height，默认 rows 适中，仍是同一个输入框', () => {
  const rule = css.slice(css.indexOf('\ntextarea {') + 1, css.indexOf('}', css.indexOf('\ntextarea {')) + 1);
  assert.match(rule, /resize: vertical/);
  assert.match(rule, /min-height: \d+px/);
  // 最高 min(45vh, 420px)：拖到最大时资料库不至于被整体推到首屏之下（见下方“跳到资料库”测试）。
  assert.match(rule, /max-height: min\(45vh, 420px\)/);
  assert.match(html, /<textarea id="configuration" spellcheck="false" rows="5"/);
  assert.equal((html.match(/<textarea/g) ?? []).length, 1);
});

test('左栏：输入区按内容占位，资料库占用剩余高度并只在自身列表区域滚动；窄屏单列时限高 60vh', () => {
  assert.match(css, /\.pane-left \{[^}]*display: flex; flex-direction: column;/);
  assert.match(css, /\.pane-left > \.step-ask \{ flex: none;/);
  assert.match(css, /\.library-panel \{[^}]*flex: 1 1 auto;[^}]*min-height: max\(540px, 62vh\);/);
  assert.match(css, /\.library-panel > \.library-tabpanel \{ flex: 1 1 0; min-height: 0; \}/);
  assert.match(css, /\.library-tabpanel \{\s*overflow: auto;/);
  assert.match(css, /@media \(max-width: 960px\) \{[\s\S]*?\.pane-left \{ display: block; \}[\s\S]*?\.library-tabpanel \{ max-height: 60vh; flex: none; \}/);
});

test('页脚已移入顶栏“关于”弹层：页面不再有 footer，原覆盖范围、发布号与提示文字仍在弹层内', () => {
  assert.doesNotMatch(html, /<footer/);
  assert.doesNotMatch(css, /\bfooter \{/);
  const pop = html.slice(html.indexOf('id="about-popover"'), html.indexOf('</header>'));
  for (const id of ['registration-count', 'verified-count', 'coverage-note', 'coverage-groups', 'coverage-gaps', 'release-label']) assert.ok(pop.includes(`id="${id}"`), id);
  assert.match(pop, /知识范围与待验收事项/);
  assert.match(pop, /知识用于理解与追溯，不替代运行环境检查。/);
});

test('“关于”弹层：默认收起，aria 完整，展示覆盖范围与发布号，Esc 与点外部关闭，焦点按规则还原', async () => {
  // 静态属性以 HTML 为准；运行时的 hidden 与 aria-expanded 由脚本同步。
  assert.match(html, /<button id="about-toggle" class="pill about-toggle" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="about-popover">关于<\/button>/);
  assert.match(html, /<div id="about-popover" class="about-popover" role="dialog" aria-labelledby="about-title" hidden>/);
  const ui = await start({ originalApp: true });
  s3MountAbout(ui);
  await until(() => ui.nodes.get('release-label').textContent !== '');
  const toggle = ui.nodes.get('about-toggle');
  const pop = ui.nodes.get('about-popover');
  const index = JSON.parse(read('dist/knowledge/index.json'));
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(pop.hidden, true);
  assert.equal(ui.nodes.get('registration-count').textContent, String(index.coverage.registration_count));
  assert.equal(ui.nodes.get('verified-count').textContent, String(index.coverage.basic_verified_count));
  assert.equal(ui.nodes.get('release-label').textContent, `RELEASE / ${index.release_id}`);
  assert.ok(ui.nodes.get('coverage-gaps').children.length > 0);
  // 打开：焦点进入弹层标题；Esc 收起、阻止冒泡、焦点回到按钮。
  ui.click('about-toggle');
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(pop.hidden, false);
  assert.equal(ui.document.activeElement, ui.nodes.get('about-title'));
  const esc = s3Key('Escape');
  await ui.nodes.get('about-wrap').dispatchEvent(esc);
  assert.equal(esc.propagated, false);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(pop.hidden, true);
  assert.equal(ui.document.activeElement, toggle);
  // 点外部关闭，不抢焦点。
  ui.click('about-toggle');
  s3Pointer(ui, ui.nodes.get('configuration'));
  assert.equal(pop.hidden, true);
  assert.notEqual(ui.document.activeElement, toggle);
  assert.equal(ui.listeners.get('pointerdown').length, 0);
  // 关闭按钮：收起并回到“关于”按钮；点弹层内部不关闭。
  ui.click('about-toggle');
  s3Pointer(ui, ui.nodes.get('coverage-gaps'));
  assert.equal(pop.hidden, false);
  ui.click('about-close');
  assert.equal(pop.hidden, true);
  assert.equal(ui.document.activeElement, toggle);
});

test('“关于”弹层：反复开关不堆积 pointerdown 监听；Esc 只关闭弹层，不影响右侧抽屉的 Esc 处理', async () => {
  const ui = await start({ originalApp: true });
  s3MountAbout(ui);
  for (let i = 0; i < 5; i++) { ui.click('about-toggle'); ui.click('about-toggle'); }
  assert.equal(ui.listeners.get('pointerdown')?.length ?? 0, 0);
  ui.click('about-toggle');
  assert.equal(ui.listeners.get('pointerdown').length, 1);
  ui.click('about-toggle');
  assert.equal(ui.listeners.get('pointerdown').length, 0);
});

test('390 宽顶栏：品牌名单行省略、药丸区横向滚动、“关于”不在滚动容器内，顶栏高度在 56px 以内所需的规则齐全', () => {
  const mobileStart = css.indexOf('@media (max-width: 720px)');
  const media = css.slice(mobileStart, css.indexOf('\n}\n', mobileStart));
  assert.match(media, /\.topbar \{ height: auto; min-height: 0; padding: 3px 12px;/);
  assert.match(media, /\.brand-text strong \{ display: block; min-width: 0; font-size: \.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; \}/);
  assert.match(media, /\.topbar \.pill \{ line-height: 1\.4; padding: 1px 9px; \}/);
  assert.match(css, /\.topbar-pills \{ display: flex;[^}]*overflow-x: auto;/);
  assert.match(css, /\.about-wrap \{ position: relative; display: flex;/);
  // 药丸区是独立的滚动容器，“关于”按钮与弹层位于它之外，弹层不会被裁切。
  const pills = html.slice(html.indexOf('<div class="topbar-pills">'), html.indexOf('<div id="about-wrap"'));
  assert.equal((pills.match(/<div/g) ?? []).length, (pills.match(/<\/div>/g) ?? []).length);
});

test('窄屏“会话 ▾”菜单贴会话栏整行展开，不锚在右端，避免被左栏左边缘裁掉', () => {
  assert.match(css, /\.session-bar \{[^}]*flex: 1 1 100%;/);
  assert.match(css, /\.session-menu \{[^}]*left: 0; right: auto;/);
  assert.match(css, /@media \(max-width: 960px\) \{[\s\S]*?\.session-menu \{ left: 0; right: 0; width: auto; \}/);
});

// ---------- 界面优化（2026-10-21）：资料库可视高度、跳到资料库、窄屏药丸渐隐、会话菜单节流 ----------

test('资料库可视高度：最小高度随视口放大，低矮视口下工具区不吸顶，输入框最高 min(45vh, 420px)', () => {
  // 标签栏与工具区会占掉大量高度；最小高度取 max(540px, 62vh)，保证滚动到资料库后列表仍有约 300px（真实渲染实测见 IMPLEMENTATION_PLAN.md）。
  assert.match(css, /\.library-panel \{[^}]*min-height: max\(540px, 62vh\);/);
  // 工具区在正常高度仍吸顶；窗口高度低于 800px 时不吸顶，避免遮住列表。
  assert.match(css, /\.library-tools \{\s*position: sticky;/);
  assert.match(css, /@media \(max-height: 799px\) \{\s*\.library-tools \{ position: static; \}\s*\}/);
  assert.match(css, /\n\s*textarea \{[\s\S]*?max-height: min\(45vh, 420px\);/);
});

test('“跳到资料库”在会话栏内：点击滚动到资料库，焦点移到当前标签，且不改变标签选择', async () => {
  assert.match(html, /<button id="library-jump" class="library-jump" type="button" aria-controls="library">跳到资料库<span aria-hidden="true"> ↓<\/span><\/button>/);
  const bar = html.slice(html.indexOf('id="session-bar"'), html.indexOf('<div class="privacy-note">'));
  assert.ok(bar.includes('id="library-jump"'), '入口应位于会话栏内');
  const ui = await start({ originalApp: true });
  ui.click('library-tab-reference');
  ui.click('library-jump');
  // 上下文对象来自 vm，不能用 deepEqual（原型不同），逐字段比较。
  const args = ui.nodes.get('library').scrollIntoViewArgs;
  assert.equal(args.block, 'start');
  assert.equal(args.behavior, 'auto');
  assert.equal(ui.document.activeElement, ui.nodes.get('library-tab-reference'), '焦点应落在当前标签');
  assert.equal(ui.nodes.get('library-tab-reference').getAttribute('aria-selected'), 'true');
  assert.equal(ui.nodes.get('library-panel-reference').hidden, false);
  assert.equal(ui.nodes.get('library-panel-catalog').hidden, true);
});

test('窄屏（≤720px）顶栏药丸区右侧渐隐，写法与轮次标签一致', () => {
  const mobile = css.slice(css.indexOf('@media (max-width: 720px)'));
  assert.match(mobile, /\.topbar-pills \{\s*-webkit-mask-image: linear-gradient\(to right, #000 calc\(100% - 28px\), transparent\);\s*mask-image: linear-gradient\(to right, #000 calc\(100% - 28px\), transparent\);\s*padding-right: 24px;\s*\}/);
  assert.match(css, /\.agent-turn-tabs \{[\s\S]*?mask-image: linear-gradient\(to right, #000 calc\(100% - 28px\), transparent\);/);
});

// 节流测试用的可控时钟（start 的 clock 选项只替换 Date.now）。
const throttleClock = { now: 0 };

test('会话菜单节流：1 秒内重复打开不再请求列表，超过 1 秒后再请求', async () => {
  throttleClock.now = 100000;
  const ui = await start({ clock: throttleClock, sessions: [item(sessionId, '当前')] });
  // 连接成功时已刷新过一次列表，这次刷新发生在“当前时钟”，之后 1 秒内的菜单打开不应重复请求。
  await until(() => ui.requests.some(request => request.path === '/api/sessions'));
  const listCount = () => ui.requests.filter(request => request.method === 'GET' && request.path === '/api/sessions').length;
  const before = listCount();
  ui.click('session-menu-toggle');
  ui.click('session-menu-toggle');
  ui.click('session-menu-toggle');
  await tick();
  assert.equal(listCount(), before, '1 秒内的重复打开不应再请求');
  throttleClock.now += 1000;
  ui.click('session-menu-toggle');
  ui.click('session-menu-toggle');
  await tick();
  assert.equal(listCount(), before + 1, '满 1 秒后打开应刷新一次');
});

test('会话菜单节流：列表请求在途时再次打开复用同一请求；历史会话展开与菜单共用节流', async () => {
  throttleClock.now = 200000;
  let hold = null;
  const ui = await start({ clock: throttleClock, sessions: [], api: request => request.path === '/api/sessions' && hold ? hold.promise : undefined });
  await until(() => ui.requests.some(request => request.path === '/api/sessions'));
  const listCount = () => ui.requests.filter(request => request.method === 'GET' && request.path === '/api/sessions').length;
  // 相隔 5 秒后打开：发出一个被挂起的列表请求。
  throttleClock.now += 5000;
  hold = deferred();
  const before = listCount();
  ui.click('session-menu-toggle');
  await tick();
  assert.equal(listCount(), before + 1);
  // 请求仍在途，且距离发起已超过 1 秒：再次打开仍应复用在途请求，而不是第二次发请求。
  throttleClock.now += 1500;
  ui.click('session-menu-toggle');
  ui.click('session-menu-toggle');
  await tick();
  assert.equal(listCount(), before + 1, '在途时应复用，不重复请求');
  // 展开“历史会话”同样走节流：距离上次发起不足 1 秒（测试中把时钟停在发起时刻）时不请求。
  hold.resolve(reply({ sessions: [item(sessionId, '复用后的列表')] }));
  await tick();
  assert.equal(ui.nodes.get('agent-history-list').children.length, 1);
  // 展开“历史会话”与打开菜单共用节流：距离上次发起已超过 1 秒，展开时刷新一次；同一时刻收起再展开不再请求。
  const history = ui.nodes.get('agent-history');
  history.open = true;
  history.dispatchEvent({ type: 'toggle' });
  await tick();
  assert.equal(listCount(), before + 2, '历史会话展开应刷新一次');
  history.open = false;
  history.dispatchEvent({ type: 'toggle' });
  history.open = true;
  history.dispatchEvent({ type: 'toggle' });
  await tick();
  assert.equal(listCount(), before + 2, '同一时刻再次展开不应再请求');
});
