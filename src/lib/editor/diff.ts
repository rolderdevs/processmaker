import { diff_match_patch } from "diff-match-patch";
import type { Data, Node } from "unist";
import { type Visitor, visit } from "unist-util-visit";

const DiffType = {
  Unchanged: 0,
  Deleted: -1,
  Inserted: 1,
};

interface DirectiveNode extends Node {
  name: string;
  attributes?: Record<string, unknown>;
  data?: Data & {
    hName?: string;
    hProperties?: Record<string, unknown>;
  };
}

export const remarkDirectiveReact = () => {
  return (tree: Node) => {
    const visitor: Visitor = (node) => {
      if (
        node.type === "containerDirective" ||
        node.type === "leafDirective" ||
        node.type === "textDirective"
      ) {
        const directiveNode = node as DirectiveNode;
        const data = directiveNode.data || {};
        directiveNode.data = data;

        data.hName = directiveNode.name;
        data.hProperties = directiveNode.attributes || {};
      }
    };

    visit(tree, visitor);
  };
};

export const createMarkdownWithDiff = (
  oldText: string,
  newText: string,
): string => {
  const dmp = new diff_match_patch();

  // Use character mode diff for best precision
  const diffs = dmp.diff_main(oldText, newText);
  dmp.diff_cleanupSemantic(diffs);

  // Build markdown with diff markup
  let result = "";
  let lastWasDirective = false;

  for (const [operation, text] of diffs) {
    switch (operation) {
      case DiffType.Inserted:
        if (text.trim()) {
          // Add space before directive if last element was also a directive
          if (lastWasDirective) {
            result += " ";
          }

          // Handle newlines: preserve them outside directives
          if (text.includes("\n")) {
            const parts = text.split("\n");
            for (let i = 0; i < parts.length; i++) {
              if (parts[i].trim()) {
                result += `:add[${parts[i].trim()}]`;
              }
              if (i < parts.length - 1) {
                result += "\n";
              }
            }
          } else {
            result += `:add[${text.trim()}]`;
          }
          lastWasDirective = true;
        } else {
          result += text; // preserve whitespace/newlines
          lastWasDirective = false;
        }
        break;
      case DiffType.Deleted:
        if (text.trim()) {
          // Add space before directive if last element was also a directive
          if (lastWasDirective) {
            result += " ";
          }

          // Handle newlines: preserve them outside directives
          if (text.includes("\n")) {
            const parts = text.split("\n");
            for (let i = 0; i < parts.length; i++) {
              if (parts[i].trim()) {
                result += `:del[${parts[i].trim()}]`;
              }
              if (i < parts.length - 1) {
                result += "\n";
              }
            }
          } else {
            result += `:del[${text.trim()}]`;
          }
          lastWasDirective = true;
        } else {
          result += text; // preserve whitespace/newlines
          lastWasDirective = false;
        }
        break;
      case DiffType.Unchanged:
        result += text;
        lastWasDirective = false;
        break;
    }
  }

  return result;
};
