import * as vscode from "vscode";
import { registerAddFilesCommand } from "./commands/addFilesCommand";
import { SidebarProvider } from "./providers/SidebarProvider";

export function activate(context: vscode.ExtensionContext) {
  const provider = new SidebarProvider(context.extensionUri);
  const disposable = vscode.window.registerWebviewViewProvider(
    SidebarProvider.viewType,
    provider
  );

  const addFilesCommand = registerAddFilesCommand(provider);

  context.subscriptions.push(disposable, addFilesCommand);
}

export function deactivate() {
  // 无需清理
}
