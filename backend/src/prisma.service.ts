import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const pool = new Pool({
      host: 'db.prisma.io',
      port: 5432,
      database: 'postgres',
      user: '5862ad078f8937d3f8f55001c09af971a2856cb24069a80212b04b2139f70c50',
      password: 'sk_PGblf23LktaLn_RyFRBKw',
      ssl: { rejectUnauthorized: false },
    });
    const adapter = new PrismaPg(pool);
    super({
      adapter,
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
