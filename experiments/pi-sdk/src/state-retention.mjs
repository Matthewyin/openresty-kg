import { readdir, lstat, readFile, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export async function stateBytes(root) {
  let bytes = 0;
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    const stat = await lstat(path);
    if (stat.isSymbolicLink()) throw new Error('状态目录禁止符号链接');
    bytes += stat.isDirectory() ? await stateBytes(path) : stat.size;
  }
  return bytes;
}

export async function pruneState(config, now = Date.now()) {
  const root = config.stateDir;
  const removed = { metadata: 0, sessions: 0, checkpoints: 0, cache: 0 };
  if (!config.retentionEnabled) return { removed, bytes: await stateBytes(root) };
  const retainedFiles = new Set();
  const retainedIds = new Set();
  const expiredFiles = new Set();
  const records = [];
  for (const name of await readdir(join(root, 'metadata'))) {
    if (!/^[0-9a-f-]{36}\.json$/.test(name)) continue;
    const path = join(root, 'metadata', name);
    const meta = JSON.parse(await readFile(path, 'utf8'));
    const stat = await lstat(path);
    const file = meta.file ? resolve(meta.file) : null;
    // 先验证整批引用，再删除；坏记录不能导致仍被使用的会话文件被误删。
    if (file && (!file.startsWith(resolve(root, 'sessions') + '/') || !file.endsWith('.jsonl'))) throw new Error('会话文件越界');
    records.push({ path, id: name.slice(0, -5), file, expired: now - stat.mtimeMs >= config.sessionTtlMs });
  }
  for (const record of records) {
    if (record.expired) { if (record.file) expiredFiles.add(record.file); }
    else { retainedIds.add(record.id); if (record.file) retainedFiles.add(record.file); }
  }
  for (const record of records.filter(record => record.expired)) { await unlink(record.path); removed.metadata++; }
  for (const dir of ['sessions', 'checkpoints', 'cache']) {
    for (const name of await readdir(join(root, dir))) {
      if (!(dir === 'cache' ? /^[a-f0-9]{64}\.json$/ : /^[a-zA-Z0-9_.-]+\.jsonl$/).test(name)) continue;
      const path = join(root, dir, name);
      if (dir === 'sessions' && retainedFiles.has(resolve(path))) continue;
      if (dir === 'checkpoints' && retainedIds.has(name.slice(0, -6))) continue;
      const stat = await lstat(path);
      const ttl = dir === 'cache' ? config.cacheTtlMs : config.sessionTtlMs;
      if (now - stat.mtimeMs >= ttl || (dir === 'sessions' && expiredFiles.has(resolve(path))) || (dir === 'checkpoints' && records.some(r => r.expired && r.id === name.slice(0, -6)))) {
        await unlink(path); removed[dir]++;
      }
    }
  }
  return { removed, bytes: await stateBytes(root) };
}
