import { describe, it, expect } from "vitest";
import { calcularBreakeven, premioPrazo } from "@/lib/finance";

describe("calcularBreakeven", () => {
  it("computes breakeven from nominal and real rates (decimal inputs)", () => {
    const be = calcularBreakeven(0.128, 0.065);
    expect(be).toBeCloseTo(0.05915, 4);
  });

  it("returns 0 when real rate is -100%", () => {
    expect(calcularBreakeven(0.1, -1)).toBe(0);
  });

  it("handles zero rates", () => {
    expect(calcularBreakeven(0, 0)).toBe(0);
  });
});

describe("premioPrazo", () => {
  it("returns 0 for zero maturity", () => {
    expect(premioPrazo(0)).toBeCloseTo(0, 6);
  });

  it("computes term premium with default alpha=30 bps", () => {
    expect(premioPrazo(3)).toBeCloseTo(0.3 * Math.log(4), 4);
  });

  it("accepts custom alpha", () => {
    expect(premioPrazo(5, 50)).toBeCloseTo(0.5 * Math.log(6), 4);
  });
});
