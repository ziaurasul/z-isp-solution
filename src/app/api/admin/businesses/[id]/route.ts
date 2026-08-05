import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getBusinessFromRequest } from '@/lib/auth';

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
      select: {
        id: true, name: true, email: true, phone: true, address: true,
        plan: true, trialEndsAt: true, isActive: true, isPlatformAdmin: true,
        createdAt: true,
        _count: { select: { customers: true, connections: true, invoices: true, payments: true, expenses: true, employees: true, vendors: true } },
      },
    });
    if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(business);
  } catch (error) {
    console.error('Admin business detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getBusinessFromRequest();
    if (!admin || !admin.isPlatformAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await params;
    const body = await request.json();
    const { plan, isActive, trialEndsAt } = body;
    const updateData: any = {};
    if (plan !== undefined) updateData.plan = plan;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (trialEndsAt !== undefined) updateData.trialEndsAt = trialEndsAt ? new Date(trialEndsAt) : null;
    const business = await db.business.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json({ id: business.id, name: business.name, plan: business.plan, isActive: business.isActive, trialEndsAt: business.trialEndsAt });
  } catch (error) {
    console.error('Admin business update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getBusinessFromRequest();
    if (!admin || !admin.isPlatformAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await params;
    await db.payment.deleteMany({ where: { businessId: id } });
    await db.invoice.deleteMany({ where: { businessId: id } });
    await db.expense.deleteMany({ where: { businessId: id } });
    await db.connection.deleteMany({ where: { businessId: id } });
    await db.notification.deleteMany({ where: { businessId: id } });
    await db.customer.deleteMany({ where: { businessId: id } });
    await db.vendor.deleteMany({ where: { businessId: id } });
    await db.employee.deleteMany({ where: { businessId: id } });
    await db.business.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin business delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
