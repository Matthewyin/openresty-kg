import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createKnowledgeClient, validateIndex, validateDetail, renderMarkdown, formatFact, detailUrl } from '../src/query/knowledge.mjs';
import { extractCommands, componentMatrix } from '../scripts/inventory.mjs';
import { prepareKnowledgeFacts, validatePublication, validateCatalogScope } from '../scripts/build.mjs';

const root = resolve(import.meta.dirname, '..');
const index = JSON.parse(await readFile(resolve(root, 'dist/knowledge/index.json'), 'utf8'));
const entry = index.directives.find(item => item.name === 'lua_shared_dict' && item.component === 'lua-nginx-module');
const detail = JSON.parse(await readFile(resolve(root, 'dist/knowledge', entry.detail_path), 'utf8'));
function fixture(overrides = {}, siteBase = 'http://knowledge.test/') {
  const requests = [];
  const client = createKnowledgeClient({ knowledgeBase: 'http://knowledge.test/knowledge/', siteBase, timeoutMs: 1000,
    fetcher: async (url, options) => {
      requests.push({ url: String(url), method: options.method, body: options.body });
      const path = new URL(url).pathname.slice('/knowledge/'.length);
      const value = path === 'index.json' || path.endsWith('/index.json')
        ? Object.hasOwn(overrides, 'index') ? overrides.index : index
        : Object.hasOwn(overrides, 'detail') ? overrides.detail : detail;
      return { ok: true, status: 200, json: async () => structuredClone(value) };
    } });
  return { client, requests };
}

test('根相对详情基址生成固定发布链接，知识读取仍使用独立绝对地址', async () => {
  for (const siteBase of ['/', '/pi/', '/tools/config/']) {
    const { client, requests } = fixture({}, siteBase);
    const result = await client.querySingle('lua_shared_dict cache 10m;', { context: 'http' });
    assert.equal(result.status, 'matched');
    const expected = `${siteBase}index.html?${new URLSearchParams({ release: index.release_id, id: entry.id })}`;
    assert.equal(result.detail_url, expected);
    assert.equal(client.detailUrl(index, entry), expected);
    assert.equal(detailUrl(siteBase, index, entry), expected);
    assert.ok(result.markdown.includes(`[打开网站详情](${expected})`));
    assert.ok(requests.every(request => request.url.startsWith('http://knowledge.test/knowledge/')));
  }
  for (const siteBase of ['pi/', '//outside.invalid/', '/pi//', '/pi/../', '/pi/./', '/%70i/', '/pi/?x=1', '/pi/#x', '/pi\\outside/', '/pi/\n', 'javascript:alert(1)', 'file:///pi/']) {
    assert.throws(() => fixture({}, siteBase), undefined, siteBase);
  }
  const absolute = await fixture().client.querySingle('lua_shared_dict cache 10m;', { context: 'http' });
  assert.equal(absolute.detail_url, `http://knowledge.test/index.html?${new URLSearchParams({ release: index.release_id, id: entry.id })}`);
});

test('真实发行版目录与源码注册计数，不冒充全量覆盖', async () => {
  const script = await readFile(resolve(root, 'openresty/util/mirror-tarballs'), 'utf8');
  const matrix = componentMatrix(script, '1.27.1');
  assert.equal(matrix.find(item => item.component === 'lua-nginx-module').version, '0.10.27');
  assert.equal(matrix.find(item => item.component === 'headers-more-nginx-module').version, '0.37');
  for (const [component, file, count] of [['lua-nginx-module', 'src/ngx_http_lua_module.c', 79], ['stream-lua-nginx-module', 'src/ngx_stream_lua_module.c', 50]]) {
    const commands = extractCommands(await readFile(resolve(root, 'repos', component, file), 'utf8'), file, component);
    assert.equal(commands.length, count);
    assert.ok(commands.every(command => command.module_verified));
  }
  const actualScope = JSON.parse(await readFile(resolve(root, 'analysis/components.json'), 'utf8'));
  assert.equal(index.coverage.inventory_complete, actualScope.scope_complete === true);
  assert.equal(index.coverage.registration_count, index.directives.length);
  assert.equal(index.coverage.basic_verified_count, index.directives.filter(item => item.verification !== 'registration_only').length);
});

test('带参数查询返回同源知识且请求不包含配置或参数', async () => {
  const { client, requests } = fixture();
  const result = await client.querySingle('lua_shared_dict SECRET_INTERNAL_CACHE 10m;', { context: 'http' });
  assert.equal(result.status, 'matched');
  assert.deepEqual(result.detail, detail);
  assert.equal(result.markdown, renderMarkdown(result));
  assert.ok(result.markdown.includes(detail.summary));
  assert.ok(result.markdown.includes(detail.sources[0].revision));
  assert.ok(result.detail_url.includes(index.release_id));
  assert.equal(requests.length, 2);
  assert.ok(requests.every(request => request.method === 'GET' && request.body === undefined));
  assert.ok(!JSON.stringify(requests).includes('SECRET_INTERNAL_CACHE'));
  assert.ok(!JSON.stringify(requests).includes('10m'));
});

test('完整范围标志须与目录全身份和字段一致，截短目录或改名/回调/条件均拒绝', async () => {
  const matrix = JSON.parse(await readFile(resolve(root, 'analysis/components.json'), 'utf8'));
  const catalog = JSON.parse(await readFile(resolve(root, 'analysis/directives/catalog.json'), 'utf8'));
  validateCatalogScope(matrix, catalog);
  for (const change of [value => value.directives.pop(), value => { value.directives[0].name += '_changed'; },
    value => { value.directives[0].callback += '_changed'; }, value => { value.directives[0].compile_guards = ['if UNKNOWN']; },
    value => { value.directives.find(item => item.distribution_patch).distribution_patch.patched_sha256 = '0'.repeat(64); }]) {
    const broken = structuredClone(catalog); change(broken);
    assert.throws(() => validateCatalogScope(matrix, broken), /目录与/);
  }
});

test('唯一名称缺 context 仍可预览，但不伪造匹配完成', async () => {
  const nameEntry = index.directives.find(item => item.name === 'lua_load_resty_core' && item.component === 'lua-nginx-module');
  const nameDetail = JSON.parse(await readFile(resolve(root, 'dist/knowledge', nameEntry.detail_path), 'utf8'));
  const correct = fixture({ detail: nameDetail });
  const preview = await correct.client.querySingle('lua_load_resty_core', { module: 'ngx_http_lua_module' });
  assert.equal(preview.status, 'context_required');
  assert.equal(preview.match.selected_id, null);
  assert.equal(preview.detail.id, nameDetail.id);
  assert.ok(preview.markdown.includes('预览'));
  assert.ok(preview.markdown.includes('废弃'));
});

test('页面锁定发布后，单项查询不改用当前索引', async () => {
  const { client, requests } = fixture();
  const result = await client.querySingle('lua_shared_dict a 10m;', { context: 'http', release: index.release_id });
  assert.equal(result.status, 'matched');
  assert.ok(requests[0].url.endsWith(`/releases/${index.release_id}/index.json`));
  assert.equal(result.release_id, index.release_id);
  assert.ok(result.detail_url.includes(`release=${index.release_id}`));
});

test('多条配置和词法错误不发出知识请求', async () => {
  const { client, requests } = fixture();
  assert.equal((await client.querySingle('lua_shared_dict a 10m; lua_shared_dict b 10m;')).status, 'out_of_scope');
  assert.equal((await client.querySingle('lua_shared_dict a 10m')).status, 'parse_error');
  assert.equal(requests.length, 0);
});

test('未知与歧义不自动选择详情', async () => {
  const { client, requests } = fixture();
  assert.equal((await client.querySingle('not_a_known_directive;')).status, 'unknown');
  assert.equal((await client.querySingle('proxy_pass upstream;')).status, 'ambiguous');
  assert.equal(requests.length, 2);
});

test('索引身份、路径和发布版本错误均拒绝', () => {
  const clone = structuredClone(index); clone.directives[0].detail_path = '../escape.json';
  assert.throws(() => validateIndex(clone));
  const duplicate = structuredClone(index); duplicate.directives.push(duplicate.directives[0]);
  assert.throws(() => validateIndex(duplicate));
  assert.throws(() => validateIndex({ ...index, schema_version: 3 }));
  assert.throws(() => validateDetail({ ...detail, release_id: 'other-release' }, entry, index), /发布版本/);
  assert.throws(() => validateDetail({ ...detail, module: 'other-module' }, entry, index), /身份/);
  const broken = structuredClone(detail); broken.sources[0].code += '\nextra';
  assert.throws(() => validateDetail(broken, entry, index), /范围/);
});

test('读取失败不降格为未知指令或模型回答', async () => {
  const { client } = fixture({ detail: { ...detail, release_id: 'wrong' } });
  const result = await client.querySingle('lua_shared_dict a 10m;', { context: 'http' });
  assert.equal(result.status, 'knowledge_unavailable');
  assert.equal(result.errors[0].code, 'release_mismatch');
  assert.equal(result.detail, null);
  assert.ok(!result.markdown.includes(detail.summary));
});

test('R03：实际单项查询将所有渲染字段的畸形详情转为知识不可用', async () => {
  const mutations = [
    ['availability 缺字段', value => { value.availability = {}; }],
    ['compile_guards 类型', value => { value.availability.compile_guards = null; }],
    ['dependencies 元素', value => { value.availability.dependencies = [null]; }],
    ['deprecated 类型', value => { value.availability.deprecated = 'false'; }],
    ['availability 状态', value => { value.availability.status = 'wrong'; }],
    ['patch_status 缺字段', value => { value.patch_status = {}; }],
    ['patch note 类型', value => { value.patch_status.note = {}; }],
    ['patch status 枚举', value => { value.patch_status.status = 'verified'; }],
    ['documentation 元素', value => { value.documentation = [null]; }],
    ['documentation title', value => { value.documentation[0].title = null; }],
    ['documentation status', value => { value.documentation[0].status = 'wrong'; }],
    ['documentation URL', value => { value.documentation[0].url = 'javascript:alert(1)'; }],
    ['configuration symbol', value => { value.configuration_entry.symbol = {}; }],
    ['verification_notes 元素', value => { value.verification_notes = [null]; }],
    ['phases 元素', value => { value.phases = [null]; }],
    ['mechanism 类型', value => { value.mechanism = {}; }],
    ['related 元素', value => { value.related = [null]; }],
    ['inheritance note', value => { value.inheritance.note = {}; }],
    ['fact 元素', value => { value.defaults = null; }],
    ['limitation 元素', value => { value.limitations = [null]; }],
    ['source 元素', value => { value.sources = [null]; }],
    ['source_ids 元素', value => { value.inheritance.source_ids = [null]; }],
    ['defaults 状态', value => { value.defaults.status = 'wrong'; }],
    ['defaults text', value => { value.defaults.text = undefined; }],
    ['defaults 已核实无值', value => { value.defaults.text = null; }],
    ['inheritance 类型', value => { value.inheritance = []; }],
    ['limitation 状态', value => { value.limitations[0].status = 'wrong'; }],
    ['limitation text', value => { value.limitations[0].text = null; }],
    ['补丁证据缺失', value => { delete value.patch_status.source_ids; }],
    ['悬空证据', value => { value.patch_status.source_ids = ['not_in_sources']; }],
    ['已核实事实无证据', value => { value.defaults.source_ids = []; }],
    ['补丁未核实但事实已核实', value => { value.patch_status.status = 'unverified'; }],
    ['affected 缺补丁片段', value => { value.patch_status.status = 'verified_affected'; }],
    ['源码重复 id', value => { value.sources.push(value.sources[0]); }],
    ['源码 revision', value => { value.sources[0].revision = 1; }],
    ['源码 URL 主机', value => { value.sources[0].url = value.sources[0].url.replace('github.com/', 'github.com@evil.test/'); }],
    ['源码空路径', value => { value.sources[0].file = ''; }],
    ['phases 与索引不一致', value => { value.phases = ['invented_phase']; }],
    ['details null', () => {}],
  ];
  for (const [label, mutate] of mutations) {
    const broken = structuredClone(detail); mutate(broken);
    const { client } = fixture({ detail: label === 'details null' ? null : broken });
    const result = await client.querySingle('lua_shared_dict cache 10m;', { context: 'http' });
    assert.equal(result.status, 'knowledge_unavailable', label);
    assert.equal(result.errors[0].code, label === 'details null' ? 'unsupported_schema' : 'invalid_detail', label);
    assert.equal(result.detail, null, label);
    assert.equal(result.detail_url, null, label);
    assert.equal(result.markdown, renderMarkdown(result), label);
  }
});

test('R02：Markdown 保留继承、依赖、文档链接及不适用/未核实事实', async () => {
  const value = structuredClone(detail);
  value.defaults = { status: 'not_applicable', text: 'DEFAULT_NOT_APPLICABLE', source_ids: [] };
  value.inheritance = { status: 'verified', text: 'INHERITANCE_VALUE', note: 'INHERITANCE_NOTE', source_ids: ['registration'] };
  value.availability.dependencies = ['DEPENDENCY_VALUE'];
  value.documentation = [{ title: 'DOCUMENTATION_TITLE', url: 'https://example.test/reference', status: 'unverified' }];
  const { client } = fixture({ detail: value });
  const result = await client.querySingle('lua_shared_dict cache 10m;', { context: 'http' });
  assert.equal(result.status, 'matched');
  for (const text of ['不适用', 'DEFAULT_NOT_APPLICABLE', 'INHERITANCE_VALUE', 'INHERITANCE_NOTE',
    'DEPENDENCY_VALUE', 'DOCUMENTATION_TITLE', 'https://example.test/reference', '未核实']) {
    assert.ok(result.markdown.includes(text), text);
  }
  value.inheritance = { status: 'unverified', text: 'UNCHECKED_INHERITANCE', note: 'UNCHECKED_NOTE', source_ids: [] };
  const uncertain = await fixture({ detail: value }).client.querySingle('lua_shared_dict cache 10m;', { context: 'http' });
  assert.ok(uncertain.markdown.includes('UNCHECKED_INHERITANCE'));
  assert.ok(uncertain.markdown.includes('UNCHECKED_NOTE'));
  assert.ok(uncertain.markdown.includes('未核实'));
  assert.equal(formatFact(value.inheritance), '未核实；UNCHECKED_INHERITANCE；UNCHECKED_NOTE');
  assert.equal(formatFact({ status: 'not_applicable', text: null }), '不适用');
});

test('R03：畸形索引的渲染字段通过查询出口返回 invalid_json', async () => {
  for (const mutate of [
    value => { value.coverage.gaps = [null]; },
    value => { value.coverage.inventory_complete = 'false'; },
    value => { value.coverage.registration_count = -1; },
    value => { value.coverage.basic_verified_count++; },
    value => { value.directives[0].phases = null; },
    value => { value.directives[0] = null; },
  ]) {
    const broken = structuredClone(index); mutate(broken);
    const result = await fixture({ index: broken }).client.querySingle('lua_shared_dict cache 10m;', { context: 'http' });
    assert.equal(result.status, 'knowledge_unavailable');
    assert.equal(result.errors[0].code, 'invalid_json');
    assert.equal(result.match, null);
    assert.equal(result.release_id, null);
  }
});

test('客户端区分 JSON 解码、schema、发布与文件失败，均不 reject', async () => {
  for (const [code, response] of [
    ['invalid_json', { ok: true, json: async () => { throw new SyntaxError('bad JSON'); } }],
    ['unsupported_schema', { ok: true, json: async () => ({ ...detail, schema_version: 3 }) }],
    ['release_mismatch', { ok: true, json: async () => ({ ...detail, release_id: 'other' }) }],
    ['missing_detail', { ok: false, status: 404 }],
    ['fetch_failed', null],
  ]) {
    const client = createKnowledgeClient({ knowledgeBase: 'http://knowledge.test/knowledge/', siteBase: 'http://knowledge.test/', timeoutMs: 1000,
      fetcher: async url => {
        if (String(url).endsWith('/index.json')) return { ok: true, json: async () => structuredClone(index) };
        if (response === null) throw new Error('connection lost');
        return response;
      } });
    const result = await client.querySingle('lua_shared_dict cache 10m;', { context: 'http' });
    assert.equal(result.status, 'knowledge_unavailable', code);
    assert.equal(result.errors[0].code, code);
    assert.deepEqual(Object.keys(result).sort(), ['detail', 'detail_url', 'errors', 'markdown', 'match', 'release_id', 'schema_version', 'status']);
    assert.equal(result.detail, null);
    assert.equal(result.detail_url, null);
    assert.equal(result.markdown, renderMarkdown(result));
  }
});

test('指令级补丁事实门禁：affected/unaffected、证据与旧 default 兼容', () => {
  const sources = [
    { id: 'registration', kind: 'upstream' }, { id: 'configuration-definition', kind: 'upstream' },
    { id: 'fact', kind: 'upstream' }, { id: 'patch', kind: 'openresty_patch' },
    { id: 'script', kind: 'upstream' }, { id: 'distribution-version', kind: 'upstream' },
  ];
  const curated = { default: 'OLD_DEFAULT', defaults: { status: 'verified', text: 'NEW_DEFAULT', source_ids: ['fact'] },
    inheritance: { status: 'verified', text: 'PARENT_VALUE', note: 'INHERITANCE_NOTE', source_ids: ['fact'] },
    limitations: ['LIMIT'], patch_status: { status: 'verified_affected', note: '会话超时字段已受补丁修改；未编译。', source_ids: ['script', 'patch'] } };
  const affected = prepareKnowledgeFacts(curated, sources, 'nginx', 'unverified');
  assert.equal(affected.patchKnown, true);
  assert.equal(affected.patch_status.status, 'verified_affected');
  assert.equal(affected.defaults.text, 'NEW_DEFAULT');
  assert.equal(affected.defaults.status, 'verified');
  assert.equal(affected.inheritance.status, 'verified');
  assert.equal(affected.limitations[0].status, 'verified');
  const unaffected = structuredClone(curated); unaffected.patch_status.status = 'verified_unaffected';
  assert.equal(prepareKnowledgeFacts(unaffected, sources, 'nginx', 'unverified').patchKnown, true);
  const uncertain = structuredClone(curated); uncertain.patch_status.status = 'unverified';
  const gated = prepareKnowledgeFacts(uncertain, sources, 'nginx', 'verified_unaffected');
  assert.equal(gated.patchKnown, false);
  assert.equal(gated.defaults.status, 'unverified');
  assert.equal(gated.inheritance.status, 'unverified');
  assert.equal(gated.limitations[0].status, 'unverified');
  assert.equal(gated.defaults.text, 'NEW_DEFAULT');
  const noOverride = { default: 'LEGACY_DEFAULT', limitations: ['LIMIT'] };
  const legacy = prepareKnowledgeFacts(noOverride, sources, 'lua-nginx-module', 'verified_unaffected');
  assert.equal(legacy.defaults.text, 'LEGACY_DEFAULT');
  assert.equal(legacy.defaults.status, 'verified');
  assert.equal(prepareKnowledgeFacts(noOverride, sources, 'nginx', 'verified_unaffected').patchKnown, false);
  assert.equal(prepareKnowledgeFacts({ ...noOverride, inheritance: { status: 'not_applicable', text: '结构块', source_ids: [] } }, sources, 'nginx', 'unverified').inheritance.status, 'not_applicable');
  for (const source_ids of [[], ['missing']]) assert.throws(() => prepareKnowledgeFacts({ ...curated, patch_status: { ...curated.patch_status, source_ids } }, sources, 'nginx', 'unverified'), /证据/);
  assert.throws(() => prepareKnowledgeFacts({ ...curated, patch_status: { ...curated.patch_status, source_ids: ['script'] } }, sources, 'nginx', 'unverified'), /补丁片段/);
});

test('真实发布门禁检查最后一个非代表详情，失败不写当前索引', async () => {
  const before = await readFile(resolve(root, 'dist/knowledge/index.json'), 'utf8');
  const first = structuredClone(detail);
  const last = structuredClone(detail);
  last.name = 'fixture_last'; last.id = `${last.component}--${last.module}--${last.name}`;
  last.verification = 'registration_only'; last.defaults = { status: 'unverified', text: null, source_ids: [] };
  last.inheritance = { status: 'unverified', text: null, source_ids: [] }; last.limitations = [];
  const details = [first, last];
  const fixtureIndex = { ...structuredClone(index), coverage: { inventory_complete: false, registration_count: 2, basic_verified_count: 1, deep_verified_count: 0, gaps: [] },
    directives: details.map(value => ({ id: value.id, name: value.name, module: value.module, component: value.component,
      contexts: value.contexts, contexts_verified: value.contexts_verified, verification: value.verification, phases: value.phases,
      detail_path: `releases/${index.release_id}/directives/${value.id}.json` })) };
  if (index.schema_version === 2) {
    fixtureIndex.directives.forEach((entry, i) => { entry.source = details[i].source; });
    fixtureIndex.coverage.groups = {
      bundled: { inventory_complete: false, registration_count: 2, basic_verified_count: 1, deep_verified_count: 0 },
      department_extension: { inventory_complete: true, registration_count: 0, basic_verified_count: 0, deep_verified_count: 0 },
    };
  }
  delete fixtureIndex.references_path;
  assert.equal(validatePublication(fixtureIndex, details), fixtureIndex);
  const broken = structuredClone(details); broken[1].availability.dependencies = null;
  assert.throws(() => validatePublication(fixtureIndex, broken), error => error.message.includes(last.id) && error.message.includes('适用条件'));
  const weak = structuredClone(details); weak[0].patch_status.status = 'unverified';
  assert.throws(() => validatePublication(fixtureIndex, weak), /已核实事实/);
  assert.throws(() => validatePublication(fixtureIndex, [first, first]), /重复/);
  assert.equal(await readFile(resolve(root, 'dist/knowledge/index.json'), 'utf8'), before);
});

test('affected 补丁状态通过真实查询出口展示，保留基础核对而非深度核对', async () => {
  const value = structuredClone(detail);
  const source = structuredClone(value.sources.find(item => item.id === 'distribution-version'));
  // 仅作格式与引用闭合测试，不作为真实源码知识发布。
  Object.assign(source, { id: 'test-patch', file: 'patches/test-only.patch', start_line: 1, end_line: 1, code: '测试夹具，不发布', kind: 'openresty_patch' });
  source.url = `https://github.com/openresty/openresty/blob/${source.revision}/${source.file}#L1-L1`;
  value.sources.push(source);
  value.patch_status = { status: 'verified_affected', note: '测试夹具：仅核对所列配置事实及补丁改变；未编译或运行。', source_ids: ['registration', 'test-patch'] };
  const result = await fixture({ detail: value }).client.querySingle('lua_shared_dict cache 10m;', { context: 'http' });
  assert.equal(result.status, 'matched');
  assert.equal(result.detail.verification, 'basic_verified');
  assert.ok(result.markdown.includes('已核对补丁影响'));
  assert.ok(result.markdown.includes(value.patch_status.note));
  assert.ok(!result.markdown.includes('深度内容已核对'));
  assert.ok(!result.markdown.includes('整个运行时链路未受影响'));
  const broken = structuredClone(value); broken.patch_status.source_ids = ['registration'];
  const coverage = { ...index.coverage, registration_count: 1, basic_verified_count: 1, deep_verified_count: 0 };
  if (index.schema_version === 2) coverage.groups = {
    bundled: { inventory_complete: true, registration_count: 1, basic_verified_count: 1, deep_verified_count: 0 },
    department_extension: { inventory_complete: true, registration_count: 0, basic_verified_count: 0, deep_verified_count: 0 },
  };
  assert.throws(() => validatePublication({ ...index, coverage, directives: [entry] }, [broken]), /补丁片段/);
});

test('发布的所有详情通过契约与源码行数核对', async () => {
  validateIndex(index);
  for (const item of index.directives) {
    const value = JSON.parse(await readFile(resolve(root, 'dist/knowledge', item.detail_path), 'utf8'));
    validateDetail(value, item, index);
    if (value.verification !== 'registration_only') {
      assert.ok(value.summary && value.syntax);
      assert.ok(value.sources.some(source => source.id === 'configuration-definition'));
    }
  }
});
