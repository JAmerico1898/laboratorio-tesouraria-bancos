import Link from "next/link";
import { MODULES } from "@/lib/modules";
import { strings } from "@/lib/strings";

export function ModuleCards() {
  return (
    <section className="px-6 md:px-12 max-w-7xl mx-auto pb-20">
      <div className="text-center mb-10">
        <h2 className="font-headline text-3xl md:text-4xl font-extrabold mb-4">
          {strings.modulesHeading}
        </h2>
        <div className="w-20 h-1.5 bg-primary rounded-full mx-auto" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MODULES.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="glass-card rounded-xl p-8 hover:bg-surface-container-high transition-all duration-300 group"
          >
            {/* Top row: icon + number */}
            <div className="flex justify-between items-start mb-12">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-3xl">{mod.icon}</span>
              </div>
              <span className="font-label text-on-surface-variant/40 text-4xl font-bold">
                {mod.number}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-headline text-xl md:text-2xl font-bold mb-3">
              {mod.title}
            </h3>

            {/* Subtitle */}
            <p className="text-on-surface-variant leading-relaxed mb-6">
              {mod.subtitle}
            </p>

            {/* CTA */}
            <div className="flex items-center gap-2 text-primary font-headline font-bold text-sm group-hover:gap-4 transition-all duration-300">
              {strings.exploreContent}
              <span className="material-symbols-outlined">arrow_forward</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
