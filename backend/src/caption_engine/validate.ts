const MAX_LENGTH = 250;
const OPINION_WORDS = [
  "beautiful",
  "amazing",
  "gorgeous",
  "stunning",
  "awesome",
  "wonderful",
  "lovely",
  "nice",
  "great",
  "perfect",
  "incredible",
];
const SPECULATION_MARKERS = [
  "probably",
  "might be",
  "maybe",
  "perhaps",
  "possibly",
  "likely",
  "seems",
];

/** Result of caption validation: valid flag and list of warning messages. */
export interface ValidationResult {
  valid: boolean;
  warnings: string[];
}

/**
 * Validate a caption against Commons rules (length, no opinions, no speculation).
 */
export function validateCaption(text: string): ValidationResult {
  const warnings: string[] = [];
  const lower = text.toLowerCase();

  if (text.length > MAX_LENGTH) {
    warnings.push(`Caption exceeds ${MAX_LENGTH} characters (${text.length}).`);
  }

  for (const word of OPINION_WORDS) {
    if (lower.includes(word)) {
      warnings.push(`Avoid opinion words like "${word}".`);
      break;
    }
  }

  for (const marker of SPECULATION_MARKERS) {
    if (lower.includes(marker)) {
      warnings.push(`Avoid speculation ("${marker}").`);
      break;
    }
  }

  if (lower.includes("copyright") || lower.includes("license") || lower.includes("©")) {
    warnings.push("Do not include copyright or licensing text in the caption.");
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
