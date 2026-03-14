"use client";

import type { BatchFileInfoItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export interface BatchResultsListProps {
  results: BatchFileInfoItem[];
  onOpenFromBatch?: (identifier: string) => void;
  loadLoading: boolean;
}

export function BatchResultsList({ results, onOpenFromBatch, loadLoading }: BatchResultsListProps) {
  if (results.length === 0) return null;

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return (
    <div className="space-y-2 pt-2 border-t">
      <p className="text-xs font-medium text-muted-foreground">
        Batch results ({successCount} with captions, {failCount} failed)
      </p>
      <ul className="space-y-2 max-h-48 overflow-y-auto">
        {results.map((item, i) => (
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
              <p className="truncate font-medium" title={item.file_info?.title ?? item.identifier}>
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
  );
}
