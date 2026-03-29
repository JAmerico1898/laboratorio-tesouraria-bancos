"use client";

import { useState } from "react";
import { TabFontesRisco } from "@/components/modulo-4/tab-fontes-risco";
import { TabMetricasRisco } from "@/components/modulo-4/tab-metricas-risco";
import { TabStressTest } from "@/components/modulo-4/tab-stress-test";

const TABS = [
  { label: "\uD83D\uDCC8 Fontes de Risco", key: "fontes" },
  { label: "\uD83D\uDCCA DV01 e Métricas", key: "metricas" },
  { label: "\uD83D\uDCA5 Stress Test", key: "stress" },
];

export function RiscoTaxaContent() {
  const [activeTab, setActiveTab] = useState("fontes");

  return (
    <main className="mesh-bg pt-16 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="font-headline text-2xl md:text-3xl font-extrabold mb-3">
          {"\u26A0\uFE0F"} Risco de Taxa de Juros
        </h1>
        <div className="glass-card rounded-lg p-4 border-l-4 border-primary mb-8">
          <p className="text-on-surface-variant text-sm">
            <strong>Pergunta gerencial:</strong> &ldquo;Qual a exposição da minha
            carteira? Onde está concentrado o risco? Estou dentro dos limites?&rdquo;
          </p>
        </div>

        <div className="flex gap-0 mb-8 border-b border-outline-variant/30 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-headline font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.key
                  ? "text-primary border-primary"
                  : "text-on-surface-variant border-transparent hover:text-on-surface"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "fontes" && <TabFontesRisco />}
        {activeTab === "metricas" && <TabMetricasRisco />}
        {activeTab === "stress" && <TabStressTest />}
      </div>
    </main>
  );
}
