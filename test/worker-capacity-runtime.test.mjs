import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { validateDetail, validateIndex, validateRuntime, deriveVerification, createKnowledgeClient, RUNTIME_SCOPE_NOTE } from '../src/query/knowledge.mjs';
import { parseConfig, matchDirective } from '../src/core/core.mjs';

const root = resolve(import.meta.dirname, '..');
const json = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const config = json('project.config.json');
const index = json('dist/knowledge/releases/1.27.1.1-06a6394fb516a4bb/index.json');
const baseline = json('dist/knowledge/releases/1.27.1.1-ca870e6c128ac027/index.json');
const knowledge = json(config.knowledge_file);
const targets = [
  ['ngx_core_module', 'worker_processes', 7, '7738c552bf7eafd69a079458cda51f31c0db7ce06c342f4e5e64b1ce8e036094'],
  ['ngx_core_module', 'worker_cpu_affinity', 9, 'b282544fde337fbf0da88371e32a8e367e5af00ff8ca4726ed1b5f30e22dbd53'],
  ['ngx_core_module', 'worker_rlimit_nofile', 5, '03d80411cf264e78c359b3960286d7ed9b5e859951048af80fb100cd355ca5a2'],
  ['ngx_event_core_module', 'worker_connections', 16, '81c0436fa54e882f1ed8b83692f8bc41c1340fc292185f036ccc017624389f8b'],
  ['ngx_event_core_module', 'multi_accept', 10, 'eb191e01b8ec8e86f1ea43ad80364b29b8d8fd0cc31749d13a7df8b8d09dc258'],
].map(([module, name, count, hash]) => ({ module, name, count, hash, id: `nginx--${module}--${name}`, context: module === 'ngx_core_module' ? 'main' : 'events' }));
const ids = targets.map(t => t.id);
const detail = entry => json(`dist/knowledge/${entry.detail_path}`);
const curatedFor = id => knowledge.find(v => `${v.component}--${v.module}--${v.name}` === id);
const owners = new Map(json('analysis/components.json').components.map(v => [v.component, v]));
for (const v of config.documentation_sources) owners.set(v.component, { ...v, local_path: v.path });
owners.set('openresty', { local_path: config.main_repo, revision: json(config.nginx_patch_audit).openresty_revision,
  version: config.openresty_version, repository: 'https://github.com/openresty/openresty' });
const files = new Map();
function fixedSource(e) {
  const component = e.component ?? 'nginx';
  const owner = owners.get(component);
  assert.ok(owner, component);
  const key = `${component}/${e.file}`;
  if (!files.has(key)) files.set(key, execFileSync('git', ['-C', resolve(root, owner.local_path), 'show', `${owner.revision}:${e.file}`],
    { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }).replaceAll('\r\n', '\n').split('\n'));
  const lines = files.get(key);
  assert.ok(e.start_line > 0 && e.end_line >= e.start_line && e.end_line <= lines.length);
  return { id: e.id, component, version: owner.version, revision: owner.revision, file: e.file,
    start_line: e.start_line, end_line: e.end_line, code: lines.slice(e.start_line - 1, e.end_line).join('\n'),
    url: `${owner.repository}/blob/${owner.revision}/${e.file}#L${e.start_line}-L${e.end_line}`,
    kind: e.file.endsWith('.patch') ? 'openresty_patch' : 'upstream' };
}
function checkPrefix(curated, target) {
  assert.equal(createHash('sha256').update(JSON.stringify(curated.evidence.slice(0, target.count))).digest('hex'), target.hash);
}
function checkPatch(actual, before, id) {
  const expected = id === 'nginx--ngx_event_core_module--worker_connections' ? 'verified_affected' : before.status;
  assert.deepEqual({ ...actual, note: before.note, source_ids: before.source_ids }, { ...before, status: expected });
  assert.deepEqual(actual.source_ids.slice(0, before.source_ids.length), before.source_ids);
  assert.equal(new Set(actual.source_ids).size, actual.source_ids.length);
}

function runtimeValue(name) {
  return detail(index.directives.find(e => e.id === targets.find(t => t.name === name).id));
}
function sourceAt(value, file, line, pattern) {
  const bound = value.sources.filter(s => value.runtime.source_ids.includes(s.id)
    && s.file === file && s.start_line <= line && s.end_line >= line);
  assert.ok(bound.some(s => pattern.test(s.code)), `${value.name} 缺少消费锚点 ${file}:${line}`);
}

test('worker数量用于创建尝试，reload失败保旧而不是保证存活数', () => {
  const v = runtimeValue('worker_processes');
  const p = 'src/os/unix/ngx_process_cycle.c';
  sourceAt(v, p, 130, /ngx_start_worker_processes\(cycle, ccf->worker_processes/);
  sourceAt(v, p, 342, /for \(i = 0; i < n; i\+\+\)[\s\S]*ngx_spawn_process/);
  sourceAt(v, 'src/os/unix/ngx_process.c', 194, /fork\(\)[\s\S]*case -1:[\s\S]*return NGX_INVALID_PID/);
  sourceAt(v, p, 226, /cycle == NULL[\s\S]*cycle = \(ngx_cycle_t \*\) ngx_cycle;[\s\S]*continue/);
  sourceAt(v, p, 234, /NGX_PROCESS_JUST_RESPAWN[\s\S]*NGX_SHUTDOWN_SIGNAL/);
  sourceAt(v, 'src/core/nginx.c', 380, /NGX_PROCESS_SINGLE[\s\S]*ngx_single_process_cycle[\s\S]*ngx_master_process_cycle/);
});

test('CPU绑定区分auto空集合、显式末项及有条件系统调用失败', () => {
  const v = runtimeValue('worker_cpu_affinity');
  sourceAt(v, 'src/os/unix/ngx_process_cycle.c', 853, /worker >= 0[\s\S]*if \(cpu_affinity\)[\s\S]*ngx_setaffinity/);
  sourceAt(v, 'src/core/nginx.c', 1524, /i == CPU_SETSIZE && j == n[\s\S]*return NULL/);
  sourceAt(v, 'src/core/nginx.c', 1542, /cpu_affinity_n > n[\s\S]*cpu_affinity\[n\][\s\S]*cpu_affinity\[ccf->cpu_affinity_n - 1\]/);
  sourceAt(v, 'src/os/unix/ngx_setaffinity.c', 25, /cpuset_setaffinity\([\s\S]*== -1[\s\S]*NGX_LOG_ALERT/);
  sourceAt(v, 'src/os/unix/ngx_setaffinity.c', 47, /sched_setaffinity\([\s\S]*== -1[\s\S]*NGX_LOG_ALERT/);
});

test('文件上限显式设置软硬两项，失败分支无exit也不改连接池容量', () => {
  const v = runtimeValue('worker_rlimit_nofile');
  const file = 'src/os/unix/ngx_process_cycle.c';
  sourceAt(v, file, 777, /rlimit_nofile != NGX_CONF_UNSET[\s\S]*rlmt.rlim_cur[\s\S]*rlmt.rlim_max[\s\S]*setrlimit\(RLIMIT_NOFILE/);
  const s = v.sources.find(s => v.runtime.source_ids.includes(s.id) && s.file === file && s.start_line <= 781 && s.end_line >= 786);
  assert.ok(s);
  const branch = s.code.split('\n').slice(777 - s.start_line, 787 - s.start_line).join('\n');
  assert.match(branch, /NGX_LOG_ALERT/); assert.doesNotMatch(branch, /exit\(|connection_n\s*=/);
  sourceAt(v, file, 705, /ngx_worker_process_init\(cycle, worker\)/);
});

test('连接容量被监听客户端上游共同消费，耗尽返回和归还不混同关闭fd', () => {
  const v = runtimeValue('worker_connections');
  const c = 'src/core/ngx_connection.c';
  sourceAt(v, 'src/event/ngx_event.c', 754, /sizeof\(ngx_connection_t\) \* cycle->connection_n[\s\S]*NGX_ERROR/);
  sourceAt(v, 'src/event/ngx_event.c', 799, /free_connections = next[\s\S]*free_connection_n = cycle->connection_n/);
  sourceAt(v, c, 1191, /ngx_drain_connections[\s\S]*c = ngx_cycle->free_connections[\s\S]*if \(c == NULL\)[\s\S]*return NULL/);
  sourceAt(v, c, 1379, /free_connection_n > cycle->connection_n \/ 16[\s\S]*reusable_connections_n == 0[\s\S]*return/);
  sourceAt(v, c, 1409, /c->close = 1[\s\S]*c->read->handler\(c->read\)/);
  sourceAt(v, c, 1243, /c->data = ngx_cycle->free_connections[\s\S]*free_connection_n\+\+/);
  sourceAt(v, c, 1303, /ngx_free_connection\(c\)[\s\S]*c->shared[\s\S]*return[\s\S]*ngx_close_socket/);
  sourceAt(v, 'src/event/ngx_event_connect.c', 53, /ngx_get_connection\(s, pc->log\)[\s\S]*ngx_close_socket[\s\S]*return NGX_ERROR/);
  sourceAt(v, 'src/event/ngx_event_accept.c', 142, /ngx_get_connection\(s, ev->log\)[\s\S]*ngx_close_socket[\s\S]*return/);
});

test('multi_accept的kqueue计数、回退条件、停接收和CLOEXEC失败分支保留', () => {
  const v = runtimeValue('multi_accept');
  const a = 'src/event/ngx_event_accept.c';
  sourceAt(v, a, 47, /!\(ngx_event_flags & NGX_USE_KQUEUE_EVENT\)[\s\S]*ev->available = ecf->multi_accept/);
  sourceAt(v, a, 74, /NGX_EAGAIN[\s\S]*return/);
  sourceAt(v, a, 93, /use_accept4 && err == NGX_ENOSYS[\s\S]*use_accept4 = 0[\s\S]*continue/);
  sourceAt(v, a, 102, /NGX_ECONNABORTED[\s\S]*NGX_USE_KQUEUE_EVENT[\s\S]*ev->available--[\s\S]*if \(ev->available\)[\s\S]*continue/);
  sourceAt(v, a, 112, /NGX_EMFILE \|\| err == NGX_ENFILE[\s\S]*ngx_disable_accept_events[\s\S]*ngx_use_accept_mutex[\s\S]*ngx_add_timer/);
  sourceAt(v, a, 313, /ls->handler\(c\)[\s\S]*NGX_USE_KQUEUE_EVENT[\s\S]*ev->available--[\s\S]*while \(ev->available\)/);
  sourceAt(v, 'patches/nginx-1.27.1-socket_cloexec.patch', 91, /SOCK_NONBLOCK \| SOCK_CLOEXEC/);
  sourceAt(v, 'patches/nginx-1.27.1-socket_cloexec.patch', 102, /NGX_HAVE_FD_CLOEXEC[\s\S]*ngx_cloexec\(s\)[\s\S]*ngx_close_accepted_connection[\s\S]*return/);
});

test('关键失败与平台边界绑定在声明该行为的步骤，而非仅在总来源中', () => {
  const p = 'src/os/unix/ngx_process_cycle.c';
  const a = 'src/event/ngx_event_accept.c';
  const cases = [
    ['worker_processes', /NGX_INVALID_PID/, [/不保证/], [['src/os/unix/ngx_process.c', 194]]],
    ['worker_cpu_affinity', /显式 auto 从/, [/NULL/], [['src/core/nginx.c', 1524]]],
    ['worker_rlimit_nofile', /setrlimit\(/, [/ALERT/, /继续/], [[p, 781]]],
    ['worker_connections', /ngx_free_connection/, [/shared|共享/], [['src/core/ngx_connection.c', 1243], ['src/core/ngx_connection.c', 1308]]],
    ['worker_connections', /NGX_HAVE_REUSEPORT/, [/ls\[i\]\.reuseport|监听.{0,8}(启用|开启).*reuseport/], [['src/event/ngx_event.c', 809], ['patches/nginx-1.27.1-reuseport_close_unused_fds.patch', 23]]],
    ['multi_accept', /kqueue 后端/, [/posted/], [['src/event/ngx_event.c', 255]]],
    ['multi_accept', /ENOSYS/, [/available|循环条件/], [[a, 93], [a, 319]]],
    ['multi_accept', /ECONNABORTED/, [/available|非零/], [[a, 102]]],
    ['multi_accept', /NGX_HAVE_FD_CLOEXEC/, [/inherited_nonblocking/, /IOCP/], [[a, 185], ['patches/nginx-1.27.1-socket_cloexec.patch', 102]]],
  ];
  for (const [name, selector, wording, anchors] of cases) {
    const v = runtimeValue(name);
    const check = value => {
      const steps = value.runtime.steps.filter(s => selector.test(s.action));
      assert.equal(steps.length, 1, `${name} 对应行为步骤必须唯一`);
      const step = steps[0];
      for (const pattern of wording) assert.match(step.action, pattern);
      for (const [file, line] of anchors) assert.ok(value.sources.some(s => step.source_ids.includes(s.id)
        && s.file === file && s.start_line <= line && s.end_line >= line), `${name} 本步缺 ${file}:${line}`);
    };
    check(v);
    const badText = structuredClone(v);
    badText.runtime.steps.find(s => selector.test(s.action)).action = '无条件成功，没有失败和平台差异';
    assert.throws(() => check(badText), assert.AssertionError);
    for (const [file, line] of anchors) {
      const wrong = structuredClone(v);
      const step = wrong.runtime.steps.find(s => selector.test(s.action));
      const other = wrong.runtime.steps.find(s => s !== step);
      const moved = step.source_ids.filter(id => wrong.sources.some(s => s.id === id
        && s.file === file && s.start_line <= line && s.end_line >= line));
      step.source_ids = step.source_ids.filter(id => !moved.includes(id));
      if (!step.source_ids.length) step.source_ids.push(wrong.runtime.source_ids.find(id => !moved.includes(id)));
      other.source_ids = [...new Set([...other.source_ids, ...moved])];
      assert.deepEqual(wrong.runtime.source_ids, v.runtime.source_ids);
      assert.equal(validateRuntime(wrong), true);
      assert.throws(() => check(wrong), assert.AssertionError);
    }
  }
});

for (const target of targets) test(`worker容量实际发布、固定源码与旧事实保护：${target.name}`, () => {
  const entry = index.directives.find(e => e.id === target.id);
  const value = detail(entry);
  const before = detail(baseline.directives.find(e => e.id === target.id));
  const curated = curatedFor(target.id);
  checkPrefix(curated, target);
  const badPrefix = structuredClone(curated); badPrefix.evidence.reverse();
  assert.throws(() => checkPrefix(badPrefix, target), assert.AssertionError);
  assert.ok(curated.runtime);
  assert.equal(new Set(curated.evidence.map(e => e.id)).size, curated.evidence.length);
  const expected = new Map(before.sources.map(s => [s.id, s]));
  for (const e of curated.evidence) expected.set(e.id, fixedSource(e));
  const oldIds = new Set(before.sources.map(s => s.id));
  assert.equal(before.sources.at(-1).id, 'distribution-version');
  const order = [...before.sources.slice(0, -1).map(s => s.id), ...curated.evidence.filter(s => !oldIds.has(s.id)).map(s => s.id), 'distribution-version'];
  const check = actual => {
    checkPatch(actual.patch_status, before.patch_status, target.id);
    assert.deepEqual(actual.runtime, curated.runtime);
    assert.deepEqual(actual.patch_status, curated.patch_status);
    assert.deepEqual(actual.sources, order.map(id => expected.get(id)));
    for (const s of before.sources) assert.deepEqual(actual.sources.find(v => v.id === s.id), s);
  };
  check(value);
  validateDetail(value, entry, index);
  assert.equal(validateRuntime(value), true);
  assert.equal(deriveVerification(value), 'deep_verified');
  assert.equal(entry.verification, 'deep_verified');
  assert.deepEqual(value.runtime.source_ids, [...new Set(value.runtime.steps.flatMap(s => s.source_ids))]);
  assert.ok(value.runtime.corroboration_source_ids.every(id => value.sources.some(s => s.id === id && s.component === 'nginx-docs')));
  const added = value.sources.find(s => !oldIds.has(s.id));
  assert.ok(added);
  for (const change of [
    v => v.sources.reverse(), v => v.sources.push(added), v => v.sources.shift(),
    v => { v.sources.find(s => s.id === added.id).revision = '0'.repeat(40); },
    v => { v.sources.find(s => s.id === added.id).component = '其他组件'; },
    v => { v.sources.find(s => s.id === added.id).version = '错误版本'; },
    v => { v.sources.find(s => s.id === added.id).file = 'wrong.c'; },
    v => { v.sources.find(s => s.id === added.id).kind = '错误来源类别'; },
    v => { v.sources.find(s => s.id === added.id).code = '伪造源码'; },
    v => { v.sources.find(s => s.id === added.id).start_line++; },
    v => { v.sources.find(s => s.id === added.id).url = 'https://wrong.example'; },
    v => { v.runtime.steps[0].action = '错误运行语义'; },
    v => { v.patch_status.status = 'unverified'; },
    v => { v.patch_status.source_ids.push(v.patch_status.source_ids[0]); },
  ]) { const wrong = structuredClone(value); change(wrong); assert.throws(() => check(wrong), assert.AssertionError); }
  for (const change of [
    v => { v.runtime.steps[0].source_ids = []; },
    v => { v.runtime.source_ids.push('missing-source'); },
    v => { v.runtime.corroboration_source_ids = []; },
    v => { v.patch_status.source_ids = []; },
    v => { v.defaults.status = 'unverified'; },
  ]) { const wrong = structuredClone(value); change(wrong); assert.throws(() => validateDetail(wrong, entry, index)); }
  const basic = structuredClone(value); delete basic.runtime;
  assert.equal(deriveVerification(basic), 'basic_verified');
  assert.throws(() => validateDetail(basic, entry, index));
  for (const sourceId of ['registration', 'configuration-definition']) for (const cropped of [false, true]) {
    const wrong = structuredClone(value);
    const alias = { ...wrong.sources.find(s => s.id === sourceId), id: 'runtime-alias' };
    if (cropped) { alias.end_line = alias.start_line; alias.code = alias.code.split('\n')[0]; }
    alias.url = alias.url.replace(/#L\d+-L\d+$/, `#L${alias.start_line}-L${alias.end_line}`);
    wrong.sources.push(alias); wrong.patch_status.source_ids.push(alias.id);
    wrong.runtime.steps = [{ condition: '配置注册', action: '把配置解析冒充运行消费', source_ids: [alias.id] }];
    wrong.runtime.source_ids = [alias.id];
    assert.throws(() => validateRuntime(wrong), /运行时缺少/);
  }
});

test('仅B2五身份晋级，既有14项深度、其他1036详情和索引字段保持', () => {
  validateIndex(index);
  const checkIndex = frozen => assert.deepEqual(index, frozen);
  const frozen = json(`dist/knowledge/releases/${index.release_id}/index.json`);
  checkIndex(frozen);
  const wrongIndex = structuredClone(frozen); wrongIndex.coverage.gaps.push('冻结索引漂移');
  assert.throws(() => checkIndex(wrongIndex), assert.AssertionError);
  const expectedDeep = [...baseline.directives.filter(e => e.verification === 'deep_verified').map(e => e.id), ...ids].sort();
  assert.deepEqual(index.directives.filter(e => e.verification === 'deep_verified').map(e => e.id).sort(), expectedDeep);
  assert.equal(index.coverage.deep_verified_count, 19);
  assert.equal(index.coverage.basic_verified_count, 1041);
  const normalized = structuredClone(index);
  normalized.release_id = baseline.release_id;
  normalized.references_path = baseline.references_path;
  normalized.directives = baseline.directives;
  normalized.coverage.deep_verified_count = baseline.coverage.deep_verified_count;
  normalized.coverage.groups.bundled.deep_verified_count = baseline.coverage.groups.bundled.deep_verified_count;
  assert.deepEqual(normalized, baseline);
  assert.deepEqual(index.directives.map(e => e.id), baseline.directives.map(e => e.id));
  for (const entry of index.directives) {
    const oldEntry = baseline.directives.find(e => e.id === entry.id);
    assert.deepEqual({ ...entry, detail_path: oldEntry.detail_path, verification: ids.includes(entry.id) ? oldEntry.verification : entry.verification }, oldEntry);
    const before = detail(oldEntry);
    const value = detail(entry);
    const check = actual => {
      assert.equal(actual.release_id, index.release_id, entry.id);
      const stable = structuredClone(actual); stable.release_id = before.release_id;
      if (ids.includes(entry.id)) {
        checkPatch(stable.patch_status, before.patch_status, entry.id);
        delete stable.runtime; stable.sources = before.sources; stable.patch_status = before.patch_status; stable.verification = before.verification;
      }
      assert.deepEqual(stable, before, entry.id);
    };
    check(value);
    const wrong = structuredClone(value); wrong.defaults.text = '误改默认事实';
    assert.throws(() => check(wrong), assert.AssertionError);
    const stale = structuredClone(value); stale.release_id = baseline.release_id;
    assert.throws(() => check(stale), assert.AssertionError);
  }
});

test('容量五项单条与主配置查询、Markdown一致，历史版本保持basic', async () => {
  const client = createKnowledgeClient({ knowledgeBase: 'http://fixture.test/knowledge/', siteBase: 'http://fixture.test/', timeoutMs: 1000,
    fetcher: async url => ({ ok: true, json: async () => json(`dist${new URL(url).pathname}`) }) });
  for (const target of targets) {
    const result = await client.querySingle(target.name, { context: target.context, module: target.module, release: index.release_id });
    assert.equal(result.status, 'matched');
    assert.equal(result.detail.verification, 'deep_verified');
    assert.ok(result.markdown.includes(RUNTIME_SCOPE_NOTE));
    assert.deepEqual(result.detail.runtime, detail(index.directives.find(e => e.id === target.id)).runtime);
    for (const step of result.detail.runtime.steps) {
      assert.ok(result.markdown.includes(step.condition)); assert.ok(result.markdown.includes(step.action));
    }
    for (const id of [...result.detail.runtime.source_ids, ...result.detail.runtime.corroboration_source_ids]) {
      assert.ok(result.markdown.includes(result.detail.sources.find(s => s.id === id).url));
    }
    const old = await client.querySingle(target.name, { context: target.context, module: target.module, release: baseline.release_id });
    assert.equal(old.detail.verification, 'basic_verified'); assert.equal(old.detail.runtime, undefined);
  }
  const parsed = parseConfig('worker_processes auto; worker_cpu_affinity auto; worker_rlimit_nofile 8192; events { worker_connections 1024; multi_accept on; }', { mode: 'main' });
  assert.deepEqual(parsed.errors, []);
  const matches = parsed.directives.map(d => matchDirective(d, index));
  assert.ok(matches.every(v => v.status === 'matched'));
  assert.deepEqual(matches.flatMap(v => v.candidates).filter(e => ids.includes(e.id)).map(e => e.id).sort(), [...ids].sort());
});
