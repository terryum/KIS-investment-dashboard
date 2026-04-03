import { NextResponse, type NextRequest } from 'next/server';
import { withCronAuth } from '@/lib/auth/cron';
import { AccountManager, sanitizeError } from '@/lib/kis';
import { supabaseAdmin } from '@/lib/supabase/server';

const KIS_BASE_URL = 'https://openapi.koreainvestment.com:9443';

/**
 * POST /api/cron/detect-income
 * Cron: Detect new dividends/interest income across all accounts.
 * Checks domestic rights (CTRGA011R) and overseas rights (CTRGT011R).
 */
export async function POST(request: NextRequest) {
  const authError = withCronAuth(request);
  if (authError) return authError;

  try {
    const manager = new AccountManager(supabaseAdmin);
    const accounts = await manager.getActiveAccounts();

    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const fromDate = thirtyDaysAgo.toISOString().split('T')[0].replace(/-/g, '');
    const toDate = today.toISOString().split('T')[0].replace(/-/g, '');

    let detectedCount = 0;

    for (const account of accounts) {
      const client = await manager.createClient(account);
      const [cano, productCode] = account.account_no.split('-');

      // Domestic rights (dividends)
      try {
        const domesticParams = new URLSearchParams({
          CANO: cano,
          ACNT_PRDT_CD: productCode,
          INQR_STRT_DT: fromDate,
          INQR_END_DT: toDate,
          CTX_AREA_FK100: '',
          CTX_AREA_NK100: '',
        });

        const domesticRes = await fetch(
          `${KIS_BASE_URL}/uapi/domestic-stock/v1/trading/period-rights?${domesticParams.toString()}`,
          {
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              authorization: `Bearer ${(client as any).accessToken}`,
              appkey: account.app_key,
              appsecret: account.app_secret,
              tr_id: 'CTRGA011R',
              custtype: 'P',
            },
          },
        );

        const domesticJson = await domesticRes.json();
        if (domesticJson.rt_cd === '0' && Array.isArray(domesticJson.output1)) {
          for (const item of domesticJson.output1) {
            const amount = parseFloat(item.thdt_tot_amt) || 0;
            if (amount <= 0) continue;

            // Check if already recorded
            const { data: existing } = await supabaseAdmin
              .from('income')
              .select('id')
              .eq('account_no', account.account_no)
              .eq('ticker', item.pdno)
              .eq('date', item.bass_dt?.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'))
              .limit(1);

            if (existing && existing.length > 0) continue;

            await supabaseAdmin.from('income').insert({
              account_no: account.account_no,
              date: item.bass_dt?.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
              ticker: item.pdno,
              name: item.prdt_name,
              type: 'dividend',
              amount: amount,
              amount_gross: parseFloat(item.bftr_amt) || amount,
              tax: parseFloat(item.tax_amt) || 0,
            });
            detectedCount++;
          }
        }
      } catch {
        // Continue to next account on domestic rights error
      }

      // Overseas rights (dividends)
      try {
        const overseasParams = new URLSearchParams({
          CANO: cano,
          ACNT_PRDT_CD: productCode,
          INQR_STRT_DT: fromDate,
          INQR_END_DT: toDate,
          RGHT_TYPE: '03', // dividends
          CTX_AREA_FK100: '',
          CTX_AREA_NK100: '',
        });

        const overseasRes = await fetch(
          `${KIS_BASE_URL}/uapi/overseas-price/v1/quotations/period-rights?${overseasParams.toString()}`,
          {
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              authorization: `Bearer ${(client as any).accessToken}`,
              appkey: account.app_key,
              appsecret: account.app_secret,
              tr_id: 'CTRGT011R',
              custtype: 'P',
            },
          },
        );

        const overseasJson = await overseasRes.json();
        if (overseasJson.rt_cd === '0' && Array.isArray(overseasJson.output1)) {
          for (const item of overseasJson.output1) {
            const amount = parseFloat(item.thdt_tot_amt) || 0;
            if (amount <= 0) continue;

            const { data: existing } = await supabaseAdmin
              .from('income')
              .select('id')
              .eq('account_no', account.account_no)
              .eq('ticker', item.ovrs_pdno ?? item.pdno)
              .eq('date', item.bass_dt?.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'))
              .limit(1);

            if (existing && existing.length > 0) continue;

            await supabaseAdmin.from('income').insert({
              account_no: account.account_no,
              date: item.bass_dt?.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
              ticker: item.ovrs_pdno ?? item.pdno,
              name: item.prdt_name ?? item.ovrs_item_name,
              type: 'dividend',
              amount: amount,
              amount_gross: parseFloat(item.bftr_amt) || amount,
              tax: parseFloat(item.tax_amt) || 0,
            });
            detectedCount++;
          }
        }
      } catch {
        // Continue to next account on overseas rights error
      }
    }

    return NextResponse.json({
      data: { detected_count: detectedCount },
    });
  } catch (err) {
    const sanitized = sanitizeError(err);
    return NextResponse.json(
      { error: sanitized.message },
      { status: 500 },
    );
  }
}
