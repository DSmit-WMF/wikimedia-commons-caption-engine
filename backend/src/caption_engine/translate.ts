import OpenAI from "openai";
import {
  translationUserPrompt,
  LANGUAGE_NAMES,
} from "./prompts.js";

/**
 * Translate a caption into target languages using OpenAI.
 * Optional descriptionContext (e.g. Commons Summary description) improves translation accuracy.
 */
export async function translateCaptions(
  client: OpenAI,
  sourceCaption: string,
  sourceLang: string,
  targetLangs: string[],
  descriptionContext?: string,
): Promise<{ lang: string; text: string }[]> {
  const results: { lang: string; text: string }[] = [];
  const langName = (lang: string) => LANGUAGE_NAMES[lang] ?? lang;

  for (const lang of targetLangs) {
    if (lang === sourceLang) {
      results.push({ lang, text: sourceCaption });
      continue;
    }
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: `${translationUserPrompt(lang, langName(lang), descriptionContext)}\n\nCaption: ${sourceCaption}`,
        },
      ],
    });
    const text =
      response.choices[0]?.message?.content?.trim().replace(/^["']|["']$/g, "") ?? sourceCaption;
    results.push({ lang, text });
  }

  return results;
}
