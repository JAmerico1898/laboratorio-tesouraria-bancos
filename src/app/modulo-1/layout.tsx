import type { ReactNode } from "react";
import { ModuleTabBar } from "@/components/module-tab-bar";

const MODULE_1_TABS = [
  { label: "Visão Geral", href: "/modulo-1" },
  { label: "Matemática Financeira", href: "/modulo-1/matematica-financeira", icon: "📐" },
  { label: "Mercado Monetário", href: "/modulo-1/mercado-monetario", icon: "💰" },
  { label: "Cenário Econômico", href: "/modulo-1/cenario-economico", icon: "🌎" },
  { label: "Risco Financeiro", href: "/modulo-1/risco-financeiro", icon: "⚠️" },
  { label: "Exercício", href: "/modulo-1/exercicio", icon: "🧩" },
];

export default function Module1Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <ModuleTabBar tabs={MODULE_1_TABS} />
      {children}
    </>
  );
}
