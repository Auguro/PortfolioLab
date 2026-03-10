export function limparNumero(valor: string): number {
  return parseFloat(valor.replace(",", "."));
}

export function limparData(data: string): string {
  const [dataParte] = data.split(" ");
  const [dia, mes, ano] = dataParte.split("/");
  return `${ano}-${mes}-${dia}`;
}