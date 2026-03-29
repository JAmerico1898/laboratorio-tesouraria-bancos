import { strings } from "@/lib/strings";
import { TopicCard } from "@/components/topic-card";
import { ExerciseCTA } from "@/components/exercise-cta";
import { ProgressionBar } from "@/components/progression-bar";
import { Mod4HeroSection } from "@/components/Mod4HeroSection";

export const metadata = {
  title: "Gestão de Carregamento | Laboratório de Tesouraria",
};

const TOPICS = [
  {
    icon: "📊",
    title: "Estratégias de Investimento",
    question:
      "Bullet, barbell ou ladder? Qual estratégia se adapta melhor ao cenário e ao perfil de risco?",
    href: "/modulo-4/estrategias",
  },
  {
    icon: "⚠️",
    title: "Risco de Taxa de Juros",
    question:
      "Quanto minha carteira perde se a curva se deslocar? DV01, stress test e limites de risco.",
    href: "/modulo-4/risco-taxa",
  },
  {
    icon: "📐",
    title: "Duration e Convexidade",
    question:
      "Por que a duration sozinha não basta? O efeito de segunda ordem muda a decisão?",
    href: "/modulo-4/duration-convexidade",
  },
  {
    icon: "🛡️",
    title: "Imunização",
    question:
      "Como proteger uma obrigação futura contra variações de taxa? A imunização funciona na prática?",
    href: "/modulo-4/imunizacao",
  },
];

const PROGRESSION_STEPS = [
  { icon: "📊", label: "Estratégias", href: "/modulo-4/estrategias" },
  { icon: "⚠️", label: "Risco", href: "/modulo-4/risco-taxa" },
  { icon: "📐", label: "Duration", href: "/modulo-4/duration-convexidade" },
  { icon: "🛡️", label: "Imunização", href: "/modulo-4/imunizacao" },
  { icon: "🎯", label: "Integrador", href: "/modulo-4/exercicio" },
];

export default function Module4Page() {
  return (
    <main className="mesh-bg pt-8 pb-20">
      {/* Remotion Hero */}
      <Mod4HeroSection />

      {/* Overview */}
      <section className="px-6 max-w-4xl mx-auto mb-6 mt-10">
        <div className="glass-card rounded-xl p-6 md:p-8">
          <span className="font-label text-primary tracking-[0.15em] text-[10px] uppercase font-semibold block mb-3">
            {strings.mod4OverviewLabel}
          </span>
          <p className="text-on-surface-variant text-sm md:text-base leading-relaxed">
            {strings.mod4Overview}
          </p>
        </div>
      </section>

      {/* Connection */}
      <section className="px-6 max-w-4xl mx-auto mb-6">
        <div className="glass-card rounded-xl p-5 md:p-6 border-l-4 border-primary">
          <h2 className="font-headline text-sm md:text-base font-bold mb-2">
            {strings.mod4ConnectionTitle}
          </h2>
          <p className="text-on-surface-variant text-xs md:text-sm leading-relaxed">
            {strings.mod4ConnectionText}
          </p>
        </div>
      </section>

      {/* Progression */}
      <section className="px-6 max-w-4xl mx-auto mb-8">
        <ProgressionBar label={strings.mod4ProgressionLabel} steps={PROGRESSION_STEPS} />
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
          title={`🎯 ${strings.mod4ExerciseTitle}`}
          description={strings.mod4ExerciseDescription}
          href="/modulo-4/exercicio"
        />
      </section>
    </main>
  );
}
