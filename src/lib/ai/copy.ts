import { z } from 'zod';
import type { FitCheckAnswers, Recommendation, RecommendationCopy } from '@/lib/types';

/**
 * Optional AI copy layer. The deterministic engine already produces complete,
 * compliant copy; this module OPTIONALLY rewrites only the prose (headline,
 * subcopy, "why this fits you" reasons) to feel more on-brand and personal.
 *
 * Design rules that keep it safe:
 *  - Runs ONLY when ANTHROPIC_API_KEY is set AND the outcome is a 'match'
 *    (safety-caution wording is never AI-rewritten — it stays deterministic).
 *  - Sends only model/max_tokens/system/messages, so it works unchanged on
 *    Haiku, Opus, or Fable 5 (no temperature/thinking params that some models
 *    reject).
 *  - The API key lives on the server; it never reaches the client.
 *  - Any error, timeout, malformed JSON, or refusal falls back to the
 *    deterministic copy — the shopper always gets a result.
 *
 * The AI only rephrases facts the engine already decided (dose, pack, match
 * strength). It is instructed never to invent claims, so it can't drift into
 * disease claims or guaranteed outcomes.
 */

const API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-haiku-4-5';
const TIMEOUT_MS = 8000;

const aiCopySchema = z.object({
  verdictHeadline: z.string().min(1).max(160),
  verdictSubcopy: z.string().min(1).max(340),
  reasons: z.array(z.string().min(1).max(280)).min(2).max(5),
});

const SYSTEM_PROMPT = `You are the copywriter for Kerala Ayurveda, an 80+ year Ayurvedic wellness brand. You rewrite a personalized "Is this right for me?" recommendation for an Ashwagandha supplement so it feels warm, plain-spoken, and confidence-building.

HARD RULES — non-negotiable:
- Structure/function language ONLY. Never claim the product treats, cures, prevents, or diagnoses any disease or condition. Never promise guaranteed outcomes or specific timeframes for results.
- Use only the facts provided in the input (goal, dose, pack, match strength, timeline). Do NOT invent statistics, certifications, testimonials, or clinical claims.
- Keep it honest and non-pushy. No fake urgency, no pressure.
- Warm, second-person, concise. British/US-neutral. No emoji. No markdown.

OUTPUT: Respond with ONLY a JSON object, no prose around it, matching exactly:
{"verdictHeadline": string, "verdictSubcopy": string, "reasons": string[] }
- verdictHeadline: one sentence affirming the fit for their primary goal.
- verdictSubcopy: one or two sentences on what happens next, no pressure.
- reasons: 3-4 short "why this fits you" lines that restate the shopper's own answers.`;

export interface CopyResult {
  copy: RecommendationCopy;
  source: 'ai' | 'deterministic';
}

/** Extract concatenated text from an Anthropic Messages API response. */
function extractText(data: unknown): string {
  const content = (data as { content?: unknown }).content;
  if (!Array.isArray(content)) return '';
  return content
    .filter((b): b is { type: string; text: string } => {
      const block = b as { type?: unknown; text?: unknown };
      return block.type === 'text' && typeof block.text === 'string';
    })
    .map((b) => b.text)
    .join('');
}

/** Pull the first JSON object out of a text blob and parse it. */
function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('no JSON object in response');
  return JSON.parse(match[0]);
}

function buildUserPrompt(rec: Recommendation, answers: FitCheckAnswers): string {
  const facts = {
    primaryGoal: rec.copy.verdictHeadline, // already goal-aware; gives the model the target
    matchStrength: rec.matchStrength,
    goals: answers.goals,
    stressLevel: answers.stressLevel,
    experience: answers.experience,
    dose: rec.protocol
      ? `${rec.protocol.dosePerDay} capsule(s)/day (~${rec.protocol.mgPerDay} mg), ${rec.protocol.timing}`
      : null,
    extract: `${rec.extract.name}, ${rec.extract.withanolidePercent}% withanolides, ${rec.extract.plantPart}`,
    recommendedPack: rec.offer?.recommendedPackLabel,
    sellingMode: rec.offer?.sellingMode,
    timeline: rec.timeline.map((t) => `${t.window}: ${t.detail}`),
    deterministicDraft: rec.copy,
  };
  return `Rewrite this recommendation for the shopper. Here are the decided facts (do not change them, only rephrase):\n\n${JSON.stringify(
    facts,
    null,
    2,
  )}\n\nReturn ONLY the JSON object.`;
}

export async function generateCopy(
  rec: Recommendation,
  answers: FitCheckAnswers,
): Promise<CopyResult> {
  const key = process.env.ANTHROPIC_API_KEY;

  // No key, or a safety-caution outcome -> keep deterministic copy verbatim.
  if (!key || rec.outcome !== 'match') {
    return { copy: rec.copy, source: 'deterministic' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildUserPrompt(rec, answers) }],
      }),
    });

    if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
    const data = await res.json();
    if ((data as { stop_reason?: string }).stop_reason === 'refusal') {
      throw new Error('model refusal');
    }

    const parsed = aiCopySchema.parse(extractJson(extractText(data)));
    return { copy: parsed, source: 'ai' };
  } catch {
    // Any failure -> deterministic copy. The shopper never sees an error here.
    return { copy: rec.copy, source: 'deterministic' };
  } finally {
    clearTimeout(timeout);
  }
}
