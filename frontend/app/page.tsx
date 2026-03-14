"use client";

import { useState, useCallback } from "react";
import { CommonsUrlInput } from "@/components/ImageUpload";
import { CaptionEditor } from "@/components/CaptionEditor";
import { LanguageSelector } from "@/components/LanguageSelector";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getCommonsFileInfo,
  getRandomCommonsFile,
  type CaptionItem,
} from "@/lib/api";
import { Loader2, Shuffle, FolderOpen } from "lucide-react";

const DEFAULT_LANGUAGES = ["en", "es", "fr", "ar", "zh"];

export default function Home() {
  const [commonsUrl, setCommonsUrl] = useState("");
  const [captions, setCaptions] = useState<CaptionItem[]>([]);
  const [languages, setLanguages] = useState<string[]>(DEFAULT_LANGUAGES);
  const [languagesFromCommons, setLanguagesFromCommons] = useState<Set<string>>(
    new Set(),
  );
  const [fileIdentifier, setFileIdentifier] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [descriptionContext, setDescriptionContext] = useState<string>("");
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

  const hasCaptions = captions.length > 0 && !noCaptionsMessage;
  const showCaptionUI = hasCaptions && fileIdentifier;

  const commonsFileCard = (
    <Card className={imageUrl ? "flex-1 min-w-0" : undefined}>
      <CardHeader>
        <CardTitle>Commons file</CardTitle>
        <CardDescription>
          Enter a Wikimedia Commons file page URL
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <CommonsUrlInput
          commonsUrl={commonsUrl}
          onCommonsUrlChange={(u) => {
            setCommonsUrl(u);
            setLoadError(null);
            setNoCaptionsMessage(null);
          }}
          disabled={loadLoading}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              setLoadingSource("load");
              handleLoad();
            }}
            disabled={loadLoading}
          >
            {loadLoading && loadingSource === "load" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FolderOpen className="mr-2 h-4 w-4" />
            )}
            Load
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleRandom}
            disabled={loadLoading}
          >
            {loadLoading && loadingSource === "random" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Shuffle className="mr-2 h-4 w-4" />
            )}
            Random image
          </Button>
        </div>
        {loadError && (
          <p className="text-sm text-destructive" role="alert">
            {loadError}
          </p>
        )}
        {noCaptionsMessage && (
          <p className="text-sm text-muted-foreground" role="status">
            {noCaptionsMessage}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <main className="container mx-auto max-w-4xl p-4 sm:p-6 space-y-4 sm:space-y-6">
      <header className="text-center space-y-2">
        <h1 className="text-xl sm:text-2xl font-bold">Commons Caption Suggestion Tool</h1>
        <p className="text-muted-foreground text-sm">
          Paste a Commons file URL to load existing captions, translate them
          into more languages, and save back to Commons.
        </p>
      </header>

      {imageUrl ? (
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          {commonsFileCard}
          <Card className="w-full sm:w-64 sm:shrink-0 overflow-hidden">
            <div className="w-full max-h-56 sm:max-h-72 bg-muted flex items-center justify-center">
              <img
                src={imageUrl}
                alt=""
                className="object-contain max-h-56 sm:max-h-72 w-full p-2"
              />
            </div>
            <CardContent className="p-3 space-y-2">
              <p
                className="text-sm font-medium truncate"
                title={fileIdentifier ?? undefined}
              >
                {fileIdentifier}
              </p>
              <a
                href={commonsUrl || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground underline break-all"
              >
                Open on Commons
              </a>
            </CardContent>
          </Card>
        </div>
      ) : (
        commonsFileCard
      )}

      {showCaptionUI && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Languages</CardTitle>
              <CardDescription>
                Choose languages for caption suggestions (default: en, es, fr,
                ar, zh)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LanguageSelector
                selectedLanguages={languages}
                onLanguagesChange={setLanguages}
                preferredLang="en"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Captions</CardTitle>
              <CardDescription>
                Edit captions, generate translations for new languages, then
                send to Commons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CaptionEditor
                key={loadKey}
                captions={captions}
                onCaptionsChange={setCaptions}
                languages={languages}
                languagesFromCommons={languagesFromCommons}
                fileIdentifier={fileIdentifier}
                descriptionContext={descriptionContext || undefined}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
