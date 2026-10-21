import { parseConfig, parseSingle, matchDirective } from './src/core/core.mjs';
import { createKnowledgeClient, relatedCandidates, STATUS_LABELS, VERIFICATION_LABELS, FACT_STATUS_LABELS, PATCH_STATUS_LABELS, formatFact, fieldEvidence, FIELD_PENDING_LABEL, FIELD_PENDING_NOTE, RUNTIME_SCOPE_NOTE, BASIC_SCOPE_NOTE, DEEP_SCOPE_NOTE, NO_RUNTIME_NOTE, AVAILABILITY_SCOPE_NOTE } from './src/query/knowledge.mjs';
import { SOURCE_LABELS, sourceDescription } from './src/core/source.mjs';
import { summarizeConfig, needsOuterContext } from './src/query/config-results.mjs';
import { selectDirective, getSelectedEntryId } from './selection.mjs';
import { analysisKey, buildSnapshot, getAnalysisSnapshot, setAnalysisSnapshot, clearAnalysisSnapshot } from './analysis-state.mjs';

const byId = id => document.getElementById(id);
const element = (tag, text, className) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; };
const addOptions = (select, values) => { for (const value of [...new Set(values)].sort()) { const option = element('option', value); option.value = value; select.append(option); } };
let index;
let client;
// 目录与本次输入的高亮统一由 selection.mjs 的 selectedEntryId 决定；这里不再保存单独的 selectedId。
let querySequence = 0;
let previewSequence = 0;
// 资料库标签：'input' 本次输入 | 'catalog' 全部目录 | 'reference' API/变量。
const LIBRARY_TABS = ['input', 'catalog', 'reference'];
// 用户手动切换过标签后，后台刷新（新的识别结果、清空）不再替他改选项。
let libraryManual = false;
// 全部目录里用户手动展开/收起过的模块组；搜索或选了模块时命中组由筛选自动展开，不写入这里。
const openModules = new Set();
// 当前渲染出来的可点击元素，供选择变化时只改 class，不整块重建（避免丢焦点）。
let catalogButtons = [];
// 当前渲染出来的分组摘要标记：{ module, details, dot, note }。选中项所在组收起或未构建按钮时，用它显示小圆点与读屏说明。
let catalogGroupMarks = [];
let treeButtons = [];
// 全部目录：搜索框输入后延迟这么久才整表重建（防抖），避免每个按键都重建约 5000 个节点。
const CATALOG_SEARCH_DELAY_MS = 120;
let catalogSearchTimer = null;
// 每次整表重建递增。分组的 toggle 回调记下自己所属的那一次，旧表迟到的回调据此丢弃，不写入新表。
let catalogRenderSequence = 0;
// 右侧候选/详情当前属于谁：'agent' = 由 Agent 提交的 normalizedRequest 派生；'local' = 用户点“仅本地识别并查询”；null = 无结果。
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

// 抽屉打开前记住触发元素，关闭时把焦点还回去。
// 宽屏：role=complementary，非模态，不拦截右栏以外的点击。
// 窄屏（与样式断点一致，≤960px）：抽屉盖满整屏，改为 role=dialog + aria-modal，背景 inert、禁止滚动、Tab 循环在抽屉内。
let drawerTrigger = null;
// 关闭动效进行中的“待执行收起”：{ timer, onEnd }。timer 是 400ms 兜底定时器，onEnd 是抽屉自身 transitionend 的监听。
// 动效没结束就重新打开时，必须先取消它们，否则旧的 finish 会在抽屉已打开后把它收走，并误清窄屏 inert 与滚动锁。
let pendingClose = null;
// 窄屏模态时被设为 inert 的背景节点，关闭或回到宽屏时逐个还原。
let inertNodes = [];
function motionOn() {
  return typeof matchMedia === 'function' && !matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function narrowScreen() {
  return typeof matchMedia === 'function' && matchMedia('(max-width: 960px)').matches;
}
// 沿 parentNode 判断包含关系：浏览器和测试假 DOM 都有 parentNode，不依赖 Node.contains。
function within(root, target) {
  for (let node = target; node; node = node.parentNode) if (node === root) return true;
  return false;
}
// 把抽屉从祖先链上“摘出来”：每一层祖先的兄弟节点设为 inert。不能直接给祖先设 inert，否则抽屉自己也会失效。
function setBackgroundInert(drawer) {
  for (let node = drawer; node?.parentNode && node !== document.body; node = node.parentNode) {
    for (const sibling of node.parentNode.children ?? []) {
      if (sibling === node || sibling.inert) continue;
      sibling.inert = true;
      inertNodes.push(sibling);
    }
  }
}
function clearBackgroundInert() {
  for (const node of inertNodes) node.inert = false;
  inertNodes = [];
}
// 按当前断点切换抽屉的对话框语义。打开时和窗口尺寸变化时都要调用。
function applyDrawerMode() {
  const drawer = byId('detail-drawer');
  if (!drawer) return;
  const modal = !drawer.hidden && narrowScreen();
  if (modal) {
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    if (!inertNodes.length) setBackgroundInert(drawer);
    document.body.classList?.add?.('drawer-modal');
  } else {
    drawer.setAttribute('role', 'complementary');
    drawer.removeAttribute('aria-modal');
    clearBackgroundInert();
    document.body.classList?.remove?.('drawer-modal');
  }
}
// 抽屉内可 Tab 到的元素，按文档顺序。只走 children，跳过 hidden 子树和收起的 <details> 正文（只留 summary）。
const FOCUSABLE_TAGS = new Set(['a', 'button', 'input', 'select', 'textarea', 'summary']);
function focusablesIn(root) {
  const out = [];
  const visit = node => {
    for (const child of node.children ?? []) {
      if (child.hidden) continue;
      const tag = String(child.tagName ?? '').toLowerCase();
      // 没写 tabindex 属性时 getAttribute 返回 null，Number(null) 是 0，必须先排除，否则所有元素都会被当成可聚焦。
      const rawIndex = child.getAttribute?.('tabindex');
      const explicit = rawIndex == null || rawIndex === '' ? NaN : Number(rawIndex);
      const usable = (FOCUSABLE_TAGS.has(tag) && !child.disabled && (tag !== 'a' || child.href)) || (Number.isInteger(explicit) && explicit >= 0);
      if (usable && !(Number.isInteger(explicit) && explicit < 0)) out.push(child);
      if (tag === 'details' && !child.open) {
        const summary = (child.children ?? []).find(item => String(item.tagName ?? '').toLowerCase() === 'summary');
        if (summary) out.push(summary);
        continue;
      }
      visit(child);
    }
  };
  visit(root);
  return out;
}
// 窄屏模态下的焦点陷阱：Tab 到最后一个回到第一个，Shift+Tab 反之；焦点不在抽屉里时拉回第一个。
function trapDrawerFocus(event) {
  const drawer = byId('detail-drawer');
  if (event.key !== 'Tab' || !drawer || drawer.hidden || drawer.getAttribute('aria-modal') !== 'true') return;
  const items = focusablesIn(drawer);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  const current = document.activeElement;
  if (!within(drawer, current)) { event.preventDefault?.(); first.focus(); return; }
  if (event.shiftKey && (current === first || !items.includes(current))) { event.preventDefault?.(); last.focus(); }
  else if (!event.shiftKey && current === last) { event.preventDefault?.(); first.focus(); }
}
// 绝对定位的抽屉会跟着右栏内容滚走。用当前 scrollTop 把它钉在可视区。窄屏改由样式全屏覆盖，这里清掉内联尺寸。
function pinDrawer() {
  const pane = byId('pane-right');
  const drawer = byId('detail-drawer');
  if (!pane || !drawer || drawer.hidden || !drawer.style) return;
  applyDrawerMode();
  if (narrowScreen()) { drawer.style.top = ''; drawer.style.height = ''; return; }
  drawer.style.top = `${Number(pane.scrollTop) || 0}px`;
  if (pane.clientHeight) drawer.style.height = `${pane.clientHeight}px`;
}
// 取消关闭动效中的待执行收起：清掉兜底定时器，并移除抽屉上的 transitionend 监听。没有待执行收起时什么也不做。
function cancelPendingClose() {
  if (!pendingClose) return;
  const drawer = byId('detail-drawer');
  clearTimeout(pendingClose.timer);
  drawer?.removeEventListener?.('transitionend', pendingClose.onEnd);
  pendingClose = null;
}
// focus=false 时只把抽屉显示出来，不移动焦点（永久链接加载用）。抽屉标题固定为“完整知识与源码”，指令名只在正文标题里出现。
function openDetailDrawer({ focus = true } = {}) {
  const drawer = byId('detail-drawer');
  const title = byId('detail-drawer-title');
  if (!drawer) return;
  // 记下这次打开前是否正处于关闭动效中，再取消待执行的收起。关闭中重新打开时，焦点来源同样需要更新。
  const closing = Boolean(pendingClose);
  cancelPendingClose();
  // 只有从关闭到打开（含关闭动效中途重开）时记住触发元素。已经稳定打开时换内容，不把焦点来源改成抽屉标题自己。
  if (drawer.hidden || closing) {
    const active = document.activeElement;
    if (focus && active && typeof active.focus === 'function' && active !== title && active !== drawer && !within(drawer, active)) drawerTrigger = active;
  }
  if (drawer.hidden) {
    drawer.hidden = false;
    drawer.classList?.remove?.('is-open');
    if (motionOn() && typeof requestAnimationFrame === 'function') requestAnimationFrame(() => drawer.classList?.add?.('is-open'));
    else drawer.classList?.add?.('is-open');
  } else {
    // 关闭动效中途重开：抽屉还没隐藏，只需把 is-open 加回去，让它滑回可见位置。
    drawer.classList?.add?.('is-open');
  }
  pinDrawer();
  if (focus && title) { title.tabIndex = -1; title.focus(); }
}
// restoreFocus=false：由程序关闭（新查询、会话重置）且焦点不在抽屉里时，不把焦点拽回旧触发元素。
function closeDetailDrawer({ restoreFocus = true } = {}) {
  const drawer = byId('detail-drawer');
  if (!drawer || drawer.hidden) return;
  // 已经在关闭动效中再次关闭：先撤掉上一次的待执行收起，按本次参数重新计时。
  cancelPendingClose();
  // 焦点在抽屉里时必须还回去，否则抽屉隐藏后焦点会掉到 body。
  const giveBack = restoreFocus || within(drawer, document.activeElement);
  const finish = () => {
    // 无论从哪条路径进入收起（定时器或 transitionend），先清掉另一条待执行路径，避免重复收起。
    cancelPendingClose();
    if (drawer.hidden) return;
    drawer.hidden = true;
    drawer.classList?.remove?.('is-open');
    applyDrawerMode();
    const trigger = drawerTrigger;
    drawerTrigger = null;
    if (giveBack && trigger && typeof trigger.focus === 'function') trigger.focus();
  };
  drawer.classList?.remove?.('is-open');
  // 测试环境没有 matchMedia，直接收起，方便断言焦点还原。浏览器里等滑出动画结束再 hidden。
  if (!motionOn()) { finish(); return; }
  // transitionend 会从抽屉内部子元素冒泡上来，必须同时满足 target 是抽屉本身、属性是抽屉的 transform 过渡（见 styles.css 的 .detail-drawer），否则不收起。
  const pending = {
    timer: null,
    onEnd: event => {
      if (event?.target !== drawer || event?.propertyName !== 'transform') return;
      finish();
    },
  };
  pending.timer = setTimeout(finish, 400);
  pendingClose = pending;
  drawer.addEventListener?.('transitionend', pending.onEnd);
}
// 资料库标签的计数只反映当前分析对象的指令行数；没有分析对象时留空，不显示 0。
function updateLibraryCounts() {
  const snapshot = getAnalysisSnapshot();
  byId('library-input-count').textContent = snapshot?.rows.length ? String(snapshot.rows.length) : '';
}

// 切换资料库标签。manual=true 表示用户主动点击或用键盘切换，之后后台刷新不再改选项。
// 注意：资料库标签的方向键“即激活”（焦点移动即切换面板，自动激活模式），与右栏轮次标签“方向键只移焦点、Enter/空格才切换”不同。
// 这是有意的：资料库面板切换成本低（自动激活模式），右栏轮次则保留 Enter/空格确认。
function setLibraryTab(name, { manual = false } = {}) {
  if (!LIBRARY_TABS.includes(name)) return;
  if (manual) libraryManual = true;
  for (const item of LIBRARY_TABS) {
    const on = item === name;
    const tab = byId(`library-tab-${item}`);
    tab.setAttribute('aria-selected', on ? 'true' : 'false');
    tab.tabIndex = on ? 0 : -1;
    byId(`library-panel-${item}`).hidden = !on;
  }
}

// 默认标签：有本次输入且已识别出指令时为“本次输入”，否则为“全部目录”。用户手动切换过就不再改。
function applyDefaultLibraryTab() {
  if (libraryManual) return;
  setLibraryTab(getAnalysisSnapshot()?.rows.length ? 'input' : 'catalog');
}

// 快照变化后的统一刷新：本次输入树、标签计数与默认标签。
function commitLibrary() {
  renderInputTree();
  updateLibraryCounts();
  applyDefaultLibraryTab();
}

// 写入新的分析对象快照，并刷新资料库。解析失败时仍写入已有的部分结果，与原先逐条识别的行为一致。
function commitSnapshot(snapshot) {
  setAnalysisSnapshot(snapshot);
  commitLibrary();
}

function clearQuery(text) {
  resultOwner = null; ownedMessage = null;
  ++querySequence;
  ++previewSequence;
  clearAnalysisSnapshot();
  byId('query-submit').disabled = false;
  byId('query-status').replaceChildren();
  // 清空分析对象后，右栏大纲与卡片、资料库树的选中高亮一并取消。
  selectDirective(null, 'clear');
  commitLibrary();
  detailMessage(text);
  closeDetailDrawer({ restoreFocus: false });
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
  // stale 标记：输入变化后的提示，显示在资料库标签栏下方，不影响已有的回答。
  byId('query-status').append(element('p', '输入已变化，请重新查询。', 'query-message stale'));
}

// 本次输入的候选按知识身份去重，用于判断是否可以自动预览唯一候选。
function candidatesOf(matches) {
  return [...new Map(matches.flatMap(match => match.candidates).map(entry => [entry.id, entry])).values()];
}

// 没有分析对象时的空状态文案：说明在上方输入后会列出什么，并指向“全部目录”。
const INPUT_EMPTY_TEXT = '在上方输入配置后，这里会按配置块列出识别出的指令；想先浏览，请切换到“全部目录”。';

// 本次输入树：数据来自 analysis-state 快照（与右栏回答卡同源，不在这里重算）。
// 每次快照或筛选变化时整棵重建；之后选中变化只由 refreshSelectionHighlight 增量改 class。
function renderInputTree() {
  const snapshot = getAnalysisSnapshot();
  const tree = byId('input-tree');
  const toolbar = byId('result-toolbar');
  const legend = byId('result-note');
  const empty = byId('input-empty');
  const emptyNote = byId('result-empty');
  tree.replaceChildren();
  treeButtons = [];
  if (!snapshot || !snapshot.rows.length) {
    empty.textContent = snapshot ? '本次输入中没有可识别的指令。' : INPUT_EMPTY_TEXT;
    empty.hidden = false;
    toolbar.hidden = true;
    legend.hidden = true;
    emptyNote.hidden = true;
    byId('result-count').textContent = '';
    return;
  }
  empty.hidden = true;
  toolbar.hidden = false;
  legend.hidden = false;
  const attentionOnly = byId('result-filter').value === 'attention';
  const stats = { shown: 0 };
  const items = snapshot.tree.map(node => treeNode(node, snapshot, attentionOnly, stats)).filter(Boolean);
  tree.append(...items);
  byId('result-count').textContent = `${stats.shown} / ${snapshot.rows.length} 行`;
  emptyNote.hidden = !(attentionOnly && stats.shown === 0);
}

// 渲染一个树节点（块或指令行）。返回 null 表示在“只看需关注”下整段都不可见。
// 块在自身不需关注、但子项需关注时仍保留，便于定位；stats.shown 只计本身通过筛选的行。
function treeNode(node, snapshot, attentionOnly, stats) {
  const row = snapshot.rows[node.index];
  const item = row.item;
  const children = node.children.map(child => treeNode(child, snapshot, attentionOnly, stats)).filter(Boolean);
  const self = !attentionOnly || row.attention;
  if (!self && !children.length) return null;
  if (self) stats.shown += 1;

  const li = element('li', undefined, 'tree-item');
  const head = element('div', undefined, 'tree-row');
  // 块可以折叠子项；子项列表与折叠按钮只在有子项时出现。
  let childList = null;
  let toggle = null;
  if (children.length) {
    childList = element('ul', undefined, 'tree-children');
    childList.append(...children);
    toggle = element('button', undefined, 'tree-toggle');
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', `折叠或展开 ${item.name} 块`);
    toggle.addEventListener('click', () => {
      const folded = !childList.hidden;
      childList.hidden = folded;
      li.classList.toggle('is-folded', folded);
      toggle.setAttribute('aria-expanded', folded ? 'false' : 'true');
    });
  }

  const selectable = Boolean(row.entryId);
  const candidates = row.candidates;
  const noteFor = entry => `来源：本次输入 ${item.name} 的候选中手动选择。${STATUS_LABELS[row.match.status]}；以下仅预览所选知识条目。`;
  // 多候选（未唯一匹配）：行内展开候选列表，候选点击打开抽屉预览。
  let candidateList = null;
  let expand = null;
  const toggleCandidates = () => {
    const open = candidateList.hidden;
    candidateList.hidden = !open;
    expand.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  if (candidates.length > 1) {
    candidateList = element('ul', undefined, 'tree-candidates');
    candidateList.hidden = true;
    for (const entry of candidates) {
      const entryItem = element('li');
      const button = element('button', `${entry.name} · ${entry.module} · ${sourceDescription(entry)} ↗`, 'candidate-button tree-candidate');
      button.type = 'button';
      button.dataset.id = entry.id;
      // 点击时读取当前代次：资料库里的按钮可能比本次识别更早渲染，不能用渲染时的代次。
      button.addEventListener('click', () => preview(entry, noteFor(entry), querySequence, { reveal: true }));
      entryItem.append(button);
      candidateList.append(entryItem);
    }
    expand = element('button', `候选 ${candidates.length}`, 'tree-expand');
    expand.type = 'button';
    expand.setAttribute('aria-expanded', 'false');
    expand.addEventListener('click', toggleCandidates);
  } else if (candidates.length === 1) {
    // 唯一候选：行内给一个“详情”按钮，一次点击直接打开抽屉，不再多列一层候选。
    expand = element('button', '详情', 'tree-expand');
    expand.type = 'button';
    expand.setAttribute('aria-label', `查看 ${item.name} 的完整详情`);
    expand.addEventListener('click', () => preview(candidates[0], noteFor(candidates[0]), querySequence, { reveal: true }));
  }

  // 主行：唯一候选点击即同步右栏；多候选的行点击展开候选；未收录的行只展示不可点。
  const interactive = selectable || candidates.length > 1;
  const main = element(interactive ? 'button' : 'div', undefined, 'tree-main');
  if (interactive) main.type = 'button';
  main.title = `${item.name} · 第 ${item.line} 行`;
  const isBlock = Boolean(item.kind === 'block');
  main.append(element('span', undefined, `status-dot status-dot-${row.tone}`), element('span', item.name, 'tree-name'));
  if (item.raw_args.length) main.append(element('span', item.raw_args.join(' '), 'tree-args'));
  main.append(element('span', STATUS_LABELS[row.match.status] ?? row.match.status, 'tree-status'));
  const lineText = isBlock ? (node.endLine === item.line ? `第 ${item.line} 行` : `第 ${item.line}–${node.endLine} 行`) : `行 ${item.line}`;
  main.append(element('span', `${lineText}${item.complete ? '' : ' · 未完成'}`, 'tree-line'));
  if (selectable) {
    main.setAttribute('aria-pressed', 'false');
    main.addEventListener('click', () => selectDirective(row.entryId, 'library'));
    treeButtons.push({ id: row.entryId, node: main });
  } else if (candidateList) main.addEventListener('click', toggleCandidates);

  if (toggle) head.append(toggle);
  head.append(main);
  if (expand) head.append(expand);
  li.append(head);
  if (candidateList) li.append(candidateList);
  if (childList) li.append(childList);
  return li;
}

// 选中变化只改 class 与 aria，不重建节点：资料库树、全部目录同时点亮同一条指令。
function refreshSelectionHighlight() {
  const selected = getSelectedEntryId();
  for (const { id, node } of treeButtons) {
    const on = Boolean(selected) && id === selected;
    node.classList.toggle('is-selected', on);
    node.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  for (const { id, node } of catalogButtons) {
    const on = Boolean(selected) && id === selected;
    node.classList.toggle('active', on);
    if (on) node.setAttribute('aria-current', 'true');
    else node.removeAttribute('aria-current');
  }
  // 选中项所在分组：收起或尚未构建按钮时，在分组摘要上给出小圆点和读屏说明；分组展开后按钮已高亮，不再重复提示。
  const selectedModule = selected ? (index?.directives ?? []).find(entry => entry.id === selected)?.module ?? null : null;
  for (const mark of catalogGroupMarks) {
    const on = Boolean(selectedModule) && mark.module === selectedModule && !mark.details.open;
    mark.dot.hidden = !on;
    mark.note.hidden = !on;
  }
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

function renderDetail(detail, previewNote, { reveal = false } = {}) {
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
        button.addEventListener('click', () => preview(entry, '来源：关联知识预览，不代表当前输入匹配。', generation, { reveal: true }));
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
  // 详情正文已经写入后再打开，避免空抽屉先弹出来。
  revealDrawer(reveal);
}

// reveal 决定详情写完后抽屉怎么处理：
// - false（默认）：只写 #detail-panel，不打开抽屉、不动焦点。用于自动预览（Agent 回答后的唯一候选、本地单项查询）。
// - true：打开抽屉并把焦点移到抽屉标题。只用于用户主动点击（目录项、候选按钮、“查看完整详情”、详情里的关联条目）。
// - 'passive'：打开抽屉但不移焦点。只用于永久链接加载：右栏已没有第 3 步，不打开就看不到链接指定的条目。
function revealDrawer(reveal) {
  if (reveal === true) openDetailDrawer();
  else if (reveal === 'passive') openDetailDrawer({ focus: false });
}

async function preview(entry, note, generation = querySequence, { reveal = false } = {}) {
  if (generation !== querySequence) return;
  const sequence = ++previewSequence;
  // 选中状态统一经 selection.mjs 广播：全部目录、资料库树、右栏大纲与卡片都据此同步高亮。
  selectDirective(entry.id, 'preview');
  detailMessage('正在读取该发布的知识详情…');
  try {
    const detail = await client.getDetail(entry, index);
    if (generation === querySequence && sequence === previewSequence) renderDetail(detail, note, { reveal });
  } catch (error) {
    if (generation !== querySequence || sequence !== previewSequence) return;
    selectDirective(null, 'preview-failed');
    detailMessage(`${error.code ? error.message : '知识详情读取失败或版本不一致，请检查发布文件。'} 可重新选择本次候选。`, true);
    revealDrawer(reveal);
  }
}

// 全部目录：永远针对完整目录，搜索与筛选始终可用。按模块分组，默认折叠。
// 任一筛选生效（搜索词、模块、来源、context、阶段、仅已核实）时，命中组自动展开；清除筛选后恢复用户自己的展开记录。
// 分组内的指令按钮只在该组第一次展开时才构建（目录约 1041 条、约 5000 个节点，全量构建代价过高）。
function renderCatalog() {
  // 立即渲染会取代尚未到期的防抖渲染，先把挂起的定时器取消。
  clearTimeout(catalogSearchTimer);
  catalogSearchTimer = null;
  const term = byId('catalog-search').value.toLowerCase().trim();
  const module = byId('catalog-module').value; const context = byId('catalog-context').value; const phase = byId('catalog-phase').value;
  const source = byId('catalog-source').value;
  const verifiedOnly = byId('verified-only').checked;
  const entries = (index?.directives ?? []).filter(entry => (!source || (entry.source?.kind ?? 'bundled') === source) && (!term || `${entry.name} ${entry.module} ${entry.component}`.toLowerCase().includes(term)) && (!module || entry.module === module) && (!context || entry.contexts.includes(context)) && (!phase || entry.phases.includes(phase)) && (!verifiedOnly || entry.verification !== 'registration_only'));
  byId('catalog-count').textContent = String(entries.length);
  const list = byId('catalog-list'); list.replaceChildren();
  catalogButtons = [];
  catalogGroupMarks = [];
  const renderId = ++catalogRenderSequence;
  // 按模块分组，保持目录原有的先后顺序。
  const groups = new Map();
  for (const entry of entries) { if (!groups.has(entry.module)) groups.set(entry.module, []); groups.get(entry.module).push(entry); }
  const filtering = Boolean(term || module || source || context || phase || verifiedOnly);
  for (const [moduleName, group] of groups) {
    const details = element('details', undefined, 'catalog-group');
    details.dataset.module = moduleName;
    // 筛选生效时命中组一律展开；否则按用户自己的展开记录。
    details.open = filtering || openModules.has(moduleName);
    const summary = element('summary', undefined, 'catalog-group-summary');
    // 选中项提示：小圆点只给视觉，读屏用隐藏的文字说明；两者都由 refreshSelectionHighlight 按选中状态与展开状态开关。
    const dot = element('span', undefined, 'catalog-group-dot');
    dot.setAttribute('aria-hidden', 'true');
    dot.hidden = true;
    const note = element('span', '（含当前选中指令）', 'sr-only');
    note.hidden = true;
    summary.append(element('span', moduleName, 'catalog-group-name'), dot, note, element('span', `${group.length} 条`, 'catalog-group-count'));
    catalogGroupMarks.push({ module: moduleName, details, dot, note });
    details.append(summary);
    // 构建只做一次，并且用的是本次渲染的 group（即当前筛选结果）；之后的筛选变化会整表重建，不会留下过期的按钮。
    let built = false;
    const build = () => {
      if (built) return;
      built = true;
      for (const entry of group) {
        const button = element('button', undefined, 'catalog-entry'); button.type = 'button';
        button.dataset.id = entry.id;
        button.append(element('strong', entry.name), element('small', VERIFICATION_LABELS[entry.verification], entry.verification === 'registration_only' ? 'unverified' : ''));
        button.append(element('small', sourceDescription(entry)));
        // 点击时读取当前代次：目录按钮可能早于最近一次查询渲染，不能沿用渲染时的代次。
        button.addEventListener('click', () => preview(entry, '来源：全部目录中手动选择的知识预览，不代表本次输入匹配。', querySequence, { reveal: true }));
        catalogButtons.push({ id: entry.id, node: button });
        details.append(button);
      }
    };
    if (details.open) build();
    details.addEventListener('toggle', () => {
      // 旧表迟到的 toggle 不写入新表，也不改用户的展开记录。
      if (renderId !== catalogRenderSequence) return;
      if (details.open) build();
      // 每次展开/收起都刷新高亮：收起后要显示选中圆点，展开后圆点让位给按钮本身的高亮。
      refreshSelectionHighlight();
      // 筛选自动展开时不写入展开记录，清除筛选后恢复用户原来的状态。
      if (filtering) return;
      if (details.open) openModules.add(moduleName); else openModules.delete(moduleName);
    });
    list.append(details);
  }
  if (!entries.length) list.append(element('p', '当前筛选下没有条目。可清除搜索与筛选后重试。', 'verification-notes'));
  refreshSelectionHighlight();
}
// 搜索输入的防抖入口：输入停止 CATALOG_SEARCH_DELAY_MS 后才整表重建。
function scheduleCatalogRender() {
  clearTimeout(catalogSearchTimer);
  catalogSearchTimer = setTimeout(() => { catalogSearchTimer = null; renderCatalog(); }, CATALOG_SEARCH_DELAY_MS);
}
// 立即执行挂起的目录渲染；没有挂起时什么也不做。测试与自动化用它代替等待防抖计时。
function flushCatalogRender() {
  if (catalogSearchTimer === null) return;
  renderCatalog();
}

async function submit(generation, request) {
  const status = byId('query-status');
  // 本次输入对应的对象键：Agent 提交时带 request，本地查询为 null（资料库不属于任何轮次）。
  const key = request ? analysisKey(request) : null;
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
    // 单项查询的结果以一条识别行的形式进入资料库“本次输入”；候选在该行内展开，不再单独列出。
    const singleCandidates = result.match ? result.match.candidates : [];
    if (parsed.status === 'ok' && result.match) {
      commitSnapshot(buildSnapshot({ key, mode: 'single', input, parsed: { directives: [parsed.directive], errors: [] }, matches: [result.match] }));
    }
    if (detailFailed) {
      selectDirective(null, 'query-detail-failed');
      detailMessage('知识详情读取失败，已保留本次候选，可在资料库“本次输入”中展开候选重新读取；本次查询仍为知识暂不可用。', true);
      return;
    }
    if (result.detail && ['matched', 'context_required'].includes(result.status) && singleCandidates.length === 1) {
      ++previewSequence; selectDirective(result.detail.id, 'preview'); renderDetail(result.detail, queryPreviewNote(result.status));
    } else detailMessage(result.status === 'ambiguous' ? '本次输入存在多个候选，请在资料库“本次输入”中展开候选选择模块/条目。' : singleCandidates.length ? '本次输入存在候选，请在资料库“本次输入”中展开候选查看知识预览。' : '本次输入未找到候选；当前索引未收录不代表 OpenResty 不支持。');
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
    // 识别结果即使不完整或索引无效也写入资料库（与原先逐条列出的行为一致），但不据此提供可预览的候选。
    commitSnapshot(buildSnapshot({ key, mode: mainConfig ? 'main' : 'fragment', input, parsed, matches }));
    if (!valid) {
      if (!parsed.errors.length) status.append(element('p', '知识索引无效，未发布本次候选。', 'query-message error'));
      detailMessage('输入解析失败或知识索引无效，未显示可选候选；请修正后重新查询。', true);
      return;
    }
    const candidates = candidatesOf(matches);
    if (needsOuterContext(parsed)) {
      status.append(element('p', '请提供外层 http 或 stream 等所属块，以确定上下文。确认属于 stream 时，可手动包入 stream { ... } 后重新查询；不会自动包装或猜测。', 'query-message'));
    }
    if (!parsed.directives.length) detailMessage('输入中没有指令，请输入配置后重新查询。');
    else if (!candidates.length) detailMessage('本次输入未找到候选；当前索引未收录不代表 OpenResty 不支持。');
    else if (parsed.directives.length > 1) detailMessage('本次输入包含多条指令，请在资料库“本次输入”中展开并选择要查看的候选；上下文不足时不自动选择模块。');
    else if (candidates.length === 1 && ['matched', 'context_required'].includes(matches[0].status)) {
      await preview(candidates[0], queryPreviewNote(matches[0].status), generation);
    } else detailMessage(matches[0].status === 'ambiguous' ? '本次输入存在多个候选，请在资料库“本次输入”中展开并选择模块/条目。' : '本次输入存在候选，请在资料库“本次输入”中展开并选择模块/条目查看知识预览。');
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
    ++previewSequence;
    clearAnalysisSnapshot();
    selectDirective(null, 'query-failed');
    commitLibrary();
    byId('query-status').replaceChildren(element('p', '查询未完成，请检查输入及知识发布。', 'query-message error'));
    detailMessage('本次查询失败，未显示候选详情。', true);
  } finally {
    if (generation === querySequence) {
      button.disabled = false;
      updateLibraryCounts();
      // 回答卡可能先画完。通知 agent 按新的识别结果再判一次“需关注”。
      // 带上本次识别对应的请求（本地查询为 null），agent 据此只更新识别对象相同的那一轮，不改写其它轮的同名卡片。
      byId('configuration').dispatchEvent(new CustomEvent('agent-parsed', { detail: { request: request ?? null } }));
    }
  }
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
byId('result-filter').addEventListener('change', renderInputTree);
for (const id of ['query-context', 'query-module']) byId(id).addEventListener('change', inputChanged);
// 全部目录：搜索、筛选与清除始终可用，不随本次输入的候选状态变化。
// 搜索框按输入防抖；下拉与复选框是离散操作，立即整表重建。
byId('catalog-search').addEventListener('input', scheduleCatalogRender);
for (const id of ['catalog-source', 'catalog-module', 'catalog-context', 'catalog-phase', 'verified-only']) byId(id).addEventListener('change', renderCatalog);
byId('catalog-reset').addEventListener('click', () => {
  for (const id of ['catalog-search', 'catalog-source', 'catalog-module', 'catalog-context', 'catalog-phase']) byId(id).value = '';
  byId('verified-only').checked = false;
  renderCatalog();
});
// 资料库标签：点击与键盘切换都算用户手动选择，之后的后台刷新不再改选项。
for (const name of LIBRARY_TABS) byId(`library-tab-${name}`).addEventListener('click', () => setLibraryTab(name, { manual: true }));
byId('library-tabs').addEventListener('keydown', event => {
  const current = LIBRARY_TABS.findIndex(name => byId(`library-tab-${name}`) === document.activeElement);
  if (current < 0) return;
  let next = null;
  if (event.key === 'ArrowRight') next = (current + 1) % LIBRARY_TABS.length;
  else if (event.key === 'ArrowLeft') next = (current - 1 + LIBRARY_TABS.length) % LIBRARY_TABS.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = LIBRARY_TABS.length - 1;
  if (next === null) return;
  event.preventDefault?.();
  setLibraryTab(LIBRARY_TABS[next], { manual: true });
  byId(`library-tab-${LIBRARY_TABS[next]}`).focus();
});
// “跳到资料库”（会话栏旁）：输入框拖到很高时资料库可能在首屏下方。滚动到资料库标题，并把焦点移到当前可见的标签；
// 只移动焦点与滚动，不改变标签的选择。焦点用 preventScroll，避免与刚开始的平滑滚动相互抢位置。
byId('library-jump')?.addEventListener('click', () => {
  byId('library')?.scrollIntoView?.({ block: 'start', behavior: motionOn() ? 'smooth' : 'auto' });
  const current = LIBRARY_TABS.find(name => byId(`library-tab-${name}`)?.getAttribute?.('aria-selected') === 'true') ?? 'catalog';
  byId(`library-tab-${current}`)?.focus?.({ preventScroll: true });
});
// 选中变化（目录、资料库树、右栏大纲与卡片任一处发起）统一在这里同步目录与资料库树的高亮。
document.addEventListener?.('directive-select', refreshSelectionHighlight);

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
    if (entry) await preview(entry, '来源：永久详情链接指定的知识条目，不代表当前输入匹配。', generation, { reveal: 'passive' });
    else if (requested) { message('该发布中未找到请求的知识标识。', true); detailMessage('该发布中未找到链接指定的知识条目。', true); }
  }
  document.body.dataset.ready = 'true';
  void startExamples(config.request_timeout_ms);
  await startReferences();
}
// 假 DOM 不解析 HTML 属性，这里显式收起抽屉，与页面上的 hidden 一致。
if (byId('detail-drawer')) { byId('detail-drawer').hidden = true; applyDrawerMode(); }
// 启动时资料库的初始状态：没有分析对象，停在“全部目录”，本次输入树显示空状态。
// 显式写入 aria 与 hidden，不依赖 HTML 属性的默认值（测试假 DOM 不解析属性）。
setLibraryTab('catalog');
renderInputTree();
updateLibraryCounts();
byId('detail-close')?.addEventListener('click', () => closeDetailDrawer());
byId('pane-right')?.addEventListener('scroll', pinDrawer);
if (typeof addEventListener === 'function') addEventListener('resize', pinDrawer);

// ---------- 顶栏“关于”弹层 ----------
// 原页脚的覆盖范围、待验收事项与发布号放在这里，页脚不再占位。非模态：Esc 与点外部关闭；
// 关闭后焦点回到“关于”按钮，点外部时不抢焦点。监听只在打开期间挂载，关闭即摘除。
let aboutOpen = false;
// 沿 parentNode 判断包含关系，与 within 相同，但单独命名避免与其他脚本的顶层名字冲突。
function aboutWithin(root, target) {
  for (let node = target; node; node = node.parentNode) if (node === root) return true;
  return false;
}
function onAboutPointer(event) {
  if (!aboutWithin(byId('about-wrap'), event.target)) setAbout(false);
}
// open=true：挂载外部点击监听，把焦点移到弹层标题（可读屏朗读）。open=false：摘除监听，restoreFocus 为 true 时焦点回到按钮。
// 同一状态重复调用只同步属性，不重复挂载监听。
function setAbout(open, { restoreFocus = false } = {}) {
  const toggle = byId('about-toggle');
  const popover = byId('about-popover');
  if (!toggle || !popover) return;
  const was = aboutOpen;
  aboutOpen = open;
  popover.hidden = !open;
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open && !was) {
    document.addEventListener?.('pointerdown', onAboutPointer);
    byId('about-title')?.focus?.();
  } else if (!open && was) {
    document.removeEventListener?.('pointerdown', onAboutPointer);
    if (restoreFocus) toggle.focus?.();
  }
}
byId('about-toggle')?.addEventListener('click', () => setAbout(!aboutOpen));
byId('about-close')?.addEventListener('click', () => setAbout(false, { restoreFocus: true }));
// 弹层内按 Esc：收起并还焦点。阻止冒泡，免得同一次 Esc 也关掉右侧详情抽屉。
byId('about-wrap')?.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !aboutOpen) return;
  event.preventDefault?.();
  event.stopPropagation?.();
  setAbout(false, { restoreFocus: true });
});
// 窗口尺寸变化时收起，弹层不留下错位的半开状态。
if (typeof addEventListener === 'function') addEventListener('resize', () => setAbout(false));
// 初始化：显式写入 hidden 与 aria-expanded，不依赖 HTML 属性。
setAbout(false);
// Esc 只在抽屉打开时生效。窄屏模态下随时可关；宽屏非模态时，焦点在抽屉里才关，
// 焦点在输入框、下拉框等可编辑控件里一律不关（避免在搜索框里按 Esc 清空时误关抽屉），其余位置视为没有别的可关闭层，照常关闭。
function editable(target) {
  const tag = String(target?.tagName ?? '').toLowerCase();
  return ['input', 'textarea', 'select'].includes(tag) || target?.isContentEditable === true;
}
document.addEventListener?.('keydown', event => {
  trapDrawerFocus(event);
  if (event.key !== 'Escape') return;
  const drawer = byId('detail-drawer');
  if (!drawer || drawer.hidden) return;
  const active = document.activeElement;
  const modal = drawer.getAttribute('aria-modal') === 'true';
  if (!modal && !within(drawer, active) && editable(active)) return;
  closeDetailDrawer();
});
document.addEventListener?.('directive-open-detail', event => {
  const entryId = event.detail?.entryId;
  if (typeof entryId !== 'string' || !entryId) return;
  const entry = index?.directives?.find(item => item.id === entryId);
  if (!entry) {
    detailMessage('当前发布没有这条指令的完整详情。', true);
    openDetailDrawer();
    return;
  }
  void preview(entry, '来源：回答中打开的完整知识详情，不代表本次输入匹配或上下文已确认。', querySequence, { reveal: true });
});
const startupSequence = querySequence;
start().catch(error => {
  if (startupSequence !== querySequence) return;
  clearQuery('站点加载失败，未显示目录或详情。');
  message(error.code ? `站点加载失败：${error.message}。` : '站点加载失败：请通过 HTTP 托管打开，并确认知识索引和配置文件存在且版本一致。', true);
});
