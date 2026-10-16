// 左右分栏布局：分隔条拖动 / 键盘调整左栏宽度，并记住用户的选择。
// 只处理布局与滚动，不涉及查询、Agent 请求或知识数据，任何异常都不能影响原功能。

const split = document.getElementById('split');
const splitter = document.getElementById('splitter');
const left = document.getElementById('pane-left');

// 子路径部署（如 /pi/）与根路径分开保存，避免不同入口互相覆盖宽度偏好。
const storageKey = `openresty-layout-left${location.pathname.replace(/[^/]*$/, '') === '/' ? '' : `:${location.pathname.replace(/[^/]*$/, '')}`}`;
const MIN_LEFT = 340;   // 左栏最小宽度：保证编辑器和按钮行不挤压换行
const MIN_RIGHT = 420;  // 右栏最小宽度：保证回答卡片的“字段名 + 正文”两列可读
const DEFAULT_RATIO = 0.42;
const KEY_STEP = 32;    // 方向键每次调整的像素；按住 Shift 时放大 4 倍

// 窄屏时改为上下堆叠，分隔条隐藏，宽度设置不生效。
const stacked = () => matchMedia('(max-width: 960px)').matches;

// 把期望宽度限制在左右最小宽度之间；容器过窄时以左栏最小宽度为准。
function clamp(px) {
  const total = split.clientWidth - splitter.offsetWidth;
  return Math.round(Math.max(MIN_LEFT, Math.min(px, total - MIN_RIGHT)));
}

// 以比例保存，窗口缩放后左右栏仍保持用户习惯的占比。
function apply(px, persist = false) {
  const width = clamp(px);
  split.style.setProperty('--left-width', `${width}px`);
  const total = split.clientWidth - splitter.offsetWidth;
  const ratio = total > 0 ? width / total : DEFAULT_RATIO;
  splitter.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
  splitter.setAttribute('aria-valuemin', '0');
  splitter.setAttribute('aria-valuemax', '100');
  splitter.setAttribute('aria-valuetext', `左栏约 ${Math.round(ratio * 100)}%`);
  if (persist) { try { localStorage.setItem(storageKey, ratio.toFixed(4)); } catch {} }
}

function savedRatio() {
  let value = NaN;
  try { value = Number(localStorage.getItem(storageKey)); } catch {}
  return value > 0.1 && value < 0.9 ? value : DEFAULT_RATIO;
}

function restore() {
  if (stacked()) return;
  apply((split.clientWidth - splitter.offsetWidth) * savedRatio());
}

// 拖动：使用 Pointer Events 并捕获指针，鼠标移出分隔条或快速拖动时也不会“丢失”。
splitter.addEventListener('pointerdown', event => {
  if (stacked() || event.button !== 0) return;
  event.preventDefault();
  // 个别环境（如合成事件、部分触屏）不支持捕获时仍按普通拖动处理。
  try { splitter.setPointerCapture(event.pointerId); } catch {}
  document.body.classList.add('is-resizing');
  const origin = split.getBoundingClientRect().left;
  const move = e => apply(e.clientX - origin - splitter.offsetWidth / 2);
  const end = e => {
    apply(e.clientX - origin - splitter.offsetWidth / 2, true);
    document.body.classList.remove('is-resizing');
    splitter.removeEventListener('pointermove', move);
    splitter.removeEventListener('pointerup', end);
    splitter.removeEventListener('pointercancel', end);
  };
  splitter.addEventListener('pointermove', move);
  splitter.addEventListener('pointerup', end);
  splitter.addEventListener('pointercancel', end);
});

// 键盘：左右方向键微调，Home/End 推到最窄/最宽，Enter 恢复默认。
splitter.addEventListener('keydown', event => {
  if (stacked()) return;
  const current = left.getBoundingClientRect().width;
  const step = event.shiftKey ? KEY_STEP * 4 : KEY_STEP;
  const total = split.clientWidth - splitter.offsetWidth;
  const next = { ArrowLeft: current - step, ArrowRight: current + step, Home: MIN_LEFT, End: total - MIN_RIGHT, Enter: total * DEFAULT_RATIO }[event.key];
  if (next === undefined) return;
  event.preventDefault();
  apply(next, true);
});

// 双击分隔条恢复默认比例。
splitter.addEventListener('dblclick', () => {
  if (stacked()) return;
  apply((split.clientWidth - splitter.offsetWidth) * DEFAULT_RATIO, true);
});

// 窗口尺寸变化时按保存的比例重新计算，并重新校验最小宽度。
let resizeFrame = 0;
addEventListener('resize', () => {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(restore);
});

// 在左栏目录或右栏识别结果中选择指令后，把右栏滚动到第 3 步详情，让用户看到选择的结果。
// 关联指令按钮本身就在详情里，不需要滚动。延后一帧，等原有点击逻辑先渲染“正在读取”状态。
document.addEventListener('click', event => {
  const target = event.target instanceof Element ? event.target.closest('.catalog-entry, .candidate-button') : null;
  if (!target || target.classList.contains('related-entry')) return;
  requestAnimationFrame(() => document.getElementById('detail-panel')?.closest('section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
});

restore();
