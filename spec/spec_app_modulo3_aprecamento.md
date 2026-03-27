# Guia para Criação do Aplicativo Streamlit — Módulo 3: Apreçamento das Operações de Tesouraria

```xml
<app>
  <metadata>
    <titulo>Laboratório de Operações de Tesouraria — Módulo 3</titulo>
    <subtitulo>Apreçamento das Operações de Tesouraria</subtitulo>
    <curso>MBA em Bancos e Instituições Financeiras — COPPEAD/UFRJ</curso>
    <publico_alvo>Média e alta gerência de bancos e instituições financeiras</publico_alvo>
    <objetivo_geral>
      Oferecer um ambiente interativo de precificação dos principais
      instrumentos de renda fixa do mercado brasileiro — títulos públicos,
      títulos de IFs e crédito privado corporativo — permitindo que o aluno
      calcule PUs, compare instrumentos e desenvolva raciocínio de valor
      relativo (relative value). O app complementa as aulas presenciais
      do Módulo 3, acelerando cálculos para que o tempo de sala seja
      dedicado à análise e à decisão gerencial.
    </objetivo_geral>
    <prerequisito>
      Módulos 1 e 2 do app. A curva de juros (ETTJ) construída no Módulo 2
      é insumo direto para os precificadores deste módulo.
    </prerequisito>
    <principios_de_design>
      <principio id="1">
        Precificador como ferramenta de decisão: cada simulador deve
        responder não apenas "qual o PU?" mas "o que esse PU significa
        para minha carteira? O spread compensa o risco?"
      </principio>
      <principio id="2">
        Fórmulas ANBIMA: todas as precificações seguem rigorosamente
        as convenções oficiais da ANBIMA (truncamento, contagem de dias,
        projeção de índices). Divergências com convenções simplificadas
        devem ser sinalizadas ao aluno.
      </principio>
      <principio id="3">
        Valor relativo como fio condutor: o app deve facilitar a
        comparação entre instrumentos em todos os módulos, culminando
        no Exercício Integrador que coloca lado a lado títulos públicos,
        bancários e corporativos.
      </principio>
      <principio id="4">
        Consistência visual e funcional com os Módulos 1 e 2.
      </principio>
    </principios_de_design>
  </metadata>

  <!-- ================================================================== -->
  <!--  ARQUITETURA GERAL                                                  -->
  <!-- ================================================================== -->

  <arquitetura>
    <navegacao>
      <tipo>sidebar com radio buttons ou selectbox</tipo>
      <paginas>
        <pagina id="home">🏛️ Visão Geral do Módulo 3</pagina>
        <pagina id="mod1">🇧🇷 Títulos Públicos Federais</pagina>
        <pagina id="mod2">🏦 Títulos Privados de IFs</pagina>
        <pagina id="mod3">🏢 Títulos Privados de Empresas</pagina>
        <pagina id="integrador">⚖️ Exercício Integrador — Relative Value</pagina>
      </paginas>
    </navegacao>

    <elementos_globais>
      <paleta_de_cores>
        <cor nome="primaria" hex="#1B3A5C" uso="títulos, cabeçalhos"/>
        <cor nome="secundaria" hex="#2E75B6" uso="títulos públicos, curva nominal"/>
        <cor nome="accent" hex="#C55A11" uso="títulos privados corporativos"/>
        <cor nome="fundo_claro" hex="#EAF3F8" uso="caixas explicativas"/>
        <cor nome="positivo" hex="#2E8B57" uso="spread favorável, ganho"/>
        <cor nome="negativo" hex="#CC3333" uso="spread insuficiente, perda"/>
        <cor nome="bancario" hex="#0E7C7B" uso="títulos de IFs, cor dedicada"/>
        <cor nome="inflacao" hex="#8B5CF6" uso="NTN-B, IPCA, indexados à inflação"/>
      </paleta_de_cores>
      <convencao_de_interface>
        Mesmo padrão dos Módulos 1 e 2:
        - st.expander para conceitos e fórmulas ("📘 Conceito")
        - st.metric para KPIs em st.columns
        - st.info / st.warning / st.success para notas pedagógicas
        - Gráficos Plotly, template "plotly_white"
        - Formatação brasileira (R$ 1.234,56 / 13,75%)
        - Todos os precificadores exibem o cálculo passo a passo
          em expander "📐 Cálculo detalhado"
      </convencao_de_interface>
    </elementos_globais>
  </arquitetura>

  <!-- ================================================================== -->
  <!--  PÁGINA HOME                                                        -->
  <!-- ================================================================== -->

  <pagina id="home">
    <titulo>Visão Geral do Módulo 3 — Apreçamento das Operações de Tesouraria</titulo>
    <conteudo>
      <elemento tipo="header_banner">
        Título com identidade visual do curso.
      </elemento>
      <elemento tipo="texto_introdutorio">
        "Neste módulo, você vai precificar os instrumentos que uma
        tesouraria bancária negocia no dia a dia: títulos públicos
        federais, títulos de instituições financeiras e crédito privado
        corporativo. Mais do que calcular PUs, o objetivo é desenvolver
        o raciocínio de valor relativo — comparar instrumentos diferentes
        e decidir onde está a melhor relação risco-retorno."
      </elemento>
      <elemento tipo="mapa_do_modulo">
        Cards com progressão: Títulos Públicos → Títulos de IFs →
        Crédito Privado → Relative Value.
        Cada card com ícone, título e pergunta gerencial.
      </elemento>
      <elemento tipo="conexao_modulos_anteriores">
        Caixa "🔗 Este módulo usa" indicando:
        - Curva de juros nominal (Módulo 2) → desconto de prefixados
        - Curva de juros real (Módulo 2) → desconto de indexados
        - Conceitos de spread e risco (Módulo 1) → avaliação de crédito
      </elemento>
    </conteudo>
  </pagina>

  <!-- ================================================================== -->
  <!--  MÓDULO 1 — TÍTULOS PÚBLICOS FEDERAIS                              -->
  <!-- ================================================================== -->

  <pagina id="mod1">
    <titulo>Títulos Públicos Federais</titulo>
    <objetivo_aprendizagem>
      Calcular os principais títulos públicos federais e avaliar o impacto
      dos títulos públicos federais nas estratégias de investimento.
    </objetivo_aprendizagem>
    <pergunta_gerencial>
      "Qual título público oferece a melhor relação risco-retorno dado
      o cenário atual? LTN, NTN-F, NTN-B ou LFT?"
    </pergunta_gerencial>

    <abas>
      <!-- ============================================================ -->
      <!--  ABA 1.1 — LTN (PREFIXADO SEM CUPOM)                         -->
      <!-- ============================================================ -->
      <aba id="1.1" titulo="LTN — Prefixado sem Cupom">
        <objetivo>
          Precificar a LTN e visualizar a sensibilidade do PU a variações
          de taxa e prazo.
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander "📘 Conceito e Fórmula ANBIMA":
              - LTN: título prefixado zero cupom, valor de face R$ 1.000,00.
              - PU = 1000 / (1 + taxa)^(DU/252)
              - Convenção: DU/252, capitalização composta.
              - Truncamento ANBIMA: fator de desconto truncado na 6ª casa.
              Diagrama de fluxo de caixa simples: um único pagamento no
              vencimento.
            </descricao>
          </secao>

          <secao tipo="simulador">
            <titulo>Precificador de LTN</titulo>
            <inputs>
              <input tipo="number_input" label="Taxa de mercado (% a.a.)" default="12.50" step="0.05"/>
              <input tipo="number_input" label="Dias úteis até o vencimento" default="252" step="1"/>
            </inputs>
            <outputs>
              <output tipo="metrics_row">
                - PU (R$)
                - Duration (anos)
                - Duration modificada
                - Sensibilidade a +100 bps (R$ por R$ 1.000 de face)
              </o>
              <output tipo="calculo_detalhado">
                Expander "📐 Cálculo passo a passo":
                1. Fator de desconto: (1 + 0,1250)^(252/252) = X
                2. Truncamento 6 casas: X' = trunc(X, 6)
                3. PU = 1000 / X' = R$ Y
                4. PU sem truncamento = R$ Z (diferença: R$ W)
              </o>
              <output tipo="grafico_taxa_vs_pu">
                Gráfico Plotly: PU (Y) vs. Taxa (X, range 5%–25%).
                Ponto atual destacado. Curva convexa descendente.
                Segundo trace (opcional): PU para DU diferente
                (ex.: DU/2) para comparar sensibilidade por prazo.
              </o>
            </outputs>
          </secao>
        </layout>
      </aba>

      <!-- ============================================================ -->
      <!--  ABA 1.2 — NTN-F (PREFIXADO COM CUPOM)                       -->
      <!-- ============================================================ -->
      <aba id="1.2" titulo="NTN-F — Prefixado com Cupom">
        <objetivo>
          Precificar a NTN-F com fluxo completo de cupons semestrais,
          visualizar o fluxo de caixa e comparar com LTN de mesmo
          vencimento.
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander com:
              - NTN-F: prefixado com cupons semestrais de 10% a.a.
                (4,8809% ao semestre, gerando R$ 48,81 por semestre
                sobre face de R$ 1.000).
              - Fórmula ANBIMA:
                PU = Σ [cupom_k / (1+taxa)^(DU_k/252)] + 1000 / (1+taxa)^(DU_n/252)
              - Convenção de datas de cupom: 1° dia útil de janeiro e julho.
              - Truncamento em 6 casas decimais do fator de desconto
                de cada fluxo.
              Diagrama de fluxo de caixa: série de cupons + principal.
            </descricao>
          </secao>

          <secao tipo="simulador">
            <titulo>Precificador de NTN-F</titulo>
            <inputs>
              <input tipo="number_input" label="Taxa de mercado (% a.a.)" default="12.80" step="0.05"/>
              <input tipo="date_input" label="Data de liquidação" default="hoje"/>
              <input tipo="selectbox" label="Vencimento"
                     opcoes="[Gerar a partir dos vencimentos ativos de NTN-F,
                              ou permitir entrada manual de data]"/>
            </inputs>
            <outputs>
              <output tipo="metrics_row">
                - PU (R$)
                - Duration Macaulay (anos)
                - Duration modificada
                - Cupom accrued (juros acumulados desde último cupom)
                - PU limpo (PU − accrued)
              </o>
              <output tipo="tabela_fluxos">
                Tabela detalhada com cada fluxo:
                | # | Data do fluxo | DU | Fluxo (R$) | Fator desconto | VP do fluxo (R$) | Peso duration |
                Última linha: total (PU) e duration Macaulay.
                Formatar com cores alternadas para facilitar leitura.
              </o>
              <output tipo="grafico_fluxo_caixa">
                Gráfico de barras verticais: cada barra é um fluxo
                (cupom ou principal) posicionado na data. Barras de
                cupom em azul claro, barra do principal em azul escuro.
                Eixo X: datas. Eixo Y: valor em R$.
                Sobrepor pontos com o VP de cada fluxo (descontado)
                para visualizar o "encolhimento" dos fluxos distantes.
              </o>
              <output tipo="comparacao_ltn">
                Caixa "🔄 Comparação com LTN de mesmo vencimento":
                - PU da LTN (mesma taxa, mesmo vencimento)
                - Duration da LTN vs. Duration da NTN-F
                - Sensibilidade a +100 bps: LTN vs. NTN-F
                "A NTN-F tem duration menor que a LTN porque os cupons
                antecipam fluxos. Para uma mesma variação de taxa, a
                NTN-F perde/ganha menos."
              </o>
            </outputs>
          </secao>
        </layout>
      </aba>

      <!-- ============================================================ -->
      <!--  ABA 1.3 — LFT (PÓS-FIXADO SELIC)                           -->
      <!-- ============================================================ -->
      <aba id="1.3" titulo="LFT — Pós-fixado (SELIC)">
        <objetivo>
          Precificar a LFT, entender o conceito de VNA e ágio/deságio,
          e visualizar por que a LFT tem risco de mercado quase zero.
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander com:
              - LFT: título pós-fixado indexado à SELIC over.
              - VNA (Valor Nominal Atualizado): R$ 1.000 da data-base
                corrigido diariamente pela SELIC over acumulada.
                VNA_t = 1000 × Π(1 + SELIC_over_i)^(1/252)
              - Cotação de mercado: PU = VNA × cotação, onde
                cotação = 1 / (1 + spread)^(DU/252).
                Spread tipicamente em poucos bps (ex.: ±5 bps).
              - Duration efetiva: próxima de zero (o título "reprecia"
                diariamente). O risco de mercado é apenas o spread.
            </descricao>
          </secao>

          <secao tipo="simulador">
            <titulo>Precificador de LFT</titulo>
            <inputs>
              <input tipo="number_input" label="VNA atual (R$)" default="15234.56" step="0.01"
                     help="Valor nominal atualizado divulgado pelo Tesouro/ANBIMA"/>
              <input tipo="number_input" label="Spread (ágio/deságio) — bps"
                     default="0" step="1" min="-50" max="50"
                     help="Positivo = deságio (PU abaixo do VNA). Negativo = ágio."/>
              <input tipo="number_input" label="DU até o vencimento" default="504" step="1"/>
            </inputs>
            <outputs>
              <output tipo="metrics_row">
                - PU (R$)
                - Cotação (%)
                - Ágio/Deságio vs. VNA (R$)
                - Duration efetiva (≈ 0 anos)
              </o>
              <output tipo="grafico_sensibilidade_spread">
                Gráfico: PU (Y) vs. Spread em bps (X, range −30 a +30).
                Linha quase horizontal — demonstra visualmente que a
                LFT é muito pouco sensível a variações de spread.
                Comparar com a sensibilidade da LTN de mesmo prazo
                (segunda linha, muito mais inclinada).
              </o>
              <output tipo="nota_pedagogica">
                "A LFT é o 'caixa remunerado' da tesouraria. Seu risco
                de mercado é mínimo porque o VNA se ajusta diariamente
                à SELIC. O único risco é o spread (ágio/deságio), que
                raramente ultrapassa 10-20 bps. Por isso, a LFT é o
                lastro preferencial para operações compromissadas."
              </o>
            </outputs>
          </secao>
        </layout>
      </aba>

      <!-- ============================================================ -->
      <!--  ABA 1.4 — NTN-B (IPCA+)                                     -->
      <!-- ============================================================ -->
      <aba id="1.4" titulo="NTN-B — Indexado ao IPCA">
        <objetivo>
          Precificar a NTN-B com VNA projetado, cupons semestrais e
          taxa real, e entender o paradoxo de risco da NTN-B.
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander com:
              - NTN-B: título indexado ao IPCA + taxa real fixa.
              - VNA: R$ 1.000 da data-base (15/07/2000) corrigido pelo
                IPCA acumulado. Entre aniversários, usa projeção do IPCA.
              - Cupons semestrais: 6% a.a. (2,9563% ao semestre) sobre VNA.
              - PU = VNA_projetado × Σ [cupom_k / (1+taxa_real)^(DU_k/252)]
                + VNA_projetado × 1 / (1+taxa_real)^(DU_n/252)
              - O paradoxo: se o juro real sobe (ex.: de 5% para 6%),
                o PU CAI mesmo que a inflação esteja subindo. O título
                protege contra inflação no carregamento, mas está
                exposto a risco de taxa real na marcação a mercado.
            </descricao>
          </secao>

          <secao tipo="simulador">
            <titulo>Precificador de NTN-B</titulo>
            <inputs>
              <input tipo="number_input" label="Taxa real de mercado — IPCA+ (% a.a.)"
                     default="6.20" step="0.05"/>
              <input tipo="number_input" label="VNA projetado (R$)" default="4352.78" step="0.01"
                     help="VNA divulgado pela ANBIMA com projeção de IPCA"/>
              <input tipo="date_input" label="Data de liquidação" default="hoje"/>
              <input tipo="selectbox" label="Vencimento"
                     opcoes="[NTN-B 2026, NTN-B 2028, NTN-B 2030, NTN-B 2035,
                              NTN-B 2040, NTN-B 2045, NTN-B 2050, Manual]"/>
            </inputs>
            <outputs>
              <output tipo="metrics_row">
                - PU (R$)
                - Duration Macaulay (anos)
                - Duration modificada
                - Sensibilidade a +100 bps de taxa real (R$)
                - Carry mensal estimado (R$) — IPCA projetado + taxa real
              </o>
              <output tipo="tabela_fluxos">
                Mesma estrutura da NTN-F: tabela com cada fluxo, DU,
                fator de desconto, VP e peso duration. Fluxos em
                R$ nominais (VNA × cupom%).
              </o>
              <output tipo="grafico_fluxo_caixa">
                Barras de cupom em roxo (#8B5CF6), principal em roxo escuro.
                Sobrepor VP descontado como na NTN-F.
              </o>
              <output tipo="simulador_paradoxo">
                Seção destacada "⚠️ O Paradoxo da NTN-B":
                Dois sliders:
                - Variação da taxa real (bps): −200 a +200
                - IPCA realizado no período (% a.a.): 2% a 10%
                Exibir:
                - Resultado MtM (variação do PU pela taxa real)
                - Resultado de carry (IPCA acumulado × taxa real)
                - Resultado total = MtM + carry
                Demonstrar que mesmo com IPCA alto, se a taxa real
                subir, o resultado total pode ser negativo no curto prazo.
              </o>
            </outputs>
          </secao>
        </layout>
      </aba>

      <!-- ============================================================ -->
      <!--  ABA 1.5 — COMPARATIVO DE TÍTULOS PÚBLICOS                   -->
      <!-- ============================================================ -->
      <aba id="1.5" titulo="Comparativo de Títulos Públicos">
        <objetivo>
          Comparar os quatro títulos públicos lado a lado sob diferentes
          cenários, desenvolvendo a análise comparativa de risco-retorno.
        </objetivo>

        <layout>
          <secao tipo="simulador">
            <titulo>Painel Comparativo</titulo>
            <descricao>
              Dashboard que reúne os quatro títulos e permite comparação
              direta, respondendo: "Dado o cenário, qual título escolher?"
            </descricao>
            <inputs>
              <grupo label="Dados de mercado (pré-carregados ou manuais)">
                <input tipo="selectbox" label="Fonte dos dados"
                       opcoes="[Dados pré-carregados (data de referência),
                                Inserir manualmente]"/>
                <input tipo="condicional" condicao="pré-carregados">
                  <input tipo="selectbox" label="Data" opcoes="[datas disponíveis]"/>
                </input>
                <input tipo="condicional" condicao="manual">
                  <input tipo="number_input" label="Taxa LTN 1A (% a.a.)" default="12.50"/>
                  <input tipo="number_input" label="Taxa NTN-F 2A (% a.a.)" default="12.80"/>
                  <input tipo="number_input" label="Spread LFT (bps)" default="2"/>
                  <input tipo="number_input" label="Taxa NTN-B 3A — IPCA+ (% a.a.)" default="6.20"/>
                  <input tipo="number_input" label="SELIC Meta atual (% a.a.)" default="13.75"/>
                  <input tipo="number_input" label="IPCA esperado 12M (% a.a.)" default="4.50"/>
                </input>
              </grupo>
              <grupo label="Cenário para simulação">
                <input tipo="selectbox" label="Cenário de taxa de juros (12 meses)"
                       opcoes="[Estável (SELIC mantida),
                                Corte moderado (−200 bps),
                                Corte agressivo (−400 bps),
                                Alta moderada (+200 bps),
                                Personalizado]"/>
                <input tipo="condicional" condicao="Personalizado">
                  <input tipo="slider" label="Variação da SELIC (bps)" min="-500" max="500" default="0"/>
                  <input tipo="slider" label="IPCA realizado (% a.a.)" min="2" max="12" default="4.5"/>
                </input>
              </grupo>
            </inputs>
            <outputs>
              <output tipo="tabela_comparativa">
                Tabela principal — o coração desta aba:
                | Título | Indexador | Taxa | PU | Duration | Carry 12M (R$) | MtM Cenário (R$) | Retorno Total (%) |
                | LTN    | Pré      | X%   | Y  | Z anos   | ...            | ...               | ...               |
                | NTN-F  | Pré+Cup  | X%   | Y  | Z anos   | ...            | ...               | ...               |
                | LFT    | SELIC    | +Xbps| Y  | ≈0       | ...            | ...               | ...               |
                | NTN-B  | IPCA+    | X%   | Y  | Z anos   | ...            | ...               | ...               |
                Colorir a coluna "Retorno Total" com gradiente: verde
                para o melhor, vermelho para o pior.
              </o>
              <output tipo="grafico_barras_retorno">
                Gráfico de barras horizontais: retorno total projetado
                de cada título no cenário selecionado. Barras verdes
                para retorno positivo, vermelhas para negativo.
                Ordenar da melhor para a pior performance.
              </o>
              <output tipo="grafico_sensibilidade_multipla">
                Gráfico de linhas: retorno total (Y) vs. variação da
                SELIC em bps (X, range −500 a +500) para cada título.
                4 linhas, uma por título, cada uma com sua cor.
                Permite visualizar: "A LTN ganha mais no cenário de
                corte, mas perde mais no cenário de alta. A LFT é
                quase indiferente. A NTN-B fica entre os dois."
              </o>
              <output tipo="interpretacao">
                Caixa de análise automática:
                "No cenário [selecionado], o título com melhor retorno
                projetado é [X] com [Y%], seguido de [Z]. A LFT
                oferece retorno de [W%] com risco mínimo — é a opção
                de menor risco. O trade-off entre [título A] e [título B]
                é de [N bps] de retorno adicional por [M anos] a mais
                de duration."
              </o>
            </outputs>
          </secao>
        </layout>
      </aba>
    </abas>
  </pagina>

  <!-- ================================================================== -->
  <!--  MÓDULO 2 — TÍTULOS PRIVADOS DE IFs                                -->
  <!-- ================================================================== -->

  <pagina id="mod2">
    <titulo>Títulos Privados de Instituições Financeiras</titulo>
    <objetivo_aprendizagem>
      Calcular o valor dos principais títulos privados de instituições
      financeiras brasileiras.
    </objetivo_aprendizagem>
    <pergunta_gerencial>
      "O CDB que estou comprando (ou emitindo) está a preço justo?
      O spread sobre o soberano compensa o risco de crédito da IF?"
    </pergunta_gerencial>

    <abas>
      <!-- ============================================================ -->
      <!--  ABA 2.1 — CDB PÓS-FIXADO (% CDI)                           -->
      <!-- ============================================================ -->
      <aba id="2.1" titulo="CDB Pós-fixado (% do CDI)">
        <objetivo>
          Precificar um CDB pós-fixado no mercado secundário, entendendo
          a marcação a mercado quando o percentual de CDI muda.
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander com:
              - CDB % CDI: o principal é remunerado por X% do CDI
                acumulado até o vencimento.
              - No mercado secundário: se o CDB foi emitido a 100% CDI
                mas o mercado agora exige 105% CDI para esse emissor,
                o CDB vale menos (deságio).
              - Precificação MtM:
                PU_mtm = VF_esperado / (1 + taxa_mercado)^(DU/252)
                onde taxa_mercado = CDI_forward × (%CDI_mercado/100)
                Simplificação usual: descontar pelo fator CDI futuro
                ajustado pelo percentual de mercado.
              - Fórmula prática para spread:
                Se emissão a p% CDI e mercado a q% CDI:
                Δ = valor_face × [Fator_CDI^(p/100) / Fator_CDI^(q/100) − 1]
            </descricao>
          </secao>

          <secao tipo="simulador">
            <titulo>Precificador de CDB % CDI</titulo>
            <inputs>
              <grupo label="Dados da emissão">
                <input tipo="number_input" label="Valor de face (R$)" default="1000000" step="100000"/>
                <input tipo="number_input" label="% CDI da emissão" default="100" step="1"/>
                <input tipo="date_input" label="Data de emissão"/>
                <input tipo="date_input" label="Data de vencimento"/>
              </grupo>
              <grupo label="Condições de mercado">
                <input tipo="number_input" label="% CDI de mercado (para esse emissor/prazo)"
                       default="105" step="1"/>
                <input tipo="date_input" label="Data de avaliação (MtM)" default="hoje"/>
              </grupo>
            </inputs>
            <outputs>
              <output tipo="metrics_row">
                - PU na curva (sem MtM) — valor accrual (R$)
                - PU a mercado (MtM) — valor justo (R$)
                - Diferença curva vs. mercado (R$)
                - Spread emissão vs. mercado (pp do CDI)
              </o>
              <output tipo="calculo_detalhado">
                Expander com o passo a passo:
                1. CDI acumulado da emissão até hoje
                2. Valor na curva = face × fator_CDI^(p_emissão/100)
                3. Fator CDI futuro esperado (hoje até vencimento)
                4. Valor futuro esperado = valor_curva × fator_futuro^(p_emissão/100)
                5. Desconto a mercado = VF_esperado / fator_futuro^(p_mercado/100)
                6. PU MtM = resultado
              </o>
              <output tipo="grafico_sensibilidade">
                Gráfico: PU MtM (Y) vs. % CDI de mercado (X, range 80% a 130%).
                Ponto da emissão e ponto do mercado atual destacados.
                Evidencia quanto o PU muda quando o spread de crédito
                se abre ou comprime.
              </o>
            </outputs>
          </secao>
        </layout>
      </aba>

      <!-- ============================================================ -->
      <!--  ABA 2.2 — CDB PREFIXADO                                     -->
      <!-- ============================================================ -->
      <aba id="2.2" titulo="CDB Prefixado">
        <objetivo>
          Precificar CDB prefixado como LTN + spread de crédito.
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander:
              - CDB pré: estrutura idêntica à LTN (zero cupom) com
                adição de spread de crédito sobre a curva soberana.
              - PU = Face / (1 + taxa_soberana + spread)^(DU/252)
              - Alternativamente: taxa_CDB = taxa_LTN + spread_crédito.
              - O spread reflete: rating da IF, prazo, condições de
                mercado, relação com o investidor.
            </descricao>
          </secao>

          <secao tipo="simulador">
            <titulo>Precificador de CDB Prefixado</titulo>
            <inputs>
              <input tipo="number_input" label="Taxa LTN de referência (% a.a.)" default="12.50" step="0.05"
                     help="Taxa soberana para o mesmo prazo"/>
              <input tipo="number_input" label="Spread de crédito (bps)" default="50" step="5"/>
              <input tipo="number_input" label="DU até o vencimento" default="252" step="1"/>
              <input tipo="number_input" label="Valor de face (R$)" default="1000000" step="100000"/>
            </inputs>
            <outputs>
              <output tipo="metrics_row">
                - Taxa do CDB (soberana + spread) — % a.a.
                - PU do CDB (R$)
                - PU da LTN equivalente (R$)
                - Diferença de PU (R$) — "preço do risco de crédito"
              </o>
              <output tipo="grafico_spread">
                Gráfico de barras: PU da LTN vs. PU do CDB, com a
                diferença destacada como "custo do crédito" em laranja.
              </o>
              <output tipo="sensibilidade_spread">
                Gráfico: PU do CDB (Y) vs. Spread (X, 0 a 300 bps).
                Linha horizontal tracejada = PU da LTN (spread = 0).
                "Para cada 10 bps de spread adicional, o PU cai R$ X."
              </o>
            </outputs>
          </secao>
        </layout>
      </aba>

      <!-- ============================================================ -->
      <!--  ABA 2.3 — LCI/LCA E EQUIVALÊNCIA FISCAL                     -->
      <!-- ============================================================ -->
      <aba id="2.3" titulo="LCI/LCA — Equivalência Fiscal">
        <objetivo>
          Calcular a taxa equivalente bruta de LCI/LCA para comparação
          justa com CDB (para pessoa jurídica e para pessoa física).
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander:
              - LCI e LCA: isentos de IR para pessoa física. Para PJ
                (inclusive tesouraria bancária), tributação normal.
              - Precificação: mesma lógica do CDB (% CDI ou taxa fixa).
              - Comparação justa: converter a taxa da LCI/LCA em
                taxa bruta equivalente:
                taxa_bruta = taxa_LCI / (1 − alíquota_IR)
                Tabela regressiva de IR: 22,5% (até 180d), 20% (181-360d),
                17,5% (361-720d), 15% (acima 720d).
              - Para PF: a LCI/LCA já é líquida (isenta). Para PJ:
                a taxa é bruta (não há isenção).
            </descricao>
          </secao>

          <secao tipo="simulador">
            <titulo>Calculadora de Equivalência Fiscal</titulo>
            <inputs>
              <input tipo="number_input" label="Taxa da LCI/LCA (% CDI ou % a.a.)" default="93" step="1"/>
              <input tipo="selectbox" label="Tipo de taxa"
                     opcoes="[% do CDI, % a.a. (prefixada)]"/>
              <input tipo="slider" label="Prazo (dias corridos)" min="30" max="1080" default="365" step="30"/>
              <input tipo="selectbox" label="Comparar para"
                     opcoes="[Pessoa Física (isento de IR),
                              Pessoa Jurídica (tributação normal)]"/>
            </inputs>
            <outputs>
              <output tipo="metrics_row">
                - Alíquota de IR aplicável (%)
                - Taxa bruta equivalente (CDB comparável)
                - Taxa líquida do CDB equivalente
                - Vantagem/desvantagem da LCI vs. CDB (bps)
              </o>
              <output tipo="tabela_comparativa">
                Tabela por faixa de prazo:
                | Prazo | IR | Taxa LCI | Taxa bruta equiv. | CDB 100% CDI líquido | Diferença |
                Para visualizar em quais prazos a LCI é mais vantajosa.
              </o>
              <output tipo="nota_pedagogica">
                "Para a tesouraria (PJ), a LCI/LCA não tem benefício
                fiscal. A comparação deve ser feita em base bruta.
                Uma LCI a 93% CDI equivale, para PJ, a um CDB a
                93% CDI — sem vantagem. A vantagem é exclusiva do
                investidor PF, o que comprime a taxa de emissão e
                reduz o custo de captação do banco emissor."
              </o>
            </outputs>
          </secao>
        </layout>
      </aba>

      <!-- ============================================================ -->
      <!--  ABA 2.4 — LF E DPGE                                         -->
      <!-- ============================================================ -->
      <aba id="2.4" titulo="LF e DPGE">
        <objetivo>
          Precificar Letras Financeiras (inclusive subordinadas) e
          entender o impacto da subordinação e do prazo no spread.
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander:
              - LF: prazo mínimo 2 anos, pode ser sênior ou subordinada
                (Tier 2 — compõe capital regulatório).
              - LF subordinada: paga spread maior porque, em liquidação,
                o credor subordinado só recebe após os seniores.
              - Precificação: CDI + spread (pós) ou taxa fixa (pré).
                Se com cupom, fluxo análogo a NTN-F/debênture.
              - DPGE: emitido por bancos menores, garantia FGC até
                certo limite. Spread reflete risco residual.
            </descricao>
          </secao>

          <secao tipo="simulador">
            <titulo>Precificador de LF</titulo>
            <inputs>
              <input tipo="selectbox" label="Tipo de LF"
                     opcoes="[Sênior (CDI + spread), Subordinada Tier 2 (CDI + spread),
                              Prefixada com cupom]"/>
              <input tipo="number_input" label="Spread sobre CDI (bps)" default="80" step="5"
                     help="Subordinada tipicamente 50-150 bps acima da sênior"/>
              <input tipo="number_input" label="Prazo (anos)" default="3" step="0.5" min="2"/>
              <input tipo="number_input" label="Volume (R$)" default="5000000" step="1000000"/>
              <input tipo="selectbox" label="Periodicidade do cupom (se aplicável)"
                     opcoes="[Bullet (sem cupom intermediário), Semestral, Anual]"/>
            </inputs>
            <outputs>
              <output tipo="metrics_row">
                - PU (R$)
                - Taxa efetiva (CDI + spread equivalente % a.a.)
                - Duration (anos)
              </o>
              <output tipo="comparacao_subordinacao">
                Se subordinada selecionada, exibir comparação:
                "A LF subordinada paga [X bps] a mais que a sênior.
                Esse prêmio compensa o risco de subordinação?
                Historicamente, defaults de LFs de bancos de grande
                porte são raros, mas em eventos de resolução (RAET,
                liquidação), o subordinado é o primeiro a absorver perdas."
              </o>
            </outputs>
          </secao>
        </layout>
      </aba>
    </abas>
  </pagina>

  <!-- ================================================================== -->
  <!--  MÓDULO 3 — TÍTULOS PRIVADOS DE EMPRESAS                           -->
  <!-- ================================================================== -->

  <pagina id="mod3">
    <titulo>Títulos Privados de Empresas</titulo>
    <objetivo_aprendizagem>
      Calcular o valor de títulos privados de empresas e conhecer o
      mercado de dívida privada no Brasil.
    </objetivo_aprendizagem>
    <pergunta_gerencial>
      "Essa debênture está pagando o suficiente pelo risco de crédito
      e pela iliquidez? Comparada com o CDB de um banco grande e com
      a NTN-B, ela é atrativa?"
    </pergunta_gerencial>

    <abas>
      <!-- ============================================================ -->
      <!--  ABA 3.1 — DEBÊNTURE CDI + SPREAD                            -->
      <!-- ============================================================ -->
      <aba id="3.1" titulo="Debênture CDI + Spread">
        <objetivo>
          Precificar debênture indexada ao CDI com spread, entendendo
          a estrutura de fluxo de caixa e o efeito da variação do spread.
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander:
              - Debênture CDI + spread: remuneração = CDI acumulado + spread
                fixo (ex.: CDI + 1,80% a.a.). Juros tipicamente semestrais
                ou anuais, principal no vencimento (bullet).
              - Precificação no secundário: descontar cada fluxo pela
                curva de CDI ajustada pelo spread de mercado para aquele
                emissor. Se spread de emissão ≠ spread de mercado,
                o título negocia acima ou abaixo do par.
              - Fórmula simplificada (bullet, cupom anual):
                PU = Σ [cupom_k / Π(1 + CDI_fwd_j + spread_mkt)] + Face / [...]
              - Dados de spread: ANBIMA publica os IDA (Índices de
                Debêntures ANBIMA) com spreads médios por rating.
            </descricao>
          </secao>

          <secao tipo="simulador">
            <titulo>Precificador de Debênture CDI + Spread</titulo>
            <inputs>
              <grupo label="Características da debênture">
                <input tipo="number_input" label="Valor de face (R$)" default="1000" step="100"/>
                <input tipo="number_input" label="Spread de emissão (% a.a.)" default="1.80" step="0.05"/>
                <input tipo="selectbox" label="Periodicidade dos juros"
                       opcoes="[Semestral, Anual]"/>
                <input tipo="number_input" label="Prazo até o vencimento (anos)"
                       default="3" step="0.5"/>
              </grupo>
              <grupo label="Condições de mercado">
                <input tipo="number_input" label="Spread de mercado (% a.a.)" default="2.10" step="0.05"
                       help="Spread que o mercado exige hoje para esse risco"/>
                <input tipo="selectbox" label="Rating"
                       opcoes="[AAA, AA, A, BBB, BB]"
                       help="Para referência — não altera o cálculo diretamente"/>
              </grupo>
            </inputs>
            <outputs>
              <output tipo="metrics_row">
                - PU (R$)
                - PU como % do par (acima/abaixo de 100%)
                - Spread de emissão vs. mercado (bps)
                - Duration (anos)
              </o>
              <output tipo="tabela_fluxos">
                Tabela com cada fluxo projetado:
                | # | Período | Fluxo bruto (R$) | Fator desconto | VP (R$) |
                Cupons = CDI forward projetado + spread de emissão.
              </o>
              <output tipo="grafico_spread_impact">
                Gráfico: PU como % do par (Y) vs. spread de mercado
                (X, range do spread de emissão ± 300 bps).
                Linha em 100% = par. Acima do par quando spread de
                mercado < spread de emissão (título valoriza).
                Ponto atual destacado.
              </o>
            </outputs>
          </secao>
        </layout>
      </aba>

      <!-- ============================================================ -->
      <!--  ABA 3.2 — DEBÊNTURE IPCA + SPREAD                           -->
      <!-- ============================================================ -->
      <aba id="3.2" titulo="Debênture IPCA + Spread">
        <objetivo>
          Precificar debênture indexada ao IPCA, comparando com a NTN-B
          de referência para isolar o spread de crédito puro.
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander:
              - Estrutura análoga à NTN-B: VNA atualizado pelo IPCA,
                taxa real = IPCA + spread_real.
              - Comparação natural: debênture IPCA+ paga NTN-B + spread.
                O spread reflete crédito + liquidez.
              - Debêntures incentivadas (Lei 12.431): isentas de IR para
                PF e estrangeiros. Emissores: tipicamente infraestrutura.
                Para PJ: tributação normal.
            </descricao>
          </secao>

          <secao tipo="simulador">
            <titulo>Precificador de Debênture IPCA+</titulo>
            <inputs>
              <input tipo="number_input" label="Taxa real da debênture — IPCA+ (% a.a.)"
                     default="7.00" step="0.05"/>
              <input tipo="number_input" label="VNA projetado (R$)" default="4352.78" step="0.01"/>
              <input tipo="number_input" label="Prazo até vencimento (anos)" default="5" step="0.5"/>
              <input tipo="selectbox" label="Cupom" opcoes="[Semestral (padrão), Anual]"/>
              <input tipo="number_input" label="Taxa NTN-B de referência — IPCA+ (% a.a.)"
                     default="6.20" step="0.05"
                     help="Para cálculo do spread sobre o soberano"/>
            </inputs>
            <outputs>
              <output tipo="metrics_row">
                - PU da debênture (R$)
                - PU da NTN-B equivalente (R$)
                - Spread sobre NTN-B (bps)
                - Duration (anos)
              </o>
              <output tipo="grafico_decomposicao_taxa">
                Gráfico waterfall horizontal:
                Taxa real livre de risco (NTN-B) → + spread de crédito
                → + spread de liquidez → = taxa da debênture.
                Permite visualizar "de onde vem" cada pedaço da taxa.
              </o>
              <output tipo="nota_pedagogica">
                "Uma debênture IPCA+ 7,00% vs. NTN-B 6,20% oferece
                80 bps de spread. Esse spread deve remunerar: (1) o
                risco de crédito do emissor, (2) a menor liquidez
                no mercado secundário, e (3) eventuais riscos
                estruturais da emissão. Cabe ao gestor avaliar se
                80 bps são suficientes."
              </o>
            </outputs>
          </secao>
        </layout>
      </aba>

      <!-- ============================================================ -->
      <!--  ABA 3.3 — CRI/CRA E NOTAS PROMISSÓRIAS                      -->
      <!-- ============================================================ -->
      <aba id="3.3" titulo="CRI, CRA e Notas Promissórias">
        <objetivo>
          Precificar CRI/CRA e notas promissórias, destacando as
          particularidades em relação às debêntures.
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander:
              - CRI e CRA: títulos de securitização. Precificação segue
                mesma lógica de debêntures (CDI+ ou IPCA+), mas com
                análise adicional de lastro, subordinação, fundo de
                reserva e risco de pré-pagamento.
              - Notas promissórias: curto prazo (até 360 dias). Zero
                cupom. PU = VF / (1 + taxa)^(DU/252). Taxa = CDI +
                spread ou taxa prefixada.
              - Para a tesouraria: instrumentos de carteira de investimento,
                não de negociação ativa. Foco na avaliação risco-retorno.
            </descricao>
          </secao>

          <secao tipo="simulador">
            <titulo>Precificador Genérico de Crédito Privado</titulo>
            <descricao>
              Simulador unificado que funciona para CRI, CRA e NP,
              permitindo selecionar o tipo de instrumento e suas
              características.
            </descricao>
            <inputs>
              <input tipo="selectbox" label="Instrumento"
                     opcoes="[CRI, CRA, Nota Promissória]"/>
              <input tipo="selectbox" label="Indexador"
                     opcoes="[CDI + spread, IPCA + spread, Prefixado]"/>
              <input tipo="number_input" label="Spread / taxa (% a.a.)" default="2.50" step="0.10"/>
              <input tipo="number_input" label="Prazo (anos)" default="2" step="0.5"/>
              <input tipo="selectbox" label="Estrutura de pagamento"
                     opcoes="[Bullet, Cupom semestral, Amortização semestral]"/>
              <input tipo="number_input" label="Volume (R$)" default="1000000" step="100000"/>
            </inputs>
            <outputs>
              <output tipo="metrics_row">
                - PU (R$)
                - Taxa efetiva (% a.a.)
                - Duration (anos)
                - Spread sobre soberano de referência (bps)
              </o>
              <output tipo="tabela_fluxos">Tabela de fluxos detalhada.</o>
            </outputs>
          </secao>
        </layout>
      </aba>
    </abas>
  </pagina>

  <!-- ================================================================== -->
  <!--  EXERCÍCIO INTEGRADOR — RELATIVE VALUE                             -->
  <!-- ================================================================== -->

  <pagina id="integrador">
    <titulo>Exercício Integrador — Relative Value</titulo>
    <objetivo>
      Comparar instrumentos de diferentes categorias (público, bancário,
      corporativo) numa análise integrada de valor relativo, simulando
      o processo decisório de alocação de uma tesouraria.
    </objetivo>
    <pergunta_gerencial>
      "Tenho R$ 50 milhões para alocar em renda fixa. Dado o cenário,
      qual a melhor combinação de instrumentos considerando retorno,
      risco e liquidez?"
    </pergunta_gerencial>

    <layout>
      <!-- ============================================================ -->
      <!--  SEÇÃO 1 — SELEÇÃO DE INSTRUMENTOS                           -->
      <!-- ============================================================ -->
      <secao tipo="selecao">
        <titulo>📋 Seleção de Instrumentos para Comparação</titulo>
        <descricao>
          O aluno seleciona 3 a 6 instrumentos de diferentes categorias
          para compor sua análise. Os dados podem ser pré-carregados
          ou inseridos manualmente.
        </descricao>
        <inputs>
          <input tipo="selectbox" label="Modo"
                 opcoes="[Caso pré-configurado (data de referência),
                          Montar minha própria cesta]"/>

          <grupo label="Caso pré-configurado" condicional="true">
            <input tipo="selectbox" label="Data de referência"
                   opcoes="[datas com labels descritivos]"/>
            <descricao>
              O caso pré-configurado inclui ~6 instrumentos:
              - LTN 1A
              - NTN-B 3A
              - LFT
              - CDB pós banco grande (105% CDI, 1A)
              - CDB pré banco médio (DI + 80 bps, 2A)
              - Debênture AAA (CDI + 1,50%, 3A)
              Todos com dados reais para a data selecionada.
            </descricao>
          </grupo>

          <grupo label="Montar cesta" condicional="true">
            <descricao>
              Interface st.data_editor onde o aluno preenche:
              | Nome | Categoria | Indexador | Taxa/Spread | Prazo (DU) | Rating | Liquidez |
              Pode adicionar até 8 instrumentos.
            </descricao>
          </grupo>
        </inputs>
      </secao>

      <!-- ============================================================ -->
      <!--  SEÇÃO 2 — TABELA COMPARATIVA MASTER                         -->
      <!-- ============================================================ -->
      <secao tipo="comparacao">
        <titulo>📊 Tabela Comparativa Master</titulo>
        <descricao>
          A tabela central do exercício: todos os instrumentos
          comparados em múltiplas dimensões.
        </descricao>
        <outputs>
          <output tipo="tabela_master">
            Tabela com colunas:
            | Instrumento | Categoria | Indexador | Taxa bruta | Taxa líquida (IR) | Spread s/ soberano (bps) | PU (R$) | Duration | Rating | Liquidez |
            Ordenável por qualquer coluna.
            Colorir spread: gradiente de verde (baixo) a vermelho (alto).
          </o>
          <output tipo="grafico_scatter">
            Scatter plot: Spread sobre soberano (X) vs. Duration (Y).
            Cada ponto é um instrumento. Tamanho do ponto proporcional
            ao volume. Cor por categoria (público = azul, bancário = teal,
            corporativo = laranja).
            Permite visualizar: "Essa debênture está no canto certo
            do gráfico — mais spread e mesma duration que o CDB?"
            Hover com detalhes completos.
          </o>
          <output tipo="grafico_barras_spread">
            Gráfico de barras horizontais: spread sobre soberano de
            cada instrumento, ordenado do menor para o maior.
            Cores por categoria. Linhas de referência para faixas
            de rating (AAA: ~50 bps, AA: ~100 bps, etc.).
          </o>
        </outputs>
      </secao>

      <!-- ============================================================ -->
      <!--  SEÇÃO 3 — SIMULAÇÃO DE CENÁRIO                              -->
      <!-- ============================================================ -->
      <secao tipo="cenario">
        <titulo>🌎 Simulação de Retorno por Cenário</titulo>
        <inputs>
          <input tipo="selectbox" label="Cenário"
                 opcoes="[SELIC estável, Corte −200 bps, Alta +200 bps,
                          Estresse de crédito (spreads +100 bps),
                          Personalizado]"/>
          <input tipo="slider" label="Horizonte (meses)" min="3" max="24" default="12"/>
        </inputs>
        <outputs>
          <output tipo="tabela_retornos">
            Adicionar à tabela master colunas de resultado projetado:
            | ... | Carry (R$) | MtM (R$) | Retorno total (%) | Retorno / Duration |
            A coluna "Retorno / Duration" é a métrica de eficiência:
            retorno por unidade de risco (duration).
          </o>
          <output tipo="grafico_retorno_risco">
            Scatter plot: Retorno total (Y) vs. Duration (X).
            Fronteira eficiente informal: conectar os pontos que
            oferecem melhor retorno para cada nível de duration.
            Instrumentos abaixo da fronteira estão "caros"
            (pouco retorno para o risco). Acima estão "baratos".
          </o>
          <output tipo="ranking">
            Ranking automático dos instrumentos pelo critério
            Retorno / Duration (eficiência):
            "1° Debênture AAA — 2,3% por ano de duration
             2° CDB pré banco médio — 1,9% por ano de duration
             ..."
          </o>
        </outputs>
      </secao>

      <!-- ============================================================ -->
      <!--  SEÇÃO 4 — ALOCAÇÃO                                          -->
      <!-- ============================================================ -->
      <secao tipo="alocacao">
        <titulo>💼 Monte Sua Carteira</titulo>
        <descricao>
          O aluno distribui um volume total entre os instrumentos
          selecionados e observa as características agregadas da carteira.
        </descricao>
        <inputs>
          <input tipo="number_input" label="Volume total a alocar (R$)"
                 default="50000000" step="5000000"/>
          <descricao>
            Sliders (um por instrumento) para definir a alocação
            percentual. Soma deve ser 100%. Exibir warning se ≠ 100%.
          </descricao>
        </inputs>
        <outputs>
          <output tipo="metrics_carteira">
            - Duration média ponderada da carteira
            - Spread médio sobre soberano (bps)
            - Retorno projetado (% a.a.) — no cenário selecionado
            - Concentração: maior alocação individual (%)
            - Rating médio ponderado (indicativo)
          </o>
          <output tipo="grafico_composicao">
            Gráfico de rosca (donut) mostrando a composição:
            anel externo por instrumento, anel interno por categoria
            (público/bancário/corporativo).
          </o>
          <output tipo="analise_automatica">
            Análise da carteira:
            - "Sua carteira tem duration média de X anos e spread
              médio de Y bps. No cenário de [cenário selecionado],
              o retorno projetado é Z%."
            - "A concentração em [categoria] é de W%. Considere
              diversificar se os limites de crédito permitirem."
            - "O instrumento mais eficiente (retorno/duration) é
              [instrumento]. Aumentar sua participação melhoraria
              a relação risco-retorno da carteira."
          </o>
        </outputs>
      </secao>

      <!-- ============================================================ -->
      <!--  SEÇÃO 5 — REFLEXÃO                                          -->
      <!-- ============================================================ -->
      <secao tipo="reflexao">
        <titulo>💬 Questões para Reflexão</titulo>
        <questoes>
          <questao id="1">
            Sua alocação muda se o cenário for de alta em vez de corte?
            Quanto da carteira migraria para LFT?
          </questao>
          <questao id="2">
            O spread da debênture AAA compensa o risco de iliquidez?
            Se você precisasse vender em um cenário de estresse, conseguiria
            a preço justo?
          </questao>
          <questao id="3">
            O CDB do banco médio paga mais que o do banco grande.
            Quanto mais? Esse excesso de spread é proporcional ao
            risco de crédito incremental?
          </questao>
          <questao id="4">
            Se a inflação surpreender para cima, quais instrumentos
            da sua carteira se beneficiam e quais sofrem?
          </questao>
          <questao id="5">
            Como essa alocação se compara com os limites de risco
            típicos de uma tesouraria bancária (limites de concentração,
            VaR, duration máxima)?
          </questao>
        </questoes>
      </secao>
    </layout>
  </pagina>

  <!-- ================================================================== -->
  <!--  DIRETRIZES TÉCNICAS                                                -->
  <!-- ================================================================== -->

  <diretrizes_tecnicas>
    <linguagem>Python 3.10+</linguagem>
    <framework>Streamlit</framework>
    <bibliotecas_principais>
      <biblioteca nome="streamlit" uso="Framework web"/>
      <biblioteca nome="plotly" uso="Gráficos interativos"/>
      <biblioteca nome="pandas" uso="Manipulação de dados"/>
      <biblioteca nome="numpy" uso="Cálculos numéricos"/>
      <biblioteca nome="bizdays" uso="Calendário DU ANBIMA" opcional="true"/>
    </bibliotecas_principais>

    <estrutura_de_arquivos>
      <arvore>
        app_tesouraria_mod3/
        ├── app.py
        ├── requirements.txt
        ├── config.py
        ├── utils/
        │   ├── math_finance.py         # Funções base (herdadas/complementadas dos Módulos 1-2)
        │   ├── pricing_publicos.py     # Precificação: LTN, NTN-F, LFT, NTN-B
        │   ├── pricing_privados.py     # Precificação: CDB, LCI/LCA, LF, debêntures, CRI/CRA, NP
        │   ├── relative_value.py       # Lógica de comparação, ranking, análise de carteira
        │   ├── market_data.py          # Carga de dados
        │   └── formatting.py           # Formatação
        ├── pages/
        │   ├── home.py
        │   ├── mod1_publicos.py
        │   ├── mod2_privados_ifs.py
        │   ├── mod3_privados_empresas.py
        │   └── integrador.py
        └── data/
            ├── titulos_publicos.csv    # PUs e taxas dos 4 títulos (múltiplas datas)
            ├── cdb_mercado.csv         # Taxas de CDBs por emissor/prazo
            ├── debentures_mercado.csv  # Taxas/spreads de debêntures por rating
            ├── curvas_di.csv           # [Pode importar do Módulo 2]
            ├── vna_ntnb.csv            # VNA histórico da NTN-B
            ├── vna_lft.csv             # VNA histórico da LFT
            └── tabela_ir.csv           # Alíquotas IR por prazo
      </arvore>
    </estrutura_de_arquivos>

    <funcoes_utilitarias>
      <descricao>
        Funções em utils/pricing_publicos.py:
      </descricao>
      <funcao nome="precificar_ltn(taxa, du)">
        Retorna PU com truncamento ANBIMA. Também retorna PU sem truncamento.
      </funcao>
      <funcao nome="precificar_ntnf(taxa, data_liq, data_venc, calendario_cupons)">
        Retorna PU, tabela de fluxos, duration Macaulay e modificada.
      </funcao>
      <funcao nome="precificar_lft(vna, spread_bps, du)">
        Retorna PU e cotação.
      </funcao>
      <funcao nome="precificar_ntnb(taxa_real, vna_proj, data_liq, data_venc, calendario_cupons)">
        Retorna PU, tabela de fluxos, duration.
      </funcao>

      <descricao>
        Funções em utils/pricing_privados.py:
      </descricao>
      <funcao nome="precificar_cdb_pos(face, pct_cdi_emissao, pct_cdi_mercado, du_decorridos, du_restantes, fator_cdi_acum)">
        Retorna PU na curva e PU MtM.
      </funcao>
      <funcao nome="precificar_cdb_pre(face, taxa_soberana, spread_bps, du)">
        Retorna PU e taxa total.
      </funcao>
      <funcao nome="equivalencia_fiscal(taxa_isenta, prazo_dc)">
        Retorna taxa bruta equivalente e alíquota IR.
      </funcao>
      <funcao nome="precificar_debenture_cdi(face, spread_emissao, spread_mercado, prazo_anos, periodicidade)">
        Retorna PU, tabela de fluxos, duration.
      </funcao>
      <funcao nome="precificar_debenture_ipca(taxa_real, vna_proj, prazo_anos, periodicidade)">
        Retorna PU, tabela de fluxos, duration.
      </funcao>

      <descricao>
        Funções em utils/relative_value.py:
      </descricao>
      <funcao nome="construir_tabela_comparativa(lista_instrumentos)">
        Recebe lista de dicts com dados de cada instrumento, retorna
        DataFrame com todas as métricas comparativas.
      </funcao>
      <funcao nome="simular_retorno_cenario(instrumentos, cenario, horizonte_meses)">
        Retorna DataFrame com carry, MtM e retorno total por instrumento.
      </funcao>
      <funcao nome="analisar_carteira(alocacao_dict, instrumentos_df)">
        Retorna métricas agregadas e texto de análise automática.
      </funcao>
    </funcoes_utilitarias>

    <padrao_visual>
      Mesmo padrão dos Módulos 1 e 2, com adição de:
      <regra>
        Convenção de cores por categoria de instrumento:
        - Títulos públicos: azul (#2E75B6)
        - Títulos de IFs: teal (#0E7C7B)
        - Crédito privado corporativo: laranja (#C55A11)
        Essa convenção facilita a identificação visual instantânea
        no exercício integrador.
      </regra>
      <regra>
        Todos os precificadores incluem expander "📐 Cálculo detalhado"
        com o passo a passo — essencial para transparência e aprendizado.
      </regra>
    </padrao_visual>

    <dados_de_mercado>
      <estrategia>
        Datasets pré-processados em CSV para funcionamento offline.
        Para títulos públicos: extrair do Tesouro Direto (preços e taxas)
        ou ANBIMA (mercado secundário) para 4-6 datas representativas.
        Para privados: usar faixas indicativas de spread por rating
        (ANBIMA/IDA) e dados de CDBs de 2-3 emissores representativos.
        VNAs da NTN-B e LFT: séries históricas do Tesouro Nacional.
      </estrategia>
    </dados_de_mercado>
  </diretrizes_tecnicas>

  <!-- ================================================================== -->
  <!--  ORIENTAÇÕES PEDAGÓGICAS                                            -->
  <!-- ================================================================== -->

  <orientacoes_pedagogicas>
    <orientacao bloco="1">
      Projetar os precificadores de LTN, NTN-F, LFT e NTN-B durante
      a exposição do Bloco 1. O "Comparativo de Títulos Públicos"
      (aba 1.5) é a ferramenta central da Parte D — projetar e
      manipular cenários em tempo real com a turma.
    </orientacao>
    <orientacao bloco="2">
      No Bloco 2, usar o precificador de CDB pós-fixado para
      demonstrar o MtM quando o percentual de CDI muda. A aba
      de equivalência fiscal (LCI/LCA) é rápida e impactante —
      mostra que a "vantagem" da LCI não existe para PJ.
    </orientacao>
    <orientacao bloco="3">
      No Bloco 3, o Exercício Integrador é a ferramenta principal.
      Projetar a Tabela Comparativa Master e o scatter plot
      Spread × Duration. Pedir que cada grupo monte sua carteira
      usando a Seção 4 e apresente a justificativa. O debate
      sobre as diferentes alocações é o momento de maior valor.
    </orientacao>
    <orientacao geral="pos_aula">
      Disponibilizar o app para que alunos experimentem com
      instrumentos e cenários diferentes. Sugerir a atividade
      pós-aula de "mini-análise de debênture" usando o precificador
      e dados reais do mercado secundário ANBIMA.
    </orientacao>
  </orientacoes_pedagogicas>

</app>
```
