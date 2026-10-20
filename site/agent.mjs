import { FIELD_PENDING_LABEL, FIELD_PENDING_NOTE } from './src/query/knowledge.mjs';

const $ = id => document.getElementById(id);
const appBase = new URL('./', import.meta.url);
const storageKey = `openresty-agent-session${appBase.pathname === '/' ? '' : `:${appBase.pathname}`}`;
const labels = { summary: '功能', syntax: '语法', defaults: '默认值', inheritance: '继承', limitations: '功能限制', runtime: '运行时与代码原理', verified: '已核实', unverified: '未核实', not_applicable: '不适用', running: '运行中', completed: '完成', awaiting_input: '等待补充', cancelled: '已取消', failed: '失败' };
let service;
let serviceIssue = 'Agent 服务不可用；原查询仍可用，目录和参考浏览不受影响。';
let active;
let interrupted;
let needsLogin = false;
let authDraftProtected = false;
let generation = 0;
let sessionId = '';
let release = document.body.dataset.release ?? '';
// 最近一次可沿用的对象，只用来给本机列表起标题；不写入服务端。
let trackedSubject = null;
try { sessionId = localStorage.getItem(storageKey) ?? ''; } catch {}
if (!/^[0-9a-f-]{36}$/.test(sessionId)) sessionId = '';

function node(tag, text, parent, className) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  parent?.append(el);
  return el;
}
// 顶栏 Agent 标签：文字说明连接情况，data-state 供样式切换圆点颜色（ready 绿 / mock 橙 / off 灰 / login 红）。
function environment(text, state) {
  const el = $('agent-environment');
  el.textContent = text;
  el.dataset.state = state;
}
function note(text, error = false) { $('agent-status').textContent = text; $('agent-status').classList.toggle('error', error); }
// ---------- 对话流 ----------
// #agent-result 是对话流容器：每次被服务端接受的提交对应一个「轮次卡」（details/summary），
// 新轮追加在下方；只有最新一轮默认展开，旧轮折叠成摘要行。历史轮只是已渲染好的 DOM，不再发起任何网络请求。
// 最多保留 MAX_TURNS 轮，超出时从最旧一轮开始移除，保证页面节点数有界。
const MAX_TURNS = 20;
const SUMMARY_LIMIT = 60;
let turns = []; // [{ root, body, state, number }]，按时间从旧到新
let turnNumber = 0; // 单调递增的轮次号；被裁掉的旧轮不会让编号回退

// 用户输入摘要：取第一行非空文本、折叠空白、按码点截断（不会截断代理对）。只作为文本节点内容，不当 HTML 解析。
function summarizeInput(message) {
  const line = String(message ?? '').split(/\r?\n/).map(item => item.replace(/\s+/g, ' ').trim()).find(Boolean) ?? '（空）';
  const chars = Array.from(line);
  return chars.length > SUMMARY_LIMIT ? `${chars.slice(0, SUMMARY_LIMIT).join('')}…` : line;
}
// 追加一个轮次卡并返回它；旧轮全部折叠，新轮展开。
function addTurn(label) {
  const root = node('details');
  root.className = 'agent-turn';
  const head = node('summary', undefined, root);
  const number = ++turnNumber;
  node('span', `第 ${number} 轮`, head, 'turn-no');
  node('span', label, head, 'turn-summary');
  const state = node('span', '', head, 'turn-state');
  const body = node('div', undefined, root, 'turn-body');
  for (const turn of turns) turn.root.open = false;
  root.open = true;
  const turn = { root, body, state, number };
  turns.push(turn);
  if (turns.length > MAX_TURNS) {
    turns = turns.slice(turns.length - MAX_TURNS);
    $('agent-result').replaceChildren(...turns.map(item => item.root));
  } else $('agent-result').append(root);
  return turn;
}
// 清空整个对话流：只用于新会话、切换/恢复会话、删除当前会话、知识发布变化这类有意的边界。
function clearConversation() {
  turns = [];
  turnNumber = 0;
  $('agent-result').replaceChildren();
}
// 轮次未正常结束（取消、登录失效、请求失败）时：移除“运行中”占位，把原因写在摘要行；已展示的内容保留。
function settleTurn(turn, text) {
  if (!turn) return;
  turn.body.replaceChildren(...Array.from(turn.body.children).filter(child => child.className !== 'agent-pending'));
  turn.state.textContent = text;
}
// 右侧候选/详情当前对应的 Agent 对象键。追问没有新对象时据此跳过派发，让右侧保持不动。
let shownAnalysisKey = null;
function resetShownAnalysis() { shownAnalysisKey = null; }
// 键只取右侧候选/详情实际读取的字段（与 app.mjs 的 submit(request) 一致：input/mode/context/module，release 用于校验发布）。
// 不能用整个 normalizedRequest：首轮带 inputSource/configRange 且 question 是用户问题，追问是 inputSource:'meta'、无 configRange、question 是追问句，
// 这些字段不影响右侧，却会让键每次都不同。提交路径与恢复路径共用本函数。
function analysisKey(request) {
  return JSON.stringify([request.input ?? null, request.mode ?? null, request.context || null, request.module || null, request.release ?? null]);
}

function controls() {
  const ready = Boolean(service && !needsLogin && document.body.dataset.release);
  $('agent-submit').disabled = !ready || Boolean(active) || Boolean(interrupted);
  $('agent-submit').textContent = sessionId ? '继续提交' : '提交给 Agent';
  $('agent-cancel').disabled = !active || active.kind !== 'run';
  $('agent-restore').disabled = !(ready || needsLogin) || !(sessionId || interrupted) || Boolean(active);
  $('agent-retry').disabled = Boolean(active);
  $('agent-session').textContent = sessionId || '未创建';
  $('agent-result').setAttribute('aria-busy', String(Boolean(active)));
  renderSessions();
}
function remember(id) {
  sessionId = id;
  try { if (id) localStorage.setItem(storageKey, id); else localStorage.removeItem(storageKey); } catch {}
  controls();
}
// 列表键与当前会话 ID 分开。解析失败、不是数组或条目缺字段时整表视为空，避免坏数据撑破界面。
function readSessions() {
  try {
    const value = JSON.parse(localStorage.getItem(`${storageKey}:list`) ?? '[]');
    if (!Array.isArray(value)) return [];
    const items = [];
    for (const item of value) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      if (typeof item.id !== 'string' || !/^[0-9a-f-]{36}$/.test(item.id) || typeof item.title !== 'string' || !Number.isFinite(item.updatedAt)) continue;
      items.push({ id: item.id, title: item.title, updatedAt: item.updatedAt });
    }
    return items.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 20);
  } catch { return []; }
}
function writeSessions(items) {
  try { localStorage.setItem(`${storageKey}:list`, JSON.stringify(items.slice(0, 20))); } catch {}
  renderSessions();
}
// 纯指令名才作为标题；整段配置含空格或符号时改用用户消息，避免把配置原文放进浏览器列表。
function directiveName(subject) {
  const input = typeof subject?.input === 'string' ? subject.input.trim() : '';
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(input) ? input : '';
}
function listTitle(message) {
  const name = directiveName(trackedSubject);
  if (name) return name;
  const line = String(message ?? '').split(/\r?\n/).map(item => item.trim()).find(Boolean) ?? '';
  return line.slice(0, 30) || '未命名会话';
}
// 最多 20 条，按 updatedAt 倒序。传入 title 时替换，否则保留原标题，只刷新时间。
function saveSession(id, title) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return;
  const items = readSessions();
  const previous = items.find(item => item.id === id);
  const next = { id, title: title || previous?.title || '未命名会话', updatedAt: Date.now() };
  writeSessions([next, ...items.filter(item => item.id !== id)].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 20));
}
function dropSession(id) {
  writeSessions(readSessions().filter(item => item.id !== id));
}
function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = number => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function renderSessions() {
  const list = $('agent-history-list');
  if (!list) return;
  list.replaceChildren();
  const ttl = service?.retentionEnabled === true && Number.isFinite(service.sessionTtlMs) ? service.sessionTtlMs : 0;
  const now = Date.now();
  for (const item of readSessions()) {
    const row = node('li', undefined, list, item.id === sessionId ? 'is-current' : '');
    node('span', item.title, row, 'session-title');
    node('time', formatTime(item.updatedAt), row);
    const remain = ttl ? ttl - (now - item.updatedAt) : 0;
    const expired = Boolean(ttl) && remain <= 0;
    if (ttl) node('span', expired ? '已过期' : `剩余 ${Math.ceil(remain / 86400000)} 天`, row, expired ? 'expired' : '');
    const switchButton = node('button', '切换', row, 'text-button');
    switchButton.type = 'button';
    switchButton.disabled = Boolean(active || interrupted);
    switchButton.addEventListener('click', () => openSession(item.id));
    const deleteButton = node('button', '删除', row, 'text-button');
    deleteButton.type = 'button';
    deleteButton.disabled = Boolean(active || interrupted);
    deleteButton.addEventListener('click', () => deleteListed(item.id));
    // 按本机时间已过期的项可以只从列表拿掉，不必再等服务端清理。
    if (expired) {
      const removeButton = node('button', '移除', row, 'text-button');
      removeButton.type = 'button';
      removeButton.addEventListener('click', () => dropSession(item.id));
    }
  }
}
async function openSession(id) {
  if (active || interrupted || !/^[0-9a-f-]{36}$/.test(id)) return;
  const previousId = sessionId;
  const previousSubject = trackedSubject;
  authDraftProtected = false;
  // 切换尚未成功时不能沿用上一个会话的对象，否则标题和追问会串会话。
  trackedSubject = null;
  remember(id);
  const outcome = await restore();
  if (outcome === 'expired') return;
  if (outcome !== 'ok') { trackedSubject = previousSubject; remember(previousId); }
}
async function deleteListed(id) {
  if (active || interrupted || !/^[0-9a-f-]{36}$/.test(id)) return;
  try { await api(`/api/sessions/${id}`, undefined, undefined, 'DELETE'); }
  catch (error) {
    if (error.code === 'auth_required') { requireLogin(); return; }
    note(`删除未完成：${error.message}`, true);
    return;
  }
  dropSession(id);
  if (sessionId !== id) return;
  interrupted = null;
  authDraftProtected = false;
  trackedSubject = null;
  invalidate('已删除当前会话，输入框内容保留，提交后开始新会话。');
  remember('');
  resetShownAnalysis();
  $('configuration').dispatchEvent(new CustomEvent('agent-reset'));
}
function currentRequest() {
  return { message: $('configuration').value, release: document.body.dataset.release };
}
const fingerprint = () => JSON.stringify(currentRequest());
// 输入变化不再使提交任务失效（以提交时为准，结果进入自己的轮次卡）。
// 唯一例外是“恢复会话”：它会把服务端内容回填输入框，期间用户编辑输入就必须放弃恢复，避免覆盖用户输入。
const current = task => active === task && !task.cancelled && task.generation === generation && (task.kind !== 'restore' || task.fingerprint === fingerprint());
function loginNote() {
  note(`登录已失效，请重新登录后点击“${sessionId || interrupted ? '恢复会话' : '重新检测服务'}”；输入已保留。${interrupted ? '任务标识已保留，后端任务可能仍在运行，未确认取消。' : ''}`, true);
  link($('agent-status'), new URL('/login', appBase).href, '打开登录页');
}
function requireLogin(task) {
  needsLogin = true;
  authDraftProtected = true;
  if (task) {
    task.authPaused = true;
    settleTurn(task.turn, '登录失效，任务中断');
    task.controller.abort();
    task.wake?.();
    if (task.requestId && !task.terminal) interrupted = task;
    if (active === task) active = null;
  }
  environment('需要重新登录', 'login');
  loginNote();
  controls();
}
async function api(path, body, signal, method) {
  const timeout = service?.requestTimeoutMs ?? Number($('agent-panel').dataset.probeTimeoutMs);
  const verb = method ?? (body === undefined ? 'GET' : 'POST');
  const response = await fetch(new URL(path.replace(/^\//, ''), appBase), { method: verb, cache: 'no-store',
    ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(timeout)]) : AbortSignal.timeout(timeout) });
  if (response.status === 401) throw Object.assign(new Error('登录已失效'), { code: 'auth_required' });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.code === 'busy' ? '服务忙碌，输入已保留，请稍后手动重试' : data.error || `Agent 服务返回 ${response.status}`), { code: data.code });
  return data;
}
async function probe() {
  $('agent-retry').disabled = true;
  try {
    const status = await api('/api/status');
    if (!['mock', 'live'].includes(status.mode) || !Number.isFinite(status.pollIntervalMs) || status.pollIntervalMs <= 0 || !Number.isFinite(status.requestTimeoutMs) || status.requestTimeoutMs <= 0) throw new Error('Agent 状态接口不兼容');
    if (!status.unifiedInput) {
      service = null;
      environment('Agent 需要更新', 'off');
      serviceIssue = '当前服务尚不支持单输入框，请重启项目内的 npm run agent；本地查询仍可使用。';
      note(serviceIssue);
      controls();
      return;
    }
    service = status;
    needsLogin = false;
    if (status.mode === 'live') environment(`真实模型 · ${status.model}`, 'ready');
    else environment('模拟模式 · 不代表真实模型', 'mock');
    note(interrupted ? 'Agent 已连接；请点击“恢复会话”检查中断任务，不会自动重新提交。' : document.body.dataset.release ? 'Agent 已就绪；输入配置、问题或追问后提交。' : 'Agent 已连接，等待知识发布加载。');
  } catch (error) {
    if (error.code === 'auth_required') { requireLogin(); return false; }
    service = null;
    environment('Agent 未连接', 'off');
    serviceIssue = 'Agent 服务不可用；原查询仍可用，展开“仅本地查询”识别配置，目录和参考浏览不受影响。';
    note(serviceIssue);
  }
  controls();
  return Boolean(service);
}
async function stop(task) {
  if (!task.requestId || task.terminal || task.cancelConfirmed || task.authPaused) return;
  if (task.stopPromise) return task.stopPromise;
  task.stopPromise = (async () => {
    try { await api('/api/cancel', { requestId: task.requestId }); }
    catch (error) {
      if (error.code === 'auth_required') throw error;
      if (error.code === 'job_unavailable') { task.cancelConfirmed = true; return; }
      const job = await api(`/api/jobs/${task.requestId}?brief=1`).catch(failure => {
        if (failure.code === 'job_unavailable') return { state: 'expired' };
        throw failure;
      });
      if (job.state === 'running') throw error;
    }
    task.cancelConfirmed = true;
  })();
  try { await task.stopPromise; }
  catch (error) { if (error.code === 'auth_required') requireLogin(task); throw error; }
  finally { task.stopPromise = null; }
}
// 使当前活动任务与结果失效。keepConversation=true 时保留已有轮次（取消、改用本地查询），
// 否则清空整个对话流（新会话、删除当前会话、知识发布变化）。输入框编辑不走这里，见 inputHint。
function invalidate(text, { keepConversation = false } = {}) {
  generation++;
  if (keepConversation) { if (active && !active.terminal) settleTurn(active.turn, '已取消'); }
  else clearConversation();
  if (needsLogin) loginNote(); else note(service ? text : serviceIssue);
  if (active) {
    const task = active;
    if (task.analysisKey) {
      resetShownAnalysis();
      $('configuration').dispatchEvent(new CustomEvent('agent-reset', { detail: '本次 Agent 分析已失效，请重新提交或使用本地查询。' }));
      delete task.analysisKey;
    }
    task.cancelled = true;
    task.controller.abort();
    task.wake?.();
    if (task.kind === 'run') void stop(task).catch(error => { if (error.code !== 'auth_required' && active === task) note('取消尚未确认，请再次点击取消或检查服务。', true); });
  }
  controls();
}
// 输入框变化的轻提示：不清空回答、不取消任务、不改变会话；是否作为追问由提交时的服务端决定。
// 任务运行中保持进度文字不被覆盖；登录失效与服务不可用的提示优先，与原先一致。
function inputHint() {
  if (active) return;
  if (needsLogin) loginNote(); else note(service ? '输入已变化，提交后将作为追问或新查询处理；上方已有回答保留。' : serviceIssue);
}
function link(parent, href, text) {
  let url;
  try { url = new URL(href, location.href); } catch { return; }
  if (!['http:', 'https:'].includes(url.protocol)) return;
  const el = node('a', text, parent);
  el.href = url.href; el.target = '_blank'; el.rel = 'noopener noreferrer';
}
function evidence(parent, ids, fact, citations) {
  if (!ids?.length) { node('p', '尚未记录该项字段级来源；不借用其他源码作为证明。', parent, 'verification-notes'); return; }
  for (const id of ids) {
    const citation = citations.find(item => item.entryId === fact.entryId && item.field === fact.field && item.sourceId === id);
    if (!citation) { node('p', `来源 ${id} 尚未提供。`, parent, 'verification-notes'); continue; }
    const block = node('details', undefined, parent, 'source-block');
    node('summary', `${id} · ${citation.file}:${citation.start_line}–${citation.end_line}`, block);
    node('p', `固定 revision：${citation.revision}`, block, 'source-meta');
    link(block, citation.url, '查看固定源码锚点');
    node('pre', citation.quote, block);
  }
}
// 核实状态映射到徽标色调：已核实为绿色，不适用为中性灰，其余（含未知状态）一律按待核实的琥珀色处理。
const statusTone = status => status === 'verified' ? 'verified' : status === 'not_applicable' ? 'neutral' : 'pending';
// 知识条目 ID 约定为“组件--模块--指令名”；拆出指令名作卡片标题、模块作副标题。
// 不符合约定的 ID 整段作为标题，避免误拆。
function entryParts(entryId) {
  const parts = String(entryId).split('--');
  return parts.length >= 3 ? { name: parts.slice(2).join('--'), module: parts[1] } : { name: String(entryId), module: '' };
}
function factBody(parent, value, fact, citations) {
  const status = value?.status ?? fact.status;
  // 功能/语法未登记字段出处，但条目已基础核对：用中性“待补出处”，不与仅注册信息条目的“未核实”混用。
  // 条目评级只决定这个措辞，绝不会让字段变成“已核实”。
  const pending = ['summary', 'syntax'].includes(fact.field) && status === 'unverified' && ['basic_verified', 'deep_verified'].includes(fact.verification);
  // 状态徽标放在正文前，用户先看到“这条是否已核实”，再读内容。
  node('span', pending ? FIELD_PENDING_LABEL : labels[status] ?? '未核实', parent, `fact-status ${pending ? 'neutral' : statusTone(status)}`);
  const text = typeof value === 'string' ? value : value?.text;
  node('p', typeof text === 'string' && text.trim() ? text : '该字段尚未记录正文，不代表不存在限制或行为。', parent, 'fact-text');
  if (value?.note) node('p', value.note, parent, 'verification-notes');
  const ids = value?.source_ids ?? fact.source_ids;
  if (pending && !ids?.length) node('p', FIELD_PENDING_NOTE, parent, 'verification-notes');
  else evidence(parent, ids, fact, citations);
}
function showConfiguration(parent, request, title) {
  const preview = node('details', undefined, parent, 'resolved-input');
  node('summary', title, preview);
  node('pre', request.input, preview, 'syntax');
  node('p', `查询问题：${request.question || '功能、限制与代码实现'}`, preview, 'verification-notes');
}
// 无需知识查询的动作：澄清、范围外、问候只展示固定话术，不展示配置预览或“没有可展示的模型选取”。
const NO_QUERY_ACTIONS = new Set(['clarify', 'out_of_scope', 'greeting']);
// 外部参考标题：仅 https 且不带用户信息、不带端口的地址才设置 href，其余（javascript:、data:、带凭据或端口等）只作为纯文本显示，不可点击。
// 带凭据或端口的地址常用于伪装真实主机，宿主白名单之外再加一层前端兜底。
// 标题来自外部网页，必须通过 node() 的 textContent 写入，不能拼接 HTML 字符串。
function externalTitle(parent, href, text) {
  let url = null;
  try { url = new URL(href); } catch { url = null; }
  if (url?.protocol !== 'https:' || url.username || url.password || url.port) return node('span', text, parent, 'external-ref-title');
  const el = node('a', text, parent, 'external-ref-title');
  el.href = url.href; el.target = '_blank'; el.rel = 'noopener noreferrer';
  return el;
}
// 外部参考区块：来自联网搜索，未按锁定版本核实，因此与源码事实卡片分开，用虚线与琥珀色标示。
// 标题与说明由宿主固定；站点名与引文来自外部页面，只能作为文本写入。
function externalReferences(parent, references) {
  const section = node('section', undefined, parent, 'external-refs');
  node('h3', '外部参考（未按锁定版本核实）', section);
  node('p', '来自联网搜索，仅供参考；内容可能对应其他版本，未经本站源码核对。', section, 'verification-notes');
  for (const ref of references) {
    const item = node('article', undefined, section, 'external-ref');
    externalTitle(item, ref.url, ref.title || ref.url);
    if (ref.site) node('p', ref.site, item, 'external-ref-site');
    // 引文为空时不渲染空 blockquote，避免出现无内容的引用块。
    if (ref.quote) node('blockquote', ref.quote, item, 'external-ref-quote');
  }
}
// ---------- 配置校验块 ----------
// 后端 job.validation（或会话恢复返回的 validation）的形状固定，但前端不信任它：任何缺失或非法形状一律返回 null，整块不显示，也不抛错。
// 所有文本只经 node() 的 textContent 写入。展示数量另有前端上限，避免异常数据撑破页面。
const VALIDATION_VERDICTS = { pass: { symbol: '✓', title: '通过' }, fail: { symbol: '✗', title: '未通过' }, needs_input: { symbol: '…', title: '需要补充' } };
const VALIDATION_STATUS = { pass: { symbol: '✓', label: '通过' }, fail: { symbol: '✗', label: '不通过' }, needs_input: { symbol: '…', label: '需要补充' }, skipped: { symbol: '–', label: '未检查' } };
const MAX_VALIDATION_CHECKS = 10;
const MAX_VALIDATION_ISSUES = 20; // 每项检查最多渲染的 issues 条数，超出只显示“另有 N 条”
const MAX_VALIDATION_TEXT = 300; // 单条文本最大字符数（按码点），超出截断
const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const clip = text => { const chars = Array.from(text); return chars.length > MAX_VALIDATION_TEXT ? `${chars.slice(0, MAX_VALIDATION_TEXT).join('')}…` : text; };
// 校验并整理 validation；返回干净的副本或 null。要求：verdict 合法；checks 为数组且每项有字符串 title、合法 status、
// issues（缺省视为空）为数组，其元素是对象且 line 为整数、message 为字符串，可选 suggestions 必须是字符串数组；notChecked 缺省视为空，出现时必须是字符串数组。
function normalizeValidation(value) {
  if (!isPlainObject(value) || !Object.hasOwn(VALIDATION_VERDICTS, value.verdict) || !Array.isArray(value.checks)) return null;
  const checks = [];
  for (const check of value.checks) {
    if (!isPlainObject(check) || typeof check.title !== 'string' || !check.title.trim() || !Object.hasOwn(VALIDATION_STATUS, check.status)) return null;
    const rawIssues = check.issues ?? [];
    if (!Array.isArray(rawIssues)) return null;
    const issues = [];
    for (const issue of rawIssues) {
      if (!isPlainObject(issue) || !Number.isInteger(issue.line) || typeof issue.message !== 'string') return null;
      if (issue.suggestions !== undefined && (!Array.isArray(issue.suggestions) || issue.suggestions.some(item => typeof item !== 'string'))) return null;
      issues.push({ line: issue.line, message: clip(issue.message), suggestions: (issue.suggestions ?? []).slice(0, 5).map(clip) });
    }
    checks.push({ title: clip(check.title), status: check.status, issues });
  }
  const notChecked = value.notChecked ?? [];
  if (!Array.isArray(notChecked) || notChecked.some(item => typeof item !== 'string')) return null;
  return { verdict: value.verdict, checks: checks.slice(0, MAX_VALIDATION_CHECKS), notChecked: notChecked.map(clip) };
}
// 渲染到 parent 的最前面（调用方保证先调用）。通过时折叠为一行摘要，未通过/需要补充时默认展开；状态用符号+文字，不只靠颜色。
function renderValidation(parent, validation) {
  const info = VALIDATION_VERDICTS[validation.verdict];
  const block = node('details', undefined, parent, `validation-block ${validation.verdict}`);
  block.open = validation.verdict !== 'pass';
  node('summary', `${info.symbol} 配置校验：${info.title}`, block);
  const list = node('ul', undefined, block, 'validation-checks');
  for (const check of validation.checks) {
    const status = VALIDATION_STATUS[check.status];
    const row = node('li', undefined, list, `validation-check ${check.status}`);
    node('span', status.symbol, row, 'validation-mark');
    node('span', `${check.title}：${status.label}`, row, 'validation-title');
    // 只有不通过/需要补充的项才列出具体问题；通过与未检查的项不展开。
    if (['fail', 'needs_input'].includes(check.status) && check.issues.length) {
      const issues = node('ul', undefined, row, 'validation-issues');
      for (const issue of check.issues.slice(0, MAX_VALIDATION_ISSUES)) {
        const item = node('li', `第 ${issue.line} 行：${issue.message}`, issues);
        if (issue.suggestions.length) node('span', `正确写法：${issue.suggestions.join('、')}`, item, 'validation-suggest');
      }
      if (check.issues.length > MAX_VALIDATION_ISSUES) node('li', `另有 ${check.issues.length - MAX_VALIDATION_ISSUES} 条未显示`, issues, 'verification-notes');
    }
  }
  if (validation.notChecked.length) node('p', `未校验：${validation.notChecked.join('、')}`, block, 'verification-notes validation-scope');
}
function render(job, task) {
  if (job.knowledgeVersion?.release && job.knowledgeVersion.release !== task.request.release) throw new Error('结果发布与当前请求不一致，请刷新知识站。');
  // 轮次卡在首次渲染时才创建：被服务端拒绝、发布不一致等尚无结果的失败不会留下空卡。
  task.turn ??= addTurn(summarizeInput(task.request?.message));
  const result = task.turn.body; result.replaceChildren();
  task.turn.state.textContent = labels[job.state] ?? job.state ?? '';
  // 每个任务首次出结果时把本轮卡滚入视野，告诉用户“接下来看这里”；后续轮询不再打断阅读。
  if (!task.revealed) { task.revealed = true; task.turn.root.scrollIntoView?.({ behavior: 'smooth', block: 'start' }); }
  const state = labels[job.state] ?? job.state;
  const phase = job.state !== 'running' ? '' : job.phase === 'input_resolution' ? ' · 正在识别配置与问题' : job.summary ? ' · 基础匹配已就绪，等待模型选取' : ' · 正在准备知识与会话';
  note(`${state}${phase}${job.cacheHit ? ' · 历史精确缓存（本次未推理）' : ''}${job.error ? ` · ${job.error}` : ''}`, job.state === 'failed');
  // 配置校验块放在本轮内容的最前面（先于识别配置折叠块、统计与模型选取）；形状非法时 validation 为 null，整块不显示。
  const validation = normalizeValidation(job.validation);
  if (validation) renderValidation(result, validation);
  if (job.inputResolution?.message) node('p', job.inputResolution.message, result, 'notice');
  // 消息中有未处理的跑题部分时，在结果区说明，避免用户误以为整条消息都已处理。
  if (job.inputResolution?.notice) node('p', job.inputResolution.notice, result, 'verification-notes');
  // 本轮是否“拥有”右侧：渲染了 normalizedRequest 且不是澄清/范围外/问候这类不更新右侧的动作。
  // 下面的块执行后，右侧要么已被本轮替换，要么与 shownAnalysisKey 一致（本轮对象与已显示对象相同）。
  task.ownsRight = Boolean(job.normalizedRequest) && !NO_QUERY_ACTIONS.has(job.inputResolution?.action);
  if (job.normalizedRequest && !NO_QUERY_ACTIONS.has(job.inputResolution?.action)) {
    const request = job.normalizedRequest;
    showConfiguration(result, request, job.inputResolution?.action === 'followup' ? '本次沿用的配置（展开核对）' : '本次识别的配置 / 指令（展开核对）');
    // 右侧候选/详情只在对象真的变化时替换：追问沿用同一对象时不重置，也不让本任务“拥有”右侧（取消追问不应清掉上一轮的对象）。
    const key = analysisKey(request);
    if (key !== shownAnalysisKey) {
      shownAnalysisKey = key;
      task.analysisKey = key;
      $('configuration').dispatchEvent(new CustomEvent('agent-analysis', { detail: request }));
    }
  }
  if (job.summary) {
    // 识别统计改为一排标签：唯一匹配用绿色，需关注与未分析的外部引用在非零时用琥珀色提醒。
    const chips = node('p', undefined, result, 'agent-summary');
    const s = job.summary;
    for (const [label, value, tone] of [
      ['普通指令', s.directives, ''],
      ['唯一匹配', s.matched, 'good'],
      ['需关注', s.attention, s.attention ? 'warn' : ''],
      ['块内条目', s.block_entries, ''],
      ['外部引用未分析', s.external_references, s.external_references ? 'warn' : ''],
    ]) node('span', `${label} ${value}`, chips, `chip ${tone}`.trim());
  }
  for (const question of job.questions ?? []) if (question !== job.inputResolution?.message) node('p', question, result, 'verification-notes');
  if (job.state === 'running') {
    // 运行中给出占位，让“第 2 步”有明确的等待反馈；最终结果到达时整个区域会被重绘。
    node('p', job.phase === 'input_resolution' ? '正在识别配置与问题…' : job.summary ? '基础匹配已完成，正在挑选回答要点…' : '正在准备知识与会话…', result, 'agent-pending');
    return;
  }
  for (const error of job.parsed?.errors ?? []) node('p', `解析诊断：${error.message}（${error.line}:${error.column}）`, result, 'query-message error');
  const selection = job.modelSelection;
  // 外部参考由宿主校验后才写入 webReferences。不合规的条目只计个数，页面用固定文案说明，不展示被丢掉的原文。
  const references = Array.isArray(job.webReferences) ? job.webReferences : [];
  // 本次确实联网（有调用）或仍保留了部分参考时，说“部分未通过校验”；否则（联网关闭或本次没有结果）用户从未见过外部参考，
  // 若仍说“未通过校验”会让人误以为系统联网查过，改用中性文案。两句都是固定文案，不拼接被丢弃的网址或引文。
  if (Number.isInteger(job.webRefsDropped) && job.webRefsDropped > 0) {
    const searched = references.length > 0 || (Number.isInteger(job.webSearch?.calls) && job.webSearch.calls > 0);
    node('p', searched ? '部分外部参考未通过校验，已省略' : '模型给出的外部参考无法核实，已忽略', result, 'verification-notes');
  }
  const hasReferences = references.length > 0;
  // 三条状态文案互斥，只依据“是否有事实”与 inputResolution.unindexed 判断，不依赖模型是否输出 status（契约不强制 status）。
  const noFacts = !selection?.resolvedFacts?.length;
  const unindexed = Boolean(job.inputResolution?.unindexed) && noFacts && Boolean(selection);
  // 未收录优先：知识发布中没有这个名称，不能笼统地说“未生成解释”或“没有可展示的模型选取”。
  if (unindexed) node('p', hasReferences ? '当前知识发布未收录该指令。下面是联网找到的外部参考。' : '当前知识发布未收录该指令。', result);
  else if (selection?.status === 'unsupported') node('p', hasReferences ? '当前知识字段无法回答此问题；下面是联网找到的外部参考。' : '当前知识字段无法回答此问题；未生成自由解释，请调整问题。', result);
  // 仅在确实没有任何可展示内容时提示；有外部参考时外部参考区块本身就是可读结果，不再显示此句。
  // 闸门拦截：只有后端确实跳过了模型（metrics.gate.modelSkipped === true，目前只有 verdict 为 fail 时），且任务已结束，才说明“没有继续查询”。
  // needs_input 仍会调用模型，运行中 validation 已写入但选取尚空，两种情况都不能写这句；老数据没有 metrics.gate 时也不写。
  const gateSkipped = job.state !== 'running' && validation?.verdict === 'fail' && job.metrics?.gate?.modelSkipped === true && noFacts;
  // 闸门拦截时应改配置而不是“补充问题后重试”，因此压掉下面这句建议，避免与原因句叠加矛盾。
  if (noFacts && !unindexed && !NO_QUERY_ACTIONS.has(job.inputResolution?.action) && !hasReferences && !gateSkipped) node('p', '本次没有可展示的模型选取。可使用本地查询查看知识，或补充问题后重试。', result);
  if (gateSkipped) node('p', '配置校验未通过，没有继续查询知识字段。', result);
  // 按知识条目分组：同一指令的多个字段放进一张卡片，用户按“指令”而不是按“字段”阅读。
  // Map 保留模型返回的先后顺序，组内字段顺序也不变。
  const groups = new Map();
  for (const fact of selection?.resolvedFacts ?? []) {
    if (!groups.has(fact.entryId)) groups.set(fact.entryId, []);
    groups.get(fact.entryId).push(fact);
  }
  const citations = selection?.citations ?? [];
  for (const [entryId, facts] of groups) {
    const card = node('article', undefined, result, 'agent-entry');
    const head = node('header', undefined, card, 'agent-entry-head');
    const { name, module } = entryParts(entryId);
    node('h3', name, head);
    // 副标题只显示模块；完整条目 ID 放进悬停提示，供需要核对时查看。
    node('p', module || entryId, head, 'agent-identity').setAttribute('title', entryId);
    // 详情链接绑定本次请求的发布，避免跳到最新发布后内容不一致。
    const url = new URL(appBase); url.searchParams.set('id', entryId); url.searchParams.set('release', task.request.release);
    link(head, url.href, '完整知识详情 ↗');
    for (const fact of facts) {
      // 每个字段一行：左列字段名，右列状态徽标、正文与源码证据。
      const row = node('section', undefined, card, 'agent-fact');
      node('h4', labels[fact.field] ?? fact.field, row, 'agent-fact-label');
      const body = node('div', undefined, row, 'agent-fact-body');
      if (Array.isArray(fact.value)) {
        if (!fact.value.length) node('p', '尚未记录限制，不代表没有限制。', body, 'fact-text');
        for (const value of fact.value) factBody(node('div', undefined, body, 'agent-subfact'), value, fact, citations);
      } else {
        factBody(body, fact.value, fact, citations);
        if (fact.field === 'runtime' && fact.value) {
          for (const [i, step] of (fact.value.steps ?? []).entries()) {
            const item = node('div', undefined, body, 'agent-subfact');
            node('h5', `步骤 ${i + 1} · ${step.condition}`, item); node('p', step.action, item, 'fact-text');
            evidence(item, step.source_ids, fact, citations);
          }
          if (fact.value.corroboration_source_ids?.length) {
            node('h5', '交叉印证', body);
            evidence(body, fact.value.corroboration_source_ids, fact, citations);
          }
        }
      }
    }
  }
  // 外部参考位于模型事实卡片之后，与源码证据区分；仅在存在有效参考时渲染。
  if (hasReferences) externalReferences(result, references);
  for (const text of job.limitations ?? []) node('p', text, result, 'verification-notes');
  if (job.metrics) node('p', `本次模型请求 ${job.metrics.modelRoundTrips ?? 0} 次 · 总耗时 ${Math.round(job.metrics.totalMs ?? 0)} ms · 模型原始最终输出 ${job.metrics.finalOutputBytes ?? 0} bytes`, result, 'agent-metrics');
}
function pause(task) {
  return new Promise(resolve => {
    const timer = setTimeout(() => { task.wake = null; resolve(); }, service.pollIntervalMs);
    task.wake = () => { clearTimeout(timer); task.wake = null; resolve(); };
  });
}
async function submit(event) {
  event.preventDefault();
  if (active || interrupted || needsLogin || !service || !document.body.dataset.release) return;
  const request = currentRequest();
  if (!request.message.trim()) { note('请输入配置、问题或追问。', true); return; }
  const task = { kind: 'run', generation: ++generation, fingerprint: fingerprint(), request, controller: new AbortController() };
  active = task; note('正在提交到 Agent…'); controls();
  try {
    // 提交响应必须接收 requestId；输入变化时随后取消，不能先中断请求而丢失任务身份。
    let job = await api('/api/run', { request, ...(sessionId ? { sessionId } : {}) });
    task.requestId = job.requestId;
    task.sessionId = job.sessionId;
    if (!current(task)) { task.cancelled = true; await stop(task); return; }
    remember(job.sessionId);
    saveSession(job.sessionId, listTitle(request.message));
    await followJob(task, job);
    if (!current(task) && !task.terminal) task.cancelled = true;
  } catch (error) {
    if (error.code === 'auth_required' && active === task) requireLogin(task);
    else if (current(task)) { task.cancelled = true; if (error.code === 'job_unavailable') task.terminal = true; settleTurn(task.turn, '未完成'); note(`Agent 未完成：${error.message}。原查询不受影响。`, true); }
  } finally { await finish(task); }
}
async function finish(task) {
  if (task.cancelled && !task.authPaused && task.kind === 'run') {
    try { await stop(task); }
    catch (error) { if (error.code !== 'auth_required' && active === task) note('取消尚未确认，请再次点击取消或检查服务。', true); }
  }
  if ((task.cancelConfirmed || task.terminal) && interrupted?.requestId === task.requestId) interrupted = null;
  if (active === task && (!task.cancelled || !task.requestId || task.cancelConfirmed || task.terminal || task.authPaused)) active = null;
  controls();
}
async function followJob(task, job) {
  while (current(task)) {
    task.terminal = job.state !== 'running';
    if (job.normalizedRequest) trackedSubject = job.normalizedRequest;
    if (task.showResults === false) {
      if (task.turn) task.turn.state.textContent = `原任务${labels[job.state] ?? job.state}（结果未回填）`;
      note(`原任务${labels[job.state] ?? job.state}；当前输入已保留，未回填旧结果。`);
    }
    else {
      render(job, task);
      // 终态渲染完成后告知提交时的消息：app 据此判断输入框是否已被改动，决定右侧是否标注“上一次识别的对象”。
      if (task.terminal && task.turn) $('configuration').dispatchEvent(new CustomEvent('agent-turn-done', { detail: { message: task.request?.message ?? '', owned: Boolean(task.ownsRight) } }));
    }
    if (task.terminal) { if (interrupted?.requestId === task.requestId) interrupted = null; break; }
    await pause(task);
    if (!current(task)) { task.cancelled = true; break; }
    job = await api(`/api/jobs/${task.requestId}?brief=1`, undefined, task.controller.signal);
  }
}
// 恢复被“用户编辑输入”放弃时写明原因，避免状态栏停在“正在恢复…”；其他放弃原因（新会话、发布变化等）各自已有提示。
function abandonRestore(task) {
  if (task.kind === 'restore' && active === task && !task.cancelled && task.generation === generation && task.fingerprint !== fingerprint()) note('输入已变化，已放弃本次恢复回填；输入已保留，可重新点击“恢复会话”。');
  return 'aborted';
}
async function restore() {
  if (active || !(sessionId || interrupted)) return 'aborted';
  const recoveringJob = Boolean(interrupted);
  const preserveInput = authDraftProtected || recoveringJob;
  const task = { kind: 'restore', generation: ++generation, fingerprint: fingerprint(), controller: new AbortController() };
  active = task; note('正在恢复服务端会话…'); controls();
  try {
    if ((needsLogin || !service) && !await probe()) return 'failed';
    if (!current(task)) return abandonRestore(task);
    if (interrupted) {
      const pending = interrupted;
      let job;
      try { job = await api(`/api/jobs/${pending.requestId}?brief=1`, undefined, task.controller.signal); }
      catch (error) { if (error.code !== 'job_unavailable') throw error; }
      if (!current(task)) return abandonRestore(task);
      if (pending.sessionId) remember(pending.sessionId);
      if (!job) settleTurn(pending.turn, '任务不可续传');
      if (job) {
        Object.assign(task, { kind: 'run', requestId: pending.requestId, sessionId, request: pending.request, turn: pending.turn, showResults: pending.showResults !== false && pending.fingerprint === task.fingerprint });
        controls();
        await followJob(task, job);
        if (current(task) && task.terminal) authDraftProtected = false;
        return 'ok';
      }
    }
    const saved = await api(`/api/sessions/${sessionId}`, undefined, task.controller.signal);
    if (!current(task)) return abandonRestore(task);
    if (saved.request.release && saved.request.release !== document.body.dataset.release) throw new Error('会话属于另一知识发布，请先打开对应发布后恢复，或新建会话');
    interrupted = null;
    authDraftProtected = false;
    active = null;
    trackedSubject = saved.currentSubject ?? saved.currentConfig ?? null;
    if (sessionId) saveSession(sessionId, directiveName(trackedSubject) || undefined);
    if (!preserveInput) {
      $('configuration').value = saved.request.message ?? [saved.request.input, saved.request.question].filter(Boolean).join('\n\n');
      $('configuration').dispatchEvent(new Event('input'));
      // 切换/恢复会话是有意的边界：对话流与右侧候选/详情完全清空，只显示恢复出的当前对象（服务端不返回完整历史报告）。
      clearConversation();
      resetShownAnalysis();
      $('configuration').dispatchEvent(new CustomEvent('agent-reset', { detail: '已恢复会话；右侧只显示恢复的当前对象，不含历史轮次。' }));
    }
    const restoredConfig = saved.currentSubject ?? saved.currentConfig ?? saved.normalizedRequest;
    // 后端恢复时返回的说明（如配置里指令名的大小写提示、未处理的无关部分）：只作为文本显示在恢复卡里。
    const restoredNotice = typeof saved.inputResolution?.notice === 'string' ? saved.inputResolution.notice.trim() : '';
    // 后端 restore 若带回 validation，在恢复卡最前面同样展示；没有或形状非法则不显示。
    const restoredValidation = normalizeValidation(saved.validation);
    if (!preserveInput && (restoredConfig?.input || restoredNotice || restoredValidation)) {
      const turn = addTurn('会话已恢复（仅当前对象，不含历史轮次）');
      turn.state.textContent = '已恢复';
      if (restoredValidation) renderValidation(turn.body, restoredValidation);
      if (restoredNotice) node('p', restoredNotice, turn.body, 'verification-notes');
      if (restoredConfig?.input) {
        // 没有通过校验的当前对象、仅剩被拦下的错误配置时，标题如实说明，避免把错误配置当成会话配置。
        const blockedOnly = !(saved.currentSubject ?? saved.currentConfig) && restoredValidation?.verdict === 'fail';
        showConfiguration(turn.body, restoredConfig, blockedOnly ? '最近一次提交（校验未通过，未作为会话配置）' : '恢复的会话配置 / 指令（展开核对；不是历史完整报告）');
        if (restoredConfig.release === document.body.dataset.release) {
          shownAnalysisKey = analysisKey(restoredConfig);
          $('configuration').dispatchEvent(new CustomEvent('agent-analysis', { detail: restoredConfig }));
        }
      }
    }
    note(`已恢复 ${saved.messages} 条会话记录；${preserveInput ? `${recoveringJob ? '旧任务不可续传，' : ''}当前输入已保留，未自动提交；` : saved.request.message === undefined ? '旧会话的配置与问题已合并到输入框；' : ''}${saved.interrupted ? '已丢弃中断轮次；' : ''}${saved.knowledgeChanged || saved.contractChanged ? '知识或契约已变化，下次提交按当前发布重新选取。' : '可继续追问。'}`);
    return 'ok';
  } catch (error) {
    if (error.code === 'auth_required' && active === task) { requireLogin(task); return 'failed'; }
    if (task.kind === 'restore' && error.code === 'session_unavailable' && current(task)) {
      const expiredId = sessionId;
      dropSession(expiredId);
      remember('');
      note('会话已过期', true);
      return 'expired';
    }
    if (current(task)) {
      if (task.kind === 'run') { task.cancelled = true; if (error.code === 'job_unavailable') task.terminal = true; settleTurn(task.turn, '恢复未完成'); }
      note(`恢复未完成：${error.message}`, true);
      return 'failed';
    }
    return abandonRestore(task);
  }
  finally { await finish(task); }
}
$('agent-form').addEventListener('submit', submit);
// 本地查询会替换右侧候选/详情：先让“已显示的 Agent 对象”失效，之后的追问即使对象相同也要重新派发。
$('query-form').addEventListener('submit', () => { resetShownAnalysis(); if (active) invalidate('已切换到本地查询，正在取消之前的 Agent 请求。', { keepConversation: true }); }, { capture: true });
// “浏览全部目录”同样会清掉右侧的 Agent 对象。
$('browse-all')?.addEventListener('click', resetShownAnalysis);
// 右侧没有采用本次 Agent 对象（查询失败、发布不一致被忽略）：已显示对象失效，下一次同对象提交要重新派发。
$('configuration').addEventListener('agent-analysis-failed', resetShownAnalysis);
$('agent-cancel').addEventListener('click', () => {
  const task = active;
  invalidate('正在确认取消；已有轮次保留，本轮不再更新…', { keepConversation: true });
  if (task?.requestId) void stop(task).then(() => { if (task.authPaused) return; if (interrupted?.requestId === task.requestId) interrupted = null; if (active === task) { active = null; controls(); } if (task.generation + 1 === generation) note('已取消；基础查询仍可使用。'); }).catch(() => {});
});
$('agent-new').addEventListener('click', () => { interrupted = null; authDraftProtected = false; trackedSubject = null; invalidate('已开启新会话，不再沿用之前的配置；输入框内容保留，提交后开始处理。'); remember(''); resetShownAnalysis(); $('configuration').dispatchEvent(new CustomEvent('agent-reset')); });
$('agent-restore').addEventListener('click', restore);
$('agent-retry').addEventListener('click', probe);
$('configuration').addEventListener('input', inputHint);
new MutationObserver(() => {
  const next = document.body.dataset.release ?? '';
  if (next !== release) {
    // 首次加载（之前没有发布）只提示可以开始；中途发布变化才要求重新发送。
    const firstLoad = !release;
    release = next;
    invalidate(service ? (firstLoad ? 'Agent 已就绪；输入配置、问题或追问后提交。' : '知识发布已变化，请明确发送当前问题。') : '知识发布已加载；Agent 尚未连接，原查询仍可使用。');
  }
  controls();
}).observe(document.body, { attributes: true, attributeFilter: ['data-release'] });
controls();
void probe();
