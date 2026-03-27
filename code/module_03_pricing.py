"""
Laboratório de Operações de Tesouraria — Módulo 3
Apreçamento das Operações de Tesouraria
MBA em Bancos e Instituições Financeiras — FGV

Arquivo único: module_03_pricing.py
Para executar: streamlit run module_03_pricing.py

Dependências: streamlit, plotly, pandas, numpy, bizdays
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from datetime import date, timedelta
from typing import Dict, List, Optional, Tuple
import math
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
        cal = Calendar(holidays=sorted(set(_FER + _MOV)),
                       weekdays=["Saturday", "Sunday"], name="ANBIMA_FB")
    BIZDAYS_OK = True
except ImportError:
    BIZDAYS_OK = False
    cal = None

# ============================================================================
#  PALETA DE CORES E CONSTANTES
# ============================================================================
CORES = {
    "primaria": "#1B3A5C",
    "secundaria": "#2E75B6",   # títulos públicos
    "accent": "#C55A11",       # crédito privado corporativo
    "fundo_claro": "#EAF3F8",
    "positivo": "#2E8B57",
    "negativo": "#CC3333",
    "neutro": "#888888",
    "bancario": "#0E7C7B",     # títulos de IFs
    "inflacao": "#8B5CF6",     # NTN-B / IPCA
    "amarelo": "#D4A012",
}

PLOTLY_LAYOUT = dict(
    template="plotly_white",
    font=dict(family="Segoe UI, Arial, sans-serif", size=13),
    margin=dict(l=60, r=30, t=50, b=50),
    hoverlabel=dict(bgcolor="white", font_size=12),
)
PLOTLY_CFG = {"displayModeBar": False}

DATA_DIR = "data/"

# Tabela regressiva de IR (estável por lei)
TABELA_IR = [
    (180, 0.225),   # até 180 DC: 22,5%
    (360, 0.200),   # 181–360 DC: 20,0%
    (720, 0.175),   # 361–720 DC: 17,5%
    (99999, 0.150), # acima 720 DC: 15,0%
]

# Cupom NTN-F: 10% a.a. => (1.10)^0.5 - 1 = 4.8809% ao semestre => R$48,81
CUPOM_NTNF_SEMESTRAL = (1.10 ** 0.5 - 1)  # 0.048809
CUPOM_NTNF_REAIS = 1000.0 * CUPOM_NTNF_SEMESTRAL  # ~48.81

# Cupom NTN-B: 6% a.a. => (1.06)^0.5 - 1 = 2.9563% ao semestre
CUPOM_NTNB_SEMESTRAL = (1.06 ** 0.5 - 1)  # 0.029563

# Cenários para comparativos
CENARIOS = {
    "Estável (SELIC mantida)": {"delta_selic": 0, "ipca": 4.5},
    "Corte moderado (-200 bps)": {"delta_selic": -200, "ipca": 4.0},
    "Corte agressivo (-400 bps)": {"delta_selic": -400, "ipca": 3.5},
    "Alta moderada (+200 bps)": {"delta_selic": 200, "ipca": 5.5},
    "Estresse crédito (spreads +100 bps)": {"delta_selic": 0, "ipca": 5.0, "delta_spread": 100},
    "Personalizado": None,
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
#  FUNÇÕES UTILITÁRIAS — BASE
# ============================================================================
def dias_uteis(d1: date, d2: date) -> int:
    if BIZDAYS_OK and cal:
        try:
            return cal.bizdays(d1, d2)
        except Exception:
            pass
    du = 0
    d = d1 + timedelta(days=1)
    while d <= d2:
        if d.weekday() < 5:
            du += 1
        d += timedelta(days=1)
    return du

def truncar6(x: float) -> float:
    """Truncamento ANBIMA: truncar na 6a casa decimal, sem notação científica."""
    return math.floor(x * 1000000) / 1000000

def aliquota_ir(dias_corridos: int) -> float:
    for limite, aliq in TABELA_IR:
        if dias_corridos <= limite:
            return aliq
    return 0.15

def gerar_datas_cupom_semestral(dt_liq: date, dt_venc: date) -> List[date]:
    """Gera datas de cupom semestrais (jan e jul) entre liquidação e vencimento."""
    datas = []
    # Meses de cupom: janeiro e julho
    y = dt_liq.year
    while y <= dt_venc.year + 1:
        for m in [1, 7]:
            dt = date(y, m, 1)
            # Ajustar para primeiro dia útil
            if BIZDAYS_OK and cal:
                try:
                    dt = cal.adjust_next(dt)
                except Exception:
                    while dt.weekday() >= 5:
                        dt += timedelta(days=1)
            else:
                while dt.weekday() >= 5:
                    dt += timedelta(days=1)
            if dt > dt_liq and dt <= dt_venc:
                datas.append(dt)
        y += 1
    # Garantir vencimento na lista
    if not datas or datas[-1] != dt_venc:
        datas.append(dt_venc)
    return sorted(set(datas))

# ============================================================================
#  FUNÇÕES DE PRECIFICAÇÃO — TÍTULOS PÚBLICOS
# ============================================================================
def precificar_ltn(taxa: float, du: int) -> dict:
    """
    LTN: PU = 1000 / (1 + taxa)^(DU/252).
    taxa: decimal (ex.: 0.125 para 12,5%).
    Retorna dict com pu, pu_sem_trunc, fator, duration, dur_mod.
    """
    fator = (1 + taxa) ** (du / 252)
    fator_trunc = truncar6(fator)
    pu = 1000.0 / fator_trunc
    pu_sem = 1000.0 / fator
    dur_anos = du / 252
    dur_mod = dur_anos / (1 + taxa)
    return {
        "pu": pu, "pu_sem_trunc": pu_sem,
        "fator": fator, "fator_trunc": fator_trunc,
        "duration": dur_anos, "dur_mod": dur_mod,
        "sensib_100bps": pu * dur_mod * 0.01,
    }

def precificar_ntnf(taxa: float, dt_liq: date, dt_venc: date) -> dict:
    """
    NTN-F: prefixado com cupons semestrais de 10% a.a.
    Retorna dict com pu, fluxos (DataFrame), duration, dur_mod, pu_limpo, accrued.
    """
    datas_cupom = gerar_datas_cupom_semestral(dt_liq, dt_venc)
    fluxos = []
    for i, dt in enumerate(datas_cupom):
        du = dias_uteis(dt_liq, dt)
        if du <= 0:
            continue
        is_ultimo = (dt == datas_cupom[-1])
        cupom = CUPOM_NTNF_REAIS
        principal = 1000.0 if is_ultimo else 0.0
        fluxo = cupom + principal
        fator = (1 + taxa) ** (du / 252)
        fator_t = truncar6(fator)
        vp = fluxo / fator_t
        fluxos.append({
            "num": i + 1, "data": dt, "du": du,
            "fluxo": fluxo, "fator": fator_t, "vp": vp,
        })
    if not fluxos:
        return {"pu": 0, "fluxos": pd.DataFrame(), "duration": 0, "dur_mod": 0,
                "pu_limpo": 0, "accrued": 0, "sensib_100bps": 0}
    df = pd.DataFrame(fluxos)
    pu = df["vp"].sum()
    # Duration Macaulay
    df["peso_dur"] = df["vp"] * df["du"] / 252
    dur_mac = df["peso_dur"].sum() / pu if pu > 0 else 0
    dur_mod = dur_mac / (1 + taxa)
    # Accrued (juros acumulados desde último cupom)
    # Simplificação: proporcional ao DU desde último cupom ou desde emissão
    du_primeiro = df.iloc[0]["du"]
    du_semestre = 126  # aprox
    du_decorrido = max(0, du_semestre - du_primeiro)
    accrued = CUPOM_NTNF_REAIS * (du_decorrido / du_semestre) if du_semestre > 0 else 0
    return {
        "pu": pu, "fluxos": df, "duration": dur_mac, "dur_mod": dur_mod,
        "pu_limpo": pu - accrued, "accrued": accrued,
        "sensib_100bps": pu * dur_mod * 0.01,
    }

def precificar_lft(vna: float, spread_bps: float, du: int) -> dict:
    """
    LFT: PU = VNA x cotação, onde cotação = 1/(1+spread)^(DU/252).
    spread_bps: em bps (ex.: 5 para 0,05%).
    """
    spread = spread_bps / 10000
    fator = (1 + spread) ** (du / 252)
    fator_t = truncar6(fator)
    cotacao = 1.0 / fator_t
    pu = vna * cotacao
    agio_desagio = pu - vna
    return {
        "pu": pu, "cotacao": cotacao * 100, "agio_desagio": agio_desagio,
        "duration_efetiva": 0.01,  # praticamente zero
        "vna": vna, "spread_bps": spread_bps,
    }

def precificar_ntnb(taxa_real: float, vna_proj: float,
                    dt_liq: date, dt_venc: date) -> dict:
    """
    NTN-B: IPCA+ com cupons semestrais de 6% a.a.
    taxa_real: decimal. vna_proj: VNA projetado em R$.
    """
    datas_cupom = gerar_datas_cupom_semestral(dt_liq, dt_venc)
    fluxos = []
    for i, dt in enumerate(datas_cupom):
        du = dias_uteis(dt_liq, dt)
        if du <= 0:
            continue
        is_ultimo = (dt == datas_cupom[-1])
        cupom_pct = CUPOM_NTNB_SEMESTRAL
        cupom_brl = vna_proj * cupom_pct
        principal = vna_proj if is_ultimo else 0.0
        fluxo = cupom_brl + principal
        fator = (1 + taxa_real) ** (du / 252)
        fator_t = truncar6(fator)
        vp = fluxo / fator_t
        fluxos.append({
            "num": i + 1, "data": dt, "du": du,
            "fluxo": fluxo, "fator": fator_t, "vp": vp,
        })
    if not fluxos:
        return {"pu": 0, "fluxos": pd.DataFrame(), "duration": 0, "dur_mod": 0,
                "sensib_100bps": 0}
    df = pd.DataFrame(fluxos)
    pu = df["vp"].sum()
    df["peso_dur"] = df["vp"] * df["du"] / 252
    dur_mac = df["peso_dur"].sum() / pu if pu > 0 else 0
    dur_mod = dur_mac / (1 + taxa_real)
    return {
        "pu": pu, "fluxos": df, "duration": dur_mac, "dur_mod": dur_mod,
        "sensib_100bps": pu * dur_mod * 0.01,
    }

# ============================================================================
#  FUNÇÕES DE PRECIFICAÇÃO — TÍTULOS PRIVADOS
# ============================================================================
def precificar_cdb_pos(face: float, pct_cdi_emissao: float,
                       pct_cdi_mercado: float, du_total: int,
                       du_decorridos: int) -> dict:
    """
    CDB pós-fixado (% CDI). Simplificação didática.
    Retorna PU na curva e PU MtM.
    """
    du_restantes = du_total - du_decorridos
    if du_restantes <= 0:
        return {"pu_curva": face, "pu_mtm": face, "diferenca": 0, "spread_pp": 0}
    # CDI anualizado proxy (simplificação para cálculos didáticos)
    cdi_proxy = 0.1365  # ~SELIC vigente, ajustar via dados
    # Valor na curva
    fator_passado = (1 + cdi_proxy * pct_cdi_emissao / 100) ** (du_decorridos / 252)
    val_curva = face * fator_passado
    # Valor futuro esperado
    fator_futuro_emissao = (1 + cdi_proxy * pct_cdi_emissao / 100) ** (du_restantes / 252)
    vf_esperado = val_curva * fator_futuro_emissao
    # Desconto a mercado
    fator_futuro_mercado = (1 + cdi_proxy * pct_cdi_mercado / 100) ** (du_restantes / 252)
    pu_mtm = vf_esperado / fator_futuro_mercado if fator_futuro_mercado > 0 else face
    return {
        "pu_curva": val_curva, "pu_mtm": pu_mtm,
        "diferenca": pu_mtm - val_curva,
        "spread_pp": pct_cdi_mercado - pct_cdi_emissao,
    }

def precificar_cdb_pre(face: float, taxa_soberana: float,
                       spread_bps: float, du: int) -> dict:
    """CDB prefixado = LTN + spread."""
    spread = spread_bps / 10000
    taxa_cdb = taxa_soberana + spread
    fator = (1 + taxa_cdb) ** (du / 252)
    pu_cdb = face / fator
    pu_ltn = face / ((1 + taxa_soberana) ** (du / 252))
    return {
        "taxa_cdb": taxa_cdb * 100, "pu_cdb": pu_cdb, "pu_ltn": pu_ltn,
        "diferenca_pu": pu_ltn - pu_cdb, "du": du,
    }

def equivalencia_fiscal(taxa_isenta: float, dias_corridos: int,
                        tipo_investidor: str = "PF") -> dict:
    """Calcula taxa bruta equivalente de LCI/LCA."""
    aliq = aliquota_ir(dias_corridos)
    if tipo_investidor == "PF":
        taxa_bruta = taxa_isenta / (1 - aliq)
    else:
        taxa_bruta = taxa_isenta  # PJ não tem isenção
    return {
        "aliquota": aliq * 100,
        "taxa_bruta_equiv": taxa_bruta,
        "taxa_isenta": taxa_isenta,
        "vantagem_bps": (taxa_bruta - taxa_isenta) * 100 if tipo_investidor == "PF" else 0,
    }

def precificar_debenture_cdi(face: float, spread_emissao: float,
                             spread_mercado: float, prazo_anos: float,
                             periodicidade: str = "Semestral") -> dict:
    """
    Debênture CDI + spread. Simplificação: fluxos de cupom = spread sobre face.
    spread_emissao, spread_mercado: decimal (ex.: 0.018 para 1,80%).
    """
    n_cupons = int(prazo_anos * (2 if periodicidade == "Semestral" else 1))
    du_total = int(prazo_anos * 252)
    if n_cupons <= 0:
        return {"pu": face, "pu_pct_par": 100, "duration": 0, "fluxos": pd.DataFrame()}
    du_step = du_total // n_cupons
    fluxos = []
    pu_total = 0
    soma_peso = 0
    for i in range(1, n_cupons + 1):
        du_i = du_step * i
        is_ultimo = (i == n_cupons)
        # Cupom = spread de emissão sobre face (proporcional ao período)
        cupom = face * spread_emissao * (du_step / 252)
        principal = face if is_ultimo else 0.0
        fluxo = cupom + principal
        # Desconto pelo spread de mercado
        fator = (1 + spread_mercado) ** (du_i / 252)
        vp = fluxo / fator
        pu_total += vp
        soma_peso += vp * du_i / 252
        fluxos.append({"num": i, "du": du_i, "fluxo": fluxo, "fator": fator, "vp": vp})
    dur = soma_peso / pu_total if pu_total > 0 else 0
    df = pd.DataFrame(fluxos)
    return {
        "pu": pu_total, "pu_pct_par": pu_total / face * 100,
        "spread_diff_bps": (spread_mercado - spread_emissao) * 10000,
        "duration": dur, "fluxos": df,
    }

def precificar_debenture_ipca(taxa_real: float, vna_proj: float,
                              prazo_anos: float,
                              periodicidade: str = "Semestral") -> dict:
    """Debênture IPCA+ spread. Análoga à NTN-B."""
    n_cupons = int(prazo_anos * (2 if periodicidade == "Semestral" else 1))
    du_total = int(prazo_anos * 252)
    if n_cupons <= 0:
        return {"pu": vna_proj, "duration": 0, "fluxos": pd.DataFrame()}
    du_step = du_total // n_cupons
    cupom_sem = CUPOM_NTNB_SEMESTRAL if periodicidade == "Semestral" else ((1.06) - 1)
    fluxos = []
    pu_total = 0
    soma_peso = 0
    for i in range(1, n_cupons + 1):
        du_i = du_step * i
        is_ultimo = (i == n_cupons)
        cupom_brl = vna_proj * cupom_sem
        principal = vna_proj if is_ultimo else 0.0
        fluxo = cupom_brl + principal
        fator = (1 + taxa_real) ** (du_i / 252)
        vp = fluxo / fator
        pu_total += vp
        soma_peso += vp * du_i / 252
        fluxos.append({"num": i, "du": du_i, "fluxo": fluxo, "fator": fator, "vp": vp})
    dur = soma_peso / pu_total if pu_total > 0 else 0
    return {"pu": pu_total, "duration": dur, "fluxos": pd.DataFrame(fluxos)}

def precificar_lf(spread_bps: float, prazo_anos: float, volume: float,
                  tipo: str = "Senior", periodicidade: str = "Bullet") -> dict:
    """Letra Financeira. CDI + spread, com ou sem cupom."""
    spread = spread_bps / 10000
    du = int(prazo_anos * 252)
    if periodicidade == "Bullet":
        fator = (1 + spread) ** (du / 252)
        pu = volume / fator
        dur = du / 252
    else:
        r = precificar_debenture_cdi(volume, spread, spread, prazo_anos, periodicidade)
        pu = r["pu"]
        dur = r["duration"]
    return {"pu": pu, "duration": dur, "taxa_efetiva": spread * 100, "tipo": tipo}

def precificar_credito_generico(indexador: str, spread_taxa: float,
                                prazo_anos: float, volume: float,
                                estrutura: str = "Bullet") -> dict:
    """Precificador genérico para CRI, CRA, NP."""
    du = int(prazo_anos * 252)
    if indexador == "Prefixado":
        fator = (1 + spread_taxa / 100) ** (du / 252)
        pu = volume / fator
        dur = du / 252
    elif estrutura == "Bullet":
        fator = (1 + spread_taxa / 100) ** (du / 252)
        pu = volume / fator
        dur = du / 252
    else:
        r = precificar_debenture_cdi(volume, spread_taxa / 100, spread_taxa / 100,
                                     prazo_anos,
                                     "Semestral" if "semestral" in estrutura.lower() else "Anual")
        pu = r["pu"]
        dur = r["duration"]
    return {"pu": pu, "duration": dur, "taxa": spread_taxa}

# ============================================================================
#  FORMATAÇÃO
# ============================================================================
def fmt_brl(v):
    if abs(v) >= 1e9:
        s = f"R$ {v/1e9:,.2f} bi"
    elif abs(v) >= 1e6:
        s = f"R$ {v/1e6:,.2f} mi"
    else:
        s = f"R$ {v:,.2f}"
    return s.replace(",", "X").replace(".", ",").replace("X", ".")

def fmt_pct(v, c=2):
    return f"{v:,.{c}f}%".replace(",", "X").replace(".", ",").replace("X", ".")

def fmt_num(v, c=2):
    return f"{v:,.{c}f}".replace(",", "X").replace(".", ",").replace("X", ".")

def fmt_f6(v):
    """Formatar com 6 casas decimais sem notação científica."""
    return f"{v:.6f}"

# ============================================================================
#  CARGA DE DADOS — PONTOS DE INSERÇÃO
# ============================================================================
@st.cache_data(ttl=86400)
def carregar_titulos_publicos():
    """CSV: data/titulos_publicos.csv
    Colunas: data, titulo (LTN/NTN-F/LFT/NTN-B), vencimento, taxa, pu, du
    Fonte: Tesouro Direto / ANBIMA."""
    try:
        return pd.read_csv(f"{DATA_DIR}titulos_publicos.csv",
                           parse_dates=["data"]).sort_values(["data", "titulo"]).reset_index(drop=True)
    except FileNotFoundError:
        return pd.DataFrame(columns=["data", "titulo", "vencimento", "taxa", "pu", "du"])

@st.cache_data(ttl=86400)
def carregar_cdb_mercado():
    """CSV: data/cdb_mercado.csv
    Colunas: emissor, tipo (pos/pre), taxa_ou_pct_cdi, prazo_du, rating, data
    Fonte: Dados indicativos de mercado."""
    try:
        return pd.read_csv(f"{DATA_DIR}cdb_mercado.csv",
                           parse_dates=["data"]).sort_values("data").reset_index(drop=True)
    except FileNotFoundError:
        return pd.DataFrame(columns=["emissor", "tipo", "taxa_ou_pct_cdi", "prazo_du", "rating", "data"])

@st.cache_data(ttl=86400)
def carregar_debentures_mercado():
    """CSV: data/debentures_mercado.csv
    Colunas: emissor, indexador (CDI/IPCA), spread, prazo_anos, rating, data
    Fonte: ANBIMA IDA / mercado secundário."""
    try:
        return pd.read_csv(f"{DATA_DIR}debentures_mercado.csv",
                           parse_dates=["data"]).sort_values("data").reset_index(drop=True)
    except FileNotFoundError:
        return pd.DataFrame(columns=["emissor", "indexador", "spread", "prazo_anos", "rating", "data"])

@st.cache_data(ttl=86400)
def carregar_vna_ntnb():
    """CSV: data/vna_ntnb.csv | Colunas: data, vna
    Fonte: Tesouro Nacional / ANBIMA."""
    try:
        return pd.read_csv(f"{DATA_DIR}vna_ntnb.csv",
                           parse_dates=["data"]).sort_values("data").reset_index(drop=True)
    except FileNotFoundError:
        return pd.DataFrame(columns=["data", "vna"])

@st.cache_data(ttl=86400)
def carregar_vna_lft():
    """CSV: data/vna_lft.csv | Colunas: data, vna
    Fonte: Tesouro Nacional / ANBIMA."""
    try:
        return pd.read_csv(f"{DATA_DIR}vna_lft.csv",
                           parse_dates=["data"]).sort_values("data").reset_index(drop=True)
    except FileNotFoundError:
        return pd.DataFrame(columns=["data", "vna"])

@st.cache_data(ttl=86400)
def carregar_curvas_di():
    """CSV: data/curvas_di.csv | Colunas: data, prazo_du, taxa (% a.a.)
    Pode ser importado do Módulo 2."""
    try:
        return pd.read_csv(f"{DATA_DIR}curvas_di.csv",
                           parse_dates=["data"]).sort_values(["data", "prazo_du"]).reset_index(drop=True)
    except FileNotFoundError:
        return pd.DataFrame(columns=["data", "prazo_du", "taxa"])

def obter_valor_na_data(df, data_str, col="vna"):
    if df.empty:
        return None
    dt = pd.Timestamp(data_str)
    mask = df["data"] <= dt
    sub = df[mask]
    if sub.empty:
        return None
    return sub.iloc[-1][col]


# ============================================================================
#  NAVEGAÇÃO E HOME
# ============================================================================
def configurar_pagina():
    st.set_page_config(page_title="Laboratório de Tesouraria — Módulo 3",
                       page_icon="⚖️", layout="wide", initial_sidebar_state="expanded")
    aplicar_css()

def sidebar_navegacao() -> str:
    with st.sidebar:
        st.markdown("### 🏛️ Laboratório de Tesouraria")
        st.markdown("**Módulo 3** — Apreçamento das Operações")
        st.markdown("---")
        paginas = {
            "🏛️ Visão Geral do Módulo 3": "home",
            "🇧🇷 Títulos Públicos Federais": "mod1",
            "🏦 Títulos Privados de IFs": "mod2",
            "🏢 Títulos Privados de Empresas": "mod3",
            "⚖️ Exercício Integrador": "integrador",
        }
        escolha = st.radio("Navegação", list(paginas.keys()), label_visibility="collapsed")
        st.markdown("---")
        st.caption("MBA em Bancos e Instituições Financeiras — FGV")
    return paginas[escolha]

def render_home():
    st.markdown("# Laboratório de Operações de Tesouraria")
    st.markdown("### Módulo 3 — Apreçamento das Operações de Tesouraria")
    st.markdown(
        '<div class="info-box">'
        "Neste módulo, você vai precificar os instrumentos que uma tesouraria bancária "
        "negocia no dia a dia: títulos públicos federais, títulos de instituições financeiras "
        "e crédito privado corporativo. Mais do que calcular PUs, o objetivo é desenvolver "
        "o raciocínio de valor relativo — comparar instrumentos e decidir onde está a melhor "
        "relação risco-retorno."
        '</div>', unsafe_allow_html=True)
    st.markdown("---")
    st.markdown("### Mapa do Módulo")
    modulos = [
        ("🇧🇷", "Títulos Públicos", "LTN, NTN-F, LFT, NTN-B — qual oferece melhor risco-retorno?"),
        ("🏦", "Títulos de IFs", "CDB, LCI/LCA, LF — o spread compensa o risco?"),
        ("🏢", "Crédito Privado", "Debêntures, CRI/CRA — quanto vale o spread de crédito?"),
        ("⚖️", "Relative Value", "Comparar tudo e montar a carteira ideal."),
    ]
    cols = st.columns(4)
    for i, (ic, tit, perg) in enumerate(modulos):
        with cols[i]:
            st.markdown(
                f'<div class="modulo-card"><h4>{ic} {tit}</h4>'
                f'<p><i>"{perg}"</i></p></div>', unsafe_allow_html=True)
    st.markdown("---")
    st.markdown(
        '<div class="info-box">'
        '<b>🔗 Este módulo usa:</b> Curva de juros nominal (Módulo 2) para desconto de '
        'prefixados. Curva real (Módulo 2) para indexados. Conceitos de spread e risco (Módulo 1).'
        '</div>', unsafe_allow_html=True)

# ============================================================================
#  MÓDULO 1 — TÍTULOS PÚBLICOS FEDERAIS
# ============================================================================
def render_mod1():
    st.markdown("## 🇧🇷 Títulos Públicos Federais")
    st.markdown('<div class="info-box"><b>Pergunta gerencial:</b> "Qual título público oferece '
                'a melhor relação risco-retorno dado o cenário atual?"</div>',
                unsafe_allow_html=True)
    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "LTN", "NTN-F", "LFT", "NTN-B", "📊 Comparativo"])
    with tab1: render_ltn()
    with tab2: render_ntnf()
    with tab3: render_lft()
    with tab4: render_ntnb()
    with tab5: render_comparativo_publicos()

# --- LTN ---
def render_ltn():
    with st.expander("📘 Conceito e Fórmula ANBIMA"):
        st.markdown("**LTN:** título prefixado zero cupom, face R$ 1.000,00.")
        st.latex(r"PU = \frac{1.000}{(1 + taxa)^{DU/252}}")
        st.markdown("Convenção: DU/252, capitalização composta. "
                    "Truncamento ANBIMA: fator de desconto truncado na 6a casa decimal.")
    st.markdown("---")
    st.markdown("### Precificador de LTN")
    c1, c2 = st.columns(2)
    with c1:
        taxa_ltn = st.number_input("Taxa de mercado (% a.a.)", value=12.50,
                                   step=0.05, format="%.2f", key="ltn_tx")
    with c2:
        du_ltn = st.number_input("Dias úteis até vencimento", value=252,
                                 step=1, min_value=1, key="ltn_du")
    r = precificar_ltn(taxa_ltn / 100, du_ltn)
    c1, c2, c3, c4 = st.columns(4)
    with c1: st.metric("PU", f"R$ {r['pu']:,.2f}".replace(",","X").replace(".",",").replace("X","."))
    with c2: st.metric("Duration", f"{r['duration']:.2f} anos")
    with c3: st.metric("Duration modificada", f"{r['dur_mod']:.4f}")
    with c4: st.metric("Sensib. +100 bps", f"R$ {r['sensib_100bps']:,.2f}".replace(",","X").replace(".",",").replace("X","."))

    with st.expander("📐 Cálculo passo a passo"):
        st.markdown(f"**1.** Fator de desconto: (1 + {taxa_ltn/100:.4f})^({du_ltn}/252) = {r['fator']:.8f}")
        st.markdown(f"**2.** Truncamento 6 casas: {fmt_f6(r['fator_trunc'])}")
        st.markdown(f"**3.** PU = 1.000 / {fmt_f6(r['fator_trunc'])} = **R$ {r['pu']:.2f}**")
        st.markdown(f"**4.** PU sem truncamento = R$ {r['pu_sem_trunc']:.2f} "
                    f"(diferença: R$ {abs(r['pu'] - r['pu_sem_trunc']):.4f})")

    # Gráfico Taxa vs PU
    st.markdown("#### Sensibilidade: PU vs. Taxa")
    taxas = np.linspace(0.05, 0.25, 100)
    pus = [precificar_ltn(t, du_ltn)["pu"] for t in taxas]
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=taxas * 100, y=pus, mode="lines",
                             line=dict(color=CORES["secundaria"], width=2.5),
                             name=f"DU={du_ltn}",
                             hovertemplate="Taxa: %{x:.2f}%<br>PU: R$ %{y:.2f}<extra></extra>"))
    fig.add_trace(go.Scatter(x=[taxa_ltn], y=[r["pu"]], mode="markers",
                             marker=dict(color=CORES["negativo"], size=12, symbol="diamond"),
                             name="Ponto atual"))
    # Segunda série com DU/2
    du2 = du_ltn // 2
    if du2 > 0:
        pus2 = [precificar_ltn(t, du2)["pu"] for t in taxas]
        fig.add_trace(go.Scatter(x=taxas * 100, y=pus2, mode="lines",
                                 line=dict(color=CORES["neutro"], width=1.5, dash="dash"),
                                 name=f"DU={du2}"))
    fig.update_layout(**PLOTLY_LAYOUT, title="PU vs. Taxa (convexidade)",
                      xaxis_title="Taxa (% a.a.)", yaxis_title="PU (R$)")
    st.plotly_chart(fig, use_container_width=True, config=PLOTLY_CFG)

# --- NTN-F ---
def render_ntnf():
    with st.expander("📘 Conceito e Fórmula ANBIMA"):
        st.markdown("**NTN-F:** prefixado com cupons semestrais de 10% a.a. "
                    "(4,8809% ao semestre = R$ 48,81 por cupom).")
        st.latex(r"PU = \sum_{k=1}^{n} \frac{cupom_k}{(1+taxa)^{DU_k/252}} + \frac{1.000}{(1+taxa)^{DU_n/252}}")
        st.markdown("Datas de cupom: 1o DU de janeiro e julho. Truncamento 6 casas em cada fator.")
    st.markdown("---")
    st.markdown("### Precificador de NTN-F")
    c1, c2, c3 = st.columns(3)
    with c1:
        taxa_nf = st.number_input("Taxa de mercado (% a.a.)", value=12.80,
                                  step=0.05, format="%.2f", key="nf_tx")
    with c2:
        dt_liq = st.date_input("Data de liquidação", value=date.today(), key="nf_liq")
    with c3:
        anos_venc = st.selectbox("Prazo até vencimento",
                                 ["1 ano","2 anos","3 anos","5 anos","7 anos","10 anos"],
                                 index=1, key="nf_venc")
        anos = int(anos_venc.split()[0])
        dt_venc = date(dt_liq.year + anos, 1, 1)

    r = precificar_ntnf(taxa_nf / 100, dt_liq, dt_venc)
    if r["pu"] == 0:
        st.warning("Prazo insuficiente para gerar fluxos.")
        return

    c1, c2, c3, c4, c5 = st.columns(5)
    with c1: st.metric("PU", f"R$ {r['pu']:,.2f}".replace(",","X").replace(".",",").replace("X","."))
    with c2: st.metric("Duration Macaulay", f"{r['duration']:.2f} anos")
    with c3: st.metric("Duration mod.", f"{r['dur_mod']:.4f}")
    with c4: st.metric("Accrued", f"R$ {r['accrued']:.2f}")
    with c5: st.metric("PU limpo", f"R$ {r['pu_limpo']:,.2f}".replace(",","X").replace(".",",").replace("X","."))

    with st.expander("📐 Tabela de fluxos detalhada"):
        df_show = r["fluxos"][["num","data","du","fluxo","fator","vp"]].copy()
        df_show.columns = ["#","Data","DU","Fluxo (R$)","Fator desc.","VP (R$)"]
        df_show["Fator desc."] = df_show["Fator desc."].apply(fmt_f6)
        st.dataframe(df_show, use_container_width=True, hide_index=True)
        st.markdown(f"**Total (PU):** R$ {r['pu']:,.2f} | **Duration Macaulay:** {r['duration']:.2f} anos")

    # Gráfico de fluxo de caixa
    st.markdown("#### Fluxo de Caixa")
    df_fl = r["fluxos"]
    fig_fc = go.Figure()
    cores_bar = [CORES["secundaria"] if f < 200 else CORES["primaria"] for f in df_fl["fluxo"]]
    fig_fc.add_trace(go.Bar(x=df_fl["data"].astype(str), y=df_fl["fluxo"],
                            name="Fluxo nominal", marker_color=cores_bar, opacity=0.7))
    fig_fc.add_trace(go.Scatter(x=df_fl["data"].astype(str), y=df_fl["vp"],
                                mode="markers+lines", name="VP descontado",
                                line=dict(color=CORES["negativo"], width=1.5, dash="dot"),
                                marker=dict(size=6)))
    fig_fc.update_layout(**PLOTLY_LAYOUT, title="Fluxos Nominais vs. Valor Presente",
                         xaxis_title="Data", yaxis_title="R$", barmode="overlay")
    st.plotly_chart(fig_fc, use_container_width=True, config=PLOTLY_CFG)

    # Comparação com LTN
    st.markdown("#### 🔄 Comparação com LTN de mesmo vencimento")
    du_total = r["fluxos"]["du"].max()
    r_ltn = precificar_ltn(taxa_nf / 100, du_total)
    c1, c2, c3 = st.columns(3)
    with c1:
        st.metric("PU LTN", f"R$ {r_ltn['pu']:,.2f}".replace(",","X").replace(".",",").replace("X","."))
        st.metric("PU NTN-F", f"R$ {r['pu']:,.2f}".replace(",","X").replace(".",",").replace("X","."))
    with c2:
        st.metric("Duration LTN", f"{r_ltn['duration']:.2f} anos")
        st.metric("Duration NTN-F", f"{r['duration']:.2f} anos")
    with c3:
        st.metric("Sensib. LTN +100bps", f"R$ {r_ltn['sensib_100bps']:.2f}")
        st.metric("Sensib. NTN-F +100bps", f"R$ {r['sensib_100bps']:.2f}")
    st.markdown(
        '<div class="info-box">A NTN-F tem duration menor que a LTN porque os cupons '
        'antecipam fluxos. Para uma mesma variação de taxa, a NTN-F perde/ganha menos.</div>',
        unsafe_allow_html=True)

# --- LFT ---
def render_lft():
    with st.expander("📘 Conceito — LFT"):
        st.markdown("""
**LFT:** título pós-fixado indexado à SELIC over. O VNA (Valor Nominal Atualizado)
é R$ 1.000 da data-base corrigido diariamente pela SELIC over acumulada.

Cotação de mercado: **PU = VNA x cotação**, onde cotação = 1 / (1 + spread)^(DU/252).
O spread é tipicamente poucos bps. Duration efetiva próxima de zero.
""")
    st.markdown("---")
    st.markdown("### Precificador de LFT")
    c1, c2, c3 = st.columns(3)
    with c1:
        vna = st.number_input("VNA atual (R$)", value=15234.56, step=0.01,
                              format="%.2f", key="lft_vna",
                              help="Valor nominal atualizado (Tesouro/ANBIMA)")
    with c2:
        spread_lft = st.number_input("Spread (bps)", value=0, step=1,
                                     min_value=-50, max_value=50, key="lft_sp",
                                     help="Positivo = deságio. Negativo = ágio.")
    with c3:
        du_lft = st.number_input("DU até vencimento", value=504, step=1, key="lft_du")
    r = precificar_lft(vna, spread_lft, du_lft)

    c1, c2, c3, c4 = st.columns(4)
    with c1: st.metric("PU", fmt_brl(r["pu"]))
    with c2: st.metric("Cotação", fmt_pct(r["cotacao"], 4))
    with c3: st.metric("Ágio/Deságio vs VNA", fmt_brl(r["agio_desagio"]))
    with c4: st.metric("Duration efetiva", "~0 anos")

    # Gráfico: sensibilidade ao spread (LFT vs LTN)
    st.markdown("#### Sensibilidade: LFT vs. LTN")
    spreads = np.arange(-30, 31, 1)
    pus_lft = [precificar_lft(vna, s, du_lft)["pu"] for s in spreads]
    # LTN comparável: usar taxa = 13% + spread
    taxa_base = 0.13
    pus_ltn = [precificar_ltn(taxa_base + s / 10000, du_lft)["pu"] for s in spreads]

    fig = make_subplots(specs=[[{"secondary_y": True}]])
    fig.add_trace(go.Scatter(x=spreads, y=pus_lft, mode="lines",
                             name="LFT", line=dict(color=CORES["secundaria"], width=2.5),
                             hovertemplate="Spread: %{x} bps<br>PU: R$ %{y:,.2f}<extra></extra>"),
                  secondary_y=False)
    fig.add_trace(go.Scatter(x=spreads, y=pus_ltn, mode="lines",
                             name="LTN (mesma DU)", line=dict(color=CORES["neutro"], width=2, dash="dash"),
                             hovertemplate="Δ taxa: %{x} bps<br>PU: R$ %{y:,.2f}<extra></extra>"),
                  secondary_y=True)
    fig.update_layout(**PLOTLY_LAYOUT, title="Sensibilidade: LFT (quase flat) vs. LTN",
                      hovermode="x unified")
    fig.update_xaxes(title_text="Variação (bps)")
    fig.update_yaxes(title_text="PU LFT (R$)", secondary_y=False)
    fig.update_yaxes(title_text="PU LTN (R$)", secondary_y=True)
    st.plotly_chart(fig, use_container_width=True, config=PLOTLY_CFG)
    st.markdown(
        '<div class="info-box">A LFT é o "caixa remunerado" da tesouraria. Risco de '
        'mercado mínimo — o VNA se ajusta diariamente à SELIC. O único risco é o '
        'spread, que raramente ultrapassa 10-20 bps. Por isso é o lastro preferencial '
        'para operações compromissadas.</div>', unsafe_allow_html=True)

# --- NTN-B ---
def render_ntnb():
    with st.expander("📘 Conceito — NTN-B"):
        st.markdown("""
**NTN-B:** indexado ao IPCA + taxa real fixa. Cupons semestrais de 6% a.a.
(2,9563% ao semestre) sobre o VNA projetado.
""")
        st.latex(r"PU = VNA_{proj} \times \sum_{k=1}^{n} \frac{cupom_k}{(1+taxa_{real})^{DU_k/252}} + \frac{VNA_{proj}}{(1+taxa_{real})^{DU_n/252}}")
        st.markdown("**Paradoxo:** se o juro real sobe, o PU CAI mesmo com inflação subindo. "
                    "Protege no carry, mas está exposto a MtM pela taxa real.")
    st.markdown("---")
    st.markdown("### Precificador de NTN-B")
    c1, c2 = st.columns(2)
    with c1:
        taxa_nb = st.number_input("Taxa real IPCA+ (% a.a.)", value=6.20,
                                  step=0.05, format="%.2f", key="nb_tx")
        vna_nb = st.number_input("VNA projetado (R$)", value=4352.78,
                                 step=0.01, format="%.2f", key="nb_vna")
    with c2:
        dt_liq_nb = st.date_input("Data de liquidação", value=date.today(), key="nb_liq")
        anos_nb = st.selectbox("Prazo", ["2 anos","3 anos","5 anos","7 anos","10 anos","15 anos"],
                               index=2, key="nb_venc")
        anos_n = int(anos_nb.split()[0])
        dt_venc_nb = date(dt_liq_nb.year + anos_n, 8, 15)

    r = precificar_ntnb(taxa_nb / 100, vna_nb, dt_liq_nb, dt_venc_nb)
    if r["pu"] == 0:
        st.warning("Prazo insuficiente.")
        return
    carry_mensal = vna_nb * (CUPOM_NTNB_SEMESTRAL / 6) + vna_nb * (taxa_nb / 100 / 12)

    c1, c2, c3, c4, c5 = st.columns(5)
    with c1: st.metric("PU", fmt_brl(r["pu"]))
    with c2: st.metric("Duration Macaulay", f"{r['duration']:.2f} anos")
    with c3: st.metric("Duration mod.", f"{r['dur_mod']:.4f}")
    with c4: st.metric("Sensib. +100 bps", fmt_brl(r["sensib_100bps"]))
    with c5: st.metric("Carry mensal est.", fmt_brl(carry_mensal))

    with st.expander("📐 Tabela de fluxos"):
        df_show = r["fluxos"][["num","data","du","fluxo","fator","vp"]].copy()
        df_show.columns = ["#","Data","DU","Fluxo (R$)","Fator desc.","VP (R$)"]
        df_show["Fator desc."] = df_show["Fator desc."].apply(fmt_f6)
        st.dataframe(df_show, use_container_width=True, hide_index=True)

    # Gráfico de fluxo de caixa
    df_fl = r["fluxos"]
    fig_fc = go.Figure()
    cores_bar = [CORES["inflacao"] if f < vna_nb else "#5B21B6" for f in df_fl["fluxo"]]
    fig_fc.add_trace(go.Bar(x=df_fl["data"].astype(str), y=df_fl["fluxo"],
                            name="Fluxo nominal", marker_color=cores_bar, opacity=0.7))
    fig_fc.add_trace(go.Scatter(x=df_fl["data"].astype(str), y=df_fl["vp"],
                                mode="markers+lines", name="VP descontado",
                                line=dict(color=CORES["negativo"], width=1.5, dash="dot"),
                                marker=dict(size=6)))
    fig_fc.update_layout(**PLOTLY_LAYOUT, title="Fluxos NTN-B", xaxis_title="Data", yaxis_title="R$")
    st.plotly_chart(fig_fc, use_container_width=True, config=PLOTLY_CFG)

    # Paradoxo da NTN-B
    st.markdown("#### ⚠️ O Paradoxo da NTN-B")
    c1, c2 = st.columns(2)
    with c1:
        delta_real = st.slider("Variação da taxa real (bps)", -200, 200, 0, 10, key="nb_delta")
    with c2:
        ipca_sim = st.slider("IPCA realizado (% a.a.)", 2.0, 10.0, 4.5, 0.5, key="nb_ipca")

    pu_novo = precificar_ntnb((taxa_nb + delta_real / 100) / 100, vna_nb,
                              dt_liq_nb, dt_venc_nb)["pu"]
    mtm = pu_novo - r["pu"]
    carry_12m = r["pu"] * (ipca_sim / 100 + taxa_nb / 100)
    total = mtm + carry_12m

    c1, c2, c3 = st.columns(3)
    with c1: st.metric("MtM (variação PU)", fmt_brl(mtm),
                        delta=f"{mtm/r['pu']*100:+.2f}%")
    with c2: st.metric("Carry 12M estimado", fmt_brl(carry_12m))
    with c3: st.metric("Resultado total", fmt_brl(total),
                        delta=f"{total/r['pu']*100:+.2f}%")
    if mtm < 0 and carry_12m > 0:
        st.warning("Mesmo com IPCA positivo, a alta da taxa real gera perda de MtM. "
                   "O resultado total depende de qual efeito predomina.")

# --- Comparativo ---
def render_comparativo_publicos():
    st.markdown("### 📊 Painel Comparativo de Títulos Públicos")
    modo = st.radio("Fonte", ["Inserir manualmente","Dados pré-carregados"],
                    horizontal=True, key="comp_modo")

    if modo == "Inserir manualmente":
        c1, c2, c3 = st.columns(3)
        with c1:
            tx_ltn = st.number_input("Taxa LTN 1A (%)", value=12.50, step=0.05, key="cp_ltn")
            tx_nf = st.number_input("Taxa NTN-F 2A (%)", value=12.80, step=0.05, key="cp_nf")
        with c2:
            sp_lft = st.number_input("Spread LFT (bps)", value=2, step=1, key="cp_lft")
            tx_nb = st.number_input("Taxa NTN-B 3A IPCA+ (%)", value=6.20, step=0.05, key="cp_nb")
        with c3:
            selic_at = st.number_input("SELIC Meta (%)", value=13.75, step=0.25, key="cp_sl")
            ipca_exp = st.number_input("IPCA esperado 12M (%)", value=4.50, step=0.25, key="cp_ip")
    else:
        st.info("📂 Carregue `titulos_publicos.csv` e `vna_lft.csv` em `data/`.")
        tx_ltn, tx_nf, sp_lft, tx_nb = 12.50, 12.80, 2, 6.20
        selic_at, ipca_exp = 13.75, 4.50

    vna_lft_v = 15234.56
    vna_nb_v = 4352.78

    # Cenário
    st.markdown("---")
    cenario_sel = st.selectbox("Cenário de taxa (12 meses)", list(CENARIOS.keys()), key="cp_cen")
    if cenario_sel == "Personalizado":
        c1, c2 = st.columns(2)
        with c1: delta_s = st.slider("Variação SELIC (bps)", -500, 500, 0, 25, key="cp_ds")
        with c2: ipca_r = st.slider("IPCA realizado (%)", 2.0, 12.0, 4.5, 0.5, key="cp_ir")
    else:
        cen = CENARIOS[cenario_sel]
        delta_s = cen["delta_selic"]
        ipca_r = cen["ipca"]

    # Calcular todos
    dt_h = date.today()
    r_ltn = precificar_ltn(tx_ltn / 100, 252)
    r_nf = precificar_ntnf(tx_nf / 100, dt_h, date(dt_h.year + 2, 1, 1))
    r_lft = precificar_lft(vna_lft_v, sp_lft, 504)
    r_nb = precificar_ntnb(tx_nb / 100, vna_nb_v, dt_h, date(dt_h.year + 3, 8, 15))

    # Retornos no cenário
    def ret_pre(pu, dur_mod, delta_bps):
        carry = pu * (tx_ltn / 100) * (1)  # 12 meses simplificado
        mtm = -pu * dur_mod * (delta_bps / 10000)
        return carry + mtm

    carry_ltn = 1000 - r_ltn["pu"]  # ganho de convergência ao par
    mtm_ltn = -r_ltn["pu"] * r_ltn["dur_mod"] * (delta_s / 10000)
    ret_ltn = carry_ltn + mtm_ltn

    carry_nf = CUPOM_NTNF_REAIS * 2 + (1000 - r_nf["pu"]) / 2  # simplif.
    mtm_nf = -r_nf["pu"] * r_nf["dur_mod"] * (delta_s / 10000)
    ret_nf = carry_nf + mtm_nf

    carry_lft = r_lft["pu"] * selic_at / 100
    ret_lft = carry_lft  # MtM desprezível

    carry_nb = r_nb["pu"] * (ipca_r / 100 + tx_nb / 100)
    mtm_nb = -r_nb["pu"] * r_nb["dur_mod"] * (delta_s * 0.3 / 10000)  # proxy: real move ~30% do nominal
    ret_nb = carry_nb + mtm_nb

    titulos = [
        {"Título": "LTN 1A", "Indexador": "Pré", "Taxa": f"{tx_ltn:.2f}%",
         "PU": r_ltn["pu"], "Duration": r_ltn["duration"],
         "Carry 12M": carry_ltn, "MtM": mtm_ltn, "Retorno": ret_ltn},
        {"Título": "NTN-F 2A", "Indexador": "Pré+Cup", "Taxa": f"{tx_nf:.2f}%",
         "PU": r_nf["pu"], "Duration": r_nf["duration"],
         "Carry 12M": carry_nf, "MtM": mtm_nf, "Retorno": ret_nf},
        {"Título": "LFT", "Indexador": "SELIC", "Taxa": f"+{sp_lft} bps",
         "PU": r_lft["pu"], "Duration": 0.01,
         "Carry 12M": carry_lft, "MtM": 0, "Retorno": ret_lft},
        {"Título": "NTN-B 3A", "Indexador": "IPCA+", "Taxa": f"{tx_nb:.2f}%",
         "PU": r_nb["pu"], "Duration": r_nb["duration"],
         "Carry 12M": carry_nb, "MtM": mtm_nb, "Retorno": ret_nb},
    ]
    df_comp = pd.DataFrame(titulos)
    df_comp["Ret. Total (%)"] = df_comp["Retorno"] / df_comp["PU"] * 100

    st.dataframe(df_comp[["Título","Indexador","Taxa","PU","Duration",
                          "Carry 12M","MtM","Retorno","Ret. Total (%)"]].style.format({
        "PU": "R$ {:.2f}", "Duration": "{:.2f}", "Carry 12M": "R$ {:.0f}",
        "MtM": "R$ {:.0f}", "Retorno": "R$ {:.0f}", "Ret. Total (%)": "{:.2f}%"}),
        use_container_width=True, hide_index=True)

    # Barras de retorno
    df_sorted = df_comp.sort_values("Ret. Total (%)", ascending=True)
    fig_ret = go.Figure(go.Bar(
        y=df_sorted["Título"], x=df_sorted["Ret. Total (%)"],
        orientation="h",
        marker_color=[CORES["positivo"] if v > 0 else CORES["negativo"]
                      for v in df_sorted["Ret. Total (%)"]],
        text=[f"{v:.1f}%" for v in df_sorted["Ret. Total (%)"]],
        textposition="outside",
        hovertemplate="%{y}: %{x:.2f}%<extra></extra>"))
    fig_ret.update_layout(**PLOTLY_LAYOUT, title=f"Retorno Total Projetado — {cenario_sel}",
                          xaxis_title="Retorno (%)", height=300)
    st.plotly_chart(fig_ret, use_container_width=True, config=PLOTLY_CFG)

    # Sensibilidade múltipla
    st.markdown("#### Sensibilidade: Retorno vs. Variação SELIC")
    deltas = np.arange(-500, 501, 50)
    series = {}
    for t in titulos:
        nome = t["Título"]
        rets = []
        for d in deltas:
            if "LFT" in nome:
                rets.append(t["Carry 12M"] / t["PU"] * 100)
            elif "NTN-B" in nome:
                c = t["Carry 12M"]
                m = -t["PU"] * r_nb["dur_mod"] * (d * 0.3 / 10000)
                rets.append((c + m) / t["PU"] * 100)
            elif "NTN-F" in nome:
                c = t["Carry 12M"]
                m = -t["PU"] * r_nf["dur_mod"] * (d / 10000)
                rets.append((c + m) / t["PU"] * 100)
            else:
                c = t["Carry 12M"]
                m = -t["PU"] * r_ltn["dur_mod"] * (d / 10000)
                rets.append((c + m) / t["PU"] * 100)
        series[nome] = rets

    cores_titulo = {"LTN 1A": CORES["secundaria"], "NTN-F 2A": CORES["primaria"],
                    "LFT": CORES["positivo"], "NTN-B 3A": CORES["inflacao"]}
    fig_sens = go.Figure()
    for nome, rets in series.items():
        fig_sens.add_trace(go.Scatter(x=deltas, y=rets, mode="lines",
                                      name=nome, line=dict(color=cores_titulo.get(nome, "gray"), width=2),
                                      hovertemplate=f"{nome}<br>ΔSELIC: " + "%{x} bps<br>Retorno: %{y:.1f}%<extra></extra>"))
    fig_sens.add_vline(x=0, line_dash="dot", line_color="gray")
    fig_sens.update_layout(**PLOTLY_LAYOUT, title="Retorno por Cenário de SELIC",
                           xaxis_title="Variação SELIC (bps)", yaxis_title="Retorno Total (%)",
                           hovermode="x unified")
    st.plotly_chart(fig_sens, use_container_width=True, config=PLOTLY_CFG)

    # Interpretação automática
    melhor = df_comp.loc[df_comp["Ret. Total (%)"].idxmax()]
    st.markdown(
        f'<div class="info-box">No cenário <b>{cenario_sel}</b>, o título com melhor retorno '
        f'projetado é <b>{melhor["Título"]}</b> com <b>{melhor["Ret. Total (%)"]:.1f}%</b>. '
        f'A LFT oferece {df_comp[df_comp["Título"]=="LFT"]["Ret. Total (%)"].values[0]:.1f}% '
        f'com risco mínimo — é a opção de menor risco.</div>', unsafe_allow_html=True)


# ============================================================================
#  MÓDULO 2 — TÍTULOS PRIVADOS DE IFs
# ============================================================================
def render_mod2():
    st.markdown("## 🏦 Títulos Privados de Instituições Financeiras")
    st.markdown('<div class="info-box"><b>Pergunta gerencial:</b> "O CDB que estou comprando '
                '(ou emitindo) está a preço justo? O spread compensa o risco de crédito da IF?"</div>',
                unsafe_allow_html=True)
    tab1, tab2, tab3, tab4 = st.tabs(["CDB Pós (% CDI)","CDB Pré","LCI/LCA Equiv. Fiscal","LF e DPGE"])
    with tab1: render_cdb_pos()
    with tab2: render_cdb_pre()
    with tab3: render_lci_lca()
    with tab4: render_lf()

# --- CDB Pós ---
def render_cdb_pos():
    with st.expander("📘 Conceito — CDB % CDI"):
        st.markdown("""
**CDB % CDI:** o principal é remunerado por X% do CDI acumulado. No mercado secundário,
se o mercado agora exige mais % CDI, o CDB vale menos (deságio).

Simplificação prática: desconto pelo fator CDI futuro ajustado pelo % de mercado.
""")
    st.markdown("---")
    st.markdown("### Precificador de CDB % CDI")
    c1, c2 = st.columns(2)
    with c1:
        st.markdown("**Dados da emissão**")
        face_cdb = st.number_input("Valor de face (R$)", value=1000000, step=100000, key="cdb_face")
        pct_emissao = st.number_input("% CDI emissão", value=100.0, step=1.0, key="cdb_pe")
        du_total_cdb = st.number_input("DU total (emissão→vencimento)", value=504, step=1, key="cdb_dut")
    with c2:
        st.markdown("**Condições de mercado**")
        pct_mercado = st.number_input("% CDI mercado", value=105.0, step=1.0, key="cdb_pm")
        du_dec = st.number_input("DU decorridos", value=126, step=1, key="cdb_dud")

    r = precificar_cdb_pos(face_cdb, pct_emissao, pct_mercado, du_total_cdb, du_dec)
    c1, c2, c3, c4 = st.columns(4)
    with c1: st.metric("PU na curva", fmt_brl(r["pu_curva"]))
    with c2: st.metric("PU a mercado (MtM)", fmt_brl(r["pu_mtm"]))
    with c3: st.metric("Diferença", fmt_brl(r["diferenca"]))
    with c4: st.metric("Spread emissão vs mercado", f"{r['spread_pp']:+.0f} pp CDI")

    # Sensibilidade ao % CDI mercado
    st.markdown("#### Sensibilidade ao % CDI de mercado")
    pcts = np.arange(80, 131, 1)
    pus_mtm = [precificar_cdb_pos(face_cdb, pct_emissao, p, du_total_cdb, du_dec)["pu_mtm"]
               for p in pcts]
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=pcts, y=pus_mtm, mode="lines",
                             line=dict(color=CORES["bancario"], width=2.5),
                             hovertemplate="% CDI mkt: %{x}%<br>PU: R$ %{y:,.0f}<extra></extra>"))
    fig.add_trace(go.Scatter(x=[pct_emissao], y=[r["pu_curva"]], mode="markers",
                             marker=dict(color=CORES["positivo"], size=10, symbol="circle"),
                             name="Emissão"))
    fig.add_trace(go.Scatter(x=[pct_mercado], y=[r["pu_mtm"]], mode="markers",
                             marker=dict(color=CORES["negativo"], size=12, symbol="diamond"),
                             name="Mercado atual"))
    fig.update_layout(**PLOTLY_LAYOUT, title="PU MtM vs. % CDI de mercado",
                      xaxis_title="% CDI mercado", yaxis_title="PU (R$)")
    st.plotly_chart(fig, use_container_width=True, config=PLOTLY_CFG)

# --- CDB Pré ---
def render_cdb_pre():
    with st.expander("📘 Conceito — CDB Prefixado"):
        st.markdown("CDB pré: estrutura idêntica à LTN (zero cupom) + spread de crédito.")
        st.latex(r"PU = \frac{Face}{(1 + taxa_{soberana} + spread)^{DU/252}}")
    st.markdown("---")
    st.markdown("### Precificador de CDB Prefixado")
    c1, c2 = st.columns(2)
    with c1:
        tx_sob = st.number_input("Taxa LTN referência (% a.a.)", value=12.50, step=0.05, key="cdbp_tx")
        spread_cdb = st.number_input("Spread de crédito (bps)", value=50, step=5, key="cdbp_sp")
    with c2:
        du_cdbp = st.number_input("DU até vencimento", value=252, step=1, key="cdbp_du")
        face_cdbp = st.number_input("Face (R$)", value=1000000, step=100000, key="cdbp_f")

    r = precificar_cdb_pre(face_cdbp, tx_sob / 100, spread_cdb, du_cdbp)
    c1, c2, c3, c4 = st.columns(4)
    with c1: st.metric("Taxa do CDB", fmt_pct(r["taxa_cdb"]))
    with c2: st.metric("PU CDB", fmt_brl(r["pu_cdb"]))
    with c3: st.metric("PU LTN equiv.", fmt_brl(r["pu_ltn"]))
    with c4: st.metric("Preço do crédito", fmt_brl(r["diferenca_pu"]))

    # Gráficos
    c1, c2 = st.columns(2)
    with c1:
        fig_bar = go.Figure()
        fig_bar.add_trace(go.Bar(x=["LTN","CDB"], y=[r["pu_ltn"], r["pu_cdb"]],
                                 marker_color=[CORES["secundaria"], CORES["bancario"]],
                                 text=[fmt_brl(r["pu_ltn"]), fmt_brl(r["pu_cdb"])],
                                 textposition="outside"))
        fig_bar.update_layout(**PLOTLY_LAYOUT, title="PU: LTN vs. CDB", yaxis_title="R$", height=350)
        st.plotly_chart(fig_bar, use_container_width=True, config=PLOTLY_CFG)
    with c2:
        sps = np.arange(0, 301, 10)
        pus_s = [precificar_cdb_pre(face_cdbp, tx_sob / 100, s, du_cdbp)["pu_cdb"] for s in sps]
        fig_sp = go.Figure()
        fig_sp.add_trace(go.Scatter(x=sps, y=pus_s, mode="lines",
                                    line=dict(color=CORES["bancario"], width=2.5),
                                    hovertemplate="Spread: %{x} bps<br>PU: R$ %{y:,.0f}<extra></extra>"))
        fig_sp.add_hline(y=r["pu_ltn"], line_dash="dash", line_color=CORES["neutro"],
                         annotation_text="PU LTN (spread=0)")
        fig_sp.add_trace(go.Scatter(x=[spread_cdb], y=[r["pu_cdb"]], mode="markers",
                                    marker=dict(color=CORES["negativo"], size=10), name="Atual"))
        fig_sp.update_layout(**PLOTLY_LAYOUT, title="PU vs. Spread", xaxis_title="Spread (bps)",
                             yaxis_title="PU (R$)", height=350)
        st.plotly_chart(fig_sp, use_container_width=True, config=PLOTLY_CFG)

# --- LCI/LCA ---
def render_lci_lca():
    with st.expander("📘 Conceito — Equivalência Fiscal"):
        st.markdown("""
**LCI/LCA:** isentos de IR para PF. Para PJ (inclusive tesouraria), tributação normal.

Comparação justa: **taxa_bruta = taxa_LCI / (1 - alíquota_IR)**

Tabela regressiva: 22,5% (até 180d) | 20% (181-360d) | 17,5% (361-720d) | 15% (acima 720d)
""")
    st.markdown("---")
    st.markdown("### Calculadora de Equivalência Fiscal")
    c1, c2 = st.columns(2)
    with c1:
        taxa_lci = st.number_input("Taxa LCI/LCA (% CDI)", value=93.0, step=1.0, key="lci_tx")
        prazo_dc = st.slider("Prazo (dias corridos)", 30, 1080, 365, 30, key="lci_dc")
    with c2:
        tipo_inv = st.selectbox("Comparar para",
                                ["Pessoa Física (isento)","Pessoa Jurídica (tributação normal)"],
                                key="lci_inv")
        tipo = "PF" if "Física" in tipo_inv else "PJ"

    r = equivalencia_fiscal(taxa_lci, prazo_dc, tipo)
    c1, c2, c3, c4 = st.columns(4)
    with c1: st.metric("Alíquota IR", fmt_pct(r["aliquota"], 1))
    with c2: st.metric("Taxa bruta equiv.", fmt_pct(r["taxa_bruta_equiv"], 1) + " CDI")
    with c3: st.metric("Taxa LCI", fmt_pct(r["taxa_isenta"], 1) + " CDI")
    with c4: st.metric("Vantagem LCI", f"{r['vantagem_bps']:.0f} bps" if tipo == "PF" else "0 bps (PJ)")

    # Tabela por faixa
    st.markdown("#### Comparativo por Faixa de Prazo")
    faixas = [(90, "Até 180d"), (270, "181-360d"), (540, "361-720d"), (900, "Acima 720d")]
    rows = []
    for dc, label in faixas:
        eq = equivalencia_fiscal(taxa_lci, dc, tipo)
        cdb_liq = 100 * (1 - eq["aliquota"] / 100)  # CDI líquido de 100% CDI
        rows.append({
            "Prazo": label, "IR": f"{eq['aliquota']:.1f}%",
            "Taxa LCI": f"{taxa_lci:.0f}% CDI",
            "Bruta equiv.": f"{eq['taxa_bruta_equiv']:.1f}% CDI",
            "CDB 100% líq.": f"{cdb_liq:.1f}% CDI",
            "Δ": f"{eq['taxa_bruta_equiv'] - 100:+.1f} pp" if tipo == "PF" else "N/A (PJ)"
        })
    st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

    st.markdown(
        '<div class="info-box">Para a tesouraria (PJ), a LCI/LCA não tem benefício '
        'fiscal. Uma LCI a 93% CDI equivale a um CDB a 93% CDI — sem vantagem. '
        'A vantagem é exclusiva do investidor PF, comprimindo a taxa de emissão '
        'e reduzindo o custo de captação do banco.</div>', unsafe_allow_html=True)

# --- LF e DPGE ---
def render_lf():
    with st.expander("📘 Conceito — Letra Financeira"):
        st.markdown("""
**LF:** prazo mínimo 2 anos, sênior ou subordinada (Tier 2 — compõe capital regulatório).
LF subordinada paga spread maior: em liquidação, subordinado absorve perdas primeiro.
""")
    st.markdown("---")
    st.markdown("### Precificador de LF")
    c1, c2 = st.columns(2)
    with c1:
        tipo_lf = st.selectbox("Tipo", ["Sênior (CDI + spread)","Subordinada Tier 2 (CDI + spread)",
                                         "Prefixada com cupom"], key="lf_tipo")
        spread_lf = st.number_input("Spread sobre CDI (bps)", value=80, step=5, key="lf_sp",
                                    help="Subordinada tipicamente 50-150 bps acima da sênior")
    with c2:
        prazo_lf = st.number_input("Prazo (anos)", value=3.0, step=0.5, min_value=2.0, key="lf_pr")
        vol_lf = st.number_input("Volume (R$)", value=5000000, step=1000000, key="lf_vol")
        per_lf = st.selectbox("Cupom", ["Bullet","Semestral","Anual"], key="lf_per")

    r = precificar_lf(spread_lf, prazo_lf, vol_lf, tipo_lf.split()[0], per_lf)
    c1, c2, c3 = st.columns(3)
    with c1: st.metric("PU", fmt_brl(r["pu"]))
    with c2: st.metric("Taxa efetiva (CDI+)", fmt_pct(r["taxa_efetiva"]))
    with c3: st.metric("Duration", f"{r['duration']:.2f} anos")

    if "Subordinada" in tipo_lf:
        spread_senior = max(0, spread_lf - 60)
        r_sen = precificar_lf(spread_senior, prazo_lf, vol_lf, "Senior", per_lf)
        premio_sub = spread_lf - spread_senior
        st.markdown(
            f'<div class="info-box">A LF subordinada paga <b>{premio_sub} bps</b> a mais que a '
            f'sênior estimada. Esse prêmio compensa o risco de subordinação? Em eventos de '
            f'resolução (RAET, liquidação), o subordinado absorve perdas primeiro.</div>',
            unsafe_allow_html=True)


# ============================================================================
#  MÓDULO 3 — TÍTULOS PRIVADOS DE EMPRESAS
# ============================================================================
def render_mod3():
    st.markdown("## 🏢 Títulos Privados de Empresas")
    st.markdown('<div class="info-box"><b>Pergunta gerencial:</b> "Essa debenture esta pagando '
                'o suficiente pelo risco de credito e pela iliquidez?"</div>',
                unsafe_allow_html=True)
    tab1, tab2, tab3 = st.tabs(["Debenture CDI+","Debenture IPCA+","CRI, CRA e NP"])
    with tab1: render_deb_cdi()
    with tab2: render_deb_ipca()
    with tab3: render_cri_cra_np()

def render_deb_cdi():
    with st.expander("📘 Conceito — Debenture CDI + Spread"):
        st.markdown("Remuneracao = CDI acumulado + spread fixo. Juros semestrais, principal bullet. "
                    "No secundario: spread mercado > emissao => abaixo do par.")
    st.markdown("---")
    st.markdown("### Precificador de Debenture CDI + Spread")
    c1, c2 = st.columns(2)
    with c1:
        face_deb = st.number_input("Face (R$)", value=1000.0, step=100.0, key="deb_f")
        sp_emissao = st.number_input("Spread emissao (% a.a.)", value=1.80, step=0.05, key="deb_se")
        per_deb = st.selectbox("Juros", ["Semestral","Anual"], key="deb_per")
        prazo_deb = st.number_input("Prazo (anos)", value=3.0, step=0.5, key="deb_pr")
    with c2:
        sp_mercado = st.number_input("Spread mercado (% a.a.)", value=2.10, step=0.05, key="deb_sm")
        rating_deb = st.selectbox("Rating", ["AAA","AA","A","BBB","BB"], key="deb_rt")

    r = precificar_debenture_cdi(face_deb, sp_emissao/100, sp_mercado/100, prazo_deb, per_deb)
    c1,c2,c3,c4 = st.columns(4)
    with c1: st.metric("PU", fmt_brl(r["pu"]))
    with c2: st.metric("PU % par", fmt_pct(r["pu_pct_par"]))
    with c3: st.metric("Spread diff", f"{r['spread_diff_bps']:+.0f} bps")
    with c4: st.metric("Duration", f"{r['duration']:.2f} anos")

    with st.expander("📐 Tabela de fluxos"):
        if not r["fluxos"].empty:
            df_s = r["fluxos"][["num","du","fluxo","fator","vp"]].copy()
            df_s.columns = ["#","DU","Fluxo (R$)","Fator","VP (R$)"]
            st.dataframe(df_s, use_container_width=True, hide_index=True)

    st.markdown("#### Impacto do Spread de Mercado")
    sp_lo = max(0.1, sp_emissao - 3)
    sp_hi = sp_emissao + 3.1
    sp_range = np.arange(sp_lo, sp_hi, 0.1)
    pus_pct = []
    for s in sp_range:
        res = precificar_debenture_cdi(face_deb, sp_emissao/100, s/100, prazo_deb, per_deb)
        pus_pct.append(res["pu_pct_par"])
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=sp_range, y=pus_pct, mode="lines",
        line=dict(color=CORES["accent"], width=2.5),
        hovertemplate="Spread: %{x:.2f}%%<br>PU: %{y:.2f}%%<extra></extra>"))
    fig.add_hline(y=100, line_dash="dash", line_color=CORES["neutro"],
                  annotation_text="Par (100%)")
    fig.add_trace(go.Scatter(x=[sp_mercado], y=[r["pu_pct_par"]], mode="markers",
                             marker=dict(color=CORES["negativo"], size=10), name="Mercado atual"))
    fig.update_layout(**PLOTLY_LAYOUT, title="PU (% par) vs. Spread de Mercado",
                      xaxis_title="Spread mercado (% a.a.)", yaxis_title="PU (% do par)")
    st.plotly_chart(fig, use_container_width=True, config=PLOTLY_CFG)

def render_deb_ipca():
    with st.expander("📘 Conceito — Debenture IPCA + Spread"):
        st.markdown("Estrutura analoga a NTN-B: VNA atualizado pelo IPCA + taxa real. "
                    "Spread = taxa debenture - taxa NTN-B. Debentures incentivadas (12.431): "
                    "isentas de IR para PF, tributacao normal para PJ.")
    st.markdown("---")
    st.markdown("### Precificador de Debenture IPCA+")
    c1, c2 = st.columns(2)
    with c1:
        tx_deb_r = st.number_input("Taxa real debenture IPCA+ (%)", value=7.00, step=0.05, key="debr_tx")
        vna_deb = st.number_input("VNA projetado (R$)", value=4352.78, step=0.01, key="debr_vna")
        prazo_deb_r = st.number_input("Prazo (anos)", value=5.0, step=0.5, key="debr_pr")
    with c2:
        per_deb_r = st.selectbox("Cupom", ["Semestral","Anual"], key="debr_per")
        tx_ntnb_ref = st.number_input("Taxa NTN-B referencia IPCA+ (%)", value=6.20, step=0.05, key="debr_nb")

    r = precificar_debenture_ipca(tx_deb_r/100, vna_deb, prazo_deb_r, per_deb_r)
    r_nb = precificar_debenture_ipca(tx_ntnb_ref/100, vna_deb, prazo_deb_r, per_deb_r)
    spread_nb = (tx_deb_r - tx_ntnb_ref) * 100  # bps

    c1,c2,c3,c4 = st.columns(4)
    with c1: st.metric("PU debenture", fmt_brl(r["pu"]))
    with c2: st.metric("PU NTN-B equiv.", fmt_brl(r_nb["pu"]))
    with c3: st.metric("Spread s/ NTN-B", f"{spread_nb:.0f} bps")
    with c4: st.metric("Duration", f"{r['duration']:.2f} anos")

    # Waterfall decomposicao
    comps_n = ["Taxa real (NTN-B)", "Spread credito+liquidez"]
    comps_v = [tx_ntnb_ref, tx_deb_r - tx_ntnb_ref]
    fig_w = go.Figure(go.Waterfall(
        x=comps_n + ["Taxa debenture"],
        y=comps_v + [0],
        measure=["relative","relative","total"],
        text=[f"{v:.2f}%" for v in comps_v] + [f"{tx_deb_r:.2f}%"],
        textposition="outside",
        increasing=dict(marker=dict(color=CORES["inflacao"])),
        totals=dict(marker=dict(color=CORES["accent"])),
        connector=dict(line=dict(color="gray", width=1, dash="dot")),
    ))
    fig_w.update_layout(**PLOTLY_LAYOUT, title="Decomposicao da Taxa da Debenture",
                        yaxis_title="% a.a.", height=380)
    st.plotly_chart(fig_w, use_container_width=True, config=PLOTLY_CFG)

    st.markdown(
        f'<div class="info-box">Debenture IPCA+ {tx_deb_r:.2f}% vs. NTN-B {tx_ntnb_ref:.2f}% '
        f'oferece {spread_nb:.0f} bps de spread. Esse spread deve remunerar: (1) risco de credito, '
        f'(2) menor liquidez, (3) riscos estruturais da emissao.</div>', unsafe_allow_html=True)

def render_cri_cra_np():
    with st.expander("📘 Conceito — CRI, CRA e Notas Promissorias"):
        st.markdown("""
**CRI/CRA:** titulos de securitizacao. Mesma logica de precificacao de debentures,
com analise adicional de lastro, subordinacao e risco de pre-pagamento.

**Nota promissoria:** curto prazo (ate 360d), zero cupom. PU = VF / (1+taxa)^(DU/252).
""")
    st.markdown("---")
    st.markdown("### Precificador Generico de Credito Privado")
    c1, c2 = st.columns(2)
    with c1:
        instrumento = st.selectbox("Instrumento", ["CRI","CRA","Nota Promissoria"], key="gen_inst")
        indexador = st.selectbox("Indexador", ["CDI + spread","IPCA + spread","Prefixado"], key="gen_idx")
        spread_gen = st.number_input("Spread / taxa (% a.a.)", value=2.50, step=0.10, key="gen_sp")
    with c2:
        prazo_gen = st.number_input("Prazo (anos)", value=2.0, step=0.5, key="gen_pr")
        estrutura = st.selectbox("Pagamento", ["Bullet","Cupom semestral","Amortizacao semestral"], key="gen_est")
        vol_gen = st.number_input("Volume (R$)", value=1000000, step=100000, key="gen_vol")

    r = precificar_credito_generico(indexador, spread_gen, prazo_gen, vol_gen, estrutura)
    # Spread sobre soberano: proxy
    tx_sob_ref = 12.50  # LTN 1A proxy
    spread_sob = (spread_gen - 0) * 100 if "CDI" in indexador else spread_gen * 100  # bps simplificado

    c1,c2,c3,c4 = st.columns(4)
    with c1: st.metric("PU", fmt_brl(r["pu"]))
    with c2: st.metric("Taxa efetiva", fmt_pct(r["taxa"]))
    with c3: st.metric("Duration", f"{r['duration']:.2f} anos")
    with c4: st.metric("Spread s/ soberano", f"~{spread_gen*100:.0f} bps")

    if "Nota" in instrumento:
        st.markdown('<div class="info-box">Nota promissoria: instrumento de curto prazo, '
                    'sem cupom. Liquidez limitada no secundario. Foco na qualidade de credito '
                    'do emissor e no prazo curto como mitigador.</div>', unsafe_allow_html=True)


# ============================================================================
#  EXERCÍCIO INTEGRADOR — RELATIVE VALUE
# ============================================================================
def render_integrador():
    st.markdown("## ⚖️ Exercicio Integrador — Relative Value")
    st.markdown('<div class="info-box"><b>Pergunta gerencial:</b> "Tenho R$ 50 milhoes para '
                'alocar em renda fixa. Qual a melhor combinacao considerando retorno, risco e liquidez?"</div>',
                unsafe_allow_html=True)

    # --- Secao 1: Selecao ---
    st.markdown("### 📋 Selecao de Instrumentos")
    modo = st.radio("Modo", ["Caso pre-configurado","Montar minha cesta"],
                    horizontal=True, key="int_modo")

    if modo == "Caso pre-configurado":
        instrumentos = [
            {"nome": "LTN 1A", "categoria": "Publico", "indexador": "Pre",
             "taxa": 12.50, "spread_sob": 0, "du": 252, "duration": 1.0,
             "rating": "Soberano", "liquidez": "Alta"},
            {"nome": "NTN-B 3A", "categoria": "Publico", "indexador": "IPCA+",
             "taxa": 6.20, "spread_sob": 0, "du": 756, "duration": 2.8,
             "rating": "Soberano", "liquidez": "Alta"},
            {"nome": "LFT", "categoria": "Publico", "indexador": "SELIC",
             "taxa": 0.02, "spread_sob": 0, "du": 504, "duration": 0.01,
             "rating": "Soberano", "liquidez": "Alta"},
            {"nome": "CDB Banco Grande 1A", "categoria": "Bancario", "indexador": "105% CDI",
             "taxa": 105, "spread_sob": 30, "du": 252, "duration": 1.0,
             "rating": "AAA", "liquidez": "Media"},
            {"nome": "CDB Pre Banco Medio 2A", "categoria": "Bancario", "indexador": "Pre",
             "taxa": 13.30, "spread_sob": 80, "du": 504, "duration": 2.0,
             "rating": "AA", "liquidez": "Baixa"},
            {"nome": "Debenture AAA 3A", "categoria": "Corporativo", "indexador": "CDI+",
             "taxa": 1.50, "spread_sob": 150, "du": 756, "duration": 2.7,
             "rating": "AAA", "liquidez": "Baixa"},
        ]
    else:
        st.markdown("Preencha a tabela (ate 8 instrumentos):")
        default_df = pd.DataFrame({
            "nome": ["LTN 1A","CDB AAA 1A","Debenture AA 3A"],
            "categoria": ["Publico","Bancario","Corporativo"],
            "indexador": ["Pre","CDI+","CDI+"],
            "taxa": [12.50, 0.80, 1.80],
            "spread_sob": [0, 50, 150],
            "duration": [1.0, 1.0, 2.7],
            "rating": ["Soberano","AAA","AA"],
            "liquidez": ["Alta","Media","Baixa"],
        })
        edited = st.data_editor(default_df, num_rows="dynamic", key="int_ed",
                                use_container_width=True)
        instrumentos = edited.to_dict("records")

    if not instrumentos:
        st.warning("Adicione ao menos um instrumento.")
        return

    df_inst = pd.DataFrame(instrumentos)

    # --- Secao 2: Tabela Master ---
    st.markdown("---")
    st.markdown("### 📊 Tabela Comparativa Master")

    # Calcular taxa liquida (IR)
    def taxa_liq(row):
        if row.get("categoria") == "Publico":
            return row["taxa"] * (1 - 0.15)  # simplificacao: 15% para > 720d
        return row["taxa"] * (1 - 0.175)  # media
    df_inst["taxa_liq"] = df_inst.apply(taxa_liq, axis=1)

    cols_show = ["nome","categoria","indexador","taxa","taxa_liq","spread_sob","duration","rating","liquidez"]
    cols_rename = {"nome":"Instrumento","categoria":"Categoria","indexador":"Indexador",
                   "taxa":"Taxa bruta","taxa_liq":"Taxa liq.","spread_sob":"Spread sob. (bps)",
                   "duration":"Duration","rating":"Rating","liquidez":"Liquidez"}
    st.dataframe(df_inst[cols_show].rename(columns=cols_rename),
                 use_container_width=True, hide_index=True)

    # Scatter: Spread vs Duration
    cor_cat = {"Publico": CORES["secundaria"], "Bancario": CORES["bancario"],
               "Corporativo": CORES["accent"]}
    fig_sc = go.Figure()
    for cat in df_inst["categoria"].unique():
        sub = df_inst[df_inst["categoria"] == cat]
        fig_sc.add_trace(go.Scatter(
            x=sub["spread_sob"], y=sub["duration"],
            mode="markers+text", text=sub["nome"], textposition="top center",
            marker=dict(color=cor_cat.get(cat, "gray"), size=14, opacity=0.8),
            name=cat,
            hovertemplate=("<b>%{text}</b><br>Spread: %{x} bps<br>"
                           "Duration: %{y:.1f} anos<br>"
                           "Rating: " + sub["rating"].values[0] + "<extra></extra>")))
    fig_sc.update_layout(**PLOTLY_LAYOUT, title="Spread sobre Soberano vs. Duration",
                         xaxis_title="Spread (bps)", yaxis_title="Duration (anos)",
                         height=450)
    st.plotly_chart(fig_sc, use_container_width=True, config=PLOTLY_CFG)

    # Barras de spread
    df_sorted = df_inst.sort_values("spread_sob")
    fig_bar = go.Figure(go.Bar(
        y=df_sorted["nome"], x=df_sorted["spread_sob"], orientation="h",
        marker_color=[cor_cat.get(c, "gray") for c in df_sorted["categoria"]],
        hovertemplate="%{y}: %{x} bps<extra></extra>"))
    # Faixas de rating
    for bps, label in [(50,"AAA ~50"),(100,"AA ~100"),(200,"A ~200")]:
        fig_bar.add_vline(x=bps, line_dash="dot", line_color="gray", opacity=0.4,
                          annotation_text=label, annotation_position="top")
    fig_bar.update_layout(**PLOTLY_LAYOUT, title="Spread sobre Soberano",
                          xaxis_title="Spread (bps)", height=300)
    st.plotly_chart(fig_bar, use_container_width=True, config=PLOTLY_CFG)

    # --- Secao 3: Cenario ---
    st.markdown("---")
    st.markdown("### 🌎 Simulacao de Retorno por Cenario")
    cen_sel = st.selectbox("Cenario", list(CENARIOS.keys()), key="int_cen")
    horiz = st.slider("Horizonte (meses)", 3, 24, 12, key="int_hor")

    if cen_sel == "Personalizado":
        c1, c2 = st.columns(2)
        with c1: d_selic = st.slider("Var. SELIC (bps)", -500, 500, 0, 25, key="int_ds")
        with c2: d_spread = st.slider("Var. spreads (bps)", -100, 200, 0, 10, key="int_dsp")
    else:
        cen = CENARIOS[cen_sel]
        d_selic = cen["delta_selic"]
        d_spread = cen.get("delta_spread", 0)

    frac = horiz / 12
    retornos = []
    for _, row in df_inst.iterrows():
        dur = row["duration"]
        # Carry simplificado
        if "CDI" in str(row["indexador"]) or "SELIC" in str(row["indexador"]):
            carry_pct = 13.75 * frac  # proxy CDI
        elif "IPCA" in str(row["indexador"]):
            carry_pct = (4.5 + row["taxa"]) * frac
        else:
            carry_pct = row["taxa"] * frac
        # MtM
        mtm_pct = -dur * (d_selic / 10000) * 100  # simplificacao
        # Ajuste spread (para privados)
        if row["categoria"] != "Publico":
            mtm_pct -= dur * (d_spread / 10000) * 100
        ret_total = carry_pct + mtm_pct
        ret_dur = ret_total / dur if dur > 0.01 else ret_total * 100
        retornos.append({
            "nome": row["nome"], "carry": carry_pct, "mtm": mtm_pct,
            "ret_total": ret_total, "ret_dur": ret_dur})

    df_ret = pd.DataFrame(retornos)
    df_show = df_inst[["nome","categoria","duration"]].merge(df_ret, on="nome")
    df_show = df_show.sort_values("ret_total", ascending=False)
    st.dataframe(df_show.rename(columns={
        "nome":"Instrumento","categoria":"Categoria","duration":"Duration",
        "carry":"Carry (%)","mtm":"MtM (%)","ret_total":"Retorno Total (%)",
        "ret_dur":"Ret./Duration"}).style.format({
            "Duration":"{:.2f}","Carry (%)":"{:.2f}","MtM (%)":"{:+.2f}",
            "Retorno Total (%)":"{:.2f}","Ret./Duration":"{:.1f}"}),
        use_container_width=True, hide_index=True)

    # Scatter retorno vs duration
    fig_rd = go.Figure()
    for cat in df_show["categoria"].unique():
        sub = df_show[df_show["categoria"] == cat]
        fig_rd.add_trace(go.Scatter(
            x=sub["duration"], y=sub["ret_total"],
            mode="markers+text", text=sub["nome"], textposition="top center",
            marker=dict(color=cor_cat.get(cat, "gray"), size=14),
            name=cat,
            hovertemplate="<b>%{text}</b><br>Duration: %{x:.1f}<br>Retorno: %{y:.2f}%<extra></extra>"))
    fig_rd.update_layout(**PLOTLY_LAYOUT, title="Retorno vs. Duration (Eficiencia)",
                         xaxis_title="Duration (anos)", yaxis_title="Retorno Total (%)")
    st.plotly_chart(fig_rd, use_container_width=True, config=PLOTLY_CFG)

    # Ranking
    st.markdown("#### Ranking por Eficiencia (Retorno / Duration)")
    for i, row in df_show.iterrows():
        medal = ["🥇","🥈","🥉"][min(list(df_show.index).index(i), 2)] if list(df_show.index).index(i) < 3 else "  "
        st.markdown(f"{medal} **{row['nome']}** — {row['ret_total']:.2f}% retorno, "
                    f"{row['ret_dur']:.1f} por ano de duration")

    # --- Secao 4: Alocacao ---
    st.markdown("---")
    st.markdown("### 💼 Monte Sua Carteira")
    vol_total = st.number_input("Volume total (R$)", value=50000000, step=5000000, key="int_vol")
    st.markdown("Defina a alocacao percentual:")
    alocs = {}
    soma = 0
    for _, row in df_inst.iterrows():
        v = st.slider(row["nome"], 0, 100, int(100 / len(df_inst)),
                       key=f"aloc_{row['nome']}")
        alocs[row["nome"]] = v
        soma += v

    if soma != 100:
        st.warning(f"Soma = {soma}%. Ajuste para 100%.")
    else:
        dur_media = sum(alocs[row["nome"]] / 100 * row["duration"]
                        for _, row in df_inst.iterrows())
        spread_medio = sum(alocs[row["nome"]] / 100 * row["spread_sob"]
                           for _, row in df_inst.iterrows())
        ret_proj = sum(alocs[r["nome"]] / 100 * df_ret[df_ret["nome"]==r["nome"]]["ret_total"].values[0]
                       for r in instrumentos if alocs.get(r["nome"], 0) > 0)
        max_conc = max(alocs.values())

        c1,c2,c3,c4 = st.columns(4)
        with c1: st.metric("Duration media", f"{dur_media:.2f} anos")
        with c2: st.metric("Spread medio", f"{spread_medio:.0f} bps")
        with c3: st.metric("Retorno proj.", fmt_pct(ret_proj))
        with c4: st.metric("Maior alocacao", f"{max_conc}%")

        # Donut
        labels_d = [n for n, v in alocs.items() if v > 0]
        vals_d = [v for v in alocs.values() if v > 0]
        cores_d = []
        for n in labels_d:
            cat = df_inst[df_inst["nome"]==n]["categoria"].values[0]
            cores_d.append(cor_cat.get(cat, "gray"))
        fig_donut = go.Figure(go.Pie(
            labels=labels_d, values=vals_d,
            hole=0.5, marker=dict(colors=cores_d),
            hovertemplate="%{label}: %{value}%<extra></extra>"))
        fig_donut.update_layout(**PLOTLY_LAYOUT, title="Composicao da Carteira", height=350)
        st.plotly_chart(fig_donut, use_container_width=True, config=PLOTLY_CFG)

        # Analise automatica
        cat_conc = {}
        for n, v in alocs.items():
            if v > 0:
                cat = df_inst[df_inst["nome"]==n]["categoria"].values[0]
                cat_conc[cat] = cat_conc.get(cat, 0) + v
        cat_max = max(cat_conc, key=cat_conc.get)
        melhor_ef = df_show.iloc[0]
        st.markdown(
            f'<div class="info-box">'
            f'Carteira com duration media de <b>{dur_media:.2f} anos</b> e spread medio '
            f'de <b>{spread_medio:.0f} bps</b>. No cenario de {cen_sel}, retorno projetado '
            f'de <b>{ret_proj:.2f}%</b>.<br>'
            f'Concentracao em {cat_max}: {cat_conc[cat_max]}%. '
            f'Instrumento mais eficiente: <b>{melhor_ef["nome"]}</b> '
            f'({melhor_ef["ret_dur"]:.1f} retorno/duration).'
            f'</div>', unsafe_allow_html=True)

    # --- Secao 5: Reflexao ---
    st.markdown("---")
    st.markdown("### 💬 Questoes para Reflexao")
    questoes = [
        "Sua alocacao muda se o cenario for de alta em vez de corte? Quanto migraria para LFT?",
        "O spread da debenture AAA compensa a iliquidez? Conseguiria vender a preco justo em estresse?",
        "O CDB do banco medio paga mais que o do grande. O excesso e proporcional ao risco incremental?",
        "Se a inflacao surpreender para cima, quais instrumentos se beneficiam e quais sofrem?",
        "Como essa alocacao se compara com limites tipicos de tesouraria (concentracao, VaR, duration)?",
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
        "mod2": render_mod2,
        "mod3": render_mod3,
        "integrador": render_integrador,
    }
    fn = dispatch.get(pagina, render_home)
    fn()

def main():
    configurar_pagina()
    render()

if __name__ == "__main__":
    main()