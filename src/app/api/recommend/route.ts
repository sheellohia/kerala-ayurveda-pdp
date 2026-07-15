import { NextResponse } from 'next/server';
import { buildRecommendation } from '@/lib/fit-check/engine';
import { generateCopy } from '@/lib/ai/copy';
import { fitCheckAnswersSchema, formatIssues } from '@/lib/validation';

/**
 * POST /api/recommend
 *
 * Thin orchestrator — all logic lives in dedicated modules:
 *   validation  -> src/lib/validation.ts   (zod)
 *   business    -> src/lib/fit-check/engine.ts   (pure, deterministic)
 *   AI copy     -> src/lib/ai/copy.ts       (optional, server-only key, falls back)
 *
 * States handled: 400 (invalid JSON / failed validation), 200 (match or
 * safety-caution recommendation), 500 (unexpected). "Loading" and "empty" are
 * client concerns; this route always returns a complete recommendation on 200.
 */

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body.' },
      { status: 400 },
    );
  }

  const parsed = fitCheckAnswersSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please answer all questions.', issues: formatIssues(parsed.error) },
      { status: 400 },
    );
  }

  try {
    const recommendation = buildRecommendation(parsed.data);

    // Optionally upgrade the prose with AI; always safe to await (falls back).
    const { copy, source } = await generateCopy(recommendation, parsed.data);
    recommendation.copy = copy;
    recommendation.copySource = source;

    return NextResponse.json(
      { recommendation },
      { status: 200, headers: { 'cache-control': 'no-store' } },
    );
  } catch {
    return NextResponse.json(
      { error: 'Could not build a recommendation. Please try again.' },
      { status: 500 },
    );
  }
}
