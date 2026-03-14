"use client";

import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CaptionItem } from "@/lib/api";

export interface CaptionEditorFooterProps {
  captions: CaptionItem[];
  dirtyLangs: Set<string>;
  sendingAll: boolean;
  onSendAll: () => void;
}

export function CaptionEditorFooter({
  captions,
  dirtyLangs,
  sendingAll,
  onSendAll,
}: CaptionEditorFooterProps) {
  const hasDirtyToSend =
    captions.filter((c) => c.text?.trim() && dirtyLangs.has(c.lang)).length > 0;

  return (
    <div className="flex justify-end border-t pt-4">
      <Button
        variant="default"
        size="sm"
        onClick={onSendAll}
        disabled={sendingAll || !hasDirtyToSend}
      >
        {sendingAll ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        Send all
      </Button>
    </div>
  );
}
