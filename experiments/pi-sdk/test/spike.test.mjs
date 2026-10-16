import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp, rm, readdir, cp, symlink, rename, stat, utimes } from 'node:fs/promises';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';
import { Spike, ROOT, cacheKey, emptyLoader, loadConfig } from '../src/session.mjs';
import { loadSnapshot, analyze, TOOL_NAMES, knowledgeTools } from '../src/knowledge-tools.mjs';
import { reportHtml, parseModelReportText, validateModelReport } from '../src/report.mjs';
import { parseConfig } from '../../../src/core/parser.mjs';
import { matchDirective } from '../../../src/core/matcher.mjs';
import { summarizeConfig } from '../../../src/query/config-results.mjs';
import { fixtures } from './fixtures/configs.mjs';

const exec = promisify(execFile);
await mkdir(join(ROOT, '.state'), { recursive: true });
const temporary = await mkdtemp(join(ROOT, '.state/tests-'));
const records = [];
const run = async (spike, request, sessionId) => { const job = spike.start(request, sessionId); await job.done; records.push({ case: request.question || request.input.slice(0, 45), ...spike.view(job), items: undefined, modelSelection: undefined, parsed: undefined, matches: undefined }); return job; };
const countCache = spike => readdir(join(spike.config.stateDir, 'cache')).then(files => files.filter(file => file.endsWith('.json')).length);
const create = (name, overrides = {}) => Spike.create({ stateDir: join(temporary, name), mockDelayMs: 1, ...overrides });
const waitFor = async check => { for (let i = 0; i < 1000; i++) { if (check()) return; await delay(5); } throw new Error('等待测试状态超时'); };

test('五项验收：真实 SDK mock 链路、隔离、状态、报告与缓存', async t => {
  try {
    await t.test('1 原模块复用及脱敏配置正负例', async () => {
      const spike = await create('modules');
      try {
        const snapshot = await loadSnapshot(spike.config);
        for (const [name, request] of Object.entries(fixtures)) {
          const job = await run(spike, request);
          assert.notEqual(job.state, 'failed', job.error);
          const parsed = parseConfig(request.input, { mode: request.mode });
          const matches = parsed.directives.map(item => matchDirective(item, snapshot.index, { context: request.context ?? null }));
          assert.deepEqual(job.parsed, parsed); assert.deepEqual(job.matches, matches); assert.deepEqual(job.summary, summarizeConfig(parsed, matches));
          assert.equal(job.metrics.modelRoundTrips, 0);
          assert.equal(job.modelSelection, null);
          if (['events', 'stream', 'vts'].includes(name)) assert.equal(job.summary.matched, { events: 3, stream: 8, vts: 7 }[name]);
          if (name === 'fragment') { assert.equal(job.state, 'awaiting_input'); assert.ok(job.matches.every(match => match.status === 'ambiguous')); }
          if (name === 'map') assert.deepEqual(job.summary, { directives: 2, matched: 2, attention: 0, block_entries: 2, external_references: 1 });
          if (name === 'invalid') { assert.equal(job.state, 'awaiting_input'); assert.ok(job.matches.every(match => match.status === 'invalid_input')); }
        }
        const context = await run(spike, { input: 'worker_connections 100;', mode: 'fragment' });
        assert.equal(context.state, 'awaiting_input'); assert.equal(context.matches[0].status, 'context_required');
        const clarified = await run(spike, { input: 'worker_connections 100;', mode: 'fragment', context: 'events', question: '补充 events' }, context.sessionId);
        assert.equal(clarified.state, 'completed'); assert.equal(clarified.summary.matched, 1);
        const conflict = await run(spike, { ...fixtures.events, context: 'stream' });
        assert.ok(conflict.matches.some(match => match.status === 'context_conflict'));
        const bundle = knowledgeTools(snapshot, () => ({ ...fixtures.events, context: '', module: '' }), []);
        await bundle.prepare();
        await assert.rejects(bundle.tools[0].execute('test', { input: 'other', mode: 'main' }), /不得改变/);
        await bundle.tools[0].execute('test', {});
        await assert.rejects(bundle.tools[1].execute('test', { entryId: '../../outside' }), /不属于/);
        const single = await bundle.tools[1].execute('test', { entryId: 'nginx--ngx_event_core_module--worker_connections', fields: ['defaults'] });
        assert.equal(single.details.entries[0].fields.defaults.status, 'verified');
      } finally { await spike.close(); }
    });
    await t.test('2 工具精确白名单、禁用工具和无发现隔离', async () => {
      const savedState = process.env.PI_SPIKE_STATE_DIR;
      const savedTimeout = process.env.PI_SPIKE_TIMEOUT_MS;
      try {
        process.env.PI_SPIKE_STATE_DIR = join(temporary, 'live-config-only');
        process.env.PI_SPIKE_TIMEOUT_MS = '180000';
        const overridden = await loadConfig();
        assert.equal(overridden.stateDir, join(temporary, 'live-config-only')); assert.equal(overridden.timeoutMs, 180000);
        process.env.PI_SPIKE_STATE_DIR = ROOT;
        await assert.rejects(loadConfig(), /状态必须/);
        process.env.PI_SPIKE_STATE_DIR = join(temporary, 'live-config-only');
        process.env.PI_SPIKE_TIMEOUT_MS = 'NaN';
        await assert.rejects(loadConfig(), /正整数/);
      } finally {
        if (savedState === undefined) delete process.env.PI_SPIKE_STATE_DIR; else process.env.PI_SPIKE_STATE_DIR = savedState;
        if (savedTimeout === undefined) delete process.env.PI_SPIKE_TIMEOUT_MS; else process.env.PI_SPIKE_TIMEOUT_MS = savedTimeout;
      }
      const spike = await create('isolation');
      try {
        const job = await run(spike, { ...fixtures.events, mockScenario: 'forbidden' });
        assert.equal(job.state, 'failed'); assert.equal(await countCache(spike), 0);
        assert.ok(job.trace.some(event => event.event === 'tool_execution_end' && event.isError));
        for (const request of spike.mock.requests) assert.deepEqual(request.tools.sort(), [...TOOL_NAMES].sort());
        const loader = emptyLoader(); assert.equal(loader.getExtensions().extensions.length, 0); assert.equal(loader.getAgentsFiles().agentsFiles.length, 0); assert.equal(loader.getSkills().skills.length, 0);
        assert.deepEqual(await readdir(join(spike.config.stateDir, 'agent')), []);
        for (const forbidden of ['bash', 'read', 'write', 'edit', 'unknown_tool']) assert.ok(job.trace.some(event => event.tool === forbidden && event.isError));
        const target = join(temporary, 'symlink-target'); await mkdir(target);
        await symlink(target, join(spike.config.stateDir, 'agent', 'escape'));
        const rejected = await run(spike, fixtures.events); assert.equal(rejected.state, 'failed'); assert.match(rejected.error, /符号链接/);
        assert.deepEqual(await readdir(target), []);
        await rm(join(spike.config.stateDir, 'agent', 'escape'));
        const escapeState = join(temporary, 'escaped-state'); await symlink(target, escapeState);
        await assert.rejects(create('ignored', { stateDir: escapeState }), /符号链接/);
        await assert.rejects(spike.restore('../../outside'), /ID/);
      } finally { await spike.close(); }
    });
    await t.test('3 追问、abort、进程重建恢复与未完成轮次丢弃', async () => {
      const spike = await create('sessions', { mockDelayMs: 80 });
      try {
        const first = await run(spike, fixtures.events);
        const follow = await run(spike, { ...fixtures.events, question: '默认值依据？' }, first.sessionId);
        assert.equal(follow.state, 'completed'); assert.ok(spike.mock.requests.some(request => request.userTurns === 2));
        const before = await countCache(spike);
        const pending = spike.start({ ...fixtures.stream, question: '取消此轮' }, first.sessionId);
        await waitFor(() => pending.metrics.modelRoundTrips === 1);
        await assert.rejects(spike.restore(first.sessionId), /运行中/);
        const cancelled = await spike.cancel(pending.requestId); assert.equal(cancelled.state, 'cancelled'); assert.equal(await countCache(spike), before);
        assert.equal(cancelled.phase, 'basic'); assert.ok(cancelled.items.length > 0); assert.equal(cancelled.modelSelection, null);
        assert.ok(pending.trace.some(event => event.event === 'agent_end'));
        const restored = await spike.restore(first.sessionId); assert.ok(restored.messages > 0);
        const metaFile = spike.metadataPath(first.sessionId); const meta = JSON.parse(await readFile(metaFile, 'utf8'));
        const complete = await readFile(meta.file, 'utf8');
        await writeFile(meta.file, `${complete}{"type":"message","id":"partial","parentId":null,"timestamp":"2026-10-15T00:00:00Z","message":{"role":"user","content":"中断数据","timestamp":0}}\n`);
        await writeFile(metaFile, JSON.stringify({ ...meta, state: 'running' }));
        const recovered = await spike.restore(first.sessionId); assert.equal(recovered.interrupted, true); assert.equal(recovered.messages, restored.messages);
        await spike.close();
        const child = await exec(process.execPath, ['test/resume-child.mjs', spike.config.stateDir, first.sessionId], { cwd: ROOT, env: { ...process.env, PI_SPIKE_MODE: 'mock' }, maxBuffer: 2 * 1024 * 1024 });
        const data = JSON.parse(child.stdout); assert.equal(data.state, 'completed'); assert.ok(data.requests.every(request => request.userTurns === 3));
      } finally { await spike.close(); }
    });
    await t.test('4 虚构源码引用、非法 JSON、事实文本与 HTML 安全', async () => {
      const spike = await create('reports');
      try {
        for (const scenario of ['bad-citation', 'invalid-json']) { const job = await run(spike, { ...fixtures.events, mockScenario: scenario }); assert.equal(job.state, 'failed'); }
        assert.equal(await countCache(spike), 0);
        const fenced = await run(spike, { ...fixtures.events, mockScenario: 'fenced-json' });
        assert.equal(fenced.state, 'completed', fenced.error);
        assert.equal(fenced.summary.matched, 3);
        assert.equal(fenced.trace.filter(event => event.event === 'tool_execution_end' && !event.isError).length, 0);
        assert.equal(fenced.metrics.modelRoundTrips, 1);
        const report = { facts: [] };
        const bare = '{"facts":[]}';
        const wrapped = '```json\n' + bare + '\n```';
        for (const text of [bare, wrapped, '```json\r\n' + bare + '\r\n```']) assert.deepEqual(parseModelReportText(text), report);
        for (const text of ['解释\n' + wrapped, wrapped + '\n解释', wrapped + '\n' + wrapped, '```json\n坏JSON\n```', '{"citations":', '```json\n' + bare, '```\n' + bare + '\n```', '```json ' + bare + '```']) assert.throws(() => parseModelReportText(text));
        const snapshot = await loadSnapshot(spike.config);
        const analysis = analyze(snapshot, fixtures.events);
        const entry = analysis.matches[0].candidates[0]; const detail = await snapshot.client.getDetail(entry, snapshot.index);
        const bundle = { analysis: { ...analysis, matches: [analysis.matches[0]] }, details: new Map([[entry.id, detail]]) };
        const invalidReference = '```json\n' + JSON.stringify({ citations: [{ entryId: entry.id, sourceId: 'invented', quote: 'fake' }], facts: [] }) + '\n```';
        assert.throws(() => validateModelReport(parseModelReportText(invalidReference), bundle), /契约/);
        assert.throws(() => validateModelReport({ facts: [{ entryId: entry.id, field: 'summary', text: '已验证生产环境安全' }] }, bundle), /事实/);
        const html = reportHtml({ input: '<img src=x onerror=alert(1)><script>alert(2)</script>' });
        assert.ok(!html.includes('<img')); assert.ok(!html.includes('<script>')); assert.ok(html.includes('&lt;script&gt;'));
        const web = await readFile(join(ROOT, 'web/app.mjs'), 'utf8'); assert.ok(!web.includes('innerHTML')); assert.ok(web.includes("url.searchParams.set('release', job.knowledgeVersion.release)"));
        await assert.rejects(snapshot.fetcher('http://outside.invalid/index.json'), /URL/);
        await assert.rejects(snapshot.fetcher('http://knowledge.invalid/../package.json'), /快照/);
      } finally { await spike.close(); }
    });
    await t.test('5 精确键、命中零 provider、新版本与同版本内容失效', async () => {
      const spike = await create('cache');
      try {
        const first = await run(spike, fixtures.events); assert.equal(first.state, 'completed');
        const count = spike.mock.requests.length;
        const hit = await run(spike, fixtures.events); assert.equal(hit.cacheHit, true); assert.equal(spike.mock.requests.length, count);
        const restored = await spike.restore(hit.sessionId); assert.ok(restored.messages > 0);
        const changed = await run(spike, { ...fixtures.events, question: '不同问题' }); assert.equal(changed.cacheHit, false);
        const follow = await run(spike, fixtures.events, first.sessionId); assert.equal(follow.cacheHit, false);
        const keyInput = { request: spike.normalize(fixtures.events), context: [], knowledgeHash: 'v1', model: { id: 'a' }, codeHash: 'code', siteBase: 'http://localhost/' };
        const key = cacheKey(keyInput);
        for (const patch of [{ knowledgeHash: 'v2' }, { model: { id: 'b' } }, { codeHash: 'new' }, { context: [{ role: 'user', content: 'x' }] }, { request: { ...keyInput.request, context: 'events' } }, { request: { ...keyInput.request, mode: 'fragment' } }, { request: { ...keyInput.request, input: `${fixtures.events.input} ` } }, { request: { ...keyInput.request, module: 'm' } }]) assert.notEqual(cacheKey({ ...keyInput, ...patch }), key);
        const snapshot = await loadSnapshot(spike.config);
        const distCopy = join(temporary, 'dist-copy'); const kb = join(distCopy, 'knowledge'); await mkdir(kb, { recursive: true });
        await cp(join(spike.config.distDir, 'site-config.json'), join(distCopy, 'site-config.json'));
        await cp(join(spike.config.distDir, 'knowledge/index.json'), join(kb, 'index.json'));
        await cp(join(spike.config.distDir, 'knowledge/releases', snapshot.index.release_id), join(kb, 'releases', snapshot.index.release_id), { recursive: true });
        const isolated = await create('changed-knowledge', { distDir: distCopy });
        try {
          const original = await run(isolated, fixtures.events);
          const detailsDir = join(kb, 'releases', snapshot.index.release_id, 'directives');
          await writeFile(join(detailsDir, 'extra.json'), 'not JSON');
          const extra = await run(isolated, fixtures.events); assert.equal(extra.cacheHit, true);
          const detailPath = join(detailsDir, 'nginx--ngx_event_core_module--worker_connections.json');
          const originalTimes = await stat(detailPath);
          const detail = JSON.parse(await readFile(detailPath, 'utf8')); detail.summary += ' 测试副本新增说明。'; await writeFile(detailPath, JSON.stringify(detail));
          await utimes(detailPath, originalTimes.atime, originalTimes.mtime);
          const mutated = await run(isolated, fixtures.events); assert.equal(mutated.cacheHit, false); assert.notEqual(mutated.knowledgeVersion.digest, original.knowledgeVersion.digest); assert.ok(mutated.items[2].entries[0].summary.includes('测试副本'));
          const restore = await isolated.restore(original.sessionId); assert.equal(restore.knowledgeChanged, true);
          const refreshed = await run(isolated, { ...fixtures.events, question: '版本变化重读' }, original.sessionId); assert.equal(refreshed.knowledgeChanged, true); assert.equal(isolated.mock.requests.at(-1).userTurns, 2);
          await rm(join(detailsDir, 'extra.json'));
          const nextRelease = `${snapshot.index.release_id}-spike`;
          const oldReleaseDir = join(kb, 'releases', snapshot.index.release_id); const newReleaseDir = join(kb, 'releases', nextRelease);
          await rename(oldReleaseDir, newReleaseDir);
          const update = async path => { const content = await readFile(path, 'utf8'); await writeFile(path, content.replaceAll(snapshot.index.release_id, nextRelease)); };
          await update(join(kb, 'index.json')); await update(join(newReleaseDir, 'index.json')); await update(join(newReleaseDir, 'references.json'));
          for (const name of await readdir(join(newReleaseDir, 'directives'))) await update(join(newReleaseDir, 'directives', name));
          const release = await run(isolated, fixtures.events); assert.equal(release.cacheHit, false); assert.equal(release.knowledgeVersion.release, nextRelease);
          const validIndex = await readFile(join(kb, 'index.json'), 'utf8');
          const invalidIndex = JSON.parse(validIndex); invalidIndex.references_path = '../forbidden.json';
          await writeFile(join(kb, 'index.json'), JSON.stringify(invalidIndex));
          await assert.rejects(loadSnapshot(isolated.config), /参考库路径/);
          await writeFile(join(kb, 'index.json'), validIndex);
        } finally { await isolated.close(); }
      } finally { await spike.close(); }
    });
  } finally {
    await mkdir(join(ROOT, 'artifacts'), { recursive: true });
    await writeFile(join(ROOT, 'artifacts/trace.jsonl'), records.map(record => JSON.stringify(record)).join('\n') + '\n');
    await rm(temporary, { recursive: true, force: true });
  }
});
