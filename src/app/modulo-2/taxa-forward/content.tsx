"use client";

import { useState } from "react";
import { TabForwardCalculator } from "@/components/modulo-2/tab-forward-calculator";
import { TabFraStrategy } from "@/components/modulo-2/tab-fra-strategy";
import { type ForwardPoint } from "@/lib/finance";

const TABS = [
  { label: "📊 Calculadora de Forwards", key: "calculator" },
  { label: "📈 FRA e Estratégias", key: "fra" },
];

export function TaxaForwardContent() {
  const [activeTab, setActiveTab] = useState("calculator");
  const [forwards, setForwards] = useState<ForwardPoint[]>([]);
  const [selicAtual, setSelicAtual] = useState(14.25);

  return (
    <main className="mesh-bg pt-16 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="font-headline text-2xl md:text-3xl font-extrabold mb-3">
          🔮 Taxa Forward (FRA)
        </h1>
        <div className="glass-card rounded-lg p-4 border-l-4 border-primary mb-8">
          <p className="text-on-surface-variant text-sm">
            <strong>Pergunta gerencial:</strong> &ldquo;O que o mercado está precificando de CDI
            para os próximos semestres? Se minha visão é diferente, como posso me posicionar?&rdquo;
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

        {activeTab === "calculator" && (
          <TabForwardCalculator
            onForwardsChange={setForwards}
            onSelicChange={setSelicAtual}
          />
        )}
        {activeTab === "fra" && (
          <TabFraStrategy forwards={forwards} selicAtual={selicAtual} />
        )}
      </div>
    </main>
  );
}
