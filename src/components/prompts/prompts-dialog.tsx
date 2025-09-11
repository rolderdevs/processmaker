"use client";

import * as React from "react";

import type { Prompt } from "@/app/api/prompts/types";
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

interface PromptsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: {
    name: string;
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
  const [name, setName] = React.useState("");
  const [content, setContent] = React.useState("");

  React.useEffect(() => {
    if (promptToEdit) {
      setName(promptToEdit.name);
      setContent(promptToEdit.content);
    } else if (promptToCopy) {
      setName(`${promptToCopy.name} (Copy)`);
      setContent(promptToCopy.content);
    } else {
      setName("");
      setContent("");
    }
  }, [promptToEdit, promptToCopy]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name,
      content,
      copyFromId: promptToCopy?.id,
    });
  };

  const getTitle = () => {
    if (promptToEdit) return "Edit Prompt";
    if (promptToCopy) return "Duplicate Prompt";
    return "Create New Prompt";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            {promptToEdit
              ? "Edit your existing prompt."
              : "Create a new prompt to use with the AI."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="content" className="text-right pt-2">
              Content
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="col-span-3 min-h-[300px]"
              placeholder="Enter your prompt content here..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
