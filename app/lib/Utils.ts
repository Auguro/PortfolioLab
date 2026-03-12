export function limparNumero(valor: string): number {
  return parseFloat(valor.replace(",", "."));
}

export function limparData(data: string): string {
  const [dataParte] = data.split(" ");
  const [dia, mes, ano] = dataParte.split("/");
  return `${ano}-${mes}-${dia}`;
}

export async function executarPython(
  pyodide: any,
  codigoPython: string,
  variaveis: Record<string, any>
): Promise<{ data: string; valor: number }[]> {
  for (const [nome, valor] of Object.entries(variaveis)) {
    pyodide.globals.set(nome, pyodide.toPy(valor));
  }
  const resultado = await pyodide.runPythonAsync(codigoPython);
  return resultado.toJs({ create_proxies: false }).map((item: any) => ({
    data: item.data,
    valor: item.valor,
  }));
}