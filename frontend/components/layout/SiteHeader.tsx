"use client";

import { scrollToCaptions } from "@/hooks/useSkipToCaptions";

export interface SiteHeaderProps {
  showSkipToCaptions?: boolean;
}

export function SiteHeader({ showSkipToCaptions = false }: SiteHeaderProps) {
  return (
    <header className="border-b border-border/80 bg-gradient-to-r from-background via-muted/50 to-background shadow-sm">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <a
          href="https://commons.wikimedia.org"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
          aria-label="Wikimedia Commons (opens in new tab)"
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Commons-logo.svg"
            alt=""
            className="h-9 sm:h-10 w-auto shrink-0"
          />
          <span className="font-semibold text-lg sm:text-xl text-foreground">
            Wikimedia Commons
          </span>
        </a>
        <div className="flex items-center gap-3">
          {showSkipToCaptions && (
            <a
              href="#captions-section"
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-ring rounded"
              onClick={(e) => {
                e.preventDefault();
                scrollToCaptions();
              }}
            >
              Skip to captions
            </a>
          )}
          <span className="text-sm text-muted-foreground font-medium">
            Caption Translation Tool
          </span>
        </div>
      </div>
    </header>
  );
}
