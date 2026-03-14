"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "caption-engine-favourite-languages";

/** Default languages are always shown; they cannot be favourited. */
export const DEFAULT_LANGUAGE_CODES = ["en", "es", "fr", "ar", "zh"] as const;

export type DefaultLanguageCode = (typeof DEFAULT_LANGUAGE_CODES)[number];

const DEFAULT_SET = new Set<string>(DEFAULT_LANGUAGE_CODES);

export function isDefaultLanguage(code: string): code is DefaultLanguageCode {
  return DEFAULT_SET.has(code);
}

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    const codes = Array.isArray(parsed)
      ? (parsed as string[]).filter((x): x is string => typeof x === "string")
      : [];
    return codes.filter((c) => !isDefaultLanguage(c));
  } catch {
    return [];
  }
}

function write(codes: string[]) {
  if (typeof window === "undefined") return;
  try {
    const filtered = [...new Set(codes)].filter((c) => !isDefaultLanguage(c));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}

export function getFavouriteLanguages(): string[] {
  return read();
}

export function setFavouriteLanguages(codes: string[]): void {
  write(codes);
}

export function addFavouriteLanguage(code: string): void {
  if (isDefaultLanguage(code)) return;
  const next = [...new Set([...read(), code])];
  write(next);
}

export function removeFavouriteLanguage(code: string): void {
  write(read().filter((c) => c !== code));
}

export function isFavouriteLanguage(code: string): boolean {
  return read().includes(code);
}

export interface UseFavouriteLanguagesReturn {
  favourites: string[];
  add: (code: string) => void;
  remove: (code: string) => void;
  toggle: (code: string) => void;
  has: (code: string) => boolean;
}

/** Reactive list of favourite language codes (persisted in localStorage). */
export function useFavouriteLanguages(): UseFavouriteLanguagesReturn {
  const [favourites, setFavourites] = useState<string[]>([]);

  useEffect(() => {
    setFavourites(read());
  }, []);

  const add = useCallback((code: string) => {
    if (isDefaultLanguage(code)) return;
    setFavourites((prev) => {
      const next = [...new Set([...prev, code])];
      write(next);
      return next;
    });
  }, []);

  const remove = useCallback((code: string) => {
    setFavourites((prev) => {
      const next = prev.filter((c) => c !== code);
      write(next);
      return next;
    });
  }, []);

  const toggle = useCallback((code: string) => {
    if (isDefaultLanguage(code)) return;
    setFavourites((prev) => {
      const next = prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code];
      write(next);
      return next;
    });
  }, []);

  const has = useCallback(
    (code: string) => !isDefaultLanguage(code) && favourites.includes(code),
    [favourites]
  );

  return { favourites, add, remove, toggle, has };
}
