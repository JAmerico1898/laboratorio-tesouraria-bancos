"use client";

import { useState } from "react";
import { TabCupomCalculo } from "@/components/modulo-2/tab-cupom-calculo";
import { TabCupomDinamica } from "@/components/modulo-2/tab-cupom-dinamica";

const TABS = [
  { label: "📐 Paridade e Cálculo", key: "calculo" },
  { label: "📈 Curva, Dinâmica e Hedge", key: "dinamica" },
];

export function CupomCambialContent() {
  const [activeTab, setActiveTab] = useState("calculo");

  return (
    <main className="mesh-bg pt-16 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="font-headline text-2xl md:text-3xl font-extrabold mb-3">
          💱 Cupom Cambial
        </h1>
        <div className="glass-card rounded-lg p-4 border-l-4 border-primary mb-8">
          <p className="text-on-surface-variant text-sm">
            <strong>Pergunta gerencial:</strong> &ldquo;Quanto custa para minha tesouraria
            carregar uma posição em dólar com hedge? Faz sentido captar em dólar e converter
            para reais?&rdquo;
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

        {activeTab === "calculo" && <TabCupomCalculo />}
        {activeTab === "dinamica" && <TabCupomDinamica />}
      </div>
    </main>
  );
}
