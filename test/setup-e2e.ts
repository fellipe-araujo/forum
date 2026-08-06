import { config } from 'dotenv'

import { PrismaPg } from '@prisma/adapter-pg'
import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { afterAll } from 'vitest'
import { PrismaClient } from '../prisma/generated/prisma/client'
import { DomainEvents } from '@/core/events/domain-events'

config({ path: '.env', override: true })
config({ path: '.env.test', override: true })

function generateUniqueDatabaseURL(schemaId: string) {
  if (!process.env.DATABASE_URL) {
    throw new Error('Please provide a DATABASE_URL environment variable')
  }

  const url = new URL(process.env.DATABASE_URL)

  url.searchParams.set('schema', schemaId)

  return url.toString()
}

const schemaId = randomUUID()
const databaseURL = generateUniqueDatabaseURL(schemaId)

process.env.DATABASE_URL = databaseURL

DomainEvents.shouldRun = false

execSync('npx prisma migrate deploy', {
  env: {
    ...process.env,
    DATABASE_URL: databaseURL,
  },
  stdio: 'inherit',
})

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseURL,
  }),
})

afterAll(async () => {
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaId}" CASCADE`)
  await prisma.$disconnect()
})
