import {
  validateCaption as validateCaptionCore,
  type ValidationResult,
} from "../caption_engine/validate.js";

export type { ValidationResult };

export function validateCaption(text: string): ValidationResult {
  return validateCaptionCore(text);
}
