import { parseConfig, parseSingle, matchDirective } from './src/core/core.mjs';
import { createKnowledgeClient, relatedCandidates, STATUS_LABELS, VERIFICATION_LABELS, FACT_STATUS_LABELS, PATCH_STATUS_LABELS, formatFact, fieldEvidence, FIELD_PENDING_LABEL, FIELD_PENDING_NOTE, RUNTIME_SCOPE_NOTE, BASIC_SCOPE_NOTE, DEEP_SCOPE_NOTE, NO_RUNTIME_NOTE, AVAILABILITY_SCOPE_NOTE } from './src/query/knowledge.mjs';
import { SOURCE_LABELS, sourceDescription } from './src/core/source.mjs';
import { summarizeConfig, needsOuterContext, needsAttention } from './src/query/config-results.mjs';

const byId = id => document.getElementById(id);
const element = (tag, text, className) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; };
const addOptions = (select, values) => { for (const value of [...new Set(values)].sort()) { const option = element('option', value); option.value = value; select.append(option); } };
let index;
let client;
let selectedId = null;
let querySequence = 0;
let previewSequence = 0;
let catalogMode = 'all';
let queryCandidates = [];
// 右侧候选/详情当前属于谁：'agent' = 由 Agent 提交的 normalizedRequest 派生；'local' = 用户点“仅本地识别并查询”；null = 无结果/目录浏览。
// 输入框变化后，本地结果不再对应当前输入，必须清除；Agent 结果属于对话流中已提交的那一轮，保留并加显式标注。
let resultOwner = null;
// 最近一次“确认右侧属于它”的 Agent 提交消息；输入框改回这条原文时才可撤销标注（clarify/greeting 等不更新右侧的轮次不会写入它）。
let ownedMessage = null;
let priorNote = null; // “以下为上一次 Agent 提交的结果”标注节点，复用同一个节点避免重复
function message(text, error = false) { const node = byId('global-status'); node.textContent = text; node.classList.toggle('error', error); }
function section(title) { const node = element('section', undefined, 'detail-section'); node.append(element('h3', title)); return node; }

function detailMessage(text, error = false) {
  byId('detail-panel').replaceChildren(element('p', text, error ? 'notice error' : 'empty-state'));
}

function resetFilters() {
  for (const id of ['catalog-search', 'catalog-source', 'catalog-module', 'catalog-context', 'catalog-phase']) byId(id).value = '';
  byId('verified-only').checked = false;
}

function clearQuery(text) {
  resultOwner = null; ownedMessage = null;
  ++querySequence;
  ++previewSequence;
  catalogMode = 'query';
  queryCandidates = [];
  selectedId = null;
  resetFilters();
  byId('query-submit').disabled = false;
  byId('query-status').replaceChildren();
  byId('parsed-results').replaceChildren();
  resetResultFilter();
  detailMessage(text);
  renderCatalog();
}

// 在 Agent 结果上显示/移除“上一次提交”标注。标注与结果一起存在于 #query-status，随下一次查询的 replaceChildren 自然消失。
function markPrior(show) {
  const status = byId('query-status');
  const present = priorNote && [...status.children].includes(priorNote);
  if (show && !present) {
    priorNote ??= element('p', '此处为上一次识别出的对象，不一定对应当前输入框的内容。', 'query-message agent-prior');
    status.replaceChildren(priorNote, ...status.children);
  } else if (!show && present) status.replaceChildren(...[...status.children].filter(child => child !== priorNote));
}

function inputChanged() {
  // Agent 对话流的追问：右侧属于已提交的上一轮，不清除，只加显式标注避免误读为当前输入的结果。
  if (resultOwner === 'agent') { markPrior(ownedMessage === null || byId('configuration').value !== ownedMessage); return; }
  // 本地解析结果不再对应当前输入：保持原有清除语义。
  clearQuery('输入已变化，请重新查询。');
  // stale 标记让样式在“只有这条提示、没有结果”时收起回答区，避免每次输入都弹出空的第 2 步。
  byId('query-status').append(element('p', '输入已变化，请重新查询。', 'query-message stale'));
}

function resetResultFilter() {
  byId('result-toolbar').hidden = true;
  byId('result-filter').value = 'all';
  byId('result-count').textContent = '';
  byId('result-empty').hidden = true;
}

function filterResults() {
  const rows = [...byId('parsed-results').children];
  const attentionOnly = byId('result-filter').value === 'attention';
  for (const row of rows) row.hidden = attentionOnly && row.dataset.attention !== 'true';
  const visible = rows.filter(row => !row.hidden).length;
  byId('result-count').textContent = `显示 ${visible} / ${rows.length} 项。关注筛选包含未唯一匹配、不完整条目及未分析的外部引用；不改变上方统计或候选目录。`;
  byId('result-empty').hidden = !attentionOnly || visible > 0;
}

function setCandidates(matches) {
  queryCandidates = [...new Map(matches.flatMap(match => match.candidates).map(entry => [entry.id, entry])).values()];
  renderCatalog();
}

function queryPreviewNote(status) {
  return `来源：本次输入的唯一候选知识预览。${status === 'context_required' ? '上下文尚未确定，不能判断配置适用性。' : '仅匹配知识身份，未进行运行环境检查。'}`;
}

// 功能/语法字段的状态徽标与出处。状态只来自 *_evidence；条目评级仅决定未登记出处时
// 显示中性“待补出处”（已基础核对）还是警示“未核实”（仅注册信息），不会把字段升级为已核实。
function fieldStatusRow(detail, field) {
  const evidence = fieldEvidence(detail, field);
  const row = element('p', undefined, 'field-evidence');
  if (evidence.status === 'verified') {
    row.append(element('span', FACT_STATUS_LABELS.verified, 'fact-status verified'), element('span', '依据：', 'source-meta'));
    for (const id of evidence.source_ids) {
      const source = detail.sources.find(source => source.id === id);
      const link = element('a', `${source.file}:${source.start_line}–${source.end_line} ↗ `, 'source-link');
      link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; row.append(link);
    }
  } else if (detail.verification === 'registration_only') row.append(element('span', FACT_STATUS_LABELS.unverified, 'fact-status pending'));
  else row.append(element('span', FIELD_PENDING_LABEL, 'fact-status neutral'), element('span', FIELD_PENDING_NOTE, 'verification-notes'));
  return row;
}

function renderDetail(detail, previewNote) {
  const panel = byId('detail-panel'); panel.replaceChildren();
  panel.append(element('p', `${detail.component} / ${detail.module}`, 'detail-kicker'), element('h2', detail.name, 'detail-title'));
  const badges = element('div', undefined, 'detail-meta');
  badges.append(element('span', VERIFICATION_LABELS[detail.verification], `badge ${detail.verification === 'registration_only' ? 'warning' : 'verified'}`), element('span', SOURCE_LABELS[detail.source?.kind ?? 'bundled'], 'badge'), element('span', `发行基线 OpenResty ${detail.openresty_version}`, 'badge'));
  if (detail.availability.deprecated) badges.append(element('span', '已废弃', 'badge warning'));
  panel.append(badges);
  if (detail.verification !== 'registration_only') panel.append(element('p', BASIC_SCOPE_NOTE, 'verification-notes'));
  if (detail.verification === 'deep_verified') panel.append(element('p', DEEP_SCOPE_NOTE, 'verification-notes'));
  if (detail.source?.kind === 'department_extension') panel.append(element('p', sourceDescription(detail), 'notice'), element('p', `模块版本：${detail.source.version}；运行兼容性尚未核实。`, 'verification-notes'));
  if (previewNote) panel.append(element('p', previewNote, 'notice'));
  if (detail.verification === 'registration_only') panel.append(element('p', '仅计为注册信息，基础功能覆盖尚未完成。下方研究说明不代表已核实发行版完整行为。', 'notice'));
  const functionality = section('功能与语法');
  functionality.append(element('p', detail.summary ?? '功能说明尚未核实。'), fieldStatusRow(detail, 'summary'));
  if (detail.syntax) functionality.append(element('pre', detail.syntax, 'syntax'), fieldStatusRow(detail, 'syntax'));
  const facts = element('dl', undefined, 'facts');
  for (const [label, value] of [['适用 context', detail.contexts_verified ? detail.contexts.join('、') : '映射尚未核实'], ['默认值', formatFact(detail.defaults)], ['继承行为', formatFact(detail.inheritance)], ['相关阶段', detail.phases.join('、') || '尚未记录']]) {
    const pair = element('div'); pair.append(element('dt', label), element('dd', value)); facts.append(pair);
  }
  functionality.append(facts); panel.append(functionality);
  const limits = section('限制与适用条件');
  if (detail.limitations.length) { const list = element('ul'); for (const item of detail.limitations) list.append(element('li', `[${FACT_STATUS_LABELS[item.status]}] ${item.text}`)); limits.append(list); }
  else limits.append(element('p', '尚未记录限制，不等于没有限制。'));
  if (detail.availability.compile_guards.length) limits.append(element('p', '条件编译：' + detail.availability.compile_guards.join('；')));
  limits.append(element('p', '适用条件核实状态：' + FACT_STATUS_LABELS[detail.availability.status]));
  limits.append(element('p', AVAILABILITY_SCOPE_NOTE, 'verification-notes'));
  limits.append(element('p', '模块依赖：' + (detail.availability.dependencies.join('；') || '尚未记录，不等于无需依赖')));
  limits.append(element('p', '废弃状态：' + (detail.availability.deprecated === null ? '未核实' : detail.availability.deprecated ? '已废弃' : '未标记废弃')));
  limits.append(element('p', `补丁状态：${PATCH_STATUS_LABELS[detail.patch_status.status]}`), element('p', detail.patch_status.note, 'verification-notes')); panel.append(limits);
  if (detail.mechanism) { const mechanism = section('配置实现链路（核实范围见条目说明）'); mechanism.append(element('p', detail.mechanism)); panel.append(mechanism); }
  if (detail.runtime) {
    const runtime = section(`运行时链路（${FACT_STATUS_LABELS[detail.runtime.status]}）`);
    runtime.classList.add('runtime-section');
    runtime.append(element('p', detail.runtime.text), element('p', RUNTIME_SCOPE_NOTE, 'notice'));
    const evidenceLinks = ids => {
      const row = element('p', '依据：', 'source-meta');
      for (const id of ids) {
        const source = detail.sources.find(source => source.id === id);
        const link = element('a', `${source.file}:${source.start_line}–${source.end_line} ↗ `, 'source-link');
        link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; row.append(link);
      }
      return row;
    };
    const steps = element('ol');
    for (const step of detail.runtime.steps) {
      const row = element('li');
      row.append(element('strong', step.condition), element('p', step.action), evidenceLinks(step.source_ids)); steps.append(row);
    }
    runtime.append(steps, element('h4', '文档交叉印证'), detail.runtime.corroboration_source_ids.length ? evidenceLinks(detail.runtime.corroboration_source_ids) : element('p', '尚未记录')); panel.append(runtime);
  } else { const runtime = section('运行时链路'); runtime.append(element('p', NO_RUNTIME_NOTE)); panel.append(runtime); }
  if (detail.related?.length) {
    const related = section('关联指令');
    related.append(element('p', '浏览同一发布的关联知识，不改变本次输入匹配结果。', 'verification-notes'));
    const generation = querySequence;
    for (const name of detail.related) {
      const entries = relatedCandidates(name, index);
      if (!entries.length) related.append(element('p', `${name}：该发布未收录。`));
      for (const entry of entries) {
        const button = element('button', `${name} · ${entry.module} · ${entry.contexts.join('、')} ↗`, 'candidate-button related-entry');
        button.type = 'button'; button.dataset.id = entry.id;
        button.addEventListener('click', () => preview(entry, '来源：关联知识预览，不代表当前输入匹配。', generation));
        related.append(button);
      }
    }
    panel.append(related);
  }
  const sources = section('源码与文档证据');
  sources.append(element('p', '配置入口：' + (detail.configuration_entry.symbol ?? '尚未核实')));
  for (const source of detail.sources) {
    const block = element('details', undefined, 'source-block');
    block.open = source.id === 'configuration-definition';
    block.append(element('summary', `${source.file}:${source.start_line}–${source.end_line}`), element('div', `${source.component} ${source.version} · revision ${source.revision}`, 'source-meta'));
    const link = element('a', '查看固定版本来源 ↗', 'source-link'); link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; block.append(link);
    block.append(element('pre', source.code)); sources.append(block);
  }
  for (const doc of detail.documentation) {
    const row = element('p'); const link = element('a', doc.title); link.href = doc.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    row.append(element('span', `[${FACT_STATUS_LABELS[doc.status]}] `), link); sources.append(row);
  }
  if (!detail.documentation.length) sources.append(element('p', '文档依据尚未记录。'));
  panel.append(sources);
  const notes = section('核实状态'); const noteList = element('ul', undefined, 'verification-notes');
  for (const note of detail.verification_notes) noteList.append(element('li', note)); notes.append(noteList); panel.append(notes);
  const permalink = element('a', '此条目永久详情链接 ↗'); permalink.href = client.detailUrl(index, detail); panel.append(permalink);
}

async function preview(entry, note, generation = querySequence) {
  if (generation !== querySequence) return;
  const sequence = ++previewSequence;
  selectedId = entry.id; renderCatalog(); detailMessage('正在读取该发布的知识详情…');
  try {
    const detail = await client.getDetail(entry, index);
    if (generation === querySequence && sequence === previewSequence) renderDetail(detail, note);
  } catch (error) {
    if (generation !== querySequence || sequence !== previewSequence) return;
    selectedId = null;
    renderCatalog();
    detailMessage(`${error.code ? error.message : '知识详情读取失败或版本不一致，请检查发布文件。'} 可重新选择本次候选。`, true);
  }
}

function renderCatalog() {
  const querying = catalogMode === 'query';
  byId('catalog-scope').textContent = querying ? '本次输入候选（按知识身份去重）· 包含仅注册信息' : '全部目录浏览 · 不代表本次输入匹配';
  for (const id of ['catalog-search', 'catalog-source', 'catalog-module', 'catalog-context', 'catalog-phase', 'verified-only']) byId(id).disabled = querying;
  const term = byId('catalog-search').value.toLowerCase().trim();
  const module = byId('catalog-module').value; const context = byId('catalog-context').value; const phase = byId('catalog-phase').value;
  const source = byId('catalog-source').value;
  const entries = querying ? queryCandidates : (index?.directives ?? []).filter(entry => (!source || (entry.source?.kind ?? 'bundled') === source) && (!term || `${entry.name} ${entry.module} ${entry.component}`.toLowerCase().includes(term)) && (!module || entry.module === module) && (!context || entry.contexts.includes(context)) && (!phase || entry.phases.includes(phase)) && (!byId('verified-only').checked || entry.verification !== 'registration_only'));
  byId('catalog-count').textContent = String(entries.length);
  const list = byId('catalog-list'); list.replaceChildren();
  const generation = querySequence;
  for (const entry of entries) {
    const button = element('button', undefined, 'catalog-entry'); button.type = 'button'; button.classList.toggle('active', selectedId === entry.id);
    button.dataset.id = entry.id;
    button.append(element('strong', entry.name), element('span', entry.module), element('small', VERIFICATION_LABELS[entry.verification], entry.verification === 'registration_only' ? 'unverified' : ''));
    button.append(element('small', sourceDescription(entry)));
    button.addEventListener('click', () => preview(entry, querying ? '来源：本次输入候选中手动选择的知识预览，不代表上下文适用性或运行环境已确认。' : '来源：全部目录中手动选择的知识预览，不代表本次输入匹配。', generation)); list.append(button);
  }
  if (!entries.length) list.append(element('p', querying ? '当前没有可选的本次输入候选。' : '当前筛选下没有条目。可取消“仅已核对项”或修改搜索。', 'verification-notes'));
}

function resultRow(parsed, match, allowPreview = true) {
  const row = element('div', undefined, 'parsed-row');
  row.dataset.attention = String(needsAttention(parsed, match));
  row.append(element('span', parsed.name, 'parsed-name'), element('p', `行 ${parsed.line}:${parsed.column} · ${STATUS_LABELS[match.status]}`));
  if (parsed.kind === 'block_entry') {
    row.append(element('p', `所属配置块：${parsed.contexts.join(' › ')} · ${parsed.entry_role === 'control' ? '块内控制项' : '块内数据项'}`));
    if (parsed.raw_args.length) row.append(element('p', `参数：${parsed.raw_args.join(' ')}`));
    row.append(element('p', '仅识别条目边界及类别，未验证规则、参数或控制项组合是否有效。', 'verification-notes'));
  } else row.append(element('p', `当前 context：${match.effective_context ?? '未知'}`));
  for (const reference of parsed.external_references) row.append(element('p', `外部内容未提供，未分析：${reference.value}`));
  const generation = querySequence;
  if (allowPreview) for (const entry of match.candidates) { const button = element('button', `${entry.module} · ${sourceDescription(entry)} ↗`, 'candidate-button'); button.type = 'button'; button.dataset.id = entry.id; button.addEventListener('click', () => preview(entry, `来源：本次输入 ${parsed.name} 的候选中手动选择。${STATUS_LABELS[match.status]}；以下仅预览所选知识条目。`, generation)); row.append(button); }
  return row;
}

async function submit(generation, request) {
  const output = byId('parsed-results');
  const status = byId('query-status');
  if (!client || !index) {
    status.append(element('p', '知识索引尚不可用。', 'query-message error'));
    detailMessage('知识索引尚不可用，未显示详情。', true);
    return;
  }
  const input = request?.input ?? byId('configuration').value;
  const mode = request?.mode ?? byId('input-mode').value;
  if (mode === 'single') {
    const options = { context: (request ? request.context : byId('query-context').value) || null, module: (request ? request.module : byId('query-module').value) || null, release: index.release_id };
    const result = await client.querySingle(input, options);
    if (generation !== querySequence) return;
    const parsed = parseSingle(input);
    if (parsed.status === 'ok') for (const reference of parsed.directive.external_references) status.append(element('p', `外部内容未提供，未分析：${reference.value}`, 'query-message external-reference'));
    status.append(element('p', `${STATUS_LABELS[result.status]}${result.status === 'matched' ? '（只匹配知识身份，不判断配置有效或安全）' : ''}`, 'query-message'));
    if (result.status === 'out_of_scope') status.append(element('p', '包含 events、http 等普通配置块或多条配置时，请切换为配置片段或完整主配置后查询。', 'query-message'));
    for (const error of result.errors) status.append(element('p', `${error.message}${error.line ? `（${error.line}:${error.column}）` : ''}`, 'query-message error'));
    const detailFailed = result.status === 'knowledge_unavailable' && result.release_id === index.release_id
      && ['matched', 'context_required'].includes(result.match?.status) && result.match.candidates.length > 0;
    if (['invalid_input', 'invalid_index', 'empty_input', 'parse_error', 'out_of_scope', 'knowledge_unavailable'].includes(result.status) && !detailFailed) {
      detailMessage('本次查询未完成或输入不符合要求，未显示候选详情。', true);
      return;
    }
    setCandidates(result.match ? [result.match] : []);
    if (result.match) for (const entry of result.match.candidates) {
      const button = element('button', `${entry.name} · ${entry.module} · ${sourceDescription(entry)} ↗`, 'candidate-button'); button.type = 'button'; button.dataset.id = entry.id;
      button.addEventListener('click', () => preview(entry, `来源：本次输入候选中手动选择。${STATUS_LABELS[result.status]}；以下仅预览所选知识条目。`, generation)); output.append(button);
    }
    if (detailFailed) {
      selectedId = null;
      detailMessage('知识详情读取失败，已保留本次候选，可点击条目重新读取；本次查询仍为知识暂不可用。', true);
      return;
    }
    if (result.detail && ['matched', 'context_required'].includes(result.status) && result.match.candidates.length === 1) {
      ++previewSequence; selectedId = result.detail.id; renderCatalog(); renderDetail(result.detail, queryPreviewNote(result.status));
    } else detailMessage(result.status === 'ambiguous' ? '本次输入存在多个候选，请选择模块/条目。' : queryCandidates.length ? '本次输入存在候选，请选择模块/条目查看知识预览。' : '本次输入未找到候选；当前索引未收录不代表 OpenResty 不支持。');
  } else {
    const mainConfig = mode === 'main';
    const parsed = parseConfig(input, { mode: mainConfig ? 'main' : 'fragment' });
    if (mainConfig) status.append(element('p', request ? '本次按 main 顶层解析，不补外层块，不展开 include；可展开 Agent 识别对象核对原文。' : '按你声明的完整主配置识别：顶层为 main，不补外层块，不展开 include，也不表示整体配置已通过验证。', 'query-message'));
    status.append(element('p', parsed.errors.length ? `输入解析失败 / 不完整；已提取 ${parsed.directives.length} 项，不代表整体成功。` : `已提取 ${parsed.directives.length} 项；参数及运行环境未验证。`, `query-message ${parsed.errors.length ? 'error' : ''}`));
    for (const error of parsed.errors) status.append(element('p', `${error.message}（${error.line}:${error.column}）`, 'query-message error'));
    const matches = parsed.directives.map(directive => matchDirective(directive, index));
    const summary = summarizeConfig(parsed, matches);
    status.append(element('p', `普通指令（含块头）${summary.directives} · 唯一匹配 ${summary.matched} · 匹配需关注 ${summary.attention} · 块内条目 ${summary.block_entries} · 外部引用未分析 ${summary.external_references}`, 'query-message'));
    status.append(element('p', '按输入出现次数统计；需关注包括未唯一匹配的指令或不完整条目，外部引用另计。唯一匹配不代表参数或整体配置验证通过。', 'verification-notes'));
    const valid = !parsed.errors.length && matches.every(match => !['invalid_input', 'invalid_index'].includes(match.status));
    for (let i = 0; i < parsed.directives.length; i++) output.append(resultRow(parsed.directives[i], matches[i], valid));
    byId('result-toolbar').hidden = false;
    filterResults();
    if (!valid) {
      if (!parsed.errors.length) status.append(element('p', '知识索引无效，未发布本次候选。', 'query-message error'));
      detailMessage('输入解析失败或知识索引无效，未显示可选候选；请修正后重新查询。', true);
      return;
    }
    setCandidates(matches);
    if (needsOuterContext(parsed)) {
      status.append(element('p', '请提供外层 http 或 stream 等所属块，以确定上下文。确认属于 stream 时，可手动包入 stream { ... } 后重新查询；不会自动包装或猜测。', 'query-message'));
    }
    if (!parsed.directives.length) detailMessage('输入中没有指令，请输入配置后重新查询。');
    else if (!queryCandidates.length) detailMessage('本次输入未找到候选；当前索引未收录不代表 OpenResty 不支持。');
    else if (parsed.directives.length > 1) detailMessage('本次输入包含多条指令，请选择要查看的候选；上下文不足时不自动选择模块。');
    else if (queryCandidates.length === 1 && ['matched', 'context_required'].includes(matches[0].status)) {
      await preview(queryCandidates[0], queryPreviewNote(matches[0].status), generation);
    } else detailMessage(matches[0].status === 'ambiguous' ? '本次输入存在多个候选，请选择模块/条目。' : '本次输入存在候选，请选择模块/条目查看知识预览。');
  }
}

async function runQuery(request) {
  clearQuery('正在识别本次输入…');
  resultOwner = request ? 'agent' : 'local';
  const generation = querySequence;
  const button = byId('query-submit'); button.disabled = true;
  try { await submit(generation, request); }
  catch {
    if (generation !== querySequence) return;
    resultOwner = null; ownedMessage = null;
    // 通知 Agent 侧：右侧已不再显示该对象，下一次同对象提交必须重新派发。
    byId('configuration').dispatchEvent(new CustomEvent('agent-analysis-failed'));
    ++previewSequence; queryCandidates = []; selectedId = null; renderCatalog();
    byId('parsed-results').replaceChildren();
    resetResultFilter();
    byId('query-status').replaceChildren(element('p', '查询未完成，请检查输入及知识发布。', 'query-message error'));
    detailMessage('本次查询失败，未显示候选详情。', true);
  } finally { if (generation === querySequence) button.disabled = false; }
}
byId('query-form').addEventListener('submit', async event => { event.preventDefault(); await runQuery(); });
byId('configuration').addEventListener('agent-analysis', event => {
  if (event.detail?.release !== index?.release_id) { byId('configuration').dispatchEvent(new CustomEvent('agent-analysis-failed')); return; }
  void runQuery(event.detail);
});
// Agent 一轮结束（终态渲染完成）。规则：
// - 输入框与提交消息不一致：一律加标注（用户在等待期间又改了输入）。
// - 一致：只有本轮确认右侧属于它（detail.owned）才能撤销标注；澄清/范围外/问候等不更新右侧的轮次不能撤销，
//   否则右侧仍是更早的对象却像当前输入的结果。
byId('configuration').addEventListener('agent-turn-done', event => {
  if (resultOwner !== 'agent') return;
  const message = event.detail?.message ?? '';
  if (event.detail?.owned) ownedMessage = message;
  if (byId('configuration').value !== message) markPrior(true);
  else if (event.detail?.owned) markPrior(false);
});
byId('configuration').addEventListener('agent-reset', event => clearQuery(event.detail || '新会话尚未提交，请输入配置或问题。'));
byId('configuration').addEventListener('input', inputChanged);
byId('input-mode').addEventListener('change', () => {
  const mode = byId('input-mode').value;
  byId('query-context').disabled = mode !== 'single';
  byId('query-module').disabled = mode !== 'single';
  byId('input-mode-note').textContent = mode === 'main'
    ? '仅当输入从 nginx.conf 顶层开始时选择此项；孤立 server/location 或 include 文件内容应使用片段模式。不会自动补外层或验证参数。'
    : '单项查询可指定所属 context 和模块；配置片段不猜测缺失的外层。';
  inputChanged();
});
byId('result-filter').addEventListener('change', filterResults);
for (const id of ['query-context', 'query-module']) byId(id).addEventListener('change', inputChanged);
byId('browse-all').addEventListener('click', () => {
  clearQuery('全部目录浏览，请选择条目；所选知识不代表本次输入匹配。');
  catalogMode = 'all'; renderCatalog();
  byId('query-status').append(element('p', '已切换为全部目录浏览；再次查询将只显示本次输入候选。', 'query-message'));
});
for (const id of ['catalog-search', 'catalog-source', 'catalog-module', 'catalog-context', 'catalog-phase', 'verified-only']) byId(id).addEventListener(id === 'catalog-search' ? 'input' : 'change', renderCatalog);

let references = [];
let selectedReferenceId = null;
const referenceLabel = kind => kind === 'lua_api' ? 'Lua API' : 'Nginx 变量';

function renderReference(reference) {
  selectedReferenceId = reference.id;
  renderReferenceList();
  const panel = byId('reference-detail'); panel.replaceChildren();
  panel.append(element('h3', reference.name, 'reference-title'), element('p', `${referenceLabel(reference.kind)} / ${reference.component} / OpenResty ${index.openresty_version}`, 'reference-subtitle'));
  panel.append(element('p', reference.verification === 'reference_verified' ? '所列参考事实已核对；不是配置匹配结果，也不表示全部行为已验证。' : '参考说明尚未核对。', 'notice'));
  panel.append(element('p', reference.summary));
  const limits = section('限制与核对范围'); const list = element('ul');
  for (const limitation of reference.limitations) list.append(element('li', limitation));
  if (!reference.limitations.length) limits.append(element('p', '尚未记录限制，不等于没有限制。'));
  limits.append(list); panel.append(limits);
  const sources = section('固定版本来源');
  for (const source of reference.sources) {
    const block = element('details', undefined, 'source-block');
    block.append(element('summary', `${source.file}:${source.start_line}–${source.end_line}`), element('div', `${source.component} ${source.version} · revision ${source.revision}`, 'source-meta'));
    const link = element('a', '查看固定版本来源 ↗', 'source-link'); link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    block.append(link, element('pre', source.code)); sources.append(block);
  }
  panel.append(sources);
}

function renderReferenceList() {
  const term = byId('reference-search').value.trim().toLowerCase();
  const kind = byId('reference-kind').value;
  const entries = references.filter(reference => (!kind || reference.kind === kind) && (!term || `${reference.name} ${reference.component}`.toLowerCase().includes(term)));
  byId('reference-count').textContent = `${entries.length} / ${references.length}`;
  const list = byId('reference-list'); list.replaceChildren();
  if (selectedReferenceId && !entries.some(reference => reference.id === selectedReferenceId)) {
    selectedReferenceId = null;
    byId('reference-detail').replaceChildren(element('p', '当前筛选不包含原条目，请重新选择。', 'verification-notes'));
  }
  for (const reference of entries) {
    const button = element('button', undefined, 'reference-entry'); button.type = 'button'; button.dataset.id = reference.id;
    button.classList.toggle('active', reference.id === selectedReferenceId);
    button.append(element('strong', reference.name), element('small', `${referenceLabel(reference.kind)} · ${reference.component}`));
    button.addEventListener('click', () => renderReference(reference)); list.append(button);
  }
  if (!entries.length) list.append(element('p', '当前筛选没有参考条目。', 'verification-notes'));
}

async function startReferences() {
  const result = await client.loadReferences(index);
  const status = byId('reference-status');
  if (result.status === 'not_provided') { status.textContent = '此发布尚无参考库；配置查询仍可使用。'; return; }
  if (result.status !== 'ok') {
    status.textContent = `参考库读取失败：${result.errors.map(error => error.message).join('；')}。配置查询仍可使用。`;
    status.className = 'notice error'; return;
  }
  references = result.references.references;
  status.textContent = `本发布收录 ${references.length} 个参考条目；仅计参考，不计配置指令覆盖。`;
  byId('reference-search').disabled = false; byId('reference-kind').disabled = false;
  renderReferenceList();
}
byId('reference-search').addEventListener('input', renderReferenceList);
byId('reference-kind').addEventListener('change', renderReferenceList);

async function startExamples(timeoutMs) {
  const area = byId('examples');
  try {
    const response = await fetch(new URL('./examples.json', import.meta.url), { signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) throw new Error('示例文件不可用');
    const examples = await response.json();
    if (!Array.isArray(examples) || examples.some(example => !example
      || !['single', 'config', 'main'].includes(example.mode)
      || ['label', 'context', 'text'].some(key => typeof example[key] !== 'string')
      || !example.label.trim() || !example.text.trim())) throw new Error('示例格式无效');
    for (const example of examples) {
      const button = element('button', example.label); button.type = 'button';
      button.addEventListener('click', () => { byId('input-mode').value = example.mode; byId('input-mode').dispatchEvent(new Event('change')); byId('query-context').value = example.context; byId('query-module').value = ''; byId('configuration').value = example.text; byId('configuration').dispatchEvent(new Event('input')); byId('configuration').focus(); });
      area.append(button);
    }
  } catch { area.replaceChildren(element('span', '示例暂不可用，可手动输入配置。', 'verification-notes')); }
}

async function start() {
  const generation = querySequence;
  const configResponse = await fetch(new URL('./site-config.json', import.meta.url)); if (!configResponse.ok) throw new Error('站点配置不可用');
  const config = await configResponse.json(); document.title = config.title;
  client = createKnowledgeClient({ knowledgeBase: new URL(config.knowledge_base, location.href).href, siteBase: new URL('./', location.href).href, timeoutMs: config.request_timeout_ms });
  const params = new URLSearchParams(location.search); index = await client.loadIndex(params.get('release'));
  document.body.dataset.release = index.release_id;
  byId('edition').textContent = `LOCKED / ${index.openresty_version}`;
  byId('registration-count').textContent = String(index.coverage.registration_count); byId('verified-count').textContent = String(index.coverage.basic_verified_count);
  byId('coverage-note').textContent = index.coverage.inventory_complete ? '范围盘点已完成 · 功能覆盖另计' : '范围未全量 · 多数条目仅有注册信息';
  const groups = index.coverage.groups;
  byId('coverage-groups').textContent = groups ? Object.entries(groups).map(([kind, group]) => `${SOURCE_LABELS[kind]}：${group.registration_count} 注册 / ${group.basic_verified_count} 基础 / ${group.deep_verified_count} 深度；范围${group.inventory_complete ? '已核定' : '待核定'}`).join('。') : `固定发行版：${index.coverage.registration_count} 注册 / ${index.coverage.basic_verified_count} 基础 / ${index.coverage.deep_verified_count} 深度。`;
  byId('release-label').textContent = `RELEASE / ${index.release_id}`;
  message('各字段以核实状态和源码证据为准；未收录的指令只表示当前索引未收录，不表示 OpenResty 不支持。');
  const modules = index.directives.map(entry => entry.module); const contexts = index.directives.flatMap(entry => entry.contexts);
  addOptions(byId('catalog-module'), modules); addOptions(byId('query-module'), modules); addOptions(byId('catalog-context'), contexts); addOptions(byId('query-context'), contexts); addOptions(byId('catalog-phase'), index.directives.flatMap(entry => entry.phases));
  for (const gap of index.coverage.gaps) byId('coverage-gaps').append(element('li', gap));
  if (generation === querySequence) renderCatalog();
  const requested = params.get('id'); const entry = requested ? index.directives.find(item => item.id === requested) : null;
  if (generation === querySequence) {
    if (entry) await preview(entry, '来源：永久详情链接指定的知识条目，不代表当前输入匹配。', generation);
    else if (requested) { message('该发布中未找到请求的知识标识。', true); detailMessage('该发布中未找到链接指定的知识条目。', true); }
  }
  document.body.dataset.ready = 'true';
  void startExamples(config.request_timeout_ms);
  await startReferences();
}
const startupSequence = querySequence;
start().catch(error => {
  if (startupSequence !== querySequence) return;
  clearQuery('站点加载失败，未显示目录或详情。');
  message(error.code ? `站点加载失败：${error.message}。` : '站点加载失败：请通过 HTTP 托管打开，并确认知识索引和配置文件存在且版本一致。', true);
});
