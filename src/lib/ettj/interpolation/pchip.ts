/**
 * PCHIP — Piecewise Cubic Hermite Interpolating Polynomial.
 * Preserves monotonicity: no overshoots or spurious oscillations.
 */
export function pchipInterpolation(
  x: number[],
  y: number[],
  xNew: number[]
): number[] {
  const n = x.length;
  if (n < 2) return xNew.map(() => y[0] ?? 0);

  const delta: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    delta.push((y[i + 1] - y[i]) / (x[i + 1] - x[i]));
  }

  const d: number[] = new Array(n);
  d[0] = delta[0];
  d[n - 1] = delta[n - 2];

  for (let i = 1; i < n - 1; i++) {
    if (delta[i - 1] * delta[i] <= 0) {
      d[i] = 0;
    } else {
      const w1 = 2 * (x[i + 1] - x[i]) + (x[i] - x[i - 1]);
      const w2 = (x[i + 1] - x[i]) + 2 * (x[i] - x[i - 1]);
      d[i] = (w1 + w2) / (w1 / delta[i - 1] + w2 / delta[i]);
    }
  }

  return xNew.map((xq) => {
    let i = 0;
    if (xq <= x[0]) return y[0];
    if (xq >= x[n - 1]) return y[n - 1];

    while (i < n - 2 && x[i + 1] < xq) i++;

    const h = x[i + 1] - x[i];
    const t = (xq - x[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;

    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;

    return h00 * y[i] + h10 * h * d[i] + h01 * y[i + 1] + h11 * h * d[i + 1];
  });
}
