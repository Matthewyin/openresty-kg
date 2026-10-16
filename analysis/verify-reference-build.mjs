import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp, symlink, rm, readdir, cp } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { build } from '../scripts/build.mjs';

const root = resolve(import.meta.dirname, '..');
const config = JSON.parse(await readFile(join(root, 'project.config.json'), 'utf8'));
const references = JSON.parse(await readFile(resolve(root, config.references_file), 'utf8'));
const taskDir = await mkdtemp(join(tmpdir(), 'knowledge-reference-gate-'));
try {
  const taskConfig = { ...config, main_repo: resolve(root, config.main_repo), knowledge_file: resolve(root, config.knowledge_file),
    references_file: 'references.json', analysis_dir: 'analysis', output_dir: 'dist' };
  await symlink(resolve(root, 'repos'), join(taskDir, 'repos'));
  for (const name of ['site', 'src']) await cp(resolve(root, name), join(taskDir, name), { recursive: true });
  await mkdir(join(taskDir, 'analysis/directives'), { recursive: true });
  for (const name of ['components.json', 'directives/catalog.json']) await writeFile(join(taskDir, 'analysis', name), await readFile(resolve(root, config.analysis_dir, name)));
  await writeFile(join(taskDir, 'project.config.json'), JSON.stringify(taskConfig));
  await mkdir(join(taskDir, 'dist/knowledge'), { recursive: true });
  const marker = '{"current":"must_remain_unchanged"}\n';
  await writeFile(join(taskDir, 'dist/knowledge/index.json'), marker);
  const broken = structuredClone(references); broken.at(-1).limitations = [null];
  await writeFile(join(taskDir, 'references.json'), JSON.stringify(broken));
  await assert.rejects(build(join(taskDir, 'project.config.json')), /参考条目字段/);
  assert.equal(await readFile(join(taskDir, 'dist/knowledge/index.json'), 'utf8'), marker);
  assert.deepEqual(await readdir(join(taskDir, 'dist/knowledge')), ['index.json']);
  await writeFile(join(taskDir, 'references.json'), JSON.stringify(references));
  await build(join(taskDir, 'project.config.json'));
  const first = JSON.parse(await readFile(join(taskDir, 'dist/knowledge/index.json'), 'utf8'));
  references[0].summary += ' 测试夹具：仅校验发布身份，不发布此内容。';
  await writeFile(join(taskDir, 'references.json'), JSON.stringify(references));
  await build(join(taskDir, 'project.config.json'));
  const second = JSON.parse(await readFile(join(taskDir, 'dist/knowledge/index.json'), 'utf8'));
  assert.notEqual(first.release_id, second.release_id);
  assert.deepEqual(first.coverage, second.coverage);
  const matrixPath = join(taskDir, 'analysis/components.json');
  const matrix = JSON.parse(await readFile(matrixPath, 'utf8'));
  // 仅在隔离夹具模拟范围缺口变化，不将此分类作为正式研究结论。
  matrix.components.find(component => component.inspection !== 'not_inspected').inspection = 'not_inspected';
  await writeFile(matrixPath, JSON.stringify(matrix));
  await build(join(taskDir, 'project.config.json'));
  const third = JSON.parse(await readFile(join(taskDir, 'dist/knowledge/index.json'), 'utf8'));
  assert.notEqual(second.release_id, third.release_id);
  assert.equal(third.coverage.registration_count, second.coverage.registration_count);
  assert.equal(third.coverage.basic_verified_count, second.coverage.basic_verified_count);
  assert.equal(third.coverage.gaps.length, second.coverage.gaps.length + 1);
  console.log(JSON.stringify({ bad_last_reference_rejected: true, current_unchanged: true, no_partial_release: true,
    reference_only_change_produces_new_release: true, coverage_unchanged: true, coverage_only_change_produces_new_release: true }));
} finally {
  // 仅清理本次创建的隔离目录，符号链接目标保留。
  await rm(taskDir, { recursive: true, force: true });
}
