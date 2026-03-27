# Guia para Criação do Aplicativo Streamlit — Módulo 2: Estrutura Temporal das Taxas de Juros no Brasil

```xml
<app>
  <metadata>
    <titulo>Laboratório de Operações de Tesouraria — Módulo 2</titulo>
    <subtitulo>Estrutura Temporal das Taxas de Juros no Brasil</subtitulo>
    <curso>MBA em Bancos e Instituições Financeiras — COPPEAD/UFRJ</curso>
    <publico_alvo>Média e alta gerência de bancos e instituições financeiras</publico_alvo>
    <objetivo_geral>
      Oferecer um ambiente interativo para que os alunos construam, visualizem
      e interpretem a estrutura a termo de taxas de juros no Brasil, desenvolvendo
      a capacidade de "ler a curva" e traduzir essa leitura em decisões de
      tesouraria. O aplicativo complementa as aulas presenciais do Módulo 2
      e permite experimentação autônoma pós-aula.
    </objetivo_geral>
    <prerequisito>
      Módulo 1 do app (Principais Operações de Tesouraria) — os conceitos
      de precificação, taxas referenciais e risco são utilizados como base.
    </prerequisito>
    <principios_de_design>
      <principio id="1">
        Construção progressiva: o aluno parte dos componentes da taxa,
        avança para a curva spot (já implementada — ETTJ), calcula forwards
        e chega ao cupom cambial, numa trajetória que espelha o raciocínio
        de um analista de tesouraria.
      </principio>
      <principio id="2">
        "Ler a curva": cada módulo enfatiza a interpretação gerencial
        dos números — não basta calcular, é preciso saber o que a curva
        está dizendo e quais decisões ela sustenta.
      </principio>
      <principio id="3">
        Dados reais: sempre que possível, usar dados do mercado brasileiro
        (B3, ANBIMA, BCB). Datasets pré-processados garantem funcionamento
        offline em sala de aula.
      </principio>
      <principio id="4">
        Integração com o módulo ETTJ existente: o componente de visualização
        e construção da curva spot (ETTJ) já está pronto e será plugado
        na posição adequada da navegação. Os demais módulos devem ser
        projetados para dialogar com ele sem redundância.
      </principio>
      <principio id="5">
        Consistência visual: mesma paleta de cores, padrões de layout
        e convenções de interface do app do Módulo 1.
      </principio>
    </principios_de_design>
  </metadata>

  <!-- ================================================================== -->
  <!--  ARQUITETURA GERAL DO APLICATIVO                                    -->
  <!-- ================================================================== -->

  <arquitetura>
    <descricao>
      O aplicativo é organizado em uma página principal (hub) com navegação
      para cinco módulos interativos. O módulo de ETTJ (item 2) já está
      implementado e será integrado como componente externo. Os demais
      módulos (1, 3, 4, 5) são o escopo desta especificação.
    </descricao>

    <navegacao>
      <tipo>sidebar com radio buttons ou selectbox</tipo>
      <paginas>
        <pagina id="home">🏛️ Visão Geral do Módulo 2</pagina>
        <pagina id="mod1">🧩 Componentes da Taxa de Juros</pagina>
        <pagina id="mod2" status="PRONTO — plugar módulo ETTJ existente">
          📈 Estrutura Temporal (ETTJ) e Taxa Spot
        </pagina>
        <pagina id="mod3">🔮 Taxa Forward (FRA)</pagina>
        <pagina id="mod4">💱 Cupom Cambial</pagina>
        <pagina id="integrador">🎯 Exercício Integrador — Leitura Completa da Curva</pagina>
      </paginas>
    </navegacao>

    <elementos_globais>
      <sidebar>
        <item>Logo/título do curso</item>
        <item>Indicação: "Módulo 2 — Estrutura Temporal das Taxas de Juros"</item>
        <item>Navegação entre módulos</item>
        <item>Rodapé: "MBA em Bancos e Instituições Financeiras — COPPEAD/UFRJ"</item>
      </sidebar>
      <paleta_de_cores>
        <cor nome="primaria" hex="#1B3A5C" uso="títulos, cabeçalhos de tabela"/>
        <cor nome="secundaria" hex="#2E75B6" uso="subtítulos, curva nominal, destaques"/>
        <cor nome="accent" hex="#C55A11" uso="curva real, alertas, segunda série"/>
        <cor nome="fundo_claro" hex="#EAF3F8" uso="caixas explicativas, info boxes"/>
        <cor nome="positivo" hex="#2E8B57" uso="ganhos, cenário favorável"/>
        <cor nome="negativo" hex="#CC3333" uso="perdas, cenário adverso"/>
        <cor nome="inflacao" hex="#8B5CF6" uso="inflação implícita, terceira série"/>
        <cor nome="dolar" hex="#059669" uso="cupom cambial, séries em dólar"/>
      </paleta_de_cores>
      <convencao_de_interface>
        Manter o mesmo padrão do app do Módulo 1:
        - st.expander para conteúdo conceitual ("📘 Conceito")
        - st.metric para KPIs em st.columns
        - st.info / st.warning / st.success para notas pedagógicas
        - Gráficos Plotly com template "plotly_white"
        - Formatação brasileira (R$ 1.234,56 / 13,75%)
      </convencao_de_interface>
    </elementos_globais>
  </arquitetura>

  <!-- ================================================================== -->
  <!--  PÁGINA HOME — VISÃO GERAL DO MÓDULO 2                             -->
  <!-- ================================================================== -->

  <pagina id="home">
    <titulo>Visão Geral do Módulo 2 — Estrutura Temporal das Taxas de Juros</titulo>
    <objetivo>
      Apresentar o mapa do módulo, a lógica de progressão e a conexão com
      o Módulo 1. Orientação inicial e ponto de retorno.
    </objetivo>
    <conteudo>
      <elemento tipo="header_banner">
        Título do módulo com identidade visual do curso.
      </elemento>
      <elemento tipo="texto_introdutorio">
        Parágrafo contextualizando a importância da ETTJ para a tesouraria
        bancária: "A curva de juros é o principal insumo de precificação
        da tesouraria. Neste módulo, você vai aprender a construí-la,
        lê-la e usá-la para tomar decisões."
      </elemento>
      <elemento tipo="mapa_do_modulo">
        Representação visual (cards ou diagrama de fluxo horizontal)
        mostrando a progressão:
        Componentes → ETTJ/Spot → Forward → Cupom Cambial → Integrador.
        O card de ETTJ/Spot deve ter indicação visual de "já implementado"
        (ex.: ícone de check ou badge "ativo"). Cada card com título,
        pergunta gerencial e ícone. Clicável para navegar.
      </elemento>
      <elemento tipo="conexao_modulo1">
        Caixa "🔗 Conexão com o Módulo 1" indicando quais conceitos do
        Módulo 1 são pré-requisitos e quais são aprofundados aqui.
        Breve e visual — não repetir conteúdo.
      </elemento>
    </conteudo>
  </pagina>

  <!-- ================================================================== -->
  <!--  MÓDULO 1 — COMPONENTES DA TAXA DE JUROS                           -->
  <!-- ================================================================== -->

  <pagina id="mod1">
    <titulo>Componentes da Taxa de Juros</titulo>
    <objetivo_aprendizagem>
      Aplicar a dinâmica das taxas de juros no tempo a partir dos seus
      componentes.
    </objetivo_aprendizagem>
    <pergunta_gerencial>
      "Por que um título de 5 anos paga mais que um de 1 ano? De onde vem
      cada pedaço dessa taxa?"
    </pergunta_gerencial>
    <conexao_modulo_anterior>
      Aprofunda o conceito de decomposição da taxa introduzido no
      Módulo 1 (Bloco 4 — Risco Financeiro e Taxa de Juros).
    </conexao_modulo_anterior>

    <abas>
      <!-- ============================================================ -->
      <!--  ABA 1.1 — DECOMPOSIÇÃO VISUAL                               -->
      <!-- ============================================================ -->
      <aba id="1.1" titulo="Anatomia da Taxa de Juros">
        <objetivo>
          Visualizar de forma interativa como uma taxa de juros se decompõe
          em seus componentes fundamentais e como cada componente varia
          com o prazo.
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander "📘 Conceito" com explicação dos cinco componentes:
              (1) taxa real livre de risco, (2) expectativa de inflação,
              (3) prêmio de crédito, (4) prêmio de liquidez,
              (5) prêmio de prazo (term premium).
              Apresentar a equação conceitual em LaTeX:
              i_{nominal} = i_{real} + \pi^e + \phi_{crédito} + \phi_{liquidez} + \phi_{prazo}
              Explicar cada componente em linguagem gerencial: o que é,
              por que existe, quem o demanda e quem o paga.
            </descricao>
          </secao>

          <secao tipo="simulador">
            <titulo>Decompositor Interativo por Prazo</titulo>
            <descricao>
              Painel onde o aluno ajusta os componentes e observa como eles
              se combinam para formar a taxa total em diferentes prazos.
              A ideia central é que o aluno "monte" a taxa de um título
              e entenda de onde vem cada pedaço.
            </descricao>
            <inputs>
              <grupo label="Componentes base (inputs do mercado)">
                <input tipo="number_input" label="Taxa real livre de risco (% a.a.)" default="5.00" step="0.25"
                       help="Proxy: juro real da NTN-B curta ou SELIC real ex-ante"/>
                <input tipo="number_input" label="Expectativa de inflação — IPCA (% a.a.)" default="4.50" step="0.25"
                       help="Mediana Focus ou inflação implícita"/>
              </grupo>
              <grupo label="Prêmios (ajustar conforme o instrumento)">
                <input tipo="selectbox" label="Risco de crédito"
                       opcoes="[Soberano (0 bps), AAA (30-60 bps), AA (60-120 bps),
                                A (120-200 bps), BBB (200-350 bps)]"/>
                <input tipo="selectbox" label="Liquidez do instrumento"
                       opcoes="[Alta — DI/Títulos Públicos (0-10 bps),
                                Média — Debêntures IG (20-60 bps),
                                Baixa — Crédito ilíquido (60-150 bps)]"/>
              </grupo>
              <grupo label="Prazo">
                <input tipo="slider" label="Prazo do instrumento (anos)"
                       min="0.25" max="10" default="3" step="0.25"
                       help="Ao variar o prazo, observe como o prêmio de prazo
                       altera a composição da taxa"/>
              </grupo>
            </inputs>
            <logica>
              O prêmio de prazo é calculado automaticamente com base no prazo
              selecionado, usando uma função crescente e côncava (ex.:
              term_premium = alpha × ln(1 + prazo), com alpha calibrável,
              default ~30 bps por ano em log). Os prêmios de crédito e liquidez
              são mapeados a partir da seleção do usuário (ponto médio da faixa).
              A taxa nominal total é a soma de todos os componentes.
            </logica>
            <outputs>
              <output tipo="grafico_waterfall">
                Gráfico waterfall (cascata) horizontal mostrando a construção
                da taxa: cada barra representa um componente, empilhando até
                a taxa final.
                Cores:
                - Taxa real: azul escuro (#1B3A5C)
                - Inflação esperada: roxo (#8B5CF6)
                - Prêmio de crédito: laranja (#C55A11)
                - Prêmio de liquidez: amarelo (#D4A012)
                - Prêmio de prazo: cinza (#888888)
                - Total: barra destacada com borda
              </output>
              <output tipo="grafico_area_por_prazo">
                Gráfico de área empilhada (eixo X: prazo de 3M a 10A,
                eixo Y: taxa % a.a.) mostrando como cada componente
                contribui para a taxa total em cada prazo.
                Fixa os componentes de crédito e liquidez (seleção atual)
                e varia o prêmio de prazo conforme a função definida.
                Resultado: uma curva de juros "construída" componente a
                componente, que o aluno pode comparar mentalmente com a
                curva real do mercado.
              </output>
              <output tipo="metrics_row">
                - Taxa nominal total (% a.a.)
                - Spread total sobre a taxa livre de risco (bps)
                - Prêmio de prazo no vértice selecionado (bps)
              </output>
              <output tipo="nota_pedagogica">
                "Na prática, os componentes não são diretamente observáveis
                — o mercado negocia a taxa total. Decompor é um exercício
                analítico que ajuda o gestor a avaliar se a taxa oferecida
                compensa adequadamente cada fonte de risco."
              </output>
            </outputs>
          </secao>
        </layout>
      </aba>

      <!-- ============================================================ -->
      <!--  ABA 1.2 — INFLAÇÃO IMPLÍCITA (BREAKEVEN)                    -->
      <!-- ============================================================ -->
      <aba id="1.2" titulo="Inflação Implícita (Breakeven)">
        <objetivo>
          Calcular e interpretar a inflação implícita a partir das taxas
          de títulos prefixados (LTN) e indexados à inflação (NTN-B),
          entendendo o que o mercado precifica de inflação futura.
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander explicando a relação de Fisher e o conceito de
              breakeven inflation:
              (1 + i_{nominal}) = (1 + i_{real}) × (1 + π^{implícita})
              Portanto: π^{implícita} = (1 + i_{LTN}) / (1 + i_{NTN-B}) - 1
              Explicar que a inflação implícita NÃO é igual à expectativa
              de inflação pura — ela inclui um prêmio de risco de inflação.
              Se breakeven > Focus, pode significar que o mercado exige um
              prêmio adicional pela incerteza inflacionária.
            </descricao>
          </secao>

          <secao tipo="simulador">
            <titulo>Calculadora de Inflação Implícita</titulo>
            <descricao>
              O aluno insere taxas de mercado (ou usa valores pré-carregados)
              e obtém a inflação implícita, comparando com a expectativa Focus.
            </descricao>
            <inputs>
              <input tipo="selectbox" label="Modo"
                     opcoes="[Usar dados pré-carregados (data de referência),
                              Inserir taxas manualmente]"/>
              <grupo label="Dados manuais (condicional: modo manual)" condicional="true">
                <input tipo="number_input" label="Taxa LTN — prefixado (% a.a.)" default="12.80" step="0.05"/>
                <input tipo="number_input" label="Taxa NTN-B — IPCA+ (% a.a.)" default="6.50" step="0.05"/>
                <input tipo="number_input" label="Expectativa Focus — IPCA (% a.a.)" default="4.50" step="0.10"/>
              </grupo>
              <grupo label="Dados pré-carregados (condicional: modo automático)" condicional="true">
                <input tipo="selectbox" label="Data de referência"
                       opcoes="[datas disponíveis no dataset, com labels descritivos]"
                       help="Datas selecionadas de momentos relevantes do mercado"/>
                <input tipo="selectbox" label="Prazo"
                       opcoes="[1 ano, 2 anos, 3 anos, 5 anos]"
                       help="Prazos para os quais há dados de LTN e NTN-B"/>
              </grupo>
            </inputs>
            <outputs>
              <output tipo="metrics_row">
                - Inflação implícita (breakeven) — % a.a.
                - Expectativa Focus (IPCA) — % a.a.
                - Diferença (breakeven − Focus) — pontos percentuais
                  Colorir: verde se diferença < 0.3pp, amarelo se 0.3-0.8pp,
                  vermelho se > 0.8pp.
              </output>
              <output tipo="grafico_comparativo">
                Gráfico de barras lado a lado: inflação implícita vs.
                expectativa Focus, para cada prazo disponível.
                Visualiza o "sorriso" ou "carranca" da inflação implícita
                ao longo da curva — se o breakeven é maior nos prazos
                longos, o mercado precifica maior incerteza inflacionária
                no horizonte mais distante.
              </output>
              <output tipo="interpretacao_automatica">
                Caixa de análise:
                - Se breakeven > Focus: "O mercado está precificando
                  inflação ACIMA do consenso Focus. Isso pode refletir
                  um prêmio de risco de inflação elevado, ou uma visão
                  mais pessimista sobre a trajetória de preços."
                - Se breakeven ≈ Focus: "A inflação implícita está
                  alinhada com o consenso. O prêmio de risco de
                  inflação parece neutro."
                - Se breakeven < Focus: "O mercado precifica inflação
                  ABAIXO do consenso — cenário raro que pode indicar
                  forte demanda por proteção inflacionária (NTN-B)
                  ou expectativa de desaceleração."
                - Implicação para a tesouraria: "Se você acredita que
                  a inflação ficará abaixo do breakeven, prefixados
                  oferecem melhor retorno. Se acredita que ficará acima,
                  indexados (IPCA+) são mais atrativos."
              </output>
            </outputs>
          </secao>

          <secao tipo="visualizacao">
            <titulo>Evolução Histórica da Inflação Implícita</titulo>
            <descricao>
              Série temporal do breakeven para diferentes prazos,
              sobreposta com o IPCA realizado e a meta de inflação.
            </descricao>
            <dados>
              <fonte>
                Dataset pré-processado com taxas de LTN e NTN-B para
                datas selecionadas (frequência mensal ou quinzenal).
                Calcular o breakeven para cada data. Sobrepor com:
                - IPCA acumulado 12M (SGS/BCB, série 13522)
                - Meta de inflação (3,0% a partir de 2025, 3,25% em 2024, etc.)
                Alternativa: embutir dataset já com breakeven calculado.
              </fonte>
            </dados>
            <inputs>
              <input tipo="selectbox" label="Prazo do breakeven"
                     opcoes="[1 ano, 2 anos, 3 anos, 5 anos]"/>
              <input tipo="date_range" label="Período"/>
            </inputs>
            <outputs>
              <output tipo="grafico">
                Gráfico Plotly com 3 linhas:
                - Inflação implícita (roxo, #8B5CF6)
                - IPCA acumulado 12M (laranja, #C55A11)
                - Meta de inflação (cinza tracejado)
                Faixa de tolerância da meta como área sombreada.
                Hover com valores. Permite identificar momentos em que
                o breakeven se descolou fortemente do realizado.
              </output>
            </outputs>
          </secao>
        </layout>
      </aba>
    </abas>
  </pagina>

  <!-- ================================================================== -->
  <!--  MÓDULO 2 — ETTJ E TAXA SPOT (JÁ IMPLEMENTADO)                     -->
  <!-- ================================================================== -->

  <pagina id="mod2" status="JA_IMPLEMENTADO">
    <titulo>Estrutura Temporal (ETTJ) e Taxa Spot</titulo>
    <nota_de_integracao>
      Este módulo já está implementado no componente ETTJ existente.
      A integração deve seguir as seguintes diretrizes:

      1. POSICIONAMENTO: Este módulo ocupa a segunda posição na navegação,
         entre "Componentes da Taxa" e "Taxa Forward". A navegação lateral
         deve incluí-lo com o mesmo padrão visual dos demais módulos.

      2. INTERFACE DE DADOS: O módulo ETTJ existente deve expor (via
         st.session_state ou função pública) os seguintes dados para
         consumo pelos módulos subsequentes:
         - curva_spot: dict ou DataFrame com {prazo_du: taxa_spot_anual}
           para a data selecionada pelo usuário.
         - data_referencia: date — a data da curva selecionada.
         - vertices_disponiveis: lista de prazos em DU disponíveis.
         Esses dados serão consumidos pelos módulos de Forward (mod3)
         e pelo Exercício Integrador (mod5).

      3. CONSISTÊNCIA: Se o módulo ETTJ usa uma paleta de cores ou
         formatação diferente, ajustar para a paleta global do app.

      4. FUNCIONALIDADES ESPERADAS DO MÓDULO ETTJ (para referência):
         - Visualização da curva spot para uma ou mais datas
         - Extração de taxas a partir de PUs de DI futuro
         - Interpolação Flat Forward entre vértices
         - Comparação de curvas de datas diferentes
         Caso alguma dessas funcionalidades não esteja presente,
         considerar adicioná-la.
    </nota_de_integracao>
  </pagina>

  <!-- ================================================================== -->
  <!--  MÓDULO 3 — TAXA FORWARD (FRA)                                      -->
  <!-- ================================================================== -->

  <pagina id="mod3">
    <titulo>Taxa Forward (FRA)</titulo>
    <objetivo_aprendizagem>
      Calcular as taxas forward e analisar as principais aplicações das
      taxas forward.
    </objetivo_aprendizagem>
    <pergunta_gerencial>
      "O que o mercado está precificando de CDI para os próximos semestres?
      Se minha visão é diferente, como posso me posicionar?"
    </pergunta_gerencial>
    <conexao_modulo_anterior>
      Usa diretamente a curva spot construída no módulo ETTJ.
      Idealmente, se o aluno construiu uma curva no módulo anterior,
      ela pode ser importada via session_state.
    </conexao_modulo_anterior>

    <abas>
      <!-- ============================================================ -->
      <!--  ABA 3.1 — CALCULADORA DE FORWARDS                           -->
      <!-- ============================================================ -->
      <aba id="3.1" titulo="Calculadora de Forwards Implícitas">
        <objetivo>
          Calcular as taxas forward a partir da curva spot e visualizá-las
          como um mapa das expectativas (+ prêmio) do mercado para
          diferentes períodos futuros.
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander "📘 Conceito" com:
              - Definição da taxa forward: "a taxa que o mercado hoje
                trava para um período que começa no futuro"
              - Fórmula de não-arbitragem adaptada para DU/252:
                (1 + s_2)^{DU_2/252} = (1 + s_1)^{DU_1/252} × (1 + f_{1,2})^{(DU_2 - DU_1)/252}
                Isolando:
                f_{1,2} = [(1 + s_2)^{DU_2/252} / (1 + s_1)^{DU_1/252}]^{252/(DU_2 - DU_1)} - 1
              - Interpretação: "Se a spot de 1 ano é 12% e a spot de
                2 anos é 13%, a forward de 1-2 anos é superior a 13%
                — o mercado precifica juros mais altos no segundo ano."
              - Relação com expectativas: forward ≈ CDI esperado + prêmio
                de prazo. Separar os dois é o grande desafio analítico.
            </descricao>
          </secao>

          <secao tipo="simulador">
            <titulo>Painel de Forwards Implícitas</titulo>
            <descricao>
              Interface principal para cálculo e visualização das forwards.
              Pode consumir a curva do módulo ETTJ (session_state) ou
              receber inputs manuais.
            </descricao>
            <inputs>
              <input tipo="selectbox" label="Fonte da curva spot"
                     opcoes="[Importar do módulo ETTJ (se disponível),
                              Usar dataset pré-carregado,
                              Inserir manualmente]"/>
              <grupo label="Curva manual (condicional)" condicional="true">
                <descricao>
                  Tabela editável (st.data_editor) com colunas:
                  Vértice (label), Prazo (DU), Taxa spot (% a.a.).
                  Pré-populada com 6-8 vértices de referência.
                  O aluno pode editar as taxas para explorar cenários.
                </descricao>
              </grupo>
              <grupo label="Dataset pré-carregado (condicional)" condicional="true">
                <input tipo="selectbox" label="Data de referência"
                       opcoes="[datas disponíveis com labels descritivos]"/>
              </grupo>
            </inputs>
            <outputs>
              <output tipo="tabela_forwards">
                Tabela formatada com colunas:
                | Período | DU início | DU fim | Spot início | Spot fim | Forward (% a.a.) | Forward (CDI equiv. mensal) |
                Exemplo de linhas:
                | Hoje → 6M  | 0   | 126 | —     | 12.30% | 12.30% | 0.97% |
                | 6M → 1A    | 126 | 252 | 12.30% | 12.80% | 13.31% | 1.05% |
                | 1A → 2A    | 252 | 504 | 12.80% | 13.50% | 14.21% | 1.11% |
                | ...        |     |     |        |        |        |       |
                A coluna "CDI equiv. mensal" facilita a intuição:
                "o mercado precifica CDI médio de ~1.05% a.m. entre
                6 meses e 1 ano".
                Colorir: cells com forward acima da SELIC atual em
                laranja, abaixo em verde.
              </output>
              <output tipo="grafico_principal">
                Gráfico Plotly com duas séries:
                - Curva spot (linha contínua azul, #2E75B6)
                - Forwards entre vértices (barras ou degraus, laranja #C55A11)
                Eixo X: prazo (em anos ou DU, com labels semestrais).
                Eixo Y: taxa (% a.a.).
                As forwards são exibidas como "degraus" entre os vértices,
                criando uma representação visual intuitiva: cada degrau
                é a taxa que o mercado precifica para aquele intervalo.
                Incluir linha horizontal tracejada com a SELIC Meta atual
                para referência.
              </output>
              <output tipo="interpretacao_automatica">
                Caixa de análise baseada no padrão das forwards:
                - Forwards crescentes ao longo do prazo:
                  "O mercado precifica ALTA de juros — as forwards são
                  progressivamente maiores, indicando que o CDI esperado
                  para períodos mais distantes é superior ao atual."
                - Forwards decrescentes:
                  "O mercado precifica QUEDA de juros — as forwards
                  diminuem, sugerindo que o CDI futuro será menor
                  que o atual."
                - Forwards com pico intermediário:
                  "O mercado precifica alta no curto prazo seguida de
                  queda — padrão típico de fim de ciclo de aperto."
                - Spread máximo: "A maior forward é X% no período Y-Z,
                  Y bps acima da SELIC atual."
              </output>
            </outputs>
          </secao>
        </layout>
      </aba>

      <!-- ============================================================ -->
      <!--  ABA 3.2 — FRA E ESTRATÉGIAS                                  -->
      <!-- ============================================================ -->
      <aba id="3.2" titulo="FRA de DI e Estratégias de Tesouraria">
        <objetivo>
          Conectar as taxas forward teóricas ao instrumento de mercado
          (FRA de DI) e explorar como a tesouraria traduz convicções
          sobre juros futuros em posições de mercado.
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander com:
              - O FRA de DI na B3: não é um contrato listado único,
                mas a combinação de duas pernas de DI futuro (compra de
                um vértice e venda de outro). Ex.: comprar Jan26 e vender
                Jul25 equivale a "comprar" a forward Jul25-Jan26.
              - Terminologia: "tomar" (apostar em alta) vs. "dar" (apostar
                em queda) a forward.
              - Usos na tesouraria: travar custo de funding futuro,
                hedge de rolagem de passivos, posição direcional em
                um período específico.
            </descricao>
          </secao>

          <secao tipo="simulador">
            <titulo>Simulador de Estratégia com FRA</titulo>
            <descricao>
              O aluno define uma posição em FRA e simula o resultado
              sob diferentes cenários de realização do CDI.
            </descricao>
            <inputs>
              <input tipo="selectbox" label="Período do FRA"
                     opcoes="[Gerados dinamicamente a partir dos vértices da curva:
                              ex.: 0-6M, 6M-1A, 1A-18M, 18M-2A, ...]"/>
              <input tipo="selectbox" label="Posição"
                     opcoes="[Tomador (aposta que CDI será MAIOR que a forward),
                              Doador (aposta que CDI será MENOR que a forward)]"/>
              <input tipo="number_input" label="Volume nocional (R$)"
                     default="10000000" step="1000000"/>
              <input tipo="slider" label="CDI realizado no período (% a.a.)"
                     min="5.00" max="25.00" step="0.25"
                     default="valor da forward calculada"
                     help="Simule: se o CDI realizar em X%, qual o resultado?"/>
            </inputs>
            <outputs>
              <output tipo="metrics_row">
                - Forward contratada (% a.a.)
                - CDI realizado (simulado) (% a.a.)
                - Diferença (bps)
                - Resultado financeiro (R$) — positivo se a aposta estiver
                  correta, negativo caso contrário.
              </output>
              <output tipo="grafico_payoff">
                Gráfico de P&amp;L da posição (eixo X: CDI realizado de
                5% a 25%; eixo Y: resultado em R$).
                Linha vermelha cruzando zero no ponto onde CDI = forward.
                Região positiva colorida em verde, negativa em vermelho.
                Ponto do CDI simulado destacado no gráfico.
              </output>
              <output tipo="nota_pedagogica">
                "O FRA permite à tesouraria 'isolar' a exposição a um
                período específico da curva. Um tomador de FRA 6M-1A
                ganha se o CDI nos próximos 6 meses (começando daqui
                a 6 meses) for maior que a forward. Isso é equivalente
                a comprar DI futuro de 1 ano e vender DI futuro de 6 meses."
              </output>
            </outputs>
          </secao>

          <secao tipo="simulador">
            <titulo>Comparador de Visões</titulo>
            <descricao>
              Ferramenta que permite ao aluno sobrepor sua visão de
              trajetória do CDI sobre as forwards do mercado, identificando
              onde há oportunidade (ou divergência).
            </descricao>
            <inputs>
              <descricao>
                Tabela editável (st.data_editor) com colunas:
                | Período | Forward do mercado (% a.a.) | Sua visão de CDI (% a.a.) |
                A coluna "Forward" vem preenchida a partir do cálculo
                da aba anterior. A coluna "Sua visão" começa igual à
                forward e o aluno edita conforme sua convicção.
              </descricao>
            </inputs>
            <outputs>
              <output tipo="grafico_sobreposicao">
                Gráfico com duas séries de "degraus":
                - Forwards do mercado (azul)
                - Visão do aluno (laranja tracejado)
                Áreas de divergência sombreadas:
                - Verde onde visão &lt; forward (oportunidade de "dar")
                - Vermelho onde visão > forward (oportunidade de "tomar")
              </output>
              <output tipo="tabela_oportunidades">
                Tabela resumo:
                | Período | Forward | Sua visão | Divergência | Estratégia sugerida |
                | 6M-1A   | 13.31%  | 12.50%    | -81 bps     | Dar FRA 6M-1A       |
                | 1A-2A   | 14.21%  | 14.80%    | +59 bps     | Tomar FRA 1A-2A     |
              </output>
              <output tipo="nota_pedagogica">
                "Na prática, divergir do mercado tem custo: se sua visão
                estiver errada, a posição gera perda. O tamanho da
                divergência (em bps) e a convicção do gestor determinam
                o tamanho da posição. Nunca aposte mais do que sua
                convicção justifica — o mercado pode estar certo."
              </output>
            </outputs>
          </secao>
        </layout>
      </aba>
    </abas>
  </pagina>

  <!-- ================================================================== -->
  <!--  MÓDULO 4 — CUPOM CAMBIAL                                          -->
  <!-- ================================================================== -->

  <pagina id="mod4">
    <titulo>Cupom Cambial</titulo>
    <objetivo_aprendizagem>
      Calcular o cupom cambial e compreender a aplicação do cupom cambial
      no mercado financeiro.
    </objetivo_aprendizagem>
    <pergunta_gerencial>
      "Quanto custa para minha tesouraria carregar uma posição em dólar
      com hedge? Faz sentido captar em dólar e converter para reais?"
    </pergunta_gerencial>

    <abas>
      <!-- ============================================================ -->
      <!--  ABA 4.1 — PARIDADE E CÁLCULO                                -->
      <!-- ============================================================ -->
      <aba id="4.1" titulo="Paridade Coberta e Cálculo do Cupom">
        <objetivo>
          Compreender a relação de paridade coberta de juros (CIP) e
          calcular o cupom cambial a partir dos dados de mercado.
        </objetivo>

        <layout>
          <secao tipo="conceito">
            <descricao>
              Expander "📘 Conceito" com:
              - Definição intuitiva: "O cupom cambial é a taxa de juros
                em dólar que você obtém investindo em reais com hedge
                cambial. É a taxa em dólar 'onshore' — determinada pelo
                mercado brasileiro, não pelo FED."
              - Equação da paridade coberta (CIP):
                (1 + i_{BRL})^{DU/252} = (1 + cupom_{cambial} × DC/360) × (F/S)
                onde F = dólar futuro, S = dólar spot.
                Isolando:
                cupom_{cambial} = {[(1 + i_{DI})^{DU/252} / (F/S)] - 1} × (360/DC)
              - Convenção de contagem: o cupom cambial usa DC/360
                (convenção linear internacional), diferente do DI que
                usa DU/252 (composta).
              - Por que cupom ≠ SOFR: o cupom reflete condições do
                mercado onshore (risco-país, demanda por hedge, fluxo
                de capitais), enquanto SOFR é determinada pelo mercado
                americano. A diferença cupom − SOFR oscila e tem
                significado econômico.
            </descricao>
          </secao>

          <secao tipo="simulador">
            <titulo>Calculadora de Cupom Cambial</titulo>
            <descricao>
              O aluno insere (ou seleciona) dados de mercado e calcula
              o cupom cambial implícito para diferentes prazos.
            </descricao>
            <inputs>
              <input tipo="selectbox" label="Modo"
                     opcoes="[Usar dados pré-carregados, Inserir manualmente]"/>
              <grupo label="Dados manuais (condicional)" condicional="true">
                <input tipo="number_input" label="Dólar spot — PTAX (R$/US$)"
                       default="5.45" step="0.01"/>
                <input tipo="number_input" label="Dólar futuro — vencimento selecionado (R$/US$)"
                       default="5.52" step="0.01"/>
                <input tipo="number_input" label="Taxa DI para o mesmo prazo (% a.a.)"
                       default="13.25" step="0.10"/>
                <input tipo="number_input" label="Dias úteis até o vencimento"
                       default="126" step="1"/>
                <input tipo="number_input" label="Dias corridos até o vencimento"
                       default="183" step="1"/>
              </grupo>
              <grupo label="Dados pré-carregados (condicional)" condicional="true">
                <input tipo="selectbox" label="Data de referência"
                       opcoes="[datas disponíveis]"/>
              </grupo>
            </inputs>
            <outputs>
              <output tipo="metrics_row">
                - Cupom cambial implícito (% a.a., linear DC/360)
                - Referência SOFR (% a.a.) — valor pré-carregado
                - Spread cupom − SOFR (bps)
                - Forward points (F − S) em pontos de dólar
              </output>
              <output tipo="calculo_detalhado">
                Expander "📐 Cálculo passo a passo":
                1. Fator DI: (1 + 0,1325)^(126/252) = X
                2. Razão câmbio: F/S = 5,52/5,45 = Y
                3. Fator cupom: X / Y = Z
                4. Cupom (linear): (Z − 1) × 360/183 = W% a.a.
                Exibir cada passo com os valores efetivos.
              </output>
              <output tipo="nota_pedagogica">
                "O cupom cambial é o 'preço' do hedge cambial. Quando o
                cupom está alto, hedgear posições em dólar é caro para
                a tesouraria. Quando está baixo (ou negativo), o hedge
                pode se tornar uma fonte de receita — situação que já
                ocorreu no Brasil em momentos de forte fluxo cambial."
              </output>
            </outputs>
          </secao>
        </layout>
      </aba>

      <!-- ============================================================ -->
      <!--  ABA 4.2 — CURVA E DINÂMICA DO CUPOM                         -->
      <!-- ============================================================ -->
      <aba id="4.2" titulo="Curva de Cupom Cambial e Dinâmica">
        <objetivo>
          Visualizar a curva de cupom cambial para diferentes prazos,
          entender sua dinâmica e identificar oportunidades e riscos
          para a gestão de posições em moeda estrangeira.
        </objetivo>

        <layout>
          <secao tipo="visualizacao">
            <titulo>Curva de Cupom Cambial</titulo>
            <descricao>
              Exibir a curva de cupom cambial para todos os vértices
              disponíveis, em comparação com a SOFR e com a curva
              DI nominal.
            </descricao>
            <dados>
              <fonte>
                Calcular o cupom cambial para cada vértice disponível
                usando: taxas DI futuro (vários prazos), dólar futuro
                (vários prazos), dólar spot (PTAX).
                Dataset pré-processado com cupom calculado para datas
                selecionadas.
                Adicionalmente: série SOFR (valor fixo ou série curta)
                como referência externa.
              </fonte>
            </dados>
            <inputs>
              <input tipo="selectbox" label="Data de referência"
                     opcoes="[datas disponíveis]"/>
              <input tipo="multiselect" label="Comparar com"
                     opcoes="[SOFR (referência USD offshore),
                              Curva DI nominal (eixo secundário),
                              CDS Brasil 5A (referência risco-país)]"/>
            </inputs>
            <outputs>
              <output tipo="grafico">
                Gráfico Plotly:
                - Eixo X: prazo (meses ou anos)
                - Eixo Y primário: cupom cambial (% a.a.) — cor verde (#059669)
                - Linha horizontal SOFR (tracejada, cinza)
                - Se selecionado: curva DI no eixo Y secundário (azul)
                A diferença visual entre cupom e SOFR evidencia o
                "spread onshore" que reflete condições locais.
              </output>
              <output tipo="tabela">
                Tabela com todos os vértices:
                | Prazo | DI (% a.a.) | Dólar futuro | Cupom (% a.a.) | SOFR | Spread (bps) |
              </output>
            </outputs>
          </secao>

          <secao tipo="visualizacao">
            <titulo>Evolução Histórica do Cupom Cambial</titulo>
            <descricao>
              Série temporal do cupom cambial (prazo de 3 ou 6 meses)
              com anotações de eventos relevantes.
            </descricao>
            <dados>
              <fonte>
                Dataset pré-processado: cupom cambial calculado para
                um prazo fixo (ex.: 3 meses) em frequência diária
                ou semanal, cobrindo pelo menos os últimos 5 anos.
                Alternativa: série do DDI ou FRC da B3.
              </fonte>
            </dados>
            <inputs>
              <input tipo="selectbox" label="Prazo do cupom"
                     opcoes="[3 meses, 6 meses, 1 ano]"/>
              <input tipo="date_range" label="Período"/>
            </inputs>
            <outputs>
              <output tipo="grafico">
                Gráfico de linha (verde, #059669) com:
                - Anotações em momentos de estresse:
                  ex.: "Virada de ano 2022 — cupom disparou por demanda
                  pontual de hedge", "COVID mar/2020 — cupom negativo",
                  "Intervenções BCB — leilões de swap"
                - Linha de referência SOFR (cinza tracejada)
              </output>
              <output tipo="nota_pedagogica">
                "O cupom cambial é um termômetro da demanda por dólar
                no mercado doméstico. Picos de cupom sinalizam escassez
                de dólar ou demanda excessiva por hedge. Vales (ou cupom
                negativo) indicam excesso de oferta de dólar. O BCB
                frequentemente intervém via swaps cambiais quando o
                cupom se descola de níveis considerados normais."
              </output>
            </outputs>
          </secao>

          <secao tipo="simulador">
            <titulo>Simulador de Decisão: Hedge Cambial</titulo>
            <descricao>
              Ferramenta que simula o custo/benefício de hedgear uma
              posição em dólar, comparando com a alternativa de
              manter a exposição aberta.
            </descricao>
            <inputs>
              <input tipo="number_input" label="Posição em USD" default="5000000" step="500000"/>
              <input tipo="number_input" label="Dólar spot (R$/US$)" default="5.45" step="0.01"/>
              <input tipo="number_input" label="Cupom cambial (% a.a.)" default="5.50" step="0.25"/>
              <input tipo="number_input" label="Rendimento do ativo em USD (% a.a.)" default="5.00" step="0.25"
                     help="Ex.: SOFR + spread do ativo"/>
              <input tipo="slider" label="Prazo (meses)" min="1" max="12" default="6"/>
              <input tipo="slider" label="Variação cambial simulada (% no período)"
                     min="-20" max="20" default="5" step="1"
                     help="Positivo = depreciação do real (dólar sobe)"/>
            </inputs>
            <outputs>
              <output tipo="comparativo_colunas">
                Duas colunas:
                Coluna 1 — "Com hedge":
                  - Retorno em R$: rendimento USD convertido pela taxa
                    travada (forward) — custo do hedge = cupom cambial
                  - Resultado líquido em R$
                Coluna 2 — "Sem hedge (exposição aberta)":
                  - Retorno em R$: rendimento USD + variação cambial
                  - Resultado líquido em R$
                Comparação: diferença entre os dois cenários.
              </output>
              <output tipo="grafico_sensibilidade">
                Gráfico de linhas:
                Eixo X: variação cambial (-20% a +20%)
                Eixo Y: resultado em R$
                Duas linhas:
                - "Com hedge" — horizontal (resultado fixo, independente
                  do câmbio)
                - "Sem hedge" — inclinada (ganha com depreciação,
                  perde com apreciação)
                Ponto de cruzamento = variação cambial de indiferença.
                Destaque: "Para variações cambiais acima de X%,
                não hedgear é mais lucrativo. Abaixo disso, o hedge
                protege."
              </output>
              <output tipo="nota_pedagogica">
                "A decisão de hedge cambial não é apenas sobre expectativa
                de câmbio — é sobre tolerância ao risco. Uma tesouraria
                com limites de VaR apertados pode preferir o hedge mesmo
                que espere depreciação, porque a exposição aberta gera
                volatilidade de resultado."
              </output>
            </outputs>
          </secao>
        </layout>
      </aba>
    </abas>
  </pagina>

  <!-- ================================================================== -->
  <!--  EXERCÍCIO INTEGRADOR — LEITURA COMPLETA DA CURVA                   -->
  <!-- ================================================================== -->

  <pagina id="integrador">
    <titulo>Exercício Integrador — Leitura Completa da Curva</titulo>
    <objetivo>
      Articular todos os conceitos do Módulo 2 em uma análise integrada:
      construir simultaneamente a curva nominal, a curva real, a inflação
      implícita, as forwards e o cupom cambial, e produzir um diagnóstico
      gerencial a partir dessa leitura conjunta.
    </objetivo>
    <pergunta_gerencial>
      "Olhando todas as curvas juntas, o que o mercado está dizendo?
      E o que minha tesouraria deveria fazer?"
    </pergunta_gerencial>

    <layout>
      <!-- ============================================================ -->
      <!--  SEÇÃO 1 — PAINEL DE DADOS                                    -->
      <!-- ============================================================ -->
      <secao tipo="dados_de_mercado">
        <titulo>📋 Dados de Mercado — Data de Referência</titulo>
        <descricao>
          Painel consolidado com todos os dados necessários para a
          análise, correspondentes a uma mesma data de mercado.
        </descricao>
        <inputs>
          <input tipo="selectbox" label="Data de referência"
                 opcoes="[datas pré-carregadas com labels descritivos, ex.:
                          '2024-03-15 (Pré-COPOM, SELIC 10.75%)',
                          '2023-08-02 (Início dos cortes)',
                          '2022-06-15 (SELIC a 13.25%, pico do ciclo)',
                          '2025-XX-XX (Dados recentes)']"/>
        </inputs>
        <dados_exibidos>
          Apresentar em formato de "ficha técnica" (st.columns com st.metric):
          - SELIC Meta vigente
          - IPCA acumulado 12M
          - IPCA esperado Focus (12M)
          - Dólar spot (PTAX)
          - EMBI+ Brasil
          Abaixo: tabela consolidada com os dados brutos:
          | Vértice | DU | Taxa DI (% a.a.) | Taxa NTN-B (IPCA+, % a.a.) | Dólar futuro (R$/US$) |
          Esta tabela alimenta todos os cálculos das seções seguintes.
        </dados_exibidos>
      </secao>

      <!-- ============================================================ -->
      <!--  SEÇÃO 2 — CONSTRUÇÃO DAS CURVAS                              -->
      <!-- ============================================================ -->
      <secao tipo="construcao">
        <titulo>📐 Construção Automática das Curvas</titulo>
        <descricao>
          A partir dos dados da seção anterior, calcular automaticamente
          todas as curvas e exibi-las num painel unificado. O aluno
          observa o resultado imediato da construção — o aprendizado
          do "como calcular" já foi feito nos módulos individuais;
          aqui o foco é no "o que tudo junto significa".
        </descricao>
        <outputs>
          <output tipo="grafico_multiplo_unificado">
            Gráfico Plotly com 4 subplots em grid 2×2:

            Subplot 1 — Curva Nominal (DI):
              Linha azul (#2E75B6). Eixo X: prazo. Eixo Y: taxa % a.a.
              Marcador da SELIC Meta como linha horizontal tracejada.

            Subplot 2 — Curva Real (NTN-B):
              Linha laranja (#C55A11). Mesmos eixos.
              Permite ver se o juro real é flat, crescente ou decrescente.

            Subplot 3 — Inflação Implícita (Breakeven):
              Linha roxa (#8B5CF6). Calculada como (DI/NTN-B) - 1.
              Sobrepor a meta de inflação como referência.

            Subplot 4 — Forwards Nominais:
              Barras/degraus (cinza escuro) mostrando a forward entre
              cada par de vértices consecutivos. Sobrepor a curva spot
              em linha fina para comparação.

            Todos os subplots compartilham o eixo X (prazo) para
            facilitar a leitura cruzada.
          </output>

          <output tipo="grafico_cupom_separado">
            Gráfico adicional (abaixo do grid):
            Curva de cupom cambial (verde, #059669) para os prazos
            disponíveis. Linha SOFR como referência.
          </output>

          <output tipo="tabela_consolidada">
            Tabela "master" com todos os dados calculados:
            | Prazo | DI spot | NTN-B spot | Breakeven | Forward | Cupom cambial |
            Formatação cuidadosa com 2 casas decimais e cores por faixa.
          </output>
        </outputs>
      </secao>

      <!-- ============================================================ -->
      <!--  SEÇÃO 3 — DIAGNÓSTICO GERENCIAL                              -->
      <!-- ============================================================ -->
      <secao tipo="diagnostico">
        <titulo>🔍 Diagnóstico Gerencial Automático</titulo>
        <descricao>
          Análise automática baseada em regras que "lê" as curvas
          construídas e produz um diagnóstico em linguagem gerencial.
          O diagnóstico não pretende substituir o julgamento do gestor,
          mas demonstrar o tipo de leitura que as curvas permitem.
        </descricao>
        <logica>
          Gerar texto automático baseado nas seguintes verificações:

          1. FORMATO DA CURVA NOMINAL:
             - Se spot_longo > spot_curto: "Curva positivamente inclinada
               (normal) — o mercado precifica prêmio de prazo ou
               expectativa de alta de juros."
             - Se spot_longo &lt; spot_curto: "Curva invertida — o mercado
               precifica cortes futuros de juros."
             - Quantificar: spread 1A-5A em bps.

          2. EXPECTATIVA DE JUROS (via forwards):
             - Se forward média dos próximos 12M > SELIC atual:
               "As forwards precificam CDI médio de X% nos próximos
               12 meses, ACIMA da SELIC atual de Y%."
             - Comparar com expectativa Focus SELIC.
             - Identificar o ponto de inflexão (se houver).

          3. INFLAÇÃO IMPLÍCITA:
             - Breakeven 1A vs. meta: acima/abaixo/na meta.
             - Breakeven longo vs. curto: se crescente, "o mercado
               vê risco de desancoragem inflacionária no longo prazo."

          4. JURO REAL:
             - Nível: NTN-B curta &lt; 4%: "juro real baixo — política
               monetária acomodatícia." > 6%: "juro real elevado —
               política monetária restritiva."
             - Inclinação: curva real flat vs. inclinada.

          5. CUPOM CAMBIAL:
             - Cupom vs. SOFR: spread positivo/negativo.
             - Nível: "O custo de hedge cambial está em X% a.a., o que
               torna [atrativo/caro] captar em USD e converter."

          6. RECOMENDAÇÃO SINTÉTICA (com caveat didático):
             "Dado o padrão das curvas, um gestor com visão [neutra/
             pessimista/otimista] poderia considerar:
             - Posição em prefixado: [favorável se forwards > visão]
             - Posição em IPCA+: [favorável se breakeven baixo]
             - Posição em pós-fixado: [favorável se curva invertida]
             - Hedge cambial: [custo de X% a.a., favorável se ...]"
        </logica>
        <outputs>
          <output tipo="caixas_diagnostico">
            Exibir o diagnóstico em caixas temáticas (st.info, st.warning,
            st.success) agrupadas por tema:
            - 📈 Formato da Curva e Expectativa de Juros
            - 🎯 Inflação Implícita
            - 💵 Cupom Cambial
            - 📊 Síntese e Implicações para Tesouraria
          </output>
        </outputs>
      </secao>

      <!-- ============================================================ -->
      <!--  SEÇÃO 4 — COMPARAÇÃO TEMPORAL                                -->
      <!-- ============================================================ -->
      <secao tipo="comparacao">
        <titulo>🔄 Comparação entre Datas — Como a Curva Mudou?</titulo>
        <descricao>
          Permitir que o aluno selecione duas datas e compare lado a lado
          todas as curvas, observando como o mercado repricicou entre
          os dois momentos e inferindo o que mudou no cenário.
        </descricao>
        <inputs>
          <input tipo="selectbox" label="Data 1 (referência)"
                 opcoes="[datas pré-carregadas]"/>
          <input tipo="selectbox" label="Data 2 (comparação)"
                 opcoes="[datas pré-carregadas]"/>
        </inputs>
        <outputs>
          <output tipo="grafico_comparativo">
            Mesmo grid 2×2 da Seção 2, mas agora cada subplot mostra
            duas curvas (uma para cada data) sobrepostas:
            - Linhas contínuas para Data 1
            - Linhas tracejadas para Data 2
            Permite visualizar: a curva nominal deslocou para cima?
            A inflação implícita subiu? As forwards mudaram de padrão?
          </output>
          <output tipo="tabela_variacao">
            Tabela com as variações (em bps) de cada indicador entre
            as duas datas:
            | Prazo | ΔDI spot | ΔNTN-B spot | ΔBreakeven | ΔForward | ΔCupom |
            Colorir: verde para queda, vermelho para alta (convenção
            de renda fixa: queda de taxa = ganho para quem detém títulos).
          </output>
          <output tipo="diagnostico_comparativo">
            Análise automática: "Entre Data 1 e Data 2, a curva nominal
            deslocou [X bps para cima/baixo], com maior variação no
            [vértice curto/longo]. A inflação implícita [subiu/caiu]
            [Y bps], e o cupom cambial [ampliou/comprimiu] [Z bps].
            Isso é consistente com [cenário descritivo]."
          </output>
        </outputs>
      </secao>

      <!-- ============================================================ -->
      <!--  SEÇÃO 5 — QUESTÕES PARA REFLEXÃO                            -->
      <!-- ============================================================ -->
      <secao tipo="reflexao">
        <titulo>💬 Questões para Reflexão</titulo>
        <descricao>
          Questões abertas para uso em sala ou autoavaliação, sem
          resposta automática. Exibidas em st.expander ou cards.
        </descricao>
        <questoes>
          <questao id="1">
            Observando a curva nominal e as forwards: o mercado espera
            que a SELIC esteja mais alta ou mais baixa daqui a 12 meses?
            Em que prazo está a maior forward — e o que isso pode significar?
          </questao>
          <questao id="2">
            A inflação implícita (breakeven) está acima ou abaixo da meta
            de inflação para os prazos mais longos? Se estiver acima, isso
            necessariamente significa que o mercado espera inflação alta,
            ou pode haver outra explicação (prêmio de risco)?
          </questao>
          <questao id="3">
            Se você acredita que o COPOM vai cortar a SELIC mais do que o
            mercado precifica, em qual FRA você se posicionaria? Qual o
            risco dessa posição?
          </questao>
          <questao id="4">
            Comparando as duas datas selecionadas: o que mudou na leitura
            da curva? Que evento macroeconômico poderia explicar a mudança?
          </questao>
          <questao id="5">
            O cupom cambial está em nível que favorece ou desfavorece a
            captação em dólar com conversão para reais? Como essa
            análise muda se o prazo da captação for de 3 meses vs. 2 anos?
          </questao>
          <questao id="6">
            Se você tivesse que montar uma carteira diversificada usando
            apenas as informações das curvas construídas, qual seria sua
            alocação entre prefixado, IPCA+, pós-fixado e dólar hedgeado?
            (Essa questão antecipa os temas dos módulos seguintes.)
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
        Estrutura sugerida, considerando que o módulo ETTJ já existe
        e será integrado. Os arquivos marcados com [EXISTENTE] não
        precisam ser criados — apenas integrados.
      </descricao>
      <arvore>
        app_tesouraria_mod2/
        ├── app.py                      # Ponto de entrada e navegação
        ├── requirements.txt
        ├── config.py                   # Constantes, paleta, parâmetros globais
        ├── utils/
        │   ├── math_finance.py         # Funções reutilizáveis (complementar ao Módulo 1)
        │   ├── curve_builder.py        # Construção de curvas: spot, forward, cupom
        │   ├── market_data.py          # Carga e tratamento de dados de mercado
        │   ├── diagnostics.py          # Lógica de diagnóstico gerencial automático
        │   └── formatting.py           # Formatação de números, moeda, percentuais
        ├── pages/
        │   ├── home.py                 # Página inicial do Módulo 2
        │   ├── mod1_componentes.py     # Módulo 1: Componentes da taxa
        │   ├── mod2_ettj.py            # [EXISTENTE] Módulo ETTJ — plugar aqui
        │   ├── mod3_forward.py         # Módulo 3: Forward / FRA
        │   ├── mod4_cupom_cambial.py   # Módulo 4: Cupom cambial
        │   └── integrador.py           # Exercício integrador
        └── data/
            ├── curvas_di.csv           # [EXISTENTE ou COMPLEMENTAR] PUs/taxas DI futuro
            ├── ntnb_taxas.csv          # Taxas NTN-B por data e vértice
            ├── dolar_futuro.csv        # Cotações de dólar futuro por vértice
            ├── dolar_spot_ptax.csv     # Série PTAX
            ├── sofr_referencia.csv     # Série SOFR (pode ser simplificada)
            ├── focus_ipca.csv          # Expectativas Focus para IPCA
            ├── breakeven_historico.csv  # Breakeven pré-calculado (opcional)
            ├── cupom_cambial_hist.csv  # Cupom cambial histórico (opcional)
            └── selic_meta.csv          # [EXISTENTE] Série SELIC Meta
      </arvore>
    </estrutura_de_arquivos>

    <integracao_ettj>
      <descricao>
        O módulo ETTJ existente deve ser integrado respeitando as
        seguintes interfaces:
      </descricao>
      <interface_session_state>
        O módulo ETTJ deve disponibilizar em st.session_state:
        - st.session_state["ettj_curva_spot"]:
            dict {prazo_du: taxa_spot_anual} — a curva spot da data selecionada
        - st.session_state["ettj_data_referencia"]:
            datetime.date — data da curva
        - st.session_state["ettj_vertices"]:
            list[int] — prazos em DU disponíveis
        Os módulos de Forward e Integrador verificam a existência
        dessas chaves e, se presentes, oferecem a opção "Importar
        do módulo ETTJ" nos inputs.
      </interface_session_state>
      <fallback>
        Se as chaves não estiverem presentes (ex.: o aluno acessou
        o módulo Forward diretamente sem passar pelo ETTJ), os módulos
        devem funcionar com dados pré-carregados ou inputs manuais.
        Nunca depender exclusivamente do session_state.
      </fallback>
    </integracao_ettj>

    <funcoes_utilitarias_novas>
      <descricao>
        Funções a serem implementadas em utils/curve_builder.py,
        complementando as funções do Módulo 1 (utils/math_finance.py):
      </descricao>
      <funcao nome="calcular_breakeven(taxa_nominal, taxa_real)">
        Retorna a inflação implícita: (1+nom)/(1+real) - 1.
      </funcao>
      <funcao nome="calcular_forwards(curva_spot_dict)">
        Recebe dict {du: taxa_anual} e retorna lista de forwards
        entre vértices consecutivos: [{de_du, ate_du, forward_aa, forward_mensal}].
      </funcao>
      <funcao nome="calcular_cupom_cambial(taxa_di, du, dc, dolar_spot, dolar_futuro)">
        Retorna o cupom cambial implícito (% a.a., linear DC/360).
      </funcao>
      <funcao nome="construir_curva_cupom(dados_mercado_df)">
        Recebe DataFrame com colunas [prazo, taxa_di, du, dc, dol_futuro]
        e dólar spot, retorna DataFrame com cupom para cada vértice.
      </funcao>
      <funcao nome="gerar_diagnostico(curvas_dict)">
        Recebe dicionário com todas as curvas calculadas e retorna
        dict com textos de diagnóstico por tema.
      </funcao>
    </funcoes_utilitarias_novas>

    <padrao_visual>
      Mesmo padrão do app do Módulo 1:
      <regra>layout="wide"</regra>
      <regra>Gráficos Plotly com template "plotly_white", cores da paleta.</regra>
      <regra>st.expander para conceitos, st.metric para KPIs.</regra>
      <regra>Formatação brasileira (vírgula decimal).</regra>
      <regra>
        Convenção de cores específica para este módulo:
        - Curva nominal DI: azul (#2E75B6)
        - Curva real NTN-B: laranja (#C55A11)
        - Inflação implícita: roxo (#8B5CF6)
        - Forwards: cinza escuro (#555555) ou laranja
        - Cupom cambial: verde (#059669)
        - SOFR/referência: cinza tracejado
        Essa convenção deve ser consistente em todas as páginas.
      </regra>
    </padrao_visual>

    <dados_de_mercado>
      <estrategia>
        Mesma estratégia do Módulo 1: datasets pré-processados em CSV
        para funcionamento offline, com opção de carga via API do BCB
        (SGS) com fallback. Dados de NTN-B e dólar futuro podem
        requerer fonte ANBIMA ou B3 — usar datasets pré-processados.
      </estrategia>
      <datas_sugeridas>
        Selecionar 4-6 datas representativas de momentos distintos
        do mercado brasileiro para os datasets pré-carregados:
        - Pico de ciclo de alta (ex.: SELIC 13.75%, ago/2022)
        - Início de ciclo de cortes (ex.: ago/2023)
        - Meio de ciclo de cortes
        - Momento com curva invertida
        - Momento com estresse cambial (cupom alto)
        - Data recente (a ser atualizada pelo professor)
        Cada data deve ter o conjunto completo: DI, NTN-B, dólar,
        Focus, SELIC, IPCA.
      </datas_sugeridas>
    </dados_de_mercado>

    <acessibilidade>
      <regra>Alternativa textual (tabela) para cada gráfico.</regra>
      <regra>Contraste WCAG AA nas cores.</regra>
      <regra>Labels descritivos em todos os inputs.</regra>
    </acessibilidade>
  </diretrizes_tecnicas>

  <!-- ================================================================== -->
  <!--  ORIENTAÇÕES PEDAGÓGICAS PARA USO EM SALA                          -->
  <!-- ================================================================== -->

  <orientacoes_pedagogicas>
    <orientacao bloco="1">
      Usar o módulo "Componentes da Taxa" durante a exposição do Bloco 1:
      projetar o gráfico de área empilhada e ajustar os inputs em tempo
      real para demonstrar como os componentes interagem. Usar a aba de
      "Inflação Implícita" para o exercício prático de breakeven.
    </orientacao>
    <orientacao bloco="2">
      O módulo ETTJ (já existente) é a ferramenta central do Bloco 2.
      Projetar a construção da curva a partir dos PUs e usar a
      interpolação Flat Forward para demonstrar o preenchimento de
      vértices intermediários.
    </orientacao>
    <orientacao bloco="3">
      Projetar o módulo "Forward" durante o Bloco 3. Usar a aba
      "Calculadora de Forwards" para o exercício de cálculo e a aba
      "Comparador de Visões" para o debate sobre posicionamento em FRA.
      Pedir que os alunos editem a coluna "Sua visão" com suas
      expectativas de CDI — o gráfico atualiza em tempo real e
      evidencia as divergências.
    </orientacao>
    <orientacao bloco="4">
      No Bloco 4, usar o módulo "Cupom Cambial" para a exposição e
      cálculo. O "Simulador de Decisão de Hedge" é especialmente útil
      para a discussão sobre custo/benefício do hedge cambial. Para o
      Exercício Integrador, projetar a página completa e percorrer
      as seções com a turma, pedindo que os grupos formulem seus
      diagnósticos antes de ver o diagnóstico automático.
    </orientacao>
    <orientacao geral="pos_aula">
      O app permanece disponível para experimentação. Sugerir que cada
      aluno selecione uma data diferente no Integrador e compare com a
      data utilizada em sala, produzindo um breve relatório de "como a
      curva mudou e por quê" — atividade ponte para o próximo módulo.
    </orientacao>
  </orientacoes_pedagogicas>

</app>
```
