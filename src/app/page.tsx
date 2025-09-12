"use client";

import { ChatConversation, ChatInput } from "@/components/chat";
import { DocumentArtifact } from "@/components/document";
import { PromptsManager } from "@/components/prompts";
import { ChatProvider, DocumentProvider, PromptsProvider } from "@/contexts";

export default function Chat() {
  return (
    <PromptsProvider>
      <DocumentProvider>
        <ChatProvider>
          <div className="p-6 size-full h-screen flex gap-10">
            <div className="h-full w-xl flex flex-col">
              <ChatConversation />
              <ChatInput />
              <PromptsManager className="mt-4" />
            </div>
            <DocumentArtifact />
          </div>
        </ChatProvider>
      </DocumentProvider>
    </PromptsProvider>
  );
}
