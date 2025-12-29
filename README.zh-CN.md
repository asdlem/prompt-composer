# Prompt Composer

[English](README.md) | 简体中文

VS Code 侧边栏富文本提示词编辑器，帮助你把项目上下文快速拼装成可复制的提示词，减少在各类聊天式 LLM 工具里手动复制粘贴的成本。

## 项目动机
在 IDE 中写代码时，我经常需要把当前项目的上下文发到 Gemini、AI Studio 等只能聊天的 LLM 工具里。过去我必须逐个文件手动复制，再拼成提示词；有了这个扩展后，可以在 VS Code 内直接选择文件并一键整理成提示词，省掉大量重复劳动。

## 核心能力
- 富文本提示词编辑（Tiptap）
- 文件胶囊：插入文件/文件夹（自动递归展开）
- 点击胶囊即可在 VS Code 中打开对应文件
- 一键复制：将文本与文件内容拼装并复制
- 溢出检测：内容过多时启用滚动并提示
- 多语言：支持中文与英文（跟随 VS Code 语言）

## 使用方式
1. 打开侧边栏 Prompt Composer。
2. 点击“选择文件”或在资源管理器右键选择“添加到 Prompt Composer”，支持文件夹递归展开。
3. 点击文件胶囊可在 VS Code 预览/打开。
4. 点击 “Copy to Clipboard” 生成并复制最终提示词。

## 快捷键
- Windows/Linux：`Ctrl+Alt+C`
- macOS：`Cmd+Alt+C`

仅在资源管理器聚焦且选中文件时生效。

## 开发与构建
```bash
pnpm install
pnpm run webview:dev
pnpm run webview:build
pnpm run compile
```

## 打包 VSIX
```bash
pnpm run build
pnpm run vsix:package
```

## 项目结构
```text
.
├─ src/                VS Code 扩展端逻辑（commands/providers/services）
│  ├─ commands/
│  ├─ providers/
│  ├─ services/
│  └─ types/
├─ webview/            Webview 前端工程（Vite + React + Tiptap）
│  └─ src/
│     ├─ app/           入口与装配（App/main）
│     ├─ components/    UI 组件
│     ├─ features/      业务模块（editor）
│     ├─ services/      i18n 与 VS Code 桥接
│     ├─ styles/        样式
│     └─ types/
├─ media/              扩展资源（图标、Webview 构建产物等）
│  └─ webview/          Webview 静态资源输出目录
├─ l10n/               多语言资源
├─ dist/               VSIX 构建产物（已忽略）
├─ out/                TypeScript 编译产物
├─ docs/PRD.md         需求与范围
├─ CONTRIBUTING.md     贡献与提交规范
└─ README.md           项目说明
```

## 贡献
请先阅读 `CONTRIBUTING.md`。

## License
MIT
