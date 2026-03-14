import * as translationService from "../services/translation.service.js";

import { Request, Response } from "express";

import { config } from "../config.js";
import { translateCaptionsSchema } from "../api/schemas.js";

export async function translateCaptions(
  req: Request,
  res: Response,
): Promise<void> {
  if (!config.openaiApiKey) {
    res.status(503).json({ error: "OpenAI API key not configured" });
    return;
  }
  const parsed = translateCaptionsSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Invalid body", details: parsed.error.flatten() });
    return;
  }
  const { captions, target_langs, description_context } = parsed.data;
  const source = captions[0];
  if (!source) {
    res.status(400).json({ error: "At least one caption required" });
    return;
  }

  const results = await translationService.translate({
    sourceText: source.text,
    sourceLang: source.lang,
    targetLangs: target_langs,
    descriptionContext: description_context,
  });
  res.json({ captions: results });
}
