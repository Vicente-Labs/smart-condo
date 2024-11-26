import { z } from 'zod'

import { pollSchema } from '../models/poll'

export const pollSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('create'),
    z.literal('get'),
    z.literal('update'),
    z.literal('delete'),
  ]),
  z.union([z.literal('poll'), pollSchema]),
])

export type PollSubject = z.infer<typeof pollSubject>
