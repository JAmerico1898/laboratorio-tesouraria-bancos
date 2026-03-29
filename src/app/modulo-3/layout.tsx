import type { ReactNode } from "react";
import { ModuleTabBar } from "@/components/module-tab-bar";

const MODULE_3_TABS = [
  { label: "Visão Geral", href: "/modulo-3" },
  { label: "Títulos Públicos", href: "/modulo-3/titulos-publicos", icon: "🇧🇷" },
  { label: "Títulos de IFs", href: "/modulo-3/titulos-ifs", icon: "🏦" },
  { label: "Crédito Corporativo", href: "/modulo-3/credito-corporativo", icon: "🏢" },
  { label: "Exercício", href: "/modulo-3/exercicio", icon: "⚖️" },
];

export default function Module3Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <ModuleTabBar tabs={MODULE_3_TABS} />
      {children}
    </>
  );
}
