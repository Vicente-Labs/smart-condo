import { z } from 'zod'

export const commonSpaceSchema = z.object({
  __typename: z.literal('common_spaces').default('common_spaces'),
  id: z.string(),
  condominiumId: z.string(),
  isCondominiumResident: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

export type CommonSpace = z.infer<typeof commonSpaceSchema>
