"use client";

import { useState } from "react";
import { TabEstrategiasClassicas } from "@/components/modulo-4/tab-estrategias-classicas";
import { TabEstrategiaCenario } from "@/components/modulo-4/tab-estrategia-cenario";
import { TabRiding } from "@/components/modulo-4/tab-riding";

const TABS = [
  { label: "\uD83D\uDCCA Estratégias Clássicas", key: "classicas" },
  { label: "\uD83D\uDD04 Estratégia \u00D7 Cenário", key: "cenario" },
  { label: "\uD83C\uDFC4 Riding the Curve", key: "riding" },
];

export function EstrategiasContent() {
  const [activeTab, setActiveTab] = useState("classicas");

  return (
    <main className="mesh-bg pt-16 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="font-headline text-2xl md:text-3xl font-extrabold mb-3">
          {"\uD83D\uDCCA"} Estratégias de Investimento
        </h1>
        <div className="glass-card rounded-lg p-4 border-l-4 border-primary mb-8">
          <p className="text-on-surface-variant text-sm">
            <strong>Pergunta gerencial:</strong> &ldquo;Bullet, barbell ou ladder?
            Qual estratégia se adapta melhor ao cenário e ao perfil de risco?&rdquo;
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

        {activeTab === "classicas" && <TabEstrategiasClassicas />}
        {activeTab === "cenario" && <TabEstrategiaCenario />}
        {activeTab === "riding" && <TabRiding />}
      </div>
    </main>
  );
}
