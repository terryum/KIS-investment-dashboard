import { NextResponse, type NextRequest } from 'next/server';
import { withCronAuth } from '@/lib/auth/cron';
import { supabaseAdmin } from '@/lib/supabase/server';

const KOREAEXIM_API_URL = 'https://www.koreaexim.go.kr/site/program/financial/exchangeJSON';
const TARGET_CURRENCIES = ['USD', 'EUR', 'JPY', 'CNY', 'GBP'];

/**
 * POST /api/cron/sync-exchange-rates
 * Cron: Fetch and save current exchange rates from Korea Eximbank.
 */
export async function POST(request: NextRequest) {
  const authError = withCronAuth(request);
  if (authError) return authError;

  try {
    const apiKey = process.env.KOREAEXIM_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'KOREAEXIM_API_KEY not configured' },
        { status: 500 },
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const searchDate = today.replace(/-/g, '');

    const res = await fetch(
      `${KOREAEXIM_API_URL}?authkey=${apiKey}&searchdate=${searchDate}&data=AP01`,
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch exchange rates from Korea Eximbank' },
        { status: 502 },
      );
    }

    const rates = await res.json();

    if (!Array.isArray(rates) || rates.length === 0) {
      return NextResponse.json({
        data: { message: 'No rates available (holiday or weekend)', saved: 0 },
      });
    }

    const rows = [];
    for (const rate of rates) {
      // cur_unit: "USD", "JPY(100)", "EUR", "CNH", etc.
      const curUnit = rate.cur_unit as string;
      let currency = curUnit.replace(/\(\d+\)/, '').trim();

      // Map CNH (offshore) to CNY
      if (currency === 'CNH') currency = 'CNY';

      if (!TARGET_CURRENCIES.includes(currency)) continue;

      // deal_bas_r: base rate, e.g., "1,330.50"
      const rateValue = parseFloat((rate.deal_bas_r as string).replace(/,/g, ''));

      // JPY is quoted per 100, normalize to per 1
      const normalizedRate = curUnit.includes('(100)') ? rateValue / 100 : rateValue;

      if (isNaN(normalizedRate) || normalizedRate <= 0) continue;

      rows.push({
        date: today,
        currency,
        rate: normalizedRate,
        source: 'koreaexim',
      });
    }

    if (rows.length > 0) {
      const { error } = await supabaseAdmin
        .from('exchange_rates')
        .upsert(rows, { onConflict: 'date,currency' });

      if (error) {
        return NextResponse.json(
          { error: 'Failed to save exchange rates' },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      data: { date: today, saved: rows.length },
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
