"use client";

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
  aporteInicial: number;
  aportesMensal: number;
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

function calcularMeses(dataInicio: string, dataFim: string): number {
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);
  return (fim.getFullYear() - inicio.getFullYear()) * 12 + (fim.getMonth() - inicio.getMonth());
}

function calcularValorInvestido(config: ConfigSimulacao): number {
  const meses = calcularMeses(config.dataInicio, config.dataFim);
  return config.aporteInicial + config.aportesMensal * Math.max(0, meses - 1);
}

function calcularRetorno(serie: Ponto[], valorInvestido: number): number {
  const valorFinal = serie[serie.length - 1].valor;
  return ((valorFinal - valorInvestido) / valorInvestido) * 100;
}

const ESTRATEGIAS_CONFIG = [
  { id: "cdi",      label: "CDI",               cor: "var(--amarelo)" },
  { id: "paridade", label: "Paridade de Risco",  cor: "var(--verde)"  },
  { id: "eficiente",label: "Carteira Eficiente", cor: "var(--azul)"   },
];

export default function Grafico({ dados, config }: Props) {
  
  // ---- CARDS ----
  const valorInvestido = config ? calcularValorInvestido(config) : null;

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

          {/* Card Valor Investido */}
          <div style={{
            flex: 1,
            background: "var(--fundo-card)",
            border: "1px solid var(--borda)",
            borderTop: "3px solid var(--texto-suave)",
            borderRadius: "8px",
            padding: "12px 16px",
          }}>
            <p style={{ color: "var(--texto-suave)", fontSize: "11px", marginBottom: "6px", textTransform: "uppercase" }}>
              Valor Investido
            </p>
            <p style={{ color: "var(--texto)", fontSize: "20px", fontWeight: 700 }}>
              R$ {valorInvestido!.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Cards das estratégias marcadas */}
          {ESTRATEGIAS_CONFIG.map(({ id, label, cor }) => {
            const serie = dados[id as keyof typeof dados];
            if (!serie) return null;
            const valorFinal = serie[serie.length - 1].valor;
            const retorno = calcularRetorno(serie, valorInvestido!);
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
