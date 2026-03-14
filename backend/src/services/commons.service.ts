import {
  getFileInfo as getFileInfoAdapter,
  getRandomFileWithLabels as getRandomFileWithLabelsAdapter,
} from "../commons_adapter/resolve.js";
import {
  resolveFileToMediaInfoId as resolveToMediaInfoId,
  saveLabels,
} from "../commons_adapter/captions.js";

import type { FileInfo } from "../commons_adapter/resolve.js";

export type { FileInfo } from "../commons_adapter/resolve.js";

export async function getFileInfo(
  identifier: string,
): Promise<FileInfo | null> {
  return getFileInfoAdapter(identifier);
}

export async function getRandomFileWithLabels(
  maxTries?: number,
): Promise<{ url: string; title: string } | null> {
  return getRandomFileWithLabelsAdapter(maxTries);
}

export async function resolveFileToMediaInfoId(
  identifier: string,
): Promise<string | null> {
  return resolveToMediaInfoId(identifier);
}

export async function saveCaptions(
  mediaInfoId: string,
  captions: { lang: string; text: string }[],
  oauthToken: string,
): Promise<void> {
  return saveLabels(mediaInfoId, captions, oauthToken);
}
