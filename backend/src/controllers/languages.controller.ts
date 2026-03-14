import * as languagesService from "../services/languages.service.js";

import { Request, Response } from "express";

export async function getSuggested(req: Request, res: Response): Promise<void> {
  const preferred = (req.query.preferred_lang as string) || "en";
  const languages = languagesService.getSuggested(preferred);
  res.json({ languages });
}

export async function getAll(_req: Request, res: Response): Promise<void> {
  const languages = await languagesService.getAll();
  res.json({ languages });
}
