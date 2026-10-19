import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { Spike, ROOT, loadConfig } from '../src/session.mjs';
import { serve } from '../server.mjs';
import { TOOL_NAMES } from '../src/knowledge-tools.mjs';
import { checkQuery, callWebSearch, filterResults, WEB_URL, WEB_PROMPT } from '../src/web-search.mjs';
import { applyRuntimeEnv } from '../src/runtime-config.mjs';
import { safeError } from '../src/errors.mjs';
import { MOCK_NGINX_URL, MOCK_NGINX_QUOTE } from '../src/mock-provider.mjs';
import { fixtures } from './fixtures/configs.mjs';

// 与 unified-input.test.mjs 相同的测试装配：每个用例独立状态目录，结束后释放大对象，避免同一文件内内存累积。
async function setup(t, overrides = {}) {
  await mkdir(join(ROOT, '.state'), { recursive: true });
  const dir = await mkdtemp(join(ROOT, '.state/web-search-'));
  const spike = await Spike.create({ stateDir: dir, mockDelayMs: 1, webSearch: true, ...overrides });
  t.after(async () => {
    await spike.close();
    spike.snapshot = null; spike.jobs.clear();
    if (spike.mock) { spike.mock.requests.length = 0; spike.mock.webCalls.length = 0; spike.mock.mcpDeletes.length = 0; }
    await rm(dir, { recursive: true, force: true });
  });
  const release = (await spike.ready()).release;
  return {
    spike, release,
    // 统一输入入口：经过意图阶段与字段阶段，与真实请求路径一致。
    run: async (message, id, extra = {}) => { const job = spike.start({ message, release, ...extra }, id); await job.done; return job; },
    // 原始配置入口：跳过意图阶段，便于直接验证字段阶段的联网行为。
    runRaw: async (request, id) => { const job = spike.start(request, id); await job.done; return job; },
  };
}
// 轮询等待测试状态出现，超时即失败，避免无限挂起。
async function waitFor(check) { for (let i = 0; i < 2000 && !check(); i++) await delay(5); assert.ok(check(), '等待测试状态超时'); }
const countCache = spike => readdir(join(spike.config.stateDir, 'cache')).then(files => files.filter(file => file.endsWith('.json')).length);
const selectionRequests = spike => spike.mock.requests.filter(request => request.phase === 'selection' || request.phase === 'field_selection');
const FORBIDDEN_TOOLS = ['bash', 'read', 'write', 'edit', 'unknown_tool'];
// 一段包含 upstream 名称的配置，用于验证查询词不能外发配置中的具体值。
const LEAK_CONFIG = 'http { upstream backend_pool { server 192.0.2.10:8080; } server { listen 80; location / { proxy_pass http://backend_pool; } } }';
const eventsRequest = (question, id) => ({ input: fixtures.events.input, mode: 'main', question, mockScenario: id });

test('查询检查：拒绝 IP、URL、非白名单域名、路径与配置具体值，放行指令名、模块名和版本号', () => {
  const configInput = LEAK_CONFIG;
  const allowedNames = ['http', 'upstream', 'server', 'listen', 'location', 'proxy_pass'];
  for (const query of ['203.0.113.5 timeout', 'https://nginx.org/en', 'example.com lua', 'nginx.org/en/docs', '/etc/nginx', 'backend_pool timeout', '::1 listen', 'proxy"x', 'a', 'x'.repeat(71)]) {
    assert.equal(typeof checkQuery(query, { configInput, allowedNames }), 'string', query);
  }
  for (const query of ['proxy_cache_lock_age nginx', 'ngx_http_proxy_module 1.27.1', 'openresty.org lua', 'upstream timeout', 'lua-nginx-module']) {
    assert.equal(checkQuery(query, { configInput, allowedNames }), null, query);
  }
  // 配置中的值（这里是 upstream 名称）即使与指令名无关也必须拒绝；指令名本身即使出现在配置中也允许。
  assert.match(checkQuery('backend_pool timeout', { configInput, allowedNames }), /配置中的具体值/);
  assert.equal(checkQuery('proxy_pass', { configInput, allowedNames }), null);
});

test('查询检查归一化：全角字母、全角数字 IP、拆分 IP、全角句号与百分号编码均被拒绝', () => {
  const opts = { configInput: LEAK_CONFIG, allowedNames: ['http', 'upstream', 'server'] };
  // 全角字母会被 NFKC 折为 ASCII 后再与配置比对，不能靠全角字符绕过防泄露。
  assert.match(checkQuery('ｂａｃｋｅｎｄ＿ｐｏｏｌ timeout', opts), /配置中的具体值/);
  assert.match(checkQuery('１９２．０．２．１０ timeout', opts), /IP/);
  for (const query of ['10 1 2 3', '10。1。2。3', '10．1．2．3']) assert.match(checkQuery(query, opts), /IP/, query);
  assert.match(checkQuery('backend%5Fpool', opts), /不允许的符号/);
  // 版本号 1.27.1 仍然允许，拆分检查只针对四段数字。
  assert.equal(checkQuery('ngx_http_proxy_module 1.27.1', opts), null);
});

test('查询检查防泄露语料：问题与上下文参与比对，短中文词不误伤，长中文片段被拒', () => {
  // 语料是配置原文、问题与上下文的拼接；问题里的 upstream 名称同样不能外发。
  const corpus = ['events {}', 'backend_pool 怎么样', ''].join('\n');
  assert.match(checkQuery('backend_pool timeout', { configInput: corpus, allowedNames: [] }), /配置中的具体值/);
  // 配置注释中的中文描述（长度不少于 4）若出现在查询中，视为外发了配置内容。
  assert.match(checkQuery('支付核心集群 nginx', { configInput: '# 支付核心集群\nhttp { server { listen 80; } }', allowedNames: [] }), /中文描述/);
  // 两字或三字的通用词不作为具体值比对。
  assert.equal(checkQuery('默认 nginx', { configInput: '# 默认值\nhttp {}', allowedNames: [] }), null);
});

test('查询检查误拒修复：公开技术词、非域名后缀与纯数字不参与配置比对', () => {
  // 配置中的 user nginx; 不应使 nginx proxy timeout 这类通用查询被拒。
  assert.equal(checkQuery('nginx proxy timeout', { configInput: 'http { server { user nginx; } }', allowedNames: [] }), null);
  // ngx.var.host、nginx.conf、ngx.timer.at 末段不是常见顶级域名，不当作域名。
  assert.equal(checkQuery('ngx.var.host openresty', { configInput: 'http { server { user nginx; } }', allowedNames: [] }), null);
  assert.equal(checkQuery('nginx.conf include', { configInput: 'include conf.d/*.conf;', allowedNames: ['include'] }), null);
  assert.equal(checkQuery('ngx.timer.at lua', { configInput: '', allowedNames: [] }), null);
  // 纯数字不作为具体值：配置中的 1024 与查询中的 1024 都不触发防泄露。
  assert.equal(checkQuery('worker 1024', { configInput: 'events { worker_connections 1024; }', allowedNames: ['events', 'worker_connections'] }), null);
  // 常见域名仍然受白名单约束。
  assert.match(checkQuery('example.com lua', { configInput: '', allowedNames: [] }), /非白名单域名/);
});

test('结果过滤：只保留官方站点与 openresty 仓库，丢弃 http、reddit 与其他 github 仓库，去重并截断', () => {
  const items = [
    { title: 'ok', link: 'https://nginx.org/en/a.html', content: 'x'.repeat(900) },
    { title: 'dup', link: 'https://nginx.org/en/a.html', content: 'dup' },
    { title: 'reddit', link: 'https://www.reddit.com/r/nginx/x', content: 'no' },
    { title: 'other', link: 'https://github.com/someone/other', content: 'no' },
    { title: 'repo', link: 'https://github.com/openresty/lua-nginx-module', content: 'yes' },
    { title: 'plain', link: 'http://nginx.org/en/b.html', content: 'no' },
    { title: 'sub', link: 'https://docs.openresty.org/x', content: 'yes' },
    { title: 'a'.repeat(300), link: 'https://nginx.org/en/c.html', content: 'c' },
    { title: 'more', link: 'https://nginx.org/en/d.html', content: 'd' },
    { title: 'more2', link: 'https://nginx.org/en/e.html', content: 'e' },
  ];
  const results = filterResults(items, 'nginx.org');
  // 请求站点的结果排在前面，其余按原顺序；最多 5 条，超出的 docs.openresty.org 被截掉。
  assert.deepEqual(results.map(result => result.url), ['https://nginx.org/en/a.html', 'https://nginx.org/en/c.html', 'https://nginx.org/en/d.html', 'https://nginx.org/en/e.html', 'https://github.com/openresty/lua-nginx-module']);
  assert.equal(results[0].content.length, 600);
  assert.equal(results[1].title.length, 200);
  assert.equal(results[0].site, 'nginx.org');
  assert.equal(results[4].site, 'github.com');
  assert.equal(filterResults(undefined, 'nginx.org').length, 0);
});

test('结果过滤伪装与边界：端口、用户信息、伪装域名、opm 与 github 路径穿越均被丢弃', () => {
  const dropped = [
    'https://nginx.org:8443/en/a.html', 'https://user@nginx.org/en/a.html', 'https://user:pw@nginx.org/en/a.html',
    'https://nginx.org.evil.com/en/a.html', 'https://evilnginx.org/en/a.html', 'https://nginx.org@evil.com/',
    'https://github.com/openrestyx/lua', 'https://github.com/openresty/../x',
    'https://opm.openresty.org/package/x', 'https://x.opm.openresty.org/package/x',
  ];
  assert.deepEqual(filterResults(dropped.map(link => ({ title: 't', link, content: 'c' })), 'nginx.org'), []);
  // 同样的主机未带伪装时仍然保留，证明丢弃来自上述规则而非其他原因。
  assert.equal(filterResults([{ title: 't', link: 'https://docs.openresty.org/en/a.html', content: 'c' }], 'openresty.org').length, 1);
});

test('密钥与开关配置：联网 Key 独立设置并固定地址；非智谱模型地址缺少独立 Key 时报错；旧式取值被拒绝', async () => {
  const saved = { ...process.env };
  const setEnv = env => { for (const key of Object.keys(process.env)) if (key.startsWith('PI_SPIKE_')) delete process.env[key]; Object.assign(process.env, env); };
  const live = { PI_SPIKE_MODE: 'live', PI_SPIKE_BASE_URL: 'https://model.invalid/v1', PI_SPIKE_API_KEY: 'model-secret-value', PI_SPIKE_MODEL: 'synthetic-model', PI_SPIKE_CONTEXT_WINDOW: '131072', PI_SPIKE_MAX_TOKENS: '8192', PI_SPIKE_STATE_DIR: '.state/web-config-test', PI_SPIKE_WEB_SEARCH: 'true' };
  try {
    setEnv({ ...live, PI_SPIKE_WEB_SEARCH_API_KEY: 'search-secret-value', PI_SPIKE_WEB_SEARCH_URL: 'https://evil.invalid/mcp' });
    const config = await loadConfig();
    assert.equal(config.webSearch, true); assert.equal(config.webSearchUrl, WEB_URL); assert.equal(config.webSearchApiKey, 'search-secret-value');
    // 模型地址不是智谱时，不能把模型 Key 发给联网服务。
    setEnv(live);
    await assert.rejects(loadConfig(), /PI_SPIKE_WEB_SEARCH_API_KEY/);
    // 模型地址是智谱开放平台时才回退到模型 Key。
    setEnv({ ...live, PI_SPIKE_BASE_URL: 'https://open.bigmodel.cn/api/paas/v4' });
    assert.equal((await loadConfig()).webSearchApiKey, 'model-secret-value');
    setEnv({ ...live, PI_SPIKE_WEB_SEARCH: 'on', PI_SPIKE_WEB_SEARCH_API_KEY: 'x' });
    await assert.rejects(loadConfig(), /PI_SPIKE_WEB_SEARCH|webSearch/);
  } finally {
    setEnv(Object.fromEntries(Object.entries(saved).filter(([key]) => key.startsWith('PI_SPIKE_'))));
  }
  assert.throws(() => applyRuntimeEnv({}, { PI_SPIKE_WEB_SEARCH: 'on' }), /true 或 false/);
  assert.equal(applyRuntimeEnv({}, { PI_SPIKE_WEB_SEARCH: 'false' }).webSearch, false);
  await assert.rejects(loadConfig({ webSearch: 'yes' }), /webSearch 必须是布尔值/);
  await assert.rejects(loadConfig({ webSearchTimeoutMs: 0 }), /webSearchTimeoutMs/);
});

test('MCP 客户端（mock）：三步握手并解析双重编码结果；HTTP 错误不回显密钥；成功后释放会话', async t => {
  const { spike } = await setup(t);
  const items = await callWebSearch({ url: spike.mock.mcpUrl, apiKey: 'local-mock-no-secret', query: 'proxy_cache_lock_age nginx', site: 'nginx.org', timeoutMs: 5000 });
  assert.equal(items.length, 5); assert.equal(items[0].link, MOCK_NGINX_URL);
  assert.deepEqual(spike.mock.webCalls, [{ query: 'proxy_cache_lock_age nginx', filter: 'nginx.org' }]);
  // 成功后宿主发出一次 DELETE 释放会话，携带 Mcp-Session-Id。
  assert.equal(spike.mock.mcpDeletes.length, 1); assert.ok(spike.mock.mcpDeletes[0]);
  await assert.rejects(callWebSearch({ url: spike.mock.mcpUrl, apiKey: 'wrong-search-secret', query: 'proxy_cache_lock_age nginx', site: 'nginx.org', timeoutMs: 5000 }), error => {
    assert.match(error.message, /HTTP 401/); assert.ok(!error.message.includes('wrong-search-secret')); return true;
  });
  await assert.rejects(callWebSearch({ url: spike.mock.mcpUrl, apiKey: 'local-mock-no-secret', query: 'MOCK_FAIL proxy', site: 'nginx.org', timeoutMs: 5000 }), error => {
    assert.match(error.message, /HTTP 500/); assert.ok(!error.message.includes('local-mock-no-secret')); return true;
  });
  assert.equal(spike.mock.webCalls.length, 2);
  // 500 发生在会话已建立之后，清理仍会发出 DELETE。
  assert.equal(spike.mock.mcpDeletes.length, 2);
});

// 本地协议服务：不经过 mock，用于验证 JSON 与 SSE 解析、重定向、体积上限等边界行为。
async function rpcServer(t, onCall, { hangDelete = false } = {}) {
  let deletes = 0;
  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    // hangDelete：模拟释放会话时服务端无响应，验证宿主不会因此无限等待。
    if (req.method === 'DELETE') { deletes++; if (!hangDelete) res.writeHead(200).end(); return; }
    const rpc = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
    if (rpc.method === 'initialize') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'mcp-session-id': 'local-session' });
      res.end(JSON.stringify({ jsonrpc: '2.0', id: rpc.id, result: {} }));
      return;
    }
    if (rpc.method === 'notifications/initialized') { res.writeHead(202).end(); return; }
    await onCall(rpc, res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const items = [{ title: 'ok', link: 'https://nginx.org/en/a.html', content: 'ok' }];
  return { url: `http://127.0.0.1:${server.address().port}/mcp`, deletes: () => deletes, items };
}
const callOf = (items, id = 2) => ({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(JSON.stringify(items)) }], isError: false } });
const callArgs = url => ({ url, apiKey: 'local-key', query: 'proxy_cache_lock_age nginx', site: 'nginx.org', timeoutMs: 5000 });

test('MCP 协议边界：JSON 响应校验 id，SSE 多行 data 按规范拼接，重定向与超大响应被拒绝', async t => {
  // JSON 响应的 id 与请求不符：视为协议错误。
  const mismatch = await rpcServer(t, (rpc, res) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(callOf([], 99))); });
  await assert.rejects(callWebSearch(callArgs(mismatch.url)), /格式无效/);
  // JSON 响应 id 匹配：正常返回结果。
  const json = await rpcServer(t, (rpc, res) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(callOf(mismatch.items))); });
  assert.equal((await callWebSearch(callArgs(json.url))).length, 1);
  // 同一事件中的多行 data：按换行拼接后是合法 JSON。
  // 缩进式 JSON 按行切分：每行一条 data，按规范用换行拼接后仍是合法 JSON。
  const sse = await rpcServer(t, (rpc, res) => {
    const body = JSON.stringify(callOf(mismatch.items), null, 2);
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    res.end(`event:message\n${body.split('\n').map(line => `data:${line}`).join('\n')}\n\n`);
  });
  assert.equal((await callWebSearch(callArgs(sse.url))).length, 1);
  // 重定向会把 Authorization 带到其他地址，宿主直接拒绝。
  const redirect = await rpcServer(t, (rpc, res) => { res.writeHead(302, { Location: 'http://127.0.0.1:9/' }); res.end(); });
  await assert.rejects(callWebSearch(callArgs(redirect.url)));
  // 响应体超过 1MB 视为失败。
  const huge = await rpcServer(t, (rpc, res) => { res.writeHead(200, { 'Content-Type': 'text/event-stream' }); res.end('data:' + 'x'.repeat(1.5 * 1024 * 1024)); });
  await assert.rejects(callWebSearch(callArgs(huge.url)), /过大/);
});

test('会话清理有时限：DELETE 无响应时，联网调用最多多等 2 秒，结果照常返回', async t => {
  const hanging = await rpcServer(t, (rpc, res) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(callOf([{ title: 't', link: 'https://nginx.org/en/a.html', content: 'c' }]))); }, { hangDelete: true });
  const started = Date.now();
  const items = await callWebSearch(callArgs(hanging.url));
  assert.equal(items.length, 1);
  assert.ok(Date.now() - started < 3500, `清理耗时 ${Date.now() - started}ms`);
});

test('开关关闭（默认）：工具集与状态接口不含 web_search，选择阶段提示无联网规则，外部参考被丢弃而不使回答失败', async t => {
  const { spike, run, runRaw } = await setup(t, { webSearch: false });
  // 带问题的消息才会进入字段选择阶段（纯配置会走默认字段捷径，不发起选择请求）。
  const job = await run('默认值依据？\n```nginx\n' + fixtures.events.input + '\n```');
  assert.equal(job.state, 'completed', job.error);
  assert.deepEqual(job.tools, TOOL_NAMES);
  for (const request of spike.mock.requests) assert.ok(!request.tools.includes('web_search'));
  assert.ok(!JSON.stringify(selectionRequests(spike).at(-1).messages).includes('联网参考规则'));
  // 模型在开关关闭时仍输出 web_refs：没有可引用的结果，参考被整体丢弃并计数，回答照常完成，不展示任何参考。
  const uninvited = await runRaw(eventsRequest('说明默认值', 'web-uninvited'));
  assert.notEqual(uninvited.state, 'failed', uninvited.error);
  assert.deepEqual(uninvited.webReferences, []); assert.equal(uninvited.webRefsDropped, 1);
  assert.ok(!JSON.stringify(uninvited.modelSelection).includes(MOCK_NGINX_URL));
  // web_refs: [] 视为未提供，关闭时同样不报错。
  const empty = await runRaw(eventsRequest('说明默认值', 'web-empty-refs'));
  assert.equal(empty.state, 'awaiting_input', empty.error); assert.deepEqual(empty.webReferences, []);
  // 状态接口与开关一致：关闭时只列出原有两个工具。
  await mkdir(join(ROOT, '.state'), { recursive: true });
  const dir = await mkdtemp(join(ROOT, '.state/web-status-off-'));
  const app = await serve({ port: 0, stateDir: dir, mockDelayMs: 1, webSearch: false });
  t.after(async () => { await app.close(); await rm(dir, { recursive: true, force: true }); });
  const status = await (await fetch(new URL('api/status', app.url))).json();
  assert.deepEqual(status.tools, TOOL_NAMES); assert.equal(status.webSearch, false);
});

test('开关开启：状态接口列出 web_search；选择阶段带联网规则，意图阶段仍无工具', async t => {
  await mkdir(join(ROOT, '.state'), { recursive: true });
  const dir = await mkdtemp(join(ROOT, '.state/web-status-on-'));
  const app = await serve({ port: 0, stateDir: dir, mockDelayMs: 1, webSearch: true });
  t.after(async () => { await app.close(); await rm(dir, { recursive: true, force: true }); });
  const status = await (await fetch(new URL('api/status', app.url))).json();
  assert.deepEqual(status.tools, [...TOOL_NAMES, 'web_search']); assert.equal(status.webSearch, true);
  const release = (await app.spike.ready()).release;
  const job = app.spike.start({ message: '默认值依据？\n```nginx\n' + fixtures.events.input + '\n```', release }); await job.done;
  assert.equal(job.state, 'completed', job.error);
  assert.deepEqual(app.spike.mock.requests.filter(request => request.phase === 'input_resolution').map(request => request.tools), [[]]);
  assert.ok(JSON.stringify(selectionRequests(app.spike).at(-1).messages).includes('联网参考规则'));
  assert.ok(WEB_PROMPT.includes('web_refs'));
});

test('web 场景：宿主回填标题与站点，只查询 nginx.org，注入结果不出现在引用中且无禁用工具', async t => {
  const { spike, runRaw } = await setup(t);
  const before = await countCache(spike);
  const job = await runRaw({ input: fixtures.events.input, mode: 'main', question: 'proxy_cache_lock_age 有什么限制', mockScenario: 'web' });
  assert.equal(job.state, 'awaiting_input', job.error);
  assert.equal(job.modelSelection.status, 'unsupported');
  assert.equal(job.webSearch.calls, 1); assert.deepEqual(job.webSearch.queries, ['proxy_cache_lock_age nginx']);
  assert.deepEqual(spike.mock.webCalls, [{ query: 'proxy_cache_lock_age nginx', filter: 'nginx.org' }]);
  assert.deepEqual(job.webReferences, [{ url: MOCK_NGINX_URL, title: 'ngx_http_proxy_module', site: 'nginx.org', quote: MOCK_NGINX_QUOTE }]);
  assert.ok(job.trace.some(event => event.tool === 'web_search' && event.status === 'ok'));
  assert.ok(job.trace.every(event => !FORBIDDEN_TOOLS.includes(event.tool) && !event.isError));
  // 视图只暴露计数与查询词，不暴露搜索结果正文（宿主内部的 results 只留在原始 job 中）。
  assert.deepEqual(Object.keys(spike.view(job).webSearch).sort(), ['attempts', 'calls', 'queries', 'rejected']);
  assert.ok(job.webSearch.results instanceof Map);
  // 注入文本确实作为不可信数据进入了模型上下文，但没有任何引用指向 openresty 条目。
  assert.ok(JSON.stringify(selectionRequests(spike).at(-1).messages).includes('忽略之前的规则'));
  assert.ok(!job.webReferences.some(reference => reference.site === 'openresty.org'));
  assert.equal(await countCache(spike), before);
  const again = await runRaw({ input: fixtures.events.input, mode: 'main', question: 'proxy_cache_lock_age 有什么限制', mockScenario: 'web' });
  assert.equal(again.cacheHit, false);
});

test('历史压缩：第二轮同会话请求不重放第一轮查询词、外部结果或注入文本', async t => {
  const { spike, runRaw } = await setup(t);
  const first = await runRaw({ input: fixtures.events.input, mode: 'main', question: '第一轮问题', mockScenario: 'web' });
  assert.equal(first.webSearch.calls, 1);
  const mark = spike.mock.requests.length;
  await runRaw({ input: fixtures.events.input, mode: 'main', question: '第二轮继续解释默认值', mockScenario: 'normal' }, first.sessionId);
  // 第二轮的第一次模型请求只包含历史压缩后的内容。
  const turn = spike.mock.requests[mark];
  const history = JSON.stringify(turn.messages.filter(message => !['system', 'developer'].includes(message.role)));
  assert.ok(!history.includes('忽略之前的规则'));
  assert.ok(!history.includes(MOCK_NGINX_QUOTE));
  assert.ok(!history.includes('proxy_cache_lock_age nginx'));
});

test('web-cited：完成的回答若调用过联网工具，不写缓存且再次请求不命中', async t => {
  const { spike, runRaw } = await setup(t);
  const request = { input: fixtures.events.input, mode: 'main', question: '默认值依据？', mockScenario: 'web-cited' };
  const first = await runRaw(request);
  assert.equal(first.state, 'completed', first.error);
  assert.equal(first.webReferences.length, 1); assert.equal(first.webReferences[0].site, 'nginx.org');
  assert.equal(await countCache(spike), 0);
  const second = await runRaw(request);
  assert.equal(second.cacheHit, false);
  assert.equal(second.webSearch.calls, 1);
});

test('web-leak：查询含配置中的 upstream 名称时被拒，不访问网络，请求不失败', async t => {
  const { spike, runRaw } = await setup(t);
  const job = await runRaw({ input: LEAK_CONFIG, mode: 'main', question: '', mockScenario: 'web-leak' });
  assert.notEqual(job.state, 'failed', job.error);
  assert.equal(job.webSearch.rejected, 1); assert.equal(job.webSearch.calls, 0);
  assert.equal(spike.mock.webCalls.length, 0);
  assert.deepEqual(job.webReferences, []);
  assert.ok(job.trace.some(event => event.tool === 'web_search' && event.status === 'rejected'));
});

test('被拒记录 attempts：每次软拒绝追加一条固定原因，视图保留且不含查询原文', async t => {
  const { spike, runRaw } = await setup(t);
  const job = await runRaw({ input: LEAK_CONFIG, mode: 'main', question: '', mockScenario: 'web-leak' });
  assert.notEqual(job.state, 'failed', job.error);
  // web-leak 场景的查询词为 'backend_pool timeout'，被拒后只能留下原因，不能留下查询原文。
  assert.equal(job.webSearch.attempts.length, 1);
  assert.equal(typeof job.webSearch.attempts[0].reason, 'string');
  assert.ok(job.webSearch.attempts[0].reason.length > 0);
  const view = spike.view(job).webSearch;
  assert.equal(view.attempts.length, 1);
  assert.deepEqual(view.attempts[0], { reason: job.webSearch.attempts[0].reason });
  assert.ok(!JSON.stringify(view.attempts).includes('backend_pool'));
  assert.ok(!JSON.stringify(view.attempts).toLowerCase().includes('timeout'));
});

test('防泄露语料包含问题：指令路径下问题中出现的 upstream 名称同样被拒', async t => {
  const { spike, runRaw } = await setup(t);
  // 配置本身不含 backend_pool，只有问题里有；查询仍不得外发它。
  const job = await runRaw({ input: fixtures.events.input, mode: 'main', question: 'backend_pool timeout 有什么影响', mockScenario: 'web-leak' });
  assert.notEqual(job.state, 'failed', job.error);
  assert.equal(job.webSearch.rejected, 1); assert.equal(spike.mock.webCalls.length, 0);
});

test('web-budget：每次请求最多实际调用两次，第三次被拒绝且不访问网络', async t => {
  const { spike, runRaw } = await setup(t);
  const job = await runRaw({ input: fixtures.events.input, mode: 'main', question: '查询限制', mockScenario: 'web-budget' });
  assert.equal(job.state, 'awaiting_input', job.error);
  assert.equal(spike.mock.webCalls.length, 2);
  assert.equal(job.webSearch.calls, 2); assert.equal(job.webSearch.rejected, 1);
  assert.equal(job.webSearch.queries.length, 2);
  assert.equal(job.webReferences.length, 1);
});

for (const scenario of ['web-forged', 'web-offdomain', 'web-quote', 'web-splice']) {
  test(`${scenario}：伪造网址、跨域网址、虚构或拼接引文被丢弃，请求仍完成且不写缓存`, async t => {
    const { spike, runRaw } = await setup(t);
    const job = await runRaw({ input: fixtures.events.input, mode: 'main', question: '查询限制', mockScenario: scenario });
    assert.equal(job.state, 'awaiting_input', job.error);
    assert.equal(job.modelSelection.status, 'unsupported');
    assert.deepEqual(job.modelSelection.facts, []);
    assert.deepEqual(job.webReferences, []);
    assert.equal(job.webRefsDropped, 1);
    assert.equal(job.webSearch.calls, 1);
    assert.equal(await countCache(spike), 0);
    const shown = JSON.stringify(job.webReferences);
    assert.ok(!shown.includes('forged.html'));
    assert.ok(!shown.includes('reddit.com'));
    assert.ok(!shown.includes('never appears'));
    assert.ok(!shown.includes('operation proxy module'));
  });
}

test('web-fail：网络失败降级为普通工具结果，请求不失败，无外部参考', async t => {
  const { spike, runRaw } = await setup(t);
  const job = await runRaw({ input: fixtures.events.input, mode: 'main', question: '查询限制', mockScenario: 'web-fail' });
  assert.equal(job.state, 'awaiting_input', job.error);
  assert.equal(job.error, undefined);
  assert.equal(job.webSearch.calls, 1);
  assert.deepEqual(job.webReferences, []);
  assert.ok(job.trace.some(event => event.tool === 'web_search' && event.status === 'error'));
  assert.equal(spike.mock.webCalls.length, 1);
});

test('web-uninvited：开关开启但没有任何结果时，外部参考被丢弃并计数，请求不失败', async t => {
  const { spike, runRaw } = await setup(t);
  const job = await runRaw({ input: fixtures.events.input, mode: 'main', question: '查询限制', mockScenario: 'web-uninvited' });
  assert.notEqual(job.state, 'failed', job.error);
  assert.equal(job.webSearch.calls, 0); assert.equal(spike.mock.webCalls.length, 0);
  assert.deepEqual(job.webReferences, []); assert.equal(job.webRefsDropped, 1);
  assert.ok(!JSON.stringify(job.modelSelection).includes(MOCK_NGINX_URL));
});

// 外部参考无效不再使整份回答失败：无来源可核对（联网关闭，或开启但 0 次调用 / 0 条结果）时，
// 任何 web_refs 都整体丢弃并计数；事实层照常校验并保留。覆盖 联网关闭/开启 × 数组/非数组/调用失败。
for (const [webSearch, scenario, dropped] of [
  [false, 'web-refs-facts', 2], [true, 'web-refs-facts', 2],
  [false, 'web-refs-nonarray', 1], [true, 'web-refs-nonarray', 1],
  [true, 'web-fail-refs', 1],
]) {
  test(`${scenario}（联网${webSearch ? '开启' : '关闭'}）：无可核对结果时参考全部丢弃，回答与事实保留，不展示、不写入任何参考内容`, async t => {
    const { spike, runRaw } = await setup(t, { webSearch });
    const request = { input: fixtures.events.input, mode: 'main', question: '查询限制', mockScenario: scenario };
    const job = await runRaw(request);
    assert.notEqual(job.state, 'failed', job.error);
    // 事实仍正常：summary 事实被选中并回填正文与引用。
    assert.ok(job.modelSelection.facts.some(fact => fact.field === 'summary'));
    assert.ok(job.modelSelection.resolvedFacts.some(fact => fact.field === 'summary' && fact.text));
    // 参考：计数等于丢弃条数，webReferences 为空，且报告任何位置都不含被丢弃的网址或引文。
    assert.equal(job.webRefsDropped, dropped); assert.deepEqual(job.webReferences, []);
    assert.deepEqual(job.modelSelection.web_refs ?? [], []);
    const shown = JSON.stringify({ webReferences: job.webReferences, modelSelection: job.modelSelection });
    for (const leaked of [MOCK_NGINX_URL, 'forged.html', MOCK_NGINX_QUOTE]) assert.ok(!shown.includes(leaked), leaked);
    // 联网开启的失败调用不改变结论；联网关闭时没有任何联网调用。
    assert.equal(spike.mock.webCalls.length, scenario === 'web-fail-refs' ? 1 : 0);
    // 缓存回放：命中缓存时 webRefsDropped 与空参考保持一致（没有联网调用的回答可缓存）。
    if (scenario !== 'web-fail-refs') {
      const again = await runRaw(request);
      assert.equal(again.cacheHit, true); assert.equal(again.webRefsDropped, dropped); assert.deepEqual(again.webReferences, []);
    }
  });
}

test('web-refs-extra-key：参考被宽容不放宽事实层，多余顶层键仍使整份回答失败（联网开启与关闭）', async t => {
  for (const webSearch of [false, true]) {
    const { runRaw } = await setup(t, { webSearch });
    const job = await runRaw({ input: fixtures.events.input, mode: 'main', question: '查询限制', mockScenario: 'web-refs-extra-key' });
    assert.equal(job.state, 'failed', `webSearch=${webSearch}`);
    assert.match(job.error, /模型报告契约无效/); assert.equal(job.errorCategory, 'contract');
    assert.deepEqual(job.webReferences ?? [], []);
  }
});

test('web-mixed：有效引用保留原文，无效项丢弃且不出现在外部参考中', async t => {
  const { runRaw } = await setup(t);
  const job = await runRaw({ input: fixtures.events.input, mode: 'main', question: '查询限制', mockScenario: 'web-mixed' });
  assert.notEqual(job.state, 'failed', job.error);
  assert.ok(job.modelSelection.facts.some(fact => fact.field === 'summary'));
  assert.equal(job.webReferences.length, 1);
  assert.equal(job.webReferences[0].url, MOCK_NGINX_URL);
  assert.equal(job.webReferences[0].quote, MOCK_NGINX_QUOTE);
  assert.equal(job.webRefsDropped, 3);
  const shown = JSON.stringify(job.webReferences);
  assert.ok(!shown.includes('forged.html'));
  assert.ok(!shown.includes('never appears'));
});

test('web-ref-extra：引用上的多余键被丢弃，请求不失败', async t => {
  const { runRaw } = await setup(t);
  const job = await runRaw({ input: fixtures.events.input, mode: 'main', question: '查询限制', mockScenario: 'web-ref-extra' });
  assert.equal(job.state, 'awaiting_input', job.error);
  assert.deepEqual(job.webReferences, []);
  assert.equal(job.webRefsDropped, 1);
  assert.ok(!JSON.stringify(job.webReferences).includes('forged title'));
});

test('web-limit：超过 3 条的有效引用只保留前三条，其余计入丢弃', async t => {
  const { runRaw } = await setup(t);
  const job = await runRaw({ input: fixtures.events.input, mode: 'main', question: '查询限制', mockScenario: 'web-limit' });
  assert.equal(job.state, 'awaiting_input', job.error);
  assert.equal(job.webReferences.length, 3);
  assert.equal(job.webRefsDropped, 1);
  assert.deepEqual(job.webReferences.map(item => item.quote), [
    'Sets a deadline for the cache fill operation',
    'deadline for the cache fill',
    'cache fill operation in the',
  ]);
  assert.ok(!job.webReferences.some(item => item.quote === 'operation in the proxy module'));
});

test('web_refs 为空数组视为未提供，开关开启时不报错', async t => {
  const { runRaw } = await setup(t);
  const job = await runRaw(eventsRequest('查询限制', 'web-empty-refs'));
  assert.equal(job.state, 'awaiting_input', job.error); assert.deepEqual(job.webReferences, []);
});

for (const scenario of ['web-long', 'web-site', 'web-extra']) {
  test(`${scenario}：超长查询、非白名单站点与多余参数键只软拒绝，请求不失败且不访问网络`, async t => {
    const { spike, runRaw } = await setup(t);
    const job = await runRaw(eventsRequest('查询限制', scenario));
    assert.notEqual(job.state, 'failed', job.error);
    assert.equal(job.webSearch.rejected, 1); assert.equal(job.webSearch.calls, 0);
    assert.equal(spike.mock.webCalls.length, 0);
    assert.ok(job.trace.some(event => event.tool === 'web_search' && event.status === 'rejected'));
  });
}

test('未收录指令：开关开启时进入字段选择，以名称本身联网参考（no_candidates）；关闭时保持原澄清', async t => {
  const message = 'ssl_certificate_cache_mock_x 的默认值？';
  const { spike, run } = await setup(t);
  const job = await run(message, undefined, { mockScenario: 'web' });
  assert.equal(job.inputResolution.action, 'directive', job.error);
  assert.equal(job.inputResolution.unindexed, true);
  assert.equal(job.normalizedRequest.input, 'ssl_certificate_cache_mock_x');
  assert.equal(job.state, 'awaiting_input', job.error);
  assert.equal(job.modelSelection.status, 'no_candidates');
  assert.equal(job.webReferences.length, 1);
  // 查询的是未收录名称本身，且通过了防泄露检查（名称被视为本次请求的允许词）。
  assert.deepEqual(spike.mock.webCalls, [{ query: 'ssl_certificate_cache_mock_x nginx', filter: 'nginx.org' }]);
  assert.equal(job.webSearch.calls, 1); assert.equal(job.webSearch.rejected, 0);
  // 意图阶段始终没有活动工具，联网只在字段选择阶段发生。
  assert.ok(spike.mock.requests.filter(request => request.phase === 'input_resolution').every(request => request.tools.length === 0));
  assert.equal(selectionRequests(spike).length, 2);

  const off = await setup(t, { webSearch: false });
  const clarified = await off.run(message, undefined, { mockScenario: 'web' });
  assert.equal(clarified.inputResolution.action, 'clarify');
  assert.match(clarified.inputResolution.message, /未收录/);
  assert.equal(clarified.state, 'awaiting_input');
  assert.equal(selectionRequests(off.spike).length, 0);
});

test('未收录单词（如 kubernetes）即使开关开启也保持原澄清，不进入联网', async t => {
  const { spike, run } = await setup(t);
  const job = await run('kubernetes 的默认值？', undefined, { mockScenario: 'web' });
  assert.equal(job.inputResolution.action, 'clarify', job.error);
  assert.match(job.inputResolution.message, /未收录/);
  assert.equal(job.state, 'awaiting_input');
  assert.equal(spike.mock.webCalls.length, 0); assert.equal(selectionRequests(spike).length, 0);
});

test('未收录指令夹带已收录指令：不静默丢弃其中一个，仍澄清', async t => {
  const message = 'ssl_certificate_cache_mock_x 与 listen 的区别';
  // 显式给出意图结果，确保澄清来自宿主的多名称守卫，而不是 mock 自身的多名称判断。
  const { spike, run } = await setup(t, { mockIntentResult: { action: 'directive', input: 'ssl_certificate_cache_mock_x', question: message, ignored: false } });
  const job = await run(message, undefined, { mockScenario: 'web' });
  assert.equal(job.inputResolution.action, 'clarify', job.error);
  assert.equal(job.state, 'awaiting_input');
  assert.equal(selectionRequests(spike).length, 0);
});

test('未收录请求不改变追问对象：之后“默认值呢”沿用此前的配置或指令，无对象时澄清', async t => {
  const { spike, run } = await setup(t);
  const first = await run(fixtures.events.input);
  await run('ssl_certificate_cache_mock_x 的默认值？', first.sessionId, { mockScenario: 'web' });
  const restored = await spike.restore(first.sessionId);
  assert.equal(restored.currentConfig.input, fixtures.events.input);
  assert.equal(restored.currentSubject.input, fixtures.events.input);
  const follow = await run('默认值呢', first.sessionId);
  assert.equal(follow.inputResolution.action, 'followup', follow.error);
  assert.equal(follow.normalizedRequest.input, fixtures.events.input);

  const bare = await run('ssl_certificate_cache_mock_x 的默认值？', undefined, { mockScenario: 'web' });
  const none = await run('默认值呢', bare.sessionId);
  assert.equal(none.state, 'awaiting_input');
  assert.equal(none.normalizedRequest, null);
  assert.equal((await spike.restore(bare.sessionId)).currentSubject, null);
});

test('联网调用中用户取消：请求取消且不写缓存', async t => {
  const { spike } = await setup(t);
  const before = await countCache(spike);
  const pending = spike.start({ input: fixtures.events.input, mode: 'main', question: '查询限制', mockScenario: 'web-slow' });
  await waitFor(() => spike.mock.webCalls.length === 1);
  await spike.cancel(pending.requestId);
  assert.equal(pending.state, 'cancelled');
  assert.equal(await countCache(spike), before);
});

test('单次联网调用超时降级：工具返回错误，请求不失败，且与整体超时区分', async t => {
  const { spike, runRaw } = await setup(t, { webSearchTimeoutMs: 200 });
  const started = Date.now();
  const job = await runRaw(eventsRequest('查询限制', 'web-slow'));
  assert.equal(job.state, 'awaiting_input', job.error);
  assert.ok(job.trace.some(event => event.tool === 'web_search' && event.status === 'error'));
  // 慢响应被单次超时截断，远早于模拟服务的 3 秒延迟。
  assert.ok(Date.now() - started < 2500);
  assert.equal(spike.mock.webCalls.length, 1);
});

test('整体超时仍中止请求：联网调用中超过 timeoutMs 则请求失败', async t => {
  const { spike } = await setup(t, { timeoutMs: 1000 });
  const job = spike.start(eventsRequest('查询限制', 'web-slow')); await job.done;
  assert.equal(job.state, 'failed'); assert.match(job.error, /超时/);
  assert.equal(await countCache(spike), 0);
});

test('意图阶段强制调用 web_search：没有活动权限，请求失败且模拟服务未收到任何调用', async t => {
  const { spike, run } = await setup(t);
  const job = await run(fixtures.events.input, undefined, { mockScenario: 'intent-web' });
  assert.equal(job.state, 'failed', job.error);
  // 失败原因应是 SDK 对禁用工具的拒绝，而不是某个偶然错误。
  assert.match(job.error, /SDK 工具调用失败或请求禁用工具/);
  assert.equal(spike.mock.webCalls.length, 0);
});

test('密钥不出现在任何输出中：视图、错误、轨迹与请求日志均不含联网 Key', async t => {
  const { spike, runRaw } = await setup(t);
  const secret = 'search-secret-Qx7vPz9LmW';
  spike.config.webSearchApiKey = secret;
  spike.config.logRequests = true;
  const logs = [];
  const originalLog = console.log;
  console.log = (...args) => logs.push(args.join(' '));
  t.after(() => { console.log = originalLog; });
  const job = await runRaw(eventsRequest('查询限制', 'web'));
  console.log = originalLog;
  assert.equal(job.webSearch.calls, 1);
  assert.equal(spike.mock.webCalls.length, 1);
  const failing = await runRaw(eventsRequest('查询限制', 'web-fail'));
  assert.ok(!JSON.stringify(spike.view(job)).includes(secret));
  assert.ok(!JSON.stringify(spike.view(failing)).includes(secret));
  assert.ok(!JSON.stringify(job.trace).includes(secret));
  assert.ok(!String(failing.error ?? '').includes(secret));
  assert.ok(!logs.join('\n').includes(secret));
  assert.ok(logs.some(line => line.includes('webSearchCalls')));
  // 即使错误消息中包含密钥，对外的错误文本也会被替换。
  assert.ok(!safeError(new Error(`bad ${secret}`), spike.secrets()).includes(secret));
});

test('失败日志只记录错误类别，不记录模型输出片段', async t => {
  const { spike, runRaw } = await setup(t);
  spike.config.logRequests = true;
  const logs = [];
  const originalLog = console.log;
  console.log = (...args) => logs.push(args.join(' '));
  t.after(() => { console.log = originalLog; });
  const job = await runRaw(eventsRequest('查询限制', 'invalid-json'));
  console.log = originalLog;
  assert.equal(job.state, 'failed');
  assert.ok(job.error);
  const line = logs.find(item => item.includes('agent_request_end'));
  const entry = JSON.parse(line);
  assert.equal(entry.errorCategory, job.errorCategory);
  assert.equal(typeof entry.errorCategory, 'string');
  assert.ok(!line.includes('not json'));
  assert.ok(!line.includes(job.error));
});

test('预算按请求计算：同一会话的后续请求重新获得两次联网调用', async t => {
  // 同一会话的第二个请求是新的 job，计数从零开始；其内部第三次调用仍被拒绝。
  const { spike, runRaw } = await setup(t);
  const first = await runRaw(eventsRequest('查询限制', 'web'));
  const second = await runRaw(eventsRequest('查询限制', 'web-budget'), first.sessionId);
  assert.equal(second.webSearch.calls, 2); assert.equal(second.webSearch.rejected, 1);
  assert.equal(spike.mock.webCalls.length, 3);
});
