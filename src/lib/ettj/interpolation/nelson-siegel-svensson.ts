import { fitModel } from "../optimization";

export interface NSSParams {
  beta0: number;
  beta1: number;
  beta2: number;
  beta3: number;
  lambda1: number;
  lambda2: number;
}

export function nelsonSiegelSvensson(
  params: NSSParams,
  tau: number[]
): number[] {
  const { beta0, beta1, beta2, beta3, lambda1, lambda2 } = params;
  return tau.map((t) => {
    const r1 = t / lambda1;
    const r2 = t / lambda2;
    const e1 = Math.exp(-r1);
    const e2 = Math.exp(-r2);
    const f1 = r1 === 0 ? 1 : (1 - e1) / r1;
    const f2 = r2 === 0 ? 1 : (1 - e2) / r2;
    return beta0 + beta1 * f1 + beta2 * (f1 - e1) + beta3 * (f2 - e2);
  });
}

export function fitNelsonSiegelSvensson(
  x: number[],
  y: number[]
): { fitted: number[]; params: NSSParams } {
  const yMean = y.reduce((a, b) => a + b, 0) / y.length;
  const yMin = Math.min(...y);
  const yMax = Math.max(...y);

  const modelFn = (p: number[]) => (xi: number) => {
    const r1 = xi / p[4];
    const r2 = xi / p[5];
    const e1 = Math.exp(-r1);
    const e2 = Math.exp(-r2);
    const f1 = r1 === 0 ? 1 : (1 - e1) / r1;
    const f2 = r2 === 0 ? 1 : (1 - e2) / r2;
    return p[0] + p[1] * f1 + p[2] * (f1 - e1) + p[3] * (f2 - e2);
  };

  const result = fitModel(
    modelFn,
    x,
    y,
    [yMean, -0.02, -0.02, 0.01, 500, 1000],
    {
      minValues: [yMin - 0.05, -0.1, -0.1, -0.1, 1, 1],
      maxValues: [yMax + 0.05, 0.1, 0.1, 0.1, 2000, 3000],
    }
  );

  const params: NSSParams = {
    beta0: result.params[0],
    beta1: result.params[1],
    beta2: result.params[2],
    beta3: result.params[3],
    lambda1: result.params[4],
    lambda2: result.params[5],
  };

  return { fitted: nelsonSiegelSvensson(params, x), params };
}
