import { type LanguageModel, tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import type { ChatUIMessage, Document } from "@/lib/ai/types";
import { documentHandler } from "./documentHandler";

type DocumentProps = {
  model: LanguageModel;
  dataStream: UIMessageStreamWriter<ChatUIMessage>;
};

type UpdateDocumentProps = {
  model: LanguageModel;
  document: Document;
  dataStream: UIMessageStreamWriter<ChatUIMessage>;
};

export const createDocument = ({ model, dataStream }: DocumentProps) =>
  tool({
    description:
      "Создать документ для написания или создания контента. Этот инструмент вызовет другие функции, которые будут генерировать содержимое документа на основе заголовка и описания.",
    inputSchema: z.object({
      title: z.string().describe("Заголовок документа"),
      description: z.string().describe("Описание документа"),
    }),
    execute: async ({ title, description }) => {
      dataStream.write({
        type: "data-title",
        data: title,
        transient: true,
      });

      dataStream.write({
        type: "data-clear",
        data: null,
        transient: true,
      });

      await documentHandler.onCreateDocument({
        model,
        title,
        description,
        dataStream,
      });

      dataStream.write({ type: "data-finish", data: null, transient: true });

      return {
        title,
        content: "A document was created and is now visible to the user.",
      };
    },
  });

export const updateDocument = ({
  model,
  document,
  dataStream,
}: UpdateDocumentProps) =>
  tool({
    description: "Обновить документ с заданным описанием.",
    inputSchema: z.object({
      description: z.string().describe("Описание изменений"),
    }),
    execute: async ({ description }) => {
      dataStream.write({
        type: "data-clear",
        data: null,
        transient: true,
      });

      await documentHandler.onUpdateDocument({
        model,
        document,
        description,
        dataStream,
      });

      dataStream.write({ type: "data-finish", data: null, transient: true });

      return {
        title: document.title,
        content: "Документ был успешно обновлен.",
      };
    },
  });
