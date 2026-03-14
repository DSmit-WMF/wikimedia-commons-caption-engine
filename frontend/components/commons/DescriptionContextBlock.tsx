"use client";

export interface DescriptionContextBlockProps {
  descriptionContext: string;
}

export function DescriptionContextBlock({ descriptionContext }: DescriptionContextBlockProps) {
  if (!descriptionContext) return null;

  return (
    <div className="space-y-1.5 pt-2 border-t">
      <p className="text-xs font-medium text-muted-foreground">
        Description context (used for translation)
      </p>
      <div className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3 max-h-32 overflow-y-auto">
        {descriptionContext}
      </div>
    </div>
  );
}
