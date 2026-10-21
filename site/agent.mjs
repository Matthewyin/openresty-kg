import { FIELD_PENDING_LABEL, FIELD_PENDING_NOTE } from './src/query/knowledge.mjs';
import { needsAttention } from './src/query/config-results.mjs';
import { getSelectedEntryId, selectDirective } from './selection.mjs';
import { analysisKey, attentionNamed } from './analysis-state.mjs';

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
// 历史会话列表：服务端保存、所有访问者共用；这里只缓存最近一次成功拉取并通过校验的结果供渲染。
let sessionList = [];
// 每次发起刷新递增；响应回来时序号落后就说明已有更新的请求，丢弃旧响应，防止旧数据覆盖新数据。
let refreshSeq = 0;
// 旧版本把列表存在浏览器 localStorage（`:list` 键），现已改为服务端存储，加载时顺手清掉残留。
// 注意：`${storageKey}` 本身（当前会话 ID）不动，它表示“这台浏览器当前在用哪个会话”。
try { localStorage.removeItem(`${storageKey}:list`); } catch {}
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
// #agent-turn-tabs 是横向标签栏，#agent-result 里每个轮次一个面板。
// 同一时刻只显示一轮（其余面板 hidden，DOM 仍在，迟到响应还能写回它自己的那一轮）。
// 新轮在 addTurn 时自动选中；之后的轮询渲染不再改选中项，所以用户点过旧轮后不会被后台刷新抢走。
// 最多保留 MAX_TURNS 轮，超出时从最旧一轮开始移除。历史轮不再发起任何网络请求。
const MAX_TURNS = 20;
const SUMMARY_LIMIT = 60;
const BLURB_LIMIT = 80;
let turns = []; // [{ root, body, state, tab, dot, attention, number, cards, ... }]，按时间从旧到新
let turnNumber = 0; // 单调递增的轮次号；被裁掉的旧轮不会让编号回退
let selectedTurn = null;

// 用户输入摘要：取第一行非空文本、折叠空白、按码点截断（不会截断代理对）。只作为文本节点内容，不当 HTML 解析。
function summarizeInput(message) {
  const line = String(message ?? '').split(/\r?\n/).map(item => item.replace(/\s+/g, ' ').trim()).find(Boolean) ?? '（空）';
  const chars = Array.from(line);
  return chars.length > SUMMARY_LIMIT ? `${chars.slice(0, SUMMARY_LIMIT).join('')}…` : line;
}
// 折叠行里的一句话：折叠连续空白，按码点截到 80，超出加省略号。纯文本，不解析标签。
function clipBlurb(text) {
  const collapsed = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!collapsed) return '';
  const chars = Array.from(collapsed);
  return chars.length > BLURB_LIMIT ? `${chars.slice(0, BLURB_LIMIT).join('')}…` : collapsed;
}
// 状态点只用三档，大纲和卡片共用同一套 class。
function setDot(dot, tone) {
  const name = tone === 'good' ? 'good' : tone === 'warn' ? 'warn' : 'muted';
  dot.className = `status-dot status-dot-${name}`;
  dot.dataset.tone = name;
}
// 把标签栏和面板按 turns 重新挂上。裁掉旧轮时两处一起换，避免标签和面板错位。
function mountTurns() {
  const tabs = $('agent-turn-tabs');
  const result = $('agent-result');
  if (!tabs || !result) return;
  tabs.replaceChildren(...turns.map(item => item.tab));
  result.replaceChildren(...turns.map(item => item.root));
  tabs.hidden = turns.length === 0;
}
// 只切换可见面板和 aria，不滚动、不重建内容。渲染函数不要调用它。
function selectTurn(turn) {
  if (!turn || !turns.includes(turn)) return;
  selectedTurn = turn;
  for (const item of turns) {
    const on = item === turn;
    item.root.hidden = !on;
    item.tab.setAttribute('aria-selected', on ? 'true' : 'false');
    item.tab.tabIndex = on ? 0 : -1;
  }
  const tabs = $('agent-turn-tabs');
  if (tabs) tabs.hidden = false;
  revealTab(turn);
}
// 窄屏标签栏横向溢出时，把选中标签横向滚进可视区。只改标签栏自身的 scrollLeft，不触发页面纵向滚动。
// 标签宽度会在“待处理 N”出现后变宽，所以 finishChrome 里对选中轮再调一次。
function revealTab(turn) {
  const tabs = $('agent-turn-tabs');
  const tab = turn?.tab;
  if (!tabs || !tab || !(tabs.clientWidth > 0) || !Number.isFinite(tab.offsetLeft)) return;
  const left = tab.offsetLeft - tabs.offsetLeft;
  // 右侧留出淡出遮罩的宽度，选中标签不会落在遮罩下面。
  if (left < tabs.scrollLeft) tabs.scrollLeft = left;
  else if (left + tab.offsetWidth > tabs.scrollLeft + tabs.clientWidth - 24) tabs.scrollLeft = left + tab.offsetWidth - tabs.clientWidth + 28;
}
// 追加一轮并立刻切过去。调用方是“这一轮刚被服务端接受”，所以即使用户正在看旧轮也要切到新轮。
function addTurn(label) {
  const number = ++turnNumber;
  const tabId = `agent-turn-tab-${number}`;
  const panelId = `agent-turn-panel-${number}`;
  const tab = node('button');
  tab.type = 'button';
  tab.className = 'agent-tab';
  tab.id = tabId;
  tab.setAttribute('role', 'tab');
  tab.setAttribute('aria-controls', panelId);
  tab.setAttribute('aria-selected', 'false');
  tab.tabIndex = -1;
  const dot = node('span', undefined, tab, 'status-dot status-dot-muted');
  dot.dataset.tone = 'muted';
  node('span', `第 ${number} 轮`, tab, 'turn-no');
  node('span', label, tab, 'turn-summary');
  const attention = node('span', '', tab, 'turn-attention');
  attention.hidden = true;
  const root = node('div');
  root.className = 'agent-turn';
  root.id = panelId;
  root.setAttribute('role', 'tabpanel');
  root.setAttribute('aria-labelledby', tabId);
  root.hidden = true;
  // 状态文字留在面板里（测试和读屏都能读到）；“完成 / 运行中”收成仅供读屏，避免占一行。
  const state = node('p', '', root, 'turn-state sr-only');
  state.setAttribute('data-quiet', 'true');
  const body = node('div', undefined, root, 'turn-body');
  const turn = {
    root, body, state, tab, dot, attention, number,
    cards: [], outlineItems: [], directiveQuery: '', attentionOnly: false, layoutTouched: false, spy: null,
  };
  tab.addEventListener('click', () => selectTurn(turn));
  turns.push(turn);
  if (turns.length > MAX_TURNS) {
    for (const dropped of turns.splice(0, turns.length - MAX_TURNS)) dropped.spy?.disconnect?.();
  }
  mountTurns();
  selectTurn(turn);
  return turn;
}
// 清空整个对话流：只用于新会话、切换/恢复会话、删除当前会话、知识发布变化这类有意的边界。
function clearConversation() {
  for (const turn of turns) turn.spy?.disconnect?.();
  turns = [];
  turnNumber = 0;
  selectedTurn = null;
  $('agent-result')?.replaceChildren();
  const tabs = $('agent-turn-tabs');
  if (tabs) { tabs.replaceChildren(); tabs.hidden = true; }
}
// 标签栏键盘：左右键只移动焦点，Enter / 空格才真正切换轮次。
function focusTurnTab(index) {
  if (!turns.length) return;
  const next = turns[(index + turns.length) % turns.length];
  for (const item of turns) item.tab.tabIndex = item === next ? 0 : -1;
  next.tab.focus();
}
function currentTurnTabIndex() {
  const focused = turns.findIndex(item => item.tab === document.activeElement);
  if (focused >= 0) return focused;
  const selected = turns.findIndex(item => item.tab.getAttribute('aria-selected') === 'true');
  return selected >= 0 ? selected : 0;
}
// “完成 / 运行中 / 已恢复”不占阅读行，其余状态（已取消、失败、等待补充）留在面板顶部。
function setTurnState(turn, text) {
  if (!turn) return;
  const value = text ?? '';
  turn.state.textContent = value;
  const quiet = !value || value === '完成' || value === '运行中' || value === '已恢复';
  turn.state.className = quiet ? 'turn-state sr-only' : 'turn-state';
  if (quiet) turn.state.setAttribute('data-quiet', 'true');
  else turn.state.removeAttribute('data-quiet');
}
// 轮次未正常结束（取消、登录失效、请求失败）时：移除“运行中”占位，把原因写在本轮面板上；已展示的内容保留。
function settleTurn(turn, text) {
  if (!turn) return;
  turn.body.replaceChildren(...Array.from(turn.body.children).filter(child => child.className !== 'agent-pending'));
  setTurnState(turn, text);
  if (text && text !== '完成' && text !== '运行中') setDot(turn.dot, 'warn');
}
// 右侧候选/详情当前对应的 Agent 对象键。追问没有新对象时据此跳过派发，让右侧保持不动。
let shownAnalysisKey = null;
// 资料库“本次输入”的识别结果（analysis-state 快照）对应的对象键，来自 app 的 agent-parsed 事件。
// 快照被清空、改为本地查询或对象失效时为 null。卡片只在自己轮次的对象键与它相等时才参考识别结果。
let parsedKey = null;
function resetShownAnalysis() { shownAnalysisKey = null; parsedKey = null; }
// analysisKey 定义在 analysis-state.mjs，与 app.mjs 共用同一口径：只取右侧候选/详情实际读取的字段（input/mode/context/module，release 用于校验发布）。
// 不能用整个 normalizedRequest：首轮带 inputSource/configRange 且 question 是用户问题，追问是 inputSource:'meta'、无 configRange、question 是追问句，
// 这些字段不影响右侧，却会让键每次都不同。提交路径与恢复路径共用该键。

function controls() {
  const ready = Boolean(service && !needsLogin && document.body.dataset.release);
  $('agent-submit').disabled = !ready || Boolean(active) || Boolean(interrupted);
  $('agent-submit').textContent = sessionId ? '继续提交' : '提交给 Agent';
  $('agent-cancel').disabled = !active || active.kind !== 'run';
  $('agent-restore').disabled = !(ready || needsLogin) || !(sessionId || interrupted) || Boolean(active);
  $('agent-retry').disabled = Boolean(active);
  $('agent-session').textContent = sessionId || '未创建';
  $('agent-result').setAttribute('aria-busy', String(Boolean(active)));
  // 菜单收起时，登录失效或任务中断仍要让用户看见：“会话 ▾”按钮加提示色（样式见 styles.css 的 needs-attention）。
  $('session-menu-toggle')?.classList.toggle('needs-attention', Boolean(interrupted || needsLogin));
  renderSessions();
}
function remember(id) {
  sessionId = id;
  try { if (id) localStorage.setItem(storageKey, id); else localStorage.removeItem(storageKey); } catch {}
  controls();
}
// 列表条目上限与标题长度上限（按码点）。服务端同样限制 50 条，这里再兜底一次。
const LIST_LIMIT = 50;
const TITLE_LIMIT = 100;
// 严格校验服务端返回：顶层必须是对象且 sessions 为数组，否则整表视为空；
// 单项 id 须为 36 位 uuid 形态、title 为字符串、updatedAt 为有限数字，不合格的项直接丢弃。
// 只复制这三个字段，服务端多给的字段一律忽略。
function parseSessions(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data) || !Array.isArray(data.sessions)) return [];
  const items = [];
  for (const item of data.sessions) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    if (typeof item.id !== 'string' || !/^[0-9a-f-]{36}$/.test(item.id) || typeof item.title !== 'string' || typeof item.updatedAt !== 'number' || !Number.isFinite(item.updatedAt)) continue;
    // 按码点截断，不会把代理对（如 emoji）切成半个字符。
    items.push({ id: item.id, title: Array.from(item.title).slice(0, TITLE_LIMIT).join(''), updatedAt: item.updatedAt });
  }
  return items.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, LIST_LIMIT);
}
// 会话列表刷新的节流状态：最近一次真正发出的刷新请求（promise）与发起时间（毫秒）。
// 只给“打开会话菜单 / 展开历史会话”这类随手触发的刷新用（见 refreshSessionsOnOpen），其余刷新不受影响。
const SESSION_LIST_MIN_INTERVAL_MS = 1000;
let sessionListInFlight = null;
let sessionListStartedAt = -Infinity;
// 从服务端拉取列表并渲染。失败静默：保留上一份列表、不弹提示；唯一例外是登录失效，走登录流程。
async function refreshSessions() {
  const seq = ++refreshSeq;
  sessionListStartedAt = Date.now();
  const pending = (async () => {
    try {
      const data = await api('/api/sessions');
      if (seq !== refreshSeq) return; // 已有更新的刷新发出，这份响应过期
      sessionList = parseSessions(data);
      renderSessions();
    } catch (error) {
      if (error.code === 'auth_required') requireLogin();
    }
  })();
  sessionListInFlight = pending;
  try { await pending; }
  finally { if (sessionListInFlight === pending) sessionListInFlight = null; }
}
// 打开“会话 ▾”菜单或展开“历史会话”时的刷新，做节流：已有请求在途时复用它（不再发第二个）；
// 否则距离上一次发起刷新不足 SESSION_LIST_MIN_INTERVAL_MS 时不重复请求。提交、恢复、删除后的刷新仍直接调用 refreshSessions，必须拿到变化后的列表。
function refreshSessionsOnOpen() {
  if (sessionListInFlight) return sessionListInFlight;
  if (Date.now() - sessionListStartedAt < SESSION_LIST_MIN_INTERVAL_MS) return Promise.resolve();
  return refreshSessions();
}
function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = number => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
// 菜单按钮旁一行内显示的当前会话标题：最多显示这么多码点，超出加省略号（按码点截，不切开代理对）。
const TITLE_SHOW_LIMIT = 36;
// 当前会话标题取自服务端列表（已清洗）。没有会话时显示“未开始”；有会话但列表尚未刷新到时显示“标题待刷新”。
// 完整标题放在 title 提示里，鼠标悬停可看全文。只用 textContent 写入。
function renderSessionTitle() {
  const el = $('session-title');
  if (!el) return;
  let text;
  if (!sessionId) text = '未开始';
  else {
    const item = sessionList.find(entry => entry.id === sessionId);
    text = item ? (item.title.trim() || '未命名会话') : '标题待刷新';
  }
  const chars = Array.from(text);
  el.textContent = chars.length > TITLE_SHOW_LIMIT ? `${chars.slice(0, TITLE_SHOW_LIMIT).join('')}…` : text;
  el.title = text;
}
function renderSessions() {
  renderSessionTitle();
  const list = $('agent-history-list');
  if (!list) return;
  list.replaceChildren();
  const ttl = service?.retentionEnabled === true && Number.isFinite(service.sessionTtlMs) ? service.sessionTtlMs : 0;
  const now = Date.now();
  for (const item of sessionList) {
    const row = node('li', undefined, list, item.id === sessionId ? 'is-current' : '');
    // 标题来自服务端（含用户输入），只能走 textContent，绝不当 HTML 解析。
    node('span', item.title, row, 'session-title');
    node('time', formatTime(item.updatedAt), row);
    // 服务端已排除过期项；这里只按保留期与 updatedAt 估算剩余天数，算出已不足时不显示。
    const remain = ttl ? ttl - (now - item.updatedAt) : 0;
    if (ttl && remain > 0) node('span', `剩余 ${Math.ceil(remain / 86400000)} 天`, row);
    const switchButton = node('button', '切换', row, 'text-button');
    switchButton.type = 'button';
    switchButton.disabled = Boolean(active || interrupted);
    switchButton.addEventListener('click', () => openSession(item.id));
    const deleteButton = node('button', '删除', row, 'text-button');
    deleteButton.type = 'button';
    deleteButton.disabled = Boolean(active || interrupted);
    deleteButton.addEventListener('click', () => deleteListed(item.id));
  }
}
// ---------- 会话菜单（“会话 ▾”） ----------
// 新会话、恢复会话、当前会话 ID 与历史会话列表收进非模态弹层。按钮、弹层与 id 保持原样，
// 各控件的事件仍由下方原有的 addEventListener 绑定；这里只管开关、焦点与关闭条件。
let sessionMenuOpen = false;
// 判断 target 是否位于 root 之内：沿 parentNode 向上走，不依赖 Node.contains，测试用的假 DOM 同样可用。
function insideNode(root, target) {
  for (let node = target; node; node = node.parentNode) if (node === root) return true;
  return false;
}
// 点菜单以外的任何位置都收起。监听只在打开期间挂载，关闭时摘除，反复开关不会堆积。
function onSessionMenuPointer(event) {
  if (!insideNode($('session-bar'), event.target)) setSessionMenu(false);
}
// open=true：挂载外部点击监听，把焦点移到“新会话”（菜单内第一个控件）。
// open=false：摘除监听；restoreFocus 只在 Esc 时为 true，焦点回到“会话 ▾”按钮，点外部关闭时不抢焦点。
// 重复调用同一状态只同步属性，不重复挂载监听。
function setSessionMenu(open, { restoreFocus = false } = {}) {
  const toggle = $('session-menu-toggle');
  const panel = $('session-menu');
  if (!toggle || !panel) return;
  const was = sessionMenuOpen;
  sessionMenuOpen = open;
  panel.hidden = !open;
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open && !was) {
    document.addEventListener?.('pointerdown', onSessionMenuPointer);
    $('agent-new')?.focus?.();
    // 每次打开都刷新一次服务端列表，能看到其他访问者新建的会话（失败静默；1 秒内的重复打开走节流，见 refreshSessionsOnOpen）。
    void refreshSessionsOnOpen();
  } else if (!open && was) {
    document.removeEventListener?.('pointerdown', onSessionMenuPointer);
    if (restoreFocus) toggle.focus?.();
  }
}
async function openSession(id) {
  if (active || interrupted || !/^[0-9a-f-]{36}$/.test(id)) return;
  const previousId = sessionId;
  authDraftProtected = false;
  remember(id);
  const outcome = await restore();
  if (outcome === 'expired') return;
  if (outcome !== 'ok') remember(previousId);
}
async function deleteListed(id) {
  if (active || interrupted || !/^[0-9a-f-]{36}$/.test(id)) return;
  try { await api(`/api/sessions/${id}`, undefined, undefined, 'DELETE'); }
  catch (error) {
    if (error.code === 'auth_required') { requireLogin(); return; }
    note(`删除未完成：${error.message}`, true);
    return;
  }
  // 删除成功后以服务端列表为准重新拉取。
  void refreshSessions();
  if (sessionId !== id) return;
  interrupted = null;
  authDraftProtected = false;
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
  // 恢复会话在“会话 ▾”菜单里，提示语据此指路；重新检测服务仍在状态行旁边。
  note(`登录已失效，请重新登录后${sessionId || interrupted ? '打开“会话 ▾”菜单点击“恢复会话”' : '点击“重新检测服务”'}；输入已保留。${interrupted ? '任务标识已保留，后端任务可能仍在运行，未确认取消。' : ''}`, true);
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
    if (status.mode === 'live') {
      // modelConfig.state 为 invalid：配置文件当前不可用，服务端仍在用上一份有效配置；
      // 状态类型只有 ready/mock/off/login，沿用最接近的警示类型 mock（橙色）。缺失或 ok 时行为不变。
      // 模型名仅通过 textContent 写入，不作为 HTML 解析。
      if (status.modelConfig?.state === 'invalid') environment(`真实模型 · ${status.model}（配置文件无效，仍用上一份有效配置）`, 'mock');
      else environment(`真实模型 · ${status.model}`, 'ready');
    }
    else environment('模拟模式 · 不代表真实模型', 'mock');
    // 服务连接成功：拉取一次服务端历史会话（失败静默，不影响连接状态）。
    void refreshSessions();
    note(interrupted ? 'Agent 已连接；请打开“会话 ▾”菜单点击“恢复会话”检查中断任务，不会自动重新提交。' : document.body.dataset.release ? 'Agent 已就绪；输入配置、问题或追问后提交。' : 'Agent 已连接，等待知识发布加载。');
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
  return el;
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
// 源码证据默认收在字段面板里，标题带条数。没有 id 时条数为 0，里面仍是“尚未记录”的说明。
function evidenceFold(parent, ids, fact, citations) {
  const count = Array.isArray(ids) ? ids.length : 0;
  const fold = node('details', undefined, parent, 'evidence-fold');
  fold.open = false;
  node('summary', `源码证据 (${count})`, fold);
  evidence(fold, ids, fact, citations);
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
  else evidenceFold(parent, ids, fact, citations);
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
// 字段状态：缺省按未核实。数组（限制列表）看每一项。
function factStatuses(fact) {
  if (Array.isArray(fact?.value)) return fact.value.map(item => item?.status ?? 'unverified');
  return [fact?.value?.status ?? fact?.status ?? 'unverified'];
}
function factNeedsAttention(fact) {
  return factStatuses(fact).some(status => status === 'unverified');
}
// 识别结果里的“需关注”沿用 config-results 的 needsAttention：不是唯一匹配，或带了未分析的外部引用。
function directiveMatchNeedsAttention(name, job) {
  const directives = job?.parsed?.directives;
  const matches = job?.matches;
  if (!Array.isArray(directives) || !Array.isArray(matches)) return false;
  for (let index = 0; index < directives.length && index < matches.length; index++) {
    const item = directives[index];
    const match = matches[index];
    if (!item || item.name !== name || !match || !Array.isArray(item.external_references)) continue;
    if (needsAttention(item, match)) return true;
  }
  return false;
}
// 资料库识别结果是后到的：卡片先按事实状态画，识别结果写完后再补一次。
// 识别结果只描述“当前识别对象”，因此只有本轮对象键与它的对象键一致时才读取，旧轮的同名指令不受新识别影响。
// 数据直接来自 analysis-state 快照（与左栏“本次输入”同源），不再从 DOM 反推。
function parsedRowNeedsAttention(name, turn) {
  if (!turn?.analysisKey || turn.analysisKey !== parsedKey) return false;
  return attentionNamed(name);
}
function firstFactText(facts) {
  for (const fact of facts ?? []) {
    const value = fact?.value;
    if (typeof value === 'string' && value.trim()) return value;
    if (Array.isArray(value)) {
      const hit = value.find(item => typeof item?.text === 'string' && item.text.trim());
      if (hit) return hit.text;
    } else if (typeof value?.text === 'string' && value.text.trim()) return value.text;
    if (typeof fact?.text === 'string' && fact.text.trim()) return fact.text;
  }
  return '';
}
// 不看“需关注”时的底色：全是不适用为灰，有已核实为绿，其余为琥珀。
function cardTone(facts) {
  const statuses = facts.flatMap(factStatuses);
  if (statuses.length && statuses.every(status => status === 'not_applicable')) return 'muted';
  if (statuses.some(status => status === 'verified')) return 'good';
  return 'warn';
}
function scrollBehavior() {
  return typeof matchMedia === 'function' && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto';
}
// ≤2 张全部展开；更多时只展开需关注的；一张都不需关注则全部折叠。
function applyDefaultOpen(cards) {
  const flagged = cards.some(card => card.dataset.attention === 'true');
  const expandAll = cards.length <= 2;
  for (const card of cards) card.open = expandAll || (flagged && card.dataset.attention === 'true');
}
function applyDirectiveFilter(turn) {
  const query = String(turn.directiveQuery ?? '').trim().toLowerCase();
  const attentionOnly = Boolean(turn.attentionOnly);
  let visible = 0;
  const shown = new Set();
  for (const card of turn.cards ?? []) {
    const name = String(card.dataset.name ?? '').toLowerCase();
    const show = (!query || name.includes(query)) && (!attentionOnly || card.dataset.attention === 'true');
    card.hidden = !show;
    if (show) { visible += 1; shown.add(card.dataset.entryId); }
  }
  for (const item of turn.outlineItems ?? []) item.hidden = !shown.has(item.dataset.entryId);
  if (turn.emptyNote) turn.emptyNote.hidden = visible > 0;
}
// 卡片口径叫“待处理”：含未核实字段，或在识别结果里需关注（非唯一匹配、带未分析外部引用）的指令。
// 统计 chip 里的“需关注”是服务端 summary.attention 的匹配口径，两者不混用。
const PENDING_SCOPE = '待处理 = 含未核实字段或识别需关注的指令';
function updateTabChrome(turn, tone, attentionCount) {
  setDot(turn.dot, tone);
  if (attentionCount > 0) {
    turn.attention.hidden = false;
    turn.attention.textContent = `待处理 ${attentionCount}`;
    turn.attention.title = `${PENDING_SCOPE}，本轮 ${attentionCount} 条`;
    turn.attention.setAttribute('aria-label', `待处理 ${attentionCount} 条（含未核实字段或识别需关注）`);
  } else {
    turn.attention.hidden = true;
    turn.attention.textContent = '';
    turn.attention.removeAttribute('aria-label');
    turn.attention.title = '';
  }
}
// 只数卡片；没有卡片时不拿服务端 summary.attention 冒充“待处理”。
function attentionCountFor(cards) {
  return (cards ?? []).filter(card => card.dataset.attention === 'true').length;
}
function toneForTurn(job, cards, count) {
  if (count > 0) return 'warn';
  // 还没有卡片（如运行中只到 summary）时，服务端匹配需关注仍让状态点显示琥珀。
  if (!cards?.length && Number(job?.summary?.attention) > 0) return 'warn';
  if (job?.inputResolution?.unindexed) return 'muted';
  if (job?.state === 'failed' || job?.state === 'cancelled') return 'muted';
  if (job?.state === 'running' || job?.state === 'awaiting_input') return 'warn';
  if (cards?.length) return cards.every(card => card.dataset.tone === 'good') ? 'good' : 'muted';
  return job?.state === 'completed' ? 'good' : 'muted';
}
function finishChrome(turn, job) {
  const cards = turn.cards ?? [];
  const count = attentionCountFor(cards);
  updateTabChrome(turn, toneForTurn(job, cards, count), count);
  if (turn === selectedTurn) revealTab(turn);
}
function paintCardAttention(card, attention) {
  card.dataset.attention = String(Boolean(attention));
  const tone = attention ? 'warn' : (card.dataset.baseTone || 'good');
  card.dataset.tone = tone;
  setDot(card.dot, tone);
}
// 资料库的识别结果晚于回答卡写完。只改与它对象相同的轮次；用户还没手动展开/折叠时，按新的待处理结果重算默认展开。
function refreshParsedAttention() {
  if (!parsedKey) return;
  for (const turn of turns) {
    if (!turn.cards?.length || turn.analysisKey !== parsedKey) continue;
    let changed = false;
    for (const card of turn.cards) {
      // 三个来源取并集：字段未核实、回答自带的识别结果（job.matches）、资料库里的识别结果（analysis-state）。
      const next = card.dataset.factAttention === 'true' || card.dataset.matchAttention === 'true' || parsedRowNeedsAttention(card.dataset.name, turn);
      if ((card.dataset.attention === 'true') !== next) {
        paintCardAttention(card, next);
        const item = (turn.outlineItems ?? []).find(entry => entry.dataset.entryId === card.dataset.entryId);
        if (item?.dot) setDot(item.dot, card.dataset.tone);
        changed = true;
      }
    }
    if (changed && !turn.layoutTouched) applyDefaultOpen(turn.cards);
    finishChrome(turn, turn.job);
    applyDirectiveFilter(turn);
  }
}
function bindScrollspy(turn) {
  turn.spy?.disconnect?.();
  turn.spy = null;
  // 测试用的假 DOM 和很旧的浏览器都没有 IntersectionObserver，大纲点击不依赖它。
  if (typeof IntersectionObserver !== 'function' || (turn.cards?.length ?? 0) < 2) return;
  const pane = document.getElementById('pane-right');
  // 窄屏下 .pane 是 overflow:visible，滚动的是整页；仍以 pane 为 root 会让交叉判断失真、高亮乱跳。
  // 只有 pane 自己是滚动容器时才用它作 root，否则用视口（null）。拿不到 getComputedStyle（测试假 DOM）时沿用 pane。
  // 这个判断依赖断点，窗口尺寸变化后要重算，见下方 scheduleScrollspyRebind。
  let root = pane || null;
  if (pane && typeof getComputedStyle === 'function') {
    try {
      const overflowY = getComputedStyle(pane).overflowY;
      if (!['auto', 'scroll', 'overlay'].includes(overflowY)) root = null;
    } catch { root = pane; }
  }
  let observer;
  try {
    observer = new IntersectionObserver(entries => {
      const hit = entries.filter(entry => entry.isIntersecting).sort((a, b) => (a.boundingClientRect?.top ?? 0) - (b.boundingClientRect?.top ?? 0))[0];
      if (!hit) return;
      const id = hit.target?.dataset?.entryId;
      for (const item of turn.outlineItems ?? []) item.classList.toggle('is-spy', item.dataset.entryId === id);
    }, { root, rootMargin: '0px 0px -55% 0px', threshold: [0, 0.25, 0.6] });
  } catch { return; }
  for (const card of turn.cards) {
    try { observer.observe(card); } catch { /* 观察失败时保留点击定位 */ }
  }
  turn.spy = observer;
}
// 窗口尺寸变化时重新绑定滚动观察。跨过 960px 断点后 .pane 可能从滚动容器变成非滚动容器（或反过来），root 必须跟着换。
// 同一帧内多次 resize 只重算一次（按 requestAnimationFrame 节流）；没有 requestAnimationFrame 的环境（测试假 DOM）直接同步执行。
let scrollspyRebindFrame = null;
function rebindScrollspies() {
  scrollspyRebindFrame = null;
  // 所有有卡片的轮次都重绑，而不只是当前选中轮：切换到旧轮时它的观察器不会残留旧的 root。隐藏轮次的观察器没有高亮副作用。
  for (const turn of turns) if (turn.cards?.length) bindScrollspy(turn);
}
function scheduleScrollspyRebind() {
  if (scrollspyRebindFrame !== null) return;
  if (typeof requestAnimationFrame === 'function') scrollspyRebindFrame = requestAnimationFrame(rebindScrollspies);
  else rebindScrollspies();
}
// 测试假环境没有 addEventListener 全局，这里做存在性判断（与 app.mjs 的 resize 监听写法一致）。
if (typeof addEventListener === 'function') addEventListener('resize', scheduleScrollspyRebind);
function flashCard(card) {
  card.classList.remove('is-flash');
  const add = () => card.classList.add('is-flash');
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(add);
  else add();
  clearTimeout(card.flashTimer);
  // 浏览器里到点摘掉高亮；Node 测试里 unref，避免每个点击把用例拖住 1 秒。
  const timer = setTimeout(() => card.classList.remove('is-flash'), 1200);
  timer.unref?.();
  card.flashTimer = timer;
}
function activateFieldTab(tabs, tab) {
  for (const item of tabs) {
    const on = item === tab;
    item.setAttribute('aria-selected', on ? 'true' : 'false');
    item.tabIndex = on ? 0 : -1;
    if (item.panel) item.panel.hidden = !on;
  }
}
function bindFieldKeys(tablist, tabs) {
  tablist.addEventListener('keydown', event => {
    const index = tabs.findIndex(item => item === document.activeElement);
    if (index < 0) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault?.();
      const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      for (const item of tabs) item.tabIndex = item === next ? 0 : -1;
      next.focus();
    } else if (event.key === 'Home' || event.key === 'End') {
      // 与轮次标签栏一致：Home/End 只把焦点移到首/末个字段，Enter / 空格才切换。
      event.preventDefault?.();
      const next = tabs[event.key === 'Home' ? 0 : tabs.length - 1];
      for (const item of tabs) item.tabIndex = item === next ? 0 : -1;
      next.focus();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault?.();
      activateFieldTab(tabs, document.activeElement);
    }
  });
}
function renderFactPanel(panel, fact, citations) {
  node('h4', labels[fact.field] ?? fact.field, panel, 'agent-fact-label');
  if (Array.isArray(fact.value)) {
    if (!fact.value.length) node('p', '尚未记录限制，不代表没有限制。', panel, 'fact-text');
    for (const value of fact.value) factBody(node('div', undefined, panel, 'agent-subfact'), value, fact, citations);
  } else {
    factBody(panel, fact.value, fact, citations);
    if (fact.field === 'runtime' && fact.value) {
      for (const [stepIndex, step] of (fact.value.steps ?? []).entries()) {
        const item = node('div', undefined, panel, 'agent-subfact');
        node('h5', `步骤 ${stepIndex + 1} · ${step.condition}`, item);
        node('p', step.action, item, 'fact-text');
        evidenceFold(item, step.source_ids, fact, citations);
      }
      if (fact.value.corroboration_source_ids?.length) {
        node('h5', '交叉印证', panel);
        evidenceFold(panel, fact.value.corroboration_source_ids, fact, citations);
      }
    }
  }
}
function renderDirectiveCard(turn, entryId, facts, citations, releaseId, index) {
  const { name, module } = entryParts(entryId);
  const factAttention = facts.some(factNeedsAttention);
  const matchAttention = directiveMatchNeedsAttention(name, turn.job);
  const attention = factAttention || matchAttention || parsedRowNeedsAttention(name, turn);
  const card = node('details');
  card.className = 'agent-entry';
  card.dataset.entryId = entryId;
  card.dataset.name = name;
  card.dataset.factAttention = String(factAttention);
  card.dataset.matchAttention = String(matchAttention);
  card.dataset.baseTone = cardTone(facts);
  const summary = node('summary', undefined, card, 'agent-entry-summary');
  card.dot = node('span', undefined, summary, 'status-dot');
  paintCardAttention(card, attention);
  node('span', name, summary, 'agent-entry-name');
  if (module) node('span', module, summary, 'agent-entry-module').setAttribute('title', entryId);
  const blurb = clipBlurb(firstFactText(facts));
  if (blurb) node('span', blurb, summary, 'agent-entry-blurb');
  node('span', `字段 ${facts.length}`, summary, 'agent-entry-count');
  // 点折叠行只选中并交给浏览器切换 open，不打开抽屉。
  summary.addEventListener('click', () => {
    turn.layoutTouched = true;
    selectDirective(entryId, 'card');
  });
  const actions = node('div', undefined, card, 'agent-entry-actions');
  const openButton = node('button', '查看完整详情', actions, 'secondary-button detail-open');
  openButton.type = 'button';
  openButton.addEventListener('click', event => {
    event.preventDefault?.();
    event.stopPropagation?.();
    selectDirective(entryId, 'card');
    document.dispatchEvent(new CustomEvent('directive-open-detail', { detail: { entryId, source: 'card' } }));
  });
  const url = new URL(appBase);
  url.searchParams.set('id', entryId);
  url.searchParams.set('release', releaseId);
  // link() 拒绝非 http(s) 地址时返回 undefined，此时不加样式。直接拿返回的元素加类，不靠 tagName 猜（浏览器里是大写 'A'）。
  link(actions, url.href, '完整知识详情 ↗')?.classList.add('text-button', 'detail-link');
  const tablist = node('div', undefined, card, 'field-tabs');
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', `${name} 的字段`);
  const tabs = [];
  facts.forEach((fact, fieldIndex) => {
    const tabId = `agent-field-${turn.number}-${index}-${fieldIndex}`;
    const panelId = `agent-field-panel-${turn.number}-${index}-${fieldIndex}`;
    const tab = node('button', labels[fact.field] ?? fact.field, tablist, 'field-tab');
    tab.type = 'button';
    tab.id = tabId;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panelId);
    tab.setAttribute('aria-selected', fieldIndex === 0 ? 'true' : 'false');
    tab.tabIndex = fieldIndex === 0 ? 0 : -1;
    const panel = node('div', undefined, card, 'field-panel');
    panel.id = panelId;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tabId);
    panel.hidden = fieldIndex !== 0;
    tab.panel = panel;
    renderFactPanel(panel, fact, citations);
    tab.addEventListener('click', () => activateFieldTab(tabs, tab));
    tabs.push(tab);
  });
  bindFieldKeys(tablist, tabs);
  return card;
}
// 两张及以上才出现。大纲在工具行上面，点击只定位卡片。
function renderOutline(turn, cards) {
  if (cards.length < 2) return;
  const nav = node('div', undefined, turn.body, 'answer-nav');
  const outline = node('nav', undefined, nav, 'directive-outline');
  outline.setAttribute('aria-label', '本轮指令');
  const list = node('ol', undefined, outline);
  // 超过三行时大纲内部滚动；样式据 data-overflow 加底部淡出遮罩，并显示“共 N 条”。
  if (cards.length > 3) {
    nav.dataset.overflow = 'true';
    node('p', `共 ${cards.length} 条，大纲内可滚动`, nav, 'outline-total');
  }
  turn.outlineItems = [];
  for (const card of cards) {
    const item = node('li', undefined, list, 'outline-entry');
    item.dataset.entryId = card.dataset.entryId;
    const button = node('button', undefined, item);
    button.type = 'button';
    item.dot = node('span', undefined, button, 'status-dot');
    setDot(item.dot, card.dataset.tone || 'muted');
    node('span', card.dataset.name || card.dataset.entryId, button, 'outline-name');
    button.addEventListener('click', () => {
      turn.layoutTouched = true;
      selectDirective(card.dataset.entryId, 'outline');
      // 大纲与卡片用同一套筛选（applyDirectiveFilter），能点到的条目对应的卡片一定可见，这里不改筛选状态。
      card.open = true;
      flashCard(card);
      card.scrollIntoView?.({ behavior: scrollBehavior(), block: 'nearest' });
    });
    turn.outlineItems.push(item);
  }
  const tools = node('div', undefined, nav, 'directive-tools');
  const search = node('input', undefined, tools);
  search.type = 'search';
  search.className = 'directive-search';
  search.placeholder = '按指令名搜索';
  search.setAttribute('aria-label', '按指令名搜索');
  search.value = turn.directiveQuery ?? '';
  search.addEventListener('input', () => {
    turn.directiveQuery = search.value;
    applyDirectiveFilter(turn);
  });
  const attentionLabel = node('label', undefined, tools, 'checkbox-label');
  const attentionInput = node('input', undefined, attentionLabel);
  attentionInput.type = 'checkbox';
  attentionInput.className = 'attention-only';
  attentionInput.checked = Boolean(turn.attentionOnly);
  node('span', '只看待处理', attentionLabel);
  attentionLabel.title = PENDING_SCOPE;
  attentionInput.setAttribute('aria-label', '只看待处理（含未核实字段或识别需关注）');
  attentionInput.addEventListener('change', () => {
    turn.attentionOnly = attentionInput.checked;
    applyDirectiveFilter(turn);
  });
  // 两个批量按钮包成一组，窄屏时整组换行。
  const bulk = node('span', undefined, tools, 'directive-bulk');
  const expand = node('button', '全部展开', bulk, 'text-button');
  expand.type = 'button';
  expand.addEventListener('click', () => {
    turn.layoutTouched = true;
    for (const card of turn.cards) card.open = true;
  });
  const collapse = node('button', '全部折叠', bulk, 'text-button');
  collapse.type = 'button';
  collapse.addEventListener('click', () => {
    turn.layoutTouched = true;
    for (const card of turn.cards) card.open = false;
  });
  turn.emptyNote = node('p', '没有符合的指令', nav, 'verification-notes directive-empty');
  turn.emptyNote.hidden = true;
}
function highlightSelected() {
  const entryId = getSelectedEntryId();
  const root = $('agent-result');
  if (!root || typeof root.querySelectorAll !== 'function') return;
  for (const card of root.querySelectorAll('.agent-entry')) card.classList.toggle('is-selected', Boolean(entryId) && card.dataset.entryId === entryId);
  for (const item of root.querySelectorAll('.outline-entry')) item.classList.toggle('is-selected', Boolean(entryId) && item.dataset.entryId === entryId);
}
function render(job, task) {
  if (job.knowledgeVersion?.release && job.knowledgeVersion.release !== task.request.release) throw new Error('结果发布与当前请求不一致，请刷新知识站。');
  // 轮次卡在首次渲染时才创建：被服务端拒绝、发布不一致等尚无结果的失败不会留下空卡。
  task.turn ??= addTurn(summarizeInput(task.request?.message));
  // 重绘会换掉卡片节点。先丢掉上一份滚动观察，避免观察已经脱离文档的节点。
  task.turn.spy?.disconnect?.();
  task.turn.spy = null;
  task.turn.cards = [];
  task.turn.outlineItems = [];
  task.turn.emptyNote = null;
  task.turn.job = job;
  const result = task.turn.body; result.replaceChildren();
  setTurnState(task.turn, labels[job.state] ?? job.state ?? '');
  // 只在这一轮正被看着时才滚动。用户已经点到旧轮时，迟到响应写回自己的面板，不把视线拽走。
  if (!task.revealed) {
    task.revealed = true;
    if (task.turn === selectedTurn) task.turn.root.scrollIntoView?.({ behavior: scrollBehavior(), block: 'nearest' });
  }
  const state = labels[job.state] ?? job.state;
  const phase = job.state !== 'running' ? '' : job.phase === 'input_resolution' ? ' · 正在识别配置与问题' : job.summary ? ' · 基础匹配已就绪，等待模型选取' : ' · 正在准备知识与会话';
  note(`${state}${phase}${job.cacheHit ? ' · 历史精确缓存（本次未推理）' : ''}${job.error ? ` · ${job.error}` : ''}`, job.state === 'failed');
  // 配置校验块放在本轮内容的最前面；紧接着是统计标签。形状非法时 validation 为 null，整块不显示。
  const validation = normalizeValidation(job.validation);
  if (validation) renderValidation(result, validation);
  if (job.summary) {
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
  if (job.inputResolution?.message) node('p', job.inputResolution.message, result, 'notice');
  // 消息中有未处理的跑题部分时，在结果区说明，避免用户误以为整条消息都已处理。
  if (job.inputResolution?.notice) node('p', job.inputResolution.notice, result, 'verification-notes');
  // 本轮是否“拥有”右侧：渲染了 normalizedRequest 且不是澄清/范围外/问候这类不更新右侧的动作。
  // 下面的块执行后，右侧要么已被本轮替换，要么与 shownAnalysisKey 一致（本轮对象与已显示对象相同）。
  task.ownsRight = Boolean(job.normalizedRequest) && !NO_QUERY_ACTIONS.has(job.inputResolution?.action);
  if (!task.ownsRight) task.turn.analysisKey = null;
  if (job.normalizedRequest && !NO_QUERY_ACTIONS.has(job.inputResolution?.action)) {
    const request = job.normalizedRequest;
    showConfiguration(result, request, job.inputResolution?.action === 'followup' ? '本次沿用的配置（展开核对）' : '本次识别的配置 / 指令（展开核对）');
    // 右侧候选/详情只在对象真的变化时替换：追问沿用同一对象时不重置，也不让本任务“拥有”右侧（取消追问不应清掉上一轮的对象）。
    const key = analysisKey(request);
    // 记在轮次上：识别结果回来时按它判断这份结果属于哪一轮。
    task.turn.analysisKey = key;
    if (key !== shownAnalysisKey) {
      shownAnalysisKey = key;
      // 右侧即将被清空重新识别，旧网格不再对应任何轮次。
      parsedKey = null;
      task.analysisKey = key;
      $('configuration').dispatchEvent(new CustomEvent('agent-analysis', { detail: request }));
    }
  }
  for (const question of job.questions ?? []) if (question !== job.inputResolution?.message) node('p', question, result, 'verification-notes');
  if (job.state === 'running') {
    // 运行中给出占位，让“看回答”有明确的等待反馈；最终结果到达时整个区域会被重绘。
    node('p', job.phase === 'input_resolution' ? '正在识别配置与问题…' : job.summary ? '基础匹配已完成，正在挑选回答要点…' : '正在准备知识与会话…', result, 'agent-pending');
    finishChrome(task.turn, job);
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
  const cards = [];
  let cardIndex = 0;
  for (const [entryId, facts] of groups) {
    cards.push(renderDirectiveCard(task.turn, entryId, facts, citations, task.request.release, cardIndex));
    cardIndex += 1;
  }
  task.turn.cards = cards;
  // 同一轮被整页重绘时，若用户已经手动展开或折叠过，就不再套用默认展开，避免把正在看的卡片收回去。
  if (!task.turn.layoutTouched) applyDefaultOpen(cards);
  renderOutline(task.turn, cards);
  for (const card of cards) result.append(card);
  applyDirectiveFilter(task.turn);
  bindScrollspy(task.turn);
  finishChrome(task.turn, job);
  highlightSelected();
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
    // 提交已被服务端接受：会话已落盘（标题由服务端计算），刷新列表。
    void refreshSessions();
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
  // 运行任务结束（完成、失败、取消）后刷新列表，标题和更新时间以服务端为准。
  if (task.kind === 'run') void refreshSessions();
  if (active === task && (!task.cancelled || !task.requestId || task.cancelConfirmed || task.terminal || task.authPaused)) active = null;
  controls();
}
async function followJob(task, job) {
  while (current(task)) {
    task.terminal = job.state !== 'running';
    if (task.showResults === false) {
      if (task.turn) setTurnState(task.turn, `原任务${labels[job.state] ?? job.state}（结果未回填）`);
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
  if (task.kind === 'restore' && active === task && !task.cancelled && task.generation === generation && task.fingerprint !== fingerprint()) note('输入已变化，已放弃本次恢复回填；输入已保留，可在“会话 ▾”菜单中重新点击“恢复会话”。');
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
    // 恢复成功：会话的更新时间可能变化，刷新列表。
    void refreshSessions();
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
      setTurnState(turn, '已恢复');
      setDot(turn.dot, 'good');
      if (restoredValidation) renderValidation(turn.body, restoredValidation);
      if (restoredNotice) node('p', restoredNotice, turn.body, 'verification-notes');
      if (restoredConfig?.input) {
        // 没有通过校验的当前对象、仅剩被拦下的错误配置时，标题如实说明，避免把错误配置当成会话配置。
        const blockedOnly = !(saved.currentSubject ?? saved.currentConfig) && restoredValidation?.verdict === 'fail';
        showConfiguration(turn.body, restoredConfig, blockedOnly ? '最近一次提交（校验未通过，未作为会话配置）' : '恢复的会话配置 / 指令（展开核对；不是历史完整报告）');
        if (restoredConfig.release === document.body.dataset.release) {
          shownAnalysisKey = analysisKey(restoredConfig);
          turn.analysisKey = shownAnalysisKey;
          parsedKey = null;
          $('configuration').dispatchEvent(new CustomEvent('agent-analysis', { detail: restoredConfig }));
        }
      }
    }
    note(`已恢复 ${saved.messages} 条会话记录；${preserveInput ? `${recoveringJob ? '旧任务不可续传，' : ''}当前输入已保留，未自动提交；` : saved.request.message === undefined ? '旧会话的配置与问题已合并到输入框；' : ''}${saved.interrupted ? '已丢弃中断轮次；' : ''}${saved.knowledgeChanged || saved.contractChanged ? '知识或契约已变化，下次提交按当前发布重新选取。' : '可继续追问。'}`);
    return 'ok';
  } catch (error) {
    if (error.code === 'auth_required' && active === task) { requireLogin(task); return 'failed'; }
    if (task.kind === 'restore' && error.code === 'session_unavailable' && current(task)) {
      // 会话已过期/不存在：清除当前会话 ID，并以服务端列表为准刷新（过期项已被服务端排除）。
      remember('');
      void refreshSessions();
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
// 右侧没有采用本次 Agent 对象（查询失败、发布不一致被忽略）：已显示对象失效，下一次同对象提交要重新派发。
$('configuration').addEventListener('agent-analysis-failed', resetShownAnalysis);
$('agent-cancel').addEventListener('click', () => {
  const task = active;
  invalidate('正在确认取消；已有轮次保留，本轮不再更新…', { keepConversation: true });
  if (task?.requestId) void stop(task).then(() => { if (task.authPaused) return; if (interrupted?.requestId === task.requestId) interrupted = null; if (active === task) { active = null; controls(); } if (task.generation + 1 === generation) note('已取消；基础查询仍可使用。'); }).catch(() => {});
});
$('agent-new').addEventListener('click', () => { interrupted = null; authDraftProtected = false; invalidate('已开启新会话，不再沿用之前的配置；输入框内容保留，提交后开始处理。'); remember(''); resetShownAnalysis(); $('configuration').dispatchEvent(new CustomEvent('agent-reset')); });
$('agent-restore').addEventListener('click', restore);
// 展开“历史会话”时刷新，这样能看到其他访问者新建的会话；折叠时不请求。与打开菜单共用节流。
$('agent-history')?.addEventListener('toggle', () => { if ($('agent-history').open) void refreshSessionsOnOpen(); });
$('agent-retry').addEventListener('click', probe);
// “会话 ▾”按钮：点击切换开关；打开时焦点进入菜单，关闭时由 setSessionMenu 按原因决定是否还原焦点。
$('session-menu-toggle')?.addEventListener('click', () => setSessionMenu(!sessionMenuOpen));
// 菜单内按 Esc：收起并把焦点还给按钮。阻止冒泡，免得同一次 Esc 也关掉右侧详情抽屉（app.mjs 在 document 上监听 Esc）。
$('session-bar')?.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !sessionMenuOpen) return;
  event.preventDefault?.();
  event.stopPropagation?.();
  setSessionMenu(false, { restoreFocus: true });
});
// 窗口尺寸变化时收起菜单，不留下位置已经错位的半开弹层；收起时摘除外部点击监听。
if (typeof addEventListener === 'function') addEventListener('resize', () => setSessionMenu(false));
// 初始化：显式同步 hidden 与 aria-expanded，不依赖 HTML 属性（测试假 DOM 不解析属性）。
setSessionMenu(false);
$('configuration').addEventListener('input', inputHint);
// 左右键移动标签焦点，Enter / 空格才切换可见轮次。点击标签则直接切换。
$('agent-turn-tabs')?.addEventListener('keydown', event => {
  if (!turns.length) return;
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault?.();
    focusTurnTab(currentTurnTabIndex() + (event.key === 'ArrowRight' ? 1 : -1));
  } else if (event.key === 'Home') {
    event.preventDefault?.();
    focusTurnTab(0);
  } else if (event.key === 'End') {
    event.preventDefault?.();
    focusTurnTab(turns.length - 1);
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault?.();
    const turn = turns.find(item => item.tab === document.activeElement);
    if (turn) selectTurn(turn);
  }
});
// 大纲、卡片、详情预览与资料库“本次输入”都通过 selection.mjs 广播；这里改回答区的高亮，
// 来自资料库的点击还要把对应卡片展开并定位（大纲与卡片自己已处理定位，不重复）。
document.addEventListener('directive-select', event => {
  highlightSelected();
  if (event.detail?.source === 'library' && event.detail?.entryId) locateLibraryCard(event.detail.entryId);
});
// 资料库点选的指令：切到持有该卡片的那一轮（即右栏当前对象所在轮），展开卡片、闪烁提示并滚动到可见位置。
// 只在右栏对象与资料库对象一致时定位；找不到卡片（例如回答没有覆盖该指令）时什么也不做，高亮仍由 highlightSelected 保持。
function locateLibraryCard(entryId) {
  const holders = turns.filter(turn => turn.analysisKey && turn.analysisKey === shownAnalysisKey && (turn.cards ?? []).some(card => card.dataset.entryId === entryId));
  if (!holders.length) return false;
  const turn = holders.includes(selectedTurn) ? selectedTurn : holders[holders.length - 1];
  if (turn !== selectedTurn) selectTurn(turn);
  const card = turn.cards.find(item => item.dataset.entryId === entryId);
  turn.layoutTouched = true;
  card.open = true;
  flashCard(card);
  card.scrollIntoView?.({ behavior: scrollBehavior(), block: 'nearest' });
  return true;
}
// 资料库的识别结果可能比回答卡晚到。补上“这条指令在识别结果里需关注”。
// 事件带回本次识别的请求；本地查询为 null，此时网格不属于任何轮次。
$('configuration').addEventListener('agent-parsed', event => {
  const request = event?.detail?.request;
  parsedKey = request ? analysisKey(request) : null;
  refreshParsedAttention();
});
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
