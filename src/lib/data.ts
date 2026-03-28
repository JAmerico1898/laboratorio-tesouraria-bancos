import { fetchCsv } from "./csv";

export interface RateDataPoint {
  data: string;
  valor: number;
}

function toRateData(rows: Record<string, string>[]): RateDataPoint[] {
  return rows
    .map((r) => ({ data: r.data, valor: parseFloat(r.valor) }))
    .filter((r) => !isNaN(r.valor))
    .sort((a, b) => a.data.localeCompare(b.data));
}

export async function loadSelicMeta(): Promise<RateDataPoint[]> {
  return toRateData(await fetchCsv("selic_meta.csv"));
}

export async function loadSelicOver(): Promise<RateDataPoint[]> {
  return toRateData(await fetchCsv("selic_over.csv"));
}

export async function loadCdiDiario(): Promise<RateDataPoint[]> {
  return toRateData(await fetchCsv("cdi_diario.csv"));
}

export function fatorCdiAcumulado(
  cdiSeries: RateDataPoint[],
  pctCdi: number
): { data: string; fator: number }[] {
  if (cdiSeries.length === 0) return [];
  const result: { data: string; fator: number }[] = [];
  let cumFactor = 1;
  for (const point of cdiSeries) {
    const dailyBase = Math.pow(1 + point.valor / 100, 1 / 252) - 1;
    const dailyAdj = dailyBase * (pctCdi / 100) + 1;
    cumFactor *= dailyAdj;
    result.push({ data: point.data, fator: cumFactor });
  }
  return result;
}
