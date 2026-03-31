export type Base = "anual_252" | "anual_360" | "mensal" | "diaria";

export const DU_PER_YEAR = 252;
export const DC_PER_YEAR = 365;

// All bases expressed in DU (business days).
// anual_360: 360 calendar days × (252 DU / 365 DC) ≈ 248.877 DU
export const BASE_DU: Record<Base, number> = {
  anual_252: 252,
  anual_360: 360 * DU_PER_YEAR / DC_PER_YEAR,
  mensal: 21,
  diaria: 1,
};

export function puLtn(taxaAa: number, du: number): number {
  if (du <= 0) return 1000;
  return 1000 / Math.pow(1 + taxaAa, du / 252);
}

export function taxaEquivalente(taxa: number, de: Base, para: Base): number {
  const nDe = BASE_DU[de];
  const nPara = BASE_DU[para];
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

export function calcularBreakeven(taxaNominal: number, taxaReal: number): number {
  if (1 + taxaReal === 0) return 0;
  return (1 + taxaNominal) / (1 + taxaReal) - 1;
}

export function premioPrazo(prazoAnos: number, alphaBps: number = 30): number {
  return (alphaBps / 100) * Math.log(1 + prazoAnos);
}

export const SPREADS_CREDITO_MOD2: Record<string, number> = {
  "Soberano (0 bps)": 0,
  "AAA (30–60 bps)": 45,
  "AA (60–120 bps)": 90,
  "A (120–200 bps)": 160,
  "BBB (200–350 bps)": 275,
};

export const PREMIO_LIQUIDEZ_MOD2: Record<string, number> = {
  "Alta — DI/Títulos Públicos (0–10 bps)": 5,
  "Média — Debêntures IG (20–60 bps)": 40,
  "Baixa — Crédito ilíquido (60–150 bps)": 105,
};

export interface ForwardPoint {
  deDu: number;
  ateDu: number;
  spotIni: number | null;
  spotFim: number;
  forwardAa: number;
  forwardMensal: number;
}

/**
 * Calculate forward rates between consecutive spot curve vertices.
 * @param curvaSpot - Map of DU → annual rate (decimal, e.g. 0.1425)
 */
export function calcularForwards(curvaSpot: Record<number, number>): ForwardPoint[] {
  const vertices = Object.keys(curvaSpot).map(Number).sort((a, b) => a - b);
  const fwds: ForwardPoint[] = [];
  for (let i = 0; i < vertices.length; i++) {
    if (i === 0) {
      const du = vertices[i];
      const s = curvaSpot[du];
      fwds.push({
        deDu: 0,
        ateDu: du,
        spotIni: null,
        spotFim: s,
        forwardAa: s,
        forwardMensal: Math.pow(1 + s, 21 / 252) - 1,
      });
    } else {
      const duC = vertices[i - 1];
      const duL = vertices[i];
      const sc = curvaSpot[duC];
      const sl = curvaSpot[duL];
      const fwd = taxaForward(sc, duC, sl, duL);
      fwds.push({
        deDu: duC,
        ateDu: duL,
        spotIni: sc,
        spotFim: sl,
        forwardAa: fwd,
        forwardMensal: Math.pow(1 + fwd, 21 / 252) - 1,
      });
    }
  }
  return fwds;
}

/**
 * Cupom cambial implícito (% a.a., linear DC/360).
 * Inputs: taxaDi in decimal (0.1325), dolar values in R$/US$.
 * Returns cupom in decimal (0.055 = 5.5% a.a.).
 */
export function calcularCupomCambial(
  taxaDi: number,
  du: number,
  dc: number,
  dolarSpot: number,
  dolarFuturo: number
): number {
  if (dolarSpot === 0 || dc === 0) return 0;
  const fatorDi = Math.pow(1 + taxaDi, du / 252);
  const razaoCambio = dolarFuturo / dolarSpot;
  if (razaoCambio === 0) return 0;
  const fatorCupom = fatorDi / razaoCambio;
  return (fatorCupom - 1) * (360 / dc);
}

// --- Diagnostic thresholds ---
export const DIAG = {
  curvaSpreadNormalBps: 50,
  curvaSpreadInvertidaBps: -50,
  beVsFocusNeutroPp: 0.3,
  beVsFocusAlertaPp: 0.8,
  juroRealBaixo: 4.0,
  juroRealAlto: 6.0,
  cupomSpreadAltoBps: 200,
} as const;

export interface DiagnosticoResult {
  curva?: string;
  juros?: string;
  inflacao?: string;
  juroReal?: string;
  cupom?: string;
  sintese: string;
}

export interface CurvasInput {
  spotNominal: Record<number, number>; // DU → rate decimal
  spotReal: Record<number, number>;
  breakeven: Record<number, number>;
  forwards: ForwardPoint[];
  cupomCambial: Record<number, number>;
  selicAtual: number; // %
  focusIpca: number;  // %
  sofr: number;       // %
}

export function gerarDiagnostico(curvas: CurvasInput): DiagnosticoResult {
  const diag: DiagnosticoResult = { sintese: "" };

  // 1. Curve format
  const spotKeys = Object.keys(curvas.spotNominal).map(Number).sort((a, b) => a - b);
  if (spotKeys.length >= 2) {
    const curto = curvas.spotNominal[spotKeys[0]] * 100;
    const longo = curvas.spotNominal[spotKeys[spotKeys.length - 1]] * 100;
    const spreadBps = (longo - curto) * 100;
    let formato: string;
    let impl: string;
    if (spreadBps > DIAG.curvaSpreadNormalBps) {
      formato = "positivamente inclinada (normal)";
      impl = "prêmio de prazo ou expectativa de alta de juros";
    } else if (spreadBps < DIAG.curvaSpreadInvertidaBps) {
      formato = "invertida";
      impl = "cortes futuros de juros";
    } else {
      formato = "relativamente flat";
      impl = "expectativa de estabilidade";
    }
    diag.curva = `📈 **Formato da Curva:** ${formato} (spread ${(spotKeys[0] / 252).toFixed(1)}A→${(spotKeys[spotKeys.length - 1] / 252).toFixed(1)}A = ${spreadBps >= 0 ? "+" : ""}${spreadBps.toFixed(0)} bps). Interpretação: ${impl}.`;
  }

  // 2. Forward expectations
  if (curvas.forwards.length >= 2 && curvas.selicAtual > 0) {
    const fwdMedia = (curvas.forwards.slice(0, 2).reduce((s, f) => s + f.forwardAa, 0) / Math.min(2, curvas.forwards.length)) * 100;
    const rel = fwdMedia > curvas.selicAtual ? "ACIMA" : "ABAIXO";
    diag.juros = `🔮 **Expectativa de Juros:** Forwards precificam CDI médio de ${fwdMedia.toFixed(2)}% nos próximos 12M, ${rel} da SELIC atual de ${curvas.selicAtual.toFixed(2)}%.`;
  }

  // 3. Breakeven vs Focus
  const beKeys = Object.keys(curvas.breakeven).map(Number).sort((a, b) => a - b);
  if (beKeys.length > 0) {
    const beCurto = curvas.breakeven[beKeys[0]] * 100;
    const diff = beCurto - curvas.focusIpca;
    let status: string;
    if (Math.abs(diff) < DIAG.beVsFocusNeutroPp) status = "alinhada com o consenso Focus";
    else if (diff > DIAG.beVsFocusAlertaPp) status = "significativamente ACIMA do Focus — prêmio de risco inflacionário elevado";
    else if (diff > 0) status = "acima do Focus — possível prêmio de risco de inflação";
    else status = "abaixo do Focus — demanda por proteção inflacionária";
    diag.inflacao = `🎯 **Inflação Implícita:** Breakeven curto = ${beCurto.toFixed(2)}% vs. Focus = ${curvas.focusIpca.toFixed(2)}% (Δ = ${diff >= 0 ? "+" : ""}${diff.toFixed(2)} pp). ${status.charAt(0).toUpperCase() + status.slice(1)}.`;
  }

  // 4. Real rate
  const realKeys = Object.keys(curvas.spotReal).map(Number).sort((a, b) => a - b);
  if (realKeys.length > 0) {
    const jrCurto = curvas.spotReal[realKeys[0]] * 100;
    let nivel: string;
    if (jrCurto < DIAG.juroRealBaixo) nivel = "baixo — política monetária acomodatícia";
    else if (jrCurto > DIAG.juroRealAlto) nivel = "elevado — política monetária restritiva";
    else nivel = "em nível intermediário";
    diag.juroReal = `💵 **Juro Real:** NTN-B curta em ${jrCurto.toFixed(2)}% a.a. — nível ${nivel}.`;
  }

  // 5. Cupom cambial
  const cupomKeys = Object.keys(curvas.cupomCambial).map(Number).sort((a, b) => a - b);
  if (cupomKeys.length > 0) {
    const ccRef = curvas.cupomCambial[cupomKeys[0]] * 100;
    const spreadSofr = (ccRef - curvas.sofr) * 100;
    const custo = spreadSofr > DIAG.cupomSpreadAltoBps ? "caro" : "em nível moderado";
    diag.cupom = `💱 **Cupom Cambial:** ${ccRef.toFixed(2)}% a.a. (spread vs. SOFR = ${spreadSofr.toFixed(0)} bps). Custo de hedge ${custo}.`;
  }

  // 6. Synthesis
  diag.sintese = "📊 **Síntese:** Dado o padrão das curvas, o gestor deve considerar: posição em prefixado se forwards > sua visão de CDI; posição em IPCA+ se breakeven parece baixo vs. inflação esperada; pós-fixado se curva invertida sugere cortes iminentes; hedge cambial ao custo vigente do cupom.";

  return diag;
}

// --- ANBIMA Pricing Conventions ---

/** ANBIMA 6-decimal truncation for discount factors */
export function truncar6(x: number): number {
  return Math.floor(x * 1000000) / 1000000;
}

/** IR progressive tax rate by calendar days held */
export function aliquotaIr(diasCorridos: number): number {
  if (diasCorridos <= 180) return 0.225;
  if (diasCorridos <= 360) return 0.200;
  if (diasCorridos <= 720) return 0.175;
  return 0.150;
}

// NTN-F: 10% p.a. coupon → 4.8809% semiannual
export const CUPOM_NTNF_SEMESTRAL = Math.pow(1.10, 0.5) - 1; // ~0.048809
export const CUPOM_NTNF_REAIS = 1000.0 * CUPOM_NTNF_SEMESTRAL; // ~48.81

// NTN-B: 6% p.a. coupon → 2.9563% semiannual
export const CUPOM_NTNB_SEMESTRAL = Math.pow(1.06, 0.5) - 1; // ~0.029563

// --- Pricing Result Interfaces ---

export interface LtnResult {
  pu: number;
  puSemTrunc: number;
  fator: number;
  fatorTrunc: number;
  duration: number;
  durMod: number;
  sensib100bps: number;
}

export interface FluxoRow {
  num: number;
  data: string; // ISO date
  du: number;
  fluxo: number;
  fator: number;
  vp: number;
}

export interface NtnfResult {
  pu: number;
  fluxos: FluxoRow[];
  duration: number;
  durMod: number;
  puLimpo: number;
  accrued: number;
  sensib100bps: number;
}

export interface LftResult {
  pu: number;
  cotacao: number; // percentage (e.g., 99.23)
  agioDesagio: number;
  durationEfetiva: number;
  vna: number;
  spreadBps: number;
}

export interface NtnbResult {
  pu: number;
  fluxos: FluxoRow[];
  duration: number;
  durMod: number;
  sensib100bps: number;
}

// --- Coupon Date Generator ---

/**
 * Generates semiannual coupon dates (Jan 1 and Jul 1) between settlement and maturity.
 * Adjusts to next weekday if falls on weekend. Returns ISO date strings.
 */
export function gerarDatasCupomSemestral(dtLiq: string, dtVenc: string): string[] {
  const liq = new Date(dtLiq + "T12:00:00");
  const venc = new Date(dtVenc + "T12:00:00");
  const datas: string[] = [];

  for (let y = liq.getFullYear(); y <= venc.getFullYear() + 1; y++) {
    for (const m of [0, 6]) { // Jan=0, Jul=6
      let dt = new Date(y, m, 1);
      // Adjust to next weekday
      while (dt.getDay() === 0 || dt.getDay() === 6) {
        dt = new Date(dt.getTime() + 86400000);
      }
      if (dt > liq && dt <= venc) {
        datas.push(dt.toISOString().split("T")[0]);
      }
    }
  }

  // Ensure maturity is included
  const vencStr = venc.toISOString().split("T")[0];
  if (!datas.includes(vencStr)) {
    datas.push(vencStr);
  }

  return [...new Set(datas)].sort();
}

// --- Pricing Functions ---

/** LTN: zero-coupon prefixed bond. PU = 1000 / (1 + taxa)^(DU/252). Taxa in decimal. */
export function precificarLtn(taxa: number, du: number): LtnResult {
  const fator = Math.pow(1 + taxa, du / 252);
  const fatorTrunc = truncar6(fator);
  const pu = 1000.0 / fatorTrunc;
  const puSemTrunc = 1000.0 / fator;
  const duration = du / 252;
  const durMod = duration / (1 + taxa);
  return {
    pu,
    puSemTrunc,
    fator,
    fatorTrunc,
    duration,
    durMod,
    sensib100bps: pu * durMod * 0.01,
  };
}

/**
 * NTN-F: prefixed bond with semiannual 10% p.a. coupons.
 * Taxa in decimal. dtLiq/dtVenc as ISO date strings "YYYY-MM-DD".
 * diasUteisFn: function(d1: string, d2: string) => number for business day counting.
 */
export function precificarNtnf(
  taxa: number,
  dtLiq: string,
  dtVenc: string,
  diasUteisFn: (d1: Date, d2: Date) => number
): NtnfResult {
  const datasCupom = gerarDatasCupomSemestral(dtLiq, dtVenc);
  const liqDate = new Date(dtLiq + "T12:00:00");
  const fluxos: FluxoRow[] = [];

  for (let i = 0; i < datasCupom.length; i++) {
    const dtStr = datasCupom[i];
    const dtDate = new Date(dtStr + "T12:00:00");
    const du = diasUteisFn(liqDate, dtDate);
    if (du <= 0) continue;

    const isUltimo = i === datasCupom.length - 1;
    const cupom = CUPOM_NTNF_REAIS;
    const principal = isUltimo ? 1000.0 : 0.0;
    const fluxo = cupom + principal;
    const fator = truncar6(Math.pow(1 + taxa, du / 252));
    const vp = fluxo / fator;

    fluxos.push({ num: i + 1, data: dtStr, du, fluxo, fator, vp });
  }

  if (fluxos.length === 0) {
    return { pu: 0, fluxos: [], duration: 0, durMod: 0, puLimpo: 0, accrued: 0, sensib100bps: 0 };
  }

  const pu = fluxos.reduce((s, f) => s + f.vp, 0);
  const durMac = fluxos.reduce((s, f) => s + f.vp * f.du / 252, 0) / pu;
  const durMod = durMac / (1 + taxa);

  // Simplified accrued: proportional to DU since last coupon
  const duPrimeiro = fluxos[0].du;
  const duSemestre = 126;
  const duDecorrido = Math.max(0, duSemestre - duPrimeiro);
  const accrued = CUPOM_NTNF_REAIS * (duDecorrido / duSemestre);

  return {
    pu,
    fluxos,
    duration: durMac,
    durMod,
    puLimpo: pu - accrued,
    accrued,
    sensib100bps: pu * durMod * 0.01,
  };
}

/** LFT: SELIC-floating bond. PU = VNA × cotação. Spread in bps. */
export function precificarLft(vna: number, spreadBps: number, du: number): LftResult {
  const spread = spreadBps / 10000;
  const fator = truncar6(Math.pow(1 + spread, du / 252));
  const cotacao = 1.0 / fator;
  const pu = vna * cotacao;
  return {
    pu,
    cotacao: cotacao * 100,
    agioDesagio: pu - vna,
    durationEfetiva: 0.01,
    vna,
    spreadBps,
  };
}

/**
 * NTN-B: IPCA-linked bond with semiannual 6% p.a. coupons.
 * taxaReal in decimal. vnaProj in R$ (VNA projected with IPCA).
 */
export function precificarNtnb(
  taxaReal: number,
  vnaProj: number,
  dtLiq: string,
  dtVenc: string,
  diasUteisFn: (d1: Date, d2: Date) => number
): NtnbResult {
  const datasCupom = gerarDatasCupomSemestral(dtLiq, dtVenc);
  const liqDate = new Date(dtLiq + "T12:00:00");
  const fluxos: FluxoRow[] = [];

  for (let i = 0; i < datasCupom.length; i++) {
    const dtStr = datasCupom[i];
    const dtDate = new Date(dtStr + "T12:00:00");
    const du = diasUteisFn(liqDate, dtDate);
    if (du <= 0) continue;

    const isUltimo = i === datasCupom.length - 1;
    const cupomBrl = vnaProj * CUPOM_NTNB_SEMESTRAL;
    const principal = isUltimo ? vnaProj : 0.0;
    const fluxo = cupomBrl + principal;
    const fator = truncar6(Math.pow(1 + taxaReal, du / 252));
    const vp = fluxo / fator;

    fluxos.push({ num: i + 1, data: dtStr, du, fluxo, fator, vp });
  }

  if (fluxos.length === 0) {
    return { pu: 0, fluxos: [], duration: 0, durMod: 0, sensib100bps: 0 };
  }

  const pu = fluxos.reduce((s, f) => s + f.vp, 0);
  const durMac = fluxos.reduce((s, f) => s + f.vp * f.du / 252, 0) / pu;
  const durMod = durMac / (1 + taxaReal);

  return {
    pu,
    fluxos,
    duration: durMac,
    durMod,
    sensib100bps: pu * durMod * 0.01,
  };
}

// --- IF Private Title Pricing ---

export interface CdbPosResult {
  puCurva: number;
  puMtm: number;
  diferenca: number;
  spreadPp: number;
}

export function precificarCdbPos(
  face: number, pctCdiEmissao: number, pctCdiMercado: number,
  duTotal: number, duDecorridos: number, cdiProxy: number = 0.1365
): CdbPosResult {
  const duRestantes = duTotal - duDecorridos;
  if (duRestantes <= 0) return { puCurva: face, puMtm: face, diferenca: 0, spreadPp: 0 };
  const fatorPassado = Math.pow(1 + cdiProxy * pctCdiEmissao / 100, duDecorridos / 252);
  const valCurva = face * fatorPassado;
  const fatorFuturoEmissao = Math.pow(1 + cdiProxy * pctCdiEmissao / 100, duRestantes / 252);
  const vfEsperado = valCurva * fatorFuturoEmissao;
  const fatorFuturoMercado = Math.pow(1 + cdiProxy * pctCdiMercado / 100, duRestantes / 252);
  const puMtm = fatorFuturoMercado > 0 ? vfEsperado / fatorFuturoMercado : face;
  return { puCurva: valCurva, puMtm, diferenca: puMtm - valCurva, spreadPp: pctCdiMercado - pctCdiEmissao };
}

export interface CdbPreResult {
  taxaCdb: number; puCdb: number; puLtn: number; diferencaPu: number;
}

export function precificarCdbPre(
  face: number, taxaSoberana: number, spreadBps: number, du: number
): CdbPreResult {
  const spread = spreadBps / 10000;
  const taxaCdb = taxaSoberana + spread;
  const puCdb = face / Math.pow(1 + taxaCdb, du / 252);
  const puLtn = face / Math.pow(1 + taxaSoberana, du / 252);
  return { taxaCdb: taxaCdb * 100, puCdb, puLtn, diferencaPu: puLtn - puCdb };
}

export interface EquivalenciaFiscalResult {
  aliquota: number; taxaBrutaEquiv: number; taxaIsenta: number; vantagemBps: number;
}

export function equivalenciaFiscal(
  taxaIsenta: number, diasCorridos: number, tipoInvestidor: "PF" | "PJ" = "PF"
): EquivalenciaFiscalResult {
  const aliq = aliquotaIr(diasCorridos);
  const taxaBruta = tipoInvestidor === "PF" ? taxaIsenta / (1 - aliq) : taxaIsenta;
  return {
    aliquota: aliq * 100, taxaBrutaEquiv: taxaBruta, taxaIsenta,
    vantagemBps: tipoInvestidor === "PF" ? (taxaBruta - taxaIsenta) * 100 : 0,
  };
}

export interface LfResult {
  pu: number; duration: number; taxaEfetiva: number; tipo: string;
}

export function precificarLf(
  spreadBps: number, prazoAnos: number, volume: number, tipo: string = "Sênior"
): LfResult {
  const spread = spreadBps / 10000;
  const du = Math.round(prazoAnos * 252);
  const fator = Math.pow(1 + spread, du / 252);
  return { pu: volume / fator, duration: prazoAnos, taxaEfetiva: spread * 100, tipo };
}

// --- Corporate Private Title Pricing ---

export interface DebentureCdiResult {
  pu: number;
  puPctPar: number;
  spreadDiffBps: number;
  duration: number;
  fluxos: { num: number; du: number; fluxo: number; fator: number; vp: number }[];
}

export function precificarDebentureCdi(
  face: number, spreadEmissao: number, spreadMercado: number,
  prazoAnos: number, periodicidade: "Semestral" | "Anual" = "Semestral"
): DebentureCdiResult {
  const nCupons = Math.round(prazoAnos * (periodicidade === "Semestral" ? 2 : 1));
  const duTotal = Math.round(prazoAnos * 252);
  if (nCupons <= 0) return { pu: face, puPctPar: 100, spreadDiffBps: 0, duration: 0, fluxos: [] };
  const duStep = Math.round(duTotal / nCupons);
  const fluxos: DebentureCdiResult["fluxos"] = [];
  let puTotal = 0;
  let somaPeso = 0;
  for (let i = 1; i <= nCupons; i++) {
    const duI = duStep * i;
    const isUltimo = i === nCupons;
    const cupom = face * spreadEmissao * (duStep / 252);
    const principal = isUltimo ? face : 0;
    const fluxo = cupom + principal;
    const fator = Math.pow(1 + spreadMercado, duI / 252);
    const vp = fluxo / fator;
    puTotal += vp;
    somaPeso += vp * duI / 252;
    fluxos.push({ num: i, du: duI, fluxo, fator, vp });
  }
  return {
    pu: puTotal,
    puPctPar: (puTotal / face) * 100,
    spreadDiffBps: (spreadMercado - spreadEmissao) * 10000,
    duration: puTotal > 0 ? somaPeso / puTotal : 0,
    fluxos,
  };
}

export interface DebentureIpcaResult {
  pu: number;
  duration: number;
  fluxos: { num: number; du: number; fluxo: number; fator: number; vp: number }[];
}

export function precificarDebentureIpca(
  taxaReal: number, vnaProj: number, prazoAnos: number,
  periodicidade: "Semestral" | "Anual" = "Semestral"
): DebentureIpcaResult {
  const nCupons = Math.round(prazoAnos * (periodicidade === "Semestral" ? 2 : 1));
  const duTotal = Math.round(prazoAnos * 252);
  if (nCupons <= 0) return { pu: vnaProj, duration: 0, fluxos: [] };
  const duStep = Math.round(duTotal / nCupons);
  const cupomSem = periodicidade === "Semestral" ? CUPOM_NTNB_SEMESTRAL : 0.06;
  const fluxos: DebentureIpcaResult["fluxos"] = [];
  let puTotal = 0;
  let somaPeso = 0;
  for (let i = 1; i <= nCupons; i++) {
    const duI = duStep * i;
    const isUltimo = i === nCupons;
    const cupomBrl = vnaProj * cupomSem;
    const principal = isUltimo ? vnaProj : 0;
    const fluxo = cupomBrl + principal;
    const fator = Math.pow(1 + taxaReal, duI / 252);
    const vp = fluxo / fator;
    puTotal += vp;
    somaPeso += vp * duI / 252;
    fluxos.push({ num: i, du: duI, fluxo, fator, vp });
  }
  return { pu: puTotal, duration: puTotal > 0 ? somaPeso / puTotal : 0, fluxos };
}

export interface CreditoGenericoResult {
  pu: number;
  duration: number;
  taxa: number;
}

export function precificarCreditoGenerico(
  indexador: string, spreadTaxa: number, prazoAnos: number,
  volume: number, estrutura: string = "Bullet"
): CreditoGenericoResult {
  const du = Math.round(prazoAnos * 252);
  if (indexador === "Prefixado" || estrutura === "Bullet") {
    const fator = Math.pow(1 + spreadTaxa / 100, du / 252);
    return { pu: volume / fator, duration: prazoAnos, taxa: spreadTaxa };
  }
  const r = precificarDebentureCdi(
    volume, spreadTaxa / 100, spreadTaxa / 100, prazoAnos,
    estrutura.toLowerCase().includes("semestral") ? "Semestral" : "Anual"
  );
  return { pu: r.pu, duration: r.duration, taxa: spreadTaxa };
}

// --- Module 4: Portfolio Strategy Functions ---

export interface CurvaVertex {
  vertice: string;
  prazoDu: number;
  prazoAnos: number;
  taxa: number; // % a.a.
  peso: number; // %
}

export const CURVA_DEFAULT: CurvaVertex[] = [
  { vertice: "6M", prazoDu: 126, prazoAnos: 0.5, taxa: 13.25, peso: 0 },
  { vertice: "1A", prazoDu: 252, prazoAnos: 1.0, taxa: 13.00, peso: 0 },
  { vertice: "2A", prazoDu: 504, prazoAnos: 2.0, taxa: 12.80, peso: 0 },
  { vertice: "3A", prazoDu: 756, prazoAnos: 3.0, taxa: 12.70, peso: 0 },
  { vertice: "5A", prazoDu: 1260, prazoAnos: 5.0, taxa: 12.50, peso: 0 },
  { vertice: "7A", prazoDu: 1764, prazoAnos: 7.0, taxa: 12.40, peso: 0 },
  { vertice: "10A", prazoDu: 2520, prazoAnos: 10.0, taxa: 12.30, peso: 0 },
];

export const CENARIOS_CURVA: Record<string, { curto: number; longo: number }> = {
  "Paralelo +100 bps": { curto: 100, longo: 100 },
  "Paralelo −100 bps": { curto: -100, longo: -100 },
  "Empinamento (curto +50, longo +150)": { curto: 50, longo: 150 },
  "Achatamento (curto +150, longo +50)": { curto: 150, longo: 50 },
  "Bear flattening (curto +200, longo +100)": { curto: 200, longo: 100 },
  "Bull steepening (curto −150, longo −50)": { curto: -150, longo: -50 },
};

export const COR_ESTRATEGIA: Record<string, string> = {
  Bullet: "#2E75B6",
  Barbell: "#C55A11",
  Ladder: "#0E7C7B",
  "Riding the Yield Curve": "#8B5CF6",
};

export function durationZeroCupom(taxa: number, du: number) {
  const t = du / 252;
  const pu = 1000 / truncar6(Math.pow(1 + taxa, t));
  const durMod = t / (1 + taxa);
  const conv = (t * (t + 1)) / Math.pow(1 + taxa, 2);
  return { pu, duration: t, durMod, convexidade: conv };
}

export function montarBullet(curva: CurvaVertex[], durAlvo: number): CurvaVertex[] {
  const result = curva.map((v) => ({ ...v, peso: 0 }));
  let bestIdx = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < result.length; i++) {
    const diff = Math.abs(result[i].prazoAnos - durAlvo);
    if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
  }
  result[bestIdx].peso = 100;
  return result;
}

export function montarBarbell(curva: CurvaVertex[], durAlvo: number): CurvaVertex[] {
  const result = curva.map((v) => ({ ...v, peso: 0 }));
  if (result.length < 2) { result[0].peso = 100; return result; }
  const dCurto = result[0].prazoAnos;
  const dLongo = result[result.length - 1].prazoAnos;
  if (dLongo === dCurto) { result[0].peso = 50; result[result.length - 1].peso = 50; return result; }
  const wCurto = Math.max(0, Math.min(1, (dLongo - durAlvo) / (dLongo - dCurto)));
  result[0].peso = wCurto * 100;
  result[result.length - 1].peso = (1 - wCurto) * 100;
  return result;
}

export function montarLadder(curva: CurvaVertex[]): CurvaVertex[] {
  const n = curva.length;
  return curva.map((v) => ({ ...v, peso: n > 0 ? 100 / n : 0 }));
}

export function montarRiding(curva: CurvaVertex[], durAlvo: number): CurvaVertex[] {
  const result = curva.map((v) => ({ ...v, peso: 0 }));
  let longos = result.filter((v) => v.prazoAnos > durAlvo);
  if (longos.length === 0) longos = result.slice(-2);
  const n = longos.length;
  for (const v of longos) v.peso = 100 / n;
  return result;
}

export function montarEstrategia(nome: string, curva: CurvaVertex[], durAlvo: number): CurvaVertex[] {
  switch (nome) {
    case "Bullet": return montarBullet(curva, durAlvo);
    case "Barbell": return montarBarbell(curva, durAlvo);
    case "Ladder": return montarLadder(curva);
    case "Riding the Yield Curve": return montarRiding(curva, durAlvo);
    default: return montarBullet(curva, durAlvo);
  }
}

export function calcularMetricasCarteira(cart: CurvaVertex[]) {
  let durPond = 0, convPond = 0, yieldPond = 0, nVert = 0;
  for (const v of cart) {
    const w = v.peso / 100;
    if (w < 0.001) continue;
    const r = durationZeroCupom(v.taxa / 100, v.prazoDu);
    durPond += w * r.durMod;
    convPond += w * r.convexidade;
    yieldPond += w * v.taxa;
    nVert++;
  }
  return { duration: durPond, convexidade: convPond, yieldMedio: yieldPond, nVertices: nVert };
}

export function interpolarChoque(curva: CurvaVertex[], choqueCurto: number, choqueLongo: number): number[] {
  const prazos = curva.map((v) => v.prazoAnos);
  const pMin = Math.min(...prazos);
  const pMax = Math.max(...prazos);
  if (pMax === pMin) return prazos.map(() => choqueCurto);
  return prazos.map((p) => choqueCurto + ((p - pMin) / (pMax - pMin)) * (choqueLongo - choqueCurto));
}

export function simularRetornoEstrategia(
  cart: CurvaVertex[], choqueCurto: number, choqueLongo: number, horizonteMeses: number = 12
) {
  const choques = interpolarChoque(cart, choqueCurto, choqueLongo);
  const frac = horizonteMeses / 12;
  let carryTotal = 0, mtmTotal = 0;
  for (let i = 0; i < cart.length; i++) {
    const w = cart[i].peso / 100;
    if (w < 0.001) continue;
    const tx = cart[i].taxa / 100;
    const du = cart[i].prazoDu;
    const r = durationZeroCupom(tx, du);
    const carry = w * r.pu * tx * frac;
    const di = choques[i] / 10000;
    const mtm = w * (-r.durMod * r.pu * di + 0.5 * r.convexidade * r.pu * di * di);
    carryTotal += carry;
    mtmTotal += mtm;
  }
  return { carry: carryTotal, mtm: mtmTotal, total: carryTotal + mtmTotal };
}

// --- Module 4: Immunization Functions ---

export function calcularPesosImunizacao(dAlvo: number, dCurto: number, dLongo: number): [number, number] {
  if (dLongo === dCurto) return [0.5, 0.5];
  const wCurto = Math.max(0, Math.min(1, (dLongo - dAlvo) / (dLongo - dCurto)));
  return [wCurto, 1 - wCurto];
}

export function simularImunizacao(
  durCurto: number, durLongo: number,
  taxaCurto: number, taxaLongo: number,
  wCurto: number, vpTotal: number,
  horizonte: number, choqueBps: number
) {
  const invCurto = vpTotal * wCurto;
  const invLongo = vpTotal * (1 - wCurto);
  const choque = choqueBps / 10000;
  const carryC = invCurto * taxaCurto * horizonte;
  const carryL = invLongo * taxaLongo * horizonte;
  const mtmC = -durCurto * invCurto * choque / (1 + taxaCurto);
  const mtmL = -durLongo * invLongo * choque / (1 + taxaLongo);
  const reinvC = carryC * choque * horizonte * 0.5;
  const reinvL = carryL * choque * horizonte * 0.5;
  return {
    valorFinal: vpTotal + carryC + carryL + mtmC + mtmL + reinvC + reinvL,
    carry: carryC + carryL,
    mtm: mtmC + mtmL,
    reinv: reinvC + reinvL,
  };
}

export function durationDrift(durCarteira: number, horizonteTotal: number, mesesDecorridos: number) {
  const t = mesesDecorridos / 12;
  const durAtual = Math.max(0, durCarteira - t * 0.85);
  const horizRem = Math.max(0, horizonteTotal - t);
  const descasamento = durAtual - horizRem;
  let status: "ok" | "atencao" | "fora";
  if (Math.abs(descasamento) < 0.25) status = "ok";
  else if (Math.abs(descasamento) < 0.5) status = "atencao";
  else status = "fora";
  return { durAtual, horizRem, descasamento, status };
}
