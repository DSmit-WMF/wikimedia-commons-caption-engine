import axios from "axios";
import { WIKIMEDIA_USER_AGENT } from "../config.js";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const commonsHeaders = { "User-Agent": WIKIMEDIA_USER_AGENT };

/**
 * Check if URL is a Commons wiki page (e.g. https://commons.wikimedia.org/wiki/File:Example.jpg).
 * Such URLs return HTML; we need to resolve to the direct image URL for fetching bytes.
 */
export function isCommonsWikiPageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname.includes("commons.wikimedia.org") && u.pathname.startsWith("/wiki/");
  } catch {
    return false;
  }
}

/**
 * Resolve a Commons wiki page URL to the direct image URL (for fetching image bytes).
 * Uses Commons API action=query&prop=imageinfo&iiprop=url.
 */
export async function resolveCommonsPageToImageUrl(wikiPageUrl: string): Promise<string | null> {
  const title = extractTitleFromUrl(wikiPageUrl);
  if (!title) return null;
  const fileTitle = title.startsWith("File:") || title.startsWith("Image:") ? title.replace(/^Image:/i, "File:") : "File:" + title;
  const params = new URLSearchParams({
    action: "query",
    titles: fileTitle,
    prop: "imageinfo",
    iiprop: "url",
    format: "json",
    origin: "*",
  });
  const res = await axios.get(COMMONS_API, { params, headers: commonsHeaders });
  const pages = res.data?.query?.pages ?? {};
  const page = Object.values(pages)[0] as { imageinfo?: { url?: string }[] } | undefined;
  const url = page?.imageinfo?.[0]?.url;
  return url ?? null;
}

function extractTitleFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("commons.wikimedia.org") && u.pathname.includes("/wiki/")) {
      const title = decodeURIComponent(u.pathname.replace(/^\/wiki\//, ""));
      return title || null;
    }
  } catch {
    // ignore
  }
  return null;
}

function normalizeTitle(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith("File:") || trimmed.startsWith("Image:")) {
    return trimmed.replace(/^Image:/i, "File:");
  }
  return "File:" + trimmed;
}

export interface FileInfo {
  title: string;
  media_info_id: string;
  labels: Record<string, string>;
}

/**
 * Resolve a Commons file URL or title to file info (title, MediaInfo ID, existing labels).
 */
export async function getFileInfo(identifier: string): Promise<FileInfo | null> {
  const title =
    identifier.startsWith("http") ? extractTitleFromUrl(identifier) : identifier;
  const fileTitle = title ? normalizeTitle(title) : normalizeTitle(identifier);

  const params = new URLSearchParams({
    action: "query",
    titles: fileTitle,
    prop: "pageprops",
    ppprop: "wikibase_item",
    format: "json",
    origin: "*",
  });

  const res = await axios.get(COMMONS_API, { params, headers: commonsHeaders });
  const pages = res.data?.query?.pages ?? {};
  const page = Object.values(pages)[0] as {
    pageid?: number;
    ns?: number;
    title?: string;
    pageprops?: { wikibase_item?: string };
    missing?: boolean;
  } | undefined;
  if (!page || page.missing) {
    return null;
  }
  // On Commons, File pages (ns=6) use MediaInfo ID = "M" + pageid when pageprops.wikibase_item is not set.
  const mediaInfoId =
    page.pageprops?.wikibase_item ?? (page.pageid != null && page.ns === 6 ? `M${page.pageid}` : null);
  if (!mediaInfoId) {
    return null;
  }
  const labels = await fetchLabels(mediaInfoId);
  return {
    title: page.title ?? fileTitle,
    media_info_id: mediaInfoId,
    labels: labels ?? {},
  };
}

async function fetchLabels(mediaInfoId: string): Promise<Record<string, string>> {
  const params = new URLSearchParams({
    action: "wbgetentities",
    ids: mediaInfoId,
    format: "json",
    origin: "*",
  });
  const res = await axios.get(COMMONS_API, { params, headers: commonsHeaders });
  const entities = res.data?.entities?.[mediaInfoId];
  const labelObj = entities?.labels ?? {};
  const out: Record<string, string> = {};
  for (const [lang, obj] of Object.entries(labelObj)) {
    if (obj && typeof obj === "object" && "value" in obj) {
      out[lang] = (obj as { value: string }).value;
    }
  }
  return out;
}
