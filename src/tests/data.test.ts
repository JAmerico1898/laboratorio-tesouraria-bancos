import { describe, it, expect } from "vitest";
import { loadCurvasDi, loadNtnbTaxas, loadFocusIpca } from "@/lib/data";

describe("loadCurvasDi", () => {
  it("loads and parses curvas_di.csv with correct shape", async () => {
    const data = await loadCurvasDi();
    expect(data.length).toBeGreaterThan(0);
    const first = data[0];
    expect(first).toHaveProperty("data");
    expect(first).toHaveProperty("prazoDu");
    expect(first).toHaveProperty("taxa");
    expect(typeof first.prazoDu).toBe("number");
    expect(typeof first.taxa).toBe("number");
  });
});

describe("loadNtnbTaxas", () => {
  it("loads and parses ntnb_taxas.csv with correct shape", async () => {
    const data = await loadNtnbTaxas();
    expect(data.length).toBeGreaterThan(0);
    const first = data[0];
    expect(first).toHaveProperty("data");
    expect(first).toHaveProperty("prazoDu");
    expect(first).toHaveProperty("taxa");
    expect(typeof first.taxa).toBe("number");
  });
});

describe("loadFocusIpca", () => {
  it("loads and parses focus_ipca.csv with correct shape", async () => {
    const data = await loadFocusIpca();
    expect(data.length).toBeGreaterThan(0);
    const first = data[0];
    expect(first).toHaveProperty("dataColeta");
    expect(first).toHaveProperty("variavel");
    expect(first).toHaveProperty("mediana");
    expect(typeof first.mediana).toBe("number");
  });
});
