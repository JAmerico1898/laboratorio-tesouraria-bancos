import { describe, it, expect } from "vitest";
import { fatorCdiAcumulado, type RateDataPoint } from "./data";

describe("fatorCdiAcumulado", () => {
  it("calculates accumulated factor for 100% CDI", () => {
    const series: RateDataPoint[] = [
      { data: "2024-01-02", valor: 11.65 },
      { data: "2024-01-03", valor: 11.65 },
      { data: "2024-01-04", valor: 11.65 },
    ];
    const result = fatorCdiAcumulado(series, 100);
    expect(result).toHaveLength(3);
    expect(result[0].fator).toBeCloseTo(1.000437, 4);
    expect(result[2].fator).toBeGreaterThan(result[1].fator);
  });
  it("scales factor by CDI percentage", () => {
    const series: RateDataPoint[] = [
      { data: "2024-01-02", valor: 11.65 },
      { data: "2024-01-03", valor: 11.65 },
    ];
    const f100 = fatorCdiAcumulado(series, 100);
    const f50 = fatorCdiAcumulado(series, 50);
    expect(f50[1].fator).toBeLessThan(f100[1].fator);
    expect(f50[1].fator).toBeGreaterThan(1);
  });
  it("returns empty array for empty input", () => {
    expect(fatorCdiAcumulado([], 100)).toEqual([]);
  });
  it("preserves date strings in output", () => {
    const series: RateDataPoint[] = [{ data: "2024-06-15", valor: 10.50 }];
    const result = fatorCdiAcumulado(series, 100);
    expect(result[0].data).toBe("2024-06-15");
  });
});
