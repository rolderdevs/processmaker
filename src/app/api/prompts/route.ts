import { NextResponse } from "next/server";
import { getDB, StringRecordId } from "@/lib/db";
import type { Prompt } from "./types";

async function getPrompts(): Promise<Prompt[]> {
  try {
    const db = await getDB();
    const rawPrompts = await db.select("prompt");

    // Convert RecordId to string for frontend
    const prompts = (rawPrompts || []).map(
      (prompt: { id: { toString(): string }; [key: string]: unknown }) => ({
        ...prompt,
        id: prompt.id.toString(),
      }),
    ) as Prompt[];

    return prompts;
  } catch (error) {
    console.error("Failed to fetch prompts from database:", error);
    return [];
  }
}

async function createPrompt(
  promptData: Omit<Prompt, "id" | "time">,
): Promise<Prompt> {
  const db = await getDB();
  const result = await db.create("prompt", promptData);

  // db.create returns array, take first element
  const record = Array.isArray(result) ? result[0] : result;

  // Convert RecordId to string for frontend
  const typedResult = record as unknown as {
    id: { toString(): string };
    [key: string]: unknown;
  };
  return {
    ...typedResult,
    id: typedResult.id.toString(),
  } as Prompt;
}

async function updatePrompt(
  id: string,
  updates: Partial<Prompt>,
): Promise<Prompt> {
  const db = await getDB();
  const result = await db.merge(new StringRecordId(id), updates);

  // Convert RecordId to string for frontend
  const typedResult = result as unknown as {
    id: { toString(): string };
    [key: string]: unknown;
  };
  return {
    ...typedResult,
    id: typedResult.id.toString(),
  } as Prompt;
}

async function deletePrompt(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(new StringRecordId(id));
}

export async function GET() {
  try {
    const prompts = await getPrompts();
    return NextResponse.json(prompts);
  } catch (error) {
    console.error("Failed to read prompts:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, title, content, copyFromId } = body;

    // Accept both 'name' and 'title' for backwards compatibility
    const promptTitle = title || name;

    if (!promptTitle || !content) {
      if (!copyFromId) {
        return NextResponse.json(
          { message: "Title and content are required" },
          { status: 400 },
        );
      }
    }

    let newPrompt: Prompt;

    if (copyFromId) {
      const db = await getDB();
      const rawPromptToCopy = await db.select(new StringRecordId(copyFromId));

      if (!rawPromptToCopy) {
        return NextResponse.json(
          { message: "Prompt to copy from not found" },
          { status: 404 },
        );
      }

      const copyData = rawPromptToCopy as unknown as {
        title: string;
        content: string;
        [key: string]: unknown;
      };

      newPrompt = await createPrompt({
        title: promptTitle || `${copyData.title} (Copy)`,
        content: copyData.content,
      });
    } else {
      newPrompt = await createPrompt({
        title: promptTitle,
        content,
      });
    }

    return NextResponse.json(newPrompt, { status: 201 });
  } catch (error) {
    console.error("Failed to create prompt:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, title, content } = body;

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    const db = await getDB();
    const rawExistingPrompt = await db.select(new StringRecordId(id));

    if (!rawExistingPrompt) {
      return NextResponse.json(
        { message: "Prompt not found" },
        { status: 404 },
      );
    }

    const existingPrompt = rawExistingPrompt as {
      isDefault?: boolean;
      [key: string]: unknown;
    };
    if (existingPrompt?.isDefault) {
      return NextResponse.json(
        { message: "Cannot modify the default prompt" },
        { status: 403 },
      );
    }

    const updates: Partial<Prompt> = {};

    // Accept both 'name' and 'title' for backwards compatibility
    const promptTitle = title || name;
    if (promptTitle !== undefined) {
      updates.title = promptTitle;
    }
    if (content !== undefined) {
      updates.content = content;
    }

    const updatedPrompt = await updatePrompt(id, updates);

    return NextResponse.json(updatedPrompt);
  } catch (error) {
    console.error("Failed to update prompt:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    const db = await getDB();
    const rawExistingPrompt = await db.select(new StringRecordId(id));

    if (rawExistingPrompt) {
      const existingPrompt = rawExistingPrompt as {
        isDefault?: boolean;
        [key: string]: unknown;
      };
      if (existingPrompt.isDefault) {
        return NextResponse.json(
          { message: "Cannot delete the default prompt" },
          { status: 403 },
        );
      }
    }

    await deletePrompt(id);

    return NextResponse.json({ message: "Prompt deleted successfully" });
  } catch (error) {
    console.error("Failed to delete prompt:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
