"use client";

import { Check, Loader2, Send, Sparkles, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CAPTION_MAX_LENGTH = 250;

export interface CaptionRowProps {
  lang: string;
  value: string;
  labelText: string;
  placeholderText: string;
  fromCommons: boolean;
  isSent: boolean;
  isDirty: boolean;
  fieldError?: string;
  baselineValue: string;
  generatingLang: string | null;
  generatingAll: boolean;
  sendingLang: string | null;
  sendingAll: boolean;
  onValueChange: (text: string) => void;
  onGenerate: () => void;
  onRevert: () => void;
  onSend: () => void;
}

export function CaptionRow({
  lang,
  value,
  labelText,
  placeholderText,
  fromCommons,
  isSent,
  isDirty,
  fieldError,
  baselineValue,
  generatingLang,
  generatingAll,
  sendingLang,
  sendingAll,
  onValueChange,
  onGenerate,
  onRevert,
  onSend,
}: CaptionRowProps) {
  const canRevert = value !== (baselineValue ?? "");
  const canSend =
    value.trim() && isDirty && sendingLang === null && !sendingAll;

  return (
    <div
      className={`space-y-2 ${
        isSent
          ? "rounded-md border border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-950/20 p-3"
          : ""
      }`}
    >
      <Label htmlFor={`caption-${lang}`}>
        {labelText}
        {fromCommons && (
          <span className="ml-2 text-muted-foreground font-normal text-xs">
            (from Commons)
          </span>
        )}
        {isSent && (
          <span className="ml-2 inline-flex items-center gap-1 rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/50 dark:text-green-200">
            <Check className="h-3 w-3" />
            Sent
          </span>
        )}
      </Label>
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          id={`caption-${lang}`}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholderText}
          maxLength={CAPTION_MAX_LENGTH}
          className={`flex-1 min-w-[200px] ${
            fieldError
              ? "border-destructive focus-visible:ring-destructive"
              : ""
          }`}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={generatingLang !== null || generatingAll}
          onClick={onGenerate}
        >
          {generatingLang === lang ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generate
        </Button>
        {canRevert && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={sendingLang !== null || sendingAll}
            onClick={onRevert}
            title="Revert to last saved or loaded value"
          >
            <Undo2 className="h-4 w-4" />
            Revert
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canSend}
          onClick={onSend}
        >
          {sendingLang === lang ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Send
        </Button>
      </div>
      <p
        className={`text-xs ${
          value.length >= CAPTION_MAX_LENGTH
            ? "text-amber-600 dark:text-amber-500"
            : "text-muted-foreground"
        }`}
        aria-live="polite"
      >
        {value.length} / {CAPTION_MAX_LENGTH}
        {value.length >= CAPTION_MAX_LENGTH && " (at limit)"}
      </p>
      {fieldError && (
        <p className="text-sm text-destructive" role="alert">
          {fieldError}
        </p>
      )}
    </div>
  );
}
