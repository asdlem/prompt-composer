import * as vscode from "vscode";
import { SidebarProvider } from "./sidebar/SidebarProvider";

export function activate(context: vscode.ExtensionContext) {
  const provider = new SidebarProvider(context.extensionUri);
  const disposable = vscode.window.registerWebviewViewProvider(
    SidebarProvider.viewType,
    provider
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {
  // 无需清理
}
