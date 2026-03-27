import { strings } from "@/lib/strings";

export function Hero() {
  return (
    <section className="relative min-h-[70vh] flex flex-col md:flex-row items-center px-6 md:px-12 max-w-7xl mx-auto gap-8 md:gap-12 overflow-hidden">
      {/* Background glow layers */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-[20%] right-[-5%] w-[450px] h-[450px] rounded-full bg-primary/[0.12] blur-[60px]" />
        <div className="absolute bottom-[-30%] right-[15%] w-[300px] h-[300px] rounded-full bg-primary-container/[0.08] blur-[50px]" />
        <div className="absolute top-[10%] left-[-10%] w-[250px] h-[250px] rounded-full bg-primary/[0.05] blur-[40px]" />
      </div>

      {/* Left — Text */}
      <div className="relative z-10 flex-[1.1] pt-8 md:pt-0">
        <span className="font-label text-primary tracking-[0.3em] text-xs uppercase mb-5 block font-medium">
          {strings.eyebrow}
        </span>
        <h1 className="font-headline text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
          {strings.heroHeadline1}
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-dim to-primary-container">
            {strings.heroHeadline2}
          </span>
        </h1>
        <p className="text-on-surface-variant text-base md:text-lg italic font-light leading-relaxed max-w-md">
          {strings.heroSubtitle}
        </p>
      </div>

      {/* Right — Gradient mesh orb */}
      <div className="relative z-10 flex-[0.9] flex items-center justify-center">
        <div className="relative w-[240px] h-[240px] md:w-[320px] md:h-[320px]">
          {/* Main orb */}
          <div className="absolute top-[10%] left-[10%] w-[80%] h-[80%] rounded-full blur-[20px]"
            style={{ background: "radial-gradient(ellipse at 30% 30%, rgba(88,245,209,0.25), rgba(28,208,173,0.12) 50%, transparent 80%)" }}
          />
          {/* Secondary glow */}
          <div className="absolute top-[25%] left-[30%] w-[55%] h-[55%] rounded-full blur-[12px]"
            style={{ background: "radial-gradient(ellipse at 40% 40%, rgba(88,245,209,0.35), rgba(69,231,195,0.1) 60%, transparent 85%)" }}
          />
          {/* Bright core */}
          <div className="absolute top-[35%] left-[38%] w-[30%] h-[30%] rounded-full blur-[8px]"
            style={{ background: "radial-gradient(circle, rgba(88,245,209,0.5), rgba(28,208,173,0.15) 60%, transparent 85%)" }}
          />
          {/* Rings */}
          <div className="absolute top-[15%] left-[15%] w-[70%] h-[70%] rounded-full border border-primary/[0.08]" />
          <div className="absolute top-[5%] left-[5%] w-[90%] h-[90%] rounded-full border border-primary/[0.04]" />
        </div>
      </div>
    </section>
  );
}
