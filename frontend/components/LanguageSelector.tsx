"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  DialogClose,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getAllMediaWikiLanguages, getSuggestedLanguages, type MediaWikiLanguage } from "@/lib/api";
import { useFavouriteLanguages, isDefaultLanguage } from "@/lib/favourite-languages";
import { Languages, X, Star } from "lucide-react";

interface LanguageSelectorProps {
  selectedLanguages: string[];
  onLanguagesChange: (langs: string[]) => void;
  preferredLang: string;
}

const FALLBACK_LANGUAGES: MediaWikiLanguage[] = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
];

export function LanguageSelector({
  selectedLanguages,
  onLanguagesChange,
  preferredLang,
}: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const { toggle: toggleFavourite, has: isFavourite } = useFavouriteLanguages();

  const { data: suggested = ["en", "es", "fr"] } = useQuery({
    queryKey: ["suggested-languages", preferredLang],
    queryFn: ({ signal }) => getSuggestedLanguages(preferredLang, { signal }),
  });

  const { data: allLanguages = [] } = useQuery({
    queryKey: ["mediawiki-languages"],
    queryFn: ({ signal }) => getAllMediaWikiLanguages({ signal }),
  });

  function addLanguage(code: string) {
    if (selectedLanguages.includes(code)) return;
    onLanguagesChange([...selectedLanguages, code]);
  }

  function removeLanguage(code: string) {
    if (isDefaultLanguage(code)) return;
    onLanguagesChange(selectedLanguages.filter((l) => l !== code));
  }

  const codeToName = useMemo(() => {
    const m = new Map<string, string>();
    for (const l of allLanguages) m.set(l.code, l.name);
    return m;
  }, [allLanguages]);

  const languageName = (code: string) => codeToName.get(code) ?? code;

  const allLanguageOptions = allLanguages.length > 0 ? allLanguages : FALLBACK_LANGUAGES;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selectedLanguages.map((code) => {
          const isDefault = isDefaultLanguage(code);
          return (
            <span
              key={code}
              className="inline-flex items-center gap-1 rounded-md border bg-muted px-2 py-1 text-sm"
            >
              {languageName(code)} ({code})
              {!isDefault && (
                <button
                  type="button"
                  aria-label={`Remove ${code}`}
                  className="rounded hover:bg-muted-foreground/20"
                  onClick={() => removeLanguage(code)}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              {!isDefault && (
                <button
                  type="button"
                  aria-label={isFavourite(code) ? "Remove from favourites" : "Add to favourites"}
                  className="rounded p-0.5 hover:bg-muted-foreground/20"
                  onClick={() => toggleFavourite(code)}
                >
                  <Star
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isFavourite(code) ? "fill-amber-400 text-amber-500" : "text-muted-foreground"
                    }`}
                    aria-hidden
                  />
                </button>
              )}
            </span>
          );
        })}
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
            <p className="text-sm text-muted-foreground">
              Click a language to add it to the caption list. Your selection is at the top—click a
              row to remove it (default languages cannot be removed).
            </p>
          </DialogHeader>
          <Command className="rounded-lg border">
            <CommandInput placeholder="Search languages..." />
            <CommandList>
              <CommandEmpty>No language found.</CommandEmpty>
              {selectedLanguages.length > 0 && (
                <CommandGroup heading="Your selection">
                  {selectedLanguages.map((code) => {
                    const isDefault = isDefaultLanguage(code);
                    return (
                      <CommandItem
                        key={code}
                        value={`selected ${code} ${languageName(code)}`}
                        onSelect={() => removeLanguage(code)}
                        disabled={isDefault}
                      >
                        <span className="flex-1">
                          {languageName(code)} ({code})
                          {isDefault && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (default, cannot remove)
                            </span>
                          )}
                        </span>
                        {!isDefault && (
                          <span className="text-muted-foreground text-xs">click to remove</span>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
              <CommandGroup heading="Suggested (from your preference)">
                {suggested
                  .slice(0, 6)
                  .filter((code) => !selectedLanguages.includes(code))
                  .map((code) => (
                    <CommandItem
                      key={code}
                      value={`${code} ${languageName(code)}`}
                      onSelect={() => addLanguage(code)}
                    >
                      <span className="flex-1">
                        {languageName(code)} ({code})
                      </span>
                      {selectedLanguages.includes(code) && (
                        <span className="ml-2 text-muted-foreground text-xs">added</span>
                      )}
                    </CommandItem>
                  ))}
              </CommandGroup>
              <CommandGroup heading="All">
                {allLanguageOptions
                  .filter((l) => !suggested.includes(l.code) && !selectedLanguages.includes(l.code))
                  .map(({ code, name }) => (
                    <CommandItem
                      key={code}
                      value={`${code} ${name}`}
                      onSelect={() => addLanguage(code)}
                    >
                      <span className="flex-1">
                        {name} ({code})
                      </span>
                      {selectedLanguages.includes(code) && (
                        <span className="ml-2 text-muted-foreground text-xs">added</span>
                      )}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>

          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button type="button" onClick={() => setOpen(false)}>
                Done
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
