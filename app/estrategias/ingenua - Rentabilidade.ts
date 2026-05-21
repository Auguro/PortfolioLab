export const codigoIngenua_rentabilidade = `import pandas as pd

# =============================================
# PREPARAÇÃO DOS DADOS
# =============================================

# Converte a lista de dicionários recebida do JavaScript em uma tabela (DataFrame)
tabela_ativos = pd.DataFrame(dados_ativos)

# Converte a coluna de datas para o formato de data do pandas
tabela_ativos['Data'] = pd.to_datetime(tabela_ativos['Data'], format='%d/%m/%Y %H:%M:%S')

# Converte os valores dos ativos de string para número
# (necessário porque o CSV usa vírgula como separador decimal)
lista_ativos = list(tickers)
for ativo in lista_ativos:
    tabela_ativos[ativo] = tabela_ativos[ativo].astype(str).str.replace(',', '.').astype(float)

# Define o período da simulação
data_inicio_simulacao = pd.to_datetime(data_inicio)
data_fim_simulacao = pd.to_datetime(data_fim)

# Lista que vai acumular os resultados diários {data, valor}
resultado = []

# Fator de retorno acumulado — começa em 1.0 (representa 0% de retorno)
retorno_acumulado = 1.0

# =============================================
# LOOP MENSAL
# =============================================
# A estratégia Ingênua distribui o capital igualmente entre todos os ativos
# (peso = 1/N para cada ativo). Não precisa de otimização nem janela histórica —
# o retorno diário da carteira é a média simples dos retornos dos ativos.

numero_ativos = len(lista_ativos)

if numero_ativos > 0:
    for mes in pd.date_range(start=data_inicio_simulacao, end=data_fim_simulacao, freq='MS'):
        # Dados diários do mês atual (limitado à data fim da simulação)
        inicio_mes = mes
        fim_mes = mes + pd.offsets.MonthEnd(0)
        fim_periodo = min(fim_mes, data_fim_simulacao)
        dados_mes = tabela_ativos[(tabela_ativos['Data'] >= inicio_mes) & (tabela_ativos['Data'] <= fim_periodo)]

        if dados_mes.empty:
            continue

        # Retornos percentuais diários de todos os ativos neste mês
        retornos_diarios = dados_mes[lista_ativos].pct_change().fillna(0)

        # Retorno diário da carteira = média simples dos retornos (peso = 1/N)
        retorno_carteira_diario = retornos_diarios.mean(axis=1)

        # Acumula o retorno e registra cada dia no resultado
        for data, retorno_do_dia in zip(dados_mes['Data'], retorno_carteira_diario):
            retorno_acumulado *= (1 + retorno_do_dia)
            resultado.append({
                "data": data.strftime('%Y-%m-%d'),
                "valor": float(retorno_acumulado - 1)  # -1 para transformar em % (0.03 = 3%)
            })

resultado`;
