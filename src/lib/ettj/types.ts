export interface DI1Contract {
  ticker: string;
  expiration: string; // ISO date string YYYY-MM-DD
  bdays: number;      // business days to expiration
  rate: number;        // decimal form (e.g., 0.1050 = 10.50%)
}

export interface InterpolationResult {
  xSmooth: number[];   // business days (500 points)
  ySmooth: number[];   // decimal form (e.g., 0.1050)
  yFitted: number[];   // interpolated at observed points, decimal form
  params?: Record<string, number>; // NS/NSS fitted parameters
}

export interface QualityMetrics {
  rmse: number;
  mae: number;
  r2: number;
  maxError: number;
}

export type InterpolationMethod =
  | "flat-forward"
  | "nelson-siegel-svensson"
  | "nelson-siegel"
  | "smoothing-spline"
  | "akima"
  | "pchip"
  | "cubic-spline"
  | "linear";

export const METHOD_LABELS: Record<InterpolationMethod, string> = {
  "flat-forward": "Flat Forward",
  "nelson-siegel-svensson": "Nelson-Siegel-Svensson",
  "nelson-siegel": "Nelson-Siegel",
  "smoothing-spline": "Smoothing Spline",
  "akima": "Akima Spline",
  "pchip": "PCHIP (Monotônica)",
  "cubic-spline": "Cubic Spline",
  "linear": "Interpolação Linear",
};

export const METHOD_ORDER: InterpolationMethod[] = [
  "flat-forward",
  "nelson-siegel-svensson",
  "nelson-siegel",
  "smoothing-spline",
  "akima",
  "pchip",
  "cubic-spline",
  "linear",
];
