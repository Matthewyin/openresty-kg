import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as core from '../src/core/core.mjs';
import * as knowledge from '../src/query/knowledge.mjs';
import * as source from '../src/core/source.mjs';
import * as results from '../src/query/config-results.mjs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const json = path => JSON.parse(read(path));
const index = json('dist/knowledge/index.json');
const selection = read('site/selection.mjs').replace(/^export /gm, '');
// 识别数据层与 app 同在一个脚本里运行：去掉 import，导出名改为普通声明。
const analysisState = read('site/analysis-state.mjs').replace(/^export /gm, '').replace(/^import .*;\n/gm, '');
const app = selection + '\n' + analysisState + '\n' + read('site/app.mjs').replace(/^import .*;\n/gm, '')
  .replaceAll('import.meta.url', '"http://site.test/app.mjs"');

// 只替换浏览器环境和静态文件读取，执行完整页面启动、查询客户端及渲染代码。
class Node {
  constructor(tag = 'div') {
    this.tagName = String(tag).toUpperCase(); this.children = []; this.dataset = {}; this.events = {};
    this.value = ''; this.checked = false; this.disabled = false; this.hidden = false;
    this.classList = { toggle() {}, add() {} };
  }
  set textContent(value) { this.text = String(value); this.children = []; }
  get textContent() { return (this.text ?? '') + this.children.map(child => child.textContent).join(''); }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.text = ''; this.children = nodes; }
  // 抽屉按断点切换 role / aria-modal，假节点也要能读写属性。
  setAttribute(name, value) { (this.attributes ??= {})[name] = String(value); }
  getAttribute(name) { return this.attributes?.[name] ?? null; }
  removeAttribute(name) { if (this.attributes) delete this.attributes[name]; }
  addEventListener(name, handler) { this.events[name] = handler; }
  dispatchEvent(event) { return this.events[event.type]?.(event); }
  focus() {}
}

async function start({ examples = 'normal', id = 'nginx--ngx_events_module--events', failIndex = false } = {}) {
  const requests = [];
  const nodes = new Map([...read('site/index.html').matchAll(/\bid="([^"]+)"/g)].map(m => [m[1], new Node()]));
  nodes.get('input-mode').value = 'single'; nodes.get('result-filter').value = 'all';
  const listeners = new Map();
  const document = { body: new Node('body'), activeElement: null, getElementById: id => nodes.get(id), createElement: tag => new Node(tag),
    addEventListener: (type, handler) => { const list = listeners.get(type) ?? []; list.push(handler); listeners.set(type, list); },
    dispatchEvent: event => { for (const handler of listeners.get(event.type) ?? []) handler(event); return true; } };
  const fetcher = async url => {
    const path = new URL(url).pathname.slice(1);
    requests.push(path);
    if (path === 'examples.json') {
      if (examples === 'network') throw new Error('示例网络故障');
      if (examples === 'pending') return new Promise(() => {});
      if (examples === 'http') return { ok: false, status: 503 };
      if (examples === 'missing') return { ok: false, status: 404 };
      return { ok: true, json: async () => {
        if (examples === 'json') throw new SyntaxError('示例JSON损坏');
        if (examples === 'shape') return { examples: [] };
        if (examples === 'entry') return [null];
        if (examples === 'field') return [...json('site/examples.json'), { label: '坏字段', mode: 'single', context: '', text: 1 }];
        if (examples === 'mode') return [{ label: '坏模式', mode: 'unknown', context: '', text: 'pid;' }];
        if (examples === 'context') return [{ label: '坏上下文', mode: 'single', context: null, text: 'pid;' }];
        if (examples === 'label') return [{ label: ' ', mode: 'single', context: '', text: 'pid;' }];
        if (examples === 'text') return [{ label: '空文本', mode: 'single', context: '', text: ' ' }];
        return json('site/examples.json');
      } };
    }
    if (failIndex && path === 'knowledge/index.json') throw new Error('索引网络故障');
    return { ok: true, status: 200, json: async () => json(`dist/${path}`) };
  };
  const sandbox = { ...core, ...knowledge, ...source, ...results, document, fetch: fetcher,
    createKnowledgeClient: options => knowledge.createKnowledgeClient({ ...options, fetcher }),
    location: { href: 'http://site.test/', search: `?id=${id}` }, URL, URLSearchParams,
    setTimeout, clearTimeout, AbortController, AbortSignal, Event, CustomEvent };
  let timer;
  try {
    await Promise.race([vm.runInNewContext(app, sandbox), new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('示例阻断页面启动')), 1000);
    })]);
    await new Promise(resolve => setImmediate(resolve));
  } finally { clearTimeout(timer); }
  return { document, nodes, requests };
}

// 目录分组按钮是懒构建的：收起的组没有条目按钮。因此目录总数要读每组摘要里的计数（“N 条”），与是否展开无关。
const allNodes = node => [node, ...node.children.flatMap(allNodes)];
const hasClassName = (node, name) => (node.className || '').split(/\s+/).includes(name);
const catalogTotal = list => allNodes(list).filter(node => hasClassName(node, 'catalog-group')).reduce((sum, group) => {
  const count = allNodes(group).find(node => hasClassName(node, 'catalog-group-count'));
  return sum + Number(String(count?.textContent ?? '').replace(/\D/g, ''));
}, 0);

for (const mode of ['network', 'http', 'missing', 'json', 'shape', 'entry', 'field', 'mode', 'context', 'label', 'text', 'pending']) {
  test(`示例${mode}异常不阻断目录、永久详情及参考库`, async () => {
    const { document, nodes, requests } = await start({ examples: mode });
    assert.equal(requests.filter(path => path === 'examples.json').length, 1);
    assert.equal(document.body.dataset.ready, 'true');
    // 目录已按模块分组且收起的组不构建按钮：总数读分组计数，并确认收起时没有条目按钮。
    assert.equal(catalogTotal(nodes.get('catalog-list')), index.directives.length);
    assert.equal(allNodes(nodes.get('catalog-list')).filter(node => hasClassName(node, 'catalog-entry')).length, 0);
    assert.ok(nodes.get('detail-panel').textContent.includes('events'));
    assert.equal(nodes.get('reference-list').children.length, 8);
    assert.equal(nodes.get('examples').children.length, mode === 'pending' ? 0 : 1);
    if (mode !== 'pending') assert.match(nodes.get('examples').textContent, /示例暂不可用.*手动输入/);
    assert.doesNotMatch(nodes.get('global-status').textContent, /站点加载失败/);
    nodes.get('query-context').value = 'main'; nodes.get('configuration').value = 'pid /tmp/test.pid;';
    await nodes.get('query-form').events.submit({ preventDefault() {} });
    assert.match(nodes.get('query-status').textContent, /唯一匹配/);
  });
}

test('正常示例仍可填入输入，索引故障仍阻断而不伪装成功', async () => {
  const { nodes } = await start();
  assert.equal(nodes.get('examples').children.length, 4);
  nodes.get('examples').children[0].events.click();
  assert.equal(nodes.get('configuration').value, 'lua_shared_dict cache 10m;');
  assert.equal(nodes.get('query-context').value, 'http');
  const failed = await start({ failIndex: true });
  assert.notEqual(failed.document.body.dataset.ready, 'true');
  assert.match(failed.nodes.get('global-status').textContent, /站点加载失败/);
});

test('基础、深度和配置组织项的范围提示与Markdown一致，不推断现场状态', async () => {
  const ids = ['nginx--ngx_conf_module--include', 'nginx--ngx_events_module--events',
    'nginx--ngx_stream_module--stream', 'nginx--ngx_http_module--http',
    'nginx--ngx_http_core_module--variables_hash_bucket_size',
    'nginx--ngx_stream_core_module--variables_hash_bucket_size',
    'nginx--ngx_core_module--daemon', 'nginx--ngx_http_core_module--sendfile'];
  for (const id of ids) {
    const entry = index.directives.find(e => e.id === id);
    const detail = json('dist/knowledge/' + entry.detail_path);
    const { nodes } = await start({ id });
    const text = nodes.get('detail-panel').textContent;
    const markdown = knowledge.renderMarkdown({ status: 'matched', detail, errors: [] });
    const expected = detail.runtime
      ? '深度核对仅覆盖下方明确列出的运行范围，不代表全部场景。'
      : '本条未提供独立运行时链；配置组织类条目不据此判为未完成，具体范围见功能与配置入口。';
    assert.ok(text.includes(expected), id);
    assert.ok(markdown.includes(expected), id);
    assert.doesNotMatch(text, /尚未核对，配置实现说明不代表请求处理链已完成核实/);
    for (const output of [text, markdown]) {
      assert.ok(output.includes('以各字段状态和证据为准'));
      assert.ok(output.includes('现场版本、模块启用和运行兼容性未验证'));
      assert.ok(output.includes('适用条件核实状态：' + knowledge.FACT_STATUS_LABELS[detail.availability.status]));
    }
  }
});

test('340项实际页面渲染保留默认值、继承及所有固定来源', async () => {
  const manifest = json('analysis/DEFAULTS_340_MANIFEST.json');
  const descendants = node => [node, ...node.children.flatMap(descendants)];
  for (const item of manifest.items) {
    const entry = index.directives.find(e => e.id === item.id);
    const detail = json('dist/knowledge/' + entry.detail_path);
    const { document, nodes } = await start({ id: item.id });
    assert.equal(document.body.dataset.ready, 'true');
    const panel = nodes.get('detail-panel');
    for (const field of ['defaults', 'inheritance']) {
      assert.ok(panel.textContent.includes(knowledge.formatFact(detail[field])), `${item.id}/${field}`);
    }
    const rendered = descendants(panel);
    const links = rendered.filter(node => node.tagName === 'A').map(node => node.href);
    const code = rendered.filter(node => node.tagName === 'PRE').map(node => node.textContent);
    for (const source of detail.sources) {
      assert.ok(links.includes(source.url), `${item.id}/${source.id}: 固定链接缺失`);
      assert.ok(code.includes(source.code), `${item.id}/${source.id}: 源码缺失`);
    }
  }
});

// 目录分组的选中提示：选中指令所在组收起（或尚未构建按钮）时，摘要上显示小圆点与读屏说明；展开后圆点让位给按钮本身的高亮。
test('目录分组收起时，选中指令所在组的摘要显示选中圆点与读屏说明；展开后隐藏，其他组从不显示', async () => {
  const { nodes } = await start({ id: 'nginx--ngx_events_module--events' });
  const groups = allNodes(nodes.get('catalog-list')).filter(node => hasClassName(node, 'catalog-group'));
  const target = groups.find(group => group.dataset.module === 'ngx_events_module');
  assert.ok(target, '目标模块分组应存在');
  // 取摘要里的圆点与读屏说明（两者都是摘要的直接子元素）。
  const marksOf = group => {
    const summary = group.children.find(node => hasClassName(node, 'catalog-group-summary'));
    return { dot: summary.children.find(node => hasClassName(node, 'catalog-group-dot')), note: summary.children.find(node => hasClassName(node, 'sr-only')) };
  };
  // 默认收起且未构建按钮：目标组显示圆点与说明。
  assert.equal(target.open, false);
  const marks = marksOf(target);
  assert.equal(marks.dot.hidden, false);
  assert.equal(marks.note.hidden, false);
  assert.match(marks.note.textContent, /含当前选中指令/);
  // 其他组不显示。
  for (const group of groups.filter(group => group !== target)) {
    assert.equal(marksOf(group).dot.hidden, true, group.dataset.module);
    assert.equal(marksOf(group).note.hidden, true, group.dataset.module);
  }
  // 展开目标组：按钮本身已高亮，圆点与说明隐藏。
  target.open = true;
  target.dispatchEvent({ type: 'toggle' });
  assert.equal(marksOf(target).dot.hidden, true);
  assert.equal(marksOf(target).note.hidden, true);
  // 再收起：圆点恢复。
  target.open = false;
  target.dispatchEvent({ type: 'toggle' });
  assert.equal(marksOf(target).dot.hidden, false);
});
