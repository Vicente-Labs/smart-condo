import Redis from 'ioredis'

import { env } from '@/env'

const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
})

export const CACHE_KEYS = {
  condominium: (id: string) => `condominium:${id}`,
  membership: (userId: string, condominiumId: string) =>
    `membership:${userId}:${condominiumId}`,
  permissions: (userId: string, role: string) =>
    `permissions:${userId}:${role}`,
  userCondominiums: (userId: string) => `user:${userId}:condominiums`,
  profile: (userId: string) => `profile:${userId}`,
  commonSpace: (id: string, condominiumId: string) =>
    `condominium:${condominiumId}:common-space:${id}`,
  commonSpaces: (condominiumId: string) =>
    `condominium:${condominiumId}:common-spaces`,
  bookings: (userId: string, condominiumId: string) =>
    `bookings:${userId}:${condominiumId}`,
  booking: (userId: string, bookingId: string) =>
    `booking:${userId}:${bookingId}`,
  poll: (pollId: string) => `poll:${pollId}`,
  maintenanceRequests: (condominiumId: string, page: number) =>
    `maintenance-requests:${condominiumId}:${page}`,
  invites: (inviteId: string) => `invites:${inviteId}`,
} as const

export const CACHE_TIMES = {
  SHORT: 60 * 60, // 1 hour
  DEFAULT: 60 * 60 * 24, // 1 day
  MEDIUM: 60 * 60 * 7 * 24, // 7 days
  LONG: 60 * 60 * 14 * 24, // 14 days
  VERY_LONG: 60 * 60 * 30 * 24, // 30 days
}

export async function getCache<T>(key: string): Promise<T | null> {
  const cached = await redis.get(key)
  return cached ? JSON.parse(cached) : null
}

export async function setCache(
  key: string,
  data: string,
  ttl: keyof typeof CACHE_TIMES = 'DEFAULT',
): Promise<void> {
  await redis.setex(key, CACHE_TIMES[ttl], data)
}

export async function invalidateCache(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern)
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}

export const redisClient = redis
