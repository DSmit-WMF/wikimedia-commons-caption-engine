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
});

export type TranslateCaptionsBody = z.infer<typeof translateCaptionsSchema>;
export type ValidateCaptionBody = z.infer<typeof validateCaptionSchema>;
export type SaveCaptionsBody = z.infer<typeof saveCaptionsSchema>;
