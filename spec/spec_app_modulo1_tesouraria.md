# Guia para Criação do Aplicativo Streamlit — Módulo 1: Principais Operações de Tesouraria

```xml
<app>
  <metadata>
    <titulo>Laboratório de Operações de Tesouraria — Módulo 1</titulo>
    <subtitulo>Principais Operações de Tesouraria</subtitulo>
    <curso>MBA em Bancos e Instituições Financeiras — FGV</curso>
    <publico_alvo>Média e alta gerência de bancos e instituições financeiras</publico_alvo>
    <objetivo_geral>
      Oferecer um ambiente interativo que auxilie os alunos na compreensão dos
      fundamentos de tesouraria bancária, maximizando a intuição gerencial,
      a aplicação prática e a clareza didática. O aplicativo deve funcionar
      como ferramenta complementar às aulas presenciais, permitindo
      experimentação autônoma com os conceitos do Módulo 1.
    </objetivo_geral>
    <principios_de_design>
      <principio id="1">
        Intuição gerencial: cada módulo deve responder a uma pergunta de decisão
        que um gestor de tesouraria enfrentaria no dia a dia, não apenas
        apresentar fórmulas ou cálculos isolados.
      </principio>
      <principio id="2">
        Interatividade significativa: os controles (sliders, inputs, seletores)
        devem representar variáveis reais de decisão — taxas, prazos, cenários,
        volumes — e o feedback visual deve ser imediato.
      </principio>
      <principio id="3">
        Contextualização brasileira: todas as convenções, taxas e instrumentos
        devem refletir o mercado financeiro brasileiro (DU/252, CDI, SELIC,
        COPOM, B3, ANBIMA, BCB).
      </principio>
      <principio id="4">
        Progressão pedagógica: os módulos do aplicativo devem espelhar a
        sequência dos blocos do Módulo 1 do curso, permitindo que o aluno
        avance do fundamento ao caso integrador.
      </principio>
      <principio id="5">
        Clareza visual: gráficos limpos, paleta de cores consistente,
        explicações contextuais (tooltips, expanders) que traduzam
        o conceito para linguagem gerencial.
      </principio>
    </principios_de_design>
  </metadata>

  <!-- ================================================================== -->
  <!--  ARQUITETURA GERAL DO APLICATIVO                                    -->
  <!-- ================================================================== -->

  <arquitetura>
    <descricao>
      O aplicativo é organizado em uma página principal (hub) com navegação
      por cards para quatro módulos interativos, cada um correspondendo a
      um bloco temático do Módulo 1 do curso. Há também uma página de
      exercício integrador que articula os quatro módulos.
    </descricao>

    <navegacao>
      <tipo>sidebar com radio buttons ou selectbox</tipo>
      <paginas>
        <pagina id="home">🏛️ Visão Geral do Módulo</pagina>
        <pagina id="mod1">📐 Matemática Financeira Aplicada</pagina>
        <pagina id="mod2">💰 Mercado Monetário e Taxas de Juros</pagina>
        <pagina id="mod3">🌎 Cenário Econômico e Taxa de Juros</pagina>
        <pagina id="mod4">⚠️ Risco Financeiro e Taxa de Juros</pagina>
        <pagina id="integrador">🧩 Exercício Integrador</pagina>
      </paginas>
    </navegacao>

    <elementos_globais>
      <sidebar>
        <item>Logo/título do curso</item>
        <item>Navegação entre módulos</item>
        <item>
          Rodapé com créditos: "MBA em Bancos e Instituições Financeiras —
          COPPEAD/UFRJ"
        </item>
      </sidebar>
      <paleta_de_cores>
        <cor nome="primaria" hex="#1B3A5C" uso="títulos, cabeçalhos de tabela"/>
        <cor nome="secundaria" hex="#2E75B6" uso="subtítulos, destaques, linhas de gráfico"/>
        <cor nome="accent" hex="#C55A11" uso="alertas, comparações, segunda série de dados"/>
        <cor nome="fundo_claro" hex="#EAF3F8" uso="caixas explicativas, info boxes"/>
        <cor nome="positivo" hex="#2E8B57" uso="ganhos, cenário otimista"/>
        <cor nome="negativo" hex="#CC3333" uso="perdas, cenário pessimista"/>
      </paleta_de_cores>
    </elementos_globais>
  </arquitetura>

  <!-- ================================================================== -->
  <!--  PÁGINA HOME — VISÃO GERAL                                         -->
  <!-- ================================================================== -->

  <pagina id="home">
    <titulo>Visão Geral do Módulo 1 — Principais Operações de Tesouraria</titulo>
    <objetivo>
      Apresentar ao aluno o mapa do módulo, os objetivos de aprendizagem e
      a lógica de progressão entre os blocos. Funciona como orientação
      inicial e ponto de retorno.
    </objetivo>
    <conteudo>
      <elemento tipo="header_banner">
        Título do módulo com subtítulo descritivo e identidade visual do curso.
      </elemento>
      <elemento tipo="texto_introdutorio">
        Breve parágrafo contextualizando o papel da tesouraria bancária e a
        relevância dos temas abordados para gestores de média e alta gerência.
      </elemento>
      <elemento tipo="mapa_do_modulo">
        Representação visual (cards ou diagrama de fluxo) dos quatro blocos,
        mostrando a progressão lógica:
        Matemática Financeira → Mercado Monetário → Cenário Econômico → Risco.
        Cada card exibe o título do bloco, o objetivo de aprendizagem resumido
        e um ícone representativo. Clicável para navegar ao módulo correspondente
        (via st.session_state ou query params, se suportado).
      </elemento>
      <elemento tipo="quadro_resumo">
        Tabela com os tópicos, objetivos e carga horária, reproduzindo de
        forma estilizada o quadro-resumo do documento de abordagem pedagógica.
      </elemento>
    </conteudo>
  </pagina>

  <!-- ================================================================== -->
  <!--  MÓDULO 1 — MATEMÁTICA FINANCEIRA APLICADA                         -->
  <!-- ================================================================== -->

  <pagina id="mod1">
    <titulo>Matemática Financeira Aplicada à Tesouraria</titulo>
    <objetivo_aprendizagem>
      Aplicar modelos matemáticos financeiros fundamentais.
    </objetivo_aprendizagem>
    <pergunta_gerencial>
      "Qual é o preço justo deste título? Qual taxa estou realmente praticando
      nesta operação?"
    </pergunta_gerencial>

    <abas>
      <!-- ============================================================ -->
      <!--  ABA 1.1 — CAPITALIZAÇÃO E TAXAS EQUIVALENTES                -->
      <!-- ============================================================ -->
      <aba id="1.1" titulo="Capitalização e Taxas Equivalentes">
        <objetivo>
          Permitir que o aluno converta taxas entre diferentes bases e
          convenções, visualizando o impacto da capitalização composta
          e entendendo as convenções brasileiras.
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander "📘 Conceito" com explicação concisa sobre regimes de
              capitalização simples e composta, diferença entre taxas nominais
              e efetivas, e as convenções brasileiras DU/252 e DC/360.
              Incluir as fórmulas relevantes em LaTeX.
            </descricao>
            <formulas>
              <formula nome="Capitalização composta">
                VF = VP \times (1 + i)^n
              </formula>
              <formula nome="Taxa equivalente (composta)">
                i_{eq} = (1 + i_{original})^{n_{eq}/n_{original}} - 1
              </formula>
              <formula nome="Conversão DU/252 para período">
                fator = (1 + i_{anual})^{DU/252}
              </formula>
              <formula nome="Conversão DC/360 (linear)">
                fator = 1 + i_{anual} \times DC/360
              </formula>
            </formulas>
          </secao>

          <secao tipo="simulador">
            <titulo>Conversor de Taxas</titulo>
            <descricao>
              Painel interativo onde o aluno insere uma taxa e converte entre
              diferentes bases e convenções.
            </descricao>
            <inputs>
              <input tipo="number_input" label="Taxa de entrada (%)" default="13.75" step="0.25"/>
              <input tipo="selectbox" label="Base da taxa de entrada"
                     opcoes="[% ao ano (252 DU), % ao ano (360 DC), % ao mês, % ao dia (over)]"/>
              <input tipo="selectbox" label="Converter para"
                     opcoes="[% ao ano (252 DU), % ao ano (360 DC), % ao mês, % ao dia (over), Todas]"/>
            </inputs>
            <outputs>
              <output tipo="metrics_row">
                Exibir as taxas equivalentes em st.metric cards, destacando
                a conversão solicitada. Quando "Todas" for selecionado,
                exibir uma tabela com todas as conversões.
              </output>
              <output tipo="info_box">
                Caixa explicativa mostrando o cálculo passo a passo da
                conversão realizada, usando os valores inseridos pelo aluno.
              </output>
            </outputs>
          </secao>

          <secao tipo="simulador">
            <titulo>Impacto da Convenção de Contagem</titulo>
            <descricao>
              Comparar o resultado financeiro de uma mesma operação calculada
              em DU/252 vs. DC/360, evidenciando a diferença prática.
            </descricao>
            <inputs>
              <input tipo="number_input" label="Valor do principal (R$)" default="1000000" step="100000"/>
              <input tipo="number_input" label="Taxa anual (%)" default="13.75" step="0.25"/>
              <input tipo="date_input" label="Data de início"/>
              <input tipo="date_input" label="Data de vencimento"/>
            </inputs>
            <outputs>
              <output tipo="colunas_comparativas">
                Duas colunas lado a lado:
                Coluna 1 — Cálculo por DU/252: número de DU, fator, valor futuro.
                Coluna 2 — Cálculo por DC/360: número de DC, fator, valor futuro.
                Destacar a diferença em R$ e em bps.
              </output>
              <output tipo="nota_pedagogica">
                Texto explicativo: "A diferença de R$ X (Y bps) entre as duas
                convenções pode parecer pequena em uma operação, mas em uma
                carteira de R$ Z bilhões representa um impacto relevante
                para a tesouraria."
              </output>
            </outputs>
            <observacao_tecnica>
              Para o cálculo de DU entre duas datas, utilizar o calendário
              de feriados da ANBIMA. Pode-se usar a biblioteca 'bizdays'
              com o calendário 'ANBIMA' ou uma lista fixa de feriados
              para o ano corrente e o anterior.
            </observacao_tecnica>
          </secao>
        </layout>
      </aba>

      <!-- ============================================================ -->
      <!--  ABA 1.2 — PRECIFICAÇÃO DE TÍTULOS                           -->
      <!-- ============================================================ -->
      <aba id="1.2" titulo="Precificação de Títulos">
        <objetivo>
          Permitir que o aluno precifique títulos públicos e privados,
          compreendendo a relação inversa entre taxa e preço.
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander com explicação sobre PU (preço unitário), relação
              taxa-preço, e convenções de precificação da ANBIMA para
              títulos públicos federais.
            </descricao>
            <formulas>
              <formula nome="PU de LTN (prefixado sem cupom)">
                PU = \frac{1000}{(1 + i)^{DU/252}}
              </formula>
              <formula nome="PU de NTN-F (prefixado com cupom)">
                PU = \sum_{k=1}^{n} \frac{C_k}{(1+i)^{DU_k/252}} + \frac{1000}{(1+i)^{DU_n/252}}
              </formula>
              <formula nome="Duration (Macaulay)">
                D = \frac{\sum_{k=1}^{n} k \times \frac{C_k}{(1+i)^k}}{\sum_{k=1}^{n} \frac{C_k}{(1+i)^k}}
              </formula>
            </formulas>
          </secao>

          <secao tipo="simulador">
            <titulo>Precificador de LTN</titulo>
            <descricao>
              Simulador focado em LTN — o instrumento mais simples —
              para construir a intuição fundamental de taxa vs. preço.
            </descricao>
            <inputs>
              <input tipo="number_input" label="Taxa de mercado (% a.a.)" default="12.50" step="0.10"/>
              <input tipo="slider" label="Prazo até o vencimento (DU)" min="1" max="504" default="252"/>
            </inputs>
            <outputs>
              <output tipo="metric">PU calculado (R$)</output>
              <output tipo="grafico_principal">
                Gráfico de linha mostrando PU (eixo Y) vs. Taxa (eixo X),
                com a taxa atual marcada por um ponto destacado.
                Range sugerido: taxa de 5% a 25%.
                Mensagem visual: "Quando a taxa sobe, o preço cai."
              </output>
              <output tipo="grafico_secundario">
                Gráfico mostrando PU vs. Prazo para a taxa fixa selecionada,
                demonstrando que títulos mais longos são mais sensíveis.
                Sobrepor duas curvas: uma para a taxa atual e outra para
                taxa atual +2pp, evidenciando o "efeito duration".
              </output>
            </outputs>
          </secao>
        </layout>
      </aba>
    </abas>
  </pagina>

  <!-- ================================================================== -->
  <!--  MÓDULO 2 — MERCADO MONETÁRIO E TAXAS DE JUROS                     -->
  <!-- ================================================================== -->

  <pagina id="mod2">
    <titulo>Mercado Monetário e Principais Taxas de Juros</titulo>
    <objetivo_aprendizagem>
      Conhecer a dinâmica do mercado monetário, as suas principais taxas de
      juros, a sua origem, cálculo e aplicação.
    </objetivo_aprendizagem>
    <pergunta_gerencial>
      "Qual benchmark devo usar nesta operação? Como se comparam as taxas
      que estou praticando com as referências do mercado?"
    </pergunta_gerencial>

    <abas>
      <!-- ============================================================ -->
      <!--  ABA 2.1 — SELIC, CDI E O MERCADO INTERBANCÁRIO              -->
      <!-- ============================================================ -->
      <aba id="2.1" titulo="SELIC, CDI e Mercado Interbancário">
        <objetivo>
          Visualizar a formação e o comportamento das taxas SELIC e CDI,
          compreender sua relação e o papel do COPOM.
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander explicando: o que é a taxa SELIC Meta (definida pelo COPOM),
              a SELIC Over (taxa efetiva das operações compromissadas com títulos
              públicos), e o CDI (taxa das operações interbancárias sem lastro em
              títulos públicos). Explicar por que SELIC Over e CDI caminham juntas
              e eventuais descolamentos.
            </descricao>
          </secao>

          <secao tipo="visualizacao">
            <titulo>Painel Histórico SELIC e CDI</titulo>
            <descricao>
              Gráfico interativo com as séries históricas da SELIC Meta,
              SELIC Over e CDI.
            </descricao>
            <dados>
              <fonte>
                Séries do SGS/BCB (Sistema Gerenciador de Séries Temporais):
                - SELIC Meta: série 432
                - SELIC Over (anualizada): série 1178
                - CDI (anualizada): série 4391
                Alternativa: embutir dataset pré-processado em CSV dentro do
                repositório para evitar dependência de API em tempo de aula.
                Recomenda-se cobrir pelo menos os últimos 10 anos.
              </fonte>
            </dados>
            <inputs>
              <input tipo="date_range" label="Período de análise"/>
              <input tipo="multiselect" label="Séries a exibir"
                     opcoes="[SELIC Meta, SELIC Over, CDI]" default="todas"/>
            </inputs>
            <outputs>
              <output tipo="grafico_linhas">
                Gráfico Plotly com as séries selecionadas. Eixo Y: taxa (% a.a.).
                Eixo X: data. Incluir marcadores verticais nos momentos de
                decisão do COPOM (alterações de meta).
                Zoom e hover com valores detalhados.
              </output>
              <output tipo="grafico_spread">
                Gráfico auxiliar (abaixo do principal) mostrando o spread
                SELIC Over − CDI ao longo do tempo, evidenciando que a
                diferença é normalmente muito pequena mas pode oscilar
                em momentos de estresse.
              </output>
              <output tipo="tabela_resumo">
                Estatísticas do período selecionado: média, mínimo, máximo,
                volatilidade (desvio padrão) de cada série.
              </output>
            </outputs>
          </secao>

          <secao tipo="simulador">
            <titulo>Calculadora de CDI Acumulado</titulo>
            <descricao>
              Ferramenta para calcular o fator CDI acumulado entre duas
              datas e o rendimento de uma aplicação indexada ao CDI.
            </descricao>
            <inputs>
              <input tipo="date_input" label="Data início"/>
              <input tipo="date_input" label="Data fim"/>
              <input tipo="number_input" label="Valor aplicado (R$)" default="1000000"/>
              <input tipo="number_input" label="Percentual do CDI (%)" default="100" step="5"
                     help="Ex.: 100% do CDI, 110% do CDI, 80% do CDI"/>
            </inputs>
            <outputs>
              <output tipo="metrics_row">
                - Fator CDI acumulado no período
                - Fator ajustado (% do CDI)
                - Rendimento bruto (R$)
                - Taxa equivalente ao período (%)
                - Taxa anualizada equivalente (% a.a.)
              </output>
              <output tipo="grafico">
                Gráfico da evolução do valor da aplicação dia a dia,
                mostrando a curva de 100% CDI e a curva do percentual
                selecionado sobrepostas.
              </output>
            </outputs>
            <observacao_tecnica>
              O cálculo do CDI acumulado é feito pela produtória dos
              fatores diários: Fator = ∏(1 + CDI_dia_i)^(1/252).
              Usar dados diários do CDI (série 12 do SGS/BCB) ou
              dataset embutido.
            </observacao_tecnica>
          </secao>
        </layout>
      </aba>

      <!-- ============================================================ -->
      <!--  ABA 2.2 — CURVA DE JUROS                                    -->
      <!-- ============================================================ -->
      <aba id="2.2" titulo="Curva de Juros (DI Futuro)">
        <objetivo>
          Visualizar e interpretar a estrutura a termo de taxas de juros
          (curva de juros) formada pelo mercado de DI futuro da B3.
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander explicando: o contrato de DI futuro, como a negociação
              desses contratos na B3 forma a curva de juros, o significado
              econômico da inclinação da curva (expectativa de alta/queda de
              juros, prêmio de risco de prazo), e a importância da curva
              como insumo para precificação de todos os ativos de renda fixa.
            </descricao>
          </secao>

          <secao tipo="visualizacao">
            Importar módulo 1 - ETTJ de laboratório de mercado financeiro em 
            "/laboratorio-mercado-financeiro/ 
        </layout>
      </aba>
    </abas>
  </pagina>

  <!-- ================================================================== -->
  <!--  MÓDULO 3 — CENÁRIO ECONÔMICO E TAXA DE JUROS                      -->
  <!-- ================================================================== -->

  <pagina id="mod3">
    <titulo>Cenário Econômico e Taxa de Juros</titulo>
    <objetivo_aprendizagem>
      Compreender o impacto do cenário econômico no mercado financeiro e
      na taxa de juros.
    </objetivo_aprendizagem>
    <pergunta_gerencial>
      "Dado o cenário macroeconômico que se desenha, para onde vão os juros?
      Como devo posicionar minha carteira?"
    </pergunta_gerencial>

    <abas>
      <!-- ============================================================ -->
      <!--  ABA 3.1 — PAINEL MACROECONÔMICO                             -->
      <!-- ============================================================ -->
      <aba id="3.1" titulo="Painel Macroeconômico">
        <objetivo>
          Oferecer uma visão consolidada das principais variáveis
          macroeconômicas que influenciam a taxa de juros, em formato
          de dashboard gerencial.
        </objetivo>

        <layout>
          <secao tipo="dashboard">
            <titulo>Indicadores Macroeconômicos — Brasil</titulo>
            <descricao>
              Painel estilo "sala de guerra" com os indicadores-chave
              para decisão de tesouraria, organizados em cards e gráficos.
            </descricao>
            <dados>
              <fonte>
                Séries do SGS/BCB e IBGE:
                - IPCA mensal (série 433) e IPCA acumulado 12 meses (série 13522)
                - PIB trimestral
                - Taxa de câmbio R$/USD (série 1)
                - Resultado primário do governo
                - EMBI+ Brasil (spread de risco-país)
                - Expectativas Focus: IPCA, PIB, SELIC, Câmbio
                Alternativa: dataset pré-processado embutido.
              </fonte>
            </dados>
            <elementos>
              <elemento tipo="linha_de_metrics">
                Cards com últimos valores: SELIC Meta, IPCA 12M, Câmbio,
                EMBI+, com setas indicando tendência (alta/baixa vs. mês anterior).
              </elemento>
              <elemento tipo="grafico_multiplo">
                Grid 2×2 com mini-gráficos de séries históricas:
                (1) IPCA acumulado 12M vs. meta de inflação
                (2) Taxa de câmbio R$/USD
                (3) EMBI+ Brasil
                (4) SELIC Meta com marcadores de decisão COPOM
                Cada gráfico com período selecionável (1A, 3A, 5A, 10A).
              </elemento>
            </elementos>
          </secao>

          <secao tipo="visualizacao">
            <titulo>Pesquisa Focus — Expectativas do Mercado</titulo>
            <descricao>
              Exibir a evolução das expectativas do mercado (Focus)
              para as principais variáveis.
            </descricao>
            <inputs>
              <input tipo="selectbox" label="Variável"
                     opcoes="[IPCA (ano corrente), IPCA (ano seguinte),
                              SELIC (ano corrente), SELIC (ano seguinte),
                              PIB (ano corrente), Câmbio (ano corrente)]"/>
              <input tipo="slider" label="Período de observação (meses)" min="3" max="24" default="12"/>
            </inputs>
            <outputs>
              <output tipo="grafico">
                Gráfico de linha mostrando a mediana das expectativas Focus
                ao longo do tempo (eixo X: data da coleta, eixo Y: valor da
                expectativa). Permite visualizar como o consenso de mercado
                evoluiu: "Há 6 meses o mercado esperava SELIC de X% para o
                fim do ano; hoje espera Y%."
              </output>
            </outputs>
          </secao>
        </layout>
      </aba>

      <!-- ============================================================ -->
      <!--  ABA 3.2 — SIMULADOR DE CENÁRIOS                             -->
      <!-- ============================================================ -->
      <aba id="3.2" titulo="Simulador de Cenários">
        <objetivo>
          Permitir que o aluno construa cenários macroeconômicos
          (otimista, base, pessimista) e visualize o impacto sobre
          as taxas de juros e o resultado de uma carteira simplificada.
        </objetivo>

        <layout>
          <secao tipo="simulador">
            <titulo>Construtor de Cenários</titulo>
            <descricao>
              O aluno define premissas para cada cenário e observa
              as implicações sobre a SELIC esperada e a curva de juros.
              Este simulador usa um modelo simplificado (não um modelo
              econométrico completo) para fins didáticos.
            </descricao>
            <inputs>
              <grupo label="Cenário Base (referência)">
                <input tipo="number_input" label="IPCA esperado 12M (%)" default="4.5"/>
                <input tipo="number_input" label="Crescimento do PIB (%)" default="2.0"/>
                <input tipo="selectbox" label="Tendência do câmbio"
                       opcoes="[Estável, Depreciação moderada, Depreciação forte,
                                Apreciação moderada]"/>
                <input tipo="selectbox" label="Cenário fiscal"
                       opcoes="[Neutro, Expansionista, Contracionista]"/>
                <input tipo="selectbox" label="Cenário externo (FED)"
                       opcoes="[Manutenção, Corte de juros, Alta de juros]"/>
              </grupo>
              <grupo label="Cenário Alternativo">
                <descricao>
                  Mesmos inputs do cenário base, permitindo comparação
                  lado a lado. Usar st.columns para exibir os dois
                  cenários em paralelo.
                </descricao>
              </grupo>
            </inputs>
            <logica_simplificada>
              Modelo didático baseado em regras qualitativas:
              - IPCA acima da meta → pressão de alta na SELIC
              - PIB acima do potencial → pressão de alta
              - Câmbio depreciando → pressão de alta (pass-through)
              - Cenário fiscal expansionista → pressão de alta (prêmio de risco)
              - FED subindo juros → pressão de alta (fluxo de capitais)
              Cada fator contribui com um delta (em bps) sobre a SELIC
              atual. A magnitude dos deltas pode ser calibrada pelo
              professor. O modelo NÃO pretende ser preciso — pretende
              construir a intuição de como os fatores se combinam.

              Sugestão: exibir uma "barra de pressão" (tipo termômetro
              ou gauge chart) que mostra o somatório das pressões sobre
              a SELIC, classificando de "forte pressão de queda" a
              "forte pressão de alta".
            </logica_simplificada>
            <outputs>
              <output tipo="comparativo">
                Tabela comparativa dos dois cenários com:
                - Premissas
                - SELIC projetada (nível e direção)
                - Nível qualitativo de pressão (gauge)
                - Implicação para a curva de juros (normal, flat, invertida)
              </output>
              <output tipo="grafico">
                Dois "termômetros" ou gauges lado a lado mostrando
                a pressão agregada sobre a SELIC em cada cenário.
              </output>
              <output tipo="nota_pedagogica">
                "Este modelo é uma simplificação didática. Na prática,
                a tesouraria utiliza modelos econométricos mais
                sofisticados e incorpora fatores adicionais. O objetivo
                aqui é desenvolver a intuição sobre como variáveis macro
                se traduzem em movimentos de juros."
              </output>
            </outputs>
          </secao>
        </layout>
      </aba>
    </abas>
  </pagina>

  <!-- ================================================================== -->
  <!--  MÓDULO 4 — RISCO FINANCEIRO E TAXA DE JUROS                       -->
  <!-- ================================================================== -->

  <pagina id="mod4">
    <titulo>Risco Financeiro e Taxa de Juros</titulo>
    <objetivo_aprendizagem>
      Aplicar a dinâmica da taxa de juros a partir do estudo de riscos
      financeiros.
    </objetivo_aprendizagem>
    <pergunta_gerencial>
      "Quanto risco estou correndo nesta posição? Quanto do spread que
      estou capturando é compensação por risco?"
    </pergunta_gerencial>

    <abas>
      <!-- ============================================================ -->
      <!--  ABA 4.1 — DECOMPOSIÇÃO DA TAXA                              -->
      <!-- ============================================================ -->
      <aba id="4.1" titulo="Decomposição da Taxa de Juros">
        <objetivo>
          Visualizar como uma taxa de juros de operação se decompõe em
          taxa livre de risco + prêmios (crédito, liquidez, prazo).
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander explicando a equação fundamental de decomposição:
              i_operação = i_livre_de_risco + spread_crédito + prêmio_liquidez
              + prêmio_prazo.
              Definir cada componente com linguagem gerencial.
            </descricao>
          </secao>

          <secao tipo="simulador">
            <titulo>Decompositor de Taxas</titulo>
            <descricao>
              O aluno insere os parâmetros de uma operação e visualiza
              a decomposição da taxa em um gráfico de barras empilhadas.
            </descricao>
            <inputs>
              <input tipo="number_input" label="Taxa da operação (% a.a.)" default="15.50" step="0.10"/>
              <input tipo="number_input" label="Taxa livre de risco — SELIC (% a.a.)" default="13.75" step="0.25"/>
              <input tipo="selectbox" label="Rating do emissor"
                     opcoes="[AAA, AA, A, BBB, BB, B, CCC]"
                     help="Define uma faixa indicativa de spread de crédito"/>
              <input tipo="selectbox" label="Liquidez do instrumento"
                     opcoes="[Alta (títulos públicos, DI), Média (debêntures investment grade),
                              Baixa (crédito privado ilíquido)]"/>
              <input tipo="slider" label="Prazo (anos)" min="0.5" max="10" default="3" step="0.5"/>
            </inputs>
            <logica>
              Com base no rating, atribuir uma faixa de spread de crédito
              indicativa (ex.: AAA = 30-60 bps, BBB = 150-250 bps).
              Com base na liquidez, atribuir prêmio de liquidez indicativo.
              O prêmio de prazo é derivado residualmente:
              prêmio_prazo = taxa_operação - taxa_livre_risco - spread_crédito
              - prêmio_liquidez.
              Se o residual for negativo, alertar que a taxa parece
              insuficiente para o risco envolvido.
            </logica>
            <outputs>
              <output tipo="grafico_barras_empilhadas">
                Barra horizontal única (estilo waterfall) mostrando os
                componentes empilhados, cada um com cor distinta:
                - Taxa livre de risco (azul escuro)
                - Spread de crédito (laranja)
                - Prêmio de liquidez (amarelo)
                - Prêmio de prazo (cinza)
                Total = taxa da operação.
              </output>
              <output tipo="grafico_comparativo">
                Se o aluno alterar o rating ou a liquidez, mostrar
                lado a lado a decomposição antes e depois, evidenciando
                qual componente mudou e por quanto.
              </output>
              <output tipo="nota_pedagogica">
                "Quando um gestor de tesouraria avalia uma operação,
                precisa entender se o spread oferecido compensa
                adequadamente cada fonte de risco. Uma taxa atrativa
                pode esconder risco de crédito ou liquidez subestimado."
              </output>
            </outputs>
          </secao>
        </layout>
      </aba>

      <!-- ============================================================ -->
      <!--  ABA 4.2 — RISCO DE MERCADO E MARCAÇÃO A MERCADO              -->
      <!-- ============================================================ -->
      <aba id="4.2" titulo="Risco de Mercado (MtM)">
        <objetivo>
          Simular o efeito da marcação a mercado (Mark-to-Market) sobre
          uma posição de tesouraria, evidenciando como variações nas
          taxas impactam o resultado.
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander explicando: o que é MtM, por que é obrigatório
              (regulação BCB e ANBIMA), diferença entre carregamento
              (accrual) e MtM, e o impacto na volatilidade do resultado
              da tesouraria.
            </descricao>
          </secao>

          <secao tipo="simulador">
            <titulo>Simulador de MtM em Posição de Renda Fixa</titulo>
            <descricao>
              Simular a evolução do valor de uma posição comprada em LTN
              ao longo do tempo, sob diferentes trajetórias de taxa.
            </descricao>
            <inputs>
              <input tipo="number_input" label="Valor na compra (R$)" default="10000000"/>
              <input tipo="number_input" label="Taxa na compra (% a.a.)" default="12.00" step="0.10"/>
              <input tipo="slider" label="Prazo total (DU)" min="63" max="504" default="252"/>
              <input tipo="selectbox" label="Trajetória da taxa de mercado"
                     opcoes="[Estável (taxa constante),
                              Alta gradual (+200 bps em 6 meses),
                              Queda gradual (-200 bps em 6 meses),
                              Choque de alta (+150 bps instantâneo no dia 30),
                              Choque de queda (-150 bps instantâneo no dia 30),
                              Personalizada]"/>
              <input tipo="condicional" condicao="trajetória=Personalizada">
                <input tipo="slider" label="Taxa final (% a.a.)" min="5" max="25" default="14" step="0.25"/>
                <input tipo="selectbox" label="Formato da trajetória"
                       opcoes="[Linear, Exponencial, Degrau no meio]"/>
              </input>
            </inputs>
            <outputs>
              <output tipo="grafico_principal">
                Gráfico com duas linhas sobrepostas ao longo do tempo (DU no eixo X):
                - Linha 1 (azul): valor da posição na curva (accrual)
                  — crescimento gradual até o valor de face.
                - Linha 2 (laranja): valor MtM da posição — reflete
                  a taxa de mercado vigente em cada dia.
                A área entre as duas linhas colorida: verde quando MtM > curva,
                vermelha quando MtM < curva.
              </output>
              <output tipo="metrics_row">
                Ao final do período:
                - Resultado na curva (R$)
                - Resultado MtM (R$)
                - Diferença (R$)
                - Pior momento (maior perda MtM durante o período)
              </output>
              <output tipo="nota_pedagogica">
                "A diferença entre o resultado na curva e o resultado MtM
                é temporária se o título for carregado até o vencimento.
                No entanto, se a tesouraria precisar vender a posição
                antes do vencimento (por necessidade de liquidez ou
                limite de risco), a perda MtM se materializa. Este é
                o dilema fundamental do risco de mercado na tesouraria."
              </output>
            </outputs>
          </secao>
        </layout>
      </aba>

      <!-- ============================================================ -->
      <!--  ABA 4.3 — SPREAD DE CRÉDITO E RISCO-PAÍS                    -->
      <!-- ============================================================ -->
      <aba id="4.3" titulo="Spread de Crédito e Risco-País">
        <objetivo>
          Visualizar o comportamento dos spreads de crédito e do
          risco-país ao longo do tempo, e sua relação com a taxa
          de juros das operações.
        </objetivo>

        <layout>
          <secao tipo="visualizacao">
            <titulo>Evolução dos Spreads de Crédito Corporativo</titulo>
            <descricao>
              Gráfico com a evolução dos spreads médios de debêntures
              por rating ao longo do tempo.
            </descricao>
            <dados>
              <fonte>
                Dados da ANBIMA (índices de debêntures IDA) ou spreads
                médios sobre CDI por faixa de rating.
                Alternativa: dataset pré-processado com spreads
                representativos por trimestre.
              </fonte>
            </dados>
            <outputs>
              <output tipo="grafico">
                Gráfico de linhas com séries por rating (AAA, AA, A, BBB),
                mostrando como os spreads se comprimem em momentos de
                otimismo e se abrem em crises.
              </output>
              <output tipo="nota_pedagogica">
                "A compressão de spreads em períodos de liquidez abundante
                pode levar a uma subestimação do risco de crédito.
                O gestor de tesouraria deve monitorar se o spread que
                está capturando é historicamente adequado para o risco."
              </output>
            </outputs>
          </secao>

          <secao tipo="visualizacao">
            <titulo>EMBI+ e Risco-País</titulo>
            <descricao>
              Série histórica do EMBI+ Brasil (spread soberano) e sua
              relação com momentos de estresse no mercado doméstico.
            </descricao>
            <dados>
              <fonte>
                EMBI+ Brasil (JPMorgan, disponível via IPEADATA ou Bloomberg).
                Alternativa: dataset pré-processado.
              </fonte>
            </dados>
            <outputs>
              <output tipo="grafico">
                Gráfico de linha do EMBI+ com anotações em momentos-chave
                (crise 2008, 2015, COVID 2020, etc.). Sobrepor com a
                SELIC Meta para evidenciar a correlação.
              </output>
            </outputs>
          </secao>
        </layout>
      </aba>
    </abas>
  </pagina>

  <!-- ================================================================== -->
  <!--  EXERCÍCIO INTEGRADOR                                               -->
  <!-- ================================================================== -->

  <pagina id="integrador">
    <titulo>Exercício Integrador — Decisão de Tesouraria</titulo>
    <objetivo>
      Articular todos os conceitos dos Módulos 1 a 4 em uma decisão
      integrada de alocação de tesouraria, simulando o processo
      decisório de um gestor.
    </objetivo>
    <pergunta_gerencial>
      "Dadas as condições de mercado, qual a melhor alocação para a
      carteira de tesouraria?"
    </pergunta_gerencial>

    <layout>
      <secao tipo="cenario">
        <titulo>O Caso</titulo>
        <descricao>
          Apresentar um cenário estilizado, porém realista, de decisão:
          "Você é o gestor da tesouraria de um banco de médio porte e
          tem R$ 50 milhões para alocar. O COPOM decidiu manter a SELIC
          em X%, mas o comunicado sinalizou possibilidade de alta na
          próxima reunião. A inflação acumulada está em Y% e o câmbio
          se depreciou Z% no último mês. A curva de juros está
          [formato]. Você precisa escolher entre as seguintes
          alternativas de alocação."
        </descricao>
        <alternativas>
          <alternativa id="A">
            LTN com vencimento em 1 ano — taxa de X% a.a.
          </alternativa>
          <alternativa id="B">
            NTN-B com vencimento em 3 anos — IPCA + Y% a.a.
          </alternativa>
          <alternativa id="C">
            Operação compromissada (SELIC Over) — overnight, renovação diária
          </alternativa>
          <alternativa id="D">
            Debênture AAA, CDI + Z bps, vencimento 2 anos, liquidez média
          </alternativa>
        </alternativas>
      </secao>

      <secao tipo="simulador_integrado">
        <titulo>Painel de Decisão</titulo>
        <descricao>
          Interface que permite ao aluno montar sua alocação (distribuindo
          os R$ 50 milhões entre as alternativas) e avaliar os resultados
          sob diferentes cenários.
        </descricao>
        <inputs>
          <input tipo="slider" label="Alocação em LTN 1A (%)" min="0" max="100" default="25" step="5"/>
          <input tipo="slider" label="Alocação em NTN-B 3A (%)" min="0" max="100" default="25" step="5"/>
          <input tipo="slider" label="Alocação em Compromissada (%)" min="0" max="100" default="25" step="5"/>
          <input tipo="slider" label="Alocação em Debênture (%)" min="0" max="100" default="25" step="5"/>
          <validacao>
            A soma deve ser 100%. Exibir warning se diferente.
          </validacao>
          <input tipo="selectbox" label="Cenário para projeção"
                 opcoes="[Cenário Base (SELIC estável),
                          Cenário Hawkish (alta de 100 bps em 3 meses),
                          Cenário Dovish (corte de 100 bps em 3 meses),
                          Cenário Estresse (alta de 300 bps + abertura de spread)]"/>
          <input tipo="slider" label="Horizonte de avaliação (meses)" min="1" max="12" default="6"/>
        </inputs>
        <outputs>
          <output tipo="tabela_resultados">
            Tabela com cada alternativa:
            - Valor alocado (R$)
            - Resultado projetado (R$) — no cenário selecionado
            - Rendimento (% e % CDI equivalente)
            - Risco estimado (variação máxima MtM no período)
            - Linha total da carteira
          </output>
          <output tipo="grafico_evolucao">
            Gráfico com a evolução projetada do valor total da carteira
            ao longo do horizonte, com banda de incerteza (cenário
            otimista e pessimista como faixa sombreada).
          </output>
          <output tipo="grafico_composicao">
            Gráfico de pizza (ou treemap) mostrando a composição da carteira,
            com tooltip indicando o rendimento projetado de cada fatia.
          </output>
          <output tipo="analise_automatica">
            Caixa com análise qualitativa automática:
            - "Sua carteira está X% concentrada em prefixados. No cenário
              de alta de juros, isso significa perda MtM de R$ Y."
            - "A alocação em compromissada protege contra alta de juros,
              mas limita o ganho no cenário de cortes."
            - "O risco de crédito da debênture é compensado por um spread
              de Z bps. Historicamente, debêntures AAA raramente sofrem
              default, mas em cenário de estresse a liquidez se deteriora."
          </output>
        </outputs>
      </secao>

      <secao tipo="reflexao">
        <titulo>Questões para Reflexão</titulo>
        <descricao>
          Exibir ao final da página um conjunto de perguntas que estimulem
          a reflexão gerencial — sem resposta automática, para uso em
          discussão em sala ou autoavaliação.
        </descricao>
        <questoes>
          <questao id="1">
            Qual cenário macroeconômico você considera mais provável?
            Sua alocação reflete essa convicção?
          </questao>
          <questao id="2">
            Se o COPOM surpreender com uma decisão inesperada,
            qual alternativa da sua carteira sofre mais?
            Qual se beneficia?
          </questao>
          <questao id="3">
            O spread da debênture compensa o risco de liquidez,
            considerando que a tesouraria pode precisar se desfazer
            da posição antes do vencimento?
          </questao>
          <questao id="4">
            Como a concentração da sua alocação se compara com os
            limites de risco típicos de uma tesouraria bancária?
          </questao>
          <questao id="5">
            Se você pudesse usar derivativos (DI futuro, opções de IDI),
            como complementaria a sua alocação?
            (Tema a ser aprofundado nos módulos seguintes.)
          </questao>
        </questoes>
      </secao>
    </layout>
  </pagina>

  <!-- ================================================================== -->
  <!--  DIRETRIZES TÉCNICAS DE IMPLEMENTAÇÃO                               -->
  <!-- ================================================================== -->

  <diretrizes_tecnicas>
    <linguagem>Python 3.10+</linguagem>
    <framework>Streamlit</framework>
    <bibliotecas_principais>
      <biblioteca nome="streamlit" uso="Framework web"/>
      <biblioteca nome="plotly" uso="Gráficos interativos (preferencial)"/>
      <biblioteca nome="pandas" uso="Manipulação de dados"/>
      <biblioteca nome="numpy" uso="Cálculos numéricos"/>
      <biblioteca nome="bizdays" uso="Calendário de dias úteis ANBIMA" opcional="true"/>
    </bibliotecas_principais>

    <estrutura_de_arquivos>
      <descricao>
        Organizar o código em múltiplos arquivos para manutenibilidade.
        Sugestão de estrutura:
      </descricao>
      <arvore>
        app_tesouraria_mod1/
        ├── app.py                    # Ponto de entrada e navegação
        ├── requirements.txt
        ├── config.py                 # Constantes, paleta de cores, parâmetros globais
        ├── utils/
        │   ├── math_finance.py       # Funções de matemática financeira
        │   ├── market_data.py        # Carga e tratamento de dados de mercado
        │   └── formatting.py         # Formatação de números, moeda, percentuais
        ├── pages/
        │   ├── home.py               # Página inicial
        │   ├── mod1_math_fin.py      # Módulo 1: Matemática Financeira
        │   ├── mod2_mercado_mon.py   # Módulo 2: Mercado Monetário
        │   ├── mod3_cenario.py       # Módulo 3: Cenário Econômico
        │   ├── mod4_risco.py         # Módulo 4: Risco Financeiro
        │   └── integrador.py         # Exercício Integrador
        └── data/
            ├── selic_historica.csv
            ├── cdi_diario.csv
            ├── curvas_di.csv
            ├── focus_expectativas.csv
            ├── embi_brasil.csv
            └── spreads_debentures.csv
      </arvore>
    </estrutura_de_arquivos>

    <padrao_visual>
      <regra>Usar st.set_page_config(layout="wide") para melhor uso do espaço.</regra>
      <regra>
        Aplicar CSS customizado mínimo via st.markdown para ajustar fontes
        e espaçamentos, mantendo consistência com a paleta de cores definida.
      </regra>
      <regra>
        Todos os gráficos em Plotly com template "plotly_white" e cores
        da paleta definida. Desabilitar a barra de ferramentas do Plotly
        (config={"displayModeBar": False}) para limpeza visual.
      </regra>
      <regra>
        Usar st.expander para conteúdo conceitual ("📘 Conceito"), mantendo
        a interface limpa para quem já domina o assunto.
      </regra>
      <regra>
        Usar st.metric para KPIs e valores-chave, organizados em st.columns.
      </regra>
      <regra>
        Usar st.info, st.warning e st.success para notas pedagógicas,
        alertas e resultados positivos, respectivamente.
      </regra>
      <regra>
        Formatar todos os valores monetários em padrão brasileiro
        (R$ 1.234.567,89) e percentuais com vírgula decimal (13,75%).
      </regra>
    </padrao_visual>

    <dados_de_mercado>
      <estrategia>
        Para garantir funcionamento offline em sala de aula, todos os
        datasets devem estar pré-processados em CSV na pasta data/.
        Opcionalmente, implementar carga via API do BCB (SGS) com
        fallback para os CSVs locais. A carga via API deve ser protegida
        por st.cache_data com TTL de 24 horas.
      </estrategia>
      <atualizacao>
        Incluir um script auxiliar (utils/update_data.py) que o professor
        possa executar antes da aula para atualizar os CSVs com dados
        recentes.
      </atualizacao>
    </dados_de_mercado>

    <funcoes_utilitarias>
      <descricao>
        O módulo utils/math_finance.py deve implementar, no mínimo,
        as seguintes funções reutilizáveis:
      </descricao>
      <funcao nome="taxa_equivalente(taxa, de, para)">
        Converte taxa entre bases (anual_252, anual_360, mensal, diaria).
      </funcao>
      <funcao nome="pu_ltn(taxa_anual, du_vencimento)">
        Calcula PU de uma LTN dado taxa e prazo em DU.
      </funcao>
      <funcao nome="fator_cdi_acumulado(cdi_diario_series, data_inicio, data_fim, pct_cdi)">
        Calcula fator CDI acumulado no período com percentual de CDI.
      </funcao>
      <funcao nome="taxa_forward(spot_curto, prazo_curto, spot_longo, prazo_longo)">
        Calcula taxa forward entre dois vértices da curva.
      </funcao>
      <funcao nome="duration_modificada(taxa, prazo_du)">
        Calcula duration modificada de um título zero-coupon.
      </funcao>
      <funcao nome="mtm_posicao(pu_compra, taxa_mercado, du_residual, volume)">
        Calcula o valor MtM de uma posição e o P&amp;L versus custo.
      </funcao>
    </funcoes_utilitarias>

    <acessibilidade>
      <regra>
        Todas as visualizações devem ter alternativa textual (tabela
        resumo abaixo do gráfico) para acessibilidade.
      </regra>
      <regra>
        Usar contraste adequado nas cores (WCAG AA mínimo).
      </regra>
    </acessibilidade>
  </diretrizes_tecnicas>

  <!-- ================================================================== -->
  <!--  ORIENTAÇÕES PEDAGÓGICAS PARA USO EM SALA                          -->
  <!-- ================================================================== -->

  <orientacoes_pedagogicas>
    <orientacao bloco="1">
      Usar a aba "Capitalização e Taxas Equivalentes" para o exercício
      rápido do Bloco 1 da aula presencial: pedir que os alunos
      precifiquem uma LTN usando a aba "Precificação de Títulos"
      primeiro manualmente e depois confiram no simulador.
    </orientacao>
    <orientacao bloco="2">
      No Bloco 2, projetar o "Painel Histórico SELIC e CDI" durante a
      exposição sobre o mercado monetário. Usar a "Calculadora de CDI
      Acumulado" para o exercício guiado com dados reais.
    </orientacao>
    <orientacao bloco="3">
      No Bloco 3, usar o "Simulador de Cenários" para a atividade em
      grupos: cada grupo constrói um cenário e visualiza o resultado.
      A projeção dos gauges de pressão sobre SELIC facilita o debate.
    </orientacao>
    <orientacao bloco="4">
      No Bloco 4, o "Exercício Integrador" do app substitui ou
      complementa o caso em papel: os alunos podem testar diferentes
      alocações e cenários em tempo real, tornando a discussão mais
      dinâmica e quantitativamente fundamentada.
    </orientacao>
    <orientacao geral="pos_aula">
      O aplicativo fica disponível após a aula para que os alunos
      experimentem livremente, alterando parâmetros e cenários.
      Isso reforça os conceitos e estimula a curiosidade sobre os
      módulos seguintes do curso.
    </orientacao>
  </orientacoes_pedagogicas>

</app>
```
