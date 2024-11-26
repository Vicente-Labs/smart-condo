import { z } from 'zod'

import { maintenanceRequestSchema } from '../models/maintenance-request'

export const maintenanceRequestSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('get'),
    z.literal('create'),
    z.literal('update'),
    z.literal('delete'),
  ]),
  z.union([z.literal('maintenance_request'), maintenanceRequestSchema]),
])

export type MaintenanceRequestSubject = z.infer<
  typeof maintenanceRequestSubject
>
