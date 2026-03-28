import { describe, it, expect } from "vitest";
import { fatorCdiAcumulado, calcIpca12m, calcPressao, type RateDataPoint } from "./data";

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

describe("calcIpca12m", () => {
  it("accumulates 12-month rolling IPCA", () => {
    // 12 months of 0.5% each → (1.005)^12 - 1 ≈ 6.17%
    const monthly: RateDataPoint[] = Array.from({ length: 14 }, (_, i) => ({
      data: `2024-${String(i + 1).padStart(2, "0")}-01`,
      valor: 0.5,
    }));
    const result = calcIpca12m(monthly);
    // First 11 months have no result (need 12 months window)
    expect(result.length).toBe(3); // months 12, 13, 14
    expect(result[0].valor).toBeCloseTo(6.17, 0);
  });

  it("returns empty for less than 12 months", () => {
    const monthly: RateDataPoint[] = Array.from({ length: 10 }, (_, i) => ({
      data: `2024-${String(i + 1).padStart(2, "0")}-01`,
      valor: 0.3,
    }));
    expect(calcIpca12m(monthly)).toEqual([]);
  });
});

describe("calcPressao", () => {
  it("calculates neutral pressure for balanced scenario", () => {
    const result = calcPressao(3.0, 2.5, "Estável", "Neutro", "Manutenção");
    expect(result.total).toBe(0);
  });

  it("calculates positive pressure for inflationary scenario", () => {
    const result = calcPressao(5.0, 3.5, "Depreciação moderada", "Expansionista", "Alta de juros");
    expect(result.total).toBeGreaterThan(0);
    expect(result.detail["Inflação (IPCA)"]).toBeGreaterThan(0);
    expect(result.detail["Atividade (PIB)"]).toBeGreaterThan(0);
  });

  it("calculates negative pressure for easing scenario", () => {
    const result = calcPressao(2.0, 1.0, "Apreciação moderada", "Contracionista", "Corte de juros");
    expect(result.total).toBeLessThan(0);
  });

  it("returns all 5 detail factors", () => {
    const result = calcPressao(4.0, 2.5, "Estável", "Neutro", "Manutenção");
    expect(Object.keys(result.detail)).toHaveLength(5);
    expect(result.detail).toHaveProperty("Inflação (IPCA)");
    expect(result.detail).toHaveProperty("Atividade (PIB)");
    expect(result.detail).toHaveProperty("Câmbio");
    expect(result.detail).toHaveProperty("Fiscal");
    expect(result.detail).toHaveProperty("Externo (FED)");
  });
});
