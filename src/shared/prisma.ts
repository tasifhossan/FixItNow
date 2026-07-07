import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import config from '../config/index.js';

const pool = new pg.Pool({ connectionString: config.database_url });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
