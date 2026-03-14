import "dotenv/config";

/** User-Agent for requests to Wikimedia. Required to avoid 403; see https://meta.wikimedia.org/wiki/User-Agent_policy */
export const WIKIMEDIA_USER_AGENT =
  process.env.WIKIMEDIA_USER_AGENT ??
  "CaptionEngine/1.0 (Commons caption suggestion tool; https://github.com/caption-engine)";

export const config = {
  port: parseInt(process.env.PORT ?? "3002", 10),
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  commonsOAuthToken: process.env.COMMONS_OAUTH_TOKEN ?? "",
  commonsApiBase: "https://commons.wikimedia.org/w/api.php",
} as const;
