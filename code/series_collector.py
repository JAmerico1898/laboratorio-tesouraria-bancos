# %%
from datetime import datetime
import pandas as pd
from bcb import sgs
from datetime import date, datetime, timedelta
from dateutil.relativedelta import relativedelta
import calendar
import streamlit as st
import pyield as yd
import warnings
warnings.filterwarnings("ignore")

def carregar_selic_meta():
    """SGS 432 – Selic Meta | Colunas: data, valor | Fonte: BCB"""
    try:
        ref = datetime.today() - timedelta(days=60)
        ultimo_dia = calendar.monthrange(ref.year, ref.month)[1]
        end_dt = ref.replace(day=ultimo_dia)
        start_dt = end_dt.replace(year=end_dt.year - 9, day=1)
        end = end_dt.strftime('%Y-%m-%d')
        start = start_dt.strftime('%Y-%m-%d')

        df = sgs.get({'selic_meta': 432}, start=start, end=end, multi=False)
        df = df.reset_index().rename(columns={'Date': 'data', 'selic_meta': 'valor'})
        df['data'] = pd.to_datetime(df['data'])
        df = df.sort_values('data').reset_index(drop=True)
        df.to_csv('data/selic_meta.csv', index=False)
        return df
    except Exception as e:
        st.warning(f"⚠️ Erro ao carregar Selic Meta do SGS: {e}")
        return pd.DataFrame(columns=["data", "valor"])
carregar_selic_meta()    


def carregar_selic_over():
    """SGS 1178 – Selic Over | Colunas: data, valor | Fonte: BCB"""
    try:
        ref = datetime.today() - timedelta(days=60)
        ultimo_dia = calendar.monthrange(ref.year, ref.month)[1]
        end_dt = ref.replace(day=ultimo_dia)
        start_dt = end_dt.replace(year=end_dt.year - 9, day=1)
        end = end_dt.strftime('%Y-%m-%d')
        start = start_dt.strftime('%Y-%m-%d')

        df = sgs.get({'selic_over': 1178}, start=start, end=end, multi=False)
        df = df.reset_index().rename(columns={'Date': 'data', 'selic_over': 'valor'})
        df['data'] = pd.to_datetime(df['data'])
        df.sort_values('data').reset_index(drop=True)
        df.to_csv('data/selic_over.csv', index=False)
        return 
    except Exception as e:
        st.warning(f"⚠️ Erro ao carregar Selic Over do SGS: {e}")
        return pd.DataFrame(columns=["data", "valor"])
carregar_selic_over()


def carregar_cdi_diario():
    """SGS 4391 – CDI Diário | Colunas: data, valor (% a.a.) | Fonte: BCB"""
    try:
        ref = datetime.today() - timedelta(days=60)
        ultimo_dia = calendar.monthrange(ref.year, ref.month)[1]
        end_dt = ref.replace(day=ultimo_dia)
        start_dt = end_dt.replace(year=end_dt.year - 9, day=1)
        end = end_dt.strftime('%Y-%m-%d')
        start = start_dt.strftime('%Y-%m-%d')

        df = sgs.get({'cdi_diario': 4389}, start=start, end=end, multi=False)
        df = df.reset_index().rename(columns={'Date': 'data', 'cdi_diario': 'valor'})
        df['data'] = pd.to_datetime(df['data'])
        df.sort_values('data').reset_index(drop=True)
        df.to_csv('data/cdi_diario.csv', index=False)
        return
    except Exception as e:
        st.warning(f"⚠️ Erro ao carregar CDI Diário do SGS: {e}")
        return pd.DataFrame(columns=["data", "valor"])
carregar_cdi_diario()


def carregar_ipca():
    """SGS 433 – IPCA | Colunas: data, valor | Fonte: BCB"""
    try:
        ref = datetime.today() - timedelta(days=60)
        ultimo_dia = calendar.monthrange(ref.year, ref.month)[1]
        end_dt = ref.replace(day=ultimo_dia)
        start_dt = end_dt.replace(year=end_dt.year - 9, day=1)
        end = end_dt.strftime('%Y-%m-%d')
        start = start_dt.strftime('%Y-%m-%d')

        df = sgs.get({'ipca': 433}, start=start, end=end)
        df = df.reset_index().rename(columns={'Date': 'data', 'ipca': 'valor'})
        df['data'] = pd.to_datetime(df['data'])
        df.sort_values('data').reset_index(drop=True)
        df.to_csv('data/ipca_mensal.csv', index=False)
        return 
    except Exception as e:
        st.warning(f"⚠️ Erro ao carregar IPCA do SGS: {e}")
        return pd.DataFrame(columns=["data", "valor"])
carregar_ipca()


def carregar_cambio():
    """SGS 3696 – Câmbio USD/BRL | Colunas: data, valor | Fonte: BCB"""
    try:
        ref = datetime.today() - timedelta(days=60)
        ultimo_dia = calendar.monthrange(ref.year, ref.month)[1]
        end_dt = ref.replace(day=ultimo_dia)
        start_dt = end_dt.replace(year=end_dt.year - 9, day=1)
        end = end_dt.strftime('%Y-%m-%d')
        start = start_dt.strftime('%Y-%m-%d')

        df = sgs.get({'cambio': 3696}, start=start, end=end)
        df = df.reset_index().rename(columns={'Date': 'data', 'cambio': 'valor'})
        df['data'] = pd.to_datetime(df['data'])
        df.sort_values('data').reset_index(drop=True)
        df.to_csv('data/cambio_usd.csv', index=False)
        return 
    except Exception as e:
        st.warning(f"⚠️ Erro ao carregar Câmbio do SGS: {e}")
        return pd.DataFrame(columns=["data", "valor"])
carregar_cambio()


def carregar_pib():
    """SGS 22099 – PIB Trimestral | Colunas: data, valor (% var a.a.) | Fonte: BCB"""
    try:
        ref = datetime.today() - timedelta(days=60)
        ultimo_dia = calendar.monthrange(ref.year, ref.month)[1]
        end_dt = ref.replace(day=ultimo_dia)
        start_dt = end_dt.replace(year=end_dt.year - 9, day=1)
        end = end_dt.strftime('%Y-%m-%d')
        start = start_dt.strftime('%Y-%m-%d')

        df = sgs.get({'pib': 22099}, start=start, end=end)
        df = df.reset_index().rename(columns={'Date': 'data', 'pib': 'valor'})
        df['data'] = pd.to_datetime(df['data'])
        df.sort_values('data').reset_index(drop=True)
        df.to_csv('data/pib_trimestral.csv', index=False)
        return 
    except Exception as e:
        st.warning(f"⚠️ Erro ao carregar PIB do SGS: {e}")
        return pd.DataFrame(columns=["data", "valor"])
carregar_pib()


def carregar_resultado_primario():
    """SGS 2143 – Resultado Primário | Colunas: data, valor (% PIB) | Fonte: BCB"""
    try:
        ref = datetime.today() - timedelta(days=60)
        ultimo_dia = calendar.monthrange(ref.year, ref.month)[1]
        end_dt = ref.replace(day=ultimo_dia)
        start_dt = end_dt.replace(year=end_dt.year - 9, day=1)
        end = end_dt.strftime('%Y-%m-%d')
        start = start_dt.strftime('%Y-%m-%d')

        df = sgs.get({'resultado_primario': 2143}, start=start, end=end)
        df = df.reset_index().rename(columns={'Date': 'data', 'resultado_primario': 'valor'})
        df['data'] = pd.to_datetime(df['data'])
        df.sort_values('data').reset_index(drop=True)
        df.to_csv('data/resultado_primario.csv', index=False)
        return 
    except Exception as e:
        st.warning(f"⚠️ Erro ao carregar Resultado Primário do SGS: {e}")
        return pd.DataFrame(columns=["data", "valor"])
carregar_resultado_primario()



import pandas as pd
from datetime import datetime, timedelta
from bcb import Expectativas

em = Expectativas()
ep = em.get_endpoint('ExpectativasMercadoAnuais')

hoje = datetime.today()
start = (hoje - timedelta(days=365)).strftime('%Y-%m-%d')
end = hoje.strftime('%Y-%m-%d')
ano_corrente = str(hoje.year)
ano_seguinte = str(hoje.year + 1)

# Definição das consultas: (nome_variavel, indicador_bcb, data_referencia)
consultas = [
    ('IPCA_corrente',  'IPCA',   ano_corrente),
    ('IPCA_seguinte',  'IPCA',   ano_seguinte),
    ('SELIC_corrente', 'Selic',   ano_corrente),
    ('SELIC_seguinte', 'Selic',   ano_seguinte),
    ('PIB_corrente',   'PIB Total', ano_corrente),
    ('Cambio_corrente','Câmbio',  ano_corrente),
]

frames = []
for nome_var, indicador, data_ref in consultas:
    try:
        df = (ep.query()
              .filter(ep.Indicador == indicador)
              .filter(ep.Data >= start, ep.Data <= end)
              .filter(ep.DataReferencia == data_ref, ep.baseCalculo == 1)
              .orderby(ep.Data.asc())
              .select(ep.Data, ep.Mediana)
              .collect())
        
        if not df.empty:
            df = df.rename(columns={'Data': 'data_coleta', 'Mediana': 'mediana'})
            df['variavel'] = nome_var
            frames.append(df[['data_coleta', 'variavel', 'mediana']])
    except Exception as e:
        print(f"Erro ao carregar {nome_var}: {e}")

df_focus = pd.concat(frames, ignore_index=True)
df_focus.to_csv('data/focus_expectativas.csv', index=False)
print(f"Salvo: {len(df_focus)} registros")
print(df_focus.head(10))


def coletar_curva_di():
    """Coleta curva DI1 do último dia útil disponível e salva em curvas_di.csv"""
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
                    'data': data_atual,
                    'prazo_du': df['BDaysToExp'].astype(int),
                    'taxa': df['SettlementRate']
                })
                df_out = df_out.sort_values('prazo_du').reset_index(drop=True)
                df_out.to_csv('data/curvas_di.csv', index=False)
                print(f"Salvo: curvas_di.csv | Data: {data_str} | {len(df_out)} vértices")
                return df_out
        except Exception as e:
            print(f"Sem dados para {data_atual}: {e}")

        data_atual -= timedelta(days=1)

    print("Não foi possível coletar dados DI1.")
    return pd.DataFrame(columns=["data", "prazo_du", "taxa"])
coletar_curva_di()



#NTN-B taxas
def coletar_ntnb():
    """Coleta taxas NTN-B da ANBIMA via pyield e salva em ntnb_taxas.csv"""
    data_atual = (datetime.today() - timedelta(days=1)).date()
    max_tentativas = 10

    for _ in range(max_tentativas):
        try:
            #data_str = data_atual.strftime("%d-%m-%Y")
            data_str = data_atual.strftime("%Y-%m-%d")
            df_polars = yd.ntnb.data(data_str)
            df = df_polars.to_pandas(use_pyarrow_extension_array=True)

            if df is not None and len(df) > 0:
                df_out = pd.DataFrame({
                    'data': pd.to_datetime(data_atual),
                    'prazo_du': df['BDToMat'].astype(int),
                    'taxa': df['IndicativeRate']
                })
                df_out = df_out.sort_values('prazo_du').reset_index(drop=True)
                df_out.to_csv('data/ntnb_taxas.csv', index=False)
                print(f"Salvo: ntnb_taxas.csv | Data: {data_atual} | {len(df_out)} vértices")
                return df_out
        except Exception as e:
            print(f"Sem dados NTN-B para {data_atual}: {e}")

        data_atual -= timedelta(days=1)

    print("Não foi possível coletar dados NTN-B.")
    return pd.DataFrame(columns=["data", "prazo_du", "taxa"])

df_ntnb = coletar_ntnb()


#Dólar Futuro:
import pandas as pd
from datetime import datetime, timedelta
import pyield as yd

def coletar_dolar_futuro():
    """Coleta dólar futuro da B3 via pyield e salva em dolar_futuro.csv"""
    data_atual = (datetime.today() - timedelta(days=1)).date()
    max_tentativas = 10

    for _ in range(max_tentativas):
        try:
            data_str = data_atual.strftime("%d-%m-%Y")
            df_polars = yd.futures(contract_code="DOL", date=data_str)
            df = df_polars.to_pandas(use_pyarrow_extension_array=True)

            if df is not None and len(df) > 0:
                if hasattr(df['BDaysToExp'], 'to_numpy'):
                    df['BDaysToExp'] = df['BDaysToExp'].to_numpy()
                if hasattr(df['DaysToExp'], 'to_numpy'):
                    df['DaysToExp'] = df['DaysToExp'].to_numpy()

                df_out = pd.DataFrame({
                    'data': pd.to_datetime(data_atual),
                    'prazo_du': df['BDaysToExp'].astype(int),
                    'dc': df['DaysToExp'].astype(int),
                    'cotacao': df['SettlementPrice']/1000
                })
                df_out = df_out.sort_values('prazo_du').reset_index(drop=True)
                df_out.to_csv('data/dolar_futuro.csv', index=False)
                print(f"Salvo: dolar_futuro.csv | Data: {data_atual} | {len(df_out)} contratos")
                return df_out
        except Exception as e:
            print(f"Sem dados DOL para {data_atual}: {e}")

        data_atual -= timedelta(days=1)

    print("Não foi possível coletar dados de dólar futuro.")
    return pd.DataFrame(columns=["data", "prazo_du", "dc", "cotacao"])

df_dol = coletar_dolar_futuro()

# Dólar à vista
def carregar_dolar_spot_ptax():
    """SGS 1 – PTAX Venda (diário) | Colunas: data, valor (R$/USD) | Fonte: BCB"""
    try:
        ref = datetime.today() - timedelta(days=60)
        ultimo_dia = calendar.monthrange(ref.year, ref.month)[1]
        end_dt = ref.replace(day=ultimo_dia)
        start_dt = end_dt.replace(year=end_dt.year - 9, day=1)
        end = end_dt.strftime('%Y-%m-%d')
        start = start_dt.strftime('%Y-%m-%d')

        df = sgs.get({'ptax_venda': 1}, start=start, end=end)
        df = df.reset_index().rename(columns={'Date': 'data', 'ptax_venda': 'valor'})
        df['data'] = pd.to_datetime(df['data'])
        df = df.sort_values('data').reset_index(drop=True)
        df.to_csv('data/dolar_spot_ptax.csv', index=False)
        return df
    except Exception as e:
        st.warning(f"⚠️ Erro ao carregar PTAX Venda do SGS: {e}")
        return pd.DataFrame(columns=["data", "valor"])

carregar_dolar_spot_ptax()

# IPCA expectativas

import pandas as pd
from datetime import datetime, timedelta
from bcb import Expectativas

em = Expectativas()
ep_anual = em.get_endpoint('ExpectativasMercadoAnuais')
ep_12m = em.get_endpoint('ExpectativasMercadoInflacao12Meses')

hoje = datetime.today()
start = (hoje - timedelta(days=365)).strftime('%Y-%m-%d')
end = hoje.strftime('%Y-%m-%d')
ano_corrente = str(hoje.year)
ano_seguinte = str(hoje.year + 1)

frames = []

# IPCA 12 meses (endpoint específico)
try:
    df = (ep_12m.query()
          .filter(ep_12m.Indicador == 'IPCA')
          .filter(ep_12m.Data >= start, ep_12m.Data <= end)
          .filter(ep_12m.baseCalculo == 1)
          .orderby(ep_12m.Data.asc())
          .select(ep_12m.Data, ep_12m.Mediana)
          .collect())
    if not df.empty:
        df = df.rename(columns={'Data': 'data_coleta', 'Mediana': 'mediana'})
        df['variavel'] = 'IPCA_12m'
        frames.append(df[['data_coleta', 'variavel', 'mediana']])
except Exception as e:
    print(f"Erro ao carregar IPCA_12m: {e}")

# IPCA corrente e seguinte (endpoint anual)
consultas = [
    ('IPCA_corrente', 'IPCA', ano_corrente),
    ('IPCA_seguinte', 'IPCA', ano_seguinte),
]

for nome_var, indicador, data_ref in consultas:
    try:
        df = (ep_anual.query()
              .filter(ep_anual.Indicador == indicador)
              .filter(ep_anual.Data >= start, ep_anual.Data <= end)
              .filter(ep_anual.DataReferencia == data_ref, ep_anual.baseCalculo == 1)
              .orderby(ep_anual.Data.asc())
              .select(ep_anual.Data, ep_anual.Mediana)
              .collect())
        if not df.empty:
            df = df.rename(columns={'Data': 'data_coleta', 'Mediana': 'mediana'})
            df['variavel'] = nome_var
            frames.append(df[['data_coleta', 'variavel', 'mediana']])
    except Exception as e:
        print(f"Erro ao carregar {nome_var}: {e}")

df_focus = pd.concat(frames, ignore_index=True)
df_focus.to_csv('data/focus_ipca.csv', index=False)
print(f"Salvo: {len(df_focus)} registros")
print(df_focus.head(10))


# Futuro de Cumpom Cambial - DDI

import pandas as pd
from datetime import datetime, timedelta
import pyield as yd

import pandas as pd
from datetime import datetime, timedelta
import pyield as yd

def coletar_cupom_cambial_hist():
    """Coleta cupom cambial (DDI) histórico da B3 via pyield"""
    data_fim = (datetime.today() - timedelta(days=1)).date()
    data_inicio = data_fim - timedelta(days=365)
    data_atual = data_inicio

    todos_frames = []

    while data_atual <= data_fim:
        # Pular fins de semana
        if data_atual.weekday() >= 5:
            data_atual += timedelta(days=1)
            continue

        try:
            data_str = data_atual.strftime("%d-%m-%Y")
            df_polars = yd.futures(contract_code="DDI", date=data_str)
            df = df_polars.to_pandas(use_pyarrow_extension_array=True)

            if df is not None and len(df) > 0:
                if hasattr(df['BDaysToExp'], 'to_numpy'):
                    df['BDaysToExp'] = df['BDaysToExp'].to_numpy()
                if hasattr(df['DaysToExp'], 'to_numpy'):
                    df['DaysToExp'] = df['DaysToExp'].to_numpy()

                df = df.dropna(subset=['SettlementPrice']).copy()
                dc = df['DaysToExp'].astype(int)
                pu = df['SettlementPrice']
                cupom_aa = ((pu / 100000) - 1) * (360 / dc) * 100

                df_out = pd.DataFrame({
                    'data': pd.to_datetime(data_atual),
                    'prazo_meses': (dc / 30).round().astype(int),
                    'cupom_aa': cupom_aa.round(4)
                })
                todos_frames.append(df_out)
                print(f"OK: {data_atual}")
        except Exception:
            pass  # Dia sem dados (feriado etc.)

        data_atual += timedelta(days=1)

    if todos_frames:
        df_final = pd.concat(todos_frames, ignore_index=True)
        df_final = df_final.sort_values(['data', 'prazo_meses']).reset_index(drop=True)
        df_final.to_csv('data/cupom_cambial_hist.csv', index=False)
        print(f"Salvo: cupom_cambial_hist.csv | {len(df_final)} registros | {df_final['data'].nunique()} dias")
        return df_final
    else:
        print("Não foi possível coletar dados de cupom cambial.")
        return pd.DataFrame(columns=["data", "prazo_meses", "cupom_aa"])

df_ddi = coletar_cupom_cambial_hist()

# IPCA 12 meses

def carregar_ipca_12m():
    """SGS 13522 – IPCA acumulado 12 meses | Colunas: data, valor (% acum. 12M) | Fonte: BCB"""
    try:
        ref = datetime.today() - timedelta(days=60)
        ultimo_dia = calendar.monthrange(ref.year, ref.month)[1]
        end_dt = ref.replace(day=ultimo_dia)
        start_dt = end_dt.replace(year=end_dt.year - 9, day=1)
        end = end_dt.strftime('%Y-%m-%d')
        start = start_dt.strftime('%Y-%m-%d')

        df = sgs.get({'ipca_12m': 13522}, start=start, end=end)
        df = df.reset_index().rename(columns={'Date': 'data', 'ipca_12m': 'valor'})
        df['data'] = pd.to_datetime(df['data'])
        df = df.sort_values('data').reset_index(drop=True)
        df.to_csv('data/ipca_12m.csv', index=False)
        return df
    except Exception as e:
        st.warning(f"⚠️ Erro ao carregar IPCA 12M do SGS: {e}")
        return pd.DataFrame(columns=["data", "valor"])

carregar_ipca_12m()

# Titulos Públicos

import pandas as pd
from datetime import datetime, timedelta
from pyield import lft, ltn, ntnb, ntnf

def coletar_titulos_publicos():
    """Coleta títulos públicos (LFT, LTN, NTN-B, NTN-F) da ANBIMA via pyield"""
    data_atual = (datetime.today() - timedelta(days=1)).date()
    max_tentativas = 10

    titulos = [
        ('LFT', lft),
        ('LTN', ltn),
        ('NTN-B', ntnb),
        ('NTN-F', ntnf),
    ]

    for _ in range(max_tentativas):
        data_str = data_atual.strftime("%d-%m-%Y")
        frames = []

        for nome, modulo in titulos:
            try:
                df_polars = modulo.data(data_str)
                df = df_polars.to_pandas(use_pyarrow_extension_array=True)

                if df is not None and len(df) > 0:
                    df_out = pd.DataFrame({
                        'data': pd.to_datetime(data_atual),
                        'titulo': nome,
                        'vencimento': pd.to_datetime(df['MaturityDate']),
                        'taxa': df['IndicativeRate'],
                        'pu': df['Price'],
                        'du': df['BDToMat'].astype(int)
                    })
                    frames.append(df_out)
            except Exception as e:
                print(f"Erro {nome} para {data_atual}: {e}")

        if frames:
            df_final = pd.concat(frames, ignore_index=True)
            df_final = df_final.sort_values(['titulo', 'du']).reset_index(drop=True)
            df_final.to_csv('data/titulos_publicos.csv', index=False)
            print(f"Salvo: titulos_publicos.csv | Data: {data_atual} | {len(df_final)} títulos")
            return df_final

        print(f"Sem dados para {data_atual}, tentando dia anterior...")
        data_atual -= timedelta(days=1)

    print("Não foi possível coletar dados de títulos públicos.")
    return pd.DataFrame(columns=["data", "titulo", "vencimento", "taxa", "pu", "du"])

df_titulos = coletar_titulos_publicos()


# módulos disponíveis em pyield:

import pyield as yd

# Listar todos os métodos públicos do módulo bc
print([m for m in dir(yd.bc) if not m.startswith('_')])

import pandas as pd
from datetime import datetime, timedelta
import calendar
from bcb import sgs

def coletar_vna_lft():
    """SGS 21 – VNA LFT | Colunas: data, vna | Fonte: BCB"""
    try:
        ref = datetime.today() - timedelta(days=60)
        ultimo_dia = calendar.monthrange(ref.year, ref.month)[1]
        end_dt = ref.replace(day=ultimo_dia)
        start_dt = end_dt.replace(year=end_dt.year - 1, day=1)
        end = end_dt.strftime('%Y-%m-%d')
        start = start_dt.strftime('%Y-%m-%d')

        df = sgs.get({'vna_lft': 21}, start=start, end=end)
        df = df.reset_index().rename(columns={'Date': 'data', 'vna_lft': 'vna'})
        df['data'] = pd.to_datetime(df['data'])
        df = df.sort_values('data').reset_index(drop=True)
        df.to_csv('data/vna_lft.csv', index=False)
        print(f"Salvo: vna_lft.csv | {len(df)} registros | Último: {df.iloc[-1]['data'].date()} = {df.iloc[-1]['vna']:.6f}")
        return df
    except Exception as e:
        print(f"Erro ao carregar VNA LFT do SGS: {e}")
        return pd.DataFrame(columns=["data", "vna"])

coletar_vna_lft()
