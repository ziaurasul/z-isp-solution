import { NextRequest, NextResponse } from 'next/server';
import { getBusinessFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { ensureTables } from '@/lib/db';

export async function GET(req: NextRequest) {
  await ensureTables();
  const business = await getBusinessFromRequest();
  if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // === Revenue & Expense Trends (last 6 months) ===
  const monthLabels: string[] = [];
  const revenueByMonth: { month: string; revenue: number; expenses: number; profit: number; collections: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthLabels.push(m);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

    const [rev, exp, col] = await Promise.all([
      db.invoice.aggregate({ _sum: { amount: true }, where: { businessId: business.id, month: m } }),
      db.expense.aggregate({ _sum: { amount: true }, where: { businessId: business.id, date: { gte: monthStart, lte: monthEnd } } }),
      db.payment.aggregate({ _sum: { amount: true }, where: { businessId: business.id, createdAt: { gte: monthStart, lte: monthEnd } } }),
    ]);

    revenueByMonth.push({
      month: m,
      revenue: rev._sum.amount || 0,
      expenses: exp._sum.amount || 0,
      profit: (rev._sum.amount || 0) - (exp._sum.amount || 0),
      collections: col._sum.amount || 0,
    });
  }

  // === Customer Growth (last 6 months) ===
  const customerGrowth: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const count = await db.customer.count({ where: { businessId: business.id, createdAt: { lte: endOfMonth } } });
    customerGrowth.push({ month: m, count });
  }

  // === Connections by Type ===
  const connectionsByType = await db.connection.groupBy({
    by: ['packageType'],
    where: { businessId: business.id },
    _count: { id: true },
    _sum: { monthlyFee: true },
  });

  // === Connections by Status ===
  const connectionsByStatus = await db.connection.groupBy({
    by: ['status'],
    where: { businessId: business.id },
    _count: { id: true },
  });

  // === Payment Methods Distribution ===
  const paymentMethods = await db.payment.groupBy({
    by: ['method'],
    where: { businessId: business.id },
    _count: { id: true },
    _sum: { amount: true },
  });

  // === Expense Categories This Month ===
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const expenseCategories = await db.expense.groupBy({
    by: ['category'],
    where: { businessId: business.id, date: { gte: monthStart } },
    _sum: { amount: true },
    _count: { id: true },
  });

  // === Top Customers by Payment (this month) ===
  const topCustomers = await db.payment.groupBy({
    by: ['customerId'],
    where: { businessId: business.id, createdAt: { gte: monthStart } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
    take: 10,
  });
  const topCustomersWithNames = await Promise.all(
    topCustomers.map(async (tc) => {
      const c = await db.customer.findUnique({ where: { id: tc.customerId }, select: { name: true, phone: true } });
      return { name: c?.name || 'Unknown', phone: c?.phone || '', amount: tc._sum.amount || 0 };
    })
  );

  // === Overdue Invoices ===
  const overdueInvoices = await db.invoice.count({
    where: { businessId: business.id, status: 'overdue' },
  });
  const unpaidInvoices = await db.invoice.count({
    where: { businessId: business.id, status: 'unpaid' },
  });
  const overdueAmount = await db.invoice.aggregate({
    _sum: { amount: true },
    where: { businessId: business.id, status: 'overdue' },
  });
  const unpaidAmount = await db.invoice.aggregate({
    _sum: { amount: true },
    where: { businessId: business.id, status: 'unpaid' },
  });

  // === Expiring Connections (next 30 days) ===
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringConnections = await db.connection.count({
    where: { businessId: business.id, status: 'active', expiresAt: { lte: thirtyDays, gte: now } },
  });

  // === Collector Performance (this month) ===
  const collectorPerf = await db.payment.groupBy({
    by: ['collectedBy'],
    where: { businessId: business.id, createdAt: { gte: monthStart }, collectedBy: { not: null } },
    _count: { id: true },
    _sum: { amount: true },
  });

  // === Daily collections this month ===
  const dailyCollections: { date: string; amount: number }[] = [];
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  for (let d = 1; d <= Math.min(daysInMonth, now.getDate()); d++) {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), d, 0, 0, 0);
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), d, 23, 59, 59);
    const total = await db.payment.aggregate({
      _sum: { amount: true },
      where: { businessId: business.id, createdAt: { gte: dayStart, lte: dayEnd } },
    });
    dailyCollections.push({ date: `${d}`, amount: total._sum.amount || 0 });
  }

  return NextResponse.json({
    revenueByMonth,
    customerGrowth,
    connectionsByType: connectionsByType.map(c => ({ type: c.packageType, count: c._count.id, revenue: c._sum.monthlyFee || 0 })),
    connectionsByStatus: connectionsByStatus.map(c => ({ status: c.status, count: c._count.id })),
    paymentMethods: paymentMethods.filter(p => p.method).map(p => ({ method: p.method!, count: p._count.id, amount: p._sum.amount || 0 })),
    expenseCategories: expenseCategories.map(e => ({ category: e.category, amount: e._sum.amount || 0, count: e._count.id })),
    topCustomers: topCustomersWithNames,
    overdueInvoices,
    unpaidInvoices,
    overdueAmount: overdueAmount._sum.amount || 0,
    unpaidAmount: unpaidAmount._sum.amount || 0,
    expiringConnections,
    collectorPerf: collectorPerf.map(c => ({ collector: c.collectedBy || 'Unknown', count: c._count.id, amount: c._sum.amount || 0 })),
    dailyCollections,
  });
}
