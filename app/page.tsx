import PaginaPrincipal from "./components/PaginaPrincipal";
import { lerCSV } from "./lib/lerDados";
import { lerCDI } from "./lib/lerDados";

export const dynamic = 'force-dynamic';

export default function Home() {
  const dados = lerCSV();
  const cdi = lerCDI();
  const primeiroDia = dados[0] as Record<string, string>;
  const tickers = Object.keys(primeiroDia).filter((col) => col !== "Data");

  return <PaginaPrincipal tickers={tickers} dados={dados} cdi={cdi} />;
}