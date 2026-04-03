import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { streamText } from 'ai';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/advisor/chat
 * AI advisor streaming chat with portfolio context.
 * Body: { messages: Array<{ role: string, content: string }> }
 */
export async function POST(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { messages } = body as {
      messages: Array<{ role: string; content: string }>;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'messages array is required' },
        { status: 400 },
      );
    }

    // Fetch portfolio context for the AI
    const [holdingsResult, watchlistResult] = await Promise.all([
      supabaseAdmin
        .from('holdings_cache')
        .select('ticker, name, evaluation_amount, pnl_percent, currency')
        .limit(50),
      supabaseAdmin
        .from('watchlist')
        .select('ticker, name, reason')
        .limit(20),
    ]);

    const holdings = holdingsResult.data ?? [];
    const watchlist = watchlistResult.data ?? [];

    const portfolioContext = holdings.length > 0
      ? `현재 보유 종목:\n${holdings.map((h: { ticker: string; name: string; pnl_percent: number }) => `- ${h.name} (${h.ticker}): 수익률 ${h.pnl_percent}%`).join('\n')}`
      : '보유 종목 정보 없음';

    const watchlistContext = watchlist.length > 0
      ? `\n관심 종목:\n${watchlist.map((w: { ticker: string; name: string; reason: string }) => `- ${w.name ?? w.ticker}${w.reason ? `: ${w.reason}` : ''}`).join('\n')}`
      : '';

    const result = streamText({
      model: 'openai/gpt-4o-mini',
      system: `당신은 개인 투자 어드바이저입니다. 한국어로 답변하세요.
사용자의 포트폴리오 맥락을 고려하여 답변합니다.
투자 조언은 참고용이며 최종 결정은 사용자 몫이라는 점을 적절히 안내하세요.

${portfolioContext}${watchlistContext}`,
      messages: messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    });

    return result.toTextStreamResponse();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
