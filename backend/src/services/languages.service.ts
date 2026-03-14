import { fetchAllLanguages } from "../api/mediawiki_languages.js";
import { getSuggestedLanguages } from "../api/languages.js";

export function getSuggested(
  preferredLang: string,
  maxLanguages?: number,
): string[] {
  return getSuggestedLanguages(preferredLang, maxLanguages);
}

export async function getAll() {
  return fetchAllLanguages();
}
