"use client";

import { Loader2Icon } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Prompt } from "@/lib/db";

interface PromptsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: {
    title: string;
    content: string;
    copyFromId?: string;
  }) => Promise<void>;
  promptToEdit?: Prompt;
  promptToCopy?: Prompt;
}

export function PromptsDialog({
  isOpen,
  onClose,
  onSave,
  promptToEdit,
  promptToCopy,
}: PromptsDialogProps) {
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [titleError, setTitleError] = React.useState(false);
  const [contentError, setContentError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (promptToEdit) {
      setTitle(promptToEdit.title);
      setContent(promptToEdit.content);
    } else if (promptToCopy) {
      setTitle(`${promptToCopy.title} (Копия)`);
      setContent(promptToCopy.content);
    } else {
      setTitle("");
      setContent("");
    }
    setTitleError(false);
    setContentError(false);
    setIsLoading(false);
  }, [promptToEdit, promptToCopy]);

  const validateForm = () => {
    let isValid = true;

    if (!title.trim()) {
      setTitleError(true);
      isValid = false;
    } else {
      setTitleError(false);
    }

    if (!promptToCopy && !content.trim()) {
      setContentError(true);
      isValid = false;
    } else {
      setContentError(false);
    }

    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSave({
        title,
        content,
        copyFromId: promptToCopy?.id,
      });
    } catch (error) {
      console.error("Error saving prompt:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    if (promptToEdit) return "Редактировать промпт";
    if (promptToCopy) return "Дублировать промпт";
    return "Создать новый промпт";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Название
            </Label>
            <div className="col-span-3">
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={titleError ? "border-red-500" : ""}
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="content" className="text-right pt-2">
              Содержание
            </Label>
            <div className="col-span-3">
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={`min-h-96 ${contentError ? "border-red-500" : ""}`}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2Icon className="animate-spin" />
                Сохранение...
              </>
            ) : (
              "Сохранить"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
