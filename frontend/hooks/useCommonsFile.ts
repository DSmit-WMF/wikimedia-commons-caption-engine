"use client";

import { useState, useCallback } from "react";
import {
  getCommonsFileInfo,
  getRandomCommonsFile,
  type CaptionItem,
} from "@/lib/api";

const DEFAULT_LANGUAGES = ["en", "es", "fr", "ar", "zh"];

export function useCommonsFile() {
  const [commonsUrl, setCommonsUrl] = useState("");
  const [captions, setCaptions] = useState<CaptionItem[]>([]);
  const [languages, setLanguages] = useState<string[]>(DEFAULT_LANGUAGES);
  const [languagesFromCommons, setLanguagesFromCommons] = useState<Set<string>>(
    new Set(),
  );
  const [fileIdentifier, setFileIdentifier] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [descriptionContext, setDescriptionContext] = useState("");
  const [loadKey, setLoadKey] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadLoading, setLoadLoading] = useState(false);
  const [loadingSource, setLoadingSource] = useState<"load" | "random" | null>(
    null,
  );
  const [noCaptionsMessage, setNoCaptionsMessage] = useState<string | null>(
    null,
  );

  const handleLoad = useCallback(
    async (overrideUrl?: string) => {
      const url = (overrideUrl ?? commonsUrl).trim();
      if (!url) {
        setLoadError("Enter a Commons file URL.");
        return;
      }
      setLoadError(null);
      setNoCaptionsMessage(null);
      setLoadLoading(true);
      setLoadingSource("load");
      try {
        const info = await getCommonsFileInfo(url);
        if (!info) {
          setLoadError("File not found. Check the URL.");
          setCaptions([]);
          setFileIdentifier(null);
          setImageUrl(null);
          setDescriptionContext("");
          setLanguagesFromCommons(new Set());
          return;
        }
        const labels = info.labels ?? {};
        const labelEntries = Object.entries(labels);
        if (labelEntries.length === 0) {
          setNoCaptionsMessage(
            "No captions on this file. Add captions on Commons first.",
          );
          setCaptions([]);
          setFileIdentifier(null);
          setImageUrl(null);
          setDescriptionContext("");
          setLanguagesFromCommons(new Set());
          return;
        }
        setNoCaptionsMessage(null);
        const initial: CaptionItem[] = labelEntries.map(([lang, text]) => ({
          lang,
          text,
        }));
        setCaptions(initial);
        setLanguagesFromCommons(new Set(initial.map((c) => c.lang)));
        setFileIdentifier(info.title ?? url);
        setImageUrl(info.image_url ?? null);
        const descs = info.descriptions ?? {};
        setDescriptionContext(descs.en ?? descs[Object.keys(descs)[0]] ?? "");
        setLoadKey((k) => k + 1);
      } catch (e) {
        setLoadError(
          e instanceof Error ? e.message : "Failed to load file info.",
        );
        setCaptions([]);
        setFileIdentifier(null);
        setImageUrl(null);
        setDescriptionContext("");
        setLanguagesFromCommons(new Set());
      } finally {
        setLoadLoading(false);
        setLoadingSource(null);
      }
    },
    [commonsUrl],
  );

  const handleRandom = useCallback(async () => {
    setLoadError(null);
    setNoCaptionsMessage(null);
    setLoadLoading(true);
    setLoadingSource("random");
    try {
      const result = await getRandomCommonsFile();
      if (!result) {
        setLoadError("No random file with labels found. Try again.");
        return;
      }
      setCommonsUrl(result.url);
      await handleLoad(result.url);
    } catch (e) {
      setLoadError(
        e instanceof Error ? e.message : "Failed to get random file.",
      );
    } finally {
      setLoadLoading(false);
      setLoadingSource(null);
    }
  }, [handleLoad]);

  const handleCommonsUrlChange = useCallback((url: string) => {
    setCommonsUrl(url);
    setLoadError(null);
    setNoCaptionsMessage(null);
  }, []);

  const hasCaptions = captions.length > 0 && !noCaptionsMessage;
  const showCaptionUI = hasCaptions && fileIdentifier;

  return {
    commonsUrl,
    setCommonsUrl,
    handleCommonsUrlChange,
    captions,
    setCaptions,
    languages,
    setLanguages,
    languagesFromCommons,
    fileIdentifier,
    imageUrl,
    descriptionContext,
    loadKey,
    loadError,
    loadLoading,
    loadingSource,
    noCaptionsMessage,
    handleLoad,
    handleRandom,
    showCaptionUI,
  };
}
