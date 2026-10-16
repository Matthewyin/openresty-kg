import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { validateDetail, validateIndex } from '../src/query/knowledge.mjs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root));
const json = path => JSON.parse(read(path));
const baselinePath = 'dist/knowledge/releases/1.27.1.1-1c2ead24459672e6/index.json';
const baseline = json(baselinePath);
// 本专项冻结可靠性批次；后续340项补证由defaults-340专项校验当前发布。
const indexPath = 'dist/knowledge/releases/1.27.1.1-f9f6f0ffb7eba3d8/index.json';
const index = json(indexPath);
const oldPending = '已收到部门配置样例；现场版本、模块安装信息及部门深度验收待核实';
const newPending = '已收到部门配置样例；现场版本及模块安装信息待核实';
const expectedGaps = baseline.coverage.gaps.map(gap => gap === oldPending ? newPending : gap);
const detail = entry => json('dist/knowledge/' + entry.detail_path);

function checkIndex(actual) {
  validateIndex(actual);
  assert.deepEqual(actual.coverage.gaps, expectedGaps);
  assert.equal(actual.references_path, `releases/${actual.release_id}/references.json`);
  assert.equal(actual.directives.length, baseline.directives.length);
  actual.directives.forEach((entry, i) => {
    assert.equal(entry.detail_path, `releases/${actual.release_id}/directives/${entry.id}.json`);
    assert.deepEqual({ ...entry, detail_path: baseline.directives[i].detail_path }, baseline.directives[i]);
  });
  assert.deepEqual({ ...actual, release_id: baseline.release_id, references_path: baseline.references_path,
    directives: baseline.directives, coverage: { ...actual.coverage, gaps: baseline.coverage.gaps } }, baseline);
}

function checkDetail(actual, before, entry) {
  assert.equal(actual.release_id, index.release_id);
  validateDetail(actual, entry, index);
  assert.deepEqual({ ...actual, release_id: before.release_id }, before);
}

test('本次仅更新待验收提示，1041详情、44深度和参考知识完整保真', () => {
  const hash = path => createHash('sha256').update(read(path)).digest('hex');
  assert.equal(hash(baselinePath), 'b9130c21bc883935afe4d25fe69b59a9cd12820cd73b4df840ca0aa5bcfa85b3');
  assert.equal(hash(indexPath), '4276b2a74f8d071e3b85bb5c82489899b30c35cb1791bcc25f0e46b639c32b4f');
  assert.deepEqual(json('project.config.json').department_sample_status, { received: true, pending: [newPending] });
  checkIndex(index);
  assert.deepEqual(index, json(`dist/knowledge/releases/${index.release_id}/index.json`));
  index.directives.forEach((entry, i) => checkDetail(detail(entry), detail(baseline.directives[i]), entry));
  const reference = json('dist/knowledge/' + index.references_path);
  const oldReference = json('dist/knowledge/' + baseline.references_path);
  assert.equal(reference.release_id, index.release_id);
  assert.deepEqual({ ...reference, release_id: oldReference.release_id }, oldReference);
});

test('拒绝误删现场缺口、旧发布残留、事实漂移和计数变化', () => {
  for (const mutate of [value => value.coverage.gaps.pop(), value => value.coverage.basic_verified_count--,
    value => { value.directives[0].detail_path = baseline.directives[0].detail_path; }]) {
    const invalid = structuredClone(index); mutate(invalid);
    assert.throws(() => checkIndex(invalid));
  }
  const entry = index.directives.find(e => e.name === 'sendfile' && e.module === 'ngx_http_core_module');
  const before = detail(baseline.directives.find(e => e.id === entry.id));
  for (const mutate of [value => { value.availability.status = 'verified'; }, value => { value.sources[0].code += '错误'; },
    value => { value.runtime.steps[0].action += '错误'; }, value => { value.release_id = baseline.release_id; }]) {
    const invalid = structuredClone(detail(entry)); mutate(invalid);
    assert.throws(() => checkDetail(invalid, before, entry));
  }
});
