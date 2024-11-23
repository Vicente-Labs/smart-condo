import { defineAbilitiesFor, type Role, userSchema } from '@smart-condo/auth'

export function getPermissions(userId: string, role: Role) {
  const authUser = userSchema.parse({
    id: userId,
    role,
  })

  const ability = defineAbilitiesFor(authUser)

  return ability
}
