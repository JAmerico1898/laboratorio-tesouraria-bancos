import { levenbergMarquardt } from "ml-levenberg-marquardt";

export interface FitResult {
  params: number[];
  residuals: number[];
  converged: boolean;
}

export function fitModel(
  modelFn: (params: number[]) => (x: number) => number,
  x: number[],
  y: number[],
  initialParams: number[],
  options?: {
    minValues?: number[];
    maxValues?: number[];
    maxIterations?: number;
  }
): FitResult {
  try {
    const data = { x, y };

    const parameterizedFn =
      (p: number[]) =>
      (xi: number): number =>
        modelFn(p)(xi);

    const result = levenbergMarquardt(data, parameterizedFn, {
      initialValues: initialParams,
      minValues: options?.minValues,
      maxValues: options?.maxValues,
      maxIterations: options?.maxIterations ?? 1000,
      damping: 0.001,
      gradientDifference: 1e-6,
    });

    const fitted = x.map((xi) => parameterizedFn(result.parameterValues)(xi));
    const residuals = y.map((yi, i) => yi - fitted[i]);

    return {
      params: Array.from(result.parameterValues),
      residuals,
      converged: true,
    };
  } catch {
    return {
      params: initialParams,
      residuals: y.map(() => 0),
      converged: false,
    };
  }
}
