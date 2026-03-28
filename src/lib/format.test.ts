import { describe, it, expect } from "vitest";
import { fmtBrl, fmtPct, fmtNum } from "./format";

describe("fmtBrl", () => {
  it("formats small values with R$ prefix", () => {
    expect(fmtBrl(1234.5678)).toBe("R$ 1.234,5678");
  });
  it("formats millions with mi suffix", () => {
    expect(fmtBrl(10_000_000)).toBe("R$ 10,0000 mi");
  });
  it("formats billions with bi suffix", () => {
    expect(fmtBrl(1_500_000_000)).toBe("R$ 1,5000 bi");
  });
  it("formats negative values", () => {
    expect(fmtBrl(-50000)).toBe("R$ -50.000,0000");
  });
  it("formats zero", () => {
    expect(fmtBrl(0)).toBe("R$ 0,0000");
  });
});

describe("fmtPct", () => {
  it("formats with default 2 decimals", () => {
    expect(fmtPct(13.75)).toBe("13,75%");
  });
  it("formats with custom decimals", () => {
    expect(fmtPct(0.049876, 4)).toBe("0,0499%");
  });
  it("formats large percentages with thousands separator", () => {
    expect(fmtPct(1234.5)).toBe("1.234,50%");
  });
});

describe("fmtNum", () => {
  it("formats with 2 decimal places", () => {
    expect(fmtNum(1234.5678)).toBe("1.234,57");
  });
  it("formats integers with .00", () => {
    expect(fmtNum(100)).toBe("100,00");
  });
  it("formats zero", () => {
    expect(fmtNum(0)).toBe("0,00");
  });
});
