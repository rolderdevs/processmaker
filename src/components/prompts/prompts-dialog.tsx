"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  }) => void;
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
  }, [promptToEdit, promptToCopy]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title,
      content,
      copyFromId: promptToCopy?.id,
    });
  };

  const getTitle = () => {
    if (promptToEdit) return "Редактировать промпт";
    if (promptToCopy) return "Дублировать промпт";
    return "Создать новый промпт";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            {promptToEdit
              ? "Отредактируйте существующий промпт."
              : "Создайте новый промпт."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Название
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="content" className="text-right pt-2">
              Содержание
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="col-span-3 min-h-[300px]"
              placeholder="Введите содержание промпта здесь..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSave}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
