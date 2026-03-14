import axios from "axios";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

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

  const res = await axios.get(COMMONS_API, { params });
  const pages = res.data?.query?.pages ?? {};
  const page = Object.values(pages)[0] as { pageprops?: { wikibase_item?: string }; title?: string } | undefined;
  if (!page || page.pageprops?.wikibase_item === undefined) {
    return null;
  }

  const mediaInfoId = page.pageprops.wikibase_item; // M123 format on Commons
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
  const res = await axios.get(COMMONS_API, { params });
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
