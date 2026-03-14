"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getSuggestedLanguages } from "@/lib/api";
import { useEffect } from "react";
import { Languages, X } from "lucide-react";

const COMMON_LANGUAGES: { code: string; name: string }[] = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "nl", name: "Dutch" },
  { code: "pt", name: "Portuguese" },
  { code: "pt-br", name: "Brazilian Portuguese" },
  { code: "it", name: "Italian" },
  { code: "pl", name: "Polish" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "zh", name: "Chinese" },
  { code: "ar", name: "Arabic" },
];

interface LanguageSelectorProps {
  selectedLanguages: string[];
  onLanguagesChange: (langs: string[]) => void;
  preferredLang: string;
}

export function LanguageSelector({
  selectedLanguages,
  onLanguagesChange,
  preferredLang,
}: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const [suggested, setSuggested] = useState<string[]>([]);

  useEffect(() => {
    getSuggestedLanguages(preferredLang).then(setSuggested).catch(() => setSuggested(["en", "es", "fr"]));
  }, [preferredLang]);

  function addLanguage(code: string) {
    if (selectedLanguages.includes(code)) return;
    onLanguagesChange([...selectedLanguages, code]);
  }

  function removeLanguage(code: string) {
    onLanguagesChange(selectedLanguages.filter((l) => l !== code));
  }

  const languageName = (code: string) =>
    COMMON_LANGUAGES.find((l) => l.code === code)?.name ?? code;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selectedLanguages.map((code) => (
          <span
            key={code}
            className="inline-flex items-center gap-1 rounded-md border bg-muted px-2 py-1 text-sm"
          >
            {languageName(code)} ({code})
            <button
              type="button"
              aria-label={`Remove ${code}`}
              className="ml-1 rounded hover:bg-muted-foreground/20"
              onClick={() => removeLanguage(code)}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" type="button">
            <Languages className="mr-2 h-4 w-4" />
            Add or remove languages
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select languages</DialogTitle>
          </DialogHeader>
          <Command className="rounded-lg border">
            <CommandInput placeholder="Search languages..." />
            <CommandList>
              <CommandEmpty>No language found.</CommandEmpty>
              <CommandGroup heading="Suggested (from your preference)">
                {suggested.slice(0, 6).map((code) => (
                  <CommandItem
                    key={code}
                    value={`${code} ${languageName(code)}`}
                    onSelect={() => addLanguage(code)}
                  >
                    <span>
                      {languageName(code)} ({code})
                    </span>
                    {selectedLanguages.includes(code) && (
                      <span className="ml-2 text-muted-foreground">added</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup heading="All">
                {COMMON_LANGUAGES.filter((l) => !suggested.includes(l.code)).map(
                  ({ code, name }) => (
                    <CommandItem
                      key={code}
                      value={`${code} ${name}`}
                      onSelect={() => addLanguage(code)}
                    >
                      {name} ({code})
                      {selectedLanguages.includes(code) && (
                        <span className="ml-2 text-muted-foreground">added</span>
                      )}
                    </CommandItem>
                  )
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </div>
  );
}
