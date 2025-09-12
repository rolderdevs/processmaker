import { BaseRepository } from "./base";

export interface Prompt {
  id: string;
  title: string;
  content: string;
  time: {
    created: string;
    updated: string;
  };
  isDefault?: boolean;
  [key: string]: unknown;
}

export class PromptsRepository extends BaseRepository<Prompt> {
  constructor() {
    super("prompt");
  }

  /**
   * Get all prompts
   */
  async getPrompts(): Promise<Prompt[]> {
    return this.findAll();
  }

  /**
   * Create new prompt
   */
  async createPrompt(promptData: Omit<Prompt, "id" | "time">): Promise<Prompt> {
    return this.create(promptData);
  }

  /**
   * Update existing prompt
   */
  async updatePrompt(
    id: string,
    updates: Partial<Omit<Prompt, "id" | "time">>,
  ): Promise<Prompt> {
    return this.update(id, updates);
  }

  /**
   * Delete prompt
   */
  async deletePrompt(id: string): Promise<void> {
    return this.delete(id);
  }

  /**
   * Get prompt by ID
   */
  async getPromptById(id: string): Promise<Prompt | null> {
    return this.findById(id);
  }

  /**
   * Check if prompt is default
   */
  async isDefaultPrompt(id: string): Promise<boolean> {
    const prompt = await this.findById(id);
    return prompt?.isDefault === true;
  }

  /**
   * Get default prompt
   */
  async getDefaultPrompt(): Promise<Prompt | null> {
    try {
      const prompts = await this.findAll();
      return prompts.find((prompt) => prompt.isDefault === true) || null;
    } catch (error) {
      console.error("Failed to get default prompt:", error);
      return null;
    }
  }

  /**
   * Create prompt copy
   */
  async copyPrompt(sourceId: string, title?: string): Promise<Prompt | null> {
    const sourcePrompt = await this.findById(sourceId);

    if (!sourcePrompt) {
      return null;
    }

    const copyTitle = title || `${sourcePrompt.title} (Copy)`;

    return this.create({
      title: copyTitle,
      content: sourcePrompt.content,
      isDefault: false,
    });
  }

  /**
   * Check if prompt can be modified (not default)
   */
  async canModify(id: string): Promise<boolean> {
    const isDefault = await this.isDefaultPrompt(id);
    return !isDefault;
  }

  /**
   * Check if prompt can be deleted (not default)
   */
  async canDelete(id: string): Promise<boolean> {
    return this.canModify(id);
  }
}

// Export singleton instance
export const promptsRepository = new PromptsRepository();
