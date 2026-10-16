import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fieldInfo } from '../src/knowledge-tools.mjs';
import { makeReport } from '../src/report.mjs';

const revision = 'a'.repeat(40);
const source = (id, file) => ({ id, component: 'nginx', version: '1', revision, file, start_line: 1, end_line: 1, code: 'x', kind: 'upstream', url: `https://github.com/nginx/nginx/blob/${revision}/${file}#L1-L1` });
// 最小详情：只含字段读取与报告生成需要的部分。
const detail = (extra = {}) => ({ verification: 'basic_verified', summary: '功能正文', syntax: '语法正文;', defaults: { status: 'unverified', text: null, source_ids: [] },
  sources: [source('registration', 'src/a.c'), source('impl', 'src/b.c')], ...extra });

test('fieldInfo 对 summary/syntax 只读取字段证据，缺失或未覆盖时为 unverified', () => {
  assert.deepEqual(fieldInfo(detail(), 'summary'), { status: 'unverified', source_ids: [] });
  const covered = detail({ syntax_evidence: { status: 'verified', source_ids: ['registration'], note: 'x' }, summary_evidence: { status: 'verified', source_ids: ['impl'], note: 'x' } });
  assert.deepEqual(fieldInfo(covered, 'syntax'), { status: 'verified', source_ids: ['registration'] });
  assert.deepEqual(fieldInfo(covered, 'summary'), { status: 'verified', source_ids: ['impl'] });
  // 其他字段逻辑不变：仍读取自身状态与来源。
  assert.deepEqual(fieldInfo(detail({ defaults: { status: 'verified', text: '1', source_ids: ['impl'] } }), 'defaults'), { status: 'verified', source_ids: ['impl'] });
});

test('报告对已核实字段带出引用，并为前端提供条目评级而不改变 status', () => {
  const covered = detail({ summary_evidence: { status: 'verified', source_ids: ['impl'], note: 'x' } });
  const bundle = { analysis: { summary: {}, parsed: { directives: [] }, matches: [], questions: [] }, details: new Map([['e', covered]]) };
  const report = makeReport({ facts: [{ entryId: 'e', field: 'summary' }, { entryId: 'e', field: 'syntax' }] }, bundle);
  const [summary, syntax] = report.modelSelection.resolvedFacts;
  assert.equal(summary.status, 'verified'); assert.equal(summary.verification, 'basic_verified');
  assert.equal(syntax.status, 'unverified'); assert.deepEqual(syntax.source_ids, []);
  assert.deepEqual(report.modelSelection.citations.map(item => [item.field, item.sourceId, item.file]), [['summary', 'impl', 'src/b.c']]);
});
