"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  modo: string;
  setModo: (valor: "aportes" | "rentabilidade") => void;
  tickers: string[];
  onSimular: (config: {
    tickers: string[];
    dataInicio: string;
    dataFim: string;
    aporteInicial: number;
    aportesMensal: number;
  }) => Promise<void>;
}

export default function PainelConfiguracoes({ tickers, onSimular, modo, setModo }: Props) {
  const [aporteInicial, setAporteInicial] = useState(1000);
  const [aportesMensal, setAporteMensal] = useState(400);
  const [tickersSelecionados, setTickersSelecionados] = useState<string[]>([]);
  const [dataInicio, setDataInicio] = useState("2018-01-03");
  const [dataFim, setDataFim] = useState("2025-06-10");
  const [filtro, setFiltro] = useState("");
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const sugestoesRef = useRef<HTMLDivElement>(null);

  function toggleTicker(ticker: string) {
    if (tickersSelecionados.includes(ticker)) {
      setTickersSelecionados(tickersSelecionados.filter((t) => t !== ticker));
    } else {
      setTickersSelecionados([...tickersSelecionados, ticker]);
    }
  }

  //Filtrar tickers com base no termo (case insensitive)
  const tickersFiltrados = tickers.filter((t) =>
    t.toLowerCase().includes(filtro.toLowerCase())
  );

  //Ao pressionar Enter, seleciona o primeiro da lista e limpa o filtro
  /*function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && tickersFiltrados.length > 0) {
      toggleTicker(tickersFiltrados[0]);
      setFiltro(""); // limpa o input
    }
  }*/

  // Fecha sugestões ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        sugestoesRef.current &&
        !sugestoesRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setMostrarSugestoes(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtra tickers com base no termo
  const sugestoes = tickers.filter((t) =>
    t.toLowerCase().includes(filtro.toLowerCase())
  );

  function handleSelecionarSugestao(ticker: string) {
    toggleTicker(ticker);
    setFiltro("");
    setMostrarSugestoes(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && sugestoes.length > 0) {
      handleSelecionarSugestao(sugestoes[0]);
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
          Patrimônio
        </button>
        <button
          onClick={() => setModo("rentabilidade")}
          style={{
            flex: 1,
            padding: "10px",
            background: modo === "rentabilidade" ? "var(--fundo-card)" : "var(--fundo)",
            border: "none",
            borderBottom: modo === "rentabilidade" ? "2px solid var(--verde)" : "2px solid transparent",
            color: modo === "rentabilidade" ? "var(--verde)" : "var(--texto-suave)",
            fontSize: "12px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Rentabilidade
        </button>
      </div>

      {/* Campos */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", gap: "10px" }}>
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

          {/* Input de busca com autocomplete */}
          <div style={{ position: "relative", marginBottom: "12px" }}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar ativo..."
              value={filtro}
              onChange={(e) => {
                setFiltro(e.target.value);
                setMostrarSugestoes(true);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setMostrarSugestoes(true)}
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

            {/* Dropdown de sugestões */}
            {mostrarSugestoes && filtro && sugestoes.length > 0 && (
              <div
                ref={sugestoesRef}
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "var(--fundo-card)",
                  border: "1px solid var(--borda)",
                  borderRadius: "6px",
                  marginTop: "4px",
                  maxHeight: "200px",
                  overflowY: "auto",
                  zIndex: 10,
                }}
              >
                {sugestoes.map((ticker) => (
                  <div
                    key={ticker}
                    onClick={() => handleSelecionarSugestao(ticker)}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      color: tickersSelecionados.includes(ticker) ? "#fff" : "var(--texto)",
                      fontSize: "13px",
                      borderBottom: "1px solid var(--borda)",
                      background: tickersSelecionados.includes(ticker)
                        ? "var(--azul)"
                        : "transparent",
                      
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--borda)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = tickersSelecionados.includes(ticker)
                        ? "var(--azul)"
                        : "transparent")
                    }
                  >
                    {ticker}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "3px",
            maxHeight: "300px",
            overflowY: "auto",
            backgroundColor: "var(--fundo)"
          }}>
            {tickers.map((ticker) => (
              <button
                key={ticker}
                onClick={() => {toggleTicker(ticker); setFiltro("")}}
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