"use client";

import { Card, CardContent } from "@/components/ui/card";

export interface ImagePreviewCardProps {
  imageUrl: string;
  fileIdentifier: string | null;
  commonsUrl: string;
}

export function ImagePreviewCard({
  imageUrl,
  fileIdentifier,
  commonsUrl,
}: ImagePreviewCardProps) {
  return (
    <Card className="w-full sm:w-64 sm:shrink-0 overflow-hidden">
      <div className="w-full max-h-56 sm:max-h-72 bg-muted flex items-center justify-center">
        <img
          src={imageUrl}
          alt=""
          className="object-contain max-h-56 sm:max-h-72 w-full p-2"
        />
      </div>
      <CardContent className="p-3 space-y-2">
        <p
          className="text-sm font-medium truncate"
          title={fileIdentifier ?? undefined}
        >
          {fileIdentifier}
        </p>
        <a
          href={commonsUrl || undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground underline break-all"
        >
          Open on Commons
        </a>
      </CardContent>
    </Card>
  );
}
