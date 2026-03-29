import { strings } from "@/lib/strings";
import { TopicCard } from "@/components/topic-card";
import { ExerciseCTA } from "@/components/exercise-cta";
import { Mod2HeroSection } from "@/components/Mod2HeroSection";

export const metadata = {
  title: "Curva de Juros (ETTJ) | Laboratório de Tesouraria",
};

const TOPICS = [
  {
    icon: "🧩",
    title: "Componentes da Taxa de Juros",
    question:
      "Por que um título de 5 anos paga mais que um de 1 ano? De onde vem cada pedaço dessa taxa?",
    href: "/modulo-2/componentes-taxa",
  },
  {
    icon: "📈",
    title: "ETTJ e Taxa Spot",
    question:
      "Como se constrói a curva de juros a partir dos contratos futuros de DI?",
    href: "/modulo-2/ettj-taxa-spot",
  },
  {
    icon: "🔮",
    title: "Taxa Forward (FRA)",
    question:
      "O que o mercado está precificando de CDI para os próximos semestres?",
    href: "/modulo-2/taxa-forward",
  },
  {
    icon: "💱",
    title: "Cupom Cambial",
    question:
      "Quanto custa para a tesouraria carregar uma posição em dólar com hedge?",
    href: "/modulo-2/cupom-cambial",
  },
];


export default function Module2Page() {
  return (
    <main className="mesh-bg pt-8 pb-20">
      {/* Remotion Hero */}
      <Mod2HeroSection />

      {/* Overview */}
      <section className="px-6 max-w-4xl mx-auto mb-6 mt-10">
        <div className="glass-card rounded-xl p-6 md:p-8">
          <span className="font-label text-primary tracking-[0.15em] text-[10px] uppercase font-semibold block mb-3">
            {strings.mod2OverviewLabel}
          </span>
          <p className="text-on-surface-variant text-sm md:text-base leading-relaxed">
            {strings.mod2Overview}
          </p>
        </div>
      </section>

      {/* Connection with Module 1 */}
      <section className="px-6 max-w-4xl mx-auto mb-6">
        <div className="glass-card rounded-xl p-5 md:p-6 border-l-4 border-primary">
          <h2 className="font-headline text-sm md:text-base font-bold mb-2">
            {strings.mod2ConnectionTitle}
          </h2>
          <p className="text-on-surface-variant text-xs md:text-sm leading-relaxed">
            {strings.mod2ConnectionText}
          </p>
        </div>
      </section>

      {/* Topic Cards */}
      <section className="px-6 max-w-4xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TOPICS.map((topic) => (
            <TopicCard key={topic.href} {...topic} />
          ))}
        </div>
      </section>

      {/* Exercise CTA */}
      <section className="px-6 max-w-4xl mx-auto">
        <ExerciseCTA
          title={`🎯 ${strings.mod2ExerciseTitle}`}
          description={strings.mod2ExerciseDescription}
          href="/modulo-2/exercicio"
        />
      </section>
    </main>
  );
}
