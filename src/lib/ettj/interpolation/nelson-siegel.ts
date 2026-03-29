import { fitModel } from "../optimization";

export interface NSParams {
  beta0: number;
  beta1: number;
  beta2: number;
  lambda: number;
}

export function nelsonSiegel(params: NSParams, tau: number[]): number[] {
  const { beta0, beta1, beta2, lambda } = params;
  return tau.map((t) => {
    const ratio = t / lambda;
    const expTerm = Math.exp(-ratio);
    const factor1 = ratio === 0 ? 1 : (1 - expTerm) / ratio;
    const factor2 = factor1 - expTerm;
    return beta0 + beta1 * factor1 + beta2 * factor2;
  });
}

export function fitNelsonSiegel(
  x: number[],
  y: number[]
): { fitted: number[]; params: NSParams } {
  const yMean = y.reduce((a, b) => a + b, 0) / y.length;
  const yMin = Math.min(...y);
  const yMax = Math.max(...y);

  const modelFn = (p: number[]) => (xi: number) => {
    const ratio = xi / p[3];
    const expTerm = Math.exp(-ratio);
    const f1 = ratio === 0 ? 1 : (1 - expTerm) / ratio;
    return p[0] + p[1] * f1 + p[2] * (f1 - expTerm);
  };

  const result = fitModel(modelFn, x, y, [yMean, -0.02, -0.02, 500], {
    minValues: [yMin - 0.05, -0.1, -0.1, 1],
    maxValues: [yMax + 0.05, 0.1, 0.1, 2000],
  });

  const params: NSParams = {
    beta0: result.params[0],
    beta1: result.params[1],
    beta2: result.params[2],
    lambda: result.params[3],
  };

  return { fitted: nelsonSiegel(params, x), params };
}
