import OpenAI from "openai";
import { config } from "../config.js";
import { translateCaptions as translateCaptionsCore } from "../caption_engine/translate.js";

let client: OpenAI | null = null;

/** Returns a singleton OpenAI client; throws if API key is not configured. */
function getClient(): OpenAI {
  if (!config.openaiApiKey) {
    throw new Error("OpenAI API key not configured");
  }
  if (!client) {
    client = new OpenAI({ apiKey: config.openaiApiKey });
  }
  return client;
}

/** Input for the translate service (source caption, target language codes, optional context). */
export interface TranslateParams {
  sourceText: string;
  sourceLang: string;
  targetLangs: string[];
  descriptionContext?: string;
}

/**
 * Translates source text into the given target languages via the caption engine (OpenAI).
 * @returns Array of { lang, text } for each target language
 */
export async function translate(
  params: TranslateParams
): Promise<{ lang: string; text: string }[]> {
  const openai = getClient();
  return translateCaptionsCore(
    openai,
    params.sourceText,
    params.sourceLang,
    params.targetLangs,
    params.descriptionContext
  );
}
