"use client";

import type { BatchFileInfoItem } from "@/lib/api";
import { CommonsFileCard } from "./CommonsFileCard";
import { ImagePreviewCard } from "./ImagePreviewCard";

export interface CommonsFileSectionProps {
  commonsUrl: string;
  onCommonsUrlChange: (url: string) => void;
  loadLoading: boolean;
  loadingSource: "load" | "random" | null;
  onLoad: () => void;
  onRandom: () => void;
  loadError: string | null;
  noCaptionsMessage: string | null;
  descriptionContext: string;
  imageUrl: string | null;
  fileIdentifier: string | null;
  batchUrlList: string;
  onBatchUrlListChange: (value: string) => void;
  batchResults: BatchFileInfoItem[];
  batchLoading: boolean;
  onLoadBatch: () => void;
  onOpenFromBatch: (identifier: string) => void;
}

export function CommonsFileSection(props: CommonsFileSectionProps) {
  const hasImage = props.imageUrl != null;

  const fileCard = (
    <CommonsFileCard
      commonsUrl={props.commonsUrl}
      onCommonsUrlChange={props.onCommonsUrlChange}
      loadLoading={props.loadLoading}
      loadingSource={props.loadingSource}
      onLoad={props.onLoad}
      onRandom={props.onRandom}
      loadError={props.loadError}
      noCaptionsMessage={props.noCaptionsMessage}
      descriptionContext={props.descriptionContext}
      hasImage={hasImage}
      batchUrlList={props.batchUrlList}
      onBatchUrlListChange={props.onBatchUrlListChange}
      batchResults={props.batchResults}
      batchLoading={props.batchLoading}
      onLoadBatch={props.onLoadBatch}
      onOpenFromBatch={props.onOpenFromBatch}
    />
  );

  if (hasImage && props.imageUrl && props.fileIdentifier != null) {
    return (
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {fileCard}
        <ImagePreviewCard
          imageUrl={props.imageUrl}
          fileIdentifier={props.fileIdentifier}
          commonsUrl={props.commonsUrl}
        />
      </div>
    );
  }

  return fileCard;
}
