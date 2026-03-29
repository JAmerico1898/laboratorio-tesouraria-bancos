import { strings } from "@/lib/strings";
import { TopicCard } from "@/components/topic-card";
import { ExerciseCTA } from "@/components/exercise-cta";
import { Mod1HeroSection } from "@/components/Mod1HeroSection";

export const metadata = {
  title: "Operações Fundamentais | Laboratório de Tesouraria",
};

const TOPICS = [
  {
    icon: "📐",
    title: "Matemática Financeira Aplicada",
    question:
      "Qual o preço justo deste título? Que taxa estou realmente praticando?",
    href: "/modulo-1/matematica-financeira",
  },
  {
    icon: "💰",
    title: "Mercado Monetário e Taxas de Juros",
    question:
      "Qual benchmark devo usar? Como minhas taxas se comparam às referências?",
    href: "/modulo-1/mercado-monetario",
  },
  {
    icon: "🌎",
    title: "Cenário Econômico e Taxa de Juros",
    question:
      "Dado o cenário macro, para onde vão os juros? Como posicionar meu portfólio?",
    href: "/modulo-1/cenario-economico",
  },
  {
    icon: "⚠️",
    title: "Risco Financeiro e Taxa de Juros",
    question:
      "Quanto risco estou correndo? O spread capturado compensa adequadamente?",
    href: "/modulo-1/risco-financeiro",
  },
];

export default function Module1Page() {
  return (
    <main className="mesh-bg pt-8 pb-20">
      {/* Remotion Hero */}
      <Mod1HeroSection />

      {/* Overview */}
      <section className="px-6 max-w-4xl mx-auto mb-10 mt-10">
        <div className="glass-card rounded-xl p-6 md:p-8">
          <span className="font-label text-primary tracking-[0.15em] text-[10px] uppercase font-semibold block mb-3">
            {strings.mod1OverviewLabel}
          </span>
          <p className="text-on-surface-variant text-sm md:text-base leading-relaxed">
            {strings.mod1Overview}
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
          title={`🧩 ${strings.mod1ExerciseTitle}`}
          description={strings.mod1ExerciseDescription}
          href="/modulo-1/exercicio"
        />
      </section>
    </main>
  );
}
