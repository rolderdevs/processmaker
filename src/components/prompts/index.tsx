"use client";

import {
  CopyIcon,
  Loader2Icon,
  MoreVertical,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Prompt } from "@/lib/db";
import { PromptsDialog } from "./prompts-dialog";

interface PromptsManagerProps {
  prompts: Prompt[];
  selectedPromptId: string;
  onSelectPrompt: (promptId: string) => void;
  onAddPrompt: (
    values:
      | { title: string; content: string }
      | { title: string; copyFromId: string },
  ) => Promise<string>;
  onUpdatePrompt: (
    promptId: string,
    values: { title: string; content: string },
  ) => Promise<void>;
  onDeletePrompt: (promptId: string) => Promise<void>;
  className?: string;
}

export function PromptsManager({
  prompts,
  selectedPromptId,
  onSelectPrompt,
  onAddPrompt,
  onUpdatePrompt,
  onDeletePrompt,
  className,
}: PromptsManagerProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [promptToEdit, setPromptToEdit] = React.useState<Prompt | undefined>();
  const [promptToCopy, setPromptToCopy] = React.useState<Prompt | undefined>();
  const [isLoading, setIsLoading] = React.useState(false);

  const selectedPrompt = React.useMemo(
    () =>
      selectedPromptId
        ? prompts.find((p) => p.id === selectedPromptId)
        : undefined,
    [prompts, selectedPromptId],
  );

  const handleCreateNew = () => {
    setPromptToEdit(undefined);
    setPromptToCopy(undefined);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setPromptToEdit(undefined);
    setPromptToCopy(undefined);
  };

  const handleEdit = () => {
    if (!selectedPrompt || selectedPrompt.isDefault) return;
    setPromptToEdit(selectedPrompt);
    setPromptToCopy(undefined);
    setDialogOpen(true);
  };

  const handleCopy = () => {
    if (!selectedPrompt) return;
    setPromptToEdit(undefined);
    setPromptToCopy(selectedPrompt);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPrompt || selectedPrompt.isDefault) return;
    setIsLoading(true);
    try {
      await onDeletePrompt(selectedPrompt.id);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting prompt:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (values: {
    title: string;
    content: string;
    copyFromId?: string;
  }) => {
    setIsLoading(true);
    try {
      if (promptToEdit) {
        await onUpdatePrompt(promptToEdit.id, {
          title: values.title,
          content: values.content,
        });
      } else if (values.copyFromId) {
        const newPromptId = await onAddPrompt({
          title: values.title,
          copyFromId: values.copyFromId,
        });
        onSelectPrompt(newPromptId);
      } else {
        const newPromptId = await onAddPrompt({
          title: values.title,
          content: values.content,
        });
        onSelectPrompt(newPromptId);
      }

      setDialogOpen(false);
      setPromptToEdit(undefined);
      setPromptToCopy(undefined);
    } catch (error) {
      console.error("Error saving prompt:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select
        disabled={isLoading}
        onValueChange={onSelectPrompt}
        value={selectedPromptId || ""}
      >
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Выберите промпт..." />
        </SelectTrigger>
        <SelectContent>
          {prompts.map((prompt) => (
            <SelectItem key={prompt.id} value={prompt.id}>
              {prompt.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={handleCreateNew}
        disabled={isLoading}
      >
        {isLoading ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={!selectedPrompt || isLoading}
          >
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={handleEdit}
            disabled={!selectedPrompt || selectedPrompt.isDefault || isLoading}
          >
            <PencilIcon />
            Редактировать
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleCopy}
            disabled={!selectedPrompt || isLoading}
          >
            <CopyIcon />
            Дублировать
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            disabled={!selectedPrompt || selectedPrompt.isDefault || isLoading}
            className="text-red-500 focus:text-red-500"
          >
            <Trash2Icon />
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PromptsDialog
        key={`${promptToEdit?.id ?? ""}-${promptToCopy?.id ?? ""}`}
        isOpen={dialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSave}
        promptToEdit={promptToEdit}
        promptToCopy={promptToCopy}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы действительно хотите удалить промпт "{selectedPrompt?.title}"?
              Это действие нельзя будет отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600"
            >
              {isLoading ? (
                <>
                  <Loader2Icon className="animate-spin" />
                  Удаление...
                </>
              ) : (
                "Удалить"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
