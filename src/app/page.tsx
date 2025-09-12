"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type LanguageModelUsage } from "ai";
import { CopyIcon, ListTree } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { PromptsManager } from "@/components/prompts";
import { type Model, models } from "@/lib/ai";
import type { ChatUIMessage, Document } from "@/lib/ai/types";
import { usePrompts } from "@/lib/hooks/use-prompts";

export default function Chat() {
  const [model, setModel] = useState<Model>(models["google/gemini-2.5-flash"]);
  const {
    prompts,

    addPrompt,
    updatePrompt,
    deletePrompt,
  } = usePrompts();
  const [selectedPromptId, setSelectedPromptId] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [usage, setUsage] = useState<LanguageModelUsage>();
  const [document, setDocument] = useState<Document>({
    title: "",
    content: "",
  });
  const [prevDocumentContent, setPrevDocumentContent] = useState("");
  const [diffVisible, setDiffVisible] = useState(false);

  const documentRef = useRef(document);
  documentRef.current = document;

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

  const selectedPrompt = useMemo(
    () =>
      selectedPromptId
        ? prompts.find((p) => p.id === selectedPromptId)
        : undefined,
    [prompts, selectedPromptId],
  );

  const { messages, setMessages, sendMessage, regenerate, status, error } =
    useChat<ChatUIMessage>({
      transport: new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({
          model: model.value,
          system: selectedPrompt?.content,
        }),
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
        <PromptsManager
          prompts={prompts}
          selectedPromptId={selectedPromptId}
          onSelectPrompt={(promptId) => {
            setSelectedPromptId(promptId || "");
            if (isClient && promptId) {
              localStorage.setItem("selectedPromptId", promptId);
            }
          }}
          onAddPrompt={addPrompt}
          onUpdatePrompt={updatePrompt}
          onDeletePrompt={deletePrompt}
          className="mb-4"
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
          system={selectedPrompt?.content}
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
