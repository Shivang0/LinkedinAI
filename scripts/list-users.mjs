import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, accountStatus: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log('\n=== Recent Users ===\n');
  users.forEach((u, i) => {
    console.log(`${i + 1}. ${u.name}`);
    console.log(`   Email: ${u.email}`);
    console.log(`   Status: ${u.accountStatus}`);
    console.log(`   ID: ${u.id}`);
    console.log('');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
