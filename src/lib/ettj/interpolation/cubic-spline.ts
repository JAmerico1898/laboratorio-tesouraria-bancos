/**
 * Natural cubic spline interpolation.
 * Solves a tridiagonal system for second derivatives (natural BCs: S''(x0)=0, S''(xn)=0).
 */
export function cubicSpline(
  x: number[],
  y: number[],
  xNew: number[]
): number[] {
  const n = x.length;
  if (n < 2) return xNew.map(() => y[0] ?? 0);

  const h: number[] = [];
  const alpha: number[] = [0];
  for (let i = 0; i < n - 1; i++) {
    h.push(x[i + 1] - x[i]);
  }
  for (let i = 1; i < n - 1; i++) {
    alpha.push(
      (3 / h[i]) * (y[i + 1] - y[i]) - (3 / h[i - 1]) * (y[i] - y[i - 1])
    );
  }

  const c = new Array(n).fill(0);
  const l = new Array(n).fill(1);
  const mu = new Array(n).fill(0);
  const z = new Array(n).fill(0);

  for (let i = 1; i < n - 1; i++) {
    l[i] = 2 * (x[i + 1] - x[i - 1]) - h[i - 1] * mu[i - 1];
    mu[i] = h[i] / l[i];
    z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
  }

  for (let j = n - 2; j >= 0; j--) {
    c[j] = z[j] - mu[j] * c[j + 1];
  }

  const b: number[] = [];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    b.push(
      (y[i + 1] - y[i]) / h[i] - (h[i] * (c[i + 1] + 2 * c[i])) / 3
    );
    d.push((c[i + 1] - c[i]) / (3 * h[i]));
  }

  return xNew.map((xq) => {
    let i = 0;
    if (xq <= x[0]) i = 0;
    else if (xq >= x[n - 1]) i = n - 2;
    else {
      while (i < n - 2 && x[i + 1] < xq) i++;
    }

    const dx = xq - x[i];
    return y[i] + b[i] * dx + c[i] * dx * dx + d[i] * dx * dx * dx;
  });
}
