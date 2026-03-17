/**
 * app/api/cron/update-prices/route.ts
 *
 * Cron job diário: busca o fechamento de todos os ativos B3
 * via yahoo-finance2 e faz upsert no Supabase.
 *
 * Agendado pelo Vercel Cron (vercel.json) para rodar às 19h BRT
 * (22:00 UTC) em dias de semana — após o fechamento da B3 (18h BRT).
 *
 * Proteção: apenas o Vercel Cron pode chamar esta rota
 * (header CRON_SECRET verificado).
 */

import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance();
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface PriceRow {
  ticker: string;
  date: string;
  close_price: number;
}

interface LogRow {
  status: string;
  tickers_ok: number;
  tickers_err: number;
  rows_inserted: number;
  message: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = SupabaseClient<any, any, any>;

// ─── Ativos monitorados (mesma lista do seu CSV) ─────────────────────────────
const TICKERS_B3 = [
  "ALOS3", "ABEV3", "ASAI3", "AURE3", "AMOB3", "AZUL4", "AZZA3", "B3SA3",
  "BBSE3", "BBDC3", "BBDC4", "BRAP4", "BBAS3", "BRKM5", "BRAV3", "BRFS3",
  "BPAC11", "CXSE3", "CRFB3", "CCRO3", "CMIG4", "COGN3", "CPLE6", "CSAN3",
  "CPFE3", "CMIN3", "CVCB3", "CYRE3", "ELET3", "ELET6", "EMBR3", "ENGI11",
  "ENEV3", "EGIE3", "EQTL3", "FLRY3", "GGBR4", "GOAU4", "NTCO3", "HAPV3",
  "HYPE3", "IGTI11", "IRBR3", "ISAE4", "ITSA4", "ITUB4", "JBSS3", "KLBN11",
  "RENT3", "LREN3", "LWSA3", "MGLU3", "POMO4", "MRFG3", "BEEF3", "MRVE3",
  "MULT3", "PCAR3", "PETR3", "PETR4", "RECV3", "PRIO3", "PETZ3", "PSSA3",
  "RADL3", "RAIZ4", "RDOR3", "RAIL3", "SBSP3", "SANB11", "STBP3", "SMTO3",
  "CSNA3", "SLCE3", "SUZB3", "TAEE11", "VIVT3", "TIMS3", "TOTS3", "UGPA3",
  "USIM5", "VALE3", "VAMO3", "VBBR3", "VIVA3", "WEGE3", "YDUQ3",
];

const toYahooTicker = (t: string) => `${t}.SA`;

// ─── Supabase client (service_role — permissão de escrita) ───────────────────
function getSupabase(): AnySupabase {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Supabase env vars não configuradas");
  return createClient(url, key);
}

// ─── Handler principal ───────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayStr = today.toISOString().split("T")[0];
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  let tickersOk = 0;
  let tickersErr = 0;
  const rowsToInsert: PriceRow[] = [];
  const errors: string[] = [];

  for (const ticker of TICKERS_B3) {
    try {
      const result = await yahooFinance.historical(toYahooTicker(ticker), {
        period1: todayStr,
        period2: tomorrowStr,
      }) as any[];

      const price = result[0]?.adjClose;

      if (!price || isNaN(price)) {
        throw new Error(`Preço inválido: ${price}`);
      }

      rowsToInsert.push({
        ticker,
        date: todayStr,
        close_price: Math.round(price * 10000) / 10000,
      });

      tickersOk++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${ticker}: ${msg}`);
      tickersErr++;
    }

    await sleep(120);
  }

  // ── Upsert no Supabase ───────────────────────────────────────────────────
  let rowsInserted = 0;
  if (rowsToInsert.length > 0) {
    const { error: upsertError, count } = await supabase
      .from("stock_prices")
      .upsert(rowsToInsert, { onConflict: "ticker,date", count: "exact" });

    if (upsertError) {
      await logUpdate(supabase, "error", tickersOk, tickersErr, 0,
        `Upsert falhou: ${upsertError.message}`);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }
    rowsInserted = count ?? rowsToInsert.length;
  }

  // ── Log ───────────────────────────────────────────────────────────────────
  const status =
    tickersErr === 0 ? "success" :
    tickersErr === TICKERS_B3.length ? "error" : "partial";

  await logUpdate(
    supabase, status, tickersOk, tickersErr, rowsInserted,
    errors.length > 0 ? errors.slice(0, 5).join(" | ") : null
  );

  return NextResponse.json({
    status,
    date: today,
    tickers_ok: tickersOk,
    tickers_err: tickersErr,
    rows_inserted: rowsInserted,
    errors: errors.slice(0, 10),
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function logUpdate(
  supabase: AnySupabase,
  status: string,
  tickersOk: number,
  tickersErr: number,
  rowsInserted: number,
  message: string | null
) {
  const row: LogRow = {
    status,
    tickers_ok: tickersOk,
    tickers_err: tickersErr,
    rows_inserted: rowsInserted,
    message,
  };
  await supabase.from("update_log").insert(row);
}