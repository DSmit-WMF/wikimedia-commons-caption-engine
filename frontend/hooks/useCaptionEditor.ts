"use client";

import { useState, useCallback, useEffect } from "react";
import {
  translateCaptions,
  validateCaption,
  saveCaptionsToCommons,
  type CaptionItem,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useFavouriteLanguages } from "@/lib/favourite-languages";
import { useLanguageNames } from "./useLanguageNames";

export function getSourceCaption(captions: CaptionItem[]): CaptionItem | undefined {
  const withText = captions.filter((c) => c.text.trim());
  return withText.find((c) => c.lang === "en") ?? withText[0];
}

export interface UseCaptionEditorProps {
  captions: CaptionItem[];
  onCaptionsChange: (captions: CaptionItem[]) => void;
  languages: string[];
  languagesFromCommons: Set<string>;
  fileIdentifier: string;
  descriptionContext?: string;
}

export function useCaptionEditor({
  captions,
  onCaptionsChange,
  languages,
  languagesFromCommons,
  fileIdentifier,
  descriptionContext,
}: UseCaptionEditorProps) {
  const { accessToken } = useAuth();
  const { favourites } = useFavouriteLanguages();
  const { getLabelText, getPlaceholderText } = useLanguageNames();

  const [generatingLang, setGeneratingLang] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [sendingLang, setSendingLang] = useState<string | null>(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sentLangs, setSentLangs] = useState<Set<string>>(new Set());
  const [dirtyLangs, setDirtyLangs] = useState<Set<string>>(new Set());
  const [baselineValues, setBaselineValues] = useState<Record<string, string>>({});

  const displayLangs = [...new Set([...languages, ...favourites, ...captions.map((c) => c.lang)])];

  const emptyNonCommonsLangs = displayLangs.filter(
    (lang) =>
      !languagesFromCommons.has(lang) && !captions.find((c) => c.lang === lang)?.text?.trim()
  );

  useEffect(() => {
    const next: Record<string, string> = {};
    captions.forEach((c) => {
      next[c.lang] = c.text ?? "";
    });
    setBaselineValues(next);
  }, []);

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
        const translated = await translateCaptions([source], [lang], descriptionContext);
        const next = translated.filter((t) => t.lang === lang);
        if (next.length === 0) return;
        const existing = captions.filter((c) => c.lang !== lang);
        const newCaptions = [...existing, ...next];
        onCaptionsChange(newCaptions);
        setDirtyLangs((prev) => new Set(prev).add(lang));
        const newText = next[0]?.text ?? "";
        setBaselineValues((prev) => ({ ...prev, [lang]: newText }));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Translation failed");
      } finally {
        setGeneratingLang(null);
      }
    },
    [captions, onCaptionsChange, descriptionContext]
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
        descriptionContext
      );
      const byLang = new Map(translated.map((t) => [t.lang, t]));
      const existing = captions.filter((c) => !emptyNonCommonsLangs.includes(c.lang));
      onCaptionsChange([...existing, ...Array.from(byLang.values())]);
      setDirtyLangs((prev) => {
        const next = new Set(prev);
        emptyNonCommonsLangs.forEach((l) => next.add(l));
        return next;
      });
      setBaselineValues((prev) => {
        const next = { ...prev };
        byLang.forEach((item, l) => (next[l] = item.text ?? ""));
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Translation failed");
    } finally {
      setGeneratingAll(false);
    }
  }, [captions, emptyNonCommonsLangs, onCaptionsChange, descriptionContext]);

  const updateCaption = useCallback(
    (lang: string, text: string) => {
      const next = captions.some((c) => c.lang === lang)
        ? captions.map((c) => (c.lang === lang ? { ...c, text } : c))
        : [...captions, { lang, text }];
      onCaptionsChange(next);
      setFieldErrors((prev) => {
        const nextErr = { ...prev };
        delete nextErr[lang];
        return nextErr;
      });
      if (sentLangs.has(lang)) {
        setSentLangs((prev) => {
          const nextSet = new Set(prev);
          nextSet.delete(lang);
          return nextSet;
        });
      }
      setDirtyLangs((prev) => new Set(prev).add(lang));
    },
    [captions, onCaptionsChange]
  );

  const sendOne = useCallback(
    async (lang: string) => {
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
        await saveCaptionsToCommons(fileIdentifier, [cap], {
          accessToken: accessToken ?? undefined,
        });
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
        setBaselineValues((prev) => ({ ...prev, [lang]: cap.text }));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save to Commons failed");
      } finally {
        setSendingLang(null);
      }
    },
    [captions, fileIdentifier, accessToken]
  );

  const sendAll = useCallback(async () => {
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
      await saveCaptionsToCommons(fileIdentifier, toSend, {
        accessToken: accessToken ?? undefined,
      });
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
      setBaselineValues((prev) => {
        const next = { ...prev };
        toSend.forEach((c) => (next[c.lang] = c.text ?? ""));
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save to Commons failed");
    } finally {
      setSendingAll(false);
    }
  }, [captions, fileIdentifier, accessToken]);

  const revertToBaseline = useCallback(
    (lang: string) => {
      const baseline = baselineValues[lang] ?? "";
      const existing = captions.filter((c) => c.lang !== lang);
      onCaptionsChange([...existing, { lang, text: baseline }]);
      setDirtyLangs((prev) => {
        const next = new Set(prev);
        next.delete(lang);
        return next;
      });
      setFieldErrors((prev) => {
        const nextErr = { ...prev };
        delete nextErr[lang];
        return nextErr;
      });
    },
    [baselineValues, captions, onCaptionsChange]
  );

  const copyAll = useCallback(() => {
    const text = captions.map((c) => `[${c.lang}]\n${c.text}`).join("\n\n");
    navigator.clipboard.writeText(text);
  }, [captions]);

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(captions, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "captions.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }, [captions]);

  return {
    getLabelText,
    getPlaceholderText,
    displayLangs,
    emptyNonCommonsLangs,
    generatingLang,
    generatingAll,
    sendingLang,
    sendingAll,
    error,
    fieldErrors,
    sentLangs,
    dirtyLangs,
    baselineValues,
    generateOne,
    generateAll,
    updateCaption,
    sendOne,
    sendAll,
    revertToBaseline,
    copyAll,
    exportJson,
  };
}
