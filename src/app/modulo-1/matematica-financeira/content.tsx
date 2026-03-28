"use client";

import { useState } from "react";
import { TabCapitalizacao } from "@/components/modulo-1/tab-capitalizacao";
import { TabPrecificacao } from "@/components/modulo-1/tab-precificacao";

const TABS = [
  { label: "📊 Capitalização e Taxas Equivalentes", key: "cap" },
  { label: "💵 Precificação de Títulos", key: "prec" },
];

export function MatematicaFinanceiraContent() {
  const [activeTab, setActiveTab] = useState("cap");

  return (
    <main className="mesh-bg pt-16 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="font-headline text-2xl md:text-3xl font-extrabold mb-3">
          📐 Matemática Financeira Aplicada à Tesouraria
        </h1>
        <div className="glass-card rounded-lg p-4 border-l-4 border-primary mb-8">
          <p className="text-on-surface-variant text-sm">
            <strong>Pergunta gerencial:</strong> &ldquo;Qual é o preço justo deste título? Qual taxa
            estou realmente praticando nesta operação?&rdquo;
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

        {activeTab === "cap" && <TabCapitalizacao />}
        {activeTab === "prec" && <TabPrecificacao />}
      </div>
    </main>
  );
}
