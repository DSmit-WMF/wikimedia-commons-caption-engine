const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

export interface CaptionItem {
  lang: string;
  text: string;
}

export async function translateCaptions(
  captions: CaptionItem[],
  targetLangs: string[],
  descriptionContext?: string,
): Promise<CaptionItem[]> {
  const body: { captions: CaptionItem[]; target_langs: string[]; description_context?: string } = {
    captions,
    target_langs: targetLangs,
  };
  if (descriptionContext?.trim()) body.description_context = descriptionContext.trim();
  const res = await fetch(`${API_URL}/api/translate-captions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Translation failed");
  }
  const data = await res.json();
  return data.captions ?? [];
}

export async function validateCaption(text: string, lang?: string): Promise<{ valid: boolean; warnings: string[] }> {
  const res = await fetch(`${API_URL}/api/validate-caption`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, lang }),
  });
  if (!res.ok) throw new Error("Validation failed");
  return res.json();
}

export async function getSuggestedLanguages(preferredLang: string): Promise<string[]> {
  const res = await fetch(
    `${API_URL}/api/languages?preferred_lang=${encodeURIComponent(preferredLang)}`
  );
  if (!res.ok) return [preferredLang, "en", "es", "fr"];
  const data = await res.json();
  return data.languages ?? [preferredLang, "en", "es", "fr"];
}

export interface MediaWikiLanguage {
  code: string;
  bcp47?: string;
  /** Native name (autonym). */
  name: string;
  /** English name from API (languageinfo uselang=en). */
  nameEn?: string;
}

export async function getAllMediaWikiLanguages(): Promise<MediaWikiLanguage[]> {
  const res = await fetch(`${API_URL}/api/languages/all`);
  if (!res.ok) {
    // Minimal fallback (still usable UI)
    return [
      { code: "en", name: "English" },
      { code: "es", name: "Spanish" },
      { code: "fr", name: "French" },
    ];
  }
  const data = await res.json();
  const list = (data.languages ?? []) as MediaWikiLanguage[];
  return list;
}

/** Saves captions to Commons. The server uses COMMONS_OAUTH_TOKEN from env; no token is sent from the client. */
export async function saveCaptionsToCommons(
  fileIdentifier: string,
  captions: CaptionItem[]
): Promise<{ success: boolean; media_info_id?: string }> {
  const res = await fetch(`${API_URL}/api/commons/save-captions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_identifier: fileIdentifier, captions }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Save failed");
  return data;
}

export async function getRandomCommonsFile(): Promise<{
  url: string;
  title: string;
} | null> {
  const res = await fetch(`${API_URL}/api/commons/random-file`);
  if (!res.ok) return null;
  return res.json();
}

export async function getCommonsFileInfo(urlOrTitle: string): Promise<{
  title: string;
  media_info_id: string;
  labels: Record<string, string>;
  descriptions?: Record<string, string>;
  image_url?: string | null;
} | null> {
  const isUrl = urlOrTitle.startsWith("http");
  const params = new URLSearchParams(isUrl ? { url: urlOrTitle } : { title: urlOrTitle });
  const res = await fetch(`${API_URL}/api/commons/file-info?${params}`);
  if (!res.ok) return null;
  return res.json();
}
