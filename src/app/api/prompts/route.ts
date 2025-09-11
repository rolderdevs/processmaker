import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import path from "path";
import type { Prompt } from "./types";

const promptsFilePath = path.join(
  process.cwd(),
  "src/app/api/prompts/prompts.json",
);

async function getPrompts(): Promise<Prompt[]> {
  try {
    const data = await fs.readFile(promptsFilePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // If the file doesn't exist, we can return an empty array or handle it differently
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function savePrompts(prompts: Prompt[]) {
  const data = JSON.stringify(prompts, null, 2);
  await fs.writeFile(promptsFilePath, data, "utf-8");
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
    const { name, content, copyFromId } = body;

    if (!name || !content) {
      // Basic validation
      if (!copyFromId) {
        return NextResponse.json(
          { message: "Name and content are required" },
          { status: 400 },
        );
      }
    }

    const prompts = await getPrompts();
    let newPrompt: Prompt;

    if (copyFromId) {
      const promptToCopy = prompts.find((p) => p.id === copyFromId);
      if (!promptToCopy) {
        return NextResponse.json(
          { message: "Prompt to copy from not found" },
          { status: 404 },
        );
      }
      newPrompt = {
        id: crypto.randomUUID(),
        name: name || `${promptToCopy.name} (Copy)`,
        content: promptToCopy.content,
        updatedAt: new Date().toISOString(),
      };
    } else {
      newPrompt = {
        id: crypto.randomUUID(),
        name,
        content,
        updatedAt: new Date().toISOString(),
      };
    }

    prompts.push(newPrompt);
    await savePrompts(prompts);

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
    const body: Partial<Prompt> & { id: string } = await request.json();
    const { id, name, content } = body;

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    const prompts = await getPrompts();
    const promptIndex = prompts.findIndex((p) => p.id === id);

    if (promptIndex === -1) {
      return NextResponse.json(
        { message: "Prompt not found" },
        { status: 404 },
      );
    }

    const promptToUpdate = prompts[promptIndex];

    if (promptToUpdate.isDefault) {
      return NextResponse.json(
        { message: "Cannot modify the default prompt" },
        { status: 403 },
      );
    }

    const updatedPrompt = {
      ...promptToUpdate,
      name: name ?? promptToUpdate.name,
      content: content ?? promptToUpdate.content,
      updatedAt: new Date().toISOString(),
    };

    prompts[promptIndex] = updatedPrompt;
    await savePrompts(prompts);

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

    const prompts = await getPrompts();
    const promptToDelete = prompts.find((p) => p.id === id);

    if (!promptToDelete) {
      // Allow deletion request to succeed even if prompt doesn't exist
      return NextResponse.json(
        { message: "Prompt deleted successfully" },
        { status: 200 },
      );
    }

    if (promptToDelete.isDefault) {
      return NextResponse.json(
        { message: "Cannot delete the default prompt" },
        { status: 403 },
      );
    }

    const updatedPrompts = prompts.filter((p) => p.id !== id);
    await savePrompts(updatedPrompts);

    return NextResponse.json({ message: "Prompt deleted successfully" });
  } catch (error) {
    console.error("Failed to delete prompt:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
