export const codigoParidade_rentabilidade = `import pandas as pd
import numpy as np
from scipy.optimize import minimize

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

# Limiar mínimo de volatilidade anualizada (%) para um ativo ser incluído na paridade
# Ativos com volatilidade abaixo disso são excluídos pois distorcem o cálculo
limiar_volatilidade_minima = 13

# =============================================
# FUNÇÕES
# =============================================

# Calcula a contribuição de risco de cada ativo na carteira
# x: pesos dos ativos
# matriz_covariancia: covariância dos retornos
# Retorna: (contribuições de risco individuais, risco total da carteira)
def calcular_contribuicoes_risco(x, matriz_covariancia):
    risco_ponderado = np.dot(matriz_covariancia, x)
    risco_total = np.sqrt(np.dot(x.T, risco_ponderado))
    risco_marginal = risco_ponderado / risco_total if risco_total != 0 else np.zeros_like(risco_ponderado)
    contribuicoes = x * risco_marginal
    return contribuicoes, risco_total

# Função objetivo do otimizador — minimiza a diferença entre as contribuições de risco
# O objetivo é que cada ativo contribua igualmente para o risco total da carteira
def funcao_objetivo(x, matriz_covariancia, vetor_alvo):
    variancia = float(np.dot(x.T, np.dot(matriz_covariancia, x)))
    raiz_variancia = np.sqrt(variancia) if variancia > 0 else 1.0
    pesos_normalizados = x / raiz_variancia
    return 0.5 * np.dot(pesos_normalizados, vetor_alvo / (pesos_normalizados + 1e-18)) - np.dot(vetor_alvo, np.log(pesos_normalizados + 1e-18))

# Resolve o problema de otimização e retorna os pesos ótimos de paridade de risco
# matriz_covariancia: covariância dos retornos dos ativos selecionados
# numero_ativos: quantidade de ativos no mês atual
def resolver_paridade(matriz_covariancia, numero_ativos):
    # Alvo: contribuição igual de risco para todos os ativos (1/n cada)
    vetor_alvo = np.ones(numero_ativos) / numero_ativos
    pesos_iniciais = np.ones(numero_ativos) / numero_ativos

    resultado_otimizacao = minimize(
        funcao_objetivo,
        pesos_iniciais,
        args=(matriz_covariancia, vetor_alvo),
        method='SLSQP',
        bounds=[(1e-19, 1)] * numero_ativos,
        constraints={'type': 'eq', 'fun': lambda x: np.sum(x) - 1.0},
        options={'maxiter': 1000, 'ftol': 1e-9}
    )

    if not resultado_otimizacao.success:
        return None

    return resultado_otimizacao.x

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

    # Calcula os retornos percentuais diários do último ano
    retornos_historicos = dados_ultimo_ano[lista_ativos].pct_change().dropna()
    if retornos_historicos.empty:
        continue

    # ---- SELEÇÃO DE ATIVOS VÁLIDOS ----
    # Começa com todos os ativos e vai removendo os que não atendem os critérios
    ativos_validos = lista_ativos.copy()
    otimizacao_bem_sucedida = False

    for tentativa in range(len(lista_ativos)):
        if len(ativos_validos) <= 1:
            break

        retornos_ativos_validos = retornos_historicos[ativos_validos]

        # Calcula a volatilidade anualizada de cada ativo (em %)
        volatilidade_anualizada = retornos_ativos_validos.std() * (252 ** 0.5) * 100

        # Remove ativos com volatilidade muito baixa (distorcem o solver)
        ativos_baixa_volatilidade = volatilidade_anualizada[volatilidade_anualizada < limiar_volatilidade_minima]
        if not ativos_baixa_volatilidade.empty:
            for ativo in ativos_baixa_volatilidade.index:
                if ativo in ativos_validos:
                    ativos_validos.remove(ativo)
            if len(ativos_validos) <= 1:
                otimizacao_bem_sucedida = False
                break

        if len(ativos_validos) <= 1:
            break

        retornos_ativos_validos = retornos_historicos[ativos_validos]

        # Calcula a matriz de covariância (escalonada por 1e-2 para estabilidade numérica)
        matriz_cov = retornos_ativos_validos.cov().values * 1e-2

        try:
            # Verifica se a matriz é positiva definida (requisito do solver)
            np.linalg.cholesky(matriz_cov)
            otimizacao_bem_sucedida = True
            break
        except np.linalg.LinAlgError:
            # Matriz não é positiva definida — remove o ativo de menor volatilidade e tenta novamente
            if len(ativos_validos) <= 1:
                break
            ativo_menor_vol = volatilidade_anualizada.idxmin()
            if ativo_menor_vol in ativos_validos:
                ativos_validos.remove(ativo_menor_vol)
            if len(ativos_validos) <= 1:
                otimizacao_bem_sucedida = False
                break

    # Sem ativos suficientes, pula o mês
    if not otimizacao_bem_sucedida or len(ativos_validos) < 2:
        continue

    # Recalcula a covariância com os ativos válidos finais
    matriz_cov_final = retornos_historicos[ativos_validos].cov().values * 1e-2

    # Resolve o otimizador e obtém os pesos ótimos de paridade de risco
    pesos_otimos = resolver_paridade(matriz_cov_final, len(ativos_validos))

    if pesos_otimos is None:
        continue

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
