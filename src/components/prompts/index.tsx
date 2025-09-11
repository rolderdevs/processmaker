"use client";

import {
  CopyIcon,
  MoreVertical,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import * as React from "react";

import type { Prompt } from "@/app/api/prompts/types";
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
import { PromptsDialog } from "./prompts-dialog";

interface PromptsManagerProps {
  prompts: Prompt[];
  selectedPromptId: string | undefined;
  onSelectPrompt: (promptId: string) => void;
  onAddPrompt: (
    values:
      | { name: string; content: string }
      | { name: string; copyFromId: string },
  ) => Promise<void>;
  onUpdatePrompt: (
    promptId: string,
    values: { name: string; content: string },
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

  const selectedPrompt = React.useMemo(
    () => prompts.find((p) => p.id === selectedPromptId),
    [prompts, selectedPromptId],
  );

  const handleCreateNew = () => {
    setPromptToEdit(undefined);
    setPromptToCopy(undefined);
    setDialogOpen(true);
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
    await onDeletePrompt(selectedPrompt.id);
    setDeleteDialogOpen(false);
  };

  const handleSave = async (values: {
    name: string;
    content: string;
    copyFromId?: string;
  }) => {
    if (promptToEdit) {
      await onUpdatePrompt(promptToEdit.id, {
        name: values.name,
        content: values.content,
      });
    } else if (values.copyFromId) {
      await onAddPrompt({ name: values.name, copyFromId: values.copyFromId });
    } else {
      await onAddPrompt({ name: values.name, content: values.content });
    }

    setDialogOpen(false);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select onValueChange={onSelectPrompt} value={selectedPromptId}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Выберите промпт..." />
        </SelectTrigger>
        <SelectContent>
          {prompts.map((prompt) => (
            <SelectItem key={prompt.id} value={prompt.id}>
              {prompt.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="outline" size="icon" onClick={handleCreateNew}>
        <PlusIcon className="h-4 w-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={!selectedPrompt}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={handleEdit}
            disabled={!selectedPrompt || selectedPrompt.isDefault}
          >
            <PencilIcon className="mr-2 h-4 w-4" />
            Редактировать
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopy} disabled={!selectedPrompt}>
            <CopyIcon className="mr-2 h-4 w-4" />
            Дублировать
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            disabled={!selectedPrompt || selectedPrompt.isDefault}
            className="text-red-500 focus:text-red-500"
          >
            <Trash2Icon className="mr-2 h-4 w-4" />
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PromptsDialog
        key={`${promptToEdit?.id ?? ""}-${promptToCopy?.id ?? ""}`}
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        promptToEdit={promptToEdit}
        promptToCopy={promptToCopy}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы действительно хотите удалить промпт "{selectedPrompt?.name}"?
              Это действие нельзя будет отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
