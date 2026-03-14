"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  captionPreview,
  translateCaptions,
  validateCaption,
  type CaptionItem,
} from "@/lib/api";
import { Loader2, Copy, Download } from "lucide-react";

interface CaptionEditorProps {
  captions: CaptionItem[];
  onCaptionsChange: (captions: CaptionItem[]) => void;
  languages: string[];
  imageFile: File | null;
  imageUrl?: string;
  loading: boolean;
  onLoadingChange: (v: boolean) => void;
  error: string | null;
  onErrorChange: (v: string | null) => void;
}

export function CaptionEditor({
  captions,
  onCaptionsChange,
  languages,
  imageFile,
  imageUrl,
  loading,
  onLoadingChange,
  error,
  onErrorChange,
}: CaptionEditorProps) {
  const [validating, setValidating] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!imageFile && !imageUrl) {
      onErrorChange("Upload an image or enter a Commons URL first.");
      return;
    }
    onErrorChange(null);
    onLoadingChange(true);
    try {
      const result = await captionPreview(
        imageFile ?? undefined,
        imageUrl,
        "en"
      );
      const initial: CaptionItem[] = [{ lang: "en", text: result.caption }];
      const targetLangs = languages.filter((l) => l !== "en");
      if (targetLangs.length > 0) {
        const translated = await translateCaptions(initial, targetLangs);
        const combined = [
          ...initial,
          ...translated.filter((t) => t.lang !== "en"),
        ];
        onCaptionsChange(combined);
      } else {
        onCaptionsChange(initial);
      }
    } catch (e) {
      onErrorChange(e instanceof Error ? e.message : "Generation failed");
    } finally {
      onLoadingChange(false);
    }
  }, [imageFile, imageUrl, languages, onCaptionsChange, onErrorChange, onLoadingChange]);

  function updateCaption(lang: string, text: string) {
    const next = captions.some((c) => c.lang === lang)
      ? captions.map((c) => (c.lang === lang ? { ...c, text } : c))
      : [...captions, { lang, text }];
    onCaptionsChange(next);
  }

  async function validateOne(text: string, lang: string) {
    setValidating(lang);
    try {
      const result = await validateCaption(text, lang);
      if (result.warnings.length > 0) {
        alert(`Warnings:\n${result.warnings.join("\n")}`);
      } else {
        alert("Caption looks good.");
      }
    } finally {
      setValidating(null);
    }
  }

  function copyAll() {
    const text = captions
      .map((c) => `[${c.lang}]\n${c.text}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(captions, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "captions.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const displayLangs = [...new Set([...languages, ...captions.map((c) => c.lang)])];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={generate} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Generate captions
        </Button>
        {captions.length > 0 && (
          <>
            <Button variant="outline" size="sm" onClick={copyAll}>
              <Copy className="mr-2 h-4 w-4" />
              Copy all
            </Button>
            <Button variant="outline" size="sm" onClick={exportJson}>
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
      <div className="space-y-4">
        {displayLangs.map((lang) => {
          const cap = captions.find((c) => c.lang === lang);
          const value = cap?.text ?? "";
          return (
            <div key={lang} className="space-y-2">
              <Label htmlFor={`caption-${lang}`}>
                {lang.toUpperCase()}
              </Label>
              <div className="flex gap-2">
                <Input
                  id={`caption-${lang}`}
                  value={value}
                  onChange={(e) => updateCaption(lang, e.target.value)}
                  placeholder={`Caption in ${lang}`}
                  maxLength={150}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!value || validating === lang}
                  onClick={() => validateOne(value, lang)}
                >
                  {validating === lang ? "Checking..." : "Validate"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
