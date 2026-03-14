import { CAPTION_SYSTEM_PROMPT } from "./prompts.js";
import OpenAI from "openai";
import { config } from "../config.js";
import { validateCaption } from "./validate.js";

export interface CaptionPreviewResult {
  caption: string;
  warnings: string[];
}

/**
 * Generate a short factual caption from an image using OpenAI vision.
 */
export async function generateCaption(
  client: OpenAI,
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<CaptionPreviewResult> {
  const response = await client.chat.completions.create({
    model: config.openaiModel,
    max_completion_tokens: config.openaiMaxCompletionTokens,
    messages: [
      { role: "system", content: CAPTION_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
  });

  const caption = response.choices[0]?.message?.content?.trim().replace(/^["']|["']$/g, "") ?? "";

  const validation = validateCaption(caption);
  return {
    caption,
    warnings: validation.warnings,
  };
}
