"use client";

import { useCallback, useEffect, useState } from "react";

import { getAllMediaWikiLanguages } from "@/lib/api";

export function useLanguageNames() {
  const [languageNames, setLanguageNames] = useState<Record<string, string>>({});
  const [languageNamesEn, setLanguageNamesEn] = useState<Record<string, string>>({});

  useEffect(() => {
    getAllMediaWikiLanguages().then((list) => {
      const nameMap: Record<string, string> = {};
      const nameEnMap: Record<string, string> = {};
      for (const { code, name, nameEn } of list) {
        nameMap[code] = name;
        if (nameEn) nameEnMap[code] = nameEn;
      }
      setLanguageNames(nameMap);
      setLanguageNamesEn(nameEnMap);
    });
  }, []);

  const displayName = useCallback((code: string) => languageNames[code] || code, [languageNames]);
  const englishName = useCallback((code: string) => languageNamesEn[code], [languageNamesEn]);

  const getLabelText = useCallback(
    (code: string) => {
      const name = languageNames[code] || code;
      const en = languageNamesEn[code];
      return en ? `${name} (${en} - ${code})` : `${name} (${code})`;
    },
    [languageNames, languageNamesEn]
  );

  const getPlaceholderText = useCallback(
    (code: string) => `Caption in ${getLabelText(code)}`,
    [getLabelText]
  );

  return { getLabelText, getPlaceholderText, displayName, englishName };
}
