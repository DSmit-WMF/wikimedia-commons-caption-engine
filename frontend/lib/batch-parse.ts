/**
 * Parse batch identifiers from uploaded CSV/txt content.
 * One URL or File: title per line; first column only.
 * Optional header row (url, file, title) is skipped.
 */
export function parseBatchIdentifiersFromFile(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const identifiers: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const firstCol = lineToFirstColumn(lines[i]);
    if (!firstCol) continue;
    if (i === 0 && /^(url|file|title)$/i.test(firstCol)) continue;
    identifiers.push(firstCol);
  }
  return [...new Set(identifiers)];
}

function lineToFirstColumn(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith('"')) {
    const end = trimmed.indexOf('"', 1);
    if (end !== -1) return trimmed.slice(1, end).trim();
  }
  const comma = trimmed.indexOf(",");
  return (comma === -1 ? trimmed : trimmed.slice(0, comma)).trim();
}
