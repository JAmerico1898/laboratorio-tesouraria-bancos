import type { ReactNode } from "react";
import { ModuleTabBar } from "@/components/module-tab-bar";

const MODULE_4_TABS = [
  { label: "Visão Geral", href: "/modulo-4" },
  { label: "Estratégias", href: "/modulo-4/estrategias", icon: "📊" },
  { label: "Risco de Taxa", href: "/modulo-4/risco-taxa", icon: "⚠️" },
  { label: "Duration e Convexidade", href: "/modulo-4/duration-convexidade", icon: "📐" },
  { label: "Imunização", href: "/modulo-4/imunizacao", icon: "🛡️" },
  { label: "Exercício", href: "/modulo-4/exercicio", icon: "🎯" },
];

export default function Module4Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <ModuleTabBar tabs={MODULE_4_TABS} />
      {children}
    </>
  );
}
