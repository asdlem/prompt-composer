import {
  getLanguageId,
  getRelativePath,
  parseFileUri,
  readFileText
} from "./fileService";

type EditorNode = {
  type: string;
  text?: string;
  attrs?: {
    path?: string;
  };
  content?: EditorNode[];
};

export type AssembleResult = {
  text: string;
  fileCount: number;
  warnings: string[];
};

const renderFileCapsule = async (
  node: EditorNode,
  warnings: string[]
): Promise<string> => {
  const pathValue = node.attrs?.path ?? "";
  if (!pathValue) {
    return "";
  }
  const uri = parseFileUri(pathValue);
  const relativePath = getRelativePath(uri);

  try {
    const { isBinary, content } = await readFileText(uri);
    if (isBinary) {
      warnings.push(`${relativePath}: 不支持的文件类型`);
      return `\n\n### File: ${relativePath}\n\`\`\`\n[Unsupported file type]\n\`\`\`\n\n`;
    }
    const languageId = await getLanguageId(uri);
    const lang = languageId === "plaintext" ? "" : languageId;
    return `\n\n### File: ${relativePath}\n\`\`\`${lang}\n${content}\n\`\`\`\n\n`;
  } catch {
    warnings.push(`${relativePath}: 读取失败`);
    return `\n\n### File: ${relativePath}\n\`\`\`\n[Read error]\n\`\`\`\n\n`;
  }
};

const renderChildren = async (
  node: EditorNode,
  warnings: string[]
): Promise<string> => {
  if (!node.content?.length) {
    return "";
  }
  const rendered = await Promise.all(
    node.content.map((child) => renderNode(child, warnings))
  );
  return rendered.join("");
};

const renderNode = async (
  node: EditorNode,
  warnings: string[]
): Promise<string> => {
  switch (node.type) {
    case "text":
      return node.text ?? "";
    case "hardBreak":
      return "\n";
    case "fileCapsule":
      return renderFileCapsule(node, warnings);
    case "paragraph":
    case "heading":
      return `${await renderChildren(node, warnings)}\n`;
    case "listItem":
      return `- ${await renderChildren(node, warnings)}\n`;
    case "bulletList":
    case "orderedList":
      return renderChildren(node, warnings);
    default:
      return renderChildren(node, warnings);
  }
};

export const assemblePrompt = async (root: EditorNode): Promise<AssembleResult> => {
  const warnings: string[] = [];
  const text = await renderNode(root, warnings);
  const countFileCapsules = (node: EditorNode): number => {
    const selfCount = node.type === "fileCapsule" ? 1 : 0;
    const childCount = (node.content ?? []).reduce(
      (total, child) => total + countFileCapsules(child),
      0
    );
    return selfCount + childCount;
  };
  const fileCount = countFileCapsules(root);

  return {
    text,
    fileCount,
    warnings
  };
};
