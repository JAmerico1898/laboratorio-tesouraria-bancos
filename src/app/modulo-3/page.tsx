import { strings } from "@/lib/strings";
import { TopicCard } from "@/components/topic-card";
import { ExerciseCTA } from "@/components/exercise-cta";
import { Mod3HeroSection } from "@/components/Mod3HeroSection";

export const metadata = {
  title: "Precificação de Ativos | Laboratório de Tesouraria",
};

const TOPICS = [
  {
    icon: "🇧🇷",
    title: "Títulos Públicos Federais",
    question:
      "LTN, NTN-F, NTN-B, LFT — qual título público se encaixa melhor na minha carteira?",
    href: "/modulo-3/titulos-publicos",
  },
  {
    icon: "🏦",
    title: "Títulos Privados de IFs",
    question:
      "CDB, LCI, LCA — como comparar um CDB pré com um pós? Quando a isenção fiscal compensa?",
    href: "/modulo-3/titulos-ifs",
  },
  {
    icon: "🏢",
    title: "Crédito Privado Corporativo",
    question:
      "Debêntures, CRI, CRA — o spread compensa o risco de crédito?",
    href: "/modulo-3/credito-corporativo",
  },
];


export default function Module3Page() {
  return (
    <main className="mesh-bg pt-8 pb-20">
      {/* Remotion Hero */}
      <Mod3HeroSection />

      {/* Overview */}
      <section className="px-6 max-w-4xl mx-auto mb-6 mt-10">
        <div className="glass-card rounded-xl p-6 md:p-8">
          <span className="font-label text-primary tracking-[0.15em] text-[10px] uppercase font-semibold block mb-3">
            {strings.mod3OverviewLabel}
          </span>
          <p className="text-on-surface-variant text-sm md:text-base leading-relaxed">
            {strings.mod3Overview}
          </p>
        </div>
      </section>

      {/* Connection with previous modules */}
      <section className="px-6 max-w-4xl mx-auto mb-6">
        <div className="glass-card rounded-xl p-5 md:p-6 border-l-4 border-primary">
          <h2 className="font-headline text-sm md:text-base font-bold mb-2">
            {strings.mod3ConnectionTitle}
          </h2>
          <p className="text-on-surface-variant text-xs md:text-sm leading-relaxed">
            {strings.mod3ConnectionText}
          </p>
        </div>
      </section>

      {/* Topic Cards */}
      <section className="px-6 max-w-4xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TOPICS.map((topic) => (
            <TopicCard key={topic.href} {...topic} />
          ))}
        </div>
      </section>

      {/* Exercise CTA */}
      <section className="px-6 max-w-4xl mx-auto">
        <ExerciseCTA
          title={`⚖️ ${strings.mod3ExerciseTitle}`}
          description={strings.mod3ExerciseDescription}
          href="/modulo-3/exercicio"
        />
      </section>
    </main>
  );
}
