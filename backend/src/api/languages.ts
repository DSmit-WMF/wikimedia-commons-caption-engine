/**
 * Build prioritized language list: preferred + fallbacks + en, es, fr. De-duplicated, max 6.
 */
const STATIC_FALLBACKS: Record<string, string[]> = {
  "pt-br": ["pt"],
  "en-gb": ["en"],
  "en-us": ["en"],
  "zh-hans": ["zh"],
  "zh-hant": ["zh"],
};

const ALWAYS_INCLUDE = ["en", "es", "fr", "ar", "zh"];

export function getSuggestedLanguages(preferredLang: string, maxLanguages: number = 6): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  function add(lang: string) {
    if (seen.has(lang) || result.length >= maxLanguages) return;
    seen.add(lang);
    result.push(lang);
  }

  add(preferredLang);
  const fallbacks = STATIC_FALLBACKS[preferredLang] ?? [];
  for (const f of fallbacks) add(f);
  for (const lang of ALWAYS_INCLUDE) add(lang);

  return result;
}
