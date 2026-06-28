import type { MemoSummary, Notebook, TiptapDoc } from "@edgeever/shared";
import { DEFAULT_MEMO_TITLE } from "@edgeever/shared";
import { buildNotebookTree, type NotebookNode, type NotebookNodeComparator } from "./utils";
import * as React from "react";
import type { ReactNode } from "react";

export type Pane = "notebooks" | "memos" | "editor";
export type MemoView = "notebook" | "trash";
export type MemoFilterMode = "all" | "tagged" | "untagged" | "pinned";
export type MemoSortMode = "updated-desc" | "created-desc" | "title-asc";
export type NotebookSortMode = "name-asc" | "memo-count-desc" | "updated-desc";
export type MemoListDensity = "preview" | "compact";
export type MobileBottomNavItem = "home" | "search" | "templates" | "settings";
export type MemoContextMenuState = { memo: MemoSummary; x: number; y: number };
export type MemoSelectionContextMenuState = { x: number; y: number };
export type NotebookContextMenuState = { notebook: NotebookNode; x: number; y: number };
export type MemoDeleteConfirmation = { kind: "single" | "bulk"; memoIds: string[]; permanent: boolean };

export type NotebookNameDialogState =
  | { mode: "create"; parentId: string | null }
  | { mode: "rename"; notebook: Notebook };

export type AppNoticeDialogState = { title: string; description: string };

export type MemoTemplate = {
  id: string;
  title: string;
  description: string;
  contentMarkdown: string;
  tags: string[];
};

export const MEMO_TEMPLATES: MemoTemplate[] = [
  {
    id: "quick-note",
    title: "速记",
    description: "适合临时记录想法、链接和灵感。",
    contentMarkdown: "## 速记\n\n- \n\n## 后续动作\n\n- [ ] ",
    tags: ["template", "quick-note"],
  },
  {
    id: "meeting",
    title: "会议记录",
    description: "议题、结论和待办放在同一页。",
    contentMarkdown: "## 会议记录\n\n时间：\n参与人：\n\n## 议题\n\n- \n\n## 结论\n\n- \n\n## 待办\n\n- [ ] ",
    tags: ["template", "meeting"],
  },
  {
    id: "checklist",
    title: "清单",
    description: "快速列出待办、采购、项目检查项。",
    contentMarkdown: "## 清单\n\n- [ ] \n- [ ] \n- [ ] ",
    tags: ["template", "checklist"],
  },
  {
    id: "reading",
    title: "读书笔记",
    description: "摘录、观点和下一步阅读整理。",
    contentMarkdown: "## 读书笔记\n\n书名：\n作者：\n\n## 摘录\n\n> \n\n## 我的观点\n\n\n## 延伸问题\n\n- ",
    tags: ["template", "reading"],
  },
  {
    id: "daily",
    title: "每日复盘",
    description: "记录今天完成了什么、卡在哪里。",
    contentMarkdown: "## 每日复盘\n\n## 今天完成\n\n- \n\n## 遇到的问题\n\n- \n\n## 明天优先级\n\n- [ ] ",
    tags: ["template", "daily"],
  },
];

export const isTextEntryTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  Boolean(target.closest("input, textarea, select, [contenteditable='true'], [role='textbox'], .ProseMirror"));

export const getNotebookAncestorIds = (nodes: NotebookNode[], targetNotebookId: string) => {
  const walk = (items: NotebookNode[], ancestors: string[]): string[] | null => {
    for (const node of items) {
      if (node.id === targetNotebookId) {
        return node.children.length > 0 ? [...ancestors, node.id] : ancestors;
      }

      const result = walk(node.children, [...ancestors, node.id]);

      if (result) {
        return result;
      }
    }

    return null;
  };

  return walk(nodes, []) ?? [];
};

export const getExpandableNotebookIds = (nodes: NotebookNode[]) => {
  const ids: string[] = [];
  const walk = (items: NotebookNode[]) => {
    for (const node of items) {
      if (node.children.length > 0) {
        ids.push(node.id);
        walk(node.children);
      }
    }
  };

  walk(nodes);
  return ids;
};

export const filterNotebookTree = (nodes: NotebookNode[], search: string): NotebookNode[] => {
  const query = search.trim().toLocaleLowerCase("zh-CN");

  if (!query) {
    return nodes;
  }

  const walk = (items: NotebookNode[]): NotebookNode[] => {
    const filteredNodes: NotebookNode[] = [];

    for (const node of items) {
      const children = walk(node.children);
      const matched = node.name.toLocaleLowerCase("zh-CN").includes(query);

      if (matched) {
        filteredNodes.push({ ...node, children: node.children });
        continue;
      }

      if (children.length > 0) {
        filteredNodes.push({ ...node, children });
      }
    }

    return filteredNodes;
  };

  return walk(nodes);
};

export { buildNotebookTree, type NotebookNode };
export { DEFAULT_MEMO_TITLE };

export const IMAGE_COMPRESSION_STORAGE_KEY = "edgeever.imageCompressionEnabled";
export const MEMO_LIST_DENSITY_STORAGE_KEY = "edgeever.memoListDensity";
export const MEMO_LIST_WIDTH_STORAGE_KEY = "edgeever.memoListWidth";
export const NOTEBOOK_SORT_STORAGE_KEY = "edgeever.notebookSort";
export const DEFAULT_MEMO_LIST_WIDTH_PX = 360;
export const MIN_MEMO_LIST_WIDTH_PX = 300;
export const MAX_MEMO_LIST_WIDTH_PX = 540;

export const MEMO_DRAG_MIME = "application/x-edgeever-memos";
export const NOTEBOOK_DRAG_MIME = "application/x-edgeever-notebook";

export const MEMO_SORT_OPTIONS: Array<{ value: MemoSortMode; label: string }> = [
  { value: "updated-desc", label: "最近更新" },
  { value: "created-desc", label: "创建时间" },
  { value: "title-asc", label: "标题 A-Z" },
];

export const NOTEBOOK_SORT_OPTIONS: Array<{ value: NotebookSortMode; label: string }> = [
  { value: "name-asc", label: "名称" },
  { value: "memo-count-desc", label: "笔记数量" },
  { value: "updated-desc", label: "更新日期" },
];

export const MEMO_FILTER_OPTIONS: Array<{ value: MemoFilterMode; label: string }> = [
  { value: "all", label: "全部" },
  { value: "pinned", label: "置顶" },
  { value: "tagged", label: "有标签" },
  { value: "untagged", label: "无标签" },
];

export const getMemoTitle = (title: string | null | undefined) => title?.trim() || DEFAULT_MEMO_TITLE;

export const getActiveBlockValue = (editor: any): string => {
  if (!editor) {
    return "paragraph";
  }
  if (editor.isActive("heading", { level: 1 })) {
    return "heading-1";
  }
  if (editor.isActive("heading", { level: 2 })) {
    return "heading-2";
  }
  if (editor.isActive("heading", { level: 3 })) {
    return "heading-3";
  }
  return "paragraph";
};

export const readImageCompressionPreference = () => {
  try {
    return window.localStorage.getItem(IMAGE_COMPRESSION_STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
};

export const writeImageCompressionPreference = (enabled: boolean) => {
  try {
    window.localStorage.setItem(IMAGE_COMPRESSION_STORAGE_KEY, enabled ? "true" : "false");
  } catch {
    // Local storage can be unavailable in private or restricted browser contexts.
  }
};

export const readMemoListDensityPreference = (): MemoListDensity => {
  try {
    const density = window.localStorage.getItem(MEMO_LIST_DENSITY_STORAGE_KEY);
    return density === "compact" ? "compact" : "preview";
  } catch {
    return "preview";
  }
};

export const writeMemoListDensityPreference = (density: MemoListDensity) => {
  try {
    window.localStorage.setItem(MEMO_LIST_DENSITY_STORAGE_KEY, density);
  } catch {
    // Local storage can be unavailable in private or restricted browser contexts.
  }
};

export const clampMemoListWidth = (width: number) =>
  Math.min(MAX_MEMO_LIST_WIDTH_PX, Math.max(MIN_MEMO_LIST_WIDTH_PX, Math.round(width)));

export const readMemoListWidthPreference = () => {
  try {
    const width = Number(window.localStorage.getItem(MEMO_LIST_WIDTH_STORAGE_KEY));
    return Number.isFinite(width) ? clampMemoListWidth(width) : DEFAULT_MEMO_LIST_WIDTH_PX;
  } catch {
    return DEFAULT_MEMO_LIST_WIDTH_PX;
  }
};

export const writeMemoListWidthPreference = (width: number) => {
  try {
    window.localStorage.setItem(MEMO_LIST_WIDTH_STORAGE_KEY, String(clampMemoListWidth(width)));
  } catch {
    // Local storage can be unavailable in private or restricted browser contexts.
  }
};

export const readNotebookSortPreference = (): NotebookSortMode => {
  try {
    const sortMode = window.localStorage.getItem(NOTEBOOK_SORT_STORAGE_KEY);
    return NOTEBOOK_SORT_OPTIONS.some((option) => option.value === sortMode) ? (sortMode as NotebookSortMode) : "name-asc";
  } catch {
    return "name-asc";
  }
};

export const writeNotebookSortPreference = (sortMode: NotebookSortMode) => {
  try {
    window.localStorage.setItem(NOTEBOOK_SORT_STORAGE_KEY, sortMode);
  } catch {
    // Local storage can be unavailable in private or restricted browser contexts.
  }
};

export const compareDateDesc = (first: string, second: string) => {
  const firstTime = Date.parse(first);
  const secondTime = Date.parse(second);

  if (Number.isNaN(firstTime) && Number.isNaN(secondTime)) {
    return 0;
  }

  if (Number.isNaN(firstTime)) {
    return 1;
  }

  if (Number.isNaN(secondTime)) {
    return -1;
  }

  return secondTime - firstTime;
};

const compareNotebookNameAsc = (first: Notebook, second: Notebook) =>
  first.name.localeCompare(second.name, "zh-CN", { numeric: true, sensitivity: "base" });

const compareNotebookUpdatedDesc = (first: Notebook, second: Notebook) => {
  const dateCompare = compareDateDesc(first.lastMemoUpdatedAt ?? first.updatedAt, second.lastMemoUpdatedAt ?? second.updatedAt);
  return dateCompare !== 0 ? dateCompare : compareNotebookNameAsc(first, second);
};

export const getNotebookSortComparator = (sortMode: NotebookSortMode): NotebookNodeComparator => {
  if (sortMode === "memo-count-desc") {
    return (first, second) => second.memoCount - first.memoCount || compareNotebookNameAsc(first, second);
  }

  if (sortMode === "updated-desc") {
    return compareNotebookUpdatedDesc;
  }

  return compareNotebookNameAsc;
};

export const sortMemos = (memos: MemoSummary[], sortMode: MemoSortMode, prioritizePinned = true) =>
  [...memos].sort((first, second) => {
    if (prioritizePinned && first.isPinned !== second.isPinned) {
      return first.isPinned ? -1 : 1;
    }

    if (sortMode === "title-asc") {
      const titleCompare = getMemoTitle(first.title).localeCompare(getMemoTitle(second.title), "zh-CN", {
        numeric: true,
        sensitivity: "base",
      });

      if (titleCompare !== 0) {
        return titleCompare;
      }

      return compareDateDesc(first.updatedAt, second.updatedAt);
    }

    if (sortMode === "created-desc") {
      return compareDateDesc(first.createdAt, second.createdAt);
    }

    return compareDateDesc(first.updatedAt, second.updatedAt);
  });

export const filterMemos = (memos: MemoSummary[], filterMode: MemoFilterMode) => {
  if (filterMode === "tagged") {
    return memos.filter((memo) => memo.tags.length > 0);
  }

  if (filterMode === "untagged") {
    return memos.filter((memo) => memo.tags.length === 0);
  }

  if (filterMode === "pinned") {
    return memos.filter((memo) => memo.isPinned);
  }

  return memos;
};

export type NotebookMoveOption = { id: string; name: string; selectLabel: string; slug: string | null; depth: number };

export const getNotebookMoveOptions = (notebooks: Notebook[]) => {
  const options: NotebookMoveOption[] = [];
  const walk = (nodes: NotebookNode[], depth: number) => {
    for (const node of nodes) {
      options.push({
        id: node.id,
        name: node.name,
        selectLabel: `${"\u00A0\u00A0".repeat(depth)}${depth > 0 ? "└ " : ""}${node.name}`,
        slug: node.slug,
        depth,
      });
      walk(node.children, depth + 1);
    }
  };

  walk(buildNotebookTree(notebooks), 0);
  return options;
};

export const toggleMemoSelection = (current: Set<string>, memoId: string) => {
  const next = new Set(current);

  if (next.has(memoId)) {
    next.delete(memoId);
  } else {
    next.add(memoId);
  }

  return next;
};

export const hasMemoDragData = (dataTransfer: DataTransfer) => Array.from(dataTransfer.types).includes(MEMO_DRAG_MIME);
export const hasNotebookDragData = (dataTransfer: DataTransfer) => Array.from(dataTransfer.types).includes(NOTEBOOK_DRAG_MIME);
export const hasEdgeEverDragData = (dataTransfer: DataTransfer) => hasMemoDragData(dataTransfer) || hasNotebookDragData(dataTransfer);

export const getMemoDragIds = (dataTransfer: DataTransfer) => {
  if (!hasMemoDragData(dataTransfer)) {
    return [];
  }

  try {
    const parsed = JSON.parse(dataTransfer.getData(MEMO_DRAG_MIME)) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((value): value is string => typeof value === "string" && Boolean(value.trim()));
  } catch {
    return [];
  }
};

export type NotebookDropPosition = "before" | "inside" | "after";

export const getNotebookDropPosition = (event: React.DragEvent<HTMLElement> | DragEvent): NotebookDropPosition => {
  const currentTarget = event.currentTarget as HTMLElement;
  const rect = currentTarget.getBoundingClientRect();
  const offset = event.clientY - rect.top;

  if (offset < rect.height * 0.28) {
    return "before";
  }

  if (offset > rect.height * 0.72) {
    return "after";
  }

  return "inside";
};

export const getNotebookDropSortOrder = (
  notebooks: Notebook[],
  target: Notebook,
  position: Exclude<NotebookDropPosition, "inside">
) => {
  const siblings = notebooks
    .filter((notebook) => notebook.parentId === target.parentId)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));
  const targetIndex = siblings.findIndex((notebook) => notebook.id === target.id);
  const insertionIndex = targetIndex < 0 ? siblings.length : position === "before" ? targetIndex : targetIndex + 1;
  const previous = siblings[insertionIndex - 1];
  const next = siblings[insertionIndex];

  if (!previous && !next) {
    return target.sortOrder + (position === "before" ? -1000 : 1000);
  }

  if (!previous) {
    return next.sortOrder - 1000;
  }

  if (!next) {
    return previous.sortOrder + 1000;
  }

  return Math.floor((previous.sortOrder + next.sortOrder) / 2);
};

export const focusNotebookTreeButton = (
  currentButton: HTMLButtonElement,
  direction: "next" | "previous" | "first" | "last"
) => {
  const tree = currentButton.closest<HTMLElement>("[data-notebook-tree]");

  if (!tree) {
    return;
  }

  const buttons = Array.from(tree.querySelectorAll<HTMLButtonElement>("[data-notebook-tree-button]")).filter(
    (button) => !button.disabled
  );
  const currentIndex = buttons.indexOf(currentButton);

  if (currentIndex < 0 || buttons.length === 0) {
    return;
  }

  const nextIndex =
    direction === "first"
      ? 0
      : direction === "last"
        ? buttons.length - 1
        : direction === "next"
          ? Math.min(currentIndex + 1, buttons.length - 1)
          : Math.max(currentIndex - 1, 0);
  const nextButton = buttons[nextIndex];

  if (!nextButton || nextButton === currentButton) {
    return;
  }

  nextButton.focus({ preventScroll: true });
  nextButton.scrollIntoView({ block: "nearest" });
};

export const notebookTreeContainsId = (nodes: NotebookNode[], targetNotebookId: string): boolean => {
  for (const node of nodes) {
    if (node.id === targetNotebookId || notebookTreeContainsId(node.children, targetNotebookId)) {
      return true;
    }
  }

  return false;
};

export const setMemoDragPreview = (dataTransfer: DataTransfer, label: string) => {
  const dragImage = document.createElement("div");

  dragImage.innerHTML = `
    <svg style="width: 15px; height: 15px; color: var(--brand-green); flex-shrink: 0;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"></path>
    </svg>
    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600;">${label}</span>
  `;

  Object.assign(dragImage.style, {
    position: "fixed",
    top: "-9999px",
    left: "-9999px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    maxWidth: "240px",
    border: "1px solid rgba(98, 127, 88, 0.28)",
    borderRadius: "8px",
    background: "rgba(244, 248, 243, 0.9)",
    backdropFilter: "blur(10px)",
    webkitBackdropFilter: "blur(10px)",
    boxShadow: "0 12px 24px -4px rgba(98, 127, 88, 0.15), 0 4px 12px -2px rgba(15, 23, 42, 0.05)",
    color: "#2c3b28",
    font: "13px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: "8px 12px",
    pointerEvents: "none",
    zIndex: "9999",
  });

  document.body.appendChild(dragImage);
  dataTransfer.setDragImage(dragImage, 16, 18);
  window.setTimeout(() => dragImage.remove(), 0);
};
