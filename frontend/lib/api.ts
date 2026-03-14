const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface CaptionPreviewResult {
  caption: string;
  warnings: string[];
}

export interface CaptionItem {
  lang: string;
  text: string;
}

export async function captionPreview(
  file?: File,
  imageUrl?: string,
  sourceLang: string = "en"
): Promise<CaptionPreviewResult> {
  if (file) {
    const form = new FormData();
    form.append("file", file);
    form.append("source_lang", sourceLang);
    const res = await fetch(`${API_URL}/api/caption-preview`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error ?? "Caption preview failed");
    }
    return res.json();
  }
  if (imageUrl) {
    const res = await fetch(`${API_URL}/api/caption-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl, source_lang: sourceLang }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error ?? "Caption preview failed");
    }
    return res.json();
  }
  throw new Error("Provide file or image_url");
}

export async function translateCaptions(
  captions: CaptionItem[],
  targetLangs: string[]
): Promise<CaptionItem[]> {
  const res = await fetch(`${API_URL}/api/translate-captions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ captions, target_langs: targetLangs }),
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

export async function saveCaptionsToCommons(
  fileIdentifier: string,
  captions: CaptionItem[],
  oauthToken: string
): Promise<{ success: boolean; media_info_id?: string }> {
  const res = await fetch(`${API_URL}/api/commons/save-captions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${oauthToken}`,
    },
    body: JSON.stringify({ file_identifier: fileIdentifier, captions }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Save failed");
  return data;
}

export async function getCommonsFileInfo(urlOrTitle: string): Promise<{
  title: string;
  media_info_id: string;
  labels: Record<string, string>;
} | null> {
  const isUrl = urlOrTitle.startsWith("http");
  const params = new URLSearchParams(isUrl ? { url: urlOrTitle } : { title: urlOrTitle });
  const res = await fetch(`${API_URL}/api/commons/file-info?${params}`);
  if (!res.ok) return null;
  return res.json();
}
