import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../../../prisma/generated/prisma/client'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService: ConfigService) {
    const databaseURL = configService.getOrThrow<string>('DATABASE_URL')
    const parsedDatabaseUrl = new URL(databaseURL)

    const schema = parsedDatabaseUrl.searchParams.get('schema')

    const adapter = new PrismaPg(
      { connectionString: databaseURL.toString() },
      { schema: schema || 'public' },
    )
    super({
      adapter,
      log: ['warn', 'error'],
    })
  }

  onModuleInit() {
    return this.$connect()
  }

  onModuleDestroy() {
    return this.$disconnect()
  }
}
