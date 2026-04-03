import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { generateText } from 'ai';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/market/sources/recommend
 * AI-powered source recommendation for diverse perspectives.
 * Body: { topics?: string[], language?: string }
 */
export async function POST(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { topics, language } = body as {
      topics?: string[];
      language?: string;
    };

    // Fetch existing sources for context
    const { data: existingSources } = await supabaseAdmin
      .from('market_sources')
      .select('name, type, perspective, topics')
      .eq('is_active', true);

    const existingContext =
      existingSources && existingSources.length > 0
        ? `현재 팔로우 중인 소스:\n${existingSources.map((s: { name: string; type: string; perspective: string }) => `- ${s.name} (${s.type}, ${s.perspective})`).join('\n')}`
        : '현재 팔로우 중인 소스 없음';

    const topicContext =
      topics && topics.length > 0
        ? `관심 주제: ${topics.join(', ')}`
        : '';

    const lang = language === 'en' ? 'English' : '한국어';

    const { text } = await generateText({
      model: 'openai/gpt-4o-mini',
      system: `당신은 투자 정보 소스 큐레이터입니다. ${lang}로 답변하세요.`,
      prompt: `다양한 관점의 균형 잡힌 투자 정보 소스를 추천해주세요.

추천 기준:
- 상승론/성장 관점: 2+ 소스
- 하락론/가치 관점: 2+ 소스
- 채권/매크로 관점: 2+ 소스
- 글로벌 관점: 2+ 소스
- 국내 관점: 2+ 소스
- 총 10-15개 소스

소스 유형: YouTube, 블로그, 뉴스레터, 애널리스트 리포트, 팟캐스트, 트위터/X

${existingContext}
${topicContext}

각 소스에 대해 JSON 배열로 응답하세요:
[{ "name": "소스명", "url": "URL", "type": "youtube|blog|newsletter|analyst|news|podcast|twitter|other", "perspective": "bullish|bearish|value|growth|macro|bond|balanced|other", "language": "ko|en", "topics": ["주제1", "주제2"], "reason": "추천 이유" }]

JSON만 응답하세요.`,
    });

    let recommendations;
    try {
      recommendations = JSON.parse(text);
    } catch {
      recommendations = { raw: text };
    }

    return NextResponse.json({ data: recommendations });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
