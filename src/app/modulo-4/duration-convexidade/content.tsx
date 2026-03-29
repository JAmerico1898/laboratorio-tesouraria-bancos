"use client";

import { useState } from "react";
import { TabCalculadoraDuration } from "@/components/modulo-4/tab-calculadora-duration";
import { TabConvexidade } from "@/components/modulo-4/tab-convexidade";

const TABS = [
  { label: "\uD83D\uDCD0 Calculadora de Duration", key: "duration" },
  { label: "\uD83D\uDCC8 Convexidade \u2014 2\u00AA Ordem", key: "convexidade" },
];

export function DurationConvexidadeContent() {
  const [activeTab, setActiveTab] = useState("duration");

  return (
    <main className="mesh-bg pt-16 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="font-headline text-2xl md:text-3xl font-extrabold mb-3">
          {"\uD83D\uDCD0"} Duration e Convexidade
        </h1>
        <div className="glass-card rounded-lg p-4 border-l-4 border-primary mb-8">
          <p className="text-on-surface-variant text-sm">
            <strong>Pergunta gerencial:</strong> &ldquo;Por que a duration sozinha não
            basta? O efeito de segunda ordem muda a decisão?&rdquo;
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

        {activeTab === "duration" && <TabCalculadoraDuration />}
        {activeTab === "convexidade" && <TabConvexidade />}
      </div>
    </main>
  );
}
