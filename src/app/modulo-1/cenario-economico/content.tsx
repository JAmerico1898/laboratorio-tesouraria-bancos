"use client";

import { useState } from "react";
import { TabPainelMacro } from "@/components/modulo-1/tab-painel-macro";
import { TabCenarios } from "@/components/modulo-1/tab-cenarios";

const TABS = [
  { label: "📊 Painel Macroeconômico", key: "painel" },
  { label: "🔮 Simulador de Cenários", key: "cenarios" },
];

export function CenarioEconomicoContent() {
  const [activeTab, setActiveTab] = useState("painel");

  return (
    <main className="mesh-bg pt-16 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="font-headline text-2xl md:text-3xl font-extrabold mb-3">
          🌎 Cenário Econômico e Taxa de Juros
        </h1>
        <div className="glass-card rounded-lg p-4 border-l-4 border-primary mb-8">
          <p className="text-on-surface-variant text-sm">
            <strong>Pergunta gerencial:</strong> &ldquo;Dado o cenário macro, para onde vão os
            juros? Como posicionar minha carteira?&rdquo;
          </p>
        </div>

        <div className="flex gap-0 mb-8 border-b border-outline-variant/30">
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

        {activeTab === "painel" && <TabPainelMacro />}
        {activeTab === "cenarios" && <TabCenarios />}
      </div>
    </main>
  );
}
