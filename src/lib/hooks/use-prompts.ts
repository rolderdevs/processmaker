import { useCallback, useEffect, useState } from "react";

import type { Prompt } from "@/app/api/prompts/types";

interface UsePromptsState {
  prompts: Prompt[];
  loading: boolean;
  error: Error | null;
}

export function usePrompts() {
  const [state, setState] = useState<UsePromptsState>({
    prompts: [],
    loading: true,
    error: null,
  });

  const fetchPrompts = useCallback(async () => {
    setState((prevState) => ({ ...prevState, loading: true }));
    try {
      const response = await fetch("/api/prompts");
      if (!response.ok) {
        throw new Error(`Failed to fetch prompts: ${response.statusText}`);
      }
      const data: Prompt[] = await response.json();
      data.sort((a, b) => {
        if (a.isDefault) return -1;
        if (b.isDefault) return 1;
        return a.title.localeCompare(b.title);
      });
      setState({ prompts: data, loading: false, error: null });
    } catch (error) {
      setState({ prompts: [], loading: false, error: error as Error });
      console.error(error);
    }
  }, []);

  useEffect(() => {
    void fetchPrompts();
  }, [fetchPrompts]);

  const addPrompt = useCallback(
    async (
      values:
        | { title: string; content: string }
        | { title: string; copyFromId: string },
    ) => {
      try {
        const response = await fetch("/api/prompts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (!response.ok) {
          throw new Error(`Failed to add prompt: ${response.statusText}`);
        }
        await fetchPrompts();
      } catch (error) {
        console.error(error);
        throw error; // Re-throw to be caught in the component
      }
    },
    [fetchPrompts],
  );

  const updatePrompt = useCallback(
    async (promptId: string, values: { title: string; content: string }) => {
      try {
        const response = await fetch("/api/prompts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: promptId, ...values }),
        });
        if (!response.ok) {
          throw new Error(`Failed to update prompt: ${response.statusText}`);
        }
        await fetchPrompts();
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    [fetchPrompts],
  );

  const deletePrompt = useCallback(
    async (promptId: string) => {
      try {
        const response = await fetch("/api/prompts", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: promptId }),
        });
        if (!response.ok) {
          throw new Error(`Failed to delete prompt: ${response.statusText}`);
        }
        await fetchPrompts();
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    [fetchPrompts],
  );

  return {
    ...state,
    addPrompt,
    updatePrompt,
    deletePrompt,
  };
}
