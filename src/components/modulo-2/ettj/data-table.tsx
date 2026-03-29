import { DI1Contract } from "@/lib/ettj/types";

interface DataTableProps {
  contracts: DI1Contract[];
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function DataTable({ contracts }: DataTableProps) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/30">
              <th className="text-left px-4 py-3 text-on-surface-variant uppercase text-xs font-semibold tracking-wider">
                Contrato
              </th>
              <th className="text-left px-4 py-3 text-on-surface-variant uppercase text-xs font-semibold tracking-wider">
                Vencimento
              </th>
              <th className="text-right px-4 py-3 text-on-surface-variant uppercase text-xs font-semibold tracking-wider">
                Dias Úteis
              </th>
              <th className="text-right px-4 py-3 text-on-surface-variant uppercase text-xs font-semibold tracking-wider">
                Taxa (%)
              </th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <tr
                key={c.ticker}
                className="border-b border-outline-variant/10 even:bg-surface-container/30"
              >
                <td className="px-4 py-2.5 text-on-surface text-sm font-mono">
                  {c.ticker}
                </td>
                <td className="px-4 py-2.5 text-on-surface text-sm">
                  {formatDate(c.expiration)}
                </td>
                <td className="px-4 py-2.5 text-on-surface text-sm text-right">
                  {c.bdays}
                </td>
                <td className="px-4 py-2.5 text-on-surface text-sm text-right font-mono">
                  {(c.rate * 100).toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 text-on-surface-variant text-xs border-t border-outline-variant/20">
        {contracts.length} contratos
      </div>
    </div>
  );
}
