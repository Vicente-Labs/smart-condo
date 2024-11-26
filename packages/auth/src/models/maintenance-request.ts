import { z } from 'zod'

export const maintenanceRequestSchema = z.object({
  __typename: z.literal('maintenance_request').default('maintenance_request'),
  id: z.string(),
  authorId: z.string(),
  isCondominiumResident: z.boolean().default(false),
  isCommonSpace: z.boolean().default(false),
})

export type MaintenanceRequest = z.infer<typeof maintenanceRequestSchema>
