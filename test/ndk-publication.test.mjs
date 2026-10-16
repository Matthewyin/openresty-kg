import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { validateDetail } from '../src/query/knowledge.mjs';

const root = resolve(import.meta.dirname, '..');
const config = JSON.parse(await readFile(resolve(root, 'project.config.json'), 'utf8'));
const knowledgeRoot = resolve(root, config.output_dir, 'knowledge');
const index = JSON.parse(await readFile(resolve(knowledgeRoot, 'releases/1.27.1.1-7e53dde6171ab67c/index.json'), 'utf8'));
const detailFor = async entry => JSON.parse(await readFile(resolve(knowledgeRoot, entry.detail_path), 'utf8'));

test('NDK 冻结发布保留四组件原文、owner/include 与局部宏说明', async () => {
  for (const [component, count] of [['ngx_devel_kit', 1], ['set-misc-nginx-module', 29], ['array-var-nginx-module', 4], ['form-input-nginx-module', 2]]) {
    const entries = index.directives.filter(entry => entry.component === component);
    assert.equal(entries.length, count);
    for (const entry of entries) {
      assert.equal(entry.verification, 'registration_only');
      const detail = validateDetail(await detailFor(entry), entry, index);
      assert.equal(detail.patch_status.status, 'unverified');
      assert.ok(detail.sources.some(source => source.id === 'module-owner'));
      assert.ok(detail.sources.some(source => source.id === 'registration-container'));
      const sourceConfig = config.sources.find(source => source.component === component);
      for (const source of detail.sources) {
        const fixed = execFileSync('git', ['-C', resolve(root, sourceConfig.path), 'show', `${source.revision}:${source.file}`], { encoding: 'utf8' }).replaceAll('\r\n', '\n');
        assert.equal(source.code, fixed.split('\n').slice(source.start_line - 1, source.end_line).join('\n'));
        assert.ok(source.url.includes(`/blob/${source.revision}/${source.file}#L${source.start_line}-L${source.end_line}`));
        assert.ok(!source.file.startsWith('examples/'));
      }
      if (component === 'ngx_devel_kit') {
        assert.equal(detail.name, 'upstream_list');
        assert.equal(detail.module, 'ndk_http_module');
        assert.equal(detail.sources[0].file, 'src/ndk_upstream_list.h');
        assert.deepEqual(detail.contexts, ['http', 'http.server']);
        assert.ok(detail.availability.compile_guards.includes('if (NDK_UPSTREAM_LIST)'));
        assert.ok(detail.verification_notes.some(note => note.includes('临时定义 NDK_UPSTREAM_LIST_CMDS=1') && note.includes('不是需要用户额外设置')));
        assert.ok(detail.sources.some(source => source.id === 'owner-include' && source.file === 'src/ndk.c'));
      }
    }
  }
  assert.equal(index.coverage.inventory_complete, false);
  assert.equal(index.coverage.basic_verified_count, 23);
  assert.equal(index.coverage.deep_verified_count, 0);
  const references = JSON.parse(await readFile(resolve(knowledgeRoot, index.references_path), 'utf8'));
  assert.equal(references.references.length, 8);
});

test('既有913项详情和8参考未被NDK接入改变，旧不可变发布仍完整', async () => {
  const previous = JSON.parse(await readFile(resolve(knowledgeRoot, 'releases/1.27.1.1-dee833a2c9381a27/index.json'), 'utf8'));
  const currentById = new Map(index.directives.map(entry => [entry.id, entry]));
  const payload = ({ release_id, ...detail }) => detail;
  assert.equal(previous.directives.length, 913);
  for (const entry of previous.directives) {
    const current = currentById.get(entry.id);
    assert.ok(current, entry.id);
    assert.deepEqual(payload(await detailFor(current)), payload(await detailFor(entry)), entry.id);
  }
  const oldReferences = JSON.parse(await readFile(resolve(knowledgeRoot, previous.references_path), 'utf8'));
  const newReferences = JSON.parse(await readFile(resolve(knowledgeRoot, index.references_path), 'utf8'));
  assert.deepEqual(oldReferences.references, newReferences.references);
});
