import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUI from '@fastify/swagger-ui'
import fastify from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'

import { env } from '@/env'

import { errorHandler } from './error-handler'
import { authenticateWithPasswordRoute } from './routes/auth/authenticate-with-password'
import { registerAccountRoute } from './routes/auth/register-account'
import { fetchBookingsRoute } from './routes/bookings/fetch-bookings'
import { revokeBookingRoute } from './routes/bookings/revoke-booking'
import { updateBookingRoute } from './routes/bookings/update-booking'
import { bookCommonSpaceRoute } from './routes/common-spaces/book-common-space'
import { fetchCommonSpacesRoute } from './routes/common-spaces/fetch-common-places'
import { makeCommonSpaceUnavailableRoute } from './routes/common-spaces/make-common-space-unavailable'
import { registerCommonSpaceRoute } from './routes/common-spaces/register-common-space'
import { updateCommonSpaceRoute } from './routes/common-spaces/update-common-space'
import { deleteCondominiumRoute } from './routes/condominiums/delete-condominium'
import { fetchCondominiumsRoute } from './routes/condominiums/fetch-condominiums'
import { getCondominiumRoute } from './routes/condominiums/get-condominiums'
import { registerCondominiumRoute } from './routes/condominiums/register-condominium'
import { transferCondominiumOwnershipRoute } from './routes/condominiums/transfer-condominium-ownership'
import { updateCondominiumRoute } from './routes/condominiums/update-condominium'
import { acceptInviteRoute } from './routes/invites/accept-invite'
import { createInviteRoute } from './routes/invites/create-invite'
import { fetchInvitesRoute } from './routes/invites/fetch-invites'
import { getPendingInvitesRoute } from './routes/invites/fetch-pending-invites'
import { getInviteRoute } from './routes/invites/get-invite'
import { revokeInviteRoute } from './routes/invites/revoke-invite'
import { registerMaintenanceRequestRoute } from './routes/maintenance/register-maintenance-request'
import { createPollRoute } from './routes/polls/create-poll'
import { getPollRoute } from './routes/polls/get-poll'
import { voteOnPollRoute } from './routes/polls/vote-on-poll'
import { getProfileRoute } from './routes/profile/get-profile'
import { getUserProfileRoute } from './routes/profile/get-user-profile'
import { updateProfileRoute } from './routes/profile/update-profile'

const app = fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
}).withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.setErrorHandler(errorHandler)

app.register(fastifySwagger, {
  openapi: {
    servers: [
      {
        url: `http://localhost:${env.BACKEND_PORT}`,
      },
    ],
    info: {
      title: 'Smart Condo | API Specs',
      description: 'API documentation for Smart Condo',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  transform: jsonSchemaTransform,
})

app.register(fastifySwaggerUI, {
  routePrefix: '/docs',
})

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
})

app.register(fastifyCors) // any front-end can access this API

app.register(registerAccountRoute)
app.register(authenticateWithPasswordRoute)

app.register(getUserProfileRoute)
app.register(getProfileRoute)
app.register(updateProfileRoute)

app.register(registerCondominiumRoute)
app.register(updateCondominiumRoute)
app.register(transferCondominiumOwnershipRoute)
app.register(deleteCondominiumRoute)
app.register(fetchCondominiumsRoute)
app.register(getCondominiumRoute)

app.register(registerCommonSpaceRoute)
app.register(fetchCommonSpacesRoute)
app.register(bookCommonSpaceRoute)
app.register(makeCommonSpaceUnavailableRoute)
app.register(updateCommonSpaceRoute)

app.register(fetchBookingsRoute)
app.register(revokeBookingRoute)
app.register(updateBookingRoute)

app.register(createPollRoute)
app.register(getPollRoute)
app.register(voteOnPollRoute)

app.register(createInviteRoute)
app.register(getInviteRoute)
app.register(fetchInvitesRoute)
app.register(revokeInviteRoute)
app.register(acceptInviteRoute)
app.register(getPendingInvitesRoute)

app.register(registerMaintenanceRequestRoute)

app.listen({
  host: env.HOST,
  port: env.BACKEND_PORT,
})
