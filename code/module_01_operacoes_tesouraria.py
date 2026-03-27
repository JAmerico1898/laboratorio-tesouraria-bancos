"""
Laboratório de Operações de Tesouraria — Módulo 1
Principais Operações de Tesouraria
MBA em Bancos e Instituições Financeiras — FGV

Arquivo único: module_01_operacoes_tesouraria.py
Para executar: streamlit run module_01_operacoes_tesouraria.py

Dependências: streamlit, plotly, pandas, numpy, bizdays
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from datetime import date, datetime, timedelta
from typing import Optional, Dict, List
from datetime import datetime
import pandas as pd
from bcb import sgs
from dateutil.relativedelta import relativedelta
import pyield as yd
import calendar

import warnings
warnings.filterwarnings("ignore")

# ============================================================================
#  CONFIGURAÇÃO DO BIZDAYS
# ============================================================================
try:
    from bizdays import Calendar
    try:
        cal = Calendar.load("ANBIMA")
    except Exception:
        FERIADOS = []
        FERIADOS_MOVEIS = [
            "2024-02-12","2024-02-13","2024-03-29","2024-05-30",
            "2025-03-03","2025-03-04","2025-04-18","2025-06-19",
            "2026-02-16","2026-02-17","2026-04-03","2026-06-04",
            "2027-02-08","2027-02-09","2027-03-26","2027-05-27",
        ]
        for ano in range(2015, 2028):
            for md in ["01-01","04-21","05-01","09-07","10-12","11-02","11-15","12-25"]:
                FERIADOS.append(f"{ano}-{md}")
        todos = sorted(set(FERIADOS + FERIADOS_MOVEIS))
        cal = Calendar(holidays=todos, weekdays=["Saturday","Sunday"], name="ANBIMA_FB")
    BIZDAYS_OK = True
except ImportError:
    BIZDAYS_OK = False
    cal = None

# ============================================================================
#  PALETA DE CORES E CONSTANTES GLOBAIS
# ============================================================================
CORES = {
    "primaria": "#1B3A5C", "secundaria": "#1EE928", "accent": "#C55A11",
    "fundo_claro": "#EAF3F8", "positivo": "#2E8B57", "negativo": "#CC3333",
    "neutro": "#888888", "amarelo": "#DAA520",
}
PLOTLY_LAYOUT = dict(
    template="plotly_white",
    font=dict(family="Segoe UI, Arial, sans-serif", size=13),
    margin=dict(l=60, r=30, t=50, b=50),
    hoverlabel=dict(bgcolor="white", font_size=12),
)
PLOTLY_CFG = {"displayModeBar": False}
META_INFLACAO = 3.0
PIB_POTENCIAL = 2.5
CENARIO_DELTAS = {
    "ipca_pp": 75, "pib_pp": 50,
    "cambio": {"Estável":0,"Depreciação moderada":50,"Depreciação forte":100,"Apreciação moderada":-25},
    "fiscal": {"Neutro":0,"Expansionista":75,"Contracionista":-50},
    "fed": {"Manutenção":0,"Alta de juros":50,"Corte de juros":-25},
}
SPREADS_CREDITO = {
    "AAA":(30,60),"AA":(60,120),"A":(120,200),"BBB":(150,250),
    "BB":(250,400),"B":(400,700),"CCC":(700,1200),
}
PREMIO_LIQUIDEZ = {
    "Alta (títulos públicos, DI)":(0,10),
    "Média (debêntures investment grade)":(15,40),
    "Baixa (crédito privado ilíquido)":(50,120),
}
DATA_DIR = "data/"
DATAS_CURVAS_LABELS: Dict[str,str] = {
    # "2021-03-17": "2021-03-17 (Início ciclo alta)",
    # "2022-08-03": "2022-08-03 (SELIC 13,75%)",
    # "2023-08-02": "2023-08-02 (Início cortes)",
}

# ============================================================================
#  CSS
# ============================================================================
def aplicar_css():
    st.markdown("""<style>
    h1,h2,h3{color:#1B3A5C}
    .info-box{background:#EAF3F8;border-left:4px solid #2E75B6;padding:1rem 1.2rem;
      border-radius:0 8px 8px 0;margin:.8rem 0;font-size:.95rem;line-height:1.5}
    .modulo-card{background:#fff;border:1px solid #ddd;border-radius:10px;padding:1.2rem;
      margin:.5rem 0;min-height:180px;transition:box-shadow .2s}
    .modulo-card:hover{box-shadow:0 4px 12px rgba(0,0,0,.1)}
    .modulo-card h4{color:#1B3A5C;margin-bottom:.5rem}
    .modulo-card p{color:#555;font-size:.9rem}
    div[data-testid="stMetric"]{background:#f8f9fa;border-radius:8px;padding:.8rem;border:1px solid #e9ecef}
    </style>""", unsafe_allow_html=True)

# ============================================================================
#  FUNÇÕES UTILITÁRIAS — MATEMÁTICA FINANCEIRA
# ============================================================================
def dias_uteis(d1: date, d2: date) -> int:
    if BIZDAYS_OK and cal:
        try: return cal.bizdays(d1, d2)
        except: pass
    du = 0; d = d1 + timedelta(days=1)
    while d <= d2:
        if d.weekday() < 5: du += 1
        d += timedelta(days=1)
    return du

def dias_corridos(d1: date, d2: date) -> int:
    return (d2 - d1).days

def taxa_equivalente(taxa: float, de: str, para: str) -> float:
    if de == "anual_252": td = (1+taxa)**(1/252)-1
    elif de == "anual_360": td = (1+taxa)**(1/360)-1
    elif de == "mensal": td = (1+taxa)**(1/21)-1
    elif de == "diaria": td = taxa
    else: raise ValueError(f"Base desconhecida: {de}")
    if para == "anual_252": return (1+td)**252-1
    elif para == "anual_360": return (1+td)**360-1
    elif para == "mensal": return (1+td)**21-1
    elif para == "diaria": return td
    else: raise ValueError(f"Base desconhecida: {para}")

def pu_ltn(taxa_aa: float, du: int) -> float:
    if du <= 0: return 1000.0
    return 1000.0 / ((1+taxa_aa)**(du/252))

def taxa_forward(sc: float, pc: int, sl: float, pl: int) -> float:
    fl = (1+sl)**(pl/252); fc = (1+sc)**(pc/252)
    pf = pl - pc
    if fc == 0 or pf <= 0: return 0.0
    return (fl/fc)**(252/pf)-1

def duration_modificada(taxa: float, du: int) -> float:
    return (du/252)/(1+taxa)

def mtm_posicao(pu_compra, taxa_mercado, du_res, vol_face):
    qtd = vol_face / 1000.0
    pu_m = pu_ltn(taxa_mercado, du_res)
    vc = qtd * pu_compra; vm = qtd * pu_m
    pnl = vm - vc
    return {"pu_mtm":pu_m,"valor_compra":vc,"valor_mtm":vm,"pnl":pnl,
            "pnl_pct":(pnl/vc)*100 if vc else 0}

def fator_cdi_acumulado(cdi_s: pd.Series, pct: float = 100.0) -> pd.Series:
    fd = ((1 + cdi_s/100)**(1/252)-1)*(pct/100)+1
    return fd.cumprod()

# ============================================================================
#  FORMATAÇÃO
# ============================================================================
def fmt_brl(v):
    if abs(v)>=1e9: s=f"R$ {v/1e9:,.4f} bi"
    elif abs(v)>=1e6: s=f"R$ {v/1e6:,.4f} mi"
    else: s=f"R$ {v:,.4f}"
    return s.replace(",","X").replace(".",",").replace("X",".")

def fmt_pct(v, c=2):
    return f"{v:,.{c}f}%".replace(",","X").replace(".",",").replace("X",".")

def fmt_num(v, c=2):
    return f"{v:,.{c}f}".replace(",","X").replace(".",",").replace("X",".")

# ============================================================================
#  CARGA DE DADOS (pontos de inserção para CSVs reais)
# ============================================================================

@st.cache_data(ttl=86400)
def carregar_selic_meta():
    """CSV: data/selic_meta.csv | Colunas: data, valor | Fonte: SGS 432"""
    try: return pd.read_csv(f"{DATA_DIR}selic_meta.csv",parse_dates=["data"]).sort_values("data").reset_index(drop=True)
    except FileNotFoundError:
        st.warning("⚠️ `selic_meta.csv` não encontrado em data/.")
        return pd.DataFrame(columns=["data","valor"])


@st.cache_data(ttl=86400)
def carregar_selic_over():
    """CSV: data/selic_over.csv | Colunas: data, valor | Fonte: SGS 1178"""
    try: return pd.read_csv(f"{DATA_DIR}selic_over.csv",parse_dates=["data"]).sort_values("data").reset_index(drop=True)
    except FileNotFoundError:
        st.warning("⚠️ `selic_over.csv` não encontrado em data/.")
        return pd.DataFrame(columns=["data","valor"])


@st.cache_data(ttl=86400)
def carregar_cdi_diario():
    """CSV: data/cdi_diario.csv | Colunas: data, valor (% a.a.) | Fonte: SGS 4391"""
    try: return pd.read_csv(f"{DATA_DIR}cdi_diario.csv",parse_dates=["data"]).sort_values("data").reset_index(drop=True)
    except FileNotFoundError:
        st.warning("⚠️ `cdi_diario.csv` não encontrado em data/.")
        return pd.DataFrame(columns=["data","valor"])


#@st.cache_data(ttl=86400)
#def carregar_curvas_di():
#    """CSV: data/curvas_di.csv | Colunas: data, prazo_du, taxa | Fonte: ANBIMA/B3"""
#    try: return pd.read_csv(f"{DATA_DIR}curvas_di.csv",parse_dates=["data"]).sort_values(["data","prazo_du"]).reset_index(drop=True)
#    except FileNotFoundError:
#        st.warning("⚠️ `curvas_di.csv` não encontrado em data/.")
#        return pd.DataFrame(columns=["data","prazo_du","taxa"])


@st.cache_data(ttl=86400)
def carregar_curvas_di():
    """DI1 via pyield | Colunas: data, prazo_du, taxa | Fonte: B3"""
    try:
        data_atual = (datetime.today() - timedelta(days=1)).date()
        max_tentativas = 10

        for _ in range(max_tentativas):
            try:
                data_str = data_atual.strftime("%Y-%m-%d")
                df_polars = yd.futures(contract_code="DI1", date=data_str)
                df = df_polars.to_pandas(use_pyarrow_extension_array=True)

                if df is not None and len(df) > 0:
                    if hasattr(df['BDaysToExp'], 'to_numpy'):
                        df['BDaysToExp'] = df['BDaysToExp'].to_numpy()

                    df = df[df['BDaysToExp'] <= 1260].copy()

                    df_out = pd.DataFrame({
                        'data': pd.to_datetime(data_atual),
                        'prazo_du': df['BDaysToExp'].astype(int),
                        'taxa': df['SettlementRate']
                    })
                    return df_out.sort_values(['data', 'prazo_du']).reset_index(drop=True)
            except Exception:
                pass

            data_atual -= timedelta(days=1)

        st.warning("⚠️ Não foi possível carregar dados DI1 da B3.")
        return pd.DataFrame(columns=["data", "prazo_du", "taxa"])
    except Exception as e:
        st.warning(f"⚠️ Erro ao carregar DI1: {e}")
        return pd.DataFrame(columns=["data", "prazo_du", "taxa"])





@st.cache_data(ttl=86400)
def carregar_ipca():
    """CSV: data/ipca_mensal.csv | Colunas: data, valor | Fonte: SGS 13522"""
    try: return pd.read_csv(f"{DATA_DIR}ipca_mensal.csv",parse_dates=["data"]).sort_values("data").reset_index(drop=True)
    except FileNotFoundError: return pd.DataFrame(columns=["data","valor"])

@st.cache_data(ttl=86400)
def carregar_cambio():
    """CSV: data/cambio_usd.csv | Colunas: data, valor | Fonte: SGS 1"""
    try: return pd.read_csv(f"{DATA_DIR}cambio_usd.csv",parse_dates=["data"]).sort_values("data").reset_index(drop=True)
    except FileNotFoundError: return pd.DataFrame(columns=["data","valor"])

#@st.cache_data(ttl=86400)
#def carregar_cds():
#    """CSV: data/cds_brasil.csv | Colunas: data, valor (bps) | Fonte: INVESTING"""
#    try: return pd.read_csv(f"{DATA_DIR}cds_brasil.csv",parse_dates=["data"]).sort_values("data").reset_index(drop=True)
#    except FileNotFoundError: return pd.DataFrame(columns=["data","valor"])

@st.cache_data(ttl=86400)
def carregar_cds():
    """CSV: data/cds_brasil.csv | Colunas: data, valor (bps) | Fonte: INVESTING"""
    try:
        df = pd.read_csv(
            f"{DATA_DIR}cds_brasil.csv",
            sep=";",
        )
        
        df.columns = df.columns.str.strip().str.lower()
        
        df["data"] = pd.to_datetime(
            df["data"],
            format="%m/%d/%Y",  # US format
            errors="raise"
        )
        
        return df.sort_values("data").reset_index(drop=True)

    except FileNotFoundError:
        return pd.DataFrame(columns=["data", "valor"])


@st.cache_data(ttl=86400)
def carregar_pib():
    """CSV: data/pib_trimestral.csv | Colunas: data, valor (% var a.a.) | Fonte: IBGE"""
    try: return pd.read_csv(f"{DATA_DIR}pib_trimestral.csv",parse_dates=["data"]).sort_values("data").reset_index(drop=True)
    except FileNotFoundError: return pd.DataFrame(columns=["data","valor"])

@st.cache_data(ttl=86400)
def carregar_resultado_primario():
    """CSV: data/resultado_primario.csv | Colunas: data, valor (% PIB) | Fonte: STN/BCB"""
    try: return pd.read_csv(f"{DATA_DIR}resultado_primario.csv",parse_dates=["data"]).sort_values("data").reset_index(drop=True)
    except FileNotFoundError: return pd.DataFrame(columns=["data","valor"])

@st.cache_data(ttl=86400)
def carregar_focus():
    """CSV: data/focus_expectativas.csv | Colunas: data_coleta, variavel, mediana
    Variáveis: IPCA_corrente, IPCA_seguinte, SELIC_corrente, SELIC_seguinte, PIB_corrente, Cambio_corrente"""
    try: return pd.read_csv(f"{DATA_DIR}focus_expectativas.csv",parse_dates=["data_coleta"]).sort_values("data_coleta").reset_index(drop=True)
    except FileNotFoundError: return pd.DataFrame(columns=["data_coleta","variavel","mediana"])

#@st.cache_data(ttl=86400)
#def carregar_spreads_debentures():
#    """CSV: data/spreads_debentures.csv | Colunas: data, rating, spread_bps | Fonte: ANBIMA/sintético"""
#    try: return pd.read_csv(f"{DATA_DIR}spreads_debentures.csv",parse_dates=["data"]).sort_values(["data","rating"]).reset_index(drop=True)
#    except FileNotFoundError: return pd.DataFrame(columns=["data","rating","spread_bps"])


# ============================================================================
#  NAVEGAÇÃO E PÁGINA HOME
# ============================================================================
def configurar_pagina():
    st.set_page_config(page_title="Laboratório de Tesouraria — Módulo 1",
                       page_icon="🏛️", layout="wide", initial_sidebar_state="expanded")
    aplicar_css()

def sidebar_navegacao() -> str:
    with st.sidebar:
        st.markdown("### 🏛️ Laboratório de Tesouraria")
        st.markdown("**Módulo 1** — Principais Operações")
        st.markdown("---")
        paginas = {
            "🏛️ Visão Geral do Módulo": "home",
            "📐 Matemática Financeira Aplicada": "mod1",
            "💰 Mercado Monetário e Taxas de Juros": "mod2",
            "🌎 Cenário Econômico e Taxa de Juros": "mod3",
            "⚠️ Risco Financeiro e Taxa de Juros": "mod4",
            "🧩 Exercício Integrador": "integrador",
        }
        escolha = st.radio("Navegação", list(paginas.keys()), label_visibility="collapsed")
        st.markdown("---")
        st.caption("MBA em Bancos e Instituições Financeiras — FGV")
    return paginas[escolha]

def render_home():
    st.markdown("# Laboratório de Operações de Tesouraria")
    st.markdown("### Módulo 1 — Principais Operações de Tesouraria")
    st.markdown(
        '<div class="info-box">'
        "A tesouraria é o centro nevrálgico da gestão financeira de um banco. "
        "É nela que se gerenciam as posições de liquidez, se precificam operações, "
        "se monitoram riscos de mercado e se tomam decisões de alocação que impactam "
        "diretamente o resultado da instituição. Este módulo oferece ferramentas "
        "interativas para desenvolver a intuição gerencial necessária a esse papel."
        "</div>", unsafe_allow_html=True)
    st.markdown("---")
    st.markdown("### Mapa do Módulo")
    st.markdown("Progressão: **fundamento → mercado → cenário → risco → decisão**.")

    modulos = [
        ("📐","Matemática Financeira Aplicada",
         "Capitalização, conversão de taxas e precificação de títulos.","mod1"),
        ("💰","Mercado Monetário e Taxas",
         "SELIC, CDI, curva de juros e taxas forward implícitas.","mod2"),
        ("🌎","Cenário Econômico",
         "Variáveis macro e seu impacto nas taxas de juros.","mod3"),
        ("⚠️","Risco Financeiro",
         "Decomposição de taxas, MtM e spreads de crédito.","mod4"),
    ]
    cols = st.columns(4)
    for i,(icone,titulo,desc,pid) in enumerate(modulos):
        with cols[i]:
            st.markdown(f'<div class="modulo-card"><h4>{icone} {titulo}</h4><p>{desc}</p></div>',
                        unsafe_allow_html=True)

    st.markdown("---")
    st.markdown("### Quadro-Resumo")
    quadro = pd.DataFrame({
        "Bloco": ["1","2","3","4","Integrador"],
        "Tópico": ["Matemática Financeira Aplicada","Mercado Monetário e Taxas de Juros",
                    "Cenário Econômico e Taxa de Juros","Risco Financeiro e Taxa de Juros",
                    "Exercício Integrador — Decisão de Tesouraria"],
        "Objetivo": ["Aplicar modelos matemáticos financeiros fundamentais",
                      "Conhecer a dinâmica do mercado monetário e suas taxas",
                      "Compreender o impacto do cenário econômico na taxa de juros",
                      "Aplicar a dinâmica da taxa de juros ao estudo de riscos",
                      "Articular todos os conceitos em uma decisão integrada"],
        "Pergunta-Chave": ["Qual o preço justo deste título?",
                           "Qual benchmark usar nesta operação?",
                           "Para onde vão os juros?","Quanto risco estou correndo?",
                           "Qual a melhor alocação para a carteira?"],
    })
    st.dataframe(quadro, use_container_width=True, hide_index=True)


# ============================================================================
#  MÓDULO 1 — MATEMÁTICA FINANCEIRA APLICADA
# ============================================================================
def render_mod1():
    st.markdown("## 📐 Matemática Financeira Aplicada à Tesouraria")
    st.markdown('<div class="info-box"><b>Pergunta gerencial:</b> "Qual é o preço justo '
                'deste título? Qual taxa estou realmente praticando nesta operação?"</div>',
                unsafe_allow_html=True)
    tab1, tab2 = st.tabs(["📊 Capitalização e Taxas Equivalentes","💵 Precificação de Títulos"])
    with tab1: render_mod1_aba1()
    with tab2: render_mod1_aba2()

def render_mod1_aba1():
    with st.expander("📘 Conceito — Capitalização e Taxas Equivalentes"):
        st.markdown("""
**Capitalização composta** é o regime padrão do mercado financeiro brasileiro.
Diferentemente da simples (linear), os juros incidem sobre o montante acumulado.

**Convenções brasileiras:**
- **DU/252**: dias úteis, base 252 — padrão para renda fixa.
- **DC/360**: dias corridos, base 360 — usado em algumas operações de crédito.
""")
        st.latex(r"VF = VP \times (1 + i)^n")
        st.latex(r"i_{eq} = (1 + i_{orig})^{\,n_{eq}/n_{orig}} - 1")
        st.latex(r"\text{Fator}_{DU} = (1 + i_{aa})^{DU/252}")
        st.latex(r"\text{Fator}_{DC} = 1 + i_{aa} \times DC/360")

    st.markdown("---")
    st.markdown("### Conversor de Taxas")
    bases = {"% ao ano (252 DU)":"anual_252","% ao ano (360 DC)":"anual_360",
             "% ao mês":"mensal","% ao dia (over)":"diaria"}
    c1,c2,c3 = st.columns(3)
    with c1: tx_in = st.number_input("Taxa de entrada (%)",value=13.75,step=0.25,format="%.4f",key="cv_tx")
    with c2: b_de = st.selectbox("Base da taxa de entrada",list(bases.keys()),key="cv_de")
    with c3: b_para = st.selectbox("Converter para",list(bases.keys())+["Todas"],key="cv_para")

    tx_dec = tx_in / 100.0
    bk_de = bases[b_de]

    if b_para == "Todas":
        res = {}
        for n,k in bases.items():
            res[n] = tx_dec if k == bk_de else taxa_equivalente(tx_dec, bk_de, k)
        cols = st.columns(4)
        for i,(n,v) in enumerate(res.items()):
            with cols[i]:
                marca = " ✅" if bases[n]==bk_de else ""
                st.metric(n+marca, fmt_pct(v*100,4))
        st.dataframe(pd.DataFrame({"Base":list(res.keys()),
                     "Taxa (%)": [f"{v*100:.4f}" for v in res.values()]}),
                     use_container_width=True, hide_index=True)
    else:
        bk_para = bases[b_para]
        resultado = tx_dec if bk_para==bk_de else taxa_equivalente(tx_dec, bk_de, bk_para)
        c1,c2 = st.columns(2)
        with c1: st.metric(f"Taxa original ({b_de})", fmt_pct(tx_in,4))
        with c2: st.metric(f"Taxa equivalente ({b_para})", fmt_pct(resultado*100,4))
        with st.expander("📐 Cálculo passo a passo"):
            td = taxa_equivalente(tx_dec, bk_de, "diaria")
            st.markdown(f"**Passo 1:** Taxa diária = {fmt_pct(td*100,6)}")
            st.markdown(f"**Passo 2:** Taxa equivalente ({b_para}) = {fmt_pct(resultado*100,4)}")

    st.markdown("---")
    st.markdown("### Impacto da Convenção de Contagem")
    st.markdown("Compare o resultado de uma mesma operação em DU/252 vs. DC/360.")
    c1,c2 = st.columns(2)
    with c1:
        principal = st.number_input("Principal (R$)",value=1_000_000,step=100_000,format="%d",key="cc_pr")
        tx_a = st.number_input("Taxa anual (%)",value=13.75,step=0.25,format="%.2f",key="cc_tx")
    with c2:
        d_ini = st.date_input("Data início",value=date(2024,7,1),key="cc_di")
        d_fim = st.date_input("Data vencimento",value=date(2025,1,2),key="cc_df")

    if d_fim > d_ini:
        du = dias_uteis(d_ini, d_fim); dc = dias_corridos(d_ini, d_fim)
        tx = tx_a / 100.0
        f_du = (1+tx)**(du/252); vf_du = principal * f_du
        f_dc = 1 + tx*(dc/360); vf_dc = principal * f_dc
        dif = vf_du - vf_dc
        dif_bps = (f_du - f_dc) / f_dc * 10000

        c1,c2 = st.columns(2)
        with c1:
            st.markdown("**DU/252 (composta)**")
            st.metric("Dias Úteis", str(du))
            st.metric("Fator", fmt_num(f_du,8))
            st.metric("Valor Futuro", fmt_brl(vf_du))
        with c2:
            st.markdown("**DC/360 (linear)**")
            st.metric("Dias Corridos", str(dc))
            st.metric("Fator", fmt_num(f_dc,8))
            st.metric("Valor Futuro", fmt_brl(vf_dc))

        st.markdown(
            f'<div class="info-box">'
            f'<b>Diferença:</b> {fmt_brl(abs(dif))} ({fmt_num(abs(dif_bps),1)} bps). '
            f'Em uma carteira de R$ 10 bilhões, representaria {fmt_brl(abs(dif)*10000)}.'
            f'</div>', unsafe_allow_html=True)
    else:
        st.warning("A data de vencimento deve ser posterior à data de início.")

def render_mod1_aba2():
    with st.expander("📘 Conceito — Precificação de Títulos"):
        st.markdown("""
O **PU** de um título é o valor presente dos fluxos futuros. Para uma **LTN** (prefixado
sem cupom), o único fluxo é R$ 1.000 no vencimento. **Relação fundamental:** taxa sobe → preço cai.
Títulos mais longos são mais sensíveis (**duration**).
""")
        st.latex(r"PU_{LTN} = \frac{1.000}{(1 + i)^{DU/252}}")
        st.latex(r"D^* = \frac{DU/252}{1+i}")

    st.markdown("---")
    st.markdown("### Precificador de LTN")
    c1,c2 = st.columns(2)
    with c1: tx_m = st.number_input("Taxa de mercado (% a.a.)",value=12.50,step=0.10,format="%.2f",key="pr_tx")
    with c2: prazo = st.slider("Prazo até vencimento (DU)",1,504,252,key="pr_du")

    tx = tx_m/100.0; pu = pu_ltn(tx, prazo); dm = duration_modificada(tx, prazo)
    c1,c2,c3 = st.columns(3)
    with c1: st.metric("PU (R$)", fmt_num(pu,4))
    with c2: st.metric("Duration Mod. (anos)", fmt_num(dm,4))
    with c3: st.metric("Prazo (anos)", fmt_num(prazo/252,2))

    # Gráfico PU vs Taxa
    taxas_r = np.linspace(0.05,0.25,100)
    pus_r = [pu_ltn(t,prazo) for t in taxas_r]
    fig1 = go.Figure()
    fig1.add_trace(go.Scatter(x=taxas_r*100,y=pus_r,mode="lines",name="PU vs Taxa",
                              line=dict(color=CORES["secundaria"],width=2.5)))
    fig1.add_trace(go.Scatter(x=[tx_m],y=[pu],mode="markers",name="Taxa atual",
                              marker=dict(color=CORES["accent"],size=12,symbol="diamond")))
    fig1.update_layout(**PLOTLY_LAYOUT,title="PU da LTN vs. Taxa",
                       xaxis_title="Taxa (% a.a.)",yaxis_title="PU (R$)")
    st.plotly_chart(fig1, use_container_width=True, config=PLOTLY_CFG)

    # Gráfico PU vs Prazo (efeito duration)
    prazos_r = np.arange(1,505)
    fig2 = go.Figure()
    fig2.add_trace(go.Scatter(x=prazos_r,y=[pu_ltn(tx,p) for p in prazos_r],
                              mode="lines",name=f"Taxa: {fmt_pct(tx_m)}",
                              line=dict(color=CORES["secundaria"],width=2)))
    fig2.add_trace(go.Scatter(x=prazos_r,y=[pu_ltn(tx+0.02,p) for p in prazos_r],
                              mode="lines",name=f"Taxa: {fmt_pct(tx_m+2)}",
                              line=dict(color=CORES["accent"],width=2,dash="dash")))
    fig2.update_layout(**PLOTLY_LAYOUT,title="PU vs. Prazo — Efeito Duration",
                       xaxis_title="Prazo (DU)",yaxis_title="PU (R$)")
    st.plotly_chart(fig2, use_container_width=True, config=PLOTLY_CFG)
    st.markdown('<div class="info-box">A distância entre as curvas aumenta com o prazo — '
                'títulos mais longos sofrem variações de preço maiores para um mesmo choque de taxa '
                '(<b>efeito duration</b>).</div>', unsafe_allow_html=True)

    st.markdown("---")
    st.markdown("### Sensibilidade: Impacto de um Choque de Taxa")
    st.markdown('*"Se a taxa subir X bps, quanto minha posição perde?"*')
    c1,c2 = st.columns(2)
    with c1:
        val_pos = st.number_input("Valor da posição (R$)",value=10_000_000,step=1_000_000,format="%d",key="se_vl")
        tx_s = st.number_input("Taxa atual (% a.a.)",value=12.50,step=0.10,format="%.2f",key="se_tx")
    with c2:
        pr_s = st.slider("Prazo (DU)",21,504,252,key="se_du")
        chq = st.slider("Choque de taxa (bps)",-200,200,50,step=10,key="se_chq")

    tx_d = tx_s/100.0; chq_d = chq/10000.0
    pu_a = pu_ltn(tx_d, pr_s); pu_d = pu_ltn(tx_d+chq_d, pr_s)
    dm_s = duration_modificada(tx_d, pr_s)
    qtd = val_pos/pu_a; var_rs = qtd*pu_d - val_pos; var_pct = var_rs/val_pos*100

    c1,c2,c3,c4 = st.columns(4)
    with c1: st.metric("PU antes", fmt_num(pu_a,4))
    with c2: st.metric("PU depois", fmt_num(pu_d,4))
    with c3: st.metric("Variação (R$)", f"{'+'if var_rs>=0 else ''}{fmt_brl(var_rs)}")
    with c4: st.metric("Duration Mod.", fmt_num(dm_s,4))

    # Gráfico de barras P&L
    choques = list(range(-200,201,25))
    pnls = [(qtd*pu_ltn(tx_d+c/10000,pr_s))-val_pos for c in choques]
    cores_b = [CORES["positivo"] if p>=0 else CORES["negativo"] for p in pnls]
    idx_s = choques.index(chq) if chq in choques else None
    bordas = ["black" if i==idx_s else "rgba(0,0,0,0)" for i in range(len(choques))]

    fig3 = go.Figure(go.Bar(y=[f"{c:+d} bps" for c in choques],x=pnls,orientation="h",
                            marker=dict(color=cores_b,line=dict(color=bordas,width=2)),
                            hovertemplate="Choque: %{y}<br>P&L: R$ %{x:,.0f}<extra></extra>"))
    fig3.update_layout(**PLOTLY_LAYOUT,title="P&L por Choque de Taxa",
                       xaxis_title="P&L (R$)",yaxis_title="",height=600)
    st.plotly_chart(fig3, use_container_width=True, config=PLOTLY_CFG)

    direcao = "perda" if var_rs<0 else "ganho"
    st.markdown(
        f'<div class="info-box">'
        f'Choque de <b>{chq:+d} bps</b> → <b>{direcao}</b> de <b>{fmt_brl(abs(var_rs))}</b> '
        f'({fmt_pct(abs(var_pct))}) em posição de {fmt_brl(val_pos)} com {pr_s} DU.<br>'
        f'Aproximação por D* ({fmt_num(dm_s,4)}): ΔP ≈ {fmt_pct(dm_s*abs(chq_d)*100)} '
        f'vs. exato {fmt_pct(abs(var_pct))}.</div>', unsafe_allow_html=True)


# ============================================================================
#  MÓDULO 2 — MERCADO MONETÁRIO E TAXAS DE JUROS
# ============================================================================
def render_mod2():
    st.markdown("## 💰 Mercado Monetário e Principais Taxas de Juros")
    st.markdown('<div class="info-box"><b>Pergunta gerencial:</b> "Qual benchmark devo usar '
                'nesta operação? Como se comparam as taxas que pratico com as referências do mercado?"</div>',
                unsafe_allow_html=True)
    tab1, tab2 = st.tabs(["📈 SELIC, CDI e Mercado Interbancário","📉 Curva de Juros (DI Futuro)"])
    with tab1: render_mod2_aba1()
    with tab2: render_mod2_aba2()

def render_mod2_aba1():
    with st.expander("📘 Conceito — SELIC, CDI e Mercado Interbancário"):
        st.markdown("""
**SELIC Meta:** taxa básica definida pelo COPOM a cada ~45 dias.

**SELIC Over:** taxa efetiva das compromissadas com títulos públicos no SELIC.

**CDI:** taxa das operações interbancárias sem lastro em títulos públicos.
SELIC Over e CDI caminham muito próximas (diferença < 0,10 p.p.), mas podem
se descolar em momentos de estresse. O CDI é o benchmark mais utilizado
para renda fixa privada no Brasil.
""")

    st.markdown("---")
    st.markdown("### Painel Histórico SELIC e CDI")
    df_meta = carregar_selic_meta()
    df_over = carregar_selic_over()
    df_cdi = carregar_cdi_diario()
    tem = not df_meta.empty or not df_over.empty or not df_cdi.empty

    if tem:
        todas_d = pd.concat([d["data"] for d in [df_meta,df_over,df_cdi] if not d.empty])
        dmin, dmax = todas_d.min().date(), todas_d.max().date()
        c1,c2 = st.columns(2)
        with c1:
            periodo = st.date_input("Período",
                value=(max(dmin, dmax-timedelta(days=3285)), dmax),
                min_value=dmin, max_value=dmax, key="sl_per")
        with c2:
            series_sel = st.multiselect("Séries",["SELIC Meta","SELIC Over","CDI"],
                                        default=["SELIC Meta","SELIC Over","CDI"],key="sl_ser")
        dt_i,dt_f = (periodo if isinstance(periodo,tuple) and len(periodo)==2 else (dmin,dmax))

        scfg = {"SELIC Meta":(df_meta,CORES["primaria"],"solid"),
                "SELIC Over":(df_over,CORES["secundaria"],"solid"),
                "CDI":(df_cdi,CORES["accent"],"dash")}
        fig = go.Figure()
        for nm in series_sel:
            df,cor,dash = scfg[nm]
            if not df.empty:
                m = (df["data"].dt.date>=dt_i)&(df["data"].dt.date<=dt_f)
                dff = df[m]
                fig.add_trace(go.Scatter(x=dff["data"],y=dff["valor"],mode="lines",name=nm,
                                         line=dict(color=cor,width=2,dash=dash)))
        fig.update_layout(**PLOTLY_LAYOUT,title="SELIC e CDI — Histórico",
                          xaxis_title="Data",yaxis_title="Taxa (% a.a.)",hovermode="x unified")
        st.plotly_chart(fig, use_container_width=True, config=PLOTLY_CFG)

        # Spread SELIC Over - CDI
        if not df_over.empty and not df_cdi.empty:
            dfs = pd.merge(df_over.rename(columns={"valor":"selic_over"}),
                           df_cdi.rename(columns={"valor":"cdi"}),on="data",how="inner")
            dfs["spread"] = dfs["selic_over"]-dfs["cdi"]
            m = (dfs["data"].dt.date>=dt_i)&(dfs["data"].dt.date<=dt_f)
            dfs = dfs[m]
            if not dfs.empty:
                fsp = go.Figure()
                fsp.add_trace(go.Scatter(x=dfs["data"],y=dfs["spread"],mode="lines",
                    name="Spread",line=dict(color=CORES["neutro"],width=1.5),
                    fill="tozeroy",fillcolor="rgba(46,117,182,0.15)"))
                fsp.add_hline(y=0,line_dash="dash",line_color="gray")
                fsp.update_layout(**PLOTLY_LAYOUT,title="Spread SELIC Over − CDI",
                                  xaxis_title="Data",yaxis_title="Spread (p.p.)",height=300)
                st.plotly_chart(fsp, use_container_width=True, config=PLOTLY_CFG)

        # Estatísticas
        st.markdown("#### Estatísticas do Período")
        stats = []
        for nm in series_sel:
            df,_,_ = scfg[nm]
            if not df.empty:
                m = (df["data"].dt.date>=dt_i)&(df["data"].dt.date<=dt_f)
                v = df[m]["valor"]
                if not v.empty:
                    stats.append({"Série":nm,"Média (%)":f"{v.mean():.2f}",
                                  "Mín (%)":f"{v.min():.2f}","Máx (%)":f"{v.max():.2f}",
                                  "Desvio":f"{v.std():.2f}"})
        if stats: st.dataframe(pd.DataFrame(stats),use_container_width=True,hide_index=True)
    else:
        st.info("📂 Carregue os CSVs de SELIC e CDI em `data/` para habilitar o painel.")

    st.markdown("---")
    st.markdown("### Calculadora de CDI Acumulado")
    df_cdi = carregar_cdi_diario()
    if not df_cdi.empty:
        dmin_c,dmax_c = df_cdi["data"].min().date(), df_cdi["data"].max().date()
        c1,c2 = st.columns(2)
        with c1:
            di_cdi = st.date_input("Data início",value=max(dmin_c,dmax_c-timedelta(days=180)),
                                   min_value=dmin_c,max_value=dmax_c,key="cd_di")
            val_ap = st.number_input("Valor aplicado (R$)",value=1_000_000,step=100_000,format="%d",key="cd_vl")
        with c2:
            df_cdi_d = st.date_input("Data fim",value=dmax_c,min_value=dmin_c,max_value=dmax_c,key="cd_df")
            pct_c = st.number_input("% do CDI",value=100.0,step=5.0,format="%.1f",key="cd_pc",
                                    help="Ex.: 100%, 110%, 80%")
        if df_cdi_d > di_cdi:
            m = (df_cdi["data"].dt.date>=di_cdi)&(df_cdi["data"].dt.date<=df_cdi_d)
            cdi_p = df_cdi[m].set_index("data")["valor"]
            if not cdi_p.empty:
                f100 = fator_cdi_acumulado(cdi_p, 100.0)
                fpct = fator_cdi_acumulado(cdi_p, pct_c)
                ft100,ftpct = f100.iloc[-1], fpct.iloc[-1]
                rend = val_ap*(ftpct-1)
                tx_per = (ftpct-1)*100
                du_p = len(cdi_p)
                tx_aa = ((ftpct)**(252/du_p)-1)*100 if du_p>0 else 0
                c1,c2,c3,c4,c5 = st.columns(5)
                with c1: st.metric("Fator CDI 100%",fmt_num(ft100,8))
                with c2: st.metric(f"Fator {fmt_pct(pct_c,0)} CDI",fmt_num(ftpct,8))
                with c3: st.metric("Rendimento",fmt_brl(rend))
                with c4: st.metric("Taxa período",fmt_pct(tx_per))
                with c5: st.metric("Taxa a.a.",fmt_pct(tx_aa))

                fig_c = go.Figure()
                fig_c.add_trace(go.Scatter(x=f100.index,y=(val_ap*f100).values,mode="lines",
                    name="100% CDI",line=dict(color=CORES["secundaria"],width=2)))
                if pct_c != 100.0:
                    fig_c.add_trace(go.Scatter(x=fpct.index,y=(val_ap*fpct).values,mode="lines",
                        name=f"{fmt_pct(pct_c,0)} CDI",line=dict(color=CORES["accent"],width=2,dash="dash")))
                fig_c.update_layout(**PLOTLY_LAYOUT,title="Evolução da Aplicação",
                                    xaxis_title="Data",yaxis_title="Valor (R$)",hovermode="x unified")
                st.plotly_chart(fig_c, use_container_width=True, config=PLOTLY_CFG)
            else:
                st.warning("Sem dados de CDI para o período.")
    else:
        st.info("📂 Carregue `cdi_diario.csv` em `data/`.")

def render_mod2_aba2():
    with st.expander("📘 Conceito — Curva de Juros e DI Futuro"):
        st.markdown("""
A **curva de juros** é formada pelas taxas de diferentes prazos no mercado de **DI futuro** (B3).
- **Normal:** taxas longas > curtas → expectativa de alta ou prêmio de prazo.
- **Invertida:** curtas > longas → expectativa de queda.
- **Flat:** taxas semelhantes em todos os prazos.

**Taxas forward** revelam o que o mercado precifica para o CDI em períodos futuros.
""")
        st.latex(r"(1+s_L)^{t_L} = (1+s_C)^{t_C} \times (1+f)^{t_L - t_C}")

    from ettj import render as render_ettj

    render_ettj()    
    
    

# ============================================================================
#  MÓDULO 3 — CENÁRIO ECONÔMICO E TAXA DE JUROS
# ============================================================================
def render_mod3():
    st.markdown("## 🌎 Cenário Econômico e Taxa de Juros")
    st.markdown('<div class="info-box"><b>Pergunta gerencial:</b> "Dado o cenário macro, '
                'para onde vão os juros? Como posicionar minha carteira?"</div>',
                unsafe_allow_html=True)
    tab1, tab2 = st.tabs(["📊 Painel Macroeconômico","🔮 Simulador de Cenários"])
    with tab1: render_mod3_aba1()
    with tab2: render_mod3_aba2()

def render_mod3_aba1():
    st.markdown("### Indicadores Macroeconômicos — Brasil")
    df_sel = carregar_selic_meta(); df_ipca = carregar_ipca()
    df_cam = carregar_cambio(); df_cds = carregar_cds()
    df_focus = carregar_focus()

    # Acumular IPCA mensal em 12 meses (% a.a.)
    if not df_ipca.empty:
        df_ipca = df_ipca.sort_values('data').reset_index(drop=True)
        # Fator mensal: (1 + taxa/100), acumular janela de 12 meses, converter para %
        df_ipca['fator'] = 1 + df_ipca['valor'] / 100
        df_ipca['valor'] = (
            df_ipca['fator'].rolling(window=12).apply(lambda x: x.prod(), raw=True) - 1
        ) * 100
        df_ipca = df_ipca.dropna(subset=['valor']).drop(columns=['fator']).reset_index(drop=True)

    # Metrics
    dados = []
    def add_m(df,nome,suf=""):
        if not df.empty:
            u = df.iloc[-1]; p = df.iloc[-2] if len(df)>1 else None
            d = (u["valor"]-p["valor"]) if p is not None else None
            dados.append((nome,u["valor"],d,suf))
    add_m(df_sel,"SELIC Meta","% a.a."); add_m(df_ipca,"IPCA 12M","% a.a.")
    add_m(df_cam,"Câmbio R$/USD",""); add_m(df_cds,"CDS"," bps")
    
    if dados:
        cols = st.columns(len(dados))
        for i,(nm,v,d,s) in enumerate(dados):
            with cols[i]:
                ds = f"{d:+.2f}{s}" if d is not None else None
                st.metric(nm,f"{v:.2f}{s}",delta=ds)

    per_op = {"1A":365,"3A":1095,"5A":1825,"9A":3285}
    ps = st.radio("Período",list(per_op.keys()),horizontal=True,key="mc_p")
    dc = date.today()-timedelta(days=per_op[ps])

    def mini(df,tit,cor,cont,yl="",meta=None):
        if not df.empty:
            m = df["data"].dt.date>=dc; dff = df[m]
            if not dff.empty:
                f = go.Figure()
                f.add_trace(go.Scatter(x=dff["data"],y=dff["valor"],mode="lines",
                                       line=dict(color=cor,width=2),showlegend=False))
                if meta: f.add_hline(y=meta,line_dash="dash",line_color="gray",
                                     annotation_text=f"Meta: {meta}%")
                f.update_layout(**PLOTLY_LAYOUT)
                f.update_layout(title=tit,height=300,
                                xaxis_title="",yaxis_title=yl,
                                margin=dict(l=50,r=20,t=40,b=30))
                cont.plotly_chart(f,use_container_width=True,config=PLOTLY_CFG)

    c1,c2 = st.columns(2)
    mini(df_ipca,"IPCA Acum. 12M",CORES["accent"],c1,"% 12M",META_INFLACAO)
    mini(df_cam,"Câmbio R$/USD",CORES["secundaria"],c2,"R$/USD")
    c3,c4 = st.columns(2)
    mini(df_cds,"cds Brasil",CORES["negativo"],c3,"bps")
    mini(df_sel,"SELIC Meta",CORES["primaria"],c4,"% a.a.")

    st.markdown("---")
    st.markdown("### Pesquisa Focus — Expectativas do Mercado")
    if not df_focus.empty:
        vf_map = {"IPCA (ano corrente)":"IPCA_corrente","IPCA (ano seguinte)":"IPCA_seguinte",
                   "SELIC (ano corrente)":"SELIC_corrente","SELIC (ano seguinte)":"SELIC_seguinte",
                   "PIB (ano corrente)":"PIB_corrente","Câmbio (ano corrente)":"Cambio_corrente"}
        c1,c2 = st.columns(2)
        with c1: vf = st.selectbox("Variável",list(vf_map.keys()),key="fc_v")
        with c2: mo = st.slider("Período observação (meses)",3,24,12,key="fc_m")
        vk = vf_map[vf]; dfv = df_focus[df_focus["variavel"]==vk]
        if not dfv.empty:
            corte = dfv["data_coleta"].max()-pd.Timedelta(days=mo*30)
            dfv = dfv[dfv["data_coleta"]>=corte]
            ff = go.Figure()
            ff.add_trace(go.Scatter(x=dfv["data_coleta"],y=dfv["mediana"],mode="lines",
                                    line=dict(color=CORES["secundaria"],width=2.5)))
            ff.update_layout(**PLOTLY_LAYOUT,title=f"Expectativas Focus — {vf}",
                             xaxis_title="Data Coleta",yaxis_title="Mediana")
            st.plotly_chart(ff,use_container_width=True,config=PLOTLY_CFG)
        else: st.warning(f"Sem dados Focus para '{vf}'.")
    else:
        st.info("📂 Carregue `focus_expectativas.csv` em `data/`.")

def render_mod3_aba2():
    st.markdown("### Construtor de Cenários")
    st.markdown("Monte cenários macro e visualize a pressão sobre a SELIC. "
                "Modelo **simplificado para fins didáticos**.")
    selic_at = st.number_input("SELIC atual (% a.a.)",value=14.25,step=0.25,format="%.2f",key="cn_sl")

    def inp_cen(cont,label,sfx):
        with cont:
            st.markdown(f"#### {label}")
            ip = st.number_input("IPCA esperado 12M (%)",value=4.5,step=0.5,format="%.1f",key=f"cn_ip_{sfx}")
            pb = st.number_input("Cresc. PIB (%)",value=2.0,step=0.5,format="%.1f",key=f"cn_pb_{sfx}")
            cb = st.selectbox("Câmbio",list(CENARIO_DELTAS["cambio"].keys()),key=f"cn_cb_{sfx}")
            fi = st.selectbox("Fiscal",list(CENARIO_DELTAS["fiscal"].keys()),key=f"cn_fi_{sfx}")
            fd = st.selectbox("Externo (FED)",list(CENARIO_DELTAS["fed"].keys()),key=f"cn_fd_{sfx}")
            return ip,pb,cb,fi,fd

    cb,ca = st.columns(2)
    ib,pb,cb_v,fb,fedb = inp_cen(cb,"Cenário Base","b")
    ia,pa,ca_v,fa,feda = inp_cen(ca,"Cenário Alternativo","a")

    def calc_pressao(ip,pb,cb,fi,fd):
        d_ip = max(0,ip-META_INFLACAO)*CENARIO_DELTAS["ipca_pp"]
        d_ip -= max(0,META_INFLACAO-ip)*CENARIO_DELTAS["ipca_pp"]*0.5
        d_pb = max(0,pb-PIB_POTENCIAL)*CENARIO_DELTAS["pib_pp"]
        d_pb -= max(0,PIB_POTENCIAL-pb)*CENARIO_DELTAS["pib_pp"]*0.5
        d_cb = CENARIO_DELTAS["cambio"][cb]
        d_fi = CENARIO_DELTAS["fiscal"][fi]
        d_fd = CENARIO_DELTAS["fed"][fd]
        tot = d_ip+d_pb+d_cb+d_fi+d_fd
        det = {"Inflação (IPCA)":d_ip,"Atividade (PIB)":d_pb,
               "Câmbio":d_cb,"Fiscal":d_fi,"Externo (FED)":d_fd}
        return tot, det

    pr_b, dt_b = calc_pressao(ib,pb,cb_v,fb,fedb)
    pr_a, dt_a = calc_pressao(ia,pa,ca_v,fa,feda)

    st.markdown("---")
    st.markdown("### Resultado da Análise")
    comp = pd.DataFrame({
        "Fator": list(dt_b.keys())+["**TOTAL**"],
        "Base (bps)": [f"{v:+.0f}" for v in dt_b.values()]+[f"**{pr_b:+.0f}**"],
        "Alternativo (bps)": [f"{v:+.0f}" for v in dt_a.values()]+[f"**{pr_a:+.0f}**"],
    })
    st.dataframe(comp,use_container_width=True,hide_index=True)

    sl_b = selic_at + pr_b/100; sl_a = selic_at + pr_a/100
    c1,c2 = st.columns(2)
    with c1: st.metric("SELIC proj. — Base",fmt_pct(sl_b),delta=f"{pr_b:+.0f} bps")
    with c2: st.metric("SELIC proj. — Alternativo",fmt_pct(sl_a),delta=f"{pr_a:+.0f} bps")

    # Gauges de pressão
    def gauge(titulo, bps, container):
        bps_c = max(-400,min(400,bps))
        if bps>100: cor,lbl = CORES["negativo"],"Forte pressão de alta"
        elif bps>25: cor,lbl = CORES["accent"],"Pressão de alta"
        elif bps>-25: cor,lbl = CORES["neutro"],"Neutro"
        elif bps>-100: cor,lbl = CORES["secundaria"],"Pressão de queda"
        else: cor,lbl = CORES["positivo"],"Forte pressão de queda"

        fg = go.Figure(go.Indicator(
            mode="gauge+number",value=bps_c,number={"suffix":" bps"},
            title={"text":f"{titulo}<br><span style='font-size:0.8em;color:gray'>{lbl}</span>"},
            gauge={"axis":{"range":[-400,400]},"bar":{"color":cor},
                   "steps":[{"range":[-400,-100],"color":"rgba(46,139,87,0.2)"},
                            {"range":[-100,100],"color":"rgba(200,200,200,0.2)"},
                            {"range":[100,400],"color":"rgba(204,51,51,0.2)"}],
                   "threshold":{"line":{"color":"black","width":2},"thickness":0.75,"value":bps_c}}))
        fg.update_layout(**PLOTLY_LAYOUT)
        fg.update_layout(height=280,margin=dict(l=30,r=30,t=80,b=20))
        container.plotly_chart(fg,use_container_width=True,config=PLOTLY_CFG)

    g1,g2 = st.columns(2)
    gauge("Cenário Base",pr_b,g1); gauge("Cenário Alternativo",pr_a,g2)

    # Implicação para curva
    def impl_curva(bps):
        if bps > 75: return "Normal (positivamente inclinada) — mercado espera mais altas"
        elif bps < -75: return "Invertida — mercado espera cortes significativos"
        else: return "Relativamente flat — expectativa de estabilidade"

    c1,c2 = st.columns(2)
    with c1: st.info(f"**Curva (Base):** {impl_curva(pr_b)}")
    with c2: st.info(f"**Curva (Alt.):** {impl_curva(pr_a)}")

    st.markdown('<div class="info-box">Este modelo é uma <b>simplificação didática</b>. '
                'A tesouraria utiliza modelos econométricos sofisticados. O objetivo aqui é '
                'desenvolver a intuição sobre como variáveis macro se traduzem em movimentos de juros.</div>',
                unsafe_allow_html=True)


# ============================================================================
#  MÓDULO 4 — RISCO FINANCEIRO E TAXA DE JUROS
# ============================================================================
def render_mod4():
    st.markdown("## ⚠️ Risco Financeiro e Taxa de Juros")
    st.markdown('<div class="info-box"><b>Pergunta gerencial:</b> "Quanto risco estou correndo? '
                'Quanto do spread que capturo é compensação por risco?"</div>',
                unsafe_allow_html=True)
    tab1,tab2 = st.tabs(["📊 Decomposição da Taxa","📉 Risco de Mercado (MtM)"])
    with tab1: render_mod4_aba1()
    with tab2: render_mod4_aba2()

# --- Aba 4.1: Decomposição da Taxa ---
def render_mod4_aba1():
    with st.expander("📘 Conceito — Decomposição da Taxa de Juros"):
        st.markdown("""
A taxa de uma operação pode ser decomposta em:

$$i_{operação} = i_{livre\\_de\\_risco} + spread_{crédito} + prêmio_{liquidez} + prêmio_{prazo}$$

- **Taxa livre de risco (SELIC):** remuneração base, sem risco de crédito.
- **Spread de crédito:** compensação pelo risco de default do emissor.
- **Prêmio de liquidez:** compensação pela dificuldade de vender o ativo.
- **Prêmio de prazo:** residual — inclui risco de duration e incerteza.
""")

    st.markdown("---")
    st.markdown("### Decompositor de Taxas")

    # Inicializar session_state para comparativo
    if "dec_anterior" not in st.session_state:
        st.session_state["dec_anterior"] = None

    c1,c2 = st.columns(2)
    with c1:
        tx_op = st.number_input("Taxa da operação (% a.a.)",value=15.50,step=0.10,format="%.2f",key="dc_tx")
        tx_rf = st.number_input("Taxa livre de risco — SELIC (% a.a.)",value=14.25,step=0.25,format="%.2f",key="dc_rf")
    with c2:
        rating = st.selectbox("Rating do emissor",list(SPREADS_CREDITO.keys()),key="dc_rt")
        liquidez = st.selectbox("Liquidez",list(PREMIO_LIQUIDEZ.keys()),key="dc_lq")
        prazo_a = st.slider("Prazo (anos)",0.5,10.0,3.0,step=0.5,key="dc_pr")

    # Calcular componentes
    sp_cred_range = SPREADS_CREDITO[rating]
    sp_cred = np.mean(sp_cred_range) / 100  # bps para pp
    pr_liq_range = PREMIO_LIQUIDEZ[liquidez]
    pr_liq = np.mean(pr_liq_range) / 100

    spread_total = tx_op - tx_rf
    pr_prazo = spread_total - sp_cred - pr_liq

    componentes = {
        "Taxa Livre de Risco": tx_rf,
        "Spread de Crédito": sp_cred,
        "Prêmio de Liquidez": pr_liq,
        "Prêmio de Prazo": pr_prazo,
    }

    # Salvar para comparativo
    atual = {"rating": rating, "liquidez": liquidez, "componentes": componentes.copy()}

    if pr_prazo < 0:
        st.warning(f"⚠️ O prêmio de prazo residual é **negativo** ({fmt_pct(pr_prazo)}). "
                   f"Isso sugere que a taxa pode ser insuficiente para compensar os riscos.")

    # Gráfico waterfall
    labels = list(componentes.keys()) + ["Total"]
    valores = list(componentes.values())
    total = sum(valores)

    fig_w = go.Figure(go.Waterfall(
        x=labels,
        y=valores + [0],
        measure=["relative","relative","relative","relative","total"],
        connector={"line":{"color":"gray","width":1,"dash":"dot"}},
        increasing={"marker":{"color":CORES["secundaria"]}},
        decreasing={"marker":{"color":CORES["negativo"]}},
        totals={"marker":{"color":CORES["primaria"]}},
        text=[fmt_pct(v) for v in valores]+[fmt_pct(total)],
        textposition="outside",
    ))
    fig_w.update_layout(**PLOTLY_LAYOUT,title="Decomposição da Taxa de Juros",
                        yaxis_title="% a.a.",height=450)
    st.plotly_chart(fig_w, use_container_width=True, config=PLOTLY_CFG)

    # Tabela detalhada
    det = pd.DataFrame({
        "Componente": list(componentes.keys()),
        "Valor (% a.a.)": [fmt_pct(v) for v in componentes.values()],
        "Faixa indicativa": [
            f"—",
            f"{sp_cred_range[0]}-{sp_cred_range[1]} bps",
            f"{pr_liq_range[0]}-{pr_liq_range[1]} bps",
            "Residual",
        ],
    })
    st.dataframe(det, use_container_width=True, hide_index=True)

    # Comparativo antes/depois
    anterior = st.session_state.get("dec_anterior")
    if anterior and (anterior["rating"] != rating or anterior["liquidez"] != liquidez):
        st.markdown("#### Comparativo com parâmetros anteriores")
        comp_data = []
        for comp_nome in componentes:
            v_atual = componentes[comp_nome]
            v_anterior = anterior["componentes"].get(comp_nome, 0)
            diff = v_atual - v_anterior
            comp_data.append({
                "Componente": comp_nome,
                "Anterior (%)": fmt_pct(v_anterior),
                "Atual (%)": fmt_pct(v_atual),
                "Δ (p.p.)": f"{diff:+.2f}",
            })
        st.dataframe(pd.DataFrame(comp_data), use_container_width=True, hide_index=True)

    st.session_state["dec_anterior"] = atual

    st.markdown('<div class="info-box">Quando um gestor avalia uma operação, precisa entender '
                'se o spread compensa cada fonte de risco. Uma taxa atrativa pode esconder '
                'risco de crédito ou liquidez subestimado.</div>', unsafe_allow_html=True)

# --- Aba 4.2: Risco de Mercado (MtM) ---
def render_mod4_aba2():
    with st.expander("📘 Conceito — Marcação a Mercado (MtM)"):
        st.markdown("""
**Mark-to-Market (MtM)** é a avaliação de uma posição pelo seu valor de mercado
(e não pelo custo de aquisição). É obrigatório por regulação do BCB e ANBIMA.

- **Na curva (accrual):** valor cresce gradualmente pela taxa de compra até o vencimento.
- **MtM:** valor reflete a taxa de mercado corrente — volátil, pode ser > ou < que a curva.

Se o título é carregado até o vencimento, a diferença se anula. Mas se a tesouraria
precisar vender antes, a perda MtM se materializa.
""")

    st.markdown("---")
    st.markdown("### Simulador de MtM em Posição de Renda Fixa")

    c1,c2 = st.columns(2)
    with c1:
        val_c = st.number_input("Valor na compra (R$)",value=10_000_000,step=1_000_000,format="%d",key="mt_vl")
        tx_c = st.number_input("Taxa na compra (% a.a.)",value=12.00,step=0.10,format="%.2f",key="mt_tc")
    with c2:
        pr_tot = st.slider("Prazo total (DU)",63,504,252,key="mt_du")
        traj_opcoes = [
            "Estável (taxa constante)",
            "Alta gradual (+200 bps em 6M)",
            "Queda gradual (-200 bps em 6M)",
            "Choque de alta (+150 bps no dia 30)",
            "Choque de queda (-150 bps no dia 30)",
        ]
        traj = st.selectbox("Trajetória da taxa",traj_opcoes,key="mt_tj")
        magnitude = st.slider("Magnitude do movimento (bps)",50,400,200 if "gradual" in traj else 150,
                              step=25,key="mt_mg")

    tx_compra = tx_c / 100.0
    pu_compra = pu_ltn(tx_compra, pr_tot)
    qtd = val_c / pu_compra
    mag = magnitude / 10000.0

    # Gerar trajetória de taxa
    dias = list(range(pr_tot + 1))
    taxas_mercado = []
    for d in dias:
        if "Estável" in traj:
            t = tx_compra
        elif "Alta gradual" in traj:
            progresso = min(d / (126), 1.0)  # 6 meses ~ 126 DU
            t = tx_compra + mag * progresso
        elif "Queda gradual" in traj:
            progresso = min(d / (126), 1.0)
            t = tx_compra - mag * progresso
        elif "Choque de alta" in traj:
            t = tx_compra + mag if d >= 30 else tx_compra
        elif "Choque de queda" in traj:
            t = tx_compra - mag if d >= 30 else tx_compra
        else:
            t = tx_compra
        taxas_mercado.append(t)

    # Calcular valores
    val_curva = []  # accrual
    val_mtm = []
    for d in dias:
        du_res = pr_tot - d
        # Curva: cresce pela taxa de compra
        pu_curva_d = pu_ltn(tx_compra, du_res)
        vc = qtd * pu_curva_d
        val_curva.append(vc)
        # MtM: precifica pela taxa de mercado
        pu_mtm_d = pu_ltn(taxas_mercado[d], du_res)
        vm = qtd * pu_mtm_d
        val_mtm.append(vm)

    # Gráfico principal
    fig_mtm = go.Figure()
    fig_mtm.add_trace(go.Scatter(x=dias,y=val_curva,mode="lines",name="Na Curva (accrual)",
                                  line=dict(color=CORES["secundaria"],width=2.5)))
    fig_mtm.add_trace(go.Scatter(x=dias,y=val_mtm,mode="lines",name="Mark-to-Market",
                                  line=dict(color=CORES["accent"],width=2.5)))

    # Área entre as curvas
    val_curva_arr = np.array(val_curva)
    val_mtm_arr = np.array(val_mtm)
    for i in range(len(dias)-1):
        cor_fill = CORES["positivo"] if val_mtm_arr[i] >= val_curva_arr[i] else CORES["negativo"]
        fig_mtm.add_trace(go.Scatter(
            x=[dias[i],dias[i+1],dias[i+1],dias[i]],
            y=[val_curva_arr[i],val_curva_arr[i+1],val_mtm_arr[i+1],val_mtm_arr[i]],
            fill="toself",fillcolor=cor_fill,opacity=0.15,
            line=dict(width=0),showlegend=False,hoverinfo="skip"))

    fig_mtm.update_layout(**PLOTLY_LAYOUT,title="Evolução: Curva vs. MtM",
                          xaxis_title="Dias Úteis",yaxis_title="Valor (R$)",
                          hovermode="x unified",height=500)
    st.plotly_chart(fig_mtm, use_container_width=True, config=PLOTLY_CFG)

    # Metrics
    res_curva = val_curva[-1] - val_c
    res_mtm = val_mtm[-1] - val_c
    dif_mtm = np.array(val_mtm) - np.array(val_curva)
    pior = dif_mtm.min()
    pior_dia = int(np.argmin(dif_mtm))

    c1,c2,c3,c4 = st.columns(4)
    with c1: st.metric("Resultado na Curva",fmt_brl(res_curva))
    with c2: st.metric("Resultado MtM",fmt_brl(res_mtm))
    with c3: st.metric("Diferença",fmt_brl(res_mtm-res_curva))
    with c4: st.metric("Pior momento MtM",f"{fmt_brl(pior)} (DU {pior_dia})")

    st.markdown('<div class="info-box">A diferença entre resultado na curva e MtM é '
                '<b>temporária</b> se o título for carregado até o vencimento. Porém, se a '
                'tesouraria precisar vender antes (liquidez ou limite de risco), a perda '
                'MtM se materializa. Este é o <b>dilema fundamental</b> do risco de mercado.</div>',
                unsafe_allow_html=True)


# ============================================================================
#  EXERCÍCIO INTEGRADOR — DECISÃO DE TESOURARIA
# ============================================================================
def render_integrador():
    st.markdown("## 🧩 Exercício Integrador — Decisão de Tesouraria")
    st.markdown('<div class="info-box"><b>Pergunta gerencial:</b> "Dadas as condições de mercado, '
                'qual a melhor alocação para a carteira de tesouraria?"</div>',
                unsafe_allow_html=True)

    st.markdown("### O Caso")
    st.markdown(
        "> Você é o gestor da tesouraria de um banco de médio porte e tem **R$ 50 milhões** "
        "para alocar. O COPOM decidiu manter a SELIC em 14,25%, mas sinalizou possibilidade "
        "de **alta na próxima reunião**. Inflação acumulada de 4,8% (acima da meta de 3%) "
        "e câmbio depreciou 3% no último mês. Curva de juros positivamente inclinada."
    )
    st.markdown(
        "**A:** LTN 1A — 14,80% a.a., 252 DU | "
        "**B:** NTN-B 3A — IPCA + 7,20% a.a. (inflação proj.: 3% a.a.) | "
        "**C:** Compromissada — SELIC Over, overnight | "
        "**D:** Debênture AAA — CDI + 80 bps, 2 anos, liquidez média"
    )

    st.markdown("---")
    st.markdown("### Painel de Decisão")
    TOTAL = 50_000_000

    st.markdown("**Distribua R$ 50 milhões (3 sliders livres, 4º = complemento):**")
    c1, c2 = st.columns(2)
    with c1:
        pct_a = st.slider("LTN 1A (%)", 0, 100, 25, 5, key="ig_a")
        pct_b = st.slider("NTN-B 3A (%)", 0, 100, 25, 5, key="ig_b")
        pct_c = st.slider("Compromissada (%)", 0, 100, 25, 5, key="ig_c")
    soma_abc = pct_a + pct_b + pct_c

    with c2:
        if soma_abc > 100:
            st.error(f"Soma dos 3 primeiros = {soma_abc}%. Reduza para no máximo 100%.")
            pct_d = 0
        else:
            pct_d = 100 - soma_abc
            st.metric("Debênture AAA (calculado)", f"{pct_d}%")
        st.markdown("---")
        cenarios_opcoes = [
            "Base (SELIC estável)",
            "Hawkish (alta de 100 bps em 3M)",
            "Dovish (corte de 100 bps em 3M)",
            "Estresse (alta 300 bps + abertura spread)",
        ]
        cenario = st.selectbox("Cenário para projeção", cenarios_opcoes, key="ig_cn")
        horizonte = st.slider("Horizonte (meses)", 1, 12, 6, key="ig_hz")

    if soma_abc > 100:
        st.warning("Ajuste os sliders acima para que a soma não exceda 100%.")
        return

    # Parâmetros do cenário
    selic_atual = 14.25
    taxa_ltn = 14.80
    taxa_ntnb_real = 7.20
    spread_deb = 0.80  # pp
    hz_du = int(horizonte * 21)  # dias úteis aprox.

    cenario_params = {
        "Base (SELIC estável)": {"delta_selic": 0, "delta_spread": 0},
        "Hawkish (alta de 100 bps em 3M)": {"delta_selic": 1.0, "delta_spread": 0.10},
        "Dovish (corte de 100 bps em 3M)": {"delta_selic": -1.0, "delta_spread": -0.05},
        "Estresse (alta 300 bps + abertura spread)": {"delta_selic": 3.0, "delta_spread": 0.50},
    }
    cp = cenario_params[cenario]
    selic_final = selic_atual + cp["delta_selic"]

    # Valor alocado
    val_a = TOTAL * pct_a / 100
    val_b = TOTAL * pct_b / 100
    val_c = TOTAL * pct_c / 100
    val_d = TOTAL * pct_d / 100

    # --- Cálculos por alternativa ---
    resultados = []

    # A: LTN prefixada
    du_ltn = 252
    pu_compra_a = pu_ltn(taxa_ltn / 100, du_ltn)
    du_res_a = max(1, du_ltn - hz_du)
    taxa_mercado_a = (taxa_ltn + cp["delta_selic"] * 100 / 100) / 100  # simplificação
    pu_mtm_a = pu_ltn(taxa_mercado_a, du_res_a)
    qtd_a = val_a / pu_compra_a if pu_compra_a > 0 else 0
    val_final_a = qtd_a * pu_mtm_a
    res_a = val_final_a - val_a
    rend_pct_a = (res_a / val_a * 100) if val_a > 0 else 0

    resultados.append({"Alternativa": "A: LTN 1A", "Alocado": val_a,
                       "Resultado": res_a, "Rend (%)": rend_pct_a})

    # B: NTN-B (IPCA + taxa real)
    taxa_nominal_b = (1 + taxa_ntnb_real / 100) * (1 + META_INFLACAO / 100) - 1
    # Simplificação: rendimento proporcional ao período
    fator_b = (1 + taxa_nominal_b) ** (hz_du / 252)
    # MtM: se juros sobem, NTN-B também perde (duration longa)
    du_ntnb = 756  # ~3 anos
    du_res_b = max(1, du_ntnb - hz_du)
    delta_taxa_b = cp["delta_selic"] / 100  # simplificação
    # Impacto MtM aproximado via duration
    dur_b = du_res_b / 252 / (1 + taxa_nominal_b)
    impacto_mtm_b = -dur_b * delta_taxa_b
    val_final_b = val_b * fator_b * (1 + impacto_mtm_b)
    res_b = val_final_b - val_b
    rend_pct_b = (res_b / val_b * 100) if val_b > 0 else 0

    resultados.append({"Alternativa": "B: NTN-B 3A", "Alocado": val_b,
                       "Resultado": res_b, "Rend (%)": rend_pct_b})

    # C: Compromissada (SELIC Over)
    # Rende aprox. SELIC, sem risco MtM
    selic_media = (selic_atual + selic_final) / 2
    fator_c = (1 + selic_media / 100) ** (hz_du / 252)
    val_final_c = val_c * fator_c
    res_c = val_final_c - val_c
    rend_pct_c = (res_c / val_c * 100) if val_c > 0 else 0

    resultados.append({"Alternativa": "C: Compromissada", "Alocado": val_c,
                       "Resultado": res_c, "Rend (%)": rend_pct_c})

    # D: Debênture AAA (CDI + spread)
    cdi_media = selic_media - 0.10  # CDI ≈ SELIC - 0,10
    taxa_deb = cdi_media + spread_deb + cp["delta_spread"]
    fator_d = (1 + taxa_deb / 100) ** (hz_du / 252)
    val_final_d = val_d * fator_d
    res_d = val_final_d - val_d
    rend_pct_d = (res_d / val_d * 100) if val_d > 0 else 0

    resultados.append({"Alternativa": "D: Debênture AAA", "Alocado": val_d,
                       "Resultado": res_d, "Rend (%)": rend_pct_d})

    # Total
    res_total = sum(r["Resultado"] for r in resultados)
    rend_total = (res_total / TOTAL) * 100
    # CDI equivalente
    cdi_equiv = rend_total / ((fator_c - 1) * 100) * 100 if (fator_c - 1) != 0 and val_c > 0 else 0

    # --- Tabela de resultados ---
    st.markdown("### Resultado Projetado")
    df_res = pd.DataFrame(resultados)
    df_res["% CDI eq."] = [
        (r["Rend (%)"] / ((fator_c - 1) * 100) * 100) if (fator_c - 1) != 0 else 0
        for r in resultados
    ]
    # Formatar
    df_show = pd.DataFrame({
        "Alternativa": df_res["Alternativa"],
        "Alocado": [fmt_brl(v) for v in df_res["Alocado"]],
        "Resultado (R$)": [fmt_brl(v) for v in df_res["Resultado"]],
        "Rendimento (%)": [fmt_pct(v) for v in df_res["Rend (%)"]],
        "% CDI equiv.": [fmt_pct(v, 0) for v in df_res["% CDI eq."]],
    })
    # Linha total
    total_row = pd.DataFrame({
        "Alternativa": ["**TOTAL CARTEIRA**"],
        "Alocado": [fmt_brl(TOTAL)],
        "Resultado (R$)": [fmt_brl(res_total)],
        "Rendimento (%)": [fmt_pct(rend_total)],
        "% CDI equiv.": [fmt_pct(cdi_equiv, 0) if cdi_equiv else "—"],
    })
    df_show = pd.concat([df_show, total_row], ignore_index=True)
    st.dataframe(df_show, use_container_width=True, hide_index=True)

    # Gráfico de composição (treemap)
    if any(v > 0 for v in [val_a, val_b, val_c, val_d]):
        labels_t = ["LTN 1A", "NTN-B 3A", "Compromissada", "Debênture AAA"]
        valores_t = [val_a, val_b, val_c, val_d]
        cores_t = [CORES["secundaria"], CORES["positivo"], CORES["primaria"], CORES["accent"]]
        # Filtrar zeros
        filt = [(l, v, c) for l, v, c in zip(labels_t, valores_t, cores_t) if v > 0]
        if filt:
            ls, vs, cs = zip(*filt)
            fig_pie = go.Figure(go.Pie(
                labels=ls, values=vs,
                marker=dict(colors=cs),
                textinfo="label+percent",
                hovertemplate="%{label}: R$ %{value:,.0f}<extra></extra>",
            ))
            fig_pie.update_layout(**PLOTLY_LAYOUT)
            fig_pie.update_layout(title="Composição da Carteira", height=400,
                                  margin=dict(l=20, r=20, t=50, b=20))
            st.plotly_chart(fig_pie, use_container_width=True, config=PLOTLY_CFG)

    # Evolução projetada da carteira
    st.markdown("### Evolução Projetada da Carteira")
    evolucao = []
    for d in range(hz_du + 1):
        val_total_d = 0
        # A: LTN MtM
        du_r = max(1, du_ltn - d)
        prog = min(d / max(hz_du, 1), 1.0)
        tx_a_d = taxa_ltn / 100 + (cp["delta_selic"] / 100) * prog
        val_total_d += qtd_a * pu_ltn(tx_a_d, du_r)
        # B: NTN-B simplificado
        f_b_d = (1 + taxa_nominal_b) ** (d / 252)
        dur_b_d = max(1, du_ntnb - d) / 252 / (1 + taxa_nominal_b)
        imp_b_d = -dur_b_d * (cp["delta_selic"] / 100) * prog
        val_total_d += val_b * f_b_d * (1 + imp_b_d)
        # C: Compromissada
        selic_d = selic_atual + cp["delta_selic"] * prog
        f_c_d = (1 + selic_d / 100) ** (d / 252)
        val_total_d += val_c * f_c_d
        # D: Debênture
        taxa_d_d = (selic_d - 0.10) + spread_deb + cp["delta_spread"] * prog
        f_d_d = (1 + taxa_d_d / 100) ** (d / 252)
        val_total_d += val_d * f_d_d

        evolucao.append(val_total_d)

    fig_ev = go.Figure()
    fig_ev.add_trace(go.Scatter(x=list(range(hz_du + 1)), y=evolucao,
                                mode="lines", name="Valor da Carteira",
                                line=dict(color=CORES["secundaria"], width=2.5)))
    fig_ev.add_hline(y=TOTAL, line_dash="dash", line_color="gray",
                     annotation_text="Valor inicial")
    fig_ev.update_layout(**PLOTLY_LAYOUT, title=f"Evolução — Cenário: {cenario}",
                         xaxis_title="Dias Úteis", yaxis_title="Valor (R$)",
                         height=400)
    st.plotly_chart(fig_ev, use_container_width=True, config=PLOTLY_CFG)

    # Análise qualitativa automática
    st.markdown("### Análise da Alocação")
    pct_prefixado = pct_a + pct_b
    analises = []

    if pct_prefixado > 50:
        analises.append(
            f"Sua carteira está **{pct_prefixado}% concentrada em prefixados** "
            f"(LTN + NTN-B). No cenário de alta de juros, isso significa exposição "
            f"significativa a perdas MtM."
        )
    if pct_c > 50:
        analises.append(
            "A alocação em **compromissada protege contra alta de juros**, "
            "mas limita o ganho no cenário de cortes."
        )
    if pct_d > 0:
        analises.append(
            f"O risco de crédito da debênture é compensado por um spread de "
            f"{int(spread_deb * 100)} bps. Debêntures AAA raramente sofrem default, "
            f"mas em cenário de estresse a **liquidez se deteriora**."
        )
    if "Hawkish" in cenario or "Estresse" in cenario:
        if pct_a > 30:
            analises.append(
                f"No cenário **{cenario}**, a LTN sofre perda MtM significativa. "
                f"Com {pct_a}% alocado, considere reduzir exposição prefixada."
            )

    for a in analises:
        st.markdown(f'<div class="info-box">{a}</div>', unsafe_allow_html=True)

    # Questões para Reflexão
    st.markdown("---")
    st.markdown("### Questões para Reflexão")
    questoes = [
        "Qual cenário macroeconômico você considera mais provável? Sua alocação reflete essa convicção?",
        "Se o COPOM surpreender com decisão inesperada, qual alternativa sofre mais? Qual se beneficia?",
        "O spread da debênture compensa o risco de liquidez, considerando possível necessidade de venda antecipada?",
        "Como a concentração da alocação se compara com limites de risco típicos de uma tesouraria bancária?",
        "Se pudesse usar derivativos (DI futuro, opções de IDI), como complementaria sua alocação? *(Tema dos módulos seguintes.)*",
    ]
    for i, q in enumerate(questoes, 1):
        st.markdown(f"**{i}.** {q}")


# ============================================================================
#  MAIN — PONTO DE ENTRADA
# ============================================================================
def render():
    """Entry point quando chamado pelo hub central."""
    aplicar_css()
    pagina = sidebar_navegacao()

    dispatch = {
        "home": render_home,
        "mod1": render_mod1,
        "mod2": render_mod2,
        "mod3": render_mod3,
        "mod4": render_mod4,
        "integrador": render_integrador,
    }

    render_fn = dispatch.get(pagina, render_home)
    render_fn()


def main():
    configurar_pagina()
    render()


if __name__ == "__main__":
    main()