"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface BatchNavBarProps {
  currentIndex: number;
  total: number;
  fileIdentifier: string | null;
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
}

export function BatchNavBar({
  currentIndex,
  total,
  fileIdentifier,
  onPrev,
  onNext,
  canGoPrev,
  canGoNext,
}: BatchNavBarProps) {
  return (
    <div className="flex items-center justify-between w-full gap-4 pb-3 mb-3 border-b border-border">
      <span
        className="text-sm text-muted-foreground min-w-0 truncate"
        title={fileIdentifier ?? undefined}
      >
        File {currentIndex + 1} of {total}
        {fileIdentifier && (
          <span className="ml-1.5 font-medium text-foreground">— {fileIdentifier}</span>
        )}
      </span>
      <div className="flex gap-1 shrink-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={!canGoPrev}
          aria-label="Previous file in batch"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={!canGoNext}
          aria-label="Next file in batch"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
