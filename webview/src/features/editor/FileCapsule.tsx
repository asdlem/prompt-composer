import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps
} from "@tiptap/react";
import type { MouseEvent } from "react";
import { getWebviewStrings } from "../../services/i18n";
import { postWebviewMessage } from "../../services/vscodeApi";

const FileCapsuleView = (props: NodeViewProps) => {
  const { node, deleteNode } = props;
  const strings = getWebviewStrings();

  const path = String(node.attrs.path || "");
  const name = String(node.attrs.name || strings.capsuleUnknownName);

  const handleRemove = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    deleteNode();
  };

  const handleOpen = (event: MouseEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!path) {
      return;
    }
    postWebviewMessage({ command: "open-file", path });
  };

  return (
    <NodeViewWrapper
      as="span"
      className="pc-capsule"
      data-path={path}
      contentEditable={false}
      onClick={handleOpen}
    >
      <span className="pc-capsule-label">📄 {name}</span>
      <button
        className="pc-capsule-remove"
        type="button"
        onClick={handleRemove}
        aria-label={strings.capsuleRemoveLabel}
      >
        ×
      </button>
    </NodeViewWrapper>
  );
};

export const FileCapsule = Node.create({
  name: "fileCapsule",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      path: {
        default: ""
      },
      name: {
        default: ""
      }
    };
  },
  parseHTML() {
    return [
      {
        tag: "span[data-file-capsule]"
      }
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-file-capsule": "true"
      })
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(FileCapsuleView);
  }
});
