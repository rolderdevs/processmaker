import {
  type LanguageModel,
  smoothStream,
  streamText,
  type UIMessageStreamWriter,
} from "ai";
import type { ChatUIMessage, Document } from "@/lib/ai/types";
import { updateDocumentPrompt } from "./promts";

export const documentHandler = {
  onCreateDocument: async ({
    model,
    title,
    description,
    dataStream,
  }: {
    model: LanguageModel;
    title: string;
    description: string;
    dataStream: UIMessageStreamWriter<ChatUIMessage>;
  }) => {
    let draftContent = "";

    const { fullStream } = streamText({
      model,
      temperature: 0,
      system:
        "Создайте документ на основе предоставленного заголовка и описания. Используйте Markdown для структурирования текста. Включайте заголовки, где это необходимо.",
      experimental_transform: smoothStream({ chunking: "word" }),
      prompt: `${title}\n\n${description}`,
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === "text-delta") {
        const { text } = delta;

        draftContent += text;

        dataStream.write({
          type: "data-documentDelta",
          data: text,
          transient: true,
        });
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({
    model,
    document,
    description,
    dataStream,
  }: {
    model: LanguageModel;
    document: Document;
    description: string;
    dataStream: UIMessageStreamWriter<ChatUIMessage>;
  }) => {
    let draftContent = "";

    console.log(
      "Updating document...",
      updateDocumentPrompt(document.content),
      description,
    );

    const { fullStream } = streamText({
      model,
      temperature: 0,
      system: updateDocumentPrompt(document.content),
      experimental_transform: smoothStream({ chunking: "word" }),
      prompt: description,
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === "text-delta") {
        const { text } = delta;

        draftContent += text;

        dataStream.write({
          type: "data-documentDelta",
          data: text,
          transient: true,
        });
      }
    }

    return draftContent;
  },
};
