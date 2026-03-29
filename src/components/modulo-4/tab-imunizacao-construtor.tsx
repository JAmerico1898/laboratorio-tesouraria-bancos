"use client";

import { useState, useMemo, useEffect } from "react";
import { durationZeroCupom, calcularPesosImunizacao } from "@/lib/finance";
import { fmtBrl, fmtPct } from "@/lib/format";
import { PlotlyChart } from "@/components/plotly-chart";
import { Math as KMath } from "@/components/math";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG } from "@/lib/chart-config";

export interface ImunData {
  vp: number;
  vf: number;
  horizonte: number;
  wC: number;
  wL: number;
  dC: number;
  dL: number;
  txC: number;
  txL: number;
  titC: string;
  titL: string;
  conv: number;
}

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

const SELECT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

const TITULO_CURTO_MAP: Record<string, number> = {
  "LTN 1A": 252,
  "LTN 2A": 504,
  "CDB pre 1A": 252,
};

const TITULO_LONGO_MAP: Record<string, number> = {
  "LTN 5A": 1260,
  "NTN-F 5A": 1260,
  "NTN-F 7A": 1764,
};

export function TabImunizacaoConstrutor({
  onImunChange,
}: {
  onImunChange?: (data: ImunData) => void;
}) {
  const [vf, setVf] = useState(10_000_000);
  const [prazo, setPrazo] = useState(3);
  const [titCurto, setTitCurto] = useState("LTN 1A");
  const [titLongo, setTitLongo] = useState("LTN 5A");
  const [txCurto, setTxCurto] = useState(12.0);
  const [txLongo, setTxLongo] = useState(13.0);

  const duCurto = TITULO_CURTO_MAP[titCurto];
  const duLongo = TITULO_LONGO_MAP[titLongo];

  const calc = useMemo(() => {
    const rC = durationZeroCupom(txCurto / 100, duCurto);
    const rL = durationZeroCupom(txLongo / 100, duLongo);
    const [wC, wL] = calcularPesosImunizacao(prazo, rC.durMod, rL.durMod);
    const taxaMedia = (txCurto + txLongo) / 2 / 100;
    const vpObrig = vf / Math.pow(1 + taxaMedia, prazo);
    const invC = vpObrig * wC;
    const invL = vpObrig * wL;
    const durCart = wC * rC.durMod + wL * rL.durMod;
    const convCart = wC * rC.convexidade + wL * rL.convexidade;

    return {
      rC,
      rL,
      wC,
      wL,
      vpObrig,
      invC,
      invL,
      durCart,
      convCart,
    };
  }, [txCurto, txLongo, duCurto, duLongo, prazo, vf]);

  useEffect(() => {
    if (onImunChange) {
      onImunChange({
        vp: calc.vpObrig,
        vf,
        horizonte: prazo,
        wC: calc.wC,
        wL: calc.wL,
        dC: calc.rC.durMod,
        dL: calc.rL.durMod,
        txC: txCurto / 100,
        txL: txLongo / 100,
        titC: titCurto,
        titL: titLongo,
        conv: calc.convCart,
      });
    }
  }, [calc, vf, prazo, txCurto, txLongo, titCurto, titLongo, onImunChange]);

  return (
    <div className="space-y-8">
      {/* Concept expander */}
      <details className="glass-card rounded-lg">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">
            school
          </span>
          Conceitos: Imunização de Carteira
        </summary>
        <div className="px-5 pb-5 space-y-4 text-sm text-on-surface-variant">
          <div>
            <p className="font-bold text-on-surface mb-1">Problema</p>
            <p>
              O gestor precisa garantir que a carteira cubra uma obrigação
              futura em data específica, independentemente de movimentos nas
              taxas de juros. Se as taxas sobem, o preço dos títulos cai (perda
              de MtM), mas a reinversão dos cupons gera mais receita &mdash; e
              vice-versa.
            </p>
          </div>
          <div>
            <p className="font-bold text-on-surface mb-1">Solução</p>
            <p>
              Casar a duration da carteira com o horizonte da obrigação. Quando{" "}
              <KMath tex="D_{cart} = H_{obrigacao}" />, os efeitos de MtM e
              reinvestimento se anulam aproximadamente.
            </p>
          </div>
          <div>
            <p className="font-bold text-on-surface mb-1">Mecanismo</p>
            <p>
              Combinamos dois títulos (curto e longo) com pesos tais que a
              duration ponderada iguale o prazo-alvo:
            </p>
            <KMath tex="w_C \cdot D_C + w_L \cdot D_L = H" />
            <KMath tex="w_C + w_L = 1" />
          </div>
          <div>
            <p className="font-bold text-on-surface mb-1">
              3 Condições para Imunização
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>
                <strong>Duration matching:</strong> Duration da carteira = horizonte
                da obrigação
              </li>
              <li>
                <strong>Valor presente:</strong> VP da carteira &ge; VP da
                obrigação
              </li>
              <li>
                <strong>Convexidade positiva:</strong> Carteira deve ter convexidade
                &ge; convexidade da obrigação (proteção adicional)
              </li>
            </ol>
          </div>
        </div>
      </details>

      {/* Inputs: 2-column */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Obrigação */}
        <div className="glass-card rounded-lg p-4 space-y-4">
          <h3 className="font-headline font-bold text-sm border-b border-outline-variant/30 pb-2">
            Obrigação
          </h3>
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Valor futuro (R$): {fmtBrl(vf)}
            </label>
            <input
              type="number"
              value={vf}
              step={1_000_000}
              min={1_000_000}
              onChange={(e) => setVf(Number(e.target.value))}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Prazo (anos): {prazo.toFixed(1)}
            </label>
            <input
              type="number"
              value={prazo}
              step={0.5}
              min={0.5}
              max={10}
              onChange={(e) => setPrazo(Number(e.target.value))}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        {/* Right: Instrumentos */}
        <div className="glass-card rounded-lg p-4 space-y-4">
          <h3 className="font-headline font-bold text-sm border-b border-outline-variant/30 pb-2">
            Instrumentos
          </h3>
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Título curto
            </label>
            <select
              value={titCurto}
              onChange={(e) => setTitCurto(e.target.value)}
              className={SELECT_CLASS}
            >
              {Object.keys(TITULO_CURTO_MAP).map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Título longo
            </label>
            <select
              value={titLongo}
              onChange={(e) => setTitLongo(e.target.value)}
              className={SELECT_CLASS}
            >
              {Object.keys(TITULO_LONGO_MAP).map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Taxa curto (%): {txCurto.toFixed(2)}%
              </label>
              <input
                type="number"
                value={txCurto}
                step={0.25}
                onChange={(e) => setTxCurto(Number(e.target.value))}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-xs font-label text-on-surface-variant mb-1">
                Taxa longo (%): {txLongo.toFixed(2)}%
              </label>
              <input
                type="number"
                value={txLongo}
                step={0.25}
                onChange={(e) => setTxLongo(Number(e.target.value))}
                className={INPUT_CLASS}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-step output */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step 1: Durations */}
        <div className="glass-card rounded-lg p-4">
          <h4 className="font-headline font-bold text-sm text-primary mb-3">
            1. Durations
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">
                D<sub>mod</sub> ({titCurto})
              </span>
              <span className="font-bold">{calc.rC.durMod.toFixed(4)} anos</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">
                D<sub>mod</sub> ({titLongo})
              </span>
              <span className="font-bold">{calc.rL.durMod.toFixed(4)} anos</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Horizonte-alvo</span>
              <span className="font-bold">{prazo.toFixed(2)} anos</span>
            </div>
          </div>
        </div>

        {/* Step 2: Proporções */}
        <div className="glass-card rounded-lg p-4">
          <h4 className="font-headline font-bold text-sm text-primary mb-3">
            2. Proporções
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">
                Peso {titCurto} (w<sub>C</sub>)
              </span>
              <span className="font-bold">{fmtPct(calc.wC * 100)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">
                Peso {titLongo} (w<sub>L</sub>)
              </span>
              <span className="font-bold">{fmtPct(calc.wL * 100)}</span>
            </div>
          </div>
        </div>

        {/* Step 3: Valores */}
        <div className="glass-card rounded-lg p-4">
          <h4 className="font-headline font-bold text-sm text-primary mb-3">
            3. Valores
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">VP obrigação</span>
              <span className="font-bold">{fmtBrl(calc.vpObrig)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">
                Investimento {titCurto}
              </span>
              <span className="font-bold">{fmtBrl(calc.invC)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">
                Investimento {titLongo}
              </span>
              <span className="font-bold">{fmtBrl(calc.invL)}</span>
            </div>
          </div>
        </div>

        {/* Step 4: Verificação */}
        <div className="glass-card rounded-lg p-4">
          <h4 className="font-headline font-bold text-sm text-primary mb-3">
            4. Verificação
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant">
                D<sub>cart</sub> = horizonte?
              </span>
              <span className="font-bold">
                {calc.durCart.toFixed(4)} &asymp; {prazo.toFixed(2)}{" "}
                {Math.abs(calc.durCart - prazo) < 0.01 ? (
                  <span className="text-green-400">&#10003;</span>
                ) : (
                  <span className="text-yellow-400">&#9888;</span>
                )}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant">VP &ge; obrigacao?</span>
              <span className="font-bold">
                {fmtBrl(calc.vpObrig)}{" "}
                <span className="text-green-400">&#10003;</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant">Convexidade cart.</span>
              <span className="font-bold">
                {calc.convCart.toFixed(4)}{" "}
                {calc.convCart > 0 ? (
                  <span className="text-green-400">&#10003;</span>
                ) : (
                  <span className="text-red-400">&#10007;</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Donut chart */}
      <div className="glass-card rounded-lg p-4">
        <h3 className="font-headline font-bold text-sm mb-4">
          Alocação da Carteira Imunizada
        </h3>
        <PlotlyChart
          className="h-[350px]"
          data={[
            {
              labels: [titCurto, titLongo],
              values: [calc.invC, calc.invL],
              type: "pie" as const,
              hole: 0.5,
              marker: { colors: ["#2E75B6", "#C55A11"] },
              textinfo: "label+percent",
              hovertemplate:
                "%{label}<br>R$ %{value:,.0f}<br>%{percent}<extra></extra>",
            },
          ]}
          layout={{
            ...PLOTLY_LAYOUT,
            showlegend: true,
            legend: {
              font: { color: "#aaabb0", size: 12 },
              orientation: "h" as const,
              x: 0.5,
              xanchor: "center" as const,
              y: -0.1,
            },
          }}
          config={PLOTLY_CONFIG}
        />
      </div>
    </div>
  );
}
