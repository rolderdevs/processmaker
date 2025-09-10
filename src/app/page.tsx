"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type LanguageModelUsage } from "ai";
import { useState } from "react";
import { Response } from "@/components/ai-elements/response";
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
        body: () => ({ model: model.value }),
      }),
      onData: (dataPart) => {
        if (dataPart.type === "data-title")
          setDocument((p) => ({ ...p, title: dataPart.data }));
        if (dataPart.type === "data-clear")
          setDocument((p) => ({ ...p, content: "" }));
        if (dataPart.type === "data-documentDelta")
          setDocument((p) => ({ ...p, content: p.content + dataPart.data }));
      },
      onFinish: ({ message, isError }) => {
        if (!isError && message.metadata?.usage) {
          setUsage(message.metadata.usage);
        }
      },
    });

  // console.log(document.content);

  return (
    <div className="p-6 size-full h-screen flex gap-10">
      <div className="h-full w-xl flex flex-col">
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

      <div className="size-full pb-6 overflow-auto">
        <Response>{document.content}</Response>
        {/*<Artifact>
          <ArtifactHeader>
            <div>
              <ArtifactTitle>{document.title}</ArtifactTitle>
              <ArtifactDescription>Updated 1 minute ago</ArtifactDescription>
            </div>
            <ArtifactActions>
              <ArtifactAction
                icon={CopyIcon}
                label="Скопировать"
                tooltip="Скопировать в буфер обмена"
              />
            </ArtifactActions>
          </ArtifactHeader>
          <ArtifactContent>
            <Response>{document.content}</Response>
          </ArtifactContent>
        </Artifact>*/}
      </div>
    </div>
  );
}
