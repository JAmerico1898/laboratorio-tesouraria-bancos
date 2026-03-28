export function parseCsv(text: string, separator = ","): Record<string, string>[] {
  const stripped = text.startsWith("\uFEFF") ? text.slice(1) : text;
  const lines = stripped.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length < 2) return [];
  const headers = lines[0].split(separator).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(separator).map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row;
  });
}

export async function fetchCsv(filename: string, separator?: string): Promise<Record<string, string>[]> {
  const response = await fetch(`/data/${filename}`);
  if (!response.ok) return [];
  const text = await response.text();
  return parseCsv(text, separator);
}
