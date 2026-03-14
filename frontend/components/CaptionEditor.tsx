"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  translateCaptions,
  validateCaption,
  saveCaptionsToCommons,
  getAllMediaWikiLanguages,
  type CaptionItem,
} from "@/lib/api";
import { Loader2, Copy, Download, Send, Sparkles, Check } from "lucide-react";

interface CaptionEditorProps {
  captions: CaptionItem[];
  onCaptionsChange: (captions: CaptionItem[]) => void;
  languages: string[];
  languagesFromCommons: Set<string>;
  fileIdentifier: string;
  /** Optional longer description (e.g. Commons Summary) to improve translation accuracy. */
  descriptionContext?: string;
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
  descriptionContext,
}: CaptionEditorProps) {
  const [generatingLang, setGeneratingLang] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [sendingLang, setSendingLang] = useState<string | null>(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sentLangs, setSentLangs] = useState<Set<string>>(new Set());
  const [dirtyLangs, setDirtyLangs] = useState<Set<string>>(new Set());
  const [languageNames, setLanguageNames] = useState<Record<string, string>>({});
  const [languageNamesEn, setLanguageNamesEn] = useState<Record<string, string>>({});

  useEffect(() => {
    getAllMediaWikiLanguages().then((list) => {
      const nameMap: Record<string, string> = {};
      const nameEnMap: Record<string, string> = {};
      for (const { code, name, nameEn } of list) {
        nameMap[code] = name;
        if (nameEn) nameEnMap[code] = nameEn;
      }
      setLanguageNames(nameMap);
      setLanguageNamesEn(nameEnMap);
    });
  }, []);

  /** Language name from MW API (native name), fallback to code. */
  const displayName = (code: string) =>
    languageNames[code] || code;

  /** English name from MW API (languageinfo uselang=en). */
  const englishName = (code: string) => languageNamesEn[code];

  /** Label: Name (English - code) or Name (code) when no English from API. */
  const labelText = (code: string) => {
    const name = displayName(code);
    const en = englishName(code);
    return en ? `${name} (${en} - ${code})` : `${name} (${code})`;
  };

  /** Placeholder: Caption in Name (English - code). */
  const placeholderText = (code: string) =>
    `Caption in ${labelText(code)}`;

  const displayLangs = [
    ...new Set([...languages, ...captions.map((c) => c.lang)]),
  ];

  /** Always show Generate so the user can overwrite or translate into this language. */
  const showGenerateForLang = (_lang: string): boolean => true;

  /** Languages that have no text and are not from Commons — targets for "Generate all". */
  const emptyNonCommonsLangs = displayLangs.filter(
    (lang) =>
      !languagesFromCommons.has(lang) &&
      !captions.find((c) => c.lang === lang)?.text?.trim(),
  );

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
        const translated = await translateCaptions(
          [source],
          [lang],
          descriptionContext,
        );
        const next = translated.filter((t) => t.lang === lang);
        if (next.length === 0) return;
        const existing = captions.filter((c) => c.lang !== lang);
        onCaptionsChange([...existing, ...next]);
        setDirtyLangs((prev) => new Set(prev).add(lang));
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
        descriptionContext,
      );
      const byLang = new Map(translated.map((t) => [t.lang, t]));
      const existing = captions.filter(
        (c) => !emptyNonCommonsLangs.includes(c.lang),
      );
      onCaptionsChange([...existing, ...Array.from(byLang.values())]);
      setDirtyLangs((prev) => {
        const next = new Set(prev);
        emptyNonCommonsLangs.forEach((l) => next.add(l));
        return next;
      });
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
    if (sentLangs.has(lang)) {
      setSentLangs((prev) => {
        const nextSet = new Set(prev);
        nextSet.delete(lang);
        return nextSet;
      });
    }
    setDirtyLangs((prev) => new Set(prev).add(lang));
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
      setSentLangs((prev) => new Set(prev).add(lang));
      setDirtyLangs((prev) => {
        const next = new Set(prev);
        next.delete(lang);
        return next;
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
      setSentLangs((prev) => {
        const next = new Set(prev);
        toSend.forEach((c) => next.add(c.lang));
        return next;
      });
      setDirtyLangs((prev) => {
        const next = new Set(prev);
        toSend.forEach((c) => next.delete(c.lang));
        return next;
      });
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
            disabled={
              generatingAll ||
              emptyNonCommonsLangs.length === 0 ||
              !getSourceCaption(captions)
            }
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
          const showGenerate = showGenerateForLang(lang);
          const isSent = sentLangs.has(lang);
          const isDirty = dirtyLangs.has(lang);
          return (
            <div
              key={lang}
              className={`space-y-2 ${isSent ? "rounded-md border border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-950/20 p-3" : ""}`}
            >
              <Label htmlFor={`caption-${lang}`}>
                {labelText(lang)}
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
                  onChange={(e) => updateCaption(lang, e.target.value)}
                  placeholder={placeholderText(lang)}
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
                  disabled={
                    !value.trim() ||
                    !isDirty ||
                    sendingLang !== null ||
                    sendingAll
                  }
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
      {captions.length > 0 && (
        <div className="flex justify-end border-t pt-4">
          <Button
            variant="default"
            size="sm"
            onClick={sendAll}
            disabled={
              sendingAll ||
              captions.filter(
                (c) => c.text?.trim() && dirtyLangs.has(c.lang),
              ).length === 0
            }
          >
            {sendingAll ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send all
          </Button>
        </div>
      )}
    </div>
  );
}
