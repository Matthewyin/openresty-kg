import test from 'node:test';
import assert from 'node:assert/strict';
import { parseConfig } from '../src/core/core.mjs';
import { summarizeConfig, needsOuterContext, needsAttention } from '../src/query/config-results.mjs';

test('关注筛选保留外部引用及所有未唯一匹配状态，不混入普通块内数据', () => {
  const item = { external_references: [] };
  for (const status of ['matched', 'block_entry']) assert.equal(needsAttention(item, { status }), false);
  for (const status of ['unknown', 'ambiguous', 'context_required', 'context_mismatch', 'invalid_input', 'invalid_index']) {
    assert.equal(needsAttention(item, { status }), true);
  }
  const external = { external_references: [{ kind: 'include', value: 'mime.types', status: 'not_analyzed' }] };
  for (const status of ['matched', 'block_entry']) assert.equal(needsAttention(external, { status }), true);
});

test('已知 HTTP server/location 的 types 数据不触发缺外层提示，孤立片段仍提示', () => {
  for (const input of ['http { server { types { text/html html; } } }',
    'http { server { location / { types { text/html html; } } } }']) {
    assert.equal(needsOuterContext(parseConfig(input)), false);
  }
  assert.equal(needsOuterContext(parseConfig('server { listen 80; }')), true);
});

test('统计按出现次数区分指令、块内项及外部引用，不按目录去重', () => {
  const parsed = parseConfig('http { types { text/html html; include types.conf; } include app.conf; sendfile on; sendfile off; unknown on; }');
  const matches = ['matched', 'matched', 'block_entry', 'block_entry', 'matched', 'matched', 'matched', 'unknown']
    .map(status => ({ status }));
  assert.deepEqual(summarizeConfig(parsed, matches), {
    directives: 6, matched: 5, attention: 1, block_entries: 2, external_references: 2,
  });
});

test('不完整块内项仍计需关注；空输入统计归零', () => {
  const parsed = parseConfig('http { types { text/html html');
  assert.ok(parsed.errors.length);
  const matches = parsed.directives.map(() => ({ status: 'invalid_input' }));
  assert.deepEqual(summarizeConfig(parsed, matches), {
    directives: 2, matched: 0, attention: 3, block_entries: 1, external_references: 0,
  });
  assert.deepEqual(summarizeConfig(parseConfig(''), []), {
    directives: 0, matched: 0, attention: 0, block_entries: 0, external_references: 0,
  });
});
