import { z } from 'zod'

export const condominiumSchema = z.object({
  __typename: z.literal('condominium').default('condominium'),
  id: z.string(),
  ownerId: z.string(),
  isCondominiumResident: z.boolean().default(false),
})

export type Condominium = z.infer<typeof condominiumSchema>
