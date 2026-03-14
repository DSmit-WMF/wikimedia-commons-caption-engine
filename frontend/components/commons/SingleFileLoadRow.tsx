"use client";

import { FolderOpen, Loader2, Shuffle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CommonsUrlInput } from "@/components/ImageUpload";

export interface SingleFileLoadRowProps {
  commonsUrl: string;
  onCommonsUrlChange: (url: string) => void;
  onLoad: () => void;
  onRandom: () => void;
  loadLoading: boolean;
  loadingSource: "load" | "random" | null;
}

export function SingleFileLoadRow({
  commonsUrl,
  onCommonsUrlChange,
  onLoad,
  onRandom,
  loadLoading,
  loadingSource,
}: SingleFileLoadRowProps) {
  return (
    <>
      <CommonsUrlInput
        commonsUrl={commonsUrl}
        onCommonsUrlChange={onCommonsUrlChange}
        disabled={loadLoading}
      />
      <div className="flex flex-wrap gap-2">
        <Button onClick={onLoad} disabled={loadLoading}>
          {loadLoading && loadingSource === "load" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FolderOpen className="mr-2 h-4 w-4" />
          )}
          Load
        </Button>
        <Button type="button" variant="outline" onClick={onRandom} disabled={loadLoading}>
          {loadLoading && loadingSource === "random" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Shuffle className="mr-2 h-4 w-4" />
          )}
          Random image
        </Button>
      </div>
    </>
  );
}
