import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/income/summary
 * Yearly income summary (uses v_income_summary_ytd view).
 * Query: ?year= (optional)
 */
export async function GET(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const year = request.nextUrl.searchParams.get('year');

    // Try the view first
    let query = supabaseAdmin
      .from('v_income_summary_ytd')
      .select('*');

    if (year) {
      query = query.eq('year', parseInt(year));
    }

    const { data, error } = await query.order('year', { ascending: false });

    if (error) {
      // Fallback: compute from income table directly
      let fallbackQuery = supabaseAdmin
        .from('income')
        .select('date, type, amount');

      if (year) {
        fallbackQuery = fallbackQuery
          .gte('date', `${year}-01-01`)
          .lte('date', `${year}-12-31`);
      }

      const { data: incomes, error: fallbackError } = await fallbackQuery;

      if (fallbackError || !incomes) {
        return NextResponse.json(
          { error: 'Failed to fetch income summary' },
          { status: 500 },
        );
      }

      const summary = new Map<string, { year: number; type: string; total_amount: number; count: number }>();
      for (const inc of incomes) {
        const y = new Date(inc.date).getFullYear();
        const key = `${y}-${inc.type}`;
        const entry = summary.get(key) ?? { year: y, type: inc.type, total_amount: 0, count: 0 };
        entry.total_amount += parseFloat(inc.amount) || 0;
        entry.count += 1;
        summary.set(key, entry);
      }

      return NextResponse.json({
        data: Array.from(summary.values()).sort((a, b) => b.year - a.year),
      });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
