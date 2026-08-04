import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getBusinessFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const business = await getBusinessFromRequest();
    if (!business) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const packageType = searchParams.get('packageType') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { businessId: business.id };

    if (status) {
      where.status = status;
    }

    if (packageType) {
      where.packageType = packageType;
    }

    if (search) {
      where.OR = [
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search } } },
        { packageName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      db.connection.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, phone: true },
          },
        },
      }),
      db.connection.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error('Connections GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const business = await getBusinessFromRequest();
    if (!business) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { customerId, packageType, packageName, speed, monthlyFee, expiresAt, status } = body;

    if (!customerId || !packageType || monthlyFee === undefined) {
      return NextResponse.json(
        { error: 'customerId, packageType, and monthlyFee are required' },
        { status: 400 }
      );
    }

    // Verify customer belongs to this business
    const customer = await db.customer.findFirst({
      where: { id: customerId, businessId: business.id },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const connection = await db.connection.create({
      data: {
        businessId: business.id,
        customerId,
        packageType,
        packageName: packageName || null,
        speed: speed || null,
        monthlyFee: parseFloat(monthlyFee),
        status: status || 'active',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    return NextResponse.json(connection, { status: 201 });
  } catch (error) {
    console.error('Connections POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
