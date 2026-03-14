"use client";

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "caption-engine-favourite-languages";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function write(codes: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(codes)]));
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
  const next = [...new Set([...read(), code])];
  write(next);
}

export function removeFavouriteLanguage(code: string): void {
  write(read().filter((c) => c !== code));
}

export function isFavouriteLanguage(code: string): boolean {
  return read().includes(code);
}

/** Reactive list of favourite language codes (persisted in localStorage). */
export function useFavouriteLanguages(): {
  favourites: string[];
  add: (code: string) => void;
  remove: (code: string) => void;
  toggle: (code: string) => void;
  has: (code: string) => boolean;
} {
  const [favourites, setFavourites] = useState<string[]>([]);

  useEffect(() => {
    setFavourites(read());
  }, []);

  const add = useCallback((code: string) => {
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
    setFavourites((prev) => {
      const next = prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code];
      write(next);
      return next;
    });
  }, []);

  const has = useCallback((code: string) => favourites.includes(code), [favourites]);

  return { favourites, add, remove, toggle, has };
}
