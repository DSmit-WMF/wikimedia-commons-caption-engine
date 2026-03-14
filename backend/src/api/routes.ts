import { Router, Request, Response } from "express";
import multer from "multer";
import OpenAI from "openai";
import {
  generateCaption,
  validateCaption,
  translateCaptions,
} from "../caption_engine/index.js";
import {
  captionPreviewJsonSchema,
  translateCaptionsSchema,
  validateCaptionSchema,
  saveCaptionsSchema,
} from "./schemas.js";
import { getSuggestedLanguages } from "./languages.js";
import { config } from "../config.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const openai = config.openaiApiKey ? new OpenAI({ apiKey: config.openaiApiKey }) : null;

router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

router.get("/languages", (req: Request, res: Response) => {
  const preferred = (req.query.preferred_lang as string) || "en";
  const langs = getSuggestedLanguages(preferred);
  res.json({ languages: langs });
});

router.post("/caption-preview", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!openai) {
      res.status(503).json({ error: "OpenAI API key not configured" });
      return;
    }

    let imageBase64: string;
    let mimeType = "image/jpeg";

    if (req.file) {
      imageBase64 = req.file.buffer.toString("base64");
      mimeType = req.file.mimetype || "image/jpeg";
    } else {
      const body = captionPreviewJsonSchema.safeParse(req.body);
      if (!body.success || !body.data.image_url) {
        res.status(400).json({
          error: "Provide either multipart file or JSON with image_url",
          details: body.error?.flatten(),
        });
        return;
      }
      const url = body.data.image_url;
      const axios = (await import("axios")).default;
      const imgRes = await axios.get(url, { responseType: "arraybuffer" });
      imageBase64 = Buffer.from(imgRes.data).toString("base64");
      mimeType = (imgRes.headers["content-type"] as string) || "image/jpeg";
    }

    const result = await generateCaption(openai, imageBase64, mimeType);
    res.json(result);
  } catch (err: unknown) {
    console.error("caption-preview error", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Caption generation failed",
    });
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
