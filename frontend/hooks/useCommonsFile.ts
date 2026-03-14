"use client";

import { useState, useCallback } from "react";
import {
  getCommonsFileInfo,
  getRandomCommonsFile,
  getBatchFileInfo,
  type CaptionItem,
  type BatchFileInfoItem,
} from "@/lib/api";
import { DEFAULT_LANGUAGE_CODES } from "@/lib/favourite-languages";

const DEFAULT_LANGUAGES = [...DEFAULT_LANGUAGE_CODES];

export function useCommonsFile() {
  const [commonsUrl, setCommonsUrl] = useState("");
  const [captions, setCaptions] = useState<CaptionItem[]>([]);
  const [languages, setLanguages] = useState<string[]>(DEFAULT_LANGUAGES);
  const [languagesFromCommons, setLanguagesFromCommons] = useState<Set<string>>(new Set());
  const [fileIdentifier, setFileIdentifier] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [descriptionContext, setDescriptionContext] = useState("");
  const [loadKey, setLoadKey] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadLoading, setLoadLoading] = useState(false);
  const [loadingSource, setLoadingSource] = useState<"load" | "random" | null>(null);
  const [noCaptionsMessage, setNoCaptionsMessage] = useState<string | null>(null);
  const [batchUrlList, setBatchUrlList] = useState("");
  const [batchResults, setBatchResults] = useState<BatchFileInfoItem[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  /** Index in successful batch results for the currently loaded file; null when not in batch mode. */
  const [currentBatchIndex, setCurrentBatchIndex] = useState<number | null>(null);

  const handleLoad = useCallback(
    async (overrideUrl?: string, fromBatch?: boolean) => {
      const url = (overrideUrl ?? commonsUrl).trim();
      if (!url) {
        setLoadError("Enter a Commons file URL.");
        return;
      }
      if (!fromBatch) setCurrentBatchIndex(null);
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
          setNoCaptionsMessage("No captions on this file. Add captions on Commons first.");
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
        setLoadError(e instanceof Error ? e.message : "Failed to load file info.");
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
    [commonsUrl]
  );

  const handleRandom = useCallback(async () => {
    setLoadError(null);
    setNoCaptionsMessage(null);
    setCurrentBatchIndex(null);
    setBatchResults([]);
    setBatchUrlList("");
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
      setLoadError(e instanceof Error ? e.message : "Failed to get random file.");
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

  const loadBatch = useCallback(async () => {
    const identifiers = batchUrlList
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (identifiers.length === 0) {
      setLoadError("Enter at least one Commons URL or title (one per line or comma-separated).");
      return;
    }
    if (identifiers.length > 50) {
      setLoadError("Maximum 50 URLs per batch.");
      return;
    }
    setLoadError(null);
    setCurrentBatchIndex(null);
    setBatchLoading(true);
    try {
      const results = await getBatchFileInfo(identifiers);
      setBatchResults(results);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Batch load failed.");
      setBatchResults([]);
    } finally {
      setBatchLoading(false);
    }
  }, [batchUrlList]);

  const openFromBatch = useCallback(
    async (identifier: string) => {
      setCommonsUrl(identifier);
      await handleLoad(identifier, true);
      const successful = batchResults.filter((r) => r.success);
      const idx = successful.findIndex(
        (r) => r.identifier === identifier || r.file_info?.title === identifier
      );
      setCurrentBatchIndex(idx >= 0 ? idx : null);
    },
    [handleLoad, batchResults]
  );

  const successfulBatchItems = batchResults.filter((r) => r.success);
  const canGoPrev = currentBatchIndex != null && currentBatchIndex > 0 && !loadLoading;
  const canGoNext =
    currentBatchIndex != null &&
    currentBatchIndex < successfulBatchItems.length - 1 &&
    !loadLoading;

  const goToBatchPrev = useCallback(() => {
    if (!canGoPrev) return;
    const item = successfulBatchItems[currentBatchIndex! - 1];
    if (item) openFromBatch(item.identifier);
  }, [canGoPrev, currentBatchIndex, successfulBatchItems, openFromBatch]);

  const goToBatchNext = useCallback(() => {
    if (!canGoNext) return;
    const item = successfulBatchItems[currentBatchIndex! + 1];
    if (item) openFromBatch(item.identifier);
  }, [canGoNext, currentBatchIndex, successfulBatchItems, openFromBatch]);

  const hasCaptions = captions.length > 0 && !noCaptionsMessage;
  const showCaptionUI = hasCaptions && fileIdentifier;

  return {
    commonsUrl,
    setCommonsUrl,
    handleCommonsUrlChange,
    batchUrlList,
    setBatchUrlList,
    batchResults,
    batchLoading,
    loadBatch,
    openFromBatch,
    successfulBatchItems,
    currentBatchIndex,
    canGoBatchPrev: canGoPrev,
    canGoBatchNext: canGoNext,
    goToBatchPrev,
    goToBatchNext,
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
