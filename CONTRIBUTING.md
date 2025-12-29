# 贡献指南

## 提交规范（Conventional Commits）

提交信息遵循 Conventional Commits：

```
<type>(<scope>)!: <subject>

[body]

[footer]
```

- `type` 建议：`feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`chore`、`build`、`ci`、`revert`。
- **破坏性变更**：在 `type` 后加 `!`，或在页脚加入 `BREAKING CHANGE: ...`。
- `scope` 可选（推荐用模块名/功能点）。

示例：
```
feat(sidebar): add capsule hover preview
fix(copy): handle binary file error
refactor(editor)!: change node schema
```

## 版本管理（semantic-release）

- 版本与发布由 semantic-release 自动完成：根据提交信息判断语义版本并生成 Release Notes。
- 默认采用 Angular 提交规范（可在配置中通过 preset 修改）。
- semantic-release 需要在 CI 环境中运行，请不要手动修改版本号，通过合规的提交类型驱动版本变更。

## 提交钩子（Husky + commitlint + lint-staged）

- `commit-msg`：commitlint 校验提交信息。
- `pre-commit`：lint-staged 只对暂存区文件运行 ESLint。

本地可用命令：
- `pnpm run lint`
- `pnpm run lint:fix`
