# Guia para Criação do Aplicativo Streamlit — Módulo 4: Gestão de Carregamento de Ativos

```xml
<app>
  <metadata>
    <titulo>Laboratório de Operações de Tesouraria — Módulo 4</titulo>
    <subtitulo>Gestão de Carregamento de Ativos</subtitulo>
    <curso>MBA em Bancos e Instituições Financeiras — COPPEAD/UFRJ</curso>
    <publico_alvo>Média e alta gerência de bancos e instituições financeiras</publico_alvo>
    <objetivo_geral>
      Oferecer um ambiente interativo para que os alunos simulem
      estratégias de investimento em renda fixa, visualizem o impacto
      de duration e convexidade na carteira, construam carteiras
      imunizadas e executem stress tests — desenvolvendo a capacidade
      de tomar decisões integradas de gestão de carteira. O app é
      especialmente crítico neste módulo porque as visualizações em
      tempo real (slider de choque → efeito no PU, comparação de
      estratégias sob cenários) são o principal veículo de aprendizado.
    </objetivo_geral>
    <prerequisito>
      Módulos 1, 2 e 3 do app. Os precificadores do Módulo 3 alimentam
      os instrumentos disponíveis neste módulo. A curva de juros do
      Módulo 2 é insumo para simulações de cenário.
    </prerequisito>
    <principios_de_design>
      <principio id="1">
        Visualização como método: este módulo depende mais de gráficos
        interativos do que os anteriores. A curva de preço convexa, a
        comparação bullet vs. barbell, o efeito da imunização — tudo
        ganha clareza quando o aluno manipula sliders e vê os resultados
        se atualizarem em tempo real.
      </principio>
      <principio id="2">
        Do estratégico ao técnico e de volta ao gerencial: o app espelha
        a progressão do módulo — começa com estratégias (visão macro),
        desce para ferramentas de risco (duration, convexidade), e
        retorna à decisão gerencial no exercício integrador.
      </principio>
      <principio id="3">
        Limites de risco como restrição: em todas as seções de carteira,
        exibir conformidade com limites típicos de tesouraria (DV01 máximo,
        duration máxima), reforçando que a gestão opera dentro de
        restrições regulatórias e de governança.
      </principio>
      <principio id="4">
        Consistência visual e funcional com os Módulos 1, 2 e 3.
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
        <pagina id="home">🏛️ Visão Geral do Módulo 4</pagina>
        <pagina id="mod1">📊 Estratégias de Investimento</pagina>
        <pagina id="mod2">⚠️ Risco de Taxa de Juros</pagina>
        <pagina id="mod3">📐 Duration e Convexidade</pagina>
        <pagina id="mod4">🛡️ Imunização</pagina>
        <pagina id="integrador">🎯 Exercício Integrador — Gestor por um Dia</pagina>
      </paginas>
    </navegacao>

    <elementos_globais>
      <paleta_de_cores>
        <cor nome="primaria" hex="#1B3A5C" uso="títulos, cabeçalhos"/>
        <cor nome="secundaria" hex="#2E75B6" uso="curva spot, referências"/>
        <cor nome="accent" hex="#C55A11" uso="alertas, destaques negativos"/>
        <cor nome="fundo_claro" hex="#EAF3F8" uso="caixas explicativas"/>
        <cor nome="positivo" hex="#2E8B57" uso="ganhos, dentro do limite"/>
        <cor nome="negativo" hex="#CC3333" uso="perdas, fora do limite"/>
        <cor nome="bullet" hex="#2E75B6" uso="estratégia bullet"/>
        <cor nome="barbell" hex="#C55A11" uso="estratégia barbell"/>
        <cor nome="ladder" hex="#0E7C7B" uso="estratégia ladder"/>
        <cor nome="riding" hex="#8B5CF6" uso="estratégia riding the curve"/>
      </paleta_de_cores>
      <convencao_de_interface>
        Mesmo padrão dos módulos anteriores, com ênfase em:
        - Sliders interativos para choques de taxa (feedback visual imediato)
        - Indicadores de conformidade com limites (✅ dentro / ❌ fora)
        - Gráficos Plotly com animação suave nas transições
      </convencao_de_interface>
    </elementos_globais>
  </arquitetura>

  <!-- ================================================================== -->
  <!--  PÁGINA HOME                                                        -->
  <!-- ================================================================== -->

  <pagina id="home">
    <titulo>Visão Geral do Módulo 4 — Gestão de Carregamento de Ativos</titulo>
    <conteudo>
      <elemento tipo="header_banner">
        Título com identidade visual do curso.
      </elemento>
      <elemento tipo="texto_introdutorio">
        "Nos módulos anteriores, você aprendeu a construir a curva de
        juros e a precificar instrumentos. Agora vai aprender a gerir
        uma carteira: como posicioná-la, como medir e controlar o risco,
        e como protegê-la contra variações de taxa."
      </elemento>
      <elemento tipo="mapa_do_modulo">
        Cards com progressão:
        Estratégias → Risco de Taxa → Duration e Convexidade →
        Imunização → Gestor por um Dia.
        Indicação visual: "estratégico → técnico → gerencial".
      </elemento>
      <elemento tipo="conexao_modulos_anteriores">
        "🔗 Este módulo integra:
        - Cenário e curva de juros (Módulos 1 e 2) → base para estratégias
        - Precificação de instrumentos (Módulo 3) → insumos da carteira
        - Sensibilidade taxa-preço (Módulo 3) → formalizada aqui como duration"
      </elemento>
    </conteudo>
  </pagina>

  <!-- ================================================================== -->
  <!--  MÓDULO 1 — ESTRATÉGIAS DE INVESTIMENTO                            -->
  <!-- ================================================================== -->

  <pagina id="mod1">
    <titulo>Estratégias de Investimento na Renda Fixa</titulo>
    <objetivo_aprendizagem>
      Relacionar cenário econômico, dinâmica da taxa de juros e estratégias
      de investimento na renda fixa; gerir carteiras de renda fixa levando
      em consideração os riscos financeiros inerentes aos seus títulos.
    </objetivo_aprendizagem>
    <pergunta_gerencial>
      "Como devo distribuir minha carteira ao longo da curva de juros
      para maximizar o retorno ajustado ao risco dado o cenário?"
    </pergunta_gerencial>

    <abas>
      <!-- ============================================================ -->
      <!--  ABA 1.1 — VISUALIZADOR DE ESTRATÉGIAS                       -->
      <!-- ============================================================ -->
      <aba id="1.1" titulo="Estratégias Clássicas">
        <objetivo>
          Visualizar e comparar as quatro estratégias fundamentais de
          posicionamento ao longo da curva de juros.
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander "📘 Conceito" com descrição concisa das quatro
              estratégias: Bullet, Barbell, Ladder e Riding the Yield
              Curve. Para cada uma: definição em uma frase, quando usar,
              vantagem principal e risco principal.
            </descricao>
          </secao>

          <secao tipo="visualizacao">
            <titulo>Distribuição da Carteira sobre a Curva</titulo>
            <descricao>
              Visualização interativa que mostra como cada estratégia
              distribui o peso da carteira ao longo dos vértices da curva.
            </descricao>
            <inputs>
              <input tipo="selectbox" label="Estratégia"
                     opcoes="[Bullet, Barbell, Ladder, Riding the Yield Curve]"/>
              <input tipo="slider" label="Duration alvo da carteira (anos)"
                     min="1" max="7" default="3" step="0.5"
                     help="Todas as estratégias serão montadas com esta duration"/>
              <input tipo="selectbox" label="Curva de juros"
                     opcoes="[Importar do Módulo 2 (se disponível),
                              Dados pré-carregados]"/>
            </inputs>
            <outputs>
              <output tipo="grafico_duplo">
                Gráfico com dois eixos Y compartilhando o eixo X (prazo):

                Camada 1 — Curva de juros (linha, eixo Y esquerdo):
                  Curva spot nominal como contexto visual.

                Camada 2 — Pesos da carteira (barras, eixo Y direito):
                  Barras verticais mostrando a alocação percentual em
                  cada vértice. Cor da estratégia selecionada.

                Para cada estratégia:
                - Bullet: uma única barra alta no vértice alvo
                - Barbell: duas barras nos extremos (curto e longo)
                - Ladder: barras uniformes em todos os vértices
                - Riding: barras concentradas em vértices mais longos
                  que o horizonte de investimento

                Ao trocar a estratégia no selectbox, o gráfico atualiza
                com animação suave, permitindo comparação visual rápida.
              </o>
              <output tipo="metrics_row">
                - Duration efetiva (anos) — deve ser ≈ duration alvo
                - Convexidade da carteira
                - Número de vértices utilizados
                - Yield médio ponderado (% a.a.)
              </o>
              <output tipo="tabela_composicao">
                Tabela: | Vértice | Prazo (DU) | Taxa spot | Peso (%) | Contribuição duration |
              </o>
            </outputs>
          </secao>
        </layout>
      </aba>

      <!-- ============================================================ -->
      <!--  ABA 1.2 — SIMULADOR DE CENÁRIOS                             -->
      <!-- ============================================================ -->
      <aba id="1.2" titulo="Simulador: Estratégia × Cenário">
        <objetivo>
          Comparar o desempenho das quatro estratégias sob diferentes
          cenários de movimentação da curva, demonstrando que mesma
          duration não implica mesmo resultado.
        </objetivo>

        <layout>
          <secao tipo="simulador">
            <titulo>Comparador de Estratégias sob Cenário</titulo>
            <descricao>
              O coração deste módulo: monta as quatro estratégias com
              mesma duration e simula o retorno sob cenários distintos.
            </descricao>
            <inputs>
              <input tipo="slider" label="Duration alvo (anos)"
                     min="1" max="7" default="3" step="0.5"/>
              <input tipo="number_input" label="Volume da carteira (R$)"
                     default="100000000" step="10000000"/>
              <input tipo="selectbox" label="Cenário de choque na curva"
                     opcoes="[Deslocamento paralelo (+100 bps),
                              Deslocamento paralelo (−100 bps),
                              Empinamento (curto +50, longo +150),
                              Achatamento (curto +150, longo +50),
                              Bear flattening (curto +200, longo +100),
                              Bull steepening (curto −150, longo −50),
                              Personalizado]"/>
              <input tipo="condicional" condicao="Personalizado">
                <input tipo="slider" label="Choque no vértice curto (bps)"
                       min="-300" max="300" default="0"/>
                <input tipo="slider" label="Choque no vértice longo (bps)"
                       min="-300" max="300" default="0"/>
              </input>
              <input tipo="slider" label="Horizonte de avaliação (meses)"
                     min="1" max="24" default="12"/>
            </inputs>
            <outputs>
              <output tipo="tabela_comparativa">
                Tabela principal:
                | Estratégia | Duration | Convexidade | Carry (R$) | MtM (R$) | Retorno total (%) | Ranking |
                | Bullet     | 3.00     | X           | ...        | ...      | ...               | 2°      |
                | Barbell    | 3.00     | X+          | ...        | ...      | ...               | 1°      |
                | Ladder     | 3.00     | X           | ...        | ...      | ...               | 3°      |
                | Riding     | 3.00*    | X           | ...        | ...      | ...               | 4°      |
                * Duration do riding pode diferir ligeiramente.
                Colorir a linha do melhor retorno em verde, pior em vermelho.
              </o>
              <output tipo="grafico_barras_retorno">
                Gráfico de barras agrupadas: 4 barras (uma por estratégia)
                mostrando o retorno total (%). Cores dedicadas por
                estratégia. Linha de zero como referência.
              </o>
              <output tipo="grafico_decomposicao">
                Gráfico de barras empilhadas: para cada estratégia,
                decompor o retorno em Carry + MtM. Permite ver:
                "O barbell tem mais MtM positivo no achatamento"
                ou "O bullet tem mais carry mas perde em MtM".
              </o>
              <output tipo="interpretacao">
                Caixa de análise automática:
                "No cenário de [cenário], a estratégia [melhor] superou
                as demais com retorno de [X%]. A vantagem veio
                principalmente do componente [carry/MtM]. A estratégia
                [pior] teve o pior desempenho porque [explicação baseada
                na distribuição ao longo da curva].
                Nota: o barbell e o bullet têm a mesma duration, mas o
                barbell tem convexidade [maior/menor], o que explica
                a diferença de [Y bps] no resultado."
              </o>
            </outputs>
          </secao>

          <secao tipo="visualizacao">
            <titulo>Mapa de Calor: Estratégia × Cenário</titulo>
            <descricao>
              Visualização matricial que mostra qual estratégia vence
              em cada tipo de cenário.
            </descricao>
            <outputs>
              <output tipo="heatmap">
                Heatmap (6 linhas × 4 colunas):
                Linhas: cenários (paralelo+, paralelo−, empinamento,
                achatamento, bear flat, bull steep).
                Colunas: estratégias (bullet, barbell, ladder, riding).
                Valores: retorno total (%).
                Cores: verde = melhor, vermelho = pior.
                Permite identificar padrões: "Barbell vence em cenários
                de achatamento e choques grandes. Bullet vence em
                cenários de empinamento."
              </o>
            </outputs>
          </secao>
        </layout>
      </aba>

      <!-- ============================================================ -->
      <!--  ABA 1.3 — RIDING THE YIELD CURVE                            -->
      <!-- ============================================================ -->
      <aba id="1.3" titulo="Riding the Yield Curve — Detalhado">
        <objetivo>
          Visualizar e calcular o ganho de rolldown da estratégia
          riding the yield curve, entendendo quando funciona e quando falha.
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander:
              - Riding: comprar título de prazo mais longo que o horizonte
                e vender antes do vencimento. O título "desliza" pela curva
                de juros — se a curva é positivamente inclinada e
                permanece estável, o título valoriza à medida que o prazo
                encurta (rolldown).
              - Ganho de rolldown = diferença de taxa entre o vértice
                de compra e o vértice após o período de carregamento,
                traduzida em variação de PU.
              - Risco: se a curva se desloca para cima, o ganho de
                rolldown pode ser anulado ou superado pela perda de MtM.
            </descricao>
          </secao>

          <secao tipo="simulador">
            <titulo>Simulador de Rolldown</titulo>
            <inputs>
              <input tipo="slider" label="Prazo do título comprado (anos)"
                     min="1" max="10" default="5" step="0.5"/>
              <input tipo="slider" label="Horizonte de carregamento (meses)"
                     min="3" max="24" default="12" step="3"/>
              <input tipo="slider" label="Deslocamento paralelo da curva (bps)"
                     min="-200" max="200" default="0" step="10"
                     help="0 = curva estável (riding puro). Positivo = curva sobe."/>
            </inputs>
            <outputs>
              <output tipo="grafico_curva_com_rolldown">
                Gráfico Plotly:
                - Curva de juros original (azul, contínua)
                - Curva deslocada (cinza tracejada, se choque ≠ 0)
                - Ponto de COMPRA: marcador no vértice do título comprado
                - Ponto de VENDA: marcador no vértice após rolldown
                - Seta conectando os dois pontos, com label do ganho
                  de rolldown em bps
                Visualização intuitiva: o título "desce" pela curva.
              </o>
              <output tipo="metrics_row">
                - Ganho de rolldown (bps)
                - Ganho de rolldown (R$ por R$ 1.000 de face)
                - Perda por deslocamento da curva (R$)
                - Resultado líquido (R$)
                - Breakeven: deslocamento máximo que o riding suporta (bps)
              </o>
              <output tipo="grafico_breakeven">
                Gráfico: Resultado líquido (Y) vs. Deslocamento paralelo
                (X, −200 a +200 bps).
                Linha cruzando zero = breakeven.
                Região verde (resultado positivo), vermelha (negativo).
                "O riding gera resultado positivo enquanto a curva
                não subir mais que [X] bps."
              </o>
            </outputs>
          </secao>
        </layout>
      </aba>
    </abas>
  </pagina>

  <!-- ================================================================== -->
  <!--  MÓDULO 2 — RISCO DE TAXA DE JUROS                                 -->
  <!-- ================================================================== -->

  <pagina id="mod2">
    <titulo>Risco de Taxa de Juros</titulo>
    <objetivo_aprendizagem>
      Compreender o risco de taxa de juros e os seus fatores de risco.
    </objetivo_aprendizagem>
    <pergunta_gerencial>
      "Qual é a exposição da minha carteira a movimentos de juros?
      Onde está concentrado o risco? Estou dentro dos limites?"
    </pergunta_gerencial>

    <abas>
      <!-- ============================================================ -->
      <!--  ABA 2.1 — FONTES DE RISCO                                   -->
      <!-- ============================================================ -->
      <aba id="2.1" titulo="Fontes de Risco e Cenários">
        <objetivo>
          Visualizar as diferentes formas como a curva de juros pode
          se mover e o impacto de cada movimento na carteira.
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander com as cinco fontes de risco:
              (1) Nível (parallel shift), (2) Inclinação (steepening/
              flattening), (3) Curvatura (butterfly), (4) Spread,
              (5) Base. Para cada: definição, exemplo e qual métrica
              captura (duration, KRD, spread duration).
            </descricao>
          </secao>

          <secao tipo="visualizacao">
            <titulo>Anatomia dos Movimentos da Curva</titulo>
            <descricao>
              Visualização interativa que demonstra cada tipo de
              movimento da curva isoladamente.
            </descricao>
            <inputs>
              <input tipo="selectbox" label="Tipo de movimento"
                     opcoes="[Paralelo (nível),
                              Empinamento (steepening),
                              Achatamento (flattening),
                              Butterfly (curvatura),
                              Combinado (personalizar)]"/>
              <input tipo="slider" label="Magnitude (bps)"
                     min="-200" max="200" default="100" step="10"/>
            </inputs>
            <outputs>
              <output tipo="grafico_curvas_sobrepostas">
                Gráfico Plotly:
                - Curva original (azul contínua)
                - Curva após o movimento (vermelha tracejada)
                - Área entre as duas curvas sombreada para evidenciar
                  onde o movimento é maior
                Para cada tipo:
                - Paralelo: deslocamento uniforme em todos os vértices
                - Empinamento: curto sobe pouco, longo sobe muito
                - Achatamento: curto sobe muito, longo sobe pouco
                - Butterfly: extremos sobem, miolo cai (ou vice-versa)
              </o>
              <output tipo="tabela_choques_por_vertice">
                Tabela mostrando o choque aplicado em cada vértice:
                | Vértice | Prazo | Choque (bps) |
                Evidencia a estrutura do movimento.
              </o>
            </outputs>
          </secao>
        </layout>
      </aba>

      <!-- ============================================================ -->
      <!--  ABA 2.2 — MÉTRICAS DE RISCO                                 -->
      <!-- ============================================================ -->
      <aba id="2.2" titulo="DV01 e Métricas de Risco">
        <objetivo>
          Calcular DV01, Key Rate Durations e VaR paramétrico de uma
          carteira, entendendo o significado prático de cada métrica.
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander com:
              - DV01: "Quanto a carteira perde (em R$) se todas as taxas
                subirem 1 bp." Fórmula: DV01 ≈ −D* × PU × 0,0001.
              - Key Rate Duration (KRD): "Quanto a carteira perde se
                APENAS o vértice de X anos subir 1 bp." Permite
                decompor o risco por prazo.
              - VaR paramétrico: VaR ≈ DV01 × σ(taxa) × z_α × √t.
                Simplificação didática — não substitui modelos completos.
            </descricao>
          </secao>

          <secao tipo="simulador">
            <titulo>Analisador de Risco de Carteira</titulo>
            <descricao>
              O aluno monta ou carrega uma carteira e obtém a
              decomposição completa de risco.
            </descricao>
            <inputs>
              <input tipo="selectbox" label="Fonte da carteira"
                     opcoes="[Carteira pré-configurada (exemplo didático),
                              Montar manualmente,
                              Importar do Módulo 3 (se disponível)]"/>
              <grupo label="Carteira manual (condicional)" condicional="true">
                <descricao>
                  st.data_editor com colunas:
                  | Título | PU (R$) | Quantidade | Duration mod. | Convexidade |
                  Pré-populado com 4-5 títulos representativos.
                </descricao>
              </grupo>
              <grupo label="Limites de risco">
                <input tipo="number_input" label="Limite de DV01 (R$)"
                       default="50000" step="5000"/>
                <input tipo="number_input" label="Duration máxima (anos)"
                       default="4.0" step="0.5"/>
              </grupo>
            </inputs>
            <outputs>
              <output tipo="metrics_row">
                - DV01 total (R$) — com indicador ✅/❌ vs. limite
                - Duration média ponderada — com indicador ✅/❌
                - VaR 95% 1 dia (R$) — estimativa paramétrica
                - Valor total da carteira (R$)
              </o>
              <output tipo="tabela_decomposicao">
                Tabela detalhada:
                | Título | Peso (%) | Duration | DV01 (R$) | Contribuição risco (%) |
                Ordenar por contribuição ao risco (maior primeiro).
              </o>
              <output tipo="grafico_krd">
                Gráfico de barras: Key Rate Durations.
                Eixo X: vértices da curva (6M, 1A, 2A, 3A, 5A, 7A, 10A).
                Eixo Y: DV01 parcial (R$) em cada vértice.
                Permite ver: "80% do risco está concentrado no vértice
                de 5 anos" — informação que a duration média esconde.
              </o>
              <output tipo="grafico_pizza_risco">
                Gráfico de rosca: contribuição de cada título para
                o DV01 total. Permite identificar concentração.
              </o>
            </outputs>
          </secao>
        </layout>
      </aba>

      <!-- ============================================================ -->
      <!--  ABA 2.3 — STRESS TEST                                       -->
      <!-- ============================================================ -->
      <aba id="2.3" titulo="Stress Test de Carteira">
        <objetivo>
          Simular o impacto de cenários adversos na carteira e verificar
          conformidade com limites de risco.
        </objetivo>

        <layout>
          <secao tipo="simulador">
            <titulo>Simulador de Stress Test</titulo>
            <descricao>
              Aplica cenários de choque à carteira carregada na aba
              anterior e exibe os resultados.
            </descricao>
            <inputs>
              <input tipo="multiselect" label="Cenários a simular"
                     opcoes="[Paralelo +100 bps,
                              Paralelo +200 bps,
                              Paralelo −100 bps,
                              Empinamento (curto +50, longo +150),
                              Achatamento (curto +150, longo +50),
                              Estresse severo (+300 bps),
                              Personalizado]" default="todos exceto personalizado"/>
            </inputs>
            <outputs>
              <output tipo="tabela_stress">
                Tabela de resultados:
                | Cenário | Perda/Ganho total (R$) | Perda/Ganho (%) | Pior título | Melhor título |
                Colorir: verde para ganho, vermelho para perda.
                Destacar cenários que violam limites de VaR.
              </o>
              <output tipo="grafico_barras_stress">
                Gráfico de barras horizontais: resultado (R$) de cada
                cenário. Barras verdes e vermelhas. Linha vertical
                tracejada no limite de perda aceitável (se definido).
              </o>
              <output tipo="nota_pedagogica">
                "O stress test é uma ferramenta regulatória obrigatória
                para bancos (ICAAP/IRRBB). A tesouraria deve demonstrar
                que a carteira resiste a cenários adversos sem violar
                limites de capital. Se um cenário gera perda superior
                ao limite, o gestor deve reduzir posição ou fazer hedge."
              </o>
            </outputs>
          </secao>
        </layout>
      </aba>
    </abas>
  </pagina>

  <!-- ================================================================== -->
  <!--  MÓDULO 3 — DURATION E CONVEXIDADE                                 -->
  <!-- ================================================================== -->

  <pagina id="mod3">
    <titulo>Duration e Convexidade</titulo>
    <objetivo_aprendizagem>
      Identificar as ferramentas disponíveis para gestão do risco da
      taxa de juros e gerenciar o efeito da variação da taxa de juros
      na carteira de investimentos.
    </objetivo_aprendizagem>
    <pergunta_gerencial>
      "Quanto minha carteira perde se a taxa subir 100 bps? E 200 bps?
      A aproximação por duration é boa o suficiente ou preciso
      considerar a convexidade?"
    </pergunta_gerencial>

    <abas>
      <!-- ============================================================ -->
      <!--  ABA 3.1 — CALCULADORA DE DURATION                           -->
      <!-- ============================================================ -->
      <aba id="3.1" titulo="Calculadora de Duration">
        <objetivo>
          Calcular a duration Macaulay e modificada de títulos
          individuais e de carteiras, com visualização dos pesos
          que compõem a duration.
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander "📘 Duration em 3 Níveis":
              1. Intuição: "prazo médio ponderado dos fluxos de caixa"
              2. Sensibilidade: "ΔPU/PU ≈ −D* × Δi"
              3. Fórmula: D = (1/PU) × Σ[t_k × VP(C_k)]
                          D* = D / (1 + y)
            </descricao>
          </secao>

          <secao tipo="simulador">
            <titulo>Duration de Título Individual</titulo>
            <inputs>
              <input tipo="selectbox" label="Tipo de título"
                     opcoes="[LTN (zero cupom),
                              NTN-F (prefixado com cupom),
                              NTN-B (IPCA + cupom),
                              CDB prefixado,
                              Debênture (CDI + spread)]"/>
              <input tipo="number_input" label="Taxa (% a.a.)" default="12.50" step="0.25"/>
              <input tipo="number_input" label="Prazo até vencimento (anos)"
                     default="3" step="0.5"/>
              <input tipo="number_input" label="Cupom (% a.a.)" default="10"
                     help="Automático para LTN (0%) e NTN-F (10%)" step="1"/>
            </inputs>
            <outputs>
              <output tipo="metrics_row">
                - Duration Macaulay (anos)
                - Duration modificada (anos)
                - DV01 por R$ 1.000 de face (R$)
                - Convexidade (referência para próxima aba)
              </o>
              <output tipo="grafico_pesos_duration">
                Gráfico de barras + linha:
                Barras: VP de cada fluxo (R$). Cor: azul claro para
                cupons, azul escuro para principal.
                Linha: peso acumulado na duration (% do total).
                Marcador: ponto onde o peso acumulado atinge 50% —
                "metade do valor está concentrada antes deste ponto".
                Essa visualização torna tangível o conceito de "prazo
                médio ponderado".
              </o>
              <output tipo="comparador_rapido">
                Caixa "🔄 Comparação rápida":
                Exibir lado a lado a duration de um zero cupom (LTN)
                e do título selecionado, ambos com mesmo vencimento.
                "A LTN de 3 anos tem duration = 3,00. A NTN-F de 3 anos
                tem duration = 2,68. Os cupons reduzem a duration em
                0,32 anos."
              </o>
            </outputs>
          </secao>

          <secao tipo="simulador">
            <titulo>Duration de Carteira</titulo>
            <inputs>
              <descricao>
                st.data_editor com colunas:
                | Título | PU (R$) | Quantidade | Duration mod. |
                Pré-populado com 3-4 títulos.
                Cálculo automático do peso e da duration ponderada.
              </descricao>
            </inputs>
            <outputs>
              <output tipo="metrics_row">
                - Duration média ponderada (anos)
                - DV01 total da carteira (R$)
              </o>
              <output tipo="grafico_contribuicao">
                Gráfico de barras empilhadas: contribuição de cada
                título para a duration total (w_i × D*_i).
              </o>
            </outputs>
          </secao>
        </layout>
      </aba>

      <!-- ============================================================ -->
      <!--  ABA 3.2 — CONVEXIDADE                                       -->
      <!-- ============================================================ -->
      <aba id="3.2" titulo="Convexidade — A Correção de Segunda Ordem">
        <objetivo>
          Visualizar o efeito da convexidade na relação taxa-preço e
          entender por que a convexidade sempre favorece o investidor.
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander:
              - A curva taxa-preço é convexa: quando a taxa cai, o
                preço sobe mais do que a duration prevê; quando a taxa
                sobe, o preço cai menos.
              - Fórmula: ΔPU/PU ≈ −D* × Δi + ½ × C × (Δi)²
              - O termo ½ × C × (Δi)² é SEMPRE positivo (Δi² > 0).
              - Conclusão: entre dois títulos com mesma duration, o
                investidor prefere o de maior convexidade.
            </descricao>
          </secao>

          <secao tipo="simulador">
            <titulo>Visualizador de Convexidade</titulo>
            <descricao>
              A visualização mais importante de todo o módulo: a curva
              real de preço, a tangente (duration) e a parábola
              (duration + convexidade) sobrepostas.
            </descricao>
            <inputs>
              <input tipo="selectbox" label="Título"
                     opcoes="[LTN 1A, LTN 3A, LTN 5A,
                              NTN-F 3A, NTN-F 5A,
                              NTN-B 5A, NTN-B 10A]"/>
              <input tipo="slider" label="Choque de taxa (bps)"
                     min="-300" max="300" default="0" step="10"
                     help="Mova o slider e observe as três curvas"/>
            </inputs>
            <outputs>
              <output tipo="grafico_principal">
                Gráfico Plotly (o mais importante do módulo):
                Eixo X: taxa de mercado (range: taxa atual ± 300 bps)
                Eixo Y: PU (R$)

                Três séries:
                1. Curva real (precificação completa) — linha azul grossa
                2. Aproximação por duration (tangente) — linha laranja tracejada
                3. Aproximação duration + convexidade — linha verde tracejada

                Ponto atual: marcador grande na taxa/PU atuais.
                Ponto do choque: marcador no PU resultante do choque.

                Ao mover o slider de choque:
                - Para choques pequenos (±50 bps): as três linhas
                  praticamente se sobrepõem
                - Para choques grandes (±200 bps): a tangente diverge
                  significativamente; a parábola fica mais próxima
                  da curva real

                Anotações no gráfico:
                - "Erro da duration: R$ X" (diferença entre tangente e real)
                - "Erro com convexidade: R$ Y" (diferença entre parábola e real)
              </o>
              <output tipo="metrics_row">
                - PU real (precificação completa)
                - PU aproximado (duration only)
                - PU aproximado (duration + convexidade)
                - Erro da duration (R$ e %)
                - Erro com convexidade (R$ e %)
              </o>
              <output tipo="tabela_comparativa_choques">
                Tabela com resultados para choques de −250 a +250 bps
                (incrementos de 50):
                | Choque | PU real | PU (duration) | Erro D | PU (D+C) | Erro D+C |
                Demonstra sistematicamente que o erro cresce com o
                tamanho do choque e que a convexidade corrige a maior
                parte do erro.
              </o>
            </outputs>
          </secao>

          <secao tipo="simulador">
            <titulo>Convexidade: Bullet vs. Barbell</titulo>
            <descricao>
              Demonstração numérica de que o barbell tem convexidade
              superior ao bullet de mesma duration — e por que isso
              importa.
            </descricao>
            <inputs>
              <input tipo="slider" label="Duration alvo (anos)"
                     min="2" max="6" default="3" step="0.5"/>
            </inputs>
            <outputs>
              <output tipo="tabela_comparativa">
                | Métrica | Bullet | Barbell | Diferença |
                | Duration | 3.00  | 3.00    | 0         |
                | Convexidade | X | X+Y     | +Y        |
                | Resultado +200 bps | -A% | -B% | B-A bps |
                | Resultado −200 bps | +C% | +D% | D-C bps |
                O barbell ganha nos DOIS cenários de choque grande
                (graças à convexidade superior).
              </o>
              <output tipo="grafico_sobreposicao">
                Gráfico: retorno total (Y) vs. choque paralelo (X)
                para Bullet e Barbell. Duas curvas convexas sobrepostas.
                A curva do barbell é "mais convexa" — sempre acima do
                bullet para choques grandes.
              </o>
              <output tipo="nota_pedagogica">
                "A convexidade é um 'bônus gratuito': entre duas
                carteiras com mesma duration, a de maior convexidade
                terá melhor resultado para qualquer choque grande,
                independentemente da direção. Na prática, o mercado
                cobra por essa vantagem — títulos de maior convexidade
                negociam com yield ligeiramente menor (prêmio de
                convexidade negativo). O gestor deve avaliar se o
                prêmio cobrado compensa o benefício."
              </o>
            </outputs>
          </secao>
        </layout>
      </aba>
    </abas>
  </pagina>

  <!-- ================================================================== -->
  <!--  MÓDULO 4 — IMUNIZAÇÃO                                             -->
  <!-- ================================================================== -->

  <pagina id="mod4">
    <titulo>Imunização</titulo>
    <objetivo_aprendizagem>
      Aplicar imunização para proteger o valor de uma carteira contra
      variações de taxa de juros para um horizonte específico.
    </objetivo_aprendizagem>
    <pergunta_gerencial>
      "Como garantir que minha carteira cubra uma obrigação futura
      independentemente do que aconteça com os juros?"
    </pergunta_gerencial>

    <abas>
      <!-- ============================================================ -->
      <!--  ABA 4.1 — CONCEITO E CONSTRUÇÃO                             -->
      <!-- ============================================================ -->
      <aba id="4.1" titulo="Construindo uma Carteira Imunizada">
        <objetivo>
          Construir passo a passo uma carteira imunizada para um
          horizonte definido, entendendo as condições necessárias.
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander "📘 Imunização — O Conceito":
              - Problema: garantir valor futuro independente das taxas.
              - Solução: casar duration da carteira com o horizonte.
              - Por que funciona: quando taxa sobe, PU cai (perda de
                capital) mas reinvestimento rende mais (ganho). Os dois
                efeitos se compensam quando duration = horizonte.
              - Condições: (1) VP carteira = VP obrigação,
                (2) Duration carteira = prazo obrigação,
                (3) Convexidade carteira ≥ convexidade obrigação.
            </descricao>
          </secao>

          <secao tipo="simulador">
            <titulo>Construtor de Carteira Imunizada</titulo>
            <inputs>
              <grupo label="Obrigação a cobrir">
                <input tipo="number_input" label="Valor futuro da obrigação (R$)"
                       default="10000000" step="1000000"/>
                <input tipo="number_input" label="Prazo da obrigação (anos)"
                       default="3" step="0.5"/>
              </grupo>
              <grupo label="Instrumentos disponíveis">
                <input tipo="selectbox" label="Título curto"
                       opcoes="[LTN 1A, LTN 2A, CDB pré 1A]"
                       help="Duration < prazo da obrigação"/>
                <input tipo="selectbox" label="Título longo"
                       opcoes="[NTN-F 5A, NTN-F 7A, LTN 5A]"
                       help="Duration > prazo da obrigação"/>
              </grupo>
              <grupo label="Taxa de mercado">
                <input tipo="number_input" label="Taxa do título curto (% a.a.)"
                       default="12.00" step="0.25"/>
                <input tipo="number_input" label="Taxa do título longo (% a.a.)"
                       default="13.00" step="0.25"/>
              </grupo>
            </inputs>
            <outputs>
              <output tipo="calculo_passo_a_passo">
                Seção expandida (não em expander — visível por default):

                Passo 1 — Durations dos instrumentos:
                  "Título curto: duration = X anos.
                   Título longo: duration = Y anos."

                Passo 2 — Proporções:
                  "Para obter duration = Z (prazo da obrigação):
                   w₁ × D₁ + w₂ × D₂ = Z, com w₁ + w₂ = 1
                   Resolvendo: w₁ = [W1]%, w₂ = [W2]%"

                Passo 3 — Valores:
                  "VP da obrigação = VF / (1+r)^n = R$ [VP]
                   Investir R$ [VP×w₁] no título curto
                   Investir R$ [VP×w₂] no título longo"

                Passo 4 — Verificação:
                  "Duration da carteira = [calculada] ✅
                   VP da carteira = R$ [VP] ✅
                   Convexidade da carteira = [C] ✅"
              </o>
              <output tipo="grafico_composicao">
                Gráfico de rosca: proporção título curto vs. longo,
                com labels de valor em R$.
              </o>
            </outputs>
          </secao>
        </layout>
      </aba>

      <!-- ============================================================ -->
      <!--  ABA 4.2 — VERIFICAÇÃO DA IMUNIZAÇÃO                         -->
      <!-- ============================================================ -->
      <aba id="4.2" titulo="A Imunização Funciona? — Verificação">
        <objetivo>
          Verificar que a carteira imunizada de fato protege contra
          variações de taxa, simulando cenários e observando que o
          valor acumulado no horizonte permanece estável.
        </objetivo>

        <layout>
          <secao tipo="simulador">
            <titulo>Simulador de Verificação</titulo>
            <descricao>
              Usa a carteira construída na aba anterior e simula
              o resultado acumulado no horizonte sob diferentes
              cenários de taxa.
            </descricao>
            <inputs>
              <input tipo="slider" label="Choque de taxa imediato (bps)"
                     min="-300" max="300" default="0" step="25"
                     help="Choque aplicado logo após a construção da carteira"/>
            </inputs>
            <outputs>
              <output tipo="grafico_principal">
                Gráfico de linhas (o mais didático desta seção):
                Eixo X: choque de taxa (−300 a +300 bps)
                Eixo Y: valor acumulado no horizonte (R$)

                Três séries:
                1. Carteira imunizada — linha quase horizontal (verde)
                   O valor acumulado é praticamente o mesmo para
                   qualquer choque.
                2. Carteira bullet (título curto apenas) — linha
                   inclinada (azul): ganha quando taxa cai, perde
                   quando sobe (duration < horizonte → risco de
                   reinvestimento domina).
                3. Carteira bullet (título longo apenas) — linha
                   inclinada oposta (laranja): ganha quando taxa sobe
                   (reinvestimento), perde quando cai (duration >
                   horizonte → risco de preço domina).

                A carteira imunizada é a que tem o valor mais estável
                — demonstra visualmente que a imunização funciona.

                Linha horizontal tracejada: valor-alvo da obrigação.
              </o>
              <output tipo="metrics_comparacao">
                Tabela para o choque selecionado:
                | Carteira | Valor acumulado | Diferença vs. alvo | Desvio (%) |
                | Imunizada | R$ 10.015.000  | +R$ 15.000         | +0,15%     |
                | Só curto  | R$ 9.850.000   | −R$ 150.000        | −1,50%     |
                | Só longo  | R$ 10.320.000  | +R$ 320.000        | +3,20%     |
              </o>
              <output tipo="decomposicao_efeitos">
                Expander "📐 Por que funciona?":
                Para a carteira imunizada no choque selecionado:
                - Efeito preço (MtM): R$ [X] (perda se taxa subiu)
                - Efeito reinvestimento: R$ [Y] (ganho se taxa subiu)
                - Efeito líquido: R$ [X+Y] ≈ 0
                "Os dois efeitos se compensam porque a duration da
                carteira é igual ao horizonte."
              </o>
            </outputs>
          </secao>
        </layout>
      </aba>

      <!-- ============================================================ -->
      <!--  ABA 4.3 — REBALANCEAMENTO                                   -->
      <!-- ============================================================ -->
      <aba id="4.3" titulo="Duration Drift e Rebalanceamento">
        <objetivo>
          Demonstrar que a duration da carteira muda com o tempo
          (duration drift) e que a carteira imunizada precisa ser
          rebalanceada periodicamente.
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander:
              - Duration drift: com a passagem do tempo, a duration
                de cada título diminui (o título fica mais curto).
                Mas a duration do passivo também diminui (o horizonte
                encurta). O problema é que as duas podem não diminuir
                no mesmo ritmo — gerando descasamento.
              - Regra prática: rebalancear a cada 3-6 meses, ou quando
                o descasamento de duration ultrapassar um limite
                (ex.: ±0,25 anos).
            </descricao>
          </secao>

          <secao tipo="simulador">
            <titulo>Simulador de Duration Drift</titulo>
            <inputs>
              <input tipo="slider" label="Meses decorridos desde a imunização"
                     min="0" max="36" default="0" step="3"/>
            </inputs>
            <outputs>
              <output tipo="grafico_drift">
                Gráfico de linhas:
                Eixo X: meses decorridos (0 a 36)
                Duas linhas:
                - Duration da carteira (azul) — diminui ao longo do tempo
                - Horizonte remanescente (laranja tracejada) — diminui
                  linearmente
                Área entre as duas linhas sombreada:
                - Verde se descasamento < 0,25 anos
                - Amarelo se 0,25-0,5 anos
                - Vermelho se > 0,5 anos
                Marcador no mês selecionado pelo slider.
              </o>
              <output tipo="metrics_row">
                - Duration atual da carteira
                - Horizonte remanescente
                - Descasamento (anos)
                - Status: ✅ OK / ⚠️ Rebalancear / ❌ Fora do limite
              </o>
              <output tipo="nota_pedagogica">
                "Na prática, a tesouraria define um limite de
                descasamento de duration (ex.: ±0,25 anos). Quando
                o drift ultrapassa esse limite, é hora de rebalancear:
                vender parte da posição longa e comprar curta (ou
                vice-versa) para realinhar a duration com o horizonte."
              </o>
            </outputs>
          </secao>
        </layout>
      </aba>
    </abas>
  </pagina>

  <!-- ================================================================== -->
  <!--  EXERCÍCIO INTEGRADOR — GESTOR POR UM DIA                          -->
  <!-- ================================================================== -->

  <pagina id="integrador">
    <titulo>Exercício Integrador — Gestor de Carteira por um Dia</titulo>
    <objetivo>
      Articular estratégia, seleção de instrumentos, gestão de risco,
      imunização e stress test numa decisão integrada de gestão de
      carteira, simulando o trabalho de um gestor de tesouraria.
    </objetivo>
    <pergunta_gerencial>
      "Tenho R$ 100 milhões, limites de risco definidos e uma obrigação
      de funding a vencer. Como monto a carteira?"
    </pergunta_gerencial>

    <layout>
      <!-- ============================================================ -->
      <!--  SEÇÃO 1 — BRIEFING                                          -->
      <!-- ============================================================ -->
      <secao tipo="briefing">
        <titulo>📋 Briefing do Gestor</titulo>
        <descricao>
          Apresentação do cenário e das restrições. Pode ser pré-configurado
          ou editável pelo professor.
        </descricao>
        <inputs>
          <input tipo="selectbox" label="Cenário"
                 opcoes="[Caso 1: Ciclo de cortes — SELIC em queda,
                          Caso 2: Ciclo de alta — SELIC subindo,
                          Caso 3: Incerteza — curva flat,
                          Personalizado]"/>
        </inputs>
        <dados_exibidos>
          Painel "ficha do gestor" (st.columns com st.metric):
          - Volume da carteira: R$ 100.000.000
          - Limite de DV01: R$ 50.000
          - Duration máxima: 4,0 anos
          - Obrigação de funding: R$ 30.000.000 em 2 anos
          - Cenário macro: [descrição breve]
          - SELIC Meta: X%
          - Curva de juros: [gráfico miniatura ou referência ao Módulo 2]
        </dados_exibidos>
      </secao>

      <!-- ============================================================ -->
      <!--  SEÇÃO 2 — ESTRATÉGIA                                        -->
      <!-- ============================================================ -->
      <secao tipo="estrategia">
        <titulo>1️⃣ Escolha Sua Estratégia</titulo>
        <inputs>
          <input tipo="selectbox" label="Estratégia principal (R$ 70M livres)"
                 opcoes="[Bullet, Barbell, Ladder, Riding the Yield Curve]"/>
          <input tipo="text_area" label="Justificativa (opcional)"
                 help="Por que essa estratégia para este cenário?"
                 placeholder="Ex.: Espero corte de 200 bps em 12 meses,
                 portanto prefixados longos devem valorizar..."/>
        </inputs>
      </secao>

      <!-- ============================================================ -->
      <!--  SEÇÃO 3 — SELEÇÃO DE INSTRUMENTOS                           -->
      <!-- ============================================================ -->
      <secao tipo="selecao">
        <titulo>2️⃣ Monte Sua Carteira</titulo>
        <descricao>
          Duas sub-carteiras:
          A) Carteira imunizada (R$ 30M) — para cobrir a obrigação de funding.
          B) Carteira direcional (R$ 70M) — conforme a estratégia escolhida.
        </descricao>
        <inputs>
          <grupo label="Carteira imunizada (R$ 30M)">
            <descricao>
              Seletor automático:
              - Exibe a duration necessária (= 2 anos, prazo do funding)
              - Oferece pares de títulos (curto + longo) e calcula
                automaticamente as proporções para imunizar
              - O aluno pode aceitar a sugestão ou ajustar manualmente
            </descricao>
            <input tipo="selectbox" label="Título curto"
                   opcoes="[LTN 6M, LTN 1A, CDB pré 1A]"/>
            <input tipo="selectbox" label="Título longo"
                   opcoes="[LTN 3A, NTN-F 5A, LTN 5A]"/>
          </grupo>
          <grupo label="Carteira direcional (R$ 70M)">
            <descricao>
              st.data_editor com instrumentos disponíveis (do Módulo 3).
              O aluno distribui os R$ 70M conforme a estratégia.
              | Título | Categoria | Taxa | Alocação (R$) |
              Validação: soma = R$ 70M.
            </descricao>
          </grupo>
        </inputs>
      </secao>

      <!-- ============================================================ -->
      <!--  SEÇÃO 4 — DASHBOARD DA CARTEIRA                             -->
      <!-- ============================================================ -->
      <secao tipo="dashboard">
        <titulo>3️⃣ Dashboard da Carteira</titulo>
        <outputs>
          <output tipo="metrics_conformidade">
            Painel de conformidade com limites (4 métricas em st.columns):
            - DV01 total: R$ [X] — ✅ Dentro (< R$ 50.000) / ❌ Fora
            - Duration média: [Y] anos — ✅ Dentro (< 4,0) / ❌ Fora
            - Duration carteira imunizada vs. horizonte: [Z] anos
              — ✅ Casada / ⚠️ Descasada
            - Concentração máxima: [W]% — informativo
            Cores: verde se conforme, vermelho se viola, amarelo se marginal.
          </o>
          <output tipo="tabela_carteira_completa">
            Tabela consolidada:
            | Título | Sub-carteira | Valor (R$) | Peso (%) | Duration | DV01 | Convexidade |
            Subtotais por sub-carteira e total geral.
          </o>
          <output tipo="grafico_composicao">
            Dois gráficos lado a lado:
            1. Rosca: composição por sub-carteira (imunizada vs. direcional)
            2. Barras: distribuição por vértice (prazo) — mostra a
               "silhueta" da estratégia escolhida sobre a curva
          </o>
        </outputs>
      </secao>

      <!-- ============================================================ -->
      <!--  SEÇÃO 5 — STRESS TEST                                       -->
      <!-- ============================================================ -->
      <secao tipo="stress_test">
        <titulo>4️⃣ Stress Test</titulo>
        <outputs>
          <output tipo="tabela_stress">
            Resultados automáticos para 5 cenários:
            | Cenário | Carteira imunizada (R$) | Carteira direcional (R$) | Total (R$) | Total (%) |
            | Paralelo +100 bps | ...       | ...        | ... | ... |
            | Paralelo +200 bps | ...       | ...        | ... | ... |
            | Paralelo −100 bps | ...       | ...        | ... | ... |
            | Empinamento        | ...       | ...        | ... | ... |
            | Achatamento        | ...       | ...        | ... | ... |
            A carteira imunizada deve ter resultado ≈ 0 em todos os
            cenários paralelos (demonstrando que a imunização funciona).
            A carteira direcional reflete a estratégia escolhida.
          </o>
          <output tipo="grafico_stress">
            Gráfico de barras agrupadas: para cada cenário, duas barras
            (imunizada + direcional) e uma barra de total.
          </o>
          <output tipo="alerta_limites">
            Se algum cenário gera perda que viola limites:
            "⚠️ No cenário [X], a perda total é de R$ [Y], o que
            ultrapassa o limite de perda de [Z]. Considere reduzir
            a duration da carteira direcional ou adicionar hedge."
          </o>
        </outputs>
      </secao>

      <!-- ============================================================ -->
      <!--  SEÇÃO 6 — REFLEXÃO                                          -->
      <!-- ============================================================ -->
      <secao tipo="reflexao">
        <titulo>💬 Questões para Reflexão</titulo>
        <questoes>
          <questao id="1">
            Sua estratégia direcional é coerente com o cenário apresentado?
            Se o cenário se invertesse, quanto perderia?
          </questao>
          <questao id="2">
            A carteira imunizada está de fato protegida? O que aconteceria
            em um cenário de empinamento (não paralelo)?
          </questao>
          <questao id="3">
            Se o limite de DV01 fosse reduzido para R$ 30.000, quais
            ajustes faria na carteira? Onde cortaria risco?
          </questao>
          <questao id="4">
            A convexidade da sua carteira é maior ou menor que a de um
            colega que escolheu outra estratégia? Isso importa?
          </questao>
          <questao id="5">
            Se um título da sua carteira fosse rebaixado (downgrade),
            como isso afetaria o risco total? (Conexão com Módulo 3.)
          </questao>
          <questao id="6">
            Daqui a 6 meses, sua carteira imunizada precisará de
            rebalanceamento? Como estimaria o custo desse rebalanceamento?
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
        app_tesouraria_mod4/
        ├── app.py
        ├── requirements.txt
        ├── config.py
        ├── utils/
        │   ├── math_finance.py         # Herdadas dos módulos anteriores
        │   ├── pricing.py              # Precificadores (importados do Módulo 3)
        │   ├── duration_convexity.py   # Duration, convexidade, DV01
        │   ├── portfolio.py            # Construção e análise de carteiras
        │   ├── immunization.py         # Lógica de imunização e rebalanceamento
        │   ├── strategies.py           # Montagem de estratégias (bullet, barbell, etc.)
        │   ├── stress_test.py          # Cenários e simulação de choques
        │   ├── market_data.py          # Carga de dados
        │   └── formatting.py           # Formatação
        ├── pages/
        │   ├── home.py
        │   ├── mod1_estrategias.py
        │   ├── mod2_risco_taxa.py
        │   ├── mod3_duration_convexidade.py
        │   ├── mod4_imunizacao.py
        │   └── integrador.py
        └── data/
            ├── titulos_disponiveis.csv  # Menu de instrumentos (do Módulo 3)
            ├── curvas_di.csv            # Curvas de juros (do Módulo 2)
            └── parametros_risco.csv     # Volatilidades históricas para VaR
      </arvore>
    </estrutura_de_arquivos>

    <funcoes_utilitarias>
      <descricao>Funções em utils/duration_convexity.py:</descricao>
      <funcao nome="duration_macaulay(fluxos, taxas, dus)">
        Retorna duration Macaulay em anos.
      </funcao>
      <funcao nome="duration_modificada(d_macaulay, ytm)">
        Retorna D* = D / (1 + y).
      </funcao>
      <funcao nome="convexidade(fluxos, taxas, dus)">
        Retorna convexidade do título.
      </funcao>
      <funcao nome="dv01(duration_mod, pu, quantidade)">
        Retorna DV01 em R$.
      </funcao>
      <funcao nome="aproximacao_duration(pu, duration_mod, choque_bps)">
        Retorna ΔPU estimado usando apenas duration.
      </funcao>
      <funcao nome="aproximacao_duration_convexidade(pu, duration_mod, convexidade, choque_bps)">
        Retorna ΔPU estimado usando duration + convexidade.
      </funcao>

      <descricao>Funções em utils/portfolio.py:</descricao>
      <funcao nome="duration_carteira(titulos_df)">
        Retorna duration média ponderada.
      </funcao>
      <funcao nome="dv01_carteira(titulos_df)">
        Retorna DV01 total e por título.
      </funcao>
      <funcao nome="key_rate_durations(titulos_df, vertices)">
        Retorna KRDs por vértice.
      </funcao>
      <funcao nome="verificar_limites(carteira, limites_dict)">
        Retorna dict com status de conformidade por limite.
      </funcao>

      <descricao>Funções em utils/immunization.py:</descricao>
      <funcao nome="calcular_pesos_imunizacao(d_alvo, d_curto, d_longo)">
        Retorna (w_curto, w_longo).
      </funcao>
      <funcao nome="simular_imunizacao(carteira, horizonte, choque_bps)">
        Retorna valor acumulado no horizonte (carry + MtM + reinvestimento).
      </funcao>
      <funcao nome="duration_drift(carteira, meses_decorridos)">
        Retorna duration da carteira e horizonte remanescente.
      </funcao>

      <descricao>Funções em utils/strategies.py:</descricao>
      <funcao nome="montar_bullet(curva, duration_alvo, volume)">
        Retorna carteira bullet concentrada no vértice mais próximo.
      </funcao>
      <funcao nome="montar_barbell(curva, duration_alvo, volume)">
        Retorna carteira barbell nos extremos.
      </funcao>
      <funcao nome="montar_ladder(curva, duration_alvo, volume)">
        Retorna carteira ladder distribuída uniformemente.
      </funcao>
      <funcao nome="montar_riding(curva, horizonte, volume)">
        Retorna carteira riding com títulos de prazo > horizonte.
      </funcao>

      <descricao>Funções em utils/stress_test.py:</descricao>
      <funcao nome="gerar_cenarios_padrao()">
        Retorna lista de cenários pré-definidos com choques por vértice.
      </funcao>
      <funcao nome="aplicar_stress(carteira, cenario)">
        Retorna resultado (P&amp;L) da carteira sob o cenário.
      </funcao>
    </funcoes_utilitarias>

    <padrao_visual>
      Mesmo padrão dos módulos anteriores, com adições:
      <regra>
        Cores por estratégia: Bullet (#2E75B6), Barbell (#C55A11),
        Ladder (#0E7C7B), Riding (#8B5CF6). Consistentes em todos
        os gráficos e tabelas.
      </regra>
      <regra>
        Indicadores de conformidade com limites: ✅ verde (#2E8B57),
        ⚠️ amarelo (#D4A012), ❌ vermelho (#CC3333). Exibidos
        em st.metric ou badges junto às métricas.
      </regra>
      <regra>
        Sliders de choque: usar st.slider com feedback visual imediato.
        O gráfico principal da convexidade (curva real × tangente ×
        parábola) deve atualizar em tempo real ao mover o slider.
      </regra>
    </padrao_visual>

    <integracao_modulos_anteriores>
      <descricao>
        Este módulo consome dados dos módulos anteriores via
        st.session_state ou datasets compartilhados:
        - Curva de juros (Módulo 2): usada para montar estratégias
          e calcular cenários.
        - Precificadores (Módulo 3): usados para calcular PU, duration
          e convexidade de cada título.
        - Menu de instrumentos (Módulo 3): define os títulos disponíveis
          para composição de carteira.
        Fallback: todos os módulos funcionam com dados pré-carregados
        caso os módulos anteriores não tenham sido visitados.
      </descricao>
    </integracao_modulos_anteriores>
  </diretrizes_tecnicas>

  <!-- ================================================================== -->
  <!--  ORIENTAÇÕES PEDAGÓGICAS                                            -->
  <!-- ================================================================== -->

  <orientacoes_pedagogicas>
    <orientacao bloco="1">
      Projetar o "Visualizador de Estratégias" (aba 1.1) para explicar
      cada estratégia visualmente. Usar o "Simulador: Estratégia ×
      Cenário" (aba 1.2) para o exercício de comparação — pedir que
      os alunos prevejam qual estratégia vence antes de revelar.
      O heatmap é valioso para consolidar a intuição.
    </orientacao>
    <orientacao bloco="2">
      O "Analisador de Risco" (aba 2.2) é a ferramenta central do
      Bloco 2. Projetar a decomposição de risco por título e o gráfico
      de KRD para o exercício prático. O "Stress Test" (aba 2.3)
      encerra o bloco com uma aplicação regulatória concreta.
    </orientacao>
    <orientacao bloco="3">
      O gráfico de convexidade (curva real × tangente × parábola) na
      aba 3.2 é O momento pedagógico do módulo. Projetar e mover o
      slider de choque lentamente, pedindo que os alunos observem
      como as três curvas divergem. Repetir para títulos de durations
      diferentes. A comparação Bullet vs. Barbell fecha com chave
      de ouro a ponte entre estratégia (Bloco 1) e ferramentas (Bloco 3).
    </orientacao>
    <orientacao bloco="4">
      Para imunização, usar o "Construtor" (aba 4.1) passo a passo em
      sala. Depois projetar o "Verificador" (aba 4.2) para demonstrar
      que funciona — o gráfico da linha horizontal (carteira imunizada)
      vs. linhas inclinadas (carteiras não imunizadas) é muito
      convincente. Para o exercício integrador, cada grupo usa a
      página completa para montar e testar sua carteira.
    </orientacao>
  </orientacoes_pedagogicas>

</app>
```
