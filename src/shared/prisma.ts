import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import config from '../config/index.js';

let prisma: PrismaClient;

if (config.env === 'production') {
  const pool = new pg.Pool({ connectionString: config.database_url });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  // Cache the Prisma client on global object in development to prevent connection leaks
  if (!(global as any).prisma) {
    const pool = new pg.Pool({ connectionString: config.database_url });
    const adapter = new PrismaPg(pool);
    (global as any).prisma = new PrismaClient({ adapter });
  }
  prisma = (global as any).prisma;
}

export { prisma };
