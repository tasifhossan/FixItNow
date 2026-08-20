import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    }
  });
  console.log('--- Users ---');
  console.log(users);

  const technicians = await prisma.technicianProfile.findMany({
    include: {
      user: true,
      services: true
    }
  });
  console.log('--- Technicians ---');
  console.log(technicians.map(t => ({
    id: t.id,
    userId: t.userId,
    name: t.user.name,
    isVerified: t.isVerified,
    isAvailable: t.isAvailable,
    services: t.services.map(s => ({ id: s.id, name: s.name }))
  })));

  const services = await prisma.service.findMany({
    select: { id: true, name: true }
  });
  console.log('--- Services ---');
  console.log(services);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
