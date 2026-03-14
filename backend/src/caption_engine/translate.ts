import { LANGUAGE_NAMES, translationUserPrompt } from "./prompts.js";

import OpenAI from "openai";
import { config } from "../config.js";

/**
 * Translate a caption into target languages using OpenAI.
 * Uses the Responses API with reasoning.effort "low" so reasoning models (e.g. gpt-5-nano)
 * leave room for visible output text.
 * Optional descriptionContext (e.g. Commons Summary description) improves translation accuracy.
 */
export async function translateCaptions(
  client: OpenAI,
  sourceCaption: string,
  sourceLang: string,
  targetLangs: string[],
  descriptionContext?: string
): Promise<{ lang: string; text: string }[]> {
  const results: { lang: string; text: string }[] = [];
  const langName = (lang: string) => LANGUAGE_NAMES[lang] ?? lang;

  for (const lang of targetLangs) {
    if (lang === sourceLang) {
      results.push({ lang, text: sourceCaption });
      continue;
    }
    const prompt = `${translationUserPrompt(lang, langName(lang), descriptionContext)}\n\nCaption: ${sourceCaption}`;
    const response = await client.responses.create({
      model: config.openaiModel,
      input: [{ role: "user", content: prompt }],
      reasoning: { effort: "low" },
      max_output_tokens: config.openaiMaxCompletionTokens,
    });
    const raw = response.output_text?.trim().replace(/^["']|["']$/g, "") ?? sourceCaption;
    results.push({ lang, text: raw });
  }

  return results;
}
