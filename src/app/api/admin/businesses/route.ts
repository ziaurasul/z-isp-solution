import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getBusinessFromRequest } from '@/lib/auth';

// GET /api/admin/businesses — list all businesses (admin only)
export async function GET(request: NextRequest) {
  try {
    const admin = await getBusinessFromRequest();
    if (!admin || !admin.isPlatformAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    const where: any = { NOT: { isPlatformAdmin: true } };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [businesses, total] = await Promise.all([
      db.business.findMany({
        where,
        select: {
          id: true, name: true, email: true, phone: true, plan: true,
          trialEndsAt: true, isActive: true, isPlatformAdmin: true,
          createdAt: true,
          _count: { select: { customers: true, connections: true, payments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      db.business.count({ where }),
    ]);

    // Get platform-wide stats
    const [totalCustomers, totalConnections, totalRevenue, totalPayments] = await Promise.all([
      db.customer.count(),
      db.connection.count({ where: { status: 'active' } }),
      db.connection.aggregate({ where: { status: 'active' }, _sum: { monthlyFee: true } }),
      db.payment.aggregate({ _sum: { amount: true } }),
    ]);

    return NextResponse.json({
      data: businesses, total, page, limit,
      stats: {
        totalBusinesses: total,
        totalCustomers,
        totalActiveConnections: totalConnections,
        totalMonthlyRevenue: totalRevenue._sum.monthlyFee || 0,
        totalPaymentsCollected: totalPayments._sum.amount || 0,
      },
    });
  } catch (error) {
    console.error('Admin businesses list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
