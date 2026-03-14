const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

/**
 * Shared options for API calls that support cancellation.
 */
export interface FetchOptions {
  /** Pass to fetch() to allow aborting the request (e.g. when navigating away). */
  signal?: AbortSignal;
}

/** Single caption: language code and text. */
export interface CaptionItem {
  lang: string;
  text: string;
}

/**
 * POST JSON to a backend endpoint and return parsed JSON. Throws on non-OK response.
 * @param path - API path (e.g. "/api/translate-captions"), no leading slash on API_URL
 * @param body - Object to send as JSON body
 * @param options - Optional signal for abort
 * @param errorMessage - Message to throw when res.ok is false (or parsed from response)
 */
async function postJson<T>(
  path: string,
  body: object,
  options?: FetchOptions,
  errorMessage = "Request failed"
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: options?.signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? errorMessage);
  return data as T;
}

/**
 * GET a JSON endpoint. Throws on non-OK unless a fallback is returned by the caller.
 */
async function getJson<T>(path: string, options?: FetchOptions): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { signal: options?.signal });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

/**
 * Translates source captions into the given target languages via the backend OpenAI integration.
 * @param captions - Source caption(s); first item is used as source
 * @param targetLangs - Language codes to translate into (e.g. ["nl", "de"])
 * @param descriptionContext - Optional Commons description to improve translation
 * @param options - Optional abort signal
 * @returns Array of { lang, text } for each target language
 */
export async function translateCaptions(
  captions: CaptionItem[],
  targetLangs: string[],
  descriptionContext?: string,
  options?: FetchOptions
): Promise<CaptionItem[]> {
  const body: { captions: CaptionItem[]; target_langs: string[]; description_context?: string } = {
    captions,
    target_langs: targetLangs,
  };
  if (descriptionContext?.trim()) body.description_context = descriptionContext.trim();
  const data = await postJson<{ captions?: CaptionItem[] }>(
    "/api/translate-captions",
    body,
    options,
    "Translation failed"
  );
  return data.captions ?? [];
}

/**
 * Validates caption text (length, no speculation, etc.) for a given language.
 * @returns valid flag and list of warning messages
 */
export async function validateCaption(
  text: string,
  lang?: string
): Promise<{ valid: boolean; warnings: string[] }> {
  return postJson<{ valid: boolean; warnings: string[] }>(
    "/api/validate-caption",
    { text, lang },
    undefined,
    "Validation failed"
  );
}

/**
 * Fetches suggested language codes for the language picker (e.g. based on browser/preferred lang).
 */
export async function getSuggestedLanguages(
  preferredLang: string,
  options?: FetchOptions
): Promise<string[]> {
  try {
    const data = await getJson<{ languages?: string[] }>(
      `/api/languages?preferred_lang=${encodeURIComponent(preferredLang)}`,
      options
    );
    return data.languages ?? [preferredLang, "en", "es", "fr"];
  } catch {
    return [preferredLang, "en", "es", "fr"];
  }
}

/** Language entry from MediaWiki languageinfo API (native name, optional English name). */
export interface MediaWikiLanguage {
  code: string;
  bcp47?: string;
  /** Native name (autonym). */
  name: string;
  /** English name from API (languageinfo uselang=en). */
  nameEn?: string;
}

/**
 * Fetches all MediaWiki languages for the language picker (code + native/English names).
 */
export async function getAllMediaWikiLanguages(
  options?: FetchOptions
): Promise<MediaWikiLanguage[]> {
  try {
    const data = await getJson<{ languages?: MediaWikiLanguage[] }>("/api/languages/all", options);
    return data.languages ?? [];
  } catch {
    return [
      { code: "en", name: "English" },
      { code: "es", name: "Spanish" },
      { code: "fr", name: "French" },
    ];
  }
}

/** Options for saveCaptionsToCommons (e.g. per-user OAuth token). */
export interface SaveCaptionsOptions {
  /** Per-user OAuth token. If omitted, backend uses COMMONS_OAUTH_TOKEN (owner-only). */
  accessToken?: string | null;
}

/**
 * Saves captions to Wikimedia Commons for the given file.
 * Uses owner-only token from env unless options.accessToken is provided (per-user OAuth).
 */
export async function saveCaptionsToCommons(
  fileIdentifier: string,
  captions: CaptionItem[],
  options?: SaveCaptionsOptions
): Promise<{ success: boolean; media_info_id?: string }> {
  const body: {
    file_identifier: string;
    captions: CaptionItem[];
    oauth_token?: string;
  } = { file_identifier: fileIdentifier, captions };
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options?.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
    body.oauth_token = options.accessToken;
  }
  const res = await fetch(`${API_URL}/api/commons/save-captions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Save failed");
  return data as { success: boolean; media_info_id?: string };
}

/**
 * Fetches a random Commons file that has structured-data captions (for "Random image").
 */
export async function getRandomCommonsFile(): Promise<{
  url: string;
  title: string;
} | null> {
  const res = await fetch(`${API_URL}/api/commons/random-file`);
  if (!res.ok) return null;
  return res.json();
}

/** File metadata from Commons (labels, descriptions, image URL). */
export interface CommonsFileInfo {
  title: string;
  media_info_id: string;
  labels: Record<string, string>;
  descriptions?: Record<string, string>;
  /** Description from the file page (Information template / Summary). Used as translation context. */
  page_description?: string | null;
  image_url?: string | null;
}

/**
 * Fetches file info and existing captions for a Commons file by URL or File: title.
 */
export async function getCommonsFileInfo(
  urlOrTitle: string,
  options?: FetchOptions
): Promise<CommonsFileInfo | null> {
  const isUrl = urlOrTitle.startsWith("http");
  const params = new URLSearchParams(isUrl ? { url: urlOrTitle } : { title: urlOrTitle });
  const res = await fetch(`${API_URL}/api/commons/file-info?${params}`, {
    signal: options?.signal,
  });
  if (!res.ok) return null;
  return res.json();
}

/** Result for one file in a batch file-info request. */
export interface BatchFileInfoItem {
  identifier: string;
  success: boolean;
  file_info?: CommonsFileInfo;
  error?: string;
}

/**
 * Fetches file info for multiple Commons URLs/titles in one request (max 50).
 */
export async function getBatchFileInfo(
  identifiers: string[],
  options?: FetchOptions
): Promise<BatchFileInfoItem[]> {
  const data = await postJson<{ results?: BatchFileInfoItem[] }>(
    "/api/commons/batch-file-info",
    { identifiers },
    options,
    "Batch load failed"
  );
  return data.results ?? [];
}
