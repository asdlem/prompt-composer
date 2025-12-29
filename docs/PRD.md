# 产品需求文档 (PRD): VS Code Prompt Composer

## 1. 项目概述
**Prompt Composer** 是一个嵌入在 VS Code 侧边栏的 **富文本编辑器**。旨在帮助开发者以“写文章”的自然流方式构建发给 LLM (ChatGPT/Claude) 的提示词。

**核心理念**：`Prompt = 自由文本 + 代码文件胶囊 + 自由文本`

## 2. 用户故事 (User Story)
作为一名开发者，我希望：
1.  在侧边栏打开一个类似 Notion 的编辑界面。
2.  输入自然语言描述我的问题（例如：“请分析以下两个文件的鉴权逻辑关联：”）。
3.  通过资源管理器右键或“选择文件”按钮插入文件/文件夹，它们变成一个个**文件胶囊**（不占屏幕空间，只显示文件名）。
4.  点击胶囊即可在 VS Code 中打开文件。
5.  点击“复制”按钮，插件自动把我的文字和展开后的代码拼接好，放入剪贴板。

## 3. 功能需求规格 (Functional Requirements)

### 3.1 侧边栏编辑器 (The Editor)
*   **FR-01 界面入口**：Activity Bar 新增图标，点击在 Side Bar 打开 Webview 面板。
*   **FR-02 富文本编辑**：
    *   基于 `Tiptap` (Headless Editor) 构建。
    *   支持基础文本输入、换行、光标移动、文本删除。
    *   **持久化**：关闭侧边栏或重启 VS Code 后，编辑器内的内容应自动恢复（通过 `vscode.setState` 或后端存储）。

### 3.2 文件胶囊系统 (File Capsule)
这是本产品的核心差异化功能。
*   **FR-03 文件/文件夹插入**：
    *   支持资源管理器右键“添加到 Prompt Composer”与侧边栏“选择文件”。
    *   文件夹会递归展开为文件列表（有数量/大小/深度上限）。
    *   在编辑器光标当前位置插入自定义节点：`FileCapsule`。
*   **FR-04 胶囊表现**：
    *   **外观**：行内块 (Inline-block)，样式类似标签 (Tag)，显示 `📄 文件名`。
    *   **原子性**：胶囊被视为一个不可分割的字符。无法编辑胶囊内的文字。
*   **FR-05 胶囊交互**：
    *   **删除**：支持通过 `Backspace` / `Delete` 键删除胶囊；或者点击胶囊上的 `x` 图标（若 UI 空间允许）。
    *   **选中**：支持光标选中胶囊（高亮状态）。
    *   **打开**：点击胶囊在 VS Code 预览/打开对应文件。

### 3.3 生成与导出 (Export)
*   **FR-06 提示词组装**：
    *   点击底部 "Copy to Clipboard" 按钮。
    *   后端遍历编辑器的数据结构（JSON Tree）。
    *   **文本节点**：保持原样。
    *   **胶囊节点**：实时读取磁盘文件的完整内容，并应用包装模板。
        *   *模板格式*：`\n\n### File: ${relativePath}\n\`\`\`${lang}\n${content}\n\`\`\`\n\n`
*   **FR-07 剪贴板写入**：将组装好的巨型字符串写入系统剪贴板，并提示成功。

### 3.4 多语言 (Localization)
*   **FR-08 中英支持**：
    *   UI 与提示文案至少支持中文与英文。
    *   语言跟随 VS Code 当前语言设置（`vscode.l10n`）。

## 4. 技术架构 (Technical Architecture)

为了澄清之前的疑虑，架构严格分为**本地前端**和**本地后端**，不涉及任何云服务。

### 4.1 前端 (Webview Context)
*   **职责**：负责 UI 渲染与交互。
*   **技术栈**：
    *   **React 19（注意使用最新版本）**：视图层。
    *   **Tiptap (ProseMirror)**：编辑器核心。
    *   **@vscode/webview-ui-toolkit**：UI 组件库（按钮、滚动条等）。
*   **关键数据结构 (Editor JSON)**：
    ```json
    {
      "type": "doc",
      "content": [
        { "type": "text", "text": "分析这个：" },
        { "type": "fileCapsule", "attrs": { "path": "/Users/me/project/utils.ts" } }
      ]
    }
    ```

### 4.2 后端 (Extension Host Context)
*   **职责**：拥有 OS 权限，负责读文件、存取配置、操作剪贴板。
*   **核心模块**：
    *   `SidebarProvider`: 实现 Webview 协议。
    *   `FileService`: 基于 `vscode.workspace.fs` 的文件读取与目录遍历封装。

### 4.3 通信协议 (Message Protocol)
| 方向 | 消息类型 (Command) | 载荷 (Payload) | 描述 |
| :--- | :--- | :--- | :--- |
| Front->Back | `pick-files` | `{}` | 打开文件/文件夹选择器 |
| Front->Back | `open-file` | `{ path: string }` | 打开指定文件 |
| Front->Back | `copy-prompt` | `{ json: EditorJSON }` | 请求生成并复制 |
| Back->Front | `insert-files` | `{ files: FileItem[], warnings?: string[] }` | 插入文件胶囊 |
| Back->Front | `copy-success` | `{ count: number, warnings?: string[] }` | 复制成功回调 |
| Back->Front | `copy-error` | `{ message: string }` | 复制失败回调 |

## 5. 限制与边界 (Constraints)
1.  **文件类型**：仅支持文本类文件。二进制文件在导出时标记为不支持。
2.  **文件夹展开限制**：对递归深度、文件数量、总大小设置上限，避免 UI 与导出溢出。
3.  **大内容溢出**：编辑器区域启用滚动与溢出提示，避免整体布局被撑爆。

---

如果这份 PRD 获得批准，我们即可正式进入 **Phase 1: Project Setup** 阶段。
