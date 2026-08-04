import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getBusinessFromRequest } from '@/lib/auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const business = await getBusinessFromRequest();
    if (!business) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { vendorId, employeeId, category, amount, description, date } = body;

    const existing = await db.expense.findFirst({
      where: { id, businessId: business.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Verify vendor belongs to this business if provided
    if (vendorId !== undefined && vendorId !== null) {
      const vendor = await db.vendor.findFirst({
        where: { id: vendorId, businessId: business.id },
      });
      if (!vendor) {
        return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
      }
    }

    // Verify employee belongs to this business if provided
    if (employeeId !== undefined && employeeId !== null) {
      const employee = await db.employee.findFirst({
        where: { id: employeeId, businessId: business.id },
      });
      if (!employee) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      }
    }

    const expense = await db.expense.update({
      where: { id },
      data: {
        ...(vendorId !== undefined && { vendorId: vendorId || null }),
        ...(employeeId !== undefined && { employeeId: employeeId || null }),
        ...(category !== undefined && { category }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(description !== undefined && { description: description || null }),
        ...(date !== undefined && { date: date ? new Date(date) : new Date() }),
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

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Expense PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const business = await getBusinessFromRequest();
    if (!business) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const existing = await db.expense.findFirst({
      where: { id, businessId: business.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    await db.expense.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Expense DELETE error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
