import { WIKIMEDIA_USER_AGENT } from "../config.js";
import axios from "axios";
import { getFileInfo } from "./resolve.js";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const commonsHeaders = { "User-Agent": WIKIMEDIA_USER_AGENT };

/**
 * Resolve file identifier (URL or title) to MediaInfo entity ID (e.g. M123).
 */
export async function resolveFileToMediaInfoId(identifier: string): Promise<string | null> {
  const info = await getFileInfo(identifier);
  return info?.media_info_id ?? null;
}

/**
 * Fetch a CSRF token from Commons. Must be authenticated (OAuth in header).
 */
async function getCsrfToken(oauthToken: string): Promise<string> {
  const res = await axios.get(COMMONS_API, {
    params: {
      action: "query",
      meta: "tokens",
      type: "csrf",
      format: "json",
    },
    headers: {
      ...commonsHeaders,
      Authorization: `Bearer ${oauthToken}`,
    },
  });
  console.log("Commons API (tokens):", res.data.query.tokens);
  const err = res.data?.error;
  if (err) {
    throw new Error(`Commons API (tokens): ${err.code} - ${err.info}`);
  }
  const tokens = res.data?.query?.tokens;
  const token = tokens?.csrftoken ?? tokens?.csrf ?? (tokens && Object.values(tokens)[0]);
  const value = typeof token === "string" ? token.trim() : "";
  if (!value || value.length < 10) {
    throw new Error(
      "Commons API did not return a valid CSRF token. Ensure COMMONS_OAUTH_TOKEN has 'Edit existing pages' grant and is not expired."
    );
  }
  return value;
}

/**
 * Save caption labels to a MediaInfo entity via wbsetlabel.
 * Fetches a CSRF token (using OAuth in header) then uses it in each wbsetlabel request.
 */
export async function saveLabels(
  mediaInfoId: string,
  captions: { lang: string; text: string }[],
  oauthToken: string
): Promise<void> {
  const csrfToken = await getCsrfToken(oauthToken);

  console.log("Saving labels to MediaInfo:", mediaInfoId, captions);
  for (const { lang, text } of captions) {
    const body = [
      "action=wbsetlabel",
      `id=${encodeURIComponent(mediaInfoId)}`,
      `language=${encodeURIComponent(lang)}`,
      `value=${encodeURIComponent(text)}`,
      `token=${encodeURIComponent(csrfToken)}`,
      "format=json",
    ].join("&");
    const res = await axios.post(COMMONS_API, body, {
      headers: {
        ...commonsHeaders,
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${oauthToken}`,
      },
    });
    const err = res.data?.error;
    if (err) {
      console.error("error saving labels to MediaInfo", mediaInfoId, captions, err);
      throw new Error(`Commons API (wbsetlabel, ${lang}): ${err.code} - ${err.info}`);
    }
  }
}
