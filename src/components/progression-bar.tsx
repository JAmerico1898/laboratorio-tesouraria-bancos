import Link from "next/link";

interface ProgressionStep {
  icon: string;
  label: string;
  href: string;
  active?: boolean;
}

interface ProgressionBarProps {
  label: string;
  steps: ProgressionStep[];
}

export function ProgressionBar({ label, steps }: ProgressionBarProps) {
  return (
    <div className="glass-card rounded-xl p-5 md:p-6">
      <span className="font-label text-on-surface-variant tracking-[0.15em] text-[10px] uppercase font-semibold block mb-3 text-center">
        {label}
      </span>
      <div className="flex items-center justify-center gap-1.5 md:gap-2 flex-wrap">
        {steps.map((step, i) => (
          <span key={step.href} className="contents">
            <Link
              href={step.href}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm
                font-medium whitespace-nowrap transition-all duration-300
                ${
                  step.active
                    ? "bg-primary/10 border border-primary/30 hover:border-primary/50"
                    : "bg-white/[0.04] border border-transparent hover:border-white/10"
                }
              `}
            >
              <span>{step.icon}</span>
              <span>{step.label}</span>
              {step.active && (
                <span className="text-primary text-[10px] font-semibold ml-0.5">
                  ✓
                </span>
              )}
            </Link>
            {i < steps.length - 1 && (
              <span className="text-primary text-base md:text-lg select-none">
                →
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
