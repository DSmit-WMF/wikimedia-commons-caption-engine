"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, FolderOpen, ListChecks, Loader2, Shuffle, Upload } from "lucide-react";

import type { BatchFileInfoItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CommonsUrlInput } from "@/components/ImageUpload";
import { Label } from "@/components/ui/label";
import { parseBatchIdentifiersFromFile } from "@/lib/batch-parse";
import { useRef } from "react";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onBatchUrlListChange) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const identifiers = parseBatchIdentifiersFromFile(text);
      onBatchUrlListChange(identifiers.join("\n"));
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  }

  return (
    <Card className={hasImage ? "flex-1 min-w-0" : undefined}>
      <CardHeader>
        <CardTitle>Commons file</CardTitle>
        <CardDescription>
          Enter a Wikimedia Commons file page URL or paste multiple (batch)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <CommonsUrlInput
          commonsUrl={commonsUrl}
          onCommonsUrlChange={onCommonsUrlChange}
          disabled={loadLoading}
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={onLoad} disabled={loadLoading}>
            {loadLoading && loadingSource === "load" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FolderOpen className="mr-2 h-4 w-4" />
            )}
            Load
          </Button>
          <Button type="button" variant="outline" onClick={onRandom} disabled={loadLoading}>
            {loadLoading && loadingSource === "random" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Shuffle className="mr-2 h-4 w-4" />
            )}
            Random image
          </Button>
        </div>

        {showBatch && (
          <>
            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="batch-urls" className="text-sm font-medium">
                Batch: URLs or File: titles (one per line or comma-separated, max 50)
              </Label>
              <p className="text-xs text-muted-foreground">
                Paste below, or upload a CSV/txt file (first column used; optional header row{" "}
                <code className="rounded bg-muted px-1">url</code>,{" "}
                <code className="rounded bg-muted px-1">file</code>, or{" "}
                <code className="rounded bg-muted px-1">title</code>).
              </p>
              <textarea
                id="batch-urls"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={
                  "https://commons.wikimedia.org/wiki/File:Example1.jpg\nhttps://commons.wikimedia.org/wiki/File:Example2.jpg"
                }
                value={batchUrlList}
                onChange={(e) => onBatchUrlListChange(e.target.value)}
                disabled={batchLoading || loadLoading}
                rows={3}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onLoadBatch}
                  disabled={batchLoading || loadLoading}
                >
                  {batchLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ListChecks className="mr-2 h-4 w-4" />
                  )}
                  Load batch
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  aria-label="Upload CSV or text file"
                  onChange={handleFileUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={batchLoading || loadLoading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload CSV/txt
                </Button>
              </div>
            </div>
            {batchResults.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground">
                  Batch results ({batchResults.filter((r) => r.success).length} with captions,{" "}
                  {batchResults.filter((r) => !r.success).length} failed)
                </p>
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {batchResults.map((item, i) => (
                    <li
                      key={`${item.identifier}-${i}`}
                      className="flex items-center gap-2 rounded-md border bg-muted/30 p-2 text-sm"
                    >
                      {item.success && item.file_info?.image_url ? (
                        <img
                          src={item.file_info.image_url}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 shrink-0 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">
                          —
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate font-medium"
                          title={item.file_info?.title ?? item.identifier}
                        >
                          {item.file_info?.title ?? item.identifier}
                        </p>
                        {item.success ? (
                          <p className="text-xs text-muted-foreground">
                            {Object.keys(item.file_info?.labels ?? {}).length} caption(s)
                          </p>
                        ) : (
                          <p className="text-xs text-destructive">{item.error}</p>
                        )}
                      </div>
                      {item.success && item.file_info && onOpenFromBatch && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenFromBatch(item.identifier)}
                          disabled={loadLoading}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
        {descriptionContext && (
          <div className="space-y-1.5 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground">
              Description context (used for translation)
            </p>
            <div className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3 max-h-32 overflow-y-auto">
              {descriptionContext}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
