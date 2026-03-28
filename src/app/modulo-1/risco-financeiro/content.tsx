"use client";

import { useState } from "react";
import { TabDecomposicao } from "@/components/modulo-1/tab-decomposicao";
import { TabMtm } from "@/components/modulo-1/tab-mtm";

const TABS = [
  { label: "📊 Decomposição da Taxa", key: "decomposicao" },
  { label: "📉 Risco de Mercado (MtM)", key: "mtm" },
];

export function RiscoFinanceiroContent() {
  const [activeTab, setActiveTab] = useState("decomposicao");

  return (
    <main className="mesh-bg pt-16 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="font-headline text-2xl md:text-3xl font-extrabold mb-3">
          ⚠️ Risco Financeiro e Taxa de Juros
        </h1>
        <div className="glass-card rounded-lg p-4 border-l-4 border-primary mb-8">
          <p className="text-on-surface-variant text-sm">
            <strong>Pergunta gerencial:</strong> &ldquo;Quanto risco estou correndo? Quanto do spread
            que capturo é compensação por risco?&rdquo;
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

        {activeTab === "decomposicao" && <TabDecomposicao />}
        {activeTab === "mtm" && <TabMtm />}
      </div>
    </main>
  );
}
