import { eq } from 'drizzle-orm'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { condominiumResidents, condominiums } from '@/db/schemas'
import { auth } from '@/http/middlewares/auth'

const condominiumSchema = z.object({
  ownerId: z.string(),
  id: z.string(),
  name: z.string(),
  logoUrl: z.string().nullable(),
  address: z.string(),
  description: z.string().nullable(),
  isOwner: z.boolean(),
  updatedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
})

export async function fetchCondominiumsRoute(app: FastifyInstance) {
  app
    .register(auth)
    .withTypeProvider<ZodTypeProvider>()
    .post(
      '/condominiums',
      {
        schema: {
          tags: ['condominiums'],
          summary: 'Fetch all that a user is a resident of',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              message: z.literal('Condominiums fetched successfully'),
              condominiums: condominiumSchema.array(),
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
        const { sub: userId } = await req.getCurrentUserId()

        const queriedCondominiums = await db
          .select()
          .from(condominiumResidents)
          .where(eq(condominiumResidents.userId, userId))
          .innerJoin(
            condominiums,
            eq(condominiumResidents.condominiumId, condominiums.id),
          )

        const formattedCondominiums = queriedCondominiums.map(
          ({ condominiums: { id, ownerId, ...condominium } }) => ({
            id,
            ownerId,
            isOwner: ownerId === userId,
            ...condominium,
          }),
        )

        return res.status(200).send({
          message: 'Condominiums fetched successfully',
          condominiums: formattedCondominiums,
        })
      },
    )
}
