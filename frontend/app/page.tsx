"use client";

import { useState, useCallback } from "react";
import { CommonsUrlInput } from "@/components/ImageUpload";
import { CaptionEditor } from "@/components/CaptionEditor";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCommonsFileInfo, type CaptionItem } from "@/lib/api";
import { Loader2 } from "lucide-react";

const DEFAULT_LANGUAGES = ["en", "es", "fr", "ar", "zh"];

export default function Home() {
  const [commonsUrl, setCommonsUrl] = useState("");
  const [captions, setCaptions] = useState<CaptionItem[]>([]);
  const [languages, setLanguages] = useState<string[]>(DEFAULT_LANGUAGES);
  const [languagesFromCommons, setLanguagesFromCommons] = useState<Set<string>>(new Set());
  const [fileIdentifier, setFileIdentifier] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadLoading, setLoadLoading] = useState(false);
  const [noCaptionsMessage, setNoCaptionsMessage] = useState<string | null>(null);

  const handleLoad = useCallback(async () => {
    const url = commonsUrl.trim();
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
        setLanguagesFromCommons(new Set());
        return;
      }
      const labels = info.labels ?? {};
      const labelEntries = Object.entries(labels);
      if (labelEntries.length === 0) {
        setNoCaptionsMessage("No captions on this file. Add captions on Commons first.");
        setCaptions([]);
        setFileIdentifier(null);
        setLanguagesFromCommons(new Set());
        return;
      }
      setNoCaptionsMessage(null);
      const initial: CaptionItem[] = labelEntries.map(([lang, text]) => ({ lang, text }));
      setCaptions(initial);
      setLanguagesFromCommons(new Set(initial.map((c) => c.lang)));
      setFileIdentifier(info.title ?? url);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load file info.");
      setCaptions([]);
      setFileIdentifier(null);
      setLanguagesFromCommons(new Set());
    } finally {
      setLoadLoading(false);
    }
  }, [commonsUrl]);

  const hasCaptions = captions.length > 0 && !noCaptionsMessage;
  const showCaptionUI = hasCaptions && fileIdentifier;

  return (
    <main className="container mx-auto max-w-4xl p-6 space-y-6">
      <header className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Commons Caption Suggestion Tool</h1>
        <p className="text-muted-foreground text-sm">
          Paste a Commons file URL to load existing captions, translate them into more languages, and save back to Commons.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Commons file</CardTitle>
          <CardDescription>Enter a Wikimedia Commons file page URL</CardDescription>
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
          <Button onClick={handleLoad} disabled={loadLoading}>
            {loadLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Load
          </Button>
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

      {showCaptionUI && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Languages</CardTitle>
              <CardDescription>Choose languages for caption suggestions (default: en, es, fr, ar, zh)</CardDescription>
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
              <CardDescription>Edit captions, generate translations for new languages, then send to Commons</CardDescription>
            </CardHeader>
            <CardContent>
              <CaptionEditor
                captions={captions}
                onCaptionsChange={setCaptions}
                languages={languages}
                languagesFromCommons={languagesFromCommons}
                fileIdentifier={fileIdentifier}
              />
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
