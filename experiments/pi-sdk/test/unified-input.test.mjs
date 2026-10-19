import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { Spike, ROOT, cacheKey, compactHistory } from '../src/session.mjs';
import { serve } from '../server.mjs';
import { configMode, resolveInput, suggestNames, damerauLevenshtein, cacheMessage, refreshCanonicalNotice, caseMismatchNotice, appendResolutionNotice, SCOPE_REPLY, GREETING_REPLY, THANKS_REPLY } from '../src/input-resolution.mjs';
import { FIELD_SELECTION_OUTPUT, FIELD_SELECTION_RETRY, FIELD_SELECTION_PARSE_RETRY } from '../src/report.mjs';
import { UPSTREAM_MESSAGE, PARSE_MESSAGE } from '../src/errors.mjs';
import { fixtures } from './fixtures/configs.mjs';

async function setup(t, overrides = {}) {
  await mkdir(join(ROOT, '.state'), { recursive: true });
  const dir = await mkdtemp(join(ROOT, '.state/unified-'));
  const spike = await Spike.create({ stateDir: dir, mockDelayMs: 1, ...overrides });
  // node:test 会保留 after 钩子的闭包直至整个文件结束；这里释放知识快照与记录的模型请求，避免文件内累积超出堆上限。
  t.after(async () => {
    await spike.close();
    spike.snapshot = null; spike.jobs.clear();
    if (spike.mock) spike.mock.requests.length = 0;
    await rm(dir, { recursive: true, force: true });
  });
  const release = (await spike.ready()).release;
  return { spike, release, run: async (message, id, extra = {}) => {
    const job = spike.start({ message, release, ...extra }, id); await job.done; return job;
  } };
}
async function wait(check) { for (let i = 0; i < 1000 && !check(); i++) await delay(5); assert.ok(check(), '等待阶段超时'); }

test('统一输入校验：发布必填、新旧字段冲突、UTF-8字节限制；旧入口保留', async t => {
  const { spike, release, run } = await setup(t);
  for (const raw of [{ message: '' }, { message: '   ', release }, { message: 'events {}' },
    ...['input', 'mode', 'question', 'context', 'module'].map(key => ({ message: 'events {}', release, [key]: '' }))]) assert.throws(() => spike.start(raw));
  spike.config.maxInputBytes = 5;
  assert.throws(() => spike.start({ message: '中文', release }), /过大/);
  spike.config.maxInputBytes = 32768;
  const old = spike.start(fixtures.events); await old.done;
  assert.equal(old.state, 'completed'); assert.equal(old.metrics.modelRoundTrips, 0);
  const long = await run('# ' + '中'.repeat(4500) + '\nevents {}');
  assert.equal(long.state, 'completed', long.error);
});

test('纯配置经一次意图请求、确定性main/single/fragment模式并展示默认字段', async t => {
  const { spike, run } = await setup(t);
  for (const name of ['events', 'stream', 'vts']) {
    const job = await run(fixtures[name].input);
    assert.equal(job.state, 'completed', job.error); assert.equal(job.normalizedRequest.input, fixtures[name].input);
    assert.equal(job.normalizedRequest.mode, 'main'); assert.equal(job.inputResolution.action, 'config');
    assert.equal(job.metrics.modelRoundTrips, 1); assert.ok(job.metrics.stages.intentMs >= 0);
    for (const field of ['summary', 'limitations', 'runtime']) assert.ok(job.modelSelection.facts.some(fact => fact.field === field));
  }
  assert.equal(configMode('server { listen 80; }'), 'fragment');
  assert.equal(configMode('worker_connections 512;'), 'single');
  assert.deepEqual(spike.mock.requests[0].tools, []);
});

test('混合消息保留中文、emoji、CRLF、注释和Lua原文，字段阶段不再重放完整配置', async t => {
  const { spike, run } = await setup(t);
  const input = '# 中文🙂\r\nhttp { server { location / { content_by_lua_block { ngx.say("{中文🙂}") } } } }';
  const question = '请解释已有功能限制和代码原理';
  const message = question + '\r\n```nginx\r\n' + input + '\r\n```';
  const job = await run(message, undefined, { mockScenario: 'extended' });
  assert.equal(job.state, 'completed', job.error); assert.equal(job.normalizedRequest.input, input);
  const range = job.normalizedRequest.configRange;
  assert.equal(message.slice(range.start, range.end), input); assert.equal(job.normalizedRequest.question, question);
  assert.equal(job.metrics.modelRoundTrips, 2);
  assert.equal(job.metrics.rounds[0].phase, 'input_resolution'); assert.equal(job.metrics.rounds[1].phase, 'selection');
  assert.ok(JSON.stringify(spike.mock.requests[0].messages).includes('中文🙂'));
  assert.ok(!JSON.stringify(spike.mock.requests[1].messages).includes('ngx.say'));
  assert.deepEqual(spike.mock.requests[1].tools.sort(), ['analyze_config', 'query_knowledge']);
});

test('拒绝模型改写、补外层、发明名称、非法JSON和猜测mode，不缓存澄清', async t => {
  const { spike, run } = await setup(t);
  for (const mockScenario of ['intent-rewrite', 'intent-name', 'intent-invalid', 'intent-mode']) {
    const job = await run(fixtures.events.input, undefined, { mockScenario });
    assert.equal(job.state, 'awaiting_input', job.error); assert.equal(job.inputResolution.action, 'clarify');
    assert.equal(job.normalizedRequest, null); assert.equal(job.metrics.modelRoundTrips, 1);
    assert.deepEqual(job.parsed.errors, []); assert.ok(job.inputResolution.message);
  }
  assert.deepEqual(await readdir(join(spike.config.stateDir, 'cache')), []);
});

test('无对象澄清；显式名称独立查询、未知/多个名称不伪造配置', async t => {
  const { run } = await setup(t);
  for (const message of ['这个有什么问题', '刚才这段有哪些限制', 'no_such_directive 的默认值', 'proxy_pass 与 listen 的区别']) {
    const job = await run(message);
    assert.equal(job.state, 'awaiting_input', job.error); assert.equal(job.normalizedRequest, null);
  }
  const named = await run('worker_connections 的默认值是什么');
  assert.equal(named.inputResolution.action, 'directive'); assert.equal(named.normalizedRequest.input, 'worker_connections');
  assert.equal(named.normalizedRequest.inputSource, 'name'); assert.equal(named.state, 'awaiting_input', named.error);
  assert.ok(named.modelSelection.facts.some(fact => fact.field === 'defaults'));
  const ambiguous = await run('proxy_pass 的默认值');
  assert.equal(ambiguous.inputResolution.action, 'directive'); assert.equal(ambiguous.state, 'awaiting_input');
  assert.ok(ambiguous.matches.some(match => ['ambiguous', 'context_required'].includes(match.status)));
  const unknown = await run('no_such_directive on;');
  assert.equal(unknown.inputResolution.action, 'config'); assert.equal(unknown.state, 'awaiting_input');
  assert.equal(unknown.normalizedRequest.input, 'no_such_directive on;');
  assert.equal(unknown.matches[0].status, 'unknown');
  assert.equal(unknown.matches[0].reason, 'name_not_in_index');
  assert.match((await run('no_such_directive 的默认值')).inputResolution.message, /未收录/);
});

test('currentConfig独立于最近消息：名称、澄清与坏配置不覆盖；恢复与新实例追问沿用', async t => {
  const { spike, run, release } = await setup(t);
  const first = await run(fixtures.events.input);
  await run('worker_connections 的默认值', first.sessionId);
  assert.equal((await spike.restore(first.sessionId)).currentConfig.input, fixtures.events.input);
  await run(fixtures.events.input, first.sessionId);
  await run('这个有什么问题', first.sessionId);
  const invalid = await run(fixtures.invalid.input, first.sessionId);
  assert.equal(invalid.state, 'awaiting_input');
  const restored = await spike.restore(first.sessionId);
  assert.equal(restored.request.message, fixtures.invalid.input);
  assert.equal(restored.currentConfig.input, fixtures.events.input);
  const follow = await run('刚才这段有哪些限制', first.sessionId);
  assert.equal(follow.state, 'completed', follow.error); assert.equal(follow.inputResolution.action, 'followup');
  assert.equal(follow.normalizedRequest.input, fixtures.events.input); assert.equal(follow.normalizedRequest.release, release);
  assert.equal(follow.normalizedRequest.inputSource, 'meta');
  await spike.close();
  const restarted = await Spike.create({ ...spike.config });
  try {
    const next = restarted.start({ message: '继续解释刚才这段配置', release }, first.sessionId); await next.done;
    assert.equal(next.normalizedRequest.input, fixtures.events.input); assert.equal(next.state, 'completed', next.error);
  } finally { await restarted.close(); }
});

test('意图阶段和字段阶段取消均回滚记录/currentConfig，未完成轮次无缓存', async t => {
  const { spike, run, release } = await setup(t);
  const first = await run(fixtures.events.input);
  const before = JSON.parse(await readFile(spike.metadataPath(first.sessionId), 'utf8'));
  const history = await readFile(before.file, 'utf8');
  const caches = (await readdir(join(spike.config.stateDir, 'cache'))).length;
  spike.config.mockDelayMs = 120;
  for (const target of [1, 2]) {
    const pending = spike.start({ message: '默认值？\n' + fixtures.stream.input, release }, first.sessionId);
    await wait(() => pending.metrics.modelRoundTrips >= target);
    assert.throws(() => spike.start({ message: fixtures.events.input, release }), error => error.code === 'busy');
    await spike.cancel(pending.requestId); assert.equal(pending.state, 'cancelled');
    assert.equal(await readFile(before.file, 'utf8'), history);
    assert.equal((await spike.restore(first.sessionId)).currentConfig.input, fixtures.events.input);
    assert.equal((await readdir(join(spike.config.stateDir, 'cache'))).length, caches);
  }
});

test('语法通过但缺外层的片段可沿用；名称查询更新独立subject且保留配置', async t => {
  const { spike, run } = await setup(t);
  const fragment = 'server { listen 9000; proxy_pass example.invalid:443; }';
  const first = await run(fragment);
  assert.equal(first.state, 'awaiting_input');
  assert.equal((await spike.restore(first.sessionId)).currentConfig.input, fragment);
  const follow = await run('刚才这段有哪些限制', first.sessionId);
  assert.equal(follow.normalizedRequest.input, fragment); assert.equal(follow.normalizedRequest.mode, 'fragment');
  const named = await run('worker_connections 的默认值', first.sessionId);
  const restored = await spike.restore(named.sessionId);
  assert.equal(restored.currentConfig.input, fragment);
  assert.equal(restored.currentSubject.input, 'worker_connections');
  const nameFollow = await run('继续解释它的默认值', first.sessionId);
  assert.equal(nameFollow.normalizedRequest.input, 'worker_connections');
  const onlyName = await run('worker_connections 的默认值');
  const noConfig = await spike.restore(onlyName.sessionId);
  assert.equal(noConfig.currentConfig, null); assert.equal(noConfig.currentSubject.input, 'worker_connections');
  const onlyFollow = await run('默认值呢', onlyName.sessionId);
  assert.equal(onlyFollow.inputResolution.action, 'followup'); assert.equal(onlyFollow.normalizedRequest.input, 'worker_connections');
});

test('意图和字段阶段共享总超时、共享轮次预算，不提交新配置', async t => {
  const { spike, release } = await setup(t, { maxTurns: 1 });
  const limited = spike.start({ message: '默认值？\n' + fixtures.events.input, release }); await limited.done;
  assert.equal(limited.state, 'failed'); assert.equal(limited.metrics.modelRoundTrips, 1);
  assert.equal((await spike.restore(limited.sessionId)).currentConfig, null);
  spike.config.maxTurns = 16;
  spike.config.mockDelayMs = 200;
  spike.config.timeoutMs = 350;
  const timed = spike.start({ message: '默认值？\n' + fixtures.events.input, release }); await timed.done;
  assert.equal(timed.state, 'failed'); assert.match(timed.error, /超时/);
  assert.equal((await spike.restore(timed.sessionId)).currentConfig, null);
});

test('统一缓存命中零模型，归一化结果及独立会话配置可恢复，预算拒绝保留原记录', async t => {
  const { spike, run } = await setup(t);
  const first = await run(fixtures.events.input);
  const cached = await run(fixtures.events.input);
  assert.equal(cached.cacheHit, true); assert.equal(cached.metrics.modelRoundTrips, 0);
  assert.deepEqual(cached.normalizedRequest, first.normalizedRequest);
  assert.notEqual(cached.sessionId, first.sessionId);
  assert.equal((await spike.restore(cached.sessionId)).currentConfig.input, fixtures.events.input);
  const meta = JSON.parse(await readFile(spike.metadataPath(first.sessionId), 'utf8'));
  const before = await readFile(meta.file, 'utf8');
  spike.config.compactHistoryBytes = 256;
  const continued = await run('刚才这段有哪些限制', first.sessionId);
  assert.equal(continued.state, 'completed', continued.error);
  assert.notEqual(continued.errorCode, 'history_limit');
  // 追问成功后原 JSONL 仍在；随后只有本轮自身超过硬上限才拒绝，并且回滚到追问完成后的记录。
  const saved = await readFile(meta.file, 'utf8');
  assert.ok(saved.includes(before.slice(0, 40)));
  spike.config.maxHistoryBytes = 30;
  const limited = await run('再缩短这一问', first.sessionId);
  assert.equal(limited.errorCode, 'history_limit'); assert.match(limited.error, /本轮输入过大/);
  assert.equal(limited.metrics.modelRoundTrips, 0);
  assert.equal(await readFile(meta.file, 'utf8'), saved);
});

test('服务端拒绝跨发布追问；意图schema拒绝伪造字段及名称子串', () => {
  const snapshot = { index: { release_id: 'new-release', directives: [{ name: 'listen' }] } };
  const raw = { message: '刚才这段有哪些限制', release: 'new-release' };
  const result = resolveInput({ action: 'followup', input: '', question: raw.message, ignored: false }, raw, snapshot, { input: 'events {}', mode: 'main', release: 'old-release' });
  assert.equal(result.inputResolution.action, 'clarify'); assert.match(result.inputResolution.message, /发布/);
  const name = resolveInput({ action: 'directive', input: 'listen', question: '', ignored: false }, { message: 'not_listen' }, snapshot);
  assert.equal(name.normalizedRequest, null);
});

test('B01：多围栏默认mock与受控意图均澄清，不提交对象或完成缓存', async t => {
  const first = 'events { worker_connections 1024; }';
  const second = 'http { server { listen 80; } }';
  const message = '```nginx\n' + first + '\n```\n\n```nginx\n' + second + '\n```';
  for (const overrides of [{}, { mockIntentResult: { action: 'config', input: first, question: '', ignored: false } },
    { mockIntentResult: { action: 'directive', input: 'worker_connections', question: '', ignored: false } }]) {
    const { spike, run } = await setup(t, overrides);
    for (let i = 0; i < 2; i++) {
      const job = await run(message);
      assert.equal(job.state, 'awaiting_input'); assert.equal(job.inputResolution.action, 'clarify');
      assert.equal(job.normalizedRequest, null); assert.equal(job.cacheHit, false);
      const saved = await spike.restore(job.sessionId);
      assert.equal(saved.currentConfig, null); assert.equal(saved.currentSubject, null);
    }
    assert.deepEqual(await readdir(join(spike.config.stateDir, 'cache')), []);
  }
});

test('B03：配置外固定main声明可解析无根块主配置；注释、参数、Lua及引用不提升模式', async t => {
  const { run } = await setup(t);
  const input = 'worker_processes 2;\nerror_log logs/error.log;';
  for (const declaration of ['这是主配置。', '这是完整主配置：', '按 main 模式解析。', '按主配置解析。']) {
    const job = await run(declaration + '\n' + input);
    assert.equal(job.normalizedRequest?.mode, 'main', job.error);
    assert.equal(job.state, 'completed', job.error);
    assert.equal(job.normalizedRequest.question, '');
    assert.equal(job.metrics.modelRoundTrips, 1);
    assert.ok(job.parsed.directives.every(item => item.context === 'main'));
  }
  const ordinary = await run(input);
  assert.equal(ordinary.normalizedRequest.mode, 'fragment'); assert.equal(ordinary.state, 'awaiting_input');
  const snapshot = { index: { release_id: 'test', directives: [{ name: 'worker_processes' }, { name: 'set' }, { name: 'content_by_lua_block' }] } };
  for (const [message, config, question] of [
    ['# 这是主配置\n' + input, '# 这是主配置\n' + input, ''],
    ['set $x "这是主配置";', 'set $x "这是主配置";', '这是主配置'],
    ['content_by_lua_block { ngx.say([[\n这是主配置\n]]) }', 'content_by_lua_block { ngx.say([[\n这是主配置\n]]) }', '这是主配置'],
    ['"这是主配置"\n' + input, input, '"这是主配置"'],
    ['请不要按主配置解析。\n' + input, input, '请不要按主配置解析。'],
  ]) {
    const resolved = resolveInput({ action: 'config', input: config, question, ignored: false }, { message }, snapshot);
    assert.notEqual(resolved.normalizedRequest?.mode, 'main', message);
  }
});

test('B03：仅主配置声明走默认字段，带业务问题仍经过字段模型', async t => {
  const { run } = await setup(t);
  const input = 'worker_processes 2;\nerror_log logs/error.log;';
  const declaration = '这是完整主配置。';
  const job = await run(declaration + '\n' + input);
  assert.equal(job.normalizedRequest.mode, 'main'); assert.equal(job.normalizedRequest.question, '');
  assert.equal(job.normalizedRequest.input, input); assert.equal(job.state, 'completed', job.error);
  assert.equal(job.metrics.modelRoundTrips, 1); assert.equal(job.metrics.stages.modelMs, undefined);
  assert.equal(job.summary.matched, 2); assert.equal(job.modelSelection.status, undefined);
  for (const field of ['summary', 'limitations', 'runtime']) assert.ok(job.modelSelection.facts.some(fact => fact.field === field));
  assert.ok(job.modelSelection.resolvedFacts.some(fact => fact.text?.trim()));
  assert.ok(job.modelSelection.citations.length > 0);
  for (const question of [declaration + '请解释默认值。', declaration + '\n请解释默认值。']) {
    const asked = await run(question + '\n' + input);
    assert.equal(asked.normalizedRequest.question, question); assert.equal(asked.normalizedRequest.mode, 'main');
    assert.equal(asked.state, 'completed', asked.error); assert.equal(asked.metrics.modelRoundTrips, 2);
    assert.ok(asked.modelSelection.facts.some(fact => fact.field === 'defaults'));
  }
});

test('R01：完整纯配置及单围栏不能截为首块、内部单条或名称，保留注释', async t => {
  const first = 'events { worker_connections 1024; }';
  const whole = '# 保留注释🙂\r\n' + first + '\r\nhttp { server { listen 80; } }';
  const snapshot = { index: { release_id: 'test', directives: [{ name: 'events' }, { name: 'worker_connections' }, { name: 'http' }] } };
  for (const message of [whole, '说明已有功能。\n```nginx\r\n' + whole + '\r\n```']) {
    for (const [action, input] of [['config', first], ['config', 'worker_connections 1024;'], ['config', 'worker_connections'], ['directive', 'worker_connections']]) {
      assert.equal(resolveInput({ action, input, question: '', ignored: false }, { message }, snapshot).inputResolution.action, 'clarify');
    }
    assert.equal(resolveInput({ action: 'config', input: whole, question: '', ignored: false }, { message }, snapshot).normalizedRequest.input, whole);
  }
  const single = 'worker_connections 1024;';
  for (const action of ['config', 'directive']) assert.equal(resolveInput({ action, input: 'worker_connections', question: '', ignored: false }, { message: single }, snapshot).normalizedRequest, null);
  const { run, spike } = await setup(t, { mockIntentResult: { action: 'config', input: first, question: '', ignored: false } });
  const job = await run(whole);
  assert.equal(job.state, 'awaiting_input'); assert.equal(job.normalizedRequest, null);
  assert.deepEqual(await readdir(join(spike.config.stateDir, 'cache')), []);
});

test('R01：默认mock保留纯配置首尾注释；Lua字符串中的围栏不算独立代码块', async t => {
  const { run } = await setup(t);
  const input = '# 开头注释\nevents { worker_connections 1024; }\n# 结尾注释';
  const job = await run(input);
  assert.equal(job.state, 'completed', job.error); assert.equal(job.normalizedRequest.input, input);
  const lua = 'http { server { location / { content_by_lua_block { ngx.say([[\n```nginx\nevents {}\n```\n```nginx\nhttp {}\n```\n]]) } } } }';
  const resolved = await run(lua);
  assert.equal(resolved.state, 'completed', resolved.error); assert.equal(resolved.normalizedRequest.input, lua);
});

test('R01：unknown首条或首块不能被丢弃后完成或写缓存', async t => {
  const known = 'events { worker_connections 1024; }';
  const { spike, run } = await setup(t, { mockIntentResult: { action: 'config', input: known, question: '', ignored: false } });
  for (const prefix of ['unknown_first on;', 'unknown_first { unknown_child on; }']) {
    const message = prefix + '\n' + known;
    for (let i = 0; i < 2; i++) {
      const job = await run(message);
      assert.equal(job.state, 'awaiting_input'); assert.equal(job.inputResolution.action, 'clarify');
      assert.equal(job.normalizedRequest, null); assert.equal(job.cacheHit, false);
      const saved = await spike.restore(job.sessionId);
      assert.equal(saved.currentConfig, null); assert.equal(saved.currentSubject, null);
    }
    spike.config.mockIntentResult = { action: 'config', input: message, question: '', ignored: false };
    const complete = await run(message);
    assert.equal(complete.normalizedRequest.input, message); assert.equal(complete.matches[0].status, 'unknown');
    assert.equal(complete.state, 'awaiting_input');
    spike.config.mockIntentResult = { action: 'config', input: known, question: '', ignored: false };
  }
  assert.deepEqual(await readdir(join(spike.config.stateDir, 'cache')), []);
});

test('HTTP能力标识、完整/brief响应和恢复均提供统一输入契约', async t => {
  await mkdir(join(ROOT, '.state'), { recursive: true });
  const dir = await mkdtemp(join(ROOT, '.state/unified-http-'));
  const app = await serve({ port: 0, stateDir: dir, mockDelayMs: 100 }, { website: true });
  t.after(async () => { await app.close(); app.spike.snapshot = null; app.spike.jobs.clear(); if (app.spike.mock) app.spike.mock.requests.length = 0; await rm(dir, { recursive: true, force: true }); });
  const status = await (await fetch(new URL('api/status', app.url))).json();
  assert.equal(status.unifiedInput, true); assert.equal(status.retentionEnabled, true); assert.equal(status.sessionTtlMs, 259200000);
  const release = (await app.spike.ready()).release;
  const message = '默认值？\n' + fixtures.events.input;
  const response = await fetch(new URL('api/run', app.url), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ request: { message, release } }) });
  assert.equal(response.status, 202);
  const accepted = await response.json(); const job = app.spike.jobs.get(accepted.requestId);
  await wait(() => job.metrics.modelRoundTrips === 2);
  const brief = await (await fetch(new URL('api/jobs/' + job.requestId + '?brief=1', app.url))).json();
  assert.equal(brief.normalizedRequest.input, fixtures.events.input); assert.equal(brief.inputResolution.action, 'config'); assert.equal(brief.items, undefined);
  await job.done;
  const restored = await (await fetch(new URL('api/sessions/' + job.sessionId, app.url))).json();
  assert.equal(restored.request.message, message); assert.equal(restored.normalizedRequest.input, fixtures.events.input);
  const deleted = await fetch(new URL('api/sessions/' + job.sessionId, app.url), { method: 'DELETE' });
  assert.equal(deleted.status, 200); assert.deepEqual(await deleted.json(), { deleted: true });
  const again = await fetch(new URL('api/sessions/' + job.sessionId, app.url), { method: 'DELETE' });
  assert.equal(again.status, 200); assert.deepEqual(await again.json(), { deleted: false });
});

// 业务范围（意图契约 v2）：mock 只做关键词识别，真实判断由模型完成；此处只验证宿主的分支与状态。
const selectionCount = requests => requests.filter(request => request.phase === 'selection' || request.phase === 'field_selection').length;

test('业务范围：天气、写代码、执行命令与联网查询返回 out_of_scope，完成且不进入字段选择', async t => {
  const { spike, run } = await setup(t);
  for (const message of ['今天天气怎么样', '帮我写一个 Python 快速排序', '帮我执行命令 ls', '帮我联网查一下天气']) {
    const before = spike.mock.requests.length;
    const job = await run(message);
    assert.equal(job.inputResolution.action, 'out_of_scope', message);
    assert.equal(job.state, 'completed', job.error);
    assert.equal(job.normalizedRequest, null); assert.deepEqual(job.questions, []);
    assert.equal(job.metrics.toolCalls, 0); assert.equal(job.metrics.modelRoundTrips, 1);
    assert.equal(selectionCount(spike.mock.requests.slice(before)), 0, message);
    assert.match(job.inputResolution.message, /本服务只解释/);
  }
});

test('业务范围：问候与感谢返回 greeting，完成且不进入字段选择', async t => {
  const { spike, run } = await setup(t);
  for (const message of ['你好', '谢谢', '你是谁？']) {
    const before = spike.mock.requests.length;
    const job = await run(message);
    assert.equal(job.inputResolution.action, 'greeting', message);
    assert.equal(job.state, 'completed', job.error); assert.equal(job.normalizedRequest, null);
    assert.equal(selectionCount(spike.mock.requests.slice(before)), 0, message);
  }
});

test('业务范围：范围外与问候不改变当前配置与对象，之后追问仍沿用原配置', async t => {
  const { spike, run } = await setup(t);
  const first = await run(fixtures.events.input);
  await run('今天天气怎么样', first.sessionId);
  const greeting = await run('你好', first.sessionId);
  assert.equal(greeting.inputResolution.action, 'greeting');
  const restored = await spike.restore(first.sessionId);
  assert.equal(restored.currentConfig.input, fixtures.events.input);
  assert.equal(restored.currentSubject.input, fixtures.events.input);
  assert.equal(restored.inputResolution.action, 'greeting');
  const follow = await run('刚才这段有哪些限制', first.sessionId);
  assert.equal(follow.inputResolution.action, 'followup', follow.error);
  assert.equal(follow.normalizedRequest.input, fixtures.events.input);
});

test('业务范围：贴配置→问天气→问默认值，第三轮沿用配置，发给模型的对话内容不含天气', async t => {
  const { spike, run } = await setup(t);
  const first = await run(fixtures.events.input);
  assert.equal(first.inputResolution.action, 'config');
  const weather = await run('今天天气怎么样', first.sessionId);
  assert.equal(weather.inputResolution.action, 'out_of_scope'); assert.equal(weather.state, 'completed', weather.error);
  const before = spike.mock.requests.length;
  const third = await run('默认值呢', first.sessionId);
  assert.equal(third.inputResolution.action, 'followup', third.error);
  assert.equal(third.normalizedRequest.input, fixtures.events.input);
  // 系统提示包含范围说明（其中有“天气”字样），这里只检查用户、助手与工具消息。
  const conversation = spike.mock.requests.slice(before).flatMap(request => request.messages.filter(message => !['system', 'developer'].includes(message.role)));
  assert.ok(conversation.length > 0);
  assert.ok(!JSON.stringify(conversation).includes('天气'));
});

test('业务范围：指令名夹带跑题时降级为澄清，不直接拒绝', async t => {
  const { run } = await setup(t);
  const job = await run('proxy_pass 今天天气');
  assert.equal(job.inputResolution.action, 'clarify'); assert.equal(job.state, 'awaiting_input', job.error);
  assert.equal(job.normalizedRequest, null); assert.match(job.inputResolution.message, /指令名/);
});

test('业务范围：完整配置中的 weather.example.com 或注释中的天气不被当作跑题，正常完成', async t => {
  const { run } = await setup(t);
  for (const input of ['http { server { listen 80; server_name weather.example.com; } }', '# 天气站点说明\nhttp { server { listen 80; server_name weather.example.com; } }']) {
    const job = await run(input);
    assert.equal(job.inputResolution.action, 'config', job.error);
    assert.equal(job.state, 'completed', job.error); assert.equal(job.normalizedRequest.input, input);
    assert.equal(job.inputResolution.ignored, undefined);
  }
});

test('业务范围：配置加跑题句时业务问题正常处理，标记 ignored 并附提示', async t => {
  const { run } = await setup(t);
  const message = '请说明这段配置的默认值。今天天气怎么样？\n```nginx\n' + fixtures.events.input + '\n```';
  const job = await run(message);
  assert.equal(job.inputResolution.action, 'config', job.error);
  assert.equal(job.inputResolution.ignored, true);
  assert.equal(job.inputResolution.notice, '消息中与配置无关的部分未处理。');
  assert.equal(job.normalizedRequest.question, '请说明这段配置的默认值。');
  assert.equal(job.normalizedRequest.input, fixtures.events.input);
  assert.equal(job.state, 'completed', job.error);
});

test('业务范围：完整配置时模型给出 out_of_scope 或 greeting 仍澄清', async t => {
  for (const action of ['out_of_scope', 'greeting']) {
    const { run } = await setup(t, { mockIntentResult: { action, input: '', question: '', ignored: false } });
    const job = await run(fixtures.events.input);
    assert.equal(job.inputResolution.action, 'clarify', action); assert.equal(job.state, 'awaiting_input');
    assert.equal(job.normalizedRequest, null);
  }
});

test('业务范围：意图契约 v2 拒绝缺 ignored、非布尔 ignored 与多余键，统一澄清', async t => {
  const message = fixtures.events.input;
  for (const intent of [
    { action: 'config', input: message, question: '' },
    { action: 'config', input: message, question: '', ignored: 'false' },
    { action: 'config', input: message, question: '', ignored: false, mode: 'main' },
    { action: 'out_of_scope', input: '', question: '', ignored: 1 },
  ]) {
    const { run } = await setup(t, { mockIntentResult: intent });
    const job = await run(message);
    assert.equal(job.inputResolution.action, 'clarify', JSON.stringify(intent));
    assert.equal(job.state, 'awaiting_input'); assert.equal(job.normalizedRequest, null);
  }
});

test('业务范围：范围外与问候不写精确缓存，同一句在新会话重试会再次请求模型', async t => {
  const { spike, run } = await setup(t);
  for (const message of ['今天天气怎么样', '你好']) {
    const before = spike.mock.requests.length;
    const first = await run(message);
    const second = await run(message);
    assert.equal(first.state, 'completed', first.error); assert.equal(second.state, 'completed', second.error);
    assert.equal(second.cacheHit, false, message);
    assert.equal(second.inputResolution.action, first.inputResolution.action);
    // 两次都应走到意图请求，缓存未命中时模型会被再次调用。
    assert.equal(spike.mock.requests.slice(before).filter(request => request.phase === 'input_resolution').length, 2, message);
  }
  assert.deepEqual(await readdir(join(spike.config.stateDir, 'cache')), []);
});

test('业务范围：感谢返回感谢话术，问候返回介绍话术；范围外话术不提联网且说明可查询范围', async t => {
  const { run } = await setup(t);
  const thanks = await run('谢谢');
  assert.equal(thanks.inputResolution.action, 'greeting'); assert.equal(thanks.inputResolution.message, THANKS_REPLY);
  const hello = await run('你好');
  assert.equal(hello.inputResolution.action, 'greeting'); assert.equal(hello.inputResolution.message, GREETING_REPLY);
  assert.notEqual(THANKS_REPLY, GREETING_REPLY);
  assert.ok(!SCOPE_REPLY.includes('联网'));
  for (const keyword of ['天气', '执行命令', '读取文件', '通用代码', '指令名称']) assert.ok(SCOPE_REPLY.includes(keyword), keyword);
});

test('业务范围：围栏外两句以问号分隔，第一句为业务问题并标记 ignored', async t => {
  const { run } = await setup(t);
  const message = '这段配置的默认值呢？另外今天天气怎么样？\n```nginx\n' + fixtures.events.input + '\n```';
  const job = await run(message);
  assert.equal(job.inputResolution.action, 'config', job.error);
  assert.equal(job.inputResolution.ignored, true);
  assert.equal(job.normalizedRequest.question, '这段配置的默认值呢？');
  assert.equal(job.normalizedRequest.input, fixtures.events.input);
});

// 相近指令名建议：纯函数测试使用固定名称表，结果不依赖真实索引的增减。
const SUGGEST_NAMES = ['client_max_body_size', 'client_body_buffer_size', 'proxy_pass', 'proxy_ssl', 'listen', 'worker_connections', 'events', 'http', 'server', 'location', 'return', 'set', 'include'];

test('相近指令名建议：编辑距离与相邻换位计入，大小写完全匹配只返回命中项，无关名称不建议', () => {
  assert.equal(damerauLevenshtein('listen', 'lsiten'), 1);
  assert.equal(damerauLevenshtein('ab', 'ba'), 1);
  assert.equal(damerauLevenshtein('kitten', 'sitting'), 3);
  assert.equal(damerauLevenshtein('same', 'same'), 0);
  assert.ok(suggestNames('cLient_mEX_oody_size', SUGGEST_NAMES).includes('client_max_body_size'));
  assert.ok(suggestNames('client_max_body_sise', SUGGEST_NAMES).includes('client_max_body_size'));
  assert.ok(suggestNames('clinet_max_body_size', SUGGEST_NAMES).includes('client_max_body_size'));
  // 大小写完全匹配命中时只返回命中项，不再混入其他距离较近的名称。
  assert.deepEqual(suggestNames('Proxy_Pass', SUGGEST_NAMES), ['proxy_pass']);
  assert.deepEqual(suggestNames('zzzzzzzz_qqqq', SUGGEST_NAMES), []);
  // 短名称的阈值受“距离小于长度一半”约束，避免两字符输入被任意名称建议。
  assert.deepEqual(suggestNames('ab', ['ac', 'xy', 'abc']), []);
  // 同名去重：索引中重复出现的名称只建议一次。
  assert.deepEqual(suggestNames('proxy_pss', ['proxy_pass', 'proxy_pass']), ['proxy_pass']);
});

test('相近指令名建议：不超过上限，按距离升序再按名称字典序排序', () => {
  const many = ['abcdef5', 'abcdef1', 'abcdef4', 'abcdef2', 'abcdef3'];
  assert.deepEqual(suggestNames('abcdeg', many), ['abcdef1', 'abcdef2', 'abcdef3']);
  assert.deepEqual(suggestNames('abcdeg', many, 1), ['abcdef1']);
  assert.ok(suggestNames('cLient_mEX_oody_size', SUGGEST_NAMES).length <= 3);
  // 距离优先于字典序：hisxen（距离 2）字典序更靠前，但 lysten（距离 1）必须排在前面。
  assert.deepEqual(suggestNames('listen', ['hisxen', 'lysten']), ['lysten', 'hisxen']);
});

test('相近指令名建议：纯解析分支附带 suggestions 并保持原澄清语义，无建议文案不变', () => {
  const snapshot = { index: { release_id: 'test', directives: SUGGEST_NAMES.map(name => ({ name })) } };
  const directive = input => ({ action: 'directive', input, question: '', ignored: false });
  const near = resolveInput(directive('cLient_mEX_oody_size'), { message: 'cLient_mEX_oody_size' }, snapshot);
  assert.equal(near.normalizedRequest, null); assert.equal(near.inputResolution.action, 'clarify');
  assert.ok(near.inputResolution.suggestions.includes('client_max_body_size'));
  assert.equal(near.inputResolution.message, `当前知识发布索引未收录指令 cLient_mEX_oody_size。你是否想查：${near.inputResolution.suggestions.join('、')}？以上仅为名称相近的提示，未自动替换，请确认后重新输入。`);
  // 大小写唯一命中时采用索引原名，并说明原写法。不再停在“未收录”澄清。
  const caseOnly = resolveInput(directive('Proxy_Pass'), { message: 'Proxy_Pass' }, snapshot);
  assert.equal(caseOnly.inputResolution.action, 'directive');
  assert.equal(caseOnly.normalizedRequest.input, 'proxy_pass');
  assert.deepEqual(caseOnly.inputResolution.canonicalized, { from: 'Proxy_Pass', to: 'proxy_pass' });
  assert.equal(caseOnly.inputResolution.notice, '已按指令名 proxy_pass 理解（Nginx 指令名区分大小写，原写法 Proxy_Pass）。');
  // 无关名称：文案与改动前完全一致，且不写 suggestions 键。
  const plain = resolveInput(directive('zzzzzzzz_qqqq'), { message: 'zzzzzzzz_qqqq' }, snapshot);
  assert.equal(plain.inputResolution.message, '当前知识发布索引未收录指令 zzzzzzzz_qqqq，请核对名称或提供配置。');
  assert.equal(Object.hasOwn(plain.inputResolution, 'suggestions'), false);
  // 开启联网：蛇形未收录名仍走 unindexed 放行，不澄清、不带建议（即使它与已收录名很近）。
  const web = resolveInput(directive('client_max_body_sise'), { message: 'client_max_body_sise' }, snapshot, null, { webSearch: true });
  assert.equal(web.inputResolution.unindexed, true); assert.equal(web.inputResolution.action, 'directive');
  assert.equal(Object.hasOwn(web.inputResolution, 'suggestions'), false); assert.equal(web.normalizedRequest.input, 'client_max_body_sise');
  // 混合大小写的拼写错误仍有相近名称：即使开了联网，也给规范名建议，不把错名送去搜索。
  const upper = resolveInput(directive('cLient_mEX_oody_size'), { message: 'cLient_mEX_oody_size' }, snapshot, null, { webSearch: true });
  assert.equal(upper.inputResolution.action, 'clarify'); assert.ok(upper.inputResolution.suggestions.includes('client_max_body_size'));
});

test('相近指令名建议：整条 session 路径返回建议，awaiting_input，不进入字段选择', async t => {
  const { spike, run } = await setup(t);
  const job = await run('cLient_mEX_oody_size');
  assert.equal(job.inputResolution.action, 'clarify', job.error);
  assert.ok(job.inputResolution.suggestions.includes('client_max_body_size'));
  assert.ok(job.inputResolution.suggestions.length <= 3);
  assert.match(job.inputResolution.message, /你是否想查：.*client_max_body_size.*？以上仅为名称相近的提示，未自动替换，请确认后重新输入。/);
  assert.equal(job.state, 'awaiting_input', job.error); assert.equal(job.normalizedRequest, null);
  assert.equal(selectionCount(spike.mock.requests), 0);
  // 澄清结果随会话记录保存，恢复时建议保持一致。
  const restored = await spike.restore(job.sessionId);
  assert.deepEqual(restored.inputResolution.suggestions, job.inputResolution.suggestions);
  // 无建议的名称走 session 时文案保持原样。
  const plain = await run('zzzzzzzz_qqqq');
  assert.equal(plain.inputResolution.message, '当前知识发布索引未收录指令 zzzzzzzz_qqqq，请核对名称或提供配置。');
  assert.equal(plain.state, 'awaiting_input', plain.error); assert.equal(Object.hasOwn(plain.inputResolution, 'suggestions'), false);
});

test('相近指令名建议：开启联网时蛇形未收录名仍进入字段选择的联网放行路径', async t => {
  const { spike, run } = await setup(t, { webSearch: true });
  const job = await run('client_max_body_sise');
  assert.equal(job.inputResolution.action, 'directive', job.error); assert.equal(job.inputResolution.unindexed, true);
  assert.equal(Object.hasOwn(job.inputResolution, 'suggestions'), false); assert.equal(job.normalizedRequest.input, 'client_max_body_sise');
  assert.equal(job.state, 'awaiting_input', job.error);
  assert.ok(selectionCount(spike.mock.requests) > 0);
});

test('指令名大小写：全大写与混合大小写命中规范名并带说明，拼写错误仍建议规范名', async t => {
  const { run } = await setup(t);
  const upper = await run('CLIENT_MAX_BODY_SIZE 的默认值是什么');
  assert.equal(upper.inputResolution.action, 'directive', upper.error);
  assert.equal(upper.normalizedRequest.input, 'client_max_body_size');
  assert.deepEqual(upper.inputResolution.canonicalized, { from: 'CLIENT_MAX_BODY_SIZE', to: 'client_max_body_size' });
  assert.equal(upper.inputResolution.notice, '已按指令名 client_max_body_size 理解（Nginx 指令名区分大小写，原写法 CLIENT_MAX_BODY_SIZE）。');
  const mixed = await run('Client_Max_Body_Size 的默认值是什么');
  assert.equal(mixed.normalizedRequest.input, 'client_max_body_size', mixed.error);
  assert.equal(mixed.inputResolution.canonicalized.from, 'Client_Max_Body_Size');
  // 模型必须交回消息里的原词。宿主只在这之后做大小写归一，不接受模型改写后的小写名。
  const rewritten = resolveInput({ action: 'directive', input: 'client_max_body_size', question: '', ignored: false }, { message: 'CLIENT_MAX_BODY_SIZE 的默认值是什么' }, { index: { release_id: 'test', directives: [{ name: 'client_max_body_size' }] } });
  assert.equal(rewritten.normalizedRequest, null);
  const typo = await run('cLient_mEX_oody_size');
  assert.equal(typo.inputResolution.action, 'clarify');
  assert.ok(typo.inputResolution.suggestions.includes('client_max_body_size'));
});

test('指令名大小写：索引里有多种大小写时澄清并列出，不自动选择', () => {
  const snapshot = { index: { release_id: 'test', directives: [{ name: 'Listen' }, { name: 'listen' }, { name: 'proxy_pass' }] } };
  const ambiguous = resolveInput({ action: 'directive', input: 'LISTEN', question: '', ignored: false }, { message: 'LISTEN 的默认值' }, snapshot);
  assert.equal(ambiguous.normalizedRequest, null);
  assert.equal(ambiguous.inputResolution.action, 'clarify');
  assert.match(ambiguous.inputResolution.message, /Listen、listen/);
  assert.doesNotMatch(ambiguous.inputResolution.message, /proxy_pass/);
});

test('指令名大小写：ignored 提示与规范名说明都保留；多个名称和跑题比较不区分大小写', () => {
  const snapshot = { index: { release_id: 'test', directives: [{ name: 'client_max_body_size' }, { name: 'proxy_pass' }] } };
  const both = resolveInput({ action: 'directive', input: 'CLIENT_MAX_BODY_SIZE', question: '', ignored: true }, { message: 'CLIENT_MAX_BODY_SIZE 的默认值，另外今天天气怎么样' }, snapshot);
  assert.equal(both.normalizedRequest.input, 'client_max_body_size');
  assert.equal(both.inputResolution.ignored, true);
  assert.ok(both.inputResolution.notice.includes('消息中与配置无关的部分未处理。'));
  assert.ok(both.inputResolution.notice.includes('已按指令名 client_max_body_size 理解（Nginx 指令名区分大小写，原写法 CLIENT_MAX_BODY_SIZE）。'));
  const many = resolveInput({ action: 'directive', input: 'CLIENT_MAX_BODY_SIZE', question: '', ignored: false }, { message: 'CLIENT_MAX_BODY_SIZE 和 PROXY_PASS' }, snapshot);
  assert.equal(many.normalizedRequest, null);
  assert.match(many.inputResolution.message, /多个指令名称/);
  const same = resolveInput({ action: 'directive', input: 'CLIENT_MAX_BODY_SIZE', question: '', ignored: false }, { message: 'CLIENT_MAX_BODY_SIZE 就是 client_max_body_size' }, snapshot);
  assert.equal(same.normalizedRequest.input, 'client_max_body_size');
  const off = resolveInput({ action: 'out_of_scope', input: '', question: '', ignored: false }, { message: '今天天气怎么样 PROXY_PASS' }, snapshot);
  assert.equal(off.inputResolution.action, 'clarify');
  assert.match(off.inputResolution.message, /指令名/);
  const weather = resolveInput({ action: 'out_of_scope', input: '', question: '', ignored: false }, { message: '今天天气怎么样' }, snapshot);
  assert.equal(weather.inputResolution.action, 'out_of_scope');
});

test('指令名大小写：联网放行把混合大小写蛇形名收成小写，并带说明', async t => {
  const { run } = await setup(t, { webSearch: true });
  const job = await run('Ssl_Certificate_Cache 是做什么的');
  assert.equal(job.inputResolution.action, 'directive', job.error);
  assert.equal(job.inputResolution.unindexed, true);
  assert.equal(job.normalizedRequest.input, 'ssl_certificate_cache');
  assert.deepEqual(job.inputResolution.canonicalized, { from: 'Ssl_Certificate_Cache', to: 'ssl_certificate_cache' });
  assert.match(job.inputResolution.notice, /已按指令名 ssl_certificate_cache 理解（Nginx 指令名区分大小写，原写法 Ssl_Certificate_Cache）。/);
  assert.equal(job.state, 'awaiting_input', job.error);
});

const userText = message => typeof message.content === 'string' ? message.content : (message.content ?? []).map(part => part.text ?? '').join('');

test('选择阶段用户提示带 field_selection，并写明不要输出意图 JSON', async t => {
  const { spike, run } = await setup(t);
  const job = await run('worker_connections 的默认值是什么');
  assert.notEqual(job.state, 'failed', job.error);
  const selection = spike.mock.requests.filter(request => request.phase === 'field_selection');
  assert.equal(selection.length, 1);
  const prompt = JSON.parse(userText(selection[0].messages.findLast(message => message.role === 'user')));
  assert.equal(prompt.phase, 'field_selection');
  assert.equal(prompt.output, FIELD_SELECTION_OUTPUT);
});

test('选择阶段首次交回意图 JSON 时重试一次并完成，纠正消息不含用户原文', async t => {
  const { spike, run } = await setup(t);
  const question = '请解释已有默认值';
  const message = question + '\n```nginx\n' + fixtures.events.input + '\n```';
  const job = await run(message, undefined, { mockScenario: 'intent-echo' });
  assert.notEqual(job.state, 'failed', job.error);
  assert.equal(job.metrics.modelRoundTrips, 3);
  const retry = spike.mock.requests.find(request => request.phase === 'field_selection_retry');
  assert.ok(retry);
  const text = userText(retry.messages.findLast(item => item.role === 'user'));
  assert.equal(JSON.parse(text).instruction, FIELD_SELECTION_RETRY);
  assert.ok(!text.includes(fixtures.events.input));
  assert.ok(!text.includes(question));
  assert.equal(job.webSearch.calls, 0);
  assert.deepEqual(await readdir(join(spike.config.stateDir, 'cache')), []);
});

test('选择阶段两次都交回意图 JSON 时失败、不写缓存并回滚会话', async t => {
  const { spike, run } = await setup(t);
  const job = await run('请解释已有默认值\n```nginx\n' + fixtures.events.input + '\n```', undefined, { mockScenario: 'intent-echo-twice' });
  assert.equal(job.state, 'failed', job.error);
  assert.match(job.error, /模型报告契约无效/);
  assert.equal(job.metrics.modelRoundTrips, 3);
  assert.deepEqual(await readdir(join(spike.config.stateDir, 'cache')), []);
  const restored = await spike.restore(job.sessionId);
  assert.equal(restored.state, 'failed');
  assert.equal(restored.normalizedRequest, null);
  assert.equal(restored.currentConfig, null);
  assert.equal(restored.messages, 0);
});

test('缓存键折叠只发生在整句恰为一个规范名时；带其他文字或配置语法的消息保持原文', () => {
  const names = [{ name: 'client_max_body_size' }, { name: 'return' }, { name: 'set' }];
  // 整句恰为一个名称：大小写与首尾空白都折到索引原名。
  assert.equal(cacheMessage('Client_Max_Body_Size', names), 'client_max_body_size');
  assert.equal(cacheMessage('  CLIENT_MAX_BODY_SIZE\n', names), 'client_max_body_size');
  // 带其他文字：句中的普通英文词（Return、Set）可能只是巧合同名，语义不同的问法不得共用缓存。
  assert.equal(cacheMessage('Return 是什么意思', names), 'Return 是什么意思');
  assert.equal(cacheMessage('Set the value', names), 'Set the value');
  assert.equal(cacheMessage('Client_Max_Body_Size 的默认值是什么', names), 'Client_Max_Body_Size 的默认值是什么');
  assert.equal(cacheMessage('events { Worker_Connections 1024; }', names), 'events { Worker_Connections 1024; }');
  // 索引里同一小写形式有多个规范名时不猜测，保持原文。
  assert.equal(cacheMessage('LISTEN', [{ name: 'Listen' }, { name: 'listen' }]), 'LISTEN');
  // 未收录名称不折叠。
  assert.equal(cacheMessage('Ssl_Certificate_Cache', names), 'Ssl_Certificate_Cache');
});

test('缓存命中时按当前写法重算规范名说明，不沿用另一种写法留下的 notice', () => {
  const names = [{ name: 'client_max_body_size' }];
  const upper = { action: 'directive', ignored: true, notice: '消息中与配置无关的部分未处理。\n已按指令名 client_max_body_size 理解（Nginx 指令名区分大小写，原写法 CLIENT_MAX_BODY_SIZE）。', canonicalized: { from: 'CLIENT_MAX_BODY_SIZE', to: 'client_max_body_size' } };
  // 缓存来自大写写法，当前用户输入小写：说明与 canonicalized 都应去掉，ignored 提示保留。
  const lower = refreshCanonicalNotice(upper, 'client_max_body_size', names);
  assert.equal(lower.canonicalized, undefined);
  assert.equal(lower.notice, '消息中与配置无关的部分未处理。');
  assert.equal(lower.ignored, true);
  // 缓存来自小写（无说明），当前输入混合大小写：补上说明。
  const mixed = refreshCanonicalNotice({ action: 'directive' }, 'Client_Max_Body_Size', names);
  assert.deepEqual(mixed.canonicalized, { from: 'Client_Max_Body_Size', to: 'client_max_body_size' });
  assert.match(mixed.notice, /原写法 Client_Max_Body_Size/);
  // 只含规范名说明时，去掉后不留空 notice 键。
  assert.equal(Object.hasOwn(refreshCanonicalNotice({ action: 'directive', notice: upper.notice.split('\n')[1], canonicalized: upper.canonicalized }, 'client_max_body_size', names), 'notice'), false);
  // 非 directive 或整句不是单个名称：原样返回。
  const config = { action: 'config' };
  assert.equal(refreshCanonicalNotice(config, 'client_max_body_size', names), config);
  assert.equal(refreshCanonicalNotice(upper, 'Client_Max_Body_Size 的默认值', names), upper);
});

test('选择阶段首次输出不是 JSON：重试一次并完成，纠正句固定、不含原文、不写缓存', async t => {
  const { spike, run } = await setup(t);
  const question = '请解释已有默认值';
  const message = question + '\n```nginx\n' + fixtures.events.input + '\n```';
  const job = await run(message, undefined, { mockScenario: 'parse-once' });
  assert.notEqual(job.state, 'failed', job.error);
  assert.equal(job.metrics.modelRoundTrips, 3);
  const retries = spike.mock.requests.filter(request => request.phase === 'field_selection_retry');
  assert.equal(retries.length, 1);
  const text = userText(retries[0].messages.findLast(item => item.role === 'user'));
  assert.equal(JSON.parse(text).instruction, FIELD_SELECTION_PARSE_RETRY);
  assert.ok(!text.includes(fixtures.events.input));
  assert.ok(!text.includes(question));
  assert.ok(!text.includes('好的，我来选择字段'));
  assert.deepEqual(await readdir(join(spike.config.stateDir, 'cache')), []);
});

test('选择阶段首次输出为空：同样重试一次并完成', async t => {
  const { run } = await setup(t);
  const job = await run('请解释已有默认值\n```nginx\n' + fixtures.events.input + '\n```', undefined, { mockScenario: 'empty-once' });
  assert.notEqual(job.state, 'failed', job.error);
  assert.equal(job.metrics.modelRoundTrips, 3);
});

test('选择阶段两次都不是 JSON：报“模型输出无法解析”（parse 类）、不含模型原文、不写缓存并回滚会话', async t => {
  const { spike, run } = await setup(t);
  spike.config.logRequests = true;
  const logs = [];
  const originalLog = console.log;
  console.log = (...args) => logs.push(args.join(' '));
  t.after(() => { console.log = originalLog; });
  const job = await run('请解释已有默认值\n```nginx\n' + fixtures.events.input + '\n```', undefined, { mockScenario: 'parse-twice' });
  console.log = originalLog;
  assert.equal(job.state, 'failed');
  assert.equal(job.error, PARSE_MESSAGE);
  assert.equal(job.errorCategory, 'parse');
  // 只重试一次：意图 1 次 + 选择 1 次 + 纠正 1 次。
  assert.equal(job.metrics.modelRoundTrips, 3);
  assert.equal(spike.mock.requests.filter(request => request.phase === 'field_selection_retry').length, 1);
  assert.deepEqual(await readdir(join(spike.config.stateDir, 'cache')), []);
  const restored = await spike.restore(job.sessionId);
  assert.equal(restored.state, 'failed');
  assert.equal(restored.normalizedRequest, null);
  assert.equal(restored.currentConfig, null);
  assert.equal(restored.messages, 0);
  const entry = JSON.parse(logs.find(line => line.includes('agent_request_end')));
  assert.equal(entry.errorCategory, 'parse');
  assert.ok(!JSON.stringify(entry).includes('不是 JSON'));
});

test('契约无效与输出无法解析是两种固定文案和两个类别；解析失败不会被放宽解析接住', async t => {
  const { spike, run } = await setup(t);
  // bad-citation 能解析成 JSON，但引用不属于当前候选：contract 类，不触发重试。
  const contract = await run('请解释已有默认值\n```nginx\n' + fixtures.events.input + '\n```', undefined, { mockScenario: 'bad-citation' });
  assert.equal(contract.state, 'failed');
  assert.equal(contract.errorCategory, 'contract');
  assert.notEqual(contract.error, PARSE_MESSAGE);
  assert.equal(spike.mock.requests.filter(request => request.phase === 'field_selection_retry').length, 0);
  // invalid-json 两次都是 not json，不从文本里抓取 JSON：parse 类。
  const parse = await run('请解释已有默认值\n```nginx\n' + fixtures.events.input + '\n```', undefined, { mockScenario: 'invalid-json' });
  assert.equal(parse.errorCategory, 'parse');
  assert.equal(parse.error, PARSE_MESSAGE);
});

test('选择阶段两段并列 JSON：不能只取第一段，纠正一次后仍报无法解析', async t => {
  const { spike, run } = await setup(t);
  const question = '请解释已有默认值';
  const message = question + '\n```nginx\n' + fixtures.events.input + '\n```';
  const job = await run(message, undefined, { mockScenario: 'parse-multi' });
  assert.equal(job.state, 'failed');
  assert.equal(job.error, PARSE_MESSAGE);
  assert.equal(job.errorCategory, 'parse');
  // 若宿主抽走第一段，facts 非空，请求会完成或报「模型选择为空」，而不是无法解析。
  assert.notEqual(job.error, '模型选择为空');
  assert.equal(job.metrics.modelRoundTrips, 3);
  const retries = spike.mock.requests.filter(request => request.phase === 'field_selection_retry');
  assert.equal(retries.length, 1);
  const text = userText(retries[0].messages.findLast(item => item.role === 'user'));
  assert.equal(JSON.parse(text).instruction, FIELD_SELECTION_PARSE_RETRY);
  assert.ok(!text.includes(fixtures.events.input));
  assert.ok(!text.includes(question));
  assert.equal(job.modelSelection, null);
  assert.deepEqual(await readdir(join(spike.config.stateDir, 'cache')), []);
});

test('上游模型错误（HTTP 5xx、429）归为 upstream：固定文案、不自动重试、不泄露上游正文、不写缓存', async t => {
  for (const scenario of ['upstream-500', 'upstream-429']) {
    const { spike, run } = await setup(t);
    spike.config.logRequests = true;
    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    const question = '请解释已有默认值';
    const job = await run(question + '\n```nginx\n' + fixtures.events.input + '\n```', undefined, { mockScenario: scenario });
    console.log = originalLog;
    assert.equal(job.state, 'failed', scenario);
    assert.equal(job.error, UPSTREAM_MESSAGE, scenario);
    assert.equal(job.errorCategory, 'upstream', scenario);
    assert.ok(!JSON.stringify(job).includes('upstream-secret-body'), scenario);
    // 不自动重试：只有意图 1 次 + 失败的选择 1 次，没有纠正请求。
    assert.equal(job.metrics.modelRoundTrips, 2, scenario);
    assert.equal(spike.mock.requests.filter(request => request.phase === 'field_selection_retry').length, 0, scenario);
    const line = logs.find(item => item.includes('agent_request_end'));
    assert.equal(JSON.parse(line).errorCategory, 'upstream');
    assert.ok(!line.includes('upstream-secret-body'));
    assert.deepEqual(await readdir(join(spike.config.stateDir, 'cache')), []);
    // 会话回滚，下一次请求不受影响。
    const restored = await spike.restore(job.sessionId);
    assert.equal(restored.state, 'failed');
    assert.equal(restored.messages, 0);
  }
});

test('历史压缩省略意图形态的选择输出和纠正消息原文', () => {
  const secret = '用户配置原文标记';
  const messages = [
    { role: 'user', content: JSON.stringify({ phase: 'field_selection', output: FIELD_SELECTION_OUTPUT, request: { question: '下一问', mode: 'main', context: '', module: '' } }) },
    { role: 'assistant', content: [{ type: 'text', text: JSON.stringify({ action: 'directive', input: secret, question: secret, ignored: false }) }] },
    { role: 'user', content: JSON.stringify({ phase: 'field_selection_retry', instruction: FIELD_SELECTION_RETRY }) },
    { role: 'assistant', content: [{ type: 'text', text: JSON.stringify({ facts: [{ entryId: 'id', field: 'summary' }] }) }] },
    { role: 'user', content: JSON.stringify({ phase: 'input_resolution', message: '下一轮' }) },
  ];
  const compact = compactHistory(messages);
  assert.equal(compact[1].content[0].text, '[历史非引用输出已省略]');
  const retry = JSON.parse(compact[2].content[0].text);
  assert.equal(retry.phase, 'field_selection_retry');
  assert.equal(retry.message, '[字段选择纠正已省略]');
  assert.ok(!JSON.stringify(retry).includes(FIELD_SELECTION_RETRY));
  assert.ok(!compact[1].content[0].text.includes(secret));
  assert.ok(!JSON.stringify(retry).includes(secret));
});

// ---- 大写开头的普通词不计为指令名（Set / Return 等） ----

// 构造最小快照：同时含 set、return 等常见英文词同名指令与蛇形指令。
const wordSnapshot = { index: { release_id: 'test', directives: ['set', 'return', 'root', 'proxy_pass', 'client_max_body_size', 'listen'].map(name => ({ name })) } };
const directiveIntent = (input, ignored = false) => ({ action: 'directive', input, question: '', ignored });

test('普通词误判：Set proxy_pass 的作用按 proxy_pass 查询，Set 不计入多指令澄清', () => {
  const message = 'Set proxy_pass 的作用';
  const resolved = resolveInput(directiveIntent('proxy_pass'), { message }, wordSnapshot);
  assert.equal(resolved.inputResolution.action, 'directive');
  assert.equal(resolved.normalizedRequest.input, 'proxy_pass');
  // proxy_pass 已是索引原名，没有大小写说明，也没有澄清。
  assert.equal(resolved.inputResolution.notice, undefined);
  assert.equal(resolved.inputResolution.canonicalized, undefined);
  // 同类普通词：Return、Root、If、Map、Include、Listen 均不计入。
  for (const word of ['Return', 'Root', 'Listen', 'If', 'Map', 'Include']) {
    const one = resolveInput(directiveIntent('proxy_pass'), { message: `${word} proxy_pass 的作用` }, wordSnapshot);
    assert.equal(one.inputResolution.action, 'directive', word);
  }
});

test('普通词误判：含下划线的蛇形名、精确大小写名称、模型 input 本身仍计入', () => {
  // 蛇形名即使大小写不同也计入：Client_Max_Body_Size 与 Proxy_Pass 仍触发多名称澄清。
  const snake = resolveInput(directiveIntent('Client_Max_Body_Size'), { message: 'Client_Max_Body_Size 与 Proxy_Pass' }, wordSnapshot);
  assert.equal(snake.normalizedRequest, null);
  assert.match(snake.inputResolution.message, /多个指令名称/);
  // 精确大小写的 set 与 proxy_pass 仍澄清。
  const exact = resolveInput(directiveIntent('proxy_pass'), { message: 'set 和 proxy_pass' }, wordSnapshot);
  assert.equal(exact.normalizedRequest, null);
  assert.match(exact.inputResolution.message, /多个指令名称/);
  // 模型 input 恰是 Set（用户确实只问 Set）：按规范名处理并提示，且它与另一个精确名称同在时仍澄清。
  const only = resolveInput(directiveIntent('Set'), { message: 'Set 是什么' }, wordSnapshot);
  assert.equal(only.normalizedRequest.input, 'set');
  assert.deepEqual(only.inputResolution.canonicalized, { from: 'Set', to: 'set' });
  assert.match(only.inputResolution.notice, /已按指令名 set 理解/);
  const both = resolveInput(directiveIntent('Set'), { message: 'Set 和 proxy_pass 的区别' }, wordSnapshot);
  assert.equal(both.normalizedRequest, null);
  assert.match(both.inputResolution.message, /多个指令名称/);
  // 大小写不同且不含下划线的名称：既不是 input 也不是蛇形名，与 input 同在时不计入。
  const word = resolveInput(directiveIntent('Client_Max_Body_Size'), { message: 'Client_Max_Body_Size 之后 Return 什么' }, wordSnapshot);
  assert.equal(word.normalizedRequest.input, 'client_max_body_size');
});

test('普通词误判：out_of_scope 降级判断同样忽略普通词；精确大小写或蛇形名仍降级', () => {
  const scope = message => resolveInput({ action: 'out_of_scope', input: '', question: '', ignored: false }, { message }, wordSnapshot).inputResolution.action;
  // 无任何指令名的跑题消息里出现大写开头的普通词：正常 out_of_scope。
  assert.equal(scope('Return the weather'), 'out_of_scope');
  assert.equal(scope('Set the alarm and Root for me'), 'out_of_scope');
  // 精确大小写的指令名（return）仍降级，原有语义不变。
  assert.equal(scope('return the weather'), 'clarify');
  // 蛇形名即使大小写不同也降级。
  assert.equal(scope('今天天气怎么样 PROXY_PASS'), 'clarify');
  assert.equal(scope('Client_Max_Body_Size 之后讲个笑话'), 'clarify');
});

test('普通词误判：整条 session 路径，Set proxy_pass 按 proxy_pass 查询且不触发澄清', async t => {
  const { run } = await setup(t, { mockIntentResult: { action: 'directive', input: 'proxy_pass', question: 'Set proxy_pass 的作用', ignored: false } });
  const job = await run('Set proxy_pass 的作用');
  assert.equal(job.inputResolution.action, 'directive', job.error);
  assert.equal(job.normalizedRequest.input, 'proxy_pass');
  assert.equal(job.inputResolution.notice, undefined);
  assert.ok(job.matches.length > 0);
});

test('普通词误判：整条 session 路径，Return 开头的跑题消息正常 out_of_scope，含精确指令名仍澄清', async t => {
  const { run, spike } = await setup(t);
  const off = await run('Return 今天的天气');
  assert.equal(off.inputResolution.action, 'out_of_scope', off.error);
  assert.equal(off.inputResolution.message, SCOPE_REPLY);
  assert.equal(off.state, 'completed');
  assert.equal(selectionCount(spike.mock.requests), 0);
  const exact = await run('return 今天的天气');
  assert.equal(exact.inputResolution.action, 'clarify', exact.error);
  assert.equal(exact.state, 'awaiting_input');
});

// ---- 配置里的指令名大小写提示 ----

const LISTEN_NOTICE = '配置中的 Listen 未匹配。Nginx 指令名区分大小写；索引中有 listen，未自动按其查询。';

test('配置大小写提示：Listen 80; 给出提示，但不改配置原文、不改匹配结果、不改缓存语义', async t => {
  const { spike, run } = await setup(t);
  const message = 'http {\n  server {\n    Listen 80;\n    server_name example.invalid;\n  }\n}';
  const job = await run(message);
  assert.equal(job.inputResolution.action, 'config', job.error);
  assert.equal(job.inputResolution.notice, LISTEN_NOTICE);
  // 只提示不替换：原文逐字保留，没有 canonicalized 字段，Listen 仍按精确大小写判为未收录。
  assert.equal(job.normalizedRequest.input, message);
  assert.equal(job.inputResolution.canonicalized, undefined);
  const index = job.parsed.directives.findIndex(item => item.name === 'Listen');
  assert.ok(index >= 0);
  assert.equal(job.matches[index].status, 'unknown');
  assert.equal(job.matches[index].reason, 'name_not_in_index');
  // 提示进入会话元数据：恢复后仍能显示。
  assert.equal((await spike.restore(job.sessionId)).inputResolution.notice, LISTEN_NOTICE);
  // 含未匹配指令的结果停在 awaiting_input，本来就不写完成缓存；再次提交同一消息不会命中缓存，提示由重新解析得到，文字一致。
  assert.equal(job.state, 'awaiting_input');
  const again = await run(message);
  assert.equal(again.cacheHit, false);
  assert.equal(again.inputResolution.notice, LISTEN_NOTICE);
});

test('配置大小写提示：正常配置与有语法错误的配置不产生该提示', async t => {
  const { run } = await setup(t);
  for (const message of [fixtures.events.input, fixtures.fragment.input, fixtures.stream.input, 'http { server { listen 80; } }']) {
    const job = await run(message);
    assert.equal(job.inputResolution.notice, undefined, message);
  }
  // 语法错误（花括号未闭合）即使含 Listen 也不提示，避免对被截断/误切的名称误报。
  const broken = await run('http { server { Listen 80; }');
  assert.ok(broken.parsed.errors.length > 0);
  assert.equal(broken.inputResolution.notice, undefined);
  // 名称查询（directive）不走该提示。
  const named = await run('worker_connections 的默认值是什么');
  assert.equal(named.inputResolution.notice, undefined);
});

test('配置大小写提示：与 ignored 提示换行合并，两者都保留', async t => {
  const { run } = await setup(t);
  const message = '请说明这段配置的默认值。今天天气怎么样？\n```nginx\nhttp { server { Listen 80; } }\n```';
  const job = await run(message);
  assert.equal(job.inputResolution.action, 'config', job.error);
  assert.equal(job.inputResolution.ignored, true);
  assert.equal(job.inputResolution.notice, `消息中与配置无关的部分未处理。\n${LISTEN_NOTICE}`);
  assert.equal(job.normalizedRequest.input, 'http { server { Listen 80; } }');
});

test('配置大小写提示：沿用配置的追问同样带提示', async t => {
  const { run } = await setup(t);
  const first = await run('http { server { Listen 80; } }');
  assert.equal(first.inputResolution.notice, LISTEN_NOTICE);
  const follow = await run('刚才这段有哪些限制', first.sessionId);
  assert.equal(follow.inputResolution.action, 'followup', follow.error);
  assert.equal(follow.inputResolution.notice, LISTEN_NOTICE);
  assert.equal(follow.normalizedRequest.input, 'http { server { Listen 80; } }');
});

test('配置大小写提示：单元规则——仅未匹配且未精确收录的名称、多规范名全列、最多 5 个、名称限长', () => {
  const entries = names => names.map(name => ({ name }));
  const make = (names, statuses = {}) => ({
    parsed: { errors: [], directives: names.map(name => ({ name })) },
    matches: names.map(name => ({ status: statuses[name] ?? 'unknown' })),
  });
  // 同一小写形式有多个规范名：全部列出（字典序）。
  assert.equal(caseMismatchNotice(make(['LISTEN']), entries(['listen', 'Listen'])),
    '配置中的 LISTEN 未匹配。Nginx 指令名区分大小写；索引中有 Listen、listen，未自动按其查询。');
  // 已匹配、block_entry、名称已在索引里（上下文/歧义问题）、索引里没有大小写变体：都不提示。
  assert.equal(caseMismatchNotice(make(['Listen'], { Listen: 'matched' }), entries(['listen'])), null);
  assert.equal(caseMismatchNotice(make(['Server'], { Server: 'block_entry' }), entries(['server'])), null);
  assert.equal(caseMismatchNotice(make(['listen'], { listen: 'ambiguous' }), entries(['listen'])), null);
  assert.equal(caseMismatchNotice(make(['no_such']), entries(['listen'])), null);
  // 语法错误：不提示。
  const broken = make(['Listen']);
  broken.parsed.errors = [{ code: 'x' }];
  assert.equal(caseMismatchNotice(broken, entries(['listen'])), null);
  // 同名重复出现只列一次；多个不同名称合并成一条。
  assert.equal(caseMismatchNotice(make(['Listen', 'Listen', 'Server']), entries(['listen', 'server'])),
    '配置中的 Listen、Server 未匹配。Nginx 指令名区分大小写；索引中有 listen、server，未自动按其查询。');
  // 超过 5 个：只列前 5 个并标出总数。
  const many = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1'];
  const notice = caseMismatchNotice(make(many), entries(many.map(name => name.toLowerCase())));
  assert.ok(notice.startsWith('配置中的 A1、B1、C1、D1、E1 等共 7 个 未匹配。'), notice);
  assert.ok(notice.includes('索引中有 a1、b1、c1、d1、e1 等共 7 个，'), notice);
  assert.ok(!notice.includes('F1') && !notice.includes('f1'));
  // 超长名称：展示限制在 100 字符内并以省略号结尾。
  const long = `Aa${'b'.repeat(200)}`;
  const clipped = caseMismatchNotice(make([long]), entries([long.toLowerCase()]));
  assert.ok(clipped.includes(`${long.slice(0, 100)}…`));
  assert.ok(!clipped.includes(long.slice(0, 101)));
  assert.ok(clipped.includes(`${long.toLowerCase().slice(0, 100)}…`));
  // 合并提示：已有 notice 换行拼接；没有提示文本时原样返回。
  assert.equal(appendResolutionNotice({ action: 'config', notice: '甲' }, '乙').notice, '甲\n乙');
  assert.equal(appendResolutionNotice({ action: 'config' }, '乙').notice, '乙');
  const unchanged = { action: 'config' };
  assert.equal(appendResolutionNotice(unchanged, null), unchanged);
});

test('配置大小写提示：map 等数据块内的条目不误报；同块外的 Listen 仍提示；整块在 http 里也不误报', async t => {
  const { run } = await setup(t);
  // 片段缺外层：块内条目被解析为普通指令（状态 unknown），仍不得提示。
  const bare = await run('map $a $b { Default 1; Listen 2; }');
  assert.equal(bare.inputResolution.action, 'config', bare.error);
  assert.ok(bare.parsed.directives.some(item => item.name === 'Listen' && item.kind === 'simple'), '应复现“条目被当作普通指令”的形状');
  assert.equal(bare.inputResolution.notice, undefined);
  // 同一消息里块外的 Listen 80; 仍提示，且只提示块外的名称。
  const mixed = await run('map $a $b { Default 1; Listen 2; }\nListen 80;');
  assert.equal(mixed.inputResolution.notice, LISTEN_NOTICE);
  // 整块在 http 里：条目为 block_entry，同样无提示。
  const wrapped = await run('http { map $a $b { Default 1; Listen 2; } }');
  assert.equal(wrapped.inputResolution.notice, undefined);
  // 其他数据块与嵌套：geo、types、split_clients、charset_map 内的条目同样跳过。
  for (const message of ['geo $g { Default x; }', 'types { Text/html html; }', 'split_clients $a $b { 50% x; * y; }', 'charset_map a b { Listen 1; }']) {
    const job = await run(message);
    assert.equal(job.inputResolution.notice, undefined, message);
  }
});

test('配置大小写提示：单元——数据块判定同时看 contexts 与 parent_index', () => {
  const entries = [{ name: 'listen' }];
  const make = directives => ({ parsed: { errors: [], directives }, matches: directives.map(() => ({ status: 'unknown' })) });
  // 仅 contexts 含数据块名。
  assert.equal(caseMismatchNotice(make([{ name: 'Listen', contexts: ['map'], parent_index: null }]), entries), null);
  // 仅 parent_index 链上有数据块（contexts 缺失时的兜底），含多层嵌套。
  assert.equal(caseMismatchNotice(make([{ name: 'geo', parent_index: null }, { name: 'x', parent_index: 0 }, { name: 'Listen', parent_index: 1 }]), entries), null);
  // 普通块内的 Listen 仍提示。
  assert.ok(caseMismatchNotice(make([{ name: 'server', contexts: [], parent_index: null }, { name: 'Listen', contexts: ['server'], parent_index: 0 }]), entries));
});
