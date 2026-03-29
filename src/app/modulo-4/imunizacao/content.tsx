"use client";

import { useState } from "react";
import {
  TabImunizacaoConstrutor,
  type ImunData,
} from "@/components/modulo-4/tab-imunizacao-construtor";
import { TabImunizacaoVerificacao } from "@/components/modulo-4/tab-imunizacao-verificacao";
import { TabDurationDrift } from "@/components/modulo-4/tab-duration-drift";

const TABS = [
  { label: "\uD83D\uDEE0\uFE0F Construtor", key: "construtor" },
  { label: "\u2705 Verificação", key: "verificacao" },
  { label: "\uD83D\uDCC9 Duration Drift", key: "drift" },
];

export function ImunizacaoContent() {
  const [activeTab, setActiveTab] = useState("construtor");
  const [imunData, setImunData] = useState<ImunData | null>(null);

  return (
    <main className="mesh-bg pt-16 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="font-headline text-2xl md:text-3xl font-extrabold mb-3">
          {"\uD83D\uDEE1\uFE0F"} Imunização
        </h1>
        <div className="glass-card rounded-lg p-4 border-l-4 border-primary mb-8">
          <p className="text-on-surface-variant text-sm">
            <strong>Pergunta gerencial:</strong> &ldquo;Como garantir que minha
            carteira cubra uma obrigação futura independentemente do que aconteça
            com os juros?&rdquo;
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

        {activeTab === "construtor" && (
          <TabImunizacaoConstrutor onImunChange={setImunData} />
        )}
        {activeTab === "verificacao" && (
          <TabImunizacaoVerificacao imun={imunData} />
        )}
        {activeTab === "drift" && <TabDurationDrift imun={imunData} />}
      </div>
    </main>
  );
}
