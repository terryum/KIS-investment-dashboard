import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { streamText } from 'ai';

/**
 * POST /api/market/summarize
 * AI-powered content summary with portfolio context.
 * Body: { content: string, tickers?: string[] }
 */
export async function POST(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { content, tickers } = body as {
      content: string;
      tickers?: string[];
    };

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'content is required' },
        { status: 400 },
      );
    }

    const tickerContext =
      tickers && tickers.length > 0
        ? `보유 종목: ${tickers.join(', ')}`
        : '보유 종목 정보 없음';

    const result = streamText({
      model: 'openai/gpt-4o-mini',
      system: `당신은 투자 분석 어시스턴트입니다. 한국어로 답변하세요.`,
      prompt: `다음 뉴스/콘텐츠를 3문장으로 요약하라:
1. 핵심 내용 (1문장)
2. 내 포트폴리오에 미치는 영향 (1문장)
3. 액션 아이템 (1문장)

${tickerContext}
콘텐츠: ${content}`,
    });

    return result.toTextStreamResponse();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
