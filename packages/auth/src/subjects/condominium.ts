import { z } from 'zod'

import { condominiumSchema } from '../models/condominium'

export const condominiumSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('get'),
    z.literal('create'),
    z.literal('update'),
    z.literal('delete'),
    z.literal('transfer_ownership'),
  ]),
  z.union([z.literal('condominium'), condominiumSchema]),
])

export type CondominiumSubject = z.infer<typeof condominiumSubject>
