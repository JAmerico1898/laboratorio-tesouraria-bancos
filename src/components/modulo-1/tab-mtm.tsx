"use client";

import { useState, useMemo } from "react";
import { PlotlyChart } from "@/components/plotly-chart";
import { puLtn } from "@/lib/finance";
import { fmtBrl, fmtPct } from "@/lib/format";
import { PLOTLY_LAYOUT, PLOTLY_CONFIG, CHART_COLORS } from "@/lib/chart-config";

const INPUT_CLASS =
  "w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none";

const TRAJECTORIES = [
  "Estável (taxa constante)",
  "Alta gradual",
  "Queda gradual",
  "Choque de alta",
  "Choque de queda",
] as const;

type Trajectory = (typeof TRAJECTORIES)[number];

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  colorClass?: string;
}

function MetricCard({ label, value, sub, colorClass }: MetricCardProps) {
  return (
    <div className="glass-card rounded-lg p-4 flex flex-col gap-1">
      <span className="text-xs font-label text-on-surface-variant">{label}</span>
      <span className={`text-xl font-headline font-bold ${colorClass ?? ""}`}>{value}</span>
      {sub && <span className="text-xs text-on-surface-variant">{sub}</span>}
    </div>
  );
}

export function TabMtm() {
  const [purchaseValueStr, setPurchaseValueStr] = useState("10.000.000");
  const [purchaseRate, setPurchaseRate] = useState(12.0);
  const [totalMaturity, setTotalMaturity] = useState(252);
  const [trajectory, setTrajectory] = useState<Trajectory>("Choque de alta");
  const [magnitude, setMagnitude] = useState(200);

  const purchaseValue = useMemo(() => {
    const raw = purchaseValueStr.replace(/\D/g, "");
    return Number(raw) || 0;
  }, [purchaseValueStr]);

  const simData = useMemo(() => {
    if (purchaseValue <= 0 || totalMaturity <= 0) {
      return { days: [], accrual: [], mtm: [], puPurchase: 0, qty: 0 };
    }

    const purchaseRateDec = purchaseRate / 100;
    const magnitudeDec = magnitude / 10000;
    const puPurchase = puLtn(purchaseRateDec, totalMaturity);
    const qty = purchaseValue / puPurchase;

    const days: number[] = [];
    const accrualArr: number[] = [];
    const mtmArr: number[] = [];

    for (let d = 0; d <= totalMaturity; d++) {
      const remainingDU = totalMaturity - d;

      let marketRate: number;
      switch (trajectory) {
        case "Estável (taxa constante)":
          marketRate = purchaseRateDec;
          break;
        case "Alta gradual":
          marketRate = purchaseRateDec + magnitudeDec * Math.min(d / 126, 1);
          break;
        case "Queda gradual":
          marketRate = purchaseRateDec - magnitudeDec * Math.min(d / 126, 1);
          break;
        case "Choque de alta":
          marketRate = d >= 30 ? purchaseRateDec + magnitudeDec : purchaseRateDec;
          break;
        case "Choque de queda":
          marketRate = d >= 30 ? purchaseRateDec - magnitudeDec : purchaseRateDec;
          break;
        default:
          marketRate = purchaseRateDec;
      }

      // clamp market rate to avoid negative rates
      marketRate = Math.max(0.001, marketRate);

      const accrualPU = puLtn(purchaseRateDec, remainingDU);
      const mtmPU = puLtn(marketRate, remainingDU);

      days.push(d);
      accrualArr.push(qty * accrualPU);
      mtmArr.push(qty * mtmPU);
    }

    return { days, accrual: accrualArr, mtm: mtmArr, puPurchase, qty };
  }, [purchaseValue, purchaseRate, totalMaturity, trajectory, magnitude]);

  const metrics = useMemo(() => {
    const { accrual, mtm } = simData;
    if (accrual.length === 0) {
      return {
        accrualResult: 0,
        mtmResult: 0,
        diff: 0,
        worstDiff: 0,
        worstDay: 0,
      };
    }
    const accrualFinal = accrual[accrual.length - 1];
    const mtmFinal = mtm[mtm.length - 1];
    const accrualResult = accrualFinal - purchaseValue;
    const mtmResult = mtmFinal - purchaseValue;
    const diff = mtmResult - accrualResult;

    let worstDiff = 0;
    let worstDay = 0;
    for (let d = 0; d < accrual.length; d++) {
      const gap = mtm[d] - accrual[d];
      if (gap < worstDiff) {
        worstDiff = gap;
        worstDay = simData.days[d];
      }
    }

    return { accrualResult, mtmResult, diff, worstDiff, worstDay };
  }, [simData, purchaseValue]);

  return (
    <div className="space-y-8">
      {/* Concept expander */}
      <details className="glass-card rounded-xl">
        <summary className="px-5 py-4 cursor-pointer font-headline font-bold text-sm flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-base">school</span>
          Conceitos: Marcação a Mercado (MtM) vs. Curva de Aquisição
        </summary>
        <div className="px-5 pb-5 space-y-4 text-sm text-on-surface-variant">
          <p>
            Um título de renda fixa pode ser avaliado de duas formas distintas, dependendo da
            intenção de carregamento da tesouraria:
          </p>
          <div className="grid md:grid-cols-2 gap-4 mt-2">
            <div className="glass-card rounded-lg p-4 border-l-4 border-[#2E75B6]">
              <p className="font-label text-on-surface mb-1">Curva de Aquisição (Accrual)</p>
              <p>
                Valor contábil do título ao longo do tempo, crescendo pela taxa de compra
                (carregamento). Assume que o título será mantido até o vencimento — o rendimento é
                determinístico e calculado pela taxa de aquisição.
              </p>
            </div>
            <div className="glass-card rounded-lg p-4 border-l-4 border-[#C55A11]">
              <p className="font-label text-on-surface mb-1">Marcação a Mercado (MtM)</p>
              <p>
                Valor do título à taxa de mercado vigente a cada momento. Reflete o preço que seria
                obtido se o título fosse vendido imediatamente. Oscila com as condições de mercado —
                sobe quando a taxa cai, cai quando a taxa sobe.
              </p>
            </div>
          </div>
          <div className="glass-card rounded-lg p-4 border-l-4 border-primary">
            <p>
              <strong className="text-on-surface">Perda temporária vs. materializada:</strong> A
              diferença MtM − Accrual é temporária enquanto o título permanecer em carteira até o
              vencimento. Ela se materializa apenas se houver necessidade de venda antecipada — seja
              por exigência de liquidez, acionamento de limite de risco (VaR/stop-loss) ou captação
              de margem.
            </p>
          </div>
        </div>
      </details>

      {/* Inputs */}
      <div className="glass-card rounded-xl p-5 space-y-4">
        <h2 className="font-headline font-bold text-base flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">tune</span>
          Parâmetros da Simulação
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Valor de compra (R$)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={purchaseValueStr}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                const num = Number(raw) || 0;
                setPurchaseValueStr(num.toLocaleString("pt-BR"));
              }}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Taxa de compra (% a.a.)
            </label>
            <input
              type="number"
              value={purchaseRate}
              step={0.1}
              onChange={(e) => setPurchaseRate(Number(e.target.value))}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Prazo total: <strong>{totalMaturity} DU</strong>
            </label>
            <input
              type="range"
              min={63}
              max={504}
              value={totalMaturity}
              onChange={(e) => setTotalMaturity(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-on-surface-variant mt-1">
              <span>63 DU (≈ 3 m)</span>
              <span>504 DU (≈ 2 anos)</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Trajetória da taxa de mercado
            </label>
            <select
              value={trajectory}
              onChange={(e) => setTrajectory(e.target.value as Trajectory)}
              className={INPUT_CLASS}
            >
              {TRAJECTORIES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-label text-on-surface-variant mb-1">
              Magnitude do choque: <strong>{magnitude} bps</strong>
            </label>
            <input
              type="range"
              min={50}
              max={400}
              step={25}
              value={magnitude}
              onChange={(e) => setMagnitude(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-on-surface-variant mt-1">
              <span>50 bps</span>
              <span>400 bps</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="glass-card rounded-xl p-4">
        <PlotlyChart
          className="h-[500px]"
          data={[
            {
              x: simData.days,
              y: simData.accrual,
              type: "scatter",
              mode: "lines",
              name: "Curva (Accrual)",
              line: { color: CHART_COLORS.primary, width: 2.5 },
              hovertemplate: "DU %{x}: <b>R$ %{y:,.2f}</b><extra>Accrual</extra>",
            },
            {
              x: simData.days,
              y: simData.mtm,
              type: "scatter",
              mode: "lines",
              name: "MtM (mercado)",
              line: { color: CHART_COLORS.accent, width: 2.5 },
              fill: "tonexty",
              fillcolor: "rgba(150,150,200,0.10)",
              hovertemplate: "DU %{x}: <b>R$ %{y:,.2f}</b><extra>MtM</extra>",
            },
          ]}
          layout={{
            ...PLOTLY_LAYOUT,
            title: {
              text: "Evolução: Curva vs. MtM",
              font: { color: "#aaabb0", size: 14 },
            },
            xaxis: {
              ...PLOTLY_LAYOUT.xaxis,
              title: { text: "Dias Úteis" },
            },
            yaxis: {
              ...PLOTLY_LAYOUT.yaxis,
              title: { text: "Valor (R$)" },
              tickformat: ",.0f",
            },
            hovermode: "x unified",
            legend: {
              ...PLOTLY_LAYOUT.legend,
              orientation: "h",
              y: -0.12,
            },
            margin: { l: 80, r: 30, t: 60, b: 60 },
          }}
          config={PLOTLY_CONFIG}
        />
      </div>

      {/* Metric cards */}
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Resultado na Curva"
          value={fmtBrl(metrics.accrualResult)}
          sub="Carregamento até o vencimento"
          colorClass={metrics.accrualResult >= 0 ? "text-[#2E8B57]" : "text-[#CC3333]"}
        />
        <MetricCard
          label="Resultado MtM"
          value={fmtBrl(metrics.mtmResult)}
          sub="Se vendido no vencimento"
          colorClass={metrics.mtmResult >= 0 ? "text-[#2E8B57]" : "text-[#CC3333]"}
        />
        <MetricCard
          label="Diferença (MtM − Curva)"
          value={fmtBrl(metrics.diff)}
          sub="No vencimento (deve → 0)"
          colorClass={metrics.diff >= 0 ? "text-[#2E8B57]" : "text-[#CC3333]"}
        />
        <MetricCard
          label="Pior momento MtM"
          value={fmtBrl(metrics.worstDiff)}
          sub={
            metrics.worstDiff < 0
              ? `DU ${metrics.worstDay}`
              : "Sem perda MtM no período"
          }
          colorClass={metrics.worstDiff < 0 ? "text-[#CC3333]" : ""}
        />
      </div>

      {/* Info about purchase price */}
      {simData.puPurchase > 0 && (
        <div className="glass-card rounded-lg p-4 bg-surface-container/40">
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-on-surface-variant font-label">PU de compra:</span>{" "}
              <strong>R$ {simData.puPurchase.toFixed(6).replace(".", ",")}</strong>
            </div>
            <div>
              <span className="text-on-surface-variant font-label">Taxa de compra:</span>{" "}
              <strong>{fmtPct(purchaseRate / 100, 2)}</strong>
            </div>
            <div>
              <span className="text-on-surface-variant font-label">Quantidade (R$ 1.000 face):</span>{" "}
              <strong>{simData.qty.toFixed(2).replace(".", ",")}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="glass-card rounded-lg p-4 border-l-4 border-primary">
        <p className="text-sm text-on-surface-variant">
          <strong className="text-on-surface">Dilema fundamental do risco de mercado:</strong> A
          diferença entre resultado na curva e MtM é temporária se o título for carregado até o
          vencimento. Porém, se a tesouraria precisar vender antes (liquidez ou limite de risco), a
          perda MtM se materializa. Este é o dilema fundamental do risco de mercado.
        </p>
      </div>
    </div>
  );
}
