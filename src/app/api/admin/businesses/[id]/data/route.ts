import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getBusinessFromRequest } from '@/lib/auth';

// GET /api/admin/businesses/[id]/data — full business data for admin
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getBusinessFromRequest();
    if (!admin || !admin.isPlatformAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await params;

    const business = await db.business.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, phone: true, address: true, plan: true, trialEndsAt: true, isActive: true, isPlatformAdmin: true, createdAt: true, updatedAt: true },
    });
    if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 23, 59, 59, 999);

    const [
      customers,
      connections,
      invoices,
      payments,
      expenses,
      employees,
      vendors,
      notifications,
      stats,
    ] = await Promise.all([
      db.customer.findMany({ where: { businessId: id }, orderBy: { createdAt: 'desc' }, take: 100 }),
      db.connection.findMany({
        where: { businessId: id },
        include: { customer: { select: { id: true, name: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      db.invoice.findMany({
        where: { businessId: id },
        include: { connection: { select: { id: true, packageType: true, packageName: true, customer: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      db.payment.findMany({
        where: { businessId: id },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          connection: { select: { id: true, packageType: true, packageName: true } },
          invoice: { select: { id: true, month: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      db.expense.findMany({
        where: { businessId: id },
        include: {
          vendor: { select: { id: true, name: true } },
          employee: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      db.employee.findMany({ where: { businessId: id }, orderBy: { createdAt: 'desc' } }),
      db.vendor.findMany({ where: { businessId: id }, orderBy: { createdAt: 'desc' } }),
      db.notification.findMany({ where: { businessId: id }, orderBy: { createdAt: 'desc' }, take: 50 }),
      Promise.all([
        db.customer.count({ where: { businessId: id } }),
        db.connection.count({ where: { businessId: id, status: 'active' } }),
        db.connection.aggregate({ where: { businessId: id, status: 'active' }, _sum: { monthlyFee: true } }),
        db.payment.aggregate({ where: { businessId: id, createdAt: { gte: monthStart, lte: monthEnd } }, _sum: { amount: true } }),
        db.expense.aggregate({ where: { businessId: id, date: { gte: monthStart, lte: monthEnd } }, _sum: { amount: true } }),
        db.invoice.count({ where: { businessId: id, status: 'unpaid' } }),
      ]).then(([c, ac, mr, pc, ex, oi]) => ({
        totalCustomers: c,
        activeConnections: ac,
        monthlyRevenue: mr._sum.monthlyFee || 0,
        collectedThisMonth: pc._sum.amount || 0,
        expensesThisMonth: ex._sum.amount || 0,
        unpaidInvoices: oi,
      })),
    ]);

    return NextResponse.json({
      business,
      customers,
      connections,
      invoices,
      payments,
      expenses,
      employees,
      vendors,
      notifications,
      stats,
    });
  } catch (error) {
    console.error('Admin business data error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
