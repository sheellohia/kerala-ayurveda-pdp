import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

/**
 * API contract tests. ANTHROPIC_API_KEY is stubbed empty so the AI layer always
 * takes the deterministic fallback — these tests never touch the network.
 */

function post(body: unknown, { raw = false }: { raw?: boolean } = {}): Request {
  return new Request('http://localhost/api/recommend', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    goals: ['stress'],
    stressLevel: 'frequent',
    experience: 'some',
    safety: {
      pregnancyOrNursing: false,
      thyroidOrAutoimmune: false,
      sedativesOrLiver: false,
    },
    formPreference: 'no-preference',
    dosePreference: 'no-preference',
    ...overrides,
  };
}

beforeEach(() => {
  vi.stubEnv('ANTHROPIC_API_KEY', '');
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/recommend', () => {
  it('returns a 200 match recommendation for valid answers', async () => {
    const res = await POST(post(validBody()));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.recommendation.outcome).toBe('match');
    expect(json.recommendation.copySource).toBe('deterministic');
    expect(json.recommendation.offer).not.toBeNull();
    expect(json.recommendation.matchScore).toBeGreaterThan(0);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('returns a 200 caution recommendation with no offer when a safety flag is set', async () => {
    const res = await POST(
      post(
        validBody({
          safety: { pregnancyOrNursing: true, thyroidOrAutoimmune: false, sedativesOrLiver: false },
        }),
      ),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.recommendation.outcome).toBe('caution');
    expect(json.recommendation.offer).toBeNull();
    expect(json.recommendation.safetyFlags).toContain('pregnancyOrNursing');
  });

  it('rejects a body missing required fields with 400 + issues', async () => {
    const res = await POST(post({ goals: ['stress'] }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeTruthy();
    expect(json.issues).toBeTruthy();
  });

  it('rejects an empty goals array with 400', async () => {
    const res = await POST(post(validBody({ goals: [] })));
    expect(res.status).toBe(400);
  });

  it('rejects a primaryGoal that is not among the selected goals', async () => {
    const res = await POST(post(validBody({ goals: ['stress'], primaryGoal: 'sleep' })));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.issues.primaryGoal).toBeTruthy();
  });

  it('rejects malformed JSON with 400', async () => {
    const res = await POST(post('{ not json', { raw: true }));
    expect(res.status).toBe(400);
  });
});
