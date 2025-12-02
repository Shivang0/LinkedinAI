import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@linkedin-ai/database';

// GET /api/user/billing - Get billing data
export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [subscription, invoices] = await Promise.all([
    prisma.subscription.findUnique({
      where: { userId: session.userId },
      select: {
        plan: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
      },
    }),
    prisma.invoice.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        paidAt: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    subscription,
    invoices,
  });
}
