import { z } from 'zod'

/**
 * xAPI (Tin Can) statement schema — subset of IEEE P9274.1.1 that Z-Learning
 * persists in its internal LRS. See §2 of CLAUDE.md.
 *
 * Reference: https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md
 */

export const XApiActor = z.object({
  objectType: z.literal('Agent').default('Agent'),
  account: z.object({
    homePage: z.string().url(),
    name: z.string().min(1),
  }),
  name: z.string().optional(),
})

export const XApiVerb = z.object({
  id: z.string().url(),
  display: z.record(z.string(), z.string()),
})

export const XApiObject = z.object({
  objectType: z.literal('Activity').default('Activity'),
  id: z.string().url(),
  definition: z
    .object({
      name: z.record(z.string(), z.string()).optional(),
      description: z.record(z.string(), z.string()).optional(),
      type: z.string().url().optional(),
      extensions: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
})

export const XApiResult = z
  .object({
    score: z
      .object({
        scaled: z.number().min(-1).max(1).optional(),
        raw: z.number().optional(),
        min: z.number().optional(),
        max: z.number().optional(),
      })
      .optional(),
    success: z.boolean().optional(),
    completion: z.boolean().optional(),
    duration: z.string().optional(),
    response: z.string().optional(),
    extensions: z.record(z.string(), z.unknown()).optional(),
  })
  .optional()

export const XApiContext = z
  .object({
    registration: z.string().uuid().optional(),
    platform: z.string().optional(),
    language: z.string().optional(),
    extensions: z.record(z.string(), z.unknown()).optional(),
  })
  .optional()

export const XApiStatementSchema = z.object({
  id: z.string().uuid().optional(),
  actor: XApiActor,
  verb: XApiVerb,
  object: XApiObject,
  result: XApiResult,
  context: XApiContext,
  timestamp: z.string().datetime().optional(),
})

export type XApiStatement = z.infer<typeof XApiStatementSchema>

/**
 * Canonical verbs Z-Learning uses out of the box. Engines and content kinds
 * MUST use these IRIs; custom verbs require an ADR.
 */
export const Verbs = {
  experienced: 'http://adlnet.gov/expapi/verbs/experienced',
  attempted: 'http://adlnet.gov/expapi/verbs/attempted',
  completed: 'http://adlnet.gov/expapi/verbs/completed',
  passed: 'http://adlnet.gov/expapi/verbs/passed',
  failed: 'http://adlnet.gov/expapi/verbs/failed',
  answered: 'http://adlnet.gov/expapi/verbs/answered',
  scored: 'http://adlnet.gov/expapi/verbs/scored',
} as const
