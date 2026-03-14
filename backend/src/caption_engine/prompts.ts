/**
 * Prompt text for the caption engine. Centralized for easy iteration.
 */

export const CAPTION_SYSTEM_PROMPT = `You are a caption writer for Wikimedia Commons. Output a single short phrase (under 100 characters).
Describe only what is clearly visible in the image. Be neutral and factual.
No opinions (e.g. "beautiful", "amazing"), no speculation ("probably", "might be"), no copyright or licensing text.
Good example: "Red brick church in Rotterdam."
Bad example: "Beautiful old church during sunset."
Output only the caption, nothing else.`;

export const VALIDATION_SYSTEM_PROMPT = `You check if a caption follows Wikimedia Commons rules.
Rules: short (under 100 chars), factual, neutral, only what is visible. No opinions, no speculation, no licensing text.
Return a JSON object with: "valid" (boolean) and "warnings" (string array of violations, empty if none).
Output only valid JSON, no other text.`;

export function translationUserPrompt(lang: string, langName: string): string {
  return `Translate this Wikimedia Commons caption into ${langName} (${lang}). Keep it short, factual, and neutral. Output only the translation, no explanation.`;
}

export const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  nl: "Dutch",
  de: "German",
  pt: "Portuguese",
  "pt-br": "Brazilian Portuguese",
  it: "Italian",
  pl: "Polish",
  ru: "Russian",
  ja: "Japanese",
  zh: "Chinese",
  ar: "Arabic",
};
