"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FolderOpen, Loader2, Shuffle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CommonsUrlInput } from "@/components/ImageUpload";

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
}: CommonsFileCardProps) {
  return (
    <Card className={hasImage ? "flex-1 min-w-0" : undefined}>
      <CardHeader>
        <CardTitle>Commons file</CardTitle>
        <CardDescription>
          Enter a Wikimedia Commons file page URL
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
          <Button
            type="button"
            variant="outline"
            onClick={onRandom}
            disabled={loadLoading}
          >
            {loadLoading && loadingSource === "random" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Shuffle className="mr-2 h-4 w-4" />
            )}
            Random image
          </Button>
        </div>
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
