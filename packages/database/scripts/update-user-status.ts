import { prisma } from '../src/client';

async function updateUserStatus() {
  // Find all users
  const users = await prisma.user.findMany();

  console.log('Found users:', users.length);

  for (const user of users) {
    console.log(`User: ${user.email}, Status: ${user.accountStatus}`);

    // Update to active
    await prisma.user.update({
      where: { id: user.id },
      data: { accountStatus: 'active' }
    });
    console.log(`Updated ${user.email} to active`);
  }

  console.log('Done!');
}

updateUserStatus()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
