"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";

interface ImageUploadProps {
  imagePreview: string | null;
  onPreviewChange: (url: string | null) => void;
  onFileChange: (file: File | null) => void;
  commonsUrl: string;
  onCommonsUrlChange: (url: string) => void;
}

export function ImageUpload({
  imagePreview,
  onPreviewChange,
  onFileChange,
  commonsUrl,
  onCommonsUrlChange,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      onFileChange(null);
      onPreviewChange(null);
      return;
    }
    if (!file.type.startsWith("image/")) return;
    onFileChange(file);
    const reader = new FileReader();
    reader.onload = () => onPreviewChange(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="commons-url">Commons file URL (optional)</Label>
        <Input
          id="commons-url"
          type="url"
          placeholder="https://commons.wikimedia.org/wiki/File:Example.jpg"
          value={commonsUrl}
          onChange={(e) => onCommonsUrlChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Or upload an image</Label>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          Choose file
        </Button>
      </div>
      {imagePreview && (
        <div className="mt-4">
          <img
            src={imagePreview}
            alt="Preview"
            className="max-h-64 rounded-md border object-contain"
          />
        </div>
      )}
    </div>
  );
}
