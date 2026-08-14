import { PrismaClient } from '../../generated/prisma/client.js';
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
  console.log('Starting working hours backfill...');

  // 1. Count working hours before
  const countBefore = await prisma.workingHours.count();
  console.log(`Current WorkingHours row count: ${countBefore}`);

  // 2. Find technicians with zero working hours configured
  const technicians = await prisma.technicianProfile.findMany({
    where: {
      workingHours: {
        none: {}
      }
    },
    include: {
      user: true
    }
  });

  console.log(`Found ${technicians.length} technicians without working hours.`);

  let createdCount = 0;

  // 3. For each technician, create Mon-Fri 09:00 - 17:00 schedule
  for (const tech of technicians) {
    console.log(`Backfilling for technician: ${tech.user.name} (${tech.id})`);
    
    for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
      await prisma.workingHours.create({
        data: {
          technicianProfileId: tech.id,
          dayOfWeek,
          startTime: '09:00',
          endTime: '17:00',
        }
      });
      createdCount++;
    }
  }

  // 4. Count working hours after
  const countAfter = await prisma.workingHours.count();
  console.log(`Working hours backfill completed.`);
  console.log(`Created ${createdCount} WorkingHours records.`);
  console.log(`New WorkingHours row count: ${countAfter}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
