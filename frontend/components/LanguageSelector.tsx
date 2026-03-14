"use client";

import { useMemo, useState, useEffect } from "react";
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

export function LanguageSelector({
  selectedLanguages,
  onLanguagesChange,
  preferredLang,
}: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const [suggested, setSuggested] = useState<string[]>([]);
  const [allLanguages, setAllLanguages] = useState<MediaWikiLanguage[]>([]);
  const { favourites, toggle: toggleFavourite, has: isFavourite } = useFavouriteLanguages();

  useEffect(() => {
    getSuggestedLanguages(preferredLang)
      .then(setSuggested)
      .catch(() => setSuggested(["en", "es", "fr"]));
  }, [preferredLang]);

  useEffect(() => {
    getAllMediaWikiLanguages()
      .then(setAllLanguages)
      .catch(() => setAllLanguages([]));
  }, []);

  function addLanguage(code: string) {
    if (selectedLanguages.includes(code)) return;
    onLanguagesChange([...selectedLanguages, code]);
  }

  function removeLanguage(code: string) {
    onLanguagesChange(selectedLanguages.filter((l) => l !== code));
  }

  const codeToName = useMemo(() => {
    const m = new Map<string, string>();
    for (const l of allLanguages) m.set(l.code, l.name);
    return m;
  }, [allLanguages]);

  const languageName = (code: string) => codeToName.get(code) ?? code;

  /** Chips: selected languages + favourites (favourites always appear in captions, so show as "added" here too) */
  const displayChipLanguages = [
    ...selectedLanguages,
    ...favourites.filter((f) => !selectedLanguages.includes(f)),
  ];

  const allLanguageOptions =
    allLanguages.length > 0
      ? allLanguages
      : [
          { code: "en", name: "English" },
          { code: "es", name: "Spanish" },
          { code: "fr", name: "French" },
        ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {displayChipLanguages.map((code) => {
          const isSelected = selectedLanguages.includes(code);
          const isFavOnly = isFavourite(code) && !isSelected;
          return (
            <span
              key={code}
              className="inline-flex items-center gap-1 rounded-md border bg-muted px-2 py-1 text-sm"
            >
              {isFavOnly && (
                <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-500" aria-hidden />
              )}
              {languageName(code)} ({code})
              {isSelected ? (
                <button
                  type="button"
                  aria-label={`Remove ${code}`}
                  className="ml-1 rounded hover:bg-muted-foreground/20"
                  onClick={() => removeLanguage(code)}
                >
                  <X className="h-3 w-3" />
                </button>
              ) : null}
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
              Your selection is at the top—star any row to favourite it, click the row to remove from
              selection. Below: click to add, star to favourite.
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
                      >
                        <span className="flex-1">
                          {languageName(code)} ({code})
                        </span>
                        {!isDefault && (
                          <button
                            type="button"
                            aria-label={
                              isFavourite(code)
                                ? "Remove from favourites"
                                : "Add to favourites"
                            }
                            className="rounded p-0.5 hover:bg-muted"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleFavourite(code);
                            }}
                          >
                            <Star
                              className={`h-4 w-4 ${
                                isFavourite(code)
                                  ? "fill-amber-400 text-amber-500"
                                  : "text-muted-foreground"
                              }`}
                              aria-hidden
                            />
                          </button>
                        )}
                        <span className="text-muted-foreground text-xs ml-1">
                          click row to remove
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
              {favourites.length > 0 && (
                <CommandGroup heading="Favourites">
                  {favourites.map((code) => (
                    <CommandItem
                      key={code}
                      value={`fav ${code} ${languageName(code)}`}
                      onSelect={() => addLanguage(code)}
                    >
                      <span className="flex-1">
                        {languageName(code)} ({code})
                      </span>
                      <button
                        type="button"
                        aria-label="Remove from favourites"
                        className="rounded p-0.5 hover:bg-muted"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavourite(code);
                        }}
                      >
                        <Star className="h-4 w-4 fill-amber-400 text-amber-500" aria-hidden />
                      </button>
                      {selectedLanguages.includes(code) && (
                        <span className="ml-2 text-muted-foreground text-xs">added</span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              <CommandGroup heading="Suggested (from your preference)">
                {suggested
                  .slice(0, 6)
                  .filter((code) => !selectedLanguages.includes(code))
                  .map((code) => {
                  const isDefault = isDefaultLanguage(code);
                  return (
                    <CommandItem
                      key={code}
                      value={`${code} ${languageName(code)}`}
                      onSelect={() => addLanguage(code)}
                    >
                      <span className="flex-1">
                        {languageName(code)} ({code})
                      </span>
                      {!isDefault && (
                        <button
                          type="button"
                          aria-label={
                            isFavourite(code) ? "Remove from favourites" : "Add to favourites"
                          }
                          className="rounded p-0.5 hover:bg-muted"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavourite(code);
                          }}
                        >
                          <Star
                            className={`h-4 w-4 ${isFavourite(code) ? "fill-amber-400 text-amber-500" : "text-muted-foreground"}`}
                            aria-hidden
                          />
                        </button>
                      )}
                      {selectedLanguages.includes(code) && (
                        <span className="ml-2 text-muted-foreground text-xs">added</span>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandGroup heading="All">
                {allLanguageOptions
                  .filter(
                    (l) => !suggested.includes(l.code) && !selectedLanguages.includes(l.code)
                  )
                  .map(({ code, name }) => {
                    const isDefault = isDefaultLanguage(code);
                    return (
                      <CommandItem
                        key={code}
                        value={`${code} ${name}`}
                        onSelect={() => addLanguage(code)}
                      >
                        <span className="flex-1">
                          {name} ({code})
                        </span>
                        {!isDefault && (
                          <button
                            type="button"
                            aria-label={
                              isFavourite(code) ? "Remove from favourites" : "Add to favourites"
                            }
                            className="rounded p-0.5 hover:bg-muted"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleFavourite(code);
                            }}
                          >
                            <Star
                              className={`h-4 w-4 ${isFavourite(code) ? "fill-amber-400 text-amber-500" : "text-muted-foreground"}`}
                              aria-hidden
                            />
                          </button>
                        )}
                        {selectedLanguages.includes(code) && (
                          <span className="ml-2 text-muted-foreground text-xs">added</span>
                        )}
                      </CommandItem>
                    );
                  })}
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
