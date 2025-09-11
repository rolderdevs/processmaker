"use client";

import { useMemo } from "react";
import remarkDirective from "remark-directive";
import { Streamdown } from "streamdown";
import {
  createMarkdownWithDiff,
  remarkDirectiveReact,
} from "@/lib/editor/diff";

type DirectiveComponent = {
  children?: React.ReactNode;
};

type CustomComponents = {
  del: React.ComponentType<DirectiveComponent>;
  add: React.ComponentType<DirectiveComponent>;
};

type DiffEditorProps = {
  oldContent: string;
  newContent: string;
};

export const DiffView = ({ oldContent, newContent }: DiffEditorProps) => {
  const diffMarkdown = useMemo(() => {
    return createMarkdownWithDiff(oldContent, newContent);
  }, [oldContent, newContent]);

  return (
    <div className="diff-editor">
      <Streamdown
        className="size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
        parseIncompleteMarkdown={false}
        remarkPlugins={[remarkDirective, remarkDirectiveReact]}
        components={
          {
            del: ({ children }: DirectiveComponent) => (
              <span className="bg-red-100 line-through text-red-600 dark:bg-red-600/70 dark:text-red-200">
                {children}
              </span>
            ),
            add: ({ children }: DirectiveComponent) => (
              <span className="bg-green-100 text-green-700 dark:bg-green-700/70 dark:text-green-200">
                {children}
              </span>
            ),
          } as Partial<CustomComponents>
        }
      >
        {diffMarkdown}
      </Streamdown>
    </div>
  );
};
