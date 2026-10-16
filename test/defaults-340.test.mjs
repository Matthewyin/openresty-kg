import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { validateDetail, renderMarkdown } from '../src/query/knowledge.mjs';

const root = resolve(import.meta.dirname, '..');
const read = path => readFileSync(resolve(root, path));
const json = path => JSON.parse(read(path));
// 340 项补证时冻结的 project.config.json 不含字段证据目录；其后新增的 field_evidence_dir 单行配置不属于该专项范围，
// 按历史哈希校验时先剔除这一行，并由下面的专项保护保证除此之外没有任何差异。
const FIELD_EVIDENCE_LINE = '  "field_evidence_dir": "knowledge/field-evidence",\n';
const hash = path => createHash('sha256').update(path === 'project.config.json' ? read(path).toString().replace(FIELD_EVIDENCE_LINE, '') : read(path)).digest('hex');
const manifest = json('analysis/DEFAULTS_340_MANIFEST.json');
const frozenInputs = json('test/fixtures/defaults-340-inputs.json');
const baselinePath = `dist/knowledge/releases/${manifest.baseline_release}/index.json`;
const baseline = json(baselinePath);
const index = json('dist/knowledge/index.json');
const config = json('project.config.json');
const matrix = json('analysis/components.json');
const curated = new Map([...json(config.knowledge_file), ...json(config.extension_knowledge_file)]
  .map(item => [[item.component, item.module, item.name].join('--'), item]));
const targets = new Map(manifest.items.map(item => [item.id, item]));
const detail = entry => json('dist/knowledge/' + entry.detail_path);
const beforeById = new Map(baseline.directives.map(entry => [entry.id, detail(entry)]));
const sourceConfigs = new Map([
  ...matrix.components.map(item => [item.component, item]),
  ...config.documentation_sources.map(item => [item.component, { ...item, local_path: item.path }]),
  ...config.department_extensions.map(item => [item.component, { ...item, local_path: item.path }]),
  ['openresty', { local_path: config.main_repo, repository: 'https://github.com/openresty/openresty',
    revision: json(config.nginx_patch_audit).openresty_revision, version: config.openresty_version }],
]);
const files = new Map();
function fixedSource(evidence, component, position) {
  const owner = evidence.component ?? component;
  const source = sourceConfigs.get(owner);
  assert.ok(source, owner);
  const key = `${owner}/${evidence.file}`;
  if (!files.has(key)) files.set(key, execFileSync('git', ['-C', resolve(root, source.local_path), 'show',
    `${source.revision}:${evidence.file}`], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }).replaceAll('\r\n', '\n').split('\n'));
  const lines = files.get(key);
  assert.ok(evidence.start_line > 0 && evidence.end_line >= evidence.start_line && evidence.end_line <= lines.length);
  return { id: evidence.id ?? `evidence-${position}`, component: owner, version: source.version,
    revision: source.revision, file: evidence.file, start_line: evidence.start_line, end_line: evidence.end_line,
    code: lines.slice(evidence.start_line - 1, evidence.end_line).join('\n'),
    url: `${source.repository}/blob/${source.revision}/${evidence.file}#L${evidence.start_line}-L${evidence.end_line}`,
    kind: evidence.file.endsWith('.patch') ? 'openresty_patch' : 'upstream' };
}
const ordered = sources => [...sources].sort((a, b) => a.id.localeCompare(b.id));

// 340 专项基线早于字段证据；字段证据覆盖只允许追加来源、写入 syntax/summary 证据对象并应用经审核的修正。
// 先按覆盖文件逐项核对这些改动，再把它们撤回，剩余内容仍须与 340 基线逐字段一致。
const overlays = new Map(readdirSync(resolve(root, config.field_evidence_dir)).filter(name => name.endsWith('.json')).sort()
  .flatMap(name => json(`${config.field_evidence_dir}/${name}`).entries.map(entry => [entry.id, entry])));
const UNVERIFIED_FIELD = { status: 'unverified', source_ids: [], note: null };

function stripFieldEvidence(actual, entry) {
  const stripped = structuredClone(actual);
  const overlay = overlays.get(entry.id);
  for (const field of ['syntax', 'summary']) {
    const evidence = overlay?.[`${field}_evidence`];
    const correction = overlay?.corrections?.[field];
    if (correction) {
      // 修正必须原样发布，并在证据对象中保留被替换的原文以供回溯。
      assert.equal(actual[field], correction.text, `${entry.id}/${field}: 修正未发布`);
      assert.deepEqual(actual[`${field}_evidence`], { ...evidence, correction: { previous_text: actual[`${field}_evidence`].correction?.previous_text, reason: correction.reason } },
        `${entry.id}/${field}: 字段证据与覆盖不符`);
      stripped[field] = actual[`${field}_evidence`].correction.previous_text;
    } else {
      assert.deepEqual(actual[`${field}_evidence`], evidence ?? UNVERIFIED_FIELD, `${entry.id}/${field}: 字段证据与覆盖不符`);
    }
    delete stripped[`${field}_evidence`];
  }
  // 覆盖新增的来源按声明顺序追加在末尾，且每段都必须是锁定 revision 的原文。
  const extra = (overlay?.evidence ?? []).map(item => fixedSource(item, entry.component, null));
  assert.deepEqual(actual.sources.slice(actual.sources.length - extra.length), extra, `${entry.id}: 字段证据来源不符`);
  stripped.sources = actual.sources.slice(0, actual.sources.length - extra.length);
  return stripped;
}

function checkIndex(actual) {
  assert.equal(actual.references_path, `releases/${actual.release_id}/references.json`);
  assert.deepEqual(actual.directives.map(e => e.id), baseline.directives.map(e => e.id));
  actual.directives.forEach((entry, i) => {
    assert.equal(entry.detail_path, `releases/${actual.release_id}/directives/${entry.id}.json`);
    assert.deepEqual({ ...entry, detail_path: baseline.directives[i].detail_path }, baseline.directives[i]);
  });
  assert.deepEqual({ ...actual, release_id: baseline.release_id, references_path: baseline.references_path, directives: baseline.directives }, baseline);
}

function checkDetail(published, entry) {
  assert.equal(published.release_id, index.release_id);
  assert.doesNotThrow(() => validateDetail(published, entry, index), `${entry.id}: 发布结构无效`);
  const actual = stripFieldEvidence(published, entry);
  const before = beforeById.get(entry.id);
  const target = targets.get(entry.id);
  const stable = structuredClone(actual);
  stable.release_id = before.release_id;
  if (target) {
    const item = curated.get(entry.id);
    const oldIds = new Set(before.sources.map(source => source.id));
    assert.deepEqual(actual.sources.filter(source => oldIds.has(source.id)), before.sources, `${entry.id}: 旧证据`);
    const evidence = item.evidence.map((e, i) => fixedSource(e, item.component, i));
    const added = evidence.filter(source => !oldIds.has(source.id));
    assert.deepEqual(ordered(actual.sources), ordered([...before.sources, ...added]), `${entry.id}: 精确证据集合`);
    assert.equal(new Set(actual.sources.map(source => source.id)).size, actual.sources.length);
    for (const field of target.fields) {
      const fact = actual[field];
      assert.ok(['verified', 'not_applicable'].includes(fact.status), `${entry.id}/${field}: 仍待核实`);
      assert.ok(fact.text?.trim(), `${entry.id}/${field}: 缺少说明`);
      assert.ok(fact.source_ids.length, `${entry.id}/${field}: 缺少证据`);
      assert.equal(new Set(fact.source_ids).size, fact.source_ids.length, `${entry.id}/${field}: 重复事实引用`);
      assert.deepEqual(fact, item[field], `${entry.id}/${field}: 未发布最新事实`);
      const sources = fact.source_ids.map(id => actual.sources.find(s => s.id === id));
      assert.ok(sources.every(Boolean), `${entry.id}/${field}: 引用缺失`);
      assert.ok(sources.some(s => /\.(c|h|patch)$/.test(s.file)), `${entry.id}/${field}: 缺少源码依据`);
      const markdown = renderMarkdown({ status: 'matched', detail: actual, errors: [] });
      assert.ok(markdown.includes(fact.text), `${entry.id}/${field}: Markdown丢失事实`);
      stable[field] = before[field];
    }
    assert.deepEqual(actual.patch_status, item.patch_status ?? before.patch_status);
    if (entry.component === 'nginx') {
      for (const source of added.filter(s => s.component === 'nginx' && /\.(c|h)$/.test(s.file))) {
        assert.ok(actual.patch_status.source_ids.includes(source.id), `${entry.id}/${source.id}: 新源码缺少补丁核对引用`);
      }
    }
    assert.deepEqual(actual.patch_status.source_ids.filter(id => before.patch_status.source_ids.includes(id)), before.patch_status.source_ids);
    for (const id of actual.patch_status.source_ids.filter(id => !before.patch_status.source_ids.includes(id))) {
      assert.ok(added.some(s => s.id === id), `${entry.id}: 未授权补丁证据`);
    }
    assert.equal(new Set(actual.patch_status.source_ids).size, actual.patch_status.source_ids.length);
    stable.patch_status.source_ids = before.patch_status.source_ids;
    stable.sources = before.sources;
  }
  assert.deepEqual(stable, before, `${entry.id}: 改动超出缺失字段`);
}

test('project.config.json 相对340专项冻结版只新增 field_evidence_dir', () => {
  const current = read('project.config.json').toString();
  assert.equal(current.split(FIELD_EVIDENCE_LINE).length, 2);
  const { field_evidence_dir, ...rest } = JSON.parse(current);
  assert.equal(field_evidence_dir, 'knowledge/field-evidence');
  assert.deepEqual(JSON.parse(current.replace(FIELD_EVIDENCE_LINE, '')), rest);
});

test('固定清单精确覆盖340身份及537个缺失字段，历史快照未变', () => {
  assert.equal(hash('analysis/DEFAULTS_340_MANIFEST.json'), 'a685f1d87c9a3afc7812c8ca231cc137dba10db494b3d0f9b183d16c111cff90');
  assert.equal(hash(baselinePath), manifest.baseline_index_sha256);
  assert.deepEqual(manifest.counts, { identities: 340, defaults: 225, inheritance: 312 });
  assert.equal(targets.size, 340);
  for (const [path, expectedHash] of Object.entries(frozenInputs.files)) assert.equal(hash(path), expectedHash, path);
  const aggregate = createHash('sha256');
  for (const entry of baseline.directives) aggregate.update(read('dist/knowledge/' + entry.detail_path));
  aggregate.update(read('dist/knowledge/' + baseline.references_path));
  assert.equal(aggregate.digest('hex'), frozenInputs.baseline_publication_sha256);
  const expected = [...beforeById.values()].filter(d => ['defaults', 'inheritance'].some(f => d[f].status === 'unverified'));
  assert.deepEqual(manifest.items.map(i => i.id), expected.map(d => d.id));
  for (const item of manifest.items) {
    const before = beforeById.get(item.id);
    assert.deepEqual(item.fields, ['defaults', 'inheritance'].filter(f => before[f].status === 'unverified'));
    assert.equal(hash(`dist/knowledge/releases/${manifest.baseline_release}/directives/${item.id}.json`), item.baseline_sha256);
  }
});

for (const item of manifest.items) test(`逐项补证及原事实保护：${item.id}`, () => {
  const entry = index.directives.find(e => e.id === item.id);
  assert.ok(entry);
  checkDetail(detail(entry), entry);
});

test('1041项、44深度、参考库与现场未知范围保持，非目标内容不变', () => {
  assert.deepEqual(index, json(`dist/knowledge/releases/${index.release_id}/index.json`));
  checkIndex(index);
  index.directives.forEach(entry => {
    if (!targets.has(entry.id)) checkDetail(detail(entry), entry);
  });
  const refs = json('dist/knowledge/' + index.references_path);
  const before = json('dist/knowledge/' + baseline.references_path);
  assert.equal(refs.release_id, index.release_id);
  assert.deepEqual({ ...refs, release_id: before.release_id }, before);
});

test('补证保护拒绝事实漂移、错误证据、重复引用及旧发布残留', () => {
  const entry = index.directives.find(e => e.id === manifest.items[0].id);
  const actual = detail(entry);
  checkDetail(actual, entry);
  for (const mutate of [
    d => { d.defaults.status = 'unverified'; }, d => { d.inheritance.source_ids = []; },
    d => d.defaults.source_ids.push(d.defaults.source_ids[0]),
    d => { d.sources[0].code = '错误源码'; }, d => { d.sources[0].revision = '0'.repeat(40); },
    d => { d.sources[0].url = 'https://invalid.example/'; }, d => { d.sources[0].start_line = 0; },
    d => d.sources.push(d.sources[0]), d => d.sources.pop(),
    d => { d.summary += '误改'; }, d => { d.availability.status = 'verified'; },
    d => { d.patch_status.note += '误改'; }, d => d.patch_status.source_ids.push('extra'),
    d => { d.release_id = 'stale-release'; },
    d => { d.syntax += '误改'; }, d => { d.syntax_evidence.note += '误改'; },
    d => { d.summary_evidence.status = 'unverified'; }, d => d.summary_evidence.source_ids.push('extra'),
    d => { d.sources.at(-1).code += '误改'; }, d => { delete d.syntax_evidence; },
  ]) {
    const wrong = structuredClone(actual); mutate(wrong);
    assert.throws(() => checkDetail(wrong, entry), assert.AssertionError);
  }
});

test('拒绝清单外运行时与事实变更、漏身份、计数漂移及删除现场缺口', () => {
  for (const mutate of [i => i.directives.pop(), i => i.directives.push(i.directives[0]),
    i => i.coverage.gaps.pop(), i => i.coverage.basic_verified_count--,
    i => { i.directives[0].detail_path = baseline.directives[0].detail_path; }]) {
    const wrong = structuredClone(index); mutate(wrong);
    assert.throws(() => checkIndex(wrong), assert.AssertionError);
  }
  const entry = index.directives.find(e => e.id === 'nginx--ngx_http_core_module--sendfile');
  const actual = detail(entry);
  assert.ok(!targets.has(entry.id));
  checkDetail(actual, entry);
  for (const mutate of [d => { d.defaults.text += '误改'; }, d => { d.runtime.steps[0].action += '误改'; },
    d => { d.availability.status = 'verified'; }, d => { d.sources[0].code += '误改'; }]) {
    const wrong = structuredClone(actual); mutate(wrong);
    assert.throws(() => checkDetail(wrong, entry), assert.AssertionError);
  }
});
