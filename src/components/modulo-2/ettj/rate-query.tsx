"use client";

import { useState } from "react";
import { InterpolationMethod } from "@/lib/ettj/types";
import { applyMethod } from "@/lib/ettj/interpolation";

interface RateQueryProps {
  method: InterpolationMethod;
  xData: number[];
  yData: number[];
  smoothingFactor?: number;
}

export default function RateQuery({
  method,
  xData,
  yData,
  smoothingFactor,
}: RateQueryProps) {
  const [queryDate, setQueryDate] = useState("");
  const [queryBdays, setQueryBdays] = useState<number | "">("");
  const [resultDateRate, setResultDateRate] = useState<number | null>(null);
  const [resultBdaysRate, setResultBdaysRate] = useState<number | null>(null);

  const interpolateAt = (bdays: number): number | null => {
    if (xData.length < 2 || bdays <= 0) return null;
    try {
      const yAtTarget = applyMethod(method, xData, yData, smoothingFactor);
      // Use the interpolation at the single target point by leveraging yFitted logic
      // We need to interpolate at a specific point — call applyMethod with xData
      // and then use the smooth curve to find the value
      const { xSmooth, ySmooth } = yAtTarget;

      // Find bracketing points in xSmooth
      if (bdays <= xSmooth[0]) return ySmooth[0];
      if (bdays >= xSmooth[xSmooth.length - 1]) return ySmooth[xSmooth.length - 1];

      for (let i = 0; i < xSmooth.length - 1; i++) {
        if (xSmooth[i] <= bdays && xSmooth[i + 1] >= bdays) {
          const t = (bdays - xSmooth[i]) / (xSmooth[i + 1] - xSmooth[i]);
          return ySmooth[i] + t * (ySmooth[i + 1] - ySmooth[i]);
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleDateQuery = async () => {
    if (!queryDate) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(
        `/api/bdays?start=${today}&end=${queryDate}`
      );
      if (!res.ok) {
        setResultDateRate(null);
        return;
      }
      const data = await res.json();
      const bdays = data.bdays as number;
      const rate = interpolateAt(bdays);
      setResultDateRate(rate);
    } catch {
      setResultDateRate(null);
    }
  };

  const handleBdaysQuery = () => {
    if (queryBdays === "" || queryBdays <= 0) return;
    const rate = interpolateAt(queryBdays);
    setResultBdaysRate(rate);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Query by date */}
      <div className="glass-card p-4 rounded-lg">
        <h3 className="text-sm text-on-surface-variant uppercase mb-3">
          Consultar por Data
        </h3>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs text-on-surface-variant block mb-1">
              Data de Vencimento
            </label>
            <input
              type="date"
              value={queryDate}
              onChange={(e) => setQueryDate(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant rounded-md px-3 py-1.5 text-sm text-on-surface"
            />
          </div>
          <button
            type="button"
            onClick={handleDateQuery}
            className="bg-primary text-on-primary font-semibold px-3 py-1.5 rounded-md text-sm hover:opacity-90 transition-opacity"
          >
            Consultar
          </button>
        </div>
        {resultDateRate !== null && (
          <div className="mt-3 text-center">
            <div className="text-3xl font-bold text-primary">
              {(resultDateRate * 100).toFixed(4)}%
            </div>
            <div className="text-xs text-on-surface-variant mt-1">Taxa interpolada</div>
          </div>
        )}
      </div>

      {/* Query by business days */}
      <div className="glass-card p-4 rounded-lg">
        <h3 className="text-sm text-on-surface-variant uppercase mb-3">
          Consultar por Dias Úteis
        </h3>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs text-on-surface-variant block mb-1">
              Dias Úteis
            </label>
            <input
              type="number"
              min={1}
              value={queryBdays}
              onChange={(e) =>
                setQueryBdays(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full bg-surface-container border border-outline-variant rounded-md px-3 py-1.5 text-sm text-on-surface"
              placeholder="Ex: 252"
            />
          </div>
          <button
            type="button"
            onClick={handleBdaysQuery}
            className="bg-primary text-on-primary font-semibold px-3 py-1.5 rounded-md text-sm hover:opacity-90 transition-opacity"
          >
            Consultar
          </button>
        </div>
        {resultBdaysRate !== null && (
          <div className="mt-3 text-center">
            <div className="text-3xl font-bold text-primary">
              {(resultBdaysRate * 100).toFixed(4)}%
            </div>
            <div className="text-xs text-on-surface-variant mt-1">Taxa interpolada</div>
          </div>
        )}
      </div>
    </div>
  );
}
