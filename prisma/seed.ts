import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const demoEmail = 'demo@performanceos.ai';

  const existingUser = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  if (existingUser) {
    console.log('Seed data already exists, skipping.');
    return;
  }

  const user = await prisma.user.create({
    data: {
      email: demoEmail,
      name: 'Demo User',
      emailVerified: new Date(),
    },
  });

  const org = await prisma.organization.create({
    data: {
      name: 'Acme Marketing',
      slug: 'acme-marketing',
      timezone: 'America/New_York',
      currency: 'USD',
    },
  });

  await prisma.organizationMember.create({
    data: {
      organizationId: org.id,
      userId: user.id,
      role: UserRole.OWNER,
      joinedAt: new Date(),
    },
  });

  await prisma.subscription.create({
    data: {
      organizationId: org.id,
      plan: 'PROFESSIONAL',
      status: 'TRIALING',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.team.create({
    data: {
      organizationId: org.id,
      name: 'Growth Team',
      description: 'Primary marketing team',
      members: {
        create: { userId: user.id },
      },
    },
  });

  console.log('Seed completed:', { userId: user.id, orgId: org.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
