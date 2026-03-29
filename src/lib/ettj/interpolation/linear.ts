export function linearInterpolation(
  x: number[],
  y: number[],
  xNew: number[]
): number[] {
  const n = x.length;
  return xNew.map((xq) => {
    if (xq <= x[0]) return y[0];
    if (xq >= x[n - 1]) return y[n - 1];

    let i = 0;
    while (i < n - 1 && x[i + 1] < xq) i++;

    const t = (xq - x[i]) / (x[i + 1] - x[i]);
    return y[i] + t * (y[i + 1] - y[i]);
  });
}
