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

const isMarkdownSyntax = (text: string): boolean => {
  const trimmed = text.trim();
  // Check for common markdown syntax patterns that should not be wrapped
  return (
    /^#+\s/.test(trimmed) || // headers
    /^[*\-+]\s/.test(trimmed) || // list markers
    /^\d+\.\s/.test(trimmed) || // numbered lists
    /^>\s/.test(trimmed) || // blockquotes
    trimmed === "```" || // code block markers
    trimmed.startsWith("---") || // horizontal rules
    /^[*_`]$/.test(trimmed) || // single formatting characters
    /^\[[^\]]*\]\([^)]*\)$/.test(trimmed) // complete links
  );
};

const tokenizeText = (text: string): string[] => {
  const tokens: string[] = [];

  // Handle markdown formatting patterns first
  const markdownRegex =
    /(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)]+\)|[\s]+)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null = markdownRegex.exec(text);

  while (match !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      if (beforeText) tokens.push(beforeText);
    }

    // Add the matched pattern (markdown or whitespace)
    tokens.push(match[0]);
    lastIndex = match.index + match[0].length;
    match = markdownRegex.exec(text);
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex);
    if (remaining) tokens.push(remaining);
  }

  return tokens.filter((token) => token.length > 0);
};

export const createMarkdownWithDiff = (
  oldText: string,
  newText: string,
): string => {
  // For empty old text, use special processing for new documents
  if (oldText.trim() === "") {
    return processNewDocument(newText);
  }

  // For existing documents, use line-by-line diff to preserve markdown structure
  return processDocumentChanges(oldText, newText);
};

const processDocumentChanges = (oldText: string, newText: string): string => {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const dmp = new diff_match_patch();

  // Use line-level diff first
  const lineDiffs = dmp.diff_main(
    oldLines.join("\n\u0001"),
    newLines.join("\n\u0001"),
  );
  dmp.diff_cleanupSemantic(lineDiffs);

  const result: string[] = [];

  for (const [operation, text] of lineDiffs) {
    const lines = text.split("\n\u0001").filter((line) => line !== "");

    for (const line of lines) {
      if (line === "") {
        result.push("");
        continue;
      }

      switch (operation) {
        case DiffType.Inserted:
          result.push(processLineAsAdded(line));
          break;
        case DiffType.Deleted:
          result.push(processLineAsDeleted(line));
          break;
        case DiffType.Unchanged:
          result.push(line);
          break;
      }
    }
  }

  return result.join("\n");
};

const processNewDocument = (newText: string): string => {
  const lines = newText.split("\n");
  const result: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trim() === "") {
      result.push(line);
      continue;
    }

    // Handle code blocks specially
    if (line.trim() === "```" || line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      result.push(`:add[${line}]`);
      continue;
    }

    if (inCodeBlock) {
      result.push(`:add[${line}]`);
      continue;
    }

    // Check if line starts with markdown syntax
    const markdownMatch = line.match(
      /^(\s*)(#+\s+|[*\-+]\s+|\d+\.\s+|>\s*)(.*)/,
    );

    if (markdownMatch) {
      const [, indent, syntax, content] = markdownMatch;
      if (content.trim()) {
        result.push(`${indent}${syntax}:add[${content.trim()}]`);
      } else {
        result.push(`${indent}${syntax}`);
      }
    } else {
      // Regular text line - tokenize and wrap appropriately
      const tokens = tokenizeText(line);
      let processedLine = "";

      for (const token of tokens) {
        if (/^\s+$/.test(token)) {
          processedLine += token; // preserve whitespace
        } else if (
          token.match(
            /^\*\*[^*]+\*\*$|^\*[^*]+\*$|^_[^_]+_$|^`[^`]+`$|\[[^\]]+\]\([^)]+\)$/,
          )
        ) {
          // Preserve complete markdown formatting as-is
          processedLine += `:add[${token}]`;
        } else if (token.trim() && !isMarkdownSyntax(token)) {
          processedLine += `:add[${token}]`;
        } else {
          processedLine += token;
        }
      }

      result.push(processedLine);
    }
  }

  return result.join("\n");
};

const processLineAsAdded = (line: string): string => {
  if (line.trim() === "") {
    return line;
  }

  // Check if line starts with markdown syntax
  const markdownMatch = line.match(
    /^(\s*)(#+\s+|[*\-+]\s+|\d+\.\s+|>\s*|```.*)(.*)/,
  );

  if (markdownMatch) {
    const [, indent, syntax, content] = markdownMatch;
    if (content.trim()) {
      return `${indent}${syntax}:add[${content.trim()}]`;
    } else {
      return `${indent}${syntax}`;
    }
  } else {
    // Regular text line - tokenize and wrap appropriately
    const tokens = tokenizeText(line);
    let processedLine = "";

    for (const token of tokens) {
      if (/^\s+$/.test(token)) {
        processedLine += token; // preserve whitespace
      } else if (
        token.match(
          /^\*\*[^*]+\*\*$|^\*[^*]+\*$|^_[^_]+_$|^`[^`]+`$|\[[^\]]+\]\([^)]+\)$/,
        )
      ) {
        // Preserve complete markdown formatting as-is
        processedLine += `:add[${token}]`;
      } else if (token.trim() && !isMarkdownSyntax(token)) {
        processedLine += `:add[${token}]`;
      } else {
        processedLine += token;
      }
    }

    return processedLine;
  }
};

const processLineAsDeleted = (line: string): string => {
  if (line.trim() === "") {
    return line;
  }

  // Check if line starts with markdown syntax
  const markdownMatch = line.match(
    /^(\s*)(#+\s+|[*\-+]\s+|\d+\.\s+|>\s*|```.*)(.*)/,
  );

  if (markdownMatch) {
    const [, indent, syntax, content] = markdownMatch;
    if (content.trim()) {
      return `${indent}${syntax}:del[${content.trim()}]`;
    } else {
      return `${indent}${syntax}`;
    }
  } else {
    // Regular text line - tokenize and wrap appropriately
    const tokens = tokenizeText(line);
    let processedLine = "";

    for (const token of tokens) {
      if (/^\s+$/.test(token)) {
        processedLine += token; // preserve whitespace
      } else if (
        token.match(
          /^\*\*[^*]+\*\*$|^\*[^*]+\*$|^_[^_]+_$|^`[^`]+`$|\[[^\]]+\]\([^)]+\)$/,
        )
      ) {
        // Preserve complete markdown formatting as-is
        processedLine += `:del[${token}]`;
      } else if (token.trim() && !isMarkdownSyntax(token)) {
        processedLine += `:del[${token}]`;
      } else {
        processedLine += token;
      }
    }

    return processedLine;
  }
};
