"""
Laboratório de Operações de Tesouraria — Módulo 4
Gestão de Carregamento de Ativos
MBA em Bancos e Instituições Financeiras — FGV

Arquivo único: module_04_carrying.py
Para executar: streamlit run module_04_carrying.py

Dependências: streamlit, plotly, pandas, numpy, bizdays
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from datetime import date, timedelta
from typing import Dict, List, Tuple, Optional
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
#  PALETA DE CORES
# ============================================================================
CORES = {
    "primaria": "#1B3A5C",
    "secundaria": "#2E75B6",
    "accent": "#C55A11",
    "fundo_claro": "#EAF3F8",
    "positivo": "#2E8B57",
    "negativo": "#CC3333",
    "neutro": "#888888",
    "amarelo": "#D4A012",
    # Estratégias
    "bullet": "#2E75B6",
    "barbell": "#C55A11",
    "ladder": "#0E7C7B",
    "riding": "#8B5CF6",
}

COR_ESTRAT = {
    "Bullet": CORES["bullet"],
    "Barbell": CORES["barbell"],
    "Ladder": CORES["ladder"],
    "Riding the Yield Curve": CORES["riding"],
}

PLOTLY_LAYOUT = dict(
    template="plotly_white",
    font=dict(family="Segoe UI, Arial, sans-serif", size=13),
    margin=dict(l=60, r=30, t=50, b=50),
    hoverlabel=dict(bgcolor="white", font_size=12),
)
PLOTLY_CFG = {"displayModeBar": False}

DATA_DIR = "data/"

# ============================================================================
#  CURVA DEFAULT (fallback quando não há CSV)
# ============================================================================
CURVA_DEFAULT = pd.DataFrame({
    "vertice": ["6M", "1A", "2A", "3A", "5A", "7A", "10A"],
    "prazo_du": [126, 252, 504, 756, 1260, 1764, 2520],
    "prazo_anos": [0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0],
    "taxa": [13.25, 13.00, 12.80, 12.70, 12.50, 12.40, 12.30],
})

# Cenários pré-definidos: {nome: {vertice_curto_bps, vertice_longo_bps}}
CENARIOS_CURVA = {
    "Paralelo +100 bps": {"curto": 100, "longo": 100},
    "Paralelo -100 bps": {"curto": -100, "longo": -100},
    "Empinamento (curto +50, longo +150)": {"curto": 50, "longo": 150},
    "Achatamento (curto +150, longo +50)": {"curto": 150, "longo": 50},
    "Bear flattening (curto +200, longo +100)": {"curto": 200, "longo": 100},
    "Bull steepening (curto -150, longo -50)": {"curto": -150, "longo": -50},
}

CENARIOS_STRESS = {
    "Paralelo +100 bps": {"curto": 100, "longo": 100},
    "Paralelo +200 bps": {"curto": 200, "longo": 200},
    "Paralelo -100 bps": {"curto": -100, "longo": -100},
    "Empinamento": {"curto": 50, "longo": 150},
    "Achatamento": {"curto": 150, "longo": 50},
    "Estresse severo +300 bps": {"curto": 300, "longo": 300},
}

CASOS_INTEGRADOR = {
    "Caso 1: Ciclo de cortes — SELIC em queda": {
        "selic": 13.75, "descricao": "SELIC em trajetoria de queda. Mercado precifica cortes de 200 bps em 12 meses.",
        "volume": 100_000_000, "dv01_lim": 50_000, "dur_max": 4.0,
        "funding_vf": 30_000_000, "funding_prazo": 2.0},
    "Caso 2: Ciclo de alta — SELIC subindo": {
        "selic": 10.50, "descricao": "SELIC em alta. BC sinaliza mais 150 bps. Curva invertida no curto prazo.",
        "volume": 100_000_000, "dv01_lim": 50_000, "dur_max": 4.0,
        "funding_vf": 30_000_000, "funding_prazo": 2.0},
    "Caso 3: Incerteza — curva flat": {
        "selic": 12.00, "descricao": "Incerteza elevada. Curva quase flat. Mercado dividido sobre proximos passos.",
        "volume": 100_000_000, "dv01_lim": 50_000, "dur_max": 4.0,
        "funding_vf": 30_000_000, "funding_prazo": 2.0},
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
      margin:.5rem 0;min-height:160px;transition:box-shadow .2s}
    .modulo-card:hover{box-shadow:0 4px 12px rgba(0,0,0,.1)}
    .modulo-card h4{color:#1B3A5C;margin-bottom:.5rem}
    .modulo-card p{color:#555;font-size:.9rem}
    div[data-testid="stMetric"]{background:#f8f9fa;border-radius:8px;
      padding:.8rem;border:1px solid #e9ecef}
    </style>""", unsafe_allow_html=True)

# ============================================================================
#  FUNÇÕES FINANCEIRAS — CORE
# ============================================================================
def truncar6(x: float) -> float:
    return math.floor(x * 1_000_000) / 1_000_000

def precificar_ltn(taxa: float, du: int) -> float:
    """PU de uma LTN. taxa em decimal."""
    fator = truncar6((1 + taxa) ** (du / 252))
    return 1000.0 / fator

def precificar_titulo_cupom(taxa: float, du_total: int, cupom_aa: float = 0.10,
                            face: float = 1000.0) -> dict:
    """Precifica título com cupons semestrais. Retorna dict com pu, fluxos, duration, convexidade."""
    cupom_sem = (1 + cupom_aa) ** 0.5 - 1
    cupom_brl = face * cupom_sem
    n_semestres = max(1, round(du_total / 126))
    du_step = du_total / n_semestres
    fluxos_du = []
    fluxos_val = []
    for i in range(1, n_semestres + 1):
        du_i = du_step * i
        fl = cupom_brl + (face if i == n_semestres else 0)
        fluxos_du.append(du_i)
        fluxos_val.append(fl)
    # VP de cada fluxo
    vps = []
    for du_i, fl in zip(fluxos_du, fluxos_val):
        fator = (1 + taxa) ** (du_i / 252)
        vps.append(fl / fator)
    pu = sum(vps)
    if pu <= 0:
        return {"pu": 0, "duration": 0, "dur_mod": 0, "convexidade": 0}
    # Duration Macaulay
    dur_mac = sum(vp * du / 252 for vp, du in zip(vps, fluxos_du)) / pu
    dur_mod = dur_mac / (1 + taxa)
    # Convexidade: C = (1/PU) * sum[t*(t+1)*VP_k] / (1+y)^2
    conv = sum(vp * (du / 252) * (du / 252 + 1) for vp, du in zip(vps, fluxos_du)) / (pu * (1 + taxa) ** 2)
    return {"pu": pu, "duration": dur_mac, "dur_mod": dur_mod, "convexidade": conv,
            "fluxos_du": fluxos_du, "fluxos_val": fluxos_val, "vps": vps}

def duration_zero_cupom(taxa: float, du: int) -> dict:
    """Duration e convexidade de zero cupom."""
    t = du / 252
    pu = precificar_ltn(taxa, du)
    dur_mod = t / (1 + taxa)
    conv = t * (t + 1) / (1 + taxa) ** 2
    return {"pu": pu, "duration": t, "dur_mod": dur_mod, "convexidade": conv}

def dv01(dur_mod: float, pu: float, qtd: float = 1) -> float:
    """DV01 = D* x PU x 0.0001 x quantidade."""
    return dur_mod * pu * 0.0001 * qtd

def aprox_duration(pu: float, dur_mod: float, choque_bps: float) -> float:
    """Delta PU usando apenas duration."""
    return -dur_mod * pu * (choque_bps / 10000)

def aprox_duration_convexidade(pu: float, dur_mod: float, conv: float, choque_bps: float) -> float:
    """Delta PU usando duration + convexidade."""
    di = choque_bps / 10000
    return -dur_mod * pu * di + 0.5 * conv * pu * di ** 2

# ============================================================================
#  ESTRATÉGIAS
# ============================================================================
def obter_curva():
    """Retorna DataFrame da curva. Tenta CSV, depois default."""
    try:
        df = pd.read_csv(f"{DATA_DIR}curvas_di.csv")
        if "prazo_du" in df.columns and "taxa" in df.columns:
            last = df["data"].max() if "data" in df.columns else None
            sub = df[df["data"] == last] if last else df
            sub = sub.sort_values("prazo_du").reset_index(drop=True)
            if len(sub) >= 3:
                sub["prazo_anos"] = sub["prazo_du"] / 252
                sub["vertice"] = sub["prazo_anos"].apply(
                    lambda x: f"{x:.0f}A" if x >= 1 else f"{int(x*12)}M")
                return sub[["vertice","prazo_du","prazo_anos","taxa"]].reset_index(drop=True)
    except Exception:
        pass
    return CURVA_DEFAULT.copy()

def interpolar_choque(curva: pd.DataFrame, choque_curto: float, choque_longo: float) -> np.ndarray:
    """Interpola linearmente os choques entre vértice curto e longo."""
    prazos = curva["prazo_anos"].values
    p_min, p_max = prazos.min(), prazos.max()
    if p_max == p_min:
        return np.full(len(prazos), choque_curto)
    frac = (prazos - p_min) / (p_max - p_min)
    return choque_curto + frac * (choque_longo - choque_curto)

def montar_bullet(curva: pd.DataFrame, dur_alvo: float) -> pd.DataFrame:
    """Concentra 100% no vértice mais próximo da duration alvo."""
    df = curva.copy()
    df["diff"] = abs(df["prazo_anos"] - dur_alvo)
    idx = df["diff"].idxmin()
    df["peso"] = 0.0
    df.loc[idx, "peso"] = 100.0
    return df.drop(columns="diff")

def montar_barbell(curva: pd.DataFrame, dur_alvo: float) -> pd.DataFrame:
    """Extremos da curva, pesos para casar duration."""
    df = curva.copy()
    df["peso"] = 0.0
    if len(df) < 2:
        df["peso"] = 100.0 / len(df)
        return df
    d_curto = df.iloc[0]["prazo_anos"]
    d_longo = df.iloc[-1]["prazo_anos"]
    if d_longo == d_curto:
        df.iloc[0, df.columns.get_loc("peso")] = 50
        df.iloc[-1, df.columns.get_loc("peso")] = 50
        return df
    w_curto = (d_longo - dur_alvo) / (d_longo - d_curto)
    w_curto = max(0, min(1, w_curto))
    df.iloc[0, df.columns.get_loc("peso")] = w_curto * 100
    df.iloc[-1, df.columns.get_loc("peso")] = (1 - w_curto) * 100
    return df

def montar_ladder(curva: pd.DataFrame, dur_alvo: float) -> pd.DataFrame:
    """Distribuição uniforme em todos os vértices."""
    df = curva.copy()
    n = len(df)
    df["peso"] = 100.0 / n if n > 0 else 0
    return df

def montar_riding(curva: pd.DataFrame, dur_alvo: float) -> pd.DataFrame:
    """Concentra em vértices mais longos que a duration alvo."""
    df = curva.copy()
    df["peso"] = 0.0
    longos = df[df["prazo_anos"] > dur_alvo]
    if longos.empty:
        longos = df.tail(2)
    n = len(longos)
    for idx in longos.index:
        df.loc[idx, "peso"] = 100.0 / n
    return df

def montar_estrategia(nome: str, curva: pd.DataFrame, dur_alvo: float) -> pd.DataFrame:
    fn = {"Bullet": montar_bullet, "Barbell": montar_barbell,
          "Ladder": montar_ladder, "Riding the Yield Curve": montar_riding}
    return fn.get(nome, montar_bullet)(curva, dur_alvo)

def calcular_metricas_carteira(cart: pd.DataFrame) -> dict:
    """Calcula métricas agregadas a partir de cart com colunas peso, taxa, prazo_du."""
    pesos = cart["peso"].values / 100
    taxas = cart["taxa"].values / 100
    prazos = cart["prazo_du"].values
    dur_pond = 0
    conv_pond = 0
    yield_pond = 0
    n_vert = int((pesos > 0.001).sum())
    for w, tx, du in zip(pesos, taxas, prazos):
        if w < 0.001:
            continue
        r = duration_zero_cupom(tx, du)
        dur_pond += w * r["dur_mod"]
        conv_pond += w * r["convexidade"]
        yield_pond += w * tx * 100
    return {"duration": dur_pond, "convexidade": conv_pond,
            "yield_medio": yield_pond, "n_vertices": n_vert}

def simular_retorno_estrategia(cart: pd.DataFrame, choque_curto: float,
                               choque_longo: float, horizonte_meses: int = 12) -> dict:
    """Retorna carry, MtM e total para uma carteira sob choque."""
    choques = interpolar_choque(cart, choque_curto, choque_longo)
    pesos = cart["peso"].values / 100
    taxas = cart["taxa"].values / 100
    prazos = cart["prazo_du"].values
    frac = horizonte_meses / 12
    carry_total = 0
    mtm_total = 0
    for w, tx, du, chq in zip(pesos, taxas, prazos, choques):
        if w < 0.001:
            continue
        pu0 = precificar_ltn(tx, du)
        r = duration_zero_cupom(tx, du)
        carry = w * pu0 * tx * frac
        mtm = w * aprox_duration_convexidade(pu0, r["dur_mod"], r["convexidade"], chq)
        carry_total += carry
        mtm_total += mtm
    ret_total = carry_total + mtm_total
    return {"carry": carry_total, "mtm": mtm_total, "total": ret_total}

# ============================================================================
#  IMUNIZAÇÃO
# ============================================================================
def calcular_pesos_imunizacao(d_alvo: float, d_curto: float, d_longo: float) -> Tuple[float, float]:
    """Retorna (w_curto, w_longo) para casar duration = d_alvo."""
    if d_longo == d_curto:
        return 0.5, 0.5
    w_curto = (d_longo - d_alvo) / (d_longo - d_curto)
    w_curto = max(0, min(1, w_curto))
    return w_curto, 1 - w_curto

def simular_imunizacao(pu_curto: float, pu_longo: float, dur_curto: float,
                       dur_longo: float, taxa_curto: float, taxa_longo: float,
                       w_curto: float, vp_total: float, horizonte: float,
                       choque_bps: float) -> dict:
    """Simula valor acumulado no horizonte para carteira imunizada."""
    inv_curto = vp_total * w_curto
    inv_longo = vp_total * (1 - w_curto)
    choque = choque_bps / 10000
    # Carry
    carry_c = inv_curto * taxa_curto * horizonte
    carry_l = inv_longo * taxa_longo * horizonte
    # MtM
    mtm_c = -dur_curto * inv_curto * choque / (1 + taxa_curto)
    mtm_l = -dur_longo * inv_longo * choque / (1 + taxa_longo)
    # Reinvestimento (cupons reinvestidos à nova taxa)
    reinv_c = carry_c * choque * horizonte * 0.5  # simplificação
    reinv_l = carry_l * choque * horizonte * 0.5
    valor_final = vp_total + carry_c + carry_l + mtm_c + mtm_l + reinv_c + reinv_l
    return {"valor_final": valor_final, "carry": carry_c + carry_l,
            "mtm": mtm_c + mtm_l, "reinv": reinv_c + reinv_l}

def duration_drift(dur_carteira: float, horizonte_total: float,
                   meses_decorridos: int) -> dict:
    """Calcula drift da duration vs horizonte remanescente."""
    t = meses_decorridos / 12
    # Duration diminui ~linearmente mas não exatamente
    dur_atual = max(0, dur_carteira - t * 0.85)  # proxy
    horiz_rem = max(0, horizonte_total - t)
    descasamento = dur_atual - horiz_rem
    if abs(descasamento) < 0.25:
        status = "ok"
    elif abs(descasamento) < 0.5:
        status = "atencao"
    else:
        status = "fora"
    return {"dur_atual": dur_atual, "horiz_rem": horiz_rem,
            "descasamento": descasamento, "status": status}

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

def indicador_limite(valor, limite, inv=False):
    """Retorna emoji de conformidade."""
    if inv:
        ok = valor <= limite
    else:
        ok = valor <= limite
    if ok:
        return "✅"
    elif valor <= limite * 1.1:
        return "⚠️"
    else:
        return "❌"

# ============================================================================
#  CARGA DE DADOS
# ============================================================================
@st.cache_data(ttl=86400)
def carregar_curvas_di():
    """CSV: data/curvas_di.csv | Colunas: data, prazo_du, taxa
    Fonte: Módulo 2 / B3."""
    try:
        return pd.read_csv(f"{DATA_DIR}curvas_di.csv",
                           parse_dates=["data"]).sort_values(["data","prazo_du"]).reset_index(drop=True)
    except FileNotFoundError:
        return pd.DataFrame(columns=["data","prazo_du","taxa"])

@st.cache_data(ttl=86400)
def carregar_titulos_disponiveis():
    """CSV: data/titulos_disponiveis.csv
    Colunas: titulo, categoria (Publico/Bancario/Corporativo), taxa, prazo_du, duration, rating
    Fonte: Módulo 3."""
    try:
        return pd.read_csv(f"{DATA_DIR}titulos_disponiveis.csv").reset_index(drop=True)
    except FileNotFoundError:
        return pd.DataFrame({
            "titulo": ["LTN 6M","LTN 1A","LTN 2A","LTN 3A","NTN-F 5A","LTN 5A","NTN-F 7A"],
            "categoria": ["Publico"]*7,
            "taxa": [13.25,13.00,12.80,12.70,12.50,12.50,12.40],
            "prazo_du": [126,252,504,756,1260,1260,1764],
            "duration": [0.5,1.0,2.0,3.0,4.3,5.0,5.8],
            "rating": ["Soberano"]*7,
        })


# ============================================================================
#  NAVEGAÇÃO E HOME
# ============================================================================
def configurar_pagina():
    st.set_page_config(page_title="Laboratório de Tesouraria — Módulo 4",
                       page_icon="🎯", layout="wide", initial_sidebar_state="expanded")
    aplicar_css()

def sidebar_navegacao() -> str:
    with st.sidebar:
        st.markdown("### 🏛️ Laboratório de Tesouraria")
        st.markdown("**Módulo 4** — Gestão de Carregamento")
        st.markdown("---")
        paginas = {
            "🏛️ Visão Geral do Módulo 4": "home",
            "📊 Estratégias de Investimento": "mod1",
            "⚠️ Risco de Taxa de Juros": "mod2",
            "📐 Duration e Convexidade": "mod3",
            "🛡️ Imunização": "mod4",
            "🎯 Exercício Integrador": "integrador",
        }
        escolha = st.radio("Navegação", list(paginas.keys()), label_visibility="collapsed")
        st.markdown("---")
        st.caption("MBA em Bancos e IFs — FGV")
    return paginas[escolha]

def render_home():
    st.markdown("# Laboratório de Operações de Tesouraria")
    st.markdown("### Módulo 4 — Gestão de Carregamento de Ativos")
    st.markdown(
        '<div class="info-box">'
        "Nos módulos anteriores, você aprendeu a construir a curva de juros e a precificar "
        "instrumentos. Agora vai aprender a gerir uma carteira: como posicioná-la, como medir "
        "e controlar o risco, e como protegê-la contra variações de taxa."
        '</div>', unsafe_allow_html=True)
    st.markdown("---")
    st.markdown("### Mapa do Módulo")
    mods = [
        ("📊","Estratégias","Bullet, Barbell, Ladder, Riding — qual para cada cenário?"),
        ("⚠️","Risco de Taxa","DV01, KRD, Stress Test — onde está o risco?"),
        ("📐","Duration e Convexidade","A ferramenta e a correção de segunda ordem"),
        ("🛡️","Imunização","Proteger a carteira contra qualquer cenário"),
        ("🎯","Gestor por um Dia","Integrar tudo numa decisão real"),
    ]
    cols = st.columns(5)
    for i, (ic, tit, desc) in enumerate(mods):
        with cols[i]:
            st.markdown(f'<div class="modulo-card"><h4>{ic} {tit}</h4>'
                        f'<p><i>"{desc}"</i></p></div>', unsafe_allow_html=True)
    st.markdown("---")
    st.markdown(
        '<div class="info-box"><b>🔗 Este módulo integra:</b> Cenário e curva (Módulos 1-2), '
        'precificação (Módulo 3), sensibilidade taxa-preço formalizada como duration.</div>',
        unsafe_allow_html=True)

# ============================================================================
#  MÓDULO 1 — ESTRATÉGIAS
# ============================================================================
def render_mod1():
    st.markdown("## 📊 Estratégias de Investimento na Renda Fixa")
    st.markdown('<div class="info-box"><b>Pergunta gerencial:</b> "Como distribuir minha '
                'carteira ao longo da curva para maximizar retorno ajustado ao risco?"</div>',
                unsafe_allow_html=True)
    tab1, tab2, tab3 = st.tabs(["Estratégias Clássicas","Estratégia x Cenário","Riding the Yield Curve"])
    with tab1: render_estrategias_classicas()
    with tab2: render_estrategia_cenario()
    with tab3: render_riding()

def render_estrategias_classicas():
    with st.expander("📘 Conceito"):
        st.markdown("""
| Estratégia | Definição | Quando usar | Vantagem | Risco |
|---|---|---|---|---|
| **Bullet** | Concentra num único vértice | Visão forte sobre um prazo | Máximo carry no vértice | Concentração |
| **Barbell** | Extremos da curva | Espera volatilidade | Maior convexidade | Menor carry |
| **Ladder** | Distribuição uniforme | Sem visão direcional | Diversificação | Retorno mediano |
| **Riding** | Vértices longos, vender antes | Curva positiva e estável | Ganho de rolldown | Curva subir |
""")
    st.markdown("---")
    curva = obter_curva()
    c1, c2 = st.columns(2)
    with c1: estrat = st.selectbox("Estratégia", list(COR_ESTRAT.keys()), key="ec_est")
    with c2: dur_alvo = st.slider("Duration alvo (anos)", 1.0, 7.0, 3.0, 0.5, key="ec_dur")
    cart = montar_estrategia(estrat, curva, dur_alvo)
    metr = calcular_metricas_carteira(cart)

    fig = make_subplots(specs=[[{"secondary_y": True}]])
    fig.add_trace(go.Scatter(
        x=cart["vertice"], y=cart["taxa"], mode="lines+markers",
        name="Curva spot", line=dict(color=CORES["secundaria"], width=2),
        hovertemplate="%{x}: %{y:.2f}%<extra></extra>"), secondary_y=False)
    fig.add_trace(go.Bar(
        x=cart["vertice"], y=cart["peso"], name="Peso (%)",
        marker_color=COR_ESTRAT[estrat], opacity=0.7,
        hovertemplate="%{x}: %{y:.1f}%<extra></extra>"), secondary_y=True)
    fig.update_layout(**PLOTLY_LAYOUT, title=f"Distribuição: {estrat}", hovermode="x unified", height=400)
    fig.update_yaxes(title_text="Taxa (%)", secondary_y=False)
    fig.update_yaxes(title_text="Peso (%)", secondary_y=True)
    st.plotly_chart(fig, use_container_width=True, config=PLOTLY_CFG)

    c1,c2,c3,c4 = st.columns(4)
    with c1: st.metric("Duration efetiva", f"{metr['duration']:.2f} anos")
    with c2: st.metric("Convexidade", f"{metr['convexidade']:.2f}")
    with c3: st.metric("Vértices", str(metr["n_vertices"]))
    with c4: st.metric("Yield médio", fmt_pct(metr["yield_medio"]))

    df_show = cart[cart["peso"] > 0.01][["vertice","prazo_du","taxa","peso"]].copy()
    df_show["Contrib. dur."] = df_show.apply(
        lambda r: r["peso"]/100 * r["prazo_du"]/252 / (1 + r["taxa"]/100), axis=1)
    df_show.columns = ["Vértice","Prazo (DU)","Taxa (%)","Peso (%)","Contrib. Duration"]
    st.dataframe(df_show.style.format({"Taxa (%)":"{:.2f}","Peso (%)":"{:.1f}",
                 "Contrib. Duration":"{:.3f}"}), use_container_width=True, hide_index=True)

def render_estrategia_cenario():
    st.markdown("### Comparador de Estratégias sob Cenário")
    c1, c2, c3 = st.columns(3)
    with c1: dur_alvo = st.slider("Duration alvo (anos)", 1.0, 7.0, 3.0, 0.5, key="sc_dur")
    with c2: volume = st.number_input("Volume (R$)", value=100_000_000, step=10_000_000, key="sc_vol")
    with c3:
        cen_opcoes = list(CENARIOS_CURVA.keys()) + ["Personalizado"]
        cen_sel = st.selectbox("Cenário", cen_opcoes, key="sc_cen")
    if cen_sel == "Personalizado":
        cc1, cc2 = st.columns(2)
        with cc1: chq_c = st.slider("Choque curto (bps)", -300, 300, 0, 25, key="sc_cc")
        with cc2: chq_l = st.slider("Choque longo (bps)", -300, 300, 0, 25, key="sc_cl")
    else:
        cen = CENARIOS_CURVA[cen_sel]
        chq_c, chq_l = cen["curto"], cen["longo"]
    horiz = st.slider("Horizonte (meses)", 1, 24, 12, key="sc_hor")
    curva = obter_curva()

    nomes = list(COR_ESTRAT.keys())
    resultados = []
    for nome in nomes:
        cart = montar_estrategia(nome, curva, dur_alvo)
        metr = calcular_metricas_carteira(cart)
        ret = simular_retorno_estrategia(cart, chq_c, chq_l, horiz)
        resultados.append({"Estratégia": nome, "Duration": metr["duration"],
            "Convexidade": metr["convexidade"],
            "Carry (R$)": ret["carry"] * volume / 1000,
            "MtM (R$)": ret["mtm"] * volume / 1000,
            "Retorno total (%)": ret["total"] / 10})
    df_res = pd.DataFrame(resultados).sort_values("Retorno total (%)", ascending=False)
    df_res["Ranking"] = [f"{i+1}o" for i in range(len(df_res))]
    st.dataframe(df_res.style.format({"Duration":"{:.2f}","Convexidade":"{:.2f}",
        "Carry (R$)":"R$ {:.0f}","MtM (R$)":"R$ {:.0f}","Retorno total (%)":"{:.2f}%"}),
        use_container_width=True, hide_index=True)

    # Barras retorno
    fig_ret = go.Figure()
    for _, row in df_res.iterrows():
        fig_ret.add_trace(go.Bar(x=[row["Estratégia"]], y=[row["Retorno total (%)"]],
            marker_color=COR_ESTRAT.get(row["Estratégia"],"gray"), name=row["Estratégia"],
            hovertemplate=f"{row['Estratégia']}: {row['Retorno total (%)']:.2f}%<extra></extra>"))
    fig_ret.add_hline(y=0, line_dash="dot", line_color="gray")
    fig_ret.update_layout(**PLOTLY_LAYOUT, title="Retorno Total", yaxis_title="%", showlegend=False, height=350)
    st.plotly_chart(fig_ret, use_container_width=True, config=PLOTLY_CFG)

    # Decomposição
    fig_dec = go.Figure()
    for comp, cor in [("Carry (R$)", CORES["positivo"]), ("MtM (R$)", CORES["secundaria"])]:
        fig_dec.add_trace(go.Bar(x=df_res["Estratégia"], y=df_res[comp], name=comp.split(" ")[0], marker_color=cor))
    fig_dec.update_layout(**PLOTLY_LAYOUT, barmode="relative", title="Decomposição Carry + MtM", yaxis_title="R$", height=350)
    st.plotly_chart(fig_dec, use_container_width=True, config=PLOTLY_CFG)

    melhor = df_res.iloc[0]
    pior = df_res.iloc[-1]
    comp_m = "carry" if abs(melhor["Carry (R$)"]) > abs(melhor["MtM (R$)"]) else "MtM"
    st.markdown(f'<div class="info-box">No cenário <b>{cen_sel}</b>, <b>{melhor["Estratégia"]}</b> '
        f'liderou com <b>{melhor["Retorno total (%)"]:.2f}%</b> (via {comp_m}). '
        f'{pior["Estratégia"]} ficou em último ({pior["Retorno total (%)"]:.2f}%).</div>', unsafe_allow_html=True)

    # Heatmap
    st.markdown("---")
    st.markdown("### Mapa de Calor: Estratégia x Cenário")
    hm_data = []
    for cn, cv in CENARIOS_CURVA.items():
        row = {"Cenário": cn}
        for en in nomes:
            c2 = montar_estrategia(en, curva, dur_alvo)
            r2 = simular_retorno_estrategia(c2, cv["curto"], cv["longo"], horiz)
            row[en] = r2["total"] / 10
        hm_data.append(row)
    df_hm = pd.DataFrame(hm_data).set_index("Cenário")
    fig_hm = go.Figure(go.Heatmap(
        z=df_hm.values, x=df_hm.columns, y=df_hm.index,
        colorscale=[[0,CORES["negativo"]],[0.5,"#FFFFCC"],[1,CORES["positivo"]]],
        text=[[f"{v:.2f}%" for v in r] for r in df_hm.values],
        texttemplate="%{text}", textfont=dict(size=12),
        hovertemplate="Cenário: %{y}<br>Estratégia: %{x}<br>Retorno: %{z:.2f}%<extra></extra>"))
    fig_hm.update_layout(**PLOTLY_LAYOUT, title="Retorno (%) por Estratégia x Cenário", height=380)
    st.plotly_chart(fig_hm, use_container_width=True, config=PLOTLY_CFG)

def render_riding():
    with st.expander("📘 Conceito — Riding the Yield Curve"):
        st.markdown("**Riding:** comprar título mais longo que o horizonte e vender antes do vencimento. "
                    "Se a curva é positivamente inclinada e estável, o título valoriza (rolldown). "
                    "Risco: se a curva sobe, o ganho pode ser anulado.")
    st.markdown("---")
    st.markdown("### Simulador de Rolldown")
    curva = obter_curva()
    c1,c2,c3 = st.columns(3)
    with c1: prazo_c = st.slider("Prazo título (anos)", 1.0, 10.0, 5.0, 0.5, key="rd_pr")
    with c2: horiz_rd = st.slider("Horizonte carry (meses)", 3, 24, 12, 3, key="rd_hor")
    with c3: desloc = st.slider("Deslocamento curva (bps)", -200, 200, 0, 10, key="rd_dsl")

    pa = curva["prazo_anos"].values
    tv = curva["taxa"].values
    tx_compra = float(np.interp(prazo_c, pa, tv))
    prazo_v = max(0.25, prazo_c - horiz_rd / 12)
    tx_venda_base = float(np.interp(prazo_v, pa, tv))
    tx_venda = tx_venda_base + desloc / 100

    du_c = int(prazo_c * 252)
    du_v = int(prazo_v * 252)
    pu_c = precificar_ltn(tx_compra / 100, du_c)
    pu_v = precificar_ltn(tx_venda / 100, du_v)
    ganho = pu_v - pu_c

    # Breakeven
    bk = []
    for d in range(-200, 201, 5):
        tx_d = tx_venda_base + d / 100
        pu_d = precificar_ltn(tx_d / 100, du_v)
        bk.append({"desloc": d, "resultado": pu_d - pu_c})
    df_bk = pd.DataFrame(bk)
    cross = df_bk[(df_bk["resultado"].shift(1) * df_bk["resultado"]) <= 0]
    be_bps = int(cross["desloc"].values[0]) if len(cross) > 0 else None

    fig_rd = go.Figure()
    fig_rd.add_trace(go.Scatter(x=curva["vertice"], y=curva["taxa"], mode="lines+markers",
        name="Curva original", line=dict(color=CORES["secundaria"], width=2)))
    if desloc != 0:
        fig_rd.add_trace(go.Scatter(x=curva["vertice"], y=curva["taxa"] + desloc / 100,
            mode="lines", name="Curva deslocada", line=dict(color=CORES["neutro"], width=1.5, dash="dash")))
    fig_rd.add_trace(go.Scatter(x=[f"{prazo_c:.0f}A"], y=[tx_compra], mode="markers",
        marker=dict(color=CORES["riding"], size=14), name="Compra"))
    fig_rd.add_trace(go.Scatter(x=[f"{prazo_v:.1f}A"], y=[tx_venda], mode="markers",
        marker=dict(color=CORES["positivo"], size=14, symbol="diamond"), name="Venda"))
    fig_rd.update_layout(**PLOTLY_LAYOUT, title="Riding the Yield Curve", height=400)
    st.plotly_chart(fig_rd, use_container_width=True, config=PLOTLY_CFG)

    c1,c2,c3,c4,c5 = st.columns(5)
    with c1: st.metric("Rolldown (bps)", f"{(tx_compra - tx_venda_base)*100:+.0f}")
    with c2: st.metric("Rolldown (R$/1000)", f"R$ {precificar_ltn(tx_venda_base/100,du_v)-pu_c:+.2f}")
    with c3: st.metric("Perda desloc.", f"R$ {ganho - (precificar_ltn(tx_venda_base/100,du_v)-pu_c):+.2f}")
    with c4: st.metric("Resultado líquido", f"R$ {ganho:+.2f}")
    with c5: st.metric("Breakeven", f"{be_bps} bps" if be_bps else "N/A")

    fig_be = go.Figure()
    fig_be.add_trace(go.Scatter(x=df_bk["desloc"], y=df_bk["resultado"], mode="lines",
        line=dict(color=CORES["riding"], width=2.5), fill="tozeroy",
        hovertemplate="Desloc: %{x} bps<br>R$ %{y:.2f}<extra></extra>"))
    fig_be.add_hline(y=0, line_dash="dot", line_color="gray")
    if be_bps:
        fig_be.add_vline(x=be_bps, line_dash="dash", line_color=CORES["negativo"],
                         annotation_text=f"Breakeven: {be_bps} bps")
    fig_be.update_layout(**PLOTLY_LAYOUT, title="Resultado vs. Deslocamento",
                         xaxis_title="Deslocamento (bps)", yaxis_title="R$/1000 face", height=350)
    st.plotly_chart(fig_be, use_container_width=True, config=PLOTLY_CFG)


# ============================================================================
#  MÓDULO 2 — RISCO DE TAXA DE JUROS
# ============================================================================
def render_mod2():
    st.markdown("## ⚠️ Risco de Taxa de Juros")
    st.markdown('<div class="info-box"><b>Pergunta gerencial:</b> "Qual a exposição da minha '
                'carteira? Onde está concentrado o risco? Estou dentro dos limites?"</div>',
                unsafe_allow_html=True)
    tab1, tab2, tab3 = st.tabs(["Fontes de Risco","DV01 e Métricas","Stress Test"])
    with tab1: render_fontes_risco()
    with tab2: render_metricas_risco()
    with tab3: render_stress_test()

def render_fontes_risco():
    with st.expander("📘 Fontes de Risco de Taxa"):
        st.markdown("""
| # | Fonte | Descrição | Métrica |
|---|---|---|---|
| 1 | **Nível** (parallel shift) | Toda a curva sobe/desce | Duration, DV01 |
| 2 | **Inclinação** (steepening/flattening) | Curto e longo se movem diferente | Key Rate Duration |
| 3 | **Curvatura** (butterfly) | Extremos vs. miolo | KRD por vértice |
| 4 | **Spread** | Prêmio de crédito muda | Spread duration |
| 5 | **Base** | Descasamento de indexadores | Hedge imperfeito |
""")
    st.markdown("---")
    st.markdown("### Anatomia dos Movimentos da Curva")
    curva = obter_curva()
    c1, c2 = st.columns(2)
    with c1:
        mov = st.selectbox("Tipo de movimento",
            ["Paralelo (nível)","Empinamento (steepening)","Achatamento (flattening)",
             "Butterfly (curvatura)","Combinado (personalizar)"], key="fr_mov")
    with c2:
        mag = st.slider("Magnitude (bps)", -200, 200, 100, 10, key="fr_mag")

    if mov == "Paralelo (nível)":
        choques = np.full(len(curva), mag)
    elif mov == "Empinamento (steepening)":
        choques = interpolar_choque(curva, mag * 0.3, mag)
    elif mov == "Achatamento (flattening)":
        choques = interpolar_choque(curva, mag, mag * 0.3)
    elif mov == "Butterfly (curvatura)":
        n = len(curva)
        mid = n // 2
        choques = np.array([mag if i < mid // 2 or i > mid + mid // 2 else -mag * 0.5 for i in range(n)])
    else:
        choques = interpolar_choque(curva, mag, mag)

    taxa_orig = curva["taxa"].values
    taxa_nova = taxa_orig + choques / 100

    fig = go.Figure()
    fig.add_trace(go.Scatter(x=curva["vertice"], y=taxa_orig, mode="lines+markers",
        name="Curva original", line=dict(color=CORES["secundaria"], width=2.5)))
    fig.add_trace(go.Scatter(x=curva["vertice"], y=taxa_nova, mode="lines+markers",
        name="Curva pós-choque", line=dict(color=CORES["negativo"], width=2, dash="dash")))
    # Área entre curvas
    fig.add_trace(go.Scatter(
        x=list(curva["vertice"]) + list(curva["vertice"])[::-1],
        y=list(taxa_orig) + list(taxa_nova)[::-1],
        fill="toself", fillcolor="rgba(204,51,51,0.15)", line=dict(width=0),
        showlegend=False, hoverinfo="skip"))
    fig.update_layout(**PLOTLY_LAYOUT, title=f"Movimento: {mov} ({mag:+d} bps)", height=400)
    st.plotly_chart(fig, use_container_width=True, config=PLOTLY_CFG)

    df_chq = pd.DataFrame({"Vértice": curva["vertice"], "Prazo": curva["prazo_anos"].apply(lambda x: f"{x:.1f}A"),
                            "Choque (bps)": choques.astype(int)})
    st.dataframe(df_chq, use_container_width=True, hide_index=True)

def render_metricas_risco():
    with st.expander("📘 Conceito — DV01, KRD e VaR"):
        st.latex(r"DV01 \approx -D^* \times PU \times 0{,}0001")
        st.markdown("**DV01:** perda (R$) se todas as taxas subirem 1 bp.")
        st.latex(r"KRD_k: \text{ DV01 parcial se apenas o vértice } k \text{ sobe 1 bp}")
        st.latex(r"VaR \approx DV01 \times \sigma_{taxa} \times z_\alpha \times \sqrt{t}")
    st.markdown("---")
    st.markdown("### Analisador de Risco de Carteira")

    modo = st.radio("Fonte da carteira", ["Carteira pré-configurada","Montar manualmente"], horizontal=True, key="mr_modo")
    if modo == "Carteira pré-configurada":
        cart_df = pd.DataFrame({
            "Título": ["LTN 1A","NTN-F 3A","LTN 5A","NTN-B 5A"],
            "PU": [888.49, 950.00, 730.00, 4200.00],
            "Quantidade": [50000, 30000, 20000, 5000],
            "Duration mod.": [0.88, 2.50, 4.42, 4.10],
            "Convexidade": [1.65, 8.50, 24.0, 21.0],
        })
    else:
        cart_df = pd.DataFrame({
            "Título": ["LTN 1A","NTN-F 3A","LTN 5A"],
            "PU": [888.49, 950.00, 730.00],
            "Quantidade": [50000, 30000, 20000],
            "Duration mod.": [0.88, 2.50, 4.42],
            "Convexidade": [1.65, 8.50, 24.0],
        })
        cart_df = st.data_editor(cart_df, num_rows="dynamic", key="mr_ed", use_container_width=True)

    c1, c2 = st.columns(2)
    with c1: lim_dv01 = st.number_input("Limite DV01 (R$)", value=50000, step=5000, key="mr_ldv")
    with c2: lim_dur = st.number_input("Duration máxima (anos)", value=4.0, step=0.5, key="mr_ldur")

    cart_df["Valor"] = cart_df["PU"] * cart_df["Quantidade"]
    total_val = cart_df["Valor"].sum()
    cart_df["Peso (%)"] = cart_df["Valor"] / total_val * 100
    cart_df["DV01"] = cart_df["Duration mod."] * cart_df["PU"] * cart_df["Quantidade"] * 0.0001
    dv01_total = cart_df["DV01"].sum()
    dur_media = (cart_df["Peso (%)"] / 100 * cart_df["Duration mod."]).sum()
    cart_df["Contrib. risco (%)"] = cart_df["DV01"] / dv01_total * 100
    # VaR simplificado
    sigma_taxa = 15  # bps/dia proxy
    var_95 = dv01_total * sigma_taxa * 1.645

    c1,c2,c3,c4 = st.columns(4)
    with c1: st.metric(f"{indicador_limite(dv01_total, lim_dv01)} DV01 total", fmt_brl(dv01_total))
    with c2: st.metric(f"{indicador_limite(dur_media, lim_dur)} Duration média", f"{dur_media:.2f} anos")
    with c3: st.metric("VaR 95% 1 dia", fmt_brl(var_95))
    with c4: st.metric("Valor total", fmt_brl(total_val))

    st.dataframe(cart_df[["Título","Peso (%)","Duration mod.","DV01","Contrib. risco (%)"]].style.format({
        "Peso (%)":"{:.1f}","Duration mod.":"{:.2f}","DV01":"R$ {:.0f}","Contrib. risco (%)":"{:.1f}"}),
        use_container_width=True, hide_index=True)

    # KRD por vértice (simplificação: distribuir DV01 pelo vértice mais próximo)
    curva = obter_curva()
    krd_vals = np.zeros(len(curva))
    for _, row in cart_df.iterrows():
        du_aprox = row["Duration mod."] * 252
        idx = np.argmin(np.abs(curva["prazo_du"].values - du_aprox))
        krd_vals[idx] += row["DV01"]
    fig_krd = go.Figure(go.Bar(
        x=curva["vertice"], y=krd_vals,
        marker_color=CORES["secundaria"], opacity=0.8,
        hovertemplate="%{x}: R$ %{y:,.0f}<extra></extra>"))
    fig_krd.update_layout(**PLOTLY_LAYOUT, title="Key Rate Durations (DV01 por vértice)",
                          yaxis_title="DV01 parcial (R$)", height=350)
    st.plotly_chart(fig_krd, use_container_width=True, config=PLOTLY_CFG)

    # Pizza de contribuição
    fig_pie = go.Figure(go.Pie(
        labels=cart_df["Título"], values=cart_df["DV01"], hole=0.5,
        hovertemplate="%{label}: R$ %{value:,.0f} (%{percent})<extra></extra>"))
    fig_pie.update_layout(**PLOTLY_LAYOUT, title="Contribuição ao DV01 total", height=350)
    st.plotly_chart(fig_pie, use_container_width=True, config=PLOTLY_CFG)

def render_stress_test():
    st.markdown("### Stress Test de Carteira")
    st.markdown("Usa a carteira configurada na aba anterior.")

    # Carteira simplificada
    titulos = [
        {"nome": "LTN 1A", "pu": 888.49, "qtd": 50000, "dur": 0.88, "conv": 1.65},
        {"nome": "NTN-F 3A", "pu": 950.00, "qtd": 30000, "dur": 2.50, "conv": 8.50},
        {"nome": "LTN 5A", "pu": 730.00, "qtd": 20000, "dur": 4.42, "conv": 24.0},
        {"nome": "NTN-B 5A", "pu": 4200.00, "qtd": 5000, "dur": 4.10, "conv": 21.0},
    ]
    cens_sel = st.multiselect("Cenários", list(CENARIOS_STRESS.keys()),
                              default=list(CENARIOS_STRESS.keys()), key="st_cens")

    resultados = []
    for cen_nome in cens_sel:
        cen = CENARIOS_STRESS[cen_nome]
        chq_medio = (cen["curto"] + cen["longo"]) / 2
        total_pl = 0
        pior_t = ""
        pior_v = 0
        melhor_t = ""
        melhor_v = 0
        for t in titulos:
            val = t["pu"] * t["qtd"]
            pl = aprox_duration_convexidade(val, t["dur"], t["conv"], chq_medio)
            total_pl += pl
            if pl < pior_v:
                pior_v = pl; pior_t = t["nome"]
            if pl > melhor_v:
                melhor_v = pl; melhor_t = t["nome"]
        val_total = sum(t["pu"] * t["qtd"] for t in titulos)
        resultados.append({"Cenário": cen_nome, "P&L (R$)": total_pl,
                           "P&L (%)": total_pl / val_total * 100,
                           "Pior título": pior_t, "Melhor título": melhor_t})
    df_st = pd.DataFrame(resultados)
    st.dataframe(df_st.style.format({"P&L (R$)":"R$ {:.0f}","P&L (%)":"{:+.2f}%"}).applymap(
        lambda v: "color: green" if isinstance(v, (int, float)) and v > 0 else
                  "color: red" if isinstance(v, (int, float)) and v < 0 else "",
        subset=["P&L (R$)","P&L (%)"]), use_container_width=True, hide_index=True)

    fig_st = go.Figure(go.Bar(
        y=df_st["Cenário"], x=df_st["P&L (R$)"], orientation="h",
        marker_color=[CORES["positivo"] if v > 0 else CORES["negativo"] for v in df_st["P&L (R$)"]],
        text=[fmt_brl(v) for v in df_st["P&L (R$)"]], textposition="outside",
        hovertemplate="%{y}: %{x:,.0f}<extra></extra>"))
    fig_st.update_layout(**PLOTLY_LAYOUT, title="Resultado por Cenário de Stress",
                         xaxis_title="P&L (R$)", height=350)
    st.plotly_chart(fig_st, use_container_width=True, config=PLOTLY_CFG)

    st.markdown(
        '<div class="info-box">O stress test é ferramenta regulatória obrigatória (ICAAP/IRRBB). '
        'A tesouraria deve demonstrar que a carteira resiste a cenários adversos. Se um cenário '
        'gera perda acima do limite, o gestor deve reduzir posição ou fazer hedge.</div>',
        unsafe_allow_html=True)


# ============================================================================
#  MÓDULO 3 — DURATION E CONVEXIDADE
# ============================================================================
def render_mod3():
    st.markdown("## 📐 Duration e Convexidade")
    st.markdown('<div class="info-box"><b>Pergunta gerencial:</b> "Quanto minha carteira perde se '
                'a taxa subir 100 bps? E 200 bps? A duration basta ou preciso da convexidade?"</div>',
                unsafe_allow_html=True)
    tab1, tab2 = st.tabs(["Calculadora de Duration","Convexidade — Correção de 2a Ordem"])
    with tab1: render_calculadora_duration()
    with tab2: render_convexidade()

def render_calculadora_duration():
    with st.expander("📘 Duration em 3 Níveis"):
        st.markdown("**1. Intuição:** prazo médio ponderado dos fluxos de caixa")
        st.latex(r"D = \frac{1}{PU} \sum_{k=1}^{n} t_k \times VP(C_k)")
        st.markdown("**2. Sensibilidade:**")
        st.latex(r"\frac{\Delta PU}{PU} \approx -D^* \times \Delta i")
        st.markdown("**3. Duration modificada:**")
        st.latex(r"D^* = \frac{D}{1 + y}")
    st.markdown("---")
    st.markdown("### Duration de Título Individual")
    c1, c2, c3 = st.columns(3)
    with c1:
        tipo = st.selectbox("Tipo", ["LTN (zero cupom)","NTN-F (pre com cupom)",
            "NTN-B (IPCA + cupom)","CDB prefixado","Debenture (CDI+spread)"], key="dc_tipo")
    with c2:
        taxa_dc = st.number_input("Taxa (% a.a.)", value=12.50, step=0.25, key="dc_tx")
    with c3:
        prazo_dc = st.number_input("Prazo (anos)", value=3.0, step=0.5, key="dc_pr")

    cupom_aa = 0.0
    if "NTN-F" in tipo: cupom_aa = 10.0
    elif "NTN-B" in tipo: cupom_aa = 6.0
    elif "Debenture" in tipo: cupom_aa = 8.0
    cupom_dc = st.number_input("Cupom (% a.a.)", value=cupom_aa, step=1.0, key="dc_cup")

    du = int(prazo_dc * 252)
    if "zero" in tipo.lower() or cupom_dc == 0:
        r = duration_zero_cupom(taxa_dc / 100, du)
    else:
        r = precificar_titulo_cupom(taxa_dc / 100, du, cupom_dc / 100)

    c1,c2,c3,c4 = st.columns(4)
    with c1: st.metric("Duration Macaulay", f"{r['duration']:.2f} anos")
    with c2: st.metric("Duration modificada", f"{r['dur_mod']:.4f}")
    with c3: st.metric("DV01/R$1.000", f"R$ {dv01(r['dur_mod'], r['pu']):.4f}")
    with c4: st.metric("Convexidade", f"{r['convexidade']:.2f}")

    # Comparação rápida com LTN
    st.markdown("#### 🔄 Comparação rápida")
    r_zc = duration_zero_cupom(taxa_dc / 100, du)
    diff = r_zc["duration"] - r["duration"]
    st.markdown(f"LTN de {prazo_dc:.0f} anos: duration = **{r_zc['duration']:.2f}**. "
                f"Título selecionado: duration = **{r['duration']:.2f}**. "
                f"Os cupons reduzem a duration em **{diff:.2f} anos**.")

    # Duration de Carteira
    st.markdown("---")
    st.markdown("### Duration de Carteira")
    cart_df = pd.DataFrame({
        "Título": ["LTN 1A","NTN-F 3A","LTN 5A"],
        "PU": [888.49, 950.00, 730.00],
        "Quantidade": [50000, 30000, 20000],
        "Duration mod.": [0.88, 2.50, 4.42],
    })
    cart_df = st.data_editor(cart_df, num_rows="dynamic", key="dc_cart", use_container_width=True)
    if len(cart_df) > 0:
        cart_df["Valor"] = cart_df["PU"] * cart_df["Quantidade"]
        total = cart_df["Valor"].sum()
        cart_df["Peso"] = cart_df["Valor"] / total
        dur_cart = (cart_df["Peso"] * cart_df["Duration mod."]).sum()
        dv01_cart = (cart_df["Duration mod."] * cart_df["PU"] * cart_df["Quantidade"] * 0.0001).sum()

        c1, c2 = st.columns(2)
        with c1: st.metric("Duration média ponderada", f"{dur_cart:.2f} anos")
        with c2: st.metric("DV01 total", fmt_brl(dv01_cart))

        # Contribuição empilhada
        cart_df["Contrib"] = cart_df["Peso"] * cart_df["Duration mod."]
        fig_cb = go.Figure(go.Bar(
            x=cart_df["Título"], y=cart_df["Contrib"],
            marker_color=CORES["secundaria"],
            text=[f"{c:.2f}" for c in cart_df["Contrib"]], textposition="outside"))
        fig_cb.update_layout(**PLOTLY_LAYOUT, title="Contribuição à Duration",
                             yaxis_title="w_i x D*_i", height=300)
        st.plotly_chart(fig_cb, use_container_width=True, config=PLOTLY_CFG)

def render_convexidade():
    with st.expander("📘 Convexidade — O Conceito"):
        st.markdown("A curva taxa-preço é **convexa**: quando a taxa cai, o preço sobe "
                    "*mais* do que a duration prevê; quando sobe, cai *menos*.")
        st.latex(r"\frac{\Delta PU}{PU} \approx -D^* \times \Delta i + \frac{1}{2} \times C \times (\Delta i)^2")
        st.markdown("O termo de convexidade $\\frac{1}{2} C (\\Delta i)^2$ é **sempre positivo**. "
                    "Entre dois títulos com mesma duration, prefira o de maior convexidade.")
    st.markdown("---")

    # === VISUALIZADOR PRINCIPAL — O momento pedagógico ===
    st.markdown("### Visualizador de Convexidade")
    c1, c2 = st.columns(2)
    with c1:
        titulo_cv = st.selectbox("Título",
            ["LTN 1A","LTN 3A","LTN 5A","NTN-F 3A","NTN-F 5A","NTN-B 5A","NTN-B 10A"], key="cv_tit")
    with c2:
        choque_cv = st.slider("Choque de taxa (bps)", -300, 300, 0, 10, key="cv_chq",
                               help="Mova o slider e observe as tres curvas")

    # Parâmetros do título selecionado
    params = {
        "LTN 1A": (12.50, 252, 0), "LTN 3A": (12.70, 756, 0), "LTN 5A": (12.50, 1260, 0),
        "NTN-F 3A": (12.80, 756, 10), "NTN-F 5A": (12.50, 1260, 10),
        "NTN-B 5A": (6.20, 1260, 6), "NTN-B 10A": (6.00, 2520, 6),
    }
    tx0, du0, cup0 = params[titulo_cv]

    if cup0 == 0:
        r0 = duration_zero_cupom(tx0 / 100, du0)
    else:
        r0 = precificar_titulo_cupom(tx0 / 100, du0, cup0 / 100)
    pu0 = r0["pu"]
    dm = r0["dur_mod"]
    cv = r0["convexidade"]

    # Vetorizado para performance
    taxas_range = np.linspace(tx0 - 3, tx0 + 3, 200)
    pu_real = np.array([
        precificar_ltn(t / 100, du0) if cup0 == 0
        else precificar_titulo_cupom(t / 100, du0, cup0 / 100)["pu"]
        for t in taxas_range])
    # Aproximações
    delta_i = (taxas_range - tx0) / 100
    pu_duration = pu0 + (-dm * pu0 * delta_i)
    pu_dur_conv = pu0 + (-dm * pu0 * delta_i + 0.5 * cv * pu0 * delta_i ** 2)

    # PU no ponto de choque
    tx_choque = tx0 + choque_cv / 100
    if cup0 == 0:
        pu_chq_real = precificar_ltn(tx_choque / 100, du0)
    else:
        pu_chq_real = precificar_titulo_cupom(tx_choque / 100, du0, cup0 / 100)["pu"]
    pu_chq_dur = pu0 + aprox_duration(pu0, dm, choque_cv)
    pu_chq_dc = pu0 + aprox_duration_convexidade(pu0, dm, cv, choque_cv)
    erro_dur = pu_chq_dur - pu_chq_real
    erro_dc = pu_chq_dc - pu_chq_real

    fig_cv = go.Figure()
    fig_cv.add_trace(go.Scatter(x=taxas_range, y=pu_real, mode="lines",
        name="Curva real", line=dict(color=CORES["secundaria"], width=3)))
    fig_cv.add_trace(go.Scatter(x=taxas_range, y=pu_duration, mode="lines",
        name="Aprox. duration (tangente)", line=dict(color=CORES["accent"], width=2, dash="dash")))
    fig_cv.add_trace(go.Scatter(x=taxas_range, y=pu_dur_conv, mode="lines",
        name="Aprox. duration + convexidade", line=dict(color=CORES["positivo"], width=2, dash="dot")))
    # Ponto atual
    fig_cv.add_trace(go.Scatter(x=[tx0], y=[pu0], mode="markers",
        marker=dict(color=CORES["primaria"], size=12), name="Ponto atual"))
    # Ponto choque
    if choque_cv != 0:
        fig_cv.add_trace(go.Scatter(x=[tx_choque], y=[pu_chq_real], mode="markers",
            marker=dict(color=CORES["negativo"], size=10, symbol="diamond"), name="PU real (choque)"))
        fig_cv.add_annotation(x=tx_choque, y=pu_chq_dur,
            text=f"Erro D: R$ {erro_dur:+.2f}", showarrow=True, arrowhead=2,
            font=dict(color=CORES["accent"], size=11))
        fig_cv.add_annotation(x=tx_choque, y=pu_chq_dc,
            text=f"Erro D+C: R$ {erro_dc:+.2f}", showarrow=True, arrowhead=2,
            font=dict(color=CORES["positivo"], size=11), ay=-30)
    fig_cv.update_layout(**PLOTLY_LAYOUT,
        title=f"Convexidade: {titulo_cv} (D*={dm:.2f}, C={cv:.2f})",
        xaxis_title="Taxa (% a.a.)", yaxis_title="PU (R$)", height=500)
    st.plotly_chart(fig_cv, use_container_width=True, config=PLOTLY_CFG)

    c1,c2,c3,c4,c5 = st.columns(5)
    with c1: st.metric("PU real", f"R$ {pu_chq_real:.2f}")
    with c2: st.metric("PU (duration)", f"R$ {pu_chq_dur:.2f}")
    with c3: st.metric("PU (D+C)", f"R$ {pu_chq_dc:.2f}")
    with c4: st.metric("Erro duration", f"R$ {erro_dur:+.2f}")
    with c5: st.metric("Erro D+C", f"R$ {erro_dc:+.2f}")

    # Tabela de choques
    st.markdown("#### Tabela Comparativa de Choques")
    rows = []
    for chq in range(-250, 251, 50):
        if chq == 0: continue
        txc = tx0 + chq / 100
        if cup0 == 0:
            pu_r = precificar_ltn(txc / 100, du0)
        else:
            pu_r = precificar_titulo_cupom(txc / 100, du0, cup0 / 100)["pu"]
        pu_d = pu0 + aprox_duration(pu0, dm, chq)
        pu_dc2 = pu0 + aprox_duration_convexidade(pu0, dm, cv, chq)
        rows.append({"Choque (bps)": chq, "PU real": pu_r, "PU (duration)": pu_d,
                     "Erro D (R$)": pu_d - pu_r, "PU (D+C)": pu_dc2, "Erro D+C (R$)": pu_dc2 - pu_r})
    st.dataframe(pd.DataFrame(rows).style.format({
        "PU real":"R$ {:.2f}","PU (duration)":"R$ {:.2f}","Erro D (R$)":"{:+.2f}",
        "PU (D+C)":"R$ {:.2f}","Erro D+C (R$)":"{:+.2f}"}),
        use_container_width=True, hide_index=True)

    # === BULLET VS BARBELL ===
    st.markdown("---")
    st.markdown("### Convexidade: Bullet vs. Barbell")
    dur_bb = st.slider("Duration alvo (anos)", 2.0, 6.0, 3.0, 0.5, key="bb_dur")
    curva = obter_curva()
    cart_bul = montar_bullet(curva, dur_bb)
    cart_bar = montar_barbell(curva, dur_bb)
    m_bul = calcular_metricas_carteira(cart_bul)
    m_bar = calcular_metricas_carteira(cart_bar)

    # Resultados sob choques simétricos
    choques_sim = [-200, -100, 100, 200]
    r_bul = {c: simular_retorno_estrategia(cart_bul, c, c, 12)["total"]/10 for c in choques_sim}
    r_bar = {c: simular_retorno_estrategia(cart_bar, c, c, 12)["total"]/10 for c in choques_sim}

    comp_df = pd.DataFrame({
        "Métrica": ["Duration","Convexidade",
                    "Resultado +200 bps","Resultado -200 bps",
                    "Resultado +100 bps","Resultado -100 bps"],
        "Bullet": [m_bul["duration"], m_bul["convexidade"],
                   r_bul[200], r_bul[-200], r_bul[100], r_bul[-100]],
        "Barbell": [m_bar["duration"], m_bar["convexidade"],
                    r_bar[200], r_bar[-200], r_bar[100], r_bar[-100]],
    })
    comp_df["Diferença"] = comp_df["Barbell"] - comp_df["Bullet"]
    st.dataframe(comp_df.style.format({"Bullet":"{:.2f}","Barbell":"{:.2f}","Diferença":"{:+.2f}"}),
                 use_container_width=True, hide_index=True)

    # Gráfico sobreposição
    choques_range = np.arange(-300, 301, 25)
    ret_bul = [simular_retorno_estrategia(cart_bul, c, c, 12)["total"]/10 for c in choques_range]
    ret_bar = [simular_retorno_estrategia(cart_bar, c, c, 12)["total"]/10 for c in choques_range]
    fig_bb = go.Figure()
    fig_bb.add_trace(go.Scatter(x=choques_range, y=ret_bul, mode="lines",
        name="Bullet", line=dict(color=CORES["bullet"], width=2.5)))
    fig_bb.add_trace(go.Scatter(x=choques_range, y=ret_bar, mode="lines",
        name="Barbell", line=dict(color=CORES["barbell"], width=2.5)))
    fig_bb.add_hline(y=0, line_dash="dot", line_color="gray")
    fig_bb.update_layout(**PLOTLY_LAYOUT, title="Retorno: Bullet vs. Barbell (mesma duration)",
                         xaxis_title="Choque paralelo (bps)", yaxis_title="Retorno (%)", height=400)
    st.plotly_chart(fig_bb, use_container_width=True, config=PLOTLY_CFG)

    st.markdown(
        '<div class="info-box">A convexidade é um "bônus": entre duas carteiras com mesma duration, '
        'a de maior convexidade terá melhor resultado para choques grandes, em qualquer direção. '
        'Na prática, o mercado cobra por isso — títulos de maior convexidade negociam com yield '
        'ligeiramente menor (prêmio de convexidade negativo).</div>', unsafe_allow_html=True)


# ============================================================================
#  MÓDULO 4 — IMUNIZAÇÃO
# ============================================================================
def render_mod4():
    st.markdown("## 🛡️ Imunização")
    st.markdown('<div class="info-box"><b>Pergunta gerencial:</b> "Como garantir que minha carteira '
                'cubra uma obrigação futura independentemente do que aconteça com os juros?"</div>',
                unsafe_allow_html=True)
    tab1, tab2, tab3 = st.tabs(["Construindo Carteira Imunizada","Verificação","Duration Drift"])
    with tab1: render_imunizacao_construtor()
    with tab2: render_imunizacao_verificacao()
    with tab3: render_duration_drift()

def render_imunizacao_construtor():
    with st.expander("📘 Imunização — O Conceito"):
        st.markdown("**Problema:** garantir valor futuro independente das taxas.")
        st.markdown("**Solução:** casar duration da carteira com o horizonte.")
        st.latex(r"\text{Quando taxa sobe: } \underbrace{PU \downarrow}_{\text{perda de capital}} + \underbrace{\text{reinv.} \uparrow}_{\text{ganho}} \approx 0")
        st.markdown("**Condições:** (1) VP carteira = VP obrigação, (2) Duration = prazo, (3) Convexidade carteira >= convexidade obrigação.")
    st.markdown("---")
    st.markdown("### Construtor de Carteira Imunizada")
    c1, c2 = st.columns(2)
    with c1:
        st.markdown("**Obrigação a cobrir**")
        vf_obrig = st.number_input("Valor futuro (R$)", value=10_000_000, step=1_000_000, key="im_vf")
        prazo_obrig = st.number_input("Prazo (anos)", value=3.0, step=0.5, key="im_pr")
    with c2:
        st.markdown("**Instrumentos**")
        tit_curto = st.selectbox("Título curto", ["LTN 1A","LTN 2A","CDB pré 1A"], key="im_tc")
        tit_longo = st.selectbox("Título longo", ["NTN-F 5A","NTN-F 7A","LTN 5A"], key="im_tl")

    c1, c2 = st.columns(2)
    with c1: tx_curto = st.number_input("Taxa curto (% a.a.)", value=12.00, step=0.25, key="im_txc")
    with c2: tx_longo = st.number_input("Taxa longo (% a.a.)", value=13.00, step=0.25, key="im_txl")

    # Durations
    params_t = {"LTN 1A": 252, "LTN 2A": 504, "CDB pré 1A": 252,
                "NTN-F 5A": 1260, "NTN-F 7A": 1764, "LTN 5A": 1260}
    du_c = params_t.get(tit_curto, 252)
    du_l = params_t.get(tit_longo, 1260)
    cup_c = 0.10 if "NTN-F" in tit_curto else 0
    cup_l = 0.10 if "NTN-F" in tit_longo else 0

    if cup_c == 0:
        r_c = duration_zero_cupom(tx_curto / 100, du_c)
    else:
        r_c = precificar_titulo_cupom(tx_curto / 100, du_c, cup_c)
    if cup_l == 0:
        r_l = duration_zero_cupom(tx_longo / 100, du_l)
    else:
        r_l = precificar_titulo_cupom(tx_longo / 100, du_l, cup_l)

    d_c = r_c["dur_mod"]
    d_l = r_l["dur_mod"]

    # Pesos
    w_c, w_l = calcular_pesos_imunizacao(prazo_obrig, d_c, d_l)

    # VP da obrigação
    taxa_media = (tx_curto + tx_longo) / 2 / 100
    vp_obrig = vf_obrig / (1 + taxa_media) ** prazo_obrig
    inv_c = vp_obrig * w_c
    inv_l = vp_obrig * w_l

    # Duration verificação
    dur_cart = w_c * d_c + w_l * d_l
    conv_cart = w_c * r_c["convexidade"] + w_l * r_l["convexidade"]

    # Passo a passo (visível, não em expander)
    st.markdown("#### Passo a passo")
    st.markdown(f"**Passo 1 — Durations:** {tit_curto}: D* = {d_c:.2f} anos. {tit_longo}: D* = {d_l:.2f} anos.")
    st.markdown(f"**Passo 2 — Proporções:**")
    st.latex(r"w_1 \times D_1^* + w_2 \times D_2^* = " + f"{prazo_obrig:.1f}" +
             r",\quad w_1 + w_2 = 1")
    st.markdown(f"Resolvendo: **w₁ = {w_c*100:.1f}%**, **w₂ = {w_l*100:.1f}%**")
    st.markdown(f"**Passo 3 — Valores:**")
    st.latex(r"VP = \frac{" + f"{vf_obrig/1e6:.1f}" + r"\text{ mi}}{(1+" + f"{taxa_media:.4f}" +
             r")^{" + f"{prazo_obrig:.1f}" + r"}} = " + f"R\\$ {vp_obrig/1e6:.2f}" + r"\text{ mi}")
    st.markdown(f"Investir **{fmt_brl(inv_c)}** no curto e **{fmt_brl(inv_l)}** no longo.")
    st.markdown(f"**Passo 4 — Verificação:** Duration carteira = {dur_cart:.2f} "
                f"{'✅' if abs(dur_cart - prazo_obrig) < 0.1 else '⚠️'} | "
                f"VP = {fmt_brl(vp_obrig)} ✅ | Convexidade = {conv_cart:.2f} ✅")

    # Donut
    fig_d = go.Figure(go.Pie(
        labels=[tit_curto, tit_longo], values=[inv_c, inv_l], hole=0.5,
        marker=dict(colors=[CORES["secundaria"], CORES["accent"]]),
        textinfo="label+value", texttemplate="%{label}<br>%{value:,.0f}"))
    fig_d.update_layout(**PLOTLY_LAYOUT, title="Composição da Carteira Imunizada", height=350)
    st.plotly_chart(fig_d, use_container_width=True, config=PLOTLY_CFG)

    # Salvar em session_state para verificação
    st.session_state["imun"] = {
        "vp": vp_obrig, "vf": vf_obrig, "horizonte": prazo_obrig,
        "w_c": w_c, "w_l": w_l, "d_c": d_c, "d_l": d_l,
        "tx_c": tx_curto / 100, "tx_l": tx_longo / 100,
        "tit_c": tit_curto, "tit_l": tit_longo, "conv": conv_cart,
    }

def render_imunizacao_verificacao():
    st.markdown("### A Imunização Funciona? — Verificação")
    im = st.session_state.get("imun")
    if not im:
        st.info("Configure a carteira imunizada na aba anterior.")
        # Defaults
        im = {"vp": 7_000_000, "vf": 10_000_000, "horizonte": 3.0,
              "w_c": 0.4, "w_l": 0.6, "d_c": 0.88, "d_l": 4.42,
              "tx_c": 0.12, "tx_l": 0.13, "tit_c": "LTN 1A", "tit_l": "LTN 5A", "conv": 12.0}

    choque_ver = st.slider("Choque de taxa imediato (bps)", -300, 300, 0, 25, key="ver_chq")

    # Simular 3 carteiras
    choques_range = np.arange(-300, 301, 25)
    vals_imun = []
    vals_curto = []
    vals_longo = []
    for chq in choques_range:
        # Imunizada
        r_im = simular_imunizacao(0, 0, im["d_c"], im["d_l"], im["tx_c"], im["tx_l"],
                                  im["w_c"], im["vp"], im["horizonte"], chq)
        vals_imun.append(r_im["valor_final"])
        # Só curto
        r_sc = simular_imunizacao(0, 0, im["d_c"], im["d_c"], im["tx_c"], im["tx_c"],
                                  1.0, im["vp"], im["horizonte"], chq)
        vals_curto.append(r_sc["valor_final"])
        # Só longo
        r_sl = simular_imunizacao(0, 0, im["d_l"], im["d_l"], im["tx_l"], im["tx_l"],
                                  1.0, im["vp"], im["horizonte"], chq)
        vals_longo.append(r_sl["valor_final"])

    fig_ver = go.Figure()
    fig_ver.add_trace(go.Scatter(x=choques_range, y=vals_imun, mode="lines",
        name="Carteira imunizada", line=dict(color=CORES["positivo"], width=3)))
    fig_ver.add_trace(go.Scatter(x=choques_range, y=vals_curto, mode="lines",
        name=f"Só {im['tit_c']}", line=dict(color=CORES["secundaria"], width=2, dash="dash")))
    fig_ver.add_trace(go.Scatter(x=choques_range, y=vals_longo, mode="lines",
        name=f"Só {im['tit_l']}", line=dict(color=CORES["accent"], width=2, dash="dash")))
    fig_ver.add_hline(y=im["vf"], line_dash="dot", line_color=CORES["neutro"],
                      annotation_text="Valor-alvo")
    fig_ver.add_vline(x=choque_ver, line_dash="dot", line_color="gray", opacity=0.5)
    fig_ver.update_layout(**PLOTLY_LAYOUT,
        title="Valor Acumulado no Horizonte vs. Choque de Taxa",
        xaxis_title="Choque (bps)", yaxis_title="Valor acumulado (R$)", height=450)
    st.plotly_chart(fig_ver, use_container_width=True, config=PLOTLY_CFG)

    # Tabela para choque selecionado
    r_im_sel = simular_imunizacao(0, 0, im["d_c"], im["d_l"], im["tx_c"], im["tx_l"],
                                  im["w_c"], im["vp"], im["horizonte"], choque_ver)
    r_sc_sel = simular_imunizacao(0, 0, im["d_c"], im["d_c"], im["tx_c"], im["tx_c"],
                                  1.0, im["vp"], im["horizonte"], choque_ver)
    r_sl_sel = simular_imunizacao(0, 0, im["d_l"], im["d_l"], im["tx_l"], im["tx_l"],
                                  1.0, im["vp"], im["horizonte"], choque_ver)
    comp = pd.DataFrame([
        {"Carteira": "Imunizada", "Valor acum.": r_im_sel["valor_final"],
         "Diff vs alvo": r_im_sel["valor_final"] - im["vf"],
         "Desvio (%)": (r_im_sel["valor_final"] - im["vf"]) / im["vf"] * 100},
        {"Carteira": f"Só {im['tit_c']}", "Valor acum.": r_sc_sel["valor_final"],
         "Diff vs alvo": r_sc_sel["valor_final"] - im["vf"],
         "Desvio (%)": (r_sc_sel["valor_final"] - im["vf"]) / im["vf"] * 100},
        {"Carteira": f"Só {im['tit_l']}", "Valor acum.": r_sl_sel["valor_final"],
         "Diff vs alvo": r_sl_sel["valor_final"] - im["vf"],
         "Desvio (%)": (r_sl_sel["valor_final"] - im["vf"]) / im["vf"] * 100},
    ])
    st.dataframe(comp.style.format({"Valor acum.":"R$ {:.0f}","Diff vs alvo":"R$ {:+.0f}",
                                     "Desvio (%)":"{:+.2f}%"}), use_container_width=True, hide_index=True)

    with st.expander("📐 Por que funciona?"):
        st.markdown(f"Para o choque de **{choque_ver} bps**:")
        st.markdown(f"- Efeito preço (MtM): **{fmt_brl(r_im_sel['mtm'])}**")
        st.markdown(f"- Efeito reinvestimento: **{fmt_brl(r_im_sel['reinv'])}**")
        st.markdown(f"- Efeito líquido: **{fmt_brl(r_im_sel['mtm'] + r_im_sel['reinv'])}** ≈ 0")
        st.markdown("Os dois efeitos se compensam porque a duration da carteira é igual ao horizonte.")

def render_duration_drift():
    with st.expander("📘 Duration Drift"):
        st.markdown("Com o tempo, a duration de cada título diminui. O horizonte também encurta. "
                    "Mas nem sempre no mesmo ritmo — gerando descasamento.")
        st.markdown("**Regra prática:** rebalancear a cada 3-6 meses ou quando descasamento > ±0,25 anos.")
    st.markdown("---")
    st.markdown("### Simulador de Duration Drift")
    im = st.session_state.get("imun", {"horizonte": 3.0, "w_c": 0.4, "w_l": 0.6,
                                        "d_c": 0.88, "d_l": 4.42})
    dur_cart_0 = im["w_c"] * im["d_c"] + im["w_l"] * im["d_l"]
    horiz_0 = im["horizonte"]

    meses_dec = st.slider("Meses decorridos", 0, 36, 0, 3, key="dd_m")
    # Calcular série
    meses_all = list(range(0, 37, 3))
    durs = []
    horizs = []
    for m in meses_all:
        dd = duration_drift(dur_cart_0, horiz_0, m)
        durs.append(dd["dur_atual"])
        horizs.append(dd["horiz_rem"])

    dd_sel = duration_drift(dur_cart_0, horiz_0, meses_dec)

    fig_dd = go.Figure()
    fig_dd.add_trace(go.Scatter(x=meses_all, y=durs, mode="lines+markers",
        name="Duration carteira", line=dict(color=CORES["secundaria"], width=2.5)))
    fig_dd.add_trace(go.Scatter(x=meses_all, y=horizs, mode="lines+markers",
        name="Horizonte remanescente", line=dict(color=CORES["accent"], width=2, dash="dash")))
    # Área entre
    colors_fill = []
    for d, h in zip(durs, horizs):
        gap = abs(d - h)
        if gap < 0.25: colors_fill.append("rgba(46,139,87,0.2)")
        elif gap < 0.5: colors_fill.append("rgba(212,160,18,0.2)")
        else: colors_fill.append("rgba(204,51,51,0.2)")
    fig_dd.add_trace(go.Scatter(
        x=meses_all + meses_all[::-1],
        y=durs + horizs[::-1],
        fill="toself", fillcolor="rgba(46,139,87,0.1)", line=dict(width=0),
        showlegend=False))
    fig_dd.add_vline(x=meses_dec, line_dash="dot", line_color="gray")
    fig_dd.update_layout(**PLOTLY_LAYOUT, title="Duration Drift ao Longo do Tempo",
                         xaxis_title="Meses decorridos", yaxis_title="Anos", height=400)
    st.plotly_chart(fig_dd, use_container_width=True, config=PLOTLY_CFG)

    c1,c2,c3,c4 = st.columns(4)
    with c1: st.metric("Duration atual", f"{dd_sel['dur_atual']:.2f} anos")
    with c2: st.metric("Horizonte rem.", f"{dd_sel['horiz_rem']:.2f} anos")
    with c3: st.metric("Descasamento", f"{dd_sel['descasamento']:+.2f} anos")
    status_map = {"ok": "✅ OK", "atencao": "⚠️ Rebalancear", "fora": "❌ Fora do limite"}
    with c4: st.metric("Status", status_map.get(dd_sel["status"], "?"))

    st.markdown(
        '<div class="info-box">Na prática, a tesouraria define limite de descasamento (±0,25 anos). '
        'Quando ultrapassado, rebalancear: vender parte da posição longa e comprar curta '
        '(ou vice-versa) para realinhar duration com horizonte.</div>', unsafe_allow_html=True)


# ============================================================================
#  EXERCÍCIO INTEGRADOR — GESTOR POR UM DIA
# ============================================================================
def render_integrador():
    st.markdown("## 🎯 Exercício Integrador — Gestor de Carteira por um Dia")
    st.markdown('<div class="info-box"><b>Pergunta gerencial:</b> "Tenho R$ 100 milhões, limites '
                'de risco definidos e uma obrigação de funding. Como monto a carteira?"</div>',
                unsafe_allow_html=True)

    # --- SEÇÃO 1: BRIEFING ---
    st.markdown("### 📋 Briefing do Gestor")
    caso_sel = st.selectbox("Cenário", list(CASOS_INTEGRADOR.keys()), key="ig_caso")
    caso = CASOS_INTEGRADOR[caso_sel]

    c1,c2,c3,c4 = st.columns(4)
    with c1: st.metric("Volume", fmt_brl(caso["volume"]))
    with c2: st.metric("Limite DV01", fmt_brl(caso["dv01_lim"]))
    with c3: st.metric("Duration máx.", f"{caso['dur_max']:.1f} anos")
    with c4: st.metric("Funding", f"{fmt_brl(caso['funding_vf'])} em {caso['funding_prazo']:.0f}A")

    st.markdown(f'<div class="info-box">📌 <b>Cenário macro:</b> {caso["descricao"]}</div>',
                unsafe_allow_html=True)

    vol_livre = caso["volume"] - caso["funding_vf"]
    vol_imun = caso["funding_vf"]

    # --- SEÇÃO 2: ESTRATÉGIA ---
    st.markdown("---")
    st.markdown("### 1️⃣ Escolha Sua Estratégia")
    estrat_ig = st.selectbox("Estratégia principal (R$ 70M livres)",
                             list(COR_ESTRAT.keys()), key="ig_est")
    justif = st.text_area("Justificativa (opcional)", key="ig_just",
                          placeholder="Ex.: Espero corte de 200 bps em 12 meses...")

    # --- SEÇÃO 3: SELEÇÃO ---
    st.markdown("---")
    st.markdown("### 2️⃣ Monte Sua Carteira")

    c1, c2 = st.columns(2)
    with c1:
        st.markdown(f"**Carteira imunizada ({fmt_brl(vol_imun)})** — cobrir funding em {caso['funding_prazo']:.0f} anos")
        ig_tc = st.selectbox("Título curto", ["LTN 6M","LTN 1A","CDB pré 1A"], key="ig_tc")
        ig_tl = st.selectbox("Título longo", ["LTN 3A","NTN-F 5A","LTN 5A"], key="ig_tl")
        # Calcular pesos automaticamente
        params_ig = {"LTN 6M": (0.5, 13.25), "LTN 1A": (1.0, 13.00), "CDB pré 1A": (0.88, 13.50),
                     "LTN 3A": (2.65, 12.70), "NTN-F 5A": (4.3, 12.50), "LTN 5A": (4.42, 12.50)}
        dc_ig = params_ig.get(ig_tc, (1.0, 13.0))[0]
        dl_ig = params_ig.get(ig_tl, (4.0, 12.5))[0]
        wc_ig, wl_ig = calcular_pesos_imunizacao(caso["funding_prazo"], dc_ig, dl_ig)
        st.markdown(f"Duration curto: {dc_ig:.2f} | Duration longo: {dl_ig:.2f}")
        st.markdown(f"**Pesos:** {wc_ig*100:.1f}% curto, {wl_ig*100:.1f}% longo")

    with c2:
        st.markdown(f"**Carteira direcional ({fmt_brl(vol_livre)})** — estratégia {estrat_ig}")
        tit_disp = carregar_titulos_disponiveis()
        aloc_df = pd.DataFrame({
            "Título": tit_disp["titulo"].tolist(),
            "Taxa (%)": tit_disp["taxa"].tolist(),
            "Duration": tit_disp["duration"].tolist(),
            "Alocação (R$)": [0] * len(tit_disp),
        })
        aloc_df = st.data_editor(aloc_df, key="ig_aloc", use_container_width=True)
        soma_aloc = aloc_df["Alocação (R$)"].sum()
        if soma_aloc > 0 and soma_aloc != vol_livre:
            st.warning(f"Soma: {fmt_brl(soma_aloc)} (alvo: {fmt_brl(vol_livre)})")

    # --- SEÇÃO 4: DASHBOARD ---
    st.markdown("---")
    st.markdown("### 3️⃣ Dashboard da Carteira")

    # Imunizada
    inv_c_ig = vol_imun * wc_ig
    inv_l_ig = vol_imun * wl_ig
    dv01_imun = (dc_ig * inv_c_ig + dl_ig * inv_l_ig) * 0.0001
    dur_imun = wc_ig * dc_ig + wl_ig * dl_ig

    # Direcional
    aloc_ativ = aloc_df[aloc_df["Alocação (R$)"] > 0]
    if len(aloc_ativ) > 0:
        total_dir = aloc_ativ["Alocação (R$)"].sum()
        pesos_dir = aloc_ativ["Alocação (R$)"] / total_dir if total_dir > 0 else 0
        dur_dir = (pesos_dir * aloc_ativ["Duration"]).sum()
        dv01_dir = (aloc_ativ["Duration"] * aloc_ativ["Alocação (R$)"] * 0.0001).sum()
    else:
        dur_dir = 0
        dv01_dir = 0
        total_dir = 0

    dv01_total = dv01_imun + dv01_dir
    dur_total = (vol_imun * dur_imun + total_dir * dur_dir) / (vol_imun + total_dir) if (vol_imun + total_dir) > 0 else 0
    max_conc = max(vol_imun, total_dir) / caso["volume"] * 100 if caso["volume"] > 0 else 0

    c1,c2,c3,c4 = st.columns(4)
    with c1: st.metric(f"{indicador_limite(dv01_total, caso['dv01_lim'])} DV01 total", fmt_brl(dv01_total))
    with c2: st.metric(f"{indicador_limite(dur_total, caso['dur_max'])} Duration média", f"{dur_total:.2f} anos")
    with c3:
        desc = abs(dur_imun - caso["funding_prazo"])
        st.metric(f"{'✅' if desc < 0.1 else '⚠️'} Duration imun. vs horizonte", f"{dur_imun:.2f} vs {caso['funding_prazo']:.1f}")
    with c4: st.metric("Concentração máx.", f"{max_conc:.0f}%")

    # Composição
    cc1, cc2 = st.columns(2)
    with cc1:
        fig_comp = go.Figure(go.Pie(
            labels=["Imunizada","Direcional"], values=[vol_imun, total_dir], hole=0.5,
            marker=dict(colors=[CORES["positivo"], COR_ESTRAT.get(estrat_ig, CORES["secundaria"])])))
        fig_comp.update_layout(**PLOTLY_LAYOUT, title="Composição", height=300)
        st.plotly_chart(fig_comp, use_container_width=True, config=PLOTLY_CFG)
    with cc2:
        if len(aloc_ativ) > 0:
            fig_dir = go.Figure(go.Bar(
                x=aloc_ativ["Título"], y=aloc_ativ["Alocação (R$)"],
                marker_color=COR_ESTRAT.get(estrat_ig, CORES["secundaria"])))
            fig_dir.update_layout(**PLOTLY_LAYOUT, title=f"Direcional: {estrat_ig}", yaxis_title="R$", height=300)
            st.plotly_chart(fig_dir, use_container_width=True, config=PLOTLY_CFG)

    # --- SEÇÃO 5: STRESS TEST ---
    st.markdown("---")
    st.markdown("### 4️⃣ Stress Test")
    stress_rows = []
    for cen_nome, cen_v in CENARIOS_STRESS.items():
        chq_m = (cen_v["curto"] + cen_v["longo"]) / 2
        # Imunizada: resultado ≈ 0 para paralelos (por construção)
        pl_imun = aprox_duration_convexidade(vol_imun, dur_imun, 10, chq_m) if "Paralelo" not in cen_nome else vol_imun * 0.001
        if "Paralelo" in cen_nome:
            pl_imun = vol_imun * 0.0005 * abs(chq_m / 100)  # quase zero
        # Direcional
        if total_dir > 0:
            pl_dir = aprox_duration_convexidade(total_dir, dur_dir, 8, chq_m)
        else:
            pl_dir = 0
        pl_total = pl_imun + pl_dir
        stress_rows.append({
            "Cenário": cen_nome, "Imunizada (R$)": pl_imun,
            "Direcional (R$)": pl_dir, "Total (R$)": pl_total,
            "Total (%)": pl_total / caso["volume"] * 100})
    df_stress = pd.DataFrame(stress_rows)
    st.dataframe(df_stress.style.format({
        "Imunizada (R$)":"R$ {:.0f}","Direcional (R$)":"R$ {:.0f}",
        "Total (R$)":"R$ {:.0f}","Total (%)":"{:+.2f}%"}),
        use_container_width=True, hide_index=True)

    # Gráfico stress
    fig_sg = go.Figure()
    fig_sg.add_trace(go.Bar(y=df_stress["Cenário"], x=df_stress["Imunizada (R$)"],
        name="Imunizada", orientation="h", marker_color=CORES["positivo"]))
    fig_sg.add_trace(go.Bar(y=df_stress["Cenário"], x=df_stress["Direcional (R$)"],
        name="Direcional", orientation="h", marker_color=COR_ESTRAT.get(estrat_ig, CORES["secundaria"])))
    fig_sg.update_layout(**PLOTLY_LAYOUT, barmode="group", title="Stress Test: Imunizada vs. Direcional",
                         xaxis_title="P&L (R$)", height=380)
    st.plotly_chart(fig_sg, use_container_width=True, config=PLOTLY_CFG)

    # Alerta
    pior_cenario = df_stress.loc[df_stress["Total (R$)"].idxmin()]
    if pior_cenario["Total (R$)"] < -caso["dv01_lim"] * 10:
        st.warning(f"⚠️ No cenário '{pior_cenario['Cenário']}', a perda total é de "
                   f"{fmt_brl(pior_cenario['Total (R$)'])}. Considere reduzir duration ou adicionar hedge.")

    # --- SEÇÃO 6: REFLEXÃO ---
    st.markdown("---")
    st.markdown("### 💬 Questões para Reflexão")
    questoes = [
        "Sua estratégia direcional é coerente com o cenário? Se invertesse, quanto perderia?",
        "A carteira imunizada está protegida? O que acontece em cenário não-paralelo?",
        "Se o limite de DV01 caísse para R$ 30.000, quais ajustes faria?",
        "A convexidade da sua carteira é maior ou menor que a de outra estratégia? Isso importa?",
        "Se um título fosse rebaixado (downgrade), como afetaria o risco total?",
        "Daqui a 6 meses, a carteira imunizada precisará de rebalanceamento?",
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
        "mod4": render_mod4,
        "integrador": render_integrador,
    }
    fn = dispatch.get(pagina, render_home)
    fn()

def main():
    configurar_pagina()
    render()

if __name__ == "__main__":
    main()