import test from 'node:test';
import assert from 'node:assert/strict';
import { parseConfig, parseSingle, matchDirective } from '../src/core/core.mjs';

// 这些记录仅作测试夹具，不作为真实发布知识。
function entry(name, module, contexts, extra = {}) {
  const component = 'fixture';
  const id = `${component}--${module}--${name}`;
  return { id, name, module, component, contexts, contexts_verified: true,
    detail_path: `releases/test-release/directives/${id}.json`,
    verification: 'registration_only', phases: [], ...extra };
}

function indexOf(directives) {
  return { schema_version: 1, release_id: 'test-release', openresty_version: '1.27.1.1',
    coverage: { inventory_complete: false, registration_count: directives.length,
      basic_verified_count: directives.filter((d) => d.verification !== 'registration_only').length,
      deep_verified_count: directives.filter((d) => d.verification === 'deep_verified').length,
      gaps: ['测试夹具，非正式盘点'] }, directives };
}

const entries = [
  entry('listen', 'stream_core', ['stream.server']),
  entry('worker_processes', 'core', ['main']),
  entry('listen', 'http_core', ['http.server']),
  entry('same', 'z_module', ['http.location']),
  entry('same', 'a_module', ['http.location']),
];
const index = indexOf(entries);
const single = (name) => parseSingle(name).directive;

test('完整主配置声明能匹配无根块的 main 指令，但不能让顶层 listen 合法化', () => {
  const input = 'worker_processes auto; listen 80;';
  const fragment = parseConfig(input).directives;
  assert.equal(matchDirective(fragment[0], index).status, 'context_required');
  const main = parseConfig(input, { mode: 'main' }).directives;
  assert.equal(matchDirective(main[0], index).status, 'matched');
  assert.equal(matchDirective(main[1], index).status, 'context_mismatch');
});

test('charset_map 的编码数据不能误匹配同名指令或报未知', () => {
  const parsed = parseConfig('http { charset_map a b { listen 80; C0 D18E; } }');
  for (const item of parsed.directives.slice(2)) {
    const result = matchDirective(item, index);
    assert.equal(result.status, 'block_entry');
    assert.deepEqual(result.candidates, []);
    assert.equal(result.selected_id, null);
  }
});

function expect(result, status, reason, candidates, effective = null) {
  assert.deepEqual(result, { status, reason, candidates,
    selected_id: status === 'matched' ? candidates[0].id : null, effective_context: effective });
}

const mainEntries = [
  entry('worker_processes', 'core', ['main']),
  entry('worker_cpu_affinity', 'core', ['main']),
  entry('events', 'ngx_events_module', ['main']),
  entry('stream', 'ngx_stream_module', ['main']),
  entry('http', 'ngx_http_module', ['main']),
];
const mainConfig = `worker_processes auto;
worker_cpu_affinity auto;
events {} stream {} http {}`;

for (const candidate of mainEntries) {
  test(`主配置五项回归：${candidate.name} 自动确定 main 并 matched`, () => {
    const parsed = parseConfig(mainConfig);
    assert.deepEqual(parsed.errors, []);
    const directive = parsed.directives.find((item) => item.name === candidate.name);
    assert.equal(directive.context, 'main');
    expect(matchDirective(directive, indexOf(mainEntries)),
      'matched', 'unique_candidate', [candidate], 'main');
  });
}

test('MIME 数据回归：handler 条目不返回 matched、unknown 或同名候选', () => {
  const parsed = parseConfig('http { types { text/html html; } map $x $y { listen 80; default app; include data.conf; } }');
  assert.deepEqual(parsed.errors, []);
  const data = parsed.directives.filter(d => ['text/html', 'listen', 'default', 'include'].includes(d.name));
  assert.equal(data.length, 4);
  for (const item of data) expect(matchDirective(item, index), 'block_entry', 'custom_handler_entry', []);
  const outside = parseConfig('default app; text/html html; listen 80;');
  assert.deepEqual(outside.directives.map(d => matchDirective(d, index).status), ['unknown', 'unknown', 'ambiguous']);
  const unknown = parseConfig('http { unknown { map $x $y { listen 80; default app; } } }');
  assert.equal(matchDirective(unknown.directives.at(-2), index).status, 'ambiguous');
  assert.equal(matchDirective(unknown.directives.at(-1), index).status, 'unknown');
  const wrong = parseConfig('http { server { map $x $y { listen 80; } } }');
  assert.equal(matchDirective(wrong.directives.at(-1), index).status, 'ambiguous');
});

test('唯一名称也必须提供 context；输入参数不能猜测槽位', () => {
  expect(matchDirective(single('worker_processes'), index),
    'context_required', 'missing_context', [entries[1]]);
  expect(matchDirective(single('worker_processes auto;'), index),
    'context_required', 'missing_context', [entries[1]]);
  expect(matchDirective(single('worker_processes'), index, { context: 'main' }),
    'matched', 'unique_candidate', [entries[1]], 'main');
  expect(matchDirective(single('worker_processes'), index, { module: 'core' }),
    'context_required', 'missing_context', [entries[1]]);
});

test('同名 HTTP/stream 按 context 精确区分，未知 context 不择优', () => {
  expect(matchDirective(single('listen 80;'), index), 'ambiguous', 'multiple_candidates',
    [entries[2], entries[0]]);
  const config = parseConfig('http { server { listen 80; } } stream { server { listen 80; } }');
  const listens = config.directives.filter((d) => d.name === 'listen');
  expect(matchDirective(listens[0], index), 'matched', 'unique_candidate', [entries[2]], 'http.server');
  expect(matchDirective(listens[1], index), 'matched', 'unique_candidate', [entries[0]], 'stream.server');
  expect(matchDirective(single('listen 80;'), index, { context: 'stream.server' }),
    'matched', 'unique_candidate', [entries[0]], 'stream.server');
  expect(matchDirective(single('same'), index, { context: 'http.location' }),
    'ambiguous', 'multiple_candidates', [entries[4], entries[3]], 'http.location');
});

test('events 根块及其子项均按各自 context 唯一匹配', () => {
  const fixtureEntries = [
    entry('events', 'ngx_events_module', ['main']),
    entry('multi_accept', 'ngx_event_core_module', ['events']),
    entry('worker_connections', 'ngx_event_core_module', ['events']),
  ];
  const fixture = indexOf(fixtureEntries);
  const parsed = parseConfig('events { multi_accept on; worker_connections 65535; }');
  assert.deepEqual(parsed.errors, []);
  expect(matchDirective(parsed.directives[0], fixture),
    'matched', 'unique_candidate', [fixtureEntries[0]], 'main');
  expect(matchDirective(parsed.directives[1], fixture),
    'matched', 'unique_candidate', [fixtureEntries[1]], 'events');
  expect(matchDirective(parsed.directives[2], fixture),
    'matched', 'unique_candidate', [fixtureEntries[2]], 'events');
});

test('有根块时顶层 server 为 context_mismatch，孩子及孤立 server 仍不猜 context', () => {
  const server = entry('server', 'core', ['http', 'stream', 'mail']);
  const fixture = indexOf([...entries, mainEntries[2], server]);
  const parsed = parseConfig('events {} server { listen 80; }');
  assert.deepEqual(parsed.errors, []);
  expect(matchDirective(parsed.directives[1], fixture),
    'context_mismatch', 'context_not_in_candidates', [server], 'main');
  expect(matchDirective(parsed.directives[2], fixture),
    'ambiguous', 'multiple_candidates', [entries[2], entries[0]]);
  const isolated = parseConfig('server { listen 80; }');
  assert.deepEqual(isolated.errors, []);
  expect(matchDirective(isolated.directives[0], fixture),
    'context_required', 'missing_context', [server]);
  expect(matchDirective(isolated.directives[1], fixture),
    'ambiguous', 'multiple_candidates', [entries[2], entries[0]]);
});

test('unknown、module_mismatch、context_mismatch 的候选和原因独立', () => {
  expect(matchDirective(single('LISTEN'), index, { context: 'http.server' }),
    'unknown', 'name_not_in_index', [], 'http.server');
  expect(matchDirective(single('missing'), indexOf([])), 'unknown', 'name_not_in_index', []);
  expect(matchDirective(single('listen'), index, { module: 'not_in_index', context: 'http.server' }),
    'module_mismatch', 'module_not_in_candidates', [entries[2], entries[0]], 'http.server');
  expect(matchDirective(single('listen'), index, { module: 'stream_core', context: 'http.server' }),
    'context_mismatch', 'context_not_in_candidates', [entries[0]], 'http.server');
  expect(matchDirective(single('listen'), index, { context: 'http.location' }),
    'context_mismatch', 'context_not_in_candidates', [entries[2], entries[0]], 'http.location');
  expect(matchDirective(single('listen'), index, { module: 'stream_core' }),
    'context_required', 'missing_context', [entries[0]]);
});

test('显式 context 冲突不能覆盖已解析层级，且先于 unknown 和模块过滤', () => {
  const parsed = parseConfig('http { server { listen 80; missing foo; } }').directives;
  expect(matchDirective(parsed[2], index, { context: 'stream.server', module: 'not_in_index' }),
    'context_conflict', 'conflicting_context', [entries[2], entries[0]]);
  expect(matchDirective(parsed[3], index, { context: 'stream.server' }),
    'context_conflict', 'conflicting_context', []);
  expect(matchDirective(parsed[2], index, { context: 'http.server' }),
    'matched', 'unique_candidate', [entries[2]], 'http.server');
});

test('未知注册 flag 不排除候选，不降为 main，也不声称完成匹配', () => {
  const unverified = entry('listen', 'unknown_flags', ['NGX_UNMAPPED_CONF'], { contexts_verified: false });
  const uncertain = indexOf([unverified, entries[0], entries[2]]);
  expect(matchDirective(single('listen'), uncertain, { context: 'http.server' }),
    'context_required', 'unverified_context_mapping', [entries[2], unverified], 'http.server');
  expect(matchDirective(single('listen'), uncertain, { context: 'mail.server' }),
    'context_required', 'unverified_context_mapping', [unverified], 'mail.server');
  expect(matchDirective(single('listen'), uncertain),
    'context_required', 'unverified_context_mapping', [entries[2], entries[0], unverified]);
  expect(matchDirective(single('listen'), uncertain, { module: 'http_core', context: 'http.server' }),
    'matched', 'unique_candidate', [entries[2]], 'http.server');
  const emptyMapping = entry('uncertain', 'unknown', [], { contexts_verified: false });
  expect(matchDirective(single('uncertain'), indexOf([emptyMapping]), { context: 'main' }),
    'context_required', 'unverified_context_mapping', [emptyMapping], 'main');
});

test('错误 parsed 或 options 明确拒绝，不接收 SingleResult/ConfigResult', () => {
  for (const invalid of [null, [], {}, parseSingle('listen'), parseConfig('listen;'),
    { ...single('listen'), args: null }, { ...single('listen'), context: 'server' },
    { ...single('listen'), line: 0 }, { ...single('listen'), raw_args: [1] },
    { ...single('listen'), parent_index: -1 }, { ...single('listen'), end_offset: -1 },
    { ...single('listen'), external_references: [{ kind: 'include', value: 'a', status: 'analyzed' }] },
  ]) expect(matchDirective(invalid, index), 'invalid_input', 'invalid_parsed', []);
  expect(matchDirective({ ...single('listen'), complete: false }, index),
    'invalid_input', 'incomplete_directive', []);
  for (const options of [null, [], 'main', { context: 'server' }, { context: 1 },
    { context: '' }, { module: '' }, { module: '   ' }, { module: 5 }]) {
    expect(matchDirective(single('listen'), index, options), 'invalid_input', 'invalid_options', []);
  }
});

test('索引校验拒绝版本、缺字段、重复 id、路径逃逸及错误覆盖计数', () => {
  const invalids = [null, [], {}, { ...index, schema_version: '1' }, { ...index, schema_version: 2 },
    { ...index, release_id: '..' }, { ...index, release_id: '../bad' },
    { ...index, openresty_version: '1.27.1.2' }, { ...index, directives: {} },
    { ...index, coverage: null }, { ...index, directives: [entries[0], entries[0]] }];
  for (const [field, value] of [
    ['id', undefined], ['id', '../escape'], ['id', 'wrong--module--listen'],
    ['name', undefined], ['module', undefined], ['component', undefined],
    ['contexts', null], ['contexts', []], ['contexts', ['server']],
    ['contexts_verified', undefined], ['detail_path', '../escape.json'],
    ['detail_path', `releases/other-release/directives/${entries[0].id}.json`],
    ['verification', 'verified'], ['phases', null],
  ]) invalids.push(indexOf([{ ...entries[0], [field]: value }]));
  for (const [field, value] of [
    ['inventory_complete', undefined], ['registration_count', 100], ['gaps', null],
    ['basic_verified_count', -1], ['basic_verified_count', 1], ['deep_verified_count', 1],
  ]) invalids.push({ ...index, coverage: { ...index.coverage, [field]: value } });
  for (const invalid of invalids) {
    expect(matchDirective(single('listen'), invalid), 'invalid_index', 'invalid_schema', []);
  }
  expect(matchDirective(null, null, null), 'invalid_input', 'invalid_parsed', []);
  expect(matchDirective(single('listen'), null, { context: 'server' }),
    'invalid_input', 'invalid_options', []);
});

test('不修改输入或索引；候选按 id 字典序，只有 matched 可以 selected_id', () => {
  const immutable = structuredClone(index);
  immutable.directives.forEach((entry) => {
    Object.freeze(entry.contexts);
    Object.freeze(entry.phases);
    Object.freeze(entry);
  });
  Object.freeze(immutable.directives);
  Object.freeze(immutable.coverage);
  Object.freeze(immutable);
  const parsed = Object.freeze(single('same'));
  expect(matchDirective(parsed, immutable), 'ambiguous', 'multiple_candidates',
    [immutable.directives[4], immutable.directives[3]]);
  assert.deepEqual(immutable, index);
  assert.deepEqual(parsed, single('same'));
});

test('registration_only 仅匹配身份，未核实内容不影响身份状态', () => {
  const basic = entry('basic', 'mod', ['main'], { verification: 'basic_verified' });
  const deep = entry('deep', 'mod', ['main'], { verification: 'deep_verified' });
  const fixture = indexOf([entries[1], basic, deep]);
  for (const name of ['worker_processes', 'basic', 'deep']) {
    assert.equal(matchDirective(single(name), fixture, { context: 'main' }).status, 'matched');
  }
});
