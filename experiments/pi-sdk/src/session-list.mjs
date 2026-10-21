import { readdir, lstat, readFile } from 'node:fs/promises';
import { join } from 'node:path';

// 历史会话列表：直接从 metadata/<id>.json 汇总，不新增索引文件，也不修改任何文件（包括 mtime）。

// 列表上限与读取上限：先按 mtime 取最近 200 个文件再读内容，保证单次列表的 IO 有界。
export const LIST_LIMIT = 50;
export const LIST_SCAN_LIMIT = 200;
export const TITLE_MAX_CODEPOINTS = 30;
export const UNTITLED = '未命名会话';
// 严格的 uuid.json 文件名；宽松的 36 位十六进制/连字符不算合法（与列表接口约定一致）。
const META_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.json$/;
// 纯指令名：与前端一致，字母或下划线开头，其后字母数字下划线。
const DIRECTIVE_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
// 控制字符（C0、DEL、C1）、行/段分隔符与零宽/双向控制字符（可用于伪装标题），不允许进入标题。
const CONTROL = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069\ufeff]/g;

// 标题计算规则（写入与读时回退共用，保证两条路径结果一致）：
// 1. currentSubject.input 去首尾空白后是纯指令名 -> 用它；
// 2. 否则取用户消息（统一入口 message，旧入口 input）第一个非空行 trim 后前 30 个码点；
// 3. 都没有 -> “未命名会话”。
// secrets 为模型 Key/联网 Key：先在整行上替换再截断，避免截断后留下密钥片段。
export function sessionTitle(currentSubject, request, secrets = []) {
  const clean = text => {
    let value = String(text);
    for (const secret of secrets.flat().filter(Boolean)) value = value.replaceAll(secret, '[已隐藏]');
    return value.replace(CONTROL, '').trim();
  };
  const subjectInput = typeof currentSubject?.input === 'string' ? currentSubject.input.trim() : '';
  if (DIRECTIVE_NAME.test(subjectInput)) return clean(subjectInput) || UNTITLED;
  const text = typeof request?.message === 'string' ? request.message : typeof request?.input === 'string' ? request.input : '';
  const line = text.split(/\r\n|\r|\n/).map(item => item.trim()).find(Boolean);
  if (!line) return UNTITLED;
  // Array.from 按码点切分，不会把代理对（emoji 等）截成半个字符。
  const title = Array.from(clean(line)).slice(0, TITLE_MAX_CODEPOINTS).join('').trim();
  return title || UNTITLED;
}

// 读取会话列表。返回 [{ id, title, updatedAt }]，按 updatedAt 倒序，最多 50 条。
// 损坏 JSON、非法文件名、符号链接/非普通文件、读取中被删除的文件一律跳过，不抛错。
export async function listSessions(config, secrets = [], now = Date.now()) {
  const dir = join(config.stateDir, 'metadata');
  let names;
  try { names = await readdir(dir); } catch { return []; }
  const files = [];
  for (const name of names) {
    if (!META_NAME.test(name)) continue;
    try {
      const stat = await lstat(join(dir, name));
      // lstat 不跟随符号链接：符号链接、目录等都不是普通文件。
      if (!stat.isFile()) continue;
      files.push({ id: name.slice(0, -5), path: join(dir, name), mtimeMs: stat.mtimeMs });
    } catch { /* 文件在扫描期间被删除，跳过 */ }
  }
  // mtime 倒序（相同时按 id 保证稳定），只取最近 200 个再读内容。
  files.sort((a, b) => b.mtimeMs - a.mtimeMs || (a.id < b.id ? -1 : 1));
  const sessions = [];
  for (const file of files.slice(0, LIST_SCAN_LIMIT)) {
    if (sessions.length >= LIST_LIMIT) break;
    // 与 restore 的过期口径一致：启用保留期限且 mtime 距今 >= sessionTtlMs 视为过期。
    if (config.retentionEnabled && now - file.mtimeMs >= config.sessionTtlMs) continue;
    let meta;
    try { meta = JSON.parse(await readFile(file.path, 'utf8')); } catch { continue; }
    if (!meta || typeof meta !== 'object' || Array.isArray(meta)) continue;
    // 新 metadata 自带 title；仍重新清洗（控制字符、截断、密钥），不信任磁盘内容。旧 metadata 读时计算，不回写。
    const title = typeof meta.title === 'string'
      ? sessionTitle(null, { message: meta.title }, secrets)
      : sessionTitle(meta.currentSubject, meta.request, secrets);
    sessions.push({ id: file.id, title, updatedAt: file.mtimeMs });
  }
  return sessions;
}
