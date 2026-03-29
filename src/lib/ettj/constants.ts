export const BUSINESS_DAYS_PER_YEAR = 252;
export const FIVE_YEAR_HORIZON = 1260; // 252 * 5
export const SMOOTH_POINTS = 500;
export const DEFAULT_SMOOTHING_FACTOR = 50;
export const SMOOTHING_MIN = 0;
export const SMOOTHING_MAX = 200;
export const SMOOTHING_STEP = 10;

export const KEY_MATURITIES: Record<number, string> = {
  21: "1M",
  63: "3M",
  126: "6M",
  252: "1A",
  504: "2A",
  756: "3A",
  1008: "4A",
  1260: "5A",
};

export const QUALITY_THRESHOLD_BPS = 10; // 0.10%
export const QUALITY_THRESHOLD_R2 = 0.99;
