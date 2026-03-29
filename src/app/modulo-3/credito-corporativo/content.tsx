"use client";

import { useState } from "react";
import { TabDebentureCdi } from "@/components/modulo-3/tab-debenture-cdi";
import { TabDebentureIpca } from "@/components/modulo-3/tab-debenture-ipca";
import { TabCriCraNp } from "@/components/modulo-3/tab-cri-cra-np";

const TABS = [
  { label: "Debênture CDI+", key: "deb-cdi" },
  { label: "Debênture IPCA+", key: "deb-ipca" },
  { label: "CRI, CRA e NP", key: "cri-cra" },
];

export function CreditoCorporativoContent() {
  const [activeTab, setActiveTab] = useState("deb-cdi");

  return (
    <main className="mesh-bg pt-16 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="font-headline text-2xl md:text-3xl font-extrabold mb-3">
          {"\uD83C\uDFE2"} Credito Privado Corporativo
        </h1>
        <div className="glass-card rounded-lg p-4 border-l-4 border-primary mb-8">
          <p className="text-on-surface-variant text-sm">
            <strong>Pergunta gerencial:</strong> &ldquo;Essa debenture esta
            pagando o suficiente pelo risco de credito e pela iliquidez?&rdquo;
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

        {activeTab === "deb-cdi" && <TabDebentureCdi />}
        {activeTab === "deb-ipca" && <TabDebentureIpca />}
        {activeTab === "cri-cra" && <TabCriCraNp />}
      </div>
    </main>
  );
}
