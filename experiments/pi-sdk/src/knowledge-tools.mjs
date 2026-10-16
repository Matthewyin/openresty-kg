import { readFile, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { Type } from '@earendil-works/pi-ai';
import { parseConfig, parseSingle } from '../../../src/core/parser.mjs';
import { matchDirective } from '../../../src/core/matcher.mjs';
import { summarizeConfig, needsOuterContext, needsAttention } from '../../../src/query/config-results.mjs';
import { createKnowledgeClient, validateIndex, isSafeId } from '../../../src/query/knowledge.mjs';

export const TOOL_NAMES = ['analyze_config', 'query_knowledge'];
export const digest = value => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
export function within(base, path) {
  const part = relative(base, path);
  return part === '' || (!part.startsWith('..') && !isAbsolute(part));
}

export async function loadSnapshot(config, release, previous) {
  if (release !== undefined && !isSafeId(release)) throw new Error('知识发布标识无效');
  const dist = await realpath(config.distDir);
  const siteConfig = JSON.parse(await readFile(resolve(dist, 'site-config.json'), 'utf8'));
  const root = await realpath(resolve(dist, siteConfig.knowledge_base));
  if (!within(dist, root)) throw new Error('知识目录越界');
  const files = new Map();
  const read = async path => {
    const target = await realpath(resolve(root, path));
    if (!within(root, target)) throw new Error('知识文件越界');
    const text = await readFile(target, 'utf8');
    files.set(path, text);
    return text;
  };
  const currentText = await read('index.json');
  const currentIndex = validateIndex(JSON.parse(currentText));
  const selectedRelease = release ?? currentIndex.release_id;
  const pinnedText = await read(`releases/${selectedRelease}/index.json`);
  const index = validateIndex(JSON.parse(pinnedText));
  if (index.release_id !== selectedRelease) throw new Error('所请求的知识发布不存在或不一致');
  if (selectedRelease === currentIndex.release_id && JSON.stringify(currentIndex) !== JSON.stringify(index)) throw new Error('当前索引与发布索引不一致');
  // 固定历史发布只绑定自身内容，不因当前发布指针移动而换版。
  if (selectedRelease !== currentIndex.release_id) files.set('index.json', pinnedText);
  const base = new URL(config.knowledgeBase);
  let documents;
  const fetcher = async url => {
    const requested = new URL(url);
    if (requested.origin !== base.origin || requested.search || requested.hash || !requested.pathname.startsWith(base.pathname)) throw new Error('拒绝任意知识 URL');
    const path = decodeURIComponent(requested.pathname.slice(base.pathname.length));
    if (!files.has(path)) throw new Error('文件不在当前知识快照');
    return { ok: true, json: async () => documents ? documents.get(path) : JSON.parse(files.get(path)) };
  };
  // 先按固定发布列举文件，再交原客户端校验索引和详情。
  const releasePath = `releases/${index.release_id}`;
  const detailDir = await realpath(resolve(root, releasePath, 'directives'));
  if (!within(root, detailDir)) throw new Error('详情目录越界');
  await Promise.all(index.directives.map(entry => read(entry.detail_path)));
  if (index.references_path) await read(index.references_path);
  const hash = digest([...files].sort(([a], [b]) => a.localeCompare(b)));
  if (previous?.hash === hash && previous.root === root) return { ...previous, filesRead: files.size };
  documents = new Map([...files].map(([path, text]) => [path, JSON.parse(text)]));
  const client = createKnowledgeClient({ knowledgeBase: base.href, siteBase: config.siteBase, fetcher, timeoutMs: config.timeoutMs });
  await client.loadIndex();
  await client.loadIndex(index.release_id);
  return { index, client, fetcher, hash, root, filesRead: files.size, validatedDetails: new Map() };
}

export function analyze(snapshot, request) {
  const single = request.mode === 'single' ? parseSingle(request.input) : null;
  const parsed = single ? { directives: single.directive ? [single.directive] : [], errors: single.errors } : parseConfig(request.input, { mode: request.mode });
  const matches = parsed.directives.map(item => matchDirective(item, snapshot.index, { context: request.context || null, module: request.module || null }));
  return {
    parsed, matches, ...(single ? { singleStatus: single.status } : {}), summary: summarizeConfig(parsed, matches), needsOuterContext: needsOuterContext(parsed),
    attention: parsed.directives.map((item, i) => needsAttention(item, matches[i])),
    questions: matches.flatMap((match, i) => ['context_required', 'ambiguous'].includes(match.status) ? [`第 ${parsed.directives[i].line} 行 ${parsed.directives[i].name}：请补充上下文或模块。`] : []),
  };
}

export const FIELDS = ['summary', 'syntax', 'defaults', 'inheritance', 'limitations', 'runtime'];
export function fieldInfo(detail, field) {
  const raw = detail[field];
  const facts = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const status = Array.isArray(raw) ? (raw.length && raw.every(item => item.status === 'verified') ? 'verified' : 'unverified') : typeof raw === 'string' ? 'unverified' : raw?.status ?? 'unverified';
  return { status, source_ids: [...new Set(facts.flatMap(fact => [...(fact.source_ids ?? []), ...(fact.corroboration_source_ids ?? [])]))] };
}
export const fieldText = raw => typeof raw === 'string' ? raw : Array.isArray(raw) ? raw.map(item => `[${item.status}] ${item.text}`).join('\n') : raw?.text ?? null;

export function knowledgeTools(snapshot, current, audit) {
  const details = new Map();
  const analysis = analyze(snapshot, current());
  let manifest;
  const compactEntry = entry => {
    const detail = details.get(entry.id);
    return { entryId: entry.id, name: entry.name, module: entry.module, contexts: entry.contexts,
      fields: Object.fromEntries(FIELDS.filter(field => detail[field] != null).map(field => [field, fieldInfo(detail, field)])) };
  };
  const result = value => ({ content: [{ type: 'text', text: JSON.stringify(value) }], details: value });
  const check = signal => signal?.throwIfAborted();
  const tools = [
    {
      name: TOOL_NAMES[0], label: '查询配置摘要', description: '只读返回宿主已解析的当前配置摘要与候选身份。不接收配置，不重新解析。通常无需调用。',
      parameters: Type.Object({}, { additionalProperties: false }),
      execute: async (_id, args, signal) => {
        check(signal);
        if (Object.keys(args).length) throw new Error('工具不得改变当前请求');
        if (!manifest) throw new Error('宿主尚未完成预加载');
        check(signal);
        audit.push({ tool: TOOL_NAMES[0], status: 'ok' });
        return result({ summary: analysis.summary, matches: manifest.matches, questions: analysis.questions });
      },
    },
    {
      name: TOOL_NAMES[1], label: '查询固定版本字段摘要', description: '只读查询当前候选的字段短摘要与证据ID，不返回完整详情或源码。可用 entryIds 批量查询，fields 可省略。不能改变发布或候选范围。',
      parameters: Type.Object({ entryId: Type.Optional(Type.String()), entryIds: Type.Optional(Type.Array(Type.String(), { minItems: 1, maxItems: 32 })), fields: Type.Optional(Type.Array(Type.Union(FIELDS.map(field => Type.Literal(field))), { minItems: 1 })) }, { additionalProperties: false }),
      execute: async (_id, args, signal) => {
        check(signal);
        if (!manifest || Object.keys(args).some(key => !['entryId', 'entryIds', 'fields'].includes(key)) || Boolean(args.entryId) === Boolean(args.entryIds)) throw new Error('查询参数无效');
        const ids = args.entryId ? [args.entryId] : args.entryIds;
        if (!Array.isArray(ids) || !ids.length || ids.length > 32 || ids.some(id => !details.has(id))) throw new Error('条目不属于当前请求候选');
        const fields = args.fields ?? FIELDS;
        if (!Array.isArray(fields) || !fields.length || fields.some(field => !FIELDS.includes(field))) throw new Error('事实字段无效');
        const value = { entries: ids.map(entryId => {
          const detail = details.get(entryId);
          return { entryId, fields: Object.fromEntries(fields.filter(field => detail[field] != null).map(field => {
            const raw = detail[field];
            return [field, { ...fieldInfo(detail, field), preview: (fieldText(raw) ?? '').slice(0, 160) }];
          })) };
        }) };
        check(signal);
        audit.push({ tool: TOOL_NAMES[1], status: 'ok', entryIds: ids });
        return result(value);
      },
    },
  ];
  return { tools, details, analysis, get manifest() { return manifest; }, async prepare() {
    const candidates = [...new Map(analysis.matches.flatMap(match => match.candidates).map(entry => [entry.id, entry])).values()];
    await Promise.all(candidates.map(async entry => {
      let detail = snapshot.validatedDetails.get(entry.id);
      if (!detail) { detail = await snapshot.client.getDetail(entry, snapshot.index); snapshot.validatedDetails.set(entry.id, detail); }
      details.set(entry.id, detail);
    }));
    manifest = { release: snapshot.index.release_id, digest: snapshot.hash, summary: analysis.summary,
      matches: analysis.matches.map((match, i) => ({ line: analysis.parsed.directives[i].line, name: analysis.parsed.directives[i].name, kind: analysis.parsed.directives[i].kind, status: match.status, selected_id: match.selected_id, entryIds: match.candidates.map(entry => entry.id) })),
      questions: analysis.questions, errors: analysis.parsed.errors.map(error => ({ code: error.code, line: error.line, message: error.message })), candidates: candidates.map(compactEntry) };
    return manifest;
  } };
}
