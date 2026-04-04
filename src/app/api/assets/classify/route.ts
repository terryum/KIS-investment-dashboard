import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';
import { classifyETF } from '@/lib/allocation/classifier';
import { generateText, Output } from 'ai';
import { z } from 'zod';

const aiClassificationSchema = z.object({
  real_asset_class: z.enum(['stock', 'bond', 'commodity', 'alternative', 'reit']),
  country: z.enum(['KR', 'US', 'CN', 'JP', 'IN', 'EU', 'ASIA', 'EM', 'GLOBAL']),
  real_currency: z.enum(['KRW', 'USD', 'CNY', 'JPY', 'EUR']),
  etf_structure: z.enum(['broad', 'factor', 'sector', 'theme', 'individual']).optional(),
  sector: z.string().optional(),
  is_hedged: z.boolean(),
});

/** Check if rule-based result is all defaults (meaning classifier couldn't determine much) */
function isAllDefaults(tags: ReturnType<typeof classifyETF>): boolean {
  return (
    tags.real_asset_class === 'stock' &&
    tags.country === 'KR' &&
    tags.real_currency === 'KRW' &&
    tags.etf_structure === 'broad' &&
    !tags.sector &&
    !tags.is_hedged
  );
}

/**
 * POST /api/assets/classify
 * Classify an ETF by its name using the rule-based classifier,
 * with OpenAI fallback for unrecognized names.
 * Body: { ticker: string, name: string, market?: string, save?: boolean }
 */
export async function POST(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { ticker, name, market, save } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 },
      );
    }

    // Step 1: Rule-based classification
    let tags = classifyETF(name);

    // Step 2: If all defaults, try AI Gateway fallback
    if (isAllDefaults(tags)) {
      try {
        const aiResult = await generateText({
          model: 'openai/gpt-4o-mini',
          output: Output.object({ schema: aiClassificationSchema }),
          prompt: `Classify this Korean stock/ETF/bond:
Name: ${name}
Market: ${market || 'KRX'}
Ticker: ${ticker}

Determine the actual asset class, country exposure, currency, and structure.
For ETFs, look through the name to determine the underlying assets.
(H) or (합성) means currency hedged to KRW.
Bond ETFs should be classified as 'bond', gold ETFs as 'commodity', bitcoin as 'alternative'.`,
        });

        // Merge: AI result takes precedence for non-default values
        if (aiResult.output) {
          tags = { ...tags, ...aiResult.output };
        }
      } catch {
        // AI fallback failed — use rule-based result as-is
      }
    }

    const tagData = {
      ...tags,
      ai_classified: true,
      ai_classified_at: new Date().toISOString().split('T')[0],
    };

    // Optionally persist to assets_master
    if (save && ticker) {
      await supabaseAdmin
        .from('assets_master')
        .upsert(
          {
            ticker,
            name,
            tags: tagData,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'ticker' },
        );
    }

    return NextResponse.json({ data: { ticker, name, tags: tagData } });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
