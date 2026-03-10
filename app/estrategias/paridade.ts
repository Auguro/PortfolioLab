export const codigoParidade = `import pandas as pd
import numpy as np
from scipy.optimize import minimize

# Preparar dados
df = pd.DataFrame(dados_ativos)
df['Data'] = pd.to_datetime(df['Data'], format='%d/%m/%Y %H:%M:%S')

ativos = list(tickers)
for col in ativos:
    df[col] = df[col].astype(str).str.replace(',', '.').astype(float)

inicio = pd.to_datetime(data_inicio)
fim = pd.to_datetime(data_fim)

def calculate_risk_contributions(x, cov_matrix):
    sigma_x = np.dot(cov_matrix, x)
    total_risk = np.sqrt(np.dot(x.T, sigma_x))
    marginal_risk = sigma_x / total_risk if total_risk != 0 else np.zeros_like(sigma_x)
    return x * marginal_risk, total_risk

def objective(x, cov_matrix, b):
    variance = float(np.dot(x.T, np.dot(cov_matrix, x)))
    sqrt_variance = np.sqrt(variance) if variance > 0 else 1.0
    w = x / sqrt_variance
    return 0.5 * np.dot(w, b / (w + 1e-18)) - np.dot(b, np.log(w + 1e-18))

def solve_paridade(cov_matrix, n):
    b = np.ones(n) / n
    x0 = np.ones(n) / n
    result = minimize(
        objective, x0, args=(cov_matrix, b),
        method='SLSQP',
        bounds=[(1e-19, 1)] * n,
        constraints={'type': 'eq', 'fun': lambda x: np.sum(x) - 1.0},
        options={'maxiter': 1000, 'ftol': 1e-9}
    )
    if not result.success:
        return None
    return result.x

quantities = {ativo: 0.0 for ativo in ativos}
resultado = []
min_vol_threshold = 13

for month in pd.date_range(start=inicio, end=fim, freq='MS'):
    investment_date = month + pd.offsets.BMonthBegin(0)
    investment_datetime = investment_date.replace(hour=16, minute=56, second=0)
    one_year_before = investment_date - pd.DateOffset(years=1)

    yearly_data = df[(df['Data'] >= one_year_before) & (df['Data'] < investment_date)]
    yearly_dataaux = df[(df['Data'] >= one_year_before) & (df['Data'] <= investment_datetime)]

    if len(yearly_data) < 2:
        continue

    returns = yearly_data[ativos].pct_change().dropna()
    current_assets = ativos.copy()
    success = False

    for attempt in range(len(ativos)):
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

        current_returns = returns[current_assets]
        cov_matrix = current_returns.cov().values * 1e-2

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
        continue

    cov_matrix = returns[current_assets].cov().values * 1e-2
    optimal_x = solve_paridade(cov_matrix, len(current_assets))

    if optimal_x is None:
        continue

    aporte = aporte_inicial if month == inicio else aporte_mensal
    current_prices = yearly_dataaux.iloc[-1][current_assets].to_dict()

    for i, asset in enumerate(current_assets):
        price = float(current_prices[asset])
        if price > 0:
            quantities[asset] += (aporte * optimal_x[i]) / price

    start_of_month = month
    end_of_month = month + pd.offsets.MonthEnd(0)
    daily_data = df[(df['Data'] >= start_of_month) & (df['Data'] <= end_of_month)]

    if not daily_data.empty:
        daily_prices = daily_data[ativos].ffill()
        for _, row in daily_data.iterrows():
            valor = sum(float(row[a]) * quantities[a] for a in ativos)
            resultado.append({"data": row['Data'].strftime('%Y-%m-%d'), "valor": float(valor)})

resultado`;