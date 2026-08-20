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

const API_URL = 'http://localhost:5000/api/v1';

async function main() {
  console.log('Starting live verification of booking validations...');

  // 1. Log in as Customer
  console.log('Logging in as customer...');
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'tasif.customer@test.com',
      password: 'testpassword123'
    })
  });
  
  const loginData = await loginRes.json() as any;
  const token = loginData.data.accessToken;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const techId = 'f4da42b8-f7e6-407c-9c3a-48451eadae14';
  
  // Find a service offered by this technician
  const techProfile = await prisma.technicianProfile.findUnique({
    where: { id: techId },
    include: { services: true }
  });
  
  if (!techProfile || techProfile.services.length === 0) {
    throw new Error('Technician does not have any assigned services.');
  }
  
  const serviceId = techProfile.services[0].id;
  console.log(`Using technician ID: ${techId}, service ID: ${serviceId} (${techProfile.services[0].name})`);

  // Clean up any potential leftover bookings from previous runs
  await prisma.booking.deleteMany({
    where: {
      technicianId: techId,
      scheduledDate: {
        in: [
          new Date('2026-09-07T10:00:00.000Z'),
          new Date('2026-09-07T07:00:00.000Z'),
          new Date('2026-09-06T10:00:00.000Z')
        ]
      }
    }
  });

  // Scenario 1: No working hours for the requested weekday (Sunday - 2026-09-06T10:00:00Z)
  console.log('\n--- Scenario 1: Requesting Sunday (No working hours) ---');
  try {
    const res = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        technicianId: techId,
        serviceId,
        scheduledDate: '2026-09-06T10:00:00.000Z',
        address: 'Test Address 123'
      })
    });
    const data = await res.status === 204 ? {} : await res.json();
    console.log('HTTP Status:', res.status);
    console.log('Response Body:', JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.log('Error:', err);
  }

  // Scenario 2: Valid slot within working hours, no conflict (Monday - 2026-09-07T10:00:00Z)
  console.log('\n--- Scenario 2: Requesting Monday 10:00 UTC (Valid slot) ---');
  let bookingId = '';
  try {
    const res = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        technicianId: techId,
        serviceId,
        scheduledDate: '2026-09-07T10:00:00.000Z',
        address: 'Test Address 123'
      })
    });
    const data = await res.json() as any;
    bookingId = data.data?.id;
    console.log('HTTP Status:', res.status);
    console.log('Response Body:', JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.log('Error:', err);
  }

  // Scenario 3: Same slot booked again - collision (Monday - 2026-09-07T10:00:00Z)
  console.log('\n--- Scenario 3: Requesting Monday 10:00 UTC again (Collision) ---');
  try {
    const res = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        technicianId: techId,
        serviceId,
        scheduledDate: '2026-09-07T10:00:00.000Z',
        address: 'Test Address 123'
      })
    });
    const data = await res.json();
    console.log('HTTP Status:', res.status);
    console.log('Response Body:', JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.log('Error:', err);
  }

  // Scenario 4: Time outside declared hours (Monday - 2026-09-07T07:00:00Z)
  console.log('\n--- Scenario 4: Requesting Monday 07:00 UTC (Outside hours) ---');
  try {
    const res = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        technicianId: techId,
        serviceId,
        scheduledDate: '2026-09-07T07:00:00.000Z',
        address: 'Test Address 123'
      })
    });
    const data = await res.json();
    console.log('HTTP Status:', res.status);
    console.log('Response Body:', JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.log('Error:', err);
  }

  // Cleanup: delete the test booking directly so the database remains clean
  if (bookingId) {
    console.log('\nCleaning up test booking...');
    await prisma.booking.delete({ where: { id: bookingId } });
    console.log('Cleaned up successfully.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
