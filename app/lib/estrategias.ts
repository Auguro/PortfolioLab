import { limparNumero, limparData } from "./Utils";

export function calcularCDI(
  dadosCDI: Record<string, string>[],
  dataInicio: string,
  dataFim: string,
  aporteInicial: number,
  aportesMensal: number
): { data: string; valor: number }[] {
  const resultado: { data: string; valor: number }[] = [];
  let saldo = 0;

  // Agrupa CDI por mês
  const meses = gerarMeses(dataInicio, dataFim);

  for (let i = 0; i < meses.length; i++) {
    const mes = meses[i];
    const aporte = i === 0 ? aporteInicial : aportesMensal;
    saldo += aporte;

    // Filtra dias do CDI dentro desse mês
    const diasCDI = dadosCDI.filter((linha) => {
      const data = limparData(linha["data"]);
      return data >= mes.inicio && data <= mes.fim;
    });

    for (const dia of diasCDI) {
      const rendimento = limparNumero(dia["valor"]) / 100;
      saldo *= (1 + rendimento);
      resultado.push({ data: limparData(dia["data"]), valor: saldo });
    }
  }

  return resultado;
}

// Gera array de meses entre dataInicio e dataFim
function gerarMeses(dataInicio: string, dataFim: string) {
  const meses = [];
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);

  const atual = new Date(inicio.getFullYear(), inicio.getMonth(), 1);

  while (atual <= fim) {
    const anoMes = atual.getFullYear();
    const mes = atual.getMonth();

    const inicioMes = new Date(anoMes, mes, 1).toISOString().slice(0, 10);
    const fimMes = new Date(anoMes, mes + 1, 0).toISOString().slice(0, 10);

    meses.push({ inicio: inicioMes, fim: fimMes });
    atual.setMonth(atual.getMonth() + 1);
  }

  return meses;
}