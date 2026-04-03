import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';
import { streamText } from 'ai';

/**
 * GET /api/allocation/insights
 * AI-generated allocation insights using Vercel AI SDK.
 */
export async function GET(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    // Fetch current allocation data for context
    const { data: holdings } = await supabaseAdmin
      .from('holdings_cache')
      .select('ticker, name, evaluation_amount, currency')
      .gt('evaluation_amount', 0)
      .order('evaluation_amount', { ascending: false });

    const { data: masters } = await supabaseAdmin
      .from('assets_master')
      .select('ticker, tags')
      .in('ticker', (holdings ?? []).map((h: any) => h.ticker));

    const tagsMap = new Map((masters ?? []).map((m: any) => [m.ticker, m.tags]));

    const portfolioSummary = (holdings ?? []).map((h: any) => {
      const tags = tagsMap.get(h.ticker) ?? {};
      return `${h.name} (${h.ticker}): ${h.evaluation_amount.toLocaleString()} ${h.currency}, class=${tags.real_asset_class ?? 'unknown'}, country=${tags.country ?? 'unknown'}`;
    }).join('\n');

    const result = streamText({
      model: 'openai/gpt-4o',
      system: `당신은 개인 투자자를 위한 자산배분 어드바이저입니다. 한국어로 답변하세요.
포트폴리오 데이터를 분석하여 다음을 제공하세요:
1. 자산배분 현황 요약 (2-3문장)
2. 주요 리스크 요인 (집중 리스크, 통화 리스크 등)
3. 개선 제안 (1-2개)
간결하고 실용적으로 답변하세요. 절대 구체적인 금액을 언급하지 마세요.`,
      prompt: `현재 포트폴리오:\n${portfolioSummary}`,
    });

    return result.toTextStreamResponse();
  } catch {
    return NextResponse.json(
      { error: 'Failed to generate allocation insights' },
      { status: 500 },
    );
  }
}
