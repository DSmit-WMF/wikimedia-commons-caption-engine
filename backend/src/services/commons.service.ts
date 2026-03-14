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

const BATCH_CONCURRENCY = 5;

export async function getFileInfo(identifier: string): Promise<FileInfo | null> {
  return getFileInfoAdapter(identifier);
}

export interface BatchFileInfoItem {
  identifier: string;
  success: boolean;
  file_info?: FileInfo;
  error?: string;
}

export async function batchGetFileInfo(identifiers: string[]): Promise<BatchFileInfoItem[]> {
  const results: BatchFileInfoItem[] = [];
  for (let i = 0; i < identifiers.length; i += BATCH_CONCURRENCY) {
    const chunk = identifiers.slice(i, i + BATCH_CONCURRENCY);
    const chunkResults = await Promise.all(
      chunk.map(async (id) => {
        try {
          const fileInfo = await getFileInfoAdapter(id);
          if (!fileInfo) {
            return { identifier: id, success: false, error: "File not found" };
          }
          return { identifier: id, success: true, file_info: fileInfo };
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to load file info";
          return { identifier: id, success: false, error: message };
        }
      })
    );
    results.push(...chunkResults);
  }
  return results;
}

export async function getRandomFileWithLabels(
  maxTries?: number
): Promise<{ url: string; title: string } | null> {
  return getRandomFileWithLabelsAdapter(maxTries);
}

export async function resolveFileToMediaInfoId(identifier: string): Promise<string | null> {
  return resolveToMediaInfoId(identifier);
}

export async function saveCaptions(
  mediaInfoId: string,
  captions: { lang: string; text: string }[],
  oauthToken: string
): Promise<void> {
  return saveLabels(mediaInfoId, captions, oauthToken);
}
