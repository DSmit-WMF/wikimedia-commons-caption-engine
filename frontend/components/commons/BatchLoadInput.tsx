"use client";

import { ListChecks, Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { parseBatchIdentifiersFromFile } from "@/lib/batch-parse";
import { useRef } from "react";

export interface BatchLoadInputProps {
  batchUrlList: string;
  onBatchUrlListChange: (value: string) => void;
  onLoadBatch: () => void;
  batchLoading: boolean;
  loadLoading: boolean;
}

export function BatchLoadInput({
  batchUrlList,
  onBatchUrlListChange,
  onLoadBatch,
  batchLoading,
  loadLoading,
}: BatchLoadInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const disabled = batchLoading || loadLoading;

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
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
        disabled={disabled}
        rows={3}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onLoadBatch}
          disabled={disabled}
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
          disabled={disabled}
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload CSV/txt
        </Button>
      </div>
    </div>
  );
}
