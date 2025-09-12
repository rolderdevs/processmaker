import { NextResponse } from "next/server";
import { type Prompt, promptsRepository } from "@/lib/db";

export async function GET() {
  try {
    const prompts = await promptsRepository.getPrompts();
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

    if (!promptTitle) {
      return NextResponse.json(
        { message: "Title is required" },
        { status: 400 },
      );
    }

    if (!content && !copyFromId) {
      return NextResponse.json(
        { message: "Content is required" },
        { status: 400 },
      );
    }

    let newPrompt: Prompt | null;

    if (copyFromId) {
      const promptToCopy = await promptsRepository.getPromptById(copyFromId);

      if (!promptToCopy) {
        return NextResponse.json(
          { message: "Prompt to copy from not found" },
          { status: 404 },
        );
      }

      newPrompt = await promptsRepository.copyPrompt(
        copyFromId,
        promptTitle || `${promptToCopy.title} (Copy)`,
      );

      if (!newPrompt) {
        return NextResponse.json(
          { message: "Failed to copy prompt" },
          { status: 500 },
        );
      }
    } else {
      newPrompt = await promptsRepository.createPrompt({
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

    const existingPrompt = await promptsRepository.getPromptById(id);

    if (!existingPrompt) {
      return NextResponse.json(
        { message: "Prompt not found" },
        { status: 404 },
      );
    }

    const canModify = await promptsRepository.canModify(id);
    if (!canModify) {
      return NextResponse.json(
        { message: "Cannot modify the default prompt" },
        { status: 403 },
      );
    }

    const updates: Partial<Omit<Prompt, "id" | "time">> = {};

    // Accept both 'name' and 'title' for backwards compatibility
    const promptTitle = title || name;
    if (promptTitle !== undefined) {
      updates.title = promptTitle;
    }
    if (content !== undefined) {
      updates.content = content;
    }

    const updatedPrompt = await promptsRepository.updatePrompt(id, updates);

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

    const existingPrompt = await promptsRepository.getPromptById(id);

    if (existingPrompt) {
      const canDelete = await promptsRepository.canDelete(id);
      if (!canDelete) {
        return NextResponse.json(
          { message: "Cannot delete the default prompt" },
          { status: 403 },
        );
      }
    }

    await promptsRepository.deletePrompt(id);

    return NextResponse.json({ message: "Prompt deleted successfully" });
  } catch (error) {
    console.error("Failed to delete prompt:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
