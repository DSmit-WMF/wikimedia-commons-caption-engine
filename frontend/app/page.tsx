"use client";

import { useCommonsFile, useSkipToCaptions } from "@/hooks";

import { CaptionsSection } from "@/components/captions/CaptionsSection";
import { CommonsFileSection } from "@/components/commons/CommonsFileSection";
import { LanguagesSection } from "@/components/LanguagesSection";
import { SiteHeader } from "@/components/layout/SiteHeader";

const INTRO_TEXT =
  "Paste a Commons file URL to load existing captions, translate them into more languages, and save back to Commons.";

export default function Home() {
  const commons = useCommonsFile();
  useSkipToCaptions();

  return (
    <main className="min-h-screen flex flex-col">
      <SiteHeader showSkipToCaptions={!!commons.showCaptionUI} />
      <div className="container mx-auto max-w-4xl p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1">
        <p className="text-muted-foreground text-sm text-left">{INTRO_TEXT}</p>

        <CommonsFileSection
          commonsUrl={commons.commonsUrl}
          onCommonsUrlChange={commons.handleCommonsUrlChange}
          loadLoading={commons.loadLoading}
          loadingSource={commons.loadingSource}
          onLoad={() => commons.handleLoad()}
          onRandom={commons.handleRandom}
          loadError={commons.loadError}
          noCaptionsMessage={commons.noCaptionsMessage}
          descriptionContext={commons.descriptionContext}
          imageUrl={commons.imageUrl}
          fileIdentifier={commons.fileIdentifier}
          batchUrlList={commons.batchUrlList}
          onBatchUrlListChange={commons.setBatchUrlList}
          batchResults={commons.batchResults}
          batchLoading={commons.batchLoading}
          onLoadBatch={commons.loadBatch}
          onOpenFromBatch={commons.openFromBatch}
        />

        {commons.showCaptionUI && commons.fileIdentifier && (
          <div className="space-y-6">
            <LanguagesSection
              selectedLanguages={commons.languages}
              onLanguagesChange={commons.setLanguages}
              preferredLang="en"
            />
            <CaptionsSection
              loadKey={commons.loadKey}
              captions={commons.captions}
              onCaptionsChange={commons.setCaptions}
              languages={commons.languages}
              languagesFromCommons={commons.languagesFromCommons}
              fileIdentifier={commons.fileIdentifier}
              descriptionContext={commons.descriptionContext ?? undefined}
              currentBatchIndex={commons.currentBatchIndex}
              successfulBatchItems={commons.successfulBatchItems}
              canGoBatchPrev={commons.canGoBatchPrev}
              canGoBatchNext={commons.canGoBatchNext}
              onBatchPrev={commons.goToBatchPrev}
              onBatchNext={commons.goToBatchNext}
            />
          </div>
        )}
      </div>
    </main>
  );
}
