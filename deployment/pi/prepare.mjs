import { readFile, writeFile, mkdir, readdir, lstat } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { validateIndex, isSafeId } from '../../src/query/knowledge.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
// 禁止进入运行包的文件名（模型配置真实文件；.env 另由后缀与点前缀规则拒绝）。
export const forbiddenNames = new Set(['configuration.json']);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export async function prepare(destination, { releases = [] } = {}) {
  const target = resolve(destination);
  // 只建立新目录，避免覆盖已有发布或用户文件。
  await mkdir(target);
  const entries = {};
  async function copy(source, relative) {
    const stat = await lstat(source);
    if (stat.isSymbolicLink()) throw new Error('打包不接受符号链接');
    if (stat.isDirectory()) {
      for (const child of await readdir(source)) if (child !== '.DS_Store') await copy(join(source, child), `${relative}/${child}`);
      return;
    }
    if (!stat.isFile() || relative.split('/').some(part => part.startsWith('.'))) throw new Error('打包范围包含非公开文件');
    // 模型配置与密钥只能通过运行时挂载提供，任何情况下都不得进入运行包或镜像。
    if (forbiddenNames.has(relative.split('/').pop()) || relative.endsWith('.env')) throw new Error('打包范围包含模型配置或密钥文件');
    const bytes = await readFile(source);
    const output = join(target, relative);
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, bytes);
    entries[relative] = hash(bytes);
  }
  const index = validateIndex(JSON.parse(await readFile(join(root, 'dist/knowledge/index.json'), 'utf8')));
  if (!isSafeId(index.release_id)) throw new Error('发布标识不合法');
  // 使用当前页面源码与已构建的固定知识；不触碰原 dist 或不可变知识内容。
  await copy(join(root, 'site'), 'dist');
  await copy(join(root, 'src'), 'dist/src');
  await copy(join(root, 'dist/site-config.json'), 'dist/site-config.json');
  await copy(join(root, 'dist/knowledge/index.json'), 'dist/knowledge/index.json');
  const includedReleases = [...new Set([index.release_id, ...releases])];
  for (const release of includedReleases) {
    if (!isSafeId(release)) throw new Error('历史发布标识不合法');
    const selected = validateIndex(JSON.parse(await readFile(join(root, `dist/knowledge/releases/${release}/index.json`), 'utf8')));
    if (selected.release_id !== release) throw new Error('历史发布目录与索引不一致');
    await copy(join(root, `dist/knowledge/releases/${release}`), `dist/knowledge/releases/${release}`);
  }
  const pinned = JSON.parse(await readFile(join(target, `dist/knowledge/releases/${index.release_id}/index.json`), 'utf8'));
  if (JSON.stringify(index) !== JSON.stringify(pinned)) throw new Error('当前索引与发布不一致');
  await copy(join(root, 'src'), 'src');
  for (const name of ['package.json', 'package-lock.json', 'config.json', 'live.config.json', 'run.mjs', 'server.mjs', 'src']) {
    await copy(join(root, 'experiments/pi-sdk', name), `experiments/pi-sdk/${name}`);
  }
  await copy(fileURLToPath(new URL('./Dockerfile', import.meta.url)), 'Dockerfile');
  const dockerignore = await readFile(new URL('./.dockerignore', import.meta.url));
  await writeFile(join(target, '.dockerignore'), dockerignore);
  entries['.dockerignore'] = hash(dockerignore);
  const manifest = { release: index.release_id, includedReleases, entries };
  await writeFile(join(target, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify({ package: target, release: index.release_id, files: Object.keys(entries).length }));
  return manifest;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw new Error('需要指定不存在的打包目标目录');
  const extra = process.argv.slice(3);
  if (extra.length % 2 || extra.some((value, i) => i % 2 === 0 && value !== '--release')) throw new Error('历史发布使用 --release <id>');
  await prepare(process.argv[2], { releases: extra.filter((_, i) => i % 2 === 1) });
}
