import { and, eq, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'

import { db } from '@/db'
import { condominiumResidents, condominiums } from '@/db/schemas'
import { UnauthorizedError } from '@/http/_errors/unauthorized-error'

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

      const [queriedCondominiumResident] = await db
        .select({
          condominium: condominiums,
          role: condominiumResidents.role,
          isResident: sql<boolean>`${condominiumResidents.userId} = ${userId}`,
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

      if (
        !queriedCondominiumResident.condominium ||
        !queriedCondominiumResident?.condominium.id
      )
        throw new UnauthorizedError(`you're not a member of this condominium`)

      if (
        !queriedCondominiumResident.condominium.name ||
        !queriedCondominiumResident.condominium.address
      )
        throw new Error('Invalid condominium data')

      const formattedCondominium = {
        id: queriedCondominiumResident.condominium.id,
        name: queriedCondominiumResident.condominium.name,
        description: queriedCondominiumResident.condominium.description,
        address: queriedCondominiumResident.condominium.address,
        logoUrl: queriedCondominiumResident.condominium.logoUrl,
        updatedAt: queriedCondominiumResident.condominium.updatedAt,
        createdAt: queriedCondominiumResident.condominium.createdAt,
        ownerId: queriedCondominiumResident.condominium.ownerId,
        isResident: queriedCondominiumResident.isResident,
        role: queriedCondominiumResident.role,
      }

      return { condominium: formattedCondominium }
    }
  })
})
