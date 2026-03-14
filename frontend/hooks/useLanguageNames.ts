"use client";

import { useCallback, useMemo } from "react";

import { getAllMediaWikiLanguages } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

/**
 * Hook that provides language code → display name (native and English) from the MediaWiki API.
 * Used for caption row labels and placeholders (e.g. "中文 (Chinese - zh)").
 */
export function useLanguageNames() {
  const { data: list = [] } = useQuery({
    queryKey: ["mediawiki-languages"],
    queryFn: ({ signal }) => getAllMediaWikiLanguages({ signal }),
  });

  const { languageNames, languageNamesEn } = useMemo(() => {
    const nameMap: Record<string, string> = {};
    const nameEnMap: Record<string, string> = {};
    for (const { code, name, nameEn } of list) {
      nameMap[code] = name;
      if (nameEn) nameEnMap[code] = nameEn;
    }
    return { languageNames: nameMap, languageNamesEn: nameEnMap };
  }, [list]);

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
