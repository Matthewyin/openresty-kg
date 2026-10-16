import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { Spike, ROOT } from '../src/session.mjs';
import { serve } from '../server.mjs';
import { configMode, resolveInput } from '../src/input-resolution.mjs';
import { fixtures } from './fixtures/configs.mjs';

async function setup(t, overrides = {}) {
  await mkdir(join(ROOT, '.state'), { recursive: true });
  const dir = await mkdtemp(join(ROOT, '.state/unified-'));
  const spike = await Spike.create({ stateDir: dir, mockDelayMs: 1, ...overrides });
  t.after(async () => { await spike.close(); await rm(dir, { recursive: true, force: true }); });
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
  spike.config.maxHistoryBytes = 30;
  const limited = await run('刚才这段有哪些限制', first.sessionId);
  assert.equal(limited.errorCode, 'history_limit'); assert.equal(limited.metrics.modelRoundTrips, 0);
  assert.equal(await readFile(meta.file, 'utf8'), before);
});

test('服务端拒绝跨发布追问；意图schema拒绝伪造字段及名称子串', () => {
  const snapshot = { index: { release_id: 'new-release', directives: [{ name: 'listen' }] } };
  const raw = { message: '刚才这段有哪些限制', release: 'new-release' };
  const result = resolveInput({ action: 'followup', input: '', question: raw.message }, raw, snapshot, { input: 'events {}', mode: 'main', release: 'old-release' });
  assert.equal(result.inputResolution.action, 'clarify'); assert.match(result.inputResolution.message, /发布/);
  const name = resolveInput({ action: 'directive', input: 'listen', question: '' }, { message: 'not_listen' }, snapshot);
  assert.equal(name.normalizedRequest, null);
});

test('B01：多围栏默认mock与受控意图均澄清，不提交对象或完成缓存', async t => {
  const first = 'events { worker_connections 1024; }';
  const second = 'http { server { listen 80; } }';
  const message = '```nginx\n' + first + '\n```\n\n```nginx\n' + second + '\n```';
  for (const overrides of [{}, { mockIntentResult: { action: 'config', input: first, question: '' } },
    { mockIntentResult: { action: 'directive', input: 'worker_connections', question: '' } }]) {
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
    const resolved = resolveInput({ action: 'config', input: config, question }, { message }, snapshot);
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
      assert.equal(resolveInput({ action, input, question: '' }, { message }, snapshot).inputResolution.action, 'clarify');
    }
    assert.equal(resolveInput({ action: 'config', input: whole, question: '' }, { message }, snapshot).normalizedRequest.input, whole);
  }
  const single = 'worker_connections 1024;';
  for (const action of ['config', 'directive']) assert.equal(resolveInput({ action, input: 'worker_connections', question: '' }, { message: single }, snapshot).normalizedRequest, null);
  const { run, spike } = await setup(t, { mockIntentResult: { action: 'config', input: first, question: '' } });
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
  const { spike, run } = await setup(t, { mockIntentResult: { action: 'config', input: known, question: '' } });
  for (const prefix of ['unknown_first on;', 'unknown_first { unknown_child on; }']) {
    const message = prefix + '\n' + known;
    for (let i = 0; i < 2; i++) {
      const job = await run(message);
      assert.equal(job.state, 'awaiting_input'); assert.equal(job.inputResolution.action, 'clarify');
      assert.equal(job.normalizedRequest, null); assert.equal(job.cacheHit, false);
      const saved = await spike.restore(job.sessionId);
      assert.equal(saved.currentConfig, null); assert.equal(saved.currentSubject, null);
    }
    spike.config.mockIntentResult = { action: 'config', input: message, question: '' };
    const complete = await run(message);
    assert.equal(complete.normalizedRequest.input, message); assert.equal(complete.matches[0].status, 'unknown');
    assert.equal(complete.state, 'awaiting_input');
    spike.config.mockIntentResult = { action: 'config', input: known, question: '' };
  }
  assert.deepEqual(await readdir(join(spike.config.stateDir, 'cache')), []);
});

test('HTTP能力标识、完整/brief响应和恢复均提供统一输入契约', async t => {
  await mkdir(join(ROOT, '.state'), { recursive: true });
  const dir = await mkdtemp(join(ROOT, '.state/unified-http-'));
  const app = await serve({ port: 0, stateDir: dir, mockDelayMs: 100 }, { website: true });
  t.after(async () => { await app.close(); await rm(dir, { recursive: true, force: true }); });
  const status = await (await fetch(new URL('api/status', app.url))).json(); assert.equal(status.unifiedInput, true);
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
});
