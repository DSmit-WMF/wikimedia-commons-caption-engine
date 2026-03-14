import OpenAI from "openai";
import { config } from "../config.js";
import { translateCaptions as translateCaptionsCore } from "../caption_engine/translate.js";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!config.openaiApiKey) {
    throw new Error("OpenAI API key not configured");
  }
  if (!client) {
    client = new OpenAI({ apiKey: config.openaiApiKey });
  }
  return client;
}

export interface TranslateParams {
  sourceText: string;
  sourceLang: string;
  targetLangs: string[];
  descriptionContext?: string;
}

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
