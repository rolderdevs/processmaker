import type { InferUITool, UIMessage } from "ai";
import z from "zod/v4";
import type { createDocument } from "@/app/api/chat/document";

export type Document = {
  title: string;
  content: string;
};

export const messageMetadataSchema = z.object({
  usage: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
    totalTokens: z.number(),
    reasoningTokens: z.number(),
    cachedInputTokens: z.number(),
  }),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type createDocumentTool = InferUITool<ReturnType<typeof createDocument>>;

export type ChatTools = {
  createDocument: createDocumentTool;
  // updateDocument: updateDocumentTool;
};

export type CustomUIDataTypes = {
  documentDelta: string;
  appendMessage: string;
  title: string;
  clear: null;
  finish: null;
};

export type ChatUIMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;
