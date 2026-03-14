import axios from "axios";
import { getFileInfo } from "./resolve.js";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

/**
 * Resolve file identifier (URL or title) to MediaInfo entity ID (e.g. M123).
 */
export async function resolveFileToMediaInfoId(identifier: string): Promise<string | null> {
  const info = await getFileInfo(identifier);
  return info?.media_info_id ?? null;
}

/**
 * Get CSRF token for Commons API.
 */
async function getToken(token: string): Promise<string> {
  const res = await axios.get(COMMONS_API, {
    params: {
      action: "query",
      meta: "tokens",
      type: token,
      format: "json",
      origin: "*",
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const key = token === "csrf" ? "csrftoken" : `${token}token`;
  return res.data?.query?.tokens?.[key] ?? "";
}

/**
 * Save caption labels to a MediaInfo entity via wbsetlabel.
 */
export async function saveLabels(
  mediaInfoId: string,
  captions: { lang: string; text: string }[],
  oauthToken: string
): Promise<void> {
  const csrfToken = await getToken("csrf");

  for (const { lang, text } of captions) {
    await axios.post(
      COMMONS_API,
      new URLSearchParams({
        action: "wbsetlabel",
        id: mediaInfoId,
        language: lang,
        value: text,
        token: csrfToken,
        format: "json",
        origin: "*",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${oauthToken}`,
        },
      }
    );
  }
}
