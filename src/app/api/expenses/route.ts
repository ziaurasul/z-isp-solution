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
    const category = searchParams.get('category') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { businessId: business.id };

    if (category) {
      where.category = category;
    }

    if (startDate || endDate) {
      where.date = {} as Record<string, Date>;
      if (startDate) {
        (where.date as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.date as Record<string, Date>).lte = new Date(endDate);
      }
    }

    const [data, total] = await Promise.all([
      db.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          vendor: {
            select: { id: true, name: true },
          },
          employee: {
            select: { id: true, name: true },
          },
        },
      }),
      db.expense.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error('Expenses GET error:', error);
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
    const { vendorId, employeeId, category, amount, description, date } = body;

    if (!category || amount === undefined) {
      return NextResponse.json(
        { error: 'category and amount are required' },
        { status: 400 }
      );
    }

    // Verify vendor belongs to this business if provided
    if (vendorId) {
      const vendor = await db.vendor.findFirst({
        where: { id: vendorId, businessId: business.id },
      });
      if (!vendor) {
        return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
      }
    }

    // Verify employee belongs to this business if provided
    if (employeeId) {
      const employee = await db.employee.findFirst({
        where: { id: employeeId, businessId: business.id },
      });
      if (!employee) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      }
    }

    const expense = await db.expense.create({
      data: {
        businessId: business.id,
        vendorId: vendorId || null,
        employeeId: employeeId || null,
        category,
        amount: parseFloat(amount),
        description: description || null,
        date: date ? new Date(date) : new Date(),
      },
      include: {
        vendor: {
          select: { id: true, name: true },
        },
        employee: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Expenses POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
