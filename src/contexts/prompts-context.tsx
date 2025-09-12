"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Prompt } from "@/lib/db";
import { usePrompts as usePromptsHook } from "@/lib/hooks/use-prompts";

interface PromptsContextValue {
  prompts: Prompt[];
  selectedPromptId: string;
  selectedPrompt: Prompt | undefined;
  selectPrompt: (promptId: string) => void;
  addPrompt: (
    values:
      | { title: string; content: string }
      | { title: string; copyFromId: string },
  ) => Promise<string>;
  updatePrompt: (
    promptId: string,
    values: { title: string; content: string },
  ) => Promise<void>;
  deletePrompt: (promptId: string) => Promise<void>;
}

const PromptsContext = createContext<PromptsContextValue | undefined>(
  undefined,
);

export function PromptsProvider({ children }: { children: ReactNode }) {
  const { prompts, addPrompt, updatePrompt, deletePrompt } = usePromptsHook();

  const [selectedPromptId, setSelectedPromptId] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedPromptId = localStorage.getItem("selectedPromptId");
    if (storedPromptId) {
      setSelectedPromptId(storedPromptId);
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const selectedPromptExists =
      selectedPromptId && prompts.some((p) => p.id === selectedPromptId);

    if ((!selectedPromptId || !selectedPromptExists) && prompts.length > 0) {
      const defaultPrompt = prompts.find((p) => p.isDefault);
      const newSelectedId = defaultPrompt?.id ?? prompts[0].id;
      setSelectedPromptId(newSelectedId);
      localStorage.setItem("selectedPromptId", newSelectedId);
    }
  }, [prompts, selectedPromptId, isClient]);

  useEffect(() => {
    if (isClient && selectedPromptId) {
      localStorage.setItem("selectedPromptId", selectedPromptId);
    }
  }, [selectedPromptId, isClient]);

  const selectedPrompt = prompts.find((p) => p.id === selectedPromptId);

  const selectPrompt = (promptId: string) => {
    setSelectedPromptId(promptId);
    if (isClient && promptId) {
      localStorage.setItem("selectedPromptId", promptId);
    }
  };

  const value: PromptsContextValue = {
    prompts,
    selectedPromptId,
    selectedPrompt,
    selectPrompt,
    addPrompt,
    updatePrompt,
    deletePrompt,
  };

  return (
    <PromptsContext.Provider value={value}>{children}</PromptsContext.Provider>
  );
}

export function usePrompts() {
  const context = useContext(PromptsContext);
  if (context === undefined) {
    throw new Error("usePrompts must be used within a PromptsProvider");
  }
  return context;
}
