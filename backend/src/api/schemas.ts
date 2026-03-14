import { z } from "zod";

export const captionPreviewFormSchema = z.object({
  source_lang: z.string().optional().default("en"),
});

export const captionPreviewJsonSchema = z.object({
  image_url: z.string().url().optional(),
  source_lang: z.string().optional().default("en"),
});

export const translateCaptionsSchema = z.object({
  captions: z.array(
    z.object({
      lang: z.string(),
      text: z.string(),
    })
  ),
  target_langs: z.array(z.string()),
  /** Optional longer description (e.g. Commons Summary) to help the AI translate the caption accurately. */
  description_context: z.string().optional(),
});

export const validateCaptionSchema = z.object({
  text: z.string(),
  lang: z.string().optional(),
});

export const saveCaptionsSchema = z.object({
  file_identifier: z.string().min(1),
  captions: z.array(
    z.object({
      lang: z.string(),
      text: z.string(),
    })
  ),
  /** Optional per-user OAuth access token. When provided, used instead of COMMONS_OAUTH_TOKEN. */
  oauth_token: z.string().min(1).optional(),
});

export const batchFileInfoSchema = z.object({
  /** Commons file URLs or page titles (File:...). Max 50. */
  identifiers: z.array(z.string().trim().min(1)).min(1).max(50),
});

export type TranslateCaptionsBody = z.infer<typeof translateCaptionsSchema>;
export type ValidateCaptionBody = z.infer<typeof validateCaptionSchema>;
export type SaveCaptionsBody = z.infer<typeof saveCaptionsSchema>;
export type BatchFileInfoBody = z.infer<typeof batchFileInfoSchema>;
