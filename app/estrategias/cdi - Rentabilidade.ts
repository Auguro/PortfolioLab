export const codigoCDI_rentabilidade = `import pandas as pd

# Converte os dados recebidos do JavaScript para DataFrame
dados_cdi_df = pd.DataFrame(dados_cdi)
dados_cdi_df['data'] = pd.to_datetime(dados_cdi_df['data'], dayfirst=True)
dados_cdi_df['valor'] = dados_cdi_df['valor'].astype(float)

# Define o período da simulação
inicio = pd.to_datetime(data_inicio)
fim = pd.to_datetime(data_fim)

# Filtra apenas os dias dentro do período e ordena por data
df_periodo = dados_cdi_df[
    (dados_cdi_df['data'] >= inicio) & (dados_cdi_df['data'] <= fim)
].sort_values('data')

resultado = []
retorno_acumulado = 1.0  # começa em 0% (fator 1)

for _, linha in df_periodo.iterrows():
    # Converte o valor do CDI (ex: 0.1% → 0.001) e aplica ao fator acumulado
    fator_diario = 1 + linha['valor'] / 100
    retorno_acumulado *= fator_diario

    resultado.append({
        "data": linha['data'].strftime('%Y-%m-%d'),
        "valor": retorno_acumulado - 1  # rentabilidade acumulada (ex: 0.03 = 3%)
    })

resultado`;