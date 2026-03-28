import { fetchCsv } from "./csv";

export interface RateDataPoint {
  data: string;
  valor: number;
}

export interface FocusDataPoint {
  dataColeta: string;
  variavel: string;
  mediana: number;
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

export async function loadIpca(): Promise<RateDataPoint[]> {
  return toRateData(await fetchCsv("ipca_mensal.csv"));
}

export async function loadCambio(): Promise<RateDataPoint[]> {
  return toRateData(await fetchCsv("cambio_usd.csv"));
}

export async function loadCds(): Promise<RateDataPoint[]> {
  // CDS CSV uses semicolons, US date format (MM/DD/YYYY), and has BOM
  const rows = await fetchCsv("cds_brasil.csv", ";");
  return rows
    .map((r) => {
      // Convert MM/DD/YYYY to YYYY-MM-DD
      const parts = r.data.split("/");
      if (parts.length !== 3) return null;
      const iso = `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
      return { data: iso, valor: parseFloat(r.valor) };
    })
    .filter((r): r is RateDataPoint => r !== null && !isNaN(r.valor))
    .sort((a, b) => a.data.localeCompare(b.data));
}

export async function loadFocus(): Promise<FocusDataPoint[]> {
  const rows = await fetchCsv("focus_expectativas.csv");
  return rows
    .map((r) => ({
      dataColeta: r.data_coleta,
      variavel: r.variavel,
      mediana: parseFloat(r.mediana),
    }))
    .filter((r) => !isNaN(r.mediana))
    .sort((a, b) => a.dataColeta.localeCompare(b.dataColeta));
}

export const META_INFLACAO = 3.0;
export const PIB_POTENCIAL = 2.5;

export const CENARIO_DELTAS = {
  ipca_pp: 75,
  pib_pp: 50,
  cambio: { "Estável": 0, "Depreciação moderada": 50, "Depreciação forte": 100, "Apreciação moderada": -25 } as Record<string, number>,
  fiscal: { "Neutro": 0, "Expansionista": 75, "Contracionista": -50 } as Record<string, number>,
  fed: { "Manutenção": 0, "Alta de juros": 50, "Corte de juros": -25 } as Record<string, number>,
};

export function calcIpca12m(monthly: RateDataPoint[]): RateDataPoint[] {
  if (monthly.length < 12) return [];
  const sorted = [...monthly].sort((a, b) => a.data.localeCompare(b.data));
  const result: RateDataPoint[] = [];
  for (let i = 11; i < sorted.length; i++) {
    let product = 1;
    for (let j = i - 11; j <= i; j++) {
      product *= 1 + sorted[j].valor / 100;
    }
    result.push({ data: sorted[i].data, valor: (product - 1) * 100 });
  }
  return result;
}

export function calcPressao(
  ipca: number,
  pib: number,
  cambio: string,
  fiscal: string,
  fed: string
): { total: number; detail: Record<string, number> } {
  let dIpca = Math.max(0, ipca - META_INFLACAO) * CENARIO_DELTAS.ipca_pp;
  dIpca -= Math.max(0, META_INFLACAO - ipca) * CENARIO_DELTAS.ipca_pp * 0.5;

  let dPib = Math.max(0, pib - PIB_POTENCIAL) * CENARIO_DELTAS.pib_pp;
  dPib -= Math.max(0, PIB_POTENCIAL - pib) * CENARIO_DELTAS.pib_pp * 0.5;

  const dCambio = CENARIO_DELTAS.cambio[cambio] ?? 0;
  const dFiscal = CENARIO_DELTAS.fiscal[fiscal] ?? 0;
  const dFed = CENARIO_DELTAS.fed[fed] ?? 0;

  const detail: Record<string, number> = {
    "Inflação (IPCA)": dIpca,
    "Atividade (PIB)": dPib,
    "Câmbio": dCambio,
    "Fiscal": dFiscal,
    "Externo (FED)": dFed,
  };

  return { total: dIpca + dPib + dCambio + dFiscal + dFed, detail };
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
