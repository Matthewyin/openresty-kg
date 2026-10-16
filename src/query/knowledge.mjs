import { parseSingle, matchDirective } from '../core/core.mjs';
import { validSource, validSourceCoverage, sourceDescription } from '../core/source.mjs';

export const STATUS_LABELS = {
  matched: '唯一匹配', ambiguous: '存在多个候选', context_required: '上下文尚未确定',
  unknown: '当前索引未收录', context_mismatch: '上下文没有匹配项', module_mismatch: '模块没有匹配项',
  context_conflict: '提供的上下文与配置层级冲突', invalid_input: '输入不符合查询要求',
  invalid_index: '知识索引格式错误', empty_input: '请输入配置项', parse_error: '配置解析失败',
  out_of_scope: '超出单项查询范围', knowledge_unavailable: '知识暂不可用',
  block_entry: '块内项，不参与指令匹配'
};
export const VERIFICATION_LABELS = { registration_only: '仅注册信息', basic_verified: '基础内容已核对', deep_verified: '深度内容已核对' };
export const isSafeId = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value) && value !== '.' && value !== '..';
const fail = (code, message) => Object.assign(new Error(message), { code });
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const strings = value => Array.isArray(value) && value.every(item => typeof item === 'string');
const nullableText = value => value === null || typeof value === 'string';
const text = value => typeof value === 'string' && value.trim().length > 0;
export const FACT_STATUS_LABELS = { verified: '已核实', unverified: '未核实', not_applicable: '不适用' };
export const PATCH_STATUS_LABELS = { verified_affected: '已核对补丁影响', verified_unaffected: '所列事实未受补丁影响', unverified: '补丁影响未核实', not_applicable: '不属于发行补丁处理范围' };
export const RUNTIME_SCOPE_NOTE = '仅按固定源码与文档核对下述范围；未编译或运行 OpenResty，不代表现场请求已通过验证。';
export const BASIC_SCOPE_NOTE = '基础核对覆盖功能说明、语法、上下文和配置入口，不表示默认值、继承及适用条件均已核实；以各字段状态和证据为准。';
export const DEEP_SCOPE_NOTE = '深度核对仅覆盖下方明确列出的运行范围，不代表全部场景。';
export const NO_RUNTIME_NOTE = '本条未提供独立运行时链；配置组织类条目不据此判为未完成，具体范围见功能与配置入口。';
export const AVAILABILITY_SCOPE_NOTE = '源码中的编译条件和依赖说明请按所列证据理解；未核实状态不等于不可用。现场版本、模块启用和运行兼容性未验证，与源码知识核对分开判断。';

export function validateRuntime(detail) {
  const runtime = detail.runtime;
  if (runtime === undefined) return false;
  const sources = new Map(detail.sources.map(source => [source.id, source]));
  const refs = value => strings(value) && new Set(value).size === value.length && value.every(id => sources.has(id));
  if (!object(runtime) || !['verified', 'unverified'].includes(runtime.status) || !text(runtime.text)
    || !Array.isArray(runtime.steps) || !refs(runtime.source_ids) || !refs(runtime.corroboration_source_ids)
    || runtime.steps.some(step => !object(step) || !text(step.condition) || !text(step.action) || !refs(step.source_ids))) {
    throw fail('invalid_detail', '运行时内容或证据引用无效');
  }
  if (runtime.status !== 'verified') return false;
  const configurationSources = ['registration', 'configuration-definition', 'distribution-version'].map(id => sources.get(id)).filter(Boolean);
  const codeSource = id => {
    const source = sources.get(id);
    return /\.(?:c|h|patch)$/.test(source.file) && !configurationSources.some(config => source.component === config.component
      && source.revision === config.revision && source.file === config.file && source.start_line >= config.start_line && source.end_line <= config.end_line);
  };
  const documentSource = id => /\.(?:xml|md|rst|txt)$/.test(sources.get(id).file);
  if (!runtime.steps.length || !runtime.source_ids.length || !runtime.corroboration_source_ids.length
    || runtime.steps.some(step => !step.source_ids.length || !step.source_ids.some(codeSource) || step.source_ids.some(id => !runtime.source_ids.includes(id)))
    || !runtime.corroboration_source_ids.every(documentSource)
    || runtime.corroboration_source_ids.some(id => runtime.source_ids.includes(id))
    || runtime.source_ids.some(id => !codeSource(id))
    || runtime.source_ids.some(id => !runtime.steps.some(step => step.source_ids.includes(id)))
    || !text(detail.summary) || !text(detail.syntax) || !detail.contexts_verified
    || !text(detail.configuration_entry?.symbol) || !sources.has('registration') || !sources.has('configuration-definition')
    || !detail.configuration_entry.source_ids.includes('configuration-definition')
    || [detail.defaults, detail.inheritance].some(fact => !['verified', 'not_applicable'].includes(fact.status) || !text(fact.text) || !refs(fact.source_ids) || !fact.source_ids.length)
    || detail.patch_status.status === 'unverified' || !detail.patch_status.source_ids.length
    || runtime.source_ids.some(id => !detail.patch_status.source_ids.includes(id))) {
    throw fail('invalid_detail', '已核实运行时缺少基础事实、步骤源码、独立文档或补丁核对证据');
  }
  return true;
}

export function deriveVerification(detail) {
  const basic = text(detail.summary) && text(detail.syntax) && detail.contexts_verified
    && detail.sources.some(source => source.id === 'configuration-definition') && detail.patch_status.status !== 'unverified';
  return validateRuntime(detail) ? 'deep_verified' : basic ? 'basic_verified' : 'registration_only';
}

function httpUrl(value) {
  if (typeof value !== 'string') return null;
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url : null; }
  catch { return null; }
}

export function formatFact(fact) {
  return [FACT_STATUS_LABELS[fact.status], fact.text, fact.note].filter(value => value != null && value !== '').join('；');
}

function validateSources(sources, code) {
  if (!Array.isArray(sources)) throw fail(code, '源码引用列表无效');
  const ids = new Set();
  for (const source of sources) {
    if (!object(source) || !text(source.id) || ids.has(source.id) || typeof source.revision !== 'string' || !/^[a-f0-9]{40}$/.test(source.revision) || !text(source.component) || !text(source.version) ||
      !text(source.file) || source.file.startsWith('/') || source.file.includes('\\') || source.file.split('/').some(part => !part || part === '.' || part === '..') || !Number.isInteger(source.start_line) || !Number.isInteger(source.end_line) || source.start_line < 1 || source.end_line < source.start_line ||
      typeof source.code !== 'string' || source.code.split('\n').length !== source.end_line - source.start_line + 1 || !['upstream', 'openresty_patch'].includes(source.kind) ||
      typeof source.url !== 'string') throw fail(code, '源码引用格式或范围不一致');
    const url = httpUrl(source.url);
    if (!url || url.protocol !== 'https:' || url.hostname !== 'github.com'
      || !url.pathname.endsWith(`/blob/${source.revision}/${source.file}`)
      || url.hash !== `#L${source.start_line}-L${source.end_line}`) throw fail(code, '源码引用格式或范围不一致');
    ids.add(source.id);
  }
  return ids;
}

export function validateIndex(index) {
  if (!object(index) || ![1, 2].includes(index.schema_version)) throw fail('unsupported_schema', '知识索引格式版本不支持');
  if (!isSafeId(index.release_id) || typeof index.openresty_version !== 'string' || !object(index.coverage) || !Array.isArray(index.directives)
    || typeof index.coverage.inventory_complete !== 'boolean' || !strings(index.coverage.gaps)
    || ['registration_count', 'basic_verified_count', 'deep_verified_count'].some(field => !Number.isInteger(index.coverage[field]) || index.coverage[field] < 0)) throw fail('invalid_json', '知识索引字段不完整');
  const ids = new Set();
  for (const entry of index.directives) {
    if (!object(entry) || !isSafeId(entry.id) || ids.has(entry.id) || typeof entry.name !== 'string' || typeof entry.module !== 'string' || typeof entry.component !== 'string' ||
      !strings(entry.contexts) || !strings(entry.phases) || typeof entry.contexts_verified !== 'boolean' || !Object.hasOwn(VERIFICATION_LABELS, entry.verification) ||
      entry.detail_path !== `releases/${index.release_id}/directives/${entry.id}.json`) throw fail('invalid_json', '知识索引条目或路径无效');
    ids.add(entry.id);
  }
  if (index.coverage.registration_count !== index.directives.length
    || index.coverage.basic_verified_count !== index.directives.filter(entry => entry.verification !== 'registration_only').length
    || index.coverage.deep_verified_count !== index.directives.filter(entry => entry.verification === 'deep_verified').length) throw fail('invalid_json', '知识索引覆盖计数不一致');
  if (index.references_path !== undefined && index.references_path !== `releases/${index.release_id}/references.json`) throw fail('invalid_json', '参考库路径不属于当前发布');
  if (!validSourceCoverage(index)) throw fail('invalid_json', '知识来源或分组覆盖计数不一致');
  return index;
}

export function relatedCandidates(name, index) {
  validateIndex(index);
  return index.directives.filter(entry => entry.name === name).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

export function validateReferences(publication, index) {
  validateIndex(index);
  if (!object(publication) || publication.schema_version !== index.schema_version) throw fail('unsupported_schema', '参考库格式版本不支持');
  if (publication.release_id !== index.release_id || publication.openresty_version !== index.openresty_version) throw fail('release_mismatch', '参考库与指令索引发布版本不一致');
  if (!Array.isArray(publication.references)) throw fail('invalid_references', '参考库条目列表无效');
  const ids = new Set();
  for (const reference of publication.references) {
    if (!object(reference) || !isSafeId(reference.id) || ids.has(reference.id) || !['lua_api', 'variable'].includes(reference.kind)
      || !text(reference.name) || !text(reference.component) || typeof reference.summary !== 'string' || !strings(reference.limitations)
      || !['reference_verified', 'unverified'].includes(reference.verification)) throw fail('invalid_references', '参考条目字段无效');
    validateSources(reference.sources, 'invalid_references');
    if (reference.verification === 'reference_verified' && (!text(reference.summary) || !reference.sources.length)) throw fail('invalid_references', '已核对参考说明缺少正文或源码证据');
    ids.add(reference.id);
  }
  return publication;
}

export function validateDetail(detail, entry, index) {
  if (!object(detail) || detail.schema_version !== index.schema_version || ![1, 2].includes(detail.schema_version)) throw fail('unsupported_schema', '知识详情格式版本不支持');
  if (detail.release_id !== index.release_id || detail.openresty_version !== index.openresty_version) throw fail('release_mismatch', '知识详情与索引发布版本不一致');
  for (const field of ['id', 'name', 'module', 'component', 'verification', 'contexts_verified']) if (detail[field] !== entry[field]) throw fail('invalid_detail', '知识详情身份与索引不一致');
  if (index.schema_version === 2 && (!validSource(detail.source) || JSON.stringify(detail.source) !== JSON.stringify(entry.source))) throw fail('invalid_detail', '知识详情来源与索引不一致');
  if (index.schema_version === 1 && (entry.source !== undefined && (!validSource(entry.source) || entry.source.kind !== 'bundled')
    || detail.source !== undefined && (!validSource(detail.source) || detail.source.kind !== 'bundled'))) throw fail('invalid_detail', '历史发行契约不能携带部门扩展');
  if (!strings(detail.contexts) || JSON.stringify(detail.contexts) !== JSON.stringify(entry.contexts)
    || JSON.stringify(detail.phases) !== JSON.stringify(entry.phases) || !Array.isArray(detail.sources) || !detail.sources.length || !Array.isArray(detail.limitations) ||
    !object(detail.defaults) || !object(detail.inheritance) || !object(detail.availability) || !object(detail.patch_status) || !object(detail.configuration_entry) ||
    !strings(detail.verification_notes) || !Array.isArray(detail.documentation) || !strings(detail.phases) ||
    !nullableText(detail.summary) || !nullableText(detail.syntax)
    || (detail.mechanism !== undefined && !nullableText(detail.mechanism))
    || (detail.related !== undefined && !strings(detail.related))) throw fail('invalid_detail', '知识详情字段不完整');
  const availability = detail.availability;
  if (!strings(availability.compile_guards) || !strings(availability.dependencies)
    || ![true, false, null].includes(availability.deprecated) || !['verified', 'unverified'].includes(availability.status)) throw fail('invalid_detail', '适用条件字段无效');
  if (!Object.hasOwn(PATCH_STATUS_LABELS, detail.patch_status.status) || !text(detail.patch_status.note)
    || !nullableText(detail.configuration_entry.symbol)) throw fail('invalid_detail', '补丁状态或配置入口字段无效');
  for (const doc of detail.documentation) if (!object(doc) || !text(doc.title) || !httpUrl(doc.url)
    || !['verified', 'unverified'].includes(doc.status)) throw fail('invalid_detail', '文档依据字段无效');
  const ids = validateSources(detail.sources, 'invalid_detail');
  if (detail.patch_status.status === 'not_applicable' && (index.schema_version !== 2 || detail.source.kind !== 'department_extension')) throw fail('invalid_detail', '发行条目不能绕过补丁校验');
  if (detail.source?.kind === 'department_extension' && (detail.patch_status.status !== 'not_applicable'
    || !detail.sources.some(source => source.component === detail.component && source.revision === detail.source.revision && source.version === detail.source.version
      && source.url.startsWith(`${detail.source.repository}/blob/`))
    || detail.sources.some(source => source.component === detail.component && (source.revision !== detail.source.revision || source.version !== detail.source.version
      || !source.url.startsWith(`${detail.source.repository}/blob/`))))) throw fail('invalid_detail', '扩展来源与固定证据不一致');
  for (const fact of [detail.defaults, detail.inheritance, ...detail.limitations, detail.configuration_entry, detail.patch_status]) {
    if (!object(fact) || !strings(fact.source_ids) || fact.source_ids.some(id => !ids.has(id))) throw fail('invalid_detail', '知识证据引用缺失');
  }
  for (const fact of [detail.defaults, detail.inheritance]) if (!Object.hasOwn(FACT_STATUS_LABELS, fact.status) || !nullableText(fact.text)
    || (fact.status === 'verified' && !text(fact.text)) || (fact.note !== undefined && typeof fact.note !== 'string')) throw fail('invalid_detail', '知识事实状态无效');
  for (const limitation of detail.limitations) if (typeof limitation.text !== 'string' || !['verified', 'unverified'].includes(limitation.status)) throw fail('invalid_detail', '限制说明状态无效');
  if (detail.patch_status.status === 'verified_affected' && !detail.patch_status.source_ids.some(id => detail.sources.some(source => source.id === id && source.kind === 'openresty_patch'))) throw fail('invalid_detail', '已核对补丁影响缺少补丁片段');
  for (const fact of [detail.defaults, detail.inheritance, ...detail.limitations]) if (fact.status === 'verified'
    && (!fact.source_ids.length || detail.patch_status.status === 'unverified')) throw fail('invalid_detail', '已核实事实缺少事实证据或已核对补丁状态');
  if ((detail.verification === 'deep_verified') !== validateRuntime(detail)) throw fail('invalid_detail', '深度核对状态与运行时证据不一致');
  return detail;
}

const isRelativeSiteBase = value => typeof value === 'string' && value.endsWith('/') && /^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(value);

export function detailUrl(siteBase, index, entry) {
  if (isRelativeSiteBase(siteBase)) return `${siteBase}index.html?${new URLSearchParams({ release: index.release_id, id: entry.id })}`;
  const url = new URL('index.html', siteBase);
  url.searchParams.set('release', index.release_id);
  url.searchParams.set('id', entry.id);
  return url.href;
}

export function renderMarkdown(result) {
  const rows = [`## ${STATUS_LABELS[result.status] ?? result.status}`];
  if (result.release_id) rows.push(`知识发布：${result.release_id}`);
  if (result.errors.length) rows.push(...result.errors.map(error => `- ${error.message}${error.line ? `（${error.line}:${error.column}）` : ''}`));
  const detail = result.detail;
  if (!detail) {
    if (result.match?.candidates.length) rows.push('候选项（需明确模块或上下文，不代表配置有效）：', ...result.match.candidates.map(entry => `- ${entry.name} · ${entry.module} · ${entry.contexts.join('、')} · ${sourceDescription(entry)}`));
    return rows.join('\n\n');
  }
  rows.push(`### ${detail.name}`, `模块：${detail.module}；知识站发行基线：OpenResty ${detail.openresty_version}；${VERIFICATION_LABELS[detail.verification]}`, `来源：${sourceDescription(detail)}`);
  if (detail.verification !== 'registration_only') rows.push(BASIC_SCOPE_NOTE);
  if (detail.verification === 'deep_verified') rows.push(DEEP_SCOPE_NOTE);
  if (result.status === 'context_required') rows.push('以下为该知识条目的预览；输入上下文尚未确定，不能据此判断配置适用性。');
  if (detail.verification === 'registration_only') rows.push('当前仅计为注册信息，尚未完成基础功能覆盖；若下方有研究说明，也不代表已核实 OpenResty 补丁后的完整行为。');
  if (detail.syntax) rows.push('语法：' + detail.syntax);
  rows.push(detail.summary ?? '功能说明尚未核实。');
  rows.push('适用 context：' + (detail.contexts_verified ? detail.contexts.join('、') : '映射尚未核实'));
  rows.push(`默认值：${formatFact(detail.defaults)}`, `继承行为：${formatFact(detail.inheritance)}`);
  rows.push('相关阶段：' + (detail.phases.join('、') || '尚未记录'));
  if (detail.limitations.length) rows.push('#### 已记录的限制', ...detail.limitations.map(item => `- [${FACT_STATUS_LABELS[item.status]}] ${item.text}`));
  else rows.push('尚未记录限制，不等于没有限制。');
  if (detail.mechanism) rows.push('#### 配置实现链路（核实范围见条目说明）', detail.mechanism);
  if (detail.runtime) {
    rows.push(`#### 运行时链路（${FACT_STATUS_LABELS[detail.runtime.status]}）`, detail.runtime.text, RUNTIME_SCOPE_NOTE);
    const links = ids => ids.map(id => { const source = detail.sources.find(source => source.id === id); return `[${source.file}:${source.start_line}–${source.end_line}](${source.url})`; }).join('、');
    detail.runtime.steps.forEach((step, i) => rows.push(`${i + 1}. 条件：${step.condition}\n\n   ${step.action}\n\n   依据：${links(step.source_ids)}`));
    rows.push('交叉印证：' + (links(detail.runtime.corroboration_source_ids) || '尚未记录'));
  } else rows.push('运行时链路：' + NO_RUNTIME_NOTE);
  rows.push('#### 配置解析入口', detail.configuration_entry.symbol ?? '未核实');
  if (detail.availability.compile_guards.length) rows.push('条件编译：' + detail.availability.compile_guards.join('；'));
  rows.push('适用条件核实状态：' + FACT_STATUS_LABELS[detail.availability.status]);
  rows.push(AVAILABILITY_SCOPE_NOTE);
  rows.push('模块依赖：' + (detail.availability.dependencies.length ? detail.availability.dependencies.join('；') : '尚未记录，不等于无需依赖'));
  rows.push('废弃状态：' + (detail.availability.deprecated === null ? '未核实' : detail.availability.deprecated ? '已废弃' : '未标记废弃'));
  rows.push(`补丁状态：${PATCH_STATUS_LABELS[detail.patch_status.status]}`, detail.patch_status.note, ...detail.verification_notes);
  rows.push('#### 源码与文档依据', ...detail.sources.map(source => `- [${source.component} ${source.version} · ${source.file}:${source.start_line}–${source.end_line}](${source.url})（revision ${source.revision}）`));
  if (detail.documentation.length) rows.push(...detail.documentation.map(doc => `- [${FACT_STATUS_LABELS[doc.status]}] [${doc.title}](${doc.url})`));
  else rows.push('文档依据尚未记录。');
  if (result.detail_url) rows.push(`[打开网站详情](${result.detail_url})`);
  return rows.join('\n\n');
}

export function createKnowledgeClient({ knowledgeBase, siteBase, fetcher = globalThis.fetch, timeoutMs }) {
  const base = new URL(knowledgeBase);
  const site = isRelativeSiteBase(siteBase) ? siteBase : new URL(siteBase);
  if (!['http:', 'https:'].includes(base.protocol) || (typeof site !== 'string' && !['http:', 'https:'].includes(site.protocol)) || !Number.isFinite(timeoutMs) || timeoutMs <= 0) throw fail('invalid_input', '知识站地址或超时配置无效');
  async function get(path) {
    let response;
    try { response = await fetcher(new URL(path, base), { method: 'GET', redirect: 'error', signal: AbortSignal.timeout(timeoutMs) }); }
    catch { throw fail('fetch_failed', '无法读取知识文件，请检查站点连接'); }
    if (!response.ok) throw fail(response.status === 404 ? 'missing_detail' : 'fetch_failed', '知识文件不可用');
    try { return await response.json(); } catch { throw fail('invalid_json', '知识文件不是有效 JSON'); }
  }
  async function loadIndex(release = null) {
    if (release !== null && !isSafeId(release)) throw fail('invalid_input', '知识发布标识无效');
    const index = validateIndex(await get(release ? `releases/${release}/index.json` : 'index.json'));
    if (release && release !== index.release_id) throw fail('release_mismatch', '所请求的知识发布不存在或不一致');
    return index;
  }
  async function getDetail(entry, index) {
    validateIndex(index);
    if (!index.directives.some(candidate => candidate.id === entry.id && candidate.detail_path === entry.detail_path)) throw fail('invalid_detail', '知识条目不属于当前索引');
    return validateDetail(await get(entry.detail_path), entry, index);
  }
  async function loadReferences(index) {
    try {
      validateIndex(index);
      if (index.references_path === undefined) return { status: 'not_provided', references: null, errors: [] };
      const publication = validateReferences(await get(index.references_path), index);
      return { status: 'ok', references: publication, errors: [] };
    } catch (error) {
      return { status: 'knowledge_unavailable', references: null,
        errors: [{ code: error.code ?? 'invalid_references', message: error.code ? error.message : '参考库数据无效', line: 0, column: 0, offset: 0 }] };
    }
  }
  async function querySingle(input, options = {}) {
    const result = { status: '', schema_version: 1, release_id: null, match: null, detail: null, markdown: '', detail_url: null, errors: [] };
    const single = parseSingle(input);
    if (single.status !== 'ok') { result.status = single.status; result.errors = single.errors; result.markdown = renderMarkdown(result); return result; }
    try {
      const index = await loadIndex(options.release ?? null);
      result.schema_version = index.schema_version;
      result.release_id = index.release_id;
      result.match = matchDirective(single.directive, index, options);
      result.status = result.match.status;
      if (result.status === 'matched' || (result.status === 'context_required' && result.match.candidates.length === 1)) {
        const entry = result.match.candidates[0];
        result.detail = await getDetail(entry, index);
        result.detail_url = detailUrl(site, index, entry);
      }
      result.markdown = renderMarkdown(result);
    } catch (error) {
      result.status = 'knowledge_unavailable'; result.detail = null; result.detail_url = null;
      result.errors = [{ code: error.code ?? 'invalid_detail', message: error.code ? error.message : '知识文件字段或展示数据无效', line: 0, column: 0, offset: 0 }];
      result.markdown = renderMarkdown(result);
    }
    return result;
  }
  return { loadIndex, getDetail, querySingle, loadReferences, detailUrl: (index, entry) => detailUrl(site, index, entry) };
}
