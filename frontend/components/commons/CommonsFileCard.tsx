"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { BatchFileInfoItem } from "@/lib/api";
import { BatchLoadInput } from "./BatchLoadInput";
import { BatchResultsList } from "./BatchResultsList";
import { DescriptionContextBlock } from "./DescriptionContextBlock";
import { SingleFileLoadRow } from "./SingleFileLoadRow";

export { parseBatchIdentifiersFromFile } from "@/lib/batch-parse";

export interface CommonsFileCardProps {
  commonsUrl: string;
  onCommonsUrlChange: (url: string) => void;
  loadLoading: boolean;
  loadingSource: "load" | "random" | null;
  onLoad: () => void;
  onRandom: () => void;
  loadError: string | null;
  noCaptionsMessage: string | null;
  descriptionContext: string;
  hasImage: boolean;
  /** Batch URL list: one URL or title per line. */
  batchUrlList?: string;
  onBatchUrlListChange?: (value: string) => void;
  batchResults?: BatchFileInfoItem[];
  batchLoading?: boolean;
  onLoadBatch?: () => void;
  onOpenFromBatch?: (identifier: string) => void;
}

export function CommonsFileCard({
  commonsUrl,
  onCommonsUrlChange,
  loadLoading,
  loadingSource,
  onLoad,
  onRandom,
  loadError,
  noCaptionsMessage,
  descriptionContext,
  hasImage,
  batchUrlList = "",
  onBatchUrlListChange,
  batchResults = [],
  batchLoading = false,
  onLoadBatch,
  onOpenFromBatch,
}: CommonsFileCardProps) {
  const showBatch = onBatchUrlListChange != null && onLoadBatch != null && onOpenFromBatch != null;

  return (
    <Card className={hasImage ? "flex-1 min-w-0" : undefined}>
      <CardHeader>
        <CardTitle>Commons file</CardTitle>
        <CardDescription>
          Enter a Wikimedia Commons file page URL or paste multiple (batch)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SingleFileLoadRow
          commonsUrl={commonsUrl}
          onCommonsUrlChange={onCommonsUrlChange}
          onLoad={onLoad}
          onRandom={onRandom}
          loadLoading={loadLoading}
          loadingSource={loadingSource}
        />

        {showBatch && (
          <>
            <BatchLoadInput
              batchUrlList={batchUrlList}
              onBatchUrlListChange={onBatchUrlListChange}
              onLoadBatch={onLoadBatch}
              batchLoading={batchLoading}
              loadLoading={loadLoading}
            />
            <BatchResultsList
              results={batchResults}
              onOpenFromBatch={onOpenFromBatch}
              loadLoading={loadLoading}
            />
          </>
        )}

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
        <DescriptionContextBlock descriptionContext={descriptionContext} />
      </CardContent>
    </Card>
  );
}
