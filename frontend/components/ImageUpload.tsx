"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CommonsUrlInputProps {
  commonsUrl: string;
  onCommonsUrlChange: (url: string) => void;
  disabled?: boolean;
}

export function CommonsUrlInput({
  commonsUrl,
  onCommonsUrlChange,
  disabled = false,
}: CommonsUrlInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="commons-url">Commons file URL</Label>
      <Input
        id="commons-url"
        type="url"
        placeholder="https://commons.wikimedia.org/wiki/File:Example.jpg"
        value={commonsUrl}
        onChange={(e) => onCommonsUrlChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}
