"use client";

import { useState } from "react";

interface Props {
  tickers: string[];
  onSimular: (config: {
    tickers: string[];
    dataInicio: string;
    dataFim: string;
    aporteInicial: number;
    aportesMensal: number;
  }) => Promise<void>;
}

export default function PainelConfiguracoes({ tickers, onSimular }: Props) {
  const [aporteInicial, setAporteInicial] = useState(1000);
  const [aportesMensal, setAporteMensal] = useState(400);
  const [tickersSelecionados, setTickersSelecionados] = useState<string[]>([]);
  const [dataInicio, setDataInicio] = useState("2019-01-02");
  const [dataFim, setDataFim] = useState("2025-03-01");
  const [modo, setModo] = useState<"aportes" | "volatilidade">("aportes");

  function toggleTicker(ticker: string) {
    if (tickersSelecionados.includes(ticker)) {
      setTickersSelecionados(tickersSelecionados.filter((t) => t !== ticker));
    } else {
      setTickersSelecionados([...tickersSelecionados, ticker]);
    }
  }

  return (
    <>
      {/* Navbar de modo */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--borda)", marginBottom: "20px" }}>
        <button
          onClick={() => setModo("aportes")}
          style={{
            flex: 1,
            padding: "10px",
            background: modo === "aportes" ? "var(--fundo-card)" : "var(--fundo)",
            border: "none",
            borderBottom: modo === "aportes" ? "2px solid var(--verde)" : "2px solid transparent",
            color: modo === "aportes" ? "var(--verde)" : "var(--texto-suave)",
            fontSize: "12px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Aportes
        </button>
        <button
          onClick={() => setModo("volatilidade")}
          style={{
            flex: 1,
            padding: "10px",
            background: modo === "volatilidade" ? "var(--fundo-card)" : "var(--fundo)",
            border: "none",
            borderBottom: modo === "volatilidade" ? "2px solid var(--verde)" : "2px solid transparent",
            color: modo === "volatilidade" ? "var(--verde)" : "var(--texto-suave)",
            fontSize: "12px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Volatilidade
        </button>
      </div>

      {/* Campos */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <p style={{ color: "var(--texto-suave)", fontSize: "11px", marginBottom: "8px" }}>
            DATA INÍCIO
          </p>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              background: "var(--fundo)",
              border: "1px solid var(--borda)",
              borderRadius: "6px",
              color: "var(--texto)",
              fontSize: "14px"
            }}
          />
        </div>

        <div>
          <p style={{ color: "var(--texto-suave)", fontSize: "11px", marginBottom: "8px" }}>
            DATA FIM
          </p>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              background: "var(--fundo)",
              border: "1px solid var(--borda)",
              borderRadius: "6px",
              color: "var(--texto)",
              fontSize: "14px"
            }}
          />
        </div>

        {/* Campos só do modo Aportes */}
        {modo === "aportes" && (
          <>
            <div>
              <p style={{ color: "var(--texto-suave)", fontSize: "11px", marginBottom: "8px" }}>
                APORTE INICIAL
              </p>
              <input
                type="number"
                value={aporteInicial}
                onChange={(e) => setAporteInicial(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "var(--fundo)",
                  border: "1px solid var(--borda)",
                  borderRadius: "6px",
                  color: "var(--texto)",
                  fontSize: "14px"
                }}
              />
            </div>

            <div>
              <p style={{ color: "var(--texto-suave)", fontSize: "11px", marginBottom: "8px" }}>
                APORTE MENSAL
              </p>
              <input
                type="number"
                value={aportesMensal}
                onChange={(e) => setAporteMensal(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "var(--fundo)",
                  border: "1px solid var(--borda)",
                  borderRadius: "6px",
                  color: "var(--texto)",
                  fontSize: "14px"
                }}
              />
            </div>
          </>
        )}

        <div>
          <p style={{ color: "var(--texto-suave)", fontSize: "11px", marginBottom: "8px" }}>
            ATIVOS ({tickersSelecionados.length} selecionados)
          </p>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            maxHeight: "300px",
            overflowY: "auto",
            backgroundColor: "var(--fundo)"
          }}>
            {tickers.map((ticker) => (
              <button
                key={ticker}
                onClick={() => toggleTicker(ticker)}
                style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  cursor: "pointer",
                  border: "1px solid var(--borda)",
                  width: "70px",
                  textAlign: "center",
                  background: tickersSelecionados.includes(ticker) ? "var(--azul)" : "var(--fundo)",
                  color: tickersSelecionados.includes(ticker) ? "#fff" : "var(--texto-suave)",
                  fontWeight: tickersSelecionados.includes(ticker) ? "bold" : "normal",
                }}
              >
                {ticker}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => onSimular({
            tickers: tickersSelecionados,
            dataInicio,
            dataFim,
            aporteInicial,
            aportesMensal,
          })}
          style={{
            width: "100%",
            padding: "12px",
            background: "var(--verde)",
            color: "#000",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Simular
        </button>
      </div>
    </>
  );
}