import * as vscode from "vscode";

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "promptComposer.sidebar";

  constructor(private readonly extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView
  ): void | Thenable<void> {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);
  }

  private getHtml(webview: vscode.Webview): string {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "media", "main.css")
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "media", "main.js")
    );

    const csp = `default-src 'none'; style-src ${webview.cspSource}; script-src ${webview.cspSource};`;

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Prompt Composer</title>
  <link rel="stylesheet" href="${styleUri}" />
</head>
<body>
  <header class="pc-header">
    <div class="pc-title">Prompt Composer</div>
    <div class="pc-subtitle">MVP Scaffold</div>
  </header>
  <section class="pc-body">
    <p>Webview 已就绪。下一步将接入 Tiptap 与文件胶囊。</p>
    <button class="pc-button" id="pc-copy">Copy to Clipboard</button>
  </section>
  <script src="${scriptUri}"></script>
</body>
</html>`;
  }
}
