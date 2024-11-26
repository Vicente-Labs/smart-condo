import { z } from 'zod'

import { roleSchema } from '../role'

export const pollSchema = z.object({
  __typename: z.literal('poll').default('poll'),
  id: z.string(),
  role: roleSchema,
  isCondominiumResident: z.boolean(),
})

export type Poll = z.infer<typeof pollSchema>
