import type { AnthropicProviderOptions } from "@ai-sdk/anthropic";
import type { GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import type { OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import {
  createOpenRouter,
  type OpenRouterProviderOptions,
} from "@openrouter/ai-sdk-provider";
import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  stepCountIs,
  streamText,
} from "ai";
import type { ChatUIMessage, Document } from "@/lib/ai/types";
import { createDocument, updateDocument } from "./document";

export const maxDuration = 60;

const openrouter = createOpenRouter();

const document: Document = { title: "", content: "" };

export async function POST(request: Request) {
  const {
    messages,
    model,
    agentInstructions,
  }: {
    messages: ChatUIMessage[];
    model: string;
    agentInstructions: string;
  } = await request.json();

  console.log("agentInstructions", agentInstructions);

  try {
    const openrouterModel = openrouter.chat(model);

    const stream = createUIMessageStream({
      originalMessages: messages,
      execute: ({ writer: dataStream }) => {
        const result = streamText({
          model: openrouterModel,
          temperature: 0,
          system: agentInstructions,
          messages: convertToModelMessages(messages),
          stopWhen: stepCountIs(5),
          experimental_transform: smoothStream({ chunking: "word" }),
          tools: {
            createDocument: createDocument({
              model: openrouterModel,
              dataStream,
              document,
            }),
            updateDocument: updateDocument({
              model: openrouterModel,
              dataStream,
              document,
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
            openrouter: {
              reasoning: {
                enabled: true,
                effort: "medium",
              },
            } satisfies OpenRouterProviderOptions,
          },
        });

        result.consumeStream();
        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
            messageMetadata: ({ part }) => {
              if (part.type === "finish-step") {
                return {
                  usage: {
                    inputTokens: part.usage.inputTokens ?? 0,
                    outputTokens: part.usage.outputTokens ?? 0,
                    totalTokens: part.usage.totalTokens ?? 0,
                    reasoningTokens: part.usage.reasoningTokens ?? 0,
                    cachedInputTokens: part.usage.cachedInputTokens ?? 0,
                  },
                };
              }
            },
          }),
        );
      },
      onError: () => {
        return "Опа, ошибка!";
      },
    });

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
  } catch (error) {
    console.error("Опа, ошибка:", error);
    return new Response(JSON.stringify({ error }), { status: 500 });
  }
}
