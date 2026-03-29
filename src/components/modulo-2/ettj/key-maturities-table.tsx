import { KEY_MATURITIES } from "@/lib/ettj/constants";

interface KeyMaturitiesTableProps {
  ratesA: Map<number, number>;
  ratesB: Map<number, number>;
}

const maturities = Object.keys(KEY_MATURITIES).map(Number);

export default function KeyMaturitiesTable({
  ratesA,
  ratesB,
}: KeyMaturitiesTableProps) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/30">
              <th className="text-left px-4 py-3 text-on-surface-variant uppercase text-xs font-semibold tracking-wider">
                Prazo
              </th>
              <th className="text-right px-4 py-3 text-on-surface-variant uppercase text-xs font-semibold tracking-wider">
                DU
              </th>
              <th className="text-right px-4 py-3 text-on-surface-variant uppercase text-xs font-semibold tracking-wider">
                Taxa A (%)
              </th>
              <th className="text-right px-4 py-3 text-on-surface-variant uppercase text-xs font-semibold tracking-wider">
                Taxa B (%)
              </th>
              <th className="text-right px-4 py-3 text-on-surface-variant uppercase text-xs font-semibold tracking-wider">
                &Delta; (p.p.)
              </th>
            </tr>
          </thead>
          <tbody>
            {maturities.map((du) => {
              const rA = ratesA.get(du);
              const rB = ratesB.get(du);
              const delta =
                rA !== undefined && rB !== undefined ? rB - rA : undefined;
              return (
                <tr
                  key={du}
                  className="border-b border-outline-variant/10 even:bg-surface-container/30"
                >
                  <td className="px-4 py-2.5 text-on-surface text-sm font-medium">
                    {KEY_MATURITIES[du]}
                  </td>
                  <td className="px-4 py-2.5 text-on-surface text-sm text-right font-mono">
                    {du}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-right font-mono text-blue-400">
                    {rA !== undefined ? (rA * 100).toFixed(4) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-right font-mono text-red-400">
                    {rB !== undefined ? (rB * 100).toFixed(4) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-right font-mono text-orange-400">
                    {delta !== undefined ? (delta * 100).toFixed(4) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 text-on-surface-variant text-xs border-t border-outline-variant/20">
        Prazos-chave interpolados
      </div>
    </div>
  );
}
