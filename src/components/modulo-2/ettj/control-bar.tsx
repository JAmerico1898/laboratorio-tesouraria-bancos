"use client";

import { InterpolationMethod, METHOD_LABELS, METHOD_ORDER } from "@/lib/ettj/types";
import {
  SMOOTHING_MIN,
  SMOOTHING_MAX,
  SMOOTHING_STEP,
} from "@/lib/ettj/constants";

interface ControlBarProps {
  mode: "single" | "comparison";
  method: InterpolationMethod;
  smoothingFactor: number;
  dateA: string;
  dateB: string;
  loading: boolean;
  stats?: { total: number; filtered: number; maxBdays: number };
  onModeChange: (mode: "single" | "comparison") => void;
  onMethodChange: (method: InterpolationMethod) => void;
  onSmoothingChange: (factor: number) => void;
  onDateAChange: (date: string) => void;
  onDateBChange: (date: string) => void;
  onLoad: () => void;
}

export default function ControlBar({
  mode,
  method,
  smoothingFactor,
  dateA,
  dateB,
  loading,
  stats,
  onModeChange,
  onMethodChange,
  onSmoothingChange,
  onDateAChange,
  onDateBChange,
  onLoad,
}: ControlBarProps) {
  return (
    <div className="sticky top-[105px] z-30 bg-surface-container/95 backdrop-blur-md border-b border-outline-variant/20 px-4 py-2">
      <div className="flex flex-wrap gap-3 items-center">
        {/* Segmented control toggle */}
        <div className="bg-surface-container rounded-md overflow-hidden flex">
          <button
            type="button"
            onClick={() => onModeChange("single")}
            className={`px-3 py-1.5 text-sm transition-colors ${
              mode === "single"
                ? "bg-primary text-on-primary font-semibold"
                : "text-on-surface-variant"
            }`}
          >
            Curva Única
          </button>
          <button
            type="button"
            onClick={() => onModeChange("comparison")}
            className={`px-3 py-1.5 text-sm transition-colors ${
              mode === "comparison"
                ? "bg-primary text-on-primary font-semibold"
                : "text-on-surface-variant"
            }`}
          >
            Comparação
          </button>
        </div>

        {/* Method dropdown */}
        <select
          value={method}
          onChange={(e) => onMethodChange(e.target.value as InterpolationMethod)}
          className="bg-surface-container text-on-surface border border-outline-variant rounded-md px-3 py-1.5 text-sm"
        >
          {METHOD_ORDER.map((m) => (
            <option key={m} value={m}>
              {METHOD_LABELS[m]}
            </option>
          ))}
        </select>

        {/* Smoothing slider (only for smoothing-spline) */}
        {method === "smoothing-spline" && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-on-surface-variant whitespace-nowrap">
              Suavização{" "}
              <span className="text-on-surface font-semibold">
                {smoothingFactor}
              </span>
            </label>
            <input
              type="range"
              min={SMOOTHING_MIN}
              max={SMOOTHING_MAX}
              step={SMOOTHING_STEP}
              value={smoothingFactor}
              onChange={(e) => onSmoothingChange(Number(e.target.value))}
              className="w-24 accent-primary"
            />
          </div>
        )}

        {/* Date picker(s) */}
        {mode === "single" ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-on-surface-variant uppercase">DATA</span>
            <input
              type="date"
              value={dateA}
              onChange={(e) => onDateAChange(e.target.value)}
              className="bg-surface-container border border-outline-variant rounded-md px-3 py-1.5 text-sm text-on-surface"
            />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-blue-400 uppercase">DATA A</span>
              <input
                type="date"
                value={dateA}
                onChange={(e) => onDateAChange(e.target.value)}
                className="bg-surface-container border border-blue-500/30 rounded-md px-3 py-1.5 text-sm text-blue-400"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-red-400 uppercase">DATA B</span>
              <input
                type="date"
                value={dateB}
                onChange={(e) => onDateBChange(e.target.value)}
                className="bg-surface-container border border-red-500/30 rounded-md px-3 py-1.5 text-sm text-red-400"
              />
            </div>
          </>
        )}

        {/* Action button */}
        <button
          type="button"
          onClick={onLoad}
          disabled={loading}
          className={`bg-primary text-on-primary font-semibold px-4 py-1.5 rounded-md text-sm transition-opacity ${
            loading ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
          }`}
        >
          {mode === "single" ? "🔄 Carregar" : "🔄 Comparar"}
        </button>

        {/* Stats counters */}
        {stats && (
          <div className="ml-auto flex items-center gap-4">
            <div className="text-center">
              <div className="text-[9px] text-on-surface-variant uppercase">CONTRATOS</div>
              <div className="text-on-surface text-sm font-semibold">
                {stats.total}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[9px] text-on-surface-variant uppercase">&le;5 ANOS</div>
              <div className="text-on-surface text-sm font-semibold">
                {stats.filtered}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[9px] text-on-surface-variant uppercase">PRAZO MÁX</div>
              <div className="text-on-surface text-sm font-semibold">
                {stats.maxBdays}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
