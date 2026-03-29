import { InterpolationMethod, METHOD_LABELS } from "@/lib/ettj/types";

interface MethodEquationProps {
  method: InterpolationMethod;
  smoothingFactor?: number;
}

interface MethodInfo {
  formula: string;
  description: string;
}

const METHOD_INFO: Record<InterpolationMethod, MethodInfo> = {
  "flat-forward": {
    formula: "r(d) = [cap(d)]^(252/d) - 1\ncap(d) = cap(dᵢ) × (1 + f)^((d - dᵢ)/252)",
    description:
      "A taxa forward entre dois vértices consecutivos é constante. O fator de capitalização é interpolado exponencialmente, garantindo consistência com a ausência de arbitragem.",
  },
  linear: {
    formula: "r(d) = rᵢ + (d - dᵢ) / (dᵢ₊₁ - dᵢ) × (rᵢ₊₁ - rᵢ)",
    description:
      "Interpolação linear simples entre os vértices observados. Rápida e intuitiva, mas produz uma curva com quebras nas derivadas.",
  },
  "cubic-spline": {
    formula: "S(x) = aᵢ + bᵢ(x - xᵢ) + cᵢ(x - xᵢ)² + dᵢ(x - xᵢ)³",
    description:
      "Polinômio cúbico por partes com continuidade de primeira e segunda derivadas nos nós. Produz curvas suaves, mas pode oscilar em regiões com poucos dados.",
  },
  pchip: {
    formula: "P(x) = Σ hₖ(x) × yₖ + Σ ĥₖ(x) × dₖ  (base de Hermite)",
    description:
      "Interpolação Hermite com preservação de monotonicidade (Piecewise Cubic Hermite Interpolating Polynomial). Evita oscilações espúrias ao impor restrições nas derivadas.",
  },
  akima: {
    formula: "dᵢ = (w₁ × mᵢ + w₂ × mᵢ₋₁) / (w₁ + w₂)\nwₖ = |mᵢ₊ₖ - mᵢ₊ₖ₋₁|",
    description:
      "Método de Akima: calcula derivadas como média ponderada das inclinações adjacentes, com pesos que reduzem a influência de outliers. Menos oscilatório que cubic spline.",
  },
  "smoothing-spline": {
    formula: "min Σ(yᵢ - f(xᵢ))² + s × ∫ f''(x)² dx",
    description:
      "Spline suavizadora que equilibra aderência aos dados e suavidade da curva. O parâmetro s controla o trade-off: valores maiores produzem curvas mais suaves.",
  },
  "nelson-siegel": {
    formula:
      "r(τ) = β₀ + β₁ × [(1 - e^(-τ/λ)) / (τ/λ)] + β₂ × [(1 - e^(-τ/λ)) / (τ/λ) - e^(-τ/λ)]",
    description:
      "Modelo paramétrico de 4 parâmetros (β₀, β₁, β₂, λ). β₀ é o nível de longo prazo, β₁ controla a inclinação, β₂ a curvatura e λ a velocidade de decaimento.",
  },
  "nelson-siegel-svensson": {
    formula:
      "r(τ) = β₀ + β₁ × [(1 - e^(-τ/λ₁)) / (τ/λ₁)] + β₂ × [(1 - e^(-τ/λ₁)) / (τ/λ₁) - e^(-τ/λ₁)]\n       + β₃ × [(1 - e^(-τ/λ₂)) / (τ/λ₂) - e^(-τ/λ₂)]",
    description:
      "Extensão do modelo Nelson-Siegel com um segundo termo de curvatura (β₃, λ₂), permitindo capturar humps adicionais na estrutura a termo.",
  },
};

export default function MethodEquation({
  method,
  smoothingFactor,
}: MethodEquationProps) {
  const info = METHOD_INFO[method];
  const label = METHOD_LABELS[method];

  return (
    <details className="glass-card rounded-xl">
      <summary className="px-4 py-3 cursor-pointer text-on-surface text-sm font-medium hover:text-primary transition-colors">
        📐 Equação do Método
      </summary>
      <div className="px-4 pb-4 space-y-3">
        <div className="text-primary text-sm font-semibold">{label}</div>
        <pre className="bg-surface-container/50 rounded-lg p-3 text-on-surface text-sm font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed">
          {info.formula}
        </pre>
        <p className="text-on-surface-variant text-sm leading-relaxed">{info.description}</p>
        {method === "smoothing-spline" && smoothingFactor !== undefined && (
          <p className="text-on-surface-variant text-xs">
            Parâmetro de suavização atual:{" "}
            <span className="text-[#2E8B57] font-mono">{smoothingFactor}</span>
          </p>
        )}
      </div>
    </details>
  );
}
