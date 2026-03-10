import Papa from "papaparse";
import fs from "fs";
import path from "path";

export function lerCSV(): Record<string, string>[] {
  const caminhoArquivo = path.join(process.cwd(), "dados", "Dados_Ativos_B3_AdjClose.csv");
  const conteudo = fs.readFileSync(caminhoArquivo, "utf-8");
  
  const resultado = Papa.parse<Record<string, string>>(conteudo, {
    header: true,
    skipEmptyLines: true,
  });

  return resultado.data;
}

export function lerCDI(): Record<string, string>[] {
  const caminhoArquivo = path.join(process.cwd(), "dados", "cdi_data_total.csv");
  const conteudo = fs.readFileSync(caminhoArquivo, "utf-8");
  
  const resultado = Papa.parse<Record<string, string>>(conteudo, {
    header: true,
    skipEmptyLines: true,
  });

  return resultado.data;
}