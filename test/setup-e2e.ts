import { config } from 'dotenv'

import { DomainEvents } from '@/core/events/domain-events'
import { envSchema } from '@/infra/env/env'
import { PrismaPg } from '@prisma/adapter-pg'
import { Redis } from 'ioredis'
import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { afterAll } from 'vitest'
import { PrismaClient } from '../prisma/generated/prisma/client'

config({ path: '.env', override: true })
config({ path: '.env.test', override: true })

function generateUniqueDatabaseURL(schemaId: string) {
  if (!env.DATABASE_URL) {
    throw new Error('Please provide a DATABASE_URL environment variable')
  }

  const url = new URL(env.DATABASE_URL)

  url.searchParams.set('schema', schemaId)

  return url.toString()
}

const env = envSchema.parse(process.env)
const schemaId = randomUUID()
const databaseURL = generateUniqueDatabaseURL(schemaId)
const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  db: env.REDIS_DB,
})

process.env.DATABASE_URL = databaseURL

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseURL,
  }),
})

beforeAll(async () => {
  process.env.DATABASE_URL = databaseURL

  DomainEvents.shouldRun = false

  await redis.flushdb()

  execSync('npx prisma migrate deploy', {
    env: {
      ...process.env,
      DATABASE_URL: databaseURL,
    },
    stdio: 'inherit',
  })
})

afterAll(async () => {
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaId}" CASCADE`)
  await prisma.$disconnect()
})
