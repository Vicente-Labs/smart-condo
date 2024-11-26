import { AbilityBuilder } from '@casl/ability'

import { AppAbility } from '.'
import { User } from './models/user'
import type { Role } from './role'

type PermissionsByRole = (
  user: User,
  builder: AbilityBuilder<AppAbility>,
) => void

export const permissions: Record<Role, PermissionsByRole> = {
  ADMIN: (_, { can }) => {
    can('manage', 'all')
  },
  MEMBER: (user, { can }) => {
    can(['create'], 'condominium')
    can('get', 'condominium', { isCondominiumResident: { $eq: true } })
    can(['update', 'delete'], 'condominium', { ownerId: { $eq: user.id } })
    can(['get', 'book'], 'common_spaces', {
      isCondominiumResident: { $eq: true },
    })
    can(['get', 'create'], 'bookings', { isCondominiumResident: { $eq: true } })
    can(['update', 'revoke'], 'bookings', { ownerId: { $eq: user.id } })
    can('get', 'announcements', { isCondominiumResident: { $eq: true } })
    can(['get', 'vote'], 'poll', { isCondominiumResident: { $eq: true } })
    can(['get', 'create'], 'maintenance_request', {
      isCondominiumResident: { $eq: true },
    })
    can(['update'], 'maintenance_request', {
      authorId: { $eq: user.id },
      isCondominiumResident: { $eq: true },
    })
  },
}
