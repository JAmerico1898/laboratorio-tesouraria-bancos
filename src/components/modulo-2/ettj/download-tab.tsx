"use client";

import { useCallback } from "react";
import { DI1Contract } from "@/lib/ettj/types";

interface DownloadTabProps {
  curveData: { bdays: number; rate: number }[];
  contracts: DI1Contract[];
  date: string;
  method: string;
}

function downloadCSV(filename: string, content: string) {
  const blob = new Blob(["\uFEFF" + content], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatDateCompact(iso: string): string {
  return iso.replace(/-/g, "");
}

function toCommaDecimal(n: number, digits: number): string {
  return n.toFixed(digits).replace(".", ",");
}

export default function DownloadTab({
  curveData,
  contracts,
  date,
  method,
}: DownloadTabProps) {
  const dateFmt = formatDateCompact(date);

  const handleDownloadCurve = useCallback(() => {
    const header = "DiasUteis;TaxaAjustada_pct";
    const rows = curveData.map(
      (d) => `${d.bdays};${toCommaDecimal(d.rate * 100, 6)}`
    );
    const csv = [header, ...rows].join("\n");
    downloadCSV(`curva_di_${dateFmt}_${method}.csv`, csv);
  }, [curveData, dateFmt, method]);

  const handleDownloadOriginal = useCallback(() => {
    const header = "Contrato;Vencimento;DiasUteis;Taxa_pct";
    const rows = contracts.map(
      (c) =>
        `${c.ticker};${c.expiration};${c.bdays};${toCommaDecimal(c.rate * 100, 4)}`
    );
    const csv = [header, ...rows].join("\n");
    downloadCSV(`dados_di1_${dateFmt}.csv`, csv);
  }, [contracts, dateFmt]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <button
        onClick={handleDownloadCurve}
        className="glass-card rounded-xl p-6 text-left hover:bg-surface-container/50 transition-colors group"
      >
        <div className="text-on-surface text-base font-semibold mb-2 group-hover:text-primary transition-colors">
          📥 Download Curva Ajustada (CSV)
        </div>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          Curva interpolada com {curveData.length} pontos. Formato CSV com
          separador ponto-e-vírgula e decimal com vírgula (padrão brasileiro).
        </p>
        <div className="mt-3 text-xs text-on-surface-variant font-mono">
          curva_di_{dateFmt}_{method}.csv
        </div>
      </button>

      <button
        onClick={handleDownloadOriginal}
        className="glass-card rounded-xl p-6 text-left hover:bg-surface-container/50 transition-colors group"
      >
        <div className="text-on-surface text-base font-semibold mb-2 group-hover:text-primary transition-colors">
          📥 Download Dados Originais (CSV)
        </div>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          Dados originais dos {contracts.length} contratos DI1 observados no
          mercado, com ticker, vencimento, dias úteis e taxa.
        </p>
        <div className="mt-3 text-xs text-on-surface-variant font-mono">
          dados_di1_{dateFmt}.csv
        </div>
      </button>
    </div>
  );
}
