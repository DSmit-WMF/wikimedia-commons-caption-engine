"use client";

import {
  CAPTIONS_SECTION_ID,
  useCommonsFile,
  useSkipToCaptions,
} from "@/hooks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { CaptionEditor } from "@/components/CaptionEditor";
import { CommonsFileCard } from "@/components/commons/CommonsFileCard";
import { ImagePreviewCard } from "@/components/commons/ImagePreviewCard";
import { LanguageSelector } from "@/components/LanguageSelector";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function Home() {
  const {
    commonsUrl,
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
  } = useCommonsFile();

  useSkipToCaptions();

  return (
    <main className="min-h-screen flex flex-col">
      <SiteHeader showSkipToCaptions={!!showCaptionUI} />
      <div className="container mx-auto max-w-4xl p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1">
        <p className="text-muted-foreground text-sm text-left">
          Paste a Commons file URL to load existing captions, translate them
          into more languages, and save back to Commons.
        </p>

        {imageUrl ? (
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <CommonsFileCard
              commonsUrl={commonsUrl}
              onCommonsUrlChange={handleCommonsUrlChange}
              loadLoading={loadLoading}
              loadingSource={loadingSource}
              onLoad={() => handleLoad()}
              onRandom={handleRandom}
              loadError={loadError}
              noCaptionsMessage={noCaptionsMessage}
              descriptionContext={descriptionContext}
              hasImage={true}
            />
            <ImagePreviewCard
              imageUrl={imageUrl}
              fileIdentifier={fileIdentifier}
              commonsUrl={commonsUrl}
            />
          </div>
        ) : (
          <CommonsFileCard
            commonsUrl={commonsUrl}
            onCommonsUrlChange={handleCommonsUrlChange}
            loadLoading={loadLoading}
            loadingSource={loadingSource}
            onLoad={() => handleLoad()}
            onRandom={handleRandom}
            loadError={loadError}
            noCaptionsMessage={noCaptionsMessage}
            descriptionContext={descriptionContext}
            hasImage={false}
          />
        )}

        {showCaptionUI && fileIdentifier && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Languages</CardTitle>
                <CardDescription>
                  Choose languages for caption translation (default: en, es, fr,
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

            <Card id={CAPTIONS_SECTION_ID} className="scroll-mt-4">
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
      </div>
    </main>
  );
}
