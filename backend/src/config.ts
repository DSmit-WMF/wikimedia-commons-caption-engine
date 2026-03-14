import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT ?? "3001", 10),
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  commonsOAuthToken: process.env.COMMONS_OAUTH_TOKEN ?? "",
  commonsApiBase: "https://commons.wikimedia.org/w/api.php",
} as const;
