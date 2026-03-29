interface ComparisonStatsProps {
  diffMean: number;
  diffMax: number;
  diffMin: number;
  duMaxDiv: number;
}

export default function ComparisonStats({
  diffMean,
  diffMax,
  diffMin,
  duMaxDiv,
}: ComparisonStatsProps) {
  const items = [
    { label: "DIF. MÉDIA", value: `${diffMean.toFixed(4)} p.p.` },
    { label: "DIF. MÁXIMA", value: `${diffMax.toFixed(4)} p.p.` },
    { label: "DIF. MÍNIMA", value: `${diffMin.toFixed(4)} p.p.` },
    { label: "DU MAIOR DIV.", value: `${duMaxDiv} du` },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="glass-card rounded-xl p-4 text-center"
        >
          <div className="text-on-surface-variant uppercase text-xs font-semibold tracking-wider mb-2">
            {item.label}
          </div>
          <div className="text-primary text-xl font-mono font-bold">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
