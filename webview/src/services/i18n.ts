export type WebviewStrings = {
  appTitle: string;
  appSubtitle: string;
  pickFiles: string;
  clearAll: string;
  copyToClipboard: string;
  loadingEditor: string;
  helperText: string;
  emptyGuideTitle: string;
  emptyGuideSubtitle: string;
  emptyGuideHint: string;
  shortcutHint: string;
  toastEditorNotReady: string;
  toastNoFiles: string;
  toastCopyError: string;
  toastCopySuccess: string;
  toastCopyWarningSuffix: string;
  toastInsertWarningSingle: string;
  toastInsertWarningMany: string;
  toastOverflow: string;
  capsuleUnknownName: string;
  capsuleRemoveLabel: string;
  langLabel: string;
  langAuto: string;
  langZh: string;
  langEn: string;
  helpLabel: string;
  helpTitle: string;
  helpLinePick: string;
  helpLineContext: string;
  helpLineOpen: string;
  helpLineCopy: string;
  helpLineShortcut: string;
};

export type WebviewLocale = "auto" | "zh-CN" | "en";
type ResolvedLocale = "zh-CN" | "en";

const zhCNStrings: WebviewStrings = {
  appTitle: "Prompt Composer",
  appSubtitle: "写作式提示词编辑",
  pickFiles: "添加文件",
  clearAll: "清空",
  copyToClipboard: "复制到剪贴板",
  loadingEditor: "编辑器加载中...",
  helperText:
    "使用“选择文件”或在资源管理器中右键选择“添加到 Prompt Composer”，支持文件夹展开，点击文件胶囊可在 VS Code 预览。",
  emptyGuideTitle: "开始输入提示词，或点击上方添加文件",
  emptyGuideSubtitle: "支持文件夹展开，胶囊可点击预览",
  emptyGuideHint: "也可以在资源管理器右键添加文件/文件夹",
  shortcutHint: "快捷键：Ctrl+Alt+C / Cmd+Alt+C",
  toastEditorNotReady: "编辑器尚未就绪",
  toastNoFiles: "未选择任何文件",
  toastCopyError: "复制失败",
  toastCopySuccess: "已复制提示词（含 {count} 个文件）",
  toastCopyWarningSuffix: "（{count} 个文件未完全导出）",
  toastInsertWarningSingle: "部分文件未插入：{first}",
  toastInsertWarningMany: "部分文件未插入：{first} 等 {count} 项",
  toastOverflow: "内容过多，已启用滚动",
  capsuleUnknownName: "未命名文件",
  capsuleRemoveLabel: "移除文件",
  langLabel: "语言",
  langAuto: "自动",
  langZh: "中文",
  langEn: "英文",
  helpLabel: "帮助",
  helpTitle: "使用提示",
  helpLinePick: "点击“选择文件”添加内容",
  helpLineContext: "资源管理器右键可添加文件/文件夹",
  helpLineOpen: "点击胶囊可在 VS Code 预览",
  helpLineCopy: "点击底部按钮复制提示词",
  helpLineShortcut: "快捷键：Ctrl+Alt+C / Cmd+Alt+C"
};

const enStrings: WebviewStrings = {
  appTitle: "Prompt Composer",
  appSubtitle: "Writing-style prompt editor",
  pickFiles: "Add Files",
  clearAll: "Clear",
  copyToClipboard: "Copy to Clipboard",
  loadingEditor: "Loading editor...",
  helperText:
    "Use \"Pick Files\" or the Explorer context menu to add to Prompt Composer. Folder selection is supported. Click a file capsule to open it in VS Code.",
  emptyGuideTitle: "Start typing, or click Add Files above",
  emptyGuideSubtitle: "Folder expansion supported; click capsules to open",
  emptyGuideHint: "You can also add from the Explorer context menu",
  shortcutHint: "Shortcut: Ctrl+Alt+C / Cmd+Alt+C",
  toastEditorNotReady: "Editor is not ready.",
  toastNoFiles: "No files selected.",
  toastCopyError: "Copy failed.",
  toastCopySuccess: "Copied prompt (includes {count} files)",
  toastCopyWarningSuffix: " ({count} files not fully exported)",
  toastInsertWarningSingle: "Some files were not inserted: {first}",
  toastInsertWarningMany: "Some files were not inserted: {first} and {count} more",
  toastOverflow: "Content is large; scrolling enabled.",
  capsuleUnknownName: "Unnamed file",
  capsuleRemoveLabel: "Remove file",
  langLabel: "Language",
  langAuto: "Auto",
  langZh: "中文",
  langEn: "English",
  helpLabel: "Help",
  helpTitle: "Quick tips",
  helpLinePick: "Click “Pick Files” to add content",
  helpLineContext: "Use Explorer context menu to add files/folders",
  helpLineOpen: "Click a capsule to open in VS Code",
  helpLineCopy: "Use the bottom button to copy the prompt",
  helpLineShortcut: "Shortcut: Ctrl+Alt+C / Cmd+Alt+C"
};

let activeLocale: ResolvedLocale = "en";

export const normalizeLocale = (locale?: string): ResolvedLocale => {
  const value = (locale ?? "").toLowerCase();
  if (value.startsWith("zh")) {
    return "zh-CN";
  }
  return "en";
};

export const resolveLocale = (
  preferred: WebviewLocale,
  fallback?: string
): ResolvedLocale => {
  if (preferred === "auto") {
    return normalizeLocale(fallback ?? navigator.language);
  }
  return normalizeLocale(preferred);
};

export const setWebviewLocale = (
  preferred: WebviewLocale,
  fallback?: string
) => {
  activeLocale = resolveLocale(preferred, fallback);
};

export const getWebviewStrings = () =>
  activeLocale === "zh-CN" ? zhCNStrings : enStrings;

export const getStringsForLocale = (locale: ResolvedLocale) =>
  locale === "zh-CN" ? zhCNStrings : enStrings;

export const formatString = (
  template: string,
  params: Record<string, string | number>
) => {
  return Object.entries(params).reduce((acc, [key, val]) => {
    const token = new RegExp(`\\{${key}\\}`, "g");
    return acc.replace(token, String(val));
  }, template);
};
