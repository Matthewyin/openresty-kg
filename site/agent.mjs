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
function controls() {
  const ready = Boolean(service && !needsLogin && document.body.dataset.release);
  $('agent-submit').disabled = !ready || Boolean(active) || Boolean(interrupted);
  $('agent-submit').textContent = sessionId ? '继续提交' : '提交给 Agent';
  $('agent-cancel').disabled = !active || active.kind !== 'run';
  $('agent-restore').disabled = !(ready || needsLogin) || !(sessionId || interrupted) || Boolean(active);
  $('agent-retry').disabled = Boolean(active);
  $('agent-session').textContent = sessionId || '未创建';
  $('agent-result').setAttribute('aria-busy', String(Boolean(active)));
}
function remember(id) {
  sessionId = id;
  try { if (id) localStorage.setItem(storageKey, id); else localStorage.removeItem(storageKey); } catch {}
  controls();
}
function currentRequest() {
  return { message: $('configuration').value, release: document.body.dataset.release };
}
const fingerprint = () => JSON.stringify(currentRequest());
const current = task => active === task && !task.cancelled && task.generation === generation && task.fingerprint === fingerprint();
function loginNote() {
  note(`登录已失效，请重新登录后点击“${sessionId || interrupted ? '恢复会话' : '重新检测服务'}”；输入已保留。${interrupted ? '任务标识已保留，后端任务可能仍在运行，未确认取消。' : ''}`, true);
  link($('agent-status'), new URL('/login', appBase).href, '打开登录页');
}
function requireLogin(task) {
  needsLogin = true;
  authDraftProtected = true;
  if (task) {
    task.authPaused = true;
    task.controller.abort();
    task.wake?.();
    if (task.requestId && !task.terminal) interrupted = task;
    if (active === task) active = null;
  }
  environment('需要重新登录', 'login');
  loginNote();
  controls();
}
async function api(path, body, signal) {
  const timeout = service?.requestTimeoutMs ?? Number($('agent-panel').dataset.probeTimeoutMs);
  const response = await fetch(new URL(path.replace(/^\//, ''), appBase), { method: body === undefined ? 'GET' : 'POST', cache: 'no-store',
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
function invalidate(text = '输入已变化，请重新发送；旧结果不再用于当前输入。') {
  generation++;
  $('agent-result').replaceChildren();
  if (needsLogin) loginNote(); else note(service ? text : serviceIssue);
  if (active) {
    const task = active;
    if (task.analysisKey) {
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
function render(job, task) {
  if (job.knowledgeVersion?.release && job.knowledgeVersion.release !== task.request.release) throw new Error('结果发布与当前请求不一致，请刷新知识站。');
  const result = $('agent-result'); result.replaceChildren();
  // 每个任务首次出结果时把回答区滚入视野，告诉用户“接下来看这里”；后续轮询不再打断阅读。
  if (!task.revealed) { task.revealed = true; result.closest?.('section')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }); }
  const state = labels[job.state] ?? job.state;
  const phase = job.state !== 'running' ? '' : job.phase === 'input_resolution' ? ' · 正在识别配置与问题' : job.summary ? ' · 基础匹配已就绪，等待模型选取' : ' · 正在准备知识与会话';
  note(`${state}${phase}${job.cacheHit ? ' · 历史精确缓存（本次未推理）' : ''}${job.error ? ` · ${job.error}` : ''}`, job.state === 'failed');
  if (job.inputResolution?.message) node('p', job.inputResolution.message, result, 'notice');
  if (job.normalizedRequest && job.inputResolution?.action !== 'clarify') {
    const request = job.normalizedRequest;
    showConfiguration(result, request, job.inputResolution?.action === 'followup' ? '本次沿用的配置（展开核对）' : '本次识别的配置 / 指令（展开核对）');
    const key = JSON.stringify(request);
    if (task.analysisKey !== key) {
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
  if (selection?.status === 'unsupported') node('p', '当前知识字段无法回答此问题；未生成自由解释，请调整问题。', result);
  if (!selection?.resolvedFacts?.length && job.inputResolution?.action !== 'clarify') node('p', '本次没有可展示的模型选取。可使用本地查询查看知识，或补充问题后重试。', result);
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
  active = task; $('agent-result').replaceChildren(); note('正在提交到 Agent…'); controls();
  try {
    // 提交响应必须接收 requestId；输入变化时随后取消，不能先中断请求而丢失任务身份。
    let job = await api('/api/run', { request, ...(sessionId ? { sessionId } : {}) });
    task.requestId = job.requestId;
    task.sessionId = job.sessionId;
    if (!current(task)) { task.cancelled = true; await stop(task); return; }
    remember(job.sessionId);
    await followJob(task, job);
    if (!current(task) && !task.terminal) task.cancelled = true;
  } catch (error) {
    if (error.code === 'auth_required' && active === task) requireLogin(task);
    else if (current(task)) { task.cancelled = true; if (error.code === 'job_unavailable') task.terminal = true; note(`Agent 未完成：${error.message}。原查询不受影响。`, true); }
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
    if (task.showResults === false) note(`原任务${labels[job.state] ?? job.state}；当前输入已保留，未回填旧结果。`);
    else render(job, task);
    if (task.terminal) { if (interrupted?.requestId === task.requestId) interrupted = null; break; }
    await pause(task);
    if (!current(task)) { task.cancelled = true; break; }
    job = await api(`/api/jobs/${task.requestId}?brief=1`, undefined, task.controller.signal);
  }
}
async function restore() {
  if (active || !(sessionId || interrupted)) return;
  const recoveringJob = Boolean(interrupted);
  const preserveInput = authDraftProtected || recoveringJob;
  const task = { kind: 'restore', generation: ++generation, fingerprint: fingerprint(), controller: new AbortController() };
  active = task; note('正在恢复服务端会话…'); controls();
  try {
    if ((needsLogin || !service) && !await probe()) return;
    if (!current(task)) return;
    if (interrupted) {
      const pending = interrupted;
      let job;
      try { job = await api(`/api/jobs/${pending.requestId}?brief=1`, undefined, task.controller.signal); }
      catch (error) { if (error.code !== 'job_unavailable') throw error; }
      if (!current(task)) return;
      if (pending.sessionId) remember(pending.sessionId);
      if (job) {
        Object.assign(task, { kind: 'run', requestId: pending.requestId, sessionId, request: pending.request, showResults: pending.showResults !== false && pending.fingerprint === task.fingerprint });
        controls();
        await followJob(task, job);
        if (current(task) && task.terminal) authDraftProtected = false;
        return;
      }
    }
    const saved = await api(`/api/sessions/${sessionId}`, undefined, task.controller.signal);
    if (!current(task)) return;
    if (saved.request.release && saved.request.release !== document.body.dataset.release) throw new Error('会话属于另一知识发布，请先打开对应发布后恢复，或新建会话');
    interrupted = null;
    authDraftProtected = false;
    active = null;
    if (!preserveInput) {
      $('configuration').value = saved.request.message ?? [saved.request.input, saved.request.question].filter(Boolean).join('\n\n');
      $('configuration').dispatchEvent(new Event('input'));
    }
    const restoredConfig = saved.currentSubject ?? saved.currentConfig ?? saved.normalizedRequest;
    if (!preserveInput && restoredConfig?.input) {
      showConfiguration($('agent-result'), restoredConfig, '恢复的会话配置 / 指令（展开核对；不是历史完整报告）');
      if (restoredConfig.release === document.body.dataset.release) $('configuration').dispatchEvent(new CustomEvent('agent-analysis', { detail: restoredConfig }));
    }
    note(`已恢复 ${saved.messages} 条会话记录；${preserveInput ? `${recoveringJob ? '旧任务不可续传，' : ''}当前输入已保留，未自动提交；` : saved.request.message === undefined ? '旧会话的配置与问题已合并到输入框；' : ''}${saved.interrupted ? '已丢弃中断轮次；' : ''}${saved.knowledgeChanged || saved.contractChanged ? '知识或契约已变化，下次提交按当前发布重新选取。' : '可继续追问。'}`);
  } catch (error) {
    if (error.code === 'auth_required' && active === task) requireLogin(task);
    else if (current(task)) {
      if (task.kind === 'run') { task.cancelled = true; if (error.code === 'job_unavailable') task.terminal = true; }
      note(`恢复未完成：${error.message}`, true);
    }
  }
  finally { await finish(task); }
}
$('agent-form').addEventListener('submit', submit);
$('query-form').addEventListener('submit', () => { if (active) invalidate('已切换到本地查询，正在取消之前的 Agent 请求。'); }, { capture: true });
$('agent-cancel').addEventListener('click', () => {
  const task = active;
  invalidate('已停止旧结果显示，正在确认取消…');
  if (task?.requestId) void stop(task).then(() => { if (task.authPaused) return; if (interrupted?.requestId === task.requestId) interrupted = null; if (active === task) { active = null; controls(); } if (task.generation + 1 === generation) note('已取消；基础查询仍可使用。'); }).catch(() => {});
});
$('agent-new').addEventListener('click', () => { interrupted = null; authDraftProtected = false; invalidate('已开启新会话，不再沿用之前的配置；输入框内容保留，提交后开始处理。'); remember(''); $('configuration').dispatchEvent(new CustomEvent('agent-reset')); });
$('agent-restore').addEventListener('click', restore);
$('agent-retry').addEventListener('click', probe);
$('configuration').addEventListener('input', () => invalidate());
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
