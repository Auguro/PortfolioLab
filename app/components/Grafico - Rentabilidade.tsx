"use client";
import { useState } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Ponto {
  data: string;
  valor: number;
}

interface ConfigSimulacao {
  dataInicio: string;
  dataFim: string;
}

interface Props {
  dados: {
    cdi: Ponto[] | null;
    paridade: Ponto[] | null;
    eficiente: Ponto[] | null;
  };
  config: ConfigSimulacao | null;
}

const ESTRATEGIAS_CONFIG = [
  { id: "cdi",      label: "CDI",               cor: "var(--amarelo)" },
  { id: "paridade", label: "Paridade de Risco",  cor: "var(--verde)"  },
  { id: "eficiente",label: "Carteira Eficiente", cor: "var(--azul)"   },
];

export default function Grafico({ dados, config }: Props) {
  
  // ---- CARDS ----
  const [valorReferencia, setValorReferencia] = useState(1000);
  
  // ---- CHART DATA ----
  const combined: Record<string, any> = {};

  ESTRATEGIAS_CONFIG.forEach(({ id }) => {
    const serie = dados[id as keyof typeof dados];
    if (serie) {
      serie.forEach((item) => {
        if (!combined[item.data]) combined[item.data] = { data: item.data };
        combined[item.data][id] = item.valor;
      });
    }
  });

  const chartData = Object.values(combined).sort((a, b) =>
    a.data.localeCompare(b.data)
  );

  // ffill
  const lastValues: Record<string, number | null> = { cdi: null, paridade: null, eficiente: null };
  chartData.forEach((item: any) => {
    ESTRATEGIAS_CONFIG.forEach(({ id }) => {
      if (item[id] !== undefined) lastValues[id] = item[id];
      else item[id] = lastValues[id];
    });
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
      
      {/* CARDS */}
      {config && (
        <div style={{ display: "flex", gap: "12px" }}>

          {/* Card Valor de Referência */}
          <div style={{
            flex: 1,
            background: "var(--fundo-card)",
            border: "1px solid var(--borda)",
            borderTop: "3px solid var(--texto-suave)",
            borderRadius: "8px",
            padding: "12px 16px",
          }}>
            <p style={{ color: "var(--texto-suave)", fontSize: "11px", marginBottom: "6px", textTransform: "uppercase" }}>
              Valor de Referência
            </p>
            <input
              type="text"
              value={valorReferencia}
              onChange={(e) => {
                const num = Number(e.target.value.replace(/\D/g, ""));
                if (!isNaN(num)) setValorReferencia(num);
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--texto)",
                fontSize: "20px",
                fontWeight: 700,
                width: "100%",
                outline: "none",
              }}
            />
          </div>

          {/* Cards das estratégias */}
          {ESTRATEGIAS_CONFIG.map(({ id, label, cor }) => {
            const serie = dados[id as keyof typeof dados];
            if (!serie) return null;
            const retorno = serie[serie.length - 1].valor * 100;
            const valorFinal = valorReferencia * (1 + serie[serie.length - 1].valor);
            const positivo = retorno >= 0;
            return (
              <div key={id} style={{
                flex: 1,
                background: "var(--fundo-card)",
                border: "1px solid var(--borda)",
                borderTop: `3px solid ${cor}`,
                borderRadius: "8px",
                padding: "12px 16px",
              }}>
                <p style={{ color: "var(--texto-suave)", fontSize: "11px", marginBottom: "6px", textTransform: "uppercase" }}>
                  {label}
                </p>
                <p style={{ color: positivo ? "var(--verde)" : "var(--vermelho)", fontSize: "20px", fontWeight: 700 }}>
                  {positivo ? "+" : ""}{retorno.toFixed(1)}%
                </p>
                <p style={{ color: "var(--texto-suave)", fontSize: "12px", marginTop: "4px" }}>
                  R$ {valorFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            );
          })}

        </div>
      )}

      {/* GRÁFICO */}
      <div style={{ width: "100%", height: 400 }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--borda)" />
            <XAxis dataKey="data" stroke="var(--texto-suave)" />
            <YAxis stroke="var(--texto-suave)" />
            <Tooltip
              contentStyle={{ background: "var(--fundo-card)", borderColor: "var(--borda)" }}
            />
            <Legend />
            {dados.cdi      && <Line type="monotone" dataKey="cdi"       stroke="var(--amarelo)" name="CDI"               dot={false} />}
            {dados.paridade && <Line type="monotone" dataKey="paridade"  stroke="var(--verde)"   name="Paridade de Risco" dot={false} />}
            {dados.eficiente && <Line type="monotone" dataKey="eficiente" stroke="var(--azul)"    name="Carteira Eficiente" dot={false} />}
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
