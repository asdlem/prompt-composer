import * as vscode from "vscode";
import { assemblePrompt } from "../services/promptAssembler";
import { collectFilesForWebview, parseFileUri } from "../services/fileService";

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "promptComposer.sidebar";

  private view?: vscode.WebviewView;

  constructor(private readonly extensionUri: vscode.Uri) {}

  public async resolveWebviewView(
    webviewView: vscode.WebviewView
  ): Promise<void> {
    this.view = webviewView;
    webviewView.onDidDispose(() => {
      this.view = undefined;
    });
    const webviewRoot = vscode.Uri.joinPath(
      this.extensionUri,
      "media",
      "webview"
    );
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [webviewRoot]
    };

    webviewView.webview.html = await this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (!message?.command) {
        return;
      }

      switch (message.command) {
        case "pick-files": {
          const uris = await vscode.window.showOpenDialog({
            canSelectMany: true,
            canSelectFiles: true,
            canSelectFolders: true,
            title: vscode.l10n.t("Pick files or folders to insert")
          });
          if (!uris?.length) {
            return;
          }
          await this.insertUris(uris);
          return;
        }
        case "open-file": {
          const pathValue = typeof message.path === "string" ? message.path : "";
          if (!pathValue) {
            return;
          }
          try {
            const uri = parseFileUri(pathValue);
            await vscode.commands.executeCommand("vscode.open", uri, {
              preview: true
            });
          } catch {
            await vscode.window.showInformationMessage(
              vscode.l10n.t("Unable to open this file.")
            );
          }
          return;
        }
        case "copy-prompt": {
          try {
            if (!message.json) {
              await webviewView.webview.postMessage({
                command: "copy-error",
                message: vscode.l10n.t("Editor content is empty.")
              });
              return;
            }
            const result = await assemblePrompt(message.json);
            await vscode.env.clipboard.writeText(result.text);
            await webviewView.webview.postMessage({
              command: "copy-success",
              count: result.fileCount,
              warnings: result.warnings
            });
          } catch {
            await webviewView.webview.postMessage({
              command: "copy-error",
              message: vscode.l10n.t("Copy failed.")
            });
          }
          return;
        }
        default:
          return;
      }
    });
  }

  public async insertUris(uris: vscode.Uri[]) {
    if (!this.view) {
      await this.revealView();
    }
    if (!this.view) {
      await vscode.window.showInformationMessage(
        vscode.l10n.t("Open Prompt Composer before adding files.")
      );
      return;
    }
    if (!uris.length) {
      await vscode.window.showInformationMessage(
        vscode.l10n.t("No files or folders selected.")
      );
      return;
    }
    const { files, warnings } = await collectFilesForWebview(uris, {
      messages: {
        maxFilesReached: (maxFiles) =>
          vscode.l10n.t(
            "Reached max file count ({0}); only part inserted.",
            maxFiles
          ),
        maxTotalBytesReached: (maxBytesLabel) =>
          vscode.l10n.t(
            "Reached max total size ({0}); only part inserted.",
            maxBytesLabel
          ),
        excludedDirsSkipped: (count) =>
          vscode.l10n.t("Skipped {0} excluded folders.", count),
        depthDirsSkipped: (count, maxDepth) =>
          vscode.l10n.t(
            "Skipped {0} folders beyond max depth ({1}).",
            count,
            maxDepth
          ),
        symlinksSkipped: (count) =>
          vscode.l10n.t("Skipped {0} symlinks.", count),
        readErrors: (count) =>
          vscode.l10n.t("Failed to read {0} entries.", count)
      }
    });
    if (!files.length) {
      await vscode.window.showInformationMessage(
        vscode.l10n.t("No files available to insert.")
      );
      return;
    }
    await this.view.webview.postMessage({
      command: "insert-files",
      files,
      warnings
    });
  }

  private async getHtml(webview: vscode.Webview): Promise<string> {
    const nonce = this.getNonce();
    const webviewRoot = vscode.Uri.joinPath(
      this.extensionUri,
      "media",
      "webview"
    );
    const manifestCandidates = [
      vscode.Uri.joinPath(webviewRoot, ".vite", "manifest.json"),
      vscode.Uri.joinPath(webviewRoot, "manifest.json")
    ];

    try {
      const manifestData = await this.readFirstAvailable(manifestCandidates);
      const manifest = JSON.parse(
        Buffer.from(manifestData).toString("utf8")
      ) as Record<string, { file: string; css?: string[] }>;
      const entry = manifest["index.html"];

      if (!entry) {
        throw new Error("missing manifest entry");
      }

      const scriptUri = webview.asWebviewUri(
        vscode.Uri.joinPath(webviewRoot, entry.file)
      );
      const styleUris = (entry.css ?? []).map((file) =>
        webview.asWebviewUri(vscode.Uri.joinPath(webviewRoot, file))
      );

      const csp = [
        "default-src 'none'",
        `img-src ${webview.cspSource} data:`,
        `style-src ${webview.cspSource}`,
        `script-src 'nonce-${nonce}'`
      ].join("; ");

      const title = vscode.l10n.t("Prompt Composer");
      const language = vscode.env.language || "en";
      return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  ${styleUris.map((uri) => `<link rel="stylesheet" href="${uri}" />`).join("\n  ")}
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}">window.__PC_LOCALE__ = ${JSON.stringify(
    language
  )};</script>
  <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
</body>
</html>`;
    } catch {
      const csp = `default-src 'none'; style-src ${webview.cspSource};`;
      return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Prompt Composer</title>
  <style>
    body { font-family: "Segoe UI", sans-serif; padding: 16px; }
    .pc-error { background: #fff4f4; border: 1px solid #f2c4c4; padding: 12px; border-radius: 8px; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="pc-error">
    <strong>Webview 资源尚未构建。</strong>
    <div>请运行 <code>pnpm run webview:build</code> 后重试。</div>
  </div>
</body>
</html>`;
    }
  }

  private getNonce() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let value = "";
    for (let i = 0; i < 32; i += 1) {
      value += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return value;
  }

  private async revealView() {
    await vscode.commands.executeCommand("workbench.view.extension.promptComposer");
    const deadline = Date.now() + 2000;
    while (!this.view && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }


  private async readFirstAvailable(
    candidates: vscode.Uri[]
  ): Promise<Uint8Array> {
    let lastError: unknown;
    for (const candidate of candidates) {
      try {
        return await vscode.workspace.fs.readFile(candidate);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError ?? new Error("manifest not found");
  }
}
