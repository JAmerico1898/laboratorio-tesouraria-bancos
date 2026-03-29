"use client";
import { ExercicioGestor } from "@/components/modulo-4/exercicio-gestor";

export function ExercicioContent() {
  return (
    <main className="mesh-bg pt-16 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="font-headline text-2xl md:text-3xl font-extrabold mb-3">
          🎯 Exercício Integrador — Gestor por um Dia
        </h1>
        <div className="glass-card rounded-lg p-4 border-l-4 border-primary mb-8">
          <p className="text-on-surface-variant text-sm">
            <strong>Pergunta gerencial:</strong> &ldquo;Tenho R$ 100 milhões, limites de risco definidos e uma obrigação de funding a vencer. Como monto a carteira?&rdquo;
          </p>
        </div>
        <ExercicioGestor />
      </div>
    </main>
  );
}
