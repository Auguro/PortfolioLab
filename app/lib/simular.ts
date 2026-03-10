import { calcularCDI } from "./estrategias";

export interface ConfigSimulacao {
  tickers: string[];
  dataInicio: string;
  dataFim: string;
  aporteInicial: number;
  aportesMensal: number;
  estrategias: {
    cdi: boolean;
    paridade: boolean;
  };
}

export interface ResultadoSimulacao {
  cdi:      { data: string; valor: number }[] | null;
  paridade: { data: string; valor: number }[] | null;
}

export function simular(
  config: ConfigSimulacao,
  dados: Record<string, string>[],
  dadosCDI: Record<string, string>[]
): ResultadoSimulacao {
  const resultado: ResultadoSimulacao = {
    cdi:      null,
    paridade: null,
  };

  if (config.estrategias.cdi) {
    resultado.cdi = calcularCDI(
      dadosCDI,
      config.dataInicio,
      config.dataFim,
      config.aporteInicial,
      config.aportesMensal
    );
  }

  // paridade virá aqui em breve

  return resultado;
}