import axios from "axios";
import { WIKIMEDIA_USER_AGENT } from "../config.js";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

const commonsHeaders = { "User-Agent": WIKIMEDIA_USER_AGENT };

export interface MediaWikiLanguage {
  code: string;
  bcp47?: string;
  /** Native name (autonym). */
  name: string;
  /** English name from languageinfo with uselang=en. */
  nameEn?: string;
}

let cached: { atMs: number; languages: MediaWikiLanguage[] } | null = null;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * Fetches all languages with native and English names from the languageinfo API.
 */
export async function fetchAllLanguages(): Promise<MediaWikiLanguage[]> {
  const now = Date.now();
  if (cached && now - cached.atMs < CACHE_TTL_MS) return cached.languages;

  const res = await axios.get(COMMONS_API, {
    params: {
      action: "query",
      meta: "languageinfo",
      liprop: "name|autonym",
      uselang: "en",
      format: "json",
      formatversion: 2,
      origin: "*",
    },
    headers: commonsHeaders,
  });

  const info = (res.data?.query?.languageinfo ?? {}) as Record<
    string,
    { name?: string; autonym?: string }
  >;

  const normalized: MediaWikiLanguage[] = Object.entries(info)
    .filter(([code, v]) => code && (v?.name ?? v?.autonym))
    .map(([code, v]) => ({
      code,
      name: v.autonym?.trim() || v.name?.trim() || code,
      nameEn: v.name?.trim() || undefined,
    }))
    .sort((a, b) => a.code.localeCompare(b.code));

  cached = { atMs: now, languages: normalized };
  return normalized;
}
