// 当前选中的是哪一条指令（全站唯一的选中状态）。
// 全部目录、左栏资料库“本次输入”树、右栏大纲与指令卡都只通过这里的 directive-select 事件同步高亮，
// 不直接改对方的 DOM。点大纲、卡片或资料库只发这个事件；只有 source 为 library 时右栏才额外定位卡片，
// 打开抽屉仍由各自的点击入口决定（大纲与资料库点选都不打开抽屉）。

let selectedEntryId = null;

// 当前选中的知识条目 id；还没有选中时是 null。
export function getSelectedEntryId() {
  return selectedEntryId;
}

// 选中一条指令，并在 document 上广播。
// entryId 为空时表示取消选中。source 标明是谁触发的（outline / card / preview），方便以后的左栏树区分来源。
export function selectDirective(entryId, source = 'unknown') {
  const next = entryId == null || entryId === '' ? null : String(entryId);
  selectedEntryId = next;
  document.dispatchEvent(new CustomEvent('directive-select', {
    detail: { entryId: next, source: String(source) },
  }));
}
