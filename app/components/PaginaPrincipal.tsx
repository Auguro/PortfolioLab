"use client";

//react
import { useState } from "react";
import { useEffect, useRef } from "react";

//lib
import { executarPython, executarPythonBruto } from "../lib/Utils";
import { getPyodide } from '../lib/pyodideLoader';

//Components
import Cabecalho from "./Cabecalho";
import PainelConfiguracoes from "./PainelConfiguracoes";
import PainelEditores from "./PainelEditores";
import Grafico_aportes from "./Grafico";
import Grafico_rentabilidade from "./Grafico - Rentabilidade";
import GraficosParidade from "./GraficosParidade";

//estrategias
import { codigoCDI } from "../estrategias/cdi";
import { codigoParidade } from "../estrategias/paridade";
import { codigoEficiente } from "../estrategias/eficiente";
import { codigoCDI_rentabilidade } from "../estrategias/cdi - Rentabilidade";
import { codigoParidade_rentabilidade } from "../estrategias/paridade - Rentabilidade";
import { codigoEficiente_rentabilidade } from "../estrategias/eficiente - Rentabilidade";
import { codigoIngenua_rentabilidade } from "../estrategias/ingenua - Rentabilidade";

interface Props {
  tickers: string[];
  dados: Record<string, string>[];
  cdi: Record<string, string>[];
}

function normalizarAlocacao(raw: any): { data: string; pesos: Record<string, number> }[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item: any) => {
    const data = item instanceof Map ? item.get("data") : item?.data;
    const pesosRaw = item instanceof Map ? item.get("pesos") : item?.pesos;
    const pesos: Record<string, number> = {};

    if (pesosRaw instanceof Map) {
      pesosRaw.forEach((v: any, k: any) => {
        pesos[String(k)] = Number(v);
      });
    } else if (pesosRaw && typeof pesosRaw === "object") {
      Object.entries(pesosRaw).forEach(([k, v]) => {
        pesos[String(k)] = Number(v);
      });
    }

    return { data: String(data ?? ""), pesos };
  }).filter((p) => p.data);
}

export default function PaginaPrincipal({ tickers, dados, cdi }: Props) {
  const [painelAberto, setPainelAberto] = useState(false);
  const [modo, setModo] = useState<"aportes" | "rentabilidade">("rentabilidade");
  
  const [codigos, setCodigos] = useState({
    paridade:  modo === "aportes" ? codigoParidade : codigoParidade_rentabilidade,
    eficiente:  modo === "aportes" ? codigoEficiente : codigoEficiente_rentabilidade,
    cdi:  modo === "aportes" ? codigoCDI : codigoCDI_rentabilidade,
    ingenua: codigoIngenua_rentabilidade,
  });
  useEffect(() => {
    setCodigos({
      paridade: modo === "aportes" ? codigoParidade : codigoParidade_rentabilidade,
      eficiente: modo === "aportes" ? codigoEficiente : codigoEficiente_rentabilidade,
      cdi: modo === "aportes" ? codigoCDI : codigoCDI_rentabilidade,
      ingenua: codigoIngenua_rentabilidade,
    });
    // 🔽 LIMPA OS RESULTADOS ANTERIORES AO TROCAR DE MODO
    setResultados({ cdi: null, paridade: null, eficiente: null, ingenua: null });
    setAlocacaoParidade([]);
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
    ingenua: { data: string; valor: number }[] | null;
  }>({
    cdi: null,
    paridade: null,
    eficiente: null,
    ingenua: null,
  });
  const [alocacaoParidade, setAlocacaoParidade] = useState<{ data: string; pesos: Record<string, number> }[]>([]);

  const pyodideRef = useRef<any>(null);

  useEffect(() => {
    getPyodide().then((pyodide) => {
      pyodideRef.current = pyodide;
      console.log("Pyodide carregado!");
    });
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
      modo_retorno: "serie",
    };

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
        ingenua: { data: string; valor: number }[] | null;
      } = { cdi: null, paridade: null, eficiente: null, ingenua: null };

      marcados.forEach((id, i) => {
        novoResultado[id as keyof typeof novoResultado] = resultados[i];
      });

      if (marcados.includes("paridade")) {
        const rawAlocacao = await executarPythonBruto(pyodideRef.current, codigos.paridade, { ...variaveis, modo_retorno: "alocacao" });
        setAlocacaoParidade(normalizarAlocacao(rawAlocacao));
      } else {
        setAlocacaoParidade([]);
      }

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
      <PainelEditores aberto={painelAberto} setPainelAberto={setPainelAberto} codigos={codigos} setCodigos={setCodigos} marcados={marcados} setMarcados={setMarcados} modo={modo} />
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
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <Grafico_aportes dados={resultados} config={configSimulacao}/>
              {marcados.includes("paridade") ? (
                <GraficosParidade alocacao={alocacaoParidade} />
              ) : null}
            </div>
          </main>
        )}

        {modo === "rentabilidade" && (
          <main style={{ flex: 1, padding: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <Grafico_rentabilidade dados={resultados} config={configSimulacao}/>
              {marcados.includes("paridade") ? (
                <GraficosParidade alocacao={alocacaoParidade} />
              ) : null}
            </div>
          </main>
        )}

      </div>
    </div>
  );
}