import axios from "axios";
import { WIKIMEDIA_USER_AGENT } from "../config.js";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

const commonsHeaders = { "User-Agent": WIKIMEDIA_USER_AGENT };

export interface MediaWikiLanguage {
  code: string;
  bcp47?: string;
  name: string;
}

let cached: { atMs: number; languages: MediaWikiLanguage[] } | null = null;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export async function fetchAllLanguages(): Promise<MediaWikiLanguage[]> {
  const now = Date.now();
  if (cached && now - cached.atMs < CACHE_TTL_MS) return cached.languages;

  const res = await axios.get(COMMONS_API, {
    params: {
      action: "query",
      meta: "siteinfo",
      siprop: "languages",
      format: "json",
      formatversion: 2,
      origin: "*",
    },
    headers: commonsHeaders,
  });

  const langs = (res.data?.query?.languages ?? []) as Array<{
    code: string;
    bcp47?: string;
    name: string;
  }>;

  // Ensure stable ordering and shape
  const normalized: MediaWikiLanguage[] = langs
    .filter((l) => l?.code && l?.name)
    .map((l) => ({ code: l.code, bcp47: l.bcp47, name: l.name }))
    .sort((a, b) => a.code.localeCompare(b.code));

  cached = { atMs: now, languages: normalized };
  return normalized;
}

