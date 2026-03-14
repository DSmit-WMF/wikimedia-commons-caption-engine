import "dotenv/config";

/** User-Agent for requests to Wikimedia. Required to avoid 403; see https://meta.wikimedia.org/wiki/User-Agent_policy */
export const WIKIMEDIA_USER_AGENT =
  process.env.WIKIMEDIA_USER_AGENT ??
  "CaptionEngine/1.0 (Wikimedia Commons caption translation tool; https://github.com/caption-engine)";

/** App config from env (port, OpenAI, Commons API). */
export const config = {
  port: parseInt(process.env.PORT ?? "3002", 10),
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  /** Model for translation and caption generation. gpt-5-nano fits translation (straightforward instruction-following); use gpt-5-mini or gpt-5.4 for heavier tasks. Empty env is treated as unset and falls back to default. */
  openaiModel: (process.env.OPENAI_MODEL?.trim() || "gpt-5-nano") as string,
  /** Max tokens for completion. Reasoning models (e.g. gpt-5-nano) use tokens for reasoning first; set higher (e.g. 512) so output text is not empty. */
  openaiMaxCompletionTokens: parseInt(process.env.OPENAI_MAX_COMPLETION_TOKENS ?? "512", 10),
  commonsOAuthToken: process.env.COMMONS_OAUTH_TOKEN ?? "",
  commonsApiBase: "https://commons.wikimedia.org/w/api.php",
} as const;
