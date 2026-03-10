"use client";

import { useState } from "react";
import Cabecalho from "./Cabecalho";
import PainelConfiguracoes from "./PainelConfiguracoes";
import PainelEditores from "./PainelEditores";
import { simular as executarSimulacao, ResultadoSimulacao } from "../lib/simular";

interface Props {
  tickers: string[];
  dados: Record<string, string>[];
  cdi: Record<string, string>[];
}

export default function PaginaPrincipal({ tickers, dados, cdi }: Props) {
  const [painelAberto, setPainelAberto] = useState(false);
  const [resultado, setResultado] = useState<ResultadoSimulacao | null>(null);
  const [codigos, setCodigos] = useState({
    paridade: `function paridadeDeRisco(dados, aporteInicial, aportesMensal) {\n  // Edite sua estratégia aqui\n}`,
    eficiente: `function carteiraEficiente(dados, aporteInicial, aportesMensal) {\n  // Edite sua estratégia aqui\n}`,
    cdi: `function cdi(dados, aporteInicial, aportesMensal) {\n  // Edite sua estratégia aqui\n}`,
  });

  function simular(config: {
    tickers: string[];
    dataInicio: string;
    dataFim: string;
    aporteInicial: number;
    aportesMensal: number;
  }) {
    const res = executarSimulacao(
      { ...config, estrategias: { cdi: true, paridade: false } },
      dados,
      cdi
    );
    setResultado(res);
    console.log("CDI:", res.cdi?.length, "dias");
    console.log("Último valor CDI:", res.cdi?.[res.cdi.length - 1]);
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