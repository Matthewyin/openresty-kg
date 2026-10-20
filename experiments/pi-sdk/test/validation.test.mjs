import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { Spike, ROOT } from '../src/session.mjs';
import { buildValidation, NOT_CHECKED, VALIDATION_ISSUE_LIMIT, VALIDATION_MESSAGE_MAX } from '../src/validation.mjs';
import { fixtures } from './fixtures/configs.mjs';

// ---- 单元：用手工构造的 analysis 覆盖每个检查的各种状态 ----

// 构造 analysis：directives 为解析出的指令（至少有 name/line），statuses 与之按下标对应；errors 为语法错误。
const make = (directives, statuses, errors = []) => ({
  parsed: { directives: directives.map((item, i) => ({ kind: 'simple', line: i + 1, column: 1, contexts: [], parent_index: null, ...item })), errors },
  matches: statuses.map(item => (typeof item === 'string' ? { status: item, reason: 'x', effective_context: null } : item)),
});
const INDEX = ['client_max_body_size', 'listen', 'Listen', 'server', 'map'].map(name => ({ name }));
const byId = (validation, id) => validation.checks.find(check => check.id === id);

test('配置校验·结构：固定的检查顺序、标题、notChecked 常量；全部匹配为 pass', () => {
  const result = buildValidation(make([{ name: 'listen' }, { name: 'server', kind: 'block_entry' }], ['matched', 'block_entry']), INDEX);
  assert.equal(result.verdict, 'pass');
  assert.deepEqual(result.checks.map(check => [check.id, check.title, check.status]), [['syntax', '语法', 'pass'], ['directive_names', '指令名（区分大小写）', 'pass'], ['context', '上下文', 'pass']]);
  for (const check of result.checks) assert.deepEqual(check.issues, []);
  assert.deepEqual(result.notChecked, ['参数个数与取值', '重复或冲突', '指令所需模块是否可用', 'include 文件、证书路径与变量是否存在']);
  assert.deepEqual(result.notChecked, NOT_CHECKED);
  // 返回的是副本：调用方改动不会污染常量。
  result.notChecked.push('x');
  assert.equal(NOT_CHECKED.length, 4);
});

test('配置校验·无配置可校验返回 null：没有指令也没有语法错误；全部是名称查询', () => {
  assert.equal(buildValidation(make([], []), INDEX), null);
  assert.equal(buildValidation(null, INDEX), null);
  assert.equal(buildValidation(make([{ name: 'listen', kind: 'name' }], ['context_required']), INDEX), null);
  // 没有指令但有语法错误（例如只有一个多余的 }）仍有校验结果：语法 fail。
  const onlyError = buildValidation(make([], [], [{ code: 'unexpected_closing_brace', message: '没有对应开块的闭括号。', line: 1, column: 1 }]), INDEX);
  assert.equal(onlyError.verdict, 'fail');
});

test('配置校验·语法：fail 时保留解析器的行列与中文 message，后两项 skipped 且 issues 为空', () => {
  const analysis = make([{ name: 'listen' }, { name: 'bogus' }], ['matched', 'unknown'], [{ code: 'missing_semicolon', message: '指令缺少分号。', line: 3, column: 7 }, { code: 'unclosed_block', message: '配置块缺少闭括号。', line: 1, column: 1 }]);
  const result = buildValidation(analysis, INDEX);
  assert.equal(result.verdict, 'fail');
  assert.deepEqual(byId(result, 'syntax'), { id: 'syntax', title: '语法', status: 'fail', issues: [{ line: 3, column: 7, message: '指令缺少分号。' }, { line: 1, column: 1, message: '配置块缺少闭括号。' }] });
  // 解析不可靠：未收录的 bogus 也不报告。
  for (const id of ['directive_names', 'context']) assert.deepEqual([byId(result, id).status, byId(result, id).issues], ['skipped', []], id);
  // 解析器没报错、但某条指令不完整（incomplete_directive）：归入语法，同样让后两项 skipped。
  const incomplete = buildValidation(make([{ name: 'listen', line: 4, column: 3 }], [{ status: 'invalid_input', reason: 'incomplete_directive', effective_context: null }]), INDEX);
  assert.deepEqual(byId(incomplete, 'syntax').issues, [{ line: 4, column: 3, message: 'listen 指令不完整（缺少分号或闭括号）。' }]);
  assert.equal(byId(incomplete, 'context').status, 'skipped');
});

test('配置校验·指令名：未收录 fail；仅大小写不同带 suggestions（最多 5 个）；数据块内条目不是检查对象', () => {
  const result = buildValidation(make([{ name: 'no_such', line: 2 }, { name: 'LISTEN', line: 5 }, { name: 'cLient_max_body_size', line: 6 }], ['unknown', 'unknown', 'unknown']), INDEX);
  assert.equal(result.verdict, 'fail');
  const names = byId(result, 'directive_names');
  assert.equal(names.status, 'fail');
  assert.deepEqual(names.issues[0], { line: 2, name: 'no_such', message: '索引中没有 no_such' });
  assert.equal(Object.hasOwn(names.issues[0], 'suggestions'), false);
  // 同一小写形式有多个规范名：全部列出（字典序）。
  assert.deepEqual(names.issues[1], { line: 5, name: 'LISTEN', message: 'Nginx 指令名区分大小写，LISTEN 不是有效的指令名；索引中有 Listen、listen', suggestions: ['Listen', 'listen'] });
  assert.deepEqual(names.issues[2].suggestions, ['client_max_body_size']);
  // suggestions 上限 5。
  const wide = buildValidation(make([{ name: 'abcxxxxxxx' }], ['unknown']), ['ABCXXXXXXX', 'abcXXXXXXX', 'aBcXXXXXXX', 'abCXXXXXXX', 'Abcxxxxxxx', 'aBCxxxxxxx', 'ABcxxxxxxx'].map(name => ({ name })));
  assert.equal(byId(wide, 'directive_names').issues[0].suggestions.length, 5);
  // 数据块内的 unknown（片段缺外层时 map 的键）：不进指令名检查；它们无法分析，归入上下文 needs_input。
  const data = buildValidation(make([{ name: 'map', line: 1 }, { name: 'Listen', line: 2, contexts: ['map'], parent_index: 0 }], ['ambiguous', 'unknown']), INDEX);
  assert.equal(byId(data, 'directive_names').status, 'pass');
  assert.equal(data.verdict, 'needs_input');
  assert.deepEqual(byId(data, 'context').issues.map(issue => [issue.line, issue.name]), [[1, 'map'], [2, 'Listen']]);
  // 即使 map 本身已匹配，只剩数据键为 unknown 时也不能 pass：宿主对非 matched 状态一律待补充，校验必须与闸门一致。
  const onlyData = buildValidation(make([{ name: 'map', line: 1 }, { name: 'Listen', line: 2, contexts: ['map'], parent_index: 0 }], ['matched', 'unknown']), INDEX);
  assert.equal(onlyData.verdict, 'needs_input'); assert.equal(byId(onlyData, 'directive_names').status, 'pass');
  assert.deepEqual(byId(onlyData, 'context').issues.map(issue => issue.name), ['Listen']);
  // 已收录的名字出现在数据块里（block_entry）不产生任何问题。
  assert.equal(buildValidation(make([{ name: 'map' }, { name: 'Listen', contexts: ['map'], parent_index: 0 }], ['matched', 'block_entry']), INDEX).verdict, 'pass');
});

test('配置校验·上下文：mismatch fail（带所在层级）、required/ambiguous needs_input、names fail 时仍检查其他指令', () => {
  const analysis = make([
    { name: 'listen', line: 1 }, { name: 'bogus', line: 2 }, { name: 'server', line: 3 }, { name: 'client_max_body_size', line: 4 },
  ], [
    { status: 'context_mismatch', reason: 'context_not_in_candidates', effective_context: 'events' },
    'unknown',
    'ambiguous',
    { status: 'context_required', reason: 'missing_context', effective_context: null },
  ]);
  const result = buildValidation(analysis, INDEX);
  assert.equal(result.verdict, 'fail');
  assert.equal(byId(result, 'directive_names').status, 'fail');
  const context = byId(result, 'context');
  assert.equal(context.status, 'fail');
  assert.deepEqual(context.issues, [
    { line: 1, name: 'listen', message: 'listen 不能出现在当前上下文（所在层级 events）' },
    { line: 3, name: 'server', message: 'server 需要补充上下文或模块' },
    { line: 4, name: 'client_max_body_size', message: 'client_max_body_size 需要补充上下文或模块' },
  ]);
  // 只有 needs_input：整体 needs_input；fail 优先于 needs_input 的优先级也在上面体现。
  const onlyNeeds = buildValidation(make([{ name: 'listen' }], ['context_required']), INDEX);
  assert.equal(onlyNeeds.verdict, 'needs_input'); assert.equal(byId(onlyNeeds, 'context').status, 'needs_input');
  // 其他状态：module_mismatch / context_conflict / invalid_input（非不完整）/ invalid_index 都按上下文 fail，保证与宿主闸门一致。
  for (const status of ['module_mismatch', 'context_conflict', 'invalid_input', 'invalid_index']) {
    const other = buildValidation(make([{ name: 'listen' }], [{ status, reason: 'other', effective_context: null }]), INDEX);
    assert.equal(other.verdict, 'fail', status); assert.equal(byId(other, 'context').status, 'fail', status);
  }
});

test('配置校验·限制：每个检查最多 20 条 issue，每条 message 最多 200 字符，指令名展示最多 100 字符', () => {
  const long = 'a'.repeat(300);
  const directives = Array.from({ length: 30 }, (_, i) => ({ name: i === 0 ? long : `bogus_${i}`, line: i + 1 }));
  const result = buildValidation(make(directives, directives.map(() => 'unknown')), INDEX);
  const names = byId(result, 'directive_names');
  assert.equal(names.issues.length, VALIDATION_ISSUE_LIMIT);
  assert.equal(names.issues[0].name.length, 100); assert.ok(names.issues[0].name.endsWith('…'));
  for (const issue of names.issues) assert.ok(issue.message.length <= VALIDATION_MESSAGE_MAX);
  // 语法错误同样受上限和长度限制。
  const errors = Array.from({ length: 25 }, (_, i) => ({ code: 'x', message: '错'.repeat(300), line: i + 1, column: 1 }));
  const syntax = byId(buildValidation(make([{ name: 'listen' }], ['matched'], errors), INDEX), 'syntax');
  assert.equal(syntax.issues.length, VALIDATION_ISSUE_LIMIT);
  for (const issue of syntax.issues) assert.ok(issue.message.length <= VALIDATION_MESSAGE_MAX);
});

// ---- 集成：经过完整请求链路（意图 → 解析 → 报告 → 缓存 / 恢复） ----

async function setup(t, overrides = {}) {
  await mkdir(join(ROOT, '.state'), { recursive: true });
  const dir = await mkdtemp(join(ROOT, '.state/validation-'));
  const spike = await Spike.create({ stateDir: dir, mockDelayMs: 1, ...overrides });
  t.after(async () => {
    await spike.close();
    spike.snapshot = null; spike.jobs.clear();
    if (spike.mock) spike.mock.requests.length = 0;
    await rm(dir, { recursive: true, force: true });
  });
  const release = (await spike.ready()).release;
  return { spike, run: async (message, id, extra = {}) => { const job = spike.start({ message, release, ...extra }, id); await job.done; return job; } };
}
// 宿主“待补充”判定（与 session.mjs 的 pendingInput 同式），只用 job 上已有的解析结果计算。
const pending = job => Boolean(job.questions.length || job.parsed.errors.length || !job.parsed.directives.length || job.matches.some(match => !['matched', 'block_entry'].includes(match.status)));

// 覆盖各类状态的配置样例。expect 为期望的 verdict 与各检查状态。
const CASES = [
  ['正常 events', fixtures.events.input, 'pass', ['pass', 'pass', 'pass']],
  ['正常 stream', fixtures.stream.input, 'pass', null],
  ['正常 vts', fixtures.vts.input, 'pass', null],
  ['含 map 数据块的完整配置', fixtures.map.input, 'pass', ['pass', 'pass', 'pass']],
  ['语法错（块未闭合）', fixtures.invalid.input, 'fail', ['fail', 'skipped', 'skipped']],
  ['语法错（http server 缺括号）', 'http { server { listen 80; }', 'fail', ['fail', 'skipped', 'skipped']],
  ['未收录', 'events { no_such_directive on; }', 'fail', ['pass', 'fail', 'pass']],
  ['大小写错', 'cLient_max_body_size 2100k;', 'fail', ['pass', 'fail', 'pass']],
  ['正确写法但无外层', 'client_max_body_size 2100k;', 'needs_input', ['pass', 'pass', 'needs_input']],
  ['上下文不符', 'events { listen 80; }', 'fail', ['pass', 'pass', 'fail']],
  ['片段中的 map 数据键', 'map $a $b { default 1; }', 'needs_input', ['pass', 'pass', 'needs_input']],
  ['主配置顶层指令缺上下文', 'worker_processes 2;\nerror_log logs/error.log;', 'needs_input', ['pass', 'pass', 'needs_input']],
  ['片段 server', fixtures.fragment.input, null, null],
];

test('配置校验·一致性：verdict === pass 当且仅当宿主不需要待补充（多种配置样例）', async t => {
  const { run } = await setup(t);
  for (const [name, message, verdict, statuses] of CASES) {
    const job = await run(message);
    assert.notEqual(job.state, 'failed', `${name}：${job.error}`);
    assert.ok(job.validation, name);
    // 一致性断言：校验通过 ⇔ 宿主判定不需要待补充。
    assert.equal(job.validation.verdict === 'pass', !pending(job), name);
    // 状态与最终 state 也一致：pass 的无问题配置完成，其余停在 awaiting_input。
    assert.equal(job.state === 'completed', job.validation.verdict === 'pass', name);
    if (verdict) assert.equal(job.validation.verdict, verdict, name);
    if (statuses) assert.deepEqual(job.validation.checks.map(check => check.status), statuses, name);
    // 视图（API 返回）带有同样的字段。
    assert.deepEqual(job.validation.notChecked, NOT_CHECKED, name);
  }
});

// 应当通过校验的“容易误伤”的写法：它们都含有看起来像语法错误或未知指令的片段，但都是合法配置。
// 校验必须判 pass，且与宿主待补充判定一致，不能被闸门拦下（拦下会让用户的正确配置得不到解释）。
const PASS_CASES = [
  ['Lua 字符串里含 }', 'http { server { listen 80; location / { content_by_lua_block { ngx.say("}") } } } }'],
  ['Lua 长括号 [[ } ]]', 'http { server { listen 80; location / { content_by_lua_block { ngx.say([[ } ]]) } } } }'],
  ["content_by_lua '...'", `http { server { listen 80; location / { content_by_lua 'ngx.say("hi")'; } } }`],
  ['vhost_traffic_status_display', 'http { vhost_traffic_status_zone; server { listen 8080; location /status { vhost_traffic_status_display; } } }'],
  ['more_set_headers', 'http { server { listen 80; location / { more_set_headers "X-A: b"; } } }'],
  ['include mime.types', 'http { include mime.types; server { listen 80; } }'],
  ['geo 条目（block_entry）', 'http { geo $g { default 0; 10.0.0.0/8 1; } }'],
  ['“这是主配置”声明加顶层指令', '这是主配置。\nworker_processes 2;\nerror_log logs/error.log;'],
  ['CRLF 换行', 'events {\r\n  worker_connections 1024;\r\n}\r\n'],
  ['# 注释里的 }', 'events {\n  # } 这是注释里的括号\n  worker_connections 1024;\n}'],
  ['混合 http / stream', 'http { server { listen 80; } }\nstream { server { listen 9000; } }'],
  ['带引号的 set $x "a;b"', 'http { server { listen 80; location / { set $x "a;b"; } } }'],
];

test('配置校验·误伤保护：易误判为错误的合法写法都是 pass，与宿主待补充判定一致，不被闸门拦下', async t => {
  const { run } = await setup(t);
  for (const [name, message] of PASS_CASES) {
    const job = await run(message);
    assert.notEqual(job.state, 'failed', `${name}：${job.error}`);
    assert.ok(job.validation, name);
    assert.equal(job.validation.verdict, 'pass', `${name}：${JSON.stringify(job.validation.checks)}`);
    assert.deepEqual(job.validation.checks.map(check => check.status), ['pass', 'pass', 'pass'], name);
    // 与宿主判定一致：不需要待补充，最终完成；没有被闸门拦下。
    assert.equal(pending(job), false, name);
    assert.equal(job.state, 'completed', name);
    assert.deepEqual(job.metrics.gate, { verdict: 'pass', modelSkipped: false }, name);
  }
});

test('配置校验·具体内容：大小写错给出建议；上下文不符给出层级；行号取相对配置原文', async t => {
  const { run } = await setup(t);
  const typo = await run('cLient_max_body_size 2100k;');
  const names = byId(typo.validation, 'directive_names');
  assert.equal(names.status, 'fail');
  assert.deepEqual(names.issues, [{ line: 1, name: 'cLient_max_body_size', message: 'Nginx 指令名区分大小写，cLient_max_body_size 不是有效的指令名；索引中有 client_max_body_size', suggestions: ['client_max_body_size'] }]);
  // 与配置大小写提示（notice）共用同一判定：提示里也是这条建议。
  assert.match(typo.inputResolution.notice, /cLient_max_body_size[\s\S]*client_max_body_size/);
  const mismatch = await run('events {\n  worker_connections 10;\n  listen 80;\n}');
  const context = byId(mismatch.validation, 'context');
  assert.equal(context.status, 'fail');
  assert.deepEqual(context.issues, [{ line: 3, name: 'listen', message: 'listen 不能出现在当前上下文（所在层级 events）' }]);
  // 与 questions 口径一致：第 N 行相同。
  const needs = await run('\n\nclient_max_body_size 2100k;');
  assert.match(needs.questions[0], /第 3 行 client_max_body_size/);
  assert.equal(byId(needs.validation, 'context').issues[0].line, 3);
  // 围栏内的配置：行号相对配置原文（围栏内容），不是整条消息。
  const fenced = await run('请看这段\n说明文字\n```nginx\n\nclient_max_body_size 2100k;\n```');
  assert.equal(byId(fenced.validation, 'context').issues[0].line, 2);
});

// ---- 闸门：校验 fail 时不调用模型选字段；needs_input 与 pass 保持原行为 ----

const asked = config => `请解释默认值\n\`\`\`nginx\n${config}\n\`\`\``;

test('配置校验闸门·fail：带问题与只有配置都不调用模型选字段，仅意图 1 次，awaiting_input、不写缓存、仍带 validation 与 questions', async t => {
  const { spike, run } = await setup(t);
  const failing = [
    ['大小写错', 'cLient_max_body_size 2100k;'],
    ['语法错', 'http { server { listen 80; }'],
    ['块未闭合', fixtures.invalid.input],
    ['未收录', 'events { no_such_directive on; }'],
    ['上下文不符', 'events { listen 80; }'],
  ];
  for (const [name, config] of failing) {
    for (const message of [config, asked(config)]) {
      const before = spike.mock.requests.length;
      const job = await run(message);
      const label = `${name}：${message.slice(0, 20)}`;
      assert.equal(job.validation.verdict, 'fail', label);
      assert.equal(job.state, 'awaiting_input', label);
      // 只有意图阶段一次请求：没有任何字段选择请求，也没有纠正请求。
      assert.equal(job.metrics.modelRoundTrips, 1, label);
      assert.equal(spike.mock.requests.length - before, 1, label);
      assert.equal(spike.mock.requests.at(-1).phase, 'input_resolution', label);
      // 没有选字段结果（包括默认字段回填）；解析、匹配与既有 questions 仍在。
      assert.equal(job.modelSelection, null, label);
      assert.ok(job.parsed && job.matches, label); assert.ok(Array.isArray(job.questions), label);
      assert.equal(job.cacheHit, false, label);
      // 记录“因校验失败跳过模型”：只有枚举与布尔值。
      assert.deepEqual(job.metrics.gate, { verdict: 'fail', modelSkipped: true }, label);
      // 配置原文仍被识别并成为会话对象（与改动前一致，用于追问与展示）。
      assert.equal(job.inputResolution.action, 'config', label);
    }
  }
  // 不写完成缓存：同一消息再次请求仍是意图 1 次、没有命中缓存。
  assert.deepEqual(await readdir(join(spike.config.stateDir, 'cache')), []);
  const again = await run(asked('cLient_max_body_size 2100k;'));
  assert.equal(again.cacheHit, false); assert.equal(again.metrics.modelRoundTrips, 1);
});

test('配置校验闸门·fail 的典型场景：大小写错 + 问题', async t => {
  const { spike, run } = await setup(t);
  const job = await run('默认值是什么？\n```nginx\ncLient_max_body_size 2100k;\n```');
  assert.equal(job.validation.verdict, 'fail');
  assert.deepEqual(job.validation.checks.map(check => check.status), ['pass', 'fail', 'pass']);
  assert.deepEqual(job.validation.checks[1].issues[0].suggestions, ['client_max_body_size']);
  assert.equal(job.state, 'awaiting_input'); assert.equal(job.modelSelection, null);
  assert.equal(job.metrics.modelRoundTrips, 1);
  assert.equal(spike.mock.requests.filter(request => request.phase !== 'input_resolution').length, 0);
  // 恢复后仍是这个结果（会话元数据保存 validation）。
  assert.equal((await spike.restore(job.sessionId)).validation.verdict, 'fail');
});

test('配置校验闸门·needs_input 与 pass 保持原行为：带问题仍调用模型（意图 + 选择共 2 次），只有配置仍走默认字段回填（1 次）', async t => {
  const { spike, run } = await setup(t);
  // needs_input：缺上下文。带问题仍调模型；不阻止，可按候选回答。
  const needs = await run(asked('client_max_body_size 2100k;'));
  assert.equal(needs.validation.verdict, 'needs_input');
  assert.equal(needs.state, 'awaiting_input'); assert.equal(needs.metrics.modelRoundTrips, 2);
  assert.ok(needs.modelSelection); assert.deepEqual(needs.metrics.gate, { verdict: 'needs_input', modelSkipped: false });
  assert.equal(spike.mock.requests.filter(request => request.phase === 'field_selection').length, 1);
  // needs_input 只有配置：默认字段回填（原行为），不调选择模型。
  const needsOnly = await run('client_max_body_size 2100k;');
  assert.equal(needsOnly.metrics.modelRoundTrips, 1); assert.ok(needsOnly.modelSelection);
  // pass：带问题 2 次，只有配置 1 次，且完成。
  const pass = await run(asked(fixtures.events.input));
  assert.equal(pass.validation.verdict, 'pass'); assert.equal(pass.state, 'completed');
  assert.equal(pass.metrics.modelRoundTrips, 2); assert.deepEqual(pass.metrics.gate, { verdict: 'pass', modelSkipped: false });
  const passOnly = await run(fixtures.events.input);
  assert.equal(passOnly.metrics.modelRoundTrips, 1); assert.ok(passOnly.modelSelection);
  // 名称查询没有 validation，也没有 gate 记录，行为不变（带问题的名称查询仍走字段选择）。
  const named = await run('worker_connections 的默认值是什么');
  assert.equal(named.validation, null); assert.equal('gate' in named.metrics, false); assert.equal(named.metrics.modelRoundTrips, 2);
});

test('配置校验闸门·通过 → 错误配置被拦 → 追问仍沿用上一份通过的配置；restore 的对象也是通过的那份', async t => {
  const { spike, run } = await setup(t);
  const good = 'events { worker_connections 10; }';
  const bad = 'events { Bogus 1; }';
  const first = await run(good);
  assert.equal(first.validation.verdict, 'pass');
  const blocked = await run(bad, first.sessionId);
  assert.equal(blocked.validation.verdict, 'fail'); assert.equal(blocked.state, 'awaiting_input'); assert.equal(blocked.metrics.modelRoundTrips, 1);
  // 本轮真实情况仍在 job（右侧展示用）与元数据里。
  assert.equal(blocked.normalizedRequest.input, bad);
  const saved = await spike.restore(first.sessionId);
  assert.equal(saved.request.message, bad); assert.equal(saved.normalizedRequest.input, bad);
  assert.equal(saved.inputResolution.action, 'config'); assert.equal(saved.validation.verdict, 'fail'); assert.equal(saved.state, 'awaiting_input');
  // 但追问沿用的对象没有被覆盖：currentConfig 与 currentSubject 仍是通过的那份。
  assert.equal(saved.currentConfig.input, good); assert.equal(saved.currentSubject.input, good);
  const follow = await run('刚才这段有哪些限制', first.sessionId);
  assert.equal(follow.inputResolution.action, 'followup', follow.error);
  assert.equal(follow.normalizedRequest.input, good); assert.equal(follow.validation.verdict, 'pass');
  assert.equal(follow.state, 'completed', follow.error); assert.equal(follow.metrics.modelRoundTrips, 2);
  // 修正后重新提交正确配置：正常覆盖当前对象。
  const fixed = 'events { worker_connections 20; }';
  const again = await run(fixed, first.sessionId);
  assert.equal(again.validation.verdict, 'pass');
  const after = await spike.restore(first.sessionId);
  assert.equal(after.currentConfig.input, fixed); assert.equal(after.currentSubject.input, fixed);
});

test('配置校验闸门·没有上一个对象时，被拦的配置不成为当前对象，追问按“没有上次对象”澄清；恢复卡只剩本轮 normalizedRequest', async t => {
  const { spike, run } = await setup(t);
  const bad = await run('events { Bogus 1; }');
  assert.equal(bad.validation.verdict, 'fail');
  const saved = await spike.restore(bad.sessionId);
  assert.equal(saved.currentConfig, null); assert.equal(saved.currentSubject, null);
  // restore 仍返回本轮的 normalizedRequest 与 validation（前端据此显示本轮结果，而不是把它当作可沿用的“当前对象”）。
  assert.equal(saved.normalizedRequest.input, 'events { Bogus 1; }'); assert.equal(saved.validation.verdict, 'fail');
  const follow = await run('刚才这段有哪些限制', bad.sessionId);
  assert.equal(follow.inputResolution.action, 'clarify'); assert.equal(follow.normalizedRequest, null);
  assert.match(follow.inputResolution.message, /没有可沿用/);
  assert.equal(follow.metrics.modelRoundTrips, 1);
});

test('配置校验闸门·fail 后用户修正配置再提交，再追问：追问沿用修正后的配置并正常查询', async t => {
  const { spike, run } = await setup(t);
  const bad = await run(asked('cLient_max_body_size 2100k;'));
  assert.equal(bad.validation.verdict, 'fail'); assert.equal(bad.metrics.modelRoundTrips, 1);
  // 修正：写成正确写法并补上外层，通过校验。
  const fixedConfig = 'http { server { listen 80; client_max_body_size 2100k; } }';
  const fixed = await run(asked(fixedConfig), bad.sessionId);
  assert.equal(fixed.validation.verdict, 'pass', JSON.stringify(fixed.validation.checks)); assert.equal(fixed.state, 'completed');
  assert.equal(fixed.metrics.modelRoundTrips, 2);
  const saved = await spike.restore(bad.sessionId);
  assert.equal(saved.currentConfig.input, fixedConfig); assert.equal(saved.currentSubject.input, fixedConfig);
  const follow = await run('刚才这段有哪些限制', bad.sessionId);
  assert.equal(follow.inputResolution.action, 'followup', follow.error);
  assert.equal(follow.normalizedRequest.input, fixedConfig); assert.equal(follow.validation.verdict, 'pass');
  assert.equal(follow.metrics.modelRoundTrips, 2);
});

test('配置校验闸门·needs_input 的配置照旧成为当前对象（只有 fail 不更新）', async t => {
  const { spike, run } = await setup(t);
  const first = await run('events { worker_connections 10; }');
  const needs = await run('client_max_body_size 2100k;', first.sessionId);
  assert.equal(needs.validation.verdict, 'needs_input');
  const saved = await spike.restore(first.sessionId);
  assert.equal(saved.currentConfig.input, 'client_max_body_size 2100k;'); assert.equal(saved.currentSubject.input, 'client_max_body_size 2100k;');
});

test('配置校验闸门·联网开启时校验失败的配置也不调用模型、不联网', async t => {
  const { spike, run } = await setup(t, { webSearch: true });
  const job = await run(asked('events { no_such_directive on; }'));
  assert.equal(job.validation.verdict, 'fail');
  assert.equal(job.metrics.modelRoundTrips, 1); assert.equal(job.webSearch.calls, 0);
  assert.equal(spike.mock.webCalls.length, 0);
  assert.equal(job.state, 'awaiting_input'); assert.deepEqual(job.webReferences, []);
});

test('配置校验闸门·请求结束日志带 gate：只有枚举与布尔值，不含配置内容', async t => {
  const { spike, run } = await setup(t, { logRequests: true });
  const logs = [];
  const originalLog = console.log;
  console.log = (...args) => logs.push(args.join(' '));
  t.after(() => { console.log = originalLog; });
  const job = await run(asked('cLient_max_body_size SECRET_ARG;'));
  console.log = originalLog;
  const entry = logs.map(line => { try { return JSON.parse(line); } catch { return null; } }).find(item => item?.event === 'agent_request_end' && item.requestId === job.requestId);
  assert.deepEqual(entry.gate, { verdict: 'fail', modelSkipped: true });
  assert.ok(!JSON.stringify(entry).includes('SECRET_ARG')); assert.ok(!JSON.stringify(entry).includes('cLient_max_body_size'));
  assert.ok(spike);
});

test('配置校验·null 场景：名称查询、澄清、问候、范围外没有 validation', async t => {
  const { run } = await setup(t);
  for (const message of ['worker_connections 的默认值是什么', 'no_such_directive 的默认值', '你好', '今天天气怎么样', '这个有什么问题']) {
    const job = await run(message);
    assert.equal(job.validation, null, message);
  }
});

test('配置校验·追问沿用配置时带同样的 validation；沿用名称对象时为 null', async t => {
  const { run } = await setup(t);
  const first = await run('client_max_body_size 2100k;');
  const follow = await run('刚才这段有哪些限制', first.sessionId);
  assert.equal(follow.inputResolution.action, 'followup', follow.error);
  assert.deepEqual(follow.validation, first.validation);
  // 名称对象：追问沿用的是 worker_connections（kind: name），没有配置可校验。
  const name = await run('worker_connections 的默认值是什么');
  const nameFollow = await run('继续解释它的默认值', name.sessionId);
  assert.equal(nameFollow.inputResolution.action, 'followup', nameFollow.error);
  assert.equal(nameFollow.validation, null);
});

test('配置校验·缓存命中与会话恢复仍返回 validation（随报告与会话元数据保存）', async t => {
  const { spike, run } = await setup(t);
  const first = await run(fixtures.events.input);
  assert.equal(first.validation.verdict, 'pass');
  const cached = await run(fixtures.events.input);
  assert.equal(cached.cacheHit, true); assert.equal(cached.metrics.modelRoundTrips, 0);
  assert.deepEqual(cached.validation, first.validation);
  // 缓存里的报告和 resolution 都带 validation。
  const files = await readdir(join(spike.config.stateDir, 'cache'));
  assert.ok(files.length > 0);
  // 恢复：已完成与待补充两类会话都能读到。
  assert.deepEqual((await spike.restore(first.sessionId)).validation, first.validation);
  assert.deepEqual((await spike.restore(cached.sessionId)).validation, first.validation);
  const needs = await run('client_max_body_size 2100k;');
  assert.equal(needs.validation.verdict, 'needs_input');
  assert.deepEqual((await spike.restore(needs.sessionId)).validation, needs.validation);
  // 视图（HTTP 返回的 job）也带 validation。
  assert.deepEqual(spike.view(needs).validation, needs.validation);
  // 名称查询的会话恢复为 null。
  const named = await run('worker_connections 的默认值是什么');
  assert.equal((await spike.restore(named.sessionId)).validation, null);
});

test('配置校验·不写入用户文字：注释、参数值、问题原文不出现在 validation 里；只有指令名与固定文案', async t => {
  const { run } = await setup(t);
  const message = '请解释SECRET_QUESTION_TEXT\n```nginx\n# SECRET_COMMENT_TEXT\nhttp { server { listen 80; cLient_max_body_size SECRET_ARG_2100k; Bogus_Dir SECRET_ARG_2 \"SECRET_STRING\"; } }\n```';
  const job = await run(message);
  assert.equal(job.validation.verdict, 'fail');
  const shown = JSON.stringify(job.validation);
  for (const secret of ['SECRET_QUESTION_TEXT', 'SECRET_COMMENT_TEXT', 'SECRET_ARG_2100k', 'SECRET_ARG_2', 'SECRET_STRING']) assert.ok(!shown.includes(secret), secret);
  // 指令名本身（用户写法）会出现，这是允许的。
  assert.ok(shown.includes('cLient_max_body_size')); assert.ok(shown.includes('Bogus_Dir'));
});
