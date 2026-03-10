"use client";

import { useState } from "react";
import { simular as executarSimulacao, ResultadoSimulacao } from "../lib/simular";
import { useEffect, useRef } from "react";
import { executarPython } from "../lib/Utils";

import Cabecalho from "./Cabecalho";
import PainelConfiguracoes from "./PainelConfiguracoes";
import PainelEditores from "./PainelEditores";

//codigos
import { codigoCDI } from "../estrategias/cdi.ts";
import { codigoParidade } from "../estrategias/paridade.ts";
import { codigoEficiente } from "../estrategias/eficiente.ts";

interface Props {
  tickers: string[];
  dados: Record<string, string>[];
  cdi: Record<string, string>[];
}

export default function PaginaPrincipal({ tickers, dados, cdi }: Props) {
  const [painelAberto, setPainelAberto] = useState(false);
  const [resultado, setResultado] = useState<ResultadoSimulacao | null>(null);
  const [codigos, setCodigos] = useState({
    paridade: codigoParidade,
    eficiente: codigoEficiente,
    cdi: codigoCDI,
  });

  const pyodideRef = useRef<any>(null);

  useEffect(() => {
    async function carregarPyodide() {
      const pyodide = await (window as any).loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.0/full/"
      });
      await pyodide.loadPackage(["numpy", "scipy", "pandas"]);
      pyodideRef.current = pyodide;
      console.log("Pyodide carregado!");
    }
    carregarPyodide();
  }, []);

  async function simular(config: {
    tickers: string[];
    dataInicio: string;
    dataFim: string;
    aporteInicial: number;
    aportesMensal: number;
  }) {
    if (!pyodideRef.current) {
      console.log("Pyodide ainda carregando...");
      return;
    }

    const variaveis = {
      dados_ativos: dados,
      dados_cdi: cdi,
      tickers: config.tickers,
      data_inicio: config.dataInicio,
      data_fim: config.dataFim,
      aporte_inicial: config.aporteInicial,
      aporte_mensal: config.aportesMensal,
    };

    try {
      const resultadoCDI = await executarPython(
        pyodideRef.current,
        codigos.cdi,
        variaveis
      );
      console.log("CDI:", resultadoCDI.length, "dias");

      const resultadoParidade = await executarPython(
        pyodideRef.current,
        codigos.paridade,
        variaveis
      );
      console.log("Paridade:", resultadoParidade.length, "dias");
      console.log("Último valor Paridade:", resultadoParidade[resultadoParidade.length - 1]);
    } catch (e) {
      console.error("Erro ao executar Python:", e);
    }
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <Cabecalho painelAberto={painelAberto} setPainelAberto={setPainelAberto} />
      <PainelEditores aberto={painelAberto} setPainelAberto={setPainelAberto} codigos={codigos} setCodigos={setCodigos} />
      <div style={{ display: "flex" }}>
        <aside style={{ 
          width: "300px",
          minHeight: "calc(100vh - 57px)",
          background: "var(--fundo-card)",
          borderRight: "1px solid var(--borda)",
          padding: "20px",
        }}>
          <PainelConfiguracoes tickers={tickers} onSimular={simular} />
        </aside>

        <main style={{ 
          flex: 1,
          padding: "20px",
        }}>
          <p style={{ color: "var(--texto-suave)" }}>
            Os gráficos vão aparecer aqui
          </p>
        </main>
      </div>
    </div>
  );
}