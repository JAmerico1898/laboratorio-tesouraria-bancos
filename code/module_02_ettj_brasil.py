"""
Laboratório de Operações de Tesouraria — Módulo 2
Estrutura Temporal das Taxas de Juros no Brasil
MBA em Bancos e Instituições Financeiras — FGV

Arquivo único: module_02_ettj_brasil.py
Para executar: streamlit run module_02_ettj_brasil.py

Dependências: streamlit, plotly, pandas, numpy, bizdays
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from datetime import date, timedelta, datetime
from typing import Dict, List, Optional
import warnings
warnings.filterwarnings("ignore")

# ============================================================================
#  BIZDAYS
# ============================================================================
try:
    from bizdays import Calendar
    try:
        cal = Calendar.load("ANBIMA")
    except Exception:
        _FER = []
        _MOV = [
            "2024-02-12","2024-02-13","2024-03-29","2024-05-30",
            "2025-03-03","2025-03-04","2025-04-18","2025-06-19",
            "2026-02-16","2026-02-17","2026-04-03","2026-06-04",
            "2027-02-08","2027-02-09","2027-03-26","2027-05-27",
        ]
        for a in range(2015, 2028):
            for md in ["01-01","04-21","05-01","09-07","10-12","11-02","11-15","12-25"]:
                _FER.append(f"{a}-{md}")
        cal = Calendar(holidays=sorted(set(_FER+_MOV)),
                       weekdays=["Saturday","Sunday"], name="ANBIMA_FB")
    BIZDAYS_OK = True
except ImportError:
    BIZDAYS_OK = False; cal = None

# ============================================================================
#  PALETA DE CORES E CONSTANTES
# ============================================================================
CORES = {
    "primaria": "#1B3A5C",    # títulos, cabeçalhos
    "secundaria": "#2E75B6",  # curva nominal DI
    "accent": "#C55A11",      # curva real NTN-B, alertas
    "fundo_claro": "#EAF3F8", # info boxes
    "positivo": "#2E8B57",    # ganhos
    "negativo": "#CC3333",    # perdas
    "neutro": "#888888",      # referências
    "amarelo": "#D4A012",     # prêmio de liquidez
    "inflacao": "#8B5CF6",    # inflação implícita / breakeven
    "dolar": "#059669",       # cupom cambial
    "forward": "#555555",     # forwards
}

PLOTLY_LAYOUT = dict(
    template="plotly_white",
    font=dict(family="Segoe UI, Arial, sans-serif", size=13),
    margin=dict(l=60, r=30, t=50, b=50),
    hoverlabel=dict(bgcolor="white", font_size=12),
)
PLOTLY_CFG = {"displayModeBar": False}

META_INFLACAO = 3.0  # % a.a. (centro da meta)
DATA_DIR = "data/"

# Thresholds para diagnóstico gerencial automático (calibráveis)
DIAG = {
    "curva_spread_normal_bps": 50,    # spread 1A-5A > X → normal
    "curva_spread_invertida_bps": -50, # spread 1A-5A < X → invertida
    "be_vs_focus_neutro_pp": 0.3,      # |BE - Focus| < X → neutro
    "be_vs_focus_alerta_pp": 0.8,      # |BE - Focus| > X → alerta
    "juro_real_baixo": 4.0,            # NTN-B curta < X% → acomodatício
    "juro_real_alto": 6.0,             # NTN-B curta > X% → restritivo
    "cupom_spread_alto_bps": 200,      # cupom - SOFR > X → caro
    "term_premium_alpha": 30,          # bps por ln(1+prazo) para prêmio de prazo
}

# Spreads de crédito indicativos (bps sobre CDI)
SPREADS_CREDITO = {
    "Soberano (0 bps)": 0,
    "AAA (30-60 bps)": 45,
    "AA (60-120 bps)": 90,
    "A (120-200 bps)": 160,
    "BBB (200-350 bps)": 275,
}
PREMIO_LIQUIDEZ = {
    "Alta — DI/Títulos Públicos (0-10 bps)": 5,
    "Média — Debêntures IG (20-60 bps)": 40,
    "Baixa — Crédito ilíquido (60-150 bps)": 105,
}

# Labels descritivos para datas de referência nos datasets
# >>> PONTO DE INSERÇÃO: ajustar conforme datas disponíveis nos CSVs <<<
DATAS_LABELS: Dict[str, str] = {
    # "2022-06-15": "2022-06-15 (SELIC 13,25% — pico do ciclo)",
    # "2023-08-02": "2023-08-02 (Início dos cortes)",
    # "2024-03-15": "2024-03-15 (Pré-COPOM, SELIC 10,75%)",
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
    div[data-testid="stMetric"]{background:#f8f9fa;border-radius:8px;
      padding:.8rem;border:1px solid #e9ecef}
    </style>""", unsafe_allow_html=True)

# ============================================================================
#  FUNÇÕES UTILITÁRIAS — MATEMÁTICA FINANCEIRA (base do Módulo 1)
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

def pu_ltn(taxa_aa: float, du: int) -> float:
    if du <= 0: return 1000.0
    return 1000.0 / ((1 + taxa_aa) ** (du / 252))

def taxa_forward(sc, pc, sl, pl):
    fl = (1+sl)**(pl/252); fc = (1+sc)**(pc/252)
    pf = pl - pc
    if fc == 0 or pf <= 0: return 0.0
    return (fl/fc)**(252/pf) - 1

def duration_modificada(taxa, du):
    return (du / 252) / (1 + taxa)

# ============================================================================
#  FUNÇÕES UTILITÁRIAS — CURVE BUILDER (novas para Módulo 2)
# ============================================================================
def calcular_breakeven(taxa_nominal: float, taxa_real: float) -> float:
    """Inflação implícita: (1+nom)/(1+real) - 1. Taxas em decimal."""
    if (1 + taxa_real) == 0: return 0.0
    return (1 + taxa_nominal) / (1 + taxa_real) - 1

def calcular_forwards(curva_spot: Dict[int, float]) -> List[dict]:
    """
    Calcula forwards entre vértices consecutivos.
    curva_spot: {prazo_du: taxa_anual_decimal}
    Retorna lista de dicts com de_du, ate_du, forward_aa, forward_mensal.
    """
    vertices = sorted(curva_spot.keys())
    fwds = []
    for i in range(len(vertices)):
        if i == 0:
            # Primeiro vértice: forward = spot
            du = vertices[i]
            s = curva_spot[du]
            fwds.append({
                "de_du": 0, "ate_du": du,
                "spot_ini": None, "spot_fim": s,
                "forward_aa": s,
                "forward_mensal": ((1 + s) ** (21/252) - 1),
            })
        else:
            du_c, du_l = vertices[i-1], vertices[i]
            sc, sl = curva_spot[du_c], curva_spot[du_l]
            fwd = taxa_forward(sc, du_c, sl, du_l)
            fwds.append({
                "de_du": du_c, "ate_du": du_l,
                "spot_ini": sc, "spot_fim": sl,
                "forward_aa": fwd,
                "forward_mensal": ((1 + fwd) ** (21/252) - 1),
            })
    return fwds

def calcular_cupom_cambial(taxa_di: float, du: int, dc: int,
                           dolar_spot: float, dolar_futuro: float) -> float:
    """
    Cupom cambial implícito (% a.a., linear DC/360).
    taxa_di: decimal (ex.: 0.1325)
    Retorna: cupom em decimal.
    """
    if dolar_spot == 0 or dc == 0: return 0.0
    fator_di = (1 + taxa_di) ** (du / 252)
    razao_cambio = dolar_futuro / dolar_spot
    if razao_cambio == 0: return 0.0
    fator_cupom = fator_di / razao_cambio
    cupom = (fator_cupom - 1) * (360 / dc)
    return cupom

def construir_curva_cupom(df_mercado: pd.DataFrame,
                          dolar_spot: float) -> pd.DataFrame:
    """
    Constrói curva de cupom cambial.
    df_mercado: colunas [prazo_du, dc, taxa_di, cotacao_dol_futuro]
    Retorna DataFrame com coluna 'cupom_aa' adicionada.
    """
    df = df_mercado.copy()
    df["cupom_aa"] = df.apply(
        lambda r: calcular_cupom_cambial(
            r["taxa_di"]/100, int(r["prazo_du"]), int(r["dc"]),
            dolar_spot, r["cotacao_dol_futuro"]
        ) * 100, axis=1
    )
    return df

def premio_prazo(prazo_anos: float, alpha_bps: float = None) -> float:
    """Prêmio de prazo: alpha * ln(1 + prazo). Retorna em pp."""
    if alpha_bps is None:
        alpha_bps = DIAG["term_premium_alpha"]
    return alpha_bps / 100 * np.log(1 + prazo_anos)

def gerar_diagnostico(curvas: dict) -> Dict[str, str]:
    """
    Gera diagnóstico gerencial automático a partir das curvas calculadas.
    curvas: dict com chaves 'spot_nominal', 'spot_real', 'breakeven',
            'forwards', 'cupom', 'selic_atual', 'focus_ipca', 'sofr'
    Retorna dict com textos por tema.
    """
    diag = {}

    # 1. Formato da curva nominal
    spot = curvas.get("spot_nominal", {})
    if spot:
        verts = sorted(spot.keys())
        if len(verts) >= 2:
            curto = spot[verts[0]]
            longo = spot[verts[-1]]
            spread_bps = (longo - curto) * 10000
            if spread_bps > DIAG["curva_spread_normal_bps"]:
                fmt = "positivamente inclinada (normal)"
                impl = "prêmio de prazo ou expectativa de alta de juros"
            elif spread_bps < DIAG["curva_spread_invertida_bps"]:
                fmt = "invertida"
                impl = "cortes futuros de juros"
            else:
                fmt = "relativamente flat"
                impl = "expectativa de estabilidade"
            diag["curva"] = (
                f"📈 **Formato da Curva:** {fmt} (spread {verts[0]}→{verts[-1]} DU = "
                f"{spread_bps:+.0f} bps). Interpretação: {impl}."
            )

    # 2. Expectativa de juros via forwards
    fwds = curvas.get("forwards", [])
    selic = curvas.get("selic_atual", 0)
    if fwds and selic:
        fwd_media_12m = np.mean([f["forward_aa"] for f in fwds[:2]]) if len(fwds) >= 2 else fwds[0]["forward_aa"]
        fwd_pct = fwd_media_12m * 100
        rel = "ACIMA" if fwd_pct > selic else "ABAIXO"
        diag["juros"] = (
            f"🔮 **Expectativa de Juros:** Forwards precificam CDI médio de "
            f"{fwd_pct:.2f}% nos próximos 12M, {rel} da SELIC atual de {selic:.2f}%."
        )

    # 3. Inflação implícita
    be = curvas.get("breakeven", {})
    focus = curvas.get("focus_ipca", META_INFLACAO)
    if be:
        verts_be = sorted(be.keys())
        if verts_be:
            be_curto = be[verts_be[0]] * 100
            diff = be_curto - focus
            if abs(diff) < DIAG["be_vs_focus_neutro_pp"]:
                status = "alinhada com o consenso Focus"
            elif diff > DIAG["be_vs_focus_alerta_pp"]:
                status = "significativamente ACIMA do Focus — prêmio de risco inflacionário elevado"
            elif diff > 0:
                status = "acima do Focus — possível prêmio de risco de inflação"
            else:
                status = "abaixo do Focus — demanda por proteção inflacionária"
            diag["inflacao"] = (
                f"🎯 **Inflação Implícita:** Breakeven curto = {be_curto:.2f}% vs. "
                f"Focus = {focus:.2f}% (Δ = {diff:+.2f} pp). {status.capitalize()}."
            )

    # 4. Juro real
    real = curvas.get("spot_real", {})
    if real:
        verts_r = sorted(real.keys())
        if verts_r:
            jr_curto = real[verts_r[0]] * 100
            if jr_curto < DIAG["juro_real_baixo"]:
                nivel = "baixo — política monetária acomodatícia"
            elif jr_curto > DIAG["juro_real_alto"]:
                nivel = "elevado — política monetária restritiva"
            else:
                nivel = "em nível intermediário"
            diag["juro_real"] = (
                f"💵 **Juro Real:** NTN-B curta em {jr_curto:.2f}% a.a. — nível {nivel}."
            )

    # 5. Cupom cambial
    cupom = curvas.get("cupom", {})
    sofr = curvas.get("sofr", 5.0)
    if cupom:
        verts_cc = sorted(cupom.keys())
        if verts_cc:
            cc_ref = cupom[verts_cc[0]]
            spread_sofr = (cc_ref - sofr) * 100  # bps
            custo = "caro" if spread_sofr > DIAG["cupom_spread_alto_bps"] else "em nível moderado"
            diag["cupom"] = (
                f"💱 **Cupom Cambial:** {cc_ref*100:.2f}% a.a. (spread vs. SOFR = "
                f"{spread_sofr:.0f} bps). Custo de hedge {custo}."
            )

    # 6. Síntese
    partes = []
    if "curva" in diag: partes.append(diag["curva"])
    if "juros" in diag: partes.append(diag["juros"])
    if "inflacao" in diag: partes.append(diag["inflacao"])
    diag["sintese"] = (
        "📊 **Síntese:** " + " ".join([
            "Dado o padrão das curvas, o gestor deve considerar:",
            "posição em prefixado se forwards > sua visão de CDI;",
            "posição em IPCA+ se breakeven parece baixo vs. inflação esperada;",
            "pós-fixado se curva invertida sugere cortes iminentes;",
            f"hedge cambial ao custo vigente do cupom."
        ])
    )

    return diag

# ============================================================================
#  FORMATAÇÃO
# ============================================================================
def fmt_brl(v):
    if abs(v) >= 1e9: s = f"R$ {v/1e9:,.2f} bi"
    elif abs(v) >= 1e6: s = f"R$ {v/1e6:,.2f} mi"
    else: s = f"R$ {v:,.2f}"
    return s.replace(",","X").replace(".",",").replace("X",".")

def fmt_pct(v, c=2):
    return f"{v:,.{c}f}%".replace(",","X").replace(".",",").replace("X",".")

def fmt_num(v, c=2):
    return f"{v:,.{c}f}".replace(",","X").replace(".",",").replace("X",".")

# ============================================================================
#  CARGA DE DADOS — PONTOS DE INSERÇÃO PARA CSVs REAIS
# ============================================================================
@st.cache_data(ttl=86400)
def carregar_curvas_di():
    """CSV: data/curvas_di.csv | Colunas: data, prazo_du, taxa (% a.a.)
    Fonte: ANBIMA / B3 — taxas DI futuro por vértice e data."""
    try:
        return pd.read_csv(f"{DATA_DIR}curvas_di.csv",
                           parse_dates=["data"]).sort_values(["data","prazo_du"]).reset_index(drop=True)
    except FileNotFoundError:
        st.warning("⚠️ `curvas_di.csv` não encontrado em data/.")
        return pd.DataFrame(columns=["data","prazo_du","taxa"])

@st.cache_data(ttl=86400)
def carregar_ntnb_taxas():
    """CSV: data/ntnb_taxas.csv | Colunas: data, prazo_du, taxa (IPCA+ % a.a.)
    Prazos DU alinhados com os vértices de curvas_di.csv.
    Fonte: ANBIMA — taxas indicativas NTN-B."""
    try:
        return pd.read_csv(f"{DATA_DIR}ntnb_taxas.csv",
                           parse_dates=["data"]).sort_values(["data","prazo_du"]).reset_index(drop=True)
    except FileNotFoundError:
        st.warning("⚠️ `ntnb_taxas.csv` não encontrado em data/.")
        return pd.DataFrame(columns=["data","prazo_du","taxa"])

@st.cache_data(ttl=86400)
def carregar_dolar_futuro():
    """CSV: data/dolar_futuro.csv | Colunas: data, prazo_du, dc, cotacao (R$/USD)
    Fonte: B3 — ajuste de dólar futuro por vértice."""
    try:
        return pd.read_csv(f"{DATA_DIR}dolar_futuro.csv",
                           parse_dates=["data"]).sort_values(["data","prazo_du"]).reset_index(drop=True)
    except FileNotFoundError:
        st.warning("⚠️ `dolar_futuro.csv` não encontrado em data/.")
        return pd.DataFrame(columns=["data","prazo_du","dc","cotacao"])

@st.cache_data(ttl=86400)
def carregar_dolar_spot():
    """CSV: data/dolar_spot_ptax.csv | Colunas: data, valor (R$/USD)
    Fonte: SGS/BCB série 1 — PTAX venda."""
    try:
        return pd.read_csv(f"{DATA_DIR}dolar_spot_ptax.csv",
                           parse_dates=["data"]).sort_values("data").reset_index(drop=True)
    except FileNotFoundError:
        st.warning("⚠️ `dolar_spot_ptax.csv` não encontrado em data/.")
        return pd.DataFrame(columns=["data","valor"])

@st.cache_data(ttl=86400)
def carregar_sofr():
    """CSV: data/sofr_referencia.csv | Colunas: data, valor (% a.a.)
    Fonte: FRED / NY Fed — pode ser série simplificada ou valor fixo."""
    try:
        return pd.read_csv(f"{DATA_DIR}sofr_referencia.csv",
                           parse_dates=["data"]).sort_values("data").reset_index(drop=True)
    except FileNotFoundError:
        return pd.DataFrame(columns=["data","valor"])

@st.cache_data(ttl=86400)
def carregar_focus_ipca():
    """CSV: data/focus_ipca.csv | Colunas: data_coleta, variavel, mediana
    Variáveis: IPCA_12m, IPCA_corrente, IPCA_seguinte.
    Fonte: SGS/BCB — Focus."""
    try:
        return pd.read_csv(f"{DATA_DIR}focus_ipca.csv",
                           parse_dates=["data_coleta"]).sort_values("data_coleta").reset_index(drop=True)
    except FileNotFoundError:
        return pd.DataFrame(columns=["data_coleta","variavel","mediana"])

@st.cache_data(ttl=86400)
def carregar_breakeven_hist():
    """CSV: data/breakeven_historico.csv | Colunas: data, prazo_du, breakeven (% a.a.)
    Série pré-calculada (opcional). Se ausente, calcula-se a partir de DI e NTN-B."""
    try:
        return pd.read_csv(f"{DATA_DIR}breakeven_historico.csv",
                           parse_dates=["data"]).sort_values(["data","prazo_du"]).reset_index(drop=True)
    except FileNotFoundError:
        return pd.DataFrame(columns=["data","prazo_du","breakeven"])

@st.cache_data(ttl=86400)
def carregar_cupom_hist():
    """CSV: data/cupom_cambial_hist.csv | Colunas: data, prazo_meses, cupom_aa (% a.a.)
    Série pré-calculada (opcional)."""
    try:
        return pd.read_csv(f"{DATA_DIR}cupom_cambial_hist.csv",
                           parse_dates=["data"]).sort_values("data").reset_index(drop=True)
    except FileNotFoundError:
        return pd.DataFrame(columns=["data","prazo_meses","cupom_aa"])

@st.cache_data(ttl=86400)
def carregar_selic_meta():
    """CSV: data/selic_meta.csv | Colunas: data, valor (% a.a.)
    Fonte: SGS/BCB série 432."""
    try:
        return pd.read_csv(f"{DATA_DIR}selic_meta.csv",
                           parse_dates=["data"]).sort_values("data").reset_index(drop=True)
    except FileNotFoundError:
        return pd.DataFrame(columns=["data","valor"])

@st.cache_data(ttl=86400)
def carregar_ipca_12m():
    """CSV: data/ipca_12m.csv | Colunas: data, valor (% acum. 12M)
    Fonte: SGS/BCB série 13522."""
    try:
        return pd.read_csv(f"{DATA_DIR}ipca_12m.csv",
                           parse_dates=["data"]).sort_values("data").reset_index(drop=True)
    except FileNotFoundError:
        return pd.DataFrame(columns=["data","valor"])

@st.cache_data(ttl=86400)
def carregar_cds():
    """CSV: data/cds_brasil.csv | Colunas: data, valor (bps) | Fonte: INVESTING"""
    try:
        df = pd.read_csv(f"{DATA_DIR}cds_brasil.csv", sep=';')
        df['data'] = pd.to_datetime(df['data'], format='%m/%d/%Y')
        df = df.rename(columns={'valor': 'valor'})  # já está correto
        return df.sort_values('data').reset_index(drop=True)
    except FileNotFoundError:
        return pd.DataFrame(columns=["data", "valor"])

def obter_datas_disponiveis() -> list:
    """Retorna lista de datas disponíveis nos datasets (DI + NTN-B com tolerância de 30 dias)."""
    df_di = carregar_curvas_di()
    df_nb = carregar_ntnb_taxas()
    if df_di.empty or df_nb.empty:
        if not df_di.empty:
            return sorted(df_di["data"].dt.strftime("%Y-%m-%d").unique())
        return []
    
    datas_di = sorted(df_di["data"].dt.normalize().unique())
    datas_nb = sorted(df_nb["data"].dt.normalize().unique())
    
    tolerancia = pd.Timedelta(days=30)
    datas_pareadas = []
    
    for d_di in datas_di:
        for d_nb in datas_nb:
            if abs(d_di - d_nb) <= tolerancia:
                datas_pareadas.append(pd.Timestamp(d_di).strftime("%Y-%m-%d"))
                break
    
    return sorted(set(datas_pareadas))

def opcoes_datas_com_labels(datas: list) -> list:
    return [DATAS_LABELS.get(d, d) for d in datas]

def obter_valor_na_data(df, data_str, col="valor"):
    """Retorna último valor <= data_str no DataFrame."""
    if df.empty: return None
    dt = pd.Timestamp(data_str)
    mask = df["data"] <= dt
    sub = df[mask]
    if sub.empty: return None
    return sub.iloc[-1][col]


# ============================================================================
#  NAVEGAÇÃO E PÁGINA HOME
# ============================================================================
def configurar_pagina():
    st.set_page_config(page_title="Laboratório de Tesouraria — Módulo 2",
                       page_icon="📈", layout="wide", initial_sidebar_state="expanded")
    aplicar_css()

def sidebar_navegacao() -> str:
    with st.sidebar:
        st.markdown("### 🏛️ Laboratório de Tesouraria")
        st.markdown("**Módulo 2** — Estrutura Temporal das Taxas de Juros")
        st.markdown("---")
        paginas = {
            "🏛️ Visão Geral do Módulo 2": "home",
            "🧩 Componentes da Taxa de Juros": "mod1",
            "📈 Estrutura Temporal (ETTJ)": "mod2",
            "🔮 Taxa Forward (FRA)": "mod3",
            "💱 Cupom Cambial": "mod4",
            "🎯 Exercício Integrador": "integrador",
        }
        escolha = st.radio("Navegação", list(paginas.keys()), label_visibility="collapsed")
        st.markdown("---")
        st.caption("MBA em Bancos e Instituições Financeiras — FGV")
    return paginas[escolha]

def render_home():
    st.markdown("# Laboratório de Operações de Tesouraria")
    st.markdown("### Módulo 2 — Estrutura Temporal das Taxas de Juros no Brasil")
    st.markdown(
        '<div class="info-box">'
        "A curva de juros é o principal insumo de precificação da tesouraria. "
        "Neste módulo, você vai aprender a construí-la, lê-la e usá-la para "
        "tomar decisões. A progressão vai dos componentes da taxa até a leitura "
        "integrada de múltiplas curvas."
        '</div>', unsafe_allow_html=True)

    st.markdown("---")
    st.markdown("### Mapa do Módulo")
    st.markdown("Progressão: **Componentes → ETTJ/Spot → Forward → Cupom Cambial → Integrador**")

    modulos = [
        ("🧩","Componentes da Taxa","Por que um título de 5A paga mais que 1A?","mod1",""),
        ("📈","ETTJ e Taxa Spot","Como construir e ler a curva de juros?","mod2","✅ Módulo ativo"),
        ("🔮","Taxa Forward (FRA)","O que o mercado precifica de CDI futuro?","mod3",""),
        ("💱","Cupom Cambial","Quanto custa carregar posição em USD com hedge?","mod4",""),
    ]
    cols = st.columns(4)
    for i,(ic,tit,perg,pid,badge) in enumerate(modulos):
        with cols[i]:
            badge_html = f'<span style="color:#2E8B57;font-size:0.8em">{badge}</span>' if badge else ""
            st.markdown(
                f'<div class="modulo-card"><h4>{ic} {tit}</h4>'
                f'{badge_html}<p><i>"{perg}"</i></p></div>',
                unsafe_allow_html=True)

    st.markdown("---")
    st.markdown(
        '<div class="info-box">'
        '<b>🔗 Conexão com o Módulo 1:</b> Este módulo aprofunda a decomposição '
        'de taxas (Bloco 4 do Módulo 1) e expande o conceito de curva de juros '
        '(Aba 2.2). Os conceitos de precificação, duration e taxas referenciais '
        'são pré-requisitos.'
        '</div>', unsafe_allow_html=True)

    st.markdown("### Quadro-Resumo")
    quadro = pd.DataFrame({
        "Bloco": ["1","2","3","4","Integrador"],
        "Tópico": ["Componentes da Taxa de Juros","ETTJ e Taxa Spot (PRONTO)",
                    "Taxa Forward (FRA)","Cupom Cambial",
                    "Leitura Completa da Curva"],
        "Pergunta-Chave": [
            "De onde vem cada pedaço da taxa?",
            "Como construir a curva spot?",
            "O que o mercado precifica de CDI futuro?",
            "Quanto custa o hedge cambial?",
            "O que todas as curvas juntas dizem?"],
    })
    st.dataframe(quadro, use_container_width=True, hide_index=True)


# ============================================================================
#  MÓDULO 1 — COMPONENTES DA TAXA DE JUROS
# ============================================================================
def render_mod1():
    st.markdown("## 🧩 Componentes da Taxa de Juros")
    st.markdown('<div class="info-box"><b>Pergunta gerencial:</b> "Por que um título de 5 anos '
                'paga mais que um de 1 ano? De onde vem cada pedaço dessa taxa?"</div>',
                unsafe_allow_html=True)
    tab1, tab2 = st.tabs(["🔬 Anatomia da Taxa","📊 Inflação Implícita (Breakeven)"])
    with tab1: render_mod1_aba1()
    with tab2: render_mod1_aba2()

# --- Aba 1.1: Anatomia da Taxa ---
def render_mod1_aba1():
    with st.expander("📘 Conceito — Componentes da Taxa de Juros"):
        st.markdown("""
A taxa de juros de qualquer instrumento pode ser decomposta em cinco componentes:
""")
        st.latex(r"i_{nominal} = i_{real} + \pi^e + \phi_{crédito} + \phi_{liquidez} + \phi_{prazo}")
        st.markdown("""
- **Taxa real livre de risco:** remuneração pelo uso do capital no tempo, sem risco. Proxy: NTN-B curta.
- **Expectativa de inflação (πᵉ):** compensação pela perda de poder de compra.
- **Prêmio de crédito:** compensação pelo risco de default do emissor.
- **Prêmio de liquidez:** compensação pela dificuldade de vender o ativo.
- **Prêmio de prazo (term premium):** compensação adicional por imobilizar capital por mais tempo.

Na prática, os componentes não são diretamente observáveis — o mercado negocia a taxa total.
""")

    st.markdown("---")
    st.markdown("### Decompositor Interativo por Prazo")

    c1, c2 = st.columns(2)
    with c1:
        st.markdown("**Componentes base**")
        tx_real = st.number_input("Taxa real livre de risco (% a.a.)", value=5.00,
                                  step=0.25, format="%.2f", key="an_real",
                                  help="Proxy: juro real da NTN-B curta")
        exp_inflacao = st.number_input("Expectativa de inflação — IPCA (% a.a.)",
                                       value=4.50, step=0.25, format="%.2f", key="an_infl",
                                       help="Mediana Focus ou breakeven")
    with c2:
        st.markdown("**Prêmios**")
        credito = st.selectbox("Risco de crédito", list(SPREADS_CREDITO.keys()), key="an_cred")
        liquidez = st.selectbox("Liquidez", list(PREMIO_LIQUIDEZ.keys()), key="an_liq")
        prazo_anos = st.slider("Prazo do instrumento (anos)", 0.25, 10.0, 3.0, 0.25, key="an_prazo")

    sp_cred = SPREADS_CREDITO[credito] / 100  # pp
    sp_liq = PREMIO_LIQUIDEZ[liquidez] / 100
    sp_prazo = premio_prazo(prazo_anos)

    taxa_total = tx_real + exp_inflacao + sp_cred + sp_liq + sp_prazo
    spread_rf = (taxa_total - tx_real) * 100  # bps

    c1, c2, c3 = st.columns(3)
    with c1: st.metric("Taxa nominal total", fmt_pct(taxa_total))
    with c2: st.metric("Spread sobre taxa real", f"{spread_rf:.0f} bps")
    with c3: st.metric("Prêmio de prazo", fmt_pct(sp_prazo))

    # Waterfall
    comps = ["Taxa Real","Inflação Esperada","Prêmio Crédito","Prêmio Liquidez","Prêmio Prazo"]
    vals = [tx_real, exp_inflacao, sp_cred, sp_liq, sp_prazo]
    cores_w = [CORES["primaria"], CORES["inflacao"], CORES["accent"],
               CORES["amarelo"], CORES["neutro"]]

    fig_w = go.Figure(go.Waterfall(
        x=comps + ["Total"], y=vals + [0],
        measure=["relative"]*5 + ["total"],
        connector={"line":{"color":"gray","width":1,"dash":"dot"}},
        text=[fmt_pct(v) for v in vals] + [fmt_pct(taxa_total)],
        textposition="outside",
        increasing={"marker":{"color":CORES["secundaria"]}},
        decreasing={"marker":{"color":CORES["negativo"]}},
        totals={"marker":{"color":CORES["primaria"]}},
    ))
    fig_w.update_layout(**PLOTLY_LAYOUT, title="Decomposição da Taxa (Waterfall)",
                        yaxis_title="% a.a.", height=420)

    st.plotly_chart(fig_w, use_container_width=True, config=PLOTLY_CFG)

    # Gráfico de área empilhada por prazo
    st.markdown("#### Taxa por Prazo — Contribuição de Cada Componente")
    prazos = np.arange(0.25, 10.25, 0.25)
    areas = {
        "Taxa Real": np.full_like(prazos, tx_real),
        "Inflação Esperada": np.full_like(prazos, exp_inflacao),
        "Prêmio Crédito": np.full_like(prazos, sp_cred),
        "Prêmio Liquidez": np.full_like(prazos, sp_liq),
        "Prêmio Prazo": np.array([premio_prazo(p) for p in prazos]),
    }
    cores_area = [CORES["primaria"], CORES["inflacao"], CORES["accent"],
                  CORES["amarelo"], CORES["neutro"]]

    fig_a = go.Figure()
    for (nome, vals_a), cor in zip(areas.items(), cores_area):
        fig_a.add_trace(go.Scatter(
            x=prazos, y=vals_a, mode="lines", name=nome,
            stackgroup="one", fillcolor=cor, line=dict(width=0.5, color=cor),
        ))
    fig_a.update_layout(**PLOTLY_LAYOUT, title="Composição da Taxa por Prazo",
                        xaxis_title="Prazo (anos)", yaxis_title="Taxa (% a.a.)",
                        hovermode="x unified", height=420)
    st.plotly_chart(fig_a, use_container_width=True, config=PLOTLY_CFG)

    st.markdown('<div class="info-box">Na prática, os componentes não são diretamente '
                'observáveis — o mercado negocia a taxa total. Decompor é um exercício '
                'analítico que ajuda o gestor a avaliar se a taxa oferecida compensa '
                'adequadamente cada fonte de risco.</div>', unsafe_allow_html=True)

# --- Aba 1.2: Inflação Implícita (Breakeven) ---
def render_mod1_aba2():
    with st.expander("📘 Conceito — Inflação Implícita (Breakeven)"):
        st.markdown("**Relação de Fisher:**")
        st.latex(r"(1 + i_{nominal}) = (1 + i_{real}) \times (1 + \pi^{implícita})")
        st.latex(r"\pi^{implícita} = \frac{1 + i_{LTN}}{1 + i_{NTN\text{-}B}} - 1")
        st.markdown("""
A inflação implícita **não** é igual à expectativa de inflação pura — ela inclui
um prêmio de risco de inflação. Se breakeven > Focus, pode significar que o
mercado exige prêmio adicional pela incerteza inflacionária.
""")

    st.markdown("---")
    st.markdown("### Calculadora de Inflação Implícita")

    modo = st.radio("Modo", ["Usar dados pré-carregados","Inserir taxas manualmente"],
                    horizontal=True, key="be_modo")

    if modo == "Inserir taxas manualmente":
        c1,c2,c3 = st.columns(3)
        with c1: tx_ltn = st.number_input("Taxa LTN — prefixado (% a.a.)",value=12.80,step=0.05,format="%.2f",key="be_ltn")
        with c2: tx_ntnb = st.number_input("Taxa NTN-B — IPCA+ (% a.a.)",value=6.50,step=0.05,format="%.2f",key="be_ntnb")
        with c3: focus_v = st.number_input("Expectativa Focus IPCA (% a.a.)",value=4.50,step=0.10,format="%.2f",key="be_fc")

        be = calcular_breakeven(tx_ltn/100, tx_ntnb/100) * 100
        diff = be - focus_v

        c1,c2,c3 = st.columns(3)
        with c1: st.metric("Breakeven (inflação implícita)", fmt_pct(be))
        with c2: st.metric("Focus IPCA", fmt_pct(focus_v))
        cor_d = "normal" if abs(diff) < 0.3 else ("off" if diff > 0.8 else "normal")
        with c3: st.metric("Diferença", f"{diff:+.2f} pp",
                           delta_color="inverse" if diff > 0.8 else "normal")

        if abs(diff) < 0.3:
            st.success("Inflação implícita alinhada com o consenso Focus. Prêmio de risco neutro.")
        elif diff > 0.8:
            st.error("Breakeven significativamente acima do Focus — prêmio de risco inflacionário elevado.")
        elif diff > 0:
            st.warning("Breakeven acima do Focus — possível prêmio de risco de inflação.")
        else:
            st.info("Breakeven abaixo do Focus — pode indicar forte demanda por NTN-B.")

        st.markdown(
            '<div class="info-box">Se você acredita que a inflação ficará <b>abaixo</b> do breakeven, '
            'prefixados oferecem melhor retorno. Se acredita que ficará <b>acima</b>, '
            'indexados (IPCA+) são mais atrativos.</div>', unsafe_allow_html=True)

    else:
        # Dados pré-carregados
        datas = obter_datas_disponiveis()
        if not datas:
            st.info("📂 Carregue `curvas_di.csv` e `ntnb_taxas.csv` em `data/`.")
            return
        opcoes = opcoes_datas_com_labels(datas)
        dt_sel = st.selectbox("Data de referência", opcoes, key="be_dt")
        dt_str = dt_sel[:10]

        df_di = carregar_curvas_di()
        df_nb = carregar_ntnb_taxas()
        di_data = df_di[df_di["data"].dt.strftime("%Y-%m-%d") == dt_str].sort_values("prazo_du")
        nb_data = df_nb[df_nb["data"].dt.strftime("%Y-%m-%d") == dt_str].sort_values("prazo_du")

        if di_data.empty or nb_data.empty:
            st.warning("Dados incompletos para esta data.")
            return

        # Merge por prazo
        merged = pd.merge(di_data[["prazo_du","taxa"]].rename(columns={"taxa":"di"}),
                          nb_data[["prazo_du","taxa"]].rename(columns={"taxa":"ntnb"}),
                          on="prazo_du", how="inner")
        merged["breakeven"] = merged.apply(
            lambda r: calcular_breakeven(r["di"]/100, r["ntnb"]/100)*100, axis=1)
        merged["prazo_anos"] = merged["prazo_du"] / 252

        # Focus
        df_focus = carregar_focus_ipca()
        focus_val = META_INFLACAO
        if not df_focus.empty:
            fc_sub = df_focus[df_focus["variavel"]=="IPCA_12m"]
            if not fc_sub.empty:
                v = obter_valor_na_data(fc_sub.rename(columns={"data_coleta":"data","mediana":"valor"}), dt_str)
                if v is not None: focus_val = v

        # Gráfico de barras
        fig_be = go.Figure()
        fig_be.add_trace(go.Bar(x=merged["prazo_anos"], y=merged["breakeven"],
                                name="Breakeven", marker_color=CORES["inflacao"], opacity=0.8))
        fig_be.add_hline(y=focus_val, line_dash="dash", line_color=CORES["neutro"],
                         annotation_text=f"Focus: {focus_val:.1f}%")
        fig_be.add_hline(y=META_INFLACAO, line_dash="dot", line_color="gray",
                         annotation_text=f"Meta: {META_INFLACAO}%")
        fig_be.update_layout(**PLOTLY_LAYOUT, title="Inflação Implícita por Prazo",
                             xaxis_title="Prazo (anos)", yaxis_title="Breakeven (% a.a.)")
        st.plotly_chart(fig_be, use_container_width=True, config=PLOTLY_CFG)

        st.dataframe(merged[["prazo_anos","di","ntnb","breakeven"]].rename(columns={
            "prazo_anos":"Prazo (anos)","di":"DI (%)","ntnb":"NTN-B (%)","breakeven":"Breakeven (%)"}),
            use_container_width=True, hide_index=True)

    # Evolução histórica
    st.markdown("---")
    st.markdown("### Evolução Histórica da Inflação Implícita")
    df_be_hist = carregar_breakeven_hist()
    df_ipca = carregar_ipca_12m()
    if not df_be_hist.empty:
        prazos_disp = sorted(df_be_hist["prazo_du"].unique())
        prazo_labels = {p: f"{p/252:.0f} ano(s)" for p in prazos_disp}
        prazo_sel = st.selectbox("Prazo do breakeven", list(prazo_labels.values()), key="beh_pr")
        prazo_du_sel = [k for k,v in prazo_labels.items() if v == prazo_sel][0]

        df_bh = df_be_hist[df_be_hist["prazo_du"] == prazo_du_sel]
        fig_bh = go.Figure()
        fig_bh.add_trace(go.Scatter(x=df_bh["data"], y=df_bh["breakeven"],
                                    mode="lines", name="Breakeven",
                                    line=dict(color=CORES["inflacao"], width=2.5)))
        if not df_ipca.empty:
            fig_bh.add_trace(go.Scatter(x=df_ipca["data"], y=df_ipca["valor"],
                                        mode="lines", name="IPCA 12M",
                                        line=dict(color=CORES["accent"], width=2)))
        fig_bh.add_hline(y=META_INFLACAO, line_dash="dash", line_color="gray",
                         annotation_text=f"Meta: {META_INFLACAO}%")
        fig_bh.update_layout(**PLOTLY_LAYOUT, title=f"Breakeven {prazo_sel} — Histórico",
                             xaxis_title="Data", yaxis_title="% a.a.",
                             hovermode="x unified")
        st.plotly_chart(fig_bh, use_container_width=True, config=PLOTLY_CFG)
    else:
        st.info("📂 Carregue `breakeven_historico.csv` para visualizar o histórico (ou será calculado a partir de DI e NTN-B).")


# ============================================================================
#  MÓDULO 2 — ETTJ (PLACEHOLDER — módulo externo ettj.py)
# ============================================================================
def render_mod2_ettj():
    st.markdown("## 📈 Estrutura Temporal (ETTJ) e Taxa Spot")
    st.markdown(
        '<div class="info-box">'
        "Este módulo utiliza o componente ETTJ externo (<code>ettj.py</code>). "
        "Ele permite construir a curva spot a partir dos PUs de DI futuro, "
        "aplicar interpolação Flat Forward e comparar curvas de datas diferentes."
        '</div>', unsafe_allow_html=True)

    st.markdown("---")

    # Tentativa de importar e executar o módulo ETTJ externo
    try:
        import ettj
        if hasattr(ettj, "render"):
            ettj.render()
        else:
            st.warning("O módulo `ettj.py` foi encontrado mas não possui função `render()`. "
                       "Verifique a implementação.")
    except ImportError:
        st.info(
            "📂 **Módulo ETTJ não encontrado.** Coloque o arquivo `ettj.py` no mesmo "
            "diretório deste aplicativo para habilitar a construção interativa da curva.\n\n"
            "Enquanto isso, os módulos de Forward e Integrador funcionam com dados "
            "pré-carregados dos CSVs."
        )

    # Exibir dados da curva no session_state (se disponíveis)
    if "ettj_curva_spot" in st.session_state:
        st.success("✅ Curva spot disponível no session_state — os módulos Forward e Integrador podem importá-la.")
        spot = st.session_state["ettj_curva_spot"]
        dt_ref = st.session_state.get("ettj_data_referencia", "—")
        st.markdown(f"**Data de referência:** {dt_ref}")
        df_spot = pd.DataFrame({"Prazo (DU)": list(spot.keys()),
                                "Taxa Spot (% a.a.)": [f"{v*100:.2f}" for v in spot.values()]})
        st.dataframe(df_spot, use_container_width=True, hide_index=True)


# ============================================================================
#  MÓDULO 3 — TAXA FORWARD (FRA)
# ============================================================================
def render_mod3():
    st.markdown("## 🔮 Taxa Forward (FRA)")
    st.markdown('<div class="info-box"><b>Pergunta gerencial:</b> "O que o mercado está '
                'precificando de CDI para os próximos semestres? Se minha visão é diferente, '
                'como posso me posicionar?"</div>', unsafe_allow_html=True)
    tab1, tab2 = st.tabs(["📊 Calculadora de Forwards","📈 FRA e Estratégias"])
    with tab1: render_mod3_aba1()
    with tab2: render_mod3_aba2()

def _obter_curva_spot_input(key_prefix: str):
    """Helper: obtém curva spot de session_state, CSV ou input manual."""
    fontes = []
    if "ettj_curva_spot" in st.session_state:
        fontes.append("Importar do módulo ETTJ")
    fontes.extend(["Usar dataset pré-carregado", "Inserir manualmente"])
    fonte = st.selectbox("Fonte da curva spot", fontes, key=f"{key_prefix}_fonte")

    curva = {}  # {prazo_du: taxa_decimal}
    selic_atual = 14.25  # default

    if fonte == "Importar do módulo ETTJ":
        curva = st.session_state["ettj_curva_spot"]
        selic_meta = carregar_selic_meta()
        if not selic_meta.empty:
            selic_atual = selic_meta.iloc[-1]["valor"]

    elif fonte == "Usar dataset pré-carregado":
        datas = obter_datas_disponiveis()
        if not datas:
            st.info("📂 Carregue `curvas_di.csv` em `data/`.")
            return None, selic_atual
        opcoes = opcoes_datas_com_labels(datas)
        dt_sel = st.selectbox("Data de referência", opcoes, key=f"{key_prefix}_dt")
        dt_str = dt_sel[:10]
        df_di = carregar_curvas_di()
        di_data = df_di[df_di["data"].dt.strftime("%Y-%m-%d") == dt_str]
        for _, r in di_data.iterrows():
            curva[int(r["prazo_du"])] = r["taxa"] / 100
        selic_meta = carregar_selic_meta()
        v = obter_valor_na_data(selic_meta, dt_str)
        if v is not None: selic_atual = v

    else:  # Manual
        st.markdown("**Edite a tabela abaixo com os vértices da curva:**")
        default_data = pd.DataFrame({
            "Vértice": ["3M","6M","1A","18M","2A","3A","5A"],
            "Prazo (DU)": [63, 126, 252, 378, 504, 756, 1260],
            "Taxa Spot (% a.a.)": [14.25, 14.50, 14.80, 14.60, 14.30, 13.80, 13.20],
        })
        edited = st.data_editor(default_data, use_container_width=True, key=f"{key_prefix}_ed",
                                num_rows="fixed")
        for _, r in edited.iterrows():
            curva[int(r["Prazo (DU)"])] = r["Taxa Spot (% a.a.)"] / 100
        selic_atual = st.number_input("SELIC Meta atual (% a.a.)", value=14.25,
                                      step=0.25, format="%.2f", key=f"{key_prefix}_sl")

    if not curva:
        return None, selic_atual
    return curva, selic_atual

# --- Aba 3.1: Calculadora de Forwards ---
def render_mod3_aba1():
    with st.expander("📘 Conceito — Taxa Forward"):
        st.markdown("""
A **taxa forward** é a taxa que o mercado hoje trava para um período que começa no futuro.
""")
        st.latex(r"(1+s_2)^{DU_2/252} = (1+s_1)^{DU_1/252} \times (1+f_{1,2})^{(DU_2-DU_1)/252}")
        st.latex(r"f_{1,2} = \left[\frac{(1+s_2)^{DU_2/252}}{(1+s_1)^{DU_1/252}}\right]^{252/(DU_2-DU_1)} - 1")
        st.markdown("""
**Interpretação:** forward ≈ CDI esperado + prêmio de prazo. Separar os dois é o grande desafio analítico.
""")

    st.markdown("---")
    st.markdown("### Painel de Forwards Implícitas")

    curva, selic_atual = _obter_curva_spot_input("fw")
    if curva is None: return

    fwds = calcular_forwards(curva)
    if not fwds:
        st.warning("Curva insuficiente para calcular forwards.")
        return

    # Tabela
    df_fw = pd.DataFrame(fwds)
    df_fw["Período"] = df_fw.apply(
        lambda r: f"{r['de_du']/252:.1f}A → {r['ate_du']/252:.1f}A" if r['de_du'] > 0
        else f"Hoje → {r['ate_du']/252:.1f}A", axis=1)
    df_fw["Forward (% a.a.)"] = df_fw["forward_aa"] * 100
    df_fw["CDI mensal equiv."] = df_fw["forward_mensal"] * 100

    df_show = df_fw[["Período","de_du","ate_du","Forward (% a.a.)","CDI mensal equiv."]].copy()
    df_show.columns = ["Período","DU início","DU fim","Forward (% a.a.)","CDI mensal (%)"]
    st.dataframe(df_show.style.format({"Forward (% a.a.)": "{:.2f}",
                                        "CDI mensal (%)": "{:.4f}"}),
                 use_container_width=True, hide_index=True)

    
    # Gráfico: spot + forwards (degraus) + SELIC
    vertices = sorted(curva.keys())
    prazo_anos = [v/252 for v in vertices]

    # Detectar escala da curva
    max_curva = max(curva.values())
    if max_curva < 0.01:
        fator = 10000
    elif max_curva < 1:
        fator = 100
    else:
        fator = 1

    spot_vals = [curva[v] * fator for v in vertices]
    
    fig_fw = go.Figure()
    # Spot
    fig_fw.add_trace(go.Scatter(x=prazo_anos, y=spot_vals,
                                mode="lines+markers", name="Curva Spot",
                                line=dict(color=CORES["secundaria"], width=2.5),
                                marker=dict(size=6),
                                hovertemplate="Prazo: %{x:.2f} anos<br>Spot: %{y:.2f}%<extra></extra>"
    ))

    # Forwards como degraus
    fwd_x, fwd_y = [], []
    for f in fwds:
        x0 = f["de_du"]/252
        x1 = f["ate_du"]/252
        fv = f["forward_aa"] * fator
        fwd_x.extend([x0, x1, None])
        fwd_y.extend([fv, fv, None])
        
    fig_fw.add_trace(go.Scatter(
        x=fwd_x, y=fwd_y, mode="lines",
        name="Forwards",
        line=dict(color=CORES["accent"], width=3),
        hovertemplate="Prazo: %{x:.2f} anos<br>Fwd: %{y:.2f}%<extra></extra>"
    ))
    
    # SELIC
    
    fig_fw.add_hline(
    y=selic_atual, line_dash="dash", line_color=CORES["neutro"],
    annotation_text=f"SELIC: {selic_atual:.2f}%"
)
    
    fig_fw.update_layout(
        **PLOTLY_LAYOUT, 
        title="Curva Spot e Forwards Implícitas",
        xaxis_title="Prazo (anos)", 
        yaxis_title="Taxa (% a.a.)",
        hovermode="x unified"
    )
    fig_fw.update_yaxes(ticksuffix="%", tickformat=".2f")
    
    st.plotly_chart(fig_fw, use_container_width=True, config=PLOTLY_CFG)

    # Interpretação automática
    fwd_vals = [f["forward_aa"] * fator for f in fwds]
    if len(fwd_vals) >= 2:
        if all(fwd_vals[i] <= fwd_vals[i+1] for i in range(len(fwd_vals)-1)):
            padrao = "Forwards **crescentes** — o mercado precifica **ALTA** de juros."
        elif all(fwd_vals[i] >= fwd_vals[i+1] for i in range(len(fwd_vals)-1)):
            padrao = "Forwards **decrescentes** — o mercado precifica **QUEDA** de juros."
        else:
            pico_idx = np.argmax(fwd_vals)
            padrao = (f"Forwards com **pico intermediário** em {fwds[pico_idx]['de_du']/252:.1f}A–"
                      f"{fwds[pico_idx]['ate_du']/252:.1f}A ({fwd_vals[pico_idx]:.2f}%) — "
                      f"padrão típico de fim de ciclo de aperto.")
        max_fwd = max(fwd_vals)
        max_spread = max_fwd - selic_atual  # ambos em percentual
        st.markdown(f'<div class="info-box">{padrao}<br>'
                    f'Maior forward: {max_fwd:.2f}% ({max_spread*100:+.0f} bps vs. SELIC).</div>',
                    unsafe_allow_html=True)

    # Guardar forwards no session_state para aba 3.2
    st.session_state["mod3_forwards"] = fwds
    st.session_state["mod3_selic"] = selic_atual

# --- Aba 3.2: FRA e Estratégias ---
def render_mod3_aba2():
    with st.expander("📘 Conceito — FRA de DI"):
        st.markdown("""
O **FRA de DI** na B3 é a combinação de duas pernas de DI futuro: comprar um vértice
e vender outro equivale a "comprar" a forward entre eles.

- **Tomador:** aposta que CDI será **maior** que a forward.
- **Doador:** aposta que CDI será **menor** que a forward.

Usos: travar funding futuro, hedge de rolagem, posição direcional por período.
""")

    st.markdown("---")

    # --- Simulador de FRA ---
    st.markdown("### Simulador de Estratégia com FRA")
    fwds = st.session_state.get("mod3_forwards", [])
    selic = st.session_state.get("mod3_selic", 14.25)

    if not fwds or len(fwds) < 2:
        st.info("Calcule as forwards na aba anterior para habilitar o simulador.")
        return

    periodos = [f"{f['de_du']/252:.1f}A → {f['ate_du']/252:.1f}A" for f in fwds]
    c1, c2 = st.columns(2)
    with c1:
        per_sel = st.selectbox("Período do FRA", periodos, key="fra_per")
        posicao = st.selectbox("Posição", ["Tomador (CDI > forward)","Doador (CDI < forward)"], key="fra_pos")
    idx = periodos.index(per_sel)
    fwd_sel = fwds[idx]["forward_aa"] * 100

    with c2:
        nocional = st.number_input("Volume nocional (R$)", value=10_000_000,
                                   step=1_000_000, format="%d", key="fra_noc")
        cdi_real = st.slider("CDI realizado no período (% a.a.)", 5.0, 25.0,
                             float(round(fwd_sel, 2)), 0.25, key="fra_cdi")

    diff_bps = (cdi_real - fwd_sel) * 100
    du_periodo = fwds[idx]["ate_du"] - fwds[idx]["de_du"]
    fator_fwd = (1 + fwd_sel/100) ** (du_periodo/252)
    fator_cdi = (1 + cdi_real/100) ** (du_periodo/252)

    is_tomador = "Tomador" in posicao
    resultado = nocional * (fator_cdi/fator_fwd - 1) if is_tomador else nocional * (fator_fwd/fator_cdi - 1)

    c1,c2,c3,c4 = st.columns(4)
    with c1: st.metric("Forward contratada", fmt_pct(fwd_sel))
    with c2: st.metric("CDI realizado", fmt_pct(cdi_real))
    with c3: st.metric("Diferença", f"{diff_bps:+.0f} bps")
    with c4: st.metric("Resultado", fmt_brl(resultado))

    # Gráfico de payoff
    cdis_range = np.linspace(5, 25, 100)
    payoffs = []
    for c in cdis_range:
        fc = (1 + c/100) ** (du_periodo/252)
        if is_tomador:
            payoffs.append(nocional * (fc/fator_fwd - 1))
        else:
            payoffs.append(nocional * (fator_fwd/fc - 1))

    fig_pf = go.Figure()
    fig_pf.add_trace(go.Scatter(x=cdis_range, y=payoffs, mode="lines",
                                line=dict(color=CORES["secundaria"], width=2.5),
                                name="P&L", fill="tozeroy",
                                fillcolor="rgba(46,139,87,0.1)"))
    fig_pf.add_vline(x=fwd_sel, line_dash="dash", line_color=CORES["negativo"],
                     annotation_text=f"Forward: {fwd_sel:.2f}%")
    fig_pf.add_trace(go.Scatter(x=[cdi_real], y=[resultado], mode="markers",
                                marker=dict(color=CORES["accent"], size=12, symbol="diamond"),
                                name="CDI simulado"))
    fig_pf.add_hline(y=0, line_color="gray", line_width=1)
    fig_pf.update_layout(**PLOTLY_LAYOUT, title="Payoff do FRA",
                         xaxis_title="CDI realizado (% a.a.)", yaxis_title="P&L (R$)",
                         hovermode="x unified")
    st.plotly_chart(fig_pf, use_container_width=True, config=PLOTLY_CFG)

    st.markdown('<div class="info-box">O FRA permite à tesouraria isolar a exposição '
                'a um período específico da curva. Um tomador ganha se o CDI realizar '
                'acima da forward; um doador ganha se realizar abaixo.</div>',
                unsafe_allow_html=True)

    # --- Comparador de Visões ---
    st.markdown("---")
    st.markdown("### Comparador de Visões — Mercado vs. Sua Expectativa")
    st.markdown("Edite a coluna **Sua visão** e clique **Recalcular** para ver as divergências.")

    df_visao = pd.DataFrame({
        "Período": periodos,
        "Forward mercado (%)": [f["forward_aa"]*100 for f in fwds],
        "Sua visão CDI (%)": [f["forward_aa"]*100 for f in fwds],
    })
    edited_visao = st.data_editor(df_visao, use_container_width=True, key="visao_ed",
                                  column_config={
                                      "Período": st.column_config.TextColumn(disabled=True),
                                      "Forward mercado (%)": st.column_config.NumberColumn(disabled=True, format="%.2f"),
                                      "Sua visão CDI (%)": st.column_config.NumberColumn(format="%.2f"),
                                  })

    if st.button("🔄 Recalcular divergências", key="visao_btn"):
        edited_visao["Divergência (bps)"] = (
            (edited_visao["Sua visão CDI (%)"] - edited_visao["Forward mercado (%)"]) * 100
        ).round(0).astype(int)
        edited_visao["Estratégia"] = edited_visao["Divergência (bps)"].apply(
            lambda d: "Tomar FRA" if d > 25 else ("Dar FRA" if d < -25 else "Neutro"))

        st.dataframe(edited_visao, use_container_width=True, hide_index=True)

        # Gráfico de sobreposição
        fig_vis = go.Figure()
        fwd_x2, fwd_y2, vis_x, vis_y = [], [], [], []
        for i, f in enumerate(fwds):
            x0, x1 = f["de_du"]/252, f["ate_du"]/252
            fwd_x2.extend([x0,x1,None]); fwd_y2.extend([f["forward_aa"]*100]*2+[None])
            v = edited_visao.iloc[i]["Sua visão CDI (%)"]
            vis_x.extend([x0,x1,None]); vis_y.extend([v,v,None])

        fig_vis.add_trace(go.Scatter(x=fwd_x2, y=fwd_y2, mode="lines",
                                     name="Forward mercado",
                                     line=dict(color=CORES["secundaria"], width=3)))
        fig_vis.add_trace(go.Scatter(x=vis_x, y=vis_y, mode="lines",
                                     name="Sua visão",
                                     line=dict(color=CORES["accent"], width=3, dash="dash")))
        fig_vis.update_layout(**PLOTLY_LAYOUT, title="Mercado vs. Sua Visão",
                              xaxis_title="Prazo (anos)", yaxis_title="Taxa (% a.a.)",
                              hovermode="x unified")
        st.plotly_chart(fig_vis, use_container_width=True, config=PLOTLY_CFG)

        st.markdown('<div class="info-box">Divergir do mercado tem custo: se sua visão estiver '
                    'errada, a posição gera perda. O tamanho da divergência (bps) e a convicção '
                    'determinam o tamanho da posição. O mercado pode estar certo.</div>',
                    unsafe_allow_html=True)


# ============================================================================
#  MÓDULO 4 — CUPOM CAMBIAL
# ============================================================================
def render_mod4():
    st.markdown("## 💱 Cupom Cambial")
    st.markdown('<div class="info-box"><b>Pergunta gerencial:</b> "Quanto custa para minha '
                'tesouraria carregar uma posição em dólar com hedge? Faz sentido captar em '
                'dólar e converter para reais?"</div>', unsafe_allow_html=True)
    tab1, tab2 = st.tabs(["📐 Paridade e Cálculo","📈 Curva, Dinâmica e Hedge"])
    with tab1: render_mod4_aba1()
    with tab2: render_mod4_aba2()

def render_mod4_aba1():
    with st.expander("📘 Conceito — Cupom Cambial e Paridade Coberta (CIP)"):
        st.markdown("""
O **cupom cambial** é a taxa de juros em dólar obtida investindo em reais com hedge cambial.
É a taxa em dólar *onshore* — determinada pelo mercado brasileiro, não pelo FED.
""")
        st.latex(r"(1 + i_{BRL})^{DU/252} = (1 + cupom \times DC/360) \times \frac{F}{S}")
        st.latex(r"cupom = \left[\frac{(1 + i_{DI})^{DU/252}}{F/S} - 1\right] \times \frac{360}{DC}")
        st.markdown("""
- **F** = dólar futuro, **S** = dólar spot (PTAX).
- Convenção: cupom usa **DC/360** (linear), DI usa **DU/252** (composta).
- Cupom ≠ SOFR: o spread reflete condições onshore (risco-país, demanda por hedge, fluxo).
""")

    st.markdown("---")
    st.markdown("### Calculadora de Cupom Cambial")
    modo = st.radio("Modo", ["Usar dados pré-carregados","Inserir manualmente"],
                    horizontal=True, key="cc_modo")

    if modo == "Inserir manualmente":
        c1, c2 = st.columns(2)
        with c1:
            dol_spot = st.number_input("Dólar spot PTAX (R$/US$)", value=5.45, step=0.01, format="%.4f", key="cc_spot")
            dol_fut = st.number_input("Dólar futuro (R$/US$)", value=5.52, step=0.01, format="%.4f", key="cc_fut")
            taxa_di = st.number_input("Taxa DI (% a.a.)", value=13.25, step=0.10, format="%.2f", key="cc_di")
        with c2:
            du = st.number_input("Dias úteis até vencimento", value=126, step=1, key="cc_du")
            dc = st.number_input("Dias corridos até vencimento", value=183, step=1, key="cc_dc")
            sofr_ref = st.number_input("SOFR referência (% a.a.)", value=5.00, step=0.25, format="%.2f", key="cc_sofr")

        if dc > 0 and dol_spot > 0:
            cupom = calcular_cupom_cambial(taxa_di/100, du, dc, dol_spot, dol_fut) * 100
            fwd_pts = dol_fut - dol_spot
            spread_sofr = (cupom - sofr_ref) * 100

            c1,c2,c3,c4 = st.columns(4)
            with c1: st.metric("Cupom cambial", fmt_pct(cupom))
            with c2: st.metric("SOFR", fmt_pct(sofr_ref))
            with c3: st.metric("Spread cupom-SOFR", f"{spread_sofr:.0f} bps")
            with c4: st.metric("Forward points", f"{fwd_pts:+.4f}")

            with st.expander("📐 Cálculo passo a passo"):
                fator_di = (1 + taxa_di/100) ** (du/252)
                razao = dol_fut / dol_spot
                fator_cupom = fator_di / razao
                cupom_calc = (fator_cupom - 1) * (360/dc)
                st.markdown(f"**1.** Fator DI: (1 + {taxa_di/100:.4f})^({du}/252) = **{fator_di:.8f}**")
                st.markdown(f"**2.** Razao cambio: F/S = {dol_fut:.4f}/{dol_spot:.4f} = **{razao:.8f}**")
                st.markdown(f"**3.** Fator cupom: {fator_di:.8f} / {razao:.8f} = **{fator_cupom:.8f}**")
                st.markdown(f"**4.** Cupom (linear): ({fator_cupom:.8f} - 1) x 360/{dc} = **{cupom_calc*100:.4f}% a.a.**")

            st.markdown('<div class="info-box">O cupom cambial e o preco do hedge cambial. '
                        'Quando alto, hedgear e caro. Quando baixo (ou negativo), o hedge pode '
                        'ser fonte de receita.</div>', unsafe_allow_html=True)
    else:
        df_dol_f = carregar_dolar_futuro()
        df_dol_s = carregar_dolar_spot()
        df_di = carregar_curvas_di()
        if df_dol_f.empty or df_dol_s.empty or df_di.empty:
            st.info("📂 Carregue `dolar_futuro.csv`, `dolar_spot_ptax.csv` e `curvas_di.csv`.")
            return
        datas_dol = sorted(df_dol_f["data"].dt.strftime("%Y-%m-%d").unique())
        opcoes = opcoes_datas_com_labels(datas_dol)
        if not opcoes:
            st.warning("Sem datas disponiveis no dataset de dolar futuro.")
            return
        dt_sel = st.selectbox("Data de referencia", opcoes, key="cc_dt")
        dt_str = dt_sel[:10]
        dol_s_val = obter_valor_na_data(df_dol_s, dt_str)
        if dol_s_val is None:
            st.warning("PTAX nao disponivel para esta data.")
            return
        df_sofr = carregar_sofr()
        sofr_val = obter_valor_na_data(df_sofr, dt_str) if not df_sofr.empty else 5.0
        if sofr_val is None: sofr_val = 5.0

        dol_f_data = df_dol_f[df_dol_f["data"].dt.strftime("%Y-%m-%d") == dt_str]
        di_data = df_di[df_di["data"].dt.strftime("%Y-%m-%d") == dt_str]
        merged = pd.merge(
            dol_f_data[["prazo_du","dc","cotacao"]].rename(columns={"cotacao":"cotacao_dol_futuro"}),
            di_data[["prazo_du","taxa"]].rename(columns={"taxa":"taxa_di"}),
            on="prazo_du", how="inner")
        if merged.empty:
            st.warning("Sem vertices coincidentes entre DI e dolar futuro.")
            return
        df_cupom = construir_curva_cupom(merged, dol_s_val)
        st.metric("Dolar Spot (PTAX)", f"R$ {dol_s_val:.4f}")
        st.dataframe(
            df_cupom[["prazo_du","dc","taxa_di","cotacao_dol_futuro","cupom_aa"]].rename(columns={
                "prazo_du":"Prazo (DU)","dc":"DC","taxa_di":"DI (% a.a.)",
                "cotacao_dol_futuro":"Dolar Futuro","cupom_aa":"Cupom (% a.a.)"}),
            use_container_width=True, hide_index=True)

def render_mod4_aba2():
    st.markdown("### Curva de Cupom Cambial")
    df_dol_f = carregar_dolar_futuro()
    df_dol_s = carregar_dolar_spot()
    df_di = carregar_curvas_di()
    df_sofr = carregar_sofr()

    if not df_dol_f.empty and not df_dol_s.empty and not df_di.empty:
        datas_dol = sorted(df_dol_f["data"].dt.strftime("%Y-%m-%d").unique())
        opcoes = opcoes_datas_com_labels(datas_dol)
        if opcoes:
            dt_sel = st.selectbox("Data de referencia", opcoes, key="cc2_dt")
            dt_str = dt_sel[:10]
            dol_s_val = obter_valor_na_data(df_dol_s, dt_str)
            sofr_val = obter_valor_na_data(df_sofr, dt_str) if not df_sofr.empty else 5.0
            if sofr_val is None: sofr_val = 5.0

            if dol_s_val:
                dol_f_data = df_dol_f[df_dol_f["data"].dt.strftime("%Y-%m-%d") == dt_str]
                di_data = df_di[df_di["data"].dt.strftime("%Y-%m-%d") == dt_str]
                merged = pd.merge(
                    dol_f_data[["prazo_du","dc","cotacao"]].rename(columns={"cotacao":"cotacao_dol_futuro"}),
                    di_data[["prazo_du","taxa"]].rename(columns={"taxa":"taxa_di"}),
                    on="prazo_du", how="inner")
                if not merged.empty:
                    df_cupom = construir_curva_cupom(merged, dol_s_val)
                    prazo_m = df_cupom["prazo_du"] / 21
                    fig_cc = go.Figure()
                    fig_cc.add_trace(go.Scatter(
                        x=prazo_m, y=df_cupom["cupom_aa"],
                        mode="lines+markers", name="Cupom Cambial",
                        line=dict(color=CORES["dolar"], width=2.5), marker=dict(size=7),
                        hovertemplate="Prazo: %{x:.0f}M<br>Cupom: %{y:.2f}%<extra></extra>"))
                    fig_cc.add_hline(y=sofr_val, line_dash="dash", line_color=CORES["neutro"],
                                    annotation_text=f"SOFR: {sofr_val:.2f}%")
                    fig_cc.update_layout(**PLOTLY_LAYOUT, title="Curva de Cupom Cambial",
                                        xaxis_title="Prazo (meses)", yaxis_title="Cupom (% a.a.)",
                                        hovermode="x unified")
                    st.plotly_chart(fig_cc, use_container_width=True, config=PLOTLY_CFG)
    else:
        st.info("📂 Carregue os CSVs de dolar e DI para a curva de cupom.")

    st.markdown("---")
    st.markdown("### Evolução Histórica do Cupom Cambial")
    df_ch = carregar_cupom_hist()
    if not df_ch.empty:
        prazos_ch = sorted(df_ch["prazo_meses"].unique())
        pr_sel = st.selectbox("Prazo do cupom",
                              [f"{p} meses" for p in prazos_ch], key="ch_pr")
        pr_val = int(pr_sel.split()[0])
        df_ch_f = df_ch[df_ch["prazo_meses"] == pr_val]
        fig_ch = go.Figure()
        fig_ch.add_trace(go.Scatter(x=df_ch_f["data"], y=df_ch_f["cupom_aa"],
                                    mode="lines", name="Cupom Cambial",
                                    line=dict(color=CORES["dolar"], width=2),
                                    hovertemplate="Data: %{x}<br>Cupom: %{y:.2f}%<extra></extra>"))
        anotacoes = [("2020-03-15","COVID-19"),("2022-12-28","Virada 2022")]
        for dt_a, txt in anotacoes:
            try:
                dt = pd.Timestamp(dt_a)
                if dt >= df_ch_f["data"].min() and dt <= df_ch_f["data"].max():
                    fig_ch.add_vline(x=dt, line_dash="dot", line_color="gray", opacity=0.5)
                    fig_ch.add_annotation(x=dt, y=1.05, yref="paper", text=txt,
                                         showarrow=False, font=dict(size=10, color="gray"))
            except: pass
        fig_ch.update_layout(**PLOTLY_LAYOUT, title=f"Cupom Cambial ({pr_sel}) — Historico",
                             xaxis_title="Data", yaxis_title="Cupom (% a.a.)",
                             hovermode="x unified")
        st.plotly_chart(fig_ch, use_container_width=True, config=PLOTLY_CFG)
        st.markdown('<div class="info-box">O cupom cambial e um termometro da demanda por '
                    'dolar no mercado domestico. Picos sinalizam escassez de dolar ou demanda '
                    'excessiva por hedge. O BCB frequentemente intervem via swaps cambiais.</div>',
                    unsafe_allow_html=True)
    else:
        st.info("📂 Carregue `cupom_cambial_hist.csv` para o historico.")

    # --- Simulador de Hedge Cambial ---
    st.markdown("---")
    st.markdown("### Simulador de Decisao: Hedge Cambial")
    st.markdown("Compare o resultado de hedgear vs. manter exposicao cambial aberta.")

    c1, c2 = st.columns(2)
    with c1:
        pos_usd = st.number_input("Posicao em USD", value=5_000_000, step=500_000, format="%d", key="hd_usd")
        dol_sp = st.number_input("Dolar spot (R$/US$)", value=5.45, step=0.01, format="%.4f", key="hd_spot")
        cupom_h = st.number_input("Cupom cambial (% a.a.)", value=5.50, step=0.25, format="%.2f", key="hd_cup")
    with c2:
        rend_usd = st.number_input("Rendimento ativo USD (% a.a.)", value=5.00, step=0.25,
                                   format="%.2f", key="hd_rend", help="Ex.: SOFR + spread")
        prazo_m = st.slider("Prazo (meses)", 1, 12, 6, key="hd_pz")
        var_cambial = st.slider("Variacao cambial simulada (%)", -20, 20, 5, 1, key="hd_var",
                                help="Positivo = depreciacao do real")

    frac_ano = prazo_m / 12
    pos_brl = pos_usd * dol_sp

    # Com hedge: rendimento em USD convertido ao spot, custo = cupom
    rend_liq_hedge = pos_usd * (rend_usd/100 - cupom_h/100) * frac_ano * dol_sp
    # Sem hedge: rendimento + variacao cambial sobre o principal
    dol_final = dol_sp * (1 + var_cambial / 100)
    val_final_sem = pos_usd * (1 + rend_usd/100 * frac_ano) * dol_final
    rend_liq_sem = val_final_sem - pos_brl

    c1, c2 = st.columns(2)
    with c1:
        st.markdown("**Com hedge**")
        st.metric("Resultado em R$", fmt_brl(rend_liq_hedge))
        st.caption("Resultado fixo, independente do cambio")
    with c2:
        st.markdown("**Sem hedge (exposicao aberta)**")
        st.metric("Resultado em R$", fmt_brl(rend_liq_sem))
        st.caption(f"Cambio final: R$ {dol_final:.4f}")

    diferenca = rend_liq_sem - rend_liq_hedge
    if diferenca > 0:
        st.success(f"Neste cenario, nao hedgear gera R$ {fmt_brl(diferenca)} a mais.")
    else:
        st.error(f"Neste cenario, o hedge protege R$ {fmt_brl(abs(diferenca))}.")

    # Grafico de sensibilidade
    st.markdown("#### Sensibilidade ao Cambio")
    vars_range = np.linspace(-20, 20, 100)
    res_hedge = np.full_like(vars_range, rend_liq_hedge)
    res_sem = []
    for vc in vars_range:
        df_sim = dol_sp * (1 + vc / 100)
        vf = pos_usd * (1 + rend_usd/100 * frac_ano) * df_sim
        res_sem.append(vf - pos_brl)
    res_sem = np.array(res_sem)

    # Ponto de indiferenca
    diff_arr = res_sem - res_hedge
    # Encontrar cruzamento
    idx_cross = None
    for i in range(len(diff_arr)-1):
        if diff_arr[i] * diff_arr[i+1] <= 0:
            idx_cross = i
            break
    var_indiferenca = vars_range[idx_cross] if idx_cross is not None else None

    fig_hd = go.Figure()
    fig_hd.add_trace(go.Scatter(x=vars_range, y=res_hedge, mode="lines",
                                name="Com hedge", line=dict(color=CORES["dolar"], width=2.5),
                                hovertemplate="Var. cambial: %{x:.1f}%<br>Resultado: R$ %{y:,.0f}<extra></extra>"))
    fig_hd.add_trace(go.Scatter(x=vars_range, y=res_sem, mode="lines",
                                name="Sem hedge", line=dict(color=CORES["accent"], width=2.5),
                                hovertemplate="Var. cambial: %{x:.1f}%<br>Resultado: R$ %{y:,.0f}<extra></extra>"))
    fig_hd.add_trace(go.Scatter(x=[var_cambial], y=[rend_liq_sem], mode="markers",
                                name="Cenario simulado",
                                marker=dict(color=CORES["negativo"], size=12, symbol="diamond")))
    if var_indiferenca is not None:
        fig_hd.add_vline(x=var_indiferenca, line_dash="dot", line_color="gray")
        fig_hd.add_annotation(x=var_indiferenca, y=rend_liq_hedge,
                              text=f"Indiferenca: {var_indiferenca:.1f}%",
                              showarrow=True, arrowhead=2, ax=80, ay=-30,
                              font=dict(size=11, color=CORES["primaria"]))
    fig_hd.add_hline(y=0, line_color="gray", line_width=0.5)
    fig_hd.update_layout(**PLOTLY_LAYOUT, title="Resultado: Hedge vs. Exposicao Aberta",
                         xaxis_title="Variacao cambial no periodo (%)",
                         yaxis_title="Resultado (R$)", hovermode="x unified")
    st.plotly_chart(fig_hd, use_container_width=True, config=PLOTLY_CFG)

    if var_indiferenca is not None:
        st.markdown(
            f'<div class="info-box">'
            f'<b>Ponto de indiferenca:</b> variacao cambial de <b>{var_indiferenca:.1f}%</b>. '
            f'Acima disso, nao hedgear e mais lucrativo. Abaixo, o hedge protege.<br>'
            f'A decisao de hedge nao e apenas sobre expectativa de cambio — e sobre '
            f'tolerancia ao risco. Uma tesouraria com limites de VaR apertados pode '
            f'preferir o hedge mesmo esperando depreciacao.</div>', unsafe_allow_html=True)


# ============================================================================
#  EXERCÍCIO INTEGRADOR — LEITURA COMPLETA DA CURVA
# ============================================================================
def render_integrador():
    st.markdown("## 🎯 Exercicio Integrador — Leitura Completa da Curva")
    st.markdown('<div class="info-box"><b>Pergunta gerencial:</b> "Olhando todas as curvas '
                'juntas, o que o mercado esta dizendo? E o que minha tesouraria deveria fazer?"</div>',
                unsafe_allow_html=True)

    # --- Secao 1: Painel de Dados ---
    st.markdown("### 📋 Dados de Mercado — Data de Referencia")
    datas = obter_datas_disponiveis()
    if not datas:
        st.info("📂 Carregue os CSVs (curvas_di, ntnb_taxas, dolar_futuro, dolar_spot_ptax) em `data/`.")
        return
    opcoes = opcoes_datas_com_labels(datas)
    dt_sel = st.selectbox("Data de referencia", opcoes, key="int_dt")
    dt_str = dt_sel[:10]

    # Carregar todos os dados para a data
    df_di = carregar_curvas_di()
    df_nb = carregar_ntnb_taxas()
    df_dol_f = carregar_dolar_futuro()
    df_dol_s = carregar_dolar_spot()
    df_selic = carregar_selic_meta()
    df_ipca = carregar_ipca_12m()
    df_cds = carregar_cds()
    df_focus = carregar_focus_ipca()
    df_sofr = carregar_sofr()

    # Ficha tecnica
    selic_v = obter_valor_na_data(df_selic, dt_str)
    ipca_v = obter_valor_na_data(df_ipca, dt_str)
    dol_s_v = obter_valor_na_data(df_dol_s, dt_str)
    cds_v = obter_valor_na_data(df_cds, dt_str)
    sofr_v = obter_valor_na_data(df_sofr, dt_str) if not df_sofr.empty else 5.0
    if sofr_v is None: sofr_v = 5.0

    focus_ipca_v = META_INFLACAO
    if not df_focus.empty:
        fc_sub = df_focus[df_focus["variavel"] == "IPCA_12m"]
        fv = obter_valor_na_data(fc_sub.rename(columns={"data_coleta":"data","mediana":"valor"}), dt_str)
        if fv is not None: focus_ipca_v = fv

    cols = st.columns(5)
    vals = [("SELIC Meta", selic_v, "% a.a."), ("IPCA 12M", ipca_v, "%"),
            ("Focus IPCA", focus_ipca_v, "%"), ("Dolar PTAX", dol_s_v, ""),
            ("CDS", cds_v, " bps")]
    for i, (nm, v, sf) in enumerate(vals):
        with cols[i]:
            st.metric(nm, f"{v:.2f}{sf}" if v is not None else "N/D")

    # Dados brutos da data
    di_data = df_di[df_di["data"].dt.strftime("%Y-%m-%d") == dt_str].sort_values("prazo_du")
    nb_data = df_nb[df_nb["data"].dt.strftime("%Y-%m-%d") == dt_str].sort_values("prazo_du")

    merged_all = pd.merge(
        di_data[["prazo_du","taxa"]].rename(columns={"taxa":"di"}),
        nb_data[["prazo_du","taxa"]].rename(columns={"taxa":"ntnb"}),
        on="prazo_du", how="outer").sort_values("prazo_du")
    merged_all["prazo_anos"] = merged_all["prazo_du"] / 252

    # Adicionar dolar futuro se disponivel
    if not df_dol_f.empty:
        dol_data = df_dol_f[df_dol_f["data"].dt.strftime("%Y-%m-%d") == dt_str]
        if not dol_data.empty:
            merged_all = pd.merge(merged_all,
                                  dol_data[["prazo_du","dc","cotacao"]].rename(columns={"cotacao":"dol_futuro"}),
                                  on="prazo_du", how="left")

    with st.expander("📋 Dados brutos da data"):
        st.dataframe(merged_all, use_container_width=True, hide_index=True)

    st.markdown("---")

    # --- Secao 2: Construcao das Curvas ---
    st.markdown("### 📐 Construcao Automatica das Curvas")

    # Calcular todas as curvas
    curva_nominal = {}
    curva_real = {}
    curva_breakeven = {}
    curva_cupom = {}

    for _, r in merged_all.iterrows():
        du = int(r["prazo_du"])
        if pd.notna(r.get("di")): curva_nominal[du] = r["di"] / 100
        if pd.notna(r.get("ntnb")): curva_real[du] = r["ntnb"] / 100

    # Breakeven
    for du in sorted(set(curva_nominal.keys()) & set(curva_real.keys())):
        curva_breakeven[du] = calcular_breakeven(curva_nominal[du], curva_real[du])

    # Forwards
    forwards = calcular_forwards(curva_nominal) if curva_nominal else []

    # Cupom cambial
    if dol_s_v and "dol_futuro" in merged_all.columns:
        for _, r in merged_all.iterrows():
            if pd.notna(r.get("di")) and pd.notna(r.get("dol_futuro")) and pd.notna(r.get("dc")):
                du = int(r["prazo_du"])
                cc = calcular_cupom_cambial(r["di"]/100, du, int(r["dc"]), dol_s_v, r["dol_futuro"])
                curva_cupom[du] = cc

    # Grid 2x2 de graficos
    def detectar_fator(curva_dict):
        if not curva_dict:
            return 100
        mx = max(abs(v) for v in curva_dict.values())
        if mx < 0.01:
            return 10000
        elif mx < 1:
            return 100
        return 1

    fator_nominal = detectar_fator(curva_nominal) if curva_nominal else 100
    fator_real = detectar_fator(curva_real) if curva_real else 100
    fator_breakeven = detectar_fator(curva_breakeven) if curva_breakeven else 100
    
    fig_grid = make_subplots(rows=2, cols=2,
                             subplot_titles=["Curva Nominal (DI)","Curva Real (NTN-B)",
                                             "Inflacao Implicita","Forwards Nominais"],
                             shared_xaxes=False, vertical_spacing=0.12, horizontal_spacing=0.08)

    # Subplot 1: Nominal
    if curva_nominal:
        vn = sorted(curva_nominal.keys())
        fig_grid.add_trace(go.Scatter(x=[v/252 for v in vn], y=[curva_nominal[v]*fator_nominal for v in vn],
                                      mode="lines+markers", name="DI Spot",
                                      line=dict(color=CORES["secundaria"], width=2.5),
                                      marker=dict(size=5)), row=1, col=1)
        if selic_v:
            fig_grid.add_hline(y=selic_v, line_dash="dash", line_color="gray",
                               annotation_text=f"SELIC {selic_v:.1f}%", row=1, col=1)

    # Subplot 2: Real
    if curva_real:
        vr = sorted(curva_real.keys())
        fig_grid.add_trace(go.Scatter(x=[v/252 for v in vr], y=[curva_real[v]*fator_real for v in vr],
                                      mode="lines+markers", name="NTN-B",
                                      line=dict(color=CORES["accent"], width=2.5),
                                      marker=dict(size=5)), row=1, col=2)

    # Subplot 3: Breakeven
    if curva_breakeven:
        vb = sorted(curva_breakeven.keys())
        fig_grid.add_trace(go.Scatter(x=[v/252 for v in vb], y=[curva_breakeven[v]*fator_breakeven for v in vb],
                                      mode="lines+markers", name="Breakeven",
                                      line=dict(color=CORES["inflacao"], width=2.5),
                                      marker=dict(size=5)), row=2, col=1)
        fig_grid.add_hline(y=META_INFLACAO, line_dash="dash", line_color="gray",
                           annotation_text=f"Meta {META_INFLACAO}%", row=2, col=1)

    # Subplot 4: Forwards
    if forwards:
        fwd_x, fwd_y = [], []
        for f in forwards:
            x0, x1 = f["de_du"]/252, f["ate_du"]/252
            fwd_x.extend([x0, x1, None])
            fwd_y.extend([f["forward_aa"]*fator_nominal]*2 + [None])
        fig_grid.add_trace(go.Scatter(x=fwd_x, y=fwd_y, mode="lines", name="Forwards",
                                      line=dict(color=CORES["forward"], width=3)), row=2, col=2)
        if curva_nominal:
            vn = sorted(curva_nominal.keys())
            fig_grid.add_trace(go.Scatter(x=[v/252 for v in vn], y=[curva_nominal[v]*fator_nominal for v in vn],
                                          mode="lines", name="Spot (ref)",
                                          line=dict(color=CORES["secundaria"], width=1, dash="dot")), row=2, col=2)

    fig_grid.update_layout(height=700, showlegend=False,
                           template="plotly_white",
                           font=dict(family="Segoe UI, Arial", size=11),
                           margin=dict(l=50, r=30, t=60, b=40))
    def max_prazo(vertices_du, teto=None):
        if not vertices_du:
            return 10
        m = max(v / 252 for v in vertices_du)
        return min(m, teto) if teto else m

    x_ranges = {
        (1, 1): [0, max_prazo(list(curva_nominal.keys()) if curva_nominal else [])],
        (1, 2): [0, max_prazo(list(curva_real.keys()) if curva_real else [])],
        (2, 1): [0, max_prazo(list(curva_breakeven.keys()) if curva_breakeven else [])],
        (2, 2): [0, max_prazo(list(curva_nominal.keys()) if curva_nominal else [], teto=10)],
    }
    for i in range(1, 5):
        r, c = (i-1)//2+1, (i-1)%2+1
        fig_grid.update_xaxes(title_text="Prazo (anos)", range=x_ranges[(r, c)], row=r, col=c)
        fig_grid.update_yaxes(title_text="% a.a.", row=r, col=c)
        
    st.plotly_chart(fig_grid, use_container_width=True, config=PLOTLY_CFG)

    # Cupom separado
    if curva_cupom:
        vc = sorted(curva_cupom.keys())
        fig_cup = go.Figure()
        fig_cup.add_trace(go.Scatter(x=[v/21 for v in vc], y=[curva_cupom[v]*100 for v in vc],
                                     mode="lines+markers", name="Cupom Cambial",
                                     line=dict(color=CORES["dolar"], width=2.5), marker=dict(size=6),
                                     hovertemplate="Prazo: %{x:.0f}M<br>Cupom: %{y:.2f}%<extra></extra>"))
        fig_cup.add_hline(y=sofr_v, line_dash="dash", line_color=CORES["neutro"],
                          annotation_text=f"SOFR {sofr_v:.2f}%")
        fig_cup.update_layout(**PLOTLY_LAYOUT, title="Cupom Cambial",
                              xaxis_title="Prazo (meses)", yaxis_title="% a.a.",
                              height=350)
        st.plotly_chart(fig_cup, use_container_width=True, config=PLOTLY_CFG)

    # Tabela consolidada
    st.markdown("#### Tabela Consolidada")
    tab_data = []
    all_du = sorted(set(list(curva_nominal.keys()) + list(curva_real.keys())))
    for du in all_du:
        row = {"Prazo (anos)": f"{du/252:.1f}"}
        row["DI Spot (%)"] = f"{curva_nominal[du]*100:.2f}" if du in curva_nominal else "-"
        row["NTN-B (%)"] = f"{curva_real[du]*100:.2f}" if du in curva_real else "-"
        row["Breakeven (%)"] = f"{curva_breakeven[du]*100:.2f}" if du in curva_breakeven else "-"
        fwd_match = [f for f in forwards if f["ate_du"] == du]
        row["Forward (%)"] = f"{fwd_match[0]['forward_aa']*100:.2f}" if fwd_match else "-"
        row["Cupom (%)"] = f"{curva_cupom[du]*100:.2f}" if du in curva_cupom else "-"
        tab_data.append(row)
    if tab_data:
        st.dataframe(pd.DataFrame(tab_data), use_container_width=True, hide_index=True)

    st.markdown("---")

    # --- Secao 3: Diagnostico Gerencial ---
    st.markdown("### 🔍 Diagnostico Gerencial Automatico")
    curvas_dict = {
        "spot_nominal": curva_nominal,
        "spot_real": curva_real,
        "breakeven": curva_breakeven,
        "forwards": forwards,
        "cupom": curva_cupom,
        "selic_atual": selic_v or 14.25,
        "focus_ipca": focus_ipca_v,
        "sofr": sofr_v,
    }
    diag = gerar_diagnostico(curvas_dict)
    temas = [("curva","info"), ("juros","info"), ("inflacao","warning"),
             ("juro_real","info"), ("cupom","info"), ("sintese","success")]
    for chave, tipo in temas:
        if chave in diag:
            getattr(st, tipo)(diag[chave])

    st.markdown("---")

    # --- Secao 4: Comparacao Temporal ---
    st.markdown("### 🔄 Comparacao entre Datas")
    if len(datas) >= 2:
        c1, c2 = st.columns(2)
        with c1: dt1_sel = st.selectbox("Data 1 (referencia)", opcoes, index=0, key="cmp_d1")
        with c2: dt2_sel = st.selectbox("Data 2 (comparacao)", opcoes,
                                         index=min(1, len(opcoes)-1), key="cmp_d2")
        dt1_str, dt2_str = dt1_sel[:10], dt2_sel[:10]

        if dt1_str != dt2_str:
            di1 = df_di[df_di["data"].dt.strftime("%Y-%m-%d") == dt1_str].sort_values("prazo_du")
            di2 = df_di[df_di["data"].dt.strftime("%Y-%m-%d") == dt2_str].sort_values("prazo_du")
            nb1 = df_nb[df_nb["data"].dt.strftime("%Y-%m-%d") == dt1_str].sort_values("prazo_du")
            nb2 = df_nb[df_nb["data"].dt.strftime("%Y-%m-%d") == dt2_str].sort_values("prazo_du")

            fig_cmp = make_subplots(rows=1, cols=2,
                                    subplot_titles=["Curva Nominal (DI)", "Curva Real (NTN-B)"],
                                    shared_yaxes=False, horizontal_spacing=0.08)
            if not di1.empty:
                fig_cmp.add_trace(go.Scatter(x=di1["prazo_du"]/252, y=di1["taxa"],
                    mode="lines+markers", name=dt1_sel[:10],
                    line=dict(color=CORES["secundaria"], width=2.5)), row=1, col=1)
            if not di2.empty:
                fig_cmp.add_trace(go.Scatter(x=di2["prazo_du"]/252, y=di2["taxa"],
                    mode="lines+markers", name=dt2_sel[:10],
                    line=dict(color=CORES["secundaria"], width=2, dash="dash")), row=1, col=1)
            if not nb1.empty:
                fig_cmp.add_trace(go.Scatter(x=nb1["prazo_du"]/252, y=nb1["taxa"],
                    mode="lines+markers", name=dt1_sel[:10],
                    line=dict(color=CORES["accent"], width=2.5), showlegend=False), row=1, col=2)
            if not nb2.empty:
                fig_cmp.add_trace(go.Scatter(x=nb2["prazo_du"]/252, y=nb2["taxa"],
                    mode="lines+markers", name=dt2_sel[:10],
                    line=dict(color=CORES["accent"], width=2, dash="dash"), showlegend=False), row=1, col=2)

            fig_cmp.update_layout(height=400, template="plotly_white",
                                  font=dict(family="Segoe UI, Arial", size=12),
                                  hovermode="x unified")
            fig_cmp.update_xaxes(title_text="Prazo (anos)")
            fig_cmp.update_yaxes(title_text="Taxa (% a.a.)")
            st.plotly_chart(fig_cmp, use_container_width=True, config=PLOTLY_CFG)

            # Tabela de variacao
            if not di1.empty and not di2.empty:
                var_di = pd.merge(di1[["prazo_du","taxa"]].rename(columns={"taxa":"DI_d1"}),
                                  di2[["prazo_du","taxa"]].rename(columns={"taxa":"DI_d2"}),
                                  on="prazo_du", how="inner")
                var_di["delta_DI_bps"] = ((var_di["DI_d2"] - var_di["DI_d1"]) * 100).round(0)
                var_di["prazo_anos"] = var_di["prazo_du"] / 252

                if not nb1.empty and not nb2.empty:
                    var_nb = pd.merge(nb1[["prazo_du","taxa"]].rename(columns={"taxa":"NB_d1"}),
                                      nb2[["prazo_du","taxa"]].rename(columns={"taxa":"NB_d2"}),
                                      on="prazo_du", how="inner")
                    var_nb["delta_NB_bps"] = ((var_nb["NB_d2"] - var_nb["NB_d1"]) * 100).round(0)
                    var_di = pd.merge(var_di, var_nb[["prazo_du","delta_NB_bps"]],
                                      on="prazo_du", how="left")

                st.dataframe(var_di[["prazo_anos"] +
                             [c for c in var_di.columns if "delta" in c]].rename(columns={
                    "prazo_anos": "Prazo (anos)",
                    "delta_DI_bps": "Delta DI (bps)",
                    "delta_NB_bps": "Delta NTN-B (bps)"}),
                    use_container_width=True, hide_index=True)

                # Diagnostico comparativo
                avg_delta = var_di["delta_DI_bps"].mean()
                direcao = "para cima" if avg_delta > 0 else "para baixo"
                st.markdown(
                    f'<div class="info-box">'
                    f'Entre {dt1_str} e {dt2_str}, a curva nominal deslocou em media '
                    f'<b>{abs(avg_delta):.0f} bps {direcao}</b>.</div>',
                    unsafe_allow_html=True)
    else:
        st.info("Necessarias pelo menos 2 datas nos datasets para comparacao.")

    st.markdown("---")

    # --- Secao 5: Questoes para Reflexao ---
    st.markdown("### 💬 Questoes para Reflexao")
    questoes = [
        "Observando a curva nominal e as forwards: o mercado espera SELIC mais alta ou mais baixa em 12 meses? Em que prazo esta a maior forward?",
        "A inflacao implicita (breakeven) esta acima ou abaixo da meta nos prazos longos? Isso significa necessariamente inflacao alta, ou pode ser premio de risco?",
        "Se voce acredita que o COPOM vai cortar mais do que o mercado precifica, em qual FRA se posicionaria? Qual o risco?",
        "Comparando as duas datas: o que mudou na leitura da curva? Que evento macro poderia explicar?",
        "O cupom cambial favorece ou desfavorece captacao em dolar com conversao para reais? A resposta muda se o prazo for 3 meses vs. 2 anos?",
        "Se tivesse que montar uma carteira usando apenas as informacoes das curvas, qual seria sua alocacao entre prefixado, IPCA+, pos-fixado e dolar hedgeado?",
    ]
    for i, q in enumerate(questoes, 1):
        st.markdown(f"**{i}.** {q}")


# ============================================================================
#  MAIN
# ============================================================================
def render():
    """Entry point quando chamado pelo hub central."""
    aplicar_css()
    pagina = sidebar_navegacao()
    dispatch = {
        "home": render_home,
        "mod1": render_mod1,
        "mod2": render_mod2_ettj,
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