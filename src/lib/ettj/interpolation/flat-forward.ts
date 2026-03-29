import { BUSINESS_DAYS_PER_YEAR } from "../constants";

/**
 * Flat Forward interpolation — Brazilian market standard.
 * Assumes constant forward rate between adjacent vertices.
 * Uses 252 business day compound capitalization convention.
 */
export function flatForward(
  x: number[], // business days (sorted)
  y: number[], // spot rates (decimal)
  xNew: number[] // target business days
): number[] {
  const n = x.length;
  if (n === 0) return [];
  if (n === 1) return xNew.map(() => y[0]);

  // Pre-compute capitalization factors: cap_i = (1 + r_i)^(d_i / 252)
  const cap = x.map((d, i) => Math.pow(1 + y[i], d / BUSINESS_DAYS_PER_YEAR));

  // Compute forward rates between each pair of vertices
  const forwardRates: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dDiff = x[i + 1] - x[i];
    forwardRates.push(
      Math.pow(cap[i + 1] / cap[i], BUSINESS_DAYS_PER_YEAR / dDiff) - 1
    );
  }

  return xNew.map((d) => {
    // Find the segment
    let segIdx = 0;
    for (let i = 0; i < n - 1; i++) {
      if (d > x[i]) segIdx = i;
    }

    // If at or before first vertex, use first forward rate (extrapolate left)
    if (d < x[0]) {
      const capD = Math.pow(1 + forwardRates[0], d / BUSINESS_DAYS_PER_YEAR);
      return Math.pow(capD, BUSINESS_DAYS_PER_YEAR / d) - 1;
    }

    // If beyond last vertex, extrapolate with last forward rate
    if (d >= x[n - 1]) {
      const lastFwd = forwardRates[n - 2];
      const capD =
        cap[n - 1] *
        Math.pow(1 + lastFwd, (d - x[n - 1]) / BUSINESS_DAYS_PER_YEAR);
      return Math.pow(capD, BUSINESS_DAYS_PER_YEAR / d) - 1;
    }

    // Interpolate within segment
    const fwd = forwardRates[segIdx];
    const capD =
      cap[segIdx] *
      Math.pow(1 + fwd, (d - x[segIdx]) / BUSINESS_DAYS_PER_YEAR);
    return Math.pow(capD, BUSINESS_DAYS_PER_YEAR / d) - 1;
  });
}
