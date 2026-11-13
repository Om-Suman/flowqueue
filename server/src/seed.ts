import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding FlowQueue database with rich demo data...');

  // Clean existing data
  await prisma.token.deleteMany({});
  await prisma.queue.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create Demo Manager
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const manager = await prisma.user.create({
    data: {
      name: 'Sarah Jenkins',
      email: 'manager@flowqueue.com',
      passwordHash,
      role: 'MANAGER',
    },
  });

  console.log(`👤 Created Manager: ${manager.name} (${manager.email}) / password123`);

  // 2. Create Queues
  const queue1 = await prisma.queue.create({
    data: {
      name: 'General Customer Service',
      description: 'Account inquiries, card issues, and general support',
      prefix: 'GEN',
      tokenSeq: 14,
      managerId: manager.id,
    },
  });

  const queue2 = await prisma.queue.create({
    data: {
      name: 'VIP & Priority Desk',
      description: 'Dedicated counter for premier members and seniors',
      prefix: 'VIP',
      tokenSeq: 6,
      managerId: manager.id,
    },
  });

  const queue3 = await prisma.queue.create({
    data: {
      name: 'Technical Verification',
      description: 'Hardware checks, biometrics and KYC processing',
      prefix: 'TEC',
      tokenSeq: 8,
      managerId: manager.id,
    },
  });

  const now = new Date();

  // Helper to generate past dates
  const minsAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000);

  // 3. Seed Tokens for General Service
  // In-Service token
  await prisma.token.create({
    data: {
      tokenNumber: 'GEN-009',
      sequenceNum: 9,
      customerName: 'Marcus Aurelius',
      customerPhone: '+1 (555) 349-1102',
      customerEmail: 'marcus@example.com',
      priority: 'NORMAL',
      status: 'IN_SERVICE',
      counterName: 'Counter 1',
      position: null,
      createdAt: minsAgo(35),
      servedAt: minsAgo(8),
      queueId: queue1.id,
    },
  });

  // Waiting tokens (ordered by position 1, 2, 3, 4)
  const waitingPersonsGen = [
    { name: 'Elena Rostova', phone: '+1 (555) 782-9901', priority: 'PRIORITY', notes: 'Needs passbook reissue' },
    { name: 'David Chen', phone: '+1 (555) 431-2804', priority: 'NORMAL', notes: 'Address update' },
    { name: 'Amara Okafor', phone: '+1 (555) 902-3311', priority: 'NORMAL', notes: 'International wire request' },
    { name: 'Liam O’Connor', phone: '+1 (555) 238-7712', priority: 'NORMAL', notes: 'New deposit inquiry' },
    { name: 'Sophia Martinez', phone: '+1 (555) 671-8890', priority: 'PRIORITY', notes: 'Elderly assistance' },
  ];

  for (let i = 0; i < waitingPersonsGen.length; i++) {
    const p = waitingPersonsGen[i];
    const seq = 10 + i;
    await prisma.token.create({
      data: {
        tokenNumber: `GEN-0${seq}`,
        sequenceNum: seq,
        customerName: p.name,
        customerPhone: p.phone,
        priority: p.priority,
        notes: p.notes,
        status: 'WAITING',
        position: i + 1,
        createdAt: minsAgo(25 - i * 4),
        queueId: queue1.id,
      },
    });
  }

  // Completed tokens for realistic analytics
  const completedGen = [
    { name: 'James Wilson', waitMins: 14, servMins: 9, seq: 1 },
    { name: 'Maya Patel', waitMins: 11, servMins: 7, seq: 2 },
    { name: 'Lucas Scott', waitMins: 18, servMins: 12, seq: 3 },
    { name: 'Zoe Kravitz', waitMins: 8, servMins: 6, seq: 4 },
    { name: 'Robert Vance', waitMins: 15, servMins: 10, seq: 5 },
  ];

  for (const c of completedGen) {
    const created = minsAgo(180 - c.seq * 20);
    const served = new Date(created.getTime() + c.waitMins * 60 * 1000);
    const completed = new Date(served.getTime() + c.servMins * 60 * 1000);

    await prisma.token.create({
      data: {
        tokenNumber: `GEN-00${c.seq}`,
        sequenceNum: c.seq,
        customerName: c.name,
        priority: 'NORMAL',
        status: 'COMPLETED',
        counterName: 'Counter 1',
        createdAt: created,
        servedAt: served,
        completedAt: completed,
        queueId: queue1.id,
      },
    });
  }

  // Cancelled token
  await prisma.token.create({
    data: {
      tokenNumber: 'GEN-006',
      sequenceNum: 6,
      customerName: 'Thomas Anderson',
      priority: 'NORMAL',
      status: 'CANCELLED',
      cancellationReason: 'Customer left premises before turn',
      createdAt: minsAgo(90),
      cancelledAt: minsAgo(70),
      queueId: queue1.id,
    },
  });

  // 4. Seed VIP Queue
  await prisma.token.create({
    data: {
      tokenNumber: 'VIP-004',
      sequenceNum: 4,
      customerName: 'Victoria Sterling',
      customerPhone: '+1 (555) 999-0001',
      priority: 'VIP',
      status: 'IN_SERVICE',
      counterName: 'VIP Lounge Counter',
      position: null,
      createdAt: minsAgo(12),
      servedAt: minsAgo(3),
      queueId: queue2.id,
    },
  });

  await prisma.token.create({
    data: {
      tokenNumber: 'VIP-005',
      sequenceNum: 5,
      customerName: 'Arthur Pendelton',
      customerPhone: '+1 (555) 999-0002',
      priority: 'VIP',
      notes: 'Wealth portfolio consult',
      status: 'WAITING',
      position: 1,
      createdAt: minsAgo(8),
      queueId: queue2.id,
    },
  });

  await prisma.token.create({
    data: {
      tokenNumber: 'VIP-006',
      sequenceNum: 6,
      customerName: 'Eleanor Vance',
      customerPhone: '+1 (555) 999-0003',
      priority: 'VIP',
      status: 'WAITING',
      position: 2,
      createdAt: minsAgo(2),
      queueId: queue2.id,
    },
  });

  console.log('✅ FlowQueue database seeded successfully with queues, waiting lines, and historical analytics!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
