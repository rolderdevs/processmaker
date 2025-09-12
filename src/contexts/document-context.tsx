"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

export interface Document {
  title: string;
  content: string;
}

interface DocumentContextValue {
  document: Document;
  prevDocumentContent: string;
  diffVisible: boolean;
  setDocument: (document: Document | ((prev: Document) => Document)) => void;
  setPrevDocumentContent: (content: string) => void;
  setDiffVisible: (visible: boolean | ((prev: boolean) => boolean)) => void;
  toggleDiff: () => void;
  copyToClipboard: () => Promise<void>;
}

const DocumentContext = createContext<DocumentContextValue | undefined>(
  undefined,
);

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [document, setDocument] = useState<Document>({
    title: "",
    content: "",
  });
  const [prevDocumentContent, setPrevDocumentContent] = useState("");
  const [diffVisible, setDiffVisible] = useState(false);

  const toggleDiff = () => {
    setDiffVisible((prev) => !prev);
  };

  const copyToClipboard = async () => {
    await window.navigator.clipboard.writeText(document.content);
  };

  const value: DocumentContextValue = {
    document,
    prevDocumentContent,
    diffVisible,
    setDocument,
    setPrevDocumentContent,
    setDiffVisible,
    toggleDiff,
    copyToClipboard,
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocument() {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error("useDocument must be used within a DocumentProvider");
  }
  return context;
}
