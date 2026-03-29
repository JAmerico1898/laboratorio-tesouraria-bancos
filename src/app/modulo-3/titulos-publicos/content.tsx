"use client";

import { useState } from "react";
import { TabLtn } from "@/components/modulo-3/tab-ltn";
import { TabNtnf } from "@/components/modulo-3/tab-ntnf";
import { TabLft } from "@/components/modulo-3/tab-lft";
import { TabNtnb } from "@/components/modulo-3/tab-ntnb";
import { TabComparativoPublicos } from "@/components/modulo-3/tab-comparativo-publicos";

const TABS = [
  { label: "LTN", key: "ltn" },
  { label: "NTN-F", key: "ntnf" },
  { label: "LFT", key: "lft" },
  { label: "NTN-B", key: "ntnb" },
  { label: "\uD83D\uDCCA Comparativo", key: "comparativo" },
];

export function TitulosPublicosContent() {
  const [activeTab, setActiveTab] = useState("ltn");

  return (
    <main className="mesh-bg pt-16 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="font-headline text-2xl md:text-3xl font-extrabold mb-3">
          {"\uD83C\uDDE7\uD83C\uDDF7"} Titulos Publicos Federais
        </h1>
        <div className="glass-card rounded-lg p-4 border-l-4 border-primary mb-8">
          <p className="text-on-surface-variant text-sm">
            <strong>Pergunta gerencial:</strong> &ldquo;Qual titulo publico
            oferece a melhor relacao risco-retorno dado o cenario atual?&rdquo;
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

        {activeTab === "ltn" && <TabLtn />}
        {activeTab === "ntnf" && <TabNtnf />}
        {activeTab === "lft" && <TabLft />}
        {activeTab === "ntnb" && <TabNtnb />}
        {activeTab === "comparativo" && <TabComparativoPublicos />}
      </div>
    </main>
  );
}
