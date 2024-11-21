import { z } from 'zod'

import { commonSpaceSchema } from '../models/common-space'

export const commonSpacesSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('get'),
    z.literal('create'),
    z.literal('update'),
    z.literal('delete'),
    z.literal('book'), // book a common space
  ]),
  z.union([z.literal('common_spaces'), commonSpaceSchema]),
])

export type CommonSpaceSubject = z.infer<typeof commonSpacesSubject>
