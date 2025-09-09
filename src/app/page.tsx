"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type LanguageModelUsage } from "ai";
import { useState } from "react";
import { ChatInput } from "@/components/chat";
import { ChatConversation } from "@/components/chat/conversation";
import { type Model, models } from "@/lib/ai";
import type { ChatUIMessage, Document } from "@/lib/ai/types";

export default function Chat() {
  const [model, setModel] = useState<Model>(models["google/gemini-2.5-flash"]);
  const [usage, setUsage] = useState<LanguageModelUsage>();
  const [document, setDocument] = useState<Document>({
    title: "",
    content: "",
  });

  const { messages, setMessages, sendMessage, regenerate, status, error } =
    useChat<ChatUIMessage>({
      transport: new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({ model: model.value, document }),
      }),
      onData: (dataPart) => {
        if (dataPart.type === "data-documentDelta")
          setDocument((p) => ({ ...p, content: p.content + dataPart.data }));
      },
      onFinish: ({ message, isError }) => {
        if (!isError && message.metadata?.usage) {
          setUsage(message.metadata.usage);
        }
      },
    });

  return (
    <div className="p-6 size-full h-screen flex flex-col">
      <ChatConversation
        messages={messages}
        regenerate={regenerate}
        status={status}
        error={error}
      />
      <ChatInput
        model={model}
        setModel={setModel}
        messages={messages}
        setMessages={setMessages}
        sendMessage={sendMessage}
        status={status}
        usage={usage}
        error={error}
      />
    </div>
  );
}
