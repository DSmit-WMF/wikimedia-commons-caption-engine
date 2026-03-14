"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  translateCaptions,
  validateCaption,
  saveCaptionsToCommons,
  type CaptionItem,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useFavouriteLanguages } from "@/lib/favourite-languages";
import { useLanguageNames } from "./useLanguageNames";

/**
 * Extracts a user-facing error message from a caught unknown (e.g. Error.message or fallback).
 */
function getErrorMessage(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

/**
 * Picks the best source caption to translate from: prefers English, otherwise first with text.
 */
export function getSourceCaption(captions: CaptionItem[]): CaptionItem | undefined {
  const withText = captions.filter((c) => c.text.trim());
  return withText.find((c) => c.lang === "en") ?? withText[0];
}

/** Props for the caption editor hook (captions state, file context, callbacks). */
export interface UseCaptionEditorProps {
  captions: CaptionItem[];
  onCaptionsChange: (captions: CaptionItem[]) => void;
  languages: string[];
  languagesFromCommons: Set<string>;
  fileIdentifier: string;
  descriptionContext?: string;
}

/**
 * Hook for the caption editor: translate (single/all), validate, save to Commons, revert, copy/export.
 * Uses React Query mutations for translate, validate, and save; aborts in-flight translations when
 * fileIdentifier changes or the component unmounts.
 */

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
  /** When generate-all is running: { completed, total } for "2/5" style counter. */
  const [generateAllProgress, setGenerateAllProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [sendingLang, setSendingLang] = useState<string | null>(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sentLangs, setSentLangs] = useState<Set<string>>(new Set());
  const [dirtyLangs, setDirtyLangs] = useState<Set<string>>(new Set());
  const [baselineValues, setBaselineValues] = useState<Record<string, string>>({});

  /** Abort in-flight translations when file changes or component unmounts. */
  const translateAbortRef = useRef<AbortController | null>(null);

  const translateMutation = useMutation({
    mutationFn: ({
      source,
      lang,
      descriptionContext,
      signal,
    }: {
      source: CaptionItem;
      lang: string;
      descriptionContext?: string;
      signal?: AbortSignal;
    }) => translateCaptions([source], [lang], descriptionContext, { signal }),
  });

  const validateMutation = useMutation({
    mutationFn: ({ text, lang }: { text: string; lang?: string }) => validateCaption(text, lang),
  });

  const saveMutation = useMutation({
    mutationFn: ({
      fileIdentifier,
      captions,
      accessToken,
    }: {
      fileIdentifier: string;
      captions: CaptionItem[];
      accessToken?: string | null;
    }) => saveCaptionsToCommons(fileIdentifier, captions, { accessToken }),
  });

  useEffect(() => {
    return () => {
      translateAbortRef.current?.abort();
    };
  }, [fileIdentifier]);

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
      translateAbortRef.current?.abort();
      translateAbortRef.current = new AbortController();
      const signal = translateAbortRef.current.signal;
      setGeneratingLang(lang);
      try {
        const translated = await translateMutation.mutateAsync({
          source,
          lang,
          descriptionContext,
          signal,
        });
        if (signal.aborted) return;
        const next = translated.filter((t) => t.lang === lang);
        if (next.length === 0) return;
        const existing = captions.filter((c) => c.lang !== lang);
        const newCaptions = [...existing, ...next];
        onCaptionsChange(newCaptions);
        setDirtyLangs((prev) => new Set(prev).add(lang));
        const newText = next[0]?.text ?? "";
        setBaselineValues((prev) => ({ ...prev, [lang]: newText }));
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setError(getErrorMessage(e, "Translation failed"));
      } finally {
        setGeneratingLang(null);
      }
    },
    [captions, onCaptionsChange, descriptionContext, translateMutation]
  );

  const generateAll = useCallback(async () => {
    if (emptyNonCommonsLangs.length === 0) return;
    const source = getSourceCaption(captions);
    if (!source) {
      setError("No source caption to translate from.");
      return;
    }
    setError(null);
    translateAbortRef.current?.abort();
    translateAbortRef.current = new AbortController();
    const signal = translateAbortRef.current.signal;
    const total = emptyNonCommonsLangs.length;
    setGeneratingAll(true);
    setGenerateAllProgress({ completed: 0, total });
    try {
      let currentCaptions = [...captions];
      for (let i = 0; i < emptyNonCommonsLangs.length; i++) {
        if (signal.aborted) break;
        const lang = emptyNonCommonsLangs[i];
        setGeneratingLang(lang);
        setGenerateAllProgress({ completed: i, total });
        try {
          const translated = await translateMutation.mutateAsync({
            source,
            lang,
            descriptionContext,
            signal,
          });
          if (signal.aborted) break;
          const item = translated.find((t) => t.lang === lang);
          if (item?.text != null) {
            const existing = currentCaptions.filter((c) => c.lang !== lang);
            currentCaptions = [...existing, { lang, text: item.text }];
            onCaptionsChange(currentCaptions);
            setDirtyLangs((prev) => new Set(prev).add(lang));
            setBaselineValues((prev) => ({ ...prev, [lang]: item.text }));
          }
        } finally {
          setGeneratingLang(null);
        }
        setGenerateAllProgress({ completed: i + 1, total });
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      setError(getErrorMessage(e, "Translation failed"));
    } finally {
      setGeneratingAll(false);
      setGenerateAllProgress(null);
    }
  }, [captions, emptyNonCommonsLangs, onCaptionsChange, descriptionContext, translateMutation]);

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
        const result = await validateMutation.mutateAsync({ text: cap.text, lang });
        if (!result.valid && result.warnings.length > 0) {
          setFieldErrors((prev) => ({
            ...prev,
            [lang]: result.warnings.join(" "),
          }));
          return;
        }
        await saveMutation.mutateAsync({
          fileIdentifier,
          captions: [cap],
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
        setError(getErrorMessage(e, "Save to Commons failed"));
      } finally {
        setSendingLang(null);
      }
    },
    [captions, fileIdentifier, accessToken, validateMutation, saveMutation]
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
        const result = await validateMutation.mutateAsync({
          text: cap.text,
          lang: cap.lang,
        });
        if (!result.valid && result.warnings.length > 0) {
          errors[cap.lang] = result.warnings.join(" ");
        }
      }
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
      await saveMutation.mutateAsync({
        fileIdentifier,
        captions: toSend,
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
      setError(getErrorMessage(e, "Save to Commons failed"));
    } finally {
      setSendingAll(false);
    }
  }, [captions, fileIdentifier, accessToken, validateMutation, saveMutation]);

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
    generateAllProgress,
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
