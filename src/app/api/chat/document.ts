import { type LanguageModel, tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import type { ChatUIMessage, Document } from "@/lib/ai/types";
import { documentHandler } from "./documentHandler";

type DocumentProps = {
  model: LanguageModel;
  dataStream: UIMessageStreamWriter<ChatUIMessage>;
  document: Document;
};

type UpdateDocumentProps = {
  model: LanguageModel;
  dataStream: UIMessageStreamWriter<ChatUIMessage>;
  document: Document;
};

export const createDocument = ({
  model,
  dataStream,
  document,
}: DocumentProps) =>
  tool({
    name: "Создать документ",
    description:
      "Создать документ. Этот инструмент вызовет другие функции, которые будут генерировать содержимое документа на основе заголовка и описания.",
    inputSchema: z.object({
      title: z.string().describe("Заголовок документа"),
      description: z
        .string()
        .describe(
          "Краткое описание и требования к документу на основе запроса пользователя",
        ),
    }),
    execute: async ({ title, description }) => {
      document.title = title;

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

      document.content = await documentHandler.onCreateDocument({
        model,
        title,
        description,
        dataStream,
      });

      dataStream.write({ type: "data-finish", data: null, transient: true });

      return {
        title,
        content: "Документ создан и теперь доступен пользователю",
      };
    },
  });

export const updateDocument = ({
  model,
  dataStream,
  document,
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

      document.content = await documentHandler.onUpdateDocument({
        model,
        document,
        description,
        dataStream,
      });

      dataStream.write({ type: "data-finish", data: null, transient: true });

      return {
        title: document.title,
        content: "Документ был успешно обновлен",
      };
    },
  });
