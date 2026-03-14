"use client";

import { Copy, Download, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CaptionItem } from "@/lib/api";
import { getSourceCaption } from "@/hooks/useCaptionEditor";

export interface CaptionEditorToolbarProps {
  emptyNonCommonsLangs: string[];
  captions: CaptionItem[];
  generatingAll: boolean;
  onGenerateAll: () => void;
  onCopyAll: () => void;
  onExportJson: () => void;
  error: string | null;
}

export function CaptionEditorToolbar({
  emptyNonCommonsLangs,
  captions,
  generatingAll,
  onGenerateAll,
  onCopyAll,
  onExportJson,
  error,
}: CaptionEditorToolbarProps) {
  const sourceCaption = getSourceCaption(captions);

  return (
    <>
      <div className="flex flex-wrap gap-2 items-center">
        {emptyNonCommonsLangs.length > 0 && (
          <Button
            variant="default"
            onClick={onGenerateAll}
            disabled={generatingAll || emptyNonCommonsLangs.length === 0 || !sourceCaption}
          >
            {generatingAll ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generate all
          </Button>
        )}
        {captions.length > 0 && (
          <>
            <Button variant="outline" size="sm" onClick={onCopyAll}>
              <Copy className="mr-2 h-4 w-4" />
              Copy all
            </Button>
            <Button variant="outline" size="sm" onClick={onExportJson}>
              <Download className="mr-2 h-4 w-4" />
              Export JSON
            </Button>
          </>
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
