"use client";

import { useState } from "react";
import { TabAnatomiaTaxa } from "@/components/modulo-2/tab-anatomia-taxa";
import { TabBreakeven } from "@/components/modulo-2/tab-breakeven";

const TABS = [
  { label: "🔬 Anatomia da Taxa", key: "anatomia" },
  { label: "📊 Inflação Implícita (Breakeven)", key: "breakeven" },
];

export function ComponentesTaxaContent() {
  const [activeTab, setActiveTab] = useState("anatomia");

  return (
    <main className="mesh-bg pt-16 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="font-headline text-2xl md:text-3xl font-extrabold mb-3">
          🧩 Componentes da Taxa de Juros
        </h1>
        <div className="glass-card rounded-lg p-4 border-l-4 border-primary mb-8">
          <p className="text-on-surface-variant text-sm">
            <strong>Pergunta gerencial:</strong> &ldquo;Por que um título de 5 anos paga mais que
            um de 1 ano? De onde vem cada pedaço dessa taxa?&rdquo;
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

        {activeTab === "anatomia" && <TabAnatomiaTaxa />}
        {activeTab === "breakeven" && <TabBreakeven />}
      </div>
    </main>
  );
}
