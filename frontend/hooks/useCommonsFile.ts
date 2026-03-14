"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getCommonsFileInfo,
  getRandomCommonsFile,
  getBatchFileInfo,
  type CaptionItem,
  type BatchFileInfoItem,
  type CommonsFileInfo,
} from "@/lib/api";
import {
  DEFAULT_LANGUAGE_CODES,
  getFavouriteLanguages,
} from "@/lib/favourite-languages";

const DEFAULT_LANGUAGES = [...DEFAULT_LANGUAGE_CODES];

type ApplyFileInfoSetters = {
  setCaptions: (c: CaptionItem[]) => void;
  setLanguages: (l: string[] | ((prev: string[]) => string[])) => void;
  setFileIdentifier: (id: string | null) => void;
  setImageUrl: (u: string | null) => void;
  setDescriptionContext: (d: string) => void;
  setLanguagesFromCommons: (s: Set<string>) => void;
  setLoadError: (e: string | null) => void;
  setNoCaptionsMessage: (m: string | null) => void;
  setLoadKey: (fn: (k: number) => number) => void;
};

/** Resets all file-related state to empty (no file loaded). */
function clearFileState(setters: ApplyFileInfoSetters, loadError: string | null = null): void {
  const {
    setCaptions,
    setLanguages,
    setFileIdentifier,
    setImageUrl,
    setDescriptionContext,
    setLanguagesFromCommons,
    setLoadError,
    setNoCaptionsMessage,
  } = setters;
  setLoadError(loadError);
  setCaptions([]);
  setLanguages(DEFAULT_LANGUAGES);
  setFileIdentifier(null);
  setImageUrl(null);
  setDescriptionContext("");
  setLanguagesFromCommons(new Set());
  setNoCaptionsMessage(null);
}

/**
 * Applies Commons file info to editor state: captions, image URL, description context, etc.
 * If info is null or has no labels, clears state and sets an appropriate error/no-captions message.
 */
function applyFileInfo(
  info: CommonsFileInfo | null,
  url: string,
  setters: ApplyFileInfoSetters
): void {
  if (!info) {
    clearFileState(setters, "File not found. Check the URL.");
    return;
  }
  const labels = info.labels ?? {};
  const labelEntries = Object.entries(labels);
  if (labelEntries.length === 0) {
    clearFileState(setters, null);
    setters.setNoCaptionsMessage("No captions on this file. Add captions on Commons first.");
    return;
  }
  setters.setNoCaptionsMessage(null);
  setters.setLoadError(null);
  const initial: CaptionItem[] = labelEntries.map(([lang, text]) => ({ lang, text }));
  setters.setCaptions(initial);
  setters.setLanguagesFromCommons(new Set(initial.map((c) => c.lang)));
  // Selection = defaults + favourites (for next-time auto-add) + languages from file.
  const fileLangCodes = initial.map((c) => c.lang);
  const initialLanguages = [
    ...new Set([
      ...DEFAULT_LANGUAGE_CODES,
      ...getFavouriteLanguages(),
      ...fileLangCodes,
    ]),
  ];
  setters.setLanguages(initialLanguages);
  setters.setFileIdentifier(info.title ?? url);
  setters.setImageUrl(info.image_url ?? null);
  const descs = info.descriptions ?? {};
  // Prefer file-page description (Information template / Summary); fall back to Wikibase descriptions.
  const context = info.page_description?.trim() ?? descs.en ?? descs[Object.keys(descs)[0]] ?? "";
  setters.setDescriptionContext(context);
  setters.setLoadKey((k) => k + 1);
}

/**
 * Hook for loading and managing a Commons file: single URL load, batch load, random file,
 * and the resulting captions/languages state. Uses React Query for file and batch fetches
 * (aborts previous request when URL or batch list changes).
 */
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
  const [loadingSource, setLoadingSource] = useState<"load" | "random" | null>(null);
  const [noCaptionsMessage, setNoCaptionsMessage] = useState<string | null>(null);
  const [batchUrlList, setBatchUrlList] = useState("");
  const [batchResults, setBatchResults] = useState<BatchFileInfoItem[]>([]);
  /** Index in successful batch results for the currently loaded file; null when not in batch mode. */
  const [currentBatchIndex, setCurrentBatchIndex] = useState<number | null>(null);

  /** When set, useQuery fetches file info; changing this aborts the previous request. */
  const [loadRequestUrl, setLoadRequestUrl] = useState<string | null>(null);
  /** Increments on each Load click so the same URL triggers a refetch. */
  const [singleLoadKey, setSingleLoadKey] = useState(0);
  /** When set, useQuery fetches batch; changing this aborts the previous request. */
  const [batchRequestIds, setBatchRequestIds] = useState<string[] | null>(null);
  /** Increments on each Load batch click so the same URL list can be refetched (React Query keys are deep-equal). */
  const [batchLoadKey, setBatchLoadKey] = useState(0);

  const randomFileMutation = useMutation({
    mutationFn: getRandomCommonsFile,
  });

  const fileQuery = useQuery({
    queryKey: ["commons-file", loadRequestUrl, singleLoadKey],
    queryFn: async ({ signal }) => {
      if (!loadRequestUrl) return null;
      return getCommonsFileInfo(loadRequestUrl, { signal });
    },
    enabled: !!loadRequestUrl,
  });

  useEffect(() => {
    if (fileQuery.data === undefined || !loadRequestUrl) return;
    if (fileQuery.isSuccess) {
      applyFileInfo(fileQuery.data, loadRequestUrl, {
        setCaptions,
        setLanguages,
        setFileIdentifier,
        setImageUrl,
        setDescriptionContext,
        setLanguagesFromCommons,
        setLoadError,
        setNoCaptionsMessage,
        setLoadKey,
      });
      setLoadingSource(null);
    }
  }, [fileQuery.data, fileQuery.isSuccess, loadRequestUrl]);

  useEffect(() => {
    if (fileQuery.isError && fileQuery.error && loadRequestUrl) {
      const message =
        fileQuery.error instanceof Error ? fileQuery.error.message : "Failed to load file info.";
      clearFileState(
        {
          setCaptions,
          setLanguages,
          setFileIdentifier,
          setImageUrl,
          setDescriptionContext,
          setLanguagesFromCommons,
          setLoadError,
          setNoCaptionsMessage,
          setLoadKey,
        },
        message
      );
    }
  }, [fileQuery.isError, fileQuery.error, loadRequestUrl]);

  const loadLoading = (loadRequestUrl && fileQuery.isFetching) || loadingSource === "random";

  const handleLoad = useCallback(
    (overrideUrl?: string, fromBatch?: boolean) => {
      const url = (overrideUrl ?? commonsUrl).trim();
      if (!url) {
        setLoadError("Enter a Commons file URL.");
        return;
      }
      if (!fromBatch) setCurrentBatchIndex(null);
      setLoadError(null);
      setNoCaptionsMessage(null);
      setLoadingSource("load");
      setSingleLoadKey((k) => k + 1);
      setLoadRequestUrl(url);
    },
    [commonsUrl]
  );

  const handleRandom = useCallback(async () => {
    setLoadError(null);
    setNoCaptionsMessage(null);
    setCurrentBatchIndex(null);
    setBatchResults([]);
    setBatchUrlList("");
    setLoadingSource("random");
    try {
      const result = await randomFileMutation.mutateAsync();
      if (!result) {
        setLoadError("No random file with labels found. Try again.");
        return;
      }
      setCommonsUrl(result.url);
      setLoadRequestUrl(result.url);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to get random file.");
    } finally {
      setLoadingSource(null);
    }
  }, [randomFileMutation]);

  const handleCommonsUrlChange = useCallback((url: string) => {
    setCommonsUrl(url);
    setLoadError(null);
    setNoCaptionsMessage(null);
  }, []);

  const batchQuery = useQuery({
    queryKey: ["batch-files", batchRequestIds, batchLoadKey],
    queryFn: async ({ signal }) => {
      if (!batchRequestIds?.length) return [];
      return getBatchFileInfo(batchRequestIds, { signal });
    },
    enabled: !!batchRequestIds?.length && batchLoadKey > 0,
  });

  useEffect(() => {
    if (batchQuery.isSuccess && batchQuery.data !== undefined) {
      setBatchResults(batchQuery.data);
    }
  }, [batchQuery.isSuccess, batchQuery.data]);

  useEffect(() => {
    if (batchQuery.isError && batchRequestIds?.length) {
      setLoadError(
        batchQuery.error instanceof Error ? batchQuery.error.message : "Batch load failed."
      );
      setBatchResults([]);
    }
  }, [batchQuery.isError, batchQuery.error, batchRequestIds?.length]);

  const batchLoading = !!batchRequestIds?.length && batchQuery.isFetching;

  const loadBatch = useCallback(() => {
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
    setBatchRequestIds(identifiers);
    setBatchLoadKey((k) => k + 1);
  }, [batchUrlList]);

  const openFromBatch = useCallback(
    (identifier: string) => {
      setCommonsUrl(identifier);
      handleLoad(identifier, true);
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

  /** When languages are removed from selection, also remove their caption entries. Default languages are always kept. */
  const setLanguagesAndSyncCaptions = useCallback(
    (newLangs: string[] | ((prev: string[]) => string[])) => {
      setLanguages((prev) => {
        const next = typeof newLangs === "function" ? newLangs(prev) : newLangs;
        const withDefaults = [...new Set([...DEFAULT_LANGUAGE_CODES, ...next])];
        setCaptions((cap) => cap.filter((c) => withDefaults.includes(c.lang)));
        return withDefaults;
      });
    },
    []
  );

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
    setLanguages: setLanguagesAndSyncCaptions,
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
