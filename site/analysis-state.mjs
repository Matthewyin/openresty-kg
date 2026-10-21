// 当前分析对象的识别数据层（左栏资料库“本次输入”与右栏回答卡共用）。
// app.mjs 每次解析并匹配后调用 setAnalysisSnapshot 写入一份快照；两边都只读这里，
// 不各自重算，也不从 DOM 反推。这里只保存识别层结果（解析位置、匹配状态、候选），
// 不保存回答卡的字段事实：字段核实状态仍归 agent.mjs 的各轮次。
import { needsAttention } from './src/query/config-results.mjs';

// 对象键：只取右侧候选/详情实际读取的字段，与 agent.mjs 原有口径一致。
// 追问沿用同一对象时键不变，因此不会因为 question、inputSource 等字段不同而误判为新对象。
export function analysisKey(request) {
  return JSON.stringify([request.input ?? null, request.mode ?? null, request.context || null, request.module || null, request.release ?? null]);
}

// 当前快照。null 表示没有分析对象（尚未提交、已清空、本地查询输入已变化等）。
let currentAnalysis = null;
export function getAnalysisSnapshot() { return currentAnalysis; }
export function setAnalysisSnapshot(snapshot) { currentAnalysis = snapshot ?? null; return currentAnalysis; }
export function clearAnalysisSnapshot() { currentAnalysis = null; }

// 状态色调，沿用第一步卡片的三档语义：
// - good（绿）：唯一匹配，且无需关注；
// - muted（灰）：当前索引未收录，或块内数据/控制项（不参与指令匹配）；
// - warn（琥珀）：其余需关注项，包括未唯一匹配、上下文待补、映射冲突，以及带未分析外部引用的条目。
export function rowTone(parsed, match) {
  if (match.status === 'block_entry' || match.status === 'unknown') return 'muted';
  return match.status === 'matched' && !needsAttention(parsed, match) ? 'good' : 'warn';
}

// 第 offset 个字符所在的行号（从 1 开始）。用于计算配置块闭合括号所在行。
function lineOf(text, offset) {
  let line = 1;
  for (let i = 0; i < offset && i < text.length; i++) if (text[i] === '\n') line++;
  return line;
}

// 把解析器输出的扁平 directives（parent_index 指向扁平下标）还原成嵌套树。
// 叶子是指令行；块节点的 endLine 为闭合括号所在行（未闭合时为文本末行，调用方据 complete 标注）。
// 节点只保存扁平下标 index，渲染时再从快照的 rows 取匹配结果，避免两份状态。
export function buildTree(directives, input) {
  const nodes = directives.map((item, index) => ({
    index,
    endLine: item.kind === 'block' ? lineOf(input, Math.max(0, item.end_offset - 1)) : item.line,
    children: [],
  }));
  const roots = [];
  directives.forEach((item, index) => {
    const parent = item.parent_index === null || item.parent_index === undefined ? null : nodes[item.parent_index];
    (parent ? parent.children : roots).push(nodes[index]);
  });
  return roots;
}

// 把一次解析与匹配结果整理成快照。matches 与 parsed.directives 按下标一一对应。
// rows[i] 是第 i 条指令的识别行：entryId 只在唯一候选时给出（可与右栏卡片对齐），多候选只能展开列表。
export function buildSnapshot({ key = null, mode, input, parsed, matches }) {
  const rows = parsed.directives.map((item, index) => {
    const match = matches[index];
    const candidates = match.candidates ?? [];
    return {
      index,
      item,
      match,
      candidates,
      entryId: candidates.length === 1 ? candidates[0].id : null,
      attention: needsAttention(item, match),
      tone: rowTone(item, match),
    };
  });
  return { key, mode, input, rows, tree: buildTree(parsed.directives, input) };
}

// 当前快照里是否有同名指令需关注。回答卡据此判断“待处理”，口径与左栏“需关注”一致。
// 口径偏宽：回答卡按指令名归并，无法区分同名的不同行。同名指令多次出现时，只要其中任一行需关注，
// 这里就返回 true，对应的卡片也会标为待处理（即使另一行是唯一匹配）。
export function attentionNamed(name) {
  return Boolean(currentAnalysis?.rows.some(row => row.attention && row.item.name === name));
}
