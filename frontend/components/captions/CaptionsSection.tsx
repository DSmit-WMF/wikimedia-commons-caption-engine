"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { BatchNavBar } from "./BatchNavBar";
import { CAPTIONS_SECTION_ID } from "@/hooks";
import { CaptionEditor } from "@/components/CaptionEditor";
import type { CaptionItem } from "@/lib/api";

export interface CaptionsSectionProps {
  loadKey: number;
  captions: CaptionItem[];
  onCaptionsChange: (captions: CaptionItem[]) => void;
  languages: string[];
  languagesFromCommons: Set<string>;
  fileIdentifier: string;
  descriptionContext?: string;
  /** Batch nav: when in batch mode */
  currentBatchIndex?: number | null;
  successfulBatchItems?: { identifier: string }[];
  canGoBatchPrev?: boolean;
  canGoBatchNext?: boolean;
  onBatchPrev?: () => void;
  onBatchNext?: () => void;
}

export function CaptionsSection({
  loadKey,
  captions,
  onCaptionsChange,
  languages,
  languagesFromCommons,
  fileIdentifier,
  descriptionContext,
  currentBatchIndex = null,
  successfulBatchItems = [],
  canGoBatchPrev = false,
  canGoBatchNext = false,
  onBatchPrev,
  onBatchNext,
}: CaptionsSectionProps) {
  const showBatchNav =
    currentBatchIndex != null &&
    successfulBatchItems.length > 0 &&
    onBatchPrev != null &&
    onBatchNext != null;

  return (
    <Card id={CAPTIONS_SECTION_ID} className="scroll-mt-4">
      <CardHeader>
        {showBatchNav && (
          <BatchNavBar
            currentIndex={currentBatchIndex}
            total={successfulBatchItems.length}
            fileIdentifier={fileIdentifier}
            onPrev={onBatchPrev}
            onNext={onBatchNext}
            canGoPrev={canGoBatchPrev}
            canGoNext={canGoBatchNext}
          />
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-col space-y-1.5">
            <CardTitle>Captions</CardTitle>
            <CardDescription>
              Edit captions, generate translations for new languages, then send to Commons
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CaptionEditor
          key={loadKey}
          captions={captions}
          onCaptionsChange={onCaptionsChange}
          languages={languages}
          languagesFromCommons={languagesFromCommons}
          fileIdentifier={fileIdentifier}
          descriptionContext={descriptionContext}
        />
      </CardContent>
    </Card>
  );
}
