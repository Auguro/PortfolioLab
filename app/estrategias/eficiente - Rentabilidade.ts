export const codigoEficiente_rentabilidade = `import pandas as pd
import numpy as np

df = pd.DataFrame(dados_ativos)
df['Data'] = pd.to_datetime(df['Data'], format='%d/%m/%Y %H:%M:%S')

ativos = list(tickers)
for col in ativos:
    df[col] = df[col].astype(str).str.replace(',', '.').astype(float)

inicio = pd.to_datetime(data_inicio)
fim = pd.to_datetime(data_fim)

df_cdi = pd.DataFrame(dados_cdi)
df_cdi['data'] = pd.to_datetime(df_cdi['data'], dayfirst=True)
df_cdi['valor'] = df_cdi['valor'].astype(str).str.replace(',', '.').astype(float)

resultado = []
retorno_acumulado = 1.0
min_vol_threshold = 13

for month in pd.date_range(start=inicio, end=fim, freq='MS'):
    investment_date = month + pd.offsets.BMonthBegin(0)
    one_year_before = investment_date - pd.DateOffset(years=1)

    first_date = df['Data'].min()
    if one_year_before < first_date:
        one_year_before = first_date

    yearly_data = df[(df['Data'] >= one_year_before) & (df['Data'] < investment_date)]
    if len(yearly_data) < 2:
        yearly_data = df[df['Data'] < investment_date].copy()
        if len(yearly_data) < 2:
            continue

    returns = yearly_data[ativos].pct_change().dropna()
    if returns.empty:
        continue

    cdi_periodo = df_cdi[(df_cdi['data'] >= one_year_before) & (df_cdi['data'] < investment_date)]
    rf_medio = cdi_periodo['valor'].mean() / 100 if not cdi_periodo.empty else 0.0

    current_assets = ativos.copy()
    success = False

    for attempt in range(len(ativos)):
        if len(current_assets) <= 1:
            break

        current_returns = returns[current_assets]
        volatilities = current_returns.std() * (252 ** 0.5) * 100

        low_vol_assets = volatilities[volatilities < min_vol_threshold]
        if not low_vol_assets.empty:
            for asset in low_vol_assets.index:
                if asset in current_assets:
                    current_assets.remove(asset)
            if len(current_assets) <= 1:
                success = False
                break

        if len(current_assets) <= 1:
            break

        current_returns = returns[current_assets]
        cov_matrix = current_returns.cov().values

        try:
            np.linalg.cholesky(cov_matrix)
            success = True
            break
        except np.linalg.LinAlgError:
            volatilities = current_returns.std()
            min_vol_asset = volatilities.idxmin()
            if min_vol_asset in current_assets:
                current_assets.remove(min_vol_asset)
            if len(current_assets) <= 1:
                success = False
                break

    if not success:
        if len(current_assets) == 1:
            only_asset = current_assets[0]
            start_of_month = month
            end_of_month = month + pd.offsets.MonthEnd(0)
            data_fim_periodo = min(end_of_month, fim)
            daily_data = df[(df['Data'] >= start_of_month) & (df['Data'] <= data_fim_periodo)]
            if not daily_data.empty:
                prices = daily_data[only_asset].values
                retornos_diarios = prices[1:] / prices[:-1] - 1
                for i, ret in enumerate(retornos_diarios):
                    retorno_acumulado *= (1 + ret)
                    resultado.append({
                        "data": daily_data['Data'].iloc[i+1].strftime('%Y-%m-%d'),
                        "valor": float(retorno_acumulado - 1)
                    })
        continue

    if len(current_assets) < 2:
        continue

    current_returns = returns[current_assets]
    expected_returns = current_returns.mean().values
    cov_matrix = current_returns.cov().values
    excess_returns = expected_returns - rf_medio

    try:
        inv_cov = np.linalg.inv(cov_matrix)
        w_tang = inv_cov @ excess_returns
        w_tang = w_tang / np.sum(w_tang)
    except:
        w_tang = np.ones(len(current_assets)) / len(current_assets)

    pesos = {asset: 0.0 for asset in ativos}
    for i, asset in enumerate(current_assets):
        pesos[asset] = w_tang[i]

    start_of_month = month
    end_of_month = month + pd.offsets.MonthEnd(0)
    data_fim_periodo = min(end_of_month, fim)
    daily_data = df[(df['Data'] >= start_of_month) & (df['Data'] <= data_fim_periodo)]

    if not daily_data.empty:
        precos = daily_data[ativos].values
        retornos_diarios = precos[1:] / precos[:-1] - 1
        for i in range(len(retornos_diarios)):
            ret_carteira = 0.0
            for j, asset in enumerate(ativos):
                if pesos[asset] != 0:
                    ret_carteira += pesos[asset] * retornos_diarios[i, j]
            retorno_acumulado *= (1 + ret_carteira)
            resultado.append({
                "data": daily_data['Data'].iloc[i+1].strftime('%Y-%m-%d'),
                "valor": float(retorno_acumulado - 1)
            })

resultado`;