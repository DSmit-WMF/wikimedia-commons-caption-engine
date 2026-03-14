import * as commonsService from "../services/commons.service.js";

import { Request, Response } from "express";
import { batchFileInfoSchema, saveCaptionsSchema } from "../api/schemas.js";

import { config } from "../config.js";

export async function getFileInfo(req: Request, res: Response): Promise<void> {
  const url = req.query.url as string | undefined;
  const title = req.query.title as string | undefined;
  const identifier = url || title;
  if (!identifier) {
    res.status(400).json({ error: "Provide url or title" });
    return;
  }
  const info = await commonsService.getFileInfo(identifier);
  if (!info) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  res.json(info);
}

export async function getRandomFile(_req: Request, res: Response): Promise<void> {
  const result = await commonsService.getRandomFileWithLabels();
  if (!result) {
    res.status(404).json({
      error: "No random file with labels found after several tries",
    });
    return;
  }
  res.json(result);
}

export async function batchFileInfo(req: Request, res: Response): Promise<void> {
  const parsed = batchFileInfoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
    return;
  }
  const results = await commonsService.batchGetFileInfo(parsed.data.identifiers);
  res.json({ results });
}

export async function saveCaptions(req: Request, res: Response): Promise<void> {
  const parsed = saveCaptionsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
    return;
  }
  const bearer = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  const token = parsed.data.oauth_token ?? bearer ?? config.commonsOAuthToken;
  if (!token) {
    res.status(503).json({
      error:
        "No OAuth token: set COMMONS_OAUTH_TOKEN (owner-only) or send Authorization: Bearer <token> / oauth_token in body (per-user).",
    });
    return;
  }
  const fileId = await commonsService.resolveFileToMediaInfoId(parsed.data.file_identifier);
  if (!fileId) {
    res.status(404).json({ error: "File or MediaInfo not found" });
    return;
  }
  await commonsService.saveCaptions(fileId, parsed.data.captions, token);
  res.json({ success: true, media_info_id: fileId });
}
