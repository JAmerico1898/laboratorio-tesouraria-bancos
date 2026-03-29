import { cubicSpline } from "./cubic-spline";

/**
 * Smoothing spline approximation.
 * When s=0, exact interpolation (delegates to cubic spline).
 * When s>0, applies weighted averaging to reduce noise before cubic spline fitting.
 */
export function smoothingSpline(
  x: number[],
  y: number[],
  xNew: number[],
  s: number = 0
): number[] {
  if (s === 0) {
    return cubicSpline(x, y, xNew);
  }

  const n = x.length;
  const iterations = Math.max(1, Math.round(s / 20));
  const smoothed = [...y];

  for (let iter = 0; iter < iterations; iter++) {
    const prev = [...smoothed];
    for (let i = 1; i < n - 1; i++) {
      const wl = 1 / (x[i] - x[i - 1]);
      const wr = 1 / (x[i + 1] - x[i]);
      const wc = (wl + wr) * 2;
      smoothed[i] = (wl * prev[i - 1] + wc * prev[i] + wr * prev[i + 1]) / (wl + wc + wr);
    }
  }

  return cubicSpline(x, smoothed, xNew);
}
