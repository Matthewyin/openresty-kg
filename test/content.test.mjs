import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { parseConfig, matchDirective } from '../src/core/core.mjs';
import { validateDetail, createKnowledgeClient } from '../src/query/knowledge.mjs';
import { extractCommands } from '../scripts/inventory.mjs';

const root = resolve(import.meta.dirname, '..');
const index = JSON.parse(await readFile(resolve(root, 'dist/knowledge/index.json'), 'utf8'));
const detailFor = async entry => JSON.parse(await readFile(resolve(root, 'dist/knowledge', entry.detail_path), 'utf8'));

test('原 events 片段匹配已核实知识，五项核心配置事实进入发布而非只保留目录', async () => {
  const parsed = parseConfig('events { multi_accept on; worker_connections 65535; }');
  assert.equal(parsed.errors.length, 0);
  for (const directive of parsed.directives.filter(directive => directive.name !== 'events')) {
    const match = matchDirective(directive, index);
    assert.equal(match.status, 'matched');
    assert.equal(match.candidates[0].verification, 'deep_verified');
  }
  for (const [name, expectedDefault, patch] of [
    ['worker_processes', '1', 'verified_unaffected'], ['worker_connections', '512', 'verified_affected'],
    ['multi_accept', 'off', 'verified_affected'], ['accept_mutex', 'off', 'verified_affected'], ['accept_mutex_delay', '500ms', 'verified_affected'],
  ]) {
    const entry = index.directives.find(entry => entry.component === 'nginx' && entry.name === name);
    assert.equal(entry.verification, ['worker_processes', 'worker_connections', 'multi_accept'].includes(name) ? 'deep_verified' : 'basic_verified');
    const detail = validateDetail(await detailFor(entry), entry, index);
    assert.ok(detail.defaults.text.includes(expectedDefault));
    assert.equal(detail.defaults.status, 'verified');
    assert.equal(detail.inheritance.status, 'not_applicable');
    assert.equal(detail.patch_status.status, patch);
    assert.ok(detail.sources.some(source => source.component === 'openresty'));
  }
});

test('CONTENT 冻结发布的37项注册原文与当时仅注册状态保留', async () => {
  const baseline = JSON.parse(await readFile(resolve(root, 'dist/knowledge/releases/1.27.1.1-dee833a2c9381a27/index.json'), 'utf8'));
  const catalog = JSON.parse(await readFile(resolve(root, 'analysis/directives/catalog.json'), 'utf8'));
  for (const [component, count] of [['xss-nginx-module',6], ['memc-nginx-module',11], ['srcache-nginx-module',20]]) {
    const records = catalog.directives.filter(record => record.component === component);
    assert.equal(records.length, count);
    for (const record of records) {
      const source = execFileSync('git', ['-C', resolve(root, record.local_path), 'show', `${record.revision}:${record.file}`], {encoding:'utf8'});
      const extracted = extractCommands(source, record.file, component).find(value => value.name === record.name);
      for (const field of ['name','module','module_verified','callback','flags','line','end_line']) assert.equal(record[field], extracted[field]);
      const entry = baseline.directives.find(entry => entry.id === `${component}--${record.module}--${record.name}`);
      assert.equal(entry.verification, 'registration_only');
      validateDetail(await detailFor(entry), entry, baseline);
    }
  }
});

test('内容发布身份包含范围缺口，历史发布与固定读取保持兼容', async () => {
  const details = await Promise.all(index.directives.map(detailFor));
  const references = JSON.parse(await readFile(resolve(root, 'dist/knowledge', index.references_path), 'utf8'));
  const prepared = details.map(({schema_version,release_id,openresty_version,...detail}) => detail);
  const hashFor = coverage => createHash('sha256').update(JSON.stringify({directives:prepared,references:references.references,coverage},null,2)+'\n').digest('hex').slice(0,16);
  assert.equal(index.release_id, `${index.openresty_version}-${hashFor(index.coverage)}`);
  assert.notEqual(hashFor({...index.coverage,gaps:[...index.coverage.gaps,'测试夹具范围变更']}), hashFor(index.coverage));
  const old = JSON.parse(await readFile(resolve(root,'dist/knowledge/releases/1.27.1.1-a90b2ce291c5ed35/index.json'),'utf8'));
  const oldEntry = old.directives.find(entry => entry.name === 'worker_connections');
  const requests=[];
  const client = createKnowledgeClient({knowledgeBase:'http://knowledge.test/knowledge/',siteBase:'http://knowledge.test/',timeoutMs:1000,
    fetcher:async url => { const path=new URL(url).pathname.slice('/knowledge/'.length); requests.push(path);
      return {ok:true,json:async()=>JSON.parse(await readFile(resolve(root,'dist/knowledge',path),'utf8'))}; }});
  const result = await client.querySingle('worker_connections 65535;',{context:'events',release:old.release_id});
  assert.equal(result.release_id,old.release_id);
  assert.equal(result.detail.verification,oldEntry.verification);
  assert.ok(requests.every(path=>path.startsWith(`releases/${old.release_id}/`)));
});
