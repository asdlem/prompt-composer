# Prompt Composer

English | [简体中文](README.zh-CN.md)

A rich text prompt editor in the VS Code sidebar. It helps you assemble project context into a single prompt and copy it in one click, avoiding repetitive manual copy/paste when chatting with LLM tools like Gemini or AI Studio.

## Motivation
When coding in an IDE, I often need to send context to LLM chat tools. Before this extension, I had to copy files one by one and stitch them together manually. Prompt Composer lets me select files inside VS Code and assemble a clean prompt instantly.

## Features
- Rich text editing (Tiptap)
- File capsules (files and folders with recursive expansion)
- Click a capsule to open the file in VS Code
- One-click export to clipboard
- Overflow detection with scrolling and a toast hint
- Bilingual UI (Chinese and English, follows VS Code locale)

## Usage
1. Open Prompt Composer in the sidebar.
2. Click “Pick Files” or use the Explorer context menu “Add to Prompt Composer” (folders are expanded).
3. Click a file capsule to open it in VS Code.
4. Use “Copy to Clipboard” to assemble the final prompt.

## Keybindings
- Windows/Linux: `Ctrl+Alt+C`
- macOS: `Cmd+Alt+C`

Active only when the Explorer is focused and a file is selected.

## Development
```bash
pnpm install
pnpm run webview:dev
pnpm run webview:build
pnpm run compile
```

## Package VSIX
```bash
pnpm run build
pnpm run vsix:package
```

## Project Structure
```text
.
├─ src/                Extension Host (commands/providers/services)
│  ├─ commands/
│  ├─ providers/
│  ├─ services/
│  └─ types/
├─ webview/            Webview app (Vite + React + Tiptap)
│  └─ src/
│     ├─ app/           App entry (App/main)
│     ├─ components/    UI components
│     ├─ features/      Feature modules (editor)
│     ├─ services/      i18n + VS Code bridge
│     ├─ styles/        CSS
│     └─ types/
├─ media/              Extension assets (icons, webview build output)
│  └─ webview/          Static webview assets
├─ l10n/               Localization
├─ dist/               VSIX build artifacts (ignored)
├─ out/                TypeScript build output
├─ docs/PRD.md         Scope and requirements
├─ CONTRIBUTING.md     Contribution guide
└─ README.md           Project docs
```

## Contributing
See `CONTRIBUTING.md`.

## License
MIT
