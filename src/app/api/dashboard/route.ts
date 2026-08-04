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
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 23, 59, 59, 999);

    // 7 days from now for expiring connections
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    // Run all independent queries in parallel
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
    ] = await Promise.all([
      // 1. Total customers
      db.customer.count({
        where: { businessId },
      }),

      // 2. Active connections
      db.connection.count({
        where: { businessId, status: 'active' },
      }),

      // 3. Total monthly revenue (sum of active connection fees)
      db.connection.aggregate({
        where: { businessId, status: 'active' },
        _sum: { monthlyFee: true },
      }),

      // 4. Total expenses this month
      db.expense.aggregate({
        where: {
          businessId,
          date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),

      // 5. Total collected this month
      db.payment.aggregate({
        where: {
          businessId,
          createdAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),

      // 6. Expiring connections (within 7 days)
      db.connection.count({
        where: {
          businessId,
          status: 'active',
          expiresAt: { lte: sevenDaysLater, gte: now },
        },
      }),

      // 7. Overdue invoices count
      db.invoice.count({
        where: {
          businessId,
          status: { in: ['unpaid', 'partial'] },
          dueDate: { lt: now },
        },
      }),

      // 8. Recent payments (last 10)
      db.payment.findMany({
        where: { businessId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, phone: true },
          },
          connection: {
            select: { id: true, packageType: true, packageName: true },
          },
        },
      }),

      // 9. Connections by type
      db.connection.groupBy({
        by: ['packageType'],
        where: { businessId, status: 'active' },
        _count: { id: true },
      }),

      // 10. Monthly revenue data (last 6 months)
      getLast6MonthsData(businessId),
    ]);

    // Build connections by type object
    const connByType: Record<string, number> = {
      internet: 0,
      cable: 0,
      iptv: 0,
    };
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
      monthlyRevenueData,
      connectionsByType: connByType,
    });
  } catch (error) {
    console.error('Dashboard GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Gets revenue and expense data for the last 6 months for chart display.
 */
async function getLast6MonthsData(businessId: string) {
  const now = new Date();
  const months: { month: string; revenue: number; expenses: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 23, 59, 59, 999);

    const [revenueResult, expenseResult] = await Promise.all([
      db.payment.aggregate({
        where: {
          businessId,
          createdAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),
      db.expense.aggregate({
        where: {
          businessId,
          date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),
    ]);

    months.push({
      month: monthStr,
      revenue: revenueResult._sum.amount || 0,
      expenses: expenseResult._sum.amount || 0,
    });
  }

  return months;
}
