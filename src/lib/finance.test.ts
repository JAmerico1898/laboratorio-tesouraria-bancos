import { describe, it, expect } from "vitest";
import { puLtn, taxaEquivalente, durationModificada, taxaForward } from "./finance";

describe("puLtn", () => {
  it("prices a 1-year LTN at 12.5%", () => {
    const pu = puLtn(0.125, 252);
    expect(pu).toBeCloseTo(888.8889, 2);
  });
  it("returns 1000 for du=0", () => {
    expect(puLtn(0.125, 0)).toBe(1000);
  });
  it("returns 1000 for negative du", () => {
    expect(puLtn(0.125, -10)).toBe(1000);
  });
  it("prices a 2-year LTN at 13%", () => {
    const pu = puLtn(0.13, 504);
    expect(pu).toBeCloseTo(783.15, 0);
  });
  it("higher rate means lower price", () => {
    expect(puLtn(0.15, 252)).toBeLessThan(puLtn(0.10, 252));
  });
});

describe("taxaEquivalente", () => {
  it("converts annual_252 to daily", () => {
    const daily = taxaEquivalente(0.1375, "anual_252", "diaria");
    expect(daily).toBeCloseTo(0.000511, 4);
  });
  it("roundtrips daily to annual_252", () => {
    const daily = taxaEquivalente(0.1375, "anual_252", "diaria");
    const annual = taxaEquivalente(daily, "diaria", "anual_252");
    expect(annual).toBeCloseTo(0.1375, 6);
  });
  it("returns same rate when bases are equal", () => {
    expect(taxaEquivalente(0.1375, "anual_252", "anual_252")).toBeCloseTo(0.1375, 10);
  });
  it("converts annual_252 to monthly", () => {
    const monthly = taxaEquivalente(0.1375, "anual_252", "mensal");
    expect(monthly).toBeCloseTo(0.01079, 3);
  });
  it("converts annual_252 to annual_360", () => {
    const a360 = taxaEquivalente(0.1375, "anual_252", "anual_360");
    expect(a360).toBeGreaterThan(0.1375);
  });
});

describe("durationModificada", () => {
  it("calculates for 1-year bond at 12.5%", () => {
    expect(durationModificada(0.125, 252)).toBeCloseTo(0.8889, 3);
  });
  it("longer maturity means higher duration", () => {
    expect(durationModificada(0.125, 504)).toBeGreaterThan(durationModificada(0.125, 252));
  });
});

describe("taxaForward", () => {
  it("calculates forward rate between two vertices", () => {
    const f = taxaForward(0.12, 252, 0.13, 504);
    expect(f).toBeCloseTo(0.14009, 3);
  });
  it("returns 0 for degenerate input", () => {
    expect(taxaForward(0.12, 252, 0.13, 252)).toBe(0);
  });
});
