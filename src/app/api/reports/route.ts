import { NextRequest, NextResponse } from 'next/server';
import { getBusinessFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const business = await getBusinessFromRequest();
    if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date();
    const bizId = business.id;

    // Pre-compute month boundaries for last 6 months
    const months: { month: string; start: Date; end: Date }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      months.push({ month: m, start: monthStart, end: monthEnd });
    }

    const monthStart = months[5].start;

    // === BATCH ALL QUERIES IN PARALLEL ===
    const [
      revenueByMonthData,
      customerGrowthData,
      connectionsByType,
      connectionsByStatus,
      paymentMethods,
      expenseCategories,
      topCustomersRaw,
      overdueInvoices,
      unpaidInvoices,
      overdueAmount,
      unpaidAmount,
      expiringConnections,
      collectorPerf,
      expensesByMonth,
      collectionsByMonth,
      dailyPaymentsThisMonth,
    ] = await Promise.all([
      // Revenue by month: batch 6 invoice sum queries in parallel
      Promise.all(months.map(m =>
        db.invoice.aggregate({ _sum: { amount: true }, where: { businessId: bizId, month: m.month } })
      )),
      // Customer growth: batch 6 count queries in parallel
      Promise.all(months.map(m =>
        db.customer.count({ where: { businessId: bizId, createdAt: { lte: m.end } } })
      )),
      db.connection.groupBy({ by: ['packageType'], where: { businessId: bizId }, _count: { id: true }, _sum: { monthlyFee: true } }),
      db.connection.groupBy({ by: ['status'], where: { businessId: bizId }, _count: { id: true } }),
      db.payment.groupBy({ by: ['method'], where: { businessId: bizId }, _count: { id: true }, _sum: { amount: true } }),
      db.expense.groupBy({ by: ['category'], where: { businessId: bizId, date: { gte: monthStart } }, _sum: { amount: true }, _count: { id: true } }),
      db.payment.groupBy({ by: ['customerId'], where: { businessId: bizId, createdAt: { gte: monthStart } }, _sum: { amount: true }, orderBy: { _sum: { amount: 'desc' } }, take: 10 }),
      db.invoice.count({ where: { businessId: bizId, status: 'overdue' } }),
      db.invoice.count({ where: { businessId: bizId, status: 'unpaid' } }),
      db.invoice.aggregate({ _sum: { amount: true }, where: { businessId: bizId, status: 'overdue' } }),
      db.invoice.aggregate({ _sum: { amount: true }, where: { businessId: bizId, status: 'unpaid' } }),
      db.connection.count({ where: { businessId: bizId, status: 'active', expiresAt: { lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), gte: now } } }),
      db.payment.groupBy({ by: ['collectedBy'], where: { businessId: bizId, createdAt: { gte: monthStart }, collectedBy: { not: null } }, _count: { id: true }, _sum: { amount: true } }),
      Promise.all(months.map(m =>
        db.expense.aggregate({ _sum: { amount: true }, where: { businessId: bizId, date: { gte: m.start, lte: m.end } } })
      )),
      Promise.all(months.map(m =>
        db.payment.aggregate({ _sum: { amount: true }, where: { businessId: bizId, createdAt: { gte: m.start, lte: m.end } } })
      )),
      // Daily collections: fetch all this month's payments with just amount + date
      db.payment.findMany({
        where: { businessId: bizId, createdAt: { gte: monthStart } },
        select: { amount: true, createdAt: true },
      }),
    ]);

    // Build revenueByMonth
    const revenueByMonth = months.map((m, i) => ({
      month: m.month,
      revenue: revenueByMonthData[i]._sum.amount || 0,
      expenses: expensesByMonth[i]._sum.amount || 0,
      profit: (revenueByMonthData[i]._sum.amount || 0) - (expensesByMonth[i]._sum.amount || 0),
      collections: collectionsByMonth[i]._sum.amount || 0,
    }));

    const customerGrowth = months.map((m, i) => ({ month: m.month, count: customerGrowthData[i] }));

    // Top customers with names
    const topCustomerNames = await Promise.all(
      topCustomersRaw.map(tc => db.customer.findUnique({ where: { id: tc.customerId }, select: { name: true, phone: true } }))
    );
    const topCustomers = topCustomersRaw.map((tc, i) => ({
      name: topCustomerNames[i]?.name || 'Unknown',
      phone: topCustomerNames[i]?.phone || '',
      amount: tc._sum.amount || 0,
    }));

    // Daily collections: aggregate in-memory from fetched payments
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyAmounts = new Map<number, number>();
    for (const p of dailyPaymentsThisMonth) {
      const day = p.createdAt.getDate();
      dailyAmounts.set(day, (dailyAmounts.get(day) || 0) + p.amount);
    }
    const dailyCollections: { date: string; amount: number }[] = [];
    for (let d = 1; d <= Math.min(daysInMonth, now.getDate()); d++) {
      dailyCollections.push({ date: `${d}`, amount: dailyAmounts.get(d) || 0 });
    }

    return NextResponse.json({
      revenueByMonth,
      customerGrowth,
      connectionsByType: connectionsByType.map(c => ({ type: c.packageType, count: c._count.id, revenue: c._sum.monthlyFee || 0 })),
      connectionsByStatus: connectionsByStatus.map(c => ({ status: c.status, count: c._count.id })),
      paymentMethods: paymentMethods.filter(p => p.method).map(p => ({ method: p.method!, count: p._count.id, amount: p._sum.amount || 0 })),
      expenseCategories: expenseCategories.map(e => ({ category: e.category, amount: e._sum.amount || 0, count: e._count.id })),
      topCustomers,
      overdueInvoices,
      unpaidInvoices,
      overdueAmount: overdueAmount._sum.amount || 0,
      unpaidAmount: unpaidAmount._sum.amount || 0,
      expiringConnections,
      collectorPerf: collectorPerf.map(c => ({ collector: c.collectedBy || 'Unknown', count: c._count.id, amount: c._sum.amount || 0 })),
      dailyCollections,
    });
  } catch (error) {
    console.error('Reports GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
