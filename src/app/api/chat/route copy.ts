import type { AnthropicProviderOptions } from "@ai-sdk/anthropic";
import type { GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import type { OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  smoothStream,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod/v4";
// import { systemPrompt } from "./promts";

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
// export type ChatUIMessage = UIMessage<MessageMetadata>;
export type ChatUIMessage = UIMessage<
  never, // metadata type
  {
    weather: {
      city: string;
      weather?: string;
      status: 'loading' | 'success';
    };
    notification: {
      message: string;
      level: 'info' | 'warning' | 'error';
    };
  }>;

export async function POST(req: Request) {
  const { messages, model } = await req.json();

  const stream = createUIMessageStream<ChatUIMessage>({
    execute: ({ writer }) => {
      // 1. Send initial status (transient - won't be added to message history)
      writer.write({
        type: 'data-notification',
        data: { message: 'Processing your request...', level: 'info' },
        transient: true, // This part won't be added to message history
      });

      // 2. Send sources (useful for RAG use cases)
      // writer.write({
      //   type: 'source',
      //   value: {
      //     type: 'source',
      //     sourceType: 'url',
      //     id: 'source-1',
      //     url: 'https://weather.com',
      //     title: 'Weather Data Source',
      //   },
      // });

      // 3. Send data parts with loading state
      writer.write({
        type: 'data-weather',
        id: 'weather-1',
        data: { city: 'San Francisco', status: 'loading' },
      });
console.log('data-weather loading4');
      const result = streamText({
        model,
        messages: convertToModelMessages(messages),
        onFinish() {
          console.log('onFinish');
          // 4. Update the same data part (reconciliation)
          writer.write({
            type: 'data-weather',
            id: 'weather-1', // Same ID = update existing part
            data: {
              city: 'San Francisco',
              weather: 'sunny',
              status: 'success',
            },
          });

          // 5. Send completion notification (transient)
          writer.write({
            type: 'data-notification',
            data: { message: 'Request completed', level: 'info' },
            transient: true, // Won't be added to message history
          });
        },
      });

      writer.merge(result.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({ stream });
}

// export async function POST(req: Request) {
//   const {
//     messages,
//     model,
//   }: {
//     messages: UIMessage[];
//     model: string;
//   } = await req.json();

//   const result = streamText({
//     model,
//     messages: convertToModelMessages(messages),
//     system:
//       systemPrompt +
//       "\n\nКогда пользователь просит создать документы, регламент, используй инструмент createDocument. Когда пользователь просит изменить или обновить, используй инструмент updateDocument.",
//     experimental_transform: smoothStream(),
//     tools: {
//       createDocument: tool({
//         description: "Создать документ",
//         inputSchema: z.object({
//           content: z
//             .string()
//             .describe("Содержимое документа в формате markdown"),
//         }),
//       }),
//       updateDocument: tool({
//         description: "Обновить документ новым содержимым",
//         inputSchema: z.object({
//           content: z
//             .string()
//             .describe("Обновленное содержимое документа в формате markdown"),
//         }),
//       }),
//     },
//     providerOptions: {
//       openai: {
//         reasoningSummary: "auto",
//       } satisfies OpenAIResponsesProviderOptions,
//       google: {
//         thinkingConfig: {
//           includeThoughts: true,
//         },
//       } satisfies GoogleGenerativeAIProviderOptions,
//       anthropic: {
//         thinking: { type: "enabled" },
//       } satisfies AnthropicProviderOptions,
//     },
//   });

//   // send sources and reasoning back to the client
//   return result.toUIMessageStreamResponse({
//     sendSources: true,
//     sendReasoning: true,
//     originalMessages: messages,
//     messageMetadata: ({ part }) => {
//       if (part.type === "finish-step") return part;
//     },
//   });
// }
