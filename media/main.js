(() => {
  const vscode = acquireVsCodeApi();
  const button = document.getElementById("pc-copy");

  if (button) {
    button.addEventListener("click", () => {
      vscode.postMessage({ command: "copy-prompt", json: null });
    });
  }
})();
