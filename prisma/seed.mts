import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required for seeding.');
    process.exit(1);
  }

  console.log(`🌱 Seeding database...`);

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Upsert the admin user
  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      name: 'System Admin',
      password: hashedPassword,
      phone: '0000000000',
      role: 'ADMIN',
      isBlocked: false,
    },
    create: {
      name: 'System Admin',
      email,
      password: hashedPassword,
      phone: '0000000000',
      role: 'ADMIN',
      isBlocked: false,
    },
  });

  console.log(`✅ Admin user seeded successfully: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
