"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  translateCaptions,
  validateCaption,
  saveCaptionsToCommons,
  type CaptionItem,
} from "@/lib/api";
import { Loader2, Copy, Download, Send, Sparkles } from "lucide-react";

interface CaptionEditorProps {
  captions: CaptionItem[];
  onCaptionsChange: (captions: CaptionItem[]) => void;
  languages: string[];
  languagesFromCommons: Set<string>;
  fileIdentifier: string;
}

function getSourceCaption(captions: CaptionItem[]): CaptionItem | undefined {
  const withText = captions.filter((c) => c.text.trim());
  return withText.find((c) => c.lang === "en") ?? withText[0];
}

export function CaptionEditor({
  captions,
  onCaptionsChange,
  languages,
  languagesFromCommons,
  fileIdentifier,
}: CaptionEditorProps) {
  const [generatingLang, setGeneratingLang] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [sendingLang, setSendingLang] = useState<string | null>(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const displayLangs = [
    ...new Set([...languages, ...captions.map((c) => c.lang)]),
  ];

  const canGenerate = (lang: string): boolean => {
    if (languagesFromCommons.has(lang)) return false;
    const cap = captions.find((c) => c.lang === lang);
    return !cap?.text?.trim();
  };

  const emptyNonCommonsLangs = displayLangs.filter((lang) => canGenerate(lang));

  const generateOne = useCallback(
    async (lang: string) => {
      const source = getSourceCaption(captions);
      if (!source) {
        setError("No source caption to translate from.");
        return;
      }
      setError(null);
      setGeneratingLang(lang);
      try {
        const translated = await translateCaptions([source], [lang]);
        const next = translated.filter((t) => t.lang === lang);
        if (next.length === 0) return;
        const existing = captions.filter((c) => c.lang !== lang);
        onCaptionsChange([...existing, ...next]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Translation failed");
      } finally {
        setGeneratingLang(null);
      }
    },
    [captions, onCaptionsChange],
  );

  const generateAll = useCallback(async () => {
    if (emptyNonCommonsLangs.length === 0) return;
    const source = getSourceCaption(captions);
    if (!source) {
      setError("No source caption to translate from.");
      return;
    }
    setError(null);
    setGeneratingAll(true);
    try {
      const translated = await translateCaptions(
        [source],
        emptyNonCommonsLangs,
      );
      const byLang = new Map(translated.map((t) => [t.lang, t]));
      const existing = captions.filter(
        (c) => !emptyNonCommonsLangs.includes(c.lang),
      );
      onCaptionsChange([...existing, ...Array.from(byLang.values())]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Translation failed");
    } finally {
      setGeneratingAll(false);
    }
  }, [captions, emptyNonCommonsLangs, onCaptionsChange]);

  function updateCaption(lang: string, text: string) {
    const next = captions.some((c) => c.lang === lang)
      ? captions.map((c) => (c.lang === lang ? { ...c, text } : c))
      : [...captions, { lang, text }];
    onCaptionsChange(next);
    if (fieldErrors[lang]) {
      setFieldErrors((prev) => {
        const nextErr = { ...prev };
        delete nextErr[lang];
        return nextErr;
      });
    }
  }

  async function sendOne(lang: string) {
    const cap = captions.find((c) => c.lang === lang);
    if (!cap?.text?.trim()) return;
    setError(null);
    setSendingLang(lang);
    try {
      const result = await validateCaption(cap.text, lang);
      if (!result.valid && result.warnings.length > 0) {
        setFieldErrors((prev) => ({
          ...prev,
          [lang]: result.warnings.join(" "),
        }));
        return;
      }
      await saveCaptionsToCommons(fileIdentifier, [cap]);
      setFieldErrors((prev) => {
        const nextErr = { ...prev };
        delete nextErr[lang];
        return nextErr;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save to Commons failed");
    } finally {
      setSendingLang(null);
    }
  }

  async function sendAll() {
    const toSend = captions.filter((c) => c.text?.trim());
    if (toSend.length === 0) return;
    setError(null);
    setFieldErrors({});
    setSendingAll(true);
    try {
      const errors: Record<string, string> = {};
      for (const cap of toSend) {
        const result = await validateCaption(cap.text, cap.lang);
        if (!result.valid && result.warnings.length > 0) {
          errors[cap.lang] = result.warnings.join(" ");
        }
      }
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
      await saveCaptionsToCommons(fileIdentifier, toSend);
      setFieldErrors({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save to Commons failed");
    } finally {
      setSendingAll(false);
    }
  }

  function copyAll() {
    const text = captions.map((c) => `[${c.lang}]\n${c.text}`).join("\n\n");
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        {emptyNonCommonsLangs.length > 0 && (
          <Button
            variant="default"
            onClick={generateAll}
            disabled={generatingAll || !getSourceCaption(captions)}
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
            <Button variant="outline" size="sm" onClick={copyAll}>
              <Copy className="mr-2 h-4 w-4" />
              Copy all
            </Button>
            <Button variant="outline" size="sm" onClick={exportJson}>
              <Download className="mr-2 h-4 w-4" />
              Export JSON
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={sendAll}
              disabled={
                sendingAll ||
                captions.filter((c) => c.text?.trim()).length === 0
              }
            >
              {sendingAll ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send all
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
          const fromCommons = languagesFromCommons.has(lang);
          const showGenerate = canGenerate(lang);
          return (
            <div key={lang} className="space-y-2">
              <Label htmlFor={`caption-${lang}`}>
                {lang.toUpperCase()}
                {fromCommons && (
                  <span className="ml-2 text-muted-foreground font-normal text-xs">
                    (from Commons — edit only)
                  </span>
                )}
              </Label>
              <div className="flex flex-wrap gap-2 items-center">
                <Input
                  id={`caption-${lang}`}
                  value={value}
                  onChange={(e) => updateCaption(lang, e.target.value)}
                  placeholder={`Caption in ${lang}`}
                  maxLength={500}
                  className={`flex-1 min-w-[200px] ${fieldErrors[lang] ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {showGenerate && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={generatingLang !== null || generatingAll}
                    onClick={() => generateOne(lang)}
                  >
                    {generatingLang === lang ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Generate
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!value.trim() || sendingLang !== null || sendingAll}
                  onClick={() => sendOne(lang)}
                >
                  {sendingLang === lang ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send
                </Button>
              </div>
              {fieldErrors[lang] && (
                <p className="text-sm text-destructive" role="alert">
                  {fieldErrors[lang]}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
