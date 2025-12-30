import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { FileCapsule } from "../features/editor/FileCapsule";
import { Button } from "../components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "../components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components/ui/select";
import {
  formatString,
  getStringsForLocale,
  resolveLocale,
  setWebviewLocale,
  type WebviewLocale
} from "../services/i18n";
import {
  getWebviewState,
  postWebviewMessage,
  setWebviewState
} from "../services/vscodeApi";

const DEFAULT_CONTENT = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "" }]
    }
  ]
};

type WebviewState = {
  editorJson?: unknown;
  language?: WebviewLocale;
};

type ToastState = {
  message: string;
  tone: "success" | "error";
};

type InsertFilePayload = {
  path: string;
  name?: string;
};

const getFileName = (pathOrUri: string): string => {
  const normalized = pathOrUri.replace(/^file:\/\//, "");
  const decoded = decodeURIComponent(normalized);
  const segments = decoded.split(/[\\/]/);
  return segments[segments.length - 1] || decoded;
};

export const App = () => {
  const savedState = getWebviewState<WebviewState>() ?? {};
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<number | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const overflowCheckFrame = useRef<number | null>(null);
  const hasOverflowRef = useRef(false);
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);
  const [language, setLanguage] = useState<WebviewLocale>(
    savedState.language ?? "auto"
  );
  const resolvedLocale = resolveLocale(language, window.__PC_LOCALE__);
  const strings = getStringsForLocale(resolvedLocale);

  const persistWebviewState = useCallback((partial: Partial<WebviewState>) => {
    const current = getWebviewState<WebviewState>() ?? {};
    setWebviewState({ ...current, ...partial });
  }, []);

  useEffect(() => {
    setWebviewLocale(language, window.__PC_LOCALE__);
  }, [language]);

  const showToast = useCallback(
    (message: string, tone: ToastState["tone"], duration = 2500) => {
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
      setToast({ message, tone });
      toastTimer.current = window.setTimeout(() => {
        setToast(null);
      }, duration);
    },
    []
  );

  const checkOverflow = useCallback(() => {
    const container = editorContainerRef.current;
    if (!container) {
      return;
    }
    const hasOverflow = container.scrollHeight - container.clientHeight > 1;
    if (hasOverflow && !hasOverflowRef.current) {
      hasOverflowRef.current = true;
      showToast(strings.toastOverflow, "success");
      return;
    }
    if (!hasOverflow && hasOverflowRef.current) {
      hasOverflowRef.current = false;
    }
  }, [showToast, strings.toastOverflow]);

  const scheduleOverflowCheck = useCallback(() => {
    if (overflowCheckFrame.current) {
      window.cancelAnimationFrame(overflowCheckFrame.current);
    }
    overflowCheckFrame.current = window.requestAnimationFrame(() => {
      overflowCheckFrame.current = null;
      checkOverflow();
    });
  }, [checkOverflow]);

  const editor = useEditor({
    extensions: [StarterKit, FileCapsule],
    content: (savedState?.editorJson as object | undefined) ?? DEFAULT_CONTENT,
    onCreate: ({ editor }) => {
      setIsEditorEmpty(editor.isEmpty);
    },
    onUpdate: ({ editor }) => {
      persistWebviewState({ editorJson: editor.getJSON() });
      setIsEditorEmpty(editor.isEmpty);
      scheduleOverflowCheck();
    },
    editorProps: {
      handleDOMEvents: {
        dragover: () => false,
        drop: () => false
      }
    }
  });

  const insertCapsulesAtSelection = useCallback(
    (editorInstance: NonNullable<typeof editor>, files: InsertFilePayload[]) => {
      files.forEach((file) => {
        editorInstance
          .chain()
          .focus()
          .insertContent([
            {
              type: "fileCapsule",
              attrs: {
                path: file.path,
                name: file.name ?? getFileName(file.path)
              }
            },
            {
              type: "text",
              text: " "
            }
          ])
          .run();
      });
    },
    []
  );

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const message = event.data as {
        command?: string;
        path?: string;
        content?: string;
        error?: string;
        count?: number;
        message?: string;
        files?: InsertFilePayload[];
        warnings?: string[];
      };

      switch (message.command) {
        case "copy-success": {
          const fileCount = message.count ?? 0;
          const warningCount = message.warnings?.length ?? 0;
          const base = formatString(strings.toastCopySuccess, { count: fileCount });
          const suffix =
            warningCount > 0
              ? formatString(strings.toastCopyWarningSuffix, {
                  count: warningCount
                })
              : "";
          showToast(`${base}${suffix}`, "success");
          return;
        }
        case "copy-error": {
          showToast(message.message ?? strings.toastCopyError, "error");
          return;
        }
        case "insert-files": {
          if (!editor) {
            showToast(strings.toastEditorNotReady, "error");
            return;
          }
          const files = message.files ?? [];
          if (!files.length) {
            showToast(strings.toastNoFiles, "error");
            return;
          }
          insertCapsulesAtSelection(editor, files);
          scheduleOverflowCheck();
          if (message.warnings?.length) {
            const [first] = message.warnings;
            const warning =
              message.warnings.length > 1
                ? formatString(strings.toastInsertWarningMany, {
                    first,
                    count: message.warnings.length
                  })
                : formatString(strings.toastInsertWarningSingle, { first });
            showToast(warning, "error");
          }
          return;
        }
        default:
          return;
      }
    };

    window.addEventListener("message", handler);
    return () => {
      window.removeEventListener("message", handler);
    };
  }, [
    editor,
    insertCapsulesAtSelection,
    scheduleOverflowCheck,
    showToast,
    strings
  ]);

  useEffect(() => {
    scheduleOverflowCheck();
    return () => {
      if (overflowCheckFrame.current) {
        window.cancelAnimationFrame(overflowCheckFrame.current);
      }
    };
  }, [scheduleOverflowCheck]);

   
  const handleCopy = useCallback(() => {
    if (!editor) {
      showToast(strings.toastEditorNotReady, "error");
      return;
    }
    postWebviewMessage({ command: "copy-prompt", json: editor.getJSON() });
  }, [editor, showToast, strings.toastEditorNotReady]);

  const handlePickFiles = useCallback(() => {
    postWebviewMessage({ command: "pick-files" });
  }, []);

  const handleClear = useCallback(() => {
    if (!editor) {
      return;
    }
    editor.commands.setContent(DEFAULT_CONTENT);
  }, [editor]);

  const handleLanguageChange = useCallback(
    (value: string) => {
      const nextLanguage = value as WebviewLocale;
      setLanguage(nextLanguage);
      persistWebviewState({ language: nextLanguage });
    },
    [persistWebviewState]
  );

  return (
    <div className="pc-root">
      <header className="pc-header">
        <div className="pc-header-main">
          <div className="pc-title">{strings.appTitle}</div>
          <div className="pc-subtitle">{strings.appSubtitle}</div>
        </div>
        <div className="pc-header-actions">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-full text-xs"
                aria-label={strings.helpLabel}
              >
                ?
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-64 space-y-2 text-xs leading-relaxed"
            >
              <div className="text-[12px] font-semibold text-foreground">
                {strings.helpTitle}
              </div>
              <div className="space-y-1 text-muted-foreground">
                <div>{strings.helpLinePick}</div>
                <div>{strings.helpLineContext}</div>
                <div>{strings.helpLineOpen}</div>
                <div>{strings.helpLineCopy}</div>
                <div className="text-[11px]">{strings.helpLineShortcut}</div>
              </div>
            </PopoverContent>
          </Popover>
          <div className="pc-lang-control">
            <span className="pc-lang-icon" aria-hidden="true">
              🌐
            </span>
            <span className="pc-lang-label">{strings.langLabel}</span>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger
                className="pc-lang-select"
                aria-label={strings.langLabel}
              >
                <SelectValue placeholder={strings.langAuto} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">{strings.langAuto}</SelectItem>
                <SelectItem value="zh-CN">{strings.langZh}</SelectItem>
                <SelectItem value="en">{strings.langEn}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>
      <div className="pc-editor-shell">
        <div className="pc-editor-toolbar">
          <div className="pc-toolbar-left">
            <Button variant="outline" size="sm" onClick={handlePickFiles}>
              {strings.pickFiles}
            </Button>
          </div>
          <div className="pc-toolbar-right">
            {!isEditorEmpty ? (
              <Button variant="outline" size="sm" onClick={handleClear}>
                {strings.clearAll}
              </Button>
            ) : null}
          </div>
        </div>
        <div className="pc-editor" ref={editorContainerRef}>
          {editor ? (
            <div className="pc-editor-dropzone">
              <EditorContent editor={editor} />
            </div>
          ) : (
            <div className="pc-loading">{strings.loadingEditor}</div>
          )}
          {editor && isEditorEmpty ? (
            <div className="pc-empty-guide">
              <div className="pc-empty-title">{strings.emptyGuideTitle}</div>
              <div className="pc-empty-subtitle">{strings.emptyGuideSubtitle}</div>
              <div className="pc-empty-hint">{strings.emptyGuideHint}</div>
            </div>
          ) : null}
        </div>
        <div className="pc-actions-bottom">
          <Button className="w-full" onClick={handleCopy}>
            {strings.copyToClipboard}
          </Button>
          <div className="pc-shortcut-hint">{strings.shortcutHint}</div>
        </div>
      </div>
      {toast ? (
        <div className={`pc-toast pc-toast-${toast.tone}`}>{toast.message}</div>
      ) : null}
    </div>
  );
};
