"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface AlocacaoPonto {
  data: string;
  pesos: Record<string, number>;
}

interface Props {
  alocacao: AlocacaoPonto[];
}

const CORES = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

export default function GraficosParidade({ alocacao }: Props) {
  if (!alocacao.length) return null;

  const ultimo = alocacao[alocacao.length - 1];
  const ativos = Object.keys(ultimo.pesos);

  const pieData = ativos
    .map((ativo) => ({ name: ativo, value: (ultimo.pesos[ativo] ?? 0) * 100 }))
    .filter((item) => item.value > 0);

  const evolucaoData = alocacao.map((linha) => {
    const row: Record<string, string | number> = { data: linha.data };
    ativos.forEach((ativo) => {
      row[ativo] = (linha.pesos[ativo] ?? 0) * 100;
    });
    return row;
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
      <div style={{ background: "var(--fundo-card)", border: "1px solid var(--borda)", borderRadius: "8px", padding: "12px" }}>
        <p style={{ color: "var(--texto)", fontWeight: 700, marginBottom: "10px" }}>Alocação Atual - Paridade de Risco</p>
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} label={({ name, value }) => `${name}: ${(value as number).toFixed(1)}%`}>
                {pieData.map((_, index) => (
                  <Cell key={index} fill={CORES[index % CORES.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: "var(--fundo-card)", border: "1px solid var(--borda)", borderRadius: "8px", padding: "12px" }}>
        <p style={{ color: "var(--texto)", fontWeight: 700, marginBottom: "10px" }}>Evolução da Alocação (%)</p>
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <BarChart data={evolucaoData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--borda)" />
              <XAxis
                dataKey="data"
                stroke="var(--texto-suave)"
                tickFormatter={(value) => {
                  const [ano, mes] = value.split("-");
                  return `${new Date(Number(ano), Number(mes) - 1, 1).toLocaleString("en", { month: "short" })}/${ano.slice(-2)}`;
                }}
              />
              <YAxis stroke="var(--texto-suave)" domain={[0, 100]} />
              <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
              <Legend />
              {ativos.map((ativo, index) => (
                <Bar key={ativo} dataKey={ativo} stackId="a" fill={CORES[index % CORES.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
