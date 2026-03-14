import { Router, Request, Response } from "express";
import OpenAI from "openai";
import { validateCaption, translateCaptions } from "../caption_engine/index.js";
import {
  translateCaptionsSchema,
  validateCaptionSchema,
  saveCaptionsSchema,
} from "./schemas.js";
import { getSuggestedLanguages } from "./languages.js";
import { config } from "../config.js";
import { fetchAllLanguages } from "./mediawiki_languages.js";

const router = Router();
const openai = config.openaiApiKey ? new OpenAI({ apiKey: config.openaiApiKey }) : null;

router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

router.get("/languages", (req: Request, res: Response) => {
  const preferred = (req.query.preferred_lang as string) || "en";
  const langs = getSuggestedLanguages(preferred);
  res.json({ languages: langs });
});

router.get("/languages/all", async (_req: Request, res: Response) => {
  try {
    const languages = await fetchAllLanguages();
    res.json({ languages });
  } catch (err: unknown) {
    console.error("languages/all error", err);
    res.status(502).json({ error: "Failed to fetch MediaWiki languages" });
  }
});

router.post("/translate-captions", async (req: Request, res: Response) => {
  try {
    if (!openai) {
      res.status(503).json({ error: "OpenAI API key not configured" });
      return;
    }
    const body = translateCaptionsSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: "Invalid body", details: body.error.flatten() });
      return;
    }
    const { captions, target_langs } = body.data;
    const source = captions[0];
    if (!source) {
      res.status(400).json({ error: "At least one caption required" });
      return;
    }
    const results = await translateCaptions(
      openai,
      source.text,
      source.lang,
      target_langs
    );
    res.json({ captions: results });
  } catch (err: unknown) {
    console.error("translate-captions error", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Translation failed",
    });
  }
});

router.post("/validate-caption", async (req: Request, res: Response) => {
  const body = validateCaptionSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid body", details: body.error.flatten() });
    return;
  }
  const result = validateCaption(body.data.text);
  res.json(result);
});

router.post("/commons/save-captions", async (req: Request, res: Response) => {
  const body = saveCaptionsSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid body", details: body.error.flatten() });
    return;
  }
  if (!config.commonsOAuthToken) {
    res.status(503).json({ error: "Commons OAuth token not configured" });
    return;
  }
  try {
    const { resolveFileToMediaInfoId, saveLabels } = await import(
      "../commons_adapter/captions.js"
    );
    const fileId = await resolveFileToMediaInfoId(body.data.file_identifier);
    if (!fileId) {
      res.status(404).json({ error: "File or MediaInfo not found" });
      return;
    }
    await saveLabels(fileId, body.data.captions, config.commonsOAuthToken);
    res.json({ success: true, media_info_id: fileId });
  } catch (err: unknown) {
    console.error("save-captions error", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Save to Commons failed",
    });
  }
});

router.get("/commons/file-info", async (req: Request, res: Response) => {
  const url = req.query.url as string | undefined;
  const title = req.query.title as string | undefined;
  const identifier = url || title;
  if (!identifier) {
    res.status(400).json({ error: "Provide url or title" });
    return;
  }
  try {
    const { getFileInfo } = await import("../commons_adapter/resolve.js");
    const info = await getFileInfo(identifier);
    if (!info) {
      res.status(404).json({ error: "File not found" });
      return;
    }
    res.json(info);
  } catch (err: unknown) {
    console.error("file-info error", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to get file info",
    });
  }
});

export default router;
