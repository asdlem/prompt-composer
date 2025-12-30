import * as vscode from "vscode";
import { SidebarProvider } from "../providers/SidebarProvider";

const parseClipboardUris = (raw: string): vscode.Uri[] => {
  if (!raw) {
    return [];
  }
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (line.startsWith("file://")) {
        return vscode.Uri.parse(line);
      }
      return vscode.Uri.file(line);
    });
};

const uniqueUris = (uris: vscode.Uri[]): vscode.Uri[] => {
  const seen = new Set<string>();
  return uris.filter((uri) => {
    const key = uri.toString();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const collectUris = (value: unknown, target: vscode.Uri[]) => {
  if (value instanceof vscode.Uri) {
    target.push(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectUris(item, target));
    return;
  }
  if (value && typeof value === "object") {
    const maybeResourceUri = (value as { resourceUri?: unknown }).resourceUri;
    const maybeUri = (value as { uri?: unknown }).uri;
    if (maybeResourceUri instanceof vscode.Uri) {
      target.push(maybeResourceUri);
    } else if (maybeUri instanceof vscode.Uri) {
      target.push(maybeUri);
    }
  }
};

export const registerAddFilesCommand = (provider: SidebarProvider) =>
  vscode.commands.registerCommand(
    "promptComposer.addFiles",
    async (...args: unknown[]) => {
      const uris: vscode.Uri[] = [];
      args.forEach((arg) => collectUris(arg, uris));
      if (!uris.length) {
        const previousClipboard = await vscode.env.clipboard.readText();
        try {
          await vscode.commands.executeCommand("copyFilePath");
          const copied = await vscode.env.clipboard.readText();
          uris.push(...parseClipboardUris(copied));
        } catch {
          // ignore
        } finally {
          await vscode.env.clipboard.writeText(previousClipboard);
        }
      }
      if (!uris.length) {
        await vscode.window.showInformationMessage(
          vscode.l10n.t(
            "Select files in the Explorer before using the shortcut."
          )
        );
        return;
      }
      await provider.insertUris(uniqueUris(uris));
    }
  );
