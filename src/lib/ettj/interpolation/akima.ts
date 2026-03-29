/**
 * Akima spline interpolation.
 * Less sensitive to outliers than cubic spline.
 * Uses weighted derivative calculation.
 */
export function akimaInterpolation(
  x: number[],
  y: number[],
  xNew: number[]
): number[] {
  const n = x.length;
  if (n < 2) return xNew.map(() => y[0] ?? 0);
  if (n < 3) {
    return xNew.map((xq) => {
      const t = (xq - x[0]) / (x[1] - x[0]);
      return y[0] + t * (y[1] - y[0]);
    });
  }

  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    m.push((y[i + 1] - y[i]) / (x[i + 1] - x[i]));
  }

  const slopes: number[] = [];
  slopes.push(2 * m[0] - (m.length > 1 ? m[1] : m[0]));
  slopes.push(2 * m[0] - slopes[0]);
  for (const s of m) slopes.push(s);
  slopes.push(2 * m[n - 2] - (n > 2 ? m[n - 3] : m[n - 2]));
  slopes.push(2 * slopes[slopes.length - 1] - m[n - 2]);

  const d: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const idx = i + 2;
    const w1 = Math.abs(slopes[idx + 1] - slopes[idx]);
    const w2 = Math.abs(slopes[idx - 1] - slopes[idx - 2]);
    if (w1 + w2 === 0) {
      d[i] = (slopes[idx - 1] + slopes[idx]) / 2;
    } else {
      d[i] = (w1 * slopes[idx - 1] + w2 * slopes[idx]) / (w1 + w2);
    }
  }

  return xNew.map((xq) => {
    if (xq <= x[0]) return y[0];
    if (xq >= x[n - 1]) return y[n - 1];

    let i = 0;
    while (i < n - 2 && x[i + 1] < xq) i++;

    const h = x[i + 1] - x[i];
    const t = (xq - x[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;

    return (
      (2 * t3 - 3 * t2 + 1) * y[i] +
      (t3 - 2 * t2 + t) * h * d[i] +
      (-2 * t3 + 3 * t2) * y[i + 1] +
      (t3 - t2) * h * d[i + 1]
    );
  });
}
