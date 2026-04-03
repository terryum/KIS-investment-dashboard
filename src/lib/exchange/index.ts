import { supabaseAdmin } from '@/lib/supabase/server';
import { getLastBusinessDay } from '@/lib/utils/date';

const EXIMBANK_API_URL = 'https://www.koreaexim.go.kr/site/program/financial/exchangeJSON';

interface EximBankRate {
  cur_unit: string;    // currency code (e.g., "USD")
  deal_bas_r: string;  // base rate (e.g., "1,350.5")
  cur_nm: string;      // currency name
}

/**
 * Fetch exchange rates from Korea Eximbank API.
 * Falls back to last business day if weekend/holiday returns empty.
 */
export async function fetchExchangeRates(
  date?: Date,
): Promise<{ currency: string; rate: number; date: string }[]> {
  const apiKey = process.env.EXIMBANK_API_KEY;
  if (!apiKey) throw new Error('EXIMBANK_API_KEY not configured');

  const targetDate = date ?? new Date();

  // Try the given date first, then fall back to last business day
  for (let attempt = 0; attempt < 5; attempt++) {
    const tryDate =
      attempt === 0 ? targetDate : getLastBusinessDay(targetDate, attempt);
    const dateStr = formatDateParam(tryDate);

    const url = `${EXIMBANK_API_URL}?authkey=${apiKey}&searchdate=${dateStr}&data=AP01`;
    const res = await fetch(url);
    if (!res.ok) continue;

    const data = (await res.json()) as EximBankRate[];
    if (!Array.isArray(data) || data.length === 0) continue;

    return data
      .filter((item) => item.cur_unit && item.deal_bas_r)
      .map((item) => ({
        currency: item.cur_unit.replace(/\(.*\)/, '').trim(),
        rate: parseFloat(item.deal_bas_r.replace(/,/g, '')),
        date: dateStr,
      }));
  }

  return [];
}

/**
 * Get exchange rate for a specific currency.
 * Checks DB cache first, then fetches from API if needed.
 */
export async function getExchangeRate(
  currency: string,
  date?: Date,
): Promise<number | null> {
  const targetDate = date ?? new Date();
  const dateStr = formatDateParam(targetDate);

  // Check DB cache
  const { data: cached } = await supabaseAdmin
    .from('exchange_rates')
    .select('rate')
    .eq('currency', currency)
    .eq('date', dateStr)
    .single();

  if (cached) return cached.rate;

  // Fetch and cache
  const rates = await fetchExchangeRates(targetDate);
  if (rates.length === 0) return null;

  // Upsert all rates
  await supabaseAdmin.from('exchange_rates').upsert(
    rates.map((r) => ({
      date: r.date,
      currency: r.currency,
      rate: r.rate,
      source: 'koreaexim',
    })),
    { onConflict: 'date,currency' },
  );

  const match = rates.find((r) => r.currency === currency);
  return match?.rate ?? null;
}

function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}
