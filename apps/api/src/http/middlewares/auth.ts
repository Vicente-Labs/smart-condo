import type { Role } from '@smart-condo/auth'
import { and, eq, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'

import { db } from '@/db'
import { condominiumResidents, condominiums } from '@/db/schemas'
import { UnauthorizedError } from '@/http/_errors/unauthorized-error'
import { CACHE_KEYS, getCache, setCache } from '@/redis'

type GetUserMembershipResponse = {
  id: string
  name: string
  description: string | null
  address: string
  logoUrl: string | null
  updatedAt: Date
  createdAt: Date
  ownerId: string
  isCondominiumResident: boolean
  role: Role
}

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook('preHandler', async (req) => {
    req.getCurrentUserId = async () => {
      try {
        const { sub } = await req.jwtVerify<{ sub: string }>()
        return { sub }
      } catch {
        throw new UnauthorizedError('Invalid auth token.')
      }
    }

    req.getUserMembership = async (id: string) => {
      const { sub: userId } = await req.getCurrentUserId()

      const cachedMembership = await getCache<{
        condominium: GetUserMembershipResponse
      }>(CACHE_KEYS.membership(userId, id))

      if (cachedMembership) {
        return cachedMembership
      }

      const [queriedCondominiumResident] = await db
        .select({
          userId: condominiumResidents.userId,
          condominiumId: condominiumResidents.condominiumId,
          role: condominiumResidents.role,
          isCondominiumResident: sql<boolean>`${condominiumResidents.userId} = ${userId}`,
          condominium: {
            id: condominiums.id,
            name: condominiums.name,
            description: condominiums.description,
            address: condominiums.address,
            logoUrl: condominiums.logoUrl,
            ownerId: condominiums.ownerId,
            updatedAt: condominiums.updatedAt,
            createdAt: condominiums.createdAt,
          },
        })
        .from(condominiumResidents)
        .where(
          and(
            eq(condominiumResidents.userId, userId),
            eq(condominiumResidents.condominiumId, id),
          ),
        )
        .leftJoin(
          condominiums,
          eq(condominiumResidents.condominiumId, condominiums.id),
        )

      if (!queriedCondominiumResident) {
        throw new UnauthorizedError(`you're not a member of this condominium`)
      }

      if (
        !queriedCondominiumResident.condominium ||
        !queriedCondominiumResident.condominium.id ||
        !queriedCondominiumResident.condominium.name ||
        !queriedCondominiumResident.condominium.address
      ) {
        throw new Error('Invalid condominium data')
      }

      const formattedCondominium: GetUserMembershipResponse = {
        id: queriedCondominiumResident.condominium.id,
        name: queriedCondominiumResident.condominium.name,
        description: queriedCondominiumResident.condominium.description,
        address: queriedCondominiumResident.condominium.address,
        logoUrl: queriedCondominiumResident.condominium.logoUrl,
        updatedAt: queriedCondominiumResident.condominium.updatedAt,
        createdAt: queriedCondominiumResident.condominium.createdAt,
        ownerId: queriedCondominiumResident.condominium.ownerId,
        isCondominiumResident: queriedCondominiumResident.isCondominiumResident,
        role: queriedCondominiumResident.role as 'MEMBER' | 'ADMIN',
      }

      await setCache(
        CACHE_KEYS.membership(userId, id),
        JSON.stringify({ condominium: formattedCondominium }),
        'LONG',
      )

      return { condominium: formattedCondominium }
    }
  })
})
