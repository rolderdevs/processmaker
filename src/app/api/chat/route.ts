import type { GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import type { OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  smoothStream,
  streamText,
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
    system: systemPrompt,
    experimental_transform: smoothStream(),
    providerOptions: {
      openai: {
        reasoningSummary: "auto",
      } satisfies OpenAIResponsesProviderOptions,
      google: {
        thinkingConfig: {
          includeThoughts: true,
        },
      } satisfies GoogleGenerativeAIProviderOptions,
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
