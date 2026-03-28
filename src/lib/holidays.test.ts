import { describe, it, expect } from "vitest";
import { ANBIMA_HOLIDAYS, diasUteis, diasCorridos } from "./holidays";

describe("ANBIMA_HOLIDAYS", () => {
  it("contains known fixed holidays", () => {
    expect(ANBIMA_HOLIDAYS.has("2024-01-01")).toBe(true);
    expect(ANBIMA_HOLIDAYS.has("2024-12-25")).toBe(true);
    expect(ANBIMA_HOLIDAYS.has("2024-04-21")).toBe(true);
    expect(ANBIMA_HOLIDAYS.has("2024-11-15")).toBe(true);
  });
  it("contains known moveable holidays for 2024", () => {
    expect(ANBIMA_HOLIDAYS.has("2024-02-12")).toBe(true);
    expect(ANBIMA_HOLIDAYS.has("2024-02-13")).toBe(true);
    expect(ANBIMA_HOLIDAYS.has("2024-03-29")).toBe(true);
    expect(ANBIMA_HOLIDAYS.has("2024-05-30")).toBe(true);
  });
  it("contains known moveable holidays for 2025", () => {
    expect(ANBIMA_HOLIDAYS.has("2025-03-03")).toBe(true);
    expect(ANBIMA_HOLIDAYS.has("2025-03-04")).toBe(true);
    expect(ANBIMA_HOLIDAYS.has("2025-04-18")).toBe(true);
    expect(ANBIMA_HOLIDAYS.has("2025-06-19")).toBe(true);
  });
  it("does not contain regular business days", () => {
    expect(ANBIMA_HOLIDAYS.has("2024-03-15")).toBe(false);
  });
});

describe("diasUteis", () => {
  it("counts business days (exclusive start, inclusive end)", () => {
    const d1 = new Date(2024, 6, 1);
    const d2 = new Date(2024, 6, 5);
    expect(diasUteis(d1, d2)).toBe(4);
  });
  it("excludes weekends", () => {
    const d1 = new Date(2024, 6, 1);
    const d2 = new Date(2024, 6, 8);
    expect(diasUteis(d1, d2)).toBe(5);
  });
  it("excludes holidays", () => {
    const d1 = new Date(2024, 8, 6);
    const d2 = new Date(2024, 8, 9);
    expect(diasUteis(d1, d2)).toBe(1);
  });
  it("returns 0 for same date", () => {
    const d = new Date(2024, 6, 1);
    expect(diasUteis(d, d)).toBe(0);
  });
  it("matches known ANBIMA count for Jul 1 to Jan 2 2025", () => {
    const d1 = new Date(2024, 6, 1);
    const d2 = new Date(2025, 0, 2);
    const du = diasUteis(d1, d2);
    expect(du).toBeGreaterThan(120);
    expect(du).toBeLessThan(135);
  });
});

describe("diasCorridos", () => {
  it("counts calendar days", () => {
    const d1 = new Date(2024, 6, 1);
    const d2 = new Date(2025, 0, 2);
    expect(diasCorridos(d1, d2)).toBe(185);
  });
  it("returns 0 for same date", () => {
    const d = new Date(2024, 6, 1);
    expect(diasCorridos(d, d)).toBe(0);
  });
});
