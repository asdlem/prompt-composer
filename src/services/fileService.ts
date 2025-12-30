import * as path from "path";
import * as vscode from "vscode";

const PREVIEW_MAX_LINES = 100;
const PREVIEW_MAX_BYTES = 5 * 1024;
const BINARY_SAMPLE_BYTES = 8000;
const DEFAULT_MAX_FILES = 200;
const DEFAULT_MAX_TOTAL_BYTES = 2 * 1024 * 1024;
const DEFAULT_MAX_DEPTH = 6;
const DEFAULT_EXCLUDED_DIRS = [
  ".git",
  "node_modules",
  "dist",
  "out",
  "build"
];

export type CollectFilesOptions = {
  maxFiles?: number;
  maxTotalBytes?: number;
  maxDepth?: number;
  excludeDirs?: string[];
  messages?: CollectFilesMessages;
};

export type WebviewFileItem = {
  path: string;
  name: string;
};

export type CollectFilesMessages = {
  maxFilesReached: (maxFiles: number) => string;
  maxTotalBytesReached: (maxBytesLabel: string) => string;
  excludedDirsSkipped: (count: number) => string;
  depthDirsSkipped: (count: number, maxDepth: number) => string;
  symlinksSkipped: (count: number) => string;
  readErrors: (count: number) => string;
};

export const parseFileUri = (pathOrUri: string): vscode.Uri => {
  if (pathOrUri.includes("://")) {
    return vscode.Uri.parse(pathOrUri);
  }
  return vscode.Uri.file(pathOrUri);
};

const isBinary = (data: Uint8Array): boolean => {
  const sample = data.subarray(0, BINARY_SAMPLE_BYTES);
  for (const byte of sample) {
    if (byte === 0) {
      return true;
    }
  }
  return false;
};

const decodeUtf8 = (data: Uint8Array): string => {
  return new TextDecoder("utf-8").decode(data);
};

export const readFileText = async (uri: vscode.Uri) => {
  const data = await vscode.workspace.fs.readFile(uri);
  if (isBinary(data)) {
    return { isBinary: true, content: "" };
  }
  return { isBinary: false, content: decodeUtf8(data) };
};

export const readPreviewText = async (uri: vscode.Uri) => {
  const result = await readFileText(uri);
  if (result.isBinary) {
    return result;
  }
  const lines = result.content.split(/\r?\n/).slice(0, PREVIEW_MAX_LINES).join("\n");
  const limited = Buffer.from(lines, "utf8").slice(0, PREVIEW_MAX_BYTES).toString("utf8");
  return { isBinary: false, content: limited };
};

export const getRelativePath = (uri: vscode.Uri): string => {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
  if (!workspaceFolder) {
    return uri.fsPath;
  }
  const relative = path.relative(workspaceFolder.uri.fsPath, uri.fsPath);
  if (relative.startsWith("..")) {
    return uri.fsPath;
  }
  return relative.split(path.sep).join("/");
};

export const getLanguageId = async (uri: vscode.Uri) => {
  const document = await vscode.workspace.openTextDocument(uri);
  return document.languageId;
};

const formatBytes = (value: number): string => {
  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (value >= 1024) {
    return `${Math.round(value / 1024)} KB`;
  }
  return `${value} B`;
};

export const collectFilesForWebview = async (
  uris: vscode.Uri[],
  options: CollectFilesOptions = {}
): Promise<{ files: WebviewFileItem[]; warnings: string[] }> => {
  const maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;
  const maxTotalBytes = options.maxTotalBytes ?? DEFAULT_MAX_TOTAL_BYTES;
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const excluded = new Set(
    (options.excludeDirs ?? DEFAULT_EXCLUDED_DIRS).map((name) =>
      name.toLowerCase()
    )
  );

  const messages: CollectFilesMessages =
    options.messages ??
    {
      maxFilesReached: (maxFiles) =>
        `已达到最大文件数量（${maxFiles}），仅插入部分文件。`,
      maxTotalBytesReached: (maxBytesLabel) =>
        `已达到最大总大小（${maxBytesLabel}），仅插入部分文件。`,
      excludedDirsSkipped: (count) => `已忽略 ${count} 个排除目录。`,
      depthDirsSkipped: (count, maxDepth) =>
        `已忽略 ${count} 个超过最大深度（${maxDepth} 层）的目录。`,
      symlinksSkipped: (count) => `已忽略 ${count} 个符号链接。`,
      readErrors: (count) => `有 ${count} 个条目读取失败。`
    };
  const warnings: string[] = [];
  const files: WebviewFileItem[] = [];
  const seen = new Set<string>();
  const queue: Array<{ uri: vscode.Uri; depth: number }> = [];
  let totalBytes = 0;
  let skippedExcludedDirs = 0;
  let skippedDepthDirs = 0;
  let skippedSymlinks = 0;
  let readErrors = 0;
  let truncatedByCount = false;
  let truncatedBySize = false;

  const enqueue = (uri: vscode.Uri, depth: number) => {
    const key = uri.toString();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    queue.push({ uri, depth });
  };

  uris.forEach((uri) => {
    enqueue(uri, 0);
  });

  const tryAddFile = (uri: vscode.Uri, size: number) => {
    if (files.length >= maxFiles) {
      truncatedByCount = true;
      return false;
    }
    if (totalBytes + size > maxTotalBytes) {
      truncatedBySize = true;
      return false;
    }
    files.push({
      path: uri.toString(),
      name: path.basename(uri.fsPath)
    });
    totalBytes += size;
    return true;
  };

  while (queue.length > 0) {
    if (truncatedByCount || truncatedBySize) {
      break;
    }
    const current = queue.shift();
    if (!current) {
      break;
    }
    const { uri, depth } = current;
    let stat: vscode.FileStat;
    try {
      stat = await vscode.workspace.fs.stat(uri);
    } catch {
      readErrors += 1;
      continue;
    }

    if (stat.type & vscode.FileType.SymbolicLink) {
      skippedSymlinks += 1;
      continue;
    }

    if (stat.type & vscode.FileType.Directory) {
      if (depth >= maxDepth) {
        skippedDepthDirs += 1;
        continue;
      }
      let entries: [string, vscode.FileType][];
      try {
        entries = await vscode.workspace.fs.readDirectory(uri);
      } catch {
        readErrors += 1;
        continue;
      }
      for (const [name, type] of entries) {
        if (type & vscode.FileType.Directory) {
          if (excluded.has(name.toLowerCase())) {
            skippedExcludedDirs += 1;
            continue;
          }
        }
        enqueue(vscode.Uri.joinPath(uri, name), depth + 1);
      }
      continue;
    }

    if (stat.type & vscode.FileType.File) {
      if (!tryAddFile(uri, stat.size)) {
        break;
      }
    }
  }

  if (truncatedByCount) {
    warnings.push(messages.maxFilesReached(maxFiles));
  }
  if (truncatedBySize) {
    warnings.push(messages.maxTotalBytesReached(formatBytes(maxTotalBytes)));
  }
  if (skippedExcludedDirs > 0) {
    warnings.push(messages.excludedDirsSkipped(skippedExcludedDirs));
  }
  if (skippedDepthDirs > 0) {
    warnings.push(messages.depthDirsSkipped(skippedDepthDirs, maxDepth));
  }
  if (skippedSymlinks > 0) {
    warnings.push(messages.symlinksSkipped(skippedSymlinks));
  }
  if (readErrors > 0) {
    warnings.push(messages.readErrors(readErrors));
  }

  return { files, warnings };
};
