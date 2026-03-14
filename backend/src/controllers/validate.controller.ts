import * as validationService from "../services/validation.service.js";

import { Request, Response } from "express";

import { validateCaptionSchema } from "../api/schemas.js";

export async function validateCaption(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = validateCaptionSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Invalid body", details: parsed.error.flatten() });
    return;
  }
  const result = validationService.validateCaption(parsed.data.text);
  res.json(result);
}
