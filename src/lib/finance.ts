export type Base = "anual_252" | "anual_360" | "mensal" | "diaria";

const BASE_DAYS: Record<Base, number> = {
  anual_252: 252,
  anual_360: 360,
  mensal: 21,
  diaria: 1,
};

export function puLtn(taxaAa: number, du: number): number {
  if (du <= 0) return 1000;
  return 1000 / Math.pow(1 + taxaAa, du / 252);
}

export function taxaEquivalente(taxa: number, de: Base, para: Base): number {
  const nDe = BASE_DAYS[de];
  const nPara = BASE_DAYS[para];
  const daily = Math.pow(1 + taxa, 1 / nDe) - 1;
  return Math.pow(1 + daily, nPara) - 1;
}

export function durationModificada(taxa: number, du: number): number {
  return (du / 252) / (1 + taxa);
}

export function taxaForward(sc: number, pc: number, sl: number, pl: number): number {
  const pf = pl - pc;
  if (pf <= 0) return 0;
  const fc = Math.pow(1 + sc, pc / 252);
  const fl = Math.pow(1 + sl, pl / 252);
  if (fc === 0) return 0;
  return Math.pow(fl / fc, 252 / pf) - 1;
}

export const SPREADS_CREDITO: Record<string, [number, number]> = {
  "AAA": [30, 60], "AA": [60, 120], "A": [120, 200], "BBB": [150, 250],
  "BB": [250, 400], "B": [400, 700], "CCC": [700, 1200],
};

export const PREMIO_LIQUIDEZ: Record<string, [number, number]> = {
  "Alta (títulos públicos, DI)": [0, 10],
  "Média (debêntures investment grade)": [15, 40],
  "Baixa (crédito privado ilíquido)": [50, 120],
};
