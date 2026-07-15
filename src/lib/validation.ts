import { z } from 'zod';

/**
 * Zod schema for the /api/recommend request body. Kept separate from the route
 * so the contract is testable in isolation and reusable by the Shopify block's
 * proxy. Mirrors the FitCheckAnswers type exactly.
 */

const goal = z.enum(['stress', 'sleep', 'energy', 'focus', 'recovery', 'mood']);

export const fitCheckAnswersSchema = z
  .object({
    goals: z.array(goal).min(1, 'Pick at least one goal').max(4, 'Pick up to four goals'),
    primaryGoal: goal.optional(),
    stressLevel: z.enum(['rare', 'occasional', 'frequent', 'constant']),
    experience: z.enum(['new', 'some', 'regular']),
    safety: z.object({
      pregnancyOrNursing: z.boolean(),
      thyroidOrAutoimmune: z.boolean(),
      sedativesOrLiver: z.boolean(),
    }),
    formPreference: z.enum(['capsule', 'powder', 'no-preference']),
    dosePreference: z.enum(['once', 'twice', 'no-preference']),
  })
  .superRefine((val, ctx) => {
    if (val.primaryGoal && !val.goals.includes(val.primaryGoal)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['primaryGoal'],
        message: 'primaryGoal must be one of the selected goals',
      });
    }
  });

export type FitCheckAnswersInput = z.infer<typeof fitCheckAnswersSchema>;

/** Flatten zod issues into a simple field->message map for the client. */
export function formatIssues(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
