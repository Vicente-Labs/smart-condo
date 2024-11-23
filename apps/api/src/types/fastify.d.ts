import 'fastify'

import { Role } from '@smart-condo/auth'

type GetUserMembershipResponse = {
  id: string
  name: string
  description: string | null
  address: string
  logoUrl: string | null
  updatedAt: Date
  createdAt: Date
  ownerId: string
  isResident: boolean
  role: Role
}

declare module 'fastify' {
  export interface FastifyRequest {
    getCurrentUserId(): Promise<{ sub: string }>
    getUserMembership(id: string): Promise<{
      condominium: GetUserMembershipResponse
    }>
  }
}
