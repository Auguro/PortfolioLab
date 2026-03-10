"use client";

import { useState } from "react";

interface Props {
  aberto: boolean;
  setPainelAberto: (valor: boolean) => void;
  codigos: { paridade: string; eficiente: string; cdi: string };
  setCodigos: (codigos: { paridade: string; eficiente: string; cdi: string }) => void;
}

const ESTRATEGIAS = [
  {
    id: "paridade",
    titulo: "Paridade de Risco"
  },
  {
    id: "eficiente",
    titulo: "Carteira Eficiente"
  },
  {
    id: "cdi",
    titulo: "CDI"
  },
];

export default function PainelEditores({ aberto, setPainelAberto, codigos, setCodigos }: Props) {
  const [abertos, setAbertos] = useState<string[]>([]);

  function toggleEditor(id: string) {
    if (abertos.includes(id)) {
      setAbertos(abertos.filter((a) => a !== id));
    } else {
      setAbertos([...abertos, id]);
    }
  }

  if (!aberto) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      width: "500px",
      height: "100vh",
      background: "var(--fundo-card)",
      borderLeft: "1px solid var(--borda)",
      padding: "20px",
      zIndex: 100,
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: "12px"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ color: "var(--texto-suave)", fontSize: "12px" }}>
          EDITORES DE ESTRATÉGIA
        </p>
        <button
          onClick={() => setPainelAberto(false)}
          style={{
            background: "none",
            border: "1px solid var(--borda)",
            borderRadius: "6px",
            padding: "8px",
            cursor: "pointer",
            color: "var(--texto)",
            fontSize: "14px"
          }}
        >
          ✕
        </button>
      </div>

      {ESTRATEGIAS.map((estrategia) => (
        <div key={estrategia.id} style={{ border: "1px solid var(--borda)", borderRadius: "6px", overflow: "hidden" }}>
          <button
            onClick={() => toggleEditor(estrategia.id)}
            style={{
              width: "100%",
              padding: "12px",
              background: "var(--fundo)",
              border: "none",
              cursor: "pointer",
              color: "var(--texto)",
              fontSize: "13px",
              fontWeight: "bold",
              textAlign: "left",
              display: "flex",
              justifyContent: "space-between"
            }}
          >
            {estrategia.titulo}
            <span>{abertos.includes(estrategia.id) ? "▲" : "▼"}</span>
          </button>

          {abertos.includes(estrategia.id) && (
            <textarea
              value={codigos[estrategia.id as keyof typeof codigos]}
              onChange={(e) => setCodigos({ ...codigos, [estrategia.id]: e.target.value })}
              style={{
                width: "100%",
                minHeight: "200px",
                background: "var(--fundo)",
                color: "var(--texto)",
                border: "none",
                borderTop: "1px solid var(--borda)",
                padding: "12px",
                fontSize: "12px",
                fontFamily: "monospace",
                resize: "vertical",
                outline: "none"
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}