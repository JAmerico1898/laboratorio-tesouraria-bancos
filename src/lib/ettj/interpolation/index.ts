import { InterpolationMethod, InterpolationResult } from "../types";
import { SMOOTH_POINTS } from "../constants";
import { flatForward } from "./flat-forward";
import { linearInterpolation } from "./linear";
import { cubicSpline } from "./cubic-spline";
import { pchipInterpolation } from "./pchip";
import { akimaInterpolation } from "./akima";
import { smoothingSpline } from "./smoothing-spline";
import { fitNelsonSiegel, nelsonSiegel } from "./nelson-siegel";
import {
  fitNelsonSiegelSvensson,
  nelsonSiegelSvensson,
} from "./nelson-siegel-svensson";

export function applyMethod(
  method: InterpolationMethod,
  xData: number[],
  yData: number[],
  smoothingFactor?: number
): InterpolationResult {
  const xMin = Math.min(...xData);
  const xMax = Math.max(...xData);
  const xSmooth = Array.from(
    { length: SMOOTH_POINTS },
    (_, i) => xMin + (i * (xMax - xMin)) / (SMOOTH_POINTS - 1)
  );

  let ySmooth: number[];
  let yFitted: number[];
  let params: Record<string, number> | undefined;

  switch (method) {
    case "flat-forward":
      ySmooth = flatForward(xData, yData, xSmooth);
      yFitted = flatForward(xData, yData, xData);
      break;
    case "linear":
      ySmooth = linearInterpolation(xData, yData, xSmooth);
      yFitted = linearInterpolation(xData, yData, xData);
      break;
    case "cubic-spline":
      ySmooth = cubicSpline(xData, yData, xSmooth);
      yFitted = cubicSpline(xData, yData, xData);
      break;
    case "pchip":
      ySmooth = pchipInterpolation(xData, yData, xSmooth);
      yFitted = pchipInterpolation(xData, yData, xData);
      break;
    case "akima":
      ySmooth = akimaInterpolation(xData, yData, xSmooth);
      yFitted = akimaInterpolation(xData, yData, xData);
      break;
    case "smoothing-spline":
      ySmooth = smoothingSpline(xData, yData, xSmooth, smoothingFactor);
      yFitted = smoothingSpline(xData, yData, xData, smoothingFactor);
      break;
    case "nelson-siegel": {
      const ns = fitNelsonSiegel(xData, yData);
      ySmooth = nelsonSiegel(ns.params, xSmooth);
      yFitted = ns.fitted;
      params = ns.params as unknown as Record<string, number>;
      break;
    }
    case "nelson-siegel-svensson": {
      const nss = fitNelsonSiegelSvensson(xData, yData);
      ySmooth = nelsonSiegelSvensson(nss.params, xSmooth);
      yFitted = nss.fitted;
      params = nss.params as unknown as Record<string, number>;
      break;
    }
  }

  return { xSmooth, ySmooth, yFitted, params };
}
