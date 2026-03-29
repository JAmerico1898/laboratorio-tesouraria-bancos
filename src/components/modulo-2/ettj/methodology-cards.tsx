export default function MethodologyCards() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Methodology Block */}
      <div className="p-8 glass-card rounded-3xl border border-outline-variant/15">
        <h3 className="text-2xl font-bold text-primary mb-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-[#2E8B57]">
            functions
          </span>
          Metodologia
        </h3>
        <div className="space-y-4 text-on-surface-variant text-sm leading-relaxed">
          <p>
            A extração da ETTJ baseia-se na interpolação de pontos de liquidez
            dos contratos futuros de DI1.
          </p>
          <div className="p-4 bg-surface-container-lowest rounded-xl font-mono text-primary text-xs">
            PU = 100.000 / (1 + i)^(DU/252)
          </div>
          <ul className="space-y-2 mt-4">
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[#2E8B57] text-lg">
                check_circle
              </span>
              <span>Capitalização Composta Diária</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[#2E8B57] text-lg">
                check_circle
              </span>
              <span>Ajuste de Dias Úteis (Calendário B3)</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Market Status Module */}
      <div className="p-8 bg-surface-container rounded-3xl border border-outline-variant/10 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Status do Mercado
            </span>
            <h4 className="text-xl font-bold text-on-surface mt-1">
              Live B3 Feed
            </h4>
          </div>
          <span className="px-2 py-1 rounded bg-[#2E8B57]/10 text-[#2E8B57] text-[10px] font-bold">
            CONECTADO
          </span>
        </div>
        <div className="mt-8">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-primary tracking-tighter">
              11.25%
            </span>
            <span className="text-[#2E8B57] text-xs font-bold">+0.02%</span>
          </div>
          <span className="text-[10px] text-on-surface-variant">
            TAXA SELIC ATUAL (META)
          </span>
        </div>
      </div>

      {/* Interpolation Engine Module */}
      <div className="p-8 bg-surface-container rounded-3xl border border-outline-variant/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">
              insights
            </span>
          </div>
          <h4 className="font-bold text-on-surface">Motor de Interpolação</h4>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-on-surface-variant">Método Selecionado</span>
            <span className="text-primary font-bold">
              Cubic Spline (Flat Forward)
            </span>
          </div>
          <div className="h-1 bg-surface-container-lowest rounded-full overflow-hidden">
            <div className="h-full bg-[#2E8B57] w-3/4" />
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-on-surface-variant">
              Confiança do Modelo
            </span>
            <span className="text-[#2E8B57] font-bold">99.8%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
