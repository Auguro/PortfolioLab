/**
 * lib/stock-data.ts
 *
 * Funções para buscar dados de preços do Supabase.
 * Substitui as leituras diretas de CSV.
 *
 * Uso:
 *   import { getHistoricalPrices, getLatestPrices, getTickers } from "@/lib/stock-data"
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface PriceRow {
  ticker: string;
  date: string;       // "YYYY-MM-DD"
  close_price: number;
}

export interface WideRow {
  date: string;
  [ticker: string]: string | number;
}

// ─── Client (somente leitura — anon key) ─────────────────────────────────────
function getClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ─── Buscar lista de tickers disponíveis ─────────────────────────────────────
export async function getTickers(): Promise<string[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("stock_prices")
    .select("ticker")
    .order("ticker");

  if (error) throw new Error(error.message);

  // deduplica
  return [...new Set((data ?? []).map((r) => r.ticker))];
}

// ─── Série histórica de um ticker ────────────────────────────────────────────
export async function getTickerHistory(
  ticker: string,
  from?: string, // "YYYY-MM-DD"
  to?: string
): Promise<PriceRow[]> {
  const supabase = getClient();

  let query = supabase
    .from("stock_prices")
    .select("ticker, date, close_price")
    .eq("ticker", ticker)
    .order("date", { ascending: true });

  if (from) query = query.gte("date", from);
  if (to)   query = query.lte("date", to);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ─── Múltiplos tickers em formato wide (igual ao CSV original) ───────────────
// Útil para passar para componentes que esperam o formato do CSV.
export async function getWideData(
  tickers: string[],
  from?: string,
  to?: string
): Promise<WideRow[]> {
  const supabase = getClient();

  let query = supabase
    .from("stock_prices")
    .select("ticker, date, close_price")
    .in("ticker", tickers)
    .order("date", { ascending: true });

  if (from) query = query.gte("date", from);
  if (to)   query = query.lte("date", to);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // Pivot: long → wide
  const map = new Map<string, WideRow>();
  for (const row of data ?? []) {
    if (!map.has(row.date)) map.set(row.date, { date: row.date });
    map.get(row.date)![row.ticker] = row.close_price;
  }

  return Array.from(map.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

// ─── Último preço de todos os tickers (view latest_prices) ───────────────────
export async function getLatestPrices(): Promise<PriceRow[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("latest_prices")
    .select("ticker, date, close_price")
    .order("ticker");

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ─── Data da última atualização ───────────────────────────────────────────────
export async function getLastUpdateDate(): Promise<string | null> {
  const supabase = getClient();
  const { data } = await supabase
    .from("update_log")
    .select("ran_at, status")
    .eq("status", "success")
    .order("ran_at", { ascending: false })
    .limit(1)
    .single();

  return data?.ran_at ?? null;
}
