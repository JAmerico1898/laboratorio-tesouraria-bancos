"use client";

import { useState } from "react";
import { TabCdbPos } from "@/components/modulo-3/tab-cdb-pos";
import { TabCdbPre } from "@/components/modulo-3/tab-cdb-pre";
import { TabLciLca } from "@/components/modulo-3/tab-lci-lca";
import { TabLfDpge } from "@/components/modulo-3/tab-lf-dpge";

const TABS = [
  { label: "CDB Pós (% CDI)", key: "cdb-pos" },
  { label: "CDB Pré", key: "cdb-pre" },
  { label: "LCI/LCA", key: "lci-lca" },
  { label: "LF e DPGE", key: "lf-dpge" },
];

export function TitulosIfsContent() {
  const [activeTab, setActiveTab] = useState("cdb-pos");

  return (
    <main className="mesh-bg pt-16 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="font-headline text-2xl md:text-3xl font-extrabold mb-3">
          {"\uD83C\uDFE6"} Titulos Privados de Instituicoes Financeiras
        </h1>
        <div className="glass-card rounded-lg p-4 border-l-4 border-primary mb-8">
          <p className="text-on-surface-variant text-sm">
            <strong>Pergunta gerencial:</strong> &ldquo;O CDB que estou
            comprando esta a preco justo? O spread compensa o risco de credito
            da IF?&rdquo;
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

        {activeTab === "cdb-pos" && <TabCdbPos />}
        {activeTab === "cdb-pre" && <TabCdbPre />}
        {activeTab === "lci-lca" && <TabLciLca />}
        {activeTab === "lf-dpge" && <TabLfDpge />}
      </div>
    </main>
  );
}
