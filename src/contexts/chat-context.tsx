"use client";

import { useChat as useAIChat } from "@ai-sdk/react";
import {
  type ChatRequestOptions,
  type ChatStatus,
  DefaultChatTransport,
  type LanguageModelUsage,
} from "ai";
import { Loader2Icon } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useContext,
  useRef,
  useState,
} from "react";
import { type Model, models } from "@/lib/ai";
import type { ChatUIMessage } from "@/lib/ai/types";
import { useDocument } from "./document-context";
import { usePrompts } from "./prompts-context";

interface ChatContextValue {
  model: Model;
  setModel: React.Dispatch<React.SetStateAction<Model>>;
  messages: ChatUIMessage[];
  setMessages: (
    messages:
      | ChatUIMessage[]
      | ((messages: ChatUIMessage[]) => ChatUIMessage[]),
  ) => void;
  sendMessage: (
    message?: ChatUIMessage,
    options?: ChatRequestOptions,
  ) => Promise<void>;
  status: ChatStatus;
  error: Error | undefined;
  usage: LanguageModelUsage | undefined;
  regenerate: (
    options?: { messageId?: string } & ChatRequestOptions,
  ) => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { loading } = usePrompts();

  // Показываем загрузку пока промпты не загрузились
  if (loading) {
    return (
      <div className="p-6 size-full h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
          <div className="text-sm text-muted-foreground">Загрузка ...</div>
        </div>
      </div>
    );
  }

  return <ChatProviderInner>{children}</ChatProviderInner>;
}

function ChatProviderInner({ children }: { children: ReactNode }) {
  const [model, setModel] = useState<Model>(models["google/gemini-2.5-flash"]);
  const [usage, setUsage] = useState<LanguageModelUsage>();

  const { selectedPrompt } = usePrompts();
  const { setDocument, setPrevDocumentContent } = useDocument();

  const documentRef = useRef({ title: "", content: "" });

  const { messages, setMessages, sendMessage, regenerate, status, error } =
    useAIChat<ChatUIMessage>({
      transport: new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({
          model: model.value,
          agentInstructions: selectedPrompt?.content || "",
        }),
      }),
      onData: (dataPart) => {
        if (dataPart.type === "data-title") {
          const newDocument = { ...documentRef.current, title: dataPart.data };
          documentRef.current = newDocument;
          setDocument(newDocument);
        }
        if (dataPart.type === "data-clear") {
          setPrevDocumentContent(documentRef.current.content);
          const newDocument = { ...documentRef.current, content: "" };
          documentRef.current = newDocument;
          setDocument(newDocument);
        }
        if (dataPart.type === "data-documentDelta") {
          const newDocument = {
            ...documentRef.current,
            content: documentRef.current.content + dataPart.data,
          };
          documentRef.current = newDocument;
          setDocument(newDocument);
        }
      },
      onFinish: ({ message, isError }) => {
        if (!isError && message.metadata?.usage) {
          setUsage(message.metadata.usage);
        }
      },
    });

  const value: ChatContextValue = {
    model,
    setModel,
    messages,
    setMessages,
    sendMessage,
    status,
    error,
    usage,
    regenerate,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
