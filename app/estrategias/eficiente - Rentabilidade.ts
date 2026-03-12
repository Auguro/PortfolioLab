export const codigoEficiente_rentabilidade = `import pandas as pd
import numpy as np

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

# Prepara os dados do CDI — usado como taxa livre de risco no cálculo dos pesos
tabela_cdi = pd.DataFrame(dados_cdi)
tabela_cdi['data'] = pd.to_datetime(tabela_cdi['data'], dayfirst=True)
tabela_cdi['valor'] = tabela_cdi['valor'].astype(float)

# Define o período da simulação
data_inicio_simulacao = pd.to_datetime(data_inicio)
data_fim_simulacao = pd.to_datetime(data_fim)

# Lista que vai acumular os resultados diários {data, valor}
resultado = []

# Fator de retorno acumulado — começa em 1.0 (representa 0% de retorno)
retorno_acumulado = 1.0

# Limiar mínimo de volatilidade anualizada (%) para um ativo ser incluído
# Ativos com volatilidade abaixo disso são excluídos pois distorcem o cálculo
limiar_volatilidade_minima = 13

# =============================================
# FUNÇÕES
# =============================================

# Filtra os dados do CDI para o último ano antes do mês de rebalanceamento
# Alinha as datas do CDI com as datas disponíveis nos dados dos ativos
def filtrar_cdi_ultimo_ano(mes, tabela_cdi_, tabela_ativos_):
    um_ano_antes = mes - pd.DateOffset(years=1)
    cdi_filtrado = tabela_cdi_[
        (tabela_cdi_['data'] >= um_ano_antes) & (tabela_cdi_['data'] < mes)
    ].copy()
    cdi_filtrado['data'] = cdi_filtrado['data'].dt.normalize()
    cdi_filtrado = cdi_filtrado[
        cdi_filtrado['data'].isin(tabela_ativos_['Data'].dt.normalize())
    ]
    return cdi_filtrado

# Calcula os pesos ótimos da Carteira Eficiente usando a Teoria Moderna do Portfólio
# A carteira eficiente maximiza o retorno esperado ajustado pelo risco (Sharpe)
# usando a taxa livre de risco (CDI médio do período)
#
# Matematicamente: pesos = (Σ⁻¹ * (μ - Rf)) / (1ᵀ * Σ⁻¹ * (μ - Rf))
# onde Σ é a matriz de covariância, μ são os retornos esperados e Rf é o CDI
#
# retornos_historicos: DataFrame com retornos diários dos ativos válidos
# cdi_medio_diario: taxa livre de risco média diária do período (em %)
# Retorna: array com os pesos ótimos, ou None se o cálculo falhar
def calcular_pesos_eficiente(retornos_historicos_, ativos_validos_, cdi_medio_diario):
    retornos_esperados = retornos_historicos_[ativos_validos_].mean().values
    numero_ativos = len(ativos_validos_)

    # Vetor de uns (usado para normalizar os pesos)
    vetor_uns = np.ones(numero_ativos).reshape(1, -1)

    # Taxa livre de risco diária como vetor coluna
    taxa_livre_risco = np.full((numero_ativos, 1), cdi_medio_diario / 100)

    # Excesso de retorno em relação ao CDI
    excesso_retorno = retornos_esperados.reshape(-1, 1) - taxa_livre_risco

    # Calcula a inversa da matriz de covariância via decomposição de Cholesky
    matriz_cov = retornos_historicos_[ativos_validos_].cov()
    L = np.linalg.cholesky(matriz_cov)
    L_inv = np.linalg.inv(L)
    matriz_cov_inv = L_inv.T @ L_inv

    # Pesos proporcionais ao excesso de retorno ajustado pelo risco
    pesos_nao_normalizados = np.matmul(matriz_cov_inv, excesso_retorno).flatten()
    normalizador = np.matmul(vetor_uns, np.matmul(matriz_cov_inv, excesso_retorno))[0, 0]

    if normalizador == 0:
        return None

    pesos = pesos_nao_normalizados / normalizador
    return pesos

# =============================================
# LOOP MENSAL
# =============================================

for mes in pd.date_range(start=data_inicio_simulacao, end=data_fim_simulacao, freq='MS'):

    # Primeiro dia útil do mês — data em que fazemos o rebalanceamento
    data_rebalanceamento = mes + pd.offsets.BMonthBegin(0)
    datetime_rebalanceamento = data_rebalanceamento.replace(hour=16, minute=56, second=0)

    # Janela de 1 ano de dados históricos usada para calcular os pesos
    um_ano_antes = data_rebalanceamento - pd.DateOffset(years=1)

    # Garante que não vamos além do início dos dados disponíveis
    primeira_data_disponivel = tabela_ativos['Data'].min()
    if um_ano_antes < primeira_data_disponivel:
        um_ano_antes = primeira_data_disponivel

    # Dados do último ano para calcular retornos e covariância
    dados_ultimo_ano = tabela_ativos[(tabela_ativos['Data'] >= um_ano_antes) & (tabela_ativos['Data'] < data_rebalanceamento)]
    dados_ultimo_ano_aux = tabela_ativos[(tabela_ativos['Data'] >= um_ano_antes) & (tabela_ativos['Data'] <= datetime_rebalanceamento)]

    # Se não tiver dados suficientes, usa tudo que tiver disponível
    if len(dados_ultimo_ano) < 2:
        dados_ultimo_ano = tabela_ativos[tabela_ativos['Data'] < data_rebalanceamento].copy()
        dados_ultimo_ano_aux = tabela_ativos[tabela_ativos['Data'] <= datetime_rebalanceamento].copy()
        if len(dados_ultimo_ano) < 2:
            continue

    # CDI médio diário do último ano — usado como taxa livre de risco
    cdi_ultimo_ano = filtrar_cdi_ultimo_ano(mes, tabela_cdi, dados_ultimo_ano)
    cdi_medio_diario = cdi_ultimo_ano['valor'].mean() if not cdi_ultimo_ano.empty else 0.0

    # Calcula os retornos percentuais diários do último ano
    retornos_historicos = dados_ultimo_ano[lista_ativos].pct_change().dropna()
    if retornos_historicos.empty:
        continue

    # ---- SELEÇÃO DE ATIVOS VÁLIDOS ----
    # Começa com todos os ativos e vai removendo os que não atendem os critérios
    ativos_validos = lista_ativos.copy()
    selecao_bem_sucedida = False

    for tentativa in range(len(lista_ativos)):
        if len(ativos_validos) <= 1:
            break

        retornos_ativos_validos = retornos_historicos[ativos_validos]

        # Calcula a volatilidade anualizada de cada ativo (em %)
        volatilidade_anualizada = retornos_ativos_validos.std() * (252 ** 0.5) * 100

        # Remove ativos com volatilidade muito baixa (distorcem o cálculo)
        ativos_baixa_volatilidade = volatilidade_anualizada[volatilidade_anualizada < limiar_volatilidade_minima]
        if not ativos_baixa_volatilidade.empty:
            for ativo in ativos_baixa_volatilidade.index:
                if ativo in ativos_validos:
                    ativos_validos.remove(ativo)
            if len(ativos_validos) <= 1:
                selecao_bem_sucedida = False
                break

        if len(ativos_validos) <= 1:
            break

        retornos_ativos_validos = retornos_historicos[ativos_validos]
        matriz_cov = retornos_ativos_validos.cov()

        try:
            # Verifica se a matriz é positiva definida (requisito do cálculo de Cholesky)
            np.linalg.cholesky(matriz_cov)
            selecao_bem_sucedida = True
            break
        except np.linalg.LinAlgError:
            # Matriz não é positiva definida — remove o ativo de menor volatilidade e tenta novamente
            volatilidade_anualizada = retornos_ativos_validos.std()
            ativo_menor_vol = volatilidade_anualizada.idxmin()
            if ativo_menor_vol in ativos_validos:
                ativos_validos.remove(ativo_menor_vol)
            if len(ativos_validos) <= 1:
                selecao_bem_sucedida = False
                break
            if len(ativos_validos) == 2:
                selecao_bem_sucedida = True
                break

    # Sem ativos suficientes, pula o mês
    if not selecao_bem_sucedida or len(ativos_validos) < 2:
        continue

    # Calcula os pesos ótimos da Carteira Eficiente para este mês
    pesos_otimos = calcular_pesos_eficiente(retornos_historicos, ativos_validos, cdi_medio_diario)

    if pesos_otimos is None:
        continue

    # ---- CÁLCULO DO RETORNO ACUMULADO ----

    # Dados diários do mês atual (limitado à data fim da simulação)
    inicio_mes = mes
    fim_mes = mes + pd.offsets.MonthEnd(0)
    fim_periodo = min(fim_mes, data_fim_simulacao)
    dados_mes = tabela_ativos[(tabela_ativos['Data'] >= inicio_mes) & (tabela_ativos['Data'] <= fim_periodo)]

    if dados_mes.empty:
        continue

    # Retornos percentuais diários dos ativos válidos neste mês
    retornos_diarios = dados_mes[ativos_validos].pct_change().fillna(0)

    # Retorno diário da carteira = soma ponderada pelos pesos ótimos
    retorno_carteira_diario = (retornos_diarios * pesos_otimos).sum(axis=1)

    # Acumula o retorno e registra cada dia no resultado
    for data, retorno_do_dia in zip(dados_mes['Data'], retorno_carteira_diario):
        retorno_acumulado *= (1 + retorno_do_dia)
        resultado.append({
            "data": data.strftime('%Y-%m-%d'),
            "valor": float(retorno_acumulado - 1)  # -1 para transformar em % (0.03 = 3%)
        })

resultado`;