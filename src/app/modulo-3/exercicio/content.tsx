"use client";
import { ExercicioRelativeValue } from "@/components/modulo-3/exercicio-relative-value";

export function ExercicioContent() {
  return (
    <main className="mesh-bg pt-16 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="font-headline text-2xl md:text-3xl font-extrabold mb-3">
          ⚖️ Exercicio Integrador — Relative Value
        </h1>
        <div className="glass-card rounded-lg p-4 border-l-4 border-primary mb-8">
          <p className="text-on-surface-variant text-sm">
            <strong>Pergunta gerencial:</strong> &ldquo;Tenho R$ 50 milhoes para alocar em renda fixa. Dado o cenario, qual a melhor combinacao de instrumentos considerando retorno, risco e liquidez?&rdquo;
          </p>
        </div>
        <ExercicioRelativeValue />
      </div>
    </main>
  );
}
