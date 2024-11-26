import { eq } from 'drizzle-orm'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { condominiumResidents, condominiums } from '@/db/schemas'
import { BadRequestError } from '@/http/_errors/bad-request-errors'
import { auth } from '@/http/middlewares/auth'
import { CACHE_KEYS, setCache } from '@/redis'

export async function registerCondominiumRoute(app: FastifyInstance) {
  app
    .register(auth)
    .withTypeProvider<ZodTypeProvider>()
    .post(
      '/condominiums',
      {
        schema: {
          tags: ['condominiums'],
          summary: 'Register a condominium',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string(),
            description: z.string().optional(),
            address: z.string(),
            logoUrl: z.string().optional(),
          }),
          response: {
            201: z.object({
              message: z.literal('Condominium created successfully'),
              condominiumId: z.string(),
            }),
            400: z.object({
              message: z.literal(
                'Condominium with this address already exists',
              ),
            }),
            401: z.object({
              message: z.literal('Invalid auth token'),
            }),
            500: z.object({
              message: z.string(),
            }),
          },
        },
      },
      async (req, res) => {
        const { sub: ownerId } = await req.getCurrentUserId()

        const { name, description, address, logoUrl } = req.body

        const condominiumAlreadyExists = await db
          .select()
          .from(condominiums)
          .where(eq(condominiums.address, address))

        if (condominiumAlreadyExists.length > 0)
          throw new BadRequestError(
            'Condominium with this address already exists',
          )

        const condominium = await db.transaction(async (tx) => {
          const [condominium] = await tx
            .insert(condominiums)
            .values({
              name,
              description,
              address,
              logoUrl,
              ownerId,
            })
            .returning()

          await tx.insert(condominiumResidents).values({
            userId: ownerId,
            condominiumId: condominium.id,
            role: 'ADMIN',
          })

          await setCache(
            CACHE_KEYS.condominium(condominium.id),
            JSON.stringify(condominium),
            'LONG',
          )

          await setCache(
            CACHE_KEYS.userCondominiums(ownerId),
            JSON.stringify([{ ...condominium, isOwner: true }]),
            'LONG',
          )

          return condominium
        })

        return res.status(201).send({
          message: 'Condominium created successfully',
          condominiumId: condominium.id,
        })
      },
    )
}
