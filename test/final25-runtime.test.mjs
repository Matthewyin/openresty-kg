import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { validateDetail, validateIndex, validateRuntime, deriveVerification, createKnowledgeClient, RUNTIME_SCOPE_NOTE } from '../src/query/knowledge.mjs';

const root = resolve(import.meta.dirname, '..');
const json = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const config = json('project.config.json');
const frozen = json('test/fixtures/final25-baseline.json');
const targets = frozen.targets;
const ids = targets.map(t => t.id);
const index = json('dist/knowledge/releases/1.27.1.1-1c2ead24459672e6/index.json');
const baseline = json('dist/knowledge/releases/1.27.1.1-06a6394fb516a4bb/index.json');
const knowledge = [...json(config.knowledge_file), ...json(config.extension_knowledge_file)];
const identity = v => `${v.component}--${v.module}--${v.name}`;
const detail = entry => json(`dist/knowledge/${entry.detail_path}`);
const beforeFor = id => detail(baseline.directives.find(e => e.id === id));
const owners = new Map(json('analysis/components.json').components.map(v => [v.component, v]));
for (const v of [...config.documentation_sources, ...config.department_extensions]) owners.set(v.component, { ...v, local_path: v.path });
owners.set('openresty', { local_path: config.main_repo, revision: json(config.nginx_patch_audit).openresty_revision,
  version: config.openresty_version, repository: 'https://github.com/openresty/openresty' });
for (const [component, revision, version, repository] of [
  ['nginx', 'e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928', '1.27.1', 'https://github.com/nginx/nginx'],
  ['nginx-docs', 'e8b581903e9d41252720053311cea687a5671674', '2024-08-15', 'https://github.com/nginx/nginx.org'],
  ['openresty', '8c37412c31621225e7aa7e825b5b50106c9c71c4', '1.27.1.1', 'https://github.com/openresty/openresty'],
  ['nginx-module-vts', '52fe11e44c47a49b052be89e36dfa17d81bf52a5', 'commit 52fe11e44c47', 'https://github.com/vozlt/nginx-module-vts'],
]) {
  const owner = owners.get(component);
  assert.deepEqual([owner.revision, owner.version, owner.repository], [revision, version, repository]);
}
const files = new Map();
const approvedPatchChanges = new Map([
  ['nginx--ngx_http_core_module--listen', 'verified_affected'],
  ['nginx--ngx_stream_core_module--listen', 'verified_affected'],
]);
function fixedSource(e, component) {
  const ownerName = e.component ?? component;
  const owner = owners.get(ownerName);
  assert.ok(owner, ownerName);
  const key = `${ownerName}/${owner.revision}/${e.file}`;
  if (!files.has(key)) files.set(key, execFileSync('git', ['-C', resolve(root, owner.local_path), 'show', `${owner.revision}:${e.file}`],
    { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }).replaceAll('\r\n', '\n').split('\n'));
  const lines = files.get(key);
  assert.ok(e.start_line > 0 && e.end_line >= e.start_line && e.end_line <= lines.length);
  return { id: e.id, component: ownerName, version: owner.version, revision: owner.revision, file: e.file,
    start_line: e.start_line, end_line: e.end_line, code: lines.slice(e.start_line - 1, e.end_line).join('\n'),
    url: `${owner.repository}/blob/${owner.revision}/${e.file}#L${e.start_line}-L${e.end_line}`,
    kind: e.file.endsWith('.patch') ? 'openresty_patch' : 'upstream' };
}

for (const target of targets) test(`固定清单逐项来源、事实保护和晋级：${target.id}`, () => {
  const entry = index.directives.find(e => e.id === target.id);
  const value = detail(entry);
  const before = beforeFor(target.id);
  const curated = knowledge.find(v => identity(v) === target.id);
  const checkPrefix = v => assert.equal(hash(v.evidence.slice(0, target.count)), target.hash);
  checkPrefix(curated);
  const { runtime, evidence, patch_status, limitations, ...stableCurated } = curated;
  assert.equal(hash(stableCurated), target.stableHash);
  assert.notEqual(hash({ ...stableCurated, unexpected: '未授权新字段' }), target.stableHash);
  const corrupted = structuredClone(curated); corrupted.evidence[0].end_line++;
  assert.throws(() => checkPrefix(corrupted), assert.AssertionError);
  assert.equal(new Set(curated.evidence.map(e => e.id)).size, curated.evidence.length);
  const oldIds = new Set(before.sources.map(s => s.id));
  const expected = new Map(before.sources.map(s => [s.id, s]));
  for (const e of curated.evidence) expected.set(e.id, fixedSource(e, entry.component));
  const added = curated.evidence.filter(e => !oldIds.has(e.id)).map(e => expected.get(e.id));
  const tailId = entry.component === 'nginx-module-vts' ? 'module-build' : 'distribution-version';
  const tail = before.sources.filter(s => s.id === tailId);
  const ordered = [...before.sources.filter(s => s.id !== tailId).map(s => expected.get(s.id)), ...added, ...tail];
  const checkPatch = actual => {
    assert.equal(actual.status, approvedPatchChanges.get(target.id) ?? before.patch_status.status);
    assert.deepEqual({ ...actual, note: before.patch_status.note, source_ids: before.patch_status.source_ids,
      status: before.patch_status.status }, before.patch_status);
    assert.deepEqual(actual.source_ids.slice(0, before.patch_status.source_ids.length), before.patch_status.source_ids);
    assert.equal(new Set(actual.source_ids).size, actual.source_ids.length);
  };
  const check = actual => {
    assert.equal(actual.release_id, index.release_id);
    assert.equal(new Set(actual.sources.map(s => s.id)).size, actual.sources.length);
    assert.deepEqual(actual.sources, ordered);
    for (const source of before.sources) assert.deepEqual(actual.sources.find(s => s.id === source.id), source);
    assert.deepEqual(actual.runtime, curated.runtime);
    assert.deepEqual(actual.patch_status, curated.patch_status);
    checkPatch(actual.patch_status);
    const stable = structuredClone(actual);
    delete stable.runtime;
    stable.release_id = before.release_id;
    stable.sources = before.sources;
    stable.patch_status = before.patch_status;
    stable.verification = before.verification;
    assert.deepEqual(stable, before);
  };
  check(value);
  assert.ok(added.length > 0);
  for (const [field, invalid] of [['code', '错误新增片段'], ['revision', '0'.repeat(40)], ['url', 'https://invalid.example/source']]) {
    const wrongSource = structuredClone(value);
    wrongSource.sources.find(source => source.id === added[0].id)[field] = invalid;
    assert.throws(() => check(wrongSource), assert.AssertionError);
  }
  const wrongPatch = structuredClone(value);
  wrongPatch.patch_status.extra = '未经批准';
  assert.throws(() => check(wrongPatch), assert.AssertionError);
  // 不依赖与curated不一致先失败，单独保护两端同步漂移时的状态与字段白名单。
  assert.throws(() => checkPatch({ ...curated.patch_status, status: 'unverified' }), assert.AssertionError);
  assert.throws(() => checkPatch({ ...curated.patch_status, extra: '未经批准' }), assert.AssertionError);
  assert.equal(value.verification, 'deep_verified');
  assert.equal(entry.verification, 'deep_verified');
  assert.equal(deriveVerification(value), 'deep_verified');
  validateDetail(value, entry, index);
  assert.equal(validateRuntime(value), true);
  assert.deepEqual(value.runtime.source_ids, [...new Set(value.runtime.steps.flatMap(s => s.source_ids))]);
  assert.ok(value.runtime.corroboration_source_ids.every(id => value.sources.some(s => s.id === id
    && (s.component === 'nginx-docs' || s.component === 'nginx-module-vts'))));
  for (const change of [
    v => v.sources.reverse(), v => v.sources.push(v.sources[0]), v => v.sources.shift(),
    v => { v.sources.at(-1).code = '伪造源码'; }, v => { v.sources[0].revision = '0'.repeat(40); },
    v => { v.sources[0].url = 'https://invalid.example'; }, v => { v.sources[0].start_line++; },
    v => { v.defaults.text = '误改默认值'; }, v => { v.inheritance.text = '误改继承'; },
    v => { v.limitations.push({ status: 'unverified', text: '误加限制', source_ids: [] }); }, v => { v.summary = '误改简介'; },
    v => { v.runtime.steps[0].action = '错误执行语义'; }, v => { v.release_id = baseline.release_id; },
  ]) { const bad = structuredClone(value); change(bad); assert.throws(() => check(bad), assert.AssertionError); }
  for (const change of [
    v => { v.runtime.steps[0].source_ids = []; }, v => { v.runtime.corroboration_source_ids = []; },
    v => { v.runtime.source_ids.push('missing'); }, v => { v.runtime.source_ids.push(v.runtime.source_ids[0]); },
    v => { v.patch_status.source_ids = []; }, v => { v.defaults.status = 'unverified'; },
  ]) { const bad = structuredClone(value); change(bad); assert.throws(() => validateDetail(bad, entry, index)); }
  const basic = structuredClone(value); delete basic.runtime;
  assert.equal(deriveVerification(basic), 'basic_verified');
  for (const sourceId of ['registration', 'configuration-definition']) {
    const bad = structuredClone(value);
    const alias = { ...bad.sources.find(s => s.id === sourceId), id: 'configuration-as-runtime' };
    bad.sources.push(alias); bad.patch_status.source_ids.push(alias.id);
    bad.runtime.steps = [{ condition: '配置阶段', action: '错误地视为运行时', source_ids: [alias.id] }];
    bad.runtime.source_ids = [alias.id];
    assert.throws(() => validateRuntime(bad), /运行时缺少/);
  }
});

test('25项固定集合、当前冻结发布和其他1016项无漂移', () => {
  assert.equal(createHash('sha256').update(readFileSync(resolve(root, config.nginx_patch_audit))).digest('hex'),
    '4248d0c4634e87f8714e32d194b4da566ff489877e7bf86ea6bf0d5e378d53ce');
  assert.equal(ids.length, 25);
  assert.equal(new Set(ids).size, 25);
  // 后续默认值补证会修改知识输入；本批历史保护绑定原发布，当前写集由defaults-340专项保护。
  const publicationHash = createHash('sha256');
  for (const entry of index.directives) publicationHash.update(readFileSync(resolve(root, 'dist/knowledge', entry.detail_path)));
  publicationHash.update(readFileSync(resolve(root, 'dist/knowledge', index.references_path)));
  assert.equal(publicationHash.digest('hex'), '02ef9c9c952ac5a0b0e2dac766402066ba1c4a8d265135ae61ea52d0f1a7d800');
  validateIndex(index);
  assert.deepEqual(index, json(`dist/knowledge/releases/${index.release_id}/index.json`));
  const expectedDeep = [...baseline.directives.filter(e => e.verification === 'deep_verified').map(e => e.id), ...ids].sort();
  assert.deepEqual(index.directives.filter(e => e.verification === 'deep_verified').map(e => e.id).sort(), expectedDeep);
  assert.equal(index.coverage.deep_verified_count, 44);
  assert.equal(index.coverage.basic_verified_count, 1041);
  assert.equal(index.coverage.groups.bundled.deep_verified_count, 40);
  assert.equal(index.coverage.groups.department_extension.deep_verified_count, 4);
  const stable = structuredClone(index);
  stable.release_id = baseline.release_id;
  stable.references_path = baseline.references_path;
  stable.directives = baseline.directives;
  stable.coverage.deep_verified_count = baseline.coverage.deep_verified_count;
  for (const kind of Object.keys(stable.coverage.groups)) stable.coverage.groups[kind].deep_verified_count = baseline.coverage.groups[kind].deep_verified_count;
  assert.deepEqual(stable, baseline);
  assert.deepEqual(index.directives.map(e => e.id), baseline.directives.map(e => e.id));
  for (const entry of index.directives) {
    const old = baseline.directives.find(e => e.id === entry.id);
    assert.deepEqual({ ...entry, detail_path: old.detail_path, verification: ids.includes(entry.id) ? old.verification : entry.verification }, old);
    if (ids.includes(entry.id)) continue;
    const value = detail(entry), before = detail(old);
    assert.equal(value.release_id, index.release_id);
    assert.deepEqual({ ...value, release_id: before.release_id }, before, entry.id);
  }
});

test('25项真实查询与Markdown逐步引用一致，历史版本仍保持原评级', async () => {
  const client = createKnowledgeClient({ knowledgeBase: 'http://fixture.test/knowledge/', siteBase: 'http://fixture.test/', timeoutMs: 1000,
    fetcher: async url => ({ ok: true, json: async () => json(`dist${new URL(url).pathname}`) }) });
  for (const id of ids) {
    const entry = index.directives.find(e => e.id === id);
    const options = { module: entry.module, context: entry.contexts[0], release: index.release_id };
    const result = await client.querySingle(entry.name, options);
    assert.equal(result.status, 'matched', id);
    assert.equal(result.detail.id, id);
    assert.deepEqual(result.detail.runtime, detail(entry).runtime);
    assert.ok(result.markdown.includes(RUNTIME_SCOPE_NOTE));
    for (const step of result.detail.runtime.steps) {
      assert.ok(result.markdown.includes(step.condition)); assert.ok(result.markdown.includes(step.action));
    }
    for (const sourceId of [...result.detail.runtime.source_ids, ...result.detail.runtime.corroboration_source_ids]) {
      assert.ok(result.markdown.includes(result.detail.sources.find(s => s.id === sourceId).url));
    }
    const old = await client.querySingle(entry.name, { ...options, release: baseline.release_id });
    assert.equal(old.detail.verification, 'basic_verified');
    assert.equal(old.detail.runtime, undefined);
  }
});

const semantics = json('test/fixtures/final25-semantic.json');
test('独立语义锚点覆盖完整25项', () => {
  assert.deepEqual(semantics.map(v => v.id), ids);
});
for (const item of semantics) test(`步骤直接绑定真实消费及失败锚点：${item.id}`, () => {
  const value = detail(index.directives.find(e => e.id === item.id));
  for (const rule of item.checks) {
    const matchesStep = step => new RegExp(rule.stepPattern).test(`${step.condition} ${step.action}`);
    const matchesSource = source => source.file === rule.file && source.start_line <= rule.line && source.end_line >= rule.line
      && new RegExp(rule.codePattern).test(source.code.split('\n')[rule.line - source.start_line]);
    const check = candidate => {
      assert.ok(candidate.runtime.steps.some(step => matchesStep(step)
        && rule.wordingPatterns.every(pattern => new RegExp(pattern).test(`${step.condition} ${step.action}`))
        && candidate.sources.some(source => step.source_ids.includes(source.id) && matchesSource(source))),
      `${item.id} 对应步骤缺少 ${rule.file}:${rule.line} 或必要条件`);
    };
    check(value);
    const wrongText = structuredClone(value);
    for (const step of wrongText.runtime.steps.filter(matchesStep)) {
      step.condition = '条件未知'; step.action = '无条件完成';
    }
    assert.equal(validateRuntime(wrongText), true);
    assert.throws(() => check(wrongText), assert.AssertionError);
    const wrongBinding = structuredClone(value);
    const anchorIds = wrongBinding.sources.filter(source => wrongBinding.runtime.source_ids.includes(source.id) && matchesSource(source)).map(source => source.id);
    const fallback = wrongBinding.runtime.source_ids.find(id => !anchorIds.includes(id));
    assert.ok(fallback);
    for (const step of wrongBinding.runtime.steps.filter(matchesStep)) {
      step.source_ids = step.source_ids.filter(id => !anchorIds.includes(id));
      if (!step.source_ids.length) step.source_ids.push(fallback);
    }
    wrongBinding.runtime.steps.push({ condition: '独立附录', action: '其他说明', source_ids: anchorIds });
    assert.deepEqual(wrongBinding.runtime.source_ids, value.runtime.source_ids);
    assert.equal(validateRuntime(wrongBinding), true);
    assert.throws(() => check(wrongBinding), assert.AssertionError);
  }
});
