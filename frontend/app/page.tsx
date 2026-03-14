"use client";

import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { CaptionEditor } from "@/components/CaptionEditor";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CaptionItem } from "@/lib/api";

export default function Home() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [commonsUrl, setCommonsUrl] = useState("");
  const [captions, setCaptions] = useState<CaptionItem[]>([]);
  const [languages, setLanguages] = useState<string[]>(["en", "es", "fr"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="container mx-auto max-w-4xl p-6 space-y-6">
      <header className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Commons Caption Suggestion Tool</h1>
        <p className="text-muted-foreground text-sm">
          Upload an image or paste a Commons URL. Get short, factual caption suggestions in multiple languages.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Image</CardTitle>
          <CardDescription>Upload a file or enter a Wikimedia Commons file URL</CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUpload
            imagePreview={imagePreview}
            onPreviewChange={setImagePreview}
            onFileChange={setImageFile}
            commonsUrl={commonsUrl}
            onCommonsUrlChange={setCommonsUrl}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Languages</CardTitle>
          <CardDescription>Choose languages for caption suggestions (using shadcn Command)</CardDescription>
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
          <CardDescription>Review and edit captions before saving to Commons</CardDescription>
        </CardHeader>
        <CardContent>
          <CaptionEditor
            captions={captions}
            onCaptionsChange={setCaptions}
            languages={languages}
            imageFile={imageFile}
            imageUrl={commonsUrl || undefined}
            loading={loading}
            onLoadingChange={setLoading}
            error={error}
            onErrorChange={setError}
          />
        </CardContent>
      </Card>
    </main>
  );
}
