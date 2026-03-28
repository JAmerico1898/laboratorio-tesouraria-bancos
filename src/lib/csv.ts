export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row;
  });
}

export async function fetchCsv(filename: string): Promise<Record<string, string>[]> {
  const response = await fetch(`/data/${filename}`);
  if (!response.ok) return [];
  const text = await response.text();
  return parseCsv(text);
}
