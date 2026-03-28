"use client";

import { useState, useEffect, useMemo } from "react";
import { puLtn } from "@/lib/finance";
import { loadSelicMeta } from "@/lib/data";
import { fmtBrl, fmtPct } from "@/lib/format";
import { PlotlyChart } from "@/components/plotly-chart";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL = 50_000_000;
const TAXA_LTN = 14.80;
const TAXA_NTNB_REAL = 7.20;
const META_INFLACAO_EX = 3.0;
const SPREAD_DEB = 0.80; // pp
const DU_LTN = 252;
const DU_NTNB = 756; // ~3 years

const CENARIO_PARAMS: Record<string, { deltaSelic: number; deltaSpread: number }> = {
  "Base (SELIC estável)": { deltaSelic: 0, deltaSpread: 0 },
  "Hawkish (alta de 100 bps em 3M)": { deltaSelic: 1.0, deltaSpread: 0.10 },
  "Dovish (corte de 100 bps em 3M)": { deltaSelic: -1.0, deltaSpread: -0.05 },
  "Estresse (alta 300 bps + abertura spread)": { deltaSelic: 3.0, deltaSpread: 0.50 },
};

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

const ALT_COLORS: Record<string, string> = {
  A: "#2E75B6",
  B: "#2E8B57",
  C: "#5B8AB5",
  D: "#C55A11",
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function fmtSign(v: number): string {
  const sign = v >= 0 ? "+" : "";
  return sign + fmtBrl(v);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExercicioContent() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [selicAtual, setSelicAtual] = useState(14.25);
  const [pctA, setPctA] = useState(25); // LTN
  const [pctB, setPctB] = useState(25); // NTN-B
  const [pctC, setPctC] = useState(25); // Compromissada
  const [cenario, setCenario] = useState(Object.keys(CENARIO_PARAMS)[0]);
  const [horizonte, setHorizonte] = useState(6); // months

  // Load latest SELIC from CSV on mount
  useEffect(() => {
    loadSelicMeta().then((data) => {
      if (data.length > 0) {
        setSelicAtual(data[data.length - 1].valor);
      }
    });
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const somaABC = pctA + pctB + pctC;
  const pctD = Math.max(0, 100 - somaABC);
  const valid = somaABC <= 100;
  const hzDu = horizonte * 21; // approx business days
  const cp = CENARIO_PARAMS[cenario];
  const selicFinal = selicAtual + cp.deltaSelic;

  const valA = TOTAL * (pctA / 100);
  const valB = TOTAL * (pctB / 100);
  const valC = TOTAL * (pctC / 100);
  const valD = TOTAL * (pctD / 100);
  const selicMedia = (selicAtual + selicFinal) / 2;
  const cdiMedia = selicMedia - 0.10;

  // ── Results (useMemo) ──────────────────────────────────────────────────────
  const results = useMemo(() => {
    // A — LTN
    const puCompraA = puLtn(TAXA_LTN / 100, DU_LTN);
    const duResA = Math.max(1, DU_LTN - hzDu);
    const taxaMercadoA = (TAXA_LTN + cp.deltaSelic) / 100;
    const puMtmA = puLtn(taxaMercadoA, duResA);
    const qtdA = valA > 0 ? valA / puCompraA : 0;
    const valFinalA = qtdA * puMtmA;
    const resultadoA = valFinalA - valA;
    const rendPctA = valA > 0 ? ((valFinalA / valA) - 1) * 100 : 0;

    // B — NTN-B
    const taxaNominal = (1 + TAXA_NTNB_REAL / 100) * (1 + META_INFLACAO_EX / 100) - 1;
    const fatorB = Math.pow(1 + taxaNominal, hzDu / 252);
    const duResB = Math.max(1, DU_NTNB - hzDu);
    const durB = (duResB / 252) / (1 + taxaNominal);
    const impactoMtmB = -durB * (cp.deltaSelic / 100);
    const valFinalB = valB * fatorB * (1 + impactoMtmB);
    const resultadoB = valFinalB - valB;
    const rendPctB = valB > 0 ? ((valFinalB / valB) - 1) * 100 : 0;

    // C — Compromissada
    const fatorC = Math.pow(1 + selicMedia / 100, hzDu / 252);
    const valFinalC = valC * fatorC;
    const resultadoC = valFinalC - valC;
    const rendPctC = valC > 0 ? ((valFinalC / valC) - 1) * 100 : 0;
    const fatorCDI = fatorC; // reference for % CDI equiv

    // D — Debênture
    const taxaDeb = cdiMedia + SPREAD_DEB + cp.deltaSpread;
    const fatorD = Math.pow(1 + taxaDeb / 100, hzDu / 252);
    const valFinalD = valD * fatorD;
    const resultadoD = valFinalD - valD;
    const rendPctD = valD > 0 ? ((valFinalD / valD) - 1) * 100 : 0;

    // % CDI equiv: how many % of CDI each alternative delivered
    const cdiBase = (fatorCDI - 1) * 100;
    const pctCdiA = cdiBase !== 0 ? (rendPctA / cdiBase) * 100 : 0;
    const pctCdiB = cdiBase !== 0 ? (rendPctB / cdiBase) * 100 : 0;
    const pctCdiC = cdiBase !== 0 ? (rendPctC / cdiBase) * 100 : 100;
    const pctCdiD = cdiBase !== 0 ? (rendPctD / cdiBase) * 100 : 0;

    const totalFinal = valFinalA + valFinalB + valFinalC + valFinalD;
    const totalResultado = totalFinal - TOTAL;
    const totalRendPct = ((totalFinal / TOTAL) - 1) * 100;
    const totalPctCdi = cdiBase !== 0 ? (totalRendPct / cdiBase) * 100 : 0;

    return {
      rows: [
        {
          label: "A — LTN (Pré-fixado)",
          val: valA,
          valFinal: valFinalA,
          resultado: resultadoA,
          rendPct: rendPctA,
          pctCdi: pctCdiA,
        },
        {
          label: "B — NTN-B (IPCA+)",
          val: valB,
          valFinal: valFinalB,
          resultado: resultadoB,
          rendPct: rendPctB,
          pctCdi: pctCdiB,
        },
        {
          label: "C — Compromissada (SELIC)",
          val: valC,
          valFinal: valFinalC,
          resultado: resultadoC,
          rendPct: rendPctC,
          pctCdi: pctCdiC,
        },
        {
          label: "D — Debênture (CDI+spread)",
          val: valD,
          valFinal: valFinalD,
          resultado: resultadoD,
          rendPct: rendPctD,
          pctCdi: pctCdiD,
        },
      ],
      total: {
        valFinal: totalFinal,
        resultado: totalResultado,
        rendPct: totalRendPct,
        pctCdi: totalPctCdi,
      },
      fatorC,
      cdiBase,
    };
  }, [valA, valB, valC, valD, hzDu, cp, selicMedia, cdiMedia]);

  // ── Evolution chart (useMemo) ──────────────────────────────────────────────
  const evolutionData = useMemo(() => {
    const days = Array.from({ length: hzDu + 1 }, (_, i) => i);
    const totalSeries: number[] = days.map((d) => {
      // A — LTN pro-rata
      const taxaMtmA = (TAXA_LTN + cp.deltaSelic * (d / Math.max(1, hzDu))) / 100;
      const duResA = Math.max(1, DU_LTN - d);
      const puCompraA = puLtn(TAXA_LTN / 100, DU_LTN);
      const puNowA = puLtn(taxaMtmA, duResA);
      const qtdA = valA > 0 ? valA / puCompraA : 0;
      const vA = qtdA * puNowA;

      // B — NTN-B pro-rata MtM
      const taxaNominal = (1 + TAXA_NTNB_REAL / 100) * (1 + META_INFLACAO_EX / 100) - 1;
      const fatorB = Math.pow(1 + taxaNominal, d / 252);
      const duResB = Math.max(1, DU_NTNB - d);
      const durB = (duResB / 252) / (1 + taxaNominal);
      const deltaProg = cp.deltaSelic * (d / Math.max(1, hzDu));
      const impactoMtmB = -durB * (deltaProg / 100);
      const vB = valB * fatorB * (1 + impactoMtmB);

      // C — Compromissada compound
      const selicD = selicAtual + cp.deltaSelic * (d / Math.max(1, hzDu));
      const fatorC = Math.pow(1 + selicD / 100, d / 252);
      const vC = valC * fatorC;

      // D — Debênture CDI + spread pro-rata
      const taxaDebD = cdiMedia + SPREAD_DEB + cp.deltaSpread * (d / Math.max(1, hzDu));
      const fatorD = Math.pow(1 + taxaDebD / 100, d / 252);
      const vD = valD * fatorD;

      return vA + vB + vC + vD;
    });

    return { days, totalSeries };
  }, [valA, valB, valC, valD, hzDu, cp, selicAtual, selicMedia, cdiMedia]);

  // ── Pie data ───────────────────────────────────────────────────────────────
  const pieData = useMemo(() => {
    const labels: string[] = [];
    const values: number[] = [];
    const colors: string[] = [];
    const entries = [
      { key: "A", label: "LTN (Pré-fixado)", pct: pctA },
      { key: "B", label: "NTN-B (IPCA+)", pct: pctB },
      { key: "C", label: "Compromissada (SELIC)", pct: pctC },
      { key: "D", label: "Debênture (CDI+)", pct: pctD },
    ];
    for (const e of entries) {
      if (e.pct > 0) {
        labels.push(e.label);
        values.push(e.pct);
        colors.push(ALT_COLORS[e.key]);
      }
    }
    return { labels, values, colors };
  }, [pctA, pctB, pctC, pctD]);

  // ── Qualitative Analysis ───────────────────────────────────────────────────
  const qualAnalysis = useMemo(() => {
    const msgs: { text: string; color: string }[] = [];
    if (pctA + pctB > 50) {
      msgs.push({
        text: "Mais de 50% da carteira está em títulos marcados a mercado (LTN + NTN-B). Em cenários de alta de juros, o portfólio pode registrar perdas contábeis de MtM antes do vencimento — avalie a compatibilidade com o horizonte de investimento.",
        color: "#CC3333",
      });
    }
    if (pctC > 50) {
      msgs.push({
        text: "Carteira com mais da metade em Compromissada/SELIC. Alta proteção contra volatilidade de taxas e liquidez diária garantida, porém rendimento limitado ao CDI sem prêmio. Apropriada para reserva de liquidez, não para maximizar retorno.",
        color: "#2E75B6",
      });
    }
    if (pctD > 0) {
      msgs.push({
        text: `Debênture com spread de ${SPREAD_DEB.toFixed(2)} pp sobre CDI. Avalie se o prêmio compensa o risco de crédito e a menor liquidez do ativo. Em estresse de spread, o MtM pode deteriorar mesmo com CDI estável.`,
        color: "#C55A11",
      });
    }
    if (
      (cenario === "Hawkish (alta de 100 bps em 3M)" ||
        cenario === "Estresse (alta 300 bps + abertura spread)") &&
      pctA > 30
    ) {
      msgs.push({
        text: `Atenção: ${pctA}% da carteira em LTN pré-fixado num cenário de alta de juros. O PU da LTN cai com a abertura de taxas — uma exposição pré-fixada elevada pode gerar resultado negativo relevante no horizonte selecionado.`,
        color: "#CC3333",
      });
    }
    return msgs;
  }, [pctA, pctB, pctC, pctD, cenario]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="pt-16 pb-20 mesh-bg">
      <div className="max-w-5xl mx-auto px-6 space-y-12">

        {/* ── Section 1 — Header + Case ─────────────────────────────────── */}
        <section className="space-y-6">
          <h1 className="font-headline text-2xl md:text-3xl font-extrabold">
            🧩 Exercício Integrador — Decisão de Tesouraria
          </h1>

          {/* Managerial question */}
          <div className="glass-card rounded-lg p-4 border-l-4 border-primary">
            <p className="text-on-surface-variant text-sm">
              <strong className="text-on-surface">Pergunta gerencial:</strong>{" "}
              &ldquo;Como alocar R$ 50 milhões de caixa excedente considerando o cenário macro
              atual, o horizonte de aplicação e as restrições de risco de mercado?&rdquo;
            </p>
          </div>

          {/* Case narrative */}
          <div className="glass-card rounded-lg p-5 border-l-4 border-[#ff9f4a] space-y-3">
            <p className="text-sm font-headline font-bold text-[#ff9f4a]">
              Contexto do Caso
            </p>
            <p className="text-sm text-on-surface-variant">
              O Banco Tesoureiro Regional encerrou o trimestre com R$ 50 milhões de caixa
              excedente após a liquidação de uma carteira de crédito. O comitê de ALM
              (Asset-Liability Management) precisa alocar esses recursos com horizonte de{" "}
              <strong>até 12 meses</strong>, balanceando retorno, risco de mercado e liquidez.
            </p>
            <p className="text-sm text-on-surface-variant">
              A tesoureira apresentou quatro alternativas de investimento:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-on-surface-variant pl-2">
              <li>
                <strong>LTN (Alternativa A)</strong> — Letra do Tesouro Nacional, pré-fixada,
                vencimento em 1 ano, taxa de {TAXA_LTN.toFixed(2)}% a.a.
              </li>
              <li>
                <strong>NTN-B (Alternativa B)</strong> — Nota do Tesouro Nacional série B,
                indexada ao IPCA, IPCA + {TAXA_NTNB_REAL.toFixed(2)}% a.a., prazo ~3 anos.
              </li>
              <li>
                <strong>Compromissada (Alternativa C)</strong> — Operação compromissada com
                lastro em títulos públicos, remuneração diária à SELIC, liquidez D+0.
              </li>
              <li>
                <strong>Debênture (Alternativa D)</strong> — Título corporativo investment
                grade, CDI + {SPREAD_DEB.toFixed(2)} pp, prazo 2 anos.
              </li>
            </ol>
          </div>
        </section>

        {/* ── Section 2 — Decision Panel ────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="font-headline font-bold text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">tune</span>
            Painel de Decisão — Monte sua Carteira
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: sliders */}
            <div className="glass-card rounded-lg p-5 space-y-5">
              <p className="text-xs font-label text-on-surface-variant font-bold uppercase tracking-wide">
                Alocação por Alternativa (%)
              </p>

              {/* A — LTN */}
              <div className="space-y-1">
                <label className="flex justify-between text-sm font-label">
                  <span>A — LTN (Pré-fixado)</span>
                  <span className="text-primary font-bold">{pctA}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={pctA}
                  onChange={(e) => setPctA(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <p className="text-xs text-on-surface-variant">{fmtBrl(TOTAL * pctA / 100)}</p>
              </div>

              {/* B — NTN-B */}
              <div className="space-y-1">
                <label className="flex justify-between text-sm font-label">
                  <span>B — NTN-B (IPCA+)</span>
                  <span className="text-[#2E8B57] font-bold">{pctB}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={pctB}
                  onChange={(e) => setPctB(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <p className="text-xs text-on-surface-variant">{fmtBrl(TOTAL * pctB / 100)}</p>
              </div>

              {/* C — Compromissada */}
              <div className="space-y-1">
                <label className="flex justify-between text-sm font-label">
                  <span>C — Compromissada (SELIC)</span>
                  <span className="text-[#5B8AB5] font-bold">{pctC}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={pctC}
                  onChange={(e) => setPctC(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <p className="text-xs text-on-surface-variant">{fmtBrl(TOTAL * pctC / 100)}</p>
              </div>

              {/* Validation */}
              {!valid && (
                <div className="glass-card rounded-lg p-3 border-l-4 border-[#CC3333] bg-[#CC3333]/10">
                  <p className="text-sm text-[#CC3333] font-bold">
                    Soma A+B+C = {somaABC}% — excede 100%. Reduza as alocações.
                  </p>
                </div>
              )}
            </div>

            {/* Right: derived + scenario + horizon */}
            <div className="space-y-4">
              {/* D metric card */}
              <div className="glass-card rounded-lg p-5 border-t-2 border-[#C55A11]">
                <p className="text-xs font-label text-on-surface-variant mb-1">
                  D — Debênture (calculado automaticamente)
                </p>
                <p className="text-3xl font-headline font-bold text-[#C55A11]">
                  {pctD}%
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  {fmtBrl(valD)} · 100% − {somaABC}%
                </p>
              </div>

              {/* Scenario select */}
              <div className="glass-card rounded-lg p-5 space-y-3">
                <div>
                  <label className="block text-xs font-label text-on-surface-variant mb-1">
                    Cenário Macroeconômico
                  </label>
                  <select
                    value={cenario}
                    onChange={(e) => setCenario(e.target.value)}
                    className={INPUT_CLASS}
                  >
                    {Object.keys(CENARIO_PARAMS).map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-on-surface-variant mt-1">
                    SELIC: {fmtPct(selicAtual, 2)} → {fmtPct(selicFinal, 2)} (
                    {cp.deltaSelic >= 0 ? "+" : ""}
                    {cp.deltaSelic.toFixed(2)} pp)
                  </p>
                </div>

                {/* Horizon slider */}
                <div>
                  <label className="flex justify-between text-xs font-label text-on-surface-variant mb-1">
                    <span>Horizonte de análise</span>
                    <span className="text-primary font-bold">
                      {horizonte} {horizonte === 1 ? "mês" : "meses"} (~{hzDu} DU)
                    </span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={12}
                    step={1}
                    value={horizonte}
                    onChange={(e) => setHorizonte(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                    <span>1M</span>
                    <span>6M</span>
                    <span>12M</span>
                  </div>
                </div>

                {/* SELIC input */}
                <div>
                  <label className="block text-xs font-label text-on-surface-variant mb-1">
                    SELIC Meta atual (% a.a.)
                  </label>
                  <input
                    type="number"
                    value={selicAtual}
                    onChange={(e) => setSelicAtual(Number(e.target.value))}
                    step={0.25}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Sections 3-7: only when valid ─────────────────────────────── */}
        {valid && (
          <>
            {/* ── Section 3 — Results Table ──────────────────────────────── */}
            <section className="space-y-4">
              <h2 className="font-headline font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">table_chart</span>
                Resultado da Carteira — {cenario}
              </h2>

              <div className="glass-card rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/30 bg-surface-container">
                      <th className="text-left px-4 py-3 font-label text-on-surface-variant">
                        Alternativa
                      </th>
                      <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                        Alocado
                      </th>
                      <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                        Resultado (R$)
                      </th>
                      <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                        Rendimento (%)
                      </th>
                      <th className="text-right px-4 py-3 font-label text-on-surface-variant">
                        % CDI equiv.
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.rows.map((row, i) => (
                      <tr
                        key={row.label}
                        className={`border-b border-outline-variant/20 ${
                          i % 2 === 0 ? "bg-surface-container/40" : ""
                        }`}
                      >
                        <td className="px-4 py-3 font-label">{row.label}</td>
                        <td className="px-4 py-3 text-right font-label text-on-surface-variant">
                          {row.val > 0 ? fmtBrl(row.val) : "—"}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-label ${
                            row.resultado >= 0 ? "text-[#2E8B57]" : "text-[#CC3333]"
                          }`}
                        >
                          {row.val > 0 ? fmtSign(row.resultado) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-label">
                          {row.val > 0 ? fmtPct(row.rendPct, 4) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-label">
                          {row.val > 0 ? fmtPct(row.pctCdi, 1) : "—"}
                        </td>
                      </tr>
                    ))}
                    {/* TOTAL row */}
                    <tr className="bg-surface-container border-t-2 border-outline-variant/40">
                      <td className="px-4 py-3 font-headline font-bold">TOTAL</td>
                      <td className="px-4 py-3 text-right font-headline font-bold">
                        {fmtBrl(TOTAL)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-headline font-bold ${
                          results.total.resultado >= 0 ? "text-[#2E8B57]" : "text-[#CC3333]"
                        }`}
                      >
                        {fmtSign(results.total.resultado)}
                      </td>
                      <td className="px-4 py-3 text-right font-headline font-bold">
                        {fmtPct(results.total.rendPct, 4)}
                      </td>
                      <td className="px-4 py-3 text-right font-headline font-bold">
                        {fmtPct(results.total.pctCdi, 1)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary cards */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="glass-card rounded-lg p-4 border-t-2 border-primary">
                  <p className="text-xs font-label text-on-surface-variant mb-1">
                    Valor Final Projetado
                  </p>
                  <p className="text-xl font-headline font-bold text-primary">
                    {fmtBrl(results.total.valFinal)}
                  </p>
                </div>
                <div className="glass-card rounded-lg p-4 border-t-2 border-[#2E8B57]">
                  <p className="text-xs font-label text-on-surface-variant mb-1">
                    Rendimento Total
                  </p>
                  <p
                    className={`text-xl font-headline font-bold ${
                      results.total.resultado >= 0 ? "text-[#2E8B57]" : "text-[#CC3333]"
                    }`}
                  >
                    {fmtSign(results.total.resultado)}
                  </p>
                </div>
                <div className="glass-card rounded-lg p-4 border-t-2 border-[#C55A11]">
                  <p className="text-xs font-label text-on-surface-variant mb-1">
                    Equivalente CDI
                  </p>
                  <p className="text-xl font-headline font-bold text-[#C55A11]">
                    {fmtPct(results.total.pctCdi, 1)}
                  </p>
                </div>
              </div>
            </section>

            {/* ── Section 4 — Pie Chart ──────────────────────────────────── */}
            <section className="space-y-4">
              <h2 className="font-headline font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">pie_chart</span>
                Composição da Carteira
              </h2>
              <div className="glass-card rounded-lg overflow-hidden">
                <PlotlyChart
                  data={[
                    {
                      type: "pie",
                      labels: pieData.labels,
                      values: pieData.values,
                      marker: { colors: pieData.colors },
                      textinfo: "label+percent",
                      hovertemplate:
                        "<b>%{label}</b><br>%{value}%<br>%{percent}<extra></extra>",
                    },
                  ]}
                  layout={{
                    ...PLOTLY_LAYOUT,
                    height: 400,
                    margin: { l: 30, r: 30, t: 40, b: 30 },
                    showlegend: true,
                    legend: { font: { color: "#aaabb0" } },
                  }}
                  config={PLOTLY_CONFIG}
                  className="h-[400px]"
                />
              </div>
            </section>

            {/* ── Section 5 — Evolution Chart ────────────────────────────── */}
            <section className="space-y-4">
              <h2 className="font-headline font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">trending_up</span>
                Evolução do Portfólio
              </h2>
              <div className="glass-card rounded-lg overflow-hidden">
                <PlotlyChart
                  data={[
                    {
                      type: "scatter",
                      mode: "lines",
                      x: evolutionData.days,
                      y: evolutionData.totalSeries,
                      name: "Carteira",
                      line: { color: "#2E75B6", width: 2 },
                      hovertemplate: "Dia %{x}<br>%{y:,.0f}<extra></extra>",
                    },
                    {
                      type: "scatter",
                      mode: "lines",
                      x: [0, hzDu],
                      y: [TOTAL, TOTAL],
                      name: "Capital inicial",
                      line: { color: "#888888", width: 1, dash: "dash" },
                      hoverinfo: "skip",
                    },
                  ]}
                  layout={{
                    ...PLOTLY_LAYOUT,
                    height: 400,
                    title: {
                      text: `Evolução — Cenário: ${cenario}`,
                      font: { color: "#aaabb0", size: 13 },
                    },
                    xaxis: {
                      ...PLOTLY_LAYOUT.xaxis,
                      title: { text: "Dias Úteis", font: { color: "#aaabb0" } },
                    },
                    yaxis: {
                      ...PLOTLY_LAYOUT.yaxis,
                      title: { text: "Valor (R$)", font: { color: "#aaabb0" } },
                      tickformat: ",.0f",
                    },
                  }}
                  config={PLOTLY_CONFIG}
                  className="h-[400px]"
                />
              </div>
            </section>

            {/* ── Section 6 — Qualitative Analysis ──────────────────────── */}
            {qualAnalysis.length > 0 && (
              <section className="space-y-4">
                <h2 className="font-headline font-bold text-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">analytics</span>
                  Análise Qualitativa da Carteira
                </h2>
                <div className="space-y-3">
                  {qualAnalysis.map((msg, i) => (
                    <div
                      key={i}
                      className="glass-card rounded-lg p-4 border-l-4"
                      style={{ borderColor: msg.color }}
                    >
                      <p className="text-sm text-on-surface-variant">{msg.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Section 7 — Reflection Questions ──────────────────────── */}
            <section className="space-y-4">
              <h2 className="font-headline font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">quiz</span>
                Questões para Reflexão
              </h2>
              <div className="glass-card rounded-lg p-6 space-y-4">
                <p className="text-xs font-label text-on-surface-variant uppercase tracking-wide font-bold">
                  Discuta com sua equipe ou responda individualmente:
                </p>
                <ol className="list-decimal list-inside space-y-4 text-sm text-on-surface-variant">
                  <li>
                    <strong className="text-on-surface">Risco de MtM vs. carregamento:</strong>{" "}
                    Em que situações é racional manter uma LTN com MtM negativo sem vendê-la?
                    Qual o papel do horizonte de investimento nessa decisão?
                  </li>
                  <li>
                    <strong className="text-on-surface">Proteção inflacionária:</strong> A
                    NTN-B garante poder de compra real independentemente do cenário de juros? Há
                    situações em que o investidor perde em termos reais mesmo com NTN-B?
                  </li>
                  <li>
                    <strong className="text-on-surface">Custo de oportunidade da liquidez:</strong>{" "}
                    O banco decidiu manter 50% em Compromissada pelo conforto da liquidez D+0.
                    Quanto de retorno potencial ele está abrindo mão no cenário base?
                  </li>
                  <li>
                    <strong className="text-on-surface">Adequação do spread de crédito:</strong>{" "}
                    O spread de {SPREAD_DEB.toFixed(2)} pp da debênture é suficiente para
                    compensar o risco de crédito e a iliquidez? Como você avaliaria se o prêmio
                    é justo para um emissor investment grade?
                  </li>
                  <li>
                    <strong className="text-on-surface">Decisão de comitê:</strong> Dado o
                    cenário hawkish, qual seria sua alocação recomendada? Justifique em termos
                    de risco (duration, crédito, liquidez), retorno esperado e adequação ao
                    ALM do banco.
                  </li>
                </ol>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
