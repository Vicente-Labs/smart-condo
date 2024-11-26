import { z } from 'zod'

const envSchema = z.object({
  JWT_SECRET: z.string(),
  BACKEND_PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string(),
  FRONTEND_URL: z.string().url(),
  HOST: z.string().default('0.0.0.0'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  SQS_QUEUE_URL: z.string(),
  SQS_REGION: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_ACCOUNT_ID: z.string(),
})

export const env = envSchema.parse(process.env)
