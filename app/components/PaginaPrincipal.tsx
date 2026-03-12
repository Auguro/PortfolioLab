"use client";

import { useState } from "react";
import { useEffect, useRef } from "react";
import { executarPython } from "../lib/Utils";

import Cabecalho from "./Cabecalho";
import PainelConfiguracoes from "./PainelConfiguracoes";
import PainelEditores from "./PainelEditores";
import Grafico_aportes from "./Grafico";
import Grafico_rentabilidade from "./Grafico - Rentabilidade";

//codigos
import { codigoCDI } from "../estrategias/cdi";
import { codigoParidade } from "../estrategias/paridade";
import { codigoEficiente } from "../estrategias/eficiente";
import { codigoCDI_rentabilidade } from "../estrategias/cdi - Rentabilidade";
import { codigoParidade_rentabilidade } from "../estrategias/paridade - Rentabilidade";
import { codigoEficiente_rentabilidade } from "../estrategias/eficiente - Rentabilidade";

interface Props {
  tickers: string[];
  dados: Record<string, string>[];
  cdi: Record<string, string>[];
}

export default function PaginaPrincipal({ tickers, dados, cdi }: Props) {
  const [painelAberto, setPainelAberto] = useState(false);
  const [modo, setModo] = useState<"aportes" | "rentabilidade">("aportes");
  
  const [codigos, setCodigos] = useState({
    paridade:  modo === "aportes" ? codigoParidade : codigoParidade_rentabilidade,
    eficiente:  modo === "aportes" ? codigoEficiente : codigoEficiente_rentabilidade,
    cdi:  modo === "aportes" ? codigoCDI : codigoCDI_rentabilidade,
  });
  useEffect(() => {
    setCodigos({
      paridade: modo === "aportes" ? codigoParidade : codigoParidade_rentabilidade,
      eficiente: modo === "aportes" ? codigoEficiente : codigoEficiente_rentabilidade,
      cdi: modo === "aportes" ? codigoCDI : codigoCDI_rentabilidade,
    });
    // 🔽 LIMPA OS RESULTADOS ANTERIORES AO TROCAR DE MODO
    setResultados({ cdi: null, paridade: null, eficiente: null });
  }, [modo]);

  const [configSimulacao, setConfigSimulacao] = useState<{
    aporteInicial: number;
    aportesMensal: number;
    dataInicio: string;
    dataFim: string;
  } | null>(null);

  const [marcados, setMarcados] = useState<string[]>(["cdi", "paridade"]);

  const [resultados, setResultados] = useState<{
    cdi: { data: string; valor: number }[] | null;
    paridade: { data: string; valor: number }[] | null;
    eficiente: { data: string; valor: number }[] | null;
  }>({
    cdi: null,
    paridade: null,
    eficiente: null,
  });

  const pyodideRef = useRef<any>(null);

  useEffect(() => {
    async function carregarPyodide() {
      const pyodide = await (window as any).loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.3/full/"
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

    console.log(codigos);

    try {
      const promessas = marcados.map((id) => ({
        id,
        promessa: executarPython(pyodideRef.current, codigos[id as keyof typeof codigos], variaveis)
      }));

      const resultados = await Promise.all(promessas.map(p => p.promessa));

      const novoResultado: {
        cdi: { data: string; valor: number }[] | null;
        paridade: { data: string; valor: number }[] | null;
        eficiente: { data: string; valor: number }[] | null;
      } = { cdi: null, paridade: null, eficiente: null };

      marcados.forEach((id, i) => {
        novoResultado[id as keyof typeof novoResultado] = resultados[i];
      });

      setConfigSimulacao({
        aporteInicial: config.aporteInicial,
        aportesMensal: config.aportesMensal,
        dataInicio: config.dataInicio,
        dataFim: config.dataFim,
      });

      setResultados(novoResultado);
    } catch (e) {
      console.error("Erro ao executar Python:", e);
    }
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <Cabecalho painelAberto={painelAberto} setPainelAberto={setPainelAberto} />
      <PainelEditores aberto={painelAberto} setPainelAberto={setPainelAberto} codigos={codigos} setCodigos={setCodigos} marcados={marcados} setMarcados={setMarcados} />
      <div style={{ display: "flex" }}>
        <aside style={{ 
          width: "337.5px",
          minHeight: "calc(100vh - 57px)",
          background: "var(--fundo-card)",
          borderRight: "1px solid var(--borda)",
          padding: "20px",
        }}>
          <PainelConfiguracoes tickers={tickers} onSimular={simular} modo={modo} setModo={setModo} />
        </aside>

        {modo === "aportes" && (
          <main style={{ flex: 1, padding: "20px" }}>
            {resultados.cdi || resultados.paridade ? (
              <Grafico_aportes dados={resultados} config={configSimulacao}/>
            ) : (
              <p style={{ color: "var(--texto-suave)" }}>
                Os gráficos vão aparecer aqui
              </p>
            )}
          </main>
        )}

        {modo === "rentabilidade" && (
          <main style={{ flex: 1, padding: "20px" }}>
            {resultados.cdi || resultados.paridade ? (
              <Grafico_rentabilidade dados={resultados} config={configSimulacao}/>
            ) : (
              <p style={{ color: "var(--texto-suave)" }}>
                Os gráficos vão aparecer aqui
              </p>
            )}
          </main>
        )}

      </div>
    </div>
  );
}