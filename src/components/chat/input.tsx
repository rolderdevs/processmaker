import type {
  ChatRequestOptions,
  ChatStatus,
  FileUIPart,
  LanguageModelUsage,
} from "ai";
import { type Dispatch, type SetStateAction, useState } from "react";
import { type Model, models } from "@/lib/ai";
import type { ChatUIMessage } from "@/lib/ai/types";
import { convertBlobFilesToDataURLs } from "@/lib/utils";
import {
  Context,
  ContextCacheUsage,
  ContextContent,
  ContextContentBody,
  ContextContentFooter,
  ContextContentHeader,
  ContextInputUsage,
  ContextOutputUsage,
  ContextReasoningUsage,
  ContextTrigger,
} from "../ai-elements/context";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "../ai-elements/prompt-input";

export const ChatInput = ({
  model,
  setModel,
  messages,
  setMessages,
  sendMessage,
  status,
  usage,
  error,
  system,
}: {
  model: Model;
  setModel: Dispatch<SetStateAction<Model>>;
  messages: ChatUIMessage[];
  setMessages: (
    messages:
      | ChatUIMessage[]
      | ((messages: ChatUIMessage[]) => ChatUIMessage[]),
  ) => void;
  sendMessage: (
    message?:
      | (Omit<ChatUIMessage, "id" | "role"> & {
          id?: string | undefined;
          role?: "system" | "user" | "assistant" | undefined;
        } & {
          text?: never;
          files?: never;
          messageId?: string;
        })
      | {
          text: string;
          files?: FileList | FileUIPart[];
          metadata?:
            | {
                usage: {
                  inputTokens: number;
                  outputTokens: number;
                  totalTokens: number;
                  reasoningTokens: number;
                  cachedInputTokens: number;
                };
              }
            | undefined;
          parts?: never;
          messageId?: string;
        }
      | {
          files: FileList | FileUIPart[];
          metadata?:
            | {
                usage: {
                  inputTokens: number;
                  outputTokens: number;
                  totalTokens: number;
                  reasoningTokens: number;
                  cachedInputTokens: number;
                };
              }
            | undefined;
          parts?: never;
          messageId?: string;
        }
      | undefined,
    options?: ChatRequestOptions,
  ) => Promise<void>;
  status: ChatStatus;
  usage?: LanguageModelUsage;
  error: Error | undefined;
  system?: string;
}) => {
  const [input, setInput] = useState("");

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    if (error != null) {
      setMessages(messages.slice(0, -1)); // remove last message
    }

    // Конвертируем blob URLs в data URLs
    const convertedFiles = message.files
      ? await convertBlobFilesToDataURLs(message.files)
      : undefined;

    sendMessage(
      {
        text: message.text || "Отправлено с вложениями",
        files: convertedFiles,
      },
      { body: { system } },
    );
    setInput("");
  };

  return (
    <PromptInput
      className="rounded-xl relative border shadow-sm transition-all duration-200 focus-within:border-border hover:border-muted-foreground/50"
      onSubmit={handleSubmit}
      globalDrop
      multiple
    >
      <PromptInputBody>
        <PromptInputAttachments>
          {(attachment) => <PromptInputAttachment data={attachment} />}
        </PromptInputAttachments>
        <PromptInputTextarea
          className="text-sm resize-none py-3 px-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-transparent !border-0 !border-none outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none placeholder:text-muted-foreground min-h-20"
          onChange={(e) => setInput(e.target.value)}
          autoFocus
          value={input}
        />
        <Context
          maxTokens={model.context}
          usedTokens={usage?.totalTokens || 0}
          usage={usage}
          modelId={model.priceModelId}
        >
          <ContextTrigger className="absolute right-0 rounded-xl" />
          <ContextContent>
            <ContextContentHeader />
            <ContextContentBody>
              <ContextInputUsage />
              <ContextOutputUsage />
              <ContextReasoningUsage />
              <ContextCacheUsage />
            </ContextContentBody>
            <ContextContentFooter />
          </ContextContent>
        </Context>
      </PromptInputBody>
      <PromptInputToolbar>
        <PromptInputTools>
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger />
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
          <PromptInputModelSelect
            onValueChange={(value) => {
              setModel(models[value]);
            }}
            value={model.value}
          >
            <PromptInputModelSelectTrigger>
              <PromptInputModelSelectValue />
            </PromptInputModelSelectTrigger>
            <PromptInputModelSelectContent>
              {Object.values(models).map((modelOption) => (
                <PromptInputModelSelectItem
                  key={modelOption.value}
                  value={modelOption.value}
                >
                  {modelOption.name}
                </PromptInputModelSelectItem>
              ))}
            </PromptInputModelSelectContent>
          </PromptInputModelSelect>
        </PromptInputTools>
        <PromptInputSubmit disabled={!input && !status} status={status} />
      </PromptInputToolbar>
    </PromptInput>
  );
};
