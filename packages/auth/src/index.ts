import {
  AbilityBuilder,
  CreateAbility,
  createMongoAbility,
  MongoAbility,
} from '@casl/ability'
import { z } from 'zod'

import type { User } from './models/user'
import { permissions } from './permissions'
import { bookingsSubject } from './subjects/bookings'
import { commonSpacesSubject } from './subjects/common-space'
import { condominiumSubject } from './subjects/condominium'
import { inviteSubject } from './subjects/invite'
import { userSubject } from './subjects/user'

export * from './subjects/bookings'
export * from './subjects/common-space'
export * from './subjects/condominium'
export * from './subjects/invite'
export * from './subjects/user'

export * from './role'

export * from './models/user'
export * from './models/booking'
export * from './models/common-space'
export * from './models/condominium'

const appAbilitiesSchema = z.union([
  userSubject,
  inviteSubject,
  condominiumSubject,
  commonSpacesSubject,
  bookingsSubject,
  z.tuple([z.literal('manage'), z.literal('all')]),
])

type AppAbilities = z.infer<typeof appAbilitiesSchema>

export type AppAbility = MongoAbility<AppAbilities>
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>

export function defineAbilitiesFor(user: User) {
  const builder = new AbilityBuilder(createAppAbility)

  if (typeof permissions[user.role] !== 'function')
    throw new Error(`Permissions for role ${user.role} not found.`)

  permissions[user.role](user, builder)

  const ability = builder.build({
    detectSubjectType(subject) {
      return subject.__typename
    },
  })

  ability.can = ability.can.bind(ability)
  ability.cannot = ability.cannot.bind(ability)

  return ability
}