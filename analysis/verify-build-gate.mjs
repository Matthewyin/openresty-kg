import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp, symlink, rm, readdir } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { build } from '../scripts/build.mjs';

const position = process.argv.indexOf('--config');
if (position < 0 || !process.argv[position + 1]) throw new Error('需要 --config');
const originalPath = resolve(process.argv[position + 1]);
const root = dirname(originalPath);
const config = JSON.parse(await readFile(originalPath, 'utf8'));
const catalog = JSON.parse(await readFile(resolve(root, config.analysis_dir, 'directives/catalog.json'), 'utf8'));
const knowledge = JSON.parse(await readFile(resolve(root, config.knowledge_file), 'utf8'));
const curated = new Set(knowledge.map(item => [item.component, item.module, item.name].join('--')));
const target = catalog.directives.findLast(item => curated.has([item.component, item.module, item.name].join('--')));
assert.ok(target, '需要一个已有知识的注册项');
const targetId = [target.component, target.module, target.name].join('--');
knowledge.find(item => [item.component, item.module, item.name].join('--') === targetId).availability = {
  dependencies: null, deprecated: null, status: 'unverified'
};
const taskDir = await mkdtemp(join(tmpdir(), 'knowledge-build-gate-'));
try {
  const taskConfig = { ...config, main_repo: resolve(root, config.main_repo), knowledge_file: 'directives.json',
    references_file: config.references_file ? resolve(root, config.references_file) : undefined,
    analysis_dir: 'analysis', output_dir: 'dist', sources: config.sources.map(source => ({ ...source, path: resolve(root, source.path) })) };
  for (const name of ['repos', 'site', 'src']) await symlink(resolve(root, name), join(taskDir, name));
  await mkdir(join(taskDir, 'analysis/directives'), { recursive: true });
  await writeFile(join(taskDir, 'analysis/components.json'), await readFile(resolve(root, config.analysis_dir, 'components.json')));
  await writeFile(join(taskDir, 'analysis/directives/catalog.json'), JSON.stringify(catalog));
  await writeFile(join(taskDir, 'directives.json'), JSON.stringify(knowledge));
  await writeFile(join(taskDir, 'project.config.json'), JSON.stringify(taskConfig));
  await mkdir(join(taskDir, 'dist/knowledge'), { recursive: true });
  const marker = '{"existing_current_index":"must_remain_unchanged"}\n';
  await writeFile(join(taskDir, 'dist/knowledge/index.json'), marker);
  await assert.rejects(build(join(taskDir, 'project.config.json')), error => error.message.includes(targetId) && error.message.includes('适用条件'));
  assert.equal(await readFile(join(taskDir, 'dist/knowledge/index.json'), 'utf8'), marker);
  assert.deepEqual(await readdir(join(taskDir, 'dist/knowledge')), ['index.json']);
  console.log(JSON.stringify({ rejected_id: targetId, current_index_unchanged: true, no_release_written: true }));
} finally {
  // 清理自己的隔离测试目录，不删除符号链接指向的用户源码。
  await rm(taskDir, { recursive: true, force: true });
}
