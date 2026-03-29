import { QualityMetrics } from "./types";

export function computeMetrics(
  observed: number[],
  fitted: number[]
): QualityMetrics {
  const n = observed.length;
  const mean = observed.reduce((a, b) => a + b, 0) / n;

  let sse = 0;
  let sae = 0;
  let sst = 0;
  let maxErr = 0;

  for (let i = 0; i < n; i++) {
    const residual = observed[i] - fitted[i];
    sse += residual * residual;
    sae += Math.abs(residual);
    sst += (observed[i] - mean) ** 2;
    maxErr = Math.max(maxErr, Math.abs(residual));
  }

  return {
    rmse: Math.sqrt(sse / n),
    mae: sae / n,
    r2: sst === 0 ? 1 : 1 - sse / sst,
    maxError: maxErr,
  };
}
