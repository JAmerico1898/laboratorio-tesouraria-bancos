import { describe, it, expect } from "vitest";
import { parseCsv } from "./csv";

describe("parseCsv", () => {
  it("parses simple CSV text into array of objects", () => {
    const text = "data,valor\n2024-01-01,13.75\n2024-01-02,13.50";
    const result = parseCsv(text);
    expect(result).toEqual([
      { data: "2024-01-01", valor: "13.75" },
      { data: "2024-01-02", valor: "13.50" },
    ]);
  });
  it("handles trailing newline", () => {
    const text = "data,valor\n2024-01-01,13.75\n";
    const result = parseCsv(text);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ data: "2024-01-01", valor: "13.75" });
  });
  it("handles Windows line endings", () => {
    const text = "data,valor\r\n2024-01-01,13.75\r\n2024-01-02,13.50\r\n";
    const result = parseCsv(text);
    expect(result).toHaveLength(2);
    expect(result[0].data).toBe("2024-01-01");
  });
  it("returns empty array for header-only CSV", () => {
    const text = "data,valor\n";
    const result = parseCsv(text);
    expect(result).toEqual([]);
  });
  it("trims whitespace from values", () => {
    const text = "data, valor\n 2024-01-01 , 13.75 ";
    const result = parseCsv(text);
    expect(result[0]).toEqual({ data: "2024-01-01", valor: "13.75" });
  });
  it("parses semicolon-separated CSV", () => {
    const text = "data;valor\n01/15/2024;100.5\n01/16/2024;101.2";
    const result = parseCsv(text, ";");
    expect(result).toEqual([
      { data: "01/15/2024", valor: "100.5" },
      { data: "01/16/2024", valor: "101.2" },
    ]);
  });
  it("strips BOM character", () => {
    const text = "\uFEFFdata;valor\n01/15/2024;100.5";
    const result = parseCsv(text, ";");
    expect(result[0].data).toBe("01/15/2024");
  });
});
