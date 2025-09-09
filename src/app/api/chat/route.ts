import type { AnthropicProviderOptions } from "@ai-sdk/anthropic";
import type { GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import type { OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  smoothStream,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod/v4";
import { systemPrompt } from "./promts";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

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
export type ChatUIMessage = UIMessage<MessageMetadata>;

export async function POST(req: Request) {
  const {
    messages,
    model,
  }: {
    messages: UIMessage[];
    model: string;
  } = await req.json();

  const result = streamText({
    model,
    messages: convertToModelMessages(messages),
    system:
      systemPrompt +
      "\n\nWhen user asks to create documents, articles, or substantial content, use the createDocument tool. When user asks to modify or update existing document, use updateDocument tool.",
    experimental_transform: smoothStream(),
    tools: {
      createDocument: tool({
        description: "Create a text document",
        inputSchema: z.object({
          title: z.string().describe("Title of the document"),
          content: z
            .string()
            .describe("Content of the document in markdown format"),
        }),
      }),
      updateDocument: tool({
        description: "Update the existing document with new content",
        inputSchema: z.object({
          title: z.string().describe("Updated title of the document"),
          content: z
            .string()
            .describe("Updated content of the document in markdown format"),
        }),
      }),
    },
    providerOptions: {
      openai: {
        reasoningSummary: "auto",
      } satisfies OpenAIResponsesProviderOptions,
      google: {
        thinkingConfig: {
          includeThoughts: true,
        },
      } satisfies GoogleGenerativeAIProviderOptions,
      anthropic: {
        thinking: { type: "enabled" },
      } satisfies AnthropicProviderOptions,
    },
  });

  // send sources and reasoning back to the client
  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
    originalMessages: messages,
    messageMetadata: ({ part }) => {
      if (part.type === "finish-step") return part;
    },
  });
}
