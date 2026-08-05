import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getBusinessFromRequest } from '@/lib/auth';

export async function GET() {
  try {
    const business = await getBusinessFromRequest();
    if (!business) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const businessId = business.id;

    // Current month boundaries
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 23, 59, 59, 999);

    // 7 days from now for expiring connections
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    // Pre-compute 6 month boundaries
    const monthBounds: { month: string; start: Date; end: Date }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthBounds.push({
        month: m,
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
      });
    }

    // Batch ALL queries in parallel (was: sequential loop for 6 months)
    const [
      totalCustomers,
      activeConnections,
      totalMonthlyRevenueResult,
      totalExpensesThisMonthResult,
      totalCollectedThisMonthResult,
      expiringConnectionsCount,
      overdueInvoicesCount,
      recentPayments,
      connectionsByType,
      monthlyRevenueData,
      monthlyExpensesData,
    ] = await Promise.all([
      db.customer.count({ where: { businessId } }),
      db.connection.count({ where: { businessId, status: 'active' } }),
      db.connection.aggregate({ where: { businessId, status: 'active' }, _sum: { monthlyFee: true } }),
      db.expense.aggregate({ where: { businessId, date: { gte: monthStart, lte: monthEnd } }, _sum: { amount: true } }),
      db.payment.aggregate({ where: { businessId, createdAt: { gte: monthStart, lte: monthEnd } }, _sum: { amount: true } }),
      db.connection.count({ where: { businessId, status: 'active', expiresAt: { lte: sevenDaysLater, gte: now } } }),
      db.invoice.count({ where: { businessId, status: { in: ['unpaid', 'partial'] }, dueDate: { lt: now } } }),
      db.payment.findMany({
        where: { businessId }, take: 10, orderBy: { createdAt: 'desc' },
        include: { customer: { select: { id: true, name: true, phone: true } }, connection: { select: { id: true, packageType: true, packageName: true } } },
      }),
      db.connection.groupBy({ by: ['packageType'], where: { businessId, status: 'active' }, _count: { id: true } }),
      // Batch all 6 month revenue queries in parallel instead of sequential loop
      Promise.all(monthBounds.map(m =>
        db.payment.aggregate({ where: { businessId, createdAt: { gte: m.start, lte: m.end } }, _sum: { amount: true } })
      )),
      // Batch all 6 month expense queries in parallel
      Promise.all(monthBounds.map(m =>
        db.expense.aggregate({ where: { businessId, date: { gte: m.start, lte: m.end } }, _sum: { amount: true } })
      )),
    ]);

    // Build monthly revenue data from batched results
    const monthlyRevenueData2 = monthBounds.map((m, i) => ({
      month: m.month,
      revenue: monthlyRevenueData[i]._sum.amount || 0,
      expenses: monthlyExpensesData[i]._sum.amount || 0,
    }));

    // Build connections by type
    const connByType: Record<string, number> = { internet: 0, cable: 0, iptv: 0 };
    for (const item of connectionsByType) {
      connByType[item.packageType] = item._count.id;
    }

    return NextResponse.json({
      totalCustomers,
      activeConnections,
      totalMonthlyRevenue: totalMonthlyRevenueResult._sum.monthlyFee || 0,
      totalExpensesThisMonth: totalExpensesThisMonthResult._sum.amount || 0,
      totalCollectedThisMonth: totalCollectedThisMonthResult._sum.amount || 0,
      expiringConnectionsCount,
      overdueInvoicesCount,
      recentPayments,
      monthlyRevenueData: monthlyRevenueData2,
      connectionsByType: connByType,
    });
  } catch (error) {
    console.error('Dashboard GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
