import type { ReactNode } from "react";
import { ModuleTabBar } from "@/components/module-tab-bar";

const MODULE_2_TABS = [
  { label: "Visão Geral", href: "/modulo-2" },
  { label: "Componentes da Taxa", href: "/modulo-2/componentes-taxa", icon: "🧩" },
  { label: "ETTJ e Taxa Spot", href: "/modulo-2/ettj-taxa-spot", icon: "📈" },
  { label: "Taxa Forward", href: "/modulo-2/taxa-forward", icon: "🔮" },
  { label: "Cupom Cambial", href: "/modulo-2/cupom-cambial", icon: "💱" },
  { label: "Exercício", href: "/modulo-2/exercicio", icon: "🎯" },
];

export default function Module2Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <ModuleTabBar tabs={MODULE_2_TABS} />
      {children}
    </>
  );
}
