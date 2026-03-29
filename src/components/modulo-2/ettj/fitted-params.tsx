"use client";

import { InterpolationMethod } from "@/lib/ettj/types";

interface FittedParamsProps {
  params: Record<string, number> | undefined;
  method: InterpolationMethod;
}

export default function FittedParams({ params, method }: FittedParamsProps) {
  if (!params) return null;
  if (method !== "nelson-siegel" && method !== "nelson-siegel-svensson") {
    return null;
  }

  const isNSS = method === "nelson-siegel-svensson";

  const paramEntries: { label: string; key: string; decimals: number }[] = [
    { label: "\u03B2\u2080", key: "beta0", decimals: 6 },
    { label: "\u03B2\u2081", key: "beta1", decimals: 6 },
    { label: "\u03B2\u2082", key: "beta2", decimals: 6 },
  ];

  if (isNSS) {
    paramEntries.push({ label: "\u03B2\u2083", key: "beta3", decimals: 6 });
    paramEntries.push({ label: "\u03BB\u2081", key: "lambda1", decimals: 2 });
    paramEntries.push({ label: "\u03BB\u2082", key: "lambda2", decimals: 2 });
  } else {
    paramEntries.push({ label: "\u03BB", key: "lambda", decimals: 2 });
  }

  return (
    <div className="glass-card p-4 rounded-lg">
      <h3 className="text-sm text-on-surface-variant uppercase tracking-wider mb-3">
        Par\u00E2metros Ajustados
      </h3>
      <div className="flex flex-wrap gap-6">
        {paramEntries.map(({ label, key, decimals }) => {
          const value = params[key];
          if (value === undefined) return null;
          return (
            <div key={key} className="text-center">
              <div className="text-xs text-on-surface-variant mb-1">{label}</div>
              <div className="text-lg font-mono text-on-surface">
                {value.toFixed(decimals)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
