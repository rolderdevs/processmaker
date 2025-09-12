import { CopyIcon, ListTree } from "lucide-react";
import remarkGfm from "remark-gfm";
import {
  Artifact,
  ArtifactAction,
  ArtifactActions,
  ArtifactContent,
  ArtifactHeader,
  ArtifactTitle,
} from "@/components/ai-elements/artifact";
import { Response } from "@/components/ai-elements/response";
import { DiffView } from "@/components/diffview";
import { useDocument } from "@/contexts";

export function DocumentArtifact() {
  const {
    document,
    diffVisible,
    prevDocumentContent,
    toggleDiff,
    copyToClipboard,
  } = useDocument();

  return (
    <Artifact className="w-full">
      <ArtifactHeader className="h-10">
        <ArtifactTitle className="text-xl text-muted-foreground">
          {document.title}
        </ArtifactTitle>

        <ArtifactActions className="ml-auto">
          <ArtifactAction
            icon={CopyIcon}
            label="Скопировать"
            tooltip="Скопировать в буфер обмена"
            onClick={copyToClipboard}
          />
          <ArtifactAction
            icon={ListTree}
            label="Показать изменения"
            tooltip="Показать изменения"
            onClick={toggleDiff}
          />
        </ArtifactActions>
      </ArtifactHeader>
      <ArtifactContent>
        {!diffVisible ? (
          <Response remarkPlugins={[[remarkGfm, { singleTilde: false }]]}>
            {document.content}
          </Response>
        ) : (
          <DiffView
            oldContent={prevDocumentContent}
            newContent={document.content}
          />
        )}
      </ArtifactContent>
    </Artifact>
  );
}
