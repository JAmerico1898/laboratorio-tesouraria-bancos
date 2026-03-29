"use client";

import { ExercicioIntegrador } from "@/components/modulo-2/exercicio-integrador";

export function ExercicioContent() {
  return (
    <main className="mesh-bg pt-16 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="font-headline text-2xl md:text-3xl font-extrabold mb-3">
          🎯 Exercício Integrador — Leitura Completa da Curva
        </h1>
        <div className="glass-card rounded-lg p-4 border-l-4 border-primary mb-8">
          <p className="text-on-surface-variant text-sm">
            <strong>Pergunta gerencial:</strong> &ldquo;Olhando todas as curvas juntas, o que
            o mercado está dizendo? E o que minha tesouraria deveria fazer?&rdquo;
          </p>
        </div>
        <ExercicioIntegrador />
      </div>
    </main>
  );
}
