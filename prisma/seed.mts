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

  const categoriesData = [
    {
      name: 'Plumbing',
      description: 'Plumbing services including leak repairs, unclogging, and installations.',
      services: [
        { name: 'Pipe Leak Repair', description: 'Fixing leaky water or drainage pipes.', basePrice: 500 },
        { name: 'Drain Unclogging', description: 'Clearing clogged sinks, toilets, or sewer lines.', basePrice: 400 },
        { name: 'Taps & Faucets Repair/Replacement', description: 'Repairing or installing new kitchen/bathroom taps.', basePrice: 350 },
      ],
    },
    {
      name: 'Electrical',
      description: 'Electrical wiring, socket repairs, and appliance installations.',
      services: [
        { name: 'Wiring Inspection & Fixing', description: 'Checking home wiring safety and resolving issues.', basePrice: 600 },
        { name: 'Switch or Socket Replacement', description: 'Installing new electrical wall outlets or switchboard keys.', basePrice: 250 },
        { name: 'Ceiling Fan Installation', description: 'Mounting and connection of ceiling or wall fans.', basePrice: 450 },
      ],
    },
    {
      name: 'Cleaning',
      description: 'Professional deep cleaning services for apartments, kitchen, and upholstery.',
      services: [
        { name: 'Full Home Deep Cleaning', description: 'Thorough dusting, vacuuming, mopping and sanitization.', basePrice: 3000 },
        { name: 'Kitchen Deep Cleaning', description: 'Removal of oil stains and grease, cleaning counters and exhaust fan.', basePrice: 1500 },
        { name: 'Sofa or Carpet Cleaning', description: 'Shampooing and cleaning stains from sofas or carpet mats.', basePrice: 800 },
      ],
    },
    {
      name: 'AC Repair',
      description: 'Air conditioner maintenance, servicing, gas charging, and installation.',
      services: [
        { name: 'AC Servicing (Basic)', description: 'Filter wash, cleaning blower, and inspecting gas pressure.', basePrice: 700 },
        { name: 'AC Gas Charge/Refill', description: 'Checking for leaks and charging gas for optimal cooling.', basePrice: 2500 },
        { name: 'AC Installation or Shifting', description: 'Safe uninstallation, relocation, and complete setup.', basePrice: 1800 },
      ],
    },
  ];

  let seededCategoriesCount = 0;
  let seededServicesCount = 0;

  for (const cat of categoriesData) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: {
        description: cat.description,
      },
      create: {
        name: cat.name,
        description: cat.description,
      },
    });
    seededCategoriesCount++;

    for (const service of cat.services) {
      const existingService = await prisma.service.findFirst({
        where: {
          name: service.name,
          categoryId: category.id,
        },
      });

      if (existingService) {
        await prisma.service.update({
          where: { id: existingService.id },
          data: {
            description: service.description,
            basePrice: service.basePrice,
          },
        });
      } else {
        await prisma.service.create({
          data: {
            name: service.name,
            description: service.description,
            basePrice: service.basePrice,
            categoryId: category.id,
          },
        });
      }
      seededServicesCount++;
    }
  }

  console.log(`✅ Seeding completed: Seeded ${seededCategoriesCount} categories and ${seededServicesCount} services.`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
