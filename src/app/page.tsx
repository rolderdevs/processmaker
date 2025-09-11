"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type LanguageModelUsage } from "ai";
import { CopyIcon, ListTree } from "lucide-react";
import { useRef, useState } from "react";
import remarkGfm from "remark-gfm";
import {
  Artifact,
  ArtifactAction,
  ArtifactActions,
  ArtifactContent,
  ArtifactHeader,
  ArtifactTitle,
} from "@/components/ai-elements/artifact";
import { Response } from "@/components/ai-elements/response";
import { ChatInput } from "@/components/chat";
import { ChatConversation } from "@/components/chat/conversation";
import { DiffView } from "@/components/diffview";
import { type Model, models } from "@/lib/ai";
import type { ChatUIMessage, Document } from "@/lib/ai/types";

export default function Chat() {
  const [model, setModel] = useState<Model>(models["google/gemini-2.5-flash"]);
  const [usage, setUsage] = useState<LanguageModelUsage>();
  const [document, setDocument] = useState<Document>({
    title: "",
    content: "",
  });
  const [prevDocumentContent, setPrevDocumentContent] = useState("");
  const [diffVisible, setDiffVisible] = useState(false);

  const documentRef = useRef(document);
  documentRef.current = document;

  const { messages, setMessages, sendMessage, regenerate, status, error } =
    useChat<ChatUIMessage>({
      transport: new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({ model: model.value }),
      }),
      onData: (dataPart) => {
        if (dataPart.type === "data-title")
          setDocument((p) => ({ ...p, title: dataPart.data }));
        if (dataPart.type === "data-clear") {
          setPrevDocumentContent(documentRef.current.content);
          setDocument((p) => ({ ...p, content: "" }));
        }
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

      <Artifact className="w-full">
        <ArtifactHeader className="h-10">
          <ArtifactTitle className="text-xl text-muted-foreground">
            {document.title}
          </ArtifactTitle>

          <ArtifactActions className="ml-auto">
            <ArtifactAction
              icon={CopyIcon}
              label="Скопировать"
              tooltip="Скопировать в буфер обмена"
              onClick={() =>
                window.navigator.clipboard.writeText(document.content)
              }
            />
            <ArtifactAction
              icon={ListTree}
              label="Показать изменения"
              tooltip="Показать изменения"
              onClick={() => {
                setDiffVisible((prev) => !prev);
              }}
            />
          </ArtifactActions>
        </ArtifactHeader>
        <ArtifactContent>
          {!diffVisible ? (
            <Response remarkPlugins={[[remarkGfm, { singleTilde: false }]]}>
              {document.content}
            </Response>
          ) : (
            <DiffView
              oldContent={prevDocumentContent}
              newContent={document.content}
            />
          )}
        </ArtifactContent>
      </Artifact>
    </div>
  );
}
